import { Router } from "express";
import { prisma } from "../../shared/db/client.js";
import { config } from "../../shared/config/index.js";

export const sitemapRouter = Router();

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

sitemapRouter.get("/sitemap-products.xml", async (_req, res, next) => {
  try {
    const [products, vendors] = await Promise.all([
      prisma.product.findMany({
        where: { vendor: { sellerVerificationStatus: "approuvee" } },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
      prisma.user.findMany({
        where: { accountType: "vendeur", sellerVerificationStatus: "approuvee" },
        select: { id: true, createdAt: true },
        take: 2000,
      }),
    ]);

    const base = config.frontendUrl.replace(/\/$/, "");
    const urls = [
      ...products.map(
        (p) =>
          `<url><loc>${xmlEscape(`${base}/produit/${p.id}`)}</loc><lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      ),
      ...vendors.map(
        (v) =>
          `<url><loc>${xmlEscape(`${base}/vendeur/${v.id}`)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
      ),
    ];

    res.set("Content-Type", "application/xml");
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    );
  } catch (err) {
    next(err);
  }
});
