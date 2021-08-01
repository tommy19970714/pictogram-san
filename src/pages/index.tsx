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
import { RingBuffer } from '../models/RingBuffer'
import { isSafari } from 'react-device-detect'
import { useWindowDimensions } from '../hooks/useWindowDimensions'
import { RecordButton } from '../components/RecordButton'
import { RecordedVideo } from '../components/RecordedVideo'
import Loader from '../components/Loader'

export default function App() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const modelName = SupportedModels.PoseNet
  const ringBuffre = new RingBuffer()
  const mediaRecorderRef = useRef<any>(null)
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([])
  const { width, height } = useWindowDimensions()
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const getAudioTrack = () => {
    return new Promise<MediaStreamTrack>((resolve) => {
      const audioContext = new AudioContext()
      const audioElem = document.createElement('audio')
      const source = document.createElement('source')
      audioElem.appendChild(source)
      source.src = './pictogram-san_BGM.mp3'
      source.type = 'audio/mp3'
      audioElem.addEventListener('canplay', () => {
        audioElem.play()
        const audioSource = audioContext.createMediaElementSource(audioElem)
        const dist = audioContext.createMediaStreamDestination()
        audioSource.connect(dist)
        resolve(dist.stream.getTracks()[0])
      })
    })
  }

  useEffect(() => {
    handleStartDrawing()
  }, [])

  const handleStartCaptureClick = useCallback(async () => {
    const canvasStream = (canvasRef.current as any).captureStream(
      60
    ) as MediaStream
    const audio = audioRef.current
    canvasStream.addTrack(await getAudioTrack())
    mediaRecorderRef.current = new MediaRecorder(canvasStream, {
      mimeType: isSafari ? 'video/webm' : 'video/webm',
    })
    mediaRecorderRef.current.addEventListener(
      'dataavailable',
      handleDataAvailable
    )
    mediaRecorderRef.current.start()

    if (audio) {
      audio.play()
      // 音楽が終了したら止める
      audio.addEventListener('ended', function () {
        handleStopCaptureClick()
      })
    }
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
    const audio = audioRef.current
    if (audio) audio.pause()
    console.log(mediaRecorderRef?.current)
    mediaRecorderRef?.current?.stop()
  }, [mediaRecorderRef, webcamRef, recordedChunks])

  const videoConstraints = {
    width: width > height ? height / 2 : width,
    height: height / 2,
    facingMode: 'user',
  }

  const handleLoadWaiting = async () => {
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        if (webcamRef.current?.video?.readyState == 4) {
          resolve(true)
          clearInterval(timer)
        }
      }, 500)
    })
  }

  const handleStartDrawing = async () => {
    const resolution: InputResolution = { width: 500, height: 500 }
    const net = await createDetector(modelName, {
      quantBytes: 4,
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: resolution,
      multiplier: 0.75,
    })
    await handleLoadWaiting()
    if (webcamRef.current && canvasRef.current && net) {
      setIsLoaded(true)
      const webcam = webcamRef.current.video as HTMLVideoElement
      const canvas = canvasRef.current
      webcam.width = webcam.videoWidth
      webcam.height = webcam.videoHeight
      canvas.width = webcam.videoWidth
      canvas.height = webcam.videoHeight * 2
      const context = canvas.getContext('2d')
      if (context) {
        drawimage(net, webcam, context, canvas)
      }
    }
  }

  const drawimage = async (
    net: PoseDetector,
    webcam: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    ;(async function drawMask() {
      requestAnimationFrame(drawMask)
      const predictions = await net.estimatePoses(webcam, {
        maxPoses: 1,
        flipHorizontal: false,
      })
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = 'white'
      context.fillRect(0, 0, canvas.width, canvas.height)
      // ピクトグラム用のcanvas
      const pictCanvas = document.createElement('canvas')
      pictCanvas.width = webcam.width
      pictCanvas.height = webcam.height

      const rendering = new Render(modelName, context, ringBuffre)
      rendering.drawResult(predictions[0])
      context.drawImage(pictCanvas, 0, 0, webcam.width, webcam.height)
      context.drawImage(webcam, 0, webcam.height, webcam.width, webcam.height)
    })()
  }

  return (
    <div>
      <audio ref={audioRef} preload="true">
        <source src="./pictogram-san_BGM.mp3" type="audio/mp3" />
      </audio>
      <Webcam
        audio={false}
        videoConstraints={videoConstraints}
        ref={webcamRef}
        style={{
          position: 'absolute',
          margin: 'auto',
          textAlign: 'center',
          bottom: 0,
          left: 0,
          right: 0,
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
      <button onClick={handleStopCaptureClick}>停止（仮）</button>
      {!isLoaded && <Loader />}
    </div>
  )
}
