// Run this script with: node src/fixUserEmails.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: null }
  });

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: `${user.username || 'user'}@example.com` }
    });
    console.log(`Updated user ${user.id} with email`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());