import { useRef, useEffect, useState, useCallback } from "react";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";
import {
  createDetector,
  PoseDetector,
  SupportedModels,
  InputResolution,
} from "@tensorflow-models/pose-detection";
import { Rendering } from "./models/rendering";

export default function App() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelName = SupportedModels.PoseNet;

  const mediaRecorderRef = useRef<MediaRecorder>(null);
  const [capturing, setCapturing] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [video, setVideo] = useState<string>("");

  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    const canvasStream = (canvasRef.current as any).captureStream();
    mediaRecorderRef.current = new MediaRecorder(canvasStream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcamRef, setCapturing, mediaRecorderRef]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  const handleDownload = useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: "video/webm",
      });
      const url = URL.createObjectURL(blob);
      const video = document.getElementById("video-replay") as HTMLVideoElement;
      video.src = url;
      setVideo(url);
    }
  }, [recordedChunks]);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
  };

  const runPoseDetect = async () => {
    const resolution: InputResolution = { width: 500, height: 500 };
    const detector = await createDetector(modelName, {
      quantBytes: 4,
      architecture: "MobileNetV1",
      outputStride: 16,
      inputResolution: resolution,
      multiplier: 0.75,
    });
    detect(detector);
  };

  const detect = async (detector: PoseDetector) => {
    if (webcamRef.current && canvasRef.current) {
      const webcam = webcamRef.current as any;
      // go next step only when the video is completely uploaded.
      if (webcam.video.readyState === 4) {
        const video = webcam.video;
        const videoWidth = webcam.video.videoWidth;
        const videoHeight = webcam.video.videoHeight;
        video.width = videoWidth;
        video.height = videoHeight;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight * 2;

        const predictions = await detector.estimatePoses(video, {
          maxPoses: 1,
          flipHorizontal: false,
        });
        if (predictions.length) {
          console.log(predictions);
        }

        const ctx = canvasRef.current.getContext(
          "2d"
        ) as CanvasRenderingContext2D;
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        const rendering = new Rendering(modelName, ctx);
        requestAnimationFrame(() => {
          rendering.drawResult(predictions[0]);
        });
        await detect(detector);
      } else {
        setTimeout(() => {
          detect(detector);
        }, 100);
      }
    }
  };

  useEffect(() => {
    runPoseDetect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="App">
      <header className="header">
        <div className="title">PICTOGRAM SAN</div>
      </header>
      <Webcam
        audio={false}
        videoConstraints={videoConstraints}
        ref={webcamRef}
        style={{ display: "none" }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          margin: "auto",
          textAlign: "center",
          top: 100,
          left: 0,
          right: 0,
          zIndex: 9,
        }}
      />
      {capturing ? (
        <button className="btn btn-danger" onClick={handleStopCaptureClick}>
          Stop Capture
        </button>
      ) : (
        <button className="btn btn-danger" onClick={handleStartCaptureClick}>
          Start Capture
        </button>
      )}
      {recordedChunks.length > 0 && (
        <div>
          <button onClick={handleDownload}>Download</button>
          <video
            id="video-replay"
            height="400"
            width="500"
            controls
            style={{ display: !video && "none" }}
          ></video>
        </div>
      )}
    </div>
  );
}
