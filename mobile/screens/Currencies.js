import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../utils/api';

const Currencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: '1'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/currencies');
      setCurrencies(response.data.currencies);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching currencies');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, exchangeRate: Number(formData.exchangeRate) };
      await api.post('/currencies', payload);
      Alert.alert('Success', 'Currency added successfully');
      setFormData({
        code: '',
        name: '',
        symbol: '',
        exchangeRate: '1'
      });
      fetchCurrencies();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error adding currency');
    }
    setIsSubmitting(false);
  };

  const renderCurrency = ({ item }) => (
    <View style={styles.item}>
      <Text>Code: {item.code}</Text>
      <Text>Name: {item.name}</Text>
      <Text>Symbol: {item.symbol}</Text>
      <Text>Rate: {item.exchangeRate}</Text>
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
      <Text style={styles.title}>Currencies</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Code (e.g., USD)</Text>
        <TextInput
          style={styles.input}
          placeholder="Currency code"
          value={formData.code}
          onChangeText={(value) => setFormData({ ...formData, code: value.toUpperCase() })}
          maxLength={3}
        />

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Currency name"
          value={formData.name}
          onChangeText={(value) => setFormData({ ...formData, name: value })}
        />

        <Text style={styles.label}>Symbol</Text>
        <TextInput
          style={styles.input}
          placeholder="$"
          value={formData.symbol}
          onChangeText={(value) => setFormData({ ...formData, symbol: value })}
        />

        <Text style={styles.label}>Exchange Rate (to base)</Text>
        <TextInput
          style={styles.input}
          placeholder="1.00"
          value={formData.exchangeRate}
          onChangeText={(value) => setFormData({ ...formData, exchangeRate: value })}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Adding...' : 'Add Currency'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Available Currencies</Text>
      <FlatList
        data={currencies}
        renderItem={renderCurrency}
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

export default Currencies;