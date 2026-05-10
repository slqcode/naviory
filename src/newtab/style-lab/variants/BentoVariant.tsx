import { Search, Settings } from 'lucide-react';
import { mockGroups, type MockGroup, type MockLink } from '../mockData';

interface Props {
  empty?: boolean;
}

export default function BentoVariant({ empty }: Props) {
  const groups = empty ? [] : mockGroups;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Naviory</h1>
          <button
            type="button"
            className="p-2 rounded-xl bg-white text-stone-600 shadow-sm hover:shadow-md hover:text-stone-900 active:shadow-none dark:bg-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
            aria-label="settings"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(0,_auto)]">
          <section className="md:col-span-3 rounded-2xl bg-white dark:bg-stone-900 shadow-sm p-5">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="搜索 / 跳转"
                className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-100 dark:placeholder:text-stone-600 dark:focus:border-stone-600"
              />
            </div>
          </section>

          {groups.length === 0 ? (
            <EmptyState />
          ) : (
            groups.map((group, idx) => (
              <Group key={group.id} group={group} large={idx === 0} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ group, large }: { group: MockGroup; large?: boolean }) {
  return (
    <section
      className={`rounded-2xl bg-white dark:bg-stone-900 shadow-sm p-5 ${
        large ? 'md:col-span-2' : ''
      }`}
    >
      <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-100">
        {group.name}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {group.links.map((link) => (
          <LinkTile key={link.id} link={link} />
        ))}
      </ul>
    </section>
  );
}

function LinkTile({ link }: { link: MockLink }) {
  return (
    <li>
      <button
        type="button"
        className="w-full text-left px-3 py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 active:bg-stone-200 dark:bg-stone-950 dark:hover:bg-stone-800 dark:active:bg-stone-700 transition-colors"
      >
        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
          {link.title}
        </div>
        <div className="text-xs text-stone-400 dark:text-stone-600 truncate mt-0.5">
          {link.url.replace(/^https?:\/\//, '')}
        </div>
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <section className="md:col-span-3 rounded-2xl bg-white dark:bg-stone-900 shadow-sm p-12 text-center text-sm text-stone-500 dark:text-stone-500">
      这里还很空，先添加几个常用入口吧。
    </section>
  );
}
