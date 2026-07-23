import { describe, it, expect } from "vitest";
import { parseModelJson } from "../model-json";

describe("parseModelJson", () => {
  it("parses clean JSON", () => {
    expect(parseModelJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips ```json fences", () => {
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("strips bare ``` fences", () => {
    expect(parseModelJson('```\n[1,2,3]\n```')).toEqual([1, 2, 3]);
  });

  it("extracts the first JSON block from surrounding prose", () => {
    expect(parseModelJson('Here is the result: {"ok":true} Hope that helps!')).toEqual({ ok: true });
  });

  it("throws when no JSON exists", () => {
    expect(() => parseModelJson("no json here")).toThrow(/no parseable JSON/);
  });
});
