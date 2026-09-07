// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    logout: vi.fn(),
  }),
}));

vi.mock("@/const", () => ({
  startLogin: vi.fn(),
}));

import Home from "./Home";

describe("Kamvai workspace composer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useRealTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it("fills the active mode with a useful starter prompt", async () => {
    await act(async () => {
      root.render(<Home />);
    });

    const prompt = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(prompt.value).toBe("");

    const inspireButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Inspire me"));
    expect(inspireButton).toBeTruthy();
    await act(async () => {
      inspireButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(prompt.value).toContain("South African creative studio");
  });

  it("renders a shaped output after a prompt is generated", async () => {
    await act(async () => {
      root.render(<Home />);
    });

    const prompt = container.querySelector("textarea") as HTMLTextAreaElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(prompt, "Write a warm launch story");
      prompt.dispatchEvent(new Event("input", { bubbles: true }));
      prompt.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const generateButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Generate")) as HTMLButtonElement;
    expect(generateButton.disabled).toBe(false);
    await act(async () => {
      generateButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => window.setTimeout(resolve, 750));
    });

    expect(container.textContent).toContain("The best tools do not make us louder");
    expect(container.textContent).toContain("Save draft");
  });
});
