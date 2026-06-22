'use client';

import { useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Globe, Loader2 } from 'lucide-react';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { PlanetNav } from '@/components/memory/PlanetNav';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryUpload } from '@/components/memory/MemoryUpload';
import { MemoryDetail } from '@/components/memory/MemoryDetail';
import { MemoryDialogue } from '@/components/memory/MemoryDialogue';
import { useMemoryStore } from '@/stores/memory-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  pageTransition,
  staggerContainer,
  fadeInUp,
} from '@/lib/motion/variants';
import { getPlanetMeta } from '@/lib/mock-memories';
import { useTranslation } from '@/lib/i18n';

/**
 * 记忆星球（Memory Planet）页面
 *
 * 结构：
 * 1. ParticleBackground + Header（全局）
 * 2. 顶部区域：标题"记忆星球 Memory Planet" + 副标题"让过去有形状"
 * 3. 星球导航：5 个星球标签（可点击切换）
 * 4. 记忆上传区：拖拽上传区域 + "记录此刻"按钮
 * 5. 记忆列表：当前星球的记忆卡片网格
 * 6. 记忆详情弹窗：点击记忆卡片弹出详情
 *
 * 深色主题，金色点缀。使用 Framer Motion 动画。
 */
export default function MemoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const {
    memories,
    selectedPlanet,
    selectedMemory,
    isUploadOpen,
    dialogueMemory,
    selectPlanet,
    selectMemory,
    closeDetail,
    addMemory,
    openUpload,
    closeUpload,
    openDialogue,
    closeDialogue,
    fetchFromServer,
  } = useMemoryStore();

  /** 首次加载时校验登录态 */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /** 未登录时重定向到登录页 */
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthenticated, router, pathname]);

  /** 首次加载时从服务器同步数据 */
  useEffect(() => {
    if (isAuthenticated) {
      fetchFromServer();
    }
  }, [fetchFromServer, isAuthenticated]);

  /** 当前星球的记忆列表 */
  const planetMemories = useMemo(
    () => memories.filter((m) => m.category === selectedPlanet),
    [memories, selectedPlanet]
  );

  /** 当前星球元信息 */
  const currentPlanet = getPlanetMeta(selectedPlanet);

  // 登录态校验中，显示加载状态
  if (!isInitialized || !isAuthenticated) {
    return (
      <>
        <ParticleBackground />
        <Header />
        <main className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-text-soft">
            <Loader2 size={32} className="animate-spin text-gold" />
            <p className="text-sm">{t('memory.verifying')}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* 全屏粒子背景 */}
      <ParticleBackground />

      {/* 全局头部导航 */}
      <Header />

      {/* 页面主体 */}
      <motion.main
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 min-h-screen px-4 pb-16 pt-24 sm:px-6"
      >
        <div className="mx-auto max-w-6xl space-y-10">
          {/* ===== 1. 顶部区域 ===== */}
          <motion.section
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-dim bg-gold-soft/30 px-4 py-1.5">
              <Globe size={14} className="text-gold" />
              <span className="text-[11px] font-medium text-gold">
                Memory Planet
              </span>
            </div>

            <h1 className="font-serif text-4xl text-text sm:text-5xl">
              <span className="text-gradient-gold">{t('memory.title')}</span>
            </h1>
            <p className="mt-3 text-sm text-text-soft sm:text-base">
              {t('memory.subtitle')}
            </p>

            {/* 当前星球描述 */}
            {currentPlanet && (
              <motion.div
                key={selectedPlanet}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 inline-flex items-center gap-2 text-xs text-text-dim"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: currentPlanet.color }}
                />
                {currentPlanet.name} · {currentPlanet.description}
              </motion.div>
            )}
          </motion.section>

          {/* ===== 2. 星球导航 ===== */}
          <section>
            <PlanetNav
              selectedPlanet={selectedPlanet}
              onSelectPlanet={selectPlanet}
              memories={memories}
            />
          </section>

          {/* ===== 3. 记忆上传区 ===== */}
          <section>
            <MemoryUpload
              onAddMemory={addMemory}
              isOpen={isUploadOpen}
              onClose={closeUpload}
            />
            {/* 隐藏的触发按钮（让 store 也能控制弹窗） */}
            <button
              type="button"
              onClick={openUpload}
              className="sr-only"
              aria-label={t('memory.openRecordForm')}
            >
              <Sparkles size={16} />
              {t('memory.recordNow')}
            </button>
          </section>

          {/* ===== 4. 记忆列表 ===== */}
          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-xl text-text">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: currentPlanet?.color }}
                  />
                  {currentPlanet?.name}{t('memory.memoriesOf')}
                </h2>
                <p className="mt-1 text-xs text-text-dim">
                  {t('memory.memoryCount', { count: planetMemories.length })}
                </p>
              </div>
            </div>

            {planetMemories.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                key={selectedPlanet}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {planetMemories.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onClick={selectMemory}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-bg-card/40 py-16 text-center"
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-soft">
                  <Sparkles size={20} className="text-text-dim" />
                </span>
                <p className="text-sm text-text-soft">
                  {t('memory.emptyTitle')}
                </p>
                <p className="mt-1 text-xs text-text-dim">
                  {t('memory.emptyHint')}
                </p>
              </motion.div>
            )}
          </section>
        </div>

        {/* ===== 5. 记忆详情弹窗 ===== */}
        <MemoryDetail
          memory={selectedMemory}
          onClose={closeDetail}
          onOpenDialogue={openDialogue}
        />

        {/* ===== 6. 记忆对话弹窗 ===== */}
        <MemoryDialogue memory={dialogueMemory} onClose={closeDialogue} />
      </motion.main>
    </>
  );
}
