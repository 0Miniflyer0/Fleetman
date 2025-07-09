import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';

export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [form, setForm] = useState({ name: '', color: '', license: '', type: '', year: '', make: '', model: '', vin: '', mileage: '' });

  // Fetch vehicles from Firebase
  useEffect(() => {
    const db = getDatabase();
    const vehiclesRef = ref(db, 'fleetOne');
    const unsubscribe = onValue(vehiclesRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.values(data).map(vehicle => ({
          id: vehicle.id,
          name: vehicle.name,
          color: vehicle.color || 'N/A',
          license: vehicle.liciencePlate || 'N/A',
        }));
        setVehicles(loaded);
      } else {
        setVehicles([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter and sort vehicles
  const filteredVehicles = vehicles
    .filter(
      v =>
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.license?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a[sortKey] || '').localeCompare(b[sortKey] || ''));

  // Add or edit vehicle (now saves new vehicle to Firebase)
  const handleSave = async () => {
    if (!form.name || !form.color || !form.license || !form.type || !form.year || !form.make || !form.model || !form.vin || !form.mileage) {
      Alert.alert('All fields are required.');
      return;
    }
    const db = getDatabase();
    if (selectedVehicle) {
      // Local edit only (optional: implement Firebase update here)
      setVehicles(vehicles.map(v => (v.id === selectedVehicle.id ? { ...form, id: v.id } : v)));
      setSelectedVehicle(null);
    } else {
      // Add new vehicle to Firebase
      const newVehicleRef = push(ref(db, 'fleetOne'));
      const newVehicle = {
        id: newVehicleRef.key,
        name: form.name,
        type: form.type,
        liciencePlate: form.license,
        mileage: Number(form.mileage),
        year: Number(form.year),
        make: form.make,
        model: form.model,
        vin: form.vin,
        color: form.color,
        // No maintence field yet
      };
      await set(newVehicleRef, newVehicle);
    }
    setForm({ name: '', color: '', license: '', type: '', year: '', make: '', model: '', vin: '', mileage: '' });
    setModalVisible(false);
    setDetailModalVisible(false);
  };

  // Delete vehicle (local only, not deleted from Firebase)
  const handleDelete = id => {
    Alert.alert('Delete Vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setVehicles(vehicles.filter(v => v.id !== id));
          setDetailModalVisible(false);
        },
      },
    ]);
  };

  // Open detail modal
  const openDetail = vehicle => {
    setSelectedVehicle(vehicle);
    setForm(vehicle);
    setDetailModalVisible(true);
  };

  // Open add modal
  const openAdd = () => {
    setForm({ name: '', color: '', license: '', type: '', year: '', make: '', model: '', vin: '', mileage: '' });
    setSelectedVehicle(null);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search vehicles..."
        value={search}
        onChangeText={setSearch}
      />

      {/* Add Button */}
      <Button title="Add Vehicle" onPress={openAdd} />

      {/* Sort Options */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <Button title="Name" onPress={() => setSortKey('name')} />
        <Button title="Color" onPress={() => setSortKey('color')} />
        <Button title="License" onPress={() => setSortKey('license')} />
      </View>

      {/* Vehicle List */}
      <FlatList
        data={filteredVehicles}
        keyExtractor={item => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openDetail(item)}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.color}</Text>
            <Text style={styles.cell}>{item.license}</Text>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.headerCell]}>Name</Text>
            <Text style={[styles.cell, styles.headerCell]}>Color</Text>
            <Text style={[styles.cell, styles.headerCell]}>License</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChangeText={text => setForm({ ...form, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Type (e.g. Truck, Van, SUV)"
              value={form.type}
              onChangeText={text => setForm({ ...form, type: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Color"
              value={form.color}
              onChangeText={text => setForm({ ...form, color: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="License Plate"
              value={form.license}
              onChangeText={text => setForm({ ...form, license: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Year"
              value={form.year}
              keyboardType="numeric"
              onChangeText={text => setForm({ ...form, year: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Make"
              value={form.make}
              onChangeText={text => setForm({ ...form, make: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Model"
              value={form.model}
              onChangeText={text => setForm({ ...form, model: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="VIN"
              value={form.vin}
              onChangeText={text => setForm({ ...form, vin: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Mileage"
              value={form.mileage}
              keyboardType="numeric"
              onChangeText={text => setForm({ ...form, mileage: text })}
            />
            <View style={styles.modalButtonRow}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Save" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail/Edit Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vehicle Details</Text>
            <Text>Name: {form.name}</Text>
            <Text>Color: {form.color}</Text>
            <Text>License: {form.license}</Text>
            <View style={styles.modalButtonRow}>
              <Button
                title="Edit"
                onPress={() => {
                  setModalVisible(true);
                  setDetailModalVisible(false);
                }}
              />
              <Button
                title="Delete"
                color="red"
                onPress={() => handleDelete(selectedVehicle.id)}
              />
              <Button title="Close" onPress={() => setDetailModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sortLabel: { marginRight: 8, fontWeight: 'bold' },
  list: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    paddingVertical: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: { fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cell: { flex: 1, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
});