import { Message } from "./message.ts";
import { Failure, Result, Success } from "./result.ts";

import { Buffer, writeAll } from "./deps.ts";

const ErrNoDataReceived = new Error("no data received yet");
const ErrMustSetContentLength = new Error("content-length must be set");

export interface MessageStream {
  send(message: Message): Promise<Result<void, Error>>;
  receive(): Promise<Result<Message, Error>>;
}
const contentPreceder = new TextEncoder().encode("\r\n\r\n");

const contentIndex = (d: Uint8Array): number => {
  const index = d.findIndex((c: number, i: number, d: Uint8Array) => {
    if (c === contentPreceder[0]) {
      return d.slice(i, i + contentPreceder.byteLength).toString() ===
        contentPreceder.toString();
    }

    return false;
  });

  if (index === -1) {
    return index;
  }

  return index + contentPreceder.byteLength;
};

export class VSCodeStream implements MessageStream {
  #encoder: TextEncoder;
  #decoder: TextDecoder;

  #readBuf: Buffer;

  #writer: Deno.Writer;
  #reader: Deno.Reader;

  constructor(reader: Deno.Reader, writer: Deno.Writer) {
    this.#encoder = new TextEncoder();
    this.#decoder = new TextDecoder();

    this.#readBuf = new Buffer();

    this.#reader = reader;
    this.#writer = writer;
  }

  async send(message: Message): Promise<Result<void, Error>> {
    const jsonStr = JSON.stringify(message);
    const contentLength = this.#encoder.encode(jsonStr + "\r\n").byteLength;
    await writeAll(
      this.#writer,
      this.#encoder.encode(
        `Content-Length: ${contentLength}\r\n\r\n${jsonStr}\r\n`,
      ),
    );
    return new Success(undefined);
  }

  async receive(): Promise<Result<Message, Error>> {
    let contentLength = 0;

    let headerReading = true;
    while (headerReading) {
      const data = this.#readBuf.bytes({ copy: false });
      const index = contentIndex(data);
      if (index === -1) {
        const readResult = await this.#readChunk();
        if (readResult.isFailure()) {
          return readResult;
        }
        continue;
      }

      const matched = this.#decoder.decode(data.slice(0, index)).match(
        /content-length:\s*(\d+)/i,
      );
      if (!matched) {
        return new Failure(ErrMustSetContentLength);
      }

      contentLength = parseInt(matched[1], 10);

      headerReading = false;
      this.#readBuf = new Buffer();
      await writeAll(this.#readBuf, data.slice(index));
    }

    for (const l = this.#readBuf.length; l < contentLength;) {
      await this.#readChunk();
    }

    const data = this.#readBuf.bytes({ copy: false });
    this.#readBuf = new Buffer();
    await writeAll(this.#readBuf, data.slice(contentLength));

    return new Success(
      JSON.parse(this.#decoder.decode(data.slice(0, contentLength))),
    );
  }

  async #readChunk(): Promise<Result<number, Error>> {
    const received = new Uint8Array(1024);
    const readBytes = await this.#reader.read(received);
    if (readBytes == null || readBytes === 0) {
      return new Failure(ErrNoDataReceived);
    }

    await writeAll(this.#readBuf, received);
    return new Success(readBytes);
  }
}
