'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  ShieldCheck,
  Loader2,
  QrCode,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

// ===== 常量 =====

/** 中国大陆手机号正则：1[3-9] 开头，共 11 位 */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/** 验证码倒计时秒数 */
const COUNTDOWN_SECONDS = 60;

// ===== 动画变体 =====

const containerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ===== 子组件：手机验证码登录表单 =====

/**
 * 手机验证码登录表单
 *
 * 流程：输入手机号 → 获取验证码 → 输入验证码 → 登录
 */
function PhoneLoginForm() {
  const { loginWithPhone, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 表单状态
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  // 倒计时剩余秒数（0 表示可发送）
  const [countdown, setCountdown] = React.useState(0);
  // 是否正在发送验证码
  const [isSending, setIsSending] = React.useState(false);
  // 错误提示
  const [phoneError, setPhoneError] = React.useState('');
  const [codeError, setCodeError] = React.useState('');
  const [formError, setFormError] = React.useState('');
  // 提示信息（如验证码已发送）
  const [notice, setNotice] = React.useState('');
  // 开发环境返回的验证码（便于测试）
  const [debugCode, setDebugCode] = React.useState<string | null>(null);

  // 倒计时定时器
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    // 清除之前的错误
    setPhoneError('');
    setNotice('');
    setDebugCode(null);

    const trimmedPhone = phone.trim();

    // 手机号校验
    if (!trimmedPhone) {
      setPhoneError('请输入手机号');
      return;
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError('请输入正确的中国大陆手机号（1 开头，11 位）');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPhoneError(data.error || '验证码发送失败');
        return;
      }

      // 发送成功，启动倒计时
      setCountdown(COUNTDOWN_SECONDS);
      setNotice('验证码已发送，5 分钟内有效');

      // 开发环境显示验证码
      if (data.debugCode) {
        setDebugCode(data.debugCode);
      }
    } catch {
      setPhoneError('网络错误，请稍后重试');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * 提交登录
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 清除错误
    setPhoneError('');
    setCodeError('');
    setFormError('');

    const trimmedPhone = phone.trim();
    const trimmedCode = code.trim();

    // 校验
    if (!trimmedPhone) {
      setPhoneError('请输入手机号');
      return;
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError('手机号格式不正确');
      return;
    }
    if (!trimmedCode) {
      setCodeError('请输入验证码');
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setCodeError('验证码应为 6 位数字');
      return;
    }

    try {
      await loginWithPhone(trimmedPhone, trimmedCode);
      // 登录成功，跳转
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : '登录失败，请稍后重试'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 手机号输入 */}
      <div className="space-y-2">
        <label
          htmlFor="auth-phone"
          className="block text-xs font-medium text-text-soft"
        >
          手机号
        </label>
        <div className="relative">
          <Phone
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim"
          />
          <input
            id="auth-phone"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => {
              // 仅允许数字
              setPhone(e.target.value.replace(/\D/g, ''));
              if (phoneError) setPhoneError('');
            }}
            className={cn(
              'h-12 w-full rounded-[14px] border bg-bg-card pl-11 pr-4 text-sm text-text placeholder:text-text-dim transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-gold/40',
              phoneError
                ? 'border-red'
                : 'border-border focus:border-gold-dim'
            )}
            autoComplete="tel"
            disabled={isLoading}
          />
        </div>
        <AnimatePresence>
          {phoneError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1 text-xs text-red"
            >
              <AlertCircle size={12} />
              {phoneError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* 验证码输入 + 获取按钮 */}
      <div className="space-y-2">
        <label
          htmlFor="auth-code"
          className="block text-xs font-medium text-text-soft"
        >
          验证码
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <ShieldCheck
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim"
            />
            <input
              id="auth-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6 位验证码"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                if (codeError) setCodeError('');
              }}
              className={cn(
                'h-12 w-full rounded-[14px] border bg-bg-card pl-11 pr-4 text-sm text-text placeholder:text-text-dim transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-gold/40',
                codeError
                  ? 'border-red'
                  : 'border-border focus:border-gold-dim'
              )}
              autoComplete="one-time-code"
              disabled={isLoading}
            />
          </div>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={countdown > 0 || isSending || isLoading}
            className={cn(
              'h-12 shrink-0 rounded-[14px] border px-4 text-sm font-medium transition-all',
              countdown > 0 || isSending
                ? 'cursor-not-allowed border-border bg-bg-card text-text-dim'
                : 'border-gold-dim bg-gold-soft text-gold hover:bg-gold/20 hover:shadow-[0_0_20px_var(--shadow-gold)]'
            )}
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : countdown > 0 ? (
              `${countdown}s`
            ) : (
              '获取验证码'
            )}
          </button>
        </div>
        <AnimatePresence>
          {codeError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1 text-xs text-red"
            >
              <AlertCircle size={12} />
              {codeError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* 提示信息 */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-lg border border-gold-dim/40 bg-gold-soft/30 px-3 py-2 text-xs text-gold"
          >
            <CheckCircle2 size={14} />
            <span>{notice}</span>
            {debugCode && (
              <span className="ml-auto rounded bg-bg-soft px-2 py-0.5 font-mono text-gold">
                测试码: {debugCode}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 表单级错误 */}
      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red"
          >
            <AlertCircle size={14} />
            <span>{formError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登录按钮 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            登录中...
          </>
        ) : (
          '登录 / 注册'
        )}
      </Button>

      {/* 协议提示 */}
      <p className="text-center text-xs leading-relaxed text-text-dim">
        登录即表示同意 LifeVerse
        <Link href="/" className="mx-1 text-gold/80 hover:text-gold link-underline">
          服务协议
        </Link>
        与
        <Link href="/" className="mx-1 text-gold/80 hover:text-gold link-underline">
          隐私政策
        </Link>
      </p>
    </form>
  );
}

// ===== 子组件：微信扫码登录 =====

/**
 * 微信扫码登录
 *
 * 当前为 UI 框架，实际微信扫码需要微信开放平台 AppID。
 * 对接时替换二维码占位区域为微信开放平台生成的二维码。
 */
function WechatLoginForm() {
  const [refreshing, setRefreshing] = React.useState(false);

  /**
   * 刷新二维码（mock）
   */
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 二维码占位区域 */}
      <div className="relative">
        <motion.div
          animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="flex h-48 w-48 items-center justify-center rounded-[14px] border border-gold-dim/40 bg-bg-card"
        >
          {/* 二维码占位图案 */}
          <div className="flex flex-col items-center gap-3 text-text-dim">
            <QrCode size={64} className="text-gold/50" />
            <span className="text-xs">微信二维码</span>
          </div>
        </motion.div>

        {/* 刷新按钮 */}
        <button
          type="button"
          onClick={handleRefresh}
          className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-gold-dim bg-bg-soft text-gold transition-all hover:bg-gold-soft hover:shadow-[0_0_16px_var(--shadow-gold)]"
          aria-label="刷新二维码"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 提示文字 */}
      <div className="space-y-1 text-center">
        <p className="text-sm text-text">
          请使用
          <span className="mx-1 text-gold">微信</span>
          扫描二维码登录
        </p>
        <p className="text-xs text-text-dim">
          扫码后请在手机上确认登录
        </p>
      </div>

      {/* 待对接提示 */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-card/60 px-3 py-2 text-xs text-text-dim">
        <Sparkles size={12} className="text-gold/60" />
        <span>微信扫码登录即将上线，请先使用手机验证码登录</span>
      </div>
    </div>
  );
}

// ===== 主页面组件 =====

/**
 * 登录 / 注册页面
 *
 * 支持两种登录方式：
 * 1. 手机验证码登录
 * 2. 微信扫码登录（UI 框架，待对接微信开放平台）
 *
 * 设计风格：暗色主题 + 金色点缀 + framer-motion 动画
 */
export default function AuthPage() {
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 登录方式切换：'phone' | 'wechat'
  const [loginMethod, setLoginMethod] = React.useState<'phone' | 'wechat'>(
    'phone'
  );

  // 页面加载时校验登录态
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 已登录则跳转
  React.useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [isInitialized, isAuthenticated, router, searchParams]);

  return (
    <>
      {/* 全屏粒子背景 */}
      <ParticleBackground />

      {/* 全局头部导航 */}
      <Header />

      {/* 页面主体 */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-16 pt-24 sm:px-6">
        <motion.div
          variants={containerVariant}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* 返回首页 */}
          <motion.div variants={itemVariant} className="mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Link>
            </Button>
          </motion.div>

          {/* 登录卡片 */}
          <motion.div variants={itemVariant}>
            <Card hover={false} className="space-y-6 p-8">
              {/* 标题区 */}
              <div className="space-y-3 text-center">
                <span className="inline-flex items-center rounded-full border border-gold-dim bg-gold-soft px-4 py-1 text-xs tracking-widest text-gold">
                  LifeVerse
                </span>
                <h1 className="h-display text-3xl text-gradient-gold sm:text-4xl">
                  欢迎回来
                </h1>
                <p className="text-sm text-text-soft">
                  登录你的生命宇宙
                </p>
              </div>

              {/* 登录方式切换 */}
              <div className="flex gap-1 rounded-[14px] border border-border bg-bg-soft p-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm font-medium transition-all',
                    loginMethod === 'phone'
                      ? 'bg-bg-card text-gold shadow-sm interactive'
                      : 'text-text-soft hover:text-text'
                  )}
                >
                  <Phone size={14} />
                  手机登录
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('wechat')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm font-medium transition-all',
                    loginMethod === 'wechat'
                      ? 'bg-bg-card text-gold shadow-sm interactive'
                      : 'text-text-soft hover:text-text'
                  )}
                >
                  <QrCode size={14} />
                  微信登录
                </button>
              </div>

              {/* 登录表单（带切换动画） */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={loginMethod}
                  initial={{ opacity: 0, x: loginMethod === 'phone' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: loginMethod === 'phone' ? 20 : -20 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {loginMethod === 'phone' ? (
                    <PhoneLoginForm />
                  ) : (
                    <WechatLoginForm />
                  )}
                </motion.div>
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* 底部引用 */}
          <motion.p
            variants={itemVariant}
            className="mt-8 text-center text-sm text-text-dim"
          >
            &ldquo;每一个生命，都值得拥有自己的宇宙。&rdquo;
          </motion.p>
        </motion.div>
      </main>
    </>
  );
}
