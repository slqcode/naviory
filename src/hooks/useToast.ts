import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  durationMs?: number;
  action?: ToastAction;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

const MAX_TOASTS = 3;

let toastState: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function notify() {
  listeners.forEach((listener) => listener([...toastState]));
}

function addToast(message: string, type: ToastType = 'info', durationMs = 3000, action?: ToastAction): string {
  const id = crypto.randomUUID();
  toastState = [...toastState, { id, message, type, action }];
  if (toastState.length > MAX_TOASTS) {
    toastState = toastState.slice(toastState.length - MAX_TOASTS);
  }
  notify();
  setTimeout(() => {
    removeToast(id);
  }, durationMs);
  return id;
}

export function removeToast(id: string) {
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

  const success = useCallback((message: string) => addToast(message, 'success'), []);
  const error = useCallback((message: string) => addToast(message, 'error'), []);

  return {
    toasts,
    success,
    error,
  };
}

export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  show: (options: ToastOptions) =>
    addToast(options.message, options.type ?? 'info', options.durationMs ?? 3000, options.action),
};
