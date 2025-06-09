import { processQuestionnaire } from './questionnaireService';

export const generateReport = async (
    questionnaireFile: File,
    evidenceFile?: File
): Promise<any> => {
    try {
        const questions = await processQuestionnaire(questionnaireFile);
        console.log('Generated Questions and Prompts:', JSON.stringify(questions, null, 2));
        return questions;
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}; 