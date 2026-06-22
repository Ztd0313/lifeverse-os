'use client';

import * as React from 'react';
import { Search, Eye, Trash2, Brain } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_MEMORIES, getPlanetMeta, getEmotionMeta } from '@/lib/mock-memories';
import type { MemoryItem, MemoryCategory, MemoryType } from '@/types';

/**
 * 记忆管理页面
 *
 * 功能：
 * - 记忆列表（标题、星球、类型、情感、创建时间）
 * - 筛选：星球、类型
 * - 搜索标题
 * - 操作：查看、删除
 *
 * 复用 mock-memories.ts 中的 15 条记忆数据。
 */
export default function AdminMemoriesPage() {
  const [memories, setMemories] = React.useState<MemoryItem[]>(MOCK_MEMORIES);
  const [search, setSearch] = React.useState('');
  const [planetFilter, setPlanetFilter] = React.useState<'all' | MemoryCategory>('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | MemoryType>('all');
  const [detailMemory, setDetailMemory] = React.useState<MemoryItem | null>(null);
  const [deleteMemory, setDeleteMemory] = React.useState<MemoryItem | null>(null);

  const typeLabel: Record<MemoryType, string> = {
    photo: '照片',
    text: '文字',
    voice: '语音',
    video: '视频',
  };

  // 过滤
  const filteredMemories = React.useMemo(() => {
    return memories.filter((m) => {
      const matchSearch =
        !search || m.title.toLowerCase().includes(search.toLowerCase());
      const matchPlanet = planetFilter === 'all' || m.category === planetFilter;
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      return matchSearch && matchPlanet && matchType;
    });
  }, [memories, search, planetFilter, typeFilter]);

  // 删除确认
  const confirmDelete = () => {
    if (!deleteMemory) return;
    setMemories((prev) => prev.filter((m) => m.id !== deleteMemory.id));
    setDeleteMemory(null);
  };

  // 表格列定义
  const columns: DataTableColumn<MemoryItem>[] = [
    {
      key: 'title',
      title: '标题',
      render: (row) => (
        <span className="line-clamp-1 max-w-xs text-text" title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      key: 'category',
      title: '星球',
      width: '140px',
      render: (row) => {
        const meta = getPlanetMeta(row.category);
        return (
          <span
            className="inline-flex items-center gap-1.5 text-text-soft"
            style={{ color: meta?.color }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: meta?.color }}
            />
            {meta?.name}
          </span>
        );
      },
    },
    {
      key: 'type',
      title: '类型',
      width: '100px',
      render: (row) => <Badge variant="blue">{typeLabel[row.type]}</Badge>,
    },
    {
      key: 'emotion',
      title: '情感',
      width: '100px',
      render: (row) => {
        const meta = getEmotionMeta(row.emotion);
        return (
          <span
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
            style={{
              color: meta?.color,
              borderColor: `${meta?.color}55`,
              backgroundColor: `${meta?.color}11`,
            }}
          >
            {meta?.label}
          </span>
        );
      },
    },
    {
      key: 'importance',
      title: '重要度',
      width: '120px',
      sortable: true,
      sorter: (a, b) => a.importance - b.importance,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-soft">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${row.importance * 100}%` }}
            />
          </div>
          <span className="text-xs text-text-soft">{Math.round(row.importance * 100)}%</span>
        </div>
      ),
    },
    {
      key: 'date',
      title: '创建时间',
      width: '140px',
      sortable: true,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (row) => (
        <span className="text-text-dim">
          {new Date(row.date).toLocaleDateString('zh-CN')}
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
              setDetailMemory(row);
            }}
            className="inline-flex items-center gap-1 rounded border border-border bg-bg-soft px-2 py-1 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold"
          >
            <Eye className="h-3 w-3" />
            查看
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteMemory(row);
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
          <h1 className="font-serif text-2xl text-text">记忆管理</h1>
          <p className="mt-1 text-sm text-text-soft">共 {memories.length} 条记忆</p>
        </div>
        <Brain className="h-6 w-6 text-text-dim" />
      </div>

      {/* 筛选区 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-card p-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-soft px-3 py-1.5">
          <Search className="h-4 w-4 text-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题"
            className="w-48 bg-transparent text-sm text-text placeholder:text-text-dim focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-text-dim">星球：</span>
          {(['all', 'forest', 'ocean', 'town', 'city', 'mountain'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlanetFilter(p)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition-all ${
                planetFilter === p
                  ? 'border-gold bg-gold-soft/30 text-gold'
                  : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
              }`}
            >
              {p === 'all' ? '全部' : getPlanetMeta(p)?.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-text-dim">类型：</span>
          {(['all', 'photo', 'text', 'voice', 'video'] as const).map((t) => (
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
              {t === 'all' ? '全部' : typeLabel[t]}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-text-dim">
          筛选结果：{filteredMemories.length} 条
        </span>
      </div>

      {/* 记忆表格 */}
      <DataTable
        data={filteredMemories}
        columns={columns}
        rowKey={(row) => row.id}
        pageSize={10}
        onRowClick={(row) => setDetailMemory(row)}
      />

      {/* 详情弹窗 */}
      <AdminModal
        open={!!detailMemory}
        onClose={() => setDetailMemory(null)}
        title="记忆详情"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setDetailMemory(null)}>
            关闭
          </Button>
        }
      >
        {detailMemory && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-dim">标题</p>
              <p className="mt-1 text-base font-medium text-text">{detailMemory.title}</p>
            </div>

            <div>
              <p className="text-xs text-text-dim">内容</p>
              <p className="mt-1 text-sm leading-relaxed text-text-soft">
                {detailMemory.content}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-xs text-text-dim">记忆 ID</p>
                <p className="text-sm text-text">{detailMemory.id}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">星球</p>
                <p className="text-sm text-text">{getPlanetMeta(detailMemory.category)?.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">类型</p>
                <p className="text-sm text-text">{typeLabel[detailMemory.type]}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">情感</p>
                <p className="text-sm text-text">
                  {getEmotionMeta(detailMemory.emotion)?.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-dim">日期</p>
                <p className="text-sm text-text">
                  {new Date(detailMemory.date).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-dim">地点</p>
                <p className="text-sm text-text">{detailMemory.location ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">重要度</p>
                <p className="text-sm text-text">{Math.round(detailMemory.importance * 100)}%</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">人物</p>
                <p className="text-sm text-text">
                  {detailMemory.people?.join('、') ?? '—'}
                </p>
              </div>
            </div>

            {detailMemory.tags && detailMemory.tags.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-text-dim">标签</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detailMemory.tags.map((tag) => (
                    <Badge key={tag} variant="gold">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* 删除确认弹窗 */}
      <AdminModal
        open={!!deleteMemory}
        onClose={() => setDeleteMemory(null)}
        title="确认删除"
        width="440px"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteMemory(null)}>
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
        {deleteMemory && (
          <p className="text-sm text-text-soft">
            确定要删除记忆
            <span className="mx-1 text-text">「{deleteMemory.title}」</span>
            吗？此操作不可恢复。
          </p>
        )}
      </AdminModal>
    </div>
  );
}
