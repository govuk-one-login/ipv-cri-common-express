import type { AxiosInstance } from "axios";
import type { TFunction } from "i18next";

export {};

declare module "express-session" {
  interface SessionData {
    ipvSessionId: string;
    context: unknown;
    tokenId: string;
    linkedFiles?: Record<string, boolean>;
    featureFlags?: Record<string, boolean>;
    scenarioID: string;
    "start-time"?: number;
    authParams?: {
      authorization_code?: string;
      state?: string;
      client_id?: string;
      redirect_uri?: string;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      axios: AxiosInstance;
      id?: string;
      isNewBrowser?: boolean;
      featureFlags?: Record<string, boolean>;
      scenarioIDHeader?: string;
      modelOptions: unknown;
      linkedFiles?: {
        add: (data: unknown, cb: (err: Error | null, id?: string) => void) => void;
        get: (id: string, cb: (err: Error | null, data?: unknown) => void) => void;
        del: (id: string, cb: (err: Error | null) => void) => void;
      };
      payload?: {
        journeyKeys: Record<string, string>;
        files?: Record<string, unknown>;
      };
      sessionID: string;
      sessionTTL: number;
      translate?: TFunction;
      jwt?: string;
    }
  }
}
