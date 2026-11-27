import React from 'react';

interface TopBarHudProps {
  gold: number;
  gems: number;
  fishCount: number;
  level: number;
  avatar?: string;
  useCustomAvatarFrame?: boolean;
  ships: Array<{
    id: string;
    name?: string;
    exists?: boolean;
    status?: string;
  }>;
  portDestroyed: boolean;
  unavengedAlertsCount: number;
  isOnline: boolean;
  onOpenProfile: () => void;
  onOpenShop: () => void;
  onOpenFishStorage: () => void;
  onOpenWarLog: () => void;
  onClickShipSlot: (shipId?: string) => void;
  onClickOfflineBanner: () => void;
}

export const TopBarHud: React.FC<TopBarHudProps> = ({
  gold,
  gems,
  fishCount,
  level,
  avatar,
  useCustomAvatarFrame = false,
  ships,
  portDestroyed,
  unavengedAlertsCount,
  isOnline,
  onOpenProfile,
  onOpenShop,
  onOpenFishStorage,
  onOpenWarLog,
  onClickShipSlot,
  onClickOfflineBanner,
}) => {
  const formattedGold = gold.toLocaleString('en-US');
  const formattedGems = gems.toLocaleString('en-US');
  const formattedFish = fishCount.toLocaleString('en-US');
  const trimmedAvatar = (avatar || '').trim();
  const isImageAvatar =
    trimmedAvatar.startsWith('data:image') ||
    trimmedAvatar.startsWith('/') ||
    trimmedAvatar.startsWith('http://') ||
    trimmedAvatar.startsWith('https://');
  const showDefaultHex =
    (!useCustomAvatarFrame && !isImageAvatar) ||
    !trimmedAvatar ||
    trimmedAvatar === 'default' ||
    trimmedAvatar === 'silhouette';

  return (
    <div
      dir="ltr"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 15,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Top Ornate Bar Clean Artwork (720 x 207) with Baked Numbers Removed */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'min(26.5vw, 16.5dvh)',
          overflow: 'hidden',
          pointerEvents: 'auto',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
        }}
      >
        <img
          src="/assets/top_hud_clean.png"
          alt="شريط الأيقونات العلوية"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            display: 'block',
            pointerEvents: 'none',
          }}
        />

        {/* Hexagonal Bronze Profile Frame in Top-Left Corner */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '1.8%',
            top: '4.8%',
            height: '89%',
            aspectRatio: '164 / 192',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {showDefaultHex ? (
            <img
              src="/assets/profile_hex_default.png"
              alt="البروفايل"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: '12%',
                  top: '11%',
                  width: '76%',
                  height: '72%',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: '#352925',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {isImageAvatar ? (
                  <img
                    src={trimmedAvatar}
                    alt="صورة القبطان"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 'clamp(22px, 4.2vw, 44px)',
                      lineHeight: 1,
                    }}
                  >
                    {trimmedAvatar}
                  </span>
                )}
              </div>
              <img
                src="/assets/profile_hex_frame.png"
                alt="إطار البروفايل"
                draggable={false}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          {/* Live Level Number Inside Bottom Copper Oval */}
          <div
            style={{
              position: 'absolute',
              left: '33%',
              top: '79.5%',
              width: '34%',
              height: '16.5%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <span
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: level >= 100 ? 'clamp(9px, 1.35vw, 15px)' : 'clamp(12px, 2.0vw, 22px)',
                fontWeight: '900',
                color: '#ffffff',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                textShadow:
                  '-1px -1px 0 #1f0e06, 1px -1px 0 #1f0e06, -1px 1px 0 #1f0e06, 1px 1px 0 #1f0e06, 0 2px 3px rgba(0, 0, 0, 0.9)',
              }}
            >
              {level}
            </span>
          </div>
        </div>

        {/* Dynamic Gold Balance Directly on Clean Gold Ribbon (Large, Bright & Crisp) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '17.8%',
            top: '65.8%',
            width: '35.2%',
            height: '22.5%',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2px',
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 2,
          }}
        >
          <span
            id="gold-count"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize:
                formattedGold.length >= 22
                  ? 'clamp(18px, 2.35vw, 26px)'
                  : formattedGold.length >= 18
                  ? 'clamp(19px, 2.55vw, 28px)'
                  : formattedGold.length >= 14
                  ? 'clamp(20px, 2.75vw, 30px)'
                  : formattedGold.length > 10
                  ? 'clamp(21px, 3.0vw, 33px)'
                  : 'clamp(22px, 3.3vw, 36px)',
              fontWeight: '800',
              letterSpacing: '0.2px',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              color: '#fef3c7',
              textShadow:
                '0 2px 4px rgba(0, 0, 0, 0.98), 0 0 8px rgba(0, 0, 0, 0.9), -1px -1px 0 rgba(20, 10, 4, 0.95), 1px -1px 0 rgba(20, 10, 4, 0.95), -1px 1px 0 rgba(20, 10, 4, 0.95), 1px 1px 0 rgba(20, 10, 4, 0.95)',
              whiteSpace: 'nowrap',
            }}
          >
            {formattedGold}
          </span>
        </div>

        {/* Dynamic Gems Count Directly on Extended Crimson Bar (Larger & Clearer) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '82.2%',
            top: '38.6%',
            width: '11.0%',
            height: '15.2%',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <span
            id="gems-count"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize:
                formattedGems.length >= 9
                  ? 'clamp(13px, 1.75vw, 20px)'
                  : formattedGems.length >= 6
                  ? 'clamp(15px, 2.05vw, 23px)'
                  : 'clamp(17px, 2.35vw, 27px)',
              fontWeight: '800',
              color: '#ffffff',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.98), 0 0 6px rgba(0, 0, 0, 0.85)',
              whiteSpace: 'nowrap',
            }}
          >
            {formattedGems}
          </span>
        </div>

        {/* Dynamic Fish Count Directly on Wide Left Fish Bar (Larger & Clearer) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '73.4%',
            top: '66.8%',
            width: '15.0%',
            height: '17.4%',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize:
                formattedFish.length >= 9
                  ? 'clamp(13px, 1.75vw, 20px)'
                  : formattedFish.length >= 6
                  ? 'clamp(15px, 2.1vw, 24px)'
                  : 'clamp(17px, 2.35vw, 27px)',
              fontWeight: '800',
              color: '#ffffff',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.98), 0 0 6px rgba(0, 0, 0, 0.85)',
              whiteSpace: 'nowrap',
            }}
          >
            {formattedFish}
          </span>
        </div>

        {/* Interactive Click Zones Over Every Top HUD Element */}
        <button
          type="button"
          onClick={onOpenProfile}
          title="تغيير صورة البروفايل"
          aria-label="تغيير صورة البروفايل"
          style={{
            position: 'absolute',
            left: '1.2%',
            top: '3%',
            width: '17.6%',
            height: '94%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 4,
          }}
        />

        <button
          type="button"
          onClick={onOpenShop}
          title={`الذهب: ${formattedGold}`}
          aria-label="الذهب والمتجر"
          style={{
            position: 'absolute',
            left: '18.8%',
            top: '63%',
            width: '34.2%',
            height: '28%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 4,
          }}
        />

        {[
          { left: '29.2%', idx: 0 },
          { left: '46.2%', idx: 1 },
          { left: '64.0%', idx: 2 },
        ].map(({ left, idx }) => {
          const ship = ships[idx];
          return (
            <button
              key={ship?.id || idx}
              type="button"
              onClick={() => onClickShipSlot(ship?.exists ? ship.id : undefined)}
              title={ship?.exists ? `${ship.name || 'سفينة'} - اضغط للفتح` : 'مستودع السفن'}
              aria-label={ship?.exists ? ship.name || 'سفينة' : 'مستودع السفن'}
              style={{
                position: 'absolute',
                left,
                top: '4%',
                width: '11%',
                height: '56%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                zIndex: 4,
              }}
            />
          );
        })}

        <button
          type="button"
          onClick={onOpenShop}
          title="شراء الجواهر"
          aria-label="شراء الجواهر"
          style={{
            position: 'absolute',
            left: '76.2%',
            top: '30%',
            width: '22.8%',
            height: '30%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 4,
          }}
        />

        <button
          type="button"
          onClick={onOpenFishStorage}
          title="مخزن الأسماك"
          aria-label="مخزن الأسماك"
          style={{
            position: 'absolute',
            left: '72.5%',
            top: '62%',
            width: '26%',
            height: '28%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 4,
          }}
        />
      </div>

      {/* Floating Right-Side Alerts Tile ("التنبيهات") */}
      <button
        type="button"
        onClick={onOpenWarLog}
        title="سجل التنبيهات والمعارك والغارات 💀"
        aria-label="التنبيهات"
        style={{
          position: 'absolute',
          top: '101.5%',
          right: '0.6%',
          width: '9.8%',
          aspectRatio: '120 / 125',
          padding: 0,
          border: 'none',
          borderRadius: '4px',
          overflow: 'hidden',
          background: '#1c1814',
          boxShadow: '0 8px 22px rgba(0, 0, 0, 0.8)',
          cursor: 'pointer',
          pointerEvents: 'auto',
          zIndex: 16,
        }}
      >
        <img
          src="/assets/alerts_tile.png"
          alt="التنبيهات"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
        {unavengedAlertsCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '900',
              padding: '2px 7px',
              borderRadius: '9999px',
              border: '1.5px solid #fecaca',
              boxShadow: '0 0 10px #ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              animation: 'pulse 1.2s infinite',
              zIndex: 2,
            }}
          >
            <span>💥</span>
            <span>{unavengedAlertsCount}</span>
          </span>
        )}
      </button>

      {/* Offline Status Warning Badge (when disconnected) */}
      {!isOnline && (
        <div
          onClick={onClickOfflineBanner}
          style={{
            position: 'absolute',
            top: '104.83%',
            left: '16px',
            background: 'rgba(239, 68, 68, 0.9)',
            border: '1.5px solid #fecaca',
            borderRadius: '14px',
            padding: '5px 12px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          title="انقر لعرض تفاصيل التنبيه"
        >
          <span>⚠️</span>
          <span>الإنترنت مفصول (المعاملات مجمدة)</span>
        </div>
      )}
    </div>
  );
};

export default TopBarHud;
