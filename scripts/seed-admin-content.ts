/**
 * Seeds the two default payment methods (RedotPay + BaridiMob) so the
 * DB-backed checkout keeps working out of the box. Idempotent — skips
 * any code that already exists. Run with: npx tsx scripts/seed-admin-content.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const defaults = [
    {
      code: "redotpay",
      name: "RedotPay",
      emoji: "💳",
      type: "email",
      description: "Paiement en ligne rapide et sécurisé",
      instructions: [
        "Ouvre l'application RedotPay",
        "Choisis « Envoyer » ou « Pay »",
        "Envoie {amount} à : {target}",
        "En objet : ton email + « Plan {plan} »",
      ],
      details: { mode: "email" },
      sortOrder: 0,
    },
    {
      code: "baridimob",
      name: "BaridiMob",
      emoji: "🏦",
      type: "bank",
      description: "Virement bancaire via BaridiMob / CCP",
      instructions: [
        "Effectue un virement de {amount} via BaridiMob / CCP",
        "Utilise les informations bancaires ci-dessous",
        "Référence du virement : ton email",
      ],
      details: {
        beneficiary: "DZAds AI SARL",
        iban: "DZ23 0079 9999 9091 2345 6789 01",
        bic: "BARBDZDZ",
        idNumber: "1999999999999999",
      },
      sortOrder: 1,
    },
  ];

  for (const m of defaults) {
    const existing = await prisma.paymentMethod.findUnique({ where: { code: m.code } });
    if (existing) {
      console.log(`✔ ${m.code} — existe déjà, ignoré`);
      continue;
    }
    await prisma.paymentMethod.create({ data: m });
    console.log(`+ ${m.code} — créé`);
  }

  // No announcement or guide is seeded: the dashboard already shows a translated free-trial offer, and guides are
  // real tutorial videos the admin adds in /admin.

  // ---- Admin bootstrap -----------------------------------------------------
  // There is intentionally NO public endpoint that grants admin rights.
  // Promote (or create) the configured admin account here instead.
  // Usage: ADMIN_EMAIL=you@example.com npx tsx scripts/seed-admin-content.ts
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@dzads.ai").toLowerCase().trim();
  if (!adminEmail) {
    console.error("✗ ADMIN_EMAIL vide — impossible de promouvoir un admin");
    process.exitCode = 1;
  } else {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { isAdmin: true },
      create: {
        email: adminEmail,
        name: "Admin",
        isAdmin: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`✦ ${adminEmail} — promu administrateur`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
