import { VSCodeStream } from "./stream.ts";
import { assertEquals, StringReader, StringWriter } from "./dev_deps.ts";
import { RequestMessage } from "./message.ts";

Deno.test("send message", async () => {
  const nopReader = {
    read: (_: Uint8Array): Promise<number | null> => Promise.resolve(null),
  };
  const w = new StringWriter();

  const stream = new VSCodeStream(nopReader, w);
  const msg: RequestMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "test",
  };
  await stream.send(msg);
  assertEquals(
    w.toString(),
    `Content-Length: 42

{"jsonrpc":"2.0","id":1,"method":"test"}
`.replaceAll(/\n/g, "\r\n"),
  );
});

Deno.test("receive message", async () => {
  const r = new StringReader(
    `
Content-Length: 8
Content-Type: application/vscode-jsonrpc; charset=utf-8

{"id":1}Content-Length: 8

{"id":2}
`.replaceAll(/\n/g, "\r\n"),
  );
  const nopWriter = { write: (): Promise<number> => Promise.resolve(0) };

  const stream = new VSCodeStream(r, nopWriter);
  let got = await stream.receive();
  assertEquals(got.isSuccess(), true);
  assertEquals(got.value, { id: 1 });

  got = await stream.receive();
  assertEquals(got.isSuccess(), true);
  assertEquals(got.value, { id: 2 });
});
