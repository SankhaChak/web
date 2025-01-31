import { createContext } from 'react'

import { CosmosDepositActions, CosmosDepositState } from './DepositCommon'

export interface IDepositContext {
  state: CosmosDepositState | null
  dispatch: React.Dispatch<CosmosDepositActions> | null
}

export const DepositContext = createContext<IDepositContext>({ state: null, dispatch: null })
