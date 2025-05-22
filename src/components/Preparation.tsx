import { AlertCircle, CheckCircle2, ChevronDown, Clock, Loader2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { InterviewQuestion, getInterviewQuestions } from "../view-functions/getInterviewQuestions";
import { useEffect, useMemo, useState } from "react";
import { useSuiClient, useWallet } from "@suiet/wallet-kit";

import {API_BASE_URL} from "../config";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface QAPair {
  question: string;
  answer: string;
  feedback?: string;
  isRegenerating?: boolean;
}

export default function Preparation() {
  const wallet = useWallet();
  const client = useSuiClient();
  const [personalInfo, setPersonalInfo] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<{ questions: QAPair[] } | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState<{ [key: number]: boolean }>({});
  const [customQuestion, setCustomQuestion] = useState("");
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const { data: interviewQuestions = [] } = useQuery({
    queryKey: ["interview-questions"],
    queryFn: () => getInterviewQuestions(client),
    refetchInterval: 10000,
  });

  // Get unique companies from interview questions
  const companies = useMemo(() => {
    const uniqueCompanies = new Set(interviewQuestions.map(q => q.company_name));
    return Array.from(uniqueCompanies).sort();
  }, [interviewQuestions]);

  // Get questions for selected company
  const companyQuestions = useMemo(() => {
    if (!selectedCompany) return [];
    return interviewQuestions
      .filter(q => q.company_name === selectedCompany)
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  }, [selectedCompany, interviewQuestions]);

  const handleGenerateAnswers = async () => {
    if (!selectedCompany) {
      toast.error("Please select a company first");
      return;
    }

    setLoading(true);
    setGeneratedAnswer(null);
    try {
      const prompt = `You are an expert at behavioral interviews as a tech professional. Generate behavioral interview questions based on the specific company & role. Then generate complete answers to those questions that specifically mentions details from the user's personal bio and resume based on the information below, focus on their most recent experience. Return ONLY a raw JSON object in the following format, without any markdown formatting or code blocks:
{
  "questions": [
    {
      "question": "Question text here",
      "answer": "Answer text here"
    }
  ]
}
  
Personal Info: ${personalInfo}\nCompany Info: ${companyInfo}\nCompany: ${selectedCompany}\n`;

      // Try the main API endpoint first
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/generate-answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
      } catch (error) {
        console.error('Error with main API:', error);
        // Fallback to mock data if API is down
        console.log('Using fallback data');
        setGeneratedAnswer({
          questions: [
            {
              question: `Why do you want to work at ${selectedCompany}?`,
              answer: `Based on my experience in ${personalInfo.split(' ').slice(0, 5).join(' ')}..., I am particularly drawn to ${selectedCompany}'s innovative approach to ${companyInfo.split(' ').slice(0, 5).join(' ')}...`,
            },
            {
              question: `Tell me about a challenging project you worked on.`,
              answer: `In my previous role, I worked on ${personalInfo.split(' ').slice(0, 10).join(' ')}... This experience aligns well with ${selectedCompany}'s focus on ${companyInfo.split(' ').slice(0, 5).join(' ')}...`,
            },
          ],
        });
        setLoading(false);
        toast.warning("Using fallback data as API is currently unavailable");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.answer) {
        throw new Error('No answer received from API');
      }

      const cleanAnswer = data.answer
        .replace(/^```json\n?/, '')
        .replace(/```.*$/, '')
        .trim();
      
      const firstBrace = cleanAnswer.indexOf('{');
      const lastBrace = cleanAnswer.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('Invalid JSON response format');
      }
      const jsonString = cleanAnswer.slice(firstBrace, lastBrace + 1);
      
      const parsedAnswer = JSON.parse(jsonString);
      setGeneratedAnswer(parsedAnswer);
      toast.success("Answers generated successfully!");
    } catch (error) {
      console.error('Error generating answers:', error);
      toast.error("Failed to generate answers. Please try again.");
      setGeneratedAnswer(null);
    }
    setLoading(false);
  };

  const handleRegenerateAnswer = async (index: number) => {
    if (!generatedAnswer) return;
    
    const qa = generatedAnswer.questions[index];
    const newGeneratedAnswer = { ...generatedAnswer };
    newGeneratedAnswer.questions[index] = { ...qa, isRegenerating: true };
    setGeneratedAnswer(newGeneratedAnswer);

    try {
      const prompt = `Personal Info: ${personalInfo}\nCompany Info: ${companyInfo}\nCompany: ${selectedCompany}\nQuestion: ${qa.question}\nPrevious Answer: ${qa.answer}\nFeedback: ${qa.feedback}\nGenerate a new answer for this question. Return ONLY a raw JSON object in the following format, without any markdown formatting or code blocks:
{
  "questions": [
    {
      "question": "${qa.question}",
      "answer": "New answer text here"
    }
  ]
}`;

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/generate-answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
      } catch (error) {
        console.error('Error with main API:', error);
        // Fallback to modified previous answer
        const fallbackAnswer = `[Fallback] ${qa.answer} ${qa.feedback ? `\n\nAdditional context: ${qa.feedback}` : ''}`;
        setGeneratedAnswer(prev => {
          if (!prev) return null;
          const updatedQuestions = [...prev.questions];
          updatedQuestions[index] = {
            ...qa,
            answer: fallbackAnswer,
            isRegenerating: false
          };
          return { ...prev, questions: updatedQuestions };
        });
        toast.warning("Using fallback data as API is currently unavailable");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.answer) {
        throw new Error('No answer received from API');
      }

      const cleanAnswer = data.answer
        .replace(/^```json\n?/, '')
        .replace(/```.*$/, '')
        .trim();
      
      const firstBrace = cleanAnswer.indexOf('{');
      const lastBrace = cleanAnswer.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('Invalid JSON response format');
      }
      const jsonString = cleanAnswer.slice(firstBrace, lastBrace + 1);
      
      const parsedAnswer = JSON.parse(jsonString);
      if (!parsedAnswer.questions?.[0]?.answer) {
        throw new Error('Invalid answer format in response');
      }

      const newAnswer = parsedAnswer.questions[0].answer;
      
      setGeneratedAnswer(prev => {
        if (!prev) return null;
        const updatedQuestions = [...prev.questions];
        updatedQuestions[index] = {
          ...qa,
          answer: newAnswer,
          isRegenerating: false
        };
        return { ...prev, questions: updatedQuestions };
      });
      toast.success("Answer regenerated successfully!");
    } catch (error) {
      console.error('Error regenerating answer:', error);
      toast.error("Failed to regenerate answer. Please try again.");
      setGeneratedAnswer(prev => {
        if (!prev) return null;
        const updatedQuestions = [...prev.questions];
        updatedQuestions[index] = {
          ...qa,
          isRegenerating: false
        };
        return { ...prev, questions: updatedQuestions };
      });
    }
  };

  const handleFeedbackChange = (index: number, feedback: string) => {
    if (!generatedAnswer) return;
    const newGeneratedAnswer = { ...generatedAnswer };
    newGeneratedAnswer.questions[index] = {
      ...newGeneratedAnswer.questions[index],
      feedback
    };
    setGeneratedAnswer(newGeneratedAnswer);
  };

  const handleGenerateCustomAnswer = async () => {
    if (!customQuestion.trim() || !selectedCompany) {
      toast.error("Please enter a question and select a company");
      return;
    }
    
    setIsGeneratingCustom(true);
    try {
      const prompt = `Personal Info: ${personalInfo}\nCompany Info: ${companyInfo}\nCompany: ${selectedCompany}\nQuestion: ${customQuestion}\nGenerate an answer for this question. Return ONLY a raw JSON object in the following format, without any markdown formatting or code blocks:
{
  "questions": [
    {
      "question": "${customQuestion}",
      "answer": "Answer text here"
    }
  ]
}`;

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/generate-answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
      } catch (error) {
        console.error('Error with main API:', error);
        // Fallback to basic answer
        const fallbackAnswer = `Based on my experience in ${personalInfo.split(' ').slice(0, 5).join(' ')}..., I would approach this question by considering ${companyInfo.split(' ').slice(0, 5).join(' ')}...`;
        const newQAPair = {
          question: customQuestion,
          answer: fallbackAnswer
        };
        
        setGeneratedAnswer(prev => {
          if (!prev) {
            return { questions: [newQAPair] };
          }
          return {
            questions: [...prev.questions, newQAPair]
          };
        });

        setCustomQuestion("");
        toast.warning("Using fallback data as API is currently unavailable");
        setIsGeneratingCustom(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.answer) {
        throw new Error('No answer received from API');
      }

      const cleanAnswer = data.answer
        .replace(/^```json\n?/, '')
        .replace(/```.*$/, '')
        .trim();
      
      const firstBrace = cleanAnswer.indexOf('{');
      const lastBrace = cleanAnswer.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('Invalid JSON response format');
      }
      const jsonString = cleanAnswer.slice(firstBrace, lastBrace + 1);
      
      const parsedAnswer = JSON.parse(jsonString);
      if (!parsedAnswer.questions?.[0]?.answer) {
        throw new Error('Invalid answer format in response');
      }

      const newQAPair = parsedAnswer.questions[0];
      
      setGeneratedAnswer(prev => {
        if (!prev) {
          return { questions: [newQAPair] };
        }
        return {
          questions: [...prev.questions, newQAPair]
        };
      });

      setCustomQuestion("");
      toast.success("Custom answer generated successfully!");
    } catch (error) {
      console.error('Error generating custom answer:', error);
      toast.error("Failed to generate custom answer. Please try again.");
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container max-w-screen-lg mx-auto px-4 py-12"
    >
      <div className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Interview Preparation
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 text-lg"
        >
          Practice with real interview questions from top companies
        </motion.p>
      </div>

      <div className="space-y-12">
        {/* Company Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          <label className="text-sm font-medium text-gray-700 mb-4 block">Select Company</label>
          <div className="flex flex-wrap gap-3">
            {companies.map((company) => (
              <motion.button
                key={company}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCompany(company)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  selectedCompany === company
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md"
                )}
              >
                {company}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Questions List */}
        <AnimatePresence mode="wait">
          {selectedCompany && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-semibold text-gray-800">Interview Questions for {selectedCompany}</h2>
              {companyQuestions.length > 0 ? (
                <div className="grid gap-6">
                  {companyQuestions.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex flex-col gap-3">
                          <p className="text-gray-800 text-lg">{question.interview_question}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(Number(question.timestamp) * 1000).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {question.user_address.slice(0, 6)}...{question.user_address.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">No questions available for {selectedCompany} yet.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personal Info Input */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <label htmlFor="personal-info" className="text-sm font-medium text-gray-700">
            Personal Information
          </label>
          <Textarea
            id="personal-info"
            placeholder="Copy and paste in your resume, linkedin, personal bio, etc."
            value={personalInfo}
            onChange={(e) => setPersonalInfo(e.target.value)}
            className="min-h-[200px] rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </motion.div>

        {/* Company Info Input */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-4"
        >
          <label htmlFor="company-info" className="text-sm font-medium text-gray-700">
            Company Information
          </label>
          <Textarea
            id="company-info"
            placeholder="Copy and paste in company-specific information, job requirements, and interview context..."
            value={companyInfo}
            onChange={(e) => setCompanyInfo(e.target.value)}
            className="min-h-[200px] rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </motion.div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Button 
            onClick={handleGenerateAnswers} 
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Generate Answers</span>
              </div>
            )}
          </Button>
        </motion.div>

        {/* Generated Answers */}
        <AnimatePresence mode="wait">
          {generatedAnswer?.questions && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Generated Questions and Answers</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                  {generatedAnswer.questions.length} {generatedAnswer.questions.length === 1 ? 'Question' : 'Questions'}
                </span>
              </div>
              {generatedAnswer.questions.map((qa, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-200"
                >
                  <h3 className="font-medium text-blue-600 mb-3">Q: {qa.question}</h3>
                  <p className="text-gray-700 mb-4">A: {qa.answer}</p>
                  
                  <Collapsible
                    open={feedbackOpen[index]}
                    onOpenChange={(open) => setFeedbackOpen({ ...feedbackOpen, [index]: open })}
                    className="mt-4"
                  >
                    <CollapsibleTrigger className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                      <ChevronDown className={cn("h-4 w-4 mr-1 transition-transform duration-200", feedbackOpen[index] ? "transform rotate-180" : "")} />
                      Provide Feedback
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4">
                      <Textarea
                        placeholder="Enter feedback for the AI (e.g., Focus more on xyz experience)"
                        value={qa.feedback || ""}
                        onChange={(e) => handleFeedbackChange(index, e.target.value)}
                        className="min-h-[100px] rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      />
                      <Button
                        onClick={() => handleRegenerateAnswer(index)}
                        disabled={qa.isRegenerating}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {qa.isRegenerating ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Regenerating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            <span>Regenerate Answer</span>
                          </div>
                        )}
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Question Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-12 p-8 border rounded-2xl bg-gradient-to-br from-gray-50 to-white shadow-lg"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ask a Custom Question</h2>
          <div className="space-y-6">
            <Textarea
              placeholder="Enter your custom interview question..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="min-h-[100px] rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
            <Button
              onClick={handleGenerateCustomAnswer}
              disabled={isGeneratingCustom || !customQuestion.trim() || !selectedCompany}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isGeneratingCustom ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Answer...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Answer</span>
                </div>
              )}
            </Button>
            {!selectedCompany && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span>Please select a company first</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
} 