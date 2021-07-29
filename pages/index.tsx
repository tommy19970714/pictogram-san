import { useRef, useEffect } from "react";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import * as posedetection from "@tensorflow-models/pose-detection";
import Webcam from "react-webcam";
import { createDetector, PoseDetector } from "@tensorflow-models/pose-detection";
import { Rendering } from "./models/rendering";

export default function App() {
  const webcam = useRef<Webcam>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const modelName = posedetection.SupportedModels.PoseNet;
  
  const runPoseDetect = async () => {
    const detector = await createDetector(modelName);
    detect(detector);
  };

  const detect = async (detector: PoseDetector) => {
    if (webcam.current && canvas.current) {
      const webcamCurrent = webcam.current as any;
      // go next step only when the video is completely uploaded.
      if (webcamCurrent.video.readyState === 4) {
        const video = webcamCurrent.video;
        const videoWidth = webcamCurrent.video.videoWidth;
        const videoHeight = webcamCurrent.video.videoHeight;
        canvas.current.width = videoWidth;
        canvas.current.height = videoHeight;

        const predictions = await detector.estimatePoses(
          video,
          {maxPoses: 1, flipHorizontal: false}
        );
        if (predictions.length) {
          console.log(predictions);
        }
        
        const ctx = canvas.current.getContext("2d") as CanvasRenderingContext2D;
        const rendering = new Rendering(modelName, ctx);
        requestAnimationFrame(() => {
          rendering.drawResult(predictions[0]);
        });
        detect(detector);
      } else {
        setTimeout(() => {
          detect(detector);
        }, 100);
      };
    };
  };

  useEffect(() => {
    runPoseDetect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="App">
      <header className="header">
        <div className="title">PICTOGRAM SAN</div>
      </header>
      <Webcam
        audio={false}
        ref={webcam}
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
        ref={canvas}
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
  )
}
