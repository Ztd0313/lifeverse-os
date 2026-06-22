import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate session number label (第N次命运议会)
 */
export function formatSessionNumber(n: number): string {
  return `第 ${n} 次命运议会`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

/**
 * Calculate conflict level from value (0-100)
 */
export function getConflictLevel(value: number): {
  label: string;
  color: string;
} {
  if (value >= 80) return { label: '激烈冲突', color: '#e85d5d' };
  if (value >= 60) return { label: '明显分歧', color: '#e8a05d' };
  if (value >= 40) return { label: '温和讨论', color: '#c9a84c' };
  return { label: '基本一致', color: '#5de8a0' };
}

/**
 * Radar chart data point generator
 */
export function radarPoint(
  value: number,
  angle: number,
  centerX: number,
  centerY: number,
  maxRadius: number
): { x: number; y: number } {
  const radius = (value / 100) * maxRadius;
  const radian = (angle - 90) * (Math.PI / 180);
  return {
    x: centerX + radius * Math.cos(radian),
    y: centerY + radius * Math.sin(radian),
  };
}

/**
 * Delay helper
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
