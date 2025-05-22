import { InterviewQuestion, getInterviewQuestions } from "../view-functions/getInterviewQuestions";
import { useEffect, useMemo, useState } from "react";
import { useSuiClient, useWallet } from "@suiet/wallet-kit";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ChevronDown } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";
import { useQuery } from "@tanstack/react-query";

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
  const [generatedAnswer, setGeneratedAnswer] = useState<{ questions: Array<{ question: string; answer: string }> } | null>(null);
  const [isOpen, setIsOpen] = useState(true);

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
    setLoading(true);
    setGeneratedAnswer(null);
    setTimeout(() => {
      setGeneratedAnswer({
        questions: [
          {
            question: `Why do you want to work at ${selectedCompany}?`,
            answer: `I am passionate about blockchain and Sui's mission to scale decentralized applications.`,
          },
          {
            question: `How would you explain Sui's consensus mechanism?`,
            answer: `Sui uses Narwhal and Bullshark for high throughput and low latency consensus.`,
          },
        ],
      });
      setLoading(false);
    }, 1500);
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
            <h2 className="font-semibold mb-2">Generated Questions and Answers</h2>
            {generatedAnswer.questions.map((qa, index) => (
              <div key={index} className="p-4 border rounded bg-gray-50">
                <h3 className="font-medium text-blue-600 mb-2">Q: {qa.question}</h3>
                <p className="text-gray-700">A: {qa.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 