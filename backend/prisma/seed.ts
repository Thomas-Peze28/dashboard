import { PrismaClient, Prisma } from '@prisma/client';
import { AVAILABLE_SERVICES } from '../src/config/services.config.js';

const prisma = new PrismaClient();

async function main() {
    for (const s of AVAILABLE_SERVICES) {
        const service = await prisma.service.upsert({
            where: { name: s.name },
            update: { description: s.description },
            create: {
                name: s.name,
                description: s.description,
            },
        });

        for (const w of s.widgets) {
            const existing = await prisma.widget.findFirst({
                where: { serviceId: service.id, name: w.name },
            });

            if (existing) {
                await prisma.widget.update({
                    where: { id: existing.id },
                    data: {
                        description: w.description,
                        params: w.params as unknown as Prisma.InputJsonValue,
                    },
                });
            } else {
                await prisma.widget.create({
                    data: {
                        serviceId: service.id,
                        name: w.name,
                        description: w.description,
                        params: w.params as unknown as Prisma.InputJsonValue,
                    },
                });
            }
        }
    }

    console.log('Database seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });