import React from 'react'
import styled from 'styled-components'

const CountUpCircle = styled.div`
  display: inline-block;
  width: 80px;
  height: 80px;
  line-height: 80px;
  border-radius: 50%;
  border: solid 1px black;
`

const LeftCount = styled.text`
  font-size: 30px;
  color: #000;
  font-weight: bold;
  margin-left: 10px;
`

const RightCount = styled.text`
  font-size: 15px;
  color: #000;
  margin-left: 10px;
`

const DiagonalLine = styled.div`
  content: '';
  position: absolute;
  width: 44px;
  height: 1px;
  margin-left: 20px;
  margin-top: 40px;
  background-color: #000;
  transform: rotate(-60deg);
`

type CountUpViewProps = {
  current: number
  max: number
}

const CountUpView = (props: CountUpViewProps) => {
  const { current, max } = props
  return (
    <div>
      <CountUpCircle>
        <DiagonalLine />
        <LeftCount> {current} </LeftCount>
        <RightCount> {max} </RightCount>
      </CountUpCircle>
    </div>
  )
}

export default CountUpView
