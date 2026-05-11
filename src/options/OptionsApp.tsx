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
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        加载中...
      </div>
    );
  }

  const version =
    typeof chrome !== 'undefined' && chrome.runtime?.getManifest
      ? chrome.runtime.getManifest().version
      : '0.1.0';

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <header className="flex items-center gap-2 mb-6">
          <Settings size={24} className="text-indigo-600" />
          <h1 className="text-2xl font-bold">Naviory 设置</h1>
        </header>

        <BackupNotice onExport={handleExport} />

        <div className="space-y-4">
          {/* 外观 */}
          <Section icon={<Palette size={18} />} title="外观">
            <RadioRow
              name="theme"
              label="主题模式"
              value={settings.theme}
              onChange={(v) => setTheme(v as AppSettings['theme'])}
              options={[
                { value: 'system', label: '跟随系统' },
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' },
              ]}
            />
          </Section>

          {/* 搜索 */}
          <Section icon={<Search size={18} />} title="搜索">
            <RadioRow
              name="defaultSearchEngine"
              label="默认搜索引擎"
              value={settings.defaultSearchEngine}
              onChange={(v) => setSearchEngine(v as DefaultSearchEngine)}
              options={[
                { value: 'google', label: 'Google' },
                { value: 'bing', label: 'Bing' },
                { value: 'baidu', label: '百度' },
              ]}
            />
            <p className="mt-2 text-xs text-gray-500">
              提示：搜索框支持前缀：g（Google）、b（Bing）、bd（百度）、gh（GitHub）、npm（npm）
            </p>
          </Section>

          {/* 交互 */}
          <Section icon={<ExternalLink size={18} />} title="交互">
            <RadioRow
              name="defaultOpenMode"
              label="链接打开方式"
              value={settings.defaultOpenMode}
              onChange={(v) => setOpenMode(v as AppSettings['defaultOpenMode'])}
              options={[
                { value: 'current', label: '当前页' },
                { value: 'new-tab', label: '新标签页' },
              ]}
            />
          </Section>

          {/* 数据管理 */}
          <Section icon={<Database size={18} />} title="数据管理">
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                <Download size={14} />
                导出 JSON
              </button>
              <button onClick={handleImport} className="btn-secondary flex items-center gap-2">
                <Upload size={14} />
                导入 JSON
              </button>
              <button onClick={handleImportHtml} className="btn-secondary flex items-center gap-2">
                <FileUp size={14} />
                导入浏览器书签 (HTML)
              </button>
              <button
                onClick={() => setDuplicatesOpen(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <ScanSearch size={14} />
                扫描重复链接
              </button>
              <button onClick={handleClearData} className="btn-danger flex items-center gap-2">
                <Trash2 size={14} />
                清空全部数据
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              当前：{groups.length} 个分组，{links.length} 个链接
            </p>
          </Section>

          {/* 关于 */}
          <Section icon={<Info size={18} />} title="关于">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>版本：{version}</div>
              <div>
                Naviory 是一个自用的新标签页工作台浏览器扩展，用于管理常用入口。
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
          title="清空全部数据"
          message="此操作将永久删除所有分组、链接和设置，并重置为默认状态。此操作不可恢复。"
          requireText="DELETE"
          confirmLabel="确认清空"
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

// ---------------------------------------------------------------------------
// 辅助组件
// ---------------------------------------------------------------------------

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
    <section className="card p-4">
      <header className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {icon}
        {title}
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
      <legend className="text-sm mb-2 text-gray-600 dark:text-gray-400">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`px-3 py-1.5 rounded-md border cursor-pointer text-sm ${
              value === opt.value
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
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
