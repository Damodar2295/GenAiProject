import mime from 'mime';

const baseURL = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
const appURL = baseURL.includes('localhost') ? '' : '/iameval';

async function uploadImageToLLM(file: File, name: string, user: string, token: string) {
    let retVal = { success: true, reason: '' };

    if (file) {
        const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });

        const base64File = await toBase64(file);

        const payload = {
            token: token,
            username: user,
            imageBase64: base64File,
            filename: file.name,
            analysisType: 'iam_compliance',
            evidenceType: 'screenshot'
        };

        const contentType = mime.getType(file.name) || 'application/octet-stream';
        console.log(`Calling Upload LLM API ${appURL}/api/v1/getLLMResponseForEvidence`);

        try {
            const response = await fetch(`${appURL}/api/v1/getLLMResponseForEvidence`, {
                method: 'POST',
                headers: {
                    'x-filename': file.name,
                    'x-content-type': contentType,
                    name,
                    createdBy: user,
                    createdAt: String(new Date()),
                    'content-type': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Image Upload Failed");
            }

            const data = await response.json();
            console.log("LLM Image process response ", data);

            return data;
        } catch (error) {
            console.error('Error uploading image files: ', error);
            throw error;
        }
    } else {
        retVal = {
            success: false,
            reason: 'No image file provided'
        };
    }

    return retVal;
}

const cleanJsonString = (llmResponse: string) => {
    const val = llmResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    val.replace(/\\n/g, "").replace(/\\"/g, "").trim();
    if (!val) {
        throw new Error("No JSON found in LLM response");
    }
    return val;
};

export const uploadImageHandlerLLM: CommandHandler = async (message, files, user) => {
    if (files.length === 0) {
        return [{
            text: "Please select image files to upload for IAM compliance analysis.",
            sender: 'bot',
            uploadBox: true,
            fileSelected: false
        }];
    }

    // Validate that all files are images
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
        return [{
            text: `Please upload only image files. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`,
            sender: 'bot',
            uploadBox: true,
            fileSelected: false
        }];
    }

    try {
        const token = await getToken();
        const uploadPromises = files.map(file => {
            return uploadImageToLLM(file, file.name, user, token);
        });

        const results = await Promise.all(uploadPromises);
        let resultsJson;

        try {
            resultsJson = results.map(res => {
                let parsed = cleanJsonString(res);
                parsed = JSON.parse(parsed);
                console.log("parsed json", parsed);
                return parsed;
            });
            console.log("Image analysis results", resultsJson);

            const store_result = await storeLLMResults(resultsJson);

            if (!store_result.success) {
                return [{ text: "Image Analysis Failed. Please Try Again.", sender: 'bot' }];
            }

            return results.map(res => {
                return { text: res, sender: 'bot' };
            });
        } catch (error) {
            console.log("error parsing the json response from image analysis");
            return [{ text: "Image Analysis Failed - Invalid Response Format. Please Try Again.", sender: 'bot' }];
        }
    } catch (error) {
        console.error('Error in uploadImageHandlerLLM:', error);
        return [{ text: "Image Analysis Failed. Please Try Again.", sender: 'bot' }];
    }
};

// Type definitions
interface CommandHandler {
    (message: string, files: File[], user: string): Promise<any[]>;
}

// Helper function to validate image files
export const validateImageFiles = (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];

    files.forEach(file => {
        if (!allowedTypes.includes(file.type)) {
            errors.push(`${file.name}: Unsupported file type. Please use JPEG, PNG, GIF, BMP, or WebP.`);
        }

        if (file.size > maxFileSize) {
            errors.push(`${file.name}: File size too large. Maximum size is 10MB.`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

// You'll need to implement these functions based on your project:
declare function getToken(): Promise<string>;
declare function storeLLMResults(results: any[]): Promise<{ success: boolean }>; 