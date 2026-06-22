'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Moon,
  Sun,
  Users,
  Gauge,
  Trash2,
  Upload,
  Info,
  Github,
  Heart,
  Check,
  FileText,
  FileSpreadsheet,
  FileType,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme-store';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  collectExportData,
  exportAsJSON,
  exportAsCSV,
  exportAsPDF,
} from '@/lib/export';
import { useTranslation } from '@/lib/i18n';

// ===== Types =====

interface CouncilPreferences {
  defaultAgentCount: number;
  speechSpeed: 'slow' | 'normal' | 'fast';
}

// ===== Settings Sections =====

interface SectionProps {
  title: string;
  icon: typeof Moon;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-bg-card p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft">
          <Icon className="h-4 w-4 text-gold" />
        </div>
        <h2 className="text-sm font-semibold text-text">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm text-text">{label}</p>
        {description && (
          <p className="text-xs text-text-dim">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ===== Main Page =====

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // Theme（来自 theme-store，持久化到 localStorage）
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  // Council preferences
  const [prefs, setPrefs] = useState<CouncilPreferences>({
    defaultAgentCount: 7,
    speechSpeed: 'normal',
  });

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  // Confirm dialog（清除历史记录 - danger 变体）
  const [confirmClear, setConfirmClear] = useState(false);

  // Confirm dialog（导入数据 - warning 变体）
  const [confirmImport, setConfirmImport] = useState(false);

  // Export loading state（PDF 生成可能较慢）
  const [exportingFormat, setExportingFormat] = useState<
    'json' | 'pdf' | 'csv' | null
  >(null);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lifeverse-settings');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CouncilPreferences>;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save preferences
  const savePrefs = (updated: CouncilPreferences) => {
    setPrefs(updated);
    try {
      localStorage.setItem('lifeverse-settings', JSON.stringify(updated));
    } catch {
      // Storage might be unavailable
    }
  };

  // Show toast
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  // Handle clear history（由 ConfirmDialog danger 变体触发）
  const handleClearHistory = () => {
    try {
      localStorage.removeItem('lifeverse-history');
      // Also clear individual reports
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith('lifeverse-report-')
      );
      keys.forEach((k) => localStorage.removeItem(k));
      showToast(t('settings.data.historyCleared'));
    } catch {
      showToast(t('settings.data.clearFailed'));
    }
    setConfirmClear(false);
  };

  // Handle export data (JSON)
  const handleExportJSON = () => {
    setExportingFormat('json');
    try {
      const data = collectExportData();
      exportAsJSON(data);
      showToast(t('settings.data.jsonExported'));
    } catch {
      showToast(t('settings.data.exportFailed'));
    } finally {
      setExportingFormat(null);
    }
  };

  // Handle export data (CSV)
  const handleExportCSV = () => {
    setExportingFormat('csv');
    try {
      const data = collectExportData();
      exportAsCSV(data);
      showToast(t('settings.data.csvExported'));
    } catch {
      showToast(t('settings.data.exportFailed'));
    } finally {
      setExportingFormat(null);
    }
  };

  // Handle export data (PDF)
  const handleExportPDF = async () => {
    setExportingFormat('pdf');
    try {
      const data = collectExportData();
      await exportAsPDF(data);
      showToast(t('settings.data.pdfExported'));
    } catch (error) {
      console.error('[Export PDF] failed:', error);
      showToast(t('settings.data.pdfExportFailed'));
    } finally {
      setExportingFormat(null);
    }
  };

  // Handle import data（由 ConfirmDialog warning 变体触发确认后执行）
  const handleImport = () => {
    setConfirmImport(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as Record<
            string,
            unknown
          >;
          Object.entries(data).forEach(([key, value]) => {
            if (key.startsWith('lifeverse-')) {
              localStorage.setItem(
                key,
                typeof value === 'string' ? value : JSON.stringify(value)
              );
            }
          });
          showToast(t('settings.data.imported'));
        } catch {
          showToast(t('settings.data.importFailed'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-[var(--header-bg-scrolled)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-sm text-text-soft transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('settings.backHome')}
          </button>
          <span className="text-sm font-medium text-text">{t('settings.title')}</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        {/* Theme Settings */}
        <Section title={t('settings.theme.title')} icon={theme === 'dark' ? Moon : Sun}>
          <SettingRow
            label={t('settings.theme.appearance')}
            description={t('settings.theme.appearanceDesc')}
          >
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all',
                  theme === 'dark'
                    ? 'border-gold bg-gold-soft/30 text-gold'
                    : 'border-border bg-bg-card text-text-dim hover:border-gold-dim'
                )}
              >
                <Moon className="h-3.5 w-3.5" />
                {t('settings.theme.dark')}
                {theme === 'dark' && <Check className="h-3 w-3" />}
              </button>
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all',
                  theme === 'light'
                    ? 'border-gold bg-gold-soft/30 text-gold'
                    : 'border-border bg-bg-card text-text-dim hover:border-gold-dim'
                )}
              >
                <Sun className="h-3.5 w-3.5" />
                {t('settings.theme.light')}
                {theme === 'light' && <Check className="h-3 w-3" />}
              </button>
            </div>
          </SettingRow>
        </Section>

        {/* Council Preferences */}
        <Section title={t('settings.council.title')} icon={Users}>
          <SettingRow
            label={t('settings.council.defaultAgentCount')}
            description={t('settings.council.defaultAgentCountDesc')}
          >
            <div className="flex items-center gap-2">
              {[3, 5, 7].map((count) => (
                <button
                  key={count}
                  onClick={() =>
                    savePrefs({ ...prefs, defaultAgentCount: count })
                  }
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-all',
                    prefs.defaultAgentCount === count
                      ? 'border-gold bg-gold-soft/30 text-gold'
                      : 'border-border bg-bg-card text-text-soft hover:border-gold-dim'
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </SettingRow>

          <div className="border-t border-border" />

          <SettingRow
            label={t('settings.council.speechSpeed')}
            description={t('settings.council.speechSpeedDesc')}
          >
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-text-dim" />
              {(['slow', 'normal', 'fast'] as const).map((speed) => (
                <button
                  key={speed}
                  onClick={() => savePrefs({ ...prefs, speechSpeed: speed })}
                  className={cn(
                    'rounded-lg border px-3 py-1 text-xs transition-all',
                    prefs.speechSpeed === speed
                      ? 'border-gold bg-gold-soft/30 text-gold'
                      : 'border-border bg-bg-card text-text-soft hover:border-gold-dim'
                  )}
                >
                  {speed === 'slow' ? t('settings.council.slow') : speed === 'normal' ? t('settings.council.normal') : t('settings.council.fast')}
                </button>
              ))}
            </div>
          </SettingRow>
        </Section>

        {/* Data Management */}
        <Section title={t('settings.data.title')} icon={Trash2}>
          <SettingRow
            label={t('settings.data.export')}
            description={t('settings.data.exportDesc')}
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportJSON}
                disabled={exportingFormat !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold disabled:opacity-50"
              >
                {exportingFormat === 'json' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                JSON
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingFormat !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold disabled:opacity-50"
              >
                {exportingFormat === 'pdf' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileType className="h-3.5 w-3.5" />
                )}
                PDF
              </button>
              <button
                onClick={handleExportCSV}
                disabled={exportingFormat !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold disabled:opacity-50"
              >
                {exportingFormat === 'csv' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                CSV
              </button>
            </div>
          </SettingRow>

          <div className="border-t border-border" />

          <SettingRow
            label={t('settings.data.import')}
            description={t('settings.data.importDesc')}
          >
            <button
              onClick={() => setConfirmImport(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-gold-dim hover:text-gold"
            >
              <Upload className="h-3.5 w-3.5" />
              {t('settings.data.importButton')}
            </button>
          </SettingRow>

          <div className="border-t border-border" />

          <SettingRow
            label={t('settings.data.clearHistory')}
            description={t('settings.data.clearHistoryDesc')}
          >
            <button
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red/30 bg-red/10 px-3 py-1.5 text-xs text-red transition-colors hover:bg-red/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('settings.data.clearButton')}
            </button>
          </SettingRow>
        </Section>

        {/* About */}
        <Section title={t('settings.about.title')} icon={Info}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-soft">{t('settings.about.version')}</span>
              <span className="text-sm text-text-dim">v5.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-soft">{t('settings.about.techStack')}</span>
              <span className="text-sm text-text-dim">
                Next.js 15 · TypeScript · TailwindCSS
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-soft">{t('settings.about.mission')}</span>
              <span className="text-sm text-text-dim">
                Every life deserves its own universe
              </span>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs leading-relaxed text-text-dim">
                {t('settings.about.description')}
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-border pt-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-text-dim transition-colors hover:text-gold"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
              <span className="inline-flex items-center gap-1 text-xs text-text-dim">
                <Heart className="h-3.5 w-3.5 text-red" />
                Made with care
              </span>
            </div>
          </div>
        </Section>
      </main>

      {/* Toast notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg border border-gold-dim bg-bg-card px-4 py-2 text-sm text-gold shadow-lg glow-gold"
        >
          {toast}
        </motion.div>
      )}

      {/* 清除历史记录确认弹窗（danger 变体） */}
      <ConfirmDialog
        open={confirmClear}
        title={t('settings.data.confirmClearTitle')}
        message={t('settings.data.confirmClearMessage')}
        variant="danger"
        confirmText={t('settings.data.confirmClearButton')}
        cancelText={t('common.cancel')}
        onConfirm={handleClearHistory}
        onCancel={() => setConfirmClear(false)}
      />

      {/* 导入数据确认弹窗（warning 变体） */}
      <ConfirmDialog
        open={confirmImport}
        title={t('settings.data.confirmImportTitle')}
        message={t('settings.data.confirmImportMessage')}
        variant="warning"
        confirmText={t('settings.data.confirmImportButton')}
        cancelText={t('common.cancel')}
        onConfirm={handleImport}
        onCancel={() => setConfirmImport(false)}
      />
    </div>
  );
}
