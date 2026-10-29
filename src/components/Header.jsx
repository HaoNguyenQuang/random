import React from 'react';
import { Swords, Target, Compass, CircleDot, RefreshCw, Settings, Users, History, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/audio';

export default function Header({
  activeTab,
  setActiveTab,
  onOpenMetaEditor,
  onOpenHeroCatalog,
  onOpenHistory,
  onSyncTierLQ,
  isSyncing,
  syncInfo,
  soundEnabled,
  setSoundEnabled,
  activeHeroCount
}) {
  const handleSoundToggle = () => {
    const newState = sound.toggle();
    setSoundEnabled(newState);
  };

  return (
    <header className="header-arena">
      <div className="header-container">
        {/* BRAND LOGO */}
        <div className="brand-group" onClick={() => setActiveTab('team5v5')}>
          <div className="brand-logo-wrap">
            <div className="brand-logo">LQ</div>
          </div>
          <div>
            <h1 className="brand-title">Liên Quân Random</h1>
            <p className="brand-slogan">Esports 5v5 Arena • Meta S4 2026</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'team5v5' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('team5v5'); }}
          >
            <Swords size={16} /> Team 5v5
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'lanePicker' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('lanePicker'); }}
          >
            <Target size={16} /> Theo Vị Trí
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'roleWheel' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('roleWheel'); }}
          >
            <Compass size={16} /> Vòng Quay Role
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'customWheel' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('customWheel'); }}
          >
            <CircleDot size={16} /> Vòng Quay Custom
          </button>
        </nav>

        {/* HEADER ACTIONS */}
        <div className="header-actions">
          {/* TIERLQ SYNC BUTTON */}
          <button
            className="icon-btn sync-live"
            onClick={onSyncTierLQ}
            disabled={isSyncing}
            title={syncInfo?.patch ? `Đã đồng bộ TierLQ Bản ${syncInfo.patch}` : 'Đồng bộ Meta mới nhất từ TierLQ.github.io'}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Meta'}</span>
          </button>

          {/* META SETTINGS */}
          <button
            className="icon-btn"
            onClick={() => { sound.playClick(); onOpenMetaEditor(); }}
            style={{ borderColor: 'rgba(245, 186, 49, 0.45)', color: 'var(--gold-light)' }}
            title="Tùy chỉnh bậc Meta 5 đường (S, A, B, C, D)"
          >
            <Settings size={14} />
            <span>Chỉnh Meta</span>
          </button>

          {/* HEROES CATALOG */}
          <button
            className="icon-btn"
            onClick={() => { sound.playClick(); onOpenHeroCatalog(); }}
            title="Danh sách và loại trừ tướng"
          >
            <Users size={14} />
            <span>{activeHeroCount}/129 Tướng</span>
          </button>

          {/* HISTORY */}
          <button
            className="icon-btn"
            onClick={() => { sound.playClick(); onOpenHistory(); }}
            title="Lịch sử đội hình đã quay"
          >
            <History size={14} />
            <span>Lịch sử</span>
          </button>

          {/* SOUND TOGGLE */}
          <button
            className={`icon-btn ${soundEnabled ? 'active-audio' : ''}`}
            onClick={handleSoundToggle}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 size={14} color="#00e5ff" /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}
