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

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
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

// ===== Claude تحليل السعر =====
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
الرد بالعربي فقط، قصير ومباشر، بدون أي رموز مثل ** أو # أو markdown.`
    }]
  });
  return message.content[0].text.trim();
}

// ===== دبيزل =====
async function fetchDubizzlePage(url) {
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
    console.log('[dubizzle] fetch error:', e.message);
    return [];
  }
}

async function searchDubizzle(brandSlug, cityDomain, modelFilter) {
  try {
    const baseUrl = `https://${cityDomain}.dubizzle.com/motors/used-cars/${brandSlug}/`;
    const [p1, p2, p3] = await Promise.all([
      fetchDubizzlePage(baseUrl),
      fetchDubizzlePage(baseUrl + '?page=2'),
      fetchDubizzlePage(baseUrl + '?page=3'),
    ]);
    let cars = [...p1, ...p2, ...p3].map(car => {
      const nameText = car.name?.en || car.name || '';
      const yearMatch = nameText.match(/\b(19|20)\d{2}\b/);
      const link = car.absolute_url?.en || car.absolute_url || '';
      return {
        name: nameText,
        price: car.price || 0,
        city: car.site?.en || car.city || '',
        year: yearMatch ? parseInt(yearMatch[0]) : null,
        km: car.kilometers || car.mileage || null,
        link,
        image: car.photos?.thumb || car.photo_thumbnails?.[0] || '',
        source: 'Dubizzle',
      };
    }).filter(c => c.link?.toLowerCase().includes('/motors/used-cars/'));

    if (modelFilter) {
      cars = cars.filter(c =>
        c.name?.toLowerCase().includes(modelFilter) ||
        c.link?.toLowerCase().includes(modelFilter.replace(/ /g, '-'))
      );
    }
    console.log(`[dubizzle] ${cars.length} cars`);
    return cars;
  } catch (e) {
    console.log('[dubizzle] error:', e.message);
    return [];
  }
}

// ===== YallaMotor =====
async function searchYallaMotor(brandKey, modelFilter, city) {
  try {
    const brandSlug = brandKey.replace(/ /g, '-');
    const baseUrl = `https://uae.yallamotor.com/used-cars/${brandSlug}`;
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 20000
    });

    const html = response.data;
    const cars = [];

    // استخراج من Next.js __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const listings = nextData?.props?.pageProps?.listings ||
                         nextData?.props?.pageProps?.cars ||
                         nextData?.props?.pageProps?.data?.listings || [];
        listings.forEach(car => {
          const name = car.title || car.name || `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim();
          cars.push({
            name,
            price: car.price || 0,
            city: car.emirate || car.city || city || '',
            year: car.year || null,
            km: car.mileage || car.kilometers || null,
            link: car.url ? `https://uae.yallamotor.com${car.url}` : '',
            image: car.main_photo || car.photo || '',
            source: 'YallaMotor',
          });
        });
      } catch (e) {}
    }

    let filtered = cars.filter(c => c.link);
    if (modelFilter) filtered = filtered.filter(c => c.name?.toLowerCase().includes(modelFilter));
    console.log(`[yallamotor] ${filtered.length} cars`);
    return filtered;
  } catch (e) {
    console.log('[yallamotor] error:', e.message);
    return [];
  }
}

// ===== DubiCars =====
async function searchDubiCars(brandKey, modelFilter, city) {
  try {
    const brandSlug = brandKey.replace(/ /g, '-');
    const baseUrl = `https://www.dubicars.com/used/${brandSlug}-for-sale-in-uae.html`;
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 20000
    });

    const html = response.data;
    const cars = [];

    // استخراج من Next.js __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const listings = nextData?.props?.pageProps?.listings ||
                         nextData?.props?.pageProps?.vehicles ||
                         nextData?.props?.pageProps?.data || [];
        const items = Array.isArray(listings) ? listings : [];
        items.forEach(car => {
          const name = car.title || car.name || `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim();
          const yearMatch = name.match(/\b(19|20)\d{2}\b/);
          cars.push({
            name,
            price: car.price || car.asking_price || 0,
            city: car.emirate || car.city || city || '',
            year: car.year || (yearMatch ? parseInt(yearMatch[0]) : null),
            km: car.mileage || car.kilometers || null,
            link: car.url ? `https://www.dubicars.com${car.url}` : (car.link || ''),
            image: car.main_photo || car.photo || car.image || '',
            source: 'DubiCars',
          });
        });
      } catch (e) {}
    }

    let filtered = cars.filter(c => c.link);
    if (modelFilter) filtered = filtered.filter(c => c.name?.toLowerCase().includes(modelFilter));
    console.log(`[dubicars] ${filtered.length} cars`);
    return filtered;
  } catch (e) {
    console.log('[dubicars] error:', e.message);
    return [];
  }
}

// ===== OpenSooq =====
async function searchOpenSooq(brandKey, modelFilter, city) {
  try {
    const searchQuery = modelFilter ? `${brandKey} ${modelFilter}` : brandKey;
    const baseUrl = `https://ae.opensooq.com/en/search?term=${encodeURIComponent(searchQuery)}&subcategory_id=1`;

    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 20000
    });

    const html = response.data;
    const cars = [];

    // استخراج من Next.js __NEXT_DATA__
    const nextDataMatch = html.match ? html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) : null;
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const listings = nextData?.props?.pageProps?.posts ||
                         nextData?.props?.pageProps?.listings || [];
        listings.forEach(post => {
          const name = post.title || post.name || '';
          const yearMatch = name.match(/\b(19|20)\d{2}\b/);
          cars.push({
            name,
            price: post.price || 0,
            city: post.city_name || post.city || city || '',
            year: yearMatch ? parseInt(yearMatch[0]) : null,
            km: post.mileage || null,
            link: post.url ? `https://ae.opensooq.com${post.url}` : (post.absolute_url || ''),
            image: post.main_photo || post.image || '',
            source: 'OpenSooq',
          });
        });
      } catch (e) {}
    }

    let filtered = cars.filter(c => c.link);
    if (modelFilter) filtered = filtered.filter(c => c.name?.toLowerCase().includes(modelFilter));
    console.log(`[opensooq] ${filtered.length} cars`);
    return filtered;
  } catch (e) {
    console.log('[opensooq] error:', e.message);
    return [];
  }
}

// ===== البحث في كل المنصات =====
async function searchAllPlatforms(q, city) {
  const searchKeyword = carNameMap[q] || q;
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

  console.log(`[search] brand=${brandSlug} model=${modelFilter} city=${cityDomain}`);

  const [dubizzleRes, yallaRes, dubiCarsRes, openSooqRes] = await Promise.allSettled([
    searchDubizzle(brandSlug, cityDomain, modelFilter),
    searchYallaMotor(brandKey, modelFilter, city),
    searchDubiCars(brandKey, modelFilter, city),
    searchOpenSooq(brandKey, modelFilter, city),
  ]);

  const allCars = [
    ...(dubizzleRes.status === 'fulfilled' ? dubizzleRes.value : []),
    ...(yallaRes.status === 'fulfilled' ? yallaRes.value : []),
    ...(dubiCarsRes.status === 'fulfilled' ? dubiCarsRes.value : []),
    ...(openSooqRes.status === 'fulfilled' ? openSooqRes.value : []),
  ];

  const seen = new Set();
  const unique = allCars.filter(c => {
    if (!c.link || seen.has(c.link)) return false;
    seen.add(c.link);
    return true;
  });

  console.log(`[search] total: ${unique.length} cars from all platforms`);
  return unique;
}

// ===== Cron كل 30 دقيقة =====
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
        const cars = await searchAllPlatforms(search.brand, search.city);
        const newCars = cars.filter(c => {
          return c.link && !(search.seenLinks || []).includes(c.link);
        });

        if (newCars.length > 0) {
          for (const token of tokens) {
            try {
              await admin.messaging().send({
                token,
                notification: {
                  title: `🚗 ${newCars.length} سيارة جديدة - ${search.brandLabel}`,
                  body: `${newCars[0].name} - AED ${newCars[0].price?.toLocaleString()}`,
                },
              });
            } catch (e) { console.log('FCM error:', e.message); }
          }
          const newSeenLinks = [...(search.seenLinks || []), ...newCars.map(c => c.link)].slice(-100);
          await db.collection('searches').doc(searchDoc.id).update({ seenLinks: newSeenLinks, lastChecked: Date.now() });
        }
      } catch (e) { console.log(`[cron] Error for ${search.brand}:`, e.message); }
    }
  } catch (e) { console.log('[cron] Error:', e.message); }
});

// ===== Routes =====
app.get('/search', async (req, res) => {
  const { q, minPrice, maxPrice, city, yearFrom, yearTo, kmFrom, kmTo } = req.query;
  if (!q) return res.json([]);
  try {
    let cars = await searchAllPlatforms(q, city);
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
  res.json({ status: 'Skoop API is running 🚀', platforms: ['Dubizzle', 'YallaMotor', 'DubiCars', 'OpenSooq'] });
});

app.listen(PORT, () => {
  console.log('Skoop API running on port ' + PORT + ' 🚀');
});