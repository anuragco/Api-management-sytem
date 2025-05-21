const pool = require('../../Config/Db');
const {logApiUsage} = require('../Utils/apislogger');


async function maccheck(req, res, next) {
  const registrationNumber = req.headers['registration-number'];
  console.log('Registration Number:', registrationNumber);
  const macAddress = req.headers['mac-address'];
  console.log('MAC Address:', macAddress);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  if (!macAddress) {
    await logApiUsage(req, '/api/v3/modal/ai', 'POST', req.body, { error: "Missing registration number" }, 400);
    return res.status(400).json({ error: 'Missing MAC address' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE registration_number = ?',
      [macAddress]
    );

    if (rows.length === 0) {
      await logApiUsage(req, '/api/v4/modal/ai', 'POST', req.body, { error: "Not Authorized" }, 401);
      return res.status(404).json({ error: 'Not Authorized' });
    }

    const user = rows[0];

    if (user.api_used >= user.api_limit) {
      await logApiUsage(req, '/api/v4/modal/ai', 'POST', req.body, { error: "Plan expired." }, 403);
      return res.status(403).json({ error: 'API limit reached. Plan expired.' });
    }

    // Attach user to request for use in next handler
    req.user = user;

    next();
  } catch (err) {
    console.error('Error in API access middleware:', err);
    await logApiUsage(req, '/api/v4/modal/ai', 'POST', req.body, { error: "Internal server error" }, 500);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports = maccheck;