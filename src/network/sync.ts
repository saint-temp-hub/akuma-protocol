import type { GameState, ChatMessage, InterceptionNotification } from '../game/types.ts';

export type NetworkMessage =
  | { type: 'STATE_UPDATE'; room: string; senderId: string; state: GameState; timestamp: number }
  | { type: 'CHAT_MESSAGE'; room: string; senderId: string; message: ChatMessage }
  | { type: 'INTERCEPTION_ALERT'; room: string; senderId: string; targetPlayerId: string; alert: InterceptionNotification }
  | { type: 'REQUEST_SYNC'; room: string; senderId: string };

export interface SessionData {
  roomId: string;
  playerId: string;
  playerName: string;
}

const SESSION_STORAGE_KEY = 'acma_current_session';
const PIESOCKET_URL =
  'wss://api.piesocket.com/v3/demo?api_key=VCXCEuvYube6tgDo148wZ2Pp39369A8sESmYswPM';

export class NetworkManager {
  private ws: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private roomId: string = '';
  private playerId: string = '';
  private onStateUpdateCb: ((state: GameState) => void) | null = null;
  private onChatUpdateCb: ((msg: ChatMessage) => void) | null = null;
  private onInterceptionCb: ((alert: InterceptionNotification) => void) | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: any = null;

  constructor() {}

  public init(
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

    this.connectWebSocket();
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      this.ws = new WebSocket(PIESOCKET_URL);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Broadcast a sync request so if another device is host, they can send current state
        this.send({
          type: 'REQUEST_SYNC',
          room: this.roomId,
          senderId: this.playerId,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (e) {
          // ignore non-json
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error, falling back to local mesh:', err);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Schedule auto-reconnect
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connectWebSocket();
        }, 3000);
      };
    } catch (e) {
      console.warn('Could not establish WebSocket connection:', e);
    }
  }

  private handleIncomingMessage(msg: any) {
    if (!msg || typeof msg !== 'object' || msg.room !== this.roomId) {
      return;
    }

    // Ignore messages echoed back from self
    if (msg.senderId === this.playerId && msg.type !== 'REQUEST_SYNC') {
      return;
    }

    switch (msg.type) {
      case 'STATE_UPDATE': {
        if (msg.state) {
          // Save locally
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
      case 'REQUEST_SYNC': {
        // If we have saved state and we are not the sender, send our state
        const savedState = this.loadRoomState(this.roomId);
        if (savedState) {
          this.broadcastState(savedState);
        }
        break;
      }
    }
  }

  public broadcastState(state: GameState) {
    this.saveRoomState(state);

    const message: NetworkMessage = {
      type: 'STATE_UPDATE',
      room: this.roomId,
      senderId: this.playerId,
      state,
      timestamp: Date.now(),
    };

    this.send(message);
  }

  public broadcastChat(message: ChatMessage) {
    const netMsg: NetworkMessage = {
      type: 'CHAT_MESSAGE',
      room: this.roomId,
      senderId: this.playerId,
      message,
    };
    this.send(netMsg);
  }

  public sendInterceptionAlert(targetPlayerId: string, alert: InterceptionNotification) {
    const netMsg: NetworkMessage = {
      type: 'INTERCEPTION_ALERT',
      room: this.roomId,
      senderId: this.playerId,
      targetPlayerId,
      alert,
    };
    this.send(netMsg);
  }

  private send(msg: any) {
    const payload = JSON.stringify(msg);

    // Send through WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(payload);
      } catch (e) {
        console.warn('WebSocket send failed:', e);
      }
    }

    // Also send through local BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.warn('BroadcastChannel send failed:', e);
      }
    }
  }

  // Persistent Central Room Storage in localStorage ('acma_room_' + state.room)
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
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}
