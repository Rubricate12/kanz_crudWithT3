import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. CLEANUP
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.menuItem.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();

  // -------------------------------------------------------
  // 2. SEED USERS (Staff Accounts)
  // -------------------------------------------------------
  console.log("Creating users...");
  const hashedPassword = await hash("password123", 12);

  const users = [
    { username: "admin", role: "ADMIN" },
    { username: "cashier1", role: "CASHIER" },
    { username: "chef1", role: "KITCHEN" },
    { username: "barista1", role: "BARISTA" },
  ];

  for (const user of users) {
    await db.user.create({
      data: {
        name: user.username,
        email: `${user.username}@kanz.com`, 
        role: user.role as any,
        password: hashedPassword,
      },
    });
  }

  // -------------------------------------------------------
  // 3. SEED MENU (Categories & Items)
  // -------------------------------------------------------
  console.log("Creating menu...");

  // A. FOOD Categories
  const mealsCat = await db.category.create({
    data: {
      name: "Traditional Meals",
      slug: "traditional",
      type: "FOOD",
      items: {
        create: [
          { name: "Nasi Goreng Kanz", price: 35000, isAvailable: true },
          { name: "Ayam Geprek", price: 35000, isAvailable: true },
          { name: "Iga Bakar", price: 60000, isAvailable: true },
        ],
      },
    },
    include: { items: true }, // Include items so we can use their IDs later
  });

  const pastaCat = await db.category.create({
    data: {
      name: "Pasta & Noodles",
      slug: "pasta",
      type: "FOOD",
      items: {
        create: [
          { name: "Spaghetti Carbonara", price: 45000, isAvailable: true },
          { name: "Mie Tek-tek", price: 25000, isAvailable: true },
        ],
      },
    },
    include: { items: true },
  });

  // B. DRINK Categories
  const coffeeCat = await db.category.create({
    data: {
      name: "Coffee Series",
      slug: "coffee",
      type: "DRINK",
      items: {
        create: [
          { name: "Kopi Susu Gula Aren", price: 25000, isAvailable: true },
          { name: "Americano", price: 20000, isAvailable: true },
          { name: "Caramel Macchiato", price: 30000, isAvailable: true },
        ],
      },
    },
    include: { items: true },
  });

  const nonCoffeeCat = await db.category.create({
    data: {
      name: "Non-Coffee & Tea",
      slug: "non-coffee",
      type: "DRINK",
      items: {
        create: [
          { name: "Matcha Lovely", price: 30000, isAvailable: true },
          { name: "Ice Tea", price: 10000, isAvailable: true },
          { name: "Vanilla Cookies Cream", price: 30000, isAvailable: true },
        ],
      },
    },
    include: { items: true },
  });

  // -------------------------------------------------------
  // 4. SEED ORDERS (Dummy Data)
  // -------------------------------------------------------
  console.log("Creating orders...");

  // Helpers to get item IDs easily
  const food1 = mealsCat.items[0]; // Nasi Goreng
  const food2 = pastaCat.items[0]; // Carbonara
  const drink1 = coffeeCat.items[0]; // Kopi Susu
  const drink2 = nonCoffeeCat.items[0]; // Matcha

  // Order 1: Completed (Paid)
  await db.order.create({
    data: {
      total: (food1.price * 2) + drink1.price,
      status: "COMPLETED",
      paymentMethod: "CASH",
      createdAt: new Date(), // Now
      items: {
        create: [
          { menuItemId: food1.id, quantity: 2, price: food1.price, isReady: true },
          { menuItemId: drink1.id, quantity: 1, price: drink1.price, isReady: true },
        ],
      },
    },
  });

  // Order 2: Pending (Kitchen & Barista need to see this)
  await db.order.create({
    data: {
      total: food2.price + drink2.price,
      status: "PENDING",
      paymentMethod: null, // Not paid yet
      createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      items: {
        create: [
          { menuItemId: food2.id, quantity: 1, price: food2.price, isReady: false }, // Food not ready
          { menuItemId: drink2.id, quantity: 1, price: drink2.price, isReady: false }, // Drink not ready
        ],
      },
    },
  });

  // Order 3: Kitchen Only (Food Only)
  await db.order.create({
    data: {
      total: food1.price,
      status: "PENDING",
      paymentMethod: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
      items: {
        create: [
          { menuItemId: food1.id, quantity: 1, price: food1.price, isReady: false },
        ],
      },
    },
  });

  // Order 4: Barista Only (Drinks Only)
  await db.order.create({
    data: {
      total: drink1.price + drink2.price,
      status: "PENDING",
      paymentMethod: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
      items: {
        create: [
          { menuItemId: drink1.id, quantity: 1, price: drink1.price, isReady: false },
          { menuItemId: drink2.id, quantity: 1, price: drink2.price, isReady: false },
        ],
      },
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("------------------------------------------");
  console.log("Login Credentials:");
  console.log("Pass: password123");
  console.log("Users: admin, cashier1, chef1, barista1");
  console.log("------------------------------------------");
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