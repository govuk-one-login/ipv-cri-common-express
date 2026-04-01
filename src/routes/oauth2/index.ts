import express from "express";

const router = express.Router();

import {
  addAuthParamsToSession,
  redirectToCallback,
  initSessionWithJWT,
  redirectToEntryPoint,
  addJWTToRequest,
  retrieveAuthorizationCode,
} from "./middleware.js";

router.get(
  "/authorize",
  addAuthParamsToSession,
  addJWTToRequest,
  initSessionWithJWT,
  redirectToEntryPoint,
);
router.get("/callback", retrieveAuthorizationCode, redirectToCallback);

export { router };
