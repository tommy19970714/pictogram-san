import React from 'react'
import styled from 'styled-components'

const OLYMPIC_PICTOGRAMS_SVGS: string[] = [
  '3x3_Basketball.svg',
  'Rugby.svg',
  'Archery.svg',
  'Shotgun.svg',
  'Athletics.svg',
  'Skateboarding.svg',
  'Badminton.svg',
  'Softball.svg',
  'Baseball.svg',
  'Sport_Climbing.svg',
  'Basketball.svg',
  'Sprint.svg',
  'Beach_Volleyball.svg',
  'Surfing.svg',
  'Boxing.svg',
  'Swimming.svg',
  'Diving.svg	',
  'Table_Tennis.svg',
  'Fencing.svg',
  'Taekwondo.svg',
  'Football.svg',
  'Tennis.svg',
  'Golf.svg',
  'Trampoline.svg',
  'Gymnastics.svg	',
  'Volleyball.svg',
  'Handball.svg',
  'Water_Polo.svg',
  'Hockey.svg',
  'Weightlifting.svg',
  'Marathon_Swimming.svg',
  'kata.svg',
  'Rhythmic.svg',
]

const PictogramImage = styled.img`
  width: 80px;
  height: 80px;
`

const OlympicPictogram = (props: { index: number }) => {
  const { index } = props
  const pictogramList = OLYMPIC_PICTOGRAMS_SVGS.sort(() => 0.5 - Math.random())

  return (
    <div>
      <PictogramImage src={'/pictograms/' + pictogramList[index]} />
    </div>
  )
}

export default OlympicPictogram
