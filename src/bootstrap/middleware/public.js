import { resolve, dirname } from "node:path";
import express from "express";
import { getConfig } from "../lib/config.js";
import { fileURLToPath } from "node:url";

export const publicAssetsMiddleware = ({
  urls = { public: "/public", publicImages: "/public/images" },
  publicDirs = ["public"],
  publicImagesDirs = ["assets/images"],
  public: publicOptions = { maxAge: 86400000 },
  hmpoComponentsDir,
} = {}) => {
  const router = express.Router();

  publicDirs.forEach((dir) =>
    router.use(
      urls.public,
      express.static(resolve(getConfig("APP_ROOT"), dir), publicOptions),
    ),
  );

  publicImagesDirs.forEach((dir) =>
    router.use(
      urls.publicImages,
      express.static(resolve(getConfig("APP_ROOT"), dir), publicOptions),
    ),
  );

  if (hmpoComponentsDir) {
    router.use(
      urls.publicImages,
      express.static(
        resolve(hmpoComponentsDir, "assets", "images"),
        publicOptions,
      ),
    );
  }

  router.use(
    urls.public,
    express.static(
      resolve(
        dirname(fileURLToPath(import.meta.resolve("govuk-frontend"))),
        "assets",
      ),
      publicOptions,
    ),
  );

  return router;
};

export const notFoundFallback = ({ urls: { public: pub, publicImages } }) => {
  const router = express.Router();
  router.use(pub, (_req, res) => res.sendStatus(404));
  router.use(publicImages, (_req, res) => res.sendStatus(404));
  return router;
};
