import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// 全局 toast 状态管理（简单的订阅模式）
let toastState: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function notify() {
  listeners.forEach((listener) => listener([...toastState]));
}

function addToast(message: string, type: ToastType = 'info'): string {
  const id = crypto.randomUUID();
  toastState = [...toastState, { id, message, type }];
  notify();
  // 3 秒后自动移除
  setTimeout(() => {
    removeToast(id);
  }, 3000);
  return id;
}

function removeToast(id: string) {
  toastState = toastState.filter((t) => t.id !== id);
  notify();
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    return addToast(message, type);
  }, []);

  const success = useCallback((message: string) => addToast(message, 'success'), []);
  const error = useCallback((message: string) => addToast(message, 'error'), []);
  const info = useCallback((message: string) => addToast(message, 'info'), []);

  return {
    toasts,
    showToast,
    success,
    error,
    info,
    removeToast,
  };
}

// 导出独立的函数，可以在组件外部使用
export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  info: (message: string) => addToast(message, 'info'),
};
