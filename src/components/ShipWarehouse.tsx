import React, { useEffect, useState } from 'react';
import { ShipState } from '../types';
import ShipImage from './ShipImage';
import ShipCrewMember, { CREW_VISUAL_MAP, sanitizeShipCrew } from './ShipCrewMember';
import { SHOP_SHIPS, GOLD_COIN_ICON, getShipDataByLevel, ShipData, SHIP_BACKGROUND_IMAGE, FISH_REWARD_DATA, getSubmarineDisplayTier, getSubmarineTag, getSubmarineUpgradeRule, getSubmarineFishInfo, getFishImageUrl, normalizeShipEnergyToCargo } from '../data';
import { executeFinancialTransaction, isNetworkOnline, notifyOfflineBlocked } from '../services/financialTransaction';
import { SubmarineUpgradeModal } from './SubmarineUpgradeModal';
import {
  getShipFishingDurationMs,
  getShipFishingTimerState,
  formatFishingCountdown,
} from '../utils/fishingTimer';

interface ShipWarehouseProps {
  shipTowerLevel: number;
  setShipTowerLevel: React.Dispatch<React.SetStateAction<number>>;
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  gems: number;
  setGems: React.Dispatch<React.SetStateAction<number>>;
  ships: ShipState[];
  setShips: React.Dispatch<React.SetStateAction<ShipState[]>>;
  buyShipLevel: (spec: any) => void;
  crewServices?: Record<string, any>;
  setCrewServices?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onClose?: () => void;
}

const getFishEmoji = (fish: string): string => {
  if (FISH_REWARD_DATA[fish]?.emoji) {
    return FISH_REWARD_DATA[fish].emoji;
  }
  const clean = fish.replace(/^ال/, '').trim();
  if (FISH_REWARD_DATA[clean]?.emoji) {
    return FISH_REWARD_DATA[clean].emoji;
  }
  return '🐟';
};

export default function ShipWarehouse({
  shipTowerLevel,
  setShipTowerLevel,
  gold,
  setGold,
  gems,
  setGems,
  ships,
  setShips,
  buyShipLevel,
  crewServices,
  setCrewServices,
  onClose,
}: ShipWarehouseProps) {
  const activeShips = ships.filter((s) => s.exists);
  const [timerNow, setTimerNow] = useState<number>(() => Date.now());
  const [showSubmarineUpgradeModal, setShowSubmarineUpgradeModal] = useState(false);
  const [upgradeSubmarineShipId, setUpgradeSubmarineShipId] = useState<string | undefined>(undefined);
  const hasAnyFishingShip = activeShips.some((s) => s.status === 'fishing');

  useEffect(() => {
    if (!hasAnyFishingShip) return;
    setTimerNow(Date.now());
    const interval = setInterval(() => setTimerNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasAnyFishingShip]);

  const upgradeStat = async (shipId: string, stat: 'speed' | 'capacity' | 'defense') => {
    if (!isNetworkOnline()) {
      notifyOfflineBlocked('ترقية صفات القارب');
      return;
    }

    const ship = ships.find((s) => s.id === shipId);
    if (!ship) return;

    const currentLvl =
      stat === 'speed'
        ? ship.speedLevel || 1
        : stat === 'capacity'
          ? ship.capacityLevel || 1
          : ship.defenseLevel || 1;

    if (currentLvl >= 10) {
      alert('⚠️ هذا التطوير وصل للحد الأقصى (مستوى 10)!');
      return;
    }

    const cost = currentLvl * 250;
    if (gold < cost) {
      alert(`⚠️ الذهب غير كافٍ! تحتاج إلى ${cost} عملة ذهبية لتطوير هذه الصفة.`);
      return;
    }

    const newShips = ships.map((s) => {
      if (s.id === shipId) {
        const upgraded = {
          ...s,
          speedLevel: stat === 'speed' ? currentLvl + 1 : s.speedLevel || 1,
          capacityLevel: stat === 'capacity' ? currentLvl + 1 : s.capacityLevel || 1,
          defenseLevel: stat === 'defense' ? currentLvl + 1 : s.defenseLevel || 1,
        };
        return stat === 'capacity' ? normalizeShipEnergyToCargo(upgraded) : upgraded;
      }
      return s;
    });

    const statName = stat === 'speed' ? 'السرعة' : stat === 'capacity' ? 'السعة' : 'الدفاع الفولاذي';

    const res = await executeFinancialTransaction({
      goldDelta: -cost,
      ships: newShips,
      reason: `ترقية صفة ${statName} للقارب`,
      onLocalApply: () => {
        setGold((prev) => prev - cost);
        setShips(newShips);
      }
    });

    if (res.success) {
      if (typeof res.newGold === 'number') {
        setGold(res.newGold);
      }
      setShips(newShips);
      alert(`🎉 تم ترقية صفة ${statName} بنجاح عبر المعاملة السحابية الذرية!`);
    }
  };

  const sellShip = async (shipId: string) => {
    if (!isNetworkOnline()) {
      notifyOfflineBlocked('بيع وتفكيك القارب');
      return;
    }

    const ship = ships.find((s) => s.id === shipId);
    if (!ship) return;

    if (ship.level === 0) {
      alert(`⚠️ لا يمكن تفكيك هذا القارب لأنه في المستوى الأدنى بالفعل (مستوى 0)!`);
      return;
    }
    
    const spec = SHOP_SHIPS.find((s) => s.level === ship.level) || SHOP_SHIPS[0];
    const refund = Math.floor(spec.price * 0.5);
    
    if (confirm(`هل أنت متأكد من تفكيك وتنزيل ${ship.name} وإعادتها إلى قارب صياد مبتدئ (مستوى 0) مقابل استرداد 🪙 ${refund.toLocaleString('ar-EG')} ذهب؟`)) {
      const newShips = ships.map((s) => {
        if (s.id === shipId) {
          return {
            ...s,
            name: 'قارب خشبي متهالك',
            level: 0,
            hook: 25,
            cargo: 2000,
            heart: 2000,
            maxHeart: 2000,
            energySyncedToCargo: true,
            durationStr: '00:30',
            power: 5,
            armor: 5,
            fishTypes: ['سردين', 'أنشوجة'],
            imgEmoji: '🛶',
            speedLevel: 1,
            capacityLevel: 1,
            defenseLevel: 1,
            assignedCrew: [],
            crewPower: 0,
            autoFishingPaused: false,
          };
        }
        return s;
      });

      const remainingAssigned = newShips.filter(s => s.exists).flatMap(s => s.assignedCrew || []);
      const updatedCrewServices = crewServices ? {
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
        market_expert: remainingAssigned.includes('market_expert'),
        fixer_sm: remainingAssigned.includes('fixer_sm') || remainingAssigned.includes('repairer_small'),
        fixer_md: remainingAssigned.includes('fixer_md') || remainingAssigned.includes('repairer_medium'),
        fixer_lg: remainingAssigned.includes('fixer_lg') || remainingAssigned.includes('repairer_large'),
        fixer_epic: remainingAssigned.includes('fixer_epic') || remainingAssigned.includes('repairer_legendary'),
      } : undefined;

      const res = await executeFinancialTransaction({
        goldDelta: refund,
        ships: newShips,
        crewServices: updatedCrewServices,
        reason: `بيع وتفكيك قارب واسترداد الذهب (${ship.name}) وإخلاء طواقمها`,
        onLocalApply: () => {
          setGold((prev) => prev + refund);
          setShips(newShips);
          if (updatedCrewServices && setCrewServices) {
            setCrewServices(updatedCrewServices);
            localStorage.setItem('pirate_crew_services', JSON.stringify(updatedCrewServices));
          }
          localStorage.setItem('pirate_ships_v2', JSON.stringify(newShips));
        }
      });

      if (res.success) {
        if (typeof res.newGold === 'number') {
          setGold(res.newGold);
        }
        setShips(newShips);
        if (updatedCrewServices && setCrewServices) {
          setCrewServices(updatedCrewServices);
          localStorage.setItem('pirate_crew_services', JSON.stringify(updatedCrewServices));
        }
        localStorage.setItem('pirate_ships_v2', JSON.stringify(newShips));
        alert(`💵 تم تفكيك وإعادة تعيين السفينة بنجاح إلى المستوى 0 وإخلاء طواقمها، وتأكيد إضافة 🪙 ${refund.toLocaleString('ar-EG')} ذهب ذرياً!`);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Cairo, sans-serif', padding: '16px' }} dir="rtl">
      
      {/* Top Header Bar if modal mode */}
      {onClose && (
        <div style={{
          background: 'linear-gradient(to bottom, #0f172a, #090e1a)',
          borderBottom: '2px solid rgba(234, 179, 8, 0.4)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ca8a04, #854d0e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              border: '1px solid #fef08a'
            }}>
              ⚓
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#facc15' }}>
                مستودع الأسطول
              </h2>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                إدارة سفن الأسطول وتطوير الخصائص والشراء حسب مستوى بيت السفن
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            إغلاق ✖
          </button>
        </div>
      )}

      {/* Ship House Level & Upgrade Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        border: '1.5px solid #6366f1',
        borderRadius: '14px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #312e81)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            border: '1px solid #818cf8'
          }}>
            🏰
          </div>
          <div>
            <div style={{ color: '#facc15', fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>بيت السفن</span>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                مستوى {shipTowerLevel}
              </span>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '11.5px', marginTop: '3px' }}>
              {shipTowerLevel >= 31
                ? '⭐ بيت السفن في أقصى مستوى (31)، كافة سفن الأسطول والغواصة الأسطورية متاحة للشراء!'
                : `يمكنك شراء واستخدام السفن حتى المستوى ${shipTowerLevel}. قم بترقية بيت السفن إلى أقصى مستوى (31) لفتح الغواصة الأسطورية للشراء.`}
            </div>
          </div>
        </div>

        {shipTowerLevel < 31 && (
          <button
            onClick={async () => {
              if (!isNetworkOnline()) {
                notifyOfflineBlocked('ترقية بيت السفن');
                return;
              }

              const nextLvl = shipTowerLevel + 1;
              const nextShipSpec = SHOP_SHIPS.find(s => s.level === nextLvl);
              const upgradeCost = nextShipSpec ? Math.round(nextShipSpec.price * 0.8) : (nextLvl * 1000);

              if (gold < upgradeCost) {
                alert(`⚠️ الذهب غير كافٍ! تحتاج إلى 🪙 ${upgradeCost.toLocaleString('ar-EG')} ذهب لترقية بيت السفن إلى المستوى ${nextLvl}.`);
                return;
              }

              const res = await executeFinancialTransaction({
                goldDelta: -upgradeCost,
                shipTowerLevel: nextLvl,
                reason: `ترقية بيت السفن إلى المستوى ${nextLvl}`,
                onLocalApply: () => {
                  setGold(prev => prev - upgradeCost);
                  setShipTowerLevel(nextLvl);
                }
              });

              if (res.success) {
                if (typeof res.newGold === 'number') {
                  setGold(res.newGold);
                }
                setShipTowerLevel(nextLvl);
                if (nextLvl >= 31) {
                  alert(`🎉 تهانينا! تم ترقية بيت السفن بنجاح إلى أقصى مستوى (${nextLvl})! أصبحت الغواصة الأسطورية وكافة سفن الأسطول متاحة للشراء الآن!`);
                } else {
                  alert(`🎉 تهانينا! تم ترقية بيت السفن بنجاح إلى المستوى ${nextLvl}! أصبح بإمكانك الآن شراء سفن هذا المستوى.`);
                }
              }
            }}
            style={{
              background: 'linear-gradient(to bottom, #10b981, #059669)',
              color: '#fff',
              border: '1.5px solid #34d399',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '12.5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            <span>⚡ ترقية بيت السفن لـ ليفل {shipTowerLevel + 1}</span>
            <span style={{ color: '#fef08a', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '6px' }}>
              🪙 {(SHOP_SHIPS.find(s => s.level === shipTowerLevel + 1) ? Math.round((SHOP_SHIPS.find(s => s.level === shipTowerLevel + 1)?.price || 0) * 0.8) : (shipTowerLevel + 1) * 1000).toLocaleString('ar-EG')}
            </span>
          </button>
        )}
      </div>
      
      {/* ----------------- ACTIVE SHIPS UPGRADES SECTION ----------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{
          color: '#facc15',
          fontSize: '18px',
          fontWeight: '900',
          borderBottom: '2.5px solid #ca8a04',
          paddingBottom: '8px',
          margin: '12px 0 4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🚢</span> ترقيات سفن الأسطول النشطة ({activeShips.length}/3)
        </h3>

        {activeShips.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#120b05', border: '1.5px dashed #3a200e', borderRadius: '16px', color: '#94a3b8', fontSize: '14px' }}>
            ⚠️ لا توجد سفن نشطة في الميناء حالياً! يرجى شراء سفينة من الأسطول بالأسفل.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeShips.map((ship) => {
              const speedL = ship.speedLevel || 1;
              const capL = ship.capacityLevel || 1;
              const defL = ship.defenseLevel || 1;
              const spec = SHOP_SHIPS.find((s) => s.level === ship.level) || SHOP_SHIPS[0];
              const shipData = getShipDataByLevel(ship.level || 0);

              const baseCargo = shipData?.storageCapacity || spec.cargo;
              const luckyCargo = shipData?.storageWithLucky || (baseCargo * 2);
              const totalCargo = Math.round(baseCargo * (1 + (capL - 1) * 0.15));

              return (
                <div
                  key={ship.id}
                  style={{
                    background: '#150d06',
                    border: '2px solid #ca8a04',
                    borderRadius: '16px',
                    padding: '18px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative'
                  }}
                >
                  {/* Card Title */}
                  <div style={{ borderBottom: '1px solid #3a200e', paddingBottom: '10px' }}>
                    <h4 style={{ color: '#facc15', fontSize: '18px', fontWeight: '900', margin: '0' }}>
                      ⚓ {shipData?.name || ship.name}
                    </h4>
                    {shipData?.description && (
                      <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '4px 0 0 0' }}>
                        {shipData.description}
                      </p>
                    )}
                  </div>

                  {/* Horizontal Framed Image Box */}
                  <div style={{
                    position: 'relative',
                    border: '1.5px solid #3e2b1d',
                    borderRadius: '12px',
                    padding: '0px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '270px',
                    overflow: 'hidden',
                    backgroundColor: '#0a0d14'
                  }}>
                    {/* Direct Background Image element for 100% reliable rendering */}
                    <img 
                      src={SHIP_BACKGROUND_IMAGE}
                      alt="خلفية السفينة"
                      referrerPolicy="no-referrer"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShipImage level={typeof ship.level === 'number' ? ship.level : 0} width={280} plain={true} fill={true} />
                      {ship.assignedCrew && ship.assignedCrew.length > 0 && (
                        <ShipCrewMember assignedCrew={ship.assignedCrew} shipLevel={typeof ship.level === 'number' ? ship.level : 0} />
                      )}
                    </div>
                  </div>

                  {/* Current Level Badge, Fishing Timer & Assigned Crew below image */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(202, 138, 4, 0.2)',
                      border: '1.5px solid #ca8a04',
                      color: '#facc15',
                      borderRadius: '8px',
                      padding: '4px 16px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}>
                      المستوى الحالي: {ship.level}
                    </span>

                    {(() => {
                      const timerState = getShipFishingTimerState(ship, timerNow);
                      if (timerState.isFishing && timerState.isAutoFishing) {
                        return (
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.18)',
                            border: '1.5px solid #f59e0b',
                            color: '#fde68a',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}>
                            🔄 صيد تلقائي نشط
                          </span>
                        );
                      }
                      if (timerState.isFishing && timerState.remainingMs > 0) {
                        return (
                          <span style={{
                            background: 'rgba(14, 165, 233, 0.18)',
                            border: '1.5px solid #38bdf8',
                            color: '#bae6fd',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            <span>⏳ مؤقت الصيد:</span>
                            <span style={{ fontVariantNumeric: 'tabular-nums', direction: 'ltr', color: '#38bdf8', fontWeight: '900' }}>
                              {formatFishingCountdown(timerState.remainingMs)}
                            </span>
                            <span style={{ color: '#7dd3fc' }}>({timerState.progressPct}%)</span>
                          </span>
                        );
                      }
                      if (timerState.isReady) {
                        return (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1.5px solid #34d399',
                            color: '#6ee7b7',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}>
                            ✅ اكتمل الصيد · جاهزة للجمع!
                          </span>
                        );
                      }
                      return (
                        <span style={{
                          background: 'rgba(30, 41, 59, 0.75)',
                          border: '1.5px solid #475569',
                          color: '#cbd5e1',
                          borderRadius: '8px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span>⏱️ مدة الصيد:</span>
                          <span style={{ fontVariantNumeric: 'tabular-nums', direction: 'ltr', color: '#facc15', fontWeight: '900' }}>
                            {formatFishingCountdown(getShipFishingDurationMs(ship))}
                          </span>
                        </span>
                      );
                    })()}

                    {sanitizeShipCrew(ship.assignedCrew).length > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1.5px solid #10b981',
                        borderRadius: '8px',
                        padding: '3px 10px',
                      }}>
                        <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 'bold' }}>الطاقم:</span>
                        {sanitizeShipCrew(ship.assignedCrew).map(cId => {
                          const info = CREW_VISUAL_MAP[cId];
                          if (!info) return null;
                          return (
                            <span
                              key={cId}
                              title={info.name}
                              style={{
                                background: info.badgeBg,
                                border: `1px solid ${info.badgeBorder}`,
                                borderRadius: '50%',
                                width: '22px',
                                height: '22px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px'
                              }}
                            >
                              {info.badgeIcon}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 📋 Technical Specifications Grid */}
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #3a200e',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <h5 style={{ color: '#facc15', fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📋</span> المواصفات الفنية وبيانات الهيكل
                    </h5>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '10px'
                    }}>
                      {/* Stat 1: Durability */}
                      <div style={{ background: '#1c1007', border: '1px solid #3a200e', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🛡️</span>
                        <div>
                          <div style={{ color: '#cbd5e1', fontSize: '11.5px', fontWeight: '500' }}>قوة التحمل</div>
                          <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13.5px' }}>
                            {(spec.heart + (defL - 1) * 100).toLocaleString('ar-EG')}{' '}
                            <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontWeight: 'normal' }}>(أساسي: {spec.heart.toLocaleString('ar-EG')})</span>
                          </div>
                        </div>
                      </div>

                      {/* Stat 2: Storage / Gold Capacity */}
                      <div style={{ background: '#1c1007', border: '1px solid #3a200e', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>📦</span>
                        <div>
                          <div style={{ color: '#cbd5e1', fontSize: '11.5px', fontWeight: '500' }}>سعة التخزين (الذهب/الأسماك)</div>
                          <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '13.5px' }}>
                            {totalCargo.toLocaleString('ar-EG')}{' '}
                            <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontWeight: 'normal' }}>
                              (مع الحظ: {luckyCargo.toLocaleString('ar-EG')})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stat 3: Fishing hook volume */}
                      <div style={{ background: '#1c1007', border: '1px solid #3a200e', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🎣</span>
                        <div>
                          <div style={{ color: '#cbd5e1', fontSize: '11.5px', fontWeight: '500' }}>معدل الصيد</div>
                          <div style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '13.5px' }}>
                            {shipData ? `${shipData.withoutCrewFishing}د (بدون طاقم) / ${shipData.sailorFishing}د (بحار)` : `${spec.hook.toLocaleString('ar-EG')} سمكة`}
                          </div>
                        </div>
                      </div>

                      {/* Stat 4: Attack Power */}
                      <div style={{ background: '#1c1007', border: '1px solid #3a200e', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>⚔️</span>
                        <div>
                          <div style={{ color: '#cbd5e1', fontSize: '11.5px', fontWeight: '500' }}>قوة تدمير السفن</div>
                          <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13.5px' }}>{(spec.power + (defL - 1) * 4).toLocaleString('ar-EG')}</div>
                        </div>
                      </div>

                      {/* Stat 5: Fill timings breakdown */}
                      {shipData && (
                        <div style={{ background: '#1c1007', border: '1px solid #3a200e', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                          <div style={{ color: '#facc15', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⏱️</span> توقيتات رحلة الصيد والامتلاء:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>بدون طاقم:</div>
                              <div style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: 'bold' }}>{shipData.withoutCrewFill}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>بدون طاقم + الحظ:</div>
                              <div style={{ fontSize: '12.5px', color: '#34d399', fontWeight: 'bold' }}>{shipData.withoutCrewPlusLucky}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>مع البحار:</div>
                              <div style={{ fontSize: '12.5px', color: '#a78bfa', fontWeight: 'bold' }}>{shipData.sailor}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>البحار + الحظ:</div>
                              <div style={{ fontSize: '12.5px', color: '#fbbf24', fontWeight: 'bold' }}>{shipData.sailorPlusLucky}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stat 6: Rare fish catches */}
                      <div style={{ background: '#1c1007', border: '1px solid #3a200e', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: 'span 2' }}>
                        <div style={{ color: '#facc15', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '18px' }}>🐟</span>
                          <span>أنواع السمك وأسعارها</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '10px', width: '100%' }}>
                          {spec.fishTypes && spec.fishTypes.map((fishName: string, fIdx: number) => {
                            const subFishInfo = getSubmarineFishInfo(spec.level);
                            const fPriceLabel = subFishInfo
                              ? subFishInfo.priceLabel
                              : (FISH_REWARD_DATA[fishName]?.valPerFish ?? FISH_REWARD_DATA[fishName.replace(/^ال/, '').trim()]?.valPerFish);
                            const fEmoji = subFishInfo?.emoji || getFishEmoji(fishName);
                            const fImg = subFishInfo?.image || getFishImageUrl(fishName, spec.level);
                            return (
                              <div
                                key={fIdx}
                                style={{
                                  background: 'linear-gradient(180deg, rgba(14, 116, 144, 0.22) 0%, rgba(15, 23, 42, 0.96) 100%)',
                                  border: '1px solid rgba(56, 189, 248, 0.35)',
                                  borderRadius: '12px',
                                  padding: '10px 8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.4)'
                                }}
                              >
                                <div
                                  style={{
                                    width: '100%',
                                    height: '86px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(2,6,23,0.45) 78%)',
                                    borderRadius: '8px',
                                    padding: '4px'
                                  }}
                                >
                                  {fImg ? (
                                    <img
                                      src={fImg}
                                      alt={fishName}
                                      style={{
                                        width: '132px',
                                        height: '78px',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.92)) drop-shadow(0 0 6px rgba(186,230,253,0.35)) contrast(1.08) saturate(1.1)'
                                      }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: '36px' }}>{fEmoji}</span>
                                  )}
                                </div>
                                <div style={{ color: '#f8fafc', fontWeight: '900', fontSize: '13.5px', textAlign: 'center' }}>{fishName}</div>
                                {fPriceLabel !== undefined && (
                                  <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold', background: 'rgba(0,0,0,0.45)', padding: '2px 10px', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.3)' }}>
                                    {fPriceLabel} 🪙
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>



                   {/* Action / Sell Row */}
                  {(ship.level ?? 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #3a200e', paddingTop: '10px' }}>
                      {(ship.level ?? 0) >= 32 && (ship.level ?? 0) < 37 ? (
                        <button
                          onClick={() => {
                            setUpgradeSubmarineShipId(ship.id);
                            setShowSubmarineUpgradeModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(to bottom, #10b981, #059669)',
                            border: '1.5px solid #34d399',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '6px 16px',
                            fontSize: '12px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          ⚡ ترقية الغواصة ({getSubmarineUpgradeRule(ship.level || 32)?.title})
                        </button>
                      ) : <div />}

                      <button
                        onClick={() => sellShip(ship.id)}
                        style={{
                          background: '#7f1d1d',
                          border: '1.5px solid #ef4444',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '6px 16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        تفكيك السفينة مقابل 🪙 {Math.floor((SHOP_SHIPS.find((s) => s.level === ship.level)?.price || 0) * 0.5).toLocaleString('ar-EG')} ذهب
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------- IMPERIAL PURCHASE FLEET SECTION (أسطول الشراء) ----------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '2px solid #ca8a04', paddingTop: '24px', marginTop: '12px' }}>
        
        {/* Section Header Description */}
        <div style={{
          background: '#150d06',
          border: '2px solid #ca8a04',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
        }}>
          <h3 style={{ color: '#facc15', fontSize: '18px', fontWeight: '900', margin: '0 0 6px 0' }}>
            🛒 أسطول الشراء
          </h3>
          <p style={{ color: '#f1f5f9', fontSize: '12.5px', margin: '0 0 14px 0', lineHeight: '1.6' }}>
            يظهر حسب مستوى السحر والطلب مع تقدم اللعبة الكبرى وتحصيل فخامة وخيالية لكل سفينة.
          </p>

          {/* Badges Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{
              background: '#2e1c0c',
              border: '1.5px solid #ca8a04',
              color: '#facc15',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              مخزن السفن ({activeShips.length}/3)
            </div>
            <div style={{
              background: '#042f1a',
              border: '1.5px solid #10b981',
              color: '#34d399',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              النشطة: {activeShips.length} / 3
            </div>
            <div style={{
              background: '#1e293b',
              border: '1.5px solid #475569',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              السعة: {activeShips.reduce((acc, s) => acc + (s.cargo || 0), 0).toLocaleString('ar-EG')} / 380,000
            </div>
          </div>
        </div>

        {/* Purchase Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {SHOP_SHIPS.filter(spec => spec.level < 33).map((spec) => {
            const isSubmarineCard = spec.level === 32;
            const ownedSubmarine = isSubmarineCard 
              ? (ships.find((s) => s.exists && s.level !== undefined && s.level >= 32 && s.level < 37) ||
                 ships.find((s) => s.exists && s.level !== undefined && s.level >= 32 && s.level <= 37))
              : null;

            const currentLevel = ownedSubmarine ? (ownedSubmarine.level || 32) : spec.level;
            const currentSpec = isSubmarineCard && ownedSubmarine
              ? (SHOP_SHIPS.find((s) => s.level === currentLevel) || spec)
              : spec;

            // When ship house reaches max level (31), the submarine becomes available for purchase!
            const isLocked = isSubmarineCard
              ? shipTowerLevel < 31
              : (spec.level > 0 && spec.level > shipTowerLevel);
            const ownedCount = isSubmarineCard
              ? ships.filter((s) => s.exists && s.level !== undefined && s.level >= 32 && s.level <= 37).length
              : ships.filter((s) => s.exists && s.level === spec.level).length;
            const isOwned = ownedCount > 0;
            const isMaxOwned = ownedCount >= 3;

            const submarineRule = isSubmarineCard ? getSubmarineUpgradeRule(currentLevel) : null;
            const submarineFailStreak = ownedSubmarine ? Math.max(0, Math.min(2, ownedSubmarine.upgradeFailStreak || 0)) : 0;
            const submarineSuccessPct = submarineRule ? (submarineFailStreak >= 2 ? 100 : submarineRule.successRate) : 100;

            const handleOpenSubmarineUpgrade = () => {
              if (!ownedSubmarine) return;
              setUpgradeSubmarineShipId(ownedSubmarine.id);
              setShowSubmarineUpgradeModal(true);
            };

            const ownedShip = isSubmarineCard 
              ? ownedSubmarine 
              : ships.find((s) => s.exists && s.level === spec.level);

            const nextLevelForUpgrade = currentLevel + 1;
            const nextSpecForUpgrade = SHOP_SHIPS.find(s => s.level === nextLevelForUpgrade);
            const shipData = getShipDataByLevel(spec.level);

            return (
              <div
                key={spec.level}
                style={{
                  background: isSubmarineCard ? 'linear-gradient(to bottom, #111827, #1e1b4b)' : '#120a05',
                  border: isSubmarineCard ? '3px solid #818cf8' : '2px solid #2d1a0e',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.8)',
                  position: 'relative'
                }}
              >
                {/* Card Top Bar (Owned tag / Lvl Tag + Action Button) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d1a0e', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    {isOwned && (
                      <span style={{
                        background: isMaxOwned ? '#b45309' : '#15803d',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isSubmarineCard
                          ? (isMaxOwned ? 'مملوكة بالكامل (3/3) ⭐' : `مملوكة (${ownedCount}/3)`)
                          : (isMaxOwned ? 'مملوكة بالكامل (3/3 أسطول كامل) ⭐' : `مملوكة (${ownedCount}/3)`)}
                      </span>
                    )}
                    <span style={{
                      color: isSubmarineCard ? '#facc15' : '#38bdf8',
                      fontWeight: '900',
                      fontSize: '13px',
                      background: isSubmarineCard ? 'rgba(250, 204, 21, 0.15)' : 'rgba(56, 189, 248, 0.1)',
                      border: isSubmarineCard ? '1px solid #facc15' : '1px solid #38bdf8',
                      borderRadius: '6px',
                      padding: '2px 8px'
                    }}>
                      {isSubmarineCard ? getSubmarineTag(currentLevel) : `Lvl ${currentLevel}`}
                    </span>
                  </div>

                  {isLocked ? (
                    <button
                      disabled
                      style={{
                        background: '#241a12',
                        color: '#a1a1aa',
                        border: '1px solid #3e2b1d',
                        borderRadius: '10px',
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isSubmarineCard ? '🔒 يتطلب ترقية بيت السفن لأقصى مستوى (31)' : `🔒 يتطلب بيت السفن ليفل ${spec.level}`}
                    </button>
                  ) : isSubmarineCard ? (
                    ownedSubmarine ? (
                      nextSpecForUpgrade ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={handleOpenSubmarineUpgrade}
                            style={{
                              background: 'linear-gradient(to bottom, #10b981, #059669)',
                              color: '#fff',
                              border: '2px solid #34d399',
                              borderRadius: '10px',
                              padding: '8px 14px',
                              fontSize: '12px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              animation: 'pulse 2s infinite'
                            }}
                          >
                            <span style={{ fontSize: '16px' }}>⚡</span>
                            ترقية إلى {getSubmarineDisplayTier(nextLevelForUpgrade)} ({submarineSuccessPct}% نجاح) بـ {(submarineRule?.cost || nextSpecForUpgrade.price).toLocaleString('ar-EG')} 🪙
                          </button>
                          {ownedCount < 3 && (
                            <button
                              onClick={() => buyShipLevel(spec)}
                              style={{
                                background: 'linear-gradient(to bottom, #4f46e5, #3730a3)',
                                color: '#fff',
                                border: '1.5px solid #818cf8',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                fontSize: '12px',
                                fontWeight: '900',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
                              }}
                            >
                              🤿 شراء غواصة أخرى ({ownedCount}/3) بـ {spec.price.toLocaleString('ar-EG')} 🪙
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            disabled
                            style={{
                              background: 'linear-gradient(to bottom, #b45309, #78350f)',
                              color: '#fef08a',
                              border: '2px solid #facc15',
                              borderRadius: '10px',
                              padding: '8px 14px',
                              fontSize: '12px',
                              fontWeight: '900',
                              cursor: 'default',
                              boxShadow: '0 0 15px rgba(234, 179, 8, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>👑</span>
                            <span>الغواصة في أقصى مستوى (المستوى Max ⭐)</span>
                          </button>
                          {ownedCount < 3 && (
                            <button
                              onClick={() => buyShipLevel(spec)}
                              style={{
                                background: 'linear-gradient(to bottom, #4f46e5, #3730a3)',
                                color: '#fff',
                                border: '1.5px solid #818cf8',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                fontSize: '12px',
                                fontWeight: '900',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
                              }}
                            >
                              🤿 شراء غواصة أخرى ({ownedCount}/3) بـ {spec.price.toLocaleString('ar-EG')} 🪙
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => buyShipLevel(spec)}
                        style={{
                          background: 'linear-gradient(to bottom, #4f46e5, #3730a3)',
                          color: '#fff',
                          border: '1.5px solid #818cf8',
                          borderRadius: '10px',
                          padding: '8px 18px',
                          fontSize: '12px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.5)'
                        }}
                      >
                        {ownedCount > 0 ? `🤿 شراء غواصة أخرى (${ownedCount}/3) بـ ` : '🤿 شراء الغواصة (المستوى الأساسي 0) بـ '}
                        {spec.price.toLocaleString('ar-EG')} 🪙
                      </button>
                    )
                  ) : isMaxOwned ? (
                    <button
                      disabled
                      style={{
                        background: 'rgba(202, 138, 4, 0.15)',
                        color: '#facc15',
                        border: '1px solid #ca8a04',
                        borderRadius: '10px',
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      ⭐ أقصى حد مملوك (3/3 سفن)
                    </button>
                  ) : (
                    <button
                      onClick={() => buyShipLevel(spec)}
                      style={{
                        background: 'linear-gradient(to bottom, #0284c7, #0369a1)',
                        color: '#fff',
                        border: '1.5px solid #38bdf8',
                        borderRadius: '10px',
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{ownedCount > 0 ? '⚓' : '🛒'}</span>
                      {ownedCount > 0 ? `شراء سفينة أخرى (${ownedCount}/3) بـ ` : 'شراء بـ '}
                      {spec.price.toLocaleString('ar-EG')} 🪙
                    </button>
                  )}
                </div>

                {/* Centered Ship Image box with custom ship background image */}
                <div style={{
                  position: 'relative',
                  border: '1.5px solid #2d1a0e',
                  borderRadius: '12px',
                  padding: '0px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '250px',
                  overflow: 'hidden',
                  backgroundColor: '#0a0d14'
                }}>
                  {/* Direct Background Image element for 100% reliable rendering */}
                  <img 
                    src={SHIP_BACKGROUND_IMAGE}
                    alt="خلفية السفينة"
                    referrerPolicy="no-referrer"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShipImage level={currentLevel} width={260} plain={true} fill={true} />
                    {ownedShip && ownedShip.assignedCrew && ownedShip.assignedCrew.length > 0 && (
                      <ShipCrewMember assignedCrew={ownedShip.assignedCrew} shipLevel={currentLevel} />
                    )}
                  </div>
                </div>

                {/* Ship Name & Subtitle description */}
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: '#facc15', margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900' }}>
                    {isSubmarineCard && ownedSubmarine
                      ? `غواصة الأعماق الأسطورية (${getSubmarineDisplayTier(currentLevel)} 🤿)`
                      : (shipData?.name || currentSpec.name)
                    }
                  </h4>
                  <p style={{ color: '#f1f5f9', margin: '0', fontSize: '12.5px', lineHeight: '1.5' }}>
                    {shipData?.description || currentSpec.subName}
                  </p>
                </div>

                {/* Four-Column Stats Row with vertical dividers (⏱️ Clock, ⚔️ Sword, 📦 Box, 🎣 Hook) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  background: '#090502',
                  border: '1px solid #2d1a0e',
                  borderRadius: '12px',
                  padding: '12px 4px',
                  marginTop: '6px'
                }}>
                  {/* Col 1: Duration/Speed */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '18px', marginBottom: '4px' }}>⏱️</span>
                    <span style={{ fontSize: '11.5px', color: '#fff', fontWeight: 'bold' }}>
                      {shipData?.withoutCrewFill || currentSpec.durationStr}
                    </span>
                  </div>

                  {/* Col 2: Power */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '18px', marginBottom: '4px' }}>⚔️</span>
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{currentSpec.power.toLocaleString('ar-EG')}</span>
                  </div>

                  {/* Col 3: Cargo */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '18px', marginBottom: '4px' }}>📦</span>
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                      {(shipData?.storageCapacity || currentSpec.cargo).toLocaleString('ar-EG')}
                    </span>
                  </div>

                  {/* Col 4: Hook/Fishing */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', marginBottom: '4px' }}>🎣</span>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                      {shipData ? `${shipData.withoutCrewFishing}د / ${shipData.sailorFishing}د` : currentSpec.hook.toLocaleString('ar-EG')}
                    </span>
                  </div>
                </div>

                {/* Fill Timings Breakdown */}
                {shipData && (
                  <div style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid #2d1a0e',
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ color: '#facc15', fontSize: '11.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⏱️</span> توقيتات الامتلاء وسعة الحظ:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11.5px' }}>
                      <div style={{ background: '#1c1007', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>بدون طاقم:</span>
                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{shipData.withoutCrewFill}</span>
                      </div>
                      <div style={{ background: '#1c1007', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>مع الحظ:</span>
                        <span style={{ color: '#34d399', fontWeight: 'bold' }}>{shipData.withoutCrewPlusLucky}</span>
                      </div>
                      <div style={{ background: '#1c1007', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>مع البحار:</span>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{shipData.sailor}</span>
                      </div>
                      <div style={{ background: '#1c1007', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>البحار + الحظ:</span>
                        <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{shipData.sailorPlusLucky}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'center', marginTop: '2px' }}>
                      ✨ السعة مع الحظ السعيد: <span style={{ color: '#facc15', fontWeight: 'bold' }}>{shipData.storageWithLucky.toLocaleString('ar-EG')}</span> سمكة/ذهب
                    </div>
                  </div>
                )}

                {/* Prominent Fish Showcase underneath stats */}
                <div style={{
                  marginTop: '6px',
                  direction: 'rtl',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#bae6fd', fontWeight: 'bold' }}>
                    🐟 نوع السمك المتوفر في هذه السفينة:
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    {currentSpec.fishTypes && currentSpec.fishTypes.map((fish: string, idx: number) => {
                      const subFishInfo = getSubmarineFishInfo(currentLevel);
                      const emoji = subFishInfo?.emoji || getFishEmoji(fish);
                      const fImg = subFishInfo?.image || getFishImageUrl(fish, currentLevel);
                      const fPriceLabel = subFishInfo
                        ? subFishInfo.priceLabel
                        : (FISH_REWARD_DATA[fish]?.valPerFish ?? FISH_REWARD_DATA[fish.replace(/^ال/, '').trim()]?.valPerFish);
                      return (
                        <div
                          key={idx}
                          style={{
                            flex: '1 1 135px',
                            maxWidth: '210px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px',
                            color: '#ffffff',
                            background: 'linear-gradient(180deg, rgba(14, 116, 144, 0.24) 0%, rgba(15, 23, 42, 0.94) 100%)',
                            padding: '8px 10px',
                            borderRadius: '12px',
                            border: '1px solid rgba(56, 189, 248, 0.38)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 10px rgba(0,0,0,0.45)'
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '82px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(2,6,23,0.4) 80%)',
                              borderRadius: '8px',
                              padding: '4px'
                            }}
                          >
                            {fImg ? (
                              <img
                                src={fImg}
                                alt={fish}
                                style={{
                                  width: '128px',
                                  height: '74px',
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.92)) drop-shadow(0 0 6px rgba(186,230,253,0.35)) contrast(1.08) saturate(1.1)'
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: '34px' }}>{emoji}</span>
                            )}
                          </div>
                          <span style={{ fontWeight: '900', fontSize: '13.5px', color: '#f8fafc', textAlign: 'center' }}>{fish}</span>
                          {fPriceLabel !== undefined && (
                            <span style={{ color: '#fbbf24', fontSize: '11.5px', fontWeight: 'bold', background: 'rgba(0,0,0,0.45)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.28)' }}>
                              {fPriceLabel} 🪙
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
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
    </div>
  );
}
