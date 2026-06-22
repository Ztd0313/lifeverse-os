/**
 * 认证状态管理 Store
 *
 * 使用 Zustand 管理前端登录状态，包含：
 * - 当前用户信息（user）
 * - JWT token
 * - 登录态（isAuthenticated）
 * - 加载态（isLoading）
 *
 * 持久化策略：
 * - token 与 user 存入 localStorage，7 天过期
 * - 页面加载时调用 checkAuth() 校验 token 有效性
 *
 * 提供 useAuth hook 供组件使用。
 */

import { create } from 'zustand';
import type { User } from '@/types';

// ===== localStorage 持久化 =====

/** localStorage 键名 */
const STORAGE_KEY = 'lifeverse_auth';
/** 持久化有效期：7 天 */
const STORAGE_TTL = 7 * 24 * 60 * 60 * 1000;

/** 持久化数据结构 */
interface PersistedAuth {
  user: User;
  token: string;
  /** 存入时间戳，用于判断是否过期 */
  savedAt: number;
}

/**
 * 读取 localStorage 中的认证信息
 *
 * 超过 7 天或格式异常时返回 null。
 */
function readPersistedAuth(): PersistedAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedAuth;
    // 校验必要字段
    if (!data.token || !data.user || !data.savedAt) return null;
    // 判断是否过期
    if (Date.now() - data.savedAt > STORAGE_TTL) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * 写入认证信息到 localStorage
 */
function writePersistedAuth(user: User, token: string): void {
  if (typeof window === 'undefined') return;
  try {
    const data: PersistedAuth = {
      user,
      token,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 写入失败（如隐私模式），忽略
  }
}

/**
 * 清除 localStorage 中的认证信息
 */
function clearPersistedAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}

// ===== Store 定义 =====

export interface AuthStore {
  // ===== State =====
  /** 当前用户 */
  user: User | null;
  /** JWT token */
  token: string | null;
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 是否正在加载（登录中 / 校验中） */
  isLoading: boolean;
  /** 是否已完成首次初始化（避免页面加载时闪烁跳转） */
  isInitialized: boolean;

  // ===== Actions =====
  /** 手机验证码登录 */
  loginWithPhone: (phone: string, code: string) => Promise<void>;
  /** 微信扫码登录（暂为 mock，实际需对接微信开放平台） */
  loginWithWechat: (code: string) => Promise<void>;
  /** 退出登录 */
  logout: () => void;
  /** 校验登录态（页面加载时调用） */
  checkAuth: () => void;
  /** 更新个人资料 */
  updateProfile: (data: Partial<User>) => Promise<void>;
}

/**
 * 通用 fetch 封装（带 token）
 */
async function authFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `请求失败: ${res.status}`);
  }
  return data as T;
}

/**
 * 创建认证 Store
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // ===== Initial State =====
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  // ===== Actions =====

  /**
   * 手机验证码登录
   *
   * @param phone 手机号
   * @param code 验证码
   */
  loginWithPhone: async (phone, code) => {
    set({ isLoading: true });
    try {
      const data = await authFetch<{
        success: true;
        token: string;
        user: User;
      }>('/api/auth/sms/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });

      // 持久化
      writePersistedAuth(data.user, data.token);

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * 微信扫码登录
   *
   * 当前为 mock 实现：实际需对接微信开放平台 OAuth2.0。
   * 前端拿到微信回调 code 后调用本方法，后端用 code 换取 access_token 与 openid。
   *
   * @param code 微信 OAuth 回调 code
   */
  loginWithWechat: async (code) => {
    set({ isLoading: true });
    try {
      // TODO: 对接微信开放平台
      // 实际流程：
      // 1. 前端引导用户扫码，微信回调带回 code
      // 2. 后端用 code + AppID + AppSecret 换取 access_token 与 openid
      // 3. 用 access_token 获取用户昵称、头像
      // 4. 通过 openid 查找或创建用户，生成 JWT

      // 当前 mock：直接抛出提示
      throw new Error('微信扫码登录暂未对接，请使用手机验证码登录');
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * 退出登录
   */
  logout: () => {
    clearPersistedAuth();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  /**
   * 校验登录态
   *
   * 页面加载时调用：
   * 1. 从 localStorage 读取 token 与 user
   * 2. 调用 /api/auth/me 校验 token 是否仍有效
   * 3. 有效则保持登录，无效则清除
   */
  checkAuth: () => {
    const persisted = readPersistedAuth();
    if (!persisted) {
      set({ isInitialized: true });
      return;
    }

    // 先用本地缓存填充，避免页面闪烁
    set({
      user: persisted.user,
      token: persisted.token,
      isAuthenticated: true,
      isInitialized: true,
    });

    // 异步校验 token，失败则登出
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${persisted.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          // 更新为最新的用户信息
          writePersistedAuth(data.user, persisted.token);
          set({
            user: data.user,
            token: persisted.token,
            isAuthenticated: true,
          });
        } else {
          // token 失效
          get().logout();
        }
      })
      .catch(() => {
        // 网络错误等，不强制登出，保留本地缓存
      });
  },

  /**
   * 更新个人资料
   *
   * @param data 待更新字段
   */
  updateProfile: async (data) => {
    const { token } = get();
    if (!token) throw new Error('未登录');

    set({ isLoading: true });
    try {
      const res = await authFetch<{ success: true; user: User }>(
        '/api/auth/profile',
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      // 更新本地状态与持久化
      set((state) => {
        const updatedUser = res.user;
        if (state.token) {
          writePersistedAuth(updatedUser, state.token);
        }
        return { user: updatedUser, isLoading: false };
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

// ===== 便捷 Hook =====

/**
 * useAuth hook
 *
 * 封装 useAuthStore，提供常用的认证状态与操作。
 * 组件中优先使用本 hook 而非直接访问 store。
 */
export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    loginWithPhone: store.loginWithPhone,
    loginWithWechat: store.loginWithWechat,
    logout: store.logout,
    checkAuth: store.checkAuth,
    updateProfile: store.updateProfile,
  };
}
