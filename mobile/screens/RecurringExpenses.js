import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../utils/api';

const RecurringExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: 'feed',
    amount: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recurring-expenses');
      setExpenses(response.data.data || []);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching expenses');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      await api.post('/recurring-expenses', payload);
      Alert.alert('Success', 'Recurring expense added successfully');
      setFormData({
        name: '',
        category: 'feed',
        amount: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: '',
        isActive: true
      });
      fetchExpenses();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error adding expense');
    }
    setIsSubmitting(false);
  };

  const renderExpense = ({ item }) => (
    <View style={styles.item}>
      <Text>Name: {item.name}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Amount: {item.amount}</Text>
      <Text>Frequency: {item.frequency}</Text>
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
      <Text style={styles.title}>Recurring Expenses</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Expense name"
          value={formData.name}
          onChangeText={(value) => setFormData({ ...formData, name: value })}
        />

        <Text style={styles.label}>Category</Text>
        <Picker
          selectedValue={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          style={styles.picker}
        >
          <Picker.Item label="Feed" value="feed" />
          <Picker.Item label="Veterinary" value="veterinary" />
          <Picker.Item label="Labor" value="labor" />
          <Picker.Item label="Other" value="other" />
        </Picker>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={formData.amount}
          onChangeText={(value) => setFormData({ ...formData, amount: value })}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Frequency</Text>
        <Picker
          selectedValue={formData.frequency}
          onValueChange={(value) => setFormData({ ...formData, frequency: value })}
          style={styles.picker}
        >
          <Picker.Item label="Daily" value="daily" />
          <Picker.Item label="Weekly" value="weekly" />
          <Picker.Item label="Monthly" value="monthly" />
          <Picker.Item label="Yearly" value="yearly" />
        </Picker>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Adding...' : 'Add Recurring Expense'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Active Recurring Expenses</Text>
      <FlatList
        data={expenses.filter(e => e.isActive).slice(0, 10)}
        renderItem={renderExpense}
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
  picker: { borderWidth: 1, borderColor: '#ddd', marginBottom: 15 },
  button: { backgroundColor: '#dc3545', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  item: { backgroundColor: 'white', padding: 10, marginBottom: 10, borderRadius: 5 },
});

export default RecurringExpenses;