import type { CollectionConfig } from 'payload'
import { isAuthenticated, isAuthenticatedField } from '../access/isAuthenticated'
import { sendPushNotificationToAllButlers } from '../lib/push'

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
      name: 'staffNotes',
      label: 'Staff Notes',
      type: 'textarea',
      admin: {
        description: 'Annotazioni interne su articoli non serviti o problemi riscontrati.',
      },
      access: {
        create: isAuthenticatedField,
        update: isAuthenticatedField,
      },
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
        {
          label: 'Annullato',
          value: 'canceled',
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
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        // Only send notifications when a new order is created
        if (operation === 'create') {
          try {
            await sendPushNotificationToAllButlers(req.payload, {
              title: 'Nuovo Ordine',
              body: `Nuovo ordine da processare`,
              tag: `order-${doc.id}`,
              data: {
                orderId: doc.id as string,
                action: 'open_order',
              },
            })
          } catch (error) {
            console.error('Error sending push notification for new order:', error)
            // Don't fail the operation if push notification fails
          }
        }
      },
    ],
  },
}
