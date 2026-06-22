'use client';

import { useState, useCallback, useRef, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Mic,
  Video,
  Plus,
  X,
  Sparkles,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { fadeInUp, scaleIn } from '@/lib/motion/variants';
import { EMOTIONS } from '@/lib/mock-memories';
import type { MemoryEmotion, MemoryType, MemoryItem } from '@/types';

/**
 * 支持的上传类型
 */
const UPLOAD_TYPES: { type: MemoryType; label: string; icon: typeof ImageIcon }[] =
  [
    { type: 'photo', label: '照片', icon: ImageIcon },
    { type: 'text', label: '文字', icon: FileText },
    { type: 'voice', label: '语音', icon: Mic },
    { type: 'video', label: '视频', icon: Video },
  ];

/** 允许的文件 MIME 类型前缀 */
const ALLOWED_TYPE_PREFIXES = ['image/', 'audio/', 'video/'];
/** 允许的文件扩展名 */
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.doc', '.docx'];
/** 最大文件大小：50MB */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * MemoryUpload 组件 Props
 */
export interface MemoryUploadProps {
  /** 添加记忆回调 */
  onAddMemory: (
    memory: Omit<MemoryItem, 'id' | 'category'> &
      Partial<Pick<MemoryItem, 'category'>>
  ) => Promise<void>;
  /** 是否打开表单弹窗（受控模式，可选） */
  isOpen?: boolean;
  /** 关闭弹窗回调（受控模式，可选） */
  onClose?: () => void;
}

/**
 * 文件大小格式化
 */
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * 验证文件类型是否被允许
 */
const isFileTypeAllowed = (file: File): boolean => {
  // 检查 MIME 类型前缀
  if (ALLOWED_TYPE_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
    return true;
  }
  // 检查文件扩展名
  const fileName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

/**
 * 根据文件 MIME 类型自动推断记忆类型
 */
const inferMemoryType = (file: File): MemoryType => {
  if (file.type.startsWith('image/')) return 'photo';
  if (file.type.startsWith('audio/')) return 'voice';
  if (file.type.startsWith('video/')) return 'video';
  return 'text';
};

/**
 * 记忆上传区组件
 *
 * 功能：
 * 1. 拖拽上传区域（虚线边框）—— 支持真实文件上传
 * 2. 支持类型：照片 / 文字 / 语音 / 视频（用图标表示）
 * 3. "记录此刻"按钮，点击后弹出表单（标题 + 内容 + 情感色调）
 * 4. 表单中可选择文件，支持图片预览、上传进度显示
 * 5. 表单提交后调用 onAddMemory，自动归入当前星球
 */
export function MemoryUpload({ onAddMemory, isOpen, onClose }: MemoryUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 表单状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<MemoryEmotion>('warm');
  const [type, setType] = useState<MemoryType>('text');

  // 文件上传状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 隐藏的文件 input 引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 受控 / 非受控模式统一处理弹窗开关 */
  const formOpen = (isOpen !== undefined ? isOpen : false) || isFormOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setIsFormOpen(false);
    resetForm();
  };

  /** 重置表单 */
  const resetForm = () => {
    setTitle('');
    setContent('');
    setEmotion('warm');
    setType('text');
    setSelectedFile(null);
    setFilePreview(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * 处理文件验证与设置
   * 统一拖拽和手动选择的文件处理逻辑
   */
  const processFile = useCallback((file: File) => {
    // 验证文件类型
    if (!isFileTypeAllowed(file)) {
      setUploadError('不支持的文件类型，请上传图片、音频、视频或文档文件');
      return;
    }

    // 验证文件大小（最大 50MB）
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`文件大小超过限制（最大 50MB），当前文件 ${formatFileSize(file.size)}`);
      return;
    }

    // 清除之前的错误
    setUploadError(null);

    // 设置选中文件
    setSelectedFile(file);

    // 如果是图片，生成预览 URL
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // 自动根据文件类型设置记忆类型
    const inferredType = inferMemoryType(file);
    setType(inferredType);

    // 打开表单
    setIsFormOpen(true);
  }, []);

  /** 处理拖拽进入 */
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  /** 处理拖拽离开 */
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /** 处理拖拽悬停 */
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /** 处理拖拽释放 —— 真实读取文件 */
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  /** 处理手动选择文件 */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  /** 移除已选文件 */
  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** 点击拖拽区域打开文件选择 */
  const handleDropAreaClick = () => {
    fileInputRef.current?.click();
  };

  /** 点击类型图标快速打开表单 */
  const handleTypeClick = (t: MemoryType) => {
    setType(t);
    setIsFormOpen(true);
  };

  /** 上传文件到服务器 */
  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    // 优先使用阿里云服务器，降级到本地 Next.js API
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const uploadUrl = `${apiBaseUrl}/api/upload`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`上传失败：${response.statusText}`);
      }

      const data = await response.json();
      // 拼接完整的文件访问 URL
      const fileUrl = data.url
        ? `${apiBaseUrl}${data.url}`
        : data.fileUrl || null;
      return fileUrl;
    } catch (error) {
      throw error;
    }
  };

  /** 提交表单 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    let fileUrl: string | undefined;

    // 如果有选中文件，先上传文件
    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        // 模拟进度更新（实际进度取决于服务器是否支持）
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 15;
          });
        }, 200);

        fileUrl = (await uploadFile(selectedFile)) || undefined;

        clearInterval(progressInterval);
        setUploadProgress(100);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : '文件上传失败，但记忆仍可保存'
        );
        setIsUploading(false);
        // 上传失败不阻止纯文本记忆的创建，继续执行
      } finally {
        setIsUploading(false);
      }
    }

    await onAddMemory({
      title: title.trim(),
      content: content.trim(),
      type,
      emotion,
      date: new Date().toISOString(),
      tags: ['新建'],
      importance: 0.5,
      ...(fileUrl ? { fileUrl } : {}),
    });

    handleClose();
  };

  return (
    <>
      {/* 隐藏的文件 input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.txt,.md,.doc,.docx"
        onChange={handleFileSelect}
      />

      {/* 拖拽上传区域 */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="w-full"
      >
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleDropAreaClick}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[14px] border-2 border-dashed p-8 text-center transition-all duration-300',
            isDragging
              ? 'border-gold bg-gold-soft/20 shadow-[0_0_28px_var(--shadow-gold)]'
              : 'border-border bg-bg-card/40 hover:border-gold-dim'
          )}
        >
          {/* 拖拽提示 */}
          <motion.div
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft"
          >
            <Upload
              size={24}
              className={cn(
                'transition-colors',
                isDragging ? 'text-gold' : 'text-text-soft'
              )}
            />
          </motion.div>

          <div>
            <p className="text-sm font-medium text-text">
              {isDragging ? '松开即可上传' : '拖拽记忆到此处，或点击选择文件'}
            </p>
            <p className="mt-1 text-xs text-text-dim">
              支持照片、文字、语音、视频 · AI 会自动分类到对应星球
            </p>
          </div>

          {/* 类型快捷入口 */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {UPLOAD_TYPES.map(({ type: t, label, icon: Icon }) => (
              <button
                key={t}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeClick(t);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-all hover:border-gold-dim hover:text-gold"
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* 记录此刻按钮 */}
          <Button
            variant="gold"
            size="md"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFormOpen(true);
            }}
            className="mt-2"
          >
            <Sparkles size={16} />
            记录此刻
          </Button>
        </div>
      </motion.div>

      {/* 记录表单弹窗 */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            key="upload-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* 毛玻璃背景 */}
            <div className="absolute inset-0 bg-bg/70 backdrop-blur-md" />

            {/* 表单卡片 */}
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg rounded-[14px] border border-border bg-bg-card p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
            >
              {/* 头部 */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft">
                    <Plus size={18} className="text-gold" />
                  </span>
                  <div>
                    <h2 className="font-serif text-lg text-text">
                      记录此刻
                    </h2>
                    <p className="text-[11px] text-text-dim">
                      让这一刻有形状
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="关闭"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-bg-soft hover:text-gold"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 表单 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 类型选择 */}
                <div>
                  <label className="mb-2 block text-xs text-text-dim">
                    记忆类型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {UPLOAD_TYPES.map(({ type: t, label, icon: Icon }) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all',
                          type === t
                            ? 'border-gold bg-gold-soft text-gold'
                            : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
                        )}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 文件选择区域 */}
                <div>
                  <label className="mb-2 block text-xs text-text-dim">
                    附件
                  </label>

                  <AnimatePresence mode="wait">
                    {selectedFile ? (
                      /* 已选文件展示 */
                      <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 rounded-lg border border-border bg-bg-soft p-3"
                      >
                        {/* 图片预览或文件图标 */}
                        {filePreview ? (
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                            <img
                              src={filePreview}
                              alt="预览"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gold-soft">
                            <FileText size={20} className="text-gold" />
                          </div>
                        )}

                        {/* 文件信息 */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text">
                            {selectedFile.name}
                          </p>
                          <p className="mt-0.5 text-xs text-text-dim">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>

                        {/* 移除按钮 */}
                        <button
                          type="button"
                          onClick={removeFile}
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-red-500/10 hover:text-red-400"
                          aria-label="移除文件"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ) : (
                      /* 未选文件时的选择按钮 */
                      <motion.button
                        key="file-select"
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg-soft px-4 py-3 text-xs text-text-soft transition-all hover:border-gold-dim hover:text-gold"
                      >
                        <Paperclip size={14} />
                        选择文件（可选）
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* 上传进度条 */}
                  <AnimatePresence>
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-xs text-text-dim">
                          <span>正在上传...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              width: `${uploadProgress}%`,
                              background:
                                'linear-gradient(90deg, #c9a84c, #f0d78c)',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 上传错误提示 */}
                  <AnimatePresence>
                    {uploadError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-2 text-xs text-red-400"
                      >
                        {uploadError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* 标题 */}
                <div>
                  <label
                    htmlFor="memory-title"
                    className="mb-2 block text-xs text-text-dim"
                  >
                    标题
                  </label>
                  <input
                    id="memory-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="给这段记忆起个名字..."
                    className="w-full rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
                    required
                  />
                </div>

                {/* 内容 */}
                <div>
                  <label
                    htmlFor="memory-content"
                    className="mb-2 block text-xs text-text-dim"
                  >
                    内容
                  </label>
                  <textarea
                    id="memory-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="发生了什么？你当时在想什么？"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
                    required
                  />
                </div>

                {/* 情感色调 */}
                <div>
                  <label className="mb-2 block text-xs text-text-dim">
                    情感色调
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((em) => (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => setEmotion(em.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all',
                          emotion === em.id
                            ? 'border-gold bg-gold-soft text-gold'
                            : 'border-border bg-bg-soft text-text-soft hover:border-gold-dim'
                        )}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: em.color }}
                        />
                        {em.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 提示 */}
                <div className="flex items-center gap-2 rounded-lg bg-bg-soft p-2.5">
                  <Badge variant="gold">提示</Badge>
                  <span className="text-[11px] text-text-dim">
                    新记忆将归入当前选中的星球，可稍后手动修正。
                  </span>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={handleClose}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={
                      !title.trim() ||
                      !content.trim() ||
                      isUploading
                    }
                  >
                    <Sparkles size={16} />
                    {isUploading ? '上传中...' : '保存记忆'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MemoryUpload;
