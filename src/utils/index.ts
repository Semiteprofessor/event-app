// src/utils/getBlurDataURL.ts
import { Buffer } from "node:buffer";

export const getBlurDataURL = async (url: string): Promise<string | null> => {
  if (!url) return null;

  const prefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
  const suffix = url.split(prefix)[1];

  if (!suffix) throw new Error("Invalid Cloudinary URL provided");

  const blurUrl = `${prefix}w_100,e_blur:5000,q_auto,f_auto/${suffix}`;
  const response = await fetch(blurUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch blurred image: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return `data:image/png;base64,${base64}`;
};
