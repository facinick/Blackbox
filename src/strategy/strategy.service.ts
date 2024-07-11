import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import {
  DataService,
  MappedDerivative,
  MappedEquity,
} from 'src/data/data.service';
import { LiveService, Tick } from 'src/live/live.service';
import { PortfolioService } from 'src/portfolio/portfolio.service';
import { OnEvent } from '@nestjs/event-emitter';
import { LedgersService } from 'src/ledger/ledger.service';
import { Position } from 'src/portfolio/positions/positions';
import {
  ExecuteOrderDto,
  OrderManagerService,
} from 'src/order-manager/order-manager.service';
import { OrderTag } from 'src/order-manager/types';

enum STAGE {
  SCAN, // process price updates, check if decision can be made
  LOCK, // a decision can be made, so we won't process any more udpates.
}

@Injectable()
export class StrategyService {
  private tokens: Set<EquityToken | DerivativeToken> = new Set();
  private sExecStg: STAGE = STAGE.SCAN;

  private executionContext:
    | {
        equityToken: EquityToken;
        equityLTP: number;
        currentMonth: ExpiryMonth;
        equityInfo: MappedEquity;
        existingCallOptions: Position[];
        availableOTMCallOption: MappedDerivative;
        strategyTag: OrderTag;
        orders: ExecuteOrderDto[];
        cash: number;
        target: number;
      }
    | undefined = undefined;

  constructor(
    private readonly liveService: LiveService,
    private readonly apiService: ApiService,
    private readonly dataService: DataService,
    private readonly portfolioService: PortfolioService,
    private readonly ledgerService: LedgersService,
    private readonly orderManagerService: OrderManagerService,
  ) {}

  async initialize() {
    this.portfolioService
      .getHoldings()
      .forEach(({ token }) => this.tokens.add(token));
    this.liveService.subscribe(Array.from(this.tokens));
  }

  continue() {
    return this.sExecStg === STAGE.SCAN;
  }

  @OnEvent('tick')
  onPriceUpdate(tick: Tick): void {
    if (!this.tokens.has(tick.token)) {
      return;
    }

    if (!this.continue()) {
      return;
    }

    if (this.shouldMakeDecision(tick)) {
      // we are going to make a decision, don't let any more price updates to be processed
      this.sExecStg = STAGE.LOCK;
      this.excuteStrategy(tick);
    }
  }

  shouldMakeDecision({ price, token }: Tick): boolean {
    const positions = this.portfolioService.getPositions();

    const equity = this.dataService.getEquityInfoFromToken(token);

    // which position are we going to check?
    // whose underlying is equity
    const position = positions.filter(
      (position) => position.name === equity.tradingsymbol,
    )[0];

    // redundent check
    if (positions.length > 1) {
      console.log(
        `fatal error: cannot make a decision as there are multiple positions for the underlying: ${equity.tradingsymbol}`,
      );
      return false;
    }

    // LTP > CALL STRIKE + CALL PREMIUM
    if (
      price >
      DataService.parseDerivativeTradingSymbol(position.tradingsymbol).strike +
        position.averagePrice
    ) {
      return true;
    }

    return false;
  }

  private callSellPositionExists() {
    return this.executionContext.existingCallOptions.length > 0;
  }

  private tooCloseToExpiry() {
    return this.dataService.hasNDaysToExpiry(
      this.executionContext.availableOTMCallOption.tradingsymbol,
      3,
    );
  }

  private otmCallAvailable() {
    return this.executionContext.availableOTMCallOption;
  }

  private isDesirableOTMCallAvailable() {
    return this.otmCallAvailable() && !this.tooCloseToExpiry();
  }

  private getNetCash(strategyTag: OrderTag) {
    const ledger = this.ledgerService.getRecordByTag(strategyTag);

    let pnl = 0;

    for (const trade of ledger) {
      if (trade.buyOrSell === 'SELL') {
        pnl += trade.averagePrice * trade.quantity;
      }

      if (trade.buyOrSell === 'BUY') {
        pnl -= trade.averagePrice * trade.quantity;
      }
    }

    return pnl;
  }

  private getTarget(equityTradingsymbol: EquityTradingsymbol) {
    const holdings =
      this.portfolioService.getHoldingsForEquity(equityTradingsymbol);

    if (holdings.length === 0) {
      throw new Error(`no stocks exists for ${equityTradingsymbol}`);
    }

    return holdings[0].quantity * this.executionContext.equityLTP;
  }

  private updateStrategyContext({ token, price }: Tick) {
    const equityInfo = this.dataService.getEquityInfoFromToken(token);
    const month = DataService.getToday().month;

    this.executionContext = {
      equityToken: token,
      equityLTP: price,
      currentMonth: month,
      equityInfo,
      existingCallOptions:
        this.portfolioService.getCallPositionsForEquityAndMonth(
          equityInfo.tradingsymbol,
          month,
        ),
      availableOTMCallOption: this.dataService.getAvailableOTMCallOptionFor(
        equityInfo.tradingsymbol,
        DataService.getToday().month,
        price,
      ),
      strategyTag: this.getStrategyTag(equityInfo.tradingsymbol),
      orders: [],
      cash: this.getNetCash(this.getStrategyTag(equityInfo.tradingsymbol)),
      target: this.getTarget(equityInfo.tradingsymbol),
    };
  }

  private isTriggerHit() {
    const { strike } = DataService.parseDerivativeTradingSymbol(
      this.executionContext.existingCallOptions[0].tradingsymbol,
    );

    const premium = this.executionContext.existingCallOptions[0].averagePrice;

    if (this.executionContext.equityLTP >= strike + premium) {
      return true;
    }

    return false;
  }

  async excuteStrategy(tick: Tick) {
    this.updateStrategyContext(tick);

    if (this.callSellPositionExists()) {
      if (this.isTriggerHit()) {
        await this.exitCall();
        await this.resync(false, true, true);
      }
    } else {
      if (this.isDesirableOTMCallAvailable()) {
        await this.sellNewOTMCall();
        await this.resync(false, true, true);

        if (this.executionContext.cash < this.executionContext.target) {
          await this.sellEquity();
          await this.resync(true, false, true);
        }
      } else {
        await this.sellEquity();
        await this.resync(true, false, true);
      }
    }

    this.sExecStg = STAGE.SCAN;
  }

  private async resync(holdings, positions, balance) {
    await this.portfolioService.syncPortfolio({
      syncBalance: balance,
      syncPositions: positions,
      syncHoldings: holdings,
    });

    const ltpRecord = (
      await this.apiService.getDerivativeLtp(
        this.executionContext.availableOTMCallOption.tradingsymbol,
      )
    )[this.executionContext.equityToken];

    this.updateStrategyContext({
      token: ltpRecord.instrument_token,
      price: ltpRecord.last_price,
    });
  }

  private async sellNewOTMCall() {
    const ltpRecord = await this.apiService.getDerivativeLtp(
      this.executionContext.availableOTMCallOption.tradingsymbol,
    );
    const newOrder: ExecuteOrderDto = {
      tradingsymbol: this.executionContext.availableOTMCallOption.tradingsymbol,
      price:
        ltpRecord[this.executionContext.availableOTMCallOption.tradingsymbol]
          .last_price,
      quantity: this.executionContext.availableOTMCallOption.lotSize,
      buyOrSell: 'SELL',
      tag: this.executionContext.strategyTag,
    };
    this.executionContext.orders.push(newOrder);
    await this.orderManagerService.execute(this.executionContext.orders);
  }

  private async sellEquity() {
    const ltpRecord = await this.apiService.getDerivativeLtp(
      this.executionContext.availableOTMCallOption.tradingsymbol,
    );

    const quantity = Math.ceil(
      (this.executionContext.target - this.executionContext.cash) /
        this.executionContext.equityLTP,
    );

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: this.executionContext.availableOTMCallOption.tradingsymbol,
      price:
        ltpRecord[this.executionContext.availableOTMCallOption.tradingsymbol]
          .last_price,
      quantity,
      buyOrSell: 'SELL',
      tag: this.executionContext.strategyTag,
    };

    this.executionContext.orders.push(newOrder);
    await this.orderManagerService.execute(this.executionContext.orders);
  }

  private async exitCall() {
    const ltpRecord = await this.apiService.getDerivativeLtp(
      this.executionContext.availableOTMCallOption.tradingsymbol,
    );

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: this.executionContext.existingCallOptions[0].tradingsymbol,
      price:
        ltpRecord[this.executionContext.existingCallOptions[0].tradingsymbol]
          .last_price,
      quantity: this.executionContext.existingCallOptions[0].quantity,
      buyOrSell: 'BUY',
      tag: this.executionContext.strategyTag,
    };

    this.executionContext.orders.push(newOrder);

    await this.orderManagerService.execute(this.executionContext.orders);
  }

  private getStrategyTag(tradingsymbol: EquityTradingsymbol) {
    return `${tradingsymbol}_${DataService.getToday().month}`;
  }
}
