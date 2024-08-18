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
    TableName: 'ShopifyProducts'
  };

  try {
    const command = new ScanCommand(params);
    const data = await docClient.send(command);
    return { success: true, data: data.Items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addProduct = async (recommendationId,triggerProductIds,recommendedProductIds,isEnabled,title,priority) => {
  const command = new PutCommand({
    TableName: "ShopifyProducts",
    Item: {
      myShopifyDomain:"https://arwin-lb.myshopify.com/",
      offerId:recommendationId,
      triggerProductIds: triggerProductIds,
      recommendedProductIds:recommendedProductIds,
      isEnabled:isEnabled,
      title:title,
      priority:priority
    },
  });
  
  const response = await docClient.send(command);
  console.log("Into function");
  return response;
};

export const getRecommendations = async (offerId) => {
  console.log("into function ",offerId);
  const command = new GetCommand({
    TableName: "ShopifyProducts",
    Key: { myShopifyDomain:"https://arwin-lb.myshopify.com/",offerId },
  });

  const response = await docClient.send(command);
  // console.log(response.Item.recommendedProducts);
  if (response.Item) {
    return response.Item;
  }
  return [];
};


export async function deleteRecommendation(offerId) {
  console.log("Into delete function",offerId);
  const command = new DeleteCommand({
    TableName: "ShopifyProducts",
    Key: { myShopifyDomain:"https://arwin-lb.myshopify.com/",offerId },
  });
  const response = await docClient.send(command);
  return response;
}


export const updateRecommendations = async (recommendation) => {
  const { offerId, triggerProductIds, title, priority, recommendedProductIds, isEnabled } = recommendation;
  console.log("----------->",offerId, triggerProductIds, title, priority, recommendedProductIds, isEnabled)

  const command = new UpdateCommand({
    TableName: "ShopifyProducts",
    Key: { myShopifyDomain:"https://arwin-lb.myshopify.com/",offerId },
    UpdateExpression: "set triggerProductIds = :triggerProductIds, title = :title, priority = :priority, recommendedProductIds = :recommendedProductIds, isEnabled = :isEnabled",
    ExpressionAttributeValues: {
      ":triggerProductIds": triggerProductIds,
      ":title": title,
      ":priority": priority,
      ":recommendedProductIds": recommendedProductIds,
      ":isEnabled": isEnabled,
    },
    ReturnValues: "ALL_NEW"
  });

  try {
    const response = await docClient.send(command);
    console.log('Update successful:', response);
    return response.Attributes;
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
};

export const getOffers = async () => {
  const command = new QueryCommand({
    TableName: "ShopifyProducts",
    KeyConditionExpression: "myShopifyDomain=:m",
    ExpressionAttributeValues: {
      ":m":{S:"https://arwin-lb.myshopify.com/"}
    }
  });

  try {
    console.log("In try block");
    const response = await docClient.send(command);
    console.log("Response of getOffers",response);
    if (response.Items) {
      return response.Items; 
    } else {
      console.log('No items found');
      return [];
    }
  } catch (err) {
    console.error("Error in fetching all the offers", err);
    return [];
  }
};
