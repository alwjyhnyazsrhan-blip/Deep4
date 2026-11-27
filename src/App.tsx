import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { ShipState, ChatMessage, Tribe, CrewMember, Quest, BattleReport, GlobalNotification, NotificationEventType, TribeJoinRequest, TribeInvitation } from './types';
import { SHOP_SHIPS, FISH_REWARD_DATA, getHarborImageUrl, FISH_HOUSE_LEVELS, getFishHouseImageUrl, getFishHouseCapacity, getShipCapacity, getSubmarineDisplayTier, getSubmarineTag, getSubmarineUpgradeRule, getSubmarineFishInfo, rollSubmarineFishCatch, getFishImageUrl, getShipMaxHeart, normalizeShipEnergyToCargo, calculateWeaponShipDamage, GOLD_COIN_ICON, GEM_ICON, WAREHOUSE_BG, WEAPON_SMALL_MISSILE_ICON, WEAPON_SMALL_MISSILE_BG, WEAPON_MEDIUM_MISSILE_ICON, WEAPON_MEDIUM_MISSILE_BG, WEAPON_LARGE_MISSILE_ICON, WEAPON_LARGE_MISSILE_BG, WEAPON_MEDIA_BOMB_ICON, WEAPON_MEDIA_BOMB_BG, WEAPON_ATOMIC_BOMB_ICON, WEAPON_ATOMIC_BOMB_BG, SHIP_GUARDIAN_ICON, SHIP_GUARDIAN_BG, FIXER_SMALL_ICON, FIXER_SMALL_BG, FIXER_MEDIUM_ICON, FIXER_MEDIUM_BG, FIXER_LARGE_ICON, FIXER_LARGE_BG, FIXER_LEGENDARY_ICON, FIXER_LEGENDARY_BG, SAILOR_ICON, SAILOR_BG, GOLDEN_HUNTER_ICON, GOLDEN_HUNTER_BG, MARKET_EXPERT_ICON, MARKET_EXPERT_BG, LUCK_PIRATE_ICON, LUCK_PIRATE_BG, SHIP_PILOT_ICON, SHIP_PILOT_BG, SHIP_THIEF_ICON, SHIP_THIEF_BG, CREW_SHOP_ITEMS, WEAPONS_DATA } from './data';
import FishHouseComponent from './components/FishHouseComponent';
import GoogleAccountSelector from './components/GoogleAccountSelector';
import LandingScreen from './components/LandingScreen';
import SigninScreen from './components/SigninScreen';
import RegisterScreen from './components/RegisterScreen';
import ShipWarehouse from './components/ShipWarehouse';
import PirateShop from './components/PirateShop';
import InventoryComponent from './components/InventoryComponent';
import CrewTavernModal from './components/CrewTavernModal';
import ParticlesEffect from './components/ParticlesEffect';
import { InGameNotificationBanner } from './components/InGameNotificationBanner';
import { playNotificationSound } from './utils/notificationSound';
import { LargeRocketExplosion } from './components/LargeRocketExplosion';
import { MediumRocketExplosion } from './components/MediumRocketExplosion';
import { SmallRocketExplosion } from './components/SmallRocketExplosion';
import { FlyingNavalMissile, AdBombStrike } from './components/NavalRocketEffects';
import { AtomicBombExplosion } from './components/AtomicBombExplosion';
import { 
  playLargeRocketIncomingSound, 
  playLargeRocketExplosionSound,
  playMediumRocketIncomingSound,
  playMediumRocketExplosionSound,
  playSmallRocketIncomingSound,
  playSmallRocketExplosionSound,
  playAtomicBombDropSound,
  playAtomicBombExplosionSound,
  playMediaBombExplosionSound,
  getAudioContext
} from './utils/explosionSound';
import { playDetonationWarningVoiceAndSound } from './utils/warningDetonationSound';
import {
  getShipFishingDurationMs,
  getShipFishingTimerState,
  formatFishingCountdown,
  getSpeedUpGemCost,
} from './utils/fishingTimer';

import ShipImage from './components/ShipImage';
import ShipCrewMember, { CREW_VISUAL_MAP, sanitizeShipCrew } from './components/ShipCrewMember';
import { SettingsView } from './components/SettingsView';
import { LeaderboardView } from './components/LeaderboardView';
import { ChatView } from './components/ChatView';
import TribeView from './components/TribeView';
import WarLogModal, { AttackLogItem, SupportGiftItem } from './components/WarLogModal';
import { ShipWorkshopModal } from './components/ShipWorkshopModal';
import { SubmarineUpgradeModal } from './components/SubmarineUpgradeModal';
import { ShipStatusBars } from './components/ShipStatusBars';
import TopBarHud from './components/TopBarHud';
import ProfileAvatarModal, { isImageAvatarValue } from './components/ProfileAvatarModal';
// @ts-ignore
import destroyedPortImg from './assets/images/destroyed_port_1784900250438.jpg';

import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { executeFinancialTransaction, isNetworkOnline, notifyOfflineBlocked } from './services/financialTransaction';
import { 
  getLocalSessionId, 
  setLocalSessionId, 
  clearLocalSessionId, 
  registerNewUserSession, 
  verifyActiveSession,
  getClientDeviceInfo,
  getOrCreateDeviceId,
  recoverSessionFromDevice
} from './services/sessionManager';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocFromCache,
  getDocs,
  setDoc, 
  updateDoc,
  deleteDoc,
  collection, 
  addDoc, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  limit,
  serverTimestamp,
  enableNetwork
} from 'firebase/firestore';

function normalizeString(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().trim()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\s+/g, '');
}

const LEGACY_SHIP_LEVEL_BY_NAME: Record<string, number> = {
  'قارب الصياد': 1,
  'قارب شراعي صغير': 2,
  'مركب شراعي': 3,
  'مركب شراعي متوسط': 4,
  'سفينة تجارية صغيرة': 5,
  'سفينة تجارية متوسطة': 6,
  'سفينة حربية خفيفة': 7,
  'سفينة حربية متوسطة': 8,
  'سفينة ملكية': 9,
  'سفينة أسطول': 10,
  'سفينة الإمبراطور': 13,
  'سفينة التيتان': 14,
  'سفينة المحيط العظيم': 15,
  'سفينة الأساطير': 16,
  'سفينة الملوك': 17,
  'سفينة الفاتح': 18,
  'سفينه الصقر': 18,
  'سفينة النصر': 19,
  'سفينة المجد': 20,
  'سفينة الأرواح': 21,
  'سفينة الظلام': 22,
  'سفينة البحرية الملكية': 23,
  'سفينة المحيط الأزرق': 24,
  'سفينة الرعد': 25,
  'سفينة التنين الذهبي': 26,
  'سفينة الإعصار': 27,
  'سفينة القيصر': 28,
  'سفينة أساطير البحر': 29,
  'سفينة سيد البحار': 30,
};

const syncShipMetadata = (s: any) => {
  if (!s) return s;
  const rawLvl = typeof s.level === 'number' && !isNaN(s.level)
    ? s.level
    : (LEGACY_SHIP_LEVEL_BY_NAME[s.name] ?? SHOP_SHIPS.find(spec => spec.name === s.name)?.level ?? 0);
  const lvl = rawLvl === 31 ? 30 : rawLvl;
  if (lvl >= 1 && lvl <= 30) {
    const spec = SHOP_SHIPS.find(sp => sp.level === lvl);
    if (spec) {
      const updatedExpected = s.expectedFish && spec.fishTypes.includes(s.expectedFish)
        ? s.expectedFish
        : spec.fishTypes[spec.fishTypes.length - 1];
      return normalizeShipEnergyToCargo({
        ...s,
        level: lvl,
        name: spec.name,
        durationStr: spec.durationStr,
        fishTypes: spec.fishTypes,
        ...(s.expectedFish ? { expectedFish: updatedExpected } : {}),
      });
    }
  } else if (lvl >= 32 && lvl <= 37) {
    const spec = SHOP_SHIPS.find(sp => sp.level === lvl);
    if (spec) {
      const updatedExpected = s.expectedFish && spec.fishTypes.includes(s.expectedFish)
        ? s.expectedFish
        : spec.fishTypes[spec.fishTypes.length - 1];
      return normalizeShipEnergyToCargo({
        ...s,
        level: lvl,
        name: spec.name,
        durationStr: spec.durationStr,
        fishTypes: spec.fishTypes,
        ...(s.expectedFish ? { expectedFish: updatedExpected } : {}),
      });
    }
  }
  return normalizeShipEnergyToCargo({ ...s, level: lvl });
};

const getFishEmoji = (fullName: string): string => {
  if (!fullName) return '🐟';
  const emojis = ['🐠', '🦐', '🦀', '🦑', '🐙', '🦞', '🐍', '⚔️', '🦈', '⛵', '🐋', '🐬', '🐉', '🏮', '🐡', '🐟'];
  for (const emoji of emojis) {
    if (fullName.includes(emoji)) {
      return emoji;
    }
  }
  const cleanName = fullName
    .replace(/\([^)]*\)/g, '')
    .replace(/⭐+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (FISH_REWARD_DATA[cleanName]?.emoji) {
    return FISH_REWARD_DATA[cleanName].emoji;
  }
  const noPrefix = cleanName.replace(/^ال/, '').trim();
  if (FISH_REWARD_DATA[noPrefix]?.emoji) {
    return FISH_REWARD_DATA[noPrefix].emoji;
  }
  return '🐟';
};

function GoogleLoginTunnelHelper() {
  const [status, setStatus] = useState<'initiating' | 'loading' | 'success' | 'error'>('initiating');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    const runTunnel = async () => {
      setStatus('loading');
      try {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        if (user && user.email) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const googleIdToken = credential?.idToken;
          
          if (!googleIdToken) {
            throw new Error('لم يتم استرجاع رمز Google (idToken). يرجى التأكد من تسجيل الدخول بشكل صحيح.');
          }

          const parentOrigin = new URLSearchParams(window.location.search).get('parent_origin') || '*';
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_TUNNEL_SUCCESS',
              idToken: googleIdToken,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL
            }, parentOrigin);
          }
          
          setStatus('success');
          setTimeout(() => {
            window.close();
          }, 1200);
        } else {
          throw new Error('لم يتم استرجاع معلومات المستخدم.');
        }
      } catch (err: any) {
        console.error('Tunnel OAuth Error:', err);
        const parentOrigin = new URLSearchParams(window.location.search).get('parent_origin') || '*';
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_TUNNEL_ERROR',
            error: err.message || String(err)
          }, parentOrigin);
        }
        setStatus('error');
        setErrMsg(err.message || 'خطأ غير معروف');
      }
    };
    
    runTunnel();
  }, []);

  return (
    <div className="min-h-screen bg-[#04060b] text-white flex flex-col items-center justify-center p-6 text-center font-['Cairo',_sans-serif]">
      <div className="bg-[#0b101d] border border-amber-600/30 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(217,119,6,0.25)] flex flex-col items-center">
        <span className="text-4xl mb-4">⚓</span>
        {status === 'loading' && (
          <>
            <h3 className="text-lg font-bold text-amber-500 mb-2">جاري الاتصال بـ Google...</h3>
            <p className="text-xs text-gray-400">يرجى تسجيل الدخول من النافذة المنبثقة لإكمال الإبحار.</p>
            <div className="mt-4 w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </>
        )}
        {status === 'success' && (
          <>
            <h3 className="text-lg font-bold text-green-500 mb-2">تم تسجيل الدخول بنجاح!</h3>
            <p className="text-xs text-gray-400">جاري نقل البيانات الآمنة إلى سفينتك...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h3 className="text-lg font-bold text-red-500 mb-2">فشل تسجيل الدخول</h3>
            <p className="text-xs text-red-400 font-mono mb-4 break-all">{errMsg}</p>
            <button 
              onClick={() => window.close()} 
              className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded-lg font-bold cursor-pointer"
            >
              إغلاق النافذة
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  // --- Google Login Tunnel Interceptor ---
  const [isTunnel] = useState<boolean>(() => {
    return new URLSearchParams(window.location.search).get('google_login_tunnel') === 'true';
  });

  // --- Authentication State ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('pirate_is_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<any>(() => auth.currentUser);

  if (isTunnel) {
    return <GoogleLoginTunnelHelper />;
  }

  const [authScreen, setAuthScreen] = useState<'landing' | 'login' | 'register'>('landing');

  const [loadingFirebase, setLoadingFirebase] = useState<boolean>(true);
  const isLoadedFromFirebase = useRef(false);
  const isDeletingAccount = useRef(false);
  const unsubUserSnapshot = useRef<(() => void) | null>(null);
  const lastDbData = useRef<any>(null);
  const justLoadedFromFirestore = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Multi-Device / Concurrent Session Management ---
  const [sessionTerminationNotice, setSessionTerminationNotice] = useState<{
    newDevice: string;
    lastLoginAt?: string;
  } | null>(null);
  const [isRecoveringSession, setIsRecoveringSession] = useState(false);
  const isSessionTerminated = useRef(false);

  const handleTerminateOldSession = async (info: { newDevice: string; lastLoginAt?: string }) => {
    if (isSessionTerminated.current) return;
    isSessionTerminated.current = true;

    console.warn('[SESSION MANAGER] Session superseded by another device/browser:', info);

    // Cancel pending auto-save timeout so old state is never flushed to Firestore
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Unsubscribe from real-time listener temporarily while terminated
    if (unsubUserSnapshot.current) {
      try {
        unsubUserSnapshot.current();
      } catch (e) {}
      unsubUserSnapshot.current = null;
    }

    // Clear local active session credentials and mark status expired
    clearLocalSessionId();
    localStorage.setItem('pirate_is_logged_in', 'false');

    // Show persistent warning notice to user and disable actions
    setSessionTerminationNotice(info);
    setIsLoggedIn(false);
  };

  const activeAuthUidRef = useRef<string | null>(null);
  const handleRecoverSessionRef = useRef<(() => Promise<void>) | null>(null);
  const loadAndSubscribeUserDocRef = useRef<((user: any, opts?: { forceTakeoverSession?: boolean }) => Promise<void>) | null>(null);
  const handleRecoverSessionFromThisDevice = async () => {
    if (handleRecoverSessionRef.current) {
      await handleRecoverSessionRef.current();
    }
  };
  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const [isPageHidden, setIsPageHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // --- Leaping Sea Creatures State ---
  const [creatures, setCreatures] = useState(() => [
    { id: 1, type: 'humpback', left: 42, top: 43, zIndex: 1, alt: 'Humpback Whale', src: 'https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/whale-humpback.png' },
    { id: 2, type: 'humpback', left: 78, top: 58, zIndex: 4, alt: 'Humpback Whale', src: 'https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/whale-humpback.png' },
    { id: 3, type: 'humpback', left: 56, top: 64, zIndex: 1, alt: 'Humpback Whale', src: 'https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/whale-humpback.png' },
    { id: 4, type: 'humpback', left: 38, top: 40, zIndex: 1, alt: 'Humpback Whale', src: 'https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/whale-humpback.png' },
    { id: 5, type: 'humpback', left: 74, top: 55, zIndex: 4, alt: 'Humpback Whale', src: 'https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/whale-humpback.png' },
    { id: 6, type: 'humpback', left: 52, top: 61, zIndex: 1, alt: 'Humpback Whale', src: 'https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/whale-humpback.png' },
  ]);

  const handleCreatureIteration = (id: number) => {
    // Only handle leaders (1, 2, 3) to keep pairs synchronized at new coordinates
    if (id !== 1 && id !== 2 && id !== 3) return;

    // Choose one of 4 zones randomly to distribute creatures widely:
    // Zone 0: Behind/around the docked ships (left/background)
    // Zone 1: In front of/next to the docked ships (middle area)
    // Zone 2: Between the ships vertically (vertical gaps)
    // Zone 3: Deep sea / fishing spots area (right side)
    const zone = Math.floor(Math.random() * 4);
    let randomLeft = 70;
    let randomTop = 50;
    let randomZIndex = 4;

    if (zone === 0) {
      // Behind/next to docked ships (Dock is left: 45%)
      randomLeft = Math.floor(Math.random() * 12) + 32; // 32% to 44%
      randomTop = Math.floor(Math.random() * 35) + 35;  // 35% to 70%
      randomZIndex = 1; // Always behind ships (ships are z-index: 2)
    } else if (zone === 1) {
      // In front of/beside the docked ships (Middle area)
      randomLeft = Math.floor(Math.random() * 18) + 46; // 46% to 64%
      randomTop = Math.floor(Math.random() * 35) + 35;  // 35% to 70%
      randomZIndex = Math.random() > 0.4 ? 4 : 1;      // Sometimes in front, sometimes behind
    } else if (zone === 2) {
      // Between the ships vertically
      randomLeft = Math.floor(Math.random() * 30) + 40; // 40% to 70%
      // Vertical gaps: choose between top rows (38%-49% -> 42%-45%) or middle rows (49%-60% -> 53%-56%)
      const gapChoice = Math.random() > 0.5 ? 0 : 1;
      randomTop = gapChoice === 0 
        ? Math.floor(Math.random() * 4) + 42  // 42% to 45% (between s1 and s2)
        : Math.floor(Math.random() * 4) + 53; // 53% to 56% (between s2 and s3)
      randomZIndex = Math.random() > 0.5 ? 4 : 1;      // Mixed layering
    } else {
      // Deep sea / Fishing area (Right side)
      randomLeft = Math.floor(Math.random() * 24) + 68; // 68% to 92%
      randomTop = Math.floor(Math.random() * 45) + 33;  // 33% to 78%
      randomZIndex = Math.random() > 0.3 ? 4 : 1;      // Mostly in front, sometimes behind
    }

    setCreatures(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          left: randomLeft,
          top: randomTop,
          zIndex: randomZIndex
        };
      }
      if (c.id === id + 3) {
        // Follower is slightly offset (behind and above/below the leader)
        return {
          ...c,
          left: randomLeft - 4, // 4% to the left (behind in a left-to-right jump)
          top: randomTop - 3,  // 3% higher
          zIndex: randomZIndex
        };
      }
      return c;
    }));
  };

  // --- Initial Game State Defaults ---
  const DEFAULT_GOLD = 500;
  const DEFAULT_GEMS = 25;
  const DEFAULT_EXP = 0;
  const DEFAULT_RED_GEMS = 2450;
  const DEFAULT_FISH_STORAGE_LEVEL = 1;
  const DEFAULT_SHIP_TOWER_LEVEL = 1;
  const DEFAULT_SHIPS: ShipState[] = [
    { id: 's1', name: 'قارب خشبي متهالك', status: 'docked', left: '27%', top: '41%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
    { id: 's2', name: 'قارب خشبي متهالك', status: 'docked', left: '26%', top: '51%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
    { id: 's3', name: 'قارب خشبي متهالك', status: 'docked', left: '28%', top: '61%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' }
  ];
  const DEFAULT_CREW: CrewMember[] = [
    { id: 'c1', name: 'القبطان صخر', role: 'قبطان البحار', power: 30, cost: 150, avatar: '👨‍✈️', hired: false },
    { id: 'c2', name: 'الملاح رعد', role: 'ملاح الميناء', power: 15, cost: 80, avatar: '🧭', hired: false },
    { id: 'c3', name: 'المدفعجي غضب', role: 'رئيس المدفعية', power: 45, cost: 250, avatar: '💣', hired: false },
    { id: 'c4', name: 'البحار سندباد', role: 'مستكشف الجزر', power: 20, cost: 120, avatar: '🌊', image: SAILOR_ICON, hired: false },
  ];
  const DEFAULT_QUESTS: Quest[] = [
    { id: 'q1', title: 'صياد الأنشوجة النشيط', target: 'أرسل السفن للصيد 3 مرات', progress: 0, max: 3, rewardGold: 100, rewardGems: 2, completed: false, claimed: false },
    { id: 'q2', title: 'توسيع طاقم القيادة', target: 'قم بتعيين بحار واحد على الأقل', progress: 0, max: 1, rewardGold: 150, rewardGems: 5, completed: false, claimed: false },
    { id: 'q3', title: 'دعم التحالف الحليف', target: 'تبرع للتحالف بـ 50 ذهب', progress: 0, max: 50, rewardGold: 80, rewardGems: 1, completed: false, claimed: false },
  ];
  const DEFAULT_FISH_INVENTORY = {
    'أنشوجة المياه الدافئة 🐟': 15,
    'سردين ملوك الأعماق 🐟': 8,
  };
  const DEFAULT_WEAPONS = {
    smallRocket: 320,
    mediumRocket: 902,
    largeRocket: 6435,
    atomicBomb: 795,
    adBomb: 101,
    antiRocketDisabler: 6,
    antiNukeDisabler: 6,
    antiAdDisabler: 7,
    smallRepair: 2,
    mediumRepair: 0,
    largeRepair: 0,
    legendaryRepair: 0,
  };
  const DEFAULT_CREW_SERVICES = {
    luck: false,
    sailors: false,
    guide: false,
    police: false,
    thief: false,
    merchant: false,
    repairer_small: 5,
    repairer_medium: 3,
    repairer_large: 1,
    repairer_legendary: 0,
  };
  const DEFAULT_CREW_INVENTORY: Record<string, number> = {
    guide: 1,
    luck: 1,
    sailor: 0,
    thief: 1,
    cop: 1,
    merchant: 0,
    fixer_sm: 5,
    fixer_md: 3,
    fixer_lg: 1,
    fixer_epic: 0,
    market_expert: 1,
    gold_fisher: 1,
  };
  const DEFAULT_SHIELD_INVENTORY: Record<string, number> = {
    shield_4h: 1,
    shield_1d: 0,
    shield_2d: 0,
    anti_nuke: 0,
    anti_emp: 0,
    disable_anti_range: 0,
    disable_anti_core: 0,
  };

  const resetStateToDefaults = () => {
    // Reset React States
    setGold(DEFAULT_GOLD);
    setGems(DEFAULT_GEMS);
    setExp(DEFAULT_EXP);
    setRedGems(DEFAULT_RED_GEMS);
    setFishStorageLevel(DEFAULT_FISH_STORAGE_LEVEL);
    setShipTowerLevel(DEFAULT_SHIP_TOWER_LEVEL);
    setShips(DEFAULT_SHIPS);
    setCrew(DEFAULT_CREW);
    setQuests(DEFAULT_QUESTS);
    setBattleReports([]);
    setAttackLogs([]);
    setSupportGifts([]);
    setFishInventory(DEFAULT_FISH_INVENTORY);
    setWeapons(DEFAULT_WEAPONS);
    setCrewServices(DEFAULT_CREW_SERVICES);
    setCrewInventory(DEFAULT_CREW_INVENTORY);
    setShieldInventory(DEFAULT_SHIELD_INVENTORY);
    setPortDestroyed(false);
    setActiveAd(null);
    setUserDocReadyUid(null);
    setOwnAttackEffect(null);
    setIsOwnHarborShaking(false);
    setIncomingAttackAlert(null);
    setIncomingCombatFlash(false);
    setMyAliasUids([]);
    attackVisualTokenRef.current += 1;
    isPlayingAttackVisualRef.current = false;
    attackTimersRef.current.forEach(t => window.clearTimeout(t));
    attackTimersRef.current = [];
    pendingAttackEffectsRef.current = [];
    processedHarborEventIdsRef.current.clear();
    try { localStorage.removeItem('pirate_processed_harbor_events'); } catch {}
    setBgTheme('classic');
    setProfileTheme('default');
    setUsername('سياف_البحار');
    setAvatar('☠️');
    setServer('سيرفر الأسطورة 1');
    setPirateClass('صياد البحار');
    setFriends([]);
    setFriendRequests([]);
    setTribeId('');
    setTribeName('');
    setTribes([]);
    setChatMessages([]);
    setInspectedPlayer(null);
    setSelectedVisitedShip(null);
    lastDbData.current = null;
    activeAuthUidRef.current = null;
    
    // Clear LocalStorage of all account-specific game data and user tokens
    const keysToRemove = [
      'gold', 'gems', 'pirate_exp', 'pirate_port_destroyed', 'pirate_active_ad',
      'pirate_username', 'pirate_avatar', 'pirate_server', 'pirate_class',
      'pirate_crew_services', 'pirate_crew_inventory', 'pirate_shield_inventory',
      'pirate_bg_theme', 'pirate_profile_theme',
      'pirate_ships_v2', 'pirate_ships', 'pirate_quests',
      'pirate_battle_reports', 'pirate_attack_logs', 'pirate_support_gifts',
      'fish_storage_level', 'ship_tower_level', 'pirate_fish_inventory',
      'pirate_red_gems', 'pirate_weapons',
      'pirate_tribe_id', 'pirate_tribe_name', 'pirate_local_tribes',
      'google_auth_token', 'google_auth_email', 'google_auth_name',
      'google_auth_avatar', 'google_auth_uid',
      'pirate_is_logged_in', 'pirate_login_in_progress'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  const getTotalFish = (): number => {
    return Object.values(fishInventory || {}).reduce<number>((sum, count) => sum + (Number(count) || 0), 0);
  };

  // --- Game Currencies & Captain Stats ---
  const [gold, setGold] = useState<number>(() => {
    return parseInt(localStorage.getItem('gold') || '500');
  });
  const [gems, setGems] = useState<number>(() => {
    return parseInt(localStorage.getItem('gems') || '25');
  });
  const [exp, setExp] = useState<number>(() => {
    return parseInt(localStorage.getItem('pirate_exp') || '0');
  });
  const [portDestroyed, setPortDestroyed] = useState<boolean>(() => {
    return localStorage.getItem('pirate_port_destroyed') === 'true';
  });
  const [activeAd, setActiveAd] = useState<string | null>(() => {
    return localStorage.getItem('pirate_active_ad') || null;
  });
  const [userDocReadyUid, setUserDocReadyUid] = useState<string | null>(null);
  const [ownAttackEffect, setOwnAttackEffect] = useState<{
    type: 'ROCKET_SMALL' | 'ROCKET_MEDIUM' | 'ROCKET_LARGE' | 'ATOMIC_BOMB' | 'AD_BOMB';
    targetX: string;
    targetY: string;
    damage: number;
    phase: 'flying' | 'impact';
  } | null>(null);
  const [isOwnHarborShaking, setIsOwnHarborShaking] = useState<boolean>(false);
  const [incomingAttackAlert, setIncomingAttackAlert] = useState<{
    id: string;
    attackerId?: string;
    attackerName: string;
    attackerAvatar: string;
    weaponTitle: string;
    weaponIcon: string;
    summary: string;
    damage?: number;
    goldLost?: number;
    customMessage?: string;
    time: string;
  } | null>(null);
  const [incomingCombatFlash, setIncomingCombatFlash] = useState<boolean>(false);
  const [myAliasUids, setMyAliasUids] = useState<string[]>([]);
  const uidAliasToCanonicalRef = useRef<Record<string, string>>({});
  const pendingAttackEffectsRef = useRef<Array<{
    type: 'ROCKET_SMALL' | 'ROCKET_MEDIUM' | 'ROCKET_LARGE' | 'ATOMIC_BOMB' | 'AD_BOMB';
    targetX: string;
    targetY: string;
    damage: number;
  }>>([]);
  const attackVisualTokenRef = useRef<number>(0);
  const isPlayingAttackVisualRef = useRef<boolean>(false);
  const attackTimersRef = useRef<number[]>([]);
  const finishOwnAttackVisualRef = useRef<((expectedToken?: number) => void) | null>(null);
  const processedHarborEventIdsRef = useRef<Set<string>>((() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pirate_processed_harbor_events') || '[]');
      return new Set(Array.isArray(saved) ? saved.filter((id: any) => typeof id === 'string') : []);
    } catch {
      return new Set<string>();
    }
  })());
  const latestUserStateRef = useRef<any>({});

  // --- Network Online Connectivity & Anti-Desync State ---
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
  });
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineNotice(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setOfflineNotice('⚠️ انقطع الاتصال بالإنترنت! تم تجميد العمليات المالية مؤقتاً لحماية رصيدك وأصولك ومنع حدوث تضارب في البيانات.');
    };
    const handleFinancialBlocked = (e: any) => {
      const msg = e.detail?.message || '⚠️ تم إيقاف العملية المالية لعدم وجود اتصال بالإنترنت.';
      setOfflineNotice(msg);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('financial-offline-blocked', handleFinancialBlocked);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('financial-offline-blocked', handleFinancialBlocked);
    };
  }, []);

  // --- Profile Settings ---
  const [username, setUsername] = useState(() => localStorage.getItem('pirate_username') || 'سياف_البحار');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('pirate_avatar') || '☠️');
  const [useCustomAvatarFrame, setUseCustomAvatarFrame] = useState(() => localStorage.getItem('pirate_custom_avatar_chosen') === 'true');
  const [showProfileAvatarModal, setShowProfileAvatarModal] = useState(false);
  const [server, setServer] = useState(() => localStorage.getItem('pirate_server') || 'سيرفر الأسطورة 1');
  const [pirateClass, setPirateClass] = useState(() => localStorage.getItem('pirate_class') || 'صياد البحار');

  const renderInlineAvatar = (av?: string, sizePx = 28) => {
    const val = (av || '').trim();
    if (val === 'default' || val === 'silhouette') {
      return (
        <img
          src="/assets/profile_hex_default.png"
          alt="صورة القبطان"
          style={{ width: `${sizePx}px`, height: `${sizePx}px`, objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }}
        />
      );
    }
    if (isImageAvatarValue(val)) {
      return (
        <img
          src={val}
          alt="صورة القبطان"
          referrerPolicy="no-referrer"
          style={{ width: `${sizePx}px`, height: `${sizePx}px`, borderRadius: '50%', objectFit: 'cover', display: 'inline-block', verticalAlign: 'middle' }}
        />
      );
    }
    return <span>{val || '⚓'}</span>;
  };

  // --- Active Tab ---
  const [activeTab, setActiveTab] = useState<'harbor' | 'battle' | 'shop' | 'tribes' | 'chat' | 'leaderboard' | 'reports' | 'settings' | 'inventory' | 'warehouse' | 'friends'>('harbor');
  const [shopSubTab, setShopSubTab] = useState<'recharge' | 'backgrounds' | 'share' | 'crew_services' | 'hamour' | 'defense' | 'thihn'>('recharge');
  const [shopBoard, setShopBoard] = useState<'board1' | 'board2'>('board1');
  const [shopSubFilter, setShopSubFilter] = useState<'all' | 'offers' | 'gems' | 'gold' | 'crew' | 'weapons' | 'shields' | 'bundles'>('all');
  const [payingItem, setPayingItem] = useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'loading' | 'success'>('details');
  const [bgTheme, setBgTheme] = useState<string>(() => {
    const saved = localStorage.getItem('pirate_bg_theme') || 'classic';
    return ['classic', 'destroyed'].includes(saved) ? saved : 'classic';
  });
  const [profileTheme, setProfileTheme] = useState<string>(() => localStorage.getItem('pirate_profile_theme') || 'default');

  // --- Crew Services ---
  const [crewServices, setCrewServices] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('pirate_crew_services');
    return saved ? JSON.parse(saved) : {
      luck: false,
      sailors: false,
      guide: false,
      police: false,
      thief: false,
      merchant: false,
      repairer_small: 5,
      repairer_medium: 3,
      repairer_large: 1,
      repairer_legendary: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem('pirate_crew_services', JSON.stringify(crewServices));
  }, [crewServices]);

  // --- Crew Inventory State (المخزن - أفراد الطاقم والشخصيات) ---
  const [crewInventory, setCrewInventory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('pirate_crew_inventory');
    return saved ? JSON.parse(saved) : {
      guide: 1,
      luck: 1,
      sailor: 0,
      thief: 1,
      cop: 1,
      merchant: 0,
      fixer_sm: 5,
      fixer_md: 3,
      fixer_lg: 1,
      fixer_epic: 0,
      market_expert: 1,
      gold_fisher: 1,
    };
  });

  useEffect(() => {
    localStorage.setItem('pirate_crew_inventory', JSON.stringify(crewInventory));
  }, [crewInventory]);

  // --- Shield Inventory State (المخزن - دروع الحماية) ---
  const [shieldInventory, setShieldInventory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('pirate_shield_inventory');
    return saved ? JSON.parse(saved) : {
      shield_4h: 1,
      shield_1d: 0,
      shield_2d: 0,
      anti_nuke: 0,
      anti_emp: 0,
      disable_anti_range: 0,
      disable_anti_core: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem('pirate_shield_inventory', JSON.stringify(shieldInventory));
  }, [shieldInventory]);

  useEffect(() => {
    localStorage.setItem('pirate_bg_theme', bgTheme);
  }, [bgTheme]);

  useEffect(() => {
    localStorage.setItem('pirate_profile_theme', profileTheme);
  }, [profileTheme]);

  // --- Ships State ---
  const [ships, setShips] = useState<ShipState[]>(() => {
    const saved = localStorage.getItem('pirate_ships_v2');
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        if (Array.isArray(loaded)) {
          // Keep exactly 3 ships, and ensure they all exist by default if not set
          const sanitized = loaded.slice(0, 3).map((s: any) => {
            const validCrew = sanitizeShipCrew(s.assignedCrew);
            const dockById: Record<string, { l: string; t: string }> = {
              s1: { l: '27%', t: '41%' },
              s2: { l: '26%', t: '51%' },
              s3: { l: '28%', t: '61%' },
            };
            const fishById: Record<string, { l: string; t: string }> = {
              s1: { l: '55%', t: '38%' },
              s2: { l: '55%', t: '49%' },
              s3: { l: '55%', t: '60%' },
            };
            const targetPos = s.status === 'fishing' ? (fishById[s.id] || { l: '55%', t: '49%' }) : (dockById[s.id] || { l: '26%', t: '51%' });
            return syncShipMetadata({
              ...s,
              exists: s.exists !== undefined ? s.exists : true,
              assignedCrew: validCrew,
              crewPower: validCrew.length * 15,
              left: targetPos.l,
              top: targetPos.t,
              moving: false
            });
          });
          if (sanitized.length > 0) {
            while (sanitized.length < 3) {
              const defaults = [
                { id: 's1', name: 'قارب خشبي متهالك', status: 'docked', left: '27%', top: '41%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
                { id: 's2', name: 'قارب خشبي متهالك', status: 'docked', left: '26%', top: '51%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
                { id: 's3', name: 'قارب خشبي متهالك', status: 'docked', left: '28%', top: '61%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' }
              ];
              const missingIdx = sanitized.length;
              sanitized.push(defaults[missingIdx]);
            }
            return sanitized;
          }
        }
      } catch (e) {
        console.error("Error parsing ships storage:", e);
      }
    }
    return [
      { id: 's1', name: 'قارب خشبي متهالك', status: 'docked', left: '27%', top: '41%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
      { id: 's2', name: 'قارب خشبي متهالك', status: 'docked', left: '26%', top: '51%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
      { id: 's3', name: 'قارب خشبي متهالك', status: 'docked', left: '28%', top: '61%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
    ];
  });

  // Ensure crewServices are strictly in sync with ships' assignedCrew
  useEffect(() => {
    const allAssigned = ships.flatMap(s => s.assignedCrew || []);
    const anyHasGH = allAssigned.includes('golden_hunter') || allAssigned.includes('gold_fisher');
    const anyHasLuck = allAssigned.includes('luck');
    const anyHasSailor = allAssigned.includes('sailor') || allAssigned.includes('sailors');
    const anyHasGuide = allAssigned.includes('guide');
    const anyHasCop = allAssigned.includes('cop') || allAssigned.includes('police');
    const anyHasThief = allAssigned.includes('thief');

    let changed = false;
    const updated = { ...crewServices };

    if (!anyHasGH && (updated.golden_hunter || updated.gold_fisher)) {
      updated.golden_hunter = false;
      updated.gold_fisher = false;
      changed = true;
    }
    if (!anyHasLuck && updated.luck) {
      updated.luck = false;
      changed = true;
    }
    if (!anyHasSailor && (updated.sailor || updated.sailors)) {
      updated.sailor = false;
      updated.sailors = false;
      changed = true;
    }
    if (!anyHasGuide && updated.guide) {
      updated.guide = false;
      changed = true;
    }
    if (!anyHasCop && (updated.cop || updated.police)) {
      updated.cop = false;
      updated.police = false;
      changed = true;
    }
    if (!anyHasThief && updated.thief) {
      updated.thief = false;
      changed = true;
    }

    if (changed) {
      setCrewServices(updated);
      localStorage.setItem('pirate_crew_services', JSON.stringify(updated));
    }
  }, [ships]);

  // --- Crew State ---
  const [crew, setCrew] = useState<CrewMember[]>([
    { id: 'c1', name: 'القبطان صخر', role: 'قبطان البحار', power: 30, cost: 150, avatar: '👨‍✈️', hired: false },
    { id: 'c2', name: 'الملاح رعد', role: 'ملاح الميناء', power: 15, cost: 80, avatar: '🧭', hired: false },
    { id: 'c3', name: 'المدفعجي غضب', role: 'رئيس المدفعية', power: 45, cost: 250, avatar: '💣', hired: false },
    { id: 'c4', name: 'البحار سندباد', role: 'مستكشف الجزر', power: 20, cost: 120, avatar: '🌊', image: SAILOR_ICON, hired: false },
  ]);

  // --- Real Multiplayer Friends & Tribe States ---
  const [friends, setFriends] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [incomingTribeJoinRequests, setIncomingTribeJoinRequests] = useState<TribeJoinRequest[]>([]);
  const [outgoingTribeJoinRequests, setOutgoingTribeJoinRequests] = useState<TribeJoinRequest[]>([]);
  const notifiedTribeJoinRequestIdsRef = useRef<Set<string>>(new Set());
  const [incomingTribeInvitations, setIncomingTribeInvitations] = useState<TribeInvitation[]>([]);
  const notifiedTribeInviteIdsRef = useRef<Set<string>>(new Set());
  const [tribeId, setTribeId] = useState<string>(() => localStorage.getItem('pirate_tribe_id') || '');
  const [tribeName, setTribeName] = useState<string>(() => localStorage.getItem('pirate_tribe_name') || '');
  const [tribes, setTribes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('pirate_local_tribes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCreateTribeModal, setShowCreateTribeModal] = useState(false);
  const [newTribeName, setNewTribeName] = useState('');
  const [newTribeDesc, setNewTribeDesc] = useState('');
  const [newTribeEmblem, setNewTribeEmblem] = useState('🏴‍☠️');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  // --- Quests State ---
  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem('pirate_quests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'q1', title: 'صياد الأنشوجة النشيط', target: 'أرسل السفن للصيد 3 مرات', progress: 0, max: 3, rewardGold: 100, rewardGems: 2, completed: false, claimed: false },
      { id: 'q2', title: 'توسيع طاقم القيادة', target: 'قم بتعيين بحار واحد على الأقل', progress: 0, max: 1, rewardGold: 150, rewardGems: 5, completed: false, claimed: false },
      { id: 'q3', title: 'دعم التحالف الحليف', target: 'تبرع للتحالف بـ 50 ذهب', progress: 0, max: 50, rewardGold: 80, rewardGems: 1, completed: false, claimed: false },
    ];
  });

  useEffect(() => {
    try { localStorage.setItem('pirate_quests', JSON.stringify(quests)); } catch {}
  }, [quests]);

  // --- Battle Reports State (Real gameplay data only) ---
  const [battleReports, setBattleReports] = useState<BattleReport[]>(() => {
    try {
      const saved = localStorage.getItem('pirate_battle_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((r: any) => (r.opponentName || r.opponent) && (r.opponentName || r.opponent) !== 'قبطان معادٍ' && !r.id?.startsWith('mock_'))
          : [];
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try { localStorage.setItem('pirate_battle_reports', JSON.stringify(battleReports)); } catch {}
  }, [battleReports]);

  // --- War & Revenge Log (سجل الغارات والانتقام والدعوم - بيانات حقيقية 100% فقط) ---
  const [showWarLogModal, setShowWarLogModal] = useState<boolean>(false);
  const [attackLogs, setAttackLogs] = useState<AttackLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('pirate_attack_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((a: any) => a.id && !a.id.startsWith('atk-') && a.attackerName !== 'رماس محمد' && a.attackerName !== 'الكابتن صقر')
          : [];
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try { localStorage.setItem('pirate_attack_logs', JSON.stringify(attackLogs)); } catch {}
  }, [attackLogs]);

  const [supportGifts, setSupportGifts] = useState<SupportGiftItem[]>(() => {
    try {
      const saved = localStorage.getItem('pirate_support_gifts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((g: any) => g.id && !g.id.startsWith('gift-') && g.senderName !== 'القبطان سيف' && g.senderName !== 'القبطانة ريم' && g.senderName !== 'تحالف ملوك الأعماق')
          : [];
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try { localStorage.setItem('pirate_support_gifts', JSON.stringify(supportGifts)); } catch {}
  }, [supportGifts]);

  useEffect(() => {
    try {
      if (tribeId) localStorage.setItem('pirate_tribe_id', tribeId);
      else localStorage.removeItem('pirate_tribe_id');
      if (tribeName) localStorage.setItem('pirate_tribe_name', tribeName);
      else localStorage.removeItem('pirate_tribe_name');
    } catch {}
  }, [tribeId, tribeName]);

  useEffect(() => {
    try {
      if (Array.isArray(tribes) && tribes.length > 0) {
        localStorage.setItem('pirate_local_tribes', JSON.stringify(tribes));
      }
    } catch {}
  }, [tribes]);

  // --- Real-time Real Players (Multiplayer) ---
  const [realPlayers, setRealPlayers] = useState<any[]>([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'search' | 'donate' | 'tribes' | 'shop' | 'fish' | 'gold' | 'gems' | 'xp' | 'events'>('gold');
  const [leaderboardSearchQuery, setLeaderboardSearchQuery] = useState('');
  const [donationTargetPlayer, setDonationTargetPlayer] = useState<any | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(100);

  // --- Visited Player Profiles & Sea Interactions ---
  const [inspectedPlayer, setInspectedPlayer] = useState<any | null>(null);
  const recentAttackShipDamageRef = useRef<Record<string, { ships: any[]; portDestroyed: boolean; baselineShipsKey: string; appliedAt: number }>>({});
  const getShipsSignature = (list: any[] | undefined) =>
    JSON.stringify((Array.isArray(list) ? list : []).map((s: any) => ({
      id: s?.id ?? null,
      h: typeof s?.heart === 'number' ? s.heart : null,
      ex: s?.exists !== false
    })));
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [inspectedPlayerShipVisit, setInspectedPlayerShipVisit] = useState<boolean>(false);
  const [selectedVisitedShip, setSelectedVisitedShip] = useState<any | null>(null);
  const [visitedBuildingModal, setVisitedBuildingModal] = useState<{ type: 'fish' | 'shipTower'; title: string; level: number; details: string; capacity?: number; image: string } | null>(null);
  const [activeInteractionType, setActiveInteractionType] = useState<'details' | 'steal' | 'repair' | null>(null);
  const [selectedOwnShipId, setSelectedOwnShipId] = useState<string>('s1');

  // --- Tactical Nuclear Strike States & Methods ---
  const [showWeaponSelector, setShowWeaponSelector] = useState<boolean>(false);
  const [isAtomicBombActive, setIsAtomicBombActive] = useState<boolean>(false);
  const [showAtomicExplosion, setShowAtomicExplosion] = useState<boolean>(false);
  const [showAtomicBombXp, setShowAtomicBombXp] = useState<boolean>(false);
  const [showLootSelector, setShowLootSelector] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [gainedXpAnim, setGainedXpAnim] = useState<boolean>(false);
  const [selectedLootCard, setSelectedLootCard] = useState<number | null>(null);
  const [lootResultText, setLootResultText] = useState<string>('');

  // --- Custom Advanced Weapons States ---
  const [showGlobalMessageModal, setShowGlobalMessageModal] = useState<boolean>(false);
  const [globalMessageText, setGlobalMessageText] = useState<string>('');
  const [isLargeRocketActive, setIsLargeRocketActive] = useState<boolean>(false);
  const [showLargeRocketExplosion, setShowLargeRocketExplosion] = useState<boolean>(false);
  const [isMediumRocketActive, setIsMediumRocketActive] = useState<boolean>(false);
  const [showMediumRocketExplosion, setShowMediumRocketExplosion] = useState<boolean>(false);
  const [isSmallRocketActive, setIsSmallRocketActive] = useState<boolean>(false);
  const [showSmallRocketExplosion, setShowSmallRocketExplosion] = useState<boolean>(false);
  const [rocketTargetPos, setRocketTargetPos] = useState<{ l: string; t: string }>({ l: '45%', t: '49%' });
  const [lastRocketDamage, setLastRocketDamage] = useState<number>(1000);
  const [showRocketXp, setShowRocketXp] = useState<boolean>(false);
  const [rocketXpText, setRocketXpText] = useState<string>('XP +100');
  const [showSmokeExplosion, setShowSmokeExplosion] = useState<boolean>(false);
  const [showAdSelectorModal, setShowAdSelectorModal] = useState<boolean>(false);
  const [showLegendaryRepairSparkles, setShowLegendaryRepairSparkles] = useState<boolean>(false);

  // --- Post-Detonation Custom Message Modal (إرسال رسالة للشخص الذي فجرت سفنه أو ميناءه) ---
  const [postDetonationModal, setPostDetonationModal] = useState<{
    isOpen: boolean;
    targetDocId: string;
    targetPlayerName: string;
    targetPlayerAvatar: string;
    adTitle: string;
    allDestroyed: boolean;
  } | null>(null);
  const [detonationCustomMessage, setDetonationCustomMessage] = useState<string>('');
  const [isSendingDetonationMessage, setIsSendingDetonationMessage] = useState<boolean>(false);

  // Helper to dynamically calculate launch trajectory angle from bottom-right corner (96%, 96%) to target
  const getRocketLaunchAngle = (targetLeftStr: string, targetTopStr: string) => {
    const startX = 96;
    const startY = 96;
    const targetX = parseFloat(targetLeftStr) || 45;
    const targetY = parseFloat(targetTopStr) || 49;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const deg = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
    return `${deg.toFixed(1)}deg`;
  };

  // --- In-Game Real-time Notification Banner States & Queue ---
  const [currentNotification, setCurrentNotification] = useState<GlobalNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<GlobalNotification[]>([]);
  const displayedNotifIds = useRef<Set<string>>(new Set());

  // Audio notification playback using imported synthesizer
  const triggerNotificationSound = (type: NotificationEventType) => {
    try {
      playNotificationSound(type, isMuted || isSfxMuted);
    } catch (e) {
      console.debug('Notification sound playback notice:', e);
    }
  };

  // Queue listener effect: when currentNotification is null and queue has items, advance queue cleanly outside render
  useEffect(() => {
    if (!currentNotification && notificationQueue.length > 0) {
      const next = notificationQueue[0];
      setNotificationQueue(prev => prev.slice(1));
      setCurrentNotification(next);
      triggerNotificationSound(next.type);
    }
  }, [currentNotification, notificationQueue]);

  const queueNotification = (notif: GlobalNotification) => {
    const key = notif.id || `${notif.type}_${notif.title}_${notif.message}`;
    if (displayedNotifIds.current.has(key)) return;
    displayedNotifIds.current.add(key);

    setNotificationQueue(prev => [...prev, notif]);
  };

  const showInGameBanner = (notif: GlobalNotification) => {
    queueNotification(notif);
  };

  const handleDismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  const handleToggleNotifSound = () => {
    setIsSfxMuted(prev => {
      const next = !prev;
      localStorage.setItem('pirate_sfx_muted', String(next));
      return next;
    });
  };

  const triggerGlobalNotification = async (params: {
    type: NotificationEventType;
    title: string;
    message: string;
    icon?: string;
    targetName?: string;
    targetId?: string;
    details?: string;
  }) => {
    const currentUser = auth.currentUser;
    const safeTitle = String(params.title || 'إشعار بحري').slice(0, 120);
    const safeMessage = String(params.message || '').slice(0, 500) || safeTitle;
    const safeIcon = String(params.icon || (params.type === 'ATTACK' ? '⚔️' : params.type === 'SUPPORT' ? '🛡️' : '🏆')).slice(0, 64);
    const safeAuthorName = String(username || 'قبطان_مجهول').slice(0, 100);
    const safeTargetName = String(params.targetName || '').slice(0, 100);
    const safeTargetId = String(params.targetId || '').slice(0, 128);
    const safeDetails = String(params.details || '').slice(0, 500);

    const notifPayload: GlobalNotification = {
      type: params.type,
      title: safeTitle,
      message: safeMessage,
      icon: safeIcon,
      authorId: currentUser?.uid || 'anonymous',
      senderId: currentUser?.uid || 'anonymous',
      authorName: safeAuthorName,
      senderName: safeAuthorName,
      targetName: safeTargetName,
      targetId: safeTargetId,
      details: safeDetails,
      createdAt: new Date().toISOString()
    };

    // Immediate visual presentation
    queueNotification(notifPayload);

    // Broadcast live to /globalNotifications collection if permitted by Firestore rules
    if (currentUser) {
      try {
        await addDoc(collection(db, 'globalNotifications'), notifPayload);
      } catch (err: any) {
        if (err?.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.CREATE, 'globalNotifications');
        }
      }
    }
  };

  const sendGlobalNotification = async (
    type: NotificationEventType,
    title: string,
    message: string,
    targetName?: string,
    icon?: string
  ) => {
    return triggerGlobalNotification({ type, title, message, targetName, icon });
  };

  const playNuclearExplosionSound = () => {
    playAtomicBombDropSound();
    setTimeout(() => {
      playAtomicBombExplosionSound();
    }, 1350);
  };

  const playLuffyAdSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      
      // Heroic anime brassy chord notes
      const notes = [
        { f: 261.63, d: 0.15 }, // C4
        { f: 329.63, d: 0.15 }, // E4
        { f: 392.00, d: 0.15 }, // G4
        { f: 523.25, d: 0.25 }, // C5
        { f: 659.25, d: 0.25 }, // E5
        { f: 783.99, d: 0.35 }, // G5
        { f: 1046.50, d: 0.60 } // C6
      ];
      
      let time = now;
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.f, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + note.d);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + note.d);
        
        time += note.d - 0.05;
      });
      
      // Luffy's signature laugh sweep sequence
      let laughTime = time + 0.1;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        
        osc.frequency.setValueAtTime(600 + i * 80, laughTime);
        osc.frequency.exponentialRampToValueAtTime(1200 + i * 80, laughTime + 0.12);
        
        gain.gain.setValueAtTime(0, laughTime);
        gain.gain.linearRampToValueAtTime(0.25, laughTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, laughTime + 0.12);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(laughTime);
        osc.stop(laughTime + 0.15);
        laughTime += 0.14;
      }
    } catch(e) {
      console.error(e);
    }
  };

  const playAdPoemSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      
      // Majestic Middle Eastern Scale melody
      const notes = [
        { f: 293.66, d: 0.3 }, // D4
        { f: 311.13, d: 0.3 }, // Eb4
        { f: 349.23, d: 0.4 }, // F4
        { f: 392.00, d: 0.4 }, // G4
        { f: 440.00, d: 0.3 }, // A4
        { f: 466.16, d: 0.3 }, // Bb4
        { f: 554.37, d: 0.5 }, // C#5
        { f: 587.33, d: 0.8 }  // D5
      ];
      
      let time = now;
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + note.d);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + note.d);
        time += note.d - 0.05;
      });
    } catch(e) {
      console.error(e);
    }
  };

  const playLegendaryRepairSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      
      const notes = [
        { f: 261.63, d: 0.15 }, // C4
        { f: 329.63, d: 0.15 }, // E4
        { f: 392.00, d: 0.15 }, // G4
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.15 }, // G5
        { f: 1046.50, d: 0.3 }  // C6
      ];
      
      let time = now;
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, time);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(note.f * 2, time);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(note.f * 1.5, time);
        filter.Q.setValueAtTime(5, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + note.d);
        
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc2.start(time);
        osc.stop(time + note.d);
        osc2.stop(time + note.d);
        time += 0.08;
      });
    } catch (e) {
      console.error(e);
    }
  };

  // --- Secure Real-Time Global Chat Notification Helper ---
  const sendSecureChatMessage = async (sender: string, avatarIcon: string, text: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    try {
      await addDoc(collection(db, 'chats'), {
        sender: String(sender || 'القبطان').slice(0, 100),
        senderId: currentUser.uid,
        userId: currentUser.uid,
        avatar: String(avatarIcon || '⚓').slice(0, 30000),
        text: String(text || '').slice(0, 1000),
        time: timeStr,
        createdAt: now.toISOString()
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'chats');
    }
  };

  const resolveCanonicalUid = (rawUid?: string): string => {
    if (!rawUid) return '';
    let cur = String(rawUid).trim();
    const visited = new Set<string>();
    while (cur && uidAliasToCanonicalRef.current[cur] && !visited.has(cur)) {
      visited.add(cur);
      cur = uidAliasToCanonicalRef.current[cur];
    }
    return cur;
  };

  // --- Secure Multiplayer Harbor Event Dispatcher Helper ---
  const createHarborEvent = async (defenderId: string, type: string, payload: Record<string, any>): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast('يجب تسجيل الدخول للتفاعل مع موانئ القراصنة', 'error');
      return false;
    }
    const resolvedDefenderId = resolveCanonicalUid(defenderId);
    if (!resolvedDefenderId || resolvedDefenderId.startsWith('rival_')) {
      showToast('⚠️ تعذر تحديد معرف حساب الخصم الحقيقي لإرسال الهجوم!', 'error');
      return false;
    }
    if (resolvedDefenderId === currentUser.uid) {
      showToast('لا يمكنك استهداف مينائك الخاص!', 'error');
      return false;
    }
    try {
      const targetName = payload?.targetName || payload?.defenderName || inspectedPlayer?.username || inspectedPlayer?.name || 'قبطان آخر';
      const targetEmail = (payload?.targetEmail || inspectedPlayer?.email || '').toLowerCase().trim();
      const enrichedPayload = {
        ...payload,
        targetName,
        ...(targetEmail ? { targetEmail } : {}),
        attackerLevel: payload?.attackerLevel ?? playerLevel,
      };

      await addDoc(collection(db, 'harborEvents'), {
        attackerId: currentUser.uid,
        attackerName: username || 'قبطان_مجهول',
        attackerAvatar: avatar || '☠️',
        defenderId: resolvedDefenderId,
        type,
        payload: enrichedPayload,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });

      // Auto-broadcast in-game event to all players (non-fatal if restricted by rules)
      let eventType: NotificationEventType = 'ATTACK';
      let eventTitle = '⚔️ اشتباك بحري!';
      let eventMsg = `قام القبطان @${username || 'قبطان'} بعملية بحرية ضد ميناء القبطان @${targetName}!`;
      let eventIcon = '⚔️';

      if (type === 'ATOMIC_BOMB') {
        eventType = 'ATTACK';
        eventTitle = '☢️ كارثة نووية ذرية!';
        eventMsg = `شن القبطان @${username || 'قبطان'} ضربة نووية شاملة دمّرت ميناء القبطان @${targetName}!`;
        eventIcon = '☢️';
      } else if (type === 'AD_BOMB') {
        eventType = 'ATTACK';
        eventTitle = '⚡ قصف إعلاني مدمّر!';
        eventMsg = `فجّر القبطان @${username || 'قبطان'} قنبلة إعلانية دمّرت دفاعات ميناء القبطان @${targetName}!`;
        eventIcon = '💥';
      } else if (type === 'ROCKET_SMALL') {
        eventType = 'ATTACK';
        eventTitle = '⚔️ غارة صاروخية بحرية!';
        eventMsg = `استهدف القبطان @${username || 'قبطان'} سفينة في ميناء القبطان @${targetName} بصاروخ حربي!`;
        eventIcon = '🚀';
      } else if (type === 'ROCKET_MEDIUM') {
        eventType = 'ATTACK';
        eventTitle = '⚔️ قصف بصاروخ متوسط!';
        eventMsg = `قصف القبطان @${username || 'قبطان'} أسطول القبطان @${targetName} بصاروخ حربي متطور!`;
        eventIcon = '🚀';
      } else if (type === 'ROCKET_LARGE') {
        eventType = 'ATTACK';
        eventTitle = '⚔️ قصف بصاروخ ثقيل مدمر!';
        eventMsg = `شن القبطان @${username || 'قبطان'} قصفاً صاروخياً فتاكاً على ميناء القبطان @${targetName}!`;
        eventIcon = '🚀';
      } else if (type === 'STEAL') {
        eventType = 'ATTACK';
        eventTitle = '🏴‍☠️ تسلل ولصوصية بحرية!';
        eventMsg = `تسلل القبطان @${username || 'قبطان'} وسرق خزائن ميناء القبطان @${targetName}!`;
        eventIcon = '🏴‍☠️';
      } else if (type === 'LOOT') {
        eventType = 'ATTACK';
        eventTitle = '⚔️ غنائم وقرصنة بحرية!';
        eventMsg = `غنم القبطان @${username || 'قبطان'} موارد من ميناء القبطان @${targetName}!`;
        eventIcon = '💰';
      } else if (type === 'REPAIR') {
        eventType = 'SUPPORT';
        eventTitle = '🛡️ دعم وصيانة أسطول!';
        eventMsg = `أرسل القبطان الحليف @${username || 'قبطان'} طاقم صيانة لإصلاح سفن القبطان @${targetName}!`;
        eventIcon = '🛠️';
      } else if (type === 'DONATION' || type === 'GIFT') {
        eventType = 'SUPPORT';
        eventTitle = '🛡️ تعزيزات ومؤن بحرية!';
        const amt = payload?.amount ? ` 🪙 ${payload.amount.toLocaleString()}` : '';
        eventMsg = `أرسل القبطان @${username || 'قبطان'} دعماً ومؤناً بحرية${amt} للقبطان @${targetName}!`;
        eventIcon = '🎁';
      }

      triggerGlobalNotification({
        type: eventType,
        title: eventTitle,
        message: eventMsg,
        icon: eventIcon,
        targetName,
        targetId: resolvedDefenderId
      }).catch(() => {});

      return true;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'harborEvents');
      showToast('⚠️ تعذر إرسال حدث الميناء إلى السيرفر: ' + (err.message || 'خطأ في الاتصال'), 'error');
      return false;
    }
  };

  // Prefer actual canonical Firestore document ID (active auth UID) when targeting players
  const getTargetDefenderId = (player: any): string => {
    if (!player) return '';
    const rawId = (player.id && !String(player.id).startsWith('rival_'))
      ? String(player.id)
      : String(player.userId || player.id || '');
    return resolveCanonicalUid(rawId);
  };

  // --- Attack & Steal Validation Function (دالة التحقق من شروط الهجوم والسرقة) ---
  const getShipEffectiveLevel = (s: any): number => {
    if (!s) return 0;
    if (typeof s.level === 'number') return s.level;
    const spec = SHOP_SHIPS.find((shopShip: any) => shopShip.name === s.name);
    return spec?.level ?? 0;
  };

  /**
   * التحقق من شروط الهجوم والسرقة:
   * 1. السماح بعمليات الهجوم والسرقة (التفجير) فقط إذا كانت سفن اللاعب بمستوى 6 وما فوق.
   * 2. التحقق برمجياً من أن مستوى السفينة/السفن يبلغ 6 أو أعلى قبل تنفيذ أي هجوم أو سرقة.
   * 3. إذا حاول اللاعب الهجوم وسفنه أقل من مستوى 6، يتم إظهار رسالة تنبيه تمنعه من ذلك.
   */
  const validateAttackOrSteal = (specificShipId?: string): { allowed: boolean; message: string } => {
    const activeShips = ships.filter(s => s.exists);
    if (activeShips.length === 0) {
      return {
        allowed: false,
        message: 'يجب أن تمتلك سفينة نشطة واحدة على الأقل لتتمكن من الهجوم أو السرقة!'
      };
    }

    // إذا تم تحديد سفينة معينة لتنفيذ الهجوم/السرقة (مثل اختيار سفينة في شاشة السرقة)
    if (specificShipId) {
      const chosenShip = activeShips.find(s => s.id === specificShipId);
      if (chosenShip) {
        const lvl = getShipEffectiveLevel(chosenShip);
        if (lvl < 6) {
          return {
            allowed: false,
            message: 'يجب أن تكون سفنك بمستوى 6 وما فوق لتتمكن من الهجوم أو السرقة'
          };
        }
        return { allowed: true, message: '' };
      }
    }

    // التحقق من أن مستوى سفن اللاعب يبلغ 6 وما فوق
    const maxLevel = Math.max(...activeShips.map(s => getShipEffectiveLevel(s)), 0);
    if (maxLevel < 6) {
      return {
        allowed: false,
        message: 'يجب أن تكون سفنك بمستوى 6 وما فوق لتتمكن من الهجوم أو السرقة'
      };
    }

    return { allowed: true, message: '' };
  };

  const applyWeaponDamageToPlayerState = (
    player: any,
    damage: number,
    targetShipId?: string,
    targetShipIndex?: number,
    allShips: boolean = false
  ) => {
    if (!player) return player;
    const currentShips = (player.ships && Array.isArray(player.ships) && player.ships.length > 0)
      ? player.ships
      : getInspectedPlayerShips(player);
    const updated = currentShips.map((s: any, idx: number) => {
      const normalized = normalizeShipEnergyToCargo(s, Boolean(player.portDestroyed));
      const isTarget = allShips
        ? true
        : (targetShipId ? s.id === targetShipId : false) || (typeof targetShipIndex === 'number' && idx === targetShipIndex);
      if (!isTarget) return normalized;
      const maxH = getShipMaxHeart(normalized);
      const currentHeart = typeof normalized.heart === 'number' ? Math.min(normalized.heart, maxH) : maxH;
      const newHeart = Math.max(0, currentHeart - damage);
      return {
        ...normalized,
        maxHeart: maxH,
        heart: newHeart,
        energySyncedToCargo: true,
        ...(newHeart <= 0 ? { moving: false, status: 'docked' } : {})
      };
    });
    const activeUpdated = updated.filter((s: any) => s.exists !== false);
    const allDestroyed = activeUpdated.length > 0 && activeUpdated.every((s: any) => typeof s.heart === 'number' && s.heart <= 0);
    const targetKey = getTargetDefenderId(player) || player.id || player.userId;
    if (targetKey && !(auth.currentUser && targetKey === auth.currentUser.uid)) {
      const existingOverlay = recentAttackShipDamageRef.current[targetKey];
      const baselineShipsKey = existingOverlay ? existingOverlay.baselineShipsKey : getShipsSignature(player.ships);
      recentAttackShipDamageRef.current[targetKey] = {
        ships: updated,
        portDestroyed: allDestroyed,
        baselineShipsKey,
        appliedAt: Date.now()
      };
    }
    return {
      ...player,
      portDestroyed: allDestroyed,
      ships: updated
    };
  };

  const handleLaunchSmallRocket = (targetShipOverride?: any) => {
    if (!inspectedPlayer) return;

    const validation = validateAttackOrSteal();
    if (!validation.allowed) {
      alert(validation.message);
      showToast(validation.message, 'error');
      return;
    }

    const targetSnapshot = inspectedPlayer;
    const targetDocId = getTargetDefenderId(targetSnapshot);
    if (!targetDocId || targetDocId.startsWith('rival_')) {
      showToast('⚠️ تعذر إرسال الهجوم: حساب الهدف غير مرتبط بمعرف فعّال.', 'error');
      return;
    }
    if (auth.currentUser && targetDocId === auth.currentUser.uid) {
      showToast('لا يمكنك استهداف مينائك الخاص!', 'error');
      return;
    }

    setSelectedVisitedShip(null);
    setShowWeaponSelector(false);

    const baseShips = (targetSnapshot.ships && Array.isArray(targetSnapshot.ships) && targetSnapshot.ships.length > 0)
      ? targetSnapshot.ships
      : getInspectedPlayerShips(targetSnapshot);
    const targetShip = targetShipOverride || selectedVisitedShip || baseShips.find((s: any) => s.exists !== false && (typeof s.heart !== 'number' || s.heart > 0)) || baseShips[0];

    let targetLeft = '45%';
    let targetTop = '49%';
    if (targetShip) {
      if (targetShip.left && targetShip.top) {
        targetLeft = targetShip.left;
        targetTop = targetShip.top;
      } else {
        const idx = baseShips.findIndex((s: any) => s.id === targetShip.id);
        const dockKey = `s${targetShip.id || (idx >= 0 ? idx + 1 : 1)}`;
        const fallbackPos = docks[dockKey] || docks[`s${(idx >= 0 ? idx + 1 : 1)}`] || { l: '45%', t: '49%' };
        targetLeft = fallbackPos.l;
        targetTop = fallbackPos.t;
      }
    }

    setRocketTargetPos({ l: targetLeft, t: targetTop });
    playSmallRocketIncomingSound();
    setIsSmallRocketActive(true);

    setWeapons(prev => {
      const curQty = prev.smallRocket !== undefined ? prev.smallRocket : (prev.small_missile ?? 0);
      const nextQty = Math.max(0, curQty - 1);
      const updated = {
        ...prev,
        smallRocket: nextQty,
        ...(prev.small_missile !== undefined ? { small_missile: nextQty } : {})
      };
      localStorage.setItem('pirate_weapons', JSON.stringify(updated));
      return updated;
    });

    const flatDamage = 1000;
    let smallUpdatedShips: any[] | null = null;
    let smallAllDestroyed = false;
    let smallDealtDamage = 0;

    if (targetShip && targetDocId) {
      const targetIdx = targetShip.id ? baseShips.findIndex((s: any) => s.id === targetShip.id) : 0;
      const resolvedTargetIdx = targetIdx >= 0 ? targetIdx : 0;
      const resolvedTargetShipId = baseShips[resolvedTargetIdx]?.id || targetShip.id;
      const computedShips = baseShips.map((s: any, idx: number) => {
        const normalized = normalizeShipEnergyToCargo(s, targetSnapshot.portDestroyed);
        if (idx === resolvedTargetIdx) {
          const maxH = getShipMaxHeart(normalized);
          const dmg = flatDamage;
          smallDealtDamage = dmg;
          const currentHeart = typeof normalized.heart === 'number' ? Math.min(normalized.heart, maxH) : maxH;
          const newHeart = Math.max(0, currentHeart - dmg);
          return { ...normalized, maxHeart: maxH, heart: newHeart, energySyncedToCargo: true, ...(newHeart <= 0 ? { moving: false, status: 'docked' } : {}) };
        }
        return normalized;
      });
      smallUpdatedShips = computedShips;

      const activeUpdatedShips = computedShips.filter((s: any) => s.exists !== false);
      smallAllDestroyed = activeUpdatedShips.length > 0 && activeUpdatedShips.every((s: any) => typeof s.heart === 'number' && s.heart <= 0);

      const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const newReport = {
        id: `rocket_small_${Date.now()}`,
        opponent: username,
        opponentName: username,
        opponentAvatar: avatar || '☠️',
        type: 'defense',
        result: 'defeat',
        isVictory: false,
        goldChange: 0,
        time: nowTime,
        date: new Date().toISOString(),
        title: smallAllDestroyed ? '🚨 تم تدمير أسطولك ومينائك بالكامل!' : '🚀 استهداف سفينتك بصاروخ صغير!',
        log: [
          `🚀 قام القبطان @${username} باستهداف سفينتك (${targetShip.name || 'سفينة الأسطول'}) بصاروخ صغير ملحقاً ضرر ${smallDealtDamage.toLocaleString()} من الطاقة!`,
          smallAllDestroyed ? `🔥 دُمرت جميع سفن أسطولك وأصبح الميناء محترقاً ومدمراً بالكامل!` : `⚠️ قم بصيانة وإصلاح أضرار هيكل السفينة فوراً.`
        ]
      };

      void createHarborEvent(targetDocId, 'ROCKET_SMALL', {
        damage: smallDealtDamage,
        targetShipId: resolvedTargetShipId,
        targetShipIndex: resolvedTargetIdx,
        targetX: targetLeft,
        targetY: targetTop,
        targetName: targetSnapshot.username || '',
        targetEmail: targetSnapshot.email || '',
        allDestroyed: smallAllDestroyed,
        newReport
      });
    }

    const targetIdxForState = targetShip?.id ? baseShips.findIndex((s: any) => s.id === targetShip.id) : 0;
    const resolvedIdxForState = targetIdxForState >= 0 ? targetIdxForState : 0;
    const resolvedShipIdForState = baseShips[resolvedIdxForState]?.id || targetShip?.id;

    setTimeout(() => {
      setIsSmallRocketActive(false);
      setShowSmallRocketExplosion(true);
      setIsShaking(true);
      setRocketXpText('XP +100');
      setShowRocketXp(true);

      playSmallRocketExplosionSound();

      if (targetDocId) {
        setLastRocketDamage(smallDealtDamage || 1000);

        setInspectedPlayer((prev: any) => prev && getTargetDefenderId(prev) === targetDocId
          ? applyWeaponDamageToPlayerState(prev, flatDamage, resolvedShipIdForState, resolvedIdxForState, false)
          : prev
        );

        setRealPlayers(prev => prev.map(p => {
          if (getTargetDefenderId(p) === targetDocId || p.id === targetDocId || p.userId === targetDocId) {
            return applyWeaponDamageToPlayerState(p, flatDamage, resolvedShipIdForState, resolvedIdxForState, false);
          }
          return p;
        }));
      }

      sendSecureChatMessage(
        'القوات الصاروخية 🚀',
        '🚀',
        `🚀 صاروخ صغير! قصف القبطان @${username} سفينة القبطان @${targetSnapshot.username} وألحق بها ضرر ${(smallDealtDamage || flatDamage).toLocaleString()} من الطاقة!`
      );

      showToast(`💥 تم إطلاق الصاروخ الصغير وإصابة السفينة بضرر ${(smallDealtDamage || flatDamage).toLocaleString()} من الطاقة!`, "success");

      setTimeout(() => {
        setIsShaking(false);
      }, 450);

      setTimeout(() => {
        setShowRocketXp(false);
      }, 2800);
    }, 750);
  };

  const handleLaunchMediumRocket = (targetShipOverride?: any) => {
    if (!inspectedPlayer) return;

    const validation = validateAttackOrSteal();
    if (!validation.allowed) {
      alert(validation.message);
      showToast(validation.message, 'error');
      return;
    }

    const targetSnapshot = inspectedPlayer;
    const targetDocId = getTargetDefenderId(targetSnapshot);
    if (!targetDocId || targetDocId.startsWith('rival_')) {
      showToast('⚠️ تعذر إرسال الهجوم: حساب الهدف غير مرتبط بمعرف فعّال.', 'error');
      return;
    }
    if (auth.currentUser && targetDocId === auth.currentUser.uid) {
      showToast('لا يمكنك استهداف مينائك الخاص!', 'error');
      return;
    }

    setSelectedVisitedShip(null);
    setShowWeaponSelector(false);

    const baseShips = (targetSnapshot.ships && Array.isArray(targetSnapshot.ships) && targetSnapshot.ships.length > 0)
      ? targetSnapshot.ships
      : getInspectedPlayerShips(targetSnapshot);
    const targetShip = targetShipOverride || selectedVisitedShip || baseShips.find((s: any) => s.exists !== false && (typeof s.heart !== 'number' || s.heart > 0)) || baseShips[0];

    let targetLeft = '45%';
    let targetTop = '49%';
    if (targetShip) {
      if (targetShip.left && targetShip.top) {
        targetLeft = targetShip.left;
        targetTop = targetShip.top;
      } else {
        const idx = baseShips.findIndex((s: any) => s.id === targetShip.id);
        const dockKey = `s${targetShip.id || (idx >= 0 ? idx + 1 : 1)}`;
        const fallbackPos = docks[dockKey] || docks[`s${(idx >= 0 ? idx + 1 : 1)}`] || { l: '45%', t: '49%' };
        targetLeft = fallbackPos.l;
        targetTop = fallbackPos.t;
      }
    }

    setRocketTargetPos({ l: targetLeft, t: targetTop });
    playMediumRocketIncomingSound();
    setIsMediumRocketActive(true);

    setWeapons(prev => {
      const curQty = prev.mediumRocket !== undefined ? prev.mediumRocket : (prev.medium_missile ?? 0);
      const nextQty = Math.max(0, curQty - 1);
      const updated = {
        ...prev,
        mediumRocket: nextQty,
        ...(prev.medium_missile !== undefined ? { medium_missile: nextQty } : {})
      };
      localStorage.setItem('pirate_weapons', JSON.stringify(updated));
      return updated;
    });

    const flatDamage = 5000;
    let medUpdatedShips: any[] | null = null;
    let medAllDestroyed = false;
    let medDealtDamage = 0;

    if (targetShip && targetDocId) {
      const targetIdx = targetShip.id ? baseShips.findIndex((s: any) => s.id === targetShip.id) : 0;
      const resolvedTargetIdx = targetIdx >= 0 ? targetIdx : 0;
      const resolvedTargetShipId = baseShips[resolvedTargetIdx]?.id || targetShip.id;
      const computedShips = baseShips.map((s: any, idx: number) => {
        const normalized = normalizeShipEnergyToCargo(s, targetSnapshot.portDestroyed);
        if (idx === resolvedTargetIdx) {
          const maxH = getShipMaxHeart(normalized);
          const dmg = flatDamage;
          medDealtDamage = dmg;
          const currentHeart = typeof normalized.heart === 'number' ? Math.min(normalized.heart, maxH) : maxH;
          const newHeart = Math.max(0, currentHeart - dmg);
          return { ...normalized, maxHeart: maxH, heart: newHeart, energySyncedToCargo: true, ...(newHeart <= 0 ? { moving: false, status: 'docked' } : {}) };
        }
        return normalized;
      });
      medUpdatedShips = computedShips;

      const activeUpdatedShips = computedShips.filter((s: any) => s.exists !== false);
      medAllDestroyed = activeUpdatedShips.length > 0 && activeUpdatedShips.every((s: any) => typeof s.heart === 'number' && s.heart <= 0);

      const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const newReport = {
        id: `rocket_med_${Date.now()}`,
        opponent: username,
        opponentName: username,
        opponentAvatar: avatar || '☠️',
        type: 'defense',
        result: 'defeat',
        isVictory: false,
        goldChange: 0,
        time: nowTime,
        date: new Date().toISOString(),
        title: medAllDestroyed ? '🚨 تم تدمير أسطولك ومينائك بالكامل!' : '🚀 استهداف سفينتك بصاروخ متوسط!',
        log: [
          `🚀 قام القبطان @${username} باستهداف سفينتك (${targetShip.name || 'سفينة الأسطول'}) بصاروخ متوسط ملحقاً ضرر ${medDealtDamage.toLocaleString()} من الطاقة!`,
          medAllDestroyed ? `🔥 دُمرت جميع سفن أسطولك وأصبح الميناء محترقاً ومدمراً بالكامل!` : `⚠️ قم بصيانة وإصلاح أضرار هيكل السفينة فوراً.`
        ]
      };

      void createHarborEvent(targetDocId, 'ROCKET_MEDIUM', {
        damage: medDealtDamage,
        targetShipId: resolvedTargetShipId,
        targetShipIndex: resolvedTargetIdx,
        targetX: targetLeft,
        targetY: targetTop,
        targetName: targetSnapshot.username || '',
        targetEmail: targetSnapshot.email || '',
        allDestroyed: medAllDestroyed,
        newReport
      });
    }

    const medTargetIdx = targetShip?.id ? baseShips.findIndex((s: any) => s.id === targetShip.id) : 0;
    const medResolvedIdx = medTargetIdx >= 0 ? medTargetIdx : 0;
    const medResolvedShipId = baseShips[medResolvedIdx]?.id || targetShip?.id;

    setTimeout(() => {
      setIsMediumRocketActive(false);
      setShowMediumRocketExplosion(true);
      setIsShaking(true);
      setRocketXpText('XP +1,000');
      setShowRocketXp(true);

      playMediumRocketExplosionSound();

      if (targetDocId) {
        setLastRocketDamage(medDealtDamage || 5000);

        setInspectedPlayer((prev: any) => prev && getTargetDefenderId(prev) === targetDocId
          ? applyWeaponDamageToPlayerState(prev, flatDamage, medResolvedShipId, medResolvedIdx, false)
          : prev
        );

        setRealPlayers(prev => prev.map(p => {
          if (getTargetDefenderId(p) === targetDocId || p.id === targetDocId || p.userId === targetDocId) {
            return applyWeaponDamageToPlayerState(p, flatDamage, medResolvedShipId, medResolvedIdx, false);
          }
          return p;
        }));
      }

      sendSecureChatMessage(
        'القوات الصاروخية 🚀',
        '🚀',
        `🚀 صاروخ متوسط! قصف القبطان @${username} سفينة القبطان @${targetSnapshot.username} وألحق بها ضرر ${(medDealtDamage || flatDamage).toLocaleString()} من الطاقة!`
      );

      showToast(`💥 تم إطلاق الصاروخ المتوسط وإصابة السفينة بضرر ${(medDealtDamage || flatDamage).toLocaleString()} من الطاقة!`, "success");

      setTimeout(() => {
        setIsShaking(false);
      }, 500);

      setTimeout(() => {
        setShowRocketXp(false);
      }, 2800);
    }, 900);
  };

  const handleLaunchLargeRocket = (targetShipOverride?: any) => {
    if (!inspectedPlayer) return;

    const validation = validateAttackOrSteal();
    if (!validation.allowed) {
      alert(validation.message);
      showToast(validation.message, 'error');
      return;
    }

    const targetSnapshot = inspectedPlayer;
    const targetDocId = getTargetDefenderId(targetSnapshot);
    if (!targetDocId || targetDocId.startsWith('rival_')) {
      showToast('⚠️ تعذر إرسال الهجوم: حساب الهدف غير مرتبط بمعرف فعّال.', 'error');
      return;
    }
    if (auth.currentUser && targetDocId === auth.currentUser.uid) {
      showToast('لا يمكنك استهداف مينائك الخاص!', 'error');
      return;
    }

    setSelectedVisitedShip(null);
    setShowWeaponSelector(false);

    const baseShips = (targetSnapshot.ships && Array.isArray(targetSnapshot.ships) && targetSnapshot.ships.length > 0)
      ? targetSnapshot.ships
      : getInspectedPlayerShips(targetSnapshot);
    const targetShip = targetShipOverride || selectedVisitedShip || baseShips.find((s: any) => s.exists !== false && (typeof s.heart !== 'number' || s.heart > 0)) || baseShips[0];

    let targetLeft = '45%';
    let targetTop = '49%';
    if (targetShip) {
      if (targetShip.left && targetShip.top) {
        targetLeft = targetShip.left;
        targetTop = targetShip.top;
      } else {
        const idx = baseShips.findIndex((s: any) => s.id === targetShip.id);
        const dockKey = `s${targetShip.id || (idx >= 0 ? idx + 1 : 1)}`;
        const fallbackPos = docks[dockKey] || docks[`s${(idx >= 0 ? idx + 1 : 1)}`] || { l: '45%', t: '49%' };
        targetLeft = fallbackPos.l;
        targetTop = fallbackPos.t;
      }
    }

    setRocketTargetPos({ l: targetLeft, t: targetTop });
    playLargeRocketIncomingSound();
    setIsLargeRocketActive(true);

    setWeapons(prev => {
      const curQty = prev.largeRocket !== undefined ? prev.largeRocket : (prev.large_missile ?? 0);
      const nextQty = Math.max(0, curQty - 1);
      const updated = {
        ...prev,
        largeRocket: nextQty,
        ...(prev.large_missile !== undefined ? { large_missile: nextQty } : {})
      };
      localStorage.setItem('pirate_weapons', JSON.stringify(updated));
      return updated;
    });

    const flatDamage = 10000;
    let largeUpdatedShips: any[] | null = null;
    let largeAllDestroyed = false;
    let primaryDealtDamage = 0;

    if (targetShip && targetDocId) {
      const targetIdx = targetShip.id ? baseShips.findIndex((s: any) => s.id === targetShip.id) : 0;
      const resolvedTargetIdx = targetIdx >= 0 ? targetIdx : 0;
      const resolvedTargetShipId = baseShips[resolvedTargetIdx]?.id || targetShip.id;
      const computedShips = baseShips.map((s: any, idx: number) => {
        const normalized = normalizeShipEnergyToCargo(s, targetSnapshot.portDestroyed);
        if (idx === resolvedTargetIdx) {
          const maxH = getShipMaxHeart(normalized);
          const dmg = flatDamage;
          primaryDealtDamage = dmg;
          const currentHeart = typeof normalized.heart === 'number' ? Math.min(normalized.heart, maxH) : maxH;
          const newHeart = Math.max(0, currentHeart - dmg);
          return {
            ...normalized,
            maxHeart: maxH,
            heart: newHeart,
            energySyncedToCargo: true,
            ...(newHeart <= 0 ? { moving: false, status: 'docked' } : {})
          };
        }
        return normalized;
      });
      largeUpdatedShips = computedShips;

      const activeUpdatedShips = computedShips.filter((s: any) => s.exists !== false);
      largeAllDestroyed = activeUpdatedShips.length > 0 && activeUpdatedShips.every((s: any) => typeof s.heart === 'number' && s.heart <= 0);

      const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const newReport = {
        id: `rocket_large_${Date.now()}`,
        opponent: username,
        opponentName: username,
        opponentAvatar: avatar || '☠️',
        type: 'defense',
        result: 'defeat',
        isVictory: false,
        goldChange: 0,
        time: nowTime,
        date: new Date().toISOString(),
        title: largeAllDestroyed ? '🚨 تم تدمير أسطولك ومينائك بالكامل!' : '🚀 قصف صاروخي فتاك على سفينتك!',
        log: [
          `🚀 قصف القبطان @${username} سفينتك (${targetShip.name || 'سفينة الأسطول'}) بصاروخ كبير مدمّر ملحقاً ضرر ${primaryDealtDamage.toLocaleString()} من الطاقة!`,
          largeAllDestroyed ? `🔥 دُمرت جميع سفن أسطولك بالكامل وأصبح الميناء محترقاً ومدمراً!` : `⚠️ تعرضت السفينة المستهدفة لأضرار جسيمة، توجه للصيانة والإصلاح فوراً.`
        ]
      };

      void createHarborEvent(targetDocId, 'ROCKET_LARGE', {
        damage: primaryDealtDamage,
        targetShipId: resolvedTargetShipId,
        targetShipIndex: resolvedTargetIdx,
        targetX: targetLeft,
        targetY: targetTop,
        targetName: targetSnapshot.username || '',
        targetEmail: targetSnapshot.email || '',
        allDestroyed: largeAllDestroyed,
        newReport
      });
    }

    const largeTargetIdx = targetShip?.id ? baseShips.findIndex((s: any) => s.id === targetShip.id) : 0;
    const largeResolvedIdx = largeTargetIdx >= 0 ? largeTargetIdx : 0;
    const largeResolvedShipId = baseShips[largeResolvedIdx]?.id || targetShip?.id;

    setTimeout(() => {
      setIsLargeRocketActive(false);
      setShowLargeRocketExplosion(true);
      setIsShaking(true);
      setRocketXpText('XP +1,200');
      setShowRocketXp(true);

      playLargeRocketExplosionSound();

      if (targetDocId) {
        setLastRocketDamage(primaryDealtDamage || 10000);

        setInspectedPlayer((prev: any) => prev && getTargetDefenderId(prev) === targetDocId
          ? applyWeaponDamageToPlayerState(prev, flatDamage, largeResolvedShipId, largeResolvedIdx, false)
          : prev
        );

        setRealPlayers(prev => prev.map(p => {
          if (getTargetDefenderId(p) === targetDocId || p.id === targetDocId || p.userId === targetDocId) {
            return applyWeaponDamageToPlayerState(p, flatDamage, largeResolvedShipId, largeResolvedIdx, false);
          }
          return p;
        }));
      }

      sendSecureChatMessage(
        'القوات الصاروخية 🚀',
        '🚀',
        `🚀 صاروخ كبير فتاك! قصف القبطان @${username} سفينة القبطان @${targetSnapshot.username} وألحق بها ضرر ${(primaryDealtDamage || flatDamage).toLocaleString()} من الطاقة!`
      );

      showToast(`💥 تم إطلاق الصاروخ الكبير وإصابة السفينة المحددة بضرر ${(primaryDealtDamage || flatDamage).toLocaleString()} من الطاقة!`, "success");

      setTimeout(() => {
        setIsShaking(false);
      }, 650);

      setTimeout(() => {
        setShowRocketXp(false);
      }, 2800);
    }, 1200);

    setTimeout(() => {
      setShowLargeRocketExplosion(false);
    }, 2800);
  };

  const handleDisableDefense = async (type: 'rocket' | 'nuke' | 'ad') => {
    if (!inspectedPlayer) return;

    const targetSnapshot = inspectedPlayer;
    const targetDocId = getTargetDefenderId(targetSnapshot);
    if (!targetDocId || targetDocId.startsWith('rival_')) {
      showToast('⚠️ تعذر إرسال السلاح: حساب الهدف غير مرتبط بمعرف فعّال.', 'error');
      return;
    }

    let weaponKey = '';
    let message = '';
    let weaponLabel = '';

    if (type === 'rocket') {
      weaponKey = 'antiRocketDisabler';
      weaponLabel = 'معطل مضاد الصواريخ';
      message = `⚠️ مضاد الصواريخ معطل\nعطلت مضاد الصواريخ لدى القبطان @${targetSnapshot.username} لمدة 10 دقائق.`;
    } else if (type === 'nuke') {
      weaponKey = 'antiNukeDisabler';
      weaponLabel = 'معطل مضاد القنبلة الذرية';
      message = `⚠️ مضاد القنبلة الذرية معطل\nعطلت مضاد القنبلة الذرية لدى القبطان @${targetSnapshot.username} لمدة 10 دقائق.`;
    } else if (type === 'ad') {
      weaponKey = 'antiAdDisabler';
      weaponLabel = 'معطل مضاد القنبلة الإعلانية';
      message = `⚠️ مضاد القنبلة الإعلانية معطل\nعطلت مضاد القنبلة الإعلانية لدى القبطان @${targetSnapshot.username} لمدة 10 دقائق.`;
    }

    setWeapons(prev => {
      const updated = {
        ...prev,
        [weaponKey]: Math.max(0, (prev[weaponKey] ?? 0) - 1)
      };
      localStorage.setItem('pirate_weapons', JSON.stringify(updated));
      return updated;
    });

    await createHarborEvent(targetDocId, 'DISABLE_DEFENSE', {
      defenseType: type,
      weaponLabel,
      targetName: targetSnapshot.username || '',
      targetEmail: targetSnapshot.email || ''
    });

    showToast(message.replace('\n', ' - '), 'success');
  };

  const handleLaunchAdBomb = async (selectedAdKey: string) => {
    if (!inspectedPlayer) return;

    const validation = validateAttackOrSteal();
    if (!validation.allowed) {
      alert(validation.message);
      showToast(validation.message, 'error');
      return;
    }

    const targetSnapshot = inspectedPlayer;
    const targetDocId = getTargetDefenderId(targetSnapshot);
    if (!targetDocId || targetDocId.startsWith('rival_')) {
      showToast('⚠️ تعذر إرسال الهجوم: حساب الهدف غير مرتبط بمعرف فعّال.', 'error');
      return;
    }
    if (auth.currentUser && targetDocId === auth.currentUser.uid) {
      showToast('لا يمكنك استهداف مينائك الخاص!', 'error');
      return;
    }

    setSelectedVisitedShip(null);
    setShowWeaponSelector(false);
    setShowAdSelectorModal(false);

    setWeapons(prev => {
      const curQty = prev.adBomb !== undefined ? prev.adBomb : (prev.emp_bomb ?? 0);
      const nextQty = Math.max(0, curQty - 1);
      const updated = {
        ...prev,
        adBomb: nextQty,
        ...(prev.emp_bomb !== undefined ? { emp_bomb: nextQty } : {})
      };
      localStorage.setItem('pirate_weapons', JSON.stringify(updated));
      return updated;
    });

    playAtomicBombDropSound();
    setShowSmokeExplosion(true);

    let adTitle = '';
    if (selectedAdKey === 'luffy_king') adTitle = '☠️ لوفي ملك القراصنة';
    else if (selectedAdKey === 'jack_sabro' || selectedAdKey === 'deep_dragon') adTitle = '🦎 تنين الأعماق';
    else if (selectedAdKey === 'luffy_grandeur') adTitle = '🔥 فخامة لوفي';
    else if (selectedAdKey === 'anf') adTitle = '👑 وإذا سطا خاف الأنام';

    const flatDamage = 20000;
    const baseShips = (targetSnapshot.ships && Array.isArray(targetSnapshot.ships) && targetSnapshot.ships.length > 0)
      ? targetSnapshot.ships
      : getInspectedPlayerShips(targetSnapshot);

    const updatedShips = baseShips.map((s: any) => {
      const normalized = normalizeShipEnergyToCargo(s, targetSnapshot.portDestroyed);
      const maxH = getShipMaxHeart(normalized);
      const dmg = flatDamage;
      const currentHeart = typeof normalized.heart === 'number' ? Math.min(normalized.heart, maxH) : maxH;
      const newHeart = Math.max(0, currentHeart - dmg);
      return {
        ...normalized,
        maxHeart: maxH,
        heart: newHeart,
        energySyncedToCargo: true,
        ...(newHeart <= 0 ? { moving: false, status: 'docked' } : {})
      };
    });

    const allDestroyed = updatedShips.length > 0 && updatedShips.every((s: any) => typeof s.heart === 'number' && s.heart <= 0);

    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const newReport = {
      id: `ad_bomb_${Date.now()}`,
      opponent: username,
      opponentName: username,
      opponentAvatar: avatar || '📡',
      type: 'defense',
      result: 'defeat',
      isVictory: false,
      goldChange: 0,
      time: nowTime,
      date: new Date().toISOString(),
      title: allDestroyed ? '🚨 رسالة التفجير: تم تدمير أسطولك ومينائك بالكامل!' : '📡 هجوم رسالة التفجير!',
      log: [
        `📡 قام القبطان @${username} بإطلاق رسالة التفجير [${adTitle}] على مينائك ملحقاً ضرر ${flatDamage.toLocaleString()} من طاقة كل سفينة!`,
        allDestroyed ? `🔥 دُمرت جميع سفن أسطولك بالكامل ودُمر الميناء وأصبح محترقاً ومشتعلاً!` : `⚠️ أصيبت سفن أسطولك بأضرار جسيمة، توجه للصيانة والترميم فوراً.`,
        `⚠️ توجه فوراً إلى الميناء واضغط على [إعادة إعمار الميناء وترميم الأسطول].`
      ]
    };

    if (targetDocId && db) {
      void createHarborEvent(targetDocId, 'AD_BOMB', {
        damage: flatDamage,
        allDestroyed,
        adKey: selectedAdKey,
        adTitle,
        targetName: targetSnapshot.username || '',
        targetEmail: targetSnapshot.email || '',
        newReport
      });
    }

    setTimeout(() => {
      setIsShaking(true);
      playMediaBombExplosionSound();

      if (targetDocId) {
        setInspectedPlayer((prev: any) => prev && getTargetDefenderId(prev) === targetDocId
          ? {
              ...applyWeaponDamageToPlayerState(prev, flatDamage, undefined, undefined, true),
              activeAd: selectedAdKey
            }
          : prev
        );

        setRealPlayers(prev => prev.map(p => {
          if (getTargetDefenderId(p) === targetDocId || p.id === targetDocId || p.userId === targetDocId) {
            return applyWeaponDamageToPlayerState(p, flatDamage, undefined, undefined, true);
          }
          return p;
        }));
      }
    }, 850);

    setTimeout(() => {
      setIsShaking(false);
    }, 1800);

    setTimeout(() => {
      setShowSmokeExplosion(false);
      playDetonationWarningVoiceAndSound();

      sendSecureChatMessage(
        'رسالة التفجير 📡',
        '📡',
        `📡 رسالة التفجير! أطلق القبطان @${username} رسالة التفجير [${adTitle}] على أسطول القبطان @${targetSnapshot.username} وأنقص ${flatDamage.toLocaleString()} من طاقة السفن!`
      );

      showToast(`💥 تم إطلاق رسالة التفجير وإنقاص ${flatDamage.toLocaleString()} من طاقة أسطول الخصم!`, "success");

      setPostDetonationModal({
        isOpen: true,
        targetDocId: targetDocId || '',
        targetPlayerName: targetSnapshot?.username || 'القبطان',
        targetPlayerAvatar: targetSnapshot?.avatar || '⚓',
        adTitle,
        allDestroyed
      });
      setDetonationCustomMessage('');
    }, 2150);
  };

  const handleSendDetonationMessage = async () => {
    if (!postDetonationModal || !detonationCustomMessage.trim()) return;
    const msgText = detonationCustomMessage.trim();
    setIsSendingDetonationMessage(true);

    try {
      const { targetDocId, targetPlayerName, adTitle } = postDetonationModal;

      await createHarborEvent(targetDocId, 'DETONATION_MESSAGE', {
        senderName: username || 'القبطان',
        senderAvatar: avatar || '📡',
        message: msgText,
        targetName: targetPlayerName,
        adTitle
      });

      await sendSecureChatMessage(
        username || 'القبطان',
        avatar || '📡',
        `📡 [رسالة تفجير موجهة إلى @${targetPlayerName}]: "${msgText}"`
      );

      showToast(`✉️ تم إرسال رسالتك للقبطان @${targetPlayerName} بنجاح!`, 'success');
      setDetonationCustomMessage('');
      setPostDetonationModal(null);
    } catch (err: any) {
      console.error("Error sending detonation message:", err);
      showToast("تعذر إرسال الرسالة: " + (err.message || ''), 'error');
    } finally {
      setIsSendingDetonationMessage(false);
    }
  };

  const handleLaunchAtomicBomb = async () => {
    if (!inspectedPlayer) return;

    const validation = validateAttackOrSteal();
    if (!validation.allowed) {
      alert(validation.message);
      showToast(validation.message, 'error');
      return;
    }

    const targetSnapshot = inspectedPlayer;
    const targetDocId = getTargetDefenderId(targetSnapshot);
    if (!targetDocId || targetDocId.startsWith('rival_')) {
      showToast('⚠️ تعذر إرسال الهجوم: حساب الهدف غير مرتبط بمعرف فعّال.', 'error');
      return;
    }
    if (auth.currentUser && targetDocId === auth.currentUser.uid) {
      showToast('لا يمكنك استهداف مينائك الخاص!', 'error');
      return;
    }

    setSelectedVisitedShip(null);
    setShowWeaponSelector(false);

    playAtomicBombDropSound();
    setIsAtomicBombActive(true);
    setShowAtomicBombXp(true);

    setWeapons(prev => {
      const curQty = prev.atomicBomb !== undefined ? prev.atomicBomb : (prev.nuke_bomb ?? 0);
      const nextQty = Math.max(0, curQty - 1);
      const updated = {
        ...prev,
        atomicBomb: nextQty,
        ...(prev.nuke_bomb !== undefined ? { nuke_bomb: nextQty } : {})
      };
      localStorage.setItem('pirate_weapons', JSON.stringify(updated));
      return updated;
    });

    const flatDamage = 70000;
    const baseShips = (targetSnapshot.ships && Array.isArray(targetSnapshot.ships) && targetSnapshot.ships.length > 0)
      ? targetSnapshot.ships
      : getInspectedPlayerShips(targetSnapshot);

    const updatedShips = baseShips.map((s: any) => {
      const normalized = normalizeShipEnergyToCargo(s, targetSnapshot.portDestroyed);
      const maxH = getShipMaxHeart(normalized);
      const dmg = flatDamage;
      const currentHeart = typeof normalized.heart === 'number' ? Math.min(normalized.heart, maxH) : maxH;
      const newHeart = Math.max(0, currentHeart - dmg);
      return {
        ...normalized,
        maxHeart: maxH,
        heart: newHeart,
        energySyncedToCargo: true,
        ...(newHeart <= 0 ? { moving: false, status: 'docked' } : {})
      };
    });

    const allDestroyed = updatedShips.length > 0 && updatedShips.every((s: any) => typeof s.heart === 'number' && s.heart <= 0);

    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const newReport = {
      id: `atomic_${Date.now()}`,
      opponent: username,
      opponentName: username,
      opponentAvatar: avatar || '💣',
      type: 'defense',
      result: 'defeat',
      isVictory: false,
      goldChange: 0,
      time: nowTime,
      date: new Date().toISOString(),
      title: allDestroyed ? '🚨 كارثة الموت الأسود: تم تدمير أسطولك ومينائك بالكامل!' : '💣 قصف بقنبلة الموت الأسود!',
      log: [
        `💣 شن القبطان @${username} هجوماً فتاكاً بقنبلة الموت الأسود على مينائك ملحقاً ضرر ${flatDamage.toLocaleString()} من طاقة كل سفينة!`,
        allDestroyed ? `🔥 دُمرت جميع سفن أسطولك بالكامل وغرقت في المياه وأصبح الميناء محترقاً ومدمراً!` : `⚠️ تعرضت سفن الأسطول لأضرار جسيمة للغاية، توجه للصيانة وترميم الهيكل فوراً.`,
        `⚠️ اضغط على زر [إعادة إعمار الميناء وترميم الأسطول] لإصلاح الأضرار واستعادة أسطولك.`
      ]
    };

    if (targetDocId && db) {
      void createHarborEvent(targetDocId, 'ATOMIC_BOMB', {
        damage: flatDamage,
        allDestroyed,
        targetName: targetSnapshot.username || '',
        targetEmail: targetSnapshot.email || '',
        newReport
      });
    }

    setTimeout(() => {
      setIsShaking(true);
      playAtomicBombExplosionSound();
      setExp(prev => prev + 2500);

      if (targetDocId) {
        setInspectedPlayer((prev: any) => prev && getTargetDefenderId(prev) === targetDocId
          ? applyWeaponDamageToPlayerState(prev, flatDamage, undefined, undefined, true)
          : prev
        );

        setRealPlayers(prev => prev.map(p => {
          if (getTargetDefenderId(p) === targetDocId || p.id === targetDocId || p.userId === targetDocId) {
            return applyWeaponDamageToPlayerState(p, flatDamage, undefined, undefined, true);
          }
          return p;
        }));
      }

      sendSecureChatMessage(
        'قنبلة الموت الأسود 💣',
        '💣',
        `💣 قنبلة الموت الأسود! أطلق القبطان مباغتاً @${username} قنبلة الموت الأسود الفتاكة على ميناء القبطان @${targetSnapshot.username} وأنقص ${flatDamage.toLocaleString()} من طاقة جميع سفن الأسطول!`
      );

      showToast(`💥 تم إطلاق قنبلة الموت الأسود وإنقاص ${flatDamage.toLocaleString()} من طاقة أسطول الخصم!`, "success");

      setTimeout(() => {
        setIsShaking(false);
      }, 950);

      setTimeout(() => {
        setShowAtomicBombXp(false);
      }, 2800);
    }, 1350);

    setTimeout(() => {
      setIsAtomicBombActive(false);
      setShowAtomicExplosion(false);
    }, 4900);

    setTimeout(() => {
      setGainedXpAnim(false);
    }, 5000);

    setTimeout(() => {
      setSelectedLootCard(null);
      setLootResultText('');
    }, 3500);
  };

  const handleOpenProfile = async (player: any) => {
    setIsProfileLoading(true);
    const resolvedId = getTargetDefenderId(player);
    let freshPlayer = realPlayers.find(p => p.id === resolvedId || p.userId === resolvedId || p.userId === player?.userId || p.id === player?.id) || player;

    const targetDocId = resolvedId || player?.id || player?.userId;
    if (targetDocId && db) {
      try {
        const snap = await getDoc(doc(db, 'users', targetDocId));
        if (snap.exists()) {
          const d = snap.data();
          freshPlayer = {
            ...freshPlayer,
            id: snap.id,
            userId: d.userId || snap.id,
            email: (d.email || freshPlayer.email || '').toLowerCase().trim(),
            migratedFromUid: d.migratedFromUid || freshPlayer.migratedFromUid || '',
            username: d.username || freshPlayer.username,
            avatar: d.avatar || freshPlayer.avatar,
            gold: typeof d.gold === 'number' ? d.gold : (freshPlayer.gold || 0),
            gems: typeof d.gems === 'number' ? d.gems : (freshPlayer.gems || 0),
            redGems: typeof d.redGems === 'number' ? d.redGems : (freshPlayer.redGems || 0),
            exp: typeof d.exp === 'number' ? d.exp : (freshPlayer.exp || 0),
            ships: Array.isArray(d.ships) && d.ships.length > 0 ? d.ships : (freshPlayer.ships || []),
            shipTowerLevel: typeof d.shipTowerLevel === 'number' ? d.shipTowerLevel : (freshPlayer.shipTowerLevel || 1),
            fishStorageLevel: typeof d.fishStorageLevel === 'number' ? d.fishStorageLevel : (freshPlayer.fishStorageLevel || 1),
            portDestroyed: !!d.portDestroyed,
            crewServices: d.crewServices || freshPlayer.crewServices || {},
            fishInventory: d.fishInventory || freshPlayer.fishInventory || {},
            server: d.server || freshPlayer.server || 'سيرفر الأسطورة 1',
            pirateClass: d.pirateClass || freshPlayer.pirateClass || 'صياد البحار',
            tribeId: d.tribeId || freshPlayer.tribeId || '',
            tribeName: d.tribeName || freshPlayer.tribeName || '',
            updatedAt: d.updatedAt || new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn("Could not fetch fresh user profile snapshot directly, falling back to cache:", err);
      }
    }

    setInspectedPlayer(freshPlayer);
    setTimeout(() => {
      setIsProfileLoading(false);
    }, 400);
  };

  // --- Revenge & Counter-Attack Logic (نظام رد الهجوم والانتقام الفوري في محيط المهاجم) ---
  const handleRevenge = async (attackerName: string, attackId?: string, attackerIdOverride?: string) => {
    // 1. Mark as avenged in attack logs
    setAttackLogs(prev => {
      const updated = prev.map(a =>
        (attackId && a.id === attackId) || a.attackerName === attackerName
          ? { ...a, isAvenged: true }
          : a
      );
      try { localStorage.setItem('pirate_attack_logs', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 2. Close modal & dismiss banner
    setShowWarLogModal(false);
    handleDismissNotification();
    setIncomingAttackAlert(null);

    // 3. Find attacker's real profile using canonical UID first, then normalized username + Firestore lookup
    const resolvedAttackerId = resolveCanonicalUid(attackerIdOverride);
    const cleanAttacker = (attackerName || '').trim().toLowerCase();
    let target = resolvedAttackerId
      ? realPlayers.find(p => p.id === resolvedAttackerId || p.userId === resolvedAttackerId)
      : undefined;

    if (!target && resolvedAttackerId && db) {
      try {
        const directSnap = await getDoc(doc(db, 'users', resolvedAttackerId));
        if (directSnap.exists()) {
          const d = directSnap.data();
          target = { id: directSnap.id, userId: d.userId || directSnap.id, ...d };
        }
      } catch {}
    }

    if (!target && cleanAttacker) {
      target = realPlayers.find(
        p =>
          (p.username || '').trim().toLowerCase() === cleanAttacker ||
          (p.displayName || '').trim().toLowerCase() === cleanAttacker ||
          normalizeString(p.username) === normalizeString(attackerName)
      );
    }

    if (!target && attackerName && db) {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('username', '==', attackerName.trim()), limit(1)));
        if (!snap.empty) {
          const dSnap = snap.docs[0];
          const d = dSnap.data();
          const canonicalId = resolveCanonicalUid(dSnap.id);
          if (canonicalId && canonicalId !== dSnap.id) {
            const cSnap = await getDoc(doc(db, 'users', canonicalId)).catch(() => null);
            if (cSnap && cSnap.exists()) {
              target = { id: cSnap.id, userId: cSnap.id, ...cSnap.data() };
            }
          }
          if (!target) {
            target = { id: dSnap.id, userId: d.userId || dSnap.id, ...d };
          }
        }
      } catch {}
    }

    if (!target) {
      showToast(`⚠️ تعذر العثور على ميناء القبطان @${attackerName} حالياً لرد الهجوم.`, 'error');
      return;
    }

    // 4. Open their profile and ocean directly in visit / attack mode
    setActiveTab('harbor');
    setIsProfileLoading(true);
    setInspectedPlayer(target);
    setTimeout(() => {
      setIsProfileLoading(false);
      setInspectedPlayerShipVisit(true);
      showToast(`⚔️ تم الانتقال فوراً إلى محيط @${target.username || attackerName}! اقصف سفنه بالصواريخ والأسلحة الآن للانتقام لمينائك! 💥`, 'success');
    }, 350);
  };

  // --- Claim Support Gifts Logic (استلام الطواقم والصناديق الأسطورية) ---
  const handleClaimGift = (gift: SupportGiftItem) => {
    setSupportGifts(prev => {
      const updated = prev.map(g => g.id === gift.id ? { ...g, claimed: true } : g);
      try { localStorage.setItem('pirate_support_gifts', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (gift.rewards.gold) {
      setGold(prev => prev + gift.rewards.gold!);
    }
    if (gift.rewards.gems) {
      setGems(prev => prev + gift.rewards.gems!);
    }
    if (gift.rewards.shipHeal) {
      setShips(prev => prev.map(s => ({
        ...s,
        heart: Math.min((s.maxHeart || 16000), (s.heart || 1000) + gift.rewards.shipHeal!)
      })));
    }
    if (gift.rewards.crewPower) {
      setExp(prev => prev + gift.rewards.crewPower! * 2);
    }

    showToast(`🎉 تم استلام ${gift.title} بنجاح وإضافته لمينائك!`, 'success');
  };

  // --- Clear / Purge Logs (تفريغ سجلات المعارك القديمة) ---
  const handleClearLogs = () => {
    setAttackLogs([]);
    setSupportGifts([]);
    setBattleReports([]);
    try {
      localStorage.removeItem('pirate_attack_logs');
      localStorage.removeItem('pirate_support_gifts');
      localStorage.removeItem('pirate_battle_reports');
    } catch {}
    showToast('تم مسح وتفريغ السجلات بنجاح!', 'success');
  };

  const getDestroyedShipStyles = (shipId: string | number) => {
    const idStr = String(shipId);
    if (idStr.endsWith('1') || idStr === 's1') {
      return {
        transform: 'rotate(-32deg) translateY(38px)',
        statusLabel: 'مدمّرة بالكامل 🔥',
        flames: [
          { top: '10%', left: '20%', size: '30px', anim: 'bounce 0.8s infinite alternate' },
          { top: '35%', left: '60%', size: '20px', anim: 'pulse 0.7s infinite alternate' }
        ]
      };
    } else if (idStr.endsWith('2') || idStr === 's2') {
      return {
        transform: 'rotate(58deg) translateY(48px)',
        statusLabel: 'غارقة جزئياً 🌊',
        flames: [
          { top: '20%', left: '50%', size: '36px', anim: 'pulse 0.9s infinite alternate' },
          { top: '5%', left: '30%', size: '18px', anim: 'bounce 0.6s infinite alternate' }
        ]
      };
    } else {
      return {
        transform: 'rotate(-18deg) translateY(28px)',
        statusLabel: 'حطام محترق 💀',
        flames: [
          { top: '15%', left: '40%', size: '32px', anim: 'bounce 0.7s infinite alternate' },
          { top: '40%', left: '15%', size: '22px', anim: 'pulse 0.5s infinite alternate' }
        ]
      };
    }
  };

  const getInspectedPlayerShips = (player: any) => {
    if (!player) return [];
    
    // If the inspected player is the current logged-in user, always use the active local ships state
    if (auth.currentUser && player.userId === auth.currentUser.uid) {
      return ships;
    }
    
    // Return their real ships exactly as stored in Firestore if they have any
    if (player.ships && Array.isArray(player.ships) && player.ships.length > 0) {
      return player.ships.map((s: any) => {
        let shipLevel = 0;
        if (typeof s.level === 'number' && !isNaN(s.level)) {
          shipLevel = s.level;
        } else if (s.name) {
          const legacyLvl = LEGACY_SHIP_LEVEL_BY_NAME[s.name];
          const specByName = SHOP_SHIPS.find(spec => spec.name === s.name);
          if (legacyLvl !== undefined) shipLevel = legacyLvl;
          else if (specByName) shipLevel = specByName.level;
        }
        if (shipLevel === 31) shipLevel = 30;
        const spec = SHOP_SHIPS.find(spec => spec.level === shipLevel) || SHOP_SHIPS[0];

        return normalizeShipEnergyToCargo({
          ...s,
          name: (shipLevel >= 1 && shipLevel <= 30) ? spec.name : (s.name || spec.name),
          level: shipLevel,
          hook: s.hook || spec.hook,
          cargo: s.cargo || getShipCapacity(shipLevel),
          heart: s.heart !== undefined ? s.heart : spec.heart,
          durationStr: (shipLevel >= 1 && shipLevel <= 30) ? spec.durationStr : (s.durationStr || spec.durationStr),
          power: s.power || spec.power,
          armor: s.armor || spec.armor,
          fishTypes: ((shipLevel >= 1 && shipLevel <= 30) || (shipLevel >= 32 && shipLevel <= 37)) ? spec.fishTypes : (s.fishTypes || spec.fishTypes),
          imgEmoji: s.imgEmoji || spec.emoji,
          exists: s.exists !== false
        }, Boolean(player.portDestroyed));
      });
    }

    // Default starter ships fallback so their ocean is never empty/mock
    return [
      { id: 's1', name: 'قارب خشبي متهالك', status: 'docked', left: '27%', top: '41%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
      { id: 's2', name: 'قارب خشبي متهالك', status: 'docked', left: '26%', top: '51%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' },
      { id: 's3', name: 'قارب خشبي متهالك', status: 'docked', left: '28%', top: '61%', scaleX: 1, moving: false, exists: true, crewPower: 0, hasNetUpgrade: false, hasEngineUpgrade: false, level: 0, hook: 25, cargo: 2000, heart: 2000, maxHeart: 2000, energySyncedToCargo: true, durationStr: '00:30', power: 5, armor: 5, fishTypes: ['سردين', 'أنشوجة'], imgEmoji: '🛶' }
    ];
  };

  // --- Chat Messages ---
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- Selection and Overlay states ---
  const [currentShipId, setCurrentShipId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    shipId: string;
    status: 'docked' | 'fishing';
  }>({
    visible: false,
    x: 0,
    y: 0,
    shipId: '',
    status: 'docked'
  });

  const [confirmModal, setConfirmModal] = useState(false);
  const [repairModalShip, setRepairModalShip] = useState<ShipState | null>(null);
  const shipMenuRef = useRef<HTMLDivElement>(null);
  const [timerNow, setTimerNow] = useState<number>(() => Date.now());
  const notifiedReadyShipsRef = useRef<Set<string>>(new Set());
  const [rewardModal, setRewardModal] = useState(false);
  const [questsExpanded, setQuestsExpanded] = useState(true);
  const [rewardFish, setRewardFish] = useState<{ name: string; amount: number; value: number; luckDoubled?: boolean; guided?: boolean; shipLevel?: number }>({ name: 'أنشوجة', amount: 80, value: 120 });
  const [crewModal, setCrewModal] = useState(false);
  const [expectedFishModalShipId, setExpectedFishModalShipId] = useState<string | null>(null);
  const [shipDetailsModalShipId, setShipDetailsModalShipId] = useState<string | null>(null);
  const [crewTab, setCrewTab] = useState<'sailors' | 'special'>('sailors');
  const [activeReport, setActiveReport] = useState<BattleReport | null>(null);

  const setShipExpectedFish = (shipId: string, fishName: string) => {
    setShips(prev => {
      const updated = prev.map(s => {
        if (s.id === shipId) {
          return {
            ...s,
            expectedFish: fishName
          };
        }
        return s;
      });
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
      return updated;
    });
    showToast(`🧭 تم توجيه المرشد لتوقع وصيد [${fishName}] بنجاح!`, 'success');
  };

  // --- Warehouses & Tower ---
  const [fishStorageLevel, setFishStorageLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('fish_storage_level') || '1');
  });
  const [shipTowerLevel, setShipTowerLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('ship_tower_level') || '1');
  });
  const [fishStorageModal, setFishStorageModal] = useState<boolean>(false);
  const [fishInventory, setFishInventory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('pirate_fish_inventory');
    if (saved) return JSON.parse(saved);
    return {
      'أنشوجة المياه الدافئة 🐟': 15,
      'سردين ملوك الأعماق 🐟': 8,
    };
  });

  // --- Weapons and Red Gems States (Shabek 360 Shop) ---
  const [redGems, setRedGems] = useState<number>(() => {
    return parseInt(localStorage.getItem('pirate_red_gems') || '2450');
  });
  const [weapons, setWeapons] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('pirate_weapons');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      smallRocket: parsed.smallRocket !== undefined ? parsed.smallRocket : 320,
      mediumRocket: parsed.mediumRocket !== undefined ? parsed.mediumRocket : 902,
      largeRocket: parsed.largeRocket !== undefined ? parsed.largeRocket : 6435,
      atomicBomb: parsed.atomicBomb !== undefined ? parsed.atomicBomb : 795,
      adBomb: parsed.adBomb !== undefined ? parsed.adBomb : 101,
      antiRocketDisabler: parsed.antiRocketDisabler !== undefined ? parsed.antiRocketDisabler : 6,
      antiNukeDisabler: parsed.antiNukeDisabler !== undefined ? parsed.antiNukeDisabler : 6,
      antiAdDisabler: parsed.antiAdDisabler !== undefined ? parsed.antiAdDisabler : 7,
      smallRepair: parsed.smallRepair !== undefined ? parsed.smallRepair : 2,
      mediumRepair: parsed.mediumRepair !== undefined ? parsed.mediumRepair : 0,
      largeRepair: parsed.largeRepair !== undefined ? parsed.largeRepair : 0,
      legendaryRepair: parsed.legendaryRepair !== undefined ? parsed.legendaryRepair : 0,
    };
  });

  // --- Audio Settings ---
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(() => {
    const saved = localStorage.getItem('pirate_music_muted');
    return saved !== null ? saved === 'true' : false;
  });
  const [isSfxMuted, setIsSfxMuted] = useState(() => {
    const saved = localStorage.getItem('pirate_sfx_muted');
    return saved !== null ? saved === 'true' : false;
  });

  // --- Graphics & Visual Settings ---
  const [lowGraphics, setLowGraphics] = useState(() => {
    const saved = localStorage.getItem('pirate_low_graphics');
    return saved !== null ? saved === 'true' : false;
  });

  // --- Customized Settings Menu States ---
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('pirate_language') || 'ar';
  });
  const [showDeathBanners, setShowDeathBanners] = useState(() => {
    const saved = localStorage.getItem('pirate_show_death_banners');
    return saved !== null ? saved === 'true' : true;
  });
  const [showAttackNotifications, setShowAttackNotifications] = useState(() => {
    const saved = localStorage.getItem('pirate_show_attack_notifications');
    return saved !== null ? saved === 'true' : true;
  });
  const [showChestNotifications, setShowChestNotifications] = useState(() => {
    const saved = localStorage.getItem('pirate_show_chest_notifications');
    return saved !== null ? saved === 'true' : true;
  });
  const [showPopupAlerts, setShowPopupAlerts] = useState(() => {
    const saved = localStorage.getItem('pirate_show_popup_alerts');
    return saved !== null ? saved === 'true' : true;
  });
  const [disableAnimatedBackground, setDisableAnimatedBackground] = useState(() => {
    const saved = localStorage.getItem('pirate_disable_animated_bg');
    return saved !== null ? saved === 'true' : false;
  });
  const [powerSaver, setPowerSaver] = useState(() => {
    const saved = localStorage.getItem('pirate_power_saver');
    return saved !== null ? saved === 'true' : false;
  });
  const [showSoundTones, setShowSoundTones] = useState(() => {
    const saved = localStorage.getItem('pirate_show_sound_tones');
    return saved !== null ? saved === 'true' : true;
  });
  const [customizeIconFunctions, setCustomizeIconFunctions] = useState(() => {
    const saved = localStorage.getItem('pirate_customize_icon_functions');
    return saved !== null ? saved === 'true' : true;
  });
  const [showRelatedAlerts, setShowRelatedAlerts] = useState(() => {
    const saved = localStorage.getItem('pirate_show_related_alerts');
    return saved !== null ? saved === 'true' : true;
  });
  const [disableQuickChat, setDisableQuickChat] = useState(() => {
    const saved = localStorage.getItem('pirate_disable_quick_chat');
    return saved !== null ? saved === 'true' : false;
  });
  const [powerSaverLogin, setPowerSaverLogin] = useState(() => {
    const saved = localStorage.getItem('pirate_power_saver_login');
    return saved !== null ? saved === 'true' : false;
  });
  const [stopRogueAlliances, setStopRogueAlliances] = useState(() => {
    const saved = localStorage.getItem('pirate_stop_rogue_alliances');
    return saved !== null ? saved === 'true' : false;
  });
  const [heatingEnergyIndex, setHeatingEnergyIndex] = useState(() => {
    const saved = localStorage.getItem('pirate_heating_energy_index');
    return saved !== null ? saved === 'true' : false;
  });

  // --- Preloading & Optimization (Lazy & Deferred) ---
  useEffect(() => {
    // 1. Immediately preload ONLY critical UI icons for instant rendering
    const criticalAssets = [
      GOLD_COIN_ICON,
      GEM_ICON,
      "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/harbor_sprite_final.png"
    ];

    criticalAssets.forEach(url => {
      if (!url) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    });

    // 2. Defer heavy background asset preloading until 3 seconds after boot
    const deferredTimer = setTimeout(() => {
      // Preload current building levels
      const harborUrl = getHarborImageUrl(shipTowerLevel || 1);
      const fishUrl = getFishHouseImageUrl(fishStorageLevel || 1);
      [harborUrl, fishUrl].forEach(url => {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      });

      // Preload remaining UI assets in background
      const githubAssets = [
        "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/settings.png",
        "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/chat.png",
        "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/shop.png",
        "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/storage.png",
        "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/friends.png",
        "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/rank.png",
        "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/clan.png"
      ];

      githubAssets.forEach(url => {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      });
    }, 3000);

    return () => clearTimeout(deferredTimer);
  }, []);

  // Persistence effects for new settings
  useEffect(() => {
    localStorage.setItem('pirate_language', language);
  }, [language]);
  useEffect(() => {
    localStorage.setItem('pirate_show_death_banners', showDeathBanners.toString());
  }, [showDeathBanners]);
  useEffect(() => {
    localStorage.setItem('pirate_show_attack_notifications', showAttackNotifications.toString());
  }, [showAttackNotifications]);
  useEffect(() => {
    localStorage.setItem('pirate_show_chest_notifications', showChestNotifications.toString());
  }, [showChestNotifications]);
  useEffect(() => {
    localStorage.setItem('pirate_show_popup_alerts', showPopupAlerts.toString());
  }, [showPopupAlerts]);
  useEffect(() => {
    localStorage.setItem('pirate_disable_animated_bg', disableAnimatedBackground.toString());
  }, [disableAnimatedBackground]);
  useEffect(() => {
    localStorage.setItem('pirate_power_saver', powerSaver.toString());
  }, [powerSaver]);
  useEffect(() => {
    localStorage.setItem('pirate_show_sound_tones', showSoundTones.toString());
  }, [showSoundTones]);
  useEffect(() => {
    localStorage.setItem('pirate_customize_icon_functions', customizeIconFunctions.toString());
  }, [customizeIconFunctions]);
  useEffect(() => {
    localStorage.setItem('pirate_show_related_alerts', showRelatedAlerts.toString());
  }, [showRelatedAlerts]);
  useEffect(() => {
    localStorage.setItem('pirate_disable_quick_chat', disableQuickChat.toString());
  }, [disableQuickChat]);
  useEffect(() => {
    localStorage.setItem('pirate_power_saver_login', powerSaverLogin.toString());
  }, [powerSaverLogin]);
  useEffect(() => {
    localStorage.setItem('pirate_stop_rogue_alliances', stopRogueAlliances.toString());
  }, [stopRogueAlliances]);
  useEffect(() => {
    localStorage.setItem('pirate_heating_energy_index', heatingEnergyIndex.toString());
  }, [heatingEnergyIndex]);

  // Sub-modals for settings interactions
  const [activeSettingsModal, setActiveSettingsModal] = useState<'email' | 'password' | 'ticket' | 'icons' | 'delete' | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [settingsToast, setSettingsToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const settingsToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSettingsToast({ message, type });
    if (settingsToastTimerRef.current) {
      clearTimeout(settingsToastTimerRef.current);
    }
    settingsToastTimerRef.current = setTimeout(() => {
      setSettingsToast(null);
      settingsToastTimerRef.current = null;
    }, 4000);
  }, []);

  const handleSendPasswordReset = async () => {
    const email = auth.currentUser?.email || 'neyazyyyyy@gmail.com';
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      showToast('🔑 تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('❌ حدث خطأ أثناء إرسال الرابط: ' + (err.message || String(err)), 'error');
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmailInput || !newEmailInput.includes('@')) {
      showToast('❌ الرجاء إدخال بريد إلكتروني صحيح!', 'error');
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const { verifyBeforeUpdateEmail } = await import('firebase/auth');
        await verifyBeforeUpdateEmail(currentUser, newEmailInput);
        
        showToast('✉️ تم إرسال رابط تأكيد إلى بريدك الجديد. سيتم تحديث بريدك الإلكتروني تلقائياً بعد النقر على الرابط.', 'success');
        setActiveSettingsModal(null);
        setNewEmailInput('');
      } else {
        showToast('❌ يجب تسجيل الدخول لتغيير البريد الإلكتروني', 'error');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        showToast('❌ يرجى إعادة تسجيل الدخول لتغيير البريد الإلكتروني (إجراء أمني)', 'error');
      } else {
        showToast('❌ فشل تحديث البريد الإلكتروني: ' + (err.message || 'خطأ أمني'), 'error');
      }
    }
  };

  const handleCreateSupportTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      showToast('❌ الرجاء ملء جميع الحقول لكتابة تذكرة الدعم!', 'error');
      return;
    }
    try {
      const currentUser = auth.currentUser;
      const ticketData = {
        userId: currentUser?.uid || 'anonymous',
        username: username,
        email: currentUser?.email || 'neyazyyyyy@gmail.com',
        subject: ticketSubject,
        message: ticketMessage,
        status: 'open',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'support_tickets'), ticketData);
      showToast('🎫 تم إنشاء تذكرة الدعم الفني بنجاح رقم #' + Math.floor(1000 + Math.random() * 9000), 'success');
      setActiveSettingsModal(null);
      setTicketSubject('');
      setTicketMessage('');
    } catch (err: any) {
      console.error(err);
      showToast('❌ فشل إنشاء تذكرة الدعم: ' + err.message, 'error');
    }
  };




  const [updatingGame, setUpdatingGame] = useState<boolean>(false);
  const handleUpdateGameVersion = () => {
    setUpdatingGame(true);
    showToast('🔄 جاري التحقق من وجود تحديثات للألعاب والملفات...', 'success');
    setTimeout(() => {
      setUpdatingGame(false);
      showToast('✅ اللعبة محدثة لأحدث إصدار ومستقرة تماماً!', 'success');
    }, 2500);
  };

  // --- Dynamic Weather States & Engine ---
  const [weather, setWeather] = useState<'clear' | 'rain' | 'fog' | 'storm'>(() => {
    return (localStorage.getItem('pirate_weather') as 'clear' | 'rain' | 'fog' | 'storm') || 'clear';
  });
  const [weatherNotify, setWeatherNotify] = useState<string | null>(null);
  const [lightningActive, setLightningActive] = useState<boolean>(false);

  const changeWeather = (newWeather: 'clear' | 'rain' | 'fog' | 'storm') => {
    setWeather(newWeather);
    localStorage.setItem('pirate_weather', newWeather);

    let message = '';
    switch (newWeather) {
      case 'clear':
        message = 'انقشعت الغيوم وعاد الطقس صافياً ومشرقاً على مينائنا الهادئ! ☀️';
        break;
      case 'rain':
        message = 'أجواء ماطرة تسود الأجواء.. بدأت حبات المطر بالهطول على مياه الميناء 🌧️';
        break;
      case 'fog':
        message = 'ضباب بحري كثيف يغلف السواحل ويحجب الرؤية عن الأساطيل البعيدة! 🌫️';
        break;
      case 'storm':
        message = '🚨 تحذير: عاصفة بحرية رعدية هائجة تضرب الميناء الآن! تماسكوا يا قراصنة! ⛈️';
        break;
    }

    setWeatherNotify(message);
    setTimeout(() => {
      setWeatherNotify(prev => prev === message ? null : prev);
    }, 6000);
  };

  const rainStreaks = React.useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      dur: `${0.6 + Math.random() * 0.4}s`,
      opacity: 0.3 + Math.random() * 0.4,
      height: `${40 + Math.random() * 40}px`
    }));
  }, []);

  // --- Random Dynamic Weather Loop ---
  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();
      let nextWeather: 'clear' | 'rain' | 'fog' | 'storm' = 'clear';
      if (rand < 0.45) {
        nextWeather = 'clear';
      } else if (rand < 0.65) {
        nextWeather = 'rain';
      } else if (rand < 0.85) {
        nextWeather = 'fog';
      } else {
        nextWeather = 'storm';
      }
      
      if (nextWeather !== weather) {
        changeWeather(nextWeather);
      }
    }, 70000); // changes every 70 seconds randomly

    return () => clearInterval(interval);
  }, [weather]);

  // --- Lightning flash interval for storms ---
  useEffect(() => {
    if (weather !== 'storm' || lowGraphics) {
      setLightningActive(false);
      return;
    }

    let lightningTimeout: any;
    const triggerLightning = () => {
      setLightningActive(true);
      setTimeout(() => {
        setLightningActive(false);
      }, 450);

      const nextDelay = 8000 + Math.random() * 14000;
      lightningTimeout = setTimeout(triggerLightning, nextDelay);
    };

    lightningTimeout = setTimeout(triggerLightning, 6000 + Math.random() * 6000);

    return () => clearTimeout(lightningTimeout);
  }, [weather, lowGraphics]);

  // --- Dynamic Tide & Ebb (المد والجزر) ---
  const [tide, setTide] = useState<'low' | 'incoming' | 'high' | 'outgoing'>(() => {
    return (localStorage.getItem('pirate_tide') as 'low' | 'incoming' | 'high' | 'outgoing') || 'high';
  });
  const [tideNotify, setTideNotify] = useState<string | null>(null);

  const changeTide = (newTide: 'low' | 'incoming' | 'high' | 'outgoing') => {
    setTide(newTide);
    localStorage.setItem('pirate_tide', newTide);

    let message = '';
    switch (newTide) {
      case 'high':
        message = '🌊 المد العالي يغمر شواطئ الميناء ويرفع مستوى مياه البحر!';
        break;
      case 'outgoing':
        message = '📉 تراجع البحر.. بدأت مياه الخليج بالانحسار التدريجي نحو الجزر';
        break;
      case 'low':
        message = '🐚 الجزر التام يكشف رمال الشاطئ والمنحدرات الصخرية للميناء!';
        break;
      case 'incoming':
        message = '📈 فيضان المد البحري.. مستوى المياه يرتفع تدريجياً لترسو السفن بأمان';
        break;
    }

    setTideNotify(message);
    setTimeout(() => {
      setTideNotify(prev => prev === message ? null : prev);
    }, 6000);
  };

  // --- Automatic Tide Cycle ---
  useEffect(() => {
    const interval = setInterval(() => {
      const phases: ('low' | 'incoming' | 'high' | 'outgoing')[] = ['low', 'incoming', 'high', 'outgoing'];
      const nextIndex = (phases.indexOf(tide) + 1) % phases.length;
      changeTide(phases[nextIndex]);
    }, 60000); // Changes tide phase every 60 seconds

    return () => clearInterval(interval);
  }, [tide]);

  // --- Harbor Background Video Controller ---
  const shouldPlayHarborVideo =
    isLoggedIn &&
    !portDestroyed &&
    bgTheme !== 'destroyed' &&
    !disableAnimatedBackground &&
    !powerSaver;

  useEffect(() => {
    const video = videoRefA.current;
    if (!video) return;
    if (!shouldPlayHarborVideo) {
      try {
        video.pause();
      } catch (e) {}
      return;
    }
    video.muted = isMusicMuted;
    video.volume = isMusicMuted ? 0 : 1;
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [shouldPlayHarborVideo, isMusicMuted]);

  useEffect(() => {
    if (!shouldPlayHarborVideo) return;
    const handleFirstInteraction = () => {
      const video = videoRefA.current;
      if (video && shouldPlayHarborVideo) {
        video.muted = isMusicMuted;
        video.volume = isMusicMuted ? 0 : 1;
        video.play().catch(() => {});
      }
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [shouldPlayHarborVideo, isMusicMuted]);

  // --- Captain Level Calculation ---
  const playerLevel = Math.floor(exp / 100) + 1;
  const expToNextLevel = playerLevel * 100;

  // --- Player Power calculation ---
  const activeShipsCount = ships.filter(s => s.exists).length;
  const crewPowerTotal = ships.filter(s => s.exists).reduce((acc, s) => acc + s.crewPower, 0);
  const shipUpgradesPower = ships
    .filter(s => s.exists)
    .reduce((acc, s) => acc + ((s.speedLevel || 1) - 1) * 1 + ((s.capacityLevel || 1) - 1) * 1 + ((s.defenseLevel || 1) - 1) * 4, 0);
  const playerPower = 10 + activeShipsCount * 5 + crewPowerTotal + (pirateClass === 'مقاتل الأساطيل' ? 15 : 0) + (shipTowerLevel - 1) * 10 + shipUpgradesPower;

  // --- Save states on change ---
  useEffect(() => {
    localStorage.setItem('gold', gold.toString());
  }, [gold]);

  useEffect(() => {
    localStorage.setItem('gems', gems.toString());
  }, [gems]);

  useEffect(() => {
    localStorage.setItem('pirate_exp', exp.toString());
  }, [exp]);

  useEffect(() => {
    const cleanToStore = ships.map(s => ({ ...s, moving: false }));
    localStorage.setItem('pirate_ships_v2', JSON.stringify(cleanToStore));
  }, [ships]);

  useEffect(() => {
    localStorage.setItem('pirate_username', username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem('pirate_avatar', avatar);
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem('pirate_server', server);
  }, [server]);

  useEffect(() => {
    localStorage.setItem('pirate_class', pirateClass);
  }, [pirateClass]);

  useEffect(() => {
    localStorage.setItem('pirate_is_logged_in', isLoggedIn.toString());
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('fish_storage_level', fishStorageLevel.toString());
  }, [fishStorageLevel]);

  useEffect(() => {
    localStorage.setItem('ship_tower_level', shipTowerLevel.toString());
  }, [shipTowerLevel]);

  useEffect(() => {
    localStorage.setItem('pirate_fish_inventory', JSON.stringify(fishInventory));
  }, [fishInventory]);

  useEffect(() => {
    localStorage.setItem('pirate_red_gems', redGems.toString());
  }, [redGems]);

  useEffect(() => {
    localStorage.setItem('pirate_weapons', JSON.stringify(weapons));
  }, [weapons]);

  useEffect(() => {
    localStorage.setItem('pirate_music_muted', isMusicMuted.toString());
  }, [isMusicMuted]);

  useEffect(() => {
    localStorage.setItem('pirate_sfx_muted', isSfxMuted.toString());
  }, [isSfxMuted]);

  useEffect(() => {
    localStorage.setItem('pirate_low_graphics', lowGraphics.toString());
  }, [lowGraphics]);

  useEffect(() => {
    localStorage.setItem('pirate_port_destroyed', portDestroyed.toString());
  }, [portDestroyed]);

  useEffect(() => {
    if (portDestroyed && activeTab === 'harbor') {
      const triggerPortExplosions = () => {
        // Core center explosion
        window.dispatchEvent(new CustomEvent('spawn-pirate-particles', {
          detail: { x: 45, y: 48, type: 'explosion', count: 45 }
        }));
        
        // Random multi-bursts slightly delayed
        const delayBurst = (x: number, y: number, ms: number) => {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('spawn-pirate-particles', {
              detail: { x, y, type: 'destroy', count: 35 }
            }));
          }, ms);
        };
        
        delayBurst(15, 30, 200);
        delayBurst(74, 18, 400);
        delayBurst(35, 52, 650);
        delayBurst(60, 40, 900);
      };
      
      triggerPortExplosions();
    }
  }, [portDestroyed, activeTab]);

  // --- Dock & Fishing spot positions ---
  const docks: Record<string, { l: string; t: string }> = {
    s1: { l: '27%', t: '41%' },
    s2: { l: '26%', t: '51%' },
    s3: { l: '28%', t: '61%' },
    s4: { l: '27%', t: '50%' },
    s5: { l: '29%', t: '66%' },
  };

  const fishSpots: Record<string, { l: string; t: string }> = {
    s1: { l: '55%', t: '38%' },
    s2: { l: '55%', t: '49%' },
    s3: { l: '55%', t: '60%' },
    s4: { l: '55%', t: '52%' },
    s5: { l: '55%', t: '68%' },
  };

  const sunSparklesList = [
    { id: 1, left: '55%', top: '35%', size: '6px', delay: '0s', dur: '3s' },
    { id: 2, left: '52%', top: '38%', size: '8px', delay: '0.5s', dur: '4s' },
    { id: 3, left: '58%', top: '42%', size: '5px', delay: '1s', dur: '2.5s' },
    { id: 4, left: '50%', top: '45%', size: '7px', delay: '1.5s', dur: '3.5s' },
    { id: 5, left: '54%', top: '48%', size: '9px', delay: '0.2s', dur: '4.2s' },
    { id: 6, left: '56%', top: '52%', size: '6px', delay: '1.2s', dur: '2.8s' },
    { id: 7, left: '48%', top: '50%', size: '8px', delay: '0.8s', dur: '3.8s' },
    { id: 8, left: '51%', top: '55%', size: '5px', delay: '2.2s', dur: '3.1s' },
    { id: 9, left: '55%', top: '58%', size: '7px', delay: '1.7s', dur: '2.9s' },
    { id: 10, left: '59%', top: '62%', size: '9px', delay: '0.4s', dur: '4.5s' },
    { id: 11, left: '53%', top: '65%', size: '6px', delay: '1.1s', dur: '3.3s' },
    { id: 12, left: '47%', top: '60%', size: '8px', delay: '2.5s', dur: '3.7s' },
    { id: 13, left: '56%', top: '70%', size: '5px', delay: '0.3s', dur: '2.4s' },
    { id: 14, left: '51%', top: '72%', size: '7px', delay: '1.9s', dur: '3.9s' },
    { id: 15, left: '58%', top: '75%', size: '9px', delay: '0.7s', dur: '4.1s' },
    { id: 16, left: '54%', top: '78%', size: '6px', delay: '1.4s', dur: '2.7s' },
    { id: 17, left: '49%', top: '74%', size: '8px', delay: '2.1s', dur: '3.6s' },
    { id: 18, left: '52%', top: '82%', size: '5px', delay: '0.9s', dur: '3.2s' },
    { id: 19, left: '57%', top: '85%', size: '7px', delay: '1.6s', dur: '2.8s' },
    { id: 20, left: '55%', top: '88%', size: '10px', delay: '0.1s', dur: '4.6s' },
    { id: 21, left: '50%', top: '84%', size: '6px', delay: '2.4s', dur: '3.4s' },
    { id: 22, left: '60%', top: '48%', size: '7px', delay: '1.3s', dur: '3s' },
    { id: 23, left: '46%', top: '53%', size: '5px', delay: '0.6s', dur: '2.6s' },
    { id: 24, left: '48%', top: '42%', size: '8px', delay: '1.8s', dur: '4s' },
    { id: 25, left: '62%', top: '56%', size: '6px', delay: '0.2s', dur: '3.2s' }
  ];

  // --- Automatic ship coordinate & state migration ---
  useEffect(() => {
    setShips(prev => prev.map(s => {
      const correctDock = docks[s.id] || { l: '26%', t: '51%' };
      const correctFish = fishSpots[s.id] || { l: '55%', t: '48%' };
      const nextPos = s.status === 'fishing' ? correctFish : correctDock;
      return {
        ...s,
        moving: false,
        left: nextPos.l,
        top: nextPos.t
      };
    }));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('pirate_battle_reports', JSON.stringify(battleReports));
  }, [battleReports]);

  // --- Handle global clicks to close custom menus ---
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('#ship-menu')) return;
      setMenu(prev => ({ ...prev, visible: false }));
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const areFieldsEqual = (a: any, b: any) => {
    if (!a || !b) return false;
    
    // Compare primitives
    const primitives = [
      'username', 'avatar', 'server', 'pirateClass', 'gold', 'gems', 'exp',
      'redGems', 'fishStorageLevel', 'shipTowerLevel', 'portDestroyed',
      'activeAd', 'tribeId', 'tribeName', 'bgTheme', 'profileTheme'
    ];
    for (const key of primitives) {
      const valA = a[key];
      const valB = b[key];
      if ((valA ?? '') !== (valB ?? '')) {
        if (typeof valA === 'number' && typeof valB === 'number' && valA === valB) continue;
        return false;
      }
    }
    
    // JSON stringify comparison for structured objects/arrays, normalizing undefined/null to defaults
    const arrayKeys = ['ships', 'crew', 'quests', 'battleReports', 'attackLogs', 'supportGifts', 'friends', 'friendRequests'];
    const objectKeys = ['fishInventory', 'weapons', 'crewServices', 'crewInventory', 'shieldInventory', 'settings', 'tribeSnapshot'];
    for (const key of arrayKeys) {
      const valA = Array.isArray(a[key]) ? a[key] : [];
      const valB = Array.isArray(b[key]) ? b[key] : [];
      if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        return false;
      }
    }
    for (const key of objectKeys) {
      const valA = a[key] && typeof a[key] === 'object' ? a[key] : {};
      const valB = b[key] && typeof b[key] === 'object' ? b[key] : {};
      if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        return false;
      }
    }
    
    return true;
  };

  const buildCurrentUserPayload = (userEmailOverride?: string) => {
    const cleanUserEmail = (userEmailOverride || auth.currentUser?.email || localStorage.getItem('google_auth_email') || '').toLowerCase().trim();
    const activeTribeSnapshot = tribeId ? (tribes.find(t => t.id === tribeId) || null) : null;

    return {
      username,
      email: cleanUserEmail,
      avatar,
      server,
      pirateClass,
      gold,
      gems,
      exp,
      redGems,
      fishStorageLevel,
      shipTowerLevel,
      ships: ships.map(s => ({ ...s, moving: false })),
      crew,
      quests,
      battleReports: battleReports.slice(0, 30),
      attackLogs: attackLogs.slice(0, 30),
      supportGifts: supportGifts.slice(0, 30),
      fishInventory,
      weapons,
      crewServices,
      crewInventory,
      shieldInventory,
      portDestroyed,
      activeAd,
      friends,
      friendRequests,
      tribeId,
      tribeName,
      ...(activeTribeSnapshot ? { tribeSnapshot: activeTribeSnapshot } : {}),
      bgTheme,
      profileTheme,
      processedHarborEventIds: Array.from(processedHarborEventIdsRef.current).slice(-120),
      settings: {
        language,
        showDeathBanners,
        showAttackNotifications,
        showChestNotifications,
        showPopupAlerts,
        disableAnimatedBackground,
        powerSaver,
        showSoundTones,
        customizeIconFunctions,
        showRelatedAlerts,
        disableQuickChat,
        powerSaverLogin,
        stopRogueAlliances,
        heatingEnergyIndex,
        isMusicMuted,
        isSfxMuted,
        lowGraphics,
      },
    };
  };

  const applyFirestoreUserData = (data: any, options?: { isInitialLoad?: boolean }) => {
    if (!data) return;
    const isInitial = Boolean(options?.isInitialLoad);

    lastDbData.current = data;
    justLoadedFromFirestore.current = true;

    if (data.username) setUsername(data.username);
    else if (isInitial) setUsername('سياف_البحار');

    if (data.avatar) setAvatar(data.avatar);
    else if (isInitial) setAvatar('⚓');

    if (data.server) setServer(data.server);
    else if (isInitial) setServer('سيرفر الأسطورة 1');

    if (data.pirateClass) setPirateClass(data.pirateClass);
    else if (isInitial) setPirateClass('صياد البحار');

    if (typeof data.gold === 'number') setGold(data.gold);
    else if (isInitial) setGold(DEFAULT_GOLD);

    if (typeof data.gems === 'number') setGems(data.gems);
    else if (isInitial) setGems(DEFAULT_GEMS);

    if (typeof data.exp === 'number') setExp(data.exp);
    else if (isInitial) setExp(DEFAULT_EXP);

    if (typeof data.redGems === 'number') setRedGems(data.redGems);
    else if (isInitial) setRedGems(DEFAULT_RED_GEMS);

    if (typeof data.fishStorageLevel === 'number') setFishStorageLevel(data.fishStorageLevel);
    else if (isInitial) setFishStorageLevel(DEFAULT_FISH_STORAGE_LEVEL);

    if (typeof data.shipTowerLevel === 'number') setShipTowerLevel(data.shipTowerLevel);
    else if (isInitial) setShipTowerLevel(DEFAULT_SHIP_TOWER_LEVEL);

    if (Array.isArray(data.ships) && data.ships.length > 0) {
      const synced = data.ships.map((s: any) => {
        const correctDock = docks[s.id] || { l: '26%', t: '51%' };
        const correctFish = fishSpots[s.id] || { l: '55%', t: '48%' };
        const nextPos = s.status === 'fishing' ? correctFish : correctDock;
        return syncShipMetadata({ ...s, moving: false, left: nextPos.l, top: nextPos.t });
      });
      setShips(synced);
      try {
        localStorage.setItem('pirate_ships_v2', JSON.stringify(synced));
        localStorage.setItem('pirate_ships', JSON.stringify(synced));
      } catch {}
    } else if (isInitial) {
      setShips(DEFAULT_SHIPS);
      try {
        localStorage.setItem('pirate_ships_v2', JSON.stringify(DEFAULT_SHIPS));
        localStorage.setItem('pirate_ships', JSON.stringify(DEFAULT_SHIPS));
      } catch {}
    }

    if (Array.isArray(data.crew) && data.crew.length > 0) {
      setCrew(data.crew);
    } else if (isInitial) {
      setCrew(DEFAULT_CREW);
    }

    if (Array.isArray(data.quests) && data.quests.length > 0) {
      const mergedQuests = DEFAULT_QUESTS.map(dq => {
        const savedQ = data.quests.find((sq: any) => sq.id === dq.id);
        return savedQ ? { ...dq, ...savedQ } : dq;
      });
      const extraQuests = data.quests.filter((sq: any) => !DEFAULT_QUESTS.some(dq => dq.id === sq.id));
      const finalQuests = [...mergedQuests, ...extraQuests];
      setQuests(finalQuests);
      try { localStorage.setItem('pirate_quests', JSON.stringify(finalQuests)); } catch {}
    } else if (isInitial) {
      setQuests(DEFAULT_QUESTS);
      try { localStorage.setItem('pirate_quests', JSON.stringify(DEFAULT_QUESTS)); } catch {}
    }

    if (Array.isArray(data.battleReports)) {
      setBattleReports(data.battleReports);
      try { localStorage.setItem('pirate_battle_reports', JSON.stringify(data.battleReports)); } catch {}
    } else if (isInitial) {
      setBattleReports([]);
      try { localStorage.removeItem('pirate_battle_reports'); } catch {}
    }

    if (Array.isArray(data.processedHarborEventIds)) {
      if (isInitial) {
        processedHarborEventIdsRef.current = new Set(data.processedHarborEventIds.filter((id: any) => typeof id === 'string'));
      } else {
        data.processedHarborEventIds.forEach((id: any) => {
          if (typeof id === 'string') processedHarborEventIdsRef.current.add(id);
        });
      }
      try {
        localStorage.setItem('pirate_processed_harbor_events', JSON.stringify(Array.from(processedHarborEventIdsRef.current).slice(-120)));
      } catch {}
    }

    if (Array.isArray(data.attackLogs)) {
      setAttackLogs(data.attackLogs);
      try { localStorage.setItem('pirate_attack_logs', JSON.stringify(data.attackLogs)); } catch {}
    } else if (isInitial) {
      setAttackLogs([]);
      try { localStorage.removeItem('pirate_attack_logs'); } catch {}
    }

    if (Array.isArray(data.supportGifts)) {
      setSupportGifts(data.supportGifts);
      try { localStorage.setItem('pirate_support_gifts', JSON.stringify(data.supportGifts)); } catch {}
    } else if (isInitial) {
      setSupportGifts([]);
      try { localStorage.removeItem('pirate_support_gifts'); } catch {}
    }

    if (data.fishInventory && typeof data.fishInventory === 'object') {
      setFishInventory(data.fishInventory);
    } else if (isInitial) {
      setFishInventory(DEFAULT_FISH_INVENTORY);
    }

    if (data.weapons && typeof data.weapons === 'object') {
      setWeapons({ ...DEFAULT_WEAPONS, ...data.weapons });
    } else if (isInitial) {
      setWeapons(DEFAULT_WEAPONS);
    }

    if (data.crewServices && typeof data.crewServices === 'object') {
      setCrewServices({ ...DEFAULT_CREW_SERVICES, ...data.crewServices });
    } else if (isInitial) {
      setCrewServices(DEFAULT_CREW_SERVICES);
    }

    if (data.crewInventory && typeof data.crewInventory === 'object') {
      setCrewInventory({ ...DEFAULT_CREW_INVENTORY, ...data.crewInventory });
    } else if (isInitial) {
      setCrewInventory(DEFAULT_CREW_INVENTORY);
    }

    if (data.shieldInventory && typeof data.shieldInventory === 'object') {
      setShieldInventory({ ...DEFAULT_SHIELD_INVENTORY, ...data.shieldInventory });
    } else if (isInitial) {
      setShieldInventory(DEFAULT_SHIELD_INVENTORY);
    }

    if (Array.isArray(data.friends)) setFriends(data.friends);
    else if (isInitial) setFriends([]);

    if (Array.isArray(data.friendRequests) && isInitial) setFriendRequests(data.friendRequests);

    if (typeof data.tribeId === 'string') {
      setTribeId(data.tribeId);
      try {
        if (data.tribeId) localStorage.setItem('pirate_tribe_id', data.tribeId);
        else localStorage.removeItem('pirate_tribe_id');
      } catch {}
    } else if (isInitial) {
      setTribeId('');
      try { localStorage.removeItem('pirate_tribe_id'); } catch {}
    }

    if (typeof data.tribeName === 'string') {
      setTribeName(data.tribeName);
      try {
        if (data.tribeName) localStorage.setItem('pirate_tribe_name', data.tribeName);
        else localStorage.removeItem('pirate_tribe_name');
      } catch {}
    } else if (isInitial) {
      setTribeName('');
      try { localStorage.removeItem('pirate_tribe_name'); } catch {}
    }

    if (data.tribeSnapshot && typeof data.tribeSnapshot === 'object' && data.tribeSnapshot.id) {
      setTribes(prev => {
        const filtered = prev.filter(t => t.id !== data.tribeSnapshot.id);
        return [data.tribeSnapshot, ...filtered];
      });
    }

    if (typeof data.portDestroyed === 'boolean') {
      setPortDestroyed(data.portDestroyed);
      try { localStorage.setItem('pirate_port_destroyed', data.portDestroyed.toString()); } catch {}
    } else if (isInitial) {
      setPortDestroyed(false);
      try { localStorage.setItem('pirate_port_destroyed', 'false'); } catch {}
    }

    if (data.activeAd !== undefined) {
      setActiveAd(data.activeAd || null);
      try {
        if (data.activeAd) localStorage.setItem('pirate_active_ad', data.activeAd);
        else localStorage.removeItem('pirate_active_ad');
      } catch {}
    } else if (isInitial) {
      setActiveAd(null);
      try { localStorage.removeItem('pirate_active_ad'); } catch {}
    }

    if (data.bgTheme && ['classic', 'destroyed'].includes(data.bgTheme)) {
      setBgTheme(data.bgTheme);
    } else if (isInitial) {
      setBgTheme('classic');
    }

    if (typeof data.profileTheme === 'string' && data.profileTheme) {
      setProfileTheme(data.profileTheme);
    } else if (isInitial) {
      setProfileTheme('default');
    }

    if (data.settings && typeof data.settings === 'object') {
      const s = data.settings;
      if (typeof s.language === 'string') setLanguage(s.language);
      if (typeof s.showDeathBanners === 'boolean') setShowDeathBanners(s.showDeathBanners);
      if (typeof s.showAttackNotifications === 'boolean') setShowAttackNotifications(s.showAttackNotifications);
      if (typeof s.showChestNotifications === 'boolean') setShowChestNotifications(s.showChestNotifications);
      if (typeof s.showPopupAlerts === 'boolean') setShowPopupAlerts(s.showPopupAlerts);
      if (typeof s.disableAnimatedBackground === 'boolean') setDisableAnimatedBackground(s.disableAnimatedBackground);
      if (typeof s.powerSaver === 'boolean') setPowerSaver(s.powerSaver);
      if (typeof s.showSoundTones === 'boolean') setShowSoundTones(s.showSoundTones);
      if (typeof s.customizeIconFunctions === 'boolean') setCustomizeIconFunctions(s.customizeIconFunctions);
      if (typeof s.showRelatedAlerts === 'boolean') setShowRelatedAlerts(s.showRelatedAlerts);
      if (typeof s.disableQuickChat === 'boolean') setDisableQuickChat(s.disableQuickChat);
      if (typeof s.powerSaverLogin === 'boolean') setPowerSaverLogin(s.powerSaverLogin);
      if (typeof s.stopRogueAlliances === 'boolean') setStopRogueAlliances(s.stopRogueAlliances);
      if (typeof s.heatingEnergyIndex === 'boolean') setHeatingEnergyIndex(s.heatingEnergyIndex);
      if (typeof s.isMusicMuted === 'boolean') setIsMusicMuted(s.isMusicMuted);
      if (typeof s.isSfxMuted === 'boolean') setIsSfxMuted(s.isSfxMuted);
      if (typeof s.lowGraphics === 'boolean') setLowGraphics(s.lowGraphics);
    }
  };

  const scoreAccountDocProgress = (d: any): number => {
    if (!d) return 0;
    const shipLvlScore = Array.isArray(d.ships)
      ? d.ships.reduce((acc: number, s: any) => acc + (typeof s.level === 'number' ? s.level * 1000 : 0), 0)
      : 0;
    const questScore = Array.isArray(d.quests)
      ? d.quests.reduce((acc: number, q: any) => acc + (q.progress || 0) * 50 + (q.claimed ? 500 : 0), 0)
      : 0;
    return (typeof d.exp === 'number' ? d.exp * 10 : 0)
      + (typeof d.gold === 'number' ? d.gold : 0)
      + (typeof d.gems === 'number' ? d.gems * 100 : 0)
      + shipLvlScore
      + questScore;
  };

  const findBestLegacyAccountByEmail = async (
    cleanEmail: string,
    excludeUid?: string
  ): Promise<{ id: string; data: any; score: number } | null> => {
    if (!cleanEmail) return null;
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (snap.empty) return null;

      let bestDoc: { id: string; data: any; score: number } | null = null;
      snap.forEach(docSnap => {
        if (excludeUid && docSnap.id === excludeUid) return;
        const d = docSnap.data();
        const sc = scoreAccountDocProgress(d);
        if (!bestDoc || sc > bestDoc.score) {
          bestDoc = { id: docSnap.id, data: d, score: sc };
        }
      });
      return bestDoc;
    } catch (err) {
      console.warn('Email account lookup notice:', err);
      return null;
    }
  };

  const loadAndSubscribeUserDoc = async (user: any, opts?: { forceTakeoverSession?: boolean }) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const cleanEmail = (user.email || localStorage.getItem('google_auth_email') || '').toLowerCase().trim();
    const isActivelyLoggingIn = Boolean(opts?.forceTakeoverSession || localStorage.getItem('pirate_login_in_progress') === 'true');

    if (unsubUserSnapshot.current) {
      try { unsubUserSnapshot.current(); } catch {}
      unsubUserSnapshot.current = null;
    }

    const attachUserRealtimeListener = () => {
      unsubUserSnapshot.current = onSnapshot(userDocRef, (docSnap) => {
        if (isDeletingAccount.current || docSnap.metadata.hasPendingWrites) {
          return;
        }
        if (docSnap.exists()) {
          const data = docSnap.data();

          const serverDeviceId = data.currentDeviceId;
          const localDeviceId = getOrCreateDeviceId();
          const serverSessionId = data.currentSessionId;
          const localSessionId = getLocalSessionId();
          const serverStatus = data.sessionStatus;

          if (localStorage.getItem('pirate_login_in_progress') !== 'true') {
            if ((serverDeviceId && localDeviceId && serverDeviceId !== localDeviceId) || serverStatus === 'EXPIRED') {
              handleTerminateOldSession({
                newDevice: data.lastLoginDevice || 'جهاز أو متصفح آخر',
                lastLoginAt: data.lastLoginAt
              });
              return;
            }
          }

          if (serverDeviceId === localDeviceId && serverSessionId && localSessionId !== serverSessionId) {
            setLocalSessionId(serverSessionId);
          }

          applyFirestoreUserData(data, { isInitialLoad: !isLoadedFromFirebase.current });
          activeAuthUidRef.current = user.uid;
          isLoadedFromFirebase.current = true;
          setUserDocReadyUid(user.uid);
        }
        setLoadingFirebase(false);
      }, (err) => {
        const msg = err?.message || String(err || '');
        if (err?.code === 'unavailable' || /offline|unavailable/i.test(msg)) {
          console.warn('Real-time user listener waiting for network recovery:', msg);
        } else {
          console.error("Error in real-time user document listener:", err);
        }
        setLoadingFirebase(false);
      });
    };

    const isTransientOfflineError = (err: any) => {
      const msg = (err?.message || String(err || '')).toLowerCase();
      return err?.code === 'unavailable' || msg.includes('offline') || msg.includes('unavailable');
    };

    try {
      let initialSnap: any = null;
      try {
        initialSnap = await getDoc(userDocRef);
      } catch (firstErr: any) {
        if (isTransientOfflineError(firstErr)) {
          await enableNetwork(db).catch(() => {});
          await new Promise(resolve => setTimeout(resolve, 600));
          try {
            initialSnap = await getDoc(userDocRef);
          } catch (retryErr: any) {
            if (isTransientOfflineError(retryErr)) {
              initialSnap = await getDocFromCache(userDocRef).catch(() => null);
            } else {
              throw retryErr;
            }
          }
        } else {
          throw firstErr;
        }
      }

      if (!initialSnap) {
        // Offline / cache empty: attach real-time listener so profile hydrates automatically once online
        console.warn('Firestore temporarily offline during initial load; attaching real-time sync listener.');
        attachUserRealtimeListener();
        setIsLoggedIn(true);
        setLoadingFirebase(false);
        return;
      }

      if (initialSnap.exists()) {
        let data = initialSnap.data();

        // If this UID doc is partial/untouched (e.g., created during an earlier split login), recover richer progress from matching email doc
        const isPartialOrBlank = !Array.isArray(data.ships) || (
          (data.exp || 0) === 0 && (data.gold || 0) <= 500 && !data.ships.some((s: any) => (s.level || 0) > 0)
        );
        if (isPartialOrBlank && cleanEmail) {
          const legacyMatch = await findBestLegacyAccountByEmail(cleanEmail, user.uid);
          if (legacyMatch && legacyMatch.score > scoreAccountDocProgress(data) + 600) {
            const mergedRestored = {
              ...legacyMatch.data,
              userId: user.uid,
              email: cleanEmail,
              migratedFromUid: legacyMatch.id,
              updatedAt: new Date().toISOString()
            };
            await setDoc(userDocRef, mergedRestored, { merge: true }).catch(() => {});
            data = mergedRestored;
          }
        }

        // Session validation
        const serverDeviceId = data.currentDeviceId;
        const localDeviceId = getOrCreateDeviceId();
        const serverSessionId = data.currentSessionId;
        const serverStatus = data.sessionStatus;

        if (isActivelyLoggingIn || !serverDeviceId || !serverSessionId) {
          await registerNewUserSession(user.uid);
        } else if (serverDeviceId === localDeviceId) {
          if (serverStatus === 'EXPIRED') {
            await registerNewUserSession(user.uid);
          } else {
            setLocalSessionId(serverSessionId);
          }
        } else {
          await handleTerminateOldSession({
            newDevice: data.lastLoginDevice || 'جهاز أو متصفح آخر',
            lastLoginAt: data.lastLoginAt
          });
          setLoadingFirebase(false);
          return;
        }

        if (cleanEmail && data.email !== cleanEmail) {
          setDoc(userDocRef, { email: cleanEmail, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        }

        // Backfill missing structural fields on older/partial documents so Firestore is always complete
        const backfill: Record<string, any> = {};
        if (!Array.isArray(data.ships) || data.ships.length === 0) backfill.ships = DEFAULT_SHIPS;
        if (!Array.isArray(data.crew) || data.crew.length === 0) backfill.crew = DEFAULT_CREW;
        if (!Array.isArray(data.quests) || data.quests.length === 0) backfill.quests = DEFAULT_QUESTS;
        if (!data.weapons) backfill.weapons = DEFAULT_WEAPONS;
        if (!data.fishInventory) backfill.fishInventory = DEFAULT_FISH_INVENTORY;
        if (!data.crewServices) backfill.crewServices = DEFAULT_CREW_SERVICES;
        if (!data.crewInventory) backfill.crewInventory = DEFAULT_CREW_INVENTORY;
        if (!data.shieldInventory) backfill.shieldInventory = DEFAULT_SHIELD_INVENTORY;
        if (Object.keys(backfill).length > 0) {
          backfill.updatedAt = new Date().toISOString();
          setDoc(userDocRef, backfill, { merge: true }).catch(() => {});
          data = { ...data, ...backfill };
        }

        applyFirestoreUserData(data, { isInitialLoad: true });
        activeAuthUidRef.current = user.uid;
        isLoadedFromFirebase.current = true;
        setUserDocReadyUid(user.uid);
      } else if (!isDeletingAccount.current) {
        // Check if this email already has an existing account doc under another UID (e.g., different auth method)
        const legacyMatch = cleanEmail ? await findBestLegacyAccountByEmail(cleanEmail, user.uid) : null;

        if (legacyMatch) {
          const migratedData = {
            ...legacyMatch.data,
            userId: user.uid,
            googleUid: user.uid,
            authProvider: user.providerData?.[0]?.providerId || legacyMatch.data.authProvider || 'firebase',
            email: cleanEmail,
            migratedFromUid: legacyMatch.id,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, migratedData, { merge: true }).catch((err) => {
            console.error("Error migrating existing user document:", err);
          });
          await registerNewUserSession(user.uid);
          applyFirestoreUserData(migratedData, { isInitialLoad: true });
          activeAuthUidRef.current = user.uid;
          isLoadedFromFirebase.current = true;
          setUserDocReadyUid(user.uid);
        } else {
          // Truly new user: initialize isolated complete initial document
          const storedName = localStorage.getItem('google_auth_name') || '';
          const initialUsername = user.displayName || storedName || (cleanEmail ? cleanEmail.split('@')[0] : '') || 'سياف_البحار';
          const nowIso = new Date().toISOString();

          const initialData = {
            userId: user.uid,
            googleUid: user.uid,
            authProvider: user.providerData?.[0]?.providerId || 'firebase',
            username: initialUsername,
            email: cleanEmail,
            avatar: '⚓',
            server: 'سيرفر الأسطورة 1',
            pirateClass: 'صياد البحار',
            gold: DEFAULT_GOLD,
            gems: DEFAULT_GEMS,
            exp: DEFAULT_EXP,
            redGems: DEFAULT_RED_GEMS,
            fishStorageLevel: DEFAULT_FISH_STORAGE_LEVEL,
            shipTowerLevel: DEFAULT_SHIP_TOWER_LEVEL,
            ships: DEFAULT_SHIPS,
            crew: DEFAULT_CREW,
            quests: DEFAULT_QUESTS,
            battleReports: [],
            attackLogs: [],
            supportGifts: [],
            fishInventory: DEFAULT_FISH_INVENTORY,
            weapons: DEFAULT_WEAPONS,
            crewServices: DEFAULT_CREW_SERVICES,
            crewInventory: DEFAULT_CREW_INVENTORY,
            shieldInventory: DEFAULT_SHIELD_INVENTORY,
            friends: [],
            friendRequests: [],
            tribeId: '',
            tribeName: '',
            portDestroyed: false,
            activeAd: null,
            bgTheme: 'classic',
            profileTheme: 'default',
            createdAt: nowIso,
            updatedAt: nowIso
          };

          applyFirestoreUserData(initialData, { isInitialLoad: true });
          await setDoc(userDocRef, initialData, { merge: true }).catch((err) => {
            console.error("Error creating initial user document:", err);
          });
          await registerNewUserSession(user.uid);
          activeAuthUidRef.current = user.uid;
          isLoadedFromFirebase.current = true;
          setUserDocReadyUid(user.uid);
        }
      }

      // Attach real-time listener for current user updates
      attachUserRealtimeListener();

      setIsLoggedIn(true);
      setLoadingFirebase(false);
    } catch (error) {
      if (isTransientOfflineError(error)) {
        console.warn("Firestore offline while loading user profile; attaching real-time listener:", error);
        attachUserRealtimeListener();
        setIsLoggedIn(true);
      } else {
        console.error("Error loading user profile from Firestore:", error);
        try {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        } catch (e) {}
      }
      setLoadingFirebase(false);
    }
  };

  loadAndSubscribeUserDocRef.current = loadAndSubscribeUserDoc;

  handleRecoverSessionRef.current = async () => {
    setIsRecoveringSession(true);
    try {
      const targetUid = auth.currentUser?.uid || localStorage.getItem('google_auth_uid');
      if (!targetUid) {
        setSessionTerminationNotice(null);
        isSessionTerminated.current = false;
        setIsLoggedIn(false);
        setAuthScreen('login');
        return;
      }

      const { sessionId, deviceId, userDocData } = await recoverSessionFromDevice(targetUid);
      const userDocRef = doc(db, 'users', targetUid);
      let data = userDocData;
      if (!data) {
        const freshSnap = await getDoc(userDocRef);
        if (freshSnap.exists()) {
          data = freshSnap.data();
        }
      }

      if (data) {
        applyFirestoreUserData(data, { isInitialLoad: true });
      }

      isSessionTerminated.current = false;
      setSessionTerminationNotice(null);
      setIsLoggedIn(true);
      isLoadedFromFirebase.current = true;
      activeAuthUidRef.current = targetUid;
      setUserDocReadyUid(targetUid);
      localStorage.setItem('pirate_is_logged_in', 'true');

      if (unsubUserSnapshot.current) {
        try { unsubUserSnapshot.current(); } catch {}
      }
      unsubUserSnapshot.current = onSnapshot(userDocRef, (docSnap) => {
        if (isDeletingAccount.current || docSnap.metadata.hasPendingWrites) return;
        if (docSnap.exists()) {
          const snapData = docSnap.data();
          const serverDeviceId = snapData.currentDeviceId;
          const localDevId = getOrCreateDeviceId();
          const serverStatus = snapData.sessionStatus;

          if ((serverDeviceId && localDevId && serverDeviceId !== localDevId) || serverStatus === 'EXPIRED') {
            handleTerminateOldSession({
              newDevice: snapData.lastLoginDevice || 'جهاز أو متصفح آخر',
              lastLoginAt: snapData.lastLoginAt
            });
            return;
          }

          applyFirestoreUserData(snapData, { isInitialLoad: false });
        }
      }, (err) => {
        console.warn("Real-time listener after recovery warning:", err);
      });

      console.log(`[SESSION RECOVERY] Successfully recovered session ${sessionId} for user ${targetUid} on device ${deviceId}`);
    } catch (err: any) {
      console.error('Failed to recover session:', err);
      alert('تعذر استعادة الجلسة في الوقت الحالي. يرجى إعادة المحاولة.');
    } finally {
      setIsRecoveringSession(false);
    }
  };

  // --- Firebase Loading Effect with real-time onSnapshot ---
  useEffect(() => {
    const quickTimer = setTimeout(() => {
      setLoadingFirebase(false);
    }, 200);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      clearTimeout(quickTimer);
      setCurrentUser(user);
      if (user) {
        await loadAndSubscribeUserDocRef.current?.(user);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        isLoadedFromFirebase.current = false;
        activeAuthUidRef.current = null;
        setUserDocReadyUid(null);
        setLoadingFirebase(false);
        if (unsubUserSnapshot.current) {
          unsubUserSnapshot.current();
          unsubUserSnapshot.current = null;
        }
      }
    });

    return () => {
      clearTimeout(quickTimer);
      unsubscribeAuth();
      if (unsubUserSnapshot.current) {
        unsubUserSnapshot.current();
        unsubUserSnapshot.current = null;
      }
    };
  }, []);

  // --- Flush data to Firestore before page unload / refresh ---
  useEffect(() => {
    const handleBeforeUnload = () => {
      const user = auth.currentUser;
      if (!user || !isLoadedFromFirebase.current || isDeletingAccount.current || isSessionTerminated.current) return;
      const currentData = buildCurrentUserPayload();
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, { userId: user.uid, ...currentData, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    username, avatar, server, pirateClass, gold, gems, exp, redGems,
    fishStorageLevel, shipTowerLevel, ships, crew, quests, battleReports,
    attackLogs, supportGifts, fishInventory, weapons, crewServices,
    crewInventory, shieldInventory, portDestroyed, activeAd, friends, friendRequests,
    tribeId, tribeName, tribes, bgTheme, profileTheme,
    language, showDeathBanners, showAttackNotifications, showChestNotifications,
    showPopupAlerts, disableAnimatedBackground, powerSaver, showSoundTones,
    customizeIconFunctions, showRelatedAlerts, disableQuickChat, powerSaverLogin,
    stopRogueAlliances, heatingEnergyIndex, isMusicMuted, isSfxMuted, lowGraphics
  ]);

  // --- Active Session Continuous Validation (Interval + Tab Focus + Event) ---
  useEffect(() => {
    const checkSessionActivity = async () => {
      const user = auth.currentUser;
      if (!user || isSessionTerminated.current || localStorage.getItem('pirate_login_in_progress') === 'true') return;
      const res = await verifyActiveSession(user.uid);
      if (!res.isValid) {
        handleTerminateOldSession({
          newDevice: res.deviceInfo || 'جهاز أو متصفح آخر'
        });
      }
    };

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSessionActivity();
      }
    };

    const handleSessionTerminatedEvent = (e: any) => {
      const detail = e?.detail || {};
      handleTerminateOldSession({
        newDevice: detail.device || 'جهاز أو متصفح آخر'
      });
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);
    window.addEventListener('session-terminated-by-other-device', handleSessionTerminatedEvent);

    const interval = setInterval(checkSessionActivity, 30000);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      window.removeEventListener('session-terminated-by-other-device', handleSessionTerminatedEvent);
      clearInterval(interval);
    };
  }, []);

  // --- Firebase Auto-Save Effect ---
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const user = auth.currentUser;
    if (!user || !isLoadedFromFirebase.current || isDeletingAccount.current || isSessionTerminated.current) return;

    if (justLoadedFromFirestore.current) {
      justLoadedFromFirestore.current = false;
      return;
    }

    const currentData = buildCurrentUserPayload();

    if (lastDbData.current && areFieldsEqual(lastDbData.current, currentData)) {
      return;
    }

    const saveData = async () => {
      if (isDeletingAccount.current || !isLoadedFromFirebase.current || !auth.currentUser || isSessionTerminated.current) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          userId: user.uid,
          ...currentData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        lastDbData.current = currentData;
      } catch (error) {
        console.error("Error saving user profile to Firestore:", error);
        try {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        } catch (e) {}
      }
    };

    saveTimeoutRef.current = setTimeout(() => {
      saveData();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    username, avatar, server, pirateClass, gold, gems, exp, redGems,
    fishStorageLevel, shipTowerLevel, ships, crew, quests, battleReports,
    attackLogs, supportGifts, fishInventory, weapons, crewServices,
    crewInventory, shieldInventory, portDestroyed, activeAd, friends, friendRequests,
    tribeId, tribeName, tribes, bgTheme, profileTheme,
    language, showDeathBanners, showAttackNotifications, showChestNotifications,
    showPopupAlerts, disableAnimatedBackground, powerSaver, showSoundTones,
    customizeIconFunctions, showRelatedAlerts, disableQuickChat, powerSaverLogin,
    stopRogueAlliances, heatingEnergyIndex, isMusicMuted, isSfxMuted, lowGraphics
  ]);

  // --- Active Account & Email Cloud Synchronization ---
  const handleSyncAccount = async () => {
    const user = auth.currentUser;
    const userEmail = user?.email || localStorage.getItem('google_auth_email') || '';
    
    if (!user && !userEmail) {
      showToast('⚠️ يرجى تسجيل الدخول أولاً لمزامنة الحساب والبريد.', 'error');
      return;
    }

    showToast('🔄 جاري مزامنة بيانات الحساب والبريد الإلكتروني مع السحابة...', 'success');

    try {
      const targetUid = user?.uid;
      let userDocRef = targetUid ? doc(db, 'users', targetUid) : null;
      let docSnap = userDocRef ? await getDoc(userDocRef) : null;

      const cleanUserEmail = userEmail.toLowerCase().trim();

      // If docSnap doesn't exist by UID, search by email in Firestore
      if ((!docSnap || !docSnap.exists()) && cleanUserEmail) {
        const legacyMatch = await findBestLegacyAccountByEmail(cleanUserEmail, targetUid);
        if (legacyMatch && targetUid) {
          const targetRef = doc(db, 'users', targetUid);
          const migrated = {
            ...legacyMatch.data,
            userId: targetUid,
            email: cleanUserEmail,
            migratedFromUid: legacyMatch.id,
            updatedAt: new Date().toISOString()
          };
          await setDoc(targetRef, migrated, { merge: true });
          applyFirestoreUserData(migrated, { isInitialLoad: true });
          showToast('✅ تم استرجاع ومزامنة حسابك بالكامل من السحابة!', 'success');
          return;
        }
      }

      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        // Check if a richer legacy doc exists for this same email when current doc is empty
        if (cleanUserEmail && scoreAccountDocProgress(data) <= 600) {
          const legacyMatch = await findBestLegacyAccountByEmail(cleanUserEmail, targetUid);
          if (legacyMatch && legacyMatch.score > scoreAccountDocProgress(data) + 600 && targetUid) {
            const migrated = {
              ...legacyMatch.data,
              userId: targetUid,
              email: cleanUserEmail,
              migratedFromUid: legacyMatch.id,
              updatedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', targetUid), migrated, { merge: true });
            applyFirestoreUserData(migrated, { isInitialLoad: true });
            showToast('✅ تم استرجاع كامل تقدمك وإنجازاتك المرتبطة بهذا البريد!', 'success');
            return;
          }
        }

        applyFirestoreUserData(data, { isInitialLoad: false });

        if (userDocRef) {
          await setDoc(userDocRef, {
            userId: user?.uid || data.userId,
            email: cleanUserEmail || data.email || '',
            username: data.username || username,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }

        if (cleanUserEmail) {
          localStorage.setItem('google_auth_email', cleanUserEmail);
        }

        showToast('✅ تم مزامنة بيانات الحساب والبريد الإلكتروني بنجاح مع السحابة!', 'success');
      } else if (targetUid) {
        const currentData = {
          userId: targetUid,
          ...buildCurrentUserPayload(cleanUserEmail),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', targetUid), currentData, { merge: true });
        lastDbData.current = currentData;
        isLoadedFromFirebase.current = true;
        showToast('✅ تم إنشاء وحفظ وثيقة الحساب السحابي بنجاح!', 'success');
      }
    } catch (err: any) {
      console.error('Account sync error:', err);
      showToast('❌ تعذرت المزامنة المباشرة: ' + (err.message || 'حاول لاحقاً'), 'error');
    }
  };

  // --- Live Firestore Chat Subscription ---
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    // Querying with limit avoids missing index or missing field errors on old chat entries
    const q = query(collection(db, 'chats'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      const currentUid = currentUser.uid || localStorage.getItem('pirate_local_uid') || '';
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          id: docSnap.id,
          sender: data.sender || 'مجهول',
          avatar: data.avatar || '⚓',
          text: data.text || '',
          time: data.time || '',
          userId: data.userId || '',
          createdAt: data.createdAt || '',
          isMe: (!!currentUid && data.userId === currentUid) || (!!data.sender && data.sender === username)
        });
      });

      // Sort in-memory chronologically
      msgs.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (tA && tB) return tA - tB;
        return a.id.localeCompare(b.id);
      });

      setChatMessages(msgs);
    }, (err) => {
      console.warn("Could not fetch chats from Firestore:", err.message || err);
    });
    return () => unsubscribe();
  }, [isLoggedIn, currentUser, username]);

  // --- Auto-scroll Chat to bottom when new messages arrive or when chat tab opens ---
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [chatMessages.length, activeTab]);

  // --- Live Tribes Subscription (with user-doc snapshot fallback if /tribes rules restrict access) ---
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const q = query(collection(db, 'tribes'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || 'تحالف بلا اسم',
          description: data.description || '',
          emblem: data.emblem || '🏴‍☠️',
          leaderId: data.leaderId || '',
          leaderName: data.leaderName || 'قائد التحالف',
          level: typeof data.level === 'number' ? data.level : 1,
          power: typeof data.power === 'number' ? data.power : 0,
          donations: typeof data.donations === 'number' ? data.donations : 0,
          membersCount: typeof data.membersCount === 'number' ? data.membersCount : (data.members?.length || 1),
          members: Array.isArray(data.members) ? data.members : [],
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      list.sort((a, b) => (b.power || 0) - (a.power || 0));
      setTribes(prev => {
        const map = new Map<string, any>();
        prev.forEach(t => map.set(t.id, t));
        list.forEach(t => map.set(t.id, t));
        return Array.from(map.values()).sort((a, b) => (b.power || 0) - (a.power || 0));
      });
    }, (err) => {
      if (err?.code !== 'permission-denied') {
        console.warn("Could not fetch tribes from Firestore:", err.message || err);
      }
      try {
        const local = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          setTribes(prev => prev.length === 0 ? local : prev);
        }
      } catch (e) {}
    });
    return () => unsubscribe();
  }, [isLoggedIn, currentUser]);

  // --- Live Players & Leaderboard Subscription (Debounced to prevent full-app re-render storms) ---
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const playerList: any[] = [];
        const fallbackTribesMap = new Map<string, any>();

        snapshot.forEach((docSnap) => {
          if (!docSnap.exists()) return;
          const data = docSnap.data();
          const docUserId = data.userId || docSnap.id;
          const docEmail = (data.email || '').toLowerCase().trim();
          const rawUsername = (data.username || '').trim();
          const isPlaceholder = rawUsername === 'قبطان_البحار' || rawUsername === 'قبطان_الأعماق' || rawUsername === 'قبطان_مجهول';
          const docUsername = !isPlaceholder && rawUsername !== ''
            ? rawUsername
            : (docEmail ? docEmail.split('@')[0] : (data.displayName || 'لاعب'));

          if (data.tribeSnapshot && typeof data.tribeSnapshot === 'object' && data.tribeSnapshot.id) {
            const existingT = fallbackTribesMap.get(data.tribeSnapshot.id);
            if (!existingT || (data.tribeSnapshot.power || 0) >= (existingT.power || 0)) {
              fallbackTribesMap.set(data.tribeSnapshot.id, data.tribeSnapshot);
            }
          }

          playerList.push({
            id: docSnap.id,
            userId: docUserId,
            migratedFromUid: typeof data.migratedFromUid === 'string' ? data.migratedFromUid : '',
            username: docUsername,
            email: docEmail,
            avatar: data.avatar || '⚓',
            gold: typeof data.gold === 'number' ? data.gold : 0,
            gems: typeof data.gems === 'number' ? data.gems : 0,
            redGems: typeof data.redGems === 'number' ? data.redGems : 0,
            exp: typeof data.exp === 'number' ? data.exp : 0,
            tribeDonations:
              typeof data.tribeDonations === 'number'
                ? data.tribeDonations
                : typeof data.donations === 'number'
                ? data.donations
                : 0,
            photoURL: typeof data.photoURL === 'string' ? data.photoURL : '',
            boomPoints: typeof data.boomPoints === 'number' ? data.boomPoints : undefined,
            country: data.country || undefined,
            ships: data.ships || [],
            crew: data.crew || [],
            weapons: data.weapons || {},
            battleReports: data.battleReports || [],
            fishInventory: data.fishInventory || {},
            shipTowerLevel: typeof data.shipTowerLevel === 'number' ? data.shipTowerLevel : 1,
            fishStorageLevel: typeof data.fishStorageLevel === 'number' ? data.fishStorageLevel : 1,
            portDestroyed: !!data.portDestroyed,
            activeAd: data.activeAd || null,
            crewServices: data.crewServices || {},
            pirateClass: data.pirateClass || 'صياد البحار',
            server: data.server || 'سيرفر الأسطورة 1',
            tribeId: data.tribeId || '',
            tribeName: data.tribeName || '',
            tribeSnapshot: data.tribeSnapshot || null,
            friends: data.friends || [],
            friendRequests: data.friendRequests || [],
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        });

        // Only update tribes if fallbackTribesMap introduces missing or stronger tribe data
        if (fallbackTribesMap.size > 0) {
          setTribes(prev => {
            const map = new Map<string, any>();
            prev.forEach(t => map.set(t.id, t));
            let changed = false;
            fallbackTribesMap.forEach((snapT, tid) => {
              const cur = map.get(tid);
              const snapUpdated = String(snapT.lastUpdated || '');
              const curUpdated = String(cur?.lastUpdated || '');
              if (!cur || (snapT.power || 0) > (cur.power || 0) || snapUpdated > curUpdated) {
                map.set(tid, snapT);
                changed = true;
              }
            });
            return changed ? Array.from(map.values()) : prev;
          });
        }

        // Build canonical UID resolution map across migrated & same-email duplicate documents
        const aliasMap: Record<string, string> = {};
        const supersededUids = new Set<string>();
        for (const p of playerList) {
          if (p.migratedFromUid && p.migratedFromUid !== p.id) {
            aliasMap[p.migratedFromUid] = p.id;
            supersededUids.add(p.migratedFromUid);
          }
        }

        // Group same-email docs and pick the canonical active document (preferring currentUser.uid or highest updatedAt/progress)
        const byEmail = new Map<string, any[]>();
        for (const p of playerList) {
          if (p.email) {
            const list = byEmail.get(p.email) || [];
            list.push(p);
            byEmail.set(p.email, list);
          }
        }
        const canonicalEmailChosen = new Map<string, any>();
        byEmail.forEach((docsForEmail, emailKey) => {
          if (docsForEmail.length <= 1) {
            canonicalEmailChosen.set(emailKey, docsForEmail[0]);
            return;
          }
          const sorted = [...docsForEmail].sort((a, b) => {
            if (a.id === currentUser.uid) return -1;
            if (b.id === currentUser.uid) return 1;
            const aSup = supersededUids.has(a.id) ? 1 : 0;
            const bSup = supersededUids.has(b.id) ? 1 : 0;
            if (aSup !== bSup) return aSup - bSup;
            const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            if (tB !== tA) return tB - tA;
            return scoreAccountDocProgress(b) - scoreAccountDocProgress(a);
          });
          const winner = sorted[0];
          canonicalEmailChosen.set(emailKey, winner);
          for (const dup of sorted.slice(1)) {
            if (dup.id !== winner.id) {
              aliasMap[dup.id] = winner.id;
              supersededUids.add(dup.id);
            }
          }
        });

        uidAliasToCanonicalRef.current = aliasMap;

        const cleanMyEmail = (currentUser.email || localStorage.getItem('google_auth_email') || '').toLowerCase().trim();
        const myAliases: string[] = [];
        for (const p of playerList) {
          if (p.id === currentUser.uid) continue;
          let resolved = p.id;
          const seen = new Set<string>();
          while (aliasMap[resolved] && !seen.has(resolved)) {
            seen.add(resolved);
            resolved = aliasMap[resolved];
          }
          if (resolved === currentUser.uid || (cleanMyEmail && p.email === cleanMyEmail)) {
            myAliases.push(p.id);
          }
        }
        const sortedAliases = Array.from(new Set(myAliases)).sort();
        setMyAliasUids(prev => (prev.join(',') === sortedAliases.join(',') ? prev : sortedAliases));

        // Deduplicate leaderboard/visit list to canonical active documents only
        const uniquePlayersMap = new Map<string, any>();
        for (const p of playerList) {
          if (supersededUids.has(p.id) && p.id !== currentUser.uid) continue;
          const key = p.id || p.userId;
          if (!uniquePlayersMap.has(key)) {
            uniquePlayersMap.set(key, p);
          }
        }

        const nowMs = Date.now();
        const deduplicatedList = Array.from(uniquePlayersMap.values()).map((p: any) => {
          const targetKey = getTargetDefenderId(p) || p.id || p.userId;
          const overlay = targetKey ? recentAttackShipDamageRef.current[targetKey] : undefined;
          if (!overlay) return p;
          if (nowMs - overlay.appliedAt > 600000) {
            delete recentAttackShipDamageRef.current[targetKey];
            return p;
          }
          const incomingSig = getShipsSignature(p.ships);
          if (incomingSig === overlay.baselineShipsKey) {
            return {
              ...p,
              ships: overlay.ships,
              portDestroyed: overlay.portDestroyed
            };
          }
          delete recentAttackShipDamageRef.current[targetKey];
          return p;
        });
        deduplicatedList.sort((a, b) => (b.gold || 0) - (a.gold || 0));

        setRealPlayers(deduplicatedList);
      }, 1500);
    }, (err) => {
      console.warn("Could not listen to user profiles for leaderboard:", err.message || err);
    });
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [isLoggedIn, currentUser]);

  // --- Live Firestore Global Notifications Listener ---
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const mountTime = Date.now() - 4000;
    const qNotifs = query(
      collection(db, 'globalNotifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(qNotifs, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as GlobalNotification;
          const createdAtTime = new Date(data.createdAt).getTime();
          if (createdAtTime >= mountTime) {
            queueNotification({
              ...data,
              id: change.doc.id
            });
          }
        }
      });
    }, (err) => {
      if (err?.code !== 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, 'globalNotifications');
      }
    });

    return () => unsubscribe();
  }, [isLoggedIn, currentUser]);

  // --- Automated Milestone Tracker for Player Level & Facility Upgrades ---
  const prevPlayerLevel = useRef<number>(playerLevel);
  const prevFishStorage = useRef<number>(fishStorageLevel);
  const prevShipTowerLevel = useRef<number>(shipTowerLevel);

  useEffect(() => {
    if (playerLevel > prevPlayerLevel.current && prevPlayerLevel.current > 0) {
      sendGlobalNotification(
        'MILESTONE',
        '⭐ ارتقاء رتبة القبطان!',
        `بلغ القبطان @${username} المستوى ${playerLevel} ونال تقدير أساطيل البحار!`,
        undefined,
        '🏆'
      );
    }
    prevPlayerLevel.current = playerLevel;
  }, [playerLevel, username]);

  useEffect(() => {
    if (fishStorageLevel > prevFishStorage.current && prevFishStorage.current > 0) {
      sendGlobalNotification(
        'MILESTONE',
        '🐟 توسعة ميناء الصيد!',
        `قام القبطان @${username} بترقية بيت السمك إلى المستوى ${fishStorageLevel}!`,
        undefined,
        '🏛️'
      );
    }
    prevFishStorage.current = fishStorageLevel;
  }, [fishStorageLevel, username]);

  useEffect(() => {
    if (shipTowerLevel > prevShipTowerLevel.current && prevShipTowerLevel.current > 0) {
      sendGlobalNotification(
        'MILESTONE',
        '🏰 ترقية صرح الأسطول!',
        `قام القبطان @${username} بترقية برج السفن إلى المستوى ${shipTowerLevel}!`,
        undefined,
        '⚓'
      );
    }
    prevShipTowerLevel.current = shipTowerLevel;
  }, [shipTowerLevel, username]);

  latestUserStateRef.current = {
    battleReports,
    attackLogs,
    ships,
    gold,
    gems,
    redGems,
    activeAd,
    portDestroyed,
    username,
    avatar,
  };

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const inspectedPlayerShipVisitRef = useRef(inspectedPlayerShipVisit);
  inspectedPlayerShipVisitRef.current = inspectedPlayerShipVisit;
  const inspectedPlayerRef = useRef(inspectedPlayer);
  inspectedPlayerRef.current = inspectedPlayer;
  const loadingFirebaseRef = useRef(loadingFirebase);
  loadingFirebaseRef.current = loadingFirebase;
  const isPageHiddenRef = useRef(isPageHidden);
  isPageHiddenRef.current = isPageHidden;

  const scheduleAttackTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      attackTimersRef.current = attackTimersRef.current.filter(t => t !== id);
      fn();
    }, ms);
    attackTimersRef.current.push(id);
    return id;
  }, []);

  const clearAllAttackTimers = useCallback(() => {
    attackTimersRef.current.forEach(t => window.clearTimeout(t));
    attackTimersRef.current = [];
  }, []);

  const canSeeOwnHarborCombat = useCallback(() => {
    const hidden = isPageHiddenRef.current || (typeof document !== 'undefined' && document.hidden);
    return (
      activeTabRef.current === 'harbor' &&
      !inspectedPlayerShipVisitRef.current &&
      !inspectedPlayerRef.current &&
      !loadingFirebaseRef.current &&
      !hidden
    );
  }, []);

  const drainPendingAttackVisualsRef = useRef<() => void>(() => {});

  const startHarborAttackVisual = useCallback((effect: {
    type: 'ROCKET_SMALL' | 'ROCKET_MEDIUM' | 'ROCKET_LARGE' | 'ATOMIC_BOMB' | 'AD_BOMB';
    targetX: string;
    targetY: string;
    damage: number;
  }) => {
    clearAllAttackTimers();
    const token = ++attackVisualTokenRef.current;
    isPlayingAttackVisualRef.current = true;

    const safeX = typeof effect.targetX === 'string' && effect.targetX.includes('%') ? effect.targetX : '45%';
    const safeY = typeof effect.targetY === 'string' && effect.targetY.includes('%') ? effect.targetY : '49%';

    const completeCurrentVisual = (expectedToken?: number) => {
      if (typeof expectedToken === 'number' && expectedToken !== attackVisualTokenRef.current) return;
      if (token !== attackVisualTokenRef.current) return;
      clearAllAttackTimers();
      isPlayingAttackVisualRef.current = false;
      setOwnAttackEffect(null);
      setIsOwnHarborShaking(false);
      scheduleAttackTimer(() => {
        drainPendingAttackVisualsRef.current();
      }, 220);
    };

    finishOwnAttackVisualRef.current = () => completeCurrentVisual(token);

    if (effect.type === 'ROCKET_SMALL' || effect.type === 'ROCKET_MEDIUM' || effect.type === 'ROCKET_LARGE') {
      const flightMs = effect.type === 'ROCKET_SMALL' ? 750 : effect.type === 'ROCKET_MEDIUM' ? 900 : 1200;
      const explosionMs = effect.type === 'ROCKET_SMALL' ? 1050 : effect.type === 'ROCKET_MEDIUM' ? 1250 : 1450;
      if (effect.type === 'ROCKET_SMALL') playSmallRocketIncomingSound();
      else if (effect.type === 'ROCKET_MEDIUM') playMediumRocketIncomingSound();
      else playLargeRocketIncomingSound();

      setOwnAttackEffect({ type: effect.type, targetX: safeX, targetY: safeY, damage: effect.damage, phase: 'flying' });

      scheduleAttackTimer(() => {
        if (token !== attackVisualTokenRef.current) return;
        setOwnAttackEffect({ type: effect.type, targetX: safeX, targetY: safeY, damage: effect.damage, phase: 'impact' });
        setIsOwnHarborShaking(true);
        if (effect.type === 'ROCKET_SMALL') playSmallRocketExplosionSound();
        else if (effect.type === 'ROCKET_MEDIUM') playMediumRocketExplosionSound();
        else playLargeRocketExplosionSound();

        scheduleAttackTimer(() => {
          if (token === attackVisualTokenRef.current) setIsOwnHarborShaking(false);
        }, 650);
        scheduleAttackTimer(() => {
          completeCurrentVisual(token);
        }, explosionMs);
      }, flightMs);
    } else if (effect.type === 'ATOMIC_BOMB') {
      playAtomicBombDropSound();
      setOwnAttackEffect({ type: 'ATOMIC_BOMB', targetX: '45%', targetY: '48%', damage: effect.damage, phase: 'impact' });
      scheduleAttackTimer(() => {
        if (token !== attackVisualTokenRef.current) return;
        setIsOwnHarborShaking(true);
        playAtomicBombExplosionSound();
        scheduleAttackTimer(() => {
          if (token === attackVisualTokenRef.current) setIsOwnHarborShaking(false);
        }, 950);
      }, 1350);
      scheduleAttackTimer(() => {
        completeCurrentVisual(token);
      }, 4700);
    } else if (effect.type === 'AD_BOMB') {
      playAtomicBombDropSound();
      setOwnAttackEffect({ type: 'AD_BOMB', targetX: '48%', targetY: '52%', damage: effect.damage, phase: 'impact' });
      scheduleAttackTimer(() => {
        if (token !== attackVisualTokenRef.current) return;
        setIsOwnHarborShaking(true);
        playMediaBombExplosionSound();
        scheduleAttackTimer(() => {
          if (token === attackVisualTokenRef.current) setIsOwnHarborShaking(false);
        }, 900);
      }, 850);
      scheduleAttackTimer(() => {
        if (token === attackVisualTokenRef.current) {
          playDetonationWarningVoiceAndSound();
        }
      }, 2000);
      scheduleAttackTimer(() => {
        completeCurrentVisual(token);
      }, 2350);
    }
  }, [clearAllAttackTimers, scheduleAttackTimer]);

  const drainPendingAttackVisuals = useCallback(() => {
    if (isPlayingAttackVisualRef.current) return;
    if (!canSeeOwnHarborCombat()) return;
    if (pendingAttackEffectsRef.current.length === 0) return;
    const nextEffect = pendingAttackEffectsRef.current.shift();
    if (nextEffect) {
      startHarborAttackVisual(nextEffect);
    }
  }, [canSeeOwnHarborCombat, startHarborAttackVisual]);

  drainPendingAttackVisualsRef.current = drainPendingAttackVisuals;

  const playHarborAttackVisual = useCallback((effect: {
    type: 'ROCKET_SMALL' | 'ROCKET_MEDIUM' | 'ROCKET_LARGE' | 'ATOMIC_BOMB' | 'AD_BOMB';
    targetX: string;
    targetY: string;
    damage: number;
  }) => {
    setIncomingCombatFlash(true);
    setTimeout(() => setIncomingCombatFlash(false), 950);

    pendingAttackEffectsRef.current = [...pendingAttackEffectsRef.current.slice(-9), effect];
    drainPendingAttackVisuals();
  }, [drainPendingAttackVisuals]);

  // --- Live Firestore Harbor Events & Defender Defense Engine (Primary UID + Alias/Email Fallback, Atomic Batch) ---
  const myAliasKey = myAliasUids.join(',');
  useEffect(() => {
    if (!isLoggedIn || !currentUser || userDocReadyUid !== currentUser.uid) return;

    const aliasSet = new Set(myAliasUids);
    const cleanMyEmail = (currentUser.email || localStorage.getItem('google_auth_email') || '').toLowerCase().trim();

    const processHarborChanges = (changes: any[]) => {
      if (!changes || changes.length === 0) return;

      const curState = latestUserStateRef.current || {};
      let workingShips = Array.isArray(curState.ships) && curState.ships.length > 0 ? [...curState.ships] : [...shipsRef.current];
      let workingReports = Array.isArray(curState.battleReports) ? [...curState.battleReports] : [];
      let workingAttackLogs = Array.isArray(curState.attackLogs) ? [...curState.attackLogs] : [];
      let workingGold = typeof curState.gold === 'number' ? curState.gold : gold;
      let workingGems = typeof curState.gems === 'number' ? curState.gems : gems;
      let workingRedGems = typeof curState.redGems === 'number' ? curState.redGems : redGems;
      let workingPortDestroyed = Boolean(curState.portDestroyed);
      let workingActiveAd: string | null = curState.activeAd ?? null;

      let shipsChanged = false;
      let reportsChanged = false;
      let attackLogsChanged = false;
      let goldChanged = false;
      let gemsChanged = false;
      let redGemsChanged = false;
      let portChanged = false;
      let adChanged = false;
      let processedListChanged = false;

      for (const change of changes) {
        if (change.type !== 'added' && change.type !== 'modified') continue;

        const evDoc = change.doc;
        const ev = evDoc.data();
        const evId = evDoc.id;

        if (ev.type === 'TRIBE_JOIN_REQUEST' || ev.type === 'TRIBE_INVITE') {
          continue;
        }

        if ((ev.status && ev.status !== 'PENDING') || processedHarborEventIdsRef.current.has(evId)) {
          continue;
        }

        const isDirectPrimary = ev.defenderId === currentUser.uid;
        const isAliasMatch = aliasSet.has(ev.defenderId);
        const evTargetEmail = (ev.payload?.targetEmail || '').toLowerCase().trim();
        const isEmailMatch = Boolean(cleanMyEmail && evTargetEmail && evTargetEmail === cleanMyEmail);

        if (!isDirectPrimary && !isAliasMatch && !isEmailMatch) {
          continue;
        }

        processedHarborEventIdsRef.current.add(evId);
        processedListChanged = true;

        if (isDirectPrimary) {
          updateDoc(doc(db, 'harborEvents', evId), {
            status: 'PROCESSED',
            processedAt: new Date().toISOString(),
          }).catch(() => {});
        }

        try {
          const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

          if (
            ev.type === 'ROCKET_SMALL' ||
            ev.type === 'ROCKET_MEDIUM' ||
            ev.type === 'ROCKET_LARGE' ||
            ev.type === 'ATOMIC_BOMB' ||
            ev.type === 'AD_BOMB'
          ) {
            const fallbackDamageMap: Record<string, number> = {
              ROCKET_SMALL: 1000,
              ROCKET_MEDIUM: 5000,
              ROCKET_LARGE: 10000,
              AD_BOMB: 20000,
              ATOMIC_BOMB: 70000,
            };
            const dmg = typeof ev.payload?.damage === 'number' && ev.payload.damage > 0
              ? ev.payload.damage
              : (fallbackDamageMap[ev.type] ?? 1000);
            const targetShipId = ev.payload?.targetShipId;
            const targetShipIdx = typeof ev.payload?.targetShipIndex === 'number' ? ev.payload.targetShipIndex : 0;
            const attackerId = ev.attackerId || '';
            const attackerName = ev.attackerName || 'قبطان معادٍ';
            const attackerAvatar = ev.attackerAvatar || '☠️';
            const isAreaAttack = ev.type === 'ATOMIC_BOMB' || ev.type === 'AD_BOMB';

            const activeTargetCandidate =
              workingShips.find((s: any) => targetShipId && s.id === targetShipId) ||
              workingShips[targetShipIdx] ||
              workingShips.find((s: any) => s.exists !== false) ||
              workingShips[0];
            const resolvedTargetShipId = activeTargetCandidate?.id;
            const fallbackPos = (resolvedTargetShipId && docks[resolvedTargetShipId]) || { l: '45%', t: '49%' };
            const impactX = (typeof activeTargetCandidate?.left === 'string' && activeTargetCandidate.left.includes('%'))
              ? activeTargetCandidate.left
              : (typeof ev.payload?.targetX === 'string' && ev.payload.targetX.includes('%') ? ev.payload.targetX : fallbackPos.l);
            const impactY = (typeof activeTargetCandidate?.top === 'string' && activeTargetCandidate.top.includes('%'))
              ? activeTargetCandidate.top
              : (typeof ev.payload?.targetY === 'string' && ev.payload.targetY.includes('%') ? ev.payload.targetY : fallbackPos.t);

            workingShips = workingShips.map((s: any) => {
              const normalized = normalizeShipEnergyToCargo(s);
              const isHit = isAreaAttack || (resolvedTargetShipId ? normalized.id === resolvedTargetShipId : false);
              if (!isHit) return normalized;

              const maxH = getShipMaxHeart(normalized);
              const curH = typeof normalized.heart === 'number' ? Math.min(normalized.heart, maxH) : maxH;
              const newH = Math.max(0, curH - dmg);
              return {
                ...normalized,
                maxHeart: maxH,
                heart: newH,
                energySyncedToCargo: true,
                ...(newH <= 0 ? { moving: false, status: 'docked' as const } : {}),
              };
            });
            shipsChanged = true;

            const activeUpdated = workingShips.filter((s: any) => s.exists !== false);
            const isAllDestroyed = activeUpdated.length > 0 && activeUpdated.every((s: any) => typeof s.heart === 'number' && s.heart <= 0);
            workingPortDestroyed = isAllDestroyed;
            portChanged = true;

            const weaponMetaMap: Record<string, { title: string; icon: string }> = {
              ROCKET_SMALL: { title: 'قصف بصاروخ صغير', icon: '🚀' },
              ROCKET_MEDIUM: { title: 'قصف بصاروخ متوسط', icon: '🚀' },
              ROCKET_LARGE: { title: 'قصف بصاروخ كبير فتاك', icon: '🚀' },
              ATOMIC_BOMB: { title: 'ضربة قنبلة الموت الأسود', icon: '☢️' },
              AD_BOMB: { title: `هجوم رسالة التفجير${ev.payload?.adTitle ? ` (${ev.payload.adTitle})` : ''}`, icon: '📡' },
            };
            const wMeta = weaponMetaMap[ev.type] || { title: 'هجوم معادٍ', icon: '💥' };

            const rawReport = ev.payload?.newReport || {
              id: `report_${evId}`,
              opponent: attackerName,
              opponentName: attackerName,
              opponentAvatar: attackerAvatar,
              type: 'defense',
              result: 'defeat',
              isVictory: false,
              goldChange: 0,
              time: nowTime,
              date: new Date().toISOString(),
              title: isAllDestroyed ? '🚨 تم تدمير أسطولك ومينائك بالكامل!' : `🚨 ${wMeta.title} على مينائك!`,
              log: [`${wMeta.icon} قام القبطان @${attackerName} بمهاجمة مينائك (${wMeta.title}) ملحقاً ضرر ${dmg.toLocaleString()} من الطاقة!`]
            };
            const normalizedReport = {
              ...rawReport,
              opponent: rawReport.opponent || attackerName,
              opponentName: rawReport.opponentName || rawReport.opponent || attackerName,
              opponentAvatar: rawReport.opponentAvatar || attackerAvatar,
              isVictory: false,
              time: rawReport.time || nowTime,
            };

            workingReports = [normalizedReport, ...workingReports.filter((r: any) => r.id !== normalizedReport.id).slice(0, 29)];
            reportsChanged = true;

            const newAttackLog: AttackLogItem = {
              id: 'atk_' + evId,
              attackerId,
              attackerName,
              attackerAvatar,
              attackerLevel: ev.payload?.attackerLevel || 28,
              time: nowTime,
              title: `${wMeta.title} ${wMeta.icon}`,
              description: isAreaAttack
                ? `شن القبطان @${attackerName} ${wMeta.title} على جميع سفن أسطولك بضرر ${dmg.toLocaleString()} طاقة لكل سفينة!`
                : `استهدف القبطان @${attackerName} سفينتك (${activeTargetCandidate?.name || 'سفينة الأسطول'}) بـ ${wMeta.title} وألحق ضرر ${dmg.toLocaleString()} طاقة!`,
              goldLooted: 0,
              shipsDamaged: isAreaAttack ? activeUpdated.length : 1,
              isAvenged: false,
              date: new Date().toISOString(),
            };
            workingAttackLogs = [newAttackLog, ...workingAttackLogs.filter((a: any) => a.id !== newAttackLog.id).slice(0, 29)];
            attackLogsChanged = true;

            if (ev.type === 'AD_BOMB') {
              workingActiveAd = ev.payload?.adKey || 'luffy_king';
              adChanged = true;
            }

            playHarborAttackVisual({ type: ev.type, targetX: impactX, targetY: impactY, damage: dmg });

            setIncomingAttackAlert({
              id: evId,
              attackerId,
              attackerName,
              attackerAvatar,
              weaponTitle: wMeta.title,
              weaponIcon: wMeta.icon,
              summary: isAreaAttack
                ? `ضرر -${dmg.toLocaleString()} طاقة لجميع سفن الأسطول`
                : `استهداف (${activeTargetCandidate?.name || 'سفينة'}) بضرر -${dmg.toLocaleString()} طاقة`,
              damage: dmg,
              time: nowTime,
            });

            queueNotification({
              id: 'hb_' + evId,
              type: 'ATTACK',
              title: `🚨 ${wMeta.title}!`,
              message: `تعرض ميناؤك لهجوم مباشر من القبطان @${attackerName}!`,
              icon: wMeta.icon,
              authorId: attackerId,
              senderId: attackerId,
              authorName: attackerName,
              senderName: attackerName,
              createdAt: new Date().toISOString()
            });
            showToast(`🚨 هجوم معادٍ! هاجم القبطان @${attackerName} ميناءك بـ ${wMeta.title}!`, 'error');
          } else if (ev.type === 'DISABLE_DEFENSE') {
            const attackerId = ev.attackerId || '';
            const attackerName = ev.attackerName || 'قبطان معادٍ';
            const attackerAvatar = ev.attackerAvatar || '🛡️';
            const weaponLabel = ev.payload?.weaponLabel || 'سلاح تعطيل الدفاعات';

            const newDisableLog: AttackLogItem = {
              id: 'dis_' + evId,
              attackerId,
              attackerName,
              attackerAvatar,
              attackerLevel: ev.payload?.attackerLevel || 25,
              time: nowTime,
              title: `تعطيل الدفاعات ⚡`,
              description: `استخدم القبطان @${attackerName} [${weaponLabel}] لتعطيل منظومة دفاعك لمدة 10 دقائق!`,
              goldLooted: 0,
              shipsDamaged: 0,
              isAvenged: false,
              date: new Date().toISOString(),
            };
            workingAttackLogs = [newDisableLog, ...workingAttackLogs.filter((a: any) => a.id !== newDisableLog.id).slice(0, 29)];
            attackLogsChanged = true;

            setIncomingAttackAlert({
              id: evId,
              attackerId,
              attackerName,
              attackerAvatar,
              weaponTitle: weaponLabel,
              weaponIcon: '⚡',
              summary: 'تم تعطيل مضاد الصواريخ/القنابل في مينائك لمدة 10 دقائق!',
              time: nowTime,
            });

            queueNotification({
              id: 'hb_' + evId,
              type: 'ATTACK',
              title: `⚡ ${weaponLabel}!`,
              message: `قام القبطان @${attackerName} بتعطيل دفاعات مينائك لمدة 10 دقائق!`,
              icon: '⚡',
              authorId: attackerId,
              senderId: attackerId,
              authorName: attackerName,
              senderName: attackerName,
              createdAt: new Date().toISOString()
            });
            showToast(`⚡ تحذير! القبطان @${attackerName} استخدم [${weaponLabel}] على مينائك!`, 'error');
          } else if (ev.type === 'STEAL') {
            const stolenAmount = ev.payload?.amount || 0;
            const attackerId = ev.attackerId || '';
            const attackerName = ev.attackerName || 'لص';
            const attackerAvatar = ev.attackerAvatar || '🥷';
            workingGold = Math.max(0, workingGold - stolenAmount);
            goldChanged = true;

            const newStealLog: AttackLogItem = {
              id: 'steal_' + evId,
              attackerId,
              attackerName,
              attackerAvatar,
              attackerLevel: ev.payload?.attackerLevel || 25,
              time: nowTime,
              title: 'تسلل وسرقة ذهب 🏴‍☠️',
              description: `تسلل القبطان @${attackerName} وسرق 🪙 ${stolenAmount.toLocaleString()} ذهبة من مينائك!`,
              goldLooted: stolenAmount,
              shipsDamaged: 0,
              isAvenged: false,
              date: new Date().toISOString(),
            };
            workingAttackLogs = [newStealLog, ...workingAttackLogs.filter((a: any) => a.id !== newStealLog.id).slice(0, 29)];
            attackLogsChanged = true;

            setIncomingAttackAlert({
              id: evId,
              attackerId,
              attackerName,
              attackerAvatar,
              weaponTitle: 'تسلل وسرقة ذهب',
              weaponIcon: '🥷',
              summary: `تمت سرقة 🪙 ${stolenAmount.toLocaleString()} ذهبة من خزينتك!`,
              goldLost: stolenAmount,
              time: nowTime,
            });

            queueNotification({
              id: 'hb_' + evId,
              type: 'ATTACK',
              title: '🏴‍☠️ تسلل ولصوص!',
              message: `تسلل القبطان @${attackerName} وسرق 🪙 ${stolenAmount.toLocaleString()} ذهبة من مينائك! هل تريد رد الهجوم؟`,
              icon: '🥷',
              authorId: attackerId,
              senderId: attackerId,
              authorName: attackerName,
              senderName: attackerName,
              createdAt: new Date().toISOString()
            });
            showToast(`🏴‍☠️ تسلل ولصوص! تسلل القبطان @${attackerName} وسرق 🪙 ${stolenAmount.toLocaleString()} ذهبة من مينائك!`, 'error');
          } else if (ev.type === 'REPAIR') {
            const healAmount = ev.payload?.healAmount || 500;
            const healPercent = typeof ev.payload?.healPercent === 'number' ? ev.payload.healPercent : null;
            const targetShipId = ev.payload?.targetShipId;
            const helperName = ev.attackerName || 'صديق';
            workingShips = workingShips.map((s: any) => {
              const normalized = normalizeShipEnergyToCargo(s);
              if (targetShipId && normalized.id !== targetShipId) return normalized;
              const maxH = getShipMaxHeart(normalized);
              const curH = typeof normalized.heart === 'number' ? Math.min(normalized.heart, maxH) : maxH;
              const delta = healPercent !== null ? calculateWeaponShipDamage(maxH, healPercent) : healAmount;
              const newH = Math.min(maxH, curH + delta);
              return { ...normalized, maxHeart: maxH, heart: newH, energySyncedToCargo: true };
            });
            shipsChanged = true;

            const activeUpdated = workingShips.filter((s: any) => s.exists !== false);
            workingPortDestroyed = activeUpdated.length > 0 && activeUpdated.every((s: any) => typeof s.heart === 'number' && s.heart <= 0);
            portChanged = true;

            queueNotification({
              id: 'hb_' + evId,
              type: 'SUPPORT',
              title: '🛡️ دعم وصيانة حليفة!',
              message: `أرسل القبطان الشهم @${helperName} طاقم صيانة وقام بترميم سفنك! ✨`,
              icon: '🔧',
              createdAt: new Date().toISOString()
            });
            showToast(`🤝 صيانة صديقة! قام القبطان @${helperName} بإصلاح وترميم سفنك! ✨`, 'success');
          } else if (ev.type === 'DONATION' || ev.type === 'GIFT') {
            const giftAmount = ev.payload?.amount || 500;
            const senderName = ev.attackerName || ev.payload?.senderName || 'صديق';
            workingGold = workingGold + giftAmount;
            goldChanged = true;

            queueNotification({
              id: 'hb_' + evId,
              type: 'SUPPORT',
              title: '🎁 وصول دعم مالي!',
              message: `أرسل لك القبطان @${senderName} هدية مالية بقيمة 🪙 ${giftAmount.toLocaleString()} ذهبة! 🎉`,
              icon: '🤝',
              createdAt: new Date().toISOString()
            });
            showToast(`🎁 هدية ذهب! أرسل لك القبطان @${senderName} مبلغ 🪙 ${giftAmount.toLocaleString()} ذهبة! 🎉`, 'success');
          } else if (ev.type === 'DETONATION_MESSAGE') {
            const attackerId = ev.attackerId || '';
            const sender = ev.attackerName || 'قبطان معادٍ';
            const customMsg = ev.payload?.message || '';
            setIncomingAttackAlert(prev => prev ? {
              ...prev,
              customMessage: customMsg,
            } : {
              id: 'det_msg_' + evId,
              attackerId,
              attackerName: sender,
              attackerAvatar: ev.attackerAvatar || '📡',
              weaponTitle: 'رسالة تفجير مباشرة',
              weaponIcon: '✉️',
              summary: 'تلقيت رسالة تهديد مباشرة بعد القصف!',
              customMessage: customMsg,
              time: nowTime,
            });
            queueNotification({
              id: 'det_msg_' + evId,
              type: 'ATTACK',
              title: `📡 رسالة تفجير من القبطان @${sender}!`,
              message: `"${customMsg}"`,
              icon: '✉️',
              authorId: attackerId,
              senderId: attackerId,
              authorName: sender,
              senderName: sender,
              createdAt: new Date().toISOString()
            });
            showToast(`✉️ وصلتك رسالة تفجير من القبطان @${sender}: "${customMsg}"`, 'info');
          } else if (ev.type === 'LOOT') {
            const lootType = ev.payload?.lootType || 'gold';
            const lootAmt = ev.payload?.amount || 1000;
            const attackerId = ev.attackerId || '';
            const attackerName = ev.attackerName || 'قبطان معادٍ';
            if (lootType === 'gold') {
              workingGold = Math.max(0, workingGold - lootAmt);
              goldChanged = true;
            } else if (lootType === 'gems') {
              workingGems = Math.max(0, workingGems - lootAmt);
              gemsChanged = true;
            } else if (lootType === 'redGems') {
              workingRedGems = Math.max(0, workingRedGems - lootAmt);
              redGemsChanged = true;
            }
            const lootLabel = lootType === 'gold' ? `🪙 ${lootAmt.toLocaleString()} ذهبة` : lootType === 'gems' ? `💎 ${lootAmt} جوهرة` : `🔴 ${lootAmt} جوهرة حمراء`;

            const newLootLog: AttackLogItem = {
              id: 'loot_' + evId,
              attackerId,
              attackerName,
              attackerAvatar: ev.attackerAvatar || '💰',
              attackerLevel: ev.payload?.attackerLevel || 25,
              time: nowTime,
              title: 'غنائم قرصنة 🏴‍☠️',
              description: `غنم القبطان @${attackerName} من مينائك ${lootLabel}!`,
              goldLooted: lootType === 'gold' ? lootAmt : 0,
              shipsDamaged: 0,
              isAvenged: false,
              date: new Date().toISOString(),
            };
            workingAttackLogs = [newLootLog, ...workingAttackLogs.filter((a: any) => a.id !== newLootLog.id).slice(0, 29)];
            attackLogsChanged = true;

            setIncomingAttackAlert({
              id: evId,
              attackerId,
              attackerName,
              attackerAvatar: ev.attackerAvatar || '💰',
              weaponTitle: 'غنائم قرصنة',
              weaponIcon: '🏴‍☠️',
              summary: `غنم القبطان @${attackerName} من مينائك ${lootLabel}!`,
              time: nowTime,
            });
            showToast(`🏴‍☠️ غنم القبطان @${attackerName} ${lootLabel} من مينائك!`, 'error');
          } else if (ev.type === 'TRIBE_JOIN_APPROVED') {
            const approvedTribeId = ev.payload?.tribeId || '';
            const approvedTribeName = ev.payload?.tribeName || 'القبيلة';
            const approvedTribeEmblem = ev.payload?.tribeEmblem || '🛡️';
            const approvedTribeSnap = ev.payload?.tribeSnapshot || null;
            const leaderName = ev.attackerName || ev.payload?.leaderName || 'شيخ القبيلة';
            if (approvedTribeId) {
              setTribeId(approvedTribeId);
              setTribeName(approvedTribeName);
              try {
                localStorage.setItem('pirate_tribe_id', approvedTribeId);
                localStorage.setItem('pirate_tribe_name', approvedTribeName);
              } catch {}
              if (approvedTribeSnap) {
                setTribes(prev => {
                  const exists = prev.some(t => t.id === approvedTribeId);
                  return exists
                    ? prev.map(t => (t.id === approvedTribeId ? approvedTribeSnap : t))
                    : [approvedTribeSnap, ...prev];
                });
              }
              updateDoc(doc(db, 'users', currentUser.uid), {
                tribeId: approvedTribeId,
                tribeName: approvedTribeName,
                ...(approvedTribeSnap ? { tribeSnapshot: approvedTribeSnap } : {}),
                updatedAt: new Date().toISOString()
              }).catch(() => {});
            }
            queueNotification({
              id: 'tja_' + evId,
              type: 'SUPPORT',
              title: '🎉 تمت الموافقة على انضمامك!',
              message: `وافق شيخ القبيلة @${leaderName} على انضمامك إلى قبيلة [${approvedTribeName}]!`,
              icon: approvedTribeEmblem,
              createdAt: new Date().toISOString()
            });
            showToast(`🎉 وافق شيخ القبيلة @${leaderName} على انضمامك إلى قبيلة [${approvedTribeName}]!`, 'success');
          } else if (ev.type === 'TRIBE_JOIN_REJECTED') {
            const rejectedTribeName = ev.payload?.tribeName || 'القبيلة';
            const leaderName = ev.attackerName || ev.payload?.leaderName || 'شيخ القبيلة';
            queueNotification({
              id: 'tjr_' + evId,
              type: 'ATTACK',
              title: '❌ تم رفض طلب الانضمام',
              message: `رفض شيخ القبيلة @${leaderName} طلب انضمامك إلى قبيلة [${rejectedTribeName}].`,
              icon: '🛡️',
              createdAt: new Date().toISOString()
            });
            showToast(`❌ رفض شيخ القبيلة @${leaderName} طلب انضمامك إلى قبيلة [${rejectedTribeName}].`, 'error');
          } else if (ev.type === 'TRIBE_INVITE_ACCEPTED') {
            const joinedMemberId = ev.payload?.memberId || ev.attackerId || '';
            const joinedMemberName = ev.payload?.memberName || ev.attackerName || 'قبطان';
            const invTribeId = ev.payload?.tribeId || '';
            const invTribeName = ev.payload?.tribeName || 'القبيلة';
            const invTribeEmblem = ev.payload?.tribeEmblem || '🛡️';
            if (joinedMemberId && invTribeId) {
              setTribes((prev) =>
                prev.map((t) => {
                  if (t.id !== invTribeId) return t;
                  const membersList = Array.isArray(t.members) ? t.members : [currentUser.uid];
                  if (membersList.includes(joinedMemberId)) return t;
                  const nextMembers = Array.from(new Set([...membersList, joinedMemberId]));
                  const updatedT = {
                    ...t,
                    members: nextMembers,
                    membersCount: nextMembers.length,
                    lastUpdated: new Date().toISOString(),
                  };
                  try {
                    const stored = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
                    const nextStored = stored.some((st: any) => st.id === updatedT.id)
                      ? stored.map((st: any) => (st.id === updatedT.id ? updatedT : st))
                      : [updatedT, ...stored];
                    localStorage.setItem('pirate_local_tribes', JSON.stringify(nextStored));
                  } catch {}
                  updateDoc(doc(db, 'users', currentUser.uid), {
                    tribeSnapshot: updatedT,
                    updatedAt: new Date().toISOString(),
                  }).catch(() => {});
                  updateDoc(doc(db, 'tribes', updatedT.id), {
                    members: nextMembers,
                    membersCount: nextMembers.length,
                    lastUpdated: new Date().toISOString(),
                  }).catch(() => {});
                  return updatedT;
                })
              );
            }
            queueNotification({
              id: 'tia_' + evId,
              type: 'SUPPORT',
              title: '🎉 قبول دعوة القبيلة!',
              message: `قبل القبطان @${joinedMemberName} دعوتك وانضم إلى قبيلة [${invTribeName}]!`,
              icon: invTribeEmblem,
              createdAt: new Date().toISOString(),
            });
            showToast(`🎉 قبل القبطان @${joinedMemberName} الدعوة وانضم إلى قبيلة [${invTribeName}]!`, 'success');
          } else if (ev.type === 'TRIBE_INVITE_DECLINED') {
            const declinedByName = ev.payload?.recipientName || ev.attackerName || 'قبطان';
            const invTribeName = ev.payload?.tribeName || 'القبيلة';
            queueNotification({
              id: 'tid_' + evId,
              type: 'MILESTONE',
              title: '📩 تم رفض الدعوة',
              message: `رفض القبطان @${declinedByName} دعوة الانضمام إلى قبيلة [${invTribeName}].`,
              icon: '📩',
              createdAt: new Date().toISOString(),
            });
            showToast(`📩 رفض القبطان @${declinedByName} دعوة الانضمام إلى قبيلة [${invTribeName}].`, 'info');
          }
        } catch (procErr) {
          console.error("Error processing harbor event:", procErr);
        }
      }

      if (!processedListChanged) return;

      const persistedEventIds = Array.from(processedHarborEventIdsRef.current).slice(-120);
      try { localStorage.setItem('pirate_processed_harbor_events', JSON.stringify(persistedEventIds)); } catch {}

      const userDocRef = doc(db, 'users', currentUser.uid);
      const dbPatch: Record<string, any> = {
        processedHarborEventIds: persistedEventIds,
        updatedAt: new Date().toISOString()
      };

      if (shipsChanged) {
        setShips(workingShips);
        dbPatch.ships = workingShips;
        try {
          localStorage.setItem('pirate_ships_v2', JSON.stringify(workingShips));
          localStorage.setItem('pirate_ships', JSON.stringify(workingShips));
        } catch {}
      }
      if (portChanged) {
        setPortDestroyed(workingPortDestroyed);
        dbPatch.portDestroyed = workingPortDestroyed;
        try { localStorage.setItem('pirate_port_destroyed', workingPortDestroyed ? 'true' : 'false'); } catch {}
      }
      if (reportsChanged) {
        setBattleReports(workingReports);
        dbPatch.battleReports = workingReports;
        try { localStorage.setItem('pirate_battle_reports', JSON.stringify(workingReports)); } catch {}
      }
      if (attackLogsChanged) {
        setAttackLogs(workingAttackLogs);
        dbPatch.attackLogs = workingAttackLogs;
        try { localStorage.setItem('pirate_attack_logs', JSON.stringify(workingAttackLogs)); } catch {}
      }
      if (goldChanged) {
        setGold(workingGold);
        dbPatch.gold = workingGold;
        try { localStorage.setItem('gold', String(workingGold)); } catch {}
      }
      if (gemsChanged) {
        setGems(workingGems);
        dbPatch.gems = workingGems;
        try { localStorage.setItem('gems', String(workingGems)); } catch {}
      }
      if (redGemsChanged) {
        setRedGems(workingRedGems);
        dbPatch.redGems = workingRedGems;
        try { localStorage.setItem('pirate_red_gems', String(workingRedGems)); } catch {}
      }
      if (adChanged && workingActiveAd) {
        setActiveAd(workingActiveAd);
        dbPatch.activeAd = workingActiveAd;
        try { localStorage.setItem('pirate_active_ad', workingActiveAd); } catch {}
      }

      latestUserStateRef.current = {
        ...latestUserStateRef.current,
        ships: workingShips,
        portDestroyed: workingPortDestroyed,
        battleReports: workingReports,
        attackLogs: workingAttackLogs,
        gold: workingGold,
        gems: workingGems,
        redGems: workingRedGems,
        activeAd: workingActiveAd,
      };

      if (lastDbData.current) {
        lastDbData.current = {
          ...lastDbData.current,
          ...(shipsChanged ? { ships: workingShips.map((s: any) => ({ ...s, moving: false })) } : {}),
          ...(portChanged ? { portDestroyed: workingPortDestroyed } : {}),
          ...(reportsChanged ? { battleReports: workingReports } : {}),
          ...(attackLogsChanged ? { attackLogs: workingAttackLogs } : {}),
          ...(goldChanged ? { gold: workingGold } : {}),
          ...(gemsChanged ? { gems: workingGems } : {}),
          ...(redGemsChanged ? { redGems: workingRedGems } : {}),
          ...(adChanged && workingActiveAd ? { activeAd: workingActiveAd } : {}),
        };
      }

      updateDoc(userDocRef, dbPatch).catch(console.error);
    };

    // 1. Primary listener targeting active authenticated UID
    const qPrimary = query(
      collection(db, 'harborEvents'),
      where('defenderId', '==', currentUser.uid)
    );
    const unsubPrimary = onSnapshot(qPrimary, (snapshot) => {
      processHarborChanges(snapshot.docChanges());
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'harborEvents');
    });

    // 2. Fallback listener for PENDING events targeting any superseded/alias UID or matching email
    const qPending = query(
      collection(db, 'harborEvents'),
      where('status', '==', 'PENDING')
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      processHarborChanges(snapshot.docChanges());
    }, (err) => {
      console.warn('Pending harborEvents listener warning:', err?.message || err);
    });

    return () => {
      unsubPrimary();
      unsubPending();
    };
  }, [isLoggedIn, currentUser, userDocReadyUid, myAliasKey, playHarborAttackVisual]);

  // --- Replay queued incoming attack visuals as soon as defender returns to their own Harbor ---
  useEffect(() => {
    if (
      activeTab === 'harbor' &&
      !inspectedPlayerShipVisit &&
      !inspectedPlayer &&
      !loadingFirebase &&
      !isPageHidden &&
      pendingAttackEffectsRef.current.length > 0 &&
      !isPlayingAttackVisualRef.current
    ) {
      const timer = window.setTimeout(() => {
        drainPendingAttackVisuals();
      }, 200);
      return () => window.clearTimeout(timer);
    }
  }, [activeTab, inspectedPlayerShipVisit, inspectedPlayer, loadingFirebase, isPageHidden, drainPendingAttackVisuals]);

  // --- Live Firestore Friend Requests Subscription ---
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    // 1. Listen to incoming pending requests
    const qIncoming = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'PENDING')
    );

    const unsubIncoming = onSnapshot(qIncoming, (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setFriendRequests(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'friendRequests');
    });

    // 2. Listen to outgoing requests accepted by target players
    const qAccepted = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', currentUser.uid),
      where('status', '==', 'ACCEPTED')
    );

    const unsubAccepted = onSnapshot(qAccepted, async (snap) => {
      for (const d of snap.docs) {
        const data = d.data();
        const newFriendId = data.receiverId;
        if (newFriendId && !friends.includes(newFriendId)) {
          const updated = Array.from(new Set([...friends, newFriendId]));
          setFriends(updated);
          try {
            await updateDoc(doc(db, 'users', currentUser.uid), { friends: updated });
          } catch (e) {
            console.warn("Could not update accepted friends locally:", e);
          }
        }
        // Remove processed accepted request
        deleteDoc(doc(db, 'friendRequests', d.id)).catch(() => {});
      }
    }, (err) => {
      console.warn("Could not subscribe to accepted friend requests:", err.message || err);
    });

    return () => {
      unsubIncoming();
      unsubAccepted();
    };
  }, [isLoggedIn, currentUser, friends]);

  // --- Live Firestore Tribe Join Requests Subscription (for Tribe Leaders & Applicants) ---
  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      setIncomingTribeJoinRequests([]);
      setOutgoingTribeJoinRequests([]);
      return;
    }
    if (userDocReadyUid !== currentUser.uid) return;

    const aliasSet = new Set(myAliasUids);
    const cleanMyEmail = (currentUser.email || localStorage.getItem('google_auth_email') || '').toLowerCase().trim();

    const qTribeJoinReqs = query(
      collection(db, 'harborEvents'),
      where('type', '==', 'TRIBE_JOIN_REQUEST'),
      where('status', '==', 'PENDING')
    );

    const unsubscribe = onSnapshot(qTribeJoinReqs, (snap) => {
      const incomingList: TribeJoinRequest[] = [];
      const outgoingList: TribeJoinRequest[] = [];

      snap.forEach((d) => {
        const ev = d.data();
        const payload = ev.payload || {};
        const targetEmail = (payload.targetEmail || '').toLowerCase().trim();
        const isForMeAsLeader =
          ev.defenderId === currentUser.uid ||
          aliasSet.has(ev.defenderId) ||
          Boolean(cleanMyEmail && targetEmail && targetEmail === cleanMyEmail);

        const reqObj: TribeJoinRequest = {
          id: d.id,
          tribeId: payload.tribeId || '',
          tribeName: payload.tribeName || 'قبيلة',
          tribeEmblem: payload.tribeEmblem || '🛡️',
          leaderId: ev.defenderId || payload.leaderId || '',
          leaderName: payload.leaderName || '',
          applicantId: ev.attackerId || payload.applicantId || '',
          applicantName: ev.attackerName || payload.applicantName || 'قبطان',
          applicantAvatar: ev.attackerAvatar || payload.applicantAvatar || '⚓',
          applicantLevel: typeof payload.applicantLevel === 'number' ? payload.applicantLevel : 1,
          applicantPower: typeof payload.applicantPower === 'number' ? payload.applicantPower : 0,
          status: 'PENDING',
          createdAt: ev.createdAt || new Date().toISOString(),
        };

        if (isForMeAsLeader && reqObj.applicantId !== currentUser.uid) {
          incomingList.push(reqObj);
          if (!notifiedTribeJoinRequestIdsRef.current.has(d.id)) {
            notifiedTribeJoinRequestIdsRef.current.add(d.id);
            queueNotification({
              id: 'tjr_notif_' + d.id,
              type: 'TRIBE_JOIN',
              title: '🛡️ طلب انضمام للقبيلة!',
              message: `يرغب القبطان @${reqObj.applicantName} في الانضمام إلى قبيلة [${reqObj.tribeName}]`,
              icon: reqObj.tribeEmblem || '🛡️',
              authorId: reqObj.applicantId,
              authorName: reqObj.applicantName,
              tribeRequestId: reqObj.id,
              createdAt: reqObj.createdAt || new Date().toISOString(),
            });
            showToast(`📩 طلب انضمام جديد للقبيلة من القبطان @${reqObj.applicantName}!`, 'info');
          }
        }

        if (ev.attackerId === currentUser.uid) {
          outgoingList.push(reqObj);
        }
      });

      incomingList.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      outgoingList.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      setIncomingTribeJoinRequests(incomingList);
      setOutgoingTribeJoinRequests(outgoingList);
    }, (err) => {
      console.warn('Tribe join requests listener warning:', err?.message || err);
    });

    return () => unsubscribe();
  }, [isLoggedIn, currentUser, userDocReadyUid, myAliasKey]);

  // --- Live Firestore Tribe Invitations Subscription (for Invited Players) ---
  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      setIncomingTribeInvitations([]);
      return;
    }
    if (userDocReadyUid !== currentUser.uid) return;

    const aliasSet = new Set(myAliasUids);
    const cleanMyEmail = (currentUser.email || localStorage.getItem('google_auth_email') || '').toLowerCase().trim();

    const qTribeInvites = query(
      collection(db, 'harborEvents'),
      where('type', '==', 'TRIBE_INVITE'),
      where('status', '==', 'PENDING')
    );

    const unsubscribe = onSnapshot(qTribeInvites, (snap) => {
      const list: TribeInvitation[] = [];
      snap.forEach((d) => {
        const ev = d.data();
        const payload = ev.payload || {};
        const targetEmail = (payload.targetEmail || '').toLowerCase().trim();
        const isForMe =
          ev.defenderId === currentUser.uid ||
          aliasSet.has(ev.defenderId) ||
          Boolean(cleanMyEmail && targetEmail && targetEmail === cleanMyEmail);

        if (!isForMe || ev.attackerId === currentUser.uid) return;

        const invObj: TribeInvitation = {
          id: d.id,
          tribeId: payload.tribeId || '',
          tribeName: payload.tribeName || 'قبيلة',
          tribeEmblem: payload.tribeEmblem || '🛡️',
          tribeLevel: typeof payload.tribeLevel === 'number' ? payload.tribeLevel : 1,
          leaderId: payload.leaderId || '',
          leaderName: payload.leaderName || '',
          inviterId: ev.attackerId || payload.inviterId || '',
          inviterName: ev.attackerName || payload.inviterName || 'قبطان',
          inviterAvatar: ev.attackerAvatar || payload.inviterAvatar || '⚓',
          recipientId: ev.defenderId || currentUser.uid,
          recipientName: payload.recipientName || '',
          status: 'PENDING',
          createdAt: ev.createdAt || new Date().toISOString(),
        };

        list.push(invObj);

        if (!notifiedTribeInviteIdsRef.current.has(d.id)) {
          notifiedTribeInviteIdsRef.current.add(d.id);
          queueNotification({
            id: 'ti_notif_' + d.id,
            type: 'TRIBE_INVITE',
            title: '📩 دعوة للانضمام إلى قبيلة!',
            message: `دعاك القبطان @${invObj.inviterName} للانضمام إلى قبيلة [${invObj.tribeName}]`,
            icon: invObj.tribeEmblem || '📩',
            authorId: invObj.inviterId,
            authorName: invObj.inviterName,
            tribeInviteId: invObj.id,
            createdAt: invObj.createdAt || new Date().toISOString(),
          });
          showToast(`📩 وصلك إشعار دعوة للانضمام إلى قبيلة [${invObj.tribeName}] من @${invObj.inviterName}!`, 'info');
        }
      });

      list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      setIncomingTribeInvitations(list);
    }, (err) => {
      console.warn('Tribe invitations listener warning:', err?.message || err);
    });

    return () => unsubscribe();
  }, [isLoggedIn, currentUser, userDocReadyUid, myAliasKey]);

  // --- Synchronize Inspected Player State in Real-Time ---
  useEffect(() => {
    if (inspectedPlayer) {
      const targetId = getTargetDefenderId(inspectedPlayer);
      const updated = realPlayers.find(p => p.id === targetId || p.userId === targetId || p.userId === inspectedPlayer.userId);
      if (updated) {
        setInspectedPlayer(updated);

        // Update selected visited ship details if open
        if (selectedVisitedShip) {
          const updatedShip = updated.ships?.find((s: any) => s.id === selectedVisitedShip.id);
          if (updatedShip) {
            setSelectedVisitedShip(updatedShip);
          }
        }
      }
    }
  }, [realPlayers, inspectedPlayer?.userId, inspectedPlayer?.id, selectedVisitedShip?.id]);

  // --- Handle Login ---
  const handleLoginSuccess = async (user: string, av: string, serv: string, pCl: string) => {
    isSessionTerminated.current = false;
    setSessionTerminationNotice(null);
    localStorage.removeItem('pirate_login_in_progress');

    const authUser = auth.currentUser;
    if (!isLoadedFromFirebase.current || (authUser && activeAuthUidRef.current !== authUser.uid)) {
      setUsername(user);
      setAvatar(av);
      setServer(serv);
      setPirateClass(pCl);
    }
    setIsLoggedIn(true);

    if (authUser) {
      await registerNewUserSession(authUser.uid);
      if (!isLoadedFromFirebase.current || activeAuthUidRef.current !== authUser.uid) {
        await loadAndSubscribeUserDocRef.current?.(authUser, { forceTakeoverSession: true });
      }
    }
  };

  // --- Handle Logout ---
  const handleLogout = async () => {
    setActiveSettingsModal(null);
    setActiveTab('harbor');
    clearLocalSessionId();
    isSessionTerminated.current = false;
    setSessionTerminationNotice(null);
    
    isDeletingAccount.current = true;
    isLoadedFromFirebase.current = false;

    // Cancel any pending auto-save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (unsubUserSnapshot.current) {
      unsubUserSnapshot.current();
      unsubUserSnapshot.current = null;
    }

    const user = auth.currentUser;
    const token = localStorage.getItem('google_auth_token') || '';
    const cleanEmail = (user?.email || localStorage.getItem('google_auth_email') || '').toLowerCase().trim();

    // 1. Ensure latest player progress & achievements are securely preserved in Firestore database
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const currentData = {
          userId: user.uid,
          ...buildCurrentUserPayload(cleanEmail),
          isOnline: false,
          lastActive: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, currentData, { merge: true });
      } catch (saveErr) {
        console.warn("Error saving snapshot before logout:", saveErr);
      }
    }

    // 2. Send API request to server to terminate current session
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: user?.uid,
          email: cleanEmail,
          token
        })
      });
    } catch (apiErr) {
      console.warn("Logout API call error:", apiErr);
    }

    // 3. Clear user tokens and session keys from localStorage
    localStorage.setItem('pirate_is_logged_in', 'false');
    localStorage.removeItem('google_auth_token');
    localStorage.removeItem('google_auth_email');
    localStorage.removeItem('google_auth_name');
    localStorage.removeItem('google_auth_avatar');

    // 4. Reset React states to defaults
    resetStateToDefaults();

    // 5. Sign out from Firebase Auth
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Error signing out from Firebase:", err);
    }

    setIsLoggedIn(false);
    setAuthScreen('login');
    isDeletingAccount.current = false;

    showToast('✅ تم تسجيل الخروج بنجاح. تم حفظ كافة بيانات حسابك وتقدمك في السيرفر ويمكنك استرجاعها من أي جهاز.', 'success');
  };

  // --- Permanent Account Deletion ---
  const handleDeleteAccountPermanently = async () => {
    const user = auth.currentUser;
    const storedEmail = localStorage.getItem('google_auth_email') || '';
    const token = localStorage.getItem('google_auth_token') || '';

    if (!user && !storedEmail) {
      showToast('⚠️ لا يوجد حساب متصل لحذفه.', 'error');
      return;
    }

    try {
      isDeletingAccount.current = true;
      isLoadedFromFirebase.current = false;

      // Cancel any pending auto-save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      if (unsubUserSnapshot.current) {
        unsubUserSnapshot.current();
        unsubUserSnapshot.current = null;
      }

      const uid = user ? user.uid : '';
      const cleanEmail = (user?.email || storedEmail || '').toLowerCase().trim();

      // 1. Send API request to server to execute/log permanent deletion
      try {
        await fetch('/api/auth/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userId: uid,
            email: cleanEmail,
            token
          })
        });
      } catch (apiDelErr) {
        console.warn("Delete account server API error:", apiDelErr);
      }

      // 2. Clean up user from tribe if member or leader
      if (tribeId) {
        try {
          const tribeDocRef = doc(db, 'tribes', tribeId);
          const tribeSnap = await getDoc(tribeDocRef);
          if (tribeSnap.exists()) {
            const tData = tribeSnap.data();
            const updatedMembers = (tData.members || []).filter((m: any) => m !== uid && (typeof m === 'string' ? m !== uid : m.userId !== uid && m.id !== uid));
            if (updatedMembers.length === 0) {
              await deleteDoc(tribeDocRef).catch(() => {});
            } else {
              await setDoc(tribeDocRef, {
                members: updatedMembers,
                membersCount: updatedMembers.length
              }, { merge: true }).catch(() => {});
            }
          }
        } catch (tErr) {
          console.error("Error removing user from tribe on deletion:", tErr);
        }
      }

      // 3. Delete user document from Firestore (keyed by UID)
      if (uid) {
        try {
          await deleteDoc(doc(db, 'users', uid));
        } catch (delErr) {
          console.error("Error deleting user doc by UID:", delErr);
        }
      }

      // 4. Remove user from all other players' friends and friendRequests, and delete any residual documents
      try {
        const allUsersSnap = await getDocs(collection(db, 'users'));
        for (const d of allUsersSnap.docs) {
          const data = d.data();
          const dEmail = (data.email || '').toLowerCase().trim();
          const docUserId = data.userId || d.id;

          // Delete residual user document if it belongs to this player
          if (docUserId === uid || d.id === uid || (cleanEmail && dEmail && dEmail === cleanEmail)) {
            await deleteDoc(doc(db, 'users', d.id)).catch(() => {});
          }
        }
      } catch (scanErr) {
        console.error("Error scanning and cleaning up friends/residual documents:", scanErr);
      }

      // 5. Update leaderboard UI and friends lists immediately
      setRealPlayers(prev => prev.filter(p => p.id !== uid && p.userId !== uid && (!cleanEmail || p.email !== cleanEmail)));
      setFriends([]);
      setFriendRequests([]);

      // 6. Clear all storage keys completely
      localStorage.setItem('pirate_is_logged_in', 'false');
      localStorage.removeItem('google_auth_token');
      localStorage.removeItem('google_auth_email');
      localStorage.removeItem('google_auth_name');
      localStorage.removeItem('google_auth_avatar');

      // 7. Reset React states completely
      resetStateToDefaults();

      // 8. Delete Firebase Auth User & Sign Out
      if (user) {
        try {
          await user.delete();
        } catch (authDelErr) {
          console.warn("Firebase auth delete fallback to signOut:", authDelErr);
          await auth.signOut();
        }
      } else {
        await auth.signOut().catch(() => {});
      }

      setIsLoggedIn(false);
      setAuthScreen('login');
      setActiveSettingsModal(null);

      showToast('✅ تم حذف الحساب نهائياً وإزالته من الترتيب العام وقوائم الأصدقاء وقاعدة البيانات.', 'success');
    } catch (err: any) {
      console.error("Error deleting account permanently:", err);
      showToast('❌ حدث خطأ أثناء حذف الحساب: ' + (err.message || 'حاول مجدداً'), 'error');
    } finally {
      setTimeout(() => {
        isDeletingAccount.current = false;
      }, 3000);
    }
  };

  // --- Open Action Menu for ship ---
  const showMenu = (event: React.MouseEvent, ship: ShipState) => {
    event.stopPropagation();
    setCurrentShipId(ship.id);

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const shipCenterX = rect.left + rect.width / 2;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const isMobile = false; // Always use desktop mode layout (وضع مصمم الكمبيوتر)

    // Accurate calculation of menu width based on active ship buttons
    const activeShip = ships.find(s => s.id === ship.id);
    const hasGH = activeShip?.assignedCrew?.some(c => c === 'golden_hunter' || c === 'gold_fisher');
    const hasGuide = activeShip?.assignedCrew?.includes('guide');
    const maxH = getShipMaxHeart(activeShip);
    const curH = typeof activeShip?.heart === 'number' ? activeShip.heart : maxH;
    const isDamaged = activeShip && (portDestroyed || curH < maxH);
    const activeTimerState = activeShip ? getShipFishingTimerState(activeShip, Date.now()) : null;
    const hasSpeedUpBtn = Boolean(activeTimerState && activeTimerState.isFishing && !activeTimerState.isAutoFishing && activeTimerState.remainingMs > 0);
    let buttonCount = 3;
    if (hasGH) buttonCount++;
    if (hasGuide) buttonCount++;
    if (isDamaged) buttonCount++;
    if (hasSpeedUpBtn) buttonCount++;
    const estimatedWidth = isMobile ? (buttonCount * 65 + 24) : (buttonCount * 80 + 36);
    const estimatedHeight = isMobile ? 82 : 94;
    const safeMargin = 12;

    // Center horizontally over ship, safely clamped inside viewport
    let x = shipCenterX - estimatedWidth / 2;
    if (x + estimatedWidth > screenW - safeMargin) {
      x = screenW - estimatedWidth - safeMargin;
    }
    if (x < safeMargin) {
      x = safeMargin;
    }

    // Place vertically: preferentially above the ship, but if too close to top bar, place below
    let y = rect.top - estimatedHeight - 14;
    if (y < 75) {
      y = rect.bottom + 14;
    }
    if (y + estimatedHeight > screenH - 115) {
      y = Math.max(75, screenH - 115 - estimatedHeight);
    }

    setMenu({
      visible: true,
      x: Math.round(x),
      y: Math.round(y),
      shipId: ship.id,
      status: ship.status
    });
  };

  // --- Helper to calculate catch rewards for a single ship ---
  const calculateShipCatch = useCallback((selectedShip: ShipState) => {
    const shipCrew = selectedShip.assignedCrew || [];
    const isNetUpgraded = selectedShip.hasNetUpgrade;
    const crewPowerBonus = selectedShip.crewPower || 0;
    const isLuckActive = shipCrew.includes('luck');
    const isGuidedActive = shipCrew.includes('guide');

    const capacityLvl = selectedShip.capacityLevel || 1;
    const capacityMultiplier = 1 + (capacityLvl - 1) * 0.15;
    const cargo = Math.floor((selectedShip.cargo || 80) * capacityMultiplier);
    const shipFishTypes = selectedShip.fishTypes && selectedShip.fishTypes.length > 0 
      ? selectedShip.fishTypes 
      : ['السردين'];

    // 🧭 مرشد السفينة: يركز ويتوقع نوع سمك محدد بدقة بنسبة 100%
    const defaultFish = shipFishTypes[shipFishTypes.length - 1] || 'السردين';
    const targetedFish = selectedShip.expectedFish && shipFishTypes.includes(selectedShip.expectedFish)
      ? selectedShip.expectedFish
      : defaultFish;
    const randomFishName = isGuidedActive 
      ? targetedFish 
      : shipFishTypes[Math.floor(Math.random() * shipFishTypes.length)];
    
    const fishInfo = (typeof selectedShip.level === 'number' && selectedShip.level >= 32)
      ? rollSubmarineFishCatch(selectedShip.level)
      : (FISH_REWARD_DATA[randomFishName] || { 
          fullName: `${randomFishName} 🐟`, 
          valPerFish: 1,
          emoji: '🐟'
        });

    const baseAmount = Math.max(20, Math.floor(cargo * (0.25 + Math.random() * 0.35)));
    let totalAmount = (isNetUpgraded ? baseAmount * 2 : baseAmount) + crewPowerBonus;
    if (pirateClass === 'صياد البحار') {
      totalAmount = Math.floor(totalAmount * 1.15);
    }

    // 🍀 الحظ السعيد: مضاعفة صيد السفينة 2x بنسبة 100%
    if (isLuckActive) {
      totalAmount = totalAmount * 2;
    }

    let expReward = Math.floor(5 + Math.random() * 5);
    if (isGuidedActive) {
      expReward = expReward * 2;
    }

    return {
      fishInfo,
      totalAmount,
      expReward,
      isLuckActive,
      isGuidedActive
    };
  }, [pirateClass]);

  // --- Dedicated Single-Ship Action Handlers (supports manual & autonomous Golden Hunter) ---
  const startShipFishing = (targetShipId: string, isAuto = false) => {
    if (!targetShipId) return;

    const selectedShip = shipsRef.current.find(s => s.id === targetShipId) || ships.find(s => s.id === targetShipId);
    if (selectedShip && (portDestroyedRef.current || (typeof selectedShip.heart === 'number' && selectedShip.heart <= 0))) {
      if (!isAuto) {
        showToast('⚠️ هذه السفينة مدمّرة بنيران المعارك! يرجى صيانتها وإصلاح هيكلها لتتمكن من الإبحار.', 'error');
        setRepairModalShip(selectedShip);
      }
      return;
    }

    updateQuestProgress('q1', 1);

    const shipCrew = selectedShip?.assignedCrew || [];
    const isAutoActive = isAuto || (!selectedShip?.autoFishingPaused && (shipCrew.includes('golden_hunter') || shipCrew.includes('gold_fisher')));

    const isEngineUpgraded = selectedShip?.hasEngineUpgrade;
    const speedLvl = selectedShip?.speedLevel || 1;
    const speedMultiplier = 1 + (speedLvl - 1) * 0.08;
    const isSailorActive = shipCrew.includes('sailor') || shipCrew.includes('sailors');

    // Calculate sail-out duration
    let sailOutDuration = isAutoActive ? (isEngineUpgraded ? 1300 : 1950) : (isEngineUpgraded ? 900 : 1800);
    sailOutDuration = Math.max(700, Math.floor(sailOutDuration / speedMultiplier));
    if (isSailorActive) {
      sailOutDuration = Math.floor(sailOutDuration * 0.5);
    }

    const now = Date.now();
    const fishingDurationMs = selectedShip ? getShipFishingDurationMs(selectedShip) : 30000;
    notifiedReadyShipsRef.current.delete(targetShipId);
    collectingAutoShipsRef.current.delete(targetShipId);
    localStorage.setItem('pirate_last_active_time', String(now));
    setTimerNow(now);

    setShips(prev =>
      prev.map(s => {
        if (s.id === targetShipId) {
          const { fishingStartTime: _fs, fishingEndTime: _fe, fishingDurationMs: _fd, ...cleanShip } = s;
          return {
            ...cleanShip,
            scaleX: 1,
            moving: true,
            lastMoveTime: now,
            status: 'fishing',
            left: fishSpots[s.id]?.l || '55%',
            top: fishSpots[s.id]?.t || '41%',
            transitionDuration: `${sailOutDuration}ms`,
            fishingStartTime: now,
            fishingEndTime: now + fishingDurationMs,
            fishingDurationMs,
          };
        }
        return s;
      })
    );

    // Settle ship at fishing spot once sailing movement completes
    setTimeout(() => {
      setShips(prev =>
        prev.map(s => {
          if (s.id === targetShipId && s.status === 'fishing') {
            return {
              ...s,
              moving: false,
              lastMoveTime: 0
            };
          }
          return s;
        })
      );
    }, sailOutDuration);
  };

  const collectShipFish = (targetShipId: string, isAuto = false, bypassTimer = false) => {
    if (!targetShipId) return;
    const selectedShip = shipsRef.current.find(s => s.id === targetShipId) || ships.find(s => s.id === targetShipId);
    if (!selectedShip) return;

    if (!bypassTimer) {
      const timerState = getShipFishingTimerState(selectedShip, Date.now());
      if (timerState.remainingMs > 0) {
        if (!isAuto) {
          showToast(
            `⏳ السفينة [${selectedShip.name}] ما زالت تصطاد! الوقت المتبقي: ${formatFishingCountdown(timerState.remainingMs)} (${timerState.progressPct}%)`,
            'info'
          );
        }
        return;
      }
    }

    const isEngineUpgraded = selectedShip.hasEngineUpgrade;
    const crewPowerBonus = selectedShip.crewPower || 0;
    const shipCrew = selectedShip.assignedCrew || [];
    const isAutoActive = isAuto || (!selectedShip.autoFishingPaused && (shipCrew.includes('golden_hunter') || shipCrew.includes('gold_fisher')));

    const flipDuration = isAutoActive ? 550 : 500;

    // Start the return action: Flip direction facing left
    setShips(prev =>
      prev.map(s => {
        if (s.id === targetShipId) {
          return {
            ...s,
            moving: true,
            lastMoveTime: Date.now(),
            scaleX: -1,
            transitionDuration: `${flipDuration}ms`
          };
        }
        return s;
      })
    );

    let returnTripDuration = isAutoActive ? (isEngineUpgraded ? 1300 : 1950) : (isEngineUpgraded ? 800 : 1800);
    const speedLvl = selectedShip.speedLevel || 1;
    const speedMultiplier = 1 + (speedLvl - 1) * 0.08;
    returnTripDuration = Math.max(700, Math.floor(returnTripDuration / speedMultiplier));

    const isSailorActive = shipCrew.includes('sailor') || shipCrew.includes('sailors');

    // ⚓ البحار: يسرع صيد السفينة ويقلص مدة رحلة العودة والصيد بنسبة 50%
    if (isSailorActive) {
      returnTripDuration = Math.floor(returnTripDuration * 0.5);
    }

    // After flip animation finished, start physical sailing glide to the dock coordinates
    setTimeout(() => {
      setShips(prev =>
        prev.map(s => {
          if (s.id === targetShipId) {
            return {
              ...s,
              moving: true,
              lastMoveTime: Date.now(),
              left: docks[s.id]?.l || '26%',
              top: docks[s.id]?.t || '51%',
              transitionDuration: `${returnTripDuration}ms`
            };
          }
          return s;
        })
      );

      // After the sailing trip finishes, settle the ship at dock, face right, and stop moving
      setTimeout(() => {
        // Trigger water splash and gold particles at dock coordinates
        const dockPos = docks[targetShipId] || { l: '26%', t: '51%' };
        const sx = parseFloat(dockPos.l) || 26;
        const sy = parseFloat(dockPos.t) || 51;
        
        window.dispatchEvent(new CustomEvent('spawn-pirate-particles', {
          detail: { x: sx, y: sy, type: 'water-splash', count: 15 }
        }));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('spawn-pirate-particles', {
            detail: { x: sx, y: sy, type: 'gold-gain', count: 12 }
          }));
        }, isAutoActive ? 700 : 300);

        notifiedReadyShipsRef.current.delete(targetShipId);
        collectingAutoShipsRef.current.delete(targetShipId);
        autoDockReadyAtRef.current[targetShipId] = Date.now() + 1500;
        localStorage.setItem('pirate_last_active_time', String(Date.now()));

        setShips(prev =>
          prev.map(s => {
            if (s.id === targetShipId) {
              const { fishingStartTime: _fs, fishingEndTime: _fe, fishingDurationMs: _fd, ...cleanShip } = s;
              return {
                ...cleanShip,
                scaleX: 1,
                status: 'docked',
                moving: false,
                lastMoveTime: 0,
                transitionDuration: isAutoActive ? '1.75s' : '1.8s'
              };
            }
            return s;
          })
        );

        const catchData = calculateShipCatch(selectedShip);
        const fishInfo = catchData.fishInfo;
        const totalAmount = catchData.totalAmount;
        const expReward = catchData.expReward;
        const isLuckActive = catchData.isLuckActive;
        const isGuidedActive = catchData.isGuidedActive;

        // Add all caught fish directly to fish inventory without any automatic selling
        if (totalAmount > 0) {
          setFishInventory(prev => {
            const nextInv = {
              ...prev,
              [fishInfo.fullName]: ((prev[fishInfo.fullName] as number) || 0) + (totalAmount as number)
            };
            localStorage.setItem('pirate_fish_inventory', JSON.stringify(nextInv));
            return nextInv;
          });
        }

        setExp(prev => prev + expReward);

        if (!isAuto) {
          setRewardFish({
            name: fishInfo.fullName,
            amount: totalAmount,
            value: 0,
            luckDoubled: isLuckActive,
            guided: isGuidedActive,
            shipLevel: typeof selectedShip.level === 'number' ? selectedShip.level : undefined,
          });
          setRewardModal(true);
        }
      }, returnTripDuration);
    }, flipDuration);
  };

  const speedUpShipFishing = async (targetShipId: string) => {
    if (!targetShipId) return;
    const selectedShip = ships.find(s => s.id === targetShipId);
    if (!selectedShip || selectedShip.status !== 'fishing') return;

    const timerState = getShipFishingTimerState(selectedShip, Date.now());
    if (timerState.remainingMs <= 0) {
      collectShipFish(targetShipId, false, true);
      return;
    }

    if (!isNetworkOnline()) {
      notifyOfflineBlocked('تسريع مؤقت الصيد');
      return;
    }

    const gemCost = getSpeedUpGemCost(timerState.remainingMs);
    if (gems < gemCost) {
      showToast(`❌ الجواهر غير كافية للتسريع! تحتاج إلى ${gemCost} 💎 جوهرة.`, 'error');
      return;
    }

    const now = Date.now();
    const updatedShips = ships.map(s =>
      s.id === targetShipId ? { ...s, fishingEndTime: now } : s
    );

    const res = await executeFinancialTransaction({
      gemsDelta: -gemCost,
      ships: updatedShips,
      reason: `تسريع مؤقت صيد [${selectedShip.name}]`,
      onLocalApply: () => {
        setGems(prev => prev - gemCost);
        setShips(updatedShips);
        setTimerNow(now);
      }
    });

    if (res.success) {
      if (typeof res.newGems === 'number') {
        setGems(res.newGems);
      }
      setShips(updatedShips);
      setTimerNow(Date.now());
      showToast(`⚡ تم تسريع صيد [${selectedShip.name}] بنجاح! جاري جمع الصيد...`, 'success');
      collectShipFish(targetShipId, false, true);
    }
  };

  // --- Offline Auto-Fishing & Gathering Progress Catch-Up Engine ---
  const processOfflineAutoHarvest = useCallback(() => {
    const lastActiveStr = localStorage.getItem('pirate_last_active_time');
    const now = Date.now();
    localStorage.setItem('pirate_last_active_time', String(now));

    if (!lastActiveStr) return;
    const lastActive = Number(lastActiveStr);
    if (!lastActive || isNaN(lastActive)) return;

    const elapsedSeconds = Math.floor((now - lastActive) / 1000);
    // If less than 4 seconds elapsed, normal online loop handles it
    if (elapsedSeconds < 4) return;

    const cappedSeconds = Math.min(86400, elapsedSeconds); // Process up to 24 hours of offline activity

    const autoShips = ships.filter(s =>
      s.exists &&
      !s.autoFishingPaused &&
      (s.assignedCrew?.includes('golden_hunter') || s.assignedCrew?.includes('gold_fisher'))
    );

    if (autoShips.length === 0) return;

    let totalGainedExp = 0;
    let totalFittingFish = 0;
    const inventoryUpdates: Record<string, number> = {};

    autoShips.forEach(ship => {
      // Respect each ship's real fishing duration + sail/dock turnaround (~4.5s)
      const shipDurationMs = getShipFishingDurationMs(ship);
      const fullTripSeconds = Math.max(5, Math.round((shipDurationMs + 4500) / 1000));
      const cyclesPerShip = Math.floor(cappedSeconds / fullTripSeconds);
      if (cyclesPerShip <= 0) return;

      const shipCrew = ship.assignedCrew || [];
      const isLuckActive = shipCrew.includes('luck');
      const isSailorActive = shipCrew.includes('sailor') || shipCrew.includes('sailors');
      const isGuidedActive = shipCrew.includes('guide');
      const isNetUpgraded = ship.hasNetUpgrade;
      const crewPowerBonus = ship.crewPower || 0;

      const capacityLvl = ship.capacityLevel || 1;
      const capacityMultiplier = 1 + (capacityLvl - 1) * 0.15;
      const cargo = Math.floor((ship.cargo || 80) * capacityMultiplier);
      const shipFishTypes = ship.fishTypes && ship.fishTypes.length > 0
        ? ship.fishTypes
        : ['السردين'];

      const defaultFish = shipFishTypes[shipFishTypes.length - 1] || 'السردين';
      const targetedFish = ship.expectedFish && shipFishTypes.includes(ship.expectedFish)
        ? ship.expectedFish
        : defaultFish;
      const randomFishName = isGuidedActive
        ? targetedFish
        : shipFishTypes[0];

      const fishInfo = (typeof ship.level === 'number' && ship.level >= 32)
        ? rollSubmarineFishCatch(ship.level)
        : (FISH_REWARD_DATA[randomFishName] || {
            fullName: `${randomFishName} 🐟`,
            valPerFish: 1,
            emoji: '🐟'
          });

      const baseAmount = Math.max(20, Math.floor(cargo * 0.35));
      let singleCatchAmount = (isNetUpgraded ? baseAmount * 2 : baseAmount) + crewPowerBonus;
      if (pirateClass === 'صياد البحار') {
        singleCatchAmount = Math.floor(singleCatchAmount * 1.15);
      }
      if (isLuckActive) {
        singleCatchAmount = singleCatchAmount * 2;
      }

      const totalShipFish = singleCatchAmount * cyclesPerShip;

      if (totalShipFish > 0) {
        totalFittingFish += totalShipFish;
        inventoryUpdates[fishInfo.fullName] = (inventoryUpdates[fishInfo.fullName] || 0) + totalShipFish;
      }

      const expPerCatch = isGuidedActive ? 14 : 7;
      totalGainedExp += expPerCatch * cyclesPerShip;
    });

    if (Object.keys(inventoryUpdates).length > 0) {
      setFishInventory(prev => {
        const nextInv = { ...prev };
        Object.entries(inventoryUpdates).forEach(([name, count]) => {
          nextInv[name] = (nextInv[name] || 0) + count;
        });
        localStorage.setItem('pirate_fish_inventory', JSON.stringify(nextInv));
        return nextInv;
      });
    }

    if (totalGainedExp > 0) {
      setExp(prev => {
        const nextExp = prev + totalGainedExp;
        localStorage.setItem('pirate_exp', String(nextExp));
        return nextExp;
      });
    }

    if (totalFittingFish > 0) {
      const awayMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const msg = `🔱 مرحباً بعودتك أيها القبطان! واصل أسطولك الصيد التلقائي أثناء غيابك (${awayMinutes} دقيقة) وتم جمع 🐟 +${totalFittingFish.toLocaleString()} سمكة وحفظها في بيت السمك لبيعها لاحقاً! ✨`;
      showToast(msg, 'success');
    }
  }, [ships, fishStorageLevel, pirateClass, getTotalFish, showToast]);

  // Trigger offline progress on initial load
  const hasProcessedOfflineRef = useRef(false);
  useEffect(() => {
    if (!hasProcessedOfflineRef.current && ships.length > 0) {
      hasProcessedOfflineRef.current = true;
      processOfflineAutoHarvest();
    }
  }, [ships, processOfflineAutoHarvest]);

  // Catch up and unfreeze ships when switching tabs or reopening window
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        processOfflineAutoHarvest();
        // Unfreeze any ship that got throttled while tab was in background
        setShips(prev => prev.map(s => ({ ...s, moving: false, lastMoveTime: 0 })));
      } else {
        localStorage.setItem('pirate_last_active_time', String(Date.now()));
      }
    };

    const handleBeforeUnload = () => {
      localStorage.setItem('pirate_last_active_time', String(Date.now()));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [processOfflineAutoHarvest]);

  // --- Autonomous Golden Hunter Engine (Obeys Each Ship's Real Fishing Duration) ---
  const shipsRef = useRef(ships);
  useEffect(() => {
    shipsRef.current = ships;
  }, [ships]);

  const collectingAutoShipsRef = useRef<Set<string>>(new Set());
  const autoDockReadyAtRef = useRef<Record<string, number>>({});
  const startShipFishingRef = useRef(startShipFishing);
  const collectShipFishRef = useRef(collectShipFish);
  startShipFishingRef.current = startShipFishing;
  collectShipFishRef.current = collectShipFish;

  const portDestroyedRef = useRef(portDestroyed);
  useEffect(() => {
    portDestroyedRef.current = portDestroyed;
  }, [portDestroyed]);

  const hasAnyFishingShip = ships.some(s => s.exists && s.status === 'fishing');

  const hasEligibleAutoShips = ships.some(
    s =>
      s.exists &&
      !s.autoFishingPaused &&
      !portDestroyed &&
      (typeof s.heart !== 'number' || s.heart > 0) &&
      (s.assignedCrew?.includes('golden_hunter') || s.assignedCrew?.includes('gold_fisher'))
  );

  // Live 1-second fishing countdown ticker + manual completion toast alert
  useEffect(() => {
    if (!hasAnyFishingShip && !hasEligibleAutoShips) return;

    const tick = () => {
      const now = Date.now();
      setTimerNow(now);
      for (const ship of shipsRef.current) {
        if (
          ship.exists &&
          ship.status === 'fishing' &&
          typeof ship.fishingEndTime === 'number' &&
          ship.fishingEndTime > 0 &&
          now >= ship.fishingEndTime
        ) {
          const isAuto = Boolean(
            ship.assignedCrew?.some(c => c === 'golden_hunter' || c === 'gold_fisher') &&
            !ship.autoFishingPaused
          );
          if (!isAuto && !notifiedReadyShipsRef.current.has(ship.id)) {
            notifiedReadyShipsRef.current.add(ship.id);
            showToast(`🎣 اكتمل صيد [${ship.name}]! اضغط على السفينة لجمع الصيد 🪣`, 'success');
          }
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hasAnyFishingShip, hasEligibleAutoShips, showToast]);

  // Autonomous Golden Hunter scheduler:
  // 1. Sends docked Golden Hunter ships out to fish and records their real fishingEndTime.
  // 2. Waits until now >= ship.fishingEndTime (respecting each ship's exact fishing duration, e.g. 30m or 30s).
  // 3. Returns and collects the ship only after its full fishing timer finishes, then rests briefly before next trip.
  useEffect(() => {
    if (!hasEligibleAutoShips) return;

    const processAutoShips = () => {
      const now = Date.now();
      const activeAutoShips = shipsRef.current.filter(
        s =>
          s.exists &&
          !s.autoFishingPaused &&
          !portDestroyedRef.current &&
          (typeof s.heart !== 'number' || s.heart > 0) &&
          (s.assignedCrew?.includes('golden_hunter') || s.assignedCrew?.includes('gold_fisher'))
      );

      for (const ship of activeAutoShips) {
        if (collectingAutoShipsRef.current.has(ship.id)) continue;

        // Recover any ship stuck in a throttled CSS transition for >12s
        if (ship.moving) {
          if (typeof ship.lastMoveTime === 'number' && ship.lastMoveTime > 0 && now - ship.lastMoveTime > 12000) {
            setShips(prev =>
              prev.map(s => (s.id === ship.id ? { ...s, moving: false, lastMoveTime: 0 } : s))
            );
          }
          continue;
        }

        if (ship.status === 'docked') {
          const readyAt = autoDockReadyAtRef.current[ship.id] || 0;
          if (now >= readyAt) {
            startShipFishingRef.current(ship.id, true);
          }
        } else if (ship.status === 'fishing') {
          if (typeof ship.fishingEndTime !== 'number' || ship.fishingEndTime <= 0) {
            // Backfill timer for any legacy fishing ship so it waits its real fishing duration
            const durMs = getShipFishingDurationMs(ship);
            setShips(prev =>
              prev.map(s =>
                s.id === ship.id
                  ? {
                      ...s,
                      fishingStartTime: now,
                      fishingEndTime: now + durMs,
                      fishingDurationMs: durMs,
                    }
                  : s
              )
            );
          } else if (now >= ship.fishingEndTime) {
            // Full fishing duration completed — return and collect fish now
            collectingAutoShipsRef.current.add(ship.id);
            collectShipFishRef.current(ship.id, true, true);
          }
        }
      }
    };

    processAutoShips();
    const interval = setInterval(processAutoShips, 1000);
    return () => clearInterval(interval);
  }, [hasEligibleAutoShips]);

  // --- Ship Repair Handler (Manual & Kit Repairs) ---
  const handleRepairShip = async (
    targetShipId: string, 
    type: 'small' | 'medium' | 'large' | 'legendary' | 'gold' | 'gems'
  ) => {
    const targetShip = ships.find(s => s.id === targetShipId);
    if (!targetShip) return;

    const maxH = getShipMaxHeart(targetShip);
    const curH = typeof targetShip.heart === 'number' ? Math.min(Math.max(0, targetShip.heart), maxH) : maxH;

    if (type !== 'legendary' && type !== 'gems' && curH >= maxH) {
      showToast('⚠️ هيكل هذه السفينة سليم بالكامل ولا يحتاج لصيانة!', 'info');
      return;
    }

    let updatedCrewServices = { ...crewServices };
    let newGold = gold;
    let newGems = gems;
    let healAmount = 0;
    let repairAll = false;

    if (type === 'small') {
      const count = crewServices.repairer_small || 0;
      if (count <= 0) {
        showToast('⚠️ ليس لديك مصلح صغير في المستودع! يمكنك شراؤه من المتجر أو الإصلاح بالذهب.', 'error');
        return;
      }
      updatedCrewServices.repairer_small = count - 1;
      healAmount = calculateWeaponShipDamage(maxH, 25);
    } else if (type === 'medium') {
      const count = crewServices.repairer_medium || 0;
      if (count <= 0) {
        showToast('⚠️ ليس لديك مصلح وسيط في المستودع! يمكنك شراؤه من المتجر أو الإصلاح بالذهب.', 'error');
        return;
      }
      updatedCrewServices.repairer_medium = count - 1;
      healAmount = calculateWeaponShipDamage(maxH, 50);
    } else if (type === 'large') {
      const count = crewServices.repairer_large || 0;
      if (count <= 0) {
        showToast('⚠️ ليس لديك مصلح كبير في المستودع! يمكنك شراؤه من المتجر أو الإصلاح بالذهب.', 'error');
        return;
      }
      updatedCrewServices.repairer_large = count - 1;
      healAmount = maxH - curH;
    } else if (type === 'legendary') {
      const count = crewServices.repairer_legendary || 0;
      if (count <= 0) {
        showToast('⚠️ ليس لديك مصلح أسطوري في المستودع! يمكنك شراؤه من المتجر أو الصيانة بالجواهر.', 'error');
        return;
      }
      updatedCrewServices.repairer_legendary = count - 1;
      repairAll = true;
    } else if (type === 'gold') {
      const cost = 500;
      if (gold < cost) {
        showToast(`❌ الذهب غير كافٍ للصيانة! تحتاج إلى ${cost} 🪙 ذهب.`, 'error');
        return;
      }
      newGold = gold - cost;
      healAmount = maxH - curH;
    } else if (type === 'gems') {
      const cost = 10;
      if (gems < cost) {
        showToast(`❌ الجواهر غير كافية للصيانة! تحتاج إلى ${cost} 💎 جوهرة.`, 'error');
        return;
      }
      newGems = gems - cost;
      repairAll = true;
    }

    let updatedShips: ShipState[];
    if (repairAll) {
      updatedShips = ships.map(s => {
        const normalized = normalizeShipEnergyToCargo(s);
        const mH = getShipMaxHeart(normalized);
        const { fishingStartTime: _fs, fishingEndTime: _fe, fishingDurationMs: _fd, ...cleanShip } = normalized;
        return {
          ...cleanShip,
          maxHeart: mH,
          heart: mH,
          energySyncedToCargo: true,
          status: 'docked' as const,
          moving: false
        };
      });
    } else {
      updatedShips = ships.map(s => {
        const normalized = normalizeShipEnergyToCargo(s);
        if (normalized.id === targetShipId) {
          const newH = Math.min(maxH, curH + healAmount);
          const { fishingStartTime: _fs, fishingEndTime: _fe, fishingDurationMs: _fd, ...cleanShip } = normalized;
          return {
            ...cleanShip,
            maxHeart: maxH,
            heart: newH,
            energySyncedToCargo: true,
            status: 'docked' as const,
            moving: false
          };
        }
        return normalized;
      });
    }

    const activeUpdatedShips = updatedShips.filter(s => s.exists);
    const stillAllDestroyed = activeUpdatedShips.length > 0 && activeUpdatedShips.every(s => typeof s.heart === 'number' && s.heart <= 0);
    setPortDestroyed(stillAllDestroyed);
    localStorage.setItem('pirate_port_destroyed', stillAllDestroyed ? 'true' : 'false');

    setShips(updatedShips);
    setCrewServices(updatedCrewServices);
    setGold(newGold);
    setGems(newGems);

    localStorage.setItem('pirate_ships_v2', JSON.stringify(updatedShips));
    localStorage.setItem('pirate_ships', JSON.stringify(updatedShips));
    localStorage.setItem('pirate_crew_services', JSON.stringify(updatedCrewServices));

    // Persist immediately to Firestore
    if (auth.currentUser && db) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      updateDoc(userRef, {
        ships: updatedShips,
        crewServices: updatedCrewServices,
        gold: newGold,
        gems: newGems,
        portDestroyed: stillAllDestroyed,
        updatedAt: new Date().toISOString()
      }).catch(console.error);
    }

    if (repairModalShip && repairModalShip.id === targetShipId) {
      const refreshedTarget = updatedShips.find(s => s.id === targetShipId);
      setRepairModalShip(refreshedTarget || null);
    }

    showToast(
      repairAll 
        ? '👑 تم صيانة وترميم كامل أسطول السفن بنسبة 100% بنجاح!' 
        : `🔧 تم صيانة وترميم هيكل [${targetShip.name}] بنجاح!`,
      'success'
    );
  };

  // --- Perform Ship Actions ---
  const act = (type: 'crew' | 'sell' | 'fish' | 'collect' | 'repair') => {
    setMenu(prev => ({ ...prev, visible: false }));
    if (!currentShipId) return;

    if (type === 'sell') {
      setConfirmModal(true);
    } else if (type === 'crew') {
      setCrewModal(true);
    } else if (type === 'repair') {
      const shipToRepair = ships.find(s => s.id === currentShipId);
      if (shipToRepair) {
        setRepairModalShip(shipToRepair);
      }
    } else if (type === 'fish') {
      const shipObj = ships.find(s => s.id === currentShipId);
      if (shipObj && (portDestroyed || (typeof shipObj.heart === 'number' && shipObj.heart <= 0))) {
        showToast('⚠️ هذه السفينة مدمّرة بنيران المعارك! يرجى صيانتها وإصلاح هيكلها أولاً لتتمكن من الإبحار والصيد.', 'error');
        setRepairModalShip(shipObj);
        return;
      }
      startShipFishing(currentShipId);
    } else if (type === 'collect') {
      collectShipFish(currentShipId, false);
    }
  };

  const confirmSell = async () => {
    if (!currentShipId) return;
    if (!isNetworkOnline()) {
      notifyOfflineBlocked('بيع وإلغاء السفينة');
      return;
    }

    const updatedShips = ships.map(s => {
      if (s.id === currentShipId) {
        const { fishingStartTime: _fs, fishingEndTime: _fe, fishingDurationMs: _fd, ...cleanShip } = s;
        return {
          ...cleanShip,
          exists: false,
          status: 'docked' as const,
          moving: false,
          assignedCrew: [],
          crewPower: 0,
          autoFishingPaused: false
        };
      }
      return s;
    });

    const remainingAssigned = updatedShips.filter(s => s.exists).flatMap(s => s.assignedCrew || []);
    const updatedCrewServices = {
      ...crewServices,
      golden_hunter: remainingAssigned.includes('golden_hunter') || remainingAssigned.includes('gold_fisher'),
      gold_fisher: remainingAssigned.includes('golden_hunter') || remainingAssigned.includes('gold_fisher'),
      luck: remainingAssigned.includes('luck'),
      sailor: remainingAssigned.includes('sailor') || remainingAssigned.includes('sailors'),
      sailors: remainingAssigned.includes('sailor') || remainingAssigned.includes('sailors'),
      guide: remainingAssigned.includes('guide'),
      cop: remainingAssigned.includes('cop') || remainingAssigned.includes('police'),
      police: remainingAssigned.includes('cop') || remainingAssigned.includes('police'),
      thief: remainingAssigned.includes('thief'),
    };

    const res = await executeFinancialTransaction({
      goldDelta: 250,
      ships: updatedShips,
      crewServices: updatedCrewServices,
      reason: 'بيع سفينة وإلغاؤها وإخلاء طواقمها (+250 ذهب)',
      onLocalApply: () => {
        setGold(prev => prev + 250);
        setShips(updatedShips);
        setCrewServices(updatedCrewServices);
        localStorage.setItem('pirate_ships_v2', JSON.stringify(updatedShips));
        localStorage.setItem('pirate_crew_services', JSON.stringify(updatedCrewServices));
      }
    });

    if (res.success) {
      if (typeof res.newGold === 'number') {
        setGold(res.newGold);
      }
      setShips(updatedShips);
      setCrewServices(updatedCrewServices);
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updatedShips));
      localStorage.setItem('pirate_crew_services', JSON.stringify(updatedCrewServices));
      setConfirmModal(false);

      // Trigger ship destruction/sell explosion at its coordinate
      const targetShip = ships.find(s => s.id === currentShipId);
      if (targetShip) {
        const sx = parseFloat(targetShip.left) || 45;
        const sy = parseFloat(targetShip.top) || 48;
        
        window.dispatchEvent(new CustomEvent('spawn-pirate-particles', {
          detail: { x: sx, y: sy, type: 'destroy', count: 35 }
        }));
      }
      alert('💵 تم بيع وتفكيك السفينة وإخلاء كافة طواقمها بنجاح وإضافة 250 🪙 ذهب عبر المعاملة الذرية!');
    }
  };

  const hireCrew = async (cMember: CrewMember) => {
    if (!currentShipId) return;
    if (!isNetworkOnline()) {
      notifyOfflineBlocked(`تعيين البحار ${cMember.name}`);
      return;
    }

    if (gold < cMember.cost) {
      alert('الذهب غير كافٍ لتعيين هذا البحار!');
      return;
    }

    const updatedCrew = crew.map(item => item.id === cMember.id ? { ...item, hired: true, shipId: currentShipId } : item);
    const updatedShips = ships.map(s => {
      if (s.id === currentShipId) {
        return {
          ...s,
          crewPower: s.crewPower + cMember.power
        };
      }
      return s;
    });

    const res = await executeFinancialTransaction({
      goldDelta: -cMember.cost,
      ships: updatedShips,
      reason: `تعيين بحار ${cMember.name}`,
      onLocalApply: () => {
        setGold(prev => prev - cMember.cost);
        setCrew(updatedCrew);
        setShips(updatedShips);
      }
    });

    if (res.success) {
      if (typeof res.newGold === 'number') {
        setGold(res.newGold);
      }
      setCrew(updatedCrew);
      setShips(updatedShips);
      updateQuestProgress('q2', 1);
      alert(`🎉 تم تعيين البحار [${cMember.name}] بنجاح وتأكيد العملية في السحابة!`);
    }
  };

  const buyShopItem = async (type: 'ship' | 'net' | 'engine' | 'gold_pack', costGold: number, costGems: number, extraId?: string) => {
    if (!isNetworkOnline()) {
      notifyOfflineBlocked('شراء عناصر المتجر');
      return;
    }

    if (gold < costGold) {
      alert('الذهب غير كافٍ!');
      return;
    }
    if (gems < costGems) {
      alert('الجواهر غير كافية!');
      return;
    }

    let updatedShips = ships;
    let goldGain = 0;

    if (type === 'ship') {
      const activeCount = ships.filter(s => s.exists).length;
      if (activeCount >= 3) {
        alert('لقد وصلت للحد الأقصى من السفن في الميناء (3 سفن)!');
        return;
      }

      const existingInactive = ships.find(s => !s.exists);
      if (existingInactive) {
        updatedShips = ships.map(s => s.id === existingInactive.id ? {
          ...s,
          exists: true,
          status: 'docked',
          left: docks[s.id].l,
          top: docks[s.id].t,
          scaleX: 1,
          moving: false,
          crewPower: 0,
          assignedCrew: [],
          autoFishingPaused: false,
          hasNetUpgrade: false,
          hasEngineUpgrade: false
        } : s);
      } else {
        const nextId = `s${ships.length + 1}`;
        const newShip: ShipState = {
          id: nextId,
          name: extraId === 'royal' ? 'المدمرة الملكية الأسطورية' : 'سفينة المغامر المطورة',
          status: 'docked',
          left: docks[nextId]?.l || '29%',
          top: docks[nextId]?.t || '66%',
          scaleX: 1,
          moving: false,
          exists: true,
          crewPower: 0,
          assignedCrew: [],
          autoFishingPaused: false,
          hasNetUpgrade: false,
          hasEngineUpgrade: false
        };
        updatedShips = [...ships, newShip];
      }
    } else if (type === 'net') {
      updatedShips = ships.map(s => ({ ...s, hasNetUpgrade: true }));
    } else if (type === 'engine') {
      updatedShips = ships.map(s => ({ ...s, hasEngineUpgrade: true }));
    } else if (type === 'gold_pack') {
      goldGain = 1500;
    }

    const netGoldDelta = -costGold + goldGain;

    const res = await executeFinancialTransaction({
      goldDelta: netGoldDelta,
      gemsDelta: -costGems,
      ships: updatedShips,
      reason: `شراء متجر (${type})`,
      onLocalApply: () => {
        setGold(prev => prev + netGoldDelta);
        setGems(prev => prev - costGems);
        setShips(updatedShips);
      }
    });

    if (res.success) {
      if (typeof res.newGold === 'number') {
        setGold(res.newGold);
      }
      if (typeof res.newGems === 'number') {
        setGems(res.newGems);
      }
      setShips(updatedShips);

      if (type === 'ship') {
        alert('تم شراء سفينة جديدة بنجاح في الميناء عبر المعاملة الذرية!');
      } else if (type === 'net') {
        alert('تمت ترقية شباك جميع السفن إلى شباك هامور شابك المزدوجة!');
      } else if (type === 'engine') {
        alert('تمت ترقية المحركات لجميع السفن بنجاح! زادت سرعة الإياب بشكل مضاعف.');
      } else if (type === 'gold_pack') {
        alert('تم شراء باقة ذهب ملوك الأعماق (+1500 ذهب) وتأكيدها في السحابة!');
      }
    }
  };

  const [upgradeTargetSpec, setUpgradeTargetSpec] = useState<any | null>(null);
  const [showSubmarineUpgradeModal, setShowSubmarineUpgradeModal] = useState(false);
  const [upgradeSubmarineShipId, setUpgradeSubmarineShipId] = useState<string | undefined>(undefined);

  const buyShipLevel = (spec: any) => {
    if (!isNetworkOnline()) {
      notifyOfflineBlocked('شراء سفينة جديدة');
      return;
    }
    const isSubmarine = spec.level >= 32;
    const isLockedByTower = isSubmarine ? (shipTowerLevel < 30) : (spec.level > 0 && spec.level > shipTowerLevel);
    if (isLockedByTower) {
      if (isSubmarine) {
        alert(`⚠️ لا يمكنك شراء الغواصة الأسطورية! يجب أولاً ترقية بيت السفن إلى أقصى مستوى (المستوى 30).`);
      } else {
        alert(`⚠️ لا يمكنك شراء هذه السفينة! يجب أولاً ترقية بيت السفن إلى المستوى ${spec.level}.`);
      }
      return;
    }
    if (gold < spec.price) {
      alert(`⚠️ الذهب غير كافٍ! تحتاج إلى ${spec.price.toLocaleString('en-US')} ذهب لترقية إحدى سفنك إلى هذا المستوى.`);
      return;
    }

    // Trigger choice of which of the 3 active ships to upgrade
    setUpgradeTargetSpec(spec);
  };

  const confirmUpgradeShip = async (shipId: string, spec: any) => {
    if (!isNetworkOnline()) {
      notifyOfflineBlocked(`ترقية السفينة إلى ${spec.name}`);
      return;
    }
    if (gold < spec.price) {
      alert(`⚠️ الذهب غير كافٍ!`);
      return;
    }

    const updatedShips = ships.map(s => {
      if (s.id === shipId) {
        const upgradedEnergy = getShipMaxHeart({ ...s, level: spec.level, cargo: spec.cargo });
        return {
          ...s,
          name: spec.name,
          level: spec.level,
          hook: spec.hook,
          cargo: spec.cargo,
          maxHeart: upgradedEnergy,
          heart: upgradedEnergy,
          energySyncedToCargo: true,
          durationStr: spec.durationStr,
          power: spec.power,
          armor: spec.armor,
          fishTypes: spec.fishTypes,
          imgEmoji: spec.emoji,
          exists: true,
          status: s.exists ? s.status : 'docked',
          left: s.exists ? s.left : (docks[s.id]?.l || s.left),
          top: s.exists ? s.top : (docks[s.id]?.t || s.top),
          scaleX: 1,
          moving: s.exists ? s.moving : false,
          crewPower: 0,
          assignedCrew: [],
          autoFishingPaused: false,
          upgradeFailStreak: 0,
        };
      }
      return s;
    });

    const remainingAssigned = updatedShips.filter(s => s.exists).flatMap(s => s.assignedCrew || []);
    const updatedCrewServices = {
      ...crewServices,
      golden_hunter: remainingAssigned.includes('golden_hunter') || remainingAssigned.includes('gold_fisher'),
      gold_fisher: remainingAssigned.includes('golden_hunter') || remainingAssigned.includes('gold_fisher'),
      luck: remainingAssigned.includes('luck'),
      sailor: remainingAssigned.includes('sailor') || remainingAssigned.includes('sailors'),
      sailors: remainingAssigned.includes('sailor') || remainingAssigned.includes('sailors'),
      guide: remainingAssigned.includes('guide'),
      cop: remainingAssigned.includes('cop') || remainingAssigned.includes('police'),
      police: remainingAssigned.includes('cop') || remainingAssigned.includes('police'),
      thief: remainingAssigned.includes('thief'),
    };

    const res = await executeFinancialTransaction({
      goldDelta: -spec.price,
      ships: updatedShips,
      crewServices: updatedCrewServices,
      reason: `شراء/ترقية سفينة إلى ${spec.name} بدون طواقم سابقة`,
      onLocalApply: () => {
        setGold(prev => prev - spec.price);
        setShips(updatedShips);
        setCrewServices(updatedCrewServices);
        localStorage.setItem('pirate_ships_v2', JSON.stringify(updatedShips));
        localStorage.setItem('pirate_crew_services', JSON.stringify(updatedCrewServices));
      }
    });

    if (res.success) {
      if (typeof res.newGold === 'number') {
        setGold(res.newGold);
      }
      setShips(updatedShips);
      setCrewServices(updatedCrewServices);
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updatedShips));
      localStorage.setItem('pirate_crew_services', JSON.stringify(updatedCrewServices));
      setUpgradeTargetSpec(null);
      if (spec.level === 0) {
        alert(`🎉 تم تفكيك وإعادة تعيين السفينة بنجاح إلى ${spec.name} (مستوى 0) وإخلاء طواقمها!`);
      } else {
        const sameLevelCount = updatedShips.filter(s => s.exists && s.level === spec.level).length;
        if (sameLevelCount === 3) {
          alert(`🎉 تهانينا الجبارة! تم تنزيل سفينتك الجديدة [${spec.name}] (مستوى ${spec.level})! أصبح أسطولك بالكامل يمتلك 3 سفن بنفس هذا المستوى المتطابق (3/3) بنجاح! ⚓👑`);
        } else if (sameLevelCount > 1) {
          alert(`🎉 تهانينا! تم شراء وتنزيل سفينتك الجديدة [${spec.name}] (مستوى ${spec.level})! أصبح لديك الآن (${sameLevelCount}/3) سفن بنفس هذا المستوى في أسطولك! ⚓`);
        } else {
          alert(`🎉 تهانينا! تم شراء وتنزيل سفينتك الجديدة [${spec.name}] (مستوى ${spec.level}) بنجاح وبدون طواقم عبر المعاملة الذرية!`);
        }
      }
    }
  };

  const handleUpgradeSubmarine = async (shipId: string, _currentLevel: number) => {
    setUpgradeSubmarineShipId(shipId);
    setShowSubmarineUpgradeModal(true);
  };

  /**
   * دالة الشراء المركزية والمعاملة الذرية الموحدة (Unified Atomic Purchase Engine)
   * تضمن:
   * 1. التحقق من الرصيد والاتصال بالإنترنت قبل أي إجراء.
   * 2. إضافة العنصر المشتري فوراً إلى المخزن المناسب (الأسلحة، أفراد الطاقم، الدروع).
   * 3. مزامنة فورية بين المتجر والمخزن (React state + Firestore + localStorage).
   * 4. الحفاظ الصارم على الرصيد وعدم خصم أي ذهب أو جواهر إذا تعثرت العملية.
   */
  const handlePurchase = async (params: {
    category: 'weapon' | 'crew' | 'shield' | 'ship' | 'service' | 'item';
    itemId: string;
    itemName: string;
    costType: 'gold' | 'gems' | 'blueGems';
    price: number;
    quantity?: number;
    targetShipId?: string;
  }): Promise<boolean> => {
    const { category, itemId, itemName, costType, price, quantity = 1, targetShipId } = params;

    if (!isNetworkOnline()) {
      notifyOfflineBlocked(`شراء [${itemName}]`);
      return false;
    }

    const isGold = costType === 'gold';
    if (isGold && gold < price) {
      alert(`❌ الذهب غير كافٍ لإتمام عملية الشراء!\nتحتاج إلى: ${price.toLocaleString('en-US')} 🪙 ذهب.\nرصيدك المتوفر: ${gold.toLocaleString('en-US')} 🪙 ذهب.`);
      return false;
    }
    if (!isGold && gems < price) {
      alert(`❌ الجواهر غير كافٍ لإتمام عملية الشراء!\nتحتاج إلى: ${price.toLocaleString('en-US')} 💎 جوهرة.\nرصيدك المتوفر: ${gems.toLocaleString('en-US')} 💎 جوهرة.`);
      return false;
    }

    // 1. حساب حالات المخازن المحدثة
    let updatedWeapons = { ...weapons };
    let updatedCrewInventory = { ...crewInventory };
    let updatedShieldInventory = { ...shieldInventory };
    let updatedCrewServices = { ...crewServices };
    let updatedShips = [...ships];

    const normKey = itemId === 'police' ? 'cop' 
      : itemId === 'sailors' ? 'sailor' 
      : itemId === 'gold_fisher' ? 'golden_hunter' 
      : (itemId === 'repairer_small' || itemId === 'smallRepair') ? 'fixer_sm'
      : (itemId === 'repairer_medium' || itemId === 'mediumRepair') ? 'fixer_md'
      : (itemId === 'repairer_large' || itemId === 'largeRepair') ? 'fixer_lg'
      : (itemId === 'repairer_legendary' || itemId === 'legendaryRepair') ? 'fixer_epic'
      : itemId;

    // A) عناصر الأسلحة والترسانة الحربية
    if (category === 'weapon' || WEAPONS_DATA.some(w => w.key === itemId || w.id === itemId)) {
      const curQty = weapons[itemId] || 0;
      const newQty = curQty + quantity;
      updatedWeapons[itemId] = newQty;

      if (itemId === 'adBomb' || itemId === 'emp_bomb') {
        const dualQty = (weapons.emp_bomb || weapons.adBomb || 0) + quantity;
        updatedWeapons.adBomb = dualQty;
        updatedWeapons.emp_bomb = dualQty;
      } else if (itemId === 'atomicBomb' || itemId === 'nuke_bomb') {
        const dualQty = (weapons.nuke_bomb || weapons.atomicBomb || 0) + quantity;
        updatedWeapons.atomicBomb = dualQty;
        updatedWeapons.nuke_bomb = dualQty;
      } else if (itemId === 'smallRocket' || itemId === 'small_missile') {
        const dualQty = (weapons.small_missile || weapons.smallRocket || 0) + quantity;
        updatedWeapons.smallRocket = dualQty;
        updatedWeapons.small_missile = dualQty;
      } else if (itemId === 'mediumRocket' || itemId === 'medium_missile') {
        const dualQty = (weapons.medium_missile || weapons.mediumRocket || 0) + quantity;
        updatedWeapons.mediumRocket = dualQty;
        updatedWeapons.medium_missile = dualQty;
      } else if (itemId === 'largeRocket' || itemId === 'large_missile') {
        const dualQty = (weapons.large_missile || weapons.largeRocket || 0) + quantity;
        updatedWeapons.largeRocket = dualQty;
        updatedWeapons.large_missile = dualQty;
      }
    }

    // B) عناصر الطاقم والشخصيات وحزم الصيانة
    if (category === 'crew' || CREW_SHOP_ITEMS.some(c => c.id === itemId || c.id === normKey)) {
      const curCrewQty = crewInventory[itemId] || crewInventory[normKey] || 0;
      const newCrewQty = curCrewQty + quantity;
      updatedCrewInventory[itemId] = newCrewQty;
      updatedCrewInventory[normKey] = newCrewQty;

      if (normKey === 'golden_hunter' || normKey === 'gold_fisher') {
        updatedCrewInventory.golden_hunter = newCrewQty;
        updatedCrewInventory.gold_fisher = newCrewQty;
        updatedCrewServices.golden_hunter = true;
        updatedCrewServices.gold_fisher = true;
      } else if (normKey === 'cop' || normKey === 'police') {
        updatedCrewInventory.cop = newCrewQty;
        updatedCrewInventory.police = newCrewQty;
        updatedCrewServices.cop = true;
        updatedCrewServices.police = true;
      } else if (normKey === 'sailor' || normKey === 'sailors') {
        updatedCrewInventory.sailor = newCrewQty;
        updatedCrewInventory.sailors = newCrewQty;
        updatedCrewServices.sailor = true;
        updatedCrewServices.sailors = true;
      } else if (normKey === 'thief') {
        updatedCrewInventory.thief = newCrewQty;
        updatedCrewServices.thief = true;
      } else if (normKey === 'guide') {
        updatedCrewInventory.guide = newCrewQty;
        updatedCrewServices.guide = true;
      } else if (normKey === 'luck') {
        updatedCrewInventory.luck = newCrewQty;
        updatedCrewServices.luck = true;
      } else if (normKey === 'market_expert') {
        updatedCrewInventory.market_expert = newCrewQty;
        updatedCrewServices.market_expert = true;
      }

      // مزامنة حزم الصيانة في كافة الجداول
      if (itemId === 'fixer_sm' || itemId === 'smallRepair' || itemId === 'repairer_small') {
        const smQty = (crewInventory.fixer_sm || 0) + quantity;
        updatedCrewInventory.fixer_sm = smQty;
        updatedCrewServices.repairer_small = (crewServices.repairer_small || 0) + quantity;
        updatedCrewServices.fixer_sm = true;
        updatedWeapons.smallRepair = (weapons.smallRepair || 0) + quantity;
      } else if (itemId === 'fixer_md' || itemId === 'mediumRepair' || itemId === 'repairer_medium') {
        const mdQty = (crewInventory.fixer_md || 0) + quantity;
        updatedCrewInventory.fixer_md = mdQty;
        updatedCrewServices.repairer_medium = (crewServices.repairer_medium || 0) + quantity;
        updatedCrewServices.fixer_md = true;
        updatedWeapons.mediumRepair = (weapons.mediumRepair || 0) + quantity;
      } else if (itemId === 'fixer_lg' || itemId === 'largeRepair' || itemId === 'repairer_large') {
        const lgQty = (crewInventory.fixer_lg || 0) + quantity;
        updatedCrewInventory.fixer_lg = lgQty;
        updatedCrewServices.repairer_large = (crewServices.repairer_large || 0) + quantity;
        updatedCrewServices.fixer_lg = true;
        updatedWeapons.largeRepair = (weapons.largeRepair || 0) + quantity;
      } else if (itemId === 'fixer_epic' || itemId === 'legendaryRepair' || itemId === 'repairer_legendary') {
        const epQty = (crewInventory.fixer_epic || 0) + quantity;
        updatedCrewInventory.fixer_epic = epQty;
        updatedCrewServices.repairer_legendary = (crewServices.repairer_legendary || 0) + quantity;
        updatedCrewServices.fixer_epic = true;
        updatedWeapons.legendaryRepair = (weapons.legendaryRepair || 0) + quantity;
      }

      // تعيين الطاقم والمصلحين على السفينة إن لم يكن معيناً
      const assignedShipId = targetShipId || currentShipId || (ships.find(s => s.exists)?.id || 's1');
      if (normKey === 'golden_hunter') {
        updatedShips = ships.map(s => {
          if (s.exists) {
            const currentCrew = s.assignedCrew || [];
            const newCrew = currentCrew.includes('golden_hunter') ? currentCrew : [...currentCrew, 'golden_hunter'];
            return {
              ...s,
              assignedCrew: newCrew,
              crewPower: (s.crewPower || 0) + (currentCrew.includes('golden_hunter') ? 0 : 15),
              autoFishingPaused: false
            };
          }
          return s;
        });
      } else {
        updatedShips = ships.map(s => {
          const normalized = normalizeShipEnergyToCargo(s);
          if (normalized.id === assignedShipId) {
            const currentCrew = normalized.assignedCrew || [];
            const newCrew = currentCrew.includes(normKey) ? currentCrew : [...currentCrew, normKey];
            let newHeart = normalized.heart;
            const maxHp = getShipMaxHeart(normalized);
            if (normKey === 'fixer_sm') {
              const heal = calculateWeaponShipDamage(maxHp, 25);
              newHeart = Math.min(maxHp, (typeof normalized.heart === 'number' ? normalized.heart : maxHp) + heal);
            } else if (normKey === 'fixer_md') {
              const heal = calculateWeaponShipDamage(maxHp, 50);
              newHeart = Math.min(maxHp, (typeof normalized.heart === 'number' ? normalized.heart : maxHp) + heal);
            } else if (normKey === 'fixer_lg' || normKey === 'fixer_epic') {
              newHeart = maxHp;
            }
            const defaultExpected = (normKey === 'guide' && !normalized.expectedFish) 
              ? (normalized.fishTypes?.[normalized.fishTypes.length - 1] || 'السردين') 
              : normalized.expectedFish;
            return {
              ...normalized,
              maxHeart: maxHp,
              heart: typeof newHeart === 'number' ? newHeart : normalized.heart,
              energySyncedToCargo: true,
              assignedCrew: newCrew,
              crewPower: (normalized.crewPower || 0) + (currentCrew.includes(normKey) ? 0 : 15),
              expectedFish: defaultExpected
            };
          }
          if (normKey === 'fixer_epic' && normalized.exists) {
            const mHp = getShipMaxHeart(normalized);
            return {
              ...normalized,
              maxHeart: mHp,
              heart: mHp,
              energySyncedToCargo: true
            };
          }
          return normalized;
        });
      }
    }

    // C) عناصر الدروع
    if (category === 'shield' || itemId.startsWith('shield_')) {
      const curShieldQty = shieldInventory[itemId] || 0;
      updatedShieldInventory[itemId] = curShieldQty + quantity;
    }

    // 2. تنفيذ المعاملة المالية الذرية في Firestore وقاعدة البيانات
    const res = await executeFinancialTransaction({
      goldDelta: isGold ? -price : 0,
      gemsDelta: !isGold ? -price : 0,
      weapons: updatedWeapons,
      crewInventory: updatedCrewInventory,
      shieldInventory: updatedShieldInventory,
      crewServices: updatedCrewServices,
      ships: updatedShips,
      reason: `شراء [${itemName}] وإضافته للمخزن`,
      onLocalApply: () => {
        if (isGold) setGold(prev => Math.max(0, prev - price));
        else setGems(prev => Math.max(0, prev - price));
        setWeapons(updatedWeapons);
        setCrewInventory(updatedCrewInventory);
        setShieldInventory(updatedShieldInventory);
        setCrewServices(updatedCrewServices);
        setShips(updatedShips);
      }
    });

    // 3. فحص نجاح المعاملة: في حالة الفشل لن يتم خصم أي رصيد
    if (!res.success) {
      alert(`⚠️ فشلت عملية الشراء! لم يتم خصم أي رصيد من حسابك.`);
      return false;
    }

    // 4. تطبيق الأرصدة المؤكدة وتحديث كافة الحالات والمخازن فوراً
    if (typeof res.newGold === 'number') setGold(res.newGold);
    if (typeof res.newGems === 'number') setGems(res.newGems);
    setWeapons(updatedWeapons);
    setCrewInventory(updatedCrewInventory);
    setShieldInventory(updatedShieldInventory);
    setCrewServices(updatedCrewServices);
    setShips(updatedShips);

    localStorage.setItem('pirate_weapons', JSON.stringify(updatedWeapons));
    localStorage.setItem('pirate_crew_inventory', JSON.stringify(updatedCrewInventory));
    localStorage.setItem('pirate_shield_inventory', JSON.stringify(updatedShieldInventory));
    localStorage.setItem('pirate_crew_services', JSON.stringify(updatedCrewServices));
    localStorage.setItem('pirate_ships_v2', JSON.stringify(updatedShips));

    const qtyText = quantity > 1 ? ` (${quantity.toLocaleString()}x)` : '';
    alert(`🎉 تم الشراء بنجاح عبر المعاملة الذرية!\nتم خصم الرصيد وإضافة [${itemName}]${qtyText} مباشرة إلى مخزنك.`);
    return true;
  };

  const buyItem = handlePurchase;

  const buyWeaponItem = async (itemId: string, costType: 'gold' | 'blueGems', costValue: number, quantity: number = 1) => {
    const spec = WEAPONS_DATA.find(w => w.key === itemId || w.id === itemId);
    const name = spec?.name || itemId;
    await handlePurchase({
      category: 'weapon',
      itemId,
      itemName: name,
      costType: costType === 'gold' ? 'gold' : 'blueGems',
      price: costValue * quantity,
      quantity
    });
  };

  const buyCrewService = async (
    key: string,
    name: string,
    price: number,
    incrementCount: number = 0,
    costType?: 'gold' | 'gems',
    targetShipId?: string,
    quantity: number = 1
  ) => {
    const spec = CREW_SHOP_ITEMS.find(item => item.id === key);
    const actualCostType = costType || (spec ? spec.costType : 'gems');
    const unitPrice = spec ? spec.price : price;
    const finalQty = Math.max(1, quantity || 1);
    const totalPrice = unitPrice * finalQty;
    await handlePurchase({
      category: 'crew',
      itemId: key,
      itemName: name,
      costType: actualCostType,
      price: totalPrice,
      quantity: finalQty,
      targetShipId
    });
  };

  const toggleAutoFishing = (shipId: string) => {
    setShips(prev => {
      let isPausedNow = false;
      const updated = prev.map(s => {
        if (s.id === shipId) {
          isPausedNow = !s.autoFishingPaused;
          return {
            ...s,
            autoFishingPaused: isPausedNow
          };
        }
        return s;
      });
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const normalizeCrewMemberKey = (key: string): string => {
    if (key === 'police') return 'cop';
    if (key === 'sailors') return 'sailor';
    if (key === 'gold_fisher') return 'golden_hunter';
    if (key === 'repairer_small' || key === 'smallRepair') return 'fixer_sm';
    if (key === 'repairer_medium' || key === 'mediumRepair') return 'fixer_md';
    if (key === 'repairer_large' || key === 'largeRepair') return 'fixer_lg';
    if (key === 'repairer_legendary' || key === 'legendaryRepair') return 'fixer_epic';
    return key;
  };

  const assignCrewToAllShips = (key: string) => {
    const normalizedKey = normalizeCrewMemberKey(key);
    setShips(prev => {
      const updated = prev.map(s => {
        if (s.exists) {
          const currentCrew = s.assignedCrew || [];
          const newCrew = currentCrew.includes(normalizedKey) ? currentCrew : [...currentCrew, normalizedKey];
          return {
            ...s,
            assignedCrew: newCrew,
            crewPower: (s.crewPower || 0) + (currentCrew.includes(normalizedKey) ? 0 : 15),
            autoFishingPaused: false
          };
        }
        return s;
      });
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
      return updated;
    });

    setCrewServices(prev => {
      const updated = {
        ...prev,
        [normalizedKey]: true,
        [key]: true,
        ...(normalizedKey === 'cop' ? { police: true } : {}),
        ...(normalizedKey === 'sailor' ? { sailors: true } : {}),
        ...(normalizedKey === 'golden_hunter' ? { gold_fisher: true } : {}),
      };
      localStorage.setItem('pirate_crew_services', JSON.stringify(updated));
      return updated;
    });
  };

  const unassignCrewFromAllShips = (key: string) => {
    const normalizedKey = normalizeCrewMemberKey(key);
    setShips(prev => {
      const updated = prev.map(s => {
        const currentCrew = s.assignedCrew || [];
        return {
          ...s,
          assignedCrew: currentCrew.filter(c => c !== normalizedKey && c !== key),
          crewPower: Math.max(0, (s.crewPower || 0) - (currentCrew.includes(normalizedKey) ? 15 : 0))
        };
      });
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
      return updated;
    });

    setCrewServices(cs => {
      const newCs = {
        ...cs,
        [normalizedKey]: false,
        [key]: false,
        ...(normalizedKey === 'golden_hunter' ? { gold_fisher: false } : {})
      };
      localStorage.setItem('pirate_crew_services', JSON.stringify(newCs));
      return newCs;
    });
  };

  const unassignCrewFromShip = (key: string, shipId: string) => {
    const normalizedKey = normalizeCrewMemberKey(key);
    setShips(prev => {
      const updated = prev.map(s => {
        if (s.id === shipId) {
          const currentCrew = s.assignedCrew || [];
          return {
            ...s,
            assignedCrew: currentCrew.filter(c => c !== normalizedKey && c !== key),
            crewPower: Math.max(0, (s.crewPower || 0) - 15)
          };
        }
        return s;
      });
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));

      // If removing Golden Hunter, check if any other ship still has it
      if (normalizedKey === 'golden_hunter') {
        const stillAssignedElsewhere = updated.some(s => s.assignedCrew?.includes('golden_hunter') || s.assignedCrew?.includes('gold_fisher'));
        if (!stillAssignedElsewhere) {
          setCrewServices(cs => {
            const newCs = { ...cs, golden_hunter: false, gold_fisher: false };
            localStorage.setItem('pirate_crew_services', JSON.stringify(newCs));
            return newCs;
          });
        }
      }

      return updated;
    });
  };

  const transferCrewToShip = (key: string, fromShipId: string, toShipId: string) => {
    const normalizedKey = key === 'police' ? 'cop' : key === 'sailors' ? 'sailor' : key === 'gold_fisher' ? 'golden_hunter' : key;
    const targetShip = ships.find(s => s.id === toShipId);
    const targetName = targetShip?.name || 'السفينة الجديدة';
    setShips(prev => {
      const updated = prev.map(s => {
        if (s.id === fromShipId) {
          const currentCrew = s.assignedCrew || [];
          return {
            ...s,
            assignedCrew: currentCrew.filter(c => c !== normalizedKey && c !== key),
            crewPower: Math.max(0, (s.crewPower || 0) - 15)
          };
        }
        if (s.id === toShipId) {
          const currentCrew = s.assignedCrew || [];
          const newCrew = currentCrew.includes(normalizedKey) ? currentCrew : [...currentCrew, normalizedKey];
          return {
            ...s,
            assignedCrew: newCrew,
            crewPower: (s.crewPower || 0) + 15
          };
        }
        return s;
      });
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
      return updated;
    });
    alert(`⚓ تم نقل الطاقم بنجاح إلى ظهر سفينة [${targetName}]!`);
  };

  // --- Stealing / Pirate Raid Simulation (الشرطي حارس من السرقة) - تم إيقاف المحاكاة والاشعارات الوهمية تماماً تلبية لرغبة المستخدم ---
  useEffect(() => {
    // تم إلغاء محاكاة سرقة الذهب والاشعارات الوهمية تماماً لمنع أي إزعاج أو تنبيهات غير حقيقية.
    return () => {};
  }, []);

  // --- Real Multiplayer Tribe Handlers ---
  const handleCreateTribe = async () => {
    if (!newTribeName.trim()) {
      alert("يرجى إدخال اسم التحالف!");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const nowIso = new Date().toISOString();
    const localTribeId = 'tribe_' + Date.now();
    const baseTribeData = {
      name: newTribeName.trim(),
      description: newTribeDesc.trim() || 'تحالف أبطال البحار والأعماق',
      emblem: newTribeEmblem || '🏴‍☠️',
      leaderId: currentUser.uid,
      leaderName: username,
      level: 1,
      power: exp || 100,
      donations: 0,
      membersCount: 1,
      members: [currentUser.uid],
      lastUpdated: nowIso,
      createdAt: nowIso
    };

    try {
      let resolvedId = localTribeId;
      try {
        const docRef = await addDoc(collection(db, 'tribes'), baseTribeData);
        if (docRef?.id) resolvedId = docRef.id;
      } catch {
        // Fallback if /tribes collection rules restrict direct writes
      }

      const tribeObj = { id: resolvedId, ...baseTribeData };
      setTribes(prev => [tribeObj, ...prev.filter(t => t.id !== resolvedId)]);
      setTribeId(resolvedId);
      setTribeName(baseTribeData.name);

      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        tribeId: resolvedId,
        tribeName: baseTribeData.name,
        tribeSnapshot: tribeObj,
        updatedAt: nowIso
      }, { merge: true });

      sendSecureChatMessage(
        'إشعار التحالفات 🛡️',
        '🛡️',
        `🎉 قام القبطان @${username} بتأسيس تحالف جديد باسم [${baseTribeData.name}] ${newTribeEmblem}! انضموا الآن!`
      );

      setShowCreateTribeModal(false);
      setNewTribeName('');
      setNewTribeDesc('');
      alert("🎉 تم إنشاء التحالف بنجاح وأصبحت القائد!");
    } catch (err) {
      console.error("Error creating tribe:", err);
      alert("حدث خطأ أثناء إنشاء التحالف!");
    }
  };

  const joinTribe = async (targetTribe: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !targetTribe) return;

    const isMember = targetTribe.members?.includes(currentUser.uid) || targetTribe.id === tribeId;

    try {
      const tribeRef = doc(db, 'tribes', targetTribe.id);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const nowIso = new Date().toISOString();

      if (isMember) {
        const updatedMembers = (targetTribe.members || []).filter((m: string) => m !== currentUser.uid);
        const updatedTribe = {
          ...targetTribe,
          members: updatedMembers,
          membersCount: Math.max(0, updatedMembers.length),
          lastUpdated: nowIso
        };
        updateDoc(tribeRef, {
          members: updatedMembers,
          membersCount: Math.max(0, updatedMembers.length)
        }).catch(() => {});
        await setDoc(userDocRef, {
          tribeId: '',
          tribeName: '',
          tribeSnapshot: null,
          updatedAt: nowIso
        }, { merge: true });
        setTribes(prev => prev.map(t => t.id === targetTribe.id ? updatedTribe : t));
        setTribeId('');
        setTribeName('');
      } else {
        const tribeLevel = Math.max(1, Number(targetTribe.level) || 1);
        const maxMembers = 6 + (tribeLevel - 1) * 2;
        const currentMembersCount = Number(targetTribe.membersCount) || (Array.isArray(targetTribe.members) ? targetTribe.members.length : 0);
        if (currentMembersCount >= maxMembers) {
          showToast(`⚠️ عذراً، قبيلة [${targetTribe.name}] ممتلئة (${currentMembersCount}/${maxMembers})!`, 'error');
          return;
        }

        // Resolve tribe leader's canonical UID & email so notification reaches شيخ القبيلة reliably
        let resolvedLeaderId = resolveCanonicalUid(targetTribe.leaderId || '');
        const leaderPlayer = realPlayers.find(
          (p) =>
            p.id === resolvedLeaderId ||
            p.userId === resolvedLeaderId ||
            (targetTribe.leaderName && p.username === targetTribe.leaderName)
        );
        if ((!resolvedLeaderId || resolvedLeaderId.startsWith('captain_')) && leaderPlayer) {
          resolvedLeaderId = getTargetDefenderId(leaderPlayer) || leaderPlayer.id || resolvedLeaderId;
        }
        const leaderEmail = (leaderPlayer?.email || '').toLowerCase().trim();

        const isNpcOfficial = targetTribe.leaderId === 'official';
        const isSelfLeader = Boolean(resolvedLeaderId && resolvedLeaderId === currentUser.uid);

        if (!isNpcOfficial && resolvedLeaderId && !isSelfLeader) {
          const alreadyPending = outgoingTribeJoinRequests.some(
            (r) => r.tribeId === targetTribe.id && r.status === 'PENDING'
          );
          if (alreadyPending) {
            showToast(`⏳ طلبك للانضمام إلى [${targetTribe.name}] قيد الانتظار لدى شيخ القبيلة!`, 'info');
            return;
          }

          await addDoc(collection(db, 'harborEvents'), {
            attackerId: currentUser.uid,
            attackerName: username || 'قبطان_مجهول',
            attackerAvatar: avatar || '⚓',
            defenderId: resolvedLeaderId,
            type: 'TRIBE_JOIN_REQUEST',
            payload: {
              tribeId: targetTribe.id,
              tribeName: targetTribe.name || 'قبيلة',
              tribeEmblem: targetTribe.emblem || '🛡️',
              leaderId: resolvedLeaderId,
              leaderName: targetTribe.leaderName || leaderPlayer?.username || '',
              ...(leaderEmail ? { targetEmail: leaderEmail } : {}),
              applicantId: currentUser.uid,
              applicantName: username || 'قبطان_مجهول',
              applicantAvatar: avatar || '⚓',
              applicantLevel: playerLevel,
              applicantPower: exp || 0,
            },
            status: 'PENDING',
            createdAt: nowIso
          });

          showToast(`📩 تم إرسال طلب الانضمام إلى شيخ قبيلة [${targetTribe.name}] وبانتظار موافقته!`, 'success');
          return;
        }

        const updatedMembers = Array.from(new Set([...(targetTribe.members || []), currentUser.uid]));
        const updatedTribe = {
          ...targetTribe,
          members: updatedMembers,
          membersCount: updatedMembers.length,
          maxMembers,
          lastUpdated: nowIso
        };
        updateDoc(tribeRef, {
          members: updatedMembers,
          membersCount: updatedMembers.length
        }).catch(() => {});
        await setDoc(userDocRef, {
          tribeId: targetTribe.id,
          tribeName: targetTribe.name,
          tribeSnapshot: updatedTribe,
          updatedAt: nowIso
        }, { merge: true });
        setTribes(prev => prev.map(t => t.id === targetTribe.id ? updatedTribe : t));
        setTribeId(targetTribe.id);
        setTribeName(targetTribe.name);

        sendSecureChatMessage(
          'إشعار التحالفات 🛡️',
          '🛡️',
          `⚔️ انضم القبطان @${username} إلى التحالف [${targetTribe.name}]! مرحباً به!`
        );
      }
    } catch (err) {
      console.warn("Tribe membership sync notice:", err);
    }
  };

  const handleApproveTribeJoin = async (req: TribeJoinRequest) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !req) return;

    const nowIso = new Date().toISOString();
    const targetTribe =
      tribes.find((t) => t.id === req.tribeId) ||
      tribes.find((t) => t.id === tribeId || t.leaderId === currentUser.uid) || {
        id: req.tribeId || tribeId,
        name: req.tribeName || tribeName || 'قبيلتي',
        emblem: req.tribeEmblem || '🛡️',
        leaderId: currentUser.uid,
        leaderName: username || 'شيخ القبيلة',
        level: 1,
        power: 10,
        donations: 0,
        members: [currentUser.uid],
        membersCount: 1,
      };

    const tribeLevel = Math.max(1, Number(targetTribe.level) || 1);
    const maxMembers = 6 + (tribeLevel - 1) * 2;
    const currentMembers = Array.isArray(targetTribe.members) ? targetTribe.members : [currentUser.uid];

    if (!currentMembers.includes(req.applicantId) && currentMembers.length >= maxMembers) {
      showToast(`⚠️ عذراً، قبيلة [${targetTribe.name}] مكتملة العدد (${currentMembers.length}/${maxMembers})!`, 'error');
      return;
    }

    const updatedMembers = Array.from(new Set([...currentMembers, req.applicantId]));
    const updatedTribe = {
      ...targetTribe,
      members: updatedMembers,
      membersCount: updatedMembers.length,
      maxMembers,
      lastUpdated: nowIso,
    };

    try {
      setIncomingTribeJoinRequests((prev) => prev.filter((r) => r.id !== req.id));

      // 1. Mark join request event as approved (delete/update fallback if alias UID)
      try {
        await updateDoc(doc(db, 'harborEvents', req.id), {
          status: 'TRIBE_APPROVED',
          processedAt: nowIso,
        });
      } catch {
        deleteDoc(doc(db, 'harborEvents', req.id)).catch(() => {});
      }

      // 2. Update tribe roster in state, localStorage, leader userDoc, and /tribes
      setTribes((prev) => prev.map((t) => (t.id === updatedTribe.id ? updatedTribe : t)));
      try {
        const stored = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
        const updatedStored = stored.some((t: any) => t.id === updatedTribe.id)
          ? stored.map((t: any) => (t.id === updatedTribe.id ? updatedTribe : t))
          : [updatedTribe, ...stored];
        localStorage.setItem('pirate_local_tribes', JSON.stringify(updatedStored));
      } catch {}

      updateDoc(doc(db, 'users', currentUser.uid), {
        tribeSnapshot: updatedTribe,
        updatedAt: nowIso,
      }).catch(() => {});

      updateDoc(doc(db, 'tribes', updatedTribe.id), {
        members: updatedMembers,
        membersCount: updatedMembers.length,
        lastUpdated: nowIso,
      }).catch(() => {});

      // 3. Notify the applicant so their client finalizes membership immediately or upon next login
      const applicantPlayer = realPlayers.find(
        (p) => p.id === req.applicantId || p.userId === req.applicantId
      );
      await addDoc(collection(db, 'harborEvents'), {
        attackerId: currentUser.uid,
        attackerName: username || 'شيخ القبيلة',
        attackerAvatar: avatar || '👑',
        defenderId: resolveCanonicalUid(req.applicantId) || req.applicantId,
        type: 'TRIBE_JOIN_APPROVED',
        payload: {
          tribeId: updatedTribe.id,
          tribeName: updatedTribe.name,
          tribeEmblem: updatedTribe.emblem || '🛡️',
          tribeSnapshot: updatedTribe,
          leaderName: username || 'شيخ القبيلة',
          ...(applicantPlayer?.email ? { targetEmail: String(applicantPlayer.email).toLowerCase().trim() } : {}),
        },
        status: 'PENDING',
        createdAt: nowIso,
      });

      sendSecureChatMessage(
        'إشعار التحالفات 🛡️',
        updatedTribe.emblem || '🛡️',
        `⚔️ وافق شيخ القبيلة @${username} على انضمام القبطان @${req.applicantName} إلى قبيلة [${updatedTribe.name}]! مرحباً به!`
      );

      showToast(`✅ تمت الموافقة على انضمام القبطان @${req.applicantName} إلى القبيلة!`, 'success');
    } catch (err) {
      console.error('Error approving tribe join request:', err);
      showToast('حدث خطأ أثناء الموافقة على الطلب!', 'error');
    }
  };

  const handleRejectTribeJoin = async (req: TribeJoinRequest) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !req) return;
    const nowIso = new Date().toISOString();

    try {
      setIncomingTribeJoinRequests((prev) => prev.filter((r) => r.id !== req.id));

      try {
        await updateDoc(doc(db, 'harborEvents', req.id), {
          status: 'TRIBE_REJECTED',
          processedAt: nowIso,
        });
      } catch {
        deleteDoc(doc(db, 'harborEvents', req.id)).catch(() => {});
      }

      const applicantPlayer = realPlayers.find(
        (p) => p.id === req.applicantId || p.userId === req.applicantId
      );
      await addDoc(collection(db, 'harborEvents'), {
        attackerId: currentUser.uid,
        attackerName: username || 'شيخ القبيلة',
        attackerAvatar: avatar || '👑',
        defenderId: resolveCanonicalUid(req.applicantId) || req.applicantId,
        type: 'TRIBE_JOIN_REJECTED',
        payload: {
          tribeId: req.tribeId,
          tribeName: req.tribeName,
          leaderName: username || 'شيخ القبيلة',
          ...(applicantPlayer?.email ? { targetEmail: String(applicantPlayer.email).toLowerCase().trim() } : {}),
        },
        status: 'PENDING',
        createdAt: nowIso,
      });

      showToast(`❌ تم رفض طلب انضمام القبطان @${req.applicantName}.`, 'info');
    } catch (err) {
      console.error('Error rejecting tribe join request:', err);
    }
  };

  const handleCancelTribeJoin = async (req: TribeJoinRequest) => {
    if (!req?.id) return;
    try {
      setOutgoingTribeJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
      await deleteDoc(doc(db, 'harborEvents', req.id));
      showToast(`تم إلغاء طلب الانضمام إلى قبيلة [${req.tribeName}].`, 'info');
    } catch (err) {
      console.warn('Cancel tribe join request notice:', err);
    }
  };

  const handleApproveTribeJoinById = (reqId: string) => {
    const found = incomingTribeJoinRequests.find((r) => r.id === reqId);
    if (found) {
      void handleApproveTribeJoin(found);
    }
  };

  const handleRejectTribeJoinById = (reqId: string) => {
    const found = incomingTribeJoinRequests.find((r) => r.id === reqId);
    if (found) {
      void handleRejectTribeJoin(found);
    }
  };

  const handleSendTribeInvite = async (player: any, activeTribe: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !player || !activeTribe) return;

    const rawTargetId = player.userId || player.id;
    const targetUid = resolveCanonicalUid(rawTargetId) || rawTargetId;
    if (!targetUid || targetUid === currentUser.uid) return;

    const nowIso = new Date().toISOString();
    const targetEmail = (player.email || '').toLowerCase().trim();
    const tribeLevel = Math.max(1, Number(activeTribe.level) || 1);

    try {
      await addDoc(collection(db, 'harborEvents'), {
        attackerId: currentUser.uid,
        attackerName: username || 'قبطان_مجهول',
        attackerAvatar: avatar || '⚓',
        defenderId: targetUid,
        type: 'TRIBE_INVITE',
        payload: {
          tribeId: activeTribe.id,
          tribeName: activeTribe.name || 'قبيلة',
          tribeEmblem: activeTribe.emblem || '🛡️',
          tribeLevel,
          leaderId: activeTribe.leaderId || currentUser.uid,
          leaderName: activeTribe.leaderName || username || 'شيخ القبيلة',
          inviterId: currentUser.uid,
          inviterName: username || 'قبطان_مجهول',
          inviterAvatar: avatar || '⚓',
          ...(targetEmail ? { targetEmail } : {}),
          recipientId: targetUid,
          recipientName: player.username || 'قبطان',
        },
        status: 'PENDING',
        createdAt: nowIso,
      });

      showToast(`📩 تم إرسال دعوة انضمام رسمية إلى القبطان @${player.username || 'اللاعب'}!`, 'success');
    } catch (err) {
      console.error('Error sending tribe invite:', err);
      showToast('⚠️ تعذر إرسال الدعوة حالياً، حاول مرة أخرى.', 'error');
    }
  };

  const handleAcceptTribeInvite = async (inv: TribeInvitation) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !inv) return;

    const nowIso = new Date().toISOString();
    const playerLevel = Math.max(1, Math.floor(Math.sqrt(exp || 0) / 10) + 1);
    const resolvedLeaderId = inv.leaderId && inv.leaderId !== 'official'
      ? (resolveCanonicalUid(inv.leaderId) || inv.leaderId)
      : inv.leaderId;
    const isInvitedByLeaderOrOfficial =
      inv.leaderId === 'official' ||
      !resolvedLeaderId ||
      resolvedLeaderId === inv.inviterId ||
      inv.inviterId === resolvedLeaderId;

    try {
      setIncomingTribeInvitations((prev) => prev.filter((i) => i.id !== inv.id));

      try {
        await updateDoc(doc(db, 'harborEvents', inv.id), {
          status: 'TRIBE_INVITE_ACCEPTED',
          processedAt: nowIso,
        });
      } catch {
        deleteDoc(doc(db, 'harborEvents', inv.id)).catch(() => {});
      }

      if (!isInvitedByLeaderOrOfficial && resolvedLeaderId && resolvedLeaderId !== currentUser.uid) {
        const leaderPlayer = realPlayers.find(
          (p) => p.id === resolvedLeaderId || p.userId === resolvedLeaderId
        );
        const leaderEmail = (leaderPlayer?.email || '').toLowerCase().trim();

        await addDoc(collection(db, 'harborEvents'), {
          attackerId: currentUser.uid,
          attackerName: username || 'قبطان_مجهول',
          attackerAvatar: avatar || '⚓',
          defenderId: resolvedLeaderId,
          type: 'TRIBE_JOIN_REQUEST',
          payload: {
            tribeId: inv.tribeId,
            tribeName: inv.tribeName,
            tribeEmblem: inv.tribeEmblem || '🛡️',
            leaderId: resolvedLeaderId,
            leaderName: inv.leaderName || leaderPlayer?.username || '',
            ...(leaderEmail ? { targetEmail: leaderEmail } : {}),
            applicantId: currentUser.uid,
            applicantName: username || 'قبطان_مجهول',
            applicantAvatar: avatar || '⚓',
            applicantLevel: playerLevel,
            applicantPower: exp || 0,
          },
          status: 'PENDING',
          createdAt: nowIso,
        });

        showToast(`📩 قبلت الدعوة! تم إرسال طلب انضمامك إلى شيخ قبيلة [${inv.tribeName}] للموافقة النهائية.`, 'info');
        return;
      }

      const matchedTribe = tribes.find((t) => t.id === inv.tribeId);
      const existingMembers = Array.isArray(matchedTribe?.members)
        ? matchedTribe.members
        : (resolvedLeaderId && resolvedLeaderId !== 'official' ? [resolvedLeaderId] : []);
      const updatedMembers = Array.from(new Set([...existingMembers, currentUser.uid]));
      const tribeLevel = Math.max(1, Number(matchedTribe?.level ?? inv.tribeLevel) || 1);
      const maxMembers = 6 + (tribeLevel - 1) * 2;
      const updatedTribe = {
        ...(matchedTribe || {}),
        id: inv.tribeId,
        name: inv.tribeName || matchedTribe?.name || 'قبيلة',
        emblem: inv.tribeEmblem || matchedTribe?.emblem || '🛡️',
        level: tribeLevel,
        leaderId: inv.leaderId || matchedTribe?.leaderId || inv.inviterId,
        leaderName: inv.leaderName || matchedTribe?.leaderName || inv.inviterName,
        members: updatedMembers,
        membersCount: updatedMembers.length,
        maxMembers,
        lastUpdated: nowIso,
      };

      setTribeId(updatedTribe.id);
      setTribeName(updatedTribe.name);
      try {
        localStorage.setItem('pirate_tribe_id', updatedTribe.id);
        localStorage.setItem('pirate_tribe_name', updatedTribe.name);
      } catch {}

      setTribes((prev) => {
        const exists = prev.some((t) => t.id === updatedTribe.id);
        return exists
          ? prev.map((t) => (t.id === updatedTribe.id ? updatedTribe : t))
          : [updatedTribe, ...prev];
      });

      await setDoc(doc(db, 'users', currentUser.uid), {
        tribeId: updatedTribe.id,
        tribeName: updatedTribe.name,
        tribeSnapshot: updatedTribe,
        updatedAt: nowIso,
      }, { merge: true });

      updateDoc(doc(db, 'tribes', updatedTribe.id), {
        members: updatedMembers,
        membersCount: updatedMembers.length,
        lastUpdated: nowIso,
      }).catch(() => {});

      const notifyTargetId = resolvedLeaderId && resolvedLeaderId !== 'official'
        ? resolvedLeaderId
        : (resolveCanonicalUid(inv.inviterId) || inv.inviterId);
      if (notifyTargetId && notifyTargetId !== currentUser.uid) {
        const leaderPlayer = realPlayers.find((p) => p.id === notifyTargetId || p.userId === notifyTargetId);
        await addDoc(collection(db, 'harborEvents'), {
          attackerId: currentUser.uid,
          attackerName: username || 'قبطان_مجهول',
          attackerAvatar: avatar || '⚓',
          defenderId: notifyTargetId,
          type: 'TRIBE_INVITE_ACCEPTED',
          payload: {
            tribeId: updatedTribe.id,
            tribeName: updatedTribe.name,
            tribeEmblem: updatedTribe.emblem || '🛡️',
            memberId: currentUser.uid,
            memberName: username || 'قبطان_مجهول',
            ...(leaderPlayer?.email ? { targetEmail: String(leaderPlayer.email).toLowerCase().trim() } : {}),
          },
          status: 'PENDING',
          createdAt: nowIso,
        });
      }

      sendSecureChatMessage(
        'إشعار التحالفات 🛡️',
        updatedTribe.emblem || '🛡️',
        `⚔️ قبل القبطان @${username} الدعوة وانضم إلى قبيلة [${updatedTribe.name}]! مرحباً به!`
      );
      showToast(`🎉 تم قبول الدعوة والانضمام إلى قبيلة [${updatedTribe.name}] بنجاح!`, 'success');
    } catch (err) {
      console.error('Error accepting tribe invite:', err);
      showToast('حدث خطأ أثناء قبول الدعوة!', 'error');
    }
  };

  const handleDeclineTribeInvite = async (inv: TribeInvitation) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !inv) return;
    const nowIso = new Date().toISOString();

    try {
      setIncomingTribeInvitations((prev) => prev.filter((i) => i.id !== inv.id));

      try {
        await updateDoc(doc(db, 'harborEvents', inv.id), {
          status: 'TRIBE_INVITE_DECLINED',
          processedAt: nowIso,
        });
      } catch {
        deleteDoc(doc(db, 'harborEvents', inv.id)).catch(() => {});
      }

      const inviterUid = resolveCanonicalUid(inv.inviterId) || inv.inviterId;
      if (inviterUid && inviterUid !== currentUser.uid) {
        const inviterPlayer = realPlayers.find((p) => p.id === inviterUid || p.userId === inviterUid);
        await addDoc(collection(db, 'harborEvents'), {
          attackerId: currentUser.uid,
          attackerName: username || 'قبطان_مجهول',
          attackerAvatar: avatar || '⚓',
          defenderId: inviterUid,
          type: 'TRIBE_INVITE_DECLINED',
          payload: {
            tribeId: inv.tribeId,
            tribeName: inv.tribeName,
            recipientName: username || 'قبطان_مجهول',
            ...(inviterPlayer?.email ? { targetEmail: String(inviterPlayer.email).toLowerCase().trim() } : {}),
          },
          status: 'PENDING',
          createdAt: nowIso,
        });
      }

      showToast(`❌ تم رفض دعوة الانضمام إلى قبيلة [${inv.tribeName}].`, 'info');
    } catch (err) {
      console.error('Error declining tribe invite:', err);
    }
  };

  const handleAcceptTribeInviteById = (invId: string) => {
    const found = incomingTribeInvitations.find((i) => i.id === invId);
    if (found) {
      void handleAcceptTribeInvite(found);
    }
  };

  const handleDeclineTribeInviteById = (invId: string) => {
    const found = incomingTribeInvitations.find((i) => i.id === invId);
    if (found) {
      void handleDeclineTribeInvite(found);
    }
  };

  const donateToTribe = async (targetTribe: any) => {
    if (gold < 100) {
      alert('الذهب غير كافٍ للتبرع (يتطلب 100 ذهب)!');
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const nowIso = new Date().toISOString();
      setGold(prev => Math.max(0, prev - 100));
      const tribeRef = doc(db, 'tribes', targetTribe.id);
      const nextDonations = (targetTribe.donations || 0) + 100;
      const nextPower = (targetTribe.power || 0) + 2000;
      const nextLevel = Math.floor(nextDonations / 3000) + 1;

      const updatedTribe = {
        ...targetTribe,
        donations: nextDonations,
        power: nextPower,
        level: nextLevel,
        lastUpdated: nowIso
      };
      setTribes(prev => prev.map(t => t.id === targetTribe.id ? updatedTribe : t));

      updateDoc(tribeRef, {
        donations: nextDonations,
        power: nextPower,
        level: nextLevel
      }).catch(() => {});

      await setDoc(doc(db, 'users', currentUser.uid), {
        tribeSnapshot: updatedTribe,
        updatedAt: nowIso
      }, { merge: true });

      updateQuestProgress('q3', 100);
      alert(`🪙 شكرًا لتبرعك بـ 100 ذهب! ارتفعت قوة تحالف [${targetTribe.name}] إلى 🛡️ ${nextPower.toLocaleString()}.`);
    } catch (err) {
      console.error("Error donating to tribe:", err);
    }
  };

  // --- Real Multiplayer Friend Handlers ---
  const handleSendFriendRequest = async (targetPlayer: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast('يجب تسجيل الدخول لإرسال طلب صداقة', 'error');
      return;
    }
    const targetId = getTargetDefenderId(targetPlayer);
    if (!targetId || targetId === currentUser.uid) return;

    try {
      if (friends.includes(targetId)) {
        showToast(`القبطان @${targetPlayer.username} صديقك بالفعل! 🌟`, 'success');
        return;
      }

      await addDoc(collection(db, 'friendRequests'), {
        senderId: currentUser.uid,
        senderName: username || 'قبطان_مجهول',
        senderAvatar: avatar || '⚓',
        receiverId: targetId,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });

      showToast(`✉️ تم إرسال طلب الصداقة إلى القبطان @${targetPlayer.username} بنجاح!`, 'success');
    } catch (err: any) {
      console.error("Error sending friend request:", err);
      showToast("تعذر إرسال طلب الصداقة: " + (err.message || 'خطأ غير متوقع'), "error");
    }
  };

  const handleAcceptFriendRequest = async (req: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const updatedMyFriends = Array.from(new Set([...friends, req.senderId]));
      setFriends(updatedMyFriends);
      setFriendRequests(prev => prev.filter(r => r.id !== req.id && r.senderId !== req.senderId));

      // 1. Update own user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: updatedMyFriends
      });

      // 2. Mark friend request as ACCEPTED in /friendRequests
      if (req.id) {
        await updateDoc(doc(db, 'friendRequests', req.id), {
          status: 'ACCEPTED'
        });
      }

      showToast(`🎉 أصبحت أنت والقبطان @${req.senderName} صديقين الآن!`, 'success');
    } catch (err: any) {
      console.error("Error accepting friend request:", err);
      showToast("حدث خطأ أثناء قبول الصداقة!", "error");
    }
  };

  const handleDeclineFriendRequest = async (req: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      setFriendRequests(prev => prev.filter(r => r.id !== req.id && r.senderId !== req.senderId));
      if (req.id) {
        await deleteDoc(doc(db, 'friendRequests', req.id));
      }
      showToast(`تم رفض طلب الصداقة من @${req.senderName}`, 'info');
    } catch (err: any) {
      console.error("Error declining friend request:", err);
    }
  };

  const handleSendGiftToFriend = async (friendPlayer: any) => {
    if (gold < 500) {
      showToast("الذهب غير كافٍ لإرسال هدية الصداقة (تتطلب 500 ذهب)!", "error");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const friendId = getTargetDefenderId(friendPlayer);
    if (!friendId) return;

    try {
      setGold(prev => Math.max(0, prev - 500));
      await updateDoc(doc(db, 'users', currentUser.uid), {
        gold: Math.max(0, gold - 500)
      });

      // Secure collection-based dispatch to /harborEvents
      await createHarborEvent(friendId, 'GIFT', {
        amount: 500,
        senderName: username,
        targetName: friendPlayer.username || '',
        targetEmail: friendPlayer.email || ''
      });

      sendSecureChatMessage(
        'هدية الصداقة 🎁',
        '🎁',
        `🎁 أرسل القبطان @${username} هدية صيد قيمة تحتوي على 500 ذهب إلى صديقه القبطان @${friendPlayer.username}!`
      );

      showToast(`🎁 تم إرسال 500 ذهب بنجاح إلى القبطان @${friendPlayer.username}!`, 'success');
    } catch (err: any) {
      console.error("Error sending gift:", err);
      showToast("تعذر إرسال الهدية: " + (err.message || ''), "error");
    }
  };

  const handleCopyGameLink = () => {
    const gameUrl = window.location.href;
    navigator.clipboard.writeText(gameUrl).then(() => {
      alert("🔗 تم نسخ رابط اللعبة بنجاح!\n\nشارك الرابط مع أصدقائك في أي دولة ليدخلوا اللعبة ويلتقوا بك في الميناء والدردشة والتحدي المباشر! 🏴‍☠️");
    }).catch(() => {
      alert(`رابط اللعبة هو:\n${gameUrl}`);
    });
  };

  // --- Update Quest Progress ---
  const updateQuestProgress = (id: string, amount: number) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id && !q.completed) {
        const nextProgress = Math.min(q.progress + amount, q.max);
        return {
          ...q,
          progress: nextProgress,
          completed: nextProgress >= q.max
        };
      }
      return q;
    }));
  };

  // --- Claim Quest Rewards ---
  const claimQuestReward = (qId: string, rGold: number, rGems: number) => {
    setQuests(prev => prev.map(q => q.id === qId ? { ...q, claimed: true } : q));
    setGold(prev => prev + rGold);
    setGems(prev => prev + rGems);
    alert(`تهانينا! حصلت على ${rGold} ذهب و ${rGems} جواهر.`);
  };

  // --- Send Chat Message ---
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msgText = chatInput.trim();
    if (!msgText) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast('يجب تسجيل الدخول لإرسال رسائل في الدردشة العالمية', 'error');
      return;
    }

    const currentUid = currentUser.uid;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // 1. Optimistic instant UI update: display message right away for sender
    const tempId = 'temp_' + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender: username || 'القبطان',
      senderId: currentUid,
      avatar: avatar || '⚓',
      text: msgText,
      time: timeStr,
      userId: currentUid,
      createdAt: now.toISOString(),
      isMe: true
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setChatInput('');

    // 2. Persist to Firestore for all players
    try {
      await addDoc(collection(db, 'chats'), {
        sender: username || 'القبطان',
        senderId: currentUid,
        avatar: avatar || '⚓',
        text: msgText,
        time: timeStr,
        userId: currentUid,
        createdAt: now.toISOString()
      });
    } catch (err: any) {
      console.error("Error sending message to Firestore:", err);
      showToast('⚠️ تعذر إرسال الرسالة إلى السيرفر: ' + (err.message || 'مشكلة في الاتصال'), 'error');
    }
  };

  // --- Calculate User Rank based on Gold ---
  const getUserRank = () => {
    const currentUser = auth.currentUser;
    if (!currentUser || realPlayers.length === 0) return 'جاري الحساب...';
    const index = realPlayers.findIndex(p => p.userId === currentUser.uid);
    if (index === -1) return 'جاري الحساب...';
    const rank = index + 1;
    if (rank === 1) return 'الأول 🥇';
    if (rank === 2) return 'الثاني 🥈';
    if (rank === 3) return 'الثالث 🥉';
    return `الترتيب ${rank}`;
  };

  // --- Handle Battle Complete ---
  const handleBattleEnd = (report: BattleReport) => {
    setBattleReports(prev => [report, ...prev]);
    const addedExp = crewServices.guide ? report.expGained * 2 : report.expGained;
    setExp(prev => prev + addedExp);
    updateQuestProgress('q1', 1);
    if (!report.isVictory) {
      setPortDestroyed(true);
    }
  };

  if (loadingFirebase) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#0b1329',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: '"Cairo", sans-serif'
      }}>
        <div style={{
          border: '4px solid rgba(250, 204, 21, 0.1)',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          borderLeftColor: '#facc15',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p>جاري تحميل أسطولك من السحابة...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // --- Render Impassable Modal If Session Was Terminated by Another Device ---
  if (sessionTerminationNotice) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 8, 0.96)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        direction: 'rtl',
        fontFamily: '"Cairo", sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(145deg, #181118, #0d0a10)',
          border: '2px solid #ef4444',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35), 0 0 40px rgba(239, 68, 68, 0.2)',
          padding: '28px 24px',
          color: '#f8fafc',
          textAlign: 'center'
        }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto 18px',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)'
          }}>
            🔒
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fca5a5', margin: '0 0 10px' }}>
            تم إنهاء الجلسة تلقائياً
          </h2>

          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1', margin: '0 0 20px' }}>
            تم تسجيل الدخول إلى هذا الحساب من جهاز أو متصفح آخر. للحفاظ على أمان بياناتك وتقدمك في اللعبة ومنع تضارب البيانات، لا يُسمح بتشغيل نفس الحساب في وقت واحد على جهازين.
          </p>

          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'right',
            margin: '0 0 24px',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>الجهاز النشط الجديد:</span>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{sessionTerminationNotice.newDevice}</span>
            </div>
            {sessionTerminationNotice.lastLoginAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>وقت تسجيل الدخول:</span>
                <span style={{ color: '#facc15' }}>
                  {new Date(sessionTerminationNotice.lastLoginAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>حالة هذه الجلسة:</span>
              <span style={{ color: '#f87171', fontWeight: 'bold' }}>منتهية ومحظورة من تنفيذ أي عمليات</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleRecoverSessionFromThisDevice}
              disabled={isRecoveringSession}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: isRecoveringSession 
                  ? 'linear-gradient(135deg, #713f12, #854d0e)' 
                  : 'linear-gradient(135deg, #e11d48, #be123c)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: isRecoveringSession ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)',
                transition: 'transform 0.15s, filter 0.15s',
                opacity: isRecoveringSession ? 0.8 : 1
              }}
              onMouseEnter={(e) => { if (!isRecoveringSession) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { if (!isRecoveringSession) e.currentTarget.style.filter = 'brightness(1)'; }}
            >
              {isRecoveringSession ? '⏳ جاري استعادة الجلسة ومزامنة الأسطول...' : '🔄 استعادة الجلسة وتسجيل الدخول من هذا الجهاز'}
            </button>

            <button
              onClick={async () => {
                setSessionTerminationNotice(null);
                isSessionTerminated.current = false;
                setIsLoggedIn(false);
                setAuthScreen('landing');
                try {
                  await auth.signOut();
                } catch (e) {}
              }}
              style={{
                width: '100%',
                padding: '11px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              العودة للشاشة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    const handleSelectAccount = (name: string, email: string) => {
      let selectedAvatar = '⚓';
      if (email.toLowerCase().includes('neyaz')) {
        selectedAvatar = '🧔';
      } else if (email.toLowerCase().includes('aseel')) {
        selectedAvatar = '🐙';
      } else if (email.toLowerCase().includes('nyaz')) {
        selectedAvatar = '⚔️';
      }
      handleLoginSuccess(name, selectedAvatar, 'سيرفر الأسطورة 1', 'صياد البحار');
    };

    if (authScreen === 'landing') {
      return (
        <LandingScreen
          onStartFree={() => setAuthScreen('register')}
          onLogin={() => setAuthScreen('login')}
        />
      );
    }

    if (authScreen === 'login') {
      return (
        <SigninScreen
          onSuccess={handleSelectAccount}
          onNavigateToRegister={() => setAuthScreen('register')}
          onNavigateToLanding={() => setAuthScreen('landing')}
        />
      );
    }

    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onSuccess={handleSelectAccount}
          onNavigateToLogin={() => setAuthScreen('login')}
          onNavigateToLanding={() => setAuthScreen('landing')}
        />
      );
    }
  }

  return (
    <div style={{ margin: 0, background: '#080604', overflow: 'hidden', width: '100vw', minWidth: '1024px', height: '100dvh', position: 'relative' }}>
      <style>{`
        @keyframes shake-viewport-extreme {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          10% { transform: translate(-12px, -8px) scale(1.03) rotate(-1.8deg); }
          20% { transform: translate(12px, 10px) scale(0.98) rotate(1.8deg); }
          30% { transform: translate(-10px, 8px) scale(1.02) rotate(-1.2deg); }
          40% { transform: translate(8px, -10px) scale(1.01) rotate(1.2deg); }
          50% { transform: translate(-6px, 6px) scale(1.0) rotate(-0.6deg); }
          60% { transform: translate(5px, -5px) scale(1.01) rotate(0.5deg); }
          80% { transform: translate(-2px, 2px) scale(1.0) rotate(-0.2deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes zoom-in-out {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          25% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
          75% { transform: translate(-50%, -50%) scale(1.0); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(1.25); opacity: 0; }
        }
        :root {
            --ship-render-width: 290px;
            --bottom-nav-height: 162px;
            --overlay-top: 78px;
            --overlay-bottom: 162px;
            --overlay-left: 2.5%;
            --overlay-width: 95%;
            --overlay-radius: 16px;
            --overlay-border: 4px solid #ca8a04;
            --shop-border-width: 8px;
            --shop-flex-direction: row;
            --shop-sidebar-width: 230px;
            --shop-sidebar-direction: column;
            --shop-sidebar-border-right: 2px solid #5c3a21;
            --shop-sidebar-border-bottom: none;
            --shop-sidebar-overflow-x: visible;
            --shop-sidebar-padding: 14px;
            --shop-item-min-width: 260px;
            --shop-max-height: 92vh;
            --grid-columns: 1fr 1fr;
        }

        /* وضع مصمم الكمبيوتر الدائم (Always Desktop Site Mode) - مقاسات متناسقة وواضحة لجميع القوائم */

        #harbor-viewport { 
            position: fixed; 
            top: 0;
            left: 0;
            width: 100vw; 
            min-width: 1024px;
            height: calc(100vh - var(--bottom-nav-height)); 
            height: calc(100dvh - var(--bottom-nav-height)); 
            z-index: 1;
            background: #080604;
            overflow: hidden;
        }

        #map-canvas { 
            position: absolute; 
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            background-image: url('https://drive.google.com/thumbnail?id=1yxJhSwIyEV7b1X9Pe6k5Bdw_qXV6AibT&sz=w1600');
            background-position: center bottom;
            background-size: 100% 100%;
            background-repeat: no-repeat;
        }

        .building-hotspot {
            position: absolute;
            cursor: pointer;
            z-index: 5;
            transition: transform 0.2s ease, filter 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .building-hotspot:hover {
            transform: scale(1.1);
            filter: drop-shadow(0 0 10px rgba(254, 240, 138, 0.8));
        }
        .building-label {
            background: rgba(30, 15, 5, 0.98);
            border: 4.5px solid #ca8a04;
            color: #fef08a;
            border-radius: 20px;
            padding: 16px 36px;
            font-size: 34px;
            font-weight: 1000;
            white-space: nowrap;
            box-shadow: 0 8px 24px rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            gap: 16px;
            direction: rtl;
            text-shadow: 0 2px 5px #000;
        }
        .building-icon {
            font-size: 90px;
            filter: drop-shadow(0 5px 10px rgba(0,0,0,0.75));
            margin-bottom: 6px;
        }

        .top-bar { position: fixed; top: 16px; width: 95%; left: 2.5%; display: flex; justify-content: space-between; z-index: 15; }
        .resource-box { background: rgba(40, 30, 20, 0.94); border: 4px solid #ca8a04; padding: 18px 34px; border-radius: 20px; display: flex; flex-direction: column; align-items: center; min-width: 240px; color: #fff; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.8); }
        .resource-box:hover { background: rgba(55, 40, 30, 0.98); transform: scale(1.05); }
        .res-icon { width: 102px; height: 102px; }
        .res-label { font-size: 34px; border-top: 3px solid #5d4037; padding-top: 8px; margin-top: 8px; width: 100%; text-align: center; font-weight: 900; color: #fef08a; text-shadow: 0 2px 4px rgba(0,0,0,0.9); }

        .ship { 
            position: absolute; 
            width: var(--ship-render-width); 
            z-index: 2; 
            cursor: pointer; 
            transition: left 2s ease-in-out, top 2s ease-in-out, transform 0.5s ease-in-out; 
            filter: drop-shadow(0 8px 6px rgba(0,0,0,0.5));
            will-change: left, top, transform;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }

        /* Continuous realistic swaying for ALL ships */
        .ship-inner {
            animation: ship-float-real 6s infinite ease-in-out;
            transform-origin: bottom center;
            will-change: transform;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }

        /* Staggered delay for each ship so they don't sway perfectly in sync */
        .ship:nth-of-type(1) .ship-inner { animation-delay: 0s; animation-duration: 5.5s; }
        .ship:nth-of-type(2) .ship-inner { animation-delay: -1.5s; animation-duration: 6.2s; }
        .ship:nth-of-type(3) .ship-inner { animation-delay: -3.2s; animation-duration: 4.8s; }
        .ship:nth-of-type(4) .ship-inner { animation-delay: -4.5s; animation-duration: 5.8s; }

        @keyframes ship-float-real {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-5px) rotate(1.2deg); }
        }

        /* Moving ships sway slightly faster with larger amplitude */
        .ship.moving .ship-inner {
            animation: ship-float-fast-real 2.8s infinite ease-in-out;
        }

        @keyframes ship-float-fast-real {
            0%, 100% { transform: translateY(0) rotate(-1.5deg); }
            50% { transform: translateY(-7px) rotate(2deg); }
        }

        /* Ship wake ripple behind moving ships */
        .ship-wake {
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 90px;
            height: 24px;
            background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.45) 0%, rgba(34, 211, 238, 0.15) 40%, transparent 75%);
            border-radius: 50%;
            animation: wake-pulse-real 1.2s infinite ease-out;
            z-index: -1;
            pointer-events: none;
        }

        @keyframes wake-pulse-real {
            0% { transform: translateX(-50%) scale(0.7); opacity: 0.9; }
            100% { transform: translateX(-50%) scale(1.5); opacity: 0; }
        }

        /* Forward-cast drag and sway animation for the fishing net anchored at the ship bow */
        @keyframes net-sway-anim {
            0%, 100% { transform: rotate(-2deg) scaleY(1); opacity: 0.96; }
            50% { transform: rotate(2.5deg) scaleX(1.03) scaleY(0.97); opacity: 1; }
        }
        .fishing-net-animation {
            animation: net-sway-anim 3.8s infinite ease-in-out;
            transform-origin: left center;
            transition: opacity 0.5s ease-in-out;
        }


        /* Dynamic Weather System Effects */
        .weather-rain-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
            background-image: repeating-linear-gradient(110deg, rgba(14, 116, 144, 0.12) 0px, rgba(14, 116, 144, 0.12) 1.5px, transparent 1.5px, transparent 35px),
                              repeating-linear-gradient(110deg, rgba(255, 255, 255, 0.08) 0px, rgba(255, 255, 255, 0.08) 1px, transparent 1px, transparent 45px);
            animation: rain-fall 0.6s linear infinite;
        }

        @keyframes rain-fall {
            0% { background-position: 0px 0px; }
            100% { background-position: 120px 800px; }
        }

        .rain-streak {
            position: absolute;
            top: -100px;
            background: linear-gradient(transparent, rgba(165, 243, 252, 0.45));
            width: 1px;
            height: 50px;
            pointer-events: none;
            animation: rain-fall-streak 0.7s linear infinite;
        }

        @keyframes rain-fall-streak {
            0% {
                transform: translateY(0) translateX(0) rotate(15deg);
                opacity: 0;
            }
            10% {
                opacity: 0.6;
            }
            90% {
                opacity: 0.6;
            }
            100% {
                transform: translateY(110vh) translateX(180px) rotate(15deg);
                opacity: 0;
            }
        }

        .weather-fog-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
            background: rgba(224, 242, 254, 0.12);
            mix-blend-mode: overlay;
            animation: fog-pulse 10s ease-in-out infinite alternate;
        }

        @keyframes fog-pulse {
            0% { opacity: 0.5; }
            100% { opacity: 0.9; }
        }

        .fog-cloud {
            position: absolute;
            background: radial-gradient(circle, rgba(241, 245, 249, 0.34) 0%, rgba(241, 245, 249, 0.1) 50%, transparent 75%);
            width: 650px;
            height: 450px;
            pointer-events: none;
            z-index: 16;
            opacity: 0.7;
            animation: fog-drift 35s linear infinite;
        }

        .fog-cloud-1 {
            top: 15%;
            left: -300px;
            animation-duration: 40s;
        }

        .fog-cloud-2 {
            top: 45%;
            left: -400px;
            animation-duration: 50s;
            animation-delay: -12s;
        }

        .fog-cloud-3 {
            top: 75%;
            left: -200px;
            animation-duration: 45s;
            animation-delay: -22s;
        }

        @keyframes fog-drift {
            0% { transform: translateX(-650px); }
            100% { transform: translateX(110vw); }
        }

        .weather-storm-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
            background: rgba(15, 23, 42, 0.35);
            mix-blend-mode: multiply;
        }

        .weather-lightning-flash {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 25;
            background: #ffffff;
            opacity: 0;
        }

        .lightning-strike-anim {
            animation: lightning-strike 0.4s ease-out;
        }

        @keyframes lightning-strike {
            0% { opacity: 0; }
            10% { opacity: 0.8; }
            15% { opacity: 0.25; }
            20% { opacity: 0.9; }
            25% { opacity: 0.1; }
            30% { opacity: 0.75; }
            45% { opacity: 0; }
            100% { opacity: 0; }
        }

        @keyframes fade-in-slide-down {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            100% { opacity: 1; transform: translate(-50%, 0); }
        }

        /* High-quality Real Sea & Animated Waves Overlay */
        .sea-waves-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 2;
        }

        /* Gentle rolling wave lines on the water surface */
        .sea-wave-crest {
            position: absolute;
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.35) 40%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.3) 60%, transparent);
            border-top: 1.5px solid rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            height: 12px;
            pointer-events: none;
            z-index: 2;
            opacity: 0;
            box-shadow: 0 -2px 6px rgba(255, 255, 255, 0.2);
        }

        .wave-crest-1 {
            width: 150px;
            left: 60%;
            top: 48%;
            animation: wave-roll 7s infinite ease-in-out;
        }
        .wave-crest-2 {
            width: 200px;
            left: 52%;
            top: 62%;
            animation: wave-roll 9s infinite ease-in-out;
            animation-delay: 2s;
        }
        .wave-crest-3 {
            width: 170px;
            left: 68%;
            top: 76%;
            animation: wave-roll 8s infinite ease-in-out;
            animation-delay: 4.5s;
        }
        .wave-crest-4 {
            width: 220px;
            left: 45%;
            top: 55%;
            animation: wave-roll 10s infinite ease-in-out;
            animation-delay: 1s;
        }
        .wave-crest-5 {
            width: 160px;
            left: 58%;
            top: 86%;
            animation: wave-roll 7.5s infinite ease-in-out;
            animation-delay: 3s;
        }

        @keyframes wave-roll {
            0% {
                transform: translate3d(30px, -15px, 0) scaleX(0.7) scaleY(0.4);
                opacity: 0;
            }
            30% {
                opacity: 0.7;
            }
            70% {
                opacity: 0.5;
            }
            100% {
                transform: translate3d(-45px, 22px, 0) scaleX(1.2) scaleY(1.3);
                opacity: 0;
            }
        }

        /* Ambient water shimmer covering the water area on map */
        .water-shimmer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 55% 45%, rgba(253, 224, 71, 0.14) 0%, transparent 45%),
                radial-gradient(circle at 30% 40%, rgba(14, 116, 144, 0.15) 0%, transparent 60%),
                radial-gradient(circle at 75% 55%, rgba(8, 145, 178, 0.12) 0%, transparent 50%);
            mix-blend-mode: screen;
            animation: water-shimmer-anim-real 12s infinite alternate ease-in-out;
            pointer-events: none;
            z-index: 2;
            will-change: transform, opacity;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }

        @keyframes water-shimmer-anim-real {
            0% { opacity: 0.4; transform: translate3d(0, 0, 0) scale(1); }
            100% { opacity: 0.9; transform: translate3d(2px, -3px, 0) scale(1.04); }
        }

        /* Sunset Sun Sparkles that dynamically glint along the light path */
        .sun-sparkle {
            position: absolute;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 0 10px 3px rgba(253, 224, 71, 0.95), 0 0 4px 1px #fff;
            mix-blend-mode: screen;
            opacity: 0;
            pointer-events: none;
            z-index: 3;
            animation: sparkle-glow infinite ease-in-out;
        }

        @keyframes sparkle-glow {
            0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
            50% { opacity: 0.95; transform: scale(1.15) rotate(180deg); }
        }

        /* Additional random floating wave ripples on the map to give life to other parts of the water */
        .floating-ripple-1 {
            position: absolute;
            left: 20%;
            top: 40%;
            width: 140px;
            height: 35px;
            opacity: 0.28;
            background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.35) 0%, transparent 70%);
            border-radius: 50%;
            animation: ripple-swell-real 4s infinite ease-in-out;
            z-index: 2;
        }

        .floating-ripple-2 {
            position: absolute;
            right: 25%;
            top: 35%;
            width: 200px;
            height: 45px;
            opacity: 0.22;
            background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            animation: ripple-swell-real 5s infinite ease-in-out -1.5s;
            z-index: 2;
        }

        .floating-ripple-3 {
            position: absolute;
            left: 55%;
            top: 60%;
            width: 160px;
            height: 38px;
            opacity: 0.25;
            background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.32) 0%, transparent 70%);
            border-radius: 50%;
            animation: ripple-swell-real 4.5s infinite ease-in-out -3s;
            z-index: 2;
        }

        @keyframes ripple-swell-real {
            0%, 100% { transform: scale(0.85) translateY(0); opacity: 0.15; }
            50% { transform: scale(1.15) translateY(-3px); opacity: 0.38; }
        }

        /* Clouds floating in the sky */
        .sky-cloud {
            position: absolute;
            pointer-events: none;
            z-index: 2;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15));
            mix-blend-mode: color-dodge;
            will-change: transform;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
        .sky-cloud-1 {
            top: 2%;
            left: -200px;
            width: 160px;
            height: auto;
            opacity: 0.38;
            animation: float-cloud 110s linear infinite;
        }
        .sky-cloud-2 {
            top: 6%;
            left: -200px;
            width: 220px;
            height: auto;
            opacity: 0.28;
            animation: float-cloud 160s linear infinite;
            animation-delay: -35s;
        }
        .sky-cloud-3 {
            top: 13%;
            left: -200px;
            width: 140px;
            height: auto;
            opacity: 0.42;
            animation: float-cloud 85s linear infinite;
            animation-delay: -10s;
        }
        @keyframes float-cloud {
            0% { transform: translateX(-200px); }
            100% { transform: translateX(calc(100vw + 350px)); }
        }

        /* Seagulls flying in the sky */
        .seagull-container {
            position: absolute;
            width: 36px;
            height: 16px;
            pointer-events: none;
            z-index: 6;
            will-change: transform;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
        .seagull-1 {
            top: 5%;
            left: -100px;
            animation: fly-r 24s linear infinite;
        }
        .seagull-2 {
            top: 10%;
            left: -100px;
            animation: fly-r 30s linear infinite;
            animation-delay: -9s;
        }
        .seagull-3 {
            top: 3%;
            right: -100px;
            animation: fly-l 27s linear infinite;
            animation-delay: -14s;
        }
        @keyframes fly-r {
            0% { transform: translate3d(-100px, 0, 0) scale(0.6); }
            50% { transform: translate3d(50vw, -20px, 0) scale(0.68); }
            100% { transform: translate3d(calc(100vw + 100px), 10px, 0) scale(0.6); }
        }
        @keyframes fly-l {
            0% { transform: translate3d(100px, 0, 0) scale(0.55) scaleX(-1); }
            50% { transform: translate3d(-50vw, 25px, 0) scale(0.5) scaleX(-1); }
            100% { transform: translate3d(calc(-100vw - 100px), -10px, 0) scale(0.55) scaleX(-1); }
        }
        .left-wing {
            transform-origin: 12px 5px;
            animation: flap-l 0.5s ease-in-out infinite alternate;
            will-change: transform;
        }
        .right-wing {
            transform-origin: 12px 5px;
            animation: flap-r 0.5s ease-in-out infinite alternate;
            will-change: transform;
        }
        @keyframes flap-l {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(-35deg); }
        }
        @keyframes flap-r {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(35deg); }
        }

        /* Waves washing ashore (foam effect on the beach) */
        .shore-wave-layer {
            position: absolute;
            top: 25%;
            left: -5%;
            width: 35%;
            height: 60%;
            pointer-events: none;
            z-index: 2;
            mix-blend-mode: screen;
            opacity: 0;
            transform-origin: left bottom;
            animation: shore-wash 5s infinite ease-in-out;
            will-change: transform, opacity;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
        .shore-wave-layer-2 {
            animation-delay: 2.5s;
        }
        @keyframes shore-wash {
            0% {
                transform: scale(0.96) translate(4px, -4px);
                opacity: 0;
            }
            25% {
                opacity: 0.65;
            }
            55% {
                transform: scale(1.025) translate(-10px, 10px);
                opacity: 0.25;
            }
            100% {
                transform: scale(1.045) translate(-15px, 15px);
                opacity: 0;
            }
        }

        /* Jumping dolphins/orcas */
        .dolphin-wrapper {
            position: absolute;
            pointer-events: none;
            z-index: 3;
            width: 240px;
            height: 120px;
            will-change: transform, opacity;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
        .dolphin-1 {
            animation-name: whale-swim-8s;
            animation-duration: 8s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            animation-delay: 0s;
        }
        .dolphin-4 {
            animation-name: whale-swim-8s-follower;
            animation-duration: 8s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            animation-delay: 0.3s;
        }
        .dolphin-2 {
            animation-name: whale-swim-10s;
            animation-duration: 10s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            animation-delay: -3s;
        }
        .dolphin-5 {
            animation-name: whale-swim-10s-follower;
            animation-duration: 10s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            animation-delay: -2.7s;
        }
        .dolphin-3 {
            animation-name: whale-swim-12s;
            animation-duration: 12s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            animation-delay: -6s;
        }
        .dolphin-6 {
            animation-name: whale-swim-12s-follower;
            animation-duration: 12s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            animation-delay: -5.7s;
        }

        .dolphin-graphic {
            position: absolute;
            width: 180px;
            height: 90px;
            transform-origin: center center;
            filter: drop-shadow(0 6px 12px rgba(3, 40, 58, 0.55));
            mix-blend-mode: normal;
            opacity: 0.95;
        }

        /* Splash effects synchronized with leap cycles */
        .splash-start, .splash-end {
            position: absolute;
            pointer-events: none;
            width: 50px;
            height: 20px;
        }
        .splash-start {
            left: -10px;
            top: 55px;
        }
        .splash-end {
            left: 190px;
            top: 55px;
        }

        .splash-ring {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            border: 2px solid rgba(255, 255, 255, 0.95);
            border-radius: 50%;
            transform: scale(0.1);
            opacity: 0;
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }
        .splash-foam {
            position: absolute;
            left: 5%;
            top: 5%;
            width: 90%;
            height: 90%;
            background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 75%);
            border-radius: 50%;
            transform: scale(0.1);
            opacity: 0;
        }
        .splash-droplet {
            position: absolute;
            background: #ffffff;
            border-radius: 50%;
            width: 3px;
            height: 3px;
            opacity: 0;
            box-shadow: 0 0 3px #fff;
        }

        /* Hide leap splashes completely for realistic and sleek swimming motion */
        .splash-start, .splash-end {
            display: none !important;
        }

        /* Continuous majestic underwater-surface swimming, tilting, and swaying for Humpback Whales (8s cycle) */
        @keyframes whale-swim-8s {
            0% {
                opacity: 0.25;
                transform: translate3d(-60px, 15px, 0) rotate(-4deg) scale(1.15) skewY(-2.5deg);
                filter: blur(1.5px) brightness(0.65);
            }
            20% {
                opacity: 0.95;
                transform: translate3d(20px, -5px, 0) rotate(3deg) scale(1.15) skewY(1.5deg);
                filter: blur(0px) brightness(1.05);
            }
            40% {
                opacity: 0.35;
                transform: translate3d(100px, 10px, 0) rotate(-3deg) scale(1.15) skewY(-1.5deg);
                filter: blur(1.8px) brightness(0.55);
            }
            60% {
                opacity: 0.95;
                transform: translate3d(180px, -4px, 0) rotate(3deg) scale(1.15) skewY(1.8deg);
                filter: blur(0px) brightness(1.05);
            }
            80% {
                opacity: 0.3;
                transform: translate3d(260px, 12px, 0) rotate(-4deg) scale(1.15) skewY(-2deg);
                filter: blur(2px) brightness(0.5);
            }
            100% {
                opacity: 0;
                transform: translate3d(340px, 2px, 0) rotate(2deg) scale(1.15) skewY(1deg);
                filter: blur(1px) brightness(0.7);
            }
        }
        @keyframes whale-swim-8s-follower {
            0% {
                opacity: 0.2;
                transform: translate3d(-80px, 20px, 0) rotate(-4deg) scale(0.85) skewY(-2.5deg);
                filter: blur(1.8px) brightness(0.6);
            }
            20% {
                opacity: 0.9;
                transform: translate3d(0px, 0px, 0) rotate(3deg) scale(0.85) skewY(1.5deg);
                filter: blur(0px) brightness(1.05);
            }
            40% {
                opacity: 0.3;
                transform: translate3d(80px, 15px, 0) rotate(-3deg) scale(0.85) skewY(-1.5deg);
                filter: blur(2px) brightness(0.5);
            }
            60% {
                opacity: 0.9;
                transform: translate3d(160px, 1px, 0) rotate(3deg) scale(0.85) skewY(1.8deg);
                filter: blur(0px) brightness(1.05);
            }
            80% {
                opacity: 0.25;
                transform: translate3d(240px, 17px, 0) rotate(-4deg) scale(0.85) skewY(-2deg);
                filter: blur(2.2px) brightness(0.45);
            }
            100% {
                opacity: 0;
                transform: translate3d(320px, 7px, 0) rotate(2deg) scale(0.85) skewY(1deg);
                filter: blur(1.2px) brightness(0.65);
            }
        }

        /* Continuous majestic underwater-surface swimming, tilting, and swaying for Humpback Whales (10s cycle) */
        @keyframes whale-swim-10s {
            0% {
                opacity: 0.25;
                transform: translate3d(-50px, 10px, 0) rotate(-3deg) scale(1.15) skewY(-1.8deg);
                filter: blur(1.5px) brightness(0.65);
            }
            20% {
                opacity: 0.9;
                transform: translate3d(30px, -4px, 0) rotate(3deg) scale(1.15) skewY(1.5deg);
                filter: blur(0px) brightness(1.05);
            }
            40% {
                opacity: 0.35;
                transform: translate3d(110px, 8px, 0) rotate(-4deg) scale(1.15) skewY(-2deg);
                filter: blur(1.7px) brightness(0.55);
            }
            60% {
                opacity: 0.95;
                transform: translate3d(190px, -3px, 0) rotate(2deg) scale(1.15) skewY(1deg);
                filter: blur(0px) brightness(1.05);
            }
            80% {
                opacity: 0.3;
                transform: translate3d(270px, 10px, 0) rotate(-3deg) scale(1.15) skewY(-1.5deg);
                filter: blur(2px) brightness(0.5);
            }
            100% {
                opacity: 0;
                transform: translate3d(350px, 0px, 0) rotate(3deg) scale(1.15) skewY(1.5deg);
                filter: blur(1.2px) brightness(0.7);
            }
        }
        @keyframes whale-swim-10s-follower {
            0% {
                opacity: 0.2;
                transform: translate3d(-75px, 15px, 0) rotate(-3deg) scale(0.9) skewY(-1.8deg);
                filter: blur(1.8px) brightness(0.6);
            }
            20% {
                opacity: 0.85;
                transform: translate3d(5px, 0px, 0) rotate(3deg) scale(0.9) skewY(1.5deg);
                filter: blur(0px) brightness(1.05);
            }
            40% {
                opacity: 0.3;
                transform: translate3d(85px, 13px, 0) rotate(-4deg) scale(0.9) skewY(-2deg);
                filter: blur(2px) brightness(0.5);
            }
            60% {
                opacity: 0.9;
                transform: translate3d(165px, 1px, 0) rotate(2deg) scale(0.9) skewY(1deg);
                filter: blur(0px) brightness(1.05);
            }
            80% {
                opacity: 0.25;
                transform: translate3d(245px, 15px, 0) rotate(-3deg) scale(0.9) skewY(-1.5deg);
                filter: blur(2.2px) brightness(0.45);
            }
            100% {
                opacity: 0;
                transform: translate3d(325px, 4px, 0) rotate(3deg) scale(0.9) skewY(1.5deg);
                filter: blur(1.4px) brightness(0.65);
            }
        }

        /* Continuous majestic underwater-surface swimming, tilting, and swaying for Humpback Whales (12s cycle) */
        @keyframes whale-swim-12s {
            0% {
                opacity: 0.25;
                transform: translate3d(-40px, 8px, 0) rotate(-2deg) scale(1.1) skewY(-1.5deg);
                filter: blur(1.5px) brightness(0.6);
            }
            25% {
                opacity: 0.95;
                transform: translate3d(50px, -5px, 0) rotate(3deg) scale(1.1) skewY(1.8deg);
                filter: blur(0px) brightness(1.05);
            }
            50% {
                opacity: 0.35;
                transform: translate3d(140px, 6px, 0) rotate(-3deg) scale(1.1) skewY(-2deg);
                filter: blur(1.8px) brightness(0.55);
            }
            75% {
                opacity: 0.9;
                transform: translate3d(230px, -2px, 0) rotate(2deg) scale(1.1) skewY(1deg);
                filter: blur(0px) brightness(1.05);
            }
            100% {
                opacity: 0;
                transform: translate3d(320px, 4px, 0) rotate(-2deg) scale(1.1) skewY(-1deg);
                filter: blur(1.2px) brightness(0.7);
            }
        }
        @keyframes whale-swim-12s-follower {
            0% {
                opacity: 0.2;
                transform: translate3d(-65px, 12px, 0) rotate(-2deg) scale(0.85) skewY(-1.5deg);
                filter: blur(1.8px) brightness(0.55);
            }
            25% {
                opacity: 0.9;
                transform: translate3d(25px, -1px, 0) rotate(3deg) scale(0.85) skewY(1.8deg);
                filter: blur(0px) brightness(1.05);
            }
            50% {
                opacity: 0.3;
                transform: translate3d(115px, 10px, 0) rotate(-3deg) scale(0.85) skewY(-2deg);
                filter: blur(2px) brightness(0.5);
            }
            75% {
                opacity: 0.85;
                transform: translate3d(205px, 2px, 0) rotate(2deg) scale(0.85) skewY(1deg);
                filter: blur(0px) brightness(1.05);
            }
            100% {
                opacity: 0;
                transform: translate3d(295px, 8px, 0) rotate(-2deg) scale(0.85) skewY(-1deg);
                filter: blur(1.4px) brightness(0.65);
            }
        }

        #ship-menu { position: absolute; display: none; background: rgba(20, 12, 6, 0.98); border: 4px solid #ca8a04; border-radius: 20px; padding: 18px; z-index: 25; flex-direction: row; gap: 18px; width: auto; box-shadow: 0 6px 25px rgba(0,0,0,0.9); }
        .menu-btn { display: flex; flex-direction: column; align-items: center; color: #fff; font-size: 28px; font-weight: bold; cursor: pointer; min-width: 120px; transition: transform 0.1s; }
        .menu-btn:hover { transform: scale(1.08); }
        .menu-icon { width: 88px; height: 88px; background: #854d0e; border-radius: 18px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 45px; border: 3.5px solid #fef08a; }

        .modal { display: none; position: absolute; z-index: 100; left: 50%; top: 50%; transform: translate(-50%, -50%); background: #1c1917; border: 4px solid #ca8a04; padding: 28px; border-radius: 20px; color: #fff; text-align: center; width: 430px; box-shadow: 0 8px 28px rgba(0,0,0,0.85); font-size: 27px; }
        
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 162px !important;
          background: url("https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/Aamaaq/refs/heads/main/background.jpg.png") center bottom/100% 100% no-repeat !important;
          border-top: 3.5px solid rgba(234, 179, 8, 0.8) !important;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(254, 240, 138, 0.3) !important;
          display: flex !important;
          direction: ltr !important;
          align-items: center !important;
          justify-content: space-evenly !important;
          z-index: 100 !important;
          padding: 4px 10px 14px 10px !important;
          gap: 6px !important;
          overflow: visible !important;
          user-select: none !important;
          box-sizing: border-box !important;
        }

        .nav-item {
          flex: 1 1 0% !important;
          min-width: 0 !important;
          height: 100% !important;
          cursor: pointer !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 112px;
          height: 112px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234, 179, 8, 0.22) 0%, rgba(202, 138, 4, 0.07) 50%, transparent 72%);
          pointer-events: none;
          transition: all 0.25s ease;
          z-index: 0;
        }

        .nav-item:hover::before {
          width: 126px;
          height: 126px;
          background: radial-gradient(circle, rgba(250, 204, 21, 0.42) 0%, rgba(202, 138, 4, 0.15) 55%, transparent 75%);
        }

        .nav-item.active::before {
          width: 130px;
          height: 130px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.48) 0%, rgba(14, 165, 233, 0.18) 55%, transparent 75%);
        }

        .nav-item img {
          position: relative !important;
          z-index: 1 !important;
          max-width: 100% !important;
          object-fit: contain !important;
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: high-quality !important;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 6px rgba(250, 204, 21, 0.45)) brightness(1.26) contrast(1.16) saturate(1.2) !important;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease !important;
          pointer-events: none !important;
        }

        /* Consistent navigation icons (-10% reduction for perfect harmony) */
        .nav-item-clan img {
          height: 144px !important;
          width: auto !important;
        }
        .nav-item-rank img {
          height: 126px !important;
          width: auto !important;
        }
        .nav-item-friends img {
          height: 126px !important;
          width: auto !important;
        }
        .nav-item-storage img {
          height: 126px !important;
          width: auto !important;
        }
        .nav-item-shop img {
          height: 126px !important;
          width: auto !important;
        }
        .nav-item-chat img {
          height: 152px !important;
          width: auto !important;
        }
        .nav-item-settings img {
          height: 156px !important;
          width: auto !important;
        }

        .nav-item:hover img {
          transform: translateY(-5px) !important;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 12px rgba(250, 204, 21, 0.9)) brightness(1.38) contrast(1.2) saturate(1.25) !important;
        }

        .nav-item.active img {
          transform: translateY(-6px) !important;
          filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.95)) drop-shadow(0 0 4px #ffffff) brightness(1.42) contrast(1.22) saturate(1.22) !important;
        }

        @keyframes pulseMedallion {
          0% { box-shadow: 0 0 10px #0284c7, inset 0 0 8px rgba(56, 189, 248, 0.5); }
          100% { box-shadow: 0 0 20px #38bdf8, inset 0 0 16px rgba(56, 189, 248, 0.9); }
        }

        .nav-item.active .plaque-btn {
          border-color: #38bdf8 !important;
          color: #38bdf8 !important;
          background: linear-gradient(180deg, #0284c7 0%, #075985 100%) !important;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.8) !important;
        }

        .medallion-box {
          position: relative;
          width: 74px;
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .medallion-ring {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 3px solid #ca8a04;
          background: radial-gradient(circle at 35% 30%, #1e293b 0%, #0f172a 60%, #020617 100%);
          box-shadow: 0 4px 12px rgba(0,0,0,0.85), inset 0 0 10px rgba(250, 204, 21, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s ease;
        }

        .jewel-top-diamond {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          background: #38bdf8;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          box-shadow: 0 0 8px #38bdf8;
          border: 1.5px solid #e0f2fe;
          z-index: 2;
        }

        .jewel-bottom-diamond {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          background: #38bdf8;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          box-shadow: 0 0 8px #38bdf8;
          border: 1.5px solid #e0f2fe;
          z-index: 2;
        }

        .plaque-btn {
          margin-top: 4px;
          width: 100%;
          max-width: 100px;
          padding: 3px 0;
          background: linear-gradient(180deg, #1f1912 0%, #0a0805 100%);
          border: 2.5px solid #ca8a04;
          border-radius: 8px;
          color: #fef08a;
          font-size: 19px;
          font-weight: 900;
          text-align: center;
          text-shadow: 0 2px 3px #000;
          box-shadow: 0 3px 6px rgba(0,0,0,0.85);
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .tab-overlay {
            position: fixed;
            top: var(--overlay-top);
            bottom: var(--overlay-bottom);
            left: var(--overlay-left);
            width: var(--overlay-width);
            background: rgba(15, 12, 9, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: var(--overlay-border);
            border-radius: var(--overlay-radius);
            z-index: 20;
            color: #fff;
            padding: 22px;
            padding-bottom: calc(var(--bottom-nav-height) + 22px);
            overflow-y: auto;
            direction: rtl;
            box-shadow: 0 18px 40px rgba(0,0,0,0.92);
            box-sizing: border-box;
            font-size: 27px;
        }
        .tab-title {
            font-size: 39px;
            font-weight: 900;
            color: #facc15;
            text-align: center;
            border-bottom: 4px solid #ca8a04;
            padding-bottom: 14px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            text-shadow: 0 3px 6px rgba(0,0,0,0.9);
        }
        .close-tab-btn {
            background: linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%);
            color: #fff;
            border: 2.5px solid #ef4444;
            border-radius: 12px;
            padding: 8px 24px;
            font-size: 26px;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 3px 8px rgba(0,0,0,0.5);
            transition: all 0.15s ease;
        }
        .close-tab-btn:hover {
            background: #dc2626;
            transform: scale(1.05);
        }

        .grid-cards {
            display: grid;
            grid-template-columns: var(--grid-columns);
            gap: 20px;
        }
        .shop-card {
            background: rgba(30, 24, 18, 0.95);
            border: 2px solid #a16207;
            border-radius: 18px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 6px 16px rgba(0,0,0,0.55);
            font-size: 25px;
        }
        .upgrade-btn {
            background: linear-gradient(180deg, #ca8a04 0%, #a16207 100%);
            color: #fff;
            border: 2px solid #fef08a;
            border-radius: 12px;
            padding: 12px 26px;
            font-size: 25px;
            cursor: pointer;
            font-weight: 900;
            text-shadow: 0 1px 2px #000;
            box-shadow: 0 3px 10px rgba(202,138,4,0.45);
            transition: all 0.2s;
        }
        .upgrade-btn:hover {
            background: #eab308;
            transform: scale(1.04);
        }
      `}</style>



      {/* ----------------- GAME BACKGROUND AND HARBOR VIEW ----------------- */}
      <div id="harbor-viewport">
        <div 
          id="map-canvas" 
          style={(() => {
            const shakeStyle = isOwnHarborShaking ? { animation: 'shake-viewport-extreme 0.65s ease-out infinite' } : {};
            if (portDestroyed || bgTheme === 'destroyed') {
              return { 
                ...shakeStyle,
                backgroundImage: `url('/backgrounds/destroyed_port.webp')`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              };
            }
            return { ...shakeStyle, backgroundImage: `url('/backgrounds/harbor_main.webp')`, backgroundSize: '100% 100%' };
          })()}
        >
          {/* Apocalyptic Dark Fire & Smoke Atmosphere for Destroyed Port */}
          {portDestroyed && (
            <>
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.28) 0%, rgba(40, 15, 5, 0.65) 70%, rgba(15, 5, 0, 0.9) 100%)',
                  pointerEvents: 'none',
                  zIndex: 5,
                  mixBlendMode: 'multiply'
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '50%',
                  background: 'linear-gradient(to bottom, rgba(185, 28, 28, 0.45) 0%, rgba(239, 68, 68, 0.15) 70%, transparent 100%)',
                  pointerEvents: 'none',
                  zIndex: 6
                }}
              />
            </>
          )}

          {!portDestroyed && bgTheme !== 'destroyed' && !disableAnimatedBackground && !powerSaver && (
            <video
              ref={videoRefA}
              src="/background_video.mp4?v=2"
              playsInline
              muted
              loop
              preload="auto"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 2,
                pointerEvents: 'none',
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
            />
          )}
          {/* Particles Effect System Overlay */}
          <ParticlesEffect portDestroyed={portDestroyed} />

          {/* Dynamic Weather System Overlays */}
          {!lowGraphics && (
            <>
              {/* Fog Weather Layer */}
              {weather === 'fog' && (
                <>
                  <div className="weather-fog-overlay" />
                  <div className="fog-cloud fog-cloud-1" />
                  <div className="fog-cloud fog-cloud-2" />
                  <div className="fog-cloud fog-cloud-3" />
                </>
              )}

              {/* Storm Sky Darkener Layer */}
              {weather === 'storm' && (
                <div className="weather-storm-overlay" />
              )}

              {/* Lightning Flash Layer */}
              {weather === 'storm' && lightningActive && (
                <div className="weather-lightning-flash lightning-strike-anim" />
              )}

              {/* Rain/Storm Streaks Layer */}
              {(weather === 'rain' || weather === 'storm') && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 17, overflow: 'hidden' }}>
                  <div className="weather-rain-overlay" style={{ animationDuration: weather === 'storm' ? '0.4s' : '0.6s' }} />
                  {rainStreaks.map(streak => (
                    <div 
                      key={streak.id}
                      className="rain-streak"
                      style={{
                        left: streak.left,
                        animationDelay: streak.delay,
                        animationDuration: weather === 'storm' ? `${parseFloat(streak.dur) * 0.7}s` : streak.dur,
                        opacity: streak.opacity,
                        height: streak.height,
                        willChange: 'transform',
                        transform: 'translateZ(0)'
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}


          {activeTab === 'harbor' && (
            <>
              {/* Interactive Building Hotspots - بيت السمك */}
              <div 
                className="building-hotspot group cursor-pointer" 
                style={{ 
                  position: 'absolute',
                  left: '8%', 
                  top: '36%', 
                  width: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 25,
                  willChange: 'transform'
                }} 
                onClick={() => {
                  if (portDestroyed) {
                    alert("⚠️ بيت السمك تعرض للقصف والاحتراق الشديد! أعد إعمار الميناء والأسطول لترميم المنشآت.");
                    return;
                  }
                  setFishStorageModal(true);
                }}
                title={portDestroyed ? "بيت السمك (محترق ومدمر)" : `بيت السمك - المستوى ${fishStorageLevel}`}
              >
                <div className="building-label" style={{ 
                  marginBottom: '8px', 
                  background: portDestroyed ? 'rgba(50, 10, 10, 0.95)' : 'rgba(0,0,0,0.85)', 
                  padding: '6px 17px', 
                  borderRadius: '14px', 
                  border: portDestroyed ? '1.5px solid #ef4444' : '1px solid #ca8a04', 
                  whiteSpace: 'nowrap', 
                  boxShadow: portDestroyed ? '0 4px 14px rgba(239, 68, 68, 0.7)' : '0 4px 14px rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '21px', fontWeight: '900', color: portDestroyed ? '#fca5a5' : '#facc15', fontFamily: 'Cairo, sans-serif' }}>
                    {portDestroyed ? `🔥 بيت السمك (محترق ومدمر)` : `🐟 بيت السمك (مستوى ${fishStorageLevel})`}
                  </span>
                </div>

                <div style={{
                  width: '238px',
                  height: '238px',
                  position: 'relative',
                  filter: portDestroyed
                    ? 'grayscale(0.9) brightness(0.22) contrast(1.5) sepia(0.8) hue-rotate(-20deg) drop-shadow(0 0 16px rgba(239, 68, 68, 0.9))'
                    : 'drop-shadow(0 14px 22px rgba(0,0,0,0.65))',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center'
                }} className="hover:scale-110 active:scale-95">
                  <img 
                    key={`beach-fish-house-img-${fishStorageLevel}`}
                    src={getFishHouseImageUrl(fishStorageLevel)} 
                    alt={`بيت السمك - مستوى ${fishStorageLevel}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      transition: 'opacity 0.4s ease-in-out, transform 0.3s ease',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))',
                      transform: 'scaleX(-1)'
                    }}
                    loading="eager"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/FISH/refs/heads/main/level-01.png";
                    }}
                  />

                  {/* Fire and smoke rising from burned fish house */}
                  {portDestroyed && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 12, pointerEvents: 'none' }}>
                      <span style={{ position: 'absolute', top: '-15px', left: '20%', fontSize: '28px', animation: 'bounce 0.7s infinite alternate' }}>🔥</span>
                      <span style={{ position: 'absolute', top: '10px', left: '60%', fontSize: '24px', animation: 'pulse 0.6s infinite alternate' }}>🔥</span>
                      <span style={{ position: 'absolute', top: '-30px', left: '40%', fontSize: '28px', opacity: 0.85, animation: 'pulse 1.8s infinite' }}>💨</span>
                    </div>
                  )}
                </div>
              </div>

              <div 
                className="building-hotspot" 
                style={{ 
                  position: 'absolute',
                  left: '73%', 
                  top: '26%', 
                  width: '216px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 20,
                  willChange: 'transform'
                }} 
                onClick={() => {
                  if (portDestroyed) {
                    alert("⚠️ بيت السفن والبرج تعرض للتفجير والاحتراق! أعد إعمار الميناء لترميم الترسانة والأسطول.");
                    return;
                  }
                  setActiveTab('warehouse');
                }}
                title={portDestroyed ? "بيت السفن (محترق ومدمر)" : "بيت السفن"}
              >
                <div className="building-label" style={{ 
                  marginBottom: '8px', 
                  background: portDestroyed ? 'rgba(50, 10, 10, 0.95)' : 'rgba(0,0,0,0.85)', 
                  padding: '7px 17px', 
                  borderRadius: '14px', 
                  border: portDestroyed ? '1.5px solid #ef4444' : '1.5px solid #ca8a04', 
                  whiteSpace: 'nowrap', 
                  boxShadow: portDestroyed ? '0 4px 14px rgba(239, 68, 68, 0.7)' : '0 4px 12px rgba(0,0,0,0.6)' 
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: portDestroyed ? '#fca5a5' : '#facc15', fontFamily: 'Cairo, sans-serif' }}>
                    {portDestroyed ? `🔥 بيت السفن (محترق ومدمر)` : `⚓ بيت السفن (مستوى ${shipTowerLevel})`}
                  </span>
                </div>
                
                <div style={{
                  width: '192px',
                  height: '192px',
                  position: 'relative',
                  filter: portDestroyed
                    ? 'grayscale(0.9) brightness(0.22) contrast(1.5) sepia(0.8) hue-rotate(-20deg) drop-shadow(0 0 16px rgba(239, 68, 68, 0.9))'
                    : 'drop-shadow(0 12px 20px rgba(0,0,0,0.5))',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  transform: 'none'
                }} className="hover:scale-110 active:scale-95">
                  <img 
                    src={getHarborImageUrl(shipTowerLevel)} 
                    alt="بيت السفن"
                    loading="eager"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      imageRendering: 'auto',
                      transition: 'opacity 0.4s ease-in-out',
                      willChange: 'transform',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  />

                  {/* Fire and smoke rising from burned ship tower */}
                  {portDestroyed && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 12, pointerEvents: 'none' }}>
                      <span style={{ position: 'absolute', top: '-12px', left: '20%', fontSize: '28px', animation: 'pulse 0.7s infinite alternate' }}>🔥</span>
                      <span style={{ position: 'absolute', top: '15px', left: '55%', fontSize: '24px', animation: 'bounce 0.6s infinite alternate' }}>🔥</span>
                      <span style={{ position: 'absolute', top: '-32px', left: '35%', fontSize: '28px', opacity: 0.85, animation: 'pulse 1.8s infinite' }}>💨</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Ships swimming on Harbor Map */}
              {ships.map((ship) => {
                if (!ship.exists) return null;
                const sSpeed = ship.speedLevel || 1;
                const sCap = ship.capacityLevel || 1;
                const sDef = ship.defenseLevel || 1;
                const isUpgraded = sSpeed > 1 || sCap > 1 || sDef > 1;

                let mapAuraFilter = 'drop-shadow(0 10px 8px rgba(0,0,0,0.5))';
                if (isUpgraded) {
                  if (sSpeed >= sCap && sSpeed >= sDef) {
                    mapAuraFilter = `drop-shadow(0 0 8px rgba(6, 182, 212, 0.95)) drop-shadow(0 6px 6px rgba(0,0,0,0.6))`;
                  } else if (sCap >= sSpeed && sCap >= sDef) {
                    mapAuraFilter = `drop-shadow(0 0 8px rgba(234, 179, 8, 0.95)) drop-shadow(0 6px 6px rgba(0,0,0,0.6))`;
                  } else {
                    mapAuraFilter = `drop-shadow(0 0 8px rgba(16, 185, 129, 0.95)) drop-shadow(0 6px 6px rgba(0,0,0,0.6))`;
                  }
                }

                const isShipDestroyed = typeof ship.heart === 'number' ? ship.heart <= 0 : portDestroyed;

                return (
                  <React.Fragment key={ship.id}>
                    <div
                      id={ship.id}
                      className={`ship ${ship.moving ? 'moving' : ''}`}
                      style={{
                        left: ship.left,
                        top: ship.top,
                        filter: isShipDestroyed 
                          ? 'grayscale(0.9) brightness(0.18) contrast(1.5) sepia(0.6) hue-rotate(-20deg) drop-shadow(0 0 12px rgba(239,68,68,0.9))' 
                          : mapAuraFilter,
                        transition: `left ${ship.transitionDuration || '2s'} ease-in-out, top ${ship.transitionDuration || '2s'} ease-in-out, transform 0.25s ease-in-out`,
                        willChange: 'left, top, transform',
                        transform: `scaleX(${ship.scaleX}) ${isShipDestroyed ? getDestroyedShipStyles(ship.id).transform : ''} translateZ(0)`,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                      }}
                      onClick={(e) => showMenu(e, ship)}
                    >
                      {/* Wake animation behind moving ships */}
                      {ship.moving && <div className="ship-wake" />}

                      {/* Floating realistic boat image inside inner wrapper with status overlaid */}
                      <div className="relative ship-inner" style={{ width: 'var(--ship-render-width)', height: 'calc(var(--ship-render-width) * 0.95)', margin: '0 auto' }}>
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                          filter: isShipDestroyed ? 'grayscale(1) brightness(0.25) contrast(1.3) sepia(1) hue-rotate(-20deg)' : 'none',
                          transition: 'filter 1.2s ease'
                        }}>
                          <ShipImage level={typeof ship.level === 'number' ? ship.level : 0} width={280} plain={true} fill={true} />
                          
                          {/* Ship Assigned Crew Overlay */}
                          {ship.assignedCrew && ship.assignedCrew.length > 0 && (
                            <ShipCrewMember assignedCrew={ship.assignedCrew} shipLevel={typeof ship.level === 'number' ? ship.level : 0} />
                          )}

                          {/* Autonomous Golden Hunter Fishing Status Badge & Direct Pause/Play Clickable Toggle */}
                          {ship.assignedCrew && (ship.assignedCrew.includes('golden_hunter') || ship.assignedCrew.includes('gold_fisher')) && !isShipDestroyed && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAutoFishing(ship.id);
                              }}
                              title={ship.autoFishingPaused ? "الصيد التلقائي متوقف حالياً - اضغط للتشغيل" : "الصيد التلقائي يعمل - اضغط للإيقاف مؤقتاً"}
                              className={`cursor-pointer absolute left-1/2 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black border shadow-lg whitespace-nowrap z-30 transition-all hover:scale-105 active:scale-95 ${
                                ship.autoFishingPaused 
                                  ? 'bg-slate-900/95 text-slate-300 border-slate-500 shadow-slate-950/60' 
                                  : 'bg-amber-950/95 text-amber-200 border-amber-400/90 shadow-amber-500/40 animate-pulse'
                              }`}
                              style={{
                                bottom: getShipFishingTimerState(ship, timerNow).isFishing ? 'calc(100% - 35px)' : 'calc(100% - 73px)',
                                transform: `translateX(-50%) scaleX(${ship.scaleX < 0 ? -1 : 1})`,
                              }}
                            >
                              <span style={{ fontSize: '14px' }}>🔱</span>
                              <span>{ship.autoFishingPaused ? 'صيد تلقائي [متوقف]' : 'صيد تلقائي [شغال]'}</span>
                              <span className={`text-[11px] px-2 py-0.5 rounded font-black ${ship.autoFishingPaused ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                                {ship.autoFishingPaused ? '▶️ تشغيل' : '⏸️ إيقاف'}
                              </span>
                            </div>
                          )}

                          {/* Guide Expected Fish Badge & Direct Selector */}
                          {ship.assignedCrew && ship.assignedCrew.includes('guide') && !isShipDestroyed && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpectedFishModalShipId(ship.id);
                              }}
                              title={`نوع الصيد المتوقع بواسطة المرشد: ${ship.expectedFish || (ship.fishTypes && ship.fishTypes[ship.fishTypes.length - 1]) || 'السردين'} - اضغط لاختيار وتغيير نوع السمك`}
                              className="cursor-pointer absolute left-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-lg whitespace-nowrap z-30 transition-all hover:scale-105 active:scale-95 bg-sky-950/95 text-sky-200 border-sky-400/90 shadow-sky-500/40"
                              style={{
                                bottom: (() => {
                                  const hasGH = ship.assignedCrew.includes('golden_hunter') || ship.assignedCrew.includes('gold_fisher');
                                  const fishingActive = getShipFishingTimerState(ship, timerNow).isFishing;
                                  if (hasGH) {
                                    return fishingActive ? 'calc(100% - 1px)' : 'calc(100% - 39px)';
                                  }
                                  return fishingActive ? 'calc(100% - 35px)' : 'calc(100% - 73px)';
                                })(),
                                transform: `translateX(-50%) scaleX(${ship.scaleX < 0 ? -1 : 1})`,
                              }}
                            >
                              <span style={{ fontSize: '13px' }}>🧭</span>
                              <span className="text-amber-300">متوقع:</span>
                              <span className="text-white font-extrabold">{ship.expectedFish || (ship.fishTypes && ship.fishTypes[ship.fishTypes.length - 1]) || 'السردين'}</span>
                              {(() => {
                                const expectedName = ship.expectedFish || (ship.fishTypes && ship.fishTypes[ship.fishTypes.length - 1]) || 'السردين';
                                const expectedImg = getFishImageUrl(expectedName, typeof ship.level === 'number' ? ship.level : undefined);
                                return expectedImg ? (
                                  <img
                                    src={expectedImg}
                                    alt={expectedName}
                                    className="w-12 h-8 object-contain"
                                    style={{
                                      filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 4px rgba(186,230,253,0.4)) contrast(1.08) saturate(1.1)'
                                    }}
                                  />
                                ) : (
                                  <span>{getFishEmoji(expectedName)}</span>
                                );
                              })()}
                              <span className="text-[10px] bg-sky-700/90 hover:bg-sky-600 px-1.5 py-0.5 rounded text-sky-100 font-bold ml-0.5">
                                تغيير 🔁
                              </span>
                            </div>
                          )}
                          
                          {/* Fire & Smoke overlay for destroyed local ship */}
                          {isShipDestroyed && (
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              zIndex: 15,
                              pointerEvents: 'none'
                            }}>
                              {/* Dynamic Flames */}
                              {getDestroyedShipStyles(ship.id).flames.map((f, i) => (
                                <span
                                  key={i}
                                  style={{
                                    position: 'absolute',
                                    top: f.top,
                                    left: f.left,
                                    fontSize: f.size,
                                    animation: f.anim,
                                    filter: 'drop-shadow(0 0 5px #f97316)',
                                    lineHeight: 1
                                  }}
                                >
                                  🔥
                                </span>
                              ))}
                              {/* Rising smoke */}
                              <span style={{
                                position: 'absolute',
                                top: '-15px',
                                left: '45%',
                                fontSize: '24px',
                                opacity: 0.7,
                                animation: 'pulse 2s infinite'
                              }}>
                                💨
                              </span>
                              {/* Status Label Badge & Repair Button */}
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRepairModalShip(ship);
                                }}
                                title="اضغط لفتح ورشة إصلاح وصيانة السفينة فوراً"
                                style={{
                                  position: 'absolute',
                                  bottom: '-12px',
                                  left: '50%',
                                  transform: `translateX(-50%) scaleX(${ship.scaleX < 0 ? -1 : 1})`,
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  color: '#fff',
                                  background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)',
                                  padding: '3px 10px',
                                  borderRadius: '16px',
                                  border: '1.5px solid #f87171',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.75)',
                                  zIndex: 35,
                                  cursor: 'pointer',
                                  pointerEvents: 'auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  animation: 'pulse 1.5s infinite'
                                }}
                              >
                                <span>{getDestroyedShipStyles(ship.id).statusLabel}</span>
                                <span style={{ background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '8px', fontSize: '10px' }}>
                                  🔧 إصلاح
                                </span>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Fishing Net positioned directly below the front bow of the ship */}
                        {!isShipDestroyed && ship.status === 'fishing' && (
                          <div
                            className="fishing-net-animation"
                            style={{
                              position: 'absolute',
                              top: '58%',
                              left: '83%',
                              width: 'calc(var(--ship-render-width) * 0.45)',
                              zIndex: 3,
                              pointerEvents: 'none',
                            }}
                          >
                            <img
                              src="https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/golden_fishing_net.png"
                              alt="شبكة صيد"
                              referrerPolicy="no-referrer"
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5)) drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
                              }}
                            />
                          </div>
                        )}

                        {/* Dual Fishing & Energy Capsule Bars Above Ship */}
                        {(() => {
                          const timerState = getShipFishingTimerState(ship, timerNow);
                          const rawMaxH = getShipMaxHeart(ship);
                          const curH = typeof ship.heart === 'number' ? Math.max(0, Math.min(ship.heart, rawMaxH)) : (portDestroyed ? 0 : rawMaxH);
                          const maxH = rawMaxH;
                          const energyPct = isShipDestroyed
                            ? 0
                            : (curH >= maxH ? 100 : Math.max(1, Math.min(99, Math.round((curH / maxH) * 100))));

                          const bottomOffset = 'calc(100% - 112px)';

                          let fishingPct = 0;
                          if (!isShipDestroyed && ship.status === 'fishing') {
                            fishingPct = ship.scaleX < 0 ? 100 : timerState.progressPct;
                          }

                          return (
                            <ShipStatusBars
                              fishingPct={fishingPct}
                              energyPct={energyPct}
                              isFishing={timerState.isFishing}
                              isAutoFishing={timerState.isAutoFishing}
                              isReady={timerState.isReady}
                              remainingMs={timerState.remainingMs}
                              curHeart={curH}
                              maxHeart={maxH}
                              isDestroyed={isShipDestroyed}
                              scaleX={ship.scaleX}
                              bottomOffset={bottomOffset}
                              onCollect={() => collectShipFish(ship.id, false)}
                              onRepair={() => setRepairModalShip(ship)}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>

      </div>

      {/* Live Incoming Enemy Combat Visuals Rendered Above Harbor, Top Bar, and Damage Banners */}
      {activeTab === 'harbor' && !inspectedPlayerShipVisit && ownAttackEffect && (
        <div
          className="harbor-combat-layer"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            minWidth: '1024px',
            height: 'calc(100dvh - var(--bottom-nav-height))',
            zIndex: 95,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          {ownAttackEffect.phase === 'flying' && ownAttackEffect.type === 'ROCKET_SMALL' && (
            <FlyingNavalMissile tier="small" targetX={ownAttackEffect.targetX} targetY={ownAttackEffect.targetY} />
          )}
          {ownAttackEffect.phase === 'flying' && ownAttackEffect.type === 'ROCKET_MEDIUM' && (
            <FlyingNavalMissile tier="medium" targetX={ownAttackEffect.targetX} targetY={ownAttackEffect.targetY} />
          )}
          {ownAttackEffect.phase === 'flying' && ownAttackEffect.type === 'ROCKET_LARGE' && (
            <FlyingNavalMissile tier="large" targetX={ownAttackEffect.targetX} targetY={ownAttackEffect.targetY} />
          )}
          {ownAttackEffect.phase === 'impact' && ownAttackEffect.type === 'ROCKET_SMALL' && (
            <SmallRocketExplosion
              x={ownAttackEffect.targetX}
              y={ownAttackEffect.targetY}
              damage={ownAttackEffect.damage}
              onComplete={() => finishOwnAttackVisualRef.current?.()}
            />
          )}
          {ownAttackEffect.phase === 'impact' && ownAttackEffect.type === 'ROCKET_MEDIUM' && (
            <MediumRocketExplosion
              x={ownAttackEffect.targetX}
              y={ownAttackEffect.targetY}
              damage={ownAttackEffect.damage}
              onComplete={() => finishOwnAttackVisualRef.current?.()}
            />
          )}
          {ownAttackEffect.phase === 'impact' && ownAttackEffect.type === 'ROCKET_LARGE' && (
            <LargeRocketExplosion
              x={ownAttackEffect.targetX}
              y={ownAttackEffect.targetY}
              damage={ownAttackEffect.damage}
              onComplete={() => finishOwnAttackVisualRef.current?.()}
            />
          )}
          {ownAttackEffect.type === 'ATOMIC_BOMB' && (
            <AtomicBombExplosion
              x="45%"
              surfaceY="48%"
              depthY="64%"
              onComplete={() => finishOwnAttackVisualRef.current?.()}
            />
          )}
          {ownAttackEffect.type === 'AD_BOMB' && (
            <AdBombStrike
              x={ownAttackEffect.targetX}
              y={ownAttackEffect.targetY}
              onComplete={() => finishOwnAttackVisualRef.current?.()}
            />
          )}
        </div>
      )}



      {/* ----------------- INVENTORY TAB (المخزن - العتاد والمعدات والأسلحة وسجل المكتشفات) ----------------- */}
      {activeTab === 'inventory' && (
        <InventoryComponent 
          gold={gold}
          setGold={setGold}
          gems={gems}
          setGems={setGems}
          weapons={weapons}
          setWeapons={setWeapons}
          crewServices={crewServices}
          setCrewServices={setCrewServices}
          crewInventory={crewInventory}
          setCrewInventory={setCrewInventory}
          shieldInventory={shieldInventory}
          setShieldInventory={setShieldInventory}
          handlePurchase={handlePurchase}
          onClose={() => setActiveTab('harbor')}
        />
      )}

      {/* ----------------- FLEET WAREHOUSE TAB (بيت السفن / مستودع الأسطول) ----------------- */}
      {activeTab === 'warehouse' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'linear-gradient(to bottom, #080f24, #040817)',
          overflowY: 'auto',
          paddingBottom: '100px'
        }}>
          <ShipWarehouse
            shipTowerLevel={shipTowerLevel}
            setShipTowerLevel={setShipTowerLevel}
            gold={gold}
            setGold={setGold}
            gems={gems}
            setGems={setGems}
            ships={ships}
            setShips={setShips}
            buyShipLevel={buyShipLevel}
            crewServices={crewServices}
            setCrewServices={setCrewServices}
            onClose={() => setActiveTab('harbor')}
          />
        </div>
      )}

      {/* ----------------- PORTFOLIO / SETTINGS TAB (البروفايل) ----------------- */}
      {activeTab === 'settings' && (
        <div style={{ position: 'relative', width: '100%', minHeight: '100%' }}>
          <SettingsView
            language={language}
            setLanguage={setLanguage}
            userEmail={auth.currentUser?.email || localStorage.getItem('google_auth_email') || 'ttwk29818@gmail.com'}
            handleSyncAccount={handleSyncAccount}
            isMusicMuted={isMusicMuted}
            setIsMusicMuted={setIsMusicMuted}
            isSfxMuted={isSfxMuted}
            setIsSfxMuted={setIsSfxMuted}
            showSoundTones={showSoundTones}
            setShowSoundTones={setShowSoundTones}
            showAttackNotifications={showAttackNotifications}
            setShowAttackNotifications={setShowAttackNotifications}
            showChestNotifications={showChestNotifications}
            setShowChestNotifications={setShowChestNotifications}
            customizeIconFunctions={customizeIconFunctions}
            setCustomizeIconFunctions={setCustomizeIconFunctions}
            showRelatedAlerts={showRelatedAlerts}
            setShowRelatedAlerts={setShowRelatedAlerts}
            disableQuickChat={disableQuickChat}
            setDisableQuickChat={setDisableQuickChat}
            powerSaverLogin={powerSaverLogin}
            setPowerSaverLogin={setPowerSaverLogin}
            setPowerSaver={setPowerSaver}
            showPopupAlerts={showPopupAlerts}
            setShowPopupAlerts={setShowPopupAlerts}
            stopRogueAlliances={stopRogueAlliances}
            setStopRogueAlliances={setStopRogueAlliances}
            heatingEnergyIndex={heatingEnergyIndex}
            setHeatingEnergyIndex={setHeatingEnergyIndex}
            setActiveSettingsModal={setActiveSettingsModal}
            handleSendPasswordReset={handleSendPasswordReset}
            handleLogout={handleLogout}
            showToast={showToast}
            onClose={() => setActiveTab('harbor')}
            handleUpdateGameVersion={handleUpdateGameVersion}
          />

          {/* Interactive Modal Popups / Overlays inside settings */}
          {activeSettingsModal === 'ticket' && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl'
            }}>
              <div style={{
                background: '#071524',
                border: '2px solid #ca8a04',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '450px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                fontFamily: 'Cairo, sans-serif'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#facc15', fontSize: '18px', fontWeight: 'bold' }}>🛠️ إنشاء تذكرة دعم فني جديدة</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#94a3b8' }}>اكتب تفاصيل مشكلتك وسيقوم فريق الدعم بالرد عليك مباشرة.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>عنوان المشكلة:</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="مثال: مشكلة في شحن الجواهر"
                      style={{ background: '#040d17', border: '1px solid rgba(250, 204, 21, 0.2)', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>تفاصيل المشكلة والرسالة:</label>
                    <textarea
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="اكتب هنا ما يواجهك من مشاكل بكل تفصيل..."
                      style={{ background: '#040d17', border: '1px solid rgba(250, 204, 21, 0.2)', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '13px', resize: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCreateSupportTicket}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    إرسال التذكرة 🚀
                  </button>
                  <button
                    onClick={() => setActiveSettingsModal(null)}
                    style={{ flex: 1, background: '#1e293b', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSettingsModal === 'email' && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl'
            }}>
              <div style={{
                background: '#071524',
                border: '2px solid #ca8a04',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '400px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                fontFamily: 'Cairo, sans-serif'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#facc15', fontSize: '18px', fontWeight: 'bold' }}>✉️ تعديل البريد الإلكتروني</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#94a3b8' }}>أدخل البريد الإلكتروني الجديد لحسابك لتلقي الإشعارات وتوثيق اللعبة.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>البريد الإلكتروني الجديد:</label>
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="new_email@example.com"
                    style={{ background: '#040d17', border: '1px solid rgba(250, 204, 21, 0.2)', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '13px', textAlign: 'left' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleChangeEmail}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    تحديث البريد 💾
                  </button>
                  <button
                    onClick={() => setActiveSettingsModal(null)}
                    style={{ flex: 1, background: '#1e293b', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSettingsModal === 'icons' && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl'
            }}>
              <div style={{
                background: '#071524',
                border: '2px solid #6366f1',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '420px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                fontFamily: 'Cairo, sans-serif',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '32px' }}>🎯</span>
                <h3 style={{ margin: '8px 0 12px 0', color: '#facc15', fontSize: '18px', fontWeight: 'bold' }}>تخصيص مواقع الأيقونات واختصارات الشاشة</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  هذه الميزة الفريدة تتيح لك ترتيب وترصيف أيقونات اللوحة الرئيسية واختيار المفاتيح الأنسب لشاشتك لتسهيل الصيد والتحصين.
                  <br />
                  <strong style={{ color: '#6366f1' }}>ستتوفر كاملة في التحديث التلقائي القادم للأساطيل!</strong>
                </p>
                
                <button
                  onClick={() => setActiveSettingsModal(null)}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  حسناً، فهمت 👍
                </button>
              </div>
            </div>
          )}

          {activeSettingsModal === 'delete' && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl'
            }}>
              <div style={{
                background: '#1e0c0f',
                border: '2px solid #ef4444',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '400px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                fontFamily: 'Cairo, sans-serif',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '36px' }}>⚠️</span>
                <h3 style={{ margin: '8px 0 12px 0', color: '#f87171', fontSize: '18px', fontWeight: 'bold' }}>حذف الحساب نهائياً</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#fda4af', lineHeight: '1.6' }}>
                  هل أنت متأكد تماماً من رغبتك في حذف حسابك وجميع سجلات صيدك وأساطيلك وذهبك بشكل كامل ودائم من الخوادم؟ لا يمكن التراجع عن هذا القرار بعد تنفيذه.
                </p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleDeleteAccountPermanently}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    تأكيد الحذف النهائي 🗑️
                  </button>
                  <button
                    onClick={() => setActiveSettingsModal(null)}
                    style={{ flex: 1, background: '#1e293b', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    تراجع وإلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ----------------- SHOP TAB (متجر شابك 360) ----------------- */}
      {activeTab === 'shop' && (
        <PirateShop
          gold={gold}
          setGold={setGold}
          gems={gems}
          setGems={setGems}
          redGems={redGems}
          setRedGems={setRedGems}
          weapons={weapons}
          setWeapons={setWeapons}
          crewServices={crewServices}
          setCrewServices={setCrewServices}
          crewInventory={crewInventory}
          setCrewInventory={setCrewInventory}
          shieldInventory={shieldInventory}
          setShieldInventory={setShieldInventory}
          ships={ships}
          setShips={setShips}
          bgTheme={bgTheme}
          setBgTheme={setBgTheme}
          profileTheme={profileTheme}
          setProfileTheme={setProfileTheme}
          setActiveTab={setActiveTab}
          playerLevel={playerLevel}
          exp={exp}
          buyShipLevel={buyShipLevel}
          buyWeaponItem={buyWeaponItem}
          buyCrewService={buyCrewService}
          buyShopItem={buyShopItem}
          handlePurchase={handlePurchase}
          buyItem={handlePurchase}
          confirmUpgradeShip={confirmUpgradeShip}
          upgradeTargetSpec={upgradeTargetSpec}
          setUpgradeTargetSpec={setUpgradeTargetSpec}
        />
      )}

      {/* ----------------- OLD SHOP TAB (DEACTIVATED) ----------------- */}
      {activeTab === 'shop' && false && (
        <div className="tab-overlay" style={{
          zIndex: 105,
          maxWidth: '1080px',
          margin: '0 auto',
          background: '#1d0f04',
          border: '8px solid #5c3a21',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }} dir="rtl">
          
          {/* Header Bar */}
          <div style={{
            background: 'linear-gradient(to bottom, #7f1d1d, #450a0a)',
            borderBottom: '4px solid #b45309',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🎪</span>
              <h2 style={{
                margin: 0,
                color: '#fff',
                fontSize: '22px',
                fontWeight: 'bold',
                fontFamily: 'Cairo, sans-serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '1px'
              }}>متجر شابك 360 الإمبراطوري</h2>
            </div>
            
            {/* Close Button (X) */}
            <button 
              onClick={() => setActiveTab('harbor')}
              style={{
                background: '#991b1b',
                color: '#fff',
                border: '3px solid #fecaca',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
                transition: 'all 0.2s',
                zIndex: 10
              }}
            >
              ✕
            </button>
          </div>

          {/* Currencies Plaques bar */}
          <div style={{
            background: '#2b1a09',
            padding: '10px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            borderBottom: '2px solid #78350f'
          }}>
            {/* Gold Plaque */}
            <div style={{
              background: '#451a03',
              border: '2px solid #ca8a04',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
            }}>
              <span style={{ color: '#fcd34d', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src={GOLD_COIN_ICON} alt="ذهب" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                الذهب:
              </span>
              <strong style={{ color: '#fff', fontSize: '15px' }}>{gold.toLocaleString('en-US')}</strong>
            </div>

            {/* Blue Gems Plaque */}
            <div style={{
              background: '#0c223c',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
            }}>
              <span style={{ color: '#93c5fd', fontWeight: 'bold', fontSize: '13px' }}>💎 الجواهر الزرقاء:</span>
              <strong style={{ color: '#fff', fontSize: '15px' }}>{gems.toLocaleString('en-US')}</strong>
            </div>

            {/* Red Gems Plaque */}
            <div style={{
              background: '#450a0a',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
            }}>
              <span style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: '13px' }}>🔴 الجواهر الحمراء:</span>
              <strong style={{ color: '#fff', fontSize: '15px' }}>{redGems.toLocaleString('en-US')}</strong>
            </div>
          </div>

          {/* Main Body */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            background: 'linear-gradient(135deg, #f7e1bd 0%, #e1bd8d 100%)',
            overflowY: 'auto',
            minHeight: '380px'
          }}>
            
            {/* LEFT AREA: Items Grid */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {shopSubTab === 'hamour' && (
                <div>
                  <div style={{ color: '#3d2314', fontWeight: 'bold', fontSize: '16px', marginBottom: '14px', borderBottom: '2px solid #a16207', paddingBottom: '4px' }}>
                    🚀 ترسانة الأسلحة النشطة وأدوات صيانة أسطول شابك
                  </div>
                  
                  {/* Grid of 8 Items */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '16px'
                  }}>
                    {/* Item 1: صاروخ صغير */}
                    <div style={{
                      background: '#eedcb3',
                      border: '2px solid #854d0e',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: '#451a03', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>صاروخ صغير</div>
                      
                      {/* Small Rocket Image */}
                      <div style={{
                        height: '70px',
                        width: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '6px 0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        backgroundImage: `url(${WEAPON_SMALL_MISSILE_BG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1.5px solid rgba(180, 83, 9, 0.5)',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)'
                      }}>
                        <img 
                          src={WEAPON_SMALL_MISSILE_ICON} 
                          alt="صاروخ صغير" 
                          referrerPolicy="no-referrer"
                          style={{ maxHeight: '56px', maxWidth: '56px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' }}
                        />
                      </div>

                      {/* Power Circle Badge */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#fef08a',
                        border: '2.5px dashed #ca8a04',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#78350f',
                        margin: '6px 0'
                      }}>
                        <span>⚔️</span>
                        <span>100K</span>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => buyWeaponItem('smallRocket', 'gold', 250000)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to bottom, #d97706, #b45309)',
                          color: '#fff',
                          border: '1.5px solid #fef08a',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          marginTop: '8px'
                        }}
                      >
                        250,000 ذهب
                      </button>
                      <div style={{
                        width: '100%',
                        fontSize: '12.5px',
                        fontWeight: 'bold',
                        color: ((weapons.smallRocket || weapons.small_missile) || 0) > 0 ? '#15803d' : '#854d0e',
                        background: ((weapons.smallRocket || weapons.small_missile) || 0) > 0 ? '#dcfce7' : '#fef3c7',
                        border: ((weapons.smallRocket || weapons.small_missile) || 0) > 0 ? '1.5px solid #4ade80' : '1px solid #fde047',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        textAlign: 'center',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: ((weapons.smallRocket || weapons.small_missile) || 0) > 0 ? '0 0 8px rgba(74, 222, 128, 0.4)' : 'none'
                      }}>
                        <span>العدد المتوفر:</span>
                        <strong style={{ fontSize: '15px', color: ((weapons.smallRocket || weapons.small_missile) || 0) > 0 ? '#166534' : '#b45309' }}>
                          {((weapons.smallRocket !== undefined ? weapons.smallRocket : weapons.small_missile) || 0).toLocaleString()}x
                        </strong>
                      </div>
                    </div>

                    {/* Item 2: صاروخ متوسط */}
                    <div style={{
                      background: '#eedcb3',
                      border: '2px solid #854d0e',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: '#451a03', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>صاروخ متوسط</div>
                      
                      {/* Medium Rocket Image */}
                      <div style={{
                        height: '70px',
                        width: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '6px 0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        backgroundImage: `url(${WEAPON_MEDIUM_MISSILE_BG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1.5px solid rgba(194, 65, 12, 0.5)',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)'
                      }}>
                        <img 
                          src={WEAPON_MEDIUM_MISSILE_ICON} 
                          alt="صاروخ متوسط" 
                          referrerPolicy="no-referrer"
                          style={{ maxHeight: '56px', maxWidth: '56px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                        />
                      </div>

                      {/* Power Circle Badge */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#fef08a',
                        border: '2.5px dashed #ca8a04',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#78350f',
                        margin: '6px 0'
                      }}>
                        <span>⚔️</span>
                        <span>500K</span>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => buyWeaponItem('mediumRocket', 'gold', 500000)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to bottom, #d97706, #b45309)',
                          color: '#fff',
                          border: '1.5px solid #fef08a',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          marginTop: '8px'
                        }}
                      >
                        500,000 ذهب
                      </button>
                      <div style={{
                        width: '100%',
                        fontSize: '12.5px',
                        fontWeight: 'bold',
                        color: ((weapons.mediumRocket || weapons.medium_missile) || 0) > 0 ? '#15803d' : '#854d0e',
                        background: ((weapons.mediumRocket || weapons.medium_missile) || 0) > 0 ? '#dcfce7' : '#fef3c7',
                        border: ((weapons.mediumRocket || weapons.medium_missile) || 0) > 0 ? '1.5px solid #4ade80' : '1px solid #fde047',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        textAlign: 'center',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: ((weapons.mediumRocket || weapons.medium_missile) || 0) > 0 ? '0 0 8px rgba(74, 222, 128, 0.4)' : 'none'
                      }}>
                        <span>العدد المتوفر:</span>
                        <strong style={{ fontSize: '15px', color: ((weapons.mediumRocket || weapons.medium_missile) || 0) > 0 ? '#166534' : '#b45309' }}>
                          {((weapons.mediumRocket !== undefined ? weapons.mediumRocket : weapons.medium_missile) || 0).toLocaleString()}x
                        </strong>
                      </div>
                    </div>

                    {/* Item 3: صاروخ كبير */}
                    <div style={{
                      background: '#eedcb3',
                      border: '2px solid #854d0e',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: '#451a03', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>صاروخ كبير</div>
                      
                      {/* Large Rocket Image */}
                      <div style={{
                        height: '70px',
                        width: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '6px 0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        backgroundImage: `url(${WEAPON_LARGE_MISSILE_BG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1.5px solid rgba(133, 77, 14, 0.5)',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)'
                      }}>
                        <img 
                          src={WEAPON_LARGE_MISSILE_ICON} 
                          alt="صاروخ كبير" 
                          referrerPolicy="no-referrer"
                          style={{ maxHeight: '56px', maxWidth: '56px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                        />
                      </div>

                      {/* Power Circle Badge */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#fef08a',
                        border: '2.5px dashed #ca8a04',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#78350f',
                        margin: '6px 0'
                      }}>
                        <span>⚔️</span>
                        <span>1.5M</span>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => buyWeaponItem('largeRocket', 'gold', 1000000)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to bottom, #d97706, #b45309)',
                          color: '#fff',
                          border: '1.5px solid #fef08a',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          marginTop: '8px'
                        }}
                      >
                        1,000,000 ذهب
                      </button>
                      <div style={{
                        width: '100%',
                        fontSize: '12.5px',
                        fontWeight: 'bold',
                        color: ((weapons.largeRocket || weapons.large_missile) || 0) > 0 ? '#15803d' : '#854d0e',
                        background: ((weapons.largeRocket || weapons.large_missile) || 0) > 0 ? '#dcfce7' : '#fef3c7',
                        border: ((weapons.largeRocket || weapons.large_missile) || 0) > 0 ? '1.5px solid #4ade80' : '1px solid #fde047',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        textAlign: 'center',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: ((weapons.largeRocket || weapons.large_missile) || 0) > 0 ? '0 0 8px rgba(74, 222, 128, 0.4)' : 'none'
                      }}>
                        <span>العدد المتوفر:</span>
                        <strong style={{ fontSize: '15px', color: ((weapons.largeRocket || weapons.large_missile) || 0) > 0 ? '#166534' : '#b45309' }}>
                          {((weapons.largeRocket !== undefined ? weapons.largeRocket : weapons.large_missile) || 0).toLocaleString()}x
                        </strong>
                      </div>
                    </div>

                    {/* Item 4: قنبلة ذرية */}
                    <div style={{
                      background: '#eedcb3',
                      border: '2px solid #854d0e',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: '#451a03', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>قنبلة ذرية</div>
                      
                      {/* Atomic Bomb Image */}
                      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '6px 0' }}>
                        <img 
                          src={WEAPON_ATOMIC_BOMB_ICON} 
                          alt="قنبلة ذرية" 
                          referrerPolicy="no-referrer"
                          style={{ maxHeight: '68px', maxWidth: '68px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' }}
                        />
                      </div>

                      {/* Power Circle Badge */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#93c5fd',
                        border: '2.5px dashed #1d4ed8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#1e3a8a',
                        margin: '6px 0'
                      }}>
                        <span>💥</span>
                        <span>10M</span>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => buyWeaponItem('atomicBomb', 'blueGems', 100)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to bottom, #1d4ed8, #1e3a8a)',
                          color: '#fff',
                          border: '1.5px solid #93c5fd',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          marginTop: '8px'
                        }}
                      >
                        100 جوهرة
                      </button>
                      <div style={{
                        width: '100%',
                        fontSize: '12.5px',
                        fontWeight: 'bold',
                        color: ((weapons.atomicBomb || weapons.nuke_bomb) || 0) > 0 ? '#1e3a8a' : '#475569',
                        background: ((weapons.atomicBomb || weapons.nuke_bomb) || 0) > 0 ? '#dbeafe' : '#f1f5f9',
                        border: ((weapons.atomicBomb || weapons.nuke_bomb) || 0) > 0 ? '1.5px solid #60a5fa' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        textAlign: 'center',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: ((weapons.atomicBomb || weapons.nuke_bomb) || 0) > 0 ? '0 0 8px rgba(96, 165, 250, 0.4)' : 'none'
                      }}>
                        <span>العدد المتوفر:</span>
                        <strong style={{ fontSize: '15px', color: ((weapons.atomicBomb || weapons.nuke_bomb) || 0) > 0 ? '#1e40af' : '#334155' }}>
                          {((weapons.atomicBomb !== undefined ? weapons.atomicBomb : weapons.nuke_bomb) || 0).toLocaleString()}x
                        </strong>
                      </div>
                    </div>

                    {/* Item 5: مصلح صغير */}
                    <div style={{
                      background: '#eedcb3',
                      border: '2px solid #854d0e',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: '#451a03', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>1 - مصلح صغير</div>
                      <div style={{ color: '#78350f', fontSize: '10px', marginBottom: '4px' }}>يصلح ويزيد 500 نقطة من الصفر</div>
                      
                      {/* Mechanic Image */}
                      <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(6, 35, 28, 0.9) 100%)',
                        border: '2px solid #10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        margin: '8px 0',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}>
                        <img 
                          src={FIXER_SMALL_ICON} 
                          alt="مصلح صغير" 
                          referrerPolicy="no-referrer" 
                          style={{ maxHeight: '60px', maxWidth: '60px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} 
                        />
                      </div>

                      {/* Power Badge */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#fef08a',
                        border: '2.5px dashed #ca8a04',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#78350f',
                        margin: '6px 0'
                      }}>
                        <span>❤️</span>
                        <span>500</span>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => buyWeaponItem('smallRepair', 'gold', 250000)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to bottom, #d97706, #b45309)',
                          color: '#fff',
                          border: '1.5px solid #fef08a',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          marginTop: '8px'
                        }}
                      >
                        250,000 ذهب
                      </button>
                      <div style={{ fontSize: '10px', color: '#78350f', marginTop: '4px' }}>لديك: <strong>{weapons.smallRepair || 0}</strong></div>
                    </div>

                    {/* Item 6: مصلح وسط */}
                    <div style={{
                      background: '#eedcb3',
                      border: '2px solid #854d0e',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: '#451a03', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>2 - مصلح وسط</div>
                      <div style={{ color: '#78350f', fontSize: '10px', marginBottom: '4px' }}>يصلح نصف السفينة (50%) أو 1,000 نقطة</div>
                      
                      {/* Mechanic Image */}
                      <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(6, 35, 28, 0.9) 100%)',
                        border: '2px solid #10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        margin: '8px 0',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}>
                        <img 
                          src={FIXER_MEDIUM_ICON} 
                          alt="مصلح وسط" 
                          referrerPolicy="no-referrer" 
                          style={{ maxHeight: '60px', maxWidth: '60px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} 
                        />
                      </div>

                      {/* Power Badge */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#fef08a',
                        border: '2.5px dashed #ca8a04',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8.5px',
                        fontWeight: 'bold',
                        color: '#78350f',
                        margin: '6px 0',
                        textAlign: 'center'
                      }}>
                        <span>❤️</span>
                        <span>50% / 1k</span>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => buyWeaponItem('mediumRepair', 'gold', 500000)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to bottom, #d97706, #b45309)',
                          color: '#fff',
                          border: '1.5px solid #fef08a',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          marginTop: '8px'
                        }}
                      >
                        500,000 ذهب
                      </button>
                      <div style={{ fontSize: '10px', color: '#78350f', marginTop: '4px' }}>لديك: <strong>{weapons.mediumRepair || 0}</strong></div>
                    </div>

                    {/* Item 7: مصلح كبير */}
                    <div style={{
                      background: '#eedcb3',
                      border: '2px solid #854d0e',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {/* NEW RIBBON */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '-8px',
                        background: '#ef4444',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '9px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        boxShadow: '2px 2px 4px rgba(0,0,0,0.25)',
                        transform: 'rotate(-10deg)',
                        border: '1px solid #fecaca'
                      }}>جديد</div>

                      <div style={{ color: '#451a03', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>3 - مصلح كبير</div>
                      <div style={{ color: '#78350f', fontSize: '10px', marginBottom: '4px' }}>يصلح سفينة واحدة بالكامل 100%</div>
                      
                      {/* Fixer Large Image with Custom Background */}
                      <div style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background: `url(${FIXER_LARGE_BG}) center/cover no-repeat`,
                        border: '2px solid #eab308',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        margin: '6px 0',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
                        position: 'relative'
                      }}>
                        <img 
                          src={FIXER_LARGE_ICON} 
                          alt="مصلح كبير" 
                          referrerPolicy="no-referrer" 
                          style={{ maxHeight: '64px', maxWidth: '64px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))' }} 
                        />
                      </div>

                      {/* Power Badge */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#fef08a',
                        border: '2.5px dashed #ca8a04',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#78350f',
                        margin: '6px 0'
                      }}>
                        <span>❤️</span>
                        <span>100%</span>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => buyWeaponItem('largeRepair', 'gold', 1000000)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to bottom, #d97706, #b45309)',
                          color: '#fff',
                          border: '1.5px solid #fef08a',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          marginTop: '8px'
                        }}
                      >
                        1,000,000 ذهب
                      </button>
                      <div style={{ fontSize: '10px', color: '#78350f', marginTop: '4px' }}>لديك: <strong>{weapons.largeRepair || 0}</strong></div>
                    </div>

                    {/* Item 8: مصلح اسطوري */}
                    <div style={{
                      background: '#eedcb3',
                      border: '2px solid #854d0e',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: '#451a03', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>4 - مصلح اسطوري</div>
                      <div style={{ color: '#78350f', fontSize: '10px', marginBottom: '4px' }}>يرفع ويصلح كل السفن دفعة واحدة 100%</div>
                      
                      {/* Legendary Fixer Image with Custom Background */}
                      <div style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background: `url(${FIXER_LEGENDARY_BG}) center/cover no-repeat`,
                        border: '2px solid #a855f7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        margin: '6px 0',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
                        position: 'relative'
                      }}>
                        <img 
                          src={FIXER_LEGENDARY_ICON} 
                          alt="مصلح أسطوري" 
                          referrerPolicy="no-referrer" 
                          style={{ maxHeight: '64px', maxWidth: '64px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))' }} 
                        />
                      </div>

                      {/* Power Badge */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#93c5fd',
                        border: '2.5px dashed #1d4ed8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8.5px',
                        fontWeight: 'bold',
                        color: '#1e3a8a',
                        margin: '6px 0',
                        textAlign: 'center'
                      }}>
                        <span>👑</span>
                        <span>كل السفن</span>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => buyWeaponItem('legendaryRepair', 'blueGems', 60)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to bottom, #1d4ed8, #1e3a8a)',
                          color: '#fff',
                          border: '1.5px solid #93c5fd',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          marginTop: '8px'
                        }}
                      >
                        60 جوهرة
                      </button>
                      <div style={{ fontSize: '10px', color: '#1e3a8a', marginTop: '4px' }}>لديك: <strong>{weapons.legendaryRepair || 0}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {shopSubTab === 'thihn' && (
                <div>
                  <div style={{ color: '#3d2314', fontWeight: 'bold', fontSize: '15px', marginBottom: '10px', borderBottom: '1.5px solid #a16207', paddingBottom: '4px' }}>
                    ⚙️ ترقيات أسطول الصيد ومخازن الذهب
                  </div>
                  
                  <div className="grid-cards">
                    {/* Upgrade 1: شباك هامور شابك الأسطورية */}
                    <div className="shop-card">
                      <span style={{ fontSize: '36px' }}>🕸️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#451a03', fontSize: '13px' }}>شباك هامور شابك المزدوجة</div>
                        <div style={{ color: '#78350f', fontSize: '11px' }}>تضاعف صيد الأسماك والذهب لجميع السفن بنسبة 100%!</div>
                        <div style={{ marginTop: '4px', fontWeight: 'bold', color: '#ca8a04', fontSize: '12px' }}>السعر: 150 ذهب</div>
                      </div>
                      <button onClick={() => buyShopItem('net', 150, 0)} className="upgrade-btn">شراء</button>
                    </div>

                    {/* Upgrade 2: محركات الدفع التوربيني */}
                    <div className="shop-card">
                      <span style={{ fontSize: '36px' }}>⚙️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#451a03', fontSize: '13px' }}>محركات الدفع التوربيني</div>
                        <div style={{ color: '#78350f', fontSize: '11px' }}>تزيد من سرعة عودة السفينة من رحلة الصيد بمقدار الضعف!</div>
                        <div style={{ marginTop: '4px', fontWeight: 'bold', color: '#3b82f6', fontSize: '12px' }}>السعر: 5 جواهر</div>
                      </div>
                      <button onClick={() => buyShopItem('engine', 0, 5)} className="upgrade-btn" style={{ background: '#3b82f6' }}>شراء</button>
                    </div>

                    {/* Upgrade 3: خزنة الذهب العملاقة */}
                    <div className="shop-card">
                      <span style={{ fontSize: '36px' }}>🪙</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#451a03', fontSize: '13px' }}>خزنة الذهب المليئة</div>
                        <div style={{ color: '#78350f', fontSize: '11px' }}>تحتوي على 1500 عملة ذهبية لتطوير التحالف والأسطول.</div>
                        <div style={{ marginTop: '4px', fontWeight: 'bold', color: '#3b82f6', fontSize: '12px' }}>السعر: 10 جواهر</div>
                      </div>
                      <button onClick={() => buyShopItem('gold_pack', 0, 10)} className="upgrade-btn" style={{ background: '#16a34a' }}>استبدال</button>
                    </div>
                  </div>
                </div>
              )}

              {shopSubTab === 'share' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#3d2314', fontWeight: 'bold', fontSize: '15px', marginBottom: '10px', borderBottom: '1.5px solid #a16207', paddingBottom: '4px' }}>
                    <span>🚢 أسطول الشراء الإمبراطوري (34 مستوى صيد وحرب)</span>
                    <span style={{ fontSize: '11px', background: '#451a03', color: '#fcd34d', padding: '2px 8px', borderRadius: '8px' }}>
                      النشطة بالميناء: {ships.filter(s => s.exists).length} / 5
                    </span>
                  </div>

                  {/* Board Selection Toggle Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => setShopBoard('board1')}
                      style={{
                        flex: 1,
                        background: shopBoard === 'board1' ? '#ca8a04' : '#292524',
                        color: '#fff',
                        border: '1px solid #ca8a04',
                        borderRadius: '6px',
                        padding: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🛶 مستويات السفن 1-17
                    </button>
                    <button 
                      onClick={() => setShopBoard('board2')}
                      style={{
                        flex: 1,
                        background: shopBoard === 'board2' ? '#7c3aed' : '#292524',
                        color: '#fff',
                        border: '1px solid #7c3aed',
                        borderRadius: '6px',
                        padding: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🔮 مستويات السفن 18-34
                    </button>
                  </div>

                  {/* Cards Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                    gap: '12px',
                    maxHeight: '440px',
                    overflowY: 'auto',
                    padding: '12px',
                    background: 'rgba(29,15,4,0.3)',
                    border: '2px solid #5c3a21',
                    borderRadius: '12px',
                    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
                  }}>
                    {SHOP_SHIPS
                      .filter(spec => shopBoard === 'board1' ? spec.level <= 17 : (spec.level >= 18 && spec.level < 33))
                      .map((spec) => {
                        const isSubmarineCard = spec.level === 32;
                        const ownedSubmarine = isSubmarineCard 
                          ? (ships.find((s) => s.exists && s.level !== undefined && s.level >= 32 && s.level < 37) || ships.find((s) => s.exists && s.level !== undefined && s.level >= 32 && s.level <= 37))
                          : null;

                        const currentLevel = ownedSubmarine ? (ownedSubmarine.level || 32) : spec.level;
                        const currentSpec = isSubmarineCard && ownedSubmarine
                          ? (SHOP_SHIPS.find((s) => s.level === currentLevel) || spec)
                          : spec;

                        const ownedCount = isSubmarineCard
                          ? ships.filter((s) => s.exists && s.level !== undefined && s.level >= 32 && s.level <= 37).length
                          : ships.filter(s => s.exists && s.level === spec.level).length;
                        const isEpicOrLegendary = spec.level >= 18;
                        const isLocked = isSubmarineCard ? (shipTowerLevel < 30) : (spec.level > 0 && spec.level > shipTowerLevel);

                        const nextLevelForUpgrade = currentLevel + 1;
                        const nextSpecForUpgrade = SHOP_SHIPS.find(s => s.level === nextLevelForUpgrade);
                        const submarineRule = isSubmarineCard ? getSubmarineUpgradeRule(currentLevel) : null;
                        const submarineFailStreak = ownedSubmarine ? Math.max(0, Math.min(2, ownedSubmarine.upgradeFailStreak || 0)) : 0;
                        const submarineSuccessPct = submarineRule ? (submarineFailStreak >= 2 ? 100 : submarineRule.successRate) : 100;

                        return (
                          <div 
                            key={spec.level} 
                            style={{
                              background: isEpicOrLegendary ? 'linear-gradient(to bottom, #111827, #1e1b4b)' : 'linear-gradient(to bottom, #2b1a0a, #0f0803)',
                              border: isEpicOrLegendary ? '3px solid #818cf8' : '2px solid #ca8a04',
                              borderRadius: '14px',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              position: 'relative',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                              transition: 'all 0.2s',
                              gap: '6px'
                            }}
                          >
                            {/* Owned Ship Count Badge */}
                            {ownedCount > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: '#16a34a',
                                color: '#fff',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                border: '2px solid #fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                                zIndex: 10
                              }}>
                                {ownedCount}
                              </div>
                            )}

                            {/* Beautiful Clean Sprite Illustration as the Card itself */}
                            <div style={{
                              margin: '4px 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <ShipImage level={currentLevel} width={180} />
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#fff' }}>
                                {isSubmarineCard && ownedSubmarine
                                  ? `غواصة الأعماق (${getSubmarineDisplayTier(currentLevel)} 🤿)`
                                  : currentSpec.name
                                }
                              </div>
                              {isSubmarineCard && (() => {
                                const subFish = getSubmarineFishInfo(currentLevel);
                                return subFish ? (
                                  <div style={{ fontSize: '10.5px', color: '#fde047', fontWeight: '800', marginTop: '2px' }}>
                                    {subFish.starLabel} • {subFish.fishName} ({subFish.priceLabel})
                                  </div>
                                ) : null;
                              })()}
                            </div>

                            {/* Action Button */}
                            {isSubmarineCard && ownedSubmarine ? (
                              nextSpecForUpgrade ? (
                                <button 
                                  onClick={() => handleUpgradeSubmarine(ownedSubmarine.id, currentLevel)}
                                  style={{
                                    width: '100%',
                                    background: 'linear-gradient(to bottom, #10b981, #059669)',
                                    color: '#fff',
                                    border: '2px solid #34d399',
                                    borderRadius: '10px',
                                    padding: '10px 4px',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    fontFamily: 'Cairo, sans-serif',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    animation: 'pulse 2s infinite'
                                  }}
                                >
                                  <span style={{ fontSize: '14px' }}>⚡</span>
                                  ترقية إلى {getSubmarineDisplayTier(nextLevelForUpgrade)} ({submarineSuccessPct}% نجاح) بـ {(submarineRule?.cost || nextSpecForUpgrade.price).toLocaleString('en-US')} 🪙
                                </button>
                              ) : (
                                <button 
                                  disabled
                                  style={{
                                    width: '100%',
                                    background: 'linear-gradient(to bottom, #b45309, #78350f)',
                                    color: '#fef08a',
                                    border: '1px solid #facc15',
                                    borderRadius: '8px',
                                    padding: '8px 4px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'default'
                                  }}
                                >
                                  ⭐ أقصى مستوى (Max)
                                </button>
                              )
                            ) : isLocked ? (
                              <button 
                                disabled
                                style={{
                                  width: '100%',
                                  background: '#241a12',
                                  color: '#a1a1aa',
                                  border: '1px solid #3e2b1d',
                                  borderRadius: '8px',
                                  padding: '8px 4px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  fontFamily: 'Cairo, sans-serif',
                                  cursor: 'not-allowed',
                                  marginTop: '8px'
                                }}
                              >
                                {isSubmarineCard ? '🔒 يتطلب أقصى مستوى لبيت السفن (30)' : `🔒 يتطلب بيت السفن ليفل ${spec.level}`}
                              </button>
                            ) : (
                              <button 
                                onClick={() => buyShipLevel(spec)}
                                style={{
                                  width: '100%',
                                  background: isSubmarineCard 
                                    ? 'linear-gradient(to bottom, #4f46e5, #3730a3)' 
                                    : (isEpicOrLegendary ? 'linear-gradient(to bottom, #8b5cf6, #5b21b6)' : 'linear-gradient(to bottom, #f59e0b, #d97706)'),
                                  color: '#fff',
                                  border: isSubmarineCard 
                                    ? '1.5px solid #818cf8' 
                                    : (isEpicOrLegendary ? '1.5px solid #c084fc' : '1.5px solid #fef08a'),
                                  borderRadius: '8px',
                                  padding: '8px 4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  fontFamily: 'Cairo, sans-serif',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  boxShadow: isSubmarineCard ? '0 2px 8px rgba(79, 70, 229, 0.4)' : '0 2px 4px rgba(0,0,0,0.3)',
                                  marginTop: '8px'
                                }}
                              >
                                {isSubmarineCard ? `🤿 شراء الغواصة (المستوى الأساسي 0) بـ 🪙 ${spec.price.toLocaleString('en-US')}` : `شراء بـ 🪙 ${spec.price.toLocaleString('en-US')} 🚢`}
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {shopSubTab === 'crew_services' && (
                <div>
                  <div style={{ color: '#064e3b', fontWeight: 'bold', fontSize: '15px', marginBottom: '10px', borderBottom: '1.5px solid #057857', paddingBottom: '4px' }}>
                    🍀 توظيف طواقم الدعم وخدمات الحظ لحماية وتسريع الصيد
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {/* Item 1: الحظ */}
                    <div style={{ background: '#d1fae5', border: '1.5px solid #057857', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                      {crewServices.luck && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#10b981', color: '#fff', fontSize: '8px', padding: '1px 5px', borderRadius: '8px' }}>نشط</div>}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(5, 120, 87, 0.2)', border: '1px solid #057857', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={LUCK_PIRATE_ICON} alt="قرصان الحظ" referrerPolicy="no-referrer" style={{ maxHeight: '34px', maxWidth: '34px', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#064e3b', fontSize: '13px' }}>🎁 تميمة الحظ البحري</div>
                          <p style={{ color: '#047857', fontSize: '10px', margin: '3px 0' }}>تزيد كمية صيد الأسماك بنسبة +30% والذهب بنسبة +20%!</p>
                        </div>
                      </div>
                      <button onClick={() => buyCrewService('luck', 'تميمة الحظ البحري', 10)} disabled={crewServices.luck} style={{ background: crewServices.luck ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '6px' }}>
                        {crewServices.luck ? 'مفعّل' : 'تفعيل 💎 10'}
                      </button>
                    </div>

                    {/* Item 2: البحارة */}
                    <div style={{ background: '#d1fae5', border: '1.5px solid #057857', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                      {crewServices.sailors && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#10b981', color: '#fff', fontSize: '8px', padding: '1px 5px', borderRadius: '8px' }}>نشط</div>}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(5, 120, 87, 0.2)', border: '1px solid #057857', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={SAILOR_ICON} alt="بحار" referrerPolicy="no-referrer" style={{ maxHeight: '34px', maxWidth: '34px', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#064e3b', fontSize: '13px' }}>👥 طاقم الملاحة السريع</div>
                          <p style={{ color: '#047857', fontSize: '10px', margin: '3px 0' }}>يسرع رحلات العودة والجمع بنسبة 50% ويضيف +15% ذهب!</p>
                        </div>
                      </div>
                      <button onClick={() => buyCrewService('sailors', 'طاقم الملاحة السريع', 15)} disabled={crewServices.sailors} style={{ background: crewServices.sailors ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '6px' }}>
                        {crewServices.sailors ? 'مفعّل' : 'تفعيل 💎 15'}
                      </button>
                    </div>

                    {/* Item 3: المرشد */}
                    <div style={{ background: '#d1fae5', border: '1.5px solid #057857', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                      {crewServices.guide && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#10b981', color: '#fff', fontSize: '8px', padding: '1px 5px', borderRadius: '8px' }}>نشط</div>}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(5, 120, 87, 0.2)', border: '1px solid #057857', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={SHIP_PILOT_ICON} alt="مرشد السفن" referrerPolicy="no-referrer" style={{ maxHeight: '34px', maxWidth: '34px', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#064e3b', fontSize: '13px' }}>🧭 المرشد البحري الخبير</div>
                          <p style={{ color: '#047857', fontSize: '10px', margin: '3px 0' }}>يضاعف نقاط الخبرة (EXP x2) بالكامل لجميع عمليات الصيد!</p>
                        </div>
                      </div>
                      <button onClick={() => buyCrewService('guide', 'المرشد البحري الخبير', 12)} disabled={crewServices.guide} style={{ background: crewServices.guide ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '6px' }}>
                        {crewServices.guide ? 'مفعّل' : 'تفعيل 💎 12'}
                      </button>
                    </div>

                    {/* Item 4: حارس السفن */}
                    <div style={{ background: '#d1fae5', border: '1.5px solid #057857', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                      {crewServices.police && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#10b981', color: '#fff', fontSize: '8px', padding: '1px 5px', borderRadius: '8px' }}>حارس</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={SHIP_GUARDIAN_ICON} alt="حارس السفن" referrerPolicy="no-referrer" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#064e3b', fontSize: '13px' }}>حارس السفن والمرفأ</div>
                          <p style={{ color: '#047857', fontSize: '10px', margin: '3px 0' }}>يحمي خزائن الذهب ومخازنك وأسطولك من السرقة والنهب بنسبة 100%!</p>
                        </div>
                      </div>
                      <button onClick={() => buyCrewService('police', 'حارس السفن والمرفأ', 18)} disabled={crewServices.police} style={{ background: crewServices.police ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '6px' }}>
                        {crewServices.police ? 'مفعّل ومحمي' : 'تفعيل 💎 18'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ width: '180px', background: '#23150b', borderRight: '2px solid #5c3a21', display: 'flex', flexDirection: 'column', padding: '10px', gap: '8px' }}>
              <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)', border: '1px solid #fcd34d', borderRadius: '4px', padding: '6px 2px', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
                ⚓ أسطول شابك 360 🔱
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <button onClick={() => setShopSubTab('hamour')} style={{ background: shopSubTab === 'hamour' ? '#ca8a04' : '#3a200e', color: '#fff', border: '1px solid #5c3a21', borderRadius: '4px', padding: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🔱 أسلحة الهامور
                </button>

                <button onClick={() => setShopSubTab('thihn')} style={{ background: shopSubTab === 'thihn' ? '#ca8a04' : '#3a200e', color: '#fff', border: '1px solid #5c3a21', borderRadius: '4px', padding: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ⚙️ ترقيات الذهن
                </button>

                <button onClick={() => setShopSubTab('share')} style={{ background: shopSubTab === 'share' ? '#ca8a04' : '#3a200e', color: '#fff', border: '1px solid #5c3a21', borderRadius: '4px', padding: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🚢 أسطول الشراء
                </button>

                <button onClick={() => setShopSubTab('crew_services')} style={{ background: shopSubTab === 'crew_services' ? '#10b981' : '#3a200e', color: '#fff', border: '1px solid #5c3a21', borderRadius: '4px', padding: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🍀 خدمات الحظ والشرطي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TRIBES TAB (القبائل والتحالفات - ملوك الأعماق) ----------------- */}
      {activeTab === 'tribes' && (
        <TribeView
          onClose={() => setActiveTab('harbor')}
          tribeId={tribeId}
          setTribeId={setTribeId}
          tribeName={tribeName}
          setTribeName={setTribeName}
          tribes={tribes}
          setTribes={setTribes}
          gold={gold}
          setGold={setGold}
          gems={gems}
          setGems={setGems}
          currentUser={currentUser}
          username={username}
          showToast={showToast}
          sendChatMessage={sendSecureChatMessage}
          realPlayers={realPlayers}
          joinTribe={joinTribe}
          donateToTribe={donateToTribe}
          incomingTribeJoinRequests={incomingTribeJoinRequests}
          outgoingTribeJoinRequests={outgoingTribeJoinRequests}
          onApproveTribeJoin={handleApproveTribeJoin}
          onRejectTribeJoin={handleRejectTribeJoin}
          onCancelTribeJoin={handleCancelTribeJoin}
          incomingTribeInvitations={incomingTribeInvitations}
          onAcceptTribeInvite={handleAcceptTribeInvite}
          onDeclineTribeInvite={handleDeclineTribeInvite}
          onSendTribeInvite={handleSendTribeInvite}
        />
      )}

      {/* ----------------- CHAT TAB (الشات والدردشة العامة ملوك الأعماق) ----------------- */}
      {activeTab === 'chat' && (
        <ChatView
          chatMessages={chatMessages}
          sendChatMessage={sendChatMessage}
          chatInput={chatInput}
          setChatInput={setChatInput}
          currentUser={currentUser}
          realPlayers={realPlayers}
          onClose={() => setActiveTab('harbor')}
          isMuted={isSfxMuted}
          setIsMuted={setIsSfxMuted}
          showToast={showToast}
          friends={friends}
          tribeId={tribeId}
          tribeName={tribeName}
          onOpenTribes={() => setActiveTab('tribes')}
        />
      )}

      {/* ----------------- FRIENDS TAB (قائمة الأصدقاء الحقيقيين) ----------------- */}
      {activeTab === 'friends' && (
        <div className="tab-overlay" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          <div className="tab-title">
            <span>👥 قائمة أصدقاء الميناء (Real Players)</span>
            <button className="close-tab-btn" onClick={() => setActiveTab('harbor')}>إغلاق</button>
          </div>
          <p style={{ fontSize: '15px', color: '#e2e8f0', marginBottom: '18px', lineHeight: '1.6', fontWeight: 'bold' }}>
            تواصل مع صيادين وقراصنة حقيقيين سجلوا في اللعبة، أرسل لهم هدايا الذهب، وزر موانئهم في أي وقت!
          </p>

          {/* Pending Friend Requests Section */}
          {friendRequests.length > 0 && (
            <div style={{ background: 'rgba(202, 138, 4, 0.15)', border: '2px solid #ca8a04', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '900', color: '#fef08a', fontSize: '16px', marginBottom: '12px' }}>
                ✉️ طلبات الصداقة الواردة ({friendRequests.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {friendRequests.map((req, idx) => (
                  <div key={idx} style={{ background: '#1c1917', border: '1.5px solid #78350f', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                      <span style={{ fontSize: '24px' }}>{req.senderAvatar || '⚓'}</span>
                      <span style={{ fontWeight: '900', color: '#38bdf8' }}>@{req.senderName}</span>
                      <span style={{ color: '#cbd5e1', fontSize: '12px' }}>يريد إضافتك كصديق</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleAcceptFriendRequest(req)}
                        style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '900' }}>
                        قبول ✅
                      </button>
                      <button 
                        onClick={() => handleDeclineFriendRequest(req)}
                        style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '900' }}>
                        رفض ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real Friends Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '900', color: '#fef08a', fontSize: '17px', marginBottom: '12px' }}>
              🌟 أصدقائي الحاليون ({realPlayers.filter(p => friends.includes(p.userId)).length}):
            </div>
            {realPlayers.filter(p => friends.includes(p.userId)).length === 0 ? (
              <div style={{ textShadow: 'none', background: 'rgba(0,0,0,0.4)', border: '1.5px dashed #78350f', borderRadius: '12px', padding: '20px', textAlign: 'center', color: '#cbd5e1', fontSize: '15px', fontWeight: 'bold', lineHeight: '1.6' }}>
                ليس لديك أصدقاء مضافون بعد.<br />اختر صياداً من القائمة بالأسفل وأرسل له طلب صداقة!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {realPlayers.filter(p => friends.includes(p.userId)).map(friend => {
                  const isOnline = friend.updatedAt && (new Date().getTime() - new Date(friend.updatedAt).getTime() < 600000);
                  return (
                    <div key={friend.userId} style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1.5px solid #ca8a04', padding: '14px 18px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '26px', background: '#0284c7', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #38bdf8', overflow: 'hidden' }}>
                          {renderInlineAvatar(friend.avatar, 48)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '900', color: '#fef08a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {friend.username}
                            <span style={{ fontSize: '11px', background: isOnline ? '#22c55e' : '#64748b', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                              {isOnline ? 'متصل الآن 🟢' : 'غير متصل 🔴'}
                            </span>
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '3px', fontWeight: 'bold' }}>
                            الذهب: 🪙 {(friend.gold || 0).toLocaleString()} | سيرفر: {friend.server || 'الأسطورة 1'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleSendGiftToFriend(friend)}
                          style={{ background: 'linear-gradient(180deg, #ca8a04 0%, #854d0e 100%)', color: '#fff', border: '1px solid #fef08a', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '900' }}>
                          إرسال هدية (500🪙) 🎁
                        </button>
                        <button 
                          onClick={() => {
                            handleOpenProfile(friend);
                            setInspectedPlayerShipVisit(true);
                          }}
                          style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '900' }}>
                          زيارة الميناء ⚓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search & Add Registered Real Players */}
          <div style={{ background: '#1c1917', border: '1.5px solid #78350f', borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontWeight: '900', color: '#fef08a', fontSize: '16px', marginBottom: '10px' }}>
              🔍 البحث عن صيادي وقراصنة الميناء وإضافتهم:
            </div>
            <input 
              type="text"
              placeholder="اكتب اسم القبطان للبحث عنه..."
              value={friendSearchQuery}
              onChange={(e) => setFriendSearchQuery(e.target.value)}
              style={{ width: '100%', background: '#292524', border: '1.5px solid #ca8a04', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '15px', outline: 'none', marginBottom: '14px', fontWeight: 'bold' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {realPlayers
                .filter(p => p.userId !== auth.currentUser?.uid && !friends.includes(p.userId))
                .filter(p => !friendSearchQuery || p.username?.toLowerCase().includes(friendSearchQuery.toLowerCase()))
                .slice(0, 15)
                .map(p => (
                  <div key={p.userId} style={{ background: '#292524', padding: '12px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '22px', display: 'inline-flex', alignItems: 'center' }}>{renderInlineAvatar(p.avatar, 28)}</span>
                      <span style={{ fontWeight: '900', color: '#fef08a' }}>@{p.username}</span>
                      <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>🪙 {(p.gold || 0).toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => handleSendFriendRequest(p)}
                      style={{ background: '#15803d', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer' }}>
                      إضافة صديق ➕
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

            {/* ----------------- LEADERBOARD TAB (لوحة الترتيب والمتصدرين - ملوك الأعماق) ----------------- */}
      {activeTab === 'leaderboard' && (
        <>
          <LeaderboardView
            realPlayers={realPlayers}
            currentUser={currentUser}
            currentGold={gold}
            currentGems={gems}
            leaderboardFilter={leaderboardFilter}
            setLeaderboardFilter={setLeaderboardFilter}
            leaderboardSearchQuery={leaderboardSearchQuery}
            setLeaderboardSearchQuery={setLeaderboardSearchQuery}
            handleOpenProfile={handleOpenProfile}
            setActiveTab={setActiveTab}
          />

          {/* Real Donation Modal Popup */}
          {donationTargetPlayer && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              direction: 'rtl',
              padding: '16px'
            }}>
              <div style={{
                background: 'linear-gradient(to bottom, #1c130c, #0f0a06)',
                border: '2px solid #ca8a04',
                borderRadius: '14px',
                width: '100%',
                maxWidth: '400px',
                padding: '20px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#facc15', fontSize: '18px', textAlign: 'center' }}>
                  🪙 إرسال دعم ذهبي للقبطان
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#130d09', padding: '10px', borderRadius: '10px', border: '1px solid #3c2919', marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px', display: 'inline-flex', alignItems: 'center' }}>{renderInlineAvatar(donationTargetPlayer.avatar, 40)}</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>@{donationTargetPlayer.username}</div>
                    <div style={{ fontSize: '11px', color: '#a8a29e' }}>رصيده الحالي: 🪙 {(donationTargetPlayer.gold || 0).toLocaleString()} ذهبة</div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
                  رصيدك الحالي المتاح للإرسال: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>🪙 {gold.toLocaleString()} ذهبة</span>
                </div>

                <label style={{ display: 'block', fontSize: '12px', color: '#fef08a', marginBottom: '6px' }}>حدد مبلغ الدعم الذهبي:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
                  {[500, 2500, 10000, 50000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      style={{
                        background: donationAmount === amt ? '#ca8a04' : '#130d09',
                        color: donationAmount === amt ? '#000' : '#facc15',
                        border: '1px solid #ca8a04',
                        borderRadius: '6px',
                        padding: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {amt >= 1000 ? `${amt / 1000}K` : amt}
                    </button>
                  ))}
                </div>

                <input 
                  type="number"
                  min="1"
                  max={gold}
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    background: '#130d09',
                    border: '1.5px solid #3c2919',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      if (donationAmount <= 0) {
                        alert("الرجاء تحديد مبلغ دعم صحيح!");
                        return;
                      }
                      if (gold < donationAmount) {
                        alert("⚠️ رصيدك من الذهب لا يكفي لإتمام عملية التبرع!");
                        return;
                      }
                      if (donationTargetPlayer.userId === auth.currentUser?.uid) {
                        alert("⚠️ لا يمكنك إرسال ذهب لنفسك!");
                        return;
                      }

                      try {
                        const targetRef = doc(db, 'users', donationTargetPlayer.id || donationTargetPlayer.userId);
                        const senderRef = doc(db, 'users', auth.currentUser!.uid);

                        await updateDoc(targetRef, {
                          gold: (donationTargetPlayer.gold || 0) + donationAmount
                        });

                        await updateDoc(senderRef, {
                          gold: gold - donationAmount
                        });

                        setGold(prev => prev - donationAmount);
                        showToast(`🪙 تم إرسال ${donationAmount.toLocaleString()} ذهب بنجاح إلى القبطان @${donationTargetPlayer.username}!`, 'success');
                        setDonationTargetPlayer(null);
                      } catch (err: any) {
                        console.error("Error doing donation transfer: ", err);
                        showToast("فشلت عملية التبرع: " + (err.message || 'خطأ في الاتصال'), 'error');
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(to bottom, #10b981, #047857)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    تأكيد الإرسال 🚢
                  </button>
                  <button
                    onClick={() => setDonationTargetPlayer(null)}
                    style={{
                      flex: 1,
                      background: '#1f1610',
                      color: '#a8a29e',
                      border: '1px solid #3c2919',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ----------------- LOADING STATE OVERLAY (جاري فتح الملف الشخصي) ----------------- */}
      {isProfileLoading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#090604',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Cairo, sans-serif'
        }}>
          <div style={{
            fontSize: '64px',
            animation: 'spin 2.5s infinite linear',
            marginBottom: '16px',
            filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.5))'
          }}>
            🧭
          </div>
          <div style={{
            color: '#facc15',
            fontSize: '20px',
            fontWeight: 'bold',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}>
            جاري فتح الملف الشخصي...
          </div>
        </div>
      )}

      {/* ----------------- PLAYER PROFILE MODAL (الملف الشخصي للقبطان) ----------------- */}
      {inspectedPlayer && !isProfileLoading && !inspectedPlayerShipVisit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #051428 0%, #082142 50%, #031022 100%)',
            border: '2.5px solid #00d2ff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '620px',
            boxShadow: '0 0 35px rgba(0, 210, 255, 0.4), 0 25px 60px rgba(0, 0, 0, 0.95), inset 0 0 25px rgba(0, 210, 255, 0.15)',
            color: '#fff',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header/Banner */}
            <div style={{
              background: 'radial-gradient(circle at center, #0284c7 0%, #0369a1 40%, #072a4d 75%, #031427 100%)',
              borderBottom: '2px solid rgba(0, 210, 255, 0.6)',
              padding: '24px 20px 20px 20px',
              position: 'relative',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Close Button */}
              <button 
                onClick={() => setInspectedPlayer(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1.5px solid #ef4444',
                  color: '#f87171',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  zIndex: 10,
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                title="إغلاق"
              >
                ✕
              </button>

              {/* Large Oceanic Framed User Avatar */}
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '3.5px solid #00d2ff',
                background: 'radial-gradient(circle at center, #0284c7 0%, #033260 70%, #021a36 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '54px',
                boxShadow: '0 0 25px rgba(0, 210, 255, 0.6), inset 0 0 15px rgba(0, 210, 255, 0.35)',
                marginBottom: '12px',
                overflow: 'hidden'
              }}>
                {renderInlineAvatar(inspectedPlayer.avatar, 100)}
              </div>

              {/* Username & Class */}
              <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', margin: '0 0 6px 0', textShadow: '0 0 16px rgba(0, 210, 255, 0.8), 0 2px 6px rgba(0,0,0,0.9)' }}>
                {inspectedPlayer.username}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12.5px', color: '#93c5fd' }}>
                <span style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', border: '1px solid #38bdf8', borderRadius: '6px', padding: '3px 10px', fontWeight: 'bold', color: '#ffffff', boxShadow: '0 0 10px rgba(56, 189, 248, 0.35)' }}>
                  {inspectedPlayer.pirateClass || 'قبطان مغامر'}
                </span>
                <span>•</span>
                <span style={{ color: '#7dd3fc', fontWeight: 'bold' }}>
                  {inspectedPlayer.server || 'سيرفر الأسطورة 1'}
                </span>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              backgroundColor: '#041325'
            }} className="no-scrollbar">
              
              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                {/* Level Stat */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 47, 85, 0.7) 0%, rgba(3, 22, 45, 0.9) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 0 12px rgba(56, 189, 248, 0.08)'
                }}>
                  <span style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}>⭐</span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>المستوى والقوة العامة</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#38bdf8' }}>
                      مستوى {Math.max(1, Math.floor(Math.sqrt(inspectedPlayer.exp || 0) / 10) + 1)}
                    </div>
                  </div>
                </div>

                {/* Gold Stat */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 47, 85, 0.7) 0%, rgba(3, 22, 45, 0.9) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 0 12px rgba(56, 189, 248, 0.08)'
                }}>
                  <span style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}>🪙</span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>الرصيد الذهبي</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#34d399' }}>
                      {(inspectedPlayer.gold || 0).toLocaleString()} ذهبة
                    </div>
                  </div>
                </div>

                {/* Gems Stat */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 47, 85, 0.7) 0%, rgba(3, 22, 45, 0.9) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 0 12px rgba(56, 189, 248, 0.08)'
                }}>
                  <span style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}>💎</span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>الجواهر الزرقاء</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#60a5fa' }}>
                      {(inspectedPlayer.gems || 0).toLocaleString()} جوهرة
                    </div>
                  </div>
                </div>

                {/* Tower Stat */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 47, 85, 0.7) 0%, rgba(3, 22, 45, 0.9) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 0 12px rgba(56, 189, 248, 0.08)'
                }}>
                  <span style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}>🏰</span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>بيت السفن والبرج</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#fb923c' }}>
                      مستوى {inspectedPlayer.shipTowerLevel || 1}
                    </div>
                  </div>
                </div>

                {/* Fish Storage Stat */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 47, 85, 0.7) 0%, rgba(3, 22, 45, 0.9) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 0 12px rgba(56, 189, 248, 0.08)'
                }}>
                  <span style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}>🐟</span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>بيت السمك</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#22d3ee' }}>
                      مستوى {inspectedPlayer.fishStorageLevel || 1}
                    </div>
                  </div>
                </div>

                {/* Active Ships Stat */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 47, 85, 0.7) 0%, rgba(3, 22, 45, 0.9) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 0 12px rgba(56, 189, 248, 0.08)'
                }}>
                  <span style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}>⛵</span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>الأسطول الحقيقي</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#c084fc' }}>
                      {getInspectedPlayerShips(inspectedPlayer).filter((s: any) => s.exists !== false).length} سفن نشطة
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                borderTop: '1.5px solid rgba(56, 189, 248, 0.25)',
                borderBottom: '1.5px solid rgba(56, 189, 248, 0.25)',
                padding: '14px 0'
              }}>
                <button 
                  onClick={() => {
                    setIsProfileLoading(true);
                    setTimeout(() => {
                      setIsProfileLoading(false);
                      setInspectedPlayerShipVisit(true);
                    }, 400);
                  }}
                  style={{
                    background: 'linear-gradient(to bottom, #0284c7, #0369a1)',
                    border: '1.5px solid #38bdf8',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>⚓</span> زيارة الميناء والسفن
                </button>

                <button 
                  onClick={async () => {
                    const text = prompt(`💬 اكتب رسالتك السريعة لتبثها باسم القبطان @${username} إلى القبطان @${inspectedPlayer.username}:`);
                    if (!text || !text.trim()) return;
                    try {
                      await sendSecureChatMessage(username, avatar, `@${inspectedPlayer.username} ${text}`);
                      showToast(`🎉 تم بث رسالتك بنجاح في الجزيرة!`, 'success');
                    } catch (e) {
                      console.error("Error messaging player:", e);
                    }
                  }}
                  style={{
                    background: 'linear-gradient(to bottom, #7c3aed, #6d28d9)',
                    border: '1.5px solid #a78bfa',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>💬</span> رسالة
                </button>

                <button 
                  onClick={() => {
                    alert(`✨ تم إرسال طلب صداقة رسمي إلى القبطان @${inspectedPlayer.username} بنجاح!`);
                  }}
                  style={{
                    background: 'linear-gradient(to bottom, #059669, #047857)',
                    border: '1.5px solid #34d399',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>➕</span> إضافة صديق
                </button>
              </div>

              {/* Alliance Section */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(8, 47, 85, 0.6) 0%, rgba(3, 22, 45, 0.8) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
              }}>
                <h4 style={{ color: '#38bdf8', fontSize: '14px', fontWeight: '900', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '18px' }}>🏴‍☠️</span> التحالف البحري الحالي
                </h4>
                <p style={{ color: '#e2e8f0', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '26px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>🛡️</span>
                  <span>
                    {inspectedPlayer.tribeName
                      ? `عضو في تحالف [${inspectedPlayer.tribeName}]`
                      : 'مستقل / لا ينتمي لأي حلف حالياً في جزيرة الكاريبي.'}
                  </span>
                </p>
              </div>

              {/* Owned Ships List Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <h4 style={{ color: '#38bdf8', fontSize: '14.5px', fontWeight: '900', margin: '4px 0 2px 0', borderBottom: '1.5px solid rgba(56, 189, 248, 0.25)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🚢</span> أسطول سفن القبطان النشطة
                </h4>
                
                {getInspectedPlayerShips(inspectedPlayer).filter((s: any) => s.exists).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px', color: '#94a3b8', background: 'rgba(8, 47, 85, 0.4)', border: '1.5px dashed rgba(56, 189, 248, 0.3)', borderRadius: '12px', fontSize: '13px' }}>
                    ⚠️ القبطان لا يملك أي سفن نشطة في الوقت الحالي.
                  </div>
                ) : (
                  getInspectedPlayerShips(inspectedPlayer).filter((s: any) => s.exists).map((ship: any, index: number) => (
                    <div 
                      key={index}
                      style={{
                        background: 'linear-gradient(135deg, rgba(8, 47, 85, 0.7) 0%, rgba(3, 22, 45, 0.9) 100%)',
                        border: '1.5px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.4), inset 0 0 10px rgba(56, 189, 248, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '46px', filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.4))' }}>{ship.imgEmoji || '🛶'}</span>
                        <div>
                          <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '15px' }}>{ship.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#93c5fd', marginTop: '3px', fontWeight: '500' }}>
                            المستوى: {ship.level} • قوة تدمير السفن: {ship.power || 5} • سعة التخزين (الطاقة): {getShipMaxHeart(ship).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ----------------- VISITING SHIPS SEA VIEW ----------------- */}
      {inspectedPlayer && inspectedPlayerShipVisit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle, #022340 0%, #010f1c 100%)',
          zIndex: 9999,
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Wave backgrounds using gentle css sway/movement to simulate realistic sea water */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.25,
            backgroundImage: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }} />

          {/* Glowing Top Floating Header */}
          <div style={{
            background: 'linear-gradient(to bottom, rgba(20, 14, 8, 0.96), rgba(12, 8, 5, 0.92))',
            borderBottom: '2.5px solid #ca8a04',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            zIndex: 30,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '2px solid #facc15',
                background: '#0a0604',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 0 12px rgba(250, 204, 21, 0.4)',
                overflow: 'hidden'
              }}>
                {renderInlineAvatar(inspectedPlayer.avatar, 46)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#facc15' }}>
                    ميناء القبطان @{inspectedPlayer.username}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    background: inspectedPlayer.portDestroyed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    color: inspectedPlayer.portDestroyed ? '#ef4444' : '#22c55e',
                    border: inspectedPlayer.portDestroyed ? '1px solid #ef4444' : '1px solid #22c55e',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {inspectedPlayer.portDestroyed ? '🔥 الميناء متضرر' : '🛡️ ميناء سليم'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span>🏴‍☠️ {inspectedPlayer.pirateClass || 'صياد البحار'}</span>
                  <span>🌐 {inspectedPlayer.server || 'سيرفر الأسطورة 1'}</span>
                  {inspectedPlayer.tribeName && <span>🚩 قبيلة: {inspectedPlayer.tribeName}</span>}
                </div>
              </div>
            </div>

            {/* Quick Harbor Stat Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #ca8a04', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#fef08a' }}>
                🏰 بيت السفن: <strong style={{ color: '#fb923c' }}>م.{inspectedPlayer.shipTowerLevel || 1}</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #ca8a04', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#fef08a' }}>
                🐟 بيت السمك: <strong style={{ color: '#60a5fa' }}>م.{inspectedPlayer.fishStorageLevel || 1}</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #3c2919', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#cbd5e1' }}>
                🪙 {(inspectedPlayer.gold || 0).toLocaleString()}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #3c2919', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#cbd5e1' }}>
                💎 {(inspectedPlayer.gems || 0).toLocaleString()}
              </div>
              
              <button 
                onClick={() => {
                  setIsProfileLoading(true);
                  setTimeout(() => {
                    setIsProfileLoading(false);
                    setInspectedPlayerShipVisit(false);
                    setInspectedPlayer(null);
                  }, 400);
                }}
                style={{
                  background: 'linear-gradient(to bottom, #ca8a04, #854d0e)',
                  border: '1px solid #fef08a',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🚪 العودة لمينائي
              </button>
            </div>
          </div>

            {/* Custom keyframe styles injection for nuclear bomb effects */}
            <style>{`
              @keyframes fade-in-out {
                0% { opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { opacity: 0; }
              }
              @keyframes fly-rocket {
                0% {
                  bottom: -100px;
                  right: 10%;
                  transform: rotate(-45deg) scale(0.6);
                  opacity: 0;
                }
                15% {
                  opacity: 1;
                }
                100% {
                  bottom: 45%;
                  right: 45%;
                  transform: rotate(-45deg) scale(1.3);
                }
              }
              @keyframes fly-rocket-targeted {
                0% {
                  left: 96%;
                  top: 96%;
                  transform: translate(-50%, -50%) rotate(var(--rocket-angle, -48deg)) scale(0.6);
                  opacity: 0;
                }
                6% {
                  opacity: 1;
                }
                100% {
                  left: var(--rocket-target-x, 45%);
                  top: var(--rocket-target-y, 49%);
                  transform: translate(-50%, -50%) rotate(var(--rocket-angle, -48deg)) scale(1.25);
                  opacity: 1;
                }
              }
              @keyframes fly-rocket-small-targeted {
                0% {
                  left: 96%;
                  top: 96%;
                  transform: translate(-50%, -50%) rotate(var(--rocket-angle, -48deg)) scale(0.5);
                  opacity: 0;
                }
                6% {
                  opacity: 1;
                }
                100% {
                  left: var(--rocket-target-x, 45%);
                  top: var(--rocket-target-y, 49%);
                  transform: translate(-50%, -50%) rotate(var(--rocket-angle, -48deg)) scale(0.95);
                  opacity: 1;
                }
              }
              @keyframes fly-rocket-med-targeted {
                0% {
                  left: 96%;
                  top: 96%;
                  transform: translate(-50%, -50%) rotate(var(--rocket-angle, -48deg)) scale(0.55);
                  opacity: 0;
                }
                6% {
                  opacity: 1;
                }
                100% {
                  left: var(--rocket-target-x, 45%);
                  top: var(--rocket-target-y, 49%);
                  transform: translate(-50%, -50%) rotate(var(--rocket-angle, -48deg)) scale(1.1);
                  opacity: 1;
                }
              }
              @keyframes rocket-launch-flash {
                0% {
                  transform: translate(-50%, -50%) scale(0.2);
                  opacity: 1;
                }
                50% {
                  transform: translate(-50%, -50%) scale(1.35);
                  opacity: 0.9;
                }
                100% {
                  transform: translate(-50%, -50%) scale(1.9);
                  opacity: 0;
                }
              }
              @keyframes float-xp-topleft {
                0% {
                  transform: translateY(-20px) scale(0.85);
                  opacity: 0;
                }
                15% {
                  transform: translateY(0) scale(1.05);
                  opacity: 1;
                }
                25% {
                  transform: translateY(0) scale(1);
                  opacity: 1;
                }
                80% {
                  transform: translateY(0) scale(1);
                  opacity: 1;
                }
                100% {
                  transform: translateY(-12px) scale(0.95);
                  opacity: 0;
                }
              }
              @keyframes fall-down {
                0% {
                  top: -140px;
                  transform: translateX(-50%) scale(0.65) rotate(4deg);
                  filter: brightness(1);
                  opacity: 0;
                }
                10% {
                  opacity: 1;
                }
                58% {
                  top: 48%;
                  transform: translateX(-50%) scale(0.95) rotate(0deg);
                  filter: brightness(1.2) drop-shadow(0 0 16px rgba(255, 152, 0, 0.85));
                }
                64% {
                  top: 52%;
                  transform: translateX(-50%) scale(1.0) rotate(0deg);
                  filter: brightness(1.35) drop-shadow(0 0 20px #38bdf8);
                }
                82% {
                  top: 59%;
                  transform: translateX(-50%) scale(0.9) rotate(0deg);
                  filter: hue-rotate(170deg) brightness(0.7) contrast(1.2) drop-shadow(0 0 25px #0284c7);
                }
                100% {
                  top: 65%;
                  transform: translateX(-50%) scale(1.05) rotate(0deg);
                  filter: hue-rotate(170deg) brightness(2.4) drop-shadow(0 0 45px #ffffff);
                }
              }
              @keyframes water-landing-splash {
                0% {
                  transform: translate(-50%, -50%) scale(0.1);
                  opacity: 0;
                }
                56% {
                  transform: translate(-50%, -50%) scale(0.15);
                  opacity: 0;
                }
                66% {
                  transform: translate(-50%, -50%) scale(1.0);
                  opacity: 0.95;
                }
                100% {
                  transform: translate(-50%, -50%) scale(2.4);
                  opacity: 0;
                }
              }
              @keyframes underwater-bubbles-rise {
                0% {
                  opacity: 0;
                  transform: scale(0.2);
                }
                62% {
                  opacity: 0;
                  transform: scale(0.3);
                }
                72% {
                  opacity: 1;
                  transform: scale(0.9) translateY(-10px);
                }
                100% {
                  opacity: 0.85;
                  transform: scale(1.4) translateY(-35px);
                }
              }
              @keyframes thruster-flame {
                0% { transform: scaleY(0.9) scaleX(0.95); opacity: 0.95; }
                100% { transform: scaleY(1.45) scaleX(1.15); opacity: 0.85; filter: brightness(1.6); }
              }
              @keyframes shake-viewport-extreme {
                0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                5% { transform: translate(-18px, -14px) scale(1.05) rotate(-3deg); }
                10% { transform: translate(14px, 16px) scale(0.96) rotate(2.5deg); }
                15% { transform: translate(-16px, -12px) scale(1.04) rotate(-2deg); }
                20% { transform: translate(12px, -15px) scale(1.02) rotate(2deg); }
                25% { transform: translate(-10px, 12px) scale(0.98) rotate(-1.5deg); }
                30% { transform: translate(9px, 8px) scale(1.03) rotate(1.2deg); }
                35% { transform: translate(-7px, -9px) scale(0.99) rotate(-1deg); }
                40% { transform: translate(6px, -6px) scale(1.01) rotate(0.8deg); }
                45% { transform: translate(-5px, 5px) scale(1.02) rotate(-0.5deg); }
                50% { transform: translate(4px, -4px) scale(1.0) rotate(0.4deg); }
                60% { transform: translate(-3px, 3px) scale(1.01) rotate(-0.3deg); }
                70% { transform: translate(2px, -2px) scale(1.0) rotate(0.2deg); }
                80% { transform: translate(-1px, 1px) scale(1.01) rotate(-0.1deg); }
                90% { transform: translate(1px, 0px) scale(1.0) rotate(0deg); }
                100% { transform: translate(0, 0) scale(1) rotate(0deg); }
              }
              @keyframes camera-flash-and-grade {
                0% { filter: contrast(1) brightness(1) saturate(1); }
                1% { filter: contrast(3.5) brightness(4.0) saturate(0) invert(0.1); }
                8% { filter: contrast(2.5) brightness(2.5) saturate(0.5) hue-rotate(-15deg); }
                25% { filter: contrast(1.8) brightness(1.6) saturate(2.2) hue-rotate(-5deg); }
                50% { filter: contrast(1.4) brightness(1.2) saturate(1.6); }
                100% { filter: contrast(1) brightness(1) saturate(1); }
              }
              @keyframes nuclear-flash {
                0% { opacity: 0; background: #ffffff; }
                1% { opacity: 1; background: #ffffff; }
                15% { opacity: 1; background: radial-gradient(circle, #ffffff 15%, #fef08a 45%, #ea580c 75%, #000000 100%); }
                35% { opacity: 0.9; background: radial-gradient(circle, #f97316 20%, #7c2d12 65%, rgba(0,0,0,0.95) 100%); }
                75% { opacity: 0.55; background: radial-gradient(circle, #ea580c 10%, rgba(30,41,59,0.95) 75%, rgba(0,0,0,0.98) 100%); }
                100% { opacity: 0; background: transparent; }
              }
              @keyframes shockwave-expand-realistic {
                0% {
                  width: 10px;
                  height: 10px;
                  opacity: 1;
                  border-width: 32px;
                  filter: blur(1px) brightness(3);
                }
                15% {
                  opacity: 0.95;
                  border-width: 20px;
                  filter: blur(3px) brightness(2.2);
                }
                60% {
                  opacity: 0.6;
                  border-width: 6px;
                  filter: blur(8px) brightness(1.2);
                }
                100% {
                  width: 1700px;
                  height: 1700px;
                  opacity: 0;
                  border-width: 0.5px;
                  filter: blur(25px) brightness(0.5);
                }
              }
              @keyframes mushroom-cap-billow {
                0% {
                  transform: translate(-50%, -50%) scale(0.08);
                  opacity: 0;
                  filter: blur(2px) brightness(3) contrast(1.5);
                }
                6% {
                  opacity: 1;
                  filter: blur(0px) brightness(2.2) contrast(1.2);
                }
                35% {
                  transform: translate(-50%, -72%) scale(1.2);
                  opacity: 0.98;
                  filter: brightness(1.4) contrast(1.1);
                }
                70% {
                  transform: translate(-50%, -85%) scale(1.6) rotate(3deg);
                  opacity: 0.85;
                  filter: brightness(0.85) contrast(0.9) grayscale(0.2);
                }
                100% {
                  transform: translate(-50%, -95%) scale(2.0) rotate(6deg);
                  opacity: 0;
                  filter: blur(40px) brightness(0.2) grayscale(0.8);
                }
              }
              @keyframes stem-rise-volumetric {
                0% {
                  height: 0px;
                  transform: translateX(-50%) scaleX(0.1);
                  opacity: 0;
                  filter: brightness(3);
                }
                10% {
                  height: 40px;
                  transform: translateX(-50%) scaleX(0.6);
                  opacity: 1;
                }
                40% {
                  height: 250px;
                  transform: translateX(-50%) scaleX(1.3);
                  opacity: 0.95;
                  filter: brightness(1.5);
                }
                100% {
                  height: 310px;
                  transform: translateX(-50%) scaleX(1.8);
                  opacity: 0;
                  filter: blur(25px) brightness(0.1);
                }
              }
              @keyframes central-fire-core {
                0% { transform: scale(0.5) rotate(0deg); opacity: 1; filter: brightness(3); }
                50% { transform: scale(1.15) rotate(180deg); opacity: 0.95; filter: brightness(2) contrast(1.4); }
                100% { transform: scale(1.3) rotate(360deg); opacity: 0; filter: blur(20px) brightness(0.2); }
              }
              @keyframes base-dust-ring {
                0% { transform: translate(-50%, -10%) scale(0.1); opacity: 0; filter: blur(3px); }
                15% { opacity: 0.9; }
                100% { transform: translate(-50%, -30%) scale(2.4); opacity: 0; filter: blur(35px); }
              }
              @keyframes float-xp {
                0% { transform: translate(-50%, 40px) scale(0.7); opacity: 0; }
                15% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translate(-50%, -140px) scale(1.2); opacity: 0; }
              }
              @keyframes spin-vortex {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>

          {/* Sea View Playground where Ships sit on the water */}
          <div 
            onClick={(e) => {
              if (isAtomicBombActive || showAtomicExplosion || isLargeRocketActive || showLargeRocketExplosion || isMediumRocketActive || showMediumRocketExplosion || isSmallRocketActive || showSmallRocketExplosion || showSmokeExplosion) {
                return;
              }
              const target = e.target as HTMLElement;
              // If clicked directly on the playground or video/background layer (clicking the port/harbor)
              const isPortClick = target === e.currentTarget || target.tagName === 'VIDEO' || target.getAttribute('data-harbor-bg') === 'true';
              if (isPortClick) {
                const baseShips = (inspectedPlayer.ships && Array.isArray(inspectedPlayer.ships) && inspectedPlayer.ships.length > 0)
                  ? inspectedPlayer.ships
                  : getInspectedPlayerShips(inspectedPlayer);
                const firstShip = baseShips[0] || { name: 'سفينة الأسطول', level: 1, power: 10, cargo: 2000, heart: inspectedPlayer.portDestroyed ? 0 : 2000, maxHeart: 2000, energySyncedToCargo: true };
                const shipSpec = SHOP_SHIPS.find(s => s.level === firstShip.level) || SHOP_SHIPS[0];
                const firstLevel = firstShip.level || shipSpec.level || 1;
                const normalizedFirst = normalizeShipEnergyToCargo({
                  ...firstShip,
                  name: firstShip.name || shipSpec.name,
                  level: firstLevel,
                  cargo: firstShip.cargo || getShipCapacity(firstLevel) || 2000,
                  power: firstShip.power || shipSpec.power || 10
                }, Boolean(inspectedPlayer.portDestroyed));
                setSelectedVisitedShip(normalizedFirst);
                setActiveInteractionType('details');
              }
            }}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              animation: isShaking 
                ? 'shake-viewport-extreme 3.5s cubic-bezier(0.1, 0.8, 0.2, 1) infinite, camera-flash-and-grade 3.0s cubic-bezier(0.1, 0.9, 0.3, 1) forwards' 
                : 'none'
            }}
          >
            {/* Real animated water background video - only if port is not destroyed */}
            {!inspectedPlayer.portDestroyed && !disableAnimatedBackground && !powerSaver && (
              <video
                src="/background_video.mp4?v=2"
                playsInline
                muted
                autoPlay
                loop
                preload="auto"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1,
                  pointerEvents: 'none',
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                }}
              />
            )}
            
            {/* Fallback/Main background image - shows destroyed port if visited port is destroyed */}
            <div 
              data-harbor-bg="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: inspectedPlayer.portDestroyed 
                  ? "url('/backgrounds/destroyed_port.webp')" 
                  : "url('/backgrounds/harbor_main.webp')",
                backgroundSize: '100% 100%',
                backgroundPosition: 'center bottom',
                backgroundRepeat: 'no-repeat',
                zIndex: 0,
                pointerEvents: 'none'
              }} 
            />

            {/* Ambient water tint layer */}
            <div 
              data-harbor-bg="true"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 3,
                background: inspectedPlayer.portDestroyed ? 'rgba(0,0,0,0.45)' : 'rgba(2, 35, 64, 0.15)',
                pointerEvents: 'none'
              }} 
            />

            {/* Real-time particles overlay for visited port combat & destruction */}
            <div style={{ position: 'absolute', inset: 0, zIndex: (isAtomicBombActive || showSmallRocketExplosion || showMediumRocketExplosion || showLargeRocketExplosion) ? 9999 : 4, pointerEvents: 'none' }}>
              <ParticlesEffect portDestroyed={!!inspectedPlayer.portDestroyed} />
            </div>

            {/* ----------------- REAL HARBOR BUILDINGS OF THE VISITED PLAYER ----------------- */}
            
            {/* 1. Fish House (بيت السمك) */}
            <div
              style={{
                position: 'absolute',
                left: '8%',
                top: '36%',
                width: '160px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                willChange: 'transform'
              }}
              onClick={() => {
                const lvl = inspectedPlayer.fishStorageLevel || 1;
                const cap = getFishHouseCapacity(lvl);
                setVisitedBuildingModal({
                  type: 'fish',
                  title: `بيت السمك للقبطان @${inspectedPlayer.username}`,
                  level: lvl,
                  capacity: cap,
                  image: getFishHouseImageUrl(lvl),
                  details: `مخزن الأسماك الحقيقي للقبطان @${inspectedPlayer.username}. تم ترقيته إلى المستوى ${lvl} بسعة تخزينية تبلغ ${cap.toLocaleString()} سمكة.`
                });
              }}
              title="بيت السمك"
            >
              <div style={{
                marginBottom: '6px',
                background: 'rgba(0,0,0,0.85)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid #38bdf8',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#38bdf8', fontFamily: 'Cairo, sans-serif' }}>
                  🐟 بيت السمك (مستوى {inspectedPlayer.fishStorageLevel || 1})
                </span>
              </div>

              <div style={{
                width: '160px',
                height: '160px',
                position: 'relative',
                filter: inspectedPlayer.portDestroyed 
                  ? 'grayscale(0.8) brightness(0.3) drop-shadow(0 0 10px rgba(239,68,68,0.7))'
                  : 'drop-shadow(0 14px 22px rgba(0,0,0,0.65))',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center'
              }}>
                <img
                  src={getFishHouseImageUrl(inspectedPlayer.fishStorageLevel || 1)}
                  alt={`بيت السمك - مستوى ${inspectedPlayer.fishStorageLevel || 1}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))',
                    transform: 'scaleX(-1)'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/FISH/refs/heads/main/level-01.png";
                  }}
                />
              </div>
            </div>

            {/* 2. Ship House / Tower (بيت السفن) */}
            <div
              style={{
                position: 'absolute',
                left: '73%',
                top: '26%',
                width: '170px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                willChange: 'transform'
              }}
              onClick={() => {
                const lvl = inspectedPlayer.shipTowerLevel || 1;
                const activeShipsCount = getInspectedPlayerShips(inspectedPlayer).filter((s: any) => s.exists !== false).length;
                setVisitedBuildingModal({
                  type: 'shipTower',
                  title: `بيت السفن والبرج الساحلي للقبطان @${inspectedPlayer.username}`,
                  level: lvl,
                  image: getHarborImageUrl(lvl),
                  details: `برج قيادة الميناء وترسانة السفن الحقيقية للقبطان @${inspectedPlayer.username}. المستوى الحالي هو ${lvl}، ويحتوي على ${activeShipsCount} سفن نشطة في أسطوله.`
                });
              }}
              title="بيت السفن"
            >
              <div style={{
                marginBottom: '6px',
                background: 'rgba(0,0,0,0.85)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid #ca8a04',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#facc15', fontFamily: 'Cairo, sans-serif' }}>
                  ⚓ بيت السفن (مستوى {inspectedPlayer.shipTowerLevel || 1})
                </span>
              </div>

              <div style={{
                width: '160px',
                height: '160px',
                position: 'relative',
                filter: inspectedPlayer.portDestroyed
                  ? 'grayscale(0.8) brightness(0.3) drop-shadow(0 0 10px rgba(239,68,68,0.7))'
                  : 'drop-shadow(0 12px 20px rgba(0,0,0,0.5))',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center'
              }}>
                <img
                  src={getHarborImageUrl(inspectedPlayer.shipTowerLevel || 1)}
                  alt="بيت السفن"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))'
                  }}
                />
              </div>
            </div>

            {/* ----------------- REAL SHIPS OF THE VISITED PLAYER ----------------- */}
            {getInspectedPlayerShips(inspectedPlayer).filter((s: any) => s.exists !== false).length === 0 ? (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#cbd5e1',
                background: 'rgba(15, 10, 5, 0.9)',
                border: '2px solid #ca8a04',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                maxWidth: '400px',
                zIndex: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
              }}>
                <span style={{ fontSize: '48px' }}>🌊</span>
                <h4 style={{ margin: '14px 0 6px 0', fontWeight: 'bold', color: '#facc15' }}>المياه هادئة تماماً</h4>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>لا توجد أي سفن نشطة للقبطان راسية في مياهه الإقليمية في هذه اللحظة.</p>
              </div>
            ) : (
              getInspectedPlayerShips(inspectedPlayer).filter((s: any) => s.exists !== false).map((ship: any, index: number) => {
                // Get real-time position coordinates matching docks object near بيت السمك when docked
                const dockKey = `s${ship.id || index + 1}`;
                const fallbackPos = docks[ship.id] || docks[dockKey] || docks[`s${index + 1}`] || { l: '26%', t: '51%' };
                const fishPos = fishSpots[ship.id] || fishSpots[dockKey] || fishSpots[`s${index + 1}`] || { l: '55%', t: '49%' };
                const shipLeft = ship.status === 'fishing' ? (ship.left || fishPos.l) : fallbackPos.l;
                const shipTop = ship.status === 'fishing' ? (ship.top || fishPos.t) : fallbackPos.t;
                const shipScaleX = typeof ship.scaleX === 'number' ? ship.scaleX : 1;
                const shipLevel = typeof ship.level === 'number' ? ship.level : (SHOP_SHIPS.find(s => s.name === ship.name)?.level ?? 0);
                const shipSpec = SHOP_SHIPS.find(s => s.level === shipLevel) || SHOP_SHIPS[0];
                const shipCapacity = ship.cargo || getShipCapacity(shipLevel);

                // Determine ship aura filter based on upgrades
                const sSpeed = ship.speedLevel || 1;
                const sCap = ship.capacityLevel || 1;
                const sDef = ship.defenseLevel || 1;
                const isUpgraded = sSpeed > 1 || sCap > 1 || sDef > 1;

                let shipAuraFilter = 'drop-shadow(0 12px 10px rgba(0,0,0,0.65))';
                if (isUpgraded) {
                  if (sSpeed >= sCap && sSpeed >= sDef) {
                    shipAuraFilter = `drop-shadow(0 0 8px rgba(6, 182, 212, 0.95)) drop-shadow(0 6px 6px rgba(0,0,0,0.6))`;
                  } else if (sCap >= sSpeed && sCap >= sDef) {
                    shipAuraFilter = `drop-shadow(0 0 8px rgba(234, 179, 8, 0.95)) drop-shadow(0 6px 6px rgba(0,0,0,0.6))`;
                  } else {
                    shipAuraFilter = `drop-shadow(0 0 8px rgba(16, 185, 129, 0.95)) drop-shadow(0 6px 6px rgba(0,0,0,0.6))`;
                  }
                }

                const isShipDestroyed = typeof ship.heart === 'number' ? ship.heart <= 0 : Boolean(inspectedPlayer.portDestroyed);

                return (
                  <div
                    key={ship.id || index}
                    className={`ship ${ship.moving ? 'moving' : ''}`}
                    style={{
                      position: 'absolute',
                      left: shipLeft,
                      top: shipTop,
                      transform: `scaleX(${shipScaleX}) ${isShipDestroyed ? 'rotate(12deg) translateY(24px)' : ''}`,
                      zIndex: 5,
                      cursor: 'pointer',
                      filter: isShipDestroyed 
                        ? 'grayscale(0.85) brightness(0.22) contrast(1.4) sepia(0.5) hue-rotate(-15deg) drop-shadow(0 0 10px rgba(239,68,68,0.85))' 
                        : shipAuraFilter,
                      transition: `left ${ship.transitionDuration || '2s'} ease-in-out, top ${ship.transitionDuration || '2s'} ease-in-out, transform 0.5s ease-in-out`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAtomicBombActive || showAtomicExplosion || isLargeRocketActive || showLargeRocketExplosion || isMediumRocketActive || showMediumRocketExplosion || isSmallRocketActive || showSmallRocketExplosion || showSmokeExplosion) {
                        return;
                      }
                      setSelectedVisitedShip(normalizeShipEnergyToCargo({
                        ...ship,
                        name: ship.name || shipSpec.name,
                        level: shipLevel,
                        cargo: shipCapacity,
                        power: ship.power || shipSpec.power
                      }, Boolean(inspectedPlayer.portDestroyed)));
                      setActiveInteractionType('details');
                    }}
                  >
                    {/* Glowing dock water ring */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '120px',
                      height: '24px',
                      background: 'radial-gradient(ellipse at center, rgba(234, 179, 8, 0.25) 0%, rgba(234, 179, 8, 0) 70%)',
                      borderRadius: '50%',
                      zIndex: -1,
                      pointerEvents: 'none'
                    }} />

                    {/* Floating realistic boat image inside inner wrapper with status overlaid */}
                    <div className="relative ship-inner" style={{ width: 'var(--ship-render-width)', height: 'calc(var(--ship-render-width) * 0.95)', margin: '0 auto' }}>
                      
                      {/* Unified Ship Energy Bar (identical to own harbor) */}
                      {(() => {
                        const normalizedVisited = normalizeShipEnergyToCargo({ ...ship, level: shipLevel }, Boolean(inspectedPlayer.portDestroyed));
                        const maxHeart = getShipMaxHeart(normalizedVisited);
                        const currentHeart = typeof normalizedVisited.heart === 'number'
                          ? Math.min(Math.max(0, normalizedVisited.heart), maxHeart)
                          : (inspectedPlayer.portDestroyed ? 0 : maxHeart);
                        const energyPct = isShipDestroyed || currentHeart <= 0
                          ? 0
                          : (currentHeart >= maxHeart ? 100 : Math.max(1, Math.min(99, Math.round((currentHeart / maxHeart) * 100))));

                        return (
                          <ShipStatusBars
                            fishingPct={0}
                            energyPct={energyPct}
                            isFishing={false}
                            isAutoFishing={false}
                            isReady={false}
                            remainingMs={0}
                            curHeart={currentHeart}
                            maxHeart={maxHeart}
                            isDestroyed={isShipDestroyed}
                            scaleX={shipScaleX}
                            bottomOffset="calc(100% - 112px)"
                          />
                        );
                      })()}

                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        filter: isShipDestroyed ? 'grayscale(1) brightness(0.25) contrast(1.3) sepia(1) hue-rotate(-20deg)' : 'none',
                        transition: 'filter 1.2s ease'
                      }}>
                        <ShipImage level={shipLevel} width={280} plain={true} fill={true} />
                        
                        {/* Burning smoke & fire for wrecked ships */}
                        {isShipDestroyed && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '4px',
                            zIndex: 10,
                            pointerEvents: 'none'
                          }}>
                            <span style={{ fontSize: '28px', animation: 'bounce 0.8s infinite alternate' }}>🔥</span>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fca5a5', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ef4444' }}>مدمّرة 💀</span>
                          </div>
                        )}
                      </div>

                      {/* Floating Name Overlay */}
                      <span style={{
                        position: 'absolute',
                        bottom: 'calc(100% - 73px)',
                        left: '50%',
                        transform: `translateX(-50%) scaleX(${shipScaleX < 0 ? -1 : 1})`, // Keep text readable even when ship is flipped left
                        background: 'rgba(15, 10, 5, 0.95)',
                        border: '1px solid #ca8a04',
                        borderRadius: '8px',
                        padding: '2px 10px',
                        fontSize: '11px',
                        color: '#fef08a',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        zIndex: 6,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.6)'
                      }}>
                        {ship.name || shipSpec.name}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Red Swirling Portal Back Button (Bottom Left) */}
            <div 
              onClick={() => {
                setIsProfileLoading(true);
                setTimeout(() => {
                  setIsProfileLoading(false);
                  setInspectedPlayerShipVisit(false);
                  setInspectedPlayer(null);
                }, 600);
              }}
              style={{
                position: 'absolute',
                bottom: '30px',
                left: '30px',
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #ef4444 0%, #7f1d1d 70%, #450a0a 100%)',
                border: '3.5px solid #ca8a04',
                boxShadow: '0 0 25px #ef4444, inset 0 0 15px rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                cursor: 'pointer',
                animation: 'pulse 1.8s infinite ease-in-out',
                zIndex: 100
              }}
              title="العودة للميناء الرئيسي"
            >
              🌀
            </div>

            {/* Seamless Authentic Atomic Bomb Sky Descent, Sea Water Penetration & Underwater Detonation */}
            {isAtomicBombActive && (
              <AtomicBombExplosion
                x="45%"
                surfaceY="48%"
                depthY="64%"
                onComplete={() => {
                  setIsAtomicBombActive(false);
                  setShowAtomicExplosion(false);
                }}
              />
            )}

            {/* Real-time Floating XP Badge for Atomic Bomb Matching Video */}
            {showAtomicBombXp && (
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '18px',
                  zIndex: 9999,
                  background: 'rgba(15, 10, 5, 0.94)',
                  border: '2px solid #ca8a04',
                  borderRadius: '24px',
                  padding: '6px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.85), 0 0 14px rgba(202, 138, 4, 0.5)',
                  animation: 'float-xp-topleft 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  pointerEvents: 'none',
                  direction: 'ltr',
                }}
              >
                <span style={{ fontSize: '15px' }}>⭐</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#fde047', letterSpacing: '0.5px' }}>
                  XP +2500
                </span>
              </div>
            )}

            {/* Real-time Floating XP Badge Matching Video */}
            {showRocketXp && (
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '18px',
                  zIndex: 9999,
                  background: 'rgba(15, 10, 5, 0.94)',
                  border: '2px solid #ca8a04',
                  borderRadius: '24px',
                  padding: '6px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.85), 0 0 14px rgba(202, 138, 4, 0.5)',
                  animation: 'float-xp-topleft 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  pointerEvents: 'none',
                  direction: 'ltr',
                }}
              >
                <span style={{ fontSize: '15px' }}>⭐</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#fde047', letterSpacing: '0.5px' }}>
                  {rocketXpText || 'XP +100'}
                </span>
              </div>
            )}

            {/* Small Rocket Diving Missile Animation (Diagonal Dive + Blazing Fire + Smoke Plume) */}
            {isSmallRocketActive && (
              <FlyingNavalMissile
                tier="small"
                targetX={rocketTargetPos.l}
                targetY={rocketTargetPos.t}
              />
            )}

            {/* Medium Rocket Diving Missile Animation (Diagonal Dive + Blazing Fire + Smoke Plume) */}
            {isMediumRocketActive && (
              <FlyingNavalMissile
                tier="medium"
                targetX={rocketTargetPos.l}
                targetY={rocketTargetPos.t}
              />
            )}

            {/* Large Rocket Diving Missile Animation (Diagonal Dive + Blazing Fire + Smoke Plume) */}
            {isLargeRocketActive && (
              <FlyingNavalMissile
                tier="large"
                targetX={rocketTargetPos.l}
                targetY={rocketTargetPos.t}
              />
            )}

            {/* Small Rocket Comic Cloud Explosion Exactly Matching User Reference Video */}
            {showSmallRocketExplosion && (
              <SmallRocketExplosion
                x={rocketTargetPos.l}
                y={rocketTargetPos.t}
                damage={lastRocketDamage}
                onComplete={() => setShowSmallRocketExplosion(false)}
              />
            )}

            {/* Medium Rocket Comic Cloud Explosion Exactly Matching User Reference Video */}
            {showMediumRocketExplosion && (
              <MediumRocketExplosion
                x={rocketTargetPos.l}
                y={rocketTargetPos.t}
                damage={lastRocketDamage}
                onComplete={() => setShowMediumRocketExplosion(false)}
              />
            )}

            {/* Realistic Multi-Cloud Comic Explosion Exactly Matching User Reference Video */}
            {showLargeRocketExplosion && (
              <LargeRocketExplosion
                x={rocketTargetPos.l}
                y={rocketTargetPos.t}
                damage={lastRocketDamage}
                onComplete={() => setShowLargeRocketExplosion(false)}
              />
            )}

            {/* Ad Bomb Falling Strike & Explosion */}
            {showSmokeExplosion && (
              <AdBombStrike
                x="48%"
                y="52%"
                onComplete={() => setShowSmokeExplosion(false)}
              />
            )}


            {/* Legendary Repair Sparkles Overlay */}
            {showLegendaryRepairSparkles && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(16, 185, 129, 0.25)',
                zIndex: 9999,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fade-in-out 3.5s ease-in-out forwards',
                fontFamily: 'Cairo, sans-serif'
              }}>
                {/* Huge shining aura circle in the center */}
                <div style={{
                  position: 'relative',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(52, 211, 153, 0.8) 0%, rgba(16, 185, 129, 0) 70%)',
                  boxShadow: '0 0 100px rgba(52, 211, 153, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'zoom-in-out 3s ease-out forwards'
                }}>
                  <div style={{ fontSize: '120px', filter: 'drop-shadow(0 0 20px #34d399)', animation: 'pulse 1.5s infinite' }}>👑✨</div>
                  
                  {/* Surrounding orbit rings */}
                  <div style={{
                    position: 'absolute',
                    inset: '-20px',
                    border: '3px dashed #34d399',
                    borderRadius: '50%',
                    animation: 'spin-vortex 4s linear infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '-40px',
                    border: '1.5px solid rgba(52, 211, 153, 0.4)',
                    borderRadius: '50%',
                    animation: 'spin-vortex 8s linear infinite reverse'
                  }} />
                </div>

                {/* Sparkling healing words */}
                <div style={{
                  background: 'linear-gradient(to right, #059669, #10b981, #34d399)',
                  border: '3px solid #fbbf24',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: '900',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.6)',
                  marginTop: '20px',
                  animation: 'zoom-in-out 2.5s ease-out forwards',
                  textAlign: 'center'
                }}>
                  👑 صيانة أسطورية 100% 🔧
                  <div style={{ fontSize: '13px', color: '#fef08a', marginTop: '4px', fontWeight: 'bold' }}>
                    تم إصلاح وترميم كامل الأسطول بالكامل فورياً!
                  </div>
                </div>
              </div>
            )}

            {/* Floating Companion / Sea Pet (Bottom Left) */}
            <div style={{
              position: 'absolute',
              bottom: '120px',
              left: '30px',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              {/* Spinning Magic Circle */}
              <div style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0) 70%)',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.5), inset 0 0 15px rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s infinite ease-in-out'
              }}>
                {/* Outer spinning runes/glow ring */}
                <div style={{
                  position: 'absolute',
                  inset: '-4px',
                  border: '2px dashed #06b6d4',
                  borderRadius: '50%',
                  animation: 'spin-vortex 12s linear infinite',
                  opacity: 0.7
                }} />
                
                {/* The cute Pet avatar */}
                <div style={{
                  fontSize: '44px',
                  animation: 'bounce 1.5s infinite alternate ease-in-out',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                }}>
                  👾
                </div>
              </div>
              
              {/* Pet Name tag */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #06b6d4',
                color: '#22d3ee',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '6px',
                marginTop: '6px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap'
              }}>
                مرافق الجليد الأسطوري ❄️
              </div>
            </div>
          </div>

          {/* ----------------- VISITED BUILDING MODAL (تفاصيل مبنى بيت السمك / بيت السفن للميناء المزار) ----------------- */}
          {visitedBuildingModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              fontFamily: 'Cairo, sans-serif'
            }} dir="rtl">
              <div style={{
                background: '#150d06',
                border: '3px solid #ca8a04',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '460px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.9)',
                color: '#fff',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle, rgba(202, 138, 4, 0.15) 0%, rgba(0,0,0,0.5) 70%)',
                  borderRadius: '16px',
                  border: '1px solid #ca8a04',
                  padding: '10px'
                }}>
                  <img
                    src={visitedBuildingModal.image}
                    alt={visitedBuildingModal.title}
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))'
                    }}
                  />
                </div>

                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#facc15', margin: '0 0 4px 0' }}>
                    {visitedBuildingModal.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>
                    المستوى الحالي: مستوى {visitedBuildingModal.level}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid #3c2919',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '13px',
                  color: '#cbd5e1',
                  textAlign: 'right',
                  lineHeight: '1.6'
                }}>
                  {visitedBuildingModal.details}
                  {visitedBuildingModal.capacity && (
                    <div style={{ marginTop: '8px', color: '#22c55e', fontWeight: 'bold' }}>
                      📦 السعة التخزينية: {visitedBuildingModal.capacity.toLocaleString()} سمكة
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setVisitedBuildingModal(null)}
                  style={{
                    background: 'linear-gradient(to bottom, #ca8a04, #854d0e)',
                    border: '1px solid #fef08a',
                    color: '#000',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}

          {/* ----------------- VISITED SHIP DETAILS MODAL (بوابة خيارات السفينة المحددة) ----------------- */}
          {selectedVisitedShip && !isAtomicBombActive && !showAtomicExplosion && !isLargeRocketActive && !showLargeRocketExplosion && !isMediumRocketActive && !showMediumRocketExplosion && !isSmallRocketActive && !showSmallRocketExplosion && !showSmokeExplosion && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              fontFamily: 'Cairo, sans-serif'
            }} dir="rtl">
              <div style={{
                background: '#150d06',
                border: '3px solid #ca8a04',
                borderRadius: '18px',
                padding: '26px 22px',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.95), 0 0 25px rgba(202, 138, 4, 0.3)',
                color: '#fff',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                {activeInteractionType === 'details' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto', maxHeight: '170px' }}>
                      <ShipImage level={typeof selectedVisitedShip.level === 'number' ? selectedVisitedShip.level : 0} width={220} plain={true} />
                    </div>
                    
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#facc15', margin: '0 0 6px 0', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        {selectedVisitedShip.name} (مستوى {selectedVisitedShip.level ?? 0})
                      </h3>
                      <div style={{ fontSize: '15px', color: '#cbd5e1', fontWeight: 'bold' }}>
                        المالك: القبطان @{inspectedPlayer.username}
                      </div>
                    </div>

                    {/* Specs List */}
                    <div style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1.5px solid #3c2919',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '16px',
                      color: '#f1f5f9',
                      textAlign: 'right',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>❤️ طاقة السفينة (سعة التخزين):</span>
                        {(() => {
                          const normalizedSelected = normalizeShipEnergyToCargo(selectedVisitedShip, Boolean(inspectedPlayer.portDestroyed));
                          const maxHeart = getShipMaxHeart(normalizedSelected);
                          const currentHeart = typeof normalizedSelected.heart === 'number' ? Math.min(Math.max(0, normalizedSelected.heart), maxHeart) : (inspectedPlayer.portDestroyed ? 0 : maxHeart);
                          return (
                            <span style={{ color: '#ef4444', fontWeight: '900', fontSize: '16px' }}>
                              {currentHeart.toLocaleString()} / {maxHeart.toLocaleString()}
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>⚔️ قوة تدمير المدافع:</span>
                        <span style={{ color: '#facc15', fontWeight: '900', fontSize: '16px' }}>{(selectedVisitedShip.power || 5).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📦 سعة الشحن:</span>
                        <span style={{ color: '#4ade80', fontWeight: '900', fontSize: '16px' }}>{getShipMaxHeart(selectedVisitedShip).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Attack / Shelling Action Button */}
                    {(typeof selectedVisitedShip.heart === 'number' ? selectedVisitedShip.heart > 0 : !inspectedPlayer.portDestroyed) && (
                      <button
                        onClick={() => {
                          const validation = validateAttackOrSteal();
                          if (!validation.allowed) {
                            alert(validation.message);
                            showToast(validation.message, 'error');
                            return;
                          }
                          setShowWeaponSelector(true);
                        }}
                        style={{
                          background: 'linear-gradient(to bottom, #ef4444, #b91c1c)',
                          border: '2px solid #fca5a5',
                          color: '#fff',
                          borderRadius: '12px',
                          padding: '14px 20px',
                          fontWeight: '900',
                          fontSize: '17px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 18px rgba(239, 68, 68, 0.5)',
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          animation: 'pulse 1.5s infinite'
                        }}
                      >
                        🚀 هجوم وقصف الميناء بالأسلحة
                      </button>
                    )}

                    {/* Post-Attack / Destroyed Port Actions */}
                    {Boolean(typeof selectedVisitedShip.heart === 'number' ? selectedVisitedShip.heart <= 0 : inspectedPlayer.portDestroyed) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1.5px solid #ef4444',
                          color: '#fca5a5',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '900'
                        }}>
                          🔥 تم إحراق وتدمير الأسطول والميناء بنجاح!
                        </div>
                        <button
                          onClick={() => {
                            const validation = validateAttackOrSteal();
                            if (!validation.allowed) {
                              alert(validation.message);
                              showToast(validation.message, 'error');
                              return;
                            }
                            setSelectedLootCard(null);
                            setLootResultText('');
                            setShowLootSelector(true);
                          }}
                          style={{
                            background: 'linear-gradient(to bottom, #eab308, #ca8a04)',
                            border: '2px solid #fef08a',
                            color: '#000',
                            borderRadius: '12px',
                            padding: '14px 20px',
                            fontWeight: '900',
                            fontSize: '17px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(234, 179, 8, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                          }}
                        >
                          🪙 سرقة ونهب حطام الأسطول
                        </button>
                        <button
                          onClick={() => {
                            setShowGlobalMessageModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(to bottom, #6366f1, #4f46e5)',
                            border: '1.5px solid #a5b4fc',
                            color: '#fff',
                            borderRadius: '12px',
                            padding: '12px 18px',
                            fontWeight: '900',
                            fontSize: '15px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          📢 بث رسالة عالمية عن النصر
                        </button>
                      </div>
                    )}

                    {/* Actions Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginTop: '10px'
                    }}>
                      {/* Steal Button */}
                      <button 
                        onClick={() => {
                          const validation = validateAttackOrSteal();
                          if (!validation.allowed) {
                            alert(validation.message);
                            showToast(validation.message, 'error');
                            return;
                          }
                          setActiveInteractionType('steal');
                        }}
                        style={{
                          background: 'linear-gradient(to bottom, #ca8a04, #a16207)',
                          border: '1.5px solid #fef08a',
                          color: '#000',
                          borderRadius: '12px',
                          padding: '13px',
                          fontWeight: '900',
                          fontSize: '16px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(202, 138, 4, 0.4)'
                        }}
                      >
                        سرقة وتسلل 🏴‍☠️
                      </button>

                      {/* Support Repair Button */}
                      <button 
                        onClick={() => setActiveInteractionType('repair')}
                        style={{
                          background: 'linear-gradient(to bottom, #10b981, #047857)',
                          border: '1.5px solid #6ee7b7',
                          color: '#fff',
                          borderRadius: '12px',
                          padding: '13px',
                          fontWeight: '900',
                          fontSize: '16px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        دعم وإصلاح الهيكل 🔧
                      </button>
                    </div>

                    <button 
                      onClick={() => setSelectedVisitedShip(null)}
                      style={{
                        background: '#292524',
                        border: '1.5px solid #57534e',
                        color: '#cbd5e1',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        fontWeight: '900',
                        fontSize: '16px',
                        cursor: 'pointer',
                        marginTop: '8px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                      }}
                    >
                      إغلاق
                    </button>
                  </>
                )}

                {activeInteractionType === 'steal' && (
                  <>
                    <div style={{ fontSize: '48px' }}>🏴‍☠️</div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#facc15', margin: '0 0 4px 0' }}>
                        عملية التسلل والسرقة الكبرى
                      </h3>
                      <div style={{ fontSize: '11px', color: '#a8a29e' }}>
                        مستهدفاً أسطول القبطان: @{inspectedPlayer.username}
                      </div>
                    </div>

                    {/* Step 1: Choose Own Ship */}
                    <div style={{ textAlign: 'right', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fcd34d', marginBottom: '6px' }}>1. اختر سفينتك المنفذة للغزو:</div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {ships.filter(s => s.exists).map(s => {
                          const isSelected = selectedOwnShipId === s.id;
                          const sLevel = getShipEffectiveLevel(s);
                          const isLevelValid = sLevel >= 6;
                          return (
                            <div 
                              key={s.id}
                              onClick={() => setSelectedOwnShipId(s.id)}
                              style={{
                                background: isSelected ? 'rgba(202, 138, 4, 0.25)' : 'rgba(0,0,0,0.5)',
                                border: isSelected ? '2px solid #facc15' : '1px solid #444',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                minWidth: '100px',
                                textAlign: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ fontSize: '20px' }}>{s.imgEmoji || '⛵'}</div>
                              <div style={{ fontWeight: 'bold', fontSize: '10px', color: isSelected ? '#fcd34d' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                              <div style={{ fontSize: '9px', color: isLevelValid ? '#4ade80' : '#f87171', fontWeight: 'bold', marginTop: '2px' }}>
                                مستوى {sLevel} {isLevelValid ? '✓' : '(أقل من 6)'}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ship Level Requirement Warning Banner */}
                      {(() => {
                        const curShip = ships.find(s => s.id === selectedOwnShipId);
                        const curLvl = curShip ? getShipEffectiveLevel(curShip) : 0;
                        if (curLvl < 6) {
                          return (
                            <div style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid #ef4444',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: '#fca5a5',
                              fontSize: '11px',
                              textAlign: 'center',
                              marginTop: '6px',
                              fontWeight: 'bold'
                            }}>
                              ⚠️ يجب أن تكون سفنك بمستوى 6 وما فوق لتتمكن من الهجوم أو السرقة! (مستوى هذه السفينة: {curLvl})
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Step 2: Thief Status & Target Cop Status */}
                    {(() => {
                      const hasThief = !!crewServices.thief;
                      const hasPolice = !!(inspectedPlayer.crewServices?.police || inspectedPlayer.crewServices?.cop);

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Player Thief Status */}
                          <div style={{
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid #3c2919',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            textAlign: 'right',
                            fontSize: '12px'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#fcd34d', marginBottom: '6px' }}>2. طاقم السارق (Thief):</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(202, 138, 4, 0.2)', border: '1px solid #ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                  <img src={SHIP_THIEF_ICON} alt="السارق" referrerPolicy="no-referrer" style={{ maxHeight: '32px', maxWidth: '32px', objectFit: 'contain' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  {hasThief ? (
                                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>🥷 السارق مفعّل على سفنك: يتيح لك التسلل والسرقة من أساطيل الآخرين!</span>
                                  ) : (
                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ السارق غير معين على سفنك! لا يمكنك التسلل أو السرقة من أحد إلا بعد توظيف السارق.</span>
                                  )}
                                </div>
                              </div>
                              {!hasThief && (
                                <button 
                                  onClick={() => buyCrewService('thief', 'السارق (حرامي السفن)', 30)}
                                  style={{
                                    background: '#ca8a04',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  توظيف السارق 💎 30
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Target Cop Status */}
                          <div style={{
                            background: hasPolice ? 'rgba(30, 58, 138, 0.25)' : 'rgba(0,0,0,0.3)',
                            border: hasPolice ? '1px solid #3b82f6' : '1px solid #444',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            textAlign: 'right',
                            fontSize: '11.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '20px' }}>{hasPolice ? '👮‍♂️' : '🔓'}</span>
                            <div style={{ flex: 1 }}>
                              {hasPolice ? (
                                <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>
                                  الشرطي حارس الأسطول نشط لدى @{inspectedPlayer.username}! حماية الشرطي تحبط السرقة 100% وتمنع أي سرقة.
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>
                                  القبطان المستهدف لا يمتلك شرطياً لحماية سفنه، سفنه مكشوفة للسرقة!
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Start Steal Button */}
                    <button
                      onClick={async () => {
                        // التحقق من شرط مستوى السفينة/السفن (مستوى 6 وما فوق)
                        const validation = validateAttackOrSteal(selectedOwnShipId);
                        if (!validation.allowed) {
                          alert(validation.message);
                          showToast(validation.message, 'error');
                          return;
                        }

                        const hasThief = !!crewServices.thief;
                        
                        // 1. Check if player has Thief
                        if (!hasThief) {
                          alert(`⚠️ يجب تعيين وتوظيف (السارق) على سفنك أولاً للتمكن من التسلل والسرقة من أساطيل وقراصنة الآخرين!`);
                          return;
                        }

                        const targetUid = getTargetDefenderId(inspectedPlayer);
                        const cooldownKey = `last_steal_${targetUid}`;
                        const lastSteal = localStorage.getItem(cooldownKey);
                        const now = Date.now();
                        if (lastSteal && now - parseInt(lastSteal) < 60000) {
                          alert(`⚠️ لا يمكنك سرقة هذا القبطان مجدداً إلا بعد مرور دقيقة واحدة للحماية!`);
                          return;
                        }

                        setSelectedVisitedShip(null);
                        localStorage.setItem(cooldownKey, now.toString());

                        const hasPolice = !!(inspectedPlayer.crewServices?.police || inspectedPlayer.crewServices?.cop);

                        // 2. Hard Counter: If target has Cop, theft is 100% BLOCKED ("مايقدر يسرق تسرقه")
                        if (hasPolice) {
                          sendSecureChatMessage(
                            'شرطة الميناء 👮',
                            '👮',
                            `👮 أحبط شرطي أسطول القبطان @${inspectedPlayer.username} محاولة تسلل وسرقة من قِبل لصوص القبطان @${username}! حماية الشرطي تمنع سرقة السفن تماماً.`
                          );
                          showToast(`👮‍♂️ تصدى شرطي أسطول القبطان @${inspectedPlayer.username} لمحاولة التسلل والسرقة وأحبطها بالكامل! أسطول القبطان محمي 100% بالشرطي ولا يمكن سرقته.`, 'error');
                          return;
                        }

                        // 3. Target does NOT have Cop -> Steal succeeds!
                        const targetGold = inspectedPlayer.gold || 0;
                        const maxStolen = Math.min(150000, Math.max(2000, Math.floor(targetGold * 0.15)));
                        const amount = Math.floor(2000 + Math.random() * maxStolen);
                        
                        setGold(prev => prev + amount);

                        try {
                          // Update attacker's own user document
                          if (auth.currentUser) {
                            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                              gold: gold + amount
                            });
                          }

                          // Secure collection-based dispatch to /harborEvents
                          await createHarborEvent(targetUid, 'STEAL', {
                            amount,
                            targetName: inspectedPlayer.username || ''
                          });

                          sendSecureChatMessage(
                            'السارق 🏴‍☠️',
                            '🥷',
                            `🏴‍☠️ نجحت عملية السرقة والتسلل! استولى لصوص القبطان @${username} على 🪙 ${amount.toLocaleString()} ذهبة من أسطول القبطان @${inspectedPlayer.username} لعدم وجود شرطي يحميه!`
                          );

                          showToast(`🎉 نجحت عملية السرقة والتسلل! استولى سارق أسطولك على 🪙 ${amount.toLocaleString()} ذهبة من أسطول القبطان @${inspectedPlayer.username}!`, 'success');
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      style={{
                        background: 'linear-gradient(to bottom, #ca8a04, #a16207)',
                        border: '1.5px solid #fef08a',
                        color: '#000',
                        borderRadius: '8px',
                        padding: '12px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(202, 138, 4, 0.45)',
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      🏴‍☠️ إطلاق عملية السرقة والتسلل
                    </button>

                    <button 
                      onClick={() => setActiveInteractionType('details')}
                      style={{
                        background: '#292524',
                        border: '1px solid #444',
                        color: '#cbd5e1',
                        borderRadius: '8px',
                        padding: '8px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginTop: '6px'
                      }}
                    >
                      العودة للتفاصيل
                    </button>
                  </>
                )}

                {activeInteractionType === 'repair' && (
                  <>
                    <div style={{ fontSize: '48px' }}>🔧</div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', margin: '0 0 4px 0' }}>
                        دعم وصيانة أسطول القراصنة الحلفاء
                      </h3>
                      <div style={{ fontSize: '11px', color: '#a8a29e' }}>
                        مستهدفاً سفينة القبطان: @{inspectedPlayer.username}
                      </div>
                      {(() => {
                        const normalizedSel = normalizeShipEnergyToCargo(selectedVisitedShip, Boolean(inspectedPlayer.portDestroyed));
                        const maxHeart = getShipMaxHeart(normalizedSel);
                        const currentHeart = typeof normalizedSel.heart === 'number' ? Math.min(Math.max(0, normalizedSel.heart), maxHeart) : (inspectedPlayer.portDestroyed ? 0 : maxHeart);
                        return (
                          <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>
                            ❤️ طاقة السفينة (سعة التخزين): {currentHeart.toLocaleString()} / {maxHeart.toLocaleString()}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Step 1: Choose Own Support Ship */}
                    <div style={{ textAlign: 'right', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#34d399', marginBottom: '6px' }}>1. اختر سفينتك المانحة للدعم:</div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {ships.filter(s => s.exists).map(s => {
                          const isSelected = selectedOwnShipId === s.id;
                          return (
                            <div 
                              key={s.id}
                              onClick={() => setSelectedOwnShipId(s.id)}
                              style={{
                                background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0,0,0,0.5)',
                                border: isSelected ? '2px solid #34d399' : '1px solid #444',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                minWidth: '100px',
                                textAlign: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ fontSize: '20px' }}>{s.imgEmoji || '⛵'}</div>
                              <div style={{ fontWeight: 'bold', fontSize: '10px', color: isSelected ? '#34d399' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                              <div style={{ fontSize: '9px', color: '#cbd5e1' }}>مستوى {s.level}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Choose Repairer from inventory */}
                    <div style={{ textAlign: 'right', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#34d399', marginBottom: '6px' }}>2. أرسل طاقم صيانة مجهزاً:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { key: 'repairer_small', name: 'مصلح صغير', desc: 'يرمم +25% من طاقة السفينة فوراً', power: 25, cost: 5, increment: 5, image: FIXER_SMALL_ICON },
                          { key: 'repairer_medium', name: 'مصلح وسط', desc: 'يرمم +50% من طاقة السفينة فوراً', power: 50, cost: 10, increment: 3, image: FIXER_MEDIUM_ICON },
                          { key: 'repairer_large', name: 'مصلح كبير', desc: 'يصلح سفينة واحدة بالكامل 100%', power: 100, cost: 20, increment: 2, image: FIXER_LARGE_ICON },
                          { key: 'repairer_legendary', name: 'مصلح أسطوري', desc: 'يرفع ويصلح جميع سفن الأسطول دفعة واحدة 100%', power: 100, cost: 40, increment: 1, image: FIXER_LEGENDARY_ICON }
                        ].map(rep => {
                          const count = crewServices[rep.key] || 0;
                          return (
                            <div 
                              key={rep.key}
                              style={{
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid #27272a',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {rep.image && (
                                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(6, 35, 28, 0.9) 100%)', border: '1.5px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                    <img src={rep.image} alt={rep.name} referrerPolicy="no-referrer" style={{ maxHeight: '36px', maxWidth: '36px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{rep.name} <span style={{ color: '#34d399' }}>({count} قطعة)</span></div>
                                  <div style={{ fontSize: '9.5px', color: '#a1a1aa' }}>{rep.desc}</div>
                                </div>
                              </div>
                              <div>
                                {count > 0 ? (
                                  <button
                                    onClick={async () => {
                                      const isLegendary = rep.key === 'repairer_legendary';
                                      const isLarge = rep.key === 'repairer_large';
                                      const isMedium = rep.key === 'repairer_medium';

                                      if (isLegendary) {
                                        const anyNeedsHeal = inspectedPlayer.ships.some((s: any) => {
                                          const normalizedS = normalizeShipEnergyToCargo(s, Boolean(inspectedPlayer.portDestroyed));
                                          const max = getShipMaxHeart(normalizedS);
                                          const current = typeof normalizedS.heart === 'number' ? Math.min(Math.max(0, normalizedS.heart), max) : (inspectedPlayer.portDestroyed ? 0 : max);
                                          return current < max;
                                        });
                                        if (!anyNeedsHeal) {
                                          alert(`⚠️ جميع سفن القبطان سليمة بالكامل بنسبة 100% ولا تحتاج إلى صيانة أسطورية!`);
                                          return;
                                        }
                                      } else {
                                        const normalizedSel = normalizeShipEnergyToCargo(selectedVisitedShip, Boolean(inspectedPlayer.portDestroyed));
                                        const maxHeart = getShipMaxHeart(normalizedSel);
                                        const currentHeart = typeof normalizedSel.heart === 'number' ? Math.min(Math.max(0, normalizedSel.heart), maxHeart) : (inspectedPlayer.portDestroyed ? 0 : maxHeart);
                                        if (currentHeart >= maxHeart) {
                                          alert(`⚠️ هيكل السفينة سليم بالكامل بنسبة 100% ولا يحتاج إلى صيانة وإصلاح!`);
                                          return;
                                        }
                                      }

                                      // Deduct repairer count
                                      setCrewServices(prev => {
                                        const updated = {
                                          ...prev,
                                          [rep.key]: Math.max(0, (prev[rep.key] || 0) - 1)
                                        };
                                        localStorage.setItem('pirate_crew_services', JSON.stringify(updated));
                                        return updated;
                                      });

                                      if (isLegendary) {
                                        playLegendaryRepairSound();
                                        setShowLegendaryRepairSparkles(true);
                                        setTimeout(() => {
                                          setShowLegendaryRepairSparkles(false);
                                        }, 3500);

                                        if (selectedVisitedShip) {
                                          const maxH = getShipMaxHeart(selectedVisitedShip);
                                          setSelectedVisitedShip((prev: any) => ({
                                            ...prev,
                                            maxHeart: maxH,
                                            heart: maxH,
                                            energySyncedToCargo: true
                                          }));
                                        }

                                        try {
                                          const updatedTargetShips = inspectedPlayer.ships.map((s: any) => {
                                            const normalizedS = normalizeShipEnergyToCargo(s, Boolean(inspectedPlayer.portDestroyed));
                                            const max = getShipMaxHeart(normalizedS);
                                            return {
                                              ...normalizedS,
                                              maxHeart: max,
                                              heart: max,
                                              energySyncedToCargo: true
                                            };
                                          });

                                          const targetUid = getTargetDefenderId(inspectedPlayer);
                                          if (targetUid && db) {
                                            updateDoc(doc(db, 'users', targetUid), {
                                              ships: updatedTargetShips,
                                              portDestroyed: false,
                                              updatedAt: new Date().toISOString()
                                            }).catch((err) => console.warn("Friend repair doc update failed:", err));
                                          }

                                          await createHarborEvent(targetUid, 'REPAIR', {
                                            healAmount: 999999,
                                            healPercent: 100,
                                            targetName: inspectedPlayer.username || ''
                                          });

                                          sendSecureChatMessage(
                                            'مساعد الصيانة الأسطوري 🤝',
                                            '👑',
                                            `🤝 أرسل القبطان الشهم @${username} طاقم صيانة أسطورياً وقاموا بصيانة وإصلاح كامل أسطول القبطان @${inspectedPlayer.username} بنسبة 100% بنجاح! 👑🔧`
                                          );

                                          showToast(`👑 تم إرسال المصلح الأسطوري بنجاح! تم صيانة وإصلاح كامل أسطول القبطان @${inspectedPlayer.username} بنسبة 100%! ✨🔧`, 'success');
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      } else {
                                        const normalizedSel = normalizeShipEnergyToCargo(selectedVisitedShip, Boolean(inspectedPlayer.portDestroyed));
                                        const maxHeart = getShipMaxHeart(normalizedSel);
                                        const currentHeart = typeof normalizedSel.heart === 'number' ? Math.min(Math.max(0, normalizedSel.heart), maxHeart) : (inspectedPlayer.portDestroyed ? 0 : maxHeart);
                                        const healPercent = isLarge ? 100 : (isMedium ? 50 : 25);
                                        const healAmount = isLarge ? (maxHeart - currentHeart) : calculateWeaponShipDamage(maxHeart, healPercent);

                                        const newHeart = Math.min(maxHeart, currentHeart + healAmount);

                                        setSelectedVisitedShip((prev: any) => ({
                                          ...prev,
                                          maxHeart: maxHeart,
                                          heart: newHeart,
                                          energySyncedToCargo: true
                                        }));

                                        try {
                                          const updatedTargetShips = inspectedPlayer.ships.map((s: any) => {
                                            const normalizedS = normalizeShipEnergyToCargo(s, Boolean(inspectedPlayer.portDestroyed));
                                            if (normalizedS.id === selectedVisitedShip.id) {
                                              return {
                                                ...normalizedS,
                                                maxHeart: maxHeart,
                                                heart: newHeart,
                                                energySyncedToCargo: true
                                              };
                                            }
                                            return normalizedS;
                                          });

                                          const targetUid = getTargetDefenderId(inspectedPlayer);
                                          const anyShipAlive = updatedTargetShips.some((s: any) => typeof s.heart === 'number' && s.heart > 0);
                                          if (targetUid && db) {
                                            updateDoc(doc(db, 'users', targetUid), {
                                              ships: updatedTargetShips,
                                              portDestroyed: anyShipAlive ? false : Boolean(inspectedPlayer.portDestroyed),
                                              updatedAt: new Date().toISOString()
                                            }).catch((err) => console.warn("Friend ship repair doc update failed:", err));
                                          }

                                          await createHarborEvent(targetUid, 'REPAIR', {
                                            healAmount,
                                            healPercent,
                                            targetShipId: selectedVisitedShip.id,
                                            targetName: inspectedPlayer.username || ''
                                          });

                                          sendSecureChatMessage(
                                            'دعم الأصدقاء 🤝',
                                            '🔧',
                                            `🤝 أرسل القبطان الشهم @${username} طاقم صيانة مجهزاً [${rep.name}] وقاموا بصيانة هيكل سفينة القبطان @${inspectedPlayer.username} بمقدار +${(Math.min(healAmount, maxHeart - currentHeart)).toLocaleString()} HP بنجاح!`
                                          );

                                          showToast(`🔧 تم إرسال المصلح بنجاح! تم صيانة وإصلاح هيكل سفينة القبطان @${inspectedPlayer.username} بمقدار +${(Math.min(healAmount, maxHeart - currentHeart)).toLocaleString()} HP!`, 'success');
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }
                                    }}
                                    style={{
                                      background: '#10b981',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '5px 12px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    إرسال صيانة
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => buyCrewService(rep.key, rep.name, rep.cost, rep.increment)}
                                    style={{
                                      background: '#ca8a04',
                                      color: '#000',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '5px 8px',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    شراء +{rep.increment} 💎{rep.cost}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveInteractionType('details')}
                      style={{
                        background: '#292524',
                        border: '1px solid #444',
                        color: '#cbd5e1',
                        borderRadius: '8px',
                        padding: '8px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginTop: '6px'
                      }}
                    >
                      العودة للتفاصيل
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Weapon Selector Modal */}
          {showWeaponSelector && !isAtomicBombActive && !showAtomicExplosion && !isLargeRocketActive && !showLargeRocketExplosion && !isMediumRocketActive && !showMediumRocketExplosion && !isSmallRocketActive && !showSmallRocketExplosion && !showSmokeExplosion && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 10100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl',
              fontFamily: 'Cairo, sans-serif'
            }}>
              <div style={{
                background: 'linear-gradient(to bottom, #111827, #09090b)',
                border: '3px solid #ca8a04',
                borderRadius: '18px',
                padding: '24px 20px',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.95), 0 0 25px rgba(202, 138, 4, 0.25)',
                color: '#fff',
                textAlign: 'center'
              }}>
                {/* Header containing inspected player's active ship details */}
                {(() => {
                  const rawVisitedShip = selectedVisitedShip || inspectedPlayer?.ships?.[0] || { name: 'سفينة المنتقم', level: 0 };
                  const activeVisitedShip = normalizeShipEnergyToCargo(rawVisitedShip, Boolean(inspectedPlayer?.portDestroyed));
                  const maxHeart = getShipMaxHeart(activeVisitedShip);
                  const currentHeart = typeof activeVisitedShip.heart === 'number' ? Math.min(Math.max(0, activeVisitedShip.heart), maxHeart) : (inspectedPlayer?.portDestroyed ? 0 : maxHeart);
                  const energyPct = currentHeart <= 0 ? 0 : (currentHeart >= maxHeart ? 100 : Math.max(1, Math.min(99, Math.round((currentHeart / maxHeart) * 100))));
                  return (
                    <div style={{
                      background: 'rgba(24, 24, 27, 0.9)',
                      border: '1.5px solid #3f3f46',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      marginBottom: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      direction: 'rtl'
                    }}>
                      <div style={{ textAlign: 'right' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#facc15', margin: '0 0 6px 0' }}>
                          {activeVisitedShip.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '130px',
                            height: '11px',
                            background: '#27272a',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${energyPct}%`,
                              height: '100%',
                              background: 'linear-gradient(to left, #ef4444, #f87171)'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', color: '#f87171', fontWeight: '900' }}>
                            الطاقة: {currentHeart.toLocaleString()} / {maxHeart.toLocaleString()} ❤️
                          </span>
                        </div>
                      </div>
                      <div style={{
                        background: '#14532d',
                        color: '#4ade80',
                        border: '1.5px solid #22c55e',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }} onClick={() => alert("⚓ طاقمك جاهز للإبحار والصيد في مياهه الإقليمية!")}>
                        <span style={{ fontSize: '15px' }}>⚓</span>
                        <span>تصيد في البحر</span>
                      </div>
                    </div>
                  );
                })()}

                <h4 style={{ textAlign: 'right', fontSize: '17px', color: '#f1f5f9', marginBottom: '14px', fontWeight: '900' }}>
                  🎯 اختر صاروخ من مخزنك:
                </h4>

                {/* Weapons List Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* 1. رسالة التفجير */}
                  <div 
                    onClick={() => {
                      const validation = validateAttackOrSteal();
                      if (!validation.allowed) {
                        alert(validation.message);
                        showToast(validation.message, 'error');
                        return;
                      }
                      const qty = weapons.adBomb || weapons.emp_bomb || 0;
                      if (qty <= 0) {
                        alert("❌ لا تملك هذا السلاح!");
                        return;
                      }
                      setShowWeaponSelector(false);
                      setShowAdSelectorModal(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(0,0,0,0.5) 100%)',
                      border: '2px solid #22c55e',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(34,197,94,0.15)'
                    }}
                    className="hover:bg-[rgba(34,197,94,0.25)]"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '16px', color: '#ffffff', background: 'linear-gradient(135deg, #16a34a, #15803d)', border: '2px solid #4ade80', padding: '6px 14px', borderRadius: '10px', fontWeight: '900', boxShadow: '0 0 10px rgba(74, 222, 128, 0.6)' }}>{(weapons.adBomb !== undefined ? weapons.adBomb : (weapons.emp_bomb !== undefined ? weapons.emp_bomb : 0)).toLocaleString()}x</span>
                      <div style={{
                        position: 'relative',
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid rgba(74, 222, 128, 0.6)',
                        backgroundImage: `url(${WEAPON_MEDIA_BOMB_BG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)'
                      }}>
                        <img src={WEAPON_MEDIA_BOMB_ICON} alt="رسالة التفجير" referrerPolicy="no-referrer" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))', position: 'relative', zIndex: 2 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1, paddingRight: '14px' }}>
                      <div style={{ fontSize: '17px', fontWeight: '900', color: '#4ade80' }}>رسالة التفجير</div>
                      <div style={{ fontSize: '14px', color: '#86efac', fontWeight: '900', marginTop: '2px' }}>ضرر 20,000 💥 (50 💎)</div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4', marginTop: '3px' }}>
                        إنقاص 20,000 من طاقة جميع سفن الخصم مع بث رسالة وتثبيتها
                      </div>
                    </div>
                  </div>

                  {/* 2. قنبلة الموت الأسود */}
                  <div 
                    onClick={() => {
                      const qty = weapons.atomicBomb || weapons.nuke_bomb || 0;
                      if (qty <= 0) {
                        alert("❌ لا تملك هذا السلاح الفتاك!");
                        return;
                      }
                      setShowWeaponSelector(false);
                      handleLaunchAtomicBomb();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(0,0,0,0.5) 100%)',
                      border: '2px solid #ef4444',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(239,68,68,0.15)'
                    }}
                    className="hover:bg-[rgba(239,68,68,0.25)]"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '16px', color: '#ffffff', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: '2px solid #f87171', padding: '6px 14px', borderRadius: '10px', fontWeight: '900', boxShadow: '0 0 10px rgba(248, 113, 113, 0.6)' }}>{(weapons.atomicBomb !== undefined ? weapons.atomicBomb : (weapons.nuke_bomb !== undefined ? weapons.nuke_bomb : 0)).toLocaleString()}x</span>
                      <div style={{
                        position: 'relative',
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid rgba(239, 68, 68, 0.6)',
                        backgroundImage: `url(${WEAPON_ATOMIC_BOMB_BG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)'
                      }}>
                        <img src={WEAPON_ATOMIC_BOMB_ICON} alt="قنبلة الموت الأسود" referrerPolicy="no-referrer" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))', position: 'relative', zIndex: 2 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1, paddingRight: '14px' }}>
                      <div style={{ fontSize: '17px', fontWeight: '900', color: '#fca5a5' }}>قنبلة الموت الأسود</div>
                      <div style={{ fontSize: '14px', color: '#fca5a5', fontWeight: '900', marginTop: '2px' }}>ضرر 70,000 💥 (150 💎)</div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4', marginTop: '3px' }}>
                        قنبلة فتاكة تنقص 70,000 من طاقة جميع سفن الأسطول
                      </div>
                    </div>
                  </div>

                  {/* 3. صاروخ صغير */}
                  <div 
                    onClick={() => {
                      const qty = weapons.smallRocket || weapons.small_missile || 0;
                      if (qty <= 0) {
                        alert("❌ لا تملك قذائف من هذا السلاح!");
                        return;
                      }
                      setShowWeaponSelector(false);
                      handleLaunchSmallRocket(selectedVisitedShip);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.16) 0%, rgba(24, 24, 27, 0.65) 100%)',
                      border: '2px solid rgba(234, 88, 12, 0.5)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(234, 88, 12, 0.15)'
                    }}
                    className="hover:bg-[rgba(234,88,12,0.25)] hover:border-amber-500"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '16px', color: '#ffffff', background: 'linear-gradient(135deg, #ea580c, #9a3412)', border: '2px solid #fb923c', padding: '6px 14px', borderRadius: '10px', fontWeight: '900', boxShadow: '0 0 10px rgba(251, 146, 60, 0.6)' }}>{(weapons.smallRocket !== undefined ? weapons.smallRocket : (weapons.small_missile !== undefined ? weapons.small_missile : 0)).toLocaleString()}x</span>
                      <div style={{
                        position: 'relative',
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid rgba(234, 88, 12, 0.6)',
                        backgroundImage: `url(${WEAPON_SMALL_MISSILE_BG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)'
                      }}>
                        <img src={WEAPON_SMALL_MISSILE_ICON} alt="صاروخ صغير" referrerPolicy="no-referrer" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))', position: 'relative', zIndex: 2 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1, paddingRight: '14px' }}>
                      <div style={{ fontSize: '17px', fontWeight: '900', color: '#fed7aa' }}>صاروخ صغير</div>
                      <div style={{ fontSize: '14px', color: '#facc15', fontWeight: '900', marginTop: '2px' }}>ضرر 1,000 ⚔️ (100,000 🪙)</div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4', marginTop: '3px' }}>
                        صاروخ صغير وسريع لتوجيه ضربة مباشرة بقوة 1,000
                      </div>
                    </div>
                  </div>

                  {/* 4. صاروخ المتوسط */}
                  <div 
                    onClick={() => {
                      const qty = weapons.mediumRocket || weapons.medium_missile || 0;
                      if (qty <= 0) {
                        alert("❌ لا تملك قذائف من هذا السلاح!");
                        return;
                      }
                      setShowWeaponSelector(false);
                      handleLaunchMediumRocket(selectedVisitedShip);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16) 0%, rgba(24, 24, 27, 0.65) 100%)',
                      border: '2px solid rgba(249, 115, 22, 0.5)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(249, 115, 22, 0.15)'
                    }}
                    className="hover:bg-[rgba(249,115,22,0.25)] hover:border-orange-500"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '16px', color: '#ffffff', background: 'linear-gradient(135deg, #d97706, #b45309)', border: '2px solid #fde047', padding: '6px 14px', borderRadius: '10px', fontWeight: '900', boxShadow: '0 0 10px rgba(253, 224, 71, 0.6)' }}>{(weapons.mediumRocket !== undefined ? weapons.mediumRocket : (weapons.medium_missile !== undefined ? weapons.medium_missile : 0)).toLocaleString()}x</span>
                      <div style={{
                        position: 'relative',
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid rgba(249, 115, 22, 0.6)',
                        backgroundImage: `url(${WEAPON_MEDIUM_MISSILE_BG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)'
                      }}>
                        <img src={WEAPON_MEDIUM_MISSILE_ICON} alt="صاروخ المتوسط" referrerPolicy="no-referrer" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))', position: 'relative', zIndex: 2 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1, paddingRight: '14px' }}>
                      <div style={{ fontSize: '17px', fontWeight: '900', color: '#fed7aa' }}>صاروخ المتوسط</div>
                      <div style={{ fontSize: '14px', color: '#facc15', fontWeight: '900', marginTop: '2px' }}>ضرر 5,000 ⚔️ (200,000 🪙)</div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4', marginTop: '3px' }}>
                        صاروخ متوسط القوة يخترق الدروع بقوة 5,000
                      </div>
                    </div>
                  </div>

                  {/* 5. صاروخ كبير */}
                  <div 
                    onClick={() => {
                      const qty = weapons.largeRocket || weapons.large_missile || 0;
                      if (qty <= 0) {
                        alert("❌ لا تملك قذائف من هذا السلاح!");
                        return;
                      }
                      setShowWeaponSelector(false);
                      handleLaunchLargeRocket(selectedVisitedShip);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.16) 0%, rgba(24, 24, 27, 0.65) 100%)',
                      border: '2px solid rgba(234, 179, 8, 0.5)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(234, 179, 8, 0.15)'
                    }}
                    className="hover:bg-[rgba(234,179,8,0.25)] hover:border-yellow-500"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '16px', color: '#ffffff', background: 'linear-gradient(135deg, #b45309, #78350f)', border: '2px solid #facc15', padding: '6px 14px', borderRadius: '10px', fontWeight: '900', boxShadow: '0 0 10px rgba(250, 204, 21, 0.6)' }}>{(weapons.largeRocket !== undefined ? weapons.largeRocket : (weapons.large_missile !== undefined ? weapons.large_missile : 0)).toLocaleString()}x</span>
                      <div style={{
                        position: 'relative',
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid rgba(234, 179, 8, 0.6)',
                        backgroundImage: `url(${WEAPON_LARGE_MISSILE_BG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)'
                      }}>
                        <img src={WEAPON_LARGE_MISSILE_ICON} alt="صاروخ كبير" referrerPolicy="no-referrer" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))', position: 'relative', zIndex: 2 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1, paddingRight: '14px' }}>
                      <div style={{ fontSize: '17px', fontWeight: '900', color: '#fef08a' }}>صاروخ كبير</div>
                      <div style={{ fontSize: '14px', color: '#facc15', fontWeight: '900', marginTop: '2px' }}>ضرر 10,000 💥 (300,000 🪙)</div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4', marginTop: '3px' }}>
                        صاروخ فتاك يوجه ضربة مدمرة للسفينة المستهدفة بقوة 10,000
                      </div>
                    </div>
                  </div>

                </div>

                <button 
                  onClick={() => setShowWeaponSelector(false)}
                  style={{
                    background: '#27272a',
                    border: '1.5px solid #52525b',
                    color: '#f1f5f9',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '900',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginTop: '20px',
                    width: '100%',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}
                >
                  رجوع 🔙
                </button>
              </div>
            </div>
          )}

          {/* Global Message Modal */}
          {showGlobalMessageModal && !isAtomicBombActive && !showAtomicExplosion && !isLargeRocketActive && !showLargeRocketExplosion && !isMediumRocketActive && !showMediumRocketExplosion && !isSmallRocketActive && !showSmallRocketExplosion && !showSmokeExplosion && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 10200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl',
              fontFamily: 'Cairo, sans-serif'
            }}>
              <div style={{
                background: 'linear-gradient(to bottom, #1e1b4b, #09090b)',
                border: '3px solid #a855f7',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 0 35px rgba(168, 85, 247, 0.55)',
                color: '#fff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>📢</div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#c084fc', marginBottom: '8px' }}>
                  بث رسالة عالمية في المحيط 🌐
                </h3>
                <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', lineHeight: '1.5' }}>
                  لقد دمرت الخصم للتو! يتاح لك الآن إرسال رسالة تظهر لجميع القراصنة في غرف الدردشة كشعار نصر مهيب!
                </p>

                <textarea 
                  value={globalMessageText}
                  onChange={(e) => setGlobalMessageText(e.target.value)}
                  placeholder="مثال: تم تدمير الميناء بنجاح! القوة الضاربة للقبطان تكتسح الجميع! 🏴‍☠️🔥"
                  style={{
                    width: '100%',
                    height: '90px',
                    background: '#09090b',
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px',
                    fontSize: '13px',
                    textAlign: 'right',
                    resize: 'none',
                    outline: 'none',
                    marginBottom: '16px'
                  }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={async () => {
                      if (!globalMessageText.trim()) {
                        alert("⚠️ الرجاء كتابة نص الرسالة أولاً!");
                        return;
                      }
                      try {
                        sendSecureChatMessage(
                          `إعلان نصر من @${username} 📢`,
                          '👑',
                          `👑 [رسالة عالمية] 📢 القبطان مباغتاً يعلن: "${globalMessageText}"`
                        );
                        
                        setGlobalMessageText('');
                        setShowGlobalMessageModal(false);
                        showToast("🚀 تم بث رسالتك بنجاح لجميع القراصنة!", 'success');
                      } catch(e) {
                        console.error(e);
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(to right, #a855f7, #6366f1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    بث الرسالة الآن 🌐
                  </button>

                  <button 
                    onClick={() => setShowGlobalMessageModal(false)}
                    style={{
                      background: '#27272a',
                      border: '1px solid #3f3f46',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    تخطي ❌
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Post-Detonation Custom Message Modal (إرسال رسالة للشخص الذي فجرت سفنه أو ميناءه) */}
          {postDetonationModal && postDetonationModal.isOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.88)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 10600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              <div style={{
                background: 'linear-gradient(180deg, #1f0a0a 0%, #0d0404 100%)',
                border: '3px solid #ef4444',
                borderRadius: '24px',
                padding: '24px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 0 45px rgba(239, 68, 68, 0.55), inset 0 1px 2px rgba(255,255,255,0.2)',
                color: '#fff',
                textAlign: 'center',
                position: 'relative'
              }}>
                {/* Header Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '36px', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))' }}>💥</span>
                  <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#fca5a5', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                    إرسال رسالة للقبطان المفجر أسطوله
                  </h3>
                </div>

                {/* Target Captain Info */}
                <div style={{
                  background: 'rgba(69, 10, 10, 0.6)',
                  border: '1.5px solid rgba(239, 68, 68, 0.6)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#1e293b',
                      border: '2px solid #ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      {postDetonationModal.targetPlayerAvatar || '⚓'}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '17px', fontWeight: '900', color: '#fef08a' }}>
                        القبطان: @{postDetonationModal.targetPlayerName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 'bold' }}>
                        {postDetonationModal.allDestroyed ? '🔥 تم إحراق الميناء وتدمير الأسطول كاملاً!' : '⚠️ تم إلحاق 20,000 ضرر بأسطوله!'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '26px' }}>📡</span>
                </div>

                <p style={{ fontSize: '15px', color: '#cbd5e1', marginBottom: '12px', fontWeight: 'bold', textAlign: 'right' }}>
                  اكتب رسالتك المباشرة أو تحذيرك للقبطان بعد تدمير سفنه:
                </p>

                {/* Quick Pirate Taunts */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {[
                    '🏴‍☠️ بحذرك مرة واحدة وما بعيدها أبداً!',
                    '🔱 استسلم لقوة ملوك الأعماق!',
                    '🔥 هذا مصير من يقترب من مياهي الإقليمية!',
                    '💥 رماد سفنك يغطي مياه الميناء!'
                  ].map((taunt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDetonationCustomMessage(taunt)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#475569')}
                    >
                      {taunt}
                    </button>
                  ))}
                </div>

                {/* Message Textarea */}
                <textarea
                  value={detonationCustomMessage}
                  onChange={(e) => setDetonationCustomMessage(e.target.value)}
                  placeholder="اكتب رسالتك الخاصة أو التهديد هنا..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#0a0505',
                    border: '2px solid rgba(239, 68, 68, 0.7)',
                    borderRadius: '14px',
                    color: '#fff',
                    padding: '12px 14px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'right',
                    outline: 'none',
                    resize: 'none',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
                    marginBottom: '18px',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleSendDetonationMessage}
                    disabled={isSendingDetonationMessage || !detonationCustomMessage.trim()}
                    style={{
                      flex: 2,
                      background: (!detonationCustomMessage.trim() || isSendingDetonationMessage)
                        ? '#475569'
                        : 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                      color: '#fff',
                      border: '2px solid #f87171',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      fontSize: '16px',
                      fontWeight: '900',
                      cursor: (!detonationCustomMessage.trim() || isSendingDetonationMessage) ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(220, 38, 38, 0.45)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSendingDetonationMessage ? 'جاري الإرسال...' : 'إرسال الرسالة للقبطان 🚀'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPostDetonationModal(null);
                      setDetonationCustomMessage('');
                    }}
                    disabled={isSendingDetonationMessage}
                    style={{
                      flex: 1,
                      background: '#1e293b',
                      color: '#94a3b8',
                      border: '1.5px solid #475569',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    تخطي ✖
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ad Selector Modal */}
          {showAdSelectorModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 10150,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl',
              fontFamily: 'Cairo, sans-serif'
            }}>
              <div style={{
                background: 'linear-gradient(to bottom, #09090b, #18181b)',
                border: '3px solid #22c55e',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 10px 40px rgba(34, 197, 94, 0.35)',
                color: '#fff',
                textAlign: 'center'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#4ade80', marginBottom: '8px' }}>
                  📺 اختر الفيديو الإعلاني للقنبلة الإعلانية:
                </h3>
                <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '20px' }}>
                  سيستمر الإعلان معروضاً على محيط المحيط الهادئ للخصم لمدة ساعة كاملة مع تشغيل التأثير الصوتي الملحمي!
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                  {/* 1. تنين الأعماق */}
                  <div 
                    onClick={() => handleLaunchAdBomb('deep_dragon')}
                    style={{
                      background: '#1e293b',
                      border: '1.5px solid #38bdf8',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: '#38bdf8',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>🦎</span>
                    <span>تنين الأعماق</span>
                  </div>

                  {/* 2. لوفي ملك القراصنة */}
                  <div 
                    onClick={() => handleLaunchAdBomb('luffy_king')}
                    style={{
                      background: '#1c1917',
                      border: '1.5px solid #facc15',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: '#facc15',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>☠️</span>
                    <span>لوفي ملك القراصنة 🏴‍☠️</span>
                  </div>

                  {/* 3. فخامة لوفي */}
                  <div 
                    onClick={() => handleLaunchAdBomb('luffy_grandeur')}
                    style={{
                      background: '#2d0606',
                      border: '1.5px solid #f97316',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: '#f97316',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>🔥</span>
                    <span>فخامة لوفي</span>
                  </div>

                  {/* 4. وإذا سطا خاف الأنام */}
                  <div 
                    onClick={() => handleLaunchAdBomb('anf')}
                    style={{
                      background: '#2e1065',
                      border: '1.5px solid #c084fc',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: '#c084fc',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>👑</span>
                    <span>وإذا سطا خاف الأنام</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowAdSelectorModal(false);
                    setShowWeaponSelector(true);
                  }}
                  style={{
                    background: '#27272a',
                    border: '1px solid #3f3f46',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  رجوع 🔙
                </button>
              </div>
            </div>
          )}

          {/* Loot Selector Modal */}
          {showLootSelector && !isAtomicBombActive && !showAtomicExplosion && !isLargeRocketActive && !showLargeRocketExplosion && !isMediumRocketActive && !showMediumRocketExplosion && !isSmallRocketActive && !showSmallRocketExplosion && !showSmokeExplosion && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.92)',
              zIndex: 10200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              direction: 'rtl',
              fontFamily: 'Cairo, sans-serif'
            }}>
              <div style={{
                background: 'linear-gradient(to bottom, #1e1b4b, #0f0b29)', // Deep mysterious purplish-blue pirate cave color
                border: '3px solid #eab308',
                borderRadius: '20px',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 25px 60px rgba(234, 179, 8, 0.25)',
                color: '#fff',
                textAlign: 'center',
                position: 'relative'
              }}>
                {/* Close button */}
                <button 
                  onClick={() => setShowLootSelector(false)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '18px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>

                <span style={{ fontSize: '48px', animation: 'bounce 1s infinite' }}>🪙</span>
                <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#fbbf24', margin: '8px 0 4px 0' }}>
                  سرقة ونهب حطام الأسطول
                </h3>
                <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '24px' }}>
                  اختر إحدى السفن المدمرة لنهب محتويات خزينتها وحمولتها المتبقية!
                </p>

                {/* Three cards styled exactly like the video at 0:04 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {[1, 2, 3].map((cardId) => {
                    const isSelected = selectedLootCard === cardId;
                    const isAnySelected = selectedLootCard !== null;

                    return (
                      <div
                        key={cardId}
                        onClick={async () => {
                          if (isAnySelected) return;
                          
                          // Perform loot calculations
                          setSelectedLootCard(cardId);
                          
                          const rand = Math.random();
                          let result = '';
                          let amt = 0;
                          
                          const targetUid = getTargetDefenderId(inspectedPlayer);
                          if (rand < 0.7) {
                            // Gold
                            amt = Math.floor(2500 + Math.random() * 12500);
                            setGold(prev => prev + amt);
                            result = `🪙 +${amt.toLocaleString()} ذهبة`;
                            
                            try {
                              if (auth.currentUser) {
                                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                                  gold: gold + amt
                                });
                              }
                              await createHarborEvent(targetUid, 'LOOT', {
                                lootType: 'gold',
                                amount: amt,
                                targetName: inspectedPlayer.username || ''
                              });
                            } catch (e) { console.error(e); }
                          } else if (rand < 0.9) {
                            // Blue Gems
                            amt = Math.floor(5 + Math.random() * 20);
                            setGems(prev => prev + amt);
                            result = `💎 +${amt} جوهرة`;

                            try {
                              if (auth.currentUser) {
                                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                                  gems: gems + amt
                                });
                              }
                              await createHarborEvent(targetUid, 'LOOT', {
                                lootType: 'gems',
                                amount: amt,
                                targetName: inspectedPlayer.username || ''
                              });
                            } catch (e) { console.error(e); }
                          } else {
                            // Red Gems
                            amt = Math.floor(2 + Math.random() * 10);
                            setRedGems(prev => prev + amt);
                            result = `🔴 +${amt} جوهرة حمراء`;

                            try {
                              if (auth.currentUser) {
                                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                                  redGems: redGems + amt
                                });
                              }
                              await createHarborEvent(targetUid, 'LOOT', {
                                lootType: 'redGems',
                                amount: amt,
                                targetName: inspectedPlayer.username || ''
                              });
                            } catch (e) { console.error(e); }
                          }

                          setLootResultText(result);

                          // Play sound effect using shared AudioContext
                          try {
                            const ctx = getAudioContext();
                            if (ctx) {
                              if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); }
                              const osc = ctx.createOscillator();
                              const gain = ctx.createGain();
                              osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                              osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
                              osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.2); // D6
                              gain.gain.setValueAtTime(0.15, ctx.currentTime);
                              gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                              osc.connect(gain);
                              gain.connect(ctx.destination);
                              osc.start();
                              osc.stop(ctx.currentTime + 0.4);
                            }
                          } catch (err) {}
                        }}
                        style={{
                          width: '110px',
                          height: '160px',
                          background: isSelected 
                            ? 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)' // Green win background
                            : 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
                          border: isSelected 
                            ? '3.5px solid #10b981'
                            : '2.5px solid #eab308',
                          borderRadius: '16px',
                          cursor: isAnySelected ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px',
                          position: 'relative',
                          boxShadow: isSelected 
                            ? '0 0 20px #10b981' 
                            : '0 8px 16px rgba(0,0,0,0.4)',
                          transform: isSelected ? 'scale(1.05)' : 'none',
                          transition: 'transform 0.3s ease, background 0.3s ease, border-color 0.3s ease',
                          opacity: isAnySelected && !isSelected ? 0.45 : 1
                        }}
                      >
                        {!isSelected ? (
                          <>
                            {/* Red shield/ship crest from video */}
                            <div style={{
                              width: '64px',
                              height: '84px',
                              background: 'radial-gradient(circle, #dc2626 0%, #7f1d1d 100%)',
                              border: '2px solid #fbbf24',
                              borderRadius: '10px',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                            }}>
                              ⛵
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fef08a', marginTop: '10px' }}>سفينة غامضة</span>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: '40px', animation: 'bounce 0.5s infinite alternate' }}>🎁</div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>تم النهب!</span>
                            <span style={{ fontSize: '13px', fontWeight: '900', color: '#fef08a', marginTop: '4px', textAlign: 'center' }}>
                              {lootResultText}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedLootCard !== null && (
                  <button 
                    onClick={() => setShowLootSelector(false)}
                    style={{
                      background: 'linear-gradient(to bottom, #f59e0b, #d97706)',
                      border: '1.5px solid #fef08a',
                      color: '#000',
                      borderRadius: '10px',
                      padding: '12px 24px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      width: '100%',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                      animation: 'pulse 1.5s infinite'
                    }}
                  >
                    تأكيد الغنائم والعودة ⚔️
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- REPORTS TAB (مركز التنبيهات والسرقات والقتال) ----------------- */}
      {activeTab === 'reports' && (
        <div className="tab-overlay">
          <div className="tab-title">
            <span>🔔 مركز التنبيهات (القصف والسرقات والقتال)</span>
            <button className="close-tab-btn" onClick={() => setActiveTab('harbor')}>إغلاق</button>
          </div>
          <p style={{ fontSize: '12.5px', color: '#ffffff', marginBottom: '14px', lineHeight: '1.6' }}>
            سجل الهجمات والقصف والغارات ومحاولات التسلل أو السرقة التي تعرضت لها، بالإضافة لنتائج معاركك السابقة!
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button 
              onClick={() => {
                if (window.confirm("🗑️ هل أنت متأكد من مسح جميع التنبيهات والتقارير؟")) {
                  setBattleReports([]);
                }
              }}
              style={{ flex: 1, background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
            >
              🗑️ مسح جميع التنبيهات والتقارير
            </button>
          </div>

          {battleReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#cbd5e1', background: '#1c1917', borderRadius: '12px', border: '1.5px dashed #444' }}>
              🔔 لا توجد أي تنبيهات أو بلاغات حالياً. ميناؤك البحري آمن ومستقر!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
              {battleReports.map(report => {
                // Determine if this is a theft/raid alert or a standard battle
                const isRaid = report.id?.includes('raid');
                const isSecure = report.id?.includes('secure');
                const isPvPDefense = report.log && report.log[0] && (report.log[0].includes('غزو مباغت') || report.log[0].includes('نصر دفاعي'));
                
                let alertColor = 'rgba(22, 163, 74, 0.1)';
                let alertBorder = '1px solid #16a34a';
                let typeBadge = '🏆 معركة ناجحة';
                
                if (isRaid) {
                  alertColor = 'rgba(239, 68, 68, 0.15)';
                  alertBorder = '2px solid #ef4444';
                  typeBadge = '🏴‍☠️ تسلل وسرقة ذهب!';
                } else if (isSecure) {
                  alertColor = 'rgba(59, 130, 246, 0.15)';
                  alertBorder = '2px solid #3b82f6';
                  typeBadge = '🛡️ إحباط سرقة';
                } else if (isPvPDefense) {
                  if (report.isVictory) {
                    alertColor = 'rgba(16, 185, 129, 0.15)';
                    alertBorder = '1px solid #10b981';
                    typeBadge = '🛡️ دفاع ناجح ضد غزو';
                  } else {
                    alertColor = 'rgba(220, 38, 38, 0.2)';
                    alertBorder = '2px dashed #ef4444';
                    typeBadge = '💥 قصف وتدمير الميناء!';
                  }
                } else {
                  alertColor = report.isVictory ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)';
                  alertBorder = report.isVictory ? '1px solid #16a34a' : '1px solid #dc2626';
                  typeBadge = report.isVictory ? '🏆 غزوة ناجحة' : '💀 معركة خاسرة';
                }

                return (
                  <div 
                    key={report.id} 
                    onClick={() => setActiveReport(report)}
                    style={{ 
                      background: alertColor, 
                      border: alertBorder, 
                      padding: '12px', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    className="report-item-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '26px' }}>{report.opponentAvatar || '🔔'}</span>
                      <div>
                        <div style={{ fontWeight: 'black', fontSize: '13px', color: '#fff' }}>{report.opponentName}</div>
                        <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>التوقيت: {report.time}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '9px', background: report.isVictory ? '#16a34a' : '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {typeBadge}
                      </span>
                      {report.goldChange !== 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: report.goldChange > 0 ? '#22c55e' : '#ef4444' }}>
                          {report.goldChange > 0 ? `+${report.goldChange}` : report.goldChange} 🪙
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------- QUESTS MENU DRAWER ----------------- */}
      {activeTab === 'harbor' && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: '2.5%',
          width: questsExpanded ? '210px' : '40px',
          height: questsExpanded ? 'auto' : '40px',
          background: 'rgba(15, 12, 9, 0.95)',
          border: '2px solid #ca8a04',
          borderRadius: '8px',
          padding: questsExpanded ? '8px' : '0',
          zIndex: 10,
          color: '#fff',
          fontSize: '11px',
          maxHeight: questsExpanded ? '240px' : '40px',
          overflowY: questsExpanded ? 'auto' : 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: questsExpanded ? 'stretch' : 'center',
          justifyContent: questsExpanded ? 'flex-start' : 'center',
          cursor: questsExpanded ? 'default' : 'pointer',
          boxShadow: '0 8px 16px rgba(0,0,0,0.6)',
        }} 
        onClick={() => { if (!questsExpanded) setQuestsExpanded(true); }}
        dir="rtl"
        title={questsExpanded ? "" : "فتح المهمات اليومية"}
        >
          {questsExpanded ? (
            <>
              <div style={{ fontWeight: 'bold', color: '#facc15', borderBottom: '1px solid #ca8a04', paddingBottom: '3px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎯 المهمات اليومية</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setQuestsExpanded(false); }} 
                  style={{ background: 'transparent', border: 'none', color: '#ca8a04', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', padding: '0 4px' }}
                  title="تصغير"
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {quests.map(q => (
                  <div key={q.id} style={{ background: '#292524', padding: '5px', borderRadius: '4px', border: '1px solid #57534e' }}>
                    <div style={{ fontWeight: 'bold', color: '#fef08a' }}>{q.title}</div>
                    <div style={{ color: '#ffffff', fontSize: '9.5px', fontWeight: 'bold' }}>{q.target}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                      <span>{q.progress}/{q.max}</span>
                      {q.completed && !q.claimed && (
                        <button 
                          onClick={() => claimQuestReward(q.id, q.rewardGold, q.rewardGems)}
                          style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', cursor: 'pointer', fontWeight: 'bold' }}>
                          اجمع
                        </button>
                      )}
                      {q.claimed && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>تم ✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>🎯</span>
          )}
        </div>
      )}

      {/* ----------------- TAVERN / CREW RECRUITMENT MODAL ----------------- */}
      <CrewTavernModal
        isOpen={crewModal}
        onClose={() => setCrewModal(false)}
        gold={gold}
        setGold={setGold}
        gems={gems}
        setGems={setGems}
        crewServices={crewServices}
        setCrewServices={setCrewServices}
        ships={ships}
        setShips={setShips}
        currentShipId={currentShipId}
        onSelectShip={setCurrentShipId}
        buyCrewService={buyCrewService}
        unassignCrewFromShip={unassignCrewFromShip}
        unassignCrewFromAllShips={unassignCrewFromAllShips}
        assignCrewToAllShips={assignCrewToAllShips}
        crewInventory={crewInventory}
        onToggleAutoFishing={toggleAutoFishing}
      />

      {/* ----------------- VIEW REPORT DETAILED MODAL ----------------- */}
      {activeReport && (
        <div className="tab-overlay" style={{ zIndex: 110, maxWidth: '450px', margin: '0 auto' }}>
          <div className="tab-title">
            <span>📜 تفاصيل تقرير المعركة</span>
            <button className="close-tab-btn" onClick={() => setActiveReport(null)}>إغلاق</button>
          </div>
          <div style={{ background: '#1c1917', border: '1px solid #ca8a04', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '40px' }}>{activeReport.opponentAvatar}</div>
              <h3 style={{ margin: '4px 0', color: '#facc15' }}>معركة ضد: {activeReport.opponentName}</h3>
              <span style={{ fontSize: '10px', background: activeReport.isVictory ? '#16a34a' : '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                {activeReport.isVictory ? 'نصر ساحق 🏆' : 'هزيمة 💀'}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #292524', paddingTop: '8px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', color: '#ca8a04' }}>💰 الغنائم الحربية:</div>
              <div>الذهب: <span style={{ color: '#facc15' }}>+{activeReport.goldChange} ذهب</span></div>
              <div>الجواهر: <span style={{ color: '#60a5fa' }}>+{activeReport.gemsChange} جواهر</span></div>
              <div>الخبرة: <span style={{ color: '#10b981' }}>+{activeReport.expGained} XP</span></div>
            </div>

            <div style={{ fontWeight: 'bold', color: '#ca8a04' }}>📝 مجريات المعركة بالتفصيل:</div>
            <div style={{ background: '#0a0806', border: '1px solid #78350f', padding: '6px', borderRadius: '4px', maxHeight: '120px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '10px' }}>
              {activeReport.log.map((line, idx) => (
                <div key={idx} style={{ color: '#fff', borderBottom: '1px solid #1a1510', paddingBottom: '2px', marginTop: '2px' }}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SHIP WORKSHOP & RESTORATION MODAL (ورشة ملوك الأعماق) ----------------- */}
      {repairModalShip && (
        <ShipWorkshopModal
          ship={ships.find(s => s.id === repairModalShip.id) || repairModalShip}
          allShips={ships}
          crewServices={crewServices}
          onClose={() => setRepairModalShip(null)}
          onRepair={handleRepairShip}
          onSelectShip={(selected) => setRepairModalShip(selected)}
          gold={gold}
          gems={gems}
        />
      )}

      {/* ----------------- CONFIRM SELL MODAL ----------------- */}
      {confirmModal && (
        <div id="confirm-modal" className="modal" style={{ display: 'block' }}>
          <div style={{ fontSize: '24px' }}>⚓</div>
          <h3>بيع السفينة</h3>
          <p style={{ fontSize: '11.5px', color: '#ffffff', fontWeight: 'bold' }}>هل أنت متأكد من بيع هذه السفينة لصالح ميناء ملوك الأعماق؟</p>
          <div style={{ margin: '10px 0', fontWeight: 'bold', color: '#fcd34d' }}>+ 250 ذهب</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setConfirmModal(false)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '5px', background: '#444', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>إلغاء</button>
            <button onClick={confirmSell} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '5px', background: '#ca8a04', color: '#000', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>تأكيد</button>
          </div>
        </div>
      )}

      {/* ----------------- REWARD COLLECT MODAL ----------------- */}
      {rewardModal && (
        <div id="reward-modal" className="modal" style={{ display: 'block' }}>
          <div style={{ fontSize: '11px', marginBottom: '3px' }}>نتيجة رحلة الصيد بنجاح</div>
          {getFishImageUrl(rewardFish.name, rewardFish.shipLevel) ? (
            <div
              style={{
                width: '210px',
                height: '124px',
                margin: '8px auto',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(56,189,248,0.24) 0%, rgba(15,23,42,0.85) 85%)',
                border: '1px solid rgba(56,189,248,0.35)',
                padding: '8px'
              }}
            >
              <img
                src={getFishImageUrl(rewardFish.name, rewardFish.shipLevel)}
                alt={rewardFish.name}
                style={{
                  width: '188px',
                  height: '108px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.92)) drop-shadow(0 0 8px rgba(186,230,253,0.38)) contrast(1.08) saturate(1.1)'
                }}
              />
            </div>
          ) : (
            <div style={{ fontSize: '46px' }}>{getFishEmoji(rewardFish.name)}</div>
          )}
          <h3 style={{ fontSize: '14px', color: '#facc15', margin: '4px 0' }}>{rewardFish.name}</h3>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fcd34d' }}>{rewardFish.amount?.toLocaleString()}x سمكة</div>
          {rewardFish.luckDoubled && (
            <div style={{ margin: '6px 0', padding: '4px 10px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', borderRadius: '6px', color: '#86efac', fontSize: '11px', fontWeight: 'bold' }}>
              🍀 الحظ السعيد: تم مضاعفة صيد السفينة 2x بنجاح!
            </div>
          )}
          {rewardFish.guided && (
            <div style={{ margin: '6px 0', padding: '6px 12px', background: 'rgba(56, 189, 248, 0.25)', border: '1px solid #38bdf8', borderRadius: '8px', color: '#7dd3fc', fontSize: '11.5px', fontWeight: 'bold' }}>
              🧭 مرشد السفينة: صيد متوقع ومضمون بنجاح [{rewardFish.name}] بدقة 100%!
            </div>
          )}
          <div style={{ margin: '6px 0', fontWeight: 'bold', color: '#38bdf8', fontSize: '12px' }}>📦 تمت إضافة الأسماك إلى بيت السمك لبيعها!</div>
          <button onClick={() => setRewardModal(false)} style={{ width: '100%', padding: '8px', marginTop: '8px', border: 'none', borderRadius: '5px', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>موافق</button>
        </div>
      )}

      {/* ----------------- EXPECTED FISH SELECTOR MODAL (مرشد السفينة) ----------------- */}
      {expectedFishModalShipId && (() => {
        const targetShip = ships.find(s => s.id === expectedFishModalShipId);
        if (!targetShip) return null;
        const shipFishes = targetShip.fishTypes && targetShip.fishTypes.length > 0 
          ? targetShip.fishTypes 
          : ['السردين'];
        const currentTarget = targetShip.expectedFish || shipFishes[shipFishes.length - 1];

        return (
          <div
            className="fixed inset-0 z-[145] flex items-center justify-center bg-black/75 backdrop-blur-sm p-5 overflow-y-auto"
            dir="rtl"
            onClick={() => setExpectedFishModalShipId(null)}
          >
            <div 
              style={{ 
                width: '100%',
                maxWidth: '780px', 
                margin: 'auto',
                background: 'linear-gradient(180deg, rgba(11, 24, 44, 0.99) 0%, rgba(5, 10, 22, 0.99) 100%)',
                border: '2px solid #38bdf8',
                boxShadow: '0 24px 60px rgba(0,0,0,0.92), 0 0 36px rgba(56, 189, 248, 0.35)',
                borderRadius: '24px',
                padding: '24px 26px',
                color: '#ffffff'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid rgba(56, 189, 248, 0.4)', paddingBottom: '16px', marginBottom: '18px', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    border: '1.5px solid rgba(56, 189, 248, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '38px',
                    flexShrink: 0
                  }}>
                    🧭
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, fontSize: '28px', color: '#e0f2fe', fontWeight: '900', lineHeight: 1.25 }}>
                      مرشد السفينة: تحديد الصيد المتوقع
                    </h3>
                    <div style={{ fontSize: '20px', color: '#fbbf24', fontWeight: '800', marginTop: '4px' }}>
                      {targetShip.name} (المستوى {targetShip.level || 1})
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setExpectedFishModalShipId(null)}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: '#1e293b',
                    border: '2px solid #64748b',
                    color: '#ffffff',
                    fontSize: '26px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Explanatory Info Card */}
              <div style={{
                background: 'rgba(14, 165, 233, 0.14)',
                border: '1.5px solid rgba(56, 189, 248, 0.45)',
                borderRadius: '14px',
                padding: '14px 18px',
                marginBottom: '18px',
                fontSize: '20px',
                color: '#f1f5f9',
                fontWeight: '700',
                lineHeight: 1.55,
                textAlign: 'right'
              }}>
                <span style={{ fontSize: '24px', marginLeft: '6px' }}>🎯</span>
                <strong style={{ color: '#7dd3fc', fontWeight: '900' }}>توجيه المرشد:</strong> اختر نوع السمك الذي ترغب أن تتوقعه وتصطاده هذه السفينة في جميع رحلاتها بدقة 100%:
              </div>

              {/* Fish List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '54vh', overflowY: 'auto', paddingLeft: '4px' }}>
                {shipFishes.map((fishName, idx) => {
                  const subFishInfo = getSubmarineFishInfo(typeof targetShip.level === 'number' ? targetShip.level : undefined);
                  const isSelected = currentTarget === fishName;
                  const emoji = subFishInfo?.emoji || getFishEmoji(fishName);
                  const info = FISH_REWARD_DATA[fishName] || FISH_REWARD_DATA[fishName.replace(/^ال/, '').trim()];
                  const priceLabel = subFishInfo ? subFishInfo.priceLabel : (info?.valPerFish !== undefined ? `${info.valPerFish}` : undefined);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setShipExpectedFish(targetShip.id, fishName);
                        setExpectedFishModalShipId(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        padding: '16px 20px',
                        borderRadius: '18px',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #facc15' : '1.5px solid rgba(56, 189, 248, 0.35)',
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(202, 138, 4, 0.28) 0%, rgba(16, 185, 129, 0.22) 100%)' 
                          : 'rgba(15, 23, 42, 0.85)',
                        boxShadow: isSelected ? '0 0 18px rgba(250, 204, 21, 0.32)' : '0 4px 12px rgba(0,0,0,0.35)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {(subFishInfo?.image || getFishImageUrl(fishName, typeof targetShip.level === 'number' ? targetShip.level : undefined)) ? (
                          <div
                            style={{
                              width: '150px',
                              height: '96px',
                              borderRadius: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'radial-gradient(circle, rgba(56,189,248,0.24) 0%, rgba(2,6,23,0.82) 85%)',
                              border: '1.5px solid rgba(56,189,248,0.4)',
                              padding: '6px',
                              flexShrink: 0
                            }}
                          >
                            <img
                              src={subFishInfo?.image || getFishImageUrl(fishName, typeof targetShip.level === 'number' ? targetShip.level : undefined)}
                              alt={fishName}
                              style={{
                                width: '136px',
                                height: '84px',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.92)) drop-shadow(0 0 6px rgba(186,230,253,0.35)) contrast(1.08) saturate(1.1)'
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: '96px',
                              height: '96px',
                              borderRadius: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(2,6,23,0.8) 85%)',
                              border: '1.5px solid rgba(56,189,248,0.35)',
                              fontSize: '54px',
                              flexShrink: 0
                            }}
                          >
                            {emoji}
                          </div>
                        )}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '25px', fontWeight: '900', color: isSelected ? '#fef08a' : '#ffffff', lineHeight: 1.3 }}>
                            {fishName}
                          </div>
                          {priceLabel !== undefined && (
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fcd34d', marginTop: '4px' }}>
                              قيمة السمكة: {priceLabel} 🪙 ذهب
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        {isSelected ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            border: '1.5px solid #4ade80',
                            color: '#ffffff',
                            fontSize: '19px',
                            fontWeight: '900',
                            padding: '10px 18px',
                            borderRadius: '12px',
                            whiteSpace: 'nowrap'
                          }}>
                            ✔️ متوقع حالياً
                          </span>
                        ) : (
                          <button
                            type="button"
                            style={{
                              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                              color: '#ffffff',
                              border: '2px solid #7dd3fc',
                              fontSize: '20px',
                              fontWeight: '900',
                              padding: '10px 22px',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            تحديد 🎯
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                type="button"
                onClick={() => setExpectedFishModalShipId(null)}
                style={{
                  width: '100%',
                  marginTop: '18px',
                  padding: '14px 24px',
                  borderRadius: '14px',
                  border: '1.5px solid #64748b',
                  background: '#334155',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        );
      })()}

      {/* ----------------- FISH STORAGE MODAL (بيت السمك) ----------------- */}
      {fishStorageModal && (
        <FishHouseComponent 
          userLevel={fishStorageLevel} 
          gold={gold}
          gems={gems}
          redGems={redGems}
          fishInventory={fishInventory}
          onClose={() => setFishStorageModal(false)}
          onUpgrade={async () => {
            if (!isNetworkOnline()) {
              notifyOfflineBlocked('ترقية بيت السمك');
              return;
            }
            const cost = fishStorageLevel * 500;
            if (fishStorageLevel >= 31) {
              alert('لقد وصلت للحد الأقصى من المستويات (المستوى 31)! السعة القصوى 24,000,000.');
              return;
            }
            if (gold < cost) {
              alert(`الذهب غير كافٍ! تحتاج إلى ${cost.toLocaleString()} 🪙 ذهب لترقية بيت السمك إلى المستوى ${fishStorageLevel + 1}.`);
              return;
            }

            const nextLevel = fishStorageLevel + 1;
            const res = await executeFinancialTransaction({
              goldDelta: -cost,
              fishStorageLevel: nextLevel,
              reason: `ترقية بيت السمك إلى المستوى ${nextLevel}`,
              onLocalApply: () => {
                setGold(prev => prev - cost);
                setFishStorageLevel(nextLevel);
              }
            });

            if (res.success) {
              if (typeof res.newGold === 'number') {
                setGold(res.newGold);
              }
              setFishStorageLevel(nextLevel);
              window.dispatchEvent(new CustomEvent('spawn-pirate-particles', {
                detail: { x: window.innerWidth / 2, y: window.innerHeight / 2, type: 'gold-gain', count: 25 }
              }));
              alert(`🎉 تم ترقية بيت السمك بنجاح إلى المستوى ${nextLevel} عبر المعاملة الذرية!`);
            }
          }}
          onSellFish={async (fishName, amount, totalEarned) => {
            if (!isNetworkOnline()) {
              notifyOfflineBlocked(`بيع سمك ${fishName}`);
              return;
            }

            const currentCount = fishInventory[fishName] || 0;
            const newCount = Math.max(0, currentCount - amount);
            const nextInv = { ...fishInventory };
            if (newCount > 0) {
              nextInv[fishName] = newCount;
            } else {
              delete nextInv[fishName];
            }

            const res = await executeFinancialTransaction({
              goldDelta: totalEarned,
              fishInventory: nextInv,
              reason: `بيع ${amount.toLocaleString()} من سمك ${fishName}`,
              onLocalApply: () => {
                setFishInventory(nextInv);
                setGold(prev => prev + totalEarned);
                localStorage.setItem('pirate_fish_inventory', JSON.stringify(nextInv));
              }
            });

            if (res.success) {
              if (typeof res.newGold === 'number') {
                setGold(res.newGold);
              }
              setFishInventory(nextInv);
              localStorage.setItem('pirate_fish_inventory', JSON.stringify(nextInv));
              window.dispatchEvent(new CustomEvent('spawn-pirate-particles', {
                detail: { x: window.innerWidth / 2, y: window.innerHeight / 2, type: 'gold-gain', count: 30 }
              }));
            }
          }}
          onSellAllFish={async (totalEarned) => {
            if (!isNetworkOnline()) {
              notifyOfflineBlocked('بيع كل الأسماك');
              return;
            }

            const emptyInv: Record<string, number> = {};
            const res = await executeFinancialTransaction({
              goldDelta: totalEarned,
              fishInventory: emptyInv,
              reason: `بيع كل الأسماك بالمخزن بمبلغ ${totalEarned.toLocaleString()} ذهب`,
              onLocalApply: () => {
                setFishInventory(emptyInv);
                setGold(prev => prev + totalEarned);
                localStorage.setItem('pirate_fish_inventory', JSON.stringify(emptyInv));
              }
            });

            if (res.success) {
              if (typeof res.newGold === 'number') {
                setGold(res.newGold);
              }
              setFishInventory(emptyInv);
              localStorage.setItem('pirate_fish_inventory', JSON.stringify(emptyInv));
              window.dispatchEvent(new CustomEvent('spawn-pirate-particles', {
                detail: { x: window.innerWidth / 2, y: window.innerHeight / 2, type: 'gold-gain', count: 40 }
              }));
            }
          }}
        />
      )}

      {/* ----------------- SHIP SELECTION ACTION MENU ----------------- */}
      {menu.visible && (() => {
        const activeShip = ships.find(s => s.id === (currentShipId || menu.shipId));
        const shipStatus = activeShip?.status || menu.status;
        const timerState = activeShip ? getShipFishingTimerState(activeShip, timerNow) : null;
        const isFishingActive = shipStatus !== 'docked' && timerState && !timerState.isAutoFishing && timerState.remainingMs > 0;
        const isReadyToCollect = shipStatus !== 'docked' && Boolean(timerState?.isReady);
        const gemCost = isFishingActive && timerState ? getSpeedUpGemCost(timerState.remainingMs) : 0;

        const handleFishingAction = () => {
          if (shipStatus === 'docked') {
            act('fish');
          } else if (isReadyToCollect) {
            act('collect');
          } else if (isFishingActive && activeShip) {
            setMenu(prev => ({ ...prev, visible: false }));
            speedUpShipFishing(activeShip.id);
          } else {
            act('collect');
          }
        };

        return (
          <div
            className="fixed inset-0 z-[135] flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
            onClick={(e) => {
              e.stopPropagation();
              setMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <div
              id="ship-menu"
              ref={shipMenuRef}
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                display: 'block',
                background: 'transparent',
                border: 'none',
                padding: 0,
                width: '100%',
                maxWidth: '420px',
                aspectRatio: '1080 / 970',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(0,0,0,0.92), 0 0 32px rgba(34, 211, 238, 0.25)',
                userSelect: 'none',
              }}
            >
              <img
                src="/assets/ship_menu_card.jpg"
                alt="خيارات السفينة"
                className="w-full h-full object-fill block pointer-events-none"
              />

              {/* 1. الذهاب للصيد / إرجاع الصيد */}
              <button
                type="button"
                aria-label={shipStatus !== 'docked' ? 'إرجاع الصيد' : 'الذهاب للصيد'}
                onClick={handleFishingAction}
                className="absolute cursor-pointer bg-transparent hover:bg-cyan-300/10 active:bg-cyan-300/20 active:scale-[0.985] transition-all rounded-xl"
                style={{ top: '15.5%', height: '17.5%', left: '18%', width: '64%' }}
              >
                {shipStatus !== 'docked' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '19%',
                      bottom: '19%',
                      left: '26.5%',
                      right: '25.5%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(180deg, #1b3f4b 0%, #14323d 52%, #0e252e 100%)',
                      boxShadow: '0 0 8px 4px #14323d',
                      borderRadius: '6px',
                      color: isReadyToCollect ? '#fef08a' : '#eaf4f7',
                      fontSize: 'clamp(19px, 5.8vw, 25px)',
                      fontWeight: '900',
                      fontFamily: 'Cairo, sans-serif',
                      textShadow: '0 2px 5px rgba(0,0,0,0.95), 0 0 10px rgba(56,189,248,0.35)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    إرجاع الصيد
                  </span>
                )}
                {isReadyToCollect && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-600 border border-emerald-300 text-white text-[11px] font-black shadow-md whitespace-nowrap z-10">
                    🪣 جاهز للجمع ✅
                  </span>
                )}
                {isFishingActive && timerState && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-sky-900/95 border border-sky-300 text-sky-100 text-[11px] font-black shadow-md whitespace-nowrap z-10">
                    ⏳ {formatFishingCountdown(timerState.remainingMs)} • ⚡💎 {gemCost}
                  </span>
                )}
              </button>

              {/* 2. إصلاح */}
              <button
                type="button"
                aria-label="إصلاح"
                onClick={() => act('repair')}
                className="absolute cursor-pointer bg-transparent hover:bg-amber-300/10 active:bg-amber-300/20 active:scale-[0.985] transition-all rounded-xl"
                style={{ top: '35.5%', height: '17.5%', left: '18%', width: '64%' }}
              />

              {/* 3. تفاصيل السفينة */}
              <button
                type="button"
                aria-label="تفاصيل السفينة"
                onClick={() => {
                  const targetId = activeShip?.id || currentShipId || menu.shipId;
                  setMenu(prev => ({ ...prev, visible: false }));
                  if (targetId) {
                    setCurrentShipId(targetId);
                    setShipDetailsModalShipId(targetId);
                  }
                }}
                className="absolute cursor-pointer bg-transparent hover:bg-emerald-300/10 active:bg-emerald-300/20 active:scale-[0.985] transition-all rounded-xl"
                style={{ top: '54.5%', height: '17.5%', left: '18%', width: '64%' }}
              />

              {/* 4. إلغاء */}
              <button
                type="button"
                aria-label="إلغاء"
                onClick={() => setMenu(prev => ({ ...prev, visible: false }))}
                className="absolute cursor-pointer bg-transparent hover:bg-rose-400/10 active:bg-rose-400/20 active:scale-[0.985] transition-all rounded-xl"
                style={{ top: '74.0%', height: '17.5%', left: '18%', width: '64%' }}
              />
            </div>
          </div>
        );
      })()}

      {/* ----------------- SHIP DETAILS MODAL (تفاصيل السفينة) ----------------- */}
      {shipDetailsModalShipId && (() => {
        const detailShip = ships.find(s => s.id === shipDetailsModalShipId);
        if (!detailShip) return null;
        const shipLvl = typeof detailShip.level === 'number' ? detailShip.level : 0;
        const shipSpec = SHOP_SHIPS.find(sp => sp.level === shipLvl);
        const maxH = getShipMaxHeart(detailShip);
        const curH = typeof detailShip.heart === 'number' ? Math.max(0, Math.min(detailShip.heart, maxH)) : (portDestroyed ? 0 : maxH);
        const subFishInfo = getSubmarineFishInfo(shipLvl);
        const fishList = detailShip.fishTypes && detailShip.fishTypes.length > 0 ? detailShip.fishTypes : (shipSpec?.fishTypes || ['سردين']);
        const hasGH = Boolean(detailShip.assignedCrew?.some(c => c === 'golden_hunter' || c === 'gold_fisher'));
        const hasGuide = Boolean(detailShip.assignedCrew?.includes('guide'));
        const isSellFullWidth = hasGuide === hasGH;

        return (
          <div
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
            dir="rtl"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShipDetailsModalShipId(null);
            }}
          >
            <div
              className="w-full max-w-[760px] my-auto rounded-3xl border-2 border-cyan-400/80 bg-[#071324] text-white shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #0b1c33 0%, #050c18 100%)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.92), 0 0 36px rgba(6,182,212,0.32)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 sm:px-7 py-4 sm:py-5 border-b border-cyan-500/35 bg-[#0a192e]">
                <div className="flex items-center gap-3.5">
                  <span className="text-4xl">⚓</span>
                  <div>
                    <h3 className="text-[28px] sm:text-[32px] leading-tight font-black text-cyan-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                      {detailShip.name}
                    </h3>
                    <div className="text-[19px] sm:text-[21px] font-extrabold text-amber-300 mt-0.5">
                      {shipLvl >= 32
                        ? `غواصة الأعماق (${getSubmarineDisplayTier(shipLvl)})`
                        : `المستوى ${shipLvl}`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShipDetailsModalShipId(null)}
                  className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 border-2 border-slate-500 flex items-center justify-center text-white text-2xl font-black cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Ship Preview + Key Stats */}
                <div className="flex flex-col sm:flex-row items-center gap-5 bg-[#06101e] border border-cyan-700/70 rounded-2xl p-4 sm:p-5">
                  <div className="shrink-0">
                    <ShipImage level={shipLvl} width={205} plain />
                  </div>
                  <div className="flex-1 w-full grid grid-cols-2 gap-3.5">
                    <div className="bg-[#0b182c] border border-slate-600/80 rounded-2xl p-3.5 text-center">
                      <div className="text-slate-200 font-extrabold text-[19px] sm:text-[20px]">السعة</div>
                      <div className="text-sky-300 font-black text-[24px] sm:text-[26px] mt-1 tabular-nums whitespace-nowrap">
                        {(detailShip.cargo || shipSpec?.cargo || 2000).toLocaleString('en-US')}
                      </div>
                    </div>
                    <div className="bg-[#0b182c] border border-slate-600/80 rounded-2xl p-3.5 text-center">
                      <div className="text-slate-200 font-extrabold text-[19px] sm:text-[20px]">الطاقة</div>
                      <div dir="ltr" className="text-emerald-300 font-black text-[23px] sm:text-[25px] mt-1 tabular-nums whitespace-nowrap">
                        {curH.toLocaleString('en-US')} / {maxH.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div className="bg-[#0b182c] border border-slate-600/80 rounded-2xl p-3.5 text-center">
                      <div className="text-slate-200 font-extrabold text-[19px] sm:text-[20px]">قوة الصيد</div>
                      <div className="text-amber-300 font-black text-[24px] sm:text-[26px] mt-1 tabular-nums whitespace-nowrap">
                        {(detailShip.hook || shipSpec?.hook || 25).toLocaleString('en-US')}
                      </div>
                    </div>
                    <div className="bg-[#0b182c] border border-slate-600/80 rounded-2xl p-3.5 text-center">
                      <div className="text-slate-200 font-extrabold text-[19px] sm:text-[20px]">مدة الرحلة</div>
                      <div className="text-cyan-200 font-black text-[24px] sm:text-[26px] mt-1 tabular-nums whitespace-nowrap">
                        {formatFishingCountdown(getShipFishingDurationMs(detailShip))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fish Types & Prices */}
                <div className="bg-[#06101e] border border-cyan-700/60 rounded-2xl p-4 sm:p-5">
                  <div className="text-[20px] sm:text-[22px] font-black text-amber-300 mb-3.5">
                    🐟 أنواع السمك التي تصطادها السفينة:
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {fishList.map((fName, idx) => {
                      const fImg = subFishInfo?.image || getFishImageUrl(fName, shipLvl);
                      const fPrice = subFishInfo
                        ? subFishInfo.priceLabel
                        : `${FISH_REWARD_DATA[fName]?.valPerFish ?? FISH_REWARD_DATA[fName.replace(/^ال/, '').trim()]?.valPerFish ?? 1} ذهب`;
                      return (
                        <div
                          key={idx}
                          className="flex-1 min-w-[220px] flex items-center gap-3.5 bg-[#0c1a30] border-2 border-cyan-500/45 rounded-2xl p-3.5"
                        >
                          {fImg ? (
                            <img src={fImg} alt={fName} className="w-20 h-14 object-contain shrink-0" />
                          ) : (
                            <span className="text-4xl shrink-0">{subFishInfo?.emoji || getFishEmoji(fName)}</span>
                          )}
                          <div>
                            <div className="text-[21px] sm:text-[22px] font-black text-white leading-snug">{fName}</div>
                            <div className="text-[19px] sm:text-[20px] font-extrabold text-amber-300 mt-0.5">{fPrice} 🪙</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ship Management Quick Actions */}
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentShipId(detailShip.id);
                      setShipDetailsModalShipId(null);
                      setCrewModal(true);
                    }}
                    className="py-4 px-5 rounded-2xl bg-sky-900/80 hover:bg-sky-800/90 border-2 border-sky-400/75 text-white font-black text-[21px] sm:text-[23px] shadow-lg cursor-pointer transition-all"
                  >
                    👥 الطاقم
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShipDetailsModalShipId(null);
                      setRepairModalShip(detailShip);
                    }}
                    className="py-4 px-5 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800/90 border-2 border-emerald-400/75 text-white font-black text-[21px] sm:text-[23px] shadow-lg cursor-pointer transition-all"
                  >
                    🔧 الصيانة والإصلاح
                  </button>

                  {hasGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        setShipDetailsModalShipId(null);
                        setExpectedFishModalShipId(detailShip.id);
                      }}
                      className="py-4 px-5 rounded-2xl bg-indigo-900/80 hover:bg-indigo-800/90 border-2 border-indigo-400/75 text-white font-black text-[21px] sm:text-[23px] shadow-lg cursor-pointer transition-all"
                    >
                      🧭 تحديد الصيد المتوقع
                    </button>
                  )}

                  {hasGH && (
                    <button
                      type="button"
                      onClick={() => {
                        toggleAutoFishing(detailShip.id);
                      }}
                      className={`py-4 px-5 rounded-2xl border-2 font-black text-[21px] sm:text-[23px] shadow-lg cursor-pointer transition-all ${
                        detailShip.autoFishingPaused
                          ? 'bg-emerald-800/85 border-emerald-400 text-white'
                          : 'bg-amber-800/85 border-amber-400 text-white'
                      }`}
                    >
                      {detailShip.autoFishingPaused ? '▶️ تشغيل الصيد التلقائي' : '⏸️ إيقاف الصيد التلقائي'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentShipId(detailShip.id);
                      setShipDetailsModalShipId(null);
                      setConfirmModal(true);
                    }}
                    className={`${isSellFullWidth ? 'col-span-2 ' : ''}py-4 px-5 rounded-2xl bg-rose-950/90 hover:bg-rose-900/90 border-2 border-rose-500/75 text-rose-100 font-black text-[21px] sm:text-[23px] shadow-lg cursor-pointer transition-all`}
                  >
                    💰 بيع السفينة
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ----------------- TOP BAR / RESOURCES HUD ----------------- */}
      <TopBarHud
        gold={gold}
        gems={gems}
        fishCount={getTotalFish()}
        level={Math.max(1, Math.floor(Math.sqrt(exp || 0) / 10) + 1)}
        avatar={avatar}
        useCustomAvatarFrame={useCustomAvatarFrame}
        ships={ships}
        portDestroyed={portDestroyed}
        unavengedAlertsCount={attackLogs.filter(a => !a.isAvenged).length + supportGifts.filter(g => !g.claimed).length}
        isOnline={isOnline}
        onOpenProfile={() => setShowProfileAvatarModal(true)}
        onOpenShop={() => setActiveTab('shop')}
        onOpenFishStorage={() => {
          if (portDestroyed) {
            alert("⚠️ بيت السمك تعرض للقصف والاحتراق الشديد! أعد إعمار الميناء والأسطول لترميم المنشآت.");
            return;
          }
          setFishStorageModal(true);
        }}
        onOpenWarLog={() => setShowWarLogModal(true)}
        onClickShipSlot={(shipId) => {
          if (shipId && !portDestroyed) {
            setShipDetailsModalShipId(shipId);
          } else {
            setActiveTab('warehouse');
          }
        }}
        onClickOfflineBanner={() =>
          setOfflineNotice('⚠️ انقطع الاتصال بالإنترنت! تم تجميد العمليات المالية مؤقتاً لحماية رصيدك وأصولك ومنع حدوث تضارب في البيانات.')
        }
      />

      <ProfileAvatarModal
        isOpen={showProfileAvatarModal}
        currentAvatar={avatar}
        useCustomAvatarFrame={useCustomAvatarFrame}
        username={username}
        pirateClass={pirateClass}
        level={Math.max(1, Math.floor(Math.sqrt(exp || 0) / 10) + 1)}
        googlePhotoUrl={auth.currentUser?.photoURL || localStorage.getItem('google_auth_avatar')}
        onSelectAvatar={(nextAvatar, isCustom) => {
          setAvatar(nextAvatar);
          setUseCustomAvatarFrame(isCustom);
          if (isCustom) {
            localStorage.setItem('pirate_custom_avatar_chosen', 'true');
          } else {
            localStorage.removeItem('pirate_custom_avatar_chosen');
          }
        }}
        onClose={() => setShowProfileAvatarModal(false)}
      />

      {/* ----------------- OFFLINE FINANCIAL NOTICE BANNER ----------------- */}
      {offlineNotice && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          maxWidth: '92%',
          width: '460px',
          background: 'linear-gradient(135deg, #1e1b4b, #2b0b1e)',
          border: '2px solid #ef4444',
          borderRadius: '16px',
          boxShadow: '0 12px 35px rgba(239, 68, 68, 0.45), 0 0 25px rgba(0,0,0,0.85)',
          padding: '16px 20px',
          color: '#fff',
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>📡❌</span>
              <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fca5a5' }}>
                تنبيه أمان العمليات المالية
              </span>
            </div>
            <button
              onClick={() => setOfflineNotice(null)}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                color: '#cbd5e1',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#f1f5f9' }}>
            {offlineNotice}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11.5px',
            color: '#fde047'
          }}>
            <span>🔒 أمان المعاملات الذرية (Firebase Transactions)</span>
            <span style={{ color: !isOnline ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
              {!isOnline ? 'مفصول حالياً' : 'متصل'}
            </span>
          </div>
        </div>
      )}





      {/* ----------------- WEATHER ANNOUNCEMENT BANNER ----------------- */}
      {weatherNotify && activeTab === 'harbor' && (
        <div style={{
          position: 'fixed',
          top: '125px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 105,
          background: 'linear-gradient(to bottom, #1c1917, #0c0a09)',
          border: '2px solid #eab308',
          borderRadius: '8px',
          padding: '10px 20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 10px rgba(234, 179, 8, 0.2)',
          color: '#fef08a',
          fontWeight: 'bold',
          fontSize: '12.5px',
          textAlign: 'center',
          animation: 'fade-in-slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          direction: 'rtl',
          fontFamily: '"Cairo", sans-serif',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          {weatherNotify}
        </div>
      )}



      {portDestroyed && activeTab === 'harbor' && (
        <div style={{
          position: 'fixed',
          top: '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          background: 'rgba(28, 15, 10, 0.96)',
          border: '2px solid #ef4444',
          borderRadius: '16px',
          padding: '16px 20px',
          width: '92%',
          maxWidth: '460px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.9), 0 0 25px rgba(239, 68, 68, 0.5)',
          textAlign: 'center',
          fontFamily: '"Cairo", sans-serif',
          direction: 'rtl',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#fca5a5', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🚨</span>
            <span>تحذير عاجل: تم تدمير وإحراق مينائك بالكامل!</span>
            <span>🔥</span>
          </div>
          <div style={{ fontSize: '12px', color: '#fed7aa', marginBottom: '14px', lineHeight: '1.5' }}>
            لقد تعرض ميناؤك البحري لقصف ناري مدمّر؛ احترقت المنشآت وتفحمت سفن أسطولك بالكامل وغرقت في مياه الميناء. أعد إعمار الميناء وترميم هياكل السفن لتبحر مجدداً!
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={async () => {
                const REBUILD_COST_GEMS = 200;
                if (gems < REBUILD_COST_GEMS) {
                  alert(`❌ لا تملك جواهر كافية! تكلفة إعادة إعمار الميناء وترميم الأسطول هي ${REBUILD_COST_GEMS} 💎 جوهرة.\nرصيدك الحالي: ${gems.toLocaleString()} 💎`);
                  return;
                }

                const newGems = Math.max(0, gems - REBUILD_COST_GEMS);
                setGems(newGems);
                localStorage.setItem('gems', newGems.toString());

                setPortDestroyed(false);
                localStorage.setItem('pirate_port_destroyed', 'false');

                const restoredShips = ships.map(s => {
                  const maxH = getShipMaxHeart(s);
                  return {
                    ...s,
                    maxHeart: maxH,
                    heart: maxH,
                    energySyncedToCargo: true,
                    status: 'docked' as const,
                    moving: false
                  };
                });
                setShips(restoredShips);
                localStorage.setItem('pirate_ships', JSON.stringify(restoredShips));

                // Cancel any pending auto-save to avoid race conditions
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current);
                }

                // Synchronize lastDbData immediately
                if (lastDbData.current) {
                  lastDbData.current = {
                    ...lastDbData.current,
                    portDestroyed: false,
                    ships: restoredShips,
                    gems: newGems
                  };
                }

                // Explicit direct persistence to Firestore
                if (auth.currentUser) {
                  try {
                    const userDocRef = doc(db, 'users', auth.currentUser.uid);
                    await setDoc(userDocRef, {
                      portDestroyed: false,
                      ships: restoredShips,
                      gems: newGems,
                      updatedAt: new Date().toISOString()
                    }, { merge: true });
                  } catch (e) {
                    console.error("Error rebuilding port in Firestore:", e);
                  }
                }

                alert(`🎉 تم إعادة إعمار الميناء وصيانة كافة سفن الأسطول بنجاح! تم خصم ${REBUILD_COST_GEMS} 💎 جوهرة، وأسطولك جاهز للإبحار.`);
              }}
              style={{
                background: 'linear-gradient(to bottom, #22c55e, #15803d)',
                color: '#fff',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '900',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
              }}
            >
              <span>🏗️</span>
              <span>إعادة إعمار الميناء وترميم الأسطول (💎 200 جوهرة)</span>
            </button>
          </div>
        </div>
      )}

      {/* Partial Ship Destruction Alert Banner (when port is intact but ships are destroyed/damaged) */}
      {!portDestroyed && ships.some(s => s.exists && typeof s.heart === 'number' && s.heart <= 0) && activeTab === 'harbor' && (
        <div style={{
          position: 'fixed',
          top: '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          background: 'rgba(28, 15, 10, 0.96)',
          border: '2px solid #f97316',
          borderRadius: '16px',
          padding: '12px 18px',
          width: '92%',
          maxWidth: '460px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.9), 0 0 20px rgba(249, 115, 22, 0.4)',
          textAlign: 'center',
          fontFamily: '"Cairo", sans-serif',
          direction: 'rtl',
          animation: 'pulse 2.2s infinite'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#fed7aa', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>تنبيه عاجل: تعرضت بعض سفنك للتدمير والاحتراق!</span>
            <span>🔥</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginBottom: '10px', lineHeight: '1.5' }}>
            استهدفت نيران المعارك هيكل سفينتك حتى تفحم وعجز عن الإبحار والصيد. توجه لصيانتها وترميمها فوراً.
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                const destroyedShip = ships.find(s => s.exists && typeof s.heart === 'number' && s.heart <= 0);
                if (destroyedShip) {
                  setRepairModalShip(destroyedShip);
                }
              }}
              style={{
                background: 'linear-gradient(to bottom, #16a34a, #15803d)',
                color: '#fff',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '8px 18px',
                fontWeight: '900',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(22, 163, 74, 0.4)'
              }}
            >
              <span>🔧</span>
              <span>فتح ورشة صيانة وترميم السفن</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- BOTTOM NAV TABS ----------------- */}
      <div className="bottom-nav">
        {/* 1. قبيلة (Tribe) */}
        <div className={`nav-item nav-item-clan ${activeTab === 'tribes' ? 'active' : ''}`} onClick={() => setActiveTab('tribes')} title="قبيلة">
          <img 
            src="https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/clan.png" 
            alt="قبيلة" 
          />
        </div>

        {/* 2. ترتيب (Leaderboard) */}
        <div className={`nav-item nav-item-rank ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')} title="ترتيب">
          <img 
            src="https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/rank.png" 
            alt="ترتيب" 
          />
        </div>

        {/* 3. أصدقاء (Friends) */}
        <div className={`nav-item nav-item-friends ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')} title="أصدقاء">
          <img 
            src="https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/friends.png" 
            alt="أصدقاء" 
          />
        </div>

        {/* 4. مخزن (Storage / Inventory) */}
        <div className={`nav-item nav-item-storage ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')} title="مخزن">
          <img 
            src="https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/storage.png" 
            alt="مخزن" 
          />
        </div>

        {/* 5. متجر (Shop) */}
        <div className={`nav-item nav-item-shop ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')} title="متجر">
          <img 
            src="https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/shop.png" 
            alt="متجر" 
          />
        </div>

        {/* 6. شات (Chat) */}
        <div className={`nav-item nav-item-chat ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')} title="شات">
          <img 
            src="https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/chat.png" 
            alt="شات" 
          />
        </div>

        {/* 7. إعدادات (Settings) */}
        <div className={`nav-item nav-item-settings ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title="إعدادات">
          <img 
            src="https://raw.githubusercontent.com/alwjyhnyazsrhan-blip/my-game-assets/refs/heads/main/settings.png" 
            alt="إعدادات" 
          />
        </div>
      </div>

      {showSubmarineUpgradeModal && (
        <SubmarineUpgradeModal
          ships={ships}
          setShips={setShips}
          gold={gold}
          setGold={setGold}
          initialShipId={upgradeSubmarineShipId}
          onClose={() => setShowSubmarineUpgradeModal(false)}
        />
      )}

      {/* ----------------- CHOOSE SHIP TO UPGRADE MODAL (3-SHIP LIMIT) ----------------- */}
      {upgradeTargetSpec && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Cairo, sans-serif'
        }} dir="rtl">
          <div style={{
            background: '#1c120c',
            border: '3px solid #facc15',
            borderRadius: '24px',
            padding: '28px 20px',
            maxWidth: '560px',
            width: '95%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(234, 179, 8, 0.2)',
            textAlign: 'center',
            color: '#e2e8f0'
          }}>
            <h3 style={{ color: '#facc15', margin: '0 0 12px 0', fontSize: '24px', fontWeight: '900' }}>
              ⚓ ترقية أسطول السفن (أقصى حد: 3 سفن)
            </h3>
            <p style={{ fontSize: '15px', color: '#cbd5e1', marginBottom: '22px', lineHeight: '1.7' }}>
              لقد اخترت شراء/ترقية سفينة إلى <strong style={{ color: '#fde047', fontSize: '16px' }}>{upgradeTargetSpec.name} (ليفل {upgradeTargetSpec.level})</strong>.
              <br />
              الرجاء تحديد إحدى سفنك الثلاث لتنزيل أو ترقية سفينتك فيها:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {ships.slice(0, 3).map((ship) => {
                const isAlreadyThisLevel = ship.exists && ship.level === upgradeTargetSpec.level;
                return (
                  <button
                    key={ship.id}
                    onClick={() => {
                      if (isAlreadyThisLevel) {
                        alert('⚠️ هذا القارب يمتلك نفس هذا المستوى بالفعل! يرجى اختيار إحدى سفنك الأخرى لتنزيل هذا المستوى عليها، حيث يمكنك امتلاك حتى 3 سفن بنفس المستوى.');
                        return;
                      }
                      confirmUpgradeShip(ship.id, upgradeTargetSpec);
                    }}
                    style={{
                      background: isAlreadyThisLevel 
                        ? 'rgba(30, 41, 59, 0.7)'
                        : ship.exists 
                          ? 'linear-gradient(to bottom, #2d1808, #180d05)'
                          : 'linear-gradient(to bottom, #1e1b4b, #0f172a)',
                      border: isAlreadyThisLevel 
                        ? '2px solid #475569'
                        : ship.exists ? '2px solid #eab308' : '2px dashed #38bdf8',
                      borderRadius: '16px',
                      padding: '16px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: isAlreadyThisLevel ? 'not-allowed' : 'pointer',
                      opacity: isAlreadyThisLevel ? 0.75 : 1,
                      transition: 'all 0.2s',
                      textAlign: 'right',
                      width: '100%',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '32px' }}>{ship.exists ? (ship.imgEmoji || '⛵') : '➕'}</span>
                      <div>
                        <div style={{ color: isAlreadyThisLevel ? '#94a3b8' : ship.exists ? '#fff' : '#38bdf8', fontWeight: '900', fontSize: '16px' }}>
                          {ship.exists ? ship.name : 'مكان فارغ (سفينة مباعة)'}
                          {isAlreadyThisLevel && <span style={{ color: '#f59e0b', fontSize: '12px', marginRight: '6px' }}>(بهذا المستوى بالفعل ✔)</span>}
                        </div>
                        <div style={{ color: isAlreadyThisLevel ? '#eab308' : '#94a3b8', fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                          {isAlreadyThisLevel 
                            ? `هذه السفينة في المستوى ${ship.level} بالفعل - اختر سفينة أخرى لامتلاك أكثر من سفينة بنفس المستوى`
                            : ship.exists ? `المستوى الحالي: ${ship.level} ➔ سيصبح: ${upgradeTargetSpec.level}` : 'انقر لشراء وتنزيل السفينة هنا'}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: isAlreadyThisLevel ? '#334155' : ship.exists ? '#16a34a' : '#0284c7',
                      color: isAlreadyThisLevel ? '#94a3b8' : '#fff',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '900',
                      boxShadow: isAlreadyThisLevel ? 'none' : ship.exists ? '0 3px 6px rgba(22, 163, 74, 0.4)' : '0 3px 6px rgba(2, 132, 199, 0.4)'
                    }}>
                      {isAlreadyThisLevel ? 'مملوك بالفعل ✔' : ship.exists ? 'ترقية هذه السفينة ⚡' : 'شراء وتنزيل هنا ➕'}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setUpgradeTargetSpec(null)}
              style={{
                background: '#334155',
                color: '#fff',
                border: '1px solid #475569',
                borderRadius: '12px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '900',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}
            >
              إلغاء العملية
            </button>
          </div>
        </div>
      )}

      {/* Persistent Interactive Defender Incoming Attack Alert Card */}
      {incomingAttackAlert && (
        <div
          style={{
            position: 'fixed',
            bottom: '175px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            width: '92%',
            maxWidth: '520px',
            background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.97) 0%, rgba(24, 24, 27, 0.98) 100%)',
            border: '3px solid #ef4444',
            borderRadius: '18px',
            padding: '14px 16px',
            boxShadow: '0 10px 35px rgba(239, 68, 68, 0.55), 0 0 0 2px rgba(250, 204, 21, 0.35)',
            direction: 'rtl',
            fontFamily: 'Cairo, sans-serif',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '30px' }}>{incomingAttackAlert.weaponIcon}</span>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#fca5a5' }}>
                  🚨 {incomingAttackAlert.weaponTitle}
                </div>
                <div style={{ fontSize: '12px', color: '#fef08a', fontWeight: 'bold' }}>
                  المهاجم: @{incomingAttackAlert.attackerName} • {incomingAttackAlert.time}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIncomingAttackAlert(null)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid #52525b',
                color: '#e4e4e7',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              إغلاق ✖
            </button>
          </div>

          <div style={{ fontSize: '14px', color: '#f4f4f5', fontWeight: 'bold', marginBottom: incomingAttackAlert.customMessage ? '6px' : '12px' }}>
            {incomingAttackAlert.summary}
          </div>

          {incomingAttackAlert.customMessage && (
            <div style={{
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid #eab308',
              borderRadius: '10px',
              padding: '8px 10px',
              fontSize: '13px',
              color: '#fde047',
              marginBottom: '12px'
            }}>
              💬 "{incomingAttackAlert.customMessage}"
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleRevenge(incomingAttackAlert.attackerName, 'atk_' + incomingAttackAlert.id, incomingAttackAlert.attackerId)}
              style={{
                flex: 1,
                background: 'linear-gradient(to bottom, #dc2626, #991b1b)',
                border: '1.5px solid #fca5a5',
                color: '#fff',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              ⚡ رد الهجوم فوراً
            </button>
            <button
              onClick={() => {
                setActiveTab('harbor');
                setInspectedPlayerShipVisit(false);
                setInspectedPlayer(null);
                setShowWarLogModal(false);
                setIncomingAttackAlert(null);
              }}
              style={{
                background: 'linear-gradient(to bottom, #0284c7, #0369a1)',
                border: '1.5px solid #7dd3fc',
                color: '#fff',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              👁️ الميناء
            </button>
          </div>
        </div>
      )}

      {/* Global Incoming Combat Screen Flash across all tabs */}
      {incomingCombatFlash && (
        <div
          className="harbor-combat-layer"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9995,
            pointerEvents: 'none',
            boxShadow: 'inset 0 0 85px 18px rgba(239, 68, 68, 0.72)',
            border: '4px solid rgba(248, 113, 113, 0.85)',
            animation: 'fade-in-scale 0.25s ease-out'
          }}
        />
      )}

      {/* Global Toast Notification across all tabs */}
      {settingsToast && (
        <div
          className="harbor-combat-layer"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            background: settingsToast.type === 'success'
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : settingsToast.type === 'info' || settingsToast.type === 'warning'
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '13px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 10px rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fade-in-scale 0.25s ease-out',
            direction: 'rtl'
          }}
        >
          <span>{settingsToast.type === 'success' ? '✅' : settingsToast.type === 'info' || settingsToast.type === 'warning' ? '⚠️' : '❌'}</span>
          <span>{settingsToast.message}</span>
        </div>
      )}

      {/* Global In-Game Real-time Event Notification / Toast Banner */}
      <InGameNotificationBanner
        notification={currentNotification}
        onDismiss={handleDismissNotification}
        isSoundEnabled={!isSfxMuted && !isMuted}
        onToggleSound={handleToggleNotifSound}
        onRevenge={handleRevenge}
        onOpenWarLog={() => setShowWarLogModal(true)}
        onApproveTribeJoinById={handleApproveTribeJoinById}
        onRejectTribeJoinById={handleRejectTribeJoinById}
        onAcceptTribeInviteById={handleAcceptTribeInviteById}
        onDeclineTribeInviteById={handleDeclineTribeInviteById}
      />

      {/* War & Revenge Log Modal (سجل الغارات والانتقام والدعوم) */}
      {showWarLogModal && (
        <WarLogModal
          onClose={() => setShowWarLogModal(false)}
          onRevenge={handleRevenge}
          onClaimGift={handleClaimGift}
          battleReports={battleReports}
          attackLogs={attackLogs}
          supportGifts={supportGifts}
          onClearLogs={handleClearLogs}
          tribeJoinRequests={incomingTribeJoinRequests}
          onApproveTribeJoin={handleApproveTribeJoin}
          onRejectTribeJoin={handleRejectTribeJoin}
          tribeInvitations={incomingTribeInvitations}
          onAcceptTribeInvite={handleAcceptTribeInvite}
          onDeclineTribeInvite={handleDeclineTribeInvite}
        />
      )}
    </div>
  );
}
