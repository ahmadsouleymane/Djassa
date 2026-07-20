import { VerificationRepository } from "./verification.repository.js";
import { NotFoundError, ConflictError } from "../../shared/errors/index.js";

const repo = new VerificationRepository();

export const VerificationService = {
  async submit(userId: string, urls: { rectoUrl: string; versoUrl: string; selfieUrl: string }) {
    const current = await repo.findByUserId(userId);
    if (!current) throw new NotFoundError("Utilisateur");
    if (current.sellerVerificationStatus === "en_attente") {
      throw new ConflictError("Un dossier de vérification est déjà en cours d'examen");
    }
    return repo.submit(userId, urls);
  },

  async status(userId: string) {
    const user = await repo.findByUserId(userId);
    if (!user) throw new NotFoundError("Utilisateur");
    return {
      status: user.sellerVerificationStatus,
      rectoUrl: user.sellerVerificationRectoUrl,
      versoUrl: user.sellerVerificationVersoUrl,
      selfieUrl: user.sellerVerificationSelfieUrl,
      reason: user.sellerVerificationReason,
    };
  },

  listPending() {
    return repo.listPending();
  },

  async approve(userId: string) {
    const user = await repo.findByUserId(userId);
    if (!user) throw new NotFoundError("Utilisateur");
    return repo.approve(userId);
  },

  async reject(userId: string, reason: string) {
    const user = await repo.findByUserId(userId);
    if (!user) throw new NotFoundError("Utilisateur");
    return repo.reject(userId, reason);
  },
};
