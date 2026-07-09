import { getSupabase } from './supabase';
import { AppData, Player, Goal, RateGoal, HabitGoal, CumulativeGoal, AnimalKind } from '../types';

export async function loadData(): Promise<AppData> {
  const [
    { data: players },
    { data: goals },
    { data: rateLogs },
    { data: habitLogs },
    { data: cumulativeLogs },
  ] = await Promise.all([
    getSupabase().from('players').select('*').order('created_at'),
    getSupabase().from('goals').select('*').order('created_at'),
    getSupabase().from('rate_logs').select('*').order('date'),
    getSupabase().from('habit_logs').select('*').order('date'),
    getSupabase().from('cumulative_logs').select('*').order('date'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedPlayers: Player[] = (players ?? []).map((p: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerGoals: Goal[] = (goals ?? []).filter((g: any) => g.player_id === p.id).map((g: any): Goal | null => {
      const inferredSlot = (g.slot ?? (g.type === 'habit' ? 'daily' : 'monthly')) as 'daily' | 'weekly' | 'monthly';
      if (g.type === 'rate') return {
        type: 'rate', slot: inferredSlot, id: g.id, title: g.title, description: g.description ?? '',
        emoji: g.emoji ?? '🎯', unit: g.unit ?? 'rate', targetRate: g.target_rate ?? 15,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: (rateLogs ?? []).filter((l: any) => l.goal_id === g.id).map((l: any) => ({ date: l.date, made: l.made, attempts: l.attempts, note: l.note ?? undefined })),
        createdAt: g.created_at, updatedAt: g.created_at,
      } as RateGoal;
      if (g.type === 'habit') return {
        type: 'habit', slot: inferredSlot, id: g.id, title: g.title, description: g.description ?? '',
        emoji: g.emoji ?? '🎯',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: (habitLogs ?? []).filter((l: any) => l.goal_id === g.id).map((l: any) => ({ date: l.date, completed: l.completed, note: l.note ?? undefined, loggedAt: l.created_at ?? undefined })),
        createdAt: g.created_at, updatedAt: g.created_at,
      } as HabitGoal;
      if (g.type === 'cumulative') return {
        type: 'cumulative', slot: inferredSlot, id: g.id, title: g.title, description: g.description ?? '',
        emoji: g.emoji ?? '🎯', unit: g.unit ?? 'items', targetTotal: g.target_total ?? 100,
        targetPeriod: (g.target_period === 'weekly' ? 'weekly' : g.target_period === 'daily' ? 'daily' : 'monthly') as 'daily' | 'weekly' | 'monthly',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: (cumulativeLogs ?? []).filter((l: any) => l.goal_id === g.id).map((l: any) => ({ id: l.id, date: l.date, amount: l.amount, note: l.note ?? undefined })),
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
    player_id: playerId, type: goal.type, slot: goal.slot,
    title: goal.title, description: goal.description, emoji: goal.emoji,
  };
  if (goal.type === 'rate') {
    const g = goal as RateGoal;
    row.unit = g.unit; row.target_rate = g.targetRate;
  } else if (goal.type === 'cumulative') {
    const g = goal as CumulativeGoal;
    row.unit = g.unit; row.target_total = g.targetTotal;
    if (g.targetPeriod === 'weekly') row.target_period = 'weekly';
    else if (g.targetPeriod === 'daily') row.target_period = 'daily';
  }
  await getSupabase().from('goals').insert(row);
}

export async function deleteGoal(goalId: string): Promise<void> {
  await getSupabase().from('goals').delete().eq('id', goalId);
}

export async function logRate(goalId: string, made: number, attempts: number, note?: string, date?: string): Promise<void> {
  const d = date ?? new Date().toISOString().split('T')[0];
  await getSupabase().from('rate_logs')
    .insert({ goal_id: goalId, date: d, made, attempts, note: note ?? null });
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
  const [{ data: habitLogs }, { data: cumulativeLogs }] = await Promise.all([
    getSupabase().from('habit_logs')
      .select('id, date, completed, note, created_at, goals(type, title, emoji, player_id, players(name, avatar))')
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
    else if (type === 'cumulative') summary = `+${l.amount} ${goal.unit ?? ''}`.trim();
    return {
      id: l.id, createdAt: l.created_at,
      playerName: player.name, playerAvatar: player.avatar,
      goalTitle: goal.title, goalEmoji: goal.emoji ?? '🎯',
      goalType: goal.type, summary, isPto,
    };
  }).filter((x): x is ActivityItem => x !== null);

  const all = [
    ...map(habitLogs ?? [], 'habit'),
    ...map(cumulativeLogs ?? [], 'cumulative'),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);

  return all;
}

export async function deleteCumulativeLog(logId: string): Promise<void> {
  await getSupabase().from('cumulative_logs').delete().eq('id', logId);
}

export async function ensureRevenueGoal(playerId: string): Promise<string> {
  const { data: existing } = await getSupabase()
    .from('goals').select('id')
    .eq('player_id', playerId).eq('type', 'cumulative').eq('unit', '$')
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;
  const { data } = await getSupabase()
    .from('goals')
    .insert({ player_id: playerId, type: 'cumulative', title: 'Revenue', description: '', emoji: '💰', unit: '$', target_total: 0 })
    .select('id').single();
  return (data as { id: string }).id;
}

export async function setRevenueTarget(goalId: string, target: number): Promise<void> {
  await getSupabase().from('goals').update({ target_total: target }).eq('id', goalId);
}

export async function resetAllData(): Promise<void> {
  await getSupabase().from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function clearLog(goalId: string, goalType: string, date: string): Promise<void> {
  const tables: Record<string, string> = {
    rate: 'rate_logs', habit: 'habit_logs', cumulative: 'cumulative_logs',
  };
  const table = tables[goalType];
  if (table) await getSupabase().from(table).delete().eq('goal_id', goalId).eq('date', date);
}
