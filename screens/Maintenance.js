import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    Modal,
    StyleSheet,
    Alert,
    Pressable,
    Image,
    ActivityIndicator,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';
import '../firebase'; // Ensure Firebase is initialized

const COLORS = {
    primary: '#1A73E8',
    moon: '#FBBC05',
    accent: '#FF9100',
    danger: '#EA4335',
    background: '#F4F6FB',
    card: '#FFFFFF',
    text: '#256293',
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
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    const { theme, toggleTheme } = useContext(ThemeContext);
    const isDark = theme === 'dark';

    // Toast helper
    const showToast = msg => {
        setToast(msg);
        setTimeout(() => setToast(''), 2000);
    };

    // Fetch vehicles from Firebase
    useEffect(() => {
        setLoading(true);
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
            setLoading(false);
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
        showToast(selectedRecord ? 'Record updated!' : 'Record added!');
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
        showToast('Record deleted!');
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

    // Input icon helper
    const inputIcon = (icon, color = COLORS.gray) => (
        <MaterialIcons name={icon} size={22} color={color} style={{ marginRight: 8 }} />
    );

    // Date picker (simple, for demo)
    const DateInput = ({ value, onChange }) => (
        <Pressable
            style={styles.inputRow}
            onPress={() => {
                // For demo: prompt for date, in real app use a date picker library
                const date = prompt('Enter date (YYYY-MM-DD):', value);
                if (date) onChange(date);
            }}
        >
            {inputIcon('event')}
            <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={value}
                onChangeText={onChange}
                placeholderTextColor={COLORS.gray}
                editable={Platform.OS !== 'web'}
            />
        </Pressable>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: COLORS.darkBg }]}>
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
                {['vehicle', 'service', 'mileage'].map(key => (
                    <Pressable
                        key={key}
                        android_ripple={{ color: COLORS.accent, borderless: true }}
                        onPress={() => setSortKey(key)}
                        style={({ pressed }) => [
                            styles.sortOption,
                            sortKey === key && styles.sortActive,
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Text style={[styles.sortOption, sortKey === key && styles.sortActive]}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Maintenance Cards */}
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 32 }} />
            ) : (
                <FlatList
                    data={filteredRecords}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <Pressable
                            style={({ pressed }) => [
                                styles.card,
                                isDark && { backgroundColor: COLORS.darkCard },
                                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                            ]}
                            android_ripple={{ color: COLORS.accent, borderless: false }}
                            onPress={() => openDetail(item)}
                        >
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
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 32 }}>
                            <MaterialCommunityIcons name="tools" size={48} color={COLORS.gray} style={{ marginBottom: 8 }} />
                            <Text style={[styles.emptyText, isDark && { color: COLORS.darkText }]}>No maintenance records found.</Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    isDark && { backgroundColor: COLORS.accent },
                    pressed && { transform: [{ scale: 0.93 }] },
                ]}
                android_ripple={{ color: '#fff', borderless: true }}
                onPress={openAdd}
                accessibilityLabel="Add Maintenance Record"
            >
                <MaterialIcons name="add" size={36} color="#fff" />
            </Pressable>

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: COLORS.darkCard }]}>
                        <Text style={[styles.modalTitle, isDark && { color: COLORS.accent }]}>
                            {selectedRecord ? 'Edit Record' : 'Add Maintenance Record'}
                        </Text>
                        <View style={styles.inputRow}>
                            {inputIcon('directions-car')}
                            <TextInput
                                style={styles.input}
                                placeholder="Vehicle"
                                value={form.vehicle}
                                onChangeText={text => setForm({ ...form, vehicle: text })}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>
                        <View style={styles.inputRow}>
                            {inputIcon('build')}
                            <TextInput
                                style={styles.input}
                                placeholder="Service Type"
                                value={form.service}
                                onChangeText={text => setForm({ ...form, service: text })}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>
                        <View style={styles.inputRow}>
                            {inputIcon('speed')}
                            <TextInput
                                style={styles.input}
                                placeholder="Mileage"
                                value={form.mileage}
                                keyboardType="numeric"
                                onChangeText={text => setForm({ ...form, mileage: text })}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>
                        <DateInput value={form.date} onChange={date => setForm({ ...form, date })} />
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
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', marginTop: 8 }}>
                                    <MaterialCommunityIcons name="history" size={32} color={COLORS.gray} style={{ marginBottom: 4 }} />
                                    <Text style={isDark && { color: COLORS.darkText }}>No previous maintenance records.</Text>
                                </View>
                            }
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

            {/* Toast */}
            {toast ? (
                <View style={styles.toast}>
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            ) : null}
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
        bottom: 40,
        backgroundColor: COLORS.accent,
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: COLORS.accent,
        shadowOpacity: 0.3,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 8,
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