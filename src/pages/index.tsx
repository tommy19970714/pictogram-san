import React, { useRef, useEffect, useState } from 'react'
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
import { RenderUI } from '../models/renderUI'
import { KeypointsRingBuffer } from '../models/RingBuffer'
import { useWindowDimensions } from '../hooks/useWindowDimensions'
import Loader from '../components/Loader'
import { ORDERED_OLYMPIC_PICTOGRAMS_SVGS } from '../utils/OlympicPictograms'
import { DefaultButton, PinkButton } from '../components/Buttons'
import Modal from '../components/Modal'
import { Buttons, ReturnButton, SmallText } from '../styles/TopPage'
import { PhotoPreview } from '../components/PhotoPreview'

type Stage = 'loading' | 'ready' | 'moving' | 'share'

export default function App() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const modelName = SupportedModels.PoseNet
  const keypointsBuffre = new KeypointsRingBuffer(17, 2)
  const { width, height } = useWindowDimensions()
  const isPC = width > height
  const [stage, setStage] = useState<Stage>('loading')
  const [animationFrameId, setAnimationFrameId] = useState<number>(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [pictogramList, setPictogramList] = useState<string[]>(
    ORDERED_OLYMPIC_PICTOGRAMS_SVGS
  )
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
  const [pngURL, setPngURL] = useState<string>('')

  useEffect(() => {
    // setPictogramList(
    //   ORDERED_OLYMPIC_PICTOGRAMS_SVGS.sort(() => 0.5 - Math.random())
    // )
    handleStartDrawing(false, facingMode)
  }, [])

  const handleStartGame = () => {
    setStage('moving')
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      handleStartDrawing(true, facingMode)
    }
    setTimeout(() => {
      audioPlay()
    }, 3200)
  }

  const handleGameStartClick = () => {
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

  const handleFaceModeClick = () => {
    const mode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(mode)
    cancelAnimationFrame(animationFrameId)
    handleStartDrawing(false, mode)
  }

  const audioPlay = () => {
    const audio = audioRef.current
    if (audio) {
      audio.play()
      // 音楽が終了したら止める
      audio.addEventListener('ended', function () {
        cancelAnimationFrame(animationFrameId)
        if (audio) audio.pause()
        setStage('share')
      })
    }
  }

  const videoConstraints = {
    width: isPC ? height / 2 : width,
    height: height / 2,
    facingMode: facingMode,
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

  const handleStartDrawing = async (
    isGame: boolean,
    cameraMode: 'user' | 'environment'
  ) => {
    const resolution: InputResolution = { width: 256, height: 256 }
    const net = await createDetector(modelName, {
      quantBytes: 4, // 4
      architecture: 'ResNet50', // MobileNetV1
      outputStride: 16,
      inputResolution: resolution,
    })
    await handleLoadWaiting()
    if (webcamRef.current && canvasRef.current && net) {
      if (stage === 'loading') {
        setStage('ready')
      }
      const webcam = webcamRef.current.video as HTMLVideoElement
      const canvas = canvasRef.current
      webcam.width = webcam.videoWidth
      webcam.height = webcam.videoHeight
      canvas.width = isPC ? webcam.videoWidth : width
      canvas.height = isPC ? webcam.videoHeight * 2 : height
      const context = canvas.getContext('2d')

      const mirrorCanvas = document.createElement('canvas')
      mirrorCanvas.width = canvas.width
      mirrorCanvas.height = canvas.height
      const mirrorContext = mirrorCanvas.getContext('2d')

      if (context && mirrorContext) {
        if (cameraMode === 'user') {
          mirrorContext.scale(-1, 1)
          mirrorContext.translate(-canvas.width, 0)
        }
        drawimage(
          net,
          webcam,
          context,
          canvas,
          mirrorContext,
          mirrorCanvas,
          isGame
        )
      }
    }
  }

  const drawimage = async (
    net: PoseDetector,
    webcam: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mirrorContext: CanvasRenderingContext2D,
    mirrorCanvas: HTMLCanvasElement,
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

      const elapsedTime = Date.now() - startTime
      const renderUI = new RenderUI(context, canvas.width, canvas.height)
      if (elapsedTime > 40000 && elapsedTime < 41000) {
        const pngURL = canvas.toDataURL('image/png')
        setPngURL(pngURL)
      }
      if (renderUI.isSkip(elapsedTime)) {
        return
      }

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = 'white'
      context.fillRect(0, 0, canvas.width, canvas.height)
      mirrorContext.clearRect(0, 0, canvas.width, canvas.height)

      const render = new Render(modelName, mirrorContext, keypointsBuffre)
      render.drawResult(predictions[0])
      mirrorContext.drawImage(
        webcam,
        0,
        width > height ? webcam.height : canvas.height / 2,
        canvas.width,
        (canvas.height / 2) * (webcam.height / webcam.width)
      )
      context.drawImage(mirrorCanvas, 0, 0, canvas.width, canvas.height)

      if (isGame && elapsedTime < 44000) {
        renderUI.drawGameUI(elapsedTime, pictogramList)
      }
    })()
  }

  const TakePhoto = () => {
    cancelAnimationFrame(animationFrameId)
    const canvas = canvasRef.current
    if (canvas) {
      const pngURL = canvas.toDataURL('image/png')
      setPngURL(pngURL)
      setStage('share')
    }
  }

  return (
    <div>
      <audio ref={audioRef} preload="true">
        <source src="./pictogram_san_bgm.mp3" type="audio/mp3" />
      </audio>
      <Webcam
        audio={false}
        mirrored={true}
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
      {!isPC && (
        <ReturnButton
          src="/svgs/return-button.svg"
          alt="return"
          onClick={handleFaceModeClick}
        />
      )}
      {stage === 'ready' && (
        <Buttons>
          <PinkButton onClick={handleGameStartClick}>Start Game</PinkButton>
          <DefaultButton onClick={TakePhoto}>Take photo</DefaultButton>
        </Buttons>
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
        <PhotoPreview
          png={pngURL}
          clickTry={() => {
            setStage('ready')
            cancelAnimationFrame(animationFrameId)
            handleStartDrawing(false, facingMode)
          }}
        />
      )}
      {stage === 'loading' && <Loader />}
    </div>
  )
}
