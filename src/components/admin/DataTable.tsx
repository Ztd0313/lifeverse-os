'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 数据表格列定义
 */
export interface DataTableColumn<T> {
  /** 列唯一标识 */
  key: string;
  /** 列标题 */
  title: string;
  /** 单元格渲染函数 */
  render: (row: T, index: number) => React.ReactNode;
  /** 是否可排序 */
  sortable?: boolean;
  /** 排序比较函数（sortable 为 true 时生效） */
  sorter?: (a: T, b: T) => number;
  /** 列宽度（CSS 值，如 "200px" / "20%"） */
  width?: string;
  /** 是否固定列（暂未实现，预留） */
  fixed?: 'left' | 'right';
}

/**
 * 数据表格组件 Props
 */
export interface DataTableProps<T> {
  /** 数据源 */
  data: T[];
  /** 列定义 */
  columns: DataTableColumn<T>[];
  /** 行 key 提取器 */
  rowKey: (row: T) => string;
  /** 每页条数（默认 10） */
  pageSize?: number;
  /** 是否显示分页（默认 true） */
  pagination?: boolean;
  /** 空数据提示文案 */
  emptyText?: string;
  /** 空数据提示副文案（描述性文字） */
  emptyDescription?: string;
  /** 自定义空状态渲染（优先于 emptyText） */
  emptyState?: React.ReactNode;
  /** 行点击回调 */
  onRowClick?: (row: T) => void;
  /** 自定义类名 */
  className?: string;
}

type SortOrder = 'asc' | 'desc' | null;

/**
 * 通用数据表格组件
 *
 * 特性：
 * - 支持列排序（点击表头切换升序/降序）
 * - 支持分页（可配置每页条数）
 * - 支持空数据状态
 * - 支持行点击
 * - 深色主题
 */
export function DataTable<T>({
  data,
  columns,
  rowKey,
  pageSize = 10,
  pagination = true,
  emptyText = '暂无数据',
  emptyDescription,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<SortOrder>(null);

  // 重置页码当数据变化
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  // 排序后的数据
  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortOrder) return data;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sorter) return data;
    const sorted = [...data].sort(column.sorter);
    return sortOrder === 'asc' ? sorted : sorted.reverse();
  }, [data, columns, sortKey, sortOrder]);

  // 分页后的数据
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedData = pagination
    ? sortedData.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sortedData;

  // 处理表头排序点击
  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;
    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortKey(null);
      setSortOrder(null);
    } else {
      setSortOrder('asc');
    }
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-soft">
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-text-soft',
                    column.sortable && 'cursor-pointer select-none hover:text-text'
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <span className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            'h-3 w-3',
                            sortKey === column.key && sortOrder === 'asc'
                              ? 'text-gold'
                              : 'text-text-dim'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3',
                            sortKey === column.key && sortOrder === 'desc'
                              ? 'text-gold'
                              : 'text-text-dim'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center"
                >
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-soft">
                        <Inbox className="h-6 w-6 text-text-dim" />
                      </div>
                      <p className="text-sm font-medium text-text-soft">
                        {emptyText}
                      </p>
                      {emptyDescription && (
                        <p className="max-w-xs text-xs text-text-dim">
                          {emptyDescription}
                        </p>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              pagedData.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-border-soft transition-colors last:border-b-0',
                    onRowClick && 'cursor-pointer hover:bg-bg-card-hover'
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-text">
                      {column.render(row, (safePage - 1) * pageSize + index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination && sortedData.length > pageSize && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-text-dim">
            共 {sortedData.length} 条 · 第 {safePage}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded border border-border text-text-soft transition-colors hover:border-gold-dim hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded border border-border text-text-soft transition-colors hover:border-gold-dim hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
