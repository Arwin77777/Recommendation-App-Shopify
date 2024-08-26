import express from 'express';
import { createNewRecommendation, removeRecommendation, fetchRecommendation, fetchAllRecommendations, modifyRecommendation } from './dbUtil.js'
import cors from 'cors';
import moment from 'moment';
const app = express();
app.use(express.json());
app.use(cors());

const port = 3004;

app.get('/recommendations', async (req, res) => {
  try {
    console.log("Within recommendations");
    const {shop} = req.query;
    const domain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    console.log("shop",domain);
    const response = await fetchAllRecommendations(domain);
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching recommendations:', err);
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET a specific recommendation
app.get('/recommendation', async (req, res) => {
  const { recommendationId, shop } = req.query;

  if (!recommendationId) {
    return res.status(400).json({ error: 'RecommendationId is required' });
  }

  try {
    const resp = await fetchRecommendation(recommendationId, shop);
    if (resp) {
      return res.status(200).json(resp);
    } else {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
  } catch (err) {
    console.error('Error fetching recommendation:', err);
    return res.status(500).json({ error: 'Failed to fetch recommendation' });
  }
});

// POST a new recommendation
app.post('/recommendation', async (req, res) => {
  const { offerId, triggerProductIds, recommendedProductIds, isEnabled, title, priority, shop,isAll } = req.body;

  if (!offerId || !triggerProductIds || !recommendedProductIds || typeof isEnabled === 'undefined' || !title || typeof priority === 'undefined' || !shop) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const createdAt = moment().unix();
    const updatedAt = '';
    const response = await createNewRecommendation(offerId, triggerProductIds, recommendedProductIds, isEnabled, title, priority, createdAt, updatedAt, shop,isAll);

    if (response) {
      console.log(response);
      return res.status(201).json({ message: 'Recommendation created successfully', data: response });
    } else {
      return res.status(500).json({ error: 'Failed to create recommendation' });
    }
  } catch (err) {
    console.error('Error creating recommendation:', err);
    return res.status(500).json({ error: 'Failed to create recommendation' });
  }
});

// PUT (update) an existing recommendation
app.put('/recommendation', async (req, res) => {
  const recommendation = req.body;

  if (!recommendation || !recommendation.offerId || !recommendation.triggerProductIds || !recommendation.recommendedProductIds || typeof recommendation.isEnabled === 'undefined' || !recommendation.title || typeof recommendation.priority === 'undefined' || !recommendation.shop) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    recommendation.updatedAt = moment().unix();
    const updatedRecommendation = await modifyRecommendation(recommendation);

    if (updatedRecommendation) {
      return res.status(200).json({ message: 'Recommendation updated successfully', data: updatedRecommendation });
    } else {
      return res.status(500).json({ error: 'Failed to update recommendation' });
    }
  } catch (err) {
    console.error('Error updating recommendation:', err);
    return res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

// DELETE a recommendation
app.delete('/recommendation', async (req, res) => {
  const { offerId, shop } = req.query;

  if (!offerId || !shop) {
    return res.status(400).json({ error: 'OfferId and shop are required' });
  }

  try {
    const deleted = await removeRecommendation(offerId, shop);

    if (deleted) {
      return res.status(200).json({ message: 'Recommendation deleted successfully', data: deleted });
    } else {
      return res.status(500).json({ error: 'Failed to delete recommendation' });
    }
  } catch (err) {
    console.error('Error deleting recommendation:', err);
    return res.status(500).json({ error: 'Failed to delete recommendation' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log("App is listening in the port",port)
})