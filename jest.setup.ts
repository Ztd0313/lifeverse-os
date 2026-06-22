import '@testing-library/jest-dom';

/**
 * Mock next/navigation
 *
 * 议会页面等客户端组件使用了 useRouter / usePathname，
 * 在 jsdom 环境下需要提供 mock 实现。
 */
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
  redirect: jest.fn(),
}));

/**
 * Mock next/link
 *
 * 将 next/link 渲染为普通 <a> 标签，便于测试查询和点击。
 * 注意：jest.setup.ts 不支持 JSX 语法，使用 React.createElement。
 */
jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, href, ...props }: Record<string, unknown>) => {
      return React.createElement('a', { href, ...props }, children);
    },
  };
});

/**
 * Mock framer-motion
 *
 * framer-motion 依赖浏览器 API（requestAnimationFrame 等），
 * 在 jsdom 下动画无法正常执行。这里将其简化为直接渲染子组件。
 */
jest.mock('framer-motion', () => {
  const React = require('react');

  /**
   * 通用 motion 代理：直接渲染对应 DOM 标签，忽略动画 props。
   */
  const createMotionProxy = (tag: string) => {
    const Component = (React as typeof import('react')).forwardRef(
      (
        { children, ...props }: { children?: unknown } & Record<string, unknown>,
        ref: unknown
      ) => {
      // 过滤掉 framer-motion 专有 props，避免传递到 DOM
      const {
        initial,
        animate,
        exit,
        variants,
        transition,
        whileHover,
        whileInView,
        whileTap,
        viewport,
        layout,
        drag,
        dragConstraints,
        onAnimationStart,
        onAnimationComplete,
        onDragStart,
        onDragEnd,
        ...domProps
      } = props as Record<string, unknown>;
      void initial;
      void animate;
      void exit;
      void variants;
      void transition;
      void whileHover;
      void whileInView;
      void whileTap;
      void viewport;
      void layout;
      void drag;
      void dragConstraints;
      void onAnimationStart;
      void onAnimationComplete;
      void onDragStart;
      void onDragEnd;
      return React.createElement(tag, { ...domProps, ref }, children);
    });
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  const motion = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === 'AnimatePresence') {
          return ({ children }: { children: React.ReactNode }) =>
            React.createElement(React.Fragment, null, children);
        }
        if (prop === 'motion') {
          return new Proxy(
            {},
            {
              get: (_t, p: string) => createMotionProxy(p),
            }
          );
        }
        return createMotionProxy(prop);
      },
    }
  );

  return {
    __esModule: true,
    default: motion,
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

/**
 * Mock matchMedia（jsdom 不提供）
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/**
 * Mock ResizeObserver（jsdom 不提供）
 */
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});
