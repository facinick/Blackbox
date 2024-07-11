type Position = {
  name: DerivativeName;
  tradingsymbol: DerivativeTradingsymbol;
  token: DerivativeToken;
  quantity: number;
  averagePrice: number;
  buyOrSell: BuyOrSell;
  expiry: DerivativeExpiry;
};

export { Position };
