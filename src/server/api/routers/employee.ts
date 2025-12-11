import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const employeeRouter = createTRPCRouter({
  // 1. Verify a PIN
  login: publicProcedure
    .input(z.object({ pin: z.string() }))
    .query(async ({ ctx, input }) => {
      const employee = await ctx.db.employee.findFirst({
        where: { pin: input.pin },
      });

      if (!employee) {
        return null; // Invalid PIN
      }

      return employee; // Return the employee data
    }),

  // 2. Get all employees (Optional, helpful for management later)
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.employee.findMany();
  }),
});