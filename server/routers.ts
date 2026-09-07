import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deleteCustomPromptStatesForUser, getPromptStatesForUser, upsertPromptStatesForUser } from "./db";

const promptStateInput = z.object({
  id: z.string().max(96),
  promptId: z.string().max(96),
  title: z.string().max(160),
  description: z.string().max(255),
  category: z.enum(["Strategy", "Writing", "Campaigns", "Build", "Visual"]),
  mode: z.enum(["blog", "email", "code", "image", "chat", "video"]),
  body: z.string(),
  isCustom: z.boolean(),
  isFavorite: z.boolean(),
  favoritePosition: z.number().int().min(0),
  recentPosition: z.number().int().min(0),
  lastUsedAt: z.number().nullable(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  promptState: router({
    list: protectedProcedure.query(({ ctx }) => getPromptStatesForUser(ctx.user.id)),
    sync: protectedProcedure
      .input(z.object({ states: z.array(promptStateInput).max(80) }))
      .mutation(async ({ ctx, input }) => {
        await upsertPromptStatesForUser(ctx.user.id, input.states.map((state) => ({
          ...state,
          lastUsedAt: state.lastUsedAt ? new Date(state.lastUsedAt) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })));
        return { success: true, count: input.states.length } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ promptIds: z.array(z.string().max(96)).min(1).max(20) }))
      .mutation(async ({ ctx, input }) => {
        await deleteCustomPromptStatesForUser(ctx.user.id, input.promptIds);
        return { success: true, count: input.promptIds.length } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
