import type { Request, Response } from "express";
import { signUpload } from "./upload.service.js";

export function sign(req: Request, res: Response) {
  res.json(signUpload(req.userId!));
}
