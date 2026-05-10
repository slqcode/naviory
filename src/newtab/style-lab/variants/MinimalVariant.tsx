import { Search, Settings } from 'lucide-react';
import { mockGroups, type MockGroup, type MockLink } from '../mockData';

interface Props {
  empty?: boolean;
}

export default function MinimalVariant({ empty }: Props) {
  const groups = empty ? [] : mockGroups;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold tracking-tight">Naviory</h1>
          <button
            type="button"
            className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-700 transition-colors"
            aria-label="settings"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="relative mb-12">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="搜索链接或直接搜索..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-600"
          />
        </div>

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
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
    <section>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
        {group.name}
      </h2>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-900">
        {group.links.map((link) => (
          <LinkRow key={link.id} link={link} />
        ))}
      </ul>
    </section>
  );
}

function LinkRow({ link }: { link: MockLink }) {
  return (
    <li>
      <button
        type="button"
        className="w-full flex items-center justify-between px-2 py-2.5 text-sm rounded-md hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-900 dark:active:bg-neutral-800 transition-colors text-left"
      >
        <span className="text-neutral-900 dark:text-neutral-100">{link.title}</span>
        <span className="text-xs text-neutral-400 dark:text-neutral-600 truncate ml-4 max-w-xs">
          {link.url.replace(/^https?:\/\//, '')}
        </span>
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-sm text-neutral-500 dark:text-neutral-500">
      还没有任何分组。
    </div>
  );
}
