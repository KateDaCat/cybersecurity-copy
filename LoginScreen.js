import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  startPasswordLogin,
  verifyMfaCode,
  fetchCurrentProfile,
  forgotPassword,
} from "./api";
import { ADMIN_ROOT, ROOT_TABS } from "./routes";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // MFA state variables
  const [step, setStep] = useState(1); // 1: credentials, 2: MFA verification
  const [mfaCode, setMfaCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState("");
  const [pendingRole, setPendingRole] = useState(null);

  // Handle credentials submission - FIXED VERSION
  const handleCredentialsSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await startPasswordLogin(email.trim().toLowerCase(), password);
      setCodeSentTo(response.code_sent_to || response.sent_to || maskEmail(email));
      setPendingRole(response.role || response.role_key || null);
      setMfaCode("");
      setStep(2);
    } catch (err) {
      Alert.alert("Login Failed", err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA verification - UPDATED VERSION
  const handleMFASubmit = async () => {
    if (mfaCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-digit verification code.");
      return;
    }

    setLoading(true);
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
      const friendlyRole =
        normalizedRole === "public" || normalizedRole === "user"
          ? "user"
          : normalizedRole;
      const destination =
        normalizedRole === "admin" || normalizedRole === "researcher"
          ? ADMIN_ROOT
          : ROOT_TABS;

      if (rememberMe) {
        console.log("User wants to be remembered:", email);
      }

      Alert.alert("Login Successful", `Signed in as ${friendlyRole}.`);

      navigation.reset({
        index: 0,
        routes: [{ name: destination }],
      });
    } catch (err) {
      Alert.alert("Verification Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Enter your credentials again to request a new code.");
      return;
    }

    setLoading(true);
    try {
      const response = await startPasswordLogin(email.trim().toLowerCase(), password);
      setCodeSentTo(response.code_sent_to || response.sent_to || maskEmail(email));
      setPendingRole(response.role || response.role_key || pendingRole);
      Alert.alert("Code Sent", "A new verification code has been sent.");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // Mask email function
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

  // Back to credentials step
  const handleBackToLogin = () => {
    setStep(1);
    setMfaCode("");
    setPendingRole(null);
    setCodeSentTo("");
  };

  // Your original forgot password function
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Missing Email", "Please enter your registered email first.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert("Check Your Inbox", "Password reset link sent!");
      console.log("Password reset requested for:", email);
    } catch (error) {
      Alert.alert("Error", error.message || "Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/signup-bg.jpg")} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Image
          source={require("../../assets/logo.jpg")} 
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Join us today and explore our amazing features!
        </Text>

        {/* Buttons to switch between Sign Up / Login */}
        <View style={styles.switchButtons}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={styles.switchText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.switchButton, styles.activeButton]}>
            <Text style={[styles.switchText, styles.activeText]}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Step 1 - Credentials Form */}
        {step === 1 && (
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#ccc"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#ccc"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.rowContainer}>
              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
              <Ionicons
                name={rememberMe ? "checkbox" : "square-outline"}
                size={22}
                color={rememberMe ? "#4CAF50" : "#ccc"}
              />
              <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleCredentialsSubmit}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Loading..." : "Login"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2 - MFA Verification */}
        {step === 2 && (
          <View style={styles.formContainer}>
            <View style={styles.mfaHeader}>
              <View style={styles.mfaIconContainer}>
                <Ionicons name="mail" size={40} color="#fff" />
              </View>
              <Text style={styles.mfaTitle}>Email Verification</Text>
                <Text style={styles.mfaSubtitle}>
                  We sent a 6-digit code to{"\n"}
                  <Text style={styles.emailHighlight}>
                    {codeSentTo || maskEmail(email)}
                  </Text>
                </Text>
                <Text style={styles.mfaHint}>
                  Check your email and enter the code below.
                </Text>
            </View>

            {/* MFA Code Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>6-Digit Code</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="123456"
                placeholderTextColor="#ccc"
                value={mfaCode}
                onChangeText={(text) => setMfaCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />
            </View>

            {/* MFA Action Buttons */}
            <View style={styles.mfaButtonGroup}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBackToLogin}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.verifyButton,
                  (loading || mfaCode.length !== 6) && styles.buttonDisabled
                ]}
                onPress={handleMFASubmit}
                disabled={loading || mfaCode.length !== 6}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? "Verifying..." : "Verify Code"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Resend Code Option */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code?
              </Text>
              <TouchableOpacity 
                onPress={handleResendCode}
                disabled={loading}
              >
                <Text style={styles.resendButton}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#ddd",
    marginBottom: 20,
    textAlign: "center",
  },
  switchButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
  },
  switchButton: {
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
    marginHorizontal: 8,
  },
  switchText: {
    color: "#fff",
    fontWeight: "bold",
  },
  activeButton: {
    backgroundColor: "#78a756ff",
    borderColor: "#78a756ff",
  },
  activeText: {
    color: "#fff",
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: "#fff",
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  codeInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    position: "absolute",
    right: 10,
    padding: 8,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
  },
  forgotText: {
    color: "#78a756ff",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#78a756ff",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // MFA Styles
  mfaHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  mfaIconContainer: {
    backgroundColor: "rgba(120, 167, 86, 0.8)",
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
  },
  mfaTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  mfaSubtitle: {
    fontSize: 14,
    color: "#ddd",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 5,
  },
  emailHighlight: {
    fontWeight: "bold",
    color: "#78a756ff",
  },
  mfaHint: {
    fontSize: 13,
    color: "#bbb",
    textAlign: "center",
    marginBottom: 20,
  },
  mfaButtonGroup: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  verifyButton: {
    flex: 2,
    paddingVertical: 15,
    backgroundColor: "#78a756ff",
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "rgba(120, 167, 86, 0.5)",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendContainer: {
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  resendText: {
    color: "#ddd",
    fontSize: 13,
    marginBottom: 8,
  },
  resendButton: {
    color: "#78a756ff",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});