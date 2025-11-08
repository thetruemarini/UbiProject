// app/(tabs)/index.tsx - VERSIONE TEST
import { WorldWave } from "@/components/world-wave";
import AuthService from "@/services/auth.service";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSignUp = async () => {
    if (!email || !password || !username || !displayName) {
      Alert.alert("Errore", "Compila tutti i campi");
      return;
    }

    const result = await AuthService.signUp(email, password, username, displayName);
    
    if (result.success) {
      Alert.alert("Successo! 🎉", `Benvenuto ${result.user?.displayName}!`);
    } else {
      Alert.alert("Errore", result.error);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Errore", "Inserisci email e password");
      return;
    }

    const result = await AuthService.signIn(email, password);
    
    if (result.success) {
      Alert.alert("Login effettuato! 🚀", `Bentornato ${result.user?.displayName}!`);
    } else {
      Alert.alert("Errore", result.error);
    }
  };

  return (
    <View style={styles.container}>
      <WorldWave />
      <Text style={styles.title}>UbiVais</Text>
      <Text style={styles.subtitle}>Test Firebase Setup</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          placeholder="Nome completo"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Registrati</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d2d52ff",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#008a94ff",
    marginBottom: 30,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    backgroundColor: "#fff",
    color: "#000000ff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: "#2ecc71",
  },
  buttonText: {
    fontSize: 16,
    color: "#ffffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
});