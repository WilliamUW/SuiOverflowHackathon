import { rewardBalanceId } from "../config";
import { useSuiClient } from "@suiet/wallet-kit";

export async function getAccountBBTBalance(client: ReturnType<typeof useSuiClient>, address: string): Promise<number> {
  if (!address) return 0;
  
  try {
    const result = await client.getObject({
      id: rewardBalanceId,
      options: {
        showContent: true,
      },
    });

    if (result.data?.content?.dataType === "moveObject") {
      const content = result.data.content as any;
      const balances = content.fields.balances;
      
      if (!balances || !balances.fields) {
        console.log("No balances field found");
        return 0;
      }

      // Get the table ID
      const tableId = balances.fields.id.id;
      
      // Get the dynamic fields of the table
      const dynamicFields = await client.getDynamicFields({
        parentId: tableId,
      });

      console.log("Dynamic fields:", dynamicFields);

      // Find the field for the user's address
      const userField = dynamicFields.data.find(
        field => field.name.value === address || field.name.value === address.toLowerCase()
      );

      if (userField) {
        // Get the actual balance value
        const balanceObject = await client.getObject({
          id: userField.objectId,
          options: {
            showContent: true,
          },
        });

        console.log("Balance object:", balanceObject);

        if (balanceObject.data?.content?.dataType === "moveObject") {
          const balanceContent = balanceObject.data.content as any;
          return Number(balanceContent.fields.value);
        }
      }

      console.log("No balance found for address:", address);
      return 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching BBT balance:", error);
    return 0;
  }
} 