import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';

const Register = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmName: '',
    phoneNumber: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.farmName.trim()) {
      newErrors.farmName = 'Farm name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      Alert.alert('Success', 'Your account has been created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } else {
      Alert.alert('Registration Failed', result.message || 'Unable to create account. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'ur' : 'en')} style={styles.langButton}>
            <Text style={styles.langButtonText}>{i18n.language === 'en' ? 'اردو' : 'English'}</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🐄</Text>
          </View>
          <Text style={styles.mainTitle}>{t('register.title')}</Text>
          <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>{t('register.personalInfo')}</Text>
          
          <FormInput
            label={t('register.fullName')}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder={t('register.fullName')}
            icon="person-outline"
            error={errors.name}
            required
            editable={!loading}
          />

          <FormInput
            label={t('register.email')}
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder={t('register.email')}
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            required
            editable={!loading}
          />

          <FormInput
            label={t('register.phone')}
            value={formData.phoneNumber}
            onChangeText={(value) => handleChange('phoneNumber', value)}
            placeholder={t('register.phone')}
            icon="call-outline"
            keyboardType="phone-pad"
            error={errors.phoneNumber}
            editable={!loading}
          />

          <Text style={styles.sectionTitle}>{t('register.farmDetails')}</Text>

          <FormInput
            label={t('register.farmName')}
            value={formData.farmName}
            onChangeText={(value) => handleChange('farmName', value)}
            placeholder={t('register.farmName')}
            icon="home-outline"
            error={errors.farmName}
            required
            editable={!loading}
          />

          <FormInput
            label={t('register.farmAddress')}
            value={formData.address}
            onChangeText={(value) => handleChange('address', value)}
            placeholder={`${t('register.farmAddress')} (${t('common.optional')})`}
            icon="location-outline"
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          <Text style={styles.sectionTitle}>{t('register.security')}</Text>

          <FormInput
            label={t('register.password')}
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            placeholder={t('register.password')}
            icon="lock-closed-outline"
            secureTextEntry={!showPassword}
            error={errors.password}
            required
            editable={!loading}
            rightComponent={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            }
          />

          <FormInput
            label={t('register.confirmPassword')}
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            placeholder={t('register.confirmPassword')}
            icon="lock-closed-outline"
            secureTextEntry={!showConfirmPassword}
            error={errors.confirmPassword}
            required
            editable={!loading}
            rightComponent={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            }
          />

          <FormButton
            title={t('register.createAccount')}
            onPress={handleSubmit}
            variant="success"
            icon="checkmark-circle-outline"
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.submitButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t('register.alreadyHaveAccount')} </Text>
              <Text style={styles.loginLink}>{t('register.signIn')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('login.footer')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 48,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    marginTop: 8,
  },
  submitButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
  langButton: {
    position: 'absolute',
    top: -20,
    right: 0,
    padding: 8,
  },
  langButtonText: {
    color: '#007bff',
    fontWeight: '600',
  },
});

export default Register;