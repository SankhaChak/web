import { useEffect, useState } from 'react'
import { matchPath, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { Layout } from 'components/Layout/Layout'
import { useBrowserRouter } from 'hooks/useBrowserRouter/useBrowserRouter'
import { useWallet } from 'hooks/useWallet/useWallet'
import { ConnectWallet } from 'pages/ConnectWallet/ConnectWallet'
import { Flags } from 'pages/Flags/Flags'
import { PrivacyPolicy } from 'pages/Legal/PrivacyPolicy'
import { TermsOfService } from 'pages/Legal/TermsOfService'
import { NotFound } from 'pages/NotFound/NotFound'

import { PrivateRoute } from './PrivateRoute'

function useLocationBackground() {
  const location = useLocation<{ background: any }>()
  const background = location.state && location.state.background
  return { background, location }
}

export const Routes = () => {
  const { background, location } = useLocationBackground()
  const { connectDemo, state } = useWallet()
  const { appRoutes } = useBrowserRouter()
  const hasWallet = Boolean(state.walletInfo?.deviceId) || state.isLoadingLocalWallet
  const [shouldRedirectDemoRoute, setShouldRedirectDemoRoute] = useState(false)
  const matchDemoPath = matchPath<{ appRoute: string }>(location.pathname, {
    path: ['/demo/:appRoute(.+)', '/demo'],
  })

  useEffect(() => {
    if (!matchDemoPath && shouldRedirectDemoRoute) return setShouldRedirectDemoRoute(false)
    if (!matchDemoPath || state.isLoadingLocalWallet) return

    state.isDemoWallet ? setShouldRedirectDemoRoute(true) : connectDemo()
  }, [
    matchDemoPath,
    shouldRedirectDemoRoute,
    location.pathname,
    state.isDemoWallet,
    state.isLoadingLocalWallet,
    connectDemo,
  ])

  return (
    <Switch location={background || location}>
      <Route path='/demo'>
        {() => {
          return shouldRedirectDemoRoute ? (
            <Redirect
              from='/'
              to={
                matchDemoPath?.params?.appRoute ? `/${matchDemoPath.params.appRoute}` : '/dashboard'
              }
            />
          ) : null
        }}
      </Route>
      {appRoutes.map((route, index) => {
        const MainComponent = route.main
        return (
          <PrivateRoute key={index} path={route.path} exact hasWallet={hasWallet}>
            <Layout>{MainComponent && <MainComponent />}</Layout>
          </PrivateRoute>
        )
      })}
      <Route path='/connect-wallet'>
        <ConnectWallet />
      </Route>
      <Route path={'/legal/terms-of-service'}>
        <Layout>
          <TermsOfService />
        </Layout>
      </Route>
      <Route path={'/legal/privacy-policy'}>
        <Layout>
          <PrivacyPolicy />
        </Layout>
      </Route>
      <Route path='/flags'>
        <Layout>
          <Flags />
        </Layout>
      </Route>
      <Redirect from='/' to='/dashboard' />
      <Route component={NotFound} />
    </Switch>
  )
}
