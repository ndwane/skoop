import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView, Modal,
  Alert, Linking, Image, StatusBar, Dimensions, Animated, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc } from '../firebase';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const MAX_IMAGES = 5;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ADMIN_EMAILS = ['ndwanek@gmail.com'];

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

const CATEGORIES = [
  { id: 'cars', label: 'قطع سيارات', icon: 'car-side', color: '#534AB7', bg: '#EEEDFE', bgDark: '#1E1545' },
  { id: 'motorcycles', label: 'قطع دراجات نارية', icon: 'motorbike', color: '#BA7517', bg: '#FAEEDA', bgDark: '#2E200D' },
  { id: 'bicycles', label: 'قطع سياكل هوائية', icon: 'bike', color: '#0F6E56', bg: '#E1F5EE', bgDark: '#0D2E1A' },
  { id: 'rc_planes', label: 'طائرات تحكم RC', icon: 'airplane', color: '#185FA5', bg: '#E6F1FB', bgDark: '#0d1535', isNew: true },
  { id: 'rc_cars', label: 'سيارات تحكم RC', icon: 'car-sports', img: require('../assets/cat-icons/rc_cars.png'), color: '#993556', bg: '#FBEAF0', bgDark: '#2E0D0D', isNew: true },
];

const BRANDS_DATA = [
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

  const isAdmin = isLoggedIn && user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const [activeTab, setActiveTab] = useState('home');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [myProfile, setMyProfile] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [epName, setEpName] = useState('');
  const [epPhone, setEpPhone] = useState('');
  const [epCity, setEpCity] = useState('دبي');
  const [epSellerType, setEpSellerType] = useState('individual');
  const [epCompanyName, setEpCompanyName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [panelFilter, setPanelFilter] = useState('all');
  const [editingPartId, setEditingPartId] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [returnTargetId, setReturnTargetId] = useState(null);

  const [parts, setParts] = useState([]);
  const [pendingParts, setPendingParts] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const stats = {
    approved: parts.length,
    pending: pendingParts.length,
    returned: pendingParts.filter(p => p.returnHistory && p.returnHistory.length > 0).length,
    total: parts.length + pendingParts.length,
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

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
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState([]);
  const [pickingImage, setPickingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const [partTypeOpen, setPartTypeOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState('');
  const [partQuery, setPartQuery] = useState('');

  const filteredBrands = brandQuery ? BRANDS_DATA.filter(b => b.label.toLowerCase().includes(brandQuery.toLowerCase())) : BRANDS_DATA;
  const models = selectedBrand ? (BRANDS_DATA.find(b => b.value === selectedBrand.value)?.models || []) : [];
  const filteredPartTypes = partQuery ? PART_TYPES.filter(p => p.includes(partQuery)) : PART_TYPES;

  useEffect(() => { loadParts(); }, []);
  useEffect(() => { if (isAdmin) loadPending(); }, [isAdmin]);
  useEffect(() => { if (isLoggedIn) loadMyProfile(); }, [isLoggedIn]);

  const loadParts = async () => {
    try {
      const snap = await getDocs(collection(db, 'parts'));
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list = list.filter(p => p.status === undefined || p.status === 'approved' || ((p.status === 'returned' || p.status === 'pending') && p.userId === user?.uid));
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
      list = list.filter(p => p.status === 'pending');
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setPendingParts(list);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('رفض الإعلان؟', 'سيتم حذف الإعلان نهائياً.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'parts', id));
          setPendingParts(prev => prev.filter(p => p.id !== id));
        } catch (e) {
          Alert.alert('خطأ', 'لم يتم الحذف');
        }
      }}
    ]);
  };

  const resetPostForm = () => {
    setPartType(''); setCustomPartType(''); setSelectedBrand(null); setSelectedModel(null);
    setCarYear(''); setCondition('used'); setPrice(''); setPostCity('دبي');
    setPhone(myProfile?.phone || ''); setNotes(''); setImages([]);
    setPostCity(myProfile?.city || 'دبي');
    setPostCategory(selectedCategory || 'cars');
    setPartTypeOpen(false); setBrandOpen(false); setModelOpen(false);
    setBrandQuery(''); setPartQuery('');
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
        const compressed = [];
        for (const asset of result.assets) {
          const manip = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 800 } }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true });
          if (manip.base64) compressed.push('data:image/jpeg;base64,' + manip.base64);
        }
        setImages(prev => [...prev, ...compressed].slice(0, MAX_IMAGES));
      }
    } catch (e) { Alert.alert('', 'تعذّر اختيار الصورة'); }
    setPickingImage(false);
  };

  const removeImage = (idx) => { setImages(prev => prev.filter((_, i) => i !== idx)); };

  const submitPart = async () => {
    const finalPartType = partType === 'غير ذلك' ? customPartType.trim() : partType;
    if (!finalPartType || !selectedBrand || !price.trim() || !phone.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('', 'الرجاء تعبئة: نوع القطعة، الشركة، السعر، ورقم الجوال'); return;
    }
    if (images.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('', 'أضف صورة واحدة على الأقل للقطعة'); return;
    }
    setSaving(true);
    try {
      if (editingPartId) {
        await updateDoc(doc(db, 'parts', editingPartId), {
          partName: finalPartType, brand: selectedBrand.value, brandLabel: selectedBrand.label,
          model: selectedModel || null, carYear: carYear.trim() || null,
          carBrand: `${selectedBrand.label.split('/')[0].trim()} ${selectedModel || ''} ${carYear || ''}`.trim(),
          condition, price: parseInt(price) || 0, city: postCity, phone: phone.trim(),
          notes: notes.trim(), images, category: postCategory || 'cars',
          status: 'pending', adminNote: '',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSaving(false);
        Alert.alert('تم ✅', 'تم إعادة إرسال إعلانك للمراجعة.', [{ text: 'تمام', onPress: () => { setShowPost(false); setEditingPartId(null); resetPostForm(); loadParts(); } }]);
        return;
      }
      await addDoc(collection(db, 'parts'), {
        partName: finalPartType, brand: selectedBrand.value, brandLabel: selectedBrand.label,
        model: selectedModel || null, carYear: carYear.trim() || null,
        carBrand: `${selectedBrand.label.split('/')[0].trim()} ${selectedModel || ''} ${carYear || ''}`.trim(),
        condition, price: parseInt(price) || 0, city: postCity, phone: phone.trim(),
        notes: notes.trim(), images, category: postCategory || 'cars', status: 'pending',
        userId: user?.uid || null,
        userName: user?.displayName || user?.email?.split('@')[0] || 'مستخدم',
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم ✅', 'تم إرسال قطعتك! ستظهر بعد موافقة الإدارة.', [{ text: 'تمام', onPress: () => { setShowPost(false); resetPostForm(); } }]);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', 'لم يتم الإرسال، حاول مرة أخرى');
    }
    setSaving(false);
  };

  const callSeller = (p) => { if (p) Linking.openURL('tel:' + p); };

  const loadMyProfile = async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setMyProfile({ id: snap.id, ...snap.data() });
      else setMyProfile(null);
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

  const editMyPart = (part) => {
    setEditingPartId(part.id);
    setPostCategory(part.category || 'cars');
    setPartType(part.partName || '');
    setSelectedBrand(BRANDS_DATA.find(b => b.value === part.brand) || null);
    setSelectedModel(part.model || null);
    setCarYear(part.carYear || '');
    setCondition(part.condition || 'used');
    setPrice(String(part.price || ''));
    setPostCity(part.city || 'دبي');
    setPhone(part.phone || '');
    setNotes(part.notes || '');
    setImages(part.images || []);
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
    if (selectedCategory && (p.category || 'cars') !== selectedCategory) return false;
    if (p.sold) return false;
    if (p.status === 'returned' || p.status === 'pending') return false;
    if (filterCity && p.city !== filterCity) return false;
    if (search.trim()) {
      const txt = `${p.partName || ''} ${p.carBrand || ''} ${p.brandLabel || ''} ${p.model || ''}`.toLowerCase();
      if (!txt.includes(search.toLowerCase())) return false;
    }
    return true;
  });

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
    cityBar: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: CT.card, borderBottomWidth: 0.5, borderBottomColor: CT.cardBorder },
    soldOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: CARD_W * 0.7, backgroundColor: 'rgba(20,15,40,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 5, borderRadius: 10 },
    soldStamp: { borderWidth: 3, borderColor: '#E11D2A', backgroundColor: 'rgba(225,29,42,0.15)', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 8, transform: [{ rotate: '-8deg' }] },
    soldStampText: { color: '#E11D2A', fontSize: 14, fontWeight: '900', textAlign: 'center' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
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
      </View>
      <Text style={S.cardName} numberOfLines={1}>{item.partName}</Text>
      <Text style={S.cardBrand} numberOfLines={1}>🚗 {item.carBrand || item.brandLabel || ''}</Text>
      <Text style={S.cardPrice}>{item.price > 0 ? `${item.price.toLocaleString()} د.إ` : '—'}</Text>
      {item.userName ? <Text style={S.cardSeller}>👤 {item.userName}</Text> : null}
      <View style={S.cardTags}>
        {item.city ? <View style={S.miniTag}><Text style={S.miniTagText}>📍 {item.city}</Text></View> : null}
        {item.condition ? <View style={S.miniTag}><Text style={S.miniTagText}>{CONDITION_LABELS[item.condition] || item.condition}</Text></View> : null}
      </View>
    </TouchableOpacity>
  );

  const renderCategories = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: NAV_HEIGHT + 90 }} showsVerticalScrollIndicator={false}>
      <View style={S.catGrid}>
        {CATEGORIES.map((cat, idx) => {
          const fullWidth = idx === CATEGORIES.length - 1 && CATEGORIES.length % 2 === 1;
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
        })}
      </View>
      <TouchableOpacity style={[S.fab, { position: 'relative', bottom: 0, left: 0, alignSelf: 'center', marginTop: 20 }]} onPress={() => { resetPostForm(); setShowPost(true); }}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={S.fabText}>أضف قطعة</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCategoryParts = () => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
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
            <Text style={S.emptyTitle}>لا توجد قطع في هذا القسم بعد</Text>
            <Text style={S.emptySub}>كن أول من ينشر هنا! اضغط زر "أضف قطعة".</Text>
          </View>
        ) : (
          <FlatList
            data={visibleParts} keyExtractor={item => item.id} numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 90, paddingTop: 12 }}
            renderItem={renderCard}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadParts(); }} colors={[CT.navy]} tintColor={CT.navy} />}
          />
        )}
        <TouchableOpacity style={S.fab} onPress={() => { resetPostForm(); setShowPost(true); }}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={S.fabText}>أضف قطعة</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHome = () => (
    selectedCategory ? renderCategoryParts() : renderCategories()
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
              <Text style={S.adminCardName}>{item.partName}</Text>
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
              ) : (
                <TouchableOpacity style={[S.callBtn, { marginBottom: 0, backgroundColor: item.sold ? CT.activeGreen : '#E11D2A' }]} onPress={() => toggleSold(item)}>
                  <Ionicons name={item.sold ? 'refresh' : 'checkmark-done'} size={18} color="#fff" />
                  <Text style={S.callText}>{item.sold ? 'إعادة توفير' : 'تمّ البيع'}</Text>
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
        <View style={S.statCard}>
          <Text style={S.statNum}>{stats.approved}</Text>
          <Text style={S.statLabel}>معتمدة</Text>
        </View>
        <View style={S.statCard}>
          <Text style={[S.statNum, { color: CT.activeYellow }]}>{stats.pending}</Text>
          <Text style={S.statLabel}>منتظرة</Text>
        </View>
        <View style={S.statCard}>
          <Text style={[S.statNum, { color: CT.activeRed }]}>{stats.returned}</Text>
          <Text style={S.statLabel}>سبق إرجاعها</Text>
        </View>
        <View style={S.statCard}>
          <Text style={S.statNum}>{stats.total}</Text>
          <Text style={S.statLabel}>الإجمالي</Text>
        </View>
      </View>
      <View style={S.adminHdr}>
        <Text style={S.adminTitle}>موافقة الإعلانات 🛡️</Text>
        <Text style={S.adminSub}>{pendingParts.length > 0 ? `${pendingParts.length} إعلان بانتظار الموافقة` : 'لا توجد إعلانات منتظرة'}</Text>
      </View>
      {loadingPending ? (
        <ActivityIndicator size="large" color={CT.navy} style={{ marginTop: 40 }} />
      ) : pendingParts.length === 0 ? (
        <View style={S.emptyState}>
          <PulsingIcon name="checkmark-done-circle-outline" size={56} color={CT.activeGreen} />
          <Text style={S.emptyTitle}>كل شيء تمام ✅</Text>
          <Text style={S.emptySub}>لا توجد إعلانات تنتظر الموافقة حالياً.</Text>
        </View>
      ) : (
        <FlatList
          data={pendingParts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: NAV_HEIGHT + 20, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={loadingPending} onRefresh={loadPending} colors={[CT.navy]} tintColor={CT.navy} />}
          renderItem={({ item }) => (
            <View style={S.adminCard}>
              {item.images && item.images.length > 0 && (
                <Image source={{ uri: item.images[0] }} style={S.adminCardImg} resizeMode="cover" />
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
          </View>
          <LogoWhite width={130} height={32} />
        </View>
        {activeTab === 'home' && (
          <View style={S.searchRow}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
            <TextInput style={S.searchInput} placeholder="ابحث عن قطعة... مثال: مساعد باترول" placeholderTextColor="rgba(255,255,255,0.4)" value={search} onChangeText={setSearch} />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'panel' && renderPanel()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'admin' && renderAdmin()}
      </View>

      <View style={[S.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {[
          { id: 'home', iconOff: 'home-outline', iconOn: 'home', label: 'القطع' },
          { id: 'panel', iconOff: 'person-outline', iconOn: 'person', label: 'لوحتي' },
          ...(isAdmin ? [{ id: 'admin', iconOff: 'shield-outline', iconOn: 'shield', label: 'الإدارة' }] : []),
          { id: 'settings', iconOff: 'settings-outline', iconOn: 'settings', label: 'إعدادات' },
        ].map(tab => {
          const isOn = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={S.navItem} onPress={() => { setActiveTab(tab.id); if (tab.id === 'home') setSelectedCategory(null); if (tab.id === 'admin') loadPending(); }}>
              <Ionicons name={isOn ? tab.iconOn : tab.iconOff} size={24} color={isOn ? CT.blue : CT.textMuted} />
              <Text style={[S.navLabel, isOn && S.navLabelOn]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
                    <Image source={{ uri: item.images[0] }} style={S.adminCardImg} resizeMode="cover" />
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
              <View style={{ width: 24 }} />
              <Text style={S.modalTitle}>تفاصيل القطعة</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}><Ionicons name="close" size={24} color={CT.textSecondary} /></TouchableOpacity>
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
                  {selectedPart.city ? <View style={S.detailTag}><Text style={S.detailTagText}>📍 {selectedPart.city}</Text></View> : null}
                  {selectedPart.condition ? <View style={S.detailTag}><Text style={S.detailTagText}>{CONDITION_LABELS[selectedPart.condition] || selectedPart.condition}</Text></View> : null}
                </View>
                {selectedPart.notes ? <Text style={S.detailNotes}>{selectedPart.notes}</Text> : null}
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
                  <TouchableOpacity style={[S.callBtn, { backgroundColor: selectedPart.sold ? CT.activeGreen : '#E11D2A' }]} onPress={() => { toggleSold(selectedPart); setSelectedPart({ ...selectedPart, sold: !selectedPart.sold }); }}>
                    <Ionicons name={selectedPart.sold ? 'refresh' : 'checkmark-done'} size={18} color="#fff" />
                    <Text style={S.callText}>{selectedPart.sold ? (lang === 'ar' ? 'إعادة توفير القطعة' : 'Mark Available') : (lang === 'ar' ? 'تمّ البيع (غير متوفر)' : 'Mark as Sold')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={S.callBtn} onPress={() => callSeller(selectedPart.phone)}>
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={S.callText}>اتصل بالبائع</Text>
                  </TouchableOpacity>
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
              <Text style={S.modalTitle}>{editingPartId ? 'تعديل الإعلان' : 'نشر قطعة غيار'}</Text>
              <TouchableOpacity onPress={() => setShowPost(false)}><Ionicons name="close" size={22} color={CT.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={S.label}>القسم *</Text>
              <View style={S.pillsRow}>
                {CATEGORIES.map(cat => {
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
              <TouchableOpacity style={[S.dropTrigger, modelOpen && S.dropTriggerOpen, !selectedBrand && S.dropTriggerDisabled]} onPress={() => { if (!selectedBrand) return; setModelOpen(!modelOpen); setPartTypeOpen(false); setBrandOpen(false); }} disabled={!selectedBrand}>
                <Ionicons name={modelOpen ? 'chevron-up' : 'chevron-down'} size={18} color={CT.textSecondary} />
                <Text style={[S.dropText, !selectedModel && S.dropPlaceholder]}>{selectedModel || (selectedBrand ? 'اختر الموديل' : 'اختر الشركة أولاً')}</Text>
                <Ionicons name="speedometer-outline" size={18} color={CT.textSecondary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {modelOpen && selectedBrand && (
                <View style={S.dropList}>
                  <ScrollView nestedScrollEnabled>
                    <TouchableOpacity style={[S.dropItem, !selectedModel && S.dropItemActive]} onPress={() => { setSelectedModel(null); setModelOpen(false); }}>
                      {!selectedModel && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                      <Text style={S.dropItemText}>كل الموديلات</Text>
                    </TouchableOpacity>
                    {models.map(m => (
                      <TouchableOpacity key={m} style={[S.dropItem, selectedModel === m && S.dropItemActive]} onPress={() => { setSelectedModel(m); setModelOpen(false); }}>
                        {selectedModel === m && <Ionicons name="checkmark" size={16} color={CT.navy} />}
                        <Text style={S.dropItemText}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={S.label}>سنة السيارة (اختياري)</Text>
              <TextInput style={S.input} placeholder="مثال: 2015" placeholderTextColor={CT.textMuted} value={carYear} onChangeText={setCarYear} keyboardType="numeric" />

              <Text style={S.label}>الحالة</Text>
              <View style={S.pillsRow}>
                {CONDITIONS.map(c => {
                  const on = condition === c.id;
                  return (<TouchableOpacity key={c.id} style={[S.pill, on && S.pillOn]} onPress={() => setCondition(c.id)}><Text style={[S.pillText, on && S.pillTextOn]}>{c.label}</Text></TouchableOpacity>);
                })}
              </View>

              <Text style={S.label}>السعر (درهم) *</Text>
              <TextInput style={S.input} placeholder="مثال: 300" placeholderTextColor={CT.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />

              <Text style={S.label}>المدينة</Text>
              <View style={S.pillsRow}>
                {cities.filter(c => c !== 'الكل' && c !== 'All').map(c => {
                  const on = postCity === c;
                  return (<TouchableOpacity key={c} style={[S.pill, on && S.pillOn]} onPress={() => setPostCity(c)}><Text style={[S.pillText, on && S.pillTextOn]}>{c}</Text></TouchableOpacity>);
                })}
              </View>

              <Text style={S.label}>رقم الجوال *</Text>
              <TextInput style={S.input} placeholder="05x xxx xxxx" placeholderTextColor={CT.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

              <Text style={S.label}>ملاحظات (اختياري)</Text>
              <TextInput style={[S.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="تفاصيل إضافية..." placeholderTextColor={CT.textMuted} value={notes} onChangeText={setNotes} multiline />

              <Text style={S.label}>صور القطعة * (حتى {MAX_IMAGES})</Text>
              <View style={S.imagesRow}>
                {images.map((img, idx) => (
                  <View key={idx} style={S.imgThumb}>
                    <Image source={{ uri: img }} style={S.imgThumbImg} />
                    <TouchableOpacity style={S.imgRemove} onPress={() => removeImage(idx)}><Ionicons name="close" size={14} color="#fff" /></TouchableOpacity>
                  </View>
                ))}
                {images.length < MAX_IMAGES && (
                  <TouchableOpacity style={S.imgAdd} onPress={pickImage} disabled={pickingImage}>
                    {pickingImage ? <ActivityIndicator color={CT.navy} /> : (<><Ionicons name="camera-outline" size={26} color={CT.navy} /><Text style={S.imgAddText}>إضافة</Text></>)}
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={S.submitBtn} onPress={submitPart} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.submitText}>إرسال القطعة 🚀</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showReturnModal} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setShowReturnModal(false)}>
        <View style={[S.modalOverlay, { justifyContent: 'center', padding: 24 }]}>
          <View style={[S.modalBox, { borderRadius: 20, maxHeight: 'auto' }]}>
            <Text style={[S.modalTitle, { textAlign: 'right', marginBottom: 12 }]}>إرجاع الإعلان للتعديل</Text>
            <Text style={[S.label, { marginTop: 0 }]}>سبب الإرجاع (يظهر للمستخدم)</Text>
            <TextInput style={[S.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="مثال: الصورة غير واضحة، أضف صورة أوضح" placeholderTextColor={CT.textMuted} value={returnNote} onChangeText={setReturnNote} multiline />
            <TouchableOpacity style={[S.submitBtn, { marginBottom: 8 }]} onPress={() => { returnPart(returnTargetId, returnNote); setShowReturnModal(false); }}>
              <Text style={S.submitText}>إرسال الإرجاع</Text>
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