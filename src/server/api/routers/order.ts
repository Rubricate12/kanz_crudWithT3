import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const orderRouter = createTRPCRouter({
  
  // 1. CREATE ORDER (With Stock Validation)
  create: publicProcedure
    .input(z.object({
      items: z.array(z.object({
        id: z.string(), // MenuItem ID
        qty: z.number(),
        price: z.number().optional(), 
      })),
      total: z.number(),
      paymentMethod: z.enum(["CASH", "QRIS", "CARD", "TRANSFER"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      
      // --- 1. VALIDATION STEP ---
      // Fetch the actual items from DB to check availability
      const itemIds = input.items.map((i) => i.id);
      const dbItems = await ctx.db.menuItem.findMany({
        where: { id: { in: itemIds } }
      });

      // Check if any item is Sold Out
      for (const dbItem of dbItems) {
        if (!dbItem.isAvailable) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: `FAILED: '${dbItem.name}' is currently Sold Out.`
            });
        }
      }
      // --------------------------

      // 2. PROCEED TO CREATE ORDER
      const order = await ctx.db.order.create({
        data: {
          total: input.total,
          status: "PENDING",
          paymentMethod: input.paymentMethod ?? null,
          items: {
            create: input.items.map((item) => ({
                menuItem: { connect: { id: item.id } },
                quantity: item.qty,
                price: item.price ?? 0, 
                isReady: false 
            }))
          }
        },
      });
      return { success: true, orderId: order.id };
    }),

  // 2. GET ALL ORDERS (Includes Category & isReady)
  getAll: publicProcedure
    .input(z.object({ 
      status: z.enum(["ALL", "PENDING", "ON_PROCESS", "READY", "COMPLETED", "CANCELLED"]).optional() 
    }).optional()) 
    .query(async ({ ctx, input }) => {
      const whereClause = (input?.status && input.status !== "ALL") 
        ? { status: input.status } 
        : {};

      return ctx.db.order.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              menuItem: { 
                include: { category: true } // Needed for Barista filtering
              }, 
            },
            orderBy: { menuItem: { name: 'asc' } }
          },
        },
      });
    }),

  // 3. TOGGLE ITEM STATUS (The missing piece causing your error)
  toggleItemStatus: protectedProcedure
    .input(z.object({ 
      itemId: z.string(), 
      isReady: z.boolean() 
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.orderItem.update({
        where: { id: input.itemId },
        data: { isReady: input.isReady }
      });
    }),

  // 4. UPDATE ORDER STATUS
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.coerce.number(), 
      status: z.enum(["PENDING", "ON_PROCESS", "READY", "COMPLETED", "CANCELLED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.order.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // 5. PAY ORDER
  payOrder: publicProcedure
    .input(z.object({
        orderId: z.number(),
        paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "QRIS"]),
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.order.update({
            where: { id: input.orderId },
            data: { paymentMethod: input.paymentMethod }
        });
    }),

  // 6. DASHBOARD DATA
  getDashboardData: publicProcedure.query(async ({ ctx }) => {
    const totalOrders = await ctx.db.order.count();
    const newOrders = await ctx.db.order.count({ where: { status: "PENDING" } });
    const incomeResult = await ctx.db.order.aggregate({
        _sum: { total: true },
        where: { paymentMethod: { not: null } } 
    });

    const unpaidOrders = await ctx.db.order.findMany({
        where: { 
            paymentMethod: null,
            status: { not: "CANCELLED" }
        }, 
        orderBy: { createdAt: 'asc' },
        include: { items: { include: { menuItem: true } } }
    });

    const recentOrders = await ctx.db.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
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

  // 6. INCOME REPORT
  getIncomeReport: publicProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
        where: { status: "COMPLETED" },
        include: { items: { include: { menuItem: { include: { category: true } } } } }
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(0, i).toLocaleString('default', { month: 'short' });
        const monthOrders = orders.filter(o => o.createdAt.getMonth() === i);
        const income = monthOrders.reduce((sum, o) => sum + o.total, 0);
        
        return {
            name: monthName,
            income: income,
            target: 50000000,
        };
    });

    const yearlyIncome = orders.reduce((sum, o) => sum + o.total, 0);
    const yearlyTarget = 10000000;
    const targetPercentage = Math.round((yearlyIncome / yearlyTarget) * 100);

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

    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0));
    
    const dayOrders = orders.filter(o => o.createdAt >= startOfDay);
    const dayStats = getSummary(dayOrders);

    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekOrders = orders.filter(o => o.createdAt >= lastWeek);
    const weekStats = getSummary(weekOrders);

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

  // 7. TRANSACTIONS
  getTransactions: publicProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        include: {
            items: {
                include: {
                    menuItem: { include: { category: true } }
                }
            }
        }
    });

    return orders.map(order => {
        let foodCount = 0;
        let drinkCount = 0;
        
        order.items.forEach(item => {
            if (item.menuItem.category.slug === "food") foodCount += item.quantity;
            else drinkCount += item.quantity;
        });

        return {
            id: order.id,
            name: `Order #${order.id}`,
            qty: foodCount + drinkCount,
            income: order.total,
            foodCount,
            drinkCount,
            date: order.createdAt
        };
    });
  }),
});