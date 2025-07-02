import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Dimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { getDatabase, ref, onValue } from 'firebase/database';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [reminders, setReminders] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const db = getDatabase();
    // Adjust the path if your fleet name is dynamic
    const vehiclesRef = ref(db, 'fleetOne');
    const unsubscribe = onValue(vehiclesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Flatten vehicles into reminders
        const loaded = Object.values(data).map(vehicle => ({
          id: vehicle.id,
          vehicle: vehicle.name,
          service: vehicle.maintence?.serviceHistory?.[vehicle.maintence?.serviceHistory.length - 1]?.details || 'N/A',
          due: vehicle.maintence?.nextServiceDue || 'N/A',
        }));
        setReminders(loaded);
      } else {
        setReminders([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredReminders = reminders
    .slice() // create a shallow copy to avoid mutating state
    .sort((a, b) => {
      // If either due is 'N/A', push it to the end
      if (a.due === 'N/A') return 1;
      if (b.due === 'N/A') return -1;
      // Compare as dates
      return new Date(a.due) - new Date(b.due);
    })
    .filter(
      r =>
        r.vehicle?.toLowerCase().includes(search.toLowerCase()) ||
        r.service?.toLowerCase().includes(search.toLowerCase()) ||
        r.due?.includes(search)
    )
    .slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Top Search/Filter Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search vehicle, service, or date..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Reminders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        <FlatList
          data={filteredReminders}
          keyExtractor={item => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.reminderRow}>
              <Text style={styles.reminderText}>{item.vehicle}</Text>
              <Text style={styles.reminderText}>{item.service}</Text>
              <Text style={styles.reminderText}>{item.due}</Text>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderText}>Vehicle</Text>
              <Text style={styles.reminderText}>Service</Text>
              <Text style={styles.reminderText}>Due Date</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.noReminders}>No reminders found.</Text>
          }
        />
      </View>

      {/* Dashboard Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <View style={styles.chartRow}>
          {/* Pie Chart */}
          <PieChart
            data={[
              {
                name: 'Empty',
                population: 1,
                color: '#cccccc',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
              },
            ]}
            width={screenWidth * 0.42}
            height={150}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            hasLegend={false}
          />
          {/* Line Chart */}
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              datasets: [
                {
                  data: [0, 0, 0, 0, 0],
                },
              ],
            }}
            width={screenWidth * 0.5}
            height={150}
            chartConfig={chartConfig}
            bezier
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
          />
        </View>
      </View>
    </View>
  );
}

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  searchBar: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    height: 36,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
    backgroundColor: '#ffffff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reminderText: {
    flex: 1,
    textAlign: 'center',
  },
  noReminders: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
});
