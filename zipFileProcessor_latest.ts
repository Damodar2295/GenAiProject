import JSZip from 'jszip';
import * as domainListModule from '../data/domain_list.json';

export interface ExtractedFile {
    name: string;
    content: ArrayBuffer;
    type: 'pdf' | 'other';
    base64: string;
}

export interface ControlEvidence {
    cid: string;
    controlName: string;
    evidences: ExtractedFile[];
}

export interface ProcessedZipResult {
    controls: ControlEvidence[];
    totalFiles: number;
    totalControls: number;
    errors: string[];
}

// Domain interface matching domain_list.json structure
interface DomainItem {
    Domain_Id: number;
    Domain_Code: string;
    Domain_Name: string;
    Sub_Domain_Name: string;
    Question: string;
    Question_Description: string;
}

// Load domain data using import
const domain_list = (domainListModule as any).default || domainListModule as unknown as DomainItem[];

// Cache for domain mappings to avoid repeated processing
let domainMappingCache: Record<string, string> | null = null;

/**
 * Loads domain mappings from imported domain_list.json
 */
function loadDomainMappings(): Record<string, string> {
    if (domainMappingCache) {
        return domainMappingCache;
    }

    try {
        const mappings: Record<string, string> = {};

        domain_list.forEach((domain: DomainItem) => {
            // Create multiple mapping variations for flexibility
            const domainName = domain.Domain_Name.toLowerCase();
            const domainCode = domain.Domain_Code;

            // Map normalized domain name to domain code
            const normalizedName = normalizeControlName(domainName);
            mappings[normalizedName] = domainCode;

            // Also map common variations
            // Business Continuity -> business_continuity, bc, bcp
            if (domainName.includes('business continuity')) {
                mappings['business_continuity'] = domainCode;
                mappings['bc'] = domainCode;
                mappings['bcp'] = domainCode;
                mappings['business_continuity_plan'] = domainCode;
            }

            // Cloud Computing -> cloud_computing, cloud
            if (domainName.includes('cloud')) {
                mappings['cloud_computing'] = domainCode;
                mappings['cloud'] = domainCode;
                mappings['cloud_security'] = domainCode;
            }

            // Change Management -> change_management, change, cm
            if (domainName.includes('change')) {
                mappings['change_management'] = domainCode;
                mappings['change'] = domainCode;
                mappings['cm'] = domainCode;
            }

            // Data Loss Prevention -> data_loss_prevention, dlp
            if (domainName.includes('data loss')) {
                mappings['data_loss_prevention'] = domainCode;
                mappings['dlp'] = domainCode;
            }

            // Enterprise Data Management -> enterprise_data_management, edm, data_management
            if (domainName.includes('enterprise data')) {
                mappings['enterprise_data_management'] = domainCode;
                mappings['edm'] = domainCode;
                mappings['data_management'] = domainCode;
                mappings['data_classification'] = domainCode;
            }

            // Add common security control mappings
            if (domainName.includes('access')) {
                mappings['access_control'] = domainCode;
                mappings['authentication'] = domainCode;
                mappings['authorization'] = domainCode;
            }
        });

        // Store in cache
        domainMappingCache = mappings;
        return mappings;

    } catch (error) {
        console.error('Failed to load domain mappings:', error);
        // Fallback to basic mappings if processing fails
        return {
            'business_continuity': 'BC001',
            'cloud_computing': 'CC001',
            'change_management': 'CM001',
            'data_loss_prevention': 'DLP001',
            'enterprise_data_management': 'EDM001'
        };
    }
}

/**
 * Normalizes folder names to match control mapping keys
 */
function normalizeControlName(folderName: string): string {
    return folderName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Converts file content to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Determines file type based on extension
 */
function getFileType(fileName: string): 'pdf' | 'other' {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'pdf' ? 'pdf' : 'other';
}

/**
 * Maps control folder name to CID using domain_list.json
 */
function mapControlNameToCID(controlName: string): string | null {
    const mappings = loadDomainMappings();
    const normalizedName = normalizeControlName(controlName);
    return mappings[normalizedName] || null;
}

/**
 * Processes a zip file and extracts control evidence
 */
export async function processZipFile(zipFile: File): Promise<ProcessedZipResult> {
    const result: ProcessedZipResult = {
        controls: [],
        totalFiles: 0,
        totalControls: 0,
        errors: []
    };

    try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);

        // Group files by folder (control)
        const controlFolders: Record<string, JSZip.JSZipObject[]> = {};

        zipContent.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && relativePath.includes('/')) {
                const folderName = relativePath.split('/')[0];
                if (!controlFolders[folderName]) {
                    controlFolders[folderName] = [];
                }
                controlFolders[folderName].push(zipEntry);
            }
        });

        // Process each control folder
        for (const [folderName, files] of Object.entries(controlFolders)) {
            const cid = mapControlNameToCID(folderName);

            if (!cid) {
                result.errors.push(`Unable to map folder "${folderName}" to a Control ID. Available mappings are loaded from domain_list.json`);
                continue;
            }

            const evidences: ExtractedFile[] = [];

            // Process files in this control folder
            for (const file of files) {
                try {
                    const content = await file.async('arraybuffer');
                    const fileName = file.name.split('/').pop() || file.name;
                    const fileType = getFileType(fileName);
                    const base64 = arrayBufferToBase64(content);

                    evidences.push({
                        name: fileName,
                        content,
                        type: fileType,
                        base64
                    });

                    result.totalFiles++;
                } catch (error) {
                    result.errors.push(`Failed to process file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            if (evidences.length > 0) {
                result.controls.push({
                    cid,
                    controlName: folderName,
                    evidences
                });
                result.totalControls++;
            }
        }

        return result;

    } catch (error) {
        result.errors.push(`Failed to process zip file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return result;
    }
}

/**
 * Validates if a zip file contains valid structure
 */
export async function validateZipStructure(zipFile: File): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);

        let hasValidStructure = false;
        const foundFolders: string[] = [];

        zipContent.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && relativePath.includes('/')) {
                const folderName = relativePath.split('/')[0];
                if (!foundFolders.includes(folderName)) {
                    foundFolders.push(folderName);
                }
            }
        });

        // Check if any folders can be mapped to valid controls
        for (const folderName of foundFolders) {
            const cid = mapControlNameToCID(folderName);
            if (cid) {
                hasValidStructure = true;
                break;
            }
        }

        if (!hasValidStructure) {
            errors.push(`No valid control folders found in zip file. Found folders: ${foundFolders.join(', ')}. Please ensure folders are named according to domain standards from domain_list.json`);
        }

        return { isValid: hasValidStructure, errors };

    } catch (error) {
        errors.push(`Invalid zip file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { isValid: false, errors };
    }
}

/**
 * Gets available control mappings for reference
 */
export function getAvailableControlMappings(): Record<string, string> {
    return loadDomainMappings();
}

/**
 * Debug utility: Get expected folder names for all domains
 * This helps users understand what folder names should be used in ZIP files
 */
export function getExpectedFolderNames(): Array<{ domainCode: string, domainName: string, expectedFolderNames: string[] }> {
    try {
        return domain_list.map((domain: DomainItem) => {
            const domainName = domain.Domain_Name.toLowerCase();
            const expectedNames: string[] = [];

            // Add the normalized domain name
            expectedNames.push(normalizeControlName(domainName));

            // Add common variations based on domain type
            if (domainName.includes('business continuity')) {
                expectedNames.push('business_continuity', 'bc', 'bcp', 'business_continuity_plan');
            }

            if (domainName.includes('cloud')) {
                expectedNames.push('cloud_computing', 'cloud', 'cloud_security');
            }

            if (domainName.includes('change')) {
                expectedNames.push('change_management', 'change', 'cm');
            }

            if (domainName.includes('data loss')) {
                expectedNames.push('data_loss_prevention', 'dlp');
            }

            if (domainName.includes('enterprise data')) {
                expectedNames.push('enterprise_data_management', 'edm', 'data_management', 'data_classification');
            }

            if (domainName.includes('access')) {
                expectedNames.push('access_control', 'authentication', 'authorization');
            }

            // Remove duplicates
            const uniqueNames = [...new Set(expectedNames)];

            return {
                domainCode: domain.Domain_Code,
                domainName: domain.Domain_Name,
                expectedFolderNames: uniqueNames
            };
        });

    } catch (error) {
        console.error('Failed to get expected folder names:', error);
        return [];
    }
} 