import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 服务端客户端
 *
 * 使用 @supabase/ssr 的 createServerClient 创建，
 * 通过 Next.js 的 cookies() API 读写认证 cookie。
 *
 * 环境变量：
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase 项目 URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase 匿名密钥
 *
 * 注意：此函数只能在 Server Components、Server Actions 或
 * Route Handlers 中调用，不能在客户端组件中使用。
 *
 * Next.js 15 中 cookies() 是异步的，因此本函数也是 async。
 *
 * @returns Supabase 服务端客户端实例
 */

/**
 * 创建 Supabase 服务端客户端
 *
 * 每次调用都创建新实例，因为 cookie 状态可能已变化。
 *
 * @example
 * ```ts
 * // 在 Server Component 中
 * const supabase = await createSupabaseServerClient();
 * const { data } = await supabase.from('users').select('*');
 *
 * // 在 Route Handler 中
 * export async function GET() {
 *   const supabase = await createSupabaseServerClient();
 *   // ...
 * }
 * ```
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase Server] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. ' +
        'Database features will be disabled.'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: Record<string, unknown>;
        }>
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          );
        } catch {
          /**
           * setAll 在 Server Component 中调用时会抛错（只读 cookie）。
           * 这可以安全忽略——只要 middleware 中配置了会话刷新，
           * 用户的 session 会被中间件正确更新。
           */
        }
      },
    },
  });
}

/**
 * 是否已配置 Supabase 服务端环境变量
 */
export function isSupabaseServerConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
