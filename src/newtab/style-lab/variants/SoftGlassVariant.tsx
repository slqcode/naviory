import { Search, Settings } from 'lucide-react';
import { mockGroups, type MockGroup, type MockLink } from '../mockData';

interface Props {
  empty?: boolean;
}

export default function SoftGlassVariant({ empty }: Props) {
  const groups = empty ? [] : mockGroups;

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-950 dark:via-purple-950 dark:to-rose-950">
      <div
        className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-pink-300/40 blur-3xl dark:bg-pink-500/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Naviory
          </h1>
          <button
            type="button"
            className="p-2 rounded-lg bg-white/40 backdrop-blur-md border border-white/50 text-neutral-700 hover:bg-white/60 active:bg-white/80 dark:bg-white/10 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/20 dark:active:bg-white/30 transition-colors"
            aria-label="settings"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="relative mb-10">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
          />
          <input
            type="text"
            placeholder="搜索..."
            className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 text-neutral-900 placeholder:text-neutral-500 shadow-lg focus:outline-none focus:bg-white/60 dark:bg-white/10 dark:border-white/10 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:bg-white/20"
          />
        </div>

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Group key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Group({ group }: { group: MockGroup }) {
  return (
    <section className="rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-lg p-5 dark:bg-white/10 dark:border-white/10">
      <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {group.name}
      </h2>
      <ul className="space-y-1">
        {group.links.map((link) => (
          <LinkItem key={link.id} link={link} />
        ))}
      </ul>
    </section>
  );
}

function LinkItem({ link }: { link: MockLink }) {
  return (
    <li>
      <button
        type="button"
        className="w-full px-3 py-2 text-sm text-left rounded-lg text-neutral-800 hover:bg-white/40 active:bg-white/60 dark:text-neutral-200 dark:hover:bg-white/10 dark:active:bg-white/20 transition-colors"
      >
        {link.title}
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 p-12 text-center text-sm text-neutral-700 shadow-lg dark:bg-white/5 dark:border-white/10 dark:text-neutral-300">
      你的卡片墙还是空的。
    </div>
  );
}
