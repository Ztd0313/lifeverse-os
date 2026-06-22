'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Activity,
  MessagesSquare,
  Brain,
  Bot,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { LineChart } from '@/components/admin/SimpleChart';
import { Badge } from '@/components/ui/Badge';
import {
  MOCK_ADMIN_STAT,
  MOCK_7D_TREND,
  MOCK_ADMIN_COUNCILS,
  MOCK_AGENT_RANK,
  type AdminCouncilRecord,
} from '@/lib/mock-admin';
import { statsApi } from '@/lib/api';
import { getConflictLevel, formatDate } from '@/lib/utils';
import type { CouncilType } from '@/types';

/**
 * 管理后台 Dashboard 仪表盘
 *
 * 内容：
 * - 4 个统计卡片（总用户、今日活跃、议会总数、记忆总数）
 * - 最近 7 天议会趋势折线图
 * - 最近 10 条议会记录表格
 * - 热门 Agent 排行
 */
export default function AdminDashboardPage() {
  const router = useRouter();

  // 从后端 API 获取的真实统计数据
  const [stats, setStats] = useState({
    totalMemories: 0,
    totalCouncils: 0,
    totalUsers: 0,
    todayMemories: 0,
  });

  // 组件挂载时请求统计数据，API 不可用时保持默认值 0
  useEffect(() => {
    statsApi.get().then((res) => {
      if (res.success) {
        setStats(res.data);
      }
    }).catch(() => {
      // API 不可用时保持默认值
    });
  }, []);

  // 议会类型标签映射
  const councilTypeLabel: Record<CouncilType, string> = {
    wisdom: '智慧议会',
    future: '未来议会',
    inner: '内心世界',
    reunion: '重逢议会',
  };

  // 最近 10 条议会记录
  const recentCouncils = React.useMemo(
    () =>
      [...MOCK_ADMIN_COUNCILS]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    []
  );

  // 表格列定义
  const columns: DataTableColumn<AdminCouncilRecord>[] = [
    {
      key: 'question',
      title: '问题',
      render: (row) => (
        <span className="line-clamp-1 max-w-md text-text" title={row.question}>
          {row.question}
        </span>
      ),
    },
    {
      key: 'councilType',
      title: '类型',
      width: '120px',
      render: (row) => (
        <Badge variant={row.councilType === 'wisdom' ? 'gold' : 'blue'}>
          {councilTypeLabel[row.councilType]}
        </Badge>
      ),
    },
    {
      key: 'userName',
      title: '用户',
      width: '120px',
      render: (row) => <span className="text-text-soft">{row.userName}</span>,
    },
    {
      key: 'conflictValue',
      title: '冲突值',
      width: '120px',
      sortable: true,
      sorter: (a, b) => a.conflictValue - b.conflictValue,
      render: (row) => {
        const level = getConflictLevel(row.conflictValue);
        return (
          <div className="flex items-center gap-2">
            <span className="text-text-soft">{row.conflictValue}</span>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: level.color }}
            />
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      title: '时间',
      width: '140px',
      sortable: true,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (row) => (
        <span className="text-text-dim">
          {formatDate(new Date(row.createdAt).getTime())}
        </span>
      ),
    },
  ];

  // 趋势图数据
  const trendData = MOCK_7D_TREND.map((p) => ({
    label: p.date.slice(5), // MM-DD
    value: p.councils,
  }));

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="font-serif text-2xl text-text">Dashboard</h1>
        <p className="mt-1 text-sm text-text-soft">
          LifeVerse 管理后台总览 · {new Date().toLocaleDateString('zh-CN')}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总用户数"
          value={(stats.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          trend={8.2}
          trendLabel="较上周"
          color="gold"
          onClick={() => router.push('/admin/users')}
        />
        <StatCard
          title="今日活跃"
          value={(stats.todayMemories ?? 0).toLocaleString()}
          icon={Activity}
          trend={12.5}
          trendLabel="较昨日"
          color="green"
          onClick={() => router.push('/admin/users')}
        />
        <StatCard
          title="议会总数"
          value={(stats.totalCouncils ?? 0).toLocaleString()}
          icon={MessagesSquare}
          trend={5.8}
          trendLabel="较上周"
          color="blue"
          onClick={() => router.push('/admin/councils')}
        />
        <StatCard
          title="记忆总数"
          value={(stats.totalMemories ?? 0).toLocaleString()}
          icon={Brain}
          trend={-2.1}
          trendLabel="较上周"
          color="orange"
          onClick={() => router.push('/admin/memories')}
        />
      </div>

      {/* 趋势图 + Agent 排行 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 7 天趋势图 */}
        <div className="rounded-lg border border-border bg-bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text">最近 7 天议会趋势</h2>
              <p className="text-xs text-text-dim">每日议会创建数量</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green" />
          </div>
          <LineChart data={trendData} height={260} yLabel="议会数" />
        </div>

        {/* 热门 Agent 排行 */}
        <div className="rounded-lg border border-border bg-bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">热门 Agent 排行</h2>
            <Bot className="h-4 w-4 text-gold" />
          </div>
          <div className="space-y-3">
            {MOCK_AGENT_RANK.slice(0, 6).map((agent, index) => (
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
                <span className="text-lg">{agent.avatar}</span>
                <div className="flex-1">
                  <p className="text-sm text-text">{agent.name}</p>
                  <p className="text-[11px] text-text-dim">
                    出场 {agent.appearances.toLocaleString()} 次
                  </p>
                </div>
                <span className="text-sm font-medium text-gold">
                  {agent.avgScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近议会记录 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">最近议会记录</h2>
          <button
            type="button"
            onClick={() => router.push('/admin/councils')}
            className="text-xs text-text-soft transition-colors hover:text-gold"
          >
            查看全部 →
          </button>
        </div>
        <DataTable
          data={recentCouncils}
          columns={columns}
          rowKey={(row) => row.id}
          pagination={false}
          onRowClick={(row) => router.push(`/admin/councils?id=${row.id}`)}
        />
      </div>
    </div>
  );
}
