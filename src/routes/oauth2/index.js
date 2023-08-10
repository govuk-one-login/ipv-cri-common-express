const express = require("express");

const router = express.Router();

const {
  addAuthParamsToSession,
  redirectToCallback,
  initSessionWithJWT,
  redirectToEntryPoint,
  addJWTToRequest,
  retrieveAuthorizationCode,
} = require("./middleware");

router.get(
  "/authorize",
  addAuthParamsToSession,
  addJWTToRequest,
  initSessionWithJWT,
  redirectToEntryPoint,
);
router.get("/callback", retrieveAuthorizationCode, redirectToCallback);

module.exports = router;
