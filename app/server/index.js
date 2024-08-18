import express, { response } from 'express';
import { addProduct, deleteRecommendation, getOffers, getRecommendations, updateRecommendations } from './getItems.js';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors());

const port = 3004;
app.get('/recommendation',async (req,res)=>{
    const {recommendationId} = req.query;
    console.log("Into endpoint",recommendationId)
    try{
      const resp = await getRecommendations(recommendationId);
      console.log(resp);
  
      if(resp)
        return res.status(200).json(resp);
      return res.status(500).json("Internal error");
    }
    catch(err)
    {
      console.log(err);
      return res.status(404).json(err);
    }
  })


  app.post('/recommendations',async(req,res)=>{
    console.log(req.body);
    const {recommendationId,triggerProductIds,recommendedProductIds,isEnabled,title,priority} = req.body;
    try{
      const response = await addProduct(recommendationId,triggerProductIds,recommendedProductIds,isEnabled,title,priority);
      console.log(response);
      if(response)
      return res.status(200).json({response});

      return res.status(500).json("Internal Server error");
    }
    catch(err){
      return res.status(400).json(err);
    }
  })
  
  app.put('/recommendation', async (req, res) => {
    console.log("Updating...")
    const recommendation = req.body;
    try {
      const updatedRecommendation = await updateRecommendations(recommendation);
      return res.status(200).json(updatedRecommendation);
    } catch (err) {
      console.error('Error updating recommendation:', err);
      return res.status(500).json({ error: 'Failed to update recommendation' });
    }
  });
  
  app.delete('/recommendation',async(req,res)=>{
    const {offerId} = req.query;
    console.log("Into delete endpoint",offerId);
    try{
      const del = await deleteRecommendation(offerId);
      return res.status(200).json({del});
    }
    catch(err){
      console.error('Error updating recommendation:', err);
      return res.status(500).json({ error: 'Failed to update recommendation' });
    }
  })


  app.get('/offers',async(req,res)=>{
    try{
      const response = await getOffers();
      return res.status(200).json(response);
    }
    catch(err){
      console.error('Error fetching offers:', err);
      return res.status(500).json({ error: 'Failed to fetch offers' });
    }
  })


 

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })