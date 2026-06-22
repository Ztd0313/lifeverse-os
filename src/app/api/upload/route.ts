/**
 * 文件上传 API Route
 *
 * 处理 POST 请求，接收 multipart/form-data 格式的文件上传。
 * 支持的字段：
 * - file：上传的文件（必需）
 * - title：标题（可选）
 * - content：内容描述（可选）
 * - type：文件类型 - photo/text/voice/video（可选）
 * - emotion：情感色调 - warm/cool/neutral（可选）
 *
 * 文件保存到 public/uploads/ 目录，返回文件访问 URL。
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  generateFilename,
  getUploadDir,
  ensureUploadDir,
  isAllowedType,
  isWithinSizeLimit,
  MAX_FILE_SIZE,
} from '@/lib/upload';

/** 上传成功的响应类型 */
interface UploadSuccessResponse {
  success: true;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  title?: string;
  content?: string;
  memoryType?: string;
  emotion?: string;
}

/** 上传失败的响应类型 */
interface UploadErrorResponse {
  success: false;
  error: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadSuccessResponse | UploadErrorResponse>> {
  try {
    // 解析 multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // 提取可选的元数据字段
    const title = (formData.get('title') as string) || '';
    const content = (formData.get('content') as string) || '';
    const memoryType = (formData.get('type') as string) || '';
    const emotion = (formData.get('emotion') as string) || '';

    // ===== 验证：检查文件是否存在 =====
    if (!file) {
      return NextResponse.json(
        { success: false, error: '未提供文件，请选择要上传的文件' },
        { status: 400 }
      );
    }

    // ===== 验证：检查文件类型是否支持 =====
    if (!isAllowedType(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `不支持的文件类型：${file.type}。支持的类型包括：图片（jpg/jpeg/png/gif/webp）、音频（mp3/wav/ogg/m4a）、视频（mp4/webm/mov）、文档（pdf/txt/md/doc/docx）`,
        },
        { status: 400 }
      );
    }

    // ===== 验证：检查文件大小 =====
    if (!isWithinSizeLimit(file.size)) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        {
          success: false,
          error: `文件大小 ${sizeMB}MB 超过限制，最大允许 ${maxMB}MB`,
        },
        { status: 400 }
      );
    }

    // ===== 确保上传目录存在 =====
    ensureUploadDir();

    // ===== 生成唯一文件名并保存文件 =====
    const filename = generateFilename(file.name);
    const uploadDir = getUploadDir();
    const filePath = path.join(uploadDir, filename);

    // 将文件写入磁盘
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);

    // 构建文件访问 URL（相对于 public 目录）
    const url = `/uploads/${filename}`;

    // 返回上传成功响应
    return NextResponse.json({
      success: true,
      url,
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      title,
      content,
      memoryType,
      emotion,
    });
  } catch (error) {
    // 捕获未知错误
    console.error('[上传 API] 文件上传失败：', error);
    const message =
      error instanceof Error ? error.message : '服务器内部错误，文件上传失败';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
