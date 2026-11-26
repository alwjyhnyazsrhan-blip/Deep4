import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, getDocs, query, where } from 'firebase/firestore';

export interface TribeLevelSpec {
  level: number;
  numberAr: string;
  name: string;
  tag: string;
  points: number;
  dailyPoints: number;
  icon: string;
  accentColor: string;
  bonusDesc: string;
  costToUnlock: number;
}

export const TRIBE_DEPTHS: TribeLevelSpec[] = [
  {
    level: 1,
    numberAr: '١',
    name: 'بوابة الأعماق',
    tag: 'مبتدئ',
    points: 10,
    dailyPoints: 10,
    icon: '⚓',
    accentColor: '#ca8a04',
    bonusDesc: 'فتح أبواب المحيط وزيادة سعة شباك الصيد بنسبة +5% لكافة الأعضاء.',
    costToUnlock: 50000,
  },
  {
    level: 2,
    numberAr: '٢',
    name: 'موج هادئ',
    tag: 'سهل',
    points: 20,
    dailyPoints: 20,
    icon: '🌊',
    accentColor: '#38bdf8',
    bonusDesc: 'استقرار التيارات الساحلية وتخفيض زمن عودة السفن بنسبة 10%.',
    costToUnlock: 120000,
  },
  {
    level: 3,
    numberAr: '٣',
    name: 'صياد الشعاب',
    tag: 'سهل متقدم',
    points: 30,
    dailyPoints: 30,
    icon: '🐟',
    accentColor: '#a855f7',
    bonusDesc: 'زيادة فرص صيد الأسماك النادرة والمرجانية بنسبة +15%.',
    costToUnlock: 250000,
  },
  {
    level: 4,
    numberAr: '٤',
    name: 'حارس الخليج',
    tag: 'متوسط',
    points: 40,
    dailyPoints: 40,
    icon: '🛡️',
    accentColor: '#6366f1',
    bonusDesc: 'درع جماعي يحمي موانئ أعضاء التحالف من الغارات بنسبة 15%.',
    costToUnlock: 450000,
  },
  {
    level: 5,
    numberAr: '٥',
    name: 'سيد التيارات',
    tag: 'متوسط متقدم',
    points: 50,
    dailyPoints: 50,
    icon: '💎',
    accentColor: '#06b6d4',
    bonusDesc: 'مضاعفة أرباح بيع اللؤلؤ والمجوهرات المستخرجة من القاع.',
    costToUnlock: 750000,
  },
  {
    level: 6,
    numberAr: '٦',
    name: 'مستكشف الخنادق',
    tag: 'صعب',
    points: 60,
    dailyPoints: 60,
    icon: '🧭',
    accentColor: '#8b5cf6',
    bonusDesc: 'كشف خنادق المحيط السحيق وزيادة رصيد خبرة التحالف اليومي.',
    costToUnlock: 1200000,
  },
  {
    level: 7,
    numberAr: '٧',
    name: 'محارب الظلمات',
    tag: 'صعب جداً',
    points: 70,
    dailyPoints: 70,
    icon: '⚔️',
    accentColor: '#4f46e5',
    bonusDesc: 'زيادة قوة هجوم المدافع والطوربيدات بنسبة +20% في المعارك البحرية.',
    costToUnlock: 1800000,
  },
  {
    level: 8,
    numberAr: '٨',
    name: 'قاهر الأعاصير',
    tag: 'صعب فائق',
    points: 80,
    dailyPoints: 80,
    icon: '🌪️',
    accentColor: '#0ea5e9',
    bonusDesc: 'حصانة كاملة ضد العواصف البحرية وتضاعف مكافآت الصناديق الغارقة.',
    costToUnlock: 2600000,
  },
  {
    level: 9,
    numberAr: '٩',
    name: 'حوت الأساطير',
    tag: 'أسطوري',
    points: 90,
    dailyPoints: 90,
    icon: '🐉',
    accentColor: '#f59e0b',
    bonusDesc: 'استدعاء حوت الأساطير لجلب كنوز عملاقة يومية لكافة الأعضاء.',
    costToUnlock: 3600000,
  },
  {
    level: 10,
    numberAr: '١٠',
    name: 'عرش ملوك الأعماق',
    tag: 'ملكي أقصى',
    points: 100,
    dailyPoints: 100,
    icon: '👑',
    accentColor: '#eab308',
    bonusDesc: 'التاج والسيادة المطلقة: مضاعفة نقاط القبيلة وتبرعاتها بالكامل!',
    costToUnlock: 5000000,
  },
];

export const toArabicDigits = (val: number | string): string => {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(val).replace(/[0-9]/g, (w) => digits[+w]);
};

// Crisp ornate metallic game icons matching the user's reference screenshot
const GoldenFlagIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))', flexShrink: 0 }}>
    <path d="M18 10V54" stroke="#e9cb88" strokeWidth="5.5" strokeLinecap="round" />
    <circle cx="18" cy="10" r="4.5" fill="#f7dfa3" stroke="#7c5617" strokeWidth="2" />
    <path
      d="M21 13C30 9 39 19 49 14V35C39 40 30 30 21 34V13Z"
      fill="url(#goldFlagGrad)"
      stroke="#6d480e"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="goldFlagGrad" x1="21" y1="12" x2="49" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde9b4" />
        <stop offset="55%" stopColor="#d7ac5d" />
        <stop offset="100%" stopColor="#9c7026" />
      </linearGradient>
    </defs>
  </svg>
);

const GoldenGavelIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))', flexShrink: 0 }}>
    <g transform="rotate(-42 32 32)">
      <rect x="28" y="24" width="8" height="32" rx="4" fill="url(#gavelHandle)" stroke="#62400c" strokeWidth="2" />
      <rect x="14" y="10" width="36" height="17" rx="4.5" fill="url(#gavelHead)" stroke="#62400c" strokeWidth="2.4" />
      <line x1="21" y1="10" x2="21" y2="27" stroke="#62400c" strokeWidth="2" />
      <line x1="43" y1="10" x2="43" y2="27" stroke="#62400c" strokeWidth="2" />
    </g>
    <defs>
      <linearGradient id="gavelHead" x1="14" y1="10" x2="50" y2="27" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fce8b2" />
        <stop offset="55%" stopColor="#d2a556" />
        <stop offset="100%" stopColor="#8d621c" />
      </linearGradient>
      <linearGradient id="gavelHandle" x1="28" y1="24" x2="36" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ecc883" />
        <stop offset="100%" stopColor="#8e6320" />
      </linearGradient>
    </defs>
  </svg>
);

const GoldenHandshakeIcon: React.FC = () => (
  <svg width="56" height="56" viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))', flexShrink: 0 }}>
    <path
      d="M8 28L18 18L29 24L37 18L55 29L46 41L36 47L21 44L8 28Z"
      fill="url(#handshakeGrad)"
      stroke="#5e3a0a"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path d="M24 27L31 22C34 20 38 21 40 24L29 33" stroke="#5e3a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 39L27 34M28 42L33 37M34 44L39 39" stroke="#5e3a0a" strokeWidth="2.2" strokeLinecap="round" />
    <defs>
      <linearGradient id="handshakeGrad" x1="8" y1="18" x2="55" y2="47" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde9b4" />
        <stop offset="55%" stopColor="#d8ab5b" />
        <stop offset="100%" stopColor="#94651c" />
      </linearGradient>
    </defs>
  </svg>
);

const GoldenShieldIcon: React.FC = () => (
  <svg width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))', flexShrink: 0 }}>
    <path
      d="M32 8L52 15V31C52 44 43 52.5 32 57C21 52.5 12 44 12 31V15L32 8Z"
      fill="url(#shieldOuterGrad)"
      stroke="#5c3909"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path
      d="M32 14L46 19V31C46 40.5 39.5 47 32 50.8C24.5 47 18 40.5 18 31V19L32 14Z"
      fill="url(#shieldInnerGrad)"
      stroke="#7a4e13"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M32 14V50.8" stroke="#805315" strokeWidth="1.6" strokeOpacity="0.45" />
    <defs>
      <linearGradient id="shieldOuterGrad" x1="12" y1="8" x2="52" y2="57" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fce8b2" />
        <stop offset="50%" stopColor="#cfa04d" />
        <stop offset="100%" stopColor="#855814" />
      </linearGradient>
      <linearGradient id="shieldInnerGrad" x1="18" y1="14" x2="46" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e7bf73" />
        <stop offset="100%" stopColor="#9d6d22" />
      </linearGradient>
    </defs>
  </svg>
);

const EnvelopeInviteIcon: React.FC = () => (
  <svg width="44" height="38" viewBox="0 0 48 42" fill="none" aria-hidden="true" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.65))', flexShrink: 0 }}>
    {/* Green letter sticking out */}
    <rect x="9" y="5" width="30" height="20" rx="2" fill="#8ad468" stroke="#366b22" strokeWidth="2" />
    <line x1="15" y1="11" x2="33" y2="11" stroke="#366b22" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="16" x2="29" y2="16" stroke="#366b22" strokeWidth="2" strokeLinecap="round" />
    {/* Parchment envelope body */}
    <path d="M4 15H44V37C44 38.6 42.6 40 41 40H7C5.4 40 4 38.6 4 37V15Z" fill="#d9be92" stroke="#5e4324" strokeWidth="2.2" />
    <path d="M4 16L24 30L44 16" stroke="#5e4324" strokeWidth="2.2" strokeLinejoin="round" fill="#cbb082" />
  </svg>
);
const CREATE_TRIBE_COST = 10_000_000;

export const getTribeMaxMembers = (level: number = 1): number => {
  const safeLvl = Math.max(1, Number(level) || 1);
  return 6 + (safeLvl - 1) * 2;
};

export const getTribeLevelTarget = (level: number = 1): number => {
  const safeLvl = Math.max(1, Number(level) || 1);
  return 10000 * Math.pow(2, safeLvl - 1);
};

const TRIBE_EMBLEM_OPTIONS: Array<{ id: string; label: string }> = [
  { id: '⚔️', label: 'السيوف المتقاطعة' },
  { id: '👑', label: 'التاج الملكي' },
  { id: '⚓', label: 'المرساة الذهبية' },
  { id: '🛡️', label: 'درع الحرس' },
  { id: '🐉', label: 'التنين البحري' },
  { id: '🦈', label: 'القرش الأبيض' },
  { id: '💎', label: 'جوهرة الأعماق' },
  { id: '🧭', label: 'بوصلة القبطان' },
];

const TribeEmblemCrest: React.FC<{ emblem?: string; size?: number; fieryGlow?: boolean }> = ({
  emblem = '⚔️',
  size = 152,
  fieryGlow = false,
}) => {
  const safeEmblem = emblem || '⚔️';
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      style={{
        filter: fieryGlow
          ? 'drop-shadow(0 0 14px rgba(249, 115, 22, 0.85)) drop-shadow(0 0 26px rgba(234, 88, 12, 0.5)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.9))'
          : 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.85))',
        flexShrink: 0,
        display: 'block',
      }}
    >
      <defs>
        <linearGradient id={`starGold-${uid}`} x1="18" y1="18" x2="142" y2="142" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8e0a4" />
          <stop offset="45%" stopColor="#c79b52" />
          <stop offset="100%" stopColor="#724e1e" />
        </linearGradient>
        <linearGradient id={`starInner-${uid}`} x1="30" y1="30" x2="130" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4c3823" />
          <stop offset="100%" stopColor="#1e150c" />
        </linearGradient>
        <linearGradient id={`steelBlade-${uid}`} x1="40" y1="26" x2="120" y2="126" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="48%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={`shieldFace-${uid}`} x1="48" y1="36" x2="112" y2="122" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#52463a" />
          <stop offset="50%" stopColor="#2e2720" />
          <stop offset="100%" stopColor="#191511" />
        </linearGradient>
      </defs>

      {/* 8-Point Ornate Star Crest Backing */}
      <rect
        x="26"
        y="26"
        width="108"
        height="108"
        rx="10"
        fill={`url(#starGold-${uid})`}
        stroke="#4f3513"
        strokeWidth="3"
      />
      <rect
        x="26"
        y="26"
        width="108"
        height="108"
        rx="10"
        transform="rotate(45 80 80)"
        fill={`url(#starGold-${uid})`}
        stroke="#4f3513"
        strokeWidth="3"
      />
      <rect
        x="35"
        y="35"
        width="90"
        height="90"
        rx="8"
        fill={`url(#starInner-${uid})`}
        stroke="#e6c478"
        strokeWidth="2"
      />
      <rect
        x="35"
        y="35"
        width="90"
        height="90"
        rx="8"
        transform="rotate(45 80 80)"
        fill={`url(#starInner-${uid})`}
        stroke="#c5994d"
        strokeWidth="1.6"
      />
      <circle cx="80" cy="80" r="46" fill="#231910" stroke="#b98f49" strokeWidth="2.5" />

      {/* Center Heater Shield */}
      <path
        d="M80 39L111 48V78C111 99 98 113 80 122C62 113 49 99 49 78V48L80 39Z"
        fill={`url(#shieldFace-${uid})`}
        stroke={`url(#starGold-${uid})`}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M80 46L104 53V77C104 94 94 106 80 113C66 106 56 94 56 77V53L80 46Z"
        fill="none"
        stroke="#c59c56"
        strokeWidth="1.6"
        strokeOpacity="0.65"
      />
      <path d="M80 46V113" stroke="#d8b56c" strokeWidth="1.4" strokeOpacity="0.35" />

      {/* Emblem Iconography */}
      {safeEmblem === '⚔️' ? (
        <g>
          {/* Left-to-Right Crossed Sword */}
          <path d="M40 38L52 42L108 104L101 111L44 49L40 38Z" fill={`url(#steelBlade-${uid})`} stroke="#1e293b" strokeWidth="2" strokeLinejoin="round" />
          <path d="M42 40L104 107" stroke="#ffffff" strokeWidth="1.3" strokeOpacity="0.7" />
          <path d="M96 114L116 94" stroke={`url(#starGold-${uid})`} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M105 106L119 121" stroke="#855814" strokeWidth="6" strokeLinecap="round" />
          <circle cx="121" cy="123" r="4.5" fill={`url(#starGold-${uid})`} stroke="#4b320d" strokeWidth="1.5" />

          {/* Right-to-Left Crossed Sword */}
          <path d="M120 38L108 42L52 104L59 111L116 49L120 38Z" fill={`url(#steelBlade-${uid})`} stroke="#1e293b" strokeWidth="2" strokeLinejoin="round" />
          <path d="M118 40L56 107" stroke="#ffffff" strokeWidth="1.3" strokeOpacity="0.7" />
          <path d="M64 114L44 94" stroke={`url(#starGold-${uid})`} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M55 106L41 121" stroke="#855814" strokeWidth="6" strokeLinecap="round" />
          <circle cx="39" cy="123" r="4.5" fill={`url(#starGold-${uid})`} stroke="#4b320d" strokeWidth="1.5" />
        </g>
      ) : (
        <text
          x="80"
          y="91"
          textAnchor="middle"
          fontSize="44"
          style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.85))' }}
        >
          {safeEmblem}
        </text>
      )}
    </svg>
  );
};

const GoldCoinBadgeIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.75))' }}>
    <circle cx="16" cy="16" r="13.5" fill="url(#coinOuter)" stroke="#78350f" strokeWidth="2" />
    <circle cx="16" cy="16" r="9.5" fill="url(#coinInner)" stroke="#fef08a" strokeWidth="1.4" />
    <path d="M16 10V22M12.5 13.5C12.5 11.8 14 11 16 11C18 11 19.5 11.8 19.5 13.2C19.5 15 16 15.5 16 17.5C16 19.5 19.5 19.5 19.5 21" stroke="#78350f" strokeWidth="2.1" strokeLinecap="round" />
    <defs>
      <linearGradient id="coinOuter" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="55%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
      <linearGradient id="coinInner" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
    </defs>
  </svg>
);

const RoyalLeaderCrownIcon: React.FC = () => (
  <svg
    width="140"
    height="88"
    viewBox="0 0 120 76"
    fill="none"
    aria-hidden="true"
    style={{
      flexShrink: 0,
      filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.92))',
    }}
  >
    <defs>
      <linearGradient id="crownGoldGrad" x1="12" y1="8" x2="108" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="42%" stopColor="#e3a93c" />
        <stop offset="100%" stopColor="#8f5814" />
      </linearGradient>
      <linearGradient id="crownVelvetGrad" x1="60" y1="16" x2="60" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e11d48" />
        <stop offset="55%" stopColor="#9f1239" />
        <stop offset="100%" stopColor="#4c0519" />
      </linearGradient>
    </defs>
    {/* Velvet dome */}
    <path
      d="M24 54C20 34 32 18 60 18C88 18 100 34 96 54H24Z"
      fill="url(#crownVelvetGrad)"
      stroke="#5c360b"
      strokeWidth="2.5"
    />
    {/* Top orb & cross */}
    <path d="M60 4V17M54 9H66" stroke="url(#crownGoldGrad)" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="60" cy="18" r="5" fill="url(#crownGoldGrad)" stroke="#5c360b" strokeWidth="1.8" />
    {/* Crown spikes & arches */}
    <path
      d="M14 26L28 48L44 20L60 45L76 20L92 48L106 26L99 58H21L14 26Z"
      fill="url(#crownGoldGrad)"
      stroke="#5c360b"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    {/* Crown rim */}
    <rect x="20" y="54" width="80" height="14" rx="5" fill="url(#crownGoldGrad)" stroke="#5c360b" strokeWidth="2.4" />
    {/* Tip pearls */}
    <circle cx="13" cy="24" r="4.5" fill="#fde68a" stroke="#6b410e" strokeWidth="1.8" />
    <circle cx="44" cy="18" r="4.5" fill="#fde68a" stroke="#6b410e" strokeWidth="1.8" />
    <circle cx="76" cy="18" r="4.5" fill="#fde68a" stroke="#6b410e" strokeWidth="1.8" />
    <circle cx="107" cy="24" r="4.5" fill="#fde68a" stroke="#6b410e" strokeWidth="1.8" />
    {/* Gems along the rim */}
    <ellipse cx="36" cy="61" rx="5.5" ry="4" fill="#38bdf8" stroke="#0c4a6e" strokeWidth="1.4" />
    <ellipse cx="60" cy="61" rx="6.5" ry="4.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.4" />
    <ellipse cx="84" cy="61" rx="5.5" ry="4" fill="#22c55e" stroke="#14532d" strokeWidth="1.4" />
  </svg>
);

const SpikedMemberAvatarFrame: React.FC<{ avatar?: string; photoURL?: string; name: string }> = ({
  avatar,
  photoURL,
  name,
}) => {
  const isImageAvatar = Boolean(
    photoURL ||
      (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('/')))
  );
  const imgSrc = photoURL || (isImageAvatar ? avatar : '');

  return (
    <div
      style={{
        position: 'relative',
        width: '124px',
        height: '124px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ornate Spiked Bronze Ring SVG */}
      <svg
        width="124"
        height="124"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.92))',
        }}
      >
        <defs>
          <linearGradient id="spikedBronzeRing" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f3d494" />
            <stop offset="48%" stopColor="#b98e4c" />
            <stop offset="100%" stopColor="#63451d" />
          </linearGradient>
        </defs>
        {/* Warrior spikes around the ring */}
        <path
          d="M50 3L55 13L69 7L67 18L84 16L78 27L94 33L84 43L97 54L85 62L92 76L79 78L80 91L67 87L61 97L50 90L39 97L33 87L20 91L21 78L8 76L15 62L3 54L16 43L6 33L22 27L16 16L33 18L31 7L45 13Z"
          fill="url(#spikedBronzeRing)"
          stroke="#3b260b"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="50" r="37" fill="#100d0a" stroke="#e2ba6d" strokeWidth="2.8" />
        <circle cx="50" cy="50" r="33" fill="#090807" stroke="#5d421c" strokeWidth="1.5" />
      </svg>

      {/* Inner Avatar Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '88px',
          height: '88px',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 35% 30%, #26211c 0%, #090807 100%)',
        }}
      >
        {isImageAvatar && imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: '48px', lineHeight: 1 }}>{avatar || '⚓'}</span>
        )}
      </div>
    </div>
  );
};
interface TribeViewProps {
  onClose: () => void;
  tribeId: string;
  setTribeId: React.Dispatch<React.SetStateAction<string>>;
  tribeName: string;
  setTribeName: React.Dispatch<React.SetStateAction<string>>;
  tribes: any[];
  setTribes?: React.Dispatch<React.SetStateAction<any[]>>;
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  gems: number;
  setGems: React.Dispatch<React.SetStateAction<number>>;
  currentUser: any;
  username: string;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  sendChatMessage?: (sender: string, avatar: string, text: string) => void;
  realPlayers?: any[];
  joinTribe?: (targetTribe: any) => Promise<void>;
  donateToTribe?: (targetTribe: any) => Promise<void>;
}

type TribeScreenMode = 'menu' | 'create' | 'join' | 'invitations' | 'manage' | 'donations' | 'levels';
type TribeManageTab = 'info' | 'members' | 'message' | 'private';

export default function TribeView({
  onClose,
  tribeId,
  setTribeId,
  tribeName,
  setTribeName,
  tribes,
  setTribes,
  gold,
  setGold,
  currentUser,
  username,
  showToast,
  sendChatMessage,
  realPlayers = [],
  joinTribe,
}: TribeViewProps) {
  const hasJoinedTribe = Boolean(tribeId && tribeId.trim().length > 0);
  const [screenMode, setScreenMode] = useState<TribeScreenMode>(() => (hasJoinedTribe ? 'manage' : 'menu'));
  const [manageTab, setManageTab] = useState<TribeManageTab>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [tribeSearchQuery, setTribeSearchQuery] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({ 1: true });
  const [newTribeNameInput, setNewTribeNameInput] = useState('');
  const [newTribeDescInput, setNewTribeDescInput] = useState('');
  const [newTribeEmblemInput, setNewTribeEmblemInput] = useState('⚔️');
  const [showEmblemPicker, setShowEmblemPicker] = useState(false);
  const [customDonationAmount, setCustomDonationAmount] = useState<number>(500);
  const [isEditingTribeName, setIsEditingTribeName] = useState(false);
  const [editTribeNameInput, setEditTribeNameInput] = useState('');
  const [showManageEmblemPicker, setShowManageEmblemPicker] = useState(false);
  const [showJoinInvitesPanel, setShowJoinInvitesPanel] = useState(false);
  const [statementDraft, setStatementDraft] = useState('');
  const [myTribeDonations, setMyTribeDonations] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('pirate_my_tribe_donations') || '0') || 0;
    } catch {
      return 0;
    }
  });
  const [invitedPlayerIds, setInvitedPlayerIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pirate_tribe_invites') || '[]');
    } catch {
      return [];
    }
  });
  const [tribeMessageInput, setTribeMessageInput] = useState('');
  const [tribeAnnouncements, setTribeAnnouncements] = useState<Array<{ id: string; sender: string; text: string; time: string }>>([]);

  // Sync initial screen if membership state changes externally
  useEffect(() => {
    if (!hasJoinedTribe && (screenMode === 'manage' || screenMode === 'donations' || screenMode === 'levels')) {
      setScreenMode('menu');
    }
  }, [hasJoinedTribe, screenMode]);

  // Seed default official tribe into directory list if empty (does NOT auto-enroll the player)
  useEffect(() => {
    const officialExists = tribes.some((t) => t.name === 'ملوك الأعماق' || t.id === 'official_depth_kings');
    if (officialExists) return;

    try {
      const stored = localStorage.getItem('pirate_local_tribes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (setTribes) {
            setTribes((prev) => {
              const map = new Map();
              [...prev, ...parsed].forEach((t) => map.set(t.id, t));
              return Array.from(map.values());
            });
          }
          return;
        }
      }
    } catch {}

    const realCreatedAt = new Date().toISOString();
    const officialTribe = {
      id: 'official_depth_kings',
      name: 'ملوك الأعماق',
      description: 'سجل قبيلة واحدة • عشرة أعماق — من بوابة الأعماق إلى العرش',
      emblem: '👑',
      leaderId: 'official',
      leaderName: 'قبطان الأعماق',
      level: 10,
      power: 550,
      donations: 550,
      membersCount: 1,
      members: [],
      lastUpdated: realCreatedAt,
      createdAt: realCreatedAt,
    };

    if (setTribes) {
      setTribes((prev) => {
        if (prev.some((t) => t.name === 'ملوك الأعماق')) return prev;
        return [officialTribe, ...prev];
      });
    }

    try {
      const curList = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
      if (!curList.some((t: any) => t.name === 'ملوك الأعماق')) {
        localStorage.setItem('pirate_local_tribes', JSON.stringify([officialTribe, ...curList]));
      }
    } catch {}

    if (currentUser?.uid) {
      try {
        const q = query(collection(db, 'tribes'), where('name', '==', 'ملوك الأعماق'));
        getDocs(q)
          .then((snap) => {
            if (snap.empty) {
              addDoc(collection(db, 'tribes'), officialTribe).catch(() => {});
            }
          })
          .catch(() => {});
      } catch {}
    }
  }, [tribes, currentUser?.uid, setTribes]);

  const currentTribe = useMemo(() => {
    if (!hasJoinedTribe) return null;
    const found = tribes.find((t) => t.id === tribeId);
    if (found) return found;
    return {
      id: tribeId,
      name: tribeName || 'قبيلتي',
      description: 'كن قائداً، اجمع أصدقاءك، لتغزو العالم',
      statement: '',
      emblem: '⚔️',
      leaderId: currentUser?.uid || 'captain',
      leaderName: username || 'القبطان',
      level: 1,
      power: 10,
      donations: 0,
      membersCount: 1,
      maxMembers: 6,
      members: currentUser?.uid ? [currentUser.uid] : [],
      lastUpdated: new Date().toISOString(),
    };
  }, [hasJoinedTribe, tribeId, tribes, tribeName, currentUser?.uid, username]);

  useEffect(() => {
    if (currentTribe) {
      setStatementDraft(currentTribe.statement || '');
      setEditTribeNameInput(currentTribe.name || '');
    }
  }, [currentTribe?.id, currentTribe?.statement, currentTribe?.name]);

  const currentTribeLevel = Math.max(1, Number(currentTribe?.level) || 1);
  const currentTribeMaxMembers = getTribeMaxMembers(currentTribeLevel);
  const currentTribeMembersCount = Math.max(
    1,
    Number(currentTribe?.membersCount) || (Array.isArray(currentTribe?.members) ? currentTribe.members.length : 1)
  );
  const currentTribeTarget = getTribeLevelTarget(currentTribeLevel);
  const currentTribeDonations = Math.max(0, Number(currentTribe?.donations) || 0);
  const currentTribeRank = useMemo(() => {
    if (!currentTribe || tribes.length === 0) return 50;
    const sorted = [...tribes].sort((a, b) => (b.power || 0) - (a.power || 0));
    const idx = sorted.findIndex((t) => t.id === currentTribe.id);
    return idx >= 0 ? idx + 1 : 50;
  }, [tribes, currentTribe]);

  const invitationsCount = 0;

  const totalBalancePoints = useMemo(() => {
    if (!currentTribe) return 0;
    if (typeof currentTribe.power === 'number' && currentTribe.power > 0) {
      return currentTribe.power;
    }
    const lvl = currentTribe.level || 1;
    return TRIBE_DEPTHS.filter((d) => d.level <= lvl).reduce((sum, d) => sum + d.points, 0);
  }, [currentTribe]);

  const totalDailyAddition = useMemo(() => {
    if (!currentTribe) return 10;
    const lvl = currentTribe.level || 1;
    return TRIBE_DEPTHS.filter((d) => d.level <= lvl).reduce((sum, d) => sum + d.dailyPoints, 0);
  }, [currentTribe]);

  const realTribeDonors = useMemo(() => {
    if (!currentTribe) return [];
    const membersIds = Array.isArray(currentTribe.members) ? currentTribe.members : [];
    const matched = realPlayers.filter((p) => {
      const pId = p.userId || p.id;
      return membersIds.includes(pId) || p.tribeId === currentTribe.id;
    });

    if (matched.length === 0 && currentUser) {
      const myAmount = Math.max(myTribeDonations, Number(currentTribe.donations) || 0);
      return [
        {
          id: currentUser.uid,
          name: username || 'القبطان',
          avatar: '👑',
          photoURL: currentUser.photoURL || '',
          donations: myAmount,
          points: myAmount,
          isLeader: true,
        },
      ];
    }

    const mapped = matched.map((p) => {
      const pId = p.userId || p.id;
      const isMe = Boolean(currentUser?.uid && pId === currentUser.uid);
      const rawDonations = Number(p.tribeDonations ?? p.donations ?? 0) || 0;
      const memberDonations = isMe ? Math.max(rawDonations, myTribeDonations) : rawDonations;
      const isLeader = Boolean(
        pId === currentTribe.leaderId ||
          (currentTribe.leaderName && p.username === currentTribe.leaderName)
      );
      return {
        id: pId,
        name: p.username || 'قبطان_مجهول',
        avatar: p.avatar || '⚓',
        photoURL: p.photoURL || (isMe ? currentUser?.photoURL || '' : ''),
        donations: memberDonations,
        points: memberDonations,
        isLeader,
      };
    });

    mapped.sort((a, b) => {
      if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1;
      return b.donations - a.donations;
    });
    return mapped;
  }, [currentTribe, realPlayers, currentUser, username, myTribeDonations]);

  const filteredTribes = useMemo(() => {
    if (!tribeSearchQuery.trim()) return tribes;
    const q = tribeSearchQuery.trim().toLowerCase();
    return tribes.filter(
      (t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.leaderName || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
    );
  }, [tribes, tribeSearchQuery]);

  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return TRIBE_DEPTHS;
    const q = searchQuery.trim().toLowerCase();
    return TRIBE_DEPTHS.filter(
      (lvl) =>
        lvl.name.toLowerCase().includes(q) ||
        lvl.tag.toLowerCase().includes(q) ||
        String(lvl.level).includes(q) ||
        lvl.numberAr.includes(q)
    );
  }, [searchQuery]);

  const toggleLevelExpand = (lvl: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [lvl]: !prev[lvl],
    }));
  };

  const updateActiveTribeFields = async (patch: Record<string, any>) => {
    if (!currentTribe?.id) return;
    const nowIso = new Date().toISOString();
    const fullPatch = { ...patch, lastUpdated: nowIso };
    if (setTribes) {
      setTribes((prev) =>
        prev.map((t) => (t.id === currentTribe.id ? { ...t, ...fullPatch } : t))
      );
    }
    try {
      const stored = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
      const exists = stored.some((t: any) => t.id === currentTribe.id);
      const updated = exists
        ? stored.map((t: any) => (t.id === currentTribe.id ? { ...t, ...fullPatch } : t))
        : [{ ...currentTribe, ...fullPatch }, ...stored];
      localStorage.setItem('pirate_local_tribes', JSON.stringify(updated));
    } catch {}
    try {
      await updateDoc(doc(db, 'tribes', currentTribe.id), fullPatch);
    } catch {}
  };

  const handleSaveTribeName = async () => {
    const trimmed = editTribeNameInput.trim().slice(0, 50);
    if (!trimmed) {
      if (showToast) showToast('⚠️ يرجى كتابة اسم القبيلة أولاً!', 'error');
      return;
    }
    setTribeName(trimmed);
    try {
      localStorage.setItem('pirate_tribe_name', trimmed);
    } catch {}
    if (currentUser?.uid) {
      updateDoc(doc(db, 'users', currentUser.uid), { tribeName: trimmed }).catch(() => {});
    }
    await updateActiveTribeFields({ name: trimmed });
    setIsEditingTribeName(false);
    if (showToast) showToast(`✅ تم تغيير اسم القبيلة إلى [${trimmed}].`, 'success');
  };

  const handleChangeManageEmblem = async (emblemId: string) => {
    await updateActiveTribeFields({ emblem: emblemId });
    setShowManageEmblemPicker(false);
    if (showToast) showToast('✅ تم تحديث شعار القبيلة بنجاح.', 'success');
  };

  const handleSaveStatement = async () => {
    const trimmed = statementDraft.trim().slice(0, 500);
    await updateActiveTribeFields({ statement: trimmed });
    if (showToast) showToast('✅ تم حفظ تصريح القبيلة.', 'success');
  };

  const handleInvitePlayer = (player: any) => {
    const pId = player.userId || player.id;
    if (!pId) return;
    if (currentTribeMembersCount >= currentTribeMaxMembers) {
      if (showToast) {
        showToast(`⚠️ اكتمل عدد أعضاء القبيلة في المستوى ${currentTribeLevel} (${currentTribeMaxMembers} أعضاء)!`, 'error');
      }
      return;
    }
    if (!invitedPlayerIds.includes(pId)) {
      const next = [...invitedPlayerIds, pId];
      setInvitedPlayerIds(next);
      try {
        localStorage.setItem('pirate_tribe_invites', JSON.stringify(next));
      } catch {}
    }
    if (showToast) showToast(`📩 تم إرسال دعوة انضمام إلى القبطان @${player.username || 'اللاعب'}!`, 'success');
  };

  const handleRealDonate = async (amount: number) => {
    if (gold < amount) {
      if (showToast) showToast('⚠️ الذهب غير كافٍ لإتمام التبرع!', 'error');
      return;
    }

    if (!currentTribe?.id) {
      if (showToast) showToast('⚠️ يرجى الانضمام إلى قبيلة أولاً!', 'error');
      return;
    }

    setGold((prev) => Math.max(0, prev - amount));
    setMyTribeDonations((prev) => {
      const next = prev + amount;
      try {
        localStorage.setItem('pirate_my_tribe_donations', String(next));
      } catch {}
      return next;
    });

    const nextDonations = (currentTribe.donations || 0) + amount;
    const nextPower = (currentTribe.power || 0) + amount;
    const curLvl = Math.max(1, Number(currentTribe.level) || 1);
    let nextLevel = curLvl;
    while (nextLevel < 10 && nextDonations >= getTribeLevelTarget(nextLevel)) {
      nextLevel += 1;
    }
    const nextMaxMembers = getTribeMaxMembers(nextLevel);
    const nowIso = new Date().toISOString();

    if (setTribes) {
      setTribes((prev) =>
        prev.map((t) =>
          t.id === currentTribe.id
            ? {
                ...t,
                donations: nextDonations,
                power: nextPower,
                level: nextLevel,
                maxMembers: nextMaxMembers,
                lastUpdated: nowIso,
              }
            : t
        )
      );
    }
    try {
      const stored = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
      const updated = stored.map((t: any) =>
        t.id === currentTribe.id
          ? {
              ...t,
              donations: nextDonations,
              power: nextPower,
              level: nextLevel,
              maxMembers: nextMaxMembers,
              lastUpdated: nowIso,
            }
          : t
      );
      localStorage.setItem('pirate_local_tribes', JSON.stringify(updated));
    } catch {}

    if (currentUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          gold: increment(-amount),
          tribeDonations: increment(amount),
        });
      } catch {}
    }

    try {
      await updateDoc(doc(db, 'tribes', currentTribe.id), {
        donations: increment(amount),
        power: increment(amount),
        level: nextLevel,
        maxMembers: nextMaxMembers,
        lastUpdated: nowIso,
      });
    } catch {}

    if (showToast) {
      if (nextLevel > curLvl) {
        showToast(
          `🎉 تم التبرع بـ ${amount.toLocaleString('en-US')} 🪙 وارتقت القبيلة إلى المستوى ${nextLevel} (السعة: ${nextMaxMembers} أعضاء)!`,
          'success'
        );
      } else {
        showToast(`🎉 تم التبرع بمبلغ ${amount.toLocaleString('en-US')} 🪙 لخزينة القبيلة بنجاح!`, 'success');
      }
    }

    if (sendChatMessage) {
      sendChatMessage(
        'نظام القبيلة 🛡️',
        '🪙',
        `تبرع القبطان @${username} بمبلغ ${amount.toLocaleString('en-US')} 🪙 لصالح قبيلة [${currentTribe.name}]!`
      );
    }
  };

  const handleCreateNewTribe = async () => {
    const trimmedName = newTribeNameInput.trim();
    if (!trimmedName) {
      if (showToast) showToast('⚠️ يرجى كتابة اسم القبيلة أولاً!', 'error');
      return;
    }

    if (gold < CREATE_TRIBE_COST) {
      if (showToast) {
        showToast(
          `⚠️ تحتاج إلى ${CREATE_TRIBE_COST.toLocaleString('en-US')} ذهب (10 مليون ذهب) لإنشاء قبيلة!`,
          'error'
        );
      }
      return;
    }

    setGold((prev) => Math.max(0, prev - CREATE_TRIBE_COST));

    const realCreatedAt = new Date().toISOString();
    const tribeUniqueId = 'tribe_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const newTribe = {
      id: tribeUniqueId,
      name: trimmedName.slice(0, 50),
      description: newTribeDescInput.trim() || 'كن قائداً، اجمع أصدقاءك، لتغزو العالم',
      statement: '',
      emblem: newTribeEmblemInput || '⚔️',
      leaderId: currentUser?.uid || 'captain_' + Date.now(),
      leaderName: username || 'القبطان',
      level: 1,
      power: 10,
      donations: 0,
      membersCount: 1,
      maxMembers: 6,
      members: [currentUser?.uid || 'captain_' + Date.now()],
      lastUpdated: realCreatedAt,
      createdAt: realCreatedAt,
    };

    if (setTribes) {
      setTribes((prev) => [newTribe, ...prev.filter((t) => t.id !== tribeUniqueId)]);
    }
    setTribeId(tribeUniqueId);
    setTribeName(newTribe.name);

    try {
      const stored = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
      localStorage.setItem('pirate_local_tribes', JSON.stringify([newTribe, ...stored]));
      localStorage.setItem('pirate_tribe_id', tribeUniqueId);
      localStorage.setItem('pirate_tribe_name', newTribe.name);
      localStorage.setItem('pirate_my_tribe_donations', '0');
    } catch {}

    setMyTribeDonations(0);
    setNewTribeNameInput('');
    setNewTribeDescInput('');
    setShowEmblemPicker(false);
    setManageTab('info');
    setScreenMode('manage');

    if (currentUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          gold: increment(-CREATE_TRIBE_COST),
          tribeId: tribeUniqueId,
          tribeName: newTribe.name,
          tribeSnapshot: newTribe,
        });
      } catch {}
    }

    try {
      const docRef = await addDoc(collection(db, 'tribes'), newTribe);
      if (docRef?.id) {
        const cloudTribe = { ...newTribe, id: docRef.id };
        if (setTribes) {
          setTribes((prev) => [cloudTribe, ...prev.filter((t) => t.id !== tribeUniqueId && t.id !== docRef.id)]);
        }
        setTribeId(docRef.id);
        if (currentUser?.uid) {
          updateDoc(doc(db, 'users', currentUser.uid), { tribeId: docRef.id }).catch(() => {});
        }
      }
    } catch {}

    if (showToast) {
      showToast(`🎉 تم تأسيس قبيلة [${newTribe.name}] بنجاح مقابل 10,000,000 🪙!`, 'success');
    }

    if (sendChatMessage) {
      sendChatMessage(
        'نظام القبيلة 🛡️',
        newTribe.emblem,
        `أسس القبطان @${username} قبيلة جديدة [${newTribe.name}]!`
      );
    }
  };

  const handleToggleJoin = async (targetTribe: any) => {
    if (!targetTribe) return;
    const isMember = (currentUser?.uid && targetTribe.members?.includes(currentUser.uid)) || targetTribe.id === tribeId;

    if (isMember) {
      setTribeId('');
      setTribeName('');
      try {
        localStorage.removeItem('pirate_tribe_id');
        localStorage.removeItem('pirate_tribe_name');
      } catch {}

      if (currentUser?.uid) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          tribeId: '',
          tribeName: '',
        }).catch(() => {});
      }
      if (setTribes) {
        setTribes((prev) =>
          prev.map((t) =>
            t.id === targetTribe.id
              ? {
                  ...t,
                  members: (t.members || []).filter((m: string) => m !== currentUser?.uid),
                  membersCount: Math.max(0, (t.membersCount || 1) - 1),
                }
              : t
          )
        );
      }
      setScreenMode('menu');
      if (showToast) showToast(`تمت مغادرة قبيلة [${targetTribe.name}].`, 'info');
    } else {
      const targetMaxMembers = getTribeMaxMembers(targetTribe.level || 1);
      const targetMembersCount =
        Number(targetTribe.membersCount) || (Array.isArray(targetTribe.members) ? targetTribe.members.length : 0);
      if (targetMembersCount >= targetMaxMembers) {
        if (showToast) {
          showToast(`⚠️ عذراً، قبيلة [${targetTribe.name}] مكتملة العدد (${targetMembersCount}/${targetMaxMembers})!`, 'error');
        }
        return;
      }

      setTribeId(targetTribe.id);
      setTribeName(targetTribe.name);
      try {
        localStorage.setItem('pirate_tribe_id', targetTribe.id);
        localStorage.setItem('pirate_tribe_name', targetTribe.name);
      } catch {}

      if (currentUser?.uid) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          tribeId: targetTribe.id,
          tribeName: targetTribe.name,
        }).catch(() => {});
      }
      if (setTribes) {
        setTribes((prev) =>
          prev.map((t) =>
            t.id === targetTribe.id
              ? {
                  ...t,
                  members: [...(t.members || []), currentUser?.uid || 'me'],
                  membersCount: (t.membersCount || 0) + 1,
                }
              : t
          )
        );
      }
      setManageTab('info');
      setScreenMode('manage');
      if (showToast) showToast(`🎉 تهانينا! انضممت بنجاح إلى قبيلة [${targetTribe.name}].`, 'success');
    }

    if (joinTribe) {
      joinTribe(targetTribe).catch(() => {});
    }
  };

  // Back button handler depending on current sub-screen
  const handleBackAction = () => {
    if (screenMode === 'menu' || (screenMode === 'manage' && hasJoinedTribe)) {
      onClose();
      return;
    }
    if (hasJoinedTribe) {
      setScreenMode('manage');
    } else {
      setScreenMode('menu');
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background:
          'radial-gradient(circle at 50% 0%, #1d2633 0%, #121721 48%, #0a0d13 100%)',
        color: '#f8fafc',
        fontFamily: "'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle stone-crack & warm fire-ember background atmosphere */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `
            radial-gradient(circle at 14% 92%, rgba(251, 146, 60, 0.28) 0%, transparent 18%),
            radial-gradient(circle at 86% 88%, rgba(249, 115, 22, 0.24) 0%, transparent 22%),
            radial-gradient(circle at 50% 100%, rgba(234, 88, 12, 0.16) 0%, transparent 45%),
            radial-gradient(2px 2px at 18% 78%, rgba(253, 186, 116, 0.85), transparent),
            radial-gradient(2.5px 2.5px at 82% 72%, rgba(251, 146, 60, 0.8), transparent),
            radial-gradient(2px 2px at 26% 88%, rgba(253, 224, 71, 0.75), transparent),
            radial-gradient(3px 3px at 74% 85%, rgba(249, 115, 22, 0.8), transparent),
            radial-gradient(2px 2px at 42% 94%, rgba(253, 186, 116, 0.7), transparent),
            radial-gradient(2px 2px at 65% 91%, rgba(251, 146, 60, 0.7), transparent),
            radial-gradient(2px 2px at 90% 18%, rgba(253, 186, 116, 0.5), transparent),
            radial-gradient(2px 2px at 8% 36%, rgba(251, 146, 60, 0.45), transparent)
          `,
        }}
      />

      {/* Warm Stone Archway & Antique Map Atmosphere when in Create Tribe View */}
      {screenMode === 'create' && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            backgroundImage: `
              radial-gradient(ellipse 46% 52% at 24% 38%, rgba(188, 152, 108, 0.34) 0%, rgba(114, 86, 54, 0.22) 45%, rgba(22, 18, 14, 0.88) 82%),
              radial-gradient(ellipse 48% 54% at 76% 64%, rgba(164, 128, 78, 0.28) 0%, rgba(92, 69, 42, 0.14) 48%, transparent 80%),
              linear-gradient(180deg, rgba(16, 13, 10, 0.82) 0%, rgba(28, 22, 16, 0.35) 38%, rgba(15, 12, 10, 0.88) 100%)
            `,
          }}
        >
          {/* Subtle antique nautical map & stone arch lines */}
          <svg width="100%" height="100%" viewBox="0 0 1000 1200" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.18 }}>
            <path d="M120 760V360C120 220 340 220 340 360V760" stroke="#d4b37f" strokeWidth="4" fill="none" />
            <path d="M100 460H360M100 560H360M100 660H360M230 250V760" stroke="#b9935a" strokeWidth="1.5" strokeDasharray="8 6" fill="none" />
            <circle cx="760" cy="680" r="145" stroke="#cfa96b" strokeWidth="2" strokeDasharray="6 6" fill="none" />
            <circle cx="760" cy="680" r="110" stroke="#cfa96b" strokeWidth="1.2" fill="none" />
            <path d="M760 515V845M595 680H925" stroke="#cfa96b" strokeWidth="1.4" fill="none" />
            <path d="M560 440C620 490 690 460 740 520C800 590 880 550 930 620" stroke="#c89f61" strokeWidth="2" strokeDasharray="10 8" fill="none" />
          </svg>
        </div>
      )}

      {/* Left & Right Ornate Carved Stone/Bronze Frame Pillars */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: screenMode === 'create' ? '14px' : '28px',
          background: 'linear-gradient(90deg, #2d2016 0%, #4b3826 55%, #1c140d 100%)',
          borderRight: '3px solid #7f613b',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.85), 4px 0 18px rgba(0,0,0,0.75)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          width: screenMode === 'create' ? '14px' : '28px',
          background: 'linear-gradient(270deg, #2d2016 0%, #4b3826 55%, #1c140d 100%)',
          borderLeft: '3px solid #7f613b',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.85), -4px 0 18px rgba(0,0,0,0.75)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Top Ornate Frame Border + Header */}
      {screenMode === 'create' ? (
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '24px',
            flexShrink: 0,
          }}
        >
          {/* Thin top bronze border line */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #7c5c34 0%, #d4af68 50%, #7c5c34 100%)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          />
          <h1
            style={{
              margin: '6px 0 10px 0',
              fontSize: '48px',
              fontWeight: '900',
              lineHeight: 1.15,
              color: '#efd08a',
              textShadow: '0 4px 8px rgba(0,0,0,0.95), 0 0 18px rgba(234, 179, 8, 0.25)',
            }}
          >
            إنشاء قبيلة
          </h1>
          {/* Ornate Gold Scroll Divider matching reference */}
          <svg width="360" height="22" viewBox="0 0 360 22" fill="none" aria-hidden="true">
            <path d="M12 10H152" stroke="#c89e55" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M208 10H348" stroke="#c89e55" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M156 10L180 3L204 10L180 18L156 10Z" fill="#e6c375" stroke="#5b3e14" strokeWidth="1.5" />
            <path d="M148 10C156 16 165 19 171 13" stroke="#c89e55" strokeWidth="2" strokeLinecap="round" />
            <path d="M212 10C204 16 195 19 189 13" stroke="#c89e55" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ) : screenMode === 'manage' && currentTribe ? (
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {/* Ornate Runic Bronze Top Header Bar */}
          <div
            style={{
              width: '100%',
              padding: '12px 24px 10px 24px',
              background: 'linear-gradient(180deg, #2b2219 0%, #17130f 100%)',
              borderBottom: '3px solid #8a6c43',
              boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              boxSizing: 'border-box',
            }}
          >
            {/* Right Runic Carved Panel (in RTL) */}
            <div
              aria-hidden="true"
              style={{
                flex: 1,
                maxWidth: '210px',
                textAlign: 'center',
                color: '#d4ab62',
                fontSize: '18px',
                fontWeight: '900',
                letterSpacing: '4px',
                opacity: 0.72,
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                userSelect: 'none',
              }}
            >
              ᛟ ᚦ ᚱ ᚨ ᛏ ᛒ
            </div>

            {/* Centered Hexagonal Plaque */}
            <div
              style={{
                minWidth: '330px',
                padding: '10px 44px',
                background: 'linear-gradient(180deg, #35302a 0%, #1c1a18 65%, #121110 100%)',
                border: '3px solid #9d7b47',
                borderRadius: '8px',
                clipPath: 'polygon(6% 0%, 94% 0%, 100% 50%, 94% 100%, 6% 100%, 0% 50%)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.85), inset 0 2px 0 rgba(247, 223, 163, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: '40px',
                  fontWeight: '900',
                  color: '#f2d382',
                  textShadow: '0 3px 6px rgba(0,0,0,0.95)',
                  whiteSpace: 'nowrap',
                }}
              >
                {manageTab === 'members'
                  ? 'أعضاء القبيلة'
                  : manageTab === 'message'
                  ? 'رسالة القبيلة'
                  : manageTab === 'private'
                  ? 'ملكية خاصة'
                  : 'بيانات القبيلة'}
              </h1>
            </div>

            {/* Left Runic Carved Panel (in RTL) */}
            <div
              aria-hidden="true"
              style={{
                flex: 1,
                maxWidth: '210px',
                textAlign: 'center',
                color: '#d4ab62',
                fontSize: '18px',
                fontWeight: '900',
                letterSpacing: '4px',
                opacity: 0.72,
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                userSelect: 'none',
              }}
            >
              ᛊ ᚹ ᛗ ᛉ ᛞ ᚺ
            </div>
          </div>

          {/* 4-Tab Metallic Stone Navigation Row */}
          <div
            style={{
              width: '100%',
              maxWidth: '900px',
              padding: '12px 24px 0 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '8px',
              boxSizing: 'border-box',
            }}
          >
            {(
              [
                { id: 'info', label: 'بيانات القبيلة' },
                { id: 'members', label: 'أعضاء' },
                { id: 'message', label: 'رسالة' },
                { id: 'private', label: 'ملكية خاصة' },
              ] as Array<{ id: TribeManageTab; label: string }>
            ).map((tab) => {
              const isActive = manageTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setManageTab(tab.id)}
                  style={{
                    height: '72px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: isActive ? '2.5px solid #e0a743' : '2px solid #6e675d',
                    background: isActive
                      ? 'linear-gradient(180deg, #4b3922 0%, #2b2114 60%, #1d160d 100%)'
                      : 'linear-gradient(180deg, #3c3a37 0%, #252422 60%, #191817 100%)',
                    boxShadow: isActive
                      ? '0 0 16px rgba(245, 158, 11, 0.35), inset 0 2px 0 rgba(253, 230, 138, 0.35)'
                      : '0 4px 10px rgba(0,0,0,0.65), inset 0 1.5px 0 rgba(255,255,255,0.16)',
                    color: isActive ? '#f8d274' : '#ded6c7',
                    fontFamily: 'inherit',
                    fontSize: '25px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {/* Dark bronze top beam */}
          <div
            style={{
              width: '100%',
              height: '32px',
              background: 'linear-gradient(180deg, #4f3a27 0%, #2a1e14 70%, #19110b 100%)',
              borderBottom: '3px solid #9b7847',
              boxShadow: '0 6px 16px rgba(0,0,0,0.7)',
            }}
          />

          {/* Centered Ornate Title Plaque: القبيلة */}
          <div
            style={{
              marginTop: '-28px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Left diamond ornament */}
            <div
              aria-hidden="true"
              style={{
                width: '26px',
                height: '26px',
                background: 'linear-gradient(135deg, #3c2c1c 0%, #1d140c 100%)',
                border: '3px solid #a8834b',
                transform: 'rotate(45deg)',
                marginLeft: '-14px',
                zIndex: 2,
                boxShadow: '0 3px 10px rgba(0,0,0,0.75)',
              }}
            />

            <div
              style={{
                minWidth: '390px',
                padding: '14px 56px 18px 56px',
                background: 'linear-gradient(180deg, #35302a 0%, #1d1c1b 65%, #141312 100%)',
                border: '3.5px solid #9d7b47',
                borderRadius: '8px',
                clipPath: 'polygon(5% 0%, 95% 0%, 100% 38%, 94% 88%, 50% 100%, 6% 88%, 0% 38%)',
                boxShadow: '0 10px 26px rgba(0,0,0,0.85), inset 0 2px 0 rgba(247, 223, 163, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: '46px',
                  fontWeight: '900',
                  lineHeight: 1.15,
                  color: '#f2d382',
                  textShadow: '0 3px 6px rgba(0,0,0,0.95), 0 0 18px rgba(234, 179, 8, 0.25)',
                  letterSpacing: '0.5px',
                }}
              >
                {screenMode === 'join'
                  ? 'القبائل المتاحة'
                  : screenMode === 'invitations'
                  ? 'رسائل الدعوة'
                  : screenMode === 'donations'
                  ? 'تبرعات القبيلة'
                  : screenMode === 'levels'
                  ? 'مستويات القبيلة'
                  : 'القبيلة'}
              </h1>
            </div>

            {/* Right diamond ornament */}
            <div
              aria-hidden="true"
              style={{
                width: '26px',
                height: '26px',
                background: 'linear-gradient(135deg, #3c2c1c 0%, #1d140c 100%)',
                border: '3px solid #a8834b',
                transform: 'rotate(45deg)',
                marginRight: '-14px',
                zIndex: 2,
                boxShadow: '0 3px 10px rgba(0,0,0,0.75)',
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          maxWidth: screenMode === 'manage' && manageTab === 'members' ? '960px' : '880px',
          padding:
            screenMode === 'manage' && manageTab === 'members'
              ? '10px 14px 32px 14px'
              : '32px 44px 48px 44px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: screenMode === 'manage' && manageTab === 'members' ? '16px' : '30px',
          flex: 1,
        }}
      >
        {/* ===================== VIEW 1: MAIN NO-TRIBE SCREEN (EXACTLY MATCHING SCREENSHOT) ===================== */}
        {screenMode === 'menu' && (
          <>
            {/* Parchment Scroll Banner */}
            <div
              style={{
                width: '100%',
                position: 'relative',
                padding: '32px 28px',
                background: 'linear-gradient(180deg, #ecd8b4 0%, #e1c696 52%, #cfa971 100%)',
                borderRadius: '4px',
                border: '2.5px solid #967245',
                boxShadow:
                  '0 12px 28px rgba(0,0,0,0.65), inset 0 0 26px rgba(120, 75, 25, 0.35), inset 0 2px 0 rgba(255,255,255,0.55)',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              {/* Inner parchment hairline frame */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '8px',
                  border: '1.5px solid rgba(112, 72, 28, 0.3)',
                  pointerEvents: 'none',
                }}
              />
              <p
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '33px',
                  fontWeight: '800',
                  color: '#2b1c0c',
                  lineHeight: 1.45,
                }}
              >
                لم تنضم إلى أي قبيلة بعد
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '33px',
                  fontWeight: '800',
                  color: '#2b1c0c',
                  lineHeight: 1.45,
                }}
              >
                كن قائداً، اجمع أصدقاءك، لتغزو العالم
              </p>
            </div>

            {/* Primary Green Button: إنشاء قبيلة */}
            <button
              type="button"
              onClick={() => setScreenMode('create')}
              style={{
                position: 'relative',
                width: '100%',
                height: '116px',
                padding: '0 34px',
                borderRadius: '14px',
                border: '3.5px solid #8a7352',
                background:
                  'radial-gradient(ellipse at 50% 25%, rgba(163, 255, 110, 0.32) 0%, transparent 65%), linear-gradient(180deg, #54bf36 0%, #2d911f 52%, #195f0f 100%)',
                boxShadow:
                  '0 10px 24px rgba(0, 0, 0, 0.72), 0 0 26px rgba(74, 222, 128, 0.28), inset 0 2px 0 rgba(220, 255, 195, 0.65), inset 0 -4px 10px rgba(0, 40, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'transform 0.14s ease, filter 0.14s ease',
              }}
            >
              {/* Left & Right Ornamental Silver-Bronze Rivet Brackets */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: '-11px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(45deg)',
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #4ade80 0%, #15803d 100%)',
                  border: '3px solid #b59a73',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-11px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(45deg)',
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #4ade80 0%, #15803d 100%)',
                  border: '3px solid #b59a73',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}
              />

              {/* Right side icon in RTL: Flag */}
              <GoldenFlagIcon />

              {/* Center label */}
              <span
                style={{
                  fontFamily: 'inherit',
                  fontSize: '40px',
                  fontWeight: '900',
                  color: '#ffffff',
                  textShadow: '0 3px 6px rgba(0, 0, 0, 0.85)',
                  whiteSpace: 'nowrap',
                }}
              >
                إنشاء قبيلة
              </span>

              {/* Left side icon in RTL: Gavel */}
              <GoldenGavelIcon />
            </button>

            {/* Secondary Amber/Orange Button: الانضمام إلى قبيلة */}
            <button
              type="button"
              onClick={() => setScreenMode('join')}
              style={{
                position: 'relative',
                width: '100%',
                height: '116px',
                padding: '0 34px',
                borderRadius: '14px',
                border: '3.5px solid #967c5c',
                background:
                  'radial-gradient(ellipse at 50% 25%, rgba(255, 195, 110, 0.28) 0%, transparent 65%), linear-gradient(180deg, #f37f1c 0%, #c84c06 52%, #8e2d02 100%)',
                boxShadow:
                  '0 10px 24px rgba(0, 0, 0, 0.72), 0 0 24px rgba(249, 115, 22, 0.25), inset 0 2px 0 rgba(255, 225, 175, 0.6), inset 0 -4px 10px rgba(65, 15, 0, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'transform 0.14s ease, filter 0.14s ease',
              }}
            >
              {/* Left & Right Ornamental Silver-Bronze Rivet Brackets */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: '-11px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(45deg)',
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)',
                  border: '3px solid #b59a73',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-11px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(45deg)',
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)',
                  border: '3px solid #b59a73',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}
              />

              {/* Right side icon in RTL: Handshake */}
              <GoldenHandshakeIcon />

              {/* Center label */}
              <span
                style={{
                  fontFamily: 'inherit',
                  fontSize: '40px',
                  fontWeight: '900',
                  color: '#ffffff',
                  textShadow: '0 3px 6px rgba(0, 0, 0, 0.85)',
                  whiteSpace: 'nowrap',
                }}
              >
                الانضمام إلى قبيلة
              </span>

              {/* Left side icon in RTL: Shield */}
              <GoldenShieldIcon />
            </button>

            {/* Invitations Row: لديك 0 رسائل دعوة */}
            <button
              type="button"
              onClick={() => setScreenMode('invitations')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                color: '#d9c8aa',
                fontFamily: 'inherit',
                fontSize: '29px',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(0,0,0,0.85)',
              }}
            >
              <EnvelopeInviteIcon />
              <span>لديك {invitationsCount} رسائل دعوة</span>
            </button>

            {/* Bottom Dark-Wood Carved Back Button: عودة ← */}
            <button
              type="button"
              onClick={handleBackAction}
              style={{
                width: '100%',
                height: '102px',
                marginTop: '4px',
                padding: '0 28px',
                borderRadius: '10px',
                border: '3px solid #8c6d45',
                background: 'linear-gradient(180deg, #432e20 0%, #2b1d14 55%, #1d120b 100%)',
                boxShadow:
                  '0 10px 24px rgba(0, 0, 0, 0.78), inset 0 2px 0 rgba(212, 175, 112, 0.28), inset 0 -3px 8px rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                color: '#f2e0be',
                fontFamily: 'inherit',
                fontSize: '36px',
                fontWeight: '900',
                textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                boxSizing: 'border-box',
              }}
            >
              <span>عودة</span>
              <span style={{ fontSize: '36px', lineHeight: 1 }}>←</span>
            </button>
          </>
        )}

        {/* ===================== VIEW 2: ACTIVE TRIBE DASHBOARD (MATCHING REFERENCE SCREENSHOT) ===================== */}
        {screenMode === 'manage' && currentTribe && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {manageTab === 'info' && (
              <>
                {/* Row 1: الإسم + تغيير */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  {isEditingTribeName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <input
                        type="text"
                        maxLength={50}
                        value={editTribeNameInput}
                        onChange={(e) => setEditTribeNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTribeName();
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '2px solid #c59b52',
                          background: '#171411',
                          color: '#f5e8ce',
                          fontFamily: 'inherit',
                          fontSize: '26px',
                          fontWeight: '800',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveTribeName}
                        style={{
                          padding: '12px 22px',
                          borderRadius: '8px',
                          border: '2px solid #86efac',
                          background: 'linear-gradient(180deg, #439b31 0%, #195f0f 100%)',
                          color: '#ffffff',
                          fontFamily: 'inherit',
                          fontSize: '22px',
                          fontWeight: '900',
                          cursor: 'pointer',
                        }}
                      >
                        حفظ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditTribeNameInput(currentTribe.name || '');
                          setIsEditingTribeName(false);
                        }}
                        style={{
                          padding: '12px 18px',
                          borderRadius: '8px',
                          border: '2px solid #7f7467',
                          background: '#2a2420',
                          color: '#f2e6cf',
                          fontFamily: 'inherit',
                          fontSize: '22px',
                          fontWeight: '900',
                          cursor: 'pointer',
                        }}
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: '900',
                          color: '#f3ebd8',
                          textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                        }}
                      >
                        الإسم: {currentTribe.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditTribeNameInput(currentTribe.name || '');
                          setIsEditingTribeName(true);
                        }}
                        style={{
                          position: 'relative',
                          minWidth: '176px',
                          height: '58px',
                          padding: '0 28px',
                          borderRadius: '8px',
                          border: '2.5px solid #9d7b47',
                          background: 'linear-gradient(180deg, #624a2b 0%, #3d2c18 55%, #261b0e 100%)',
                          boxShadow: '0 6px 14px rgba(0,0,0,0.75), inset 0 1.5px 0 rgba(246, 224, 170, 0.35)',
                          color: '#f3ebd8',
                          fontFamily: 'inherit',
                          fontSize: '24px',
                          fontWeight: '900',
                          cursor: 'pointer',
                        }}
                      >
                        تغيير
                      </button>
                    </>
                  )}
                </div>

                {/* Row 2: الرمز + Emblem Crest + تغيير + دعوات الانضمام */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: '900',
                        color: '#f3ebd8',
                        textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                      }}
                    >
                      الرمز:
                    </span>
                    <TribeEmblemCrest emblem={currentTribe.emblem || '⚔️'} size={136} fieryGlow />
                    <button
                      type="button"
                      onClick={() => setShowManageEmblemPicker((prev) => !prev)}
                      style={{
                        minWidth: '124px',
                        height: '54px',
                        padding: '0 22px',
                        borderRadius: '8px',
                        border: '2.5px solid #757068',
                        background: 'linear-gradient(180deg, #43403c 0%, #2a2825 55%, #1a1917 100%)',
                        boxShadow: '0 6px 14px rgba(0,0,0,0.75), inset 0 1.5px 0 rgba(255,255,255,0.22)',
                        color: '#f3ebd8',
                        fontFamily: 'inherit',
                        fontSize: '22px',
                        fontWeight: '900',
                        cursor: 'pointer',
                      }}
                    >
                      تغيير
                    </button>
                  </div>

                  {/* Blue Beveled "دعوات الانضمام" Button */}
                  <button
                    type="button"
                    onClick={() => setShowJoinInvitesPanel((prev) => !prev)}
                    style={{
                      position: 'relative',
                      minWidth: '250px',
                      height: '64px',
                      padding: '0 28px',
                      borderRadius: '10px',
                      border: '2.5px solid #7fb7e6',
                      background: 'linear-gradient(180deg, #2b6ea3 0%, #184973 55%, #0f2f4d 100%)',
                      boxShadow:
                        '0 8px 18px rgba(0,0,0,0.75), 0 0 14px rgba(56, 189, 248, 0.35), inset 0 2px 0 rgba(186, 230, 253, 0.5)',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '24px',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: '-8px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(45deg)',
                        width: '14px',
                        height: '14px',
                        background: '#38bdf8',
                        border: '2px solid #9bd0f8',
                      }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '-8px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(45deg)',
                        width: '14px',
                        height: '14px',
                        background: '#38bdf8',
                        border: '2px solid #9bd0f8',
                      }}
                    />
                    دعوات الانضمام
                  </button>
                </div>

                {/* Inline Emblem Picker when changing emblem */}
                {showManageEmblemPicker && (
                  <div
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(18, 16, 14, 0.95)',
                      border: '2.5px solid #9b7a4b',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                      gap: '10px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {TRIBE_EMBLEM_OPTIONS.map((opt) => {
                      const isSelected = (currentTribe.emblem || '⚔️') === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => handleChangeManageEmblem(opt.id)}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '10px',
                            border: isSelected ? '2.5px solid #facc15' : '2px solid #57452e',
                            background: isSelected ? 'rgba(161, 98, 7, 0.45)' : 'rgba(32, 27, 22, 0.9)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            color: '#f5e4bd',
                            fontFamily: 'inherit',
                          }}
                        >
                          <TribeEmblemCrest emblem={opt.id} size={64} />
                          <span style={{ fontSize: '16px', fontWeight: '800' }}>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Inline Recruitment / Join Invitations Drawer */}
                {showJoinInvitesPanel && (
                  <div
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      borderRadius: '12px',
                      background: 'rgba(17, 22, 31, 0.95)',
                      border: '2.5px solid #38bdf8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px', fontWeight: '900', color: '#7dd3fc' }}>
                        دعوة قباطنة للانضمام (الحد الأقصى: {currentTribeMembersCount}/{currentTribeMaxMembers})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowJoinInvitesPanel(false)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1.5px solid #64748b',
                          background: '#1e293b',
                          color: '#e2e8f0',
                          fontFamily: 'inherit',
                          fontSize: '18px',
                          fontWeight: '800',
                          cursor: 'pointer',
                        }}
                      >
                        إغلاق
                      </button>
                    </div>
                    {realPlayers.filter((p) => (p.userId || p.id) !== currentUser?.uid && p.tribeId !== currentTribe.id).length === 0 ? (
                      <div style={{ fontSize: '21px', color: '#cbd5e1', fontWeight: '700' }}>
                        لا يوجد قباطنة متاحون للدعوة حالياً.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                        {realPlayers
                          .filter((p) => (p.userId || p.id) !== currentUser?.uid && p.tribeId !== currentTribe.id)
                          .slice(0, 12)
                          .map((p) => {
                            const pId = p.userId || p.id;
                            const isInvited = invitedPlayerIds.includes(pId);
                            return (
                              <div
                                key={pId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  background: 'rgba(30, 41, 59, 0.75)',
                                  border: '1px solid #475569',
                                }}
                              >
                                <span style={{ fontSize: '21px', fontWeight: '800', color: '#f8fafc' }}>
                                  {p.avatar || '⚓'} @{p.username || 'قبطان'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleInvitePlayer(p)}
                                  style={{
                                    padding: '8px 18px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #7dd3fc',
                                    background: isInvited ? '#1e293b' : 'linear-gradient(180deg, #2b6ea3 0%, #143c5e 100%)',
                                    color: '#ffffff',
                                    fontFamily: 'inherit',
                                    fontSize: '19px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isInvited ? 'تمت الدعوة ✓' : 'إرسال دعوة'}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* Row 3: المستوى: 1 🏆 الترتيب: 50 ⭐ الأعضاء: 1/6 */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '22px',
                    flexWrap: 'wrap',
                    fontSize: '27px',
                    fontWeight: '900',
                    color: '#f3ebd8',
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                  }}
                >
                  <span>المستوى: {currentTribeLevel}</span>
                  <span>🏆 الترتيب: {currentTribeRank}</span>
                  <span>
                    ⭐ الأعضاء: {currentTribeMembersCount}/{currentTribeMaxMembers}
                  </span>
                </div>

                {/* Row 4: التبرع: 0/10000 + Ornate Progress Bar + Blue تبرع Button */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      flex: 1,
                      minWidth: '280px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '28px',
                        fontWeight: '900',
                        color: '#f3ebd8',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      التبرع: {currentTribeDonations}/{currentTribeTarget}
                    </span>

                    {/* Ornate Bronze Progress Track */}
                    <div
                      style={{
                        position: 'relative',
                        flex: 1,
                        height: '38px',
                        borderRadius: '9999px',
                        border: '2.5px solid #967245',
                        background: 'linear-gradient(180deg, #2a2015 0%, #3d2f20 100%)',
                        boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.85), 0 4px 10px rgba(0,0,0,0.6)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: 0,
                          width: `${Math.min(100, Math.round((currentTribeDonations / Math.max(1, currentTribeTarget)) * 100))}%`,
                          background: 'linear-gradient(90deg, #f59e0b 0%, #eab308 55%, #b45309 100%)',
                          transition: 'width 0.35s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Blue Beveled "تبرع" Button */}
                  <button
                    type="button"
                    onClick={() => setScreenMode('donations')}
                    style={{
                      position: 'relative',
                      minWidth: '170px',
                      height: '62px',
                      padding: '0 30px',
                      borderRadius: '10px',
                      border: '2.5px solid #7fb7e6',
                      background: 'linear-gradient(180deg, #2b6ea3 0%, #184973 55%, #0f2f4d 100%)',
                      boxShadow:
                        '0 8px 18px rgba(0,0,0,0.75), 0 0 14px rgba(56, 189, 248, 0.35), inset 0 2px 0 rgba(186, 230, 253, 0.5)',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '26px',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: '-8px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(45deg)',
                        width: '14px',
                        height: '14px',
                        background: '#38bdf8',
                        border: '2px solid #9bd0f8',
                      }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '-8px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(45deg)',
                        width: '14px',
                        height: '14px',
                        background: '#38bdf8',
                        border: '2px solid #9bd0f8',
                      }}
                    />
                    تبرع
                  </button>
                </div>

                {/* Row 5: شيخ القبيلة */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '29px',
                    fontWeight: '900',
                    textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                  }}
                >
                  <span style={{ color: '#f3ebd8' }}>شيخ القبيلة:</span>
                  <TribeEmblemCrest emblem={currentTribe.emblem || '⚔️'} size={36} />
                  <span style={{ color: '#7dd3fc' }}>{currentTribe.leaderName || username}</span>
                </div>

                {/* Row 6: تصريح القبيلة + Aged Parchment Textarea */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <label
                      htmlFor="tribe-statement-textarea"
                      style={{
                        fontSize: '29px',
                        fontWeight: '900',
                        color: '#f3ebd8',
                        textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                      }}
                    >
                      تصريح القبيلة:
                    </label>
                    {statementDraft.trim() !== (currentTribe.statement || '').trim() && (
                      <button
                        type="button"
                        onClick={handleSaveStatement}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: '2px solid #86efac',
                          background: 'linear-gradient(180deg, #439b31 0%, #195f0f 100%)',
                          color: '#ffffff',
                          fontFamily: 'inherit',
                          fontSize: '20px',
                          fontWeight: '900',
                          cursor: 'pointer',
                        }}
                      >
                        حفظ التصريح
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      width: '100%',
                      borderRadius: '6px',
                      border: '3px solid #75654c',
                      background: 'linear-gradient(180deg, #ccc0a6 0%, #b8aa8f 55%, #a19277 100%)',
                      boxShadow:
                        '0 12px 26px rgba(0,0,0,0.75), inset 0 0 28px rgba(72, 52, 26, 0.42), inset 0 2px 0 rgba(255,255,255,0.45)',
                      padding: '18px 20px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <textarea
                      id="tribe-statement-textarea"
                      rows={5}
                      maxLength={500}
                      placeholder="اضغط هنا لكتابة تصريح القبيلة"
                      value={statementDraft}
                      onChange={(e) => setStatementDraft(e.target.value)}
                      onBlur={() => {
                        if (statementDraft.trim() !== (currentTribe.statement || '').trim()) {
                          handleSaveStatement();
                        }
                      }}
                      className="placeholder:text-[#5c5140] placeholder:opacity-100"
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: '#23180c',
                        fontFamily: 'inherit',
                        fontSize: '26px',
                        fontWeight: '800',
                        lineHeight: 1.55,
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Sub-Tab 2: أعضاء */}
            {manageTab === 'members' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                {realTribeDonors.map((member, idx) => {
                  const isLeaderRow = member.isLeader || idx === 0;
                  return (
                    <React.Fragment key={member.id || idx}>
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          minHeight: '148px',
                          padding: '18px 24px',
                          backgroundImage: `
                            radial-gradient(ellipse 34% 75% at 88% 72%, rgba(234, 88, 12, 0.22) 0%, transparent 72%),
                            radial-gradient(ellipse 28% 75% at 12% 35%, rgba(249, 115, 22, 0.2) 0%, transparent 72%),
                            linear-gradient(90deg, rgba(24, 17, 13, 0.94) 0%, rgba(21, 20, 22, 0.96) 50%, rgba(28, 20, 15, 0.94) 100%)
                          `,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '18px',
                          boxSizing: 'border-box',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Subtle Carved Vertical Stone Chevron Strip (matching reference background) */}
                        <div
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: '31%',
                            width: '44px',
                            borderLeft: '1.5px solid rgba(135, 110, 78, 0.16)',
                            borderRight: '1.5px solid rgba(135, 110, 78, 0.16)',
                            background: 'rgba(12, 10, 9, 0.35)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-evenly',
                            pointerEvents: 'none',
                            opacity: 0.45,
                            color: '#7c6548',
                            fontSize: '13px',
                            lineHeight: 1,
                          }}
                        >
                          <span>▲</span>
                          <span>▲</span>
                          <span>▲</span>
                        </div>

                        {/* Right side (RTL start): Member Name + Member Donations Number (no gold medallion on right) */}
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            flex: 1,
                            minWidth: 0,
                            paddingRight: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '42px',
                              fontWeight: '900',
                              color: '#f3e5c7',
                              textShadow: '0 3px 8px rgba(0, 0, 0, 0.95)',
                              lineHeight: 1.2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                            }}
                          >
                            {member.name}
                          </div>
                          <div
                            style={{
                              fontSize: '34px',
                              fontWeight: '900',
                              color: '#7dd3fc',
                              fontVariantNumeric: 'tabular-nums',
                              lineHeight: 1.15,
                              textShadow: '0 2px 6px rgba(0, 0, 0, 0.95)',
                            }}
                          >
                            {member.donations.toLocaleString('en-US')}
                          </div>
                        </div>

                        {/* Left side (RTL end): Royal Crown (for Tribe Leader) + Spiked Warrior Avatar Frame */}
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            flexShrink: 0,
                          }}
                        >
                          {isLeaderRow && <RoyalLeaderCrownIcon />}
                          <SpikedMemberAvatarFrame
                            avatar={member.avatar}
                            photoURL={member.photoURL}
                            name={member.name}
                          />
                        </div>
                      </div>

                      {/* Ornate Bronze Divider with Crimson Center Diamond */}
                      <div
                        aria-hidden="true"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0px',
                          height: '16px',
                          background: '#0d0b0a',
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: '3.5px',
                            background: 'linear-gradient(90deg, rgba(140, 109, 69, 0.3), #7b664b, #a88b63)',
                          }}
                        />
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            background: '#dc2626',
                            border: '2px solid #a88b63',
                            transform: 'rotate(45deg)',
                            boxShadow: '0 0 10px rgba(220, 38, 38, 0.7)',
                            flexShrink: 0,
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            height: '3.5px',
                            background: 'linear-gradient(270deg, rgba(140, 109, 69, 0.3), #7b664b, #a88b63)',
                          }}
                        />
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Sub-Tab 3: رسالة */}
            {manageTab === 'message' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(180deg, #1d2430 0%, #11161f 100%)',
                    border: '2.5px solid #967245',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <label style={{ fontSize: '25px', fontWeight: '900', color: '#f2d382' }}>
                    إرسال رسالة لأعضاء القبيلة:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="اكتب رسالتك هنا..."
                    value={tribeMessageInput}
                    onChange={(e) => setTribeMessageInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '2px solid #8a6b41',
                      background: '#0b0e14',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '23px',
                      fontWeight: '700',
                      boxSizing: 'border-box',
                      resize: 'none',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const msg = tribeMessageInput.trim();
                      if (!msg) return;
                      const entry = {
                        id: String(Date.now()),
                        sender: username || 'القبطان',
                        text: msg,
                        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                      };
                      setTribeAnnouncements((prev) => [entry, ...prev]);
                      setTribeMessageInput('');
                      if (sendChatMessage) {
                        sendChatMessage(`قبيلة [${currentTribe.name}]`, currentTribe.emblem || '⚔️', `@${username}: ${msg}`);
                      }
                      if (showToast) showToast('📣 تم إرسال رسالة القبيلة بنجاح!', 'success');
                    }}
                    style={{
                      height: '68px',
                      borderRadius: '10px',
                      border: '2.5px solid #86efac',
                      background: 'linear-gradient(180deg, #439b31 0%, #195f0f 100%)',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '25px',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    إرسال الرسالة
                  </button>
                </div>

                {tribeAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '10px',
                      background: 'rgba(20, 24, 33, 0.92)',
                      border: '2px solid #7f613b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '19px', color: '#f2d382', fontWeight: '800' }}>
                      <span>@{item.sender}</span>
                      <span>{item.time}</span>
                    </div>
                    <div style={{ fontSize: '23px', color: '#f8fafc', fontWeight: '700' }}>{item.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-Tab 5: ملكية خاصة */}
            {manageTab === 'private' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '18px 22px',
                    borderRadius: '12px',
                    background: 'linear-gradient(180deg, #ecd8b4 0%, #cfa971 100%)',
                    border: '2.5px solid #967245',
                    color: '#2b1c0c',
                    fontSize: '24px',
                    fontWeight: '900',
                    textAlign: 'center',
                  }}
                >
                  المستوى الحالي: {currentTribeLevel} • الحد الأقصى للأعضاء: {currentTribeMaxMembers} • الإضافة اليومية: {totalDailyAddition} نقطة
                </div>

                <button
                  type="button"
                  onClick={() => setScreenMode('levels')}
                  style={{
                    width: '100%',
                    height: '78px',
                    borderRadius: '10px',
                    border: '2.5px solid #f59e0b',
                    background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)',
                    color: '#fef08a',
                    fontFamily: 'inherit',
                    fontSize: '26px',
                    fontWeight: '900',
                    cursor: 'pointer',
                  }}
                >
                  استعراض جميع مستويات القبيلة ({TRIBE_DEPTHS.length})
                </button>

                <button
                  type="button"
                  onClick={() => setScreenMode('join')}
                  style={{
                    width: '100%',
                    height: '74px',
                    borderRadius: '10px',
                    border: '2.5px solid #7fb7e6',
                    background: 'linear-gradient(180deg, #2b6ea3 0%, #103252 100%)',
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: '25px',
                    fontWeight: '900',
                    cursor: 'pointer',
                  }}
                >
                  استعراض قائمة القبائل
                </button>
              </div>
            )}

            {manageTab !== 'members' && (
              <>
                {/* Horizontal Ornate Divider Line */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '4px',
                  }}
                >
                  <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, transparent, #8c6d45)' }} />
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      background: '#c89e55',
                      transform: 'rotate(45deg)',
                    }}
                  />
                  <div style={{ flex: 1, height: '2px', background: 'linear-gradient(270deg, transparent, #8c6d45)' }} />
                </div>

                {/* Footer Info Row: تبرعاتي + مغادرة من القبيلة */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '29px',
                      fontWeight: '900',
                      color: '#f3ebd8',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span>تبرعاتي:</span>
                    <GoldCoinBadgeIcon />
                    <span>{myTribeDonations.toLocaleString('en-US')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleJoin(currentTribe)}
                    style={{
                      minWidth: '250px',
                      height: '62px',
                      padding: '0 26px',
                      borderRadius: '8px',
                      border: '2.5px solid #7f1d1d',
                      background: 'linear-gradient(180deg, #4b1d1d 0%, #2b1010 60%, #1b0909 100%)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.8), inset 0 1.5px 0 rgba(248, 113, 113, 0.25)',
                      color: '#f3ebd8',
                      fontFamily: 'inherit',
                      fontSize: '24px',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    مغادرة من القبيلة
                  </button>
                </div>
              </>
            )}

            {/* Bottom Beveled Bronze Back Button: عودة ← */}
            <button
              type="button"
              onClick={handleBackAction}
              style={{
                width: '100%',
                height: '88px',
                padding: '0 28px',
                borderRadius: '10px',
                border: '3px solid #a88652',
                background: 'linear-gradient(180deg, #624e35 0%, #3d3020 55%, #231b12 100%)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.8), inset 0 2px 0 rgba(245, 224, 168, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: '#f5ebd6',
                fontFamily: 'inherit',
                fontSize: '34px',
                fontWeight: '900',
                textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontSize: '28px', opacity: 0.78 }}>»</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>عودة</span>
                <span>←</span>
              </span>
              <span style={{ fontSize: '28px', opacity: 0.78 }}>«</span>
            </button>
          </div>
        )}

        {/* ===================== VIEW 3: CREATE TRIBE (MATCHING REFERENCE SCREENSHOT) ===================== */}
        {screenMode === 'create' && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              marginTop: '6px',
            }}
          >
            {/* Tribe Name Label (Right aligned in RTL) */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                htmlFor="create-tribe-name-input"
                style={{
                  display: 'block',
                  textAlign: 'right',
                  fontSize: '30px',
                  fontWeight: '900',
                  color: '#e6cb93',
                  textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                }}
              >
                اسم القبيلة
              </label>

              {/* Ornate Dark-Stone Input Bar */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '96px',
                  background: 'linear-gradient(180deg, #322f2a 0%, #24211d 55%, #191613 100%)',
                  border: '3px solid #8a6c44',
                  borderRadius: '6px',
                  boxShadow:
                    '0 10px 24px rgba(0,0,0,0.78), inset 0 2px 0 rgba(235, 204, 145, 0.25), inset 0 -4px 12px rgba(0,0,0,0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                {/* Left & Right Ornate Diamond Cap Ornaments */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    right: '-10px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: '18px',
                    height: '18px',
                    background: '#3d2f1e',
                    border: '2.5px solid #9e7c4d',
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '-10px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: '18px',
                    height: '18px',
                    background: '#3d2f1e',
                    border: '2.5px solid #9e7c4d',
                  }}
                />
                <input
                  id="create-tribe-name-input"
                  type="text"
                  maxLength={50}
                  placeholder="اكتب اسم القبيلة"
                  value={newTribeNameInput}
                  onChange={(e) => setNewTribeNameInput(e.target.value)}
                  className="placeholder:text-[#a89d8a] placeholder:opacity-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewTribe();
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '0 36px',
                    border: 'none',
                    background: 'transparent',
                    color: '#f8ecd2',
                    fontFamily: 'inherit',
                    fontSize: '30px',
                    fontWeight: '800',
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Tribe Emblem Section */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  textAlign: 'right',
                  fontSize: '30px',
                  fontWeight: '900',
                  color: '#e6cb93',
                  textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                }}
              >
                شعار القبيلة
              </div>

              <TribeEmblemCrest emblem={newTribeEmblemInput} size={156} />

              {/* Blue Metallic Beveled "تغيير" Button */}
              <button
                type="button"
                onClick={() => setShowEmblemPicker((prev) => !prev)}
                style={{
                  position: 'relative',
                  minWidth: '240px',
                  height: '64px',
                  padding: '0 38px',
                  borderRadius: '10px',
                  border: '3px solid #9b7a4b',
                  background:
                    'linear-gradient(180deg, #3c6d94 0%, #1e4464 52%, #11293f 100%)',
                  boxShadow:
                    '0 8px 18px rgba(0,0,0,0.75), inset 0 2px 0 rgba(165, 224, 255, 0.45), inset 0 -3px 8px rgba(0,0,0,0.6)',
                  color: '#f3efe4',
                  fontFamily: 'inherit',
                  fontSize: '28px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Left & Right Glowing Cyan Diamond Rivets */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    right: '-9px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: '16px',
                    height: '16px',
                    background: '#38bdf8',
                    border: '2.5px solid #9b7a4b',
                    boxShadow: '0 0 8px rgba(56, 189, 248, 0.85)',
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '-9px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: '16px',
                    height: '16px',
                    background: '#38bdf8',
                    border: '2.5px solid #9b7a4b',
                    boxShadow: '0 0 8px rgba(56, 189, 248, 0.85)',
                  }}
                />
                <span>تغيير</span>
              </button>

              {/* Selectable Crest Picker Drawer */}
              {showEmblemPicker && (
                <div
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '14px',
                    background: 'rgba(18, 16, 14, 0.94)',
                    border: '2.5px solid #9b7a4b',
                    boxShadow: '0 14px 32px rgba(0,0,0,0.85)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '12px',
                    boxSizing: 'border-box',
                  }}
                >
                  {TRIBE_EMBLEM_OPTIONS.map((opt) => {
                    const isSelected = newTribeEmblemInput === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          setNewTribeEmblemInput(opt.id);
                          setShowEmblemPicker(false);
                        }}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '10px',
                          border: isSelected ? '2.5px solid #facc15' : '2px solid #57452e',
                          background: isSelected
                            ? 'linear-gradient(180deg, rgba(161, 98, 7, 0.45) 0%, rgba(69, 39, 8, 0.7) 100%)'
                            : 'rgba(32, 27, 22, 0.9)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          color: '#f5e4bd',
                          fontFamily: 'inherit',
                        }}
                      >
                        <TribeEmblemCrest emblem={opt.id} size={74} />
                        <span style={{ fontSize: '18px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Primary Green Button: إنشاء + 10M Gold Cost */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleCreateNewTribe}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '112px',
                  padding: '0 34px',
                  borderRadius: '12px',
                  border: '3.5px solid #d0a85b',
                  background:
                    'radial-gradient(ellipse at 50% 25%, rgba(145, 245, 95, 0.28) 0%, transparent 68%), linear-gradient(180deg, #439b31 0%, #246c19 52%, #13440b 100%)',
                  boxShadow:
                    '0 12px 26px rgba(0, 0, 0, 0.78), 0 0 22px rgba(234, 179, 8, 0.25), inset 0 2px 0 rgba(246, 232, 180, 0.75), inset 0 -4px 10px rgba(0, 35, 0, 0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {/* Left & Right Ornamental Gold Corner Chevrons */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    right: '-11px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: '20px',
                    height: '20px',
                    background: 'linear-gradient(135deg, #fde68a 0%, #926623 100%)',
                    border: '3px solid #6b4914',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '-11px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: '20px',
                    height: '20px',
                    background: 'linear-gradient(135deg, #fde68a 0%, #926623 100%)',
                    border: '3px solid #6b4914',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'inherit',
                    fontSize: '42px',
                    fontWeight: '900',
                    color: '#f8efd4',
                    textShadow: '0 3px 6px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  إنشاء
                </span>
              </button>

              {/* Clean Gold Cost Info Line */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                  fontSize: '24px',
                  fontWeight: '800',
                  color: gold >= CREATE_TRIBE_COST ? '#f2d382' : '#fca5a5',
                  textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <GoldCoinBadgeIcon />
                <span>تكلفة الإنشاء: 10,000,000 ذهب</span>
                <span style={{ opacity: 0.7 }}>•</span>
                <span style={{ color: gold >= CREATE_TRIBE_COST ? '#86efac' : '#f87171' }}>
                  رصيدك: {gold.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* Bottom Dark-Wood/Stone Back Button: عودة ← */}
            <button
              type="button"
              onClick={() => {
                setShowEmblemPicker(false);
                handleBackAction();
              }}
              style={{
                position: 'relative',
                width: '100%',
                height: '92px',
                marginTop: '6px',
                borderRadius: '10px',
                border: '3px solid #7f7467',
                background: 'linear-gradient(180deg, #433b35 0%, #2a2420 55%, #1b1714 100%)',
                boxShadow:
                  '0 10px 24px rgba(0, 0, 0, 0.8), inset 0 2px 0 rgba(235, 224, 205, 0.25), inset 0 -3px 8px rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                color: '#f2e6cf',
                fontFamily: 'inherit',
                fontSize: '34px',
                fontWeight: '900',
                textShadow: '0 2px 5px rgba(0,0,0,0.9)',
              }}
            >
              <span>عودة</span>
              <span>←</span>
            </button>
          </div>
        )}

        {/* ===================== VIEW 4: JOIN TRIBE DIRECTORY ===================== */}
        {screenMode === 'join' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input
              type="text"
              placeholder="ابحث عن اسم قبيلة أو قائد..."
              value={tribeSearchQuery}
              onChange={(e) => setTribeSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '18px 22px',
                borderRadius: '12px',
                border: '2.5px solid #8a6b41',
                background: '#0f141e',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: '26px',
                fontWeight: '700',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />

            {filteredTribes.length === 0 ? (
              <div
                style={{
                  padding: '36px 24px',
                  borderRadius: '14px',
                  background: 'linear-gradient(180deg, #ecd8b4 0%, #d4b27d 100%)',
                  border: '2.5px solid #967245',
                  textAlign: 'center',
                  color: '#2b1c0c',
                  fontSize: '28px',
                  fontWeight: '800',
                }}
              >
                لا توجد قبائل مطابقة للبحث حالياً.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredTribes.map((t) => {
                  const isMember = (currentUser?.uid && t.members?.includes(currentUser.uid)) || t.id === tribeId;
                  return (
                    <div
                      key={t.id}
                      style={{
                        background: 'linear-gradient(180deg, #1d2430 0%, #11161f 100%)',
                        border: isMember ? '3px solid #facc15' : '2.5px solid #7f613b',
                        borderRadius: '14px',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <TribeEmblemCrest emblem={t.emblem || '⚔️'} size={54} />
                          <span style={{ fontSize: '30px', fontWeight: '900', color: '#f2d382' }}>{t.name}</span>
                        </div>
                        <div style={{ fontSize: '22px', color: '#e2e8f0', fontWeight: '700' }}>
                          القائد: @{t.leaderName || 'القبطان'} • الأعضاء: {(t.membersCount || t.members?.length || 1)}/{getTribeMaxMembers(t.level || 1)} • القوة: {toArabicDigits(t.power || 0)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleJoin(t)}
                        style={{
                          padding: '14px 28px',
                          borderRadius: '12px',
                          border: '2.5px solid #b59a73',
                          background: isMember
                            ? 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)'
                            : 'linear-gradient(180deg, #f37f1c 0%, #b44305 100%)',
                          color: '#ffffff',
                          fontFamily: 'inherit',
                          fontSize: '26px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {isMember ? 'مغادرة' : 'انضمام'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleBackAction}
              style={{
                width: '100%',
                height: '96px',
                borderRadius: '10px',
                border: '3px solid #8c6d45',
                background: 'linear-gradient(180deg, #432e20 0%, #2b1d14 55%, #1d120b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                color: '#f2e0be',
                fontFamily: 'inherit',
                fontSize: '34px',
                fontWeight: '900',
              }}
            >
              <span>عودة</span>
              <span>←</span>
            </button>
          </div>
        )}

        {/* ===================== VIEW 5: INVITATIONS ===================== */}
        {screenMode === 'invitations' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                padding: '38px 28px',
                background: 'linear-gradient(180deg, #ecd8b4 0%, #cfa971 100%)',
                borderRadius: '8px',
                border: '3px solid #967245',
                textAlign: 'center',
                color: '#2b1c0c',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <EnvelopeInviteIcon />
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '900' }}>
                لديك {invitationsCount} رسائل دعوة
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#4c3217' }}>
                عندما يدعوك أحد القادة للانضمام إلى قبيلته ستظهر الرسائل هنا.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBackAction}
              style={{
                width: '100%',
                height: '96px',
                borderRadius: '10px',
                border: '3px solid #8c6d45',
                background: 'linear-gradient(180deg, #432e20 0%, #2b1d14 55%, #1d120b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                color: '#f2e0be',
                fontFamily: 'inherit',
                fontSize: '34px',
                fontWeight: '900',
              }}
            >
              <span>عودة</span>
              <span>←</span>
            </button>
          </div>
        )}

        {/* ===================== VIEW 6: DONATIONS ===================== */}
        {screenMode === 'donations' && currentTribe && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'linear-gradient(180deg, #1e2430 0%, #12161f 100%)',
                border: '3px solid #967245',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '26px', fontWeight: '800', color: '#f2d382' }}>رصيدك من الذهب:</span>
                <span style={{ fontSize: '30px', fontWeight: '900', color: '#ffffff' }}>{gold.toLocaleString('en-US')} 🪙</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[100, 500, 2000, 10000, 50000].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => handleRealDonate(amt)}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '2px solid #facc15',
                      background: 'linear-gradient(180deg, #ca8a04 0%, #854d0e 100%)',
                      color: '#fef08a',
                      fontFamily: 'inherit',
                      fontSize: '24px',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    +{toArabicDigits(amt)} 🪙
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="number"
                  min={10}
                  value={customDonationAmount}
                  onChange={(e) => setCustomDonationAmount(Math.max(1, Number(e.target.value) || 0))}
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '2px solid #8a6b41',
                    background: '#0b0e14',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '26px',
                    fontWeight: '800',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRealDonate(customDonationAmount)}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: '2.5px solid #86efac',
                    background: 'linear-gradient(180deg, #54bf36 0%, #195f0f 100%)',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '26px',
                    fontWeight: '900',
                    cursor: 'pointer',
                  }}
                >
                  تبرع الآن
                </button>
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, #1e2430 0%, #12161f 100%)',
                border: '2.5px solid #7f613b',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#f2d382' }}>
                المتبرعون في القبيلة ({toArabicDigits(realTribeDonors.length)})
              </div>
              {realTribeDonors.slice(0, 10).map((donor, idx) => (
                <div
                  key={donor.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '24px',
                    fontWeight: '700',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    paddingBottom: '10px',
                  }}
                >
                  <span>
                    #{toArabicDigits(idx + 1)} {donor.avatar} @{donor.name}
                  </span>
                  <span style={{ color: '#fef08a', fontWeight: '900' }}>
                    {donor.points.toLocaleString('ar-EG')} نقطة
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleBackAction}
              style={{
                width: '100%',
                height: '96px',
                borderRadius: '10px',
                border: '3px solid #8c6d45',
                background: 'linear-gradient(180deg, #432e20 0%, #2b1d14 55%, #1d120b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                color: '#f2e0be',
                fontFamily: 'inherit',
                fontSize: '34px',
                fontWeight: '900',
              }}
            >
              <span>عودة</span>
              <span>←</span>
            </button>
          </div>
        )}

        {/* ===================== VIEW 7: LEVELS ===================== */}
        {screenMode === 'levels' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'linear-gradient(180deg, #ecd8b4 0%, #cfa971 100%)',
                border: '2.5px solid #967245',
                borderRadius: '12px',
                padding: '18px 24px',
                color: '#2b1c0c',
                fontSize: '24px',
                fontWeight: '800',
                textAlign: 'center',
              }}
            >
              رصيد المستويات: {toArabicDigits(totalBalancePoints)} نقطة • الإضافة اليومية: {toArabicDigits(totalDailyAddition)} نقطة
            </div>

            <input
              type="text"
              placeholder="ابحث عن مستوى..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '2px solid #8a6b41',
                background: '#0f141e',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: '25px',
                fontWeight: '700',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />

            {filteredLevels.map((lvl) => {
              const isExpanded = !!expandedLevels[lvl.level];
              return (
                <div
                  key={lvl.level}
                  onClick={() => toggleLevelExpand(lvl.level)}
                  style={{
                    background: 'linear-gradient(180deg, #1d2430 0%, #11161f 100%)',
                    border: '2.5px solid #7f613b',
                    borderRadius: '14px',
                    padding: '18px 22px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '34px' }}>{lvl.icon}</span>
                      <div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#f2d382' }}>{lvl.name}</div>
                        <div style={{ fontSize: '21px', color: '#cbd5e1', fontWeight: '700' }}>{lvl.tag}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff' }}>{toArabicDigits(lvl.points)} نقطة</div>
                      <div style={{ fontSize: '20px', color: '#86efac', fontWeight: '800' }}>+{toArabicDigits(lvl.dailyPoints)} يومياً</div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '10px', fontSize: '23px', color: '#f1f5f9', lineHeight: 1.6 }}>
                      {lvl.bonusDesc}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleBackAction}
              style={{
                width: '100%',
                height: '96px',
                borderRadius: '10px',
                border: '3px solid #8c6d45',
                background: 'linear-gradient(180deg, #432e20 0%, #2b1d14 55%, #1d120b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                color: '#f2e0be',
                fontFamily: 'inherit',
                fontSize: '34px',
                fontWeight: '900',
              }}
            >
              <span>عودة</span>
              <span>←</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
