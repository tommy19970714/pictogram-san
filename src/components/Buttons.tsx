import React from 'react'
import styled from 'styled-components'

export const DefaultButton = styled.button`
  background-color: #0a2569;
  width: 160px;
  height: 40px;
  border-radius: 30px;
  color: white;
  font-size: 15px;
  border: none;
  font-family: 'Noto Sans JP', sans-serif;
`

export const PinkButton = styled(DefaultButton)`
  background-color: #c44571;
`

export const BlueButton = styled(DefaultButton)`
  background-color: #1da1f2;
`
