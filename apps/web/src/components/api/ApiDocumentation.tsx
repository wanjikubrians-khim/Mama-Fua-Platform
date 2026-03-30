'use client';
// Mama Fua — API Documentation Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { 
  Code, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Terminal, 
  Globe, 
  ShieldCheck, 
  Key, 
  Download, 
  Search, 
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  Loader2
} from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  authRequired: boolean;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
  }>;
  requestBody?: {
    contentType: string;
    schema: any;
    example: any;
  };
  responses: {
    [statusCode: string]: {
      description: string;
      schema?: any;
      example?: any;
    };
  };
  category: string;
  version: string;
  deprecated?: boolean;
}

interface ApiDocumentationProps {
  className?: string;
  interactive?: boolean;
  apiKey?: string;
}

export function ApiDocumentation({ 
  className = '', 
  interactive = true, 
  apiKey 
}: ApiDocumentationProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [copiedCode, setCopiedCode] = useState<string>('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestResponse, setRequestResponse] = useState<any>(null);
  const [isMakingRequest, setIsMakingRequest] = useState(false);

  // Mock API endpoints based on MF-DOC-009
  const apiEndpoints: ApiEndpoint[] = [
    {
      method: 'POST',
      path: '/auth/request-otp',
      description: 'Send OTP to phone number',
      authRequired: false,
      parameters: [
        { name: 'phone', type: 'string', required: true, description: 'Kenyan phone number (+254 format)', example: '+254712345678' }
      ],
      requestBody: {
        contentType: 'application/json',
        schema: { phone: 'string' },
        example: { phone: '+254712345678' }
      },
      responses: {
        '200': { description: 'OTP sent successfully', example: { success: true, expiresIn: 600 } },
        '400': { description: 'Invalid phone number', example: { error: 'Invalid phone number format' } },
        '429': { description: 'Too many requests', example: { error: 'Rate limit exceeded' } }
      },
      category: 'Authentication',
      version: 'v1'
    },
    {
      method: 'POST',
      path: '/auth/verify-otp',
      description: 'Verify OTP and return tokens',
      authRequired: false,
      parameters: [
        { name: 'phone', type: 'string', required: true, description: 'Kenyan phone number', example: '+254712345678' },
        { name: 'otp', type: 'string', required: true, description: '6-digit OTP code', example: '123456' }
      ],
      requestBody: {
        contentType: 'application/json',
        schema: { phone: 'string', otp: 'string' },
        example: { phone: '+254712345678', otp: '123456' }
      },
      responses: {
        '200': { 
          description: 'Authentication successful', 
          example: { 
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: { id: 'user123', role: 'CLIENT', firstName: 'John', lastName: 'Doe' }
          } 
        },
        '401': { description: 'Invalid OTP', example: { error: 'Invalid OTP code' } }
      },
      category: 'Authentication',
      version: 'v1'
    },
    {
      method: 'GET',
      path: '/users/me',
      description: 'Get current user profile',
      authRequired: true,
      responses: {
        '200': { 
          description: 'User profile retrieved',
          example: {
            id: 'user123',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+254712345678',
            email: 'john@example.com',
            role: 'CLIENT',
            avatarUrl: 'https://example.com/avatar.jpg',
            createdAt: '2024-01-01T00:00:00Z'
          }
        },
        '401': { description: 'Unauthorized', example: { error: 'Invalid token' } }
      },
      category: 'Users',
      version: 'v1'
    },
    {
      method: 'POST',
      path: '/bookings',
      description: 'Create a new booking',
      authRequired: true,
      requestBody: {
        contentType: 'application/json',
        schema: {
          serviceType: 'string',
          scheduledTime: 'string',
          address: 'object',
          totalAmount: 'number'
        },
        example: {
          serviceType: 'Home Cleaning',
          scheduledTime: '2024-03-20T10:00:00Z',
          address: {
            addressLine1: '123 Main St',
            area: 'Nairobi',
            city: 'Nairobi',
            lat: -1.2921,
            lng: 36.8219
          },
          totalAmount: 120000
        }
      },
      responses: {
        '201': { 
          description: 'Booking created successfully',
          example: {
            id: 'booking123',
            bookingRef: 'BK001',
            status: 'PENDING',
            totalAmount: 120000,
            createdAt: '2024-03-15T10:30:00Z'
          }
        },
        '400': { description: 'Invalid booking data', example: { error: 'Invalid service type' } }
      },
      category: 'Bookings',
      version: 'v1'
    },
    {
      method: 'GET',
      path: '/cleaners/:id',
      description: 'Get cleaner public profile',
      authRequired: true,
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Cleaner ID', example: 'cleaner123' }
      ],
      responses: {
        '200': { 
          description: 'Cleaner profile retrieved',
          example: {
            id: 'cleaner123',
            firstName: 'Grace',
            lastName: 'Wanjiru',
            rating: 4.8,
            totalJobs: 156,
            services: [
              { name: 'Home Cleaning', price: 1200 },
              { name: 'Deep Cleaning', price: 3500 }
            ],
            verificationStatus: 'VERIFIED'
          }
        },
        '404': { description: 'Cleaner not found', example: { error: 'Cleaner not found' } }
      },
      category: 'Cleaners',
      version: 'v1'
    },
    {
      method: 'POST',
      path: '/payments/mpesa/initiate',
      description: 'Initiate M-Pesa payment',
      authRequired: true,
      requestBody: {
        contentType: 'application/json',
        schema: {
          bookingId: 'string',
          phone: 'string',
          amount: 'number'
        },
        example: {
          bookingId: 'booking123',
          phone: '+254712345678',
          amount: 120000
        }
      },
      responses: {
        '200': { 
          description: 'Payment initiated',
          example: {
            checkoutRequestId: 'ws_CO_123456789',
            merchantRequestId: 'MERCH_123456789',
            message: 'Payment initiated successfully'
          }
        },
        '400': { description: 'Invalid payment data', example: { error: 'Invalid amount' } }
      },
      category: 'Payments',
      version: 'v1'
    }
  ];

  const categories = ['all', ...Array.from(new Set(apiEndpoints.map(ep => ep.category)))];

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesCategory = selectedCategory === 'all' || endpoint.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.method.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-700';
      case 'POST': return 'bg-blue-100 text-blue-700';
      case 'PATCH': return 'bg-amber-100 text-amber-700';
      case 'PUT': return 'bg-purple-100 text-purple-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const makeApiRequest = async (endpoint: ApiEndpoint) => {
    if (!interactive || !apiKey) return;
    
    setIsMakingRequest(true);
    setRequestResponse(null);
    
    try {
      // Mock API request - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setRequestResponse({
        status: 200,
        data: endpoint.responses['200']?.example || { message: 'Success' },
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req_123456789'
        }
      });
    } catch (error) {
      setRequestResponse({
        status: 500,
        error: 'Request failed',
        message: 'Unable to connect to API'
      });
    } finally {
      setIsMakingRequest(false);
    }
  };

  const generateCurlCommand = (endpoint: ApiEndpoint) => {
    const baseUrl = 'https://api.mamafua.co.ke/api/v1';
    const authHeader = apiKey ? `-H "Authorization: Bearer ${apiKey}"` : '';
    const bodyHeader = endpoint.requestBody ? `-H "Content-Type: ${endpoint.requestBody.contentType}"` : '';
    const bodyData = endpoint.requestBody ? `-d '${JSON.stringify(endpoint.requestBody.example)}'` : '';
    
    return `curl -X ${endpoint.method} \\\n  ${authHeader} \\\n  ${bodyHeader} \\\n  ${bodyData} \\\n  ${baseUrl}${endpoint.path}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">API Documentation</h2>
          <p className="text-ink-600">Mama Fua Platform REST API v1</p>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href="https://api.mamafua.co.ke/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-4 py-2"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Interactive Docs
          </a>
          
          <button className="btn-secondary px-4 py-2">
            <Download className="mr-2 h-4 w-4" />
            Export OpenAPI
          </button>
        </div>
      </div>

      {/* API Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-ink-900">Base URL</h3>
            </div>
            <code className="text-sm text-ink-700 bg-slate-100 px-2 py-1 rounded">
              https://api.mamafua.co.ke/api/v1
            </code>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-ink-900">Authentication</h3>
            </div>
            <p className="text-sm text-ink-700">Bearer JWT token</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-ink-900">Security</h3>
            </div>
            <p className="text-sm text-ink-700">HTTPS required</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-ink-900">Rate Limit</h3>
            </div>
            <p className="text-sm text-ink-700">100 req/min per user</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {filteredEndpoints.map((endpoint) => (
          <div key={`${endpoint.method}-${endpoint.path}`} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`rounded px-2 py-1 text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono text-sm text-ink-900">{endpoint.path}</code>
                      {endpoint.authRequired && (
                        <div className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          Auth Required
                        </div>
                      )}
                      {endpoint.deprecated && (
                        <div className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          Deprecated
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-ink-700">{endpoint.description}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-ink-500">
                      <span>{endpoint.category}</span>
                      <span>v{endpoint.version}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {interactive && (
                      <button
                        onClick={() => makeApiRequest(endpoint)}
                        disabled={isMakingRequest}
                        className="btn-ghost p-2"
                        title="Try this endpoint"
                      >
                        <Terminal className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedEndpoint(endpoint)}
                      className="btn-ghost p-2"
                      title="View details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Parameters */}
              {endpoint.parameters && endpoint.parameters.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-semibold text-ink-900 mb-2">Parameters</h4>
                  <div className="space-y-2">
                    {endpoint.parameters.map((param) => (
                      <div key={param.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-ink-900">{param.name}</code>
                          <span className="text-ink-600">{param.type}</span>
                          {param.required && (
                            <span className="text-red-600 font-medium">required</span>
                          )}
                        </div>
                        <span className="text-ink-600">{param.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Endpoint Details Modal */}
      {selectedEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`rounded px-2 py-1 text-xs font-medium ${getMethodColor(selectedEndpoint.method)}`}>
                  {selectedEndpoint.method}
                </div>
                <h3 className="text-lg font-semibold text-ink-900">
                  {selectedEndpoint.path}
                </h3>
              </div>
              
              <button
                onClick={() => setSelectedEndpoint(null)}
                className="btn-ghost p-2"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-ink-900 mb-2">Description</h4>
                <p className="text-ink-700">{selectedEndpoint.description}</p>
              </div>

              {/* Request Body */}
              {selectedEndpoint.requestBody && (
                <div>
                  <h4 className="font-semibold text-ink-900 mb-2">Request Body</h4>
                  <div className="space-y-3">
	                    <div className="flex items-center justify-between">
	                      <span className="text-sm text-ink-600">Content-Type: {selectedEndpoint.requestBody.contentType}</span>
	                      <button
	                        onClick={() =>
	                          copyToClipboard(
	                            JSON.stringify(selectedEndpoint.requestBody?.example ?? {}, null, 2),
	                            'request'
	                          )
	                        }
	                        className="btn-ghost px-3 py-1 text-sm"
	                      >
                        {copiedCode === 'request' ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">{JSON.stringify(selectedEndpoint.requestBody.example, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Responses */}
              <div>
                <h4 className="font-semibold text-ink-900 mb-2">Responses</h4>
                <div className="space-y-4">
                  {Object.entries(selectedEndpoint.responses).map(([statusCode, response]) => (
                    <div key={statusCode} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm font-medium ${
                            statusCode.startsWith('2') ? 'text-green-600' :
                            statusCode.startsWith('4') ? 'text-amber-600' :
                            statusCode.startsWith('5') ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {statusCode}
                          </span>
                          <span className="text-sm text-ink-700">{response.description}</span>
                        </div>
                      </div>
                      
                      {response.example && (
                        <pre className="bg-slate-100 p-3 rounded-lg overflow-x-auto text-sm">
                          <code>{JSON.stringify(response.example, null, 2)}</code>
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* cURL Command */}
              <div>
                <h4 className="font-semibold text-ink-900 mb-2">cURL Command</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-600">Copy command to clipboard</span>
                    <button
                      onClick={() => copyToClipboard(generateCurlCommand(selectedEndpoint), 'curl')}
                      className="btn-ghost px-3 py-1 text-sm"
                    >
                      {copiedCode === 'curl' ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{generateCurlCommand(selectedEndpoint)}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Response Modal */}
      {requestResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink-900">API Response</h3>
              <button
                onClick={() => setRequestResponse(null)}
                className="btn-ghost p-2"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">Status</span>
                <div className={`rounded px-2 py-1 text-xs font-medium ${
                  requestResponse.status >= 200 && requestResponse.status < 300 ? 'bg-green-100 text-green-700' :
                  requestResponse.status >= 400 && requestResponse.status < 500 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {requestResponse.status}
                </div>
              </div>

              {requestResponse.headers && (
                <div>
                  <h4 className="font-semibold text-ink-900 mb-2">Headers</h4>
                  <pre className="bg-slate-100 p-3 rounded-lg text-sm">
                    <code>{JSON.stringify(requestResponse.headers, null, 2)}</code>
                  </pre>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-ink-900 mb-2">Response Body</h4>
                <pre className="bg-slate-100 p-3 rounded-lg text-sm">
                  <code>{JSON.stringify(requestResponse.data || requestResponse, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
