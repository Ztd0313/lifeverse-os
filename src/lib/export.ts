/**
 * 数据导出工具
 *
 * 支持 JSON / PDF / CSV 三种格式导出 LifeVerse 数据。
 *
 * - JSON：完整结构化数据，便于备份与恢复
 * - PDF：通过 html2canvas 截图 + jsPDF 拼接，支持中文，A4 自动分页
 * - CSV：表格化数据，便于在 Excel / Numbers 中查看
 *
 * 数据来源：localStorage 中以 `lifeverse-` 开头的所有键，
 * 以及 council-store 中的议会记录、命运报告、时间线。
 */

import type {
  DestinyReport,
  TimelineBranch,
  Message,
  ConflictPair,
  Persona,
} from '@/types';

// ===== 类型定义 =====

/** 议会历史条目（用于导出） */
export interface CouncilHistoryEntry {
  id: string;
  sessionNumber: number;
  councilType: string;
  question: string;
  questionType: string;
  phase: string;
  createdAt: number;
  personas: Persona[];
  messages: Message[];
  conflicts: ConflictPair[];
  report: DestinyReport | null;
  timeline: TimelineBranch[] | null;
}

/** 完整导出数据包 */
export interface ExportData {
  /** 导出元信息 */
  meta: {
    version: string;
    exportedAt: string;
    app: string;
  };
  /** 议会历史记录 */
  councils: CouncilHistoryEntry[];
  /** 命运报告列表 */
  reports: DestinyReport[];
  /** 时间线列表 */
  timelines: TimelineBranch[][];
  /** 原始 localStorage 数据（兜底） */
  raw?: Record<string, unknown>;
}

// ===== 数据收集 =====

/**
 * 从 localStorage 收集 LifeVerse 数据，组装成 ExportData 结构。
 *
 * 兼容多种存储格式：
 * - lifeverse-council：council-store persist 数据
 * - lifeverse-history：历史记录数组
 * - lifeverse-report-{id}：单条命运报告
 * - lifeverse-timeline-{id}：单条时间线
 */
export function collectExportData(): ExportData {
  const councils: CouncilHistoryEntry[] = [];
  const reports: DestinyReport[] = [];
  const timelines: TimelineBranch[][] = [];
  const raw: Record<string, unknown> = {};

  if (typeof window === 'undefined') {
    return {
      meta: {
        version: '5.0.0',
        exportedAt: new Date().toISOString(),
        app: 'LifeVerse',
      },
      councils,
      reports,
      timelines,
    };
  }

  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('lifeverse-'))
      .forEach((key) => {
        try {
          const rawValue = localStorage.getItem(key);
          if (!rawValue) return;
          const parsed = JSON.parse(rawValue) as unknown;
          raw[key] = parsed;

          // council-store persist 数据
          if (key === 'lifeverse-council') {
            const state = (parsed as { state?: Record<string, unknown> })
              ?.state;
            if (state) {
              councils.push({
                id: `council-${state.sessionNumber ?? 0}`,
                sessionNumber: Number(state.sessionNumber ?? 0),
                councilType: String(state.councilType ?? 'wisdom'),
                question: String(state.question ?? ''),
                questionType: String(state.questionType ?? 'other'),
                phase: String(state.phase ?? 'idle'),
                createdAt: Date.now(),
                personas: (state.personas as Persona[]) ?? [],
                messages: (state.messages as Message[]) ?? [],
                conflicts: (state.conflicts as ConflictPair[]) ?? [],
                report: (state.report as DestinyReport | null) ?? null,
                timeline: (state.timeline as TimelineBranch[] | null) ?? null,
              });

              if (state.report) {
                reports.push(state.report as DestinyReport);
              }
              if (state.timeline) {
                timelines.push(state.timeline as TimelineBranch[]);
              }
            }
            return;
          }

          // 历史记录数组
          if (key === 'lifeverse-history') {
            const arr = parsed as Array<Record<string, unknown>>;
            if (Array.isArray(arr)) {
              arr.forEach((entry) => {
                councils.push({
                  id: String(entry.id ?? entry.councilId ?? ''),
                  sessionNumber: Number(entry.sessionNumber ?? 0),
                  councilType: String(entry.councilType ?? 'wisdom'),
                  question: String(entry.question ?? ''),
                  questionType: String(entry.questionType ?? 'other'),
                  phase: String(entry.phase ?? 'done'),
                  createdAt: Number(entry.createdAt ?? Date.now()),
                  personas: [],
                  messages: [],
                  conflicts: [],
                  report: null,
                  timeline: null,
                });
              });
            }
            return;
          }

          // 单条命运报告
          if (key.startsWith('lifeverse-report-')) {
            reports.push(parsed as DestinyReport);
            return;
          }

          // 单条时间线
          if (key.startsWith('lifeverse-timeline-')) {
            timelines.push(parsed as TimelineBranch[]);
            return;
          }
        } catch {
          // 忽略单条解析错误
        }
      });
  } catch {
    // 忽略 localStorage 读取错误
  }

  return {
    meta: {
      version: '5.0.0',
      exportedAt: new Date().toISOString(),
      app: 'LifeVerse',
    },
    councils,
    reports,
    timelines,
    raw,
  };
}

// ===== JSON 导出 =====

/**
 * 导出为 JSON 文件
 *
 * @param data 要导出的数据（若不传则自动从 localStorage 收集）
 * @param filename 文件名（不含扩展名）
 */
export function exportAsJSON(
  data?: ExportData | Record<string, unknown>,
  filename = `lifeverse-export-${Date.now()}`
): void {
  const payload = data ?? collectExportData();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, `${filename}.json`);
}

// ===== CSV 导出 =====

/**
 * 将值转义为 CSV 安全格式（含逗号、引号、换行时加双引号包裹）
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 导出为 CSV 文件
 *
 * 将议会历史记录表格化，每行一条议会记录。
 *
 * @param data 要导出的数据（若不传则自动从 localStorage 收集）
 * @param filename 文件名（不含扩展名）
 */
export function exportAsCSV(
  data?: ExportData,
  filename = `lifeverse-export-${Date.now()}`
): void {
  const payload = data ?? collectExportData();
  const councils = payload.councils;

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

  const rows = councils.map((c) => [
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

  // BOM 头确保 Excel 正确识别 UTF-8
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  });
  triggerDownload(blob, `${filename}.csv`);
}

// ===== PDF 导出 =====

/**
 * 构建 PDF 用的 HTML 字符串
 *
 * 使用系统字体 + 思源宋体 fallback，确保中文正常显示。
 * 样式内联，避免依赖外部 CSS。
 */
function buildPdfHtml(data: ExportData): string {
  const { meta, councils, reports, timelines } = data;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('zh-CN');
    } catch {
      return iso;
    }
  };

  const councilsHtml = councils.length
    ? councils
        .map((c, idx) => {
          const speakersHtml = c.personas.length
            ? c.personas.map((p) => `<li>${p.name}（${p.nameEn}）— ${p.philosophy}</li>`).join('')
            : '<li>（无参与者记录）</li>';
          const messagesHtml = c.messages.length
            ? c.messages
                .map(
                  (m) => `
                <div class="msg">
                  <div class="msg-head">第${m.round}轮 · ${m.personaName}</div>
                  <div class="msg-body">${escapeHtml(m.content)}</div>
                </div>`
                )
                .join('')
            : '<p class="empty">（无发言记录）</p>';
          const conflictsHtml = c.conflicts.length
            ? c.conflicts
                .map(
                  (cf) =>
                    `<li>${cf.personaA} ↔ ${cf.personaB}：${cf.label}（${cf.value}）</li>`
                )
                .join('')
            : '<li>无显著冲突</li>';
          const reportHtml = c.report
            ? `
              <div class="report">
                <h3>命运报告</h3>
                <p class="summary">${escapeHtml(c.report.summary)}</p>
                ${
                  c.report.consensusPoints.length
                    ? `<div class="consensus"><strong>共识要点：</strong><ul>${c.report.consensusPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul></div>`
                    : ''
                }
                <p class="disclaimer">${escapeHtml(c.report.disclaimer)}</p>
              </div>`
            : '';
          const timelineHtml = c.timeline && c.timeline.length
            ? `
              <div class="timeline">
                <h3>时间线</h3>
                <ul>${c.timeline.map((t) => `<li><strong>${t.label}</strong>：${escapeHtml(t.description)}（幸福概率 ${Math.round(t.happinessProb * 100)}%，遗憾概率 ${Math.round(t.regretProb * 100)}%）</li>`).join('')}</ul>
              </div>`
            : '';

          return `
            <div class="council">
              <h2>议会 #${idx + 1}：${escapeHtml(c.question || '（未记录问题）')}</h2>
              <div class="meta">
                <span>类型：${c.councilType}</span>
                <span>场次：第 ${c.sessionNumber} 次</span>
                <span>时间：${formatDate(new Date(c.createdAt).toISOString())}</span>
              </div>
              <div class="section">
                <h3>参与者</h3>
                <ul>${speakersHtml}</ul>
              </div>
              <div class="section">
                <h3>各轮发言</h3>
                ${messagesHtml}
              </div>
              <div class="section">
                <h3>冲突分析</h3>
                <ul>${conflictsHtml}</ul>
              </div>
              ${reportHtml}
              ${timelineHtml}
            </div>`;
        })
        .join('')
    : '<p class="empty">暂无议会记录</p>';

  const reportsHtml = reports.length
    ? reports
        .map(
          (r) => `
        <div class="report">
          <h3>${escapeHtml(r.question)}</h3>
          <p class="summary">${escapeHtml(r.summary)}</p>
          <p class="disclaimer">${escapeHtml(r.disclaimer)}</p>
        </div>`
        )
        .join('')
    : '<p class="empty">暂无独立命运报告</p>';

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Source Han Sans SC', 'Noto Sans CJK SC', sans-serif;
    background: #ffffff;
    color: #2a2825;
    padding: 32px;
    width: 794px; /* A4 宽度 @ 96dpi */
  }
  .cover {
    text-align: center;
    padding: 48px 0 32px;
    border-bottom: 2px solid #c9a84c;
    margin-bottom: 24px;
  }
  .cover h1 {
    font-size: 32px;
    color: #a8893c;
    margin: 0 0 8px;
    font-weight: 700;
  }
  .cover .subtitle {
    font-size: 14px;
    color: #6a665e;
    margin: 0;
  }
  .cover .meta-line {
    font-size: 12px;
    color: #9a958c;
    margin-top: 8px;
  }
  h2 {
    font-size: 20px;
    color: #2a2825;
    border-left: 4px solid #c9a84c;
    padding-left: 10px;
    margin: 24px 0 12px;
  }
  h3 {
    font-size: 15px;
    color: #6a665e;
    margin: 16px 0 8px;
  }
  .council {
    border: 1px solid #e0ddd5;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .council h2 {
    border-left: none;
    padding-left: 0;
    margin-top: 0;
  }
  .meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #9a958c;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .section { margin: 12px 0; }
  ul { padding-left: 20px; margin: 6px 0; }
  li { font-size: 13px; line-height: 1.7; color: #2a2825; }
  .msg {
    border-left: 2px solid #c9a84c;
    padding: 6px 12px;
    margin: 8px 0;
    background: #f8f7f4;
  }
  .msg-head {
    font-size: 12px;
    color: #a8893c;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .msg-body {
    font-size: 13px;
    line-height: 1.7;
    color: #2a2825;
  }
  .report {
    background: #f0eee8;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0;
  }
  .report .summary {
    font-size: 13px;
    line-height: 1.8;
    color: #2a2825;
    margin: 8px 0;
  }
  .consensus {
    font-size: 13px;
    margin: 8px 0;
  }
  .disclaimer {
    font-size: 11px;
    color: #9a958c;
    margin-top: 8px;
    font-style: italic;
  }
  .timeline {
    margin: 12px 0;
  }
  .empty {
    color: #9a958c;
    font-size: 13px;
    font-style: italic;
  }
  .footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e0ddd5;
    text-align: center;
    font-size: 11px;
    color: #9a958c;
  }
</style>
</head>
<body>
  <div class="cover">
    <h1>LifeVerse 命运报告</h1>
    <p class="subtitle">Every life deserves its own universe</p>
    <p class="meta-line">导出时间：${formatDate(meta.exportedAt)} · 版本 ${meta.version}</p>
  </div>

  <h2>议会历史记录</h2>
  ${councilsHtml}

  <h2>命运报告汇总</h2>
  ${reportsHtml}

  <div class="footer">
    本报告由 LifeVerse 自动生成 · 共 ${councils.length} 条议会记录 · ${reports.length} 份命运报告
  </div>
</body>
</html>`;
}

/** HTML 转义，防止内容破坏 HTML 结构 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 导出为 PDF 文件
 *
 * 实现方案：构建 HTML → html2canvas 截图 → jsPDF 拼接 A4 分页。
 * 这样可以完美支持中文，且保留样式。
 *
 * @param data 要导出的数据（若不传则自动从 localStorage 收集）
 * @param filename 文件名（不含扩展名）
 */
export async function exportAsPDF(
  data?: ExportData,
  filename = `lifeverse-export-${Date.now()}`
): Promise<void> {
  // 动态导入，避免在 SSR 阶段加载
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const payload = data ?? collectExportData();
  const html = buildPdfHtml(payload);

  // 创建离屏容器渲染 HTML
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const target = container.querySelector('body') as HTMLElement | null;
    const renderEl = (target ?? container) as HTMLElement;

    const canvas = await html2canvas(renderEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // A4 尺寸（mm）
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 图片尺寸按 A4 宽度等比缩放
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 将整张图片切成 A4 页
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      // 多页处理：通过 canvas 切片逐页添加
      const pageCanvasHeight = (canvas.width * pageHeight) / pageWidth;
      let srcY = 0;
      while (srcY < canvas.height) {
        const sliceHeight = Math.min(
          pageCanvasHeight,
          canvas.height - srcY
        );
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) break;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
        const pageImgHeight = (sliceHeight * imgWidth) / canvas.width;
        if (srcY > 0) pdf.addPage();
        pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidth, pageImgHeight);
        srcY += sliceHeight;
      }
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// ===== 通用工具 =====

/**
 * 触发浏览器下载
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延迟释放，避免下载未开始就被 revoke
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
