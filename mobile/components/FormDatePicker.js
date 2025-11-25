import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FormDatePicker = ({
  label,
  value,
  onDateChange,
  error,
  required,
  disabled = false,
  mode = 'date', // date, time, datetime
  icon = 'calendar-outline',
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleConfirm = () => {
    onDateChange(formatDate(tempDate));
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value ? new Date(value) : new Date());
    setShowPicker(false);
  };

  const adjustDate = (days) => {
    const newDate = new Date(tempDate);
    newDate.setDate(newDate.getDate() + days);
    setTempDate(newDate);
  };

  const adjustMonth = (months) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(newDate.getMonth() + months);
    setTempDate(newDate);
  };

  const adjustYear = (years) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(newDate.getFullYear() + years);
    setTempDate(newDate);
  };

  const setToToday = () => {
    setTempDate(new Date());
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.dateWrapper,
          error && styles.dateError,
          disabled && styles.dateDisabled
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon}
          size={20}
          color={error ? '#ff4444' : '#666'}
          style={styles.icon}
        />
        <Text style={[
          styles.dateText,
          !value && styles.placeholderText
        ]}>
          {value ? formatDisplayDate(value) : 'Select date'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color="#666"
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{label || 'Select Date'}</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.confirmButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickButton} onPress={setToToday}>
                <Text style={styles.quickButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickButton} onPress={() => adjustDate(-1)}>
                <Text style={styles.quickButtonText}>Yesterday</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateDisplay}>
              <Text style={styles.dateDisplayText}>
                {tempDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>

            <View style={styles.pickerControls}>
              {/* Year Controls */}
              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Year</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity style={styles.controlButton} onPress={() => adjustYear(-1)}>
                    <Ionicons name="remove" size={20} color="#007bff" />
                  </TouchableOpacity>
                  <Text style={styles.controlValue}>{tempDate.getFullYear()}</Text>
                  <TouchableOpacity style={styles.controlButton} onPress={() => adjustYear(1)}>
                    <Ionicons name="add" size={20} color="#007bff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Month Controls */}
              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Month</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity style={styles.controlButton} onPress={() => adjustMonth(-1)}>
                    <Ionicons name="remove" size={20} color="#007bff" />
                  </TouchableOpacity>
                  <Text style={styles.controlValue}>
                    {tempDate.toLocaleDateString('en-US', { month: 'long' })}
                  </Text>
                  <TouchableOpacity style={styles.controlButton} onPress={() => adjustMonth(1)}>
                    <Ionicons name="add" size={20} color="#007bff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day Controls */}
              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Day</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity style={styles.controlButton} onPress={() => adjustDate(-1)}>
                    <Ionicons name="remove" size={20} color="#007bff" />
                  </TouchableOpacity>
                  <Text style={styles.controlValue}>{tempDate.getDate()}</Text>
                  <TouchableOpacity style={styles.controlButton} onPress={() => adjustDate(1)}>
                    <Ionicons name="add" size={20} color="#007bff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  required: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
    backgroundColor: '#fafafa',
  },
  dateError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  dateDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  icon: {
    marginRight: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
  },
  quickButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateDisplay: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pickerControls: {
    padding: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 60,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 100,
    textAlign: 'center',
  },
});

export default FormDatePicker;
