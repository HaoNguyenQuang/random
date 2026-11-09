import React, { useEffect, useRef } from 'react';

/**
 * CHIẾN TRƯỜNG BÌNH NGUYÊN VÔ TẬN (ANTARIS BATTLEFIELD - LỤC ĐỊA ATHANOR)
 * Bối cảnh Liên Quân Mobile:
 * - Ánh sáng Vàng Kim Thần Thánh từ Tháp Quang Minh (Tower of Light)
 * - Khí tức Tím Đen Huyền Bí từ Vực Hỗn Mang & Hang Tà Thần Caesar (The Abyss)
 * - Vòng Trận Pháp Phù Hiệu Ma Thuật Cổ Xưa (Ancient Athanor Rune Circles)
 * - Tàn lửa Tà Thần & Bụi Linh Hồn Rừng Nguyên Sinh bay lơ lửng
 */
export default function ArenaBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768;
    const EMBER_COUNT = isMobile ? 32 : 65;

    // Mouse coordinates for gentle wind interaction
    const mouse = { x: -9999, y: -9999, targetX: 0, targetY: 0 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.targetX = (e.clientX - width / 2) * 0.05;
      mouse.targetY = (e.clientY - height / 2) * 0.05;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // 1. TÀN LỬA TÀ THẦN CAESAR & BỤI PHÉP RỪNG NGUYÊN SINH
    const EMBER_PALETTES = [
      { r: 245, g: 186, b: 49 },  // Caesar Gold (Vàng Tà Thần)
      { r: 255, g: 71, b: 87 },   // Dark Slayer Crimson (Đỏ Nộ Long)
      { r: 0, g: 229, b: 255 },   // Arcane Cyan (Lam Phép Thuật)
      { r: 255, g: 215, b: 0 },   // Divine Light (Quang Minh)
      { r: 168, g: 85, b: 247 }   // Abyssal Purple (Tím Hỗn Mang)
    ];

    class AthanorEmber {
      constructor(initial = false) {
        this.reset(initial);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 15 + Math.random() * 25;
        this.size = 1.2 + Math.random() * 2.6;
        this.speedY = 0.4 + Math.random() * 0.95;
        this.speedX = (Math.random() - 0.5) * 0.45;
        this.baseAlpha = 0.25 + Math.random() * 0.65;
        this.alpha = this.baseAlpha;
        this.pulseAngle = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.025;
        this.wobbleSpeed = 0.012 + Math.random() * 0.02;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.color = EMBER_PALETTES[Math.floor(Math.random() * EMBER_PALETTES.length)];
      }

      update(time) {
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(time * this.wobbleSpeed + this.wobbleOffset) * 0.4;

        this.pulseAngle += this.pulseSpeed;
        this.alpha = this.baseAlpha + Math.sin(this.pulseAngle) * 0.2;
        if (this.alpha < 0.08) this.alpha = 0.08;

        // Mouse wind push
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110 && dist > 0) {
          const force = (1 - dist / 110) * 2;
          this.x += (dx / dist) * force;
          this.y += (dy / dist) * force;
        }

        if (this.y < -20 || this.x < -20 || this.x > width + 20) {
          this.reset(false);
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${Math.min(1, this.alpha)})`;
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.85)`;
        ctx.shadowBlur = this.size * 3.5;
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. VÒNG TRẬN PHÁP MA THUẬT ATHANOR (ANCIENT RUNES OF LIGHT & ABYSS)
    class MagicRuneCircle {
      constructor(cx, cy, radius, color, rotSpeed, reverse = false) {
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.color = color;
        this.rotSpeed = rotSpeed * (reverse ? -1 : 1);
        this.angle = 0;
      }

      update() {
        this.angle += this.rotSpeed;
      }

      draw(parallaxX, parallaxY) {
        const x = this.cx + parallaxX;
        const y = this.cy + parallaxY;
        const r = this.radius;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // Vòng tròn ngoài
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Vòng tròn đồng tâm thứ hai
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        ctx.stroke();

        // Vòng tròn trong cùng
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
        ctx.stroke();

        // Ngôi sao 8 cánh phù hiệu Liên Quân (Octagram Crest)
        const points = 8;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const a = (i * Math.PI) / points;
          const dist = i % 2 === 0 ? r * 0.82 : r * 0.48;
          const px = Math.cos(a) * dist;
          const py = Math.sin(a) * dist;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Các ký tự Rune ma thuật cổ xung quanh viền
        const runeCount = 12;
        for (let i = 0; i < runeCount; i++) {
          const a = (i * 2 * Math.PI) / runeCount;
          const rx = Math.cos(a) * (r * 0.91);
          const ry = Math.sin(a) * (r * 0.91);
          ctx.beginPath();
          ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        }

        // Lõi năng lượng trung tâm
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 18;
        ctx.fill();

        ctx.restore();
      }
    }

    const embers = Array.from({ length: EMBER_COUNT }, () => new AthanorEmber(true));

    // 2 Vòng ma thuật:
    // - Vòng Quang Minh (Góc trên bên trái, Vàng Kim Thần Thánh)
    // - Vòng Tà Thần Vực Hỗn Mang (Góc dưới bên phải, Tím Đen & Đỏ Tà Thần)
    const runeLight = new MagicRuneCircle(
      width * 0.15,
      height * 0.22,
      isMobile ? 110 : 190,
      'rgba(245, 186, 49, 0.16)',
      0.002,
      false
    );

    const runeAbyss = new MagicRuneCircle(
      width * 0.86,
      height * 0.78,
      isMobile ? 130 : 230,
      'rgba(168, 85, 247, 0.14)',
      0.0016,
      true
    );

    let frame = 0;
    let curParallaxX = 0;
    let curParallaxY = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Smooth Parallax Easing
      curParallaxX += (mouse.targetX - curParallaxX) * 0.05;
      curParallaxY += (mouse.targetY - curParallaxY) * 0.05;

      // 1. Vẽ các vòng phù hiệu ma thuật cổ xưa
      runeLight.update();
      runeLight.draw(curParallaxX * 0.4, curParallaxY * 0.4);

      runeAbyss.update();
      runeAbyss.draw(-curParallaxX * 0.4, -curParallaxY * 0.4);

      // 2. Vẽ tàn lửa Tà Thần & Bụi phép
      for (let i = 0; i < embers.length; i++) {
        embers[i].update(frame);
        embers[i].draw();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="arena-bg-wrapper antaris-battlefield-theme" aria-hidden="true">
      {/* 1. ÁNH HÀO QUANG THÁP QUANG MINH (TOWER OF LIGHT - CAESAR GOLDEN DAWN) */}
      <div className="antaris-aurora aurora-light" />

      {/* 2. KHÍ TỨC VỰC HỖN MANG & HANG TÀ THẦN (ABYSSAL DARKNESS & CRIMSON FIRE) */}
      <div className="antaris-aurora aurora-abyss" />

      {/* 3. ĐƯỜNG KẺ NĂNG LƯỢNG CHIẾN TRƯỜNG & SƯƠNG MÙ (FOG OF WAR) */}
      <div className="antaris-battlefield-fog" />

      {/* 4. CANVAS PHÙ HIỆU MA THUẬT & TÀN LỬA TÀ THẦN */}
      <canvas ref={canvasRef} className="arena-bg-canvas" />
    </div>
  );
}
