import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(
    token,
    process.env.JWT_SECRET || "dev-secret-change-me",
    (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    }
  );
}

export function authenticateOptional(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "dev-secret-change-me",
    (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    }
  );
}

export function getUserRole(req) {
  return req.user && req.user.role ? req.user.role : "member";
}
