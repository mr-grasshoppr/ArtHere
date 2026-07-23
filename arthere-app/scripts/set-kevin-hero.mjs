import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kevin_Tudball images by sortOrder:
//   0 → Kevin_Tudball1 (current hero) → set isHero: false
//   3 → Kevin_Tudball4 (new hero)      → set isHero: true
async function main() {
  const artist = await prisma.artist.findFirst({
    where: { slug: 'kevin-tudball' },
    include: { artworkImages: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!artist) throw new Error('Kevin not found');

  const currentHero = artist.artworkImages.find(i => i.isHero);
  const newHero = artist.artworkImages[3]; // sortOrder 3 = Kevin_Tudball4

  console.log('Current hero:', currentHero?.id, '| New hero:', newHero?.id);
  console.log('New hero URL:', newHero?.imageUrl);

  await prisma.$transaction([
    prisma.artworkImage.update({ where: { id: currentHero.id }, data: { isHero: false } }),
    prisma.artworkImage.update({ where: { id: newHero.id },       data: { isHero: true  } }),
  ]);

  console.log('Done — Kevin_Tudball4 is now the hero image.');
}

main().finally(() => prisma.$disconnect());
