import React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, maximum-scale=1, width=device-width"
        />
        <title>Pictogram-san Challenge</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
export default MyApp
