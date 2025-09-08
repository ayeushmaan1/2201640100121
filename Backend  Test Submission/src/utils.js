function isValidUrl(s) { try { new URL(s); return true; } catch { return false; } }
function nowIso() { return new Date().toISOString(); }
function plusMinutes(mins) { const d = new Date(); d.setMinutes(d.getMinutes() + Number(mins || 0)); return d.toISOString(); }
const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function genCode(len = 6) { let out = ""; for (let i = 0; i < len; i++) out += ALPHA[Math.floor(Math.random()*ALPHA.length)]; return out; }
module.exports = { isValidUrl, nowIso, plusMinutes, genCode };