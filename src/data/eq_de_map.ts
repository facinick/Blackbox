export const EQ_DE_MAP: Record<EquityTradingsymbol, DerivativeName> = {
  TITAN: 'TITAN',
  ITC: 'ITC',
};

function getEquityTradingsymbolByDerivativeName(
  derivativeName: DerivativeName,
): EquityTradingsymbol | undefined {
  return Object.keys(EQ_DE_MAP).find(
    (key) => EQ_DE_MAP[key] === derivativeName,
  );
}

function getDerivativeNameByEquityTradingsymbol(
  equityTradingsymbol: EquityTradingsymbol,
): DerivativeName | undefined {
  return EQ_DE_MAP[equityTradingsymbol];
}

function equityTradingsymbolExists(equityTradingsymbol: EquityTradingsymbol) {
  return Object.keys(EQ_DE_MAP).includes(equityTradingsymbol);
}

function derivativeNameExists(derivativeName: DerivativeName) {
  return Object.values(EQ_DE_MAP).includes(derivativeName);
}

export {
  getEquityTradingsymbolByDerivativeName,
  getDerivativeNameByEquityTradingsymbol,
  equityTradingsymbolExists,
  derivativeNameExists,
};
