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
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';
import '../firebase'; // Ensure Firebase is initialized

const COLORS = {
    primary: '#1A73E8',
    accent: '#FBBC05',
    danger: '#EA4335',
    background: '#F4F6FB',
    card: '#FFFFFF',
    text: '#222B45',
    gray: '#888',
    darkBg: '#181a20',
    darkCard: '#23272f',
    darkText: '#f4f6fb',
};

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

    const { theme, toggleTheme } = useContext(ThemeContext);
    const isDark = theme === 'dark';

    // Fetch vehicles from Firebase
    useEffect(() => {
        const db = getDatabase();
        const vehiclesRef = ref(db, 'fleetOne');
        const unsubscribe = onValue(vehiclesRef, snapshot => {
            const data = snapshot.val();
            if (data) {
                const loaded = Object.values(data).map(vehicle => {
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
            serviceHistory[selectedRecord.editIndex] = {
                date: form.date,
                details: form.service,
            };
        } else {
            serviceHistory.push({
                date: form.date,
                details: form.service,
            });
        }

        serviceHistory = serviceHistory.sort((a, b) => b.date.localeCompare(a.date));

        await update(ref(db, `fleetOne/${dbKey}/maintence`), {
            serviceHistory,
            lastServiceDate: serviceHistory[0]?.date || form.date,
        });
        await update(ref(db, `fleetOne/${dbKey}`), {
            mileage: Number(form.mileage),
        });
        setForm({ vehicle: '', service: '', mileage: '', date: '' });
        setModalVisible(false);
        setDetailModalVisible(false);
    };

    // Delete maintenance record from Firebase
    const doDeleteMaintenance = async (record, index) => {
        if (!record) return;
        const db = getDatabase();
        const dbKey = record.dbKey;
        let updatedHistory = [...(record.serviceHistory || [])];
        updatedHistory.splice(index, 1);

        await update(ref(db, `fleetOne/${dbKey}/maintence`), {
            serviceHistory: updatedHistory,
            lastServiceDate: updatedHistory[0]?.date || '',
        });

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
                <Text style={[styles.titleText, isDark && { color: COLORS.darkText }]}>Maintenance</Text>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchRow, isDark && { backgroundColor: '#23272f' }]}>
                <MaterialIcons name="search" size={22} color={isDark ? COLORS.darkText : COLORS.gray} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchBar, isDark && { color: COLORS.darkText }]}
                    placeholder="Search maintenance records..."
                    placeholderTextColor={isDark ? '#aaa' : COLORS.gray}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Sort Dropdown */}
            <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <Pressable onPress={() => setSortKey('vehicle')}>
                    <Text style={[styles.sortOption, sortKey === 'vehicle' && styles.sortActive]}>Vehicle</Text>
                </Pressable>
                <Pressable onPress={() => setSortKey('service')}>
                    <Text style={[styles.sortOption, sortKey === 'service' && styles.sortActive]}>Service</Text>
                </Pressable>
                <Pressable onPress={() => setSortKey('mileage')}>
                    <Text style={[styles.sortOption, sortKey === 'mileage' && styles.sortActive]}>Mileage</Text>
                </Pressable>
            </View>

            {/* Maintenance Cards */}
            <FlatList
                data={filteredRecords}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.card, isDark && { backgroundColor: COLORS.darkCard }]} onPress={() => openDetail(item)}>
                        <View style={styles.cardRow}>
                            <MaterialIcons name="directions-car" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.cardTitle, isDark && { color: COLORS.darkText }]}>{item.vehicle}</Text>
                        </View>
                        <Text style={[styles.cardSub, isDark && { color: COLORS.darkText }]}>
                            Service: <Text style={{ color: COLORS.accent }}>{item.service}</Text>
                        </Text>
                        <Text style={[styles.cardSub, isDark && { color: COLORS.darkText }]}>
                            Mileage: <Text style={{ color: COLORS.primary }}>{item.mileage}</Text>
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={[styles.emptyText, isDark && { color: COLORS.darkText }]}>No maintenance records found.</Text>}
            />

            {/* Floating Action Button */}
            <TouchableOpacity style={[styles.fab, isDark && { backgroundColor: COLORS.accent }]} onPress={openAdd} accessibilityLabel="Add Maintenance Record">
                <MaterialIcons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: COLORS.darkCard }]}>
                        <Text style={[styles.modalTitle, isDark && { color: COLORS.accent }]}>
                            {selectedRecord ? 'Edit Record' : 'Add Maintenance Record'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Vehicle"
                            value={form.vehicle}
                            onChangeText={text => setForm({ ...form, vehicle: text })}
                            placeholderTextColor={COLORS.gray}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Service Type"
                            value={form.service}
                            onChangeText={text => setForm({ ...form, service: text })}
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
                        <TextInput
                            style={styles.input}
                            placeholder="Date (YYYY-MM-DD)"
                            value={form.date}
                            onChangeText={text => setForm({ ...form, date: text })}
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
                        <Text style={[styles.modalTitle, isDark && { color: COLORS.accent }]}>Maintenance Details</Text>
                        <Text style={isDark && { color: COLORS.darkText }}>Vehicle: {form.vehicle}</Text>
                        <Text style={isDark && { color: COLORS.darkText }}>Service: {form.service}</Text>
                        <Text style={isDark && { color: COLORS.darkText }}>Mileage: {form.mileage}</Text>
                        <Text style={{ marginTop: 10, fontWeight: 'bold', color: isDark ? COLORS.darkText : COLORS.text }}>Service History:</Text>
                        <FlatList
                            data={selectedRecord?.serviceHistory || []}
                            keyExtractor={(_, idx) => idx.toString()}
                            renderItem={({ item, index }) => (
                                <View style={{ marginBottom: 6 }}>
                                    <Text style={isDark && { color: COLORS.darkText }}>Date: {item.date}</Text>
                                    <Text style={isDark && { color: COLORS.darkText }}>Service: {item.details}</Text>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Pressable
                                            style={styles.saveBtn}
                                            onPress={() => openEditMaintenance(selectedRecord, item, index)}
                                        >
                                            <Text style={styles.saveBtnText}>Edit</Text>
                                        </Pressable>
                                        <Pressable
                                            style={styles.deleteBtn}
                                            onPress={() => {
                                                setDeleteTarget({ record: selectedRecord, index });
                                                setDeleteConfirmVisible(true);
                                            }}
                                        >
                                            <Text style={styles.deleteBtnText}>Delete</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={isDark && { color: COLORS.darkText }}>No previous maintenance records.</Text>}
                        />
                        <View style={styles.modalButtonRow}>
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
                            Are you sure you want to delete this maintenance record?
                        </Text>
                        <View style={styles.modalButtonRow}>
                            <Pressable style={styles.cancelBtn} onPress={() => setDeleteConfirmVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.deleteBtn}
                                onPress={async () => {
                                    await doDeleteMaintenance(deleteTarget.record, deleteTarget.index);
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
        color: COLORS.accent,
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
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 8,
        gap: 8,
    },
    sortLabel: { fontWeight: 'bold', color: COLORS.text, marginRight: 8 },
    sortOption: { color: COLORS.gray, marginRight: 12, fontWeight: '600' },
    sortActive: { color: COLORS.accent, textDecorationLine: 'underline' },
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
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    cardSub: { color: '#666', fontSize: 15 },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        backgroundColor: COLORS.accent,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: COLORS.accent,
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
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: COLORS.accent },
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
        backgroundColor: COLORS.accent,
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