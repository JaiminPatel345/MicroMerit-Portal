export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'MicroMerit Issuer API',
    version: '1.0.0',
    description:
      'Programmatically issue and track verifiable credentials using your API key. Generate an API key from the MicroMerit Portal under **Issuer → API Keys**.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Your API key from the MicroMerit Portal dashboard.',
      },
    },
    schemas: {
      CredentialResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Credential issued successfully' },
          data: {
            type: 'object',
            properties: {
              credential_id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-...' },
              certificate_title: { type: 'string', example: 'Python Programming' },
              learner_email: { type: 'string', example: 'student@example.com' },
              blockchain_status: { type: 'string', example: 'pending' },
              ipfs_status: { type: 'string', example: 'pending' },
              issued_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Unauthorized' },
          message: { type: 'string', example: 'Invalid or missing API key' },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/credentials/api/issue': {
      post: {
        tags: ['Credentials'],
        summary: 'Issue a credential',
        description:
          'Issue a verifiable credential to a learner. The PDF is embedded with a unique credential ID, SHA-256 hashed, anchored on the blockchain, and uploaded to IPFS — all asynchronously. The API responds immediately with `pending` statuses; use the blockchain-status endpoint to poll for completion.',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'learner_email', 'certificate_title'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'The credential PDF file.',
                  },
                  learner_email: {
                    type: 'string',
                    format: 'email',
                    example: 'student@example.com',
                    description: 'Email of the learner receiving the credential.',
                  },
                  certificate_title: {
                    type: 'string',
                    example: 'Python Programming Fundamentals',
                    description: 'Title of the credential.',
                  },
                  issued_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-01-15T00:00:00.000Z',
                    description: 'ISO 8601 issuance date. Defaults to current time if omitted.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Credential issued. Blockchain & IPFS anchoring happens in the background.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CredentialResponse' },
              },
            },
          },
          '400': {
            description: 'Missing or invalid fields',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          '401': {
            description: 'Invalid or missing API key',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/credentials/{id}/blockchain-status': {
      get: {
        tags: ['Credentials'],
        summary: 'Get blockchain anchoring status',
        description: 'Poll this endpoint after issuing a credential to check whether it has been anchored on-chain and uploaded to IPFS.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'The `credential_id` returned from the issue endpoint.',
          },
        ],
        responses: {
          '200': {
            description: 'Current status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        blockchain_status: { type: 'string', enum: ['pending', 'confirmed', 'failed'] },
                        ipfs_status: { type: 'string', enum: ['pending', 'uploaded', 'failed'] },
                        tx_hash: { type: 'string', nullable: true, example: '0xabc123...' },
                        ipfs_cid: { type: 'string', nullable: true, example: 'bafybeig...' },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': { description: 'Credential not found' },
        },
      },
    },
    '/credentials/public/{id}': {
      get: {
        tags: ['Credentials'],
        summary: 'Get public credential details',
        description: 'Fetch publicly visible credential metadata. No authentication required.',
        security: [],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'The credential UUID.',
          },
        ],
        responses: {
          '200': { description: 'Credential metadata' },
          '404': { description: 'Credential not found' },
        },
      },
    },
  },
  tags: [
    { name: 'Credentials', description: 'Issue and track credentials via API key' },
  ],
};
