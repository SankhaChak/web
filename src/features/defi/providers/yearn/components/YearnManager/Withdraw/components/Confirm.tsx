import { Box, Stack } from '@chakra-ui/react'
import { ASSET_REFERENCE, toAssetId } from '@shapeshiftoss/caip'
import { Confirm as ReusableConfirm } from 'features/defi/components/Confirm/Confirm'
import { DefiParams, DefiQueryParams } from 'features/defi/contexts/DefiManagerProvider/DefiCommon'
import { useContext } from 'react'
import { useTranslate } from 'react-polyglot'
import { useHistory } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import { MiddleEllipsis } from 'components/MiddleEllipsis/MiddleEllipsis'
import { Row } from 'components/Row/Row'
import { Text } from 'components/Text'
import { useChainAdapters } from 'context/PluginProvider/PluginProvider'
import { useBrowserRouter } from 'hooks/useBrowserRouter/useBrowserRouter'
import { useWallet } from 'hooks/useWallet/useWallet'
import { bnOrZero } from 'lib/bignumber/bignumber'
import { chainTypeToMainnetChainId } from 'lib/utils'
import { selectAssetById, selectMarketDataById } from 'state/slices/selectors'
import { useAppSelector } from 'state/store'

import { WithdrawPath, YearnWithdrawActionType } from '../WithdrawCommon'
import { WithdrawContext } from '../WithdrawContext'

export const Confirm = () => {
  const { state, dispatch } = useContext(WithdrawContext)
  const translate = useTranslate()
  const history = useHistory()
  const { query, history: browserHistory } = useBrowserRouter<DefiQueryParams, DefiParams>()
  const chainAdapterManager = useChainAdapters()
  const { chain, contractAddress: vaultAddress, tokenId } = query
  const opportunity = state?.opportunity

  const chainId = chainTypeToMainnetChainId(chain)
  const assetNamespace = 'erc20'
  // Asset info
  const underlyingAssetId = toAssetId({
    chainId,
    assetNamespace,
    assetReference: tokenId,
  })
  const underlyingAsset = useAppSelector(state => selectAssetById(state, underlyingAssetId))
  const assetId = toAssetId({
    chainId,
    assetNamespace,
    assetReference: vaultAddress,
  })
  const asset = useAppSelector(state => selectAssetById(state, assetId))
  const feeAssetId = toAssetId({
    chainId,
    assetNamespace: 'slip44',
    assetReference: ASSET_REFERENCE.Ethereum,
  })
  const feeAsset = useAppSelector(state => selectAssetById(state, feeAssetId))
  const feeMarketData = useAppSelector(state => selectMarketDataById(state, feeAssetId))

  // user info
  const { state: walletState } = useWallet()

  if (!state || !dispatch) return null

  const handleConfirm = async () => {
    try {
      if (
        !(
          state.userAddress &&
          tokenId &&
          walletState.wallet &&
          supportsETH(walletState.wallet) &&
          opportunity
        )
      )
        return
      dispatch({ type: YearnWithdrawActionType.SET_LOADING, payload: true })
      const preparedTransaction = await opportunity.prepareWithdrawal({
        address: state.userAddress,
        amount: bnOrZero(state.withdraw.cryptoAmount).times(`1e+${asset.precision}`).integerValue(),
      })
      const chainAdapter = chainAdapterManager.byChain(ChainTypes.Ethereum)
      const txid = await opportunity.signAndBroadcast(
        { wallet: walletState.wallet, chainAdapter },
        preparedTransaction,
      )
      dispatch({ type: YearnWithdrawActionType.SET_TXID, payload: txid })
      history.push(WithdrawPath.Status)
    } catch (error) {
      console.error('YearnWithdraw:handleConfirm error', error)
    } finally {
      dispatch({ type: YearnWithdrawActionType.SET_LOADING, payload: false })
    }
  }

  const handleCancel = () => {
    browserHistory.goBack()
  }

  return (
    <ReusableConfirm
      onCancel={handleCancel}
      headerText='modals.confirm.withdraw.header'
      loading={state.loading}
      loadingText={translate('common.confirm')}
      onConfirm={handleConfirm}
      assets={[
        {
          ...asset,
          color: '#FFFFFF',
          cryptoAmount: state.withdraw.cryptoAmount,
          fiatAmount: state.withdraw.fiatAmount,
        },
        {
          ...underlyingAsset,
          color: '#FF0000',
          cryptoAmount: bnOrZero(state.withdraw.cryptoAmount)
            .times(bnOrZero(state.pricePerShare).div(`1e+${asset.precision}`))
            .toString(),
          fiatAmount: state.withdraw.fiatAmount,
        },
      ]}
    >
      <Stack spacing={6}>
        <Row>
          <Row.Label>
            <Text translation='modals.confirm.withdrawFrom' />
          </Row.Label>
          <Row.Value fontWeight='bold'>
            <Text translation='defi.yearn' />
          </Row.Value>
        </Row>
        <Row>
          <Row.Label>
            <Text translation='modals.confirm.withdrawTo' />
          </Row.Label>
          <Row.Value>
            <MiddleEllipsis address={state.userAddress || ''} />
          </Row.Value>
        </Row>
        <Row>
          <Row.Label>
            <Text translation='modals.confirm.estimatedGas' />
          </Row.Label>
          <Row.Value>
            <Box textAlign='right'>
              <Amount.Fiat
                fontWeight='bold'
                value={bnOrZero(state.withdraw.estimatedGasCrypto)
                  .div(`1e+${feeAsset.precision}`)
                  .times(feeMarketData.price)
                  .toFixed(2)}
              />
              <Amount.Crypto
                color='gray.500'
                value={bnOrZero(state.withdraw.estimatedGasCrypto)
                  .div(`1e+${feeAsset.precision}`)
                  .toFixed(5)}
                symbol={feeAsset.symbol}
              />
            </Box>
          </Row.Value>
        </Row>
      </Stack>
    </ReusableConfirm>
  )
}
