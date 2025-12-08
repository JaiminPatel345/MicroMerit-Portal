/**
 * Types for the dummy credential provider server
 */

export interface MockCredential {
    id: string;
    learner_email: string;
    learner_name: string;
    certificate_title: string;
    certificate_code: string;
    issued_at: Date;
    sector: string;
    nsqf_level: number;
    max_hr: number;
    min_hr: number;
    awarding_bodies: string[];
    occupation: string;
    tags: string[];
    description: string;
    provider: 'nsdc' | 'udemy' | 'jaimin';
}

// NSDC response format
export interface NSDCCredentialResponse {
    credential_id: string;
    candidate_name: string;
    candidate_email: string;
    qualification_title: string;
    qp_code: string;
    sector: string;
    nsqf_level: number;
    training_hours: {
        min: number;
        max: number;
    };
    awarding_bodies: string[];
    occupation: string;
    tags: string[];
    issue_date: string;
    certificate_url: string;
}

// Udemy response format
export interface UdemyCredentialResponse {
    id: string;
    completion_date: string;
    course: {
        id: string;
        title: string;
        description: string;
        category: string;
        estimated_hours: number;
        code: string; // added
    };
    user: {
        email: string;
        display_name: string;
    };
    certificate_url: string;
    // Extra fields usually in a details call, but we'll include here for mock simplicity
    metadata?: {
        awarding_bodies: string[];
        tags: string[];
        level?: number;
    };
}

// Jaimin Pvt Ltd response format
export interface JaiminCredentialResponse {
    cert_id: string;
    trainee_email: string;
    trainee_name: string;
    program_name: string;
    program_code: string;
    industry_sector: string;
    skill_level: number;
    duration_hours: number;
    completed_on: string;
    issued_by: string[]; // changed to array
    role: string; // occupation
    tags: string[];
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        next_page_token?: string;
    };
}

export const TEST_USERS = [
    { email: 'test1@gmail.com', name: 'Test User One' },
    { email: 'test2@gmail.com', name: 'Test User Two' },
    { email: 'test3@gmail.com', name: 'Test User Three' },
    { email: 'test4@gmail.com', name: 'Test User Four' },
    { email: 'test5@gmail.com', name: 'Test User Five' },
];
