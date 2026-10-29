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
        {/* BRAND LOGO & QUICK TOOLS */}
        <div className="header-top-row">
          <div className="brand-group" onClick={() => setActiveTab('team5v5')}>
            <div className="brand-logo-wrap">
              <div className="brand-logo">LQ</div>
            </div>
            <div className="brand-text-wrap">
              <h1 className="brand-title">Liên Quân Random</h1>
              <p className="brand-slogan">Esports 5v5 Arena • Meta S4</p>
            </div>
          </div>

          <div className="header-quick-tools">
            <button
              className="icon-btn btn-icon-only"
              onClick={() => { sound.playClick(); onOpenHistory(); }}
              title="Lịch sử đội hình đã quay"
            >
              <History size={16} />
              <span className="quick-label">Lịch sử</span>
            </button>

            <button
              className={`icon-btn btn-icon-only ${soundEnabled ? 'active-audio' : ''}`}
              onClick={handleSoundToggle}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 size={16} color="#00e5ff" /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'team5v5' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('team5v5'); }}
          >
            <Swords size={15} /> 
            <span className="tab-text-full">Team 5v5</span>
            <span className="tab-text-short">5v5</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'lanePicker' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('lanePicker'); }}
          >
            <Target size={15} /> 
            <span className="tab-text-full">Theo Vị Trí</span>
            <span className="tab-text-short">Vị Trí</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'roleWheel' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('roleWheel'); }}
          >
            <Compass size={15} /> 
            <span className="tab-text-full">Vòng Quay Role</span>
            <span className="tab-text-short">Quay Role</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'customWheel' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('customWheel'); }}
          >
            <CircleDot size={15} /> 
            <span className="tab-text-full">Vòng Quay Custom</span>
            <span className="tab-text-short">Custom</span>
          </button>
        </nav>

        {/* HEADER ACTIONS */}
        <div className="header-actions">
          <button
            className="icon-btn sync-live"
            onClick={onSyncTierLQ}
            disabled={isSyncing}
            title={syncInfo?.patch ? `Đã đồng bộ TierLQ Bản ${syncInfo.patch}` : 'Đồng bộ Meta mới nhất từ TierLQ.github.io'}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Đang tải...' : 'Đồng Bộ'}</span>
          </button>

          <button
            className="icon-btn meta-btn"
            onClick={() => { sound.playClick(); onOpenMetaEditor(); }}
            title="Tùy chỉnh bậc Meta 5 đường (S, A, B, C, D)"
          >
            <Settings size={13} />
            <span>Chỉnh Meta</span>
          </button>

          <button
            className="icon-btn catalog-btn"
            onClick={() => { sound.playClick(); onOpenHeroCatalog(); }}
            title="Danh sách và loại trừ tướng"
          >
            <Users size={13} />
            <span>{activeHeroCount} Tướng</span>
          </button>
        </div>
      </div>
    </header>
  );
}
