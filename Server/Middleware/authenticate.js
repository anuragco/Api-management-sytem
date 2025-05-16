const pool = require('../../Config/Db'); 


const authenticateToken = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Check if APIs key is present (if required)
    const apisKey = req.headers['apis-key'];
    if (!apisKey || apisKey !== 'sg-309549b5f26d4ef5') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid API key' 
      });
    }

    // Query the database to find admin with this token
    const [rows] = await pool.query(
      'SELECT id, email FROM admin WHERE auth_token = ? ',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token.' 
      });
    }

    // Add the admin user data to the request object
    req.admin = rows[0];
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication.'
    });
  }
};

module.exports = authenticateToken;