import { PrismaClient, type ProductCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Password123!";

const VENDORS = [
  { email: "boutique.aicha@jassa.dev", name: "boutique-aicha" },
  { email: "techmarket.dakar@jassa.dev", name: "techmarket-dakar" },
  { email: "maison.saveurs@jassa.dev", name: "maison-saveurs" },
] as const;

type SeedProduct = {
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  vendor: (typeof VENDORS)[number]["email"];
  photoSeed: string;
};

const PRODUCTS: SeedProduct[] = [
  { title: "Robe wax imprimée", description: "Robe élégante en tissu wax, coupe ajustée, idéale pour les grandes occasions.", price: 15000, category: "mode_beaute", vendor: "boutique.aicha@jassa.dev", photoSeed: "robe-wax" },
  { title: "Sac à main cuir", description: "Sac à main en cuir véritable, plusieurs compartiments, finitions soignées.", price: 22000, category: "mode_beaute", vendor: "boutique.aicha@jassa.dev", photoSeed: "sac-cuir" },
  { title: "Ensemble basin riche", description: "Ensemble en basin riche brodé, disponible en plusieurs coloris.", price: 45000, category: "mode_beaute", vendor: "boutique.aicha@jassa.dev", photoSeed: "basin-riche" },
  { title: "Parure bijoux dorés", description: "Collier et boucles d'oreilles assortis, plaqué or, pour un look raffiné.", price: 12000, category: "mode_beaute", vendor: "boutique.aicha@jassa.dev", photoSeed: "bijoux-dores" },
  { title: "Écouteurs sans fil", description: "Écouteurs Bluetooth avec réduction de bruit et boîtier de charge.", price: 18000, category: "electronique", vendor: "techmarket.dakar@jassa.dev", photoSeed: "ecouteurs" },
  { title: "Enceinte Bluetooth portable", description: "Enceinte compacte, autonomie 12h, résistante aux éclaboussures.", price: 25000, category: "electronique", vendor: "techmarket.dakar@jassa.dev", photoSeed: "enceinte-bt" },
  { title: "Chargeur solaire portable", description: "Panneau solaire pliable avec batterie intégrée 10000mAh.", price: 14000, category: "electronique", vendor: "techmarket.dakar@jassa.dev", photoSeed: "chargeur-solaire" },
  { title: "Smartphone Android 128Go", description: "Smartphone double SIM, écran 6.5 pouces, 128Go de stockage.", price: 95000, category: "telephones", vendor: "techmarket.dakar@jassa.dev", photoSeed: "smartphone-android" },
  { title: "Coque de protection renforcée", description: "Coque antichoc compatible avec la plupart des smartphones récents.", price: 4000, category: "telephones", vendor: "techmarket.dakar@jassa.dev", photoSeed: "coque-protection" },
  { title: "Power bank 20000mAh", description: "Batterie externe grande capacité, charge rapide, double port USB.", price: 16000, category: "telephones", vendor: "boutique.aicha@jassa.dev", photoSeed: "power-bank" },
  { title: "Service à thé traditionnel", description: "Set complet théière et verres décorés, style traditionnel.", price: 20000, category: "maison", vendor: "maison.saveurs@jassa.dev", photoSeed: "service-the" },
  { title: "Lot de 6 verres décorés", description: "Verres à motifs colorés, parfaits pour la table ou le thé.", price: 9000, category: "maison", vendor: "maison.saveurs@jassa.dev", photoSeed: "verres-decores" },
  { title: "Tapis de salon berbère", description: "Tapis épais motif berbère, 2x3m, entretien facile.", price: 35000, category: "maison", vendor: "maison.saveurs@jassa.dev", photoSeed: "tapis-salon" },
  { title: "Sac de riz parfumé 25kg", description: "Riz parfumé de qualité supérieure, sac de 25kg.", price: 17000, category: "alimentation", vendor: "maison.saveurs@jassa.dev", photoSeed: "riz-parfume" },
  { title: "Panier d'épices assorties", description: "Sélection d'épices locales pour rehausser tous vos plats.", price: 8000, category: "alimentation", vendor: "maison.saveurs@jassa.dev", photoSeed: "epices-assorties" },
  { title: "Huile d'arachide 5L", description: "Huile d'arachide pure, bidon de 5 litres.", price: 11000, category: "alimentation", vendor: "maison.saveurs@jassa.dev", photoSeed: "huile-arachide" },
];

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const vendorIdByEmail = new Map<string, string>();
  for (const vendor of VENDORS) {
    const user = await prisma.user.upsert({
      where: { email: vendor.email },
      update: { sellerVerificationStatus: "approuvee" },
      create: {
        email: vendor.email,
        passwordHash,
        accountType: "vendeur",
        sellerVerificationStatus: "approuvee",
      },
    });
    vendorIdByEmail.set(vendor.email, user.id);
  }

  await prisma.product.deleteMany({ where: { vendorId: { in: [...vendorIdByEmail.values()] } } });

  await prisma.product.createMany({
    data: PRODUCTS.map((p) => ({
      vendorId: vendorIdByEmail.get(p.vendor)!,
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      photos: [`https://picsum.photos/seed/${p.photoSeed}/600/600`],
    })),
  });

  console.log(`Seed terminé : ${vendorIdByEmail.size} vendeurs, ${PRODUCTS.length} produits.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
