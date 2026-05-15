import { afterEach, describe, expect, it, vi } from "vitest";

import { generateUUID } from "../src/components/a2aPlayground/conversationGenerator";

const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");

function setCrypto(cryptoValue: Partial<Crypto> | undefined) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: cryptoValue,
  });
}

describe("A2A conversation UUID generation", () => {
  afterEach(() => {
    vi.restoreAllMocks();

    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, "crypto", originalCryptoDescriptor);
    } else {
      delete (globalThis as { crypto?: Crypto }).crypto;
    }
  });

  it("uses crypto.randomUUID when available", () => {
    const randomUUID = vi.fn(() => "123e4567-e89b-42d3-a456-426614174000");
    setCrypto({ randomUUID } as Partial<Crypto>);

    expect(generateUUID()).toBe("123e4567-e89b-42d3-a456-426614174000");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("falls back to crypto.getRandomValues without using Math.random", () => {
    const mathRandomSpy = vi.spyOn(Math, "random");
    const getRandomValues = vi.fn((target: Uint8Array) => {
      target.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      return target;
    });
    setCrypto({ getRandomValues } as Partial<Crypto>);

    expect(generateUUID()).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f");
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(mathRandomSpy).not.toHaveBeenCalled();
  });

  it("fails closed when browser crypto support is missing", () => {
    setCrypto(undefined);

    expect(() => generateUUID()).toThrow(/Secure UUID generation requires browser crypto support/);
  });
});
