import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

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
const Drawer = createDrawerNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}

function CustomDrawerContent(props) {
  const { logout } = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        onPress={() => logout()}
        icon={({ color, size }) => (
          <Ionicons name="log-out-outline" color={color} size={size} />
        )}
      />
    </DrawerContentScrollView>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Dashboard" drawerContent={CustomDrawerContent}>
      <Drawer.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Animals" 
        component={Animals} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="paw" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Milk Production" 
        component={MilkProduction} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="water" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Milk Sales" 
        component={MilkSales} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Expenses" 
        component={Expenses} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calculator" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Vaccinations" 
        component={Vaccinations} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="medical" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Calves" 
        component={Calves} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Reports" 
        component={Reports} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Contracts" 
        component={Contracts} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Recurring Expenses" 
        component={RecurringExpenses} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="repeat" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={Settings} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
