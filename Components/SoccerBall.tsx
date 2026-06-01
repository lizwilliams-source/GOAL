import React from 'react';

interface SoccerBallProps {
  size?: number;
  className?: string;
  spinning?: boolean;
}

export default function SoccerBall({ size = 32, className = '', spinning = false }: SoccerBallProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${spinning ? 'animate-spin' : ''} ${className}`}
      style={{ display: 'inline-block' }}
    >
      <defs>
        <clipPath id="circle-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      {/* Main ball */}
      <circle cx="50" cy="50" r="48" fill="white" stroke="#ccc" strokeWidth="2" />
      {/* Pentagon pattern */}
      <g clipPath="url(#circle-clip)" fill="#1a1a1a">
        {/* Center pentagon */}
        <polygon points="50,30 63,40 58,55 42,55 37,40" />
        {/* Top left */}
        <polygon points="15,20 28,30 24,45 8,45 3,30" />
        {/* Top right */}
        <polygon points="85,20 98,30 94,45 78,45 73,30" opacity="0.9" />
        {/* Bottom left */}
        <polygon points="15,70 28,60 42,65 38,80 22,82" opacity="0.9" />
        {/* Bottom right */}
        <polygon points="85,70 72,60 58,65 62,80 78,82" opacity="0.9" />
        {/* Bottom center */}
        <polygon points="50,85 37,75 42,62 58,62 63,75" opacity="0.9" />
      </g>
      {/* Shine */}
      <ellipse cx="35" cy="30" rx="12" ry="8" fill="rgba(255,255,255,0.4)" transform="rotate(-30 35 30)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#999" strokeWidth="1.5" />
    </svg>
  );
}
