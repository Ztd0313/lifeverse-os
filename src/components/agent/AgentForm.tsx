'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Sparkles,
  Check,
  Upload,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { fadeInUp, scaleIn } from '@/lib/motion/variants';
import { useTranslation } from '@/lib/i18n';
import {
  DIALOGUE_STYLE_LABELS,
  type DialogueStyle,
} from '@/lib/ai/agent-templates';
import type { CustomAgent, CustomAgentInput } from '@/stores/agent-store';

// ===== 常量配置 =====

/**
 * 预设头像列表
 *
 * 用户可以从这些 emoji 中选择头像，也可以通过上传自定义头像。
 */
const PRESET_AVATARS: string[] = [
  '🧙', '🧝', '🧞', '🧚', '🧠', '🦉', '🐉', '🦅',
  '🌟', '✨', '🔮', '📜', '🎭', '🎨', '🎵', '📚',
  '⚔️', '🛡️', '🏹', '💎', '🔥', '🌊', '🌿', '🌙',
  '☀️', '⚡', '🎯', '🧭', '⚖️', '💡', '🔑', '🏆',
];

/**
 * 专业领域选项
 */
const EXPERTISE_OPTIONS: { value: string; label: string }[] = [
  { value: '商业', label: '商业' },
  { value: '科技', label: '科技' },
  { value: '心理', label: '心理' },
  { value: '哲学', label: '哲学' },
  { value: '文学', label: '文学' },
  { value: '艺术', label: '艺术' },
  { value: '职业', label: '职业' },
  { value: '生活', label: '生活' },
  { value: '其他', label: '其他' },
];

/**
 * 对话风格选项
 */
const DIALOGUE_STYLE_OPTIONS: {
  value: DialogueStyle;
  label: string;
  description: string;
}[] = [
  {
    value: 'formal',
    label: '正式',
    description: '用词精准，逻辑清晰，语气庄重',
  },
  {
    value: 'casual',
    label: '轻松',
    description: '像朋友聊天，温暖亲切，拉近距离',
  },
  {
    value: 'humorous',
    label: '幽默',
    description: '善用比喻俏皮话，轻松中传递洞察',
  },
  {
    value: 'serious',
    label: '严肃',
    description: '每句话都有分量，直击问题核心',
  },
];

// ===== 表单数据与校验 =====

/**
 * AI 分析返回的英文专业领域到表单中文值的映射
 *
 * /api/analyze-chat 返回的 expertise 为英文枚举值，
 * 需要映射回表单使用的中文值。
 */
const EXPERTISE_EN_TO_CN: Record<string, string> = {
  business: '商业',
  tech: '科技',
  psychology: '心理',
  philosophy: '哲学',
  literature: '文学',
  art: '艺术',
  career: '职业',
  life: '生活',
  other: '其他',
};

/**
 * 表单数据结构
 */
interface AgentFormData {
  name: string;
  avatar: string;
  personality: string;
  expertise: string;
  dialogueStyle: DialogueStyle;
  coreBelief: string;
}

/**
 * 表单初始数据
 */
const INITIAL_FORM_DATA: AgentFormData = {
  name: '',
  avatar: PRESET_AVATARS[0],
  personality: '',
  expertise: '商业',
  dialogueStyle: 'casual',
  coreBelief: '',
};

/**
 * 表单校验规则
 */
interface ValidationErrors {
  name?: string;
  personality?: string;
  coreBelief?: string;
}

/**
 * 校验表单数据
 */
function validateForm(data: AgentFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // 名称：2-20 字符
  if (data.name.length < 2) {
    errors.name = '名称至少需要 2 个字符';
  } else if (data.name.length > 20) {
    errors.name = '名称不能超过 20 个字符';
  }

  // 性格描述：50-200 字
  if (data.personality.length < 50) {
    errors.personality = `性格描述至少需要 50 字（当前 ${data.personality.length} 字）`;
  } else if (data.personality.length > 200) {
    errors.personality = `性格描述不能超过 200 字（当前 ${data.personality.length} 字）`;
  }

  // 核心理念：20-100 字
  if (data.coreBelief.length < 20) {
    errors.coreBelief = `核心理念至少需要 20 字（当前 ${data.coreBelief.length} 字）`;
  } else if (data.coreBelief.length > 100) {
    errors.coreBelief = `核心理念不能超过 100 字（当前 ${data.coreBelief.length} 字）`;
  }

  return errors;
}

// ===== 组件 Props =====

/**
 * AgentForm 组件 Props
 */
export interface AgentFormProps {
  /** 是否可见 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 保存回调（创建或更新） */
  onSave: (data: CustomAgentInput) => void;
  /** 编辑时传入的初始数据，为空则为创建模式 */
  initialAgent?: CustomAgent | null;
}

// ===== 预览卡片组件 =====

/**
 * Agent 卡片预览
 *
 * 实时展示用户当前填写的 Agent 信息。
 */
function AgentPreview({ data }: { data: AgentFormData }) {
  const expertiseLabel =
    EXPERTISE_OPTIONS.find((o) => o.value === data.expertise)?.label ||
    data.expertise;
  const styleLabel = DIALOGUE_STYLE_LABELS[data.dialogueStyle];

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      className="sticky top-6"
    >
      <div className="rounded-[14px] border border-gold-dim bg-bg-card/80 p-6 backdrop-blur-sm glow-gold">
        {/* 预览标题 */}
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="text-xs font-medium tracking-widest text-gold">
            实时预览
          </span>
        </div>

        {/* 头像 + 名称 */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gold-dim bg-gold-soft text-5xl">
            {data.avatar}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-text">
              {data.name || '未命名 Agent'}
            </h3>
            <p className="text-xs font-medium text-gold">
              自定义成员
            </p>
          </div>
        </div>

        {/* 标签 */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge variant="gold">{expertiseLabel}</Badge>
          <Badge variant="blue">{styleLabel}</Badge>
        </div>

        {/* 性格描述 */}
        <div className="mt-4 space-y-3">
          <div>
            <span className="text-xs text-text-dim">性格</span>
            <p className="mt-1 text-sm leading-relaxed text-text-soft">
              {data.personality || '尚未填写性格描述...'}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-dim">核心理念</span>
            <p className="mt-1 text-sm leading-relaxed text-text-soft">
              {data.coreBelief || '尚未填写核心理念...'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===== 主组件 =====

/**
 * 创建/编辑 Agent 表单组件
 *
 * 功能：
 * - 名称输入（2-20 字符）
 * - 头像选择（预设 emoji 列表）
 * - 性格描述（50-200 字）
 * - 专业领域（下拉选择）
 * - 对话风格（4 选 1）
 * - 核心理念（20-100 字）
 * - 右侧实时预览 Agent 卡片
 * - 保存按钮
 *
 * 设计：
 * - 暗色 + 金色主题
 * - framer-motion 动画
 * - 毛玻璃弹窗
 */
export function AgentForm({
  open,
  onClose,
  onSave,
  initialAgent,
}: AgentFormProps) {
  const isEditMode = !!initialAgent;

  // i18n - 获取当前语言，传递给 AI 分析接口
  const { locale } = useTranslation();

  // 表单数据
  const [formData, setFormData] = React.useState<AgentFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  // ===== 聊天记录分析相关 state =====
  /** 已上传的聊天截图 URL */
  const [chatImageUrl, setChatImageUrl] = React.useState('');
  /** 图片上传中 */
  const [isUploading, setIsUploading] = React.useState(false);
  /** AI 分析中 */
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  /** 分析结果摘要（成功/失败提示） */
  const [analysisResult, setAnalysisResult] = React.useState<string | null>(
    null
  );
  /** 分析是否出错 */
  const [analysisError, setAnalysisError] = React.useState(false);
  /** 隐藏的文件输入 ref */
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 编辑模式时，用 initialAgent 填充表单
  React.useEffect(() => {
    if (open && initialAgent) {
      setFormData({
        name: initialAgent.name,
        avatar: initialAgent.avatar,
        personality: initialAgent.personality,
        expertise: initialAgent.expertise,
        dialogueStyle: initialAgent.dialogueStyle,
        coreBelief: initialAgent.coreBelief,
      });
    } else if (open && !initialAgent) {
      // 创建模式重置
      setFormData(INITIAL_FORM_DATA);
    }
    // 重置聊天记录分析状态
    setChatImageUrl('');
    setIsUploading(false);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setAnalysisError(false);
    setErrors({});
  }, [open, initialAgent]);

  // ESC 键关闭
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, submitting]);

  // 锁定背景滚动
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  /** 更新表单字段 */
  const updateField = <K extends keyof AgentFormData>(
    field: K,
    value: AgentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /** 处理聊天截图上传 */
  const handleChatImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 简单校验图片类型
    if (!file.type.startsWith('image/')) {
      setAnalysisResult('请上传图片文件');
      setAnalysisError(true);
      return;
    }

    setIsUploading(true);
    setAnalysisResult(null);
    setAnalysisError(false);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '上传失败');
      }

      setChatImageUrl(data.url);
      setAnalysisResult('截图上传成功，点击"AI分析"提取人物特征');
      setAnalysisError(false);
    } catch (err) {
      setAnalysisResult(
        err instanceof Error ? `上传失败：${err.message}` : '图片上传失败，请重试'
      );
      setAnalysisError(true);
    } finally {
      setIsUploading(false);
      // 重置 input 以便重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /** 调用 AI 分析聊天截图，自动填充表单 */
  const handleAnalyzeChat = async () => {
    if (!chatImageUrl) {
      setAnalysisResult('请先上传聊天记录截图');
      setAnalysisError(true);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(false);

    try {
      const res = await fetch('/api/analyze-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: chatImageUrl,
          locale,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '分析失败');
      }

      const analysis = data.analysis;

      // 自动填充表单字段（用户仍可修改）
      setFormData((prev) => ({
        ...prev,
        personality: analysis.personality || prev.personality,
        coreBelief: analysis.coreBelief || prev.coreBelief,
        dialogueStyle:
          (analysis.dialogueStyle as DialogueStyle) || prev.dialogueStyle,
        expertise:
          EXPERTISE_EN_TO_CN[analysis.expertise] || prev.expertise,
        name: analysis.suggestedName || prev.name,
      }));

      // 清除已填充字段的校验错误
      setErrors({});

      setAnalysisResult(
        analysis.analysisSummary
          ? `分析完成：${analysis.analysisSummary}`
          : '分析完成，已自动填充表单，你可以继续修改'
      );
      setAnalysisError(false);
    } catch (err) {
      setAnalysisResult(
        err instanceof Error
          ? `分析失败：${err.message}，你可以手动填写`
          : 'AI分析失败，请手动填写'
      );
      setAnalysisError(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /** 处理保存 */
  const handleSave = () => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const input: CustomAgentInput = {
        name: formData.name.trim(),
        avatar: formData.avatar,
        personality: formData.personality.trim(),
        expertise: formData.expertise,
        dialogueStyle: formData.dialogueStyle,
        coreBelief: formData.coreBelief.trim(),
      };
      onSave(input);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="agent-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !submitting && onClose()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-form-title"
        >
          <motion.div
            key="agent-form-content"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[14px] border border-border bg-bg-soft shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
          >
            {/* 顶部装饰条 */}
            <div className="h-1 w-full bg-gold" aria-hidden="true" />

            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              aria-label="关闭"
              className="absolute right-4 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-card hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 标题 */}
            <div className="px-6 pb-4 pt-6">
              <h2
                id="agent-form-title"
                className="font-serif text-2xl text-text"
              >
                {isEditMode ? '编辑 Agent' : '创建新 Agent'}
              </h2>
              <p className="mt-1 text-sm text-text-soft">
                {isEditMode
                  ? '修改你的专属议会成员'
                  : '为你的智慧议会打造一位专属成员'}
              </p>
            </div>

            {/* 内容区：左表单 + 右预览 */}
            <div className="max-h-[calc(90vh-180px)] overflow-y-auto px-6 pb-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                {/* ===== 左侧：表单 ===== */}
                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  className="space-y-5"
                >
                  {/* 名称 */}
                  <div>
                    <label
                      htmlFor="agent-name"
                      className="mb-1.5 block text-sm font-medium text-text"
                    >
                      名称
                      <span className="ml-1 text-xs text-text-dim">
                        （2-20 字符）
                      </span>
                    </label>
                    <input
                      id="agent-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="给你的 Agent 起个名字"
                      maxLength={20}
                      className={cn(
                        'w-full rounded-lg border bg-bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none transition-colors',
                        errors.name
                          ? 'border-red focus:border-red'
                          : 'border-border focus:border-gold-dim'
                      )}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      {errors.name ? (
                        <span className="text-xs text-red">{errors.name}</span>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-text-dim">
                        {formData.name.length}/20
                      </span>
                    </div>
                  </div>

                  {/* 头像选择 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      头像
                      <span className="ml-1 text-xs text-text-dim">
                        （从预设列表选择）
                      </span>
                    </label>
                    <div className="grid grid-cols-8 gap-2 rounded-lg border border-border bg-bg-card p-3">
                      {PRESET_AVATARS.map((avatar) => {
                        const isSelected = formData.avatar === avatar;
                        return (
                          <motion.button
                            key={avatar}
                            type="button"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateField('avatar', avatar)}
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all',
                              isSelected
                                ? 'border border-gold bg-gold-soft glow-gold'
                                : 'border border-transparent hover:border-gold-dim hover:bg-bg-card-hover'
                            )}
                            aria-label={`选择头像 ${avatar}`}
                            aria-pressed={isSelected}
                          >
                            {isSelected ? (
                              <span className="relative">
                                {avatar}
                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold">
                                  <Check className="h-2.5 w-2.5 text-bg" />
                                </span>
                              </span>
                            ) : (
                              avatar
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 专业领域 */}
                  <div>
                    <label
                      htmlFor="agent-expertise"
                      className="mb-1.5 block text-sm font-medium text-text"
                    >
                      专业领域
                    </label>
                    <select
                      id="agent-expertise"
                      value={formData.expertise}
                      onChange={(e) => updateField('expertise', e.target.value)}
                      className="w-full rounded-lg border border-border bg-bg-card px-4 py-2.5 text-sm text-text focus:border-gold-dim focus:outline-none transition-colors"
                    >
                      {EXPERTISE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 对话风格 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      对话风格
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DIALOGUE_STYLE_OPTIONS.map((opt) => {
                        const isSelected = formData.dialogueStyle === opt.value;
                        return (
                          <motion.button
                            key={opt.value}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => updateField('dialogueStyle', opt.value)}
                            className={cn(
                              'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                              isSelected
                                ? 'border-gold bg-gold-soft/30 glow-gold'
                                : 'border-border bg-bg-card hover:border-gold-dim'
                            )}
                            aria-pressed={isSelected}
                          >
                            <span
                              className={cn(
                                'text-sm font-medium',
                                isSelected ? 'text-gold' : 'text-text'
                              )}
                            >
                              {opt.label}
                            </span>
                            <span className="text-[10px] leading-tight text-text-dim">
                              {opt.description}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ===== 聊天记录分析（AI 辅助填充）===== */}
                  <div className="rounded-lg border border-gold-dim/40 bg-gold-soft/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-gold" />
                      <span className="text-sm font-medium text-text">
                        聊天记录分析
                      </span>
                      <span className="text-xs text-text-dim">
                        （上传对话截图，AI 自动提取人物特征）
                      </span>
                    </div>

                    {/* 隐藏的文件输入 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleChatImageUpload}
                      className="hidden"
                    />

                    {/* 上传区域 / 图片预览 */}
                    {!chatImageUrl ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isAnalyzing}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg-card/50 px-4 py-6 text-text-dim transition-colors hover:border-gold-dim hover:text-text-soft disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-6 w-6 animate-spin text-gold" />
                            <span className="text-xs">上传中...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-6 w-6" />
                            <span className="text-xs">
                              点击上传聊天记录截图
                            </span>
                            <span className="text-[10px] text-text-dim">
                              支持 JPG / PNG / WebP
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {/* 图片预览 */}
                        <div className="relative overflow-hidden rounded-lg border border-border bg-bg-card">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={chatImageUrl}
                            alt="聊天记录截图"
                            className="max-h-48 w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setChatImageUrl('');
                              setAnalysisResult(null);
                              setAnalysisError(false);
                            }}
                            disabled={isAnalyzing}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
                            aria-label="移除图片"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* AI 分析按钮 */}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleAnalyzeChat}
                          disabled={isAnalyzing}
                          className="w-full"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              AI 分析中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              AI 分析人物特征
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* 分析结果提示 */}
                    {analysisResult && (
                      <div
                        className={cn(
                          'mt-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs',
                          analysisError
                            ? 'bg-red/10 text-red'
                            : 'bg-gold-soft/20 text-gold'
                        )}
                      >
                        {analysisError ? (
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span className="leading-relaxed">{analysisResult}</span>
                      </div>
                    )}
                  </div>

                  {/* 性格描述 */}
                  <div>
                    <label
                      htmlFor="agent-personality"
                      className="mb-1.5 block text-sm font-medium text-text"
                    >
                      性格描述
                      <span className="ml-1 text-xs text-text-dim">
                        （50-200 字）
                      </span>
                    </label>
                    <textarea
                      id="agent-personality"
                      value={formData.personality}
                      onChange={(e) =>
                        updateField('personality', e.target.value)
                      }
                      placeholder="描述这个 Agent 的性格特点，例如：经验丰富、直来直去但内心温暖，善于从战略高度看问题..."
                      rows={4}
                      maxLength={200}
                      className={cn(
                        'w-full resize-none rounded-lg border bg-bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none transition-colors',
                        errors.personality
                          ? 'border-red focus:border-red'
                          : 'border-border focus:border-gold-dim'
                      )}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      {errors.personality ? (
                        <span className="text-xs text-red">
                          {errors.personality}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-text-dim">
                        {formData.personality.length}/200
                      </span>
                    </div>
                  </div>

                  {/* 核心理念 */}
                  <div>
                    <label
                      htmlFor="agent-core-belief"
                      className="mb-1.5 block text-sm font-medium text-text"
                    >
                      核心理念
                      <span className="ml-1 text-xs text-text-dim">
                        （20-100 字）
                      </span>
                    </label>
                    <textarea
                      id="agent-core-belief"
                      value={formData.coreBelief}
                      onChange={(e) =>
                        updateField('coreBelief', e.target.value)
                      }
                      placeholder="这个 Agent 坚信什么？例如：行动比完美更重要，长期主义终将胜出..."
                      rows={3}
                      maxLength={100}
                      className={cn(
                        'w-full resize-none rounded-lg border bg-bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none transition-colors',
                        errors.coreBelief
                          ? 'border-red focus:border-red'
                          : 'border-border focus:border-gold-dim'
                      )}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      {errors.coreBelief ? (
                        <span className="text-xs text-red">
                          {errors.coreBelief}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-text-dim">
                        {formData.coreBelief.length}/100
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* ===== 右侧：实时预览 ===== */}
                <div className="hidden lg:block">
                  <AgentPreview data={formData} />
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-bg-soft px-6 py-4">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={submitting}
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={submitting}
              >
                <Save className="h-4 w-4" />
                {isEditMode ? '保存修改' : '创建 Agent'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AgentForm;
