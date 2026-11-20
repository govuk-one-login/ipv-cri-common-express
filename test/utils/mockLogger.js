import { vi } from "vitest";

export const mockLogger = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

export const mockGetLogger = vi.fn().mockReturnValue(mockLogger);
