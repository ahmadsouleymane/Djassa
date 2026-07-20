import { UserRepository } from "../users/user.repository.js";
import { NotFoundError } from "../../shared/errors/index.js";

const userRepo = new UserRepository();

export const VerificationService = {
  async submit(userId: string, documentUrl: string) {
    return userRepo.update(userId, {
      sellerVerificationStatus: "en_attente",
      sellerVerificationRectoUrl: documentUrl,
      sellerVerificationReason: null,
    });
  },

  async status(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("Utilisateur");
    return {
      status: user.sellerVerificationStatus,
      documentUrl: user.sellerVerificationRectoUrl,
      reason: user.sellerVerificationReason,
    };
  },

  listPending() {
    return userRepo.findByVerificationStatus("en_attente");
  },

  approve(userId: string) {
    return userRepo.update(userId, { sellerVerificationStatus: "approuvee", sellerVerificationReason: null });
  },

  reject(userId: string, reason: string) {
    return userRepo.update(userId, { sellerVerificationStatus: "rejetee", sellerVerificationReason: reason });
  },
};
