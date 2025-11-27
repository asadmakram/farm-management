import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal, RefreshControl, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const Currencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: '',
    isDefault: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/currencies');
      setCurrencies(response.data.currencies || []);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching currencies');
      setCurrencies([]);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCurrencies();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name || !formData.symbol || !formData.exchangeRate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        exchangeRate: Number(formData.exchangeRate)
      };

      if (editingCurrency) {
        await api.put(`/currencies/${editingCurrency._id}`, payload);
        Alert.alert('Success', 'Currency updated successfully');
      } else {
        await api.post('/currencies', payload);
        Alert.alert('Success', 'Currency created successfully');
      }

      fetchCurrencies();
      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error saving currency');
    }
    setIsSubmitting(false);
  };

  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate.toString(),
      isDefault: currency.isDefault
    });
    setShowModal(true);
  };

  const handleDelete = async (currency) => {
    if (currency.isDefault) {
      Alert.alert('Error', 'Cannot delete default currency');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${currency.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/currencies/${currency._id}`);
              Alert.alert('Success', 'Currency deleted successfully');
              fetchCurrencies();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Error deleting currency');
            }
          }
        }
      ]
    );
  };

  const initializeCurrencies = async () => {
    try {
      await api.post('/currencies/initialize');
      Alert.alert('Success', 'Default currencies initialized');
      fetchCurrencies();
    } catch (error) {
      Alert.alert('Error', 'Error initializing currencies');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      exchangeRate: '',
      isDefault: false
    });
    setEditingCurrency(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const renderCurrency = ({ item }) => (
    <View style={styles.currencyCard}>
      <View style={styles.currencyHeader}>
        <View style={styles.currencyInfo}>
          <View style={styles.symbolContainer}>
            <Text style={styles.currencySymbol}>{item.symbol}</Text>
          </View>
          <View>
            <Text style={styles.currencyCode}>{item.code}</Text>
            <Text style={styles.currencyName}>{item.name}</Text>
          </View>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>

      <View style={styles.exchangeRateRow}>
        <Text style={styles.exchangeLabel}>Exchange Rate</Text>
        <Text style={styles.exchangeValue}>1 {item.code} = {item.exchangeRate} INR</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={18} color="#2563eb" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        {!item.isDefault && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading currencies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>💱 Currencies</Text>
          <Text style={styles.subtitle}>{currencies.length} currencies configured</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {currencies.length === 0 && (
        <TouchableOpacity style={styles.initializeButton} onPress={initializeCurrencies}>
          <Ionicons name="refresh-outline" size={20} color="white" />
          <Text style={styles.initializeButtonText}>Initialize Default Currencies</Text>
        </TouchableOpacity>
      )}

      {currencies.length > 0 ? (
        <FlatList
          data={currencies}
          renderItem={renderCurrency}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No currencies configured</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={initializeCurrencies}>
            <Ionicons name="refresh-outline" size={20} color="white" />
            <Text style={styles.emptyStateButtonText}>Initialize Defaults</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCurrency ? 'Edit Currency' : 'Add New Currency'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Currency Code *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.code}
                    onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                    placeholder="USD"
                    maxLength={3}
                    editable={!editingCurrency}
                  />
                  <Text style={styles.formHint}>3-letter code (ISO 4217)</Text>
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Symbol *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.symbol}
                    onChangeText={(text) => setFormData({ ...formData, symbol: text })}
                    placeholder="$"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Currency Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="US Dollar"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Exchange Rate (to INR) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.exchangeRate}
                  onChangeText={(text) => setFormData({ ...formData, exchangeRate: text })}
                  placeholder="83.50"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.formHint}>1 {formData.code || 'CUR'} = {formData.exchangeRate || 'X'} INR</Text>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Set as default currency</Text>
                <Switch
                  value={formData.isDefault}
                  onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
                  trackColor={{ false: '#e0e0e0', true: '#d1fae5' }}
                  thumbColor={formData.isDefault ? '#10b981' : '#f4f3f4'}
                />
              </View>
              <Text style={styles.formHint}>Only one currency can be default at a time</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowModal(false);
                resetForm();
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Saving...' : (editingCurrency ? 'Update' : 'Create')} Currency
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#10b981',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  initializeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  initializeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  currencyCard: {
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
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  currencyName: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  exchangeRateRow: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  exchangeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  exchangeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
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
  formHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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

export default Currencies;