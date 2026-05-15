import type { CollectionConfig } from 'payload'
import { isAuthenticated, isAuthenticatedField } from '../access/isAuthenticated'

export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  admin: {
    useAsTitle: 'user',
    defaultColumns: ['user', 'endpoint', 'createdAt'],
  },
  access: {
    create: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'endpoint',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'auth',
      type: 'text',
      required: true,
    },
    {
      name: 'p256dh',
      type: 'text',
      required: true,
    },
  ],
  timestamps: true,
}
