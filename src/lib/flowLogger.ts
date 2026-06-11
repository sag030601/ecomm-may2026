type FlowEvent =
  | 'pre-login-route'
  | 'post-login-route'
  | 'cart-before-login'
  | 'cart-after-login'
  | 'cart-merge-result'
  | 'checkout-payload'
  | 'checkout-order-created'
  | 'auth-state-change';

export function flowLog(event: FlowEvent, data?: object): void {
  if (!import.meta.env.DEV) return;
  console.debug(`[flow:${event}]`, data ?? {});
}
