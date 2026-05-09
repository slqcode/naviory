import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { db } from '@/db';
import { toast } from '@/hooks/useToast';

// 清空数据库并重置 store 状态
async function resetDb() {
  await db.links.clear();
  await db.groups.clear();
  await db.settings.clear();
  // 重置 store 的内存状态
  useAppStore.setState({
    groups: [],
    links: [],
    initialized: false,
    error: null,
    loading: false,
  });
}

describe('useAppStore - 初始化', () => {
  beforeEach(resetDb);

  it('initialize() 会创建 7 个默认分组', async () => {
    await useAppStore.getState().initialize();
    const state = useAppStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.groups.length).toBe(7);
    expect(state.groups.map((g) => g.name)).toEqual([
      '工作',
      '项目',
      'AI',
      '开发',
      '文档',
      '工具',
      '临时',
    ]);
  });

  it('initialize() 重复调用不会重复创建默认数据', async () => {
    await useAppStore.getState().initialize();
    await useAppStore.getState().initialize();
    const state = useAppStore.getState();
    expect(state.groups.length).toBe(7);
  });

  it('默认设置包含正确的值', async () => {
    await useAppStore.getState().initialize();
    const state = useAppStore.getState();
    expect(state.settings.theme).toBe('system');
    expect(state.settings.defaultSearchEngine).toBe('google');
    expect(state.settings.defaultOpenMode).toBe('current');
  });
});

describe('useAppStore - 分组 CRUD', () => {
  beforeEach(async () => {
    await resetDb();
    await useAppStore.getState().initialize();
  });

  it('addGroup 会添加分组到状态', async () => {
    const before = useAppStore.getState().groups.length;
    const group = await useAppStore.getState().addGroup({
      name: '测试分组',
      icon: 'Star',
      color: 'blue',
      sort: 100,
    });
    const after = useAppStore.getState().groups.length;
    expect(after).toBe(before + 1);
    expect(group.id).toBeTruthy();
    expect(group.name).toBe('测试分组');
  });

  it('updateGroup 修改分组名称', async () => {
    const [first] = useAppStore.getState().groups;
    await useAppStore.getState().updateGroup(first.id, { name: '重命名后' });
    const updated = useAppStore.getState().groups.find((g) => g.id === first.id);
    expect(updated?.name).toBe('重命名后');
  });

  it('toggleGroupCollapsed 翻转 collapsed 状态', async () => {
    const [first] = useAppStore.getState().groups;
    const initial = first.collapsed;
    await useAppStore.getState().toggleGroupCollapsed(first.id);
    const after = useAppStore.getState().groups.find((g) => g.id === first.id);
    expect(after?.collapsed).toBe(!initial);
  });

  it('deleteGroup cascade 会级联删除分组下所有链接', async () => {
    const [first] = useAppStore.getState().groups;
    // 先在这个分组下创建 2 个链接
    await useAppStore.getState().addLink({
      title: 'L1',
      url: 'https://a.com',
      groupId: first.id,
      sort: 1,
    });
    await useAppStore.getState().addLink({
      title: 'L2',
      url: 'https://b.com',
      groupId: first.id,
      sort: 2,
    });
    expect(useAppStore.getState().links.filter((l) => l.groupId === first.id).length).toBe(2);

    await useAppStore.getState().deleteGroup(first.id, 'cascade');
    expect(useAppStore.getState().groups.find((g) => g.id === first.id)).toBeUndefined();
    expect(useAppStore.getState().links.filter((l) => l.groupId === first.id).length).toBe(0);
  });

  it('deleteGroup move-to-temp 会将链接移到临时分组', async () => {
    const state = useAppStore.getState();
    const workGroup = state.groups.find((g) => g.name === '工作')!;
    const tempGroup = state.groups.find((g) => g.name === '临时')!;

    await state.addLink({
      title: 'L1',
      url: 'https://a.com',
      groupId: workGroup.id,
      sort: 1,
    });
    await useAppStore.getState().deleteGroup(workGroup.id, 'move-to-temp');

    const after = useAppStore.getState();
    expect(after.groups.find((g) => g.id === workGroup.id)).toBeUndefined();
    // 链接应该还在，但 groupId 变成临时分组
    const l1 = after.links.find((l) => l.title === 'L1');
    expect(l1).toBeDefined();
    expect(l1?.groupId).toBe(tempGroup.id);
  });

  it('deleteGroup move-to-temp 找不到临时分组时抛错，不删除链接', async () => {
    const state = useAppStore.getState();
    const workGroup = state.groups.find((g) => g.name === '工作')!;
    const tempGroup = state.groups.find((g) => g.name === '临时')!;

    await state.addLink({
      title: 'L1',
      url: 'https://a.com',
      groupId: workGroup.id,
      sort: 1,
    });
    // 先把临时分组删了
    await useAppStore.getState().deleteGroup(tempGroup.id, 'cascade');

    // 再尝试用 move-to-temp 删除"工作"，应该抛错
    await expect(
      useAppStore.getState().deleteGroup(workGroup.id, 'move-to-temp')
    ).rejects.toThrow();

    // "工作"分组和它下面的链接都应该还在
    const after = useAppStore.getState();
    expect(after.groups.find((g) => g.id === workGroup.id)).toBeDefined();
    expect(after.links.find((l) => l.title === 'L1')).toBeDefined();
  });
});

describe('useAppStore - 链接 URL 去重', () => {
  beforeEach(async () => {
    await resetDb();
    await useAppStore.getState().initialize();
  });

  it('checkUrlDuplicate 命中返回链接', async () => {
    const [g] = useAppStore.getState().groups;
    await useAppStore.getState().addLink({
      title: 'A',
      url: 'https://example.com',
      groupId: g.id,
      sort: 1,
    });
    const dup = useAppStore.getState().checkUrlDuplicate('https://example.com');
    expect(dup).not.toBeNull();
    expect(dup?.title).toBe('A');
  });

  it('checkUrlDuplicate 未命中返回 null', () => {
    const dup = useAppStore.getState().checkUrlDuplicate('https://nope.com');
    expect(dup).toBeNull();
  });

  it('checkUrlDuplicate 排除 excludeId 的链接（用于编辑自身）', async () => {
    const [g] = useAppStore.getState().groups;
    const link = await useAppStore.getState().addLink({
      title: 'A',
      url: 'https://example.com',
      groupId: g.id,
      sort: 1,
    });
    // 编辑自身时传 excludeId，不应被认为是重复
    const dup = useAppStore.getState().checkUrlDuplicate('https://example.com', link.id);
    expect(dup).toBeNull();
  });
});

describe('useAppStore - 链接扩展操作', () => {
  beforeEach(async () => {
    await resetDb();
    await useAppStore.getState().initialize();
  });

  it('deleteLinkWithUndo 会立即删除并可撤销恢复原始字段', async () => {
    const showSpy = vi.spyOn(toast, 'show');
    const state = useAppStore.getState();
    const group = state.groups.find((g) => g.name === '工作')!;

    const link = await state.addLink({
      title: 'Undo Link',
      url: 'https://undo.com',
      groupId: group.id,
      sort: 7,
    });

    const createdAt = link.createdAt;
    await state.deleteLinkWithUndo(link.id);

    expect(useAppStore.getState().links.find((l) => l.id === link.id)).toBeUndefined();
    expect(showSpy).toHaveBeenCalledTimes(1);

    const deleteToastCall = showSpy.mock.calls.find(
      ([options]) =>
        options.message === '已删除链接' &&
        options.type === 'info' &&
        options.action?.label === '撤销'
    );
    expect(deleteToastCall).toBeDefined();
    const toastOptions = deleteToastCall![0];
    expect(toastOptions.message).toBe('已删除链接');
    expect(toastOptions.type).toBe('info');
    expect(toastOptions.durationMs).toBe(10000);
    expect(toastOptions.action?.label).toBe('撤销');

    await toastOptions.action?.onClick();

    const restored = useAppStore.getState().links.find((l) => l.id === link.id);
    expect(restored).toBeDefined();
    expect(restored?.id).toBe(link.id);
    expect(restored?.createdAt).toBe(createdAt);
    expect(restored?.sort).toBe(link.sort);
    expect(restored?.groupId).toBe(group.id);

    showSpy.mockRestore();
  });

  it('deleteLinkWithUndo 原分组不存在时恢复到临时分组并提示 info', async () => {
    const showSpy = vi.spyOn(toast, 'show');
    const successSpy = vi.spyOn(toast, 'success');

    const state = useAppStore.getState();
    const workGroup = state.groups.find((g) => g.name === '工作')!;
    const tempGroup = state.groups.find((g) => g.name === '临时')!;

    const link = await state.addLink({
      title: 'Fallback Link',
      url: 'https://fallback.com',
      groupId: workGroup.id,
      sort: 3,
    });

    await state.deleteLinkWithUndo(link.id);
    await state.deleteGroup(workGroup.id, 'cascade');

    const deleteToastCall = showSpy.mock.calls.find(
      ([options]) =>
        options.message === '已删除链接' &&
        options.type === 'info' &&
        options.action?.label === '撤销'
    );
    expect(deleteToastCall).toBeDefined();
    const toastOptions = deleteToastCall![0];
    await toastOptions.action?.onClick();

    const restored = useAppStore.getState().links.find((l) => l.id === link.id);
    expect(restored).toBeDefined();
    expect(restored?.groupId).toBe(tempGroup.id);

    expect(showSpy).toHaveBeenCalledWith({
      message: '已恢复到"临时"分组（原分组已删除）',
      type: 'info',
    });
    expect(successSpy).not.toHaveBeenCalledWith('已恢复');

    showSpy.mockRestore();
    successSpy.mockRestore();
  });

  it('bulkDeleteLinks 会批量删除并保留未删除链接', async () => {
    const state = useAppStore.getState();
    const group = state.groups[0];

    const keep = await state.addLink({
      title: 'Keep',
      url: 'https://keep.com',
      groupId: group.id,
      sort: 1,
    });
    const del1 = await state.addLink({
      title: 'Delete1',
      url: 'https://delete1.com',
      groupId: group.id,
      sort: 2,
    });
    const del2 = await state.addLink({
      title: 'Delete2',
      url: 'https://delete2.com',
      groupId: group.id,
      sort: 3,
    });

    await state.bulkDeleteLinks([del1.id, del2.id]);

    const links = useAppStore.getState().links;
    expect(links.find((l) => l.id === del1.id)).toBeUndefined();
    expect(links.find((l) => l.id === del2.id)).toBeUndefined();
    expect(links.find((l) => l.id === keep.id)).toBeDefined();
  });

  it('importBookmarksHtml 会复用分组、创建缺失分组并保留重复 URL', async () => {
    const state = useAppStore.getState();
    const existingGroup = state.groups.find((g) => g.name === '工作')!;

    const imported = {
      groupNames: ['工作', '新分组'],
      links: [
        {
          groupName: '工作',
          title: 'Old URL A',
          url: 'https://dup.com',
          createdAt: 1700000000000,
        },
        {
          groupName: '工作',
          title: 'Old URL B',
          url: 'https://dup.com',
        },
        {
          groupName: '新分组',
          title: 'New Group Link',
          url: 'https://new-group.com',
          createdAt: 1700000000100,
        },
      ],
    };

    const result = await state.importBookmarksHtml(imported);

    expect(result).toEqual({ groupsCreated: 1, linksCreated: 3 });

    const after = useAppStore.getState();
    const reusedGroup = after.groups.find((g) => g.name === '工作');
    const createdGroup = after.groups.find((g) => g.name === '新分组');

    expect(reusedGroup?.id).toBe(existingGroup.id);
    expect(createdGroup).toBeDefined();

    const duplicatedLinks = after.links.filter((l) => l.url === 'https://dup.com');
    expect(duplicatedLinks).toHaveLength(2);

    const newGroupLink = after.links.find((l) => l.url === 'https://new-group.com');
    expect(newGroupLink?.groupId).toBe(createdGroup?.id);
  });
});

describe('useAppStore - 导入导出', () => {
  beforeEach(async () => {
    await resetDb();
    await useAppStore.getState().initialize();
  });

  it('exportData 返回当前所有数据', async () => {
    const data = await useAppStore.getState().exportData();
    expect(data.version).toBe(1);
    expect(typeof data.exportedAt).toBe('number');
    expect(data.groups.length).toBe(7);
    expect(data.links).toEqual([]);
    expect(data.settings.theme).toBe('system');
  });

  it('importData overwrite 会替换所有数据', async () => {
    // 先加一条链接
    const [g] = useAppStore.getState().groups;
    await useAppStore.getState().addLink({
      title: 'Old',
      url: 'https://old.com',
      groupId: g.id,
      sort: 1,
    });
    expect(useAppStore.getState().links.length).toBe(1);

    // 构造一份只包含 1 个分组 + 1 个链接的导入数据
    const newGroupId = 'imported-group';
    const newLinkId = 'imported-link';
    await useAppStore.getState().importData(
      {
        version: 1,
        exportedAt: Date.now(),
        groups: [
          {
            id: newGroupId,
            name: '仅此一组',
            sort: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        links: [
          {
            id: newLinkId,
            title: 'New',
            url: 'https://new.com',
            groupId: newGroupId,
            sort: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        settings: {
          id: 'app-settings',
          theme: 'dark',
          defaultSearchEngine: 'bing',
          defaultOpenMode: 'new-tab',
          version: 1,
          updatedAt: Date.now(),
        },
      },
      'overwrite'
    );

    const after = useAppStore.getState();
    expect(after.groups.length).toBe(1);
    expect(after.groups[0].id).toBe(newGroupId);
    expect(after.links.length).toBe(1);
    expect(after.links[0].id).toBe(newLinkId);
    expect(after.settings.theme).toBe('dark');
  });

  it('clearAllData 清空后自动重新初始化默认数据', async () => {
    const [g] = useAppStore.getState().groups;
    await useAppStore.getState().addLink({
      title: 'T',
      url: 'https://t.com',
      groupId: g.id,
      sort: 1,
    });
    await useAppStore.getState().clearAllData();
    const after = useAppStore.getState();
    // 重新初始化后，7 个默认分组应被重建
    expect(after.groups.length).toBe(7);
    expect(after.links.length).toBe(0);
    expect(after.initialized).toBe(true);
  });
});
