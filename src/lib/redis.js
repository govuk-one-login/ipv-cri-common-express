module.exports = function getRedisConfig({ SESSION_URL, PORT } = {}) {
  if (!SESSION_URL) {
    return {};
  }

  const host = SESSION_URL;
  const port = PORT;
  const scheme = "redis";

  return {
    connectionString: `${scheme}://${host}:${port}`,
    retry_strategy: function (options) {
      if (options.total_retry_time > 1000 * 60 * 60) {
        throw new Error("Retry time exhausted");
      }
      if (options.attempt > 10) {
        throw new Error("Attempts exhausted");
      }

      return Math.min(options.attempt * 100, 3000);
    },
  };
};
