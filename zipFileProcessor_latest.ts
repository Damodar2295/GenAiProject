import JSZip from 'jszip';
import rawDomainListData from '../../public/domain_list.json';

export interface ExtractedFile {
    name: string;
    content: ArrayBuffer;
    type: 'pdf' | 'other';
    base64: string;
    fullPath?: string;
}

export interface ControlEvidence {
    cid: string;  // Domain_Id
    controlName: string;  // Domain_Name for display
    evidences: ExtractedFile[];
}

export interface ProcessedZipResult {
    controls: ControlEvidence[];
    totalFiles: number;
    totalControls: number;
    errors: string[];
}

/**
 * Type definitions for domain mapping
 */
interface DomainMapping {
    Domain_Id: string;
    Domain_Name: string;
}

/**
 * Normalizes the raw domain list data into a strongly-typed array
 */
const normalizeDomainList = (rawData: unknown): DomainMapping[] => {
    if (!Array.isArray(rawData)) {
        console.warn('Raw domain data is not an array:', rawData);
        return [];
    }

    return rawData
        .filter((item): item is { Domain_Id: string; Domain_Name: string } => {
            if (!item || typeof item !== 'object') {
                console.warn('Invalid domain item:', item);
                return false;
            }
            if (!('Domain_Id' in item) || !('Domain_Name' in item)) {
                console.warn('Missing Domain_Id or Domain_Name:', item);
                return false;
            }
            if (typeof item.Domain_Id !== 'string' || typeof item.Domain_Name !== 'string') {
                console.warn('Domain_Id or Domain_Name is not a string:', item);
                return false;
            }
            if (item.Domain_Id.length === 0 || item.Domain_Name.length === 0) {
                console.warn('Domain_Id or Domain_Name is empty:', item);
                return false;
            }
            return true;
        })
        .map(item => ({
            Domain_Id: item.Domain_Id,
            Domain_Name: item.Domain_Name
        }));
};

// Normalize the domain list once at module level
const domainList: DomainMapping[] = normalizeDomainList(rawDomainListData);

/**
 * Normalizes a string by trimming and converting to lowercase
 */
const normalizeName = (name: string): string => name.trim().toLowerCase();

/**
 * Maps a folder name to a domain
 */
const mapFolderToDomain = (folderName: string, domains: DomainMapping[]): { domain_id: string; domain_name: string } | null => {
    const normalizedFolderName = normalizeName(folderName);
    const matchingDomain = domains.find(domain => normalizeName(domain.Domain_Name) === normalizedFolderName);

    if (!matchingDomain) {
        return null;
    }

    return {
        domain_id: matchingDomain.Domain_Id,
        domain_name: matchingDomain.Domain_Name
    };
};

/**
 * Normalizes file paths to use forward slashes consistently
 */
function normalizePath(path: string): string {
    return path.replace(/[\\/]+/g, '/').trim();
}

/**
 * Safely extracts folder name from a path
 */
function getFolderName(path: string): string {
    const normalized = normalizePath(path);
    const parts = normalized.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
}

/**
 * Gets the root folder name from a ZIP file
 */
function getRootFolderName(zipContent: JSZip): string | null {
    const paths = Object.keys(zipContent.files);
    const rootFolders = paths
        .filter(path => {
            const parts = path.split('/').filter(Boolean);
            return parts.length === 1 && zipContent.files[path].dir;
        })
        .map(path => path.replace('/', ''));

    return rootFolders.length > 0 ? rootFolders[0] : null;
}

/**
 * Gets subfolder name from a path, ignoring the root folder
 */
function getSubfolderName(path: string, rootFolder: string | null): string {
    const normalized = normalizePath(path);
    const parts = normalized.split('/').filter(Boolean);

    if (rootFolder && parts[0] === rootFolder && parts.length > 1) {
        return parts[1];
    }
    return parts[0] || '';
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
        console.log('Starting ZIP file processing...');
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);

        // Verify domain list is available
        if (domainList.length === 0) {
            console.error('No valid domains found in domain list');
            throw new Error('Domain list is empty after normalization. Please check domain_list.json format.');
        }
        console.log('Using normalized domain list with', domainList.length, 'domains');

        // Get the root folder name to ignore it in domain mapping
        const rootFolder = getRootFolderName(zipContent);
        console.log('Root folder:', rootFolder);

        // Collect all valid subfolders
        const subfolders = new Set<string>();
        Object.entries(zipContent.files).forEach(([path, file]) => {
            if (file.dir) {
                const folderName = getSubfolderName(path, rootFolder);
                if (folderName && (!rootFolder || folderName !== rootFolder)) {
                    subfolders.add(folderName);
                }
            }
        });
        console.log('Found subfolders:', Array.from(subfolders));

        // Process each subfolder
        for (const folderName of subfolders) {
            const domainMapping = mapFolderToDomain(folderName, domainList);
            if (!domainMapping) {
                console.warn(`Could not map folder "${folderName}" to a Domain_Id`);
                result.errors.push(`Unmapped folder: ${folderName}`);
                continue;
            }
            console.log(`Mapped folder "${folderName}" to:`, domainMapping);

            // Find all files in this folder
            const folderPrefix = rootFolder ? `${rootFolder}/${folderName}/` : `${folderName}/`;
            const folderFiles = Object.entries(zipContent.files)
                .filter(([path, file]) => !file.dir && path.startsWith(folderPrefix));

            const evidences: ExtractedFile[] = [];
            for (const [filePath, fileEntry] of folderFiles) {
                const content = await fileEntry.async('arraybuffer');
                const fileName = getFolderName(filePath);
                const fileType = getFileType(fileName);
                const base64 = arrayBufferToBase64(content);

                evidences.push({
                    name: fileName,
                    content,
                    type: fileType,
                    base64,
                    fullPath: filePath
                });
            }

            if (evidences.length > 0) {
                result.controls.push({
                    cid: domainMapping.domain_id,
                    controlName: domainMapping.domain_name,
                    evidences
                });
                console.log(`Added control "${domainMapping.domain_name}" with ${evidences.length} evidence files`);
            }
        }

        result.totalFiles = result.controls.reduce((sum, control) => sum + control.evidences.length, 0);
        result.totalControls = result.controls.length;

        console.log('ZIP processing complete:', {
            totalControls: result.totalControls,
            totalFiles: result.totalFiles,
            errors: result.errors
        });

        return result;

    } catch (error) {
        console.error('Error processing ZIP file:', error);
        throw error;
    }
}

/**
 * Validates the structure of a ZIP file
 */
export async function validateZipStructure(zipFile: File): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    let hasValidStructure = false;

    try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);
        const foundFolders = new Set<string>();

        // Extract all folder names
        Object.keys(zipContent.files).forEach(path => {
            const file = zipContent.files[path];
            if (file.dir) {
                const folderName = getFolderName(path);
                if (folderName) foundFolders.add(folderName);
            }
        });

        if (foundFolders.size === 0) {
            errors.push('No folders found in ZIP file');
            return { isValid: false, errors };
        }

        // Check if any folders can be mapped to valid controls
        for (const folderName of foundFolders) {
            const mapping = mapFolderToDomain(folderName, domainList);
            if (mapping) {
                hasValidStructure = true;
                break;
            } else {
                errors.push(`Invalid folder name: ${folderName}`);
            }
        }

        if (!hasValidStructure) {
            errors.push('No valid control folders found');
        }

        return {
            isValid: hasValidStructure,
            errors: errors
        };

    } catch (error) {
        errors.push(`Failed to validate ZIP structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            isValid: false,
            errors
        };
    }
}

/**
 * Returns a mapping of normalized domain names to their Domain_Ids
 */
export function getAvailableControlMappings(): Record<string, string> {
    const record: Record<string, string> = {};
    domainList.forEach(domain => {
        record[normalizeName(domain.Domain_Name)] = domain.Domain_Id;
    });
    return record;
}

/**
 * Returns a list of expected folder names for each domain
 */
export function getExpectedFolderNames(): Array<{ domainCode: string, domainName: string, expectedFolderNames: string[] }> {
    return domainList.map(domain => ({
        domainCode: domain.Domain_Id,
        domainName: domain.Domain_Name,
        expectedFolderNames: [normalizeName(domain.Domain_Name)]
    }));
}

/**
 * Maps domains to their files in a ZIP file
 */
export async function mapDomainsToDomainIds(zipFile: File): Promise<{ mappings: Record<string, string[]>; unmappedDomains: string[]; errors: string[] }> {
    const result: { mappings: Record<string, string[]>; unmappedDomains: string[]; errors: string[] } = {
        mappings: {},
        unmappedDomains: [],
        errors: []
    };

    try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);
        const foundFolders = new Set<string>();

        // Extract all folder names
        Object.keys(zipContent.files).forEach(path => {
            const file = zipContent.files[path];
            if (file.dir) {
                const folderName = getFolderName(path);
                if (folderName) foundFolders.add(folderName);
            }
        });

        // Process each folder
        for (const folderName of foundFolders) {
            const domainMapping = mapFolderToDomain(folderName, domainList);
            if (domainMapping) {
                // Get all files in this folder
                const domainFiles = Object.keys(zipContent.files)
                    .filter(path => {
                        const file = zipContent.files[path];
                        return !file.dir && path.includes(folderName);
                    });

                if (domainFiles.length > 0) {
                    result.mappings[domainMapping.domain_id] = domainFiles;
                    console.log(`Mapped domain "${folderName}" (${domainMapping.domain_id}) to ${domainFiles.length} files`);
                }
            } else {
                result.unmappedDomains.push(folderName);
                result.errors.push(`Could not map folder "${folderName}" to a domain`);
            }
        }

        return result;

    } catch (error) {
        console.error('Error mapping domains to files:', error);
        result.errors.push(`Failed to map domains: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return result;
    }
}

/**
 * Returns a list of all available domain mappings
 */
export function getAvailableDomainMappings(): DomainMapping[] {
    return [...domainList];
} 
