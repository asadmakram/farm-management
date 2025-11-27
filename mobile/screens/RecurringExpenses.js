import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal, RefreshControl, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const EXPENSE_TYPES = [
  { value: 'master_b10_vanda', label: 'Master B-10 Vanda' },
  { value: 'mix_atti', label: 'Mix Atti' },
  { value: 'chaukar', label: 'Chaukar' },
  { value: 'tukra', label: 'Tukra' },
  { value: 'green_fodder', label: 'Green Fodder' },
  { value: 'worker_wage', label: 'Worker Wage' },
  { value: 'medical', label: 'Medical Expenses' },
  { value: 'rent', label: 'Rent' },
  { value: 'toori_wheat_straw', label: 'Toori (Wheat Straw)' }
];

const RecurringExpenses = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalActive: 0, estimatedMonthly: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    expenseType: 'master_b10_vanda',
    description: '',
    amount: '',
    frequency: '10_days',
    lastPurchaseDate: new Date().toISOString().split('T')[0],
    workerCount: '1',
    isActive: true,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recurring-expenses');
      setExpenses(response.data.expenses || []);
      setSummary(response.data.summary || { totalActive: 0, estimatedMonthly: 0 });
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching expenses');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.amount) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        workerCount: Number(formData.workerCount || 1)
      };

      if (editingExpense) {
        await api.put(`/api/recurring-expenses/${editingExpense._id}`, payload);
        Alert.alert('Success', 'Expense updated successfully!');
      } else {
        await api.post('/recurring-expenses', payload);
        Alert.alert('Success', 'Recurring expense added successfully!');
      }
      
      setShowModal(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error saving expense');
    }
    setIsSubmitting(false);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      expenseType: expense.expenseType,
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      frequency: expense.frequency,
      lastPurchaseDate: new Date(expense.lastPurchaseDate).toISOString().split('T')[0],
      workerCount: expense.workerCount?.toString() || '1',
      isActive: expense.isActive,
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this recurring expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/recurring-expenses/${id}`);
              Alert.alert('Success', 'Expense deleted successfully!');
              fetchExpenses();
            } catch (error) {
              Alert.alert('Error', 'Error deleting expense');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      expenseType: 'master_b10_vanda',
      description: '',
      amount: '',
      frequency: '10_days',
      lastPurchaseDate: new Date().toISOString().split('T')[0],
      workerCount: '1',
      isActive: true,
      notes: ''
    });
    setEditingExpense(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getFrequencyLabel = (freq) => {
    switch(freq) {
      case 'daily': return 'Daily';
      case '10_days': return 'Every 10 Days';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  const calculateMonthlyAmount = (amount, frequency, workerCount = 1) => {
    const amt = Number(amount || 0);
    const workers = Number(workerCount || 1);
    const totalAmount = frequency === 'worker_wage' ? amt * workers : amt;
    switch(frequency) {
      case 'daily': return totalAmount * 30;
      case '10_days': return totalAmount * 3;
      case 'monthly': return totalAmount;
      default: return 0;
    }
  };

  const getExpenseTypeLabel = (type) => {
    return EXPENSE_TYPES.find(t => t.value === type)?.label || type;
  };

  const renderExpense = ({ item }) => (
    <View style={[styles.expenseCard, !item.isActive && styles.expenseCardInactive]}>
      <View style={styles.expenseHeader}>
        <View>
          <Text style={styles.expenseType}>{getExpenseTypeLabel(item.expenseType)}</Text>
          {item.expenseType === 'worker_wage' && item.workerCount > 1 && (
            <Text style={styles.workerCount}>({item.workerCount} workers)</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#d1fae5' : '#f3f4f6' }]}>
          <Text style={[styles.statusText, { color: item.isActive ? '#10b981' : '#6b7280' }]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.expenseDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>Rs {item.amount?.toFixed(2)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>{getFrequencyLabel(item.frequency)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Monthly Est.</Text>
            <Text style={[styles.detailValue, styles.monthlyValue]}>
              Rs {calculateMonthlyAmount(item.amount, item.frequency, item.workerCount).toFixed(0)}
            </Text>
          </View>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Last: {new Date(item.lastPurchaseDate).toLocaleDateString()}</Text>
          {item.nextPurchaseDate && (
            <Text style={[styles.dateLabel, new Date(item.nextPurchaseDate) < new Date() && styles.overdue]}>
              Next: {new Date(item.nextPurchaseDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
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
        <Text style={styles.loadingText}>Loading expenses...</Text>
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
          <Text style={styles.title}>🔄 Recurring Expenses</Text>
          <Text style={styles.subtitle}>Rs {(summary.estimatedMonthly || 0).toFixed(0)}/month estimated</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Active</Text>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>{summary.totalActive || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Monthly Est.</Text>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>Rs {(summary.estimatedMonthly || 0).toFixed(0)}</Text>
        </View>
      </View>

      {expenses.length > 0 ? (
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="repeat-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No recurring expenses yet</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={openModal}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyStateButtonText}>Add First Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingExpense ? 'Edit' : 'Add'} Recurring Expense</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Expense Type *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.expenseType}
                    onValueChange={(value) => setFormData({ ...formData, expenseType: value })}
                    style={styles.picker}
                  >
                    {EXPENSE_TYPES.map(type => (
                      <Picker.Item key={type.value} label={type.label} value={type.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Additional details"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Amount *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.amount}
                    onChangeText={(text) => setFormData({ ...formData, amount: text })}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Frequency *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Daily" value="daily" />
                      <Picker.Item label="Every 10 Days" value="10_days" />
                      <Picker.Item label="Monthly" value="monthly" />
                    </Picker>
                  </View>
                </View>
              </View>

              {formData.expenseType === 'worker_wage' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Number of Workers</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.workerCount}
                    onChangeText={(text) => setFormData({ ...formData, workerCount: text })}
                    placeholder="1"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                  />
                </View>
              )}

              <DatePickerInput
                label="Last Purchase Date"
                value={formData.lastPurchaseDate}
                onChange={(date) => setFormData({ ...formData, lastPurchaseDate: date })}
                themeColor="#10b981"
              />

              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: '#e0e0e0', true: '#d1fae5' }}
                  thumbColor={formData.isActive ? '#10b981' : '#f4f3f4'}
                />
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

              {/* Monthly Preview */}
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>Estimated Monthly Cost</Text>
                <Text style={styles.previewValue}>
                  Rs {calculateMonthlyAmount(
                    formData.amount,
                    formData.frequency,
                    formData.workerCount
                  ).toFixed(2)}
                </Text>
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
                  {isSubmitting ? 'Saving...' : (editingExpense ? 'Update' : 'Add')} Expense
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
    backgroundColor: '#f59e0b',
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
    fontSize: 24,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  expenseCard: {
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
  expenseCardInactive: {
    opacity: 0.6,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenseType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  workerCount: {
    fontSize: 12,
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
  },
  expenseDetails: {
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
  },
  monthlyValue: {
    color: '#ef4444',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
  },
  overdue: {
    color: '#ef4444',
    fontWeight: '600',
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
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  previewLabel: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
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
    backgroundColor: '#ef4444',
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

export default RecurringExpenses;