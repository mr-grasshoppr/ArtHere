import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { rateLimit } from "../rate-limit";

function req(ip: string): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    headers: { "x-real-ip": ip },
  });
}

describe("rateLimit", () => {
  it("allows up to the limit, then returns 429", () => {
    const opts = { limit: 3, windowSeconds: 60 };
    const bucket = `test-${Math.random()}`;
    expect(rateLimit(req("1.2.3.4"), bucket, opts)).toBeNull();
    expect(rateLimit(req("1.2.3.4"), bucket, opts)).toBeNull();
    expect(rateLimit(req("1.2.3.4"), bucket, opts)).toBeNull();
    const limited = rateLimit(req("1.2.3.4"), bucket, opts);
    expect(limited?.status).toBe(429);
  });

  it("tracks IPs independently", () => {
    const opts = { limit: 1, windowSeconds: 60 };
    const bucket = `test-${Math.random()}`;
    expect(rateLimit(req("10.0.0.1"), bucket, opts)).toBeNull();
    expect(rateLimit(req("10.0.0.2"), bucket, opts)).toBeNull();
    expect(rateLimit(req("10.0.0.1"), bucket, opts)?.status).toBe(429);
  });

  it("tracks buckets independently", () => {
    const opts = { limit: 1, windowSeconds: 60 };
    const a = `test-${Math.random()}`;
    const b = `test-${Math.random()}`;
    expect(rateLimit(req("9.9.9.9"), a, opts)).toBeNull();
    expect(rateLimit(req("9.9.9.9"), b, opts)).toBeNull();
  });
});
