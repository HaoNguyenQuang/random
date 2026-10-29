import React, { useState, useRef, useEffect } from 'react';
import { CircleDot, RotateCw, Trophy, Edit3, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

const PRESETS = {
  punishment: {
    title: '🍺 Hình Phạt Vui',
    items: [
      'Uống 1 ngụm nước/bia',
      'Hít đất 10 cái',
      'Đứng 1 chân 1 phút',
      'Khen người thắng 3 câu',
      'Chơi trận sau cầm Aya',
      'Thoát nạn may mắn!'
    ]
  },
  solo: {
    title: '⚔️ Kèo Tướng Solo 1v1',
    items: [
      'Florentino Múa Lửa',
      'Nakroth Sát Thủ',
      'Raz Quyền Vương',
      'Elsu Ngắm Bắn',
      'Valhein Full Phép',
      'Zuka Gấu Béo'
    ]
  },
  challenges: {
    title: '🔥 Thử Thách Lên Đồ',
    items: [
      'Lên Full Phép (Kể cả Xạ thủ)',
      'Không Lên Giày Cả Trận',
      'Lên 3 Giáp Gai / Full Thủ',
      'Không Biến Về Trong 5 Phút',
      'Chỉ Được Đánh Thường',
      'Cầm Trừng Trị Đi Tất Cả Đường'
    ]
  }
};

const COLOR_PALETTE = [
  '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1',
  '#a855f7', '#ec4899', '#f43f5e', '#14b8a6', '#8b5cf6'
];

export default function ModeCustomWheel() {
  const [inputText, setInputText] = useState(PRESETS.punishment.items.join('\n'));
  const [items, setItems] = useState(PRESETS.punishment.items);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);

  const canvasRef = useRef(null);
  const wheelStateRef = useRef({
    currentAngle: 0,
    angularVelocity: 0,
    isSpinning: false,
    lastPassedIndex: -1
  });

  // Parse input
  const handleApplyItems = (text) => {
    const parsed = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (parsed.length < 2) {
      alert('Vui lòng nhập ít nhất 2 mục để tạo vòng quay!');
      return;
    }
    setItems(parsed);
    setWinner(null);
  };

  const handleSelectPreset = (key) => {
    sound.playClick();
    const pr = PRESETS[key];
    if (pr) {
      setInputText(pr.items.join('\n'));
      setItems(pr.items);
      setWinner(null);
    }
  };

  const numSegments = Math.max(1, items.length);
  const segmentAngle = (2 * Math.PI) / numSegments;

  const drawWheel = (angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    // Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#090d18';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < numSegments; i++) {
      const segStart = angle + i * segmentAngle;
      const segEnd = segStart + segmentAngle;
      const color = COLOR_PALETTE[i % COLOR_PALETTE.length];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, segStart, segEnd);
      ctx.closePath();

      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
      grad.addColorStop(0, '#151d30');
      grad.addColorStop(0.7, color);
      grad.addColorStop(1, '#090d18');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segStart + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Montserrat, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 5;

      const itemText = items[i] || '';
      const truncated = itemText.length > 20 ? itemText.substring(0, 18) + '...' : itemText;
      ctx.fillText(truncated, radius - 20, 5);
      ctx.restore();
    }

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#080c16';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 36, 0, 2 * Math.PI);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold 13px Montserrat';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
  };

  useEffect(() => {
    drawWheel(0);
  }, [items]);

  const spinWheel = () => {
    if (wheelStateRef.current.isSpinning || items.length < 2) return;
    sound.playWhoosh();
    setIsSpinning(true);
    setWinner(null);

    const initialSpeed = 0.45 + Math.random() * 0.28;
    const deceleration = 0.988;
    wheelStateRef.current.angularVelocity = initialSpeed;
    wheelStateRef.current.isSpinning = true;

    const animate = () => {
      const st = wheelStateRef.current;
      st.currentAngle += st.angularVelocity;
      st.angularVelocity *= deceleration;

      const pointerAngle = (3 * Math.PI) / 2;
      const normalizedAngle = (pointerAngle - (st.currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const currentSegment = Math.floor(normalizedAngle / segmentAngle) % numSegments;

      if (currentSegment !== st.lastPassedIndex) {
        sound.playTick();
        st.lastPassedIndex = currentSegment;
      }

      drawWheel(st.currentAngle);

      if (st.angularVelocity > 0.002) {
        requestAnimationFrame(animate);
      } else {
        st.isSpinning = false;
        setIsSpinning(false);
        const winItem = items[currentSegment];
        setWinner(winItem);
        sound.playVictory();

        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="tab-pane active wheel-pane">
      <div className="section-title-wrap text-center">
        <div className="section-title">
          <CircleDot size={20} className="title-icon" />
          <span>VÒNG QUAY TÙY BIẾN (CUSTOM WHEEL)</span>
        </div>
        <p className="section-subtitle">
          Tùy chỉnh danh sách các mục: hình phạt uống bia, kèo solo, thử thách, tên bạn bè...
        </p>
      </div>

      <div className="custom-wheel-layout">
        {/* WHEEL STAGE */}
        <div className="wheel-stage-container">
          <div className="wheel-pointer-arrow">▼</div>
          <div className="wheel-canvas-box">
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              className="wheel-canvas"
              onClick={spinWheel}
            />
          </div>

          <div className="wheel-action-bar">
            <button
              className="cyber-glow-btn primary-action-btn"
              onClick={spinWheel}
              disabled={isSpinning || items.length < 2}
            >
              <RotateCw size={20} className={isSpinning ? 'animate-spin' : ''} />
              <span>{isSpinning ? 'ĐANG QUAY VÒNG...' : 'QUAY NGAY'}</span>
            </button>
          </div>

          {winner && (
            <div className="wheel-winner-banner animate-zoomIn" style={{ '--winner-color': '#00e5ff' }}>
              <Trophy size={28} className="winner-trophy" />
              <div className="winner-text">
                <div className="winner-title">CHÚC MỪNG MỤC CHIẾN THẮNG:</div>
                <div className="winner-value">{winner}</div>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS & EDITOR */}
        <div className="custom-editor-panel">
          <div className="preset-selector-group">
            <span className="preset-label">Mẫu có sẵn:</span>
            <div className="preset-btns">
              {Object.entries(PRESETS).map(([key, data]) => (
                <button
                  key={key}
                  className="preset-btn"
                  onClick={() => handleSelectPreset(key)}
                >
                  {data.title}
                </button>
              ))}
            </div>
          </div>

          <div className="textarea-editor-box">
            <label className="editor-label">
              <Edit3 size={14} /> Danh sách các ô (mỗi dòng 1 ô):
            </label>
            <textarea
              className="custom-items-textarea"
              rows={8}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                handleApplyItems(e.target.value);
              }}
              placeholder="Nhập các mục ở đây, mỗi mục một dòng..."
            />
            <div className="editor-hint">
              Hiện có <strong>{items.length}</strong> mục trên vòng quay.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
