import { Keypoint } from '@tensorflow-models/pose-detection'

export class KeypointsRingBuffer {
  bitLength: number = 0
  width: number = 0
  size: number = 0
  mask: number = 0
  idx: number = 0
  count: number = 0
  ringBuffer: Keypoint[][] = []
  sumArray: Keypoint[] = []

  constructor(width: number, bitLength: number) {
    this.bitLength = bitLength
    this.width = width
    this.size = 1 << this.bitLength
    this.mask = this.size - 1
    this.ringBuffer = new Array(this.size)
    this.sumArray = new Array(this.width)
    for (let i = 0; i < this.width; i++) {
      this.sumArray[i] = { x: 0, y: 0, score: 0, name: '' }
    }
  }

  add(keypoints: Keypoint[]) {
    if (this.count >= this.size) {
      for (let i = 0; i < this.width; i++) {
        const temp = this.sumArray[i].score || 0
        this.sumArray[i].score =
          temp - (this.ringBuffer[this.idx][i].score || 0)
        this.sumArray[i].x -= this.ringBuffer[this.idx][i].x
        this.sumArray[i].y -= this.ringBuffer[this.idx][i].y
      }
    } else {
      this.count += 1
    }

    this.ringBuffer[this.idx] = keypoints.slice(0, this.width)

    for (let i = 0; i < this.width; i++) {
      const temp = this.sumArray[i].score || 0
      this.sumArray[i].score = temp + (this.ringBuffer[this.idx][i].score || 0)
      this.sumArray[i].name = this.ringBuffer[this.idx][i].name
      this.sumArray[i].x += this.ringBuffer[this.idx][i].x
      this.sumArray[i].y += this.ringBuffer[this.idx][i].y
    }

    this.idx = (this.idx + 1) & this.mask
  }

  clear() {
    this.count = 0
    this.idx = 0
  }

  getAverage() {
    const rval: Keypoint[] = []
    this.sumArray.forEach((point) => {
      rval.push({
        x: point.x / this.count,
        y: point.y / this.count,
        score: point.score && point.score / this.count,
        name: point.name,
      })
    })
    return rval
  }
}
