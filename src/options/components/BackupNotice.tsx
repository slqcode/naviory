import { AlertTriangle, Download } from 'lucide-react';

interface Props {
  onExport: () => void;
}

export default function BackupNotice({ onExport }: Props) {
  return (
    <div className="mb-4 p-4 rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40 flex items-start gap-3">
      <AlertTriangle
        size={20}
        className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          数据仅保存在本机浏览器中
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          更换电脑、清理浏览器数据、卸载扩展可能导致数据丢失。请定期导出 JSON 备份。
        </p>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-gray-900 dark:hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 dark:focus-visible:ring-amber-400/70"
      >
        <Download size={12} />
        立即导出
      </button>
    </div>
  );
}
