import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Player, CumulativeGoal } from '../types';
import { loadData } from '../lib/supabaseStorage';
import { getCumulativeProgress } from '../lib/storage';
import AnimalAvatarImg from '../components/AnimalAvatar';

function formatMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function formatMoneyFull(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

export default function Revenue() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData().then(d => { setPlayers(d.players); setLoading(false); });
  }, []);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pacePct = Math.round((now.getDate() / daysInMonth) * 100);
  const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const rows = players.map(player => {
    const revenueGoals = player.goals.filter(
      (g): g is CumulativeGoal => g.type === 'cumulative' && g.unit.startsWith('$')
    );
    const total = revenueGoals.reduce((s, g) => s + getCumulativeProgress(g).total, 0);
    const target = revenueGoals.reduce((s, g) => s + g.targetTotal, 0);
    return { player, revenueGoals, total, target };
  });

  const withGoals = rows.filter(r => r.revenueGoals.length > 0).sort((a, b) => b.total - a.total);
  const withoutGoals = rows.filter(r => r.revenueGoals.length === 0);

  const teamTotal = withGoals.reduce((s, r) => s + r.total, 0);
  const teamTarget = withGoals.reduce((s, r) => s + r.target, 0);
  const teamPct = teamTarget === 0 ? 0 : Math.min(100, Math.round((teamTotal / teamTarget) * 100));
  const teamOnPace = teamPct >= pacePct;

  return (
    <>
      <Head>
        <title>Revenue ⚽</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💰</text></svg>"/>
      </Head>
      <div className="min-h-screen pitch-bg grass-lines pb-24 md:pb-6">
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

            {!loading && teamTarget > 0 && (
              <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(249,201,35,0.15)' }}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Team Total</span>
                  <div className="text-right">
                    <span className="text-lg font-black" style={{ fontFamily: 'Black Han Sans', color: teamPct >= 100 ? '#f9c923' : teamOnPace ? '#4ade80' : '#fb923c' }}>
                      {formatMoney(teamTotal)}
                    </span>
                    <span className="text-xs text-white/30"> / {formatMoney(teamTarget)}</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${teamPct}%`, background: teamPct >= 100 ? '#f9c923' : teamOnPace ? '#4ade80' : '#fb923c' }}/>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-white/25">Pace: {pacePct}%</span>
                  <span className="text-[10px] font-bold" style={{ color: teamOnPace ? '#4ade80' : '#fb923c' }}>{teamPct}% to goal</span>
                </div>
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

            {players.length > 0 && withGoals.length === 0 && (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(0,0,0,0.25)', border: '2px dashed rgba(255,255,255,0.1)' }}>
                <div className="text-4xl mb-2">💰</div>
                <div className="text-white/50 text-sm font-bold mb-1" style={{ fontFamily: 'Oswald' }}>No revenue goals yet</div>
                <p className="text-white/25 text-xs px-4">Add a cumulative goal with unit &quot;$&quot; to start tracking revenue</p>
              </div>
            )}

            {withGoals.map((row, i) => {
              const pct = row.target === 0 ? 0 : Math.min(100, Math.round((row.total / row.target) * 100));
              const onPace = pct >= pacePct;
              const color = pct >= 100 ? '#f9c923' : onPace ? '#4ade80' : '#fb923c';
              return (
                <div key={row.player.id} className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.35)', border: `1.5px solid ${color}30` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-white/30 text-xs font-bold w-5 text-center flex-shrink-0">{i + 1}</span>
                    <AnimalAvatarImg animal={row.player.avatar} size={44}/>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-sm leading-tight" style={{ fontFamily: 'Oswald' }}>
                        {row.player.name}
                      </div>
                      <div className="text-[10px] mt-0.5 font-bold" style={{ color }}>
                        {pct >= 100 ? '✅ Goal hit!' : onPace ? '✅ On pace' : '⚠️ Behind pace'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black" style={{ fontFamily: 'Black Han Sans', color }}>
                        {formatMoney(row.total)}
                      </div>
                      <div className="text-[10px] text-white/30">of {formatMoneyFull(row.target)}</div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }}/>
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-white/25">Pace: {pacePct}%</span>
                    <span className="text-[10px] font-bold" style={{ color }}>{pct}% to goal</span>
                  </div>
                </div>
              );
            })}

            {withoutGoals.length > 0 && withGoals.length > 0 && (
              <div className="text-[10px] text-white/20 uppercase tracking-widest text-center py-2">— No Revenue Goal —</div>
            )}

            {withoutGoals.map(row => (
              <div key={row.player.id} className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <AnimalAvatarImg animal={row.player.avatar} size={36}/>
                <span className="text-sm font-bold text-white/35" style={{ fontFamily: 'Oswald' }}>{row.player.name}</span>
                <span className="ml-auto text-[10px] text-white/20">No revenue goal</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
