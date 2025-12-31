
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'work' | 'travel' | 'study' | 'business' | 'hobby' | 'conversation';
export type Gender = 'male' | 'female';

export interface UserPreferences {
  id: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: Level;
  subLevel: number;
  goal: Goal;
  gender: Gender;
  name: string;
  email: string;
  avatarUrl: string;
  xp: number;
  streak: number;
  unlockedLevels: number;
  masteryScore: number;
  errorLog: string[];
  isLoggedIn: boolean;
  lastLogin: string;
  stats: {
    wordsLearned: number;
    hoursPracticed: number;
    scenariosCompleted: number;
    perfectLessons: number;
  };
}

export interface LearningNode {
  id: string;
  levelIndex: number;
  title: string;
  type: 'lesson' | 'boss' | 'game' | 'review' | 'conversation';
  status: 'completed' | 'available' | 'locked';
  description: string;
}

export interface Exercise {
  id: string;
  type: 'phonetic' | 'multiple_choice' | 'fill_blank' | 'translation' | 'pronunciation';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic?: string;
}

export enum AppState {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  EXERCISES = 'EXERCISES',
  CONVERSATION = 'CONVERSATION',
  GAMES = 'GAMES',
  SCENARIOS = 'SCENARIOS',
  PROFILE = 'PROFILE'
}

export const LANGUAGES = [
  { code: 'en', name: 'Inglés', flag: '🇺🇸', voice: 'Kore' },
  { code: 'es', name: 'Español', flag: '🇪🇸', voice: 'Puck' },
  { code: 'fr', name: 'Francés', flag: '🇫🇷', voice: 'Charon' },
  { code: 'de', name: 'Alemán', flag: '🇩🇪', voice: 'Zephyr' },
  { code: 'ja', name: 'Japonés', flag: '🇯🇵', voice: 'Kore' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', voice: 'Puck' },
  { code: 'pt', name: 'Portugués', flag: '🇧🇷', voice: 'Zephyr' },
  { code: 'zh', name: 'Chino', flag: '🇨🇳', voice: 'Kore' },
  { code: 'ru', name: 'Ruso', flag: '🇷🇺', voice: 'Zephyr' },
  { code: 'ko', name: 'Coreano', flag: '🇰🇷', voice: 'Puck' }
];

export const GOALS = [
  { id: 'work', label: 'Trabajo y Carrera', icon: '💼' },
  { id: 'conversation', label: 'Conversación Fluida', icon: '🗣️' },
  { id: 'travel', label: 'Viajes por el Mundo', icon: '✈️' },
  { id: 'study', label: 'Estudios Académicos', icon: '🎓' },
  { id: 'business', label: 'Negocios Internacionales', icon: '🤝' },
  { id: 'hobby', label: 'Cultura y Pasatiempo', icon: '🎨' }
];
