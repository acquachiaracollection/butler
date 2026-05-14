import type { Access, FieldAccess } from 'payload'

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

export const isAuthenticatedField: FieldAccess = ({ req: { user } }) => Boolean(user)
