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
import { useWindowDimensions } from '../hooks/useWindowDimensions'
import { RecordButton } from '../components/RecordButton'
import Loader from '../components/Loader'
import { OLYMPIC_PICTOGRAMS_SVGS } from '../utils/OlympicPictograms'
import { DefaultButton } from '../components/Buttons'
import Modal from '../components/Modal'
import { SmallText } from '../styles/TopPage'
import { PhotoPreview } from '../components/PhotoPreview'

type Stage = 'loading' | 'ready' | 'moving' | 'share'

export default function App() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const modelName = SupportedModels.PoseNet
  const ringBuffre = new RingBuffer()
  const { width, height } = useWindowDimensions()
  const [stage, setStage] = useState<Stage>('loading')
  const [animationFrameId, setAnimationFrameId] = useState<number>()
  const [pictogramList, setPictogramList] = useState<string[]>(
    OLYMPIC_PICTOGRAMS_SVGS
  )
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
  const [pngURL, setPngURL] = useState<string>('')

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
      audioPlay()
    }, 3200)
  }

  const handleRecordButtonClick = () => {
    setIsOpenModal(true)
    const audio = audioRef.current
    if (audio) {
      audio.muted = true
      audio.currentTime = 0
      audio.play()
      audio.pause()
      audio.muted = false
      audio.currentTime = 0
    }
  }

  const handleStartClick = () => {
    setIsOpenModal(false)
    handleStartGame()
  }

  const audioPlay = () => {
    const audio = audioRef.current
    if (audio) {
      audio.play()
      // 音楽が終了したら止める
      audio.addEventListener('ended', function () {
        if (audio) audio.pause()
        setStage('share')
      })
    }
  }

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

      const elapsedTime = Date.now() - startTime
      if (isGame && elapsedTime < 31000) {
        rendering.drawGameUI(elapsedTime, pictogramList)
        if (elapsedTime > 26000 && elapsedTime < 27000) {
          const pngURL = canvas.toDataURL('image/png')
          setPngURL(pngURL)
        }
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
      {stage === 'share' && (
        <PhotoPreview png={pngURL} clickTry={() => setStage('ready')} />
      )}
      {stage === 'loading' && <Loader />}
    </div>
  )
}
