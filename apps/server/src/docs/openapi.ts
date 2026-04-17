export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Autocare API',
    version: '0.1.0',
    description:
      'API documentation for Autocare server endpoints. Use this reference to integrate clients and automation safely.',
  },
  servers: [
    {
      url: '/api',
      description: 'Primary API base path',
    },
  ],
  tags: [
    { name: 'System' },
    { name: 'Analytics' },
    { name: 'Consent' },
    { name: 'Vehicles' },
    { name: 'AI' },
    { name: 'Reports' },
    { name: 'Audit' },
    { name: 'Utility' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Server health status',
          },
        },
      },
    },
    '/v1/events/batch': {
      post: {
        tags: ['Analytics'],
        summary: 'Ingest analytics events',
        responses: {
          '200': {
            description: 'Batch accepted',
          },
        },
      },
    },
    '/v1/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics dashboard',
        responses: {
          '200': {
            description: 'Dashboard payload',
          },
        },
      },
    },
    '/v1/consent': {
      post: {
        tags: ['Consent'],
        summary: 'Create consent',
        responses: {
          '200': {
            description: 'Consent created',
          },
        },
      },
    },
    '/v1/consent/revoke': {
      post: {
        tags: ['Consent'],
        summary: 'Revoke consent',
        responses: {
          '200': {
            description: 'Consent revoked',
          },
        },
      },
    },
    '/v1/consent/export': {
      post: {
        tags: ['Consent'],
        summary: 'Export consent data',
        responses: {
          '200': {
            description: 'Export job accepted',
          },
        },
      },
    },
    '/v1/consent/delete': {
      post: {
        tags: ['Consent'],
        summary: 'Delete consent data',
        responses: {
          '200': {
            description: 'Delete job accepted',
          },
        },
      },
    },
    '/vehicles/{id}/lock': {
      post: {
        tags: ['Vehicles'],
        summary: 'Lock a vehicle',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Vehicle lock status',
          },
        },
      },
    },
    '/vehicles/{id}/maintenance': {
      post: {
        tags: ['Vehicles'],
        summary: 'Create maintenance log',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '201': {
            description: 'Maintenance entry created',
          },
        },
      },
    },
    '/vehicles/{id}/maintenance/{maintenanceId}': {
      put: {
        tags: ['Vehicles'],
        summary: 'Update maintenance log',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'maintenanceId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Maintenance entry updated',
          },
        },
      },
    },
    '/upload': {
      post: {
        tags: ['Utility'],
        summary: 'Upload a file',
        responses: {
          '201': {
            description: 'Upload URL created',
          },
        },
      },
    },
    '/vehicles/{id}/fuel': {
      get: {
        tags: ['Vehicles'],
        summary: 'List fuel entries for vehicle',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Fuel entries list',
          },
        },
      },
    },
    '/vehicles/scan-document': {
      post: {
        tags: ['Vehicles'],
        summary: 'Scan vehicle document',
        responses: {
          '200': {
            description: 'Extracted vehicle info',
          },
        },
      },
    },
    '/ai/parse-service-report': {
      post: {
        tags: ['AI'],
        summary: 'Parse service report',
        responses: {
          '200': {
            description: 'Parsed report result',
          },
        },
      },
    },
    '/ai/scan-receipt': {
      post: {
        tags: ['AI'],
        summary: 'Scan receipt',
        responses: {
          '200': {
            description: 'Receipt parsing result',
          },
        },
      },
    },
    '/ai/fair-price': {
      post: {
        tags: ['AI'],
        summary: 'Estimate fair maintenance price',
        responses: {
          '200': {
            description: 'Price comparison response',
          },
        },
      },
    },
    '/reports/generate': {
      post: {
        tags: ['Reports'],
        summary: 'Generate report',
        responses: {
          '200': {
            description: 'Report link and hash',
          },
        },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'List audit logs',
        responses: {
          '200': {
            description: 'Audit entries',
          },
        },
      },
    },
    '/wash/suggestion': {
      get: {
        tags: ['Utility'],
        summary: 'Get wash suggestion',
        responses: {
          '200': {
            description: 'Weather-based wash suggestion',
          },
        },
      },
    },
    '/lez/check': {
      get: {
        tags: ['Utility'],
        summary: 'Check low-emission zone rule',
        responses: {
          '200': {
            description: 'LEZ check result',
          },
        },
      },
    },
    '/parts/tires/recommendations': {
      get: {
        tags: ['Utility'],
        summary: 'Get tire recommendations',
        responses: {
          '200': {
            description: 'Tire recommendation list',
          },
        },
      },
    },
  },
} as const
