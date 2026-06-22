/**
 * 记忆星球（Memory Planet）Zustand Store
 *
 * 管理记忆列表、当前选中的星球、当前查看的记忆、上传弹窗开关。
 * 支持与阿里云 ECS 后端 API 同步，API 不可用时降级到本地 mock 数据。
 */

import { create } from 'zustand';
import type { MemoryItem, MemoryCategory } from '@/types';
import { MOCK_MEMORIES } from '@/lib/mock-memories';
import { generateId } from '@/lib/utils';
import { memoriesApi } from '@/lib/api';

interface MemoryStore {
  // ===== State =====
  /** 全部记忆列表 */
  memories: MemoryItem[];
  /** 当前选中的星球 */
  selectedPlanet: MemoryCategory;
  /** 当前查看的记忆（用于详情弹窗） */
  selectedMemory: MemoryItem | null;
  /** 上传弹窗是否打开 */
  isUploadOpen: boolean;
  /** 当前对话的记忆（用于记忆对话弹窗） */
  dialogueMemory: MemoryItem | null;
  /** 是否正在从服务器加载数据 */
  isLoading: boolean;
  /** 是否已与服务器同步成功 */
  isSynced: boolean;

  // ===== Actions =====
  /** 添加一条记忆（自动归入当前选中的星球），同步到服务器 */
  addMemory: (
    memory: Omit<MemoryItem, 'id' | 'category'> &
      Partial<Pick<MemoryItem, 'category'>>
  ) => Promise<void>;
  /** 删除一条记忆，同步到服务器 */
  deleteMemory: (id: string) => Promise<void>;
  /** 切换当前选中的星球 */
  selectPlanet: (planet: MemoryCategory) => void;
  /** 选中一条记忆（打开详情弹窗） */
  selectMemory: (memory: MemoryItem) => void;
  /** 关闭详情弹窗 */
  closeDetail: () => void;
  /** 打开上传弹窗 */
  openUpload: () => void;
  /** 关闭上传弹窗 */
  closeUpload: () => void;
  /** 打开记忆对话弹窗 */
  openDialogue: (memory: MemoryItem) => void;
  /** 关闭记忆对话弹窗 */
  closeDialogue: () => void;
  /** 从服务器获取记忆列表 */
  fetchFromServer: () => Promise<void>;
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  // ===== Initial State =====
  memories: MOCK_MEMORIES,
  selectedPlanet: 'forest',
  selectedMemory: null,
  isUploadOpen: false,
  dialogueMemory: null,
  isLoading: false,
  isSynced: false,

  // ===== Actions =====
  /** 从服务器获取记忆列表 */
  fetchFromServer: async () => {
    set({ isLoading: true });
    try {
      const result = await memoriesApi.list({});
      if (result.success && result.data.length > 0) {
        const serverMemories: MemoryItem[] = result.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          type: item.type || 'text',
          emotion: item.emotion || 'warm',
          category: item.category || 'forest',
          date: item.date || item.created_at,
          tags: item.tags || [],
          importance: item.importance || 0.5,
          ...(item.fileUrl ? { fileUrl: item.fileUrl, fileName: item.fileName, fileSize: item.fileSize, fileMimeType: item.fileMimeType } : {}),
        }));
        set({ memories: serverMemories, isSynced: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      // API 不可用时使用本地 mock 数据
      set({ isLoading: false });
    }
  },

  /** 添加一条记忆，先更新本地 UI，再同步到服务器 */
  addMemory: async (memory) => {
    const state = get();
    const newMemory: MemoryItem = {
      ...memory,
      id: generateId(),
      category: memory.category ?? state.selectedPlanet,
    };

    // 先更新本地 UI
    set((s) => ({
      memories: [newMemory, ...s.memories],
      isUploadOpen: false,
    }));

    // 同步到服务器
    try {
      await memoriesApi.create({
        title: newMemory.title,
        content: newMemory.content,
        type: newMemory.type,
        emotion: newMemory.emotion,
        category: newMemory.category,
        tags: newMemory.tags,
        importance: newMemory.importance,
        fileUrl: newMemory.fileUrl,
        fileName: newMemory.fileName,
        fileSize: newMemory.fileSize,
        fileMimeType: newMemory.fileMimeType,
      });
    } catch (error) {
      console.error('[MemoryStore] 同步到服务器失败:', error);
    }
  },

  /** 删除一条记忆，先更新本地 UI，再同步到服务器 */
  deleteMemory: async (id) => {
    set((s) => ({
      memories: s.memories.filter((m) => m.id !== id),
      selectedMemory:
        s.selectedMemory?.id === id ? null : s.selectedMemory,
    }));

    try {
      await memoriesApi.delete(id);
    } catch (error) {
      console.error('[MemoryStore] 从服务器删除失败:', error);
    }
  },

  selectPlanet: (planet) => set({ selectedPlanet: planet }),

  selectMemory: (memory) => set({ selectedMemory: memory }),

  closeDetail: () => set({ selectedMemory: null }),

  openUpload: () => set({ isUploadOpen: true }),

  closeUpload: () => set({ isUploadOpen: false }),

  openDialogue: (memory) =>
    set({ dialogueMemory: memory, selectedMemory: null }),

  closeDialogue: () => set({ dialogueMemory: null }),
}));
