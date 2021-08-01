import React from 'react'
import styled from 'styled-components'

const ModalWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
`

const StyledModal = styled.div`
  position: absolute;
  width: 250px;
  height: 210px;
  padding: 30px 20px;
  top: 50%;
  left: 50%;
  right: auto;
  bottom: auto;
  margin-right: -50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  background: white;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`

const Close = styled.img`
  position: absolute;
  right: 25px;
  top: 25px;
  cursor: pointer;
`

type Props = {
  closeModal: () => void
}

const Modal: React.FC<Props> = ({ children, closeModal }) => {
  return (
    <ModalWrapper>
      <StyledModal>
        <Close src="/svgs/close.svg" alt="close" onClick={closeModal} />
        {children}
      </StyledModal>
    </ModalWrapper>
  )
}

export default Modal
