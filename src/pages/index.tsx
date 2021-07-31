import React, { useRef, useEffect, useCallback, useState } from 'react'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-converter'
import '@tensorflow/tfjs-backend-webgl'
import Webcam from 'react-webcam'
import {
  createDetector,
  PoseDetector,
  SupportedModels,
  InputResolution,
} from '@tensorflow-models/pose-detection'
import { Render } from '../models/render'
import { isSafari } from 'react-device-detect'
import { useWindowDimensions } from '../hooks/useWindowDimensions'
import { RecordButton } from '../components/RecordButton'
import { RecordedVideo } from '../components/RecordedVideo'

export default function App() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modelName = SupportedModels.PoseNet

  const mediaRecorderRef = useRef<any>(null)
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([])
  const { width, height } = useWindowDimensions()

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
    const resolution: InputResolution = { width: 500, height: 500 }
    const detector = await createDetector(modelName, {
      quantBytes: 4,
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: resolution,
      multiplier: 0.75,
    })
    detect(detector)
  }

  const detect = async (detector: PoseDetector) => {
    if (webcamRef.current && canvasRef.current) {
      const webcamCurrent = webcamRef.current as any
      // go next step only when the video is completely uploaded.
      if (webcamCurrent.video.readyState === 4) {
        const video = webcamCurrent.video
        const videoWidth = webcamCurrent.video.videoWidth
        const videoHeight = webcamCurrent.video.videoHeight
        video.width = videoWidth
        video.height = videoHeight

        canvasRef.current.width = videoWidth
        canvasRef.current.height = videoHeight * 2

        const predictions = await detector.estimatePoses(video, {
          maxPoses: 1,
          flipHorizontal: false,
        })

        const ctx = canvasRef.current.getContext(
          '2d'
        ) as CanvasRenderingContext2D

        // ピクトグラム用のcanvas
        const pictCanvas = document.createElement('canvas')
        pictCanvas.width = videoWidth
        pictCanvas.height = videoHeight
        const picCanvasCtx = pictCanvas.getContext(
          '2d'
        ) as CanvasRenderingContext2D

        // 動画用のcanvas
        const videoCanvas = document.createElement('canvas')
        const videoCanvasCtx = videoCanvas.getContext(
          '2d'
        ) as CanvasRenderingContext2D
        videoCanvas.width = videoWidth
        videoCanvas.height = videoHeight
        videoCanvasCtx.drawImage(video, 0, 0, videoWidth, videoHeight)

        const rendering = new Render(modelName, picCanvasCtx)
        requestAnimationFrame(() => {
          rendering.drawResult(predictions[0])
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
    <div className="App">
      <header className="header">
        <div className="title">PICTOGRAM SAN</div>
      </header>
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
          zIndex: 9,
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
          zIndex: 9,
        }}
      />
      {recordedChunks.length > 0 && (
        <RecordedVideo recordedChunks={recordedChunks} />
      )}
    </div>
  )
}
