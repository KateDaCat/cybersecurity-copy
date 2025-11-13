// src/screens/PreviewScreen.js
import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import ScannerOverlay from '../screens/components/ScannerOverlay'; // ✅ correct path
import { MOCK_IDENTIFY_RESULT } from '../data/mockPlants';

// const API_BASE = 'http://localhost:3000';
const API_BASE = 'http://10.0.2.2:3000';
const LOW_CONFIDENCE_THRESHOLD = 60;

export default function PreviewScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { uri, source, exif } = route.params ?? {};
  const [loading, setLoading] = useState(false);

  if (!uri) {
    return (
      <SafeAreaView style={s.center}>
        <Text>No image to preview.</Text>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.btn}>
          <Text style={s.btnTxt}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const onDone = async () => {
    try {
      setLoading(true);

      const form = new FormData();
      form.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' });

      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: form,
      });

      if (!res.ok) throw new Error(`Identify failed: ${res.status}`);
      const data = await res.json();

      // Match your backend's response structure
      // (from your latest test result)
      const result = {
        plantName: data.primary.species_name,
        confidence: data.primary.confidence * 100,
        lowConfidence: data.primary.unsure,
        photoUri: `${API_BASE}${data.primary.image_path}`,
        uploadedBy: "You",
        uploadDate: new Date(data.created_at).toLocaleString(),
        region: "—",
        locationName: "—",
        conservationStatus: "Unknown",
      };

      nav.replace("Result", result);
    } catch (e) {
      console.warn(e);
      Alert.alert("Scan failed", "Could not analyze the photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ SafeAreaView keeps header clear of the notch/camera
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* background image */}
      <Image source={{ uri }} style={s.img} resizeMode="contain" />

      {/* overlay layer (header + meta) */}
      <View style={s.overlay}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.topBtn}>
            <Text style={s.topTxt}>Back</Text>
          </TouchableOpacity>

        <Text style={s.topTitle}>Preview</Text>

          <TouchableOpacity onPress={onDone} style={[s.topBtn, s.doneBtn]}>
            <Text style={s.doneTxt}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={s.meta}>
          <Text style={s.metaTxt}>Source: {source || 'unknown'}</Text>
          {exif?.GPSLatitude && exif?.GPSLongitude && (
            <Text style={s.metaTxt}>EXIF GPS: {exif.GPSLatitude} , {exif.GPSLongitude}</Text>
          )}
        </View>
      </View>

      {loading && <ScannerOverlay label="Scanning plant…" />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },

  // image behind everything
  img: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },

  // header & footer overlay
  overlay: { flex: 1, justifyContent: 'space-between' },

  // header bar (no manual marginTop now; SafeAreaView handles it)
  topBar: {
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBtn: { padding: 8 },
  topTxt: { color: '#9ad3a5', fontWeight: '700' },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBtn: { backgroundColor: '#6DAF7A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  doneTxt: { color: '#fff', fontWeight: '800' },

  meta: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 12 },
  metaTxt: { color: '#fff' },

  btn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#6DAF7A', borderRadius: 8 },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
