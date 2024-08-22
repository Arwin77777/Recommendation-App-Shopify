import express, { response } from 'express';
import { addRecommendation, deleteRecommendation, getRecommendation, getRecommendations, updateRecommendation } from './dbUtil.js'
import cors from 'cors';
import moment from 'moment';
const app = express();
app.use(express.json());
app.use(cors());

const port = 3004;

app.get('/recommendation', async (req, res) => {
  const { recommendationId, shop } = req.query;

  try {
    const resp = await getRecommendation(recommendationId, shop);


    if (resp)
      return res.status(200).json(resp);
    return res.status(500).json("Internal error");
  }
  catch (err) {

    return res.status(404).json(err);
  }
})


app.post('/recommendation', async (req, res) => {

  const { offerId, triggerProductIds, recommendedProductIds, isEnabled, title, priority, shop } = req.body;
  try {
    const createdAt = moment().unix();
    const updatedAt = '';
    const response = await addRecommendation(offerId, triggerProductIds, recommendedProductIds, isEnabled, title, priority, createdAt, updatedAt, shop);

    if (response)
      return res.status(200).json({ response });

    return res.status(500).json("Internal Server error");
  }
  catch (err) {
    return res.status(400).json(err);
  }
})

app.put('/recommendation', async (req, res) => {

  const recommendation = req.body;
  recommendation.updatedAt = moment().unix();
  try {
    const updatedRecommendation = await updateRecommendation(recommendation);
    return res.status(200).json(updatedRecommendation);
  } catch (err) {
    console.error('Error updating recommendation:', err);
    return res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

app.delete('/recommendation', async (req, res) => {
  const { offerId, shop } = req.query;

  try {
    const del = await deleteRecommendation(offerId, shop);
    return res.status(200).json({ del });
  }
  catch (err) {
    console.error('Error updating recommendation:', err);
    return res.status(500).json({ error: 'Failed to update recommendation' });
  }
})


app.get('/recommendations', async (req, res) => {
  try {
    const response = await getRecommendations();
    return res.status(200).json(response);
  }
  catch (err) {
    console.error('Error fetching offers:', err);
    return res.status(500).json({ error: 'Failed to fetch offers' });
  }
})




app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {

})