interface Window {
  iina?: {
    postMessage: (name: string, payload?: unknown) => void;
    onMessage: (name: string, handler: (payload: unknown) => void) => void;
  };
}

declare module "*.css";

declare const iina: any;
