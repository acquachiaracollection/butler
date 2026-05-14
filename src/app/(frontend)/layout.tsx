import { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

import './globals.css'

const Layout = ({ children }: LayoutProps) => {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}

export default Layout
