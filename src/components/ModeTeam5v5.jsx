import React, { useState, useRef } from 'react';
import { 
  Swords, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Copy, 
  Download, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  Shuffle,
  Dice5
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { POSITIONS, POSITION_CONFIG, CHAMP_LOOKUP } from '../data/champions';
import { getHeroTierForLane, solveTeamMatching, pickWeightedChampion } from '../utils/random';
import { sound } from '../utils/audio';

const FUNNY_NAMES = [
  'Best Flo 200 Giờ', 'Nakroth Múa Lửa', 'Thánh Kéo Grakk', 'Best Valhein Full Phép',
  'Ngộ Không Gõ Đầu', 'Ad Cần Thở', 'Sp Gánh Team', 'Rừng Ăn Thịt',
  'Mid Đảo Đường', 'Top Bất Bại', 'Airi Bật Bay', 'Aya Ký Sinh',
  'Elsu Ngắm Tâm', 'Zuka Nhảy Đầm', 'Hayate Lượn Sóng', 'Raz Đấm Thốn'
];

export default function ModeTeam5v5({
  players,
  setPlayers,
  availableChamps,
  disabledHeroIds,
  laneMeta,
  isNoRepeatPrevious,
  setIsNoRepeatPrevious,
  lastRolledChampIds,
  setLastRolledChampIds,
  onSaveHistory
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const arenaRef = useRef(null);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#ffd700', '#00e5ff', '#ff007f', '#00ff88', '#ffffff']
      });
    } catch (e) {
      // Ignore if confetti fails
    }
  };

  // Main Team Random Roll
  const handleRandomTeam = () => {
    if (isRolling) return;
    sound.playWhoosh();
    setIsRolling(true);

    // Audio click cadence simulation
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      sound.playTick();
      tickCount++;
      if (tickCount > 6) clearInterval(tickInterval);
    }, 80);

    setTimeout(() => {
      clearInterval(tickInterval);

      const result = solveTeamMatching({
        players,
        availableChamps,
        disabledHeroIds,
        laneMeta,
        isNoRepeatPrevious,
        lastRolledChampIds
      });

      if (!result.success) {
        sound.playClick();
        alert('Không tìm đủ tướng hợp lệ cho cả 5 vị trí! Vui lòng kiểm tra lại Danh sách tướng hoặc Meta.');
        setIsRolling(false);
        return;
      }

      const newPlayers = players.map((p, idx) => ({
        ...p,
        role: result.assignedRoles[idx] || p.role,
        champId: result.assignedChamps[idx] || p.champId
      }));

      setPlayers(newPlayers);

      // Record last rolled champion IDs for no-repeat mode
      const newRolledIds = new Set(newPlayers.map(p => p.champId).filter(Boolean));
      setLastRolledChampIds(newRolledIds);

      // Save to history
      if (onSaveHistory) {
        onSaveHistory({
          type: 'team5v5',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          date: new Date().toLocaleDateString('vi-VN'),
          players: newPlayers.map(p => ({
            playerName: p.name,
            role: p.role,
            champ: CHAMP_LOOKUP[p.champId]?.name || '---',
            tier: getHeroTierForLane(CHAMP_LOOKUP[p.champId]?.name, p.role, laneMeta)
          }))
        });
      }

      sound.playVictory();
      triggerConfetti();
      setIsRolling(false);
    }, 450);
  };

  // Reroll single player's champion
  const handleRerollSingle = (playerIndex) => {
    const p = players[playerIndex];
    if (p.lockChamp) return;

    sound.playWhoosh();
    const role = p.role || POSITIONS[playerIndex % POSITIONS.length];
    const currentlyUsedChamps = new Set(
      players.filter((_, idx) => idx !== playerIndex).map(pl => pl.champId).filter(Boolean)
    );

    let candidates = availableChamps.filter(c => {
      if (disabledHeroIds.has(c.id) || currentlyUsedChamps.has(c.id)) return false;
      if (isNoRepeatPrevious && lastRolledChampIds && lastRolledChampIds.has(c.id)) return false;
      const t = getHeroTierForLane(c.name, role, laneMeta);
      return t !== 'REMOVED';
    });

    if (candidates.length === 0) {
      candidates = availableChamps.filter(c => {
        if (disabledHeroIds.has(c.id) || currentlyUsedChamps.has(c.id)) return false;
        const t = getHeroTierForLane(c.name, role, laneMeta);
        return t !== 'REMOVED';
      });
    }

    if (candidates.length === 0) {
      alert('Không có tướng hợp lệ để reroll vị trí này!');
      return;
    }

    const picked = pickWeightedChampion(candidates, role, laneMeta);
    if (picked) {
      sound.playVictory();
      const updated = [...players];
      updated[playerIndex] = { ...p, champId: picked.id };
      setPlayers(updated);

      const newRolled = new Set(lastRolledChampIds);
      newRolled.add(picked.id);
      setLastRolledChampIds(newRolled);
    }
  };

  // Toggle lock role
  const toggleLockRole = (idx) => {
    sound.playClick();
    const updated = [...players];
    updated[idx] = { ...updated[idx], lockRole: !updated[idx].lockRole };
    setPlayers(updated);
  };

  // Toggle lock champ
  const toggleLockChamp = (idx) => {
    sound.playClick();
    const updated = [...players];
    updated[idx] = { ...updated[idx], lockChamp: !updated[idx].lockChamp };
    setPlayers(updated);
  };

  // Unlock all
  const handleUnlockAll = () => {
    sound.playClick();
    setPlayers(players.map(p => ({ ...p, lockRole: false, lockChamp: false })));
  };

  // Randomize player names
  const handleRandomizeNames = () => {
    sound.playClick();
    const shuffled = [...FUNNY_NAMES].sort(() => 0.5 - Math.random());
    setPlayers(players.map((p, i) => ({ ...p, name: shuffled[i] || `Người chơi ${i + 1}` })));
  };

  // Copy team as formatted text
  const handleCopyText = async () => {
    sound.playClick();
    const lines = [
      '🏆 ĐỘI HÌNH LIÊN QUÂN 5V5 (RANDOM ESPORTS):',
      '───────────────────────────────'
    ];
    players.forEach((p, idx) => {
      const cfg = POSITION_CONFIG[p.role] || { name: p.role || 'Chưa chọn' };
      const champ = CHAMP_LOOKUP[p.champId];
      const tier = champ ? getHeroTierForLane(champ.name, p.role, laneMeta) : '---';
      lines.push(`${idx + 1}. [${cfg.name.toUpperCase()}] ${p.name || 'Người chơi ' + (idx + 1)} ➔ ${champ ? champ.name : '---'} (Tier ${tier})`);
    });
    lines.push('───────────────────────────────');
    lines.push('⚡ Tạo bởi LienQuan Random • Meta S4 2026 TierLQ');

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (e) {
      alert('Đã sao chép vào bộ nhớ đệm!');
    }
  };

  // Capture team arena as PNG image
  const handleExportImage = async () => {
    if (!arenaRef.current || isCapturing) return;
    sound.playClick();
    setIsCapturing(true);

    try {
      const canvas = await html2canvas(arenaRef.current, {
        backgroundColor: '#07090f',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `LienQuan_Team5v5_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export image error:', err);
      alert('Không thể tạo ảnh, vui lòng thử lại!');
    } finally {
      setIsCapturing(false);
    }
  };

  // List of 5 champion objects excluded from previous roll
  const excludedPrevChamps = lastRolledChampIds 
    ? Array.from(lastRolledChampIds).map(id => CHAMP_LOOKUP[id]).filter(Boolean)
    : [];

  return (
    <div className="tab-pane active">
      {/* 1. PLAYER NAMES INPUT BAR */}
      <section className="controls-panel">
        <div className="section-title-wrap">
          <div className="section-title">
            <User size={18} className="title-icon" />
            <span>DANH SÁCH 5 NGƯỜI CHƠI</span>
          </div>
          <button 
            className="secondary-btn btn-sm"
            onClick={handleRandomizeNames}
            title="Đổi nhanh tên hài hước cho 5 người chơi"
          >
            <Dice5 size={14} /> Nickname Vui
          </button>
        </div>

        <div className="player-inputs-grid">
          {players.map((p, idx) => (
            <div key={idx} className="player-input-card">
              <span className="player-num-badge">{idx + 1}</span>
              <input
                type="text"
                className="player-name-field"
                placeholder={`Người chơi ${idx + 1}`}
                value={p.name}
                onChange={(e) => {
                  const updated = [...players];
                  updated[idx] = { ...updated[idx], name: e.target.value };
                  setPlayers(updated);
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 2. PROMINENT CYBER SWITCH: KHÔNG LẶP LẠI TƯỚNG LẦN QUAY TRƯỚC */}
      <section className="switch-banner-section">
        <div 
          id="chkNoRepeatWrapper"
          className={`cyber-switch-container ${isNoRepeatPrevious ? 'active' : ''}`}
          onClick={() => {
            sound.playClick();
            setIsNoRepeatPrevious(!isNoRepeatPrevious);
          }}
          title="Bật tính năng này để 5 tướng vừa quay ở lần trước KHÔNG bị lặp lại ở lần quay tiếp theo"
        >
          <div className="switch-toggle-track">
            <div className="switch-toggle-thumb"></div>
          </div>
          
          <div className="switch-text-group">
            <div className="switch-label-text">
              <RefreshCw size={17} className={isNoRepeatPrevious ? 'rotate-glow' : ''} />
              <span>KHÔNG LẶP LẠI TƯỚNG CỦA LẦN QUAY TRƯỚC</span>
              <span className={`switch-status-pill ${isNoRepeatPrevious ? 'pill-on' : 'pill-off'}`}>
                {isNoRepeatPrevious ? '✓ ĐANG BẬT' : '✕ ĐANG TẮT'}
              </span>
            </div>

            <div className="switch-sub-desc">
              {isNoRepeatPrevious ? (
                <span className="desc-active">
                  <ShieldCheck size={13} />
                  Hệ thống đang tự động <strong>loại trừ 5 tướng vừa quay</strong> để lần tiếp theo hoàn toàn mới!
                </span>
              ) : (
                <span className="desc-inactive">
                  <ShieldAlert size={13} />
                  Đang tắt: Các lần quay là độc lập, tướng có thể xuất hiện lại bình thường.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CHIP LIST OF CURRENTLY EXCLUDED 5 HEROES */}
        {isNoRepeatPrevious && excludedPrevChamps.length > 0 && (
          <div className="excluded-preview-strip animate-fadeIn">
            <span className="strip-title">5 tướng lần trước bị khóa:</span>
            <div className="strip-chips">
              {excludedPrevChamps.map(c => (
                <div key={c.id} className="champ-mini-chip">
                  <img src={c.avatar} alt={c.name} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. MAIN ACTION CONTROLS */}
      <div className="main-actions-bar">
        <button
          id="btnRollTeam"
          className="cyber-glow-btn primary-action-btn"
          onClick={handleRandomTeam}
          disabled={isRolling}
        >
          <Swords size={22} className={isRolling ? 'animate-spin' : ''} />
          <span>{isRolling ? 'ĐANG CHỌN ĐỘI HÌNH...' : '⚔️ RANDOM ĐỘI HÌNH 5V5'}</span>
        </button>

        <div className="secondary-actions-group">
          <button 
            className="secondary-btn"
            onClick={handleUnlockAll}
            title="Mở khóa tất cả vị trí và tướng"
          >
            <Unlock size={15} /> Mở Khóa Tất Cả
          </button>

          <button 
            className="secondary-btn"
            onClick={handleCopyText}
            title="Sao chép đội hình dạng văn bản để gửi bạn bè"
          >
            {copySuccess ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copySuccess ? 'Đã Sao Chép!' : 'Sao Chép Text'}</span>
          </button>

          <button 
            className="secondary-btn"
            onClick={handleExportImage}
            disabled={isCapturing}
            title="Chụp ảnh đội hình chất lượng cao PNG"
          >
            <Download size={15} />
            <span>{isCapturing ? 'Đang Tạo Ảnh...' : 'Xuất Ảnh PNG'}</span>
          </button>
        </div>
      </div>

      {/* 4. TEAM 5V5 ARENA CARDS */}
      <div className="team-arena-wrapper" ref={arenaRef}>
        <div className="team-arena-header">
          <span className="arena-title">ĐỘI HÌNH THI ĐẤU 5V5</span>
          <span className="arena-badge">CHẾ ĐỘ TỰ CHỌN META S4</span>
        </div>

        <div className="team-arena-grid">
          {players.map((p, idx) => {
            const role = p.role || POSITIONS[idx];
            const cfg = POSITION_CONFIG[role] || { name: 'TOP', icon: '⚔️', color: '#ff4757', desc: 'Đường Tà Thần' };
            const champ = CHAMP_LOOKUP[p.champId];
            const tier = champ ? getHeroTierForLane(champ.name, role, laneMeta) : '---';

            return (
              <div 
                key={idx} 
                className={`esports-card ${isRolling ? 'card-rolling' : ''}`}
                style={{ '--card-accent': cfg.color }}
              >
                {/* ROLE HEADER */}
                <div className="card-role-header">
                  <div className="role-indicator">
                    <span className="role-icon">{cfg.icon}</span>
                    <div className="role-info">
                      <span className="role-tag">{role}</span>
                      <span className="role-name">{cfg.name}</span>
                    </div>
                  </div>

                  <button
                    className={`lock-icon-btn ${p.lockRole ? 'locked' : ''}`}
                    onClick={() => toggleLockRole(idx)}
                    title={p.lockRole ? 'Đã khóa vị trí này' : 'Khóa vị trí này'}
                  >
                    {p.lockRole ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>

                {/* CHAMPION AVATAR & VISUAL */}
                <div className="card-avatar-wrap">
                  <div className={`card-avatar-inner ${isRolling ? 'avatar-flip' : ''}`}>
                    {champ ? (
                      <img 
                        src={champ.avatar} 
                        alt={champ.name}
                        className="hero-avatar-img"
                        loading="eager"
                      />
                    ) : (
                      <div className="hero-avatar-placeholder">
                        <Sparkles size={32} />
                        <span>Sẵn sàng</span>
                      </div>
                    )}
                  </div>

                  {/* TIER BADGE */}
                  {champ && tier && tier !== 'REMOVED' && (
                    <div className={`tier-badge tier-badge-${tier}`}>
                      <span>TIER {tier}</span>
                    </div>
                  )}
                </div>

                {/* CHAMPION NAME & INFO */}
                <div className="card-champ-body">
                  <div className="champ-name">{champ ? champ.name : '---'}</div>
                  <div className="champ-role-desc">
                    {champ ? (champ.roles ? champ.roles.join(' • ') : cfg.name) : 'Bấm random để chọn'}
                  </div>
                </div>

                {/* PLAYER FOOTER */}
                <div className="card-player-footer">
                  <div className="player-tag">
                    <User size={13} />
                    <span className="player-display-name">{p.name || `Người chơi ${idx + 1}`}</span>
                  </div>

                  <div className="card-item-actions">
                    <button
                      className={`lock-icon-btn ${p.lockChamp ? 'locked' : ''}`}
                      onClick={() => toggleLockChamp(idx)}
                      disabled={!champ}
                      title={p.lockChamp ? 'Đã khóa tướng này' : 'Khóa tướng này'}
                    >
                      {p.lockChamp ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>

                    <button
                      className="reroll-single-btn"
                      onClick={() => handleRerollSingle(idx)}
                      disabled={p.lockChamp || isRolling}
                      title="Quay đổi tướng khác cho riêng vị trí này"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
