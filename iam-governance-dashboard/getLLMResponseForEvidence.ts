import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import { NextApiRequest, NextApiResponse } from 'next';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

const getHeaders = (token: string) => {
    const HTTP_REQUEST_ID = uuidv4() as string;
    const UTC_TIME_STAMP = new Date().toISOString();
    const CORRELATION_ID = uuidv4() as string;
    const CLIENT_ID = process.env.CLIENT_ID;
    const TACHYON_API_KEY = process.env.TACHYON_API_KEY;
    const USECASE_ID = process.env.USECASE_ID;

    const outheaders = {
        'x-request-id': HTTP_REQUEST_ID,
        'x-correlation-id': CORRELATION_ID,
        'x-wf-client-id': CLIENT_ID,
        'x-wf-request-date': UTC_TIME_STAMP,
        'Authorization': `Bearer ${token}`,
        'x-wf-api-key': `${TACHYON_API_KEY}`,
        'x-wf-usecase-id': `${USECASE_ID}`
    };

    return outheaders;
};

// Load prompts from YAML file
const loadPromptsFromYAML = async () => {
    try {
        const yamlPath = path.join(process.cwd(), 'public', 'prompts', 'iam-analysis-prompts.yaml');
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        const prompts = yaml.load(yamlContent) as any;
        return prompts;
    } catch (error) {
        console.error('Error loading YAML prompts:', error);
        // Return default prompts as fallback
        return {
            system_prompt: `You are an expert IAM compliance analyst specializing in Non-Human Account (NHA) assessments for Wells Fargo. 
            Analyze the provided evidence images for compliance with Wells Fargo IAM policies, specifically focusing on:
            - eSAR inventory requirements and documentation
            - Password complexity policies (ISCR-315-01 compliance)
            - Password rotation policies and enforcement
            - Account management practices and controls
            - Non-human account identification and tracking
            
            Provide detailed, accurate, and actionable analysis results.`,

            analysis_prompt: `Analyze this evidence image for IAM compliance assessment. Please provide a comprehensive analysis including:
            1. Detailed observation of what you see in the image
            2. Relevance to NHA compliance requirements
            3. Compliance assessment (Compliant/Non-Compliant/Partially Compliant)
            4. Specific findings and recommendations
            5. Any gaps or missing information identified
            
            Format your response as a structured JSON with the following fields:
            {
                "observation": "Detailed description of what is visible in the image",
                "relevance": "How this evidence relates to IAM compliance requirements",
                "compliance_status": "Compliant|Non-Compliant|Partially Compliant",
                "analysis": "Detailed analysis of compliance aspects",
                "findings": ["List of specific findings"],
                "recommendations": ["List of actionable recommendations"],
                "gaps": ["List of any gaps or missing information"]
            }`
        };
    }
};

const processEvidenceLLM = async (headers: any, API_URL: string, stream: boolean, APIGEE_ACCESS_TOKEN: string, name: string, imageBuffer: Buffer, customPrompt?: string) => {
    const model_name = process.env.LLM_MODEL as string;
    const client = new OpenAI({
        apiKey: APIGEE_ACCESS_TOKEN as unknown as string,
        baseURL: API_URL,
        httpAgent: new https.Agent({ rejectUnauthorized: false }),
        defaultHeaders: headers
    });

    // Load prompts from YAML
    const prompts = await loadPromptsFromYAML();
    const systemPrompt = prompts.system_prompt;
    const analysisPrompt = customPrompt || prompts.analysis_prompt;

    console.log('Using system prompt:', systemPrompt);
    console.log('Using analysis prompt:', analysisPrompt);

    let chatCompletion;
    try {
        chatCompletion = await client.chat.completions.create({
            model: model_name,
            messages: [
                {
                    "role": "system",
                    "content": systemPrompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": `${analysisPrompt}\n\nFile name: ${name}\n\nPlease analyze this evidence image according to the requirements above.`
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0,
            top_p: 1,
            presence_penalty: 1,
            frequency_penalty: 1.3, //RepetitionPenalty
            max_tokens: 8192,
            stop: "DONE",
            stream: stream,
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.log("error completing chat ", error);
        throw error;
    }
};

const getLLMResponseForEvidence = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { imageBase64, filename, token, username, prompt } = req.body;

        if (!imageBase64 || !token || !username) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Convert base64 to buffer for image processing
        const base64Data: string = imageBase64.split(",")[1] || imageBase64.split(",")[0];
        const imageBuffer = Buffer.from(base64Data, "base64");

        const headers = getHeaders(token);
        const GENERATE_UAT_URL = process.env.GENERATE_UAT_URL;
        const response = await processEvidenceLLM(headers, GENERATE_UAT_URL, false, token, filename, imageBuffer, prompt);

        console.log(`LLM Response for ${filename}:`, response);

        // Try to parse response as JSON, if it fails return as plain text
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(response || '{}');
        } catch (parseError) {
            parsedResponse = {
                observation: response || 'Analysis completed',
                relevance: 'Relevant to IAM compliance assessment',
                compliance_status: 'Partially Compliant',
                analysis: response || 'Analysis results available',
                findings: ['Analysis completed successfully'],
                recommendations: ['Review the analysis results'],
                gaps: []
            };
        }

        res.status(200).json(parsedResponse);

    } catch (error) {
        console.error(`Error processing evidence: ${error}`);
        res.status(500).json({
            error: 'Server error processing evidence',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export default getLLMResponseForEvidence; 