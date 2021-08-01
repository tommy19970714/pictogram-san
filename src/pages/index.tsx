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
import { OLYMPIC_PICTOGRAMS_SVGS } from '../utils/OlympicPictograms'
import { DefaultButton } from '../components/Buttons'
import Modal from '../components/Modal'
import { SmallText } from '../styles/TopPage'

type Stage = 'loading' | 'ready' | 'moving' | 'share'

export default function App() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const modelName = SupportedModels.PoseNet
  const ringBuffre = new RingBuffer()
  const mediaRecorderRef = useRef<any>(null)
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([])
  const { width, height } = useWindowDimensions()
  const [stage, setStage] = useState<Stage>('loading')
  const [animationFrameId, setAnimationFrameId] = useState<number>()
  const [pictogramList, setPictogramList] = useState<string[]>(
    OLYMPIC_PICTOGRAMS_SVGS
  )
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)

  const getAudioTrack = () => {
    return new Promise<MediaStreamTrack>((resolve) => {
      const audioContext = new AudioContext()
      const audioElem = document.createElement('audio')
      const source = document.createElement('source')
      audioElem.appendChild(source)
      source.src = '/pictogram-san_BGM.mp3'
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
    setPictogramList(OLYMPIC_PICTOGRAMS_SVGS.sort(() => 0.5 - Math.random()))
    handleStartDrawing(false)
  }, [])

  const handleStartGame = () => {
    setStage('moving')
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      handleStartDrawing(true)
    }
    setTimeout(() => {
      handleStartCapture()
    }, 3200)
  }

  const handleRecordButtonClick = () => {
    setIsOpenModal(true)
    setStage('moving')
    const audio = audioRef.current
    if (audio) {
      audio.muted = true
      audio.play()
      audio.pause()
      audio.muted = false
      audio.currentTime = 0
    }
  }

  const handleStartClick = () => {
    setIsOpenModal(false)
    handleStartCapture()
    audioPlay()
    handleStartGame()
  }

  const audioPlay = () => {
    const audio = audioRef.current
    if (audio) {
      audio.play()
      // 音楽が終了したら止める
      audio.addEventListener('ended', function () {
        handleStopCapture()
      })
    }
  }

  // ビデオ録画開始
  const handleStartCapture = useCallback(async () => {
    const canvasStream = (canvasRef.current as any).captureStream(
      60
    ) as MediaStream
    canvasStream.addTrack(await getAudioTrack())
    mediaRecorderRef.current = new MediaRecorder(canvasStream, {
      mimeType: isSafari ? 'video/mp4' : 'video/webm',
    })
    mediaRecorderRef.current.addEventListener(
      'dataavailable',
      handleDataAvailable
    )
    mediaRecorderRef.current.start()
  }, [webcamRef, mediaRecorderRef])

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data))
      }
    },
    [setRecordedChunks]
  )

  const handleStopCapture = useCallback(() => {
    const audio = audioRef.current
    if (audio) audio.pause()
    mediaRecorderRef?.current?.stop()
    setStage('share')
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

  const handleStartDrawing = async (isGame: boolean) => {
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
      setStage('ready')
      const webcam = webcamRef.current.video as HTMLVideoElement
      const canvas = canvasRef.current
      webcam.width = webcam.videoWidth
      webcam.height = webcam.videoHeight
      canvas.width = webcam.videoWidth
      canvas.height = webcam.videoHeight * 2
      const context = canvas.getContext('2d')
      if (context) {
        drawimage(net, webcam, context, canvas, isGame)
      }
    }
  }

  const drawimage = async (
    net: PoseDetector,
    webcam: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    isGame: boolean
  ) => {
    const startTime = Date.now()
    ;(async function drawMask() {
      const id = requestAnimationFrame(drawMask)
      setAnimationFrameId(id)

      const predictions = await net.estimatePoses(webcam, {
        maxPoses: 1,
        flipHorizontal: false,
      })

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = 'white'
      context.fillRect(0, 0, canvas.width, canvas.height)

      const rendering = new Render(
        modelName,
        context,
        ringBuffre,
        canvas.width,
        canvas.height
      )
      rendering.drawResult(predictions[0])
      context.drawImage(webcam, 0, webcam.height, webcam.width, webcam.height)
      if (isGame) {
        const elapsedTime = Date.now() - startTime
        rendering.drawGameUI(elapsedTime, pictogramList)
      }
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
      {stage === 'ready' && (
        <RecordButton
          onClick={handleRecordButtonClick}
          style={{
            position: 'absolute',
            margin: 'auto',
            textAlign: 'center',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
      )}
      {isOpenModal && (
        <Modal closeModal={() => setIsOpenModal(false)}>
          <SmallText> This app has audio</SmallText>
          <img
            src="/svgs/audio-icon.svg"
            alt="audio"
            width={100}
            height={100}
          />
          <DefaultButton onClick={handleStartClick}>OK</DefaultButton>
        </Modal>
      )}
      {stage === 'share' && recordedChunks.length > 0 && (
        <RecordedVideo recordedChunks={recordedChunks} />
      )}
      {stage === 'loading' && <Loader />}
    </div>
  )
}
