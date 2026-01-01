import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import api from './utils/api';
import './i18n';

// Screens
import Login from './screens/Login';
import Register from './screens/Register';
import Dashboard from './screens/Dashboard';
import Animals from './screens/Animals';
import MilkProduction from './screens/MilkProduction';
import MilkSales from './screens/MilkSales';
import Expenses from './screens/Expenses';
import Vaccinations from './screens/Vaccinations';
import Calves from './screens/Calves';
import Reports from './screens/Reports';
import Contracts from './screens/Contracts';
import RecurringExpenses from './screens/RecurringExpenses';
import Settings from './screens/Settings';
import FeedCalculations from './screens/FeedCalculations';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const MoreStack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}

// Home Stack Navigator (Dashboard + secondary screens)
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="DashboardMain" component={Dashboard} />
      <HomeStack.Screen name="Expenses" component={Expenses} />
    </HomeStack.Navigator>
  );
}

// More Stack Navigator (Settings and other screens)
function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} />
      <MoreStack.Screen name="Vaccinations" component={Vaccinations} />
      <MoreStack.Screen name="Calves" component={Calves} />
      <MoreStack.Screen name="Reports" component={Reports} />
      <MoreStack.Screen name="Contracts" component={Contracts} />
      <MoreStack.Screen name="Expenses" component={Expenses} />
      <MoreStack.Screen name="RecurringExpenses" component={RecurringExpenses} />
      <MoreStack.Screen name="Settings" component={Settings} />
      <MoreStack.Screen name="FeedCalculations" component={FeedCalculations} />
    </MoreStack.Navigator>
  );
}

// More Menu Screen with nice UI
function MoreMenuScreen({ navigation }) {
  const { logout, user, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const menuItems = [
    { name: 'Vaccinations', icon: 'medkit', label: t('more.vaccinations'), color: '#ef4444', bg: '#fef2f2' },
    { name: 'Calves', icon: 'heart', label: t('more.calves'), color: '#ec4899', bg: '#fdf2f8' },
    { name: 'Reports', icon: 'bar-chart', label: t('more.reports'), color: '#8b5cf6', bg: '#f5f3ff' },
    { name: 'Contracts', icon: 'document-text', label: t('more.contracts'), color: '#06b6d4', bg: '#ecfeff' },
    { name: 'Expenses', icon: 'repeat', label: t('more.expenses'), color: '#f59e0b', bg: '#fffbeb' },
    { name: 'RecurringExpenses', icon: 'repeat', label: t('more.recurringExpenses'), color: '#f59e0b', bg: '#fffbeb' },
    { name: 'FeedCalculations', icon: 'calculator', label: 'Feed Calculations', color: '#10b981', bg: '#d1fae5' },
    { name: 'Settings', icon: 'settings', label: t('more.settings'), color: '#6366f1', bg: '#eef2ff' },
  ];

  const changeLanguage = async (language) => {
    try {
      const RTL_LANGUAGES = ['ur', 'ar', 'he', 'fa'];
      const isRTL = RTL_LANGUAGES.includes(language);
      const currentRTL = I18nManager.isRTL;

      // Save language to AsyncStorage
      await AsyncStorage.setItem('userLanguage', language);

      // Save language preference to server
      try {
        const response = await api.put('/auth/language', { preferredLanguage: language });
        if (response.data.success) {
          // Update user in context and AsyncStorage
          const updatedUser = { ...user, preferredLanguage: language };
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error saving language to server:', error);
      }

      // Change language in i18n
      i18n.changeLanguage(language);

      setShowLanguageModal(false);

      // If RTL direction needs to change, show alert and reload
      if (isRTL !== currentRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        await AsyncStorage.setItem('isRTL', isRTL.toString());

        Alert.alert(
          t('language.restartRequired') || 'Restart Required',
          t('language.restartMessage') || 'Please restart the app to apply the layout direction changes.',
          [
            {
              text: t('common.cancel'),
              style: 'cancel'
            },
            {
              text: t('language.restart') || 'Restart',
              onPress: async () => {
                if (__DEV__) {
                  Alert.alert('Development Mode', 'Please reload the app manually (shake device and tap Reload).');
                } else {
                  try {
                    await Updates.reloadAsync();
                  } catch (error) {
                    Alert.alert('Restart Required', 'Please close and reopen the app to apply changes.');
                  }
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[moreStyles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={moreStyles.avatarContainer}>
          <View style={moreStyles.avatar}>
            <Text style={moreStyles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'F'}
            </Text>
          </View>
        </View>
        <Text style={moreStyles.userName}>{user?.farmName || 'Farm Management'}</Text>
        <Text style={moreStyles.userEmail}>{user?.email || ''}</Text>
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView showsVerticalScrollIndicator={true}>
        <Text style={moreStyles.sectionTitle}>{t('more.title')}</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={moreStyles.menuItem}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <View style={[moreStyles.menuItemIcon, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={moreStyles.menuItemText}>{item.label}</Text>
            <Ionicons
              name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
        ))}

        {/* Language Selection */}
        <TouchableOpacity
          style={moreStyles.menuItem}
          onPress={() => setShowLanguageModal(true)}
          activeOpacity={0.7}
        >
          <View style={[moreStyles.menuItemIcon, { backgroundColor: '#f0f9ff' }]}>
            <Ionicons name="language" size={22} color="#0ea5e9" />
          </View>
          <Text style={moreStyles.menuItemText}>{t('more.language')}</Text>
          <Text style={moreStyles.currentLanguage}>
            {i18n.language === 'ur' ? t('language.urdu') : t('language.english')}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={moreStyles.logoutButton} onPress={() => logout()} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" color="#ef4444" size={22} />
          <Text style={moreStyles.logoutLabel}>{t('more.signOut')}</Text>
        </TouchableOpacity>
        <Text style={moreStyles.version}>{t('more.version')}</Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={moreStyles.modalOverlay}>
          <View style={moreStyles.modalContent}>
            <Text style={moreStyles.modalTitle}>{t('language.title')}</Text>

            <TouchableOpacity
              style={[
                moreStyles.languageOption,
                i18n.language === 'en' && moreStyles.selectedLanguage
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={moreStyles.languageText}>{t('language.english')}</Text>
              {i18n.language === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                moreStyles.languageOption,
                i18n.language === 'ur' && moreStyles.selectedLanguage
              ]}
              onPress={() => changeLanguage('ur')}
            >
              <Text style={moreStyles.languageText}>{t('language.urdu')}</Text>
              {i18n.language === 'ur' && (
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={moreStyles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={moreStyles.closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const moreStyles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: I18nManager.isRTL ? 'flex-end' : 'center',
  },
  avatarContainer: {
    marginBottom: 12,
    alignItems: I18nManager.isRTL ? 'flex-end' : 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: I18nManager.isRTL ? 'right' : 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'center',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: I18nManager.isRTL ? 'right' : 'center',
  },
  menuContainer: {
    flex: 1,
    padding: 16,
    alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  menuItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: I18nManager.isRTL ? 0 : 14,
    marginLeft: I18nManager.isRTL ? 14 : 0,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  logoutButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    width: '100%',
  },
  logoutLabel: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  version: {
    textAlign: I18nManager.isRTL ? 'right' : 'center',
    color: '#94a3b8',
    fontSize: 12,
    paddingVertical: 20,
  },
  currentLanguage: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: I18nManager.isRTL ? 'right' : 'center',
    marginBottom: 24,
  },
  languageOption: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedLanguage: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  closeButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: I18nManager.isRTL ? 'flex-end' : 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    textAlign: I18nManager.isRTL ? 'right' : 'center',
  },
});

// Bottom Tab Navigator
function BottomTabs() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Animals':
              iconName = focused ? 'paw' : 'paw-outline';
              break;
            case 'Milk':
              iconName = focused ? 'water' : 'water-outline';
              break;
            case 'Sales':
              iconName = focused ? 'cash' : 'cash-outline';
              break;
            case 'More':
              iconName = focused ? 'menu' : 'menu-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <View style={focused ? styles.activeTabIcon : null}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarLabel: t('dashboard.title') }}
      />
      <Tab.Screen
        name="Animals"
        component={Animals}
        options={{ tabBarLabel: t('dashboard.animals') }}
      />
      <Tab.Screen
        name="Milk"
        component={MilkProduction}
        options={{ tabBarLabel: t('milk.subtitle') }}
      />
      <Tab.Screen
        name="Sales"
        component={MilkSales}
        options={{ tabBarLabel: t('dashboard.sales') }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{ tabBarLabel: t('more.title').split(' ')[0] }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeTabIcon: {
    backgroundColor: '#eff6ff',
    padding: 6,
    borderRadius: 12,
  },
});

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 16, color: '#64748b', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <BottomTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
