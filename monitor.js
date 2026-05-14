const axios = require('axios');
const cron = require('node-cron');
const { saveCar, getAlerts } = require('./database');
const { sendNotification } = require('./notifications');

const RAPID_API_KEY = 'ae797cb768msh2307aedcbc3f711p182834jsn16417a8a0cb7';

// توكن الجوال للإشعارات (سنضيفه لاحقاً)
const TEST_TOKEN = 'test';

async function searchAndNotify(keyword, minPrice, maxPrice) {
  try {
    const response = await axios.post('https://dubizzle-api.p.rapidapi.com/scrapers/api/dubizzle/product/listing-by-url', {
      url: 'https://uae.dubizzle.com/motors/used-cars/?q=' + encodeURIComponent(keyword)
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'dubizzle-api.p.rapidapi.com',
        'x-rapidapi-key': RAPID_API_KEY
      },
      timeout: 60000
    });

    const cars = response.data.data;
    
    for (const car of cars) {
      const isNew = saveCar(car);
      
      if (isNew && car.price) {
        const price = parseInt(car.price);
        
        if ((!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice)) {
          console.log('🆕 سيارة جديدة تطابق البحث!');
          console.log(car.name?.en + ' - AED ' + price);
          
          await sendNotification(
            TEST_TOKEN,
            '🚗 سيارة جديدة - سكوب!',
            car.name?.en + ' - AED ' + price,
            car.absolute_url?.en
          );
        }
      }
    }
  } catch (error) {
    console.log('خطأ: ' + error.message);
  }
}

console.log('سكوب يعمل! 🚀 يفحص كل 5 دقائق...');

// يشتغل كل 5 دقائق
cron.schedule('*/5 * * * *', function() {
  console.log('جاري الفحص... ' + new Date().toLocaleTimeString());
  searchAndNotify('nissan patrol', 50000, 200000);
});

// تشغيل فوري
searchAndNotify('nissan patrol', 50000, 200000);