import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Linking } from 'react-native';

const API_URL = 'https://trustee-resisting-reunite.ngrok-free.dev';

export default function Index() {
  const [search, setSearch] = useState('');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchCars = async () => {
    if (!search) return;
    setLoading(true);
    setCars([]);
    try {
      const response = await fetch(API_URL + '/search?q=' + encodeURIComponent(search), {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await response.json();
      setCars(data);

      data.forEach(async (car, index) => {
        if (car.price) {
          try {
            const evalResponse = await fetch(
              API_URL + '/evaluate?name=' + encodeURIComponent(car.name || '') + '&price=' + car.price,
              { headers: { 'ngrok-skip-browser-warning': 'true' } }
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

  const openCar = (link) => {
    if (link) Linking.openURL(link);
  };

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

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="نيسان باترول..."
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          placeholderTextColor="#555"
        />
        <TouchableOpacity style={styles.button} onPress={searchCars}>
          <Text style={styles.buttonText}>بحث</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF4D00" />
          <Text style={styles.loadingText}>جاري البحث...</Text>
        </View>
      )}

      <FlatList
        data={cars}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openCar(item.link)}>
            <Text style={styles.carName}>{item.name}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.evaluation, { color: getEvalColor(item.evaluation) }]}>
                {getEvalEmoji(item.evaluation)} {item.evaluation || 'جاري التحليل...'}
              </Text>
              <Text style={styles.carPrice}>AED {item.price?.toLocaleString()}</Text>
            </View>
            <Text style={styles.carCity}>📍 {item.city}</Text>
            <Text style={styles.tapHint}>اضغط لفتح الإعلان ←</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 20, paddingTop: 60 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#FF4D00', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 30, fontSize: 14 },
  searchBox: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1a1a2e', color: 'white', padding: 14, borderRadius: 12, fontSize: 15 },
  button: { backgroundColor: '#FF4D00', padding: 14, borderRadius: 12, justifyContent: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  loadingBox: { alignItems: 'center', marginBottom: 20 },
  loadingText: { color: '#888', marginTop: 10, fontSize: 13 },
  card: { backgroundColor: '#111118', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  carName: { color: 'white', fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  carPrice: { color: '#FF4D00', fontSize: 18, fontWeight: 'bold' },
  evaluation: { fontSize: 14, fontWeight: 'bold' },
  carCity: { color: '#888', fontSize: 13, textAlign: 'right', marginTop: 4 },
  tapHint: { color: '#444', fontSize: 11, textAlign: 'left', marginTop: 8 },
});