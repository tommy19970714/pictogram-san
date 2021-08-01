// ref: https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/demos/live_video/src/camera.js

import { util } from '@tensorflow-models/pose-detection'
import { Keypoint, Pose } from '@tensorflow-models/posenet'
import { SupportedModels } from '@tensorflow-models/pose-detection'
import { Vector2D } from '@tensorflow-models/pose-detection/dist/posenet/types'
import { RingBuffer } from './RingBuffer'

export const POSENET_CONFIG = {
  maxPoses: 1,
  scoreThreshold: 0.5,
}

export const DEFAULT_LINE_WIDTH = 2
export const DEFAULT_RADIUS = 4

export class Render {
  ctx: CanvasRenderingContext2D
  ringBuffer: RingBuffer

  constructor(context: CanvasRenderingContext2D, ringBuffer: RingBuffer) {
    this.ctx = context
    this.ringBuffer = ringBuffer
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
    const keypointInd = util.getKeypointIndexBySide(SupportedModels.PoseNet)
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
    const scoreThreshold = POSENET_CONFIG.scoreThreshold || 0

    if (score >= scoreThreshold) {
      const circle = new Path2D()
      circle.arc(
        keypoint.position.x,
        keypoint.position.y,
        DEFAULT_RADIUS,
        0,
        2 * Math.PI
      )
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

    util.getAdjacentPairs(SupportedModels.PoseNet).forEach(([i, j]) => {
      const kp1 = keypoints[i]
      const kp2 = keypoints[j]

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1
      const score2 = kp2.score != null ? kp2.score : 1
      const scoreThreshold = POSENET_CONFIG.scoreThreshold || 0

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        this.ctx.beginPath()
        this.ctx.moveTo(kp1.position.x, kp1.position.y)
        this.ctx.lineTo(kp2.position.x, kp2.position.y)
        this.ctx.stroke()
      }
    })
  }

  drawStickFigure(keypoints: Keypoint[]) {
    this.ctx.fillStyle = '#032164'

    this.ringBuffer.add(keypoints)
    const currentKP = this.ringBuffer.getAverage()

    const faceCenter = this.getFaceCenter(currentKP)
    const leftNose2Ear = Math.hypot(
      currentKP[1].position.x - currentKP[0].position.x,
      currentKP[1].position.y - currentKP[0].position.y
    )
    const rightNose2Ear = Math.hypot(
      currentKP[0].position.x - currentKP[2].position.x,
      currentKP[0].position.y - currentKP[2].position.y
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
    const rootAry = [5, 11] // 肩, 腰
    rootAry.forEach((i) => {
      const isLeft1 = currentKP[i].position.x < currentKP[i + 1].position.x
      const isLeft2 = currentKP[i + 2].position.x < currentKP[i + 3].position.x
      const isLeft3 = currentKP[i + 4].position.x < currentKP[i + 5].position.x
      const point1L = isLeft1 ? currentKP[i] : currentKP[i + 1]
      const point1R = isLeft1 ? currentKP[i + 1] : currentKP[i]
      const point2L = isLeft2 ? currentKP[i + 2] : currentKP[i + 3]
      const point2R = isLeft2 ? currentKP[i + 3] : currentKP[i + 2]
      const point3L = isLeft3 ? currentKP[i + 4] : currentKP[i + 5]
      const point3R = isLeft3 ? currentKP[i + 5] : currentKP[i + 4]

      if (this.isReliable(point1L) && this.isReliable(point2L)) {
        this.drawStick(point1L, stickRadius1, point2L, stickRadius2)
      }
      if (this.isReliable(point2L) && this.isReliable(point3L)) {
        this.drawStick(point2L, stickRadius2, point3L, stickRadius3)
      }
      if (this.isReliable(point1R) && this.isReliable(point2R)) {
        this.drawStick(point1R, stickRadius1, point2R, stickRadius2)
      }
      if (this.isReliable(point2R) && this.isReliable(point3R)) {
        this.drawStick(point2R, stickRadius2, point3R, stickRadius3)
      }
    })
  }

  isReliable(point: Keypoint) {
    return point.score && point.score > POSENET_CONFIG.scoreThreshold
  }

  drawStick(
    point1: Keypoint,
    point1Radius: number,
    point2: Keypoint,
    point2Radius: number
  ) {
    this.drawCircle(point1.position, point1Radius)
    this.drawCircle(point2.position, point2Radius)

    const drawList: Vector2D[] = []
    ;[0, 1].forEach((index) => {
      const rad =
        Math.atan2(
          point2.position.y - point1.position.y,
          point2.position.x - point1.position.x
        ) +
        Math.PI / 2 +
        Math.PI * index

      const point1X = point1Radius * Math.cos(rad) + point1.position.x
      const point1Y = point1Radius * Math.sin(rad) + point1.position.y
      drawList.push({ x: point1X, y: point1Y })

      const point2X = point2Radius * Math.cos(rad) + point2.position.x
      const point2Y = point2Radius * Math.sin(rad) + point2.position.y
      drawList.push({ x: point2X, y: point2Y })
    })

    const region = new Path2D()
    region.moveTo(drawList[0].x, drawList[0].y)
    region.lineTo(drawList[1].x, drawList[1].y)
    region.lineTo(drawList[3].x, drawList[3].y)
    region.lineTo(drawList[2].x, drawList[2].y)
    region.closePath()
    this.ctx.fill(region)
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
      .filter((point) => point.part && facePointNames.includes(point.part))
      .forEach((point) => {
        if (point.score && point.score > POSENET_CONFIG.scoreThreshold) {
          sumX += point.position.x
          sumY += point.position.y
          count += 1
        }
      })
    return count > 0 && { x: sumX / count, y: sumY / count }
  }
}
