import { render, screen } from '@testing-library/react';
import { RadarChart } from '@/components/charts/RadarChart';
import type { RadarData } from '@/types';

/**
 * 测试用雷达数据
 */
const SINGLE_DATA: RadarData = {
  freedom: 80,
  wealth: 60,
  happiness: 90,
  stability: 70,
  growth: 85,
};

const MULTI_DATA: RadarData[] = [
  { freedom: 80, wealth: 60, happiness: 90, stability: 70, growth: 85 },
  { freedom: 50, wealth: 90, happiness: 65, stability: 85, growth: 60 },
];

const DEFAULT_LABELS = ['自由', '财富', '幸福', '稳定', '成长'];

/**
 * 基础渲染测试
 */
describe('RadarChart — 基础渲染', () => {
  test('单组数据应正确渲染 SVG 元素', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('role', 'img');
  });

  test('应渲染指定尺寸的 SVG', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} size={300} animated={false} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '300');
    expect(svg).toHaveAttribute('height', '300');
  });

  test('SVG 应包含 title 和 desc 用于无障碍', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} />
    );
    const title = container.querySelector('svg title');
    const desc = container.querySelector('svg desc');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toBe('价值雷达图');
    expect(desc).toBeInTheDocument();
  });
});

/**
 * 单组数据集测试
 */
describe('RadarChart — 单组数据集', () => {
  test('应渲染 1 个数据多边形（polygon）', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} showGrid={false} showLabels={false} />
    );
    // 数据多边形在 .radar-data g 内
    const dataGroup = container.querySelector('.radar-data');
    const polygons = dataGroup?.querySelectorAll('polygon');
    expect(polygons?.length).toBe(1);
  });

  test('应渲染 5 个数据点（circle）', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} showGrid={false} showLabels={false} />
    );
    const dataGroup = container.querySelector('.radar-data');
    const circles = dataGroup?.querySelectorAll('circle');
    expect(circles?.length).toBe(5);
  });
});

/**
 * 多组数据集测试
 */
describe('RadarChart — 多组数据集', () => {
  test('应渲染 2 个数据多边形', () => {
    const { container } = render(
      <RadarChart data={MULTI_DATA} animated={false} showGrid={false} showLabels={false} />
    );
    const dataGroup = container.querySelector('.radar-data');
    const polygons = dataGroup?.querySelectorAll('polygon');
    expect(polygons?.length).toBe(2);
  });

  test('应渲染 10 个数据点（2 组 × 5 维度）', () => {
    const { container } = render(
      <RadarChart data={MULTI_DATA} animated={false} showGrid={false} showLabels={false} />
    );
    const dataGroup = container.querySelector('.radar-data');
    const circles = dataGroup?.querySelectorAll('circle');
    expect(circles?.length).toBe(10);
  });
});

/**
 * 标签显示测试
 */
describe('RadarChart — 标签显示', () => {
  test('showLabels=true（默认）应渲染 5 个维度标签', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} showGrid={false} />
    );
    const labelGroup = container.querySelector('.radar-labels');
    const labels = labelGroup?.querySelectorAll('text');
    expect(labels?.length).toBe(5);
    // 验证默认标签文本
    const labelTexts = Array.from(labels || []).map((el) => el.textContent);
    DEFAULT_LABELS.forEach((label) => {
      expect(labelTexts).toContain(label);
    });
  });

  test('showLabels=false 时不应渲染标签组', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} showLabels={false} />
    );
    const labelGroup = container.querySelector('.radar-labels');
    expect(labelGroup).toBeNull();
  });

  test('自定义 labels 应正确显示', () => {
    const customLabels = ['A', 'B', 'C', 'D', 'E'];
    const { container } = render(
      <RadarChart
        data={SINGLE_DATA}
        labels={customLabels}
        animated={false}
        showGrid={false}
      />
    );
    const labelGroup = container.querySelector('.radar-labels');
    const labelTexts = Array.from(labelGroup?.querySelectorAll('text') || []).map(
      (el) => el.textContent
    );
    customLabels.forEach((label) => {
      expect(labelTexts).toContain(label);
    });
  });
});

/**
 * 网格显示测试
 */
describe('RadarChart — 网格显示', () => {
  test('showGrid=true（默认）应渲染 5 层网格多边形', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} showLabels={false} />
    );
    const gridGroup = container.querySelector('.radar-grid');
    const polygons = gridGroup?.querySelectorAll('polygon');
    expect(polygons?.length).toBe(5);
  });

  test('showGrid=false 时不应渲染网格组', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} showGrid={false} showLabels={false} />
    );
    const gridGroup = container.querySelector('.radar-grid');
    expect(gridGroup).toBeNull();
  });

  test('网格应包含刻度数值（20, 40, 60, 80, 100）', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} showLabels={false} />
    );
    const gridGroup = container.querySelector('.radar-grid');
    const scaleTexts = Array.from(gridGroup?.querySelectorAll('text') || []).map(
      (el) => el.textContent
    );
    expect(scaleTexts).toContain('20');
    expect(scaleTexts).toContain('100');
  });
});

/**
 * 数值标签测试
 */
describe('RadarChart — 数值标签', () => {
  test('showValues=true 应渲染数值标签', () => {
    const { container } = render(
      <RadarChart
        data={SINGLE_DATA}
        animated={false}
        showValues={true}
        showGrid={false}
        showLabels={false}
      />
    );
    const dataGroup = container.querySelector('.radar-data');
    const valueTexts = dataGroup?.querySelectorAll('text');
    expect(valueTexts?.length).toBe(5);
  });
});

/**
 * 自定义类名测试
 */
describe('RadarChart — 自定义类名', () => {
  test('应将自定义 className 应用到外层 div', () => {
    const { container } = render(
      <RadarChart data={SINGLE_DATA} animated={false} className="custom-class" />
    );
    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });
});
