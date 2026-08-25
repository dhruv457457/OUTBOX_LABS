import "dotenv/config";
import { prisma } from "../src/db/client.js";
import { listSendersForUser } from "../src/services/senderService.js";

// Mailboxes are provisioned per account the first time the dashboard asks for them,
// so seeding is only needed for the scripts that run outside a signed-in session.
const SCRIPT_USER = process.argv[2] ?? "load-test-user";

async function main() {
  const senders = await listSendersForUser(SCRIPT_USER);
  console.log(`senders for "${SCRIPT_USER}":`);
  for (const s of senders) console.log(`  ${s.email}${s.name ? ` (${s.name})` : ""}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
