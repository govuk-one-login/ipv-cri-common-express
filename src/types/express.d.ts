import type { AxiosInstance } from "axios";

export {};

declare global {
  namespace Express {
    interface Request {
      axios: AxiosInstance;
      scenarioIDHeader?: string;
      session: {
        tokenId: string;
        authParams?: {
          authorization_code?: string;
          state?: string;
          client_id?: string;
          redirect_uri?: string;
        };
      };
      jwt?: string;
    }
  }
}
