/**
 * Clerk 认证配置
 *
 * 定义需要认证的路由和公开路由列表。
 * 实际中间件逻辑在 middleware.ts 中实现（使用 @clerk/nextjs 的 clerkMiddleware）。
 *
 * 路由规则：
 * - 公开路由：首页、登录、注册等，无需认证即可访问
 * - 受保护路由：议会、历史、报告、设置等，需要用户登录
 * - API 路由：/api/council 和 /api/agent 需要认证（生产环境）
 */

/**
 * 公开路由列表（无需认证即可访问）
 *
 * 这些路由前缀匹配的路径不需要登录。
 */
export const PUBLIC_ROUTES: readonly string[] = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/health',
] as const;

/**
 * 需要认证的路由列表
 *
 * 这些路由前缀匹配的路径需要用户登录。
 * 未登录用户会被重定向到 /sign-in。
 */
export const PROTECTED_ROUTES: readonly string[] = [
  '/council',
  '/history',
  '/report',
  '/settings',
  '/api/council',
  '/api/agent',
] as const;

/**
 * Clerk 登录/注册路由配置
 */
export const CLERK_ROUTES = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  afterSignIn: '/council',
  afterSignUp: '/council',
} as const;

/**
 * Clerk 公钥（浏览器端可访问）
 */
export const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

/**
 * Clerk 密钥（仅服务端）
 */
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';

/**
 * 是否已配置 Clerk 环境变量
 */
export function isClerkConfigured(): boolean {
  return Boolean(CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY);
}

/**
 * 判断给定路径是否为公开路由
 *
 * @param pathname URL 路径名
 * @returns 是否为公开路由
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * 判断给定路径是否为受保护路由
 *
 * @param pathname URL 路径名
 * @returns 是否为受保护路由
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * 判断给定路径是否为 API 路由
 *
 * @param pathname URL 路径名
 * @returns 是否为 API 路由
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

/**
 * 判断给定路径是否为静态资源
 *
 * @param pathname URL 路径名
 * @returns 是否为静态资源
 */
export function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  );
}
