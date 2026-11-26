import React from 'react';
import { formatFishingCountdown } from '../utils/fishingTimer';

interface ShipStatusBarsProps {
  fishingPct: number;
  energyPct: number;
  isFishing: boolean;
  isAutoFishing: boolean;
  isReady: boolean;
  remainingMs: number;
  curHeart: number;
  maxHeart: number;
  isDestroyed: boolean;
  scaleX: number;
  bottomOffset?: string;
  onCollect?: (e: React.MouseEvent) => void;
  onRepair?: (e: React.MouseEvent) => void;
}

const FishBarIcon: React.FC = () => (
  <svg
    width="22"
    height="16"
    viewBox="0 0 28 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))' }}
  >
    <path
      d="M21.5 10C18.5 5 13.5 3 8.5 4.5C5.2 5.5 2.5 8 1.5 10C2.5 12 5.2 14.5 8.5 15.5C13.5 17 18.5 15 21.5 10Z"
      fill="url(#shipFishBody)"
      stroke="#1e3a8a"
      strokeWidth="1.1"
    />
    <path
      d="M21 10L26.5 5.5C26.8 8.3 26.8 11.7 26.5 14.5L21 10Z"
      fill="#60a5fa"
      stroke="#1e3a8a"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    <path d="M10 4.3L13.5 1.5L14.5 4.5" fill="#93c5fd" stroke="#1e3a8a" strokeWidth="1" strokeLinejoin="round" />
    <ellipse cx="9" cy="11.2" rx="4.8" ry="2.6" fill="#eff6ff" fillOpacity="0.82" />
    <circle cx="5.6" cy="9.2" r="1.35" fill="#0f172a" />
    <circle cx="5.2" cy="8.8" r="0.45" fill="#ffffff" />
    <defs>
      <linearGradient id="shipFishBody" x1="2" y1="4" x2="21" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="55%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
  </svg>
);

const BoltBarIcon: React.FC = () => (
  <svg
    width="15"
    height="19"
    viewBox="0 0 18 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}
  >
    <path
      d="M11.2 1.2L2.5 13.1H8.4L6.8 22.8L15.5 10.9H9.6L11.2 1.2Z"
      fill="url(#shipBoltFill)"
      stroke="#78350f"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="shipBoltFill" x1="9" y1="1.2" x2="9" y2="22.8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="55%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>
  </svg>
);

export const ShipStatusBars: React.FC<ShipStatusBarsProps> = ({
  fishingPct,
  energyPct,
  isFishing,
  isAutoFishing,
  isReady,
  remainingMs,
  curHeart,
  maxHeart,
  isDestroyed,
  scaleX,
  bottomOffset = 'calc(100% - 112px)',
  onCollect,
  onRepair,
}) => {
  const safeFishingPct = Math.max(0, Math.min(100, Math.round(fishingPct)));
  const safeEnergyPct = Math.max(0, Math.min(100, Math.round(energyPct)));
  const safeCurHeart = isDestroyed ? 0 : Math.max(0, Math.round(curHeart));
  const safeMaxHeart = Math.max(1, Math.round(maxHeart));
  const formattedCurHeart = safeCurHeart.toLocaleString('en-US');
  const energyFontSize =
    formattedCurHeart.length > 14
      ? '10px'
      : formattedCurHeart.length > 10
        ? '11.5px'
        : formattedCurHeart.length > 7
          ? '13.5px'
          : '15.5px';
  const canRepair = isDestroyed || safeCurHeart < safeMaxHeart;
  const showFishingBar = isFishing && !isDestroyed;

  const fishingTooltip = isReady
    ? 'اكتمل الصيد 100% — اضغط لجمع الأسماك'
    : isAutoFishing
      ? `صيد آلي (${safeFishingPct}%)${remainingMs > 0 ? ` — المتبقي: ${formatFishingCountdown(remainingMs)}` : ''}`
      : isFishing && remainingMs > 0
        ? `جاري الصيد (${safeFishingPct}%) — المتبقي: ${formatFishingCountdown(remainingMs)}`
        : 'الصيد: 0%';

  const energyTooltip = `طاقة السفينة (سعة التخزين): ${formattedCurHeart} / ${safeMaxHeart.toLocaleString('en-US')}${
    canRepair ? ' — اضغط للصيانة' : ''
  }`;

  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: '50%',
        transform: `translateX(-50%) scaleX(${scaleX < 0 ? -1 : 1})`,
        width: '216px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        zIndex: 32,
        userSelect: 'none',
      }}
    >
      {/* Bar 1: Fishing Progress (الصيد) - visible ONLY when fishing */}
      {showFishingBar && (
        <div
          role={isReady ? 'button' : undefined}
          tabIndex={isReady ? 0 : undefined}
          title={fishingTooltip}
          onClick={(e) => {
            if (isReady && onCollect) {
              e.stopPropagation();
              onCollect(e);
            }
          }}
          onKeyDown={(e) => {
            if (isReady && onCollect && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              e.stopPropagation();
              onCollect(e as unknown as React.MouseEvent);
            }
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: '33px',
            borderRadius: '9999px',
            border: '2px solid #f4f1c9',
            background: '#0d2912',
            boxShadow: isReady
              ? '0 0 12px rgba(74, 222, 128, 0.85), 0 3px 8px rgba(0,0,0,0.72)'
              : '0 3px 8px rgba(0,0,0,0.72)',
            overflow: 'hidden',
            cursor: isReady ? 'pointer' : 'inherit',
          }}
        >
        {/* Right-anchored green fill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: `${safeFishingPct}%`,
            background: 'linear-gradient(180deg, #63eb3b 0%, #39c722 55%, #238e13 100%)',
            transition: 'width 0.45s ease-out',
            pointerEvents: 'none',
          }}
        />

        {/* Recessed dark inner label capsule */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            margin: '4px 11px',
            height: 'calc(100% - 8px)',
            borderRadius: '9999px',
            background: 'rgba(10, 34, 15, 0.74)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            padding: '0 8px',
          }}
        >
          <FishBarIcon />
          <span
            style={{
              color: '#ffffff',
              fontSize: '15.5px',
              fontWeight: 900,
              fontFamily: 'Cairo, sans-serif',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 1px 3px rgba(0,0,0,0.95)',
            }}
          >
            الصيد: {safeFishingPct}%
          </span>
        </div>
      </div>
      )}

      {/* Bar 2: Ship Energy (الطاقة) */}
      <div
        role={canRepair ? 'button' : undefined}
        tabIndex={canRepair ? 0 : undefined}
        title={energyTooltip}
        onClick={(e) => {
          if (canRepair && onRepair) {
            e.stopPropagation();
            onRepair(e);
          }
        }}
        onKeyDown={(e) => {
          if (canRepair && onRepair && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            e.stopPropagation();
            onRepair(e as unknown as React.MouseEvent);
          }
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: '33px',
          borderRadius: '9999px',
          border: '2px solid #f4f1c9',
          background: '#2c090c',
          boxShadow: '0 3px 8px rgba(0,0,0,0.72)',
          overflow: 'hidden',
          cursor: canRepair ? 'pointer' : 'inherit',
        }}
      >
        {/* Right-anchored red fill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: `${safeEnergyPct}%`,
            background: 'linear-gradient(180deg, #ff6464 0%, #e13737 55%, #b91c1c 100%)',
            transition: 'width 0.45s ease-out',
            pointerEvents: 'none',
          }}
        />

        {/* Recessed dark inner label capsule */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            margin: '4px 8px',
            height: 'calc(100% - 8px)',
            borderRadius: '9999px',
            background: 'rgba(54, 10, 14, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '0 6px',
          }}
        >
          <BoltBarIcon />
          <span
            style={{
              color: '#ffffff',
              fontSize: energyFontSize,
              fontWeight: 900,
              fontFamily: 'Cairo, sans-serif',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 1px 3px rgba(0,0,0,0.95)',
            }}
          >
            الطاقة: {formattedCurHeart}
          </span>
        </div>
      </div>
    </div>
  );
};
