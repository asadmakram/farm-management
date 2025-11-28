import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal, TextInput, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const { width } = Dimensions.get('window');

const Expenses = () => {
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'feed',
    expenseType: 'operating',
    amount: '',
    description: '',
    animalId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const operatingCategories = [
    { label: 'Feed (Vanda)', value: 'feed' },
    { label: 'Labour', value: 'labour' },
    { label: 'Rental', value: 'rental' },
    { label: 'Veterinary', value: 'veterinary' },
    { label: 'Medicine', value: 'medicine' },
    { label: 'Utilities', value: 'utilities' },
    { label: 'Transportation', value: 'transportation' },
    { label: 'Utensils', value: 'utensils' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Insurance', value: 'insurance' },
    { label: 'Other', value: 'other' },
  ];

  const assetCategories = [
    { label: 'Animal Purchase', value: 'animal_purchase' },
    { label: 'Equipment Purchase', value: 'equipment_purchase' },
    { label: 'Land Improvement', value: 'land_improvement' },
    { label: 'Building Construction', value: 'building_construction' },
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses');
      setExpenses(response.data.data || []);
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
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      if (!payload.animalId) delete payload.animalId;
      await api.post('/expenses', payload);
      Alert.alert('Success', 'Expense added successfully');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'feed',
        expenseType: 'operating',
        amount: '',
        description: '',
        animalId: ''
      });
      setShowModal(false);
      fetchExpenses();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error adding expense');
    }
    setIsSubmitting(false);
  };

  const filteredExpenses = filterType === 'all' 
    ? expenses 
    : expenses.filter(e => e.expenseType === filterType);

  const assetTotal = expenses
    .filter(e => e.expenseType === 'asset')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const operatingTotal = expenses
    .filter(e => e.expenseType === 'operating')
    .reduce((sum, e) => sum + e.amount, 0);

  const getCategoryIcon = (category) => {
    const icons = {
      feed: 'leaf',
      labour: 'people',
      rental: 'home',
      veterinary: 'medical',
      medicine: 'medkit',
      utilities: 'flash',
      transportation: 'car',
      utensils: 'restaurant',
      maintenance: 'construct',
      insurance: 'shield-checkmark',
      other: 'ellipsis-horizontal',
      animal_purchase: 'paw',
      equipment_purchase: 'build',
      land_improvement: 'map',
      building_construction: 'business',
    };
    return icons[category] || 'cash';
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={[styles.cardAccent, { backgroundColor: item.expenseType === 'asset' ? '#8b5cf6' : '#ef4444' }]} />
      <View style={styles.cardContent}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: item.expenseType === 'asset' ? '#f3e8ff' : '#fef2f2' }]}>
              <Ionicons 
                name={getCategoryIcon(item.category)} 
                size={20} 
                color={item.expenseType === 'asset' ? '#8b5cf6' : '#ef4444'} 
              />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.categoryText}>{item.category.replace(/_/g, ' ')}</Text>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={10} color="#94a3b8" />
                <Text style={styles.dateText}>
                  {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.expenseRight}>
            <Text style={[styles.amountText, { color: item.expenseType === 'asset' ? '#8b5cf6' : '#ef4444' }]}>
              Rs {Number(item.amount).toLocaleString()}
            </Text>
            <View style={[styles.typeBadge, item.expenseType === 'asset' ? styles.assetBadge : styles.operatingBadge]}>
              <Text style={[styles.typeText, { color: item.expenseType === 'asset' ? '#8b5cf6' : '#ef4444' }]}>
                {item.expenseType === 'asset' ? 'Asset' : 'Operating'}
              </Text>
            </View>
          </View>
        </View>
        {item.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Expense Tracking</Text>
            <Text style={styles.headerTitle}>Your Expenses</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={26} color="#ef4444" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="diamond" size={18} color="white" />
            </View>
            <View>
              <Text style={styles.summaryValue}>Rs {assetTotal.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Asset</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="repeat" size={18} color="white" />
            </View>
            <View>
              <Text style={styles.summaryValue}>Rs {operatingTotal.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Operating</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="receipt" size={18} color="white" />
            </View>
            <View>
              <Text style={styles.summaryValue}>{expenses.length}</Text>
              <Text style={styles.summaryLabel}>Records</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'asset' && styles.filterButtonActive]}
          onPress={() => setFilterType('asset')}
          activeOpacity={0.7}
        >
          <Ionicons name="diamond" size={14} color={filterType === 'asset' ? '#fff' : '#8b5cf6'} />
          <Text style={[styles.filterText, filterType === 'asset' && styles.filterTextActive]}>Asset</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'operating' && styles.filterButtonActive]}
          onPress={() => setFilterType('operating')}
          activeOpacity={0.7}
        >
          <Ionicons name="repeat" size={14} color={filterType === 'operating' ? '#fff' : '#ef4444'} />
          <Text style={[styles.filterText, filterType === 'operating' && styles.filterTextActive]}>Operating</Text>
        </TouchableOpacity>
      </View>

      {filteredExpenses.length > 0 ? (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#ef4444']}
              tintColor="#ef4444"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="wallet-outline" size={48} color="#ef4444" />
          </View>
          <Text style={styles.emptyStateTitle}>No Expenses Yet</Text>
          <Text style={styles.emptyStateText}>Start tracking your farm expenses</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowModal(true)} activeOpacity={0.8}>
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>Add First Expense</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Expense Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <DatePickerInput
                label="Date"
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                themeColor="#f97316"
                required
              />

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Expense Type *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeOption, formData.expenseType === 'operating' && styles.typeOptionActive]}
                    onPress={() => setFormData({ ...formData, expenseType: 'operating', category: 'feed' })}
                  >
                    <Text style={[styles.typeOptionText, formData.expenseType === 'operating' && styles.typeOptionTextActive]}>
                      🔄 Operating
                    </Text>
                    <Text style={styles.typeOptionSubtext}>Monthly/Recurring</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeOption, formData.expenseType === 'asset' && styles.typeOptionActive]}
                    onPress={() => setFormData({ ...formData, expenseType: 'asset', category: 'animal_purchase' })}
                  >
                    <Text style={[styles.typeOptionText, formData.expenseType === 'asset' && styles.typeOptionTextActive]}>
                      💎 Asset
                    </Text>
                    <Text style={styles.typeOptionSubtext}>Capital Investment</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {(formData.expenseType === 'asset' ? assetCategories : operatingCategories).map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.categoryOption, formData.category === cat.value && styles.categoryOptionActive]}
                      onPress={() => setFormData({ ...formData, category: cat.value })}
                    >
                      <Text style={[styles.categoryOptionText, formData.category === cat.value && styles.categoryOptionTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount (Rs ) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter description..."
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
                <Text style={styles.submitButtonText}>{isSubmitting ? 'Adding...' : 'Add Expense'}</Text>
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
    backgroundColor: '#f1f5f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'white',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#ef4444',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardAccent: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
  },
  assetBadge: {
    backgroundColor: '#f3e8ff',
  },
  operatingBadge: {
    backgroundColor: '#fef2f2',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  descriptionText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyStateButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  typeOptionActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  typeOptionTextActive: {
    color: '#ef4444',
  },
  typeOptionSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginRight: 10,
    backgroundColor: '#f8fafc',
  },
  categoryOptionActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  categoryOptionTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default Expenses;