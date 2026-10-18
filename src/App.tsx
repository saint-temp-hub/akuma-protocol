/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  GameState,
  GameMode,
  Player,
  Suit,
  Team,
  ChatMessage,
  InterceptionNotification,
} from './game/types.ts';
import { SUITS } from './game/types.ts';
import {
  createInitialState,
  startNewRound,
  revealCardsAction,
  guessSuitAction,
  equalizeAndRebalanceMatrix,
  executeOutlawAbility,
  executeMindControlForceDiscard,
  executeMindControlForceGuess,
} from './game/rules.ts';
import { NetworkManager } from './network/sync.ts';
import { LobbyView } from './components/LobbyView.tsx';
import { GameBoard } from './components/GameBoard.tsx';
import { RoundOverModal } from './components/RoundOverModal.tsx';
import { DarkTransmissionChat } from './components/DarkTransmissionChat.tsx';
import { InterceptionOverlay } from './components/InterceptionOverlay.tsx';
import { RulesGuideModal } from './components/RulesGuideModal.tsx';
import { ExitRoomModal } from './components/ExitRoomModal.tsx';
import { soundEffects } from './utils/soundEffects.ts';
import { testFirestoreConnection } from './network/firebase.ts';

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePlayerId(): string {
  return 'player_' + Math.random().toString(36).substring(2, 9);
}

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [roomInput, setRoomInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');

  // Local client-only views: Devil's Monocle is stored strictly per user ID
  const [devilsMonocleUserId, setDevilsMonocleUserId] = useState<string | null>(null);
  const [fatedGlimpseSuit, setFatedGlimpseSuit] = useState<string | null>(null);
  const [whisperedEliminationSuit, setWhisperedEliminationSuit] = useState<Suit | null>(null);
  const [interceptionAlert, setInterceptionAlert] = useState<InterceptionNotification | null>(null);
  const [isLandingRulesOpen, setIsLandingRulesOpen] = useState<boolean>(false);
  const [isHeaderExitModalOpen, setIsHeaderExitModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  // Track PWA installability
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const networkRef = useRef<NetworkManager | null>(null);

  // Initialize Network Manager
  const setupNetwork = useCallback(
    (room: string, playerId: string) => {
      if (networkRef.current) {
        networkRef.current.disconnect();
      }

      const net = new NetworkManager();
      net.init(room, playerId, {
        onStateUpdate: (incomingState) => {
          setGameState(incomingState);
        },
        onChatUpdate: (chatMsg) => {
          setGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              commsHistory: [...prev.commsHistory, chatMsg],
            };
          });
        },
        onInterception: (alert) => {
          setInterceptionAlert(alert);
        },
      });

      networkRef.current = net;
    },
    []
  );

  // Identity Re-Binding & Autostart on Mount
  useEffect(() => {
    testFirestoreConnection();

    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart');
    const roomParam = urlParams.get('room');

    if (autostart === '1') {
      const testRoom = roomParam || 'AUTO';
      const p1: Player = { id: 'pA1', name: 'Alpha Lead', team: 'A', slot: 0, rating: 100, roundPoints: 0, isHost: true };
      const p2: Player = { id: 'pB1', name: 'Beta Lead', team: 'B', slot: 1, rating: 95, roundPoints: 0 };
      const p3: Player = { id: 'pA2', name: 'Alpha Ghost', team: 'A', slot: 2, rating: 90, roundPoints: 0 };
      const p4: Player = { id: 'pB2', name: 'Beta Shade', team: 'B', slot: 3, rating: 85, roundPoints: 0 };

      const base = createInitialState(testRoom, p1);
      base.gameMode = 'AKUMA';
      base.players = [p1, p2, p3, p4];
      const started = startNewRound(base);

      setCurrentUserId('pA1');
      setCurrentUserName('Alpha Lead');
      setGameState(started);
      setupNetwork(testRoom, 'pA1');
      return;
    }

    // Check for saved session in localStorage
    const savedSession = NetworkManager.loadSession();
    if (savedSession && savedSession.roomId && savedSession.playerId) {
      const net = new NetworkManager();
      net.fetchRoomStateFromServer(savedSession.roomId).then((serverState) => {
        const stateToUse = serverState || net.loadRoomState(savedSession.roomId);
        if (stateToUse) {
          const matchingPlayer = stateToUse.players.find(
            (p) => p.id === savedSession.playerId
          );
          if (matchingPlayer) {
            setCurrentUserId(matchingPlayer.id);
            setCurrentUserName(matchingPlayer.name);
            setGameState(stateToUse);
            setupNetwork(savedSession.roomId, matchingPlayer.id);
          }
        }
      });
    }

    if (roomParam) {
      setRoomInput(roomParam.toUpperCase().trim());
    }
  }, [setupNetwork]);

  // Turn change side effects: Devil's Monocle and Whispered Elimination expire automatically
  useEffect(() => {
    setDevilsMonocleUserId(null);
    setWhisperedEliminationSuit(null);
  }, [gameState?.currentTurnIndex, gameState?.roundNumber]);

  // Broadcast state helper
  const updateAndBroadcastState = (newState: GameState) => {
    setGameState(newState);
    if (networkRef.current) {
      networkRef.current.broadcastState(newState);
    }
  };

  // Host: Create New Room
  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = nameInput.trim() || 'Player 1';
    const roomId = generateRoomId();
    const playerId = generatePlayerId();

    const hostPlayer: Player = {
      id: playerId,
      name,
      team: 'A',
      slot: 0,
      rating: 100,
      roundPoints: 0,
      isHost: true,
      connected: true,
    };

    const initial = createInitialState(roomId, hostPlayer);
    setCurrentUserId(playerId);
    setCurrentUserName(name);
    setGameState(initial);
    setupNetwork(roomId, playerId);

    // Save to central server so other devices can join
    const net = new NetworkManager();
    await net.createRoomOnServer(roomId, initial);
  };

  // Join Existing Room
  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const room = roomInput.trim().toUpperCase();
    if (!room) {
      alert('Please enter a 4-character Room Code.');
      return;
    }

    const name = nameInput.trim() || 'Player';
    const playerId = generatePlayerId();

    const net = new NetworkManager();

    // 1. First try server-authoritative join (essential for cross-device multiplayer)
    const serverJoin = await net.joinRoomOnServer(room, name, playerId);
    if (serverJoin.success && serverJoin.state && serverJoin.player) {
      setCurrentUserId(serverJoin.player.id);
      setCurrentUserName(serverJoin.player.name);
      setGameState(serverJoin.state);
      setupNetwork(room, serverJoin.player.id);
      return;
    }

    if (serverJoin.error && !serverJoin.error.includes('Could not connect')) {
      alert(serverJoin.error);
      return;
    }

    // 2. Local fallback if server is unreachable
    const existing = net.loadRoomState(room);
    if (existing) {
      const occupiedSlots = new Set(existing.players.map((p) => p.slot));
      let availableSlot = -1;
      for (let s = 0; s < 4; s++) {
        if (!occupiedSlots.has(s)) {
          availableSlot = s;
          break;
        }
      }

      if (availableSlot === -1) {
        alert('This room is full (4 players already in game).');
        return;
      }

      const team: Team = availableSlot % 2 === 0 ? 'A' : 'B';
      const newPlayer: Player = {
        id: playerId,
        name,
        team,
        slot: availableSlot,
        rating: 100,
        roundPoints: 0,
        isHost: false,
        connected: true,
      };

      const updatedState: GameState = {
        ...existing,
        players: [...existing.players, newPlayer],
        updatedAt: Date.now(),
      };

      setCurrentUserId(playerId);
      setCurrentUserName(name);
      setGameState(updatedState);
      setupNetwork(room, playerId);
      setTimeout(() => {
        networkRef.current?.broadcastState(updatedState);
      }, 300);
      return;
    }

    alert(`Room "${room}" was not found. Please verify the 4-letter room code with the host, or create a new room!`);
  };

  // Solo / Instant Demo Match (vs Bots) for rapid play & testing
  const handleInstantDemoMatch = () => {
    const room = 'DEMO';
    const playerId = 'player_lead';
    const name = nameInput.trim() || 'You';
    const players: Player[] = [
      {
        id: playerId,
        name: `${name}`,
        team: 'A',
        slot: 0,
        rating: 100,
        roundPoints: 0,
        isHost: true,
        connected: true,
      },
      {
        id: 'bot_beta_lead',
        name: 'Beta Lead',
        team: 'B',
        slot: 1,
        rating: 95,
        roundPoints: 0,
        isHost: false,
        connected: true,
      },
      {
        id: 'bot_alpha_ghost',
        name: 'Alpha Ghost',
        team: 'A',
        slot: 2,
        rating: 90,
        roundPoints: 0,
        isHost: false,
        connected: true,
      },
      {
        id: 'bot_beta_shade',
        name: 'Beta Shade',
        team: 'B',
        slot: 3,
        rating: 85,
        roundPoints: 0,
        isHost: false,
        connected: true,
      },
    ];

    const initial = createInitialState(room, players[0]);
    initial.players = players;
    initial.gameMode = 'AKUMA';
    const started = startNewRound(initial);
    setCurrentUserId(playerId);
    setCurrentUserName(name);
    setGameState(started);
    setupNetwork(room, playerId);
  };

  // Quick fill remaining slots with bots (Test Mode)
  const handleQuickFillBots = () => {
    if (!gameState) return;

    const botNames = ['Shadow', 'Viper', 'Blaze'];
    const currentOccupied = new Set(gameState.players.map((p) => p.slot));
    const newPlayers = [...gameState.players];

    let botIdx = 0;
    for (let slot = 0; slot < 4; slot++) {
      if (!currentOccupied.has(slot)) {
        const team: Team = slot % 2 === 0 ? 'A' : 'B';
        newPlayers.push({
          id: `bot_player_${slot}`,
          name: botNames[botIdx++] || `Player ${slot + 1}`,
          team,
          slot,
          rating: 90 - slot * 5,
          roundPoints: 0,
          isHost: false,
          connected: true,
        });
      }
    }

    const updated: GameState = {
      ...gameState,
      players: newPlayers,
      updatedAt: Date.now(),
    };

    updateAndBroadcastState(updated);
  };

  // Select slot in lobby
  const handleSelectSlot = (slot: number, team: Team) => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map((p) => {
      if (p.id === currentUserId) {
        return { ...p, slot, team };
      }
      return p;
    });

    updateAndBroadcastState({
      ...gameState,
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  };

  // Toggle mode: NORMAL vs AKUMA
  const handleToggleGameMode = (mode: GameMode) => {
    if (!gameState) return;
    updateAndBroadcastState({
      ...gameState,
      gameMode: mode,
      updatedAt: Date.now(),
    });
  };

  // Host starts the match
  const handleStartMatch = () => {
    if (!gameState) return;
    const started = startNewRound(gameState);
    updateAndBroadcastState(started);
  };

  // Action: Reveal cards
  const handleRevealSelected = (cardIndices: number[]) => {
    if (!gameState) return;
    const result = revealCardsAction(gameState, currentUserId, cardIndices);
    if (result.error) {
      alert(result.error);
      return;
    }
    setDevilsMonocleUserId(null);
    updateAndBroadcastState(result.state);
  };

  // Action: Guess Suit
  const handleGuessSuit = (suit: Suit) => {
    if (!gameState) return;
    const result = guessSuitAction(gameState, currentUserId, suit);
    if (result.error) {
      alert(result.error);
      return;
    }
    setDevilsMonocleUserId(null);
    if (result.isCorrect) {
      soundEffects.playVictoryFanfare();
    } else {
      soundEffects.playErrorBuzzer();
    }
    updateAndBroadcastState(result.state);
  };

  // Outlaw Law Execution
  const handleExecuteAbility = (abilityId: string) => {
    if (!gameState) return;

    soundEffects.playOutlawActivation();
    const result = executeOutlawAbility(gameState, currentUserId, abilityId);
    if (result.error) {
      alert(result.error);
      return;
    }

    // Client-side exclusive mutations:
    if (abilityId === 'DEVILS_MONOCLE') {
      // ONLY this player sees opponent cards!
      setDevilsMonocleUserId(currentUserId);
    } else if (abilityId === 'FATED_GLIMPSE') {
      if (gameState.deck.length > 0) {
        const topDeckCard = gameState.deck[gameState.deck.length - 1];
        setFatedGlimpseSuit(topDeckCard.suit);
      } else {
        alert('Deck is depleted.');
      }
    } else if (abilityId === 'WHISPERED_ELIMINATION') {
      const nonTargetSuits = SUITS.map((s) => s.suit).filter(
        (s) =>
          s !== gameState.targetCard?.suit &&
          !gameState.deactivatedSuits.includes(s)
      );
      if (nonTargetSuits.length > 0) {
        const randomElim =
          nonTargetSuits[Math.floor(Math.random() * nonTargetSuits.length)];
        setWhisperedEliminationSuit(randomElim);
      }
    }

    // Handle No Distractions alerts
    if (result.attackerAlert) {
      setInterceptionAlert({
        type: 'TACTICAL_ERROR',
        message: result.attackerAlert,
        timestamp: Date.now(),
      });
    }

    if (result.defenderAlert && networkRef.current) {
      networkRef.current.sendInterceptionAlert(
        result.defenderAlert.targetPlayerId,
        {
          type: 'DEFENSE_SHIELD',
          message: result.defenderAlert.message,
          timestamp: Date.now(),
        }
      );
    }

    updateAndBroadcastState(result.state);
  };

  // Mind Control: Controller forces victim to discard cards
  const handleMindControlForceDiscard = (cardIndices: number[]) => {
    if (!gameState) return;
    const result = executeMindControlForceDiscard(gameState, currentUserId, cardIndices);
    if (result.error) {
      alert(result.error);
      return;
    }
    setDevilsMonocleUserId(null);
    soundEffects.playRevealAction();
    updateAndBroadcastState(result.state);
  };

  // Mind Control: Controller forces victim to guess a suit
  const handleMindControlForceGuess = (suit: Suit) => {
    if (!gameState) return;
    const result = executeMindControlForceGuess(gameState, currentUserId, suit);
    if (result.error) {
      alert(result.error);
      return;
    }
    setDevilsMonocleUserId(null);
    if (result.isCorrect) {
      soundEffects.playVictoryFanfare();
    } else {
      soundEffects.playErrorBuzzer();
    }
    updateAndBroadcastState(result.state);
  };

  // Host: Play next round
  const handlePlayNextRound = () => {
    if (!gameState) return;
    const nextState: GameState = {
      ...gameState,
      roundNumber: gameState.roundNumber + 1,
    };
    const started = startNewRound(nextState);
    updateAndBroadcastState(started);
  };

  // Host: Equalize & rebalance teams (Rank 1 & 4 vs Rank 2 & 3)
  const handleEqualizeAndRebalance = () => {
    if (!gameState) return;
    const rebalanced = equalizeAndRebalanceMatrix(gameState);
    updateAndBroadcastState(rebalanced);
  };

  // Dark Transmission Chat Send (Teammates only)
  const handleSendChatMessage = (text: string) => {
    if (!gameState) return;
    const player = gameState.players.find((p) => p.id === currentUserId);
    if (!player) return;

    const chatMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      senderId: currentUserId,
      senderName: player.name,
      team: player.team,
      text,
      timestamp: Date.now(),
    };

    const updatedState: GameState = {
      ...gameState,
      commsHistory: [...gameState.commsHistory, chatMsg],
      updatedAt: Date.now(),
    };

    updateAndBroadcastState(updatedState);
  };

  // Exit Room
  const handleExitRoom = () => {
    NetworkManager.clearSession();
    if (networkRef.current) {
      networkRef.current.disconnect();
      networkRef.current = null;
    }
    setGameState(null);
    setCurrentUserId('');
    setCurrentUserName('');
    setIsHeaderExitModalOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Switch seat for local test simulation
  const handleSwitchSeatTest = (newPlayerId: string) => {
    const p = gameState?.players.find((pl) => pl.id === newPlayerId);
    if (p) {
      setCurrentUserId(p.id);
      setCurrentUserName(p.name);
    }
  };

  const currentPlayer = gameState?.players.find((p) => p.id === currentUserId);
  const isHost = currentPlayer?.isHost ?? false;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-neutral-200 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-900 bg-[#0E0E0E]/95 px-3 sm:px-6 py-2.5 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <h1 className="text-xs sm:text-sm font-mono font-black tracking-widest uppercase text-neutral-100">
            AKUMA <span className="text-amber-400">//</span> 2V2 DEDUCTION
          </h1>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          {deferredPrompt && !isAppInstalled && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
              title="Install as Android App"
            >
              <span>📲</span>
              <span>Install App</span>
            </button>
          )}

          {gameState && (
            <>
              <span className="text-[11px] text-neutral-400 hidden sm:inline mr-1">
                Room <strong className="text-amber-400 tracking-wider">{gameState.room}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsHeaderExitModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                EXIT ROOM
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-2 sm:py-4">
        {!gameState ? (
          // Landing Screen
          <div className="w-full max-w-lg mx-auto px-4 py-4 sm:py-6 font-mono">
            <div className="bg-[#131313] border-2 border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Hero Banner Artwork */}
              <div className="relative h-44 sm:h-52 w-full overflow-hidden border-b border-neutral-800">
                <img
                  src="/src/assets/images/akuma_banner_art_1792175812552.jpg"
                  alt="Akuma High Stakes Card Game"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/40 to-transparent flex flex-col justify-end p-5">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black tracking-widest uppercase">
                      2V2 CARD DEDUCTION
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-neutral-300 text-[10px] font-bold">
                      15 CARDS · 5 SUITS
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase drop-shadow-md">
                    AKUMA <span className="text-amber-400">//</span> PROTOCOL
                  </h2>
                </div>
              </div>

              {/* Main Landing Body */}
              <div className="p-5 sm:p-7 space-y-4 text-center">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  High-stakes 4-player 2v2 deduction. Exactly <strong className="text-amber-300">1 secret target card</strong> is locked in the vault. Work with your teammate to deduce its suit (♠ ♥ ♦ ♣ 👿) before your opponents!
                </p>

                {/* Rules & Guide Button */}
                <button
                  type="button"
                  onClick={() => setIsLandingRulesOpen(true)}
                  className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700/80 hover:border-amber-500/50 rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center space-x-2 transition-all shadow-md"
                >
                  <span>📜</span>
                  <span>HOW TO PLAY & BEGINNER RULES GUIDE</span>
                </button>

                {/* Install as Android App (APK / PWA) */}
                {deferredPrompt && !isAppInstalled && (
                  <button
                    type="button"
                    onClick={handleInstallApp}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500/20 to-amber-400/20 hover:from-amber-500/30 hover:to-amber-400/30 border border-amber-400/60 rounded-xl text-xs font-black tracking-wider uppercase text-amber-300 cursor-pointer flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/10"
                  >
                    <span>📲</span>
                    <span>INSTALL AS ANDROID APP (APK)</span>
                  </button>
                )}

                {/* Player Name Input */}
                <div className="text-left pt-1">
                  <label htmlFor="player-name-input" className="block text-[11px] uppercase font-bold text-neutral-400 mb-1.5">
                    Your Player Name
                  </label>
                  <input
                    id="player-name-input"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name (e.g. Alex)"
                    maxLength={18}
                    className="w-full bg-black border border-neutral-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Action Buttons: Solo Demo vs Multiplayer */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleInstantDemoMatch()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg border border-amber-300 cursor-pointer transition-all flex items-center justify-center space-x-2 hover:scale-[1.01]"
                  >
                    <span>⚡</span>
                    <span>PLAY SOLO / TEST MATCH (VS BOTS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateRoom()}
                    className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-neutral-700 hover:border-neutral-500 cursor-pointer transition-all flex items-center justify-center space-x-2"
                  >
                    <span>👥</span>
                    <span>CREATE MULTIPLAYER ROOM</span>
                  </button>
                </div>

                {/* Join with Code Divider */}
                <div className="flex items-center my-3">
                  <div className="flex-1 border-t border-neutral-800"></div>
                  <span className="px-3 text-[10px] text-neutral-500 uppercase tracking-widest">
                    OR JOIN EXISTING ROOM
                  </span>
                  <div className="flex-1 border-t border-neutral-800"></div>
                </div>

                {/* Join Room Form */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    placeholder="4-LETTER CODE"
                    maxLength={4}
                    className="flex-1 bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest font-bold uppercase text-amber-400 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleJoinRoom()}
                    className="py-2.5 px-6 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-neutral-700 cursor-pointer transition-colors"
                  >
                    JOIN
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : gameState.phase === 'LOBBY' ? (
          <LobbyView
            state={gameState}
            currentUserId={currentUserId}
            isHost={isHost}
            onSelectSlot={handleSelectSlot}
            onToggleGameMode={handleToggleGameMode}
            onStartMatch={handleStartMatch}
            onQuickFillBots={handleQuickFillBots}
            onLeaveRoom={handleExitRoom}
          />
        ) : (
          <GameBoard
            state={gameState}
            currentUserId={currentUserId}
            onRevealSelected={handleRevealSelected}
            onGuessSuit={handleGuessSuit}
            onExecuteAbility={handleExecuteAbility}
            onMindControlForceDiscard={handleMindControlForceDiscard}
            onMindControlForceGuess={handleMindControlForceGuess}
            whisperedEliminationSuit={whisperedEliminationSuit}
            devilsMonocleActive={devilsMonocleUserId === currentUserId}
            onSwitchSeatTest={handleSwitchSeatTest}
            onExitRoom={handleExitRoom}
          />
        )}
      </main>

      {/* Volatile Dark Transmission Chat (Teammates only while active turn is in progress) */}
      {currentPlayer && (
        <DarkTransmissionChat
          isOpen={Boolean(
            gameState?.darkTransmissionActive &&
            gameState?.darkTransmissionTeam === currentPlayer.team
          )}
          commsHistory={gameState?.commsHistory || []}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          userTeam={currentPlayer.team}
          onSendMessage={handleSendChatMessage}
        />
      )}

      {/* Interception Overlay for Alerts & Fated Glimpse */}
      <InterceptionOverlay
        notification={interceptionAlert}
        onDismiss={() => setInterceptionAlert(null)}
        fatedGlimpseSuit={fatedGlimpseSuit}
        onDismissFatedGlimpse={() => setFatedGlimpseSuit(null)}
        mindControlHackedMessage={null}
      />

      {/* Round Concluded Overlay */}
      {gameState && (
        <RoundOverModal
          state={gameState}
          targetCard={gameState.targetCard}
          isHost={isHost}
          onPlayNextRound={handlePlayNextRound}
          onEqualizeAndRebalance={handleEqualizeAndRebalance}
          onToggleGameMode={handleToggleGameMode}
        />
      )}

      {/* Landing Rules Guide Modal */}
      <RulesGuideModal
        isOpen={isLandingRulesOpen}
        onClose={() => setIsLandingRulesOpen(false)}
      />

      {/* Header Exit Room Modal */}
      {gameState && (
        <ExitRoomModal
          isOpen={isHeaderExitModalOpen}
          roomId={gameState.room}
          onConfirm={handleExitRoom}
          onCancel={() => setIsHeaderExitModalOpen(false)}
        />
      )}
    </div>
  );
}
