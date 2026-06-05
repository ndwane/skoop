import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, RefreshControl, Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db, collection, getDocs } from '../firebase';
import { router } from 'expo-router';

const C = {
  hdrBg: '#26215C', bg: '#F8F6FF', card: '#FFFFFF', cardBorder: '#E8E4FF',
  textPrimary: '#26215C', textSecondary: '#534AB7', textMuted: '#9B96CC',
  navy: '#534AB7', navyDark: '#26215C', tagBg: '#F0EEFF',
  green: '#16A34A', greenBg: '#DCFCE7',
};

const CONDITION_LABELS = {
  new: 'جديد', like_new: 'شبه جديد', used: 'مستعمل',
};

export default function BrowseParts() {
  const insets = useSafeAreaInsets();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadParts = async () => {
    try {
      const snap = await getDocs(collection(db, 'parts'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setParts(list);
    } catch (e) {
      console.log('load parts error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadParts(); }, []);

  const callSeller = (phone) => {
    if (phone) Linking.openURL('tel:' + phone);
  };

  const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { backgroundColor: C.hdrBg, paddingTop: insets.top + 8, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: C.card, borderRadius: 14, marginHorizontal: 16, marginTop: 12, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    partName: { fontSize: 16, fontWeight: 'bold', color: C.textPrimary, textAlign: 'right', flex: 1 },
    price: { fontSize: 18, fontWeight: 'bold', color: C.navy },
    carBrand: { fontSize: 13, color: C.textSecondary, textAlign: 'right', marginBottom: 10 },
    tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 12 },
    tag: { backgroundColor: C.tagBg, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
    tagText: { fontSize: 11, color: C.textSecondary, fontWeight: '500' },
    condTag: { backgroundColor: C.greenBg, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
    condText: { fontSize: 11, color: C.green, fontWeight: '700' },
    notes: { fontSize: 12, color: C.textMuted, textAlign: 'right', marginBottom: 12, lineHeight: 18 },
    callBtn: { backgroundColor: C.navyDark, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    callText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary, marginTop: 16, marginBottom: 8, textAlign: 'center' },
    emptySub: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  });

  const renderPart = ({ item }) => (
    <View style={S.card}>
      <View style={S.cardTop}>
        <Text style={S.price}>{item.price > 0 ? `${item.price.toLocaleString()} د.إ` : '—'}</Text>
        <Text style={S.partName}>{item.partName}</Text>
      </View>
      <Text style={S.carBrand}>🚗 {item.carBrand}</Text>
      <View style={S.tagsRow}>
        {item.city && <View style={S.tag}><Text style={S.tagText}>📍 {item.city}</Text></View>}
        {item.condition && <View style={S.condTag}><Text style={S.condText}>{CONDITION_LABELS[item.condition] || item.condition}</Text></View>}
      </View>
      {item.notes ? <Text style={S.notes}>{item.notes}</Text> : null}
      <TouchableOpacity style={S.callBtn} onPress={() => callSeller(item.phone)}>
        <Ionicons name="call" size={16} color="#fff" />
        <Text style={S.callText}>اتصل بالبائع</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={S.container}>
      <StatusBar backgroundColor={C.hdrBg} barStyle="light-content" />
      <View style={S.header}>
        <View style={{ width: 34 }} />
        <Text style={S.headerTitle}>قطع الغيار المتوفرة</Text>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.navy} style={{ marginTop: 60 }} />
      ) : parts.length === 0 ? (
        <View style={S.empty}>
          <Ionicons name="cube-outline" size={64} color={C.textMuted} />
          <Text style={S.emptyTitle}>لا توجد قطع بعد</Text>
          <Text style={S.emptySub}>كن أول من ينشر قطعة غيار!</Text>
        </View>
      ) : (
        <FlatList
          data={parts}
          keyExtractor={item => item.id}
          renderItem={renderPart}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadParts(); }} colors={[C.navy]} tintColor={C.navy} />
          }
        />
      )}
    </View>
  );
}