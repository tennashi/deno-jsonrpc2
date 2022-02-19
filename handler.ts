import {
  NotFoundError,
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from "./message.ts";

export interface RequestHandler {
  handle: RequestHandlerFunc;
}

export interface NotificationHandler {
  handle: NotificationHandlerFunc;
}

export type RequestHandlerFunc = (
  mes: RequestMessage,
) => Promise<ResponseMessage>;

export type NotificationHandlerFunc = (
  mes: NotificationMessage,
) => Promise<void>;

export class RequestRouter implements RequestHandler {
  #handlers: Map<string, RequestHandler>;

  constructor() {
    this.#handlers = new Map();
  }

  handle(mes: RequestMessage): Promise<ResponseMessage> {
    const h = this.#handlers.get(mes.method);
    if (!h) {
      const res: ResponseMessage = {
        jsonrpc: "2.0",
        id: mes.id,
        error: new NotFoundError(`${mes.method} is not found`),
      };

      return Promise.resolve(res);
    }

    return h.handle(mes);
  }

  register(method: string, handler: RequestHandler) {
    this.#handlers.set(method, handler);
  }

  registerFn(method: string, handlerFn: RequestHandlerFunc) {
    const handler: RequestHandler = {
      handle: handlerFn,
    };
    this.#handlers.set(method, handler);
  }
}

export class NotificationRouter implements NotificationHandler {
  #handlers: Map<string, NotificationHandler>;

  constructor() {
    this.#handlers = new Map();
  }

  handle(mes: NotificationMessage): Promise<void> {
    const h = this.#handlers.get(mes.method);
    if (!h) {
      return Promise.resolve();
    }

    return h.handle(mes);
  }

  register(method: string, handler: NotificationHandler) {
    this.#handlers.set(method, handler);
  }

  registerFn(method: string, handlerFn: NotificationHandlerFunc) {
    const handler: NotificationHandler = {
      handle: handlerFn,
    };
    this.#handlers.set(method, handler);
  }
}
