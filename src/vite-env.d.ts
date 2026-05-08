/// <reference types="vite/client" />

// Chrome extension API (minimal declarations for type safety)
declare const chrome: {
  runtime: {
    openOptionsPage: () => void;
  };
} | undefined;
