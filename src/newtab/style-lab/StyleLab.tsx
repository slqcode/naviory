import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import MinimalVariant from './variants/MinimalVariant';
import SoftGlassVariant from './variants/SoftGlassVariant';
import DevConsoleVariant from './variants/DevConsoleVariant';
import BentoVariant from './variants/BentoVariant';

type VariantKey = 'minimal' | 'soft-glass' | 'dev-console' | 'bento';
type Mode = 'light' | 'dark';

const TABS: { key: VariantKey; label: string }[] = [
  { key: 'minimal', label: 'Minimal' },
  { key: 'soft-glass', label: 'Soft Glass' },
  { key: 'dev-console', label: 'Dev Console' },
  { key: 'bento', label: 'Bento' },
];

export default function StyleLab() {
  const [active, setActive] = useState<VariantKey>('minimal');
  const [mode, setMode] = useState<Mode>('light');
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              Style Lab
            </span>
            <nav className="ml-4 flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActive(tab.key)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    active === tab.key
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={empty}
                onChange={(e) => setEmpty(e.target.checked)}
              />
              空态预览
            </label>
            <button
              type="button"
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
              aria-label="toggle theme"
            >
              {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {active === 'minimal' && <MinimalVariant empty={empty} />}
        {active === 'soft-glass' && <SoftGlassVariant empty={empty} />}
        {active === 'dev-console' && <DevConsoleVariant empty={empty} />}
        {active === 'bento' && <BentoVariant empty={empty} />}
      </main>
    </div>
  );
}
