'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  FileText,
  Loader2,
  Camera,
  Check,
  Info,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useMembershipStore } from '@/stores/membership-store';
import { useTranslation } from '@/lib/i18n';
import { useI18nStore } from '@/stores/i18n-store';
import { useAgentStore } from '@/stores/agent-store';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { MembershipBadge } from '@/components/membership/MembershipBadge';
import { UserDataReport } from '@/components/membership/UserDataReport';
import { getTotalAgentSeats, getTierConfig } from '@/types/membership';
import Link from 'next/link';
import { Crown, BarChart3, Bot, ShoppingBag } from 'lucide-react';
import type { User } from '@/types';

// ===== 常量 =====

/** 昵称最小长度 */
const NICKNAME_MIN_LENGTH = 2;
/** 昵称最大长度 */
const NICKNAME_MAX_LENGTH = 20;
/** 个人简介最大长度 */
const BIO_MAX_LENGTH = 200;

/** 当前年份 */
const CURRENT_YEAR = new Date().getFullYear();
/** 年份选择范围：1920 ~ 当前年份 */
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1920 + 1 },
  (_, i) => CURRENT_YEAR - i
);
/** 月份选项 1-12 */
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
/** 根据年月获取天数 */
function getDayOptions(year: number, month: number): number[] {
  if (!year || !month) return [];
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => i + 1);
}

// ===== 工具函数 =====

/**
 * 根据生日计算年龄
 *
 * @param birthday 生日字符串 YYYY-MM-DD
 * @returns 年龄（岁），无法计算时返回 null
 */
function calculateAge(birthday?: string): number | null {
  if (!birthday) return null;
  try {
    const birth = new Date(birthday);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age >= 0 && age < 150 ? age : null;
  } catch {
    return null;
  }
}

// ===== 子组件：表单区块 =====

interface SectionProps {
  title: string;
  icon: typeof UserIcon;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-bg-card p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft">
          <Icon className="h-4 w-4 text-gold" />
        </div>
        <h2 className="text-sm font-semibold text-text">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
}

// ===== 主页面 =====

/**
 * 个人资料页面
 *
 * 功能：
 * - 头像区域：显示当前头像，点击可更换（上传到服务器）
 * - 昵称：可编辑，2-20 字符
 * - 出生年月日：日期选择器（年/月/日下拉）
 * - 性别：男/女/其他 单选
 * - 年龄：根据生日自动计算并显示（只读）
 * - 个人简介：textarea，最多 200 字
 * - 保存按钮：调用 updateProfile API
 * - 温馨提示：建议使用真实的出生年月日
 * - 需要登录才能访问
 *
 * 设计风格：暗色 + 金色 + framer-motion
 */
export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const locale = useI18nStore((s) => s.locale);
  const {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    checkAuth,
    updateProfile,
  } = useAuthStore();

  // ===== 表单状态 =====
  const [nickname, setNickname] = React.useState('');
  const [avatar, setAvatar] = React.useState('');
  const [birthYear, setBirthYear] = React.useState<number | ''>('');
  const [birthMonth, setBirthMonth] = React.useState<number | ''>('');
  const [birthDay, setBirthDay] = React.useState<number | ''>('');
  const [gender, setGender] = React.useState<NonNullable<User['gender']>>(
    'male'
  );
  const [bio, setBio] = React.useState('');

  // ===== UI 状态 =====
  const [toast, setToast] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ===== 会员 & Agent 数据 =====
  const { membership } = useMembershipStore();
  const { customAgents, loadFromStorage: loadCustomAgents } = useAgentStore();
  const { ownedAgents } = useMarketplaceStore();

  // ===== 加载自定义 Agent 列表 =====
  React.useEffect(() => {
    loadCustomAgents();
  }, [loadCustomAgents]);

  // ===== 计算统计数据 =====
  const ownedAgentCount = ownedAgents.length || 9;
  const totalSeats = getTotalAgentSeats(membership);
  const daysJoined = React.useMemo(() => {
    if (!user?.createdAt) return 0;
    try {
      const created = new Date(user.createdAt);
      const now = new Date();
      return Math.max(
        0,
        Math.floor(
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
    } catch {
      return 0;
    }
  }, [user?.createdAt]);

  // ===== 首次加载时校验登录态 =====
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ===== 未登录时重定向到登录页 =====
  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthenticated, router, pathname]);

  // ===== 用户信息加载后填充表单 =====
  React.useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setAvatar(user.avatar || '');

      // 解析生日
      if (user.birthday) {
        const [y, m, d] = user.birthday.split('-').map((n) => parseInt(n, 10));
        if (y && m && d) {
          setBirthYear(y);
          setBirthMonth(m);
          setBirthDay(d);
        }
      }

      // 性别
      if (user.gender) {
        setGender(user.gender);
      }

      // 简介
      setBio(user.bio || '');
    }
  }, [user]);

  // ===== 计算年龄 =====
  const birthdayStr = React.useMemo(() => {
    if (birthYear && birthMonth && birthDay) {
      const m = String(birthMonth).padStart(2, '0');
      const d = String(birthDay).padStart(2, '0');
      return `${birthYear}-${m}-${d}`;
    }
    return '';
  }, [birthYear, birthMonth, birthDay]);

  const age = React.useMemo(() => calculateAge(birthdayStr), [birthdayStr]);

  // ===== 当月份变化时，校正天数 =====
  React.useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      const maxDay = new Date(birthYear, birthMonth, 0).getDate();
      if (birthDay > maxDay) {
        setBirthDay(maxDay);
      }
    }
  }, [birthYear, birthMonth, birthDay]);

  // ===== 显示 toast =====
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ===== 头像上传 =====
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 校验文件类型
    if (!file.type.startsWith('image/')) {
      showToast('error', t('profile.selectImage'));
      return;
    }

    // 校验文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', t('profile.imageTooLarge'));
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('profile.avatarUploadFailed'));
      }

      setAvatar(data.url);
      showToast('success', t('profile.avatarUploadSuccess'));
    } catch (error) {
      showToast(
        'error',
        error instanceof Error ? error.message : t('profile.avatarUploadFailed')
      );
    } finally {
      setAvatarUploading(false);
      // 重置 input 以便重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ===== 保存个人资料 =====
  const handleSave = async () => {
    setFormError('');

    // 昵称校验
    const trimmedNickname = nickname.trim();
    if (
      trimmedNickname.length < NICKNAME_MIN_LENGTH ||
      trimmedNickname.length > NICKNAME_MAX_LENGTH
    ) {
      setFormError(
        t('profile.nicknameLengthError', {
          min: NICKNAME_MIN_LENGTH,
          max: NICKNAME_MAX_LENGTH,
        })
      );
      return;
    }

    // 简介校验
    if (bio.length > BIO_MAX_LENGTH) {
      setFormError(
        t('profile.bioLengthError', { max: BIO_MAX_LENGTH })
      );
      return;
    }

    // 组装更新数据
    const updateData: Partial<User> = {
      nickname: trimmedNickname,
      avatar,
      gender,
      bio,
    };

    if (birthdayStr) {
      updateData.birthday = birthdayStr;
    }

    try {
      await updateProfile(updateData);
      showToast('success', t('profile.profileSaved'));
    } catch (error) {
      showToast(
        'error',
        error instanceof Error ? error.message : t('profile.saveFailed')
      );
    }
  };

  // ===== 登录态校验中，显示加载状态 =====
  if (!isInitialized || !isAuthenticated) {
    return (
      <>
        <ParticleBackground />
        <Header />
        <main className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-text-soft">
            <Loader2 size={32} className="animate-spin text-gold" />
            <p className="text-sm">{t('profile.verifying')}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ParticleBackground />
      <Header />

      <main className="relative z-10 min-h-screen bg-[#060710] px-4 pb-24 pt-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto max-w-2xl"
        >
          {/* ===== 顶部导航 ===== */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 text-sm text-text-soft transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('profile.backHome')}
            </button>
            <span className="text-sm font-medium text-text">{t('profile.title')}</span>
          </div>

          {/* ===== 用户中心 Dashboard ===== */}
          <section className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="h-display text-3xl text-gradient-gold sm:text-4xl">
                {t('profile.title')}
              </h1>
              <p className="mt-2 text-sm text-text-soft">
                {t('profile.subtitle')}
              </p>
            </motion.div>

            {/* 用户信息卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="card-hover interactive mb-4 flex flex-col sm:flex-row items-center gap-4 rounded-lg border border-border bg-bg-card p-4 sm:p-5"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gold-dim bg-bg-soft">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={t('profile.avatar')}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserIcon className="h-8 w-8 text-text-dim" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-text">
                    {nickname || user?.nickname || t('profile.defaultNickname')}
                  </h2>
                  <MembershipBadge tier={membership.tier} size="sm" />
                </div>
                <p className="mt-1 text-xs text-text-dim">
                  {user?.phone || t('profile.welcomeBack')}
                </p>
              </div>
              <Link
                href="/membership"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gold-dim/40 bg-gold-soft/20 px-3 py-2 text-xs font-medium text-gold transition-all hover:bg-gold-soft/40 hover:shadow-[0_0_16px_var(--shadow-gold-strong)]"
              >
                <Crown className="h-3.5 w-3.5" />
                {t('profile.viewMembership')}
              </Link>
            </motion.div>

            {/* 快速统计 */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-hover interactive rounded-lg border border-border bg-bg-card p-4 text-center"
              >
                <Bot className="mx-auto h-5 w-5 text-gold" />
                <div className="mt-2 text-2xl font-bold text-text">
                  {customAgents.length}
                </div>
                <div className="mt-0.5 text-xs text-text-dim">{t('profile.customAgent')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card-hover interactive rounded-lg border border-border bg-bg-card p-4 text-center"
              >
                <ShoppingBag className="mx-auto h-5 w-5 text-gold" />
                <div className="mt-2 text-2xl font-bold text-text">
                  {ownedAgentCount}
                </div>
                <div className="mt-0.5 text-xs text-text-dim">{t('profile.ownedAgent')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-hover interactive rounded-lg border border-border bg-bg-card p-4 text-center"
              >
                <BarChart3 className="mx-auto h-5 w-5 text-gold" />
                <div className="mt-2 text-2xl font-bold text-text">
                  {daysJoined}
                </div>
                <div className="mt-0.5 text-xs text-text-dim">{t('profile.daysJoined')}</div>
              </motion.div>
            </div>

            {/* 数据报表 */}
            <UserDataReport
              customAgentCount={customAgents.length}
              ownedAgentCount={ownedAgentCount}
              memoryCount={0}
              createdAt={user?.createdAt || new Date().toISOString()}
            />
          </section>

          {/* ===== 会员信息 ===== */}
          <section className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-hover interactive rounded-lg border border-border bg-bg-card p-5"
              style={
                membership.tier !== 'free'
                  ? {
                      borderColor: `${getTierConfig(membership.tier).color}40`,
                    }
                  : undefined
              }
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft">
                  <Crown className="h-4 w-4 text-gold" />
                </div>
                <h2 className="text-sm font-semibold text-text">{t('profile.membershipInfo')}</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-soft">{t('profile.currentTier')}</span>
                  <MembershipBadge tier={membership.tier} size="md" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-soft">{t('profile.expiresAt')}</span>
                  <span className="text-sm font-medium text-text">
                    {membership.expiresAt
                      ? new Date(membership.expiresAt).toLocaleDateString(
                          t('common.localeMap') as string,
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-soft">{t('profile.agentSeats')}</span>
                  <span className="text-sm font-medium text-text">
                    {t('profile.seatsUsed', {
                      used: customAgents.length,
                      total: totalSeats,
                    })}
                  </span>
                </div>
                <div className="pt-2">
                  <Link
                    href="/membership"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold-dim bg-gold-soft/30 px-4 py-2.5 text-sm font-medium text-gold transition-all hover:bg-gold-soft/50 hover:shadow-[0_0_16px_var(--shadow-gold-strong)]"
                  >
                    <Crown className="h-4 w-4" />
                    {t('profile.manageMembership')}
                  </Link>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ===== 编辑资料 ===== */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft">
                <UserIcon className="h-4 w-4 text-gold" />
              </div>
              <h2 className="text-base font-semibold text-text">{t('profile.editProfile')}</h2>
            </motion.div>

            {/* ===== 头像区域 ===== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col items-center gap-4 rounded-lg border border-border bg-bg-card p-6"
          >
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-gold-dim bg-bg-soft">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={t('profile.avatar')}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserIcon className="h-10 w-10 text-text-dim" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={avatarUploading}
                aria-label={t('profile.changeAvatar')}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-gold-dim bg-bg-soft text-gold transition-all hover:bg-gold-soft hover:shadow-[0_0_16px_var(--shadow-gold-strong)] disabled:opacity-50"
              >
                {avatarUploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-text-dim">{t('profile.avatarTip')}</p>
          </motion.div>

          {/* ===== 基本信息 ===== */}
          <Section title={t('profile.basicInfo')} icon={UserIcon}>
            {/* 昵称 */}
            <div className="space-y-2">
              <label
                htmlFor="profile-nickname"
                className="block text-xs font-medium text-text-soft"
              >
                {t('profile.nickname')}
                <span className="ml-2 text-text-dim">
                  ({nickname.length}/{NICKNAME_MAX_LENGTH})
                </span>
              </label>
              <input
                id="profile-nickname"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value.slice(0, NICKNAME_MAX_LENGTH));
                  if (formError) setFormError('');
                }}
                placeholder={t('profile.nicknamePlaceholder')}
                maxLength={NICKNAME_MAX_LENGTH}
                className="h-11 w-full rounded-[10px] border border-border bg-bg-soft px-4 text-sm text-text placeholder:text-text-dim transition-colors focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim"
              />
            </div>

            {/* 性别 */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-soft">
                {t('profile.gender')}
              </label>
              <div className="flex gap-2">
                {([
                  { value: 'male', labelKey: 'profile.male' },
                  { value: 'female', labelKey: 'profile.female' },
                  { value: 'other', labelKey: 'profile.other' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border py-2.5 text-sm transition-all',
                      gender === option.value
                        ? 'border-gold bg-gold-soft/30 text-gold'
                        : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
                    )}
                  >
                    {gender === option.value && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ===== 出生年月日 ===== */}
          <div className="mt-4">
            <Section title={t('profile.birthday')} icon={Calendar}>
              <div className="grid grid-cols-3 gap-3">
                {/* 年 */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-text-dim">{t('profile.year')}</label>
                  <select
                    value={birthYear}
                    onChange={(e) =>
                      setBirthYear(
                        e.target.value ? parseInt(e.target.value, 10) : ''
                      )
                    }
                    className="h-11 w-full rounded-[10px] border border-border bg-bg-soft px-3 text-sm text-text transition-colors focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim"
                  >
                    <option value="">{t('profile.selectYear')}</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y} {t('profile.year')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 月 */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-text-dim">{t('profile.month')}</label>
                  <select
                    value={birthMonth}
                    onChange={(e) =>
                      setBirthMonth(
                        e.target.value ? parseInt(e.target.value, 10) : ''
                      )
                    }
                    className="h-11 w-full rounded-[10px] border border-border bg-bg-soft px-3 text-sm text-text transition-colors focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim"
                  >
                    <option value="">{t('profile.selectMonth')}</option>
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} {t('profile.month')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 日 */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-text-dim">{t('profile.day')}</label>
                  <select
                    value={birthDay}
                    onChange={(e) =>
                      setBirthDay(
                        e.target.value ? parseInt(e.target.value, 10) : ''
                      )
                    }
                    disabled={!birthYear || !birthMonth}
                    className="h-11 w-full rounded-[10px] border border-border bg-bg-soft px-3 text-sm text-text transition-colors focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim disabled:opacity-50"
                  >
                    <option value="">{t('profile.selectDay')}</option>
                    {getDayOptions(
                      birthYear || 2000,
                      birthMonth || 1
                    ).map((d) => (
                      <option key={d} value={d}>
                        {d} {t('profile.day')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 年龄显示（只读） */}
              <div className="flex items-center justify-between rounded-[10px] border border-border bg-bg-soft/60 px-4 py-2.5">
                <span className="text-sm text-text-soft">{t('profile.age')}</span>
                <span className="text-sm font-medium text-gold">
                  {age !== null
                    ? t('profile.ageValue', { age })
                    : t('profile.agePlaceholder')}
                </span>
              </div>

              {/* 温馨提示 */}
              <div className="flex items-start gap-2 rounded-[10px] border border-gold-dim/30 bg-gold-soft/20 px-3 py-2.5">
                <Info size={14} className="mt-0.5 shrink-0 text-gold" />
                <p className="text-xs leading-relaxed text-gold/90">
                  {t('profile.birthdayTip')}
                </p>
              </div>
            </Section>
          </div>

          {/* ===== 个人简介 ===== */}
          <div className="mt-4">
            <Section title={t('profile.bio')} icon={FileText}>
              <div className="space-y-2">
                <label
                  htmlFor="profile-bio"
                  className="block text-xs font-medium text-text-soft"
                >
                  {t('profile.bioLabel')}
                  <span className="ml-2 text-text-dim">
                    ({bio.length}/{BIO_MAX_LENGTH})
                  </span>
                </label>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value.slice(0, BIO_MAX_LENGTH));
                    if (formError) setFormError('');
                  }}
                  placeholder={t('profile.bioPlaceholder')}
                  rows={4}
                  maxLength={BIO_MAX_LENGTH}
                  className="w-full resize-none rounded-[10px] border border-border bg-bg-soft px-4 py-3 text-sm text-text placeholder:text-text-dim transition-colors focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim"
                />
              </div>
            </Section>
          </div>

          {/* ===== 表单错误提示 ===== */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-4 flex items-center gap-2 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red"
              >
                <AlertCircle size={14} />
                <span>{formError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== 保存按钮 ===== */}
          <div className="mt-6 flex justify-end gap-3 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push('/')}
            >
              {t('profile.cancel')}
            </Button>
            <Button
              variant="gold"
              size="md"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('profile.saving')}
                </>
              ) : (
                <>
                  <Check size={16} />
                  {t('profile.save')}
                </>
              )}
            </Button>
          </div>
          </section>
        </motion.div>

        {/* ===== Toast 提示 ===== */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={cn(
                'fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-lg',
                toast.type === 'success'
                  ? 'border-gold-dim bg-bg-card text-gold glow-gold'
                  : 'border-red/30 bg-bg-card text-red'
              )}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
