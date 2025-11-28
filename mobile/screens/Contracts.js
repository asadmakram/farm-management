import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const Contracts = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState({ active: 0, totalAdvanceHeld: 0, totalAdvanceReturned: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);
  const [formData, setFormData] = useState({
    vendorName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    ratePerLiter: '182.5',
    advanceAmount: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contracts');
      setContracts(response.data.contracts || []);
      setSummary(response.data.summary || { active: 0, totalAdvanceHeld: 0, totalAdvanceReturned: 0 });
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching contracts');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContracts();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.vendorName || !formData.startDate || !formData.endDate || !formData.ratePerLiter || !formData.advanceAmount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        ratePerLiter: Number(formData.ratePerLiter),
        advanceAmount: Number(formData.advanceAmount)
      };
      
      if (editingContract) {
        await api.put(`/contracts/${editingContract._id}`, payload);
        Alert.alert('Success', 'Contract updated successfully!');
      } else {
        await api.post('/contracts', payload);
        Alert.alert('Success', 'Contract created successfully!');
      }
      setShowModal(false);
      setEditingContract(null);
      resetForm();
      fetchContracts();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error saving contract');
    }
    setIsSubmitting(false);
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      vendorName: contract.vendorName,
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate.split('T')[0],
      ratePerLiter: contract.ratePerLiter.toString(),
      advanceAmount: contract.advanceAmount.toString(),
      notes: contract.notes || ''
    });
    setShowModal(true);
  };

  const handleDeletePress = (contract) => {
    setContractToDelete(contract);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;
    try {
      await api.delete(`/contracts/${contractToDelete._id}`);
      Alert.alert('Success', 'Contract deleted successfully!');
      setShowDeleteConfirm(false);
      setContractToDelete(null);
      fetchContracts();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error deleting contract');
    }
  };

  const handleReturnAdvance = async (contractId) => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to mark this advance as returned and complete the contract?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.patch(`/api/contracts/${contractId}/return-advance`);
              Alert.alert('Success', 'Advance returned successfully!');
              fetchContracts();
            } catch (error) {
              Alert.alert('Error', 'Error returning advance');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      vendorName: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      ratePerLiter: '182.5',
      advanceAmount: '',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAdvanceStatusColor = (status) => {
    switch (status) {
      case 'held': return '#f59e0b';
      case 'returned': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderContract = ({ item }) => (
    <View style={styles.contractCard}>
      <View style={styles.contractHeader}>
        <View>
          <Text style={styles.vendorName}>{item.vendorName}</Text>
          <Text style={styles.contractDates}>
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.contractDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rate/Liter</Text>
            <Text style={styles.detailValue}>Rs {item.ratePerLiter?.toFixed(2)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Advance</Text>
            <Text style={styles.detailValue}>Rs {item.advanceAmount?.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.advanceStatusRow}>
          <Text style={styles.detailLabel}>Advance Status:</Text>
          <View style={[styles.advanceStatusBadge, { backgroundColor: getAdvanceStatusColor(item.advanceStatus) + '20' }]}>
            <Text style={[styles.advanceStatusText, { color: getAdvanceStatusColor(item.advanceStatus) }]}>
              {item.advanceStatus}
            </Text>
          </View>
        </View>
      </View>

      {item.advanceStatus === 'held' && item.status === 'active' && (
        <TouchableOpacity 
          style={styles.returnButton} 
          onPress={() => handleReturnAdvance(item._id)}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
          <Text style={styles.returnButtonText}>Return Advance & Complete</Text>
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="create-outline" size={18} color="#3b82f6" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDeletePress(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading contracts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📋 Bandhi Contracts</Text>
          <Text style={styles.subtitle}>{summary.active} active contracts</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Active</Text>
          <Text style={[styles.summaryValue, { color: '#2563eb' }]}>{summary.active || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Held</Text>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>Rs {(summary.totalAdvanceHeld || 0).toFixed(0)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Returned</Text>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>Rs {(summary.totalAdvanceReturned || 0).toFixed(0)}</Text>
        </View>
      </View>

      {contracts.length > 0 ? (
        <FlatList
          data={contracts}
          renderItem={renderContract}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No contracts yet</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyStateButtonText}>Add First Contract</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Contract Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingContract ? 'Edit Contract' : 'New Bandhi Contract'}</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setEditingContract(null); }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vendor Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.vendorName}
                  onChangeText={(text) => setFormData({ ...formData, vendorName: text })}
                  placeholder="Enter vendor name"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <DatePickerInput
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date) => setFormData({ ...formData, startDate: date })}
                    themeColor="#3b82f6"
                    required
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <DatePickerInput
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => setFormData({ ...formData, endDate: date })}
                    themeColor="#3b82f6"
                    required
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Rate/Liter *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.ratePerLiter}
                    onChangeText={(text) => setFormData({ ...formData, ratePerLiter: text })}
                    placeholder="182.50"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Advance Amount *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.advanceAmount}
                    onChangeText={(text) => setFormData({ ...formData, advanceAmount: text })}
                    placeholder="0.00"
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
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowModal(false); setEditingContract(null); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Saving...' : (editingContract ? 'Update Contract' : 'Create Contract')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 250 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#ef4444' }]}>⚠️ Confirm Delete</Text>
              <TouchableOpacity onPress={() => { setShowDeleteConfirm(false); setContractToDelete(null); }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.deleteConfirmText}>
                Are you sure you want to delete the contract with <Text style={{ fontWeight: 'bold' }}>{contractToDelete?.vendorName}</Text>?
              </Text>
              <Text style={styles.deleteConfirmSubtext}>This action cannot be undone.</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowDeleteConfirm(false); setContractToDelete(null); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: '#ef4444' }]} 
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.submitButtonText}>Delete</Text>
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
    backgroundColor: '#06b6d4',
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  contractCard: {
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
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  contractDates: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
  contractDetails: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  advanceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advanceStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  advanceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    gap: 6,
  },
  returnButtonText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    gap: 4,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteConfirmText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 24,
  },
  deleteConfirmSubtext: {
    fontSize: 14,
    color: '#666',
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

export default Contracts;