import React from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Top Search/Filter Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchText}>🔍 Search...</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.content}>
        {/* Reminders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>

          <View style={styles.reminderHeader}>
            <Text style={styles.reminderText}>Vehicle</Text>
            <Text style={styles.reminderText}>S.Type</Text>
            <Text style={styles.reminderText}>Miles</Text>
          </View>

          <View style={styles.reminderRow}>
            <Text style={styles.reminderText}>Truck 01</Text>
            <Text style={styles.reminderText}>Oil</Text>
            <Text style={styles.reminderText}>500</Text>
          </View>

          <View style={styles.reminderRow}>
            <Text style={styles.reminderText}>Van 07</Text>
            <Text style={styles.reminderText}>Tires</Text>
            <Text style={styles.reminderText}>1200</Text>
          </View>

          <View style={styles.reminderRow}>
            <Text style={styles.reminderText}>SUV 12</Text>
            <Text style={styles.reminderText}>Brakes</Text>
            <Text style={styles.reminderText}>800</Text>
          </View>
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
      </ScrollView>
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
  searchText: {
    color: '#666',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
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
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
});
