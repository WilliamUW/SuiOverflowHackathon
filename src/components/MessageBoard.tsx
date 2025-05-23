import { API_BASE_URL, interviewHistoryId, packageId, rewardBalanceId } from '../config';
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Briefcase, Building2, Clock, DollarSign, Heart, Image, MessageSquare, Plus, Share2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSuiClient, useWallet } from "@suiet/wallet-kit";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Transaction } from "@mysten/sui/transactions";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const debugMode = false;

const PLACEHOLDER_BANNERS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80",
];

const PLACEHOLDER_USER_PROFILES = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/65.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
];

interface InterviewQuestion {
  company_name: string;
  interview_question: string;
  timestamp: string;
  user_address: string;
}

interface CompanyStats {
  reviews: string;
  jobs: string;
  salaries: string;
  interviews: string;
}

interface Company {
  name: string;
  banner: string;
  profile: string;
  description: string;
  stats: CompanyStats;
}

export function MessageBoard() {
  const wallet = useWallet();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState<string>("");
  const [interviewQuestion, setInterviewQuestion] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "add" | "reviews" | "jobs" | "salaries" | "benefits" | "photos" | "diversity">("overview");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [voteState, setVoteState] = useState<Record<string, number>>({});
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyQuestion, setNewCompanyQuestion] = useState("");
  const [interviewEmailPreview, setInterviewEmailPreview] = useState<string | null>(null);
  const interviewEmailFileInputRef = useRef<HTMLInputElement>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyResponse, setVerifyResponse] = useState<string | null>(null);
  const [contractQuestions, setContractQuestions] = useState<InterviewQuestion[]>([]);

  // Placeholder data
  const companies: Company[] = [
    {
      name: "Google",
      banner: PLACEHOLDER_BANNERS[0],
      profile: "https://logo.clearbit.com/google.com",
      description: "Google is a technology company that specializes in Internet-related services and products.",
      stats: {
        reviews: "100K",
        jobs: "10K",
        salaries: "200K",
        interviews: "30K",
      },
    },
    {
      name: "Microsoft",
      banner: PLACEHOLDER_BANNERS[1],
      profile: "https://logo.clearbit.com/microsoft.com",
      description: "Microsoft Corporation is an American multinational technology company.",
      stats: {
        reviews: "80K",
        jobs: "8K",
        salaries: "180K",
        interviews: "25K",
      },
    },
    {
      name: "Meta",
      banner: PLACEHOLDER_BANNERS[2],
      profile: "https://logo.clearbit.com/meta.com",
      description: "Meta Platforms, Inc. is an American multinational technology conglomerate.",
      stats: {
        reviews: "75K",
        jobs: "7K",
        salaries: "170K",
        interviews: "22K",
      },
    },
    {
      name: "Amazon",
      banner: PLACEHOLDER_BANNERS[0],
      profile: "https://logo.clearbit.com/amazon.com",
      description: "Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, and digital streaming.",
      stats: {
        reviews: "90K",
        jobs: "12K",
        salaries: "190K",
        interviews: "35K",
      },
    },
    {
      name: "Citadel",
      banner: PLACEHOLDER_BANNERS[1],
      profile: "https://logo.clearbit.com/citadel.com",
      description: "Citadel is a global financial institution that serves the world's most sophisticated institutional and retail clients.",
      stats: {
        reviews: "5K",
        jobs: "500",
        salaries: "50K",
        interviews: "8K",
      },
    },
  ];

  // Set default selected company
  useEffect(() => {
    if (companies.length > 0 && (!selectedCompany || !companies.find(c => c.name === selectedCompany.name))) {
      setSelectedCompany(companies[0]);
      setActiveTab("overview");
    }
  }, [companies]);

  const handleInterviewEmailDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = ev => setInterviewEmailPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInterviewEmailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setInterviewEmailPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Placeholder interview questions
  const companyQuestions: InterviewQuestion[] = [
    {
      company_name: "Google",
      interview_question: "What is your approach to solving complex problems?",
      timestamp: "1646092800",
      user_address: "0x123...abc",
    },
    {
      company_name: "Google",
      interview_question: "How do you handle failure?",
      timestamp: "1646006400",
      user_address: "0x456...def",
    },
  ];

  // Helper to get a deterministic profile pic for a user address
  function getUserProfilePic(address: string) {
    if (!address) return PLACEHOLDER_USER_PROFILES[0];
    const idx =
      address
        .split("")
        .map((c) => c.charCodeAt(0))
        .reduce((a, b) => a + b, 0) % PLACEHOLDER_USER_PROFILES.length;
    return PLACEHOLDER_USER_PROFILES[idx];
  }

  // Function to store interview question in the smart contract
  async function storeInterviewQuestion(companyName: string, question: string) {
    if (!wallet.connected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: packageId + `::hello_world::store_interview`,
        arguments: [
          tx.object(interviewHistoryId),
          tx.object(rewardBalanceId),
          tx.pure.string(companyName),
          tx.pure.string(question),
        ],
      });

      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("Transaction successful:", result);
      toast.success("Question stored successfully!");
      
      // Refetch BBT balance
      queryClient.invalidateQueries({ queryKey: ["bbt-balance", wallet.address] });
      
      // Refetch interview questions
      fetchInterviewQuestions();
    } catch (error) {
      console.error("Failed to store question:", error);
      toast.error("Failed to store question. See console for details.");
    }
  }

  // Function to fetch interview questions from the smart contract
  async function fetchInterviewQuestions() {
    try {
      const result = await client.getObject({
        id: interviewHistoryId,
        options: {
          showContent: true,
        },
      });

      if (result.data?.content?.dataType === "moveObject") {
        const content = result.data.content as any;
        const interviews = content.fields.interviews as any[];
        const questions = interviews.map(interview => ({
          company_name: interview.fields.company_name,
          interview_question: interview.fields.interview_question,
          timestamp: interview.fields.timestamp,
          user_address: interview.fields.user_address,
        }));
        setContractQuestions(questions);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  }

  // Fetch questions when component mounts
  useEffect(() => {
    fetchInterviewQuestions();
  }, []);

  // Function to read interview questions from the smart contract (debug)
  async function readInterviewQuestions() {
    if (!wallet.connected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      const result = await client.getObject({
        id: "0xafc9d98fcb15d936f42aaee8bae3dc930e1e23497843dee729295237c5ecdc39",
        options: {
          showContent: true,
        },
      });

      console.log("Interview History Object:", result);
    } catch (error) {
      console.error("Failed to read questions:", error);
      alert("Failed to read questions. See console for details.");
    }
  }

  // Function to test writing a question directly
  async function debugWriteQuestion() {
    storeInterviewQuestion("Google", "Tell me about yourself.");
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8 mb-20"
    >
      {/* Debug Buttons */}
      {debugMode && <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b flex gap-4">
        <Button
          onClick={readInterviewQuestions}
          variant="outline"
          className="text-sm rounded-xl hover:shadow-md transition-all duration-200"
        >
          Debug: Read Questions
        </Button>
        <Button
          onClick={debugWriteQuestion}
          variant="outline"
          className="text-sm rounded-xl hover:shadow-md transition-all duration-200"
        >
          Debug: Write Question
        </Button>
      </div>}

      {/* Company Selector */}
      <div className="flex gap-6 px-8 pt-8 pb-4 overflow-x-auto border-b bg-gradient-to-r from-gray-50 to-white items-center">
        {companies.map((company) => (
          <motion.button
            key={company.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center min-w-[100px] w-[100px] focus:outline-none transition-all duration-200 ${
              selectedCompany && selectedCompany.name === company.name 
                ? "font-bold text-blue-600" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => {
              setSelectedCompany(company);
              setActiveTab("overview");
            }}
          >
            <div className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
              selectedCompany && selectedCompany.name === company.name 
                ? "border-blue-600 shadow-lg" 
                : "border-gray-300 hover:border-gray-400"
            }`}>
              <img src={company.profile} alt={company.name} className="w-full h-full rounded-full object-cover" />
            </div>
            <span className="mt-2 text-sm">{company.name}</span>
          </motion.button>
        ))}
        {/* + Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center min-w-[100px] w-[100px] focus:outline-none justify-center"
          onClick={() => setShowAddCompany(true)}
          title="Add new company"
        >
          <span className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed border-gray-300 text-3xl text-gray-400 hover:bg-gray-100 hover:text-blue-600 hover:border-blue-600 transition-all duration-200">
            <Plus className="w-6 h-6" />
          </span>
          <span className="mt-2 text-sm text-gray-500">Add Other</span>
        </motion.button>
      </div>

      {/* Banner */}
      <AnimatePresence mode="wait">
        {selectedCompany && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative h-48 bg-gray-200">
              <img src={selectedCompany.banner} alt="Company Banner" className="object-cover w-full h-full" />
              {/* Profile Pic */}
              <div className="absolute left-8 -bottom-12">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={selectedCompany.profile}
                  alt="Company Logo"
                  className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
                />
              </div>
            </div>
            {/* Company Info */}
            <div className="pt-16 px-8 pb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedCompany.name}
                </h2>
                <Badge variant="outline" className="text-sm bg-white/80 backdrop-blur-sm">
                  Connected
                </Badge>
              </div>
              <p className="text-gray-600 mt-2">{selectedCompany.description}</p>
            </div>
            {/* Tabs */}
            <div className="border-b px-8">
              <nav className="flex gap-8 overflow-x-auto">
                {[
                  { id: "overview", icon: Building2, label: "Overview" },
                  { id: "questions", icon: MessageSquare, label: "Interview Questions" },
                  { id: "add", icon: Plus, label: "Add Your Interview Question" },
                  { id: "reviews", icon: Heart, label: "Reviews" },
                  { id: "jobs", icon: Briefcase, label: "Jobs" },
                  { id: "salaries", icon: DollarSign, label: "Salaries" },
                  { id: "benefits", icon: Users, label: "Benefits" },
                  { id: "photos", icon: Image, label: "Photos" },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab.id 
                        ? "font-bold border-b-2 border-blue-600 text-blue-600" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                ))}
              </nav>
            </div>
            {/* Tab Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-4 text-gray-600 text-lg">{selectedCompany.description}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {(Object.entries(selectedCompany.stats) as [keyof CompanyStats, string][]).map(([key, value]) => (
                        <motion.div
                          key={key}
                          whileHover={{ scale: 1.05 }}
                          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <div className="text-2xl font-bold text-blue-600">{value}</div>
                          <div className="text-sm text-gray-500 capitalize">{key}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {activeTab === "questions" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Interview Questions for {selectedCompany.name}
                    </h2>
                    <ScrollArea className="h-[400px] rounded-xl">
                      <div className="grid gap-6 pr-4">
                        {contractQuestions.length > 0 ? (
                          contractQuestions
                            .filter(q => q.company_name === selectedCompany.name)
                            .map((interview, index) => {
                              const voteKey = interview.interview_question + interview.user_address;
                              const vote = voteState[voteKey] || 0;
                              return (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <Card className="shadow-md hover:shadow-xl transition-all duration-200">
                                    <div className="flex gap-4 p-6 items-start">
                                      {/* Profile pic and address */}
                                      <div className="flex flex-col items-center min-w-[60px]">
                                        <motion.img
                                          whileHover={{ scale: 1.1 }}
                                          src={getUserProfilePic(interview.user_address)}
                                          alt="User"
                                          className="w-12 h-12 rounded-full border-2 border-gray-200 mb-2"
                                        />
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                          {interview.user_address.slice(0, 6)}...{interview.user_address.slice(-4)}
                                        </span>
                                      </div>
                                      {/* Question and actions */}
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <p className="text-lg font-medium mb-2">{interview.interview_question}</p>
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                            onClick={() => {
                                              navigator.clipboard.writeText(window.location.href + "#" + interview.interview_question);
                                              toast.success("Link copied to clipboard!");
                                            }}
                                            title="Share"
                                          >
                                            <Share2 className="w-5 h-5 text-gray-500" />
                                          </motion.button>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3">
                                          <span className="text-sm text-gray-500 flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(Number(interview.timestamp) * 1000).toLocaleString()}
                                          </span>
                                          <div className="flex items-center gap-2 ml-auto">
                                            <motion.button
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              className={`p-2 rounded-full transition-colors duration-200 ${
                                                vote === 1 
                                                  ? "bg-blue-100 text-blue-600" 
                                                  : "hover:bg-gray-100 text-gray-400"
                                              }`}
                                              onClick={() => setVoteState((prev) => ({ ...prev, [voteKey]: vote === 1 ? 0 : 1 }))}
                                              title="Upvote"
                                            >
                                              <ArrowUp className="w-5 h-5" />
                                            </motion.button>
                                            <span className="text-sm font-semibold w-6 text-center">
                                              {vote === 1 ? 1 : vote === -1 ? -1 : 0}
                                            </span>
                                            <motion.button
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              className={`p-2 rounded-full transition-colors duration-200 ${
                                                vote === -1 
                                                  ? "bg-red-100 text-red-600" 
                                                  : "hover:bg-gray-100 text-gray-400"
                                              }`}
                                              onClick={() => setVoteState((prev) => ({ ...prev, [voteKey]: vote === -1 ? 0 : -1 }))}
                                              title="Downvote"
                                            >
                                              <ArrowDown className="w-5 h-5" />
                                            </motion.button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                </motion.div>
                              );
                            })
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <p className="text-gray-500">No interview questions found for {selectedCompany.name}.</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
                {activeTab === "add" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="shadow-lg max-w-xl mx-auto">
                      <CardHeader>
                        <CardTitle className="text-xl">Submit New Question for {selectedCompany.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-4">
                          {/* Upload Interview Email Proof - Drag and Drop UI */}
                          <div>
                            <label className="block font-medium mb-1">Upload Interview Email (Proof)</label>
                            <div
                              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-lg p-6 cursor-pointer bg-gray-50 hover:bg-gray-100 transition min-h-[120px]"
                              onClick={() => interviewEmailFileInputRef.current?.click()}
                              onDrop={handleInterviewEmailDrop}
                              onDragOver={e => e.preventDefault()}
                            >
                              {interviewEmailPreview ? (
                                <img src={interviewEmailPreview} alt="Preview" className="max-h-32 rounded border" />
                              ) : (
                                <span className="text-gray-500">Click or drag image here to upload your interview email proof</span>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                ref={interviewEmailFileInputRef}
                                onChange={handleInterviewEmailFileChange}
                                className="hidden"
                              />
                            </div>
                            {/* Verify Interview Button */}
                            {interviewEmailPreview && (
                              <div className="mt-2 flex flex-col gap-2">
                                <button
                                  className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold ${verifying ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  disabled={verifying || verified}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    setVerifying(true);
                                    setVerifyError(null);
                                    setVerifyResponse(null);
                                    setVerified(false);
                                    try {
                                      const prompt = `Is this an interview email from ${selectedCompany.name}? Return Yes or No and provide a brief explanation.`;
                                      const res = await fetch(`${API_BASE_URL}/api/verify-interview-email`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          prompt,
                                          imageBase64: interviewEmailPreview,
                                        }),
                                      });
                                      const data = await res.json();
                                      setVerifyResponse(data.response);
                                      if (data.verified) {
                                        setVerified(true);
                                      } else {
                                        setVerifyError(data.response || 'Verification failed.');
                                      }
                                    } catch (err) {
                                      setVerifyError('Verification failed. Please try again.');
                                    } finally {
                                      setVerifying(false);
                                    }
                                  }}
                                >
                                  {verifying ? 'Verifying...' : verified ? 'Verified!' : 'Verify Interview'}
                                </button>
                                {verifyResponse && (
                                  <div className={`text-sm ${verified ? 'text-green-600' : 'text-gray-600'}`}>{verifyResponse}</div>
                                )}
                                {verifyError && (
                                  <div className="text-sm text-red-600">{verifyError}</div>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Only show the interview question input and Earn 1 BBT after verification */}
                          {verified && (
                            <>
                              <Input 
                                placeholder="Interview Question" 
                                value={interviewQuestion}
                                onChange={(e) => setInterviewQuestion(e.target.value)} 
                                className="max-w-md"
                              />
                              <Button
                                disabled={!interviewQuestion}
                                onClick={async () => {
                                  if (selectedCompany && interviewQuestion) {
                                    await storeInterviewQuestion(selectedCompany.name, interviewQuestion);
                                    setInterviewQuestion("");
                                    setInterviewEmailPreview(null);
                                    setVerified(false);
                                  }
                                }}
                                className="max-w-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                Earn 1 BBT
                              </Button>
                            </>
                          )}
                          {!verified && (
                            <div className="text-sm text-gray-500">Verify interview first to earn BBT.</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                {activeTab === "reviews" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-6">
                      {/* Add Review Form Collapsible */}
                      <details className="max-w-2xl mx-auto mb-6">
                        <summary className="cursor-pointer font-semibold text-lg px-6 py-4 bg-gray-100 rounded-t">Add your Review</summary>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-2">
                              <input className="border rounded px-3 py-2" placeholder="Job Title" />
                              <input className="border rounded px-3 py-2" placeholder="Location" />
                              <select className="border rounded px-3 py-2">
                                <option>Rating</option>
                                <option>5 - Excellent</option>
                                <option>4 - Good</option>
                                <option>3 - Average</option>
                                <option>2 - Poor</option>
                                <option>1 - Terrible</option>
                              </select>
                              <input className="border rounded px-3 py-2" placeholder="Review Title" />
                              <textarea className="border rounded px-3 py-2" placeholder="Pros" />
                              <textarea className="border rounded px-3 py-2" placeholder="Cons" />
                              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded cursor-not-allowed opacity-60" disabled>Submit</button>
                            </div>
                          </CardContent>
                        </Card>
                      </details>
                      {/* Review Card 1 */}
                      <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl font-bold">5.0</span>
                            <span className="text-yellow-400">★★★★★</span>
                            <span className="ml-auto text-gray-400 text-sm">May 1, 2025</span>
                          </div>
                          <div className="font-semibold text-lg mb-1">Awesome place to work</div>
                          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                            <span>Software engineer</span>
                            <span>•</span>
                            <span>Current employee, more than 1 year</span>
                            <span>•</span>
                            <span>Waterloo, ON</span>
                          </div>
                          <div className="flex gap-4 mb-2 text-green-700 text-xs">
                            <span>✔️ Recommend</span>
                            <span>✔️ CEO approval</span>
                          </div>
                          <div className="mb-1">
                            <span className="font-semibold text-green-700">Pros</span>: Good benefits, health insurance, good salary, stock options, and all the famous perks.
                          </div>
                          <div className="mb-2">
                            <span className="font-semibold text-red-700">Cons</span>: There are restrictions in terms of your publications and participation in hackathons.
                          </div>
                          <div className="flex gap-4 text-xs text-gray-400">
                            <span>Helpful</span>
                            <span>Share</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                )}
                {activeTab === "jobs" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-4 max-w-2xl mx-auto">
                      {/* Add Job Form Collapsible */}
                      <details className="mb-6">
                        <summary className="cursor-pointer font-semibold text-lg px-6 py-4 bg-gray-100 rounded-t">Add a Job Posting</summary>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-2">
                              <input className="border rounded px-3 py-2" placeholder="Job Title" />
                              <input className="border rounded px-3 py-2" placeholder="Location" />
                              <input className="border rounded px-3 py-2" placeholder="Salary or Pay (optional)" />
                              <input className="border rounded px-3 py-2" placeholder="Job Description" />
                              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded cursor-not-allowed opacity-60" disabled>Submit</button>
                            </div>
                          </CardContent>
                        </Card>
                      </details>
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold text-lg">Customer and Partner Solutions Developer, Conversational Agents</div>
                        <div className="flex items-center text-gray-500 text-sm gap-2">
                          <span>Waterloo</span>
                          <span>•</span>
                          <span>6d</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold text-lg">Software Developer III, Google Workspace</div>
                        <div className="flex items-center text-gray-500 text-sm gap-2">
                          <span>Waterloo</span>
                          <span>•</span>
                          <span>6d</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === "salaries" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="max-w-2xl mx-auto">
                      {/* Add Salary Form Collapsible */}
                      <details className="mb-6">
                        <summary className="cursor-pointer font-semibold text-lg px-6 py-4 bg-gray-100 rounded-t">Add your Salary</summary>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-2">
                              <input className="border rounded px-3 py-2" placeholder="Job Title" />
                              <input className="border rounded px-3 py-2" placeholder="Location" />
                              <input className="border rounded px-3 py-2" placeholder="Base Pay (e.g. $120,000)" />
                              <input className="border rounded px-3 py-2" placeholder="Years of Experience" />
                              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded cursor-not-allowed opacity-60" disabled>Submit</button>
                            </div>
                          </CardContent>
                        </Card>
                      </details>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-semibold">1184 job titles</span>
                        <span className="ml-auto text-sm text-gray-500">Sort by <span className="font-bold">most salaries submitted</span></span>
                      </div>
                      <div className="divide-y">
                        <div className="py-4 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Software Engineer</span>
                            <span className="text-green-700 font-bold">$110K - $150K/yr</span>
                          </div>
                          <div className="text-sm text-gray-500">688 salaries submitted • 43 open jobs</div>
                          <div className="text-xs text-green-700">base pay</div>
                        </div>
                        <div className="py-4 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Software Developer</span>
                            <span className="text-green-700 font-bold">$100K - $135K/yr</span>
                          </div>
                          <div className="text-sm text-gray-500">192 salaries submitted • 43 open jobs</div>
                          <div className="text-xs text-green-700">base pay</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === "benefits" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="max-w-2xl mx-auto">
                      {/* Add Benefits Form Collapsible */}
                      <details className="mb-6">
                        <summary className="cursor-pointer font-semibold text-lg px-6 py-4 bg-gray-100 rounded-t">Add a Benefit</summary>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-2">
                              <input className="border rounded px-3 py-2" placeholder="Benefit Category (e.g. Health, Vacation)" />
                              <input className="border rounded px-3 py-2" placeholder="Benefit Description" />
                              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded cursor-not-allowed opacity-60" disabled>Submit</button>
                            </div>
                          </CardContent>
                        </Card>
                      </details>
                      <div className="mb-4">
                        <div className="font-semibold text-lg mb-1">Reported benefits</div>
                        <div className="text-gray-500 text-sm mb-2">The following list contains benefits that have been reported by current and former employees or have been verified by the company. This list may not be complete.</div>
                      </div>
                      <div className="divide-y">
                        <details className="py-3">
                          <summary className="font-semibold cursor-pointer">Insurance, Health & Wellness</summary>
                          <ul className="ml-4 mt-2 list-disc text-sm text-gray-700">
                            <li>Health insurance</li>
                            <li>Dental insurance</li>
                            <li>Vision insurance</li>
                          </ul>
                        </details>
                        <details className="py-3">
                          <summary className="font-semibold cursor-pointer">Financial & Retirement</summary>
                          <ul className="ml-4 mt-2 list-disc text-sm text-gray-700">
                            <li>401(k) plan</li>
                            <li>Stock options</li>
                          </ul>
                        </details>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === "photos" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="max-w-3xl mx-auto">
                      {/* Add Photo Form Collapsible */}
                      <details className="mb-6">
                        <summary className="cursor-pointer font-semibold text-lg px-6 py-4 bg-gray-100 rounded-t">Add an Office Photo</summary>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-2">
                              <input className="border rounded px-3 py-2" placeholder="Photo URL" />
                              <input className="border rounded px-3 py-2" placeholder="Caption (optional)" />
                              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded cursor-not-allowed opacity-60" disabled>Submit</button>
                            </div>
                          </CardContent>
                        </Card>
                      </details>
                      <div className="font-semibold text-lg mb-4">Office Photos</div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Office 1" className="object-cover w-full h-32" /></div>
                        <div className="rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80" alt="Office 2" className="object-cover w-full h-32" /></div>
                        <div className="rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" alt="Office 3" className="object-cover w-full h-32" /></div>
                      </div>
                      <div className="mt-2 text-right text-blue-600 cursor-pointer">Add photos &rarr;</div>
                    </div>
                  </motion.div>
                )}
                {activeTab === "diversity" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-48 text-gray-500">
                      {/* Add Diversity Story Form Collapsible */}
                      <details className="mb-6">
                        <summary className="cursor-pointer font-semibold text-lg px-6 py-4 bg-gray-100 rounded-t">Share a Diversity Story</summary>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-2">
                              <input className="border rounded px-3 py-2" placeholder="Title" />
                              <textarea className="border rounded px-3 py-2" placeholder="Your Story" />
                              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded cursor-not-allowed opacity-60" disabled>Submit</button>
                            </div>
                          </CardContent>
                        </Card>
                      </details>
                      <span className="text-2xl font-semibold mb-2">Diversity & Inclusion</span>
                      <span className="mb-2">We're working on surfacing real stories and stats about diversity, equity, and inclusion at this company.</span>
                      <span className="italic text-blue-600">Coming Soon!</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 