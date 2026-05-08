import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function Toast() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon =
          t.type === 'success' ? CheckCircle : t.type === 'error' ? XCircle : Info;
        const colorClass =
          t.type === 'success'
            ? 'bg-green-600'
            : t.type === 'error'
            ? 'bg-red-600'
            : 'bg-gray-700';
        return (
          <div
            key={t.id}
            className={`${colorClass} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto min-w-[200px] max-w-md`}
          >
            <Icon size={16} />
            <span className="text-sm">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
