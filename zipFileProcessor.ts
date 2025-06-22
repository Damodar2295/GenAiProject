import JSZip from 'jszip';

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

/**
 * Maps control folder names to Control IDs (CIDs)
 * This should be customized based on your organization's control mapping
 */
const CONTROL_NAME_TO_CID_MAPPING: Record<string, string> = {
    'access_control': 'AC-001',
    'authentication': 'AU-001',
    'authorization': 'AU-002',
    'data_encryption': 'CR-001',
    'backup_recovery': 'BC-001',
    'incident_response': 'IR-001',
    'vulnerability_management': 'VM-001',
    'network_security': 'NS-001',
    'physical_security': 'PS-001',
    'security_awareness': 'SA-001',
    'change_management': 'CM-001',
    'risk_assessment': 'RA-001',
    'compliance_monitoring': 'CO-001',
    'business_continuity': 'BC-002',
    'vendor_management': 'VM-002',
    // Add more mappings as needed
};

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
 * Maps control folder name to CID
 */
function mapControlNameToCID(controlName: string): string | null {
    const normalizedName = normalizeControlName(controlName);
    return CONTROL_NAME_TO_CID_MAPPING[normalizedName] || null;
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
                result.errors.push(`Unable to map folder "${folderName}" to a Control ID`);
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

        zipContent.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && relativePath.includes('/')) {
                const folderName = relativePath.split('/')[0];
                const cid = mapControlNameToCID(folderName);

                if (cid) {
                    hasValidStructure = true;
                }
            }
        });

        if (!hasValidStructure) {
            errors.push('No valid control folders found in zip file. Please ensure folders are named according to control standards.');
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
    return { ...CONTROL_NAME_TO_CID_MAPPING };
} 