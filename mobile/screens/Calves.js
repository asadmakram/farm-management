import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../utils/api';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import FormDatePicker from '../components/FormDatePicker';
import FormButton from '../components/FormButton';

const Calves = () => {
  const [calves, setCalves] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    motherId: '',
    name: '',
    dateOfBirth: new Date().toISOString().split('T')[0],
    gender: 'male',
    breed: '',
    weightAtBirth: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [calvesRes, animalsRes] = await Promise.all([
        api.get('/calves'),
        api.get('/animals')
      ]);
      setCalves(calvesRes.data.data || []);
      const femaleAnimals = (animalsRes.data.data || []).filter(a => a.gender === 'female');
      setAnimals(femaleAnimals);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching data');
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.motherId) {
      newErrors.motherId = 'Mother animal is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Calf name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (formData.weightAtBirth && isNaN(formData.weightAtBirth)) {
      newErrors.weightAtBirth = 'Weight must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/calves', formData);
      Alert.alert('Success', 'Calf record added successfully');
      setFormData({
        motherId: '',
        name: '',
        dateOfBirth: new Date().toISOString().split('T')[0],
        gender: 'male',
        breed: '',
        weightAtBirth: '',
        notes: ''
      });
      setErrors({});
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error adding calf record');
    }
    setIsSubmitting(false);
  };

  const renderCalf = ({ item }) => (
    <View style={styles.calfCard}>
      <View style={styles.calfHeader}>
        <View style={styles.calfIconContainer}>
          <Text style={styles.calfIcon}>{item.gender === 'male' ? '🐂' : '🐄'}</Text>
        </View>
        <View style={styles.calfInfo}>
          <Text style={styles.calfName}>{item.name}</Text>
          <Text style={styles.calfDetail}>Mother: {item.motherId?.name || 'Unknown'}</Text>
        </View>
      </View>
      <View style={styles.calfDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date of Birth:</Text>
          <Text style={styles.detailValue}>{new Date(item.dateOfBirth).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gender:</Text>
          <Text style={styles.detailValue}>{item.gender}</Text>
        </View>
        {item.breed && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Breed:</Text>
            <Text style={styles.detailValue}>{item.breed}</Text>
          </View>
        )}
        {item.weightAtBirth && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Birth Weight:</Text>
            <Text style={styles.detailValue}>{item.weightAtBirth} kg</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading calves...</Text>
      </View>
    );
  }

  const animalOptions = animals.map(animal => ({
    label: `${animal.name} (${animal.tagNumber || 'No Tag'})`,
    value: animal._id
  }));

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🐄 Calf Management</Text>
          <Text style={styles.headerSubtitle}>Track and manage new calves</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Calf</Text>
          
          <FormSelect
            label="Mother Animal"
            value={formData.motherId}
            onValueChange={(value) => handleChange('motherId', value)}
            options={animalOptions}
            placeholder="Select mother animal"
            icon="female-outline"
            error={errors.motherId}
            required
            disabled={isSubmitting}
          />

          <FormInput
            label="Calf Name"
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter calf name"
            icon="paw-outline"
            error={errors.name}
            required
            editable={!isSubmitting}
          />

          <FormDatePicker
            label="Date of Birth"
            value={formData.dateOfBirth}
            onDateChange={(value) => handleChange('dateOfBirth', value)}
            error={errors.dateOfBirth}
            required
            disabled={isSubmitting}
          />

          <FormSelect
            label="Gender"
            value={formData.gender}
            onValueChange={(value) => handleChange('gender', value)}
            options={genderOptions}
            icon="male-female-outline"
            required
            disabled={isSubmitting}
          />

          <FormInput
            label="Breed"
            value={formData.breed}
            onChangeText={(value) => handleChange('breed', value)}
            placeholder="Enter breed (optional)"
            icon="ribbon-outline"
            editable={!isSubmitting}
          />

          <FormInput
            label="Weight at Birth (kg)"
            value={formData.weightAtBirth}
            onChangeText={(value) => handleChange('weightAtBirth', value)}
            placeholder="0.0"
            icon="fitness-outline"
            keyboardType="decimal-pad"
            error={errors.weightAtBirth}
            editable={!isSubmitting}
          />

          <FormInput
            label="Notes"
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            placeholder="Additional notes (optional)"
            icon="create-outline"
            multiline
            numberOfLines={3}
            editable={!isSubmitting}
          />

          <FormButton
            title="Add Calf Record"
            onPress={handleSubmit}
            variant="success"
            icon="add-circle-outline"
            loading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
          />
        </View>

        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Recent Calves</Text>
          {calves.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🐄</Text>
              <Text style={styles.emptyStateText}>No calf records yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your first calf above</Text>
            </View>
          ) : (
            <FlatList
              data={calves.slice(0, 10)}
              renderItem={renderCalf}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
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
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  formCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  listSection: {
    margin: 16,
    marginTop: 0,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  calfCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  calfIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calfIcon: {
    fontSize: 28,
  },
  calfInfo: {
    flex: 1,
  },
  calfName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  calfDetail: {
    fontSize: 14,
    color: '#666',
  },
  calfDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default Calves;