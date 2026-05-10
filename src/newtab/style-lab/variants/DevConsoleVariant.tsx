import { Settings } from 'lucide-react';
import { mockGroups, type MockGroup, type MockLink } from '../mockData';

interface Props {
  empty?: boolean;
}

export default function DevConsoleVariant({ empty }: Props) {
  const groups = empty ? [] : mockGroups;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-50 text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      <div className="mx-auto max-w-5xl px-6 py-8 font-mono text-[13px]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="flex items-center gap-2 text-sm">
            <span className="text-emerald-600 dark:text-emerald-400">~/naviory</span>
            <span className="text-zinc-400 dark:text-zinc-600">$</span>
            <span className="text-zinc-700 dark:text-zinc-300">launch</span>
          </h1>
          <button
            type="button"
            className="p-1.5 rounded text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 active:bg-zinc-300 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 dark:active:bg-zinc-700 transition-colors"
            aria-label="settings"
          >
            <Settings size={16} />
          </button>
        </div>

        <div className="mb-8 flex items-center gap-2 px-3 py-2 rounded border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-emerald-600 dark:text-emerald-400 select-none">{'>'}</span>
          <input
            type="text"
            placeholder="_"
            className="flex-1 bg-transparent text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
          />
        </div>

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
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
      <h2 className="mb-2 text-xs text-zinc-500 dark:text-zinc-500">
        <span className="text-emerald-600 dark:text-emerald-400"># </span>
        {group.name}
        <span className="ml-2 text-zinc-400 dark:text-zinc-700">({group.links.length})</span>
      </h2>
      <ul className="border-l border-zinc-200 dark:border-zinc-800 pl-3 space-y-0.5">
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
        className="w-full text-left px-2 py-1 rounded hover:bg-zinc-200 active:bg-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 transition-colors flex items-center gap-3"
      >
        <span className="text-emerald-600 dark:text-emerald-400 shrink-0">●</span>
        <span className="font-sans text-zinc-800 dark:text-zinc-200 shrink-0">{link.title}</span>
        <span className="text-zinc-400 dark:text-zinc-600 truncate">
          {link.url.replace(/^https?:\/\//, '')}
        </span>
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <pre className="text-zinc-500 dark:text-zinc-600">
      {`// no entries
// run \`add <url>\` to create one`}
    </pre>
  );
}
