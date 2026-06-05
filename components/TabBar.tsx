import React from 'react';
import { useRouter } from 'next/router';

type Tab = 'home' | 'dashboard' | 'log';

export default function TabBar({ active }: { active: Tab }) {
  const router = useRouter();
  const tabs: { id: Tab; label: string; icon: string; path: string }[] = [
    { id: 'home',      label: 'Home',      icon: '⚽', path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'log',       label: 'Log',       icon: '⚡', path: '/log' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-40"
      style={{ background: '#071f09', borderTop: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => router.push(tab.path)}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-opacity active:opacity-70">
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-bold tracking-wide"
              style={{ color: active === tab.id ? '#f9c923' : 'rgba(255,255,255,0.35)', fontFamily: 'Oswald' }}>
              {tab.label.toUpperCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
