export interface SurveyQuestion {
  id: number;
  question: string;
  options: string[];
  evidenceRequired: {
    [key: string]: string;
  };
  confluenceUrl?: string;  // Optional field for confluence URL
}

export interface SurveyAnswers {
  [key: number]: string;
}

export interface SurveyEvidence {
  [key: number]: File[];
}

export interface ConfluenceUrls {
  [key: number]: string;
}