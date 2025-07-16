import React, { useState, useMemo } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import CustomBottomTabs from './navigation/bottomtabs';
import { ThemeContext } from './ThemeContext';
import './firebase'; // Ensure Firebase is initialized

export default function App() {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(systemScheme === 'dark' ? 'dark' : 'light');
  const themeObj = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return (
    <ThemeContext.Provider value={themeObj}>
      <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <CustomBottomTabs />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}