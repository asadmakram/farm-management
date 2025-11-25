import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../utils/api';

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    buyerName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    agreedQuantity: '',
    agreedRate: '',
    currency: 'INR',
    paymentTerms: '',
    status: 'active',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contracts');
      setContracts(response.data.contracts);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching contracts');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.buyerName || !formData.agreedQuantity || !formData.agreedRate) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, agreedQuantity: Number(formData.agreedQuantity), agreedRate: Number(formData.agreedRate) };
      await api.post('/contracts', payload);
      Alert.alert('Success', 'Contract added successfully');
      setFormData({
        buyerName: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        agreedQuantity: '',
        agreedRate: '',
        currency: 'INR',
        paymentTerms: '',
        status: 'active',
        notes: ''
      });
      fetchContracts();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error adding contract');
    }
    setIsSubmitting(false);
  };

  const renderContract = ({ item }) => (
    <View style={styles.item}>
      <Text>Buyer: {item.buyerName}</Text>
      <Text>Quantity: {item.agreedQuantity} L</Text>
      <Text>Rate: {item.agreedRate} {item.currency}</Text>
      <Text>Status: {item.status}</Text>
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
      <Text style={styles.title}>Contracts</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Buyer Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Buyer name"
          value={formData.buyerName}
          onChangeText={(value) => setFormData({ ...formData, buyerName: value })}
        />

        <Text style={styles.label}>Agreed Quantity (L)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={formData.agreedQuantity}
          onChangeText={(value) => setFormData({ ...formData, agreedQuantity: value })}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Agreed Rate</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={formData.agreedRate}
          onChangeText={(value) => setFormData({ ...formData, agreedRate: value })}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Currency</Text>
        <TextInput
          style={styles.input}
          value={formData.currency}
          onChangeText={(value) => setFormData({ ...formData, currency: value })}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Adding...' : 'Add Contract'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Active Contracts</Text>
      <FlatList
        data={contracts.filter(c => c.status === 'active').slice(0, 10)}
        renderItem={renderContract}
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
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  item: { backgroundColor: 'white', padding: 10, marginBottom: 10, borderRadius: 5 },
});

export default Contracts;