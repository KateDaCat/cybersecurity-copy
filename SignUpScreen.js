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
import { registerUser } from "../../services/api"; // ✅ Backend placeholder

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Local validation before sending to backend
  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all the fields.");
      return false;
    }
    if (password.length < 8) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters long."
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await registerUser({ name, email, password });
      if (response.success) {
        Alert.alert("Account Created", "You can now log in!");
        navigation.navigate("Login");
      }
    } catch (error) {
      Alert.alert("Sign Up Failed", error.message || "Something went wrong.");
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
        <Image source={require("../../assets/logo.jpg")} style={styles.logo} />
        <Text style={styles.title}>Get Started Now</Text>
        <Text style={styles.subtitle}>
          Join us today and explore our amazing features!
        </Text>

        {/* ✅ Buttons to switch between Login / Sign Up */}
        <View style={styles.switchButtons}>
          <TouchableOpacity style={[styles.switchButton, styles.activeButton]}>
            <Text style={[styles.switchText, styles.activeText]}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.switchText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#ccc"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* ✅ Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#ccc"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* ✅ Password */}
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

        {/* ✅ Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Re-enter your password"
              placeholderTextColor="#ccc"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.iconButton}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#ccc"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ Sign Up Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Creating..." : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// ✅ Styles (Identical to LoginScreen)
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    width: "100%",
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    position: "absolute",
    right: 10,
  },
  loginButton: {
    backgroundColor: "#78a756ff",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});


