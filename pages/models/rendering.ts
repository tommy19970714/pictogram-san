// ref: https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/demos/live_video/src/camera.js

import * as posedetection from "@tensorflow-models/pose-detection";
import {
  SupportedModels,
  Keypoint,
  Pose,
} from "@tensorflow-models/pose-detection";

export const POSENET_CONFIG = {
  maxPoses: 1,
  scoreThreshold: 0.5,
};

export const DEFAULT_LINE_WIDTH = 2;
export const DEFAULT_RADIUS = 4;

export class Rendering {
  ctx: CanvasRenderingContext2D;
  modelName: SupportedModels;
  modelConfig: any;

  constructor(model: SupportedModels, context: CanvasRenderingContext2D) {
    this.modelName = model;
    this.ctx = context;
    this.modelConfig = { ...POSENET_CONFIG };
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param pose A pose with keypoints to render.
   */
  drawResult(pose: Pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints);
    }
  }
  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   */
  drawKeypoints(keypoints: Keypoint[]) {
    const keypointInd = posedetection.util.getKeypointIndexBySide(
      this.modelName
    );
    this.ctx.fillStyle = "black";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = DEFAULT_LINE_WIDTH;

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = "Green";
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = "Orange";
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  drawKeypoint(keypoint: Keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = this.modelConfig.scoreThreshold || 0;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x, keypoint.y, DEFAULT_RADIUS, 0, 2 * Math.PI);
      this.ctx.fill(circle);
      this.ctx.stroke(circle);
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  drawSkeleton(keypoints: Keypoint[]) {
    this.ctx.fillStyle = "black";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = DEFAULT_LINE_WIDTH;

    posedetection.util.getAdjacentPairs(this.modelName).forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;
      const scoreThreshold = this.modelConfig.scoreThreshold || 0;

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        this.ctx.beginPath();
        this.ctx.moveTo(kp1.x, kp1.y);
        this.ctx.lineTo(kp2.x, kp2.y);
        this.ctx.stroke();
      }
    });
  }
}
