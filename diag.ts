import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();
  console.log(`Users: ${userCount}`);
  console.log(`Posts: ${postCount}`);
  
  if (userCount > 0) {
    const users = await prisma.user.findMany({ take: 5 });
    console.log("Sample Users:", users.map(u => u.name || u.email));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
