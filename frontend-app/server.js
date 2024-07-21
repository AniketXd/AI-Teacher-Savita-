import express from 'express';
const app = express();

app.use(express.json());

app.post('/share-with-teacher', (req, res) => {
  // Handle the request here
  const { message } = req.body;
  console.log(`Received message: ${message}`);

  // Return a response
  res.json({ response: 'Message received successfully' });
});

app.listen(3001, () => {
  console.log('Server started on port 3000');
});