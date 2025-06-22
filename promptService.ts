export interface DomainData {
    Domain_Id: string;
    Question: string;
    Question_Description: string;
}

export interface QuestionPrompt {
    domainId: string;
    id: string;
    question: string;
    prompt: string;
}

/**
 * Load and normalize domain list from JSON.
 */
export const loadDomainList = async (): Promise<DomainData[]> => {
    if (!domain_list) return [];

    // If the JSON import yields an object with a 'data' key, unwrap it
    if (typeof domain_list === 'object' && !Array.isArray(domain_list)) {
        const arrKey = Object.keys(domain_list).find(k => Array.isArray((domain_list as any)[k]));
        if (arrKey) {
            return (domain_list as any)[arrKey] as DomainData[];
        }
    }
    return domain_list as DomainData[];
};

/**
 * Extracts numbered sub-questions from the description text.
 */
export const extractSubQuestions = (description: string): string[] => {
    const regex = /(?:document the following )?design elements:/i;
    const match = description.match(regex);
    // if (!description.includes('Design elements:')) return [];
    if (!match) return [];
    const index = description.toLowerCase().indexOf(match[0].toLowerCase());
    if (index === -1) return [];
    const extraction = description.slice(index + match[0].length).trim();
    return extraction
        .split('\n')
        .filter(line => /^\d+\./.test(line)) // keep only numbered lines
        .map(line => line.replace(/^\d+\.\s*/, '')); // remove numbering
};

/**
 * Checks if a given CID exists in the domain list.
 */
export const checkCID = async (cid: string, list: DomainData[]): Promise<boolean> => {
    return list.some(item => item.Domain_Id === cid);
};

/**
 * Fetch design element prompts by CID, returning a tuple [valid, prompts].
 */
export const getDesignElementsByCID = async (
    CID: string
): Promise<[boolean, QuestionPrompt[]]> => {
    const domainList = await loadDomainList();
    const valid = await checkCID(CID, domainList);
    if (!valid) {
        console.warn(`Invalid Domain_Id: ${CID}`);
        return [false, []];
    }

    const prompts: QuestionPrompt[] = [];
    const domain = domainList.find(item => item.Domain_Id === CID);

    if (!domain) return [false, []];

    const subQuestions = extractSubQuestions(domain.Question_Description);
    if (subQuestions.length > 0) {
        subQuestions.forEach((elem, idx) => {
            const domainId = domain.Domain_Id;
            const id = `${domainId}-sub-${idx + 1}`;
            const baseQuestion = domain.Question.replace(/\[.*\]/, '');
            const fullPrompt = `${baseQuestion} with the following design element: ${elem}`;
            prompts.push({ domainId, id, question: domain.Question, prompt: fullPrompt });
        });
    } else {
        prompts.push({
            domainId: domain.Domain_Id,
            id: `${domain.Domain_Id}-main`,
            question: domain.Question,
            prompt: domain.Question
        });
    }

    return [true, prompts];
};

// Mock domain_list for now - this should be replaced with actual JSON import
const domain_list: DomainData[] = [
    {
        Domain_Id: "AC-001",
        Question: "How does the vendor implement access control mechanisms?",
        Question_Description: "Document the following design elements: 1. User authentication methods 2. Role-based access controls 3. Privileged access management 4. Access review processes"
    },
    {
        Domain_Id: "AU-001",
        Question: "What authentication systems does the vendor use?",
        Question_Description: "Document the following design elements: 1. Multi-factor authentication 2. Single sign-on capabilities 3. Password policies 4. Authentication logging"
    },
    {
        Domain_Id: "AU-002",
        Question: "How does the vendor manage authorization?",
        Question_Description: "Document the following design elements: 1. Authorization frameworks 2. Permission management 3. Role definitions 4. Access delegation"
    },
    {
        Domain_Id: "CR-001",
        Question: "What encryption standards does the vendor implement?",
        Question_Description: "Document the following design elements: 1. Data at rest encryption 2. Data in transit encryption 3. Key management 4. Cryptographic standards compliance"
    },
    {
        Domain_Id: "BC-001",
        Question: "How does the vendor handle backup and recovery?",
        Question_Description: "Document the following design elements: 1. Backup frequency and retention 2. Recovery time objectives 3. Recovery point objectives 4. Disaster recovery testing"
    },
    {
        Domain_Id: "IR-001",
        Question: "What incident response procedures does the vendor have?",
        Question_Description: "Document the following design elements: 1. Incident detection methods 2. Response team structure 3. Communication protocols 4. Post-incident analysis"
    },
    {
        Domain_Id: "VM-001",
        Question: "How does the vendor manage vulnerabilities?",
        Question_Description: "Document the following design elements: 1. Vulnerability scanning processes 2. Patch management procedures 3. Risk assessment methods 4. Remediation timelines"
    },
    {
        Domain_Id: "NS-001",
        Question: "What network security controls does the vendor implement?",
        Question_Description: "Document the following design elements: 1. Firewall configurations 2. Network segmentation 3. Intrusion detection systems 4. Network monitoring"
    },
    {
        Domain_Id: "PS-001",
        Question: "How does the vendor ensure physical security?",
        Question_Description: "Document the following design elements: 1. Facility access controls 2. Environmental controls 3. Equipment security 4. Visitor management"
    },
    {
        Domain_Id: "SA-001",
        Question: "What security awareness programs does the vendor maintain?",
        Question_Description: "Document the following design elements: 1. Employee training programs 2. Security awareness campaigns 3. Phishing simulation 4. Security culture assessment"
    }
]; 