import { MessageId } from "./message.ts";

export interface IdGenerator {
  generateId(): MessageId;
}

export class SequencialIdGenerator implements IdGenerator {
  #currentId: number;

  constructor(offset?: number) {
    this.#currentId = offset || 1;
  }

  generateId(): MessageId {
    if (this.#currentId >= Number.MAX_SAFE_INTEGER) {
      this.#currentId = 0;
    }

    return this.#currentId++;
  }
}
