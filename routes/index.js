const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // fix capital "Uploads"
const axios = require("axios");
const bcrypt = require("bcrypt");
const { isAuthenticated } = require("../middleware/auth"); // make sure this exists and exports properly

/* //restrict questions (No unrelated question)
const agricultureKeywords = [
  "crop", "pest", "fertilizer", "soil", "livestock", "plant", "disease", "weather",
  "farming", "agriculture", "harvest", "yield", "pesticide", "drought"
];

function isAgricultureQuestion(question) {
  const lowerCaseQuestion = question.toLowerCase();
  return agricultureKeywords.some(keyword => lowerCaseQuestion.includes(keyword));
}
 */
// Log all routes for debugging
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Home
router.get("/", (req, res) => {
  res.render("index", { user: req.session });
});

// Login
router.get("/login", (req, res) => {
  res.render("login", { error: null, user: req.session });
});

// Register
router.get("/register", (req, res) => {
  res.render("register", { error: null, user: req.session });
});

// Register POST
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const pool = req.app.locals.pool;

  if (!username || !email || !password) {
    return res.render("register", { error: "All fields are required", user: req.session });
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.render("register", {
        error: "Username or email already exists",
        user: req.session,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, "farmer"]
    );

    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err);
    res.render("register", { error: "Registration failed", user: req.session });
  }
});

// Login POST
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const pool = req.app.locals.pool;

  if (!username || !password) {
    return res.render("login", { error: "Please enter username and password", user: req.session });
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render("login", { error: "Invalid credentials", user: req.session });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { error: "Login failed", user: req.session });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Dashboard
router.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("index", { user: req.session });
});

router.get("/crops", isAuthenticated, (req, res) => {
  res.render("crops", { user: req.session });
});

router.get("/livestock", isAuthenticated, (req, res) => {
  res.render("livestock", { user: req.session });
});
// 🧠 Keywords for agriculture filtering
const agricultureKeywords = [
  "crop", "pest", "fertilizer", "soil", "livestock", "plant", "disease", "weather",
  "farming", "agriculture", "harvest", "yield", "pesticide", "drought"
];

// 🔍 Function to check if the question is agriculture-related
function isAgricultureQuestion(question) {
  if (!question || typeof question !== "string") return false;
  const lowerCaseQuestion = question.toLowerCase();
  return agricultureKeywords.some(keyword => lowerCaseQuestion.includes(keyword));
}


// GET Diagnosis Page
router.get("/diagnosis", (req, res) => {
  res.render("diagnosis", { response: null });
});

// POST Diagnosis Form Submission
router.post("/diagnosis", upload.single("image"), async (req, res) => {
  const question = req.body.question;

  // ✅ Block non-agriculture questions
  if (!isAgricultureQuestion(question)) {
    return res.render("diagnosis", {
      response: "❌ This assistant only answers agriculture-related questions. Please ask about farming, crops, or livestock.",
    });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",

        messages: [
          {
            role: "system",
            content: "You are an expert agricultural assistant. ONLY answer agriculture-related questions.",
          },
          { role: "user", content: question },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.render("diagnosis", { response: reply });

  } catch (error) {
    console.error("❌ OpenRouter Error:", error.response?.data || error.message);
    res.render("diagnosis", {
      response: "⚠️ Sorry, something went wrong. Please try again later.",
    });
  }
});


module.exports = router;
