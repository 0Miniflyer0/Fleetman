import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VehiclesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicles</Text>
      <Text>This is where fleet vehicles will go.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});