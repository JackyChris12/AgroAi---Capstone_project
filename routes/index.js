const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const axios = require("axios");

// Home page
router.get("/", (req, res) => {
  res.render("index");
});

//login route
router.get("/login",(req,res)=>{
  res.render("login")
})

//Register route
router.get("/register",(req,res)=>{
  res.render("register")
})

// Diagnosis page (GET)
router.get("/diagnosis", (req, res) => {
  res.render("diagnosis", { response: null });
});

// Diagnosis form submission (POST)
router.post("/diagnose", upload.single("image"), async (req, res) => {
  const question = req.body.question;

  try {
    const response = await axios.post(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    model: "mistralai/mistral-7b-instruct:free",  // ✅ Valid model ID
    messages: [
      { role: "system", content: "You are an expert agricultural assistant." },
      { role: "user", content: question },
    ],
  },

      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`, // Make sure this matches your .env key
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.render("diagnosis", { response: reply });

  } catch (error) {
    console.error("❌ OpenRouter Error:", error.response?.data || error.message);
    res.render("diagnosis", {
      response: "Sorry, something went wrong. Please try again later.",
    });
  }
});

module.exports = router;
