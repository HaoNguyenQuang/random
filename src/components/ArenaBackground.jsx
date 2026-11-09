import React, { useEffect, useRef } from 'react';

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

    // 3D Camera & Parallax State
    const camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      fov: 420
    };

    const isMobile = width < 768;
    const STAR_COUNT = isMobile ? 120 : 260;
    const MAX_DEPTH = 1600;

    // Palette: Gold, Cyan, Neon Pink, Deep Blue
    const STAR_COLORS = [
      { r: 245, g: 186, b: 49 },  // Caesar Gold
      { r: 0, g: 240, b: 255 },    // Neon Cyan
      { r: 255, g: 215, b: 0 },    // Pure Gold
      { r: 255, g: 42, b: 109 },   // Cyber Pink
      { r: 168, g: 85, b: 247 }    // Arcane Purple
    ];

    // 1. 3D STARS IN SPACE
    class Star3D {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = (Math.random() - 0.5) * width * 2.8;
        this.y = (Math.random() - 0.5) * height * 2.8;
        this.z = initial ? Math.random() * MAX_DEPTH : MAX_DEPTH;
        this.pz = this.z; // Previous z for warp streaks
        this.speed = 1.8 + Math.random() * 3.2;
        this.size = 1.2 + Math.random() * 2.2;
        this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      }

      update() {
        this.pz = this.z;
        this.z -= this.speed;

        if (this.z <= 10) {
          this.reset(false);
          this.pz = this.z;
        }
      }

      draw() {
        const factor = camera.fov / this.z;
        const prevFactor = camera.fov / this.pz;

        // Perspective projection with camera tilt
        const sx = (this.x - camera.x) * factor + width / 2;
        const sy = (this.y - camera.y) * factor + height / 2;

        const psx = (this.x - camera.x) * prevFactor + width / 2;
        const psy = (this.y - camera.y) * prevFactor + height / 2;

        if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) return;

        const depthRatio = 1 - this.z / MAX_DEPTH;
        const radius = Math.max(0.6, this.size * factor);
        const alpha = Math.min(1, depthRatio * 1.3);

        ctx.save();
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.7})`;
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        ctx.lineWidth = radius * 1.2;

        // Draw 3D warp trail
        ctx.beginPath();
        ctx.moveTo(psx, psy);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        // Star head glow
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.9)`;
        ctx.shadowBlur = radius * 3.5;
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. FLOATING 3D WIREFRAME POLYHEDRA (CYBER GEMS / DIAMONDS)
    class CyberGem3D {
      constructor(index) {
        this.index = index;
        this.x = (index % 2 === 0 ? -1 : 1) * (width * 0.38 + Math.random() * 120);
        this.y = (Math.random() - 0.5) * height * 0.8;
        this.z = 400 + Math.random() * 600;
        this.rotX = Math.random() * Math.PI;
        this.rotY = Math.random() * Math.PI;
        this.rotSpeedX = 0.008 + Math.random() * 0.01;
        this.rotSpeedY = 0.012 + Math.random() * 0.012;
        this.scale = 36 + Math.random() * 24;
        this.color = index % 2 === 0 ? 'rgba(0, 240, 255,' : 'rgba(245, 186, 49,';

        // 3D Octahedron vertices
        this.vertices = [
          [0, -1, 0],
          [1, 0, 0],
          [0, 0, 1],
          [-1, 0, 0],
          [0, 0, -1],
          [0, 1, 0]
        ];

        // Wireframe edges
        this.edges = [
          [0, 1], [0, 2], [0, 3], [0, 4], // top pyramid
          [5, 1], [5, 2], [5, 3], [5, 4], // bottom pyramid
          [1, 2], [2, 3], [3, 4], [4, 1]  // equator
        ];
      }

      update() {
        this.rotX += this.rotSpeedX;
        this.rotY += this.rotSpeedY;
        this.y += Math.sin(Date.now() * 0.0015 + this.index) * 0.4;
      }

      draw() {
        const factor = camera.fov / this.z;
        const centerX = (this.x - camera.x * 0.5) * factor + width / 2;
        const centerY = (this.y - camera.y * 0.5) * factor + height / 2;

        const rotated = this.vertices.map(([vx, vy, vz]) => {
          // Rotate around X
          let y1 = vy * Math.cos(this.rotX) - vz * Math.sin(this.rotX);
          let z1 = vy * Math.sin(this.rotX) + vz * Math.cos(this.rotX);

          // Rotate around Y
          let x2 = vx * Math.cos(this.rotY) + z1 * Math.sin(this.rotY);
          let z2 = -vx * Math.sin(this.rotY) + z1 * Math.cos(this.rotY);

          return [
            centerX + x2 * this.scale * factor,
            centerY + y1 * this.scale * factor
          ];
        });

        ctx.save();
        ctx.strokeStyle = `${this.color} 0.55)`;
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `${this.color} 0.8)`;

        this.edges.forEach(([i1, i2]) => {
          ctx.beginPath();
          ctx.moveTo(rotated[i1][0], rotated[i1][1]);
          ctx.lineTo(rotated[i2][0], rotated[i2][1]);
          ctx.stroke();
        });

        // Glowing center core
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color} 0.9)`;
        ctx.fill();
        ctx.restore();
      }
    }

    // 3. PERSPECTIVE 3D CYBER HORIZON GRID (ĐẤU TRƯỜNG VÔ CỰC)
    let gridOffset = 0;
    const draw3DHorizonGrid = () => {
      gridOffset = (gridOffset + 0.8) % 40;
      const horizonY = height * 0.62;
      const fovY = height * 0.38;

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.09)';
      ctx.lineWidth = 1;

      // Perspective vanishing lines
      const gridCols = isMobile ? 12 : 24;
      const spread = width * 1.6;
      for (let i = -gridCols; i <= gridCols; i++) {
        const xBottom = width / 2 + (i / gridCols) * spread - camera.x * 0.3;
        ctx.beginPath();
        ctx.moveTo(width / 2 - camera.x * 0.1, horizonY);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
      }

      // Horizontal depth lines (converging exponentially toward horizon)
      const rows = 14;
      for (let r = 1; r <= rows; r++) {
        const depth = ((r * 28 + gridOffset) % (rows * 28)) / (rows * 28);
        const y = horizonY + Math.pow(depth, 2.2) * fovY;
        const alpha = Math.pow(depth, 1.8) * 0.18;
        ctx.strokeStyle = `rgba(245, 186, 49, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Horizon glow line
      const grad = ctx.createLinearGradient(0, horizonY - 1, 0, horizonY + 20);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, horizonY, width, 25);

      ctx.restore();
    };

    // Instantiate objects
    const stars = Array.from({ length: STAR_COUNT }, () => new Star3D());
    const gems = Array.from({ length: isMobile ? 2 : 4 }, (_, idx) => new CyberGem3D(idx));

    // Mouse Parallax Listeners
    const handleMouseMove = (e) => {
      camera.targetX = (e.clientX - width / 2) * 0.45;
      camera.targetY = (e.clientY - height / 2) * 0.35;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Main 60-120fps Render Loop
    const render = () => {
      // Smooth camera interpolation (Eased 3D Parallax)
      camera.x += (camera.targetX - camera.x) * 0.05;
      camera.y += (camera.targetY - camera.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw 3D Stars
      for (let i = 0; i < stars.length; i++) {
        stars[i].update();
        stars[i].draw();
      }

      // 2. Draw 3D Horizon Grid
      draw3DHorizonGrid();

      // 3. Draw 3D Cyber Gems
      for (let i = 0; i < gems.length; i++) {
        gems[i].update();
        gems[i].draw();
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
    <div className="arena-bg-wrapper" aria-hidden="true">
      {/* 1. DEEP SPACE NEBULA RADIAL GLOWS */}
      <div className="arena-ambient-spotlight arena-spotlight-top" />
      <div className="arena-ambient-spotlight arena-spotlight-bottom" />

      {/* 2. 3D HARDWARE-ACCELERATED CYBER CANVAS */}
      <canvas ref={canvasRef} className="arena-bg-canvas" />
    </div>
  );
}
