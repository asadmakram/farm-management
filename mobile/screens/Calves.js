import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const Calves = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [calves, setCalves] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCalf, setEditingCalf] = useState(null);
  const [formData, setFormData] = useState({
    animalId: '',
    motherId: '',
    birthDate: new Date().toISOString().split('T')[0],
    birthWeight: '',
    gender: 'female',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [calvesRes, animalsRes] = await Promise.all([
        api.get('/calves'),
        api.get('/animals')
      ]);
      setCalves(calvesRes.data.data || []);
      setAnimals(animalsRes.data.data || []);
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

  const openModal = (calf = null) => {
    if (calf) {
      setEditingCalf(calf);
      setFormData({
        animalId: calf.animalId?._id || '',
        motherId: calf.motherId?._id || '',
        birthDate: calf.birthDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        birthWeight: calf.birthWeight?.toString() || '',
        gender: calf.gender || 'female',
        notes: calf.notes || ''
      });
    } else {
      setEditingCalf(null);
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      animalId: '',
      motherId: '',
      birthDate: new Date().toISOString().split('T')[0],
      birthWeight: '',
      gender: 'female',
      notes: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.animalId || !formData.motherId) {
      Alert.alert('Error', 'Please select calf animal and mother');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        birthWeight: Number(formData.birthWeight || 0)
      };

      if (editingCalf) {
        await api.put(`/calves/${editingCalf._id}`, payload);
        Alert.alert('Success', 'Calf updated successfully');
      } else {
        await api.post('/calves', payload);
        Alert.alert('Success', 'Calf added successfully');
      }
      
      fetchData();
      setShowModal(false);
      resetForm();
      setEditingCalf(null);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error saving calf');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this calf record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/calves/${id}`);
              Alert.alert('Success', 'Calf deleted successfully');
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Error deleting calf');
            }
          }
        }
      ]
    );
  };

  const getAgeDays = (birthDate) => {
    return Math.floor((new Date() - new Date(birthDate)) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'sold': return '#f59e0b';
      case 'deceased': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderCalf = ({ item }) => (
    <View style={styles.calfCard}>
      <View style={styles.calfHeader}>
        <View style={styles.calfIconContainer}>
          <Text style={styles.calfIcon}>{item.gender === 'male' ? '🐂' : '🐄'}</Text>
        </View>
        <View style={styles.calfInfo}>
          <Text style={styles.calfTag}>{item.animalId?.tagNumber || 'N/A'}</Text>
          <Text style={styles.calfMother}>Mother: {item.motherId?.tagNumber || 'N/A'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status || 'active'}</Text>
        </View>
      </View>

      <View style={styles.calfDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{item.gender}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Birth Date</Text>
            <Text style={styles.detailValue}>{new Date(item.birthDate).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Birth Weight</Text>
            <Text style={styles.detailValue}>{item.birthWeight} kg</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{getAgeDays(item.birthDate)} days</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openModal(item)}>
          <Ionicons name="create-outline" size={18} color="#2563eb" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading calves...</Text>
      </View>
    );
  }

  const femaleAnimals = animals.filter(a => a.gender === 'female');

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🐄 Calves</Text>
          <Text style={styles.subtitle}>{calves.length} calves recorded</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {calves.length > 0 ? (
        <FlatList
          data={calves}
          renderItem={renderCalf}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🐄</Text>
          <Text style={styles.emptyStateText}>No calves recorded yet</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => openModal()}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyStateButtonText}>Add First Calf</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCalf ? 'Edit Calf' : 'Add New Calf'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Calf Animal *</Text>
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
                <Text style={styles.formLabel}>Mother *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.motherId}
                    onValueChange={(value) => setFormData({ ...formData, motherId: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Mother" value="" />
                    {femaleAnimals.map(animal => (
                      <Picker.Item 
                        key={animal._id} 
                        label={`${animal.tagNumber} - ${animal.name || animal.breed}`} 
                        value={animal._id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <DatePickerInput
                    label="Birth Date"
                    value={formData.birthDate}
                    onChange={(date) => setFormData({ ...formData, birthDate: date })}
                    themeColor="#ec4899"
                    required
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Birth Weight (kg)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.birthWeight}
                    onChangeText={(text) => setFormData({ ...formData, birthWeight: text })}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Gender *</Text>
                <View style={styles.genderSelector}>
                  <TouchableOpacity
                    style={[styles.genderOption, formData.gender === 'female' && styles.genderOptionActive]}
                    onPress={() => setFormData({ ...formData, gender: 'female' })}
                  >
                    <Text style={[styles.genderText, formData.gender === 'female' && styles.genderTextActive]}>🐄 Female</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderOption, formData.gender === 'male' && styles.genderOptionActive]}
                    onPress={() => setFormData({ ...formData, gender: 'male' })}
                  >
                    <Text style={[styles.genderText, formData.gender === 'male' && styles.genderTextActive]}>🐂 Male</Text>
                  </TouchableOpacity>
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
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Saving...' : (editingCalf ? 'Update' : 'Add')} Calf
                </Text>
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
    backgroundColor: '#ec4899',
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
  },
  listContent: {
    padding: 16,
  },
  calfCard: {
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
  calfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  calfIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calfIcon: {
    fontSize: 28,
  },
  calfInfo: {
    flex: 1,
  },
  calfTag: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  calfMother: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  calfDetails: {
    marginBottom: 12,
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
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  editBtnText: {
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
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
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#10b981',
    fontWeight: '600',
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
    backgroundColor: '#10b981',
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

export default Calves;