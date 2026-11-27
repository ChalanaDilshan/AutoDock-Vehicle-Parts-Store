import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User } from '../modules/identity/models/user.model.js';
import { Category } from '../modules/customer-experience/models/category.model.js';
import { Brand } from '../modules/customer-experience/models/brand.model.js';
import { Product } from '../modules/customer-experience/models/product.model.js';
import { VehicleCompatibility } from '../modules/customer-experience/models/vehicleCompatibility.model.js';
import bcrypt from 'bcryptjs';

interface SeedProductSpec {
  title: string;
  sku: string;
  partNumber: string;
  categorySlug: string;
  brandSlug: string;
  condition: 'BRAND_NEW' | 'RECONDITIONED' | 'USED';
  description: string;
  priceInCents: number;
  stock: number;
  warrantyMonths: number;
  imageUrl: string;
  averageRating: number;
  reviewCount: number;
  specifications: Array<{ key: string; value: string }>;
  vehicles: Array<{
    make: string;
    model: string;
    yearFrom: number;
    yearTo: number;
    engineCode?: string;
  }>;
}

const SAMPLE_PRODUCTS: SeedProductSpec[] = [
  {
    title: 'Brembo Front Ceramic Brake Pad Set',
    sku: 'BRK-BREM-001',
    partNumber: 'P83106N',
    categorySlug: 'brake-pads',
    brandSlug: 'brembo',
    condition: 'BRAND_NEW',
    description:
      'Low-dust ceramic front brake pad set engineered for quiet stopping power and thermal stability in Sri Lankan city and highway driving.',
    priceInCents: 1450000,
    stock: 18,
    warrantyMonths: 12,
    imageUrl: '/parts/brake-pads.svg',
    averageRating: 4.9,
    reviewCount: 28,
    specifications: [
      { key: 'Position', value: 'Front Axle' },
      { key: 'Friction Material', value: 'Ceramic Composite' },
      { key: 'Wear Indicator', value: 'Acoustic Clip Included' },
    ],
    vehicles: [
      { make: 'TOYOTA', model: 'COROLLA', yearFrom: 2012, yearTo: 2023, engineCode: '2ZR-FE' },
      { make: 'TOYOTA', model: 'PRIUS', yearFrom: 2015, yearTo: 2022, engineCode: '2ZR-FXE' },
    ],
  },
  {
    title: 'Brembo UV-Coated Ventilated Front Brake Rotor Pair',
    sku: 'DSC-BREM-002',
    partNumber: '09.A864.11',
    categorySlug: 'brake-system',
    brandSlug: 'brembo',
    condition: 'BRAND_NEW',
    description:
      'Precision-balanced ventilated front brake disc rotors with anti-corrosion UV coating for consistent pedal feel and reduced brake fade.',
    priceInCents: 2650000,
    stock: 10,
    warrantyMonths: 12,
    imageUrl: '/parts/brake-disc.svg',
    averageRating: 4.8,
    reviewCount: 19,
    specifications: [
      { key: 'Diameter', value: '275 mm' },
      { key: 'Rotor Type', value: 'Ventilated' },
      { key: 'Finish', value: 'UV Anti-Corrosion Coated' },
    ],
    vehicles: [
      { make: 'TOYOTA', model: 'COROLLA', yearFrom: 2013, yearTo: 2022 },
      { make: 'HONDA', model: 'CIVIC', yearFrom: 2016, yearTo: 2023 },
    ],
  },
  {
    title: 'MANN-FILTER Spin-On Engine Oil Filter',
    sku: 'FLT-MANN-003',
    partNumber: 'W610/3',
    categorySlug: 'engine-oil-filters',
    brandSlug: 'mann-filter',
    condition: 'BRAND_NEW',
    description:
      'OEM-grade spin-on engine oil filter with silicone anti-drainback valve for reliable cold-start oil pressure and particle filtration.',
    priceInCents: 285000,
    stock: 42,
    warrantyMonths: 6,
    imageUrl: '/parts/oil-filter.svg',
    averageRating: 4.7,
    reviewCount: 34,
    specifications: [
      { key: 'Thread Size', value: 'M20 x 1.5' },
      { key: 'Bypass Valve', value: '1.0 bar' },
      { key: 'Filter Type', value: 'Spin-On Canister' },
    ],
    vehicles: [
      { make: 'HONDA', model: 'CIVIC', yearFrom: 2012, yearTo: 2024 },
      { make: 'HONDA', model: 'VEZEL', yearFrom: 2014, yearTo: 2022 },
      { make: 'SUZUKI', model: 'WAGONR', yearFrom: 2014, yearTo: 2023 },
    ],
  },
  {
    title: 'NGK Laser Iridium Spark Plug (Set of 4)',
    sku: 'SPK-NGK-004',
    partNumber: 'ILZKAR7B11',
    categorySlug: 'spark-plugs',
    brandSlug: 'ngk',
    condition: 'BRAND_NEW',
    description:
      'Fine-wire iridium center electrode spark plugs engineered for improved fuel efficiency, crisp throttle response, and extended service intervals.',
    priceInCents: 1180000,
    stock: 25,
    warrantyMonths: 12,
    imageUrl: '/parts/spark-plug.svg',
    averageRating: 4.9,
    reviewCount: 41,
    specifications: [
      { key: 'Pack Quantity', value: '4 Spark Plugs' },
      { key: 'Electrode', value: 'Laser Iridium' },
      { key: 'Gap', value: '1.1 mm' },
    ],
    vehicles: [
      { make: 'TOYOTA', model: 'COROLLA', yearFrom: 2010, yearTo: 2023 },
      { make: 'TOYOTA', model: 'PRIUS', yearFrom: 2010, yearTo: 2022 },
      { make: 'SUZUKI', model: 'ALTO', yearFrom: 2015, yearTo: 2023 },
    ],
  },
  {
    title: 'KYB Excel-G Twin-Tube Rear Gas Shock Absorber',
    sku: 'SUS-KYB-005',
    partNumber: '343433',
    categorySlug: 'suspension-steering',
    brandSlug: 'kyb',
    condition: 'BRAND_NEW',
    description:
      'Nitrogen gas-charged twin-tube shock absorber designed to restore OE ride handling, tire contact, and stability over rough roads.',
    priceInCents: 1890000,
    stock: 14,
    warrantyMonths: 12,
    imageUrl: '/parts/shock-absorber.svg',
    averageRating: 4.8,
    reviewCount: 16,
    specifications: [
      { key: 'Position', value: 'Rear Left / Right' },
      { key: 'Damping Type', value: 'Twin-Tube Gas Charged' },
      { key: 'Country of Origin', value: 'Japan' },
    ],
    vehicles: [
      { make: 'TOYOTA', model: 'COROLLA', yearFrom: 2008, yearTo: 2020 },
      { make: 'TOYOTA', model: 'HILUX', yearFrom: 2015, yearTo: 2023 },
    ],
  },
  {
    title: 'DENSO 110A High-Output Remanufactured Alternator',
    sku: 'ELC-DENS-006',
    partNumber: '104210-5490',
    categorySlug: 'electrical-ignition',
    brandSlug: 'denso',
    condition: 'RECONDITIONED',
    description:
      'Bench-tested 110-amp alternator assembly with new bearings, voltage regulator, and copper stator windings for dependable charging.',
    priceInCents: 3850000,
    stock: 6,
    warrantyMonths: 6,
    imageUrl: '/parts/alternator.svg',
    averageRating: 4.6,
    reviewCount: 11,
    specifications: [
      { key: 'Output Amperage', value: '110 A' },
      { key: 'Voltage', value: '12 V' },
      { key: 'Pulley Grooves', value: '6-Rib Serpentine' },
    ],
    vehicles: [
      { make: 'TOYOTA', model: 'HILUX', yearFrom: 2012, yearTo: 2021 },
      { make: 'NISSAN', model: 'X-TRAIL', yearFrom: 2014, yearTo: 2021 },
    ],
  },
  {
    title: 'AISIN Super Long-Life Pre-Mixed Radiator Coolant (4L)',
    sku: 'COL-AISN-007',
    partNumber: 'LLC-P004',
    categorySlug: 'cooling-system',
    brandSlug: 'aisin',
    condition: 'BRAND_NEW',
    description:
      'Ethylene-glycol silicate-free coolant formulated for Japanese aluminum radiators and water pumps, providing corrosion and boil-over protection.',
    priceInCents: 460000,
    stock: 30,
    warrantyMonths: 12,
    imageUrl: '/parts/coolant.svg',
    averageRating: 4.9,
    reviewCount: 22,
    specifications: [
      { key: 'Volume', value: '4 Litres (Pre-Mixed)' },
      { key: 'Formula', value: 'Silicate & Borate Free' },
      { key: 'Color', value: 'Pink / Red OAT' },
    ],
    vehicles: [
      { make: 'TOYOTA', model: 'PRIUS', yearFrom: 2010, yearTo: 2024 },
      { make: 'TOYOTA', model: 'COROLLA', yearFrom: 2010, yearTo: 2024 },
      { make: 'TOYOTA', model: 'HILUX', yearFrom: 2012, yearTo: 2024 },
    ],
  },
  {
    title: 'Gates PowerGrip Timing Belt & Tensioner Kit',
    sku: 'ENG-GATE-008',
    partNumber: 'K015603XS',
    categorySlug: 'engine-parts',
    brandSlug: 'gates',
    condition: 'BRAND_NEW',
    description:
      'Complete camshaft timing belt replacement kit including reinforced HSN belt, idler pulley, and precision spring tensioner bearing.',
    priceInCents: 2240000,
    stock: 9,
    warrantyMonths: 12,
    imageUrl: '/parts/timing-belt.svg',
    averageRating: 4.8,
    reviewCount: 15,
    specifications: [
      { key: 'Teeth Count', value: '141 Teeth' },
      { key: 'Width', value: '25 mm' },
      { key: 'Kit Contents', value: 'Belt + Tensioner + Idler' },
    ],
    vehicles: [
      { make: 'TOYOTA', model: 'HILUX', yearFrom: 2010, yearTo: 2019 },
      { make: 'NISSAN', model: 'X-TRAIL', yearFrom: 2012, yearTo: 2020 },
    ],
  },
  {
    title: 'Bosch Aerotwin & Cabin Filter Maintenance Bundle',
    sku: 'FLT-BOSC-009',
    partNumber: '1987432300',
    categorySlug: 'filters-fluids',
    brandSlug: 'bosch',
    condition: 'BRAND_NEW',
    description:
      'Activated-carbon cabin air filter paired with genuine Bosch filtration media to capture pollen, dust, and urban exhaust particles.',
    priceInCents: 540000,
    stock: 27,
    warrantyMonths: 6,
    imageUrl: '/parts/oil-filter.svg',
    averageRating: 4.7,
    reviewCount: 14,
    specifications: [
      { key: 'Media Type', value: 'Activated Carbon' },
      { key: 'Service Interval', value: '15,000 km' },
    ],
    vehicles: [
      { make: 'HONDA', model: 'VEZEL', yearFrom: 2014, yearTo: 2023 },
      { make: 'SUZUKI', model: 'WAGONR', yearFrom: 2015, yearTo: 2023 },
    ],
  },
  {
    title: 'Valeo Heavy-Duty Clutch Pressure Plate & Disc Kit',
    sku: 'TRN-VALE-010',
    partNumber: '826818',
    categorySlug: 'transmission-drivetrain',
    brandSlug: 'valeo',
    condition: 'BRAND_NEW',
    description:
      'OEM-spec clutch cover, organic friction disc, and release bearing kit engineered for smooth engagement and high torque durability.',
    priceInCents: 4120000,
    stock: 7,
    warrantyMonths: 12,
    imageUrl: '/parts/brake-disc.svg',
    averageRating: 4.8,
    reviewCount: 9,
    specifications: [
      { key: 'Outer Diameter', value: '215 mm' },
      { key: 'Spline Count', value: '21 Teeth' },
      { key: 'Components', value: 'Disc, Cover & Bearing' },
    ],
    vehicles: [
      { make: 'SUZUKI', model: 'ALTO', yearFrom: 2015, yearTo: 2023 },
      { make: 'TOYOTA', model: 'COROLLA', yearFrom: 2008, yearTo: 2018 },
    ],
  },
];

async function seedCatalog() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run dev catalog seed in production environment.');
  }

  await connectDatabase();

  let seller = await User.findOne({ role: 'SELLER', accountStatus: 'ACTIVE' });
  if (!seller) {
    const sellerHash = await bcrypt.hash('SellerPassword123!', 12);
    seller = await User.create({
      email: 'seller@autodock.lk',
      passwordHash: sellerHash,
      firstName: 'Colombo',
      lastName: 'AutoParts',
      phone: '+94112345679',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    console.log('Created dev seller user: seller@autodock.lk');
  }

  const categories = await Category.find({ isActive: true }).lean();
  const brands = await Brand.find({ isActive: true }).lean();

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c._id]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b._id]));

  const fallbackCategoryId = categories[0]?._id;
  const fallbackBrandId = brands[0]?._id;

  if (!fallbackCategoryId || !fallbackBrandId) {
    throw new Error('Categories and brands must exist before seeding products.');
  }

  let createdCount = 0;
  for (const item of SAMPLE_PRODUCTS) {
    const categoryId = categoryBySlug.get(item.categorySlug) || fallbackCategoryId;
    const brandId = brandBySlug.get(item.brandSlug) || fallbackBrandId;

    let product = await Product.findOne({ sellerId: seller._id, sku: item.sku });
    if (!product) {
      product = await Product.create({
        sellerId: seller._id,
        title: item.title,
        sku: item.sku,
        partNumber: item.partNumber,
        categoryId,
        brandId,
        condition: item.condition,
        description: item.description,
        priceInCents: item.priceInCents,
        stock: item.stock,
        lowStockThreshold: 5,
        warrantyMonths: item.warrantyMonths,
        images: [{ url: item.imageUrl, isPrimary: true, altText: item.title }],
        specifications: item.specifications,
        status: 'ACTIVE',
        averageRating: item.averageRating,
        reviewCount: item.reviewCount,
      });
      createdCount += 1;
    }

    for (const v of item.vehicles) {
      await VehicleCompatibility.updateOne(
        {
          productId: product._id,
          make: v.make.toUpperCase(),
          model: v.model.toUpperCase(),
          yearFrom: v.yearFrom,
          yearTo: v.yearTo,
        },
        {
          $setOnInsert: {
            productId: product._id,
            make: v.make.toUpperCase(),
            model: v.model.toUpperCase(),
            yearFrom: v.yearFrom,
            yearTo: v.yearTo,
            engineCode: v.engineCode || null,
          },
        },
        { upsert: true }
      );
    }
  }

  console.log(`Dev catalog seed complete. Newly created products: ${createdCount}`);
  await disconnectDatabase();
}

seedCatalog().catch((err) => {
  console.error('Dev catalog seed error:', err);
  process.exit(1);
});
