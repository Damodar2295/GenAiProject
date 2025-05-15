import React, { useState, useRef } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Container,
  Paper,
  // Remove unused imports
  // SxProps,
  // Theme
} from '@mui/material';
import { SurveyQuestion, SurveyAnswers, SurveyEvidence } from '../types/survey';
import { CloudUpload, Delete } from '@mui/icons-material';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
// Remove this unused import
// import styles from '../styles/home.module.css';

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 1,
    question: "Does this application have non-platform-based service account(s)/non-human account(s) which is hosted in the application layer of the asset?",
    options: ["Yes", "No"],
    evidenceRequired: {
      "No": "Export or screenshot of the entire list of accounts showing none meet NHA definition.\n\nNote: Please provide one of the following:\n- Export or screenshot of the entire list of accounts demonstrating that none meet the NHA definition\n- Written confirmation from the vendor\n- Organization Third-party relationship manager confirmation that there are no such accounts hosted directly within the application",
      "Yes": "Not Required. Proceed to next question"
    }
  },
  {
    id: 2,
    question: "Can you confirm that ALL afore mentioned application layer non-human/service accounts are registered in eSAR?",
    options: ["Yes", "No"],
    evidenceRequired: {
      "No": "Identify remediation steps required to input accounts into eSAR.\n\nNote: Please provide evidence sourced from the application showing a complete list of accounts and corresponding entry in eSAR (eSAR is service account repository)",
      "Yes": "Provide evidence sourced from the application showing account details and eSAR entry"
    },
    confluenceUrl: "https://confluence.wellsfargo.com/display/esar-documentation"  // Add your actual confluence URL here
  },
  {
    id: 3,
    question: "Are the application non-human accounts compliant with ISCR-315-01 Password Construction & Security Requirements?",
    options: ["Yes", "No"],
    evidenceRequired: {
      "No": "Identify remediation steps required to enhance the application password construction requirements.\n\nNote: Evidence of remediation can include:\n- Completed production change requests\n- Screenshots of password construction code or configuration policy with date & time stamp\n- Written confirmation from the vendor of compliance requirements",
      "Yes": "Screenshots of password construction policy with timestamp"
    }
  },
  {
    id: 4,
    question: "Are the application non-human accounts compliant with ISCR-315-11 Password Rotation policy requirements?",
    options: ["Yes", "No"],
    evidenceRequired: {
      "No": "Identify remediation steps to complete password rotation in compliance with security requirements.\n\nNote: Evidence of remediation can include:\n- Completed production change requests\n- Screenshots of password change with date and time stamp\n- Written confirmation from the vendor of compliance with requirements\n- Evidence of the account being password-less",
      "Yes": "Screenshots of password change with timestamp"
    }
  }
];

const Survey: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [evidence, setEvidence] = useState<SurveyEvidence>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [llmAnalysis, setLlmAnalysis] = useState<any>({
    compliant: false,
    recommendations: [
      {
        question: "eSAR Registration",
        status: "Partially Compliant",
        evidence: "Account details provided but missing some eSAR entries",
        recommendation: "Update eSAR with complete account mapping and ensure all service accounts are registered"
      },
      {
        question: "Password Construction",
        status: "Compliant",
        evidence: "Screenshots verified with timestamp",
        recommendation: "Maintain current password policy standards"
      },
      {
        question: "Password Rotation",
        status: "Non-Compliant",
        evidence: "Some accounts exceed rotation period",
        recommendation: "Implement automated password rotation system for all service accounts"
      }
    ]
  });

  const handleBack = (): void => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
      setShowSummary(false); // Reset summary view when going back
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setEvidence(prev => ({
        ...prev,
        [surveyQuestions[activeStep].id]: [
          ...(prev[surveyQuestions[activeStep].id] || []),
          ...files
        ]
      }));
    }
  };

  const handleDeleteFile = (questionId: number, fileIndex: number) => {
    setEvidence(prev => ({
      ...prev,
      [questionId]: prev[questionId].filter((_, index) => index !== fileIndex)
    }));
  };

  const handleNext = (): void => {
    if (activeStep === surveyQuestions.length - 1) {
      setShowSummary(true);
    } else if (!(answers[surveyQuestions[activeStep].id] === 'No' && activeStep === 0)) {
      // Only proceed if it's not "No" on first question
      setActiveStep((prev) => prev + 1);
    }
  };

  const [showFirstQuestionSummary, setShowFirstQuestionSummary] = useState<boolean>(false);
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(false);

  // Add new state for survey termination
  const [terminateSurvey, setTerminateSurvey] = useState<boolean>(false);

  // Update handleAnswer function
  const handleAnswer = (questionId: number, value: string): void => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
    
    if (questionId === 1 && value === 'No') {
      setShowFirstQuestionSummary(true);
      setLlmAnalysis({
        compliant: true,
        recommendations: [
          {
            question: "Non-Human Account Assessment",
            status: "Compliant",
            evidence: "No non-platform-based service accounts found",
            recommendation: "Continue monitoring for any new service accounts"
          }
        ]
      });
    }
  };

  // Add new handler for survey termination
  const handleTerminateSurvey = () => {
    setTerminateSurvey(true);
    setShowSummary(true);
  };

  // Add this function after handleTerminateSurvey and before renderSummary
  const handleCompleteSurvey = (): void => {
    setShowSummary(true);
    setSurveyCompleted(true);
    // Update final analysis if needed
    setLlmAnalysis({
      compliant: true,
      recommendations: [
        {
          question: "Overall Assessment",
          status: "Completed",
          evidence: "All required evidence collected",
          recommendation: "Review and maintain compliance status"
        },
        ...llmAnalysis.recommendations
      ]
    });
  };

  const renderSummary = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom color="primary">
        Compliance Analysis Summary
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white' }}>Assessment Area</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Evidence Analysis</TableCell>
              <TableCell sx={{ color: 'white' }}>Recommendation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {llmAnalysis.recommendations.map((item: any, index: number) => (
              <TableRow key={index} sx={{ 
                bgcolor: item.status === 'Compliant' ? '#e8f5e9' : 
                            item.status === 'Non-Compliant' ? '#ffebee' : '#fff3e0'
              }}>
                <TableCell><strong>{item.question}</strong></TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.evidence}</TableCell>
                <TableCell>{item.recommendation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
  // Update the JSX where you show the first question summary
  // Update the Paper and Typography components styling
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ 
        p: 4, 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {!showSummary ? (
          <>
            <Typography 
              variant="h4" 
              gutterBottom 
              align="center" 
              color="primary"
              sx={{ 
                mb: 4,
                fontWeight: 600,
                letterSpacing: '-0.5px'
              }}
            >
              NHA Compliance Survey
            </Typography>
  
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel 
              sx={{ 
                mb: 4,
                '& .MuiStepLabel-label': {
                  fontFamily: 'Wells Fargo Sans, sans-serif',
                }
              }}
            >
              {surveyQuestions.map((question, index) => (
                <Step key={question.id}>
                  <StepLabel>Question {index + 1}</StepLabel>
                </Step>
              ))}
            </Stepper>
  
            {activeStep < surveyQuestions.length && (
              <>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <FormControl component="fieldset">
                      <FormLabel component="legend" sx={{ mb: 2 }}>
                        <Typography variant="h6">
                          {surveyQuestions[activeStep].question}
                        </Typography>
                      </FormLabel>
                      <RadioGroup
                        value={answers[surveyQuestions[activeStep].id] || ''}
                        onChange={(e) => handleAnswer(surveyQuestions[activeStep].id, e.target.value)}
                      >
                        {surveyQuestions[activeStep].options.map((option) => (
                          <FormControlLabel
                            key={option}
                            value={option}
                            control={<Radio />}
                            label={option}
                          />
                        ))}
                      </RadioGroup>
  
                      {answers[surveyQuestions[activeStep].id] && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            Evidence Required:
                          </Typography>
                          <Typography sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                            {surveyQuestions[activeStep].evidenceRequired[answers[surveyQuestions[activeStep].id]]}
                          </Typography>
                          
                          {(answers[surveyQuestions[activeStep].id] === 'No' ||
                            (answers[surveyQuestions[activeStep].id] === 'Yes' && activeStep > 0)) && (
                            <>
                              <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                              />
                              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  startIcon={<CloudUpload />}
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  Upload Evidence
                                </Button>
                              </Box>
  
                              {evidence[surveyQuestions[activeStep].id]?.length > 0 && (
                                <List>
                                  {evidence[surveyQuestions[activeStep].id].map((file, index) => (
                                    <ListItem key={index}>
                                      <ListItemText 
                                        primary={file.name}
                                        secondary={`${(file.size / 1024).toFixed(2)} KB`}
                                      />
                                      <ListItemSecondaryAction>
                                        <IconButton
                                          edge="end"
                                          onClick={() => handleDeleteFile(surveyQuestions[activeStep].id, index)}
                                        >
                                          <Delete />
                                        </IconButton>
                                      </ListItemSecondaryAction>
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                            </>
                          )}
                        </Box>
                      )}
                    </FormControl>
                  </CardContent>
                </Card>
  
                {showFirstQuestionSummary && activeStep === 0 && (
                  <Box sx={{ mt: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Initial Assessment Result
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white' }}>Assessment Area</TableCell>
                            <TableCell sx={{ color: 'white' }}>Status</TableCell>
                            <TableCell sx={{ color: 'white' }}>Evidence Analysis</TableCell>
                            <TableCell sx={{ color: 'white' }}>Recommendation</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {llmAnalysis.recommendations.map((item: any, index: number) => (
                            <TableRow key={index} sx={{ bgcolor: '#e8f5e9' }}>
                              <TableCell><strong>{item.question}</strong></TableCell>
                              <TableCell>{item.status}</TableCell>
                              <TableCell>{item.evidence}</TableCell>
                              <TableCell>{item.recommendation}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 2 }}>
                      <Typography color="text.secondary" gutterBottom>
                        Please provide written confirmation or evidence before completing the survey.
                      </Typography>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={terminateSurvey}
                            onChange={() => handleTerminateSurvey()}
                          />
                        }
                        label="I confirm and want to complete the survey"
                      />
                    </Box>
                  </Box>
                )}
              </>
            )}

            {/* Update the buttons in your component */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="contained"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              {activeStep === surveyQuestions.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleCompleteSurvey}
                  disabled={!answers[surveyQuestions[activeStep]?.id]}
                >
                  Complete Survey & View Recommendations
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={!answers[surveyQuestions[activeStep]?.id]}
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </>
        ) : (
          <>
            {renderSummary()}
            {terminateSurvey && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Thank you for completing the survey!
                </Typography>
                <Typography color="text.secondary">
                  Your responses have been recorded successfully.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Survey;