import { BookOpen, Building2, Crown, FileText, GraduationCap, MessageSquare, UserCheck, Users, Users2, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useSuiClient, useWallet } from "@suiet/wallet-kit";

import { Button } from "./ui/button";
import { getAccountBBTBalance } from "../view-functions/getAccountBalance";
import { motion } from "framer-motion";
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

const packageId = "0x0e84cadb0461d99b4fdfc7e1c70f51d9cd69b39e2f8ca92ca40dbc018604cfe4";
const rewardBalanceId = "0x2284833c38e25d112b87141876a5636df17c28174c9321475edb2e2041e70ffb";

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
    <div className="container max-w-screen-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Rewards Center</h1>
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full">
            <span className="font-medium">BBT Balance: {bbtBalance || 0}</span>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* Learning & Prep Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">🎓 Learning & Prep Rewards</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningRewards.map((reward) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`bg-gradient-to-r ${reward.gradient} p-3 rounded-lg text-white`}>
                        {reward.icon}
                      </div>
                      <div>
                        <CardTitle>{reward.title}</CardTitle>
                        <CardDescription>{reward.cost} BBT</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{reward.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700"
                      onClick={() => handleRedeem(reward)}
                      disabled={!bbtBalance || bbtBalance < reward.cost}
                    >
                      {!bbtBalance || bbtBalance < reward.cost ? "Insufficient BBT" : "Redeem"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mentorship & Community Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-semibold">🤝 Mentorship & Community</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mentorshipRewards.map((reward) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`bg-gradient-to-r ${reward.gradient} p-3 rounded-lg text-white`}>
                        {reward.icon}
                      </div>
                      <div>
                        <CardTitle>{reward.title}</CardTitle>
                        <CardDescription>{reward.cost} BBT</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{reward.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700"
                      onClick={() => handleRedeem(reward)}
                      disabled={!bbtBalance || bbtBalance < reward.cost}
                    >
                      {!bbtBalance || bbtBalance < reward.cost ? "Insufficient BBT" : "Redeem"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 