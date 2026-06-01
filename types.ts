export type AnimalKind =
  | 'goose' | 'goat' | 'panda' | 'giraffe' | 'cat'
  | 'gorilla' | 'sheep' | 'tiger' | 'cheetah' | 'blackcat';

export interface RateGoal {
  type: 'rate';
  id: string; title: string; description: string; emoji: string;
  unit: string;
  startValue: number;
  targetValue: number;
  logs: { date: string; value: number; note?: string }[];
  createdAt: string; updatedAt: string;
}

export interface HabitGoal {
  type: 'habit';
  id: string; title: string; description: string; emoji: string;
  logs: { date: string; completed: boolean; note?: string }[];
  createdAt: string; updatedAt: string;
}

export interface ConsistencyGoal {
  type: 'consistency';
  id: string; title: string; description: string; emoji: string;
  targetRate: number;
  logs: { date: string; handled: number; total: number; note?: string }[];
  createdAt: string; updatedAt: string;
}

export type Goal = RateGoal | HabitGoal | ConsistencyGoal;

export interface Player {
  id: string;
  name: string;
  avatar: AnimalKind;
  jerseyColor: string;
  goals: Goal[];
  onboarded: boolean;
  createdAt: string;
}

export interface AppData {
  teamName: string;
  month: string;
  players: Player[];
}
