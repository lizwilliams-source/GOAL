import { AppData, Player, Goal, RateGoal, HabitGoal, ConsistencyGoal } from '../types';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'gooooal_v4';

const BLANK: AppData = {
  teamName: 'Sales Squad FC',
  month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
  players: [],
};

export function load(): AppData {
  if (typeof window === 'undefined') return BLANK;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : BLANK;
  } catch { return BLANK; }
}

export function save(data: AppData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function addPlayer(data: AppData, p: Omit<Player, 'id' | 'createdAt'>): AppData {
  const player: Player = { ...p, id: uuidv4(), createdAt: new Date().toISOString() };
  return { ...data, players: [...data.players, player] };
}

export function updatePlayer(data: AppData, id: string, updates: Partial<Player>): AppData {
  return { ...data, players: data.players.map(p => p.id === id ? { ...p, ...updates } : p) };
}

export function addGoalToPlayer(data: AppData, playerId: string, goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): AppData {
  const player = data.players.find(p => p.id === playerId);
  if (!player || player.goals.length >= 2) return data;
  const newGoal: Goal = { ...goal, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Goal;
  return updatePlayer(data, playerId, { goals: [...player.goals, newGoal] });
}

export function deleteGoal(data: AppData, playerId: string, goalId: string): AppData {
  const player = data.players.find(p => p.id === playerId);
  if (!player) return data;
  return updatePlayer(data, playerId, { goals: player.goals.filter(g => g.id !== goalId) });
}

// Log a rate entry (replaces or appends today's value)
export function logRate(data: AppData, playerId: string, goalId: string, value: number, note?: string): AppData {
  const player = data.players.find(p => p.id === playerId);
  if (!player) return data;
  const today = new Date().toISOString().split('T')[0];
  const goals = player.goals.map(g => {
    if (g.id !== goalId || g.type !== 'rate') return g;
    const existing = g.logs.find(l => l.date === today);
    const logs = existing
      ? g.logs.map(l => l.date === today ? { ...l, value, note } : l)
      : [...g.logs, { date: today, value, note }];
    return { ...g, logs, updatedAt: new Date().toISOString() } as RateGoal;
  });
  return updatePlayer(data, playerId, { goals });
}

// Log a habit yes/no (one per day)
export function logHabit(data: AppData, playerId: string, goalId: string, completed: boolean, note?: string): AppData {
  const player = data.players.find(p => p.id === playerId);
  if (!player) return data;
  const today = new Date().toISOString().split('T')[0];
  const goals = player.goals.map(g => {
    if (g.id !== goalId || g.type !== 'habit') return g;
    const existing = g.logs.find(l => l.date === today);
    const logs = existing
      ? g.logs.map(l => l.date === today ? { ...l, completed, note } : l)
      : [...g.logs, { date: today, completed, note }];
    return { ...g, logs, updatedAt: new Date().toISOString() } as HabitGoal;
  });
  return updatePlayer(data, playerId, { goals });
}

// Log a consistency session (handled X out of Y)
export function logConsistency(data: AppData, playerId: string, goalId: string, handled: number, total: number, note?: string): AppData {
  const player = data.players.find(p => p.id === playerId);
  if (!player) return data;
  const today = new Date().toISOString().split('T')[0];
  const goals = player.goals.map(g => {
    if (g.id !== goalId || g.type !== 'consistency') return g;
    // Each session is its own entry (multiple per day allowed)
    const logs = [...g.logs, { date: today, handled, total, note }];
    return { ...g, logs, updatedAt: new Date().toISOString() } as ConsistencyGoal;
  });
  return updatePlayer(data, playerId, { goals });
}

// --- Progress calculations ---

export function getRateProgress(goal: RateGoal): {
  current: number | null; delta: number | null; progressPct: number;
  history: { date: string; value: number }[];
} {
  if (goal.logs.length === 0) return { current: null, delta: null, progressPct: 0, history: [] };
  const sorted = [...goal.logs].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted[sorted.length - 1].value;
  const delta = current - goal.startValue;
  const range = goal.targetValue - goal.startValue;
  const progressPct = range === 0 ? 100 : Math.min(100, Math.max(0, Math.round(((current - goal.startValue) / range) * 100)));
  return { current, delta, progressPct, history: sorted.map(l => ({ date: l.date, value: l.value })) };
}

export function getHabitProgress(goal: HabitGoal): {
  doneDays: number; totalDays: number; pct: number; todayLogged: boolean; todayCompleted: boolean | null;
} {
  const today = new Date().toISOString().split('T')[0];
  const doneDays = goal.logs.filter(l => l.completed).length;
  const totalDays = goal.logs.length;
  const pct = totalDays === 0 ? 0 : Math.round((doneDays / totalDays) * 100);
  const todayEntry = goal.logs.find(l => l.date === today);
  return { doneDays, totalDays, pct, todayLogged: !!todayEntry, todayCompleted: todayEntry?.completed ?? null };
}

export function getConsistencyProgress(goal: ConsistencyGoal): {
  totalHandled: number; totalInstances: number; rate: number; progressPct: number;
  recentLogs: typeof goal.logs;
} {
  const totalHandled = goal.logs.reduce((s, l) => s + l.handled, 0);
  const totalInstances = goal.logs.reduce((s, l) => s + l.total, 0);
  const rate = totalInstances === 0 ? 0 : Math.round((totalHandled / totalInstances) * 100);
  const progressPct = goal.targetRate === 0 ? 100 : Math.min(100, Math.round((rate / goal.targetRate) * 100));
  const recentLogs = [...goal.logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return { totalHandled, totalInstances, rate, progressPct, recentLogs };
}

export function getGoalProgress(goal: Goal): number {
  if (goal.type === 'rate') return getRateProgress(goal).progressPct;
  if (goal.type === 'habit') return getHabitProgress(goal).pct;
  if (goal.type === 'consistency') return getConsistencyProgress(goal).progressPct;
  return 0;
}

export function getPlayerOverall(player: Player): number {
  if (player.goals.length === 0) return 0;
  return Math.round(player.goals.reduce((s, g) => s + getGoalProgress(g), 0) / player.goals.length);
}

export const JERSEY_COLORS: Record<string, { bg: string; border: string; text: string; name: string }> = {
  '#f9c923': { bg: '#f9c923', border: '#c49a12', text: '#1a1a1a', name: 'Gold' },
  '#e53935': { bg: '#e53935', border: '#b71c1c', text: '#fff',    name: 'Red'  },
  '#1e88e5': { bg: '#1e88e5', border: '#0d47a1', text: '#fff',    name: 'Blue' },
  '#43a047': { bg: '#43a047', border: '#1b5e20', text: '#fff',    name: 'Grn'  },
  '#8e24aa': { bg: '#8e24aa', border: '#4a148c', text: '#fff',    name: 'Purp' },
  '#fb8c00': { bg: '#fb8c00', border: '#bf360c', text: '#fff',    name: 'Orng' },
  '#00897b': { bg: '#00897b', border: '#004d40', text: '#fff',    name: 'Teal' },
  '#e91e63': { bg: '#e91e63', border: '#880e4f', text: '#fff',    name: 'Pink' },
  '#37474f': { bg: '#37474f', border: '#102027', text: '#fff',    name: 'Slat' },
  '#f5f5f5': { bg: '#f5f5f5', border: '#9e9e9e', text: '#1a1a1a', name: 'Wht'  },
};
