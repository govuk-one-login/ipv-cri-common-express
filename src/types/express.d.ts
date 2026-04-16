import type { AxiosInstance } from "axios";
import type { TFunction } from "i18next";

export {};

declare global {
  namespace Express {
    interface Request {
      axios: AxiosInstance;
      isNewBrowser?: boolean;
      featureFlags?: Record<string, boolean>;
      scenarioIDHeader?: string;
      session: {
        tokenId: string;
        featureFlags?: Record<string, boolean>;
        authParams?: {
          authorization_code?: string;
          state?: string;
          client_id?: string;
          redirect_uri?: string;
        };
      };
      translate?: TFunction;
      jwt?: string;
    }
  }
}
