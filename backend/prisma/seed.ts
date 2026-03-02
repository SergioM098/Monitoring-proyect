import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const hashedPassword = await bcrypt.hash('Wow2025@', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'monitor@wowdesarrollos.com' },
    update: {
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    },
    create: {
      email: 'monitor@wowdesarrollos.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    },
  });

  console.log('Seeded admin user:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
