import { Question, Continent, GameMode } from '../types';

export interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  currentQuestionIndex: number;
  finished: boolean;
  totalCorrect: number;
  totalTimeMs: number;
  avatarSeed: number;
}

export interface OnlineRoom {
  code: string;
  hostId: string;
  continent: Continent;
  gameMode: GameMode;
  questionCount: number;
  maxPlayers: number;
  status: 'lobby' | 'playing' | 'finished';
  players: OnlinePlayer[];
  questions: Question[];
  createdAt: number;
}

const bc = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('flag_online_rooms')
  : null;

export class OnlineService {
  private static activeWs: WebSocket | null = null;
  private static pollTimer: any = null;

  public static async registerPlayerName(name: string, playerId: string): Promise<string> {
    try {
      const res = await fetch('/api/players/register-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), playerId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'This name is already taken or unavailable, try another name');
      }

      const data = await res.json();
      return data.name;
    } catch (e: any) {
      if (e.message && (e.message.includes('fetch') || e.message.includes('NetworkError') || e.message.includes('Failed to fetch'))) {
        console.warn('Backend server offline or unreachable, registering name locally.');
        return name.trim();
      }
      throw e;
    }
  }

  public static async createRoom(
    hostId: string,
    hostName: string,
    continent: Continent = 'All',
    gameMode: GameMode = 'classic',
    questionCount: number = 20
  ): Promise<{ roomCode: string; room: OnlineRoom }> {
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId, hostName, continent, gameMode, questionCount }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create room');
    }

    const data = await res.json();
    if (bc) bc.postMessage({ type: 'ROOM_UPDATE', roomCode: data.roomCode });
    return data;
  }

  public static async joinRoom(
    code: string,
    playerId: string,
    playerName: string
  ): Promise<OnlineRoom> {
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim(), playerId, playerName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to join room');
    }

    const data = await res.json();
    if (bc) bc.postMessage({ type: 'ROOM_UPDATE', roomCode: code.trim() });
    return data.room;
  }

  public static async getRoom(code: string): Promise<OnlineRoom> {
    const res = await fetch(`/api/rooms/${code.trim()}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Room not found');
    }
    const data = await res.json();
    return data.room;
  }

  public static async startRoom(code: string, playerId: string): Promise<OnlineRoom> {
    const res = await fetch(`/api/rooms/${code.trim()}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to start game');
    }

    const data = await res.json();
    if (bc) bc.postMessage({ type: 'ROOM_UPDATE', roomCode: code.trim() });
    return data.room;
  }

  public static async submitProgress(
    code: string,
    playerId: string,
    progress: {
      currentQuestionIndex: number;
      score: number;
      totalCorrect: number;
      totalTimeMs: number;
      finished: boolean;
    }
  ): Promise<OnlineRoom> {
    const res = await fetch(`/api/rooms/${code.trim()}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, ...progress }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update progress');
    }

    const data = await res.json();
    if (bc) bc.postMessage({ type: 'ROOM_UPDATE', roomCode: code.trim() });
    return data.room;
  }

  public static async leaveRoom(code: string, playerId: string): Promise<void> {
    await fetch(`/api/rooms/${code.trim()}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    }).catch(() => {});

    if (bc) bc.postMessage({ type: 'ROOM_UPDATE', roomCode: code.trim() });
  }

  public static subscribeToRoomUpdates(
    code: string,
    onUpdate: (room: OnlineRoom) => void
  ): () => void {
    let isSubscribed = true;

    // 1. Initial Fetch
    this.getRoom(code)
      .then((room) => {
        if (isSubscribed) onUpdate(room);
      })
      .catch(() => {});

    // 2. BroadcastChannel Listener
    const handleBcMessage = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === 'ROOM_UPDATE' && ev.data.roomCode === code) {
        this.getRoom(code)
          .then((room) => {
            if (isSubscribed) onUpdate(room);
          })
          .catch(() => {});
      }
    };
    if (bc) bc.addEventListener('message', handleBcMessage);

    // 3. WebSocket Connection
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws?roomCode=${code}`;
      const ws = new WebSocket(wsUrl);
      this.activeWs = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ROOM_UPDATE' && data.room && isSubscribed) {
            onUpdate(data.room);
          }
        } catch {
          // Ignore
        }
      };
    } catch {
      // WS Fallback handled by polling
    }

    // 4. Polling Fallback (every 1.5s for rapid state sync)
    const interval = setInterval(() => {
      if (!isSubscribed) return;
      this.getRoom(code)
        .then((room) => {
          if (isSubscribed) onUpdate(room);
        })
        .catch(() => {});
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (bc) bc.removeEventListener('message', handleBcMessage);
      if (this.activeWs) {
        this.activeWs.close();
        this.activeWs = null;
      }
    };
  }
}
