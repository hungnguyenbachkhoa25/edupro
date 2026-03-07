import { z } from 'zod';
import { insertPracticeTestSchema, insertQuestionSchema, insertTestResultSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    user: {
      method: 'GET' as const,
      path: '/api/auth/user' as const,
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  tests: {
    list: {
      method: 'GET' as const,
      path: '/api/tests' as const,
      input: z.object({ category: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.any()), // Array of practice tests
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tests/:id' as const,
      responses: {
        200: z.any(), // Practice test with questions
        404: errorSchemas.notFound,
      },
    },
  },
  results: {
    submit: {
      method: 'POST' as const,
      path: '/api/results' as const,
      input: insertTestResultSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/results' as const,
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications' as const,
      input: z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional(),
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
    unreadCount: {
      method: 'GET' as const,
      path: '/api/notifications/unread-count' as const,
      responses: {
        200: z.object({ count: z.number() }),
        401: errorSchemas.unauthorized,
      },
    },
    read: {
      method: 'PATCH' as const,
      path: '/api/notifications/:id/read' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    readAll: {
      method: 'PATCH' as const,
      path: '/api/notifications/read-all' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/notifications/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/notifications' as const,
      input: z.any(), // Internal/Admin
      responses: {
        201: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  conversations: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations' as const,
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
    messages: {
      method: 'GET' as const,
      path: '/api/conversations/:id/messages' as const,
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/conversations' as const,
      input: z.object({ participantIds: z.array(z.string()) }),
      responses: {
        201: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/conversations/:id/messages' as const,
      input: z.object({ content: z.string(), messageType: z.string().optional() }),
      responses: {
        201: z.any(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    read: {
      method: 'PATCH' as const,
      path: '/api/conversations/:id/read' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    unreadCount: {
      method: 'GET' as const,
      path: '/api/messages/unread-count' as const,
      responses: {
        200: z.object({ count: z.number() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
