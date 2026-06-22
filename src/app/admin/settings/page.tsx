'use client';

import * as React from 'react';
import {
  Settings,
  Bot,
  Users,
  Mail,
  Save,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

/**
 * 系统设置页面
 *
 * 功能：
 * - AI 模型配置（API Key 输入、模型选择、温度调节）
 * - 议会参数配置（默认轮数、超时时间、最大 Agent 数）
 * - 邮件通知配置
 * - 保存按钮（mock 保存）
 */

// ===== 配置区块组件 =====

interface SectionProps {
  title: string;
  description?: string;
  icon: typeof Settings;
  children: React.ReactNode;
}

function Section({ title, description, icon: Icon, children }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft">
          <Icon className="h-4 w-4 text-gold" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          {description && <p className="text-xs text-text-dim">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface RowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function Row({ label, description, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-soft py-3 last:border-b-0">
      <div>
        <p className="text-sm text-text">{label}</p>
        {description && <p className="text-xs text-text-dim">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ===== 主页面 =====

export default function AdminSettingsPage() {
  // AI 模型配置
  const [aiConfig, setAiConfig] = React.useState({
    apiKey: '',
    model: 'deepseek-chat',
    temperature: 0.8,
    maxTokens: 600,
    baseUrl: 'https://api.deepseek.com/v1',
  });
  const [showApiKey, setShowApiKey] = React.useState(false);

  // 议会参数配置
  const [councilConfig, setCouncilConfig] = React.useState({
    defaultRounds: 2,
    timeoutSeconds: 60,
    maxAgents: 7,
  });

  // 邮件通知配置
  const [emailConfig, setEmailConfig] = React.useState({
    enabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromAddress: 'noreply@lifeverse.app',
  });

  // 保存状态
  const [savedSection, setSavedSection] = React.useState<string | null>(null);

  const handleSave = (section: string) => {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-text">系统设置</h1>
          <p className="mt-1 text-sm text-text-soft">AI 模型 · 议会参数 · 邮件通知</p>
        </div>
        <Settings className="h-6 w-6 text-text-dim" />
      </div>

      {/* AI 模型配置 */}
      <Section
        title="AI 模型配置"
        description="DeepSeek API 连接参数"
        icon={Bot}
      >
        <Row label="API Key" description="DeepSeek API 密钥">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-bg-soft">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={aiConfig.apiKey}
                onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                placeholder="sk-xxx"
                className="w-56 bg-transparent px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-2 text-text-dim hover:text-text"
                aria-label={showApiKey ? '隐藏' : '显示'}
              >
                {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <Badge variant={aiConfig.apiKey ? 'green' : 'red'}>
              {aiConfig.apiKey ? '已配置' : '未配置'}
            </Badge>
          </div>
        </Row>

        <Row label="Base URL" description="API 基础地址">
          <input
            type="text"
            value={aiConfig.baseUrl}
            onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
            className="w-72 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text focus:outline-none"
          />
        </Row>

        <Row label="模型" description="DeepSeek 模型名称">
          <select
            value={aiConfig.model}
            onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
            className="rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text focus:outline-none"
          >
            <option value="deepseek-chat">deepseek-chat（通用对话）</option>
            <option value="deepseek-reasoner">deepseek-reasoner（推理增强）</option>
          </select>
        </Row>

        <Row label="温度" description={`采样温度：${aiConfig.temperature.toFixed(1)}（0=精确，2=发散）`}>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={aiConfig.temperature}
            onChange={(e) =>
              setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })
            }
            className="w-48 accent-gold"
          />
        </Row>

        <Row label="最大 Token 数" description="单次回复最大 token 数">
          <input
            type="number"
            min={100}
            max={4096}
            step={100}
            value={aiConfig.maxTokens}
            onChange={(e) =>
              setAiConfig({ ...aiConfig, maxTokens: parseInt(e.target.value, 10) || 600 })
            }
            className="w-28 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text focus:outline-none"
          />
        </Row>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave('ai')}
          >
            {savedSection === 'ai' ? (
              <>
                <Check className="h-3.5 w-3.5" />
                已保存
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                保存配置
              </>
            )}
          </Button>
        </div>
      </Section>

      {/* 议会参数配置 */}
      <Section
        title="议会参数配置"
        description="议会流程默认参数"
        icon={Users}
      >
        <Row label="默认辩论轮数" description="新议会默认的辩论轮次（1-3）">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setCouncilConfig({ ...councilConfig, defaultRounds: r })}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-all',
                  councilConfig.defaultRounds === r
                    ? 'border-gold bg-gold-soft/30 text-gold'
                    : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </Row>

        <Row label="超时时间（秒）" description="单次议会最长执行时间">
          <input
            type="number"
            min={30}
            max={300}
            step={10}
            value={councilConfig.timeoutSeconds}
            onChange={(e) =>
              setCouncilConfig({
                ...councilConfig,
                timeoutSeconds: parseInt(e.target.value, 10) || 60,
              })
            }
            className="w-24 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text focus:outline-none"
          />
        </Row>

        <Row label="最大 Agent 数" description="单次议会最多参与的 Agent 数量">
          <input
            type="number"
            min={3}
            max={12}
            step={1}
            value={councilConfig.maxAgents}
            onChange={(e) =>
              setCouncilConfig({
                ...councilConfig,
                maxAgents: parseInt(e.target.value, 10) || 7,
              })
            }
            className="w-24 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text focus:outline-none"
          />
        </Row>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="sm" onClick={() => handleSave('council')}>
            {savedSection === 'council' ? (
              <>
                <Check className="h-3.5 w-3.5" />
                已保存
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                保存配置
              </>
            )}
          </Button>
        </div>
      </Section>

      {/* 邮件通知配置 */}
      <Section
        title="邮件通知配置"
        description="系统邮件发送服务参数"
        icon={Mail}
      >
        <Row label="启用邮件通知" description="开启后系统将通过 SMTP 发送邮件">
          <button
            type="button"
            onClick={() => setEmailConfig({ ...emailConfig, enabled: !emailConfig.enabled })}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              emailConfig.enabled ? 'bg-gold' : 'bg-border'
            )}
            aria-label="切换邮件通知"
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                emailConfig.enabled ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </Row>

        <Row label="SMTP 主机" description="邮件服务器地址">
          <input
            type="text"
            value={emailConfig.smtpHost}
            onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
            placeholder="smtp.example.com"
            disabled={!emailConfig.enabled}
            className="w-56 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none disabled:opacity-40"
          />
        </Row>

        <Row label="SMTP 端口" description="邮件服务器端口">
          <input
            type="number"
            min={1}
            max={65535}
            value={emailConfig.smtpPort}
            onChange={(e) =>
              setEmailConfig({
                ...emailConfig,
                smtpPort: parseInt(e.target.value, 10) || 587,
              })
            }
            disabled={!emailConfig.enabled}
            className="w-24 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text focus:outline-none disabled:opacity-40"
          />
        </Row>

        <Row label="SMTP 用户名" description="邮件服务器登录用户名">
          <input
            type="text"
            value={emailConfig.smtpUser}
            onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
            placeholder="user@example.com"
            disabled={!emailConfig.enabled}
            className="w-56 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none disabled:opacity-40"
          />
        </Row>

        <Row label="SMTP 密码" description="邮件服务器登录密码">
          <input
            type="password"
            value={emailConfig.smtpPassword}
            onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
            placeholder="••••••••"
            disabled={!emailConfig.enabled}
            className="w-56 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none disabled:opacity-40"
          />
        </Row>

        <Row label="发件地址" description="系统邮件的发件人地址">
          <input
            type="text"
            value={emailConfig.fromAddress}
            onChange={(e) => setEmailConfig({ ...emailConfig, fromAddress: e.target.value })}
            disabled={!emailConfig.enabled}
            className="w-56 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-sm text-text focus:outline-none disabled:opacity-40"
          />
        </Row>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="sm" onClick={() => handleSave('email')}>
            {savedSection === 'email' ? (
              <>
                <Check className="h-3.5 w-3.5" />
                已保存
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                保存配置
              </>
            )}
          </Button>
        </div>
      </Section>
    </div>
  );
}
