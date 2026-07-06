import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Player } from '../types';
import { loadData, getRecentActivity, ActivityItem } from '../lib/supabaseStorage';
import { getPlayerOverall, getGoalProgress, getHabitStreak } from '../lib/storage';
import { HabitGoal } from '../types';
import AnimalAvatarImg from '../components/AnimalAvatar';
import TabBar from '../components/TabBar';
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function goalTypeColor(type: string): string {
  if (type === 'habit') return '#4ade80';
  if (type === 'rate') return '#60a5fa';
  if (type === 'cumulative') return '#a78bfa';
  return '#f9c923';
}

// ---- PODIUM ----
function Podium({ players }: { players: Player[] }) {
  const sorted = [...players].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));

  // Group by score so ties share a platform
  const groups: Player[][] = [];
  for (const p of sorted) {
    const score = getPlayerOverall(p);
    if (groups.length === 0 || getPlayerOverall(groups[groups.length - 1][0]) !== score) {
      groups.push([p]);
    } else {
      groups[groups.length - 1].push(p);
    }
  }

  const platformGroups = groups.slice(0, 3);
  const rest = groups.slice(3).flat();
  const medals = ['🥇','🥈','🥉'];
  const rankLabels = ['1ST','2ND','3RD'];
  const colors = ['#f9c923','#94a3b8','#cd7c3a'];
  const heights = [130, 90, 70];

  // Reorder to 2nd | 1st | 3rd for visual podium
  const displayOrder = platformGroups.length === 1
    ? [undefined, platformGroups[0], undefined]
    : platformGroups.length === 2
    ? [platformGroups[1], platformGroups[0], undefined]
    : [platformGroups[1], platformGroups[0], platformGroups[2]];

  return (
    <div className="rounded-2xl p-6 mb-6 relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)', border: '2px solid rgba(249,201,35,0.2)' }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)' }}/>
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <span className="text-xl">⚽</span>
        <h2 className="text-lg font-black text-yellow-400 tracking-widest" style={{ fontFamily:'Black Han Sans' }}>SQUAD PODIUM</h2>
      </div>
      <div className="flex items-end justify-center gap-2 relative z-10">
        {displayOrder.map((group, slotIdx) => {
          // slotIdx 0=2nd, 1=1st, 2=3rd
          const rankIdx = slotIdx === 0 ? 1 : slotIdx === 1 ? 0 : 2;
          const color = colors[rankIdx];
          const height = heights[rankIdx];
          const medal = medals[rankIdx];
          const label = rankLabels[rankIdx];
          const score = group ? getPlayerOverall(group[0]) : 0;
          const avatarSize = rankIdx === 0 ? (group && group.length > 2 ? 44 : 64) : (group && group.length > 2 ? 36 : 52);
          return (
            <div key={slotIdx} className="flex flex-col items-center" style={{ flex: rankIdx === 0 ? '1.2' : '1' }}>
              {group ? (
                <>
                  {rankIdx === 0 && <div className="text-2xl mb-1">👑</div>}
                  <div className={`flex flex-wrap justify-center gap-1 mb-1 ${group.length > 1 ? 'max-w-[120px]' : ''}`}>
                    {group.map(p => (
                      <div key={p.id} className="flex flex-col items-center">
                        <AnimalAvatarImg animal={p.avatar} size={avatarSize}/>
                        <div className="text-[9px] font-black text-center mt-0.5 truncate" style={{ maxWidth: avatarSize + 8, color }}>{p.name.split(' ')[0]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-black mb-2 text-center" style={{ fontFamily:'Black Han Sans', color }}>{score}%</div>
                </>
              ) : (
                <div style={{ height: rankIdx === 0 ? 100 : 80 }}/>
              )}
              <div className="w-full rounded-t-lg flex flex-col items-center justify-end pb-3 relative overflow-hidden"
                style={{ height, background: `linear-gradient(180deg, ${color}22 0%, ${color}44 100%)`, border: `2px solid ${color}66`, borderBottom: 'none' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 9px)' }}/>
                <span className="text-2xl relative z-10">{medal}</span>
                <span className="text-[10px] font-bold relative z-10 mt-0.5" style={{ color, fontFamily:'Oswald' }}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <div className="mt-4 space-y-1.5 relative z-10">
          {rest.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <span className="text-white/30 text-xs font-bold w-4 text-center">{platformGroups.reduce((s, g) => s + g.length, 0) + i + 1}</span>
              <AnimalAvatarImg animal={p.avatar} size={28}/>
              <span className="text-xs font-bold text-white/70 flex-1" style={{ fontFamily:'Oswald' }}>{p.name}</span>
              <span className="text-xs font-black text-white/50" style={{ fontFamily:'Oswald' }}>{getPlayerOverall(p)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- TEAM STATS ----
function TeamStats({ players }: { players: Player[] }) {
  const avg = players.length === 0 ? 0 : Math.round(players.reduce((s, p) => s + getPlayerOverall(p), 0) / players.length);

  const allGoals = players.flatMap(p => p.goals);
  const hitGoals = allGoals.filter(g => getGoalProgress(g) >= 100).length;
  const totalGoals = allGoals.length;

  const sorted = [...players].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  const topScore = sorted.length > 0 ? getPlayerOverall(sorted[0]) : 0;
  const topScorers = sorted.filter(p => getPlayerOverall(p) === topScore);
  const topScorerLabel = topScorers.map(p => p.name.split(' ')[0]).join(' & ') || '—';

  const bestStreak = players.reduce((best, p) => {
    const s = p.goals.filter(g => g.type === 'habit').map(g => getHabitStreak(g as HabitGoal).current);
    return Math.max(best, ...s, 0);
  }, 0);
  const streakHolders = players.filter(p =>
    p.goals.some(g => g.type === 'habit' && getHabitStreak(g as HabitGoal).current === bestStreak && bestStreak > 0)
  );
  const streakLabel = bestStreak > 0
    ? `🔥 ${bestStreak}d — ${streakHolders.map(p => p.name.split(' ')[0]).join(' & ')}`
    : 'No streak yet';

  const stats = [
    { label: 'Team Avg', value: `${avg}%`, icon: '📊', color: avg >= 70 ? '#4ade80' : avg >= 40 ? '#60a5fa' : '#fb923c' },
    { label: 'Goals Hit', value: `${hitGoals}/${totalGoals}`, icon: '⚽', color: '#f9c923' },
    { label: 'Top Scorer', value: topScorerLabel, icon: '👑', color: '#f9c923' },
    { label: 'Hot Streak', value: streakLabel, icon: '🔥', color: '#fb923c' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {stats.map((s, i) => (
        <div key={i} className="rounded-xl p-4 relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-2xl mb-2">{s.icon}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider mb-0.5">{s.label}</div>
          <div className="text-base font-black truncate" style={{ fontFamily:'Oswald', color: s.color }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ---- PLAYER REPORT CARDS ----
function PlayerCards({ players }: { players: Player[] }) {
  const ranked = [...players].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  return (
    <div className="mb-6">
      <h2 className="text-sm font-black text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>⚽</span> Player Report Cards
      </h2>
      <div className="space-y-2">
        {ranked.map((p, i) => {
          const score = getPlayerOverall(p);
          const color = score >= 100 ? '#f9c923' : score >= 70 ? '#4ade80' : score >= 40 ? '#60a5fa' : '#a78bfa';
          return (
            <div key={p.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${color}25` }}>
              <span className="text-white/30 text-xs font-bold w-5 text-right flex-shrink-0">{i + 1}</span>
              <AnimalAvatarImg animal={p.avatar} size={44}/>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-sm leading-tight" style={{ fontFamily:'Oswald' }}>{p.name}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.goals.map(g => {
                    const pct = getGoalProgress(g);
                    const c = goalTypeColor(g.type);
                    const label = g.type === 'cumulative'
                      ? `${g.emoji} ${pct >= 100 ? '✓' : pct >= 80 ? 'On pace' : 'Behind'}`
                      : `${g.emoji} ${pct}%`;
                    return (
                      <span key={g.id} className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: `${c}15`, color: c, border: `1px solid ${c}30` }}>
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-black" style={{ fontFamily:'Black Han Sans', color }}>{score}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- ACTIVITY FEED ----
function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return (
    <div className="text-center py-8 text-white/25 text-sm">No activity yet this month</div>
  );
  return (
    <div>
      <h2 className="text-sm font-black text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>⚡</span> Recent Activity
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => {
          const color = goalTypeColor(item.goalType);
          return (
            <div key={item.id ?? i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <AnimalAvatarImg animal={item.playerAvatar as import('../types').AnimalKind} size={32}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white/80" style={{ fontFamily:'Oswald' }}>{item.playerName}</span>
                  <span className="text-[9px] text-white/40">·</span>
                  <span className="text-[10px] text-white/50 truncate">{item.goalEmoji} {item.goalTitle}</span>
                </div>
                <span className="text-xs font-bold" style={{ color }}>{item.summary}</span>
              </div>
              <span className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(item.createdAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- GOAL POST SVG ----
function GoalPost() {
  return (
    <svg width="120" height="60" viewBox="0 0 120 60" className="opacity-20">
      <rect x="10" y="10" width="100" height="4" fill="white" rx="2"/>
      <rect x="10" y="10" width="4" height="50" fill="white" rx="2"/>
      <rect x="106" y="10" width="4" height="50" fill="white" rx="2"/>
      {[0,1,2,3,4].map(i => <line key={i} x1={14 + i*18} y1="14" x2={14 + i*20} y2="60" stroke="white" strokeWidth="1" opacity="0.5"/>)}
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadData(), getRecentActivity(25)]).then(([data, feed]) => {
      setPlayers(data.players);
      setActivity(feed);
      setLoading(false);
    });
  }, []);

  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <>
      <Head>
        <title>Squad Dashboard ⚽</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>
      <div className="min-h-screen pitch-bg grass-lines pb-24 md:pb-6">

        {/* Header */}
        <div style={{ background:'#071f09', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-1.5" style={{ background:'linear-gradient(90deg,#f9c923,#d4a017,#f9c923)' }}/>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-yellow-400 tracking-widest leading-none" style={{ fontFamily:'Black Han Sans' }}>SQUAD DASHBOARD</h1>
              <p className="text-white/35 text-[10px] tracking-wider uppercase mt-0.5">{month}</p>
            </div>
            <div className="flex items-center gap-3">
              <GoalPost/>
              <button onClick={() => router.push('/')}
                className="hidden md:block text-xs px-3 py-1.5 rounded-lg font-bold"
                style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)' }}>
                ← Back
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="text-5xl animate-pulse">⚽</span>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6">
            {players.length === 0 ? (
              <div className="text-center py-16 text-white/30">No players yet</div>
            ) : (
              <>
                <Podium players={players}/>
                <TeamStats players={players}/>
                <PlayerCards players={players}/>
                <ActivityFeed items={activity}/>
              </>
            )}
          </div>
        )}
      </div>
      <TabBar active="dashboard"/>
    </>
  );
}
