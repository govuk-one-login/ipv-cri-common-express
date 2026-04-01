// hmpo-config and hmpo-logger have no published types and are scheduled for removal "at some point" so i've added type shims as a workaround
declare module "hmpo-config" {
  interface HmpoConfigInstance {
    addConfig(config: unknown): void;
    addFile(file: string | undefined): void;
    addString(str: string): void;
    toJSON(): Record<string, unknown>;
  }

  const HmpoConfig: new (appRoot?: string) => HmpoConfigInstance;
  export = HmpoConfig;
}

declare module "hmpo-logger" {
  interface HmpoLoggerInstance {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
  }

  interface HmpoLogger {
    config(options: unknown): void;
    get(name?: string, level?: number): HmpoLoggerInstance;
    middleware(format: string): import("express").RequestHandler;
  }

  const hmpoLogger: HmpoLogger;
  export = hmpoLogger;
}
