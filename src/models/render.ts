// ref: https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/demos/live_video/src/camera.js

import * as posedetection from '@tensorflow-models/pose-detection'
import {
  SupportedModels,
  Keypoint,
  Pose,
} from '@tensorflow-models/pose-detection'
import { Vector2D } from '@tensorflow-models/pose-detection/dist/posenet/types'

export const POSENET_CONFIG = {
  maxPoses: 1,
  scoreThreshold: 0.5,
}

export const DEFAULT_LINE_WIDTH = 2
export const DEFAULT_RADIUS = 4

export class Render {
  ctx: CanvasRenderingContext2D
  modelName: SupportedModels
  modelConfig: any

  constructor(model: SupportedModels, context: CanvasRenderingContext2D) {
    this.modelName = model
    this.ctx = context
    this.modelConfig = { ...POSENET_CONFIG }
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param pose A pose with keypoints to render.
   */
  drawResult(pose: Pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints)
      this.drawSkeleton(pose.keypoints)
      this.drawStickFigure(pose.keypoints)
    }
  }
  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   */
  drawKeypoints(keypoints: Keypoint[]) {
    const keypointInd = posedetection.util.getKeypointIndexBySide(
      this.modelName
    )
    this.ctx.fillStyle = 'White'
    this.ctx.strokeStyle = 'White'
    this.ctx.lineWidth = DEFAULT_LINE_WIDTH

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i])
    }

    this.ctx.fillStyle = 'Green'
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i])
    }

    this.ctx.fillStyle = 'Orange'
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i])
    }
  }

  drawKeypoint(keypoint: Keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1
    const scoreThreshold = this.modelConfig.scoreThreshold || 0

    if (score >= scoreThreshold) {
      const circle = new Path2D()
      circle.arc(keypoint.x, keypoint.y, DEFAULT_RADIUS, 0, 2 * Math.PI)
      this.ctx.fill(circle)
      this.ctx.stroke(circle)
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  drawSkeleton(keypoints: Keypoint[]) {
    this.ctx.fillStyle = 'White'
    this.ctx.strokeStyle = 'White'
    this.ctx.lineWidth = DEFAULT_LINE_WIDTH

    posedetection.util.getAdjacentPairs(this.modelName).forEach(([i, j]) => {
      const kp1 = keypoints[i]
      const kp2 = keypoints[j]

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1
      const score2 = kp2.score != null ? kp2.score : 1
      const scoreThreshold = this.modelConfig.scoreThreshold || 0

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        this.ctx.beginPath()
        this.ctx.moveTo(kp1.x, kp1.y)
        this.ctx.lineTo(kp2.x, kp2.y)
        this.ctx.stroke()
      }
    })
  }

  drawStickFigure(keypoints: Keypoint[]) {
    this.ctx.fillStyle = '#032164'

    const faceCenter = this.getFaceCenter(keypoints)
    const leftNose2Ear = Math.hypot(
      keypoints[1].x - keypoints[0].x,
      keypoints[1].y - keypoints[0].y
    )
    const rightNose2Ear = Math.hypot(
      keypoints[0].x - keypoints[2].x,
      keypoints[0].y - keypoints[2].y
    )
    const faceRadius = Math.max(leftNose2Ear, rightNose2Ear) * 2
    const stickRadius1 = faceRadius * 0.6
    const stickRadius2 = stickRadius1 * 0.75
    const stickRadius3 = stickRadius2 * 0.75

    // # 顔 描画
    if (faceCenter) {
      this.drawCircle(faceCenter, faceRadius)
    }

    // 手足
    const rootAry = [5, 6, 11, 12] // 左肩, 右肩, 左腰, 右腰
    rootAry.forEach((i) => {
      const point1 = { x: keypoints[i].x, y: keypoints[i].y }
      const point2 = { x: keypoints[i + 2].x, y: keypoints[i + 2].y }
      const point3 = { x: keypoints[i + 4].x, y: keypoints[i + 4].y }

      this.drawStick(point1, stickRadius1, point2, stickRadius2)
      this.drawStick(point2, stickRadius2, point3, stickRadius3)
    })
  }

  drawStick(
    point1: Vector2D,
    point1Radius: number,
    point2: Vector2D,
    point2Radius: number
  ) {
    this.drawCircle(point1, point1Radius)
    this.drawCircle(point2, point2Radius)

    const drawList: Vector2D[] = []
    ;[0, 1].forEach((index) => {
      const rad =
        Math.atan2(point2.y - point1.y, point2.x - point1.x) +
        Math.PI / 2 +
        Math.PI * index

      const point1X = point1Radius * Math.cos(rad) + point1.x
      const point1Y = point1Radius * Math.sin(rad) + point1.y
      drawList.push({ x: point1X, y: point1Y })

      const point2X = point2Radius * Math.cos(rad) + point2.x
      const point2Y = point2Radius * Math.sin(rad) + point2.y
      drawList.push({ x: point2X, y: point2Y })
    })

    const region = new Path2D()
    region.moveTo(drawList[0].x, drawList[0].y)
    region.lineTo(drawList[1].x, drawList[1].y)
    region.lineTo(drawList[3].x, drawList[3].y)
    region.lineTo(drawList[2].x, drawList[2].y)
    region.closePath()

    // Fill path
    this.ctx.fill(region, 'evenodd')
  }

  drawCircle(center: Vector2D, radius: number) {
    this.ctx.beginPath()
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false)
    this.ctx.fill()
  }

  getFaceCenter(keypoints: Keypoint[]) {
    let sumX = 0
    let sumY = 0
    let count = 0
    const facePointNames = [
      'nose',
      'left_eye',
      'right_eye',
      'left_ear',
      'right_ear',
    ]
    keypoints
      .filter((point) => point.name && facePointNames.includes(point.name))
      .forEach((point) => {
        if (point.score && point.score > POSENET_CONFIG.scoreThreshold) {
          sumX += point.x
          sumY += point.y
          count += 1
        }
      })
    return count > 0 && { x: sumX / count, y: sumY / count }
  }
}
