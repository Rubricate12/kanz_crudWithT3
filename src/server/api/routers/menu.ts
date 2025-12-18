import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const menuRouter = createTRPCRouter({

  // ==========================
  //      QUERIES
  // ==========================

  // 1. GET ALL (Grouped by Category)
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.category.findMany({
      include: {
        items: {
            orderBy: { name: "asc" } // Sort items A-Z
        },
      },
      orderBy: { name: "asc" }, // Sort categories A-Z
    });
  }),

  // 2. GET BY TYPE (e.g., Only "FOOD" or Only "DRINK")
  getByType: publicProcedure
    .input(z.object({ type: z.enum(["FOOD", "DRINK"]) }))
    .query(({ ctx, input }) => {
        return ctx.db.category.findMany({
            where: { type: input.type },
            include: { 
                items: {
                    orderBy: { name: "asc" }
                } 
            },
            orderBy: { name: "asc" }
        });
    }),

  // ==========================
  //      ITEM MUTATIONS
  // ==========================

  // 3. CREATE ITEM
  createItem: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      price: z.number().min(0, "Price cannot be negative"),
      categoryId: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menuItem.create({ 
        data: {
          name: input.name,
          price: input.price,
          categoryId: input.categoryId,
          isAvailable: true, // Default per schema
        },
      });
    }),

  // 4. UPDATE ITEM
  updateItem: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1),
      price: z.number().min(0),
      categoryId: z.string().min(1),
      isAvailable: z.boolean().optional(), // Allow updating availability here too
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menuItem.update({
        where: { id: input.id },
        data: {
          name: input.name,
          price: input.price,
          categoryId: input.categoryId,
          ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
        },
      });
    }),

  // 5. TOGGLE AVAILABILITY (Quick "Sold Out" switch)
  toggleAvailability: publicProcedure
    .input(z.object({ 
        id: z.string(), 
        isAvailable: z.boolean() 
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.menuItem.update({
            where: { id: input.id },
            data: { isAvailable: input.isAvailable }
        });
    }),

  // 6. DELETE ITEM
  deleteItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menuItem.delete({
        where: { id: input.id },
      });
    }),

  // ==========================
  //    CATEGORY MUTATIONS
  // ==========================

  // 7. CREATE CATEGORY
  createCategory: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      // Validating strictly here, even though DB allows any string
      type: z.enum(["FOOD", "DRINK"]), 
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.create({
        data: {
          name: input.name,
          slug: input.slug,
          type: input.type,
        },
      });
    }),

  // 8. UPDATE CATEGORY
  updateCategory: publicProcedure
    .input(z.object({
        id: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
        type: z.enum(["FOOD", "DRINK"]),
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.category.update({
            where: { id: input.id },
            data: {
                name: input.name,
                slug: input.slug,
                type: input.type,
            }
        });
    }),

  // 9. DELETE CATEGORY
  deleteCategory: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // WARNING: In your schema, `MenuItem` does NOT have `onDelete: Cascade`.
      // This mutation will FAIL if you try to delete a category that still has items.
      // You must delete the items first, or update your Schema.
      return ctx.db.category.delete({
        where: { id: input.id },
      });
    }),

});