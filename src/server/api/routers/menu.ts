import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const menuRouter = createTRPCRouter({
  // The "getAll" procedure matches api.menu.getAll
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.category.findMany({
      include: {
        items: true, // Also grab the items inside the category
      },
    });
  }),
});