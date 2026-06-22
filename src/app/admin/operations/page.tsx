'use client';

import * as React from 'react';
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  Download,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminModal } from '@/components/admin/AdminModal';
import {
  MOCK_ANNOUNCEMENTS,
  MOCK_ADMIN_FEEDBACKS,
  type AdminAnnouncement,
  type AdminFeedback,
} from '@/lib/mock-admin';
import { formatDate } from '@/lib/utils';

/**
 * 运营管理页面
 *
 * 功能：
 * - 公告管理（列表 + 添加/编辑/删除）
 * - 用户反馈列表
 * - 数据导出按钮
 */
export default function AdminOperationsPage() {
  // ===== 公告 =====
  const [announcements, setAnnouncements] = React.useState<AdminAnnouncement[]>(MOCK_ANNOUNCEMENTS);
  const [editingAnnouncement, setEditingAnnouncement] = React.useState<AdminAnnouncement | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = React.useState(false);
  const [draftAnnouncement, setDraftAnnouncement] = React.useState({
    title: '',
    content: '',
    status: 'draft' as 'published' | 'draft',
  });

  // ===== 反馈 =====
  const [feedbacks, setFeedbacks] = React.useState<AdminFeedback[]>(MOCK_ADMIN_FEEDBACKS);

  // 打开新建公告
  const openCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setDraftAnnouncement({ title: '', content: '', status: 'draft' });
    setShowAnnouncementModal(true);
  };

  // 打开编辑公告
  const openEditAnnouncement = (a: AdminAnnouncement) => {
    setEditingAnnouncement(a);
    setDraftAnnouncement({ title: a.title, content: a.content, status: a.status });
    setShowAnnouncementModal(true);
  };

  // 保存公告
  const saveAnnouncement = () => {
    if (!draftAnnouncement.title.trim()) return;
    if (editingAnnouncement) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editingAnnouncement.id
            ? {
                ...a,
                title: draftAnnouncement.title,
                content: draftAnnouncement.content,
                status: draftAnnouncement.status,
              }
            : a
        )
      );
    } else {
      setAnnouncements((prev) => [
        {
          id: `a-${Date.now()}`,
          title: draftAnnouncement.title,
          content: draftAnnouncement.content,
          publishedAt: new Date().toISOString(),
          status: draftAnnouncement.status,
        },
        ...prev,
      ]);
    }
    setShowAnnouncementModal(false);
  };

  // 删除公告
  const removeAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // 更新反馈状态
  const updateFeedbackStatus = (id: string, status: AdminFeedback['status']) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f))
    );
  };

  // 数据导出
  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      announcements,
      feedbacks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeverse-operations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const feedbackStatusVariant: Record<AdminFeedback['status'], 'gold' | 'green' | 'red'> = {
    pending: 'gold',
    resolved: 'green',
    ignored: 'red',
  };

  const feedbackStatusLabel: Record<AdminFeedback['status'], string> = {
    pending: '待处理',
    resolved: '已处理',
    ignored: '已忽略',
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-text">运营管理</h1>
          <p className="mt-1 text-sm text-text-soft">公告 · 用户反馈 · 数据导出</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            导出数据
          </Button>
          <Megaphone className="h-6 w-6 text-text-dim" />
        </div>
      </div>

      {/* 公告管理 */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">公告管理</h2>
            <p className="text-xs text-text-dim">
              共 {announcements.length} 条 · 已发布{' '}
              {announcements.filter((a) => a.status === 'published').length} · 草稿{' '}
              {announcements.filter((a) => a.status === 'draft').length}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreateAnnouncement}>
            <Plus className="h-3.5 w-3.5" />
            新建公告
          </Button>
        </div>

        <div className="space-y-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-border-soft bg-bg-soft p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-text">{a.title}</h3>
                    <Badge variant={a.status === 'published' ? 'green' : 'gold'}>
                      {a.status === 'published' ? '已发布' : '草稿'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-text-soft">{a.content}</p>
                  <p className="mt-2 text-[11px] text-text-dim">
                    {formatDate(new Date(a.publishedAt).getTime())}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditAnnouncement(a)}
                    className="flex h-7 w-7 items-center justify-center rounded text-text-dim transition-colors hover:bg-bg-card hover:text-gold"
                    aria-label="编辑"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAnnouncement(a.id)}
                    className="flex h-7 w-7 items-center justify-center rounded text-text-dim transition-colors hover:bg-red/10 hover:text-red"
                    aria-label="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 用户反馈 */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">用户反馈</h2>
            <p className="text-xs text-text-dim">
              共 {feedbacks.length} 条 · 待处理{' '}
              {feedbacks.filter((f) => f.status === 'pending').length}
            </p>
          </div>
          <MessageSquare className="h-4 w-4 text-text-dim" />
        </div>

        <div className="space-y-2">
          {feedbacks.map((f) => (
            <div
              key={f.id}
              className="rounded-lg border border-border-soft bg-bg-soft p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">{f.userName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < f.rating
                              ? 'fill-gold text-gold'
                              : 'fill-bg-card text-text-dim'
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant={feedbackStatusVariant[f.status]}>
                      {feedbackStatusLabel[f.status]}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-soft">{f.content}</p>
                  <p className="mt-2 text-[11px] text-text-dim">
                    {formatDate(new Date(f.createdAt).getTime())}
                  </p>
                </div>

                {f.status === 'pending' && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateFeedbackStatus(f.id, 'resolved')}
                      className="rounded border border-green/30 bg-green/10 px-2 py-1 text-xs text-green transition-colors hover:bg-green/20"
                    >
                      标记已处理
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFeedbackStatus(f.id, 'ignored')}
                      className="rounded border border-border bg-bg-card px-2 py-1 text-xs text-text-dim transition-colors hover:text-text"
                    >
                      忽略
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 公告编辑弹窗 */}
      <AdminModal
        open={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        title={editingAnnouncement ? '编辑公告' : '新建公告'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowAnnouncementModal(false)}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={saveAnnouncement}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-text-dim">标题</label>
            <input
              type="text"
              value={draftAnnouncement.title}
              onChange={(e) =>
                setDraftAnnouncement({ ...draftAnnouncement, title: e.target.value })
              }
              placeholder="公告标题"
              className="w-full rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-dim">内容</label>
            <textarea
              value={draftAnnouncement.content}
              onChange={(e) =>
                setDraftAnnouncement({ ...draftAnnouncement, content: e.target.value })
              }
              rows={5}
              placeholder="公告内容..."
              className="w-full resize-y rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-dim">状态</label>
            <div className="flex gap-2">
              {(['published', 'draft'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraftAnnouncement({ ...draftAnnouncement, status: s })}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                    draftAnnouncement.status === s
                      ? 'border-gold bg-gold-soft/30 text-gold'
                      : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
                  }`}
                >
                  {s === 'published' ? '立即发布' : '保存为草稿'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
