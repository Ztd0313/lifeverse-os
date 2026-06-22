'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Clock,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Eye,
  Loader2,
} from 'lucide-react';
import { FUTURE_COUNCIL_AGENTS } from '@/lib/agents';
import { cn } from '@/lib/utils';
import type { Persona, RadarData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AgentCard } from '@/components/council/AgentCard';
import { TypingText } from '@/components/council/TypingText';
import { RadarChart } from '@/components/charts/RadarChart';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/lib/i18n';
import {
  TimelineExplorer,
  type TimelineBranchData,
} from '@/components/council/TimelineExplorer';
import {
  RegretAnalysis,
  type RegretOption,
} from '@/components/council/RegretAnalysis';

// ===== 当前自己的 Agent（手动定义）=====

const CURRENT_SELF: Persona = {
  id: 'current',
  name: '当前的你',
  nameEn: 'Current Self',
  type: 'time',
  philosophy: '现实、权衡、当下的视角',
  speakingStyle: '冷静、务实、带着犹豫',
  avatar: '🎯',
  model: 'gpt-4o',
  radar: { freedom: 60, wealth: 65, happiness: 70, stability: 75, growth: 72 },
  relationLabel: '你是用户的现在',
};

// 4 个时间自己（按时间顺序）
const TIME_AGENTS: Persona[] = [
  FUTURE_COUNCIL_AGENTS.find((a) => a.id === 'future20')!,
  CURRENT_SELF,
  FUTURE_COUNCIL_AGENTS.find((a) => a.id === 'future50')!,
  FUTURE_COUNCIL_AGENTS.find((a) => a.id === 'future80')!,
];

// ===== Mock 数据 =====

const PRESET_QUESTIONS: string[] = [
  '是否接受海外工作机会？',
  '要不要换行业重新开始？',
  '该不该现在生孩子？',
  '是否结束长期关系？',
  '要不要回国发展？',
  '该不该创业还是继续打工？',
];

interface TimeVoice {
  personaId: string;
  content: string;
}

const MOCK_VOICES: TimeVoice[] = [
  {
    personaId: 'future20',
    content:
      '去啊！为什么不？20 岁的你最怕的不是失败，是没试过。海外工作是一辈子的故事，钱可以再赚，时间不会回来。如果你现在不去，35 岁的你会天天想"如果当初"。',
  },
  {
    personaId: 'current',
    content:
      '我也很纠结。海外机会确实好，但意味着离开父母、推迟买房、放弃现在的稳定关系。每月多赚的 30% 在异国生活成本下可能并不显著。我需要算清楚的不只是钱，还有 5 年后我想要什么样的生活。',
  },
  {
    personaId: 'future50',
    content:
      '作为 50 岁的你，我可以告诉你：职业上的"机会成本"通常被高估，而"关系成本"被严重低估。如果你去海外，5 年后回来，很多关系需要重建。但如果你不去，你会一直遗憾。我的建议是：去，但设一个 3 年期限。',
  },
  {
    personaId: 'future80',
    content:
      '孩子，我回望这一生，最珍贵的不是任何一份工作，而是那些"我敢于离开舒适区"的时刻。海外那 3 年，是你人生中最丰富的章节之一。即使后来回来了，那段经历塑造了你看世界的方式。去吧，别让恐惧替你做决定。',
  },
];

const MOCK_TIMELINE_BRANCHES: TimelineBranchData[] = [
  {
    strategy: 'conservative',
    title: '选择拒绝',
    subtitle: '留在原地，维持现有节奏',
    color: '#5da0e8',
    snapshots: [
      {
        horizon: '1y',
        label: '稳定延续',
        description: '留在原岗位，晋升为高级职位。生活节奏不变，关系稳定。',
        happinessProb: 68,
        regretProb: 35,
        incomeChange: '+15%',
      },
      {
        horizon: '5y',
        label: '路径固化',
        description: '在原行业扎根，成为专家。但偶尔会想"如果当初出去会怎样"。',
        happinessProb: 62,
        regretProb: 48,
        incomeChange: '+45%',
      },
      {
        horizon: '10y',
        label: '中年回望',
        description: '生活安稳，但内心深处有一个未解的"如果"。开始理解选择即是放弃。',
        happinessProb: 65,
        regretProb: 55,
        incomeChange: '+90%',
      },
    ],
  },
  {
    strategy: 'balanced',
    title: '选择接受（3 年期）',
    subtitle: '去海外 3 年，然后评估是否回国',
    color: '#c9a84c',
    snapshots: [
      {
        horizon: '1y',
        label: '适应期',
        description: '初到海外，文化冲击 + 工作压力。孤独感强，但成长飞速。',
        happinessProb: 55,
        regretProb: 28,
        incomeChange: '+30%',
      },
      {
        horizon: '5y',
        label: '视角重塑',
        description: '已回国或转岗。海外经历让你获得稀缺视角，职业跃迁。',
        happinessProb: 78,
        regretProb: 18,
        incomeChange: '+85%',
      },
      {
        horizon: '10y',
        label: '人生财富',
        description: '海外经历成为人生最珍贵的章节之一。视野、人脉、韧性持续复利。',
        happinessProb: 85,
        regretProb: 12,
        incomeChange: '+180%',
      },
    ],
  },
  {
    strategy: 'aggressive',
    title: '选择接受（长期）',
    subtitle: '去海外并长期定居，彻底切换人生轨道',
    color: '#e85d5d',
    snapshots: [
      {
        horizon: '1y',
        label: '剧烈震荡',
        description: '完全脱离原生活。关系断裂风险高，但自由度与可能性最大。',
        happinessProb: 48,
        regretProb: 42,
        incomeChange: '+25%',
      },
      {
        horizon: '5y',
        label: '重新扎根',
        description: '在海外建立新生活。与原关系网疏远，但获得新的归属感。',
        happinessProb: 72,
        regretProb: 32,
        incomeChange: '+120%',
      },
      {
        horizon: '10y',
        label: '另一条人生',
        description: '已是另一个人。回望时既庆幸也感伤——选择了星辰，就放弃了炉火。',
        happinessProb: 75,
        regretProb: 38,
        incomeChange: '+250%',
      },
    ],
  },
];

const MOCK_REFLECTION =
  '孩子，我 80 岁了。回望这一生，我做过很多决定，但最让我后悔的，从来不是那些我做了但失败的事，而是那些我没敢做的事。海外那 3 年，是我人生中最珍贵的章节之一。即使后来回到了原来的城市，那段经历塑造了我看世界的方式。如果你问我后悔什么——我后悔的是当年犹豫了太久，错过了原本可以更早开始的冒险。';

const MOCK_REGRET_OPTIONS: [RegretOption, RegretOption] = [
  {
    label: '接受',
    regretProb: 28,
    primaryRegret: 'speed',
    note: '主要后悔犹豫太久、出发太晚，而非接受本身。',
  },
  {
    label: '拒绝',
    regretProb: 67,
    primaryRegret: 'inaction',
    note: '主要后悔未曾踏出去看世界，遗憾持续放大。',
  },
];

const MOCK_RADAR: RadarData = {
  freedom: 82,
  wealth: 70,
  happiness: 75,
  stability: 48,
  growth: 88,
};

// ===== 阶段定义 =====

type FuturePhase = 'idle' | 'timeline' | 'speaking' | 'regret' | 'report';

// ===== 动画变体 =====

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

// ===== 输入阶段组件 =====

interface InputPhaseProps {
  question: string;
  setQuestion: (q: string) => void;
  onSubmit: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function InputPhase({ question, setQuestion, onSubmit, t }: InputPhaseProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft glow-gold"
        >
          <Clock className="h-8 w-8 text-gold" />
        </motion.div>
        <h1 className="font-serif text-3xl text-text md:text-4xl">
          <span className="text-gradient-gold">{t('future.title')}</span>
        </h1>
        <p className="mt-2 text-sm text-text-soft">
          {t('future.subtitle')}
        </p>
      </div>

      {/* 输入框 */}
      <div className="relative">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('future.placeholder')}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-bg-card p-4 text-base text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              onSubmit();
            }
          }}
        />
        <button
          onClick={onSubmit}
          disabled={!question.trim()}
          className={cn(
            'absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            question.trim()
              ? 'bg-gold text-bg hover:bg-gold-dim glow-gold'
              : 'cursor-not-allowed bg-border text-text-dim'
          )}
        >
          <Send className="h-4 w-4" />
          {t('future.submit')}
        </button>
      </div>

      {/* 预设问题 */}
      <div>
        <p className="mb-3 text-xs text-text-dim">{t('future.presetLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((preset, index) => {
            const translatedPreset = (t(`future.presetQuestions.${index}` as const) || preset) as string;
            return (
            <button
              key={index}
              onClick={() => setQuestion(translatedPreset)}
              className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold card-hover"
            >
              {translatedPreset}
            </button>
            );
          })}
        </div>
      </div>

      {/* 时间自己预览 */}
      <div className="rounded-lg border border-border bg-bg-card/40 p-4">
        <p className="mb-3 text-xs text-text-dim">{t('future.speakersPreview')}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIME_AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col items-center rounded-lg border border-border bg-bg-card p-3 text-center"
            >
              <span className="mb-1 text-3xl">{agent.avatar}</span>
              <span className="text-xs font-medium text-text">{agent.name}</span>
              <span className="mt-0.5 text-xs text-text-dim">
                {agent.philosophy}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ===== 时间自己发言阶段组件 =====

interface SpeakingPhaseProps {
  question: string;
  onComplete: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function SpeakingPhase({ question, onComplete, t }: SpeakingPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const handleComplete = useCallback(() => {
    setCompletedCount((prev) => {
      const next = prev + 1;
      if (next >= TIME_AGENTS.length) {
        // 全部完成，进入下一阶段
        setTimeout(onComplete, 800);
      } else {
        setCurrentIndex(next);
      }
      return next;
    });
  }, [onComplete]);

  const currentAgent = TIME_AGENTS[currentIndex];
  const currentVoice = MOCK_VOICES.find((v) => v.personaId === currentAgent.id);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-3xl space-y-6"
    >
      {/* 议题展示 */}
      <div className="rounded-lg border-l-2 border-gold bg-bg-card/60 p-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-text-dim">
          {t('future.yourDecision')}
        </p>
        <p className="font-serif text-lg text-text">&ldquo;{question}&rdquo;</p>
      </div>

      {/* 进度指示 */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {TIME_AGENTS.map((agent, idx) => (
          <div
            key={agent.id}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all',
              idx === currentIndex
                ? 'border-gold bg-gold-soft/30 glow-gold'
                : idx < currentIndex
                  ? 'border-gold-dim/40 bg-bg-card text-text-soft'
                  : 'border-border bg-bg-card text-text-dim'
            )}
          >
            <span>{agent.avatar}</span>
            <span>{agent.name}</span>
          </div>
        ))}
      </div>

      {/* 当前发言的 Agent 卡片 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAgent.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <AgentCard persona={currentAgent} status="speaking" size="md" />

          {/* 发言内容（打字机效果） */}
          <Card className="w-full max-w-2xl" hover={false}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">{currentAgent.avatar}</span>
              <span className="text-xs font-medium text-text">
                {currentAgent.name}
              </span>
              <span className="text-xs text-text-dim">
                · {currentAgent.philosophy}
              </span>
            </div>
            <div className="min-h-[120px] text-sm leading-relaxed text-text-soft">
              <TypingText
                text={currentVoice?.content || ''}
                speed={45}
                onComplete={handleComplete}
              />
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* 跳过按钮 */}
      {currentIndex < TIME_AGENTS.length && (
        <div className="flex justify-center">
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-1.5 text-xs text-text-dim transition-colors hover:text-gold"
          >
            {t('future.skipSpeech')}
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ===== 未来推演报告组件 =====

interface FutureReportProps {
  question: string;
  onRestart: () => void;
  onViewTimeline: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function FutureReport({ question, onRestart, onViewTimeline, t }: FutureReportProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      {/* 标题 */}
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold-dim bg-gold-soft px-4 py-1.5 text-xs font-medium text-gold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t('future.reportBadge')}</span>
        </div>
        <h1 className="font-serif text-3xl text-text md:text-4xl">
          <span className="text-gradient-gold">{t('future.reportTitle')}</span>
        </h1>
      </div>

      {/* 议题 */}
      <div className="rounded-lg border-l-2 border-gold bg-bg-card/60 p-5">
        <p className="mb-1 text-xs uppercase tracking-wider text-text-dim">
          {t('future.topic')}
        </p>
        <blockquote className="font-serif text-xl text-text">
          &ldquo;{question}&rdquo;
        </blockquote>
      </div>

      {/* 总结 */}
      <Card hover={false}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-dim">
          {t('future.consensus')}
        </h2>
        <p className="text-sm leading-relaxed text-text-soft">
          {t('future.consensusText', { accept: t('future.acceptLabel'), reject: t('future.rejectLabel'), balanced: t('future.balancedLabel') })}
        </p>
      </Card>

      {/* 时间冲突值 + 雷达图 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card hover={false}>
          <h3 className="mb-3 text-sm font-semibold text-text">{t('future.conflictTitle')}</h3>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-text-soft">{t('future.conflict20vsNow')}</span>
                <span className="font-medium text-orange">62</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-orange"
                  initial={{ width: 0 }}
                  animate={{ width: '62%' }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-text-soft">{t('future.conflictNowvs50')}</span>
                <span className="font-medium text-blue">38</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-blue"
                  initial={{ width: 0 }}
                  animate={{ width: '38%' }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-text-soft">{t('future.conflict50vs80')}</span>
                <span className="font-medium text-green">22</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-green"
                  initial={{ width: 0 }}
                  animate={{ width: '22%' }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                />
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-gold-dim/40 bg-gold-soft/10 p-3">
              <p className="text-xs text-text-soft">
                <span className="font-semibold text-gold">{t('future.conflictSummary', { value: 41 })}</span>
              </p>
            </div>
          </div>
        </Card>

        <Card hover={false} className="flex flex-col items-center justify-center">
          <h3 className="mb-3 self-start text-sm font-semibold text-text">
            {t('future.radarTitle')}
          </h3>
          <RadarChart
            data={MOCK_RADAR}
            size={200}
            showLabels={true}
            showGrid={true}
            animated={true}
          />
          <p className="mt-2 text-xs text-text-dim">
            {t('future.radarSubtitle')}
          </p>
        </Card>
      </div>

      {/* 行动建议 */}
      <Card hover={false}>
        <h3 className="mb-3 text-sm font-semibold text-text">{t('future.adviceTitle')}</h3>
        <ul className="space-y-2">
          {[
            t('future.advice1'),
            t('future.advice2'),
            t('future.advice3'),
            t('future.advice4'),
            t('future.advice5'),
          ].map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-text-soft">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[10px] font-bold text-gold">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 免责声明 */}
      <div className="relative overflow-hidden rounded-lg border border-gold-dim/50 bg-gold-soft/30 p-5 text-center">
        <p className="text-sm font-medium text-gold md:text-base">
          {t('future.disclaimer')}
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="secondary"
          onClick={onViewTimeline}
        >
          <Eye className="h-4 w-4" />
          {t('future.viewTimeline')}
        </Button>
        <Button variant="gold" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" />
          {t('future.restart')}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/council">
            <ArrowLeft className="h-4 w-4" />
            {t('future.backCouncil')}
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

// ===== 主页面 =====

export default function FutureCouncilPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const [phase, setPhase] = useState<FuturePhase>('idle');
  const [question, setQuestion] = useState('');

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

  const handleSubmit = () => {
    if (!question.trim()) return;
    setPhase('timeline');
  };

  const handleTimelineDone = () => {
    setPhase('speaking');
  };

  const handleSpeakingComplete = () => {
    setPhase('regret');
  };

  const handleRegretComplete = () => {
    setPhase('report');
  };

  const handleRestart = () => {
    setQuestion('');
    setPhase('idle');
  };

  const handleViewTimeline = () => {
    setPhase('timeline');
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
            <p className="text-sm">{t('common.loading')}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="relative min-h-screen bg-bg">
      {/* 粒子背景 */}
      <ParticleBackground />

      {/* 顶部导航 */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/council')}
            className="inline-flex items-center gap-1.5 text-sm text-text-soft transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('future.backCouncil')}
          </button>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-text">{t('future.headerTitle')}</span>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="relative z-10 px-4 py-8">
        <AnimatePresence mode="wait">
          {/* 输入阶段 */}
          {phase === 'idle' && (
            <InputPhase
              key="input"
              question={question}
              setQuestion={setQuestion}
              onSubmit={handleSubmit}
              t={t}
            />
          )}

          {/* 时间线推演阶段 */}
          {phase === 'timeline' && (
            <motion.div
              key="timeline"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto w-full max-w-4xl space-y-6"
            >
              <div className="text-center">
                <h2 className="font-serif text-2xl text-text md:text-3xl">
                  <span className="text-gradient-gold">{t('future.timelineTitle')}</span>
                  </h2>
                  <p className="mt-2 text-sm text-text-soft">
                    {t('future.timelineSubtitle')}
                </p>
              </div>
              <TimelineExplorer branches={MOCK_TIMELINE_BRANCHES} />
              <div className="flex justify-center">
                <Button variant="gold" onClick={handleTimelineDone}>
                  {t('future.summonVoices')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* 4 个时间自己发言阶段 */}
          {phase === 'speaking' && (
            <SpeakingPhase
              key="speaking"
              question={question}
              onComplete={handleSpeakingComplete}
              t={t}
            />
          )}

          {/* 后悔分析阶段 */}
          {phase === 'regret' && (
            <motion.div
              key="regret"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto w-full max-w-3xl space-y-6"
            >
              <RegretAnalysis
                reflection={MOCK_REFLECTION}
                options={MOCK_REGRET_OPTIONS}
              />
              <div className="flex justify-center">
                <Button variant="gold" onClick={handleRegretComplete}>
                  {t('future.generateReport')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* 报告阶段 */}
          {phase === 'report' && (
            <FutureReport
              key="report"
              question={question}
              onRestart={handleRestart}
              onViewTimeline={handleViewTimeline}
              t={t}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
