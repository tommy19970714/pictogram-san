import React, { useRef, useEffect, useCallback, useState } from 'react'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-converter'
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
  const [net, setNet] = useState<PoseNet>()

  useEffect(() => {
    load().then((net: PoseNet) => {
      setNet(net)
      setIsLoaded(true)
    })
  }, [])

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

  const clickHandler = async () => {
    if (webcamRef.current && canvasRef.current) {
      const webcam = webcamRef.current.video as HTMLVideoElement
      const canvas = canvasRef.current

      const videoWidth = webcam.videoWidth
      const videoHeight = webcam.videoHeight
      webcam.width = videoWidth
      webcam.height = videoHeight
      canvas.width = videoWidth
      canvas.height = videoHeight * 2

      const context = canvas.getContext('2d')
      if (net && context) {
        drawimage(net, webcam, context, canvas)
      }
    }
  }

  const drawimage = async (
    net: PoseNet,
    webcam: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    ;(async function drawMask() {
      requestAnimationFrame(drawMask)
      const prediction = await net.estimateSinglePose(webcam, {
        flipHorizontal: false,
      })
      context.clearRect(0, 0, canvas.width, canvas.height)

      // ピクトグラム用のcanvas
      const pictCanvas = document.createElement('canvas')
      pictCanvas.width = webcam.width
      pictCanvas.height = webcam.height

      // 動画用のcanvas
      const videoCanvas = document.createElement('canvas')
      const videoCanvasCtx = videoCanvas.getContext(
        '2d'
      ) as CanvasRenderingContext2D
      videoCanvas.width = webcam.width
      videoCanvas.height = webcam.height
      videoCanvasCtx.drawImage(webcam, 0, 0, webcam.width, webcam.height)

      const rendering = new Render(context, ringBuffre)
      rendering.drawResult(prediction)
      context.drawImage(pictCanvas, 0, 0, webcam.width, webcam.height)
      context.drawImage(
        videoCanvas,
        0,
        webcam.height,
        webcam.width,
        webcam.height
      )
    })()
  }

  return (
    <div>
      <button onClick={clickHandler}>ボタン</button>
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
