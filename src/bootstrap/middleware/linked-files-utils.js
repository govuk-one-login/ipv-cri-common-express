import { getRedisClient } from "../lib/redis-client.js";
import { randomUUID } from "node:crypto";
import { getLogger } from "../lib/logger.js";
import { PACKAGE_NAME } from "../../lib/constants.js";

const logger = getLogger(PACKAGE_NAME);

// redis records are stored as the uuid prefixed with this:
const PREFIX = "file:";

// the value is prefixed with J:, B:, or S: to indicate JSON, Buffer, or String
function stringify(data) {
  if (typeof data === "string") return "S:" + data;
  if (Buffer.isBuffer(data)) return "B:" + data.toString("base64");
  return "J:" + JSON.stringify(data);
}

function parse(data, cb) {
  try {
    let type = data.charAt(0);
    data = data.substr(2);
    if (type === "B") data = Buffer.from(data, "base64");
    if (type === "J") data = JSON.parse(data);
  } catch (e) {
    return cb(e);
  }
  cb(null, data);
}

export function add(req, ttl, data, cb) {
  let id = randomUUID();
  data = stringify(data);
  getRedisClient().setex(PREFIX + id, ttl, data, (err) => {
    if (err) return cb(err);
    req.session.linkedFiles = req.session.linkedFiles || {};
    req.session.linkedFiles[id] = true;
    logger.debug(
      { linkedFile: { id, size: data.length } },
      "Linked file added",
    );
    cb(null, id);
  });
}

// Should function should only be used when there is no access to the session to check owenership of the file
function getNoCheck(id, cb) {
  logger.debug({ linkedFile: { id } }, "Getting linked file");
  getRedisClient().get(PREFIX + id, (err, data) => {
    if (err) return cb(err);
    parse(data, cb);
  });
}

export function get(req, id, cb) {
  if (!req.session.linkedFiles?.[id]) {
    return cb(new Error("Linked file id not found " + id));
  }
  getNoCheck(id, cb);
}

export function del(req, id, cb) {
  if (!req.session.linkedFiles?.[id]) {
    return cb(new Error("Linked file id not found " + id));
  }
  logger.debug({ linkedFile: { id } }, "Linked file deleted");
  delete req.session.linkedFiles[id];
  getRedisClient().del(PREFIX + id, cb);
}
