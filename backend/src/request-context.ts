import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestPrincipal = { userId: string };

const storage = new AsyncLocalStorage<RequestPrincipal>();

export function withPrincipal<T>(principal: RequestPrincipal, callback: () => T): T {
  return storage.run(principal, callback);
}

export function currentUserId(): string | null {
  return storage.getStore()?.userId ?? null;
}
