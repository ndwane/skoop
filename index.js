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

const cityDomainMap = {
  'دبي': 'dubai', 'Dubai': 'dubai',
  'أبوظبي': 'abudhabi', 'Abu Dhabi': 'abudhabi',
  'الشارقة': 'sharjah', 'Sharjah': 'sharjah',
  'عجمان': 'ajman', 'Ajman': 'ajman',
  'رأس الخيمة': 'ras-al-khaimah', 'Ras Al Khaimah': 'ras-al-khaimah',
  'الفجيرة': 'fujairah', 'Fujairah': 'fujairah',
  'أم القيوين': 'umm-al-quwain', 'Umm Al Quwain': 'umm-al-quwain',
  'العين': 'al-ain', 'Al Ain': 'al-ain',
};

const carNameMap = {
  'نيسان': 'nissan', 'تويوتا': 'toyota', 'هوندا': 'honda',
  'مرسيدس': 'mercedes', 'بي ام دبليو': 'bmw', 'لكزس': 'lexus',
  'كيا': 'kia', 'هيونداي': 'hyundai', 'فورد': 'ford',
  'شيفروليه': 'chevrolet', 'جيب': 'jeep', 'رنج روفر': 'range rover',
  'لاند روفر': 'land rover', 'بورش': 'porsche', 'اودي': 'audi',
  'فولكس': 'volkswagen', 'ميتسوبيشي': 'mitsubishi', 'سوزوكي': 'suzuki',
  'مازدا': 'mazda', 'انفينيتي': 'infiniti',
};

async function evaluatePrice(carName, price) {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `أنت خبير سيارات في الإمارات. حلل هذه السيارة:
السيارة: ${carName}
السعر: ${price} درهم

أعطني تحليل قصير جداً (جملة واحدة أو جملتين) يشمل:
- هل السعر رخيص أو معقول أو غالي مقارنة بالسوق
- سبب واحد للشراء أو التحذير

الرد بالعربي فقط، قصير ومباشر.`
    }]
  });
  return message.content[0].text.trim();
}

async function fetchPage(url) {
  try {
    const response = await axios.post(
      'https://dubizzle-api.p.rapidapi.com/scrapers/api/dubizzle/product/listing-by-url',
      { url },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'dubizzle-api.p.rapidapi.com',
          'x-rapidapi-key': RAPID_API_KEY
        },
        timeout: 30000
      }
    );
    return response.data?.data || response.data?.results || response.data || [];
  } catch (e) {
    console.log('Page fetch error:', e.message);
    return [];
  }
}

app.get('/search', async (req, res) => {
  const { q, minPrice, maxPrice, city, yearFrom, yearTo, kmFrom, kmTo } = req.query;
  if (!q) return res.json([]);

  try {
    const searchKeyword = carNameMap[q] || q;
    const cityDomain = city ? (cityDomainMap[city] || 'dubai') : 'dubai';
    const baseUrl = `https://${cityDomain}.dubizzle.com/motors/used-cars/?q=${encodeURIComponent(searchKeyword)}`;

    console.log(`[search] keyword=${searchKeyword} city=${cityDomain}`);

    const [page1, page2, page3] = await Promise.all([
      fetchPage(baseUrl),
      fetchPage(baseUrl + '&page=2'),
      fetchPage(baseUrl + '&page=3'),
    ]);

    const rawData = [...page1, ...page2, ...page3];
    console.log(`[search] total raw: ${rawData.length}`);

    let cars = rawData.map(car => {
      const nameText = car.name?.en || car.name || '';
      const yearMatch = nameText.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;
      const link = car.absolute_url?.en || car.absolute_url || '';
      return {
        name: nameText,
        price: car.price || 0,
        city: car.site?.en || car.city || '',
        year: year,
        km: car.kilometers || car.mileage || null,
        color: car.color || '',
        link: link,
        image: car.photos?.thumb || car.photo_thumbnails?.[0] || '',
        evaluation: null,
      };
    });

    // فلتر سيارات للبيع فقط
    cars = cars.filter(c => {
      const link = c.link?.toLowerCase() || '';
      return link.includes('/motors/used-cars/');
    });

    // إزالة المكررات
    const seen = new Set();
    cars = cars.filter(c => {
      if (seen.has(c.link)) return false;
      seen.add(c.link);
      return true;
    });

    if (minPrice) cars = cars.filter(c => c.price >= parseInt(minPrice));
    if (maxPrice) cars = cars.filter(c => c.price <= parseInt(maxPrice));
    if (yearFrom) cars = cars.filter(c => c.year && c.year >= parseInt(yearFrom));
    if (yearTo) cars = cars.filter(c => c.year && c.year <= parseInt(yearTo));
    if (kmFrom) cars = cars.filter(c => c.km && c.km >= parseInt(kmFrom));
    if (kmTo) cars = cars.filter(c => c.km && c.km <= parseInt(kmTo));

    console.log(`[search] final: ${cars.length} cars`);
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
    console.error('[evaluate] error:', error.message);
    res.status(500).json({ error: error.message, evaluation: 'سعر معقول للسوق الإماراتي' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Skoop API is running 🚀' });
});

app.listen(PORT, () => {
  console.log('Skoop API running on port ' + PORT + ' 🚀');
});