import React, { useState, useRef, useEffect } from 'react';
import { Compass, RotateCw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { POSITIONS, POSITION_CONFIG } from '../data/champions';
import { sound } from '../utils/audio';

const ROLE_ITEMS = [
  { id: 'TOP', label: 'TÀ THẦN (TOP)', color: '#ef4444', icon: '⚔️' },
  { id: 'JUNGLE', label: 'ĐI RỪNG (JG)', color: '#10b981', icon: '🌲' },
  { id: 'MID', label: 'ĐƯỜNG GIỮA (MID)', color: '#a855f7', icon: '⚡' },
  { id: 'AD', label: 'XẠ THỦ (AD)', color: '#f59e0b', icon: '🏹' },
  { id: 'SP', label: 'TRỢ THỦ (SP)', color: '#06b6d4', icon: '🛡️' }
];

export default function ModeRoleWheel() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const canvasRef = useRef(null);
  const wheelStateRef = useRef({
    currentAngle: 0,
    angularVelocity: 0,
    isSpinning: false,
    lastPassedIndex: -1
  });

  const numSegments = ROLE_ITEMS.length;
  const segmentAngle = (2 * Math.PI) / numSegments;

  // Draw wheel on canvas
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

    // Outer Glow Border
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#090d18';
    ctx.shadowColor = '#f5ba31';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    // Wheel segments
    for (let i = 0; i < numSegments; i++) {
      const segStart = angle + i * segmentAngle;
      const segEnd = segStart + segmentAngle;
      const item = ROLE_ITEMS[i];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, segStart, segEnd);
      ctx.closePath();

      // Gradient fill
      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
      grad.addColorStop(0, '#1a2236');
      grad.addColorStop(0.65, item.color);
      grad.addColorStop(1, '#0b0f1a');
      ctx.fillStyle = grad;
      ctx.fill();

      // Border between segments
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text label & icon
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segStart + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Montserrat, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(`${item.icon} ${item.label}`, radius - 25, 6);
      ctx.restore();
    }

    // Outer ring rivets
    for (let i = 0; i < 20; i++) {
      const rivetAngle = (i * 2 * Math.PI) / 20;
      const rx = centerX + (radius + 5) * Math.cos(rivetAngle);
      const ry = centerY + (radius + 5) * Math.sin(rivetAngle);
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5ba31';
      ctx.fill();
    }

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#0b0f1a';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold 16px Montserrat';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LQ', centerX, centerY);
  };

  useEffect(() => {
    drawWheel(0);
  }, []);

  const spinWheel = () => {
    if (wheelStateRef.current.isSpinning) return;
    sound.playWhoosh();
    setIsSpinning(true);
    setWinner(null);

    const initialSpeed = 0.45 + Math.random() * 0.25; // Random initial impulse
    const deceleration = 0.988; // Friction
    wheelStateRef.current.angularVelocity = initialSpeed;
    wheelStateRef.current.isSpinning = true;

    const animate = () => {
      const st = wheelStateRef.current;
      st.currentAngle += st.angularVelocity;
      st.angularVelocity *= deceleration;

      // Pointer is at the top: angle = 3 * Math.PI / 2
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
        const winItem = ROLE_ITEMS[currentSegment];
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
          <Compass size={20} className="title-icon" />
          <span>VÒNG QUAY VỊ TRÍ (5 ROLES ESPORTS)</span>
        </div>
        <p className="section-subtitle">
          Quay ngẫu nhiên vị trí thi đấu công bằng cho anh em khi solo hoặc chia lane.
        </p>
      </div>

      <div className="wheel-stage-container">
        {/* WHEEL POINTER */}
        <div className="wheel-pointer-arrow">▼</div>

        {/* CANVAS */}
        <div className="wheel-canvas-box">
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="wheel-canvas"
            onClick={spinWheel}
          />
        </div>

        {/* SPIN BUTTON */}
        <div className="wheel-action-bar">
          <button
            className="cyber-glow-btn primary-action-btn"
            onClick={spinWheel}
            disabled={isSpinning}
          >
            <RotateCw size={20} className={isSpinning ? 'animate-spin' : ''} />
            <span>{isSpinning ? 'ĐANG QUAY VÒNG...' : 'QUAY VỊ TRÍ NGAY'}</span>
          </button>
        </div>

        {/* WINNER RESULT POPUP */}
        {winner && (
          <div className="wheel-winner-banner animate-zoomIn" style={{ '--winner-color': winner.color }}>
            <Trophy size={28} className="winner-trophy" />
            <div className="winner-text">
              <div className="winner-title">KẾT QUẢ QUAY ĐƯỢC:</div>
              <div className="winner-value">{winner.icon} {winner.label}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
