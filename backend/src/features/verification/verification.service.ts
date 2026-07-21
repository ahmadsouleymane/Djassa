import { UserRepository } from "../users/user.repository.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { sendEmail, kycSoumisAdminEmailHtml, kycApprouveVendeurEmailHtml, kycRejeteVendeurEmailHtml } from "../../shared/email/index.js";
import { config } from "../../shared/config/index.js";

const userRepo = new UserRepository();

export const VerificationService = {
  async submit(userId: string, rectoUrl: string, versoUrl: string, selfieUrl: string) {
    const updated = await userRepo.update(userId, {
      sellerVerificationStatus: "en_attente",
      sellerVerificationRectoUrl: rectoUrl,
      sellerVerificationVersoUrl: versoUrl,
      sellerVerificationSelfieUrl: selfieUrl,
      sellerVerificationReason: null,
    });

    // Notifier les admins (fire-and-forget)
    const user = await userRepo.findById(userId);
    if (user && config.adminEmails.length > 0) {
      sendEmail(
        config.adminEmails,
        "Nouvelle vérification KYC en attente",
        kycSoumisAdminEmailHtml({ vendorEmail: user.email, vendorId: userId }),
      );
    }

    return updated;
  },

  async status(userId: string) {
    const user = await userRepo.findById(userId);
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
    return userRepo.findByVerificationStatus("en_attente");
  },

  async approve(userId: string) {
    const updated = await userRepo.update(userId, { sellerVerificationStatus: "approuvee", sellerVerificationReason: null });

    // Notifier le vendeur (fire-and-forget)
    const user = await userRepo.findById(userId);
    if (user) {
      sendEmail(
        user.email,
        "Vérification validée — tu peux vendre sur Djassa",
        kycApprouveVendeurEmailHtml({ vendorName: user.email.split("@")[0] }),
      );
    }

    return updated;
  },

  async reject(userId: string, reason: string) {
    const updated = await userRepo.update(userId, { sellerVerificationStatus: "rejetee", sellerVerificationReason: reason });

    // Notifier le vendeur (fire-and-forget)
    const user = await userRepo.findById(userId);
    if (user) {
      sendEmail(
        user.email,
        "Vérification à corriger",
        kycRejeteVendeurEmailHtml({ vendorName: user.email.split("@")[0], reason }),
      );
    }

    return updated;
  },
};
