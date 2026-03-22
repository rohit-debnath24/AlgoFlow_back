import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const result = await prisma.providerNode.updateMany({
    where: { endpointUrl: { contains: "your-ip" } },
    data: { endpointUrl: "http://localhost:3001" }
  });
  console.log(`Successfully updated ${result.count} nodes to point to localhost!`);
}
run().catch(console.error).finally(() => prisma.$disconnect());
