import React, { useState } from 'react';
import { Player } from '../types';
import AnimalAvatarImg from './AnimalAvatar';

interface Props {
  player: Player;
  onAdd: (goal: any) => void;
  onClose: () => void;
}

type Slot = 'daily' | 'weekly' | 'monthly';
type GoalType = 'rate' | 'habit' | 'cumulative';

const TYPE_INFO: Record<GoalType, { color: string; label: string; desc: string }> = {
  habit:       { color: '#4ade80', label: '✅ Daily habit',    desc: 'Yes/no each day, track % completion' },
  rate:        { color: '#60a5fa', label: '📈 Rate tracker',  desc: 'Log a number over time, see the delta' },
  cumulative:  { color: '#a78bfa', label: '🔢 Cumulative',     desc: 'Add up totals, track pace vs target' },
};

const SLOT_TYPES: Record<Slot, GoalType[]> = {
  daily:   ['habit'],
  weekly:  ['rate', 'cumulative'],
  monthly: ['rate', 'cumulative'],
};

const SLOT_LABELS: Record<Slot, string> = {
  daily: 'Add your Daily Goal',
  weekly: 'Add your Weekly Goal',
  monthly: 'Add your Monthly Goal',
};

const EMOJIS = ['🎯','💼','📈','💬','📋','⚡','🔥','💪','🏆','📞','🤝','💰','🚀','⭐','🎪'];

export default function AddGoalModal({ player, onAdd, onClose }: Props) {
  const takenSlots = new Set(player.goals.map(g => g.slot));
  const missingSlot: Slot = (['daily', 'weekly', 'monthly'] as Slot[]).find(s => !takenSlots.has(s)) ?? 'daily';
  const allowedTypes = SLOT_TYPES[missingSlot];

  const [type, setType] = useState<GoalType>(allowedTypes[0]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [unit, setUnit] = useState('');
  const [targetRate, setTargetRate] = useState('15');
  const [targetTotal, setTargetTotal] = useState('');
  const [cumUnit, setCumUnit] = useState('');
  const [cumPeriod, setCumPeriod] = useState<'monthly' | 'weekly'>(missingSlot === 'weekly' ? 'weekly' : 'monthly');

  const submit = () => {
    if (!title.trim()) return;
    const base = { slot: missingSlot, title: title.trim(), description: desc.trim(), emoji, logs: [] };
    if (type === 'rate') {
      onAdd({ ...base, type: 'rate', unit: unit||'rate', targetRate: parseInt(targetRate)||15 });
    } else if (type === 'cumulative') {
      onAdd({ ...base, type: 'cumulative', targetTotal: parseFloat(targetTotal)||100, unit: cumUnit||'items', targetPeriod: cumPeriod });
    } else {
      onAdd({ ...base, type: 'habit' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div className="relative rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl slide-up overflow-y-auto"
        style={{ background: '#0d3b11', border: '2px solid rgba(249,201,35,0.3)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="absolute top-0 left-4 right-4 h-1 rounded-b-sm bg-white/20"/>
        <div className="absolute top-0 left-4 w-1 h-6 rounded-b-sm bg-white/20"/>
        <div className="absolute top-0 right-4 w-1 h-6 rounded-b-sm bg-white/20"/>

        <div className="flex items-center gap-3 mb-5">
          <AnimalAvatarImg animal={player.avatar} size={44}/>
          <div className="flex-1">
            <div className="font-black text-white text-sm" style={{ fontFamily: 'Oswald' }}>{player.name}</div>
            <div className="text-xs text-white/50">{SLOT_LABELS[missingSlot]}</div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl p-1">✕</button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)} className="w-8 h-8 rounded-lg text-base transition-all"
              style={{ background: emoji===e?'rgba(249,201,35,0.2)':'rgba(255,255,255,0.06)', border:`2px solid ${emoji===e?'rgba(249,201,35,0.6)':'transparent'}` }}>
              {e}
            </button>
          ))}
        </div>

        <input type="text" placeholder="Goal title" value={title} onChange={e=>setTitle(e.target.value)} className="w-full mb-2" autoFocus/>
        <textarea placeholder="What does success look like?" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full resize-none mb-3" rows={2}/>

        {allowedTypes.length > 1 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {allowedTypes.map(t => (
              <button key={t} onClick={() => setType(t)}
                className="p-2 rounded-lg text-xs font-bold text-center transition-all"
                style={{ background: type===t?'rgba(249,201,35,0.15)':'rgba(255,255,255,0.06)', border:`2px solid ${type===t?'rgba(249,201,35,0.5)':'transparent'}`, color: type===t?'#f9c923':'rgba(255,255,255,0.5)' }}>
                <div>{TYPE_INFO[t].label}</div>
                <div className="text-[9px] mt-0.5 font-normal opacity-70">{TYPE_INFO[t].desc}</div>
              </button>
            ))}
          </div>
        )}

        {type==='rate' && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Target rate (%)</label>
              <input type="number" placeholder="e.g. 15" value={targetRate} onChange={e=>setTargetRate(e.target.value)} className="w-full"/>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Label</label>
              <input type="text" placeholder="e.g. set rate" value={unit} onChange={e=>setUnit(e.target.value)} className="w-full"/>
            </div>
          </div>
        )}
        {type==='cumulative' && (
          <div className="mb-3 space-y-2">
            <div className="flex gap-2">
              {(['monthly', 'weekly'] as const).map(p => (
                <button key={p} onClick={() => setCumPeriod(p)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
                  style={{ background: cumPeriod===p ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${cumPeriod===p ? 'rgba(167,139,250,0.6)' : 'transparent'}`, color: cumPeriod===p ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                  {p}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-white/40 mb-1 block">{cumPeriod === 'weekly' ? 'Weekly' : 'Monthly'} target</label>
                <input type="number" placeholder="e.g. 100" value={targetTotal} onChange={e=>setTargetTotal(e.target.value)} className="w-full"/>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Unit</label>
                <input type="text" placeholder="calls, demos..." value={cumUnit} onChange={e=>setCumUnit(e.target.value)} className="w-full"/>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50" style={{ background:'rgba(255,255,255,0.08)' }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
            style={{ background:'#f9c923', color:'#1a1a1a', fontFamily:'Oswald' }}>
            ⚽ ADD GOAL
          </button>
        </div>
      </div>
    </div>
  );
}
