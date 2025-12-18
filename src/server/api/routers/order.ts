import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const orderRouter = createTRPCRouter({
  // 1. CREATE ORDER (Existing)
  create: publicProcedure
    .input(z.object({
      items: z.array(z.object({
        id: z.string(),
        qty: z.number(),
      })),
      total: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.create({
        data: {
          total: input.total,
          status: "PENDING",
          items: {
            create: input.items.map((item) => ({
                menuItem: { connect: { id: item.id } },
                quantity: item.qty,
                price: 0, // Ideally fetch real price here
            }))
          }
        },
      });
      return { success: true, orderId: order.id };
    }),

  // 2. GET DASHBOARD DATA (New!)
  getDashboardData: publicProcedure.query(async ({ ctx }) => {
    // A. Stats
    const totalOrders = await ctx.db.order.count();
    const newOrders = await ctx.db.order.count({ where: { status: "PENDING" } });
    const incomeResult = await ctx.db.order.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETED" } // Only count money from paid orders
    });

    // B. Unpaid Orders (For the middle "Payment" column)
    const unpaidOrders = await ctx.db.order.findMany({
        where: { status: { not: "COMPLETED" } }, 
        orderBy: { createdAt: 'asc' }, // Oldest first
        include: { items: { include: { menuItem: true } } } // Get item names for receipt
    });

    // C. Recent History (For the left "Order List" column)
    const recentOrders = await ctx.db.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }, // Newest first
        include: { items: true }
    });

    return {
        stats: {
            totalOrders,
            newOrders,
            income: incomeResult._sum.total || 0
        },
        unpaidOrders,
        recentOrders
    };
  }),

  // 3. PAY ORDER (New!)
  payOrder: publicProcedure
    .input(z.object({
        orderId: z.number(),
        paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.order.update({
            where: { id: input.orderId },
            data: {
                status: "COMPLETED",
                paymentMethod: input.paymentMethod
            }
        });
    }),

    getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.order.findMany({
      orderBy: { createdAt: "desc" }, // Newest first
      include: {
        items: {
          include: {
            menuItem: true, // Get the names of the food
          },
        },
      },
    });
  }),

  getIncomeReport: publicProcedure.query(async ({ ctx }) => {
    // A. Fetch ALL Completed Orders
    const orders = await ctx.db.order.findMany({
        where: { status: "COMPLETED" },
        include: { items: { include: { menuItem: { include: { category: true } } } } }
    });

    // --- 1. Monthly Chart Data ---
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(0, i).toLocaleString('default', { month: 'short' });
        // Filter orders for this month (Simplified for current year)
        const monthOrders = orders.filter(o => o.createdAt.getMonth() === i);
        const income = monthOrders.reduce((sum, o) => sum + o.total, 0);
        
        return {
            name: monthName,
            income: income,
            target: 50000000, // Hardcoded Target: 50 Million
        };
    });

    // --- 2. Target Progress (Yearly) ---
    const yearlyIncome = orders.reduce((sum, o) => sum + o.total, 0);
    const yearlyTarget = 600000000; // 50mil * 12
    const targetPercentage = Math.round((yearlyIncome / yearlyTarget) * 100);

    // --- 3. Helper to summarize sales by Category (Food vs Drink) ---
    const getSummary = (filteredOrders: typeof orders) => {
        let foodQty = 0, foodIncome = 0;
        let drinkQty = 0, drinkIncome = 0;

        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const total = (item.price || item.menuItem.price) * item.quantity;
                if (item.menuItem.category.slug === "food") {
                    foodQty += item.quantity;
                    foodIncome += total;
                } else {
                    drinkQty += item.quantity;
                    drinkIncome += total;
                }
            });
        });

        return { foodQty, foodIncome, drinkQty, drinkIncome, total: foodIncome + drinkIncome };
    };

    // Calculate time ranges
    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0));
    
    // Day Stats
    const dayOrders = orders.filter(o => o.createdAt >= startOfDay);
    const dayStats = getSummary(dayOrders);

    // Week Stats (Rough approximation for last 7 days)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekOrders = orders.filter(o => o.createdAt >= lastWeek);
    const weekStats = getSummary(weekOrders);

    // Year Stats
    const yearStats = getSummary(orders);

    return {
        chartData: monthlyData,
        target: {
            percentage: targetPercentage,
            current: yearlyIncome,
            total: yearlyTarget
        },
        stats: {
            day: dayStats,
            week: weekStats,
            year: yearStats
        }
    };
  }),

  getTransactions: publicProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" }, // Newest first
        include: {
            items: {
                include: {
                    menuItem: { include: { category: true } }
                }
            }
        }
    });

    // Transform data for the UI
    return orders.map(order => {
        let foodCount = 0;
        let drinkCount = 0;
        
        // Count items
        order.items.forEach(item => {
            if (item.menuItem.category.slug === "food") foodCount += item.quantity;
            else drinkCount += item.quantity;
        });

        return {
            id: order.id,
            name: `Order #${order.id}`, // We don't have Customer Name in DB yet
            qty: foodCount + drinkCount,
            income: order.total,
            foodCount,
            drinkCount,
            date: order.createdAt
        };
    });
  }),
});