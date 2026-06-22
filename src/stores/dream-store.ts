/**
 * 梦想档案（Dream Archive）Zustand Store
 *
 * 管理用户的梦想列表、表单开关，状态持久化到 localStorage。
 * 支持添加、更新、删除梦想，以及更新梦想状态。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';

/**
 * 梦想类别
 */
export type DreamCategory =
  | 'childhood'
  | 'career'
  | 'life'
  | 'creative'
  | 'other';

/**
 * 梦想状态
 */
export type DreamStatus =
  | 'dreaming'
  | 'pursuing'
  | 'achieved'
  | 'abandoned';

/**
 * 梦想条目
 */
export interface DreamEntry {
  /** 唯一 ID */
  id: string;
  /** 梦想标题 */
  title: string;
  /** 梦想描述 */
  description: string;
  /** 梦想类别 */
  category: DreamCategory;
  /** 梦想状态 */
  status: DreamStatus;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
  /** 实现时间（ISO 字符串，状态为 achieved 时存在） */
  achievedAt?: string;
  /** 做这个梦想时的年龄（可选） */
  ageAtDream?: number;
}

interface DreamStore {
  // ===== State =====
  /** 全部梦想列表 */
  dreams: DreamEntry[];
  /** 添加/编辑梦想表单是否打开 */
  isFormOpen: boolean;
  /** 当前正在编辑的梦想（为 null 时为新建模式） */
  editingDream: DreamEntry | null;

  // ===== Actions =====
  /** 添加一条梦想 */
  addDream: (dream: Omit<DreamEntry, 'id' | 'createdAt'>) => void;
  /** 更新一条梦想 */
  updateDream: (id: string, updates: Partial<DreamEntry>) => void;
  /** 删除一条梦想 */
  deleteDream: (id: string) => void;
  /** 打开新建梦想表单 */
  openForm: () => void;
  /** 打开编辑梦想表单 */
  openEditForm: (dream: DreamEntry) => void;
  /** 关闭梦想表单 */
  closeForm: () => void;
}

export const useDreamStore = create<DreamStore>()(
  persist(
    (set) => ({
      // ===== Initial State =====
      dreams: [],
      isFormOpen: false,
      editingDream: null,

      // ===== Actions =====
      /** 添加一条梦想 */
      addDream: (dream) => {
        const newDream: DreamEntry = {
          ...dream,
          id: generateId(),
          createdAt: new Date().toISOString(),
          // 如果状态为 achieved，自动填充 achievedAt
          achievedAt:
            dream.status === 'achieved'
              ? new Date().toISOString()
              : undefined,
        };
        set((s) => ({
          dreams: [newDream, ...s.dreams],
          isFormOpen: false,
          editingDream: null,
        }));
      },

      /** 更新一条梦想 */
      updateDream: (id, updates) => {
        set((s) => ({
          dreams: s.dreams.map((d) => {
            if (d.id !== id) return d;
            const next: DreamEntry = { ...d, ...updates };
            // 状态切换为 achieved 时，若未提供 achievedAt 则自动填充
            if (
              updates.status === 'achieved' &&
              !updates.achievedAt &&
              !d.achievedAt
            ) {
              next.achievedAt = new Date().toISOString();
            }
            // 状态从 achieved 切换为其他时，清除 achievedAt
            if (
              updates.status &&
              updates.status !== 'achieved' &&
              !updates.achievedAt
            ) {
              next.achievedAt = undefined;
            }
            return next;
          }),
          isFormOpen: false,
          editingDream: null,
        }));
      },

      /** 删除一条梦想 */
      deleteDream: (id) => {
        set((s) => ({
          dreams: s.dreams.filter((d) => d.id !== id),
        }));
      },

      /** 打开新建梦想表单 */
      openForm: () => set({ isFormOpen: true, editingDream: null }),

      /** 打开编辑梦想表单 */
      openEditForm: (dream) =>
        set({ isFormOpen: true, editingDream: dream }),

      /** 关闭梦想表单 */
      closeForm: () => set({ isFormOpen: false, editingDream: null }),
    }),
    {
      name: 'lifeverse-dreams',
      // 仅持久化 dreams 字段，表单状态不持久化
      partialize: (state) => ({ dreams: state.dreams }),
    }
  )
);
