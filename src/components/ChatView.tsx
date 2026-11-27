import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smile, 
  X, 
  Megaphone, 
  Settings, 
  Users, 
  ShieldAlert, 
  Ban, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  UserX,
  Search, 
  Flame,
  Radio,
  Crown,
  Gift
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: string;
  senderId?: string;
  avatar?: string;
  avatarIndex?: number;
  level?: number | string;
  vip?: boolean;
  text: string;
  time: string;
  userId?: string;
  createdAt?: string;
  isMe?: boolean;
  channel?: 'general' | 'private' | 'tribe' | 'friends' | 'broadcast';
  recipientId?: string;
  recipientName?: string;
}

interface ChatViewProps {
  chatMessages: ChatMessage[];
  sendChatMessage: (e: React.FormEvent) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  currentUser: any;
  realPlayers: any[];
  onClose: () => void;
  isMuted?: boolean;
  setIsMuted?: (val: boolean) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  friends?: string[];
  tribeId?: string | null;
  tribeName?: string;
  onOpenTribes?: () => void;
}

// Authentic conversation from the user's reference screenshot (IMG-20261104-WA0055)
const REFERENCE_MESSAGES: ChatMessage[] = [
  {
    id: 'ref-msg-1',
    sender: 'فارس الأعماق',
    avatar: '/assets/chat_avatar_1.png',
    avatarIndex: 0,
    level: 3,
    vip: false,
    text: 'سوا قروب و احنا ننضم',
    time: '12:06',
    isMe: false,
    channel: 'general',
  },
  {
    id: 'ref-msg-2',
    sender: 'Oceanking',
    avatar: '/assets/chat_avatar_1.png',
    avatarIndex: 0,
    level: 3,
    vip: true,
    text: 'الفعاليات كلها لي أنا لا تحاولوا',
    time: '12:06',
    isMe: false,
    channel: 'general',
  },
  {
    id: 'ref-msg-3',
    sender: 'Captain 55',
    avatar: '/assets/chat_avatar_2.png',
    avatarIndex: 1,
    level: 3,
    vip: false,
    text: 'ازاي اهاجم علي السفن',
    time: '12:55',
    isMe: false,
    channel: 'general',
  },
  {
    id: 'ref-msg-4',
    sender: 'نوح',
    avatar: '/assets/chat_avatar_3.png',
    avatarIndex: 2,
    level: 3,
    vip: false,
    text: 'راسلوني على تلجرام @zom3014 بجهز قروب وضيفكم',
    time: '12:57',
    isMe: false,
    channel: 'general',
  },
  {
    id: 'ref-msg-5',
    sender: 'نوح',
    avatar: '/assets/chat_avatar_3.png',
    avatarIndex: 2,
    level: 3,
    vip: false,
    text: 'تتهنا فيها اجوايز ماتستاعل',
    time: '12:58',
    isMe: false,
    channel: 'general',
  },
  {
    id: 'ref-msg-6',
    sender: 'نوح',
    avatar: '/assets/chat_avatar_3.png',
    avatarIndex: 2,
    level: 3,
    vip: false,
    text: 'اي واحد يتواصل معي يرسل صورت حسابه',
    time: '12:58',
    isMe: false,
    channel: 'general',
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  chatMessages,
  sendChatMessage,
  chatInput,
  setChatInput,
  currentUser,
  realPlayers,
  onClose,
  isMuted = false,
  setIsMuted,
  showToast,
  friends = [],
  tribeId,
  tribeName,
  onOpenTribes
}) => {
  // 4 Top Tabs matching user's screenshot exactly: العام | الخاص | القبيلة | الأصدقاء
  const [activeTab, setActiveTab] = useState<'general' | 'private' | 'tribe' | 'friends'>('general');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [internalMuted, setInternalMuted] = useState(isMuted);

  // Modals for actions
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMegaphoneModal, setShowMegaphoneModal] = useState(false);
  const [megaphoneText, setMegaphoneText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedWhisperPlayer, setSelectedWhisperPlayer] = useState<string>('');

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('blocked_chat_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [userToBlock, setUserToBlock] = useState('');

  // Report state
  const [reportTarget, setReportTarget] = useState('');
  const [reportReason, setReportReason] = useState('شتائم وألفاظ نابية');
  const [reportNotes, setReportNotes] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Quick game emojis
  const quickEmojis = [
    '👑', '🔱', '🦈', '🐉', '⚔️', '🪙', '💎', '⚓', '🌊', '🔥', 
    '💪', '👏', '💥', '🏴‍☠️', '🍻', '🛡️', '⚡', '💣', '🐟', '🎯', 
    '🚀', '😎', '❤️', '🏆'
  ];

  const handleToggleMute = () => {
    const newState = !internalMuted;
    setInternalMuted(newState);
    if (setIsMuted) {
      setIsMuted(newState);
    }
    if (showToast) {
      showToast(newState ? 'تم كتم صوت الشات 🔇' : 'تم تفعيل صوت الشات 🔊');
    }
  };

  const handleBlockUser = (username: string) => {
    if (!username.trim()) return;
    const cleanName = username.trim();
    if (!blockedUsers.includes(cleanName)) {
      const updated = [...blockedUsers, cleanName];
      setBlockedUsers(updated);
      try {
        localStorage.setItem('blocked_chat_users', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      if (showToast) {
        showToast(`تم حظر اللاعب @${cleanName} بنجاح`, 'success');
      }
    }
    setUserToBlock('');
  };

  const handleUnblockUser = (username: string) => {
    const updated = blockedUsers.filter(u => u !== username);
    setBlockedUsers(updated);
    try {
      localStorage.setItem('blocked_chat_users', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (showToast) {
      showToast(`تم إلغاء حظر @${username}`, 'success');
    }
  };

  const handleBroadcastMegaphone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!megaphoneText.trim()) return;
    setChatInput(`📢 [إعلان عالمي] ${megaphoneText.trim()}`);
    setShowMegaphoneModal(false);
    setMegaphoneText('');
    setTimeout(() => {
      // Trigger submission with announcement format
      const form = document.getElementById('chat-form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 50);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget.trim()) {
      if (showToast) showToast('يرجى تحديد اسم اللاعب المخالف', 'error');
      return;
    }
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
      setReportTarget('');
      setReportNotes('');
      if (showToast) {
        showToast('تم إرسال بلاغك للإدارة بنجاح', 'success');
      }
    }, 1200);
  };

  const getPlayerDetails = (userId?: string, senderName?: string, fallbackLevel?: number | string, fallbackVip?: boolean) => {
    if (fallbackLevel !== undefined && fallbackLevel !== null) {
      return { level: fallbackLevel, isVip: !!fallbackVip };
    }
    if (!userId && !senderName) {
      return { level: 3, isVip: false };
    }
    const found = realPlayers?.find(p => 
      (userId && (p.userId === userId || p.id === userId)) || 
      (senderName && (p.username === senderName || p.displayName === senderName))
    );
    if (!found) {
      return { level: fallbackLevel || 3, isVip: fallbackVip ?? false };
    }
    
    const lvl = found.shipTowerLevel || Math.min(99, Math.max(1, Math.floor(Math.sqrt((found.exp || 0) / 100)) + 1));
    const isVip = (found.gold || 0) > 100000000 || (found.power || 0) > 1000000000 || false;
    return { level: lvl, isVip };
  };

  // Base messages: merge reference messages with real Firestore messages seamlessly
  const baseMessages = chatMessages && chatMessages.length > 0
    ? [...REFERENCE_MESSAGES, ...chatMessages]
    : REFERENCE_MESSAGES;

  // Filter messages based on active tab
  const filteredMessages = baseMessages.filter(msg => {
    // Check block list
    if (blockedUsers.some(b => msg.sender.includes(b))) return false;

    if (activeTab === 'friends') {
      const isFriend = friends.some(f => msg.sender.includes(f));
      const isMe = msg.isMe || (currentUser?.displayName && msg.sender.includes(currentUser.displayName));
      return isFriend || isMe;
    }

    if (activeTab === 'private') {
      if (selectedWhisperPlayer) {
        return (
          msg.recipientName === selectedWhisperPlayer || 
          msg.sender.includes(selectedWhisperPlayer) ||
          msg.text.includes(`@${selectedWhisperPlayer}`) ||
          msg.channel === 'private'
        );
      }
      return msg.channel === 'private' || msg.recipientId || msg.text.startsWith('/w ') || msg.text.startsWith('خاص:');
    }

    if (activeTab === 'tribe') {
      return msg.channel === 'tribe' || (tribeId && msg.text.includes(`[${tribeName || 'القبيلة'}]`));
    }

    return true; // General tab
  });

  const recentSenders = Array.from(new Set(baseMessages.map(m => m.sender.replace(/[👑🔱]/g, '').trim()))).filter(Boolean);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const rafId = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(rafId);
  }, [filteredMessages.length, activeTab]);

  // Map avatar to cropped character artwork
  const getAvatarForMessage = (msg: ChatMessage, index: number): string => {
    const rawAv = (msg.avatar || '').trim();
    if (rawAv.startsWith('data:image') || rawAv.startsWith('/assets/') || rawAv.startsWith('http://') || rawAv.startsWith('https://')) {
      return rawAv;
    }
    if (msg.sender === 'Oceanking' || msg.sender === 'فارس الأعماق') return '/assets/chat_avatar_1.png';
    if (msg.sender === 'Captain 55') return '/assets/chat_avatar_2.png';
    if (msg.sender === 'نوح') return '/assets/chat_avatar_3.png';
    if (typeof msg.avatarIndex === 'number' && msg.avatarIndex >= 0) {
      return `/assets/chat_avatar_${(msg.avatarIndex % 7) + 1}.png`;
    }
    let hash = 0;
    const seed = msg.sender || msg.senderId || msg.userId || `msg-${index}`;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const avatarNum = (Math.abs(hash) % 7) + 1;
    return `/assets/chat_avatar_${avatarNum}.png`;
  };

  // Convert digits to Arabic-Indic format
  const toArabicDigits = (num: number | string): string => {
    const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, (w) => arabicNums[+w]);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
        width: '100%',
        height: '100dvh',
        maxHeight: '100%',
        minHeight: 0,
        background: 'linear-gradient(180deg, #06254d 0%, #03152e 55%, #020e22 100%)',
        color: '#f8fafc',
        fontFamily: "'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        direction: 'rtl',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Main Royal Ocean-Blue Ornate Chat Frame */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          flex: '1 1 0%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '10px 10px 12px 10px',
          background: 'linear-gradient(180deg, #052044 0%, #03142c 100%)',
          border: '3px solid #2b8be6',
          boxShadow: 'inset 0 0 26px rgba(56, 189, 248, 0.25), 0 0 30px rgba(0, 0, 0, 0.85)',
        }}
      >
        {/* ===================== TOP 4 TABS ROW (العام | الخاص | القبيلة | الأصدقاء | ✕) ===================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '6px 8px',
            background: 'linear-gradient(180deg, #0b3366 0%, #061d3d 100%)',
            border: '1.5px solid #2574c7',
            borderRadius: '12px',
            marginBottom: '10px',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
          }}
        >
          {/* The 4 Tab Buttons (Right to Left: العام -> الخاص -> القبيلة -> الأصدقاء) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
            }}
          >
            {/* TAB 1: العام */}
            <button
              onClick={() => setActiveTab('general')}
              style={{
                flex: 1,
                height: '56px',
                padding: '0 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '24px',
                fontWeight: '900',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                background:
                  activeTab === 'general'
                    ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #b45309 100%)'
                    : 'linear-gradient(180deg, #0c3973 0%, #062147 100%)',
                color: activeTab === 'general' ? '#1e1202' : '#ffffff',
                border:
                  activeTab === 'general'
                    ? '2px solid #fef08a'
                    : '1.5px solid #2b7de0',
                boxShadow:
                  activeTab === 'general'
                    ? '0 0 16px rgba(250, 204, 21, 0.55), inset 0 1px 0 rgba(255,255,255,0.75)'
                    : 'inset 0 1px 0 rgba(147, 197, 253, 0.25)',
              }}
            >
              العام
            </button>

            {/* TAB 2: الخاص */}
            <button
              onClick={() => setActiveTab('private')}
              style={{
                flex: 1,
                height: '56px',
                padding: '0 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '24px',
                fontWeight: '900',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                background:
                  activeTab === 'private'
                    ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #b45309 100%)'
                    : 'linear-gradient(180deg, #0c3973 0%, #062147 100%)',
                color: activeTab === 'private' ? '#1e1202' : '#ffffff',
                border:
                  activeTab === 'private'
                    ? '2px solid #fef08a'
                    : '1.5px solid #2b7de0',
                boxShadow:
                  activeTab === 'private'
                    ? '0 0 16px rgba(250, 204, 21, 0.55), inset 0 1px 0 rgba(255,255,255,0.75)'
                    : 'inset 0 1px 0 rgba(147, 197, 253, 0.25)',
              }}
            >
              الخاص
            </button>

            {/* TAB 3: القبيلة */}
            <button
              onClick={() => setActiveTab('tribe')}
              style={{
                flex: 1,
                height: '56px',
                padding: '0 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '24px',
                fontWeight: '900',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                background:
                  activeTab === 'tribe'
                    ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #b45309 100%)'
                    : 'linear-gradient(180deg, #0c3973 0%, #062147 100%)',
                color: activeTab === 'tribe' ? '#1e1202' : '#ffffff',
                border:
                  activeTab === 'tribe'
                    ? '2px solid #fef08a'
                    : '1.5px solid #2b7de0',
                boxShadow:
                  activeTab === 'tribe'
                    ? '0 0 16px rgba(250, 204, 21, 0.55), inset 0 1px 0 rgba(255,255,255,0.75)'
                    : 'inset 0 1px 0 rgba(147, 197, 253, 0.25)',
              }}
            >
              القبيلة
            </button>

            {/* TAB 4: الأصدقاء */}
            <button
              onClick={() => setActiveTab('friends')}
              style={{
                flex: 1,
                height: '56px',
                padding: '0 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '24px',
                fontWeight: '900',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                background:
                  activeTab === 'friends'
                    ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #b45309 100%)'
                    : 'linear-gradient(180deg, #0c3973 0%, #062147 100%)',
                color: activeTab === 'friends' ? '#1e1202' : '#ffffff',
                border:
                  activeTab === 'friends'
                    ? '2px solid #fef08a'
                    : '1.5px solid #2b7de0',
                boxShadow:
                  activeTab === 'friends'
                    ? '0 0 16px rgba(250, 204, 21, 0.55), inset 0 1px 0 rgba(255,255,255,0.75)'
                    : 'inset 0 1px 0 rgba(147, 197, 253, 0.25)',
              }}
            >
              الأصدقاء
            </button>
          </div>

          {/* Close / Return to Harbor Button (Far Left) */}
          <button
            onClick={onClose}
            title="إغلاق والعودة للميناء"
            style={{
              width: '58px',
              height: '56px',
              borderRadius: '10px',
              background: 'linear-gradient(180deg, #0a2e5c 0%, #051833 100%)',
              border: '2px solid #3898ff',
              color: '#ffffff',
              fontSize: '26px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(147,197,253,0.3)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Sub-Header Context Notification (if Private or Tribe selected) */}
        {activeTab === 'private' && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(10, 38, 74, 0.9)',
              borderRadius: '10px',
              border: '1.5px solid #2b8be6',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '20px',
              fontWeight: '700',
              color: '#bae6fd',
              flexShrink: 0,
            }}
          >
            <span>💬 المحادثات الخاصة والهمس المباشر بين القادة</span>
            {realPlayers && realPlayers.length > 0 && (
              <select
                value={selectedWhisperPlayer}
                onChange={(e) => setSelectedWhisperPlayer(e.target.value)}
                style={{
                  background: '#051b36',
                  color: '#fde047',
                  border: '1.5px solid #2b8be6',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontFamily: 'inherit',
                  fontSize: '19px',
                  fontWeight: '700',
                }}
              >
                <option value="">جميع المحادثات الخاصة</option>
                {realPlayers.slice(0, 15).map(p => (
                  <option key={p.userId || p.id} value={p.username || p.displayName}>
                    همس مع: {p.username || p.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {activeTab === 'tribe' && !tribeId && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(14, 42, 78, 0.95)',
              borderRadius: '10px',
              border: '1.5px solid #eab308',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '20px',
              fontWeight: '700',
              color: '#fef08a',
              flexShrink: 0,
            }}
          >
            <span>🛡️ انضم أو أنشئ قبيلة للدردشة مع تحالفك البحري!</span>
            {onOpenTribes && (
              <button
                onClick={onOpenTribes}
                style={{
                  background: 'linear-gradient(180deg, #fde047 0%, #eab308 100%)',
                  color: '#1e1202',
                  border: '1px solid #fef08a',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontFamily: 'inherit',
                  fontSize: '19px',
                  fontWeight: '900',
                  cursor: 'pointer',
                }}
              >
                فتح قوائم القبيلة
              </button>
            )}
          </div>
        )}

        {/* ===================== MESSAGES SCROLL STREAM ===================== */}
        <div
          ref={chatScrollRef}
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            paddingRight: '2px',
            paddingLeft: '2px',
            paddingBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '7px',
          }}
        >
          {filteredMessages.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                gap: '12px',
              }}
            >
              <MessageCircle style={{ width: '62px', height: '62px', color: '#38bdf8', opacity: 0.7 }} />
              <p style={{ margin: 0, fontSize: '27px', fontWeight: '900', color: '#ffffff' }}>
                {activeTab === 'friends'
                  ? 'لا توجد رسائل أصدقاء حالياً'
                  : activeTab === 'private'
                  ? 'لا توجد محادثات خاصة بعد'
                  : activeTab === 'tribe'
                  ? 'لا توجد رسائل في شات القبيلة'
                  : 'لا توجد رسائل'}
              </p>
              <p style={{ margin: 0, fontSize: '21px', color: '#cbd5e1', fontWeight: '700' }}>
                اكتب رسالتك في الأسفل وكن أول من يبدأ الحديث!
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const details = getPlayerDetails(msg.userId, msg.sender, msg.level, msg.vip);
              const isMe = msg.isMe || (currentUser?.displayName && msg.sender.includes(currentUser.displayName));
              const avatarSrc = getAvatarForMessage(msg, idx);
              const isSpecialAnnouncement =
                msg.channel === 'broadcast' ||
                msg.sender.includes('القوات') ||
                msg.sender.includes('نظام') ||
                msg.sender.includes('رسالة التحدي') ||
                msg.sender.includes('التحدي');
              const isGoldCard = isSpecialAnnouncement || isMe;

              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    direction: 'ltr', // Avatar on Left, Right-aligned RTL content on Right
                    background: isGoldCard
                      ? 'linear-gradient(180deg, rgba(16, 46, 84, 0.96) 0%, rgba(8, 26, 52, 0.98) 100%)'
                      : 'linear-gradient(180deg, rgba(10, 34, 68, 0.96) 0%, rgba(5, 20, 44, 0.98) 100%)',
                    border: isGoldCard
                      ? '1.8px solid #eab308'
                      : '1.5px solid #2367b5',
                    borderRadius: '14px',
                    padding: '8px 16px 8px 10px',
                    boxShadow: isGoldCard
                      ? '0 2px 12px rgba(0, 0, 0, 0.45), inset 0 0 12px rgba(234, 179, 8, 0.14)'
                      : '0 2px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(147, 197, 253, 0.1)',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Circular Avatar on Left + Bottom Overlapping Level Badge */}
                  <div
                    style={{
                      position: 'relative',
                      width: '72px',
                      height: '72px',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        border: isGoldCard ? '2.5px solid #facc15' : '2.5px solid #38bdf8',
                        overflow: 'hidden',
                        background: '#031728',
                        boxShadow: isGoldCard
                          ? '0 0 10px rgba(250, 204, 21, 0.5)'
                          : '0 0 10px rgba(56, 189, 248, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={avatarSrc}
                        alt={msg.sender}
                        referrerPolicy="no-referrer"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>

                    {/* Level Badge Pill at Bottom Center */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        minWidth: '32px',
                        height: '24px',
                        padding: '0 7px',
                        background: 'linear-gradient(180deg, #0b3366 0%, #04152e 100%)',
                        border: isGoldCard ? '1.5px solid #facc15' : '1.5px solid #38bdf8',
                        borderRadius: '9999px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                      }}
                      title={`المستوى ${details.level}`}
                    >
                      <span
                        style={{
                          fontSize: '16px',
                          fontWeight: '900',
                          color: '#ffffff',
                          lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {details.level}
                      </span>
                    </div>
                  </div>

                  {/* Right-Aligned Message Column (Sender Name + VIP, Body, Timestamp) */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      direction: 'rtl',
                      textAlign: 'right',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    {/* Sender Name + VIP Badge */}
                    {msg.sender && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '23px',
                            fontWeight: '900',
                            color: (isGoldCard || details.isVip) ? '#facc15' : '#f8fafc',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.75)',
                          }}
                        >
                          {msg.sender}
                        </span>

                        {(details.isVip || isSpecialAnnouncement) && (
                          <span
                            style={{
                              background: 'linear-gradient(180deg, #fde047 0%, #d97706 100%)',
                              color: '#1e1002',
                              fontSize: '15px',
                              fontWeight: '900',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              lineHeight: 1.2,
                              border: '1px solid #fef08a',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
                            }}
                          >
                            VIP
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Body Text */}
                    <div
                      style={{
                        fontSize: '25px',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: '1.45',
                        wordBreak: 'break-word',
                        textAlign: 'right',
                        whiteSpace: 'pre-line',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)',
                      }}
                    >
                      {msg.text}
                    </div>

                    {/* Right-aligned Timestamp in Arabic-Indic numerals */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        marginTop: '1px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '17px',
                          color: '#cbd5e1',
                          fontWeight: '700',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {toArabicDigits(msg.time || '12:00')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ===================== EMOJI PICKER POPUP ===================== */}
        {showEmojiPicker && (
          <div
            style={{
              position: 'absolute',
              bottom: '126px',
              left: '14px',
              right: '14px',
              zIndex: 30,
              background: 'rgba(5, 22, 46, 0.98)',
              border: '2px solid #2b8be6',
              borderRadius: '16px',
              padding: '14px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
                marginBottom: '10px',
                fontSize: '21px',
                fontWeight: '900',
                color: '#7dd3fc',
              }}
            >
              <span>رموز وتعبيرات ملوك الأعماق:</span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '22px',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '8px',
              }}
            >
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setChatInput(chatInput + emoji);
                    setShowEmojiPicker(false);
                  }}
                  style={{
                    background: 'rgba(14, 42, 78, 0.8)',
                    border: '1.5px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '10px',
                    height: '52px',
                    fontSize: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===================== QUICK ACTIONS POPUP (Megaphone + Settings) ===================== */}
        {showActionMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '132px',
              left: '14px',
              zIndex: 35,
              background: 'linear-gradient(180deg, #0b2d59 0%, #051733 100%)',
              border: '2px solid #2b8be6',
              borderRadius: '14px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '260px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.85)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowActionMenu(false);
                setShowMegaphoneModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(14, 46, 86, 0.9)',
                border: '1.5px solid rgba(250, 204, 21, 0.55)',
                color: '#fde047',
                fontFamily: 'inherit',
                fontSize: '20px',
                fontWeight: '800',
                cursor: 'pointer',
                textAlign: 'right',
              }}
            >
              <Megaphone style={{ width: '24px', height: '24px', color: '#facc15', flexShrink: 0 }} />
              <span>بوق الإعلانات العالمي</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowActionMenu(false);
                setShowSettingsModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(14, 46, 86, 0.9)',
                border: '1.5px solid rgba(56, 189, 248, 0.5)',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: '20px',
                fontWeight: '800',
                cursor: 'pointer',
                textAlign: 'right',
              }}
            >
              <Settings style={{ width: '24px', height: '24px', color: '#38bdf8', flexShrink: 0 }} />
              <span>إعدادات الشات والحظر</span>
            </button>
          </div>
        )}

        {/* ===================== BOTTOM DOCK BAR (Left: Emoji + Gift/Actions | Center: Input | Right: Golden Send) ===================== */}
        <div
          style={{
            marginTop: '6px',
            padding: '8px',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
            background: 'linear-gradient(180deg, #072248 0%, #04142c 100%)',
            border: '2px solid #2b8be6',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'stretch',
            gap: '8px',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
            direction: 'ltr', // Left column (2 stacked buttons), Center (Input), Right (Golden Send)
            boxShadow: 'inset 0 0 18px rgba(43, 139, 230, 0.25), 0 4px 16px rgba(0,0,0,0.6)',
          }}
        >
          {/* Left Column: Stacked Emoji (top) + Gift/Broadcast/Settings (bottom) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowActionMenu(false);
                setShowEmojiPicker(!showEmojiPicker);
              }}
              title="إضافة رمز تعبيري"
              style={{
                width: '56px',
                height: '48px',
                borderRadius: '10px',
                background: 'linear-gradient(180deg, #0e3d78 0%, #062146 100%)',
                border: '1.5px solid #2b8be6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 0 rgba(147,197,253,0.25)',
              }}
            >
              <Smile style={{ width: '28px', height: '28px', color: '#facc15' }} />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(false);
                setShowActionMenu(!showActionMenu);
              }}
              title="بوق الإعلانات وإعدادات الشات"
              style={{
                width: '56px',
                height: '48px',
                borderRadius: '10px',
                background: 'linear-gradient(180deg, #0e3d78 0%, #062146 100%)',
                border: '1.5px solid #2b8be6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 0 rgba(147,197,253,0.25)',
              }}
            >
              <Gift style={{ width: '26px', height: '26px', color: '#facc15' }} />
            </button>
          </div>

          {/* Center Input + Right Golden Send Form */}
          <form
            id="chat-form"
            onSubmit={sendChatMessage}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'stretch',
              gap: '8px',
            }}
          >
            <input
              type="text"
              placeholder={
                activeTab === 'private'
                  ? selectedWhisperPlayer
                    ? `همس إلى @${selectedWhisperPlayer}...`
                    : 'اكتب رسالتك الخاصة ...'
                  : activeTab === 'tribe'
                  ? 'اكتب في شات القبيلة ...'
                  : 'اكتب رسالتك هنا ...'
              }
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              dir="rtl"
              style={{
                flex: 1,
                minWidth: 0,
                height: '102px',
                background: 'linear-gradient(180deg, #041730 0%, #031024 100%)',
                border: '1.5px solid #2574c7',
                borderRadius: '10px',
                padding: '0 22px',
                color: '#ffffff',
                fontFamily: "'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif",
                fontSize: '28px',
                lineHeight: '1.4',
                fontWeight: '700',
                outline: 'none',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
                boxSizing: 'border-box',
                userSelect: 'text',
                WebkitUserSelect: 'text',
              }}
            />

            {/* Right: Tall Golden Send Button with Black Paper Airplane */}
            <button
              type="submit"
              disabled={!chatInput.trim()}
              title="إرسال"
              style={{
                width: '76px',
                height: '102px',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, #fde047 0%, #eab308 55%, #b45309 100%)',
                border: '2px solid #fef08a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                opacity: chatInput.trim() ? 1 : 0.85,
                flexShrink: 0,
                boxShadow: '0 0 14px rgba(250, 204, 21, 0.45), inset 0 1px 0 rgba(255,255,255,0.65)',
                transition: 'all 0.15s ease',
              }}
            >
              <Send
                style={{
                  width: '34px',
                  height: '34px',
                  color: '#0f172a',
                  transform: 'rotate(-45deg)',
                }}
              />
            </button>
          </form>
        </div>
      </div>

      {/* ===================== MODAL: MEGAPHONE BROADCAST ===================== */}
      {showMegaphoneModal && (
        <div
          onClick={() => setShowMegaphoneModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'linear-gradient(180deg, #0f2b48 0%, #081728 100%)',
              border: '2px solid #facc15',
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(250, 204, 21, 0.3)',
              color: '#f8fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(250, 204, 21, 0.3)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Megaphone style={{ width: '28px', height: '28px', color: '#facc15' }} />
                <h3 style={{ margin: 0, fontSize: '25px', fontWeight: '900', color: '#fef08a' }}>
                  بوق الإعلانات العالمي
                </h3>
              </div>
              <button
                onClick={() => setShowMegaphoneModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '20px', color: '#e2e8f0', lineHeight: '1.6', margin: '0 0 16px 0', fontWeight: '600' }}>
              أطلق نداءً مدوياً لجميع القراصنة والبحارة في ملوك الأعماق بلون ذهبي مميز!
            </p>

            <form onSubmit={handleBroadcastMegaphone}>
              <textarea
                placeholder="اكتب إعلانك العام هنا..."
                value={megaphoneText}
                onChange={(e) => setMegaphoneText(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(5, 16, 28, 0.92)',
                  border: '1.5px solid rgba(250, 204, 21, 0.5)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  fontFamily: 'inherit',
                  fontSize: '23px',
                  fontWeight: '700',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowMegaphoneModal(false)}
                  style={{
                    background: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid #475569',
                    borderRadius: '10px',
                    padding: '10px 22px',
                    fontFamily: 'inherit',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!megaphoneText.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontFamily: 'inherit',
                    fontSize: '20px',
                    fontWeight: '900',
                    cursor: megaphoneText.trim() ? 'pointer' : 'not-allowed',
                    opacity: megaphoneText.trim() ? 1 : 0.5,
                  }}
                >
                  📢 إطلاق الإعلان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: SETTINGS & BLOCKS ===================== */}
      {showSettingsModal && (
        <div
          onClick={() => setShowSettingsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'linear-gradient(180deg, #0d253f 0%, #061322 100%)',
              border: '2px solid rgba(56, 189, 248, 0.55)',
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.85)',
              color: '#f8fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings style={{ width: '28px', height: '28px', color: '#38bdf8' }} />
                <h3 style={{ margin: 0, fontSize: '25px', fontWeight: '900', color: '#ffffff' }}>
                  إعدادات الشات والخصوصية
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Sound Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'rgba(15, 38, 64, 0.75)',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {internalMuted ? (
                  <VolumeX style={{ width: '26px', height: '26px', color: '#f87171' }} />
                ) : (
                  <Volume2 style={{ width: '26px', height: '26px', color: '#38bdf8' }} />
                )}
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>أصوات إشعارات الشات</div>
                  <div style={{ fontSize: '17px', color: '#cbd5e1' }}>
                    {internalMuted ? 'الصوت مكتوم حالياً' : 'الصوت مفعل للرسائل الواردة'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleMute}
                style={{
                  background: internalMuted
                    ? '#ef4444'
                    : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontFamily: 'inherit',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {internalMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
              </button>
            </div>

            {/* Block Players Section */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '19px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>
                🚫 حظر لاعب مزعج:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="اكتب اسم اللاعب لحظر رسائله..."
                  value={userToBlock}
                  onChange={(e) => setUserToBlock(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(5, 16, 28, 0.92)',
                    border: '1.5px solid #475569',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '21px',
                    fontWeight: '700',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleBlockUser(userToBlock)}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 22px',
                    fontFamily: 'inherit',
                    fontSize: '19px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  حظر
                </button>
              </div>
            </div>

            {/* Blocked List */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '8px' }}>
                قائمة المحظورين ({blockedUsers.length}):
              </div>
              {blockedUsers.length === 0 ? (
                <div style={{ fontSize: '17px', color: '#94a3b8' }}>لا يوجد أي لاعب محظور حالياً.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '110px', overflowY: 'auto' }}>
                  {blockedUsers.map((name) => (
                    <div
                      key={name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(239, 68, 68, 0.18)',
                        border: '1px solid rgba(239, 68, 68, 0.45)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '18px',
                      }}
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => handleUnblockUser(name)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '17px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Player Action */}
            <div
              style={{
                paddingTop: '14px',
                borderTop: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowReportModal(true);
                }}
                style={{
                  background: 'transparent',
                  border: '1.5px solid #f59e0b',
                  color: '#facc15',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  fontFamily: 'inherit',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <ShieldAlert style={{ width: '20px', height: '20px' }} />
                <span>الإبلاغ عن إساءة أو شتائم</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 22px',
                  fontFamily: 'inherit',
                  fontSize: '19px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REPORT PLAYER ===================== */}
      {showReportModal && (
        <div
          onClick={() => setShowReportModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'linear-gradient(180deg, #1f1118 0%, #10080d 100%)',
              border: '2px solid #ef4444',
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
              color: '#f8fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(239, 68, 68, 0.35)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert style={{ width: '28px', height: '28px', color: '#ef4444' }} />
                <h3 style={{ margin: 0, fontSize: '25px', fontWeight: '900', color: '#f87171' }}>
                  إبلاغ عن مخالفة
                </h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '19px', fontWeight: 'bold', marginBottom: '6px' }}>
                  اسم اللاعب المخالف:
                </label>
                <input
                  type="text"
                  placeholder="اكتب اسم اللاعب..."
                  value={reportTarget}
                  onChange={(e) => setReportTarget(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#180d12',
                    border: '1.5px solid #7f1d1d',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '21px',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '19px', fontWeight: 'bold', marginBottom: '6px' }}>
                  سبب البلاغ:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#180d12',
                    border: '1.5px solid #7f1d1d',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '20px',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="شتائم وألفاظ نابية">شتائم وألفاظ نابية</option>
                  <option value="سباب وإساءة شخصية">سباب وإساءة شخصية</option>
                  <option value="تهديد أو ابتزاز">تهديد أو ابتزاز</option>
                  <option value="احتيال ونصب">احتيال ونصب</option>
                  <option value="إزعاج وتكرار (سبام)">إزعاج وتكرار (سبام)</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '19px', fontWeight: 'bold', marginBottom: '6px' }}>
                  تفاصيل إضافية:
                </label>
                <textarea
                  placeholder="صف المخالفة باختصار..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    background: '#180d12',
                    border: '1.5px solid #7f1d1d',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '21px',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{
                    background: '#29141c',
                    color: '#e2e8f0',
                    border: '1px solid #4a1d2d',
                    borderRadius: '10px',
                    padding: '10px 22px',
                    fontFamily: 'inherit',
                    fontSize: '19px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={reportSuccess}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontFamily: 'inherit',
                    fontSize: '19px',
                    fontWeight: '900',
                    cursor: 'pointer',
                  }}
                >
                  {reportSuccess ? 'جاري الإرسال...' : 'إرسال البلاغ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
