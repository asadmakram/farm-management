import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../utils/api';

const MilkSales = () => {
  const [sales, setSales] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    saleType: 'bandhi',
    quantity: '',
    contractId: '',
    timeOfDay: 'morning',
    packagingCost: '0',
    customerName: '',
    ratePerLiter: '',
    paymentStatus: 'pending',
    currency: 'INR',
    exchangeRate: '1',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, contractsRes, currenciesRes] = await Promise.all([
        api.get('/milk/sales'),
        api.get('/contracts?status=active'),
        api.get('/currencies')
      ]);
      setSales(salesRes.data.data || []);
      setContracts(contractsRes.data.contracts || []);
      setCurrencies(currenciesRes.data.currencies || []);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching data');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.quantity || !formData.ratePerLiter) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        ratePerLiter: Number(formData.ratePerLiter),
        packagingCost: Number(formData.packagingCost),
        exchangeRate: Number(formData.exchangeRate)
      };
      await api.post('/milk/sales', payload);
      Alert.alert('Success', 'Milk sale recorded successfully');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        saleType: 'bandhi',
        quantity: '',
        contractId: '',
        timeOfDay: 'morning',
        packagingCost: '0',
        customerName: '',
        ratePerLiter: '',
        paymentStatus: 'pending',
        currency: 'INR',
        exchangeRate: '1',
        notes: ''
      });
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error saving sale');
    }
    setIsSubmitting(false);
  };

  const renderSale = ({ item }) => (
    <View style={styles.saleItem}>
      <Text>Date: {item.date}</Text>
      <Text>Type: {item.saleType}</Text>
      <Text>Quantity: {item.quantity} L</Text>
      <Text>Rate: {item.ratePerLiter} {item.currency}</Text>
      <Text>Total: {item.totalRevenue} {item.currency}</Text>
      <Text>Status: {item.paymentStatus}</Text>
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
      <Text style={styles.title}>Milk Sales</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={formData.date}
          onChangeText={(value) => setFormData({ ...formData, date: value })}
        />

        <Text style={styles.label}>Sale Type</Text>
        <Picker
          selectedValue={formData.saleType}
          onValueChange={(value) => setFormData({ ...formData, saleType: value })}
          style={styles.picker}
        >
          <Picker.Item label="Bandhi" value="bandhi" />
          <Picker.Item label="Mandi" value="mandi" />
          <Picker.Item label="Door to Door" value="door_to_door" />
        </Picker>

        <Text style={styles.label}>Quantity (L)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={formData.quantity}
          onChangeText={(value) => setFormData({ ...formData, quantity: value })}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Rate per Liter</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={formData.ratePerLiter}
          onChangeText={(value) => setFormData({ ...formData, ratePerLiter: value })}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Currency</Text>
        <Picker
          selectedValue={formData.currency}
          onValueChange={(value) => setFormData({ ...formData, currency: value })}
          style={styles.picker}
        >
          {currencies.map(c => <Picker.Item key={c._id} label={c.code} value={c.code} />)}
        </Picker>

        <Text style={styles.label}>Payment Status</Text>
        <Picker
          selectedValue={formData.paymentStatus}
          onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
          style={styles.picker}
        >
          <Picker.Item label="Pending" value="pending" />
          <Picker.Item label="Received" value="received" />
        </Picker>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Record Sale'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Recent Sales</Text>
      <FlatList
        data={sales.slice(0, 10)}
        renderItem={renderSale}
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saleItem: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default MilkSales;