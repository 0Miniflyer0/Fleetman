import React from 'react';
import { View, Text, Button } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>This is the vehicle page</Text>
      <Button title="Another Button" onPress={() => alert('Settings Button!')} />
    </View>



  );
}