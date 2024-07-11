type OrderId = string;
type OrderTag = string;
type Order = {
  id: OrderId;
  tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol;
  token: EquityToken | DerivativeToken;
  quantity: number;
  price: number;
  averagePrice: number;
  buyOrSell: BuyOrSell;
  segment: Segment;
  exchange: Exchange;
  tag: OrderTag;
};

export { OrderId, OrderTag, Order };
