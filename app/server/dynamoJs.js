// dynamoActions.js
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand,DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "us-west-2",
  accessKeyId: 'a',
  secretAccessKey: 'a',
  endpoint: "http://localhost:8000"
});

const docClient = DynamoDBDocumentClient.from(client);

export const fetchProducts = async (params) => {
  try {
    const command = new ScanCommand(params);
    const data = await docClient.send(command);
    return { success: true, data: data.Items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addRecommendation = async (params) => {
  const command = new PutCommand(params);
  const response = await docClient.send(command);
  return response;
};

export const getRecommendation = async (params) => {
  const command = new GetCommand(params);
  const response = await docClient.send(command);

  return response.Item || [];
};

export const deleteRecommendation = async (params) => {
  const command = new DeleteCommand(params);
  const response = await docClient.send(command);
  return response;
};

export const updateRecommendation = async (params) => {
  const command = new UpdateCommand(params);
  try {
    const response = await docClient.send(command);
    return response.Attributes;
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
};

export const getRecommendations = async (params) => {
  const command = new QueryCommand(params);
  try {
    const response = await docClient.send(command);
    return response.Items || [];
  } catch (err) {
    console.error("Error in fetching all the offers", err);
    return [];
  }
};
