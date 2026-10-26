import assert from "node:assert/strict";
import { test } from "node:test";
import { greeting } from "../src/lib/time";

const at = (iso: string) => greeting(Date.parse(iso));

test("saudação segue a hora de Campo Grande e sugere a ocasião do momento", () => {
  // 0h25 de segunda em Campo Grande ainda é domingo à noite.
  assert.deepEqual(
    at("2026-10-26T04:25:00Z"),
    { hello: "Boa noite", moment: "Domingo à noite", suggested: "encontro" },
  );
  assert.equal(at("2026-10-26T12:00:00Z").suggested, "cafe"); // segunda 8h
  assert.equal(at("2026-10-26T21:00:00Z").suggested, "happy-hour"); // segunda 17h
  assert.equal(at("2026-10-31T03:00:00Z").suggested, "pagode"); // sexta 23h
  assert.equal(at("2026-11-01T17:00:00Z").suggested, "familia"); // domingo 13h
});
