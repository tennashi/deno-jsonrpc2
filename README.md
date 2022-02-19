# jsonrpc2

A JSON-RPC 2.0 library for Deno

## Usage

```ts
import * as io from "https://deno.land/std/io/mod.ts";
import {
  Connection,
  NotificationMessage,
  NotificationRouter,
  RequestMessage,
  RequestRouter,
  ResponseMessage,
  VSCodeStream,
} from "https://deno.land/x/jsonrpc2/mod.ts";

const rr = new RequestRouter();
rr.registerFn("hello", (req: RequestMessage): Promise<ResponseMessage> => {
  const res: ResponseMessage = {
    jsonrpc: "2.0",
    id: req.id,
    result: "hello",
  };
  return Promise.resolve(res);
});

const nr = new NotificationRouter();
nr.registerFn("hello", (notif: NotificationMessage): Promise<void> => {
  console.log(notif);
  return Promise.resolve();
});

const r = new io.Buffer();
const w = new io.Buffer();
const stream = new VSCodeStream(r, w);
const conn = new Connection(stream, rr);
conn.listen();

conn.close();
```

## Acknowledgements
I used the following code as a reference.

* https://github.com/lambdalisue/deno-msgpack-rpc
* https://github.com/hrsh7th/deno-json-rpc
* https://pkg.go.dev/golang.org/x/tools/internal/jsonrpc2
