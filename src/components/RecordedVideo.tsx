import React, { useEffect, useRef, useState } from 'react'
import { isSafari } from 'react-device-detect'
import { DefaultButton, PinkButton } from '../components/Buttons'

export const RecordedVideo = (props: { recordedChunks: BlobPart[] }) => {
  const [videoUrl, setVideoUrl] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoStarted, setIsVideoStarted] = useState<boolean>(false)
  const blob = new Blob(props.recordedChunks, {
    type: isSafari ? 'video/mp4' : 'video/webm',
  })
  const url = URL.createObjectURL(blob)

  useEffect(() => {
    setVideoUrl(url)
  }, [])

  const startVideo = () => {
    const video = videoRef.current
    if (video) {
      video.play()
      setIsVideoStarted(true)
      video.addEventListener('ended', function () {
        setIsVideoStarted(false)
      })
    }
  }

  const saveVideo = () => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.download = url
    a.href = url
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    // styled-componentsで書くと動画再生ができないので、一旦styleベタ書きにしてる
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
      <video
        ref={videoRef}
        style={{
          maxWidth: '250px',
        }}
        controls
        src={videoUrl}
      />
      {!isVideoStarted && (
        <img
          src="/svgs/start.svg"
          alt="start"
          onClick={startVideo}
          style={{
            position: 'absolute',
            margin: 'auto',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            cursor: 'pointer',
          }}
        />
      )}
      <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
        <PinkButton>Try again</PinkButton>
        <DefaultButton onClick={saveVideo}>Save Video</DefaultButton>
      </div>
    </div>
  )
}
