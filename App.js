import React from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import './firebaseConfig';
import { getDatabase, ref, set } from 'firebase/database';

// Screens
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/Vehicle';

const Tab = createBottomTabNavigator();

function FirebaseTestScreen() {
  const testFirebase = async () => {
    try {
      const db = getDatabase();
      await set(ref(db, 'test'), {
        timestamp: Date.now(),
        message: 'Hello from Fleetman!',
      });
      Alert.alert('✅ Firebase write succeeded!');
    } catch (e) {
      Alert.alert('❌ Firebase write failed: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Hello from Expo!</Text>
      <Button title="Test Firebase" onPress={testFirebase} />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Vehicle" component={SettingsScreen} />
        <Tab.Screen name="Maintence" component={FirebaseTestScreen} />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
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