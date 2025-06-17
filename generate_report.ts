// Mock report generation service
export interface ReportItem {
    id: string;
    question: string;
    answer: 'YES' | 'NO' | 'PARTIAL';
    quality: 'ADEQUATE' | 'INADEQUATE' | 'NEEDS_REVIEW';
    source: string;
    summary: string;
    reference: string;
}

// Mock data based on the UI requirements
export const generateMockReport = async (): Promise<ReportItem[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [
        {
            id: "BCP-001",
            question: "Artifact(s) Required: Business continuity planning and disaster recovery (BCP/DR) policy, procedure, or standard for all in-scope facility locations (e.g., offices and datacenters) that collect, store, process, handle, or transfer client data",
            answer: "YES",
            quality: "ADEQUATE",
            source: "Security Documentation v2.3",
            summary: "The vendor has implemented all required security controls as specified in the compliance framework.",
            reference: "Section 4.2, Page 18"
        },
        {
            id: "BCP-002",
            question: "Artifact(s) Required: Business continuity planning and disaster recovery (BCP/DR) policy, procedure, or standard for all in-scope facility locations (e.g., offices and datacenters) that collect, store, process, handle, or transfer client data with the following design element: Team roles and responsibilities for all in-scope facility locations (e.g., offices and datacenters) that collect, store, process, handle, or transfer client data",
            answer: "YES",
            quality: "ADEQUATE",
            source: "BCP Documentation Package",
            summary: "Comprehensive business continuity plan with clearly defined team roles and responsibilities across all facility locations.",
            reference: "BCP Manual Section 2.1, Pages 15-22"
        },
        {
            id: "BCP-003",
            question: "Artifact(s) Required: Business continuity planning and disaster recovery (BCP/DR) policy, procedure, or standard for all in-scope facility locations (e.g., offices and datacenters) that collect, store, process, handle, or transfer client data with the following design element: Business impact analysis that is reviewed and approved by senior management at least every 12 months and after any significant changes",
            answer: "YES",
            quality: "ADEQUATE",
            source: "Business Impact Analysis Report 2024",
            summary: "Current business impact analysis reviewed and approved by senior management in Q1 2024, with quarterly review schedule established.",
            reference: "BIA Report 2024, Executive Summary"
        },
        {
            id: "IAM-001",
            question: "Artifact(s) Required: Identity and access management policy with the following design element: Multi-factor authentication requirements for privileged accounts",
            answer: "PARTIAL",
            quality: "NEEDS_REVIEW",
            source: "IAM Policy Document v1.8",
            summary: "MFA is implemented for most privileged accounts but some legacy systems still require single-factor authentication.",
            reference: "IAM Policy Section 3.4, Page 12"
        },
        {
            id: "SEC-001",
            question: "Artifact(s) Required: Information security policy with the following design element: Data classification and handling procedures",
            answer: "NO",
            quality: "INADEQUATE",
            source: "Security Assessment Report",
            summary: "The evidence does not demonstrate sufficient implementation of data classification procedures. Current policy lacks specific handling requirements for different data types.",
            reference: "Security Assessment, Finding #7, Page 28"
        }
    ];
};

// Wells Fargo color theme configuration
export const wellsFargoTheme = {
    colors: {
        primary: '#D71E2B',      // Wells Fargo Red
        secondary: '#FFCD41',    // Wells Fargo Gold
        success: '#00A651',      // Green for adequate
        warning: '#FF8C00',      // Orange for needs review
        danger: '#D71E2B',       // Red for inadequate
        background: '#F8F9FA',   // Light background
        text: '#333333',         // Dark text
        border: '#E5E5E5'        // Light border
    },
    qualityColors: {
        'ADEQUATE': '#00A651',
        'NEEDS_REVIEW': '#FF8C00',
        'INADEQUATE': '#D71E2B'
    },
    answerColors: {
        'YES': '#00A651',
        'PARTIAL': '#FF8C00',
        'NO': '#D71E2B'
    }
}; 