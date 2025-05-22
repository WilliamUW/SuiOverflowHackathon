import { AlertCircle, BookOpen, Building2, Crown, FileText, GraduationCap, Loader2, MessageSquare, Sparkles, UserCheck, Users, Users2, Video } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useSuiClient, useWallet } from "@suiet/wallet-kit";

import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { getAccountBBTBalance } from "../view-functions/getAccountBalance";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  gradient: string;
  category: "learning" | "mentorship";
}

const rewards: Reward[] = [
  // Learning & Prep Rewards
  {
    id: "premium",
    title: "BehavioralBuddy Premium",
    description: "Unlock unlimited AI-generated answers, company-specific insights, tone/style variations, and more.",
    cost: 100,
    icon: <Crown className="h-8 w-8" />,
    gradient: "from-yellow-400 to-yellow-600",
    category: "learning",
  },
  {
    id: "mock-interviews",
    title: "Mock Interviews",
    description: "Redeem BBT for live mock interviews with mentors or AI avatars (video/chat).",
    cost: 50,
    icon: <Video className="h-8 w-8" />,
    gradient: "from-blue-400 to-blue-600",
    category: "learning",
  },
  {
    id: "question-packs",
    title: "Question Packs",
    description: "Access premium packs of real interview questions (sorted by company, role, difficulty).",
    cost: 30,
    icon: <BookOpen className="h-8 w-8" />,
    gradient: "from-green-400 to-green-600",
    category: "learning",
  },
  {
    id: "feedback",
    title: "Personalized Feedback",
    description: "Upload your answer and get feedback from AI or vetted reviewers.",
    cost: 25,
    icon: <MessageSquare className="h-8 w-8" />,
    gradient: "from-purple-400 to-purple-600",
    category: "learning",
  },
  {
    id: "company-guides",
    title: "Company Guides",
    description: "Redeem for detailed prep guides per company based on crowdsourced data.",
    cost: 40,
    icon: <Building2 className="h-8 w-8" />,
    gradient: "from-red-400 to-red-600",
    category: "learning",
  },
  // Mentorship & Community Rewards
  {
    id: "mentorship-call",
    title: "1:1 Mentorship Call",
    description: "Book a call with experienced engineers, PMs, recruiters for personalized guidance.",
    cost: 75,
    icon: <UserCheck className="h-8 w-8" />,
    gradient: "from-indigo-400 to-indigo-600",
    category: "mentorship",
  },
  {
    id: "group-coaching",
    title: "Group Coaching Session",
    description: "Join token-gated group prep workshops or AMA sessions with industry experts.",
    cost: 35,
    icon: <Users2 className="h-8 w-8" />,
    gradient: "from-pink-400 to-pink-600",
    category: "mentorship",
  },
  {
    id: "resume-review",
    title: "Resume/LinkedIn Review",
    description: "Get your resume and LinkedIn profile polished by experienced recruiters.",
    cost: 45,
    icon: <FileText className="h-8 w-8" />,
    gradient: "from-teal-400 to-teal-600",
    category: "mentorship",
  },
];

export function Rewards() {
  const wallet = useWallet();
  const client = useSuiClient();

  const { data: bbtBalance, refetch } = useQuery({
    queryKey: ["bbt-balance", wallet.address],
    queryFn: async () => {
      if (!wallet.address) return 0;
      return getAccountBBTBalance(client, wallet.address);
    },
    enabled: !!wallet.address,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const handleRedeem = (reward: Reward) => {
    if (!bbtBalance || bbtBalance < reward.cost) {
      toast.error("Insufficient BBT balance");
      return;
    }
    // TODO: Implement redemption logic
    toast.success(`Successfully redeemed ${reward.title}!`);
  };

  const learningRewards = rewards.filter(reward => reward.category === "learning");
  const mentorshipRewards = rewards.filter(reward => reward.category === "mentorship");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container max-w-screen-lg mx-auto px-4 py-12"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12 text-center"
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Rewards Center
        </h1>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="inline-block"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-full shadow-lg">
            <span className="font-medium text-lg">BBT Balance: {bbtBalance || 0}</span>
          </div>
        </motion.div>
      </motion.div>

      <div className="space-y-16">
        {/* Learning & Prep Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🎓 Learning & Prep Rewards
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {learningRewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`bg-gradient-to-r ${reward.gradient} p-4 rounded-xl text-white shadow-lg`}
                      >
                        {reward.icon}
                      </motion.div>
                      <div>
                        <CardTitle className="text-xl">{reward.title}</CardTitle>
                        <CardDescription className="text-lg font-medium text-yellow-600">
                          {reward.cost} BBT
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-lg">{reward.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={cn(
                        "w-full h-12 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200",
                        !bbtBalance || bbtBalance < reward.cost
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white"
                      )}
                      onClick={() => handleRedeem(reward)}
                      disabled={!bbtBalance || bbtBalance < reward.cost}
                    >
                      {!bbtBalance || bbtBalance < reward.cost ? (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          <span>Insufficient BBT</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          <span>Redeem</span>
                        </div>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Mentorship & Community Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🤝 Mentorship & Community
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mentorshipRewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`bg-gradient-to-r ${reward.gradient} p-4 rounded-xl text-white shadow-lg`}
                      >
                        {reward.icon}
                      </motion.div>
                      <div>
                        <CardTitle className="text-xl">{reward.title}</CardTitle>
                        <CardDescription className="text-lg font-medium text-yellow-600">
                          {reward.cost} BBT
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-lg">{reward.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={cn(
                        "w-full h-12 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200",
                        !bbtBalance || bbtBalance < reward.cost
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white"
                      )}
                      onClick={() => handleRedeem(reward)}
                      disabled={!bbtBalance || bbtBalance < reward.cost}
                    >
                      {!bbtBalance || bbtBalance < reward.cost ? (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          <span>Insufficient BBT</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          <span>Redeem</span>
                        </div>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
} 