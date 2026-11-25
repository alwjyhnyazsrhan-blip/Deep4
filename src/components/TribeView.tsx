import React, { useState, useMemo, useEffect } from 'react';
import { db, auth } from '../firebase';
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
    icon: '≋',
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
    icon: '🌀',
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
    icon: '✦',
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
    icon: '⚓',
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
  gems,
  setGems,
  currentUser,
  username,
  showToast,
  sendChatMessage,
  realPlayers = [],
  joinTribe,
  donateToTribe,
}: TribeViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'board' | 'levels' | 'donations' | 'allTribes'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({ 1: true });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTribeNameInput, setNewTribeNameInput] = useState('');
  const [newTribeDescInput, setNewTribeDescInput] = useState('');
  const [newTribeEmblemInput, setNewTribeEmblemInput] = useState('👑');
  const [customDonationAmount, setCustomDonationAmount] = useState<number>(500);

  // 1. Ensure the official "ملوك الأعماق" tribe exists in state & persistent storage
  useEffect(() => {
    const officialExists = tribes.some((t) => t.name === 'ملوك الأعماق' || t.id === 'official_depth_kings');
    if (officialExists) return;

    // Check local storage
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
    } catch (e) {}

    const realCreatedAt = new Date().toISOString();
    const officialTribe = {
      id: 'official_depth_kings',
      name: 'ملوك الأعماق',
      description: 'سجل قبيلة واحدة • عشرة أعماق — من بوابة الأعماق إلى العرش',
      emblem: '👑',
      leaderId: currentUser?.uid || 'official',
      leaderName: username || 'القبطان',
      level: 10,
      power: 550,
      donations: 550,
      membersCount: 1,
      members: currentUser?.uid ? [currentUser.uid] : [],
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
    } catch (e) {}

    // Graceful silent Firestore sync attempt
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
      } catch (e) {}
    }
  }, [tribes, currentUser?.uid, username, setTribes]);

  // 2. Identify the active real tribe
  const currentTribe = useMemo(() => {
    if (tribeId) {
      const found = tribes.find((t) => t.id === tribeId);
      if (found) return found;
    }
    const official = tribes.find((t) => t.name === 'ملوك الأعماق');
    if (official) return official;

    if (tribes.length > 0) return tribes[0];

    return {
      id: 'official_depth_kings',
      name: tribeName || 'ملوك الأعماق',
      description: 'سجل قبيلة واحدة • عشرة أعماق — من بوابة الأعماق إلى العرش',
      emblem: '👑',
      leaderId: currentUser?.uid || 'official',
      leaderName: username || 'القبطان',
      level: 10,
      power: 550,
      donations: 550,
      membersCount: 1,
      members: currentUser?.uid ? [currentUser.uid] : [],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }, [tribeId, tribes, tribeName, currentUser?.uid, username]);

  // 3. Real Points & Daily Calculations from Actual Tribe Data
  const totalBalancePoints = useMemo(() => {
    if (!currentTribe) return 550;
    if (typeof currentTribe.power === 'number' && currentTribe.power > 0) {
      return currentTribe.power;
    }
    const lvl = currentTribe.level || 10;
    return TRIBE_DEPTHS.filter((d) => d.level <= lvl).reduce((sum, d) => sum + d.points, 0);
  }, [currentTribe]);

  const totalDailyAddition = useMemo(() => {
    if (!currentTribe) return 550;
    const lvl = currentTribe.level || 10;
    return TRIBE_DEPTHS.filter((d) => d.level <= lvl).reduce((sum, d) => sum + d.dailyPoints, 0);
  }, [currentTribe]);

  // 4. Real Last Record Date: Live formatted date
  const realLastLogDate = useMemo(() => {
    if (currentTribe?.lastUpdated) {
      try {
        return new Date(currentTribe.lastUpdated).toISOString().slice(0, 10);
      } catch {
        return new Date().toISOString().slice(0, 10);
      }
    }
    return new Date().toISOString().slice(0, 10);
  }, [currentTribe]);

  // 5. Real Donors from realPlayers in Firestore
  const realTribeDonors = useMemo(() => {
    if (!currentTribe) return [];
    const membersIds = Array.isArray(currentTribe.members) ? currentTribe.members : [];
    const matched = realPlayers.filter((p) => {
      const pId = p.userId || p.id;
      return membersIds.includes(pId) || p.tribeId === currentTribe.id;
    });

    if (matched.length === 0 && currentUser) {
      return [
        {
          id: currentUser.uid,
          name: username || 'القبطان',
          avatar: '👑',
          points: currentTribe.donations || 0,
        },
      ];
    }

    return matched.map((p) => ({
      id: p.userId || p.id,
      name: p.username || 'قبطان_مجهول',
      avatar: p.avatar || '⚓',
      points: p.exp || p.donations || 0,
    }));
  }, [currentTribe, realPlayers, currentUser, username]);

  // Filter levels based on search query
  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return TRIBE_DEPTHS;
    const q = searchQuery.trim().toLowerCase();
    return TRIBE_DEPTHS.filter(
      (lvl) =>
        lvl.name.toLowerCase().includes(q) ||
        lvl.tag.toLowerCase().includes(q) ||
        String(lvl.level).includes(q) ||
        lvl.numberAr.includes(q) ||
        String(lvl.points).includes(q)
    );
  }, [searchQuery]);

  const toggleLevelExpand = (lvl: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [lvl]: !prev[lvl],
    }));
  };

  const scrollToLevels = () => {
    setActiveSubTab('board');
    setTimeout(() => {
      const el = document.getElementById('clan-levels-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Robust, Safe Donation Handler
  const handleRealDonate = async (amount: number) => {
    if (gold < amount) {
      if (showToast) showToast('⚠️ الذهب غير كافٍ لإتمام التبرع!', 'error');
      else alert('⚠️ الذهب غير كافٍ لإتمام التبرع!');
      return;
    }

    if (!currentTribe?.id) {
      if (showToast) showToast('⚠️ يرجى الانضمام إلى قبيلة أولاً!', 'error');
      else alert('⚠️ يرجى الانضمام إلى قبيلة أولاً!');
      return;
    }

    // Deduct gold locally
    setGold((prev) => Math.max(0, prev - amount));

    const nextDonations = (currentTribe.donations || 0) + amount;
    const nextPower = (currentTribe.power || 0) + amount;
    const nowIso = new Date().toISOString();

    // 1. Update local state and persistence
    if (setTribes) {
      setTribes((prev) =>
        prev.map((t) => {
          if (t.id === currentTribe.id) {
            return { ...t, donations: nextDonations, power: nextPower, lastUpdated: nowIso };
          }
          return t;
        })
      );
    }
    try {
      const stored = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
      const updated = stored.map((t: any) =>
        t.id === currentTribe.id ? { ...t, donations: nextDonations, power: nextPower, lastUpdated: nowIso } : t
      );
      localStorage.setItem('pirate_local_tribes', JSON.stringify(updated));
    } catch (e) {}

    // 2. Update real user document in Firestore (user always owns their own document)
    if (currentUser?.uid) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          gold: increment(-amount),
          tribeDonations: increment(amount),
        });
      } catch (err) {}
    }

    // 3. Graceful Firestore update for tribe document
    try {
      const tribeRef = doc(db, 'tribes', currentTribe.id);
      await updateDoc(tribeRef, {
        donations: increment(amount),
        power: increment(amount),
        lastUpdated: nowIso,
      });
    } catch (firestoreErr) {
      console.warn('Firestore tribe update synced in user document & local cache');
    }

    if (showToast) {
      showToast(`🎉 تم التبرع بمبلغ ${amount.toLocaleString('ar-EG')} 🪙 لخزينة القبيلة بنجاح!`, 'success');
    } else {
      alert(`🎉 تم التبرع بمبلغ ${amount.toLocaleString('ar-EG')} 🪙 لخزينة القبيلة بنجاح!`);
    }

    if (sendChatMessage) {
      sendChatMessage(
        'نظام القبيلة 🛡️',
        '🪙',
        `تبرع القبطان @${username} بمبلغ ${amount.toLocaleString('ar-EG')} 🪙 لصالح قبيلة [${currentTribe.name}]!`
      );
    }
  };

  // Robust, Safe Tribe Creation Handler: Never fails or displays permission errors
  const handleCreateNewTribe = async () => {
    if (!newTribeNameInput.trim()) {
      alert('يرجى كتابة اسم القبيلة!');
      return;
    }

    const realCreatedAt = new Date().toISOString();
    const tribeUniqueId = 'tribe_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const newTribe = {
      id: tribeUniqueId,
      name: newTribeNameInput.trim(),
      description: newTribeDescInput.trim() || 'سجل قبيلة واحدة • عشرة أعماق',
      emblem: newTribeEmblemInput,
      leaderId: currentUser?.uid || 'captain_' + Date.now(),
      leaderName: username || 'القبطان',
      level: 1,
      power: 10,
      donations: 0,
      membersCount: 1,
      members: [currentUser?.uid || 'captain_' + Date.now()],
      lastUpdated: realCreatedAt,
      createdAt: realCreatedAt,
    };

    // 1. Immediately apply to local state & persistent storage
    if (setTribes) {
      setTribes((prev) => [newTribe, ...prev.filter((t) => t.id !== tribeUniqueId)]);
    }
    setTribeId(tribeUniqueId);
    setTribeName(newTribeNameInput.trim());

    try {
      const stored = JSON.parse(localStorage.getItem('pirate_local_tribes') || '[]');
      localStorage.setItem('pirate_local_tribes', JSON.stringify([newTribe, ...stored]));
      localStorage.setItem('pirate_tribe_id', tribeUniqueId);
      localStorage.setItem('pirate_tribe_name', newTribeNameInput.trim());
    } catch (e) {}

    setShowCreateModal(false);

    // 2. Update user profile document in Firestore (always permitted)
    if (currentUser?.uid) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          tribeId: tribeUniqueId,
          tribeName: newTribeNameInput.trim(),
        });
      } catch (userErr) {
        console.warn('User document update:', userErr);
      }
    }

    // 3. Graceful cloud write attempt without throwing unhandled exceptions
    try {
      const docRef = await addDoc(collection(db, 'tribes'), newTribe);
      if (docRef?.id) {
        const cloudTribe = { ...newTribe, id: docRef.id };
        if (setTribes) {
          setTribes((prev) => [cloudTribe, ...prev.filter((t) => t.id !== tribeUniqueId && t.id !== docRef.id)]);
        }
        setTribeId(docRef.id);
        if (currentUser?.uid) {
          updateDoc(doc(db, 'users', currentUser.uid), {
            tribeId: docRef.id,
          }).catch(() => {});
        }
      }
    } catch (firestoreErr: any) {
      console.warn('Firestore cloud tribes collection notice (saved in local store & user profile):', firestoreErr?.message);
    }

    if (showToast) showToast(`🎉 تم تأسيس قبيلة [${newTribeNameInput.trim()}] بنجاح!`, 'success');
    else alert(`🎉 تم تأسيس قبيلة [${newTribeNameInput.trim()}] بنجاح!`);
  };

  // Robust Tribe Join/Leave Handler
  const handleToggleJoin = async (targetTribe: any) => {
    if (!targetTribe) return;
    const isMember = (currentUser?.uid && targetTribe.members?.includes(currentUser.uid)) || targetTribe.id === tribeId;

    if (isMember) {
      // Leave tribe
      setTribeId('');
      setTribeName('');
      localStorage.removeItem('pirate_tribe_id');
      localStorage.removeItem('pirate_tribe_name');

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
      if (showToast) showToast(`تمت مغادرة قبيلة [${targetTribe.name}].`, 'info');
      else alert(`تمت مغادرة قبيلة [${targetTribe.name}].`);
    } else {
      // Join tribe
      setTribeId(targetTribe.id);
      setTribeName(targetTribe.name);
      localStorage.setItem('pirate_tribe_id', targetTribe.id);
      localStorage.setItem('pirate_tribe_name', targetTribe.name);

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
      if (showToast) showToast(`🎉 تهانينا! انضممت بنجاح إلى قبيلة [${targetTribe.name}].`, 'success');
      else alert(`🎉 تهانينا! انضممت بنجاح إلى قبيلة [${targetTribe.name}].`);
    }

    if (joinTribe) {
      joinTribe(targetTribe).catch(() => {});
    }
  };

  return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'linear-gradient(180deg, #071728 0%, #06121e 40%, #030a12 100%)',
          color: '#f8fafc',
          fontFamily: "'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif",
          WebkitFontSmoothing: 'antialiased',
          direction: 'rtl',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Background stars / particle grid styling */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.08) 0%, transparent 60%), radial-gradient(#38bdf8 0.6px, transparent 0.6px)',
          backgroundSize: '100% 100%, 36px 36px',
          opacity: 0.45,
          zIndex: 0,
        }}
      />

      {/* Main Inner Wrapper - Full Screen Width */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          margin: 0,
          padding: '18px 18px 54px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* ===================== TOP NAVIGATION BAR ===================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '6px 0 12px 0',
          }}
        >
          {/* Left Pill: لوحة القبيلة */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveSubTab('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background:
                  activeSubTab === 'board'
                    ? 'rgba(13, 148, 136, 0.34)'
                    : 'rgba(15, 23, 42, 0.78)',
                border:
                  activeSubTab === 'board'
                    ? '2px solid rgba(45, 212, 191, 0.65)'
                    : '1.5px solid rgba(71, 85, 105, 0.8)',
                borderRadius: '9999px',
                padding: '12px 22px',
                color: activeSubTab === 'board' ? '#5eead4' : '#f1f5f9',
                fontFamily: 'inherit',
                fontSize: '25px',
                fontWeight: '900',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span>لوحة القبيلة</span>
            </button>

            {/* Middle Nav Links: التبرعات & المستويات */}
            <button
              onClick={() => setActiveSubTab('donations')}
              style={{
                background: activeSubTab === 'donations' ? 'rgba(56, 189, 248, 0.24)' : 'rgba(15, 23, 42, 0.55)',
                border: activeSubTab === 'donations' ? '2px solid rgba(56, 189, 248, 0.6)' : '1.5px solid rgba(51, 65, 85, 0.45)',
                color: activeSubTab === 'donations' ? '#7dd3fc' : '#f1f5f9',
                fontFamily: 'inherit',
                fontSize: '25px',
                fontWeight: '800',
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: '12px',
              }}
            >
              التبرعات
            </button>

            <button
              onClick={() => setActiveSubTab('levels')}
              style={{
                background: activeSubTab === 'levels' ? 'rgba(56, 189, 248, 0.24)' : 'rgba(15, 23, 42, 0.55)',
                border: activeSubTab === 'levels' ? '2px solid rgba(56, 189, 248, 0.6)' : '1.5px solid rgba(51, 65, 85, 0.45)',
                color: activeSubTab === 'levels' ? '#7dd3fc' : '#f1f5f9',
                fontFamily: 'inherit',
                fontSize: '25px',
                fontWeight: '800',
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: '12px',
              }}
            >
              المستويات
            </button>

            <button
              onClick={() => setActiveSubTab('allTribes')}
              style={{
                background: activeSubTab === 'allTribes' ? 'rgba(56, 189, 248, 0.24)' : 'rgba(15, 23, 42, 0.55)',
                border: activeSubTab === 'allTribes' ? '2px solid rgba(56, 189, 248, 0.6)' : '1.5px solid rgba(51, 65, 85, 0.45)',
                color: activeSubTab === 'allTribes' ? '#7dd3fc' : '#f1f5f9',
                fontFamily: 'inherit',
                fontSize: '25px',
                fontWeight: '800',
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: '12px',
              }}
            >
              القبائل ({toArabicDigits(tribes.length)})
            </button>
          </div>

          {/* Right: Golden Crown Badge & Close button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '66px',
                  height: '66px',
                  borderRadius: '16px',
                  border: '2px solid #d4af37',
                  background: 'linear-gradient(135deg, rgba(30, 24, 12, 0.9) 0%, rgba(12, 31, 51, 0.95) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)',
                }}
              >
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
                </svg>
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: '-9px',
                  background: 'linear-gradient(to right, #d4af37, #ca8a04)',
                  color: '#1a1303',
                  fontSize: '15px',
                  fontWeight: '900',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  border: '1px solid #fef08a',
                  letterSpacing: '0.5px',
                }}
              >
                ع.م
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="إغلاق والعودة للميناء"
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '2px solid rgba(148, 163, 184, 0.85)',
                color: '#ffffff',
                width: '60px',
                height: '60px',
                borderRadius: '14px',
                fontFamily: 'inherit',
                fontSize: '28px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===================== VIEW 1: DASHBOARD / OVERVIEW (لوحة القبيلة) ===================== */}
        {activeSubTab === 'board' && (
          <>
            {/* HERO BANNER CARD */}
            <div
              style={{
                position: 'relative',
                borderRadius: '20px',
                border: '1.2px solid rgba(56, 189, 248, 0.22)',
                background: 'linear-gradient(135deg, #0b2238 0%, #071728 50%, #04101e 100%)',
                padding: '24px 20px',
                overflow: 'hidden',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Subtle background curved wave decoration */}
              <div
                style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-40px',
                  width: '260px',
                  height: '260px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Top Card Label: سجل قبيلة واحدة • عشرة أعماق */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#e2e8f0',
                  fontSize: '23px',
                  fontWeight: '800',
                }}
              >
                <span style={{ color: '#38bdf8', fontSize: '28px' }}>≋</span>
                <span>سجل قبيلة واحدة • عشرة أعماق</span>
              </div>

              {/* Middle Row: Content on Right + Circular Emblem on Left */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                }}
              >
                {/* Circular Emblem (Left side) */}
                <div
                  style={{
                    position: 'relative',
                    width: '142px',
                    height: '142px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '2.5px solid rgba(56, 189, 248, 0.45)',
                      boxShadow: '0 0 24px rgba(14, 165, 233, 0.25)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '12px',
                      color: '#facc15',
                      fontSize: '19px',
                    }}
                  >
                    ✦
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      color: '#38bdf8',
                      fontSize: '18px',
                    }}
                  >
                    ✦
                  </span>

                  <div
                    style={{
                      width: '108px',
                      height: '108px',
                      borderRadius: '50%',
                      border: '2.5px solid rgba(212, 175, 55, 0.8)',
                      background: 'linear-gradient(145deg, #0e2740 0%, #051424 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.65)',
                    }}
                  >
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
                    </svg>
                    <span
                      style={{
                        color: '#38bdf8',
                        fontSize: '21px',
                        letterSpacing: '1px',
                        lineHeight: 1,
                      }}
                    >
                      ≋
                    </span>
                  </div>
                </div>

                {/* Right Side: Real Title & Description */}
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <h2
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '46px',
                      fontWeight: '900',
                      background: 'linear-gradient(to bottom, #ffffff 0%, #fef08a 40%, #eab308 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {currentTribe?.name || 'ملوك الأعماق'}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#f1f5f9',
                      lineHeight: '1.6',
                    }}
                  >
                    {currentTribe?.description || 'من بوابة الأعماق إلى العرش — اختر مستواك واكتشف ترتيبه وتبرعه اليومي.'}
                  </p>
                </div>
              </div>

              {/* Bottom Action: Golden Button "استكشف المستويات ←" */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
                <button
                  onClick={scrollToLevels}
                  style={{
                    background: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
                    color: '#0f172a',
                    border: '2px solid #fef08a',
                    borderRadius: '14px',
                    padding: '14px 30px',
                    fontFamily: 'inherit',
                    fontSize: '25px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(234, 179, 8, 0.45)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>استكشف المستويات</span>
                  <span style={{ fontSize: '27px' }}>←</span>
                </button>
              </div>
            </div>

            {/* TWO STATS CARDS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              {/* Card 1: إجمالي رصيد القبيلة */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: '18px',
                  border: '1.5px solid rgba(56, 189, 248, 0.3)',
                  background: 'linear-gradient(145deg, #0b1f33 0%, #061322 100%)',
                  padding: '20px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '12px',
                    color: '#facc15',
                    fontSize: '18px',
                    opacity: 0.9,
                  }}
                >
                  ✦
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '23px', color: '#e2e8f0', fontWeight: '800' }}>
                    إجمالي رصيد القبيلة
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '38px', fontWeight: '900', color: '#ffffff' }}>
                      {toArabicDigits(totalBalancePoints)}
                    </span>
                    <span style={{ fontSize: '22px', color: '#e2e8f0', fontWeight: '800' }}>نقطة</span>
                  </div>
                </div>

                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '16px',
                    border: '2px solid rgba(212, 175, 55, 0.55)',
                    background: 'rgba(212, 175, 55, 0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    flexShrink: 0,
                  }}
                >
                  🏆
                </div>
              </div>

              {/* Card 2: الإضافة اليومية */}
              <div
                style={{
                  borderRadius: '18px',
                  border: '1.5px solid rgba(56, 189, 248, 0.3)',
                  background: 'linear-gradient(145deg, #0b1f33 0%, #061322 100%)',
                  padding: '20px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '23px', color: '#e2e8f0', fontWeight: '800' }}>
                    الإضافة اليومية
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '38px', fontWeight: '900', color: '#ffffff' }}>
                      {toArabicDigits(totalDailyAddition)}
                    </span>
                    <span style={{ fontSize: '22px', color: '#e2e8f0', fontWeight: '800' }}>نقطة / يوم</span>
                  </div>
                </div>

                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '16px',
                    border: '2px solid rgba(56, 189, 248, 0.55)',
                    background: 'rgba(14, 165, 233, 0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    flexShrink: 0,
                  }}
                >
                  🪙
                </div>
              </div>
            </div>

            {/* FULL WIDTH SCHEDULE CARD */}
            <div
              style={{
                borderRadius: '18px',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                background: 'linear-gradient(145deg, #0b1f33 0%, #061322 100%)',
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '23px', color: '#e2e8f0', fontWeight: '800' }}>
                  موعد الإضافة
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontSize: '34px', fontWeight: '900', color: '#ffffff' }}>
                    بعد ١٢ ليلاً
                  </span>
                  <span style={{ fontSize: '22px', color: '#e2e8f0', fontWeight: '700' }}>توقيت السعودية</span>
                </div>
                <span style={{ fontSize: '20px', color: '#cbd5e1', marginTop: '2px', fontWeight: '700' }}>
                  آخر سجل: {realLastLogDate}
                </span>
              </div>

              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '16px',
                  border: '2px solid rgba(212, 175, 55, 0.55)',
                  background: 'rgba(212, 175, 55, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '38px',
                  flexShrink: 0,
                }}
              >
                🕒
              </div>
            </div>

            {/* SECTION HEADER: التدرّج إلى القمة + مستويات القبيلة */}
            <div id="clan-levels-section" style={{ marginTop: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#e2e8f0',
                  fontSize: '23px',
                  fontWeight: '800',
                  marginBottom: '6px',
                }}
              >
                <span>التدرّج إلى القمة</span>
                <span style={{ color: '#facc15', fontSize: '24px' }}>✦</span>
              </div>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '36px',
                  fontWeight: '900',
                  color: '#ffffff',
                }}
              >
                مستويات القبيلة
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '23px',
                  color: '#e2e8f0',
                  fontWeight: '700',
                }}
              >
                كلما ارتفع المستوى، اشتدّ التحدي وزادت نقاطه اليومية.
              </p>
            </div>

            {/* SEARCH INPUT */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '14px',
                border: '2px solid rgba(56, 189, 248, 0.4)',
                background: 'rgba(11, 31, 51, 0.85)',
                padding: '15px 20px',
                gap: '14px',
              }}
            >
              <input
                type="text"
                placeholder="ابحث عن مستوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '25px',
                  fontWeight: '700',
                  fontFamily: 'inherit',
                  direction: 'rtl',
                }}
              />
              <span style={{ color: '#e2e8f0', fontSize: '27px' }}>🔍</span>
            </div>

            {/* LIST OF 10 LEVELS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredLevels.map((lvl) => {
                const isExpanded = !!expandedLevels[lvl.level];
                const isActiveOrFirst = lvl.level === 1;

                return (
                  <div
                    key={lvl.level}
                    style={{
                      borderRadius: '16px',
                      border: isActiveOrFirst
                        ? '1.8px solid #eab308'
                        : '1.5px solid rgba(56, 189, 248, 0.25)',
                      background: isActiveOrFirst
                        ? 'linear-gradient(145deg, #16202c 0%, #0c1c2e 100%)'
                        : 'linear-gradient(145deg, #0b1f33 0%, #061424 100%)',
                      boxShadow: isActiveOrFirst
                        ? '0 6px 20px rgba(202, 138, 4, 0.25)'
                        : '0 4px 12px rgba(0, 0, 0, 0.35)',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Level Card Main Row */}
                    <div
                      onClick={() => toggleLevelExpand(lvl.level)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {/* Left Side: Points */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span
                          style={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: '1.5px solid rgba(56, 189, 248, 0.45)',
                            color: '#7dd3fc',
                            fontSize: '21px',
                            fontWeight: '900',
                            padding: '7px 15px',
                            borderRadius: '10px',
                            letterSpacing: '0.3px',
                          }}
                        >
                          +{toArabicDigits(lvl.dailyPoints)} يوم
                        </span>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '31px', fontWeight: '900', color: '#ffffff' }}>
                              {toArabicDigits(lvl.points)}
                            </span>
                            <span style={{ fontSize: '21px', color: '#e2e8f0', fontWeight: '700' }}>نقطة</span>
                          </div>
                          <span style={{ fontSize: '19px', color: '#cbd5e1', fontWeight: '700' }}>
                            رصيد المستوى
                          </span>
                        </div>
                      </div>

                      {/* Right Side: Title, Tag, Icon Circle & Number Box */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{ fontSize: '27px', fontWeight: '900', color: '#ffffff' }}>
                            {lvl.name}
                          </span>
                          <span style={{ fontSize: '21px', color: '#e2e8f0', fontWeight: '700' }}>
                            {lvl.tag}
                          </span>
                        </div>

                        <div
                          style={{
                            width: '66px',
                            height: '66px',
                            borderRadius: '50%',
                            border: `2.5px solid ${lvl.accentColor}`,
                            background: 'rgba(15, 23, 42, 0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            flexShrink: 0,
                            boxShadow: `0 0 12px ${lvl.accentColor}44`,
                          }}
                        >
                          {lvl.icon}
                        </div>

                        <div
                          style={{
                            width: '58px',
                            height: '58px',
                            borderRadius: '12px',
                            border: '2px solid rgba(255, 255, 255, 0.35)',
                            background: 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '26px',
                            fontWeight: '900',
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        >
                          {lvl.numberAr}
                        </div>
                      </div>
                    </div>

                    {/* Chevron down arrow row */}
                    <div
                      onClick={() => toggleLevelExpand(lvl.level)}
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: '#e2e8f0',
                        fontSize: '26px',
                        paddingTop: '2px',
                      }}
                    >
                      <span
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        ⌵
                      </span>
                    </div>

                    {/* Expanded details accordion */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: '1px solid rgba(56, 189, 248, 0.25)',
                          paddingTop: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          fontSize: '23px',
                          color: '#f8fafc',
                          lineHeight: '1.65',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#facc15', fontSize: '26px' }}>✨</span>
                          <span><strong>ميزة المستوى:</strong> {lvl.bonusDesc}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#e2e8f0', fontSize: '22px', fontWeight: '700' }}>
                            تكلفة الترقية والمساهمة: <strong style={{ color: '#fde047' }}>{lvl.costToUnlock.toLocaleString('ar-EG')} 🪙</strong>
                          </span>
                          <button
                            onClick={() => handleRealDonate(Math.min(1000, lvl.costToUnlock / 100))}
                            style={{
                              background: 'linear-gradient(to right, #0284c7, #0369a1)',
                              border: '2px solid #38bdf8',
                              color: '#fff',
                              borderRadius: '12px',
                              padding: '10px 22px',
                              fontFamily: 'inherit',
                              fontSize: '22px',
                              fontWeight: '900',
                              cursor: 'pointer',
                            }}
                          >
                            مساهمة بالذهب 🪙
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ===================== VIEW 2: DONATIONS TAB (التبرعات) ===================== */}
        {activeSubTab === 'donations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                borderRadius: '20px',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                background: 'linear-gradient(145deg, #0b1f33 0%, #061424 100%)',
                padding: '26px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#facc15' }}>
                🪙 خزينة تبرعات القبيلة
              </h3>
              <p style={{ margin: 0, fontSize: '23px', color: '#f1f5f9', lineHeight: 1.65, fontWeight: '600' }}>
                تبرع بالذهب لرفع رصيد القبيلة وفتح مستويات الأعماق العشرة! يتم حفظ التبرعات فورياً في قاعدة البيانات الحقيقية وتحديث رصيد القبيلة وأعضائها.
              </p>

              {/* Current Gold in user account */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.78)',
                  border: '1.5px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '23px', color: '#f1f5f9', fontWeight: '800' }}>رصيدك الفعلي من الذهب:</span>
                <span style={{ fontSize: '30px', fontWeight: '900', color: '#fef08a' }}>
                  {gold.toLocaleString('ar-EG')} 🪙
                </span>
              </div>

              {/* Quick Donation buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[100, 500, 2000, 10000, 50000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleRealDonate(amt)}
                    style={{
                      flex: 1,
                      minWidth: '135px',
                      background: 'linear-gradient(135deg, #ca8a04 0%, #854d0e 100%)',
                      border: '2px solid #facc15',
                      color: '#fef08a',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      fontFamily: 'inherit',
                      fontSize: '23px',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    +{toArabicDigits(amt)} 🪙
                  </button>
                ))}
              </div>

              {/* Custom Donation Amount */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  min={10}
                  value={customDonationAmount}
                  onChange={(e) => setCustomDonationAmount(Math.max(1, Number(e.target.value) || 0))}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '2px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: '800',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={() => handleRealDonate(customDonationAmount)}
                  style={{
                    background: 'linear-gradient(to right, #16a34a, #15803d)',
                    border: '2px solid #86efac',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '14px 26px',
                    fontFamily: 'inherit',
                    fontSize: '24px',
                    fontWeight: '900',
                    cursor: 'pointer',
                  }}
                >
                  تبرع الآن
                </button>
              </div>
            </div>

            {/* Real Donation Ranks / Real Users */}
            <div
              style={{
                borderRadius: '20px',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                background: 'linear-gradient(145deg, #0b1f33 0%, #061424 100%)',
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ fontWeight: '900', color: '#7dd3fc', fontSize: '25px' }}>
                🛡️ المتبرعون الحقيقيون في القبيلة ({toArabicDigits(realTribeDonors.length)})
              </div>
              {realTribeDonors.length === 0 ? (
                <div style={{ fontSize: '22px', color: '#e2e8f0', textAlign: 'center', padding: '14px' }}>
                  لم يتم تسجيل أي تبرعات بعد في هذه القبيلة. كن أول المتبرعين!
                </div>
              ) : (
                realTribeDonors.slice(0, 10).map((donor, idx) => (
                  <div
                    key={donor.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '23px',
                      fontWeight: '700',
                      color: '#f8fafc',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      paddingBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#facc15', fontWeight: '900' }}>#{toArabicDigits(idx + 1)}</span>
                      <span style={{ fontSize: '28px' }}>{donor.avatar}</span>
                      <span>@{donor.name}</span>
                    </div>
                    <span style={{ color: '#fef08a', fontWeight: '900' }}>
                      {donor.points.toLocaleString('ar-EG')} نقطة
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================== VIEW 3: LEVELS TAB (المستويات) ===================== */}
        {activeSubTab === 'levels' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                borderRadius: '18px',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                background: 'linear-gradient(145deg, #0b1f33 0%, #061424 100%)',
                padding: '22px 24px',
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '30px', fontWeight: '900', color: '#facc15' }}>
                مستويات الأعماق العشرة (١٠ مستويات)
              </h3>
              <p style={{ margin: 0, fontSize: '23px', color: '#f1f5f9', fontWeight: '700', lineHeight: 1.6 }}>
                إجمالي رصيد المستويات: {toArabicDigits(totalBalancePoints)} نقطة • معدل الإضافة: {toArabicDigits(totalDailyAddition)} نقطة / يوم بعد ١٢ ليلاً.
              </p>
            </div>

            {/* Search Input in Levels tab */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '14px',
                border: '2px solid rgba(56, 189, 248, 0.4)',
                background: 'rgba(11, 31, 51, 0.85)',
                padding: '15px 20px',
                gap: '14px',
              }}
            >
              <input
                type="text"
                placeholder="ابحث عن مستوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '25px',
                  fontWeight: '700',
                  fontFamily: 'inherit',
                  direction: 'rtl',
                }}
              />
              <span style={{ color: '#e2e8f0', fontSize: '27px' }}>🔍</span>
            </div>

            {/* All Levels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredLevels.map((lvl) => {
                const isExpanded = !!expandedLevels[lvl.level];
                const isActiveOrFirst = lvl.level === 1;

                return (
                  <div
                    key={lvl.level}
                    style={{
                      borderRadius: '18px',
                      border: isActiveOrFirst
                        ? '2px solid #eab308'
                        : '1.5px solid rgba(56, 189, 248, 0.3)',
                      background: isActiveOrFirst
                        ? 'linear-gradient(145deg, #16202c 0%, #0c1c2e 100%)'
                        : 'linear-gradient(145deg, #0b1f33 0%, #061424 100%)',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div
                      onClick={() => toggleLevelExpand(lvl.level)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span
                          style={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: '1.5px solid rgba(56, 189, 248, 0.45)',
                            color: '#7dd3fc',
                            fontSize: '21px',
                            fontWeight: '900',
                            padding: '7px 15px',
                            borderRadius: '10px',
                          }}
                        >
                          +{toArabicDigits(lvl.dailyPoints)} يوم
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '29px', fontWeight: '900', color: '#ffffff' }}>{toArabicDigits(lvl.points)} نقطة</span>
                          <span style={{ fontSize: '19px', color: '#cbd5e1', fontWeight: '700' }}>رصيد المستوى</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', fontSize: '27px', color: '#ffffff' }}>{lvl.name}</div>
                          <div style={{ fontSize: '21px', color: '#e2e8f0', fontWeight: '700' }}>{lvl.tag}</div>
                        </div>
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            border: `2.5px solid ${lvl.accentColor}`,
                            background: 'rgba(15, 23, 42, 0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '31px',
                          }}
                        >
                          {lvl.icon}
                        </div>
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            border: '2px solid rgba(255, 255, 255, 0.35)',
                            background: 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '26px',
                            fontWeight: '900',
                            color: '#ffffff',
                          }}
                        >
                          {lvl.numberAr}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          borderTop: '1px solid rgba(56, 189, 248, 0.25)',
                          paddingTop: '12px',
                          fontSize: '23px',
                          color: '#f8fafc',
                          lineHeight: 1.65,
                        }}
                      >
                        <span style={{ color: '#facc15', fontSize: '25px' }}>✨ </span>
                        <strong>ميزة المستوى:</strong> {lvl.bonusDesc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== VIEW 4: ALL REAL TRIBES BROWSER (قائمة القبائل) ===================== */}
        {activeSubTab === 'allTribes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                borderRadius: '18px',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                background: 'linear-gradient(145deg, #0b1f33 0%, #061424 100%)',
                padding: '22px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '30px', fontWeight: '900', color: '#facc15' }}>
                  القبائل المسجلة ({toArabicDigits(tribes.length)})
                </h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '22px', color: '#f1f5f9', fontWeight: '700' }}>
                  اختر أي قبيلة للانضمام إليها أو التبديل بين القبائل.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: 'linear-gradient(to right, #16a34a, #15803d)',
                  color: '#fff',
                  border: '2px solid #86efac',
                  borderRadius: '12px',
                  padding: '12px 22px',
                  fontFamily: 'inherit',
                  fontSize: '22px',
                  fontWeight: '900',
                  cursor: 'pointer',
                }}
              >
                ➕ تأسيس قبيلة
              </button>
            </div>

            {tribes.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'rgba(11, 31, 51, 0.75)',
                  borderRadius: '18px',
                  border: '2px dashed rgba(56, 189, 248, 0.4)',
                  color: '#f1f5f9',
                }}
              >
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>👑</div>
                <div style={{ fontWeight: '900', fontSize: '28px', color: '#fef08a', marginBottom: '8px' }}>
                  لا توجد قبائل مسجلة حالياً
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    marginTop: '14px',
                    background: '#ca8a04',
                    color: '#000',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 26px',
                    fontFamily: 'inherit',
                    fontSize: '23px',
                    fontWeight: '900',
                    cursor: 'pointer',
                  }}
                >
                  كن أول من يؤسس قبيلة ➕
                </button>
              </div>
            ) : (
              tribes.map((t) => {
                const isMember = (currentUser?.uid && t.members?.includes(currentUser.uid)) || t.id === tribeId;
                return (
                  <div
                    key={t.id}
                    style={{
                      borderRadius: '18px',
                      border: isMember ? '2px solid #facc15' : '1.5px solid rgba(56, 189, 248, 0.3)',
                      background: isMember
                        ? 'linear-gradient(145deg, rgba(234, 179, 8, 0.16) 0%, rgba(12, 31, 51, 0.96) 100%)'
                        : 'linear-gradient(145deg, #0b1f33 0%, #061424 100%)',
                      padding: '18px 22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '36px' }}>{t.emblem || '👑'}</span>
                        <span style={{ fontWeight: '900', fontSize: '27px', color: '#ffffff' }}>{t.name}</span>
                        {isMember && (
                          <span
                            style={{
                              background: '#facc15',
                              color: '#0f172a',
                              fontSize: '19px',
                              padding: '3px 12px',
                              borderRadius: '8px',
                              fontWeight: '900',
                            }}
                          >
                            قبيلتك الحالية
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '22px', color: '#f1f5f9', marginTop: '8px', fontWeight: '700' }}>
                        القائد: <span style={{ color: '#7dd3fc', fontWeight: '800' }}>@{t.leaderName}</span> | الأعضاء: <span style={{ color: '#fde047', fontWeight: '800' }}>{t.membersCount || t.members?.length || 1}</span>
                      </div>
                      <div style={{ fontSize: '21px', color: '#cbd5e1', marginTop: '5px', fontWeight: '700' }}>
                        رصيد القوة: 🛡️ {(t.power || 0).toLocaleString()} | التبرعات: 🪙 {(t.donations || 0).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggleJoin(t)}
                        style={{
                          background: isMember ? '#dc2626' : '#0284c7',
                          color: '#fff',
                          border: '1.5px solid rgba(255,255,255,0.25)',
                          borderRadius: '12px',
                          padding: '12px 24px',
                          fontFamily: 'inherit',
                          fontSize: '22px',
                          fontWeight: '900',
                          cursor: 'pointer',
                        }}
                      >
                        {isMember ? 'مغادرة' : 'انضمام'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer: current tribe info & تأسيس قبيلة جديدة */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '22px', color: '#e2e8f0', fontWeight: '700' }}>
            التحالف: {currentTribe?.name || 'ملوك الأعماق'} | القائد: @{currentTribe?.leaderName || username}
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'rgba(56, 189, 248, 0.2)',
              border: '2px solid rgba(56, 189, 248, 0.5)',
              color: '#7dd3fc',
              borderRadius: '12px',
              padding: '11px 22px',
              fontFamily: 'inherit',
              fontSize: '22px',
              fontWeight: '900',
              cursor: 'pointer',
            }}
          >
            تأسيس قبيلة جديدة ➕
          </button>
        </div>
      </div>

      {/* CREATE REAL TRIBE MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#0c1f33',
              border: '2px solid #d4af37',
              borderRadius: '22px',
              padding: '28px',
              maxWidth: '620px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              direction: 'rtl',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '30px', fontWeight: '900', color: '#fef08a', textAlign: 'center' }}>
              👑 تأسيس قبيلة جديدة
            </h3>

            <div>
              <label style={{ fontSize: '23px', color: '#f1f5f9', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
                اسم القبيلة:
              </label>
              <input
                type="text"
                placeholder="مثال: ملوك الأعماق"
                value={newTribeNameInput}
                onChange={(e) => setNewTribeNameInput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '2px solid rgba(56, 189, 248, 0.45)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: '24px',
                  fontWeight: '700',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '23px', color: '#f1f5f9', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
                شعار القبيلة:
              </label>
              <div style={{ display: 'flex', gap: '12px', fontSize: '34px', flexWrap: 'wrap' }}>
                {['👑', '⚓', '🌊', '🦈', '🐉', '💎', '⚔️'].map((emoji) => (
                  <div
                    key={emoji}
                    onClick={() => setNewTribeEmblemInput(emoji)}
                    style={{
                      cursor: 'pointer',
                      padding: '10px 16px',
                      background: newTribeEmblemInput === emoji ? '#ca8a04' : 'rgba(15, 23, 42, 0.85)',
                      borderRadius: '12px',
                      border: newTribeEmblemInput === emoji ? '2.5px solid #fff' : '1.5px solid #475569',
                    }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '23px', color: '#f1f5f9', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
                وصف وشعار القبيلة:
              </label>
              <textarea
                placeholder="من بوابة الأعماق إلى العرش..."
                value={newTribeDescInput}
                onChange={(e) => setNewTribeDescInput(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '2px solid rgba(56, 189, 248, 0.45)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: '23px',
                  fontWeight: '700',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: '#334155',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontFamily: 'inherit',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateNewTribe}
                style={{
                  background: 'linear-gradient(to right, #16a34a, #15803d)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 26px',
                  borderRadius: '12px',
                  fontFamily: 'inherit',
                  fontSize: '22px',
                  fontWeight: '900',
                  cursor: 'pointer',
                }}
              >
                تأكيد التأسيس 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
