import { useEffect, useMemo, useState } from "react";

import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";

// Mock company descriptions
const companyDescriptions: Record<string, string> = {
  google: "Google is a technology company that specializes in Internet-related services and products.",
  microsoft: "Microsoft Corporation is an American multinational technology company.",
  sui: "Sui is a Layer 1 blockchain designed for instant settlement and high throughput.",
};

// Mock interview questions
const mockInterviewQuestions = [
  {
    user_address: "0x123...abc",
    company_name: "Sui",
    interview_question: "How does Sui achieve high throughput?",
    timestamp: `${Math.floor(Date.now() / 1000) - 86400}`,
  },
  {
    user_address: "0x456...def",
    company_name: "Sui",
    interview_question: "Explain the Move programming language.",
    timestamp: `${Math.floor(Date.now() / 1000) - 432000}`,
  },
  {
    user_address: "0x789...ghi",
    company_name: "Google",
    interview_question: "What is your approach to solving complex problems?",
    timestamp: `${Math.floor(Date.now() / 1000) - 259200}`,
  },
];

interface InterviewData {
  user_address: string;
  company_name: string;
  interview_question: string;
  timestamp: string;
}

export default function Preparation() {
  const [personalInfo, setPersonalInfo] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<{ questions: Array<{ question: string; answer: string }> } | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewData[]>([]);

  // Get unique companies from questions
  const companies = useMemo(() => {
    const uniqueCompanies = Array.from(new Set(mockInterviewQuestions.map(q => q.company_name)));
    return uniqueCompanies.map(name => ({
      value: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      label: name,
      logo: `https://logo.clearbit.com/${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`
    }));
  }, []);

  const selectedCompanyData = companies.find(c => c.label === selectedCompany);

  useEffect(() => {
    setInterviewQuestions(mockInterviewQuestions);
  }, []);

  const filteredQuestions = interviewQuestions.filter(
    q => q.company_name.toLowerCase() === selectedCompany.toLowerCase()
  );

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
      <h1 className="text-2xl font-bold mb-6">Sui Interview Preparation</h1>
      <div className="space-y-6">
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
          <label className="text-sm font-medium" htmlFor="company-select">Select Company</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {companies.map((company) => (
              <button
                key={company.value}
                type="button"
                className={cn(
                  "flex items-center px-4 py-2 rounded-full border transition-colors",
                  selectedCompany === company.label ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800 hover:bg-blue-100"
                )}
                onClick={() => setSelectedCompany(company.label)}
              >
                <img
                  src={company.logo}
                  alt={`${company.label} logo`}
                  className="w-7 h-7 rounded-full mr-2 object-contain bg-white"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${company.label}&background=random`;
                  }}
                />
                {company.label}
              </button>
            ))}
          </div>
          <input
            id="company-select"
            type="text"
            placeholder="Enter company name..."
            value={selectedCompany}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedCompany(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {selectedCompany && companyDescriptions[selectedCompany.toLowerCase()] && (
            <p className="text-sm text-gray-600 mt-2">
              {companyDescriptions[selectedCompany.toLowerCase()]}
            </p>
          )}
        </div>
        {selectedCompanyData && filteredQuestions.length > 0 && (
          <div className="space-y-2">
            <button
              className="flex items-center justify-between w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => setIsOpen((v) => !v)}
            >
              <span className="font-medium">Common {selectedCompanyData.label} Interview Questions</span>
              <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen ? "transform rotate-180" : "")}/>
            </button>
            {isOpen && (
              <div className="px-4 py-2 space-y-2">
                {filteredQuestions.map((question, index) => (
                  <div key={index} className="p-3 bg-white border rounded-lg">
                    <p className="text-gray-700">{question.interview_question}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Added {new Date(parseInt(question.timestamp) * 1000).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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