const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

const RAPID_API_KEY = 'ae797cb768msh2307aedcbc3f711p182834jsn16417a8a0cb7';
const genAI = new GoogleGenerativeAI('AIzaSyAooCPLFPAuWYkGM5F0Z5e--PmYdxkgJbs');

async function evaluatePrice(carName, price) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      'سيارة: ' + carName + ', السعر: ' + price + ' درهم. رخيص أو معقول أو غالي؟ كلمة واحدة فقط.'
    );
    return result.response.text().trim();
  } catch (error) {
    return 'معقول';
  }
}

app.get('/search', async (req, res) => {
  const query = req.query.q;
  
  try {
    const response = await axios.post('https://dubizzle-api.p.rapidapi.com/scrapers/api/dubizzle/product/listing-by-url', {
      url: 'https://uae.dubizzle.com/motors/used-cars/?q=' + encodeURIComponent(query)
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'dubizzle-api.p.rapidapi.com',
        'x-rapidapi-key': RAPID_API_KEY
      },
      timeout: 60000
    });

    const cars = response.data.data.map(car => ({
      name: car.name?.en,
      price: car.price,
      city: car.site?.en,
      link: car.absolute_url?.en,
      image: car.photos?.thumb,
      evaluation: null
    }));

    res.json(cars);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/evaluate', async (req, res) => {
  const { name, price } = req.query;
  const evaluation = await evaluatePrice(name, price);
  res.json({ evaluation });
});

app.listen(PORT, () => {
  console.log('سكوب API شغّال على المنفذ ' + PORT + ' 🚀');
});