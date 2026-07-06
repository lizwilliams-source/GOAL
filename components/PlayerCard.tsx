import React from 'react';
import { Player, Goal, RateGoal, HabitGoal, CumulativeGoal } from '../types';
import { getGoalProgress, getPlayerOverall, getRateProgress, getHabitProgress, getHabitStreak, getCumulativeProgress } from '../lib/storage';
import AnimalAvatarImg from './AnimalAvatar';

interface Props {
  player: Player;
  onCheckIn: (player: Player, goal: Goal) => void;
  onDeleteGoal: (player: Player, goalId: string) => void;
  onAddGoal: (player: Player) => void;
  expanded?: boolean;
  onToggle?: () => void;
  onDeletePlayer: (player: Player) => void;
  isMe?: boolean;
}

function Bar({ pct, color }: { pct: number; color?: string }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setW(pct), 120); return () => clearTimeout(t); }, [pct]);
  const c = color || (pct >= 100 ? '#f9c923' : pct >= 70 ? '#4ade80' : pct >= 40 ? '#60a5fa' : '#fb923c');
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-900 ease-out" style={{ width: `${w}%`, background: c }}/>
    </div>
  );
}

// ---- Rate goal display ----
function RateDisplay({ goal, onLog, onDelete }: { goal: RateGoal; onLog: () => void; onDelete: () => void }) {
  const { totalMade, totalAttempts, rate, progressPct, recentLogs } = getRateProgress(goal);
  const complete = progressPct >= 100;

  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${complete ? 'rgba(249,201,35,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
      {complete && <div className="text-[9px] font-black text-yellow-400 tracking-widest mb-1.5">⚽ GOAL REACHED!</div>}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl flex-shrink-0">{goal.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white leading-snug">{goal.title}</div>
          <div className="text-[11px] text-white/40 mt-0.5">{goal.description}</div>
          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>📈 {goal.unit}</span>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onLog} className="text-xs px-3 py-2 rounded-lg font-bold active:scale-95 transition-transform" style={{ background: '#f9c923', color: '#1a1a1a' }}>+ Log</button>
          <button onClick={onDelete} className="text-sm w-9 h-9 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 active:text-red-400 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>✕</button>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-xl font-black" style={{ fontFamily: 'Black Han Sans', color: rate >= goal.targetRate ? '#f9c923' : '#60a5fa' }}>
          {totalAttempts > 0 ? `${rate}%` : '—'}
        </span>
        <span className="text-xs text-white/40">{goal.unit}</span>
        <span className="text-[10px] text-white/30 ml-auto">{totalMade}/{totalAttempts} total</span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${rate}%`, background: rate >= goal.targetRate ? '#f9c923' : '#60a5fa' }}/>
        <div className="h-full flex-1 rounded-r-full" style={{ background: 'rgba(220,38,38,0.3)' }}/>
      </div>
      <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
        <span>✅ {totalMade} made</span><span>Target: {goal.targetRate}%</span><span>❌ {totalAttempts - totalMade} missed</span>
      </div>
      {recentLogs.slice(0, 3).map((l, i) => {
        const sr = l.attempts > 0 ? Math.round((l.made / l.attempts) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-2 text-[10px] text-white/35">
            <span>{new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="font-bold text-white/55">{l.made}/{l.attempts}</span>
            <span style={{ color: sr >= goal.targetRate ? '#4ade80' : '#f87171' }}>{sr}%</span>
          </div>
        );
      })}
      <div className="mt-2 flex justify-between text-[10px] text-white/30 mb-1">
        <span>Progress to {goal.targetRate}% target</span>
        <span className="font-bold" style={{ color: complete ? '#f9c923' : 'rgba(255,255,255,0.6)' }}>{progressPct}%</span>
      </div>
      <Bar pct={progressPct}/>
    </div>
  );
}

// ---- Habit goal display ----
function HabitDisplay({ goal, onLog, onDelete }: { goal: HabitGoal; onLog: () => void; onDelete: () => void }) {
  const { doneDays, totalDays, pct, todayLogged, todayCompleted } = getHabitProgress(goal);
  const { current: streak } = getHabitStreak(goal);
  const complete = pct >= 80 && totalDays >= 10;
  // Last 7 day dots
  const today = new Date();
  const dots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const entry = goal.logs.find(l => l.date === ds);
    const state = weekend ? 'off' : entry?.note === '__pto__' ? 'pto' : entry ? (entry.completed ? 'yes' : 'no') : 'empty';
    return { ds, state };
  });

  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${complete ? 'rgba(249,201,35,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
      {complete && <div className="text-[9px] font-black text-yellow-400 tracking-widest mb-1.5">⚽ ON FIRE!</div>}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl flex-shrink-0">{goal.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white leading-snug">{goal.title}</div>
          <div className="text-[11px] text-white/40 mt-0.5">{goal.description}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>✅ Habit</span>
            {streak > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}>🔥 {streak} day{streak !== 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onLog} className="text-xs px-3 py-2 rounded-lg font-bold active:scale-95 transition-transform" style={{ background: '#f9c923', color: '#1a1a1a' }}>+ Log</button>
          <button onClick={onDelete} className="text-sm w-9 h-9 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 active:text-red-400 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>✕</button>
        </div>
      </div>
      {/* 7-day dots */}
      <div className="flex gap-1 mb-2.5">
        {dots.map(d => (
          <div key={d.ds} className="flex-1 h-5 rounded-sm flex items-center justify-center text-[9px]"
            style={{
              background: d.state === 'yes' ? '#16a34a' : d.state === 'no' ? 'rgba(220,38,38,0.5)' : d.state === 'pto' ? 'rgba(13,148,136,0.5)' : d.state === 'off' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
              border: d.ds === today.toISOString().split('T')[0] ? '1px solid rgba(249,201,35,0.6)' : '1px solid transparent',
            }}>
            {d.state === 'yes' ? '✓' : d.state === 'no' ? '✕' : d.state === 'pto' ? '🏖' : d.state === 'off' ? '—' : '·'}
          </div>
        ))}
      </div>
      {/* Stats */}
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xl font-black" style={{ fontFamily: 'Black Han Sans', color: pct >= 80 ? '#4ade80' : '#60a5fa' }}>{pct}%</span>
        <span className="text-[10px] text-white/35">{doneDays}/{totalDays} days logged</span>
      </div>
      <Bar pct={pct} color={pct >= 80 ? '#4ade80' : '#60a5fa'}/>
      {todayLogged && <div className="mt-1 text-[10px] text-white/30">Today: {todayCompleted ? '✅ yes' : '❌ no'}</div>}
    </div>
  );
}

// ---- Cumulative goal display ----
function CumulativeDisplay({ goal, onLog, onDelete }: { goal: CumulativeGoal; onLog: () => void; onDelete: () => void }) {
  const { total, progressPct, periodLabel, onPace } = getCumulativeProgress(goal);
  const complete = progressPct >= 100;
  const barColor = complete ? '#f9c923' : onPace ? '#4ade80' : '#a78bfa';
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotal = goal.logs.filter(l => l.date === todayStr).reduce((s, l) => s + l.amount, 0);

  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${complete ? 'rgba(249,201,35,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
      {complete && <div className="text-[9px] font-black text-yellow-400 tracking-widest mb-1.5">⚽ GOAL REACHED!</div>}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl flex-shrink-0">{goal.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white leading-snug">{goal.title}</div>
          <div className="text-[11px] text-white/40 mt-0.5">{goal.description}</div>
          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>🔢 Cumulative</span>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onLog} className="text-xs px-3 py-2 rounded-lg font-bold active:scale-95 transition-transform" style={{ background: '#f9c923', color: '#1a1a1a' }}>+ Log</button>
          <button onClick={onDelete} className="text-sm w-9 h-9 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 active:text-red-400 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>✕</button>
        </div>
      </div>
      <div className="flex items-end gap-1.5 mt-1 mb-1">
        <span className="text-3xl font-black leading-none" style={{ fontFamily: 'Black Han Sans', color: barColor }}>{total}</span>
        <span className="text-lg text-white/35 pb-0.5">/ {goal.targetTotal}</span>
        <span className="text-xs text-white/40 pb-0.5">{goal.unit}</span>
        <span className="text-[10px] text-white/25 pb-0.5 ml-auto">{periodLabel}</span>
      </div>
      <div className="text-xs mt-1" style={{ color: complete ? '#f9c923' : onPace ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
        {complete ? '⚽ Goal reached!' : onPace ? '✓ On pace' : `${Math.max(0, goal.targetTotal - total)} more needed`}
      </div>
      {todayTotal > 0 && <div className="text-[10px] text-white/30 mt-1">+{todayTotal} today</div>}
    </div>
  );
}

// ---- Consistency goal display ----
const SLOT_COLOR: Record<string, string> = { daily: '#4ade80', weekly: '#60a5fa', monthly: '#a78bfa' };
const SLOT_LABEL: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

export default function PlayerCard({
  player, onCheckIn, onDeleteGoal, onAddGoal, onDeletePlayer,
  expanded = false, onToggle, isMe = false
}: Props) {
  const overall = getPlayerOverall(player);
  const takenSlots = new Set(player.goals.map(g => g.slot));
  const missingSlot = (['daily', 'weekly', 'monthly'] as const).find(s => !takenSlots.has(s));
  const needsGoal = !!missingSlot;
  // complete = every goal truly hit its target (raw), not just pace-adjusted
  const complete = player.goals.length > 0 && player.goals.every(goal =>
    goal.type === 'cumulative'
      ? getCumulativeProgress(goal as CumulativeGoal).progressPct >= 100
      : getGoalProgress(goal) >= 100
  );
  const cumulativeGoals = player.goals.filter((g): g is CumulativeGoal => g.type === 'cumulative');
  const cumulativeProgresses = cumulativeGoals.map(g => getCumulativeProgress(g));
  const allCumulativeOnPace = cumulativeGoals.length > 0 && cumulativeProgresses.every(p => p.onPace);
  const headerBarColor = complete
    ? '#f9c923'
    : cumulativeGoals.length > 0
      ? allCumulativeOnPace ? '#4ade80' : '#a78bfa'
      : undefined;

  // Per-goal bar info for collapsed header
  const goalBars = player.goals.map(goal => {
    if (goal.type === 'habit') {
      const { pct } = getHabitProgress(goal);
      const c = pct >= 80 ? '#4ade80' : '#60a5fa';
      return { emoji: goal.emoji, pct, color: c, label: `${pct}%` };
    }
    if (goal.type === 'rate') {
      const { rate, progressPct } = getRateProgress(goal);
      const c = progressPct >= 100 ? '#f9c923' : '#60a5fa';
      return { emoji: goal.emoji, pct: progressPct, color: c, label: `${rate}%` };
    }
    if (goal.type === 'cumulative') {
      const { total, progressPct, onPace } = getCumulativeProgress(goal);
      const c = progressPct >= 100 ? '#f9c923' : onPace ? '#4ade80' : '#a78bfa';
      const label = progressPct >= 100 ? '✓' : onPace ? 'On pace' : `${total}/${goal.targetTotal}`;
      return { emoji: goal.emoji, pct: progressPct, color: c, label };
    }
    return { emoji: (goal as {emoji:string}).emoji, pct: 0, color: '#60a5fa', label: '—' };
  });

  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${complete ? 'shadow-[0_0_24px_rgba(249,201,35,0.18)]' : ''}`}
      style={{ background: 'rgba(0,0,0,0.4)', border: `2px solid ${complete ? 'rgba(249,201,35,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
      <div className="absolute inset-0 pointer-events-none net-texture opacity-15 rounded-2xl"/>

      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors relative z-10">
        <div className="relative flex-shrink-0">
          <AnimalAvatarImg animal={player.avatar} size={62}/>
          {(complete || allCumulativeOnPace) && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-green-900" style={{ background: complete ? '#f9c923' : '#4ade80' }}>⚽</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white text-base leading-tight" style={{ fontFamily: 'Oswald' }}>{player.name}</div>
          <div className="text-xs text-white/40 mt-0.5">
            {!needsGoal ? 'daily + weekly + monthly'
              : takenSlots.size === 0 ? 'no goals yet'
              : `add ${missingSlot} goal`} · {expanded ? 'collapse ▲' : 'expand ▼'}
          </div>
          <div className="mt-2 space-y-1.5">
            {goalBars.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs w-4 flex-shrink-0">{b.emoji}</span>
                <div className="flex-1"><Bar pct={b.pct} color={b.color}/></div>
                <span className="text-[10px] font-black flex-shrink-0" style={{ fontFamily: 'Oswald', color: b.color, minWidth: '42px', textAlign: 'right' }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 relative z-10 border-t border-white/8 pt-3 slide-up">
          {player.goals.length === 0
            ? <p className="text-white/30 text-sm text-center py-2">No goals set yet</p>
            : player.goals.map(goal => {
              const color = SLOT_COLOR[goal.slot] ?? '#60a5fa';
              const label = SLOT_LABEL[goal.slot] ?? goal.slot;
              const props = { onLog: () => onCheckIn(player, goal), onDelete: () => onDeleteGoal(player, goal.id) };
              return (
                <div key={goal.id}>
                  <div className="text-[9px] font-black uppercase tracking-widest mb-1 px-0.5" style={{ color }}>{label} Goal</div>
                  {goal.type === 'rate'        && <RateDisplay        goal={goal} {...props}/>}
                  {goal.type === 'habit'       && <HabitDisplay       goal={goal} {...props}/>}

                  {goal.type === 'cumulative'  && <CumulativeDisplay  goal={goal} {...props}/>}
                </div>
              );
            })
          }
          {needsGoal && (
            <button onClick={() => onAddGoal(player)}
              className="w-full py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.15)' }}>
              + Add {missingSlot} goal
            </button>
          )}
          <button onClick={() => { if (window.confirm(`Remove ${player.name} from the team?`)) onDeletePlayer(player); }}
            className="w-full py-2 rounded-xl text-xs font-semibold text-red-400/60 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            🗑 Remove player
          </button>
        </div>
      )}
    </div>
  );
}
