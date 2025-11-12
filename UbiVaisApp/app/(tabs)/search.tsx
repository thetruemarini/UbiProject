// app/(tabs)/search.tsx
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Categorie popolari
  const categories = [
    { emoji: '🍕', name: 'Food', color: '#e74c3c' },
    { emoji: '🏛️', name: 'Cultura', color: '#9b59b6' },
    { emoji: '🏔️', name: 'Natura', color: '#27ae60' },
    { emoji: '🎢', name: 'Avventura', color: '#e67e22' },
    { emoji: '🌊', name: 'Mare', color: '#3498db' },
    { emoji: '🛍️', name: 'Shopping', color: '#f39c12' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Esplora</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca destinazioni, utenti..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Categorie Popolari</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.categoryCard, { backgroundColor: category.color }]}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Trending Destinations</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🔥 Lista destinazioni in arrivo...</Text>
        </View>

        <Text style={styles.sectionTitle}>Itinerari Consigliati</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>📍 Itinerari curati in arrivo...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
});