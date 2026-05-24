import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView, Modal,
  Alert, Linking, Image, StatusBar, Share, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { db, collection, addDoc, getDocs, deleteDoc, doc } from '../firebase';
import { registerForPushNotifications, setupNotificationHandler } from '../notifications';

const API_URL = 'https://skoop-production.up.railway.app';

// ===== THEME COLORS =====
const LIGHT = {
  hdrBg: '#26215C', bg: '#F8F6FF', card: '#FFFFFF', cardBorder: '#E8E4FF',
  textPrimary: '#26215C', textSecondary: '#534AB7', textMuted: '#9B96CC',
  navy: '#534AB7', navyDark: '#26215C', blue: '#534AB7', blueLight: '#AFA9EC',
  tagBg: '#F0EEFF', tagText: '#3C3489', inputBg: '#F0EEFF',
  navBg: '#FFFFFF', navBorder: '#E8E4FF',
  searchBg: 'rgba(255,255,255,0.15)', searchBorder: 'rgba(255,255,255,0.25)',
  chipBg: '#F0EEFF', chipBorder: '#C4BCE8', chipActiveBg: '#26215C',
  modalBg: '#FFFFFF',
  activeGreen: '#16A34A', activeGreenBg: '#DCFCE7',
  activeRed: '#DC2626', activeRedBg: '#FEE2E2',
  activeYellow: '#F59E0B', activeYellowBg: '#FEF3C7',
  compareBg: '#FFFFFF', compareHdr: '#26215C', compareFoot: '#26215C',
  compareFootBtn: '#534AB7', compareRow: '#F8F6FF',
  toggleOn: '#534AB7', toggleOff: '#D1D1D6',
  dealCardBg: '#26215C', dealCardBorder: '#534AB7',
  heartActive: '#DC2626', heartInactive: '#9B96CC',
};

const DARK = {
  hdrBg: '#120D2E', bg: '#0D0A1E', card: '#1E1545', cardBorder: '#3C3489',
  textPrimary: '#EEEDFE', textSecondary: '#AFA9EC', textMuted: '#534AB7',
  navy: '#7F77DD', navyDark: '#534AB7', blue: '#7F77DD', blueLight: '#AFA9EC',
  tagBg: '#120D2E', tagText: '#AFA9EC', inputBg: '#1E1545',
  navBg: '#120D2E', navBorder: '#2A1F5A',
  searchBg: 'rgba(255,255,255,0.08)', searchBorder: 'rgba(255,255,255,0.15)',
  chipBg: '#1E1545', chipBorder: '#3C3489', chipActiveBg: '#534AB7',
  modalBg: '#1E1545',
  activeGreen: '#4ADE80', activeGreenBg: '#0D2E1A',
  activeRed: '#F09595', activeRedBg: '#2E0D0D',
  activeYellow: '#FCD34D', activeYellowBg: '#2E200D',
  compareBg: '#1E1545', compareHdr: '#26215C', compareFoot: '#26215C',
  compareFootBtn: '#534AB7', compareRow: '#120D2E',
  toggleOn: '#534AB7', toggleOff: '#2A1F5A',
  dealCardBg: '#1E1545', dealCardBorder: '#7F77DD',
  heartActive: '#F09595', heartInactive: '#534AB7',
};

const PLATFORMS = [
  { id: 'all',        label: 'الكل',       labelEn: 'All',         emoji: '✅' },
  { id: 'Scoop',      label: 'سكوب',       labelEn: 'Scoop',       emoji: '🟣' },
  { id: 'Dubizzle',   label: 'دبيزل',      labelEn: 'Dubizzle',    emoji: '🔵' },
  { id: 'YallaMotor', label: 'يلا موتور',  labelEn: 'YallaMotor',  emoji: '🟠' },
  { id: 'DubiCars',   label: 'دوبي كارز',  labelEn: 'DubiCars',    emoji: '🟢' },
  { id: 'OpenSooq',   label: 'أوبن سوق',   labelEn: 'OpenSooq',    emoji: '🟡' },
  { id: 'Instagram',  label: 'انستقرام',   labelEn: 'Instagram',   emoji: '📸' },
];

// ===== فلاتر جديدة =====
const FUEL_TYPES = [
  { id: 'petrol',   label: 'بنزين',   labelEn: 'Petrol',   emoji: '⛽' },
  { id: 'diesel',   label: 'ديزل',    labelEn: 'Diesel',   emoji: '🛢️' },
  { id: 'electric', label: 'كهرباء',  labelEn: 'Electric', emoji: '⚡' },
  { id: 'hybrid',   label: 'هايبرد',  labelEn: 'Hybrid',   emoji: '🔋' },
];

const CONDITIONS = [
  { id: 'new',  label: 'جديد',    labelEn: 'New',  emoji: '✨' },
  { id: 'used', label: 'مستعمل',  labelEn: 'Used', emoji: '🚗' },
];

// ===== LOGO ثابت =====
const LogoWhite = ({ width = 140, height = 34 }) => (
  <Svg width={width} height={height} viewBox="0 0 420 100">
    <Line x1="10" y1="22" x2="62" y2="22" stroke="#378ADD" strokeWidth="5" strokeLinecap="round"/>
    <Line x1="4"  y1="38" x2="62" y2="38" stroke="#7EC8F5" strokeWidth="5" strokeLinecap="round"/>
    <Line x1="10" y1="54" x2="62" y2="54" stroke="#378ADD" strokeWidth="5" strokeLinecap="round"/>
    <Line x1="20" y1="70" x2="62" y2="70" stroke="#185FA5" strokeWidth="5" strokeLinecap="round"/>
    <Line x1="72" y1="10" x2="72" y2="90" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <Circle cx="118" cy="46" r="28" fill="none" stroke="white" strokeWidth="7"/>
    <Line x1="138" y1="67" x2="158" y2="87" stroke="white" strokeWidth="7" strokeLinecap="round"/>
    <Circle cx="118" cy="46" r="11" fill="#378ADD" opacity="0.8"/>
    <SvgText x="172" y="56" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="40" fill="white">SCOOP</SvgText>
    <SvgText x="235" y="78" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill="#7EC8F5" letterSpacing="2" textAnchor="middle">UAE</SvgText>
  </Svg>
);

const TRANSLATIONS = {
  ar: {
    home: 'الرئيسية', results_tab: 'نتائج', saved: 'المحفوظة',
    favorites: 'إعجاب', settings: 'إعدادات', results: 'نتيجة',
    back: 'رجوع', saveSearch: 'حفظ البحث',
    searchNow: 'بحث الآن', emptyTitle: 'إنشاء بحث جديد',
    emptySub: 'سنضع أحدث الإعلانات هنا فور نشرها في المنصات',
    analyzing: 'جاري تحليل السعر...', contactForPrice: 'السعر عند التواصل',
    openListing: 'فتح الإعلان', searching: 'جاري البحث...',
    searchingInstagram: 'جاري البحث في انستقرام...',
    selectBrand: 'اختر الشركة', selectVehicle: 'إنشاء بحث',
    brand: 'الشركة', model: 'الموديل', allModels: 'كل الموديلات',
    cars: 'سيارات', motorcycles: 'دراجات', boats: 'قوارب',
    budget: 'الميزانية (درهم)', year: 'سنة الصنع', km: 'الكيلومترات',
    city: 'المدينة', color: 'اللون', platform: 'المنصة',
    applySearch: 'بحث الآن', reset: 'إعادة تعيين',
    searchFilters: 'فلاتر البحث', from: 'من', to: 'إلى',
    savedSuccess: 'تم حفظ البحث!', savedTitle: 'تم',
    errorTitle: 'خطأ', errorSave: 'لم يتم الحفظ',
    editFeed: 'تعديل', createSearch: '+ إنشاء بحث',
    activeSearches: 'البحوث المحفوظة', helpCenter: 'مساعدة',
    active: '● نشط', all: 'الكل', filtered: 'مفلتر', featured: 'مميز',
    darkMode: 'الوضع الداكن', darkModeSub: 'يحمي العيون في الإضاءة المنخفضة',
    lightMode: 'الوضع الفاتح', appearance: 'المظهر',
    selectPlatform: 'اختر منصة البحث',
    comparePlatforms: 'مقارنة المنصات',
    cheapest: 'الأرخص', saveWith: 'توفر', openCheapest: 'افتح الأرخص',
    searchPlaceholder: 'ابحث مباشرة... مثال: باترول 2022',
    dealOfDay: 'صفقة اليوم 🔥', dealSub: 'أفضل سعر الآن',
    shareCar: 'شارك السيارة',
    onboardingTitle: 'نبحث لك في أكثر من منصة دفعة واحدة',
    onboardingSub: 'دبيزل · انستقرام · والمزيد قريباً 🚀',
    onboardingBtn: 'ابدأ البحث',
    searchName: 'اسم البحث (اختياري)',
    searchNamePlaceholder: 'مثال: باترول للعمل',
    saveAndSearch: 'احفظ وابحث',
    favoritesEmpty: 'لا توجد إعلانات محفوظة',
    favoritesEmptySub: 'اضغط ♡ على أي إعلان لحفظه هنا',
    advancedFilters: 'فلاتر متقدمة',
    yearRange: 'سنة الصنع',
    priceRange: 'الميزانية (درهم)',
    deleteConfirm: 'حذف البحث؟',
    condition: 'الحالة',
    fuelType: 'نوع الوقود',
    selectModelHint: 'اختر الموديل',
    selectBrandFirst: 'اختر الشركة أولاً',
    searchBrand: 'ابحث في الشركات...',
  },
  en: {
    home: 'Home', results_tab: 'Results', saved: 'Saved',
    favorites: 'Liked', settings: 'Settings', results: 'results',
    back: 'Back', saveSearch: 'Save Search',
    searchNow: 'Search Now', emptyTitle: 'Create New Search',
    emptySub: "We'll drop new listings here the second they're posted",
    analyzing: 'Analyzing price...', contactForPrice: 'Contact for price',
    openListing: 'Open Listing', searching: 'Searching...',
    searchingInstagram: 'Searching Instagram...',
    selectBrand: 'Select Brand', selectVehicle: 'Create Search',
    brand: 'Brand', model: 'Model', allModels: 'All Models',
    cars: 'Cars', motorcycles: 'Motorcycles', boats: 'Boats',
    budget: 'Budget (AED)', year: 'Year', km: 'Mileage',
    city: 'City', color: 'Color', platform: 'Platform',
    applySearch: 'Search Now', reset: 'Reset',
    searchFilters: 'Search Filters', from: 'From', to: 'To',
    savedSuccess: 'Search saved!', savedTitle: 'Saved',
    errorTitle: 'Error', errorSave: 'Could not save',
    editFeed: 'Edit', createSearch: '+ Create Search',
    activeSearches: 'Saved Searches', helpCenter: 'Help',
    active: '● Active', all: 'All', filtered: 'Filtered', featured: 'Featured',
    darkMode: 'Dark Mode', darkModeSub: 'Protects eyes in low light',
    lightMode: 'Light Mode', appearance: 'Appearance',
    selectPlatform: 'Select Search Platform',
    comparePlatforms: 'Platform Comparison',
    cheapest: 'Cheapest', saveWith: 'Save', openCheapest: 'Open Cheapest',
    searchPlaceholder: 'Search directly... e.g. Patrol 2022',
    dealOfDay: "Today's Deal 🔥", dealSub: 'Best price now',
    shareCar: 'Share Car',
    onboardingTitle: 'We search multiple platforms at once',
    onboardingSub: 'Dubizzle · Instagram · more coming soon 🚀',
    onboardingBtn: 'Start Searching',
    searchName: 'Search name (optional)',
    searchNamePlaceholder: 'e.g. Patrol for work',
    saveAndSearch: 'Save & Search',
    favoritesEmpty: 'No saved listings',
    favoritesEmptySub: 'Tap ♡ on any listing to save it here',
    advancedFilters: 'Advanced Filters',
    yearRange: 'Year Range',
    priceRange: 'Price Range (AED)',
    deleteConfirm: 'Delete search?',
    condition: 'Condition',
    fuelType: 'Fuel Type',
    selectModelHint: 'Select Model',
    selectBrandFirst: 'Select brand first',
    searchBrand: 'Search brands...',
  }
};

const CITIES = {
  ar: ['الكل','دبي','أبوظبي','الشارقة','عجمان','رأس الخيمة','الفجيرة','أم القيوين','العين'],
  en: ['All','Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain','Al Ain'],
};

const BRANDS_DATA = {
  cars: [
    { label: 'تويوتا / Toyota', value: 'toyota', models: ['Land Cruiser','Prado','Camry','Corolla','Hilux','Yaris','RAV4','Fortuner','Highlander','Avalon','C-HR','Rush','Sequoia','Tundra','4Runner','Venza','Crown'] },
    { label: 'نيسان / Nissan', value: 'nissan', models: ['Patrol','Altima','Sunny','X-Trail','Murano','Armada','Navara','Juke','Kicks','Maxima','Pathfinder','GT-R','Z','370Z','Sentra','Leaf'] },
    { label: 'هوندا / Honda', value: 'honda', models: ['Civic','Accord','CR-V','HR-V','Pilot','Odyssey','Jazz','City','Fit','Passport'] },
    { label: 'مرسيدس / Mercedes', value: 'mercedes', models: ['C200','C300','E200','E300','E350','S400','S500','S580','GLA','GLB','GLC','GLE','GLS','G63','AMG GT','CLA','CLS','EQS','Maybach'] },
    { label: 'بي ام دبليو / BMW', value: 'bmw', models: ['318i','320i','330i','340i','520i','530i','540i','730i','740i','750i','X1','X3','X4','X5','X6','X7','M3','M5','i4','iX'] },
    { label: 'لكزس / Lexus', value: 'lexus', models: ['ES250','ES300h','ES350','IS250','IS350','LS460','LS500','GX460','LX570','LX600','RX350','RX450h','NX300','LC500'] },
    { label: 'كيا / Kia', value: 'kia', models: ['Sorento','Sportage','Optima','Stinger','Cerato','Rio','Carnival','Telluride','EV6','Niro','Soul','Seltos','K5'] },
    { label: 'هيونداي / Hyundai', value: 'hyundai', models: ['Sonata','Elantra','Tucson','Santa Fe','Creta','Azera','Staria','Palisade','Ioniq 5','Ioniq 6','Kona'] },
    { label: 'فورد / Ford', value: 'ford', models: ['Explorer','F-150','Mustang','Edge','Expedition','Ranger','Bronco','Escape','Fusion','Maverick'] },
    { label: 'شيفروليه / Chevrolet', value: 'chevrolet', models: ['Tahoe','Suburban','Traverse','Malibu','Camaro','Caprice','Colorado','Silverado','Blazer','Corvette'] },
    { label: 'جيب / Jeep', value: 'jeep', models: ['Wrangler','Grand Cherokee','Cherokee','Compass','Gladiator','Wagoneer'] },
    { label: 'رنج روفر / Range Rover', value: 'range rover', models: ['Vogue','Sport','Evoque','Velar','Defender','Discovery'] },
    { label: 'بورش / Porsche', value: 'porsche', models: ['Cayenne','911','Panamera','Macan','Taycan','Boxster','Cayman'] },
    { label: 'اودي / Audi', value: 'audi', models: ['A3','A4','A5','A6','A7','A8','Q3','Q5','Q7','Q8','RS3','RS6','RS7','e-tron'] },
    { label: 'ميتسوبيشي / Mitsubishi', value: 'mitsubishi', models: ['Pajero','L200','Outlander','Eclipse Cross','Lancer','ASX'] },
    { label: 'انفينيتي / Infiniti', value: 'infiniti', models: ['QX80','QX60','QX55','QX50','Q50','Q60'] },
    { label: 'مازدا / Mazda', value: 'mazda', models: ['CX-3','CX-5','CX-8','CX-9','CX-90','Mazda 3','Mazda 6','MX-5'] },
    { label: 'فولكس / Volkswagen', value: 'volkswagen', models: ['Passat','Golf','Tiguan','Touareg','Polo','Jetta','Teramont'] },
    { label: 'جي ام سي / GMC', value: 'gmc', models: ['Yukon','Yukon XL','Sierra','Terrain','Canyon','Acadia'] },
    { label: 'دودج / Dodge', value: 'dodge', models: ['Challenger','Charger','Durango','Ram 1500','Ram 2500'] },
    { label: 'تسلا / Tesla', value: 'tesla', models: ['Model 3','Model S','Model X','Model Y','Cybertruck'] },
    { label: 'لامبورغيني / Lamborghini', value: 'lamborghini', models: ['Urus','Huracan','Aventador','Revuelto'] },
    { label: 'فيراري / Ferrari', value: 'ferrari', models: ['Roma','Portofino','F8','SF90','812','Purosangue'] },
    { label: 'بنتلي / Bentley', value: 'bentley', models: ['Bentayga','Continental GT','Flying Spur','Mulsanne'] },
    { label: 'رولز رويس / Rolls Royce', value: 'rolls royce', models: ['Ghost','Phantom','Wraith','Dawn','Cullinan'] },
    { label: 'BYD', value: 'byd', models: ['Atto 3','Han','Tang','Song','Dolphin','Seal'] },
    { label: 'هافال / Haval', value: 'haval', models: ['H6','H9','Jolion','Big Dog','Dargo'] },
    { label: 'MG', value: 'mg', models: ['MG5','MG6','ZS','HS','RX5','Cyberster'] },
    { label: 'سوزوكي / Suzuki', value: 'suzuki', models: ['Vitara','Swift','Jimny','Ignis','Baleno','Ertiga'] },
    { label: 'كاديلاك / Cadillac', value: 'cadillac', models: ['Escalade','CT5','CT6','XT4','XT5','XT6'] },
    { label: 'هامر / Hummer', value: 'hummer', models: ['H1','H2','H3','EV'] },
    { label: 'جينيسيس / Genesis', value: 'genesis', models: ['G70','G80','G90','GV70','GV80'] },
  ],
  motorcycles: [
    { label: 'هوندا / Honda', value: 'honda motorcycle', models: ['CBR600RR','CBR1000RR','CRF450','PCX150','Forza','Africa Twin','CB500','Gold Wing'] },
    { label: 'ياماها / Yamaha', value: 'yamaha motorcycle', models: ['R1','R3','R6','MT-07','MT-09','MT-10','XMAX','NMAX','TMAX'] },
    { label: 'كاواساكي / Kawasaki', value: 'kawasaki', models: ['Ninja 400','Ninja 650','Ninja ZX-6R','Ninja ZX-10R','Z400','Z900'] },
    { label: 'سوزوكي / Suzuki', value: 'suzuki motorcycle', models: ['GSX-R600','GSX-R1000','Hayabusa','V-Strom','Burgman'] },
    { label: 'KTM', value: 'ktm', models: ['Duke 125','Duke 390','Duke 690','RC390','EXC'] },
    { label: 'دوكاتي / Ducati', value: 'ducati', models: ['Panigale V4','Monster','Diavel','Scrambler','Multistrada'] },
    { label: 'هارلي / Harley Davidson', value: 'harley davidson', models: ['Sportster','Fat Boy','Road King','Softail','Street Glide'] },
  ],
  boats: [
    { label: 'قوارب بخارية', value: 'motorboat', models: ['Speedboat','Fishing Boat','Cruiser','Powerboat'] },
    { label: 'جيتسكي / Jet Ski', value: 'jet ski', models: ['Yamaha WaveRunner','Kawasaki Jet Ski','Sea-Doo'] },
    { label: 'يخوت / Yachts', value: 'yacht', models: ['Luxury Yacht','Sport Yacht','Motor Yacht'] },
  ],
};

const COLOR_HEX = ['#FFFFFF','#111111','#888888','#C0C0C0','#C0392B','#2980B9','#85C1E9','#27AE60','#F39C12','#D4B896','#7B4F2E','#E67E22','#8E44AD','#F1948A','#F4D03F','#922B21'];
const COLORS = {
  ar: ['أبيض','أسود','رمادي','فضي','أحمر','أزرق','أزرق فاتح','أخضر','ذهبي','بيج','بني','برتقالي','بنفسجي','وردي','أصفر','عنابي'],
  en: ['White','Black','Gray','Silver','Red','Blue','Light Blue','Green','Gold','Beige','Brown','Orange','Purple','Pink','Yellow','Maroon'],
};

const SOURCE_COLORS_LIGHT = {
  'Dubizzle': '#EBF0FF', 'YallaMotor': '#FFF3E0',
  'DubiCars': '#E8F5E9', 'OpenSooq': '#FCE4EC',
  'Instagram': '#F3E8FF', 'Scoop': '#EEEDFE',
};
const SOURCE_COLORS_DARK = {
  'Dubizzle': '#0d1535', 'YallaMotor': '#1a1200',
  'DubiCars': '#0d1a10', 'OpenSooq': '#1a0d12',
  'Instagram': '#150d2a', 'Scoop': '#1a1545',
};
const SOURCE_TEXT = {
  'Dubizzle': '#1565C0', 'YallaMotor': '#E65100',
  'DubiCars': '#2E7D32', 'OpenSooq': '#AD1457',
  'Instagram': '#7C3AED', 'Scoop': '#534AB7',
};

const Toggle = ({ value, onToggle }) => (
  <TouchableOpacity
    onPress={onToggle}
    style={{ width: 50, height: 28, borderRadius: 14, backgroundColor: value ? '#534AB7' : '#D1D1D6', justifyContent: 'center', padding: 2 }}
  >
    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: value ? 22 : 0 }] }} />
  </TouchableOpacity>
);

export default function Index() {
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState('ar');
  const [isDark, setIsDark] = useState(false);
  const CT = isDark ? DARK : LIGHT;
  const t = TRANSLATIONS[lang];
  const cities = CITIES[lang];
  const colorList = COLORS[lang];

  const [activeTab, setActiveTab] = useState('home');
  const [feedTab, setFeedTab] = useState('all');
  const [showPicker, setShowPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [selectedType, setSelectedType] = useState('cars');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchName, setSearchName] = useState('');

  // ===== Dropdowns state =====
  const [platformsDropdownOpen, setPlatformsDropdownOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  // ===== New filters =====
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const [cars, setCars] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [kmFrom, setKmFrom] = useState('');
  const [kmTo, setKmTo] = useState('');
  const [headerSearch, setHeaderSearch] = useState('');
  const [showHeaderSearchBar, setShowHeaderSearchBar] = useState(false);
  const searchInputRef = useRef(null);

  const vehicleTypes = [
    { id: 'cars', label: t.cars, icon: 'car-outline' },
    { id: 'motorcycles', label: t.motorcycles, icon: 'bicycle-outline' },
    { id: 'boats', label: t.boats, icon: 'boat-outline' },
  ];

  const brands = BRANDS_DATA[selectedType] || [];
  const filteredBrands = brandSearchQuery
    ? brands.filter(b => b.label.toLowerCase().includes(brandSearchQuery.toLowerCase()) || b.value.toLowerCase().includes(brandSearchQuery.toLowerCase()))
    : brands;
  const models = selectedBrand ? (brands.find(b => b.value === selectedBrand.value)?.models || []) : [];

  useEffect(() => {
    loadSavedSearches();
    loadFavorites();
    setupNotificationHandler();
    registerForPushNotifications();
    AsyncStorage.getItem('scoop_onboarded').then(val => {
      if (val === 'true') setShowOnboarding(false);
    });
  }, []);

  useEffect(() => {
    if (selectedPlatform === 'all') setCars(allCars);
    else setCars(allCars.filter(c => c.source === selectedPlatform));
  }, [selectedPlatform, allCars]);

  const loadSavedSearches = async () => {
    setLoadingSaved(true);
    try {
      const snap = await getDocs(collection(db, 'searches'));
      setSavedSearches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
    setLoadingSaved(false);
  };

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('scoop_favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) {}
  };

  const saveFavoritesToStorage = async (favs) => {
    try { await AsyncStorage.setItem('scoop_favorites', JSON.stringify(favs)); } catch (e) {}
  };

  const isFavorite = (item) => favorites.some(f => f.link === item.link);

  const toggleFavorite = async (item) => {
    const exists = isFavorite(item);
    let newFavs;
    if (exists) {
      newFavs = favorites.filter(f => f.link !== item.link);
    } else {
      newFavs = [{ ...item, savedAt: new Date().toISOString() }, ...favorites];
    }
    setFavorites(newFavs);
    saveFavoritesToStorage(newFavs);
  };

  const saveSearch = async (auto = false) => {
    if (!selectedBrand) return;
    try {
      const autoName = selectedBrand.label.split('/')[0].trim() + (selectedModel ? ' ' + selectedModel : '');
      await addDoc(collection(db, 'searches'), {
        name: searchName.trim() || autoName,
        brand: selectedBrand.value, brandLabel: selectedBrand.label,
        model: selectedModel || null, type: selectedType,
        platform: selectedPlatform, city: selectedCity || null,
        minPrice: minPrice || null, maxPrice: maxPrice || null,
        yearFrom: yearFrom || null, yearTo: yearTo || null,
        condition: selectedCondition || null,
        fuel: selectedFuel || null,
        color: selectedColor || null,
        createdAt: new Date().toISOString(),
      });
      if (!auto) Alert.alert(t.savedTitle, t.savedSuccess);
      loadSavedSearches();
    } catch (e) {
      if (!auto) Alert.alert(t.errorTitle, t.errorSave);
    }
  };

  const deleteSearch = async (id) => {
    Alert.alert(
      t.deleteConfirm,
      '',
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'searches', id));
              setSavedSearches(prev => prev.filter(s => s.id !== id));
            } catch (e) {}
          }
        }
      ]
    );
  };

  const openListing = (link) => {
  if (!link) return;
  Linking.openURL(link);
};

  const shareCar = async (item) => {
    try {
      const msg = `🚗 ${item.name}\n💰 AED ${item.price?.toLocaleString()}\n📍 ${item.city || ''}\n🔗 ${item.link}\n\nعبر تطبيق سكوب 🔍`;
      await Share.share({ message: msg });
    } catch (e) {}
  };

  const fetchInstagram = async (keyword) => {
    setLoadingInstagram(true);
    try {
      const res = await fetch(API_URL + '/instagram?q=' + encodeURIComponent(keyword));
      const data = await res.json();
      const results = Array.isArray(data) ? data : [];
      if (results.length > 0) {
        setAllCars(prev => {
          const seen = new Set(prev.map(c => c.link));
          return [...prev, ...results.filter(c => !seen.has(c.link))];
        });
      }
    } catch (e) {}
    setLoadingInstagram(false);
  };

  const searchCars = async (keyword, saveOnSearch = false) => {
    if (!keyword) return;
    setLoading(true); setAllCars([]); setCars([]);
    setShowPicker(false); setShowHeaderSearchBar(false);
    setHeaderSearch(''); setActiveTab('results');

    if (saveOnSearch && selectedBrand) {
      saveSearch(true);
    }

    try {
      const params = new URLSearchParams({ q: keyword });
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (selectedCity) params.append('city', selectedCity);
      if (yearFrom) params.append('yearFrom', yearFrom);
      if (yearTo) params.append('yearTo', yearTo);
      if (kmFrom) params.append('kmFrom', kmFrom);
      if (kmTo) params.append('kmTo', kmTo);
      if (selectedCondition) params.append('condition', selectedCondition);
      if (selectedFuel) params.append('fuel', selectedFuel);
      if (selectedColor) params.append('color', selectedColor);
      const res = await fetch(API_URL + '/search?' + params.toString());
      const data = await res.json();
      const results = Array.isArray(data) ? data : [];
      setAllCars(results);
      setCars(selectedPlatform === 'all' ? results : results.filter(c => c.source === selectedPlatform));
      results.forEach(async (car, index) => {
        try {
          const ev = await fetch(API_URL + '/evaluate?name=' + encodeURIComponent(car.name || '') + '&price=' + (car.price || 0));
          const evData = await ev.json();
          setAllCars(prev => prev.map((c, i) => i === index ? { ...c, evaluation: evData.evaluation } : c));
          setCars(prev => prev.map(c => c.link === car.link ? { ...c, evaluation: evData.evaluation } : c));
        } catch (e) {}
      });
      fetchInstagram(keyword);
    } catch (e) {}
    setLoading(false);
  };

  const resetFilters = () => {
    setMinPrice(''); setMaxPrice(''); setSelectedCity('');
    setYearFrom(''); setYearTo(''); setKmFrom(''); setKmTo('');
    setSelectedColor(''); setSelectedCondition(''); setSelectedFuel('');
  };

  const resetSearchModal = () => {
    setSelectedBrand(null); setSelectedModel(null);
    setSelectedPlatform('all'); setSearchName('');
    setMinPrice(''); setMaxPrice(''); setYearFrom(''); setYearTo('');
    setSelectedCondition(''); setSelectedFuel(''); setSelectedColor('');
    setPlatformsDropdownOpen(false); setBrandDropdownOpen(false);
    setModelDropdownOpen(false); setBrandSearchQuery('');
  };

  const activeFiltersCount = [
    minPrice || maxPrice, selectedCity, yearFrom || yearTo,
    kmFrom || kmTo, selectedColor, selectedCondition, selectedFuel
  ].filter(Boolean).length;

  const getEvalColor = (ev) => {
    if (!ev) return CT.textMuted;
    if (ev.includes('رخيص') || ev.toLowerCase().includes('cheap')) return CT.activeGreen;
    if (ev.includes('غالي') || ev.toLowerCase().includes('expensive')) return CT.activeRed;
    return CT.activeYellow;
  };
  const getEvalBg = (ev) => {
    if (!ev) return CT.tagBg;
    if (ev.includes('رخيص') || ev.toLowerCase().includes('cheap')) return CT.activeGreenBg;
    if (ev.includes('غالي') || ev.toLowerCase().includes('expensive')) return CT.activeRedBg;
    return CT.activeYellowBg;
  };
  const getEvalEmoji = (ev) => {
    if (!ev) return '⏳';
    if (ev.includes('رخيص') || ev.toLowerCase().includes('cheap')) return '🟢';
    if (ev.includes('غالي') || ev.toLowerCase().includes('expensive')) return '🔴';
    return '🟡';
  };

  const getPlatformComparisons = (car) => {
    const sameCars = allCars.filter(c =>
      c.name && car.name &&
      c.name.toLowerCase().includes(car.name.split(' ')[0]?.toLowerCase()) &&
      c.link !== car.link && c.price > 0
    );
    return sameCars.sort((a, b) => a.price - b.price).slice(0, 3);
  };

  const getDealOfDay = () => {
    if (allCars.length === 0) return null;
    return allCars.filter(c => c.price > 0).sort((a, b) => a.price - b.price)[0] || null;
  };

  const NAV_HEIGHT = 56 + insets.bottom;
  const SOURCE_COLORS = isDark ? SOURCE_COLORS_DARK : SOURCE_COLORS_LIGHT;
  const selectedPlatformLabel = PLATFORMS.find(p => p.id === selectedPlatform);

  const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: CT.bg },
    header: {
      backgroundColor: CT.hdrBg,
      paddingTop: insets.top + 8,
      paddingBottom: 10,
      paddingHorizontal: 16,
      elevation: 4,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    badge: { position: 'absolute', top: -3, right: -3, backgroundColor: CT.blue, borderRadius: 9, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    editFeedBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    editFeedText: { color: '#fff', fontSize: 11 },

    headerSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    headerSearchInput: {
      flex: 1, backgroundColor: CT.searchBg, borderWidth: 0.5, borderColor: CT.searchBorder,
      borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
      color: '#fff', fontSize: 13, textAlign: 'right',
    },
    headerSearchBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' },

    onboardingCard: {
      backgroundColor: CT.navyDark, borderRadius: 16, margin: 16, padding: 18,
      alignItems: 'center', borderWidth: 0.5, borderColor: isDark ? '#534AB7' : '#AFA9EC',
    },
    onboardingTitle: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
    onboardingSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', marginBottom: 14 },
    onboardingBtn: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 8 },
    onboardingBtnText: { color: CT.navyDark, fontSize: 13, fontWeight: '700' },

    dealCard: {
      backgroundColor: CT.dealCardBg, borderRadius: 16, marginHorizontal: 16, marginBottom: 12,
      padding: 14, borderWidth: 0.5, borderColor: CT.dealCardBorder,
    },
    dealHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    dealTitle: { color: isDark ? '#EEEDFE' : '#fff', fontSize: 13, fontWeight: '700' },
    dealSub: { color: isDark ? '#7F77DD' : 'rgba(255,255,255,0.6)', fontSize: 10 },
    dealName: { color: isDark ? '#CECBF6' : '#fff', fontSize: 14, fontWeight: '600', textAlign: 'right', marginBottom: 4 },
    dealPrice: { color: isDark ? '#AFA9EC' : '#7EC8F5', fontSize: 22, fontWeight: '800', textAlign: 'right' },
    dealTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8, justifyContent: 'flex-end' },
    dealTag: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    dealTagText: { fontSize: 10, color: isDark ? '#AFA9EC' : 'rgba(255,255,255,0.8)' },
    dealOpenBtn: {
      backgroundColor: isDark ? '#534AB7' : 'rgba(255,255,255,0.15)',
      borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10,
      borderWidth: 0.5, borderColor: isDark ? '#7F77DD' : 'rgba(255,255,255,0.3)',
    },
    dealOpenBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },

    createBtnPrimary: {
      backgroundColor: CT.navyDark,
      borderRadius: 14,
      marginHorizontal: 16,
      marginTop: 6,
      marginBottom: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    createBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    secHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 6, marginBottom: 10 },
    secTitle: { fontSize: 15, fontWeight: '600', color: CT.textPrimary },
    countBadge: { backgroundColor: CT.tagBg, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    countBadgeText: { color: CT.navy, fontSize: 11, fontWeight: '600' },

    savedCard: { backgroundColor: CT.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 10, padding: 14, borderWidth: 0.5, borderColor: CT.cardBorder },
    savedCardHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    savedCardTitle: { fontSize: 14, fontWeight: '700', color: CT.textPrimary, textAlign: 'right' },
    savedCardSub: { fontSize: 11, color: CT.textMuted, textAlign: 'right', marginTop: 2 },
    savedPlatBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 5, alignSelf: 'flex-end' },
    deleteBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: CT.activeRedBg, justifyContent: 'center', alignItems: 'center' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10, justifyContent: 'flex-end' },
    tag: { backgroundColor: CT.tagBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    tagText: { fontSize: 10, color: CT.tagText },
    searchAgainBtn: { backgroundColor: CT.navyDark, borderRadius: 10, padding: 10, alignItems: 'center' },
    searchAgainText: { color: '#fff', fontWeight: '600', fontSize: 13 },

    emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
    emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: CT.tagBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: CT.textPrimary, marginBottom: 8, textAlign: 'center' },
    emptySub: { fontSize: 13, color: CT.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    emptyBtn: { backgroundColor: CT.navyDark, borderRadius: 24, paddingHorizontal: 28, paddingVertical: 12 },
    emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    feedTabsRow: { flexDirection: 'row', gap: 6, padding: 10, backgroundColor: CT.card, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder },
    feedTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: CT.cardBorder, backgroundColor: CT.bg },
    feedTabOn: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    feedTabTxt: { fontSize: 12, color: CT.textSecondary },
    feedTabTxtOn: { color: '#fff', fontWeight: '500' },
    igBanner: { backgroundColor: isDark ? '#15082a' : '#F3E8FF', marginHorizontal: 16, marginTop: 8, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 0.5, borderColor: isDark ? '#2a1060' : '#DDD6FE' },
    igBannerText: { fontSize: 12, color: '#7C3AED', fontWeight: '500' },
    loadingBox: { alignItems: 'center', marginTop: 60 },
    loadingText: { color: CT.textSecondary, marginTop: 12, fontSize: 14 },
    resultsHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginVertical: 8 },
    backBtn: { color: CT.navy, fontSize: 14, fontWeight: '600' },
    resultsCount: { color: CT.textSecondary, fontSize: 13 },
    saveSearchBtn: { backgroundColor: CT.tagBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
    saveSearchText: { color: CT.navy, fontSize: 12, fontWeight: '600' },

    card: { backgroundColor: CT.card, marginBottom: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: CT.cardBorder },
    carImg: { width: '100%', height: 150 },
    carImgPlaceholder: { width: '100%', height: 90, backgroundColor: CT.tagBg, justifyContent: 'center', alignItems: 'center' },
    cardBody: { padding: 12 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    sourceBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    sourceText: { fontSize: 10, fontWeight: '700' },
    cardActions: { flexDirection: 'row', gap: 6 },
    iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: CT.tagBg, justifyContent: 'center', alignItems: 'center' },
    iconBtnHeart: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    carName: { color: CT.textPrimary, fontSize: 14, fontWeight: 'bold', marginBottom: 3, textAlign: 'right' },
    carPrice: { color: CT.textPrimary, fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
    evalBox: { borderRadius: 8, padding: 8, marginBottom: 8 },
    evalText: { fontSize: 12, fontWeight: '600', textAlign: 'right', lineHeight: 18 },
    evalLoading: { backgroundColor: CT.tagBg, borderRadius: 8, padding: 8, marginBottom: 8 },
    evalLoadingText: { color: CT.textMuted, fontSize: 12, textAlign: 'right' },

    openBtn: { backgroundColor: CT.navyDark, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
    openBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    compareBox: { backgroundColor: CT.compareBg, borderRadius: 12, overflow: 'hidden', marginTop: 8, borderWidth: 0.5, borderColor: CT.cardBorder },
    compareHdr: { backgroundColor: CT.compareHdr, padding: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    compareHdrTitle: { color: '#EEEDFE', fontSize: 11, fontWeight: '700' },
    compareHdrSub: { color: isDark ? '#7F77DD' : '#AFA9EC', fontSize: 10 },
    compareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder },
    comparePlat: { fontSize: 11, color: CT.textSecondary, fontWeight: '600' },
    comparePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    comparePrice: { fontSize: 12, fontWeight: '700', color: CT.textPrimary },
    compareBestBadge: { backgroundColor: CT.activeGreenBg, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
    compareBestText: { color: CT.activeGreen, fontSize: 9, fontWeight: '700' },
    compareDiff: { fontSize: 10, color: CT.activeRed },
    compareFoot: { backgroundColor: CT.compareFoot, padding: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    compareFootText: { color: isDark ? '#7F77DD' : '#AFA9EC', fontSize: 10 },
    compareFootBtn: { backgroundColor: CT.compareFootBtn, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    compareFootBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    bottomNav: { backgroundColor: CT.navBg, flexDirection: 'row', paddingTop: 10, borderTopWidth: 0.5, borderTopColor: CT.navBorder },
    navItem: { flex: 1, alignItems: 'center' },
    navLabel: { fontSize: 10, color: CT.textMuted, marginTop: 2 },
    navLabelOn: { color: CT.blue, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: CT.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '94%' },
    modalHandle: { width: 40, height: 4, backgroundColor: CT.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { color: CT.textPrimary, fontSize: 17, fontWeight: 'bold' },
    resetText: { color: CT.blue, fontSize: 14 },

    sectionLabel: { color: CT.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'right', marginBottom: 8, marginTop: 4 },
    nameInput: {
      backgroundColor: CT.bg, color: CT.textPrimary, padding: 12, borderRadius: 10,
      fontSize: 13, borderWidth: 1, borderColor: CT.cardBorder, textAlign: 'right', marginBottom: 14,
    },

    typeTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    typeTab: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: CT.bg, borderWidth: 2, borderColor: 'transparent' },
    typeTabOn: { backgroundColor: CT.tagBg, borderColor: CT.navyDark },
    typeTabLabel: { fontSize: 11, color: CT.textMuted },
    typeTabLabelOn: { color: CT.navyDark, fontWeight: 'bold' },

    // ===== DROPDOWN universal =====
    dropdownTrigger: {
      backgroundColor: CT.bg, borderRadius: 10, padding: 12,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderWidth: 1, borderColor: CT.cardBorder, marginBottom: 12,
    },
    dropdownTriggerOpen: { borderColor: CT.navyDark, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    dropdownTriggerDisabled: { opacity: 0.45 },
    dropdownTriggerText: { fontSize: 13, color: CT.textPrimary, flex: 1, textAlign: 'right' },
    dropdownTriggerPlaceholder: { color: CT.textMuted },
    dropdownTriggerEmoji: { fontSize: 16, marginLeft: 8 },
    dropdownList: {
      backgroundColor: CT.bg, borderWidth: 1, borderColor: CT.navyDark,
      borderTopWidth: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
      marginTop: -12, marginBottom: 12, overflow: 'hidden', maxHeight: 260,
    },
    dropdownSearch: {
      backgroundColor: CT.card, padding: 10, fontSize: 12, color: CT.textPrimary,
      borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder, textAlign: 'right',
    },
    dropdownItem: {
      padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8,
      borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder,
    },
    dropdownItemActive: { backgroundColor: CT.tagBg },
    dropdownItemText: { fontSize: 13, color: CT.textPrimary, flex: 1, textAlign: 'right' },
    dropdownEmpty: { padding: 16, alignItems: 'center' },
    dropdownEmptyText: { color: CT.textMuted, fontSize: 12 },

    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    rangeInput: {
      flex: 1, backgroundColor: CT.bg, color: CT.textPrimary,
      padding: 11, borderRadius: 10, fontSize: 13,
      borderWidth: 1, borderColor: CT.cardBorder,
    },
    rangeDash: { color: CT.textMuted, fontSize: 16 },

    modalBtnsRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 30 },
    modalBtnSecondary: {
      flex: 1, backgroundColor: CT.tagBg, borderRadius: 14, padding: 14,
      alignItems: 'center', borderWidth: 1, borderColor: CT.navy,
    },
    modalBtnSecondaryText: { color: CT.navy, fontWeight: 'bold', fontSize: 14 },
    modalBtnPrimary: {
      flex: 1, backgroundColor: CT.navyDark, borderRadius: 14, padding: 14,
      alignItems: 'center',
    },
    modalBtnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    // ===== chips الجديدة (الحالة + الوقود) =====
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    pill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
      backgroundColor: CT.bg, borderWidth: 1, borderColor: CT.cardBorder,
    },
    pillOn: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    pillEmoji: { fontSize: 14 },
    pillText: { fontSize: 12, color: CT.textSecondary, fontWeight: '500' },
    pillTextOn: { color: '#fff', fontWeight: 'bold' },

    // ===== Colors grid (داخل Modal البحث) =====
    colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14, justifyContent: 'flex-start' },
    colorItem: { alignItems: 'center', width: 52 },
    colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: CT.cardBorder, marginBottom: 4 },
    colorCircleOn: { borderColor: CT.navyDark, borderWidth: 3 },
    colorLabel: { color: CT.textMuted, fontSize: 9, textAlign: 'center' },
    colorLabelOn: { color: CT.navy, fontWeight: 'bold' },

    // ===== Modal الفلاتر القديم (للمدينة والكيلومترات) =====
    filterLabel: { color: CT.textSecondary, fontSize: 12, marginBottom: 10, textAlign: 'right', fontWeight: '600' },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
    chip: { backgroundColor: CT.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: CT.cardBorder },
    chipOn: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    chipText: { color: CT.textSecondary, fontSize: 12 },
    chipTextOn: { color: '#fff', fontWeight: 'bold' },
    applyBtn: { backgroundColor: CT.navyDark, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
    applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // ===== Settings =====
    subBanner: { backgroundColor: CT.navyDark, borderRadius: 14, margin: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
    subBannerSmall: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
    subBannerTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
    subCta: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    subCtaText: { color: CT.navyDark, fontSize: 12, fontWeight: '600' },
    settingsSecLabel: { fontSize: 11, color: CT.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, marginBottom: 6, marginTop: 4 },
    settingsCard: { backgroundColor: CT.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 16, borderWidth: 0.5, borderColor: CT.cardBorder, overflow: 'hidden' },
    settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    settingsRowBorder: { borderTopWidth: 0.5, borderTopColor: CT.cardBorder },
    settingsRowText: { fontSize: 14, color: CT.textPrimary, flex: 1 },
    settingsRowSub: { fontSize: 11, color: CT.textMuted, marginTop: 2 },
    versionText: { textAlign: 'center', color: CT.textMuted, fontSize: 12, marginTop: 8 },

    favHdr: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    favTitle: { fontSize: 18, fontWeight: '700', color: CT.textPrimary, textAlign: 'right' },
    favSub: { fontSize: 12, color: CT.textMuted, textAlign: 'right', marginTop: 4 },
  });

  // ===== ONBOARDING =====
  const renderOnboarding = () => {
    if (!showOnboarding) return null;
    return (
      <View style={S.onboardingCard}>
        <Ionicons name="search-circle" size={36} color="#7EC8F5" style={{ marginBottom: 8 }} />
        <Text style={S.onboardingTitle}>{t.onboardingTitle}</Text>
        <Text style={S.onboardingSub}>{t.onboardingSub}</Text>
        <TouchableOpacity style={S.onboardingBtn} onPress={() => {
          setShowOnboarding(false);
          AsyncStorage.setItem('scoop_onboarded', 'true');
          setShowPicker(true);
        }}>
          <Text style={S.onboardingBtnText}>{t.onboardingBtn} ←</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDealOfDay = () => {
    const deal = getDealOfDay();
    if (!deal) return null;
    return (
      <View style={S.dealCard}>
        <View style={S.dealHdr}>
          <Ionicons name="flame" size={16} color="#FCD34D" />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.dealTitle}>{t.dealOfDay}</Text>
            <Text style={S.dealSub}>{t.dealSub}</Text>
          </View>
        </View>
        <Text style={S.dealName}>{deal.name}</Text>
        <Text style={S.dealPrice}>AED {deal.price?.toLocaleString()}</Text>
        <View style={S.dealTags}>
          {deal.city && <View style={S.dealTag}><Text style={S.dealTagText}>📍 {deal.city}</Text></View>}
          {deal.year && <View style={S.dealTag}><Text style={S.dealTagText}>📅 {deal.year}</Text></View>}
          {deal.km && <View style={S.dealTag}><Text style={S.dealTagText}>🛣️ {deal.km?.toLocaleString()} km</Text></View>}
          {deal.source && <View style={S.dealTag}><Text style={S.dealTagText}>{PLATFORMS.find(p => p.id === deal.source)?.emoji} {deal.source}</Text></View>}
        </View>
        <TouchableOpacity style={S.dealOpenBtn} onPress={() => openListing(deal.link)}>
          <Text style={S.dealOpenBtnText}>{t.openListing} ←</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHome = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {renderOnboarding()}
      {allCars.length > 0 && renderDealOfDay()}
      <TouchableOpacity style={S.createBtnPrimary} onPress={() => { resetSearchModal(); setShowPicker(true); }}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={S.createBtnPrimaryText}>{t.createSearch}</Text>
      </TouchableOpacity>
      <View style={S.secHdr}>
        {savedSearches.length > 0 && (
          <View style={S.countBadge}><Text style={S.countBadgeText}>{savedSearches.length}</Text></View>
        )}
        <Text style={S.secTitle}>{t.activeSearches}</Text>
      </View>
      {loadingSaved ? (
        <ActivityIndicator size="large" color={CT.blue} style={{ marginTop: 40 }} />
      ) : savedSearches.length === 0 ? (
        <View style={S.emptyState}>
          <View style={S.emptyCircle}><Ionicons name="search" size={38} color={CT.navy} /></View>
          <Text style={S.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={S.emptySub}>{t.emptySub}</Text>
        </View>
      ) : savedSearches.map(item => (
        <View key={item.id} style={S.savedCard}>
          <View style={S.savedCardHdr}>
            <TouchableOpacity style={S.deleteBtn} onPress={() => deleteSearch(item.id)}>
              <Ionicons name="trash-outline" size={15} color={CT.activeRed} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={S.savedCardTitle}>{item.name || (item.brandLabel + ' ' + (item.model || ''))}</Text>
              {item.name && <Text style={S.savedCardSub}>{item.brandLabel} {item.model || ''}</Text>}
              {item.platform && item.platform !== 'all' && (
                <View style={[S.savedPlatBadge, { backgroundColor: CT.tagBg }]}>
                  <Text style={{ fontSize: 9, color: CT.tagText }}>
                    {PLATFORMS.find(p => p.id === item.platform)?.emoji} {item.platform}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={S.tagsRow}>
            {item.yearFrom && <View style={S.tag}><Text style={S.tagText}>📅 {item.yearFrom}{item.yearTo ? '-' + item.yearTo : ''}</Text></View>}
            {item.minPrice && <View style={S.tag}><Text style={S.tagText}>💰 {item.minPrice}{item.maxPrice ? '-' + item.maxPrice : '+'}</Text></View>}
            {item.condition && <View style={S.tag}><Text style={S.tagText}>{CONDITIONS.find(c => c.id === item.condition)?.emoji} {CONDITIONS.find(c => c.id === item.condition)?.[lang === 'ar' ? 'label' : 'labelEn']}</Text></View>}
            {item.fuel && <View style={S.tag}><Text style={S.tagText}>{FUEL_TYPES.find(f => f.id === item.fuel)?.emoji} {FUEL_TYPES.find(f => f.id === item.fuel)?.[lang === 'ar' ? 'label' : 'labelEn']}</Text></View>}
            {item.color && <View style={S.tag}><Text style={S.tagText}>🎨 {item.color}</Text></View>}
            {item.city && <View style={S.tag}><Text style={S.tagText}>📍 {item.city}</Text></View>}
          </View>
          <TouchableOpacity style={S.searchAgainBtn} onPress={() => {
            setSelectedBrand({ value: item.brand, label: item.brandLabel });
            setSelectedModel(item.model);
            setSelectedPlatform(item.platform || 'all');
            setMinPrice(item.minPrice || ''); setMaxPrice(item.maxPrice || '');
            setYearFrom(item.yearFrom || ''); setYearTo(item.yearTo || '');
            setSelectedCondition(item.condition || ''); setSelectedFuel(item.fuel || '');
            setSelectedColor(item.color || ''); setSelectedCity(item.city || '');
            searchCars(item.model ? item.brand + ' ' + item.model : item.brand);
          }}>
            <Text style={S.searchAgainText}>{t.searchNow}</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: NAV_HEIGHT + 20 }} />
    </ScrollView>
  );

  const renderCarCard = ({ item }) => {
    const comparisons = getPlatformComparisons(item);
    const cheapest = comparisons.length > 0 ? comparisons[0] : null;
    const fav = isFavorite(item);
    return (
      <View style={S.card}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={S.carImg} resizeMode="cover" />
        ) : (
          <View style={S.carImgPlaceholder}>
            <Ionicons name="car-outline" size={42} color={CT.navy} />
          </View>
        )}
        <View style={S.cardBody}>
          <View style={S.cardTopRow}>
            {item.source && (
              <View style={[S.sourceBadge, { backgroundColor: SOURCE_COLORS[item.source] || CT.tagBg }]}>
                <Text style={[S.sourceText, { color: SOURCE_TEXT[item.source] || CT.navy }]}>
                  {PLATFORMS.find(p => p.id === item.source)?.emoji || ''} {item.source}
                  {item.account ? ` ${item.account}` : ''}
                </Text>
              </View>
            )}
            <View style={S.cardActions}>
              <TouchableOpacity
                style={[S.iconBtnHeart, { backgroundColor: fav ? (isDark ? '#2E0D0D' : '#FEE2E2') : CT.tagBg }]}
                onPress={() => toggleFavorite(item)}
              >
                <Ionicons
                  name={fav ? 'heart' : 'heart-outline'}
                  size={18}
                  color={fav ? CT.heartActive : CT.heartInactive}
                />
              </TouchableOpacity>
              <TouchableOpacity style={S.iconBtn} onPress={() => shareCar(item)}>
                <Ionicons name="share-social-outline" size={16} color={CT.navy} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={S.carName}>{item.name}</Text>
          <Text style={S.carPrice}>
            {item.price > 0 ? `AED ${item.price?.toLocaleString()}` : t.contactForPrice}
          </Text>
          {item.evaluation ? (
            <View style={[S.evalBox, { backgroundColor: getEvalBg(item.evaluation) }]}>
              <Text style={[S.evalText, { color: getEvalColor(item.evaluation) }]}>
                {getEvalEmoji(item.evaluation)} {item.evaluation}
              </Text>
            </View>
          ) : (
            <View style={S.evalLoading}>
              <Text style={S.evalLoadingText}>⏳ {t.analyzing}</Text>
            </View>
          )}
          <View style={S.tagsRow}>
            {item.city && <View style={S.tag}><Text style={S.tagText}>📍 {item.city}</Text></View>}
            {item.year && <View style={S.tag}><Text style={S.tagText}>📅 {item.year}</Text></View>}
            {item.km && <View style={S.tag}><Text style={S.tagText}>🛣️ {item.km?.toLocaleString()} km</Text></View>}
          </View>
          <TouchableOpacity style={S.openBtn} onPress={() => openListing(item.link)}>
            <Ionicons name="open-outline" size={15} color="#fff" />
            <Text style={S.openBtnText}>{t.openListing}</Text>
          </TouchableOpacity>
          {comparisons.length > 0 && (
            <View style={S.compareBox}>
              <View style={S.compareHdr}>
                <Text style={S.compareHdrSub}>{item.name?.split(' ').slice(0,3).join(' ')}</Text>
                <Text style={S.compareHdrTitle}>🔄 {t.comparePlatforms}</Text>
              </View>
              {item.price > 0 && (
                <View style={S.compareRow}>
                  <View style={S.comparePriceRow}>
                    {(!cheapest || item.price <= cheapest.price) && (
                      <View style={S.compareBestBadge}><Text style={S.compareBestText}>🥇 {t.cheapest}</Text></View>
                    )}
                    <Text style={S.comparePrice}>AED {item.price?.toLocaleString()}</Text>
                  </View>
                  <Text style={S.comparePlat}>{PLATFORMS.find(p => p.id === item.source)?.emoji || ''} {item.source}</Text>
                </View>
              )}
              {comparisons.map((c, i) => (
                <View key={i} style={S.compareRow}>
                  <View style={S.comparePriceRow}>
                    {c.price < item.price && <View style={S.compareBestBadge}><Text style={S.compareBestText}>🥇 {t.cheapest}</Text></View>}
                    {c.price > item.price && <Text style={S.compareDiff}>+{(c.price - item.price).toLocaleString()} ↑</Text>}
                    <Text style={[S.comparePrice, c.price > item.price && { color: CT.textMuted }]}>AED {c.price?.toLocaleString()}</Text>
                  </View>
                  <Text style={S.comparePlat}>{PLATFORMS.find(p => p.id === c.source)?.emoji || ''} {c.source}</Text>
                </View>
              ))}
              {cheapest && cheapest.price < item.price && (
                <View style={S.compareFoot}>
                  <TouchableOpacity style={S.compareFootBtn} onPress={() => openListing(cheapest.link)}>
                    <Text style={S.compareFootBtnText}>{t.openCheapest} ←</Text>
                  </TouchableOpacity>
                  <Text style={S.compareFootText}>💸 {t.saveWith} {(item.price - cheapest.price).toLocaleString()} مع {cheapest.source}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderResults = () => (
    <View style={{ flex: 1 }}>
      <View style={S.feedTabsRow}>
        {[{ id: 'all', label: t.all }, { id: 'filtered', label: t.filtered }, { id: 'featured', label: t.featured }].map(tab => (
          <TouchableOpacity key={tab.id} style={[S.feedTab, feedTab === tab.id && S.feedTabOn]} onPress={() => setFeedTab(tab.id)}>
            <Text style={[S.feedTabTxt, feedTab === tab.id && S.feedTabTxtOn]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loadingInstagram && (
        <View style={S.igBanner}>
          <ActivityIndicator size="small" color="#7C3AED" />
          <Text style={S.igBannerText}>{t.searchingInstagram}</Text>
        </View>
      )}
      {loading && (
        <View style={S.loadingBox}>
          <ActivityIndicator size="large" color={CT.blue} />
          <Text style={S.loadingText}>{t.searching}</Text>
        </View>
      )}
      {!loading && cars.length > 0 && (
        <View style={S.resultsHdr}>
          <TouchableOpacity style={S.saveSearchBtn} onPress={() => saveSearch(false)}>
            <Ionicons name="bookmark-outline" size={13} color={CT.navy} />
            <Text style={S.saveSearchText}>{t.saveSearch}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={S.resultsCount}>{cars.length} {t.results}</Text>
            <TouchableOpacity onPress={() => { setAllCars([]); setCars([]); setActiveTab('home'); }}>
              <Text style={S.backBtn}>{t.back}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {!loading && cars.length === 0 && (
        <View style={S.emptyState}>
          <View style={S.emptyCircle}><Ionicons name="search" size={38} color={CT.navy} /></View>
          <Text style={S.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={S.emptySub}>{t.emptySub}</Text>
          <TouchableOpacity style={S.emptyBtn} onPress={() => { resetSearchModal(); setShowPicker(true); }}>
            <Text style={S.emptyBtnText}>{t.createSearch}</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={cars}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20, paddingHorizontal: 14 }}
        renderItem={renderCarCard}
      />
    </View>
  );

  const renderFavorites = () => (
    <View style={{ flex: 1 }}>
      <View style={S.favHdr}>
        <Text style={S.favTitle}>{t.favorites} ❤️</Text>
        <Text style={S.favSub}>{favorites.length > 0 ? `${favorites.length} ${t.results}` : t.favoritesEmptySub}</Text>
      </View>
      {favorites.length === 0 ? (
        <View style={S.emptyState}>
          <View style={S.emptyCircle}>
            <Ionicons name="heart-outline" size={42} color={CT.navy} />
          </View>
          <Text style={S.emptyTitle}>{t.favoritesEmpty}</Text>
          <Text style={S.emptySub}>{t.favoritesEmptySub}</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20, paddingHorizontal: 14, paddingTop: 4 }}
          renderItem={renderCarCard}
        />
      )}
    </View>
  );

  const renderSavedTab = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={S.favHdr}>
        <Text style={S.favTitle}>{t.saved} 🔖</Text>
        <Text style={S.favSub}>{savedSearches.length > 0 ? `${savedSearches.length} ${t.activeSearches}` : t.emptyTitle}</Text>
      </View>
      {loadingSaved ? (
        <ActivityIndicator size="large" color={CT.blue} style={{ marginTop: 40 }} />
      ) : savedSearches.length === 0 ? (
        <View style={S.emptyState}>
          <View style={S.emptyCircle}><Ionicons name="bookmark-outline" size={38} color={CT.navy} /></View>
          <Text style={S.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={S.emptySub}>{t.emptySub}</Text>
          <TouchableOpacity style={S.emptyBtn} onPress={() => { resetSearchModal(); setShowPicker(true); }}>
            <Text style={S.emptyBtnText}>{t.createSearch}</Text>
          </TouchableOpacity>
        </View>
      ) : savedSearches.map(item => (
        <View key={item.id} style={S.savedCard}>
          <View style={S.savedCardHdr}>
            <TouchableOpacity style={S.deleteBtn} onPress={() => deleteSearch(item.id)}>
              <Ionicons name="trash-outline" size={15} color={CT.activeRed} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={S.savedCardTitle}>{item.name || (item.brandLabel + ' ' + (item.model || ''))}</Text>
              {item.name && <Text style={S.savedCardSub}>{item.brandLabel} {item.model || ''}</Text>}
            </View>
          </View>
          <TouchableOpacity style={S.searchAgainBtn} onPress={() => {
            setSelectedBrand({ value: item.brand, label: item.brandLabel });
            setSelectedModel(item.model);
            setSelectedPlatform(item.platform || 'all');
            searchCars(item.model ? item.brand + ' ' + item.model : item.brand);
          }}>
            <Text style={S.searchAgainText}>{t.searchNow}</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: NAV_HEIGHT + 20 }} />
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={S.subBanner}>
        <TouchableOpacity style={S.subCta}>
          <Text style={S.subCtaText}>{lang === 'ar' ? 'اشترك' : 'Subscribe'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={S.subBannerSmall}>{lang === 'ar' ? 'اشترك في سكوب' : 'Subscribe to Scoop'}</Text>
          <Text style={S.subBannerTitle}>{lang === 'ar' ? 'اختر خطة تناسبك 🚀' : 'Choose A Plan'}</Text>
        </View>
      </View>
      <Text style={S.settingsSecLabel}>{t.appearance}</Text>
      <View style={S.settingsCard}>
        <View style={S.settingsRow}>
          <Toggle value={isDark} onToggle={() => setIsDark(!isDark)} />
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={S.settingsRowText}>{isDark ? t.darkMode : t.lightMode}</Text>
            <Text style={S.settingsRowSub}>{t.darkModeSub}</Text>
          </View>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#7F77DD' : '#F59E0B'} />
        </View>
      </View>
      <Text style={S.settingsSecLabel}>{lang === 'ar' ? 'الإعدادات العامة' : 'General'}</Text>
      <View style={S.settingsCard}>
        {[
          { label: lang === 'ar' ? 'إظهار تقدير السعر' : 'Show price estimate', on: true },
          { label: lang === 'ar' ? 'مقارنة المنصات تلقائياً' : 'Auto platform comparison', on: true },
          { label: lang === 'ar' ? 'فلتر التالفة' : 'Damaged filter', on: false },
        ].map((row, i) => (
          <View key={i} style={[S.settingsRow, i > 0 && S.settingsRowBorder]}>
            <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: row.on ? CT.toggleOn : CT.toggleOff, justifyContent: 'center', padding: 2 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', transform: [{ translateX: row.on ? 20 : 0 }] }} />
            </View>
            <Text style={S.settingsRowText}>{row.label}</Text>
          </View>
        ))}
      </View>
      <Text style={S.settingsSecLabel}>{lang === 'ar' ? 'اللغة' : 'Language'}</Text>
      <View style={S.settingsCard}>
        <TouchableOpacity style={S.settingsRow} onPress={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setSelectedCity(''); }}>
          <Text style={S.settingsRowText}>{lang === 'ar' ? 'English / عربي' : 'العربية / English'}</Text>
          <Text style={{ color: CT.blue, fontWeight: '600' }}>{lang === 'ar' ? 'En' : 'ع'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={S.settingsSecLabel}>{lang === 'ar' ? 'الحساب' : 'Account'}</Text>
      <View style={S.settingsCard}>
        <View style={S.settingsRow}>
          <Text style={S.settingsRowText}>{lang === 'ar' ? 'الملف الشخصي' : 'Profile'}</Text>
          <Ionicons name="chevron-forward" size={16} color={CT.textMuted} />
        </View>
        <View style={[S.settingsRow, S.settingsRowBorder]}>
          <Text style={[S.settingsRowText, { color: '#EF4444' }]}>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</Text>
        </View>
      </View>
      <Text style={S.versionText}>Version 1.0.0</Text>
      <View style={{ height: NAV_HEIGHT + 20 }} />
    </ScrollView>
  );

  return (
    <View style={S.container}>
      <StatusBar backgroundColor={CT.hdrBg} barStyle="light-content" translucent={false} />

      <View style={S.header}>
        <View style={S.headerRow}>
          <View style={S.headerActions}>
            <TouchableOpacity style={S.headerIconBtn} onPress={() => setShowFilters(true)}>
              <Ionicons name="options-outline" size={20} color="white" />
              {activeFiltersCount > 0 && (
                <View style={S.badge}><Text style={S.badgeText}>{activeFiltersCount}</Text></View>
              )}
            </TouchableOpacity>
            {activeTab === 'results' && (
              <TouchableOpacity style={S.editFeedBtn} onPress={() => setShowPicker(true)}>
                <Text style={S.editFeedText}>{t.editFeed}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={S.headerIconBtn}
              onPress={() => {
                setShowHeaderSearchBar(!showHeaderSearchBar);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
            >
              <Ionicons name={showHeaderSearchBar ? 'close' : 'search'} size={18} color="white" />
            </TouchableOpacity>
            <LogoWhite width={130} height={32} />
          </View>
        </View>
        {showHeaderSearchBar && (
          <View style={S.headerSearchRow}>
            <TouchableOpacity
              style={[S.headerSearchBtn, { backgroundColor: '#534AB7' }]}
              onPress={() => { if (headerSearch.trim()) searchCars(headerSearch.trim()); }}
            >
              <Ionicons name="search" size={16} color="white" />
            </TouchableOpacity>
            <TextInput
              ref={searchInputRef}
              style={S.headerSearchInput}
              placeholder={t.searchPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={headerSearch}
              onChangeText={setHeaderSearch}
              onSubmitEditing={() => { if (headerSearch.trim()) searchCars(headerSearch.trim()); }}
              returnKeyType="search"
              autoFocus
            />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'results' && renderResults()}
        {activeTab === 'saved' && renderSavedTab()}
        {activeTab === 'favorites' && renderFavorites()}
        {activeTab === 'settings' && renderSettings()}
      </View>

      <View style={[S.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {[
          { id: 'home',      iconOff: 'home-outline',     iconOn: 'home',     label: t.home },
          { id: 'results',   iconOff: 'radio-outline',    iconOn: 'radio',    label: t.results_tab },
          { id: 'saved',     iconOff: 'bookmark-outline', iconOn: 'bookmark', label: t.saved },
          { id: 'favorites', iconOff: 'heart-outline',    iconOn: 'heart',    label: t.favorites },
          { id: 'settings',  iconOff: 'settings-outline', iconOn: 'settings', label: t.settings },
        ].map(tab => {
          const isOn = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={S.navItem} onPress={() => setActiveTab(tab.id)}>
              <Ionicons name={isOn ? tab.iconOn : tab.iconOff} size={24} color={isOn ? (tab.id === 'favorites' && isOn ? CT.heartActive : CT.blue) : CT.textMuted} />
              <Text style={[S.navLabel, isOn && S.navLabelOn]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ===== MODAL إنشاء بحث — مع dropdowns جديدة ===== */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={S.modalHdr}>
                <TouchableOpacity onPress={resetSearchModal}>
                  <Text style={S.resetText}>{t.reset}</Text>
                </TouchableOpacity>
                <Text style={S.modalTitle}>{t.selectVehicle}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Ionicons name="close" size={22} color={CT.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* اسم البحث */}
              <Text style={S.sectionLabel}>{t.searchName}</Text>
              <TextInput
                style={S.nameInput}
                placeholder={t.searchNamePlaceholder}
                placeholderTextColor={CT.textMuted}
                value={searchName}
                onChangeText={setSearchName}
              />

              {/* نوع المركبة */}
              <Text style={S.sectionLabel}>{lang === 'ar' ? 'نوع المركبة' : 'Vehicle Type'}</Text>
              <View style={S.typeTabs}>
                {vehicleTypes.map(type => (
                  <TouchableOpacity key={type.id} style={[S.typeTab, selectedType === type.id && S.typeTabOn]}
                    onPress={() => {
                      setSelectedType(type.id);
                      setSelectedBrand(null); setSelectedModel(null);
                      setBrandDropdownOpen(false); setModelDropdownOpen(false);
                    }}>
                    <Ionicons name={type.icon} size={22} color={selectedType === type.id ? CT.navyDark : CT.textMuted} style={{ marginBottom: 4 }} />
                    <Text style={[S.typeTabLabel, selectedType === type.id && S.typeTabLabelOn]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dropdown المنصات */}
              <Text style={S.sectionLabel}>🏪 {t.selectPlatform}</Text>
              <TouchableOpacity
                style={[S.dropdownTrigger, platformsDropdownOpen && S.dropdownTriggerOpen]}
                onPress={() => {
                  setPlatformsDropdownOpen(!platformsDropdownOpen);
                  setBrandDropdownOpen(false); setModelDropdownOpen(false);
                }}
              >
                <Ionicons name={platformsDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={CT.textSecondary} />
                <Text style={S.dropdownTriggerText}>
                  {selectedPlatformLabel ? (lang === 'ar' ? selectedPlatformLabel.label : selectedPlatformLabel.labelEn) : t.selectPlatform}
                </Text>
                <Text style={S.dropdownTriggerEmoji}>{selectedPlatformLabel?.emoji}</Text>
              </TouchableOpacity>
              {platformsDropdownOpen && (
                <View style={S.dropdownList}>
                  <ScrollView nestedScrollEnabled>
                    {PLATFORMS.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[S.dropdownItem, selectedPlatform === p.id && S.dropdownItemActive]}
                        onPress={() => { setSelectedPlatform(p.id); setPlatformsDropdownOpen(false); }}
                      >
                        {selectedPlatform === p.id && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                        <Text style={S.dropdownItemText}>{lang === 'ar' ? p.label : p.labelEn}</Text>
                        <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Dropdown الشركة */}
              <Text style={S.sectionLabel}>🏭 {t.brand}</Text>
              <TouchableOpacity
                style={[S.dropdownTrigger, brandDropdownOpen && S.dropdownTriggerOpen]}
                onPress={() => {
                  setBrandDropdownOpen(!brandDropdownOpen);
                  setPlatformsDropdownOpen(false); setModelDropdownOpen(false);
                  setBrandSearchQuery('');
                }}
              >
                <Ionicons name={brandDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={CT.textSecondary} />
                <Text style={[S.dropdownTriggerText, !selectedBrand && S.dropdownTriggerPlaceholder]}>
                  {selectedBrand ? selectedBrand.label : t.selectBrand}
                </Text>
                <Ionicons name="car-sport-outline" size={18} color={CT.textSecondary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {brandDropdownOpen && (
                <View style={S.dropdownList}>
                  <TextInput
                    style={S.dropdownSearch}
                    placeholder={t.searchBrand}
                    placeholderTextColor={CT.textMuted}
                    value={brandSearchQuery}
                    onChangeText={setBrandSearchQuery}
                  />
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filteredBrands.length === 0 ? (
                      <View style={S.dropdownEmpty}>
                        <Text style={S.dropdownEmptyText}>—</Text>
                      </View>
                    ) : filteredBrands.map(brand => (
                      <TouchableOpacity
                        key={brand.value}
                        style={[S.dropdownItem, selectedBrand?.value === brand.value && S.dropdownItemActive]}
                        onPress={() => {
                          setSelectedBrand(brand);
                          setSelectedModel(null);
                          setBrandDropdownOpen(false);
                          setBrandSearchQuery('');
                        }}
                      >
                        {selectedBrand?.value === brand.value && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                        <Text style={S.dropdownItemText}>{brand.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Dropdown الموديل */}
              <Text style={S.sectionLabel}>🚙 {t.model}</Text>
              <TouchableOpacity
                style={[
                  S.dropdownTrigger,
                  modelDropdownOpen && S.dropdownTriggerOpen,
                  !selectedBrand && S.dropdownTriggerDisabled,
                ]}
                disabled={!selectedBrand}
                onPress={() => {
                  if (!selectedBrand) return;
                  setModelDropdownOpen(!modelDropdownOpen);
                  setPlatformsDropdownOpen(false); setBrandDropdownOpen(false);
                }}
              >
                <Ionicons name={modelDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={CT.textSecondary} />
                <Text style={[S.dropdownTriggerText, !selectedModel && S.dropdownTriggerPlaceholder]}>
                  {selectedModel ? selectedModel : (selectedBrand ? t.selectModelHint : t.selectBrandFirst)}
                </Text>
                <Ionicons name="options-outline" size={18} color={CT.textSecondary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {modelDropdownOpen && selectedBrand && (
                <View style={S.dropdownList}>
                  <ScrollView nestedScrollEnabled>
                    <TouchableOpacity
                      style={[S.dropdownItem, !selectedModel && S.dropdownItemActive]}
                      onPress={() => { setSelectedModel(null); setModelDropdownOpen(false); }}
                    >
                      {!selectedModel && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                      <Text style={S.dropdownItemText}>{t.allModels}</Text>
                    </TouchableOpacity>
                    {models.map(model => (
                      <TouchableOpacity
                        key={model}
                        style={[S.dropdownItem, selectedModel === model && S.dropdownItemActive]}
                        onPress={() => { setSelectedModel(model); setModelDropdownOpen(false); }}
                      >
                        {selectedModel === model && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                        <Text style={S.dropdownItemText}>{model}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* الحالة: جديد / مستعمل */}
              <Text style={S.sectionLabel}>📦 {t.condition}</Text>
              <View style={S.pillsRow}>
                {CONDITIONS.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[S.pill, selectedCondition === c.id && S.pillOn]}
                    onPress={() => setSelectedCondition(selectedCondition === c.id ? '' : c.id)}
                  >
                    <Text style={S.pillEmoji}>{c.emoji}</Text>
                    <Text style={[S.pillText, selectedCondition === c.id && S.pillTextOn]}>
                      {lang === 'ar' ? c.label : c.labelEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* نوع الوقود */}
              <Text style={S.sectionLabel}>⛽ {t.fuelType}</Text>
              <View style={S.pillsRow}>
                {FUEL_TYPES.map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={[S.pill, selectedFuel === f.id && S.pillOn]}
                    onPress={() => setSelectedFuel(selectedFuel === f.id ? '' : f.id)}
                  >
                    <Text style={S.pillEmoji}>{f.emoji}</Text>
                    <Text style={[S.pillText, selectedFuel === f.id && S.pillTextOn]}>
                      {lang === 'ar' ? f.label : f.labelEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* سنة الصنع */}
              <Text style={S.sectionLabel}>📅 {t.yearRange}</Text>
              <View style={S.rangeRow}>
                <TextInput style={S.rangeInput} placeholder={t.to} value={yearTo} onChangeText={setYearTo} keyboardType="numeric" textAlign="center" placeholderTextColor={CT.textMuted} maxLength={4} />
                <Text style={S.rangeDash}>—</Text>
                <TextInput style={S.rangeInput} placeholder={t.from} value={yearFrom} onChangeText={setYearFrom} keyboardType="numeric" textAlign="center" placeholderTextColor={CT.textMuted} maxLength={4} />
              </View>

              {/* الميزانية */}
              <Text style={S.sectionLabel}>💰 {t.priceRange}</Text>
              <View style={S.rangeRow}>
                <TextInput style={S.rangeInput} placeholder={t.to} value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" textAlign="center" placeholderTextColor={CT.textMuted} />
                <Text style={S.rangeDash}>—</Text>
                <TextInput style={S.rangeInput} placeholder={t.from} value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" textAlign="center" placeholderTextColor={CT.textMuted} />
              </View>

              {/* اللون */}
              <Text style={S.sectionLabel}>🎨 {t.color}</Text>
              <View style={S.colorsGrid}>
                {colorList.map((color, index) => (
                  <TouchableOpacity key={color} style={S.colorItem} onPress={() => setSelectedColor(selectedColor === color ? '' : color)}>
                    <View style={[S.colorCircle, { backgroundColor: COLOR_HEX[index] }, COLOR_HEX[index] === '#FFFFFF' && { borderColor: CT.textMuted }, selectedColor === color && S.colorCircleOn]} />
                    <Text style={[S.colorLabel, selectedColor === color && S.colorLabelOn]}>{color}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* أزرار */}
              <View style={S.modalBtnsRow}>
                <TouchableOpacity
                  style={S.modalBtnSecondary}
                  disabled={!selectedBrand}
                  onPress={() => {
                    if (!selectedBrand) return;
                    searchCars(selectedModel ? selectedBrand.value + ' ' + selectedModel : selectedBrand.value, false);
                  }}
                >
                  <Text style={[S.modalBtnSecondaryText, !selectedBrand && { opacity: 0.4 }]}>{t.searchNow}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.modalBtnPrimary}
                  disabled={!selectedBrand}
                  onPress={() => {
                    if (!selectedBrand) return;
                    searchCars(selectedModel ? selectedBrand.value + ' ' + selectedModel : selectedBrand.value, true);
                  }}
                >
                  <Text style={[S.modalBtnPrimaryText, !selectedBrand && { opacity: 0.4 }]}>💾 {t.saveAndSearch}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal الفلاتر المتقدمة (مدينة + كيلومترات فقط) */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={S.modalHdr}>
                <TouchableOpacity onPress={resetFilters}><Text style={S.resetText}>{t.reset}</Text></TouchableOpacity>
                <Text style={S.modalTitle}>{t.advancedFilters}</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Ionicons name="close" size={22} color={CT.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={S.filterLabel}>🛣️ {t.km}</Text>
              <View style={S.rangeRow}>
                <TextInput style={S.rangeInput} placeholder={t.to} value={kmTo} onChangeText={setKmTo} keyboardType="numeric" textAlign="center" placeholderTextColor={CT.textMuted} />
                <Text style={S.rangeDash}>—</Text>
                <TextInput style={S.rangeInput} placeholder={t.from} value={kmFrom} onChangeText={setKmFrom} keyboardType="numeric" textAlign="center" placeholderTextColor={CT.textMuted} />
              </View>
              <Text style={S.filterLabel}>📍 {t.city}</Text>
              <View style={S.chipsWrap}>
                {cities.map(city => (
                  <TouchableOpacity key={city} style={[S.chip, selectedCity === city && S.chipOn]} onPress={() => setSelectedCity(selectedCity === city ? '' : city)}>
                    <Text style={[S.chipText, selectedCity === city && S.chipTextOn]}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={S.applyBtn} onPress={() => {
                setShowFilters(false);
                if (selectedBrand) searchCars(selectedModel ? selectedBrand.value + ' ' + selectedModel : selectedBrand.value);
              }}>
                <Text style={S.applyBtnText}>{t.applySearch}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}