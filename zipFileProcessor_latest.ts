import JSZip from 'jszip';
import * as domainListModule from '../data/domain_list.json';

export interface ExtractedFile {
    name: string;
    content: ArrayBuffer;
    type: 'pdf' | 'other';
    base64: string;
    fullPath?: string;
}

export interface ControlEvidence {
    cid: string;  // This is now Domain_Id
    evidences: ExtractedFile[];
}

export interface ProcessedZipResult {
    controls: ControlEvidence[];
    totalFiles: number;
    totalControls: number;
    errors: string[];
}

// Updated interface to only use Domain_Id
interface DomainMapping {
    domain_id: string;  // This will store Domain_Id
}

interface DomainToFilesMap {
    domainId: string;
    files: string[];
}

export interface DomainMappingResult {
    mappings: Record<string, string[]>;  // domain_id -> file names
    unmappedDomains: string[];           // folder names that couldn't be mapped
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
let domainMappingCache: Map<string, string> | null = null;

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
 * Loads domain mappings from imported domain_list.json
 * Returns a Map of normalized folder names to their Domain_Id
 */
function loadDomainMappings(): Map<string, string> {
    if (domainMappingCache) {
        return domainMappingCache;
    }

    try {
        const mappings = new Map<string, string>();
        let domainList: DomainItem[];

        // Handle both module.default and direct import cases
        if ('default' in domainListModule) {
            domainList = (domainListModule as any).default;
        } else {
            domainList = domainListModule as unknown as DomainItem[];
        }

        if (!Array.isArray(domainList)) {
            console.error('Invalid domain list format:', domainList);
            throw new Error('Domain list is not in the expected format');
        }

        domainList.forEach((domain: DomainItem) => {
            if (!domain || typeof domain !== 'object') {
                console.warn('Invalid domain item:', domain);
                return;
            }

            const { Domain_Code, Domain_Name } = domain;
            if (!Domain_Code || typeof Domain_Code !== 'string') {
                console.warn('Invalid domain data:', domain);
                return;
            }

            // Map both the Domain_Code and normalized Domain_Name to the Domain_Code
            mappings.set(Domain_Code.toLowerCase(), Domain_Code);
            if (Domain_Name) {
                const normalizedName = normalizeDomainName(Domain_Name);
                mappings.set(normalizedName, Domain_Code);
            }
        });

        // Store in cache
        domainMappingCache = mappings;
        console.log('Successfully loaded domain mappings:', Array.from(mappings.keys()));
        return mappings;

    } catch (error) {
        console.error('Failed to load domain mappings:', error);
        return new Map();
    }
}

/**
 * Normalizes domain names for consistent comparison
 */
function normalizeDomainName(name: string): string {
    return name.toLowerCase().trim();
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
 * Maps folder name to Domain_Id using domain_list.json
 */
function mapFolderToDomainId(folderName: string): string | null {
    const mappings = loadDomainMappings();
    const normalizedName = normalizeDomainName(folderName);
    return mappings.get(normalizedName) || null;
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

        // Process each folder in the ZIP
        for (const [path, file] of Object.entries(zipContent.files)) {
            if (!file.dir) continue;

            const folderName = getFolderName(path);
            const domainId = mapFolderToDomainId(folderName);

            if (!domainId) {
                console.warn(`Could not map folder "${folderName}" to a Domain_Id`);
                result.errors.push(`Unmapped folder: ${folderName}`);
                continue;
            }

            // Process files in this folder
            const folderFiles = Object.entries(zipContent.files)
                .filter(([filePath]) => filePath.startsWith(path) && !zipContent.files[filePath].dir);

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
                    cid: domainId,
                    evidences
                });
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
            const cid = mapFolderToDomainId(folderName);
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
 * Returns a record of domain mappings for control validation
 */
export function getAvailableControlMappings(): Record<string, string> {
    const mappings = loadDomainMappings();
    const record: Record<string, string> = {};
    mappings.forEach((value: string, key: string) => {
        record[key] = value;
    });
    return record;
}

/**
 * Returns expected folder names for validation
 */
export function getExpectedFolderNames(): Array<{ domainCode: string, domainName: string, expectedFolderNames: string[] }> {
    const mappings = loadDomainMappings();
    const result: Array<{ domainCode: string, domainName: string, expectedFolderNames: string[] }> = [];

    mappings.forEach((mapping, key) => {
        const expectedNames: string[] = [];
        const domainName = key;

        // Add the normalized domain name
        expectedNames.push(normalizeDomainName(domainName));

        result.push({
            domainCode: mapping,
            domainName: domainName,
            expectedFolderNames: expectedNames
        });
    });

    return result;
}

/**
 * New function to map domain folders to domain IDs
 * This function focuses solely on mapping domains to their files
 */
export async function mapDomainsToDomainIds(zipFile: File): Promise<DomainMappingResult> {
    const result: DomainMappingResult = {
        mappings: {},
        unmappedDomains: [],
        errors: []
    };

    try {
        console.log('Starting domain mapping process...');
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);

        // Load domain mappings
        const domainMappings = loadDomainMappings();

        // Get all paths in the ZIP
        const allPaths = Object.keys(zip.files);

        // Find the root folder name (assuming there's only one root folder)
        const rootFolders = allPaths
            .filter(path => {
                const parts = path.split('/').filter(Boolean);
                return parts.length === 1 && zip.files[path].dir;
            })
            .map(path => path.replace('/', ''));

        if (rootFolders.length === 0) {
            throw new Error('No root folder found in ZIP file');
        }

        const rootFolder = rootFolders[0];
        console.log('Found root folder:', rootFolder);

        // Find domain folders (subfolders within the root folder)
        const domainFolders = allPaths
            .filter(path => {
                const parts = path.split('/').filter(Boolean);
                return parts.length === 2 && // Two levels deep (root/domain/)
                    parts[0] === rootFolder && // Must be in root folder
                    zip.files[path].dir; // Must be a directory
            })
            .map(path => {
                const parts = path.split('/').filter(Boolean);
                return parts[1]; // Return just the domain folder name
            });

        console.log('Found domain folders:', domainFolders);

        // Process each domain folder
        for (const folderName of domainFolders) {
            const normalizedDomainName = normalizeDomainName(folderName);
            const domainMapping = domainMappings.get(normalizedDomainName);

            if (!domainMapping) {
                console.warn(`Domain "${folderName}" not found in domain mappings`);
                result.unmappedDomains.push(folderName);
                continue;
            }

            // Get PDF files in this domain folder
            const domainFiles = allPaths.filter(path => {
                const parts = path.split('/').filter(Boolean);
                return !zip.files[path].dir && // Not a directory
                    parts.length === 3 && // Three levels deep (root/domain/file.pdf)
                    parts[0] === rootFolder && // Must be in root folder
                    parts[1] === folderName && // Must be in this domain folder
                    path.toLowerCase().endsWith('.pdf'); // Only PDF files
            }).map(path => path.split('/').pop() || path); // Get just the file names

            if (domainFiles.length > 0) {
                result.mappings[domainMapping] = domainFiles;
                console.log(`Mapped domain "${folderName}" (${domainMapping}) to ${domainFiles.length} files`);
            }
        }

        // Log final results
        console.log('Domain mapping complete:', {
            mappedDomains: Object.keys(result.mappings).length,
            unmappedDomains: result.unmappedDomains.length,
            mappings: result.mappings
        });

        return result;

    } catch (error) {
        const errorMsg = `Failed to map domains: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        return result;
    }
}

// Helper function to get domain mapping information
export function getAvailableDomainMappings(): string[] {
    try {
        const domainList = (domainListModule as any).default || domainListModule;
        return Object.keys(loadDomainMappings());
    } catch (error) {
        console.error('Failed to get domain mappings:', error);
        return [];
    }
} 
