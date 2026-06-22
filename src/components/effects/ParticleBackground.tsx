'use client';

import { useEffect, useRef } from 'react';

/**
 * 粒子数据结构
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  /** 基础透明度，用于闪烁效果 */
  baseAlpha: number;
  /** 当前透明度 */
  alpha: number;
  /** 闪烁相位 */
  phase: number;
  /** 闪烁速度 */
  twinkleSpeed: number;
}

/**
 * 粒子背景组件配置
 */
interface ParticleBackgroundConfig {
  /** 粒子最大数量上限 */
  maxCount: number;
  /** 连线最大距离（px） */
  maxConnectDistance: number;
  /** 粒子最小半径 */
  minRadius: number;
  /** 粒子最大半径 */
  maxRadius: number;
  /** 粒子最小速度 */
  minSpeed: number;
  /** 粒子最大速度 */
  maxSpeed: number;
  /** 粒子颜色 */
  particleColor: string;
  /** 连线颜色 */
  lineColor: string;
  /** 连线最大透明度 */
  lineMaxOpacity: number;
}

const DEFAULT_CONFIG: ParticleBackgroundConfig = {
  maxCount: 70,
  maxConnectDistance: 125,
  minRadius: 0.8,
  maxRadius: 2.4,
  minSpeed: 0.15,
  maxSpeed: 0.55,
  particleColor: '#c9a84c',
  lineColor: '201, 168, 76',
  lineMaxOpacity: 0.22,
};

/**
 * 根据屏幕尺寸自适应计算粒子数量
 */
function getAdaptiveCount(maxCount: number): number {
  if (typeof window === 'undefined') return maxCount;
  const area = window.innerWidth * window.innerHeight;
  // 基础密度：每 22000 像素一个粒子
  const baseCount = Math.floor(area / 22000);
  const isMobile = window.innerWidth < 768;
  const adjusted = isMobile ? baseCount * 0.6 : baseCount;
  return Math.max(20, Math.min(adjusted, maxCount));
}

/**
 * 全屏金色粒子背景组件（Canvas 实现）
 *
 * 特性：
 * - 金色粒子 + 连线网络
 * - 粒子数量自适应屏幕大小（最多 70 个）
 * - 粒子微弱闪烁效果（twinkle）
 * - 粒子之间距离小于 125px 时绘制连线
 * - 使用 requestAnimationFrame 性能优化
 * - 页面不可见时自动暂停渲染
 * - 尊重 prefers-reduced-motion
 *
 * 定位：fixed 全屏，z-index: 0，pointer-events: none
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const configRef = useRef<ParticleBackgroundConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = configRef.current;

    // 尊重 prefers-reduced-motion：启用时仅绘制静态稀疏粒子
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** 创建单个粒子 */
    const createParticle = (): Particle => {
      const width = canvas.width;
      const height = canvas.height;
      const speedRange = config.maxSpeed - config.minSpeed;
      const radiusRange = config.maxRadius - config.minRadius;
      const baseAlpha = 0.25 + Math.random() * 0.5;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speedRange * 2,
        vy: (Math.random() - 0.5) * speedRange * 2,
        radius: config.minRadius + Math.random() * radiusRange,
        baseAlpha,
        alpha: baseAlpha,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.025,
      };
    };

    /** 初始化粒子数组 */
    const initParticles = () => {
      const count = prefersReducedMotion
        ? Math.min(15, getAdaptiveCount(config.maxCount))
        : getAdaptiveCount(config.maxCount);
      particlesRef.current = Array.from({ length: count }, createParticle);
    };

    /** 调整画布尺寸（考虑 DPR） */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    /** 更新粒子位置与闪烁状态 */
    const updateParticles = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // 边界反弹
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // 限制在画布内
        if (p.x < 0) p.x = 0;
        if (p.x > width) p.x = width;
        if (p.y < 0) p.y = 0;
        if (p.y > height) p.y = height;

        // 闪烁效果（twinkle）
        p.phase += p.twinkleSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.phase) * 0.25;
      }
    };

    /** 绘制粒子之间的连线 */
    const drawConnections = () => {
      const particles = particlesRef.current;
      const maxDist = config.maxConnectDistance;
      const maxDistSq = maxDist * maxDist;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const opacity =
              (1 - dist / maxDist) * config.lineMaxOpacity;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${config.lineColor}, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    /** 绘制所有粒子（含光晕） */
    const drawParticles = () => {
      const particles = particlesRef.current;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // 先绘制连线（在粒子之下）
      drawConnections();

      // 绘制粒子
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const safeAlpha = Math.max(0, Math.min(1, p.alpha));

        // 光晕（径向渐变）
        const glowRadius = Math.max(p.radius * 3, 0.5);
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowRadius
        );
        gradient.addColorStop(0, `rgba(${config.lineColor}, ${safeAlpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${config.lineColor}, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 粒子核心
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.radius, 0.3), 0, Math.PI * 2);
        ctx.fillStyle = config.particleColor;
        ctx.globalAlpha = safeAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    /** 主动画循环 */
    const animate = () => {
      updateParticles();
      drawParticles();
      animationIdRef.current = requestAnimationFrame(animate);
    };

    /** 静态渲染（reduced-motion 模式） */
    const renderStatic = () => {
      drawParticles();
    };

    /** 窗口尺寸变化处理 */
    const handleResize = () => {
      resize();
      initParticles();
      if (prefersReducedMotion) {
        renderStatic();
      }
    };

    /** 页面可见性变化：不可见时暂停 */
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationIdRef.current !== null) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
      } else {
        if (animationIdRef.current === null && !prefersReducedMotion) {
          animate();
        }
      }
    };

    // 初始化
    resize();
    initParticles();

    if (prefersReducedMotion) {
      renderStatic();
    } else {
      animate();
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

export default ParticleBackground;
