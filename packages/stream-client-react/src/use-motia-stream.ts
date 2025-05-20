import React from 'react'
import { MotiaStreamContext } from './motia-stream-context'

export const useMotiaStream = () => {
  const context = React.useContext(MotiaStreamContext)

  if (!context) {
    throw new Error('useMotiaStream must be used within a MotiaStreamProvider')
  }

  return context
}
