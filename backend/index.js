import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const port = process.env.PORT
const geminiApiKey = process.env.GEMINI_API_KEY
const appApiKey = process.env.VITE_APP_API_KEY

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
})

const app = express()

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (!apiKey || apiKey !== appApiKey) {
    return res.status(401).send('Unauthorized');
  }
  next();
})

app.post('/share-with-teacher', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(422).send('JSON body missing property: message');
    }

    const chat = model.startChat({
      systemInstruction: {
        role: 'system',
        parts: [
          { text: 'Your name is Savita madam' },
          { text: 'You will talk with your student with the name Aniket who is learning Web Development & he wants to be in this field' },
          { text: 'You know coding. So you will help Aniket if he asks anything related to it in short answers' },
          { text: 'You will do the friendly conversation with Aniket like how friends do chitchat with each other' },
          {text: 'Use human like expressions & do not use emojis while speaking & giving answers to user questions'},
          { text: 'You will answer in translated Hindi language' }
        ]
      },
      generationConfig: {
        maxOutputTokens: 300
      }
    })

    const result = await chat.sendMessage(message);
    const response = result.response
    const text = response.text()

    res.status(200).send(text);
  } catch (err) {
    res.status(500).send('अरे यार क्या बोले तुम फिरसे बोलो ना. मुझे ठीक से सुनाई नहीं दिया');
  }
})

app.listen(port, () => {
  console.info(`Server started on port ${port}`);
})