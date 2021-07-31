import { useRef, useEffect, useState } from "react";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";
import * as posenet from "@tensorflow-models/posenet";
import { drawKeypoints, drawSkeleton } from "./models/rendering";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const [net, setNet] = useState<posenet.PoseNet>();

  useEffect(() => {
    posenet.load().then((net: posenet.PoseNet) => {
      setNet(net);
    });
  }, []);

  const drawimage = async (
    webcam: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    (async function drawMask() {
      requestAnimationFrame(drawMask);
      const pose = await net.estimateSinglePose(webcam, {
        flipHorizontal: false,
      });
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawKeypoints(pose["keypoints"], 0.6, context);
      drawSkeleton(pose["keypoints"], 0.7, context);
    })();
  };

  const clickHandler = async () => {
    const webcam = webcamRef.current.video as HTMLVideoElement;
    const canvas = canvasRef.current;
    webcam.width = canvas.width = webcam.videoWidth;
    webcam.height = canvas.height = webcam.videoHeight;
    const context = canvas.getContext("2d");

    if (net) {
      drawimage(webcam, context, canvas);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="title">PICTOGRAM SAN</div>
      </header>
      <Webcam
        audio={false}
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
      <button onClick={clickHandler}>ボタン</button>
    </div>
  );
}
