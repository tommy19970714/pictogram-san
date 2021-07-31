import { useRef, useEffect } from "react";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";
import { createDetector, PoseDetector, SupportedModels, InputResolution } from "@tensorflow-models/pose-detection";
import { Rendering } from "./models/rendering";
// import {getValidInputResolutionDimensions, getValidOutputResolutionDimensions} from "./utils";

export default function App() {
  const webcam = useRef<Webcam>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const modelName = SupportedModels.PoseNet;

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };
  
  const runPoseDetect = async () => {
    const resolution: InputResolution = { width: 500, height: 500 };
    const detector = await createDetector(modelName, {
      quantBytes: 4,
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: resolution,
      multiplier: 0.75
    });
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
        video.width = videoWidth;
        video.height = videoHeight;

        canvas.current.width = videoWidth;
        canvas.current.height = videoHeight;
        console.log(`videoWidth: ${videoWidth}, videoHeight: ${videoHeight}`);

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
        await detect(detector);
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
        videoConstraints={videoConstraints}
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
