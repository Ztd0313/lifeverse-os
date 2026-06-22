/**
 * 记忆管理 REST API Route
 *
 * 提供记忆数据的 CRUD 操作：
 * - GET  /api/memories  - 获取所有记忆列表
 * - POST /api/memories  - 创建新记忆
 *
 * 当前版本使用内存存储（开发阶段），后续可替换为数据库持久化。
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MemoryItem, MemoryType, MemoryEmotion, MemoryCategory } from '@/types';

// ===== 内存存储（开发阶段） =====

/** 内存中的记忆数据列表 */
let memories: MemoryItem[] = [];

// ===== GET：获取所有记忆列表 =====

/**
 * 获取所有记忆列表
 *
 * 查询参数：
 * - category：按星球分类筛选（可选）
 * - type：按类型筛选（可选）
 * - emotion：按情感色调筛选（可选）
 * - sort：排序方式 - date/importance（可选，默认 date）
 * - limit：返回数量限制（可选）
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<{ success: true; data: MemoryItem[]; total: number } | { success: false; error: string }>> {
  try {
    const { searchParams } = new URL(request.url);

    // 提取筛选参数
    const category = searchParams.get('category') as MemoryCategory | null;
    const type = searchParams.get('type') as MemoryType | null;
    const emotion = searchParams.get('emotion') as MemoryEmotion | null;
    const sort = searchParams.get('sort') || 'date';
    const limit = searchParams.get('limit');

    // 筛选记忆列表
    let filtered = [...memories];

    if (category) {
      filtered = filtered.filter((m) => m.category === category);
    }

    if (type) {
      filtered = filtered.filter((m) => m.type === type);
    }

    if (emotion) {
      filtered = filtered.filter((m) => m.emotion === emotion);
    }

    // 排序
    if (sort === 'importance') {
      filtered.sort((a, b) => b.importance - a.importance);
    } else {
      // 默认按日期降序
      filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    // 数量限制
    if (limit) {
      const num = parseInt(limit, 10);
      if (!isNaN(num) && num > 0) {
        filtered = filtered.slice(0, num);
      }
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('[记忆 API] 获取记忆列表失败：', error);
    return NextResponse.json(
      { success: false, error: '获取记忆列表失败' },
      { status: 500 }
    );
  }
}

// ===== POST：创建新记忆 =====

/** 创建记忆请求体类型 */
interface CreateMemoryBody {
  title: string;
  content: string;
  type: MemoryType;
  category: MemoryCategory;
  emotion: MemoryEmotion;
  date?: string;
  location?: string;
  people?: string[];
  tags?: string[];
  importance?: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  thumbnailUrl?: string;
}

/**
 * 创建新记忆
 *
 * 接收 JSON body，包含以下字段：
 * - title（必需）：记忆标题
 * - content（必需）：记忆内容
 * - type（必需）：记忆类型 - photo/text/voice/video
 * - category（必需）：星球分类 - forest/ocean/town/city/mountain
 * - emotion（必需）：情感色调 - warm/cool/neutral
 * - date（可选）：日期，默认当前时间
 * - location（可选）：地点
 * - people（可选）：相关人物
 * - tags（可选）：标签
 * - importance（可选）：重要度 0-1，默认 0.5
 * - fileUrl（可选）：上传文件的 URL 路径
 * - fileName（可选）：原始文件名
 * - fileSize（可选）：文件大小（字节）
 * - fileMimeType（可选）：文件 MIME 类型
 * - thumbnailUrl（可选）：缩略图 URL
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: true; data: MemoryItem } | { success: false; error: string }>> {
  try {
    const body = (await request.json()) as CreateMemoryBody;

    // ===== 必填字段验证 =====
    if (!body.title || !body.content || !body.type || !body.category || !body.emotion) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必填字段：title、content、type、category、emotion',
        },
        { status: 400 }
      );
    }

    // ===== 类型验证 =====
    const validTypes: MemoryType[] = ['photo', 'text', 'voice', 'video'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `无效的记忆类型：${body.type}，允许值：${validTypes.join('/')}`,
        },
        { status: 400 }
      );
    }

    const validCategories: MemoryCategory[] = ['forest', 'ocean', 'town', 'city', 'mountain'];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        {
          success: false,
          error: `无效的星球分类：${body.category}，允许值：${validCategories.join('/')}`,
        },
        { status: 400 }
      );
    }

    const validEmotions: MemoryEmotion[] = ['warm', 'cool', 'neutral'];
    if (!validEmotions.includes(body.emotion)) {
      return NextResponse.json(
        {
          success: false,
          error: `无效的情感色调：${body.emotion}，允许值：${validEmotions.join('/')}`,
        },
        { status: 400 }
      );
    }

    // ===== 构建记忆对象 =====
    const newMemory: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: body.title,
      content: body.content,
      type: body.type,
      category: body.category,
      emotion: body.emotion,
      date: body.date || new Date().toISOString(),
      location: body.location,
      people: body.people,
      tags: body.tags,
      importance:
        typeof body.importance === 'number'
          ? Math.min(1, Math.max(0, body.importance))
          : 0.5,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileMimeType: body.fileMimeType,
      thumbnailUrl: body.thumbnailUrl,
    };

    // 添加到内存存储
    memories.push(newMemory);

    return NextResponse.json(
      { success: true, data: newMemory },
      { status: 201 }
    );
  } catch (error) {
    console.error('[记忆 API] 创建记忆失败：', error);
    return NextResponse.json(
      { success: false, error: '创建记忆失败，请检查请求格式' },
      { status: 500 }
    );
  }
}
