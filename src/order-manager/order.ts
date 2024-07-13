type Order = {
  brokerOrderId: string;
  tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol;
  token: EquityToken | DerivativeToken;
  quantity: number;
  price: number;
  averagePrice: number;
  buyOrSell: BuyOrSell;
  exchange: Exchange;
  tag: string;
};

export { Order };
