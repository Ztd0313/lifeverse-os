'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Share2, FileX } from 'lucide-react';
import { useCouncilStore } from '@/stores/council-store';
import DestinyReport from '@/components/council/DestinyReport';
import type { DestinyReport as DestinyReportType } from '@/types';

// ===== Mock report for demo (when not found in store) =====

function createDemoReport(id: string): DestinyReportType {
  return {
    id,
    councilId: `council-${id}`,
    question: '要不要辞职创业？',
    summary:
      '议会建议采取"渐进式创业"策略：保留主业现金流，用业余时间验证创业想法。设定6个月期限，当副业收入达到主业50%时再考虑全职转型。同时注意心理健康和家庭关系的平衡。',
    dimensions: [
      {
        title: '风险分析',
        content:
          '直接辞职创业的风险极高，90%的初创企业在3年内失败。主要风险包括：资金链断裂、市场验证不足、心理压力过大。建议通过兼职创业降低风险，保留稳定收入来源。',
        icon: 'warning',
      },
      {
        title: '后悔概率',
        content:
          '从未尝试的后悔概率（78%）显著高于尝试后失败的后悔概率（35%）。65岁以上人群的调查显示，最常见的遗憾是"过于保守，未追求梦想"。',
        icon: 'rewind',
      },
      {
        title: '长期收益',
        content:
          '即使创业失败，获得的经验、人脉和抗压能力将在未来5-10年持续产生价值。成功创业的长期财务回报可达当前收入的3-10倍，但概率约为10-15%。',
        icon: 'trending-up',
      },
      {
        title: '幸福指数',
        content:
          '追求热爱的事业能显著提升主观幸福感，但财务压力会抵消部分收益。建议确保6个月以上的生活储备金后再启动，以维持心理安全感。',
        icon: 'heart',
      },
      {
        title: '建议行动',
        content:
          '1. 保留主业，每周投入20+小时验证想法；2. 6个月内完成MVP并获得首批付费用户；3. 储备12个月生活费；4. 与家人充分沟通，获得支持；5. 设定明确的退出标准。',
        icon: 'lightbulb',
      },
      {
        title: '各方共识',
        content:
          '7位智者中6位同意"渐进式创业"方案。马斯克和乔布斯强调行动力，巴菲特和芒格强调风险控制，苏格拉底和王阳明强调内心觉察，庄子提醒保持心态灵活。',
        icon: 'handshake',
      },
    ],
    indices: {
      conflict: 72,
      growth: 85,
      happiness: 68,
      freedom: 90,
      stability: 42,
    },
    radar: { freedom: 90, wealth: 55, happiness: 68, stability: 42, growth: 85 },
    consensusPoints: [
      '采取渐进式创业策略，而非直接辞职',
      '设定6个月验证期限，有明确进展再全职',
      '储备12个月生活费作为安全网',
      '每周至少投入20小时在创业项目上',
      '与家人充分沟通，获得情感支持',
    ],
    disclaimer: '最终决定权，属于你。议会只提供视角，不替你做选择。',
    timestamp: Date.now(),
  };
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { report: storeReport } = useCouncilStore();
  const [report, setReport] = useState<DestinyReportType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [shared, setShared] = useState(false);

  const reportId = params?.id as string;

  useEffect(() => {
    // Try to get from store first
    if (storeReport && storeReport.id === reportId) {
      setReport(storeReport);
    } else if (reportId) {
      // Try localStorage
      try {
        const stored = localStorage.getItem(`lifeverse-report-${reportId}`);
        if (stored) {
          setReport(JSON.parse(stored) as DestinyReportType);
        } else {
          // Use demo report for preview
          setReport(createDemoReport(reportId));
        }
      } catch {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
  }, [reportId, storeReport]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: '人生命运报告 - LifeVerse',
          text: report?.question || '查看我的命运报告',
          url: window.location.href,
        })
        .catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleSave = () => {
    if (report && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `lifeverse-report-${report.id}`,
          JSON.stringify(report)
        );
      } catch {
        // Storage might be full or unavailable
      }
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg">
        <FileX className="mb-4 h-16 w-16 text-text-dim" />
        <p className="mb-4 text-lg text-text-soft">报告未找到</p>
        <button
          onClick={() => router.push('/council')}
          className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-bg hover:bg-gold-dim"
        >
          返回议会
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm text-text-dim"
        >
          加载报告中...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-end px-4 py-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-soft transition-colors hover:border-gold-dim hover:text-gold"
          >
            <Share2 className="h-4 w-4" />
            {shared ? '已复制链接' : '分享'}
          </button>
        </div>
      </header>

      {/* Report content */}
      <main className="px-4 py-8">
        <DestinyReport
          report={report}
          onShare={handleShare}
          onSave={handleSave}
          onNewCouncil={() => router.push('/council')}
        />
      </main>
    </div>
  );
}
