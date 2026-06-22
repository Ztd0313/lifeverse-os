'use client';

import * as React from 'react';
import { Plus, Trash2, FileText, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminModal } from '@/components/admin/AdminModal';
import { PLANETS, type PlanetMeta } from '@/lib/mock-memories';
import {
  MOCK_PRESET_QUESTIONS,
  MOCK_BANNERS,
  type AdminPresetQuestion,
  type AdminBanner,
} from '@/lib/mock-admin';

/**
 * 内容管理页面
 *
 * 功能：
 * - 预设问题管理（列表 + 添加/删除）
 * - 星球配置管理（5 个星球的名称、描述、图标）
 * - 运营 Banner 管理（添加/删除/排序）
 */
export default function AdminContentPage() {
  // ===== 预设问题 =====
  const [questions, setQuestions] = React.useState<AdminPresetQuestion[]>(MOCK_PRESET_QUESTIONS);
  const [newQuestion, setNewQuestion] = React.useState('');
  const [newQuestionCategory, setNewQuestionCategory] = React.useState('career');

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setQuestions((prev) => [
      {
        id: `q-${Date.now()}`,
        text: newQuestion.trim(),
        category: newQuestionCategory,
        usageCount: 0,
      },
      ...prev,
    ]);
    setNewQuestion('');
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // ===== 星球配置 =====
  const [planets, setPlanets] = React.useState<PlanetMeta[]>(PLANETS);

  const updatePlanet = (id: PlanetMeta['id'], field: keyof PlanetMeta, value: string) => {
    setPlanets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // ===== Banner 管理 =====
  const [banners, setBanners] = React.useState<AdminBanner[]>(MOCK_BANNERS);
  const [showBannerModal, setShowBannerModal] = React.useState(false);
  const [newBanner, setNewBanner] = React.useState({ title: '', imageUrl: '', link: '' });

  const addBanner = () => {
    if (!newBanner.title.trim()) return;
    setBanners((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        title: newBanner.title.trim(),
        imageUrl: newBanner.imageUrl.trim() || '/images/banner-default.jpg',
        link: newBanner.link.trim() || '/',
        order: prev.length + 1,
        enabled: true,
      },
    ]);
    setNewBanner({ title: '', imageUrl: '', link: '' });
    setShowBannerModal(false);
  };

  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  };

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    setBanners((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  };

  const categoryLabel: Record<string, string> = {
    career: '事业',
    relationship: '关系',
    finance: '财务',
    education: '教育',
    life_direction: '人生方向',
    other: '其他',
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-text">内容管理</h1>
          <p className="mt-1 text-sm text-text-soft">预设问题 · 星球配置 · 运营 Banner</p>
        </div>
        <FileText className="h-6 w-6 text-text-dim" />
      </div>

      {/* 预设问题管理 */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">预设问题</h2>
            <p className="text-xs text-text-dim">共 {questions.length} 条</p>
          </div>
        </div>

        {/* 添加新问题 */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-soft p-3">
          <select
            value={newQuestionCategory}
            onChange={(e) => setNewQuestionCategory(e.target.value)}
            className="rounded-lg border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:outline-none"
          >
            {Object.entries(categoryLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addQuestion();
            }}
            placeholder="输入新的预设问题..."
            className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none"
          />
          <Button variant="primary" size="sm" onClick={addQuestion}>
            <Plus className="h-3.5 w-3.5" />
            添加
          </Button>
        </div>

        {/* 问题列表 */}
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-3 rounded-lg border border-border-soft bg-bg-soft px-3 py-2"
            >
              <Badge variant="blue">{categoryLabel[q.category] ?? q.category}</Badge>
              <span className="flex-1 text-sm text-text">{q.text}</span>
              <span className="text-xs text-text-dim">使用 {q.usageCount} 次</span>
              <button
                type="button"
                onClick={() => removeQuestion(q.id)}
                className="flex h-7 w-7 items-center justify-center rounded text-text-dim transition-colors hover:bg-red/10 hover:text-red"
                aria-label="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 星球配置管理 */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text">星球配置</h2>
          <p className="text-xs text-text-dim">5 个记忆星球的名称、描述与图标</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {planets.map((planet) => (
            <div
              key={planet.id}
              className="rounded-lg border border-border-soft bg-bg-soft p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: planet.color }}
                />
                <span className="text-xs text-text-dim">{planet.id}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-text-dim">名称</label>
                  <input
                    type="text"
                    value={planet.name}
                    onChange={(e) => updatePlanet(planet.id, 'name', e.target.value)}
                    className="mt-0.5 w-full rounded border border-border bg-bg-card px-2 py-1 text-sm text-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-dim">英文名</label>
                  <input
                    type="text"
                    value={planet.nameEn}
                    onChange={(e) => updatePlanet(planet.id, 'nameEn', e.target.value)}
                    className="mt-0.5 w-full rounded border border-border bg-bg-card px-2 py-1 text-sm text-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-dim">描述</label>
                  <input
                    type="text"
                    value={planet.description}
                    onChange={(e) => updatePlanet(planet.id, 'description', e.target.value)}
                    className="mt-0.5 w-full rounded border border-border bg-bg-card px-2 py-1 text-sm text-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-dim">图标</label>
                  <input
                    type="text"
                    value={planet.icon}
                    onChange={(e) => updatePlanet(planet.id, 'icon', e.target.value)}
                    className="mt-0.5 w-full rounded border border-border bg-bg-card px-2 py-1 text-sm text-text focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 运营 Banner 管理 */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">运营 Banner</h2>
            <p className="text-xs text-text-dim">共 {banners.length} 个 Banner</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowBannerModal(true)}>
            <Plus className="h-3.5 w-3.5" />
            添加 Banner
          </Button>
        </div>

        <div className="space-y-2">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="flex items-center gap-3 rounded-lg border border-border-soft bg-bg-soft px-3 py-2"
            >
              <GripVertical className="h-4 w-4 text-text-dim" />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveBanner(index, 'up')}
                  disabled={index === 0}
                  className="text-text-dim transition-colors hover:text-gold disabled:opacity-30"
                  aria-label="上移"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBanner(index, 'down')}
                  disabled={index === banners.length - 1}
                  className="text-text-dim transition-colors hover:text-gold disabled:opacity-30"
                  aria-label="下移"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              <span className="flex h-6 w-6 items-center justify-center rounded bg-bg-card text-xs text-text-dim">
                {banner.order}
              </span>

              <div className="flex-1">
                <p className="text-sm text-text">{banner.title}</p>
                <p className="text-xs text-text-dim">{banner.link}</p>
              </div>

              <button
                type="button"
                onClick={() => toggleBanner(banner.id)}
                className={`rounded px-2 py-0.5 text-xs ${
                  banner.enabled
                    ? 'bg-green/10 text-green'
                    : 'bg-bg-card text-text-dim'
                }`}
              >
                {banner.enabled ? '启用' : '禁用'}
              </button>

              <button
                type="button"
                onClick={() => removeBanner(banner.id)}
                className="flex h-7 w-7 items-center justify-center rounded text-text-dim transition-colors hover:bg-red/10 hover:text-red"
                aria-label="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 添加 Banner 弹窗 */}
      <AdminModal
        open={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        title="添加 Banner"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowBannerModal(false)}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={addBanner}>
              添加
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-text-dim">标题</label>
            <input
              type="text"
              value={newBanner.title}
              onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
              placeholder="Banner 标题"
              className="w-full rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-dim">图片 URL</label>
            <input
              type="text"
              value={newBanner.imageUrl}
              onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
              placeholder="/images/banner.jpg"
              className="w-full rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-dim">跳转链接</label>
            <input
              type="text"
              value={newBanner.link}
              onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
              placeholder="/council/wisdom"
              className="w-full rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
