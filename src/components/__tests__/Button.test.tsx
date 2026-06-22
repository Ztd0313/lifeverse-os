import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

/**
 * Button 组件测试
 *
 * 测试维度：
 * - 基础渲染
 * - 点击事件
 * - 变体样式
 * - 尺寸
 * - 禁用状态
 * - asChild 模式
 */

describe('Button — 基础渲染', () => {
  test('应正确渲染按钮元素', () => {
    render(<Button>点击我</Button>);
    const button = screen.getByRole('button', { name: '点击我' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  test('应渲染传入的子内容（文本）', () => {
    render(<Button>提交</Button>);
    expect(screen.getByText('提交')).toBeInTheDocument();
  });

  test('应渲染传入的子内容（JSX）', () => {
    render(
      <Button>
        <span data-testid="icon">★</span>
        收藏
      </Button>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('收藏')).toBeInTheDocument();
  });

  test('应支持自定义 className', () => {
    render(<Button className="my-custom-class">按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('my-custom-class');
  });

  test('应支持原生 button 属性（如 type）', () => {
    render(<Button type="submit">提交</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('应支持 aria-label', () => {
    render(<Button aria-label="关闭对话框">X</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '关闭对话框');
  });
});

describe('Button — 点击事件', () => {
  test('点击时应触发 onClick 回调', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>点击</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('多次点击应多次触发 onClick', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>点击</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  test('onClick 应接收鼠标事件', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>点击</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({
      type: 'click',
    }));
  });
});

describe('Button — 变体样式', () => {
  test('默认变体应为 primary', () => {
    render(<Button>默认</Button>);
    const button = screen.getByRole('button');
    // primary 变体包含 bg-gold 类
    expect(button).toHaveClass('bg-gold');
  });

  test('variant="primary" 应包含金色背景类', () => {
    render(<Button variant="primary">主要</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gold');
    expect(button).toHaveClass('text-bg');
  });

  test('variant="secondary" 应包含边框类', () => {
    render(<Button variant="secondary">次级</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-bg-card');
    expect(button).toHaveClass('border');
  });

  test('variant="ghost" 应包含透明背景类', () => {
    render(<Button variant="ghost">幽灵</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent');
  });

  test('variant="gold" 应包含金色边框类', () => {
    render(<Button variant="gold">金色</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-gold');
    expect(button).toHaveClass('text-gold');
  });

  test('不同变体应产生不同的类名', () => {
    const { rerender } = render(<Button variant="primary">A</Button>);
    const primaryClass = screen.getByRole('button').className;

    rerender(<Button variant="secondary">A</Button>);
    const secondaryClass = screen.getByRole('button').className;

    expect(primaryClass).not.toBe(secondaryClass);
  });
});

describe('Button — 尺寸', () => {
  test('默认尺寸应为 md', () => {
    render(<Button>默认</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('px-5');
  });

  test('size="sm" 应有小尺寸类', () => {
    render(<Button size="sm">小</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8');
    expect(button).toHaveClass('px-3');
    expect(button).toHaveClass('text-xs');
  });

  test('size="lg" 应有大尺寸类', () => {
    render(<Button size="lg">大</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-12');
    expect(button).toHaveClass('px-7');
    expect(button).toHaveClass('text-base');
  });
});

describe('Button — 禁用状态', () => {
  test('disabled=true 时按钮应被禁用', () => {
    render(<Button disabled>禁用</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('禁用按钮不应触发 onClick', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        禁用
      </Button>
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('禁用按钮应包含 disabled 样式类', () => {
    render(<Button disabled>禁用</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toHaveClass('disabled:pointer-events-none');
  });

  test('启用按钮应可点击', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>启用</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('Button — asChild 模式', () => {
  test('asChild=true 时不应渲染 button 标签', () => {
    render(
      <Button asChild>
        <a href="/test" data-testid="link">
          链接
        </a>
      </Button>
    );
    const link = screen.getByTestId('link');
    expect(link.tagName).toBe('A');
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('asChild=true 时应将按钮样式应用到子元素', () => {
    render(
      <Button asChild variant="gold">
        <a href="/test" data-testid="link">
          链接
        </a>
      </Button>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveClass('border-gold');
    expect(link).toHaveClass('text-gold');
  });

  test('asChild=true 时子元素的 href 应保留', () => {
    render(
      <Button asChild>
        <a href="/council" data-testid="link">
          议会
        </a>
      </Button>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/council');
  });
});
