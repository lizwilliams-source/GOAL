import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Player, CumulativeGoal } from '../types';
import { loadData, ensureRevenueGoal, logCumulative, setRevenueTarget } from '../lib/supabaseStorage';
import { getCumulativeProgress } from '../lib/storage';
import AnimalAvatarImg from '../components/AnimalAvatar';

function playMoneySound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // cha-ching: two quick high notes + a shimmer
    const notes = [1318.5, 1567.98, 1318.5, 2093];
    const times  = [0, 0.08, 0.18, 0.28];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'triangle';
      const t = ctx.currentTime + times[i];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.4);
    });
  } catch { /* audio blocked */ }
}

function formatMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function formatMoneyFull(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

interface MoneyDrop { id: number; x: number; delay: number; size: number; duration: number }

function MoneyRain() {
  const drops: MoneyDrop[] = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.2,
    size: 20 + Math.random() * 24,
    duration: 1.4 + Math.random() * 1,
  }));
  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes moneyfall {
          0%   { transform: translateY(-80px) rotate(-15deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(25deg); opacity: 0; }
        }
      `}</style>
      {drops.map(d => (
        <span key={d.id} style={{
          position: 'absolute',
          left: `${d.x}%`,
          top: 0,
          fontSize: d.size,
          animation: `moneyfall ${d.duration}s ease-in ${d.delay}s forwards`,
          opacity: 0,
        }}>💰</span>
      ))}
    </div>
  );
}

interface LogModalProps {
  player: Player;
  goalId: string | null;
  hasTarget: boolean;
  onClose: () => void;
  onSubmit: (amount: number, note: string, target: number | null) => Promise<void>;
}

function LogModal({ player, goalId, hasTarget, onClose, onSubmit }: LogModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = amount !== '' && parseFloat(amount) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const t = target !== '' ? parseFloat(target) : null;
    await onSubmit(parseFloat(amount), note, t);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end modal-backdrop" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl slide-up"
        style={{ background: '#0a2f0e', border: '2px solid rgba(249,201,35,0.2)', borderBottom: 'none', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20"/>
        </div>
        <div className="px-5 pb-5 pt-2">
          <div className="flex items-center gap-3 mb-4">
            <AnimalAvatarImg animal={player.avatar} size={44}/>
            <div>
              <div className="font-black text-white text-sm" style={{ fontFamily: 'Oswald' }}>{player.name}</div>
              <div className="text-xs text-white/40">Log revenue</div>
            </div>
            <button onClick={onClose} className="ml-auto text-white/30 hover:text-white text-xl p-1">✕</button>
          </div>

          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
              <input
                type="number" min="0" step="any" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full pl-7" autoFocus/>
            </div>
          </div>

          <div className="mb-3">
            <textarea placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
              className="w-full resize-none" rows={2}/>
          </div>

          {!hasTarget && (
            <div className="mb-4">
              <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Monthly target (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                <input type="number" min="0" placeholder="e.g. 50000"
                  value={target} onChange={e => setTarget(e.target.value)}
                  className="w-full pl-7"/>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit || saving}
            className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
            style={{ background: '#f9c923', color: '#1a1a1a', fontFamily: 'Oswald' }}>
            {saving ? '...' : '💰 LOG REVENUE'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditTargetModalProps {
  player: Player;
  goalId: string;
  currentTarget: number;
  onClose: () => void;
  onSave: (target: number) => Promise<void>;
}

function EditTargetModal({ player, currentTarget, onClose, onSave }: EditTargetModalProps) {
  const [target, setTarget] = useState(currentTarget > 0 ? String(currentTarget) : '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end modal-backdrop" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl slide-up"
        style={{ background: '#0a2f0e', border: '2px solid rgba(249,201,35,0.2)', borderBottom: 'none', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20"/>
        </div>
        <div className="px-5 pb-5 pt-2">
          <div className="flex items-center gap-3 mb-4">
            <AnimalAvatarImg animal={player.avatar} size={44}/>
            <div>
              <div className="font-black text-white text-sm" style={{ fontFamily: 'Oswald' }}>{player.name}</div>
              <div className="text-xs text-white/40">Set monthly revenue target</div>
            </div>
            <button onClick={onClose} className="ml-auto text-white/30 hover:text-white text-xl p-1">✕</button>
          </div>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
            <input type="number" min="0" placeholder="e.g. 50000"
              value={target} onChange={e => setTarget(e.target.value)}
              className="w-full pl-7" autoFocus/>
          </div>
          <button onClick={async () => { setSaving(true); await onSave(parseFloat(target) || 0); }}
            disabled={saving || target === ''}
            className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
            style={{ background: '#f9c923', color: '#1a1a1a', fontFamily: 'Oswald' }}>
            {saving ? '...' : 'Save Target'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Revenue() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFor, setLogFor] = useState<Player | null>(null);
  const [editTargetFor, setEditTargetFor] = useState<{ player: Player; goalId: string; target: number } | null>(null);
  const [raining, setRaining] = useState(false);

  const refresh = useCallback(async () => {
    const d = await loadData();
    setPlayers(d.players);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pacePct = Math.round((now.getDate() / daysInMonth) * 100);
  const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const rows = players.map(player => {
    const revenueGoal = player.goals.find(
      (g): g is CumulativeGoal => g.type === 'cumulative' && g.unit === '$'
    ) ?? null;
    const total = revenueGoal ? getCumulativeProgress(revenueGoal).total : 0;
    const target = revenueGoal?.targetTotal ?? 0;
    return { player, revenueGoal, total, target };
  }).sort((a, b) => b.total - a.total);

  const teamTotal = rows.reduce((s, r) => s + r.total, 0);
  const teamTarget = rows.reduce((s, r) => s + r.target, 0);
  const teamPct = teamTarget === 0 ? 0 : Math.min(100, Math.round((teamTotal / teamTarget) * 100));
  const teamOnPace = teamPct >= pacePct;

  const handleLog = async (amount: number, note: string, targetAmount: number | null) => {
    if (!logFor) return;
    const goalId = await ensureRevenueGoal(logFor.id);
    await logCumulative(goalId, amount, note || undefined);
    if (targetAmount !== null && targetAmount > 0) await setRevenueTarget(goalId, targetAmount);
    setLogFor(null);
    await refresh();
    playMoneySound();
    setRaining(true);
    setTimeout(() => setRaining(false), 3000);
  };

  const handleSetTarget = async (target: number) => {
    if (!editTargetFor) return;
    await setRevenueTarget(editTargetFor.goalId, target);
    setEditTargetFor(null);
    await refresh();
  };

  return (
    <>
      <Head>
        <title>Revenue 💰</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>
      {raining && <MoneyRain/>}

      <div className="min-h-screen pitch-bg grass-lines pb-8">
        <div style={{ background: '#071f09', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#f9c923,#d4a017,#f9c923)' }}/>
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => router.push('/')}
                className="text-xs px-2.5 py-1.5 rounded-lg font-bold"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                ← Back
              </button>
              <h1 className="text-2xl font-black text-yellow-400 tracking-widest leading-none" style={{ fontFamily: 'Black Han Sans' }}>
                💰 REVENUE
              </h1>
            </div>
            <p className="text-white/35 text-[10px] tracking-wider uppercase mt-0.5">{month}</p>

            {!loading && teamTotal > 0 && (
              <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(249,201,35,0.15)' }}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Team Total</span>
                  <div className="text-right">
                    <span className="text-lg font-black" style={{ fontFamily: 'Black Han Sans', color: teamTarget > 0 ? (teamOnPace ? '#4ade80' : '#fb923c') : '#f9c923' }}>
                      {formatMoney(teamTotal)}
                    </span>
                    {teamTarget > 0 && <span className="text-xs text-white/30"> / {formatMoney(teamTarget)}</span>}
                  </div>
                </div>
                {teamTarget > 0 && (
                  <>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${teamPct}%`, background: teamPct >= 100 ? '#f9c923' : teamOnPace ? '#4ade80' : '#fb923c' }}/>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-white/25">Pace: {pacePct}%</span>
                      <span className="text-[10px] font-bold" style={{ color: teamOnPace ? '#4ade80' : '#fb923c' }}>{teamPct}% to goal</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="text-5xl animate-pulse">⚽</span>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
            {players.length === 0 && (
              <div className="text-center py-16 text-white/30">No players yet</div>
            )}
            {rows.map((row, i) => {
              const hasTarget = row.target > 0;
              const pct = hasTarget ? Math.min(100, Math.round((row.total / row.target) * 100)) : 0;
              const onPace = pct >= pacePct;
              const barColor = pct >= 100 ? '#f9c923' : onPace ? '#4ade80' : '#fb923c';
              const amountColor = row.total > 0 ? (hasTarget ? barColor : '#f9c923') : 'rgba(255,255,255,0.3)';
              return (
                <div key={row.player.id} className="rounded-2xl p-4"
                  style={{ background: 'rgba(0,0,0,0.35)', border: `1.5px solid ${row.total > 0 ? amountColor + '30' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-white/25 text-xs font-bold w-5 text-center flex-shrink-0">{i + 1}</span>
                    <AnimalAvatarImg animal={row.player.avatar} size={44}/>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-sm leading-tight" style={{ fontFamily: 'Oswald' }}>
                        {row.player.name}
                      </div>
                      {hasTarget && (
                        <div className="text-[10px] mt-0.5 font-bold flex items-center gap-1.5" style={{ color: barColor }}>
                          {pct >= 100 ? '✅ Goal hit!' : onPace ? '✅ On pace' : '⚠️ Behind pace'}
                          <button
                            onClick={() => setEditTargetFor({ player: row.player, goalId: row.revenueGoal!.id, target: row.target })}
                            className="text-white/20 hover:text-white/50 transition-colors text-[10px]">✏️</button>
                        </div>
                      )}
                      {!hasTarget && row.revenueGoal && (
                        <button
                          onClick={() => setEditTargetFor({ player: row.player, goalId: row.revenueGoal!.id, target: 0 })}
                          className="text-[10px] text-white/25 hover:text-white/50 mt-0.5 transition-colors">
                          + Set target
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-black" style={{ fontFamily: 'Black Han Sans', color: amountColor }}>
                          {row.total > 0 ? formatMoney(row.total) : '—'}
                        </div>
                        {hasTarget && <div className="text-[10px] text-white/30">of {formatMoneyFull(row.target)}</div>}
                      </div>
                      <button onClick={() => setLogFor(row.player)}
                        className="py-2 px-3 rounded-xl font-black text-xs hover:scale-105 transition-transform flex-shrink-0"
                        style={{ background: '#f9c923', color: '#1a1a1a', fontFamily: 'Oswald' }}>
                        + Log
                      </button>
                    </div>
                  </div>
                  {hasTarget && (
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }}/>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-white/20">Pace: {pacePct}%</span>
                        <span className="text-[10px] font-bold" style={{ color: barColor }}>{pct}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {logFor && (
        <LogModal
          player={logFor}
          goalId={logFor.goals.find(g => g.type === 'cumulative' && (g as CumulativeGoal).unit === '$')?.id ?? null}
          hasTarget={(logFor.goals.find(g => g.type === 'cumulative' && (g as CumulativeGoal).unit === '$') as CumulativeGoal | undefined)?.targetTotal > 0}
          onClose={() => setLogFor(null)}
          onSubmit={handleLog}/>
      )}

      {editTargetFor && (
        <EditTargetModal
          player={editTargetFor.player}
          goalId={editTargetFor.goalId}
          currentTarget={editTargetFor.target}
          onClose={() => setEditTargetFor(null)}
          onSave={handleSetTarget}/>
      )}
    </>
  );
}
