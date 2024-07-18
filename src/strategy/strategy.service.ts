import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { DataService } from 'src/data/data.service';
import { LiveService } from 'src/live/live.service';
import { PortfolioService } from 'src/portfolio/portfolio.service';
import { OnEvent } from '@nestjs/event-emitter';
import { LedgersService } from 'src/ledger/ledger.service';
import { DerivativePosition } from 'src/portfolio/positions/positions';
import {
  ExecuteOrderDto,
  OrderManagerService,
} from 'src/order-manager/order-manager.service';
import { Equity } from 'src/data/data';
import { Tick } from 'src/live/live';
import { AppLogger } from 'src/logger/logger.service';
import { clamp, Throttle, throttle } from 'src/utils';
import { Holding } from 'src/portfolio/holdings/holdings';

enum STAGE {
  SCAN, // process price updates, check if decision can be made
  LOCK, // a decision can be made, so we won't process any more udpates.
}

type ExecutionContext = {
  equity: Equity;
  existingCallOption: DerivativePosition;
  existingStocksQuantity: number;
  cash: number;
  month: ExpiryMonth;
};

@Injectable()
export class StrategyService {
  private readonly tokens: Set<EquityToken | DerivativeToken> = new Set();
  private sExecStg: STAGE = STAGE.SCAN;

  private readonly context: Map<EquityToken, ExecutionContext> = new Map();
  private currentToken: EquityToken | undefined;

  constructor(
    private readonly liveService: LiveService,
    private readonly apiService: ApiService,
    private readonly portfolioService: PortfolioService,
    private readonly ledgerService: LedgersService,
    private readonly orderManagerService: OrderManagerService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  initialize = async () => {
    this.portfolioService.getHoldings().forEach(({ token, tradingsymbol }) => {
      if (DataService.hasEquityInfo(tradingsymbol)) {
        this.tokens.add(token);
        this.updateCurrentToken(token);
        this.updateStrategyContext();
      }
    });
    this.liveService.subscribe(Array.from(this.tokens));
  };

  @OnEvent(LiveService.Events.Ticks)
  @Throttle(30_000)
  private onPriceUpdate(ticks: Tick[]): void {
    this.logger.debug(`Processing price update`, ticks);

    if (this.sExecStg === STAGE.LOCK) {
      this.logger.debug(`Strategy is locked, returning`);
      return;
    }

    for (const tick of ticks) {
      if (!this.tokens.has(tick.token)) {
        continue;
      }

      this.updateCurrentToken(tick.token);
      if (
        this.isAnyStrategyConditionTrue(tick.price) &&
        this.sExecStg === STAGE.SCAN
      ) {
        this.logger.log(
          `Strategy condition true for token: ${this.currentToken} at CMP: ${tick.price}`,
        );
        this.sExecStg = STAGE.LOCK;
        this.executeStrategy(tick);
        break;
      }
    }
  }

  private executeStrategy = async ({ price }: Tick) => {
    if (this.DECISION_CESellExists()) {
      if (this.DECISION_CESelltargetHit(price)) {
        await this.ACTION_ExitCESell(price);
        await this.resync(false, true, true);
        this.updateStrategyContext();
      }
    } else {
      if (this.DECISION_EnoughDaysToSellCE(price)) {
        await this.ACTION_SellCE(price);
        await this.resync(false, true, true);
        this.updateStrategyContext();

        if (this.DECISION_ShouldSellEquity(price)) {
          await this.ACTION_SellEquity(price);
          await this.resync(true, false, true);
          this.updateStrategyContext();
        }
      } else if (this.DECISION_ShouldSellEquity(price)) {
        await this.ACTION_SellEquity(price);
        await this.resync(true, false, true);
        this.updateStrategyContext();
      }
    }
  };

  private isAnyStrategyConditionTrue = (equityCmp: number) => {
    this.logger.debug(
      `Checking strategy condition for ${this.currentToken} at CMP: ${equityCmp}`,
    );
    if (this.DECISION_CESellExists()) {
      if (this.DECISION_CESelltargetHit(equityCmp)) {
        this.logger.debug(`Target hit for existing call sell`);
        return true;
      }
    } else {
      if (this.DECISION_EnoughDaysToSellCE(equityCmp)) {
        if (this.DECISION_ShouldSellEquity(equityCmp)) {
          this.logger.debug(
            `Sell stocks as not enough days to expiry and cash < target`,
          );
          return true;
        }
      } else if (this.DECISION_ShouldSellEquity(equityCmp)) {
        this.logger.debug(`Sell stocks for cash`);
        return true;
      }
    }
  };

  // DECISION BLOCKS ---------------------------------- //
  private DECISION_CESellExists = () => {
    this.logger.debug(`[DECISION BLOCK] Checking if call sell position exists`);
    const context = this.context.get(this.currentToken);

    const ceSellPosition = context.existingCallOption;

    if (ceSellPosition) {
      this.logger.log(`[DECISION BLOCK] Position exists`, ceSellPosition);
      return true;
    }

    this.logger.debug(`[DECISION BLOCK] Position doesn't exist`);
    return false;
  };

  private DECISION_CESelltargetHit = (equityCmp: number) => {
    this.logger.debug(`[DECISION BLOCK] Checking if call sell target is hit`);
    const context = this.context.get(this.currentToken);

    const ceSellPosition = context.existingCallOption;

    if (!ceSellPosition) {
      return false;
    }

    if (equityCmp > ceSellPosition.averagePrice + ceSellPosition.strike) {
      this.logger.log(
        `[DECISION BLOCK] Hit | EquityCmp > ceSellPosition.averagePrice + ceSellPosition.strike, ${equityCmp > ceSellPosition.averagePrice + ceSellPosition.strike}`,
      );
      return true;
    }

    return false;
  };

  private DECISION_EnoughDaysToSellCE = (equityCmp: number) => {
    this.logger.debug(
      `[DECISION BLOCK] Checking if enough days left till expiry`,
    );
    const context = this.context.get(this.currentToken);

    const availableOTMCallOption = DataService.getAvailableOTMCallOptionFor(
      context.equity.tradingsymbol,
      context.month,
      equityCmp,
    );

    if (!availableOTMCallOption) {
      this.logger.warn(
        `No OTM call options to sell for equity: ${this.currentToken} and for CMP: ${equityCmp}`,
      );
      return false;
    }

    if (
      !DataService.hasNPlusDaysToExpiry(availableOTMCallOption.tradingsymbol, 3)
    ) {
      this.logger.warn(
        `[DECISION BLOCK] Not enough days left to expiry of available OTM call option, can't sell`,
      );
      return false;
    }

    return true;
  };

  private DECISION_ShouldSellEquity = (equityCmp: number) => {
    const context = this.context.get(this.currentToken);

    const target = this.calculateTarget(
      context.existingStocksQuantity,
      equityCmp,
    );

    if (context.cash < target && context.existingStocksQuantity > 0) {
      return true;
    }

    return false;
  };
  // ---------------------------------- DECISION BLOCKS //

  // ACTION BLOCKS ---------------------------------- //
  private ACTION_SellCE = async (equityCmp: number) => {
    const context = this.context.get(this.currentToken);

    const availableOTMCallOption = DataService.getAvailableOTMCallOptionFor(
      context.equity.tradingsymbol,
      context.month,
      equityCmp,
    );

    if (!availableOTMCallOption) {
      this.logger.warn(
        `No OTM call options to sell for equity: ${this.currentToken} and for CMP: ${equityCmp}`,
      );
      return true;
    }

    const ltpRecord = await this.apiService.getDerivativeLtp([
      availableOTMCallOption.tradingsymbol,
    ]);

    const currentMonth = DataService.getToday().month;

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: context.existingCallOption.tradingsymbol,
      price: ltpRecord[availableOTMCallOption.tradingsymbol].price,
      quantity: availableOTMCallOption.lotSize,
      buyOrSell: 'SELL',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_CESELL`,
    };

    this.logger.log(`Order to execute:`, newOrder);

    await this.orderManagerService.execute([newOrder]);
  };

  private ACTION_ExitCESell = async (equityCmp: number) => {
    this.logger.debug(`Action exit CE sell`);
    const context = this.context.get(this.currentToken);

    if (!context.existingCallOption) {
      this.logger.warn(`No existing call option found, why trying to exit it?`);
      return;
    }

    const ltpRecord = await this.apiService.getDerivativeLtp([
      context.existingCallOption.tradingsymbol,
    ]);

    this.logger.debug(`CE latest price:`, ltpRecord);

    const currentMonth = DataService.getToday().month;

    this.logger.debug(`Building new order to exit call`);
    const newOrder: ExecuteOrderDto = {
      tradingsymbol: context.existingCallOption.tradingsymbol,
      price: ltpRecord[context.existingCallOption.tradingsymbol].price,
      quantity: Math.abs(context.existingCallOption.quantity),
      buyOrSell: 'BUY',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_SQOFF`,
    };

    this.logger.log(`Sending order to order manager:`, newOrder);

    await this.orderManagerService.execute([newOrder]);
  };

  private ACTION_SellEquity = async (equityCmp: number) => {
    const context = this.context.get(this.currentToken);

    const currentMonth = DataService.getToday().month;

    const target = this.calculateTarget(
      context.existingStocksQuantity,
      equityCmp,
    );

    const targetQuantity = clamp(
      Math.ceil((target - context.cash) / equityCmp),
      0,
      context.existingStocksQuantity,
    );

    if (targetQuantity === 0) {
      this.logger.warn(
        `Don't have enough stocks to sell for ${this.currentToken}, existing quantity: ${context.existingStocksQuantity}, need to sell: ${targetQuantity}`,
      );
      return;
    }

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: context.equity.tradingsymbol,
      price: equityCmp,
      quantity: targetQuantity,
      buyOrSell: 'SELL',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_EQSELL`,
    };

    await this.orderManagerService.execute([newOrder]);
  };
  // ---------------------------------- ACTION BLOCKS //

  private resync = async (holdings, positions, balance) => {
    await this.portfolioService.syncPortfolio({
      syncBalance: balance,
      syncPositions: positions,
      syncHoldings: holdings,
    });
  };

  private updateCurrentToken = (token: Token) => {
    this.logger.log(`Current token: ${token}`);
    this.currentToken = token;
  };

  private updateStrategyContext = async () => {
    const equityInfo = DataService.getEquityInfoFromToken(this.currentToken);

    const { tradingsymbol } = equityInfo;

    const month = DataService.getToday().month;
    const baseTag = `${tradingsymbol}_${month}`;

    const existingCallOption =
      this.portfolioService.getOpenCESellPositionForEquity(tradingsymbol);

    const quantity =
      this.portfolioService.getHoldingQuantityForEquity(tradingsymbol);
    const cash = this.calculateNetCash(baseTag);

    const context = {
      equity: equityInfo,
      existingCallOption,
      existingStocksQuantity: quantity,
      cash,
      month,
    };

    this.context.set(this.currentToken, context);
    this.logger.log(
      `Strategy context updated. Token: ${this.currentToken}, Context:`,
      context,
    );
  };

  private calculateNetCash = (baseTag: string) => {
    const trades = this.ledgerService.getTradesByTag(baseTag);

    let pnl = 0;

    for (const trade of trades) {
      if (trade.buyOrSell === 'SELL') {
        pnl += trade.averagePrice * trade.quantity;
      }

      if (trade.buyOrSell === 'BUY') {
        pnl -= trade.averagePrice * trade.quantity;
      }
    }

    return pnl;
  };

  private calculateTarget = (
    quantity: Holding['quantity'],
    lastPrice: Tick['price'],
  ) => {
    const target = quantity * lastPrice;
    return target;
  };
}
