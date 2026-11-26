import { act, renderHook } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { useScrollState } from "@/hooks/use-scroll-state";

beforeAll(() => {
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    configurable: true,
    value: () => undefined,
  });
});

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    writable: true,
    value: y,
  });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("useScrollState", () => {
  it("starts at the top with no direction", () => {
    scrollTo(0);
    const { result } = renderHook(() => useScrollState());

    expect(result.current.direction).toBe("none");
    expect(result.current.isAtTop).toBe(true);
    expect(result.current.hasScrolledPast).toBe(false);
  });

  it("reports downward scrolling past the threshold", () => {
    scrollTo(0);
    const { result } = renderHook(() => useScrollState());

    scrollTo(420);

    expect(result.current.direction).toBe("down");
    expect(result.current.hasScrolledPast).toBe(true);
    expect(result.current.isAtTop).toBe(false);
  });

  it("reports upward scrolling and drops compact mode near the top", () => {
    scrollTo(420);
    const { result } = renderHook(() => useScrollState());

    scrollTo(200);

    expect(result.current.direction).toBe("up");
    expect(result.current.hasScrolledPast).toBe(false);
    expect(result.current.isAtTop).toBe(false);
  });

  it("ignores jitter below the direction threshold", () => {
    scrollTo(400);
    const { result } = renderHook(() => useScrollState());

    scrollTo(405);

    expect(result.current.direction).toBe("none");
    expect(result.current.scrollY).toBe(405);
  });
});
