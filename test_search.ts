import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testSearch(q: string) {
  console.log(`Searching for "${q}"...`);
  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 5
    });
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 5
    });
    console.log("Posts:", posts.length);
    console.log("Users:", users.length);
    if (users.length > 0) console.log("User found:", users[0].name);
  } catch (e) {
    console.error("Search failed:", e);
  }
}

testSearch("Study").catch(console.error).finally(() => prisma.$disconnect());
