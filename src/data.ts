export interface ShopShipSpec {
  level: number;
  name: string;
  subName: string;
  hook: number;
  cargo: number;
  heart: number;
  durationStr: string;
  power: number;
  armor: number;
  fishTypes: string[];
  price: number;
  emoji: string;
  image: string;
  rarity?: string;
  attackStat?: number;
  defenseStat?: number;
  speedStat?: number;
  capacityStat?: number;
  description?: string;
}

export interface HarborLevel {
  level: number;
  capacity: string;
  x: number;
  y: number;
}

export const HARBOR_BASE_URL = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/Aamaaq/refs/heads/main/level-";

export const getHarborImageUrl = (level: number) => {
  const currentLevel = Math.max(1, Math.min(Number(level) || 1, 35));
  const paddedLevel = String(currentLevel).padStart(2, '0');
  return `${HARBOR_BASE_URL}${paddedLevel}.png`;
};

export const FISH_HOUSE_CAPACITY_BY_LEVEL: Record<number, number> = {
  1: 100_000,
  2: 200_000,
  3: 300_000,
  4: 400_000,
  5: 500_000,
  6: 600_000,
  7: 700_000,
  8: 800_000,
  9: 900_000,
  10: 1_000_000,
  11: 1_100_000,
  12: 1_200_000,
  13: 1_300_000,
  14: 1_400_000,
  15: 1_500_000,
  16: 1_600_000,
  17: 1_700_000,
  18: 1_800_000,
  19: 1_900_000,
  20: 2_000_000,
  21: 4_000_000,
  22: 6_000_000,
  23: 8_000_000,
  24: 10_000_000,
  25: 12_000_000,
  26: 14_000_000,
  27: 16_000_000,
  28: 18_000_000,
  29: 20_000_000,
  30: 22_000_000,
  31: 24_000_000,
};

export const SHIP_CAPACITY_BY_LEVEL: Record<number, number> = {
  1: 2_000,
  2: 3_000,
  3: 4_000,
  4: 5_000,
  5: 6_000,
  6: 7_000,
  7: 8_000,
  8: 9_000,
  9: 10_000,
  10: 12_000,
  11: 14_000,
  12: 16_000,
  13: 18_000,
  14: 20_000,
  15: 23_000,
  16: 26_000,
  17: 29_000,
  18: 32_000,
  19: 36_000,
  20: 40_000,
  21: 45_000,
  22: 50_000,
  23: 55_000,
  24: 60_000,
  25: 65_000,
  26: 70_000,
  27: 75_000,
  28: 80_000,
  29: 85_000,
  30: 90_000,
  31: 100_000,
};

export const getFishHouseCapacity = (level: number): number => {
  const currentLvl = Math.max(1, Math.min(Number(level) || 1, 31));
  return FISH_HOUSE_CAPACITY_BY_LEVEL[currentLvl] || 100_000;
};

export const getShipCapacity = (level: number): number => {
  const currentLvl = Math.max(1, Math.min(Number(level) || 1, 37));
  if (currentLvl > 31) {
    // Extended scaling for submarines: Level 0 (32) starts at 125,000 up to Level Max (37) at 300,000
    return 125_000 + (currentLvl - 32) * 35_000;
  }
  return SHIP_CAPACITY_BY_LEVEL[currentLvl] || 2_000;
};

export const getSubmarineDisplayTier = (level: number): string => {
  const tier = (Number(level) || 32) - 32;
  if (tier <= 0) return 'المستوى الأساسي 0';
  if (tier === 1) return 'المستوى 1';
  if (tier === 2) return 'المستوى 2';
  if (tier === 3) return 'المستوى 3';
  if (tier === 4) return 'المستوى 4';
  return 'المستوى Max ⭐';
};

export const getSubmarineTag = (level: number): string => {
  const tier = (Number(level) || 32) - 32;
  if (tier <= 0) return 'الأساسي 0';
  if (tier === 1) return 'المستوى 1';
  if (tier === 2) return 'المستوى 2';
  if (tier === 3) return 'المستوى 3';
  if (tier === 4) return 'المستوى 4';
  return 'Max ⭐';
};

export interface SubmarineUpgradeRule {
  fromLevel: number;
  toLevel: number;
  stepNumber: number;
  title: string;
  cost: number;
  failRate: number;
  successRate: number;
  isMax: boolean;
}

export const SUBMARINE_UPGRADE_RULES: SubmarineUpgradeRule[] = [
  {
    fromLevel: 32,
    toLevel: 33,
    stepNumber: 1,
    title: 'الترقية الأولى',
    cost: 10_000_000,
    failRate: 50,
    successRate: 50,
    isMax: false,
  },
  {
    fromLevel: 33,
    toLevel: 34,
    stepNumber: 2,
    title: 'الترقية الثانية',
    cost: 15_000_000,
    failRate: 40,
    successRate: 60,
    isMax: false,
  },
  {
    fromLevel: 34,
    toLevel: 35,
    stepNumber: 3,
    title: 'الترقية الثالثة',
    cost: 20_000_000,
    failRate: 30,
    successRate: 70,
    isMax: false,
  },
  {
    fromLevel: 35,
    toLevel: 36,
    stepNumber: 4,
    title: 'الترقية الرابعة',
    cost: 25_000_000,
    failRate: 20,
    successRate: 80,
    isMax: false,
  },
  {
    fromLevel: 36,
    toLevel: 37,
    stepNumber: 5,
    title: 'الترقية الخامسة (MAX)',
    cost: 30_000_000,
    failRate: 10,
    successRate: 90,
    isMax: true,
  },
];

export const getSubmarineUpgradeRule = (currentLevel: number): SubmarineUpgradeRule | null => {
  return SUBMARINE_UPGRADE_RULES.find((r) => r.fromLevel === currentLevel) || null;
};

export interface ShipData {
  level: number;
  name: string;
  description?: string;
  storageCapacity: number;
  storageWithLucky: number;
  withoutCrewFishing: number;
  sailorFishing: number;
  withoutCrewFill: string;
  withoutCrewPlusLucky: string;
  sailor: string;
  sailorPlusLucky: string;
  fishTypes: string[];
}

export const shipsData: ShipData[] = [
  { level: 1, name: "قارب", storageCapacity: 2000, storageWithLucky: 4000, withoutCrewFishing: 10, sailorFishing: 5, withoutCrewFill: "2س 50د", withoutCrewPlusLucky: "1س 30د", sailor: "1س 30د", sailorPlusLucky: "25د", fishTypes: ["هامور"] },
  { level: 2, name: "الشوعي", storageCapacity: 3000, storageWithLucky: 6000, withoutCrewFishing: 10, sailorFishing: 5, withoutCrewFill: "3س 50د", withoutCrewPlusLucky: "2س", sailor: "2س", sailorPlusLucky: "1س", fishTypes: ["شعري"] },
  { level: 3, name: "الربان", storageCapacity: 4000, storageWithLucky: 8000, withoutCrewFishing: 12, sailorFishing: 6, withoutCrewFill: "5س", withoutCrewPlusLucky: "2س 36د", sailor: "2س 36د", sailorPlusLucky: "1س 18د", fishTypes: ["صافي", "ناجل"] },
  { level: 4, name: "اليخت", storageCapacity: 5000, storageWithLucky: 10000, withoutCrewFishing: 12, sailorFishing: 6, withoutCrewFill: "5س 24د", withoutCrewPlusLucky: "2س 48د", sailor: "2س 48د", sailorPlusLucky: "1س 24د", fishTypes: ["بياض", "كنعد"] },
  { level: 5, name: "الشراعي", storageCapacity: 6000, storageWithLucky: 12000, withoutCrewFishing: 15, sailorFishing: 7.5, withoutCrewFill: "7س", withoutCrewPlusLucky: "3س 30د", sailor: "3س 30د", sailorPlusLucky: "1س 45د", fishTypes: ["بدح", "حريد"] },
  { level: 6, name: "السندباد", storageCapacity: 7000, storageWithLucky: 14000, withoutCrewFishing: 15, sailorFishing: 7.5, withoutCrewFill: "7س 15د", withoutCrewPlusLucky: "3س 45د", sailor: "3س 45د", sailorPlusLucky: "1س 52.5د", fishTypes: ["باراكودا", "تونة"] },
  { level: 7, name: "المرجان", storageCapacity: 8000, storageWithLucky: 16000, withoutCrewFishing: 18, sailorFishing: 9, withoutCrewFill: "9س", withoutCrewPlusLucky: "4س 30د", sailor: "4س 30د", sailorPlusLucky: "2س 15د", fishTypes: ["سلطان إبراهيم", "سبيطي"] },
  { level: 8, name: "ترولر الأعماق", storageCapacity: 9000, storageWithLucky: 18000, withoutCrewFishing: 18, sailorFishing: 9, withoutCrewFill: "9س", withoutCrewPlusLucky: "4س 30د", sailor: "4س 30د", sailorPlusLucky: "2س 15د", fishTypes: ["لقز", "أبو سيف"] },
  { level: 9, name: "واحة البحار", storageCapacity: 10000, storageWithLucky: 20000, withoutCrewFishing: 20, sailorFishing: 10, withoutCrewFill: "10س", withoutCrewPlusLucky: "5س", sailor: "5س", sailorPlusLucky: "2س 30د", fishTypes: ["دولفين", "ماكريل"] },
  { level: 10, name: "المقدام", storageCapacity: 12000, storageWithLucky: 24000, withoutCrewFishing: 20, sailorFishing: 10, withoutCrewFill: "9س 20د", withoutCrewPlusLucky: "4س 40د", sailor: "4س 40د", sailorPlusLucky: "2س 20د", fishTypes: ["روبيان", "سلطعون"] },
  { level: 11, name: "سفينة أسطورية", storageCapacity: 14000, storageWithLucky: 28000, withoutCrewFishing: 12.5, sailorFishing: 12.5, withoutCrewFill: "11س 15د", withoutCrewPlusLucky: "5س 50د", sailor: "5س 50د", sailorPlusLucky: "2س 55د", fishTypes: ["صافي", "ناجل"] },
  { level: 12, name: "سفينة التنين", storageCapacity: 16000, storageWithLucky: 32000, withoutCrewFishing: 12.5, sailorFishing: 12.5, withoutCrewFill: "10س 25د", withoutCrewPlusLucky: "5س 25د", sailor: "5س 25د", sailorPlusLucky: "2س 42.5د", fishTypes: ["شعري", "سلمون بحري"] },
  { level: 13, name: "شاهين البحر", storageCapacity: 18000, storageWithLucky: 36000, withoutCrewFishing: 15, sailorFishing: 15, withoutCrewFill: "12س 30د", withoutCrewPlusLucky: "6س 30د", sailor: "6س 30د", sailorPlusLucky: "3س 15د", fishTypes: ["سييطي عميق", "أبو الشص"] },
  { level: 14, name: "الحفارة", storageCapacity: 20000, storageWithLucky: 40000, withoutCrewFishing: 15, sailorFishing: 15, withoutCrewFill: "12س", withoutCrewPlusLucky: "6س", sailor: "6س", sailorPlusLucky: "3س", fishTypes: ["أخطبوط", "قرش"] },
  { level: 15, name: "سفينة الأبحاث", storageCapacity: 23000, storageWithLucky: 46000, withoutCrewFishing: 17.5, sailorFishing: 17.5, withoutCrewFill: "12س 50د", withoutCrewPlusLucky: "6س 25د", sailor: "6س 25د", sailorPlusLucky: "3س 12.5د", fishTypes: ["سمك موسى", "الأفعى السمكية"] },
  { level: 16, name: "باخرة", storageCapacity: 26000, storageWithLucky: 52000, withoutCrewFishing: 17.5, sailorFishing: 17.5, withoutCrewFill: "12س 15د", withoutCrewPlusLucky: "6س 7.5د", sailor: "6س 7.5د", sailorPlusLucky: "3س 12.5د", fishTypes: ["سمك الترس", "سمك سردين"] },
  { level: 17, name: "سفينة حربية", storageCapacity: 29000, storageWithLucky: 58000, withoutCrewFishing: 20, sailorFishing: 20, withoutCrewFill: "13س 20د", withoutCrewPlusLucky: "6س 40د", sailor: "6س 40د", sailorPlusLucky: "3س 20د", fishTypes: ["قنفذ البحر", "دولفين"] },
  { level: 18, name: "سفينة الصقر", storageCapacity: 32000, storageWithLucky: 64000, withoutCrewFishing: 20, sailorFishing: 20, withoutCrewFill: "12س 40د", withoutCrewPlusLucky: "6س 20د", sailor: "6س 20د", sailorPlusLucky: "3س 20د", fishTypes: ["قد", "فرس البحر"] },
  { level: 19, name: "سفينة الأفق الملكي", storageCapacity: 36000, storageWithLucky: 72000, withoutCrewFishing: 22.5, sailorFishing: 22.5, withoutCrewFill: "13س 30د", withoutCrewPlusLucky: "6س 45د", sailor: "6س 45د", sailorPlusLucky: "3س 22.5د", fishTypes: ["الفراشة الملكية", "حبار الأعماق"] },
  { level: 20, name: "سفينة الجحيم", storageCapacity: 40000, storageWithLucky: 80000, withoutCrewFishing: 22.5, sailorFishing: 22.5, withoutCrewFill: "12س 45د", withoutCrewPlusLucky: "6س 22.5د", sailor: "6س 22.5د", sailorPlusLucky: "3س 22.5د", fishTypes: ["سمكة التنين", "سمكة الشيطان الأسود"] },
  { level: 21, name: "سفينة درع المحيط", storageCapacity: 45000, storageWithLucky: 90000, withoutCrewFishing: 25, sailorFishing: 25, withoutCrewFill: "1ي 1س", withoutCrewPlusLucky: "12س 30د", sailor: "12س 30د", sailorPlusLucky: "6س 15د", fishTypes: ["سمكة الموج الذهبي", "سمكة الدرع الأزرق"] },
  { level: 22, name: "سفينة السلطعون", storageCapacity: 50000, storageWithLucky: 100000, withoutCrewFishing: 25, sailorFishing: 25, withoutCrewFill: "1ي 9س 20د", withoutCrewPlusLucky: "16س 40د", sailor: "16س 40د", sailorPlusLucky: "8س 20د", fishTypes: ["سمكة الرمل الذهبي", "سمكة المرجان"] },
  { level: 23, name: "سفينة الأفعى البحرية", storageCapacity: 55000, storageWithLucky: 110000, withoutCrewFishing: 26, sailorFishing: 26, withoutCrewFill: "1ي 18س 28د", withoutCrewPlusLucky: "21س 40د", sailor: "21س 40د", sailorPlusLucky: "10س 50د", fishTypes: ["سمكة المانتا الملكية", "سمكة الزرقاء"] },
  { level: 24, name: "سفينة شمس المحيط", storageCapacity: 60000, storageWithLucky: 120000, withoutCrewFishing: 26, sailorFishing: 26, withoutCrewFill: "2ي 32د", withoutCrewPlusLucky: "1ي 16س", sailor: "1ي 16س", sailorPlusLucky: "12س 8د", fishTypes: ["سمكة القمر البنفسجي", "سمكة الزمرد الأزرق"] },
  { level: 25, name: "سفينة الدلفين الأزرق", storageCapacity: 65000, storageWithLucky: 130000, withoutCrewFishing: 27, sailorFishing: 27, withoutCrewFill: "2ي 7س 48د", withoutCrewPlusLucky: "1ي 3س 54د", sailor: "1ي 3س 54د", sailorPlusLucky: "13س 57د", fishTypes: ["سمكة الأسد البحرية", "سمكة السييلاكانت"] },
  { level: 26, name: "سفينة الكراكن", storageCapacity: 70000, storageWithLucky: 140000, withoutCrewFishing: 27, sailorFishing: 27, withoutCrewFill: "2ي 12س 18د", withoutCrewPlusLucky: "1ي 6س 9د", sailor: "1ي 6س 9د", sailorPlusLucky: "15س 18د", fishTypes: ["الأطوم", "سمكة زهرة القرن"] },
  { level: 27, name: "سفينة تنين البحر", storageCapacity: 75000, storageWithLucky: 150000, withoutCrewFishing: 28, sailorFishing: 28, withoutCrewFill: "2ي 19س 12د", withoutCrewPlusLucky: "1ي 9س 36د", sailor: "1ي 9س 36د", sailorPlusLucky: "16س 48د", fishTypes: ["سمكة اللهيب الأحمر", "سمكة الزعنفة الحديدية"] },
  { level: 28, name: "السفينة الإمبراطورية", storageCapacity: 80000, storageWithLucky: 160000, withoutCrewFishing: 28, sailorFishing: 28, withoutCrewFill: "2ي 22س", withoutCrewPlusLucky: "1ي 11س 28د", sailor: "1ي 11س 28د", sailorPlusLucky: "17س 44د", fishTypes: ["سمك الدايموند الأحمر", "سمك التاج الملكي"] },
  { level: 29, name: "المدمرة الملكية", storageCapacity: 85000, storageWithLucky: 170000, withoutCrewFishing: 29, sailorFishing: 29, withoutCrewFill: "3ي 4س 22د", withoutCrewPlusLucky: "1ي 14س 11د", sailor: "1ي 14س 11د", sailorPlusLucky: "19س 20د", fishTypes: ["سمكة البلور الملكية", "سمكة الشراع الجليدية"] },
  { level: 30, name: "طوفان البحر", storageCapacity: 90000, storageWithLucky: 180000, withoutCrewFishing: 29, sailorFishing: 29, withoutCrewFill: "3ي 7س 16د", withoutCrewPlusLucky: "1ي 15س 38د", sailor: "1ي 15س 38د", sailorPlusLucky: "19س 49د", fishTypes: ["تمساح البحر", "تنين الأرض"] },
  { level: 31, name: "سفينة ملوك المحيط", description: "مفخرة ملوك المحيط الخارقة والنهائية", storageCapacity: 100000, storageWithLucky: 200000, withoutCrewFishing: 30, sailorFishing: 30, withoutCrewFill: "3ي 8س", withoutCrewPlusLucky: "1ي 16س", sailor: "1ي 16س", sailorPlusLucky: "20س", fishTypes: ["الحوت القاتل", "الحوت الأسطوري", "الحوت الصيني"] }
];

export const getShipDataByLevel = (level: number): ShipData | undefined => {
  return shipsData.find((ship) => ship.level === level);
};

export const SHOP_SHIPS: ShopShipSpec[] = [
  { level: 0, name: 'قارب خشبي متهالك', subName: 'قارب خشبي متهالك للمبتدئين وبداية المغامرة', hook: 25, cargo: 2000, heart: 200, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['السردين'], price: 0, emoji: '🛶', image: "/ships/ship_00.webp" },
  { level: 1, name: 'قارب', subName: 'قارب صيد خشبي تقليدي', hook: 50, cargo: 2000, heart: 500, durationStr: '2س 50د', power: 10, armor: 10, fishTypes: ['هامور'], price: 400, emoji: '🛶', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_01.png" },
  { level: 2, name: 'الشوعي', subName: 'قارب شراعي خفيف سريع', hook: 100, cargo: 3000, heart: 1000, durationStr: '3س 50د', power: 20, armor: 20, fishTypes: ['شعري'], price: 1500, emoji: '⛵', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_02.png" },
  { level: 3, name: 'الربان', subName: 'مركب شراعي متين للبحار القريبة', hook: 200, cargo: 4000, heart: 2000, durationStr: '5س', power: 40, armor: 40, fishTypes: ['صافي', 'ناجل'], price: 4000, emoji: '⛵', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_03.png" },
  { level: 4, name: 'اليخت', subName: 'مركب شراعي عريض ومستقر', hook: 400, cargo: 5000, heart: 4000, durationStr: '5س 24د', power: 80, armor: 80, fishTypes: ['بياض', 'كنعد'], price: 9000, emoji: '⛵', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_04.png" },
  { level: 5, name: 'الشراعي', subName: 'سفينة تجارية بحجم مدمج للربح السريع', hook: 800, cargo: 6000, heart: 8000, durationStr: '7س', power: 160, armor: 160, fishTypes: ['بدح', 'حريد'], price: 18000, emoji: '🚢', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_05.png" },
  { level: 6, name: 'السندباد', subName: 'سفينة تجارية بسعة تخزين مضاعفة', hook: 1500, cargo: 7000, heart: 15000, durationStr: '7س 15د', power: 300, armor: 300, fishTypes: ['باراكودا', 'تونة'], price: 35000, emoji: '🚢', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_06.png" },
  { level: 7, name: 'المرجان', subName: 'حراقة سريعة ومسلحة بمدافع خفيفة', hook: 3000, cargo: 8000, heart: 30000, durationStr: '9س', power: 600, armor: 600, fishTypes: ['سلطان إبراهيم', 'سبيطي'], price: 60000, emoji: '⚔️', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_07.png" },
  { level: 8, name: 'ترولر الأعماق', subName: 'فرقاطة حديدية للهجوم والدفاع المتوازن', hook: 6000, cargo: 9000, heart: 60000, durationStr: '9س', power: 1200, armor: 1200, fishTypes: ['لقز', 'أبو سيف'], price: 100000, emoji: '⚔️', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_08.png" },
  { level: 9, name: 'واحة البحار', subName: 'سفينة التاج المزينة بأفخم الأخشاب', hook: 10000, cargo: 10000, heart: 100000, durationStr: '10س', power: 2000, armor: 2000, fishTypes: ['دولفين', 'ماكريل'], price: 160000, emoji: '👑', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_09.png" },
  { level: 10, name: 'المقدام', subName: 'سفينة قيادة الأساطيل البحرية الكبرى', hook: 20000, cargo: 12000, heart: 200000, durationStr: '9س 20د', power: 4000, armor: 4000, fishTypes: ['روبيان', 'سلطعون'], price: 250000, emoji: '⚓', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_10.png" },
  { level: 11, name: 'سفينة أسطورية', subName: 'سفينة خارقة يتردد صداها في البحار السبعة', hook: 40000, cargo: 14000, heart: 400000, durationStr: '11س 15د', power: 8000, armor: 8000, fishTypes: ['صافي', 'ناجل'], price: 380000, emoji: '🌌', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_11.png" },
  { level: 12, name: 'سفينة التنين', subName: 'مدمرة مصممة على شكل رأس تنين مهيب', hook: 80000, cargo: 16000, heart: 800000, durationStr: '10س 25د', power: 16000, armor: 16000, fishTypes: ['شعري', 'سلمون بحري'], price: 550000, emoji: '🐉', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship_12.png" },
  { level: 13, name: 'شاهين البحر', subName: 'سفينة الحرب والسطوة الإمبراطورية العظمى', hook: 160000, cargo: 18000, heart: 1600000, durationStr: '12س 30د', power: 32000, armor: 32000, fishTypes: ['سييطي عميق', 'أبو الشص'], price: 750000, emoji: '🔱', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/13_ship.png" },
  { level: 14, name: 'الحفارة', subName: 'جبل عائم من الفولاذ الحربي المدمر', hook: 320000, cargo: 20000, heart: 3200000, durationStr: '12س', power: 64000, armor: 64000, fishTypes: ['أخطبوط', 'قرش'], price: 1000000, emoji: '🏛️', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/14_ship.png" },
  { level: 15, name: 'سفينة الأبحاث', subName: 'حاكمة المحيطات العميقة والرياح العاتية', hook: 640000, cargo: 23000, heart: 6400000, durationStr: '12س 50د', power: 128000, armor: 128000, fishTypes: ['سمك موسى', 'الأفعى السمكية'], price: 1250000, emoji: '🌊', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-15.png" },
  { level: 16, name: 'باخرة', subName: 'درع الأساطير الحصين ضد كافة المخاطر', hook: 1280000, cargo: 26000, heart: 12800000, durationStr: '12س 15د', power: 256000, armor: 256000, fishTypes: ['سمك الترس', 'سمك سردين'], price: 1450000, emoji: '🛡️', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-16.png" },
  { level: 17, name: 'سفينة حربية', subName: 'جوهرة الأسطول المخصصة لملوك السلالات البحرية', hook: 2560000, cargo: 29000, heart: 25600000, durationStr: '13س 20د', power: 512000, armor: 512000, fishTypes: ['قنفذ البحر', 'دولفين'], price: 1650000, emoji: '👑', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/17_ship.png" },
  { level: 18, name: 'سفينة الصقر', subName: 'سفينة الصقر الأسطورية', hook: 5120000, cargo: 32000, heart: 51200000, durationStr: '12س 40د', power: 102400, armor: 102400, fishTypes: ['قد', 'فرس البحر'], price: 1800000, emoji: '🎖️', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/18_alfateh.png", rarity: 'ملحمي', description: 'سفينة الصقر المهيبة، تقود طلائع الحرب لفتح الممرات البحرية المغلقة وتأمين مسارات الصيد...' },
  { level: 19, name: 'سفينة الأفق الملكي', subName: 'سفينة الأفق الملكي التي لا تُقهر في معركة', hook: 10240000, cargo: 36000, heart: 102400000, durationStr: '13س 30د', power: 204800, armor: 204800, fishTypes: ['الفراشة الملكية', 'حبار الأعماق'], price: 2100000, emoji: '🏆', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/19_alnasr.png", rarity: 'ملحمي', description: 'سفينة الأفق الملكي، ترفع راية الفوز في كافة المعارك وتجلب غنائم طائلة للحاكم.' },
  { level: 20, name: 'سفينة الجحيم', subName: 'لهيب الجحيم المشتعل في أعالي البحار', hook: 20480000, cargo: 40000, heart: 204800000, durationStr: '12س 45د', power: 409600, armor: 409600, fishTypes: ['سمكة التنين', 'سمكة الشيطان الأسود'], price: 2500000, emoji: '✨', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/20_alhaymana.png", rarity: 'ملحمي', description: 'سفينة الجحيم المتوهجة بنيران الأعماق، ترهب وحوش المحيط السحيق وتملك متانة لا تضاهى لتخزين الذهب.' },
  { level: 21, name: 'سفينة درع المحيط', subName: 'سفينة درع المحيط المصفحة الأسطورية', hook: 40960000, cargo: 45000, heart: 409600000, durationStr: '1ي 1س', power: 819200, armor: 819200, fishTypes: ['سمكة الموج الذهبي', 'سمكة الدرع الأزرق'], price: 2900000, emoji: '🛡️', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/21_ali3sar.png", rarity: 'ملحمي', description: 'سفينة درع المحيط المهيبة، تحتمي بدرع السلاحف البحرية الصلب وتصطاد أندر الأسماك المدرعة.' },
  { level: 22, name: 'سفينة السلطعون', subName: 'سفينة السلطعون الحديدي الجبار', hook: 81920000, cargo: 50000, heart: 819200000, durationStr: '1ي 9س 20د', power: 1638400, armor: 1638400, fishTypes: ['سمكة الرمل الذهبي', 'سمكة المرجان'], price: 3400000, emoji: '🦀', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/22_althalam.png", rarity: 'ملحمي', description: 'سفينة السلطعون المدرعة بكماشات الفولاذ الأحمر، تكتسح الشعاب المرجانية العميقة...' },
  { level: 23, name: 'سفينة الأفعى البحرية', subName: 'حامية الأعماق وسفينة الأفعى البحرية السريعة', hook: 163840000, cargo: 55000, heart: 1638400000, durationStr: '1ي 18س 28د', power: 3276800, armor: 3276800, fishTypes: ['سمكة المانتا الملكية', 'سمكة الزرقاء'], price: 3800000, emoji: '🐍', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/23_almalakiya.png", rarity: 'ملحمي', description: 'سفينة الأفعى البحرية الانسيابية، تناور بين التيارات وتصطاد أسماك المانتا والزرقاء...' },
  { level: 24, name: 'سفينة شمس المحيط', subName: 'سفينة شمس المحيط المتألقة', hook: 327680000, cargo: 60000, heart: 3276800000, durationStr: '2ي 32د', power: 6553600, armor: 6553600, fishTypes: ['سمكة القمر البنفسجي', 'سمكة الزمرد الأزرق'], price: 4200000, emoji: '☀️', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/24_almuheet.png", rarity: 'أسطوري', description: 'سفينة شمس المحيط الأسطورية، تجوب المياه الزمردية وتصمد أمام أكبر الوحوش البحرية...' },
  { level: 25, name: 'سفينة الدلفين الأزرق', subName: 'سفينة الدلفين الأزرق السريعة الرشيقة', hook: 655360000, cargo: 65000, heart: 6553600000, durationStr: '2ي 7س 48د', power: 13107200, armor: 13107200, fishTypes: ['سمكة الأسد البحرية', 'سمكة السييلاكانت'], price: 4800000, emoji: '🐬', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-25.png", rarity: 'أسطوري', description: 'تنطلق برشاقة الدلفين الأزرق في أعالي البحار وتجلب أندر مخلوقات المحيط...' },
  { level: 26, name: 'سفينة الكراكن', subName: 'سفينة الكراكن حارسة الكنوز السحيقة', hook: 1310720000, cargo: 70000, heart: 13107200000, durationStr: '2ي 12س 18د', power: 26214400, armor: 26214400, fishTypes: ['الأطوم', 'سمكة زهرة القرن'], price: 5500000, emoji: '🐙', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-26.png", rarity: 'أسطوري', description: 'سفينة الكراكن المهيبة بأذرعها العملاقة، تحرس الكنوز العظيمة وتتمتع بسعة تخزين عملاقة...' },
  { level: 27, name: 'سفينة تنين البحر', subName: 'سفينة تنين البحر الزمردي المشتعل', hook: 2621440000, cargo: 75000, heart: 26214400000, durationStr: '2ي 19س 12د', power: 52428800, armor: 52428800, fishTypes: ['سمكة اللهيب الأحمر', 'سمكة الزعنفة الحديدية'], price: 6200000, emoji: '🐉', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-27.png", rarity: 'أسطوري', description: 'سفينة تنين البحر المصفحة بحراشف التنين، تمخر الأعاصير دون تردد...' },
  { level: 28, name: 'السفينة الإمبراطورية', subName: 'الحصن الإمبراطوري الملكي المصفح', hook: 5242880000, cargo: 80000, heart: 52428800000, durationStr: '2ي 22س', power: 104857600, armor: 104857600, fishTypes: ['سمك الدايموند الأحمر', 'سمك التاج الملكي'], price: 7000000, emoji: '👑', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-28.png", rarity: 'أسطوري', description: 'السفينة الإمبراطورية الفاخرة غير القابلة للاختراق، تحمي كنوز الإمبراطورية وتجمع الذهب بلا حدود...' },
  { level: 29, name: 'المدمرة الملكية', subName: 'المدمرة الملكية الحربية الفائقة', hook: 10485760000, cargo: 85000, heart: 104857600000, durationStr: '3ي 4س 22د', power: 209715200, armor: 209715200, fishTypes: ['سمكة البلور الملكية', 'سمكة الشراع الجليدية'], price: 8000000, emoji: '🔱', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-29.png", rarity: 'أسطوري', description: 'المدمرة الملكية المزودة بمدافع الطاقة الزرقاء، تكتسح مياه المحيط وتجذب أندر الأسماك البلورية والجليدية...' },
  { level: 30, name: 'طوفان البحر', subName: 'طوفان البحر الكاسح الحاكم لأعماق المحيط', hook: 20971520000, cargo: 90000, heart: 209715200000, durationStr: '3ي 7س 16د', power: 419430400, armor: 419430400, fishTypes: ['تمساح البحر', 'تنين الأرض'], price: 9500000, emoji: '🌊', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-30.png", rarity: 'أسطوري', description: 'يرتجف المحيط خوفاً من طوفان البحر الكاسح وقوته التدميرية المطلقة وسعته العملاقة للذهب...' },
  { level: 31, name: 'سفينة ملوك المحيط', subName: 'مفخرة ملوك المحيط الخارقة والنهائية', hook: 41943040000, cargo: 100000, heart: 419430400000, durationStr: '3ي 8س', power: 838860800, armor: 838860800, fishTypes: ['الحوت القاتل', 'الحوت الأسطوري', 'الحوت الصيني'], price: 12000000, emoji: '👑', image: "/ships/ship_31.webp", rarity: 'أسطورة', description: 'أعظم سفينة صُنعت في التاريخ، قوة دمار شامل وسعة ذهب أسطورية غير متناهية تمثل التتويج الأقصى لأي قبطان محترف للبحار السبعة الكبرى...' },
  { level: 32, name: 'غواصة الأعماق الأسطورية (المستوى الأساسي 0)', subName: 'الغواصة الحربية الخارقة حارسة الهاوية والأعماق السحيقة (المستوى الأساسي 0)', hook: 83886080000, cargo: 125000, heart: 838860800000, durationStr: '4h 15m', power: 1677721600, armor: 1677721600, fishTypes: ['الحوت القاتل', 'الحوت الأسطوري', 'الحوت الصيني'], price: 15000000, emoji: '🤿', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_6_saudi_classic.png", rarity: 'أسطورة', description: 'غواصة الأعماق السحيقة التكتيكية الفائقة (المستوى الأساسي 0)، قادرة على الهبوط لأعمق نقاط البحر الميت وجمع أغلى المرجانيات والكنوز الغارقة مع صيانة ذاتية مستمرة.' },
  { level: 33, name: 'غواصة الأعماق الأسطورية (المستوى 1)', subName: 'غواصة الأعماق الأسطورية المطورة بهالة الذهب الناري (المستوى 1)', hook: 167772160000, cargo: 155000, heart: 1677721600000, durationStr: '4h 30m', power: 3355443200, armor: 3355443200, fishTypes: ['الحوت القاتل', 'الحوت الأسطوري', 'الحوت الصيني'], price: 10000000, emoji: '🤿', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_1_gold_saudi%20(1).png", rarity: 'أسطورة', description: 'المستوى الأول المطور لغواصة الأعماق الأسطورية، مجهزة بهيكل معدني معزز وهالة ذهبية متوهجة وقوة صيد مضاعفة.' },
  { level: 34, name: 'غواصة الأعماق الأسطورية (المستوى 2)', subName: 'غواصة الأعماق الأسطورية المشعة بهالة الزمرد الأخضر (المستوى 2)', hook: 335544320000, cargo: 190000, heart: 3355443200000, durationStr: '4h 45m', power: 6710886400, armor: 6710886400, fishTypes: ['الحوت القاتل', 'الحوت الأسطوري', 'الحوت الصيني'], price: 15000000, emoji: '🤿', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_2_green_aura.png", rarity: 'أسطورة', description: 'المستوى الثاني الخارق، مشعة بهالة زمردية خضراء متوهجة ومصفحة كلياً بنواة طاقة خضراء وأنظمة صيد نووية متطورة لكشف أسرار قاع المحيط.' },
  { level: 35, name: 'غواصة الأعماق الأسطورية (المستوى 3)', subName: 'غواصة الأعماق الأسطورية المشعة بهالة البلازما الزرقاء (المستوى 3)', hook: 671088640000, cargo: 225000, heart: 6710886400000, durationStr: '5h 0m', power: 13421772800, armor: 13421772800, fishTypes: ['الحوت القاتل', 'الحوت الأسطوري', 'الحوت الصيني'], price: 20000000, emoji: '🤿', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_3_blue_aura.png", rarity: 'أسطورة', description: 'المستوى الثالث الخارق، مشعة بهالة بلازما زرقاء ساطعة ومدمجة بنواة طاقة المحيط الأزرق العميق وهيكل فولاذي خارق لتحدي أعتى أعماق الهاوية.' },
  { level: 36, name: 'غواصة الأعماق الأسطورية (المستوى 4)', subName: 'غواصة الأعماق الأسطورية المشعة بهالة الطاقة الوردية الخارقة (المستوى 4)', hook: 1342177280000, cargo: 260000, heart: 13421772800000, durationStr: '5h 15m', power: 26843545600, armor: 26843545600, fishTypes: ['الحوت القاتل', 'الحوت الأسطوري', 'الحوت الصيني'], price: 25000000, emoji: '🤿', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_4_pink_aura.png", rarity: 'أسطورة', description: 'المستوى الرابع الخارق، متوهجة بهالة وردية/ماجينتا نفاثة وتمتلك أنظمة دفع ذرية ورادارات سحيقة تكشف نوادر أعماق البحار وتمنح القبطان سيطرة تامة.' },
  { level: 37, name: 'غواصة الأعماق الأسطورية (المستوى Max ⭐)', subName: 'قمة التطور المطلق - تنين الأعماق الأحمر الأسطوري الخارق (المستوى Max ⭐)', hook: 2684354560000, cargo: 300000, heart: 26843545600000, durationStr: '5h 30m', power: 53687091200, armor: 53687091200, fishTypes: ['الحوت القاتل', 'الحوت الأسطوري', 'الحوت الصيني'], price: 30000000, emoji: '🤿', image: "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/submarine_5_red_dragon.png", rarity: 'أسطورة', description: 'المستوى الأقصى والنهائي المطلق (Max ⭐) لغواصة الأعماق، مدمجة بقوة تنين الأعماق الأحمر الناري وسعة ذهب أسطورية غير مسبوقة تمثل القمة العليا والسيادة المطلقة على كافة بحار العالم.' }
];

export interface FishHouseLevel {
  level: number;
  capacity: number;
  cost: number;
}

export const FISH_HOUSE_BASE_URL = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/FISH/refs/heads/main/level-";

export const getFishHouseImageUrl = (level: number) => {
  const currentLevel = Math.max(1, Math.min(Number(level) || 1, 35));
  const formattedLevelNum = String(currentLevel).padStart(2, '0');
  return `${FISH_HOUSE_BASE_URL}${formattedLevelNum}.png`;
};

export const FISH_HOUSE_LEVELS: FishHouseLevel[] = Array.from({ length: 31 }, (_, i) => {
  const lvl = i + 1;
  return {
    level: lvl,
    capacity: getFishHouseCapacity(lvl),
    cost: lvl * 500,
  };
});

export const GOLD_COIN_ICON = "/icons/res/gold-coin.webp";
export const GEM_ICON = "/icons/res/gem.webp";
export const PIRATE_SHOP_BG = "/backgrounds/pirate_shop_bg.webp";
export const WAREHOUSE_BG = "/backgrounds/warehouse_bg.webp";
export const SHIP_BACKGROUND_IMAGE = "/backgrounds/ship_bg.webp";
export const WEAPON_SMALL_MISSILE_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/weapon-missile-small.png";
export const WEAPON_SMALL_MISSILE_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/03_small_rocket_background_no_weapon.png";
export const WEAPON_MEDIUM_MISSILE_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/weapon-missile-medium.png";
export const WEAPON_MEDIUM_MISSILE_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/04_medium_rocket_background_no_weapon.png";
export const WEAPON_LARGE_MISSILE_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/weapon-missile-large.png";
export const WEAPON_LARGE_MISSILE_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/05_large_rocket_background_no_weapon.png";
export const WEAPON_MEDIA_BOMB_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/weapon-media-bomb.png";
export const WEAPON_MEDIA_BOMB_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/01_explosive_chest_background_no_weapon.png";
export const WEAPON_ATOMIC_BOMB_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/weapon-atomic-bomb.png";
export const WEAPON_ATOMIC_BOMB_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/02_sea_mine_background_no_weapon.png";

export const getShipMaxHeart = (
  ship: { maxHeart?: number; level?: number; heart?: number; cargo?: number; capacityLevel?: number } | null | undefined
): number => {
  if (!ship) return 2000;
  const lvl = typeof ship.level === 'number' && !isNaN(ship.level) ? ship.level : 0;
  const spec = SHOP_SHIPS.find((sp) => sp.level === lvl);
  const baseCargo = spec?.cargo || (typeof ship.cargo === 'number' && ship.cargo > 0 ? ship.cargo : getShipCapacity(lvl));
  const capLevel = typeof ship.capacityLevel === 'number' && ship.capacityLevel > 1 ? ship.capacityLevel : 1;
  return Math.max(1, Math.round(baseCargo * (1 + (capLevel - 1) * 0.15)));
};

export const normalizeShipEnergyToCargo = <T extends Record<string, any>>(
  ship: T,
  fallbackDestroyed?: boolean
): T => {
  if (!ship) return ship;
  const lvl = typeof ship.level === 'number' && !isNaN(ship.level) ? ship.level : 0;
  const spec = SHOP_SHIPS.find((sp) => sp.level === lvl);
  const baseCargo = spec?.cargo || (typeof ship.cargo === 'number' && ship.cargo > 0 ? ship.cargo : getShipCapacity(lvl));
  const newMax = getShipMaxHeart({ ...ship, level: lvl, cargo: baseCargo });

  if (ship.energySyncedToCargo && ship.maxHeart === newMax) {
    const clampedHeart =
      typeof ship.heart === 'number'
        ? Math.max(0, Math.min(newMax, Math.round(ship.heart)))
        : (fallbackDestroyed ? 0 : newMax);
    return {
      ...ship,
      cargo: baseCargo,
      maxHeart: newMax,
      heart: clampedHeart,
    };
  }

  const oldMax =
    typeof ship.maxHeart === 'number' && ship.maxHeart > 0
      ? ship.maxHeart
      : (spec?.heart && spec.heart > 0 ? spec.heart : newMax);

  let migratedHeart = fallbackDestroyed ? 0 : newMax;
  if (typeof ship.heart === 'number') {
    if (ship.heart <= 0) {
      migratedHeart = 0;
    } else {
      const ratio = Math.min(1, Math.max(0, ship.heart / oldMax));
      migratedHeart = Math.max(1, Math.min(newMax, Math.round(newMax * ratio)));
    }
  }

  return {
    ...ship,
    cargo: baseCargo,
    maxHeart: newMax,
    heart: migratedHeart,
    energySyncedToCargo: true,
  };
};

export const calculateWeaponShipDamage = (maxHeart: number, damagePercent: number): number => {
  const safeMax = Math.max(1, maxHeart);
  const pct = Math.max(0, Math.min(100, damagePercent));
  return Math.max(1, Math.round((safeMax * pct) / 100));
};

export interface WeaponItemData {
  id: string;
  key: string;
  name: string;
  damage: number;
  damagePercent: number;
  splashDamagePercent?: number;
  price: number;
  costType: 'gems' | 'gold';
  icon: string;
  image: string;
  bgImage?: string;
  desc: string;
}

export const WEAPONS_DATA: WeaponItemData[] = [
  {
    id: 'adBomb',
    key: 'adBomb',
    name: 'رسالة التفجير',
    damage: 20000,
    damagePercent: 35,
    price: 50,
    costType: 'gems',
    icon: '📡',
    image: WEAPON_MEDIA_BOMB_ICON,
    bgImage: WEAPON_MEDIA_BOMB_BG,
    desc: 'رسالة تفجيرية فتاكة تنقص 35% من طاقة كل سفن العدو مع بث رسالة وتثبيتها',
  },
  {
    id: 'atomicBomb',
    key: 'atomicBomb',
    name: 'قنبلة الموت الأسود',
    damage: 70000,
    damagePercent: 75,
    price: 150,
    costType: 'gems',
    icon: '💣',
    image: WEAPON_ATOMIC_BOMB_ICON,
    bgImage: WEAPON_ATOMIC_BOMB_BG,
    desc: 'قنبلة الموت الأسود الكاسحة تنقص 75% من طاقة جميع سفن الأسطول وتدمرها',
  },
  {
    id: 'smallRocket',
    key: 'smallRocket',
    name: 'صاروخ صغير',
    damage: 1000,
    damagePercent: 10,
    price: 100000,
    costType: 'gold',
    icon: '🚀',
    image: WEAPON_SMALL_MISSILE_ICON,
    bgImage: WEAPON_SMALL_MISSILE_BG,
    desc: 'صاروخ صغير وسريع لتوجيه ضربة مباشرة تنقص 10% من طاقة السفينة',
  },
  {
    id: 'mediumRocket',
    key: 'mediumRocket',
    name: 'صاروخ المتوسط',
    damage: 5000,
    damagePercent: 25,
    price: 200000,
    costType: 'gold',
    icon: '🚀',
    image: WEAPON_MEDIUM_MISSILE_ICON,
    bgImage: WEAPON_MEDIUM_MISSILE_BG,
    desc: 'صاروخ متوسط القوة يخترق الدروع وينقص 25% من طاقة السفينة',
  },
  {
    id: 'largeRocket',
    key: 'largeRocket',
    name: 'صاروخ كبير',
    damage: 100000,
    damagePercent: 50,
    price: 300000,
    costType: 'gold',
    icon: '🚀',
    image: WEAPON_LARGE_MISSILE_ICON,
    bgImage: WEAPON_LARGE_MISSILE_BG,
    desc: 'صاروخ كبير فتاك يوجه ضربة مدمرة تنقص 50% من طاقة السفينة المستهدفة',
  },
];
export const SHIP_GUARDIAN_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/ship-guardian-cutout.png";
export const SHIP_GUARDIAN_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/pirate-card-background-extracted.jpg.png";
export const FIXER_SMALL_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-small-mechanic.png";
export const FIXER_SMALL_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-small-mechanic.jpg.png";
export const FIXER_MEDIUM_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-mid-mechanic.png";
export const FIXER_MEDIUM_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-mid-mechanic.jpg.png";
export const FIXER_LARGE_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-big-mechanic.png";
export const FIXER_LARGE_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-big-mechanic.jpg.png";
export const FIXER_LEGENDARY_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-legendary-mechanic.png";
export const FIXER_LEGENDARY_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-legendary-mechanic.jpg.png";
export const SAILOR_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-sailor.png";
export const SAILOR_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-sailor.jpg.png";
export const GOLDEN_HUNTER_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-golden-hunter.png";
export const GOLDEN_HUNTER_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-golden-hunter.jpg%20(1).png";
export const MARKET_EXPERT_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-market-expert.png";
export const MARKET_EXPERT_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-market-expert.jpg.png";
export const LUCK_PIRATE_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-luck-pirate.png";
export const LUCK_PIRATE_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-luck-pirate.jpg%20(1).png";
export const SHIP_PILOT_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-ship-pilot.png";
export const SHIP_PILOT_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-ship-pilot.jpg.png";
export const SHIP_THIEF_ICON = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/person-ship-thief.png";
export const SHIP_THIEF_BG = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/bg-ship-thief.jpg.png";

export interface CrewMemberSpec {
  id: string;
  title: string;
  desc: string;
  price: number;
  costType: 'gold' | 'gems';
  icon: string;
  image?: string;
  bgImage?: string;
}

export const CREW_SHOP_ITEMS: CrewMemberSpec[] = [
  {
    id: 'thief',
    title: 'السارق (حرامي السفن)',
    desc: 'يمكّن سفنك من التسلل والسرقة من أساطيل الآخرين، إلا إذا كان الهدف يمتلك شرطياً لحمايته',
    price: 30,
    costType: 'gems',
    icon: '🥷',
    image: SHIP_THIEF_ICON,
    bgImage: SHIP_THIEF_BG,
  },
  {
    id: 'guide',
    title: 'مرشد السفينة',
    desc: 'يتوقع ويوجه السفينة لصيد نوع سمك محدد بدقة 100%، مع إمكانية تحديد نوع السمك المتوقع المطلوب من قائمة أسماك السفينة',
    price: 600000,
    costType: 'gold',
    icon: '🧭',
    image: SHIP_PILOT_ICON,
    bgImage: SHIP_PILOT_BG,
  },
  {
    id: 'luck',
    title: 'الحظ السعيد',
    desc: 'يضاعف صيد السفينة من الأسماك بنسبة 100% (مثال: صيد 2,000 يصبح 4,000 سمكة)',
    price: 60,
    costType: 'gems',
    icon: '🍀',
    image: LUCK_PIRATE_ICON,
    bgImage: LUCK_PIRATE_BG,
  },
  {
    id: 'cop',
    title: 'الشرطي (حامي السفن)',
    desc: 'يحمي سفنك وأسطولك بالكامل من سرقة أي شخص آخر ويحبط محاولات التسلل بنسبة 100%',
    price: 35,
    costType: 'gems',
    icon: '👮‍♂️',
    image: SHIP_GUARDIAN_ICON,
    bgImage: SHIP_GUARDIAN_BG,
  },
  {
    id: 'sailor',
    title: 'البحار',
    desc: 'يسرع صيد السفن ويقلص مدة رحلات الصيد بنسبة 50% (مثال: 50 دقيقة تصبح 25 دقيقة)',
    price: 550000,
    costType: 'gold',
    icon: '⚓',
    image: SAILOR_ICON,
    bgImage: SAILOR_BG,
  },
  {
    id: 'fixer_sm',
    title: 'مصلح صغير',
    desc: 'يصلح ويزيد 500 نقطة طاقة وهيكل للسفينة مباشرة من الصفر',
    price: 200000,
    costType: 'gold',
    icon: '🛠️',
    image: FIXER_SMALL_ICON,
    bgImage: FIXER_SMALL_BG,
  },
  {
    id: 'fixer_md',
    title: 'مصلح وسط',
    desc: 'يصلح نصف طاقة السفينة (50%)، أو يعطي 1,000 نقطة مباشرة إذا كانت طاقة السفينة 0',
    price: 700000,
    costType: 'gold',
    icon: '🔨',
    image: FIXER_MEDIUM_ICON,
    bgImage: FIXER_MEDIUM_BG,
  },
  {
    id: 'fixer_lg',
    title: 'مصلح كبير',
    desc: 'يصلح سفينة واحدة بالكامل 100% ويعيد كامل طاقتها وهيكلها مهما كان الضرر',
    price: 1200000,
    costType: 'gold',
    icon: '⚙️',
    image: FIXER_LARGE_ICON,
    bgImage: FIXER_LARGE_BG,
  },
  {
    id: 'fixer_epic',
    title: 'مصلح أسطوري',
    desc: 'يصلح ويرفع كامل طاقة وهيكل جميع سفن الأسطول دفعة واحدة 100% بنقرة واحدة',
    price: 200,
    costType: 'gems',
    icon: '👑',
    image: FIXER_LEGENDARY_ICON,
    bgImage: FIXER_LEGENDARY_BG,
  },
  {
    id: 'market_expert',
    title: 'خبير الأسواق',
    desc: 'يزيد أرباح بيع الأسماك والموارد في السوق بنسبة +25%',
    price: 900,
    costType: 'gems',
    icon: '📈',
    image: MARKET_EXPERT_ICON,
    bgImage: MARKET_EXPERT_BG,
  },
  {
    id: 'golden_hunter',
    title: 'الصياد الذهبي',
    desc: 'صيد وجمع تلقائي ذكي ومستمر للأسماك على مدار الساعة دون توقف!',
    price: 1000,
    costType: 'gems',
    icon: '🔱',
    image: GOLDEN_HUNTER_ICON,
    bgImage: GOLDEN_HUNTER_BG,
  },
];

export interface FishRewardItem {
  fullName: string;
  valPerFish: number;
  emoji: string;
  image?: string;
}

export const FISH_REWARD_DATA: Record<string, FishRewardItem> = {
  // المستوى 1
  'السردين': { fullName: 'السردين 🐟', valPerFish: 1, emoji: '🐟' },
  'سردين': { fullName: 'السردين 🐟', valPerFish: 1, emoji: '🐟' },
  'سمك السردين': { fullName: 'سمك السردين 🐟', valPerFish: 1, emoji: '🐟' },
  'سمك القمر': { fullName: 'سمك القمر 🐠', valPerFish: 15, emoji: '🐠' },
  'قرش البحر': { fullName: 'قرش البحر 🦈', valPerFish: 25, emoji: '🦈' },
  'سمك الهامور': { fullName: 'سمك الهامور 🐠', valPerFish: 7, emoji: '🐠' },
  'سمك أبو سيف': { fullName: 'سمك أبو سيف 🗡️', valPerFish: 20, emoji: '🗡️' },
  'الشفنين المائي': { fullName: 'الشفنين المائي 🐡', valPerFish: 22, emoji: '🐡' },
  'عناقة البرق': { fullName: 'عناقة البرق ⚡', valPerFish: 50, emoji: '⚡' },
  'عناقة النار': { fullName: 'عناقة النار 🔥', valPerFish: 65, emoji: '🔥' },
  'التنين الذهبي': { fullName: 'التنين الذهبي 🐉', valPerFish: 100, emoji: '🐉' },
  'التنين الجليدي': { fullName: 'التنين الجليدي ❄️', valPerFish: 120, emoji: '❄️' },

  // المستوى 2
  'الأنشوجة': { fullName: 'الأنشوجة 🐟', valPerFish: 2, emoji: '🐟' },
  'أنشوجة': { fullName: 'الأنشوجة 🐟', valPerFish: 2, emoji: '🐟' },

  // المستوى 3
  'الماكريل': { fullName: 'الماكريل 🐟', valPerFish: 3, emoji: '🐟', image: '/fish/mackerel.png' },
  'ماكريل': { fullName: 'الماكريل 🐟', valPerFish: 3, emoji: '🐟', image: '/fish/mackerel.png' },

  // المستوى 4
  'البلطي': { fullName: 'البلطي 🐟', valPerFish: 4, emoji: '🐟' },
  'بلطي': { fullName: 'البلطي 🐟', valPerFish: 4, emoji: '🐟' },

  // المستوى 5
  'الشعري': { fullName: 'الشعري 🐟', valPerFish: 5, emoji: '🐟', image: '/fish/shaeri.png' },
  'شعري': { fullName: 'الشعري 🐟', valPerFish: 5, emoji: '🐟', image: '/fish/shaeri.png' },

  // المستوى 6
  'الكنعد': { fullName: 'الكنعد 🐟', valPerFish: 6, emoji: '🐟', image: '/fish/kanaad.png' },
  'كنعد': { fullName: 'الكنعد 🐟', valPerFish: 6, emoji: '🐟', image: '/fish/kanaad.png' },

  // المستوى 7
  'الهامور': { fullName: 'الهامور 🐠', valPerFish: 7, emoji: '🐠', image: '/fish/hamour.png' },
  'هامور': { fullName: 'الهامور 🐠', valPerFish: 7, emoji: '🐠', image: '/fish/hamour.png' },

  // المستوى 8
  'السلمون': { fullName: 'السلمون 🐟', valPerFish: 8, emoji: '🐟' },
  'سلمون': { fullName: 'السلمون 🐟', valPerFish: 8, emoji: '🐟' },

  // المستوى 9
  'التونة': { fullName: 'التونة 🐟', valPerFish: 9, emoji: '🐟', image: '/fish/tuna.png' },
  'تونة': { fullName: 'التونة 🐟', valPerFish: 9, emoji: '🐟', image: '/fish/tuna.png' },

  // المستوى 10
  'أبو سيف': { fullName: 'أبو سيف ⚔️', valPerFish: 10, emoji: '⚔️', image: '/fish/swordfish.png' },

  // أسماك إضافية للمستويات 1-10
  'بدح': { fullName: 'البدح 🐟', valPerFish: 9, emoji: '🐟', image: '/fish/badah.png' },
  'البدح': { fullName: 'البدح 🐟', valPerFish: 9, emoji: '🐟', image: '/fish/badah.png' },
  'باراكودا': { fullName: 'باراكودا 🦈', valPerFish: 20, emoji: '🦈', image: '/fish/barracuda.png' },
  'الباراكودا': { fullName: 'باراكودا 🦈', valPerFish: 20, emoji: '🦈', image: '/fish/barracuda.png' },
  'سلطان إبراهيم': { fullName: 'سلطان إبراهيم 🐠', valPerFish: 13, emoji: '🐠', image: '/fish/sultan_ibrahim.png' },
  'سلطان ابراهيم': { fullName: 'سلطان إبراهيم 🐠', valPerFish: 13, emoji: '🐠', image: '/fish/sultan_ibrahim.png' },
  'السلطان إبراهيم': { fullName: 'سلطان إبراهيم 🐠', valPerFish: 13, emoji: '🐠', image: '/fish/sultan_ibrahim.png' },
  'سبيطي': { fullName: 'سبيطي 🐟', valPerFish: 14, emoji: '🐟', image: '/fish/subaity.png' },
  'السبيطي': { fullName: 'سبيطي 🐟', valPerFish: 14, emoji: '🐟', image: '/fish/subaity.png' },
  'لقز': { fullName: 'لقز 🐠', valPerFish: 15, emoji: '🐠', image: '/fish/laqaz.png' },
  'اللقز': { fullName: 'لقز 🐠', valPerFish: 15, emoji: '🐠', image: '/fish/laqaz.png' },
  'دولفين': { fullName: 'دولفين 🐬', valPerFish: 18, emoji: '🐬', image: '/fish/dolphin.png' },
  'الدولفين': { fullName: 'دولفين 🐬', valPerFish: 18, emoji: '🐬', image: '/fish/dolphin.png' },
  'روبيان': { fullName: 'روبيان 🦐', valPerFish: 19, emoji: '🦐', image: '/fish/shrimp.png' },
  'الروبيان': { fullName: 'روبيان 🦐', valPerFish: 19, emoji: '🦐', image: '/fish/shrimp.png' },
  'سلطعون': { fullName: 'سلطعون 🦀', valPerFish: 20, emoji: '🦀', image: '/fish/crab.png' },
  'السلطعون': { fullName: 'سلطعون 🦀', valPerFish: 20, emoji: '🦀', image: '/fish/crab.png' },

  // المستوى 11
  'الصافي': { fullName: 'الصافي 🐟', valPerFish: 12, emoji: '🐟', image: '/fish/safi.png' },
  'صافي': { fullName: 'الصافي 🐟', valPerFish: 12, emoji: '🐟', image: '/fish/safi.png' },
  'الناجل': { fullName: 'الناجل 🐠', valPerFish: 11, emoji: '🐠', image: '/fish/najal.png' },
  'ناجل': { fullName: 'الناجل 🐠', valPerFish: 11, emoji: '🐠', image: '/fish/najal.png' },
  'البوري': { fullName: 'البوري 🐟', valPerFish: 10, emoji: '🐟' },
  'بوري': { fullName: 'البوري 🐟', valPerFish: 10, emoji: '🐟' },
  'السيجان': { fullName: 'السيجان 🐠', valPerFish: 11, emoji: '🐠' },
  'سيجان': { fullName: 'السيجان 🐠', valPerFish: 11, emoji: '🐠' },

  // المستوى 12
  'سلمون بحري': { fullName: 'سلمون بحري 🐟', valPerFish: 14, emoji: '🐟', image: '/fish/sea_salmon.png' },
  'السلمون البحري': { fullName: 'سلمون بحري 🐟', valPerFish: 14, emoji: '🐟', image: '/fish/sea_salmon.png' },
  'الحريد': { fullName: 'الحريد 🐠', valPerFish: 12, emoji: '🐠', image: '/fish/hareed.png' },
  'حريد': { fullName: 'الحريد 🐠', valPerFish: 12, emoji: '🐠', image: '/fish/hareed.png' },

  // المستوى 13
  'سييطي عميق': { fullName: 'سييطي عميق 🐠', valPerFish: 15, emoji: '🐠', image: '/fish/deep_subaity.png' },
  'سبيطي عميق': { fullName: 'سييطي عميق 🐠', valPerFish: 15, emoji: '🐠', image: '/fish/deep_subaity.png' },
  'أبو الشص': { fullName: 'أبو الشص 🏮', valPerFish: 16, emoji: '🏮', image: '/fish/angler_abushas.png' },
  'القاروص': { fullName: 'القاروص 🐟', valPerFish: 13, emoji: '🐟' },
  'قاروص': { fullName: 'القاروص 🐟', valPerFish: 13, emoji: '🐟' },

  // المستوى 14
  'أخطبوط': { fullName: 'أخطبوط 🐙', valPerFish: 16, emoji: '🐙', image: '/fish/octopus.png' },
  'الأخطبوط': { fullName: 'أخطبوط 🐙', valPerFish: 16, emoji: '🐙', image: '/fish/octopus.png' },
  'قرش': { fullName: 'قرش 🦈', valPerFish: 18, emoji: '🦈', image: '/fish/shark.png' },
  'القرش': { fullName: 'قرش 🦈', valPerFish: 18, emoji: '🦈', image: '/fish/shark.png' },
  'الحمرا': { fullName: 'الحمرا 🐟', valPerFish: 13, emoji: '🐟' },
  'حمرا': { fullName: 'الحمرا 🐟', valPerFish: 13, emoji: '🐟' },
  'البياض': { fullName: 'البياض 🐟', valPerFish: 14, emoji: '🐟', image: '/fish/bayad.png' },
  'بياض': { fullName: 'البياض 🐟', valPerFish: 14, emoji: '🐟', image: '/fish/bayad.png' },

  // المستوى 15
  'سمك موسى': { fullName: 'سمك موسى 🐠', valPerFish: 17, emoji: '🐠', image: '/fish/moses_fish.png' },
  'الأفعى السمكية': { fullName: 'الأفعى السمكية 🐍', valPerFish: 19, emoji: '🐍', image: '/fish/sea_snake.png' },
  'أفعى سمكية': { fullName: 'الأفعى السمكية 🐍', valPerFish: 19, emoji: '🐍', image: '/fish/sea_snake.png' },
  'السيبيطي': { fullName: 'السيبيطي 🐟', valPerFish: 14, emoji: '🐟' },
  'سيبيطي': { fullName: 'السيبيطي 🐟', valPerFish: 14, emoji: '🐟' },
  'النهاش': { fullName: 'النهاش 🐟', valPerFish: 15, emoji: '🐟' },
  'نهاش': { fullName: 'النهاش 🐟', valPerFish: 15, emoji: '🐟' },

  // المستوى 16
  'سمك الترس': { fullName: 'سمك الترس 🐠', valPerFish: 18, emoji: '🐠', image: '/fish/trigger_turs.png' },
  'سمك سردين': { fullName: 'سمك سردين 🐟', valPerFish: 16, emoji: '🐟', image: '/fish/sardine_16.png' },
  'الشعم': { fullName: 'الشعم 🐟', valPerFish: 15, emoji: '🐟' },
  'شعم': { fullName: 'الشعم 🐟', valPerFish: 15, emoji: '🐟' },
  'القرفان': { fullName: 'القرفان 🐠', valPerFish: 16, emoji: '🐠' },
  'قرفان': { fullName: 'القرفان 🐠', valPerFish: 16, emoji: '🐠' },

  // المستوى 17
  'قنفذ البحر': { fullName: 'قنفذ البحر 🐡', valPerFish: 19, emoji: '🐡', image: '/fish/sea_urchin.png' },
  'الطرباني': { fullName: 'الطرباني 🐟', valPerFish: 16, emoji: '🐟' },
  'طرباني': { fullName: 'الطرباني 🐟', valPerFish: 16, emoji: '🐟' },
  'الكوفر': { fullName: 'الكوفر 🐟', valPerFish: 17, emoji: '🐟' },
  'كوفر': { fullName: 'الكوفر 🐟', valPerFish: 17, emoji: '🐟' },

  // المستوى 18
  'قد': { fullName: 'قد 🐟', valPerFish: 20, emoji: '🐟', image: '/fish/qad.png' },
  'القد': { fullName: 'قد 🐟', valPerFish: 20, emoji: '🐟', image: '/fish/qad.png' },
  'فرس البحر': { fullName: 'فرس البحر 🐠', valPerFish: 21, emoji: '🐠', image: '/fish/seahorse.png' },
  'العقام': { fullName: 'العقام 🐟', valPerFish: 17, emoji: '🐟' },
  'عقام': { fullName: 'العقام 🐟', valPerFish: 17, emoji: '🐟' },
  'الجش': { fullName: 'الجش 🐟', valPerFish: 18, emoji: '🐟' },
  'جش': { fullName: 'الجش 🐟', valPerFish: 18, emoji: '🐟' },

  // المستوى 19
  'الفراشة الملكية': { fullName: 'الفراشة الملكية 🐠', valPerFish: 22, emoji: '🐠', image: '/fish/royal_butterfly.png' },
  'فراشة ملكية': { fullName: 'الفراشة الملكية 🐠', valPerFish: 22, emoji: '🐠', image: '/fish/royal_butterfly.png' },
  'حبار الأعماق': { fullName: 'حبار الأعماق 🦑', valPerFish: 23, emoji: '🦑', image: '/fish/deep_squid.png' },
  'الدراك': { fullName: 'الدراك 🐟', valPerFish: 18, emoji: '🐟' },
  'دراك': { fullName: 'الدراك 🐟', valPerFish: 18, emoji: '🐟' },
  'الزبيدي': { fullName: 'الزبيدي 🐠', valPerFish: 19, emoji: '🐠' },
  'زبيدي': { fullName: 'الزبيدي 🐠', valPerFish: 19, emoji: '🐠' },

  // المستوى 20
  'سمكة التنين': { fullName: 'سمكة التنين 🐉', valPerFish: 24, emoji: '🐉', image: '/fish/dragon_fish.png' },
  'سمكة الشيطان الأسود': { fullName: 'سمكة الشيطان الأسود 🐡', valPerFish: 25, emoji: '🐡', image: '/fish/black_devil_fish.png' },
  'الناجل الأحمر': { fullName: 'الناجل الأحمر 🐠', valPerFish: 19, emoji: '🐠' },
  'التونة الزرقاء': { fullName: 'التونة الزرقاء 🐟', valPerFish: 20, emoji: '🐟' },

  // المستوى 21
  'سمكة الموج الذهبي': { fullName: 'سمكة الموج الذهبي 🐠', valPerFish: 20, emoji: '🐠', image: '/fish/golden_wave_fish.png' },
  'سمكة الدرع الأزرق': { fullName: 'سمكة الدرع الأزرق 🐟', valPerFish: 21, emoji: '🐟', image: '/fish/blue_shield_fish.png' },
  'ماهي ماهي': { fullName: 'ماهي ماهي 🐠', valPerFish: 19, emoji: '🐠' },
  'البراكودا': { fullName: 'البراكودا 🦈', valPerFish: 20, emoji: '🦈' },
  'براكودا': { fullName: 'البراكودا 🦈', valPerFish: 20, emoji: '🦈' },
  'الوقار': { fullName: 'الوقار 🐟', valPerFish: 21, emoji: '🐟' },
  'وقار': { fullName: 'الوقار 🐟', valPerFish: 21, emoji: '🐟' },

  // المستوى 22
  'سمكة الرمل الذهبي': { fullName: 'سمكة الرمل الذهبي 🐟', valPerFish: 21, emoji: '🐟', image: '/fish/golden_sand_fish.png' },
  'سمكة المرجان': { fullName: 'سمكة المرجان 🐠', valPerFish: 22, emoji: '🐠', image: '/fish/coral_fish.png' },
  'الهلبوت': { fullName: 'الهلبوت 🐠', valPerFish: 20, emoji: '🐠' },
  'هلبوت': { fullName: 'الهلبوت 🐠', valPerFish: 20, emoji: '🐠' },
  'التونة الصفراء': { fullName: 'التونة الصفراء 🐟', valPerFish: 21, emoji: '🐟' },
  'المارلن الأبيض': { fullName: 'المارلن الأبيض 🦈', valPerFish: 22, emoji: '🦈' },

  // المستوى 23
  'سمكة المانتا الملكية': { fullName: 'سمكة المانتا الملكية 🐠', valPerFish: 22, emoji: '🐠', image: '/fish/royal_manta.png' },
  'سمكة الزرقاء': { fullName: 'سمكة الزرقاء 🐟', valPerFish: 23, emoji: '🐟', image: '/fish/blue_zarkaa_fish.png' },
  'الشفنين': { fullName: 'الشفنين 🐡', valPerFish: 21, emoji: '🐡' },
  'شفنين': { fullName: 'الشفنين 🐡', valPerFish: 21, emoji: '🐡' },
  'المارلن الأسود': { fullName: 'المارلن الأسود 🦈', valPerFish: 22, emoji: '🦈' },
  'المارلن الأزرق': { fullName: 'المارلن الأزرق 🦈', valPerFish: 23, emoji: '🦈' },

  // المستوى 24
  'سمكة القمر البنفسجي': { fullName: 'سمكة القمر البنفسجي 🐠', valPerFish: 23, emoji: '🐠', image: '/fish/purple_moon_fish.png' },
  'سمكة الزمرد الأزرق': { fullName: 'سمكة الزمرد الأزرق 🐟', valPerFish: 24, emoji: '🐟', image: '/fish/blue_emerald_fish.png' },
  'سمكة نابليون': { fullName: 'سمكة نابليون 🐠', valPerFish: 22, emoji: '🐠' },
  'التونة كبيرة العين': { fullName: 'التونة كبيرة العين 🐟', valPerFish: 23, emoji: '🐟' },
  'سمكة الشراع': { fullName: 'سمكة الشراع ⛵', valPerFish: 24, emoji: '⛵' },

  // المستوى 25
  'سمكة الأسد البحرية': { fullName: 'سمكة الأسد البحرية 🐠', valPerFish: 24, emoji: '🐠', image: '/fish/lionfish.png' },
  'سمكة السييلاكانت': { fullName: 'سمكة السييلاكانت 🐟', valPerFish: 25, emoji: '🐟', image: '/fish/coelacanth.png' },
  'قرش الشعاب': { fullName: 'قرش الشعاب 🦈', valPerFish: 23, emoji: '🦈' },
  'قرش الليمون': { fullName: 'قرش الليمون 🦈', valPerFish: 24, emoji: '🦈' },
  'قرش المطرقة': { fullName: 'قرش المطرقة 🦈', valPerFish: 25, emoji: '🦈' },

  // المستوى 26
  'الأطوم': { fullName: 'الأطوم 🐋', valPerFish: 25, emoji: '🐋', image: '/fish/dugong.png' },
  'أطوم': { fullName: 'الأطوم 🐋', valPerFish: 25, emoji: '🐋', image: '/fish/dugong.png' },
  'سمكة زهرة القرن': { fullName: 'سمكة زهرة القرن 🐠', valPerFish: 26, emoji: '🐠', image: '/fish/flowerhorn.png' },
  'القرش الأزرق': { fullName: 'القرش الأزرق 🦈', valPerFish: 24, emoji: '🦈' },
  'قرش الثور': { fullName: 'قرش الثور 🦈', valPerFish: 25, emoji: '🦈' },
  'قرش النمر': { fullName: 'قرش النمر 🦈', valPerFish: 26, emoji: '🦈' },

  // المستوى 27
  'سمكة اللهيب الأحمر': { fullName: 'سمكة اللهيب الأحمر 🐠', valPerFish: 26, emoji: '🐠', image: '/fish/red_flame_fish.png' },
  'سمكة الزعنفة الحديدية': { fullName: 'سمكة الزعنفة الحديدية 🐟', valPerFish: 27, emoji: '🐟', image: '/fish/iron_fin_fish.png' },
  'قرش ماكو': { fullName: 'قرش ماكو 🦈', valPerFish: 25, emoji: '🦈' },
  'القرش المحيطي': { fullName: 'القرش المحيطي 🦈', valPerFish: 26, emoji: '🦈' },
  'القرش الأبيض': { fullName: 'القرش الأبيض 🦈', valPerFish: 27, emoji: '🦈' },

  // المستوى 28
  'سمك الدايموند الأحمر': { fullName: 'سمك الدايموند الأحمر 🐠', valPerFish: 27, emoji: '🐠', image: '/fish/red_diamond_fish.png' },
  'سمكة الدايموند الأحمر': { fullName: 'سمك الدايموند الأحمر 🐠', valPerFish: 27, emoji: '🐠', image: '/fish/red_diamond_fish.png' },
  'سمك التاج الملكي': { fullName: 'سمك التاج الملكي 🐟', valPerFish: 28, emoji: '🐟', image: '/fish/royal_crown_fish.png' },
  'سمكة التاج الملكي': { fullName: 'سمك التاج الملكي 🐟', valPerFish: 28, emoji: '🐟', image: '/fish/royal_crown_fish.png' },
  'شيطان البحر': { fullName: 'شيطان البحر 🐡', valPerFish: 26, emoji: '🐡' },
  'سمكة الشمس': { fullName: 'سمكة الشمس ☀️', valPerFish: 27, emoji: '☀️' },
  'قرش الحوت': { fullName: 'قرش الحوت 🐋', valPerFish: 28, emoji: '🐋' },

  // المستوى 29
  'سمكة البلور الملكية': { fullName: 'سمكة البلور الملكية 🐠', valPerFish: 28, emoji: '🐠', image: '/fish/royal_crystal_fish.png' },
  'سمكة الشراع الجليدية': { fullName: 'سمكة الشراع الجليدية 🐟', valPerFish: 29, emoji: '🐟', image: '/fish/ice_sail_fish.png' },
  'الحوت الأبيض': { fullName: 'الحوت الأبيض 🐋', valPerFish: 27, emoji: '🐋' },
  'الحوت الأحدب': { fullName: 'الحوت الأحدب 🐋', valPerFish: 28, emoji: '🐋' },
  'حوت العنبر': { fullName: 'حوت العنبر 🐋', valPerFish: 29, emoji: '🐋' },

  // المستوى 30
  'تمساح البحر': { fullName: 'تمساح البحر 🐊', valPerFish: 29, emoji: '🐊', image: '/fish/sea_crocodile.png' },
  'تنين الأرض': { fullName: 'تنين الأرض 🦎', valPerFish: 30, emoji: '🦎', image: '/fish/land_dragon.png' },
  'الحوت الرمادي': { fullName: 'الحوت الرمادي 🐋', valPerFish: 28, emoji: '🐋' },
  'الحوت مقوس الرأس': { fullName: 'الحوت مقوس الرأس 🐋', valPerFish: 29, emoji: '🐋' },
  'الحوت الأزرق': { fullName: 'الحوت الأزرق 🐋', valPerFish: 30, emoji: '🐋' },

  // المستوى 31
  'الحوت القاتل': { fullName: 'الحوت القاتل 🐬', valPerFish: 29, emoji: '🐬' },
  'الحوت الأسطوري': { fullName: 'الحوت الأسطوري 🌌', valPerFish: 30, emoji: '🌌' },
  'الحوت الصيني': { fullName: 'الحوت الصيني 🐉', valPerFish: 31, emoji: '🐉' },
};

export const getFishImageUrl = (fishName?: string, shipLevel?: number): string | undefined => {
  if (!fishName) return undefined;
  const trimmed = fishName.trim();
  const stripped = trimmed
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .trim();
  const noAl = stripped.replace(/^ال/, '').trim();

  // Level-specific fish artwork overrides for ships 1-10 vs 11-20 sharing the same Arabic name
  if (shipLevel !== undefined && shipLevel >= 1 && shipLevel <= 10) {
    if (noAl === 'شعري') return '/fish/shaeri_2.png';
    if (noAl === 'صافي') return '/fish/safi_3.png';
    if (noAl === 'ناجل') return '/fish/najal_3.png';
    if (noAl === 'دولفين') return '/fish/dolphinfish_9.png';
  }

  if (FISH_REWARD_DATA[trimmed]?.image) return FISH_REWARD_DATA[trimmed].image;
  if (FISH_REWARD_DATA[stripped]?.image) return FISH_REWARD_DATA[stripped].image;
  if (FISH_REWARD_DATA[noAl]?.image) return FISH_REWARD_DATA[noAl].image;

  const withAl = `ال${noAl}`;
  if (FISH_REWARD_DATA[withAl]?.image) return FISH_REWARD_DATA[withAl].image;

  return undefined;
};


