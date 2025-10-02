import jwt from "jsonwebtoken";

const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY!;
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY!;

export function signJwt(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "HS256",
    expiresIn: "15m",
    ...options,
  });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, PRIVATE_KEY) as any;
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
