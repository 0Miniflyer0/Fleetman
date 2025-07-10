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
import { getDatabase, ref, onValue, update } from 'firebase/database';

export default function MaintenanceScreen() {
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('vehicle');
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [form, setForm] = useState({ vehicle: '', service: '', mileage: '', date: '' });
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState({ record: null, index: null });

    // Fetch vehicles from Firebase
    useEffect(() => {
        const db = getDatabase();
        const vehiclesRef = ref(db, 'fleetOne');
        const unsubscribe = onValue(vehiclesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Flatten vehicles into records for display
                const loaded = Object.values(data).map(vehicle => {
                    // Sort serviceHistory by date descending (most recent first)
                    const history = Array.isArray(vehicle.maintence?.serviceHistory)
                        ? [...vehicle.maintence.serviceHistory].sort((a, b) => b.date.localeCompare(a.date))
                        : [];
                    return {
                        id: vehicle.id,
                        dbKey: Object.keys(data).find(key => data[key].id === vehicle.id),
                        vehicle: vehicle.name,
                        service: history[0]?.details || 'N/A',
                        mileage: vehicle.mileage?.toString() || 'N/A',
                        serviceHistory: history,
                    };
                });
                setRecords(loaded);
            } else {
                setRecords([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Filter and sort records
    const filteredRecords = records
        .filter(
            r =>
                r.vehicle?.toLowerCase().includes(search.toLowerCase()) ||
                r.service?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a[sortKey]?.localeCompare(b[sortKey]));

    // Add or edit maintenance record in Firebase
    const handleSave = async () => {
        if (!form.vehicle || !form.service || !form.mileage || !form.date) {
            Alert.alert('All fields are required.');
            return;
        }
        const db = getDatabase();
        const vehicle = records.find(r => r.vehicle === form.vehicle);
        if (!vehicle) {
            Alert.alert('Vehicle not found.');
            return;
        }
        const dbKey = vehicle.dbKey;
        let serviceHistory = Array.isArray(vehicle.serviceHistory) ? [...vehicle.serviceHistory] : [];

        if (selectedRecord && selectedRecord.editIndex !== undefined) {
            // Edit the selected record by index
            serviceHistory[selectedRecord.editIndex] = {
                date: form.date,
                details: form.service,
            };
        } else {
            // Add new record
            serviceHistory.push({
                date: form.date,
                details: form.service,
            });
        }

        // Sort serviceHistory by date descending after edit/add
        serviceHistory = serviceHistory.sort((a, b) => b.date.localeCompare(a.date));

        // Update serviceHistory and lastServiceDate in maintence
        await update(ref(db, `fleetOne/${dbKey}/maintence`), {
            serviceHistory,
            lastServiceDate: serviceHistory[0]?.date || form.date,
        });
        // Update mileage in the vehicle root (not inside maintence)
        await update(ref(db, `fleetOne/${dbKey}`), {
            mileage: Number(form.mileage),
        });
        setForm({ vehicle: '', service: '', mileage: '', date: '' });
        setModalVisible(false);
        setDetailModalVisible(false);
    };

    // Delete record (local only, not deleted from Firebase)
    const handleDelete = id => {
        Alert.alert('Delete Record', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setRecords(records.filter(r => r.id !== id));
                    setDetailModalVisible(false);
                },
            },
        ]);
    };

    // Open detail modal
    const openDetail = record => {
        setSelectedRecord(record);
        setForm({
            vehicle: record.vehicle,
            service: record.service,
            mileage: record.mileage,
            date: record.serviceHistory?.[0]?.date || '',
        });
        setDetailModalVisible(true);
    };

    // Open add modal
    const openAdd = () => {
        setForm({ vehicle: '', service: '', mileage: '', date: '' });
        setSelectedRecord(null);
        setModalVisible(true);
    };

    // Open edit modal for a specific maintenance record
    const openEditMaintenance = (record, item, index) => {
        setSelectedRecord({ ...record, editIndex: index });
        setForm({
            vehicle: record.vehicle,
            service: item.details,
            mileage: record.mileage,
            date: item.date,
        });
        setModalVisible(true);
        setDetailModalVisible(false);
    };

    const doDeleteMaintenance = async (record, index) => {
        if (!record) return;
        const db = getDatabase();
        const dbKey = record.dbKey;
        let updatedHistory = [...(record.serviceHistory || [])];
        updatedHistory.splice(index, 1);

        // Update Firebase
        await update(ref(db, `fleetOne/${dbKey}/maintence`), {
            serviceHistory: updatedHistory,
            lastServiceDate: updatedHistory[0]?.date || '',
        });

        // Update local state and selectedRecord for modal
        setRecords(prev =>
            prev.map(r =>
                r.id === record.id
                    ? {
                          ...r,
                          serviceHistory: updatedHistory,
                          service: updatedHistory[0]?.details || 'N/A',
                      }
                    : r
            )
        );

        setSelectedRecord(prev =>
            prev
                ? {
                      ...prev,
                      serviceHistory: updatedHistory,
                      service: updatedHistory[0]?.details || 'N/A',
                  }
                : prev
        );

        if (index === 0) {
            setForm(form => ({
                ...form,
                service: updatedHistory[0]?.details || '',
                date: updatedHistory[0]?.date || '',
            }));
        }
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <TextInput
                style={styles.searchBar}
                placeholder="Search maintenance records..."
                value={search}
                onChangeText={setSearch}
            />

            {/* Add Button */}
            <Button title="Add Maintenance Record" onPress={openAdd} />

            {/* Sort Options */}
            <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <Button title="Vehicle" onPress={() => setSortKey('vehicle')} />
                <Button title="Service" onPress={() => setSortKey('service')} />
                <Button title="Mileage" onPress={() => setSortKey('mileage')} />
            </View>

            {/* Maintenance List */}
            <FlatList
                data={filteredRecords}
                keyExtractor={item => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} onPress={() => openDetail(item)}>
                        <Text style={styles.cell}>{item.vehicle}</Text>
                        <Text style={styles.cell}>{item.service}</Text>
                        <Text style={styles.cell}>{item.mileage}</Text>
                    </TouchableOpacity>
                )}
                ListHeaderComponent={
                    <View style={styles.headerRow}>
                        <Text style={[styles.cell, styles.headerCell]}>Vehicle</Text>
                        <Text style={[styles.cell, styles.headerCell]}>Service Type</Text>
                        <Text style={[styles.cell, styles.headerCell]}>Mileage</Text>
                    </View>
                }
            />

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedRecord ? 'Edit Record' : 'Add Maintenance Record'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Vehicle"
                            value={form.vehicle}
                            onChangeText={text => setForm({ ...form, vehicle: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Service Type"
                            value={form.service}
                            onChangeText={text => setForm({ ...form, service: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Mileage"
                            value={form.mileage}
                            keyboardType="numeric"
                            onChangeText={text => setForm({ ...form, mileage: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Date (YYYY-MM-DD)"
                            value={form.date}
                            onChangeText={text => setForm({ ...form, date: text })}
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
                        <Text style={styles.modalTitle}>Maintenance Details</Text>
                        <Text>Vehicle: {form.vehicle}</Text>
                        <Text>Service: {form.service}</Text>
                        <Text>Mileage: {form.mileage}</Text>
                        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Service History:</Text>
                        <FlatList
                            data={selectedRecord?.serviceHistory || []}
                            keyExtractor={(_, idx) => idx.toString()}
                            renderItem={({ item, index }) => (
                                <View style={{ marginBottom: 6 }}>
                                    <Text>Date: {item.date}</Text>
                                    <Text>Service: {item.details}</Text>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Button
                                            title="Edit"
                                            onPress={() => openEditMaintenance(selectedRecord, item, index)}
                                        />
                                        <Button
                                            title="Delete"
                                            color="red"
                                            onPress={() => {
                                                setDeleteTarget({ record: selectedRecord, index });
                                                setDeleteConfirmVisible(true);
                                            }}
                                        />
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text>No previous maintenance records.</Text>}
                        />
                        <View style={styles.modalButtonRow}>
                            <Button title="Close" onPress={() => setDetailModalVisible(false)} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteConfirmVisible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { alignItems: 'center' }]}>
            <Text style={{ fontWeight: 'bold', marginBottom: 16 }}>
                Are you sure you want to delete this maintenance record?
            </Text>
            <View style={styles.modalButtonRow}>
                <Button
                    title="Cancel"
                    onPress={() => setDeleteConfirmVisible(false)}
                />
                <Button
                    title="Delete"
                    color="red"
                    onPress={async () => {
                        await doDeleteMaintenance(deleteTarget.record, deleteTarget.index);
                        setDeleteConfirmVisible(false);
                    }}
                />
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