import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/**
 * Jest 配置
 *
 * 使用 next/jest 提供 Next.js 环境支持（SWC 转译、CSS 模块 mock 等）。
 * 测试环境为 jsdom，支持 DOM API。
 * 路径别名 @/ 映射到 src/，与 tsconfig 保持一致。
 */
const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
};

export default createJestConfig(config);
