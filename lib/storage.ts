import { AppData, Player, Goal, RateGoal, HabitGoal, ConsistencyGoal, CumulativeGoal } from '../types';
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

export function removePlayer(data: AppData, playerId: string): AppData {
  return { ...data, players: data.players.filter(p => p.id !== playerId) };
}

export function addGoalToPlayer(data: AppData, playerId: string, goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): AppData {
  const player = data.players.find(p => p.id === playerId);
  if (!player || player.goals.length >= 3) return data;
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

// Log a cumulative amount (each entry adds to the running total)
export function logCumulative(data: AppData, playerId: string, goalId: string, amount: number, note?: string): AppData {
  const player = data.players.find(p => p.id === playerId);
  if (!player) return data;
  const today = new Date().toISOString().split('T')[0];
  const goals = player.goals.map(g => {
    if (g.id !== goalId || g.type !== 'cumulative') return g;
    const logs = [...g.logs, { date: today, amount, note }];
    return { ...g, logs, updatedAt: new Date().toISOString() } as CumulativeGoal;
  });
  return updatePlayer(data, playerId, { goals });
}

// --- Helpers ---

function thisMonthStr(): string { return new Date().toISOString().slice(0, 7); }

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDay() === 0 || d.getDay() === 6;
}

function nextWorkday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// --- Progress calculations (all filtered to current month) ---

export function getRateProgress(goal: RateGoal): {
  totalMade: number; totalAttempts: number; rate: number; progressPct: number;
  recentLogs: typeof goal.logs;
} {
  const month = thisMonthStr();
  const monthLogs = goal.logs.filter(l => l.date.startsWith(month));
  const totalMade = monthLogs.reduce((s, l) => s + l.made, 0);
  const totalAttempts = monthLogs.reduce((s, l) => s + l.attempts, 0);
  const rate = totalAttempts === 0 ? 0 : Math.round((totalMade / totalAttempts) * 100);
  const progressPct = goal.targetRate === 0 ? 100 : Math.min(100, Math.round((rate / goal.targetRate) * 100));
  const recentLogs = [...monthLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return { totalMade, totalAttempts, rate, progressPct, recentLogs };
}

export function getHabitProgress(goal: HabitGoal): {
  doneDays: number; totalDays: number; pct: number; todayLogged: boolean; todayCompleted: boolean | null;
} {
  const today = new Date().toISOString().split('T')[0];
  const month = thisMonthStr();
  const monthLogs = goal.logs.filter(l => l.date.startsWith(month));
  const weekdayLogs = monthLogs.filter(l => !isWeekend(l.date) && l.note !== '__pto__');
  const doneDays = weekdayLogs.filter(l => l.completed).length;
  const totalDays = weekdayLogs.length;
  const pct = totalDays === 0 ? 0 : Math.round((doneDays / totalDays) * 100);
  const todayEntry = goal.logs.find(l => l.date === today);
  return { doneDays, totalDays, pct, todayLogged: !!todayEntry, todayCompleted: todayEntry?.completed ?? null };
}

export function getHabitStreak(goal: HabitGoal): { current: number; best: number } {
  const completedDates = goal.logs
    .filter(l => !isWeekend(l.date) && l.note !== '__pto__' && l.completed)
    .map(l => l.date)
    .sort();
  if (completedDates.length === 0) return { current: 0, best: 0 };

  const runs: number[] = [];
  let run = 1;
  for (let i = 1; i < completedDates.length; i++) {
    if (nextWorkday(completedDates[i - 1]) === completedDates[i]) { run++; }
    else { runs.push(run); run = 1; }
  }
  runs.push(run);
  const best = Math.max(...runs);

  const today = new Date().toISOString().split('T')[0];
  const lastCompleted = completedDates[completedDates.length - 1];
  const prevWd = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();
  const current = (lastCompleted === today || lastCompleted === prevWd) ? runs[runs.length - 1] : 0;
  return { current, best };
}

export function getConsistencyProgress(goal: ConsistencyGoal): {
  totalHandled: number; totalInstances: number; rate: number; progressPct: number;
  recentLogs: typeof goal.logs;
} {
  const month = thisMonthStr();
  const monthLogs = goal.logs.filter(l => l.date.startsWith(month));
  const totalHandled = monthLogs.reduce((s, l) => s + l.handled, 0);
  const totalInstances = monthLogs.reduce((s, l) => s + l.total, 0);
  const rate = totalInstances === 0 ? 0 : Math.round((totalHandled / totalInstances) * 100);
  const progressPct = goal.targetRate === 0 ? 100 : Math.min(100, Math.round((rate / goal.targetRate) * 100));
  const recentLogs = [...monthLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return { totalHandled, totalInstances, rate, progressPct, recentLogs };
}

export function getCumulativeProgress(goal: CumulativeGoal): {
  total: number; progressPct: number; periodLabel: string; onPace: boolean; pacePct: number;
} {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  let total: number;
  let periodLabel: string;
  let pacePct: number;

  if (goal.targetPeriod === 'weekly') {
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const mondayStr = monday.toISOString().split('T')[0];
    total = goal.logs.filter(l => l.date >= mondayStr && l.date <= today).reduce((s, l) => s + l.amount, 0);
    periodLabel = 'this week';
    const daysDone = dow === 0 || dow === 6 ? 5 : Math.max(0, dow - 1); // days fully completed before today
    pacePct = Math.round((daysDone / 5) * 100);
  } else {
    const monthStr = today.slice(0, 7);
    total = goal.logs.filter(l => l.date.startsWith(monthStr)).reduce((s, l) => s + l.amount, 0);
    periodLabel = 'this month';
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    pacePct = Math.round((now.getDate() / daysInMonth) * 100);
  }

  const progressPct = goal.targetTotal === 0 ? 100 : Math.min(100, Math.round((total / goal.targetTotal) * 100));
  const onPace = progressPct >= pacePct;
  return { total, progressPct, periodLabel, onPace, pacePct };
}

export function getGoalProgress(goal: Goal): number {
  if (goal.type === 'rate') return getRateProgress(goal).progressPct;
  if (goal.type === 'habit') return getHabitProgress(goal).pct;
  if (goal.type === 'consistency') return getConsistencyProgress(goal).progressPct;
  if (goal.type === 'cumulative') {
    const { progressPct, pacePct } = getCumulativeProgress(goal);
    // Score relative to pace so cumulative goals are fairly comparable to other types.
    // On pace = ~100, ahead = 100 (capped), behind = proportionally less.
    if (pacePct <= 0) return progressPct;
    return Math.min(100, Math.round((progressPct / pacePct) * 100));
  }
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
