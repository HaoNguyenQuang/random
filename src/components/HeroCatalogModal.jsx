import React, { useState } from 'react';
import { X, Search, CheckSquare, Square, RotateCcw, Users } from 'lucide-react';
import { CHAMPIONS } from '../data/champions';
import { sound } from '../utils/audio';

const ROLE_FILTERS = [
  'TẤT CẢ',
  'Đấu Sĩ',
  'Pháp Sư',
  'Sát Thủ',
  'Xạ Thủ',
  'Trợ Thủ',
  'Đỡ Đòn'
];

export default function HeroCatalogModal({
  isOpen,
  onClose,
  disabledHeroIds,
  setDisabledHeroIds
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('TẤT CẢ');

  if (!isOpen) return null;

  const toggleHero = (heroId) => {
    sound.playClick();
    const updated = new Set(disabledHeroIds);
    if (updated.has(heroId)) {
      updated.delete(heroId);
    } else {
      updated.add(heroId);
    }
    setDisabledHeroIds(updated);
  };

  const handleEnableAll = () => {
    sound.playClick();
    setDisabledHeroIds(new Set());
  };

  const handleDisableAll = () => {
    sound.playClick();
    const allIds = new Set(CHAMPIONS.map(c => c.id));
    setDisabledHeroIds(allIds);
  };

  const filteredChamps = CHAMPIONS.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'TẤT CẢ' || (c.roles && c.roles.includes(selectedRole));
    return matchesSearch && matchesRole;
  });

  const activeCount = CHAMPIONS.length - disabledHeroIds.size;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-large animate-zoomIn" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">DANH MỤC 129 TƯỚNG LIÊN QUÂN</h2>
            <p className="modal-subtitle">
              Bật/Tắt tướng để đưa vào hoặc loại trừ khỏi danh sách quay ngẫu nhiên.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* HERO CATALOG CONTROLS */}
        <div className="catalog-controls-bar">
          <div className="catalog-counter-badge">
            <Users size={16} />
            <span>Đang chọn: <strong>{activeCount}</strong> / {CHAMPIONS.length} Tướng</span>
          </div>

          <div className="catalog-quick-actions">
            <button className="secondary-btn btn-sm" onClick={handleEnableAll}>
              <CheckSquare size={14} /> Bật Tất Cả
            </button>
            <button className="secondary-btn btn-sm" onClick={handleDisableAll}>
              <Square size={14} /> Tắt Tất Cả
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="catalog-search-row">
          <div className="catalog-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm tên tướng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="catalog-role-filters">
            {ROLE_FILTERS.map(role => (
              <button
                key={role}
                className={`filter-role-btn ${selectedRole === role ? 'active' : ''}`}
                onClick={() => { sound.playClick(); setSelectedRole(role); }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* HEROES GRID */}
        <div className="catalog-grid">
          {filteredChamps.map(c => {
            const isEnabled = !disabledHeroIds.has(c.id);
            return (
              <div
                key={c.id}
                className={`catalog-hero-card ${isEnabled ? 'enabled' : 'disabled'}`}
                onClick={() => toggleHero(c.id)}
                title={isEnabled ? 'Bấm để loại trừ tướng này' : 'Bấm để bật lại tướng này'}
              >
                <div className="catalog-hero-avatar-wrap">
                  <img src={c.avatar} alt={c.name} loading="lazy" />
                  <div className="catalog-hero-status-icon">
                    {isEnabled ? '✓' : '✕'}
                  </div>
                </div>
                <div className="catalog-hero-name">{c.name}</div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <div className="footer-status-text">
            * Các tướng bị tắt sẽ không bao giờ xuất hiện trong chế độ Random Team 5v5.
          </div>
          <button className="cyber-glow-btn btn-sm" onClick={onClose}>
            Xong & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
