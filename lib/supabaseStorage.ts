import { getSupabase } from './supabase';
import { AppData, Player, Goal, RateGoal, HabitGoal, ConsistencyGoal, CumulativeGoal, AnimalKind } from '../types';

export async function loadData(): Promise<AppData> {
  const [
    { data: players },
    { data: goals },
    { data: rateLogs },
    { data: habitLogs },
    { data: consistencyLogs },
    { data: cumulativeLogs },
  ] = await Promise.all([
    getSupabase().from('players').select('*').order('created_at'),
    getSupabase().from('goals').select('*').order('created_at'),
    getSupabase().from('rate_logs').select('*').order('date'),
    getSupabase().from('habit_logs').select('*').order('date'),
    getSupabase().from('consistency_logs').select('*').order('date'),
    getSupabase().from('cumulative_logs').select('*').order('date'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedPlayers: Player[] = (players ?? []).map((p: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerGoals: Goal[] = (goals ?? []).filter((g: any) => g.player_id === p.id).map((g: any): Goal | null => {
      if (g.type === 'rate') return {
        type: 'rate', id: g.id, title: g.title, description: g.description ?? '',
        emoji: g.emoji ?? '🎯', unit: g.unit ?? 'rate', targetRate: g.target_rate ?? 15,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: (consistencyLogs ?? []).filter((l: any) => l.goal_id === g.id).map((l: any) => ({ date: l.date, made: l.handled, attempts: l.total, note: l.note ?? undefined })),
        createdAt: g.created_at, updatedAt: g.created_at,
      } as RateGoal;
      if (g.type === 'habit') return {
        type: 'habit', id: g.id, title: g.title, description: g.description ?? '',
        emoji: g.emoji ?? '🎯',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: (habitLogs ?? []).filter((l: any) => l.goal_id === g.id).map((l: any) => ({ date: l.date, completed: l.completed, note: l.note ?? undefined, loggedAt: l.created_at ?? undefined })),
        createdAt: g.created_at, updatedAt: g.created_at,
      } as HabitGoal;
      if (g.type === 'consistency') return {
        type: 'consistency', id: g.id, title: g.title, description: g.description ?? '',
        emoji: g.emoji ?? '🎯', targetRate: g.target_rate ?? 80,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: (consistencyLogs ?? []).filter((l: any) => l.goal_id === g.id).map((l: any) => ({ date: l.date, handled: l.handled, total: l.total, note: l.note ?? undefined })),
        createdAt: g.created_at, updatedAt: g.created_at,
      } as ConsistencyGoal;
      if (g.type === 'cumulative') return {
        type: 'cumulative', id: g.id, title: g.title, description: g.description ?? '',
        emoji: g.emoji ?? '🎯', unit: g.unit ?? 'items', targetTotal: g.target_total ?? 100,
        targetPeriod: (g.target_period === 'weekly' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: (cumulativeLogs ?? []).filter((l: any) => l.goal_id === g.id).map((l: any) => ({ date: l.date, amount: l.amount, note: l.note ?? undefined })),
        createdAt: g.created_at, updatedAt: g.created_at,
      } as CumulativeGoal;
      return null;
    }).filter((g): g is Goal => g !== null);

    return {
      id: p.id, name: p.name, avatar: p.avatar as AnimalKind,
      jerseyColor: p.jersey_color ?? '', goals: playerGoals,
      onboarded: true, createdAt: p.created_at,
    };
  });

  return {
    teamName: 'Sales Squad FC',
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    players: mappedPlayers,
  };
}

export async function createPlayer(playerData: Omit<Player, 'id' | 'createdAt'>): Promise<string> {
  const { data } = await getSupabase().from('players').insert({
    name: playerData.name,
    avatar: playerData.avatar,
    jersey_color: playerData.jerseyColor,
  }).select('id').single();
  const playerId = (data as { id: string }).id;
  for (const goal of playerData.goals) await addGoal(playerId, goal);
  return playerId;
}

export async function deletePlayer(playerId: string): Promise<void> {
  await getSupabase().from('players').delete().eq('id', playerId);
}

export async function addGoal(playerId: string, goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const row: Record<string, unknown> = {
    player_id: playerId, type: goal.type,
    title: goal.title, description: goal.description, emoji: goal.emoji,
  };
  if (goal.type === 'rate') {
    const g = goal as RateGoal;
    row.unit = g.unit; row.target_rate = g.targetRate;
  } else if (goal.type === 'consistency') {
    const g = goal as ConsistencyGoal;
    row.target_rate = g.targetRate;
  } else if (goal.type === 'cumulative') {
    const g = goal as CumulativeGoal;
    row.unit = g.unit; row.target_total = g.targetTotal;
    if (g.targetPeriod === 'weekly') row.target_period = 'weekly';
  }
  await getSupabase().from('goals').insert(row);
}

export async function deleteGoal(goalId: string): Promise<void> {
  await getSupabase().from('goals').delete().eq('id', goalId);
}

export async function logRate(goalId: string, made: number, attempts: number, note?: string, date?: string): Promise<void> {
  const d = date ?? new Date().toISOString().split('T')[0];
  await getSupabase().from('consistency_logs')
    .insert({ goal_id: goalId, date: d, handled: made, total: attempts, note: note ?? null });
}

export async function logPto(goalId: string, date?: string): Promise<void> {
  const d = date ?? new Date().toISOString().split('T')[0];
  await getSupabase().from('habit_logs')
    .upsert({ goal_id: goalId, date: d, completed: false, note: '__pto__' }, { onConflict: 'goal_id,date' });
}

export async function logHabit(goalId: string, completed: boolean, note?: string, date?: string): Promise<void> {
  const d = date ?? new Date().toISOString().split('T')[0];
  await getSupabase().from('habit_logs')
    .upsert({ goal_id: goalId, date: d, completed, note: note ?? null }, { onConflict: 'goal_id,date' });
}

export async function logConsistency(goalId: string, handled: number, total: number, note?: string, date?: string): Promise<void> {
  const d = date ?? new Date().toISOString().split('T')[0];
  await getSupabase().from('consistency_logs')
    .insert({ goal_id: goalId, date: d, handled, total, note: note ?? null });
}

export async function logCumulative(goalId: string, amount: number, note?: string, date?: string): Promise<void> {
  const d = date ?? new Date().toISOString().split('T')[0];
  await getSupabase().from('cumulative_logs')
    .insert({ goal_id: goalId, date: d, amount, note: note ?? null });
}

export interface ActivityItem {
  id: string;
  createdAt: string;
  playerName: string;
  playerAvatar: string;
  goalTitle: string;
  goalEmoji: string;
  goalType: string;
  summary: string;
  isPto: boolean;
}

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const [{ data: habitLogs }, { data: consistencyLogs }, { data: cumulativeLogs }] = await Promise.all([
    getSupabase().from('habit_logs')
      .select('id, date, completed, note, created_at, goals(type, title, emoji, player_id, players(name, avatar))')
      .order('created_at', { ascending: false }).limit(limit),
    getSupabase().from('consistency_logs')
      .select('id, date, handled, total, note, created_at, goals(type, title, emoji, player_id, players(name, avatar))')
      .order('created_at', { ascending: false }).limit(limit),
    getSupabase().from('cumulative_logs')
      .select('id, date, amount, note, created_at, goals(type, title, emoji, unit, player_id, players(name, avatar))')
      .order('created_at', { ascending: false }).limit(limit),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = (raw: any[], type: string): ActivityItem[] => (raw ?? []).map((l: any) => {
    const goal = l.goals;
    const player = goal?.players;
    if (!goal || !player) return null;
    const isPto = l.note === '__pto__';
    let summary = '';
    if (isPto) summary = '🏖️ PTO';
    else if (type === 'habit') summary = l.completed ? '✅ Hit it' : '❌ Missed';
    else if (type === 'consistency' || (type === 'consistency' && goal.type === 'rate')) {
      const rate = l.total > 0 ? Math.round((l.handled / l.total) * 100) : 0;
      summary = `${l.handled}/${l.total} → ${rate}%`;
    } else if (type === 'cumulative') summary = `+${l.amount} ${goal.unit ?? ''}`.trim();
    return {
      id: l.id, createdAt: l.created_at,
      playerName: player.name, playerAvatar: player.avatar,
      goalTitle: goal.title, goalEmoji: goal.emoji ?? '🎯',
      goalType: goal.type, summary, isPto,
    };
  }).filter((x): x is ActivityItem => x !== null);

  const all = [
    ...map(habitLogs ?? [], 'habit'),
    ...map(consistencyLogs ?? [], 'consistency'),
    ...map(cumulativeLogs ?? [], 'cumulative'),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);

  return all;
}

export async function clearLog(goalId: string, goalType: string, date: string): Promise<void> {
  const tables: Record<string, string> = {
    rate: 'rate_logs', habit: 'habit_logs',
    consistency: 'consistency_logs', cumulative: 'cumulative_logs',
  };
  const table = tables[goalType];
  if (table) await getSupabase().from(table).delete().eq('goal_id', goalId).eq('date', date);
}
