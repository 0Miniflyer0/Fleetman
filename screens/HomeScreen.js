// screens/HomeScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');

  const handleSearchSubmit = () => {
    Alert.alert('Search Submitted', `You searched for: "${searchText}"`);
    Keyboard.dismiss();
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hey a search bar.</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search..."
        value={searchText}
        onChangeText={setSearchText}
        onSubmitEditing={handleSearchSubmit}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    width: '100%',
    maxWidth: 300,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
});
