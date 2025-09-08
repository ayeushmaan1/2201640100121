// Reusable logger + Express middlewares (CommonJS, Node 18+)

class Logger {
  constructor({ baseUrl, token, timeoutMs = 2000 }) {
    this.baseUrl = (baseUrl || "").replace(/\/$/, "");
    this.token = (token || "").startsWith("Bearer ") ? token : `Bearer ${token}`;
    this.timeoutMs = timeoutMs;
  }
  async log(payload) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      await fetch(`${this.baseUrl}/log`, {
        method: "POST",
        headers: {
          "Authorization": this.token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      }).catch(() => {});
    } catch (_) {
      // swallow errors
    } finally {
      clearTimeout(t);
    }
  }
}
function requestLogger(logger, pkg = "api") {
  return (req, _res, next) => {
    logger.log({
      stack: "backend",
      level: "INFO",
      package: pkg,
      message: `HTTP ${req.method} ${req.originalUrl}`,
      meta: { ip: req.ip }
    });
    next();
  };
}
function errorLogger(logger, pkg = "api") {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, _next) => {
    logger.log({
      stack: "backend",
      level: "ERROR",
      package: pkg,
      message: `Error on ${req.method} ${req.originalUrl}`,
      meta: { err: String(err) }
    });
    res.status(500).json({ error: "Internal Server Error" });
  };
}
module.exports = { Logger, requestLogger, errorLogger };