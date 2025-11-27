import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const Reports = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [reportType, setReportType] = useState('milk-yield');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    startDate: '',
    endDate: '',
    paymentFilter: 'all' // all, received, pending, partial
  });

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      if (reportType === 'milk-yield') {
        response = await api.get(`/reports/milk-yield?year=${filters.year}&month=${filters.month}`);
      } else if (reportType === 'profit-loss') {
        if (!filters.startDate || !filters.endDate) {
          Alert.alert('Error', 'Please select start and end dates');
          setLoading(false);
          return;
        }
        response = await api.get(`/reports/profit-loss?startDate=${filters.startDate}&endDate=${filters.endDate}`);
      } else if (reportType === 'animal-performance') {
        if (!filters.startDate || !filters.endDate) {
          Alert.alert('Error', 'Please select start and end dates');
          setLoading(false);
          return;
        }
        response = await api.get(`/reports/animal-performance?startDate=${filters.startDate}&endDate=${filters.endDate}`);
      } else if (reportType === 'customer-sales') {
        if (!customerName.trim()) {
          Alert.alert('Error', 'Please enter customer name');
          setLoading(false);
          return;
        }
        let queryParams = `customerName=${encodeURIComponent(customerName)}`;
        if (filters.startDate) queryParams += `&startDate=${filters.startDate}`;
        if (filters.endDate) queryParams += `&endDate=${filters.endDate}`;
        if (filters.paymentFilter !== 'all') queryParams += `&paymentStatus=${filters.paymentFilter}`;
        
        response = await api.get(`/milk/sales?${queryParams}`);
        
        // Process the sales data for customer report
        const salesData = response.data.data || [];
        const totalQuantity = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
        const totalAmount = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalPaid = salesData.reduce((sum, sale) => sum + (sale.amountPaid || 0), 0);
        const totalPending = salesData.reduce((sum, sale) => sum + (sale.amountPending || sale.totalAmount), 0);
        
        setReportData({
          customerName,
          sales: salesData,
          summary: {
            totalSales: salesData.length,
            totalQuantity: totalQuantity.toFixed(2),
            totalAmount: totalAmount.toFixed(0),
            totalPaid: totalPaid.toFixed(0),
            totalPending: totalPending.toFixed(0),
            averageRate: salesData.length > 0 ? (totalAmount / totalQuantity).toFixed(2) : 0
          }
        });
        setLoading(false);
        return;
      }
      setReportData(response.data);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching report');
      setLoading(false);
    }
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'milk-yield': return 'water-outline';
      case 'profit-loss': return 'cash-outline';
      case 'animal-performance': return 'analytics-outline';
      default: return 'document-outline';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#8b5cf6" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="bar-chart-outline" size={28} color="#8b5cf6" />
          <Text style={styles.title}>Reports</Text>
        </View>
      </View>

      {/* Report Type Selection */}
      <View style={styles.reportTypeContainer}>
        <TouchableOpacity 
          style={[styles.reportTypeButton, reportType === 'milk-yield' && styles.reportTypeActive]}
          onPress={() => { setReportType('milk-yield'); setReportData(null); }}
        >
          <Ionicons name="water-outline" size={20} color={reportType === 'milk-yield' ? '#fff' : '#2563eb'} />
          <Text style={[styles.reportTypeText, reportType === 'milk-yield' && styles.reportTypeTextActive]}>Milk Yield</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.reportTypeButton, reportType === 'profit-loss' && styles.reportTypeActive]}
          onPress={() => { setReportType('profit-loss'); setReportData(null); }}
        >
          <Ionicons name="cash-outline" size={20} color={reportType === 'profit-loss' ? '#fff' : '#2563eb'} />
          <Text style={[styles.reportTypeText, reportType === 'profit-loss' && styles.reportTypeTextActive]}>Profit/Loss</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.reportTypeButton, reportType === 'animal-performance' && styles.reportTypeActive]}
          onPress={() => { setReportType('animal-performance'); setReportData(null); }}
        >
          <Ionicons name="analytics-outline" size={20} color={reportType === 'animal-performance' ? '#fff' : '#2563eb'} />
          <Text style={[styles.reportTypeText, reportType === 'animal-performance' && styles.reportTypeTextActive]}>Performance</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.reportTypeButton, reportType === 'customer-sales' && styles.reportTypeActive]}
          onPress={() => { setReportType('customer-sales'); setReportData(null); }}
        >
          <Ionicons name="person-outline" size={20} color={reportType === 'customer-sales' ? '#fff' : '#2563eb'} />
          <Text style={[styles.reportTypeText, reportType === 'customer-sales' && styles.reportTypeTextActive]}>Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>
          <Ionicons name="filter-outline" size={18} color="#666" /> Filters
        </Text>

        {reportType === 'milk-yield' ? (
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Year</Text>
              <TextInput
                style={styles.filterInput}
                value={filters.year}
                onChangeText={(text) => setFilters({ ...filters, year: text })}
                keyboardType="numeric"
                placeholder="2025"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Month</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.month}
                  onValueChange={(value) => setFilters({ ...filters, month: value })}
                  style={styles.picker}
                >
                  {months.map(m => (
                    <Picker.Item key={m.value} label={m.label} value={m.value} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        ) : reportType === 'customer-sales' ? (
          <>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Customer Name *</Text>
              <TextInput
                style={styles.filterInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter customer name"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <DatePickerInput
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => setFilters({ ...filters, startDate: date })}
                  themeColor="#3b82f6"
                />
              </View>
              <View style={styles.filterGroup}>
                <DatePickerInput
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => setFilters({ ...filters, endDate: date })}
                  themeColor="#3b82f6"
                />
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Payment Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.paymentFilter}
                  onValueChange={(value) => setFilters({ ...filters, paymentFilter: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="All" value="all" />
                  <Picker.Item label="Received" value="received" />
                  <Picker.Item label="Partial" value="partial" />
                  <Picker.Item label="Pending" value="pending" />
                </Picker>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <DatePickerInput
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date })}
                themeColor="#3b82f6"
              />
            </View>
            <View style={styles.filterGroup}>
              <DatePickerInput
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date })}
                themeColor="#3b82f6"
              />
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.generateButton, loading && styles.generateButtonDisabled]} 
          onPress={fetchReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={20} color="white" />
              <Text style={styles.generateButtonText}>Generate Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Report Results */}
      {reportData && (
        <View style={styles.resultsContainer}>
          {/* Milk Yield Report */}
          {reportType === 'milk-yield' && reportData.summary && (
            <>
              <Text style={styles.resultsTitle}>Monthly Milk Yield Report</Text>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, styles.summaryCardBlue]}>
                  <Ionicons name="water" size={28} color="#2563eb" />
                  <Text style={styles.summaryLabel}>Total Yield</Text>
                  <Text style={[styles.summaryValue, { color: '#2563eb' }]}>
                    {Number(reportData.summary.totalYield || 0).toFixed(2)} L
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                  <Ionicons name="cash" size={28} color="#10b981" />
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                    Rs {Number(reportData.summary.totalRevenue || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardRed]}>
                  <Ionicons name="trending-down" size={28} color="#ef4444" />
                  <Text style={styles.summaryLabel}>Total Expenses</Text>
                  <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                    Rs {Number(reportData.summary.totalExpenses || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.summaryCard, (reportData.summary.profit || 0) >= 0 ? styles.summaryCardGreen : styles.summaryCardRed]}>
                  <Ionicons name="trending-up" size={28} color={(reportData.summary.profit || 0) >= 0 ? '#10b981' : '#ef4444'} />
                  <Text style={styles.summaryLabel}>Net Profit</Text>
                  <Text style={[styles.summaryValue, { color: (reportData.summary.profit || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
                    Rs {Number(reportData.summary.profit || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Profit/Loss Report */}
          {reportType === 'profit-loss' && reportData.profitLoss && (
            <>
              <Text style={styles.resultsTitle}>Profit & Loss Report</Text>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                  <Ionicons name="arrow-up-circle" size={28} color="#10b981" />
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                    Rs {Number(reportData.revenue?.total || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardRed]}>
                  <Ionicons name="arrow-down-circle" size={28} color="#ef4444" />
                  <Text style={styles.summaryLabel}>Total Expenses</Text>
                  <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                    Rs {Number(reportData.expenses?.total || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.fullWidth, reportData.profitLoss.status === 'profit' ? styles.summaryCardGreen : styles.summaryCardRed]}>
                  <Ionicons 
                    name={reportData.profitLoss.status === 'profit' ? 'trending-up' : 'trending-down'} 
                    size={32} 
                    color={reportData.profitLoss.status === 'profit' ? '#10b981' : '#ef4444'} 
                  />
                  <Text style={styles.summaryLabel}>
                    Net {reportData.profitLoss.status === 'profit' ? 'Profit' : 'Loss'}
                  </Text>
                  <Text style={[styles.summaryValueLarge, { color: reportData.profitLoss.status === 'profit' ? '#10b981' : '#ef4444' }]}>
                    Rs {Number(Math.abs(reportData.profitLoss.netProfit || 0)).toFixed(2)}
                  </Text>
                  <Text style={styles.marginText}>
                    Margin: {reportData.profitLoss.profitMargin}%
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Animal Performance Report */}
          {reportType === 'animal-performance' && reportData.animals && (
            <>
              <Text style={styles.resultsTitle}>Animal Performance Report</Text>
              {reportData.animals.length > 0 ? (
                reportData.animals.map((animal, index) => (
                  <View key={animal._id || index} style={styles.animalCard}>
                    <View style={styles.animalHeader}>
                      <Text style={styles.animalTag}>{animal.tagNumber || 'N/A'}</Text>
                      <Text style={styles.animalName}>{animal.name || animal.breed}</Text>
                    </View>
                    <View style={styles.animalStats}>
                      <View style={styles.animalStat}>
                        <Text style={styles.animalStatLabel}>Total Yield</Text>
                        <Text style={styles.animalStatValue}>{Number(animal.totalYield || 0).toFixed(2)} L</Text>
                      </View>
                      <View style={styles.animalStat}>
                        <Text style={styles.animalStatLabel}>Avg Daily</Text>
                        <Text style={styles.animalStatValue}>{Number(animal.avgDailyYield || 0).toFixed(2)} L</Text>
                      </View>
                      <View style={styles.animalStat}>
                        <Text style={styles.animalStatLabel}>Days</Text>
                        <Text style={styles.animalStatValue}>{animal.daysProduced || 0}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noData}>
                  <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
                  <Text style={styles.noDataText}>No animal performance data available</Text>
                </View>
              )}
            </>
          )}

          {/* Customer Sales Report */}
          {reportType === 'customer-sales' && reportData.summary && (
            <>
              <Text style={styles.resultsTitle}>Customer Sales Report: {reportData.customerName}</Text>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, styles.summaryCardBlue]}>
                  <Ionicons name="cart" size={28} color="#2563eb" />
                  <Text style={styles.summaryLabel}>Total Sales</Text>
                  <Text style={[styles.summaryValue, { color: '#2563eb' }]}>
                    {reportData.summary.totalSales}
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardYellow]}>
                  <Ionicons name="water" size={28} color="#f59e0b" />
                  <Text style={styles.summaryLabel}>Total Quantity</Text>
                  <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
                    {reportData.summary.totalQuantity} L
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardPurple]}>
                  <Ionicons name="cash" size={28} color="#8b5cf6" />
                  <Text style={styles.summaryLabel}>Avg Rate</Text>
                  <Text style={[styles.summaryValue, { color: '#8b5cf6' }]}>
                    Rs {reportData.summary.averageRate}
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                  <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                    Rs {reportData.summary.totalAmount}
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                  <Ionicons name="checkmark-done" size={28} color="#10b981" />
                  <Text style={styles.summaryLabel}>Amount Paid</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                    Rs {reportData.summary.totalPaid}
                  </Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardRed]}>
                  <Ionicons name="time" size={28} color="#ef4444" />
                  <Text style={styles.summaryLabel}>Amount Pending</Text>
                  <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                    Rs {reportData.summary.totalPending}
                  </Text>
                </View>
              </View>

              {/* Sales List */}
              <Text style={styles.sectionTitle}>Sale Details</Text>
              {reportData.sales && reportData.sales.length > 0 ? (
                reportData.sales.map((sale, index) => (
                  <View key={sale._id || index} style={styles.saleDetailCard}>
                    <View style={styles.saleDetailHeader}>
                      <Text style={styles.saleDetailDate}>
                        {new Date(sale.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                      <View style={[styles.salePaymentBadge, { 
                        backgroundColor: sale.paymentStatus === 'received' ? '#d1fae5' : sale.paymentStatus === 'partial' ? '#fef3c7' : '#fee2e2' 
                      }]}>
                        <Text style={[styles.salePaymentText, { 
                          color: sale.paymentStatus === 'received' ? '#10b981' : sale.paymentStatus === 'partial' ? '#f59e0b' : '#ef4444' 
                        }]}>
                          {sale.paymentStatus}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.saleDetailRow}>
                      <Text style={styles.saleDetailLabel}>Quantity:</Text>
                      <Text style={styles.saleDetailValue}>{sale.quantity} L</Text>
                    </View>
                    <View style={styles.saleDetailRow}>
                      <Text style={styles.saleDetailLabel}>Rate:</Text>
                      <Text style={styles.saleDetailValue}>Rs {sale.ratePerLiter?.toFixed(0)}</Text>
                    </View>
                    <View style={styles.saleDetailRow}>
                      <Text style={styles.saleDetailLabel}>Total:</Text>
                      <Text style={[styles.saleDetailValue, { fontWeight: 'bold' }]}>Rs {sale.totalAmount?.toFixed(0)}</Text>
                    </View>
                    {sale.paymentStatus !== 'received' && (
                      <>
                        <View style={styles.saleDetailRow}>
                          <Text style={styles.saleDetailLabel}>Paid:</Text>
                          <Text style={[styles.saleDetailValue, { color: '#10b981' }]}>Rs {sale.amountPaid || 0}</Text>
                        </View>
                        <View style={styles.saleDetailRow}>
                          <Text style={styles.saleDetailLabel}>Pending:</Text>
                          <Text style={[styles.saleDetailValue, { color: '#ef4444', fontWeight: 'bold' }]}>Rs {sale.amountPending || sale.totalAmount}</Text>
                        </View>
                      </>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.noData}>
                  <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
                  <Text style={styles.noDataText}>No sales found for this customer</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name={getReportTypeIcon(reportType)} size={64} color="#ddd" />
          <Text style={styles.emptyStateText}>Select filters and generate a report</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f3ff',
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 10,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  reportTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2563eb',
    gap: 6,
  },
  reportTypeActive: {
    backgroundColor: '#2563eb',
  },
  reportTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  reportTypeTextActive: {
    color: 'white',
  },
  filtersCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterInput: {
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidth: {
    width: '100%',
  },
  summaryCardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  summaryCardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  summaryCardRed: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  summaryCardYellow: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  summaryCardPurple: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryValueLarge: {
    fontSize: 28,
    fontWeight: '700',
  },
  marginText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  animalCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  animalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  animalTag: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
    marginRight: 12,
  },
  animalName: {
    fontSize: 14,
    color: '#666',
  },
  animalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  animalStat: {
    alignItems: 'center',
  },
  animalStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  animalStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  noData: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 12,
  },
  saleDetailCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saleDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  saleDetailDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  salePaymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  salePaymentText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  saleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  saleDetailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  saleDetailValue: {
    fontSize: 13,
    color: '#1e293b',
  },
});

export default Reports;