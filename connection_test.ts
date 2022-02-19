import { VSCodeStream } from "./stream.ts";
import { assertEquals, Buffer } from "./dev_deps.ts";
import { Connection } from "./connection.ts";
import {
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from "./message.ts";

Deno.test("call", async () => {
  const p1 = new Buffer();
  const p2 = new Buffer();
  const serverStream = new VSCodeStream(p1, p2);
  const clientStream = new VSCodeStream(p2, p1);

  const h = (mes: RequestMessage): Promise<ResponseMessage> => {
    if (mes.method === "test") {
      const res: ResponseMessage = {
        jsonrpc: "2.0",
        id: mes.id,
        result: "hoge",
      };
      return Promise.resolve(res);
    }

    const res: ResponseMessage = {
      jsonrpc: "2.0",
      id: mes.id,
      error: {
        code: -32601,
        message: "not found",
      },
    };
    return Promise.resolve(res);
  };

  const nh = (_mes: NotificationMessage): Promise<void> => Promise.resolve();

  const serverConn = new Connection(serverStream, { handle: h }, {
    handle: nh,
  });
  const clientConn = new Connection(clientStream, { handle: h }, {
    handle: nh,
  });

  serverConn.listen();
  clientConn.listen();

  const res = await clientConn.call("test");

  clientConn.close();
  serverConn.close();

  assertEquals(res, { jsonrpc: "2.0", id: 1, result: "hoge" });
});
