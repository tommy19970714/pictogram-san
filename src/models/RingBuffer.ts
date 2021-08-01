import { Keypoint } from '@tensorflow-models/pose-detection'

export class RingBuffer {
  bit: number = 3
  size: number = 1 << this.bit
  mask: number = (1 << this.bit) - 1
  idx: number = 0
  count: number = 0
  ringBuffer: Keypoint[][] = []
  sumArray: Keypoint[] = []

  constructor() {
    this.ringBuffer = new Array(this.size)
    this.sumArray = new Array(17)
    this.mask = (1 << 3) - 1
    for (let i = 0; i < 17; i++) {
      this.sumArray[i] = { x: 0, y: 0, score: 0, name: '' }
    }
  }

  add(keypoints: Keypoint[]) {
    console.log(this.count, this.size)
    if (this.count >= this.size) {
      for (let i = 0; i < 17; i++) {
        const temp = this.sumArray[i].score || 0
        this.sumArray[i].score =
          temp - (this.ringBuffer[this.idx][i].score || 0)
        this.sumArray[i].x -= this.ringBuffer[this.idx][i].x
        this.sumArray[i].y -= this.ringBuffer[this.idx][i].y
      }
    } else {
      this.count += 1
    }

    this.ringBuffer[this.idx] = keypoints.slice(0, 17)

    for (let i = 0; i < 17; i++) {
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
