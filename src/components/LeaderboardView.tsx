import React, { useState, useMemo } from 'react';
import { Anchor, Copy, Check, X, Crown } from 'lucide-react';

export function formatCombatPower(val: number): string {
  if (!val || isNaN(val)) return '0';
  return val.toLocaleString('en-US');
}

type LeaderboardCategory = 'gold' | 'gems' | 'boom';

interface LeaderboardViewProps {
  realPlayers: any[];
  currentUser: any;
  currentGold?: number;
  currentGems?: number;
  leaderboardFilter: string;
  setLeaderboardFilter: (filter: any) => void;
  leaderboardSearchQuery: string;
  setLeaderboardSearchQuery: (query: string) => void;
  handleOpenProfile: (player: any) => void;
  setActiveTab: (tab: any) => void;
  onOpenAttacksList?: () => void;
}

const COUNTRY_NAME_MAP: Record<string, string> = {
  '🇸🇦': 'السعودية',
  '🇦🇪': 'الإمارات',
  '🇰🇼': 'الكويت',
  '🇶🇦': 'قطر',
  '🇧🇭': 'البحرين',
  '🇴🇲': 'عُمان',
  '🇪🇬': 'مصر',
  '🇯🇴': 'الأردن',
  '🇱🇧': 'لبنان',
  '🇮🇶': 'العراق',
  '🇸🇾': 'سوريا',
  '🇵🇸': 'فلسطين',
  '🇾🇪': 'اليمن',
  '🇲🇦': 'المغرب',
  '🇩🇿': 'الجزائر',
  '🇹🇳': 'تونس',
  '🇱🇾': 'ليبيا',
  '🇸🇩': 'السودان',
  '🇹🇷': 'تركيا',
  '🇺🇸': 'أمريكا',
  '🇬🇧': 'بريطانيا',
};

function getCountryLabel(flagOrName?: string): { flag: string; name: string } {
  const raw = (flagOrName || '').trim();
  if (!raw) return { flag: '🇸🇦', name: 'السعودية' };
  if (COUNTRY_NAME_MAP[raw]) {
    return { flag: raw, name: COUNTRY_NAME_MAP[raw] };
  }
  const foundFlag = Object.keys(COUNTRY_NAME_MAP).find((f) => raw.includes(f));
  if (foundFlag) {
    return { flag: foundFlag, name: COUNTRY_NAME_MAP[foundFlag] };
  }
  return { flag: '🏴‍☠️', name: raw };
}

function renderPlayerAvatar(avatar?: string, sizeClass = 'text-3xl') {
  const val = (avatar || '').trim();
  if (val && (val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image'))) {
    return (
      <img
        src={val}
        alt="صورة القبطان"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover rounded-[inherit]"
      />
    );
  }
  return <span className={`leading-none select-none ${sizeClass}`}>{val || '⚓'}</span>;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  realPlayers,
  currentUser,
  currentGold = 0,
  currentGems = 0,
  leaderboardFilter,
  setLeaderboardFilter,
  handleOpenProfile,
  setActiveTab,
}) => {
  const initialCategory: LeaderboardCategory =
    leaderboardFilter === 'gems' ? 'gems' : leaderboardFilter === 'xp' || leaderboardFilter === 'boom' ? 'boom' : 'gold';

  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>(initialCategory);
  const [selectedCard, setSelectedCard] = useState<{ player: any; rank: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectCategory = (cat: LeaderboardCategory) => {
    setActiveCategory(cat);
    if (cat === 'boom') {
      setLeaderboardFilter('xp');
    } else {
      setLeaderboardFilter(cat);
    }
  };

  const rankedPlayers = useMemo(() => {
    const processed = realPlayers.map((p, idx) => {
      const rawName = (p.username || '').trim();
      const isPlaceholder = rawName === 'قبطان_الأعماق' || rawName === 'قبطان_البحار' || rawName === 'قبطان_مجهول';
      let cleanUsername = !isPlaceholder && rawName !== '' ? rawName : '';
      if (!cleanUsername) {
        if (p.email) {
          cleanUsername = p.email.split('@')[0];
        } else if (p.userId) {
          cleanUsername = `لاعب_${p.userId.slice(0, 4)}`;
        } else {
          cleanUsername = `قبطان_${idx + 1}`;
        }
      }

      const rawClan = (p.tribeName || '').trim();
      const isFakeClan = rawClan === 'أساطير الأعماق';
      const cleanClan = !isFakeClan && rawClan !== '' ? rawClan : '-';

      const isSelf = currentUser?.uid && (p.userId === currentUser.uid || p.id === currentUser.uid);
      const goldVal = isSelf && currentGold > (p.gold || 0) ? currentGold : (typeof p.gold === 'number' ? p.gold : 0);
      const gemsVal = isSelf && currentGems > (p.gems || 0) ? currentGems : (typeof p.gems === 'number' ? p.gems : 0);

      const boomVal =
        typeof p.boomPoints === 'number'
          ? p.boomPoints
          : typeof p.boomScore === 'number'
          ? p.boomScore
          : typeof p.exp === 'number'
          ? p.exp
          : 0;

      const countryInfo = getCountryLabel(p.country);

      return {
        ...p,
        id: p.id || p.userId || `rp-${idx}`,
        userId: p.userId || p.id,
        username: cleanUsername,
        clan: cleanClan,
        countryFlag: countryInfo.flag,
        countryName: countryInfo.name,
        avatar: p.avatar || '⚓',
        gold: goldVal,
        gems: gemsVal,
        boom: boomVal,
        isCurrentUser: Boolean(isSelf),
      };
    });

    processed.sort((a, b) => {
      if (activeCategory === 'gold') {
        return b.gold - a.gold || b.gems - a.gems;
      }
      if (activeCategory === 'gems') {
        return b.gems - a.gems || b.gold - a.gold;
      }
      return b.boom - a.boom || b.gold - a.gold;
    });

    return processed;
  }, [realPlayers, currentUser, currentGold, currentGems, activeCategory]);

  const getMetricValue = (player: any): number => {
    if (activeCategory === 'gold') return player.gold || 0;
    if (activeCategory === 'gems') return player.gems || 0;
    return player.boom || 0;
  };

  const formatFullNumber = (val: number): string => {
    if (!val || isNaN(val)) return '0';
    return Math.floor(val).toLocaleString('en-US');
  };

  const handleCopyFullNumber = async (player: any, val: number) => {
    const text = formatFullNumber(val);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Clipboard fallback ignored cleanly
    }
    setCopiedId(player.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === player.id ? null : prev));
    }, 1800);
  };

  const top1 = rankedPlayers[0];
  const top2 = rankedPlayers[1];
  const top3 = rankedPlayers[2];
  const remainingPlayers = rankedPlayers.slice(3);

  const categoryMeta = {
    gold: {
      title: 'ترتيب ملوك الذهب',
      subtitle: 'أغنى قباطنة البحار ثروة بالأرقام الكاملة',
      columnLabel: 'ثروة الذهب (الرقم الكامل)',
      modalSubtitle: 'ترتيب ملوك الذهب',
      modalTag: 'الذهب',
      icon: '🪙',
      accentText: 'text-amber-300',
      bannerBorder: 'border-amber-500/40',
      pillBorder: 'border-amber-500/55',
      pillText: 'text-amber-300',
      buttonBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950',
    },
    gems: {
      title: 'ترتيب ملوك الجواهر',
      subtitle: 'أصحاب الكنوز الكريستالية النادرة',
      columnLabel: 'الجواهر (الرقم الكامل)',
      modalSubtitle: 'ترتيب ملوك الجواهر',
      modalTag: 'الجواهر',
      icon: '💎',
      accentText: 'text-sky-300',
      bannerBorder: 'border-sky-500/40',
      pillBorder: 'border-sky-500/55',
      pillText: 'text-sky-300',
      buttonBg: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white',
    },
    boom: {
      title: 'ترتيب ملوك التفجير BOOM',
      subtitle: 'أقوى القادة تدميراً في المعارك البحرية',
      columnLabel: 'نقاط BOOM (الرقم الكامل)',
      modalSubtitle: 'ترتيب ملوك التفجير BOOM',
      modalTag: 'BOOM',
      icon: '🔥',
      accentText: 'text-red-400',
      bannerBorder: 'border-red-500/40',
      pillBorder: 'border-red-500/55',
      pillText: 'text-orange-400',
      buttonBg: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white',
    },
  }[activeCategory];

  return (
    <div
      className="fixed inset-0 z-[120] w-full h-full text-slate-100 flex flex-col items-center select-none overflow-y-auto overflow-x-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top, #10213a 0%, #091322 55%, #050a14 100%)',
        direction: 'rtl',
      }}
    >
      {/* Subtle ocean backdrop texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-15 bg-cover bg-center"
        style={{ backgroundImage: `url('/backgrounds/leaderboard_bg.jpg')` }}
      />

      {/* Centered Content Container - Sized generously for 1024px desktop viewport scale */}
      <div className="w-full max-w-[960px] px-4 sm:px-6 pt-5 pb-28 flex flex-col gap-5 relative z-10">

        {/* 1. TOP HEADER BAR (Title + Live Gold & Gems Balances) */}
        <div
          className="w-full rounded-3xl border-2 border-sky-400/25 px-5 py-4 shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(16, 30, 52, 0.96) 0%, rgba(10, 20, 36, 0.98) 100%)',
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-3.5">
            <span className="text-amber-400 text-3xl sm:text-4xl font-black tracking-wide drop-shadow">
              ملوك الأعماق
            </span>
            <span className="text-3xl sm:text-4xl">🔱</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Gold Balance */}
            <div className="flex items-center justify-between bg-[#0a1322]/95 border-2 border-amber-500/35 rounded-2xl px-4 sm:px-5 py-3 shadow-inner">
              <span className="text-amber-300 font-black text-xl sm:text-2xl tabular-nums truncate">
                {formatFullNumber(currentGold)}
              </span>
              <span className="text-2xl sm:text-3xl shrink-0 mr-2">🪙</span>
            </div>

            {/* Gems Balance */}
            <div className="flex items-center justify-between bg-[#0a1322]/95 border-2 border-sky-500/35 rounded-2xl px-4 sm:px-5 py-3 shadow-inner">
              <span className="text-sky-300 font-black text-xl sm:text-2xl tabular-nums truncate">
                {formatFullNumber(currentGems)}
              </span>
              <span className="text-2xl sm:text-3xl shrink-0 mr-2">💎</span>
            </div>
          </div>
        </div>

        {/* 2. THREE CATEGORY SELECTOR CARDS (الذهب | الجواهر | تفجير BOOM) */}
        <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
          {/* Gold Tab */}
          <button
            type="button"
            onClick={() => handleSelectCategory('gold')}
            className={`h-[88px] sm:h-[96px] rounded-2xl px-4 flex items-center justify-center gap-3 font-black text-xl sm:text-2xl transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              activeCategory === 'gold'
                ? 'border-2 border-amber-400 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.38)]'
                : 'border-2 border-slate-700/80 text-slate-300 hover:border-amber-500/45'
            }`}
            style={{
              background:
                activeCategory === 'gold'
                  ? 'linear-gradient(180deg, rgba(120, 74, 12, 0.78) 0%, rgba(28, 22, 16, 0.96) 100%)'
                  : 'linear-gradient(180deg, rgba(18, 30, 50, 0.94) 0%, rgba(11, 20, 34, 0.98) 100%)',
            }}
          >
            <span className="text-3xl sm:text-4xl">🪙</span>
            <span className="whitespace-nowrap">الذهب</span>
          </button>

          {/* Gems Tab */}
          <button
            type="button"
            onClick={() => handleSelectCategory('gems')}
            className={`h-[88px] sm:h-[96px] rounded-2xl px-4 flex items-center justify-center gap-3 font-black text-xl sm:text-2xl transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              activeCategory === 'gems'
                ? 'border-2 border-sky-400 text-white shadow-[0_0_25px_rgba(56,189,248,0.42)]'
                : 'border-2 border-slate-700/80 text-slate-300 hover:border-sky-500/45'
            }`}
            style={{
              background:
                activeCategory === 'gems'
                  ? 'linear-gradient(180deg, rgba(20, 102, 196, 0.88) 0%, rgba(12, 46, 108, 0.96) 100%)'
                  : 'linear-gradient(180deg, rgba(18, 30, 50, 0.94) 0%, rgba(11, 20, 34, 0.98) 100%)',
            }}
          >
            <span className="text-3xl sm:text-4xl">💎</span>
            <span className="whitespace-nowrap">الجواهر</span>
          </button>

          {/* BOOM Tab */}
          <button
            type="button"
            onClick={() => handleSelectCategory('boom')}
            className={`h-[88px] sm:h-[96px] rounded-2xl px-4 flex items-center justify-center gap-3 font-black text-lg sm:text-xl transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              activeCategory === 'boom'
                ? 'border-2 border-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.45)]'
                : 'border-2 border-slate-700/80 text-slate-300 hover:border-red-500/45'
            }`}
            style={{
              background:
                activeCategory === 'boom'
                  ? 'linear-gradient(180deg, rgba(175, 42, 22, 0.88) 0%, rgba(82, 16, 14, 0.96) 100%)'
                  : 'linear-gradient(180deg, rgba(18, 30, 50, 0.94) 0%, rgba(11, 20, 34, 0.98) 100%)',
            }}
          >
            <span className="text-3xl sm:text-4xl">🔥</span>
            <div className="flex flex-col leading-tight text-right">
              <span>تفجير</span>
              <span className="tracking-wider font-black">BOOM</span>
            </div>
          </button>
        </div>

        {/* 3. SECTION TITLE BANNER */}
        <div
          className={`w-full rounded-3xl border-2 ${categoryMeta.bannerBorder} px-6 py-4 text-center shadow-xl`}
          style={{
            background:
              activeCategory === 'gold'
                ? 'linear-gradient(180deg, rgba(32, 34, 46, 0.95) 0%, rgba(16, 22, 36, 0.98) 100%)'
                : activeCategory === 'gems'
                ? 'linear-gradient(180deg, rgba(16, 36, 62, 0.95) 0%, rgba(11, 22, 40, 0.98) 100%)'
                : 'linear-gradient(180deg, rgba(46, 20, 26, 0.95) 0%, rgba(18, 16, 28, 0.98) 100%)',
          }}
        >
          <div className={`flex items-center justify-center gap-3 text-2xl sm:text-3xl font-black ${categoryMeta.accentText}`}>
            <span>{categoryMeta.icon}</span>
            <span>{categoryMeta.title}</span>
            <span>{categoryMeta.icon}</span>
          </div>
          <p className="text-base sm:text-lg text-slate-300 font-bold mt-1.5">
            {categoryMeta.subtitle}
          </p>
        </div>

        {/* 4. TOP 3 DISPLAY */}
        {rankedPlayers.length > 0 ? (
          activeCategory === 'gold' ? (
            /* GOLD LAYOUT: 3 Stacked Full-Width Cards so huge exact gold numbers fit cleanly & prominently */
            <div className="flex flex-col gap-4">
              {/* Rank #1 Card */}
              {top1 && (
                <button
                  type="button"
                  onClick={() => setSelectedCard({ player: top1, rank: 1 })}
                  className="w-full text-right rounded-3xl border-2 border-amber-400/80 p-5 sm:p-6 transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_8px_28px_rgba(245,158,11,0.22)]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(72, 48, 14, 0.88) 0%, rgba(20, 28, 44, 0.96) 65%, rgba(14, 22, 36, 0.98) 100%)',
                  }}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0b1322] border-2 border-amber-400/85 flex items-center justify-center overflow-hidden shadow-lg">
                          {renderPlayerAvatar(top1.avatar, 'text-4xl sm:text-5xl')}
                        </div>
                        <span className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-black text-base flex items-center justify-center border-2 border-amber-100 shadow-md">
                          1
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-white truncate">
                            {top1.username}
                          </span>
                          <span className="text-2xl shrink-0">{top1.countryFlag}</span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-amber-400 mt-1 flex items-center gap-1.5">
                          <span>👑</span>
                          <span>ملك الذهب الأول</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full-width exact gold bar */}
                  <div className="w-full rounded-2xl bg-[#091220]/95 border-2 border-amber-400/55 px-5 py-3 flex items-center justify-center gap-3">
                    <span className="text-amber-300 font-black text-2xl sm:text-3xl tabular-nums tracking-tight break-all">
                      {formatFullNumber(top1.gold)}
                    </span>
                    <span className="text-2xl sm:text-3xl shrink-0">🪙</span>
                  </div>
                </button>
              )}

              {/* Rank #2 Card */}
              {top2 && (
                <button
                  type="button"
                  onClick={() => setSelectedCard({ player: top2, rank: 2 })}
                  className="w-full text-right rounded-3xl border-2 border-slate-400/50 px-5 py-4 flex items-center justify-between gap-4 transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(34, 46, 66, 0.88) 0%, rgba(14, 23, 38, 0.96) 100%)',
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0b1322] border-2 border-slate-300/65 flex items-center justify-center overflow-hidden">
                        {renderPlayerAvatar(top2.avatar, 'text-3xl sm:text-4xl')}
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-b from-slate-200 to-slate-400 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-white shadow">
                        2
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-white truncate">
                          {top2.username}
                        </span>
                        <span className="text-xl shrink-0">{top2.countryFlag}</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-slate-300 mt-0.5">الوصيف الفضي</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#091220]/95 border-2 border-slate-400/45 px-4 py-2.5 flex items-center gap-2 shrink-0 max-w-[56%]">
                    <span className="text-amber-300 font-black text-lg sm:text-2xl tabular-nums truncate">
                      {formatFullNumber(top2.gold)}
                    </span>
                    <span className="text-xl sm:text-2xl shrink-0">🪙</span>
                  </div>
                </button>
              )}

              {/* Rank #3 Card */}
              {top3 && (
                <button
                  type="button"
                  onClick={() => setSelectedCard({ player: top3, rank: 3 })}
                  className="w-full text-right rounded-3xl border-2 border-amber-700/70 px-5 py-4 flex items-center justify-between gap-4 transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(62, 34, 18, 0.85) 0%, rgba(14, 22, 36, 0.96) 100%)',
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0b1322] border-2 border-amber-600/75 flex items-center justify-center overflow-hidden">
                        {renderPlayerAvatar(top3.avatar, 'text-3xl sm:text-4xl')}
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-b from-amber-500 to-amber-800 text-amber-50 font-black text-sm flex items-center justify-center border-2 border-amber-300 shadow">
                        3
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-white truncate">
                          {top3.username}
                        </span>
                        <span className="text-xl shrink-0">{top3.countryFlag}</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-amber-400/95 mt-0.5">المركز البرونزي</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#091220]/95 border-2 border-amber-600/50 px-4 py-2.5 flex items-center gap-2 shrink-0 max-w-[56%]">
                    <span className="text-amber-300 font-black text-lg sm:text-2xl tabular-nums truncate">
                      {formatFullNumber(top3.gold)}
                    </span>
                    <span className="text-xl sm:text-2xl shrink-0">🪙</span>
                  </div>
                </button>
              )}
            </div>
          ) : (
            /* GEMS & BOOM LAYOUT: 3-Column Podium (#2 Right, #1 Elevated Center with Crown, #3 Left in RTL) */
            <div className="grid grid-cols-3 gap-3.5 sm:gap-5 items-end pt-4">
              {/* Column 1 (Right in RTL): Rank #2 */}
              {top2 ? (
                <button
                  type="button"
                  onClick={() => setSelectedCard({ player: top2, rank: 2 })}
                  className="rounded-3xl border-2 border-slate-400/55 p-3.5 sm:p-4 flex flex-col items-center justify-between min-h-[215px] sm:min-h-[235px] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(28, 42, 66, 0.94) 0%, rgba(12, 21, 36, 0.98) 100%)',
                  }}
                >
                  <div className="relative flex flex-col items-center mt-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#091220] border-2 border-slate-300/75 flex items-center justify-center overflow-hidden shadow-md">
                      {renderPlayerAvatar(top2.avatar, 'text-3xl sm:text-4xl')}
                    </div>
                    <span className="-mt-3 w-7 h-7 rounded-full bg-slate-200 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-white shadow">
                      2
                    </span>
                  </div>

                  <span className="text-base sm:text-lg font-black text-white text-center truncate w-full my-2.5">
                    {top2.username}
                  </span>

                  <div className={`w-full rounded-xl bg-[#08101d] border-2 ${categoryMeta.pillBorder} px-2.5 py-2 flex items-center justify-center gap-1.5`}>
                    <span className={`text-base sm:text-xl font-black tabular-nums truncate ${categoryMeta.pillText}`}>
                      {formatFullNumber(getMetricValue(top2))}
                    </span>
                    <span className="text-base sm:text-lg shrink-0">{categoryMeta.icon}</span>
                  </div>
                </button>
              ) : (
                <div />
              )}

              {/* Column 2 (Center): Rank #1 Elevated */}
              {top1 ? (
                <button
                  type="button"
                  onClick={() => setSelectedCard({ player: top1, rank: 1 })}
                  className={`rounded-3xl border-2 ${
                    activeCategory === 'boom' ? 'border-red-500/85 shadow-[0_0_28px_rgba(239,68,68,0.32)]' : 'border-amber-400/85 shadow-[0_0_28px_rgba(245,158,11,0.28)]'
                  } p-4 sm:p-5 flex flex-col items-center justify-between min-h-[250px] sm:min-h-[275px] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative`}
                  style={{
                    background:
                      activeCategory === 'boom'
                        ? 'linear-gradient(180deg, rgba(68, 22, 24, 0.96) 0%, rgba(16, 20, 34, 0.98) 100%)'
                        : 'linear-gradient(180deg, rgba(22, 56, 98, 0.96) 0%, rgba(12, 24, 42, 0.98) 100%)',
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl leading-none mb-1 drop-shadow">👑</span>
                    <div
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#091220] border-2 ${
                        activeCategory === 'boom' ? 'border-red-400' : 'border-amber-400'
                      } flex items-center justify-center overflow-hidden shadow-lg`}
                    >
                      {renderPlayerAvatar(top1.avatar, 'text-4xl sm:text-5xl')}
                    </div>
                    <span className="-mt-3.5 w-8 h-8 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-black text-base flex items-center justify-center border-2 border-amber-100 shadow">
                      1
                    </span>
                  </div>

                  <span className="text-lg sm:text-xl font-black text-white text-center truncate w-full my-2.5">
                    {top1.username}
                  </span>

                  <div className={`w-full rounded-xl bg-[#08101d] border-2 ${categoryMeta.pillBorder} px-3 py-2 flex items-center justify-center gap-1.5`}>
                    <span className={`text-lg sm:text-2xl font-black tabular-nums truncate ${categoryMeta.pillText}`}>
                      {formatFullNumber(getMetricValue(top1))}
                    </span>
                    <span className="text-lg sm:text-xl shrink-0">{categoryMeta.icon}</span>
                  </div>
                </button>
              ) : (
                <div />
              )}

              {/* Column 3 (Left in RTL): Rank #3 */}
              {top3 ? (
                <button
                  type="button"
                  onClick={() => setSelectedCard({ player: top3, rank: 3 })}
                  className="rounded-3xl border-2 border-amber-700/70 p-3.5 sm:p-4 flex flex-col items-center justify-between min-h-[215px] sm:min-h-[235px] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(52, 30, 18, 0.94) 0%, rgba(14, 21, 34, 0.98) 100%)',
                  }}
                >
                  <div className="relative flex flex-col items-center mt-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#091220] border-2 border-amber-600/80 flex items-center justify-center overflow-hidden shadow-md">
                      {renderPlayerAvatar(top3.avatar, 'text-3xl sm:text-4xl')}
                    </div>
                    <span className="-mt-3 w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-sm flex items-center justify-center border-2 border-amber-400 shadow">
                      3
                    </span>
                  </div>

                  <span className="text-base sm:text-lg font-black text-white text-center truncate w-full my-2.5">
                    {top3.username}
                  </span>

                  <div className={`w-full rounded-xl bg-[#08101d] border-2 ${categoryMeta.pillBorder} px-2.5 py-2 flex items-center justify-center gap-1.5`}>
                    <span className={`text-base sm:text-xl font-black tabular-nums truncate ${categoryMeta.pillText}`}>
                      {formatFullNumber(getMetricValue(top3))}
                    </span>
                    <span className="text-base sm:text-lg shrink-0">{categoryMeta.icon}</span>
                  </div>
                </button>
              ) : (
                <div />
              )}
            </div>
          )
        ) : (
          <div className="w-full py-12 text-center bg-[#0d192b]/90 border-2 border-slate-700/70 rounded-3xl px-5 text-slate-200 font-bold text-lg sm:text-xl">
            لا توجد حسابات مسجلة في هذا الترتيب حالياً. كن أول قبطان يعتلي الصدارة! ⚓
          </div>
        )}

        {/* 5. PLAYERS TABLE (#4 and below) */}
        <div className="w-full rounded-3xl border-2 border-slate-700/75 bg-[#0d1728]/95 overflow-hidden shadow-2xl">
          {/* Header Row */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-slate-700/65 bg-[#122036]/95 text-base sm:text-lg font-black text-slate-300">
            <div className="flex items-center gap-4">
              <span className="w-7 text-center">#</span>
              <span>اللاعب</span>
            </div>
            <span>{categoryMeta.columnLabel}</span>
          </div>

          {/* Player Rows */}
          <div className="divide-y-2 divide-slate-800/80">
            {remainingPlayers.length > 0 ? (
              remainingPlayers.slice(0, 50).map((player, idx) => {
                const rank = idx + 4;
                const metricVal = getMetricValue(player);
                return (
                  <button
                    key={player.id || idx}
                    type="button"
                    onClick={() => setSelectedCard({ player, rank })}
                    className={`w-full flex items-center justify-between gap-3.5 px-5 py-4 text-right transition-colors duration-150 hover:bg-slate-800/55 active:bg-slate-800/85 cursor-pointer ${
                      player.isCurrentUser ? 'bg-amber-950/25' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-7 text-center text-lg sm:text-xl font-black text-slate-400 tabular-nums shrink-0">
                        {rank}
                      </span>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#091220] border-2 border-slate-700/85 flex items-center justify-center overflow-hidden shrink-0">
                        {renderPlayerAvatar(player.avatar, 'text-3xl')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg sm:text-xl font-black truncate ${player.isCurrentUser ? 'text-amber-300' : 'text-white'}`}>
                            {player.username}
                          </span>
                          <span className="text-xl shrink-0">{player.countryFlag}</span>
                        </div>
                        {(player.clan && player.clan !== '-') || player.countryName ? (
                          <div className="text-sm sm:text-base text-slate-400 font-bold truncate mt-0.5">
                            {player.clan && player.clan !== '-' ? player.clan : player.countryName}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className={`rounded-2xl bg-[#091220] border-2 ${categoryMeta.pillBorder} px-4 py-2 flex items-center gap-2 shrink-0 max-w-[52%]`}>
                      <span className={`text-base sm:text-xl font-black tabular-nums truncate ${categoryMeta.pillText}`}>
                        {formatFullNumber(metricVal)}
                      </span>
                      <span className="text-lg sm:text-xl shrink-0">{categoryMeta.icon}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-7 px-5 text-center text-base sm:text-lg text-slate-400 font-bold">
                {rankedPlayers.length > 0
                  ? 'جميع اللاعبين المسجلين معروضون في المراكز الثلاثة الأولى أعلاه.'
                  : 'لا يوجد لاعبون آخرون في هذا التصنيف حالياً.'}
              </div>
            )}
          </div>

          {/* Table Hint Footer */}
          <div className="px-5 py-3.5 border-t-2 border-slate-800/80 bg-[#0a1322]/95 text-center text-sm sm:text-base text-slate-300 font-bold">
            👆 اضغط على أي لاعب لعرض بطاقته الشخصية ونسخ رقمه بالكامل
          </div>
        </div>

        {/* 6. BOTTOM RETURN TO HARBOR BUTTON */}
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('harbor')}
            className="w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-lg sm:text-xl text-white border-2 border-sky-400/45 bg-[#132033]/95 hover:bg-[#1a2c46] transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-3 shadow-2xl"
          >
            <Anchor className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400" />
            <span>إغلاق والعودة للميناء</span>
          </button>
        </div>
      </div>

      {/* 7. PLAYER QUICK CARD MODAL (on clicking any player) */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="w-full max-w-[480px] rounded-3xl border-2 border-slate-600/80 bg-[#121e31] p-7 sm:p-8 shadow-2xl relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X button */}
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              aria-label="إغلاق"
              className="absolute top-5 left-5 w-10 h-10 rounded-full bg-slate-800/95 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Centered Avatar */}
            <div
              className={`w-28 h-28 rounded-3xl bg-[#0a1322] border-2 ${
                selectedCard.rank === 1
                  ? 'border-amber-400'
                  : activeCategory === 'gems'
                  ? 'border-sky-400/80'
                  : activeCategory === 'boom'
                  ? 'border-red-500/80'
                  : 'border-slate-500'
              } flex items-center justify-center overflow-hidden shadow-xl mt-1 mb-4`}
            >
              {renderPlayerAvatar(selectedCard.player.avatar, 'text-5xl')}
            </div>

            {/* Rank & Category Pill */}
            <div
              className={`px-5 py-1.5 rounded-full text-sm sm:text-base font-black border-2 mb-3 ${
                activeCategory === 'gold'
                  ? 'bg-amber-950/75 border-amber-500/55 text-amber-300'
                  : activeCategory === 'gems'
                  ? 'bg-sky-950/75 border-sky-400/55 text-sky-300'
                  : 'bg-red-950/75 border-red-500/55 text-red-300'
              }`}
            >
              المركز #{selectedCard.rank} • {categoryMeta.modalTag}
            </div>

            {/* Player Name */}
            <h3 className="text-3xl sm:text-4xl font-black text-white text-center leading-snug">
              {selectedCard.player.username}
            </h3>
            <p className="text-sm sm:text-base text-slate-400 font-bold mt-1 mb-5">
              {categoryMeta.modalSubtitle}
            </p>

            {/* Full Exact Number Box + Copy Button */}
            <div className="w-full rounded-2xl bg-[#0b1423] border-2 border-slate-700/85 p-5 flex flex-col items-center gap-3 mb-4">
              <span className="text-sm sm:text-base text-slate-300 font-bold">
                {categoryMeta.columnLabel}
              </span>
              <div className="flex items-center justify-center gap-2.5 max-w-full">
                <span className={`text-2xl sm:text-3xl font-black tabular-nums break-all text-center ${categoryMeta.pillText}`}>
                  {formatFullNumber(getMetricValue(selectedCard.player))}
                </span>
                <span className="text-2xl sm:text-3xl shrink-0">{categoryMeta.icon}</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyFullNumber(selectedCard.player, getMetricValue(selectedCard.player))}
                className="px-5 py-2.5 rounded-xl bg-slate-800/95 hover:bg-slate-700 border border-slate-600/80 text-slate-100 text-sm sm:text-base font-black flex items-center gap-2 cursor-pointer transition-colors"
              >
                {copiedId === selectedCard.player.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">تم نسخ الرقم بالكامل</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>نسخ الرقم بالكامل</span>
                  </>
                )}
              </button>
            </div>

            {/* Country & Clan Grid */}
            <div className="w-full grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl bg-[#0b1423] border border-slate-700/75 p-3.5 text-center">
                <div className="text-xs sm:text-sm text-slate-400 font-bold mb-1">القبيلة</div>
                <div className="text-base sm:text-lg font-black text-slate-100 truncate">
                  {selectedCard.player.clan || '-'}
                </div>
              </div>
              <div className="rounded-2xl bg-[#0b1423] border border-slate-700/75 p-3.5 text-center">
                <div className="text-xs sm:text-sm text-slate-400 font-bold mb-1">الدولة</div>
                <div className="text-base sm:text-lg font-black text-slate-100 flex items-center justify-center gap-1.5 truncate">
                  <span>{selectedCard.player.countryFlag}</span>
                  <span>{selectedCard.player.countryName}</span>
                </div>
              </div>
            </div>

            {/* Primary Close Card Button + Optional Harbor Visit Action */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className={`w-full py-4 rounded-2xl font-black text-lg sm:text-xl shadow-xl cursor-pointer transition-all active:scale-[0.98] ${categoryMeta.buttonBg}`}
              >
                إغلاق البطاقة
              </button>

              {!selectedCard.player.isCurrentUser && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedCard.player;
                    setSelectedCard(null);
                    handleOpenProfile(target);
                  }}
                  className="w-full py-3 rounded-2xl font-bold text-base text-sky-300 bg-[#0b1423] hover:bg-slate-800/85 border border-sky-500/35 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>زيارة ميناء اللاعب</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
