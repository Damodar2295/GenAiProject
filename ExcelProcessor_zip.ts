import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface DomainData {
    Domain_Id: number;
    Domain_Code: string;
    Domain_Name: string;
    Sub_Domain_Name: string;
    Question: string;
    Question_Description: string;
    Assessor_Guidelines?: string;
}

export interface QuestionData {
    'Questionnaire Name': string;
    'Category Nme': string;
    'Question': string;
    'Question Description': string;
    'Data Type': string;
    'Choices': string;
    'Vendor Answers': string;
    'Inernal Comments': string;
    'Attachement Reference': string;
}

export interface QuestionPrompt {
    id: string;
    question: string;
    prompt: string;
}

export interface DesignElement {
    question: string;
    description: string;
    subQuestions: string[];
}

export interface VendorEvidence {
    cid: string;
    designElements: DesignElement[];
    evidenceFiles: string[];
}

export class ExcelProcessor {
    private readonly SUPPORTED_FILE_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX'];
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private readonly VENDOR_QUESTIONNAIRE_NAME = 'Vendor_Questionnaire.xls';

    private validateFile(file: File, supportedTypes?: string[]): void {
        if (!file) {
            throw new Error('File is required');
        }

        if (file.size > this.MAX_FILE_SIZE) {
            throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        const typesToCheck = supportedTypes || this.SUPPORTED_FILE_TYPES;
        const extension = this.getFileExtension(file.name);
        if (!typesToCheck.includes(extension)) {
            throw new Error(`Unsupported file type: ${extension}. Supported types: ${typesToCheck.join(', ')}`);
        }
    }

    /**
     * Loads domain list from domain_list.json file
     * @returns Promise resolving to an array of DomainData objects
     */
    private async loadDomainList(): Promise<DomainData[]> {
        try {
            console.log("Debug: Inside loadDomainList function");

            // Fetch domain_list.json from public directory
            const response = await fetch('/domain_list.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch domain list: ${response.status} ${response.statusText}`);
            }

            const domain_list: DomainData[] = await response.json();
            console.log(`Debug: Domain list has ${domain_list.length} items`);

            // Map to ensure all required properties are present and properly typed
            const mappedData = domain_list.map((item, index) => {
                const domainItem: DomainData = {
                    Domain_Id: item.Domain_Id || 0,
                    Domain_Code: item.Domain_Code || '',
                    Domain_Name: item.Domain_Name || '',
                    Sub_Domain_Name: item.Sub_Domain_Name || '',
                    Question: item.Question || '',
                    Question_Description: item.Question_Description || ''
                };

                return domainItem;
            });

            console.log(`Debug: Successfully mapped ${mappedData.length} domain items`);
            return mappedData;
        } catch (error) {
            console.error("Error loading domain list:", error);
            return [];
        }
    }

    /**
     * Processes the questionnaire file and extracts questions
     * Works with either File objects or FileWithBase64 objects
     * @param questionnaireFile The uploaded questionnaire file or base64 representation
     * @returns JSON array with id, question, and prompt
     */
    private extractSubQuestions(description: string): string[] {
        console.log("Debug: Entered extractSubQuestions method.");

        if (!description?.includes('Design elements:')) {
            console.log("Debug: Description does not contain 'Design elements:'. Returning an empty array.");
            return [];
        }

        const [mainPart, elements] = description.split('Design elements:');

        if (!elements) {
            console.log("Debug: 'elements' is null or undefined. Returning an empty array.");
            return [];
        }

        const mainQuestion = mainPart.trim();
        console.log(`Debug: mainQuestion extracted and trimmed: "${mainQuestion}"`);

        const lines = elements.split(/\r?\n/);
        console.log(`Debug: Split 'elements' into ${lines.length} lines:`);
        lines.forEach((line, i) => console.log(`Debug: Line ${i}: ${line}`));

        const numberedLines = lines.filter(line => /^\s*\d+\./.test(line));
        console.log(`Debug: Filtered ${numberedLines.length} numbered lines:`);
        numberedLines.forEach((line, i) => console.log(`Debug: Line ${i}: ${line.substring(0, 1000)}...`));

        const result = numberedLines
            .map(line => {
                const cleanedLine = line.replace(/^\s*\d+\.\s*/, '').trim();
                console.log(`Debug: Cleaned line: "${cleanedLine}"`);
                return `${mainQuestion} with the following design element: ${cleanedLine}`;
            })
            .filter(q => q.length > 0);

        console.log(`Debug: Final result array with ${result.length} items:`);
        result.forEach((item, i) => console.log(`Debug: Result ${i}: ${item.substring(0, 1000) + (item.length > 1000 ? '...' : '')}`));

        return result;
    }

    private extractDomainCode(questionnaireName: string): string {
        console.log("Debug: Entered extractDomainCode method.");
        console.log(`Debug: Input questionnaireName: "${questionnaireName}"`);

        if (!questionnaireName || !questionnaireName.includes('-')) {
            console.log("Debug: 'questionnaireName' is invalid or does not contain a hyphen. Returning an empty string.");
            return '';
        }

        const normalized = questionnaireName.trim();
        console.log(`Debug: Normalized questionnaireName: "${normalized}"`);

        const parts = normalized.split('-');
        console.log("Debug: Split questionnaireName into parts:", parts);

        const domainCode = parts[0]?.trim() || '';
        console.log(`Debug: Extracted domainCode: "${domainCode}"`);

        return domainCode;
    }

    private getFileExtension(reference: string): string {
        console.log("Debug: Entered getFileExtension method.");
        if (!reference) {
            console.log("Debug: 'reference' is null or undefined. Returning an empty string.");
            return '';
        }

        const parts = reference.split('.');
        console.log("Debug: Split reference into parts:", parts);

        const extension = parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
        console.log(`Debug: Extracted file extension: "${extension}"`);

        return extension;
    }

    private async readExcelFile(file: File | FileWithBase64): Promise<any[]> {
        console.log("Debug: Entered readExcelFile method");
        let workbook: XLSX.WorkBook;

        try {
            if ('base64' in file) {
                console.log("Debug: File is of type FileWithBase64. Decoding base64 content.");
                const binary = atob(file.base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                workbook = XLSX.read(bytes, { type: 'array' });
            } else {
                console.log("Debug: File is of type File. Reading file content.");
                const arrayBuffer = await file.arrayBuffer();
                workbook = XLSX.read(arrayBuffer, { type: 'array' });
            }
        } catch (error) {
            console.error("Error reading Excel file:", error);
            throw error;
        }

        console.log("Debug: Successfully read the Excel workbook.");
        const sheetNames = workbook.SheetNames;
        console.log("Debug: Available sheet names:", sheetNames);

        // Look specifically for the "Data" sheet
        if (!sheetNames.includes('Data')) {
            console.error("Error: Excel file does not contain a 'Data' sheet");
            throw new Error("Excel file must contain a 'Data' sheet");
        }

        // Only process the "Data" sheet
        console.log("Debug: Processing 'Data' sheet");
        const sheet = workbook.Sheets['Data'];
        const sheetData = XLSX.utils.sheet_to_json(sheet);
        console.log(`Debug: Extracted ${sheetData.length} rows from 'Data' sheet`);

        return sheetData;
    }

    /**
     * Process questionnaire file and extract questions
     * Works with either File objects or FileWithBase64 objects
     * @param questionnaireFile The uploaded questionnaire file or base64 representation
     * @returns Promise containing extracted question prompts
     */
    async processQuestionnaire(
        questionnaireFile: File | FileWithBase64
    ): Promise<QuestionPrompt[]> {
        console.log("Debug: Entered processQuestionnaire method");
        console.log("Debug: Processing file:", ('name' in questionnaireFile) ? questionnaireFile.name : 'base64 file');

        try {
            // Step 1: Load domain list and read Excel file concurrently
            console.log("Debug: Loading domain list and Excel data");
            const [domainList, questions] = await Promise.all([
                this.loadDomainList(),
                this.readExcelFile(questionnaireFile)
            ]);

            console.log(`Debug: Domain list has ${domainList.length} items`);
            console.log(`Debug: First domain item:`, domainList.length > 0 ? domainList[0] : 'No domains found');

            console.log(`Debug: Excel data has ${questions.length} rows`);

            // Step 3: Create domain map for quick lookups using Domain_Code as key
            const domainMap = new Map<string, DomainData>();
            for (let i = 0; i < domainList.length; i++) {
                if (domainList[i] && domainList[i].Domain_Code) {
                    console.log(`Debug: Adding domain to map: ${domainList[i].Domain_Code}`);
                    domainMap.set(domainList[i].Domain_Code, domainList[i]);
                } else {
                    console.log("Debug: Skipping invalid domain item:", domainList[i]);
                }
            }

            // Debug: Log all available domain codes
            const availableDomainCodes = Array.from(domainMap.keys());
            console.log("Debug: Available domain codes in map:", availableDomainCodes);

            console.log(`Debug: Domain map has ${domainMap.size} entries`);
            console.log(`Debug: Excel data has ${questions.length} rows`);

            // Step 4: Process each question from Excel
            const result: QuestionPrompt[] = [];
            questions.forEach((question: QuestionData, idx: number) => {
                console.log(`Debug: Processing question ${idx}:`, question['Questionnaire Name']);

                // Extract domain code from questionnaire name
                const questionnaireName = question['Questionnaire Name'] || '';
                const domainCode = this.extractDomainCode(questionnaireName);
                console.log(`Debug: Extracted domain code: "${domainCode}"`);
                console.log(`Debug: Questionnaire name was: "${questionnaireName}"`);

                // Debug: Check if domain code exists in map (case sensitive check)
                console.log(`Debug: Does domain map contain "${domainCode}"?`, domainMap.has(domainCode));

                // Debug: Try case-insensitive lookup
                const caseInsensitiveDomainCode = availableDomainCodes.find(code =>
                    code.toLowerCase() === domainCode.toLowerCase()
                );
                if (caseInsensitiveDomainCode && caseInsensitiveDomainCode !== domainCode) {
                    console.log(`Debug: Found case-insensitive match: "${caseInsensitiveDomainCode}" vs "${domainCode}"`);
                }

                // Look up domain by code
                const domain = domainMap.get(domainCode);
                if (!domain) {
                    console.log(`Debug: No domain found for code: "${domainCode}"`);
                    console.log(`Debug: Available codes are:`, availableDomainCodes);
                    return;
                }

                console.log(`Debug: Found matching domain: ${domain.Domain_Id} - ${domain.Domain_Name}`);
                console.log(`Debug: Question_Description: ${domain.Question_Description?.substring(0, 100) + (domain.Question_Description?.length > 100 ? '...' : '')}`);

                // Extract sub-questions from domain Question_Description
                const subQuestions = this.extractSubQuestions(domain.Question_Description);
                console.log(`Debug: Extracted ${subQuestions.length} sub-questions`);

                // Create prompts for each sub-question
                subQuestions.forEach(subQ => {
                    // 1. Remove the question mark from domain.Question if present
                    const questionText = domain.Question?.replace(/\?$/, '') || '';
                    console.log("Question text : ", questionText)

                    // 2. Extract only the part after "with the following design element:"
                    let cleanSubQ = subQ;
                    if (cleanSubQ.includes("with the following design element:")) {
                        const parts = cleanSubQ.split("with the following design element:");
                        cleanSubQ = parts[1] ? parts[1].trim() : cleanSubQ;
                    }

                    // 3. Format the prompt properly
                    const prompt = `${questionText} with the following design element ${cleanSubQ}`;

                    result.push({
                        id: domain.Domain_Code,
                        question: questionText,
                        prompt: prompt
                    });
                });
            });

            console.log(`Debug: Generated ${result.length} question prompts`);
            return result;
        } catch (error) {
            console.error("Error processing questionnaire:", error);
            throw error;
        }
    }

    private async extractZipFile(zipFile: File): Promise<JSZip> {
        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(zipFile);
            return zipContent;
        } catch (error) {
            console.error('Error extracting zip file:', error);
            throw new Error('Failed to extract zip file: ' + (error instanceof Error ? error.message : String(error)));
        }
    }

    private async findVendorQuestionnaire(zip: JSZip): Promise<XLSX.WorkBook | null> {
        // Find all .xls files in the zip
        const excelFiles = Object.keys(zip.files)
            .filter(path =>
                (path.toLowerCase().endsWith('.xls') || path.toLowerCase().endsWith('.xlsx')) &&
                !path.startsWith('__MACOSX/') &&
                !zip.files[path].dir
            );

        if (excelFiles.length === 0) {
            console.warn('No Excel files found in zip file');
            return null;
        }

        // Use the first .xls file found
        const questionnaireFile = zip.file(excelFiles[0]);
        if (!questionnaireFile) {
            console.warn('Failed to read Excel file from zip');
            return null;
        }

        try {
            const content = await questionnaireFile.async('arraybuffer');
            return XLSX.read(content, { type: 'array' });
        } catch (error) {
            console.error('Error reading vendor questionnaire:', error);
            return null;
        }
    }

    private async findDomainFolders(zip: JSZip): Promise<string[]> {
        const folders = Object.keys(zip.files)
            .filter(path =>
                zip.files[path].dir &&
                !path.startsWith('__MACOSX/') &&
                // Check if it's a top-level directory (e.g., "folder/", not "folder/subfolder/")
                path.slice(0, -1).indexOf('/') === -1
            )
            .map(path => path.slice(0, -1)); // remove trailing '/'

        return folders;
    }

    private async getEvidenceFiles(zip: JSZip, domainFolder: string): Promise<string[]> {
        const files = Object.keys(zip.files)
            .filter(path => path.startsWith(domainFolder) && !path.endsWith('/'))
            .filter(path => {
                const extension = this.getFileExtension(path);
                return this.SUPPORTED_FILE_TYPES.includes(extension);
            });

        return files;
    }

    private extractDesignElements(questions: QuestionData[]): DesignElement[] {
        return questions
            .filter(q => q['Question Description']?.toLowerCase().includes('design element:'))
            .map(q => ({
                question: q['Question'],
                description: q['Question Description'],
                subQuestions: this.extractSubQuestions(q['Question Description'])
            }))
            .filter(de => de.subQuestions.length > 0);
    }

    /**
     * Process ZIP file containing domain folders and vendor questionnaire
     * Generates prompts based on domain codes from the vendor questionnaire
     */
    async processZipFile(zipFile: File): Promise<QuestionPrompt[]> {
        try {
            // Validate zip file
            this.validateFile(zipFile, ['ZIP']);

            // Extract zip file
            const zip = await this.extractZipFile(zipFile);

            // Find and process vendor questionnaire
            const questionnaire = await this.findVendorQuestionnaire(zip);
            if (!questionnaire) {
                throw new Error('No valid Excel file found in zip file');
            }

            console.log("Debug: Successfully found vendor questionnaire in ZIP");
            console.log("Debug: Available sheet names:", questionnaire.SheetNames);

            // Process questionnaire data - look for Data sheet first, then fallback to first sheet
            let sheetToProcess = 'Data';
            if (!questionnaire.SheetNames.includes('Data')) {
                console.log("Debug: No 'Data' sheet found, using first sheet:", questionnaire.SheetNames[0]);
                sheetToProcess = questionnaire.SheetNames[0];
            }

            const questions: QuestionData[] = XLSX.utils.sheet_to_json(questionnaire.Sheets[sheetToProcess]);
            console.log(`Debug: Extracted ${questions.length} questions from sheet '${sheetToProcess}'`);

            // Debug: Log first few questions to see the structure
            if (questions.length > 0) {
                console.log("Debug: First question structure:", questions[0]);
                console.log("Debug: Questionnaire Name from first question:", questions[0]['Questionnaire Name']);
                console.log("Debug: Attachment Reference from first question:", questions[0]['Attachement Reference']);
            }

            // Load domain list for mapping
            const domainList = await this.loadDomainList();
            console.log(`Debug: Loaded ${domainList.length} domains from domain list`);

            // Debug: Log first few domains
            if (domainList.length > 0) {
                console.log("Debug: First domain:", domainList[0]);
                console.log("Debug: Available domain codes:", domainList.map(d => d.Domain_Code));
            }

            const domainMap = new Map<string, DomainData>();
            domainList.forEach(domain => {
                if (domain.Domain_Code) {
                    domainMap.set(domain.Domain_Code, domain);
                }
            });

            // Process the vendor questionnaire to generate prompts (same logic as processQuestionnaire)
            console.log("Debug: Processing questions from vendor questionnaire...");
            const result: QuestionPrompt[] = [];

            questions.forEach((question: QuestionData, idx: number) => {
                console.log(`Debug: Processing question ${idx}:`, question['Questionnaire Name']);

                // Extract domain code from questionnaire name
                const questionnaireName = question['Questionnaire Name'] || '';
                const domainCode = this.extractDomainCode(questionnaireName);
                console.log(`Debug: Extracted domain code: "${domainCode}"`);
                console.log(`Debug: Questionnaire name was: "${questionnaireName}"`);

                // Debug: Check if domain code exists in map (case sensitive check)
                console.log(`Debug: Does domain map contain "${domainCode}"?`, domainMap.has(domainCode));

                // Look up domain by code
                const domain = domainMap.get(domainCode);
                if (!domain) {
                    console.log(`Debug: No domain found for code: "${domainCode}"`);
                    console.log(`Debug: Available codes are:`, Array.from(domainMap.keys()));
                    return;
                }

                console.log(`Debug: Found matching domain: ${domain.Domain_Id} - ${domain.Domain_Name}`);
                console.log(`Debug: Question_Description: ${domain.Question_Description?.substring(0, 100) + (domain.Question_Description?.length > 100 ? '...' : '')}`);

                // Extract sub-questions from domain Question_Description
                const subQuestions = this.extractSubQuestions(domain.Question_Description);
                console.log(`Debug: Extracted ${subQuestions.length} sub-questions`);

                // Create prompts for each sub-question
                subQuestions.forEach(subQ => {
                    // 1. Remove the question mark from domain.Question if present
                    const questionText = domain.Question?.replace(/\?$/, '') || '';
                    console.log("Question text : ", questionText)

                    // 2. Extract only the part after "with the following design element:"
                    let cleanSubQ = subQ;
                    if (cleanSubQ.includes("with the following design element:")) {
                        const parts = cleanSubQ.split("with the following design element:");
                        cleanSubQ = parts[1] ? parts[1].trim() : cleanSubQ;
                    }

                    // 3. Format the prompt properly
                    const prompt = `${questionText} with the following design element ${cleanSubQ}`;

                    result.push({
                        id: domain.Domain_Code,
                        question: questionText,
                        prompt: prompt
                    });
                });
            });

            console.log(`Generated ${result.length} question prompts from ZIP file`);
            return result;
        } catch (error) {
            console.error('Error processing zip file:', error);
            throw error;
        }
    }

    /**
     * Debug method to test reading vendor questionnaire and extracting domain codes
     * @param questionnaireFile The uploaded Excel file
     * @returns Promise containing debug information
     */
    async debugQuestionnaireReading(questionnaireFile: File | FileWithBase64): Promise<any> {
        try {
            console.log("Debug: Testing questionnaire reading...");

            // Step 1: Read the Excel file
            const questions = await this.readExcelFile(questionnaireFile);
            console.log(`Debug: Successfully read ${questions.length} questions from Excel file`);

            // Step 2: Log first few questions to see structure
            if (questions.length > 0) {
                console.log("Debug: First question structure:", questions[0]);
                console.log("Debug: Column names:", Object.keys(questions[0]));
            }

            // Step 3: Try to extract domain codes from first 5 questions
            const domainCodes: string[] = [];
            questions.slice(0, 5).forEach((question: any, idx: number) => {
                console.log(`Debug: Question ${idx}:`, {
                    questionnaireName: question['Questionnaire Name'],
                    attachmentRef: question['Attachement Reference'],
                    question: question['Question']
                });

                const domainCode = this.extractDomainCode(question['Questionnaire Name'] || '');
                console.log(`Debug: Extracted domain code: "${domainCode}"`);

                if (domainCode) {
                    domainCodes.push(domainCode);
                }

                const fileExtension = this.getFileExtension(question['Attachement Reference'] || '');
                console.log(`Debug: File extension: "${fileExtension}"`);
            });

            // Step 4: Load domain list and check matches
            const domainList = await this.loadDomainList();
            console.log(`Debug: Loaded ${domainList.length} domains`);
            console.log("Debug: Available domain codes:", domainList.map(d => d.Domain_Code));

            // Check which extracted codes have matches
            const uniqueDomainCodes = [...new Set(domainCodes)];
            console.log("Debug: Unique extracted domain codes:", uniqueDomainCodes);

            uniqueDomainCodes.forEach(code => {
                const match = domainList.find(d => d.Domain_Code === code);
                console.log(`Debug: Domain code "${code}" has match:`, !!match);
                if (match) {
                    console.log(`Debug: Matched domain:`, match);
                }
            });

            return {
                questionsCount: questions.length,
                extractedDomainCodes: uniqueDomainCodes,
                availableDomainCodes: domainList.map(d => d.Domain_Code),
                matches: uniqueDomainCodes.map(code => ({
                    code,
                    hasMatch: !!domainList.find(d => d.Domain_Code === code)
                }))
            };

        } catch (error) {
            console.error("Debug: Error in questionnaire reading:", error);
            throw error;
        }
    }
}

// Add FileWithBase64 interface
interface FileWithBase64 {
    name: string;
    type: string;
    size: number;
    base64: string;
}