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

// New interfaces for domain mapping functionality
interface DomainMapping {
    domain_id: string;  // This will store Domain_Code
    domain_name: string;  // This will store Domain_Name
}

interface DomainToFilesMap {
    domainId: string;
    domainName: string;
    files: string[];
}

export interface DomainMappingResult {
    mappings: Record<string, string[]>;  // domain_id -> file names
    unmappedDomains: string[];           // domain names that couldn't be mapped
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
let domainMappingCache: Map<string, DomainMapping> | null = null;

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
 * Returns a Map of normalized domain names to their domain mappings
 */
function loadDomainMappings(): Map<string, DomainMapping> {
    if (domainMappingCache) {
        return domainMappingCache;
    }

    try {
        const mappings = new Map<string, DomainMapping>();
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
            if (!Domain_Code || !Domain_Name || typeof Domain_Code !== 'string' || typeof Domain_Name !== 'string') {
                console.warn('Invalid domain data:', domain);
                return;
            }

            const mapping: DomainMapping = {
                domain_id: Domain_Code,
                domain_name: Domain_Name
            };
            const normalizedName = normalizeDomainName(Domain_Name);
            mappings.set(normalizedName, mapping);
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
 * Maps control folder name to CID using domain_list.json
 */
function mapControlNameToCID(controlName: string): string | null {
    const mappings = loadDomainMappings();
    const normalizedName = normalizeDomainName(controlName);
    const mapping = mappings.get(normalizedName);
    return mapping ? mapping.domain_id : null;
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

        console.log('ZIP file loaded successfully');

        // Get all files and folders with normalized paths
        const allPaths = Object.keys(zip.files).map(normalizePath);
        console.log('All files in ZIP:', allPaths);

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
            .map(getFolderName);

        console.log('Found domain folders:', domainFolders);

        // Group files by their domain folder
        const folderContents: Record<string, string[]> = {};

        allPaths.filter(path => !zip.files[path].dir).forEach(filePath => {
            const parts = filePath.split('/').filter(Boolean);
            if (parts.length === 3 && parts[0] === rootFolder) {
                // File is in a domain folder
                const domainFolder = parts[1];
                if (!folderContents[domainFolder]) {
                    folderContents[domainFolder] = [];
                }
                folderContents[domainFolder].push(filePath);
            }
        });

        console.log('Files grouped by domain folder:', folderContents);

        // Process each domain folder and its contents
        for (const [folderName, folderFiles] of Object.entries(folderContents)) {
            console.log(`Processing domain folder: ${folderName}`);
            const evidences: ExtractedFile[] = [];

            // Process each file in the folder
            for (const filePath of folderFiles) {
                try {
                    console.log(`Processing file: ${filePath}`);
                    const file = zip.files[filePath];
                    const content = await file.async('arraybuffer');
                    const fileName = filePath.split('/').pop() || filePath;
                    const fileType = getFileType(fileName);
                    const base64 = arrayBufferToBase64(content);

                    evidences.push({
                        name: fileName,
                        content,
                        type: fileType,
                        base64,
                        fullPath: filePath
                    });

                    result.totalFiles++;
                    console.log(`Successfully processed file: ${fileName} (Path: ${filePath})`);
                } catch (error) {
                    const errorMsg = `Failed to process file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(errorMsg);
                    result.errors.push(errorMsg);
                }
            }

            if (evidences.length > 0) {
                // Map the domain folder name to a domain ID
                const mappings = loadDomainMappings();
                const normalizedName = normalizeDomainName(folderName);
                const domainMapping = mappings.get(normalizedName);

                const cid = domainMapping ? domainMapping.domain_id : folderName;
                const controlName = domainMapping ? domainMapping.domain_name : folderName;

                result.controls.push({
                    cid,
                    controlName,
                    evidences
                });
                result.totalControls++;
                console.log(`Added domain folder ${folderName} with ${evidences.length} files, mapped to CID: ${cid}`);
            }
        }

        // Handle loose files (files directly in root folder)
        const looseFiles = allPaths.filter(path => {
            const parts = path.split('/').filter(Boolean);
            return !zip.files[path].dir && parts.length === 2 && parts[0] === rootFolder;
        });

        if (looseFiles.length > 0) {
            console.log('Processing loose files in root folder:', looseFiles);
            const evidences: ExtractedFile[] = [];

            for (const filePath of looseFiles) {
                try {
                    const file = zip.files[filePath];
                    const content = await file.async('arraybuffer');
                    const fileName = filePath.split('/').pop() || filePath;
                    const fileType = getFileType(fileName);
                    const base64 = arrayBufferToBase64(content);

                    evidences.push({
                        name: fileName,
                        content,
                        type: fileType,
                        base64,
                        fullPath: filePath
                    });

                    result.totalFiles++;
                    console.log(`Successfully processed loose file: ${fileName}`);
                } catch (error) {
                    console.error(`Error processing loose file ${filePath}:`, error);
                    result.errors.push(`Failed to process file "${filePath}": ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            if (evidences.length > 0) {
                result.controls.push({
                    cid: rootFolder,
                    controlName: 'Root Files',
                    evidences
                });
                result.totalControls++;
                console.log(`Added ${evidences.length} loose files from root folder`);
            }
        }

        console.log('Final processing result:', {
            totalControls: result.totalControls,
            totalFiles: result.totalFiles,
            errors: result.errors
        });

        return result;

    } catch (error) {
        const errorMsg = `Failed to process ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
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
 * Returns a record of domain mappings for control validation
 */
export function getAvailableControlMappings(): Record<string, string> {
    const mappings = loadDomainMappings();
    const record: Record<string, string> = {};
    mappings.forEach((value: DomainMapping, key: string) => {
        record[key] = value.domain_id;
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
        const domainName = mapping.domain_name;

        // Add the normalized domain name
        expectedNames.push(normalizeDomainName(domainName));

        result.push({
            domainCode: mapping.domain_id,
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
                result.mappings[domainMapping.domain_id] = domainFiles;
                console.log(`Mapped domain "${folderName}" (${domainMapping.domain_id}) to ${domainFiles.length} files`);
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
export function getAvailableDomainMappings(): DomainMapping[] {
    try {
        const domainList = (domainListModule as any).default || domainListModule;
        return domainList as DomainMapping[];
    } catch (error) {
        console.error('Failed to get domain mappings:', error);
        return [];
    }
} 
