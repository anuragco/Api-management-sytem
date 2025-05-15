const pool = require('../../Config/Db');

async function logApiUsage(req, endpoint, method, requestPayload, responsePayload, statusCode) {
  try {
    const userId = req.user?.id || null;
    const apiKey = req.headers['registration_number'] || req.user?.registration_number || 'UNKNOWN';

    await pool.query(
      `INSERT INTO api_usage_logs (
        user_id, api_key, endpoint, request_method, 
        request_payload, response_payload, response_status, 
        used_at, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        userId || 4,
        apiKey,
        endpoint,
        method,
        JSON.stringify(requestPayload),
        JSON.stringify(responsePayload),
        statusCode,
        req.ip,
        req.headers['user-agent']
      ]
    );
  } catch (err) {
    console.error("Failed to log API usage:", err);
  }
}

module.exports = { logApiUsage };
