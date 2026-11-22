import React from 'react';

interface ShipImageProps {
  level: number;
  width?: number;
  plain?: boolean;
  fill?: boolean;
}

export interface CardRect {
  imageUrl: string;
  x: number;       // pixel X in original sheet
  y: number;       // pixel Y in original sheet
  width: number;   // pixel width in original sheet
  height: number;  // pixel height in original sheet
  sheetWidth: number;
  sheetHeight: number;
}

export const getShipCardRect = (level: number): CardRect => {
  const URL_1_TO_17 = 'https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/IMG-20260705-WA0016.jpg';
  const URL_18_TO_31 = 'https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/IMG-20260705-WA0017.jpg';

  if (level <= 17) {
    const sheetWidth = 1149;
    const sheetHeight = 1369;
    
    // Precise grid for Levels 1-17
    const marginLeft = 13;
    const gapX = 6.5;
    const cardWidth = 181.5;
    
    const marginTop = 76;
    const gapY = 10;
    const cardHeight = 387;

    const idx = level - 1;
    const row = Math.floor(idx / 6);
    const col = idx % 6;

    return {
      imageUrl: URL_1_TO_17,
      x: marginLeft + col * (cardWidth + gapX),
      y: marginTop + row * (cardHeight + gapY),
      width: cardWidth,
      height: cardHeight,
      sheetWidth,
      sheetHeight,
    };
  } else {
    const sheetWidth = 1536;
    const sheetHeight = 1024;
    
    // Precise grid for Levels 18-31
    const marginLeft = 16;
    const gapX = 8;
    const cardWidth = 244;
    
    const marginTop = 60;
    const gapY = 10;
    const cardHeight = 298;

    if (level === 30) {
      // Level 30 is a wide card spanning the left half (3 columns wide)
      const wideCardWidth = 3 * cardWidth + 2 * gapX; // 748
      return {
        imageUrl: URL_18_TO_31,
        x: marginLeft,
        y: marginTop + 2 * (cardHeight + gapY),
        width: wideCardWidth,
        height: cardHeight,
        sheetWidth,
        sheetHeight,
      };
    } else if (level === 31) {
      // Level 31 is a wide card spanning the right half (3 columns wide)
      const wideCardWidth = 3 * cardWidth + 2 * gapX; // 748
      return {
        imageUrl: URL_18_TO_31,
        x: marginLeft + 3 * (cardWidth + gapX), // 16 + 3 * 252 = 772
        y: marginTop + 2 * (cardHeight + gapY),
        width: wideCardWidth,
        height: cardHeight,
        sheetWidth,
        sheetHeight,
      };
    } else {
      const idx = level - 18;
      const row = Math.floor(idx / 6);
      const col = idx % 6;

      return {
        imageUrl: URL_18_TO_31,
        x: marginLeft + col * (cardWidth + gapX),
        y: marginTop + row * (cardHeight + gapY),
        width: cardWidth,
        height: cardHeight,
        sheetWidth,
        sheetHeight,
      };
    }
  }
};

export const FISHERMAN_BOAT_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_01.png";
export const SMALL_SAILBOAT_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_02.png";
export const SAILBOAT_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_03.png";
export const MEDIUM_SAILBOAT_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_04.png";
export const SMALL_MERCHANT_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_05.png";
export const MEDIUM_MERCHANT_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_06.png";
export const LIGHT_WARSHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_07.png";
export const MEDIUM_WARSHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_08.png";
export const ROYAL_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_09.png";
export const FLEET_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_10.png";
export const LEGENDARY_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_11.png";
export const DRAGON_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_12.png";
export const EMPEROR_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/13_ship.png";
export const TITAN_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/14_ship.png";
export const GREAT_OCEAN_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-15.png";
export const LEGENDS_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-16.png";
export const KINGS_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/17_ship.png";
export const CONQUEROR_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/18_alfateh.png";
export const VICTORY_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/19_alnasr.png";
export const GLORY_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/20_alhaymana.png";
export const SPIRITS_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/21_ali3sar.png";
export const DARKNESS_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/22_althalam.png";
export const ROYAL_NAVY_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/23_almalakiya.png";
export const BLUE_OCEAN_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/24_almuheet.png";
export const THUNDER_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-25.png";
export const GOLDEN_DRAGON_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-26.png";
export const HURRICANE_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-27.png";
export const CAESAR_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-28.png";
export const SEA_LEGENDS_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-29.png";
export const MASTER_OF_SEAS_SHIP_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-30.png";
export const SUBMARINE_BASIC_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_6_saudi_classic.png";
export const SUBMARINE_UPGRADE_1_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_1_gold_saudi%20(1).png";
export const SUBMARINE_UPGRADE_2_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_2_green_aura.png";
export const SUBMARINE_UPGRADE_3_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_3_blue_aura.png";
export const SUBMARINE_UPGRADE_4_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_4_pink_aura.png";
export const SUBMARINE_UPGRADE_MAX_IMAGE = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_5_red_dragon.png";

const getLocalShipUrl = (lvl: number): string => {
  const num = Number(lvl) || 0;
  if (num === 1) {
    return FISHERMAN_BOAT_IMAGE;
  }
  if (num === 2) {
    return SMALL_SAILBOAT_IMAGE;
  }
  if (num === 3) {
    return SAILBOAT_IMAGE;
  }
  if (num === 4) {
    return MEDIUM_SAILBOAT_IMAGE;
  }
  if (num === 5) {
    return SMALL_MERCHANT_SHIP_IMAGE;
  }
  if (num === 6) {
    return MEDIUM_MERCHANT_SHIP_IMAGE;
  }
  if (num === 7) {
    return LIGHT_WARSHIP_IMAGE;
  }
  if (num === 8) {
    return MEDIUM_WARSHIP_IMAGE;
  }
  if (num === 9) {
    return ROYAL_SHIP_IMAGE;
  }
  if (num === 10) {
    return FLEET_SHIP_IMAGE;
  }
  if (num === 11) {
    return LEGENDARY_SHIP_IMAGE;
  }
  if (num === 12) {
    return DRAGON_SHIP_IMAGE;
  }
  if (num === 13) {
    return EMPEROR_SHIP_IMAGE;
  }
  if (num === 14) {
    return TITAN_SHIP_IMAGE;
  }
  if (num === 15) {
    return GREAT_OCEAN_SHIP_IMAGE;
  }
  if (num === 16) {
    return LEGENDS_SHIP_IMAGE;
  }
  if (num === 17) {
    return KINGS_SHIP_IMAGE;
  }
  if (num === 18) {
    return CONQUEROR_SHIP_IMAGE;
  }
  if (num === 19) {
    return VICTORY_SHIP_IMAGE;
  }
  if (num === 20) {
    return GLORY_SHIP_IMAGE;
  }
  if (num === 21) {
    return SPIRITS_SHIP_IMAGE;
  }
  if (num === 22) {
    return DARKNESS_SHIP_IMAGE;
  }
  if (num === 23) {
    return ROYAL_NAVY_SHIP_IMAGE;
  }
  if (num === 24) {
    return BLUE_OCEAN_SHIP_IMAGE;
  }
  if (num === 25) {
    return THUNDER_SHIP_IMAGE;
  }
  if (num === 26) {
    return GOLDEN_DRAGON_SHIP_IMAGE;
  }
  if (num === 27) {
    return HURRICANE_SHIP_IMAGE;
  }
  if (num === 28) {
    return CAESAR_SHIP_IMAGE;
  }
  if (num === 29) {
    return SEA_LEGENDS_SHIP_IMAGE;
  }
  if (num === 30) {
    return MASTER_OF_SEAS_SHIP_IMAGE;
  }
  if (num === 32) {
    return SUBMARINE_BASIC_IMAGE;
  }
  if (num === 33) {
    return SUBMARINE_UPGRADE_1_IMAGE;
  }
  if (num === 34) {
    return SUBMARINE_UPGRADE_2_IMAGE;
  }
  if (num === 35) {
    return SUBMARINE_UPGRADE_3_IMAGE;
  }
  if (num === 36) {
    return SUBMARINE_UPGRADE_4_IMAGE;
  }
  if (num >= 37) {
    return SUBMARINE_UPGRADE_MAX_IMAGE;
  }
  const safeLvl = Math.max(0, Math.min(num, 31));
  return `/ships/ship_${String(safeLvl).padStart(2, '0')}.webp`;
};

const SHIP_IMAGES_1_TO_31: Record<number, string> = {
  0: '/ships/ship_00.webp',
  1: FISHERMAN_BOAT_IMAGE,
  2: SMALL_SAILBOAT_IMAGE,
  3: SAILBOAT_IMAGE,
  4: MEDIUM_SAILBOAT_IMAGE,
  5: SMALL_MERCHANT_SHIP_IMAGE,
  6: MEDIUM_MERCHANT_SHIP_IMAGE,
  7: LIGHT_WARSHIP_IMAGE,
  8: MEDIUM_WARSHIP_IMAGE,
  9: ROYAL_SHIP_IMAGE,
  10: FLEET_SHIP_IMAGE,
  11: LEGENDARY_SHIP_IMAGE,
  12: DRAGON_SHIP_IMAGE,
  13: EMPEROR_SHIP_IMAGE,
  14: TITAN_SHIP_IMAGE,
  15: GREAT_OCEAN_SHIP_IMAGE,
  16: LEGENDS_SHIP_IMAGE,
  17: KINGS_SHIP_IMAGE,
  18: CONQUEROR_SHIP_IMAGE,
  19: VICTORY_SHIP_IMAGE,
  20: GLORY_SHIP_IMAGE,
  21: SPIRITS_SHIP_IMAGE,
  22: DARKNESS_SHIP_IMAGE,
  23: ROYAL_NAVY_SHIP_IMAGE,
  24: BLUE_OCEAN_SHIP_IMAGE,
  25: THUNDER_SHIP_IMAGE,
  26: GOLDEN_DRAGON_SHIP_IMAGE,
  27: HURRICANE_SHIP_IMAGE,
  28: CAESAR_SHIP_IMAGE,
  29: SEA_LEGENDS_SHIP_IMAGE,
  30: MASTER_OF_SEAS_SHIP_IMAGE,
  31: '/ships/ship_31.webp',
};

const SHIP_SCALES: Record<number, number> = {
  1: 1.0,
  2: 1.0,
  3: 1.0,
  4: 1.0,
  5: 1.0,
  6: 1.0,
  7: 1.0,
  8: 1.0,
  9: 1.0,
  10: 1.0,
  11: 1.0,
  12: 1.0,
  13: 1.0,
  14: 1.0,
  15: 1.0,
  16: 1.0,
  17: 1.0,
  18: 1.0,
  19: 1.0,
  20: 1.0,
  21: 1.0,
  22: 1.0,
  23: 1.0,
  24: 1.0,
  25: 1.0,
  26: 1.0,
  27: 1.0,
  28: 1.0,
  29: 1.0,
  30: 1.0,
  31: 1.1,
  32: 1.1,
  33: 1.1,
  34: 1.1,
  35: 1.1,
  36: 1.1,
  37: 1.1,
};

const SHIP_TRANSLATES: Record<number, string> = {};

const ShipImage: React.FC<ShipImageProps> = ({ level, width = 140, plain = false, fill = false }) => {
  const safeLvl = Math.max(0, Math.min(Number(level) || 0, 37));
  const containerHeight = plain ? width * 0.95 : width * 0.9;
  const localUrl = getLocalShipUrl(safeLvl);
  const scaleVal = SHIP_SCALES[safeLvl] || (safeLvl === 0 ? 1.0 : 1.35);
  const translateYVal = SHIP_TRANSLATES[safeLvl] || '0px';

  return (
    <div
      id={`ship-image-lvl${safeLvl}`}
      style={{
        width: fill ? '100%' : `${width}px`,
        height: fill ? '100%' : `${containerHeight}px`,
        minHeight: fill ? '100%' : `${containerHeight}px`,
        maxWidth: '100%',
        backgroundImage: localUrl ? `url('${localUrl}')` : undefined,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        margin: '0 auto',
        borderRadius: '12px',
        boxShadow: plain ? 'none' : '0 4px 10px rgba(0,0,0,0.6)',
        border: plain ? 'none' : '2px solid #ca8a04',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: plain ? 'transparent' : '#140c06',
        transform: `scale(${scaleVal}) translateY(${translateYVal})`,
        transformOrigin: 'center center',
        WebkitMaskImage: plain && !(safeLvl >= 1 && safeLvl <= 30) && safeLvl < 32 && localUrl ? 'radial-gradient(ellipse 65% 55% at 50% 50%, black 40%, rgba(0,0,0,0.85) 60%, transparent 92%)' : undefined,
        maskImage: plain && !(safeLvl >= 1 && safeLvl <= 30) && safeLvl < 32 && localUrl ? 'radial-gradient(ellipse 65% 55% at 50% 50%, black 40%, rgba(0,0,0,0.85) 60%, transparent 92%)' : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!localUrl && (
        <span style={{ fontSize: `${Math.round(width * 0.45)}px`, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }}>🤿</span>
      )}
    </div>
  );
};

export default React.memo(ShipImage);
