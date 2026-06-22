import type { Metadata } from 'next';
import './globals.css';
import { ThemeInitializer, themeInlineScript } from '@/components/layout/ThemeInitializer';

export const metadata: Metadata = {
  title: 'LifeVerse — Every life deserves its own universe',
  description:
    '帮助人们理解自己、理解过去、理解未来，并在重大选择时与智慧、记忆和未来版本的自己共同对话。',
  keywords: ['LifeVerse', 'AI', '生命宇宙', '智慧议会', '命运报告'],
  openGraph: {
    title: 'LifeVerse',
    description: 'Every life deserves its own universe.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* 在 hydration 之前设置 data-theme，避免主题闪烁 */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInlineScript }}
        />
      </head>
      <body>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
