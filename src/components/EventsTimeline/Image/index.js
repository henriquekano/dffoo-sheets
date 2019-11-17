import React, { useState } from 'react'

const Image = ({ src, style, ...otherProps }) => {
  const [isMouseOn, setMouseOn] = useState(false)
  const newStyle = {
    ...style,
    ...(isMouseOn
      ? {
        zIndex: 2,
        borderWidth: 2,
        borderColor: 'white',
      }
      : {
        zIndex: 0,
      })
    }
  return (
    <img
      src={src}
      alt={src}
      style={newStyle}
      onMouseEnter={e => {
        setMouseOn(true)
      }}
      onMouseOut={e => {
        setMouseOn(false)
      }}
      {...otherProps}
    />
  )
}

export default Image
