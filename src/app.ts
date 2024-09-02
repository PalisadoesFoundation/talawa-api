/* eslint-disable @typescript-eslint/no-require-imports */
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import { express as voyagerMiddleware } from "graphql-voyager/middleware";
import helmet from "helmet";
import i18n from "i18n";
import requestLogger from "morgan";
import path from "path";
import { appConfig } from "./config";
import { requestContext, requestTracing, stream } from "./libraries";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

const app = express();

// Middleware for tracing requests
app.use(requestTracing.middleware());

// Initialize i18n for internationalization
app.use(i18n.init);

// Rate limiting middleware to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 50000, // limit each IP to 50000 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(apiLimiter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const corsOptions: cors.CorsOptions = {
  origin: (origin, next) => {
    if (process.env.NODE_ENV === "development") {
      next(null, true); // Allow all origins in development
      return;
    } else if (process.env.NODE_ENV === "production") {
      const talawaAdmin = process.env.TALAWA_ADMIN_URL;
      if (origin === talawaAdmin) {
        next(null, true); // Allow only specific origin in production
        return;
      }
    }
    next(new Error("Unauthorized")); // Reject other origins
  },
};

// Configure i18n settings
i18n.configure({
  directory: `${__dirname}/../locales`,
  staticCatalog: {
    en: require("../locales/en.json"),
    hi: require("../locales/hi.json"),
    zh: require("../locales/zh.json"),
    sp: require("../locales/sp.json"),
    fr: require("../locales/fr.json"),
  },
  queryParameter: "lang",
  defaultLocale: appConfig.defaultLocale,
  locales: appConfig.supportedLocales,
  autoReload: process.env.NODE_ENV !== "production",
  updateFiles: process.env.NODE_ENV !== "production",
  syncFiles: process.env.NODE_ENV !== "production",
});
app.use(i18n.init);

// Helmet middleware for security headers
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false, // Disable CSP in development
  }),
);

// Sanitize data to prevent MongoDB operator injection
app.use(mongoSanitize());
app.use(cors());

// Serve static files with Cross-Origin-Resource-Policy header set
app.use("/images", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Parse JSON requests with a size limit of 50mb
app.use(express.json({ limit: "50mb" }));

// Handle file uploads using graphql-upload
app.use(graphqlUploadExpress());

// Parse URL-encoded requests with a size limit of 50mb
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logging middleware using Morgan
app.use(
  requestLogger(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    {
      stream: stream, // Stream logs to a defined stream (e.g., file, console)
    },
  ),
);

// Serve static files for images and videos
app.use("/images", express.static(path.join(__dirname, "./../images")));
app.use("/videos", express.static(path.join(__dirname, "./../videos")));

// Middleware for managing request context (e.g., user session)
app.use(requestContext.middleware());

// Enable GraphQL Voyager visualization in development
if (process.env.NODE_ENV !== "production") {
  app.use("/voyager", voyagerMiddleware({ endpointUrl: "/graphql" }));
}

// Endpoint to check the health status of the application
app.get("/", (req, res) =>
  res.json({
    "talawa-version": "v1",
    status: "healthy",
  }),
);

export default app;
