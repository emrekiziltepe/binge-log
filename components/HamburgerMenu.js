import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { changeLanguage } from '../i18n';
import { logoutUser, loginUser, registerUser } from '../services/authService';
import AuthScreen from '../screens/AuthScreen';
import { ThemeContext } from '../contexts/ThemeContext';

const HamburgerMenu = ({ navigation, user, onUserChange, onShowAuthModal, syncStatus }) => {
  const { t, i18n } = useTranslation();
  const { theme, colors, toggleTheme } = useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));

  const openMenu = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const openLanguageModal = () => {
    setModalVisible(false); // Close main menu first
    setTimeout(() => {
      setLanguageModalVisible(true); // Then open language modal
    }, 300); // Wait for animation to finish
  };

  const languages = [
    { code: 'tr', name: t('hamburgerMenu.turkish'), flag: '🇹🇷' },
    { code: 'en', name: t('hamburgerMenu.english'), flag: '🇺🇸' }
  ];

  const changeLanguageHandler = async (languageCode) => {
    await changeLanguage(languageCode);
    setLanguageModalVisible(false);
  };



  const handleLogin = () => {
    closeMenu();
    if (onShowAuthModal) {
      onShowAuthModal();
    } else {
      setAuthModalVisible(true);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('auth.logout'),
      t('hamburgerMenu.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              closeMenu(); // Close menu first
              const result = await logoutUser();
              if (result && result.success) {
                // Auth state listener will automatically update to null
                // But also ensure manual update
                if (onUserChange) {
                  onUserChange(null);
                }
              } else {
                Alert.alert(
                  t('auth.error'),
                  result?.error || t('auth.unknownError')
                );
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(
                t('auth.error'),
                error?.message || t('auth.unknownError')
              );
            }
          }
        }
      ]
    );
  };

  const handleAuthSuccess = (user) => {
    setAuthModalVisible(false);
    if (onUserChange) {
      onUserChange(user);
    }
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
  };

  const handleThemeToggle = () => {
    toggleTheme();
    closeMenu();
  };

  const menuItems = [
    // Sync status indicator (only for logged-in users)
    ...(user ? [{
      icon: syncStatus?.syncInProgress ? 'sync' : (syncStatus?.isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'),
      title: syncStatus?.syncInProgress ? t('hamburgerMenu.syncing') :
        (syncStatus?.isOnline ? t('hamburgerMenu.online') : t('hamburgerMenu.offline')),
      subtitle: syncStatus?.syncInProgress ? t('hamburgerMenu.syncingMessage') :
        (syncStatus?.isOnline ? t('hamburgerMenu.autoSync') : t('hamburgerMenu.offlineMessage')),
      onPress: () => { }, // Information only
      disabled: true,
    }] : []),
    {
      icon: theme === 'dark' ? 'sunny-outline' : 'moon',
      title: theme === 'dark' ? t('hamburgerMenu.darkTheme') : t('hamburgerMenu.lightTheme'),
      subtitle: theme === 'dark' ? t('hamburgerMenu.lightThemeSubtitle') : t('hamburgerMenu.darkThemeSubtitle'),
      onPress: handleThemeToggle,
    },
    {
      icon: 'language-outline',
      title: t('hamburgerMenu.language'),
      subtitle: getCurrentLanguage().name,
      onPress: openLanguageModal,
    },
    // Login/Logout butonu
    ...(user ? [
      {
        icon: 'log-out-outline',
        title: t('auth.logout'),
        subtitle: user?.displayName || user?.email || t('hamburgerMenu.user'),
        onPress: handleLogout,
      }
    ] : [
      {
        icon: 'log-in-outline',
        title: t('auth.login'),
        subtitle: t('hamburgerMenu.loginSubtitle'),
        onPress: handleLogin,
      }
    ]),
    {
      icon: 'information-circle-outline',
      title: t('hamburgerMenu.about'),
      subtitle: `${t('hamburgerMenu.appName')} ${Constants.expoConfig?.version || t('hamburgerMenu.version')}`,
      onPress: () => {
        closeMenu();
        // About modal can be opened
      },
    },
  ];

  return (
    <View>
      {/* Hamburger Button */}
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={openMenu}
        testID="hamburger-button"
      >
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
      </TouchableOpacity>

      {/* Side Menu */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: colors.modalBackground }]}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <Animated.View
            style={[
              styles.menuContainer,
              { backgroundColor: colors.surface, transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t('hamburgerMenu.settings')}</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, { borderBottomColor: colors.borderLight }, item.disabled && styles.menuItemDisabled]}
                  onPress={item.disabled ? undefined : item.onPress}
                  disabled={item.disabled}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={item.disabled ? colors.textTertiary : colors.primary}
                    />
                    <View style={styles.menuItemText}>
                      <Text style={[styles.menuItemTitle, { color: item.disabled ? colors.textTertiary : colors.text }, item.disabled && styles.menuItemTextDisabled]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.menuItemSubtitle, { color: item.disabled ? colors.textTertiary : colors.textSecondary }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                  {!item.disabled && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => {
          setLanguageModalVisible(false);
        }}
      >
        <TouchableOpacity
          style={[styles.languageModalOverlay, { backgroundColor: colors.modalBackground }]}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.languageModalContent, { backgroundColor: colors.modalContent }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.languageModalHeader}>
              <Text style={[styles.languageModalTitle, { color: colors.text }]}>{t('hamburgerMenu.chooseLanguage')}</Text>
              <TouchableOpacity
                onPress={() => setLanguageModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  { backgroundColor: i18n.language === language.code ? colors.surfaceSecondary : 'transparent' }
                ]}
                onPress={() => changeLanguageHandler(language.code)}
              >
                <Text style={styles.flag}>{language.flag}</Text>
                <Text style={[
                  styles.languageName,
                  { color: i18n.language === language.code ? colors.primary : colors.text }
                ]}>
                  {language.name}
                </Text>
                {i18n.language === language.code && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  hamburgerButton: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
    paddingVertical: 2,
    marginRight: 16,
  },
  hamburgerLine: {
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    width: 280,
    height: '100%',
    paddingTop: 60,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemTextDisabled: {
    color: '#999',
  },
  languageModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModalContent: {
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  flag: {
    fontSize: 18,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  selectedLanguageText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default HamburgerMenu;
