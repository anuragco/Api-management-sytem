const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');   
const bodyParser = require('body-parser');
const mysql2 = require('mysql2');
const app = express();
const port = process.env.PORT ;
const pool = require('../Config/Db');
const crypto = require('crypto');
const checkApiAccess = require('./Middleware/checkApiAccess');
const {logApiUsage} = require('./Utils/apislogger');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const API_KEY = process.env.GEMINI_API_KEY;
console.log("API_KEY", API_KEY);
const MODEL_NAME = "gemini-1.5-pro-002";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

app.get('/', (req, res) => {
    const name = process.env.NAME;
    res.send('Hello World' + name);
});


function generateApiKey() {
  return crypto.randomBytes(8).toString('hex');
}

app.post('/api/users/create', (req, res) => {
  const { name, reg_no, api_limit } = req.body;

  if (!name || !reg_no) {
    return res.status(400).json({ success: false, message: 'Name and Reg No are required' });
  }

  const apiKey = 'sg-'+generateApiKey();
  const limit = api_limit || 50;

  pool.query(
    'INSERT INTO users (name, registration_number, api_key, api_limit) VALUES (?, ?, ?, ?)',
    [name, reg_no, apiKey, limit],
    (error, results) => {
      if (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Reg No or API Key already exists' });
        }
        console.error('Error inserting user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      res.json({
        success: true,
        message: 'User created successfully',
        user_id: results.insertId,
        api_key: apiKey,
      });
    }
  );
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
        contents: [{ parts: [{ text: promptText }] }]
      }),
    });

    if (response.status === 429) {
      return { error: "Rate limited" };
    }

    const data = await response.json();
    return {
      answer: data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
    };
  } catch (err) {
    console.error("Error sending to Gemini:", err);
    return { error: "Failed to send prompt" };
  }
}

app.post('/ask-gemini', checkApiAccess, async (req, res) => {
  const now = Date.now();
  if (isRequestInProgress || now - lastRequestTime < COOLDOWN_MS) {
    logApiUsage(req, '/ask-gemini', 'POST', req.body, { error: "Cooldown in progress" }, 429);
    return res.status(429).json({ error: "Cooldown in progress. Try again later." });
  }

  isRequestInProgress = true;
  lastRequestTime = now;

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    isRequestInProgress = false;
    logApiUsage(req, '/ask-gemini', 'POST', req.body, { error: "Invalid prompt" }, 400);
    return res.status(400).json({ error: "Invalid prompt" });
  }

  const response = await sendToGemini(prompt);

  setTimeout(() => {
    isRequestInProgress = false;
  }, COOLDOWN_MS);

  if (response.error) {
    logApiUsage(req, '/ask-gemini', 'POST', req.body, { error: response.error }, 500);
    return res.status(500).json({ error: response.error });
  }

  try {
    await pool.query(
      'UPDATE users SET api_used = api_used + 1 WHERE registration_number = ?',
      [req.user.registration_number]
    );
  } catch (err) {
    console.error("Error updating api_used:", err);
  }

  const responseData = { answer: response.answer.trim() };
  logApiUsage(req, '/ask-gemini', 'POST', req.body, responseData, 200);
  res.json(responseData);
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});