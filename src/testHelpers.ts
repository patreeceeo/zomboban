import { Mock } from "node:test";

export function getMock<F extends (...args: any[]) => any>(fn: F) {
  return (fn as Mock<F>).mock;
}
