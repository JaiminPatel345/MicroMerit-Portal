import { AIService } from '../modules/ai/ai.service';
import axios from 'axios';

jest.mock('axios');
jest.mock('../utils/logger');

// Mock Prisma globally
jest.mock('@prisma/client', () => {
    const mockFindMany = jest.fn();
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            credential: {
                findMany: mockFindMany
            },
            $disconnect: jest.fn()
        })),
        __mockFindMany: mockFindMany
    };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;
const { __mockFindMany: mockFindMany } = require('@prisma/client');

describe('AI Service', () => {
    let aiService: AIService;
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    beforeEach(() => {
        aiService = new AIService();
        jest.clearAllMocks();
    });

    describe('getRecommendations', () => {
        it('should get recommendations successfully', async () => {
            const mockCertificates = [
                {
                    certificate_title: 'Python Programming',
                    metadata: {
                        ai_extracted: {
                            skills: ['Python', 'Data Analysis']
                        }
                    },
                    issued_at: new Date('2024-01-15'),
                    issuer: { name: 'TechUniversity' }
                }
            ];

            const mockResponse = {
                data: {
                    skills: ['Python', 'Data Analysis', 'SQL'],
                    recommended_next_skills: [
                        {
                            skill: 'Machine Learning',
                            description: 'Advanced AI techniques',
                            market_demand_percent: 85,
                            career_outcome: 'Data Scientist'
                        }
                    ],
                    role_suggestions: [
                        {
                            role: 'Data Analyst',
                            required_skills: ['Python', 'SQL', 'Data Visualization'],
                            matched_skills: ['Python', 'SQL'],
                            percent_complete: 67
                        }
                    ],
                    learning_path: [
                        {
                            stage: 'Foundation',
                            skills: ['Python Basics', 'SQL'],
                            est_time_weeks: 8
                        }
                    ],
                    recommended_courses: [
                        {
                            title: 'Machine Learning Course',
                            provider: 'Coursera',
                            url: 'https://coursera.org/ml'
                        }
                    ],
                    nsqf_level: 6,
                    nsqf_confidence: 0.85,
                    confidence: 0.92,
                    source: 'groq'
                }
            };

            mockFindMany.mockResolvedValue(mockCertificates);
            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await aiService.getRecommendations('john@example.com');

            expect(result).toEqual(mockResponse.data);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${AI_SERVICE_URL}/recommendations`,
                {
                    learner_email: 'john@example.com',
                    certificates: [
                        {
                            certificate_title: 'Python Programming',
                            issuer_name: 'TechUniversity',
                            issued_at: mockCertificates[0]!.issued_at,
                            metadata: {
                                ai_extracted: {
                                    skills: ['Python', 'Data Analysis'],
                                    nsqf: {},
                                    keywords: [],
                                    description: '',
                                    certificate_metadata: {}
                                }
                            }
                        }
                    ]
                },
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                })
            );
        });

        it('should return empty recommendations when no certificates found', async () => {
            mockFindMany.mockResolvedValue([]);
            mockedAxios.post.mockResolvedValue({
                data: {
                    skills: [],
                    recommended_next_skills: [],
                    role_suggestions: [],
                    learning_path: [],
                    recommended_courses: [],
                    nsqf_level: 1,
                    nsqf_confidence: 0,
                    confidence: 0,
                    source: 'none'
                }
            });

            const result = await aiService.getRecommendations('john@example.com');

            expect(result.skills).toEqual([]);
            expect(result.source).toBe('none');
        });

        it('should handle AI service errors', async () => {
            mockFindMany.mockResolvedValue([]);

            const mockError = {
                response: {
                    status: 500,
                    data: { detail: 'Internal server error' }
                }
            };

            mockedAxios.post.mockRejectedValue(mockError);

            await expect(
                aiService.getRecommendations('john@example.com')
            ).rejects.toEqual({
                status: 500,
                message: 'Internal server error'
            });
        });
    });

    describe('healthCheck', () => {
        it('should return health status when AI service is available', async () => {
            const mockResponse = {
                data: {
                    status: 'ok',
                    model: 'llama-3.1-8b-instant',
                    mock: false,
                    key_loaded: true
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await aiService.healthCheck();

            expect(result).toEqual(mockResponse.data);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                `${AI_SERVICE_URL}/health`,
                { timeout: 5000 }
            );
        });

        it('should return error status when AI service is unavailable', async () => {
            mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

            const result = await aiService.healthCheck();

            expect(result).toEqual({
                status: 'error',
                message: 'AI service is not available'
            });
        });
    });
});
