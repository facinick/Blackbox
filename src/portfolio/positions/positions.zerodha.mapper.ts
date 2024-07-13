import { KiteConnect } from "kiteconnect";
import { Position } from "./Positions";

export const PositionsMapper = {
    toDomain: (zPosition: Awaited<ReturnType<KiteConnect['getPositions']>>['net'][number]): Position => {

        const tradingsymbol = zPosition.tradingsymbol
        const averagePrice = zPosition.average_price
        const quantity = zPosition.quantity
        const token = zPosition.instrument_token
        const exchange = zPosition.exchange as Exchange // todo: use value objects to verify if its supported exchange
        const product = zPosition.product as Product

        return {
            tradingsymbol,
            averagePrice,
            quantity,
            token,
            exchange,
            product
        };
    }
}