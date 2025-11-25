import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../utils/api';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      setReportData(response.data || {});
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching reports');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading reports...</Text>
      </View>
    );
  }

  if (!reportData) {
    return (
      <View style={styles.center}>
        <Text>No report data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reports</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milk Production Summary</Text>
        <Text>Total Production: {reportData.milkProduction?.total || 0} L</Text>
        <Text>This Month: {reportData.milkProduction?.thisMonth || 0} L</Text>
        <Text>Average Daily: {reportData.milkProduction?.averageDaily || 0} L</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Summary</Text>
        <Text>Total Sales: ${reportData.sales?.total || 0}</Text>
        <Text>This Month: ${reportData.sales?.thisMonth || 0}</Text>
        <Text>Pending Payments: ${reportData.sales?.pending || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses Summary</Text>
        <Text>Total Expenses: ${reportData.expenses?.total || 0}</Text>
        <Text>This Month: ${reportData.expenses?.thisMonth || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profit/Loss</Text>
        <Text>Total: ${reportData.profitLoss?.total || 0}</Text>
        <Text>This Month: ${reportData.profitLoss?.thisMonth || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Animal Statistics</Text>
        <Text>Total Animals: {reportData.animals?.total || 0}</Text>
        <Text>Male: {reportData.animals?.male || 0}</Text>
        <Text>Female: {reportData.animals?.female || 0}</Text>
        <Text>Active: {reportData.animals?.active || 0}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default Reports;