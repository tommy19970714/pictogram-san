import React from 'react'
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

const Loader = () => {
  return (
    <DivWrapper>
      <LoaderWrapper>
        <Text>
          Pictogram-san
          <br />
          Challenge
        </Text>
        <LoaderImage src="./svgs/loader.svg" alt="loader" />
        <TopImage src="./svgs/top-icon.svg" alt="loader" />
      </LoaderWrapper>
    </DivWrapper>
  )
}

export default Loader
