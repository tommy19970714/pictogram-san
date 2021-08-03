import React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, maximum-scale=1, width=device-width"
        />
        <meta
          name="description"
          content="AIのちからでTOKYOオリンピックのピクトグラムさんになれるアプリ"
        />
        <meta
          name="keywords"
          content="pictogram-san, pictogram challenge, ピクトグラムさん, ピクトグラムチャレンジ"
        />
        <meta property="og:url" content="https://pictogram-san.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Pictogram Challenge" />
        <meta
          property="og:description"
          content="AIのちからでTOKYOオリンピックのピクトグラムさんになれるアプリ"
        />
        <meta property="og:site_name" content="Pictogram Challenge" />
        <meta property="og:image" content="https://pictogram-san/ogp.png" />
        <title>Pictogram Challenge</title>
        <link href="http://fonts.googleapis.com/earlyaccess/notosansjp.css"></link>
      </Head>
      <Component {...pageProps} />
      <Script src="/__/firebase/8.7.1/firebase-app.js" />
      <Script src="/__/firebase/8.7.1/firebase-analytics.js" />
      <Script src="/__/firebase/init.js" />
    </>
  )
}
export default MyApp
