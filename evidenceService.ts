import axios from 'axios';
import { getDesignElementsByCID } from './promptService';

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

/**
 * Converts files to base64 format for LLM processing
 */
export function convertFilesToBase64(files: File[]): Promise<string[]> {
    return Promise.all(
        files.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data URL prefix if present
                    const base64 = result.includes(',') ? result.split(',')[1] : result;
                    resolve(base64);
                };
                reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
                reader.readAsDataURL(file);
            });
        })
    );
}

/**
 * Calls the LLM API to process evidence for a specific control
 */
export async function GetLLMEvidence(payload: EvidencePayload): Promise<LLMEvidenceResult> {
    try {
        console.log('Sending evidence to LLM API:', {
            controlId: payload.controlId,
            designElementId: payload.designElementId,
            evidenceCount: payload.evidences.length
        });

        const response = await fetch('/api/validateDesignElements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (process.env.REACT_APP_API_TOKEN || 'mock-token')
            },
            body: JSON.stringify({
                controlId: payload.controlId,
                designElementId: payload.designElementId,
                prompt: payload.prompt,
                question: payload.question,
                evidences: payload.evidences
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as { designElementId: string; answer: string };

        console.log('LLM API response received:', data);

        return {
            controlId: payload.controlId,
            designElementId: payload.designElementId,
            prompt: payload.prompt,
            question: payload.question,
            answer: data.answer || '',
            status: 'success'
        };

    } catch (error: unknown) {
        console.error('LLM API error:', error);

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