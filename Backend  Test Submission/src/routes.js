const express = require("express");
const db = require("./store");
const { isValidUrl, nowIso, plusMinutes, genCode } = require("./utils");

function routes(logger, hostBase) {
  const r = express.Router();

  // Create Short URL
  r.post("/shorturls", async (req, res) => {
    const { url, validity, shortcode } = req.body || {};
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: "Invalid url" });
    }
    const minutes = Number.isFinite(Number(validity)) ? Number(validity) : 30;

    let code = (shortcode || "").trim();
    if (code) {
      if (!/^[a-zA-Z0-9]+$/.test(code)) return res.status(400).json({ error: "Invalid shortcode" });
      if (db.has(code)) {
        await logger.log({ stack: "backend", level: "WARN", package: "url-shortener", message: "Shortcode collision", meta: { shortcode: code }});
        return res.status(409).json({ error: "Shortcode already exists" });
      }
    } else {
      do { code = genCode(6); } while (db.has(code));
    }

    const doc = { shortcode: code, originalUrl: url, createdAt: nowIso(), expiry: plusMinutes(minutes), clicks: [] };
    db.set(code, doc);

    await logger.log({ stack: "backend", level: "INFO", package: "url-shortener", message: "Short URL created", meta: { shortcode: code, url, expiry: doc.expiry }});
    return res.status(201).json({ shortLink: `${hostBase.replace(/\/$/, "")}/${code}`, expiry: doc.expiry });
  });

  // Redirection
  r.get("/:shortcode", async (req, res) => {
    const code = req.params.shortcode;
    const doc = db.get(code);
    if (!doc) return res.status(404).json({ error: "Not found" });

    if (new Date(doc.expiry) < new Date()) {
      await logger.log({ stack: "backend", level: "WARN", package: "url-shortener", message: "Short URL expired", meta: { shortcode: code }});
      return res.status(410).json({ error: "Expired" });
    }

    doc.clicks.push({ timestamp: nowIso(), referrer: req.get("referer") || undefined, geo: "India" });
    await logger.log({ stack: "backend", level: "INFO", package: "url-shortener", message: "Redirect", meta: { shortcode: code }});
    return res.redirect(302, doc.originalUrl);
  });

  // Statistics
  r.get("/shorturls/:shortcode", async (req, res) => {
    const code = req.params.shortcode;
    const doc = db.get(code);
    if (!doc) return res.status(404).json({ error: "Not found" });

    await logger.log({ stack: "backend", level: "INFO", package: "url-shortener", message: "Stats fetched", meta: { shortcode: code }});
    return res.json({ totalClicks: doc.clicks.length, originalUrl: doc.originalUrl, createdAt: doc.createdAt, expiry: doc.expiry, clicks: doc.clicks });
  });

  return r;
}
module.exports = routes;