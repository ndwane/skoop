require('dotenv').config();
const express = require('express');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const admin = require('firebase-admin');
const cron = require('node-cron');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

const RAPID_API_KEY = 'ae797cb768msh2307aedcbc3f711p182834jsn16417a8a0cb7';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

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

const brandSlugMap = {
  'toyota': 'toyota', 'nissan': 'nissan', 'honda': 'honda',
  'mercedes': 'mercedes-benz', 'bmw': 'bmw', 'lexus': 'lexus',
  'kia': 'kia', 'hyundai': 'hyundai', 'ford': 'ford',
  'chevrolet': 'chevrolet', 'jeep': 'jeep', 'range rover': 'land-rover',
  'land rover': 'land-rover', 'porsche': 'porsche', 'audi': 'audi',
  'volkswagen': 'volkswagen', 'mitsubishi': 'mitsubishi', 'suzuki': 'suzuki',
  'mazda': 'mazda', 'infiniti': 'infiniti', 'tesla': 'tesla',
  'lamborghini': 'lamborghini', 'ferrari': 'ferrari', 'bentley': 'bentley',
  'rolls royce': 'rolls-royce', 'maserati': 'maserati', 'jaguar': 'jaguar',
  'volvo': 'volvo', 'subaru': 'subaru', 'mini': 'mini',
  'cadillac': 'cadillac', 'lincoln': 'lincoln', 'dodge': 'dodge',
  'gmc': 'gmc', 'hummer': 'hummer', 'genesis': 'genesis',
  'byd': 'byd', 'haval': 'haval', 'chery': 'chery',
  'geely': 'geely', 'mg': 'mg', 'mclaren': 'mclaren',
  'aston martin': 'aston-martin', 'alfa romeo': 'alfa-romeo',
  'fiat': 'fiat', 'peugeot': 'peugeot', 'renault': 'renault',
  'opel': 'opel', 'daihatsu': 'daihatsu', 'isuzu': 'isuzu',
  'chrysler': 'chrysler', 'bugatti': 'bugatti',
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

async function searchCarsData(keyword, city) {
  const brandSlug = brandSlugMap[keyword.toLowerCase()] || keyword.toLowerCase().replace(/ /g, '-');
  const cityDomain = city ? (cityDomainMap[city] || 'dubai') : 'dubai';
  const baseUrl = `https://${cityDomain}.dubizzle.com/motors/used-cars/${brandSlug}/`;

  const [page1, page2, page3] = await Promise.all([
    fetchPage(baseUrl),
    fetchPage(baseUrl + '?page=2'),
    fetchPage(baseUrl + '?page=3'),
  ]);

  const rawData = [...page1, ...page2, ...page3];

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
    };
  });

  cars = cars.filter(c => c.link?.toLowerCase().includes('/motors/used-cars/'));

  const seen = new Set();
  cars = cars.filter(c => {
    if (seen.has(c.link)) return false;
    seen.add(c.link);
    return true;
  });

  return cars;
}

// فحص الإشعارات كل 30 دقيقة
cron.schedule('*/30 * * * *', async () => {
  console.log('[cron] Checking saved searches...');
  try {
    const searchesSnap = await db.collection('searches').get();
    const tokensSnap = await db.collection('tokens').get();
    const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);

    if (tokens.length === 0) return;

    for (const searchDoc of searchesSnap.docs) {
      const search = searchDoc.data();
      const keyword = search.brand;
      const city = search.city;

      try {
        const cars = await searchCarsData(keyword, city);
        const lastChecked = search.lastChecked || 0;
        const newCars = cars.filter(c => {
          const linkId = c.link?.split('---')[1]?.replace('/', '') || '';
          return linkId && !search.seenLinks?.includes(linkId);
        });

        if (newCars.length > 0) {
          console.log(`[cron] Found ${newCars.length} new cars for ${keyword}`);

          // إرسال إشعار لكل token
          for (const token of tokens) {
            try {
              await admin.messaging().send({
                token,
                notification: {
                  title: `🚗 ${newCars.length} سيارة جديدة - ${search.brandLabel}`,
                  body: `${newCars[0].name} - AED ${newCars[0].price?.toLocaleString()}`,
                },
                data: {
                  brand: keyword,
                  count: String(newCars.length),
                }
              });
            } catch (e) {
              console.log('FCM error:', e.message);
            }
          }

          // تحديث الـ seenLinks
          const newSeenLinks = [
            ...(search.seenLinks || []),
            ...newCars.map(c => c.link?.split('---')[1]?.replace('/', '') || '')
          ].slice(-100);

          await db.collection('searches').doc(searchDoc.id).update({
            seenLinks: newSeenLinks,
            lastChecked: Date.now(),
          });
        }
      } catch (e) {
        console.log(`[cron] Error for ${keyword}:`, e.message);
      }
    }
  } catch (e) {
    console.log('[cron] Error:', e.message);
  }
});

app.get('/search', async (req, res) => {
  const { q, minPrice, maxPrice, city, yearFrom, yearTo, kmFrom, kmTo } = req.query;
  if (!q) return res.json([]);

  try {
    const searchKeyword = carNameMap[q] || q;
    let cars = await searchCarsData(searchKeyword, city);

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

// حفظ token الجوال
app.post('/token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token' });
  try {
    await db.collection('tokens').doc(token).set({ token, createdAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
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