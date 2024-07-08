import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ApiService } from "src/api/api.service";

export type ZOrderStatus = 'COMPLETE' | "REJECTED" | 'CANCELLED' | 'UPDATE' | 'OPEN'

export type ZOrderUpdate = {
    user_id: string;
    unfilled_quantity: number;
    app_id: number;
    checksum: string;
    placed_by: string;
    order_id: string;
    exchange_order_id: string | null;
    parent_order_id: string | null;
    status: ZOrderStatus | null;
    status_message: string | null;
    status_message_raw: string | null;
    order_timestamp: string;
    exchange_update_timestamp: string;
    exchange_timestamp: string;
    variety: string;
    exchange: string;
    tradingsymbol: string;
    instrument_token: number;
    order_type: string;
    transaction_type: string;
    validity: string;
    product: string;
    quantity: number;
    disclosed_quantity: number;
    price: number;
    trigger_price: number;
    average_price: number;
    filled_quantity: number;
    pending_quantity: number;
    cancelled_quantity: number;
    market_protection: number;
    meta: { [key: string]: any };
    tag: string | null;
    guid: string;
};

export type OrderStatus = ""

export type OrderUpdate = {
    orderId: string
    status: OrderStatus
    tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol
    token: EquityToken | DerivativeToken
    buyOrSell: BuyOrSell
    quantity: number
    price: number
    // only in case of complete order
    averagePrice: number
    tag: OrderTag
}

export interface ZTick {
    instrument_token: number
    last_price: number
}

export interface Tick {
    token: number
    price: number
}

@Injectable()
export class LiveService {

    private subscribedTokens: Set<EquityToken | DerivativeToken> = new Set()

    constructor(
        private readonly apiService: ApiService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async connect() {
        return new Promise((resolve, reject) => {
            this.apiService.registerForConnect(() => resolve)
            this.apiService.registerForPriceUpdates(this.handleTick)
            this.apiService.registerForOrderUpdates(this.handleOrderUpdate)
            this.apiService.registerForError(() => reject)
            this.apiService.connectTicker();
        });
    }

    private handleOrderUpdate(update: ZOrderUpdate) {
        switch (update.status) {
            case "OPEN": {

                const order: Order = {
                    id: update.order_id,
                    tradingsymbol: update.tradingsymbol,
                    token: update.instrument_token,
                    averagePrice: update.average_price,
                    quantity: update.quantity,
                    buyOrSell: update.transaction_type as BuyOrSell,
                    tag: update.tag,
                }

                this.eventEmitter.emit("order.open", update.order_id, order)

                break;
            }

            case "COMPLETE": {

                const order: Order = {
                    id: update.order_id,
                    tradingsymbol: update.tradingsymbol,
                    token: update.instrument_token,
                    averagePrice: update.average_price,
                    quantity: update.quantity,
                    buyOrSell: update.transaction_type as BuyOrSell,
                    tag: update.tag,
                }

                this.eventEmitter.emit("order.complete", update.order_id, order)

                break;
            }

            case "CANCELLED": {

                const order: Order = {
                    id: update.order_id,
                    tradingsymbol: update.tradingsymbol,
                    token: update.instrument_token,
                    averagePrice: update.average_price,
                    quantity: update.quantity,
                    buyOrSell: update.transaction_type as BuyOrSell,
                    tag: update.tag,
                }

                this.eventEmitter.emit("order.cancelled", update.order_id, order)

                break;
            }

            default: {
                console.log(update)
            }
        }
    }

    public subscribe(tokens: (EquityToken | DerivativeToken)[]) {

        for (const token of tokens) {
            if (this.subscribedTokens.has(token)) {
                continue
            }

            this.subscribedTokens.add(token)
            this.apiService.subscribeTicker([token])

        }
    }

    public unSubscribe(tokens: (EquityToken | DerivativeToken)[]) {

        for (const token of tokens) {
            if (this.subscribedTokens.has(token)) {
                this.subscribedTokens.delete(token)
                this.apiService.unsubscribeTicker([token])
            }
        }
    }

    private handleTick(tick: ZTick) {

        const _tick: Tick = {
            token: tick.instrument_token,
            price: tick.last_price
        }

        this.eventEmitter.emit("tick", _tick)
    }

}