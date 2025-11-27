import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const Dashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#94a3b8" />
          <Text style={styles.emptyTitle}>{t('common.noData')}</Text>
          <Text style={styles.emptySubtitle}>{t('common.pullToRefresh')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.retryButtonText}>{t('common.tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { animals = {}, milk = {}, sales = {}, expenses = {}, profitLoss = {} } = dashboardData;

  const stats = [
    {
      title: t('dashboard.totalAnimals'),
      value: animals.total || 0,
      icon: 'paw',
      details: `${animals.male || 0} ${t('dashboard.male')} • ${animals.female || 0} ${t('dashboard.female')}`,
      gradient: ['#f97316', '#ea580c'],
      iconBg: 'rgba(255,255,255,0.2)',
    },
    {
      title: t('dashboard.todayMilk'),
      value: `${Number(milk.todayYield || 0).toFixed(1)}L`,
      icon: 'water',
      details: `${Number(milk.yieldTrend || 0) >= 0 ? '↑' : '↓'} ${Number(Math.abs(milk.yieldTrend || 0)).toFixed(1)}% from yesterday`,
      gradient: ['#06b6d4', '#0891b2'],
      iconBg: 'rgba(255,255,255,0.2)',
    },
    {
      title: t('dashboard.monthRevenue'),
      value: `Rs ${Number(sales.monthRevenue || 0).toLocaleString()}`,
      icon: 'trending-up',
      details: `${Number(sales.revenueTrend || 0) >= 0 ? '↑' : '↓'} ${Number(Math.abs(sales.revenueTrend || 0)).toFixed(1)}% vs last month`,
      gradient: ['#22c55e', '#16a34a'],
      iconBg: 'rgba(255,255,255,0.2)',
    },
    {
      title: profitLoss.status === 'profit' ? t('dashboard.monthlyProfit') : t('dashboard.monthlyLoss'),
      value: `Rs ${Number(profitLoss.monthProfit || 0).toLocaleString()}`,
      icon: profitLoss.status === 'profit' ? 'arrow-up-circle' : 'arrow-down-circle',
      details: `${profitLoss.profitMargin || 0}% profit margin`,
      gradient: profitLoss.status === 'profit' ? ['#8b5cf6', '#7c3aed'] : ['#ef4444', '#dc2626'],
      iconBg: 'rgba(255,255,255,0.2)',
    },
  ];

  const renderStatCard = (stat, index) => (
    <TouchableOpacity key={index} activeOpacity={0.85} style={styles.statCardWrapper}>
      <LinearGradient 
        colors={stat.gradient} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.statCard}
      >
        <View style={[styles.cardIconContainer, { backgroundColor: stat.iconBg }]}>
          <Ionicons name={stat.icon} size={24} color="white" />
        </View>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statTitle}>{stat.title}</Text>
        <View style={styles.statDetailsContainer}>
          <Text style={styles.statDetails} numberOfLines={1}>{stat.details}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#3b82f6']}
          tintColor="#3b82f6"
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>{t('common.welcome')} 👋</Text>
            <Text style={styles.headerTitle}>{t('dashboard.title')}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            {dashboardData.alerts?.upcomingVaccinations?.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {dashboardData.alerts.upcomingVaccinations.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.todaySummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{animals.total || 0}</Text>
            <Text style={styles.summaryLabel}>{t('dashboard.animals')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Number(milk.todayYield || 0).toFixed(0)}L</Text>
            <Text style={styles.summaryLabel}>{t('dashboard.todayMilk')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>Rs {Number(profitLoss.monthProfit || 0).toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>{t('dashboard.profit')}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => renderStatCard(stat, index))}
      </View>

      {/* Weekly Milk Trend Summary */}
      {milk.weeklyTrend && milk.weeklyTrend.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="bar-chart" size={18} color="#2563eb" />
            </View>
            <Text style={styles.sectionTitle}>{t('dashboard.weeklyMilk')}</Text>
          </View>
          <View style={styles.trendContainer}>
            {milk.weeklyTrend.slice(-7).map((item, index) => {
              const maxYield = Math.max(...milk.weeklyTrend.slice(-7).map(i => i.totalYield || 0));
              const barHeight = maxYield > 0 ? ((item.totalYield || 0) / maxYield) * 70 : 10;
              return (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendValue}>{Number(item.totalYield || 0).toFixed(0)}</Text>
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    style={[styles.trendBar, { height: Math.max(barHeight, 10) }]}
                  />
                  <Text style={styles.trendLabel}>{item._id?.slice(-2) || ''}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Expense Summary */}
      {expenses.byCategory && Object.keys(expenses.byCategory).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="wallet" size={18} color="#d97706" />
            </View>
            <Text style={styles.sectionTitle}>Monthly Expenses</Text>
            <Text style={styles.sectionTotal}>Rs {Number(expenses.monthTotal || 0).toLocaleString()}</Text>
          </View>
          {Object.keys(expenses.byCategory).map((category, index) => (
            <View key={index} style={styles.expenseRow}>
              <View style={styles.expenseLeft}>
                <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(index) }]} />
                <Text style={styles.expenseCategory}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>
                Rs {Number(expenses.byCategory[category] || 0).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Sales Distribution by Customer */}
      {sales.salesByCustomer && Object.keys(sales.salesByCustomer).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="people" size={18} color="#16a34a" />
            </View>
            <Text style={styles.sectionTitle}>Sales by Customer</Text>
          </View>
          {Object.entries(sales.salesByCustomer).map(([customer, customerData], index) => {
            const getSaleTypeIcon = (type) => {
              switch(type) {
                case 'bandhi': return 'business';
                case 'mandi': return 'storefront';
                case 'door_to_door': return 'home';
                default: return 'cart';
              }
            };
            return (
              <View key={index} style={styles.salesRow}>
                <View style={styles.salesLeft}>
                  <View style={styles.salesTypeIcon}>
                    <Ionicons 
                      name={getSaleTypeIcon(customerData.saleType)} 
                      size={16} 
                      color="#16a34a" 
                    />
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.salesType}>{customer || 'Unknown Customer'}</Text>
                    <Text style={styles.salesQty}>
                      {Number(customerData.quantity || 0).toFixed(1)}L • {customerData.count || 0} {customerData.count === 1 ? 'sale' : 'sales'}
                    </Text>
                  </View>
                </View>
                <View style={styles.salesRight}>
                  <Text style={styles.salesRevenue}>
                    Rs {Number(customerData.revenue || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Sales Distribution by Type (fallback) */}
      {(!sales.salesByCustomer || Object.keys(sales.salesByCustomer).length === 0) && sales.salesByType && Object.keys(sales.salesByType).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="cart" size={18} color="#16a34a" />
            </View>
            <Text style={styles.sectionTitle}>Sales Distribution</Text>
          </View>
          {Object.keys(sales.salesByType).map((type, index) => (
            <View key={index} style={styles.salesRow}>
              <View style={styles.salesLeft}>
                <View style={styles.salesTypeIcon}>
                  <Ionicons 
                    name={type === 'bandhi' ? 'business' : type === 'mandi' ? 'storefront' : 'home'} 
                    size={16} 
                    color="#16a34a" 
                  />
                </View>
                <View>
                  <Text style={styles.salesType}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </Text>
                  <Text style={styles.salesQty}>{sales.salesByType[type].quantity || 0} Liters</Text>
                </View>
              </View>
              <View style={styles.salesRight}>
                <Text style={styles.salesRevenue}>
                  Rs {Number(sales.salesByType[type].revenue || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Alerts Section */}
      {dashboardData.alerts?.upcomingVaccinations?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="medical" size={18} color="#dc2626" />
            </View>
            <Text style={styles.sectionTitle}>Upcoming Vaccinations</Text>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{dashboardData.alerts.upcomingVaccinations.length}</Text>
            </View>
          </View>
          {dashboardData.alerts.upcomingVaccinations.map((vacc, index) => (
            <View key={index} style={styles.alertItem}>
              <View style={[styles.alertIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="medical" size={20} color="#d97706" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{vacc.animalId?.tagNumber || 'Unknown'}</Text>
                <Text style={styles.alertSubtitle}>{vacc.vaccineName}</Text>
              </View>
              <View style={styles.alertDateContainer}>
                <Text style={styles.alertDate}>{new Date(vacc.nextDueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Calves */}
      {dashboardData.alerts?.recentCalves?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="paw" size={18} color="#2563eb" />
            </View>
            <Text style={styles.sectionTitle}>Recent Calves</Text>
          </View>
          {dashboardData.alerts.recentCalves.map((calf, index) => (
            <View key={index} style={styles.alertItem}>
              <View style={[styles.alertIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="paw" size={20} color="#2563eb" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{calf.animalId?.tagNumber || 'Unknown'}</Text>
                <Text style={styles.alertSubtitle}>{calf.gender} Calf</Text>
              </View>
              <View style={styles.calfWeight}>
                <Text style={styles.weightValue}>{calf.birthWeight}</Text>
                <Text style={styles.weightUnit}>kg</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('Animals')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f97316', '#ea580c']}
              style={styles.actionGradient}
            >
              <Ionicons name="paw" size={24} color="white" />
              <Text style={styles.actionButtonText}>{t('dashboard.animals')}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('Milk')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#06b6d4', '#0891b2']}
              style={styles.actionGradient}
            >
              <Ionicons name="water" size={24} color="white" />
              <Text style={styles.actionButtonText}>{t('dashboard.milk')}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('Sales')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.actionGradient}
            >
              <Ionicons name="cash" size={24} color="white" />
              <Text style={styles.actionButtonText}>{t('dashboard.sales')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const getCategoryColor = (index) => {
  const colors = ['#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4'];
  return colors[index % colors.length];
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
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  todaySummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  statCardWrapper: {
    width: cardWidth,
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 8,
  },
  statDetailsContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statDetails: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  alertBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendBar: {
    width: 28,
    borderRadius: 8,
    minHeight: 10,
  },
  trendLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '600',
  },
  trendValue: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: '500',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  salesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  salesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  salesTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  salesType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  salesQty: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  salesRight: {
    alignItems: 'flex-end',
  },
  salesRevenue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  alertDateContainer: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  alertDate: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
  },
  calfWeight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  weightUnit: {
    fontSize: 12,
    color: '#2563eb',
    marginLeft: 2,
  },
  quickActionsSection: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  bottomPadding: {
    height: 30,
  },
});

export default Dashboard;