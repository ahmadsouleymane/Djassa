/**
 * Templates email transactionnels Djassa
 *
 * Chaque template produit du HTML inline complet, compatible avec la
 * majorité des clients mail (Gmail, Apple Mail, Outlook).
 */

import { config } from "../config/index.js";

/* ── Palette brand (inline — pas de variables CSS en email) ────────── */
const C = {
  primary: "#00b25d",
  primaryText: "#ffffff",
  primaryDark: "#00994f",
  accentBg: "#e3faee",
  accentFg: "#00693a",
  ink: "#0b120e",
  inkSoft: "#1b241f",
  muted: "#5c655f",
  surface: "#f7faf8",
  surfaceCard: "#ffffff",
  border: "#e3e9e5",
  destructive: "#d62828",
} as const;

/* ── Helpers inline ───────────────────────────────────────────────── */

function logoUrl(): string {
  return `${config.frontendUrl}/logo-dark.svg`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ── Layout de base (header + content + footer) ───────────────────── */

function baseLayout(bodyHtml: string, previewText?: string): string {
  const preview = previewText
    ? `<table role="presentation" style="display:none;mso-hide:all;font-size:0;max-height:0;overflow:hidden;line-height:0;"><tr><td>${escapeHtml(previewText)}</td></tr></table>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Djassa</title>
</head>
<body style="margin:0;padding:0;background-color:${C.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','General Sans',sans-serif;">
  ${preview}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
         style="background-color:${C.surface};">
    <tr>
      <td align="center" style="padding:32px 0;">
        <!-- ── Card ── -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
               style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:${C.surfaceCard};border-radius:14px;overflow:hidden;
                       box-shadow:0 1px 2px rgba(6,36,22,0.06),0 10px 24px rgba(6,36,22,0.09);">

              <!-- Header brand -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="background-color:${C.ink};">
                <tr>
                  <td style="padding:28px 40px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="${logoUrl()}"
                               alt="DJASSA"
                               width="120"
                               height="auto"
                               style="display:block;border:0;outline:none;max-width:120px;"
                          />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Corps -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:40px 40px 32px;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="border-top:1px solid ${C.border};background-color:${C.surface};">
                <tr>
                  <td style="padding:24px 40px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:13px;color:${C.muted};line-height:1.5;">
                      Djassa — le marché de confiance en Côte d'Ivoire
                    </p>
                    <p style="margin:0;font-size:12px;color:${C.muted};">
                      &copy; ${new Date().getFullYear()} Djassa. Tous droits réservés.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!-- ── Fin card ── -->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Bouton CTA réutilisable ──────────────────────────────────────── */

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="background-color:${C.primary};border-radius:999px;padding:13px 32px;">
        <a href="${url}"
           style="display:inline-block;font-size:15px;font-weight:600;color:${C.primaryText};
                  text-decoration:none;line-height:1.2;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

/* ── Templates spécifiques ─────────────────────────────────────────── */

/**
 * Email de bienvenue — envoyé après inscription réussie.
 */
export function welcomeEmailHtml(input: {
  name?: string;
  email: string;
  accountType: "vendeur" | "client";
  planTier?: string;
}): string {
  const prenom = input.name ?? input.email.split("@")[0];
  const role = input.accountType === "vendeur" ? "vendeur" : "client";
  const planInfo =
    input.planTier === "pro"
      ? `<p style="margin:16px 0 0;font-size:14px;color:${C.ink};line-height:1.6;">
           ✦ Tu bénéficies du plan <strong>Pro</strong> offert pendant 2 mois —
           mets en avant tes articles et développe ta clientèle sans frais.
         </p>`
      : "";

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Bienvenue sur Djassa 👋
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(prenom)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:${C.muted};line-height:1.6;">
      Ton compte ${role} a été créé avec succès sur <strong>Djassa</strong> —
      la marketplace de confiance entre Ivoiriens.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="14" border="0"
           style="background-color:${C.accentBg};border-radius:10px;margin:20px 0;width:100%;">
      <tr>
        <td>
          <p style="margin:0;font-size:13px;color:${C.accentFg};line-height:1.5;">
            ✅ Compte : <strong>${escapeHtml(input.email)}</strong><br/>
            ✅ Type : <strong>${role === "vendeur" ? "Vendeur" : "Client"}</strong>
          </p>
          ${planInfo}
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 4px;font-size:14px;color:${C.muted};line-height:1.6;">
      ${input.accountType === "vendeur"
        ? "Commence dès maintenant à publier tes articles et à recevoir des commandes."
        : "Explore le marché et trouve les meilleurs articles près de chez toi."}
    </p>

    ${ctaButton(
      config.frontendUrl,
      input.accountType === "vendeur" ? "Publier un article" : "Découvrir le marché"
    )}

    <p style="margin:8px 0 0;font-size:13px;color:${C.muted};line-height:1.5;">
      Besoin d'aide ? Écris-nous à <a href="mailto:support@djassa.net"
      style="color:${C.primary};text-decoration:underline;">support@djassa.net</a>.
    </p>
  `;

  return baseLayout(body, "Bienvenue sur Djassa — ton compte est prêt !");
}

/**
 * Email de réinitialisation de mot de passe.
 */
export function passwordResetEmailHtml(resetUrl: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Réinitialisation de mot de passe
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Tu as demandé à réinitialiser ton mot de passe Djassa.
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.5;">
      Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      Ce lien expire dans <strong>1 heure</strong>.
    </p>

    ${ctaButton(resetUrl, "Réinitialiser mon mot de passe")}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;">
      <tr>
        <td style="font-size:12px;color:${C.muted};line-height:1.5;">
          <strong>🔒 Tu n'es pas à l'origine de cette demande ?</strong><br/>
          Ignore simplement cet email. Ton mot de passe actuel reste inchangé
          et personne ne peut accéder à ton compte sans celui-ci.
        </td>
      </tr>
    </table>

    <hr style="margin:24px 0;border:none;border-top:1px solid ${C.border};" />

    <p style="margin:0;font-size:13px;color:${C.muted};line-height:1.5;">
      Si le bouton ne fonctionne pas, copie et colle ce lien dans ton navigateur :
      <br/>
      <a href="${resetUrl}" style="color:${C.primary};font-size:12px;word-break:break-all;">${resetUrl}</a>
    </p>
  `;

  return baseLayout(body, "Réinitialise ton mot de passe Djassa");
}

/**
 * Confirmation de changement de mot de passe.
 */
export function passwordChangedEmailHtml(): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Mot de passe modifié ✅
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Ton mot de passe Djassa a bien été changé.
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Si tu es à l'origine de cette modification, tu peux ignorer cet email.
      <br/>
      <strong style="color:${C.destructive};">
        ⚠️ Si tu n'as pas demandé ce changement, sécurise ton compte immédiatement.
      </strong>
    </p>

    ${ctaButton(config.frontendUrl, "Accéder à mon compte")}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;">
      <tr>
        <td style="font-size:13px;color:${C.muted};line-height:1.5;">
          💡 Tu peux aussi nous contacter au plus vite à
          <a href="mailto:support@djassa.net"
             style="color:${C.primary};text-decoration:underline;">support@djassa.net</a>
          si tu as besoin d'aide.
        </td>
      </tr>
    </table>
  `;

  return baseLayout(body, "Ton mot de passe Djassa a été modifié");
}

/* ── Monnaie CFA ──────────────────────────────────────────────────── */

function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

/* ── Carte info commande (réutilisée dans plusieurs templates) ────── */

function orderInfoCard(order: {
  productTitle: string;
  productPhotoUrl?: string | null;
  productUrl?: string;
  price: number;
  quantity?: number;
  commission?: number;
  netAmount?: number;
  confirmationCode?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
}): string {
  const photoCell = order.productPhotoUrl
    ? `<td style="width:64px;vertical-align:top;padding-right:16px;">
         <img src="${order.productPhotoUrl}" alt="${escapeHtml(order.productTitle)}"
              width="60" height="60"
              style="border-radius:8px;object-fit:cover;display:block;border:1px solid ${C.border};" />
       </td>`
    : "";

  const trackingRow = order.trackingNumber
    ? `<tr>
         <td style="padding:6px 0;font-size:13px;color:${C.muted};">Suivi</td>
         <td style="padding:6px 0;font-size:13px;color:${C.ink};text-align:right;">
           ${escapeHtml(order.carrier ? `${order.carrier} — ` : "")}<strong>${escapeHtml(order.trackingNumber)}</strong>
         </td>
       </tr>`
    : "";

  const qty = order.quantity ?? 1;
  const commissionRow = order.commission !== undefined
    ? `<tr>
         <td style="padding:6px 0;font-size:13px;color:${C.muted};">Commission</td>
         <td style="padding:6px 0;font-size:13px;color:${C.muted};text-align:right;">−${formatFcfa(order.commission)}</td>
       </tr>`
    : "";

  const netRow = order.netAmount !== undefined
    ? `<tr>
         <td style="padding:6px 0;font-size:14px;color:${C.ink};"><strong>Revenu net</strong></td>
         <td style="padding:6px 0;font-size:14px;color:${C.primary};text-align:right;"><strong>${formatFcfa(order.netAmount)}</strong></td>
       </tr>`
    : "";

  const codeRow = order.confirmationCode
    ? `<tr><td colspan="2" style="padding:12px 0 0;">
         <p style="margin:0;font-size:13px;color:${C.muted};text-align:center;">
           Code de confirmation : <strong style="font-size:18px;letter-spacing:2px;color:${C.ink};">${escapeHtml(order.confirmationCode)}</strong>
         </p>
       </td></tr>`
    : "";

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0"
     style="background-color:${C.accentBg};border-radius:10px;margin:20px 0;width:100%;">
    <tr>
      <td style="padding:16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
          <tr>
            ${photoCell}
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;color:${C.accentFg};line-height:1.4;">
                <strong>${escapeHtml(order.productTitle)}</strong>
              </p>
              <p style="margin:0;font-size:13px;color:${C.muted};">
                ${qty > 1 ? `Qté : ${qty} &nbsp;·&nbsp; ` : ""}${formatFcfa(order.price)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 16px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
          ${trackingRow}
          ${commissionRow}
          ${netRow}
          ${codeRow}
        </table>
      </td>
    </tr>
  </table>`;
}

/* ── Templates commandes (vendeur) ──────────────────────────────────── */

/** Nouvelle commande reçue (vendeur). */
export function nouvelleCommandeVendeurEmailHtml(input: {
  vendorName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  productUrl: string;
  price: number;
  quantity?: number;
  buyerEmail: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Nouvelle commande !
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.vendorName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Un client vient de passer commande pour ton article. Le paiement est en cours —
      tu recevras une confirmation dès qu'il sera validé.
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      productUrl: input.productUrl,
      price: input.price,
      quantity: input.quantity,
    })}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:12px 0 0;">
      <tr>
        <td style="font-size:13px;color:${C.muted};line-height:1.5;">
          <strong>📋 Résumé :</strong><br/>
          Client : ${escapeHtml(input.buyerEmail)}<br/>
          Article : ${escapeHtml(input.productTitle)} × ${input.quantity ?? 1}<br/>
          Total : ${formatFcfa(input.price)}
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:${C.muted};">
      Prépare ton article — tu pourras confirmer l'expédition une fois le paiement reçu.
    </p>
  `;

  return baseLayout(body, `Nouvelle commande : ${input.productTitle}`);
}

/** Paiement confirmé — notification vendeur. */
export function commandePayeeVendeurEmailHtml(input: {
  vendorName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  productUrl: string;
  price: number;
  netAmount: number;
  commission: number;
  quantity?: number;
  shipBy?: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Paiement confirmé — prépare l'expédition
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.vendorName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Le paiement a été validé pour cette commande. Emballe ton article et
      confirme l'expédition dès qu'il est envoyé.
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      productUrl: input.productUrl,
      price: input.price,
      quantity: input.quantity,
      commission: input.commission,
      netAmount: input.netAmount,
    })}

    ${input.shipBy
      ? `<p style="margin:8px 0 0;font-size:13px;color:${C.inkSoft};line-height:1.5;">
           <strong>⏰ À expédier avant le :</strong> ${input.shipBy}
         </p>`
      : ""}

    ${ctaButton(`${config.frontendUrl}/vendeur/commandes`, "Voir mes commandes")}
  `;

  return baseLayout(body, "Paiement confirmé — prépare l'expédition");
}

/** Commande confirmée (reçue par le client) — notification vendeur. */
export function commandeConfirmeeVendeurEmailHtml(input: {
  vendorName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  price: number;
  netAmount: number;
  commission: number;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Commande confirmée — paiement libéré
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.vendorName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Le client a confirmé la réception de la commande. Ton paiement de
      <strong>${formatFcfa(input.netAmount)}</strong> sera viré sur ton compte.
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      price: input.price,
      commission: input.commission,
      netAmount: input.netAmount,
    })}

    <p style="margin:16px 0 0;font-size:13px;color:${C.muted};">
      Continu comme ça — plus tu vends, plus Djassa te rapporte.
    </p>
  `;

  return baseLayout(body, `Paiement libéré : ${formatFcfa(input.netAmount)}`);
}

/* ── Templates commandes (acheteur) ─────────────────────────────────── */

/** Paiement confirmé — notification acheteur. */
export function commandePayeeAcheteurEmailHtml(input: {
  buyerName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  productUrl: string;
  price: number;
  quantity?: number;
  confirmationCode: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Paiement confirmé — merci !
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.buyerName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Ton paiement a bien été reçu. Le vendeur prépare ton article et te le
      livrera bientôt.
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      productUrl: input.productUrl,
      price: input.price,
      quantity: input.quantity,
      confirmationCode: input.confirmationCode,
    })}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:12px 0 0;">
      <tr>
        <td style="font-size:13px;color:${C.muted};line-height:1.5;">
          <strong>🔐 Code de confirmation</strong> — garde-le précieusement.
          Tu devras le communiquer au livreur à la réception du colis pour
          valider la livraison.
        </td>
      </tr>
    </table>
  `;

  return baseLayout(body, `Paiement confirmé : ${input.productTitle}`);
}

/** Commande expédiée — notification acheteur. */
export function commandeExpedieeAcheteurEmailHtml(input: {
  buyerName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  productUrl: string;
  price: number;
  confirmationCode: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  confirmBy?: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Commande expédiée !
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.buyerName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Le vendeur a confié ton colis au transporteur. Il est en route !
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      productUrl: input.productUrl,
      price: input.price,
      confirmationCode: input.confirmationCode,
      trackingNumber: input.trackingNumber,
      carrier: input.carrier,
    })}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:12px 0 0;">
      <tr>
        <td style="font-size:13px;color:${C.muted};line-height:1.5;">
          À la réception, donne le <strong>code de confirmation</strong> au livreur
          pour valider la livraison.
          ${input.confirmBy ? `<br/>📅 Confirme la réception avant le <strong>${input.confirmBy}</strong>.` : ""}
        </td>
      </tr>
    </table>
  `;

  return baseLayout(body, `Commande expédiée : ${input.productTitle}`);
}

/** Remboursement — notification acheteur. */
export function commandeRembourseeAcheteurEmailHtml(input: {
  buyerName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  price: number;
  reason?: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Remboursement effectué
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.buyerName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Ta commande a été remboursée. Le montant de <strong>${formatFcfa(input.price)}</strong>
      sera crédité sur ton moyen de paiement dans un délai de 5 à 10 jours ouvrés.
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      price: input.price,
    })}

    ${input.reason
      ? `<p style="margin:8px 0 0;font-size:13px;color:${C.muted};line-height:1.5;">
           Motif : ${escapeHtml(input.reason)}
         </p>`
      : ""}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;">
      <tr>
        <td style="font-size:13px;color:${C.muted};line-height:1.5;">
          Une question sur ce remboursement ? Contacte-nous à
          <a href="mailto:support@djassa.net" style="color:${C.primary};">support@djassa.net</a>.
        </td>
      </tr>
    </table>
  `;

  return baseLayout(body, `Remboursement : ${formatFcfa(input.price)}`);
}

/* ── Template litige (acheteur + vendeur) ───────────────────────────── */

/** Litige ouvert — notification aux deux parties. */
export function litigeOuvertEmailHtml(input: {
  recipientName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  price: number;
  reason: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.destructive};line-height:1.3;">
      Litige ouvert
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.recipientName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Un litige a été ouvert concernant cette commande. L'équipe Djassa va examiner
      la situation et te tiendra informé de la résolution.
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      price: input.price,
    })}

    <table role="presentation" cellspacing="0" cellpadding="14" border="0"
           style="background-color:#fef2f2;border-radius:10px;margin:16px 0;width:100%;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;color:${C.destructive};line-height:1.5;">
            <strong>Motif du litige</strong>
          </p>
          <p style="margin:0;font-size:14px;color:${C.ink};line-height:1.6;">
            ${escapeHtml(input.reason)}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0;font-size:13px;color:${C.muted};line-height:1.5;">
      Notr'équipe te contactera sous 48h. En attendant, tu peux nous écrire à
      <a href="mailto:support@djassa.net" style="color:${C.primary};">support@djassa.net</a>.
    </p>
  `;

  return baseLayout(body, `Litige : ${input.productTitle}`);
}

/** Résolution de litige — notification vendeur (paiement libéré). */
export function litigeResoluVendeurEmailHtml(input: {
  vendorName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  netAmount: number;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Litige résolu — paiement libéré
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.vendorName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Le litige a été résolu en ta faveur. Le paiement de
      <strong>${formatFcfa(input.netAmount)}</strong> sera viré sur ton compte.
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      price: input.netAmount,
      netAmount: input.netAmount,
    })}
  `;

  return baseLayout(body, `Litige résolu : ${formatFcfa(input.netAmount)}`);
}

/** Résolution de litige — notification acheteur (remboursé). */
export function litigeResoluAcheteurEmailHtml(input: {
  buyerName: string;
  productTitle: string;
  productPhotoUrl?: string | null;
  price: number;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.ink};line-height:1.3;">
      Litige résolu — remboursement
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:${C.ink};line-height:1.6;">
      Salut <strong>${escapeHtml(input.buyerName)}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:${C.muted};line-height:1.6;">
      Le litige a été résolu et ta commande a été remboursée. Le montant de
      <strong>${formatFcfa(input.price)}</strong> sera crédité sous 5 à 10 jours ouvrés.
    </p>

    ${orderInfoCard({
      productTitle: input.productTitle,
      productPhotoUrl: input.productPhotoUrl,
      price: input.price,
    })}
  `;

  return baseLayout(body, `Litige résolu : ${formatFcfa(input.price)}`);
}
