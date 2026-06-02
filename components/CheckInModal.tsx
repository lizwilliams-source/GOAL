import React, { useState } from 'react';
import { Goal, RateGoal, HabitGoal, ConsistencyGoal, CumulativeGoal, Player } from '../types';
import { getRateProgress, getConsistencyProgress, getCumulativeProgress } from '../lib/storage';
import AnimalAvatarImg from './AnimalAvatar';

interface Props {
  player: Player;
  goal: Goal;
  onSubmitRate: (value: number, note?: string, date?: string) => void;
  onSubmitHabit: (completed: boolean, note?: string, date?: string) => void;
  onSubmitConsistency: (handled: number, total: number, note?: string, date?: string) => void;
  onSubmitCumulative: (amount: number, note?: string, date?: string) => void;
  onClear: (date: string) => void;
  onClose: () => void;
}

function Celebrating({ onDone }: { onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl" style={{ background: 'rgba(0,0,0,0.88)' }}>
      <div className="goal-celebrate text-center">
        <div className="text-6xl mb-2">⚽</div>
        <div className="font-black text-yellow-400 text-xl tracking-wider" style={{ fontFamily: 'Black Han Sans' }}>LOGGED!</div>
      </div>
    </div>
  );
}

type DateStatus = 'empty' | 'yes' | 'no' | 'logged';

function getDateStatus(goal: Goal, dateStr: string): DateStatus {
  if (goal.type === 'habit') {
    const entry = (goal as HabitGoal).logs.find(l => l.date === dateStr);
    if (!entry) return 'empty';
    return entry.completed ? 'yes' : 'no';
  }
  const hasLog = (goal.logs as { date: string }[]).some(l => l.date === dateStr);
  return hasLog ? 'logged' : 'empty';
}

function statusBg(status: DateStatus, goalType: string): string {
  if (status === 'yes') return '#16a34a';
  if (status === 'no') return 'rgba(220,38,38,0.7)';
  if (status === 'logged') {
    if (goalType === 'rate') return 'rgba(96,165,250,0.55)';
    if (goalType === 'consistency') return 'rgba(251,146,60,0.55)';
    if (goalType === 'cumulative') return 'rgba(167,139,250,0.55)';
  }
  return '';
}

function CalendarPicker({ goal, selected, onChange }: { goal: Goal; selected: string; onChange: (d: string) => void }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const minDate = new Date(today);
  minDate.setMonth(minDate.getMonth() - 2);

  const canGoPrev = viewYear > minDate.getFullYear() || (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());
  const canGoNext = viewYear < today.getFullYear() || viewMonth < today.getMonth();

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  return (
    <div className="mb-3 rounded-xl p-2.5" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} disabled={!canGoPrev}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-lg disabled:opacity-25 hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)' }}>‹</button>
        <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">{monthLabel}</span>
        <button onClick={nextMonth} disabled={!canGoNext}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-lg disabled:opacity-25 hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)' }}>›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-[9px] text-white/25 font-semibold py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((ds, i) => {
          if (!ds) return <div key={`pad-${i}`}/>;
          const day = parseInt(ds.split('-')[2]);
          const isFuture = ds > todayStr;
          const isSelected = ds === selected;
          const isToday = ds === todayStr;
          const status = getDateStatus(goal, ds);
          const bg = isSelected ? '#f9c923' : statusBg(status, goal.type);
          return (
            <button key={ds} onClick={() => !isFuture && onChange(ds)} disabled={isFuture}
              className="flex items-center justify-center rounded-md text-[11px] font-bold transition-all disabled:opacity-20"
              style={{
                aspectRatio: '1', minHeight: '28px',
                background: bg || 'rgba(255,255,255,0.04)',
                color: isSelected ? '#1a1a1a' : status !== 'empty' ? 'white' : isToday ? '#f9c923' : 'rgba(255,255,255,0.45)',
                border: isToday && !isSelected ? '1px solid rgba(249,201,35,0.4)' : '1px solid transparent',
              }}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- RATE check-in ----
function RateCheckIn({ goal, onSubmit }: { goal: RateGoal; onSubmit: (v: number, n?: string) => void }) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const { current, delta, progressPct, history } = getRateProgress(goal);
  const miniHistory = history.slice(-6);
  const allVals = [goal.startValue, goal.targetValue, ...miniHistory.map(h => h.value)];
  const minV = Math.min(...allVals), maxV = Math.max(...allVals), range = maxV - minV || 1;

  return (
    <div>
      <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black" style={{ fontFamily: 'Black Han Sans', color: '#60a5fa' }}>
            {current !== null ? `${current}${goal.unit}` : '—'}
          </span>
          {delta !== null && (
            <span className="text-sm font-bold" style={{ color: delta >= 0 ? '#4ade80' : '#f87171' }}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}{goal.unit} since start
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/35 mb-1.5">
          <span>Start: {goal.startValue}{goal.unit}</span><span>Target: {goal.targetValue}{goal.unit}</span>
        </div>
        {miniHistory.length > 1 && (
          <svg width="100%" height="32" viewBox="0 0 200 32" preserveAspectRatio="none">
            <polyline points={miniHistory.map((h, i) => `${(i/(miniHistory.length-1))*190+5},${28-((h.value-minV)/range)*24}`).join(' ')}
              fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {miniHistory.map((h, i) => <circle key={i} cx={(i/(miniHistory.length-1))*190+5} cy={28-((h.value-minV)/range)*24} r="2.5" fill="#60a5fa"/>)}
          </svg>
        )}
        <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: progressPct >= 100 ? '#f9c923' : '#60a5fa' }}/>
        </div>
      </div>
      <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Log {goal.unit ? `${goal.unit} ` : ''}value</label>
      <input type="number" step="any" placeholder={`e.g. ${goal.targetValue}`} value={value}
        onChange={e => setValue(e.target.value)} className="w-full mb-3" autoFocus/>
      <textarea placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full resize-none mb-4" rows={2}/>
      <button onClick={() => { if (value) onSubmit(parseFloat(value), note || undefined); }} disabled={!value}
        className="w-full py-2.5 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
        style={{ background: '#f9c923', color: '#1a1a1a', fontFamily: 'Oswald' }}>
        ⚽ LOG RATE
      </button>
    </div>
  );
}

// ---- HABIT check-in ----
function HabitCheckIn({ goal, date, onSubmit }: { goal: HabitGoal; date: string; onSubmit: (c: boolean, n?: string) => void }) {
  const [completed, setCompleted] = useState(true);
  const [note, setNote] = useState('');
  const doneDays = goal.logs.filter(l => l.completed).length;
  const totalDays = goal.logs.length;
  const pct = totalDays === 0 ? 0 : Math.round((doneDays / totalDays) * 100);
  const dateEntry = goal.logs.find(l => l.date === date);

  return (
    <div>
      {totalDays > 0 && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-black" style={{ fontFamily: 'Black Han Sans', color: pct >= 80 ? '#4ade80' : '#60a5fa' }}>{pct}%</span>
            <span className="text-xs text-white/40">{doneDays}/{totalDays} days</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct >= 80 ? '#4ade80' : '#60a5fa' }}/>
          </div>
          {dateEntry && (
            <div className="mt-2 text-xs text-white/40">Already logged: {dateEntry.completed ? '✅ Yes' : '❌ No'} — tap to update</div>
          )}
        </div>
      )}
      <label className="text-xs text-white/50 uppercase tracking-wider mb-3 block">Did you do it?</label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={() => setCompleted(true)}
          className="py-6 rounded-2xl font-black transition-all duration-150"
          style={{ background: completed ? '#16a34a' : 'rgba(255,255,255,0.06)', border: `3px solid ${completed ? '#15803d' : 'rgba(255,255,255,0.1)'}`, color: 'white', transform: completed ? 'scale(1.04)' : 'scale(1)' }}>
          <div className="text-3xl mb-1">✅</div><div className="text-sm" style={{ fontFamily: 'Oswald' }}>YES</div>
        </button>
        <button onClick={() => setCompleted(false)}
          className="py-6 rounded-2xl font-black transition-all duration-150"
          style={{ background: !completed ? '#dc2626' : 'rgba(255,255,255,0.06)', border: `3px solid ${!completed ? '#b91c1c' : 'rgba(255,255,255,0.1)'}`, color: 'white', transform: !completed ? 'scale(1.04)' : 'scale(1)' }}>
          <div className="text-3xl mb-1">❌</div><div className="text-sm" style={{ fontFamily: 'Oswald' }}>NO</div>
        </button>
      </div>
      <textarea placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full resize-none mb-4" rows={2}/>
      <button onClick={() => onSubmit(completed, note || undefined)}
        className="w-full py-2.5 rounded-xl font-black text-sm hover:scale-105 transition-transform"
        style={{ background: '#f9c923', color: '#1a1a1a', fontFamily: 'Oswald' }}>
        ⚽ LOG IT
      </button>
    </div>
  );
}

// ---- CUMULATIVE check-in ----
function CumulativeCheckIn({ goal, onSubmit }: { goal: CumulativeGoal; onSubmit: (a: number, n?: string) => void }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const { total, progressPct } = getCumulativeProgress(goal);

  return (
    <div>
      {total > 0 && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-black" style={{ fontFamily: 'Black Han Sans', color: '#a78bfa' }}>{total} {goal.unit}</span>
            <span className="text-xs text-white/40">of {goal.targetTotal} target</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: progressPct >= 100 ? '#f9c923' : '#a78bfa' }}/>
          </div>
          <div className="text-[10px] text-white/35 mt-1 text-right">{progressPct}% to goal</div>
        </div>
      )}
      <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Log {goal.unit}</label>
      <input type="number" step="any" min="0" placeholder="e.g. 1" value={amount}
        onChange={e => setAmount(e.target.value)} className="w-full mb-3" autoFocus/>
      <textarea placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full resize-none mb-4" rows={2}/>
      <button onClick={() => { if (amount) onSubmit(parseFloat(amount), note || undefined); }} disabled={!amount}
        className="w-full py-2.5 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
        style={{ background: '#f9c923', color: '#1a1a1a', fontFamily: 'Oswald' }}>
        ⚽ LOG {goal.unit.toUpperCase()}
      </button>
    </div>
  );
}

// ---- CONSISTENCY check-in ----
function ConsistencyCheckIn({ goal, onSubmit }: { goal: ConsistencyGoal; onSubmit: (h: number, t: number, n?: string) => void }) {
  const [handled, setHandled] = useState('');
  const [total, setTotal] = useState('');
  const [note, setNote] = useState('');
  const { totalHandled, totalInstances, rate, recentLogs } = getConsistencyProgress(goal);
  const h = parseInt(handled) || 0, t = parseInt(total) || 0;
  const sessionRate = t > 0 ? Math.round((h / t) * 100) : null;

  return (
    <div>
      {totalInstances > 0 && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-baseline justify-between mb-1">
            <div>
              <span className="text-2xl font-black" style={{ fontFamily: 'Black Han Sans', color: rate >= goal.targetRate ? '#f9c923' : '#60a5fa' }}>{rate}%</span>
              <span className="text-xs text-white/40 ml-2">overall hit rate</span>
            </div>
            <span className="text-xs text-white/40">{totalHandled}/{totalInstances} total</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${rate}%`, background: rate >= goal.targetRate ? '#f9c923' : '#4ade80' }}/>
            <div className="h-full flex-1 rounded-r-full" style={{ background: 'rgba(220,38,38,0.4)' }}/>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-white/30">
            <span>✅ {totalHandled} handled</span><span>Target: {goal.targetRate}%</span><span>❌ {totalInstances - totalHandled} missed</span>
          </div>
          {recentLogs.length > 0 && (
            <div className="mt-2 space-y-0.5 border-t border-white/8 pt-2">
              {recentLogs.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] text-white/40">
                  <span>{new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="font-bold text-white/60">{l.handled}/{l.total}</span>
                  <span style={{ color: Math.round((l.handled/l.total)*100) >= goal.targetRate ? '#4ade80' : '#f87171' }}>{Math.round((l.handled/l.total)*100)}%</span>
                  {l.note && <span className="truncate">&quot;{l.note}&quot;</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <label className="text-xs text-white/50 uppercase tracking-wider mb-3 block">Log this session</label>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <div className="text-xs text-white/40 mb-1.5">Handled well ✅</div>
          <input type="number" min="0" placeholder="e.g. 3" value={handled} onChange={e => setHandled(e.target.value)} className="w-full" autoFocus/>
        </div>
        <div>
          <div className="text-xs text-white/40 mb-1.5">Total instances</div>
          <input type="number" min="0" placeholder="e.g. 4" value={total} onChange={e => setTotal(e.target.value)} className="w-full"/>
        </div>
      </div>
      {sessionRate !== null && t > 0 && (
        <div className="text-center mb-3 py-2 rounded-lg text-sm font-bold"
          style={{ background: 'rgba(0,0,0,0.25)', color: sessionRate >= goal.targetRate ? '#4ade80' : '#fb923c' }}>
          This session: {h}/{t} = {sessionRate}%{sessionRate >= goal.targetRate ? ' 🔥 Above target' : ` (target ${goal.targetRate}%)`}
        </div>
      )}
      <textarea placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full resize-none mb-4" rows={2}/>
      <button onClick={() => { if (h > 0 && t > 0 && h <= t) onSubmit(h, t, note || undefined); }} disabled={!(h > 0 && t > 0 && h <= t)}
        className="w-full py-2.5 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
        style={{ background: '#f9c923', color: '#1a1a1a', fontFamily: 'Oswald' }}>
        ⚽ LOG SESSION
      </button>
    </div>
  );
}

export default function CheckInModal({ player, goal, onSubmitRate, onSubmitHabit, onSubmitConsistency, onSubmitCumulative, onClear, onClose }: Props) {
  const [done, setDone] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const isLogged = (goal.logs as { date: string }[]).some(l => l.date === selectedDate);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div className="relative rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl slide-up overflow-y-auto"
        style={{ background: '#0d3b11', border: '2px solid rgba(249,201,35,0.3)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-4 right-4 h-1 rounded-b-sm bg-white/20"/>
        <div className="absolute top-0 left-4 w-1 h-6 rounded-b-sm bg-white/20"/>
        <div className="absolute top-0 right-4 w-1 h-6 rounded-b-sm bg-white/20"/>

        {done && <Celebrating onDone={onClose}/>}

        <div className="flex items-center gap-3 mb-4">
          <AnimalAvatarImg animal={player.avatar} size={44}/>
          <div>
            <div className="font-black text-white text-sm" style={{ fontFamily: 'Oswald' }}>{player.name}</div>
            <div className="text-xs text-white/50">{goal.emoji} {goal.title}</div>
          </div>
          <button onClick={onClose} className="ml-auto text-white/30 hover:text-white text-xl p-1">✕</button>
        </div>

        <CalendarPicker goal={goal} selected={selectedDate} onChange={setSelectedDate}/>

        {isLogged && (
          <button onClick={() => onClear(selectedDate)}
            className="w-full py-1.5 rounded-lg text-xs font-semibold mb-3 transition-colors"
            style={{ background: 'rgba(220,38,38,0.1)', color: 'rgba(248,113,113,0.8)', border: '1px solid rgba(220,38,38,0.2)' }}>
            × Clear {selectedDate === todayStr ? "today's" : "this day's"} entry
          </button>
        )}

        {goal.type === 'rate' && (
          <RateCheckIn goal={goal} onSubmit={(v, n) => { onSubmitRate(v, n, selectedDate); setDone(true); }}/>
        )}
        {goal.type === 'habit' && (
          <HabitCheckIn goal={goal} date={selectedDate} onSubmit={(c, n) => { onSubmitHabit(c, n, selectedDate); setDone(true); }}/>
        )}
        {goal.type === 'consistency' && (
          <ConsistencyCheckIn goal={goal} onSubmit={(h, t, n) => { onSubmitConsistency(h, t, n, selectedDate); setDone(true); }}/>
        )}
        {goal.type === 'cumulative' && (
          <CumulativeCheckIn goal={goal} onSubmit={(a, n) => { onSubmitCumulative(a, n, selectedDate); setDone(true); }}/>
        )}
      </div>
    </div>
  );
}
