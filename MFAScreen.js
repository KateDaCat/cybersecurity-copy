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
import {
  verifyMfaCode,
  fetchCurrentProfile,
  startPasswordLogin,
} from "./api";
import { ADMIN_ROOT, ROOT_TABS } from "./routes";

export default function MFAVerificationScreen({
  route,
  navigation,
}) {
  const { email, password, onVerifySuccess, roleHint } = route.params ?? {};
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [codeSentTo, setCodeSentTo] = useState(email ? maskEmail(email) : "");
  const [pendingRole, setPendingRole] = useState(roleHint ?? null);

  useEffect(() => {
    if (!codeSentTo && email) {
      setCodeSentTo(maskEmail(email));
    }
    setTimeLeft(30);
    setCanResend(false);

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
  }, [email, codeSentTo]);

  const handleVerify = async () => {
    if (mfaCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const verification = await verifyMfaCode(mfaCode);
      const profile = await fetchCurrentProfile().catch(() => null);

      const resolvedRole =
        profile?.user?.role ||
        profile?.user?.role_name ||
        verification?.role ||
        pendingRole ||
        "public";

      const normalizedRole = String(resolvedRole || "").toLowerCase();
      const destination =
        normalizedRole === "admin" || normalizedRole === "researcher"
          ? ADMIN_ROOT
          : ROOT_TABS;

      Alert.alert("Success", "MFA verification successful!");

      if (onVerifySuccess) {
        onVerifySuccess({
          role: normalizedRole,
          profile: profile?.user ?? null,
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: destination }],
        });
      }

      setPendingRole(normalizedRole);
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError("");
    try {
      if (!email || !password) {
        throw new Error("Cannot resend code without email and password.");
      }

      const response = await startPasswordLogin(email.trim().toLowerCase(), password);
      setCodeSentTo(response.code_sent_to || response.sent_to || maskEmail(email));
      setPendingRole(response.role || response.role_key || pendingRole);
      setError("New code sent! Check your inbox.");
      setCanResend(false);
      setTimeLeft(30);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (value) => {
    if (!value || typeof value !== "string" || !value.includes("@")) {
      return value || "";
    }
    const [local, domain] = value.split("@");
    if (!domain) return value;
    const visible = local.slice(0, 2);
    const hiddenCount = Math.max(local.length - 2, 1);
    return `${visible}${"*".repeat(hiddenCount)}@${domain}`;
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
      <Text style={styles.emailText}>{codeSentTo || maskEmail(email)}</Text>

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