'use client';

import * as React from 'react';
import { Search, Eye, Trash2, MessagesSquare } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_ADMIN_COUNCILS, type AdminCouncilRecord } from '@/lib/mock-admin';
import { getConflictLevel, formatDate } from '@/lib/utils';
import type { CouncilType } from '@/types';

/**
 * 议会管理页面
 *
 * 功能：
 * - 议会记录列表（问题、类型、参与者、冲突值、时间、用户）
 * - 筛选：议会类型、时间范围
 * - 搜索问题
 * - 操作：查看详情、删除
 */
export default function AdminCouncilsPage() {
  const [councils, setCouncils] = React.useState<AdminCouncilRecord[]>(MOCK_ADMIN_COUNCILS);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | CouncilType>('all');
  const [rangeFilter, setRangeFilter] = React.useState<'all' | '1d' | '7d' | '30d'>('all');
  const [detailCouncil, setDetailCouncil] = React.useState<AdminCouncilRecord | null>(null);
  const [deleteCouncil, setDeleteCouncil] = React.useState<AdminCouncilRecord | null>(null);

  const councilTypeLabel: Record<CouncilType, string> = {
    wisdom: '智慧议会',
    future: '未来议会',
    inner: '内心世界',
    reunion: '重逢议会',
  };

  // 过滤
  const filteredCouncils = React.useMemo(() => {
    const now = Date.now();
    const rangeMs: Record<string, number> = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    return councils.filter((c) => {
      const matchSearch = !search || c.question.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || c.councilType === typeFilter;
      const matchRange =
        rangeFilter === 'all' ||
        now - new Date(c.createdAt).getTime() <= rangeMs[rangeFilter];
      return matchSearch && matchType && matchRange;
    });
  }, [councils, search, typeFilter, rangeFilter]);

  // 删除确认
  const confirmDelete = () => {
    if (!deleteCouncil) return;
    setCouncils((prev) => prev.filter((c) => c.id !== deleteCouncil.id));
    setDeleteCouncil(null);
  };

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
      key: 'participants',
      title: '参与者',
      width: '160px',
      render: (row) => (
        <span className="text-text-soft">{row.participants.length} 位 Agent</span>
      ),
    },
    {
      key: 'conflictValue',
      title: '冲突值',
      width: '140px',
      sortable: true,
      sorter: (a, b) => a.conflictValue - b.conflictValue,
      render: (row) => {
        const level = getConflictLevel(row.conflictValue);
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-soft">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.conflictValue}%`,
                  backgroundColor: level.color,
                }}
              />
            </div>
            <span className="text-xs text-text-soft">{row.conflictValue}</span>
          </div>
        );
      },
    },
    {
      key: 'userName',
      title: '用户',
      width: '100px',
      render: (row) => <span className="text-text-soft">{row.userName}</span>,
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
    {
      key: 'actions',
      title: '操作',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDetailCouncil(row);
            }}
            className="inline-flex items-center gap-1 rounded border border-border bg-bg-soft px-2 py-1 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold"
          >
            <Eye className="h-3 w-3" />
            详情
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteCouncil(row);
            }}
            className="inline-flex items-center gap-1 rounded border border-red/30 bg-red/10 px-2 py-1 text-xs text-red transition-colors hover:bg-red/20"
          >
            <Trash2 className="h-3 w-3" />
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-text">议会管理</h1>
          <p className="mt-1 text-sm text-text-soft">共 {councils.length} 条议会记录</p>
        </div>
        <MessagesSquare className="h-6 w-6 text-text-dim" />
      </div>

      {/* 筛选区 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-card p-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-soft px-3 py-1.5">
          <Search className="h-4 w-4 text-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索问题"
            className="w-56 bg-transparent text-sm text-text placeholder:text-text-dim focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-text-dim">类型：</span>
          {(['all', 'wisdom', 'future', 'inner', 'reunion'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition-all ${
                typeFilter === t
                  ? 'border-gold bg-gold-soft/30 text-gold'
                  : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
              }`}
            >
              {t === 'all' ? '全部' : councilTypeLabel[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-text-dim">时间：</span>
          {(['all', '1d', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRangeFilter(r)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition-all ${
                rangeFilter === r
                  ? 'border-gold bg-gold-soft/30 text-gold'
                  : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
              }`}
            >
              {r === 'all' ? '全部' : r === '1d' ? '近 1 天' : r === '7d' ? '近 7 天' : '近 30 天'}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-text-dim">
          筛选结果：{filteredCouncils.length} 条
        </span>
      </div>

      {/* 议会表格 */}
      <DataTable
        data={filteredCouncils}
        columns={columns}
        rowKey={(row) => row.id}
        pageSize={10}
        onRowClick={(row) => setDetailCouncil(row)}
        emptyText={search || typeFilter !== 'all' || rangeFilter !== 'all' ? '未找到匹配的议会记录' : '暂无议会记录'}
        emptyDescription={
          search || typeFilter !== 'all' || rangeFilter !== 'all'
            ? '没有符合当前筛选条件的议会记录，试试调整搜索关键词或筛选条件。'
            : '系统中还没有议会记录。'
        }
        emptyState={
          search || typeFilter !== 'all' || rangeFilter !== 'all' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-soft">
                <Search className="h-6 w-6 text-text-dim" />
              </div>
              <p className="text-sm font-medium text-text-soft">
                未找到匹配的议会记录
              </p>
              <p className="max-w-xs text-xs text-text-dim">
                没有符合当前筛选条件的议会记录，试试调整搜索关键词或筛选条件。
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setRangeFilter('all');
                }}
                className="mt-1 text-xs text-gold hover:underline"
              >
                清空筛选条件
              </button>
            </div>
          ) : undefined
        }
      />

      {/* 详情弹窗 */}
      <AdminModal
        open={!!detailCouncil}
        onClose={() => setDetailCouncil(null)}
        title="议会详情"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setDetailCouncil(null)}>
            关闭
          </Button>
        }
      >
        {detailCouncil && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-dim">问题</p>
              <p className="mt-1 text-sm text-text">{detailCouncil.question}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-xs text-text-dim">议会 ID</p>
                <p className="text-sm text-text">{detailCouncil.id}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">类型</p>
                <Badge variant={detailCouncil.councilType === 'wisdom' ? 'gold' : 'blue'}>
                  {councilTypeLabel[detailCouncil.councilType]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-text-dim">用户</p>
                <p className="text-sm text-text">{detailCouncil.userName}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">冲突值</p>
                <p className="text-sm text-text">
                  {detailCouncil.conflictValue} ·{' '}
                  {getConflictLevel(detailCouncil.conflictValue).label}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-dim">创建时间</p>
                <p className="text-sm text-text">
                  {new Date(detailCouncil.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-text-dim">参与者（{detailCouncil.participants.length}）</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {detailCouncil.participants.map((p) => (
                  <Badge key={p} variant="gold">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* 删除确认弹窗 */}
      <AdminModal
        open={!!deleteCouncil}
        onClose={() => setDeleteCouncil(null)}
        title="确认删除"
        width="440px"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteCouncil(null)}>
              取消
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmDelete}
              className="!bg-red !text-white hover:!bg-[#f47171]"
            >
              确认删除
            </Button>
          </>
        }
      >
        {deleteCouncil && (
          <p className="text-sm text-text-soft">
            确定要删除议会记录
            <span className="mx-1 text-text">「{deleteCouncil.question.slice(0, 30)}...」</span>
            吗？此操作不可恢复。
          </p>
        )}
      </AdminModal>
    </div>
  );
}
