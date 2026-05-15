'use server'

type LoginResult = {
  success: boolean
  message?: string
}

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(
      `${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/internal/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        message: error?.message || 'Email o password non corretti',
      }
    }

    const result = await response.json()
    if (result.user) {
      return {
        success: true,
      }
    }

    return {
      success: false,
      message: 'Errore durante il login',
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return {
      success: false,
      message: error?.message || 'Errore durante il login',
    }
  }
}
