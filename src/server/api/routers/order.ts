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
});