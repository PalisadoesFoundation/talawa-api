import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cors from "cors";
import requestLogger from "morgan";
import i18n from "i18n";
import { appConfig } from "./config";
import { requestContext, requestTracing, stream } from "./libraries";
import { express as voyagerMiddleware } from "graphql-voyager/middleware";
import path from "path";
//@ts-ignore
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

const app = express();

app.use(requestTracing.middleware());

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50000,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

const corsOptions: cors.CorsOptions = {
  origin: (origin, next) => {
    if (process.env.NODE_ENV === "development") {
      next(null, true);
      return;
    } else if (process.env.NODE_ENV === "production") {
      const talawaAdmin = process.env.TALAWA_ADMIN_URL;
      if (origin === talawaAdmin) {
        next(null, true);
        return;
      }
    }

    next(new Error("Unauthorized"));
  },
};

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
app.use(apiLimiter);
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  })
);
app.use(mongoSanitize());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(graphqlUploadExpress());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Fix added to stream
app.use(
  requestLogger(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    {
      stream: stream,
    }
  )
);

app.use("/images", express.static(path.join(__dirname, "./../images")));
app.use("/videos", express.static(path.join(__dirname, "./../videos")));

app.use(requestContext.middleware());

if (process.env.NODE_ENV !== "production")
  app.use("/voyager", voyagerMiddleware({ endpointUrl: "/graphql" }));

app.get("/", (req, res) =>
  res.json({
    "talawa-version": "v1",
    status: "healthy",
  })
);

export default app;
