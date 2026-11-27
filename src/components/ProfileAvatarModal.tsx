import React, { useRef, useState } from 'react';

interface ProfileAvatarModalProps {
  isOpen: boolean;
  currentAvatar: string;
  useCustomAvatarFrame: boolean;
  username: string;
  pirateClass: string;
  level: number;
  googlePhotoUrl?: string | null;
  onSelectAvatar: (nextAvatar: string, isCustom: boolean) => void;
  onClose: () => void;
}

const READY_PORTRAITS: Array<{ id: string; src: string; label: string }> = [
  { id: 'portrait_1', src: '/assets/chat_avatar_1.png', label: 'فارس الأعماق' },
  { id: 'portrait_2', src: '/assets/chat_avatar_2.png', label: 'القبطان الشاب' },
  { id: 'portrait_3', src: '/assets/chat_avatar_3.png', label: 'ربان الأسطول' },
  { id: 'portrait_4', src: '/assets/chat_avatar_4.png', label: 'صياد العواصف' },
  { id: 'portrait_5', src: '/assets/chat_avatar_5.png', label: 'قائد القراصنة' },
  { id: 'portrait_6', src: '/assets/chat_avatar_6.png', label: 'ملاح البحار' },
  { id: 'portrait_7', src: '/assets/chat_avatar_7.png', label: 'سيد المحيط' },
  { id: 'portrait_skull', src: '/assets/alerts_skull_icon.jpg', label: 'شعار القراصنة' },
];

const NAVAL_SYMBOLS = ['☠️', '⚓', '⚔️', '👑', '🔱', '🦁', '🐉', '🦅', '🦈', '🧭'];

export const isImageAvatarValue = (val?: string): boolean => {
  const s = (val || '').trim();
  return s.startsWith('data:image') || s.startsWith('/') || s.startsWith('http://') || s.startsWith('https://');
};

export const ProfileAvatarModal: React.FC<ProfileAvatarModalProps> = ({
  isOpen,
  currentAvatar,
  useCustomAvatarFrame,
  username,
  pirateClass,
  level,
  googlePhotoUrl,
  onSelectAvatar,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const isImg = isImageAvatarValue(currentAvatar);
  const showDefaultSilhouette = !useCustomAvatarFrame || !currentAvatar || currentAvatar === 'default' || currentAvatar === 'silhouette';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (JPG أو PNG أو WebP).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const targetSize = 160;
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setUploadError('تعذر معالجة الصورة في المتصفح.');
            setIsProcessing(false);
            return;
          }

          // Center-crop square from uploaded photo so it fills the hexagon cleanly
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          onSelectAvatar(dataUrl, true);
          setIsProcessing(false);
        } catch {
          setUploadError('حدث خطأ أثناء تجهيز الصورة، جرب صورة أخرى.');
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setUploadError('تعذر قراءة الصورة المختارة.');
        setIsProcessing(false);
      };
      img.src = String(reader.result || '');
    };
    reader.onerror = () => {
      setUploadError('فشل تحميل الملف من الجهاز.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);

    // Allow re-selecting the same file
    e.target.value = '';
  };

  return (
    <div
      dir="rtl"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100020,
        backgroundColor: 'rgba(2, 8, 18, 0.86)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0b1829 0%, #06101c 100%)',
          border: '2px solid #c98650',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 215, 160, 0.2)',
          padding: '20px',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(201, 134, 80, 0.3)',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#fde68a' }}>
              تغيير صورة البروفايل
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              ارفع صورتك الشخصية أو اختر أي صورة تناسبك
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(201, 134, 80, 0.45)',
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#f8fafc',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Live Hexagonal Preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(15, 23, 42, 0.72)',
            border: '1px solid rgba(201, 134, 80, 0.35)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '86px',
              height: '100px',
              flexShrink: 0,
            }}
          >
            {showDefaultSilhouette ? (
              <img
                src="/assets/profile_hex_default.png"
                alt="معاينة البروفايل"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
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
                  {isImg ? (
                    <img
                      src={currentAvatar}
                      alt="الصورة المختارة"
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span style={{ fontSize: '36px', lineHeight: 1 }}>{currentAvatar}</span>
                  )}
                </div>
                <img
                  src="/assets/profile_hex_frame.png"
                  alt="إطار البروفايل"
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
            <div
              style={{
                position: 'absolute',
                left: '34%',
                top: '79%',
                width: '32%',
                height: '16%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: level >= 100 ? '11px' : '14px',
                  fontWeight: '900',
                  color: '#ffffff',
                  textShadow:
                    '-1px -1px 0 #1f0e06, 1px -1px 0 #1f0e06, -1px 1px 0 #1f0e06, 1px 1px 0 #1f0e06',
                }}
              >
                {level}
              </span>
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#fef08a', wordBreak: 'break-word' }}>
              @{username || 'قبطان'}
            </div>
            <div style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '700', marginTop: '2px' }}>
              {pirateClass || 'صياد البحار'} • مستوى {level}
            </div>
          </div>
        </div>

        {/* Upload Personal Photo Action */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1.5px solid #fbbf24',
              background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '900',
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(180, 83, 9, 0.4)',
            }}
          >
            <span>📷</span>
            <span>{isProcessing ? 'جاري تجهيز الصورة...' : 'رفع صورتك الشخصية من الجهاز'}</span>
          </button>

          {googlePhotoUrl && (
            <button
              type="button"
              onClick={() => onSelectAvatar(googlePhotoUrl, true)}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #38bdf8',
                background: 'rgba(14, 116, 144, 0.35)',
                color: '#e0f2fe',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <img
                src={googlePhotoUrl}
                alt="صورة جوجل"
                referrerPolicy="no-referrer"
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span>صورة حساب جوجل</span>
            </button>
          )}
        </div>

        {uploadError && (
          <div
            style={{
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid #ef4444',
              color: '#fecaca',
              fontSize: '12px',
              fontWeight: '700',
            }}
          >
            {uploadError}
          </div>
        )}

        {/* Ready Portraits + Default Icon */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#cbd5e1', marginBottom: '10px' }}>
            أو اختر من الصور الجاهزة:
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
              gap: '10px',
            }}
          >
            {/* Default Silhouette Option */}
            <button
              type="button"
              onClick={() => onSelectAvatar('default', false)}
              style={{
                padding: '8px 4px',
                borderRadius: '12px',
                border: showDefaultSilhouette ? '2px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                background: showDefaultSilhouette ? 'rgba(217, 119, 6, 0.22)' : 'rgba(15, 23, 42, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <img
                src="/assets/profile_hex_default.png"
                alt="الافتراضية"
                style={{ width: '48px', height: '54px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: '700' }}>الافتراضية</span>
            </button>

            {READY_PORTRAITS.map((item) => {
              const selected = !showDefaultSilhouette && currentAvatar === item.src;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectAvatar(item.src, true)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '12px',
                    border: selected ? '2px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                    background: selected ? 'rgba(217, 119, 6, 0.22)' : 'rgba(15, 23, 42, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid rgba(251, 191, 36, 0.35)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#e2e8f0',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Classic Naval Symbols */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#cbd5e1', marginBottom: '8px' }}>
            رموز القراصنة:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {NAVAL_SYMBOLS.map((sym) => {
              const selected = !showDefaultSilhouette && currentAvatar === sym;
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => onSelectAvatar(sym, true)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    border: selected ? '2px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                    background: selected ? 'rgba(217, 119, 6, 0.25)' : 'rgba(15, 23, 42, 0.75)',
                    fontSize: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm / Close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '900',
            cursor: 'pointer',
          }}
        >
          حفظ وإغلاق
        </button>
      </div>
    </div>
  );
};

export default ProfileAvatarModal;
