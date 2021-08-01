import React, { useRef, useEffect, useCallback, useState } from 'react'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import Webcam from 'react-webcam'
import { Render } from '../models/render'
import { RingBuffer } from '../models/RingBuffer'
import { isSafari } from 'react-device-detect'
import { useWindowDimensions } from '../hooks/useWindowDimensions'
import { RecordButton } from '../components/RecordButton'
import { RecordedVideo } from '../components/RecordedVideo'
import Loader from '../components/Loader'
import { PoseNet, load } from '@tensorflow-models/posenet'

export default function App() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ringBuffre = new RingBuffer()
  const mediaRecorderRef = useRef<any>(null)
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([])
  const { width, height } = useWindowDimensions()
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const handleStartCaptureClick = useCallback(() => {
    const canvasStream = (canvasRef.current as any).captureStream(60)
    mediaRecorderRef.current = new MediaRecorder(canvasStream, {
      mimeType: isSafari ? 'video/mp4' : 'video/webm',
    })
    mediaRecorderRef.current.addEventListener(
      'dataavailable',
      handleDataAvailable
    )
    mediaRecorderRef.current.start()
    // とりあえず3秒後に止めるようにする
    setTimeout(() => {
      handleStopCaptureClick()
    }, 3000)
  }, [webcamRef, mediaRecorderRef])

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data))
      }
    },
    [setRecordedChunks]
  )

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef?.current?.stop()
  }, [mediaRecorderRef, webcamRef, recordedChunks])

  const videoConstraints = {
    width: width > height ? height / 2 : width,
    height: height / 2,
    facingMode: 'user',
  }

  const runPoseDetect = async () => {
    const model: PoseNet = await load()
    detect(model)
  }

  const detect = async (detector: PoseNet) => {
    if (webcamRef.current && canvasRef.current) {
      const webcamCurrent = webcamRef.current as any
      // go next step only when the video is completely uploaded.
      if (webcamCurrent.video.readyState === 4) {
        setIsLoaded(true)
        const video = webcamCurrent.video
        const videoWidth = webcamCurrent.video.videoWidth
        const videoHeight = webcamCurrent.video.videoHeight
        video.width = videoWidth
        video.height = videoHeight

        canvasRef.current.width = videoWidth
        canvasRef.current.height = videoHeight * 2

        const prediction = await detector.estimateSinglePose(video, {
          flipHorizontal: false,
        })

        const ctx = canvasRef.current.getContext(
          '2d'
        ) as CanvasRenderingContext2D

        // ピクトグラム用のcanvas
        const pictCanvas = document.createElement('canvas')
        pictCanvas.width = videoWidth
        pictCanvas.height = videoHeight

        // 動画用のcanvas
        const videoCanvas = document.createElement('canvas')
        const videoCanvasCtx = videoCanvas.getContext(
          '2d'
        ) as CanvasRenderingContext2D
        videoCanvas.width = videoWidth
        videoCanvas.height = videoHeight
        videoCanvasCtx.drawImage(video, 0, 0, videoWidth, videoHeight)

        const rendering = new Render(ctx, ringBuffre)

        requestAnimationFrame(() => {
          rendering.drawResult(prediction)
          ctx.drawImage(pictCanvas, 0, 0, videoWidth, videoHeight)
          ctx.drawImage(videoCanvas, 0, videoHeight, videoWidth, videoHeight)
        })
        await detect(detector)
      } else {
        setTimeout(() => {
          detect(detector)
        }, 100)
      }
    }
  }

  useEffect(() => {
    runPoseDetect()
  }, [])

  return (
    <div>
      <Webcam
        audio={false}
        videoConstraints={videoConstraints}
        ref={webcamRef}
        style={{
          display: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          margin: 'auto',
          textAlign: 'center',
          top: 0,
          left: 0,
          right: 0,
        }}
      />
      <RecordButton
        onClick={handleStartCaptureClick}
        style={{
          position: 'absolute',
          margin: 'auto',
          textAlign: 'center',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />
      {recordedChunks.length > 0 && (
        <RecordedVideo recordedChunks={recordedChunks} />
      )}
      {!isLoaded && <Loader />}
    </div>
  )
}
