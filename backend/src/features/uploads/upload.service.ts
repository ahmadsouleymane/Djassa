import { v2 as cloudinary } from "cloudinary";
import { config } from "../../shared/config/index.js";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export function signUpload(userId: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `djassa/products/${userId}`;
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, config.cloudinary.apiSecret);

  return {
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    timestamp,
    signature,
    folder,
  };
}
