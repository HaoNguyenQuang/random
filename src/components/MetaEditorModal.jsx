import React, { useState } from 'react';
import { X, RefreshCw, RotateCcw, Search, ChevronRight, Check } from 'lucide-react';
import { POSITIONS, POSITION_CONFIG, CHAMP_LOOKUP } from '../data/champions';
import { DEFAULT_LANE_META, TARGET_TIER_PROBS } from '../data/defaultMeta';
import { sound } from '../utils/audio';

const TIERS = ['S', 'A', 'B', 'C', 'D'];

export default function MetaEditorModal({
  isOpen,
  onClose,
  laneMeta,
  setLaneMeta,
  onSyncTierLQ,
  isSyncing,
  syncInfo
}) {
  const [activeLane, setActiveLane] = useState('TOP');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const currentLaneData = laneMeta[activeLane] || { S: [], A: [], B: [], C: [], D: [], removed: [] };

  // Move hero to new tier
  const handleMoveTier = (heroName, targetTier) => {
    sound.playClick();
    const updated = JSON.parse(JSON.stringify(laneMeta));
    const laneObj = updated[activeLane];

    // Remove from all tiers & removed
    TIERS.forEach(t => {
      if (laneObj[t]) {
        laneObj[t] = laneObj[t].filter(h => h !== heroName);
      }
    });
    if (laneObj.removed) {
      laneObj.removed = laneObj.removed.filter(h => h !== heroName);
    }

    // Add to target
    if (targetTier === 'REMOVED') {
      if (!laneObj.removed) laneObj.removed = [];
      laneObj.removed.push(heroName);
    } else {
      if (!laneObj[targetTier]) laneObj[targetTier] = [];
      laneObj[targetTier].push(heroName);
    }

    setLaneMeta(updated);
  };

  // Reset to default
  const handleResetDefault = () => {
    sound.playClick();
    if (confirm('Bạn có chắc chắn muốn khôi phục Meta mặc định TierLQ S4?')) {
      setLaneMeta(JSON.parse(JSON.stringify(DEFAULT_LANE_META)));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-large animate-zoomIn" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">CÀI ĐẶT BẬC META TIERLQ (5 TIER S ➔ D)</h2>
            <p className="modal-subtitle">
              Tùy chỉnh danh sách tướng cho từng vị trí và tỷ lệ xuất hiện khi quay ngẫu nhiên.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* TIER PROBABILITIES BANNER */}
        <div className="meta-probs-banner">
          <span className="probs-title">Tỷ lệ Random:</span>
          <div className="probs-chips">
            <span className="prob-chip chip-S">Tier S: 40% (Đỉnh Meta)</span>
            <span className="prob-chip chip-A">Tier A: 30% (Mạnh)</span>
            <span className="prob-chip chip-B">Tier B: 18% (Cân bằng)</span>
            <span className="prob-chip chip-C">Tier C: 8% (Tình huống)</span>
            <span className="prob-chip chip-D">Tier D: 4% (Yếu / Troll)</span>
          </div>
        </div>

        {/* CONTROLS: LANE TABS & ACTIONS */}
        <div className="meta-editor-controls">
          <div className="meta-lane-tabs">
            {POSITIONS.map(lane => {
              const cfg = POSITION_CONFIG[lane];
              return (
                <button
                  key={lane}
                  className={`meta-lane-tab ${activeLane === lane ? 'active' : ''}`}
                  onClick={() => { sound.playClick(); setActiveLane(lane); }}
                  style={{ '--accent': cfg.color }}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.name}</span>
                </button>
              );
            })}
          </div>

          <div className="meta-action-btns">
            <button
              className="sync-live-btn"
              onClick={onSyncTierLQ}
              disabled={isSyncing}
              title="Đồng bộ cập nhật mới nhất từ TierLQ.github.io"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Đang tải...' : 'Đồng Bộ TierLQ'}</span>
            </button>

            <button
              className="secondary-btn btn-sm"
              onClick={handleResetDefault}
              title="Khôi phục danh sách mặc định"
            >
              <RotateCcw size={14} /> Mặc Định
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="meta-search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder={`Tìm tướng đường ${POSITION_CONFIG[activeLane]?.name}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>

        {/* TIERS COLUMNS GRID */}
        <div className="meta-tiers-grid">
          {TIERS.map(tier => {
            const heroes = (currentLaneData[tier] || []).filter(h => 
              h.toLowerCase().includes(searchTerm)
            );

            return (
              <div key={tier} className={`meta-tier-col tier-col-${tier}`}>
                <div className="tier-col-header">
                  <span className="tier-col-label">TIER {tier}</span>
                  <span className="tier-col-count">{heroes.length} tướng</span>
                </div>

                <div className="tier-hero-list">
                  {heroes.map(heroName => {
                    return (
                      <div key={heroName} className="tier-hero-item">
                        <span className="hero-label">{heroName}</span>
                        <div className="hero-tier-quick-move">
                          <select
                            value={tier}
                            onChange={(e) => handleMoveTier(heroName, e.target.value)}
                            className="tier-select-dropdown"
                          >
                            <option value="S">S</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="REMOVED">✕ Loại</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  {heroes.length === 0 && (
                    <div className="tier-empty-hint">Không có tướng</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <div className="footer-status-text">
            {syncInfo?.patch ? `✓ Đang sử dụng dữ liệu TierLQ Bản ${syncInfo.patch}` : '✓ Đang sử dụng dữ liệu Meta chuẩn'}
          </div>
          <button className="cyber-glow-btn btn-sm" onClick={onClose}>
            Xong & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
}
