import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ message: 'Email e password sono obbligatorie' }, { status: 400 })
    }

    const loginUrl = new URL('/api/users/login', request.url)

    const payloadResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const responseBody = await payloadResponse.text()
    const contentType = payloadResponse.headers.get('content-type')

    const response = new NextResponse(responseBody, {
      status: payloadResponse.status,
      headers: contentType ? { 'content-type': contentType } : undefined,
    })

    const setCookie = payloadResponse.headers.get('set-cookie')
    if (setCookie) {
      response.headers.set('set-cookie', setCookie)
    }

    return response
  } catch (error) {
    console.error('Internal auth login error:', error)
    return NextResponse.json({ message: 'Errore durante il login' }, { status: 500 })
  }
}
