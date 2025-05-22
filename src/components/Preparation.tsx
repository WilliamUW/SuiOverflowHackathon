import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { InterviewQuestion, getInterviewQuestions } from "../view-functions/getInterviewQuestions";
import { useEffect, useMemo, useState } from "react";
import { useSuiClient, useWallet } from "@suiet/wallet-kit";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export const API_BASE_URL = 'https://easyatoronto.onrender.com';

interface QAPair {
  question: string;
  answer: string;
  feedback?: string;
  isRegenerating?: boolean;
}

// Mock company descriptions
const companyDescriptions: Record<string, string> = {
  google: "Google is a technology company that specializes in Internet-related services and products.",
  microsoft: "Microsoft Corporation is an American multinational technology company.",
  sui: "Sui is a Layer 1 blockchain designed for instant settlement and high throughput.",
};

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
    <div className="container max-w-screen-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Interview Preparation</h1>
        <p className="text-gray-600">Practice with real interview questions from top companies</p>
      </div>

      <div className="space-y-8">
        {/* Company Selection */}
        <div>
          <label className="text-sm font-medium" htmlFor="company-select">Select Company</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {companies.map((company) => (
              <button
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCompany === company
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {company}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {selectedCompany && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Interview Questions for {selectedCompany}</h2>
            {companyQuestions.length > 0 ? (
              <div className="grid gap-4">
                {companyQuestions.map((question, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-gray-700">{question.interview_question}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Posted {new Date(Number(question.timestamp) * 1000).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">
                          {question.user_address.slice(0, 6)}...{question.user_address.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No questions available for {selectedCompany} yet.</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="personal-info" className="text-sm font-medium">
            Personal Information
          </label>
          <Textarea
            id="personal-info"
            placeholder="Copy and paste in your resume, linkedin, personal bio, etc."
            value={personalInfo}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPersonalInfo(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="company-info" className="text-sm font-medium">
            Company Information
          </label>
          <Textarea
            id="company-info"
            placeholder="Copy and paste in company-specific information, job requirements, and interview context..."
            value={companyInfo}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyInfo(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <Button onClick={handleGenerateAnswers} className="w-full" disabled={loading}>
          {loading ? "Generating..." : "Generate Answers"}
        </Button>
        {loading && (
          <div className="w-full flex justify-center mt-4">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
            <span className="ml-2 text-blue-500">Generating answer...</span>
          </div>
        )}
        {generatedAnswer?.questions && !loading && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Generated Questions and Answers</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {generatedAnswer.questions.length} {generatedAnswer.questions.length === 1 ? 'Question' : 'Questions'}
              </span>
            </div>
            {generatedAnswer.questions.map((qa, index) => (
              <div key={index} className="p-4 border rounded bg-gray-50">
                <h3 className="font-medium text-blue-600 mb-2">Q: {qa.question}</h3>
                <p className="text-gray-700">A: {qa.answer}</p>
                
                <Collapsible
                  open={feedbackOpen[index]}
                  onOpenChange={(open) => setFeedbackOpen({ ...feedbackOpen, [index]: open })}
                  className="mt-4"
                >
                  <CollapsibleTrigger className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ChevronDown className={cn("h-4 w-4 mr-1 transition-transform", feedbackOpen[index] ? "transform rotate-180" : "")} />
                    Provide Feedback
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <Textarea
                      placeholder="Enter feedback for the AI (e.g., Focus more on xyz experience)"
                      value={qa.feedback || ""}
                      onChange={(e) => handleFeedbackChange(index, e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={() => handleRegenerateAnswer(index)}
                      disabled={qa.isRegenerating}
                      className="w-full"
                    >
                      {qa.isRegenerating ? "Regenerating..." : "Regenerate Answer"}
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h2 className="font-semibold mb-4">Ask a Custom Question</h2>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your custom interview question..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={handleGenerateCustomAnswer}
              disabled={isGeneratingCustom || !customQuestion.trim() || !selectedCompany}
              className="w-full"
            >
              {isGeneratingCustom ? "Generating Answer..." : "Generate Answer"}
            </Button>
            {!selectedCompany && (
              <p className="text-sm text-red-500">
                Please select a company first
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 