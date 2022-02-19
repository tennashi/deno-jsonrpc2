export type MessageId = string | number;

export interface Message {
  jsonrpc: "2.0";
}

export interface RequestMessage extends Message {
  id: MessageId;
  method: string;
  params?: unknown;
}

export function isRequest(msg: Message): msg is RequestMessage {
  return "id" in msg && "method" in msg;
}

export interface ResponseMessage extends Message {
  id: MessageId;
  result?: unknown;
  error?: ResponseError;
}

export interface ResponseError {
  code: number;
  message: string;
  data?: unknown;
}

export function isResponse(msg: Message): msg is ResponseMessage {
  return "id" in msg && !("method" in msg);
}

export interface NotificationMessage extends Message {
  method: string;
  params: unknown;
}

export function isNotification(msg: Message): msg is NotificationMessage {
  return !("id" in msg) && "method" in msg;
}

export const ParseError = -32700;
export const InvalidRequest = -32600;
export const MethodNotFound = -32601;
export const InvalidParams = -32602;
export const InternalError = -32603;
export const ServerNotInitialized = -32002;
export const UnknownErrorCode = -32001;

export class NotFoundError implements ResponseError {
  code: number;
  message: string;
  data: unknown;

  constructor(message?: string, data?: unknown) {
    this.code = MethodNotFound;
    if (!message) {
      message = "method not found";
    }
    this.message = message;
    this.data = data;
  }
}
