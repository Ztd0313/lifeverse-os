import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

/**
 * Badge 组件测试
 *
 * 测试维度：
 * - 基础渲染
 * - 变体样式
 * - 自定义类名
 * - 子内容
 * - 无障碍属性
 */

describe('Badge — 基础渲染', () => {
  test('应正确渲染 span 元素', () => {
    render(<Badge>智者</Badge>);
    const badge = screen.getByText('智者');
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('SPAN');
  });

  test('应渲染传入的文本内容', () => {
    render(<Badge>智慧议会</Badge>);
    expect(screen.getByText('智慧议会')).toBeInTheDocument();
  });

  test('应渲染传入的 JSX 子内容', () => {
    render(
      <Badge>
        <span data-testid="dot">●</span>
        在线
      </Badge>
    );
    expect(screen.getByTestId('dot')).toBeInTheDocument();
    expect(screen.getByText('在线')).toBeInTheDocument();
  });

  test('应包含基础圆角与内边距类', () => {
    render(<Badge>标签</Badge>);
    const badge = screen.getByText('标签');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
  });
});

describe('Badge — 变体样式', () => {
  test('默认变体应为 gold', () => {
    render(<Badge>默认</Badge>);
    const badge = screen.getByText('默认');
    // gold 变体包含 bg-gold-soft 和 text-gold
    expect(badge).toHaveClass('bg-gold-soft');
    expect(badge).toHaveClass('text-gold');
  });

  test('variant="gold" 应包含金色样式类', () => {
    render(<Badge variant="gold">金色</Badge>);
    const badge = screen.getByText('金色');
    expect(badge).toHaveClass('bg-gold-soft');
    expect(badge).toHaveClass('text-gold');
    expect(badge).toHaveClass('border-gold-dim');
  });

  test('variant="red" 应包含红色样式类', () => {
    render(<Badge variant="red">红色</Badge>);
    const badge = screen.getByText('红色');
    expect(badge).toHaveClass('text-red');
  });

  test('variant="blue" 应包含蓝色样式类', () => {
    render(<Badge variant="blue">蓝色</Badge>);
    const badge = screen.getByText('蓝色');
    expect(badge).toHaveClass('text-blue');
  });

  test('variant="green" 应包含绿色样式类', () => {
    render(<Badge variant="green">绿色</Badge>);
    const badge = screen.getByText('绿色');
    expect(badge).toHaveClass('text-green');
  });

  test('variant="orange" 应包含橙色样式类', () => {
    render(<Badge variant="orange">橙色</Badge>);
    const badge = screen.getByText('橙色');
    expect(badge).toHaveClass('text-orange');
  });

  test('不同变体应产生不同的类名', () => {
    const { rerender } = render(<Badge variant="gold">A</Badge>);
    const goldClass = screen.getByText('A').className;

    rerender(<Badge variant="red">A</Badge>);
    const redClass = screen.getByText('A').className;

    expect(goldClass).not.toBe(redClass);
  });

  test('所有变体都应包含基础样式类', () => {
    const variants = ['gold', 'red', 'blue', 'green', 'orange'] as const;
    variants.forEach((variant) => {
      const { unmount } = render(
        <Badge variant={variant}>{variant}</Badge>
      );
      const badge = screen.getByText(variant);
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('text-xs');
      unmount();
    });
  });
});

describe('Badge — 自定义类名', () => {
  test('应支持自定义 className 并与变体类合并', () => {
    render(<Badge className="my-custom-badge">自定义</Badge>);
    const badge = screen.getByText('自定义');
    expect(badge).toHaveClass('my-custom-badge');
    // 同时保留默认 gold 变体类
    expect(badge).toHaveClass('bg-gold-soft');
  });

  test('自定义 className 不应覆盖基础布局类', () => {
    render(<Badge className="custom">标签</Badge>);
    const badge = screen.getByText('标签');
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('custom');
  });
});

describe('Badge — 原生属性', () => {
  test('应支持 onClick 事件', () => {
    const handleClick = jest.fn();
    render(<Badge onClick={handleClick}>可点击</Badge>);
    const badge = screen.getByText('可点击');
    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('应支持 data 属性', () => {
    render(<Badge data-testid="status-badge">状态</Badge>);
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
  });

  test('应支持 title 属性', () => {
    render(<Badge title="议会类型">智慧</Badge>);
    const badge = screen.getByText('智慧');
    expect(badge).toHaveAttribute('title', '议会类型');
  });
});
