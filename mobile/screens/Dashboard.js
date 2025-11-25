import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 50) / 2;

const Dashboard = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data.dashboard || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const stats = [
    {
      title: 'Total Animals',
      value: dashboardData?.animals?.total || 0,
      icon: 'paw',
      color: ['#FF6B6B', '#FF8E72'],
      details: `${dashboardData?.animals?.male || 0} Male, ${dashboardData?.animals?.female || 0} Female`
    },
    {
      title: 'Milk This Month',
      value: `${dashboardData?.milk?.thisMonth || 0}L`,
      icon: 'water',
      color: ['#4ECDC4', '#44A08D'],
      details: `Avg: ${dashboardData?.milk?.averageDaily || 0}L/day`
    },
    {
      title: 'Sales This Month',
      value: `$${dashboardData?.sales?.thisMonth || 0}`,
      icon: 'cash',
      color: ['#95E1D3', '#38A169'],
      details: `Total: $${dashboardData?.sales?.total || 0}`
    },
    {
      title: 'Expenses This Month',
      value: `$${dashboardData?.expenses?.thisMonth || 0}`,
      icon: 'calculator',
      color: ['#F38181', '#AA96DA'],
      details: `Total: $${dashboardData?.expenses?.total || 0}`
    },
  ];

  const renderStatCard = (stat, index) => (
    <TouchableOpacity key={index} activeOpacity={0.7}>
      <LinearGradient colors={stat.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
        <View style={styles.cardHeader}>
          <Ionicons name={stat.icon} size={32} color="white" />
          <Text style={styles.statTitle}>{stat.title}</Text>
        </View>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statDetails}>{stat.details}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Farm Overview</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => renderStatCard(stat, index))}
      </View>

      <View style={styles.profitSection}>
        <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profitCard}>
          <View style={styles.profitHeader}>
            <Ionicons name="trending-up" size={40} color="white" />
            <Text style={styles.profitLabel}>Profit/Loss</Text>
          </View>
          <Text style={styles.profitValue}>${dashboardData?.profitLoss?.thisMonth || 0}</Text>
          <Text style={styles.profitDetails}>This Month (Total: ${dashboardData?.profitLoss?.total || 0})</Text>
        </LinearGradient>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Animals')}>
          <Ionicons name="paw" size={24} color="white" />
          <Text style={styles.actionButtonText}>Animals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Milk Production')}>
          <Ionicons name="water" size={24} color="white" />
          <Text style={styles.actionButtonText}>Milk</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Expenses')}>
          <Ionicons name="calculator" size={24} color="white" />
          <Text style={styles.actionButtonText}>Expenses</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    width: cardWidth,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statDetails: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  profitSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profitCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profitLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 12,
    fontWeight: '600',
  },
  profitValue: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  profitDetails: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.31,
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});

export default Dashboard;