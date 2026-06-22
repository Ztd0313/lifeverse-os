import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 浏览器端客户端
 *
 * 使用 @supabase/ssr 的 createBrowserClient 创建，
 * 自动处理浏览器端的 cookie 和 auth 会话。
 *
 * 环境变量：
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase 项目 URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase 匿名密钥
 *
 * 注意：此文件只能在浏览器端使用（'use client' 组件中导入）。
 * 服务端请使用 src/lib/supabase/server.ts。
 */

/** Supabase URL（浏览器端可访问，使用 NEXT_PUBLIC_ 前缀） */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/** Supabase 匿名密钥 */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * 是否已配置 Supabase 环境变量
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Supabase 浏览器客户端单例
 *
 * 若环境变量未配置，返回 null，调用方需自行处理降级。
 */
let browserClient: SupabaseClient | null = null;

/**
 * 获取 Supabase 浏览器客户端
 *
 * @returns Supabase 客户端实例，未配置时返回 null
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (browserClient) return browserClient;

  if (!isSupabaseConfigured()) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. ' +
          'Database features will be disabled.'
      );
    }
    return null;
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

/**
 * Supabase 浏览器客户端
 *
 * 直接导出客户端实例（可能为 null）。
 * 推荐使用 getSupabaseBrowser() 函数获取，以便处理 null 情况。
 */
export const supabase = getSupabaseBrowser();
