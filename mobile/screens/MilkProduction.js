import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal, TextInput, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import DatePickerInput from '../components/DatePickerInput';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const MilkProduction = () => {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mode, setMode] = useState('total-day');
  const [formData, setFormData] = useState({
    animalId: '',
    date: new Date().toISOString().split('T')[0],
    morningYield: '',
    eveningYield: '',
    quality: 'good',
    notes: ''
  });
  const [totalData, setTotalData] = useState({
    date: new Date().toISOString().split('T')[0],
    morningTotal: '',
    eveningTotal: ''
  });
  const [divideEvenly, setDivideEvenly] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, animalsRes] = await Promise.all([
        api.get('/milk/production'),
        api.get('/animals')
      ]);
      setRecords(recordsRes.data.data || []);
      setAnimals((animalsRes.data.data || []).filter(a => a.status === 'active' && a.gender === 'female'));
      setLoading(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('milk.fetchError'));
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (mode === 'per-animal') {
        if (!formData.animalId || (!formData.morningYield && !formData.eveningYield)) {
          Alert.alert(t('common.error'), t('milk.selectAnimalAndYield'));
          setIsSubmitting(false);
          return;
        }
        if (editingId) {
          await api.put(`/milk/production/${editingId}`, formData);
          Alert.alert(t('common.success'), t('milk.updateSuccess'));
        } else {
          await api.post('/milk/production', formData);
          Alert.alert(t('common.success'), t('milk.addSuccess'));
        }
      } else {
        const activeAnimals = animals.filter(a => a.status === 'active' && a.gender === 'female');
        if (activeAnimals.length === 0) {
          Alert.alert(t('common.error'), t('milk.noActiveFemale'));
          setIsSubmitting(false);
          return;
        }

        const morning = Number(totalData.morningTotal || 0);
        const evening = Number(totalData.eveningTotal || 0);

        if (morning === 0 && evening === 0) {
          Alert.alert(t('common.error'), t('milk.enterAtLeastOneTotal'));
          setIsSubmitting(false);
          return;
        }

        if (divideEvenly) {
          const count = activeAnimals.length;
          const perMorning = +(morning / count).toFixed(2);
          const perEvening = +(evening / count).toFixed(2);

          for (const a of activeAnimals) {
            await api.post('/milk/production', {
              animalId: a._id,
              date: totalData.date,
              morningYield: perMorning,
              eveningYield: perEvening,
              quality: 'good',
              notes: 'Auto divided from total'
            });
          }
          Alert.alert(t('common.success'), t('milk.totalDividedSuccess'));
        }
      }

      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('milk.saveError'));
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      t('milk.deleteConfirmTitle'),
      t('milk.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/milk/production/${id}`);
              Alert.alert(t('common.success'), t('milk.deleteSuccess'));
              fetchData();
            } catch (error) {
              Alert.alert(t('common.error'), t('milk.deleteError'));
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      animalId: '',
      date: new Date().toISOString().split('T')[0],
      morningYield: '',
      eveningYield: '',
      quality: 'good',
      notes: ''
    });
    setTotalData({
      date: new Date().toISOString().split('T')[0],
      morningTotal: '',
      eveningTotal: ''
    });
    setMode('total-day');
    setDivideEvenly(true);
    setEditingId(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      animalId: item.animalId?._id || '',
      date: item.date.split('T')[0],
      morningYield: item.morningYield.toString(),
      eveningYield: item.eveningYield.toString(),
      quality: item.quality || 'good',
      notes: item.notes || ''
    });
    setMode('per-animal');
    setShowModal(true);
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return '#22c55e';
      case 'good': return '#3b82f6';
      case 'average': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getQualityGradient = (quality) => {
    switch (quality) {
      case 'excellent': return ['#22c55e', '#16a34a'];
      case 'good': return ['#3b82f6', '#2563eb'];
      case 'average': return ['#f59e0b', '#d97706'];
      case 'poor': return ['#ef4444', '#dc2626'];
      default: return ['#94a3b8', '#64748b'];
    }
  };

  const renderRecord = ({ item }) => (
    <View style={styles.recordCard}>
      <View style={[styles.cardAccent, { backgroundColor: getQualityColor(item.quality) }]} />
      <View style={styles.cardContent}>
        <View style={styles.recordHeader}>
          <View style={styles.animalInfo}>
            <View style={styles.animalIconContainer}>
              <Ionicons name="paw" size={18} color="#3b82f6" />
            </View>
            <View style={styles.animalDetails}>
              <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <LinearGradient
              colors={getQualityGradient(item.quality)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.qualityBadge}
            >
              <Text style={styles.qualityText}>{item.quality}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
              <Ionicons name="create-outline" size={16} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.yieldContainer}>
          <View style={styles.yieldItem}>
            <View style={[styles.yieldIcon, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.yieldEmoji}>🌅</Text>
            </View>
            <View style={styles.yieldInfo}>
              <Text style={styles.yieldLabel}>Morning</Text>
              <Text style={styles.yieldValue}>{item.morningYield} L</Text>
            </View>
          </View>
          <View style={styles.yieldDivider} />
          <View style={styles.yieldItem}>
            <View style={[styles.yieldIcon, { backgroundColor: '#e0e7ff' }]}>
              <Text style={styles.yieldEmoji}>🌆</Text>
            </View>
            <View style={styles.yieldInfo}>
              <Text style={styles.yieldLabel}>Evening</Text>
              <Text style={styles.yieldValue}>{item.eveningYield} L</Text>
            </View>
          </View>
          <View style={styles.yieldDivider} />
          <View style={styles.totalYieldItem}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{item.totalYield} L</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{t('milk.loading')}</Text>
      </View>
    );
  }

  // Calculate today's total
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date?.split('T')[0] === today);
  const todayTotal = todayRecords.reduce((sum, r) => sum + (r.totalYield || 0), 0);
  const weekRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return recordDate >= weekAgo;
  });
  const weekTotal = weekRecords.reduce((sum, r) => sum + (r.totalYield || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#06b6d4', '#0891b2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>{t('milk.subtitle')}</Text>
            <Text style={styles.headerTitle}>{t('milk.title')}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openModal}>
            <Ionicons name="add" size={26} color="#0891b2" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayTotal.toFixed(1)}L</Text>
            <Text style={styles.statLabel}>{t('milk.today')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weekTotal.toFixed(1)}L</Text>
            <Text style={styles.statLabel}>{t('milk.thisWeek')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{records.length}</Text>
            <Text style={styles.statLabel}>{t('milk.records')}</Text>
          </View>
        </View>
      </LinearGradient>

      {records.length > 0 ? (
        <FlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#06b6d4']}
              tintColor="#06b6d4"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="water-outline" size={48} color="#06b6d4" />
          </View>
          <Text style={styles.emptyStateTitle}>{t('milk.noRecords')}</Text>
          <Text style={styles.emptyStateText}>{t('milk.startTracking')}</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={openModal} activeOpacity={0.8}>
            <LinearGradient
              colors={['#06b6d4', '#0891b2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>{t('milk.addFirstRecord')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Record Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? t('milk.editRecord') : t('milk.addRecord')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Mode Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('milk.recordMode')}</Text>
                <View style={styles.modeSelector}>
                  <TouchableOpacity
                    style={[styles.modeOption, mode === 'total-day' && styles.modeOptionActive]}
                    onPress={() => setMode('total-day')}
                  >
                    <Text style={[styles.modeText, mode === 'total-day' && styles.modeTextActive]}>{t('milk.totalForDay')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeOption, mode === 'per-animal' && styles.modeOptionActive]}
                    onPress={() => setMode('per-animal')}
                  >
                    <Text style={[styles.modeText, mode === 'per-animal' && styles.modeTextActive]}>{t('milk.perAnimal')}</Text>
                  </TouchableOpacity>

                </View>
              </View>

              {mode === 'per-animal' ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t('milk.animal')} *</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.animalId}
                        onValueChange={(value) => setFormData({ ...formData, animalId: value })}
                        style={styles.picker}
                      >
                        <Picker.Item label={t('milk.selectAnimal')} value="" />
                        {animals.map(animal => (
                          <Picker.Item
                            key={animal._id}
                            label={`${animal.tagNumber} - ${animal.name || animal.breed}`}
                            value={animal._id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <DatePickerInput
                      label={t('common.date')}
                      value={formData.date}
                      onChange={(date) => setFormData({ ...formData, date })}
                      themeColor="#06b6d4"
                      required
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>{t('milk.morning')} (L) *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.morningYield}
                        onChangeText={(text) => setFormData({ ...formData, morningYield: text })}
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>{t('milk.evening')} (L) *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.eveningYield}
                        onChangeText={(text) => setFormData({ ...formData, eveningYield: text })}
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <DatePickerInput
                      label={t('common.date')}
                      value={totalData.date}
                      onChange={(date) => setTotalData({ ...totalData, date })}
                      themeColor="#06b6d4"
                      required
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>{t('milk.totalMorning')} (L)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={totalData.morningTotal}
                        onChangeText={(text) => setTotalData({ ...totalData, morningTotal: text })}
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>{t('milk.totalEvening')} (L)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={totalData.eveningTotal}
                        onChangeText={(text) => setTotalData({ ...totalData, eveningTotal: text })}
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>{t('milk.preview')}</Text>
                    <Text style={styles.previewText}>{t('milk.previewAnimals', { count: animals.length })}</Text>
                    <Text style={styles.previewText}>
                      {t('milk.previewMorningPerAnimal', { amount: (Number(totalData.morningTotal || 0) / (animals.length || 1)).toFixed(2) })}
                    </Text>
                    <Text style={styles.previewText}>
                      {t('milk.previewEveningPerAnimal', { amount: (Number(totalData.eveningTotal || 0) / (animals.length || 1)).toFixed(2) })}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Quality</Text>
                <View style={styles.qualitySelector}>
                  {['excellent', 'good', 'average', 'poor'].map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.qualityOption, formData.quality === q && styles.qualityOptionActive]}
                      onPress={() => setFormData({ ...formData, quality: q })}
                    >
                      <Text style={[styles.qualityOptionText, formData.quality === q && styles.qualityOptionTextActive]}>
                        {q.charAt(0).toUpperCase() + q.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                <Text style={styles.submitButtonText}>{isSubmitting ? editingId ? 'Updating...' : 'Adding...' : editingId ? 'Update Record' : 'Add Record'}</Text>
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
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
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  animalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  animalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  animalDetails: {
    flex: 1,
  },
  animalTag: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
  },
  yieldItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  yieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  yieldEmoji: {
    fontSize: 16,
  },
  yieldInfo: {
    flex: 1,
  },
  yieldLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yieldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  yieldDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  totalYieldItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#06b6d4',
    marginTop: 2,
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
    backgroundColor: '#ecfeff',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  modeOptionActive: {
    backgroundColor: '#ecfeff',
    borderColor: '#06b6d4',
  },
  modeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#0891b2',
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0891b2',
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  qualitySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qualityOption: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  qualityOptionActive: {
    backgroundColor: '#ecfeff',
    borderColor: '#06b6d4',
  },
  qualityOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  qualityOptionTextActive: {
    color: '#0891b2',
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
    backgroundColor: '#06b6d4',
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

export default MilkProduction;