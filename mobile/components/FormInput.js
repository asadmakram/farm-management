import React from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  required,
  multiline,
  numberOfLines,
  keyboardType,
  secureTextEntry,
  editable = true,
  rightComponent,
  ...props
}) => {
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
      <View style={[
        styles.inputWrapper,
        error && styles.inputError,
        !editable && styles.inputDisabled,
        multiline && styles.inputMultiline
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? '#ff4444' : '#666'}
            style={styles.icon}
          />
        )}
        <RNTextInput
          style={[
            styles.input,
            multiline && styles.inputTextMultiline
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
        {rightComponent}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
    backgroundColor: '#fafafa',
    transition: 'all 0.2s',
  },
  inputMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 12,
  },
  inputTextMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default FormInput;
