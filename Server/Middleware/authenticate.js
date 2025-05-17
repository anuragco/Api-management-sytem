const pool = require("../../Config/Db");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const apisKey = req.headers["apis-key"];
    if (!apisKey || apisKey !== "sg-309549b5f26d4ef5") {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    const [rows] = await pool.query(
      "SELECT id, email FROM admin WHERE auth_token = ? ",
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.admin = rows[0];

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

module.exports = authenticateToken;
