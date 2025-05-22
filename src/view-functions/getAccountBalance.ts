import { SuiClient } from "@mysten/sui.js/client";

const packageId = "0x0e84cadb0461d99b4fdfc7e1c70f51d9cd69b39e2f8ca92ca40dbc018604cfe4";
const rewardBalanceId = "0x2284833c38e25d112b87141876a5636df17c28174c9321475edb2e2041e70ffb";

export async function getAccountBBTBalance({ accountAddress }: { accountAddress: string }) {
  const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" });
  
  try {
    const result = await client.getObject({
      id: rewardBalanceId,
      options: {
        showContent: true,
      },
    });

    if (result.data?.content?.dataType === "moveObject") {
      const content = result.data.content as any;
      const balances = content.fields.balances as any[];
      const userBalance = balances.find(b => b.fields.key === accountAddress);
      return userBalance ? Number(userBalance.fields.value) : 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching BBT balance:", error);
    return 0;
  }
} 