import { useEffect, useState, type ReactNode } from 'react';
import {
  Settings,
  Palette,
  Search,
  ExternalLink,
  Database,
  Info,
  Download,
  Upload,
  Trash2,
  FileUp,
  ScanSearch,
  AlertOctagon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/hooks/useToast';
import { downloadJson, readJsonFile, validateExportData } from '@/utils/importExport';
import { parseBookmarksHtml } from '@/utils/bookmarksHtmlImporter';
import BackupNotice from '@/options/components/BackupNotice';
import DuplicatesPanel from '@/options/components/DuplicatesPanel';
import Toast from '@/newtab/components/Toast';
import ConfirmDialog from '@/newtab/components/ConfirmDialog';
import TypedConfirmDialog from '@/newtab/components/TypedConfirmDialog';
import type { DefaultSearchEngine, AppSettings } from '@/types';

export default function OptionsApp() {
  useTheme();
  const {
    settings,
    groups,
    links,
    initialized,
    initialize,
    updateSettings,
    exportData,
    importData,
    importBookmarksHtml,
    clearAllData,
  } = useAppStore();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const [clearDataSubmitting, setClearDataSubmitting] = useState(false);

  const openConfirmDialog = (config: NonNullable<typeof confirmConfig>) => {
    if (confirmOpen) return;
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const closeConfirmDialog = () => {
    setConfirmSubmitting(false);
    setConfirmOpen(false);
    setConfirmConfig(null);
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  const setTheme = (theme: AppSettings['theme']) => {
    updateSettings({ theme }).then(() => toast.success('主题已更新'));
  };

  const setSearchEngine = (engine: DefaultSearchEngine) => {
    updateSettings({ defaultSearchEngine: engine }).then(() =>
      toast.success('默认搜索引擎已更新')
    );
  };

  const setOpenMode = (mode: AppSettings['defaultOpenMode']) => {
    updateSettings({ defaultOpenMode: mode }).then(() => toast.success('打开方式已更新'));
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      downloadJson(data, `naviory-backup-${new Date().toISOString().split('T')[0]}.json`);
      toast.success('导出成功');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = await readJsonFile(file);
        if (!validateExportData(data)) {
          toast.error('JSON 格式不正确');
          return;
        }
        openConfirmDialog({
          title: '导入数据',
          message: '导入数据会覆盖当前所有数据，确定继续吗？',
          confirmLabel: '覆盖导入',
          danger: true,
          onConfirm: async () => {
            await importData(data, 'overwrite');
            toast.success('导入成功');
          },
        });
      } catch (err) {
        toast.error((err as Error).message);
      }
    };
    input.click();
  };

  const handleClearData = () => {
    if (clearDataOpen) return;
    setClearDataOpen(true);
  };

  const handleClearDataConfirm = async () => {
    if (clearDataSubmitting) return;
    setClearDataSubmitting(true);
    try {
      await clearAllData();
      toast.success('数据已清空');
      setClearDataOpen(false);
    } catch (err) {
      toast.error((err as Error).message || '清空失败，请重试');
    } finally {
      setClearDataSubmitting(false);
    }
  };

  const handleImportHtml = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'text/html,.html,.htm';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const html = await file.text();
        const parsed = parseBookmarksHtml(html);
        if (parsed.links.length === 0) {
          toast.show({ message: '未找到书签', type: 'info' });
          return;
        }

        const { groupsCreated, linksCreated } = await importBookmarksHtml(parsed);
        toast.success(`已导入 ${linksCreated} 条链接，新增 ${groupsCreated} 个分组`);
      } catch (err) {
        toast.error((err as Error).message);
      }
    };
    input.click();
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-mono text-sm text-text-muted">
        $ loading settings...
      </div>
    );
  }

  const version =
    typeof chrome !== 'undefined' && chrome.runtime?.getManifest
      ? chrome.runtime.getManifest().version
      : '0.1.0';

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-6 flex items-center gap-2">
          <Settings size={18} className="text-accent" />
          <h1 className="font-mono text-lg font-semibold">
            <span className="text-text-muted">$</span> naviory settings
          </h1>
        </header>

        <BackupNotice onExport={handleExport} />

        <div className="space-y-3">
          <Section icon={<Palette size={14} />} title="appearance">
            <RadioRow
              name="theme"
              label="theme"
              value={settings.theme}
              onChange={(v) => setTheme(v as AppSettings['theme'])}
              options={[
                { value: 'system', label: 'system' },
                { value: 'light', label: 'light' },
                { value: 'dark', label: 'dark' },
              ]}
            />
          </Section>

          <Section icon={<Search size={14} />} title="search">
            <RadioRow
              name="defaultSearchEngine"
              label="default engine"
              value={settings.defaultSearchEngine}
              onChange={(v) => setSearchEngine(v as DefaultSearchEngine)}
              options={[
                { value: 'google', label: 'Google' },
                { value: 'bing', label: 'Bing' },
                { value: 'baidu', label: 'Baidu' },
              ]}
            />
            <p className="mt-2 font-mono text-[11px] text-text-muted">
              # prefixes: g / b / bd / gh / npm
            </p>
          </Section>

          <Section icon={<ExternalLink size={14} />} title="interaction">
            <RadioRow
              name="defaultOpenMode"
              label="open mode"
              value={settings.defaultOpenMode}
              onChange={(v) => setOpenMode(v as AppSettings['defaultOpenMode'])}
              options={[
                { value: 'current', label: 'current tab' },
                { value: 'new-tab', label: 'new tab' },
              ]}
            />
          </Section>

          <Section icon={<Database size={14} />} title="data">
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                <Download size={13} />
                export JSON
              </button>
              <button onClick={handleImport} className="btn-secondary flex items-center gap-2">
                <Upload size={13} />
                import JSON
              </button>
              <button onClick={handleImportHtml} className="btn-secondary flex items-center gap-2">
                <FileUp size={13} />
                import bookmarks (HTML)
              </button>
              <button
                onClick={() => setDuplicatesOpen(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <ScanSearch size={13} />
                scan duplicates
              </button>
            </div>
            <p className="mt-3 font-mono text-[11px] text-text-muted">
              # {groups.length} groups · {links.length} links
            </p>
          </Section>

          {/* Danger Zone */}
          <section className="rounded-lg border border-danger/40 bg-danger/5 p-4">
            <header className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-danger">
              <AlertOctagon size={13} />
              danger zone
            </header>
            <p className="mb-3 font-mono text-[11px] text-text-secondary">
              这些操作不可恢复，请先备份数据。
            </p>
            <button
              onClick={handleClearData}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 size={13} />
              clear all data
            </button>
          </section>

          <Section icon={<Info size={14} />} title="about">
            <div className="space-y-1 font-mono text-xs text-text-secondary">
              <div>
                <span className="text-text-muted">version</span> v{version}
              </div>
              <div className="text-text-muted">
                Naviory · local-first new tab workspace for developers.
              </div>
            </div>
          </Section>
        </div>
      </div>

      {confirmOpen && confirmConfig && (
        <ConfirmDialog
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          danger={confirmConfig.danger}
          onConfirm={async () => {
            if (confirmSubmitting || !confirmConfig) return;

            setConfirmSubmitting(true);
            try {
              await confirmConfig.onConfirm();
              closeConfirmDialog();
            } catch (err) {
              setConfirmSubmitting(false);
              toast.error((err as Error).message || '操作失败，请重试');
            }
          }}
          onCancel={() => {
            if (confirmSubmitting) return;
            closeConfirmDialog();
          }}
        />
      )}

      <Toast />
      <DuplicatesPanel open={duplicatesOpen} onClose={() => setDuplicatesOpen(false)} />
      {clearDataOpen && (
        <TypedConfirmDialog
          title="clear all data"
          message="此操作将永久删除所有分组、链接和设置，并重置为默认状态。此操作不可恢复。"
          requireText="DELETE"
          confirmLabel="clear"
          danger
          onConfirm={handleClearDataConfirm}
          onCancel={() => {
            if (clearDataSubmitting) return;
            setClearDataOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel px-4 py-3">
      <header className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
        <span className="text-accent">{icon}</span>
        <span># {title}</span>
      </header>
      {children}
    </section>
  );
}

function RadioRow({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`cursor-pointer rounded-md border px-3 py-1 font-mono text-xs transition-colors ${
              value === opt.value
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
