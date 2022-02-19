import { SequencialIdGenerator } from "./id_generator.ts";
import { assertEquals } from "./dev_deps.ts";

Deno.test("generate sequential IDs", () => {
  const idGen = new SequencialIdGenerator();

  assertEquals(idGen.generateId(), 1);
  assertEquals(idGen.generateId(), 2);
  assertEquals(idGen.generateId(), 3);
  assertEquals(idGen.generateId(), 4);
});

Deno.test("reset when max value is reached", () => {
  const idGen = new SequencialIdGenerator(Number.MAX_SAFE_INTEGER - 2);

  assertEquals(idGen.generateId(), Number.MAX_SAFE_INTEGER - 2);
  assertEquals(idGen.generateId(), Number.MAX_SAFE_INTEGER - 1);
  assertEquals(idGen.generateId(), 0);
});
