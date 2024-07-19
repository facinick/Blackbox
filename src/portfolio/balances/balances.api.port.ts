import { Balance } from './Balances'

interface BalancesApiPort {
  getBalance: () => Promise<Balance>
}

export { BalancesApiPort }
