import { IdGenerator, SequencialIdGenerator } from "./id_generator.ts";
import { MessageStream } from "./stream.ts";
import {
  isNotification,
  isRequest,
  isResponse,
  MessageId,
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from "./message.ts";
import { NotificationHandler, RequestHandler } from "./handler.ts";
import { Deferred, deferred } from "./deps.ts";

export type ConnectionStatus = "initialized" | "running" | "closed";

export class Connection {
  #msgIdGen: IdGenerator;
  #stream: MessageStream;
  #status: ConnectionStatus;
  #responseWaiting: Map<MessageId, Deferred<ResponseMessage>>;

  #requestHandler: RequestHandler;
  #notificationHandler: NotificationHandler;

  constructor(
    stream: MessageStream,
    reqHandler: RequestHandler,
    notifHandler: NotificationHandler,
  ) {
    this.#msgIdGen = new SequencialIdGenerator();
    this.#stream = stream;
    this.#status = "initialized";
    this.#responseWaiting = new Map();
    this.#requestHandler = reqHandler;
    this.#notificationHandler = notifHandler;
  }

  async notify(method: string, ...params: unknown[]): Promise<void> {
    const msg: NotificationMessage = {
      jsonrpc: "2.0",
      method: method,
      params: params,
    };
    await this.#stream.send(msg);
  }

  async call(method: string, ...params: unknown[]): Promise<ResponseMessage> {
    const msgId = this.#msgIdGen.generateId();
    const msg: RequestMessage = {
      jsonrpc: "2.0",
      id: msgId,
      method: method,
      params: params,
    };

    await this.#stream.send(msg);
    const v = deferred<ResponseMessage>();
    this.#responseWaiting.set(msgId, v);

    return v;
  }

  listen() {
    this.#status = "running";
    (async () => {
      while (this.#status !== "closed") {
        const messageResult = await this.#stream.receive();
        if (messageResult.isFailure()) {
          continue;
        }

        const message = messageResult.value;
        if (isResponse(message)) {
          const handler = this.#responseWaiting.get(message.id);
          if (handler) {
            handler.resolve(message);
            this.#responseWaiting.delete(message.id);
          }
          continue;
        }
        if (isRequest(message)) {
          const res = await this.#requestHandler.handle(message);
          await this.#stream.send(res);
          continue;
        }
        if (isNotification(message)) {
          this.#notificationHandler.handle(message);
          continue;
        }
      }
    })();
  }

  close() {
    this.#status = "closed";
  }
}
