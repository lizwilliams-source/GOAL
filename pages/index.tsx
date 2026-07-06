import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AppData, Player, Goal } from '../types';
import * as sb from '../lib/supabaseStorage';
import { getPlayerOverall, getGoalProgress, getHabitProgress, getHabitStreak, getRateProgress, getConsistencyProgress, getCumulativeProgress } from '../lib/storage';
import { HabitGoal, RateGoal, ConsistencyGoal, CumulativeGoal } from '../types';
import OnboardingFlow from '../components/OnboardingFlow';
import PlayerCard from '../components/PlayerCard';
import CheckInModal from '../components/CheckInModal';
import AnimalAvatarImg from '../components/AnimalAvatar';
import SoccerBall from '../components/SoccerBall';
import AddGoalModal from '../components/AddGoalModal';
import TabBar from '../components/TabBar';
import { ActivityItem } from '../lib/supabaseStorage';
import { AnimalKind } from '../types';

function goalBarInfo(goal: Goal): { pct: number; color: string; label: string } {
  if (goal.type === 'habit') {
    const { pct } = getHabitProgress(goal as HabitGoal);
    const c = pct >= 80 ? '#4ade80' : '#60a5fa';
    return { pct, color: c, label: `${pct}%` };
  }
  if (goal.type === 'consistency') {
    const { rate, progressPct } = getConsistencyProgress(goal as ConsistencyGoal);
    const c = progressPct >= 100 ? '#f9c923' : '#fb923c';
    return { pct: progressPct, color: c, label: `${rate}%` };
  }
  if (goal.type === 'rate') {
    const { rate, progressPct } = getRateProgress(goal as RateGoal);
    const c = progressPct >= 100 ? '#f9c923' : '#60a5fa';
    return { pct: progressPct, color: c, label: `${rate}%` };
  }
  if (goal.type === 'cumulative') {
    const { progressPct, onPace } = getCumulativeProgress(goal as CumulativeGoal);
    const c = progressPct >= 100 ? '#f9c923' : onPace ? '#4ade80' : '#a78bfa';
    return { pct: progressPct, color: c, label: onPace ? 'On pace' : `${(goal as CumulativeGoal).targetTotal - getCumulativeProgress(goal as CumulativeGoal).total > 0 ? getCumulativeProgress(goal as CumulativeGoal).total : '✓'}` };
  }
  return { pct: 0, color: '#60a5fa', label: '—' };
}

function PlayerTile({ player, onTap }: { player: Player; onTap: () => void }) {
  const overall = getPlayerOverall(player);
  const complete = player.goals.length > 0 && player.goals.every(g =>
    g.type === 'cumulative' ? getCumulativeProgress(g as CumulativeGoal).progressPct >= 100 : getGoalProgress(g) >= 100
  );
  const cumulativeGoals = player.goals.filter((g): g is CumulativeGoal => g.type === 'cumulative');
  const allCumulativeOnPace = cumulativeGoals.length > 0 && cumulativeGoals.every(g => getCumulativeProgress(g).onPace);
  const habitStreak = player.goals.filter(g => g.type === 'habit').reduce((best, g) => Math.max(best, getHabitStreak(g as HabitGoal).current), 0);
  const bars = player.goals.map(g => ({ ...goalBarInfo(g), emoji: g.emoji }));
  const borderColor = complete ? 'rgba(249,201,35,0.6)' : allCumulativeOnPace ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)';

  return (
    <button onClick={onTap} className="rounded-2xl p-3 flex flex-col items-center gap-2 w-full active:scale-95 transition-transform relative overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.4)', border: `2px solid ${borderColor}` }}>
      <div className="absolute inset-0 pointer-events-none net-texture opacity-10 rounded-2xl"/>
      <div className="relative">
        <AnimalAvatarImg animal={player.avatar} size={56}/>
        {(complete || allCumulativeOnPace) && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-green-900"
            style={{ background: complete ? '#f9c923' : '#4ade80' }}>⚽</div>
        )}
      </div>
      <div className="font-black text-white text-sm text-center leading-tight truncate w-full" style={{ fontFamily:'Oswald' }}>{player.name}</div>
      {bars.length > 0 && (
        <div className="w-full space-y-1">
          {bars.map((b, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[9px] flex-shrink-0 w-3">{b.emoji}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div style={{ width: `${Math.min(100, b.pct)}%`, height: '100%', background: b.color, borderRadius: '999px', transition: 'width 0.7s ease-out' }}/>
              </div>
              <span className="text-[9px] font-bold flex-shrink-0 w-9 text-right" style={{ color: b.color }}>{b.label}</span>
            </div>
          ))}
        </div>
      )}
      {habitStreak > 0 && (
        <div className="text-[9px] font-bold" style={{ color: '#fb923c' }}>🔥 {habitStreak}d streak</div>
      )}
      {bars.length === 0 && <div className="text-[10px] text-white/30">No goals yet</div>}
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkIn, setCheckIn] = useState<{ player: Player; goal: Goal } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [addGoalPlayer, setAddGoalPlayer] = useState<Player | null>(null);
  const [sideActivity, setSideActivity] = useState<ActivityItem[]>([]);

  const refresh = async () => { setData(await sb.loadData()); };

  useEffect(() => {
    refresh();
    sb.getRecentActivity(8).then(setSideActivity);
  }, []);

  const handleOnboardComplete = async (playerData: Omit<Player, 'id' | 'createdAt'>) => {
    const newPlayerId = await sb.createPlayer(playerData);
    const newData = await sb.loadData();
    setData(newData);
    setShowOnboarding(false);
    setExpandedId(newPlayerId);
  };

  const handleClear = async (date: string) => {
    if (!checkIn) return;
    const { player, goal } = checkIn;
    await sb.clearLog(goal.id, goal.type, date);
    const newData = await sb.loadData();
    setData(newData);
    const updatedPlayer = newData.players.find(p => p.id === player.id);
    if (updatedPlayer) {
      const updatedGoal = updatedPlayer.goals.find(g => g.id === goal.id);
      if (updatedGoal) setCheckIn({ player: updatedPlayer, goal: updatedGoal });
    }
  };

  const handleCheckIn = async (fn: () => Promise<void>) => {
    if (!checkIn) return;
    const prevOverall = getPlayerOverall(checkIn.player);
    const playerId = checkIn.player.id;
    await fn();
    const newData = await sb.loadData();
    setData(newData);
    setCheckIn(null);
    const updated = newData.players.find(p => p.id === playerId);
    if (updated && getPlayerOverall(updated) >= 100 && prevOverall < 100) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3000);
    }
  };

  if (!data) return (
    <div className="min-h-screen pitch-bg flex items-center justify-center">
      <SoccerBall size={48} spinning className="opacity-60"/>
    </div>
  );

  if (showOnboarding) return (
    <OnboardingFlow takenAvatars={data.players.map(p => p.avatar)} onComplete={handleOnboardComplete}/>
  );

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthPct = Math.round((today.getDate() / daysInMonth) * 100);
  const teamAvg = data.players.length === 0 ? 0 : Math.round(data.players.reduce((s, p) => s + getPlayerOverall(p), 0) / data.players.length);
  const prevWorkday = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();
  const twoWorkdaysAgo = (() => {
    const d = new Date(); let n = 0;
    while (n < 2) { d.setDate(d.getDate() - 1); if (d.getDay() !== 0 && d.getDay() !== 6) n++; }
    return d.toISOString().split('T')[0];
  })();
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  // Only flag 🚨 if 2+ working days have already elapsed this month
  const canBeReallyBehind = twoWorkdaysAgo >= monthStart;
  const lastLog = (p: Player) => {
    const dates = p.goals.flatMap(g => (g.logs as {date:string}[]).map(l => l.date));
    return dates.length > 0 ? dates.sort().pop()! : null;
  };
  const notLoggedYesterday = data.players.filter(p => {
    if (p.goals.length === 0) return false;
    const last = lastLog(p);
    return !last || last < prevWorkday;
  });

  return (
    <>
      <Head>
        <title>GOOOOOOOOOOOOOOOOOOAL ⚽</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>"/>
      </Head>
      <div className="min-h-screen pitch-bg grass-lines">
        {celebrating && (
          <div className="fixed inset-0 z-40 pointer-events-none flex items-start justify-center pt-20">
            <div className="goal-celebrate text-center">
              <div className="text-7xl mb-2">⚽</div>
              <div className="text-5xl text-yellow-400 tracking-widest" style={{ fontFamily:'Black Han Sans', textShadow:'0 0 30px rgba(249,201,35,0.8)' }}>GOOOOOOAL!</div>
            </div>
          </div>
        )}

        <header style={{ background:'#071f09', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-1.5" style={{ background:'linear-gradient(90deg,#f9c923,#d4a017,#f9c923)' }}/>
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div>
                  <h1 className="text-2xl text-yellow-400 leading-none tracking-widest" style={{ fontFamily:'Black Han Sans', textShadow:'0 1px 10px rgba(249,201,35,0.35)' }}>
                    <span className="sm:hidden">GOOOOOAL</span>
                    <span className="hidden sm:inline">GOOOOOOOOOOOOOOOOOOAL</span>
                  </h1>
                  <p className="text-white/35 text-[10px] tracking-wider uppercase mt-0.5">
                    {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => router.push('/revenue')}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold hover:scale-105 transition-all"
                  style={{ background:'rgba(249,201,35,0.15)', color:'#f9c923', border:'1px solid rgba(249,201,35,0.3)' }}>
                  💰
                </button>
                <button onClick={() => router.push('/dashboard')}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold hover:scale-105 transition-all"
                  style={{ background:'rgba(249,201,35,0.15)', color:'#f9c923', border:'1px solid rgba(249,201,35,0.3)' }}>
                  📊
                </button>
                <button onClick={async () => {
                    if (window.confirm('Reset ALL data? This will delete every player, goal, and log. Cannot be undone.')) {
                      await sb.resetAllData();
                      await refresh();
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold hover:scale-105 transition-all"
                  style={{ background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)' }}>
                  Reset
                </button>
                <button onClick={() => setShowOnboarding(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold hover:scale-105 transition-all"
                  style={{ background:'#f9c923', color:'#1a1a1a' }}>
                  + Add Player
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl p-3" style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(249,201,35,0.15)' }}>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ fontFamily:'Black Han Sans', color: teamAvg>=80?'#f9c923':teamAvg>=50?'#86efac':'#93c5fd' }}>{teamAvg}%</div>
                <div className="text-[9px] text-white/35 uppercase tracking-widest mt-0.5">Team avg</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white/70" style={{ fontFamily:'Black Han Sans' }}>{data.players.length}</div>
                <div className="text-[9px] text-white/35 uppercase tracking-widest mt-0.5">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white/50" style={{ fontFamily:'Black Han Sans' }}>{monthPct}%</div>
                <div className="text-[9px] text-white/35 uppercase tracking-widest mt-0.5">Month</div>
              </div>
            </div>
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width:`${monthPct}%`, background:'rgba(249,201,35,0.5)' }}/>
            </div>
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto px-4 py-6 pb-28 md:pb-6 md:flex md:gap-6 md:items-start">
          <div className="flex-1 min-w-0">
          {notLoggedYesterday.length > 0 && (
            <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.2)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base">⏰</span>
                <span className="text-xs text-white/50">Didn&apos;t log yesterday:</span>
                {notLoggedYesterday.map(p => {
                  const last = lastLog(p);
                  const reallyBehind = canBeReallyBehind && (!last || last < twoWorkdaysAgo);
                  return (
                    <span key={p.id} className="text-xs font-semibold" style={{ color: reallyBehind ? '#f87171' : 'rgba(255,255,255,0.75)' }}>
                      {p.name}{reallyBehind ? ' 🚨' : ''}
                    </span>
                  );
                })}
              </div>
              {canBeReallyBehind && notLoggedYesterday.some(p => { const l = lastLog(p); return !l || l < twoWorkdaysAgo; }) && (
                <div className="text-[10px] text-red-400/60 mt-1 ml-6">🚨 = 2+ days behind</div>
              )}
            </div>
          )}
          {data.players.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background:'rgba(0,0,0,0.25)', border:'2px dashed rgba(255,255,255,0.1)' }}>
              <div className="text-6xl mb-3">⚽</div>
              <div className="text-xl font-black text-white/60 mb-1" style={{ fontFamily:'Oswald' }}>No players yet</div>
              <p className="text-white/30 text-sm mb-6 max-w-xs mx-auto">Add your team and set everyone&apos;s goals.</p>
              <button onClick={() => setShowOnboarding(true)}
                className="px-8 py-3 rounded-xl font-black text-sm hover:scale-105 transition-transform"
                style={{ background:'#f9c923', color:'#1a1a1a', fontFamily:'Oswald', letterSpacing:'0.05em' }}>
                ⚽ ADD FIRST PLAYER
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...data.players].sort((a,b) => getPlayerOverall(b) - getPlayerOverall(a)).map(player => (
                  <PlayerTile key={player.id} player={player} onTap={() => setSelectedPlayerId(player.id)}/>
                ))}
                <button onClick={() => setShowOnboarding(true)}
                  className="rounded-2xl p-3 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background:'rgba(0,0,0,0.2)', border:'2px dashed rgba(249,201,35,0.25)', minHeight:'140px' }}>
                  <span className="text-2xl">➕</span>
                  <span className="text-xs font-bold text-yellow-400/60" style={{ fontFamily:'Oswald' }}>Add Player</span>
                </button>
              </div>
            </>
          )}
          </div>{/* end flex-1 */}

          {/* Desktop sidebar — podium + standings */}
          {data && data.players.length > 0 && (() => {
            const sorted = [...data.players].sort((a,b) => getPlayerOverall(b) - getPlayerOverall(a));
            // Group tied players onto same podium platform
            const groups: Player[][] = [];
            for (const p of sorted) {
              const score = getPlayerOverall(p);
              if (!groups.length || getPlayerOverall(groups[groups.length-1][0]) !== score) groups.push([p]);
              else groups[groups.length-1].push(p);
            }
            const platformGroups = groups.slice(0, 3);
            const rest = groups.slice(3).flat();
            const podiumColors = ['#f9c923','#94a3b8','#cd7c3a'];
            const podiumHeights = [100, 72, 56];
            const medals = ['🥇','🥈','🥉'];
            // Display order: 2nd | 1st | 3rd
            const displayOrder = platformGroups.length === 1
              ? [undefined, platformGroups[0], undefined]
              : platformGroups.length === 2
              ? [platformGroups[1], platformGroups[0], undefined]
              : [platformGroups[1], platformGroups[0], platformGroups[2]];
            return (
              <aside className="hidden md:block w-72 flex-shrink-0 space-y-3">
                {/* Podium */}
                <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background:'rgba(0,0,0,0.35)', border:'2px solid rgba(249,201,35,0.2)' }}>
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage:'repeating-linear-gradient(90deg,transparent,transparent 30px,rgba(255,255,255,0.5) 30px,rgba(255,255,255,0.5) 31px),repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(255,255,255,0.5) 30px,rgba(255,255,255,0.5) 31px)' }}/>
                  <div className="text-xs font-black text-yellow-400/70 uppercase tracking-widest mb-4 relative z-10" style={{ fontFamily:'Oswald' }}>⚽ Podium</div>
                  <div className="flex items-end justify-center gap-1.5 relative z-10">
                    {displayOrder.map((group, si) => {
                      const ri = si === 0 ? 1 : si === 1 ? 0 : 2;
                      const color = podiumColors[ri];
                      const height = podiumHeights[ri];
                      const avatarSize = ri === 0 ? (group && group.length > 1 ? 36 : 52) : (group && group.length > 1 ? 30 : 40);
                      return (
                        <div key={si} className="flex flex-col items-center flex-1">
                          {group ? (
                            <>
                              {ri === 0 && <div className="text-base mb-0.5">👑</div>}
                              <div className={`flex ${group.length > 1 ? 'gap-0.5 flex-wrap justify-center' : ''} mb-1`}>
                                {group.map(p => (
                                  <div key={p.id} className="flex flex-col items-center">
                                    <AnimalAvatarImg animal={p.avatar} size={avatarSize}/>
                                    <div className="text-[8px] font-black text-center truncate mt-0.5" style={{ maxWidth: avatarSize + 4, color }}>{p.name.split(' ')[0]}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs font-black text-center mb-1" style={{ fontFamily:'Black Han Sans', color }}>{getPlayerOverall(group[0])}%</div>
                            </>
                          ) : <div style={{ height: ri === 0 ? 80 : 64 }}/>}
                          <div className="w-full rounded-t-md flex flex-col items-center justify-end pb-2 relative overflow-hidden"
                            style={{ height, background:`linear-gradient(180deg,${color}22,${color}44)`, border:`1.5px solid ${color}55`, borderBottom:'none' }}>
                            <span className="text-lg relative z-10">{medals[ri]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Standings */}
                <div className="rounded-2xl p-4" style={{ background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-xs font-black text-white/50 uppercase tracking-widest mb-3" style={{ fontFamily:'Oswald' }}>📋 Standings</div>
                  <div className="space-y-2">
                    {sorted.map((p, i) => {
                      const score = getPlayerOverall(p);
                      const cumulativeGoals = p.goals.filter((g): g is CumulativeGoal => g.type === 'cumulative');
                      const onPace = cumulativeGoals.length > 0 && cumulativeGoals.every(g => getCumulativeProgress(g).onPace);
                      const color = score >= 100 ? '#f9c923' : onPace ? '#4ade80' : score >= 70 ? '#4ade80' : score >= 40 ? '#60a5fa' : '#a78bfa';
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-white/30 font-bold w-4 text-right flex-shrink-0">{i + 1}</span>
                          <AnimalAvatarImg animal={p.avatar} size={28}/>
                          <span className="text-xs font-bold text-white/80 flex-1 truncate" style={{ fontFamily:'Oswald' }}>{p.name}</span>
                          <span className="text-xs font-black flex-shrink-0" style={{ color, fontFamily:'Oswald' }}>{score}%</span>
                        </div>
                      );
                    })}
                    {rest.map((p, i) => {
                      const score = getPlayerOverall(p);
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-white/30 font-bold w-4 text-right flex-shrink-0">{platformGroups.reduce((s,g) => s+g.length,0) + i + 1}</span>
                          <AnimalAvatarImg animal={p.avatar} size={28}/>
                          <span className="text-xs font-bold text-white/80 flex-1 truncate" style={{ fontFamily:'Oswald' }}>{p.name}</span>
                          <span className="text-xs font-black text-white/50 flex-shrink-0" style={{ fontFamily:'Oswald' }}>{score}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => router.push('/dashboard')}
                    className="mt-3 w-full py-1.5 rounded-lg text-xs font-bold text-center hover:bg-yellow-400/10 transition-colors"
                    style={{ color:'rgba(249,201,35,0.5)', border:'1px solid rgba(249,201,35,0.15)' }}>
                    Full dashboard →
                  </button>
                </div>
              </aside>
            );
          })()}
        </main>
        <TabBar active="home"/>

      </div>

      {/* Player bottom sheet */}
      {selectedPlayerId && (() => {
        const player = data?.players.find(p => p.id === selectedPlayerId);
        if (!player) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-end modal-backdrop" onClick={() => setSelectedPlayerId(null)}>
            <div className="w-full max-w-lg mx-auto rounded-t-3xl overflow-y-auto slide-up"
              style={{ background:'#0a2f0e', border:'2px solid rgba(249,201,35,0.2)', borderBottom:'none', maxHeight:'90svh', paddingBottom:'env(safe-area-inset-bottom, 16px)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20"/>
              </div>
              <div className="px-4 pb-4">
                <PlayerCard player={player}
                  onCheckIn={(p,g) => { setSelectedPlayerId(null); setCheckIn({ player:p, goal:g }); }}
                  onAddGoal={(p) => { setSelectedPlayerId(null); setAddGoalPlayer(p); }}
                  onDeleteGoal={async (p, gid) => { await sb.deleteGoal(gid); await refresh(); }}
                  onDeletePlayer={async (p) => { setSelectedPlayerId(null); await sb.deletePlayer(p.id); await refresh(); }}
                  expanded={true}
                  onToggle={() => setSelectedPlayerId(null)}/>
              </div>
            </div>
          </div>
        );
      })()}

      {checkIn && (
        <CheckInModal
          player={checkIn.player} goal={checkIn.goal}
          onSubmitRate={(made,attempts,n,d) => handleCheckIn(() => sb.logRate(checkIn.goal.id, made, attempts, n, d))}
          onSubmitHabit={(c,n,d) => handleCheckIn(() => sb.logHabit(checkIn.goal.id, c, n, d))}
          onSubmitPto={(d) => handleCheckIn(() => sb.logPto(checkIn.goal.id, d))}
          onSubmitConsistency={(h,t,n,d) => handleCheckIn(() => sb.logConsistency(checkIn.goal.id, h, t, n, d))}
          onSubmitCumulative={(a,n,d) => handleCheckIn(() => sb.logCumulative(checkIn.goal.id, a, n, d))}
          onClear={handleClear}
          onClose={() => setCheckIn(null)}/>
      )}

      {addGoalPlayer && data && (
        <AddGoalModal
          player={addGoalPlayer}
          onAdd={async (goal) => { await sb.addGoal(addGoalPlayer.id, goal); await refresh(); setAddGoalPlayer(null); }}
          onClose={() => setAddGoalPlayer(null)}/>
      )}
    </>
  );
}
