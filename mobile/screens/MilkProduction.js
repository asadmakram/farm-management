import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../utils/api';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import FormDatePicker from '../components/FormDatePicker';
import FormButton from '../components/FormButton';

const MilkProduction = () => {
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    animalId: '',
    date: new Date().toISOString().split('T')[0],
    morningYield: '',
    eveningYield: '',
    quality: 'good',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, animalsRes] = await Promise.all([
        api.get('/milk/production'),
        api.get('/animals')
      ]);
      setRecords(recordsRes.data.data || []);
      setAnimals(animalsRes.data.data ? animalsRes.data.data.filter(a => a.status === 'active' && a.gender === 'female') : []);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching data');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.animalId || (!formData.morningYield && !formData.eveningYield)) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/milk/production', formData);
      Alert.alert('Success', 'Milk production record added successfully');
      setFormData({
        animalId: '',
        date: new Date().toISOString().split('T')[0],
        morningYield: '',
        eveningYield: '',
        quality: 'good',
        notes: ''
      });
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error adding record');
    }
    setIsSubmitting(false);
  };

  const renderRecord = ({ item }) => (
    <View style={styles.recordItem}>
      <Text>Animal: {item.animalId?.name || 'Unknown'}</Text>
      <Text>Date: {item.date}</Text>
      <Text>Morning: {item.morningYield} L</Text>
      <Text>Evening: {item.eveningYield} L</Text>
      <Text>Total: {item.totalYield} L</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Milk Production</Text>

      <View style={styles.form}>
        <FormSelect
          label="Animal"
          value={formData.animalId}
          onValueChange={(value) => setFormData({ ...formData, animalId: value })}
          options={animals.map(animal => ({ label: animal.name, value: animal._id }))}
          placeholder="Select an animal"
          icon="paw-outline"
          required
        />

        <FormDatePicker
          label="Date"
          value={formData.date}
          onDateChange={(date) => setFormData({ ...formData, date: date })}
          icon="calendar-outline"
          required
        />

        <FormInput
          label="Morning Yield (L)"
          value={formData.morningYield}
          onChangeText={(value) => setFormData({ ...formData, morningYield: value })}
          placeholder="0.00"
          icon="water-outline"
          keyboardType="decimal-pad"
          required={!formData.eveningYield}
        />

        <FormInput
          label="Evening Yield (L)"
          value={formData.eveningYield}
          onChangeText={(value) => setFormData({ ...formData, eveningYield: value })}
          placeholder="0.00"
          icon="water-outline"
          keyboardType="decimal-pad"
          required={!formData.morningYield}
        />

        <FormSelect
          label="Quality"
          value={formData.quality}
          onValueChange={(value) => setFormData({ ...formData, quality: value })}
          options={[
            { label: 'Good', value: 'good' },
            { label: 'Average', value: 'average' },
            { label: 'Poor', value: 'poor' }
          ]}
          placeholder="Select quality"
          icon="star-outline"
        />

        <FormInput
          label="Notes"
          value={formData.notes}
          onChangeText={(value) => setFormData({ ...formData, notes: value })}
          placeholder="Optional notes"
          icon="document-text-outline"
          multiline
          numberOfLines={3}
        />

        <FormButton
          title={isSubmitting ? 'Adding Record...' : 'Add Record'}
          onPress={handleSubmit}
          variant="success"
          icon="add-circle-outline"
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
          style={styles.submitButton}
        />
      </View>

      <Text style={styles.subtitle}>Recent Records</Text>
      <FlatList
        data={records.slice(0, 10)} // Show last 10
        renderItem={renderRecord}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
      />
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
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  form: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 8,
  },
  recordItem: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default MilkProduction;