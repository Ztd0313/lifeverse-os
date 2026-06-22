'use client';

import * as React from 'react';
import { Search, Eye, Ban, CheckCircle, Users as UsersIcon } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_ADMIN_USERS, type AdminUser } from '@/lib/mock-admin';
import { formatDate } from '@/lib/utils';

/**
 * 用户管理页面
 *
 * 功能：
 * - 用户列表表格（头像、昵称、邮箱、注册时间、最后活跃、议会数、状态）
 * - 搜索（昵称 / 邮箱）
 * - 状态筛选（全部 / 正常 / 已禁用）
 * - 分页
 * - 操作：查看详情、禁用/启用
 */
export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'disabled'>('all');
  const [detailUser, setDetailUser] = React.useState<AdminUser | null>(null);

  // 过滤后的用户
  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.nickname.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  // 切换用户状态
  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? 'disabled' : 'active' }
          : u
      )
    );
  };

  // 表格列定义
  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'user',
      title: '用户',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-soft text-base">
            {row.avatar}
          </span>
          <div>
            <p className="text-text">{row.nickname}</p>
            <p className="text-xs text-text-dim">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'registeredAt',
      title: '注册时间',
      width: '160px',
      sortable: true,
      sorter: (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
      render: (row) => (
        <span className="text-text-soft">
          {formatDate(new Date(row.registeredAt).getTime())}
        </span>
      ),
    },
    {
      key: 'lastActiveAt',
      title: '最后活跃',
      width: '160px',
      sortable: true,
      sorter: (a, b) => new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime(),
      render: (row) => (
        <span className="text-text-soft">
          {formatDate(new Date(row.lastActiveAt).getTime())}
        </span>
      ),
    },
    {
      key: 'councilCount',
      title: '议会数',
      width: '100px',
      sortable: true,
      sorter: (a, b) => a.councilCount - b.councilCount,
      render: (row) => <span className="text-text">{row.councilCount}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'green' : 'red'}>
          {row.status === 'active' ? '正常' : '已禁用'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDetailUser(row);
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
              toggleUserStatus(row.id);
            }}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors ${
              row.status === 'active'
                ? 'border-red/30 bg-red/10 text-red hover:bg-red/20'
                : 'border-green/30 bg-green/10 text-green hover:bg-green/20'
            }`}
          >
            {row.status === 'active' ? (
              <>
                <Ban className="h-3 w-3" />
                禁用
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3" />
                启用
              </>
            )}
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
          <h1 className="font-serif text-2xl text-text">用户管理</h1>
          <p className="mt-1 text-sm text-text-soft">
            共 {users.length} 位用户 · 正常 {users.filter((u) => u.status === 'active').length} ·
            禁用 {users.filter((u) => u.status === 'disabled').length}
          </p>
        </div>
        <UsersIcon className="h-6 w-6 text-text-dim" />
      </div>

      {/* 筛选区 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-card p-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-soft px-3 py-1.5">
          <Search className="h-4 w-4 text-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索昵称或邮箱"
            className="w-56 bg-transparent text-sm text-text placeholder:text-text-dim focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'active', 'disabled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                statusFilter === s
                  ? 'border-gold bg-gold-soft/30 text-gold'
                  : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
              }`}
            >
              {s === 'all' ? '全部' : s === 'active' ? '正常' : '已禁用'}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-text-dim">
          筛选结果：{filteredUsers.length} 条
        </span>
      </div>

      {/* 用户表格 */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        rowKey={(row) => row.id}
        pageSize={10}
        onRowClick={(row) => setDetailUser(row)}
        emptyText={search || statusFilter !== 'all' ? '未找到匹配的用户' : '暂无用户'}
        emptyDescription={
          search || statusFilter !== 'all'
            ? `没有符合当前筛选条件的用户，试试调整搜索关键词或状态筛选。`
            : '系统中还没有注册用户。'
        }
        emptyState={
          search || statusFilter !== 'all' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-soft">
                <Search className="h-6 w-6 text-text-dim" />
              </div>
              <p className="text-sm font-medium text-text-soft">
                未找到匹配的用户
              </p>
              <p className="max-w-xs text-xs text-text-dim">
                没有符合当前筛选条件的用户，试试调整搜索关键词或状态筛选。
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-1 text-xs text-gold hover:underline"
              >
                清空筛选条件
              </button>
            </div>
          ) : undefined
        }
      />

      {/* 用户详情弹窗 */}
      <AdminModal
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="用户详情"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDetailUser(null)}>
              关闭
            </Button>
            {detailUser && (
              <Button
                variant={detailUser.status === 'active' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  toggleUserStatus(detailUser.id);
                  setDetailUser(null);
                }}
              >
                {detailUser.status === 'active' ? '禁用用户' : '启用用户'}
              </Button>
            )}
          </>
        }
      >
        {detailUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-soft text-3xl">
                {detailUser.avatar}
              </span>
              <div>
                <p className="text-lg font-medium text-text">{detailUser.nickname}</p>
                <p className="text-sm text-text-dim">{detailUser.email}</p>
                <Badge
                  variant={detailUser.status === 'active' ? 'green' : 'red'}
                  className="mt-1"
                >
                  {detailUser.status === 'active' ? '正常' : '已禁用'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-xs text-text-dim">用户 ID</p>
                <p className="text-sm text-text">{detailUser.id}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">议会数</p>
                <p className="text-sm text-text">{detailUser.councilCount}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">注册时间</p>
                <p className="text-sm text-text">
                  {new Date(detailUser.registeredAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-dim">最后活跃</p>
                <p className="text-sm text-text">
                  {new Date(detailUser.lastActiveAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
