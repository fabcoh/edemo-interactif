import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });

      const hashedPassword = await bcrypt.hash(input.password, 10);
      await db.insert(users).values({ email: input.email, password: hashedPassword, name: input.name, loginMethod: "email", role: "user" });

      const [newUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const token = jwt.sign({ userId: newUser.id, email: newUser.email }, ENV.jwtSecret, { expiresIn: "7d" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return { success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user || !user.password) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });

      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      const token = jwt.sign({ userId: user.id, email: user.email }, ENV.jwtSecret, { expiresIn: "7d" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    }),

  me: publicProcedure.query(({ ctx }) => ctx.user || null),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
