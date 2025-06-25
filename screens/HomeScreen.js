// screens/HomeScreen.js
import React from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is the homepage </Text>
      <Button title="Press me" onPress={() => Alert.alert('Dang it (finally) worked.')} />
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
