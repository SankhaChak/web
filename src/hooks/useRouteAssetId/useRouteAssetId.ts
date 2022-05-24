import { AssetId } from '@shapeshiftoss/caip'
import { useEffect, useState } from 'react'
import { matchPath, useLocation } from 'react-router'

const foxAssetToAssetId: Record<any, any> = {
  fox: 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d',
  foxy: 'eip155:1/erc20:0xdc49108ce5c57bc3408c3a5e95f3d864ec386ed3',
}

export const useRouteAssetId = () => {
  const location = useLocation()
  const [assetId, setAssetId] = useState<AssetId>('')

  useEffect(() => {
    // Extract the chainId and assetSubId parts from an /assets route, see src/Routes/RoutesCommon.tsx
    const assetIdPathMatch = matchPath<{ chainId: string; assetSubId: string }>(location.pathname, {
      path: '/assets/:chainId/:assetSubId',
    })
    const foxPageAssetIdPathMatch = matchPath<{ foxAsset?: string }>(location.pathname, {
      path: '/fox/:foxAsset?',
    })

    if (foxPageAssetIdPathMatch) {
      const foxAsset = foxPageAssetIdPathMatch?.params?.foxAsset ?? 'fox'
      setAssetId(foxAssetToAssetId[foxAsset])
      return
    }

    if (assetIdPathMatch?.params) {
      const { chainId, assetSubId } = assetIdPathMatch.params

      // Reconstitutes the assetId from valid matched params
      const assetId = `${chainId}/${assetSubId}`
      setAssetId(assetId)
      return
    }
  }, [location.pathname])

  return assetId
}
