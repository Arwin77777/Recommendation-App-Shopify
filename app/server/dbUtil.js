import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";




const client = new DynamoDBClient({
  region: "us-west-2",
  accessKeyId: 'a',
  secretAccessKey: 'a',
  endpoint: "http://localhost:8000"
});

const docClient = DynamoDBDocumentClient.from(client);

export const fetchProducts = async () => {
  const params = {
    TableName: 'UpsellOffers'
  };

  try {
    const command = new ScanCommand(params);
    const data = await docClient.send(command);
    return { success: true, data: data.Items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addRecommendation = async (offerId, triggerProductIds, recommendedProductIds, isEnabled, title, priority, createdAt, updatedAt, shop) => {

  const command = new PutCommand({
    TableName: "UpsellOffers",
    Item: {
      myShopifyDomain: shop,
      offerId: offerId,
      triggerProductIds: triggerProductIds,
      recommendedProductIds: recommendedProductIds,
      isEnabled: isEnabled,
      title: title,
      priority: priority,
      createdAt: createdAt,
      updatedAt: ''
    },
  });

  // 
  const response = await docClient.send(command);
  return response;
};

export const getRecommendation = async (offerId, shop) => {

  const command = new GetCommand({
    TableName: "UpsellOffers",
    Key: { myShopifyDomain: shop, offerId },
  });

  const response = await docClient.send(command);

  if (response.Item) {
    return response.Item;
  }
  return [];
};


export async function deleteRecommendation(offerId, shop) {

  const command = new DeleteCommand({
    TableName: "UpsellOffers",
    Key: { myShopifyDomain: shop, offerId },
  });
  const response = await docClient.send(command);
  return response;
}


export const updateRecommendation = async (recommendation) => {
  const { offerId, triggerProductIds, title, priority, recommendedProductIds, isEnabled, updatedAt, shop } = recommendation;


  const command = new UpdateCommand({
    TableName: "UpsellOffers",
    Key: { myShopifyDomain: shop, offerId },
    UpdateExpression: "set triggerProductIds = :triggerProductIds, title = :title, priority = :priority, recommendedProductIds = :recommendedProductIds, isEnabled = :isEnabled,updatedAt=:updatedAt",
    ExpressionAttributeValues: {
      ":triggerProductIds": triggerProductIds,
      ":title": title,
      ":priority": priority,
      ":recommendedProductIds": recommendedProductIds,
      ":isEnabled": isEnabled,
      ":updatedAt": updatedAt
    },
    ReturnValues: "ALL_NEW"
  });

  try {
    const response = await docClient.send(command);

    return response.Attributes;
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
};

export const getRecommendations = async () => {
  const command = new QueryCommand({
    TableName: "UpsellOffers",
    KeyConditionExpression: "myShopifyDomain=:m",
    ExpressionAttributeValues: {
      ":m": { S: "arwin-lb.myshopify.com" }
    }
  });

  try {

    const response = await docClient.send(command);

    if (response.Items) {
      return response.Items;
    } else {

      return [];
    }
  } catch (err) {
    console.error("Error in fetching all the offers", err);
    return [];
  }
};
