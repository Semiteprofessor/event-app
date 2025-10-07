import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const PUBLIC_KEY = process.env.PUBLIC_KEY!;

export function signJwt(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
    ...options,
  });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET) as any;
}

interface DecodedUser {
  id: string;
  email: string;
}

export const getUserFromToken = (req: Request): DecodedUser | null => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as DecodedUser;
  } catch {
    return null;
  }
};
