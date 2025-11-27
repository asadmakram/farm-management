import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const Vaccinations = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [vaccinations, setVaccinations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    animalId: '',
    vaccineName: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    veterinarian: '',
    cost: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vaccRes, animalsRes] = await Promise.all([
        api.get('/vaccinations'),
        api.get('/animals')
      ]);
      setVaccinations(vaccRes.data.data || []);
      setAnimals((animalsRes.data.data || []).filter(a => a.status === 'active'));
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching data');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.animalId || !formData.vaccineName) {
      Alert.alert('Error', 'Please select an animal and enter vaccine name');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/vaccinations', {
        ...formData,
        cost: Number(formData.cost || 0)
      });
      Alert.alert('Success', 'Vaccination record added successfully');
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error saving vaccination');
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      animalId: '',
      vaccineName: '',
      dateAdministered: new Date().toISOString().split('T')[0],
      nextDueDate: '',
      veterinarian: '',
      cost: '',
      notes: ''
    });
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const isOverdue = (nextDueDate) => {
    if (!nextDueDate) return false;
    return new Date(nextDueDate) < new Date();
  };

  const isDueSoon = (nextDueDate) => {
    if (!nextDueDate) return false;
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  };

  const renderVaccination = ({ item }) => (
    <View style={styles.vaccinationCard}>
      <View style={styles.vaccinationHeader}>
        <View style={styles.vaccineInfo}>
          <View style={styles.iconContainer}>
            <Ionicons name="fitness-outline" size={24} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.vaccineName}>{item.vaccineName}</Text>
            <Text style={styles.animalTag}>{item.animalId?.tagNumber || 'N/A'}</Text>
          </View>
        </View>
        {item.nextDueDate && (
          <View style={[
            styles.dueBadge,
            isOverdue(item.nextDueDate) && styles.overdueBadge,
            isDueSoon(item.nextDueDate) && styles.dueSoonBadge
          ]}>
            <Text style={[
              styles.dueText,
              isOverdue(item.nextDueDate) && styles.overdueText,
              isDueSoon(item.nextDueDate) && styles.dueSoonText
            ]}>
              {isOverdue(item.nextDueDate) ? 'Overdue' : isDueSoon(item.nextDueDate) ? 'Due Soon' : 'Scheduled'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.vaccinationDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date Administered</Text>
            <Text style={styles.detailValue}>{new Date(item.dateAdministered).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Next Due</Text>
            <Text style={[
              styles.detailValue,
              isOverdue(item.nextDueDate) && styles.overdueValue
            ]}>
              {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Veterinarian</Text>
            <Text style={styles.detailValue}>{item.veterinarian || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Cost</Text>
            <Text style={styles.detailValue}>Rs {Number(item.cost || 0).toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading vaccinations...</Text>
      </View>
    );
  }

  // Count overdue and due soon
  const overdueCount = vaccinations.filter(v => isOverdue(v.nextDueDate)).length;
  const dueSoonCount = vaccinations.filter(v => isDueSoon(v.nextDueDate)).length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>💉 Vaccinations</Text>
          <Text style={styles.subtitle}>{vaccinations.length} records</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Alert Cards */}
      {(overdueCount > 0 || dueSoonCount > 0) && (
        <View style={styles.alertContainer}>
          {overdueCount > 0 && (
            <View style={[styles.alertCard, styles.overdueAlert]}>
              <Ionicons name="warning-outline" size={20} color="#ef4444" />
              <Text style={styles.overdueAlertText}>{overdueCount} overdue</Text>
            </View>
          )}
          {dueSoonCount > 0 && (
            <View style={[styles.alertCard, styles.dueSoonAlert]}>
              <Ionicons name="time-outline" size={20} color="#f59e0b" />
              <Text style={styles.dueSoonAlertText}>{dueSoonCount} due soon</Text>
            </View>
          )}
        </View>
      )}

      {vaccinations.length > 0 ? (
        <FlatList
          data={vaccinations}
          renderItem={renderVaccination}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No vaccination records yet</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={openModal}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyStateButtonText}>Add First Vaccination</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vaccination Record</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Animal *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.animalId}
                    onValueChange={(value) => setFormData({ ...formData, animalId: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Animal" value="" />
                    {animals.map(animal => (
                      <Picker.Item 
                        key={animal._id} 
                        label={`${animal.tagNumber} - ${animal.name || animal.breed}`} 
                        value={animal._id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vaccine Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.vaccineName}
                  onChangeText={(text) => setFormData({ ...formData, vaccineName: text })}
                  placeholder="Enter vaccine name"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <DatePickerInput
                    label="Date Administered"
                    value={formData.dateAdministered}
                    onChange={(date) => setFormData({ ...formData, dateAdministered: date })}
                    themeColor="#22c55e"
                    required
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <DatePickerInput
                    label="Next Due Date"
                    value={formData.nextDueDate}
                    onChange={(date) => setFormData({ ...formData, nextDueDate: date })}
                    themeColor="#22c55e"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Veterinarian</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.veterinarian}
                    onChangeText={(text) => setFormData({ ...formData, veterinarian: text })}
                    placeholder="Vet name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Cost (Rs )</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.cost}
                    onChangeText={(text) => setFormData({ ...formData, cost: text })}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Optional notes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>{isSubmitting ? 'Adding...' : 'Add Vaccination'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2563eb',
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowRadius: 8,
    elevation: 6,
  },
  alertContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  overdueAlert: {
    backgroundColor: '#fee2e2',
  },
  dueSoonAlert: {
    backgroundColor: '#fef3c7',
  },
  overdueAlertText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  dueSoonAlertText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  vaccinationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  vaccinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vaccineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  animalTag: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
  },
  overdueBadge: {
    backgroundColor: '#fee2e2',
  },
  dueSoonBadge: {
    backgroundColor: '#fef3c7',
  },
  dueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  overdueText: {
    color: '#ef4444',
  },
  dueSoonText: {
    color: '#f59e0b',
  },
  vaccinationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  overdueValue: {
    color: '#ef4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default Vaccinations;