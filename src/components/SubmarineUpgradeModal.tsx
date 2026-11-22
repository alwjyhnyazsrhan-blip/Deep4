import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, Sparkles, ArrowLeft } from 'lucide-react';
import { ShipState } from '../types';
import {
  SHOP_SHIPS,
  SUBMARINE_UPGRADE_RULES,
  getSubmarineUpgradeRule,
  getSubmarineDisplayTier,
  getShipMaxHeart,
} from '../data';
import ShipImage from './ShipImage';
import {
  executeFinancialTransaction,
  isNetworkOnline,
  notifyOfflineBlocked,
} from '../services/financialTransaction';

interface SubmarineUpgradeModalProps {
  ships: ShipState[];
  setShips: React.Dispatch<React.SetStateAction<ShipState[]>>;
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  initialShipId?: string;
  onClose: () => void;
}

export const SubmarineUpgradeModal: React.FC<SubmarineUpgradeModalProps> = ({
  ships,
  setShips,
  gold,
  setGold,
  initialShipId,
  onClose,
}) => {
  const ownedSubmarines = ships.filter(
    (s) => s.exists && typeof s.level === 'number' && s.level >= 32 && s.level <= 37
  );

  const [selectedShipId, setSelectedShipId] = useState<string>(() => {
    if (initialShipId && ownedSubmarines.some((s) => s.id === initialShipId)) {
      return initialShipId;
    }
    const upgradable = ownedSubmarines.find((s) => (s.level || 32) < 37);
    return upgradable?.id || ownedSubmarines[0]?.id || '';
  });

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [attemptResult, setAttemptResult] = useState<{
    type: 'success' | 'fail';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!ownedSubmarines.some((s) => s.id === selectedShipId) && ownedSubmarines[0]) {
      setSelectedShipId(ownedSubmarines[0].id);
    }
  }, [ownedSubmarines, selectedShipId]);

  const activeSub =
    ownedSubmarines.find((s) => s.id === selectedShipId) || ownedSubmarines[0] || null;

  if (!activeSub) {
    return null;
  }

  const currentLevel = activeSub.level || 32;
  const currentSpec = SHOP_SHIPS.find((s) => s.level === currentLevel);
  const rule = getSubmarineUpgradeRule(currentLevel);
  const nextSpec = rule ? SHOP_SHIPS.find((s) => s.level === rule.toLevel) : null;
  const failStreak = Math.max(0, Math.min(2, activeSub.upgradeFailStreak || 0));
  const isGuaranteed = failStreak >= 2;
  const isMaxLevel = currentLevel >= 37 || !rule || !nextSpec;

  const effectiveSuccessRate = rule ? (isGuaranteed ? 100 : rule.successRate) : 100;
  const effectiveFailRate = rule ? (isGuaranteed ? 0 : rule.failRate) : 0;
  const canAfford = rule ? gold >= rule.cost : false;

  const formatMillionLabel = (cost: number): string => {
    const millions = cost / 1_000_000;
    return `${millions} مليون ذهب`;
  };

  const handleAttemptUpgrade = async () => {
    if (!rule || !nextSpec || isUpgrading) return;

    if (!isNetworkOnline()) {
      notifyOfflineBlocked('ترقية الغواصة');
      return;
    }

    if (gold < rule.cost) {
      setAttemptResult({
        type: 'fail',
        title: 'الذهب غير كافٍ للترقية',
        message: `تحتاج إلى ${rule.cost.toLocaleString('en-US')} ذهب (${formatMillionLabel(
          rule.cost
        )}) لإجراء ${rule.title}. رصيدك الحالي: ${gold.toLocaleString('en-US')} ذهب.`,
      });
      return;
    }

    setIsUpgrading(true);
    setAttemptResult(null);

    const roll = Math.random() * 100;
    const succeeded = isGuaranteed || roll < rule.successRate;

    const updatedShips = ships.map((s) => {
      if (s.id !== activeSub.id) return s;

      if (succeeded) {
        const nextEnergy = getShipMaxHeart({ ...s, level: nextSpec.level, cargo: nextSpec.cargo });
        return {
          ...s,
          name: nextSpec.name,
          level: nextSpec.level,
          hook: nextSpec.hook,
          cargo: nextSpec.cargo,
          heart: nextEnergy,
          maxHeart: nextEnergy,
          energySyncedToCargo: true,
          durationStr: nextSpec.durationStr,
          power: nextSpec.power,
          armor: nextSpec.armor,
          fishTypes: nextSpec.fishTypes,
          imgEmoji: nextSpec.emoji,
          exists: true,
          upgradeFailStreak: 0,
        };
      }

      return {
        ...s,
        upgradeFailStreak: Math.min(2, failStreak + 1),
      };
    });

    const reasonText = succeeded
      ? `${rule.title}: نجاح ترقية الغواصة إلى ${nextSpec.name}`
      : `${rule.title}: محاولة ترقية الغواصة (فشل ${failStreak + 1}/2)`;

    const res = await executeFinancialTransaction({
      goldDelta: -rule.cost,
      ships: updatedShips,
      reason: reasonText,
      onLocalApply: () => {
        setGold((prev) => prev - rule.cost);
        setShips(updatedShips);
        try {
          localStorage.setItem('pirate_ships_v2', JSON.stringify(updatedShips));
        } catch {}
      },
    });

    setIsUpgrading(false);

    if (!res.success) {
      return;
    }

    if (typeof res.newGold === 'number') {
      setGold(res.newGold);
    }
    setShips(updatedShips);
    try {
      localStorage.setItem('pirate_ships_v2', JSON.stringify(updatedShips));
    } catch {}

    if (succeeded) {
      setAttemptResult({
        type: 'success',
        title: rule.isMax
          ? '👑 تهانينا! وصلت الغواصة إلى أقصى مستوى (MAX)'
          : `🎉 نجحت ${rule.title}!`,
        message: rule.isMax
          ? `تم تطوير غواصتك بنجاح إلى ${getSubmarineDisplayTier(nextSpec.level)} وتم تصفير عداد المحاولات.`
          : `تمت ترقية غواصتك إلى ${getSubmarineDisplayTier(nextSpec.level)} (${nextSpec.name}) بنجاح!${
              isGuaranteed ? ' (بفضل الضمان المؤكد للمحاولة الثالثة)' : ''
            }`,
      });
    } else {
      const nextStreak = Math.min(2, failStreak + 1);
      setAttemptResult({
        type: 'fail',
        title: `💥 فشلت ${rule.title} هذه المرة!`,
        message:
          nextStreak >= 2
            ? 'فشلت الترقية للمرة الثانية على التوالي. ⚡ المحاولة الثالثة القادمة مضمونة النجاح 100%!'
            : 'فشلت محاولة الترقية (1 من 2). إذا فشلت محاولة ثانية، فستكون المحاولة الثالثة مضمونة النجاح 100%!',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto"
      style={{ direction: 'rtl' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUpgrading) onClose();
      }}
    >
      <div
        className="w-full max-w-[820px] my-auto rounded-3xl border-2 border-indigo-400/70 bg-[#0b1324] text-white shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0f1b33 0%, #080f1e 100%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 36px rgba(99, 102, 241, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/30 bg-[#111f3b]/90">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤿</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300">
                نظام ترقيات الغواصة – ملوك الأعماق
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-bold mt-0.5">
                رصيدك الحالي: <span className="text-amber-300 tabular-nums">{gold.toLocaleString('en-US')}</span> 🪙
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isUpgrading}
            onClick={onClose}
            aria-label="إغلاق"
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Switcher if user owns multiple submarines */}
          {ownedSubmarines.length > 1 && (
            <div className="flex items-center gap-2.5 flex-wrap bg-[#09101f] border border-slate-700/80 rounded-2xl p-3">
              <span className="text-sm font-black text-slate-300 ml-1">اختر الغواصة:</span>
              {ownedSubmarines.map((sub, i) => {
                const isSel = sub.id === activeSub.id;
                const lvl = sub.level || 32;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSelectedShipId(sub.id);
                      setAttemptResult(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-sm font-black border cursor-pointer transition-all ${
                      isSel
                        ? 'bg-indigo-600/35 border-indigo-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    غواصة #{i + 1} ({getSubmarineDisplayTier(lvl)})
                  </button>
                );
              })}
            </div>
          )}

          {/* Visual Preview: Current -> Next */}
          <div className="rounded-2xl border border-indigo-500/35 bg-[#091224]/90 p-4 sm:p-5">
            {isMaxLevel ? (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <ShipImage level={37} width={210} plain />
                <div className="px-5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-base">
                  👑 الغواصة في أقصى مستوى (MAX)
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {currentSpec?.name}
                </h3>
                <p className="text-sm sm:text-base text-slate-300 max-w-lg">
                  {currentSpec?.description}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-4">
                {/* Current Submarine */}
                <div className="sm:col-span-5 flex flex-col items-center bg-[#0d1830] border border-slate-700/80 rounded-2xl p-4">
                  <span className="text-xs font-black text-slate-400 mb-2">المستوى الحالي</span>
                  <ShipImage level={currentLevel} width={155} plain />
                  <div className="mt-2 text-base font-black text-white text-center">
                    {getSubmarineDisplayTier(currentLevel)}
                  </div>
                  <div className="text-xs text-sky-300 font-bold mt-1 tabular-nums">
                    السعة: {(currentSpec?.cargo || 125000).toLocaleString('en-US')} سمكة
                  </div>
                </div>

                {/* Arrow */}
                <div className="sm:col-span-1 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                    <ArrowLeft className="w-5 h-5" />
                  </div>
                </div>

                {/* Next Submarine */}
                <div className="sm:col-span-5 flex flex-col items-center bg-[#101c3a] border-2 border-amber-400/60 rounded-2xl p-4 shadow-lg">
                  <span className="text-xs font-black text-amber-300 mb-2">
                    {rule.title}
                  </span>
                  <ShipImage level={rule.toLevel} width={155} plain />
                  <div className="mt-2 text-base font-black text-amber-200 text-center">
                    {getSubmarineDisplayTier(rule.toLevel)}
                  </div>
                  <div className="text-xs text-emerald-300 font-bold mt-1 tabular-nums">
                    السعة: {(nextSpec.cargo || 155000).toLocaleString('en-US')} سمكة
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5-Stage Upgrade Roadmap */}
          <div className="grid grid-cols-5 gap-2">
            {SUBMARINE_UPGRADE_RULES.map((step) => {
              const isCompleted = currentLevel >= step.toLevel;
              const isCurrent = rule?.stepNumber === step.stepNumber;
              return (
                <div
                  key={step.stepNumber}
                  className={`rounded-xl p-2.5 text-center border transition-all ${
                    isCompleted
                      ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'
                      : isCurrent
                      ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.25)]'
                      : 'bg-[#091222] border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-black">
                    {step.isMax ? '5 (MAX)' : `ترقية ${step.stepNumber}`}
                  </div>
                  <div className="text-[11px] font-bold mt-1 tabular-nums">
                    {step.cost / 1_000_000} مليون
                  </div>
                  <div className="text-[11px] font-bold mt-0.5 tabular-nums">
                    نجاح {step.successRate}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result Banner (after an attempt) */}
          {attemptResult && (
            <div
              className={`rounded-2xl border-2 p-4 flex items-start gap-3 ${
                attemptResult.type === 'success'
                  ? 'bg-emerald-950/75 border-emerald-400 text-emerald-100'
                  : 'bg-red-950/75 border-red-400 text-red-100'
              }`}
            >
              {attemptResult.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-base sm:text-lg font-black">{attemptResult.title}</div>
                <div className="text-sm font-bold mt-1 opacity-95">{attemptResult.message}</div>
              </div>
            </div>
          )}

          {/* Current Attempt Details + Pity Guarantee + Action Button */}
          {!isMaxLevel && rule && (
            <div className="rounded-2xl border border-slate-700/80 bg-[#091120] p-4 sm:p-5 space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-[#0e1930] border border-amber-500/35 p-3">
                  <div className="text-xs text-slate-400 font-bold">سعر الترقية</div>
                  <div className="text-base sm:text-lg font-black text-amber-300 mt-1 tabular-nums">
                    {formatMillionLabel(rule.cost)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold tabular-nums">
                    ({rule.cost.toLocaleString('en-US')})
                  </div>
                </div>

                <div className="rounded-xl bg-[#0e1930] border border-emerald-500/35 p-3">
                  <div className="text-xs text-slate-400 font-bold">نسبة النجاح</div>
                  <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                    {effectiveSuccessRate}%
                  </div>
                  {isGuaranteed && (
                    <div className="text-[11px] text-emerald-300 font-black">مضمونة!</div>
                  )}
                </div>

                <div className="rounded-xl bg-[#0e1930] border border-red-500/35 p-3">
                  <div className="text-xs text-slate-400 font-bold">نسبة الفشل</div>
                  <div className="text-lg sm:text-2xl font-black text-red-400 mt-1 tabular-nums">
                    {effectiveFailRate}%
                  </div>
                </div>
              </div>

              {/* Pity Counter Banner */}
              <div
                className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-3 ${
                  isGuaranteed
                    ? 'bg-emerald-950/65 border-emerald-400 text-emerald-200'
                    : 'bg-slate-900/90 border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck
                    className={`w-5 h-5 shrink-0 ${
                      isGuaranteed ? 'text-emerald-400' : 'text-sky-400'
                    }`}
                  />
                  <div className="text-xs sm:text-sm font-bold">
                    {isGuaranteed
                      ? '⚡ المحاولة الثالثة الآن مضمونة النجاح 100% بعد فشل الترقية مرتين!'
                      : 'إذا فشلت الترقية مرتين، تكون المحاولة الثالثة مضمونة النجاح 100%.'}
                  </div>
                </div>

                <div className="shrink-0 px-3 py-1 rounded-lg bg-black/40 border border-slate-600 text-xs sm:text-sm font-black tabular-nums">
                  الفشل: {failStreak} / 2
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isUpgrading || !canAfford}
                onClick={handleAttemptUpgrade}
                className={`w-full py-4 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99] shadow-xl ${
                  isUpgrading
                    ? 'bg-slate-700 text-slate-300 cursor-wait'
                    : !canAfford
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    : isGuaranteed
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white border-2 border-emerald-300'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-2 border-amber-300'
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span>
                  {isUpgrading
                    ? 'جاري تنفيذ الترقية...'
                    : !canAfford
                    ? `تحتاج إلى ${rule.cost.toLocaleString('en-US')} ذهب`
                    : `${rule.title} الآن — ${rule.cost.toLocaleString('en-US')} 🪙`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
