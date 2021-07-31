import React, { useEffect, useRef, useState } from 'react'
import { isSafari } from 'react-device-detect'

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
    if (videoRef.current) {
      const video = videoRef.current
      video.play()
      setIsVideoStarted(true)
      video.addEventListener('ended', function () {
        setIsVideoStarted(false)
      })
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          margin: 'auto',
          textAlign: 'center',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9,
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
            textAlign: 'center',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9,
          }}
        />
      )}
    </>
  )
}
