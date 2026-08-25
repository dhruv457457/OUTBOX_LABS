import { prisma } from "../src/db/client.js";

async function main() {
  const sender = await prisma.sender.upsert({
    where: { email: "ykqaiyanami563jq@ethereal.email" },
    update: {},
    create: { email: "ykqaiyanami563jq@ethereal.email", name: "Outbox Demo" },
  });
  console.log("seeded sender:", sender);
}

main().finally(() => prisma.$disconnect());
