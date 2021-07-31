import React, { MouseEventHandler } from 'react'

export const RecordButton = (props: {
  onClick: MouseEventHandler | undefined
  style: object
}) => (
  <svg
    width="65"
    height="65"
    viewBox="0 0 65 65"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    onClick={props.onClick}
    style={props.style}
  >
    <circle cx="32.5" cy="32.5" r="27.5" fill="#FE3D2F" />
    <circle cx="32.5" cy="32.5" r="31" stroke="white" strokeWidth="3" />
  </svg>
)
