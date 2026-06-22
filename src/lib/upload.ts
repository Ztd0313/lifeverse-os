/**
 * 文件上传工具函数
 *
 * 提供文件上传相关的常量定义与工具方法，包括：
 * - 允许的 MIME 类型映射
 * - 文件大小限制
 * - 唯一文件名生成
 * - 上传目录管理
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ===== 常量定义 =====

/** 允许的文件 MIME 类型映射，按分类组织 */
export const ALLOWED_TYPES: Record<string, string[]> = {
  /** 图片类型 */
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  /** 音频类型 */
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
  /** 视频类型 */
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  /** 文档类型 */
  document: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

/** 所有允许的 MIME 类型扁平列表 */
export const ALL_ALLOWED_TYPES: string[] = Object.values(ALLOWED_TYPES).flat();

/** 单文件最大大小：50MB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// ===== 工具函数 =====

/**
 * 生成唯一文件名
 *
 * 格式：时间戳 + 随机字符串 + 原始扩展名
 * 例如：1719012345678_a3f2b1c4.jpg
 *
 * @param originalName - 原始文件名（用于提取扩展名）
 * @returns 生成的唯一文件名
 */
export function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  return `${timestamp}_${randomStr}${ext}`;
}

/**
 * 获取上传目录的绝对路径
 *
 * 基于 Next.js 项目的 public 目录下的 uploads 子目录
 *
 * @returns 上传目录的绝对路径
 */
export function getUploadDir(): string {
  return path.join(process.cwd(), 'public', 'uploads');
}

/**
 * 确保上传目录存在
 *
 * 如果 public/uploads 目录不存在，则递归创建该目录
 */
export function ensureUploadDir(): void {
  const uploadDir = getUploadDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

/**
 * 检查文件 MIME 类型是否在允许范围内
 *
 * @param mimeType - 待检查的 MIME 类型
 * @returns 是否允许上传
 */
export function isAllowedType(mimeType: string): boolean {
  return ALL_ALLOWED_TYPES.includes(mimeType);
}

/**
 * 检查文件大小是否在限制范围内
 *
 * @param size - 文件大小（字节）
 * @returns 是否在大小限制内
 */
export function isWithinSizeLimit(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}
