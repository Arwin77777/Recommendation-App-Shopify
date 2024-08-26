import {
  fetchProducts,
  addRecommendation,
  getRecommendation,
  deleteRecommendation,
  updateRecommendation,
  getRecommendations
} from './dynamoJs.js';

export const fetchAllProducts = async () => {
  const params = {
    TableName: 'UpsellOffers'
  };
  return await fetchProducts(params);
};

export const createNewRecommendation = async (offerId, triggerProductIds, recommendedProductIds, isEnabled, title, priority, createdAt, updatedAt, shop,isAll) => {
  const params = {
    TableName: "UpsellOffers",
    Item: {
      myShopifyDomain: shop,
      offerId,
      triggerProductIds,
      recommendedProductIds,
      isEnabled,
      title,
      priority,
      createdAt,
      updatedAt: '',
      isAll
    },
  };
  return await addRecommendation(params);
};

export const fetchRecommendation = async (offerId, shop) => {
  const params = {
    TableName: "UpsellOffers",
    Key: { myShopifyDomain: shop, offerId }
  };
  return await getRecommendation(params);
};

export const removeRecommendation = async (offerId, shop) => {
  const params = {
    TableName: "UpsellOffers",
    Key: { myShopifyDomain: shop, offerId }
  };
  return await deleteRecommendation(params);
};

export const modifyRecommendation = async (recommendation) => {
  const { offerId, triggerProductIds, title, priority, recommendedProductIds, isEnabled, updatedAt, shop,isAll } = recommendation;

  const params = {
    TableName: "UpsellOffers",
    Key: { myShopifyDomain: shop, offerId },
    UpdateExpression: "set triggerProductIds = :triggerProductIds, title = :title, priority = :priority, recommendedProductIds = :recommendedProductIds, isEnabled = :isEnabled, updatedAt=:updatedAt ,isAll=:isAll",
    ExpressionAttributeValues: {
      ":triggerProductIds": triggerProductIds,
      ":title": title,
      ":priority": priority,
      ":recommendedProductIds": recommendedProductIds,
      ":isEnabled": isEnabled,
      ":updatedAt": updatedAt,
      ":isAll": isAll
    },
    ReturnValues: "ALL_NEW"
  };

  return await updateRecommendation(params);
};

export const fetchAllRecommendations = async (shopDomain) => {
  const params = {
    TableName: "UpsellOffers",
    KeyConditionExpression: "myShopifyDomain=:m",
    ExpressionAttributeValues: {
      ":m": { S: shopDomain }
    }
  };
  return await getRecommendations(params);
};
