import { useSuiClient } from "@suiet/wallet-kit";

const interviewHistoryId = "0x7161f859be09964d637724322ab9c9f48f64d35ed30a3a676bd3f44941be100e";

export interface InterviewQuestion {
  company_name: string;
  interview_question: string;
  timestamp: string;
  user_address: string;
}

export async function getInterviewQuestions(client: ReturnType<typeof useSuiClient>): Promise<InterviewQuestion[]> {
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
      return interviews.map(interview => ({
        company_name: interview.fields.company_name,
        interview_question: interview.fields.interview_question,
        timestamp: interview.fields.timestamp,
        user_address: interview.fields.user_address,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching interview questions:", error);
    return [];
  }
} 