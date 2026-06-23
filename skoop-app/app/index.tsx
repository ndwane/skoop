import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView, Modal,
  Alert, Linking, Image, StatusBar, Dimensions, Animated, RefreshControl, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc, onSnapshot, query, where, serverTimestamp } from '../firebase';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { BRANDS_DATA } from './brandsData';

const MAX_IMAGES = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ADMIN_EMAILS = ['ndwanek@gmail.com'];

const CLOUDINARY_CLOUD = 'dybcfhrxi';
const CLOUDINARY_PRESET = 'scoop_unsigned';

const uploadToCloudinary = async (uri) => {
  const form = new FormData();
  form.append('file', { uri, type: 'image/jpeg', name: `scoop_${Date.now()}.jpg` });
  form.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Cloudinary upload failed');
  return data.secure_url;
};

const LIGHT = {
  hdrBg: '#26215C', bg: '#F8F6FF', card: '#FFFFFF', cardBorder: '#E8E4FF',
  textPrimary: '#26215C', textSecondary: '#534AB7', textMuted: '#9B96CC',
  navy: '#534AB7', navyDark: '#26215C', blue: '#534AB7', blueLight: '#AFA9EC',
  tagBg: '#F0EEFF', tagText: '#3C3489', inputBg: '#F0EEFF',
  navBg: '#FFFFFF', navBorder: '#E8E4FF', modalBg: '#FFFFFF',
  activeGreen: '#16A34A', activeGreenBg: '#DCFCE7',
  activeRed: '#DC2626', activeRedBg: '#FEE2E2',
  activeYellow: '#F59E0B', activeYellowBg: '#FEF3C7',
  toggleOn: '#534AB7', toggleOff: '#D1D1D6',
};

const DARK = {
  hdrBg: '#120D2E', bg: '#0D0A1E', card: '#1E1545', cardBorder: '#3C3489',
  textPrimary: '#EEEDFE', textSecondary: '#AFA9EC', textMuted: '#534AB7',
  navy: '#7F77DD', navyDark: '#534AB7', blue: '#7F77DD', blueLight: '#AFA9EC',
  tagBg: '#120D2E', tagText: '#AFA9EC', inputBg: '#1E1545',
  navBg: '#120D2E', navBorder: '#2A1F5A', modalBg: '#1E1545',
  activeGreen: '#4ADE80', activeGreenBg: '#0D2E1A',
  activeRed: '#F09595', activeRedBg: '#2E0D0D',
  activeYellow: '#FCD34D', activeYellowBg: '#2E200D',
  toggleOn: '#534AB7', toggleOff: '#2A1F5A',
};

const CONDITIONS = [
  { id: 'new', label: 'جديد', labelEn: 'New' },
  { id: 'like_new', label: 'شبه جديد', labelEn: 'Like New' },
  { id: 'used', label: 'مستعمل', labelEn: 'Used' },
];

const CONDITION_LABELS = { new: 'جديد', like_new: 'شبه جديد', used: 'مستعمل' };

const BODY_TYPES = ['دفع رباعي', 'سيدان', 'كوبيه', 'هاتشباك', 'بيك أب', 'فان'];
const CAR_COLORS = ['أبيض', 'أسود', 'فضي', 'رمادي', 'أحمر', 'أزرق', 'أخضر', 'بني', 'ذهبي', 'برتقالي'];
const CAR_FEATURES = ['فتحة سقف', 'كاميرا خلفية', 'كاميرا 360', 'كراسي جلد', 'كراسي مدفّأة', 'كراسي مبرّدة', 'بلوتوث', 'شاشة', 'حساسات ركن', 'مثبت سرعة', 'تحكم بصمة', 'مفاتيح ذكية'];

const MOTO_BRANDS = [
  { label: 'هارلي ديفيدسون / Harley-Davidson', value: 'harley', models: ['Sportster','Iron 883','Fat Boy','Street Glide','Road King','Forty-Eight','Breakout'] },
  { label: 'ياماها / Yamaha', value: 'yamaha-moto', models: ['YZF-R1','YZF-R6','YZF-R7','MT-07','MT-09','MT-10','Tracer','XSR'] },
  { label: 'هوندا / Honda', value: 'honda-moto', models: ['CBR600RR','CBR1000RR','CB650R','CB500','Africa Twin','Rebel','Gold Wing'] },
  { label: 'كاواساكي / Kawasaki', value: 'kawasaki', models: ['Ninja 400','Ninja 650','Ninja ZX-6R','Ninja ZX-10R','Z900','Z650','Versys','Vulcan'] },
  { label: 'سوزوكي / Suzuki', value: 'suzuki-moto', models: ['GSX-R600','GSX-R750','GSX-R1000','Hayabusa','V-Strom','SV650','Katana'] },
  { label: 'دوكاتي / Ducati', value: 'ducati', models: ['Panigale V2','Panigale V4','Monster','Multistrada','Diavel','Scrambler','Streetfighter'] },
  { label: 'بي إم دبليو / BMW', value: 'bmw-moto', models: ['S 1000 RR','R 1250 GS','F 900 R','R nineT','G 310 R','F 850 GS'] },
  { label: 'كي تي إم / KTM', value: 'ktm', models: ['Duke 390','Duke 790','Duke 890','RC 390','1290 Super Duke','Adventure'] },
  { label: 'تريومف / Triumph', value: 'triumph', models: ['Street Triple','Speed Triple','Bonneville','Tiger','Rocket 3','Trident'] },
  { label: 'إنديان / Indian', value: 'indian', models: ['Scout','Chief','Chieftain','Springfield','FTR'] },
  { label: 'رويال إنفيلد / Royal Enfield', value: 'royal-enfield', models: ['Classic 350','Meteor 350','Himalayan','Continental GT','Hunter 350'] },
  { label: 'أبريليا / Aprilia', value: 'aprilia', models: ['RS 660','Tuono','RSV4'] },
  { label: 'فيسبا / Vespa', value: 'vespa', models: ['Primavera','GTS','Sprint'] },
  { label: 'غير ذلك / Other', value: 'moto-other', models: [] },
];

const BIKE_BRANDS = [
  { label: 'تريك / Trek', value: 'trek', models: ['Marlin','FX','Domane','Émonda','Fuel EX','Verve','Roscoe'] },
  { label: 'جاينت / Giant', value: 'giant', models: ['Talon','Escape','Defy','TCR','Trance','Contend','Revolt'] },
  { label: 'سبيشالايزد / Specialized', value: 'specialized', models: ['Rockhopper','Sirrus','Allez','Tarmac','Stumpjumper','Roubaix'] },
  { label: 'كانونديل / Cannondale', value: 'cannondale', models: ['Trail','Quick','Synapse','CAAD','Topstone','Scalpel'] },
  { label: 'سكوت / Scott', value: 'scott', models: ['Aspect','Scale','Spark','Addict','Sub Cross'] },
  { label: 'ميريدا / Merida', value: 'merida', models: ['Big Nine','Scultura','Reacto','Crossway'] },
  { label: 'كانيون / Canyon', value: 'canyon', models: ['Grand Canyon','Ultimate','Endurace','Spectral'] },
  { label: 'جي تي / GT', value: 'gt-bike', models: ['Aggressor','Avalanche','Performer'] },
  { label: 'بيانكي / Bianchi', value: 'bianchi', models: ['Via Nirone','Sprint','Oltre'] },
  { label: 'غير ذلك / Other', value: 'bike-other', models: [] },
];

const PART_TYPES = [
  'إطارات', 'رينقات (جنوط)', 'مساعدات', 'بطارية', 'ردياتير',
  'دينمو', 'مكينة (محرك)', 'قير (ناقل حركة)', 'مكيف / كمبروسر',
  'فرامل (دسكات/تيل)', 'عمود إكسل', 'طرمبة بنزين', 'كشافات / أنوار',
  'مرايا', 'صدامات (دعاميات)', 'كبوت / غطاء محرك', 'أبواب',
  'كراسي / مقاعد', 'طبلون', 'زجاج', 'عفشة', 'بواجي', 'فلتر',
  'سير المكينة', 'علبة دركسون', 'راديو / شاشة', 'كمبيوتر السيارة',
];

const CITIES = {
  ar: ['الكل','دبي','أبوظبي','الشارقة','عجمان','رأس الخيمة','الفجيرة','أم القيوين','العين'],
  en: ['All','Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain','Al Ain'],
};

const CITY_COORDS = {
  'دبي': { lat: 25.2048, lng: 55.2708 }, 'Dubai': { lat: 25.2048, lng: 55.2708 },
  'أبوظبي': { lat: 24.4539, lng: 54.3773 }, 'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
  'الشارقة': { lat: 25.3463, lng: 55.4211 }, 'Sharjah': { lat: 25.3463, lng: 55.4211 },
  'عجمان': { lat: 25.4052, lng: 55.5136 }, 'Ajman': { lat: 25.4052, lng: 55.5136 },
  'رأس الخيمة': { lat: 25.7895, lng: 55.9432 }, 'Ras Al Khaimah': { lat: 25.7895, lng: 55.9432 },
  'الفجيرة': { lat: 25.1288, lng: 56.3265 }, 'Fujairah': { lat: 25.1288, lng: 56.3265 },
  'أم القيوين': { lat: 25.5333, lng: 55.5553 }, 'Umm Al Quwain': { lat: 25.5333, lng: 55.5553 },
  'العين': { lat: 24.2075, lng: 55.7447 }, 'Al Ain': { lat: 24.2075, lng: 55.7447 },
};

const normalizeEmirate = (g) => {
  const hay = `${g?.region || ''} ${g?.city || ''} ${g?.subregion || ''} ${g?.name || ''}`.toLowerCase();
  if (hay.includes('al ain') || hay.includes('al-ain') || hay.includes('العين')) return 'العين';
  if (hay.includes('dubai') || hay.includes('دبي')) return 'دبي';
  if (hay.includes('abu dhabi') || hay.includes('أبوظبي') || hay.includes('ابوظبي')) return 'أبوظبي';
  if (hay.includes('sharjah') || hay.includes('الشارقة')) return 'الشارقة';
  if (hay.includes('ajman') || hay.includes('عجمان')) return 'عجمان';
  if (hay.includes('ras al khaimah') || hay.includes('رأس الخيمة')) return 'رأس الخيمة';
  if (hay.includes('fujairah') || hay.includes('الفجيرة')) return 'الفجيرة';
  if (hay.includes('umm al quwain') || hay.includes('أم القيوين')) return 'أم القيوين';
  return '';
};

const VEHICLE_CATS = [
  { id: 'veh_car', label: 'سيارات', icon: 'car-side', color: '#1E7A46', bg: '#DCFCE7', bgDark: '#0D2E1A' },
  { id: 'veh_motorcycle', label: 'دراجات نارية', icon: 'motorbike', color: '#BA7517', bg: '#FAEEDA', bgDark: '#2E200D' },
  { id: 'veh_sportbike', label: 'دراجات رياضية', icon: 'racing-helmet', color: '#993556', bg: '#FBEAF0', bgDark: '#2E0D0D' },
  { id: 'veh_bicycle', label: 'دراجات هوائية', icon: 'bike', color: '#0F6E56', bg: '#E1F5EE', bgDark: '#0D2E1A' },
  { id: 'veh_other', label: 'مركبات أخرى', icon: 'truck', color: '#185FA5', bg: '#E6F1FB', bgDark: '#0d1535' },
];

const CATEGORIES = [
  { id: 'cars', label: 'قطع سيارات', icon: 'car-side', color: '#534AB7', bg: '#EEEDFE', bgDark: '#1E1545' },
  { id: 'motorcycles', label: 'قطع دراجات نارية', icon: 'motorbike', color: '#BA7517', bg: '#FAEEDA', bgDark: '#2E200D' },
  { id: 'bicycles', label: 'قطع سياكل هوائية', icon: 'bike', color: '#0F6E56', bg: '#E1F5EE', bgDark: '#0D2E1A' },
  { id: 'rc_planes', label: 'طائرات تحكم RC', icon: 'airplane', color: '#185FA5', bg: '#E6F1FB', bgDark: '#0d1535', isNew: true },
  { id: 'rc_cars', label: 'سيارات تحكم RC', icon: 'car-sports', img: require('../assets/cat-icons/rc_cars.png'), color: '#993556', bg: '#FBEAF0', bgDark: '#2E0D0D', isNew: true },
];

const TERMS_TEXT = `الشروط والأحكام — منصة سكوب (Scoop)
آخر تحديث: ٢٠٢٦

باستخدامك تطبيق سكوب وإنشاء حساب أو نشر إعلان، فإنك تقرّ بموافقتك على الشروط التالية:

١) الأهلية
يجب أن يكون عمرك ١٨ سنة فأكثر، وأن تكون المعلومات التي تقدّمها صحيحة وحديثة.

٢) الحساب
أنت مسؤول عن سرية بيانات دخولك وعن كل نشاط يتم عبر حسابك.

٣) الإعلانات
- تتعهّد بأن تكون معلومات إعلانك صحيحة وأنك مالك السلعة أو مخوّل ببيعها.
- يُمنع نشر أي محتوى مخالف للقانون، أو مضلّل، أو ينتهك حقوق الغير.
- تخضع جميع الإعلانات لمراجعة الإدارة، ولها الحق في قبول أو رفض أو حذف أي إعلان دون إبداء الأسباب.

٤) الموافقة على إعادة النشر (مهم)
بنشرك أي إعلان على سكوب، فإنك تمنح سكوب حقًّا غير حصري ومجانيًا في إعادة نشر إعلانك ومحتواه (الصور والوصف والتفاصيل) على قنوات سكوب الرسمية وحساباتها على وسائل التواصل الاجتماعي (مثل إنستغرام وفيسبوك وغيرها) والمنصات التابعة لها، وذلك لأغراض العرض والترويج والتسويق، دون مقابل مادي ودون الحاجة لموافقة إضافية منك.

٥) ملكية المحتوى
تبقى ملكية المحتوى الذي تنشره لك، مع منح سكوب الترخيص الموضّح في البند (٤).

٦) دور المنصة وإخلاء المسؤولية
سكوب منصّة وسيطة تتيح التواصل بين البائع والمشتري فقط، وليست طرفًا في أي صفقة. لا تضمن سكوب جودة السلع أو صحة المعلومات أو إتمام الصفقات، ولا تتحمّل أي مسؤولية عن أي نزاع أو ضرر ينشأ بين المستخدمين.

٧) إيقاف الحسابات
يحق لسكوب تعليق أو إيقاف أي حساب يخالف هذه الشروط.

٨) الخصوصية
يتم جمع بياناتك واستخدامها وفق سياسة الخصوصية الخاصة بالمنصة.

٩) تعديل الشروط
يحق لسكوب تعديل هذه الشروط في أي وقت، ويُعدّ استمرارك في استخدام التطبيق موافقةً على التعديلات.

١٠) القانون المطبّق
تخضع هذه الشروط لأنظمة دولة الإمارات العربية المتحدة.

للتواصل: [بريد الدعم]`;

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

const CatIcon = ({ type, color = '#534AB7', size = 32 }) => {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'cars') return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 17h14M5 17a2 2 0 0 1-2-2v-3l2-5h12l2 5v3a2 2 0 0 1-2 2M5 17v2M19 17v2M3 12h18" {...p} />
      <Circle cx="7.5" cy="14.5" r="1" {...p} />
      <Circle cx="16.5" cy="14.5" r="1" {...p} />
    </Svg>
  );
  if (type === 'motorcycles') return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="5" cy="17" r="3" {...p} />
      <Circle cx="19" cy="17" r="3" {...p} />
      <Path d="M5 17l3-6h5l3 6M13 11l-2-4h-2M16 17l-2-6h3l2 3" {...p} />
    </Svg>
  );
  if (type === 'bicycles') return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="5.5" cy="17.5" r="3.5" {...p} />
      <Circle cx="18.5" cy="17.5" r="3.5" {...p} />
      <Path d="M5.5 17.5l4-7h4M9.5 10.5h4l2.5 7M13.5 10.5l-1.5-3h-2" {...p} />
    </Svg>
  );
  if (type === 'rc_planes') return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 5c-1.5-1.5-4 0-4 0l-5 5-6-2-2 2 5 3 3 5 2-2-2-6 5-5s1.5-2.5 0-4z" {...p} />
    </Svg>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 14l2-1 3-4h8l3 4 2 1v2H3v-2z" {...p} />
      <Circle cx="7" cy="16" r="1.5" {...p} />
      <Circle cx="17" cy="16" r="1.5" {...p} />
      <Path d="M2 11l3 1M22 11l-3 1" {...p} />
    </Svg>
  );
};

const Toggle = ({ value, onToggle }) => (
  <TouchableOpacity onPress={onToggle} style={{ width: 50, height: 28, borderRadius: 14, backgroundColor: value ? '#534AB7' : '#D1D1D6', justifyContent: 'center', padding: 2 }}>
    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: value ? 22 : 0 }] }} />
  </TouchableOpacity>
);

const PulsingIcon = ({ name, size = 56, color }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);
  return (<Animated.View style={{ transform: [{ scale: pulse }] }}><Ionicons name={name} size={size} color={color} /></Animated.View>);
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, signOut } = useAuth();
  const [lang, setLang] = useState('ar');
  const [isDark, setIsDark] = useState(false);
  const CT = isDark ? DARK : LIGHT;
  const cities = CITIES[lang];

  const [adminsList, setAdminsList] = useState([]);
  const myEmail = user?.email?.toLowerCase() || '';
  const isOwner = ADMIN_EMAILS.includes(myEmail);
  const myAdminEntry = adminsList.find(a => a.id === myEmail);
  const isAdmin = isLoggedIn && (isOwner || !!myAdminEntry);
  const can = (perm) => isOwner || (myAdminEntry && myAdminEntry[perm] === true);

  const [activeTab, setActiveTab] = useState('home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [myProfile, setMyProfile] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [epName, setEpName] = useState('');
  const [epPhone, setEpPhone] = useState('');
  const [epCity, setEpCity] = useState('دبي');
  const [epSellerType, setEpSellerType] = useState('individual');
  const [epCompanyName, setEpCompanyName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [panelFilter, setPanelFilter] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [editingPartId, setEditingPartId] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [returnMode, setReturnMode] = useState('return');
  const [adminTab, setAdminTab] = useState('pending');
  const [allAdminParts, setAllAdminParts] = useState([]);
  const adminFiltered = allAdminParts.filter(p => {
    if (adminTab === 'all') return true;
    if (adminTab === 'approved') return p.status === 'approved' || p.status === undefined;
    if (adminTab === 'pending') return p.status === 'pending' && !(p.returnHistory && p.returnHistory.length > 0);
    if (adminTab === 'returned') return p.status === 'pending' && p.returnHistory && p.returnHistory.length > 0;
    if (adminTab === 'rejected') return p.status === 'rejected';
    return true;
  });
  const [returnTargetId, setReturnTargetId] = useState(null);

  const [parts, setParts] = useState([]);
  const [pendingParts, setPendingParts] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const stats = {
    approved: allAdminParts.filter(p => p.status === 'approved' || p.status === undefined).length,
    pending: allAdminParts.filter(p => p.status === 'pending' && !(p.returnHistory && p.returnHistory.length > 0)).length,
    returned: allAdminParts.filter(p => p.status === 'pending' && p.returnHistory && p.returnHistory.length > 0).length,
    rejected: allAdminParts.filter(p => p.status === 'rejected').length,
    total: allAdminParts.length,
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showAdvSearch, setShowAdvSearch] = useState(false);
  const [searchResultsMode, setSearchResultsMode] = useState(false);
  const [advType, setAdvType] = useState('all');
  const [advPriceMin, setAdvPriceMin] = useState('');
  const [advPriceMax, setAdvPriceMax] = useState('');
  const [advYearMin, setAdvYearMin] = useState('');
  const [advYearMax, setAdvYearMax] = useState('');
  const [advCondition, setAdvCondition] = useState('');
  const [advCity, setAdvCity] = useState('');
  const [advSort, setAdvSort] = useState('newest');
  const resetAdvFilters = () => { setAdvType('all'); setAdvPriceMin(''); setAdvPriceMax(''); setAdvYearMin(''); setAdvYearMax(''); setAdvCondition(''); setAdvCity(''); setAdvSort('newest'); };

  const [selectedPart, setSelectedPart] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [showPost, setShowPost] = useState(false);
  const [postCategory, setPostCategory] = useState('cars');
  const [partType, setPartType] = useState('');
  const [customPartType, setCustomPartType] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [carYear, setCarYear] = useState('');
  const [condition, setCondition] = useState('used');
  const [price, setPrice] = useState('');
  const [postCity, setPostCity] = useState('دبي');
  const [phone, setPhone] = useState('');
  const [pickedLat, setPickedLat] = useState(null);
  const [pickedLng, setPickedLng] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickedArea, setPickedArea] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState([]);
  const [pickingImage, setPickingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const [listingType, setListingType] = useState('part');
  const [vehicleType, setVehicleType] = useState('car');
  const [vehKm, setVehKm] = useState('');
  const [vehTransmission, setVehTransmission] = useState('auto');
  const [vehFuel, setVehFuel] = useState('petrol');
  const [vehEngineCc, setVehEngineCc] = useState('');
  const [vehSpec, setVehSpec] = useState('gulf');
  const [vehBody, setVehBody] = useState('');
  const [vehCylinders, setVehCylinders] = useState('');
  const [vehColor, setVehColor] = useState('');
  const [vehFeatures, setVehFeatures] = useState([]);
  const [customFeature, setCustomFeature] = useState('');

  const [partTypeOpen, setPartTypeOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [partQuery, setPartQuery] = useState('');

  const vehicleBrandList = (vehicleType === 'motorcycle' || vehicleType === 'sportbike') ? MOTO_BRANDS
    : vehicleType === 'bicycle' ? BIKE_BRANDS
    : BRANDS_DATA;
  const activeBrands = listingType === 'vehicle' ? vehicleBrandList : BRANDS_DATA;
  const filteredBrands = brandQuery ? activeBrands.filter(b => b.label.toLowerCase().includes(brandQuery.toLowerCase())) : activeBrands;
  const models = selectedBrand ? (activeBrands.find(b => b.value === selectedBrand.value)?.models || []) : [];
  const filteredModels = modelQuery ? models.filter(m => m.toLowerCase().includes(modelQuery.toLowerCase())) : models;
  const filteredPartTypes = partQuery ? PART_TYPES.filter(p => p.includes(partQuery)) : PART_TYPES;

  useEffect(() => { loadParts(); }, []);
  useEffect(() => { if (isAdmin) loadPending(); }, [isAdmin]);
  useEffect(() => {
    if (!isLoggedIn) { setAdminsList([]); return; }
    const unsub = onSnapshot(collection(db, 'admins'), (snap) => {
      setAdminsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isLoggedIn]);
  useEffect(() => { if (isLoggedIn) loadMyProfile(); }, [isLoggedIn]);
  const [myChats, setMyChats] = useState([]);
  const chatUnread = (c) => {
    if (!c.lastMessage || c.lastSenderId === user?.uid) return false;
    const lastRead = myProfile?.chatReads?.[c.id];
    if (!lastRead) return true;
    return (c.updatedAt || '') > lastRead;
  };
  const totalUnread = myChats.filter(chatUnread).length;
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) { setMyChats([]); return; }
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      setMyChats(list);
    });
    return () => unsub();
  }, [isLoggedIn, user?.uid]);

  const loadParts = async () => {
    try {
      const snap = await getDocs(collection(db, 'parts'));
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list = list.filter(p => p.status === undefined || p.status === 'approved' || ((p.status === 'returned' || p.status === 'pending' || p.status === 'rejected') && p.userId === user?.uid));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setParts(list);
    } catch (e) { console.log('load parts error:', e); }
    setLoading(false);
    setRefreshing(false);
  };

  const loadPending = async () => {
    setLoadingPending(true);
    try {
      const snap = await getDocs(collection(db, 'parts'));
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setAllAdminParts(list);
      setPendingParts(list.filter(p => p.status === 'pending'));
    } catch (e) {
      console.log('load pending error:', e);
    }
    setLoadingPending(false);
  };

  const approvePart = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateDoc(doc(db, 'parts', id), { status: 'approved' });
      setPendingParts(prev => prev.filter(p => p.id !== id));
      loadParts();
    } catch (e) {
      Alert.alert('خطأ', 'لم تتم الموافقة، حاول مرة أخرى');
    }
  };

  const returnPart = async (id, note) => {
    try {
      const target = pendingParts.find(p => p.id === id);
      const prevHistory = (target && target.returnHistory) ? target.returnHistory : [];
      const entry = { note: note || '', by: user?.email || 'admin', at: new Date().toISOString() };
      await updateDoc(doc(db, 'parts', id), { status: 'returned', adminNote: note || '', returnHistory: [...prevHistory, entry] });
      setPendingParts(prev => prev.filter(p => p.id !== id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadParts();
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر إرجاع الإعلان');
    }
  };

  const rejectPart = async (id) => {
    setReturnTargetId(id);
    setReturnNote('');
    setReturnMode('reject');
    setShowReturnModal(true);
  };

  const resubmitPart = async (id, note) => {
    try {
      await updateDoc(doc(db, 'parts', id), { status: 'pending', sold: false, wasApproved: true, sellerNote: note || '' });
      loadParts();
    } catch (e) { Alert.alert('خطأ', 'تعذّر إعادة الإرسال'); }
  };
  const openResubmit = (id) => {
    setReturnTargetId(id);
    setReturnNote('');
    setReturnMode('resubmit');
    setShowReturnModal(true);
  };

  const rejectDeleteOwn = async (id) => {
    Alert.alert('حذف الإعلان؟', 'سيُحذف نهائياً.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { try { await deleteDoc(doc(db, 'parts', id)); loadParts(); } catch (e) {} } },
    ]);
  };

  const confirmReject = async (id, note) => {
    try {
      await updateDoc(doc(db, 'parts', id), { status: 'rejected', adminNote: note || '' });
      setPendingParts(prev => prev.filter(p => p.id !== id));
    } catch (e) { Alert.alert('خطأ', 'تعذّر الرفض'); }
  };

  const resetPostForm = () => {
    setPartType(''); setCustomPartType(''); setSelectedBrand(null); setSelectedModel(null);
    setCarYear(''); setCondition('used'); setPrice(''); setPostCity('دبي');
    setPhone(myProfile?.phone || ''); setNotes(''); setImages([]);
    setPickedLat(null); setPickedLng(null); setPickedArea('');
    setPostCity(myProfile?.city || 'دبي');
    setPostCategory(selectedCategory && selectedCategory.startsWith('veh_') ? 'cars' : (selectedCategory || 'cars'));
    setPartTypeOpen(false); setBrandOpen(false); setModelOpen(false);
    setBrandQuery(''); setPartQuery('');
    setVehicleType(selectedCategory && selectedCategory.startsWith('veh_') ? selectedCategory.slice(4) : 'car'); setVehKm(''); setVehTransmission('auto'); setVehFuel('petrol'); setVehEngineCc('');
    setVehSpec('gulf'); setVehBody(''); setVehCylinders(''); setVehColor(''); setVehFeatures([]); setCustomFeature('');
    setListingType((selectedCategory === 'vehicles' || (selectedCategory && selectedCategory.startsWith('veh_'))) ? 'vehicle' : 'part');
  };

  const openMapPicker = () => {
    if (pickedLat === null) {
      const c = CITY_COORDS[postCity] || { lat: 24.4539, lng: 54.3773 };
      setPickedLat(c.lat); setPickedLng(c.lng);
    }
    setShowMapPicker(true);
  };
  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) { Alert.alert('', `الحد الأقصى ${MAX_IMAGES} صور`); return; }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('', 'نحتاج إذن الوصول للصور'); return; }
    setPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, allowsMultipleSelection: true, selectionLimit: MAX_IMAGES - images.length,
      });
      if (!result.canceled && result.assets) {
        const uploaded = [];
        for (const asset of result.assets) {
          const manip = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1000 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG });
          const url = await uploadToCloudinary(manip.uri);
          uploaded.push(url);
        }
        setImages(prev => [...prev, ...uploaded].slice(0, MAX_IMAGES));
      }
    } catch (e) { Alert.alert('', 'تعذّر رفع الصورة، تأكد من اتصال الإنترنت'); }
    setPickingImage(false);
  };

  const removeImage = (idx) => { setImages(prev => prev.filter((_, i) => i !== idx)); };
  const setCoverImage = (idx) => { setImages(prev => { if (idx <= 0) return prev; const copy = [...prev]; const [pick] = copy.splice(idx, 1); return [pick, ...copy]; }); };

  const submitPart = async () => {
    const isVehicle = listingType === 'vehicle';
    const finalPartType = partType === 'غير ذلك' ? customPartType.trim() : partType;

    if (isVehicle) {
      if (!selectedBrand || !price.trim() || !phone.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('', 'الرجاء تعبئة: الشركة، السعر، ورقم الجوال'); return;
      }
      if (!carYear.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('', 'الرجاء تعبئة سنة الصنع'); return;
      }
      if (vehicleType !== 'bicycle' && !vehKm.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('', 'الرجاء تعبئة الممشى (الكيلومترات)'); return;
      }
    } else {
      if (!finalPartType || !selectedBrand || !price.trim() || !phone.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('', 'الرجاء تعبئة: نوع القطعة، الشركة، السعر، ورقم الجوال'); return;
      }
    }
    if (pickedLat === null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('', 'حدد الموقع على الخريطة'); return;
    }
    if (images.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('', 'أضف صورة واحدة على الأقل'); return;
    }

    const brandAr = selectedBrand.label.split('/')[0].trim();
    const vehicleTitle = `${brandAr} ${selectedModel || ''} ${carYear || ''}`.trim();

    const payload = isVehicle ? {
      listingType: 'vehicle', vehicleType,
      partName: vehicleTitle, brand: selectedBrand.value, brandLabel: selectedBrand.label,
      model: selectedModel || null, carYear: carYear.trim() || null,
      carBrand: vehicleTitle,
      km: vehKm.trim() || null,
      transmission: vehicleType === 'car' ? vehTransmission : null,
      fuel: vehicleType === 'car' ? vehFuel : null,
      engineCc: (vehicleType === 'motorcycle' || vehicleType === 'sportbike') ? (vehEngineCc.trim() || null) : null,
      spec: vehicleType === 'car' ? vehSpec : null,
      bodyType: vehicleType === 'car' ? (vehBody || null) : null,
      cylinders: vehicleType === 'car' ? (vehCylinders || null) : null,
      exteriorColor: vehColor || null,
      features: vehicleType === 'car' ? vehFeatures : [],
      condition, price: parseInt(price) || 0, city: postCity, phone: phone.trim(),
      notes: notes.trim(), images, category: 'vehicles',
      lat: pickedLat, lng: pickedLng, area: pickedArea.trim() || null,
    } : {
      listingType: 'part',
      partName: finalPartType, brand: selectedBrand.value, brandLabel: selectedBrand.label,
      model: selectedModel || null, carYear: carYear.trim() || null,
      carBrand: vehicleTitle,
      condition, price: parseInt(price) || 0, city: postCity, phone: phone.trim(),
      notes: notes.trim(), images, category: postCategory || 'cars',
      lat: pickedLat, lng: pickedLng, area: pickedArea.trim() || null,
    };

    setSaving(true);
    try {
      if (editingPartId) {
        await updateDoc(doc(db, 'parts', editingPartId), {
          ...payload, status: 'pending', adminNote: '', wasApproved: true,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSaving(false);
        Alert.alert('تم ✅', 'تم إعادة إرسال إعلانك للمراجعة.', [{ text: 'تمام', onPress: () => { setShowPost(false); setEditingPartId(null); resetPostForm(); loadParts(); } }]);
        return;
      }
      await addDoc(collection(db, 'parts'), {
        ...payload, status: 'pending',
        userId: user?.uid || null,
        userName: user?.displayName || user?.email?.split('@')[0] || 'مستخدم',
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم ✅', isVehicle ? 'تم إرسال إعلان المركبة! سيظهر بعد موافقة الإدارة.' : 'تم إرسال قطعتك! ستظهر بعد موافقة الإدارة.', [{ text: 'تمام', onPress: () => { setShowPost(false); resetPostForm(); } }]);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', 'لم يتم الإرسال، حاول مرة أخرى');
    }
    setSaving(false);
  };

  const callSeller = (p) => { if (p) Linking.openURL('tel:' + p); };

  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const chatListRef = useRef(null);
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const s = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const h = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { s.remove(); h.remove(); };
  }, []);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const openChat = async (part) => {
    if (!isLoggedIn) { Alert.alert('', 'سجّل الدخول للمراسلة'); return; }
    if (part.userId === user?.uid) { Alert.alert('', 'هذا إعلانك'); return; }
    const cid = `${part.id}_${user.uid}_${part.userId}`;
    const chatRef = doc(db, 'chats', cid);
    try {
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, {
          partId: part.id, partName: part.partName,
          buyerId: user.uid, buyerName: myProfile?.name || user?.displayName || 'مشتري',
          sellerId: part.userId, sellerName: part.userName || 'بائع',
          participants: [user.uid, part.userId],
          lastMessage: '', updatedAt: new Date().toISOString(),
        });
      }
      setActiveChat({ id: cid, partName: part.partName, otherName: part.userName || 'بائع' });
      setShowDetails(false);
      setShowChat(true);
    } catch (e) { Alert.alert('خطأ', 'تعذّر فتح المحادثة'); }
  };

  const fmtTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      const time = d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
      if (sameDay) return time;
      return `${d.toLocaleDateString('ar')} · ${time}`;
    } catch (e) { return ''; }
  };

  const markChatRead = async (chatId) => {
    if (!user?.uid || !chatId) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { chatReads: { [chatId]: new Date().toISOString() } }, { merge: true });
      setMyProfile(prev => prev ? { ...prev, chatReads: { ...(prev.chatReads || {}), [chatId]: new Date().toISOString() } } : prev);
    } catch (e) {}
  };

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const addAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) { Alert.alert('', 'أدخل إيميل صحيح'); return; }
    if (email === myEmail || ADMIN_EMAILS.includes(email)) { Alert.alert('', 'هذا الإيميل مالك أصلاً'); return; }
    try {
      await setDoc(doc(db, 'admins', email), { canApprove: true, canDelete: false, canManageUsers: false, addedAt: new Date().toISOString() });
      setNewAdminEmail('');
    } catch (e) { Alert.alert('خطأ', 'تعذّر إضافة المدير'); }
  };
  const removeAdmin = async (email) => {
    Alert.alert('حذف مدير', `حذف ${email}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { try { await deleteDoc(doc(db, 'admins', email)); } catch (e) {} } },
    ]);
  };
  const toggleAdminPerm = async (email, perm, val) => {
    try { await updateDoc(doc(db, 'admins', email), { [perm]: val }); } catch (e) {}
  };

  const sendChatImage = async (fromCamera) => {
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('', 'نحتاج الإذن'); return; }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      if (!activeChat) return;
      const manip = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 1000 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG });
      const img = await uploadToCloudinary(manip.uri);
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        image: img, senderId: user.uid, createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'chats', activeChat.id), { lastMessage: '📷 صورة', lastSenderId: user.uid, updatedAt: new Date().toISOString() });
    } catch (e) { Alert.alert('خطأ', 'تعذّر إرسال الصورة'); }
  };

  const pickChatImageMenu = () => {
    Alert.alert('إرفاق صورة', '', [
      { text: 'الكاميرا', onPress: () => sendChatImage(true) },
      { text: 'الاستوديو', onPress: () => sendChatImage(false) },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !activeChat) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        text, senderId: user.uid, createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'chats', activeChat.id), { lastMessage: text, lastSenderId: user.uid, updatedAt: new Date().toISOString() });
    } catch (e) { Alert.alert('خطأ', 'لم تُرسل الرسالة'); }
  };

  useEffect(() => {
    if (!activeChat?.id) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setChatMessages(msgs);
      markChatRead(activeChat.id);
    });
    return () => unsub();
  }, [activeChat?.id]);

  const loadMyProfile = async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) { const d = snap.data(); setMyProfile({ id: snap.id, ...d }); setFavorites(d.favorites || []); }
      else { setMyProfile(null); setFavorites([]); }
    } catch (e) { console.log('load profile error:', e); }
  };

  const openEditProfile = () => {
    setEpName(myProfile?.name || user?.displayName || user?.email?.split('@')[0] || '');
    setEpPhone(myProfile?.phone || '');
    setEpCity(myProfile?.city || 'دبي');
    setEpSellerType(myProfile?.sellerType || 'individual');
    setEpCompanyName(myProfile?.companyName || '');
    setShowEditProfile(true);
  };

  const saveMyProfile = async () => {
    if (!user?.uid) { Alert.alert('', 'سجّل الدخول أولاً'); return; }
    if (!epName.trim()) { Alert.alert('', 'الرجاء كتابة الاسم'); return; }
    setSavingProfile(true);
    try {
      const data = {
        name: epName.trim(), phone: epPhone.trim(), city: epCity,
        sellerType: epSellerType, companyName: epSellerType === 'company' ? epCompanyName.trim() : '',
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMyProfile({ id: user.uid, ...data });
      setShowEditProfile(false);
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر حفظ الملف');
    }
    setSavingProfile(false);
  };

  const myParts = parts.filter(p => p.userId && p.userId === user?.uid);

  const toggleFavorite = async (partId) => {
    if (!user?.uid) { Alert.alert('', 'سجّل الدخول لحفظ المفضلة'); return; }
    const next = favorites.includes(partId) ? favorites.filter(id => id !== partId) : [...favorites, partId];
    setFavorites(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await setDoc(doc(db, 'users', user.uid), { favorites: next }, { merge: true });
    } catch (e) { console.log('fav error:', e); }
  };

  const favoriteParts = parts.filter(p => favorites.includes(p.id) && !p.sold);

  const editMyPart = (part) => {
    setEditingPartId(part.id);
    const lt = part.listingType || 'part';
    setListingType(lt);
    setVehicleType(part.vehicleType || 'car');
    setVehKm(part.km || '');
    setVehTransmission(part.transmission || 'auto');
    setVehFuel(part.fuel || 'petrol');
    setVehEngineCc(part.engineCc || '');
    setVehSpec(part.spec || 'gulf');
    setVehBody(part.bodyType || '');
    setVehCylinders(part.cylinders || '');
    setVehColor(part.exteriorColor || '');
    setVehFeatures(Array.isArray(part.features) ? part.features : []);
    setPostCategory(part.category || 'cars');
    setPartType(lt === 'vehicle' ? '' : (part.partName || ''));
    setSelectedBrand([...BRANDS_DATA, ...MOTO_BRANDS, ...BIKE_BRANDS].find(b => b.value === part.brand) || null);
    setSelectedModel(part.model || null);
    setCarYear(part.carYear || '');
    setCondition(part.condition || 'used');
    setPrice(String(part.price || ''));
    setPostCity(part.city || 'دبي');
    setPhone(part.phone || '');
    setNotes(part.notes || '');
    setImages(part.images || []);
    setPickedLat(part.lat ?? null); setPickedLng(part.lng ?? null); setPickedArea(part.area || '');
    setShowPost(true);
  };

  const [sellerParts, setSellerParts] = useState([]);
  const [showSeller, setShowSeller] = useState(false);
  const [sellerName, setSellerName] = useState('');

  const openSellerPage = (part) => {
    if (!part.userId) { Alert.alert('', 'لا تتوفر صفحة لهذا المعلن'); return; }
    const theirParts = parts.filter(p => p.userId === part.userId);
    setSellerParts(theirParts);
    setSellerName(part.userName || 'المعلن');
    setShowDetails(false);
    setShowSeller(true);
  };

  const toggleSold = async (part) => {
    try {
      await updateDoc(doc(db, 'parts', part.id), { sold: !part.sold });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadParts();
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر تحديث الحالة');
    }
  };

  const visibleParts = parts.filter(p => {
    if (selectedCategory) {
      if (selectedCategory.startsWith('veh_')) {
        if (p.category !== 'vehicles' || (p.vehicleType || 'car') !== selectedCategory.slice(4)) return false;
      } else if ((p.category || 'cars') !== selectedCategory) return false;
    }
    if (p.sold) return false;
    if (p.status === 'returned' || p.status === 'pending') return false;
    if (filterCity && p.city !== filterCity) return false;
    if (search.trim()) {
      const txt = `${p.partName || ''} ${p.carBrand || ''} ${p.brandLabel || ''} ${p.model || ''}`.toLowerCase();
      if (!txt.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const advFilteredParts = (() => {
    let list = parts.filter(p => {
      if (p.status !== undefined && p.status !== 'approved') return false;
      if (p.sold) return false;
      if (advType === 'vehicle' && p.category !== 'vehicles') return false;
      if (advType === 'part' && p.category === 'vehicles') return false;
      if (advCondition && p.condition !== advCondition) return false;
      if (advCity && p.city !== advCity) return false;
      const price = p.price || 0;
      if (advPriceMin && price < parseInt(advPriceMin)) return false;
      if (advPriceMax && price > parseInt(advPriceMax)) return false;
      const yr = parseInt(p.carYear) || 0;
      if (advYearMin && yr < parseInt(advYearMin)) return false;
      if (advYearMax && yr > parseInt(advYearMax)) return false;
      if (search.trim()) {
        const txt = `${p.partName || ''} ${p.carBrand || ''} ${p.brandLabel || ''} ${p.model || ''}`.toLowerCase();
        if (!txt.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    if (advSort === 'price_asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (advSort === 'price_desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  })();

  useEffect(() => { setVisibleCount(20); }, [selectedCategory, filterCity, search, searchResultsMode, advType, advPriceMin, advPriceMax, advYearMin, advYearMax, advCondition, advCity, advSort]);

  const NAV_HEIGHT = 56 + insets.bottom;
  const CARD_W = (SCREEN_WIDTH - 16 * 2 - 10) / 2;

  const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: CT.bg },
    header: { backgroundColor: CT.hdrBg, paddingTop: insets.top + 8, paddingBottom: 10, paddingHorizontal: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    searchInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 13, textAlign: 'right' },
    advBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 },
    advBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    advField: { flex: 1, backgroundColor: CT.bg, color: CT.textPrimary, padding: 11, borderRadius: 10, fontSize: 13, borderWidth: 1, borderColor: CT.cardBorder, textAlign: 'center' },
    cityBar: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: CT.card, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder },
    soldOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: CARD_W * 0.7, backgroundColor: 'rgba(20,15,40,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 5, borderRadius: 10 },
    soldStamp: { borderWidth: 3, borderColor: '#E11D2A', backgroundColor: 'rgba(225,29,42,0.15)', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 8, transform: [{ rotate: '-8deg' }] },
    soldStampText: { color: '#E11D2A', fontSize: 14, fontWeight: '900', textAlign: 'center' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    catSectionTitle: { fontSize: 18, fontWeight: '800', color: CT.textPrimary, marginBottom: 12, textAlign: 'right' },
    catCard: { width: '47.5%', backgroundColor: CT.card, borderRadius: 16, borderWidth: 0.5, borderColor: CT.cardBorder, paddingVertical: 22, paddingHorizontal: 10, alignItems: 'center', position: 'relative' },
    catIconBox: { width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    catLabel: { fontSize: 13, fontWeight: '600', color: CT.textPrimary, marginTop: 10, textAlign: 'center' },
    catNewBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: CT.activeRed, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    catNewText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    catHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: CT.card, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder },
    catBackBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: CT.tagBg, justifyContent: 'center', alignItems: 'center' },
    catHeaderTitle: { fontSize: 16, fontWeight: '700', color: CT.textPrimary },
    cityChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: CT.bg, borderWidth: 1, borderColor: CT.cardBorder, marginRight: 8 },
    cityChipOn: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    cityChipText: { fontSize: 12, color: CT.textSecondary, fontWeight: '500' },
    cityChipTextOn: { color: '#fff', fontWeight: '700' },
    card: { width: CARD_W, backgroundColor: CT.card, borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: CT.cardBorder, marginBottom: 10, padding: 12 },
    cardImg: { width: '100%', height: CARD_W * 0.7, borderRadius: 10, marginBottom: 8 },
    favHeart: { position: 'absolute', top: 8, left: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 6 },
    cardImgPlaceholder: { width: '100%', height: CARD_W * 0.7, borderRadius: 10, marginBottom: 8, backgroundColor: CT.tagBg, justifyContent: 'center', alignItems: 'center' },
    cardName: { color: CT.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
    cardBrand: { color: CT.textSecondary, fontSize: 11, textAlign: 'right', marginBottom: 8 },
    cardPrice: { color: CT.navy, fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
    cardSeller: { color: CT.textMuted, fontSize: 10, textAlign: 'right', marginTop: 6, fontStyle: 'italic' },
    cardTags: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 8 },
    miniTag: { backgroundColor: CT.tagBg, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
    miniTagText: { fontSize: 9, color: CT.textSecondary, fontWeight: '500' },
    fab: { position: 'absolute', bottom: NAV_HEIGHT + 16, left: 16, backgroundColor: CT.navyDark, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    fabText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: CT.textPrimary, marginTop: 16, marginBottom: 8, textAlign: 'center' },
    emptySub: { fontSize: 13, color: CT.textMuted, textAlign: 'center', lineHeight: 20 },
    bottomNav: { backgroundColor: CT.navBg, flexDirection: 'row', paddingTop: 10, borderTopWidth: 0.5, borderTopColor: CT.navBorder },
    navItem: { flex: 1, alignItems: 'center' },
    navLabel: { fontSize: 10, color: CT.textMuted, marginTop: 2 },
    navLabelOn: { color: CT.blue, fontWeight: '700' },
    navPostBtn: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
    navPostCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: CT.navyDark, justifyContent: 'center', alignItems: 'center', marginTop: -18, borderWidth: 4, borderColor: CT.navBg, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
    navPostLabel: { fontSize: 10, color: CT.blue, fontWeight: '700', marginTop: 3 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: CT.modalBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '94%' },
    modalHandle: { width: 44, height: 5, backgroundColor: CT.cardBorder, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
    modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { color: CT.textPrimary, fontSize: 17, fontWeight: 'bold' },
    resetText: { color: CT.blue, fontSize: 14 },
    label: { color: CT.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: 8, marginTop: 6 },
    input: { backgroundColor: CT.bg, color: CT.textPrimary, padding: 13, borderRadius: 12, fontSize: 14, borderWidth: 1, borderColor: CT.cardBorder, textAlign: 'right', marginBottom: 4 },
    dropTrigger: { backgroundColor: CT.bg, borderRadius: 12, padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: CT.cardBorder },
    dropTriggerOpen: { borderColor: CT.navyDark, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    dropTriggerDisabled: { opacity: 0.45 },
    dropText: { fontSize: 13, color: CT.textPrimary, flex: 1, textAlign: 'right' },
    dropPlaceholder: { color: CT.textMuted },
    dropList: { backgroundColor: CT.bg, borderWidth: 1, borderColor: CT.navyDark, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden', maxHeight: 240 },
    dropSearch: { backgroundColor: CT.card, padding: 10, fontSize: 12, color: CT.textPrimary, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder, textAlign: 'right' },
    dropItem: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder },
    dropItemActive: { backgroundColor: CT.tagBg },
    dropItemText: { fontSize: 13, color: CT.textPrimary, flex: 1, textAlign: 'right' },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: CT.bg, borderWidth: 1, borderColor: CT.cardBorder },
    pillOn: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    pillText: { fontSize: 12, color: CT.textSecondary, fontWeight: '500' },
    pillTextOn: { color: '#fff', fontWeight: 'bold' },
    submitBtn: { backgroundColor: CT.navyDark, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 30 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    imgThumb: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
    imgThumbImg: { width: '100%', height: '100%' },
    imgRemove: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    imgAdd: { width: 72, height: 72, borderRadius: 10, borderWidth: 1.5, borderColor: CT.cardBorder, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: CT.bg },
    imgAddText: { fontSize: 10, color: CT.navy, marginTop: 2 },
    detailName: { color: CT.textPrimary, fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginBottom: 6 },
    detailImg: { width: SCREEN_WIDTH - 40, height: 240, borderRadius: 14, marginRight: 8 },
    detailPrice: { color: CT.navy, fontSize: 26, fontWeight: 'bold', textAlign: 'right', marginBottom: 16 },
    detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', marginBottom: 16 },
    detailTag: { backgroundColor: CT.tagBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    detailTagText: { fontSize: 12, color: CT.tagText, fontWeight: '500' },
    detailNotes: { fontSize: 13, color: CT.textSecondary, textAlign: 'right', lineHeight: 20, marginBottom: 20 },
    sellerBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CT.tagBg, borderRadius: 12, padding: 14, marginBottom: 14 },
    sellerName: { fontSize: 14, fontWeight: '700', color: CT.textPrimary, textAlign: 'right' },
    sellerHint: { fontSize: 11, color: CT.textMuted, textAlign: 'right', marginTop: 2 },
    callBtn: { backgroundColor: CT.navyDark, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 30 },
    callText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    settingsSecLabel: { fontSize: 11, color: CT.textMuted, fontWeight: '600', paddingHorizontal: 16, marginBottom: 6, marginTop: 10 },
    settingsCard: { backgroundColor: CT.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 8, borderWidth: 0.5, borderColor: CT.cardBorder, overflow: 'hidden' },
    settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    settingsRowBorder: { borderTopWidth: 0.5, borderTopColor: CT.cardBorder },
    settingsRowText: { fontSize: 14, color: CT.textPrimary, flex: 1 },
    settingsRowSub: { fontSize: 11, color: CT.textMuted, marginTop: 2 },
    versionText: { textAlign: 'center', color: CT.textMuted, fontSize: 12, marginTop: 10 },
    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16, marginBottom: 6 },
    statCard: { flex: 1, backgroundColor: CT.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: CT.cardBorder, alignItems: 'center' },
    statNum: { fontSize: 24, fontWeight: '900', color: CT.navy, marginBottom: 4 },
    statLabel: { fontSize: 11, color: CT.textMuted, textAlign: 'center' },
    adminHdr: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
    adminTitle: { fontSize: 18, fontWeight: '700', color: CT.textPrimary, textAlign: 'right' },
    adminSub: { fontSize: 12, color: CT.textMuted, textAlign: 'right', marginTop: 4 },
    adminCard: { backgroundColor: CT.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 12, padding: 14, borderWidth: 0.5, borderColor: CT.cardBorder },
    adminCardImg: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10 },
    adminCardName: { fontSize: 16, fontWeight: '700', color: CT.textPrimary, textAlign: 'right', marginBottom: 4 },
    adminCardInfo: { fontSize: 12, color: CT.textSecondary, textAlign: 'right', marginBottom: 2 },
    adminCardPrice: { fontSize: 16, fontWeight: 'bold', color: CT.navy, textAlign: 'right', marginBottom: 10 },
    adminBtns: { flexDirection: 'row', gap: 8 },
    approveBtn: { flex: 1, backgroundColor: CT.activeGreen, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    approveText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    rejectBtn: { flex: 1, backgroundColor: CT.activeRedBg, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: CT.activeRed },
    rejectText: { color: CT.activeRed, fontWeight: 'bold', fontSize: 14 },
    chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: CT.hdrBg, paddingTop: insets.top + 10 },
    chatHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'right', flex: 1 },
    chatHeaderSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
    msgBubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginVertical: 3 },
    msgMine: { backgroundColor: CT.navyDark, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    msgTheirs: { backgroundColor: CT.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: CT.cardBorder },
    msgTextMine: { color: '#fff', fontSize: 14, textAlign: 'right' },
    msgTextTheirs: { color: CT.textPrimary, fontSize: 14, textAlign: 'right' },
    chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderTopWidth: 0.5, borderTopColor: CT.cardBorder, backgroundColor: CT.card },
    chatInputField: { flex: 1, backgroundColor: CT.bg, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: CT.textPrimary, fontSize: 14, textAlign: 'right', borderWidth: 1, borderColor: CT.cardBorder },
    chatSend: { width: 44, height: 44, borderRadius: 22, backgroundColor: CT.navyDark, justifyContent: 'center', alignItems: 'center' },
    chatAttach: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    chatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CT.card, borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8, borderWidth: 0.5, borderColor: CT.cardBorder },
    chatRowName: { fontSize: 15, fontWeight: '700', color: CT.textPrimary, textAlign: 'right' },
    chatRowMsg: { fontSize: 12, color: CT.textSecondary, textAlign: 'right', marginTop: 2 },
    chatRowAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: CT.bg, justifyContent: 'center', alignItems: 'center' },
    navBadge: { position: 'absolute', top: -6, right: -10, backgroundColor: '#E11D2A', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    navBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    chatRowDot: { position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#E11D2A', borderWidth: 2, borderColor: CT.card },
    statCardOn: { borderWidth: 2, borderColor: CT.blue },
    adminMgr: { backgroundColor: CT.card, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 16, borderWidth: 0.5, borderColor: CT.cardBorder },
    adminAddRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
    adminEmailInput: { flex: 1, backgroundColor: CT.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: CT.textPrimary, fontSize: 13, textAlign: 'right', borderWidth: 1, borderColor: CT.cardBorder },
    adminAddBtn: { backgroundColor: CT.navyDark, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, justifyContent: 'center' },
    adminAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    adminItem: { backgroundColor: CT.bg, borderRadius: 10, padding: 10, marginTop: 8 },
    adminItemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    adminItemEmail: { flex: 1, fontSize: 13, fontWeight: '600', color: CT.textPrimary, textAlign: 'right' },
    permRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    permChk: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    permLabel: { fontSize: 12, color: CT.textSecondary },
    histBox: { backgroundColor: CT.activeYellowBg, borderRadius: 10, padding: 10, marginVertical: 8, borderWidth: 1, borderColor: CT.activeYellow },
    histTitle: { fontSize: 12, fontWeight: '800', color: CT.activeYellow, textAlign: 'right' },
    histLine: { fontSize: 12, color: CT.textSecondary, textAlign: 'right' },
    histMeta: { fontSize: 10, color: CT.textMuted, textAlign: 'right', marginTop: 2 },
    profileCard: { backgroundColor: CT.card, borderRadius: 16, margin: 16, padding: 16, borderWidth: 0.5, borderColor: CT.cardBorder },
    profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: CT.navyDark, justifyContent: 'center', alignItems: 'center' },
    profileName: { fontSize: 17, fontWeight: '800', color: CT.textPrimary, textAlign: 'right' },
    profileEdit: { fontSize: 12, color: CT.blue, textAlign: 'right', marginTop: 2 },
    profileTypeBadge: { alignSelf: 'flex-end', backgroundColor: CT.tagBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
    profileTypeText: { fontSize: 11, color: CT.tagText, fontWeight: '600' },
    profileStat: { flex: 1, alignItems: 'center' },
    profileStatNum: { fontSize: 20, fontWeight: '900', color: CT.navy },
    profileStatLabel: { fontSize: 11, color: CT.textMuted, marginTop: 2 },
    segBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    segBtnOn: { backgroundColor: CT.navyDark },
    segText: { fontSize: 13, color: CT.textSecondary, fontWeight: '600' },
    segTextOn: { color: '#fff' },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
    filterBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, backgroundColor: CT.card, borderWidth: 1, borderColor: CT.cardBorder, alignItems: 'center' },
    filterBtnOn: { backgroundColor: CT.navyDark, borderColor: CT.navyDark },
    filterText: { fontSize: 12, color: CT.textSecondary, fontWeight: '600' },
    filterTextOn: { color: '#fff', fontWeight: '700' },
    returnedBanner: { backgroundColor: CT.activeYellowBg, borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: CT.activeYellow },
    returnedTitle: { fontSize: 12, fontWeight: '800', color: CT.activeYellow, textAlign: 'right', marginBottom: 4 },
    returnedNote: { fontSize: 12, color: CT.textSecondary, textAlign: 'right', lineHeight: 18 },
    editPartBtn: { backgroundColor: CT.navyDark, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
    editPartText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  });

  const renderCard = ({ item }) => (
    <TouchableOpacity style={S.card} activeOpacity={0.7} onPress={() => { setSelectedPart(item); setShowDetails(true); }}>
      <View style={{ position: 'relative' }}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={S.cardImg} resizeMode="cover" />
        ) : (
          <View style={S.cardImgPlaceholder}><Ionicons name="cube-outline" size={32} color={CT.navy} /></View>
        )}
        {item.sold && (
          <View style={S.soldOverlay}>
            <View style={S.soldStamp}><Text style={S.soldStampText} numberOfLines={1}>{lang === 'ar' ? 'غير متوفر' : 'Sold'}</Text></View>
          </View>
        )}
        <TouchableOpacity style={S.favHeart} onPress={() => toggleFavorite(item.id)}>
          <Ionicons name={favorites.includes(item.id) ? 'heart' : 'heart-outline'} size={20} color={favorites.includes(item.id) ? '#E11D2A' : '#fff'} />
        </TouchableOpacity>
      </View>
      <Text style={S.cardName} numberOfLines={1}>{item.partName}</Text>
      <Text style={S.cardBrand} numberOfLines={1}>🚗 {item.carBrand || item.brandLabel || ''}</Text>
      <Text style={S.cardPrice}>{item.price > 0 ? `${item.price.toLocaleString()} د.إ` : '—'}</Text>
      {item.userName ? <Text style={S.cardSeller}>👤 {item.userName}</Text> : null}
      <View style={S.cardTags}>
        {item.city ? <View style={S.miniTag}><Text style={S.miniTagText}>📍 {item.city}{item.area ? ' : ' + item.area : ''}</Text></View> : null}
        {item.condition ? <View style={S.miniTag}><Text style={S.miniTagText}>{CONDITION_LABELS[item.condition] || item.condition}</Text></View> : null}
      </View>
    </TouchableOpacity>
  );

  const renderCatCard = (cat, idx, total) => {
    const fullWidth = idx === total - 1 && total % 2 === 1;
    return (
      <TouchableOpacity key={cat.id} style={[S.catCard, fullWidth && { width: '100%' }]} activeOpacity={0.7} onPress={() => { setSelectedCategory(cat.id); setFilterCity(''); setSearch(''); }}>
        {cat.isNew && (<View style={S.catNewBadge}><Text style={S.catNewText}>جديد</Text></View>)}
        <View style={[S.catIconBox, { backgroundColor: isDark ? cat.bgDark : cat.bg }]}>
          {cat.img ? (
            <Image source={cat.img} style={{ width: 34, height: 34, resizeMode: 'contain' }} />
          ) : (
            <MaterialCommunityIcons name={cat.icon} size={34} color={cat.color} />
          )}
        </View>
        <Text style={S.catLabel}>{cat.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderCategories = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: NAV_HEIGHT + 90 }} showsVerticalScrollIndicator={false}>
      <Text style={S.catSectionTitle}>المركبات</Text>
      <View style={S.catGrid}>
        {VEHICLE_CATS.map((cat, idx) => renderCatCard(cat, idx, VEHICLE_CATS.length))}
      </View>

      <Text style={[S.catSectionTitle, { marginTop: 22 }]}>قطع غيار</Text>
      <View style={S.catGrid}>
        {CATEGORIES.map((cat, idx) => renderCatCard(cat, idx, CATEGORIES.length))}
      </View>
    </ScrollView>
  );

  const renderCategoryParts = () => {
    const cat = [...VEHICLE_CATS, ...CATEGORIES].find(c => c.id === selectedCategory);
    return (
      <View style={{ flex: 1 }}>
        <View style={S.catHeader}>
          <TouchableOpacity style={S.catBackBtn} onPress={() => setSelectedCategory(null)}>
            <Ionicons name="arrow-forward" size={20} color={CT.textPrimary} />
          </TouchableOpacity>
          <Text style={S.catHeaderTitle}>{cat?.label}</Text>
        </View>
        <View style={S.cityBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cities.map(c => {
              const on = filterCity === c || (c === cities[0] && !filterCity);
              return (
                <TouchableOpacity key={c} style={[S.cityChip, on && S.cityChipOn]} onPress={() => setFilterCity(c === cities[0] ? '' : c)}>
                  <Text style={[S.cityChipText, on && S.cityChipTextOn]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={CT.navy} style={{ marginTop: 60 }} />
        ) : visibleParts.length === 0 ? (
          <View style={S.emptyState}>
            <PulsingIcon name="cube-outline" size={56} color={CT.navy} />
            <Text style={S.emptyTitle}>لا توجد إعلانات في هذا القسم بعد</Text>
            <Text style={S.emptySub}>كن أول من ينشر هنا! اضغط زر الإضافة.</Text>
          </View>
        ) : (
          <FlatList
            data={visibleParts.slice(0, visibleCount)} keyExtractor={item => item.id} numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 90, paddingTop: 12 }}
            renderItem={renderCard}
            onEndReached={() => setVisibleCount(c => (c < visibleParts.length ? c + 20 : c))}
            onEndReachedThreshold={0.5}
            ListFooterComponent={visibleCount < visibleParts.length ? <ActivityIndicator color={CT.navy} style={{ marginVertical: 16 }} /> : null}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadParts(); }} colors={[CT.navy]} tintColor={CT.navy} />}
          />
        )}
        
      </View>
    );
  };

  const renderSearchResults = () => (
    <View style={{ flex: 1 }}>
      <View style={S.catHeader}>
        <TouchableOpacity style={S.catBackBtn} onPress={() => { setSearchResultsMode(false); setSearch(''); resetAdvFilters(); }}>
          <Ionicons name="arrow-forward" size={20} color={CT.textPrimary} />
        </TouchableOpacity>
        <Text style={S.catHeaderTitle}>نتائج البحث ({advFilteredParts.length})</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={CT.navy} style={{ marginTop: 60 }} />
      ) : advFilteredParts.length === 0 ? (
        <View style={S.emptyState}>
          <PulsingIcon name="search-outline" size={56} color={CT.navy} />
          <Text style={S.emptyTitle}>لا نتائج مطابقة</Text>
          <Text style={S.emptySub}>جرّب تغيير كلمة البحث أو الفلاتر.</Text>
        </View>
      ) : (
        <FlatList
          data={advFilteredParts.slice(0, visibleCount)} keyExtractor={item => item.id} numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 90, paddingTop: 12 }}
          renderItem={renderCard}
          onEndReached={() => setVisibleCount(c => (c < advFilteredParts.length ? c + 20 : c))}
          onEndReachedThreshold={0.5}
          ListFooterComponent={visibleCount < advFilteredParts.length ? <ActivityIndicator color={CT.navy} style={{ marginVertical: 16 }} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadParts(); }} colors={[CT.navy]} tintColor={CT.navy} />}
        />
      )}
    </View>
  );

  const renderHome = () => (
    selectedCategory ? renderCategoryParts()
      : (searchResultsMode || search.trim()) ? renderSearchResults()
      : renderCategories()
  );

  const renderPanel = () => {
    if (!isLoggedIn) {
      return (
        <View style={S.emptyState}>
          <PulsingIcon name="person-circle-outline" size={56} color={CT.navy} />
          <Text style={S.emptyTitle}>سجّل الدخول</Text>
          <Text style={S.emptySub}>سجّل الدخول لإدارة ملفك وإعلاناتك.</Text>
          <TouchableOpacity style={[S.submitBtn, { paddingHorizontal: 40 }]} onPress={() => router.push('/login')}>
            <Text style={S.submitText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const soldCount = myParts.filter(p => p.sold).length;
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadParts(); loadMyProfile(); }} colors={[CT.navy]} tintColor={CT.navy} />}>
        <View style={S.profileCard}>
          <View style={S.profileTop}>
            <TouchableOpacity onPress={openEditProfile}><Ionicons name="create-outline" size={22} color={CT.blue} /></TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={S.profileName}>{myProfile?.name || user?.displayName || 'مستخدم'}</Text>
              <TouchableOpacity onPress={openEditProfile}><Text style={S.profileEdit}>تعديل الملف ✏️</Text></TouchableOpacity>
              <View style={S.profileTypeBadge}>
                <Text style={S.profileTypeText}>{myProfile?.sellerType === 'company' ? `🏢 ${myProfile?.companyName || 'شركة'}` : '👤 فرد'}</Text>
              </View>
            </View>
            <View style={S.profileAvatar}><Ionicons name="person" size={30} color="#fff" /></View>
          </View>
          
        </View>

        {myChats.length > 0 && (
          <>
            <Text style={S.settingsSecLabel}>رسائلي ({myChats.length})</Text>
            {myChats.map(c => {
              const otherName = c.buyerId === user?.uid ? c.sellerName : c.buyerName;
              const unread = chatUnread(c);
              return (
                <TouchableOpacity key={c.id} style={S.chatRow} onPress={() => { setActiveChat({ id: c.id, partName: c.partName, otherName }); setShowChat(true); }}>
                  <Ionicons name="chevron-back" size={18} color={CT.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={[S.chatRowName, unread && { fontWeight: '900' }]} numberOfLines={1}>{otherName || 'مستخدم'}</Text>
                    <Text style={[S.chatRowMsg, unread && { color: CT.textPrimary, fontWeight: '700' }]} numberOfLines={1}>{c.lastMessage || 'لا رسائل'}</Text>
                  </View>
                  <View style={S.chatRowAvatar}>
                    <Ionicons name="chatbubble-ellipses" size={18} color={CT.navy} />
                    {unread && <View style={S.chatRowDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <Text style={S.settingsSecLabel}>إعلاناتي</Text>
        <View style={S.filterRow}>
          <TouchableOpacity style={[S.filterBtn, panelFilter === 'all' && S.filterBtnOn]} onPress={() => setPanelFilter('all')}>
            <Text style={[S.filterText, panelFilter === 'all' && S.filterTextOn]}>الكل ({myParts.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.filterBtn, panelFilter === 'available' && S.filterBtnOn]} onPress={() => setPanelFilter('available')}>
            <Text style={[S.filterText, panelFilter === 'available' && S.filterTextOn]}>معروضة ({myParts.filter(p => !p.sold).length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.filterBtn, panelFilter === 'sold' && S.filterBtnOn]} onPress={() => setPanelFilter('sold')}>
            <Text style={[S.filterText, panelFilter === 'sold' && S.filterTextOn]}>مباعة ({myParts.filter(p => p.sold).length})</Text>
          </TouchableOpacity>
        </View>
        {myParts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Ionicons name="cube-outline" size={40} color={CT.textMuted} />
            <Text style={[S.emptySub, { marginTop: 10 }]}>لا توجد إعلانات بعد</Text>
          </View>
        ) : (
          myParts.filter(p => panelFilter === 'all' ? true : panelFilter === 'sold' ? p.sold : !p.sold).map(item => (
            <TouchableOpacity key={item.id} style={S.adminCard} onPress={() => { setSelectedPart(item); setShowDetails(true); }}>
              {item.images && item.images.length > 0 && (
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: item.images[0] }} style={S.adminCardImg} resizeMode="cover" />
                  {item.sold && (<View style={[S.soldOverlay, { height: 160 }]}><View style={S.soldStamp}><Text style={S.soldStampText} numberOfLines={1}>{lang === 'ar' ? 'غير متوفر' : 'Sold'}</Text></View></View>)}
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => editMyPart(item)} style={{ padding: 4 }}>
                  <Ionicons name="create-outline" size={22} color={CT.blue} />
                </TouchableOpacity>
                <Text style={[S.adminCardName, { flex: 1, textAlign: 'right' }]}>{item.partName}</Text>
              </View>
              <Text style={S.adminCardInfo}>🚗 {item.carBrand || item.brandLabel || ''}</Text>
              <Text style={S.adminCardPrice}>{item.price > 0 ? `${item.price.toLocaleString()} د.إ` : '—'}</Text>
              {item.status === 'returned' ? (
                <>
                  <View style={S.returnedBanner}>
                    <Text style={S.returnedTitle}>⚠️ مُرجع للتعديل</Text>
                    <Text style={S.returnedNote}>{item.adminNote || 'يرجى مراجعة الإعلان وإعادة إرساله.'}</Text>
                  </View>
                  <TouchableOpacity style={S.editPartBtn} onPress={() => editMyPart(item)}>
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={S.editPartText}>تعديل وإعادة الإرسال</Text>
                  </TouchableOpacity>
                </>
              ) : item.status === 'pending' ? (
                <View style={[S.returnedBanner, { backgroundColor: CT.tagBg, borderColor: CT.cardBorder }]}>
                  <Text style={[S.returnedTitle, { color: CT.textMuted }]}>⏳ بانتظار موافقة الإدارة</Text>
                </View>
              ) : item.status === 'rejected' ? (
                <>
                  <View style={[S.returnedBanner, { backgroundColor: '#FEE2E2', borderColor: CT.activeRed }]}>
                    <Text style={[S.returnedTitle, { color: CT.activeRed }]}>❌ مرفوض</Text>
                    <Text style={S.returnedNote}>{item.adminNote || 'لم يُقبل الإعلان.'}</Text>
                  </View>
                  <TouchableOpacity style={[S.editPartBtn, { backgroundColor: CT.activeRed }]} onPress={() => rejectDeleteOwn(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={S.editPartText}>حذف الإعلان</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[S.callBtn, { marginBottom: 0, backgroundColor: item.sold ? CT.navyDark : '#E11D2A' }]} onPress={() => { if (item.sold) openResubmit(item.id); else toggleSold(item); }}>
                  <Ionicons name={item.sold ? 'refresh' : 'checkmark-done'} size={18} color="#fff" />
                  <Text style={S.callText}>{item.sold ? 'إعادة إرسال' : 'تمّ البيع'}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  const renderAdmin = () => (
    <View style={{ flex: 1 }}>
      <View style={S.statsRow}>
        <TouchableOpacity style={[S.statCard, adminTab === 'approved' && S.statCardOn]} onPress={() => setAdminTab('approved')}>
          <Text style={S.statNum}>{stats.approved}</Text>
          <Text style={S.statLabel}>معتمدة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.statCard, adminTab === 'pending' && S.statCardOn]} onPress={() => setAdminTab('pending')}>
          <Text style={[S.statNum, { color: CT.activeYellow }]}>{stats.pending}</Text>
          <Text style={S.statLabel}>جديدة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.statCard, adminTab === 'returned' && S.statCardOn]} onPress={() => setAdminTab('returned')}>
          <Text style={[S.statNum, { color: CT.activeRed }]}>{stats.returned}</Text>
          <Text style={S.statLabel}>مرتجعة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.statCard, adminTab === 'rejected' && S.statCardOn]} onPress={() => setAdminTab('rejected')}>
          <Text style={[S.statNum, { color: CT.activeRed }]}>{stats.rejected}</Text>
          <Text style={S.statLabel}>مرفوضة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.statCard, adminTab === 'all' && S.statCardOn]} onPress={() => setAdminTab('all')}>
          <Text style={S.statNum}>{stats.total}</Text>
          <Text style={S.statLabel}>الإجمالي</Text>
        </TouchableOpacity>
      </View>
      {isOwner && (
        <View style={S.adminMgr}>
          <Text style={S.adminTitle}>المدراء 👥</Text>
          <View style={S.adminAddRow}>
            <TouchableOpacity style={S.adminAddBtn} onPress={addAdmin}><Text style={S.adminAddBtnText}>إضافة</Text></TouchableOpacity>
            <TextInput style={S.adminEmailInput} placeholder="إيميل المدير" placeholderTextColor={CT.textMuted} value={newAdminEmail} onChangeText={setNewAdminEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>
          {adminsList.length === 0 ? (
            <Text style={[S.emptySub, { textAlign: 'center', paddingVertical: 10 }]}>لا يوجد مدراء مضافون</Text>
          ) : adminsList.map(a => (
            <View key={a.id} style={S.adminItem}>
              <View style={S.adminItemTop}>
                <TouchableOpacity onPress={() => removeAdmin(a.id)}><Ionicons name="trash-outline" size={20} color={CT.activeRed} /></TouchableOpacity>
                <Text style={S.adminItemEmail} numberOfLines={1}>{a.id}</Text>
              </View>
              <View style={S.permRow}>
                <TouchableOpacity style={S.permChk} onPress={() => toggleAdminPerm(a.id, 'canApprove', !a.canApprove)}>
                  <Ionicons name={a.canApprove ? 'checkbox' : 'square-outline'} size={20} color={a.canApprove ? CT.blue : CT.textMuted} />
                  <Text style={S.permLabel}>موافقة</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.permChk} onPress={() => toggleAdminPerm(a.id, 'canDelete', !a.canDelete)}>
                  <Ionicons name={a.canDelete ? 'checkbox' : 'square-outline'} size={20} color={a.canDelete ? CT.blue : CT.textMuted} />
                  <Text style={S.permLabel}>حذف</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.permChk} onPress={() => toggleAdminPerm(a.id, 'canManageUsers', !a.canManageUsers)}>
                  <Ionicons name={a.canManageUsers ? 'checkbox' : 'square-outline'} size={20} color={a.canManageUsers ? CT.blue : CT.textMuted} />
                  <Text style={S.permLabel}>مستخدمين</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={S.adminHdr}>
        <Text style={S.adminTitle}>{adminTab === 'approved' ? 'المعتمدة ✅' : adminTab === 'pending' ? 'الجديدة 🆕' : adminTab === 'returned' ? 'المرتجعة ⚠️' : adminTab === 'rejected' ? 'المرفوضة ❌' : 'كل الإعلانات 📋'}</Text>
        <Text style={S.adminSub}>{adminFiltered.length} إعلان</Text>
      </View>
      {loadingPending ? (
        <ActivityIndicator size="large" color={CT.navy} style={{ marginTop: 40 }} />
      ) : adminFiltered.length === 0 ? (
        <View style={S.emptyState}>
          <PulsingIcon name="checkmark-done-circle-outline" size={56} color={CT.activeGreen} />
          <Text style={S.emptyTitle}>لا يوجد</Text>
          <Text style={S.emptySub}>لا توجد إعلانات في هذا القسم.</Text>
        </View>
      ) : (
        <FlatList
          data={adminFiltered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={loadingPending} onRefresh={loadPending} colors={[CT.navy]} tintColor={CT.navy} />}
          renderItem={({ item }) => (
            <View style={S.adminCard}>
              {item.images && item.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {item.images.map((img, i) => (
                    <Image key={i} source={{ uri: img }} style={[S.adminCardImg, { width: 240, marginLeft: 6 }]} resizeMode="cover" />
                  ))}
                </ScrollView>
              )}
              {item.images && item.images.length > 1 && (
                <Text style={[S.adminCardInfo, { textAlign: 'center', marginBottom: 4 }]}>📷 {item.images.length} صور</Text>
              )}
              <Text style={S.adminCardName}>{item.partName}</Text>
              {item.returnHistory && item.returnHistory.length > 0 && (
                <View style={S.histBox}>
                  <Text style={S.histTitle}>⚠️ سبق إرجاعه {item.returnHistory.length} مرة</Text>
                  {item.returnHistory.map((h, i) => (
                    <View key={i} style={{ marginTop: 4 }}>
                      <Text style={S.histLine}>📝 {h.note || '—'}</Text>
                      <Text style={S.histMeta}>👤 {h.by} · 🕐 {new Date(h.at).toLocaleString('ar')}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={S.adminCardInfo}>🚗 {item.carBrand || item.brandLabel || ''}</Text>
              <Text style={S.adminCardInfo}>📍 {item.city} · 📞 {item.phone}</Text>
              {item.notes ? <Text style={S.adminCardInfo}>📝 {item.notes}</Text> : null}
              <Text style={S.adminCardPrice}>{item.price > 0 ? `${item.price.toLocaleString()} د.إ` : '—'}</Text>
              {can('canApprove') ? (
                <View style={S.adminBtns}>
                  <TouchableOpacity style={S.approveBtn} onPress={() => approvePart(item.id)}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={S.approveText}>موافقة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.rejectBtn} onPress={() => rejectPart(item.id)}>
                    <Ionicons name="trash-outline" size={16} color={CT.activeRed} />
                    <Text style={S.rejectText}>رفض</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[S.rejectBtn, { borderColor: CT.activeYellow }]} onPress={() => { setReturnTargetId(item.id); setReturnNote(''); setShowReturnModal(true); }}>
                    <Ionicons name="arrow-undo-outline" size={16} color={CT.activeYellow} />
                    <Text style={[S.rejectText, { color: CT.activeYellow }]}>إرجاع</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[S.emptySub, { textAlign: 'center', paddingVertical: 8 }]}>ليس لديك صلاحية الموافقة</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );

  const renderSettings = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Text style={S.settingsSecLabel}>{lang === 'ar' ? 'المظهر' : 'Appearance'}</Text>
      <View style={S.settingsCard}>
        <View style={S.settingsRow}>
          <Toggle value={isDark} onToggle={() => setIsDark(!isDark)} />
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={S.settingsRowText}>{isDark ? 'الوضع الداكن' : 'الوضع الفاتح'}</Text>
            <Text style={S.settingsRowSub}>يحمي العيون في الإضاءة المنخفضة</Text>
          </View>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#7F77DD' : '#F59E0B'} />
        </View>
      </View>
      <Text style={S.settingsSecLabel}>{lang === 'ar' ? 'اللغة' : 'Language'}</Text>
      <View style={S.settingsCard}>
        <TouchableOpacity style={S.settingsRow} onPress={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setFilterCity(''); }}>
          <Text style={S.settingsRowText}>{lang === 'ar' ? 'English / عربي' : 'العربية / English'}</Text>
          <Text style={{ color: CT.blue, fontWeight: '600' }}>{lang === 'ar' ? 'En' : 'ع'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={S.settingsSecLabel}>{lang === 'ar' ? 'الحساب' : 'Account'}</Text>
      <View style={S.settingsCard}>
        <TouchableOpacity style={S.settingsRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/profile'); }}>
          <Text style={S.settingsRowText}>{lang === 'ar' ? 'الملف الشخصي' : 'Profile'}</Text>
          <Ionicons name="chevron-forward" size={16} color={CT.textMuted} />
        </TouchableOpacity>
        {isLoggedIn && (
          <TouchableOpacity style={[S.settingsRow, S.settingsRowBorder]} onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await signOut(); }}>
            <Text style={[S.settingsRowText, { color: '#EF4444' }]}>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={S.settingsSecLabel}>{lang === 'ar' ? 'قانوني' : 'Legal'}</Text>
      <View style={S.settingsCard}>
        <TouchableOpacity style={S.settingsRow} onPress={() => setShowTerms(true)}>
          <Text style={S.settingsRowText}>{lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</Text>
          <Ionicons name="chevron-forward" size={16} color={CT.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={S.versionText}>Scoop Parts · v1.0</Text>
      <View style={{ height: NAV_HEIGHT + 20 }} />
    </ScrollView>
  );

  return (
    <View style={S.container}>
      <StatusBar backgroundColor={CT.hdrBg} barStyle="light-content" translucent={false} />
      <View style={S.header}>
        <View style={S.headerRow}>
          <View style={S.headerActions}>
            <TouchableOpacity style={S.headerIconBtn} onPress={() => setShowProfileModal(true)}>
              <Ionicons name={isLoggedIn ? 'person' : 'person-outline'} size={20} color="white" />
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={S.headerIconBtn} onPress={() => { setActiveTab('admin'); loadPending(); }}>
                <Ionicons name="shield" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <LogoWhite width={130} height={32} />
        </View>
        {activeTab === 'home' && (
          <View style={S.searchRow}>
            <TouchableOpacity style={S.advBtn} onPress={() => setShowAdvSearch(true)}>
              <Ionicons name="options-outline" size={16} color="#fff" />
              <Text style={S.advBtnText}>بحث متقدم</Text>
            </TouchableOpacity>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
            <TextInput style={S.searchInput} placeholder="ابحث... مثال: باترول" placeholderTextColor="rgba(255,255,255,0.4)" value={search} onChangeText={setSearch} />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'panel' && renderPanel()}
        {activeTab === 'favorites' && (
          favoriteParts.length === 0 ? (
            <View style={S.emptyState}>
              <PulsingIcon name="heart-outline" size={56} color={CT.navy} />
              <Text style={S.emptyTitle}>المفضلة فارغة</Text>
              <Text style={S.emptySub}>اضغط ♡ على أي قطعة لحفظها هنا.</Text>
            </View>
          ) : (
            <FlatList
              data={favoriteParts} keyExtractor={item => item.id} numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20, paddingTop: 12 }}
              renderItem={renderCard}
            />
          )
        )}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'admin' && renderAdmin()}
      </View>

      <View style={[S.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {[
          { id: 'home', iconOff: 'home-outline', iconOn: 'home', label: 'القطع' },
          { id: 'panel', iconOff: 'person-outline', iconOn: 'person', label: 'لوحتي' },
          { id: 'post', post: true, label: 'نشر' },
          { id: 'favorites', iconOff: 'heart-outline', iconOn: 'heart', label: 'المفضلة' },
          
          { id: 'settings', iconOff: 'settings-outline', iconOn: 'settings', label: 'إعدادات' },
        ].map(tab => {
          if (tab.post) {
            return (
              <TouchableOpacity key={tab.id} style={S.navPostBtn} onPress={() => { setEditingPartId(null); resetPostForm(); setShowPost(true); }}>
                <View style={S.navPostCircle}><Ionicons name="add" size={30} color="#fff" /></View>
                <Text style={S.navPostLabel}>{tab.label}</Text>
              </TouchableOpacity>
            );
          }
          const isOn = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={S.navItem} onPress={() => { setActiveTab(tab.id); if (tab.id === 'home') setSelectedCategory(null); if (tab.id === 'admin') loadPending(); }}>
              <View>
                <Ionicons name={isOn ? tab.iconOn : tab.iconOff} size={24} color={isOn ? CT.blue : CT.textMuted} />
                {tab.id === 'panel' && totalUnread > 0 && (
                  <View style={S.navBadge}><Text style={S.navBadgeText}>{totalUnread > 9 ? '9+' : totalUnread}</Text></View>
                )}
              </View>
              <Text style={[S.navLabel, isOn && S.navLabelOn]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={showChat} animationType="slide" onRequestClose={() => setShowChat(false)}>
        <View style={{ flex: 1, backgroundColor: CT.bg, marginBottom: kbHeight }}>
          <View style={S.chatHeader}>
            <TouchableOpacity onPress={() => { setShowChat(false); setActiveChat(null); setChatMessages([]); }}>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={S.chatHeaderTitle}>{activeChat?.otherName || 'محادثة'}</Text>
              <Text style={S.chatHeaderSub}>{activeChat?.partName || ''}</Text>
            </View>
          </View>
          <FlatList
            ref={chatListRef}
            data={chatMessages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
            onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => chatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const mine = item.senderId === user?.uid;
              return (
                <View style={[S.msgBubble, mine ? S.msgMine : S.msgTheirs]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: 200, height: 200, borderRadius: 10 }} resizeMode="cover" />
                  ) : (
                    <Text style={mine ? S.msgTextMine : S.msgTextTheirs}>{item.text}</Text>
                  )}
                  <Text style={{ fontSize: 9, color: mine ? 'rgba(255,255,255,0.6)' : CT.textMuted, textAlign: 'left', marginTop: 3 }}>{fmtTime(item.createdAt)}</Text>
                </View>
              );
            }}
            ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: 60 }}><Ionicons name="chatbubbles-outline" size={50} color={CT.textMuted} /><Text style={[S.emptySub, { marginTop: 12 }]}>ابدأ المحادثة 👋</Text></View>}
          />
          <View style={[S.chatInputRow, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity style={S.chatSend} onPress={sendMessage}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={S.chatAttach} onPress={pickChatImageMenu}>
              <Ionicons name="add" size={26} color={CT.textSecondary} />
            </TouchableOpacity>
            <TextInput style={S.chatInputField} placeholder="اكتب رسالة..." placeholderTextColor={CT.textMuted} value={chatInput} onChangeText={setChatInput} multiline />
          </View>
        </View>
      </Modal>

      <Modal visible={showSeller} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowSeller(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <View style={S.modalHdr}>
              <View style={{ width: 24 }} />
              <Text style={S.modalTitle}>👤 {sellerName}</Text>
              <TouchableOpacity onPress={() => setShowSeller(false)}><Ionicons name="close" size={24} color={CT.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={S.adminSub}>{sellerParts.length} إعلان منشور</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}>
              {sellerParts.map(item => (
                <TouchableOpacity key={item.id} style={S.adminCard} onPress={() => { setSelectedPart(item); setShowSeller(false); setShowDetails(true); }}>
                  {item.images && item.images.length > 0 && (
                    <Image source={{ uri: item.images[0] }} style={[S.adminCardImg, { width: 240 }]} resizeMode="cover" />
                  )}
                  <Text style={S.adminCardName}>{item.partName}</Text>
                  <Text style={S.adminCardInfo}>🚗 {item.carBrand || item.brandLabel || ''}</Text>
                  <Text style={S.adminCardPrice}>{item.price > 0 ? `${item.price.toLocaleString()} د.إ` : '—'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showDetails} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowDetails(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <View style={S.modalHdr}>
              <TouchableOpacity onPress={() => setShowDetails(false)}><Ionicons name="close" size={24} color={CT.textSecondary} /></TouchableOpacity>
              <Text style={S.modalTitle}>تفاصيل القطعة</Text>
              <TouchableOpacity onPress={() => selectedPart && toggleFavorite(selectedPart.id)}>
                <Ionicons name={selectedPart && favorites.includes(selectedPart.id) ? 'heart' : 'heart-outline'} size={24} color={selectedPart && favorites.includes(selectedPart.id) ? '#E11D2A' : CT.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedPart && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedPart.images && selectedPart.images.length > 0 && (
                  <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {selectedPart.images.map((img, i) => (<Image key={i} source={{ uri: img }} style={S.detailImg} resizeMode="cover" />))}
                  </ScrollView>
                )}
                <Text style={S.detailName}>{selectedPart.partName}</Text>
                <Text style={S.detailPrice}>{selectedPart.price > 0 ? `${selectedPart.price.toLocaleString()} د.إ` : '—'}</Text>
                <View style={S.detailRow}>
                  {selectedPart.carBrand ? <View style={S.detailTag}><Text style={S.detailTagText}>🚗 {selectedPart.carBrand}</Text></View> : null}
                  {selectedPart.km ? <View style={S.detailTag}><Text style={S.detailTagText}>🛣️ {Number(selectedPart.km).toLocaleString()} كم</Text></View> : null}
                  {selectedPart.transmission ? <View style={S.detailTag}><Text style={S.detailTagText}>⚙️ {selectedPart.transmission === 'auto' ? 'أوتوماتيك' : 'عادي'}</Text></View> : null}
                  {selectedPart.fuel ? <View style={S.detailTag}><Text style={S.detailTagText}>⛽ {({ petrol: 'بنزين', diesel: 'ديزل', hybrid: 'هايبرد', electric: 'كهرباء' })[selectedPart.fuel] || selectedPart.fuel}</Text></View> : null}
                  {selectedPart.engineCc ? <View style={S.detailTag}><Text style={S.detailTagText}>🏍️ {selectedPart.engineCc} CC</Text></View> : null}
                  {selectedPart.spec ? <View style={S.detailTag}><Text style={S.detailTagText}>{selectedPart.spec === 'gulf' ? 'خليجي' : 'وارد'}</Text></View> : null}
                  {selectedPart.bodyType ? <View style={S.detailTag}><Text style={S.detailTagText}>{selectedPart.bodyType}</Text></View> : null}
                  {selectedPart.cylinders ? <View style={S.detailTag}><Text style={S.detailTagText}>{selectedPart.cylinders} سلندر</Text></View> : null}
                  {selectedPart.exteriorColor ? <View style={S.detailTag}><Text style={S.detailTagText}>🎨 {selectedPart.exteriorColor}</Text></View> : null}
                  {selectedPart.city ? <View style={S.detailTag}><Text style={S.detailTagText}>📍 {selectedPart.city}{selectedPart.area ? ' : ' + selectedPart.area : ''}</Text></View> : null}
                  {selectedPart.condition ? <View style={S.detailTag}><Text style={S.detailTagText}>{CONDITION_LABELS[selectedPart.condition] || selectedPart.condition}</Text></View> : null}
                </View>
                {selectedPart.notes ? <Text style={S.detailNotes}>{selectedPart.notes}</Text> : null}
                {Array.isArray(selectedPart.features) && selectedPart.features.length > 0 ? (
                  <View style={S.detailRow}>
                    {selectedPart.features.map((f, i) => (
                      <View key={i} style={S.detailTag}><Text style={S.detailTagText}>✓ {f}</Text></View>
                    ))}
                  </View>
                ) : null}
                {selectedPart.lat != null && selectedPart.lng != null ? (
                  <TouchableOpacity style={[S.callBtn, { backgroundColor: CT.navy, marginBottom: 14 }]} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedPart.lat},${selectedPart.lng}`)}>
                    <Ionicons name="location" size={18} color="#fff" />
                    <Text style={S.callText}>شوف الموقع على الخريطة</Text>
                  </TouchableOpacity>
                ) : null}
                {selectedPart.userName ? (
                  <TouchableOpacity style={S.sellerBox} onPress={() => openSellerPage(selectedPart)}>
                    <Ionicons name="chevron-back" size={18} color={CT.navy} />
                    <View style={{ flex: 1 }}>
                      <Text style={S.sellerName}>👤 {selectedPart.userName}</Text>
                      <Text style={S.sellerHint}>عرض كل إعلانات المعلن</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {isLoggedIn && selectedPart.userId === user?.uid ? (
                  (selectedPart.status === undefined || selectedPart.status === 'approved') ? (
                    <TouchableOpacity style={[S.callBtn, { backgroundColor: selectedPart.sold ? CT.navyDark : '#E11D2A' }]} onPress={() => { if (selectedPart.sold) { setShowDetails(false); openResubmit(selectedPart.id); } else { toggleSold(selectedPart); setSelectedPart({ ...selectedPart, sold: true }); } }}>
                      <Ionicons name={selectedPart.sold ? 'refresh' : 'checkmark-done'} size={18} color="#fff" />
                      <Text style={S.callText}>{selectedPart.sold ? 'إعادة إرسال' : (lang === 'ar' ? 'تمّ البيع (غير متوفر)' : 'Mark as Sold')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[S.returnedBanner, { backgroundColor: selectedPart.status === 'rejected' ? '#FEE2E2' : CT.tagBg, borderColor: selectedPart.status === 'rejected' ? CT.activeRed : CT.cardBorder }]}>
                      <Text style={[S.returnedTitle, { color: selectedPart.status === 'rejected' ? CT.activeRed : CT.textMuted }]}>
                        {selectedPart.status === 'rejected' ? '❌ مرفوض' : selectedPart.status === 'returned' ? '⚠️ مُرجع للتعديل' : '⏳ بانتظار الموافقة'}
                      </Text>
                      {!!selectedPart.adminNote && <Text style={S.returnedNote}>{selectedPart.adminNote}</Text>}
                    </View>
                  )
                ) : (
                  <>
                    <TouchableOpacity style={[S.callBtn, { marginBottom: 10 }]} onPress={() => openChat(selectedPart)}>
                      <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                      <Text style={S.callText}>مراسلة البائع</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[S.callBtn, { backgroundColor: '#16A34A' }]} onPress={() => callSeller(selectedPart.phone)}>
                      <Ionicons name="call" size={18} color="#fff" />
                      <Text style={S.callText}>اتصل بالبائع</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showPost} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowPost(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <View style={S.modalHdr}>
              <TouchableOpacity onPress={() => { setEditingPartId(null); resetPostForm(); }}><Text style={S.resetText}>مسح</Text></TouchableOpacity>
              <Text style={S.modalTitle}>{editingPartId ? 'تعديل الإعلان' : 'نشر إعلان'}</Text>
              <TouchableOpacity onPress={() => setShowPost(false)}><Ionicons name="close" size={22} color={CT.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={S.label}>نوع الإعلان *</Text>
              <View style={S.pillsRow}>
                <TouchableOpacity style={[S.pill, listingType === 'part' && S.pillOn]} onPress={() => { setListingType('part'); setSelectedBrand(null); setSelectedModel(null); setPostCategory(postCategory === 'vehicles' ? 'cars' : postCategory); }}>
                  <Text style={[S.pillText, listingType === 'part' && S.pillTextOn]}>قطع غيار</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.pill, listingType === 'vehicle' && S.pillOn]} onPress={() => { setListingType('vehicle'); setSelectedBrand(null); setSelectedModel(null); }}>
                  <Text style={[S.pillText, listingType === 'vehicle' && S.pillTextOn]}>مركبات</Text>
                </TouchableOpacity>
              </View>

              {listingType === 'vehicle' && (
                <>
                  <Text style={S.label}>نوع المركبة *</Text>
                  <View style={S.pillsRow}>
                    {[['car','سيارة'],['motorcycle','دراجة نارية'],['sportbike','دراجة رياضية'],['bicycle','دراجة هوائية'],['other','مركبة']].map(([id, lbl]) => (
                      <TouchableOpacity key={id} style={[S.pill, vehicleType === id && S.pillOn]} onPress={() => { setVehicleType(id); setSelectedBrand(null); setSelectedModel(null); }}>
                        <Text style={[S.pillText, vehicleType === id && S.pillTextOn]}>{lbl}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {listingType === 'part' && (
                <>
                  <Text style={S.label}>القسم *</Text>
                  <View style={S.pillsRow}>
                    {CATEGORIES.filter(cat => cat.id !== 'vehicles').map(cat => {
                      const on = postCategory === cat.id;
                      return (
                        <TouchableOpacity key={cat.id} style={[S.pill, on && S.pillOn]} onPress={() => setPostCategory(cat.id)}>
                          <Text style={[S.pillText, on && S.pillTextOn]}>{cat.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={S.label}>نوع القطعة *</Text>
                  <TouchableOpacity style={[S.dropTrigger, partTypeOpen && S.dropTriggerOpen]} onPress={() => { setPartTypeOpen(!partTypeOpen); setBrandOpen(false); setModelOpen(false); setPartQuery(''); }}>
                    <Ionicons name={partTypeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={CT.textSecondary} />
                    <Text style={[S.dropText, !partType && S.dropPlaceholder]}>{partType || 'اختر نوع القطعة'}</Text>
                    <Ionicons name="construct-outline" size={18} color={CT.textSecondary} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                  {partTypeOpen && (
                    <View style={S.dropList}>
                      <TextInput style={S.dropSearch} placeholder="ابحث..." placeholderTextColor={CT.textMuted} value={partQuery} onChangeText={setPartQuery} />
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {filteredPartTypes.map(pt => (
                          <TouchableOpacity key={pt} style={[S.dropItem, partType === pt && S.dropItemActive]} onPress={() => { setPartType(pt); setPartTypeOpen(false); setPartQuery(''); }}>
                            {partType === pt && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                            <Text style={S.dropItemText}>{pt}</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[S.dropItem, partType === 'غير ذلك' && S.dropItemActive]} onPress={() => { setPartType('غير ذلك'); setPartTypeOpen(false); setPartQuery(''); }}>
                          {partType === 'غير ذلك' && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                          <Text style={[S.dropItemText, { fontWeight: '700', color: CT.navy }]}>✏️ غير ذلك (اكتب القطعة)</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                  {partType === 'غير ذلك' && (
                    <TextInput style={[S.input, { marginTop: 8 }]} placeholder="اكتب اسم القطعة..." placeholderTextColor={CT.textMuted} value={customPartType} onChangeText={setCustomPartType} />
                  )}
                </>
              )}

              <Text style={S.label}>الشركة *</Text>
              <TouchableOpacity style={[S.dropTrigger, brandOpen && S.dropTriggerOpen]} onPress={() => { setBrandOpen(!brandOpen); setPartTypeOpen(false); setModelOpen(false); setBrandQuery(''); }}>
                <Ionicons name={brandOpen ? 'chevron-up' : 'chevron-down'} size={18} color={CT.textSecondary} />
                <Text style={[S.dropText, !selectedBrand && S.dropPlaceholder]}>{selectedBrand ? selectedBrand.label : 'اختر الشركة'}</Text>
                <Ionicons name="car-sport-outline" size={18} color={CT.textSecondary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {brandOpen && (
                <View style={S.dropList}>
                  <TextInput style={S.dropSearch} placeholder="ابحث في الشركات..." placeholderTextColor={CT.textMuted} value={brandQuery} onChangeText={setBrandQuery} />
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filteredBrands.map(b => (
                      <TouchableOpacity key={b.value} style={[S.dropItem, selectedBrand?.value === b.value && S.dropItemActive]} onPress={() => { setSelectedBrand(b); setSelectedModel(null); setBrandOpen(false); setBrandQuery(''); }}>
                        {selectedBrand?.value === b.value && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                        <Text style={S.dropItemText}>{b.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={S.label}>الموديل</Text>
              <TouchableOpacity style={[S.dropTrigger, modelOpen && S.dropTriggerOpen, !selectedBrand && S.dropTriggerDisabled]} onPress={() => { if (!selectedBrand) return; setModelOpen(!modelOpen); setPartTypeOpen(false); setBrandOpen(false); setModelQuery(''); }} disabled={!selectedBrand}>
                <Ionicons name={modelOpen ? 'chevron-up' : 'chevron-down'} size={18} color={CT.textSecondary} />
                <Text style={[S.dropText, !selectedModel && S.dropPlaceholder]}>{selectedModel || (selectedBrand ? 'اختر الموديل' : 'اختر الشركة أولاً')}</Text>
                <Ionicons name="speedometer-outline" size={18} color={CT.textSecondary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {modelOpen && selectedBrand && (
                <View style={S.dropList}>
                  <TextInput style={S.dropSearch} placeholder="ابحث في الموديلات..." placeholderTextColor={CT.textMuted} value={modelQuery} onChangeText={setModelQuery} />
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    <TouchableOpacity style={[S.dropItem, !selectedModel && S.dropItemActive]} onPress={() => { setSelectedModel(null); setModelOpen(false); setModelQuery(''); }}>
                      {!selectedModel && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                      <Text style={S.dropItemText}>كل الموديلات</Text>
                    </TouchableOpacity>
                    {filteredModels.map(m => (
                      <TouchableOpacity key={m} style={[S.dropItem, selectedModel === m && S.dropItemActive]} onPress={() => { setSelectedModel(m); setModelOpen(false); setModelQuery(''); }}>
                        {selectedModel === m && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                        <Text style={S.dropItemText}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={S.label}>{listingType === 'vehicle' ? 'سنة الصنع *' : 'سنة الصنع (اختياري)'}</Text>
              <TextInput style={S.input} placeholder="مثال: 2015" placeholderTextColor={CT.textMuted} value={carYear} onChangeText={setCarYear} keyboardType="numeric" />

              {listingType === 'vehicle' && (
                <>
                  {vehicleType !== 'bicycle' && (
                    <>
                      <Text style={S.label}>الممشى / الكيلومترات *</Text>
                      <TextInput style={S.input} placeholder="مثال: 120000" placeholderTextColor={CT.textMuted} value={vehKm} onChangeText={setVehKm} keyboardType="numeric" />
                    </>
                  )}

                  {vehicleType === 'car' ? (
                    <>
                      <Text style={S.label}>ناقل الحركة</Text>
                      <View style={S.pillsRow}>
                        <TouchableOpacity style={[S.pill, vehTransmission === 'auto' && S.pillOn]} onPress={() => setVehTransmission('auto')}>
                          <Text style={[S.pillText, vehTransmission === 'auto' && S.pillTextOn]}>أوتوماتيك</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[S.pill, vehTransmission === 'manual' && S.pillOn]} onPress={() => setVehTransmission('manual')}>
                          <Text style={[S.pillText, vehTransmission === 'manual' && S.pillTextOn]}>عادي (مانيوال)</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={S.label}>نوع الوقود</Text>
                      <View style={S.pillsRow}>
                        {[['petrol','بنزين'],['diesel','ديزل'],['hybrid','هايبرد'],['electric','كهرباء']].map(([id, lbl]) => (
                          <TouchableOpacity key={id} style={[S.pill, vehFuel === id && S.pillOn]} onPress={() => setVehFuel(id)}>
                            <Text style={[S.pillText, vehFuel === id && S.pillTextOn]}>{lbl}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={S.label}>المواصفات</Text>
                      <View style={S.pillsRow}>
                        <TouchableOpacity style={[S.pill, vehSpec === 'gulf' && S.pillOn]} onPress={() => setVehSpec('gulf')}>
                          <Text style={[S.pillText, vehSpec === 'gulf' && S.pillTextOn]}>خليجي</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[S.pill, vehSpec === 'imported' && S.pillOn]} onPress={() => setVehSpec('imported')}>
                          <Text style={[S.pillText, vehSpec === 'imported' && S.pillTextOn]}>وارد</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={S.label}>نوع الهيكل (اختياري)</Text>
                      <View style={S.pillsRow}>
                        {BODY_TYPES.map(b => (
                          <TouchableOpacity key={b} style={[S.pill, vehBody === b && S.pillOn]} onPress={() => setVehBody(vehBody === b ? '' : b)}>
                            <Text style={[S.pillText, vehBody === b && S.pillTextOn]}>{b}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={S.label}>عدد السلندرات (اختياري)</Text>
                      <View style={S.pillsRow}>
                        {['3','4','5','6','8','10','12'].map(c => (
                          <TouchableOpacity key={c} style={[S.pill, vehCylinders === c && S.pillOn]} onPress={() => setVehCylinders(vehCylinders === c ? '' : c)}>
                            <Text style={[S.pillText, vehCylinders === c && S.pillTextOn]}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={S.label}>اللون (اختياري)</Text>
                      <View style={S.pillsRow}>
                        {CAR_COLORS.map(c => (
                          <TouchableOpacity key={c} style={[S.pill, vehColor === c && S.pillOn]} onPress={() => setVehColor(vehColor === c ? '' : c)}>
                            <Text style={[S.pillText, vehColor === c && S.pillTextOn]}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={S.label}>المميزات (اختياري — اختر ما ينطبق)</Text>
                      <View style={S.pillsRow}>
                        {CAR_FEATURES.map(f => {
                          const on = vehFeatures.includes(f);
                          return (
                            <TouchableOpacity key={f} style={[S.pill, on && S.pillOn]} onPress={() => setVehFeatures(on ? vehFeatures.filter(x => x !== f) : [...vehFeatures, f])}>
                              <Text style={[S.pillText, on && S.pillTextOn]}>{on ? '✓ ' : ''}{f}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={S.label}>مميزات أخرى</Text>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <TouchableOpacity
                          style={[S.adminAddBtn, { opacity: customFeature.trim() ? 1 : 0.5 }]}
                          disabled={!customFeature.trim()}
                          onPress={() => {
                            const f = customFeature.trim();
                            if (f && !vehFeatures.includes(f)) setVehFeatures([...vehFeatures, f]);
                            setCustomFeature('');
                          }}>
                          <Text style={S.adminAddBtnText}>أضف</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={[S.input, { flex: 1, marginBottom: 0 }]}
                          placeholder="اكتب ميزة ثم اضغط أضف"
                          placeholderTextColor={CT.textMuted}
                          value={customFeature}
                          onChangeText={setCustomFeature}
                          returnKeyType="done"
                          onSubmitEditing={() => {
                            const f = customFeature.trim();
                            if (f && !vehFeatures.includes(f)) setVehFeatures([...vehFeatures, f]);
                            setCustomFeature('');
                          }}
                        />
                      </View>
                      {vehFeatures.filter(f => !CAR_FEATURES.includes(f)).length > 0 && (
                        <View style={[S.pillsRow, { marginTop: 8 }]}>
                          {vehFeatures.filter(f => !CAR_FEATURES.includes(f)).map(f => (
                            <TouchableOpacity key={f} style={[S.pill, S.pillOn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={() => setVehFeatures(vehFeatures.filter(x => x !== f))}>
                              <Text style={[S.pillText, S.pillTextOn]}>{f}</Text>
                              <Ionicons name="close" size={14} color="#fff" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (vehicleType === 'motorcycle' || vehicleType === 'sportbike') ? (
                    <>
                      <Text style={S.label}>سعة المحرك CC (اختياري)</Text>
                      <TextInput style={S.input} placeholder="مثال: 600" placeholderTextColor={CT.textMuted} value={vehEngineCc} onChangeText={setVehEngineCc} keyboardType="numeric" />
                    </>
                  ) : null}
                </>
              )}

              <Text style={S.label}>الحالة</Text>
              <View style={S.pillsRow}>
                {CONDITIONS.map(c => {
                  const on = condition === c.id;
                  return (<TouchableOpacity key={c.id} style={[S.pill, on && S.pillOn]} onPress={() => setCondition(c.id)}><Text style={[S.pillText, on && S.pillTextOn]}>{c.label}</Text></TouchableOpacity>);
                })}
              </View>

              <Text style={S.label}>السعر (درهم) *</Text>
              <TextInput style={S.input} placeholder="مثال: 300" placeholderTextColor={CT.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />

              

              <Text style={S.label}>رقم الجوال *</Text>
              <TextInput style={S.input} placeholder="05x xxx xxxx" placeholderTextColor={CT.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TouchableOpacity style={[S.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: pickedLat !== null ? CT.activeGreen : CT.navyDark }]} onPress={openMapPicker} disabled={gettingLocation}>
                {gettingLocation ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name={pickedLat !== null ? 'checkmark-circle' : 'location'} size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>{pickedLat !== null ? 'تم تحديد الموقع · اضغط للتعديل' : 'حدد موقع القطعة على الخريطة'}</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={S.label}>الحي / المنطقة (اختياري)</Text>
              <TextInput style={S.input} placeholder="مثال: جميرا 1" placeholderTextColor={CT.textMuted} value={pickedArea} onChangeText={setPickedArea} />

              <Text style={S.label}>الوصف (اختياري)</Text>
              <TextInput style={[S.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="اوصف المركبة أو الإعلان..." placeholderTextColor={CT.textMuted} value={notes} onChangeText={setNotes} multiline />

              <Text style={S.label}>{listingType === 'vehicle' ? 'صور المركبة' : 'صور القطعة'} * (حتى {MAX_IMAGES}) — اضغط صورة لجعلها الغلاف</Text>
              <View style={S.imagesRow}>
                {images.map((img, idx) => (
                  <TouchableOpacity key={idx} style={S.imgThumb} activeOpacity={0.8} onPress={() => setCoverImage(idx)}>
                    <Image source={{ uri: img }} style={S.imgThumbImg} />
                    {idx === 0 && (
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: CT.navyDark, paddingVertical: 2 }}>
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', textAlign: 'center' }}>الغلاف</Text>
                      </View>
                    )}
                    <TouchableOpacity style={S.imgRemove} onPress={() => removeImage(idx)}><Ionicons name="close" size={14} color="#fff" /></TouchableOpacity>
                  </TouchableOpacity>
                ))}
                {images.length < MAX_IMAGES && (
                  <TouchableOpacity style={S.imgAdd} onPress={pickImage} disabled={pickingImage}>
                    {pickingImage ? <ActivityIndicator color={CT.navy} /> : (<><Ionicons name="camera-outline" size={26} color={CT.navy} /><Text style={S.imgAddText}>إضافة</Text></>)}
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={S.submitBtn} onPress={submitPart} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.submitText}>{listingType === 'vehicle' ? 'إرسال المركبة' : 'إرسال القطعة'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>

              

          {showMapPicker && (
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#000' }}>
              {pickedLat !== null && (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  initialRegion={{ latitude: pickedLat, longitude: pickedLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                  onRegionChangeComplete={(r) => { setPickedLat(r.latitude); setPickedLng(r.longitude); }}
                />
              )}
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="location" size={48} color="#E11D2A" style={{ marginBottom: 48 }} />
              </View>
              <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 20, left: 0, right: 0, alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>حرّك الخريطة لوضع الدبوس على الموقع</Text>
                </View>
              </View>
              <View style={{ position: 'absolute', bottom: insets.bottom + 30, left: 20, right: 20, flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' }} onPress={() => { setPickedLat(null); setPickedLng(null); setShowMapPicker(false); }}>
                  <Text style={{ color: '#E11D2A', fontWeight: 'bold' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 2, backgroundColor: CT.activeGreen, padding: 16, borderRadius: 12, alignItems: 'center' }} onPress={async () => {
                  try {
                    const res = await Location.reverseGeocodeAsync({ latitude: pickedLat, longitude: pickedLng });
                    const a = res && res[0];
                    if (a) {
                      const emirate = normalizeEmirate(a);
                      if (emirate) setPostCity(emirate);
                      setPickedArea(a.district || a.subregion || a.name || a.street || '');
                    }
                  } catch (e) {}
                  setShowMapPicker(false);
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>تأكيد الموقع</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      

      <Modal visible={showReturnModal} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setShowReturnModal(false)}>
        <View style={[S.modalOverlay, { justifyContent: 'center', padding: 24 }]}>
          <View style={[S.modalBox, { borderRadius: 20, maxHeight: 'auto', marginBottom: kbHeight }]}>
            <Text style={[S.modalTitle, { textAlign: 'right', marginBottom: 12 }]}>{returnMode === 'reject' ? 'رفض الإعلان' : returnMode === 'resubmit' ? 'إعادة إرسال الإعلان' : 'إرجاع الإعلان للتعديل'}</Text>
            <Text style={[S.label, { marginTop: 0 }]}>{returnMode === 'reject' ? 'سبب الرفض (يظهر للمستخدم)' : returnMode === 'resubmit' ? 'ملاحظة (تظهر للإدارة)' : 'سبب الإرجاع (يظهر للمستخدم)'}</Text>
            <TextInput style={[S.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]} placeholder={returnMode === 'resubmit' ? 'مثال: إعادة عرض الإعلان، تم تغيير السعر' : 'مثال: المعلومات غير مكتملة'} placeholderTextColor={CT.textMuted} value={returnNote} onChangeText={setReturnNote} multiline />
            <TouchableOpacity style={[S.submitBtn, { marginBottom: 8, backgroundColor: returnMode === 'reject' ? CT.activeRed : CT.navyDark }]} onPress={() => { if (returnMode === 'reject') confirmReject(returnTargetId, returnNote); else if (returnMode === 'resubmit') resubmitPart(returnTargetId, returnNote); else returnPart(returnTargetId, returnNote); setShowReturnModal(false); setReturnMode('return'); }}>
              <Text style={S.submitText}>{returnMode === 'reject' ? 'تأكيد الرفض' : returnMode === 'resubmit' ? 'إرسال للإدارة' : 'إرسال الإرجاع'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', padding: 8 }} onPress={() => setShowReturnModal(false)}>
              <Text style={{ color: CT.textMuted }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditProfile} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowEditProfile(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <View style={S.modalHdr}>
              <View style={{ width: 24 }} />
              <Text style={S.modalTitle}>تعديل ملفي</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}><Ionicons name="close" size={22} color={CT.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={S.label}>الاسم *</Text>
              <TextInput style={S.input} placeholder="اسمك" placeholderTextColor={CT.textMuted} value={epName} onChangeText={setEpName} />

              <Text style={S.label}>نوع البائع</Text>
              <View style={{ backgroundColor: CT.bg, borderRadius: 12, padding: 4, flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                <TouchableOpacity style={[S.segBtn, epSellerType === 'individual' && S.segBtnOn]} onPress={() => setEpSellerType('individual')}>
                  <Text style={[S.segText, epSellerType === 'individual' && S.segTextOn]}>👤 فرد</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.segBtn, epSellerType === 'company' && S.segBtnOn]} onPress={() => setEpSellerType('company')}>
                  <Text style={[S.segText, epSellerType === 'company' && S.segTextOn]}>🏢 شركة</Text>
                </TouchableOpacity>
              </View>

              {epSellerType === 'company' && (
                <>
                  <Text style={S.label}>اسم الشركة / المحل</Text>
                  <TextInput style={S.input} placeholder="اسم الشركة" placeholderTextColor={CT.textMuted} value={epCompanyName} onChangeText={setEpCompanyName} />
                </>
              )}

              <Text style={S.label}>رقم الجوال</Text>
              <TextInput style={S.input} placeholder="05x xxx xxxx" placeholderTextColor={CT.textMuted} value={epPhone} onChangeText={setEpPhone} keyboardType="phone-pad" />

              <Text style={S.label}>المدينة</Text>
              <View style={S.pillsRow}>
                {cities.filter(c => c !== 'الكل' && c !== 'All').map(c => {
                  const on = epCity === c;
                  return (<TouchableOpacity key={c} style={[S.pill, on && S.pillOn]} onPress={() => setEpCity(c)}><Text style={[S.pillText, on && S.pillTextOn]}>{c}</Text></TouchableOpacity>);
                })}
              </View>

              <TouchableOpacity style={S.submitBtn} onPress={saveMyProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={S.submitText}>حفظ ✅</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAdvSearch} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowAdvSearch(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <View style={S.modalHdr}>
              <TouchableOpacity onPress={resetAdvFilters}><Text style={S.resetText}>مسح الفلاتر</Text></TouchableOpacity>
              <Text style={S.modalTitle}>بحث متقدم</Text>
              <TouchableOpacity onPress={() => setShowAdvSearch(false)}><Ionicons name="close" size={22} color={CT.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={S.label}>كلمة البحث (شركة / موديل / اسم)</Text>
              <TextInput style={S.input} placeholder="مثال: باترول، تويوتا، مساعد" placeholderTextColor={CT.textMuted} value={search} onChangeText={setSearch} />

              <Text style={S.label}>النوع</Text>
              <View style={S.pillsRow}>
                {[['all','الكل'],['vehicle','مركبات'],['part','قطع غيار']].map(([id, lbl]) => (
                  <TouchableOpacity key={id} style={[S.pill, advType === id && S.pillOn]} onPress={() => setAdvType(id)}>
                    <Text style={[S.pillText, advType === id && S.pillTextOn]}>{lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={S.label}>السعر (درهم)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={S.advField} placeholder="من" placeholderTextColor={CT.textMuted} value={advPriceMin} onChangeText={setAdvPriceMin} keyboardType="numeric" />
                <TextInput style={S.advField} placeholder="إلى" placeholderTextColor={CT.textMuted} value={advPriceMax} onChangeText={setAdvPriceMax} keyboardType="numeric" />
              </View>

              <Text style={S.label}>سنة الصنع</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={S.advField} placeholder="من" placeholderTextColor={CT.textMuted} value={advYearMin} onChangeText={setAdvYearMin} keyboardType="numeric" />
                <TextInput style={S.advField} placeholder="إلى" placeholderTextColor={CT.textMuted} value={advYearMax} onChangeText={setAdvYearMax} keyboardType="numeric" />
              </View>

              <Text style={S.label}>الحالة</Text>
              <View style={S.pillsRow}>
                <TouchableOpacity style={[S.pill, advCondition === '' && S.pillOn]} onPress={() => setAdvCondition('')}>
                  <Text style={[S.pillText, advCondition === '' && S.pillTextOn]}>الكل</Text>
                </TouchableOpacity>
                {CONDITIONS.map(c => (
                  <TouchableOpacity key={c.id} style={[S.pill, advCondition === c.id && S.pillOn]} onPress={() => setAdvCondition(c.id)}>
                    <Text style={[S.pillText, advCondition === c.id && S.pillTextOn]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={S.label}>المدينة</Text>
              <View style={S.pillsRow}>
                {cities.map(c => {
                  const on = advCity === c || (c === cities[0] && !advCity);
                  return (
                    <TouchableOpacity key={c} style={[S.pill, on && S.pillOn]} onPress={() => setAdvCity(c === cities[0] ? '' : c)}>
                      <Text style={[S.pillText, on && S.pillTextOn]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={S.label}>الترتيب</Text>
              <View style={S.pillsRow}>
                {[['newest','الأحدث'],['price_asc','الأقل سعرًا'],['price_desc','الأعلى سعرًا']].map(([id, lbl]) => (
                  <TouchableOpacity key={id} style={[S.pill, advSort === id && S.pillOn]} onPress={() => setAdvSort(id)}>
                    <Text style={[S.pillText, advSort === id && S.pillTextOn]}>{lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={S.submitBtn} onPress={() => { setSelectedCategory(null); setSearchResultsMode(true); setShowAdvSearch(false); }}>
                <Text style={S.submitText}>عرض النتائج ({advFilteredParts.length})</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showTerms} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowTerms(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <View style={S.modalHandle} />
            <View style={S.modalHdr}>
              <View style={{ width: 24 }} />
              <Text style={S.modalTitle}>الشروط والأحكام</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)}><Ionicons name="close" size={22} color={CT.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              <Text style={{ color: CT.textSecondary, fontSize: 13, lineHeight: 24, textAlign: 'right' }}>{TERMS_TEXT}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <TouchableOpacity style={profileStyles.overlay} activeOpacity={1} onPress={() => setShowProfileModal(false)}>
          <TouchableOpacity activeOpacity={1} style={profileStyles.modal} onPress={(e) => e.stopPropagation()}>
            {isLoggedIn ? (
              <>
                <View style={profileStyles.avatar}><Ionicons name="person" size={40} color="#fff" /></View>
                <Text style={profileStyles.name}>{user?.displayName || 'User'}</Text>
                <Text style={profileStyles.email}>{user?.email}</Text>
                <TouchableOpacity style={profileStyles.logoutBtn} onPress={async () => { setShowProfileModal(false); await signOut(); }}>
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                  <Text style={profileStyles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={profileStyles.avatar}><Ionicons name="person-outline" size={40} color="#fff" /></View>
                <Text style={profileStyles.welcomeText}>Welcome to Scoop</Text>
                <Text style={profileStyles.welcomeSubtext}>Sign in to post and manage your parts</Text>
                <TouchableOpacity style={profileStyles.signInBtn} onPress={() => { setShowProfileModal(false); router.push('/login'); }}>
                  <Text style={profileStyles.signInText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={profileStyles.signUpBtn} onPress={() => { setShowProfileModal(false); router.push('/signup'); }}>
                  <Text style={profileStyles.signUpText}>Create Account</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { backgroundColor: '#1a1f5c', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563d9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#a0aef5', marginBottom: 24 },
  welcomeText: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  welcomeSubtext: { fontSize: 14, color: '#a0aef5', marginBottom: 24, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', borderRadius: 12, height: 50, width: '100%', gap: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signInBtn: { backgroundColor: '#2563d9', borderRadius: 12, height: 50, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signUpBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, height: 50, width: '100%', justifyContent: 'center', alignItems: 'center' },
  signUpText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});