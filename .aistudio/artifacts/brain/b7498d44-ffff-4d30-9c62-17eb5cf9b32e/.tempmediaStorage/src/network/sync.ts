import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase.ts';
import type { GameState, ChatMessage, InterceptionNotification, Player, Team } from '../game/types.ts';

export interface SessionData {
  roomId: string;
  playerId: string;
  playerName: string;
}

const SESSION_STORAGE_KEY = 'acma_current_session';

export class NetworkManager {
  private roomId: string = '';
  private playerId: string = '';
  private onStateUpdateCb: ((state: GameState) => void) | null = null;
  private onChatUpdateCb: ((msg: ChatMessage) => void) | null = null;
  private onInterceptionCb: ((alert: InterceptionNotification) => void) | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private unsubscribeFirestore: Unsubscribe | null = null;
  private lastAppliedUpdatedAt: number = 0;
  private isIntentionalDisconnect: boolean = false;

  constructor() {}

  public async init(
    roomId: string,
    playerId: string,
    callbacks: {
      onStateUpdate: (state: GameState) => void;
      onChatUpdate: (msg: ChatMessage) => void;
      onInterception: (alert: InterceptionNotification) => void;
    }
  ) {
    this.roomId = roomId.toUpperCase().trim();
    this.playerId = playerId;
    this.onStateUpdateCb = callbacks.onStateUpdate;
    this.onChatUpdateCb = callbacks.onChatUpdate;
    this.onInterceptionCb = callbacks.onInterception;
    this.isIntentionalDisconnect = false;

    // Save session in local storage for disconnect re-entry
    this.saveSession({ roomId: this.roomId, playerId: this.playerId, playerName: '' });

    // BroadcastChannel for instant same-browser multi-tab sync
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`acma_room_${this.roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // Connect real-time Firestore listener across devices
    await this.subscribeToFirestore();
  }

  private async subscribeToFirestore() {
    try {
      await ensureAuth();
      if (this.isIntentionalDisconnect) return;

      const roomRef = doc(db, 'rooms', this.roomId);

      this.unsubscribeFirestore = onSnapshot(
        roomRef,
        (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();
          if (!data || !data.stateJson) return;

          try {
            const incomingState: GameState = JSON.parse(data.stateJson);
            if (incomingState && incomingState.updatedAt > this.lastAppliedUpdatedAt) {
              this.lastAppliedUpdatedAt = incomingState.updatedAt;
              this.saveRoomState(incomingState);
              if (this.onStateUpdateCb) {
                this.onStateUpdateCb(incomingState);
              }
            }
          } catch (e) {
            console.warn('Failed to parse incoming room state JSON:', e);
          }
        },
        (error) => {
          console.warn('Firestore snapshot error:', error);
        }
      );
    } catch (err) {
      console.warn('Could not establish Firestore subscription:', err);
    }
  }

  private handleIncomingMessage(msg: any) {
    if (!msg || typeof msg !== 'object' || msg.room !== this.roomId) {
      return;
    }

    if (msg.senderId === this.playerId && msg.type !== 'REQUEST_SYNC') {
      return;
    }

    switch (msg.type) {
      case 'STATE_UPDATE': {
        if (msg.state) {
          this.saveRoomState(msg.state);
          if (this.onStateUpdateCb) {
            this.onStateUpdateCb(msg.state);
          }
        }
        break;
      }
      case 'CHAT_MESSAGE': {
        if (msg.message && this.onChatUpdateCb) {
          this.onChatUpdateCb(msg.message);
        }
        break;
      }
      case 'INTERCEPTION_ALERT': {
        if (msg.targetPlayerId === this.playerId && msg.alert && this.onInterceptionCb) {
          this.onInterceptionCb(msg.alert);
        }
        break;
      }
    }
  }

  public async broadcastState(state: GameState) {
    this.saveRoomState(state);
    this.lastAppliedUpdatedAt = state.updatedAt;

    // 1. Broadcast locally via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'STATE_UPDATE',
          room: this.roomId,
          senderId: this.playerId,
          state,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Persist to real Cloud Firestore (broadcasts to all other devices)
    await this.saveRoomStateToServer(this.roomId, state, this.playerId);
  }

  public broadcastChat(message: ChatMessage) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CHAT_MESSAGE',
          room: this.roomId,
          senderId: this.playerId,
          message,
        });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  public sendInterceptionAlert(targetPlayerId: string, alert: InterceptionNotification) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'INTERCEPTION_ALERT',
          room: this.roomId,
          senderId: this.playerId,
          targetPlayerId,
          alert,
        });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  // --- FIRESTORE PERSISTENT ROOM METHODS ---

  public async createRoomOnServer(room: string, state: GameState): Promise<boolean> {
    const roomId = room.toUpperCase().trim();
    try {
      await ensureAuth();
      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, {
        roomCode: roomId,
        phase: state.phase,
        stateJson: JSON.stringify(state),
        updatedAt: state.updatedAt || Date.now(),
      });
      this.saveRoomState(state);
      return true;
    } catch (e) {
      console.warn('Failed to create room in Firestore:', e);
      this.saveRoomState(state);
      return false;
    }
  }

  public async fetchRoomStateFromServer(room: string): Promise<GameState | null> {
    const roomId = room.toUpperCase().trim();
    try {
      await ensureAuth();
      const roomRef = doc(db, 'rooms', roomId);
      const snapshot = await getDoc(roomRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.stateJson) {
          const parsed = JSON.parse(data.stateJson);
          this.saveRoomState(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch room from Firestore:', e);
    }
    return this.loadRoomState(roomId);
  }

  public async joinRoomOnServer(
    room: string,
    playerName: string,
    playerId: string
  ): Promise<{ success: boolean; state?: GameState; player?: Player; error?: string }> {
    const roomId = room.toUpperCase().trim();
    try {
      await ensureAuth();
      const roomRef = doc(db, 'rooms', roomId);
      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) {
        return { success: false, error: `Room "${roomId}" does not exist. Please check the code.` };
      }

      const data = snapshot.data();
      if (!data || !data.stateJson) {
        return { success: false, error: 'Invalid room data.' };
      }

      const state: GameState = JSON.parse(data.stateJson);

      // Check if player is already registered in this room (reconnection)
      const existing = state.players.find((p) => p.id === playerId);
      if (existing) {
        return { success: true, player: existing, state };
      }

      // Check seat availability
      const occupiedSlots = new Set(state.players.map((p) => p.slot));
      let availableSlot = -1;
      for (let s = 0; s < 4; s++) {
        if (!occupiedSlots.has(s)) {
          availableSlot = s;
          break;
        }
      }

      if (availableSlot === -1) {
        return { success: false, error: 'Room is full (4 players already in room).' };
      }

      const team: Team = availableSlot % 2 === 0 ? 'A' : 'B';
      const newPlayer: Player = {
        id: playerId,
        name: playerName.trim() || `Player ${state.players.length + 1}`,
        team,
        slot: availableSlot,
        rating: 100,
        roundPoints: 0,
        isHost: false,
        connected: true,
      };

      const updatedState: GameState = {
        ...state,
        players: [...state.players, newPlayer],
        updatedAt: Date.now(),
      };

      // Save updated state back to Firestore
      await setDoc(roomRef, {
        roomCode: roomId,
        phase: updatedState.phase,
        stateJson: JSON.stringify(updatedState),
        updatedAt: updatedState.updatedAt,
      });

      this.saveRoomState(updatedState);

      return {
        success: true,
        player: newPlayer,
        state: updatedState,
      };
    } catch (e: any) {
      console.warn('Error joining room in Firestore:', e);
      return { success: false, error: e?.message || 'Could not connect to multiplayer room.' };
    }
  }

  public async saveRoomStateToServer(room: string, state: GameState, _senderId?: string): Promise<boolean> {
    const roomId = room.toUpperCase().trim();
    try {
      await ensureAuth();
      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, {
        roomCode: roomId,
        phase: state.phase,
        stateJson: JSON.stringify(state),
        updatedAt: state.updatedAt || Date.now(),
      });
      return true;
    } catch (e) {
      console.warn('Failed to save state to Firestore:', e);
      return false;
    }
  }

  // Local Storage Fallbacks
  public saveRoomState(state: GameState) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`acma_room_${state.room}`, JSON.stringify(state));
      }
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }

  public loadRoomState(roomId: string): GameState | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(`acma_room_${roomId.toUpperCase().trim()}`);
        if (data) {
          return JSON.parse(data);
        }
      }
    } catch (e) {
      console.warn('localStorage load failed:', e);
    }
    return null;
  }

  public saveSession(session: SessionData) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    } catch (e) {
      console.warn('localStorage session save failed:', e);
    }
  }

  public static loadSession(): SessionData | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('localStorage session load failed:', e);
    }
    return null;
  }

  public static clearSession() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('localStorage clear failed:', e);
    }
  }

  public disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}
