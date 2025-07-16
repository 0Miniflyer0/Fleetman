import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import { getDatabase, ref, onValue, push, set, get } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';
import '../firebase'; // Ensure Firebase is initialized

const COLORS = {
  primary: '#1A73E8',
  accent: '#34A853',
  warning: '#FBBC05',
  danger: '#EA4335',
  background: '#F4F6FB',
  card: '#FFFFFF',
  text: '#222B45',
  gray: '#888',
  darkBg: '#181a20',
  darkCard: '#23272f',
  darkText: '#f4f6fb',
};

export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [form, setForm] = useState({
    name: '',
    color: '',
    license: '',
    type: '',
    year: '',
    make: '',
    model: '',
    vin: '',
    mileage: '',
  });
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

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
    if (
      !form.name ||
      !form.color ||
      !form.license ||
      !form.type ||
      !form.year ||
      !form.make ||
      !form.model ||
      !form.vin ||
      !form.mileage
    ) {
      Alert.alert('All fields are required.');
      return;
    }
    const db = getDatabase();
    if (selectedVehicle) {
      // Update vehicle in Firebase
      const updatedVehicle = {
        id: selectedVehicle.id,
        name: form.name,
        type: form.type,
        liciencePlate: form.license,
        mileage: Number(form.mileage),
        year: Number(form.year),
        make: form.make,
        model: form.model,
        vin: form.vin,
        color: form.color,
      };
      await set(ref(db, `fleetOne/${selectedVehicle.id}`), updatedVehicle);
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
      };
      await set(newVehicleRef, newVehicle);
    }
    setForm({
      name: '',
      color: '',
      license: '',
      type: '',
      year: '',
      make: '',
      model: '',
      vin: '',
      mileage: '',
    });
    setModalVisible(false);
    setDetailModalVisible(false);
  };

  // Delete vehicle (from Firebase)
  const doDeleteVehicle = async vehicle => {
    if (!vehicle) return;
    const db = getDatabase();
    await set(ref(db, `fleetOne/${vehicle.id}`), null);
    setDetailModalVisible(false);
  };

  // Open detail modal
  const openDetail = async vehicle => {
    const db = getDatabase();
    const vehicleRef = ref(db, `fleetOne/${vehicle.id}`);
    const snapshot = await get(vehicleRef);
    if (snapshot.exists()) {
      const fullVehicle = snapshot.val();
      setSelectedVehicle(fullVehicle);
      setForm({
        name: fullVehicle.name || '',
        color: fullVehicle.color || '',
        license: fullVehicle.liciencePlate || '',
        type: fullVehicle.type || '',
        year: fullVehicle.year ? String(fullVehicle.year) : '',
        make: fullVehicle.make || '',
        model: fullVehicle.model || '',
        vin: fullVehicle.vin || '',
        mileage: fullVehicle.mileage ? String(fullVehicle.mileage) : '',
      });
    } else {
      setSelectedVehicle(vehicle);
      setForm(vehicle);
    }
    setDetailModalVisible(true);
  };

  // Open add modal
  const openAdd = () => {
    setForm({
      name: '',
      color: '',
      license: '',
      type: '',
      year: '',
      make: '',
      model: '',
      vin: '',
      mileage: '',
    });
    setSelectedVehicle(null);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, isDark && { backgroundColor: COLORS.darkBg }]}>
      {/* Logo Bar */}
      <View style={[styles.logoBar, isDark && { backgroundColor: COLORS.darkCard }]}>
        <Image
          source={require('../images/FleetMan_logo 1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={32} color={isDark ? COLORS.accent : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Title Bar */}
      <View style={[styles.titleBar, isDark && { backgroundColor: COLORS.darkCard }]}>
        <Text style={[styles.titleText, isDark && { color: COLORS.darkText }]}>Vehicle</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchRow, isDark && { backgroundColor: '#23272f' }]}>
        <MaterialIcons name="search" size={22} color={isDark ? COLORS.darkText : COLORS.gray} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchBar, isDark && { color: COLORS.darkText }]}
          placeholder="Search vehicles..."
          placeholderTextColor={isDark ? '#aaa' : COLORS.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Sort Dropdown */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <Pressable onPress={() => setSortKey('name')}>
          <Text style={[styles.sortOption, sortKey === 'name' && styles.sortActive]}>Name</Text>
        </Pressable>
        <Pressable onPress={() => setSortKey('color')}>
          <Text style={[styles.sortOption, sortKey === 'color' && styles.sortActive]}>Color</Text>
        </Pressable>
        <Pressable onPress={() => setSortKey('license')}>
          <Text style={[styles.sortOption, sortKey === 'license' && styles.sortActive]}>License</Text>
        </Pressable>
      </View>

      {/* Vehicle Cards */}
      <FlatList
        data={filteredVehicles}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, isDark && { backgroundColor: COLORS.darkCard }]} onPress={() => openDetail(item)}>
            <View style={styles.cardRow}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: item.color !== 'N/A' ? item.color : COLORS.gray },
                ]}
              />
              <Text style={[styles.cardTitle, isDark && { color: COLORS.darkText }]}>{item.name}</Text>
            </View>
            <Text style={[styles.cardSub, isDark && { color: COLORS.darkText }]}>
              License: <Text style={styles.license}>{item.license}</Text>
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={[styles.emptyText, isDark && { color: COLORS.darkText }]}>No vehicles found.</Text>}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, isDark && { backgroundColor: COLORS.primary }]} onPress={openAdd} accessibilityLabel="Add Vehicle">
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && { backgroundColor: COLORS.darkCard }]}>
            <Text style={[styles.modalTitle, isDark && { color: COLORS.primary }]}>
              {selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChangeText={text => setForm({ ...form, name: text })}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="Type (e.g. Truck, Van, SUV)"
              value={form.type}
              onChangeText={text => setForm({ ...form, type: text })}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="Color"
              value={form.color}
              onChangeText={text => setForm({ ...form, color: text })}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="License Plate"
              value={form.license}
              onChangeText={text => setForm({ ...form, license: text })}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="Year"
              value={form.year}
              keyboardType="numeric"
              onChangeText={text => setForm({ ...form, year: text })}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="Make"
              value={form.make}
              onChangeText={text => setForm({ ...form, make: text })}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="Model"
              value={form.model}
              onChangeText={text => setForm({ ...form, model: text })}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="VIN"
              value={form.vin}
              onChangeText={text => setForm({ ...form, vin: text })}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="Mileage"
              value={form.mileage}
              keyboardType="numeric"
              onChangeText={text => setForm({ ...form, mileage: text })}
              placeholderTextColor={COLORS.gray}
            />
            <View style={styles.modalButtonRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail/Edit Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && { backgroundColor: COLORS.darkCard }]}>
            <Text style={[styles.modalTitle, isDark && { color: COLORS.primary }]}>Vehicle Details</Text>
            <Text style={isDark && { color: COLORS.darkText }}>Name: {form.name}</Text>
            <Text style={isDark && { color: COLORS.darkText }}>Type: {form.type}</Text>
            <Text style={isDark && { color: COLORS.darkText }}>Color: {form.color}</Text>
            <Text style={isDark && { color: COLORS.darkText }}>License: {form.license}</Text>
            <Text style={isDark && { color: COLORS.darkText }}>Year: {form.year}</Text>
            <Text style={isDark && { color: COLORS.darkText }}>Make: {form.make}</Text>
            <Text style={isDark && { color: COLORS.darkText }}>Model: {form.model}</Text>
            <Text style={isDark && { color: COLORS.darkText }}>VIN: {form.vin}</Text>
            <Text style={isDark && { color: COLORS.darkText }}>Mileage: {form.mileage}</Text>
            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.saveBtn}
                onPress={() => {
                  setModalVisible(true);
                  setDetailModalVisible(false);
                }}
              >
                <Text style={styles.saveBtnText}>Edit</Text>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => {
                  setDeleteTarget(selectedVehicle);
                  setDeleteConfirmVisible(true);
                }}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }, isDark && { backgroundColor: COLORS.darkCard }]}>
            <Text style={{ fontWeight: 'bold', marginBottom: 16, color: isDark ? COLORS.darkText : COLORS.text }}>
              Are you sure you want to delete this vehicle?
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={async () => {
                  await doDeleteVehicle(deleteTarget);
                  setDeleteConfirmVisible(false);
                }}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
    width: 180,      // Increased size
    height: 72,      // Increased size
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
  header: {
    display: 'none', // Hide old header
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
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  sortLabel: { fontWeight: 'bold', color: COLORS.text, marginRight: 8 },
  sortOption: { color: COLORS.gray, marginRight: 12, fontWeight: '600' },
  sortActive: { color: COLORS.primary, textDecorationLine: 'underline' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 18,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  cardSub: { color: '#666', fontSize: 15 },
  license: { fontFamily: 'monospace', color: COLORS.primary },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: 40, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f7f7f7',
    color: COLORS.text,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  cancelBtnText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
  deleteBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});