import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface DomainData {
    Domain_Id: number;
    Domain_Code: string;
    Domain_Name: string;
    Sub_Domain_Name: string;
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

    private extractSubQuestions(description: string): string[] {
        if (!description) {
            console.warn('Empty description provided');
            return [];
        }

        // Normalize line endings and remove extra whitespace
        const normalizedDesc = description.replace(/\r\n/g, '\n').trim();

        // Check for design element pattern
        if (!normalizedDesc.toLowerCase().includes('design element:')) {
            console.log('No design elements found in description');
            return [];
        }

        // Split on design element marker
        const [mainPart, elements] = normalizedDesc.split(/design element:/i);
        if (!elements) {
            console.log('No elements found after design element marker');
            return [];
        }

        const mainQuestion = mainPart.trim();

        // Extract numbered items using regex
        const numberedItems = elements.match(/^\s*\d+\.\s*(.+)$/gm);
        if (!numberedItems) {
            console.log('No numbered items found in elements');
            return [];
        }

        // Process each numbered item
        return numberedItems
            .map(item => {
                const cleanedItem = item.replace(/^\s*\d+\.\s*/, '').trim();
                return `${mainQuestion} design element: ${cleanedItem}`;
            })
            .filter(q => q.length > 0);
    }

    private async readExcelFile(file: File): Promise<any[]> {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            return XLSX.utils.sheet_to_json(sheet);
        } catch (error) {
            console.error('Error reading Excel file:', error);
            throw new Error('Failed to read Excel file: ' + (error instanceof Error ? error.message : String(error)));
        }
    }

    async processFiles(domainFile: File, questionnaireFile: File): Promise<Record<string, string[]>> {
        try {
            // Validate files
            this.validateFile(domainFile, ['XLS', 'XLSX']);
            this.validateFile(questionnaireFile, ['XLS', 'XLSX']);

            // Read files
            const [domains, questions] = await Promise.all([
                this.readExcelFile(domainFile),
                this.readExcelFile(questionnaireFile)
            ]);

            console.log('Domains loaded:', domains.length, 'records');
            console.log('Questions loaded:', questions.length, 'records');

            // Process questions
            const questionMap: Record<string, string[]> = {};
            const processedDomains = new Set<string>();

            questions.forEach((question: QuestionData, index: number) => {
                const domainCode = this.extractDomainCode(question['Questionnaire Name']);
                if (!domainCode) {
                    console.warn(`Skipping question ${index + 1}: Invalid domain code`);
                    return;
                }

                const fileExtension = this.getFileExtension(question['Attachement Reference']);
                if (!this.SUPPORTED_FILE_TYPES.includes(fileExtension)) {
                    console.warn(`Skipping question ${index + 1}: Unsupported file type ${fileExtension}`);
                    return;
                }

                const mainQuestion = question['Question'];
                const subQuestions = this.extractSubQuestions(question['Question Description']);

                if (subQuestions.length > 0) {
                    subQuestions.forEach((subQ, idx) => {
                        const key = `${mainQuestion}_${idx + 1}`;
                        questionMap[key] = [subQ];
                    });
                    processedDomains.add(domainCode);
                } else {
                    questionMap[mainQuestion] = [question['Question Description'] || ''];
                }
            });

            console.log('Processed domains:', Array.from(processedDomains));
            console.log('Final question map:', Object.keys(questionMap).length, 'questions');

            return questionMap;
        } catch (error) {
            console.error('Processing failed:', error);
            throw error;
        }
    }

    private extractDomainCode(questionnaireName: string): string {
        if (!questionnaireName || !questionnaireName.includes('-')) {
            console.warn('Invalid Questionnaire Name:', questionnaireName);
            return '';
        }
        const normalized = questionnaireName.trim();
        const parts = normalized.split('-');
        return parts[0]?.trim() || '';
    }

    private getFileExtension(reference: string): string {
        if (!reference) return '';
        const parts = reference.split('.');
        return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
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

    private async findEvidenceFolders(zip: JSZip): Promise<string[]> {
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

    private async getEvidenceFiles(zip: JSZip, cidFolder: string): Promise<string[]> {
        const files = Object.keys(zip.files)
            .filter(path => path.startsWith(cidFolder) && !path.endsWith('/'))
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

    async processZipFile(zipFile: File): Promise<VendorEvidence[]> {
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

            // Process questionnaire data
            const questions: QuestionData[] = XLSX.utils.sheet_to_json(questionnaire.Sheets[questionnaire.SheetNames[0]]);
            const designElements = this.extractDesignElements(questions);

            // Find CID folders
            const cidFolders = await this.findEvidenceFolders(zip);
            if (cidFolders.length === 0) {
                throw new Error('No CID folders found in zip file');
            }

            // Process each CID folder
            const vendorEvidence: VendorEvidence[] = await Promise.all(
                cidFolders.map(async (cidFolder) => {
                    const cid = cidFolder;
                    const evidenceFiles = await this.getEvidenceFiles(zip, cidFolder);

                    return {
                        cid,
                        designElements,
                        evidenceFiles
                    };
                })
            );

            console.log('Processed vendor evidence:', vendorEvidence);
            return vendorEvidence;
        } catch (error) {
            console.error('Error processing zip file:', error);
            throw error;
        }
    }
}