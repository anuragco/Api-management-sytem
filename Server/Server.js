const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql2 = require("mysql2");
const app = express();
const port = process.env.PORT;
const pool = require("../Config/Db");
const crypto = require("crypto");
const checkApiAccess = require("./Middleware/checkApiAccess");
const { logApiUsage } = require("./Utils/apislogger");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const authenticateToken = require("./Middleware/authenticate");
const https = require('https');
const fs = require('fs');


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const options = {
  key: fs.readFileSync('./Cert/privkey.pem'),
  cert: fs.readFileSync('./Cert/cert.pem')
};

const API_KEY = process.env.GEMINI_API_KEY;
console.log("API_KEY", API_KEY);
const MODEL_NAME = "gemini-1.5-pro-002";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

app.get("/", (req, res) => {
  const name = process.env.NAME;
  res.send("Hello World" + name);
});

app.get("/api/admin/verify-token", authenticateToken, (req, res) => {
  return res.status(200).json({ success: true });
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  try {
    // Retrieve admin by email
    const [rows] = await pool.query("SELECT * FROM admin WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const admin = rows[0];

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // Generate UUID v4 token
    const token = uuidv4();

    // Store token in the database
    await pool.query("UPDATE admin SET auth_token = ? WHERE id = ?", [
      token,
      admin.id,
    ]);

    return res.status(200).json({ success: true, auth_token: token });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

function generateApiKey() {
  return crypto.randomBytes(8).toString("hex");
}

app.post("/api/users/create", authenticateToken, async (req, res) => {
  const { name, reg_no, api_limit } = req.body;

  // Validation check
  if (!name || !reg_no) {
    return res
      .status(400)
      .json({ success: false, message: "Name and Reg No are required" });
  }

  const apiKey = "sg-" + generateApiKey();
  const limit = api_limit || 50;

  try {
    // Check if registration number already exists
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE registration_number = ?",
      [reg_no]
    );

    if (existingUser.length > 0) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Registration number already exists",
        });
    }

    // Insert new user
    const [result] = await pool.query(
      "INSERT INTO users (name, registration_number, api_key, api_limit) VALUES (?, ?, ?, ?)",
      [name, reg_no, apiKey, limit]
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user_id: result.insertId,
      api_key: apiKey,
    });
  } catch (error) {
    console.error("Error inserting user:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, registration_number, api_limit, api_used FROM users"
    );

    res.json({ success: true, users: rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

let isRequestInProgress = false;
let lastRequestTime = 0;
const COOLDOWN_MS = 5000;

async function sendToGemini(promptText) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
      }),
    });

    if (response.status === 429) {
      return { error: "Rate limited" };
    }

    const data = await response.json();
    return {
      answer: data?.candidates?.[0]?.content?.parts?.[0]?.text || "",
    };
  } catch (err) {
    console.error("Error sending to Gemini:", err);
    return { error: "Failed to send prompt" };
  }
}

app.post("/ask-gemini", checkApiAccess, async (req, res) => {
  const now = Date.now();
  if (isRequestInProgress || now - lastRequestTime < COOLDOWN_MS) {
    logApiUsage(
      req,
      "/ask-gemini",
      "POST",
      req.body,
      { error: "Cooldown in progress" },
      429
    );
    return res
      .status(429)
      .json({ error: "Cooldown in progress. Try again later." });
  }

  isRequestInProgress = true;
  lastRequestTime = now;

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    isRequestInProgress = false;
    logApiUsage(
      req,
      "/ask-gemini",
      "POST",
      req.body,
      { error: "Invalid prompt" },
      400
    );
    return res.status(400).json({ error: "Invalid prompt" });
  }

  const promptengineered = `Important: You are given a Questions along with 4 Options. You have to answer the question with the correct option name. Do not add any other text. Question: ${prompt}`;
  const response = await sendToGemini(promptengineered);

  setTimeout(() => {
    isRequestInProgress = false;
  }, COOLDOWN_MS);

  if (response.error) {
    logApiUsage(
      req,
      "/ask-gemini",
      "POST",
      req.body,
      { error: response.error },
      500
    );
    return res.status(500).json({ error: response.error });
  }

  try {
    await pool.query(
      "UPDATE users SET api_used = api_used + 1 WHERE registration_number = ?",
      [req.user.registration_number]
    );
  } catch (err) {
    console.error("Error updating api_used:", err);
  }

  const responseData = { answer: response.answer.trim() };
  logApiUsage(req, "/ask-gemini", "POST", req.body, responseData, 200);
  res.json(responseData);
});

app.post("/api/users/increase-quota", authenticateToken, async (req, res) => {
  const { user_id, increase_amount } = req.body;

  // Validate input
  const amount = parseInt(increase_amount, 10);
  if (!user_id || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message:
        "Valid registration number and a positive increase amount are required",
    });
  }

  try {
    // Check if the user exists
    const [users] = await pool.query(
      "SELECT api_limit FROM users WHERE id = ?",
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User with the provided registration number not found",
      });
    }

    // Update the user's API limit
    await pool.query(
      "UPDATE users SET api_limit = api_limit + ? WHERE id = ?",
      [amount, user_id]
    );

    return res.status(200).json({
      success: true,
      message: `API quota increased by ${amount} for registration number ${user_id}`,
    });
  } catch (error) {
    console.error("Error increasing API quota:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


app.get('/api/analytics',authenticateToken, async (req, res) => {
  try {
    // 1️⃣ Define all four queries
    const userCountQ = pool.query(
      'SELECT COUNT(*) AS total_users FROM users'
    );
    const requestCountQ = pool.query(
      'SELECT COUNT(*) AS total_requests FROM api_usage_logs'
    );
    const rateQ = pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(response_status BETWEEN 200 AND 299) AS success,
        SUM(response_status >= 400)        AS fail
      FROM api_usage_logs
    `);
   const errorsQ = pool.query(`
  SELECT
    id               AS id,        -- grab the primary key
    used_at          AS timestamp,
    response_payload AS error,
    response_status  AS code,
    endpoint
  FROM api_usage_logs
  WHERE response_status >= 400
  ORDER BY used_at DESC
  LIMIT 5
`);



    // 2️⃣ Execute them in parallel
    const [
      [usersRows],
      [requestsRows],
      [rateRows],
      [errorsRows]
    ] = await Promise.all([userCountQ, requestCountQ, rateQ, errorsQ]);

    // 3️⃣ Extract each metric from the first row of each result
    const total_users    = usersRows[0]?.total_users    || 0;
    const total_requests = requestsRows[0]?.total_requests || 0;
    const { total = 0, success = 0, fail = 0 } = rateRows[0] || {};
    const recent_errors  = errorsRows;

    // 4️⃣ Compute percentages
    const successRate = total > 0
      ? ((success / total) * 100).toFixed(1)
      : '0.0';
    const failRate = total > 0
      ? ((fail / total) * 100).toFixed(1)
      : '0.0';

    // 5️⃣ Return the full analytics payload
    res.json({
      total_users,
      total_requests,
      api_success_rate: {
        successful: `${successRate}%`,
        failed:     `${failRate}%`
      },
      recent_errors
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
