
import React from 'react';

export const ResistorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 12H10L14 4L22 20L30 4L38 20L42 12H52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CapacitorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 12H22M26 4V20M30 4V20M26 12H30M22 12H26M30 12H52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const InductorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 12H10C10 12 11.25 4 16 4C20.75 4 22 12 22 12C22 12 23.25 4 28 4C32.75 4 34 12 34 12C34 12 35.25 4 40 4C44.75 4 46 12 46 12H52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PowerSourceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M26 6V2M26 22V18M20 12H14M32 12H38M0 12H14M38 12H52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 10L29 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const OscilloscopeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="4" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M18 12H22L24 8L28 16L30 12H34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M0 12H14M38 12H52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CircuitIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h2M8 12h2M14 12h2M20 12h2M5 12V8h2v4H5zM11 12v-2h2v2h-2zM17 12V9h2v3h-2z" />
    </svg>
);

export const SignalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h2l3.5-7 5 14 3.5-7h2" />
    </svg>
);

export const ResetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

export const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5v14l11-7z" />
    </svg>
);
