import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import VehicleScreen from '../screens/Vehicle';
import MaintenanceScreen from '../screens/Maintenance';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  return (
    <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        let icon;
        if (route.name === 'Home') {
          icon = <MaterialIcons name="home" size={28} color={isFocused ? '#1A73E8' : '#888'} />;
        } else if (route.name === 'Vehicle') {
          icon = <MaterialCommunityIcons name="car-multiple" size={28} color={isFocused ? '#1A73E8' : '#888'} />;
        } else if (route.name === 'Maintenance') {
          icon = <MaterialIcons name="build" size={28} color={isFocused ? '#1A73E8' : '#888'} />;
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            {icon}
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive, isDark && styles.tabLabelDark]}>
              {label}
            </Text>
            {isFocused && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function CustomBottomTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vehicle" component={VehicleScreen} />
      <Tab.Screen name="Maintenance" component={MaintenanceScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabBarDark: {
    backgroundColor: '#23272f',
    marginTop: -18,
    paddingTop: 26, // 8 + 18 to compensate for the negative margin
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#1A73E8',
  },
  tabLabelDark: {
    color: '#bbb',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1A73E8',
  },
});