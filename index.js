require('dotenv').config();
const express = require('express');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

const RAPID_API_KEY = 'ae797cb768msh2307aedcbc3f711p182834jsn16417a8a0cb7';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const cityMap = {
  'دبي': 'dubai',
  'أبوظبي': 'abudhabi',
  'الشارقة': 'sharjah',
  'عجمان': 'ajman',
  'رأس الخيمة': 'rak',
  'الفجيرة': 'fujairah',
  'أم القيوين': 'uaq',
  'العين': 'alain',
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
  console.log(`[evaluate] carName=${carName} price=${price} apiKeySet=${!!process.env.ANTHROPIC_API_KEY}`);
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `أنت خبير سيارات في الإمارات. حلل هذه السيارة:
السيارة: ${carName}
السعر: ${price} درهم

أعطني تحليل قصير جداً (جملة واحدة أو جملتين) يشمل:
- هل السعر رخيص أو معقول أو غالي مقارنة بالسوق
- سبب واحد للشراء أو التحذير

الرد بالعربي فقط، قصير ومباشر.`
      }
    ]
  });
  return message.content[0].text.trim();
}

app.get('/search', async (req, res) => {
  const { q, minPrice, maxPrice, city, yearFrom, yearTo, kmFrom, kmTo } = req.query;

  if (!q) return res.json([]);

  try {
    const searchKeyword = carNameMap[q] || q;
    const locationParam = city ? (cityMap[city] || 'uae') : 'uae';

    console.log(`[search] keyword=${searchKeyword} location=${locationParam}`);

    const response = await axios.get(
      'https://dubizzle-api.p.rapidapi.com/scrapers/api/dubizzle/product/search',
      {
        params: {
          keyword: searchKeyword,
          sort_by: 'relevance',
          page: '1',
          location: locationParam
        },
        headers: {
          'x-rapidapi-host': 'dubizzle-api.p.rapidapi.com',
          'x-rapidapi-key': RAPID_API_KEY
        },
        timeout: 30000
      }
    );

    console.log('API Response keys:', Object.keys(response.data || {}));
    console.log('API Response sample:', JSON.stringify(response.data).substring(0, 500));

    const rawData = response.data?.data || response.data?.results || response.data || [];

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

    // فلتر سيارات للبيع فقط
    const excludeWords = ['rent', 'hire', 'service', 'transport', 'delivery', 'driver', 'movers', 'shifting', 'available for'];
    cars = cars.filter(c => {
      const nameLower = c.name?.toLowerCase() || '';
      return c.price > 0 && !excludeWords.some(word => nameLower.includes(word));
    });

    if (minPrice) cars = cars.filter(c => c.price >= parseInt(minPrice));
    if (maxPrice) cars = cars.filter(c => c.price <= parseInt(maxPrice));
    if (yearFrom) cars = cars.filter(c => c.year && c.year >= parseInt(yearFrom));
    if (yearTo) cars = cars.filter(c => c.year && c.year <= parseInt(yearTo));
    if (kmFrom) cars = cars.filter(c => c.km && c.km >= parseInt(kmFrom));
    if (kmTo) cars = cars.filter(c => c.km && c.km <= parseInt(kmTo));

    console.log(`[search] found ${cars.length} cars`);
    res.json(cars);
  } catch (error) {
    console.log('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/evaluate', async (req, res) => {
  const { name, price } = req.query;
  try {
    const evaluation = await evaluatePrice(name, price);
    res.json({ evaluation });
  } catch (error) {
    console.error('[evaluate] Claude API error:', error.status, error.message, error.error);
    res.status(500).json({ error: error.message, evaluation: 'سعر معقول للسوق الإماراتي' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Skoop API is running 🚀' });
});

app.listen(PORT, () => {
  console.log('Skoop API running on port ' + PORT + ' 🚀');
});