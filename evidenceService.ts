import axios from 'axios';
import { getDesignElementsByCID } from './promptService';
import { getToken } from './authService';

export interface EvidencePayload {
    controlId: string;
    designElementId: string;
    prompt: string;
    question: string;
    evidences: string[]; // Array of base64 encoded files
}

export interface LLMEvidenceResult {
    controlId: string;
    designElementId: string;
    prompt: string;
    question: string;
    answer: string;
    status: 'success' | 'error';
    error?: string;
}

export interface ProcessedEvidenceResult {
    results: LLMEvidenceResult[];
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors: string[];
}

export interface DesignElementPrompt {
    id: string;
    prompt: string;
    question: string;
}

export interface DesignElementResult {
    controlId: string;
    designElementId: string;
    prompt: string;
    question: string;
    answer?: string;
    status: 'success' | 'error';
}

export interface LLMPayload {
    controlId: string;
    designElementId: string;
    prompt: string;
    question: string;
    evidences: string[];
}

export interface ApiResponse {
    status: 'success' | 'error';
    answer?: string;
    error?: string;
}

/**
 * Converts a single file to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Clean = base64.split(',')[1];
            resolve(base64Clean);
        };
        reader.onerror = error => reject(error);
    });
}

/**
 * Converts multiple files to base64 strings
 */
async function convertFilesToBase64(files: File[]): Promise<string[]> {
    try {
        return await Promise.all(files.map(fileToBase64));
    } catch (error) {
        console.error('Error converting files to base64:', error);
        throw new Error('Failed to convert files to base64');
    }
}

/**
 * Prepares files for the LLM payload by converting them to base64
 */
async function prepareEvidenceFiles(files: File[]): Promise<string[]> {
    try {
        const base64Promises = files.map(file => fileToBase64(file));
        return await Promise.all(base64Promises);
    } catch (error) {
        console.error('Error preparing evidence files:', error);
        throw new Error('Failed to prepare evidence files');
    }
}

/**
 * Prepares a complete payload for a single prompt
 */
export async function preparePayloadForPrompt(
    controlId: string,
    { id, prompt, question }: DesignElementPrompt,
    files: File[],
    index: number
): Promise<LLMPayload> {
    try {
        const evidences = await prepareEvidenceFiles(files);
        const designElementId = `${controlId}-${index + 1}`; // 1-based index for readability

        return {
            controlId,
            designElementId,
            prompt,
            question,
            evidences
        };
    } catch (error) {
        console.error('Error preparing payload:', error);
        throw new Error(`Failed to prepare payload for ${controlId}`);
    }
}

/**
 * Validates a single design element by sending it to the API
 */
export async function validateDesignElement(payload: LLMPayload): Promise<DesignElementResult> {
    try {
        const token = await getToken();

        console.log('Payload sent:', {
            controlId: payload.controlId,
            designElementId: payload.designElementId,
            prompt: payload.prompt,
            question: payload.question,
            evidenceCount: payload.evidences.length
        });

        const response = await fetch('/api/validateDesignElements', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Response received:', data);
        console.log(`Validated element ${payload.designElementId}:`, data);

        return {
            ...data,
            status: 'success' as const
        };
    } catch (error) {
        console.error(`Error validating element ${payload.designElementId}:`, error);
        return {
            controlId: payload.controlId,
            designElementId: payload.designElementId,
            prompt: payload.prompt,
            question: payload.question,
            answer: '',
            status: 'error' as const
        };
    }
}

/**
 * Calls the LLM API to process evidence for a specific control
 */
export async function GetLLMEvidence(payload: EvidencePayload): Promise<LLMEvidenceResult> {
    try {
        // Log the full payload structure (excluding actual base64 content for readability)
        console.log('🚀 Starting LLM API call with payload:', {
            controlId: payload.controlId,
            designElementId: payload.designElementId,
            prompt: payload.prompt,
            question: payload.question,
            evidenceCount: payload.evidences.length,
            evidenceSizes: payload.evidences.map(e => e.length)
        });

        // Log token retrieval attempt
        console.log('📝 Retrieving authentication token...');
        const token = await getToken();
        console.log('✅ Token retrieved successfully');

        // Log the API endpoint being called
        console.log('🔗 Calling API endpoint: /api/validateDesignElements');

        const { data } = await axios.post<Omit<LLMEvidenceResult, 'status'>>(
            '/api/validateDesignElements',
            {
                controlId: payload.controlId,
                designElementId: payload.designElementId,
                prompt: payload.prompt,
                question: payload.question,
                evidences: payload.evidences
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: (status) => {
                    console.log(`📊 Received status code: ${status}`);
                    return status >= 200 && status < 300;
                }
            }
        );

        console.log('✅ API call successful, response:', {
            controlId: data.controlId,
            designElementId: data.designElementId,
            answerLength: data.answer?.length || 0
        });

        return {
            ...data,
            controlId: payload.controlId,
            designElementId: payload.designElementId,
            prompt: payload.prompt,
            question: payload.question,
            status: 'success' as const
        };

    } catch (error: unknown) {
        console.error('❌ LLM API error:', error);

        // Enhanced error logging
        if (axios.isAxiosError(error)) {
            console.error('📌 Detailed Axios error information:');
            console.error('- Request URL:', error.config?.url);
            console.error('- Request Method:', error.config?.method);
            console.error('- Status Code:', error.response?.status);
            console.error('- Status Text:', error.response?.statusText);
            console.error('- Response Data:', error.response?.data);
            console.error('- Request Headers:', error.config?.headers);
        }

        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return {
            controlId: payload.controlId,
            designElementId: payload.designElementId,
            prompt: payload.prompt,
            question: payload.question,
            answer: '',
            status: 'error',
            error: errorMessage
        };
    }
}

/**
 * Processes multiple controls with evidence through LLM
 */
export async function processControlsWithEvidence(
    controls: Array<{
        cid: string;
        controlName: string;
        evidences: Array<{ base64: string; name: string; type: string }>;
    }>,
    onProgress?: (progress: { current: number; total: number; currentControl: string }) => void
): Promise<ProcessedEvidenceResult> {
    const result: ProcessedEvidenceResult = {
        results: [],
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
    };

    let currentIndex = 0;
    const totalControls = controls.length;

    for (const control of controls) {
        currentIndex++;

        try {
            // Get design elements for this CID
            const [isValid, designElements] = await getDesignElementsByCID(control.cid);

            if (!isValid || designElements.length === 0) {
                const errorMsg = `No design elements found for Control ID: ${control.cid}`;
                result.errors.push(errorMsg);
                result.errorCount++;

                // Report progress
                if (onProgress) {
                    onProgress({
                        current: currentIndex,
                        total: totalControls,
                        currentControl: `${control.controlName} (Error: No design elements)`
                    });
                }

                continue;
            }

            // Process each design element
            for (const element of designElements) {
                try {
                    // Report progress
                    if (onProgress) {
                        onProgress({
                            current: currentIndex,
                            total: totalControls,
                            currentControl: `${control.controlName} - Processing ${element.id}`
                        });
                    }

                    const payload: EvidencePayload = {
                        controlId: control.cid,
                        designElementId: element.id,
                        prompt: element.prompt,
                        question: element.question,
                        evidences: control.evidences.map(e => e.base64)
                    };

                    const llmResult = await GetLLMEvidence(payload);
                    result.results.push(llmResult);
                    result.totalProcessed++;

                    if (llmResult.status === 'success') {
                        result.successCount++;
                    } else {
                        result.errorCount++;
                        if (llmResult.error) {
                            result.errors.push(`${control.controlName} (${element.id}): ${llmResult.error}`);
                        }
                    }

                    // Add small delay to prevent overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    const errorMsg = `Failed to process ${control.controlName} - ${element.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    result.errors.push(errorMsg);
                    result.errorCount++;
                    result.totalProcessed++;
                }
            }

        } catch (error) {
            const errorMsg = `Failed to get design elements for ${control.controlName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            result.errors.push(errorMsg);
            result.errorCount++;

            // Report progress
            if (onProgress) {
                onProgress({
                    current: currentIndex,
                    total: totalControls,
                    currentControl: `${control.controlName} (Error)`
                });
            }
        }
    }

    return result;
}

/**
 * Batch processes evidence with concurrency control
 */
export async function batchProcessEvidence(
    payloads: EvidencePayload[],
    concurrency: number = 3,
    onProgress?: (progress: { completed: number; total: number; current?: string }) => void
): Promise<LLMEvidenceResult[]> {
    const results: LLMEvidenceResult[] = [];
    const total = payloads.length;
    let completed = 0;

    // Process in batches to control concurrency
    for (let i = 0; i < payloads.length; i += concurrency) {
        const batch = payloads.slice(i, i + concurrency);

        const batchPromises = batch.map(async (payload) => {
            try {
                const result = await GetLLMEvidence(payload);
                completed++;

                if (onProgress) {
                    onProgress({
                        completed,
                        total,
                        current: `${payload.controlId} - ${payload.designElementId}`
                    });
                }

                return result;
            } catch (error) {
                completed++;

                if (onProgress) {
                    onProgress({
                        completed,
                        total,
                        current: `${payload.controlId} - ${payload.designElementId} (Error)`
                    });
                }

                return {
                    controlId: payload.controlId,
                    designElementId: payload.designElementId,
                    prompt: payload.prompt,
                    question: payload.question,
                    answer: '',
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }

    return results;
}

/**
 * Validates evidence files before processing
 */
export function validateEvidenceFiles(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];

    for (const file of files) {
        if (file.size > maxFileSize) {
            errors.push(`File "${file.name}" exceeds 10MB size limit`);
        }

        if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
            errors.push(`File "${file.name}" has unsupported type: ${file.type}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Submits a prompt for a control with evidence files
 */
export async function submitPromptForControl(
    controlId: string,
    prompt: string,
    question: string,
    evidenceFiles: File[],
    designElementIndex: number
): Promise<ApiResponse> {
    try {
        // Convert files to base64
        const evidences = await convertFilesToBase64(evidenceFiles);

        // Prepare the payload
        const payload = {
            controlId,
            designElementId: `${controlId}-${designElementIndex}`,
            prompt,
            question,
            evidences
        };

        // Log the payload (excluding base64 data for clarity)
        console.log('Submitting payload:', {
            ...payload,
            evidences: `${evidences.length} files`
        });

        // Make the API call using existing endpoint
        const { data } = await axios.post<ApiResponse>(
            '/api/validateDesignElements',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`Response for ${payload.designElementId}:`, data);
        return data;

    } catch (error) {
        console.error(`Error submitting prompt for ${controlId}:`, error);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to submit prompt'
        };
    }
}

// Export the type from promptService
export type { QuestionPrompt } from './promptService'; 
