import { OrderId, OrderTag } from "src/order-manager/types";

type Ledger = {
  id: OrderId;
  tradingsymbol: Tradingsymbol;
  token: Token;
  averagePrice: number;
  quantity: number;
  instrumentType: InstrumentType;
  segment: Segment;
  exchange: Exchange;
  buyOrSell: BuyOrSell;
  tag: OrderTag;
};

export { Ledger };
