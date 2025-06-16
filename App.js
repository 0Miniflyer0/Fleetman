import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';

export default function App() {
  const testFirebase = async () => {
    try {
      const db = getDatabase();
      await set(ref(db, 'test'), {
        timestamp: Date.now(),
        message: 'Hello from Fleetman!',
      });
      alert('Firebase write succeeded!');
    } catch (e) {
      alert('Firebase write failed: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Hello from Expo!</Text>
      <Button title="Press me" onPress={() => Alert.alert('Button pressed!')} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
