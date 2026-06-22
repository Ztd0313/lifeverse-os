'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 共识度仪表盘 Props
 */
export interface ConsensusMeterProps {
  /** 共识度 0-100 */
  value: number;
  /** 尺寸（SVG 宽高，单位 px） */
  size?: number;
  /** 标签 */
  label?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 数值滚动 Hook（CountUp 动画）
 *
 * @param target 目标值
 * @param duration 动画时长（ms）
 * @returns 当前显示值
 */
function useCountUp(target: number, duration: number = 1000): number {
  const [value, setValue] = useState(0);
  const previousRef = useRef(0);

  useEffect(() => {
    const start = previousRef.current;
    const delta = target - start;
    if (delta === 0) return;

    let rafId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + delta * eased);
      setValue(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        previousRef.current = target;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}

/**
 * 根据共识度值获取颜色
 *
 * 0=红色 → 50=金色 → 100=绿色
 */
function getValueColor(value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  if (clamped <= 50) {
    // 红 → 金
    const t = clamped / 50;
    const r = Math.round(232 + (201 - 232) * t);
    const g = Math.round(93 + (168 - 93) * t);
    const b = Math.round(93 + (76 - 93) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  // 金 → 绿
  const t = (clamped - 50) / 50;
  const r = Math.round(201 + (93 - 201) * t);
  const g = Math.round(168 + (232 - 168) * t);
  const b = Math.round(76 + (160 - 76) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 根据共识度值获取等级标签
 */
function getValueLabel(value: number): string {
  if (value >= 80) return '高度共识';
  if (value >= 60) return '基本一致';
  if (value >= 40) return '尚有分歧';
  if (value >= 20) return '明显分歧';
  return '严重对立';
}

/**
 * 极坐标转笛卡尔坐标
 *
 * 半圆仪表盘从 180°（左）到 0°（右），即左→右扫描。
 * @param centerX 中心 X
 * @param centerY 中心 Y
 * @param radius 半径
 * @param angleDeg 角度（度），180=左，0=右
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const radian = (angleDeg * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radian),
    y: centerY - radius * Math.sin(radian),
  };
}

/**
 * 描述圆弧路径
 *
 * @param centerX 中心 X
 * @param centerY 中心 Y
 * @param radius 半径
 * @param startAngle 起始角度（度）
 * @param endAngle 结束角度（度）
 */
function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  // 从 start 画到 end，sweep-flag=0 表示逆时针（在 SVG y 轴向下的坐标系中）
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

/**
 * 共识度仪表盘组件
 *
 * 半圆 SVG 仪表盘（180 度），展示当前议会的共识度。
 * - 背景弧为灰色，前景弧根据值填充
 * - 颜色渐变：0=红色 → 50=金色 → 100=绿色
 * - 中心显示数值（CountUp 动画）
 * - 指针动画（Framer Motion rotate）
 * - 底部显示标签
 *
 * @example
 * ```tsx
 * <ConsensusMeter value={72} size={200} label="议会共识度" />
 * ```
 */
export function ConsensusMeter({
  value,
  size = 200,
  label,
  className,
}: ConsensusMeterProps) {
  // 钳制到 0-100
  const clampedValue = Math.max(0, Math.min(100, value));
  const displayValue = useCountUp(clampedValue, 1000);
  const color = getValueColor(displayValue);
  const autoLabel = getValueLabel(displayValue);
  const finalLabel = label ?? autoLabel;

  // SVG 几何参数
  const strokeWidth = Math.max(8, size * 0.06);
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  // 半圆从 180°（左）扫到 0°（右）
  const arcStartAngle = 0;
  const arcEndAngle = 180;

  // 前景弧的结束角度（根据 value 比例）
  const valueAngle = arcStartAngle + (clampedValue / 100) * (arcEndAngle - arcStartAngle);

  // 背景弧路径
  const backgroundArc = describeArc(centerX, centerY, radius, arcStartAngle, arcEndAngle);
  // 前景弧路径（从 0° 到 valueAngle）
  const foregroundArc = describeArc(centerX, centerY, radius, arcStartAngle, valueAngle);

  // 指针角度：value=0 时指针指向左（180°），value=100 时指向右（0°）
  // SVG 中 rotate 正值为顺时针。指针默认竖直向上时为 0°。
  // value=0 → 指针指向左 → 需要逆时针旋转 90° → rotate(-90)
  // value=100 → 指针指向右 → 需要顺时针旋转 90° → rotate(90)
  // value=50 → 指针向上 → rotate(0)
  const pointerRotation = (clampedValue / 100) * 180 - 90;

  // 指针长度
  const pointerLength = radius - strokeWidth * 1.2;

  // 数值文字尺寸
  const valueFontSize = size * 0.22;

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      role="meter"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`共识度 ${clampedValue}，${finalLabel}`}
    >
      <div className="relative" style={{ width: size, height: size / 2 + strokeWidth }}>
        <svg
          width={size}
          height={size / 2 + strokeWidth}
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
          className="overflow-visible"
        >
          {/* 渐变定义 */}
          <defs>
            <linearGradient id="consensus-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e85d5d" />
              <stop offset="50%" stopColor="#c9a84c" />
              <stop offset="100%" stopColor="#5de8a0" />
            </linearGradient>
            <filter id="consensus-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 背景弧 */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="var(--bg-soft)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* 前景弧（渐变填充） */}
          <motion.path
            d={foregroundArc}
            fill="none"
            stroke="url(#consensus-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#consensus-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 1, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.3 },
            }}
          />

          {/* 刻度线 */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 180;
            const inner = polarToCartesian(centerX, centerY, radius - strokeWidth / 2 - 2, angle);
            const outer = polarToCartesian(centerX, centerY, radius + strokeWidth / 2 + 2, angle);
            const isMajor = tick % 50 === 0;
            return (
              <g key={tick}>
                <line
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={isMajor ? 'var(--text-dim)' : 'var(--border)'}
                  strokeWidth={isMajor ? 1.5 : 1}
                />
                {isMajor && (
                  <text
                    x={polarToCartesian(centerX, centerY, radius + strokeWidth / 2 + 12, angle).x}
                    y={polarToCartesian(centerX, centerY, radius + strokeWidth / 2 + 12, angle).y}
                    fill="var(--text-dim)"
                    fontSize={size * 0.05}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {tick}
                  </text>
                )}
              </g>
            );
          })}

          {/* 指针 */}
          <motion.g
            style={{
              transformOrigin: `${centerX}px ${centerY}px`,
              transformBox: 'view-box',
            }}
            initial={{ rotate: -90 }}
            animate={{ rotate: pointerRotation }}
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 18,
              duration: 1,
            }}
          >
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX + pointerLength}
              y2={centerY}
              stroke={color}
              strokeWidth={Math.max(2, strokeWidth * 0.25)}
              strokeLinecap="round"
              filter="url(#consensus-glow)"
            />
            {/* 指针尖端小圆 */}
            <circle
              cx={centerX + pointerLength}
              cy={centerY}
              r={Math.max(2, strokeWidth * 0.18)}
              fill={color}
            />
          </motion.g>

          {/* 中心轴 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.max(3, strokeWidth * 0.35)}
            fill="var(--bg-card)"
            stroke={color}
            strokeWidth={2}
          />
        </svg>

        {/* 中心数值（CountUp） */}
        <div
          className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 -translate-y-[60%] flex flex-col items-center"
          style={{ width: size * 0.6 }}
        >
          <motion.div
            className="flex items-baseline gap-0.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span
              className="font-bold tabular-nums leading-none"
              style={{
                fontSize: valueFontSize,
                color,
                textShadow: `0 0 16px ${color}40`,
              }}
            >
              {displayValue}
            </span>
            <span
              className="font-medium text-text-dim"
              style={{ fontSize: valueFontSize * 0.4 }}
            >
              /100
            </span>
          </motion.div>
        </div>
      </div>

      {/* 底部标签 */}
      <motion.div
        className="mt-2 flex flex-col items-center gap-1"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <span
          className="rounded-full px-3 py-0.5 text-xs font-medium"
          style={{
            color,
            backgroundColor: `${color}1a`,
            border: `1px solid ${color}40`,
          }}
        >
          {autoLabel}
        </span>
        {label && (
          <span className="text-[11px] text-text-dim tracking-wide">{label}</span>
        )}
      </motion.div>
    </div>
  );
}

export default ConsensusMeter;
