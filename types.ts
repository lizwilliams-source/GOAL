export type AnimalKind =
  | 'goose' | 'goat' | 'panda' | 'giraffe' | 'cat'
  | 'gorilla' | 'sheep' | 'tiger' | 'cheetah' | 'lizard' | 'horse';

export interface RateGoal {
  type: 'rate';
  slot: 'daily' | 'weekly' | 'monthly';
  id: string; title: string; description: string; emoji: string;
  unit: string;
  targetRate: number;
  logs: { date: string; made: number; attempts: number; note?: string }[];
  createdAt: string; updatedAt: string;
}

export interface HabitGoal {
  type: 'habit';
  slot: 'daily' | 'weekly' | 'monthly';
  id: string; title: string; description: string; emoji: string;
  logs: { date: string; completed: boolean; note?: string; loggedAt?: string }[];
  createdAt: string; updatedAt: string;
}

export interface CumulativeGoal {
  type: 'cumulative';
  slot: 'daily' | 'weekly' | 'monthly';
  id: string; title: string; description: string; emoji: string;
  unit: string;
  targetTotal: number;
  targetPeriod: 'weekly' | 'monthly';
  logs: { id?: string; date: string; amount: number; note?: string }[];
  createdAt: string; updatedAt: string;
}

export type Goal = RateGoal | HabitGoal | CumulativeGoal;

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
