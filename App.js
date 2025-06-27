// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

// Screens
import HomeScreen from './screens/HomeScreen';
import MaintenanceScreen from './screens/MaintenanceScreen'; 
import VehiclesScreen from './screens/VehiclesScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Vehicles" component={VehiclesScreen} />
        <Tab.Screen name="Maintenance" component={MaintenanceScreen} /> 
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
