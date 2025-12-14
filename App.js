import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View, ActivityIndicator, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';

// Import i18n
import './i18n';

// Import screens
import DailyFlowScreen from './screens/DailyFlowScreen';
import ReportsScreen from './screens/ReportsScreen';
import AuthScreen from './screens/AuthScreen';
import HamburgerMenu from './components/HamburgerMenu';
import GoalModal from './components/GoalModal';

// Import auth service
import { onAuthStateChange } from './services/authService';

// Import auto sync service
import autoSyncService from './services/autoSyncService';

// Import theme service
import themeService, { lightColors } from './services/themeService';

// Import Theme Context
import { ThemeContext } from './contexts/ThemeContext';

// Import goal service
import goalService from './services/goalService';
import { useGoals } from './hooks/useGoals';
import { getWeekStart, formatLocalDate } from './utils/dateUtils';

const Tab = createBottomTabNavigator();

export default function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    offlineQueueLength: 0
  });

  // Theme state
  const [theme, setThemeState] = useState('light');
  const [colors, setColors] = useState(lightColors);

  // Goals state
  const { goals, loadGoals } = useGoals();
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  // Initialize theme service
  useEffect(() => {
    themeService.init().then(() => {
      setThemeState(themeService.getTheme());
      setColors(themeService.getColors());
    });

    const unsubscribeTheme = themeService.addListener((newTheme) => {
      setThemeState(newTheme);
      setColors(themeService.getColors());
    });

    return () => {
      unsubscribeTheme();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Start auto sync service
  useEffect(() => {
    // Start auto sync service
    autoSyncService.startListening();

    // Listen to sync status changes
    const unsubscribeSync = autoSyncService.addListener((status) => {
      setSyncStatus(status);
    });

    // Perform automatic sync when user logs in
    if (user) {
      autoSyncService.performAutoSync();
    }

    return () => {
      unsubscribeSync();
    };
  }, [user]);

  // Theme handlers
  const handleSetTheme = async (newTheme) => {
    await themeService.setTheme(newTheme);
  };

  const handleToggleTheme = async () => {
    await themeService.toggleTheme();
  };

  // Auth success callback - memoized with useCallback (to prevent infinite loop)
  // IMPORTANT: All hooks must be called BEFORE early return
  const handleAuthSuccess = useCallback((user) => {
    setUser(user);
    setAuthModalVisible(false);
  }, []);

  // Auth modal kapatma callback
  const handleCloseAuthModal = useCallback(() => {
    setAuthModalVisible(false);
  }, []);

  // Theme context value
  const themeContextValue = {
    theme,
    colors,
    setTheme: handleSetTheme,
    toggleTheme: handleToggleTheme,
  };

  // Login is no longer required - user can use the app without logging in

  // Early return - must be AFTER all hooks
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <NavigationContainer>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Tab.Navigator
          key={user ? user.uid : 'guest'}
          screenOptions={({ route, navigation }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Daily') {
                iconName = focused ? 'today' : 'today-outline';
              } else if (route.name === 'Stats') {
                iconName = focused ? 'analytics' : 'analytics-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: colors.tabBarActive,
            tabBarInactiveTintColor: colors.tabBarInactive,
            tabBarStyle: {
              backgroundColor: colors.tabBarBackground,
              borderTopColor: colors.border,
            },
            headerStyle: {
              backgroundColor: colors.headerBackground + 'CC', // Semi-transparent
              borderBottomWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
            },
            headerTintColor: colors.headerText,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
              color: colors.headerText,
            },
            headerLeft: () => {
              // Check if there's a goal for current week or month
              const now = new Date();
              const currentWeekKey = goalService.getWeekKey(now);
              const currentMonthKey = goalService.getMonthKey(now);
              
              const hasWeeklyGoal = goals.weekly && goals.weekly[currentWeekKey] && 
                Object.values(goals.weekly[currentWeekKey]).some(v => v !== null && v !== undefined && v !== '' && v !== 0);
              
              const hasMonthlyGoal = goals.monthly && goals.monthly[currentMonthKey] && 
                Object.values(goals.monthly[currentMonthKey]).some(v => v !== null && v !== undefined && v !== '' && v !== 0);
              
              const hasAnyGoal = hasWeeklyGoal || hasMonthlyGoal;
              
              return (
                <View style={{ width: 48, alignItems: 'center', paddingLeft: 16 }}>
                  <TouchableOpacity
                    onPress={() => setGoalModalVisible(true)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="trophy"
                      size={30}
                      color={hasAnyGoal ? '#2bee6c' : colors.headerText}
                    />
                  </TouchableOpacity>
                </View>
              );
            },
            headerRight: () => (
              <View style={{ width: 48, alignItems: 'center', paddingRight: 16 }}>
                <HamburgerMenu
                  navigation={navigation}
                  user={user}
                  onUserChange={(newUser) => {
                    setUser(newUser);
                  }}
                  onShowAuthModal={() => setAuthModalVisible(true)}
                  syncStatus={syncStatus}
                />
              </View>
            ),
          })}
        >
          <Tab.Screen
            name="Daily"
            component={DailyFlowScreen}
            options={{ title: t('navigation.dailyLog') }}
          />
          <Tab.Screen
            name="Stats"
            component={ReportsScreen}
            options={{ title: t('navigation.statistics') }}
          />
        </Tab.Navigator>

        {/* Auth Modal */}
        {authModalVisible && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            elevation: 9999,
          }}>
            <AuthScreen
              onAuthSuccess={handleAuthSuccess}
              onClose={handleCloseAuthModal}
            />
          </View>
        )}

        {/* Goal Modal */}
        <GoalModal
          visible={goalModalVisible}
          onClose={() => {
            setGoalModalVisible(false);
            loadGoals();
          }}
        />

      </NavigationContainer>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightColors.background,
  },
});
