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
        <script src="/__/firebase/8.8.1/firebase-app.js"></script>
        <script src="/__/firebase/8.8.1/firebase-analytics.js"></script>
        <script src="/__/firebase/init.js"></script>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
export default MyApp
