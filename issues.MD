[] websocket disconnect

/Users/facinick/Repositories/blackbox/node_modules/.pnpm/kiteconnect@5.0.0/node_modules/kiteconnect/dist/lib/ticker.js:326
                    this.triggerDisconnect();
                         ^
TypeError: this.triggerDisconnect is not a function
    at Timeout.<anonymous> (/Users/facinick/Repositories/blackbox/node_modules/.pnpm/kiteconnect@5.0.0/node_modules/kiteconnect/dist/lib/ticker.js:326:26)
    at listOnTimeout (node:internal/timers:569:17)
    at processTimers (node:internal/timers:512:7)

    
[x] order handler has logger not defined, even "this" is not defined

PRODUCT_MIS: MIS
PRODUCT_CNC: CNC
PRODUCT_NRML: NRML
ORDER_TYPE_MARKET: MARKET
ORDER_TYPE_LIMIT: LIMIT
ORDER_TYPE_SLM: SL-M
ORDER_TYPE_SL: SL
VARIETY_REGULAR: regular
VARIETY_CO: co
VARIETY_AMO: amo
VARIETY_ICEBERG: iceberg
VARIETY_AUCTION: auction
TRANSACTION_TYPE_BUY: BUY
TRANSACTION_TYPE_SELL: SELL
VALIDITY_DAY: DAY
VALIDITY_IOC: IOC
VALIDITY_TTL: TTL
EXCHANGE_NSE: NSE
EXCHANGE_BSE: BSE
EXCHANGE_NFO: NFO
EXCHANGE_CDS: CDS
EXCHANGE_BCD: BCD
EXCHANGE_BFO: BFO
EXCHANGE_MCX: MCX
MARGIN_EQUITY: equity
MARGIN_COMMODITY: commodity
STATUS_CANCELLED: CANCELLED
STATUS_REJECTED: REJECTED
STATUS_COMPLETE: COMPLETE
GTT_TYPE_OCO: two-leg
GTT_TYPE_SINGLE: single
GTT_STATUS_ACTIVE: active
GTT_STATUS_TRIGGERED: triggered
GTT_STATUS_DISABLED: disabled
GTT_STATUS_EXPIRED: expired
GTT_STATUS_CANCELLED: cancelled
GTT_STATUS_REJECTED: rejected
GTT_STATUS_DELETED: deleted
POSITION_TYPE_DAY: day
POSITION_TYPE_OVERNIGHT: overnight
setSessionExpiryHook: function (cb) {
            this.session_expiry_hook = cb;
        }
invalidateRefreshToken: function (refresh_token) {
            return this._delete('api.token.invalidate', {
                api_key: this.api_key,
                refresh_token: refresh_token
            });
        }
api_key: qbpvv4bxneh2qv2y
root: https://api.kite.trade
timeout: 7000
debug: false
access_token: null
default_login_uri: https://kite.zerodha.com/connect/login
session_expiry_hook: null
requestInstance: function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  }