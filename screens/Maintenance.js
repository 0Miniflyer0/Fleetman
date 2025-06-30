import React, { useState } from 'react';
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

const initialRecords = [
    { id: '1', vehicle: 'Truck 1', service: 'Oil Change', mileage: '12000' },
    { id: '2', vehicle: 'Van 2', service: 'Tire Rotation', mileage: '8000' },
    { id: '3', vehicle: 'Car 3', service: 'Brake Inspection', mileage: '15000' },
];

export default function MaintenanceScreen() {
    const [records, setRecords] = useState(initialRecords);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('vehicle');
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [form, setForm] = useState({ vehicle: '', service: '', mileage: '' });

    // Filter and sort records
    const filteredRecords = records
        .filter(
            r =>
                r.vehicle.toLowerCase().includes(search.toLowerCase()) ||
                r.service.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a[sortKey].localeCompare(b[sortKey]));

    // Add or edit record
    const handleSave = () => {
        if (!form.vehicle || !form.service || !form.mileage) {
            Alert.alert('All fields are required.');
            return;
        }
        if (selectedRecord) {
            setRecords(records.map(r => (r.id === selectedRecord.id ? { ...form, id: r.id } : r)));
            setSelectedRecord(null);
        } else {
            setRecords([...records, { ...form, id: Date.now().toString() }]);
        }
        setForm({ vehicle: '', service: '', mileage: '' });
        setModalVisible(false);
        setDetailModalVisible(false);
    };

    // Delete record
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
        setForm(record);
        setDetailModalVisible(true);
    };

    // Open add modal
    const openAdd = () => {
        setForm({ vehicle: '', service: '', mileage: '' });
        setSelectedRecord(null);
        setModalVisible(true);
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
                                onPress={() => handleDelete(selectedRecord.id)}
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