import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../utils/api';

const Vaccinations = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    animalId: '',
    vaccineName: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    administeredBy: '',
    batchNumber: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vaccRes, animalsRes] = await Promise.all([
        api.get('/vaccinations'),
        api.get('/animals')
      ]);
      setVaccinations(vaccRes.data.data || []);
      setAnimals(animalsRes.data.data || []);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching data');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.animalId || !formData.vaccineName) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/vaccinations', formData);
      Alert.alert('Success', 'Vaccination record added successfully');
      setFormData({
        animalId: '',
        vaccineName: '',
        dateAdministered: new Date().toISOString().split('T')[0],
        nextDueDate: '',
        administeredBy: '',
        batchNumber: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error adding record');
    }
    setIsSubmitting(false);
  };

  const renderVaccination = ({ item }) => (
    <View style={styles.item}>
      <Text>Animal: {item.animalId?.name || 'Unknown'}</Text>
      <Text>Vaccine: {item.vaccineName}</Text>
      <Text>Date: {item.dateAdministered}</Text>
      <Text>Next Due: {item.nextDueDate}</Text>
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
      <Text style={styles.title}>Vaccinations</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Animal ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Animal ID"
          value={formData.animalId}
          onChangeText={(value) => setFormData({ ...formData, animalId: value })}
        />

        <Text style={styles.label}>Vaccine Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Vaccine name"
          value={formData.vaccineName}
          onChangeText={(value) => setFormData({ ...formData, vaccineName: value })}
        />

        <Text style={styles.label}>Date Administered</Text>
        <TextInput
          style={styles.input}
          value={formData.dateAdministered}
          onChangeText={(value) => setFormData({ ...formData, dateAdministered: value })}
        />

        <Text style={styles.label}>Next Due Date</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          value={formData.nextDueDate}
          onChangeText={(value) => setFormData({ ...formData, nextDueDate: value })}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Adding...' : 'Add Vaccination'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Recent Vaccinations</Text>
      <FlatList
        data={vaccinations.slice(0, 10)}
        renderItem={renderVaccination}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  form: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15, borderRadius: 5, fontSize: 16 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  item: { backgroundColor: 'white', padding: 10, marginBottom: 10, borderRadius: 5 },
});

export default Vaccinations;