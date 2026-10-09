const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 5173;
const ACCESS_CODE = process.env.ACCESS_CODE || "dev-week-code";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "pitchline_session";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const ROOT = __dirname;
const TIPS_PATH = path.join(ROOT, "data", "tips.json");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser(SESSION_SECRET));

function codeFingerprint() {
  return crypto.createHmac("sha256", SESSION_SECRET).update(String(ACCESS_CODE)).digest("hex");
}

function isAuthed(req) {
  const token = req.signedCookies[COOKIE_NAME];
  return Boolean(token && token === codeFingerprint());
}

function requireAuthPage(req, res, next) {
  if (isAuthed(req)) return next();
  const nextUrl = req.originalUrl || "/tips.html";
  return res.redirect(`/unlock.html?next=${encodeURIComponent(nextUrl)}`);
}

function requireAuthApi(req, res, next) {
  if (isAuthed(req)) return next();
  return res.status(401).json({ error: "unauthorized" });
}

function sendHtml(res, file) {
  res.sendFile(path.join(ROOT, file));
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

app.use("/css", express.static(path.join(ROOT, "css")));
app.use("/js", express.static(path.join(ROOT, "js")));

app.get("/api/session", (req, res) => {
  res.json({ authenticated: isAuthed(req) });
});

app.post("/api/unlock", (req, res) => {
  const code = String(req.body?.code || "").trim();
  if (!code || !timingSafeEqualString(code, ACCESS_CODE)) {
    return res.status(401).json({ error: "invalid_code" });
  }

  res.cookie(COOKIE_NAME, codeFingerprint(), {
    httpOnly: true,
    signed: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.RENDER),
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });

  return res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  return res.json({ ok: true });
});

app.get("/api/tips", requireAuthApi, (req, res) => {
  fs.readFile(TIPS_PATH, "utf8", (err, raw) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "tips_unavailable" });
    }
    res.type("application/json").send(raw);
  });
});

app.get("/", (req, res) => sendHtml(res, "index.html"));
app.get("/index.html", (req, res) => sendHtml(res, "index.html"));
app.get("/about.html", (req, res) => sendHtml(res, "about.html"));
app.get("/unlock.html", (req, res) => sendHtml(res, "unlock.html"));
app.get("/404.html", (req, res) => sendHtml(res, "404.html"));

app.get("/tips.html", requireAuthPage, (req, res) => sendHtml(res, "tips.html"));
app.get("/tip.html", requireAuthPage, (req, res) => sendHtml(res, "tip.html"));

app.use((req, res) => {
  res.status(404);
  sendHtml(res, "404.html");
});

app.listen(PORT, () => {
  console.log(`Pitchline listening on http://localhost:${PORT}`);
  if (!process.env.ACCESS_CODE) {
    console.warn("ACCESS_CODE not set — using default dev-week-code");
  }
});
