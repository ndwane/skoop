const Database = require('better-sqlite3');
const db = new Database('skoop.db');

// إنشاء جداول قاعدة البيانات
db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id TEXT PRIMARY KEY,
    name TEXT,
    price INTEGER,
    link TEXT,
    city TEXT,
    image TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT,
    min_price INTEGER,
    max_price INTEGER,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

function saveCar(car) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO cars (id, name, price, link, city, image, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    car.uuid,
    car.name?.en,
    car.price,
    car.absolute_url?.en,
    car.site?.en,
    car.photos?.thumb,
    car.created_at
  );
  
  return result.changes > 0; // true = سيارة جديدة
}

function getCars() {
  return db.prepare('SELECT * FROM cars ORDER BY created_at DESC').all();
}

function addAlert(keyword, minPrice, maxPrice) {
  const stmt = db.prepare('INSERT INTO alerts (keyword, min_price, max_price) VALUES (?, ?, ?)');
  stmt.run(keyword, minPrice, maxPrice);
}

function getAlerts() {
  return db.prepare('SELECT * FROM alerts').all();
}

module.exports = { saveCar, getCars, addAlert, getAlerts };

console.log('قاعدة البيانات جاهزة! ✅');