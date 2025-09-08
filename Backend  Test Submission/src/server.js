const express = require("express");
const dotenv = require("dotenv");

// load environment variables
dotenv.config();

const { Logger, requestLogger, errorLogger } = require("../../Logging Middleware/index.js");
const routes = require("./routes");

const app = express();

// middleware to parse incoming JSON requests
app.use(express.json());

// initialize logger with credentials from environment variables
const logger = new Logger({
  baseUrl: process.env.LOG_BASE_URL,
  token: process.env.LOG_TOKEN,
});

// attach request logging
app.use(requestLogger(logger, "url-shortener"));

// set up server port and base url
const port = process.env.PORT || 3000;
const hostBase = process.env.HOST_BASE_URL ?? `http://localhost:${port}`;

// mount application routes
app.use("/", routes(logger, hostBase));

// error logging middleware (should be after routes)
app.use(errorLogger(logger, "url-shortener"));

// start the server
app.listen(port, () => {
  console.log(`URL Shortener is live at ${hostBase}`);
});
