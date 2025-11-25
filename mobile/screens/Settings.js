import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import FormSelect from '../components/FormSelect';
import FormButton from '../components/FormButton';
import api from '../utils/api';

const CURRENCIES = [
  { label: '🇮🇳 Indian Rupee (INR)', value: 'INR', symbol: '₹' },
  { label: '🇺🇸 US Dollar (USD)', value: 'USD', symbol: '$' },
  { label: '🇪🇺 Euro (EUR)', value: 'EUR', symbol: '€' },
  { label: '🇬🇧 British Pound (GBP)', value: 'GBP', symbol: '£' },
  { label: '🇵🇰 Pakistani Rupee (PKR)', value: 'PKR', symbol: '₨' },
  { label: '🇦🇺 Australian Dollar (AUD)', value: 'AUD', symbol: 'A$' },
  { label: '🇨🇦 Canadian Dollar (CAD)', value: 'CAD', symbol: 'C$' },
  { label: '🇨🇭 Swiss Franc (CHF)', value: 'CHF', symbol: 'Fr' },
  { label: '🇨🇳 Chinese Yuan (CNY)', value: 'CNY', symbol: '¥' },
  { label: '🇯🇵 Japanese Yen (JPY)', value: 'JPY', symbol: '¥' },
  { label: '🇦🇪 UAE Dirham (AED)', value: 'AED', symbol: 'د.إ' },
  { label: '🇸🇦 Saudi Riyal (SAR)', value: 'SAR', symbol: '﷼' },
  { label: '🇿🇦 South African Rand (ZAR)', value: 'ZAR', symbol: 'R' },
  { label: '🇧🇩 Bangladeshi Taka (BDT)', value: 'BDT', symbol: '৳' },
  { label: '🇱🇰 Sri Lankan Rupee (LKR)', value: 'LKR', symbol: 'Rs' },
];

const Settings = () => {
  const { logout, user } = useAuth();
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'INR');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCurrency = CURRENCIES.find(c => c.value === currency);

  const handleSaveCurrency = async () => {
    setSaving(true);
    try {
      await api.put('/auth/update-currency', { preferredCurrency: currency });
      Alert.alert('Success', 'Currency preference updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update currency');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={48} color="#007bff" />
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account preferences</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={24} color="#007bff" />
          <Text style={styles.sectionTitle}>Account Information</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{user?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Farm Name</Text>
          <Text style={styles.infoValue}>{user?.farmName}</Text>
        </View>
        {user?.phoneNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.phoneNumber}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash-outline" size={24} color="#007bff" />
          <Text style={styles.sectionTitle}>Currency Preference</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Select your preferred currency. All amounts will be displayed in this currency.
        </Text>
        
        <View style={styles.currencyPreview}>
          <Text style={styles.currencyLabel}>Current Currency</Text>
          <View style={styles.currencyDisplay}>
            <Text style={styles.currencySymbol}>{selectedCurrency?.symbol}</Text>
            <Text style={styles.currencyCode}>{currency}</Text>
          </View>
        </View>

        <FormSelect
          label="Select Currency"
          value={currency}
          onValueChange={setCurrency}
          options={CURRENCIES}
          placeholder="Choose currency"
          icon="cash-outline"
          required
        />

        <FormButton
          title="Save Currency Preference"
          onPress={handleSaveCurrency}
          variant="primary"
          icon="checkmark-circle-outline"
          loading={saving}
          disabled={saving || currency === user?.preferredCurrency}
          fullWidth
          style={styles.saveButton}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={24} color="#007bff" />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Created</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>

      <FormButton
        title="Logout"
        onPress={handleLogout}
        variant="danger"
        icon="log-out-outline"
        fullWidth
        style={styles.logoutButton}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Dairy Farm Manager</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  currencyPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  currencyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007bff',
  },
  currencyCode: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});

export default Settings;