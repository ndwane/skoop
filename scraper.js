const axios = require('axios');
const { saveCar, getCars } = require('./database');

const RAPID_API_KEY = 'ae797cb768msh2307aedcbc3f711p182834jsn16417a8a0cb7';

async function searchCars(keyword) {
  console.log('جاري البحث عن: ' + keyword);
  
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
    console.log('وجدنا ' + cars.length + ' سيارة!');
    
    let newCars = 0;
    cars.forEach(function(car) {
      const isNew = saveCar(car);
      if (isNew) {
        newCars++;
        console.log('🆕 سيارة جديدة: ' + car.name?.en + ' - AED ' + car.price);
      }
    });

    console.log('تم حفظ ' + newCars + ' سيارة جديدة في قاعدة البيانات ✅');
    
    const allCars = getCars();
    console.log('إجمالي السيارات في قاعدة البيانات: ' + allCars.length);

  } catch (error) {
    console.log('خطأ: ' + error.message);
  }
}

searchCars('nissan patrol');