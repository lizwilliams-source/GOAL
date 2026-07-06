import React, { useState } from 'react';
import { AnimalKind, Player, Goal } from '../types';
import AnimalAvatar, { ANIMAL_NAMES, ALL_ANIMALS } from './AnimalAvatar';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  takenAvatars: AnimalKind[];
  onComplete: (player: Omit<Player, 'id' | 'createdAt'>) => void;
}

type Step = 'avatar' | 'name' | 'goals';
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

const EMOJIS = ['🎯','💼','📈','💬','📋','⚡','🔥','💪','🏆','📞','🤝','💰','🚀','⭐','🎪'];

function CustomForm({ slot, onAdd }: { slot: Slot; onAdd: (g: Goal) => void }) {
  const allowedTypes = SLOT_TYPES[slot];
  const [type, setType] = useState<GoalType>(allowedTypes[0]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [unit, setUnit] = useState('');
  const [targetRate, setTargetRate] = useState('15');
  const [targetTotal, setTargetTotal] = useState('');
  const [cumUnit, setCumUnit] = useState('');
  const [cumPeriod, setCumPeriod] = useState<'monthly' | 'weekly'>(slot === 'weekly' ? 'weekly' : 'monthly');

  const submit = () => {
    if (!title.trim()) return;
    const base = { id: uuidv4(), slot, title: title.trim(), description: desc.trim(), emoji, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (type === 'rate')             onAdd({ ...base, type: 'rate', unit: unit||'rate', targetRate: parseInt(targetRate)||15, logs: [] });
    else if (type === 'cumulative') onAdd({ ...base, type: 'cumulative', targetTotal: parseFloat(targetTotal)||100, unit: cumUnit||'items', targetPeriod: cumPeriod, logs: [] });
    else                             onAdd({ ...base, type: 'habit', logs: [] });
  };

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)} className="w-8 h-8 rounded-lg text-base transition-all"
            style={{ background: emoji===e?'rgba(249,201,35,0.2)':'rgba(255,255,255,0.06)', border:`2px solid ${emoji===e?'rgba(249,201,35,0.6)':'transparent'}` }}>{e}</button>
        ))}
      </div>
      <input type="text" placeholder="Goal title" value={title} onChange={e=>setTitle(e.target.value)} className="w-full"/>
      <textarea placeholder="What does success look like?" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full resize-none" rows={2}/>
      {allowedTypes.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {allowedTypes.map(t => (
            <button key={t} onClick={() => setType(t)} className="p-2 rounded-lg text-xs font-bold text-center transition-all"
              style={{ background: type===t?'rgba(249,201,35,0.15)':'rgba(255,255,255,0.06)', border:`2px solid ${type===t?'rgba(249,201,35,0.5)':'transparent'}`, color: type===t?'#f9c923':'rgba(255,255,255,0.5)' }}>
              <div>{TYPE_INFO[t].label}</div>
              <div className="text-[9px] mt-0.5 font-normal opacity-70">{TYPE_INFO[t].desc}</div>
            </button>
          ))}
        </div>
      )}
      {type==='rate' && (
        <div className="grid grid-cols-2 gap-2">
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
        <div className="space-y-2">
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
      <button onClick={submit} disabled={!title.trim()} className="w-full py-2 rounded-lg text-xs font-black disabled:opacity-40" style={{ background:'#f9c923', color:'#1a1a1a' }}>
        Set goal →
      </button>
    </div>
  );
}

function GoalSlot({ label, color, goal, slot, onSelect, onRemove }: {
  label: string; color: string; goal: Goal | null;
  slot: Slot; onSelect: (g: Goal) => void; onRemove: () => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${color}30` }}>
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: `${color}12` }}>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>{label}</span>
        {goal && <span className="text-[10px] text-white/40">✓ set</span>}
      </div>
      <div className="p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {goal ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background:'rgba(0,0,0,0.3)', border:`1px solid ${TYPE_INFO[goal.type as GoalType]?.color}40` }}>
            <span className="text-lg">{goal.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white leading-tight">{goal.title}</div>
              <div className="text-[10px] mt-0.5" style={{ color:TYPE_INFO[goal.type as GoalType]?.color }}>{TYPE_INFO[goal.type as GoalType]?.label}</div>
            </div>
            <button onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors p-1 text-sm">✕</button>
          </div>
        ) : (
          <CustomForm slot={slot} onAdd={onSelect}/>
        )}
      </div>
    </div>
  );
}

export default function OnboardingFlow({ takenAvatars, onComplete }: Props) {
  const [step, setStep] = useState<Step>('avatar');
  const [animal, setAnimal] = useState<AnimalKind | null>(null);
  const [name, setName] = useState('');
  const [dailyGoal, setDailyGoal] = useState<Goal | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<Goal | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState<Goal | null>(null);

  const allSet = !!dailyGoal && !!weeklyGoal && !!monthlyGoal;

  const finish = () => {
    if (!animal || !name.trim() || !allSet) return;
    onComplete({ name: name.trim(), avatar: animal, jerseyColor: '', goals: [dailyGoal!, weeklyGoal!, monthlyGoal!], onboarded: true });
  };

  const stepIdx = step === 'avatar' ? 0 : step === 'name' ? 1 : 2;

  return (
    <div className="min-h-screen pitch-bg grass-lines flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-5">
          <h1 className="text-3xl text-yellow-400 tracking-widest mb-1" style={{ fontFamily:'Black Han Sans', textShadow:'0 2px 16px rgba(249,201,35,0.4)' }}>
            <span className="sm:hidden">GOOOOOAL</span>
            <span className="hidden sm:inline">GOOOOOOOOOOOOOOOOOOAL</span>
          </h1>
          <p className="text-white/35 text-[10px] tracking-widest uppercase">
            {step==='avatar'?'Step 1 of 3 — Pick your player':step==='name'?'Step 2 of 3 — Name your player':'Step 3 of 3 — Set your goals'}
          </p>
          <div className="flex justify-center gap-2 mt-2">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: i===stepIdx?'#f9c923':i<stepIdx?'rgba(249,201,35,0.4)':'rgba(255,255,255,0.15)' }}/>)}
          </div>
        </div>

        {step === 'avatar' && (
          <div className="rounded-2xl p-5 slide-up" style={{ background:'rgba(0,0,0,0.45)', border:'2px solid rgba(249,201,35,0.2)' }}>
            <h2 className="text-base font-black text-white mb-1" style={{ fontFamily:'Black Han Sans' }}>Choose your player</h2>
            <p className="text-white/40 text-xs mb-4">Each person gets a unique character for the month</p>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {ALL_ANIMALS.map(a => {
                const taken = takenAvatars.includes(a);
                const sel = animal === a;
                return (
                  <button key={a} onClick={() => !taken && setAnimal(a)} disabled={taken}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200"
                    style={{ background: sel?'rgba(249,201,35,0.18)':taken?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.06)', border:`2px solid ${sel?'rgba(249,201,35,0.8)':'transparent'}`, opacity:taken?0.35:1, transform:sel?'scale(1.08)':'scale(1)' }}>
                    <AnimalAvatar animal={a} size={56}/>
                    <span className="text-[9px] leading-tight text-center" style={{ color:sel?'#f9c923':'rgba(255,255,255,0.45)' }}>{ANIMAL_NAMES[a]}</span>
                    {taken && <span className="text-[8px] text-red-400">Taken</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => animal && setStep('name')} disabled={!animal}
              className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
              style={{ background:'#f9c923', color:'#1a1a1a', fontFamily:'Oswald', letterSpacing:'0.05em' }}>
              NEXT: NAME YOUR PLAYER →
            </button>
          </div>
        )}

        {step === 'name' && animal && (
          <div className="rounded-2xl p-5 slide-up" style={{ background:'rgba(0,0,0,0.45)', border:'2px solid rgba(249,201,35,0.2)' }}>
            <div className="flex justify-center mb-4">
              <AnimalAvatar animal={animal} size={110}/>
            </div>
            <h2 className="text-base font-black text-white mb-0.5 text-center" style={{ fontFamily:'Black Han Sans' }}>Name your {ANIMAL_NAMES[animal]}</h2>
            <p className="text-white/40 text-xs text-center mb-4">Your name or nickname</p>
            <input type="text" placeholder='e.g. Alex, "The Closer"...' value={name}
              onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&name.trim()&&setStep('goals')}
              className="w-full text-center mb-4" style={{ fontSize:'18px', padding:'12px' }} autoFocus/>
            <div className="flex gap-3">
              <button onClick={() => setStep('avatar')} className="px-4 py-2.5 rounded-xl text-sm text-white/50" style={{ background:'rgba(255,255,255,0.08)' }}>← Back</button>
              <button onClick={() => name.trim()&&setStep('goals')} disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
                style={{ background:'#f9c923', color:'#1a1a1a', fontFamily:'Oswald' }}>
                NEXT: SET GOALS →
              </button>
            </div>
          </div>
        )}

        {step === 'goals' && animal && (
          <div className="rounded-2xl p-5 slide-up overflow-y-auto" style={{ background:'rgba(0,0,0,0.45)', border:'2px solid rgba(249,201,35,0.2)', maxHeight:'90svh' }}>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background:'rgba(0,0,0,0.3)' }}>
              <AnimalAvatar animal={animal} size={56}/>
              <div className="flex-1">
                <div className="font-black text-white" style={{ fontFamily:'Oswald' }}>{name}</div>
                <div className="text-xs text-white/40">{ANIMAL_NAMES[animal]}</div>
              </div>
              <div className="flex gap-1.5 text-sm">
                <span title="Daily" style={{ opacity: dailyGoal ? 1 : 0.3 }}>☀️{dailyGoal ? '✅' : '⬜'}</span>
                <span title="Weekly" style={{ opacity: weeklyGoal ? 1 : 0.3 }}>📅{weeklyGoal ? '✅' : '⬜'}</span>
                <span title="Monthly" style={{ opacity: monthlyGoal ? 1 : 0.3 }}>🗓️{monthlyGoal ? '✅' : '⬜'}</span>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <GoalSlot label="Daily Goal"   color="#4ade80" goal={dailyGoal}   slot="daily"   onSelect={setDailyGoal}   onRemove={() => setDailyGoal(null)}/>
              <GoalSlot label="Weekly Goal"  color="#60a5fa" goal={weeklyGoal}  slot="weekly"  onSelect={setWeeklyGoal}  onRemove={() => setWeeklyGoal(null)}/>
              <GoalSlot label="Monthly Goal" color="#a78bfa" goal={monthlyGoal} slot="monthly" onSelect={setMonthlyGoal} onRemove={() => setMonthlyGoal(null)}/>
            </div>

            <div className="flex gap-3">
              <button onClick={()=>setStep('name')} className="px-4 py-2.5 rounded-xl text-sm text-white/50" style={{ background:'rgba(255,255,255,0.08)' }}>← Back</button>
              <button onClick={finish} disabled={!allSet}
                className="flex-1 py-3 rounded-xl font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform active:scale-95"
                style={{ background: allSet?'#f9c923':'rgba(255,255,255,0.2)', color:'#1a1a1a', fontFamily:'Oswald', letterSpacing:'0.05em' }}>
                ⚽ KICK OFF!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
