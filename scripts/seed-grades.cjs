const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const grades = Array.from({ length: 10 }, (_, i) => i + 1);
  for (const level of grades) {
    await prisma.grade.upsert({
      where: { level },
      update: {},
      create: { level },
    });
    console.log('Ensured grade', level);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
