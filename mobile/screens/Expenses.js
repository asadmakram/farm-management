import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../utils/api';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import FormDatePicker from '../components/FormDatePicker';
import FormButton from '../components/FormButton';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'feed',
    expenseType: 'operating',
    amount: '',
    description: '',
    animalId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses');
      setExpenses(response.data.data || []);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error fetching expenses');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      await api.post('/expenses', payload);
      Alert.alert('Success', 'Expense added successfully');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'feed',
        expenseType: 'operating',
        amount: '',
        description: '',
        animalId: ''
      });
      fetchExpenses();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error adding expense');
    }
    setIsSubmitting(false);
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseItem}>
      <Text>Date: {item.date}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Description: {item.description}</Text>
      <Text>Amount: {item.amount}</Text>
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
      <Text style={styles.title}>Expenses</Text>

      <View style={styles.form}>
        <FormDatePicker
          label="Date"
          value={formData.date}
          onDateChange={(date) => setFormData({ ...formData, date: date })}
          icon="calendar-outline"
          required
        />

        <FormSelect
          label="Category"
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          options={[
            { label: 'Feed', value: 'feed' },
            { label: 'Veterinary', value: 'veterinary' },
            { label: 'Equipment', value: 'equipment' },
            { label: 'Labor', value: 'labor' },
            { label: 'Other', value: 'other' }
          ]}
          placeholder="Select category"
          icon="list-outline"
          required
        />

        <FormInput
          label="Amount"
          value={formData.amount}
          onChangeText={(value) => setFormData({ ...formData, amount: value })}
          placeholder="0.00"
          icon="cash-outline"
          keyboardType="decimal-pad"
          required
        />

        <FormInput
          label="Description"
          value={formData.description}
          onChangeText={(value) => setFormData({ ...formData, description: value })}
          placeholder="Expense description"
          icon="document-text-outline"
          multiline
          numberOfLines={3}
          required
        />

        <FormButton
          title={isSubmitting ? 'Adding Expense...' : 'Add Expense'}
          onPress={handleSubmit}
          variant="danger"
          icon="add-circle-outline"
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
          style={styles.submitButton}
        />
      </View>

      <Text style={styles.subtitle}>Recent Expenses</Text>
      <FlatList
        data={expenses.slice(0, 10)}
        renderItem={renderExpense}
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
  expenseItem: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default Expenses;