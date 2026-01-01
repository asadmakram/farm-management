import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, TextInput, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const { width } = Dimensions.get('window');

const FeedCalculations = () => {
  const insets = useSafeAreaInsets();
  const [feedItems, setFeedItems] = useState([]);
  const [feedCalculations, setFeedCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('feedItem'); // 'feedItem', 'calculation', 'feedChart', or 'chartCalculations'
  const [editingItem, setEditingItem] = useState(null);
  const [feedCharts, setFeedCharts] = useState([]);
  const [selectedFeedChart, setSelectedFeedChart] = useState(null);
  const [feedChartCalculations, setFeedChartCalculations] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantityPerBag: '',
    pricePerBag: '',
    description: '',
    feedItemId: '',
    quantityPerTime: '',
    quantityPerDay: '',
    quantityPer10Days: '',
    quantityPer30Days: '',
    numberOfAnimals: '',
    chartName: '',
    chartFeedItems: [],
    chartNumberOfAnimals: '',
    chartDuration: '10'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsResponse, calculationsResponse, chartsResponse] = await Promise.all([
        api.get('/feed-items'),
        api.get('/feed-calculations'),
        api.get('/feed-charts')
      ]);
      setFeedItems(itemsResponse.data);
      setFeedCalculations(calculationsResponse.data);
      setFeedCharts(chartsResponse.data);
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

  const fetchFeedChartCalculations = async (chartId, duration) => {
    try {
      const response = await api.get(`/feed-charts/${chartId}/calculations/${duration}`);
      setFeedChartCalculations(response.data);
      return response.data;
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error fetching feed chart calculations');
      return null;
    }
  };

  const handleSubmit = async () => {
    if (modalType === 'feedItem') {
      if (!formData.name || !formData.quantityPerBag || !formData.pricePerBag) {
        Alert.alert('Error', 'Please fill in required fields (Name, Quantity per Bag, Price per Bag)');
        return;
      }
      
      try {
        const payload = {
          name: formData.name,
          quantityPerBag: Number(formData.quantityPerBag),
          pricePerBag: Number(formData.pricePerBag),
          description: formData.description
        };

        if (editingItem) {
          await api.put(`/feed-items/${editingItem._id}`, payload);
          Alert.alert('Success', 'Feed item updated successfully');
        } else {
          await api.post('/feed-items', payload);
          Alert.alert('Success', 'Feed item added successfully');
        }
        fetchData();
        closeModal();
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Error saving feed item');
      }
    } else if (modalType === 'calculation') {
      // Calculation submission
      if (!formData.feedItemId || !formData.quantityPerTime || !formData.quantityPerDay ||
          !formData.quantityPer10Days || !formData.quantityPer30Days || !formData.numberOfAnimals) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      try {
        const payload = {
          feedItemId: formData.feedItemId,
          quantityPerTime: Number(formData.quantityPerTime),
          quantityPerDay: Number(formData.quantityPerDay),
          quantityPer10Days: Number(formData.quantityPer10Days),
          quantityPer30Days: Number(formData.quantityPer30Days),
          numberOfAnimals: Number(formData.numberOfAnimals)
        };

        if (editingItem) {
          await api.put(`/feed-calculations/${editingItem._id}`, payload);
          Alert.alert('Success', 'Calculation updated successfully');
        } else {
          await api.post('/feed-calculations', payload);
          Alert.alert('Success', 'Calculation added successfully');
        }
        fetchData();
        closeModal();
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Error saving calculation');
      }
    } else if (modalType === 'feedChart') {
      // Feed chart submission
      if (!formData.chartName || !formData.chartNumberOfAnimals || formData.chartFeedItems.length === 0) {
        Alert.alert('Error', 'Please fill in all required fields and add at least one feed item');
        return;
      }
      
      try {
        const payload = {
          name: formData.chartName,
          numberOfAnimals: Number(formData.chartNumberOfAnimals),
          feedItems: formData.chartFeedItems.map(item => ({
            feedItemId: item.feedItemId,
            quantityPerTime: Number(item.quantityPerTime)
          }))
        };

        if (editingItem) {
          await api.put(`/feed-charts/${editingItem._id}`, payload);
          Alert.alert('Success', 'Feed chart updated successfully');
        } else {
          await api.post('/feed-charts', payload);
          Alert.alert('Success', 'Feed chart added successfully');
        }
        fetchData();
        closeModal();
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Error saving feed chart');
      }
    }
  };

  const handleViewChartCalculations = async (chart) => {
    setSelectedFeedChart(chart);
    setModalType('chartCalculations');
    setShowModal(true);
    
    // Fetch calculations for the default duration (10 days)
    await fetchFeedChartCalculations(chart._id, '10');
  };

  const handleDelete = async (id, type) => {
    const typeName = type === 'feedItem' ? 'feed item' : 'calculation';
    const endpoint = type === 'feedItem' ? 'feed-items' : 'feed-calculations';
    
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this ${typeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/${endpoint}/${id}`);
              Alert.alert('Success', `${typeName.charAt(0).toUpperCase() + typeName.slice(1)} deleted successfully`);
              fetchData();
            } catch (error) {
              Alert.alert('Error', `Error deleting ${typeName}`);
            }
          }
        }
      ]
    );
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    
    if (type === 'feedItem') {
      if (item) {
        setFormData({
          name: item.name || '',
          quantityPerBag: item.quantityPerBag?.toString() || '',
          pricePerBag: item.pricePerBag?.toString() || '',
          description: item.description || '',
          feedItemId: '',
          quantityPerTime: '',
          quantityPerDay: '',
          quantityPer10Days: '',
          quantityPer30Days: '',
          numberOfAnimals: '',
          chartName: '',
          chartFeedItems: [],
          chartNumberOfAnimals: ''
        });
      } else {
        setFormData({
          name: '',
          quantityPerBag: '',
          pricePerBag: '',
          description: '',
          feedItemId: '',
          quantityPerTime: '',
          quantityPerDay: '',
          quantityPer10Days: '',
          quantityPer30Days: '',
          numberOfAnimals: '',
          chartName: '',
          chartFeedItems: [],
          chartNumberOfAnimals: ''
        });
      }
    } else if (type === 'calculation') {
      if (item) {
        setFormData({
          name: '',
          quantityPerBag: '',
          pricePerBag: '',
          description: '',
          feedItemId: item.feedItemId?._id || '',
          quantityPerTime: item.quantityPerTime?.toString() || '',
          quantityPerDay: item.quantityPerDay?.toString() || '',
          quantityPer10Days: item.quantityPer10Days?.toString() || '',
          quantityPer30Days: item.quantityPer30Days?.toString() || '',
          numberOfAnimals: item.numberOfAnimals?.toString() || '',
          chartName: '',
          chartFeedItems: [],
          chartNumberOfAnimals: ''
        });
      } else {
        setFormData({
          name: '',
          quantityPerBag: '',
          pricePerBag: '',
          description: '',
          feedItemId: '',
          quantityPerTime: '',
          quantityPerDay: '',
          quantityPer10Days: '',
          quantityPer30Days: '',
          numberOfAnimals: '',
          chartName: '',
          chartFeedItems: [],
          chartNumberOfAnimals: ''
        });
      }
    } else if (type === 'feedChart') {
      if (item) {
        setFormData({
          name: '',
          quantityPerBag: '',
          pricePerBag: '',
          description: '',
          feedItemId: '',
          quantityPerTime: '',
          quantityPerDay: '',
          quantityPer10Days: '',
          quantityPer30Days: '',
          numberOfAnimals: '',
          chartName: item.name || '',
          chartFeedItems: item.feedItems?.map(fi => ({
            feedItemId: fi.feedItemId?._id || fi.feedItemId,
            quantityPerTime: fi.quantityPerTime?.toString() || ''
          })) || [],
          chartNumberOfAnimals: item.numberOfAnimals?.toString() || ''
        });
      } else {
        setFormData({
          name: '',
          quantityPerBag: '',
          pricePerBag: '',
          description: '',
          feedItemId: '',
          quantityPerTime: '',
          quantityPerDay: '',
          quantityPer10Days: '',
          quantityPer30Days: '',
          numberOfAnimals: '',
          chartName: '',
          chartFeedItems: [],
          chartNumberOfAnimals: ''
        });
      }
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const addFeedItemToChart = () => {
    if (!formData.feedItemId || !formData.quantityPerTime) {
      Alert.alert('Error', 'Please select a feed item and enter quantity per time');
      return;
    }
    
    // Check if this feed item is already in the chart
    const existingItemIndex = formData.chartFeedItems.findIndex(
      item => item.feedItemId === formData.feedItemId
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.chartFeedItems];
      updatedItems[existingItemIndex] = {
        feedItemId: formData.feedItemId,
        quantityPerTime: formData.quantityPerTime
      };
      setFormData({ ...formData, chartFeedItems: updatedItems, feedItemId: '', quantityPerTime: '' });
    } else {
      // Add new item
      setFormData({
        ...formData,
        chartFeedItems: [...formData.chartFeedItems, {
          feedItemId: formData.feedItemId,
          quantityPerTime: formData.quantityPerTime
        }],
        feedItemId: '',
        quantityPerTime: ''
      });
    }
  };

  const removeFeedItemFromChart = (index) => {
    const updatedItems = [...formData.chartFeedItems];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, chartFeedItems: updatedItems });
  };

  const renderFeedItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: '#10b981' }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.itemMainInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{item.name?.slice(0, 2).toUpperCase() || '??'}</Text>
              </LinearGradient>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSubtitle}>{item.description || 'No description'}</Text>
            </View>
          </View>
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusBadge}
          >
            <Text style={styles.statusText}>Active</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="cube" size={14} color="#10b981" />
            </View>
            <View>
              <Text style={styles.statLabel}>Qty/Bag</Text>
              <Text style={styles.statValue}>{item.quantityPerBag} kg</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="pricetag" size={14} color="#10b981" />
            </View>
            <View>
              <Text style={styles.statLabel}>Price</Text>
              <Text style={styles.statValue}>Rs {item.pricePerBag}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => openModal('feedItem', item)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color="#3b82f6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id, 'feedItem')} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCalculation = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: '#3b82f6' }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.itemMainInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{item.feedItemId?.name?.slice(0, 2).toUpperCase() || '??'}</Text>
              </LinearGradient>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.feedItemId?.name || 'Unknown Feed'}</Text>
              <Text style={styles.itemSubtitle}>{item.numberOfAnimals} animals</Text>
            </View>
          </View>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusBadge}
          >
            <Text style={styles.statusText}>Calculation</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="time" size={14} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Per Time</Text>
              <Text style={styles.statValue}>{item.quantityPerTime} kg</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="sunny" size={14} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Per Day</Text>
              <Text style={styles.statValue}>{item.quantityPerDay} kg</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="calendar" size={14} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statLabel}>10 Days</Text>
              <Text style={styles.statValue}>{item.quantityPer10Days} kg</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="calendar" size={14} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statLabel}>30 Days</Text>
              <Text style={styles.statValue}>{item.quantityPer30Days} kg</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="cash" size={14} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Cost/10D</Text>
              <Text style={styles.statValue}>Rs {item.costPer10Days}</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="cash" size={14} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Cost/30D</Text>
              <Text style={styles.statValue}>Rs {item.costPer30Days}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => openModal('calculation', item)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color="#3b82f6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id, 'calculation')} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Feed Management</Text>
            <Text style={styles.headerTitle}>Feed Calculations</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.addButton} onPress={() => openModal('feedItem')}>
              <Ionicons name="add" size={20} color="#10b981" />
              <Text style={styles.addButtonText}>Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => openModal('calculation')}>
              <Ionicons name="calculator" size={20} color="#10b981" />
              <Text style={styles.addButtonText}>Calc</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => openModal('feedChart')}>
              <Ionicons name="list" size={20} color="#10b981" />
              <Text style={styles.addButtonText}>Chart</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.statsRowHeader}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{feedItems.length}</Text>
            <Text style={styles.headerStatLabel}>Feed Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{feedCalculations.length}</Text>
            <Text style={styles.headerStatLabel}>Calculations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{feedCharts.length}</Text>
            <Text style={styles.headerStatLabel}>Feed Charts</Text>
          </View>
        </View>
      </LinearGradient>

      {feedItems.length > 0 || feedCalculations.length > 0 ? (
        <FlatList
          data={[...feedItems, ...feedCalculations]}
          renderItem={({ item }) => {
            if (item.quantityPerBag) {
              return renderFeedItem({ item });
            } else {
              return renderCalculation({ item });
            }
          }}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#10b981']}
              tintColor="#10b981"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="calculator-outline" size={48} color="#10b981" />
          </View>
          <Text style={styles.emptyStateTitle}>No Feed Data</Text>
          <Text style={styles.emptyStateText}>Start by adding feed items and calculations</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => openModal('feedItem')} activeOpacity={0.8}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>Add First Feed</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal for Add/Edit */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{
                modalType === 'feedItem' ? (editingItem ? 'Edit Feed Item' : 'Add Feed Item') :
                modalType === 'calculation' ? (editingItem ? 'Edit Calculation' : 'Add Calculation') :
                modalType === 'feedChart' ? (editingItem ? 'Edit Feed Chart' : 'Add Feed Chart') :
                'Feed Chart Calculations'
              }</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {modalType === 'feedItem' ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      placeholder="Enter feed name"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  
                  <View style={styles.formRow}>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Quantity per Bag (kg) *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.quantityPerBag}
                        onChangeText={(text) => setFormData({ ...formData, quantityPerBag: text })}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Price per Bag (Rs) *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.pricePerBag}
                        onChangeText={(text) => setFormData({ ...formData, pricePerBag: text })}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      placeholder="Additional description..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              ) : modalType === 'chartCalculations' ? (
                <>
                  <Text style={styles.sectionTitle}>Feed Chart Calculations</Text>
                  <Text style={styles.chartName}>{selectedFeedChart?.name}</Text>
                  <Text style={styles.chartInfo}>{selectedFeedChart?.numberOfAnimals} animals</Text>
                  
                  <View style={styles.durationSelector}>
                    <Text style={styles.durationLabel}>Duration:</Text>
                    <View style={styles.durationButtons}>
                      {[10, 20, 30].map(d => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.durationButton, formData.chartDuration === d.toString() && styles.activeDurationButton]}
                          onPress={async () => {
                            setFormData({ ...formData, chartDuration: d.toString() });
                            await fetchFeedChartCalculations(selectedFeedChart._id, d.toString());
                          }}
                        >
                          <Text style={[styles.durationButtonText, formData.chartDuration === d.toString() && styles.activeDurationButtonText]}>{d} Days</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {feedChartCalculations ? (
                    <>
                      <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Summary</Text>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Total Quantity:</Text>
                          <Text style={styles.summaryValue}>{feedChartCalculations.calculations.totalQuantity.toFixed(2)} kg</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Total Cost:</Text>
                          <Text style={styles.summaryValue}>Rs {feedChartCalculations.calculations.totalCost.toFixed(2)}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.sectionTitle}>Feed Items Breakdown</Text>
                      {feedChartCalculations.calculations.feedItems.map((item, index) => (
                        <View key={index} style={styles.feedItemCard}>
                          <Text style={styles.feedItemName}>{item.feedItemName}</Text>
                          <View style={styles.feedItemRow}>
                            <Text style={styles.feedItemLabel}>Per Day:</Text>
                            <Text style={styles.feedItemValue}>{item.quantityPerDay.toFixed(2)} kg</Text>
                          </View>
                          <View style={styles.feedItemRow}>
                            <Text style={styles.feedItemLabel}>Per {formData.chartDuration} Days:</Text>
                            <Text style={styles.feedItemValue}>{item.quantityForDuration.toFixed(2)} kg</Text>
                          </View>
                          <View style={styles.feedItemRow}>
                            <Text style={styles.feedItemLabel}>Cost:</Text>
                            <Text style={styles.feedItemValue}>Rs {item.costForDuration.toFixed(2)}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#10b981" />
                      <Text style={styles.loadingText}>Loading calculations...</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Feed Item *</Text>
                    <View style={[styles.formInput, styles.pickerInput]}>
                      <TouchableOpacity onPress={() => {}} style={styles.pickerButton}>
                        <Text style={styles.pickerText}>
                          {formData.feedItemId ? feedItems.find(i => i._id === formData.feedItemId)?.name || 'Select Feed' : 'Select Feed'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Quantity per Time (kg) *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.quantityPerTime}
                        onChangeText={(text) => setFormData({ ...formData, quantityPerTime: text })}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Quantity per Day (kg) *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.quantityPerDay}
                        onChangeText={(text) => setFormData({ ...formData, quantityPerDay: text })}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Quantity per 10 Days (kg) *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.quantityPer10Days}
                        onChangeText={(text) => setFormData({ ...formData, quantityPer10Days: text })}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Quantity per 30 Days (kg) *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.quantityPer30Days}
                        onChangeText={(text) => setFormData({ ...formData, quantityPer30Days: text })}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Number of Animals *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.numberOfAnimals}
                      onChangeText={(text) => setFormData({ ...formData, numberOfAnimals: text })}
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              {modalType === 'chartCalculations' ? (
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>{editingItem ? 'Update' : 'Add'} {modalType === 'feedItem' ? 'Feed' : 'Calculation'}</Text>
                  </TouchableOpacity>
                </>
              )}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 12,
  },
  statsRowHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    flexWrap: 'nowrap',
  },
  itemMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: 'center',
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    gap: 6,
  },
  editButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    gap: 6,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 13,
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
    backgroundColor: '#d1fae5',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    flex: 1,
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
  pickerInput: {
    justifyContent: 'center',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    color: '#1e293b',
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
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default FeedCalculations;