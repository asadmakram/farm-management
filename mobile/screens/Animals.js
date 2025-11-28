import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, TextInput, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';

const { width } = Dimensions.get('window');

const Animals = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    breed: '',
    dateOfBirth: '',
    gender: 'female',
    status: 'active',
    purchaseDate: '',
    purchasePrice: '',
    weight: '',
    notes: ''
  });

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const response = await api.get('/animals');
      setAnimals(response.data.data || []);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching animals');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnimals();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.tagNumber || !formData.breed || !formData.dateOfBirth) {
      Alert.alert('Error', 'Please fill in required fields (Tag Number, Breed, Date of Birth)');
      return;
    }

    try {
      const payload = {
        ...formData,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined
      };

      if (editingAnimal) {
        await api.put(`/animals/${editingAnimal._id}`, payload);
        Alert.alert('Success', 'Animal updated successfully');
      } else {
        await api.post('/animals', payload);
        Alert.alert('Success', 'Animal added successfully');
      }
      fetchAnimals();
      closeModal();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error saving animal');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this animal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/animals/${id}`);
              Alert.alert('Success', 'Animal deleted successfully');
              fetchAnimals();
            } catch (error) {
              Alert.alert('Error', 'Error deleting animal');
            }
          }
        }
      ]
    );
  };

  const openModal = (animal = null) => {
    if (animal) {
      setEditingAnimal(animal);
      setFormData({
        tagNumber: animal.tagNumber || '',
        name: animal.name || '',
        breed: animal.breed || '',
        dateOfBirth: animal.dateOfBirth ? animal.dateOfBirth.split('T')[0] : '',
        gender: animal.gender || 'female',
        status: animal.status || 'active',
        purchaseDate: animal.purchaseDate ? animal.purchaseDate.split('T')[0] : '',
        purchasePrice: animal.purchasePrice?.toString() || '',
        weight: animal.weight?.toString() || '',
        notes: animal.notes || ''
      });
    } else {
      setEditingAnimal(null);
      setFormData({
        tagNumber: '',
        name: '',
        breed: '',
        dateOfBirth: '',
        gender: 'female',
        status: 'active',
        purchaseDate: '',
        purchasePrice: '',
        weight: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAnimal(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'dry': return '#f59e0b';
      case 'sold': return '#94a3b8';
      case 'deceased': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getStatusGradient = (status) => {
    switch (status) {
      case 'active': return ['#22c55e', '#16a34a'];
      case 'dry': return ['#f59e0b', '#d97706'];
      case 'sold': return ['#94a3b8', '#64748b'];
      case 'deceased': return ['#ef4444', '#dc2626'];
      default: return ['#94a3b8', '#64748b'];
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const years = Math.floor((new Date() - new Date(dateOfBirth)) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(((new Date() - new Date(dateOfBirth)) % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    if (years === 0) return `${months}m`;
    return `${years}y ${months}m`;
  };

  const renderAnimal = ({ item }) => (
    <View style={styles.animalCard}>
      <View style={[styles.cardAccent, { backgroundColor: getStatusColor(item.status) }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.animalMainInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={item.gender === 'female' ? ['#ec4899', '#db2777'] : ['#3b82f6', '#2563eb']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{item.tagNumber?.slice(-2) || '??'}</Text>
              </LinearGradient>
              <View style={[styles.genderIcon, { backgroundColor: item.gender === 'female' ? '#fce7f3' : '#dbeafe' }]}>
                <Ionicons 
                  name={item.gender === 'female' ? 'female' : 'male'} 
                  size={10} 
                  color={item.gender === 'female' ? '#ec4899' : '#3b82f6'} 
                />
              </View>
            </View>
            <View style={styles.animalInfo}>
              <Text style={styles.tagNumber}>{item.tagNumber}</Text>
              <Text style={styles.animalName}>{item.name || item.breed}</Text>
            </View>
          </View>
          <LinearGradient
            colors={getStatusGradient(item.status)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusBadge}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="calendar" size={14} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Age</Text>
              <Text style={styles.statValue}>{calculateAge(item.dateOfBirth)}</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="pricetag" size={14} color="#d97706" />
            </View>
            <View>
              <Text style={styles.statLabel}>Breed</Text>
              <Text style={styles.statValue}>{item.breed?.slice(0, 8) || 'N/A'}</Text>
            </View>
          </View>
          {item.weight && (
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="fitness" size={14} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.statLabel}>Weight</Text>
                <Text style={styles.statValue}>{item.weight}kg</Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => openModal(item)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color="#3b82f6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)} activeOpacity={0.7}>
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
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  // Calculate stats
  const activeAnimals = animals.filter(a => a.status === 'active').length;
  const femaleAnimals = animals.filter(a => a.gender === 'female').length;
  const maleAnimals = animals.filter(a => a.gender === 'male').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#f97316', '#ea580c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>{t('animals.subtitle')}</Text>
            <Text style={styles.headerTitle}>{t('animals.title')}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <Ionicons name="add" size={26} color="#f97316" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsRowHeader}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{animals.length}</Text>
            <Text style={styles.headerStatLabel}>{t('common.total')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{activeAnimals}</Text>
            <Text style={styles.headerStatLabel}>{t('animals.active')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{femaleAnimals}</Text>
            <Text style={styles.headerStatLabel}>{t('animals.female')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{maleAnimals}</Text>
            <Text style={styles.headerStatLabel}>{t('animals.male')}</Text>
          </View>
        </View>
      </LinearGradient>

      {animals.length > 0 ? (
        <FlatList
          data={animals}
          renderItem={renderAnimal}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#f97316']}
              tintColor="#f97316"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="paw-outline" size={48} color="#f97316" />
          </View>
          <Text style={styles.emptyStateTitle}>{t('animals.noAnimals')}</Text>
          <Text style={styles.emptyStateText}>{t('animals.startHerd')}</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => openModal()} activeOpacity={0.8}>
            <LinearGradient
              colors={['#f97316', '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>{t('animals.addFirst')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal for Add/Edit Animal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAnimal ? t('animals.editAnimal') : t('animals.addAnimal')}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('animals.tagNumber')} *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.tagNumber}
                    onChangeText={(text) => setFormData({ ...formData, tagNumber: text })}
                    placeholder={t('animals.tagNumber')}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Breed *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.breed}
                    onChangeText={(text) => setFormData({ ...formData, breed: text })}
                    placeholder="Enter breed"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Gender *</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity 
                      style={[styles.radioButton, formData.gender === 'female' && styles.radioButtonActive]}
                      onPress={() => setFormData({ ...formData, gender: 'female' })}
                    >
                      <Text style={[styles.radioText, formData.gender === 'female' && styles.radioTextActive]}>Female</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.radioButton, formData.gender === 'male' && styles.radioButtonActive]}
                      onPress={() => setFormData({ ...formData, gender: 'male' })}
                    >
                      <Text style={[styles.radioText, formData.gender === 'male' && styles.radioTextActive]}>Male</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <DatePickerInput
                label="Date of Birth"
                value={formData.dateOfBirth}
                onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                themeColor="#f97316"
                required
              />

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.statusOptions}>
                  {['active', 'dry', 'sold', 'deceased'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusOption, formData.status === status && styles.statusOptionActive]}
                      onPress={() => setFormData({ ...formData, status })}
                    >
                      <Text style={[styles.statusOptionText, formData.status === status && styles.statusOptionTextActive]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <DatePickerInput
                    label="Purchase Date"
                    value={formData.purchaseDate}
                    onChange={(date) => setFormData({ ...formData, purchaseDate: date })}
                    themeColor="#f97316"
                    placeholder="Optional"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Purchase Price (Rs )</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.purchasePrice}
                    onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.weight}
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Additional notes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>{editingAnimal ? 'Update' : 'Add'} Animal</Text>
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
  animalCard: {
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
  animalMainInfo: {
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
  genderIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  animalInfo: {
    flex: 1,
  },
  tagNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  animalName: {
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
    backgroundColor: '#fff7ed',
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
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  radioButtonActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#f97316',
  },
  radioText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  radioTextActive: {
    color: '#ea580c',
    fontWeight: '700',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusOption: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  statusOptionActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#f97316',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusOptionTextActive: {
    color: '#ea580c',
    fontWeight: '700',
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
    backgroundColor: '#f97316',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default Animals;