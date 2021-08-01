import { Keypoint } from '@tensorflow-models/posenet'

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
      this.sumArray[i] = { position: { x: 0, y: 0 }, score: 0, part: '' }
    }
  }

  add(keypoints: Keypoint[]) {
    console.log(this.count, this.size)
    if (this.count >= this.size) {
      for (let i = 0; i < 17; i++) {
        const temp = this.sumArray[i].score || 0
        this.sumArray[i].score =
          temp - (this.ringBuffer[this.idx][i].score || 0)
        this.sumArray[i].position.x -= this.ringBuffer[this.idx][i].position.x
        this.sumArray[i].position.y -= this.ringBuffer[this.idx][i].position.y
      }
    } else {
      this.count += 1
    }

    this.ringBuffer[this.idx] = keypoints.slice(0, 17)

    for (let i = 0; i < 17; i++) {
      const temp = this.sumArray[i].score || 0
      this.sumArray[i].score = temp + (this.ringBuffer[this.idx][i].score || 0)
      this.sumArray[i].part = this.ringBuffer[this.idx][i].part
      this.sumArray[i].position.x += this.ringBuffer[this.idx][i].position.x
      this.sumArray[i].position.y += this.ringBuffer[this.idx][i].position.y
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
        position: {
          x: point.position.x / this.count,
          y: point.position.y / this.count,
        },
        score: point.score && point.score / this.count,
        part: point.part,
      })
    })
    return rval
  }
}
