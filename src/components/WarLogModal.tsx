import React, { useState } from 'react';
import { 
  Skull, 
  Swords, 
  Gift, 
  Flame, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Bomb, 
  AlertTriangle, 
  Trophy, 
  Clock, 
  Coins, 
  Gem, 
  Users, 
  CheckCircle2, 
  Trash2,
  Shield
} from 'lucide-react';
import { BattleReport } from '../types';

export interface AttackLogItem {
  id: string;
  attackerId?: string;
  attackerName: string;
  attackerAvatar: string;
  attackerLevel: number;
  time: string;
  title: string;
  description: string;
  goldLooted: number;
  shipsDamaged: number;
  isAvenged: boolean;
  date: string;
}

export interface SupportGiftItem {
  id: string;
  senderName: string;
  senderAvatar: string;
  time: string;
  type: 'crew' | 'chest' | 'armor';
  title: string;
  description: string;
  rewards: {
    gold?: number;
    gems?: number;
    crewPower?: number;
    shipHeal?: number;
  };
  claimed: boolean;
}

interface WarLogModalProps {
  onClose: () => void;
  onRevenge: (attackerName: string, attackId?: string, attackerId?: string) => void;
  onClaimGift: (gift: SupportGiftItem) => void;
  battleReports: BattleReport[];
  attackLogs: AttackLogItem[];
  supportGifts: SupportGiftItem[];
  onClearLogs?: () => void;
}

export const WarLogModal: React.FC<WarLogModalProps> = ({
  onClose,
  onRevenge,
  onClaimGift,
  battleReports,
  attackLogs,
  supportGifts,
  onClearLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'attacks' | 'supports' | 'all'>('attacks');

  // Filter out any mock/placeholder reports while supporting both opponentName and opponent fields
  const realReports = (battleReports || []).filter((r: any) => {
    const opp = r?.opponentName || r?.opponent;
    return Boolean(r && opp && opp !== 'قبطان معادٍ' && !r.id?.startsWith('mock_'));
  });

  const pendingAttacks = (attackLogs || []).filter((a) => !a.isAvenged);
  const pendingGifts = (supportGifts || []).filter((g) => !g.claimed);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(180deg, #071728 0%, #06121e 40%, #030a12 100%)',
        color: '#f8fafc',
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
        direction: 'rtl',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background underwater star/caustics pattern */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.08) 0%, transparent 60%), radial-gradient(#38bdf8 0.6px, transparent 0.6px)',
          backgroundSize: '100% 100%, 36px 36px',
          opacity: 0.4,
          zIndex: 0,
        }}
      />

      {/* Main Full-Screen Wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* ================= HEADER FULL SCREEN WIDTH ================= */}
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '22px 26px',
            background: 'linear-gradient(90deg, rgba(35, 12, 18, 0.98) 0%, rgba(14, 30, 52, 0.98) 100%)',
            borderBottom: '2px solid rgba(212, 175, 55, 0.6)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* The Skull Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #450a0a 0%, #1e1b4b 100%)',
                border: '2.5px solid #ef4444',
                boxShadow: '0 0 22px rgba(239, 68, 68, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src="/assets/alerts_skull_icon.jpg"
                alt="Skull War Log"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '32px',
                    fontWeight: '900',
                    color: '#fef3c7',
                    letterSpacing: '-0.3px',
                  }}
                >
                  سجل الغارات والانتقام والدعوم
                </h1>
                <span
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    fontSize: '17px',
                    fontWeight: '900',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    boxShadow: '0 0 10px #ef4444',
                  }}
                >
                  نظام الثأر 💀
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '19px', color: '#cbd5e1', fontWeight: '600' }}>
                تتبع من هاجمك أو سرقك، ورد الهجوم فوراً لتفجير محيطه، واستلم هدايا الطواقم والدعوم البحرية!
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            title="إغلاق والعودة للميناء"
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '2px solid rgba(212, 175, 55, 0.6)',
              color: '#f8fafc',
              fontSize: '26px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            ✕
          </button>
        </div>

        {/* ================= TABS NAVIGATION FULL WIDTH ================= */}
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            padding: '16px 24px',
            gap: '14px',
            background: 'rgba(6, 17, 30, 0.95)',
            borderBottom: '2px solid rgba(56, 189, 248, 0.3)',
          }}
        >
          {/* Tab 1: غارات الأعداء (الانتقام) */}
          <button
            onClick={() => setActiveTab('attacks')}
            style={{
              flex: 1,
              padding: '16px 18px',
              borderRadius: '14px',
              border:
                activeTab === 'attacks'
                  ? '2.5px solid #ef4444'
                  : '1.5px solid rgba(71, 85, 105, 0.6)',
              background:
                activeTab === 'attacks'
                  ? 'linear-gradient(180deg, #7f1d1d 0%, #450a0a 100%)'
                  : 'rgba(15, 23, 42, 0.7)',
              color: activeTab === 'attacks' ? '#ffffff' : '#e2e8f0',
              fontSize: '22px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow:
                activeTab === 'attacks' ? '0 0 18px rgba(239, 68, 68, 0.55)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Swords style={{ width: '26px', height: '26px', color: '#f87171', flexShrink: 0 }} />
            <span>غارات الأعداء والانتقام</span>
            {pendingAttacks.length > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '17px',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontWeight: '900',
                }}
              >
                {pendingAttacks.length}
              </span>
            )}
          </button>

          {/* Tab 2: الدعوم والصناديق */}
          <button
            onClick={() => setActiveTab('supports')}
            style={{
              flex: 1,
              padding: '16px 18px',
              borderRadius: '14px',
              border:
                activeTab === 'supports'
                  ? '2.5px solid #10b981'
                  : '1.5px solid rgba(71, 85, 105, 0.6)',
              background:
                activeTab === 'supports'
                  ? 'linear-gradient(180deg, #065f46 0%, #064e3b 100%)'
                  : 'rgba(15, 23, 42, 0.7)',
              color: activeTab === 'supports' ? '#ffffff' : '#e2e8f0',
              fontSize: '22px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow:
                activeTab === 'supports' ? '0 0 18px rgba(16, 185, 129, 0.55)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Gift style={{ width: '26px', height: '26px', color: '#34d399', flexShrink: 0 }} />
            <span>الدعوم والصناديق والطواقم</span>
            {pendingGifts.length > 0 && (
              <span
                style={{
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '17px',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontWeight: '900',
                }}
              >
                {pendingGifts.length}
              </span>
            )}
          </button>

          {/* Tab 3: السجل العام للمعارك */}
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flex: 1,
              padding: '16px 18px',
              borderRadius: '14px',
              border:
                activeTab === 'all'
                  ? '2.5px solid #38bdf8'
                  : '1.5px solid rgba(71, 85, 105, 0.6)',
              background:
                activeTab === 'all'
                  ? 'linear-gradient(180deg, #0369a1 0%, #075985 100%)'
                  : 'rgba(15, 23, 42, 0.7)',
              color: activeTab === 'all' ? '#ffffff' : '#e2e8f0',
              fontSize: '22px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow:
                activeTab === 'all' ? '0 0 18px rgba(56, 189, 248, 0.55)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Trophy style={{ width: '26px', height: '26px', color: '#38bdf8', flexShrink: 0 }} />
            <span>السجل العام للمعركة ({realReports.length})</span>
          </button>
        </div>

        {/* ================= CONTENT BODY FULL WIDTH ================= */}
        <div
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '24px 24px 64px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* ============= 1. ENEMY ATTACKS & REVENGE ============= */}
          {activeTab === 'attacks' && (
            <>
              {(!attackLogs || attackLogs.length === 0) ? (
                <div
                  style={{
                    width: '100%',
                    padding: '90px 28px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.55)',
                    borderRadius: '24px',
                    border: '2px dashed rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}
                >
                  <ShieldCheck
                    style={{ width: '96px', height: '96px', color: '#10b981' }}
                  />
                  <div style={{ fontSize: '30px', fontWeight: '900', color: '#f8fafc' }}>
                    ميناؤك وأسطولك في أمان تام 🛡️
                  </div>
                  <div style={{ fontSize: '21px', color: '#cbd5e1', maxWidth: '680px', lineHeight: '1.7', fontWeight: '600' }}>
                    لا توجد أي غارات أو هجمات مسجلة على مينائك حالياً. في حال قيام أي قبطان بقصف مينائك أو سرقتك، ستظهر غارته هنا فوراً مع خيار الانتقام الفوري لتفجير محيطه!
                  </div>
                </div>
              ) : (
                attackLogs.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: item.isAvenged
                        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(6, 15, 28, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(69, 10, 10, 0.92) 0%, rgba(20, 8, 14, 0.98) 100%)',
                      border: item.isAvenged
                        ? '2px solid rgba(71, 85, 105, 0.6)'
                        : '2.5px solid rgba(239, 68, 68, 0.8)',
                      borderRadius: '22px',
                      padding: '22px 26px',
                      boxShadow: item.isAvenged
                        ? '0 4px 14px rgba(0,0,0,0.4)'
                        : '0 8px 25px rgba(239, 68, 68, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    {/* Top Row: Attacker Info + Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            border: '2.5px solid #ef4444',
                            overflow: 'hidden',
                            background: '#0f172a',
                            boxShadow: '0 0 14px rgba(239, 68, 68, 0.55)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {item.attackerAvatar && (item.attackerAvatar.startsWith('http') || item.attackerAvatar.startsWith('/') || item.attackerAvatar.startsWith('data:')) ? (
                            <img
                              src={item.attackerAvatar}
                              alt={item.attackerName}
                              referrerPolicy="no-referrer"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: '40px', lineHeight: 1 }}>
                              {item.attackerAvatar || '☠️'}
                            </span>
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '25px', fontWeight: '900', color: '#ffffff' }}>
                              {item.attackerName}
                            </span>
                            <span
                              style={{
                                fontSize: '17px',
                                fontWeight: '900',
                                color: '#fecaca',
                                background: 'rgba(239, 68, 68, 0.3)',
                                border: '1.5px solid rgba(239, 68, 68, 0.55)',
                                padding: '3px 12px',
                                borderRadius: '8px',
                              }}
                            >
                              ليفل {item.attackerLevel}
                            </span>
                          </div>
                          <div style={{ fontSize: '20px', color: '#fca5a5', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <Flame style={{ width: '22px', height: '22px', color: '#f87171', flexShrink: 0 }} />
                            <span>{item.title}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '18px', color: '#cbd5e1', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock style={{ width: '20px', height: '20px' }} />
                        <span>{item.time}</span>
                      </div>
                    </div>

                    {/* Description & Losses */}
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.45)',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        fontSize: '21px',
                        fontWeight: '600',
                        color: '#f8fafc',
                        lineHeight: '1.65',
                      }}
                    >
                      <p style={{ margin: 0 }}>{item.description}</p>
                      {item.goldLooted > 0 && (
                        <div
                          style={{
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#fde047',
                            fontWeight: '900',
                            fontSize: '21px',
                          }}
                        >
                          <Coins style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                          <span>الذهب المسروق: 🪙 {item.goldLooted.toLocaleString('en-US')} ذهب</span>
                        </div>
                      )}
                    </div>

                    {/* Revenge Action Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: item.isAvenged ? '#34d399' : '#fca5a5' }}>
                        {item.isAvenged ? '✅ تم الرد والانتقام وتدمير أسطولها' : '⚠️ لم يتم رد الهجوم بعد! ثأرك ينتظر'}
                      </div>

                      {item.isAvenged ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#34d399',
                            fontSize: '19px',
                            fontWeight: '800',
                            background: 'rgba(16, 185, 129, 0.18)',
                            border: '1.5px solid rgba(16, 185, 129, 0.5)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                          }}
                        >
                          <CheckCircle2 style={{ width: '24px', height: '24px' }} />
                          <span>تم تدمير محيطها وثأرك كامل</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onRevenge(item.attackerName, item.id, item.attackerId)}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                            border: '2px solid #fca5a5',
                            borderRadius: '14px',
                            padding: '14px 26px',
                            color: '#ffffff',
                            fontSize: '21px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.65)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Bomb style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                          <span>⚡ رد الهجوم وتفجير محيطها الآن 🚀</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ============= 2. SUPPORTS, CHESTS & CREW ============= */}
          {activeTab === 'supports' && (
            <>
              {(!supportGifts || supportGifts.length === 0) ? (
                <div
                  style={{
                    width: '100%',
                    padding: '90px 28px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.55)',
                    borderRadius: '24px',
                    border: '2px dashed rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}
                >
                  <Gift style={{ width: '96px', height: '96px', color: '#10b981' }} />
                  <div style={{ fontSize: '30px', fontWeight: '900', color: '#f8fafc' }}>
                    لا توجد دعوم معلقة حالياً 🎁
                  </div>
                  <div style={{ fontSize: '21px', color: '#cbd5e1', maxWidth: '680px', lineHeight: '1.7', fontWeight: '600' }}>
                    عندما يرسل لك حلفاء قبيلتك أو أصدقاؤك طواقم بحرية أو صناديق أسطورية أو دروعاً حربية، ستظهر هنا لاستلامها فوراً.
                  </div>
                </div>
              ) : (
                supportGifts.map((gift) => (
                  <div
                    key={gift.id}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: gift.claimed
                        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(6, 15, 28, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(6, 78, 59, 0.88) 0%, rgba(4, 47, 46, 0.96) 100%)',
                      border: gift.claimed
                        ? '2px solid rgba(71, 85, 105, 0.6)'
                        : '2.5px solid rgba(16, 185, 129, 0.8)',
                      borderRadius: '22px',
                      padding: '22px 26px',
                      boxShadow: gift.claimed
                        ? '0 4px 14px rgba(0,0,0,0.4)'
                        : '0 8px 25px rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    {/* Top Row: Sender Info + Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            border: '2.5px solid #10b981',
                            overflow: 'hidden',
                            background: '#0f172a',
                            boxShadow: '0 0 14px rgba(16, 185, 129, 0.55)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {gift.senderAvatar && !(gift.senderAvatar.startsWith('http') || gift.senderAvatar.startsWith('/') || gift.senderAvatar.startsWith('data:')) ? (
                            <span style={{ fontSize: '40px', lineHeight: 1 }}>{gift.senderAvatar}</span>
                          ) : (
                            <img
                              src={gift.senderAvatar || '/assets/chat_avatar_1.png'}
                              alt={gift.senderName}
                              referrerPolicy="no-referrer"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}
                        </div>

                        <div>
                          <div style={{ fontSize: '25px', fontWeight: '900', color: '#ffffff' }}>
                            {gift.senderName}
                          </div>
                          <div style={{ fontSize: '20px', color: '#6ee7b7', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <Sparkles style={{ width: '22px', height: '22px', flexShrink: 0 }} />
                            <span>{gift.title}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '18px', color: '#cbd5e1', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock style={{ width: '20px', height: '20px' }} />
                        <span>{gift.time}</span>
                      </div>
                    </div>

                    {/* Description & Rewards */}
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.45)',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        fontSize: '21px',
                        fontWeight: '600',
                        color: '#f8fafc',
                        lineHeight: '1.65',
                      }}
                    >
                      <p style={{ margin: 0 }}>{gift.description}</p>
                      
                      {/* Rewards Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
                        {gift.rewards.gems && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(56, 189, 248, 0.22)',
                              border: '1.5px solid #38bdf8',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              fontSize: '19px',
                              fontWeight: '800',
                              color: '#7dd3fc',
                            }}
                          >
                            <Gem style={{ width: '22px', height: '22px' }} />
                            <span>💎 {gift.rewards.gems.toLocaleString('en-US')} جوهرة</span>
                          </div>
                        )}

                        {gift.rewards.gold && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(234, 179, 8, 0.22)',
                              border: '1.5px solid #eab308',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              fontSize: '19px',
                              fontWeight: '800',
                              color: '#fde047',
                            }}
                          >
                            <Coins style={{ width: '22px', height: '22px' }} />
                            <span>🪙 {gift.rewards.gold.toLocaleString('en-US')} ذهب</span>
                          </div>
                        )}

                        {gift.rewards.crewPower && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(168, 85, 247, 0.22)',
                              border: '1.5px solid #a855f7',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              fontSize: '19px',
                              fontWeight: '800',
                              color: '#d8b4fe',
                            }}
                          >
                            <Users style={{ width: '22px', height: '22px' }} />
                            <span>👨‍✈️ قوة طاقم +{gift.rewards.crewPower}</span>
                          </div>
                        )}

                        {gift.rewards.shipHeal && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(239, 68, 68, 0.22)',
                              border: '1.5px solid #ef4444',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              fontSize: '19px',
                              fontWeight: '800',
                              color: '#fecaca',
                            }}
                          >
                            <span>❤️ ترميم وإصلاح سفن +{gift.rewards.shipHeal} HP</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      {gift.claimed ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#34d399',
                            fontSize: '19px',
                            fontWeight: '800',
                            background: 'rgba(16, 185, 129, 0.18)',
                            border: '1.5px solid rgba(16, 185, 129, 0.5)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                          }}
                        >
                          <CheckCircle2 style={{ width: '24px', height: '24px' }} />
                          <span>تم الاستلام والإضافة لحسابك بنجاح</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onClaimGift(gift)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: '2px solid #6ee7b7',
                            borderRadius: '14px',
                            padding: '14px 26px',
                            color: '#ffffff',
                            fontSize: '21px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.55)',
                          }}
                        >
                          <Gift style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                          <span>استلام الدعم والمكافأة 🎁</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ============= 3. ALL BATTLE REPORTS (السجل العام الحقيقي) ============= */}
          {activeTab === 'all' && (
            <>
              {(!realReports || realReports.length === 0) ? (
                <div
                  style={{
                    width: '100%',
                    padding: '90px 28px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.55)',
                    borderRadius: '24px',
                    border: '2px dashed rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}
                >
                  <Trophy style={{ width: '96px', height: '96px', color: '#38bdf8' }} />
                  <div style={{ fontSize: '30px', fontWeight: '900', color: '#f8fafc' }}>
                    لا توجد معارك سابقة مسجلة في السجل 📜
                  </div>
                  <div style={{ fontSize: '21px', color: '#cbd5e1', maxWidth: '680px', lineHeight: '1.7', fontWeight: '600' }}>
                    سجل المعارك نظيف. قم بغزو موانئ الأعداء أو خوض المعارك البحرية وسيتسجل تاريخك الحربي هنا بدقة!
                  </div>
                </div>
              ) : (
                realReports.map((report: any, idx) => {
                  const oppName = report.opponentName || report.opponent || 'قبطان';
                  const titleText = report.title || (report.isVictory ? 'انتصار ساحق في المعركة' : 'هجوم وتضرر في الأسطول');
                  const detailText = Array.isArray(report.log) && report.log.length > 0 ? report.log[0] : '';
                  const timeText = report.time || (report.date ? new Date(report.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'اليوم');
                  const rawOppAv = String(report.opponentAvatar || '').trim();
                  const isOppImg = rawOppAv.startsWith('http') || rawOppAv.startsWith('/') || rawOppAv.startsWith('data:image');
                  return (
                  <div
                    key={report.id || idx}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: report.isVictory
                        ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.55) 0%, rgba(2, 44, 34, 0.78) 100%)'
                        : 'linear-gradient(135deg, rgba(69, 10, 10, 0.55) 0%, rgba(30, 8, 8, 0.78) 100%)',
                      border: report.isVictory
                        ? '2px solid rgba(16, 185, 129, 0.6)'
                        : '2px solid rgba(239, 68, 68, 0.6)',
                      borderRadius: '20px',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '66px',
                          height: '66px',
                          borderRadius: '50%',
                          border: report.isVictory ? '2px solid #34d399' : '2px solid #f87171',
                          background: 'rgba(15, 23, 42, 0.85)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {isOppImg ? (
                          <img
                            src={rawOppAv}
                            alt={oppName}
                            referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '38px', lineHeight: 1 }}>{rawOppAv || (report.isVictory ? '🏆' : '💀')}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                          معركة ضد: {oppName}
                        </div>
                        <div
                          style={{
                            fontSize: '20px',
                            fontWeight: '800',
                            color: report.isVictory ? '#6ee7b7' : '#fca5a5',
                            marginTop: '4px',
                          }}
                        >
                          {titleText}
                        </div>
                        {detailText && (
                          <div style={{ fontSize: '18px', color: '#e2e8f0', marginTop: '4px', fontWeight: '600' }}>
                            {detailText}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'left', fontSize: '18px', color: '#cbd5e1', fontWeight: '700', flexShrink: 0 }}>
                      {typeof report.goldChange === 'number' && report.goldChange !== 0 && (
                        <div style={{ color: report.goldChange > 0 ? '#fde047' : '#fca5a5', fontWeight: '900', fontSize: '21px' }}>
                          {report.goldChange > 0 ? `+${report.goldChange.toLocaleString('en-US')} 🪙` : `${report.goldChange.toLocaleString('en-US')} 🪙`}
                        </div>
                      )}
                      <div>{timeText}</div>
                    </div>
                  </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* ================= FULL WIDTH STICKY FOOTER ================= */}
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '18px 24px',
            background: 'rgba(5, 14, 25, 0.98)',
            borderTop: '2px solid rgba(212, 175, 55, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '19px', color: '#cbd5e1', fontWeight: '700' }}>
            <span>💀 قوة الانتقام تمنحك استعادة الذهب المسروق ومضاعفة نقاط الخبرة.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onClearLogs && (
              <button
                onClick={onClearLogs}
                title="مسح وتفريغ السجلات القديمة"
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1.5px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: '#fca5a5',
                  fontSize: '19px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 style={{ width: '20px', height: '20px' }} />
                <span>تفريغ السجل</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '2px solid rgba(212, 175, 55, 0.6)',
                borderRadius: '12px',
                padding: '12px 28px',
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '900',
                cursor: 'pointer',
              }}
            >
              إغلاق والعودة للميناء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarLogModal;
