import { AlertTriangle, Download } from 'lucide-react';

interface Props {
  onExport: () => void;
}

export default function BackupNotice({ onExport }: Props) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-semibold text-warning">
          local data only — back up regularly
        </p>
        <p className="mt-1 font-mono text-[11px] text-text-secondary">
          更换电脑、清理浏览器数据、卸载扩展可能导致数据丢失。请定期导出 JSON 备份。
        </p>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="flex shrink-0 items-center gap-1 rounded-md border border-warning/60 bg-warning/20 px-2.5 py-1 font-mono text-[11px] text-warning hover:bg-warning/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warning/60"
      >
        <Download size={11} />
        export now
      </button>
    </div>
  );
}
