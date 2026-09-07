import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getPromptStatesForUser: vi.fn(async () => []),
  upsertPromptStatesForUser: vi.fn(async () => undefined),
  deleteCustomPromptStatesForUser: vi.fn(async () => undefined),
}));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "prompt-state-test-user",
    email: "prompt-state@example.com",
    name: "Prompt State Tester",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("promptState router", () => {
  it("accepts an authenticated sync payload and returns its count", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.promptState.sync({
      states: [{
        id: "42-custom-example",
        promptId: "custom-example",
        title: "A saved prompt",
        description: "Saved by you",
        category: "Writing",
        mode: "blog",
        body: "Turn this note into a clear story.",
        isCustom: true,
        isFavorite: true,
        favoritePosition: 0,
        recentPosition: 0,
        lastUsedAt: Date.now(),
      }],
    });

    expect(result).toEqual({ success: true, count: 1 });
  });

  it("returns an empty state list when no server state exists", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.promptState.list();
    expect(result).toEqual([]);
  });

  it("accepts authenticated deletion of custom prompt IDs", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.promptState.remove({ promptIds: ["custom-example"] })).resolves.toEqual({ success: true, count: 1 });
  });
});
