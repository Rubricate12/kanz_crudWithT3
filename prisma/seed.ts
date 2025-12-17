import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Clear existing data (optional, but good for testing)
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.menuItem.deleteMany();
  await db.category.deleteMany();

  // 2. Create Categories
  const foodCategory = await db.category.create({
    data: {
      name: "Meals",
      slug: "food", // This matches the filter in your POS code
    },
  });

  const drinkCategory = await db.category.create({
    data: {
      name: "Drinks & Dessert",
      slug: "drinks", // This matches the filter in your POS code
    },
  });

  // 3. Create Food Items
  await db.menuItem.createMany({
    data: [
      { name: "Nasi Goreng Kanz", price: 35000, categoryId: foodCategory.id },
      { name: "Nasi Goreng Kampung", price: 35000, categoryId: foodCategory.id },
      { name: "Mie Tek-tek", price: 25000, categoryId: foodCategory.id },
      { name: "Ayam Geprek", price: 35000, categoryId: foodCategory.id },
      { name: "Iga Bakar", price: 60000, categoryId: foodCategory.id },
    ],
  });

  // 4. Create Drink Items
  await db.menuItem.createMany({
    data: [
      { name: "Kopi Susu Gula Aren", price: 25000, categoryId: drinkCategory.id },
      { name: "Matcha Lovely", price: 30000, categoryId: drinkCategory.id },
      { name: "Vanilla Cookies Cream", price: 30000, categoryId: drinkCategory.id },
      { name: "Ice Tea", price: 10000, categoryId: drinkCategory.id },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });