import type { CollectionConfig } from 'payload'
import { isAuthenticated, isAuthenticatedField } from '../access/isAuthenticated'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    defaultColumns: ['status', 'updatedAt', 'createdAt'],
  },
  access: {
    create: () => true,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'menuItem',
          type: 'relationship',
          relationTo: 'menu-items',
          required: true,
          filterOptions: {
            isAvailable: {
              equals: true,
            },
          },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'note',
          type: 'text',
        },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'In attesa',
          value: 'pending',
        },
        {
          label: 'In preparazione',
          value: 'preparing',
        },
        {
          label: 'Completato',
          value: 'completed',
        },
      ],
      access: {
        create: isAuthenticatedField,
      },
    },
    {
      name: 'handledBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
      access: {
        create: isAuthenticatedField,
        update: isAuthenticatedField,
      },
    },
  ],
}
