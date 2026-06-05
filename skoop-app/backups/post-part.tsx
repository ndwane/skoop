import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db, collection, addDoc } from '../firebase';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const C = {
  hdrBg: '#26215C', bg: '#F8F6FF', card: '#FFFFFF', cardBorder: '#E8E4FF',
  textPrimary: '#26215C', textSecondary: '#534AB7', textMuted: '#9B96CC',
  navy: '#534AB7', navyDark: '#26215C', tagBg: '#F0EEFF',
};

const CONDITIONS = [
  { id: 'new', label: 'جديد' },
  { id: 'like_new', label: 'شبه جديد' },
  { id: 'used', label: 'مستعمل' },
];

const CITIES = ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين', 'العين'];

export default function PostPart() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();

  const [partName, setPartName] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [condition, setCondition] = useState('used');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('دبي');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!partName.trim() || !carBrand.trim() || !price.trim() || !phone.trim()) {
      Alert.alert('', 'الرجاء تعبئة: اسم القطعة، السيارة المتوافقة، السعر، ورقم الجوال');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'parts'), {
        partName: partName.trim(),
        carBrand: carBrand.trim(),
        condition,
        price: parseInt(price) || 0,
        city,
        phone: phone.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      });
      Alert.alert('تم ✅', 'تم نشر قطعتك بنجاح!', [
        { text: 'تمام', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('خطأ', 'لم يتم النشر، حاول مرة أخرى');
    }
    setSaving(false);
  };

  const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { backgroundColor: C.hdrBg, paddingTop: insets.top + 8, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    label: { color: C.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: C.card, color: C.textPrimary, padding: 13, borderRadius: 12, fontSize: 14, borderWidth: 1, borderColor: C.cardBorder, textAlign: 'right' },
    pillsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    pill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
    pillOn: { backgroundColor: C.navyDark, borderColor: C.navyDark },
    pillText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
    pillTextOn: { color: '#fff', fontWeight: 'bold' },
    submitBtn: { backgroundColor: C.navyDark, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28, marginBottom: 40 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  });

  return (
    <View style={S.container}>
      <StatusBar backgroundColor={C.hdrBg} barStyle="light-content" />
      <View style={S.header}>
        <View style={{ width: 34 }} />
        <Text style={S.headerTitle}>نشر قطعة غيار</Text>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={S.label}>اسم القطعة *</Text>
        <TextInput style={S.input} placeholder="مثال: إطار، رينق، مساعد..." placeholderTextColor={C.textMuted} value={partName} onChangeText={setPartName} />

        <Text style={S.label}>السيارة المتوافقة *</Text>
        <TextInput style={S.input} placeholder="مثال: باترول 2015" placeholderTextColor={C.textMuted} value={carBrand} onChangeText={setCarBrand} />

        <Text style={S.label}>الحالة</Text>
        <View style={S.pillsRow}>
          {CONDITIONS.map(c => {
            const on = condition === c.id;
            return (
              <TouchableOpacity key={c.id} style={[S.pill, on && S.pillOn]} onPress={() => setCondition(c.id)}>
                <Text style={[S.pillText, on && S.pillTextOn]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={S.label}>السعر (درهم) *</Text>
        <TextInput style={S.input} placeholder="مثال: 300" placeholderTextColor={C.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />

        <Text style={S.label}>المدينة</Text>
        <View style={S.pillsRow}>
          {CITIES.map(c => {
            const on = city === c;
            return (
              <TouchableOpacity key={c} style={[S.pill, on && S.pillOn]} onPress={() => setCity(c)}>
                <Text style={[S.pillText, on && S.pillTextOn]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={S.label}>رقم الجوال *</Text>
        <TextInput style={S.input} placeholder="05x xxx xxxx" placeholderTextColor={C.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={S.label}>ملاحظات (اختياري)</Text>
        <TextInput style={[S.input, { height: 100, textAlignVertical: 'top' }]} placeholder="تفاصيل إضافية عن القطعة..." placeholderTextColor={C.textMuted} value={notes} onChangeText={setNotes} multiline />

        <TouchableOpacity style={S.submitBtn} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.submitText}>نشر القطعة 🚀</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}