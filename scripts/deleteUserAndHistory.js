// Delete a user and their simulation history using Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'cme8rvlda0000l1hgw203ui55'; // Replace with your user ID

  // Delete simulation history
  await prisma.simulationHistory.deleteMany({
    where: { userId }
  });

  // Delete user
  await prisma.user.delete({
    where: { id: userId }
  });

  console.log('User and simulation history deleted.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });