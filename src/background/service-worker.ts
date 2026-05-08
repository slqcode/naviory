// src/background/service-worker.ts
// Naviory 的后台 Service Worker（Manifest V3）
// MVP 阶段职责很轻：监听安装事件，做基础日志。
// 真正的数据初始化在新标签页首次加载时完成。

/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Naviory] 首次安装完成，打开新标签页以初始化数据。');
  } else if (details.reason === 'update') {
    console.log(`[Naviory] 已更新到版本 ${chrome.runtime.getManifest().version}`);
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Naviory] 浏览器启动');
});

// 导出空对象让 TypeScript 把此文件视为模块（配合 "type": "module"）
export {};
