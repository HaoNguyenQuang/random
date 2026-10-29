import React from 'react';
import { X, History, Trash2, Copy, Check } from 'lucide-react';
import { sound } from '../utils/audio';

export default function HistoryModal({
  isOpen,
  onClose,
  history,
  onClearHistory
}) {
  const [copiedIdx, setCopiedIdx] = React.useState(null);

  if (!isOpen) return null;

  const handleCopyRecord = async (record, idx) => {
    sound.playClick();
    const lines = [
      `🏆 ĐỘI HÌNH LIÊN QUÂN (${record.timestamp} - ${record.date}):`,
      '───────────────────────────────'
    ];
    record.players.forEach((p, i) => {
      lines.push(`${i + 1}. [${p.role}] ${p.playerName} ➔ ${p.champ} (Tier ${p.tier})`);
    });
    lines.push('───────────────────────────────');

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch (e) {
      alert('Đã sao chép vào bộ nhớ đệm!');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-large animate-zoomIn" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div className="flex-row items-center gap-2">
            <History size={22} className="title-icon" />
            <div>
              <h2 className="modal-title">LỊCH SỬ CÁC LẦN QUAY ĐỘI HÌNH</h2>
              <p className="modal-subtitle">
                Xem lại danh sách đội hình 5v5 đã tạo trong phiên làm việc này.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* CONTROLS */}
        <div className="history-controls-bar">
          <span className="history-count">
            Tổng cộng <strong>{history.length}</strong> lần quay
          </span>
          {history.length > 0 && (
            <button className="secondary-btn btn-sm text-danger" onClick={onClearHistory}>
              <Trash2 size={14} /> Xóa Lịch Sử
            </button>
          )}
        </div>

        {/* LIST */}
        <div className="history-list-box">
          {history.length === 0 ? (
            <div className="history-empty">
              <History size={40} className="empty-icon" />
              <p>Chưa có lịch sử quay nào trong phiên này.</p>
              <span className="empty-sub">Hãy quay thử 1 đội hình 5v5 để lưu lại tại đây!</span>
            </div>
          ) : (
            history.map((rec, idx) => (
              <div key={idx} className="history-card">
                <div className="history-card-header">
                  <div className="history-time-badge">
                    <span>Lần #{history.length - idx} • {rec.timestamp} ({rec.date})</span>
                  </div>
                  <button
                    className="history-copy-btn"
                    onClick={() => handleCopyRecord(rec, idx)}
                    title="Sao chép đội hình này"
                  >
                    {copiedIdx === idx ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedIdx === idx ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>

                <div className="history-players-row">
                  {rec.players.map((p, pIdx) => (
                    <div key={pIdx} className="history-player-chip">
                      <span className="history-role-tag">{p.role}</span>
                      <div className="history-player-info">
                        <span className="history-player-name">{p.playerName}</span>
                        <div className="history-champ-row">
                          <span className="history-champ-name">{p.champ}</span>
                          <span className={`tier-badge-mini tier-badge-${p.tier}`}>{p.tier}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button className="cyber-glow-btn btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
