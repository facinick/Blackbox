import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { ApiService } from "src/api/api.service";
import { DataService } from "src/data/data.service";

type Retry = {
    retrying: boolean
    originalPrice: number
    lstRetryPrice: number
    retryAttempts: number
    lastRetryAttemptTimestampMs: number
    errors: number
}

@Injectable()
class OrderManagarService {

    private MAX_DEVIATE_TICK_MULTIPLE = 3
    private MAX_RETRY_ATTEMPTS = 3

    private lock = false

    private readonly openOrders: Map<string, Order> = new Map()

    private readonly completedOrders: Map<string, Order> = new Map()

    private retry: Map<string, Retry> = new Map()

    private startTimeMs: number;
    private endTimeMs: number
    private orderManagerTimer: NodeJS.Timeout;

    constructor(
        private readonly apiService: ApiService,
        private readonly dataService: DataService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    public async execute(orders: Order[]) {

        if (this.lock) {
            console.log(`cannot place orders, order manager is locked.`);
            return;
        }

        this.start()

        console.log(`beginning order execution, count: ${orders}`)

        for (const order of orders) {
            this.eventEmitter.emit("order.new", order);
        }

        for (const order of orders) {
            try {
                await this.apiService.placeOrder(order);
                this.eventEmitter.emit("order.success", order);
            } catch (error) {
                console.error(`Failed to place order: ${order.id}`, error);
                this.eventEmitter.emit("order.failed", order);
            }
        }
    }

    private start() {
        this.lock = true
        this.startTimeMs = Date.now()

        clearInterval(this.orderManagerTimer)
        this.eventEmitter.emit("order-manager.locked", {})
        this.orderManagerTimer = setInterval(this.orderManagerTick, 1090)
    }

    private end() {
        this.lock = false
        this.endTimeMs = Date.now()

        this.printOrderSummary()

        clearInterval(this.orderManagerTimer)
        this.resetInstanceVariables()
        this.eventEmitter.emit("order-manager.unlocked", {})
    }

    private resetInstanceVariables() {
        this.openOrders.clear()
        this.completedOrders.clear()
        this.retry.clear()
        this.startTimeMs = 0
        this.endTimeMs = 0
        this.orderManagerTimer = null
    }

    private printOrderSummary() {
        console.log(`--- summary ---`)
        console.log(`time taken: ${this.endTimeMs - this.startTimeMs} ms`)
        console.log(`open orders:`)
        console.log(this.openOrders)
        console.log(`completed orders:`)
        console.log(this.completedOrders)
    }

    private async orderManagerTick() {

        // modify open orders every 15 seconds
        for (const [orderId, order] of this.openOrders) {
            if (this.shouldRetry(order)) {
                await this.managePendingOrder(order);
            }
        }

        // if no open orders, close om
        if (this.openOrders.size === 0) {
            this.end()
        }
    }

    private shouldRetry(order) {

        const retryInfo = this.retry.get(order.id)

        return (Date.now() - retryInfo.lastRetryAttemptTimestampMs > 15000)
    }

    private isNextPriceAllowed(order: Order, nextPrice: number, retryInfo: Retry, tickSize: number): boolean {
        const { originalPrice } = retryInfo;
        return order.buyOrSell === "BUY"
            ? nextPrice <= originalPrice + (this.MAX_DEVIATE_TICK_MULTIPLE * tickSize)
            : nextPrice >= originalPrice - (this.MAX_DEVIATE_TICK_MULTIPLE * tickSize);
    }

    // modify or cancel
    private async managePendingOrder(order: Order) {

        try {

            const retryInfo = this.retry.get(order.id);

            // retries exhausted, 15 seconds since last retry elapsed
            if (retryInfo.retryAttempts >= this.MAX_RETRY_ATTEMPTS) {
                await this.cancelOrder(order.id);
                return;
            }

            // TODO: include actual ask/bid price for nextPrice calculation
            // TODO: include adjusting price in multiples of tick
            const equityInfo = this.dataService.getEquityInfoFromToken(order.token);
            const nextPrice = order.buyOrSell === "BUY" ? retryInfo.lstRetryPrice + equityInfo.tickSize : retryInfo.lstRetryPrice - equityInfo.tickSize;
            const nextPriceAllowed = this.isNextPriceAllowed(order, nextPrice, retryInfo, equityInfo.tickSize);
    
            if (nextPriceAllowed) {
                retryInfo.lastRetryAttemptTimestampMs = Date.now();
                retryInfo.retryAttempts++;
                this.retry.set(order.id, retryInfo)
                // retries left, 15 seconds since last retry elapsed, can try new price
                await this.modifyOrder(order.id, nextPrice)
            } else {
                // retries left, 15 seconds since last retry elapsed, cannot try new price
                await this.cancelOrder(order.id)
            }
        }

        catch(error) {
            console.log(`error trying to manage order: ${order.id}`)
        }

    }

    private async cancelOrder(orderId: string) {
        return this.apiService.cancelOrder({ orderId })
    }

    private async modifyOrder(orderId: string, newPrice: number) {
        await this.apiService.modifyPrice({ orderId, price: newPrice })
    }

    @OnEvent(`ticker`)
    private handleTick() {

    }

    @OnEvent(`order.new`)
    private handleOrderNew(order: Order) {
        console.log(`order: ${order.id} ready to be placed`)
    }

    @OnEvent(`order.success`)
    private handleOrderSuccess(order: Order) {
        console.log(`order: ${order.id} placed successfully`)
    }

    @OnEvent(`order.failed`)
    private handleOrderDailed(order: Order) {
        console.log(`order: ${order.id} failed to be placed`)
    }

    @OnEvent(`order.open`)
    private handleOrderOpen(brokerOrderId: string, order: Order) {
        console.log(`order: ${order.id} open. brokerOrderId: ${brokerOrderId}`)
        this.openOrders.set(brokerOrderId, order)
    }

    @OnEvent(`order.complete`)
   private handleOrderCompleted(brokerOrderId: string, order: Order) {
        console.log(`order: ${order.id} completed. brokerOrderId: ${brokerOrderId}`)
        if (this.openOrders.has(brokerOrderId)) {
            this.openOrders.delete(brokerOrderId)
        }
        this.completedOrders.set(brokerOrderId, order)
    }

    @OnEvent(`order.cancelled`)
    private handleOrderCancelled(brokerOrderId: string, order: Order) {
        console.log(`order: ${order.id} cancelled. brokerOrderId: ${brokerOrderId}`)
        if (this.openOrders.has(brokerOrderId)) {
            this.openOrders.delete(brokerOrderId)
        }
    }
}

export { OrderManagarService }