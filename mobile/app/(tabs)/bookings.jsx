import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  Platform,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuthStore } from "../../store/authStore";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";

const BASE_URL = "http://192.168.1.4:5000";

const COLORS = {
  primary: "#007FFF",
  accent: "#38BDF8",
  background: "#F5F7FA",
  card: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  placeholder: "#94A3B8",
};

export default function BookingsScreen() {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [newDate, setNewDate] = useState(new Date());
  const [discounts, setDiscounts] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [searchText, setSearchText] = useState("");
  const [pdfGenerated, setPdfGenerated] = useState({});

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch bookings");

      setBookings(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const handleExtendStay = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowDatePicker(true);
  };

  const onDateSelected = async (event, selectedDate) => {
    setShowDatePicker(false);
    if (!selectedDate || !selectedBookingId) return;

    try {
      const res = await fetch(`${BASE_URL}/api/bookings/extend/${selectedBookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newCheckOutDate: selectedDate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to extend stay");

      Alert.alert("Success", "Stay extended successfully");
      fetchBookings();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDiscountChange = (bookingId, value) => {
    setDiscounts((prev) => ({ ...prev, [bookingId]: value }));
  };

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateTotal = (booking) => {
    const nights =
      (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24);
    const roomPrice = booking.room?.price || 0;
    const discount = parseFloat(discounts[booking._id]) || 0;
    const total = roomPrice * nights;
    const finalAmount = Math.max(total - discount, 0);

    return { total, finalAmount, nights };
  };

  const generatePDF = async (booking) => {
    const { total, finalAmount, nights } = calculateTotal(booking);

    const html = `
      <html>
        <body style="padding: 20px; font-family: Arial">
          <h1>Hotel Blue Waves - Bill Invoice</h1>
          <hr />
          <p><strong>Guest:</strong> ${booking.guest?.name}</p>
          <p><strong>Phone:</strong> ${booking.guest?.phone}</p>
          <p><strong>Room Number:</strong> ${booking.room?.number}</p>
          <p><strong>Room Type:</strong> ${booking.room?.type || "N/A"}</p>
          <p><strong>Check-In:</strong> ${new Date(booking.checkIn).toDateString()}</p>
          <p><strong>Check-Out:</strong> ${new Date(booking.checkOut).toDateString()}</p>
          <p><strong>Nights:</strong> ${nights}</p>
          <p><strong>Price/Night:</strong> ₹${booking.room?.price}</p>
          <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
          <p><strong>Discount:</strong> ₹${(total - finalAmount).toFixed(2)}</p>
          <h3>Final Amount Payable: ₹${finalAmount.toFixed(2)}</h3>
          <hr />
          <p style="font-size: 12px; text-align: center">Thank you for choosing Hotel Blue Waves!</p>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Print.printAsync({ uri });

    setPdfGenerated((prev) => ({ ...prev, [booking._id]: true }));
  };

  const filteredBookings = bookings.filter((b) =>
    b.guest?.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TextInput
        style={styles.searchBar}
        placeholder="Search by guest name..."
        placeholderTextColor={COLORS.placeholder}
        value={searchText}
        onChangeText={setSearchText}
      />

      {filteredBookings.length === 0 ? (
        <View style={styles.centered}>
          <Text>No bookings found.</Text>
        </View>
      ) : (
        filteredBookings.map((booking) => {
          const { total, finalAmount, nights } = calculateTotal(booking);
          const isExpanded = expandedCards[booking._id];
          const isBillGenerated = pdfGenerated[booking._id];

          return (
            <TouchableOpacity
              key={booking._id}
              onPress={() => toggleCard(booking._id)}
              activeOpacity={0.9}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {booking.guest?.name} ({booking.room?.number})
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </View>

              {isExpanded && (
                <>
                  <Text style={styles.detail}>Phone: {booking.guest?.phone}</Text>
                  <Text style={styles.detail}>Check-In: {new Date(booking.checkIn).toDateString()}</Text>
                  <Text style={styles.detail}>Check-Out: {new Date(booking.checkOut).toDateString()}</Text>
                  <Text style={styles.detail}>Nights: {nights}</Text>
                  <Text style={styles.detail}>Room Price: ₹{booking.room?.price}</Text>

                  <Text style={styles.label}>Discount (₹):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={discounts[booking._id] || ""}
                    onChangeText={(value) => handleDiscountChange(booking._id, value)}
                  />

                  <Text style={styles.total}>Total: ₹{total.toFixed(0)}</Text>
                  <Text style={styles.final}>
                    Final Bill: ₹{finalAmount.toFixed(0)}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      isBillGenerated && styles.disabled,
                    ]}
                    onPress={() => handleExtendStay(booking._id)}
                    disabled={isBillGenerated}
                  >
                    <Text style={styles.buttonText}>
                      {isBillGenerated ? "Bill Generated" : "Extend Stay"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.printButton}
                    onPress={() => generatePDF(booking)}
                  >
                    <Text style={styles.buttonText}>Generate Bill</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          );
        })
      )}

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={new Date()}
          value={newDate}
          onChange={onDateSelected}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    backgroundColor: "#fff",
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  detail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
  },
  total: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  final: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  disabled: {
    backgroundColor: "#999",
  },
  printButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
