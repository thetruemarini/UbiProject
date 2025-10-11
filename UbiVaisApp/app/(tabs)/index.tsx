
import { WorldWave } from "@/components/world-wave";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  // pressed button function 
  const handlePress = () => {
    Alert.alert("Benvenuto!", "Presto potrai creare il tuo primo viaggio! 🚀");
  };
  return (
    <View style={styles.container}>
      <WorldWave />
      <Text style={styles.title}>UniVais</Text>
      <Text style={styles.subtitle}>Il tuo diario di viaggio personale</Text>

      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Crea il tuo primo viaggio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
});