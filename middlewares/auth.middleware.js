const { verifyAuthToken } = require("../utils/auth.utils");
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const authorizationParts = authorization.split(" ");

    if (authorizationParts.length !== 2 || authorizationParts[0] !== "Bearer") {
      return res.status(401).json({ error: "Invalid authorization format" });
    }

    const authToken = authorizationParts[1];

    try {
      const user = verifyAuthToken(authToken);
      req.user = user;
      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: "Token expired" });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid token" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = auth;
