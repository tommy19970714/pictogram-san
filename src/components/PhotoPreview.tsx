import React from 'react'
import Link from 'next/link'
import { DefaultButton, PinkButton, BlueButton } from '../components/Buttons'

export const PhotoPreview = (props: { png: string; clickTry: () => void }) => {
  const { png, clickTry } = props

  const saveAsImage = () => {
    const downloadLink = document.createElement('a')
    if (typeof downloadLink.download === 'string') {
      downloadLink.href = png
      downloadLink.download = 'pictogram-challenge.png'
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    } else {
      window.open(png)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        margin: 'auto',
        textAlign: 'center',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '25px',
          color: '#0a2569',
          margin: 0,
        }}
      >
        Pictogram-san
        <br />
        Challenge
      </h2>
      <img
        src={png}
        style={{
          maxWidth: '250px',
        }}
      />
      <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
        <PinkButton onClick={clickTry}>Try again</PinkButton>
        <DefaultButton onClick={saveAsImage}>Save Photo</DefaultButton>
      </div>
      <Link
        href={
          'https://twitter.com/intent/tweet?text=' +
          'ピクトグラムチャレンジやってみた！%0D%0A' +
          '&hashtags=PictogramChallenge' +
          '&url=https://pictogram-san.com'
        }
        passHref
      >
        <BlueButton
          style={{
            marginTop: '10px',
          }}
        >
          Tweet
        </BlueButton>
      </Link>
    </div>
  )
}
