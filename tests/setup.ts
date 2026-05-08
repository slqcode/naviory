// tests/setup.ts
// 为测试环境提供必要的全局对象。
import 'fake-indexeddb/auto';

// crypto.randomUUID 在 jsdom 里可能缺失，这里做一个兜底实现。
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error jsdom 的 globalThis 允许写入
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => {
    // 简化版 UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) as `${string}-${string}-${string}-${string}-${string}`;
  };
}
