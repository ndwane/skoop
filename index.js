const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

const RAPID_API_KEY = 'ae797cb768msh2307aedcbc3f711p182834jsn16417a8a0cb7';
const genAI = new GoogleGenerativeAI('AIzaSyAooCPLFPAuWYkGM5F0Z5e--PmYdxkgJbs');

const cityMap = {
  'دبي': 'dubai',
  'أبوظبي': 'abu-dhabi',
  'الشارقة': 'sharjah',
  'عجمان': 'ajman',
  'رأس الخيمة': 'ras-al-khaimah',
  'الفجيرة': 'fujairah',
  'أم القيوين': 'umm-al-quwain',
};

const carNameMap = {
  'نيسان': 'nissan',
  'تويوتا': 'toyota',
  'هوندا': 'honda',
  'مرسيدس': 'mercedes',
  'بي ام دبليو': 'bmw',
  'لكزس': 'lexus',
  'كيا': 'kia',
  'هيونداي': 'hyundai',
  'فورد': 'ford',
  'شيفروليه': 'chevrolet',
  'جيب': 'jeep',
  'رنج روفر': 'range rover',
  'لاند روفر': 'land rover',
  'بورش': 'porsche',
  'اودي': 'audi',
  'فولكس': 'volkswagen',
  'ميتسوبيشي': 'mitsubishi',
  'سوزوكي': 'suzuki',
  'مازدا': 'mazda',
  'انفينيتي': 'infiniti',
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

  if (!q) return res.json([]);

  try {
    // بناء الـ URL مع المدينة
    const engCity = city ? cityMap[city] : null;
    let searchUrl = 'https://uae.dubizzle.com/motors/used-cars/';
    if (engCity) {
      searchUrl += engCity + '/';
    }
    searchUrl += '?q=' + encodeURIComponent(carNameMap[q] || q);

    const response = await axios.post(
      'https://dubizzle-api.p.rapidapi.com/scrapers/api/dubizzle/product/listing-by-url',
      { url: searchUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'dubizzle-api.p.rapidapi.com',
          'x-rapidapi-key': RAPID_API_KEY
        },
        timeout: 30000
      }
    );

    const rawData = response.data?.data || response.data || [];

    let cars = rawData.map(car => {
      const nameText = car.name?.en || car.name || '';
      const yearMatch = nameText.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;
      return {
        name: nameText,
        price: car.price || 0,
        city: car.city || car.site?.en || '',
        year: year,
        km: car.kilometers || car.mileage || null,
        color: car.color || '',
        link: car.absolute_url?.en || car.absolute_url || '',
        image: car.photos?.thumb || '',
        evaluation: null,
      };
    });

    // فلتر الاسم
    const engName = carNameMap[q] || q.toLowerCase();
    cars = cars.filter(c => {
      const nameLower = c.name?.toLowerCase() || '';
      return nameLower.includes(q.toLowerCase()) || nameLower.includes(engName);
    });

    if (minPrice) cars = cars.filter(c => c.price >= parseInt(minPrice));
    if (maxPrice) cars = cars.filter(c => c.price <= parseInt(maxPrice));
    if (yearFrom) cars = cars.filter(c => c.year && c.year >= parseInt(yearFrom));
    if (yearTo) cars = cars.filter(c => c.year && c.year <= parseInt(yearTo));
    if (kmFrom) cars = cars.filter(c => c.km && c.km >= parseInt(kmFrom));
    if (kmTo) cars = cars.filter(c => c.km && c.km <= parseInt(kmTo));

    res.json(cars);
  } catch (error) {
    console.log('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/evaluate', async (req, res) => {
  try {
    const { name, price } = req.query;
    const evaluation = await evaluatePrice(name, price);
    res.json({ evaluation });
  } catch (error) {
    res.json({ evaluation: 'معقول' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Skoop API is running 🚀' });
});

app.listen(PORT, () => {
  console.log('Skoop API running on port ' + PORT + ' 🚀');
});