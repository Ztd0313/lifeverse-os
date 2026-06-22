import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomeContent } from '@/components/home/HomeContent';

/**
 * LifeVerse 首页
 *
 * 结构：
 * - ParticleBackground：全屏金色粒子背景（客户端组件）
 * - Header：全局头部导航（客户端组件）
 * - HomeContent：Hero + 七大模块 + 引用块（客户端组件，含 Framer Motion 动画）
 * - Footer：全局底部（服务端组件）
 *
 * 整体深色主题，金色点缀。
 */
export default function HomePage() {
  return (
    <>
      {/* 全屏粒子背景 */}
      <ParticleBackground />

      {/* 全局头部导航 */}
      <Header />

      {/* 首页内容（Hero + 模块卡片 + 引用块） */}
      <HomeContent />

      {/* 全局底部 */}
      <Footer />
    </>
  );
}
