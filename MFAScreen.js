import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MFAVerificationScreen({ 
  route, 
  navigation 
}) {
  const { email, userId, onVerifySuccess } = route.params;
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Mock MFA code for development (remove in production)
  const [mockCode, setMockCode] = useState("");

  // Generate mock code when screen loads
  useEffect(() => {
    const newMockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setMockCode(newMockCode);
    console.log(`🔐 MOCK MFA CODE: ${newMockCode}`);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (mfaCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock verification - in production, this would call your backend
      if (mfaCode === mockCode) {
        Alert.alert("Success", "MFA verification successful!");
        
        // Call the success callback with user data
        if (onVerifySuccess) {
          onVerifySuccess();
        } else {
          // Fallback navigation
          navigation.reset({
            index: 0,
            routes: [{ name: 'ROOT_TABS' }],
          });
        }
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError("");
    setCanResend(false);
    setTimeLeft(30);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMockCode = Math.floor(100000 + Math.random() * 900000).toString();
      setMockCode(newMockCode);
      console.log(`🔐 MOCK MFA CODE: ${newMockCode}`);
      
      setError("New code sent! Check console for development mode.");
    } catch (err) {
      setError("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email) => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.slice(0, 2) + '*'.repeat(local.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Verification Required</Text>
        </View>

        {/* Icon and Instructions */}
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#78a756ff" />
        </View>

        <Text style={styles.subtitle}>
          We sent a verification code to
        </Text>
        <Text style={styles.emailText}>{maskEmail(email)}</Text>

        {/* Mock Code Display - Remove in production */}
        <View style={styles.mockContainer}>
          <Text style={styles.mockTitle}>🛠️ DEVELOPMENT MODE</Text>
          <Text style={styles.mockCode}>Code: {mockCode}</Text>
          <Text style={styles.mockNote}>(In production, this would be sent via email/authenticator)</Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={[
            styles.messageBox, 
            error.includes('sent') ? styles.successBox : styles.errorBox
          ]}>
            <Text style={styles.messageText}>{error}</Text>
          </View>
        ) : null}

        {/* Code Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter 6-digit code</Text>
          <TextInput
            style={styles.codeInput}
            value={mfaCode}
            onChangeText={(text) => {
              setMfaCode(text.replace(/\D/g, '').slice(0, 6));
              setError("");
            }}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
          />
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (loading || mfaCode.length !== 6) && styles.buttonDisabled
          ]}
          onPress={handleVerify}
          disabled={loading || mfaCode.length !== 6}
        >
          <Text style={styles.verifyButtonText}>
            {loading ? "Verifying..." : "Verify Code"}
          </Text>
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            Didn't receive the code? 
          </Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={!canResend || loading}
          >
            <Text style={[
              styles.resendButtonText,
              (!canResend || loading) && styles.resendDisabled
            ]}>
              {canResend ? "Resend Code" : `Resend in ${timeLeft}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F9F4",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    position: "absolute",
    top: 50,
    left: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2A37",
    marginLeft: 10,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2A37",
    textAlign: "center",
    marginBottom: 30,
  },
  mockContainer: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  mockTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
    marginBottom: 5,
  },
  mockCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 5,
  },
  mockNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  successBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  messageText: {
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    textAlign: "center",
  },
  codeInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: "#78a756ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
    marginRight: 5,
  },
  resendButtonText: {
    fontSize: 14,
    color: "#78a756ff",
    fontWeight: "600",
  },
  resendDisabled: {
    color: "#9CA3AF",
  },
});