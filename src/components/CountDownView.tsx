import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

const CountDownText = styled.text`
  font-size: 300px;
  color: #0a2569;
  font-weight: bold;
  font-family: 'Noto Sans JP', sans-serif;
  cursor: pointer;
  zindex: 9;
`

const CountDownView = () => {
  const [countdown, setCountdown] = useState<number>(3)

  useEffect(() => {
    let count = 3
    setInterval(() => {
      count -= 1
      setCountdown(count)
    }, 1000)
  }, [])

  return (
    <div>{countdown > 0 && <CountDownText>{countdown}</CountDownText>}</div>
  )
}

export default CountDownView
