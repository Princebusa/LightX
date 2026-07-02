import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET as string,
    ) as { userId: string };

    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
