import React, { useEffect, useState } from 'react';
import { playWaterPlungeSound } from '../utils/explosionSound';

interface AtomicBombExplosionProps {
  x?: string | number; // Horizontal center (e.g. "45%")
  surfaceY?: string | number; // Sea water surface level (e.g. "48%")
  depthY?: string | number; // Target sea/fleet impact Y (e.g. "64%")
  onDetonate?: () => void;
  onComplete?: () => void;
}

const DEBRIS_CHUNKS = [
  { tx: '-230px', ty: '-190px', r: '18deg', size: 18, delay: '0.02s', path: 'M 4,10 L 10,2 L 20,6 L 18,16 L 8,19 Z' },
  { tx: '240px', ty: '-175px', r: '-25deg', size: 19, delay: '0.03s', path: 'M 3,8 L 12,1 L 21,9 L 15,19 L 5,16 Z' },
  { tx: '-165px', ty: '-250px', r: '42deg', size: 15, delay: '0.05s', path: 'M 2,11 L 9,3 L 19,4 L 16,15 L 7,18 Z' },
  { tx: '175px', ty: '-245px', r: '-38deg', size: 16, delay: '0.04s', path: 'M 5,2 L 17,4 L 20,13 L 11,19 L 3,12 Z' },
  { tx: '-280px', ty: '-75px', r: '60deg', size: 14, delay: '0.06s', path: 'M 3,6 L 14,2 L 19,11 L 12,18 L 2,13 Z' },
  { tx: '275px', ty: '-85px', r: '-54deg', size: 15, delay: '0.05s', path: 'M 4,4 L 16,3 L 20,12 L 10,18 L 3,11 Z' },
  { tx: '-95px', ty: '-285px', r: '25deg', size: 13, delay: '0.07s', path: 'M 2,8 L 11,2 L 18,8 L 13,17 L 4,15 Z' },
  { tx: '105px', ty: '-280px', r: '-30deg', size: 13, delay: '0.08s', path: 'M 4,3 L 15,5 L 18,14 L 8,18 L 2,10 Z' },
  { tx: '-205px', ty: '25px', r: '80deg', size: 12, delay: '0.04s', path: 'M 3,7 L 13,2 L 18,10 L 11,17 L 3,14 Z' },
  { tx: '215px', ty: '20px', r: '-75deg', size: 12, delay: '0.06s', path: 'M 5,3 L 16,6 L 17,15 L 7,17 L 2,9 Z' },
  { tx: '-35px', ty: '-305px', r: '15deg', size: 11, delay: '0.09s', path: 'M 4,5 L 14,2 L 17,11 L 9,17 L 3,12 Z' },
  { tx: '45px', ty: '-295px', r: '-20deg', size: 11, delay: '0.07s', path: 'M 3,4 L 14,4 L 18,12 L 9,17 L 2,10 Z' },
  { tx: '-255px', ty: '-135px', r: '33deg', size: 10, delay: '0.08s', path: 'M 4,5 L 12,2 L 17,9 L 11,16 L 3,13 Z' },
  { tx: '255px', ty: '-140px', r: '-40deg', size: 10, delay: '0.09s', path: 'M 3,4 L 13,3 L 17,10 L 9,16 L 2,9 Z' },
];

const WATER_DROPLETS = [
  { x: -180, y: -35, r: 5 },
  { x: -155, y: -85, r: 6 },
  { x: -125, y: -115, r: 4.5 },
  { x: -95, y: -135, r: 5.5 },
  { x: -55, y: -120, r: 4 },
  { x: 55, y: -125, r: 4.5 },
  { x: 95, y: -140, r: 5.5 },
  { x: 130, y: -112, r: 5 },
  { x: 160, y: -80, r: 6 },
  { x: 185, y: -32, r: 4.5 },
  { x: -205, y: -18, r: 4 },
  { x: 208, y: -22, r: 4 },
];

export const AtomicBombExplosion: React.FC<AtomicBombExplosionProps> = ({
  x = '45%',
  surfaceY = '48%',
  depthY = '64%',
  onDetonate,
  onComplete,
}) => {
  // Phase sequence synchronized with App.tsx (drop at 0ms, explosion at 1350ms):
  // 1. 'descent': Flaming spiky skull sea-mine plunges from sky with tall black smoke trail (0ms - 1350ms)
  // 2. 'detonating': Massive ocean water splash crown + billowing black death smoke + glowing orange fire pockets + flying dark debris (1350ms - 3400ms)
  // 3. 'dissipating': Smoke and sea spray disperse cleanly (3400ms - 4500ms)
  const [phase, setPhase] = useState<'descent' | 'detonating' | 'dissipating'>('descent');

  useEffect(() => {
    const tSurfaceSplashAudio = setTimeout(() => {
      playWaterPlungeSound();
    }, 1220);

    const tDetonate = setTimeout(() => {
      setPhase('detonating');
      if (onDetonate) onDetonate();

      // Trigger dynamic canvas particles alongside the SVG blast
      const pctX = typeof x === 'string' && x.endsWith('%') ? parseFloat(x) : 45;
      const pctY = typeof surfaceY === 'string' && surfaceY.endsWith('%') ? parseFloat(surfaceY) + 6 : 55;
      window.dispatchEvent(
        new CustomEvent('spawn-pirate-particles', {
          detail: { x: pctX, y: pctY, type: 'destroy', count: 38 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('spawn-pirate-particles', {
          detail: { x: pctX, y: pctY + 4, type: 'water-splash', count: 34 },
        })
      );
    }, 1350);

    const tDissipate = setTimeout(() => {
      setPhase('dissipating');
    }, 3400);

    const tComplete = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4500);

    return () => {
      clearTimeout(tSurfaceSplashAudio);
      clearTimeout(tDetonate);
      clearTimeout(tDissipate);
      clearTimeout(tComplete);
    };
  }, [x, surfaceY, onDetonate, onComplete]);

  const centerX = typeof x === 'number' ? `${x}px` : x;
  const surfaceTop = typeof surfaceY === 'number' ? `${surfaceY}px` : surfaceY;
  const depthTop = typeof depthY === 'number' ? `${depthY}px` : depthY;
  const impactTop = `calc((${surfaceTop} + ${depthTop}) / 2)`;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        /* 1. Falling flaming skull-mine path from high sky down to sea surface */
        @keyframes bd-mine-descent {
          0% {
            top: -120px;
            transform: translate(-50%, -50%) scale(0.92);
            opacity: 1;
          }
          82% {
            top: ${surfaceTop};
            transform: translate(-50%, -50%) scale(1.06);
            opacity: 1;
          }
          100% {
            top: ${impactTop};
            transform: translate(-50%, -50%) scale(1.16);
            opacity: 1;
          }
        }

        /* 2. Flickering fire aura around the falling mine */
        @keyframes bd-descent-fire-flicker {
          0% {
            transform: translateX(-50%) scaleY(0.94) scaleX(0.97);
            opacity: 0.92;
          }
          50% {
            transform: translateX(-50%) scaleY(1.09) scaleX(1.04);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) scaleY(0.98) scaleX(0.96);
            opacity: 0.95;
          }
        }

        /* 3. Rising black smoke puffs trailing behind the falling mine */
        @keyframes bd-trail-smoke-rise {
          0% {
            transform: translate(-50%, 0) scale(0.75);
            opacity: 0.92;
          }
          50% {
            transform: translate(-48%, -26px) scale(1.05);
            opacity: 0.88;
          }
          100% {
            transform: translate(-52%, -52px) scale(1.22);
            opacity: 0.72;
          }
        }

        /* 4. Side sparks/debris shaking around the descending mine */
        @keyframes bd-side-shrapnel-jitter {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            transform: translate(0, -10px) rotate(16deg);
          }
        }

        /* 5. Impact sky/sea flash */
        @keyframes bd-detonation-flash {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 0.95;
            background: radial-gradient(circle at ${centerX} ${impactTop}, rgba(255, 240, 200, 0.95) 0%, rgba(249, 115, 22, 0.45) 38%, rgba(15, 23, 42, 0.35) 100%);
          }
          45% {
            opacity: 0.4;
            background: radial-gradient(circle at ${centerX} ${impactTop}, rgba(251, 146, 60, 0.35) 0%, rgba(0, 0, 0, 0.25) 100%);
          }
          100% {
            opacity: 0;
            background: transparent;
          }
        }

        /* 6. Billowing Black Death smoke cloud eruption */
        @keyframes bd-black-cloud-erupt {
          0% {
            transform: translate(-50%, -45%) scale(0.18);
            opacity: 0.4;
          }
          16% {
            transform: translate(-50%, -62%) scale(1.06);
            opacity: 1;
          }
          45% {
            transform: translate(-50%, -68%) scale(1.2);
            opacity: 1;
          }
          78% {
            transform: translate(-50%, -74%) scale(1.28);
            opacity: 0.94;
          }
          100% {
            transform: translate(-50%, -82%) scale(1.38);
            opacity: 0;
          }
        }

        /* 7. Inner fiery ember glow pulsing through cracks of black smoke */
        @keyframes bd-inner-ember-pulse {
          0% {
            opacity: 0.85;
            transform: scale(0.95);
            filter: brightness(1.1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
            filter: brightness(1.45);
          }
          100% {
            opacity: 0.6;
            transform: scale(1.16);
            filter: brightness(1.0);
          }
        }

        /* 8. Massive frothy sea water splash crown bursting around the blast base */
        @keyframes bd-water-crown-burst {
          0% {
            transform: translate(-50%, -55%) scale(0.25, 0.2);
            opacity: 0.3;
          }
          16% {
            transform: translate(-50%, -66%) scale(1.08, 1.12);
            opacity: 1;
          }
          48% {
            transform: translate(-50%, -62%) scale(1.2, 1.04);
            opacity: 0.95;
          }
          80% {
            transform: translate(-50%, -56%) scale(1.3, 0.85);
            opacity: 0.65;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.42, 0.65);
            opacity: 0;
          }
        }

        /* 9. Expanding foaming water shockwave ripple */
        @keyframes bd-sea-shockwave {
          0% {
            transform: translate(-50%, -50%) scale(0.15);
            opacity: 0.95;
            border-width: 14px;
          }
          55% {
            opacity: 0.75;
            border-width: 7px;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.8);
            opacity: 0;
            border-width: 1px;
          }
        }

        /* 10. Radial flying dark shrapnel debris chunks */
        @keyframes bd-debris-fly {
          0% {
            transform: translate(-50%, -50%) translate(0px, 0px) scale(0.5) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1.15) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>

      {/* =====================================================================
          STAGE 1: DESCENT — Flaming Spiky Skull Mine + Tall Black Smoke Plume
          ===================================================================== */}
      {phase === 'descent' && (
        <div
          style={{
            position: 'absolute',
            left: centerX,
            top: 0,
            zIndex: 9999,
            animation: 'bd-mine-descent 1.35s cubic-bezier(0.32, 0.08, 0.78, 0.95) forwards',
            pointerEvents: 'none',
            width: '180px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Tall billowing dark black-gray smoke column rising behind the mine */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '92px',
              width: '180px',
              height: '440px',
              transform: 'translateX(-50%)',
              animation: 'bd-trail-smoke-rise 0.45s ease-in-out infinite alternate',
              pointerEvents: 'none',
            }}
          >
            <svg viewBox="0 0 180 440" width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <radialGradient id="bdTrailSmokeDark" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1c1917" stopOpacity="0.96" />
                  <stop offset="55%" stopColor="#27272a" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#3f3f46" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="bdTrailSmokeSoot" cx="45%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#09090b" stopOpacity="0.95" />
                  <stop offset="65%" stopColor="#292524" stopOpacity="0.82" />
                  <stop offset="100%" stopColor="#52525b" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Continuous upper smoke column */}
              <circle cx="90" cy="40" r="44" fill="url(#bdTrailSmokeDark)" />
              <circle cx="72" cy="85" r="42" fill="url(#bdTrailSmokeSoot)" />
              <circle cx="108" cy="95" r="40" fill="url(#bdTrailSmokeDark)" />
              <circle cx="88" cy="145" r="48" fill="url(#bdTrailSmokeSoot)" />
              <circle cx="65" cy="195" r="38" fill="url(#bdTrailSmokeDark)" />
              <circle cx="114" cy="205" r="40" fill="url(#bdTrailSmokeDark)" />
              <circle cx="90" cy="255" r="50" fill="url(#bdTrailSmokeSoot)" />
              <circle cx="68" cy="305" r="38" fill="url(#bdTrailSmokeDark)" />
              <circle cx="112" cy="312" r="38" fill="url(#bdTrailSmokeDark)" />
              <circle cx="90" cy="360" r="46" fill="url(#bdTrailSmokeSoot)" />
              <circle cx="72" cy="400" r="34" fill="url(#bdTrailSmokeDark)" />
              <circle cx="108" cy="402" r="34" fill="url(#bdTrailSmokeDark)" />
            </svg>
          </div>

          {/* Blazing Orange & Yellow Fire Corona wrapping the descending skull mine */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '54px',
              width: '150px',
              height: '155px',
              transform: 'translateX(-50%)',
              animation: 'bd-descent-fire-flicker 0.16s ease-in-out infinite alternate',
              pointerEvents: 'none',
            }}
          >
            <svg viewBox="0 0 150 155" width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <radialGradient id="bdDescentFireCore" cx="50%" cy="68%" r="55%">
                  <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
                  <stop offset="30%" stopColor="#facc15" stopOpacity="0.98" />
                  <stop offset="65%" stopColor="#f97316" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Jagged fire tongues rising into the black smoke */}
              <path
                d="M 28,128 Q 18,86 42,60 Q 38,34 64,18 Q 74,0 82,22 Q 108,8 104,46 Q 134,58 122,126 Z"
                fill="url(#bdDescentFireCore)"
                filter="drop-shadow(0 0 16px rgba(249, 115, 22, 0.9))"
              />
              <path
                d="M 42,130 Q 45,86 60,55 Q 74,24 88,52 Q 106,82 108,130 Z"
                fill="#fef08a"
                opacity="0.82"
              />
            </svg>
          </div>

          {/* Spiky Black Iron Naval Mine with Skull Emblem */}
          <div style={{ position: 'relative', width: '112px', height: '112px', zIndex: 3 }}>
            <svg
              viewBox="0 0 120 120"
              width="100%"
              height="100%"
              style={{
                overflow: 'visible',
                filter: 'drop-shadow(0 8px 18px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 16px rgba(249, 115, 22, 0.65))',
              }}
            >
              <defs>
                <radialGradient id="bdMineBodyGrad" cx="38%" cy="34%" r="65%">
                  <stop offset="0%" stopColor="#52525b" />
                  <stop offset="45%" stopColor="#27272a" />
                  <stop offset="85%" stopColor="#09090b" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>
                <linearGradient id="bdSpikeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a1a1aa" />
                  <stop offset="45%" stopColor="#3f3f46" />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>
                <radialGradient id="bdSkullGrad" cx="45%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#e4e4e7" />
                  <stop offset="100%" stopColor="#a1a1aa" />
                </radialGradient>
              </defs>

              {/* 8 Spiked Naval Mine Horns */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <g key={deg} transform={`rotate(${deg} 60 60)`}>
                  <polygon
                    points="54,22 60,4 66,22"
                    fill="url(#bdSpikeGrad)"
                    stroke="#18181b"
                    strokeWidth="1.5"
                  />
                  <rect x="52" y="19" width="16" height="5" rx="2" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />
                </g>
              ))}

              {/* Main Iron Mine Sphere */}
              <circle cx="60" cy="60" r="39" fill="url(#bdMineBodyGrad)" stroke="#18181b" strokeWidth="2.5" />
              {/* Metallic Plate Rim & Rivets */}
              <circle cx="60" cy="60" r="32" fill="none" stroke="#3f3f46" strokeWidth="1.4" strokeDasharray="4 4" />
              <circle cx="60" cy="28" r="2.2" fill="#71717a" />
              <circle cx="60" cy="92" r="2.2" fill="#71717a" />
              <circle cx="28" cy="60" r="2.2" fill="#71717a" />
              <circle cx="92" cy="60" r="2.2" fill="#71717a" />

              {/* Center Skull Emblem (Black Death Signature) */}
              <g transform="translate(60, 60)">
                {/* Cranium */}
                <path
                  d="M -15,-3 C -15,-15 -8,-20 0,-20 C 8,-20 15,-15 15,-3 C 15,3 11,7 9,10 L 9,17 L -9,17 L -9,10 C -11,7 -15,3 -15,-3 Z"
                  fill="url(#bdSkullGrad)"
                  stroke="#09090b"
                  strokeWidth="1.6"
                />
                {/* Eye sockets */}
                <ellipse cx="-6" cy="-4" rx="4.2" ry="4.6" fill="#09090b" />
                <ellipse cx="6" cy="-4" rx="4.2" ry="4.6" fill="#09090b" />
                {/* Subtle fiery ember glint inside eyes */}
                <circle cx="-6" cy="-4" r="1.4" fill="#f97316" />
                <circle cx="6" cy="-4" r="1.4" fill="#f97316" />
                {/* Nasal cavity */}
                <polygon points="0,1 -2.5,6 2.5,6" fill="#09090b" />
                {/* Teeth lines */}
                <line x1="-5" y1="12" x2="-5" y2="17" stroke="#09090b" strokeWidth="1.5" />
                <line x1="0" y1="11.5" x2="0" y2="17" stroke="#09090b" strokeWidth="1.5" />
                <line x1="5" y1="12" x2="5" y2="17" stroke="#09090b" strokeWidth="1.5" />
              </g>
            </svg>
          </div>

          {/* Flanking Dark Shrapnel Fragments tumbling beside the falling mine */}
          <svg
            viewBox="0 0 180 120"
            width="180"
            height="120"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'bd-side-shrapnel-jitter 0.25s ease-in-out infinite alternate',
            }}
          >
            <polygon points="18,45 26,39 30,49 21,54" fill="#27272a" />
            <polygon points="154,48 164,42 167,52 158,57" fill="#18181b" />
            <polygon points="24,78 32,74 35,82 26,85" fill="#3f3f46" />
            <polygon points="146,80 156,75 158,84 149,87" fill="#27272a" />
            <circle cx="34" cy="30" r="2.8" fill="#f97316" />
            <circle cx="145" cy="28" r="2.8" fill="#facc15" />
          </svg>
        </div>
      )}

      {/* =====================================================================
          STAGE 2: DETONATION — Water Splash Crown + Black Smoke + Inner Fire + Debris
          ===================================================================== */}
      {(phase === 'detonating' || phase === 'dissipating') && (
        <>
          {/* 1. Brief Impact Flash Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              animation: 'bd-detonation-flash 0.75s ease-out forwards',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          />

          {/* 2. Expanding Sea Surface Foaming Shockwave */}
          <div
            style={{
              position: 'absolute',
              left: centerX,
              top: impactTop,
              width: '320px',
              height: '130px',
              borderRadius: '50%',
              border: '12px solid rgba(224, 242, 254, 0.95)',
              boxShadow: '0 0 40px rgba(56, 189, 248, 0.85), inset 0 0 28px rgba(14, 165, 233, 0.7)',
              animation: 'bd-sea-shockwave 1.8s cubic-bezier(0.14, 0.84, 0.3, 1) forwards',
              pointerEvents: 'none',
            }}
          />

          {/* 3. Colossal Billowing Black Death Smoke Cloud with Glowing Orange Embers */}
          <div
            style={{
              position: 'absolute',
              left: centerX,
              top: impactTop,
              width: '540px',
              maxWidth: '98vw',
              height: '500px',
              animation: 'bd-black-cloud-erupt 3.15s cubic-bezier(0.12, 0.85, 0.25, 1) forwards',
              pointerEvents: 'none',
              zIndex: 9996,
            }}
          >
            <svg
              viewBox="0 0 540 500"
              width="100%"
              height="100%"
              style={{
                overflow: 'visible',
                filter: 'drop-shadow(0 18px 36px rgba(0, 0, 0, 0.78))',
              }}
            >
              <defs>
                {/* Dense Dark Charcoal & Soot Smoke Gradients */}
                <radialGradient id="bdDeepSoot" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#3f3f46" />
                  <stop offset="45%" stopColor="#1c1917" />
                  <stop offset="85%" stopColor="#09090b" />
                  <stop offset="100%" stopColor="#050505" />
                </radialGradient>
                <radialGradient id="bdMidSmoke" cx="40%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#52525b" />
                  <stop offset="50%" stopColor="#27272a" />
                  <stop offset="100%" stopColor="#18181b" />
                </radialGradient>
                <radialGradient id="bdOuterAsh" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#71717a" />
                  <stop offset="55%" stopColor="#3f3f46" />
                  <stop offset="100%" stopColor="#18181b" />
                </radialGradient>
                {/* Glowing Hot Fire Pockets trapped inside the dark smoke */}
                <radialGradient id="bdFirePocket" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
                  <stop offset="28%" stopColor="#facc15" stopOpacity="0.96" />
                  <stop offset="62%" stopColor="#ea580c" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Outer dark swirling smoke lobes */}
              <circle cx="145" cy="275" r="78" fill="url(#bdOuterAsh)" />
              <circle cx="395" cy="275" r="78" fill="url(#bdOuterAsh)" />
              <circle cx="115" cy="205" r="74" fill="url(#bdMidSmoke)" />
              <circle cx="425" cy="205" r="74" fill="url(#bdMidSmoke)" />
              <circle cx="170" cy="135" r="82" fill="url(#bdOuterAsh)" />
              <circle cx="370" cy="135" r="82" fill="url(#bdOuterAsh)" />
              <circle cx="270" cy="105" r="95" fill="url(#bdMidSmoke)" />

              {/* Core dense black billowing cloud mass */}
              <circle cx="205" cy="255" r="92" fill="url(#bdDeepSoot)" />
              <circle cx="335" cy="255" r="92" fill="url(#bdDeepSoot)" />
              <circle cx="270" cy="245" r="105" fill="url(#bdDeepSoot)" />
              <circle cx="195" cy="185" r="86" fill="url(#bdDeepSoot)" />
              <circle cx="345" cy="185" r="86" fill="url(#bdDeepSoot)" />
              <circle cx="270" cy="168" r="96" fill="url(#bdDeepSoot)" />
              <circle cx="235" cy="315" r="78" fill="url(#bdMidSmoke)" />
              <circle cx="305" cy="315" r="78" fill="url(#bdMidSmoke)" />

              {/* Glowing Fiery Orange-Red Ember Pockets breaking through the black smoke */}
              <g style={{ animation: 'bd-inner-ember-pulse 0.7s ease-in-out infinite alternate', transformOrigin: '270px 250px' }}>
                <ellipse cx="270" cy="265" rx="76" ry="52" fill="url(#bdFirePocket)" />
                <ellipse cx="212" cy="245" rx="44" ry="34" fill="url(#bdFirePocket)" />
                <ellipse cx="328" cy="248" rx="44" ry="34" fill="url(#bdFirePocket)" />
                <ellipse cx="268" cy="200" rx="48" ry="36" fill="url(#bdFirePocket)" />
                <circle cx="182" cy="285" r="26" fill="url(#bdFirePocket)" />
                <circle cx="358" cy="282" r="28" fill="url(#bdFirePocket)" />
                <circle cx="290" cy="160" r="22" fill="url(#bdFirePocket)" />
              </g>

              {/* Overlapping foreground soot puffs so fire glows between dark clouds */}
              <circle cx="240" cy="222" r="48" fill="url(#bdDeepSoot)" opacity="0.88" />
              <circle cx="305" cy="226" r="46" fill="url(#bdDeepSoot)" opacity="0.88" />
              <circle cx="165" cy="252" r="46" fill="url(#bdMidSmoke)" opacity="0.85" />
              <circle cx="375" cy="252" r="46" fill="url(#bdMidSmoke)" opacity="0.85" />
              <circle cx="270" cy="296" r="54" fill="url(#bdDeepSoot)" opacity="0.82" />
              <circle cx="270" cy="78" r="56" fill="url(#bdMidSmoke)" opacity="0.92" />

              {/* Hot glowing sparks scattered inside the smoke */}
              <circle cx="205" cy="215" r="4" fill="#fde047" />
              <circle cx="335" cy="220" r="4.5" fill="#fb923c" />
              <circle cx="268" cy="175" r="3.5" fill="#fef08a" />
              <circle cx="160" cy="280" r="3.5" fill="#f97316" />
              <circle cx="380" cy="278" r="4" fill="#facc15" />
            </svg>
          </div>

          {/* 4. Massive Frothy White & Ocean-Blue Water Splash Crown at Blast Base */}
          <div
            style={{
              position: 'absolute',
              left: centerX,
              top: impactTop,
              width: '560px',
              maxWidth: '98vw',
              height: '250px',
              animation: 'bd-water-crown-burst 2.65s cubic-bezier(0.12, 0.88, 0.28, 1) forwards',
              pointerEvents: 'none',
              zIndex: 9997,
            }}
          >
            <svg viewBox="0 0 560 250" width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="bdSeaSplashBlue" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#0284c7" stopOpacity="0.95" />
                  <stop offset="80%" stopColor="#7dd3fc" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="bdSeaFoamWhite" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="55%" stopColor="#e0f2fe" stopOpacity="0.96" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Sweeping Left & Right Jagged Ocean Water Walls */}
              <path
                d="M 40,210 Q 50,140 20,90 Q 55,115 72,72 Q 95,115 112,55 Q 138,110 162,75 Q 190,128 220,105 Q 250,145 280,120 Q 310,145 340,105 Q 370,128 398,75 Q 422,110 448,55 Q 465,115 488,72 Q 505,115 540,90 Q 510,140 520,210 Q 410,238 280,238 Q 150,238 40,210 Z"
                fill="url(#bdSeaSplashBlue)"
                filter="drop-shadow(0 4px 12px rgba(14, 165, 233, 0.7))"
              />

              {/* Crisp Frothy White Splash Crests & Wave Arcs */}
              <path
                d="M 62,202 Q 72,150 42,108 Q 76,128 92,92 Q 116,130 138,80 Q 168,136 200,120 Q 240,165 280,148 Q 320,165 360,120 Q 392,136 422,80 Q 444,130 468,92 Q 484,128 518,108 Q 488,150 498,202 Q 395,228 280,228 Q 165,228 62,202 Z"
                fill="url(#bdSeaFoamWhite)"
              />

              {/* Turbulent Foam Base Rollers */}
              <circle cx="110" cy="206" r="24" fill="#f0f9ff" opacity="0.95" />
              <circle cx="165" cy="216" r="28" fill="#ffffff" opacity="0.95" />
              <circle cx="225" cy="222" r="30" fill="#e0f2fe" opacity="0.95" />
              <circle cx="280" cy="224" r="34" fill="#ffffff" opacity="0.98" />
              <circle cx="335" cy="222" r="30" fill="#e0f2fe" opacity="0.95" />
              <circle cx="395" cy="216" r="28" fill="#ffffff" opacity="0.95" />
              <circle cx="450" cy="206" r="24" fill="#f0f9ff" opacity="0.95" />

              {/* Flying Water Spray Droplets */}
              {WATER_DROPLETS.map((drop, idx) => (
                <circle
                  key={idx}
                  cx={280 + drop.x}
                  cy={190 + drop.y}
                  r={drop.r}
                  fill="#ffffff"
                  filter="drop-shadow(0 0 4px #7dd3fc)"
                />
              ))}
            </svg>
          </div>

          {/* 5. Radial Dark Scorched Debris & Shrapnel Chunks */}
          {DEBRIS_CHUNKS.map((chunk, idx) => (
            <svg
              key={idx}
              viewBox="0 0 24 24"
              width={chunk.size}
              height={chunk.size}
              style={{
                position: 'absolute',
                left: centerX,
                top: impactTop,
                zIndex: 9998,
                pointerEvents: 'none',
                '--tx': chunk.tx,
                '--ty': chunk.ty,
                '--rot': chunk.r,
                animation: `bd-debris-fly 1.95s ${chunk.delay} cubic-bezier(0.16, 0.84, 0.32, 1) forwards`,
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.85))',
              } as React.CSSProperties}
            >
              <path d={chunk.path} fill="#27272a" stroke="#09090b" strokeWidth="1.2" />
            </svg>
          ))}
        </>
      )}
    </div>
  );
};

export default AtomicBombExplosion;
