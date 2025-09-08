# URL Shortener + Logging Middleware (Node.js, JavaScript Only)

This project is a lightweight, production-style **URL Shortener service** built with **Node.js (v18+) and Express**.  
It also includes a **modular Logging Middleware** that sends request and error logs to an external logging service using Bearer authentication.  

The repo follows the specified structure for the **Backend assignment** and the **shared logging library**.  
Sensitive data is kept inside `.env` (never commit it), and commits are kept small and meaningful.  

---

## ✨ Core Features
- Generate short links for any valid `http/https` URL.  
- Optionally specify custom shortcodes and validity duration (in minutes).  
- Redirect (302) by shortcode; return **410 Gone** once expired.  
- Statistics endpoint provides: total clicks, timestamped click history, referrer, and approximate geo.  
- Self-contained **logging module**: `requestLogger`, `errorLogger`, and `logger.log(...)`.  
- `.gitignore` excludes both `node_modules/` and `.env`.  

---

## 🗂 Project Structure
```
<ROLL_NO>/
├─ .gitignore
├─ Logging Middleware/
│  ├─ package.json
│  └─ index.js
└─ Backend Test Submission/
   ├─ package.json
   ├─ .env.example
   └─ src/
      ├─ server.js
      ├─ routes.js
      ├─ store.js
      └─ utils.js
```

- **Logging Middleware/** → A standalone, reusable CommonJS package (no build required).  
- **Backend Test Submission/** → Express API that consumes the middleware.  

---

## ✅ Requirements
- Node.js **v18 or later** (uses built-in `fetch`).  
- cURL or API testing tool (Postman / Insomnia).  
- Git (optional, for commits/pushing to repo).  

---

## 🔐 Environment Setup
Copy `.env.example` → `.env` and configure values:  

```env
PORT=3000
HOST_BASE_URL=http://localhost:3000
LOG_BASE_URL=http://20.244.56.144
LOG_TOKEN=Bearer <YOUR_ACCESS_TOKEN>
```

- `HOST_BASE_URL` → used in responses to build the returned `shortLink`.  
- `LOG_BASE_URL` + `LOG_TOKEN` → configure connection to the external log collector.  
- `.env` is excluded via `.gitignore`.  

---

## 🚀 Getting Started
```bash
# move to backend folder
cd "Backend Test Submission"

# install dependencies
npm install

# copy env and add token
cp .env.example .env
# open .env and paste actual Bearer token for LOG_TOKEN

# run the service
npm start
# server will be running at: http://localhost:3000
```

> The logging middleware is plain JavaScript (CommonJS). No build process is needed.  

---

## 🔌 API Endpoints

### 1) Create Short URL  
**POST /shorturls**  

Request Body:
```json
{
  "url": "https://example.com/path?x=1",
  "validity": 30,
  "shortcode": "custom1"
}
```

- `url` *(required)* → must be a valid http/https URL.  
- `validity` *(optional)* → duration in minutes (default: 30).  
- `shortcode` *(optional)* → alphanumeric Base62 (a–z, A–Z, 0–9). If omitted, system auto-generates a 6-character code.  

**Response (201 Created):**
```json
{
  "shortLink": "http://localhost:3000/abcd1A",
  "expiry": "2025-01-01T00:30:00.000Z"
}
```

**Error Cases**  
- `400` → invalid URL / bad shortcode.  
- `409` → shortcode already exists.  

---

### 2) Redirect by Shortcode  
**GET /:shortcode**  

- Redirects with `302` and `Location: <originalUrl>`.  
- Records a click.  

Errors:  
- `404` → shortcode not found.  
- `410` → shortcode expired.  

---

### 3) Get Short URL Stats  
**GET /shorturls/:shortcode**  

**Response (200 OK):**
```json
{
  "totalClicks": 3,
  "originalUrl": "https://example.com/path?x=1",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "expiry": "2025-01-01T00:30:00.000Z",
  "clicks": [
    {
      "timestamp": "2025-01-01T00:05:00.000Z",
      "referrer": "https://google.com",
      "geo": "India"
    }
  ]
}
```

Error:  
- `404` → shortcode not found.  

---

## 🧪 Example cURL Commands

```bash
# Auto-generate shortcode (default 30 min expiry)
curl -s -X POST http://localhost:3000/shorturls      -H "Content-Type: application/json"      -d '{"url":"https://google.com"}'

# With validity + custom shortcode
curl -s -X POST http://localhost:3000/shorturls      -H "Content-Type: application/json"      -d '{"url":"https://example.com","validity":1,"shortcode":"abcd1"}'

# Redirect (observe 302 and Location header)
curl -i http://localhost:3000/abcd1

# Stats
curl -s http://localhost:3000/shorturls/abcd1

# Invalid URL
curl -i -X POST http://localhost:3000/shorturls      -H "Content-Type: application/json"      -d '{"url":"not-a-url"}'

# Collision
curl -i -X POST http://localhost:3000/shorturls      -H "Content-Type: application/json"      -d '{"url":"https://example.com","shortcode":"abcd1"}'

# Expired (after > validity minutes)
curl -i http://localhost:3000/abcd1
```

---

## 📜 Logging Details

- **Automatic Logging**
  - `requestLogger` → `INFO` logs for each request.  
  - `errorLogger` → `ERROR` logs with route/method info.  

- **Manual Logging**
  - Short URL creation → `INFO` (shortcode, expiry).  
  - Redirects → `INFO` (shortcode).  
  - Stats retrieval → `INFO`.  
  - Collisions/Expiry → `WARN`.  

**Log Transmission**  
- Logs POSTed to `${LOG_BASE_URL}/log` with `Authorization: Bearer <token>`.  
- 2-second timeout.  
- Fire-and-forget (logging failures never break API).  

**Log Payload:**
```json
{
  "stack": "backend",
  "level": "INFO | WARN | ERROR | DEBUG",
  "package": "url-shortener",
  "message": "string",
  "meta": { "context": "details" }
}
```
