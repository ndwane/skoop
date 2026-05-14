import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Linking, ScrollView, Modal
} from 'react-native';

const API_URL = 'https://skoop-production.up.railway.app';

const CITIES = ['الكل', 'دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين'];

const COLORS = [
  { label: 'أبيض', hex: '#FFFFFF' },
  { label: 'أسود', hex: '#111111' },
  { label: 'رمادي', hex: '#888888' },
  { label: 'فضي', hex: '#C0C0C0' },
  { label: 'أحمر', hex: '#C0392B' },
  { label: 'أزرق', hex: '#2980B9' },
  { label: 'أزرق فاتح', hex: '#85C1E9' },
  { label: 'أخضر', hex: '#27AE60' },
  { label: 'ذهبي', hex: '#F39C12' },
  { label: 'بيج', hex: '#D4B896' },
  { label: 'بني', hex: '#7B4F2E' },
  { label: 'برتقالي', hex: '#E67E22' },
  { label: 'بنفسجي', hex: '#8E44AD' },
  { label: 'وردي', hex: '#F1948A' },
  { label: 'أصفر', hex: '#F4D03F' },
  { label: 'عنابي', hex: '#922B21' },
];

export default function Index() {
  const [search, setSearch] = useState('');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [kmFrom, setKmFrom] = useState('');
  const [kmTo, setKmTo] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const searchCars = async () => {
    if (!search) return;
    setLoading(true);
    setCars([]);
    setShowFilters(false);
    try {
      const params = new URLSearchParams({ q: search });
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (selectedCity !== 'الكل') params.append('city', selectedCity);
      if (yearFrom) params.append('yearFrom', yearFrom);
      if (yearTo) params.append('yearTo', yearTo);
      if (kmFrom) params.append('kmFrom', kmFrom);
      if (kmTo) params.append('kmTo', kmTo);

      const response = await fetch(API_URL + '/search?' + params.toString());
      const data = await response.json();
      setCars(data);

      data.forEach(async (car, index) => {
        if (car.price) {
          try {
            const evalResponse = await fetch(
              API_URL + '/evaluate?name=' + encodeURIComponent(car.name || '') + '&price=' + car.price
            );
            const evalData = await evalResponse.json();
            setCars(prev => prev.map((c, i) =>
              i === index ? { ...c, evaluation: evalData.evaluation } : c
            ));
          } catch (e) {}
        }
      });

    } catch (error) {
      console.log('خطأ:', error);
    }
    setLoading(false);
  };

  const resetFilters = () => {
    setMinPrice(''); setMaxPrice('');
    setSelectedCity('الكل');
    setYearFrom(''); setYearTo('');
    setKmFrom(''); setKmTo('');
    setSelectedColor('');
  };

  const activeFiltersCount = [
    minPrice || maxPrice,
    selectedCity !== 'الكل',
    yearFrom || yearTo,
    kmFrom || kmTo,
    selectedColor,
  ].filter(Boolean).length;

  const getEvalColor = (ev) => {
    if (!ev) return '#555';
    if (ev.includes('رخيص')) return '#00E676';
    if (ev.includes('غالي')) return '#FF4444';
    return '#FFB800';
  };

  const getEvalEmoji = (ev) => {
    if (!ev) return '⏳';
    if (ev.includes('رخيص')) return '🟢';
    if (ev.includes('غالي')) return '🔴';
    return '🟡';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🔍 سكوب</Text>
      <Text style={styles.subtitle}>ابحث عن أفضل صفقة سيارة في الإمارات</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="نيسان باترول..."
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          placeholderTextColor="#555"
          onSubmitEditing={searchCars}
        />
        <TouchableOpacity
          style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterBtnText}>
            ⚙️{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} onPress={searchCars}>
          <Text style={styles.searchBtnText}>بحث</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF4D00" />
          <Text style={styles.loadingText}>جاري البحث...</Text>
        </View>
      )}

      {!loading && cars.length > 0 && (
        <Text style={styles.resultsCount}>{cars.length} نتيجة</Text>
      )}

      <FlatList
        data={cars}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => item.link && Linking.openURL(item.link)}>
            <Text style={styles.carName}>{item.name}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.evaluation, { color: getEvalColor(item.evaluation) }]}>
                {getEvalEmoji(item.evaluation)} {item.evaluation || 'جاري التحليل...'}
              </Text>
              <Text style={styles.carPrice}>AED {item.price?.toLocaleString()}</Text>
            </View>
            <Text style={styles.carCity}>📍 {item.city}</Text>
            {item.year ? <Text style={styles.carDetail}>📅 {item.year}</Text> : null}
            {item.km ? <Text style={styles.carDetail}>🛣️ {item.km?.toLocaleString()} كم</Text> : null}
            <Text style={styles.tapHint}>اضغط لفتح الإعلان ←</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.resetText}>إعادة تعيين</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>فلاتر البحث</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>💰 الميزانية (درهم)</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="إلى"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#555"
                />
                <Text style={styles.rangeDash}>—</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="من"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#555"
                />
              </View>

              <Text style={styles.filterLabel}>📅 سنة الصنع</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="إلى (2024)"
                  value={yearTo}
                  onChangeText={setYearTo}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#555"
                  maxLength={4}
                />
                <Text style={styles.rangeDash}>—</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="من (2015)"
                  value={yearFrom}
                  onChangeText={setYearFrom}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#555"
                  maxLength={4}
                />
              </View>

              <Text style={styles.filterLabel}>🛣️ الكيلومترات</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="إلى (150000)"
                  value={kmTo}
                  onChangeText={setKmTo}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#555"
                />
                <Text style={styles.rangeDash}>—</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="من (0)"
                  value={kmFrom}
                  onChangeText={setKmFrom}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#555"
                />
              </View>

              <Text style={styles.filterLabel}>📍 المدينة</Text>
              <View style={styles.chipsRow}>
                {CITIES.map(city => (
                  <TouchableOpacity
                    key={city}
                    style={[styles.chip, selectedCity === city && styles.chipActive]}
                    onPress={() => setSelectedCity(city)}
                  >
                    <Text style={[styles.chipText, selectedCity === city && styles.chipTextActive]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>🎨 اللون</Text>
              <View style={styles.colorsGrid}>
                {COLORS.map(color => (
                  <TouchableOpacity
                    key={color.label}
                    style={styles.colorItem}
                    onPress={() => setSelectedColor(selectedColor === color.label ? '' : color.label)}
                  >
                    <View style={[
                      styles.colorCircle,
                      { backgroundColor: color.hex },
                      color.hex === '#FFFFFF' && styles.colorCircleWhite,
                      selectedColor === color.label && styles.colorCircleActive,
                    ]} />
                    <Text style={[
                      styles.colorLabel,
                      selectedColor === color.label && styles.colorLabelActive,
                    ]}>
                      {color.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={searchCars}>
                <Text style={styles.applyBtnText}>🔍 تطبيق وبحث</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 20, paddingTop: 60 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#FF4D00', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 30, fontSize: 14 },

  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1a1a2e', color: 'white', padding: 14, borderRadius: 12, fontSize: 15 },
  filterBtn: { backgroundColor: '#1a1a2e', padding: 14, borderRadius: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
  filterBtnActive: { borderColor: '#FF4D00' },
  filterBtnText: { fontSize: 18 },
  searchBtn: { backgroundColor: '#FF4D00', padding: 14, borderRadius: 12, justifyContent: 'center' },
  searchBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  loadingBox: { alignItems: 'center', marginBottom: 20 },
  loadingText: { color: '#888', marginTop: 10, fontSize: 13 },
  resultsCount: { color: '#555', fontSize: 13, textAlign: 'right', marginBottom: 10 },

  card: { backgroundColor: '#111118', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  carName: { color: 'white', fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  carPrice: { color: '#FF4D00', fontSize: 18, fontWeight: 'bold' },
  evaluation: { fontSize: 14, fontWeight: 'bold' },
  carCity: { color: '#888', fontSize: 13, textAlign: 'right', marginTop: 4 },
  carDetail: { color: '#666', fontSize: 12, textAlign: 'right', marginTop: 2 },
  tapHint: { color: '#444', fontSize: 11, textAlign: 'left', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#111118', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  resetText: { color: '#FF4D00', fontSize: 14 },
  closeText: { color: '#888', fontSize: 18 },

  filterLabel: { color: '#888', fontSize: 12, marginBottom: 10, textAlign: 'right' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  rangeInput: { flex: 1, backgroundColor: '#1a1a2e', color: 'white', padding: 12, borderRadius: 10, fontSize: 13, borderWidth: 1, borderColor: '#333' },
  rangeDash: { color: '#555', fontSize: 16 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { backgroundColor: '#1a1a2e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#333' },
  chipActive: { backgroundColor: '#FF4D00', borderColor: '#FF4D00' },
  chipText: { color: '#888', fontSize: 13 },
  chipTextActive: { color: 'white', fontWeight: 'bold' },

  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  colorItem: { alignItems: 'center', width: 52 },
  colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#333', marginBottom: 4 },
  colorCircleWhite: { borderColor: '#555' },
  colorCircleActive: { borderColor: '#FF4D00', borderWidth: 3 },
  colorLabel: { color: '#666', fontSize: 10, textAlign: 'center' },
  colorLabelActive: { color: '#FF4D00', fontWeight: 'bold' },

  applyBtn: { backgroundColor: '#FF4D00', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
  applyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});