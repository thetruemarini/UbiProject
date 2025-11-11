// app/(tabs)/index.tsx
import { WorldWave } from '@/components/world-wave';
import { useAuth } from '@/contexts/auth-context';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const { user, logout } = useAuth();

  // Redirect a login se non autenticato
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Se non c'è utente, non mostrare nulla (redirect in corso)
  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <WorldWave />
      <Text style={styles.title}>Benvenuto, {user.displayName}! 🎉</Text>
      <Text style={styles.subtitle}>Il tuo diario di viaggio personale</Text>

      <View style={styles.userInfo}>
        <Text style={styles.infoText}>📧 {user.email}</Text>
        <Text style={styles.infoText}>👤 @{user.username}</Text>
        <Text style={styles.infoText}>✈️ {user.postsCount} viaggi</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Crea il tuo primo viaggio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});