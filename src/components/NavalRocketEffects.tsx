import React, { useEffect, useRef } from 'react';

export type RocketTier = 'small' | 'medium' | 'large';

interface FlyingNavalMissileProps {
  tier: RocketTier;
  targetX: string;
  targetY: string;
}

const FLIGHT_CONFIG: Record<RocketTier, { durationMs: number; scale: number; smokeScale: number }> = {
  small: { durationMs: 750, scale: 0.85, smokeScale: 0.85 },
  medium: { durationMs: 900, scale: 1.04, smokeScale: 1.0 },
  large: { durationMs: 1200, scale: 1.24, smokeScale: 1.2 },
};

export const FlyingNavalMissile: React.FC<FlyingNavalMissileProps> = ({
  tier,
  targetX,
  targetY,
}) => {
  const cfg = FLIGHT_CONFIG[tier];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes naval-missile-dive {
          0% {
            left: calc(var(--missile-target-x) - 22%);
            top: max(-6%, calc(var(--missile-target-y) - 44%));
            transform: translate(-50%, -50%) rotate(134deg) scale(calc(var(--missile-scale) * 0.84));
            opacity: 0.92;
          }
          88% {
            opacity: 1;
          }
          100% {
            left: var(--missile-target-x);
            top: var(--missile-target-y);
            transform: translate(-50%, -50%) rotate(136deg) scale(var(--missile-scale));
            opacity: 1;
          }
        }

        @keyframes missile-exhaust-flicker {
          0% {
            transform: translateX(-50%) scaleY(0.9) scaleX(0.95);
            opacity: 0.92;
          }
          50% {
            transform: translateX(-50%) scaleY(1.12) scaleX(1.06);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) scaleY(0.96) scaleX(0.98);
            opacity: 0.95;
          }
        }

        @keyframes missile-smoke-billow {
          0% {
            transform: translateX(-50%) scale(0.94);
            opacity: 0.94;
          }
          100% {
            transform: translateX(-50%) scale(1.05);
            opacity: 0.98;
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          left: targetX,
          top: targetY,
          '--missile-target-x': targetX,
          '--missile-target-y': targetY,
          '--missile-scale': cfg.scale,
          animation: `naval-missile-dive ${cfg.durationMs}ms cubic-bezier(0.24, 0.14, 0.4, 1) forwards`,
          transformOrigin: 'center center',
          width: '96px',
          height: '130px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        } as React.CSSProperties}
      >
        {/* Long Thick Billowing Dark Charcoal Smoke Plume Trailing Behind Missile */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '96px',
            width: `${Math.round(165 * cfg.smokeScale)}px`,
            height: `${Math.round(370 * cfg.smokeScale)}px`,
            animation: 'missile-smoke-billow 0.22s ease-in-out infinite alternate',
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 170 380" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id={`mSmokeDark_${tier}`} cx="48%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.96" />
                <stop offset="55%" stopColor="#1c1917" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`mSmokeMid_${tier}`} cx="45%" cy="40%" r="58%">
                <stop offset="0%" stopColor="#71717a" stopOpacity="0.88" />
                <stop offset="50%" stopColor="#27272a" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`mTrailEmber_${tier}`} cx="50%" cy="18%" r="55%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#f97316" stopOpacity="0.85" />
                <stop offset="75%" stopColor="#ea580c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Billowing dark smoke trail extending far behind the missile */}
            <circle cx="85" cy="330" r="46" fill={`url(#mSmokeMid_${tier})`} />
            <circle cx="64" cy="285" r="44" fill={`url(#mSmokeDark_${tier})`} />
            <circle cx="106" cy="280" r="42" fill={`url(#mSmokeMid_${tier})`} />
            <circle cx="86" cy="235" r="50" fill={`url(#mSmokeDark_${tier})`} />
            <circle cx="58" cy="195" r="42" fill={`url(#mSmokeMid_${tier})`} />
            <circle cx="112" cy="190" r="40" fill={`url(#mSmokeDark_${tier})`} />
            <circle cx="85" cy="145" r="48" fill={`url(#mSmokeDark_${tier})`} />
            <circle cx="62" cy="108" r="38" fill={`url(#mSmokeMid_${tier})`} />
            <circle cx="108" cy="105" r="36" fill={`url(#mSmokeDark_${tier})`} />
            <circle cx="85" cy="64" r="42" fill={`url(#mSmokeDark_${tier})`} />
            <circle cx="70" cy="30" r="32" fill={`url(#mSmokeDark_${tier})`} />
            <circle cx="100" cy="32" r="30" fill={`url(#mSmokeMid_${tier})`} />

            {/* Warm orange fire glow inside the lower smoke near nozzle */}
            <ellipse cx="85" cy="48" rx="34" ry="44" fill={`url(#mTrailEmber_${tier})`} />

            {/* Glowing orange sparks embedded in the exhaust smoke */}
            <circle cx="60" cy="62" r="3.2" fill="#fde047" />
            <circle cx="112" cy="56" r="3" fill="#fb923c" />
            <circle cx="72" cy="102" r="2.8" fill="#f97316" />
            <circle cx="102" cy="116" r="2.5" fill="#facc15" />
            <circle cx="82" cy="148" r="2.2" fill="#ea580c" />
          </svg>
        </div>

        {/* Blazing Thruster Fire Burst Behind Missile Tail */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '80px',
            width: '86px',
            height: '92px',
            animation: 'missile-exhaust-flicker 0.1s ease-in-out infinite alternate',
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 90 96" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id={`mFlameCore_${tier}`} cx="50%" cy="22%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="28%" stopColor="#fef08a" stopOpacity="0.98" />
                <stop offset="62%" stopColor="#f97316" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d="M 45,4 Q 68,26 62,56 Q 74,44 68,78 Q 52,66 45,94 Q 36,64 20,76 Q 16,44 28,56 Q 22,26 45,4 Z"
              fill={`url(#mFlameCore_${tier})`}
              filter="drop-shadow(0 0 12px rgba(249, 115, 22, 0.95))"
            />
            <ellipse cx="45" cy="24" rx="14" ry="20" fill="#fef9c3" opacity="0.92" />
            <circle cx="24" cy="36" r="2.6" fill="#fef08a" />
            <circle cx="67" cy="38" r="2.6" fill="#fb923c" />
            <circle cx="30" cy="64" r="2.2" fill="#f97316" />
            <circle cx="60" cy="62" r="2.2" fill="#fde047" />
          </svg>
        </div>

        {/* Sleek Dark Metallic Naval Missile with Crimson Red Nose Cone (Pointing Up in SVG, Rotated +135deg to Dive) */}
        <svg
          viewBox="0 0 80 120"
          width="74"
          height="112"
          style={{
            position: 'relative',
            zIndex: 2,
            overflow: 'visible',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.85))',
          }}
        >
          <defs>
            <linearGradient id={`mNoseRed_${tier}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="38%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
            <linearGradient id={`mBodySteel_${tier}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="35%" stopColor="#52525b" />
              <stop offset="65%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>

          {/* Left & Right Tail Stabilizer Fins */}
          <polygon points="27,70 10,98 27,94" fill="#18181b" stroke="#52525b" strokeWidth="1" />
          <polygon points="53,70 70,98 53,94" fill="#18181b" stroke="#52525b" strokeWidth="1" />
          <polygon points="40,68 37,98 43,98" fill="#3f3f46" />

          {/* Main Cylindrical Charcoal Missile Body */}
          <rect x="27" y="42" width="26" height="54" rx="2" fill={`url(#mBodySteel_${tier})`} stroke="#09090b" strokeWidth="1.2" />
          {/* Metallic Band & Exhaust Nozzle */}
          <rect x="27" y="42" width="26" height="5" fill="#71717a" opacity="0.7" />
          <rect x="30" y="95" width="20" height="6" rx="1" fill="#18181b" />

          {/* Crimson Red Warhead Cone */}
          <path
            d="M 27,42 C 27,26 33,12 40,4 C 47,12 53,26 53,42 Z"
            fill={`url(#mNoseRed_${tier})`}
            stroke="#450a0a"
            strokeWidth="1.2"
          />
          {/* Specular highlight stripe */}
          <path d="M 34,40 C 34,27 37,16 40,8" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

interface NavalRocketExplosionProps {
  tier: RocketTier;
  x: string | number;
  y: string | number;
  damage?: number;
  onComplete?: () => void;
}

const EXPLOSION_CONFIG: Record<
  RocketTier,
  { durationMs: number; sizePx: number; particleCount: number; splashCount: number }
> = {
  small: { durationMs: 950, sizePx: 320, particleCount: 16, splashCount: 14 },
  medium: { durationMs: 1150, sizePx: 400, particleCount: 22, splashCount: 18 },
  large: { durationMs: 1350, sizePx: 480, particleCount: 28, splashCount: 24 },
};

const ROCKET_DEBRIS = [
  { tx: '-165px', ty: '-145px', r: '25deg', s: 14, d: '0.01s', p: 'M 4,10 L 10,2 L 20,6 L 18,16 L 8,19 Z' },
  { tx: '175px', ty: '-135px', r: '-30deg', s: 15, d: '0.015s', p: 'M 3,8 L 12,1 L 21,9 L 15,19 L 5,16 Z' },
  { tx: '-125px', ty: '-210px', r: '45deg', s: 12, d: '0.02s', p: 'M 2,11 L 9,3 L 19,4 L 16,15 L 7,18 Z' },
  { tx: '125px', ty: '-195px', r: '-42deg', s: 13, d: '0.025s', p: 'M 5,2 L 17,4 L 20,13 L 11,19 L 3,12 Z' },
  { tx: '-205px', ty: '-55px', r: '62deg', s: 11, d: '0.02s', p: 'M 3,6 L 14,2 L 19,11 L 12,18 L 2,13 Z' },
  { tx: '205px', ty: '-65px', r: '-58deg', s: 12, d: '0.025s', p: 'M 4,4 L 16,3 L 20,12 L 10,18 L 3,11 Z' },
  { tx: '-75px', ty: '-230px', r: '20deg', s: 10, d: '0.03s', p: 'M 2,8 L 11,2 L 18,8 L 13,17 L 4,15 Z' },
  { tx: '75px', ty: '-220px', r: '-25deg', s: 10, d: '0.03s', p: 'M 4,3 L 15,5 L 18,14 L 8,18 L 2,10 Z' },
  { tx: '-150px', ty: '25px', r: '78deg', s: 10, d: '0.02s', p: 'M 3,7 L 13,2 L 18,10 L 11,17 L 3,14 Z' },
  { tx: '155px', ty: '22px', r: '-72deg', s: 11, d: '0.02s', p: 'M 5,3 L 16,6 L 17,15 L 7,17 L 2,9 Z' },
];

const ROCKET_DROPLETS = [
  { x: -160, y: -25, r: 4.5 },
  { x: -135, y: -70, r: 5 },
  { x: -102, y: -95, r: 4 },
  { x: -62, y: -98, r: 4.5 },
  { x: 64, y: -100, r: 4.5 },
  { x: 104, y: -92, r: 4 },
  { x: 138, y: -66, r: 5 },
  { x: 164, y: -22, r: 4.5 },
  { x: -182, y: -8, r: 3.5 },
  { x: 185, y: -10, r: 3.5 },
];

export const NavalRocketExplosion: React.FC<NavalRocketExplosionProps> = ({
  tier,
  x,
  y,
  onComplete,
}) => {
  const cfg = EXPLOSION_CONFIG[tier];
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const pctX = typeof x === 'string' && x.endsWith('%') ? parseFloat(x) : 45;
    const pctY = typeof y === 'string' && y.endsWith('%') ? parseFloat(y) : 50;

    window.dispatchEvent(
      new CustomEvent('spawn-pirate-particles', {
        detail: {
          x: pctX,
          y: pctY,
          type: tier === 'large' ? 'destroy' : 'explosion',
          count: cfg.particleCount,
        },
      })
    );

    window.dispatchEvent(
      new CustomEvent('spawn-pirate-particles', {
        detail: {
          x: pctX,
          y: pctY + 3,
          type: 'water-splash',
          count: cfg.splashCount,
        },
      })
    );

    const timer = setTimeout(() => {
      onCompleteRef.current?.();
    }, cfg.durationMs);

    return () => clearTimeout(timer);
  }, [x, y, tier, cfg.particleCount, cfg.splashCount, cfg.durationMs]);

  return (
    <div
      style={{
        position: 'absolute',
        left: typeof x === 'number' ? `${x}px` : x,
        top: typeof y === 'number' ? `${y}px` : y,
        transform: 'translate(-50%, -50%)',
        zIndex: 9998,
        pointerEvents: 'none',
        width: `${cfg.sizePx}px`,
        height: `${cfg.sizePx}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes rkt-impact-flash {
          0% { transform: scale(0.25); opacity: 1; }
          35% { transform: scale(1.25); opacity: 0.75; }
          100% { transform: scale(1.7); opacity: 0; }
        }

        @keyframes rkt-water-crown {
          0% { transform: translate(-50%, -50%) scale(0.28, 0.22); opacity: 0.35; }
          22% { transform: translate(-50%, -56%) scale(1.08, 1.12); opacity: 1; }
          55% { transform: translate(-50%, -53%) scale(1.16, 0.96); opacity: 0.85; }
          100% { transform: translate(-50%, -48%) scale(1.3, 0.6); opacity: 0; }
        }

        @keyframes rkt-smoke-plume {
          0% { transform: translate(-54%, -52%) scale(0.28); opacity: 0.55; }
          20% { transform: translate(-56%, -60%) scale(1.06); opacity: 1; }
          55% { transform: translate(-58%, -66%) scale(1.18); opacity: 0.85; }
          100% { transform: translate(-62%, -74%) scale(1.3); opacity: 0; }
        }

        @keyframes rkt-fire-sparks {
          0% { transform: scale(0.5); opacity: 1; filter: brightness(1.6); }
          35% { transform: scale(1.12); opacity: 1; filter: brightness(1.25); }
          100% { transform: scale(1.25); opacity: 0; filter: brightness(0.8); }
        }

        @keyframes rkt-shockwave {
          0% { transform: translate(-50%, -50%) scale(0.18); opacity: 0.95; border-width: 10px; }
          100% { transform: translate(-50%, -50%) scale(2.15); opacity: 0; border-width: 1px; }
        }

        @keyframes rkt-debris-fly {
          0% { transform: translate(-50%, -50%) translate(0px, 0px) scale(0.55) rotate(0deg); opacity: 1; }
          60% { opacity: 0.9; }
          100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1.02) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

      {/* 1. Impact Flash & Orange Glow */}
      <div
        style={{
          position: 'absolute',
          inset: '-30px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,248,210,0.98) 0%, rgba(251,146,60,0.75) 35%, rgba(220,38,38,0.35) 62%, transparent 80%)',
          animation: `rkt-impact-flash ${Math.round(cfg.durationMs * 0.45)}ms ease-out forwards`,
          zIndex: 1,
        }}
      />

      {/* 2. Expanding Sea Water Shockwave Ring */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '56%',
          width: '58%',
          height: '28%',
          borderRadius: '50%',
          border: '8px solid rgba(224, 242, 254, 0.95)',
          boxShadow: '0 0 24px rgba(56, 189, 248, 0.85), inset 0 0 14px rgba(14, 165, 233, 0.65)',
          animation: `rkt-shockwave ${Math.round(cfg.durationMs * 0.72)}ms cubic-bezier(0.14, 0.84, 0.3, 1) forwards`,
          zIndex: 2,
        }}
      />

      {/* 3. Diagonal Rising Dark Charcoal-Black Smoke Plume */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '52%',
          width: '108%',
          height: '112%',
          animation: `rkt-smoke-plume ${cfg.durationMs}ms cubic-bezier(0.14, 0.82, 0.28, 1) forwards`,
          zIndex: 3,
        }}
      >
        <svg
          viewBox="0 0 420 420"
          width="100%"
          height="100%"
          style={{
            overflow: 'visible',
            filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.72))',
          }}
        >
          <defs>
            <radialGradient id={`rSmokeDark_${tier}`} cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="48%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
            <radialGradient id={`rSmokeMid_${tier}`} cx="42%" cy="38%" r="62%">
              <stop offset="0%" stopColor="#71717a" />
              <stop offset="52%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </radialGradient>
            <radialGradient id={`rBlastEmber_${tier}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
              <stop offset="30%" stopColor="#facc15" stopOpacity="0.98" />
              <stop offset="65%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Diagonal upper-left billowing dark smoke trail */}
          <circle cx="90" cy="70" r="56" fill={`url(#rSmokeMid_${tier})`} opacity="0.88" />
          <circle cx="145" cy="95" r="64" fill={`url(#rSmokeDark_${tier})`} opacity="0.92" />
          <circle cx="120" cy="145" r="68" fill={`url(#rSmokeMid_${tier})`} opacity="0.94" />
          <circle cx="195" cy="130" r="76" fill={`url(#rSmokeDark_${tier})`} opacity="0.96" />
          <circle cx="255" cy="160" r="74" fill={`url(#rSmokeMid_${tier})`} opacity="0.95" />

          {/* Main billowing charcoal/black smoke mass over target */}
          <circle cx="155" cy="225" r="78" fill={`url(#rSmokeMid_${tier})`} />
          <circle cx="285" cy="235" r="72" fill={`url(#rSmokeMid_${tier})`} />
          <circle cx="220" cy="210" r="88" fill={`url(#rSmokeDark_${tier})`} />
          <circle cx="225" cy="272" r="76" fill={`url(#rSmokeDark_${tier})`} />

          {/* Fiery orange/yellow impact burst & sparks inside the lower smoke */}
          <g style={{ animation: `rkt-fire-sparks ${Math.round(cfg.durationMs * 0.72)}ms ease-out forwards`, transformOrigin: '225px 275px' }}>
            <ellipse cx="228" cy="282" rx="68" ry="48" fill={`url(#rBlastEmber_${tier})`} />
            <ellipse cx="185" cy="250" rx="38" ry="30" fill={`url(#rBlastEmber_${tier})`} />
            <ellipse cx="268" cy="258" rx="36" ry="28" fill={`url(#rBlastEmber_${tier})`} />
            <ellipse cx="205" cy="198" rx="30" ry="24" fill={`url(#rBlastEmber_${tier})`} />

            {/* Bright fiery sparks */}
            <circle cx="176" cy="214" r="4" fill="#fef08a" />
            <circle cx="255" cy="205" r="4.5" fill="#fb923c" />
            <circle cx="220" cy="168" r="3.5" fill="#facc15" />
            <circle cx="152" cy="245" r="3.5" fill="#f97316" />
            <circle cx="292" cy="250" r="4" fill="#fde047" />
            <circle cx="195" cy="145" r="3" fill="#fb923c" />
            <circle cx="155" cy="118" r="2.8" fill="#f97316" />
          </g>

          {/* Foreground soot puffs */}
          <circle cx="180" cy="238" r="38" fill={`url(#rSmokeDark_${tier})`} opacity="0.72" />
          <circle cx="265" cy="246" r="38" fill={`url(#rSmokeDark_${tier})`} opacity="0.72" />
        </svg>
      </div>

      {/* 4. Frothy Ocean-Blue & White Water Splash Crown at Impact Base */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '62%',
          width: '108%',
          height: '52%',
          animation: `rkt-water-crown ${Math.round(cfg.durationMs * 0.88)}ms cubic-bezier(0.12, 0.88, 0.28, 1) forwards`,
          zIndex: 4,
        }}
      >
        <svg viewBox="0 0 440 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`rSplashBlue_${tier}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#0284c7" stopOpacity="0.95" />
              <stop offset="82%" stopColor="#7dd3fc" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
            <linearGradient id={`rFoamWhite_${tier}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.88" />
              <stop offset="55%" stopColor="#e0f2fe" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
          </defs>

          <path
            d="M 28,168 Q 38,108 16,68 Q 48,92 64,52 Q 86,92 104,42 Q 128,88 152,60 Q 178,104 220,94 Q 262,104 288,60 Q 312,88 336,42 Q 354,92 376,52 Q 392,92 424,68 Q 402,108 412,168 Q 320,192 220,192 Q 120,192 28,168 Z"
            fill={`url(#rSplashBlue_${tier})`}
            filter="drop-shadow(0 4px 10px rgba(14, 165, 233, 0.7))"
          />

          <path
            d="M 48,162 Q 56,118 34,82 Q 66,102 82,70 Q 104,104 126,64 Q 154,110 186,98 Q 204,126 220,120 Q 236,126 254,98 Q 286,110 314,64 Q 336,104 358,70 Q 374,102 406,82 Q 384,118 392,162 Q 308,184 220,184 Q 132,184 48,162 Z"
            fill={`url(#rFoamWhite_${tier})`}
          />

          <circle cx="92" cy="166" r="18" fill="#f0f9ff" opacity="0.95" />
          <circle cx="145" cy="174" r="22" fill="#ffffff" opacity="0.95" />
          <circle cx="220" cy="178" r="26" fill="#ffffff" opacity="0.98" />
          <circle cx="295" cy="174" r="22" fill="#ffffff" opacity="0.95" />
          <circle cx="348" cy="166" r="18" fill="#f0f9ff" opacity="0.95" />

          {ROCKET_DROPLETS.map((drop, idx) => (
            <circle
              key={idx}
              cx={220 + drop.x}
              cy={148 + drop.y}
              r={drop.r}
              fill="#ffffff"
              filter="drop-shadow(0 0 3px #7dd3fc)"
            />
          ))}
        </svg>
      </div>

      {/* 5. Radial Dark Scorched Debris & Shrapnel Chunks */}
      {ROCKET_DEBRIS.map((chunk, idx) => (
        <svg
          key={idx}
          viewBox="0 0 24 24"
          width={chunk.s}
          height={chunk.s}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            zIndex: 5,
            pointerEvents: 'none',
            '--tx': chunk.tx,
            '--ty': chunk.ty,
            '--rot': chunk.r,
            animation: `rkt-debris-fly ${Math.round(cfg.durationMs * 0.82)}ms ${chunk.d} cubic-bezier(0.16, 0.84, 0.32, 1) forwards`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
          } as React.CSSProperties}
        >
          <path d={chunk.p} fill="#27272a" stroke="#09090b" strokeWidth="1.2" />
        </svg>
      ))}
    </div>
  );
};

interface AdBombStrikeProps {
  x?: string;
  y?: string;
  onDetonate?: () => void;
  onComplete?: () => void;
}

export const AdBombStrike: React.FC<AdBombStrikeProps> = ({
  x = '48%',
  y = '52%',
  onDetonate,
  onComplete,
}) => {
  const [phase, setPhase] = React.useState<'descent' | 'impact'>('descent');
  const onDetonateRef = useRef(onDetonate);
  onDetonateRef.current = onDetonate;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const tImpact = setTimeout(() => {
      setPhase('impact');
      onDetonateRef.current?.();

      const pctX = x.endsWith('%') ? parseFloat(x) : 48;
      const pctY = y.endsWith('%') ? parseFloat(y) : 52;
      window.dispatchEvent(
        new CustomEvent('spawn-pirate-particles', {
          detail: { x: pctX, y: pctY, type: 'destroy', count: 28 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('spawn-pirate-particles', {
          detail: { x: pctX, y: pctY + 3, type: 'water-splash', count: 20 },
        })
      );
    }, 850);

    const tDone = setTimeout(() => {
      onCompleteRef.current?.();
    }, 2150);

    return () => {
      clearTimeout(tImpact);
      clearTimeout(tDone);
    };
  }, [x, y]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes ad-bomb-fall {
          0% {
            left: calc(var(--ad-target-x) - 10%);
            top: -110px;
            transform: translate(-50%, -50%) rotate(14deg) scale(0.85);
            opacity: 0.95;
          }
          100% {
            left: var(--ad-target-x);
            top: var(--ad-target-y);
            transform: translate(-50%, -50%) rotate(4deg) scale(1.12);
            opacity: 1;
          }
        }
        @keyframes ad-blast-ring {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
          45% { opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes ad-smoke-cloud {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.45; }
          25% { transform: translate(-50%, -56%) scale(1.1); opacity: 1; }
          75% { transform: translate(-50%, -62%) scale(1.22); opacity: 0.85; }
          100% { transform: translate(-50%, -68%) scale(1.32); opacity: 0; }
        }
      `}</style>

      {phase === 'descent' && (
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            '--ad-target-x': x,
            '--ad-target-y': y,
            animation: 'ad-bomb-fall 850ms cubic-bezier(0.32, 0.08, 0.78, 0.95) forwards',
            width: '120px',
            height: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          } as React.CSSProperties}
        >
          {/* Dark Smoke & Emerald Plasma Trail */}
          <svg
            viewBox="0 0 120 260"
            width="120"
            height="260"
            style={{
              position: 'absolute',
              bottom: '84px',
              left: '50%',
              transform: 'translateX(-50%)',
              overflow: 'visible',
            }}
          >
            <defs>
              <radialGradient id="adTrailSmoke" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#18181b" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#27272a" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#3f3f46" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="adTrailPlasma" cx="50%" cy="65%" r="55%">
                <stop offset="0%" stopColor="#bbf7d0" stopOpacity="1" />
                <stop offset="40%" stopColor="#22c55e" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="40" r="32" fill="url(#adTrailSmoke)" />
            <circle cx="48" cy="85" r="34" fill="url(#adTrailSmoke)" />
            <circle cx="72" cy="115" r="34" fill="url(#adTrailSmoke)" />
            <circle cx="60" cy="155" r="38" fill="url(#adTrailSmoke)" />
            <ellipse cx="60" cy="215" rx="34" ry="44" fill="url(#adTrailPlasma)" />
          </svg>

          {/* Heavy Canister Media Warhead */}
          <svg viewBox="0 0 90 120" width="84" height="112" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.9)) drop-shadow(0 0 14px rgba(34,197,94,0.85))' }}>
            <polygon points="24,18 45,36 66,18 58,6 32,6" fill="#18181b" stroke="#22c55e" strokeWidth="2" />
            <rect x="26" y="30" width="38" height="54" rx="8" fill="#09090b" stroke="#4ade80" strokeWidth="2.5" />
            <path d="M 26,84 Q 45,114 64,84 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
            <circle cx="45" cy="57" r="12" fill="#14532d" stroke="#4ade80" strokeWidth="2" />
            <text x="45" y="62" textAnchor="middle" fontSize="14" fill="#fef08a">⚡</text>
          </svg>
        </div>
      )}

      {phase === 'impact' && (
        <>
          {/* Bright Green & Orange Blast Flash */}
          <div
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254,249,195,0.95) 0%, rgba(34,197,94,0.72) 38%, rgba(234,88,12,0.4) 68%, transparent 82%)',
              animation: 'ad-blast-ring 1.1s ease-out forwards',
            }}
          />

          {/* Expanding Shockwave */}
          <div
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: '260px',
              height: '120px',
              borderRadius: '50%',
              border: '10px solid rgba(134, 239, 172, 0.95)',
              boxShadow: '0 0 36px rgba(34, 197, 94, 0.9), inset 0 0 22px rgba(74, 222, 128, 0.7)',
              animation: 'ad-blast-ring 1.25s cubic-bezier(0.14, 0.84, 0.3, 1) forwards',
            }}
          />

          {/* Billowing Smoke & Fire Cloud */}
          <div
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: '440px',
              height: '420px',
              animation: 'ad-smoke-cloud 1.3s cubic-bezier(0.14, 0.84, 0.3, 1) forwards',
            }}
          >
            <svg viewBox="0 0 440 420" width="100%" height="100%" style={{ overflow: 'visible', filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.75))' }}>
              <defs>
                <radialGradient id="adSmokeDark" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#3f3f46" />
                  <stop offset="50%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#09090b" />
                </radialGradient>
                <radialGradient id="adCoreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
                  <stop offset="35%" stopColor="#4ade80" stopOpacity="0.92" />
                  <stop offset="70%" stopColor="#ea580c" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="145" cy="240" r="72" fill="url(#adSmokeDark)" />
              <circle cx="295" cy="240" r="72" fill="url(#adSmokeDark)" />
              <circle cx="220" cy="175" r="88" fill="url(#adSmokeDark)" />
              <circle cx="220" cy="255" r="92" fill="url(#adSmokeDark)" />
              <ellipse cx="220" cy="240" rx="76" ry="56" fill="url(#adCoreGlow)" />
              <text x="220" y="254" textAnchor="middle" fontSize="64">📡💥</text>
            </svg>
          </div>
        </>
      )}
    </div>
  );
};
