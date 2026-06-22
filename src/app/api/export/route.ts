import { NextResponse } from 'next/server';
import type { ExportData } from '@/lib/export';

/**
 * 数据导出 API 路由
 *
 * POST /api/export
 *
 * 请求体：
 * {
 *   "format": "json" | "csv",   // 必填，导出格式（PDF 在客户端生成）
 *   "data":   ExportData         // 可选，自定义数据；不传则服务端从请求体读取
 * }
 *
 * 响应：
 * - JSON / CSV：直接返回文件流（Content-Disposition: attachment）
 * - PDF：由于依赖 html2canvas（浏览器 API），PDF 在客户端生成，
 *        服务端仅返回 JSON 数据包供客户端使用本路由的 GET 接口
 *
 * GET /api/export
 * 返回 API 说明（便于调试）。
 */

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ExportRequestBody {
  format?: unknown;
  data?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. 解析请求体
  let body: ExportRequestBody;
  try {
    body = (await request.json()) as ExportRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { format, data } = body;

  if (
    typeof format !== 'string' ||
    !['json', 'csv'].includes(format)
  ) {
    return NextResponse.json(
      {
        error:
          'Field "format" is required and must be "json" or "csv" (PDF is generated client-side)',
      },
      { status: 400 }
    );
  }

  // 2. 组装导出数据：优先使用客户端传入的 data，否则尝试从请求中重建
  //    注意：服务端无法访问浏览器 localStorage，因此 PDF 必须在客户端生成
  let exportData: ExportData;
  if (data && typeof data === 'object') {
    exportData = data as ExportData;
  } else {
    // 服务端无 localStorage，返回空数据包
    exportData = {
      meta: {
        version: '5.0.0',
        exportedAt: new Date().toISOString(),
        app: 'LifeVerse',
      },
      councils: [],
      reports: [],
      timelines: [],
    };
  }

  // 3. 根据格式生成文件内容
  const timestamp = Date.now();
  const filename = `lifeverse-export-${timestamp}`;

  if (format === 'json') {
    const json = JSON.stringify(exportData, null, 2);
    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });
  }

  // format === 'csv'
  const headers = [
    'ID',
    '场次',
    '议会类型',
    '问题',
    '问题类型',
    '阶段',
    '参与者',
    '发言数',
    '冲突数',
    '创建时间',
    '报告摘要',
  ];

  const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = exportData.councils.map((c) => [
    c.id,
    c.sessionNumber,
    c.councilType,
    c.question,
    c.questionType,
    c.phase,
    c.personas.map((p) => p.name).join(' / '),
    c.messages.length,
    c.conflicts.length,
    new Date(c.createdAt).toLocaleString('zh-CN'),
    c.report?.summary ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\r\n');

  return new NextResponse(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}

/**
 * GET /api/export
 *
 * 返回 API 说明（便于调试）。
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/export',
    method: 'POST',
    description: '导出 LifeVerse 数据为 JSON 或 CSV 文件',
    requestSchema: {
      format: 'string (required) — "json" | "csv"（PDF 在客户端生成）',
      data: 'ExportData (optional) — 自定义导出数据',
    },
    responseSchema: {
      json: 'application/json 文件流',
      csv: 'text/csv 文件流',
    },
    note: 'PDF 导出依赖浏览器端 html2canvas，请在客户端调用 exportAsPDF()',
  });
}
