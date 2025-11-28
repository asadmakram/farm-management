import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal, RefreshControl, Dimensions, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const { width } = Dimensions.get('window');

const MilkSales = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [sales, setSales] = useState([]);
  const [contracts, setContracts] = useState([]);
  const defaultSummary = {
    totalQuantity: 0,
    totalRevenue: 0,
    bandhi: { quantity: 0, revenue: 0, count: 0 },
    mandi: { quantity: 0, revenue: 0, count: 0 },
    door_to_door: { quantity: 0, revenue: 0, count: 0 },
    pending: 0,
    received: 0
  };
  const [summary, setSummary] = useState(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    saleType: 'bandhi',
    quantity: '',
    contractId: '',
    timeOfDay: 'morning',
    packagingCost: '0',
    customerName: '',
    ratePerLiter: '182.5',
    paymentStatus: 'pending',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, contractsRes] = await Promise.all([
        api.get('/milk/sales'),
        api.get('/contracts?status=active')
      ]);
      setSales(salesRes.data.data || []);
      setSummary(salesRes.data.summary || defaultSummary);
      setContracts(contractsRes.data.contracts || []);
      setLoading(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('sales.fetchError'));
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.quantity || !formData.ratePerLiter) {
      Alert.alert(t('common.error'), t('sales.fillQuantityRate'));
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        ratePerLiter: Number(formData.ratePerLiter),
        packagingCost: Number(formData.packagingCost || 0)
      };

      if (formData.saleType !== 'bandhi') delete payload.contractId;
      if (formData.saleType !== 'door_to_door') delete payload.packagingCost;

      await api.post('/milk/sales', payload);
      Alert.alert(t('common.success'), t('sales.recordSuccess'));
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('sales.recordError'));
    }
    setIsSubmitting(false);
  };

  const updatePaymentStatus = async (saleId, newStatus) => {
    try {
      await api.put(`/milk/sales/${saleId}`, { paymentStatus: newStatus });
      Alert.alert(t('common.success'), t('sales.updatePaymentSuccess'));
      fetchData();
    } catch (error) {
      Alert.alert(t('common.error'), t('sales.updatePaymentError'));
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      saleType: 'bandhi',
      quantity: '',
      contractId: '',
      timeOfDay: 'morning',
      packagingCost: '0',
      customerName: '',
      ratePerLiter: '182.5',
      paymentStatus: 'pending',
      notes: ''
    });
  };

  const handleSaleTypeChange = (type) => {
    setFormData({
      ...formData,
      saleType: type,
      ratePerLiter: type === 'bandhi' ? '182.5' : type === 'door_to_door' ? '220' : ''
    });
  };

  const getSaleTypeColor = (type) => {
    switch (type) {
      case 'bandhi': return '#2563eb';
      case 'mandi': return '#f59e0b';
      case 'door_to_door': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSaleTypeLabel = (type) => {
    switch (type) {
      case 'bandhi': return `📋 ${t('sales.bandhi')}`;
      case 'mandi': return `🏪 ${t('sales.mandi')}`;
      case 'door_to_door': return `🚪 ${t('sales.doorToDoor')}`;
      default: return type;
    }
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case 'received': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'pending': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleAddPayment = async () => {
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      Alert.alert(t('common.error'), t('sales.invalidPaymentAmount'));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/milk/sales/${selectedSale._id}/payments`, {
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        date: paymentData.date,
        notes: paymentData.notes
      });
      Alert.alert(t('common.success'), t('sales.addPaymentSuccess'));
      setShowPaymentModal(false);
      setPaymentData({
        amount: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchData();
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('sales.addPaymentError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setPaymentData({
      ...paymentData,
      amount: sale.amountPending ? sale.amountPending.toString() : sale.totalAmount.toString()
    });
    setShowPaymentModal(true);
  };

  const filteredSales = filterType === 'all'
    ? (sales || [])
    : (sales || []).filter(sale => sale.saleType === filterType);

  const renderSale = ({ item }) => (
    <View style={styles.saleCard}>
      <View style={[styles.cardAccent, { backgroundColor: getSaleTypeColor(item.saleType) }]} />
      <View style={styles.cardContent}>
        {/* Top Row: Customer/Vendor + Payment Status */}
        <View style={styles.saleTopRow}>
          <View style={styles.customerInfo}>
            <Ionicons name="person-outline" size={12} color="#64748b" />
            <Text style={[styles.customerName, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {item.contractId?.vendorName || item.customerName || t('sales.walkIn')}
            </Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: getPaymentColor(item.paymentStatus) + '15' }]}>
            <Ionicons
              name={item.paymentStatus === 'received' ? 'checkmark-circle' : item.paymentStatus === 'partial' ? 'checkmark-circle-outline' : 'time-outline'}
              size={10}
              color={getPaymentColor(item.paymentStatus)}
            />
            <Text style={[styles.paymentText, { color: getPaymentColor(item.paymentStatus), textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
              {t(`sales.status.${item.paymentStatus}`) || item.paymentStatus}
            </Text>
          </View>
        </View>

        {/* Middle Row: Type Badge + Date */}
        <View style={styles.saleMiddleRow}>
          <View style={[styles.saleTypeBadge, { backgroundColor: getSaleTypeColor(item.saleType) + '15' }]}>
            <Text style={[styles.saleTypeText, { color: getSaleTypeColor(item.saleType), textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
              {getSaleTypeLabel(item.saleType)}
            </Text>
          </View>
          <Text style={[styles.saleDate, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>

        {/* Bottom Row: Quantity, Rate, Total */}
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>{t('sales.quantity')}</Text>
            <Text style={[styles.detailValue, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>{item.quantity}L</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>{t('sales.rate')}</Text>
            <Text style={[styles.detailValue, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>Rs {item.ratePerLiter?.toFixed(0)}</Text>
          </View>
          <View style={[styles.detailItem, styles.totalItem]}>
            <Text style={[styles.detailLabel, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>{t('common.total')}</Text>
            <Text style={[styles.detailValue, styles.totalValue, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>Rs {item.totalAmount?.toFixed(0)}</Text>
          </View>
        </View>

        {/* Payment Details (if partial or pending) */}
        {item.paymentStatus !== 'received' && (
          <View style={styles.paymentDetailsRow}>
            <View style={styles.paymentAmounts}>
              <Text style={styles.paymentDetailLabel}>
                Paid: <Text style={styles.paidAmount}>Rs {item.amountPaid || 0}</Text>
              </Text>
              <Text style={styles.paymentDetailLabel}>
                Pending: <Text style={styles.pendingAmount}>Rs {item.amountPending || item.totalAmount}</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addPaymentBtn}
              onPress={() => openPaymentModal(item)}
              activeOpacity={0.7}
            >
                <Ionicons name="wallet-outline" size={14} color="#3b82f6" />
                <Text style={[styles.addPaymentText, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.pay')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={[styles.loadingText, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>{t('sales.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[styles.title, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>💰 {t('sales.title')}</Text>
          <Text style={[styles.subtitle, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.revenueSummary', { amount: (summary.totalRevenue || 0).toFixed(0) })}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View>
        {/* Summary Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>📋 {t('sales.bandhi')}</Text>
            <Text style={[styles.summaryValue, { color: '#2563eb' }]}>{summary.bandhi?.quantity || 0}L</Text>
            <Text style={styles.summarySubtext}>Rs {(summary.bandhi?.revenue || 0).toFixed(0)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>🏪 {t('sales.mandi')}</Text>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{summary.mandi?.quantity || 0}L</Text>
            <Text style={styles.summarySubtext}>Rs {(summary.mandi?.revenue || 0).toFixed(0)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>🚪 {t('sales.doorToDoor')}</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{summary.door_to_door?.quantity || 0}L</Text>
            <Text style={styles.summarySubtext}>Rs {(summary.door_to_door?.revenue || 0).toFixed(0)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>{t('sales.status.pendingEmoji') || '⏳ ' + t('sales.status.pending')}</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>Rs {(summary.pending || 0).toFixed(0)}</Text>
          </View>
        </ScrollView>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['all', 'bandhi', 'mandi', 'door_to_door'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterTab, filterType === type && styles.filterTabActive]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterTabText, filterType === type && styles.filterTabTextActive, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>
                {type === 'all' ? t('sales.all') : getSaleTypeLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredSales.length > 0 ? (
        <FlatList
          data={filteredSales}
          renderItem={renderSale}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cash-outline" size={64} color="#ccc" />
          <Text style={[styles.emptyStateText, { textAlign: I18nManager.isRTL ? 'right' : 'center' }]}>{t('sales.noSales')}</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={[styles.emptyStateButtonText, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.recordFirstSale')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Sale Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.recordTitle')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Sale Type Selection */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.saleType')}</Text>
                <View style={styles.saleTypeSelector}>
                  {['bandhi', 'mandi', 'door_to_door'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.saleTypeOption, formData.saleType === type && styles.saleTypeOptionActive]}
                      onPress={() => handleSaleTypeChange(type)}
                    >
                      <Text style={[styles.saleTypeOptionText, formData.saleType === type && styles.saleTypeOptionTextActive]}>
                        {getSaleTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <DatePickerInput
                label={t('common.date')}
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                themeColor="#10b981"
                required
              />

              {formData.saleType === 'bandhi' && contracts.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.contract')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.contractId}
                      onValueChange={(value) => {
                        const contract = contracts.find(c => c._id === value);
                        setFormData({
                          ...formData,
                          contractId: value,
                          ratePerLiter: contract?.ratePerLiter?.toString() || formData.ratePerLiter
                        });
                      }}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('sales.selectContract')} value="" />
                      {contracts.map(c => (
                        <Picker.Item key={c._id} label={`${c.vendorName} - Rs ${c.ratePerLiter}/L`} value={c._id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              {(formData.saleType === 'bandhi' || formData.saleType === 'mandi') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.timeOfDay')}</Text>
                  <View style={styles.timeSelector}>
                    <TouchableOpacity
                      style={[styles.timeOption, formData.timeOfDay === 'morning' && styles.timeOptionActive]}
                      onPress={() => setFormData({ ...formData, timeOfDay: 'morning' })}
                    >
                      <Text style={[styles.timeText, formData.timeOfDay === 'morning' && styles.timeTextActive]}>{t('sales.morning')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.timeOption, formData.timeOfDay === 'evening' && styles.timeOptionActive]}
                      onPress={() => setFormData({ ...formData, timeOfDay: 'evening' })}
                    >
                      <Text style={[styles.timeText, formData.timeOfDay === 'evening' && styles.timeTextActive]}>{t('sales.evening')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Quantity (L) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Rate/L *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.ratePerLiter}
                    onChangeText={(text) => setFormData({ ...formData, ratePerLiter: text })}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {formData.saleType === 'door_to_door' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.packagingCostPerL')}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.packagingCost}
                      onChangeText={(text) => setFormData({ ...formData, packagingCost: text })}
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.customer')}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.customerName}
                      onChangeText={(text) => setFormData({ ...formData, customerName: text })}
                      placeholder="Enter customer name"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.paymentStatus')}</Text>
                <View style={styles.paymentSelector}>
                  {['pending', 'received'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.paymentOption, formData.paymentStatus === status && styles.paymentOptionActive]}
                      onPress={() => setFormData({ ...formData, paymentStatus: status })}
                    >
                      <Text style={[styles.paymentOptionText, formData.paymentStatus === status && styles.paymentOptionTextActive]}>
                        {status === 'pending' ? `⏳ ${t('sales.status.pending')}` : `✅ ${t('sales.status.received')}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Total Preview */}
              <LinearGradient
                colors={['#f0fdf4', '#dcfce7']}
                style={styles.totalPreview}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.totalPreviewContent}>
                  <Ionicons name="wallet-outline" size={24} color="#10b981" />
                  <View style={styles.totalPreviewTextContainer}>
                    <Text style={[styles.totalPreviewLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.totalAmount')}</Text>
                    <Text style={styles.totalPreviewValue}>
                      Rs {(
                        (Number(formData.quantity || 0) * Number(formData.ratePerLiter || 0)) +
                        (formData.saleType === 'door_to_door' ? Number(formData.quantity || 0) * Number(formData.packagingCost || 0) : 0)
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>{isSubmitting ? t('sales.recording') : t('sales.recordSale')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.addPaymentTitle')}</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSale && (
                <>
                  <View style={styles.paymentSummaryCard}>
                    <Text style={[styles.paymentSummaryTitle, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.saleDetails')}</Text>
                    <View style={styles.paymentSummaryRow}>
                      <Text style={styles.paymentSummaryLabel}>{t('sales.customerLabel')}</Text>
                      <Text style={styles.paymentSummaryValue}>{selectedSale.customerName || t('common.na')}</Text>
                    </View>
                    <View style={styles.paymentSummaryRow}>
                      <Text style={styles.paymentSummaryLabel}>{t('sales.totalAmountLabel')}</Text>
                      <Text style={styles.paymentSummaryValue}>Rs {selectedSale.totalAmount?.toFixed(0)}</Text>
                    </View>
                    <View style={styles.paymentSummaryRow}>
                      <Text style={styles.paymentSummaryLabel}>{t('sales.amountPaidLabel')}</Text>
                      <Text style={[styles.paymentSummaryValue, { color: '#10b981' }]}>Rs {selectedSale.amountPaid || 0}</Text>
                    </View>
                    <View style={styles.paymentSummaryRow}>
                      <Text style={styles.paymentSummaryLabel}>{t('sales.amountPendingLabel')}</Text>
                      <Text style={[styles.paymentSummaryValue, { color: '#ef4444', fontWeight: 'bold' }]}>Rs {selectedSale.amountPending || selectedSale.totalAmount}</Text>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.paymentAmount')}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={paymentData.amount}
                      onChangeText={(text) => setPaymentData({ ...paymentData, amount: text })}
                      placeholder="Enter payment amount"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('sales.paymentMethod')}</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={paymentData.paymentMethod}
                        onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
                        style={styles.picker}
                      >
                        <Picker.Item label={t('sales.paymentMethods.cash')} value="cash" />
                        <Picker.Item label={t('sales.paymentMethods.bank_transfer')} value="bank_transfer" />
                        <Picker.Item label={t('sales.paymentMethods.cheque')} value="cheque" />
                        <Picker.Item label={t('sales.paymentMethods.other')} value="other" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <DatePickerInput
                      label={t('sales.paymentDate')}
                      value={paymentData.date}
                      onChange={(date) => setPaymentData({ ...paymentData, date })}
                      themeColor="#10b981"
                      required
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('common.notes')}</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      value={paymentData.notes}
                      onChangeText={(text) => setPaymentData({ ...paymentData, notes: text })}
                      placeholder={t('common.optional')}
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleAddPayment}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>{isSubmitting ? t('common.adding') : t('sales.addPayment')}</Text>
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
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
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
  summaryScroll: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    flexGrow: 4,
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    minWidth: 80,
    minHeight: 80,
    maxHeight: 85,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#888',
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  summarySubtext: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 0,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 55,
    height: 32,
    marginBottom: 16,
    maxHeight: 32,
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterTabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
  },
  saleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: {
    width: 3,
  },
  cardContent: {
    flex: 1,
    padding: 10,
  },
  saleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  customerName: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
  },
  saleMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  saleTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  saleTypeText: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  saleDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  paymentText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalItem: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  detailLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginBottom: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    color: '#10b981',
    fontSize: 13,
  },
  paymentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  paymentAmounts: {
    flex: 1,
  },
  paymentDetailLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  paidAmount: {
    fontWeight: '600',
    color: '#10b981',
  },
  pendingAmount: {
    fontWeight: '600',
    color: '#ef4444',
  },
  addPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addPaymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  paymentModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '85%',
  },
  paymentSummaryCard: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentSummaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentSummaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyState: {
    minHeight: 300,
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
    maxHeight: 450,
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
  saleTypeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  saleTypeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  saleTypeOptionActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  saleTypeOptionText: {
    fontSize: 12,
    color: '#666',
  },
  saleTypeOptionTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  timeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  timeOptionActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  timeTextActive: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  paymentSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  paymentOptionActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#666',
  },
  paymentOptionTextActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  totalPreview: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  totalPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  totalPreviewTextContainer: {
    flex: 1,
  },
  totalPreviewLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 2,
  },
  totalPreviewValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: -0.5,
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

export default MilkSales;