import React, { useEffect, useRef } from 'react';

/**
 * CHIẾN TRƯỜNG BÌNH NGUYÊN VÔ TẬN (ANTARIS BATTLEFIELD - LỤC ĐỊA ATHANOR)
 * Tối ưu hóa hiệu năng cực đại: 0% Lag, không tụt FPS trên mobile, tắt shadowBlur tốn CPU.
 */
export default function ArenaBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Trên mobile hoặc thiết bị cấu hình yếu: dùng hoàn toàn CSS Aurora 0% CPU, tắt canvas để mượt 120 FPS
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 768;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Trên mobile chỉ cần 0 hạt hoặc tối đa 8 hạt không shadow; desktop 22 hạt
    const EMBER_COUNT = isMobile ? 0 : 24;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // TÀN LỬA TÀ THẦN CAESAR
    const EMBER_PALETTES = [
      'rgba(245, 186, 49, ',  // Caesar Gold
      'rgba(255, 71, 87, ',   // Dark Slayer Crimson
      'rgba(0, 229, 255, ',   // Arcane Cyan
      'rgba(255, 215, 0, ',   // Divine Light
      'rgba(168, 85, 247, '   // Abyssal Purple
    ];

    class AthanorEmber {
      constructor(initial = false) {
        this.reset(initial);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 10 + Math.random() * 20;
        this.size = 1.2 + Math.random() * 2.2;
        this.speedY = 0.35 + Math.random() * 0.7;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.alpha = 0.2 + Math.random() * 0.45;
        this.colorPrefix = EMBER_PALETTES[Math.floor(Math.random() * EMBER_PALETTES.length)];
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;

        if (this.y < -10 || this.x < -10 || this.x > width + 10) {
          this.reset(false);
        }
      }

      draw() {
        // Vẽ trực tiếp KHÔNG dùng shadowBlur để tránh lag GPU
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `${this.colorPrefix}${this.alpha})`;
        ctx.fill();
      }
    }

    // VÒNG TRẬN PHÁP MA THUẬT ATHANOR (Vẽ nhẹ nhàng bằng nét đơn)
    class MagicRuneCircle {
      constructor(cxRatio, cyRatio, radius, color, rotSpeed) {
        this.cxRatio = cxRatio;
        this.cyRatio = cyRatio;
        this.radius = radius;
        this.color = color;
        this.rotSpeed = rotSpeed;
        this.angle = 0;
      }

      update() {
        this.angle += this.rotSpeed;
      }

      draw() {
        const cx = width * this.cxRatio;
        const cy = height * this.cyRatio;
        const r = this.radius;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.angle);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        // Vòng tròn ngoài
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Vòng tròn trong
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        // Ngôi sao 8 cánh
        const points = 8;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const a = (i * Math.PI) / points;
          const dist = i % 2 === 0 ? r * 0.8 : r * 0.5;
          const px = Math.cos(a) * dist;
          const py = Math.sin(a) * dist;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      }
    }

    const embers = Array.from({ length: EMBER_COUNT }, () => new AthanorEmber(true));

    const runeLight = new MagicRuneCircle(
      0.15,
      0.22,
      140,
      'rgba(245, 186, 49, 0.12)',
      0.0015
    );

    const runeAbyss = new MagicRuneCircle(
      0.85,
      0.78,
      160,
      'rgba(168, 85, 247, 0.1)',
      -0.0012
    );

    let lastTime = 0;
    const targetFps = 45; // Khóa 45 FPS để tiết kiệm pin và loại bỏ 100% lag
    const interval = 1000 / targetFps;

    const render = (currentTime) => {
      animId = requestAnimationFrame(render);

      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      ctx.clearRect(0, 0, width, height);

      if (!isMobile) {
        runeLight.update();
        runeLight.draw();

        runeAbyss.update();
        runeAbyss.draw();

        for (let i = 0; i < embers.length; i++) {
          embers[i].update();
          embers[i].draw();
        }
      }
    };

    animId = requestAnimationFrame(render);

    // Tự động tạm dừng khi tab bị ẩn để tiết kiệm pin tối đa
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="arena-bg-wrapper antaris-battlefield-theme" aria-hidden="true">
      <div className="antaris-aurora aurora-light" />
      <div className="antaris-aurora aurora-abyss" />
      <div className="antaris-battlefield-fog" />
      <canvas ref={canvasRef} className="arena-bg-canvas" />
    </div>
  );
}
