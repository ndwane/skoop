import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView, Modal,
  Alert, Linking, Image, StatusBar, Share, Dimensions, Animated, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { db, collection, addDoc, getDocs, deleteDoc, doc } from '../firebase';
import { registerForPushNotifications, setupNotificationHandler } from '../notifications';

const API_URL = 'https://skoop-production.up.railway.app';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // أسبوع
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  newBadge: '#F59E0B', newBadgeText: '#FFFFFF',
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
  newBadge: '#FCD34D', newBadgeText: '#0D0A1E',
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
    refresh: 'تحديث',
    refreshing: 'جاري التحديث...',
    newBadge: 'جديد',
    newCarsFound: 'سيارات جديدة',
    noNewCars: 'لا توجد سيارات جديدة',
    details: 'التفاصيل',
    carDetails: 'تفاصيل السيارة',
    priceAnalysis: 'تحليل السعر',
    lastUpdated: 'آخر تحديث',
    cachedResults: 'النتائج المحفوظة',
    minutesAgo: 'دقيقة',
    hoursAgo: 'ساعة',
    daysAgo: 'يوم',
    justNow: 'الآن',
    tapSearchToView: 'اضغط على بحث في الأعلى لعرض نتائجه',
    info: 'المعلومات',
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
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    newBadge: 'NEW',
    newCarsFound: 'new cars',
    noNewCars: 'No new cars found',
    details: 'Details',
    carDetails: 'Car Details',
    priceAnalysis: 'Price Analysis',
    lastUpdated: 'Last updated',
    cachedResults: 'Cached Results',
    minutesAgo: 'min',
    hoursAgo: 'h',
    daysAgo: 'd',
    justNow: 'now',
    tapSearchToView: 'Tap a search above to view its results',
    info: 'Info',
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

// ===== الوقت النسبي =====
const getRelativeTime = (timestamp, lang) => {
  if (!timestamp) return '';
  const t = TRANSLATIONS[lang];
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return `${minutes} ${t.minutesAgo}`;
  if (hours < 24) return `${hours} ${t.hoursAgo}`;
  return `${days} ${t.daysAgo}`;
};

// ✨ مكوّن Shimmer للبطاقات الوهمية
// 🎬 مكوّن أيقونة Empty State المتحركة
const PulsingIcon = ({ name, size = 56, color }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
};

const ShimmerBox = ({ style, isDark }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      })
    ).start();
  }, []);
  const bgColor = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: isDark
      ? ['#2A1F5A', '#534AB7', '#2A1F5A']
      : ['#D8D2F0', '#AFA9EC', '#D8D2F0'],
  });
  return <Animated.View style={[style, { backgroundColor: bgColor }]} />;
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState('ar');
  const [isDark, setIsDark] = useState(false);
  const CT = isDark ? DARK : LIGHT;
  const t = TRANSLATIONS[lang];
  const cities = CITIES[lang];
  const colorList = COLORS[lang];

  const [activeTab, setActiveTab] = useState('home');
  const [showPicker, setShowPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [selectedType, setSelectedType] = useState('cars');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchName, setSearchName] = useState('');

  // Dropdowns
  const [platformsDropdownOpen, setPlatformsDropdownOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  // Filters
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // ===== الكاش الجديد =====
  const [cachedSearches, setCachedSearches] = useState({});
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // Modal تفاصيل السيارة
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarDetails, setShowCarDetails] = useState(false);

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
    loadCachedSearches();
    setupNotificationHandler();
    registerForPushNotifications();
    AsyncStorage.getItem('scoop_onboarded').then(val => {
      if (val === 'true') setShowOnboarding(false);
    });
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  // ===== كاش البحوث =====
  const loadCachedSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('scoop_cached_searches');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const now = Date.now();
      const valid = {};
      Object.keys(parsed).forEach(id => {
        if (now - parsed[id].savedAt < CACHE_DURATION_MS) {
          valid[id] = parsed[id];
        }
      });
      setCachedSearches(valid);
      await AsyncStorage.setItem('scoop_cached_searches', JSON.stringify(valid));
    } catch (e) {
      console.log('Cache load error:', e);
    }
  };

  const saveCachedSearch = async (searchId, searchInfo, results, newLinks = []) => {
    try {
      const updated = {
        ...cachedSearches,
        [searchId]: {
          searchInfo,
          results,
          savedAt: Date.now(),
          newLinks,
        }
      };
      setCachedSearches(updated);
      await AsyncStorage.setItem('scoop_cached_searches', JSON.stringify(updated));
    } catch (e) {
      console.log('Cache save error:', e);
    }
  };

  const deleteCachedSearch = async (searchId) => {
    try {
      const updated = { ...cachedSearches };
      delete updated[searchId];
      setCachedSearches(updated);
      await AsyncStorage.setItem('scoop_cached_searches', JSON.stringify(updated));
      if (activeSearchId === searchId) setActiveSearchId(null);
    } catch (e) {}
  };

  const saveSearch = async (auto = false) => {
    if (!selectedBrand) return;
    if (!auto) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t.deleteConfirm, '',
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

  // ===== البحث =====
  const fetchInstagram = async (keyword) => {
    setLoadingInstagram(true);
    try {
      const res = await fetch(API_URL + '/instagram?q=' + encodeURIComponent(keyword));
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
    finally { setLoadingInstagram(false); }
  };

  const searchCars = async (searchInfo, saveOnSearch = false) => {
    const { keyword, brand, brandLabel, model, platform, city } = searchInfo;
    if (!keyword) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const searchId = `${brand}_${model || 'all'}_${platform || 'all'}_${city || 'all'}`;
    setLoading(true);
    setActiveSearchId(searchId);
    setShowPicker(false);
    setShowHeaderSearchBar(false);
    setHeaderSearch('');
    setActiveTab('results');

    if (saveOnSearch && selectedBrand) saveSearch(true);

    // 🚀 Instagram بالتوازي
    fetchInstagram(keyword).then(igResults => {
      if (igResults.length > 0) {
        setCachedSearches(prev => {
          const updated = { ...prev };
          if (!updated[searchId]) {
            updated[searchId] = {
              searchInfo: { keyword, brand, brandLabel, model, platform, city },
              results: igResults,
              savedAt: Date.now(),
              newLinks: [],
            };
          } else {
            const seen = new Set(updated[searchId].results.map(c => c.link));
            const newOnes = igResults.filter(c => !seen.has(c.link));
            updated[searchId].results = [...updated[searchId].results, ...newOnes];
          }
          AsyncStorage.setItem('scoop_cached_searches', JSON.stringify(updated));
          return updated;
        });
        setLoading(false);
      }
    });

    try {
      const params = new URLSearchParams({ q: keyword });
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (city) params.append('city', city);
      if (yearFrom) params.append('yearFrom', yearFrom);
      if (yearTo) params.append('yearTo', yearTo);
      if (kmFrom) params.append('kmFrom', kmFrom);
      if (kmTo) params.append('kmTo', kmTo);
      if (selectedCondition) params.append('condition', selectedCondition);
      if (selectedFuel) params.append('fuel', selectedFuel);
      if (selectedColor) params.append('color', selectedColor);

      const res = await fetch(API_URL + '/search?' + params.toString());
      const data = await res.json();
      let results = Array.isArray(data) ? data : [];

      if (platform && platform !== 'all') {
        results = results.filter(c => c.source === platform);
      }

      await saveCachedSearch(searchId, {
        keyword, brand, brandLabel, model, platform, city
      }, results, []);
      setLoading(false); // ⚡ Streaming: قفل اللودينق فور وصول نتائج Dubizzle

      // تحليل AI في الخلفية
      results.forEach(async (car, index) => {
        try {
          const ev = await fetch(API_URL + '/evaluate?name=' + encodeURIComponent(car.name || '') + '&price=' + (car.price || 0));
          const evData = await ev.json();
          setCachedSearches(prev => {
            const updated = { ...prev };
            if (updated[searchId]) {
              updated[searchId].results = updated[searchId].results.map((c, i) =>
                i === index ? { ...c, evaluation: evData.evaluation } : c
              );
              AsyncStorage.setItem('scoop_cached_searches', JSON.stringify(updated));
            }
            return updated;
          });
        } catch (e) {}
      });

      
    } catch (e) {
      console.log('Search error:', e);
    }
    setLoading(false);
  };

  const refreshSearch = async (searchId) => {
    const cached = cachedSearches[searchId];
    if (!cached) return;

    setRefreshing(true);
    try {
      const { keyword, platform, city } = cached.searchInfo;
      const params = new URLSearchParams({ q: keyword });
      if (city) params.append('city', city);

      const res = await fetch(API_URL + '/search?' + params.toString());
      const data = await res.json();
      let newResults = Array.isArray(data) ? data : [];

      if (platform && platform !== 'all') {
        newResults = newResults.filter(c => c.source === platform);
      }

      const existingLinks = new Set(cached.results.map(c => c.link));
      const trulyNew = newResults.filter(c => !existingLinks.has(c.link));

      if (trulyNew.length > 0) {
        const merged = [...trulyNew, ...cached.results];
        const newLinks = trulyNew.map(c => c.link);
        await saveCachedSearch(searchId, cached.searchInfo, merged, newLinks);

        trulyNew.forEach(async (car) => {
          try {
            const ev = await fetch(API_URL + '/evaluate?name=' + encodeURIComponent(car.name || '') + '&price=' + (car.price || 0));
            const evData = await ev.json();
            setCachedSearches(prev => {
              const updated = { ...prev };
              if (updated[searchId]) {
                updated[searchId].results = updated[searchId].results.map(c =>
                  c.link === car.link ? { ...c, evaluation: evData.evaluation } : c
                );
                AsyncStorage.setItem('scoop_cached_searches', JSON.stringify(updated));
              }
              return updated;
            });
          } catch (e) {}
        });

        Alert.alert(
          '🎉 ' + (lang === 'ar' ? 'سيارات جديدة' : 'New cars'),
          `${trulyNew.length} ${t.newCarsFound}`
        );
      } else {
        Alert.alert('', t.noNewCars);
        await saveCachedSearch(searchId, cached.searchInfo, cached.results, []);
      }
    } catch (e) {
      console.log('Refresh error:', e);
    }
    setRefreshing(false);
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

const getPlatformComparisons = (car, allCars) => {
    if (!car.name || !car.price) return [];
    const carWords = car.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const carBrand = carWords[0] || '';
    const carModel = carWords[1] || '';
    const sameCars = allCars.filter(c => {
      if (!c.name || c.link === car.link || !c.price || c.price <= 0) return false;
      const cName = c.name.toLowerCase();
      if (!cName.includes(carBrand) || (carModel && !cName.includes(carModel))) return false;
      if (car.year && c.year) {
        const yearDiff = Math.abs(parseInt(car.year) - parseInt(c.year));
        if (yearDiff > 2) return false;
      }
      if (car.km && c.km) {
        const kmDiff = Math.abs(parseInt(car.km) - parseInt(c.km));
        if (kmDiff > 30000) return false;
      }
      return true;
    });
    return sameCars.sort((a, b) => a.price - b.price).slice(0, 3);
  };  

  const NAV_HEIGHT = 56 + insets.bottom;
  const SOURCE_COLORS = isDark ? SOURCE_COLORS_DARK : SOURCE_COLORS_LIGHT;
  const selectedPlatformLabel = PLATFORMS.find(p => p.id === selectedPlatform);

  const cachedSearchesList = Object.keys(cachedSearches).map(id => ({
    id, ...cachedSearches[id]
  })).sort((a, b) => b.savedAt - a.savedAt);

  const activeCache = activeSearchId ? cachedSearches[activeSearchId] : null;
  const activeResults = activeCache?.results || [];
  const activeNewLinks = activeCache?.newLinks || [];

  const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 10) / 2;

  const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: CT.bg },
    header: { backgroundColor: CT.hdrBg, paddingTop: insets.top + 8, paddingBottom: 10, paddingHorizontal: 16, elevation: 4 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    badge: { position: 'absolute', top: -3, right: -3, backgroundColor: CT.blue, borderRadius: 9, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    headerSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    headerSearchInput: { flex: 1, backgroundColor: CT.searchBg, borderWidth: 0.5, borderColor: CT.searchBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, color: '#fff', fontSize: 13, textAlign: 'right' },
    headerSearchBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' },

    onboardingCard: { backgroundColor: CT.navyDark, borderRadius: 16, margin: 16, padding: 18, alignItems: 'center', borderWidth: 0.5, borderColor: isDark ? '#534AB7' : '#AFA9EC' },
    onboardingTitle: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
    onboardingSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', marginBottom: 14 },
    onboardingBtn: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 8 },
    onboardingBtnText: { color: CT.navyDark, fontSize: 13, fontWeight: '700' },

    createBtnPrimary: { backgroundColor: CT.navyDark, borderRadius: 14, marginHorizontal: 16, marginTop: 6, marginBottom: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    createBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    secHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 6, marginBottom: 10 },
    secTitle: { fontSize: 15, fontWeight: '600', color: CT.textPrimary },
    countBadge: { backgroundColor: CT.tagBg, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    countBadgeText: { color: CT.navy, fontSize: 11, fontWeight: '600' },

    // ===== شريط البحوث المحفوظة =====
    cachedSearchesBar: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: CT.card, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder },
    cachedSearchChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: CT.bg, borderWidth: 1, borderColor: CT.cardBorder, marginRight: 8 },
    cachedSearchChipActive: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    cachedSearchChipText: { fontSize: 12, color: CT.textSecondary, fontWeight: '500' },
    cachedSearchChipTextActive: { color: '#fff', fontWeight: '700' },
    cachedSearchChipCount: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
    cachedSearchChipCountText: { fontSize: 10, color: '#fff', fontWeight: '700' },

    // ===== شريط البحث النشط =====
    activeSearchHdr: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CT.bg },
    activeSearchInfo: { flex: 1, alignItems: 'flex-end' },
    activeSearchTitle: { fontSize: 13, fontWeight: '700', color: CT.textPrimary, textAlign: 'right' },
    activeSearchSub: { fontSize: 10, color: CT.textMuted, textAlign: 'right', marginTop: 2 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: CT.navyDark, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    refreshBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // ===== Grid 2x =====
    gridCard: { width: CARD_WIDTH, backgroundColor: CT.card, borderRadius: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: CT.cardBorder, marginBottom: 10 },
    gridCardImg: { width: '100%', height: CARD_WIDTH * 0.75 },
    gridCardImgPlaceholder: { width: '100%', height: CARD_WIDTH * 0.75, backgroundColor: CT.tagBg, justifyContent: 'center', alignItems: 'center' },
    gridCardBody: { padding: 10 },
    gridCardName: { color: CT.textPrimary, fontSize: 11, fontWeight: '600', textAlign: 'right', marginBottom: 4, minHeight: 30 },
    gridCardPrice: { color: CT.textPrimary, fontSize: 14, fontWeight: 'bold', textAlign: 'right' },    gridCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    gridCardSourceBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    gridCardSourceText: { fontSize: 9, fontWeight: '700' },
    gridCardHeart: { padding: 4 },
    newBadgeOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: CT.newBadge, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, zIndex: 10 },
    newBadgeText: { color: CT.newBadgeText, fontSize: 9, fontWeight: '900' },

    // ===== Modal تفاصيل =====
    detailsModalBox: { backgroundColor: CT.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
    detailsHandle: { width: 40, height: 4, backgroundColor: CT.cardBorder, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
    detailsHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
    detailsTitle: { color: CT.textPrimary, fontSize: 16, fontWeight: 'bold' },
    detailsImg: { width: '100%', height: 220 },
    detailsImgPlaceholder: { width: '100%', height: 220, backgroundColor: CT.tagBg, justifyContent: 'center', alignItems: 'center' },
    detailsContent: { padding: 16 },
    detailsName: { color: CT.textPrimary, fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
    detailsPrice: { color: CT.textPrimary, fontSize: 26, fontWeight: 'bold', textAlign: 'right', marginBottom: 16 },
    detailsSection: { marginBottom: 16 },
    detailsSectionTitle: { fontSize: 12, fontWeight: '700', color: CT.textSecondary, marginBottom: 8, textAlign: 'right' },
    detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
    detailsTag: { backgroundColor: CT.tagBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    detailsTagText: { fontSize: 12, color: CT.tagText, fontWeight: '500' },
    detailsEvalBox: { borderRadius: 10, padding: 12 },
    detailsEvalText: { fontSize: 13, fontWeight: '600', textAlign: 'right', lineHeight: 20 },
    detailsActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    detailsOpenBtn: { flex: 1, backgroundColor: CT.navyDark, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    detailsOpenBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    detailsActionBtn: { width: 50, backgroundColor: CT.tagBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    // البحوث المحفوظة
    savedCard: { backgroundColor: CT.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 10, padding: 14, borderWidth: 0.5, borderColor: CT.cardBorder },
    savedCardHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    savedCardTitle: { fontSize: 14, fontWeight: '700', color: CT.textPrimary, textAlign: 'right' },
    savedCardSub: { fontSize: 11, color: CT.textMuted, textAlign: 'right', marginTop: 2 },
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

    loadingBox: { alignItems: 'center', marginTop: 60 },
    loadingText: { color: CT.textSecondary, marginTop: 12, fontSize: 14 },

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
    nameInput: { backgroundColor: CT.bg, color: CT.textPrimary, padding: 12, borderRadius: 10, fontSize: 13, borderWidth: 1, borderColor: CT.cardBorder, textAlign: 'right', marginBottom: 14 },

    typeTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    typeTab: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: CT.bg, borderWidth: 2, borderColor: 'transparent' },
    typeTabOn: { backgroundColor: CT.tagBg, borderColor: CT.navyDark },
    typeTabLabel: { fontSize: 11, color: CT.textMuted },
    typeTabLabelOn: { color: CT.navyDark, fontWeight: 'bold' },

    dropdownTrigger: { backgroundColor: CT.bg, borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: CT.cardBorder, marginBottom: 12 },
    dropdownTriggerOpen: { borderColor: CT.navyDark, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    dropdownTriggerDisabled: { opacity: 0.45 },
    dropdownTriggerText: { fontSize: 13, color: CT.textPrimary, flex: 1, textAlign: 'right' },
    dropdownTriggerPlaceholder: { color: CT.textMuted },
    dropdownTriggerEmoji: { fontSize: 16, marginLeft: 8 },
    dropdownList: { backgroundColor: CT.bg, borderWidth: 1, borderColor: CT.navyDark, borderTopWidth: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, marginTop: -12, marginBottom: 12, overflow: 'hidden', maxHeight: 260 },
    dropdownSearch: { backgroundColor: CT.card, padding: 10, fontSize: 12, color: CT.textPrimary, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder, textAlign: 'right' },
    dropdownItem: { padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder },
    dropdownItemActive: { backgroundColor: CT.tagBg },
    dropdownItemText: { fontSize: 13, color: CT.textPrimary, flex: 1, textAlign: 'right' },

    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    rangeInput: { flex: 1, backgroundColor: CT.bg, color: CT.textPrimary, padding: 11, borderRadius: 10, fontSize: 13, borderWidth: 1, borderColor: CT.cardBorder },
    rangeDash: { color: CT.textMuted, fontSize: 16 },

    modalBtnsRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 30 },
    modalBtnSecondary: { flex: 1, backgroundColor: CT.tagBg, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: CT.navy },
    modalBtnSecondaryText: { color: CT.navy, fontWeight: 'bold', fontSize: 14 },
    modalBtnPrimary: { flex: 1, backgroundColor: CT.navyDark, borderRadius: 14, padding: 14, alignItems: 'center' },
    modalBtnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: CT.bg, borderWidth: 1, borderColor: CT.cardBorder },
    pillOn: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    pillEmoji: { fontSize: 14 },
    pillText: { fontSize: 12, color: CT.textSecondary, fontWeight: '500' },
    pillTextOn: { color: '#fff', fontWeight: 'bold' },

    colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14, justifyContent: 'flex-start' },
    colorItem: { alignItems: 'center', width: 52 },
    colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: CT.cardBorder, marginBottom: 4 },
    colorCircleOn: { borderColor: CT.navyDark, borderWidth: 3 },
    colorLabel: { color: CT.textMuted, fontSize: 9, textAlign: 'center' },
    colorLabelOn: { color: CT.navy, fontWeight: 'bold' },

    filterLabel: { color: CT.textSecondary, fontSize: 12, marginBottom: 10, textAlign: 'right', fontWeight: '600' },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
    chip: { backgroundColor: CT.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: CT.cardBorder },
    chipOn: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    chipText: { color: CT.textSecondary, fontSize: 12 },
    chipTextOn: { color: '#fff', fontWeight: 'bold' },
    applyBtn: { backgroundColor: CT.navyDark, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
    applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

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

  const renderGridCard = ({ item }) => {
    const fav = isFavorite(item);
    const isNew = activeNewLinks.includes(item.link);
    return (
      <TouchableOpacity
        style={S.gridCard}
        onPress={() => { setSelectedCar(item); setShowCarDetails(true); }}
        activeOpacity={0.7}
      >
        {isNew && (
          <View style={S.newBadgeOverlay}>
            <Text style={S.newBadgeText}>✨ {t.newBadge}</Text>
          </View>
        )}
        {item.image ? (
          <Image source={{ uri: item.image }} style={S.gridCardImg} resizeMode="cover" />
        ) : (
          <View style={S.gridCardImgPlaceholder}>
            <Ionicons name="car-outline" size={36} color={CT.navy} />
          </View>
        )}
        <View style={S.gridCardBody}>
          <Text style={S.gridCardName} numberOfLines={2}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 6 }}>
            <Text style={S.gridCardPrice}>
              {item.price > 0 ? `AED ${item.price?.toLocaleString()}` : t.contactForPrice}
            </Text>
            <View style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: getEvalColor(item.evaluation),
            }} />
          </View>
          <View style={S.gridCardFooter}>
            <TouchableOpacity
              style={S.gridCardHeart}
              onPress={(e) => { e.stopPropagation(); toggleFavorite(item); }}
            >
              <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? CT.heartActive : CT.heartInactive} />
            </TouchableOpacity>
            {item.source && (
              <View style={[S.gridCardSourceBadge, { backgroundColor: SOURCE_COLORS[item.source] || CT.tagBg }]}>
                <Text style={[S.gridCardSourceText, { color: SOURCE_TEXT[item.source] || CT.navy }]}>
                  {PLATFORMS.find(p => p.id === item.source)?.emoji || ''} {item.source}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCarDetailsModal = () => {
    if (!selectedCar) return null;
    const comparisons = getPlatformComparisons(selectedCar, activeResults);
    const fav = isFavorite(selectedCar);

    return (
      <Modal visible={showCarDetails} animationType="slide" transparent onRequestClose={() => setShowCarDetails(false)}>
        <View style={S.modalOverlay}>
          <View style={S.detailsModalBox}>
            <View style={S.detailsHandle} />
            <View style={S.detailsHdr}>
              <TouchableOpacity onPress={() => setShowCarDetails(false)}>
                <Ionicons name="close" size={24} color={CT.textSecondary} />
              </TouchableOpacity>
              <Text style={S.detailsTitle}>{t.carDetails}</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedCar.image ? (
                <Image source={{ uri: selectedCar.image }} style={S.detailsImg} resizeMode="cover" />
              ) : (
                <View style={S.detailsImgPlaceholder}>
                  <Ionicons name="car-outline" size={60} color={CT.navy} />
                </View>
              )}
              <View style={S.detailsContent}>
                <Text style={S.detailsName}>{selectedCar.name}</Text>
                <Text style={S.detailsPrice}>
                  {selectedCar.price > 0 ? `AED ${selectedCar.price?.toLocaleString()}` : t.contactForPrice}
                </Text>

                <View style={S.detailsSection}>
                  <Text style={S.detailsSectionTitle}>📋 {t.info}</Text>
                  <View style={S.detailsRow}>
                    {selectedCar.city && <View style={S.detailsTag}><Text style={S.detailsTagText}>📍 {selectedCar.city}</Text></View>}
                    {selectedCar.year && <View style={S.detailsTag}><Text style={S.detailsTagText}>📅 {selectedCar.year}</Text></View>}
                    {selectedCar.km && <View style={S.detailsTag}><Text style={S.detailsTagText}>🛣️ {selectedCar.km?.toLocaleString()} km</Text></View>}
                    {selectedCar.color && <View style={S.detailsTag}><Text style={S.detailsTagText}>🎨 {selectedCar.color}</Text></View>}
                    {selectedCar.source && (
                      <View style={[S.detailsTag, { backgroundColor: SOURCE_COLORS[selectedCar.source] || CT.tagBg }]}>
                        <Text style={[S.detailsTagText, { color: SOURCE_TEXT[selectedCar.source] || CT.navy }]}>
                          {PLATFORMS.find(p => p.id === selectedCar.source)?.emoji} {selectedCar.source}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={S.detailsSection}>
                  <Text style={S.detailsSectionTitle}>🤖 {t.priceAnalysis}</Text>
                  <View style={[S.detailsEvalBox, { backgroundColor: getEvalBg(selectedCar.evaluation) }]}>
                    <Text style={[S.detailsEvalText, { color: getEvalColor(selectedCar.evaluation) }]}>
                      {getEvalEmoji(selectedCar.evaluation)} {selectedCar.evaluation || t.analyzing}
                    </Text>
                  </View>
                </View>

                {comparisons.length > 0 && (
                  <View style={S.detailsSection}>
                    <Text style={S.detailsSectionTitle}>🔄 {t.comparePlatforms}</Text>
                    {comparisons.map((c, i) => (
                      <TouchableOpacity
                        key={i}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, marginBottom: 6, borderRadius: 10, backgroundColor: CT.bg, borderWidth: 0.5, borderColor: CT.cardBorder }}
                        onPress={() => openListing(c.link)}
                      >
                        <Text style={{ fontSize: 11, color: CT.textSecondary }}>
                          {PLATFORMS.find(p => p.id === c.source)?.emoji} {c.source}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: c.price < selectedCar.price ? CT.activeGreen : CT.textPrimary }}>
                          AED {c.price?.toLocaleString()}{c.price < selectedCar.price && ' 🥇'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={S.detailsActions}>
                  <TouchableOpacity
                    style={[S.detailsActionBtn, { backgroundColor: fav ? CT.activeRedBg : CT.tagBg }]}
                    onPress={() => toggleFavorite(selectedCar)}
                  >
                    <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? CT.heartActive : CT.heartInactive} />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.detailsActionBtn} onPress={() => shareCar(selectedCar)}>
                    <Ionicons name="share-social-outline" size={22} color={CT.navy} />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.detailsOpenBtn} onPress={() => openListing(selectedCar.link)}>
                    <Ionicons name="open-outline" size={18} color="#fff" />
                    <Text style={S.detailsOpenBtnText}>{t.openListing}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHome = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {renderOnboarding()}
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
          <View style={S.emptyCircle}><PulsingIcon name="car-sport-outline" size={48} color={CT.navy} /></View>
          <Text style={S.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={S.emptySub}>{t.emptySub}</Text>
          <TouchableOpacity style={[S.emptyBtn, { marginTop: 20 }]} onPress={() => { resetSearchModal(); setShowPicker(true); }}>
            <Text style={S.emptyBtnText}>🚀 {t.createSearch}</Text>
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
          <View style={S.tagsRow}>
            {item.yearFrom && <View style={S.tag}><Text style={S.tagText}>📅 {item.yearFrom}{item.yearTo ? '-' + item.yearTo : ''}</Text></View>}
            {item.minPrice && <View style={S.tag}><Text style={S.tagText}>💰 {item.minPrice}{item.maxPrice ? '-' + item.maxPrice : '+'}</Text></View>}
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
            const keyword = item.model ? item.brand + ' ' + item.model : item.brand;
            searchCars({ keyword, brand: item.brand, brandLabel: item.brandLabel, model: item.model, platform: item.platform || 'all', city: item.city });
          }}>
            <Text style={S.searchAgainText}>{t.searchNow}</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: NAV_HEIGHT + 20 }} />
    </ScrollView>
  );

  const renderResults = () => {
    const hasCached = cachedSearchesList.length > 0;

    return (
      <View style={{ flex: 1 }}>
        {hasCached && (
          <View style={S.cachedSearchesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cachedSearchesList.map(item => {
                const isActive = activeSearchId === item.id;
                const newCount = item.newLinks?.length || 0;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[S.cachedSearchChip, isActive && S.cachedSearchChipActive]}
                    onPress={() => setActiveSearchId(item.id)}
                    onLongPress={() => {
                      Alert.alert(t.deleteConfirm, '', [
                        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
                        { text: lang === 'ar' ? 'حذف' : 'Delete', style: 'destructive', onPress: () => deleteCachedSearch(item.id) }
                      ]);
                    }}
                  >
                    <Text style={[S.cachedSearchChipText, isActive && S.cachedSearchChipTextActive]}>
                      {item.searchInfo.brandLabel?.split('/')[0]?.trim() || item.searchInfo.brand}
                      {item.searchInfo.model ? ' ' + item.searchInfo.model : ''}
                    </Text>
                    {newCount > 0 && (
                      <View style={[S.cachedSearchChipCount, !isActive && { backgroundColor: CT.newBadge }]}>
                        <Text style={[S.cachedSearchChipCountText, !isActive && { color: CT.newBadgeText }]}>{newCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {activeCache && (
          <View style={S.activeSearchHdr}>
            <TouchableOpacity style={S.refreshBtn} onPress={() => refreshSearch(activeSearchId)} disabled={refreshing}>
              {refreshing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="refresh" size={14} color="#fff" />}
              <Text style={S.refreshBtnText}>{refreshing ? t.refreshing : t.refresh}</Text>
            </TouchableOpacity>
            <View style={S.activeSearchInfo}>
              <Text style={S.activeSearchTitle}>{activeResults.length} {t.results}</Text>
              <Text style={S.activeSearchSub}>{t.lastUpdated}: {getRelativeTime(activeCache.savedAt, lang)}</Text>
            </View>
          </View>
        )}

        {loading && (
          <FlatList
            data={[1,2,3,4,5,6]}
            keyExtractor={(_, i) => 'skel' + i}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20, paddingTop: 4 }}
            renderItem={() => (
              <View style={[S.gridCard, { opacity: 0.6 }]}>
                <ShimmerBox style={S.gridCardImg} isDark={isDark} />
                <View style={S.gridCardBody}>
                  <ShimmerBox style={{ height: 12, borderRadius: 4, marginBottom: 6 }} isDark={isDark} />
                  <ShimmerBox style={{ height: 12, borderRadius: 4, marginBottom: 12, width: '70%' }} isDark={isDark} />
                  <ShimmerBox style={{ height: 18, borderRadius: 4, marginBottom: 10, width: '50%', alignSelf: 'flex-end' }} isDark={isDark} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ShimmerBox style={{ width: 24, height: 24, borderRadius: 12 }} isDark={isDark} />
                    <ShimmerBox style={{ width: 60, height: 18, borderRadius: 6 }} isDark={isDark} />
                  </View>
                </View>
              </View>
            )}
          />
        )}

        {!loading && !hasCached && (
          <View style={S.emptyState}>
            <View style={S.emptyCircle}><PulsingIcon name="search" size={48} color={CT.navy} /></View>
            <Text style={S.emptyTitle}>{t.emptyTitle}</Text>
            <Text style={S.emptySub}>{t.emptySub}</Text>
            <TouchableOpacity style={S.emptyBtn} onPress={() => { resetSearchModal(); setShowPicker(true); }}>
              <Text style={S.emptyBtnText}>{t.createSearch}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && hasCached && !activeCache && (
          <View style={S.emptyState}>
            <Text style={S.emptySub}>{t.tapSearchToView}</Text>
          </View>
        )}

        {!loading && activeResults.length > 0 && (
          <FlatList
            data={activeResults}
            keyExtractor={(_, i) => i.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20, paddingTop: 4 }}
            renderItem={renderGridCard}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => activeSearchId && refreshSearch(activeSearchId)}
                colors={[CT.navy]}
                tintColor={CT.navy}
              />
            }
          />
        )}
      </View>
    );
  };

  const renderFavorites = () => (
    <View style={{ flex: 1 }}>
      <View style={S.favHdr}>
        <Text style={S.favTitle}>{t.favorites} ❤️</Text>
        <Text style={S.favSub}>{favorites.length > 0 ? `${favorites.length} ${t.results}` : t.favoritesEmptySub}</Text>
      </View>
      {favorites.length === 0 ? (
        <View style={S.emptyState}>
          <View style={S.emptyCircle}><PulsingIcon name="heart-outline" size={48} color={CT.activeRed} /></View>
          <Text style={S.emptyTitle}>{t.favoritesEmpty}</Text>
          <Text style={S.emptySub}>{t.favoritesEmptySub}</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(_, i) => i.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20, paddingTop: 4 }}
          renderItem={renderGridCard}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={loadFavorites}
              colors={[CT.navy]}
              tintColor={CT.navy}
            />
          }
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
          <View style={S.emptyCircle}><PulsingIcon name="bookmark-outline" size={48} color={CT.navy} /></View>
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
            const keyword = item.model ? item.brand + ' ' + item.model : item.brand;
            searchCars({ keyword, brand: item.brand, brandLabel: item.brandLabel, model: item.model, platform: item.platform || 'all', city: item.city });
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
      <Text style={S.versionText}>Version 2.0.0</Text>
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
              onPress={() => {
                if (headerSearch.trim()) {
                  searchCars({ keyword: headerSearch.trim(), brand: headerSearch.trim(), brandLabel: headerSearch.trim(), model: null, platform: 'all', city: null });
                }
              }}
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
              onSubmitEditing={() => {
                if (headerSearch.trim()) {
                  searchCars({ keyword: headerSearch.trim(), brand: headerSearch.trim(), brandLabel: headerSearch.trim(), model: null, platform: 'all', city: null });
                }
              }}
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

      {renderCarDetailsModal()}

      {/* Modal إنشاء بحث */}
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

              <Text style={S.sectionLabel}>{t.searchName}</Text>
              <TextInput
                style={S.nameInput}
                placeholder={t.searchNamePlaceholder}
                placeholderTextColor={CT.textMuted}
                value={searchName}
                onChangeText={setSearchName}
              />

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
                    {filteredBrands.map(brand => (
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

              <Text style={S.sectionLabel}>🚗 {t.model}</Text>
              <TouchableOpacity
                style={[
                  S.dropdownTrigger,
                  modelDropdownOpen && S.dropdownTriggerOpen,
                  !selectedBrand && S.dropdownTriggerDisabled,
                ]}
                onPress={() => {
                  if (!selectedBrand) return;
                  setModelDropdownOpen(!modelDropdownOpen);
                  setPlatformsDropdownOpen(false); setBrandDropdownOpen(false);
                }}
                disabled={!selectedBrand}
              >
                <Ionicons name={modelDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={CT.textSecondary} />
                <Text style={[S.dropdownTriggerText, !selectedModel && S.dropdownTriggerPlaceholder]}>
                  {selectedModel || (selectedBrand ? t.selectModelHint : t.selectBrandFirst)}
                </Text>
                <Ionicons name="speedometer-outline" size={18} color={CT.textSecondary} style={{ marginLeft: 8 }} />
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

              <Text style={S.sectionLabel}>📅 {t.yearRange}</Text>
              <View style={S.rangeRow}>
                <TextInput style={S.rangeInput} placeholder={t.from} placeholderTextColor={CT.textMuted} value={yearFrom} onChangeText={setYearFrom} keyboardType="numeric" />
                <Text style={S.rangeDash}>—</Text>
                <TextInput style={S.rangeInput} placeholder={t.to} placeholderTextColor={CT.textMuted} value={yearTo} onChangeText={setYearTo} keyboardType="numeric" />
              </View>

              <Text style={S.sectionLabel}>💰 {t.priceRange}</Text>
              <View style={S.rangeRow}>
                <TextInput style={S.rangeInput} placeholder={t.from} placeholderTextColor={CT.textMuted} value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
                <Text style={S.rangeDash}>—</Text>
                <TextInput style={S.rangeInput} placeholder={t.to} placeholderTextColor={CT.textMuted} value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
              </View>

              <Text style={S.sectionLabel}>✨ {t.condition}</Text>
              <View style={S.pillsRow}>
                {CONDITIONS.map(c => {
                  const on = selectedCondition === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[S.pill, on && S.pillOn]}
                      onPress={() => setSelectedCondition(on ? '' : c.id)}
                    >
                      <Text style={S.pillEmoji}>{c.emoji}</Text>
                      <Text style={[S.pillText, on && S.pillTextOn]}>{lang === 'ar' ? c.label : c.labelEn}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={S.sectionLabel}>⛽ {t.fuelType}</Text>
              <View style={S.pillsRow}>
                {FUEL_TYPES.map(f => {
                  const on = selectedFuel === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[S.pill, on && S.pillOn]}
                      onPress={() => setSelectedFuel(on ? '' : f.id)}
                    >
                      <Text style={S.pillEmoji}>{f.emoji}</Text>
                      <Text style={[S.pillText, on && S.pillTextOn]}>{lang === 'ar' ? f.label : f.labelEn}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={S.sectionLabel}>🎨 {t.color}</Text>
              <View style={S.colorsGrid}>
                {colorList.map((color, idx) => {
                  const on = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={S.colorItem}
                      onPress={() => setSelectedColor(on ? '' : color)}
                    >
                      <View style={[S.colorCircle, { backgroundColor: COLOR_HEX[idx] }, on && S.colorCircleOn]} />
                      <Text style={[S.colorLabel, on && S.colorLabelOn]}>{color}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={S.modalBtnsRow}>
                <TouchableOpacity
                  style={S.modalBtnSecondary}
                  onPress={() => {
                    if (!selectedBrand) return;
                    const keyword = selectedModel ? selectedBrand.value + ' ' + selectedModel : selectedBrand.value;
                    searchCars({ keyword, brand: selectedBrand.value, brandLabel: selectedBrand.label, model: selectedModel, platform: selectedPlatform, city: selectedCity }, true);
                  }}
                >
                  <Text style={S.modalBtnSecondaryText}>💾 {t.saveAndSearch}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.modalBtnPrimary}
                  onPress={() => {
                    if (!selectedBrand) return;
                    const keyword = selectedModel ? selectedBrand.value + ' ' + selectedModel : selectedBrand.value;
                    searchCars({ keyword, brand: selectedBrand.value, brandLabel: selectedBrand.label, model: selectedModel, platform: selectedPlatform, city: selectedCity });
                  }}
                >
                  <Text style={S.modalBtnPrimaryText}>{t.searchNow}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal فلاتر */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={S.modalHdr}>
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={S.resetText}>{t.reset}</Text>
                </TouchableOpacity>
                <Text style={S.modalTitle}>{t.searchFilters}</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Ionicons name="close" size={22} color={CT.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={S.filterLabel}>📍 {t.city}</Text>
              <View style={S.chipsWrap}>
                {cities.map(c => {
                  const on = selectedCity === c || (c === cities[0] && !selectedCity);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[S.chip, on && S.chipOn]}
                      onPress={() => setSelectedCity(c === cities[0] ? '' : c)}
                    >
                      <Text style={[S.chipText, on && S.chipTextOn]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={S.filterLabel}>🛣️ {t.km}</Text>
              <View style={S.rangeRow}>
                <TextInput style={S.rangeInput} placeholder={t.from} placeholderTextColor={CT.textMuted} value={kmFrom} onChangeText={setKmFrom} keyboardType="numeric" />
                <Text style={S.rangeDash}>—</Text>
                <TextInput style={S.rangeInput} placeholder={t.to} placeholderTextColor={CT.textMuted} value={kmTo} onChangeText={setKmTo} keyboardType="numeric" />
              </View>

              <TouchableOpacity style={S.applyBtn} onPress={() => setShowFilters(false)}>
                <Text style={S.applyBtnText}>{t.applySearch}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}