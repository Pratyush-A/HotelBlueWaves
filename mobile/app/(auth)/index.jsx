import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet
} from 'react-native';
import { useRouter, Link } from "expo-router";
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from '../../store/authStore';

const COLORS = {
  primary: "#007FFF",          // Deep Blue
  accent: "#38BDF8",           // Turquoise Blue
  background: "#F5F7FA",       // Light Gray
  cardBackground: "#FFFFFF",   // White card
  textPrimary: "#1E293B",      // Dark gray-blue
  textSecondary: "#64748B",    // Subtle gray
  border: "#E2E8F0",           // Light border
  danger: "#EF4444",
  success: "#14B8A6",
  placeholderText: "#94A3B8",
};

export default function Login() {
  const router = useRouter(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const { isLoading, login } = useAuthStore();

  const showAlert = (msg, type = "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogin = async () => {
    try {
      const result = await login(email, password);
      if (!result || typeof result !== "object") {
        showAlert("Unexpected response. Please try again.");
        return;
      }
      if (!result.success) {
        showAlert(result.error || "Login failed.");
      } else {
        showAlert("Login successful", "success");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>

          {/* Illustration */}
          <View style={styles.topIllustration}>
            <Image
              source={require("../../assets/images/i2.png")}
              style={styles.illustrationImage}
              contentFit="contain"
            />
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.formContainer}>
              
              {message !== "" && (
                <View
                  style={[
                    styles.alertBox,
                    {
                      backgroundColor:
                        messageType === "error" ? "#ffeded" : "#e6ffed",
                      borderColor:
                        messageType === "error" ? "#ff5a5f" : "#00c851",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: messageType === "error" ? "#cc0000" : "#007e33",
                      textAlign: "center",
                    }}
                  >
                    {message}
                  </Text>
                </View>
              )}

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.placeholderText}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.placeholderText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Forgot password */}
              <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text style={styles.forgotLink}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Signup */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't Have an Account?</Text>
                <Link href="/signup" asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}> Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  topIllustration: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
  },
  illustrationImage: {
    width: 200,
    height: 200,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotLink: {
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginLeft: 5,
  },
  alertBox: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
});
