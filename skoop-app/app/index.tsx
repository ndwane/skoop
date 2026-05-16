import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView, Modal, SafeAreaView, Alert, Linking
} from 'react-native';
import { db, collection, addDoc, getDocs, deleteDoc, doc } from '../firebase';
import { registerForPushNotifications, setupNotificationHandler } from '../notifications';

const API_URL = 'https://skoop-production.up.railway.app';

const TRANSLATIONS = {
  ar: {
    appName: 'سكوب',
    searchPlaceholder: '🔍 ابحث عن مركبة...',
    search: 'بحث',
    saved: 'المحفوظة',
    home: 'الرئيسية',
    settings: 'الإعدادات',
    results: 'نتيجة',
    back: '← رجوع',
    saveSearch: '🔖 حفظ البحث',
    savedSearches: '🔖 البحث المحفوظ',
    noSaved: 'لا يوجد بحث محفوظ',
    noSavedSub: 'ابحث عن سيارة واضغط "حفظ البحث"',
    searchNow: '🔍 بحث الآن',
    emptyTitle: 'ابحث عن مركبتك',
    emptySub: 'اضغط على مربع البحث واختر النوع والشركة والموديل',
    analyzing: 'جاري تحليل السعر...',
    contactForPrice: 'السعر عند التواصل',
    openListing: 'اضغط لفتح الإعلان ←',
    searching: 'جاري البحث...',
    selectBrand: 'اختر الشركة أولاً ←',
    selectVehicle: 'اختر المركبة',
    brand: 'الشركة',
    model: 'الموديل',
    allModels: 'كل الموديلات',
    cars: 'سيارات',
    motorcycles: 'دراجات',
    boats: 'قوارب',
    budget: '💰 الميزانية (درهم)',
    year: '📅 سنة الصنع',
    km: '🛣️ الكيلومترات',
    city: '📍 المدينة',
    color: '🎨 اللون',
    applySearch: '🔍 تطبيق وبحث',
    reset: 'إعادة تعيين',
    searchFilters: 'فلاتر البحث',
    from: 'من',
    to: 'إلى',
    savedSuccess: 'تم حفظ البحث بنجاح!',
    savedTitle: '✅ تم الحفظ',
    errorTitle: 'خطأ',
    errorSave: 'لم يتم الحفظ',
    allCities: 'الكل',
    openAd: 'فتح الإعلان',
    close: '✕ إغلاق',
  },
  en: {
    appName: 'Scoop',
    searchPlaceholder: '🔍 Search for a vehicle...',
    search: 'Search',
    saved: 'Saved',
    home: 'Home',
    settings: 'Settings',
    results: 'results',
    back: '← Back',
    saveSearch: '🔖 Save Search',
    savedSearches: '🔖 Saved Searches',
    noSaved: 'No saved searches',
    noSavedSub: 'Search for a car and tap "Save Search"',
    searchNow: '🔍 Search Now',
    emptyTitle: 'Find Your Vehicle',
    emptySub: 'Tap the search box and select type, brand and model',
    analyzing: 'Analyzing price...',
    contactForPrice: 'Contact for price',
    openListing: 'Tap to open listing →',
    searching: 'Searching...',
    selectBrand: 'Select a brand first →',
    selectVehicle: 'Select Vehicle',
    brand: 'Brand',
    model: 'Model',
    allModels: 'All Models',
    cars: 'Cars',
    motorcycles: 'Motorcycles',
    boats: 'Boats',
    budget: '💰 Budget (AED)',
    year: '📅 Year',
    km: '🛣️ Mileage (km)',
    city: '📍 City',
    color: '🎨 Color',
    applySearch: '🔍 Apply & Search',
    reset: 'Reset',
    searchFilters: 'Search Filters',
    from: 'From',
    to: 'To',
    savedSuccess: 'Search saved successfully!',
    savedTitle: '✅ Saved',
    errorTitle: 'Error',
    errorSave: 'Could not save',
    allCities: 'All',
    openAd: 'Open Listing',
    close: '✕ Close',
  }
};

const CITIES = {
  ar: ['الكل', 'دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين', 'العين'],
  en: ['All', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
};

const BRANDS_DATA = {
  cars: [
    { label: 'تويوتا / Toyota', value: 'toyota', models: ['Land Cruiser', 'Prado', 'Camry', 'Corolla', 'Hilux', 'Yaris', 'RAV4', 'Fortuner', 'Highlander', 'Avalon', 'C-HR', 'Rush', 'Innova', 'Sequoia', 'Tundra', 'Tacoma', '4Runner', 'Venza', 'Crown'] },
    { label: 'نيسان / Nissan', value: 'nissan', models: ['Patrol', 'Altima', 'Sunny', 'X-Trail', 'Murano', 'Armada', 'Navara', 'Juke', 'Kicks', 'Maxima', 'Pathfinder', 'Frontier', 'Titan', 'GT-R', 'Z', '370Z', 'Sentra', 'Versa', 'Leaf'] },
    { label: 'هوندا / Honda', value: 'honda', models: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Odyssey', 'Jazz', 'City', 'Fit', 'Passport', 'Ridgeline', 'Insight'] },
    { label: 'مرسيدس / Mercedes', value: 'mercedes', models: ['C200', 'C300', 'E200', 'E300', 'E350', 'S400', 'S500', 'S580', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G63', 'AMG GT', 'A200', 'CLA', 'CLS', 'EQS', 'EQE', 'Maybach'] },
    { label: 'بي ام دبليو / BMW', value: 'bmw', models: ['118i', '318i', '320i', '330i', '340i', '520i', '530i', '540i', '730i', '740i', '750i', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'M3', 'M5', 'M8', 'i4', 'iX', 'Z4'] },
    { label: 'لكزس / Lexus', value: 'lexus', models: ['ES250', 'ES300h', 'ES350', 'IS250', 'IS350', 'LS460', 'LS500', 'GS350', 'GX460', 'LX570', 'LX600', 'RX350', 'RX450h', 'NX300', 'UX200', 'LC500', 'RC350'] },
    { label: 'كيا / Kia', value: 'kia', models: ['Sorento', 'Sportage', 'Optima', 'Stinger', 'Cerato', 'Rio', 'Carnival', 'Telluride', 'EV6', 'Niro', 'Soul', 'Seltos', 'Mohave', 'K5', 'K8'] },
    { label: 'هيونداي / Hyundai', value: 'hyundai', models: ['Sonata', 'Elantra', 'Tucson', 'Santa Fe', 'Creta', 'Azera', 'Staria', 'Palisade', 'Ioniq 5', 'Ioniq 6', 'Kona', 'Venue', 'i10', 'i20'] },
    { label: 'فورد / Ford', value: 'ford', models: ['Explorer', 'F-150', 'Mustang', 'Edge', 'EcoSport', 'Expedition', 'Ranger', 'Bronco', 'Escape', 'Fusion', 'Maverick', 'Super Duty'] },
    { label: 'شيفروليه / Chevrolet', value: 'chevrolet', models: ['Tahoe', 'Suburban', 'Traverse', 'Malibu', 'Camaro', 'Caprice', 'Colorado', 'Silverado', 'Blazer', 'Trax', 'Equinox', 'Corvette'] },
    { label: 'جيب / Jeep', value: 'jeep', models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Wagoneer', 'Grand Wagoneer'] },
    { label: 'رنج روفر / Range Rover', value: 'range rover', models: ['Vogue', 'Sport', 'Evoque', 'Velar', 'Defender', 'Discovery', 'Discovery Sport'] },
    { label: 'بورش / Porsche', value: 'porsche', models: ['Cayenne', '911', 'Panamera', 'Macan', 'Taycan', 'Boxster', 'Cayman', '718'] },
    { label: 'اودي / Audi', value: 'audi', models: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'RS3', 'RS6', 'RS7', 'TT', 'R8', 'e-tron'] },
    { label: 'ميتسوبيشي / Mitsubishi', value: 'mitsubishi', models: ['Pajero', 'L200', 'Outlander', 'Eclipse Cross', 'Lancer', 'ASX', 'Galant', 'Xpander'] },
    { label: 'انفينيتي / Infiniti', value: 'infiniti', models: ['QX80', 'QX60', 'QX55', 'QX50', 'QX30', 'Q50', 'Q60', 'Q70', 'FX35', 'FX37'] },
    { label: 'مازدا / Mazda', value: 'mazda', models: ['CX-3', 'CX-5', 'CX-8', 'CX-9', 'CX-90', 'Mazda 2', 'Mazda 3', 'Mazda 6', 'MX-5'] },
    { label: 'فولكس / Volkswagen', value: 'volkswagen', models: ['Passat', 'Golf', 'Tiguan', 'Touareg', 'Polo', 'Jetta', 'Arteon', 'ID.4', 'T-Roc', 'Teramont'] },
    { label: 'جي ام سي / GMC', value: 'gmc', models: ['Yukon', 'Yukon XL', 'Sierra', 'Terrain', 'Canyon', 'Acadia'] },
    { label: 'دودج / Dodge', value: 'dodge', models: ['Challenger', 'Charger', 'Durango', 'Ram 1500', 'Ram 2500', 'Journey'] },
    { label: 'تسلا / Tesla', value: 'tesla', models: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'] },
    { label: 'لامبورغيني / Lamborghini', value: 'lamborghini', models: ['Urus', 'Huracan', 'Aventador', 'Revuelto', 'Sterrato'] },
    { label: 'فيراري / Ferrari', value: 'ferrari', models: ['Roma', 'Portofino', 'F8', 'SF90', '812', 'GTC4', 'Purosangue', '296'] },
    { label: 'بنتلي / Bentley', value: 'bentley', models: ['Bentayga', 'Continental GT', 'Flying Spur', 'Mulsanne'] },
    { label: 'رولز رويس / Rolls Royce', value: 'rolls royce', models: ['Ghost', 'Phantom', 'Wraith', 'Dawn', 'Cullinan', 'Spectre'] },
    { label: 'ماسيراتي / Maserati', value: 'maserati', models: ['Ghibli', 'Quattroporte', 'Levante', 'GranTurismo', 'Grecale'] },
    { label: 'جاكوار / Jaguar', value: 'jaguar', models: ['F-Pace', 'E-Pace', 'I-Pace', 'XE', 'XF', 'XJ', 'F-Type'] },
    { label: 'فولفو / Volvo', value: 'volvo', models: ['XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60', 'C40'] },
    { label: 'سوبارو / Subaru', value: 'subaru', models: ['Outback', 'Forester', 'Impreza', 'Legacy', 'XV', 'WRX', 'BRZ'] },
    { label: 'ميني / Mini', value: 'mini', models: ['Cooper', 'Countryman', 'Clubman', 'Paceman', 'Cabrio'] },
    { label: 'كاديلاك / Cadillac', value: 'cadillac', models: ['Escalade', 'CT5', 'CT6', 'XT4', 'XT5', 'XT6', 'Lyriq'] },
    { label: 'لينكولن / Lincoln', value: 'lincoln', models: ['Navigator', 'Aviator', 'Corsair', 'Nautilus', 'Continental'] },
    { label: 'هامر / Hummer', value: 'hummer', models: ['H1', 'H2', 'H3', 'EV'] },
    { label: 'جينيسيس / Genesis', value: 'genesis', models: ['G70', 'G80', 'G90', 'GV70', 'GV80'] },
    { label: 'BYD', value: 'byd', models: ['Atto 3', 'Han', 'Tang', 'Song', 'Dolphin', 'Seal', 'Sea Lion'] },
    { label: 'هافال / Haval', value: 'haval', models: ['H6', 'H9', 'Jolion', 'Big Dog', 'Dargo'] },
    { label: 'شيري / Chery', value: 'chery', models: ['Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5', 'Omoda 5'] },
    { label: 'جيلي / Geely', value: 'geely', models: ['Coolray', 'Azkarra', 'Okavango', 'Emgrand'] },
    { label: 'MG', value: 'mg', models: ['MG5', 'MG6', 'ZS', 'HS', 'RX5', 'Cyberster'] },
    { label: 'سوزوكي / Suzuki', value: 'suzuki', models: ['Vitara', 'Swift', 'Jimny', 'Ignis', 'Baleno', 'Ertiga', 'Ciaz', 'Grand Vitara'] },
    { label: 'ماكلارين / McLaren', value: 'mclaren', models: ['720S', '570S', 'Artura', 'GT', 'P1', 'Senna'] },
    { label: 'استون مارتن / Aston Martin', value: 'aston martin', models: ['DB11', 'Vantage', 'DBS', 'DBX', 'Valkyrie'] },
    { label: 'الفا روميو / Alfa Romeo', value: 'alfa romeo', models: ['Giulia', 'Stelvio', 'Tonale', 'Giulietta', '4C'] },
    { label: 'فيات / Fiat', value: 'fiat', models: ['500', 'Panda', 'Tipo', 'Doblo', 'Bravo'] },
    { label: 'بيجو / Peugeot', value: 'peugeot', models: ['208', '308', '408', '508', '2008', '3008', '5008'] },
    { label: 'رينو / Renault', value: 'renault', models: ['Duster', 'Koleos', 'Megane', 'Captur', 'Kangoo'] },
    { label: 'اوبل / Opel', value: 'opel', models: ['Astra', 'Insignia', 'Mokka', 'Corsa', 'Grandland'] },
    { label: 'دايهاتسو / Daihatsu', value: 'daihatsu', models: ['Terios', 'Rocky', 'Sirion', 'Gran Max'] },
    { label: 'ايسوزو / Isuzu', value: 'isuzu', models: ['D-Max', 'MU-X', 'Trooper'] },
    { label: 'كرايسلر / Chrysler', value: 'chrysler', models: ['300', '300C', 'Pacifica', 'Voyager'] },
    { label: 'بوغاتي / Bugatti', value: 'bugatti', models: ['Chiron', 'Veyron', 'Divo', 'Mistral'] },
  ],
  motorcycles: [
    { label: 'هوندا / Honda', value: 'honda motorcycle', models: ['CBR600RR', 'CBR1000RR', 'CRF450', 'PCX150', 'Forza', 'Africa Twin', 'CB500', 'CB650', 'Gold Wing', 'Shadow', 'Rebel'] },
    { label: 'ياماها / Yamaha', value: 'yamaha motorcycle', models: ['R1', 'R3', 'R6', 'MT-07', 'MT-09', 'MT-10', 'XMAX', 'NMAX', 'TMAX', 'Tracer', 'Tenere', 'XSR'] },
    { label: 'كاواساكي / Kawasaki', value: 'kawasaki', models: ['Ninja 400', 'Ninja 650', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Z400', 'Z650', 'Z900', 'Versys', 'KLX', 'W800'] },
    { label: 'سوزوكي / Suzuki', value: 'suzuki motorcycle', models: ['GSX-R600', 'GSX-R750', 'GSX-R1000', 'Hayabusa', 'V-Strom', 'Burgman', 'Bandit', 'SV650'] },
    { label: 'KTM', value: 'ktm', models: ['Duke 125', 'Duke 200', 'Duke 390', 'Duke 690', 'RC390', 'EXC', '890 Adventure', '1290 Super Adventure'] },
    { label: 'BMW موتو', value: 'bmw motorcycle', models: ['S1000RR', 'S1000R', 'GS1250', 'R1250RT', 'F850GS', 'F900R', 'K1600GT', 'C400X'] },
    { label: 'دوكاتي / Ducati', value: 'ducati', models: ['Panigale V4', 'Monster', 'Diavel', 'Scrambler', 'Multistrada', 'DesertX', 'Streetfighter'] },
    { label: 'هارلي / Harley Davidson', value: 'harley davidson', models: ['Sportster', 'Fat Boy', 'Road King', 'Softail', 'Street Glide', 'Pan America', 'Nightster'] },
    { label: 'ترايمف / Triumph', value: 'triumph', models: ['Street Triple', 'Speed Triple', 'Tiger', 'Bonneville', 'Rocket', 'Thunderbird'] },
    { label: 'انديان / Indian', value: 'indian motorcycle', models: ['Chief', 'Scout', 'Challenger', 'Pursuit', 'FTR'] },
    { label: 'ايبريليا / Aprilia', value: 'aprilia', models: ['RSV4', 'Tuono', 'RS660', 'Tuareg', 'SR GT'] },
    { label: 'فيسبا / Vespa', value: 'vespa', models: ['GTS 300', 'Sprint', 'Primavera', 'Elettrica'] },
  ],
  boats: [
    { label: 'قوارب بخارية / Motorboats', value: 'motorboat', models: ['Speedboat', 'Fishing Boat', 'Cruiser', 'Powerboat', 'Pontoon'] },
    { label: 'قوارب شراعية / Sailboats', value: 'sailboat', models: ['Sailing Yacht', 'Catamaran', 'Dinghy', 'Ketch'] },
    { label: 'جيتسكي / Jet Ski', value: 'jet ski', models: ['Yamaha WaveRunner', 'Kawasaki Jet Ski', 'Sea-Doo', 'Polaris'] },
    { label: 'يخوت / Yachts', value: 'yacht', models: ['Luxury Yacht', 'Sport Yacht', 'Motor Yacht', 'Super Yacht'] },
    { label: 'قوارب صيد / Fishing', value: 'fishing boat', models: ['Bass Boat', 'Center Console', 'Walkaround', 'Skiff'] },
  ],
};

const COLOR_HEX = ['#FFFFFF', '#111111', '#888888', '#C0C0C0', '#C0392B', '#2980B9', '#85C1E9', '#27AE60', '#F39C12', '#D4B896', '#7B4F2E', '#E67E22', '#8E44AD', '#F1948A', '#F4D03F', '#922B21'];
const COLORS = {
  ar: ['أبيض', 'أسود', 'رمادي', 'فضي', 'أحمر', 'أزرق', 'أزرق فاتح', 'أخضر', 'ذهبي', 'بيج', 'بني', 'برتقالي', 'بنفسجي', 'وردي', 'أصفر', 'عنابي'],
  en: ['White', 'Black', 'Gray', 'Silver', 'Red', 'Blue', 'Light Blue', 'Green', 'Gold', 'Beige', 'Brown', 'Orange', 'Purple', 'Pink', 'Yellow', 'Maroon'],
};

export default function Index() {
  const [lang, setLang] = useState('ar');
  const t = TRANSLATIONS[lang];
  const cities = CITIES[lang];
  const colorList = COLORS[lang];

  const [activeTab, setActiveTab] = useState('home');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedType, setSelectedType] = useState('cars');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [kmFrom, setKmFrom] = useState('');
  const [kmTo, setKmTo] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const vehicleTypes = [
    { id: 'cars', label: t.cars, icon: '🚗' },
    { id: 'motorcycles', label: t.motorcycles, icon: '🏍️' },
    { id: 'boats', label: t.boats, icon: '⛵' },
  ];

  const brands = BRANDS_DATA[selectedType] || [];
  const models = selectedBrand ? (brands.find(b => b.value === selectedBrand.value)?.models || []) : [];
  const selectedTypeData = vehicleTypes.find(v => v.id === selectedType);

  useEffect(() => {
    loadSavedSearches();
    setupNotificationHandler();
    registerForPushNotifications();
  }, []);

  const loadSavedSearches = async () => {
    setLoadingSaved(true);
    try {
      const snapshot = await getDocs(collection(db, 'searches'));
      setSavedSearches(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
    setLoadingSaved(false);
  };

  const saveSearch = async () => {
    if (!selectedBrand) return;
    try {
      await addDoc(collection(db, 'searches'), {
        brand: selectedBrand.value,
        brandLabel: selectedBrand.label,
        model: selectedModel || null,
        type: selectedType,
        city: selectedCity || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        yearFrom: yearFrom || null,
        yearTo: yearTo || null,
        createdAt: new Date().toISOString(),
      });
      Alert.alert(t.savedTitle, t.savedSuccess);
      loadSavedSearches();
    } catch (e) {
      Alert.alert(t.errorTitle, t.errorSave);
    }
  };

  const deleteSearch = async (id) => {
    try {
      await deleteDoc(doc(db, 'searches', id));
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    } catch (e) {}
  };

  const openListing = (link) => {
    if (link) {
      const fixedLink = link
        .replace('dubai.dubizzle.com', 'uae.dubizzle.com')
        .replace('sharjah.dubizzle.com', 'uae.dubizzle.com')
        .replace('abudhabi.dubizzle.com', 'uae.dubizzle.com');
      Linking.openURL(fixedLink);
    }
  };

  const searchCars = async (keyword) => {
    if (!keyword) return;
    setLoading(true);
    setCars([]);
    setShowFilters(false);
    setShowPicker(false);
    setActiveTab('home');
    try {
      const params = new URLSearchParams({ q: keyword });
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (selectedCity) params.append('city', selectedCity);
      if (yearFrom) params.append('yearFrom', yearFrom);
      if (yearTo) params.append('yearTo', yearTo);
      if (kmFrom) params.append('kmFrom', kmFrom);
      if (kmTo) params.append('kmTo', kmTo);

      const response = await fetch(API_URL + '/search?' + params.toString());
      const data = await response.json();
      const results = Array.isArray(data) ? data : [];
      setCars(results);

      results.forEach(async (car, index) => {
        try {
          const evalResponse = await fetch(API_URL + '/evaluate?name=' + encodeURIComponent(car.name || '') + '&price=' + (car.price || 0));
          const evalData = await evalResponse.json();
          setCars(prev => prev.map((c, i) => i === index ? { ...c, evaluation: evalData.evaluation } : c));
        } catch (e) {}
      });
    } catch (e) {}
    setLoading(false);
  };

  const resetFilters = () => {
    setMinPrice(''); setMaxPrice('');
    setSelectedCity('');
    setYearFrom(''); setYearTo('');
    setKmFrom(''); setKmTo('');
    setSelectedColor('');
  };

  const activeFiltersCount = [
    minPrice || maxPrice,
    selectedCity,
    yearFrom || yearTo,
    kmFrom || kmTo,
    selectedColor
  ].filter(Boolean).length;

  const getEvalColor = (ev) => {
    if (!ev) return '#999';
    if (ev.includes('رخيص') || ev.toLowerCase().includes('cheap')) return '#22C55E';
    if (ev.includes('غالي') || ev.toLowerCase().includes('expensive')) return '#EF4444';
    return '#F59E0B';
  };
  const getEvalBg = (ev) => {
    if (!ev) return '#F3F4F6';
    if (ev.includes('رخيص') || ev.toLowerCase().includes('cheap')) return '#DCFCE7';
    if (ev.includes('غالي') || ev.toLowerCase().includes('expensive')) return '#FEE2E2';
    return '#FEF3C7';
  };
  const getEvalEmoji = (ev) => {
    if (!ev) return '⏳';
    if (ev.includes('رخيص') || ev.toLowerCase().includes('cheap')) return '🟢';
    if (ev.includes('غالي') || ev.toLowerCase().includes('expensive')) return '🔴';
    return '🟡';
  };

  const renderHome = () => (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.searchTrigger} onPress={() => setShowPicker(true)}>
        <Text style={styles.searchTriggerText}>
          {selectedModel ? `${selectedTypeData?.icon} ${selectedBrand?.label} — ${selectedModel}` : selectedBrand ? `${selectedTypeData?.icon} ${selectedBrand?.label}` : t.searchPlaceholder}
        </Text>
        <Text style={styles.searchArrow}>▼</Text>
      </TouchableOpacity>

      {activeFiltersCount > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFilters}>
          {selectedCity ? <View style={styles.activeChip}><Text style={styles.activeChipText}>📍 {selectedCity}</Text></View> : null}
          {(minPrice || maxPrice) ? <View style={styles.activeChip}><Text style={styles.activeChipText}>💰 {minPrice || '0'} - {maxPrice || '∞'}</Text></View> : null}
          {(yearFrom || yearTo) ? <View style={styles.activeChip}><Text style={styles.activeChipText}>📅 {yearFrom} - {yearTo}</Text></View> : null}
          <TouchableOpacity style={styles.clearChip} onPress={resetFilters}><Text style={styles.clearChipText}>✕</Text></TouchableOpacity>
        </ScrollView>
      )}

      {loading && <View style={styles.loadingBox}><ActivityIndicator size="large" color="#6366F1" /><Text style={styles.loadingText}>{t.searching}</Text></View>}

      {!loading && cars.length > 0 && (
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={() => { setCars([]); setSelectedBrand(null); setSelectedModel(null); }}>
            <Text style={styles.backBtn}>{t.back}</Text>
          </TouchableOpacity>
          <View style={styles.resultsRight}>
            <Text style={styles.resultsCount}>{cars.length} {t.results}</Text>
            <TouchableOpacity style={styles.saveSearchBtn} onPress={saveSearch}>
              <Text style={styles.saveSearchText}>{t.saveSearch}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!loading && cars.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{t.emptySub}</Text>
        </View>
      )}

      <FlatList
        data={cars}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openListing(item.link)}>
            <Text style={styles.carName}>{item.name}</Text>
            <Text style={styles.carPrice}>{item.price > 0 ? `AED ${item.price?.toLocaleString()}` : t.contactForPrice}</Text>
            {item.evaluation ? (
              <View style={[styles.evalBox, { backgroundColor: getEvalBg(item.evaluation) }]}>
                <Text style={[styles.evalText, { color: getEvalColor(item.evaluation) }]}>{getEvalEmoji(item.evaluation)} {item.evaluation}</Text>
              </View>
            ) : (
              <View style={styles.evalBoxLoading}><Text style={styles.evalLoadingText}>⏳ {t.analyzing}</Text></View>
            )}
            <View style={styles.chipsRow}>
              {item.city ? <View style={styles.detailChip}><Text style={styles.detailChipText}>📍 {item.city}</Text></View> : null}
              {item.year ? <View style={styles.detailChip}><Text style={styles.detailChipText}>📅 {item.year}</Text></View> : null}
              {item.km ? <View style={styles.detailChip}><Text style={styles.detailChipText}>🛣️ {item.km?.toLocaleString()} km</Text></View> : null}
            </View>
            <Text style={styles.tapHint}>{t.openListing}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderSaved = () => (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={styles.sectionTitle}>{t.savedSearches}</Text>
      {loadingSaved ? <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} /> :
        savedSearches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>{t.noSaved}</Text>
            <Text style={styles.emptySubtitle}>{t.noSavedSub}</Text>
          </View>
        ) : (
          <FlatList
            data={savedSearches}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 80 }}
            renderItem={({ item }) => (
              <View style={styles.savedCard}>
                <View style={styles.savedCardHeader}>
                  <TouchableOpacity onPress={() => deleteSearch(item.id)}><Text style={styles.deleteBtn}>🗑️</Text></TouchableOpacity>
                  <Text style={styles.savedCardTitle}>{item.brandLabel} {item.model || ''}</Text>
                </View>
                <View style={styles.chipsRow}>
                  {item.city ? <View style={styles.detailChip}><Text style={styles.detailChipText}>📍 {item.city}</Text></View> : null}
                  {(item.minPrice || item.maxPrice) ? <View style={styles.detailChip}><Text style={styles.detailChipText}>💰 {item.minPrice || '0'} - {item.maxPrice || '∞'}</Text></View> : null}
                  {(item.yearFrom || item.yearTo) ? <View style={styles.detailChip}><Text style={styles.detailChipText}>📅 {item.yearFrom} - {item.yearTo}</Text></View> : null}
                </View>
                <TouchableOpacity style={styles.searchAgainBtn} onPress={() => {
                  setSelectedBrand({ value: item.brand, label: item.brandLabel });
                  setSelectedModel(item.model);
                  setMinPrice(item.minPrice || ''); setMaxPrice(item.maxPrice || '');
                  setYearFrom(item.yearFrom || ''); setYearTo(item.yearTo || '');
                  searchCars(item.model ? item.brand + ' ' + item.model : item.brand);
                }}>
                  <Text style={styles.searchAgainText}>{t.searchNow}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.langBtn} onPress={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setSelectedCity(''); }}>
          <Text style={styles.langBtnText}>{lang === 'ar' ? 'En' : 'ع'}</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>🔍 {t.appName}</Text>
        <TouchableOpacity style={[styles.filterIconBtn, activeFiltersCount > 0 && styles.filterIconActive]} onPress={() => setShowFilters(true)}>
          <Text style={styles.filterIconText}>⚙️</Text>
          {activeFiltersCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{activeFiltersCount}</Text></View>}
        </TouchableOpacity>
      </View>

      {activeTab === 'home' && renderHome()}
      {activeTab === 'saved' && renderSaved()}

      <View style={styles.bottomNav}>
        {[
          { id: 'home', icon: '🏠', label: t.home },
          { id: 'search', icon: '🔍', label: t.search },
          { id: 'saved', icon: '🔖', label: t.saved },
          { id: 'settings', icon: '⚙️', label: t.settings },
        ].map(tab => (
          <TouchableOpacity key={tab.id} style={styles.navItem} onPress={() => { setActiveTab(tab.id); if (tab.id === 'search') setShowPicker(true); }}>
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectVehicle}</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.typeTabs}>
              {vehicleTypes.map(type => (
                <TouchableOpacity key={type.id} style={[styles.typeTab, selectedType === type.id && styles.typeTabActive]} onPress={() => { setSelectedType(type.id); setSelectedBrand(null); setSelectedModel(null); }}>
                  <Text style={styles.typeTabIcon}>{type.icon}</Text>
                  <Text style={[styles.typeTabLabel, selectedType === type.id && styles.typeTabLabelActive]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.twoCol}>
              <ScrollView style={styles.colLeft} showsVerticalScrollIndicator={false}>
                <Text style={styles.colTitle}>{t.brand}</Text>
                {brands.map(brand => (
                  <TouchableOpacity key={brand.value} style={[styles.brandItem, selectedBrand?.value === brand.value && styles.brandItemActive]} onPress={() => { setSelectedBrand(brand); setSelectedModel(null); }}>
                    <Text style={[styles.brandItemText, selectedBrand?.value === brand.value && styles.brandItemTextActive]}>{brand.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.colRight} showsVerticalScrollIndicator={false}>
                <Text style={styles.colTitle}>{t.model}</Text>
                {selectedBrand ? (
                  <>
                    <TouchableOpacity style={[styles.modelItem, !selectedModel && styles.modelItemActive]} onPress={() => { setSelectedModel(null); searchCars(selectedBrand.value); }}>
                      <Text style={[styles.modelItemText, !selectedModel && styles.modelItemTextActive]}>{t.allModels}</Text>
                    </TouchableOpacity>
                    {models.map(model => (
                      <TouchableOpacity key={model} style={[styles.modelItem, selectedModel === model && styles.modelItemActive]} onPress={() => { setSelectedModel(model); searchCars(selectedBrand.value + ' ' + model); }}>
                        <Text style={[styles.modelItemText, selectedModel === model && styles.modelItemTextActive]}>{model}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : <Text style={styles.selectBrandHint}>{t.selectBrand}</Text>}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={resetFilters}><Text style={styles.resetText}>{t.reset}</Text></TouchableOpacity>
                <Text style={styles.modalTitle}>{t.searchFilters}</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>{t.budget}</Text>
              <View style={styles.rangeRow}>
                <TextInput style={styles.rangeInput} placeholder={t.to} value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" textAlign="center" placeholderTextColor="#AAA" />
                <Text style={styles.rangeDash}>—</Text>
                <TextInput style={styles.rangeInput} placeholder={t.from} value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" textAlign="center" placeholderTextColor="#AAA" />
              </View>

              <Text style={styles.filterLabel}>{t.year}</Text>
              <View style={styles.rangeRow}>
                <TextInput style={styles.rangeInput} placeholder={t.to} value={yearTo} onChangeText={setYearTo} keyboardType="numeric" textAlign="center" placeholderTextColor="#AAA" maxLength={4} />
                <Text style={styles.rangeDash}>—</Text>
                <TextInput style={styles.rangeInput} placeholder={t.from} value={yearFrom} onChangeText={setYearFrom} keyboardType="numeric" textAlign="center" placeholderTextColor="#AAA" maxLength={4} />
              </View>

              <Text style={styles.filterLabel}>{t.km}</Text>
              <View style={styles.rangeRow}>
                <TextInput style={styles.rangeInput} placeholder={t.to} value={kmTo} onChangeText={setKmTo} keyboardType="numeric" textAlign="center" placeholderTextColor="#AAA" />
                <Text style={styles.rangeDash}>—</Text>
                <TextInput style={styles.rangeInput} placeholder={t.from} value={kmFrom} onChangeText={setKmFrom} keyboardType="numeric" textAlign="center" placeholderTextColor="#AAA" />
              </View>

              <Text style={styles.filterLabel}>{t.city}</Text>
              <View style={styles.chipsRow}>
                {cities.map(city => (
                  <TouchableOpacity key={city} style={[styles.chip, selectedCity === city && styles.chipActive]} onPress={() => setSelectedCity(selectedCity === city ? '' : city)}>
                    <Text style={[styles.chipText, selectedCity === city && styles.chipTextActive]}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>{t.color}</Text>
              <View style={styles.colorsGrid}>
                {colorList.map((color, index) => (
                  <TouchableOpacity key={color} style={styles.colorItem} onPress={() => setSelectedColor(selectedColor === color ? '' : color)}>
                    <View style={[styles.colorCircle, { backgroundColor: COLOR_HEX[index] }, COLOR_HEX[index] === '#FFFFFF' && styles.colorCircleWhite, selectedColor === color && styles.colorCircleActive]} />
                    <Text style={[styles.colorLabel, selectedColor === color && styles.colorLabelActive]}>{color}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={() => { setShowFilters(false); if (selectedBrand) searchCars(selectedModel ? selectedBrand.value + ' ' + selectedModel : selectedBrand.value); }}>
                <Text style={styles.applyBtnText}>{t.applySearch}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#1E1E2E' },
  langBtn: { backgroundColor: '#6366F1', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, minWidth: 40, alignItems: 'center' },
  langBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  filterIconBtn: { padding: 10, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  filterIconActive: { backgroundColor: '#EEF2FF' },
  filterIconText: { fontSize: 20 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#6366F1', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  searchTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchTriggerText: { color: '#555', fontSize: 15, flex: 1, textAlign: 'right' },
  searchArrow: { color: '#6366F1', fontSize: 12, marginLeft: 8 },
  activeFilters: { paddingHorizontal: 20, marginBottom: 10 },
  activeChip: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: '#C7D2FE' },
  activeChipText: { color: '#6366F1', fontSize: 12, fontWeight: '600' },
  clearChip: { backgroundColor: '#FEE2E2', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  clearChipText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  loadingBox: { alignItems: 'center', marginTop: 60 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  backBtn: { color: '#6366F1', fontSize: 14, fontWeight: '600' },
  resultsRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultsCount: { color: '#888', fontSize: 13 },
  saveSearchBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  saveSearchText: { color: '#6366F1', fontSize: 12, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1E2E', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: 'white', marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  carName: { color: '#1E1E2E', fontSize: 15, fontWeight: 'bold', marginBottom: 6, textAlign: 'right' },
  carPrice: { color: '#6366F1', fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginBottom: 10 },
  evalBox: { borderRadius: 10, padding: 10, marginBottom: 10 },
  evalText: { fontSize: 13, fontWeight: '600', textAlign: 'right', lineHeight: 20 },
  evalBoxLoading: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, marginBottom: 10 },
  evalLoadingText: { color: '#999', fontSize: 13, textAlign: 'right' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  detailChip: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  detailChipText: { color: '#666', fontSize: 12 },
  tapHint: { color: '#CCC', fontSize: 11, textAlign: 'left', marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E1E2E', marginBottom: 16, textAlign: 'right' },
  savedCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  savedCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  savedCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1E2E' },
  deleteBtn: { fontSize: 20 },
  searchAgainBtn: { backgroundColor: '#6366F1', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10 },
  searchAgainText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', paddingVertical: 10, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 10 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 11, color: '#AAA', marginTop: 2 },
  navLabelActive: { color: '#6366F1', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#1E1E2E', fontSize: 18, fontWeight: 'bold' },
  resetText: { color: '#6366F1', fontSize: 14 },
  closeText: { color: '#888', fontSize: 18 },
  typeTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeTab: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: 'transparent' },
  typeTabActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  typeTabIcon: { fontSize: 24, marginBottom: 4 },
  typeTabLabel: { fontSize: 11, color: '#888' },
  typeTabLabelActive: { color: '#6366F1', fontWeight: 'bold' },
  twoCol: { flexDirection: 'row', height: 380, gap: 8 },
  colLeft: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 12, padding: 8 },
  colRight: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 12, padding: 8 },
  colTitle: { fontSize: 12, color: '#888', fontWeight: '600', textAlign: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  brandItem: { padding: 8, borderRadius: 8, marginBottom: 3 },
  brandItemActive: { backgroundColor: '#6366F1' },
  brandItemText: { fontSize: 11, color: '#444', textAlign: 'center' },
  brandItemTextActive: { color: 'white', fontWeight: 'bold' },
  modelItem: { padding: 8, borderRadius: 8, marginBottom: 3 },
  modelItemActive: { backgroundColor: '#6366F1' },
  modelItemText: { fontSize: 12, color: '#444', textAlign: 'center' },
  modelItemTextActive: { color: 'white', fontWeight: 'bold' },
  selectBrandHint: { color: '#CCC', fontSize: 13, textAlign: 'center', marginTop: 20 },
  filterLabel: { color: '#888', fontSize: 12, marginBottom: 10, textAlign: 'right', fontWeight: '600' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  rangeInput: { flex: 1, backgroundColor: '#F3F4F6', color: '#1E1E2E', padding: 12, borderRadius: 10, fontSize: 13, borderWidth: 1, borderColor: '#E5E7EB' },
  rangeDash: { color: '#CCC', fontSize: 16 },
  chip: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { color: '#666', fontSize: 12 },
  chipTextActive: { color: 'white', fontWeight: 'bold' },
  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  colorItem: { alignItems: 'center', width: 50 },
  colorCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#E5E7EB', marginBottom: 4 },
  colorCircleWhite: { borderColor: '#CCC' },
  colorCircleActive: { borderColor: '#6366F1', borderWidth: 3 },
  colorLabel: { color: '#888', fontSize: 9, textAlign: 'center' },
  colorLabelActive: { color: '#6366F1', fontWeight: 'bold' },
  applyBtn: { backgroundColor: '#6366F1', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
  applyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});