'use client';

import * as React from 'react';
import { Bot, Edit3, Power } from 'lucide-react';
import { AdminModal } from '@/components/admin/AdminModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AGENTS } from '@/lib/agents';
import { getAgentPrompt } from '@/lib/ai/agent-prompts';
import type { Persona, PersonaType } from '@/types';

/**
 * Agent 管理页面
 *
 * 功能：
 * - Agent 列表（头像、名称、类型、哲学、状态）
 * - 操作：启用/禁用、编辑 System Prompt
 * - 编辑弹窗（mock 编辑，保存到 state）
 */
export default function AdminAgentsPage() {
  // Agent 列表 + 启用状态（mock）
  const [agentStates, setAgentStates] = React.useState<
    Record<string, { enabled: boolean; systemPrompt: string }>
  >(() => {
    const initial: Record<string, { enabled: boolean; systemPrompt: string }> = {};
    AGENTS.forEach((a) => {
      initial[a.id] = {
        enabled: true,
        systemPrompt: getAgentPrompt(a.id as Parameters<typeof getAgentPrompt>[0]),
      };
    });
    return initial;
  });

  const [editingAgent, setEditingAgent] = React.useState<Persona | null>(null);
  const [editPrompt, setEditPrompt] = React.useState('');

  const typeLabel: Record<PersonaType, string> = {
    sage: '智者',
    time: '时间',
    relation: '关系',
    inner: '内心',
  };

  const typeVariant: Record<PersonaType, 'gold' | 'blue' | 'green' | 'orange'> = {
    sage: 'gold',
    time: 'blue',
    relation: 'green',
    inner: 'orange',
  };

  // 切换启用状态
  const toggleAgent = (agentId: string) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        enabled: !prev[agentId].enabled,
      },
    }));
  };

  // 打开编辑弹窗
  const openEdit = (agent: Persona) => {
    setEditingAgent(agent);
    setEditPrompt(agentStates[agent.id].systemPrompt);
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingAgent) return;
    setAgentStates((prev) => ({
      ...prev,
      [editingAgent.id]: {
        ...prev[editingAgent.id],
        systemPrompt: editPrompt,
      },
    }));
    setEditingAgent(null);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-text">Agent 管理</h1>
          <p className="mt-1 text-sm text-text-soft">
            共 {AGENTS.length} 个 Agent · 启用{' '}
            {Object.values(agentStates).filter((s) => s.enabled).length} · 禁用{' '}
            {Object.values(agentStates).filter((s) => !s.enabled).length}
          </p>
        </div>
        <Bot className="h-6 w-6 text-text-dim" />
      </div>

      {/* Agent 网格 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent) => {
          const state = agentStates[agent.id];
          return (
            <div
              key={agent.id}
              className={`rounded-lg border bg-bg-card p-5 transition-all ${
                state.enabled
                  ? 'border-border hover:border-gold-dim'
                  : 'border-border opacity-60'
              }`}
            >
              {/* 头部 */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-soft text-2xl">
                    {agent.avatar}
                  </span>
                  <div>
                    <p className="text-base font-medium text-text">{agent.name}</p>
                    <p className="text-xs text-text-dim">{agent.nameEn}</p>
                  </div>
                </div>
                <Badge variant={typeVariant[agent.type]}>{typeLabel[agent.type]}</Badge>
              </div>

              {/* 哲学 */}
              <div className="mt-4">
                <p className="text-xs text-text-dim">哲学</p>
                <p className="mt-0.5 text-sm text-text-soft">{agent.philosophy}</p>
              </div>

              {/* 说话风格 */}
              <div className="mt-3">
                <p className="text-xs text-text-dim">说话风格</p>
                <p className="mt-0.5 text-sm text-text-soft">{agent.speakingStyle}</p>
              </div>

              {/* 状态 */}
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    state.enabled ? 'bg-green' : 'bg-red'
                  }`}
                />
                <span className="text-xs text-text-soft">
                  {state.enabled ? '已启用' : '已禁用'}
                </span>
              </div>

              {/* 操作 */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(agent)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold"
                >
                  <Edit3 className="h-3 w-3" />
                  编辑 Prompt
                </button>
                <button
                  type="button"
                  onClick={() => toggleAgent(agent.id)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    state.enabled
                      ? 'border-red/30 bg-red/10 text-red hover:bg-red/20'
                      : 'border-green/30 bg-green/10 text-green hover:bg-green/20'
                  }`}
                >
                  <Power className="h-3 w-3" />
                  {state.enabled ? '禁用' : '启用'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 编辑 System Prompt 弹窗 */}
      <AdminModal
        open={!!editingAgent}
        onClose={() => setEditingAgent(null)}
        title={`编辑 System Prompt · ${editingAgent?.name ?? ''}`}
        width="640px"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditingAgent(null)}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={saveEdit}>
              保存
            </Button>
          </>
        }
      >
        {editingAgent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-bg-soft p-3">
              <span className="text-2xl">{editingAgent.avatar}</span>
              <div>
                <p className="text-sm font-medium text-text">{editingAgent.name}</p>
                <p className="text-xs text-text-dim">
                  {editingAgent.philosophy} · {editingAgent.speakingStyle}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs text-text-dim">
                System Prompt（{editPrompt.length} 字）
              </label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={14}
                className="w-full resize-y rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm leading-relaxed text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
                placeholder="输入 System Prompt..."
              />
              <p className="mt-1 text-[11px] text-text-dim">
                提示：System Prompt 决定 Agent 的角色、性格与发言风格。修改后保存即时生效（mock 模式）。
              </p>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
