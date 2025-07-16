import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { getDatabase, ref, onValue } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';
import '../firebase'; // Ensure Firebase is initialized

const screenWidth = Dimensions.get('window').width;
const CHART_CARD_MARGIN = 12;
const CHART_CARD_WIDTH = Math.min(screenWidth - CHART_CARD_MARGIN * 2, 400);

const COLORS = {
  primary: '#1A73E8',
  moon: '#FBBC05',
  accent: '#FF9100',
  danger: '#EA4335',
  background: '#F4F6FB',
  card: '#FFFFFF',
  text: '#222B45',
  gray: '#888',
  darkBg: '#181a20',
  darkCard: '#23272f',
  darkText: '#f4f6fb',
};

export default function HomeScreen() {
  const [reminders, setReminders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  React.useEffect(() => {
    setLoading(true);
    const db = getDatabase();
    const vehiclesRef = ref(db, 'fleetOne');
    const unsubscribe = onValue(vehiclesRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.values(data)
          .map(vehicle => ({
            id: vehicle.id,
            vehicle: vehicle.name,
            nextServiceType: vehicle.maintence?.nextServiceType || 'N/A',
            nextServiceDate: vehicle.maintence?.nextServiceDate || 'N/A',
          }))
          .filter(reminder => reminder.nextServiceDate !== 'N/A');
        setReminders(loaded);
      } else {
        setReminders([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredReminders = reminders
    .slice()
    .sort((a, b) => {
      if (a.nextServiceDate === 'N/A') return 1;
      if (b.nextServiceDate === 'N/A') return -1;
      return new Date(a.nextServiceDate) - new Date(b.nextServiceDate);
    })
    .filter(
      r =>
        r.vehicle?.toLowerCase().includes(search.toLowerCase()) ||
        r.nextServiceType?.toLowerCase().includes(search.toLowerCase()) ||
        r.nextServiceDate?.includes(search)
    )
    .slice(0, 5);

  // Example chart data (replace with real data as needed)
  const pieData = [
    {
      name: 'On Time',
      population: 7,
      color: COLORS.primary,
      legendFontColor: isDark ? COLORS.darkText : COLORS.text,
      legendFontSize: 13,
    },
    {
      name: 'Due Soon',
      population: 3,
      color: COLORS.accent,
      legendFontColor: isDark ? COLORS.darkText : COLORS.text,
      legendFontSize: 13,
    },
    {
      name: 'Overdue',
      population: 1,
      color: COLORS.danger,
      legendFontColor: isDark ? COLORS.darkText : COLORS.text,
      legendFontSize: 13,
    },
  ];

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        data: [2, 4, 3, 5, 6],
        color: () => COLORS.primary,
        strokeWidth: 2,
      },
    ],
    legend: ['Services This Week'],
  };

  // Toast helper
  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <ScrollView style={[styles.container, isDark && { backgroundColor: COLORS.darkBg }]} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Logo Bar */}
      <View style={[styles.logoBar, isDark && { backgroundColor: COLORS.darkCard }]}>
        <Image
          source={require('../images/FleetMan_logo 1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.7}>
          <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={32} color={isDark ? COLORS.moon : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Title Bar */}
      <View style={[styles.titleBar, isDark && { backgroundColor: COLORS.darkCard }]}>
        <Text style={[styles.titleText, isDark && { color: COLORS.darkText }]}>Home</Text>
      </View>

      {/* Top Search/Filter Bar */}
      <View style={[styles.searchRow, isDark && { backgroundColor: '#23272f' }]}>
        <MaterialIcons name="search" size={22} color={isDark ? COLORS.darkText : COLORS.gray} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchBar, isDark && { color: COLORS.darkText }]}
          placeholder="Search vehicle, service, or date..."
          placeholderTextColor={isDark ? '#aaa' : COLORS.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Reminders Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && { color: COLORS.accent }]}>Reminders</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
        ) : (
          <FlatList
            data={filteredReminders}
            keyExtractor={item => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.reminderRow, isDark && { backgroundColor: COLORS.darkCard }]}>
                <Text style={[styles.reminderText, isDark && { color: COLORS.darkText }]}>{item.vehicle}</Text>
                <Text style={[styles.reminderText, isDark && { color: COLORS.darkText }]}>{item.nextServiceType}</Text>
                <Text style={[styles.reminderText, isDark && { color: COLORS.darkText }]}>{item.nextServiceDate}</Text>
              </View>
            )}
            ListHeaderComponent={
              <View style={[styles.reminderHeader, isDark && { backgroundColor: '#23272f' }]}>
                <Text style={[styles.reminderText, isDark && { color: COLORS.darkText }]}>Vehicle</Text>
                <Text style={[styles.reminderText, isDark && { color: COLORS.darkText }]}>Upcoming Service</Text>
                <Text style={[styles.reminderText, isDark && { color: COLORS.darkText }]}>Due Date</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 32 }}>
                <MaterialIcons name="event-busy" size={48} color={COLORS.gray} style={{ marginBottom: 8 }} />
                <Text style={[styles.noReminders, isDark && { color: COLORS.darkText }]}>No upcoming maintenance found.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Dashboard Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && { color: COLORS.accent }]}>Dashboard</Text>
        {/* Pie Chart Card */}
        <View style={[styles.chartCard, isDark && { backgroundColor: COLORS.darkCard }]}>
          <Text style={[styles.chartTitle, isDark && { color: COLORS.darkText }]}>Fleet Status</Text>
          <PieChart
            data={pieData}
            width={CHART_CARD_WIDTH}
            height={180}
            chartConfig={chartConfig(isDark)}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            hasLegend={true}
            center={[0, 0]}
            absolute
            style={styles.chart}
          />
        </View>
        {/* Line Chart Card */}
        <View style={[styles.chartCard, isDark && { backgroundColor: COLORS.darkCard }]}>
          <Text style={[styles.chartTitle, isDark && { color: COLORS.darkText }]}>Services This Week</Text>
          <LineChart
            data={lineData}
            width={CHART_CARD_WIDTH}
            height={180}
            chartConfig={chartConfig(isDark)}
            bezier
            style={[styles.chart, { borderRadius: 12 }]}
            withDots
            withInnerLines
            withOuterLines={false}
            fromZero
          />
        </View>
      </View>

      {/* Toast */}
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const chartConfig = isDark => ({
  backgroundGradientFrom: isDark ? '#23272f' : '#ffffff',
  backgroundGradientTo: isDark ? '#23272f' : '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
  labelColor: (opacity = 1) => (isDark ? '#f4f6fb' : '#505050'),
  propsForLabels: {
    fontSize: 12,
  },
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#1A73E8',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  logoBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 32,
    paddingBottom: 8,
    paddingLeft: 18,
    backgroundColor: COLORS.card,
    position: 'relative',
  },
  logo: {
    width: 180,
    height: 72,
    marginBottom: 0,
  },
  themeToggle: {
    position: 'absolute',
    right: 18,
    top: 32,
    padding: 4,
  },
  titleBar: {
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9eef6',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: COLORS.text,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.primary,
  },
  list: { flex: 1 },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#dcdcdc',
    padding: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reminderText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 15,
  },
  noReminders: {
    textAlign: 'center',
    color: COLORS.gray,
    marginTop: 20,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  chartTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  chart: {
    alignSelf: 'center',
    width: '100%',
    minWidth: 0,
  },
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toastText: {
    backgroundColor: COLORS.accent,
    color: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    fontWeight: 'bold',
    fontSize: 16,
    elevation: 4,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});