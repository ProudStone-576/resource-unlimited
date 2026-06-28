/* eslint-disable no-console */
import { PrismaClient, ProductStatus, UnitOfMeasure } from '@prisma/client';

const prisma = new PrismaClient();

type CategorySeed = {
  slug: string;
  name: string;
  description: string;
  children?: CategorySeed[];
};

const categories: CategorySeed[] = [
  {
    slug: 'custom-packaging',
    name: 'Custom Packaging',
    description: 'Branded boxes, pouches, bags, and retail packaging tailored to your product.',
    children: [
      { slug: 'product-boxes', name: 'Product Boxes', description: 'Custom printed folding cartons and rigid boxes.' },
      { slug: 'pouches-bags', name: 'Pouches & Bags', description: 'Kraft bags, zip pouches, and stand-up pouches.' },
    ],
  },
  {
    slug: 'business-stationery',
    name: 'Business Stationery',
    description: 'Premium business cards, letterheads, envelopes, and corporate kits.',
    children: [
      { slug: 'business-cards', name: 'Business Cards', description: 'Matte, gloss, spot UV, and foil-finish cards.' },
      { slug: 'letterheads-envelopes', name: 'Letterheads & Envelopes', description: 'Corporate stationery sets.' },
    ],
  },
  {
    slug: 'commercial-printing',
    name: 'Commercial Printing',
    description: 'Flyers, brochures, catalogs, and promotional materials at any scale.',
    children: [
      { slug: 'flyers-leaflets', name: 'Flyers & Leaflets', description: 'Single and double-sided promotional flyers.' },
      { slug: 'brochures-catalogs', name: 'Brochures & Catalogs', description: 'Saddle-stitched and perfect-bound booklets.' },
    ],
  },
  {
    slug: 'labels-stickers',
    name: 'Labels & Stickers',
    description: 'Product labels, stickers, and barcode labels with custom finishes.',
  },
  {
    slug: 'banners-signage',
    name: 'Banners & Signage',
    description: 'Roll-up banners, hoardings, flex boards, and event displays.',
  },
];

async function seedCategory(node: CategorySeed, parentId: string | null, sortOrder: number) {
  const cat = await prisma.productCategory.upsert({
    where: { slug: node.slug },
    create: {
      slug: node.slug,
      name: node.name,
      description: node.description,
      parentId: parentId ?? undefined,
      sortOrder,
    },
    update: {
      name: node.name,
      description: node.description,
      parentId: parentId ?? undefined,
      sortOrder,
    },
  });
  if (node.children) {
    let i = 0;
    for (const child of node.children) {
      await seedCategory(child, cat.id, i++);
    }
  }
  return cat;
}

async function main() {
  console.log('Seeding categories...');
  let i = 0;
  const created: Record<string, string> = {};
  for (const c of categories) {
    const cat = await seedCategory(c, null, i++);
    created[c.slug] = cat.id;
    if (c.children) {
      for (const ch of c.children) {
        const childRec = await prisma.productCategory.findUnique({ where: { slug: ch.slug } });
        if (childRec) created[ch.slug] = childRec.id;
      }
    }
  }

  console.log('Seeding products...');
  const boxId = created['product-boxes'] ?? created['custom-packaging'];
  const cardId = created['business-cards'] ?? created['business-stationery'];
  const flyerId = created['flyers-leaflets'] ?? created['commercial-printing'];
  const labelId = created['labels-stickers'];
  const bannerId = created['banners-signage'];

  // Bright branded placeholder images, 3 angles per product.
  // Replace with real photography by editing these URLs or via the admin panel.
  const productImages = (name: string, accent: string) =>
    ['Front', 'Detail', 'In Use'].map((view, i) => ({
      url: `https://placehold.co/800x600/${accent}/ffffff/png?text=${encodeURIComponent(`${name} · ${view}`)}`,
      alt: `${name} — ${view.toLowerCase()} view`,
      isPrimary: i === 0,
      sortOrder: i,
    }));

  const products = [
    {
      sku: 'BOX-CUSTOM-100',
      slug: 'custom-product-box',
      name: 'Custom Printed Product Box',
      shortDesc: 'Full-colour CMYK printed folding carton with gloss lamination.',
      description:
        'Custom folding carton with full-colour CMYK printing. Available in gloss, matte, or spot-UV finish. Minimum order: 100 units.',
      categoryId: boxId,
      accent: 'F59E0B',
      brand: 'Resources Unlimited',
      unitOfMeasure: UnitOfMeasure.BOX,
      minOrderQty: 100,
      isFeatured: true,
      specs: { printing: 'CMYK 4/0', finish: 'Gloss lamination', material: '350gsm art board' },
      dimensions: { customizable: true },
    },
    {
      sku: 'CARD-MATTE-500',
      slug: 'business-card-matte',
      name: 'Premium Matte Business Cards',
      shortDesc: '400gsm matte laminated business cards, pack of 500.',
      description:
        'Ultra-thick 400gsm premium matte business cards. Soft-touch matte lamination on both sides. Spot UV available. Pack of 500.',
      categoryId: cardId,
      accent: '00B8D9',
      brand: 'Resources Unlimited',
      unitOfMeasure: UnitOfMeasure.EACH,
      minOrderQty: 100,
      isFeatured: true,
      specs: { paper: '400gsm', finish: 'Matte lamination', size: '90mm x 55mm', minQty: 100 },
      dimensions: { width: '90mm', height: '55mm' },
    },
    {
      sku: 'FLY-A5-GLOSS-1000',
      slug: 'a5-flyer-gloss',
      name: 'A5 Full-Colour Flyers',
      shortDesc: '130gsm gloss paper flyers, CMYK print, pack of 1000.',
      description:
        'A5 promotional flyers on 130gsm gloss paper. CMYK full-colour print. Ideal for events, promotions, and marketing campaigns.',
      categoryId: flyerId,
      accent: '8B5CF6',
      brand: 'Resources Unlimited',
      unitOfMeasure: UnitOfMeasure.SHEET,
      minOrderQty: 250,
      isFeatured: true,
      specs: { paper: '130gsm gloss', printing: 'CMYK 4/4', size: 'A5 (148mm x 210mm)' },
      dimensions: { width: '148mm', height: '210mm' },
    },
    {
      sku: 'LBL-ROUND-ROLL',
      slug: 'custom-round-sticker-labels',
      name: 'Custom Round Labels on Roll',
      shortDesc: 'Die-cut round labels on roll, waterproof vinyl, full colour.',
      description:
        'Waterproof vinyl labels on a roll. Die-cut to any size. CMYK full-colour with gloss or matte finish. Ideal for product jars, bottles, and packaging.',
      categoryId: labelId,
      accent: 'FF6B35',
      brand: 'Resources Unlimited',
      unitOfMeasure: UnitOfMeasure.ROLL,
      minOrderQty: 500,
      isFeatured: true,
      specs: { material: 'Vinyl', finish: 'Gloss or matte', printing: 'CMYK', waterproof: true },
      dimensions: { customizable: true },
    },
    {
      sku: 'BNR-ROLLUP-85X200',
      slug: 'roll-up-banner-stand',
      name: 'Roll-Up Banner Stand',
      shortDesc: '85cm x 200cm retractable banner stand with full-colour print.',
      description:
        'Retractable roll-up banner stand, 85cm x 200cm. Includes aluminium stand and carry bag. Full-colour CMYK printing on 250gsm banner material.',
      categoryId: bannerId,
      accent: '10B981',
      brand: 'Resources Unlimited',
      unitOfMeasure: UnitOfMeasure.EACH,
      minOrderQty: 1,
      isFeatured: false,
      specs: { material: '250gsm banner', stand: 'Aluminium retractable', includes: 'Carry bag' },
      dimensions: { width: '85cm', height: '200cm' },
    },
  ];

  for (const p of products) {
    const categoryId = p.categoryId;
    if (!categoryId) continue;
    const { categoryId: _omit, accent, ...rest } = p;
    const images = productImages(p.name, accent);
    await prisma.product.upsert({
      where: { sku: p.sku },
      create: {
        ...rest,
        categoryId,
        status: ProductStatus.ACTIVE,
        images: { create: images },
      },
      update: {
        name: p.name,
        shortDesc: p.shortDesc,
        description: p.description,
        categoryId,
        unitOfMeasure: p.unitOfMeasure,
        minOrderQty: p.minOrderQty,
        specs: p.specs,
        dimensions: p.dimensions,
        isFeatured: p.isFeatured ?? false,
        images: { deleteMany: {}, create: images },
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
