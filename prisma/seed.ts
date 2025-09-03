import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      role_id: '11111111-1111-1111-1111-111111111111',
      role_name: 'Admin',
      role_slug: 'admin',
    },
    {
      role_id: '22222222-2222-2222-2222-222222222222',
      role_name: 'Manager',
      role_slug: 'manager',
    },
    {
      role_id: '33333333-3333-3333-3333-333333333333',
      role_name: 'Customer',
      role_slug: 'customer',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { role_id: role.role_id },
      update: {},
      create: role,
    });
  }

  console.log('✅ Roles seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
