'use client';

import * as React from 'react';
import { Suspense } from 'react';
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

// ===== 甯搁噺 =====

/** 涓浗澶ч檰鎵嬫満鍙锋鍒欙細1[3-9] 寮€澶达紝鍏?11 浣?*/
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/** 楠岃瘉鐮佸€掕鏃剁鏁?*/
const COUNTDOWN_SECONDS = 60;

// ===== 鍔ㄧ敾鍙樹綋 =====

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

// ===== 瀛愮粍浠讹細鎵嬫満楠岃瘉鐮佺櫥褰曡〃鍗?=====

/**
 * 鎵嬫満楠岃瘉鐮佺櫥褰曡〃鍗? *
 * 娴佺▼锛氳緭鍏ユ墜鏈哄彿 鈫?鑾峰彇楠岃瘉鐮?鈫?杈撳叆楠岃瘉鐮?鈫?鐧诲綍
 */
function PhoneLoginForm() {
  const { loginWithPhone, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 琛ㄥ崟鐘舵€?  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  // 鍊掕鏃跺墿浣欑鏁帮紙0 琛ㄧず鍙彂閫侊級
  const [countdown, setCountdown] = React.useState(0);
  // 鏄惁姝ｅ湪鍙戦€侀獙璇佺爜
  const [isSending, setIsSending] = React.useState(false);
  // 閿欒鎻愮ず
  const [phoneError, setPhoneError] = React.useState('');
  const [codeError, setCodeError] = React.useState('');
  const [formError, setFormError] = React.useState('');
  // 鎻愮ず淇℃伅锛堝楠岃瘉鐮佸凡鍙戦€侊級
  const [notice, setNotice] = React.useState('');
  // 寮€鍙戠幆澧冭繑鍥炵殑楠岃瘉鐮侊紙渚夸簬娴嬭瘯锛?  const [debugCode, setDebugCode] = React.useState<string | null>(null);

  // 鍊掕鏃跺畾鏃跺櫒
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  /**
   * 鍙戦€侀獙璇佺爜
   */
  const handleSendCode = async () => {
    // 娓呴櫎涔嬪墠鐨勯敊璇?    setPhoneError('');
    setNotice('');
    setDebugCode(null);

    const trimmedPhone = phone.trim();

    // 鎵嬫満鍙锋牎楠?    if (!trimmedPhone) {
      setPhoneError('璇疯緭鍏ユ墜鏈哄彿');
      return;
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError('璇疯緭鍏ユ纭殑涓浗澶ч檰鎵嬫満鍙凤紙1 寮€澶达紝11 浣嶏級');
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
        setPhoneError(data.error || '楠岃瘉鐮佸彂閫佸け璐?);
        return;
      }

      // 鍙戦€佹垚鍔燂紝鍚姩鍊掕鏃?      setCountdown(COUNTDOWN_SECONDS);
      setNotice('楠岃瘉鐮佸凡鍙戦€侊紝5 鍒嗛挓鍐呮湁鏁?);

      // 寮€鍙戠幆澧冩樉绀洪獙璇佺爜
      if (data.debugCode) {
        setDebugCode(data.debugCode);
      }
    } catch {
      setPhoneError('缃戠粶閿欒锛岃绋嶅悗閲嶈瘯');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * 鎻愪氦鐧诲綍
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 娓呴櫎閿欒
    setPhoneError('');
    setCodeError('');
    setFormError('');

    const trimmedPhone = phone.trim();
    const trimmedCode = code.trim();

    // 鏍￠獙
    if (!trimmedPhone) {
      setPhoneError('璇疯緭鍏ユ墜鏈哄彿');
      return;
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError('鎵嬫満鍙锋牸寮忎笉姝ｇ‘');
      return;
    }
    if (!trimmedCode) {
      setCodeError('璇疯緭鍏ラ獙璇佺爜');
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setCodeError('楠岃瘉鐮佸簲涓?6 浣嶆暟瀛?);
      return;
    }

    try {
      await loginWithPhone(trimmedPhone, trimmedCode);
      // 鐧诲綍鎴愬姛锛岃烦杞?      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : '鐧诲綍澶辫触锛岃绋嶅悗閲嶈瘯'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 鎵嬫満鍙疯緭鍏?*/}
      <div className="space-y-2">
        <label
          htmlFor="auth-phone"
          className="block text-xs font-medium text-text-soft"
        >
          鎵嬫満鍙?        </label>
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
            placeholder="璇疯緭鍏ユ墜鏈哄彿"
            value={phone}
            onChange={(e) => {
              // 浠呭厑璁告暟瀛?              setPhone(e.target.value.replace(/\D/g, ''));
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

      {/* 楠岃瘉鐮佽緭鍏?+ 鑾峰彇鎸夐挳 */}
      <div className="space-y-2">
        <label
          htmlFor="auth-code"
          className="block text-xs font-medium text-text-soft"
        >
          楠岃瘉鐮?        </label>
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
              placeholder="6 浣嶉獙璇佺爜"
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
              '鑾峰彇楠岃瘉鐮?
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

      {/* 鎻愮ず淇℃伅 */}
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
                娴嬭瘯鐮? {debugCode}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 琛ㄥ崟绾ч敊璇?*/}
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

      {/* 鐧诲綍鎸夐挳 */}
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
            鐧诲綍涓?..
          </>
        ) : (
          '鐧诲綍 / 娉ㄥ唽'
        )}
      </Button>

      {/* 鍗忚鎻愮ず */}
      <p className="text-center text-xs leading-relaxed text-text-dim">
        鐧诲綍鍗宠〃绀哄悓鎰?LifeVerse
        <Link href="/" className="mx-1 text-gold/80 hover:text-gold link-underline">
          鏈嶅姟鍗忚
        </Link>
        涓?        <Link href="/" className="mx-1 text-gold/80 hover:text-gold link-underline">
          闅愮鏀跨瓥
        </Link>
      </p>
    </form>
  );
}

// ===== 瀛愮粍浠讹細寰俊鎵爜鐧诲綍 =====

/**
 * 寰俊鎵爜鐧诲綍
 *
 * 褰撳墠涓?UI 妗嗘灦锛屽疄闄呭井淇℃壂鐮侀渶瑕佸井淇″紑鏀惧钩鍙?AppID銆? * 瀵规帴鏃舵浛鎹簩缁寸爜鍗犱綅鍖哄煙涓哄井淇″紑鏀惧钩鍙扮敓鎴愮殑浜岀淮鐮併€? */
function WechatLoginForm() {
  const [refreshing, setRefreshing] = React.useState(false);

  /**
   * 鍒锋柊浜岀淮鐮侊紙mock锛?   */
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 浜岀淮鐮佸崰浣嶅尯鍩?*/}
      <div className="relative">
        <motion.div
          animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="flex h-48 w-48 items-center justify-center rounded-[14px] border border-gold-dim/40 bg-bg-card"
        >
          {/* 浜岀淮鐮佸崰浣嶅浘妗?*/}
          <div className="flex flex-col items-center gap-3 text-text-dim">
            <QrCode size={64} className="text-gold/50" />
            <span className="text-xs">寰俊浜岀淮鐮?/span>
          </div>
        </motion.div>

        {/* 鍒锋柊鎸夐挳 */}
        <button
          type="button"
          onClick={handleRefresh}
          className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-gold-dim bg-bg-soft text-gold transition-all hover:bg-gold-soft hover:shadow-[0_0_16px_var(--shadow-gold)]"
          aria-label="鍒锋柊浜岀淮鐮?
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 鎻愮ず鏂囧瓧 */}
      <div className="space-y-1 text-center">
        <p className="text-sm text-text">
          璇蜂娇鐢?          <span className="mx-1 text-gold">寰俊</span>
          鎵弿浜岀淮鐮佺櫥褰?        </p>
        <p className="text-xs text-text-dim">
          鎵爜鍚庤鍦ㄦ墜鏈轰笂纭鐧诲綍
        </p>
      </div>

      {/* 寰呭鎺ユ彁绀?*/}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-card/60 px-3 py-2 text-xs text-text-dim">
        <Sparkles size={12} className="text-gold/60" />
        <span>寰俊鎵爜鐧诲綍鍗冲皢涓婄嚎锛岃鍏堜娇鐢ㄦ墜鏈洪獙璇佺爜鐧诲綍</span>
      </div>
    </div>
  );
}

// ===== 涓婚〉闈㈢粍浠?=====

/**
 * 鐧诲綍 / 娉ㄥ唽椤甸潰
 *
 * 鏀寔涓ょ鐧诲綍鏂瑰紡锛? * 1. 鎵嬫満楠岃瘉鐮佺櫥褰? * 2. 寰俊鎵爜鐧诲綍锛圲I 妗嗘灦锛屽緟瀵规帴寰俊寮€鏀惧钩鍙帮級
 *
 * 璁捐椋庢牸锛氭殫鑹蹭富棰?+ 閲戣壊鐐圭紑 + framer-motion 鍔ㄧ敾
 */
export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 鐧诲綍鏂瑰紡鍒囨崲锛?phone' | 'wechat'
  const [loginMethod, setLoginMethod] = React.useState<'phone' | 'wechat'>(
    'phone'
  );

  // 椤甸潰鍔犺浇鏃舵牎楠岀櫥褰曟€?  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 宸茬櫥褰曞垯璺宠浆
  React.useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [isInitialized, isAuthenticated, router, searchParams]);

  return (
    <>
      {/* 鍏ㄥ睆绮掑瓙鑳屾櫙 */}
      <ParticleBackground />

      {/* 鍏ㄥ眬澶撮儴瀵艰埅 */}
      <Header />

      {/* 椤甸潰涓讳綋 */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-16 pt-24 sm:px-6">
        <motion.div
          variants={containerVariant}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* 杩斿洖棣栭〉 */}
          <motion.div variants={itemVariant} className="mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                杩斿洖棣栭〉
              </Link>
            </Button>
          </motion.div>

          {/* 鐧诲綍鍗＄墖 */}
          <motion.div variants={itemVariant}>
            <Card hover={false} className="space-y-6 p-8">
              {/* 鏍囬鍖?*/}
              <div className="space-y-3 text-center">
                <span className="inline-flex items-center rounded-full border border-gold-dim bg-gold-soft px-4 py-1 text-xs tracking-widest text-gold">
                  LifeVerse
                </span>
                <h1 className="h-display text-3xl text-gradient-gold sm:text-4xl">
                  娆㈣繋鍥炴潵
                </h1>
                <p className="text-sm text-text-soft">
                  鐧诲綍浣犵殑鐢熷懡瀹囧畽
                </p>
              </div>

              {/* 鐧诲綍鏂瑰紡鍒囨崲 */}
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
                  鎵嬫満鐧诲綍
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
                  寰俊鐧诲綍
                </button>
              </div>

              {/* 鐧诲綍琛ㄥ崟锛堝甫鍒囨崲鍔ㄧ敾锛?*/}
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

          {/* 搴曢儴寮曠敤 */}
          <motion.p
            variants={itemVariant}
            className="mt-8 text-center text-sm text-text-dim"
          >
            &ldquo;姣忎竴涓敓鍛斤紝閮藉€煎緱鎷ユ湁鑷繁鐨勫畤瀹欍€?rdquo;
          </motion.p>
        </motion.div>
      </main>
    </>
  );
}
