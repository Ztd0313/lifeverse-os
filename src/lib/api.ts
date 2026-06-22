/**
 * LifeVerse API 客户端
 * 与阿里云 ECS 后端通信
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/** 通用 fetch 封装 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API 错误: ${res.status}`);
  }
  return res.json();
}

/** 记忆相关 API */
export const memoriesApi = {
  /** 获取记忆列表 */
  list: (params?: { category?: string; type?: string; emotion?: string; sort?: string; limit?: number; page?: number }) =>
    apiFetch<{ success: boolean; data: any[]; total: number }>('/api/memories?' + new URLSearchParams(params as any).toString()),

  /** 创建记忆 */
  create: (data: { title: string; content: string; type?: string; emotion?: string; category?: string; tags?: string[]; importance?: number; fileUrl?: string; fileName?: string; fileSize?: number; fileMimeType?: string }) =>
    apiFetch<{ success: boolean; data: any }>('/api/memories', { method: 'POST', body: JSON.stringify(data) }),

  /** 删除记忆 */
  delete: (id: string) =>
    apiFetch<{ success: boolean }>('/api/memories/' + id, { method: 'DELETE' }),
};

/** 统计 API */
export const statsApi = {
  get: () => apiFetch<{ success: boolean; data: { totalMemories: number; totalCouncils: number; totalUsers: number; todayMemories: number } }>('/api/stats'),
};

/** 健康检查 */
export const healthApi = {
  check: () => apiFetch<{ status: string; database: string }>('/api/health'),
};

export { API_BASE_URL };
