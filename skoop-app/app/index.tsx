import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Linking, ScrollView, Modal, SafeAreaView
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
  const [activeTab, setActiveTab] = useState('home');

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
      const results = Array.isArray(data) ? data : [];
      setCars(results);

      results.forEach(async (car, index) => {
        try {
          const evalResponse = await fetch(
            API_URL + '/evaluate?name=' + encodeURIComponent(car.name || '') + '&price=' + (car.price || 0)
          );
          const evalData = await evalResponse.json();
          setCars(prev => prev.map((c, i) =>
            i === index ? { ...c, evaluation: evalData.evaluation } : c
          ));
        } catch (e) {}
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
    if (!ev) return '#999';
    if (ev.includes('رخيص')) return '#22C55E';
    if (ev.includes('غالي')) return '#EF4444';
    return '#F59E0B';
  };

  const getEvalBg = (ev) => {
    if (!ev) return '#F3F4F6';
    if (ev.includes('رخيص')) return '#DCFCE7';
    if (ev.includes('غالي')) return '#FEE2E2';
    return '#FEF3C7';
  };

  const getEvalEmoji = (ev) => {
    if (!ev) return '⏳';
    if (ev.includes('رخيص')) return '🟢';
    if (ev.includes('غالي')) return '🔴';
    return '🟡';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🔍 سكوب</Text>
        <TouchableOpacity
          style={[styles.filterIconBtn, activeFiltersCount > 0 && styles.filterIconActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIconText}>⚙️</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="ابحث عن سيارة... (نيسان، تويوتا...)"
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          placeholderTextColor="#AAA"
          onSubmitEditing={searchCars}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={searchCars}>
          <Text style={styles.searchBtnText}>بحث</Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Chips */}
      {activeFiltersCount > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFilters}>
          {selectedCity !== 'الكل' && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>📍 {selectedCity}</Text>
            </View>
          )}
          {(minPrice || maxPrice) && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>💰 {minPrice || '0'} - {maxPrice || '∞'}</Text>
            </View>
          )}
          {(yearFrom || yearTo) && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>📅 {yearFrom || '...'} - {yearTo || '...'}</Text>
            </View>
          )}
          {(kmFrom || kmTo) && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>🛣️ {kmFrom || '0'} - {kmTo || '∞'} كم</Text>
            </View>
          )}
          <TouchableOpacity style={styles.clearChip} onPress={resetFilters}>
            <Text style={styles.clearChipText}>✕ مسح</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>جاري البحث...</Text>
        </View>
      )}

      {/* Results Count */}
      {!loading && cars.length > 0 && (
        <Text style={styles.resultsCount}>{cars.length} نتيجة</Text>
      )}

      {/* Empty State */}
      {!loading && cars.length === 0 && search === '' && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>ابحث عن سيارتك</Text>
          <Text style={styles.emptySubtitle}>أدخل اسم السيارة للبحث عن أفضل الصفقات في الإمارات</Text>
        </View>
      )}

      {/* Cars List */}
      <FlatList
        data={cars}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => item.link && Linking.openURL(item.link)}
          >
            {/* Car Name */}
            <Text style={styles.carName}>{item.name}</Text>

            {/* Price */}
            <Text style={styles.carPrice}>
              {item.price > 0 ? `AED ${item.price?.toLocaleString()}` : 'السعر عند التواصل'}
            </Text>

            {/* AI Evaluation */}
            {item.evaluation && (
              <View style={[styles.evalBox, { backgroundColor: getEvalBg(item.evaluation) }]}>
                <Text style={[styles.evalText, { color: getEvalColor(item.evaluation) }]}>
                  {getEvalEmoji(item.evaluation)} {item.evaluation}
                </Text>
              </View>
            )}
            {!item.evaluation && (
              <View style={styles.evalBoxLoading}>
                <Text style={styles.evalLoadingText}>⏳ جاري تحليل السعر...</Text>
              </View>
            )}

            {/* Details Chips */}
            <View style={styles.chipsRow}>
              {item.city ? (
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>📍 {item.city}</Text>
                </View>
              ) : null}
              {item.year ? (
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>📅 {item.year}</Text>
                </View>
              ) : null}
              {item.km ? (
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>🛣️ {item.km?.toLocaleString()} كم</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.tapHint}>اضغط لفتح الإعلان ←</Text>
          </TouchableOpacity>
        )}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', icon: '🏠', label: 'الرئيسية' },
          { id: 'search', icon: '🔍', label: 'بحث' },
          { id: 'saved', icon: '🔖', label: 'المحفوظة' },
          { id: 'settings', icon: '⚙️', label: 'الإعدادات' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters Modal */}
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
                  placeholderTextColor="#AAA"
                />
                <Text style={styles.rangeDash}>—</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="من"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#AAA"
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
                  placeholderTextColor="#AAA"
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
                  placeholderTextColor="#AAA"
                  maxLength={4}
                />
              </View>

              <Text style={styles.filterLabel}>🛣️ الكيلومترات</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="إلى"
                  value={kmTo}
                  onChangeText={setKmTo}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#AAA"
                />
                <Text style={styles.rangeDash}>—</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="من"
                  value={kmFrom}
                  onChangeText={setKmFrom}
                  keyboardType="numeric"
                  textAlign="center"
                  placeholderTextColor="#AAA"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#1E1E2E' },
  filterIconBtn: { padding: 10, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  filterIconActive: { backgroundColor: '#EEF2FF' },
  filterIconText: { fontSize: 20 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#6366F1', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  searchBox: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, gap: 10 },
  input: { flex: 1, backgroundColor: 'white', color: '#1E1E2E', padding: 14, borderRadius: 14, fontSize: 15, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchBtn: { backgroundColor: '#6366F1', paddingHorizontal: 20, borderRadius: 14, justifyContent: 'center' },
  searchBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  activeFilters: { paddingHorizontal: 20, marginBottom: 10 },
  activeChip: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: '#C7D2FE' },
  activeChipText: { color: '#6366F1', fontSize: 12, fontWeight: '600' },
  clearChip: { backgroundColor: '#FEE2E2', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  clearChipText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },

  loadingBox: { alignItems: 'center', marginTop: 40 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  resultsCount: { color: '#888', fontSize: 13, textAlign: 'right', paddingHorizontal: 20, marginBottom: 8 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1E2E', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },

  card: { backgroundColor: 'white', marginHorizontal: 20, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
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

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', paddingVertical: 10, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 10 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 11, color: '#AAA', marginTop: 2 },
  navLabelActive: { color: '#6366F1', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#1E1E2E', fontSize: 18, fontWeight: 'bold' },
  resetText: { color: '#6366F1', fontSize: 14 },
  closeText: { color: '#888', fontSize: 18 },

  filterLabel: { color: '#888', fontSize: 12, marginBottom: 10, textAlign: 'right', fontWeight: '600' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  rangeInput: { flex: 1, backgroundColor: '#F3F4F6', color: '#1E1E2E', padding: 12, borderRadius: 10, fontSize: 13, borderWidth: 1, borderColor: '#E5E7EB' },
  rangeDash: { color: '#CCC', fontSize: 16 },

  chip: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { color: '#666', fontSize: 13 },
  chipTextActive: { color: 'white', fontWeight: 'bold' },

  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  colorItem: { alignItems: 'center', width: 52 },
  colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#E5E7EB', marginBottom: 4 },
  colorCircleWhite: { borderColor: '#CCC' },
  colorCircleActive: { borderColor: '#6366F1', borderWidth: 3 },
  colorLabel: { color: '#888', fontSize: 10, textAlign: 'center' },
  colorLabelActive: { color: '#6366F1', fontWeight: 'bold' },

  applyBtn: { backgroundColor: '#6366F1', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
  applyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});