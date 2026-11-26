import React, { useState } from 'react';
import { CREW_SHOP_ITEMS } from '../data';
import { CREW_VISUAL_MAP, sanitizeShipCrew } from './ShipCrewMember';
import { ShipState } from '../types';

interface CrewTavernModalProps {
  isOpen: boolean;
  onClose: () => void;
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  gems: number;
  setGems: React.Dispatch<React.SetStateAction<number>>;
  crewServices: Record<string, any>;
  setCrewServices: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  ships: ShipState[];
  setShips?: React.Dispatch<React.SetStateAction<ShipState[]>>;
  currentShipId: string | null;
  onSelectShip?: (shipId: string) => void;
  buyCrewService: (
    key: string,
    name: string,
    price: number,
    incrementCount?: number,
    costType?: 'gold' | 'gems',
    targetShipId?: string,
    quantity?: number
  ) => void;
  unassignCrewFromShip?: (key: string, shipId: string) => void;
  unassignCrewFromAllShips?: (key: string) => void;
  assignCrewToAllShips?: (key: string) => void;
  crewInventory?: Record<string, number>;
  onToggleAutoFishing?: (shipId: string) => void;
}

export const CrewTavernModal: React.FC<CrewTavernModalProps> = ({
  isOpen,
  onClose,
  gold,
  gems,
  ships,
  setShips,
  crewServices,
  setCrewServices,
  currentShipId,
  onSelectShip,
  buyCrewService,
  unassignCrewFromShip,
  unassignCrewFromAllShips,
  assignCrewToAllShips,
  crewInventory = {},
  onToggleAutoFishing,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'crew' | 'fixers'>('all');
  const [tavernCrewMultipliers, setTavernCrewMultipliers] = useState<Record<string, number>>({});
  const [globalTavernMultiplier, setGlobalTavernMultiplier] = useState<number>(1);
  const existingShips = ships.filter(s => s.exists);
  const [selectedShipId, setSelectedShipId] = useState<string>(() => {
    return currentShipId || existingShips[0]?.id || 's1';
  });

  const normalizeCrewId = (crewId: string): string => {
    if (crewId === 'police') return 'cop';
    if (crewId === 'sailors') return 'sailor';
    if (crewId === 'gold_fisher') return 'golden_hunter';
    if (crewId === 'repairer_small' || crewId === 'smallRepair') return 'fixer_sm';
    if (crewId === 'repairer_medium' || crewId === 'mediumRepair') return 'fixer_md';
    if (crewId === 'repairer_large' || crewId === 'largeRepair') return 'fixer_lg';
    if (crewId === 'repairer_legendary' || crewId === 'legendaryRepair') return 'fixer_epic';
    return crewId;
  };

  // Local fallback helpers for unassignment in case prop is not provided
  const handleUnassignSingle = (crewId: string, shipId: string) => {
    if (unassignCrewFromShip) {
      unassignCrewFromShip(crewId, shipId);
      return;
    }
    const normKey = normalizeCrewId(crewId);
    if (setShips) {
      setShips(prev => {
        const updated = prev.map(s => {
          if (s.id === shipId) {
            const current = s.assignedCrew || [];
            return {
              ...s,
              assignedCrew: current.filter(c => c !== normKey && c !== crewId),
              crewPower: Math.max(0, (s.crewPower || 0) - 15)
            };
          }
          return s;
        });
        localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleUnassignAll = (crewId: string) => {
    if (unassignCrewFromAllShips) {
      unassignCrewFromAllShips(crewId);
      return;
    }
    const normKey = normalizeCrewId(crewId);
    if (setShips) {
      setShips(prev => {
        const updated = prev.map(s => {
          const current = s.assignedCrew || [];
          return {
            ...s,
            assignedCrew: current.filter(c => c !== normKey && c !== crewId),
            crewPower: Math.max(0, (s.crewPower || 0) - (current.includes(normKey) ? 15 : 0))
          };
        });
        localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
        return updated;
      });
    }
    if (setCrewServices) {
      setCrewServices(prev => {
        const updated = { ...prev, [normKey]: false, [crewId]: false };
        if (normKey === 'golden_hunter') {
          updated.golden_hunter = false;
          updated.gold_fisher = false;
        }
        localStorage.setItem('pirate_crew_services', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleSelectExpectedFish = (shipId: string, fishName: string) => {
    if (setShips) {
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
    }
  };

  const handleAssignAll = (crewId: string) => {
    if (assignCrewToAllShips) {
      assignCrewToAllShips(crewId);
      return;
    }
    const normKey = normalizeCrewId(crewId);
    if (setShips) {
      setShips(prev => {
        const updated = prev.map(s => {
          if (s.exists) {
            const current = s.assignedCrew || [];
            const newCrew = current.includes(normKey) ? current : [...current, normKey];
            return {
              ...s,
              assignedCrew: newCrew,
              crewPower: (s.crewPower || 0) + (current.includes(normKey) ? 0 : 15),
              autoFishingPaused: false
            };
          }
          return s;
        });
        localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
        return updated;
      });
    }
    if (setCrewServices) {
      setCrewServices(prev => {
        const updated = { ...prev, [normKey]: true, [crewId]: true };
        if (normKey === 'golden_hunter') {
          updated.golden_hunter = true;
          updated.gold_fisher = true;
        }
        localStorage.setItem('pirate_crew_services', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Keep selected ship synced with prop when opened or changed
  React.useEffect(() => {
    if (currentShipId) {
      setSelectedShipId(currentShipId);
    }
  }, [currentShipId, isOpen]);

  // One-time auto-clean of any legacy non-standard crew IDs stored in ships state
  React.useEffect(() => {
    if (!isOpen || !setShips) return;
    let needsUpdate = false;
    const cleaned = ships.map(s => {
      const sanitized = sanitizeShipCrew(s.assignedCrew);
      const isDifferent = (s.assignedCrew || []).length !== sanitized.length;
      if (isDifferent) {
        needsUpdate = true;
        return {
          ...s,
          assignedCrew: sanitized,
          crewPower: sanitized.length * 15
        };
      }
      return s;
    });
    if (needsUpdate) {
      setShips(cleaned);
      localStorage.setItem('pirate_ships_v2', JSON.stringify(cleaned));
    }
  }, [isOpen, ships, setShips]);

  if (!isOpen) return null;

  const currentShip = existingShips.find(s => s.id === selectedShipId) || existingShips[0];
  const currentAssignedCrew = currentShip ? sanitizeShipCrew(currentShip.assignedCrew) : [];

  // Filter items based on selected category
  const filteredItems = CREW_SHOP_ITEMS.filter(item => {
    if (filterCategory === 'fixers') {
      return item.id.startsWith('fixer');
    }
    if (filterCategory === 'crew') {
      return !item.id.startsWith('fixer');
    }
    return true;
  });

  const isAssignedToCurrentShip = (crewId: string): boolean => {
    if (!currentShip) return false;
    const checkId = normalizeCrewId(crewId);
    const rawCrew = currentShip.assignedCrew || [];
    return currentAssignedCrew.includes(checkId) || 
           currentAssignedCrew.includes(crewId) || 
           rawCrew.includes(checkId) || 
           rawCrew.includes(crewId);
  };

  const isAssignedToAnyShip = (crewId: string): boolean => {
    const checkId = normalizeCrewId(crewId);
    return existingShips.some(s => (s.assignedCrew || []).includes(checkId) || (s.assignedCrew || []).includes(crewId));
  };

  const isAssignedToAllShips = (crewId: string): boolean => {
    if (existingShips.length === 0) return false;
    const checkId = normalizeCrewId(crewId);
    return existingShips.every(s => (s.assignedCrew || []).includes(checkId) || (s.assignedCrew || []).includes(crewId));
  };

  return (
    <div
      className="tab-overlay"
      style={{
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(16, 12, 8, 0.98) 0%, rgba(8, 6, 4, 0.99) 100%)',
        border: '2.5px solid #ca8a04',
        boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(202, 138, 4, 0.3)',
        overflow: 'hidden',
        paddingBottom: '20px',
      }}
    >
      {/* Header */}
      <div
        className="tab-title"
        style={{
          borderBottom: '2px solid rgba(202, 138, 4, 0.5)',
          paddingBottom: '14px',
          marginBottom: '12px',
          flexShrink: 0,
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
          <span style={{ fontSize: '38px', lineHeight: 1 }}>👥</span>
          <div>
            <div style={{ fontSize: '30px', fontWeight: '900', color: '#fef08a', textShadow: '0 2px 4px rgba(0,0,0,0.8)', lineHeight: 1.2 }}>
              حانة وتعيين طواقم الأسطول
            </div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#fbbf24', marginTop: '4px' }}>
              عيّن شخصية الطاقم مباشرة على ظهر السفينة التي تحددها لتعزيز قوتها وصيدها
            </div>
          </div>
        </div>
        <button
          className="close-tab-btn"
          onClick={onClose}
          style={{
            fontSize: '22px',
            padding: '10px 22px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ✕ إغلاق
        </button>
      </div>

      {/* Ship Selector Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 0',
          borderBottom: '1.5px solid rgba(202, 138, 4, 0.35)',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '18px', color: '#f1f5f9', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          📍 اختر السفينة لتعيين الطاقم:
        </span>
        {existingShips.map((ship, idx) => {
          const isSelected = ship.id === selectedShipId;
          const assignedList = sanitizeShipCrew(ship.assignedCrew);
          const assignedCount = assignedList.length;
          return (
            <button
              key={ship.id}
              onClick={() => {
                setSelectedShipId(ship.id);
                if (onSelectShip) onSelectShip(ship.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: isSelected
                  ? 'linear-gradient(135deg, #ca8a04 0%, #854d0e 100%)'
                  : 'rgba(30, 41, 59, 0.85)',
                color: isSelected ? '#fff' : '#e2e8f0',
                border: isSelected ? '2px solid #facc15' : '1.5px solid #475569',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '900',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: isSelected ? '0 0 14px rgba(250, 204, 21, 0.55)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '21px' }}>🚢</span>
              <span>{ship.name} ({idx + 1})</span>
              {assignedCount > 0 && (
                <span
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '2px 10px',
                    fontSize: '15px',
                    fontWeight: '900'
                  }}
                >
                  👤 {assignedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Ship Banner & Assigned Crew Preview */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'linear-gradient(90deg, rgba(202, 138, 4, 0.28) 0%, rgba(120, 53, 15, 0.38) 100%)',
          border: '1.5px solid #ca8a04',
          borderRadius: '12px',
          padding: '11px 18px',
          margin: '10px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '26px' }}>⚓</span>
          <span style={{ fontSize: '20px', color: '#fef08a', fontWeight: '900' }}>
            السفينة المحددة: <span style={{ color: '#fff', textDecoration: 'underline' }}>{currentShip?.name || 'سفينة'}</span>
          </span>
          {currentShip && (
            <span style={{ fontSize: '17px', background: currentAssignedCrew.length > 0 ? '#059669' : '#475569', color: '#fff', padding: '4px 12px', borderRadius: '14px', fontWeight: '900' }}>
              قوة الطاقم: 👤 +{currentAssignedCrew.length * 15}
            </span>
          )}

          {/* Render miniature crew badges assigned to this ship */}
          {currentAssignedCrew.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: '700' }}>الطاقم على ظهر السفينة:</span>
              {currentAssignedCrew.map(cId => {
                const info = CREW_VISUAL_MAP[cId];
                if (!info) return null;
                return (
                  <span
                    key={cId}
                    title={info.name}
                    style={{
                      background: info.badgeBg,
                      border: `2px solid ${info.badgeBorder}`,
                      borderRadius: '50%',
                      width: '34px',
                      height: '34px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '19px'
                    }}
                  >
                    {info.badgeIcon}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Currency balances */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '20px', fontWeight: '900' }}>
          <span style={{ color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '22px' }}>🪙</span>
            <span>{gold.toLocaleString('en-US')} ذهب</span>
          </span>
          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '22px' }}>💎</span>
            <span>{gems.toLocaleString('en-US')} جوهرة</span>
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '12px',
          borderBottom: '1.5px solid rgba(255,255,255,0.12)',
          paddingBottom: '10px',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setFilterCategory('all')}
          style={{
            padding: '11px 20px',
            borderRadius: '10px',
            border: filterCategory === 'all' ? '2px solid #facc15' : '1.5px solid rgba(255,255,255,0.2)',
            background: filterCategory === 'all' ? 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' : 'rgba(30, 24, 18, 0.75)',
            color: filterCategory === 'all' ? '#fef08a' : '#e2e8f0',
            fontWeight: '900',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: filterCategory === 'all' ? '0 0 12px rgba(250, 204, 21, 0.45)' : 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ⚓ جميع الطواقم والمصلحين ({CREW_SHOP_ITEMS.length})
        </button>

        <button
          onClick={() => setFilterCategory('crew')}
          style={{
            padding: '11px 20px',
            borderRadius: '10px',
            border: filterCategory === 'crew' ? '2px solid #facc15' : '1.5px solid rgba(255,255,255,0.2)',
            background: filterCategory === 'crew' ? 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' : 'rgba(30, 24, 18, 0.75)',
            color: filterCategory === 'crew' ? '#fef08a' : '#e2e8f0',
            fontWeight: '900',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: filterCategory === 'crew' ? '0 0 12px rgba(250, 204, 21, 0.45)' : 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          👥 أفراد الطاقم والبحارة (7)
        </button>

        <button
          onClick={() => setFilterCategory('fixers')}
          style={{
            padding: '11px 20px',
            borderRadius: '10px',
            border: filterCategory === 'fixers' ? '2px solid #facc15' : '1.5px solid rgba(255,255,255,0.2)',
            background: filterCategory === 'fixers' ? 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' : 'rgba(30, 24, 18, 0.75)',
            color: filterCategory === 'fixers' ? '#fef08a' : '#e2e8f0',
            fontWeight: '900',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: filterCategory === 'fixers' ? '0 0 12px rgba(250, 204, 21, 0.45)' : 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          🛠️ مصلحو وهياكل السفن (4)
        </button>
      </div>

      {/* GLOBAL CREW MULTIPLIER & CUSTOM QUANTITY BANNER */}
      <div
        style={{
          width: '100%',
          margin: '0 auto 14px auto',
          background: 'linear-gradient(90deg, #1e1b4b, #312e81, #1e1b4b)',
          border: '2px solid #818cf8',
          borderRadius: '14px',
          padding: '12px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>👥</span>
          <div>
            <div style={{ fontSize: '19px', fontWeight: '900', color: '#e0e7ff' }}>
              مضاعفة كمية الشراء لكافة الطواقم (تحديد كم ماتبي)
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#c7d2fe', marginTop: '2px' }}>
              حدد أي رقم تريده لتوظيف 3 أو 4 أو أكثر دفعة واحدة لكل فرد طاقم
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.45)', padding: '5px 8px', borderRadius: '10px', border: '1.5px solid #6366f1' }}>
            <button
              type="button"
              onClick={() => setGlobalTavernMultiplier(prev => Math.max(1, prev - 1))}
              style={{
                width: '38px',
                height: '36px',
                borderRadius: '7px',
                border: 'none',
                background: '#ef4444',
                color: '#fff',
                fontSize: '22px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="9999"
              value={globalTavernMultiplier}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setGlobalTavernMultiplier(isNaN(val) || val < 1 ? 1 : val);
              }}
              style={{
                width: '82px',
                height: '36px',
                borderRadius: '7px',
                border: '1.5px solid #818cf8',
                background: '#0f172a',
                color: '#facc15',
                textAlign: 'center',
                fontWeight: '900',
                fontSize: '20px',
              }}
              title="أدخل أي كمية تريدها"
            />
            <button
              type="button"
              onClick={() => setGlobalTavernMultiplier(prev => prev + 1)}
              style={{
                width: '38px',
                height: '36px',
                borderRadius: '7px',
                border: 'none',
                background: '#22c55e',
                color: '#fff',
                fontSize: '22px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>

          {[1, 3, 4, 5, 10, 50].map(mult => (
            <button
              key={mult}
              type="button"
              onClick={() => setGlobalTavernMultiplier(mult)}
              style={{
                padding: '7px 13px',
                borderRadius: '8px',
                border: globalTavernMultiplier === mult ? '2px solid #facc15' : '1.5px solid rgba(255,255,255,0.25)',
                background: globalTavernMultiplier === mult ? '#4f46e5' : 'rgba(0,0,0,0.45)',
                color: '#fff',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              {mult}x
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              const updated: Record<string, number> = {};
              filteredItems.forEach(c => {
                updated[c.id] = globalTavernMultiplier;
              });
              setTavernCrewMultipliers(prev => ({ ...prev, ...updated }));
            }}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1.5px solid #fef08a',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              fontWeight: '900',
              fontSize: '17px',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.45)',
            }}
          >
            تطبيق على كافة الطواقم ⚡
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '22px',
          justifyContent: 'center',
          alignItems: 'stretch',
          padding: '8px 6px 36px 6px',
        }}
      >
        {filteredItems.map(item => {
          const isFixer = item.id.startsWith('fixer');
          const assignedToCurrent = isAssignedToCurrentShip(item.id);
          const normId = normalizeCrewId(item.id);
          const ownedQty = (crewInventory && (crewInventory[item.id] || crewInventory[normId] || (item.id === 'police' ? crewInventory['cop'] : 0) || (item.id === 'sailors' ? crewInventory['sailor'] : 0))) || (assignedToCurrent ? 1 : 0);

          return (
            <div
              key={item.id}
              style={{
                width: '430px',
                maxWidth: '100%',
                minHeight: '610px',
                borderRadius: '18px',
                border: assignedToCurrent ? '3px solid #22c55e' : '2.5px solid rgba(234, 179, 8, 0.8)',
                boxShadow: assignedToCurrent
                  ? '0 12px 30px rgba(34, 197, 94, 0.35), 0 0 18px rgba(34, 197, 94, 0.4)'
                  : '0 12px 30px rgba(0,0,0,0.7), 0 0 18px rgba(234, 179, 8, 0.28)',
                position: 'relative',
                overflow: 'hidden',
                background: '#0a1020',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              {/* Card Background Layer */}
              {item.bgImage ? (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                  <img
                    src={item.bgImage}
                    alt="خلفية"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      filter: 'brightness(0.88) contrast(1.06)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(10, 16, 32, 0.25) 0%, rgba(10, 16, 32, 0.72) 55%, rgba(6, 10, 22, 0.96) 100%)',
                    }}
                  />
                </div>
              ) : null}

              {/* Top Badges */}
              <div
                style={{
                  position: 'relative',
                  padding: '12px 14px 0 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  zIndex: 10,
                }}
              >
                {/* Category Badge */}
                <div
                  style={{
                    background: 'rgba(10, 15, 30, 0.9)',
                    color: '#fde047',
                    border: '1.5px solid rgba(250, 204, 21, 0.55)',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '900',
                    padding: '5px 11px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span>{isFixer ? 'صيانة وإصلاح' : 'طاقم بحري'}</span>
                </div>

                {/* Owned Badge */}
                <div
                  style={{
                    background: ownedQty > 0 ? 'rgba(79, 70, 229, 0.92)' : 'rgba(30, 41, 59, 0.9)',
                    color: '#ffffff',
                    border: ownedQty > 0 ? '1.5px solid #818cf8' : '1.5px solid rgba(255,255,255,0.25)',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '900',
                    padding: '5px 11px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  title="العدد الإجمالي المملوك لديك من هذا الطاقم"
                >
                  <span>🎒 المملوك:</span>
                  <span style={{ color: '#fde047' }}>{ownedQty}</span>
                </div>

                {/* Price Badge */}
                <div
                  style={{
                    background: item.costType === 'gold'
                      ? 'rgba(234, 179, 8, 0.96)'
                      : 'rgba(56, 189, 248, 0.96)',
                    color: item.costType === 'gold' ? '#000000' : '#ffffff',
                    border: item.costType === 'gold'
                      ? '1.5px solid #fef08a'
                      : '1.5px solid #7dd3fc',
                    borderRadius: '10px',
                    fontSize: '15.5px',
                    fontWeight: '900',
                    padding: '5px 11px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.costType === 'gold' ? '🪙' : '💎'}</span>
                  <span>{item.costType === 'gold' ? item.price.toLocaleString('en-US') : item.price}</span>
                </div>
              </div>

              {/* Character Illustration / Standalone cutout */}
              {item.image && (
                <div
                  style={{
                    position: 'relative',
                    height: '215px',
                    zIndex: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 14px',
                    pointerEvents: 'none',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    style={{
                      maxHeight: '200px',
                      maxWidth: '230px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(250, 204, 21, 0.35))',
                    }}
                  />
                </div>
              )}

              {/* Bottom Panel (Flow Layout so text & enlarged controls never overlap the character) */}
              <div
                style={{
                  position: 'relative',
                  marginTop: 'auto',
                  background: 'linear-gradient(to top, rgba(6, 10, 22, 0.98) 0%, rgba(6, 10, 22, 0.94) 84%, rgba(6, 10, 22, 0.72) 100%)',
                  backdropFilter: 'blur(8px)',
                  padding: '14px 16px 16px 16px',
                  borderTop: '1.5px solid rgba(250, 204, 21, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'right',
                  direction: 'rtl',
                  zIndex: 10,
                }}
              >
                {/* Title */}
                <div
                  style={{
                    fontSize: '23px',
                    fontWeight: '900',
                    color: '#facc15',
                    marginBottom: '6px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <span>{item.title}</span>
                  <span style={{ fontSize: '26px', flexShrink: 0 }}>{item.icon}</span>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: '16.5px',
                    color: '#f1f5f9',
                    fontWeight: '600',
                    lineHeight: '1.5',
                    marginBottom: '10px',
                    textShadow: '0 1px 3px rgba(0,0,0,0.85)',
                    minHeight: '48px',
                  }}
                >
                  {item.desc}
                </div>

                {/* Stars and rarity */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    marginBottom: '10px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: '1.5px solid rgba(234, 179, 8, 0.4)',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '3px', color: '#fbbf24', fontSize: '16px' }}>
                    <span>⭐</span>
                    <span>⭐</span>
                    <span>⭐</span>
                    <span>⭐</span>
                    <span>⭐</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.5px', fontWeight: '900' }}>
                    <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>💎</span>
                      <span>نادر</span>
                    </span>
                    <span style={{ color: '#fbbf24' }}>⚓ خاص بالسفينة</span>
                  </div>
                </div>

                {/* Action / Hire / Assign Button */}
                {(() => {
                  const isGH = item.id === 'golden_hunter' || item.id === 'gold_fisher';
                  const ghAssignedCount = existingShips.filter(s => (s.assignedCrew || []).includes('golden_hunter') || (s.assignedCrew || []).includes('gold_fisher')).length;
                  // Only treat Golden Hunter as assigned if at least ONE ship actually has him in assignedCrew!
                  const isGHAssignedAny = ghAssignedCount > 0;
                  const isGHAssignedAll = ghAssignedCount >= existingShips.length && existingShips.length > 0;

                  const selectedCrewQty = tavernCrewMultipliers[item.id] || 1;
                  const totalCrewCost = item.price * selectedCrewQty;

                  // Quantity Controls Component
                  const quantityBox = (
                    <div style={{ width: '100%', background: 'rgba(0,0,0,0.52)', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(250, 204, 21, 0.45)', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15.5px', color: '#fef08a', marginBottom: '8px', fontWeight: '900' }}>
                        <span>🔢 خانة الكمية (كم ماتبي):</span>
                        <span style={{ color: '#facc15', fontWeight: '900' }}>{selectedCrewQty}x فرد</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = Math.max(1, selectedCrewQty - 1);
                            setTavernCrewMultipliers(prev => ({ ...prev, [item.id]: next }));
                          }}
                          style={{
                            width: '40px',
                            height: '36px',
                            borderRadius: '7px',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            background: 'rgba(239, 68, 68, 0.7)',
                            color: '#ffffff',
                            fontSize: '22px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={selectedCrewQty}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const next = isNaN(val) || val < 1 ? 1 : val;
                            setTavernCrewMultipliers(prev => ({ ...prev, [item.id]: next }));
                          }}
                          style={{
                            width: '84px',
                            height: '36px',
                            borderRadius: '7px',
                            border: '2px solid #facc15',
                            background: '#090d16',
                            color: '#facc15',
                            textAlign: 'center',
                            fontSize: '19px',
                            fontWeight: '900',
                            padding: '0 4px'
                          }}
                          title="أدخل أي كمية تريدها"
                        />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = selectedCrewQty + 1;
                            setTavernCrewMultipliers(prev => ({ ...prev, [item.id]: next }));
                          }}
                          style={{
                            width: '40px',
                            height: '36px',
                            borderRadius: '7px',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            background: 'rgba(34, 197, 94, 0.7)',
                            color: '#ffffff',
                            fontSize: '22px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Presets: 1, 3, 4, 5, 10, 50 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {[1, 3, 4, 5, 10, 50].map(multiplier => {
                          const isSelected = selectedCrewQty === multiplier;
                          return (
                            <button
                              key={multiplier}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTavernCrewMultipliers(prev => ({ ...prev, [item.id]: multiplier }));
                              }}
                              style={{
                                fontSize: '14.5px',
                                fontWeight: '900',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: isSelected ? '2px solid #facc15' : '1.5px solid rgba(255, 255, 255, 0.25)',
                                background: isSelected ? 'linear-gradient(to bottom, #ca8a04, #854d0e)' : 'rgba(0, 0, 0, 0.55)',
                                color: isSelected ? '#ffffff' : '#e2e8f0',
                                cursor: 'pointer',
                              }}
                            >
                              {multiplier}x
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );

                  const buyBtn = (btnText: string) => (
                    <button
                      onClick={() => {
                        buyCrewService(item.id, item.title, totalCrewCost, 0, item.costType, selectedShipId, selectedCrewQty);
                      }}
                      style={{
                        width: '100%',
                        background: item.costType === 'gold'
                          ? 'linear-gradient(to bottom, #f59e0b, #d97706)'
                          : 'linear-gradient(to bottom, #0284c7, #0369a1)',
                        color: '#fff',
                        border: item.costType === 'gold' ? '2px solid #fde68a' : '2px solid #bae6fd',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        fontSize: '18.5px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        boxShadow: item.costType === 'gold'
                          ? '0 4px 14px rgba(245, 158, 11, 0.45)'
                          : '0 4px 14px rgba(2, 132, 199, 0.45)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>🛒 {btnText} ({selectedCrewQty}x)</span>
                      <span style={{ fontSize: '20px' }}>{item.costType === 'gold' ? '🪙' : '💎'}</span>
                      <span>{item.costType === 'gold' ? totalCrewCost.toLocaleString('en-US') : totalCrewCost}</span>
                    </button>
                  );

                  if (isGH) {
                    if (isGHAssignedAny) {
                      const isPaused = currentShip?.autoFishingPaused;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Fleet Status Badge */}
                          <div
                            style={{
                              background: 'rgba(22, 163, 74, 0.28)',
                              color: '#4ade80',
                              border: '1.5px solid #16a34a',
                              borderRadius: '10px',
                              padding: '8px 10px',
                              fontSize: '15.5px',
                              fontWeight: '900',
                              textAlign: 'center',
                              boxShadow: '0 0 10px rgba(34, 197, 94, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                            }}
                          >
                            <span>🔱 {isGHAssignedAll ? 'مُعيّن على كامل الأسطول' : `مُعيّن على (${ghAssignedCount}/${existingShips.length}) سفن`}</span>
                            <span style={{ fontSize: '14px', color: '#fef08a', whiteSpace: 'nowrap' }}>24/7 صيد</span>
                          </div>

                          {/* Pause / Resume Button */}
                          <button
                            onClick={() => {
                              if (onToggleAutoFishing) {
                                onToggleAutoFishing(selectedShipId);
                              } else {
                                if (setShips) {
                                  setShips(prev => {
                                    const updated = prev.map(s => ({ ...s, autoFishingPaused: !s.autoFishingPaused }));
                                    localStorage.setItem('pirate_ships_v2', JSON.stringify(updated));
                                    return updated;
                                  });
                                }
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '9px',
                              fontSize: '16.5px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              background: isPaused
                                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                : 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
                              color: '#ffffff',
                              border: isPaused ? '1.5px solid #34d399' : '1.5px solid #facc15',
                            }}
                          >
                            <span>{isPaused ? '▶️ تشغيل الصيد التلقائي' : '⏸️ إيقاف مؤقت'}</span>
                          </button>

                          {/* Action Row: Cancel Everywhere + Assign to All */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                handleUnassignAll(item.id);
                                alert('🗑️ تم إلغاء تعيين الصياد الذهبي وسحبه من كافة سفن الأسطول بنجاح!');
                              }}
                              style={{
                                flex: 1,
                                background: 'rgba(239, 68, 68, 0.28)',
                                color: '#fecaca',
                                border: '1.5px solid #ef4444',
                                borderRadius: '9px',
                                padding: '8px 10px',
                                fontSize: '15px',
                                fontWeight: '900',
                                cursor: 'pointer',
                              }}
                            >
                              إلغاء من الكل ✖
                            </button>

                            {assignedToCurrent && (
                              <button
                                onClick={() => {
                                  handleUnassignSingle(item.id, selectedShipId);
                                  alert(`🗑️ تم إلغاء تعيين الصياد الذهبي من [${currentShip?.name}] بنجاح!`);
                                }}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.24)',
                                  color: '#fecaca',
                                  border: '1.5px solid #ef4444',
                                  borderRadius: '9px',
                                  padding: '8px 10px',
                                  fontSize: '15px',
                                  fontWeight: '900',
                                  cursor: 'pointer',
                                }}
                              >
                                إلغاء من السفينة ✖
                              </button>
                            )}

                            {!isGHAssignedAll && (
                              <button
                                onClick={() => {
                                  handleAssignAll(item.id);
                                  alert('🌐 تم تعيين الصياد الذهبي على كافة سفن الأسطول الثلاث بنجاح!');
                                }}
                                style={{
                                  flex: 1,
                                  background: 'linear-gradient(135deg, #ca8a04 0%, #854d0e 100%)',
                                  color: '#ffffff',
                                  border: '1.5px solid #facc15',
                                  borderRadius: '9px',
                                  padding: '8px 10px',
                                  fontSize: '15px',
                                  fontWeight: '900',
                                  cursor: 'pointer',
                                }}
                              >
                                تعيين للثلاث سفن 🌐
                              </button>
                            )}
                          </div>

                          {/* Also show quantity selection and buy extra */}
                          {quantityBox}
                          {buyBtn('توظيف وشراء إضافي')}
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {quantityBox}
                          {buyBtn('توظيف وتعيين')}
                        </div>
                      );
                    }
                  }

                  // Non-Golden Hunter crew and fixers
                  if (assignedToCurrent) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                          <div
                            style={{
                              flex: 1,
                              background: 'rgba(22, 163, 74, 0.28)',
                              color: '#4ade80',
                              border: '1.5px solid #16a34a',
                              borderRadius: '10px',
                              padding: '9px 10px',
                              fontSize: '16px',
                              fontWeight: '900',
                              textAlign: 'center',
                              boxShadow: '0 0 10px rgba(34, 197, 94, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            ✔️ مُعيّن على {currentShip?.name}
                          </div>
                          <button
                            onClick={() => {
                              handleUnassignSingle(item.id, selectedShipId);
                              alert(`🗑️ تم إلغاء تعيين [${item.title}] من [${currentShip?.name}] بنجاح!`);
                            }}
                            title="إلغاء تعيين هذا الطاقم"
                            style={{
                              background: 'rgba(239, 68, 68, 0.34)',
                              color: '#fecaca',
                              border: '1.5px solid #ef4444',
                              borderRadius: '10px',
                              padding: '9px 14px',
                              fontSize: '16px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>إلغاء</span>
                            <span>✖</span>
                          </button>
                        </div>

                        {/* Guide Expected Fish Selector */}
                        {item.id === 'guide' && currentShip && (
                          <div style={{ background: 'rgba(2, 132, 199, 0.24)', border: '1.5px solid #38bdf8', borderRadius: '10px', padding: '8px 10px' }}>
                            <div style={{ fontSize: '15.5px', color: '#bae6fd', fontWeight: '900', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>🧭 السمك المتوقع:</span>
                              <span style={{ color: '#fef08a' }}>{currentShip.expectedFish || (currentShip.fishTypes && currentShip.fishTypes[currentShip.fishTypes.length - 1]) || 'السردين'} 🐟</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(currentShip.fishTypes && currentShip.fishTypes.length > 0 ? currentShip.fishTypes : ['السردين']).map((fName, fIdx) => {
                                const isSel = (currentShip.expectedFish || currentShip.fishTypes?.[currentShip.fishTypes.length - 1]) === fName;
                                return (
                                  <button
                                    key={fIdx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectExpectedFish(currentShip.id, fName);
                                    }}
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: '7px',
                                      fontSize: '14.5px',
                                      fontWeight: '900',
                                      cursor: 'pointer',
                                      border: isSel ? '2px solid #facc15' : '1.5px solid rgba(56, 189, 248, 0.45)',
                                      background: isSel ? 'linear-gradient(135deg, #ca8a04, #854d0e)' : 'rgba(15, 23, 42, 0.85)',
                                      color: isSel ? '#ffffff' : '#bae6fd',
                                    }}
                                  >
                                    {isSel ? '🎯 ' : ''}{fName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Also allow buying more even if already assigned! */}
                        {quantityBox}
                        {buyBtn('توظيف وشراء إضافي')}
                      </div>
                    );
                  }

                  return (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {quantityBox}
                      {buyBtn('توظيف وتعيين')}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrewTavernModal;
