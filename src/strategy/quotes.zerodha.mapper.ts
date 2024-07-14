import { KiteConnect } from "kiteconnect";
import { Tick } from "src/live/live";

export const QuotesMapper = {
    toDomain: (zQuote: Awaited<ReturnType<KiteConnect['getLTP']>>): Record<Tradingsymbol, Tick> => {

        const domainQuotes: Record<string, { price: number; token: number }> = {};

        for (const [symbol, data] of Object.entries(zQuote)) {
            domainQuotes[symbol] = {
                price: data.last_price,
                token: data.instrument_token,
            };
        }

        return domainQuotes

    }
}