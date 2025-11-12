// app/(tabs)/itineraries.tsx
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ItinerariesScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'saved' | 'created'>('saved');

  const handleCreateItinerary = () => {
    Alert.alert(
      'Crea Itinerario 🗺️',
      'Qui potrai creare un nuovo itinerario selezionando i box attività dai post salvati'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>I Miei Itinerari</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateItinerary}>
          <Text style={styles.createButtonText}>+ Nuovo</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}>
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Salvati
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.tabActive]}
          onPress={() => setActiveTab('created')}>
          <Text style={[styles.tabText, activeTab === 'created' && styles.tabTextActive]}>
            Creati da me
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'saved' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Nessun itinerario salvato</Text>
            <Text style={styles.emptyText}>
              Inizia a salvare i post che ti piacciono e crea il tuo itinerario perfetto!
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>Crea il tuo primo itinerario</Text>
            <Text style={styles.emptyText}>
              Seleziona i box attività dai post e componili nel tuo itinerario personalizzato
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleCreateItinerary}>
              <Text style={styles.ctaButtonText}>Inizia Ora</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Placeholder per itinerari futuri */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>🚀 Coming Soon</Text>
          <Text style={styles.placeholderText}>
            • Timeline interattiva degli itinerari{'\n'}
            • Drag & drop per riordinare attività{'\n'}
            • Calcolo automatico durata totale{'\n'}
            • Visualizzazione su mappa{'\n'}
            • Export e condivisione
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  createButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 22,
  },
});