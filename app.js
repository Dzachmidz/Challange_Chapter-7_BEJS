require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const Sentry = require("@sentry/node");
const {
  notFoundHandler,
  internalServerErrorHandler,
} = require("./middlewares/auth.middlewares");
const htmlRouter = require("./routes/html.routes");
const authRouter = require("./routes/auth.routes");
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
  environmen: ENV,
});

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// config websocket
const server = require("http").createServer(app);
const io = require("socket.io")(server);


io.on('connection', (client) => {
  console.log('new user connected!');

  // Tambahkan username ke dalam objek client
  client.on('add user', (username) => {
      client.username = username;
  });

  // subscribe topik 'chat message'
  client.on('chat message', msg => {
      // Kirim pesan beserta nama pengguna
      io.emit('chat message', `${client.username}: ${msg}`);
  });
});


app.get("/", (req, res) => {
  return res.json({
    status: true,
    message: "Hello World!",
    error: null,
    data: null,
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/", authRouter);
app.use("/api", htmlRouter);

app.use(Sentry.Handlers.errorHandler());
app.use(notFoundHandler);
app.use(internalServerErrorHandler);

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
