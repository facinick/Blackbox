import { KiteConnect } from 'kiteconnect'
import { Balance } from './Balances'

export const BalancesMapper = {
  toDomain: (
    margins: Awaited<ReturnType<KiteConnect['getMargins']>>,
  ): Balance => {
    const { available } = margins.equity

    const cash = available.cash

    const openingBalance = available.opening_balance

    const liveBalance = available.live_balance

    const adhocMargin = available.adhoc_margin

    return {
      cash,
      openingBalance,
      // liveBalance,
      // adhocMargin,
    }
  },
}
