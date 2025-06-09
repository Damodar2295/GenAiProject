import * as XLSX from 'xlsx';

interface DomainData {
    Domain_Id: number;
    Domain_Code: string;
    Domain_Name: string;
    Sub_Domain_Name: string;
    Question_Description: string;
    Question: string;
}

interface QuestionData {
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

interface FileWithBase64 {
    name: string;
    type: string;
    size: number;
    base64: string;
}

interface QuestionPrompt {
    id: string;
    question: string;
    prompt: string;
}

function extractSubQuestions(description: string): string[] {
    if (!description?.includes('design element:')) return [];
    const [mainPart, elements] = description.split('design element:');
    if (!elements) return [];
    const mainQuestion = mainPart.trim();
    const lines = elements.split(/\r?\n/);
    const numberedLines = lines.filter(line => /^\s*\d+\./.test(line));
    return numberedLines
        .map(line => {
            const cleanedLine = line.replace(/^\s*\d+\.\s*/, '').trim();
            return `${mainQuestion} design element: ${cleanedLine}`;
        })
        .filter(q => q.length > 0);
}

function extractDomainCode(questionnaireName: string): string {
    if (!questionnaireName || !questionnaireName.includes('-')) return '';
    const normalized = questionnaireName.trim();
    const parts = normalized.split('-');
    return parts[0]?.trim() || '';
}

function getFileExtension(reference: string): string {
    if (!reference) return '';
    const parts = reference.split('.');
    return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
}

async function readExcelFile(file: File | FileWithBase64): Promise<any[]> {
    let workbook: XLSX.WorkBook;
    if ('base64' in file) {
        // FileWithBase64
        const binary = atob(file.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        workbook = XLSX.read(bytes, { type: 'array' });
    } else {
        // File
        const buffer = await file.arrayBuffer();
        workbook = XLSX.read(buffer, { type: 'buffer' });
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
}

const loadDomainList = async (): Promise<DomainData[]> => {
    const response = await fetch('/domain_list.json');
    if (!response.ok) throw new Error('Failed to load domain list');
    return response.json();
};

export const processQuestionnaire = async (
    questionnaireFile: File | FileWithBase64 | any
): Promise<QuestionPrompt[]> => {
    try {
        const [domainList, questions] = await Promise.all([
            loadDomainList(),
            readExcelFile(questionnaireFile)
        ]);
        const domainMap = new Map<string, DomainData>();
        domainList.forEach((domain: DomainData) => domainMap.set(domain.Domain_Code, domain));

        const result: QuestionPrompt[] = [];
        questions.forEach((question: QuestionData, idx: number) => {
            const domainCode = extractDomainCode(question['Questionnaire Name']);
            const fileExtension = getFileExtension(question['Attachement Reference']);
            console.log(`[${idx}] domainCode:`, domainCode, 'fileExtension:', fileExtension);
            if (fileExtension !== 'PDF') return; // Only process PDF files

            const domain = domainMap.get(domainCode);
            console.log(`[${idx}] domain:`, domain);
            if (domain) {
                // Step 1: Split on 'design element:'
                const description = domain.Question_Description || "";
                console.log(`[${idx}] description:`, description);
                const parts = description.split('design element:');
                console.log(`[${idx}] parts:`, parts);
                if (parts.length > 1) {
                    // Step 2: Split the second part on newlines to get subquestions
                    const subQuestions = parts[1]
                        .split(/\r?\n/)
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    console.log(`[${idx}] subQuestions:`, subQuestions);
                    // Step 3: For each subquestion, create the output object
                    subQuestions.forEach((subQ) => {
                        result.push({
                            id: domain.Domain_Code,
                            question: subQ,
                            prompt: `${domain.Question} with the following policy features ${subQ}`
                        });
                    });
                }
            }
        });
        console.log('Final result:', result);
        return result;
    } catch (error) {
        console.error('Error processing questionnaire:', error);
        throw error;
    }
};
