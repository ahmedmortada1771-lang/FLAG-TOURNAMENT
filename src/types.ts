export type Continent = 
  | 'All' 
  | 'Europe' 
  | 'Africa' 
  | 'Asia' 
  | 'North America' 
  | 'South America' 
  | 'Oceania';

export type GameMode = 'classic' | 'tournament' | 'survival' | 'timeattack' | 'daily' | 'online';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Country {
  id: string;
  name: string;
  continent: Continent;
  difficulty: DifficultyLevel; // 1 (Easiest) to 10 (Hardest)
  flagCode: string; // ISO 3166-1 alpha-2 code or flagcdn code
  altNames?: string[];
  fifaMember: boolean;
}

export interface Question {
  id: number;
  targetCountry: Country;
  choices: Country[];
  correctIndex: number;
}

export interface UserAnswer {
  questionNumber: number;
  country: Country;
  selectedCountry: Country;
  isCorrect: boolean;
  timeTakenMs: number;
  difficulty: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  volume: number; // 0 to 1 (Sound FX Volume)
  musicEnabled: boolean;
  musicVolume: number; // 0 to 1 (Background Music Volume)
  theme: 'cyberpunk' | 'dark' | 'light';
  haptics: boolean;
}

export interface UserStats {
  gamesPlayed: number;
  totalCorrect: number;
  totalWrong: number;
  highestScore: number;
  longestStreak: number;
  bestDifficultyReached: number;
  tournamentWins: number;
  dailyStreak: number;
  lastDailyDate: string; // YYYY-MM-DD
  lastDailyTimestamp?: number; // timestamp in ms when last completed
  dailyPoints: number; // Special points gained from daily challenge (1 point per correct answer)
  continentAccuracy: Record<string, { correct: number; total: number }>;
  unlockedAchievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked?: boolean;
}
