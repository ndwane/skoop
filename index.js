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
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ===== ENV VARIABLES =====
const RAPID_API_KEY = process.env.RAPID_API_KEY || 'ae797cb768msh2307aedcbc3f711p182834jsn16417a8a0cb7';
const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Firebase Admin
let db;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  db = admin.firestore();
  console.log('[firebase] initialized OK');
} catch (e) {
  console.log('[firebase] init failed:', e.message);
}

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
  'chevrolet': 'chevrolet', 'jeep': 'jeep',
  'range rover': 'land-rover', 'land rover': 'land-rover',
  'porsche': 'porsche', 'audi': 'audi', 'volkswagen': 'volkswagen',
  'mitsubishi': 'mitsubishi', 'suzuki': 'suzuki', 'mazda': 'mazda',
  'infiniti': 'infiniti', 'tesla': 'tesla', 'lamborghini': 'lamborghini',
  'ferrari': 'ferrari', 'bentley': 'bentley', 'rolls royce': 'rolls-royce',
  'maserati': 'maserati', 'jaguar': 'jaguar', 'volvo': 'volvo',
  'subaru': 'subaru', 'mini': 'mini', 'cadillac': 'cadillac',
  'lincoln': 'lincoln', 'dodge': 'dodge', 'gmc': 'gmc',
  'hummer': 'hummer', 'genesis': 'genesis', 'byd': 'byd',
  'haval': 'haval', 'chery': 'chery', 'geely': 'geely', 'mg': 'mg',
  'mclaren': 'mclaren', 'aston martin': 'aston-martin',
  'alfa romeo': 'alfa-romeo', 'fiat': 'fiat', 'peugeot': 'peugeot',
  'renault': 'renault', 'opel': 'opel', 'daihatsu': 'daihatsu',
  'isuzu': 'isuzu', 'chrysler': 'chrysler', 'bugatti': 'bugatti',
  'honda motorcycle': 'honda', 'yamaha motorcycle': 'yamaha',
  'kawasaki': 'kawasaki', 'suzuki motorcycle': 'suzuki',
  'ktm': 'ktm', 'bmw motorcycle': 'bmw', 'ducati': 'ducati',
  'harley davidson': 'harley-davidson', 'triumph': 'triumph',
  'indian motorcycle': 'indian', 'aprilia': 'aprilia', 'vespa': 'vespa',
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

// ===== PRICE EVALUATION =====
async function evaluatePrice(carName, price) {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: 'أنت خبير سيارات في الإمارات. حلل هذه السيارة:\nالسيارة: ' + carName + '\nالسعر: ' + price + ' درهم\nأعطني تحليل قصير جداً (جملة واحدة أو جملتين) يشمل:\n- هل السعر رخيص أو معقول أو غالي مقارنة بالسوق\n- سبب واحد للشراء أو التحذير\nالرد بالعربي فقط، قصير ومباشر، بدون أي رموز.'
      }]
    });
    return message.content[0].text.trim();
  } catch (e) {
    console.log('[evaluate] error:', e.message);
    return 'سعر معقول للسوق الإماراتي';
  }
}

// ===== FETCH PAGE من Dubizzle عبر RapidAPI =====
async function fetchPage(url) {
  try {
    console.log('[fetchPage] fetching:', url);
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

    const dataKeys = response.data ? Object.keys(response.data) : [];
    console.log('[fetchPage] response keys:', dataKeys);

    const result =
      response.data?.data ||
      response.data?.results ||
      response.data?.hits ||
      response.data?.listings ||
      (Array.isArray(response.data) ? response.data : null) ||
      [];

    console.log('[fetchPage] extracted', Array.isArray(result) ? result.length : 0, 'items');
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.log('[fetchPage] error:', e.message);
    if (e.response) {
      console.log('[fetchPage] response status:', e.response.status);
      console.log('[fetchPage] response data:', JSON.stringify(e.response.data).slice(0, 300));
    }
    return [];
  }
}

// ===== SEARCH CARS DATA =====
async function searchCarsData(q, city) {
  const searchKeyword = carNameMap[q] || q;
  console.log('[searchCarsData] input:', q, '-> keyword:', searchKeyword);

  const parts = searchKeyword.toLowerCase().split(' ');
  let brandKey = searchKeyword.toLowerCase();
  let modelFilter = null;

  for (let i = parts.length; i >= 1; i--) {
    const candidate = parts.slice(0, i).join(' ');
    if (brandSlugMap[candidate]) {
      brandKey = candidate;
      modelFilter = parts.slice(i).join(' ') || null;
      break;
    }
  }

  const brandSlug = brandSlugMap[brandKey] || brandKey.replace(/ /g, '-');
  const cityDomain = city ? (cityDomainMap[city] || 'dubai') : 'dubai';
  const baseUrl = 'https://' + cityDomain + '.dubizzle.com/motors/used-cars/' + brandSlug + '/';

  console.log('[search] brand=' + brandSlug + ' model=' + modelFilter + ' city=' + cityDomain);
  console.log('[search] base URL:', baseUrl);

  const [page1, page2, page3] = await Promise.all([
    fetchPage(baseUrl),
    fetchPage(baseUrl + '?page=2'),
    fetchPage(baseUrl + '?page=3'),
  ]);

  const rawData = [...page1, ...page2, ...page3];
  console.log('[search] total raw:', rawData.length);

  if (rawData.length === 0) {
    console.log('[search] WARNING: NO RAW DATA');
    return [];
  }

  if (rawData[0]) {
    console.log('[search] sample item keys:', Object.keys(rawData[0]).slice(0, 15));
  }

  let cars = rawData.map(car => {
    const nameText = car.name?.en || car.name || car.title || '';
    const yearMatch = nameText.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    const link = car.absolute_url?.en || car.absolute_url || car.url || '';
    return {
      name: nameText,
      price: car.price || 0,
      city: car.site?.en || car.city || car.location || '',
      year,
      km: car.kilometers || car.mileage || null,
      color: car.color || '',
      link,
      image: car.photos?.thumb || car.photo_thumbnails?.[0] || car.image || '',
      source: 'Dubizzle',
      evaluation: null,
    };
  });

  cars = cars.filter(c => c.link?.toLowerCase().includes('/motors/used-cars/'));
  console.log('[search] after URL filter:', cars.length);

  const seen = new Set();
  cars = cars.filter(c => {
    if (seen.has(c.link)) return false;
    seen.add(c.link);
    return true;
  });
  console.log('[search] after dedup:', cars.length);

  if (modelFilter) {
    cars = cars.filter(c => {
      const nameLower = c.name?.toLowerCase() || '';
      const linkLower = c.link?.toLowerCase() || '';
      return nameLower.includes(modelFilter) || linkLower.includes(modelFilter.replace(/ /g, '-'));
    });
    console.log('[search] after model filter:', cars.length);
  }

  return cars;
}

// ===== INSTAGRAM SCRAPER via Apify =====
const INSTAGRAM_ACCOUNTS = ['smsar1rak', 'sell', 'smsar__'];

async function searchInstagram(keyword) {
  if (!APIFY_TOKEN) {
    console.log('[instagram] APIFY_TOKEN not set');
    return [];
  }

  try {
    console.log('[instagram] searching for:', keyword);
    const searchLower = (keyword || '').toLowerCase();

    const runResponse = await axios.post(
      'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=' + APIFY_TOKEN,
      {
        directUrls: INSTAGRAM_ACCOUNTS.map(u => 'https://www.instagram.com/' + u + '/'),
        resultsType: 'posts',
        resultsLimit: 30,
      },
      { timeout: 180000 }
    );

    const posts = Array.isArray(runResponse.data) ? runResponse.data : [];
    console.log('[instagram] got', posts.length, 'posts total');

    const filtered = posts.filter(post => {
      const caption = (post.caption || '').toLowerCase();
      return caption.includes(searchLower) ||
             searchLower.split(' ').some(part => part.length > 2 && caption.includes(part));
    });

    console.log('[instagram] after filter:', filtered.length);

    return filtered.map(post => {
      const caption = post.caption || '';
      const priceMatch = caption.match(/(\d{2,3})[,.]?(\d{3})/);
      const price = priceMatch ? parseInt(priceMatch[0].replace(/[,.]/g, '')) : 0;
      const yearMatch = caption.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;
      const kmMatch = caption.match(/(\d+)\s*(?:k|km|كم|الف)/i);
      const km = kmMatch ? parseInt(kmMatch[1]) * (kmMatch[0].toLowerCase().includes('k') || kmMatch[0].includes('الف') ? 1000 : 1) : null;

      return {
        name: caption.split('\n')[0]?.slice(0, 80) || 'منشور انستقرام',
        price,
        city: '',
        year,
        km,
        color: '',
        link: post.url || 'https://instagram.com/p/' + post.shortCode,
        image: post.displayUrl || post.thumbnailUrl || '',
        source: 'Instagram',
        account: post.ownerUsername || '',
        evaluation: null,
      };
    });
  } catch (e) {
    console.log('[instagram] error:', e.message);
    return [];
  }
}

// ===== CRON JOB =====
if (db) {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[cron] Checking saved searches...');
    try {
      const searchesSnap = await db.collection('searches').get();
      const tokensSnap = await db.collection('tokens').get();
      const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
      if (tokens.length === 0) return;

      for (const searchDoc of searchesSnap.docs) {
        const search = searchDoc.data();
        try {
          const cars = await searchCarsData(search.brand, search.city);
          const newCars = cars.filter(c => {
            const linkId = c.link?.split('---')[1]?.replace('/', '') || '';
            return linkId && !(search.seenLinks || []).includes(linkId);
          });

          if (newCars.length > 0) {
            for (const token of tokens) {
              try {
                await admin.messaging().send({
                  token,
                  notification: {
                    title: newCars.length + ' سيارة جديدة - ' + search.brandLabel,
                    body: newCars[0].name + ' - AED ' + newCars[0].price?.toLocaleString(),
                  },
                });
              } catch (e) { console.log('FCM error:', e.message); }
            }

            const newSeenLinks = [
              ...(search.seenLinks || []),
              ...newCars.map(c => c.link?.split('---')[1]?.replace('/', '') || '')
            ].slice(-100);

            await db.collection('searches').doc(searchDoc.id).update({
              seenLinks: newSeenLinks,
              lastChecked: Date.now(),
            });
          }
        } catch (e) { console.log('[cron] Error for', search.brand, ':', e.message); }
      }
    } catch (e) { console.log('[cron] Error:', e.message); }
  });
}

// ===== ROUTES =====

app.get('/', (req, res) => {
  res.json({
    status: 'Skoop API is running',
    endpoints: ['/search', '/instagram', '/evaluate', '/token', '/debug', '/debug/rapidapi'],
    version: '2.0',
  });
});

app.get('/search', async (req, res) => {
  const { q, minPrice, maxPrice, city, yearFrom, yearTo, kmFrom, kmTo, condition, fuel, color } = req.query;
  console.log('\n========== /search new request ==========');
  console.log('[/search] params:', req.query);

  if (!q) return res.json([]);

  try {
    let cars = await searchCarsData(q, city);

    if (minPrice) cars = cars.filter(c => c.price >= parseInt(minPrice));
    if (maxPrice) cars = cars.filter(c => c.price <= parseInt(maxPrice));
    if (yearFrom) cars = cars.filter(c => c.year && c.year >= parseInt(yearFrom));
    if (yearTo) cars = cars.filter(c => c.year && c.year <= parseInt(yearTo));
    if (kmFrom) cars = cars.filter(c => c.km && c.km >= parseInt(kmFrom));
    if (kmTo) cars = cars.filter(c => c.km && c.km <= parseInt(kmTo));

    if (color) {
      cars = cars.filter(c => {
        const text = (c.name + ' ' + c.color).toLowerCase();
        return text.includes(color.toLowerCase());
      });
    }
    if (fuel) {
      const fuelKeywords = {
        petrol: ['بنزين', 'petrol', 'gasoline'],
        diesel: ['ديزل', 'diesel'],
        electric: ['كهرباء', 'electric', 'ev'],
        hybrid: ['هايبرد', 'hybrid'],
      };
      const keywords = fuelKeywords[fuel.toLowerCase()] || [fuel.toLowerCase()];
      cars = cars.filter(c => {
        const text = (c.name || '').toLowerCase();
        return keywords.some(k => text.includes(k));
      });
    }
    if (condition) {
      const condKeywords = {
        new: ['جديد', 'new', '0 km', '0km'],
        used: ['مستعمل', 'used'],
      };
      const keywords = condKeywords[condition.toLowerCase()] || [condition.toLowerCase()];
      cars = cars.filter(c => {
        const text = (c.name || '').toLowerCase();
        if (condition.toLowerCase() === 'new') {
          return (c.km !== null && c.km < 1000) || keywords.some(k => text.includes(k));
        }
        if (condition.toLowerCase() === 'used') {
          return (c.km !== null && c.km > 100) || keywords.some(k => text.includes(k));
        }
        return keywords.some(k => text.includes(k));
      });
    }

    console.log('[/search] final:', cars.length, 'cars');
    res.json(cars);
  } catch (error) {
    console.log('[/search] error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/instagram', async (req, res) => {
  const { q } = req.query;
  console.log('\n========== /instagram new request ==========');
  console.log('[/instagram] q=', q);

  if (!q) return res.json([]);

  try {
    const results = await searchInstagram(q);
    console.log('[/instagram] returning', results.length, 'results');
    res.json(results);
  } catch (e) {
    console.log('[/instagram] error:', e.message);
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

app.post('/token', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Firebase not initialized' });
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token' });
  try {
    await db.collection('tokens').doc(token).set({ token, createdAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/debug', async (req, res) => {
  res.json({
    status: 'debug',
    rapidApiKey: RAPID_API_KEY ? RAPID_API_KEY.slice(0, 10) + '...' : 'NOT SET',
    apifyToken: APIFY_TOKEN ? APIFY_TOKEN.slice(0, 10) + '...' : 'NOT SET',
    anthropicKey: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET',
    firebase: db ? 'connected' : 'not connected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/debug/rapidapi', async (req, res) => {
  const testUrl = req.query.url || 'https://dubai.dubizzle.com/motors/used-cars/toyota/';
  try {
    const response = await axios.post(
      'https://dubizzle-api.p.rapidapi.com/scrapers/api/dubizzle/product/listing-by-url',
      { url: testUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'dubizzle-api.p.rapidapi.com',
          'x-rapidapi-key': RAPID_API_KEY
        },
        timeout: 30000
      }
    );
    res.json({
      status: response.status,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      keys: response.data ? Object.keys(response.data) : [],
      itemCount: Array.isArray(response.data?.data) ? response.data.data.length :
                 Array.isArray(response.data?.results) ? response.data.results.length :
                 Array.isArray(response.data) ? response.data.length : 0,
      sample: JSON.stringify(response.data).slice(0, 1500),
    });
  } catch (e) {
    res.status(500).json({
      error: e.message,
      responseStatus: e.response?.status,
      responseData: e.response?.data,
    });
  }
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('Skoop API running on port ' + PORT);
  console.log('RapidAPI Key:', RAPID_API_KEY ? 'SET' : 'NOT SET');
  console.log('Apify Token:', APIFY_TOKEN ? 'SET' : 'NOT SET');
  console.log('Anthropic Key:', process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET');
  console.log('Firebase:', db ? 'connected' : 'not connected');
  console.log('========================================');
});