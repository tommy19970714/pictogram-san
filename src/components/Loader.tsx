import React, { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

const DivWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  text-align: center;
  top: 0;
  left: 0;
  right: 0;
  background-color: white;
  font-family: 'Noto Sans JP', sans-serif;
`

const LoaderWrapper = styled.div`
  position: relative;
  width: 300px;
  height: 400px;
  margin: 0;
  top: 50%;
  left: 50%;
  margin-right: -50%;
  transform: translate(-50%, -50%);
`
const Text = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  text-align: center;
  font-weight: 700;
  font-size: 34px;
  color: #0a2569;
`

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const LoaderImage = styled.img`
  position: absolute;
  top: 100px;
  right: 50px;
  animation: ${rotate360} 1s linear infinite;
  width: 200px;
  height: 200px;
`
const TopImage = styled.img`
  position: absolute;
  top: 105px;
  right: 55px;
  width: 190px;
  height: 190px;
`

const SubText = styled.p`
  position: absolute;
  top: 290px;
  width: 100%;
  text-align: center;
  font-weight: 700;
  font-size: 20px;
  color: #0a2569;
`

const LoadingTexts: string[] = [
  'Loading...',
  'Wait a moment...',
  'We are preparing now...',
  'Give us some seconds',
  'Sorry for waiting...',
  'Please keep waiting...',
  'Just some minutes, please',
  'You are almost there...',
]
const Loader = () => {
  const [text, setText] = useState<string>(LoadingTexts[1])

  useEffect(() => {
    let isMounted = true
    let count = 0
    if (isMounted) {
      const timer = setInterval(() => {
        const tempText =
          LoadingTexts[Math.floor(Math.random() * LoadingTexts.length)]
        setText(tempText)
        if (++count == 5) {
          clearInterval(timer)
        }
      }, 2000)
    }
    return () => {
      isMounted = false
    }
  }, [])
  return (
    <DivWrapper>
      <LoaderWrapper>
        <Text>
          Pictogram
          <br />
          Challenge
        </Text>
        <LoaderImage src="/svgs/loader.svg" alt="loader" />
        <TopImage src="/svgs/top-icon.svg" alt="loader" />
        <SubText>{text}</SubText>
      </LoaderWrapper>
    </DivWrapper>
  )
}

export default Loader
