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
    const audioContext = new AudioContext()
    const t0 = audioContext.currentTime
    let t = 0
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'square'
    ;[440, 480, 440, 480, 420, 500, 420, 500].forEach((s) => {
      const vol = 1
      const hz = s
      const d = (60 / 80) * (4 / 4)
      const sm = d / 3 > 0.08 ? 0.08 : Number((d / 3).toFixed(5))
      oscillator.frequency.setValueAtTime(hz, t0 + t)
      gain.gain.setValueCurveAtTime([vol * 0.03, vol * 0.025], t0 + t, sm)
      gain.gain.setValueCurveAtTime(
        [vol * 0.025, vol * 0.01],
        t0 + t + d - sm,
        sm
      )
      t += d
    })
    oscillator.start(t0)
    oscillator.stop(t0 + t)
    oscillator.connect(gain)
    var dist = audioContext.createMediaStreamDestination()
    gain.connect(dist)
    return dist.stream.getTracks()[0]
  }

  const handleStartCaptureClick = useCallback(() => {
    const canvasStream = (canvasRef.current as any).captureStream(60)
    const audio = audioRef.current

    const ms = new MediaStream()
    ms.addTrack(canvasStream.getTracks()[0])
    ms.addTrack(getAudioTrack())
    // mediaRecorderRef.current = new MediaRecorder(canvasStream, {
    //   mimeType: isSafari ? 'video/webm' : 'video/webm',
    // })
    mediaRecorderRef.current = new MediaRecorder(ms)
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
        setIsLoaded(true)
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

        const rendering = new Render(modelName, ctx, ringBuffre)

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
    <div>
      <audio ref={audioRef} preload="true">
        <source src="./pictogram-san_BGM.mp3" type="audio/mp3" />
      </audio>
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
      <button onClick={handleStopCaptureClick}>停止（仮）</button>
      {!isLoaded && <Loader />}
    </div>
  )
}
