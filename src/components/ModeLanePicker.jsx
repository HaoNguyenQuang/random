import React, { useState } from 'react';
import { Target, RefreshCw, Sparkles, Filter, ShieldCheck } from 'lucide-react';
import { POSITIONS, POSITION_CONFIG, CHAMP_LOOKUP } from '../data/champions';
import { getHeroTierForLane, pickWeightedChampion } from '../utils/random';
import { sound } from '../utils/audio';

export default function ModeLanePicker({
  availableChamps,
  disabledHeroIds,
  laneMeta
}) {
  const [selectedLane, setSelectedLane] = useState('TOP');
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL');
  const [pickedHero, setPickedHero] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  const handlePickHero = () => {
    if (isRolling) return;
    sound.playWhoosh();
    setIsRolling(true);

    let candidates = availableChamps.filter(c => {
      if (disabledHeroIds.has(c.id)) return false;
      const t = getHeroTierForLane(c.name, selectedLane, laneMeta);
      if (t === 'REMOVED') return false;
      if (selectedTierFilter !== 'ALL' && t !== selectedTierFilter) return false;
      return true;
    });

    if (candidates.length === 0) {
      sound.playClick();
      alert(`Không có tướng nào thuộc Tier ${selectedTierFilter} cho vị trí ${selectedLane}! Vui lòng chọn Tier khác.`);
      setIsRolling(false);
      return;
    }

    // Audio ticks
    let count = 0;
    const interval = setInterval(() => {
      sound.playTick();
      count++;
      if (count > 6) clearInterval(interval);
    }, 70);

    setTimeout(() => {
      clearInterval(interval);
      const picked = pickWeightedChampion(candidates, selectedLane, laneMeta);
      setPickedHero(picked);
      sound.playVictory();
      setIsRolling(false);
    }, 450);
  };

  const currentCfg = POSITION_CONFIG[selectedLane] || POSITION_CONFIG['TOP'];
  const pickedTier = pickedHero ? getHeroTierForLane(pickedHero.name, selectedLane, laneMeta) : null;

  return (
    <div className="tab-pane active lane-picker-pane">
      <div className="section-title-wrap text-center">
        <div className="section-title">
          <Target size={20} className="title-icon" />
          <span>QUAY TƯỚNG THEO VỊ TRÍ & TIER</span>
        </div>
        <p className="section-subtitle">
          Chọn vị trí thi đấu bạn muốn chơi, hệ thống sẽ đề cử tướng ngẫu nhiên theo Meta TierLQ.
        </p>
      </div>

      {/* LANE SELECTOR TABS */}
      <div className="lane-buttons-group">
        {POSITIONS.map(lane => {
          const cfg = POSITION_CONFIG[lane];
          return (
            <button
              key={lane}
              className={`lane-btn ${selectedLane === lane ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setSelectedLane(lane);
              }}
              style={{ '--lane-color': cfg.color }}
            >
              <span className="lane-icon">{cfg.icon}</span>
              <span className="lane-name">{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* TIER FILTER PILLS */}
      <div className="tier-filter-strip">
        <span className="filter-title">
          <Filter size={13} /> Lọc theo Tier:
        </span>
        {['ALL', 'S', 'A', 'B', 'C', 'D'].map(tier => (
          <button
            key={tier}
            className={`tier-pill ${selectedTierFilter === tier ? 'active' : ''} ${tier !== 'ALL' ? `pill-${tier}` : ''}`}
            onClick={() => {
              sound.playClick();
              setSelectedTierFilter(tier);
            }}
          >
            {tier === 'ALL' ? 'Tất cả Tier' : `Tier ${tier}`}
          </button>
        ))}
      </div>

      {/* ACTION BUTTON */}
      <div className="lane-action-bar">
        <button
          className="cyber-glow-btn primary-action-btn"
          onClick={handlePickHero}
          disabled={isRolling}
        >
          <RefreshCw size={20} className={isRolling ? 'animate-spin' : ''} />
          <span>{isRolling ? 'ĐANG CHỌN TƯỚNG...' : `CHỌN TƯỚNG ĐƯỜNG ${currentCfg.name.toUpperCase()}`}</span>
        </button>
      </div>

      {/* RESULT SHOWCASE CARD */}
      <div className="lane-result-container">
        {pickedHero ? (
          <div className="hero-feature-card animate-zoomIn" style={{ '--lane-color': currentCfg.color }}>
            <div className="feature-avatar-wrap">
              <img src={pickedHero.avatar} alt={pickedHero.name} className="feature-avatar" />
              {pickedTier && pickedTier !== 'REMOVED' && (
                <div className={`tier-badge tier-badge-${pickedTier} tier-badge-large`}>
                  TIER {pickedTier}
                </div>
              )}
            </div>

            <div className="feature-info">
              <div className="feature-lane-badge" style={{ color: currentCfg.color }}>
                {currentCfg.icon} {currentCfg.name} • {selectedLane}
              </div>
              <h2 className="feature-hero-name">{pickedHero.name}</h2>
              <p className="feature-hero-roles">
                Vai trò mặc định: {pickedHero.roles ? pickedHero.roles.join(', ') : currentCfg.name}
              </p>
              
              <div className="feature-meta-note">
                <ShieldCheck size={14} color="#10b981" />
                <span>Phù hợp với Meta TierLQ S4 2026</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="hero-feature-placeholder">
            <Sparkles size={48} className="pulse-slow" />
            <p>Bấm nút trên để quay ngẫu nhiên 1 tướng cho đường <strong>{currentCfg.name}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
