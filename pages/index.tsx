import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { AppData, Player, Goal } from '../types';
import * as sb from '../lib/supabaseStorage';
import { getPlayerOverall } from '../lib/storage';
import OnboardingFlow from '../components/OnboardingFlow';
import PlayerCard from '../components/PlayerCard';
import CheckInModal from '../components/CheckInModal';
import AnimalAvatarImg from '../components/AnimalAvatar';
import SoccerBall from '../components/SoccerBall';
import AddGoalModal from '../components/AddGoalModal';

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkIn, setCheckIn] = useState<{ player: Player; goal: Goal } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [addGoalPlayer, setAddGoalPlayer] = useState<Player | null>(null);

  const refresh = async () => { setData(await sb.loadData()); };

  useEffect(() => { refresh(); }, []);

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
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthPct = Math.round((today.getDate() / daysInMonth) * 100);
  const teamAvg = data.players.length === 0 ? 0 : Math.round(data.players.reduce((s, p) => s + getPlayerOverall(p), 0) / data.players.length);

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
                <SoccerBall size={34}/>
                <div>
                  <h1 className="text-2xl text-yellow-400 leading-none tracking-widest" style={{ fontFamily:'Black Han Sans', textShadow:'0 1px 10px rgba(249,201,35,0.35)' }}>GOOOOOOOOOOOOOOOOOOAL</h1>
                  <p className="text-white/35 text-[10px] tracking-wider uppercase mt-0.5">
                    {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowOnboarding(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-bold hover:scale-105 transition-all"
                style={{ background:'#f9c923', color:'#1a1a1a' }}>
                + Add Player
              </button>
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

        <main className="max-w-2xl mx-auto px-4 py-6">
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
              {data.players.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                  {[...data.players].sort((a,b) => getPlayerOverall(b)-getPlayerOverall(a)).map((p,i) => {
                    const pct = getPlayerOverall(p);
                    return (
                      <button key={p.id} onClick={() => setExpandedId(expandedId===p.id?null:p.id)}
                        className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:scale-105"
                        style={{ background:expandedId===p.id?'rgba(249,201,35,0.15)':'rgba(0,0,0,0.3)', border:`2px solid ${expandedId===p.id?'rgba(249,201,35,0.5)':'rgba(255,255,255,0.08)'}`, minWidth:'68px' }}>
                        <div className="relative">
                          <AnimalAvatarImg animal={p.avatar} size={44}/>
                          {i===0 && <div className="absolute -top-2 -right-1 text-sm">👑</div>}
                        </div>
                        <div className="text-[10px] font-bold text-white/80 text-center leading-tight max-w-[64px] truncate">{p.name}</div>
                        <div className="text-[10px] font-black" style={{ fontFamily:'Oswald', color:pct>=100?'#f9c923':'rgba(255,255,255,0.5)' }}>{pct}%</div>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="space-y-3">
                {data.players.map(player => (
                  <PlayerCard key={player.id} player={player}
                    onCheckIn={(p,g) => setCheckIn({ player:p, goal:g })}
                    onAddGoal={(p) => setAddGoalPlayer(p)}
                    onDeleteGoal={async (p, gid) => { await sb.deleteGoal(gid); await refresh(); }}
                    onDeletePlayer={async (p) => { await sb.deletePlayer(p.id); await refresh(); }}
                    expanded={expandedId===player.id}
                    onToggle={() => setExpandedId(expandedId===player.id?null:player.id)}/>
                ))}
              </div>
              <div className="mt-5 text-center">
                <button onClick={() => setShowOnboarding(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background:'rgba(249,201,35,0.1)', color:'#f9c923', border:'2px dashed rgba(249,201,35,0.3)', fontFamily:'Oswald' }}>
                  + ADD TEAMMATE
                </button>
              </div>
            </>
          )}
          <div className="mt-10 text-center">
            <div className="h-px bg-white/8 mb-4"/>
            <div className="inline-flex items-center gap-2 text-white/15 text-[10px] tracking-widest uppercase">
              <SoccerBall size={12}/><span>GOOOOOOOOOOOOOOOOOOAL</span><SoccerBall size={12}/>
            </div>
          </div>
        </main>

        <button onClick={() => setShowOnboarding(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform sm:hidden z-30"
          style={{ background:'#f9c923', boxShadow:'0 4px 20px rgba(249,201,35,0.4)' }}>
          ⚽
        </button>
      </div>

      {checkIn && (
        <CheckInModal
          player={checkIn.player} goal={checkIn.goal}
          onSubmitRate={(v,n,d) => handleCheckIn(() => sb.logRate(checkIn.goal.id, v, n, d))}
          onSubmitHabit={(c,n,d) => handleCheckIn(() => sb.logHabit(checkIn.goal.id, c, n, d))}
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
