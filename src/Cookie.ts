import { CookieStore, cookieStore as cookieStorePolyfill } from "cookie-store";

declare const cookieStore: CookieStore;
window.cookieStore ??= cookieStorePolyfill;

type InternalCookie = Awaited<ReturnType<CookieStore["get"]>>;

class SessionCookie {
  #data: InternalCookie;
  constructor(readonly name: string) {}
  async load() {
    this.#data = await cookieStore.get(this.name);
  }

  get expires() {
    return this.#data?.expires !== undefined ? this.#data.expires : 0;
  }
}

export const sessionCookie = new SessionCookie("session");
