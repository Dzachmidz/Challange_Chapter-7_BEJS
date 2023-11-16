require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const Sentry = require("@sentry/node");
const { PORT = 3000, SENTRY_DSN, ENV } = process.env;

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  environment: ENV,
});

app.use(morgan("dev"));
app.use(express.json());
app.set("view engine", "ejs");

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.get("/", (req, res) => {
  return res.json({
    status: true,
    message: "Hello World!",
    error: null,
    data: null,
  });
});

app.get('/', (req, res, next)=>{
    res.render('templates/activation-email', { name: 'Fahmi', url: 'https://google.com'})
})
const authRouter = require("./routes/auth.routes");
app.use("/api/v1/auth", authRouter);

// The error handler must be registered before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// 404
app.use((req, res, next) => {
  res.status(404).json({
    status: false,
    message: "Not Found",
    error: null,
    data: null,
  });
});

// 500
app.use((err, req, res, next) => {
  res.status(500).json({
    status: false,
    message: "Internal Server Error",
    error: err.message,
    data: null,
  });
});

app.listen(PORT, () => console.log("Listening on port", PORT));
