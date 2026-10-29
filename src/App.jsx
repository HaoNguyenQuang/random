import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ModeTeam5v5 from './components/ModeTeam5v5';
import ModeLanePicker from './components/ModeLanePicker';
import ModeRoleWheel from './components/ModeRoleWheel';
import ModeCustomWheel from './components/ModeCustomWheel';
import MetaEditorModal from './components/MetaEditorModal';
import HeroCatalogModal from './components/HeroCatalogModal';
import HistoryModal from './components/HistoryModal';
import { CHAMPIONS, POSITIONS } from './data/champions';
import { DEFAULT_LANE_META } from './data/defaultMeta';
import { fetchTierLQData } from './utils/tierlqSync';
import { sound } from './utils/audio';

const STORAGE_KEYS = {
  PLAYERS: 'lq_players_v2',
  NO_REPEAT: 'lq_no_repeat_v2',
  LANE_META: 'lq_lane_meta_v2',
  DISABLED_HEROES: 'lq_disabled_heroes_v2',
  HISTORY: 'lq_history_v2',
  SYNC_INFO: 'lq_sync_info_v2',
  SOUND_ENABLED: 'lq_sound_v2'
};

const DEFAULT_PLAYERS = [
  { name: 'Minh', role: 'TOP', champId: null, lockRole: false, lockChamp: false },
  { name: 'Vũ', role: 'JUNGLE', champId: null, lockRole: false, lockChamp: false },
  { name: 'Hào', role: 'MID', champId: null, lockRole: false, lockChamp: false },
  { name: 'Công', role: 'AD', champId: null, lockRole: false, lockChamp: false },
  { name: 'Đức', role: 'SP', champId: null, lockRole: false, lockChamp: false }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('team5v5');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals state
  const [isMetaEditorOpen, setIsMetaEditorOpen] = useState(false);
  const [isHeroCatalogOpen, setIsHeroCatalogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYNC_INFO);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg, duration = 3500) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  // Players state with default names: Minh, Vũ, Hào, Công, Đức
  const [players, setPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          const defaultNames = ['Minh', 'Vũ', 'Hào', 'Công', 'Đức'];
          return parsed.map((p, idx) => ({
            ...p,
            name: p.name && !p.name.includes('Người chơi') ? p.name : defaultNames[idx]
          }));
        }
      }
    } catch (e) {}
    return DEFAULT_PLAYERS;
  });

  // NO REPEAT FEATURE (Default to TRUE for user convenience)
  const [isNoRepeatPrevious, setIsNoRepeatPrevious] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NO_REPEAT);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true; // Default ON
  });

  // 5 Champions & 5 Roles from the previous round to prevent duplicate lane/hero per player
  const [lastRolledChampIds, setLastRolledChampIds] = useState(new Set());
  const [lastPlayerRoles, setLastPlayerRoles] = useState({});

  // 5-Tier Lane Meta
  const [laneMeta, setLaneMeta] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANE_META);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LANE_META;
  });

  // Excluded heroes
  const [disabledHeroIds, setDisabledHeroIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISABLED_HEROES);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set();
  });

  // History list
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {}
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NO_REPEAT, JSON.stringify(isNoRepeatPrevious));
    } catch (e) {}
  }, [isNoRepeatPrevious]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LANE_META, JSON.stringify(laneMeta));
    } catch (e) {}
  }, [laneMeta]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISABLED_HEROES, JSON.stringify(Array.from(disabledHeroIds)));
    } catch (e) {}
  }, [disabledHeroIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  // Sync TierLQ function
  const handleSyncTierLQ = async () => {
    if (isSyncing) return;
    sound.playClick();
    setIsSyncing(true);

    try {
      const result = await fetchTierLQData();
      if (result.success && result.laneMeta) {
        setLaneMeta(result.laneMeta);
        const info = {
          patch: result.patch || 'S4 2026',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('vi-VN')
        };
        setSyncInfo(info);
        localStorage.setItem(STORAGE_KEYS.SYNC_INFO, JSON.stringify(info));
        sound.playVictory();
        showToast(`⚡ Đồng bộ thành công Meta TierLQ (Bản ${info.patch})!`);
      } else {
        showToast('⚠️ Không thể tải dữ liệu mới nhất từ TierLQ, tiếp tục dùng Meta hiện tại.');
      }
    } catch (err) {
      console.error('TierLQ Sync Error:', err);
      showToast('⚠️ Lỗi kết nối TierLQ. Vui lòng kiểm tra lại mạng.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Add roll to history
  const handleSaveHistory = (record) => {
    setHistory(prev => [record, ...prev.slice(0, 49)]); // Keep last 50
  };

  // Clear history
  const handleClearHistory = () => {
    sound.playClick();
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử quay?')) {
      setHistory([]);
    }
  };

  const activeHeroCount = CHAMPIONS.length - disabledHeroIds.size;

  return (
    <div className="app-shell">
      {/* 1. ESPORTS ARENA HEADER */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMetaEditor={() => setIsMetaEditorOpen(true)}
        onOpenHeroCatalog={() => setIsHeroCatalogOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onSyncTierLQ={handleSyncTierLQ}
        isSyncing={isSyncing}
        syncInfo={syncInfo}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        activeHeroCount={activeHeroCount}
      />

      {/* 2. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="cyber-toast-notification animate-slideDown">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. MAIN ARENA CONTENT */}
      <main className="main-content-container">
        {activeTab === 'team5v5' && (
          <ModeTeam5v5
            players={players}
            setPlayers={setPlayers}
            availableChamps={CHAMPIONS}
            disabledHeroIds={disabledHeroIds}
            laneMeta={laneMeta}
            isNoRepeatPrevious={isNoRepeatPrevious}
            setIsNoRepeatPrevious={setIsNoRepeatPrevious}
            lastRolledChampIds={lastRolledChampIds}
            setLastRolledChampIds={setLastRolledChampIds}
            lastPlayerRoles={lastPlayerRoles}
            setLastPlayerRoles={setLastPlayerRoles}
            onSaveHistory={handleSaveHistory}
          />
        )}

        {activeTab === 'lanePicker' && (
          <ModeLanePicker
            availableChamps={CHAMPIONS}
            disabledHeroIds={disabledHeroIds}
            laneMeta={laneMeta}
          />
        )}

        {activeTab === 'roleWheel' && (
          <ModeRoleWheel />
        )}

        {activeTab === 'customWheel' && (
          <ModeCustomWheel />
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="footer-arena">
        <div className="footer-content">
          <p>© 2026 Liên Quân Random Esports Arena • Dữ liệu Meta cập nhật thời gian thực từ TierLQ</p>
          <p className="footer-sub">Thiết kế bởi Google Antigravity & Pair Programming</p>
        </div>
      </footer>

      {/* 5. MODALS */}
      <MetaEditorModal
        isOpen={isMetaEditorOpen}
        onClose={() => setIsMetaEditorOpen(false)}
        laneMeta={laneMeta}
        setLaneMeta={setLaneMeta}
        onSyncTierLQ={handleSyncTierLQ}
        isSyncing={isSyncing}
        syncInfo={syncInfo}
      />

      <HeroCatalogModal
        isOpen={isHeroCatalogOpen}
        onClose={() => setIsHeroCatalogOpen(false)}
        disabledHeroIds={disabledHeroIds}
        setDisabledHeroIds={setDisabledHeroIds}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
