import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { getRecentActivity, ActivityItem } from '../lib/supabaseStorage';
import AnimalAvatarImg from '../components/AnimalAvatar';
import { AnimalKind } from '../types';
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
  if (type === 'consistency') return '#fb923c';
  if (type === 'rate') return '#60a5fa';
  if (type === 'cumulative') return '#a78bfa';
  return '#f9c923';
}

export default function Log() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentActivity(50).then(data => { setItems(data); setLoading(false); });
  }, []);

  // Group by date
  const grouped: { date: string; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const date = item.createdAt.slice(0, 10);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== date) grouped.push({ date, items: [item] });
    else last.items.push(item);
  }

  const dateLabel = (d: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = (() => { const x = new Date(); x.setDate(x.getDate() - 1); return x.toISOString().slice(0, 10); })();
    if (d === today) return 'Today';
    if (d === yesterday) return 'Yesterday';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Head>
        <title>Team Log ⚡</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>
      <div className="min-h-screen pitch-bg grass-lines pb-24 md:pb-6">
        <div style={{ background: '#071f09', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#f9c923,#d4a017,#f9c923)' }}/>
          <div className="max-w-lg mx-auto px-4 py-4">
            <h1 className="text-xl font-black text-yellow-400 tracking-widest" style={{ fontFamily: 'Black Han Sans' }}>TEAM LOG</h1>
            <p className="text-white/35 text-[10px] tracking-wider uppercase mt-0.5">Recent activity</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-5">
          {loading ? (
            <div className="flex justify-center py-16"><span className="text-4xl animate-pulse">⚡</span></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-white/30">No activity yet</div>
          ) : (
            <div className="space-y-5">
              {grouped.map(({ date, items: dayItems }) => (
                <div key={date}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 px-1" style={{ fontFamily: 'Oswald' }}>
                    {dateLabel(date)}
                  </div>
                  <div className="space-y-2">
                    {dayItems.map((item, i) => {
                      const color = goalTypeColor(item.goalType);
                      return (
                        <div key={item.id ?? i} className="flex items-center gap-3 px-3 py-3 rounded-xl"
                          style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${color}20` }}>
                          <AnimalAvatarImg animal={item.playerAvatar as AnimalKind} size={38}/>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-white" style={{ fontFamily: 'Oswald' }}>{item.playerName}</span>
                              <span className="text-[9px] text-white/30">·</span>
                              <span className="text-[10px] text-white/50 truncate">{item.goalEmoji} {item.goalTitle}</span>
                            </div>
                            <span className="text-sm font-bold" style={{ color }}>{item.summary}</span>
                          </div>
                          <span className="text-[10px] text-white/25 flex-shrink-0">{timeAgo(item.createdAt)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <TabBar active="log"/>
    </>
  );
}
