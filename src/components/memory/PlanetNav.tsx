'use client';

import { motion } from 'framer-motion';
import { TreePine, Waves, Home, Building2, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, cardItem } from '@/lib/motion/variants';
import { PLANETS } from '@/lib/mock-memories';
import type { MemoryCategory, MemoryItem } from '@/types';

/**
 * 星球图标映射
 *
 * 将 PlanetMeta.icon 字符串映射到实际的 lucide-react 图标组件。
 */
const PLANET_ICONS: Record<
  (typeof PLANETS)[number]['icon'],
  typeof TreePine
> = {
  TreePine,
  Waves,
  Home,
  Building2,
  Mountain,
};

/**
 * PlanetNav 组件 Props
 */
export interface PlanetNavProps {
  /** 当前选中的星球 */
  selectedPlanet: MemoryCategory;
  /** 切换星球回调 */
  onSelectPlanet: (planet: MemoryCategory) => void;
  /** 全部记忆列表（用于统计每个星球的记忆数量） */
  memories: MemoryItem[];
}

/**
 * 星球导航组件
 *
 * 5 个星球按钮水平排列，每个星球显示：
 * - 图标
 * - 名称
 * - 该星球上的记忆数量
 *
 * 当前选中的星球高亮（金色边框 + 金色光晕）。
 * 点击切换星球。
 */
export function PlanetNav({
  selectedPlanet,
  onSelectPlanet,
  memories,
}: PlanetNavProps) {
  /** 统计某个星球上的记忆数量 */
  const getCount = (planetId: MemoryCategory): number =>
    memories.filter((m) => m.category === planetId).length;

  return (
    <motion.nav
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      aria-label="记忆星球导航"
      className="flex w-full flex-wrap items-stretch justify-center gap-3 sm:gap-4"
    >
      {PLANETS.map((planet) => {
        const Icon = PLANET_ICONS[planet.icon];
        const isActive = selectedPlanet === planet.id;
        const count = getCount(planet.id);

        return (
          <motion.button
            key={planet.id}
            variants={cardItem}
            type="button"
            onClick={() => onSelectPlanet(planet.id)}
            aria-pressed={isActive}
            aria-label={`${planet.name} ${planet.nameEn}，共 ${count} 条记忆`}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'group relative flex w-[140px] flex-col items-center gap-2 rounded-[14px] border p-4 transition-all duration-300 sm:w-[160px]',
              isActive
                ? 'border-gold bg-gold-soft/30 shadow-[0_0_28px_var(--shadow-gold)]'
                : 'border-border bg-bg-card/60 hover:border-gold-dim'
            )}
          >
            {/* 图标 */}
            <span
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300',
                isActive
                  ? 'bg-gold-soft'
                  : 'bg-bg-soft group-hover:bg-gold-soft/50'
              )}
              style={{
                color: isActive ? planet.color : undefined,
              }}
            >
              <Icon
                size={24}
                style={!isActive ? { color: planet.color } : undefined}
              />
            </span>

            {/* 名称 */}
            <span
              className={cn(
                'text-sm font-medium transition-colors',
                isActive ? 'text-gold' : 'text-text'
              )}
            >
              {planet.name}
            </span>

            {/* 英文名 + 描述 */}
            <span className="text-[10px] text-text-dim">
              {planet.nameEn}
            </span>

            {/* 记忆数量 */}
            <span
              className={cn(
                'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'bg-gold text-bg'
                  : 'bg-bg-soft text-text-soft'
              )}
            >
              {count} 条记忆
            </span>

            {/* 选中态底部光带 */}
            {isActive && (
              <motion.span
                layoutId="planet-active-bar"
                className="absolute -bottom-px left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-gold"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default PlanetNav;
