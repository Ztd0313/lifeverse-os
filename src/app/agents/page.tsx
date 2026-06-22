'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Bot,
  Loader2,
  Sparkles,
  AlertCircle,
  Lock,
  Crown,
} from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AgentForm } from '@/components/agent/AgentForm';
import { fadeInUp, staggerContainer, cardItem } from '@/lib/motion/variants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useAgentStore,
  MAX_CUSTOM_AGENTS,
  type CustomAgent,
  type CustomAgentInput,
} from '@/stores/agent-store';
import { useMembershipStore } from '@/stores/membership-store';
import { getTotalAgentSeats, getTierConfig } from '@/types/membership';
import { MembershipBadge } from '@/components/membership/MembershipBadge';
import { DIALOGUE_STYLE_LABELS } from '@/lib/ai/agent-templates';
import { cn, formatDate } from '@/lib/utils';

/**
 * 自定义 Agent 卡片
 *
 * 展示单个自定义 Agent 的信息，支持编辑和删除。
 */
interface AgentCardProps {
  agent: CustomAgent;
  index: number;
  onEdit: (agent: CustomAgent) => void;
  onDelete: (agent: CustomAgent) => void;
}

function AgentCardItem({ agent, index, onEdit, onDelete }: AgentCardProps) {
  return (
    <motion.div variants={cardItem}>
      <Card className="group card-hover flex h-full flex-col gap-4">
        {/* 头部：头像 + 名称 */}
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gold-dim bg-gold-soft text-3xl transition-all duration-300 group-hover:shadow-[0_0_20px_var(--shadow-gold-strong)]">
            <span aria-hidden="true">{agent.avatar}</span>
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-base font-semibold text-text">
              {agent.name}
            </h3>
            <p className="text-xs font-medium text-gold">
              自定义成员
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="gold">{agent.expertise}</Badge>
              <Badge variant="blue">
                {DIALOGUE_STYLE_LABELS[agent.dialogueStyle]}
              </Badge>
            </div>
          </div>
        </div>

        {/* 性格描述 */}
        <div className="flex-1">
          <span className="text-xs text-text-dim">性格</span>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-soft">
            {agent.personality}
          </p>
        </div>

        {/* 核心理念 */}
        <div>
          <span className="text-xs text-text-dim">核心理念</span>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-soft">
            {agent.coreBelief}
          </p>
        </div>

        {/* 创建时间 */}
        <div className="text-[10px] text-text-dim">
          创建于 {formatDate(new Date(agent.createdAt).getTime())}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 border-t border-border pt-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(agent)}
          >
            <Edit3 className="h-3.5 w-3.5" />
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red hover:text-red hover:bg-[rgba(232,93,93,0.1)]"
            onClick={() => onDelete(agent)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * 空状态组件
 *
 * 引导用户创建第一个自定义 Agent。
 */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex flex-col items-center justify-center gap-6 rounded-[14px] border border-dashed border-border bg-bg-card/40 py-20"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-soft glow-gold"
      >
        <Bot className="h-10 w-10 text-gold" />
      </motion.div>

      <div className="text-center">
        <h3 className="h-title text-2xl text-text">
          还没有自定义 Agent
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-text-soft">
          为你的智慧议会打造专属成员。
          <br />
          定义TA的性格、专业领域和核心理念，让议会讨论更加个性化。
        </p>
      </div>

      <Button variant="gold" size="lg" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        创建第一个 Agent
      </Button>
    </motion.div>
  );
}

/**
 * 自定义 Agent 管理页面
 *
 * 功能：
 * - 展示用户已创建的自定义 Agent 列表（卡片式）
 * - "创建新 Agent" 按钮
 * - 每个 Agent 卡片：头像、名称、性格标签、专业领域、编辑/删除按钮
 * - 空状态：引导用户创建第一个 Agent
 * - 需要登录
 *
 * 设计：
 * - 暗色 + 金色主题
 * - framer-motion 动画
 * - 粒子背景
 */
export default function AgentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const {
    customAgents,
    isLoading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    loadFromStorage,
  } = useAgentStore();
  const { membership } = useMembershipStore();
  const totalSeats = getTotalAgentSeats(membership);
  const usedSeats = customAgents.length;
  const remainingSeats = totalSeats - usedSeats;
  const tierConfig = getTierConfig(membership.tier);

  // 表单弹窗状态
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] = React.useState<CustomAgent | null>(
    null
  );
  // 删除确认弹窗
  const [deleteTarget, setDeleteTarget] = React.useState<CustomAgent | null>(
    null
  );
  // 操作提示
  const [toast, setToast] = React.useState<{
    type: 'success' | 'error';
    message: string;
    link?: { href: string; label: string };
  } | null>(null);

  /** 首次加载时校验登录态 */
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /** 已登录时加载自定义 Agent */
  React.useEffect(() => {
    if (isAuthenticated) {
      loadFromStorage();
    }
  }, [isAuthenticated, loadFromStorage]);

  /** 未登录时重定向到登录页 */
  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthenticated, router, pathname]);

  /** 显示提示 toast */
  const showToast = (
    type: 'success' | 'error',
    message: string,
    link?: { href: string; label: string }
  ) => {
    setToast({ type, message, link });
    window.setTimeout(() => setToast(null), 3000);
  };

  /** 打开创建表单 */
  const handleOpenCreate = () => {
    setEditingAgent(null);
    setFormOpen(true);
  };

  /** 打开编辑表单 */
  const handleOpenEdit = (agent: CustomAgent) => {
    setEditingAgent(agent);
    setFormOpen(true);
  };

  /** 保存（创建或更新） */
  const handleSave = (data: CustomAgentInput) => {
    if (editingAgent) {
      updateAgent(editingAgent.id, data);
      showToast('success', `Agent「${data.name}」已更新`);
    } else {
      if (usedSeats >= totalSeats) {
        showToast('error', '席位已满，请升级会员或购买席位', {
          href: '/membership',
          label: '前往会员中心',
        });
        return;
      }
      const created = createAgent(data);
      if (created) {
        showToast('success', `Agent「${data.name}」已创建`);
      } else {
        showToast('error', error || '创建失败，可能已达上限');
      }
    }
  };

  /** 确认删除 */
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    deleteAgent(deleteTarget.id);
    setDeleteTarget(null);
    showToast('success', `Agent「${name}」已删除`);
  };

  // 登录态校验中，显示加载状态
  if (!isInitialized || !isAuthenticated) {
    return (
      <>
        <ParticleBackground />
        <Header />
        <main className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-text-soft">
            <Loader2 size={32} className="animate-spin text-gold" />
            <p className="text-sm">正在验证登录状态...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ParticleBackground />
      <Header />

      <main className="relative z-10 min-h-screen px-6 pb-24 pt-24">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mx-auto flex max-w-6xl flex-col gap-8"
        >
          {/* ===== 顶部导航 ===== */}
          <motion.div variants={fadeInUp} className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Link>
            </Button>
          </motion.div>

          {/* ===== Hero 区域 ===== */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Badge variant="gold" className="px-4 py-1 text-xs tracking-widest">
              <Sparkles className="mr-1.5 h-3 w-3" />
              My Agents
            </Badge>

            <h1 className="h-display text-4xl text-gradient-gold sm:text-5xl md:text-6xl">
              我的 Agent
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-text-soft sm:text-lg">
              打造属于你的专属议会成员，定义TA们的性格、专业与信念
            </p>
          </motion.div>

          {/* ===== 会员信息横幅 ===== */}
          <motion.div variants={fadeInUp}>
            <Card className="card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <MembershipBadge tier={membership.tier} size="md" showIcon />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-soft">Agent 席位:</span>
                    <span className="font-semibold text-text">
                      {usedSeats} / {totalSeats}
                    </span>
                    {remainingSeats > 0 ? (
                      <Badge variant="green">还可创建 {remainingSeats} 个</Badge>
                    ) : (
                      <Badge variant="red">席位已满</Badge>
                    )}
                  </div>
                  {/* 进度条 */}
                  <div className="h-1.5 w-44 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{
                        width: `${
                          totalSeats > 0
                            ? Math.min(100, (usedSeats / totalSeats) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-text-dim">
                    {tierConfig.name}赠送 {tierConfig.agentSeats} 席
                    {membership.purchasedSeats > 0 &&
                      ` · 已购买 ${membership.purchasedSeats} 席`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {membership.tier === 'free' && remainingSeats <= 0 ? (
                  <Button asChild variant="gold" size="sm" className="interactive">
                    <Link href="/membership">
                      <Crown className="h-3.5 w-3.5" />
                      升级会员获得更多席位
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="ghost" size="sm" className="interactive">
                    <Link href="/membership">
                      <Plus className="h-3.5 w-3.5" />
                      购买席位
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>

          {/* ===== 统计 + 创建按钮 ===== */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center justify-between gap-4 sm:flex-row"
          >
            <div className="flex items-center gap-3 text-sm text-text-soft">
              <Bot className="h-5 w-5 text-gold" />
              <span>
                已创建{' '}
                <span className="font-semibold text-text">
                  {usedSeats}
                </span>{' '}
                / {totalSeats} 个自定义 Agent
              </span>
            </div>

            {remainingSeats > 0 ? (
              <Button
                variant="gold"
                size="md"
                onClick={handleOpenCreate}
                className="interactive"
              >
                <Plus className="h-4 w-4" />
                创建新 Agent
              </Button>
            ) : (
              <Button
                asChild
                variant="secondary"
                size="md"
                className="interactive cursor-not-allowed opacity-70"
                title="席位已满，升级会员或购买席位"
              >
                <Link href="/membership">
                  <Lock className="h-4 w-4" />
                  席位已满，升级会员或购买席位
                </Link>
              </Button>
            )}
          </motion.div>

          {/* ===== 错误提示 ===== */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-[rgba(232,93,93,0.3)] bg-[rgba(232,93,93,0.08)] px-4 py-3 text-sm text-red"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* ===== Agent 列表 ===== */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : customAgents.length === 0 ? (
            <EmptyState onCreate={handleOpenCreate} />
          ) : (
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {customAgents.map((agent, index) => (
                <AgentCardItem
                  key={agent.id}
                  agent={agent}
                  index={index}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </motion.div>
          )}

          {/* ===== 底部引用 ===== */}
          <motion.blockquote
            variants={fadeInUp}
            className="mx-auto mt-8 max-w-2xl text-center"
          >
            <p className="h-title text-xl leading-relaxed text-text-soft sm:text-2xl">
              &ldquo;每个人心中都有一位智者，等待被唤醒。&rdquo;
            </p>
          </motion.blockquote>
        </motion.div>
      </main>

      {/* ===== 创建/编辑表单弹窗 ===== */}
      <AgentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initialAgent={editingAgent}
      />

      {/* ===== 删除确认弹窗 ===== */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除 Agent"
        message={
          <>
            确定要删除 Agent「
            <span className="font-semibold text-text">
              {deleteTarget?.name}
            </span>
            」吗？此操作不可恢复。
          </>
        }
        variant="danger"
        confirmText="确认删除"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ===== Toast 提示 ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-lg border px-4 py-2 text-sm shadow-lg',
              toast.type === 'success'
                ? 'border-gold-dim bg-bg-card text-gold glow-gold'
                : 'border-[rgba(232,93,93,0.3)] bg-bg-card text-red'
            )}
          >
            {toast.message}
            {toast.link && (
              <Link
                href={toast.link.href}
                className="ml-2 font-medium underline underline-offset-2 hover:opacity-80"
              >
                {toast.link.label}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
