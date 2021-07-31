import { useRef, useEffect } from "react";
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
        canvasRef.current.height = videoHeight;
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
    </div>
  );
}
