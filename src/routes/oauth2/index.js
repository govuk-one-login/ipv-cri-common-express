import express from "express";
import {
  addAuthParamsToSession,
  addJWTToRequest,
  initSessionWithJWT,
  redirectToCallback,
  redirectToEntryPoint,
  retrieveAuthorizationCode,
} from "./middleware";

export const oauth2Router = express.Router();

oauth2Router.get(
  "/authorize",
  addAuthParamsToSession,
  addJWTToRequest,
  initSessionWithJWT,
  redirectToEntryPoint,
);
oauth2Router.get("/callback", retrieveAuthorizationCode, redirectToCallback);
