const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config(); // Load .env variables

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(session({
  secret: 'agroai_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Use routes
const indexRoutes = require("./routes/index");
app.use("/", indexRoutes);

// Start server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
