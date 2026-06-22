'use client';

import * as React from 'react';
import {
  CreditCard,
  DollarSign,
  Users,
  TrendingUp,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminModal } from '@/components/admin/AdminModal';
import { BarChart } from '@/components/admin/SimpleChart';
import { formatDate } from '@/lib/utils';
import type { PaymentMethod, PaymentStatus } from '@/stores/marketplace-store';

// ===== 类型定义 =====

/**
 * 管理后台付费记录
 */
interface AdminPaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string; // ISO date
}

// ===== Mock 数据 =====

const MOCK_PAYMENT_RECORDS: AdminPaymentRecord[] = [
  {
    id: 'p-001',
    orderId: 'ord-20260622-001',
    userId: 'u-001',
    userName: '林深',
    userAvatar: '🦊',
    agentId: 'davinci',
    agentName: '达芬奇',
    agentAvatar: '🎨',
    amount: 19,
    method: 'wechat',
    status: 'success',
    paidAt: '2026-06-22T10:24:00+08:00',
  },
  {
    id: 'p-002',
    orderId: 'ord-20260622-002',
    userId: 'u-003',
    userName: '夜行者',
    userAvatar: '🦉',
    agentId: 'inamori',
    agentName: '稻盛和夫',
    agentAvatar: '🏯',
    amount: 25,
    method: 'alipay',
    status: 'success',
    paidAt: '2026-06-22T09:15:00+08:00',
  },
  {
    id: 'p-003',
    orderId: 'ord-20260622-003',
    userId: 'u-006',
    userName: '清风',
    userAvatar: '🍃',
    agentId: 'einstein',
    agentName: '爱因斯坦',
    agentAvatar: '🔬',
    amount: 19,
    method: 'wechat',
    status: 'success',
    paidAt: '2026-06-22T08:42:00+08:00',
  },
  {
    id: 'p-004',
    orderId: 'ord-20260622-004',
    userId: 'u-008',
    userName: '月白',
    userAvatar: '🌙',
    agentId: 'dalio',
    agentName: '达利欧',
    agentAvatar: '🌊',
    amount: 25,
    method: 'credit_card',
    status: 'success',
    paidAt: '2026-06-22T07:30:00+08:00',
  },
  {
    id: 'p-005',
    orderId: 'ord-20260621-005',
    userId: 'u-002',
    userName: '海蓝',
    userAvatar: '🐳',
    agentId: 'jung',
    agentName: '荣格',
    agentAvatar: '🔑',
    amount: 19,
    method: 'wechat',
    status: 'success',
    paidAt: '2026-06-21T22:18:00+08:00',
  },
  {
    id: 'p-006',
    orderId: 'ord-20260621-006',
    userId: 'u-009',
    userName: '炽翼',
    userAvatar: '🔥',
    agentId: 'nietzsche',
    agentName: '尼采',
    agentAvatar: '⚡',
    amount: 15,
    method: 'alipay',
    status: 'success',
    paidAt: '2026-06-21T20:05:00+08:00',
  },
  {
    id: 'p-007',
    orderId: 'ord-20260621-007',
    userId: 'u-001',
    userName: '林深',
    userAvatar: '🦊',
    agentId: 'confucius',
    agentName: '孔子',
    agentAvatar: '📜',
    amount: 15,
    method: 'wechat',
    status: 'success',
    paidAt: '2026-06-21T18:42:00+08:00',
  },
  {
    id: 'p-008',
    orderId: 'ord-20260621-008',
    userId: 'u-004',
    userName: '向阳',
    userAvatar: '🌻',
    agentId: 'zhangailing',
    agentName: '张爱玲',
    agentAvatar: '🖋️',
    amount: 15,
    method: 'credit_card',
    status: 'failed',
    paidAt: '2026-06-21T15:20:00+08:00',
  },
  {
    id: 'p-009',
    orderId: 'ord-20260620-009',
    userId: 'u-006',
    userName: '清风',
    userAvatar: '🍃',
    agentId: 'munger',
    agentName: '芒格',
    agentAvatar: '🧠',
    amount: 19,
    method: 'wechat',
    status: 'success',
    paidAt: '2026-06-20T23:55:00+08:00',
  },
  {
    id: 'p-010',
    orderId: 'ord-20260620-010',
    userId: 'u-008',
    userName: '月白',
    userAvatar: '🌙',
    agentId: 'zhuangzi',
    agentName: '庄子',
    agentAvatar: '🦋',
    amount: 19,
    method: 'alipay',
    status: 'success',
    paidAt: '2026-06-20T19:30:00+08:00',
  },
  {
    id: 'p-011',
    orderId: 'ord-20260620-011',
    userId: 'u-003',
    userName: '夜行者',
    userAvatar: '🦉',
    agentId: 'future80',
    agentName: '80岁的自己',
    agentAvatar: '🌅',
    amount: 15,
    method: 'wechat',
    status: 'refunded',
    paidAt: '2026-06-20T16:14:00+08:00',
  },
  {
    id: 'p-012',
    orderId: 'ord-20260620-012',
    userId: 'u-002',
    userName: '海蓝',
    userAvatar: '🐳',
    agentId: 'davinci',
    agentName: '达芬奇',
    agentAvatar: '🎨',
    amount: 19,
    method: 'credit_card',
    status: 'success',
    paidAt: '2026-06-20T10:42:00+08:00',
  },
  {
    id: 'p-013',
    orderId: 'ord-20260619-013',
    userId: 'u-009',
    userName: '炽翼',
    userAvatar: '🔥',
    agentId: 'inamori',
    agentName: '稻盛和夫',
    agentAvatar: '🏯',
    amount: 25,
    method: 'alipay',
    status: 'success',
    paidAt: '2026-06-19T21:25:00+08:00',
  },
  {
    id: 'p-014',
    orderId: 'ord-20260619-014',
    userId: 'u-001',
    userName: '林深',
    userAvatar: '🦊',
    agentId: 'einstein',
    agentName: '爱因斯坦',
    agentAvatar: '🔬',
    amount: 19,
    method: 'wechat',
    status: 'success',
    paidAt: '2026-06-19T14:50:00+08:00',
  },
  {
    id: 'p-015',
    orderId: 'ord-20260619-015',
    userId: 'u-005',
    userName: '山客',
    userAvatar: '🏔️',
    agentId: 'jung',
    agentName: '荣格',
    agentAvatar: '🔑',
    amount: 19,
    method: 'wechat',
    status: 'success',
    paidAt: '2026-06-19T09:18:00+08:00',
  },
];

// ===== 统计计算 =====

function calculateStats(records: AdminPaymentRecord[]) {
  const successfulRecords = records.filter((r) => r.status === 'success');
  const totalRevenue = successfulRecords.reduce((sum, r) => sum + r.amount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = successfulRecords.filter((r) =>
    r.paidAt.startsWith(today)
  );
  const todayRevenue = todayRecords.reduce((sum, r) => sum + r.amount, 0);
  const paidUsers = new Set(successfulRecords.map((r) => r.userId)).size;
  const totalUsers = 1286; // mock 总用户数
  const conversionRate = ((paidUsers / totalUsers) * 100).toFixed(1);
  const refundCount = records.filter((r) => r.status === 'refunded').length;

  return {
    totalRevenue,
    todayRevenue,
    paidUsers,
    conversionRate,
    refundCount,
    totalOrders: records.length,
  };
}

function calculateAgentRank(records: AdminPaymentRecord[]) {
  const rankMap = new Map<
    string,
    { agentId: string; agentName: string; agentAvatar: string; sales: number; revenue: number }
  >();

  records
    .filter((r) => r.status === 'success')
    .forEach((r) => {
      const existing = rankMap.get(r.agentId);
      if (existing) {
        existing.sales += 1;
        existing.revenue += r.amount;
      } else {
        rankMap.set(r.agentId, {
          agentId: r.agentId,
          agentName: r.agentName,
          agentAvatar: r.agentAvatar,
          sales: 1,
          revenue: r.amount,
        });
      }
    });

  return Array.from(rankMap.values()).sort((a, b) => b.sales - a.sales);
}

// ===== 支付方式/状态映射 =====

const METHOD_LABELS: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  credit_card: '信用卡',
};

const METHOD_ICONS: Record<PaymentMethod, string> = {
  wechat: '💬',
  alipay: '💰',
  credit_card: '💳',
};

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: 'gold' | 'green' | 'red' | 'orange' }
> = {
  pending: { label: '处理中', variant: 'gold' },
  success: { label: '成功', variant: 'green' },
  failed: { label: '失败', variant: 'red' },
  refunded: { label: '已退款', variant: 'orange' },
};

/**
 * 付费管理页面
 *
 * 功能：
 * - 付费数据统计：总收入、今日收入、付费用户数、转化率
 * - 付费记录表格（用户、Agent、金额、支付方式、时间、状态）
 * - Agent 销量排行
 * - 退款管理
 */
export default function AdminPaymentsPage() {
  const [records, setRecords] = React.useState<AdminPaymentRecord[]>(MOCK_PAYMENT_RECORDS);
  const [refundTarget, setRefundTarget] = React.useState<AdminPaymentRecord | null>(null);

  const stats = React.useMemo(() => calculateStats(records), [records]);
  const agentRank = React.useMemo(() => calculateAgentRank(records), [records]);

  // 退款
  const handleRefund = () => {
    if (!refundTarget) return;
    setRecords((prev) =>
      prev.map((r) =>
        r.id === refundTarget.id ? { ...r, status: 'refunded' as const } : r
      )
    );
    setRefundTarget(null);
  };

  // 表格列定义
  const columns: DataTableColumn<AdminPaymentRecord>[] = [
    {
      key: 'orderId',
      title: '订单号',
      width: '160px',
      render: (row) => (
        <span className="font-mono text-xs text-text-soft">{row.orderId}</span>
      ),
    },
    {
      key: 'userName',
      title: '用户',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-base">{row.userAvatar}</span>
          <span className="text-text">{row.userName}</span>
        </div>
      ),
    },
    {
      key: 'agentName',
      title: 'Agent',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-base">{row.agentAvatar}</span>
          <span className="text-text">{row.agentName}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '金额',
      width: '100px',
      sortable: true,
      sorter: (a, b) => a.amount - b.amount,
      render: (row) => (
        <span className="font-serif font-semibold text-gold">¥{row.amount}</span>
      ),
    },
    {
      key: 'method',
      title: '支付方式',
      width: '120px',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-text-soft">
          <span>{METHOD_ICONS[row.method]}</span>
          {METHOD_LABELS[row.method]}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (row) => {
        const config = STATUS_CONFIG[row.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'paidAt',
      title: '时间',
      width: '140px',
      sortable: true,
      sorter: (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime(),
      render: (row) => (
        <span className="text-text-dim">
          {formatDate(new Date(row.paidAt).getTime())}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '80px',
      render: (row) => (
        <>
          {row.status === 'success' && (
            <button
              type="button"
              onClick={() => setRefundTarget(row)}
              className="inline-flex items-center gap-1 rounded border border-orange/30 bg-[rgba(232,160,93,0.1)] px-2 py-1 text-xs text-orange transition-colors hover:bg-[rgba(232,160,93,0.2)]"
            >
              <RotateCcw className="h-3 w-3" />
              退款
            </button>
          )}
        </>
      ),
    },
  ];

  // 销量排行柱状图数据
  const rankChartData = agentRank.slice(0, 8).map((a) => ({
    label: a.agentName,
    value: a.sales,
  }));

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-text">付费管理</h1>
          <p className="mt-1 text-sm text-text-soft">
            收入统计 · 付费记录 · Agent 销量 · 退款管理
          </p>
        </div>
        <CreditCard className="h-6 w-6 text-text-dim" />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总收入"
          value={`¥${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={15.3}
          trendLabel="较上周"
          color="gold"
        />
        <StatCard
          title="今日收入"
          value={`¥${stats.todayRevenue.toLocaleString()}`}
          icon={TrendingUp}
          trend={8.7}
          trendLabel="较昨日"
          color="green"
        />
        <StatCard
          title="付费用户数"
          value={stats.paidUsers.toLocaleString()}
          icon={Users}
          trend={12.1}
          trendLabel="较上周"
          color="blue"
        />
        <StatCard
          title="转化率"
          value={`${stats.conversionRate}%`}
          icon={CreditCard}
          trend={2.4}
          trendLabel="较上月"
          color="orange"
        />
      </div>

      {/* 销量排行 + 柱状图 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Agent 销量柱状图 */}
        <div className="rounded-lg border border-border bg-bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text">Agent 销量趋势</h2>
              <p className="text-xs text-text-dim">各 Agent 销售数量对比</p>
            </div>
            <TrendingUp className="h-4 w-4 text-gold" />
          </div>
          <BarChart data={rankChartData} height={240} />
        </div>

        {/* Agent 销量排行 */}
        <div className="rounded-lg border border-border bg-bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Agent 销量排行</h2>
            <Trophy className="h-4 w-4 text-gold" />
          </div>
          <div className="space-y-2.5">
            {agentRank.slice(0, 6).map((agent, index) => (
              <div
                key={agent.agentId}
                className="flex items-center gap-3 rounded-lg border border-border-soft bg-bg-soft px-3 py-2 transition-colors hover:border-gold-dim"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                    index === 0
                      ? 'bg-gold text-bg'
                      : index === 1
                        ? 'bg-[#9a9a9a] text-bg'
                        : index === 2
                          ? 'bg-[#b87333] text-bg'
                          : 'bg-bg-card text-text-soft'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-lg">{agent.agentAvatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-text">{agent.agentName}</p>
                  <p className="text-[11px] text-text-dim">
                    售出 {agent.sales} 份 · ¥{agent.revenue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 付费记录表格 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">付费记录</h2>
            <p className="text-xs text-text-dim">
              共 {records.length} 条 · 成功{' '}
              {records.filter((r) => r.status === 'success').length} · 失败{' '}
              {records.filter((r) => r.status === 'failed').length} · 已退款{' '}
              {records.filter((r) => r.status === 'refunded').length}
            </p>
          </div>
        </div>
        <DataTable
          data={records}
          columns={columns}
          rowKey={(row) => row.id}
          pageSize={10}
        />
      </div>

      {/* 退款确认弹窗 */}
      <AdminModal
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        title="确认退款"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRefundTarget(null)}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={handleRefund}>
              确认退款
            </Button>
          </>
        }
      >
        {refundTarget && (
          <div className="space-y-3">
            <p className="text-sm text-text-soft">
              确定要为以下订单退款吗？退款后用户将失去对应 Agent 的使用权。
            </p>
            <div className="rounded-lg border border-border bg-bg-soft p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-dim">订单号</span>
                <span className="font-mono text-text">{refundTarget.orderId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-dim">用户</span>
                <span className="text-text">
                  {refundTarget.userAvatar} {refundTarget.userName}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-dim">Agent</span>
                <span className="text-text">
                  {refundTarget.agentAvatar} {refundTarget.agentName}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-dim">退款金额</span>
                <span className="font-serif font-semibold text-gold">
                  ¥{refundTarget.amount}
                </span>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
