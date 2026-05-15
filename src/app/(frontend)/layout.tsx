import { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

import './globals.css'

const Layout = ({ children }: LayoutProps) => {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#1976d2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/service-worker.js'); }); }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

export default Layout
