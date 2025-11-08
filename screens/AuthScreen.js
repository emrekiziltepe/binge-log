import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { registerUser, loginUser, onAuthStateChange, resendEmailVerification, loginWithGoogle, loginWithApple } from '../services/authService';
import { ThemeContext } from '../contexts/ThemeContext';
import { authStyles } from '../styles/authStyles';

const AuthScreen = ({ onAuthSuccess, onClose }) => {
  const { t } = useTranslation();
  const { colors } = useContext(ThemeContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [socialLoading, setSocialLoading] = useState({ google: false, apple: false });

  useEffect(() => {
    // Listen to auth state
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        onAuthSuccess(user);
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // onAuthSuccess won't be in dependency because it's memoized with useCallback

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text && !validateEmail(text)) {
      setEmailError(t('auth.invalidEmail'));
    } else {
      setEmailError('');
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.error'), t('auth.fillAllFields'));
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t('auth.error'), t('auth.invalidEmail'));
      setEmailError(t('auth.invalidEmail'));
      return;
    }

    if (!isLogin && !displayName) {
      Alert.alert(t('auth.error'), t('auth.displayNameRequired'));
      return;
    }

    setEmailError('');

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await loginUser(email, password);
      } else {
        result = await registerUser(email, password, displayName);
      }

      if (result.success) {
        // Email verification message after registration
        if (!isLogin && result.emailVerificationSent) {
          Alert.alert(
            t('auth.verifyEmailTitle'),
            t('auth.emailVerificationSent'),
            [
              {
                text: t('common.ok'),
                onPress: () => {
                  // User cannot login until email is verified
                  setIsLogin(true);
                  // Clear form
                  setEmail('');
                  setPassword('');
                  setDisplayName('');
                }
              }
            ]
          );
        } else {
          // Login successful
          onAuthSuccess(result.user);
          Alert.alert(
            t('auth.success'),
            t('auth.loginSuccess')
          );
        }
      } else {
        // Special handling for unverified users
        if (result.error === 'emailNotVerified') {
          Alert.alert(
            t('auth.verifyEmailTitle'),
            t('auth.emailNotVerified'),
            [
              {
                text: t('common.ok'),
                style: 'default'
              }
            ]
          );
        } else {
          // Convert Firebase error code to user-friendly message
          const errorMessage = t(`auth.${result.error}`) || result.error || t('auth.unknownError');
          Alert.alert(t('auth.error'), errorMessage);
          
          // Show in input as well if email error
          if (result.errorCode === 'auth/invalid-email') {
            setEmailError(t('auth.invalidEmail'));
          }
        }
      }
    } catch (error) {
      Alert.alert(t('auth.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: colors.text }]}>
            {isLogin ? t('auth.login') : t('auth.register')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.card }]}>
          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder 
              }]}
              onPress={async () => {
                setSocialLoading({ ...socialLoading, google: true });
                try {
                  const result = await loginWithGoogle();
                  if (result.success) {
                    onAuthSuccess(result.user);
                    Alert.alert(t('auth.success'), t('auth.loginSuccess'));
                  } else if (result.error !== 'cancelled') {
                    const errorMessage = t(`auth.${result.error}`) || result.error || t('auth.unknownError');
                    Alert.alert(t('auth.error'), errorMessage);
                  }
                } catch (error) {
                  Alert.alert(t('auth.error'), error.message);
                } finally {
                  setSocialLoading({ ...socialLoading, google: false });
                }
              }}
              disabled={socialLoading.google || socialLoading.apple || loading}
            >
              <Ionicons name="logo-google" size={20} color={colors.text} />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                {socialLoading.google ? t('auth.loading') : t('auth.loginWithGoogle')}
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton, { 
                  backgroundColor: colors.text,
                  borderColor: colors.text 
                }]}
                onPress={async () => {
                  setSocialLoading({ ...socialLoading, apple: true });
                  try {
                    const result = await loginWithApple();
                    if (result.success) {
                      onAuthSuccess(result.user);
                      Alert.alert(t('auth.success'), t('auth.loginSuccess'));
                    } else if (result.error !== 'cancelled') {
                      const errorMessage = t(`auth.${result.error}`) || result.error || t('auth.unknownError');
                      Alert.alert(t('auth.error'), errorMessage);
                    }
                  } catch (error) {
                    Alert.alert(t('auth.error'), error.message);
                  } finally {
                    setSocialLoading({ ...socialLoading, apple: false });
                  }
                }}
                disabled={socialLoading.google || socialLoading.apple || loading}
              >
                <Ionicons name="logo-apple" size={20} color={colors.background} />
                <Text style={[styles.socialButtonText, styles.appleButtonText, { color: colors.background }]}>
                  {socialLoading.apple ? t('auth.loading') : t('auth.loginWithApple')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.inputBorder }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
              {t('auth.or')}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.inputBorder }]} />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth.displayName')}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder,
                  color: colors.inputText
                }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('auth.displayNamePlaceholder')}
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('auth.email')}</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: emailError ? colors.error : colors.inputBorder,
                  color: colors.inputText
                }
              ]}
              value={email}
              onChangeText={handleEmailChange}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {emailError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{emailError}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('auth.password')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder,
                color: colors.inputText
              }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={colors.placeholder}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && { backgroundColor: colors.textTertiary }]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('auth.loading') : (isLogin ? t('auth.login') : t('auth.register'))}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={[styles.switchText, { color: colors.primary }]}>
              {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = authStyles;

export default AuthScreen;
