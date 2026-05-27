import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { auth, sendPasswordResetEmail } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (error: any) {
      let message = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email';
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#4a90e2" />
            </View>
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successText}>
              Password reset link has been sent to:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.successHint}>
              Check your email and follow the instructions
            </Text>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Don't worry, enter your email and we'll send you a link to reset your password
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#888"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.resetButton, loading && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password?</Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f5c',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0aef5',
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#2563d9',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#a0aef5',
    fontSize: 14,
  },
  loginLink: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    color: '#a0aef5',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '700',
    marginBottom: 16,
  },
  successHint: {
    fontSize: 14,
    color: '#a0aef5',
    textAlign: 'center',
    marginBottom: 32,
  },
  backToLoginButton: {
    backgroundColor: '#2563d9',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backToLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});