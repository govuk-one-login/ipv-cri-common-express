const configure = ({
  production = "production", // if production is false, detailed error messages are exposed to the client
  clientRetrySecs = 1, // Retry-After header, in seconds (0 to disable) [default 1]
  sampleInterval = 5, // sample rate, milliseconds [default 5]
  maxEventLoopDelay = !isNaN(
    parseInt(process.env.OVERLOAD_PROTECTION_MAX_EVENT_LOOP_DELAY, 10),
  )
    ? parseInt(process.env.OVERLOAD_PROTECTION_MAX_EVENT_LOOP_DELAY, 10)
    : 500, // maximum detected delay between event loop ticks [default 42]
  maxHeapUsedBytes = 0, // maximum heap used threshold (0 to disable) [default 0]
  maxRssBytes = 0, // maximum rss size threshold (0 to disable) [default 0]
  errorPropagationMode = false, // dictate behavior: take over the response
  // or propagate an error to the framework [default false]
  logging = false, // set to string for log level or function to pass data to
  logStatsOnReq = false, // set to true to log stats on every requests
} = {}) => {
  return {
    production,
    clientRetrySecs,
    sampleInterval,
    maxEventLoopDelay,
    maxHeapUsedBytes,
    maxRssBytes,
    errorPropagationMode,
    logging,
    logStatsOnReq,
  };
};

module.exports = {
  configure,
};
