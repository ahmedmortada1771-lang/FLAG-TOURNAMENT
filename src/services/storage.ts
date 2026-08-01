import { GameSettings, UserStats, Achievement } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'flag_tournament_settings',
  STATS: 'flag_tournament_stats',
  PLAYER_NAME: 'flag_tournament_player_name',
  PLAYER_ID: 'flag_tournament_player_id',
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_win', title: 'First Victory', description: 'Complete your first game round.', icon: '🏆' },
  { id: 'rookie', title: 'Flag Rookie', description: 'Answer 10 flags correctly.', icon: '🚩' },
  { id: 'master', title: 'Flag Master', description: 'Answer 100 flags correctly.', icon: '🌟' },
  { id: 'virtuoso', title: 'Flag Virtuoso', description: 'Answer 250 flags correctly.', icon: '👑' },
  { id: 'streak_10', title: 'On Fire', description: 'Achieve a 10-answer streak in one game.', icon: '🔥' },
  { id: 'streak_25', title: 'Unstoppable Force', description: 'Achieve an astounding 25-answer streak!', icon: '⚡' },
  { id: 'perfect_20', title: 'Sharpshooter', description: 'Get a 100% score in a 20+ question round.', icon: '🎯' },
  { id: 'speed_demon', title: 'Lightning Fast', description: 'Answer a question in under 1.5 seconds.', icon: '🏎️' },
  { id: 'tournament_champ', title: 'Tournament Legend', description: 'Reach difficulty level 10 in Tournament mode.', icon: '🥇' },
  { id: 'daily_hero', title: 'Daily Challenger', description: 'Complete today\'s Daily Challenge.', icon: '📅' },
  { id: 'global_voyager', title: 'Globe Trotter', description: 'Play games across 4 different continent regions.', icon: '🌍' },
  { id: 'survival_ace', title: 'Survivor', description: 'Reach a score of 15+ in Survival mode.', icon: '🛡️' },
  { id: 'survival_god', title: 'Immortal Survivor', description: 'Reach an unbelievable score of 30+ in Infinite Survival!', icon: '⚜️' },
  { id: 'time_attack_hero', title: 'Blitz Master', description: 'Answer 10+ flags correctly in 30s Time Attack mode.', icon: '⏱️' },
  { id: 'flag_scholar', title: 'Flag Connoisseur', description: 'Play 10 total games.', icon: '🎓' },
  { id: 'high_tier_flawless', title: 'Master Mind', description: 'Complete a round on Level 7+ difficulty with 100% accuracy.', icon: '🧠' },
  { id: 'century_warrior', title: 'Veteran Explorer', description: 'Play 50 total games across any mode.', icon: '🎖️' },
];

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  volume: 0.9,
  musicEnabled: true,
  musicVolume: 0.7,
  theme: 'cyberpunk',
  haptics: true,
};

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  totalCorrect: 0,
  totalWrong: 0,
  highestScore: 0,
  longestStreak: 0,
  bestDifficultyReached: 1,
  tournamentWins: 0,
  dailyStreak: 0,
  lastDailyDate: '',
  lastDailyTimestamp: 0,
  dailyPoints: 0,
  continentAccuracy: {},
  unlockedAchievements: [],
};

export function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class StorageService {
  public static isValidPlayerName(name: string): boolean {
    const trimmed = name ? name.trim() : '';
    return trimmed.length >= 3 && trimmed.length <= 12;
  }

  public static getPlayerName(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      return stored ? stored.trim() : '';
    } catch {
      return '';
    }
  }

  public static savePlayerName(name: string): boolean {
    if (!this.isValidPlayerName(name)) return false;
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name.trim());
      return true;
    } catch {
      return false;
    }
  }

  public static getPlayerId(): string {
    try {
      let pid = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
      if (!pid) {
        pid = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        localStorage.setItem(STORAGE_KEYS.PLAYER_ID, pid);
      }
      return pid;
    } catch {
      return 'p_' + Math.random().toString(36).substring(2, 9);
    }
  }

  public static getSettings(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  public static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore quota errors
    }
  }

  public static getStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_STATS,
          ...parsed,
          continentAccuracy: parsed.continentAccuracy ? { ...parsed.continentAccuracy } : {},
          unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? [...parsed.unlockedAchievements] : [],
        };
      }
    } catch {
      // Ignore
    }
    return {
      ...DEFAULT_STATS,
      continentAccuracy: {},
      unlockedAchievements: [],
    };
  }

  public static saveStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch {
      // Ignore quota errors
    }
  }

  public static updateGameEndStats(params: {
    correctCount: number;
    wrongCount: number;
    score: number;
    maxStreak: number;
    bestDifficulty: number;
    continent: string;
    isTournament: boolean;
    isDaily: boolean;
    isSurvival: boolean;
    quickestTimeMs?: number;
  }): { stats: UserStats; newlyUnlocked: Achievement[] } {
    const stats = this.getStats();
    const newlyUnlocked: Achievement[] = [];

    stats.gamesPlayed += 1;
    stats.totalCorrect += params.correctCount;
    stats.totalWrong += params.wrongCount;
    stats.highestScore = Math.max(stats.highestScore, params.score);
    stats.longestStreak = Math.max(stats.longestStreak, params.maxStreak);
    stats.bestDifficultyReached = Math.max(stats.bestDifficultyReached, params.bestDifficulty);

    if (params.isTournament && params.bestDifficulty >= 10) {
      stats.tournamentWins += 1;
    }

    // Update continent breakdown
    if (params.continent) {
      const prev = stats.continentAccuracy[params.continent] || { correct: 0, total: 0 };
      stats.continentAccuracy[params.continent] = {
        correct: prev.correct + params.correctCount,
        total: prev.total + params.correctCount + params.wrongCount,
      };
    }

    // Check Daily Challenge
    const today = getLocalDateString();
    if (params.isDaily) {
      if (stats.lastDailyDate !== today) {
        stats.dailyStreak += 1;
        stats.lastDailyDate = today;
      }
      stats.lastDailyTimestamp = Date.now();
      // Add 1 point per correct answer in Daily Challenge
      stats.dailyPoints = (stats.dailyPoints || 0) + params.correctCount;
    }

    // Check Achievements logic
    const unlock = (id: string) => {
      if (!stats.unlockedAchievements.includes(id)) {
        stats.unlockedAchievements.push(id);
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === id);
        if (ach) newlyUnlocked.push(ach);
      }
    };

    if (stats.gamesPlayed >= 1) unlock('first_win');
    if (stats.gamesPlayed >= 10) unlock('flag_scholar');
    if (stats.gamesPlayed >= 50) unlock('century_warrior');

    if (stats.totalCorrect >= 10) unlock('rookie');
    if (stats.totalCorrect >= 100) unlock('master');
    if (stats.totalCorrect >= 250) unlock('virtuoso');

    if (params.maxStreak >= 10) unlock('streak_10');
    if (params.maxStreak >= 25) unlock('streak_25');

    if (params.correctCount >= 20 && params.wrongCount === 0) unlock('perfect_20');
    if (params.bestDifficulty >= 7 && params.wrongCount === 0 && params.correctCount >= 10) unlock('high_tier_flawless');

    if (params.quickestTimeMs && params.quickestTimeMs <= 1500) unlock('speed_demon');
    if (params.isTournament && params.bestDifficulty >= 10) unlock('tournament_champ');
    if (params.isDaily) unlock('daily_hero');
    if (Object.keys(stats.continentAccuracy).length >= 4) unlock('global_voyager');

    if (params.isSurvival && params.correctCount >= 15) unlock('survival_ace');
    if (params.isSurvival && params.correctCount >= 30) unlock('survival_god');

    if (!params.isSurvival && params.correctCount >= 10 && params.quickestTimeMs && params.quickestTimeMs <= 3000) unlock('time_attack_hero');

    this.saveStats(stats);
    return { stats, newlyUnlocked };
  }

  public static resetStats(): UserStats {
    const emptyStats: UserStats = {
      gamesPlayed: 0,
      totalCorrect: 0,
      totalWrong: 0,
      highestScore: 0,
      longestStreak: 0,
      bestDifficultyReached: 1,
      tournamentWins: 0,
      dailyStreak: 0,
      lastDailyDate: '',
      lastDailyTimestamp: 0,
      dailyPoints: 0,
      continentAccuracy: {},
      unlockedAchievements: [],
    };
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(emptyStats));
    } catch {
      // Ignore
    }
    return emptyStats;
  }
}
