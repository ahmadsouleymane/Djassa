-- Idempotence : au plus une récompense par commande ET par type (acheteur / vendeur).
DROP INDEX "ReferralReward_orderId_key";
CREATE UNIQUE INDEX "ReferralReward_orderId_kind_key" ON "ReferralReward"("orderId", "kind");
