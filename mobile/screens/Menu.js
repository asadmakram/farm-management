import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const Menu = ({ navigation }) => {
  const menuItems = [
    { title: 'Dashboard', screen: 'Dashboard' },
    { title: 'Animals', screen: 'Animals' },
    { title: 'Milk Production', screen: 'Milk Production' },
    { title: 'Milk Sales', screen: 'Milk Sales' },
    { title: 'Expenses', screen: 'Expenses' },
    { title: 'Vaccinations', screen: 'Vaccinations' },
    { title: 'Calves', screen: 'Calves' },
    { title: 'Reports', screen: 'Reports' },
    { title: 'Contracts', screen: 'Contracts' },
    { title: 'Recurring Expenses', screen: 'Recurring Expenses' },
    { title: 'Currencies', screen: 'Currencies' },
    { title: 'Settings', screen: 'Settings' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🐄 Farm Management</Text>
      <Text style={styles.subtitle}>Select a feature to manage</Text>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
  },
});

export default Menu;