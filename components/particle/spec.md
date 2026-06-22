# Particle 粒子背景组件规格说明

> 组件路径：`components/particle/`
> 负责人：David Kim（技术总监）、Maya Guo（动效总监）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 用途

粒子背景组件为 LifeVerse 全局提供沉浸式的动态背景效果，采用 Canvas 实现金色粒子漂浮与连线网络。组件作为全局视觉基底，覆盖所有页面的背景层，营造「生命宇宙」的氛围感。组件内置性能自适应机制，根据设备性能动态调整粒子数量，确保流畅体验。

典型使用场景：
- 全局 Layout 背景层（所有页面）
- 议会大厅仪式动画背景
- 命运报告生成时的粒子汇聚效果
- 首页 Hero 区域的粒子动效

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * 粒子背景组件 Props
 */
export interface ParticleProps {
  /** 粒子配色方案 */
  colorScheme?: ParticleColorScheme;
  /** 粒子数量，不传则自适应 */
  particleCount?: number;
  /** 是否启用粒子连线 */
  connectLines?: boolean;
  /** 连线最大距离，单位 px，默认 120 */
  maxConnectDistance?: number;
  /** 粒子最小半径，默认 1 */
  minRadius?: number;
  /** 粒子最大半径，默认 3 */
  maxRadius?: number;
  /** 粒子最小速度，默认 0.2 */
  minSpeed?: number;
  /** 粒子最大速度，默认 0.6 */
  maxSpeed?: number;
  /** 是否启用鼠标交互 */
  mouseInteractive?: boolean;
  /** 鼠标交互半径，单位 px，默认 150 */
  mouseRadius?: number;
  /** 是否启用性能自适应 */
  adaptive?: boolean;
  /** 目标帧率，默认 60 */
  targetFPS?: number;
  /** 背景模式 */
  mode?: ParticleMode;
  /** 粒子运动模式 */
  motion?: ParticleMotion;
  /** 透明度 0-1 */
  opacity?: number;
  /** 是否暂停动画 */
  paused?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 粒子配色方案
 */
export interface ParticleColorScheme {
  /** 粒子颜色数组（随机选取） */
  particles: string[];
  /** 连线颜色 */
  line: string;
  /** 连线透明度 0-1 */
  lineOpacity: number;
  /** 背景渐变（可选） */
  background?: string;
}

/**
 * 粒子背景模式
 */
export type ParticleMode =
  | 'ambient'    // 环境模式（默认，轻柔漂浮）
  | 'ritual'     // 仪式模式（粒子汇聚）
  | 'celebrate'  // 庆祝模式（粒子爆发）
  | 'conflict'   // 冲突模式（粒子震荡）
  | 'minimal';   // 极简模式（仅少量粒子）

/**
 * 粒子运动模式
 */
export type ParticleMotion =
  | 'float'      // 自由漂浮
  | 'attract'    // 向中心吸引
  | 'repel'      // 从中心排斥
  | 'flow'       // 方向性流动
  | 'orbit';     // 环绕轨道
```

---

## 3. 默认配色方案

### 3.1 标准配色（金色粒子 + 连线）

```typescript
const defaultColorScheme: ParticleColorScheme = {
  particles: [
    '#FFD700', // 金色
    '#FFC107', // 琥珀色
    '#FFE082', // 浅金色
    '#F59E0B', // 暗金色
  ],
  line: '#FFD700',
  lineOpacity: 0.15,
  background: 'radial-gradient(ellipse at center, #0A0A1A 0%, #000000 100%)',
};
```

### 3.2 模式配色

| 模式 | 粒子颜色 | 连线颜色 | 说明 |
|------|----------|----------|------|
| ambient | 金色系 | 金色 0.15 | 默认温暖氛围 |
| ritual | 白金色 | 白色 0.3 | 仪式庄重感 |
| celebrate | 多彩 | 金色 0.25 | 庆祝爆发感 |
| conflict | 红橙色 | 红色 0.2 | 冲突紧张感 |
| minimal | 浅金色 | 无连线 | 极简安静 |

---

## 4. Canvas 实现方案

### 4.1 粒子数据结构

```typescript
interface Particle {
  /** 当前 x 坐标 */
  x: number;
  /** 当前 y 坐标 */
  y: number;
  /** x 方向速度 */
  vx: number;
  /** y 方向速度 */
  vy: number;
  /** 半径 */
  radius: number;
  /** 颜色 */
  color: string;
  /** 透明度 */
  alpha: number;
  /** 原始透明度（用于呼吸效果） */
  baseAlpha: number;
  /** 呼吸相位 */
  phase: number;
}
```

### 4.2 核心渲染循环

```typescript
class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private mouse: { x: number; y: number } = { x: -1000, y: -1000 };
  private config: Required<ParticleProps>;

  constructor(canvas: HTMLCanvasElement, config: ParticleProps) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = { ...defaultConfig, ...config };
    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }

  /** 初始化粒子 */
  private initParticles() {
    const count = this.config.adaptive
      ? this.getAdaptiveCount()
      : this.config.particleCount;
    this.particles = Array.from({ length: count }, () => this.createParticle());
  }

  /** 根据设备性能自适应粒子数量 */
  private getAdaptiveCount(): number {
    const area = this.canvas.width * this.canvas.height;
    const baseCount = Math.floor(area / 12000); // 基础密度
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = window.innerWidth < 768;
    // 移动端减半，CPU 核心数加权
    const adjusted = isMobile
      ? baseCount * 0.4
      : baseCount * Math.min(cores / 4, 1.5);
    return Math.floor(Math.max(30, Math.min(adjusted, 200)));
  }

  /** 创建单个粒子 */
  private createParticle(): Particle {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * (this.config.maxSpeed - this.config.minSpeed) * 2,
      vy: (Math.random() - 0.5) * (this.config.maxSpeed - this.config.minSpeed) * 2,
      radius: this.config.minRadius + Math.random() * (this.config.maxRadius - this.config.minRadius),
      color: this.config.colorScheme.particles[
        Math.floor(Math.random() * this.config.colorScheme.particles.length)
      ],
      alpha: 0.3 + Math.random() * 0.5,
      baseAlpha: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    };
  }

  /** 更新粒子位置 */
  private updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // 边界反弹
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      // 鼠标交互（排斥效果）
      if (this.config.mouseInteractive) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.config.mouseRadius) {
          const force = (this.config.mouseRadius - dist) / this.config.mouseRadius;
          p.x += (dx / dist) * force * 2;
          p.y += (dy / dist) * force * 2;
        }
      }

      // 呼吸效果
      p.phase += 0.02;
      p.alpha = p.baseAlpha + Math.sin(p.phase) * 0.2;
    }
  }

  /** 绘制粒子 */
  private drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制连线
    if (this.config.connectLines) {
      this.drawConnections();
    }

    // 绘制粒子
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fill();

      // 光晕效果
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.globalAlpha = p.alpha * 0.3;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  /** 绘制粒子间连线 */
  private drawConnections() {
    const maxDist = this.config.maxConnectDistance;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * this.config.colorScheme.lineOpacity;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = this.config.colorScheme.line;
          this.ctx.globalAlpha = opacity;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
    this.ctx.globalAlpha = 1;
  }

  /** 主动画循环 */
  private animate = () => {
    if (!this.config.paused) {
      this.updateParticles();
      this.drawParticles();
    }
    this.animationId = requestAnimationFrame(this.animate);
  };

  /** 画布尺寸调整 */
  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.ctx.scale(dpr, dpr);
  }

  /** 绑定事件 */
  private bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.initParticles();
    });
    if (this.config.mouseInteractive) {
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });
    }
  }

  /** 销毁 */
  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resize);
  }
}
```

---

## 5. 性能优化

### 5.1 粒子数量自适应

| 设备类型 | 屏幕宽度 | 粒子数量 | 连线 |
|----------|----------|----------|------|
| 低端移动 | < 400px | 30-50 | 关闭 |
| 普通移动 | 400-768px | 50-80 | 关闭 |
| 平板 | 768-1024px | 80-120 | 开启 |
| 桌面 | 1024-1440px | 120-160 | 开启 |
| 高端桌面 | > 1440px | 160-200 | 开启 |

自适应依据：
- `navigator.hardwareConcurrency`：CPU 核心数
- `window.innerWidth`：屏幕宽度
- `navigator.deviceMemory`：设备内存（如可用）
- 首帧渲染时间：超过 50ms 则降级

### 5.2 渲染优化
- 使用 `requestAnimationFrame` 而非 `setInterval`
- 连线计算使用空间分区（网格法）降低 O(n²) 复杂度
- 离屏粒子不参与连线计算
- DPR 适配：高 DPI 屏幕清晰渲染，但限制最大 DPR 为 2

### 5.3 空间分区优化

```typescript
/** 网格空间分区，加速连线计算 */
class SpatialGrid {
  private grid: Map<string, Particle[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  insert(particle: Particle) {
    const key = this.getKey(particle.x, particle.y);
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key)!.push(particle);
  }

  getNearby(particle: Particle, radius: number): Particle[] {
    const result: Particle[] = [];
    const cellRange = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(particle.x / this.cellSize);
    const cy = Math.floor(particle.y / this.cellSize);
    for (let dx = -cellRange; dx <= cellRange; dx++) {
      for (let dy = -cellRange; dy <= cellRange; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const cell = this.grid.get(key);
        if (cell) result.push(...cell);
      }
    }
    return result;
  }
}
```

### 5.4 可见性优化
- 使用 `document.hidden` 检测页面是否可见，不可见时暂停渲染
- 使用 `IntersectionObserver` 检测组件是否在视口内
- 暂停时释放 `requestAnimationFrame`，恢复时重新启动

---

## 6. 模式切换

### 6.1 ambient（环境模式）
- 粒子自由漂浮，速度缓慢
- 连线柔和显示
- 适合日常页面背景

### 6.2 ritual（仪式模式）
- 粒子从四周向中心汇聚
- 汇聚后形成光柱
- 适合议会启动仪式

### 6.3 celebrate（庆祝模式）
- 粒子从中心向外爆发
- 多彩粒子混合
- 适合报告生成完成

### 6.4 conflict（冲突模式）
- 粒子分为两群，相互震荡
- 红色调为主
- 适合议会冲突可视化

### 6.5 minimal（极简模式）
- 仅 20-30 个粒子
- 无连线
- 适合内容密集页面，减少干扰

---

## 7. React 封装

```typescript
import { useEffect, useRef } from 'react';

export function ParticleBackground(props: ParticleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<ParticleSystem | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    systemRef.current = new ParticleSystem(canvasRef.current, props);
    return () => systemRef.current?.destroy();
  }, []);

  useEffect(() => {
    // 模式或配置变化时更新
    systemRef.current?.updateConfig(props);
  }, [props.mode, props.paused, props.colorScheme]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 pointer-events-none ${props.className ?? ''}`}
      aria-hidden="true"
    />
  );
}
```

---

## 8. 响应式设计

- Canvas 始终全屏覆盖（`fixed inset-0`）
- `pointer-events: none`，不阻挡上层交互
- `z-index: -10`，位于所有内容之下
- 窗口 resize 时重新计算粒子分布
- 移动端自动降级粒子数量和关闭连线

---

## 9. 依赖关系

- 无外部依赖，纯 Canvas API
- 无内部依赖，为叶子组件
- 兼容 SSR（服务端渲染时不初始化 Canvas）

---

## 10. 无障碍设计

- Canvas 设置 `aria-hidden="true"`，屏幕阅读器忽略
- 纯装饰性，不承载任何信息
- 提供 `prefers-reduced-motion` 支持：用户启用减少动效时，粒子静止或极慢移动

```typescript
// 检测用户是否启用了减少动效
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
```

---

## 11. 验收标准

- [ ] Canvas 全屏覆盖，无白边
- [ ] 粒子金色漂浮效果符合设计稿
- [ ] 连线网络在距离阈值内正确显示
- [ ] 鼠标交互排斥效果正常
- [ ] 粒子数量根据设备性能自适应
- [ ] 页面不可见时暂停渲染
- [ ] 5 种模式切换正确
- [ ] 60FPS 下无明显卡顿（桌面端）
- [ ] 30FPS 以上（移动端）
- [ ] `prefers-reduced-motion` 时降级
- [ ] SSR 环境下不报错
