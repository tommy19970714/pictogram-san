// ref: https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/demos/live_video/src/camera.js

export const POSENET_CONFIG = {
  maxPoses: 1,
  scoreThreshold: 0.5,
}

export const DEFAULT_LINE_WIDTH = 2
export const DEFAULT_RADIUS = 4
export const INTERVAL_TIME = 8000

export class RenderUI {
  ctx: CanvasRenderingContext2D
  width: number
  height: number

  constructor(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    this.ctx = context
    this.width = width
    this.height = height
  }

  drawCountDownUI(time: number) {
    this.ctx.clearRect(0, 0, this.width, this.height / 2)
    this.ctx.fillStyle = 'White'
    this.ctx.fillRect(0, 0, this.width, this.height / 2)
    this.ctx.fillStyle = '#032164'
    this.ctx.font = '300px sans-serif'
    this.ctx.fillText(
      Math.floor(4 - time / 1000).toString(),
      this.width / 4,
      this.height / 2 - this.height / 16
    )
  }

  drawBigPictogramUI(index: number, pictograms: string[]) {
    const svg = document.createElement('img')
    svg.src = '/pictograms/' + pictograms[index]
    this.ctx.clearRect(0, 0, this.width, this.height / 2)
    this.ctx.fillStyle = 'White'
    this.ctx.fillRect(0, 0, this.width, this.height / 2)
    this.ctx.drawImage(
      svg,
      this.width / 8,
      (this.height / 2 - this.width * 0.75) / 2,
      this.width * 0.75,
      this.width * 0.75
    )
  }

  drawSmallPictogramUI(index: number, pictograms: string[]) {
    const svg = document.createElement('img')
    svg.src = '/pictograms/' + pictograms[index]
    this.ctx.fillStyle = '#032164'
    this.ctx.drawImage(
      svg,
      0,
      this.height / 2 - this.width * 0.25,
      this.width * 0.25,
      this.width * 0.25
    )
  }

  drawCountUpUI(count: number, max: number) {
    this.ctx.fillStyle = '#032164'
    this.ctx.font = '40px sans-serif'
    if (count > max) {
      count = max
    }
    this.ctx.fillText(
      count.toString() + '/' + max.toString(),
      this.width * 0.75,
      this.height / 2 - 40
    )
  }

  drawFocusUI(time: number) {
    const focusCanvas = document.createElement('canvas')
    focusCanvas.width = this.width
    focusCanvas.height = this.height / 2
    const focusContext = focusCanvas.getContext('2d')

    if (focusContext) {
      focusContext.fillStyle = 'Black'
      focusContext.fillRect(0, 0, this.width, this.height / 2)
      focusContext.globalCompositeOperation = 'destination-out'
      focusContext.arc(
        this.width / 2,
        this.height / 4,
        this.width - this.width * 0.5 * time,
        0,
        2 * Math.PI,
        true
      )
      focusContext.fill()
      this.ctx.drawImage(focusCanvas, 0, 0, this.width, this.height / 2)
    }
  }

  isSkip(time: number): boolean {
    const elapsedTime = time - 3000
    const elapsedIntervalTime = elapsedTime % INTERVAL_TIME
    if (elapsedIntervalTime > 7000) {
      return true
    }
    return false
  }

  drawGameUI(time: number, pictograms: string[]) {
    if (time < 3000) {
      this.drawCountDownUI(time)
    } else {
      const elapsedTime = time - 3000
      const count = Math.floor(elapsedTime / INTERVAL_TIME)
      const elapsedIntervalTime = elapsedTime % INTERVAL_TIME
      if (elapsedIntervalTime < 2000) {
        this.drawBigPictogramUI(count, pictograms)
      } else if (elapsedIntervalTime > 7000) {
        this.drawFocusUI(1)
      } else if (elapsedIntervalTime > 6000) {
        const focusTime = (elapsedIntervalTime - 6000) / 1000
        this.drawFocusUI(focusTime)
      } else {
        this.drawSmallPictogramUI(count, pictograms)
        this.drawCountUpUI(count + 1, 5)
      }
    }
  }
}
