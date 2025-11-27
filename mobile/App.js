import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      <MoreStack.Screen name="RecurringExpenses" component={RecurringExpenses} />
      <MoreStack.Screen name="Settings" component={Settings} />
    </MoreStack.Navigator>
  );
}

// More Menu Screen with nice UI
function MoreMenuScreen({ navigation }) {
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();

  const menuItems = [
    { name: 'Vaccinations', icon: 'medkit', label: 'Vaccinations', color: '#ef4444', bg: '#fef2f2' },
    { name: 'Calves', icon: 'heart', label: 'Calves', color: '#ec4899', bg: '#fdf2f8' },
    { name: 'Reports', icon: 'bar-chart', label: 'Reports', color: '#8b5cf6', bg: '#f5f3ff' },
    { name: 'Contracts', icon: 'document-text', label: 'Contracts', color: '#06b6d4', bg: '#ecfeff' },
    { name: 'RecurringExpenses', icon: 'repeat', label: 'Recurring Expenses', color: '#f59e0b', bg: '#fffbeb' },
    { name: 'Settings', icon: 'settings', label: 'Settings', color: '#6366f1', bg: '#eef2ff' },
  ];

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
      <ScrollView style={moreStyles.menuContainer} showsVerticalScrollIndicator={false}>
        <Text style={moreStyles.sectionTitle}>More Options</Text>
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
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={moreStyles.logoutButton} onPress={() => logout()} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" color="#ef4444" size={22} />
          <Text style={moreStyles.logoutLabel}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={moreStyles.version}>Farm Management v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const moreStyles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
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
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
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
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutLabel: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
  version: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    paddingVertical: 20,
  },
});

// Bottom Tab Navigator
function BottomTabs() {
  const insets = useSafeAreaInsets();
  
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
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Animals" 
        component={Animals}
      />
      <Tab.Screen 
        name="Milk" 
        component={MilkProduction}
        options={{ tabBarLabel: 'Production' }}
      />
      <Tab.Screen 
        name="Sales" 
        component={MilkSales}
      />
      <Tab.Screen 
        name="More"
        component={MoreStackNavigator}
        options={{ tabBarLabel: 'More' }}
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
