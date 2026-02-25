import { useRef, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
}

export function ParticlePlanet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      mouse.current.x = e.clientX / width;
      mouse.current.y = e.clientY / height;
    };
    window.addEventListener('mousemove', handleMouse);

    // Generate sphere points (Fibonacci sphere)
    const NUM_POINTS = 800;
    const points: Point[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < NUM_POINTS; i++) {
      const y = 1 - (i / (NUM_POINTS - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      points.push({ x, y, z, ox: x, oy: y, oz: z });
    }

    // Also add some orbital ring points
    const RING_POINTS = 160;
    for (let i = 0; i < RING_POINTS; i++) {
      const angle = (i / RING_POINTS) * Math.PI * 2;
      const x = Math.cos(angle) * 1.35;
      const z = Math.sin(angle) * 1.35;
      const y = Math.sin(angle * 2) * 0.05; // slight wobble
      points.push({ x, y, z, ox: x, oy: y, oz: z });
    }

    let time = 0;

    const rotateY = (p: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: p.x * cos + p.z * sin,
        y: p.y,
        z: -p.x * sin + p.z * cos,
      };
    };

    const rotateX = (p: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: p.x,
        y: p.y * cos - p.z * sin,
        z: p.y * sin + p.z * cos,
      };
    };

    const draw = () => {
      time += 0.003;
      ctx.clearRect(0, 0, width, height);

      const mx = (mouse.current.x - 0.5) * 0.4;
      const my = (mouse.current.y - 0.5) * 0.3;

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const r = Math.min(width, height) * 0.38;

      const sorted = points.map((p, i) => {
        // Auto-rotate + mouse influence
        let rotated = rotateY({ x: p.ox, y: p.oy, z: p.oz }, time + mx);
        rotated = rotateX(rotated, my + Math.sin(time) * 0.1);

        p.x = rotated.x;
        p.y = rotated.y;
        p.z = rotated.z;

        const scale = 1 / (1 - rotated.z * 0.3);
        const px = centerX + rotated.x * r * scale;
        const py = centerY + rotated.y * r * scale;
        const depth = (rotated.z + 1) / 2; // 0..1

        return { px, py, depth, isRing: i >= NUM_POINTS };
      });

      // Sort by depth (back to front)
      sorted.sort((a, b) => a.depth - b.depth);

      for (const p of sorted) {
        const alpha = 0.08 + p.depth * (p.isRing ? 0.35 : 0.55);
        const size = p.isRing
          ? 1.2 + p.depth * 1.3
          : 1.2 + p.depth * 3;

        if (p.isRing) {
          ctx.fillStyle = `rgba(225, 167, 44, ${alpha * 0.6})`;
        } else {
          // Mix orange and white based on depth
          const r = Math.round(225 - p.depth * 30);
          const g = Math.round(167 + p.depth * 50);
          const b = Math.round(44 + p.depth * 60);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        ctx.beginPath();
        ctx.arc(p.px, p.py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
