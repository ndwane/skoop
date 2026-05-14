const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

const RAPID_API_KEY = 'ae797cb768msh2307aedcbc3f711p182834jsn16417a8a0cb7';
const genAI = new GoogleGenerativeAI('AIzaSyAooCPLFPAuWYkGM5F0Z5e--PmYdxkgJbs');

const cityMap = {
  'Dubai': 'Dubai',
  'Abu Dhabi': 'Abu Dhabi',
  'Sharjah': 'Sharjah',
  'Ajman': 'Ajman',
  'Ras Al Khaimah': 'Ras Al Khaimah',
  'Fujairah': 'Fujairah',
  'Umm Al Quwain': 'Umm Al Quwain',
};

async function evaluatePrice(carName, price) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      'Car: ' + carName + ', Price: ' + price + ' AED. cheap or reasonable or expensive? one word only in Arabic.'
    );
    return result.response.text().trim();
  } catch (error) {
    return 'معقول';
  }
}

app.get('/search', async (req, res) => {
  const { q, minPrice, maxPrice, city, yearFrom, yearTo, kmFrom, kmTo } = req.query;
  try {
    const response = await axios.post(
      'https://dubizzle-api.p.rapidapi.com/scrapers/api/dubizzle/product/listing-by-url',
      { url: 'https://uae.dubizzle.com/motors/used-cars/?q=' + encodeURIComponent(q) },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'dubizzle-api.p.rapidapi.com',
          'x-rapidapi-key': RAPID_API_KEY
        },
        timeout: 60000
      }
    );

    let cars = response.data.data.map(car => {
      const nameText = car.name?.en || '';
      const yearMatch = nameText.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;
      return {
        name: nameText,
        price: car.price,
        city: car.city || '',
        year: year,
        km: car.kilometers || car.mileage || null,
        color: car.color || '',
        link: car.absolute_url?.en,
        image: car.photos?.thumb,
        evaluation: null,
      };
    });

    if (minPrice) cars = cars.filter(c => c.price >= parseInt(minPrice));
    if (maxPrice) cars = cars.filter(c => c.price <= parseInt(maxPrice));
    if (city) {
      cars = cars.filter(c => c.city?.toLowerCase().includes(city.toLowerCase()));
    }
    if (yearFrom) cars = cars.filter(c => c.year && c.year >= parseInt(yearFrom));
    if (yearTo) cars = cars.filter(c => c.year && c.year <= parseInt(yearTo));
    if (kmFrom) cars = cars.filter(c => c.km && c.km >= parseInt(kmFrom));
    if (kmTo) cars = cars.filter(c => c.km && c.km <= parseInt(kmTo));

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
  console.log('Skoop API running on port ' + PORT + ' 🚀');
});