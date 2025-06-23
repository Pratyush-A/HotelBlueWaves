import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constants/colors";
import styles from "../../assets/styles/create.styles";
import { useAuthStore } from "../../store/authStore";

const BASE_URL = "http://192.168.1.4:5000";

export default function Bookings() {
  const { token } = useAuthStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idProof, setIdProof] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date());
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (checkIn && checkOut && checkIn < checkOut) {
      fetchAvailableRooms();
    } else {
      setRooms([]);
    }
  }, [checkIn, checkOut]);

  const fetchAvailableRooms = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/rooms/available?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}`
      );
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Fetch error:", err);
      Alert.alert("Error", "Unable to fetch available rooms.");
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Gallery access is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const img = result.assets[0];
      setIdProof(`data:image/jpeg;base64,${img.base64}`);
    }
  };

  const handleBooking = async () => {
    if (!name || !phone || !idProof || !selectedRoom || !checkIn || !checkOut) {
      return Alert.alert("Missing Fields", "Please fill out all fields.");
    }

    if (checkOut <= checkIn) {
      return Alert.alert("Invalid Dates", "Check-out must be after check-in.");
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const rawAmount = selectedRoom.price * nights;
    const discountValue = parseInt(discount) || 0;
    const finalAmount = rawAmount - discountValue;

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guestName: name,
          phone,
          idProof,
          roomNumber: selectedRoom.number,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          amount: finalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Booking failed");
      }

      Alert.alert("Success", "Booking created!");
      resetForm();
    } catch (err) {
      console.error("Booking Error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setIdProof(null);
    setSelectedRoom(null);
    setCheckIn(new Date());
    setCheckOut(new Date());
    setRooms([]);
    setDiscount("0");
  };

  const nights = checkOut > checkIn
    ? Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    : 0;

  const basePrice = selectedRoom ? selectedRoom.price * nights : 0;
  const discountValue = parseInt(discount) || 0;
  const finalPrice = Math.max(basePrice - discountValue, 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Booking</Text>

      <Text style={styles.label}>Guest Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter guest name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Upload ID Proof</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {idProof ? (
          <Image source={{ uri: idProof }} style={styles.previewImage} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Check-In Date</Text>
      <TouchableOpacity onPress={() => setShowCheckInPicker(true)} style={styles.dateButton}>
        <Text style={styles.dateText}>{checkIn.toDateString()}</Text>
      </TouchableOpacity>
      {showCheckInPicker && (
        <DateTimePicker
          value={checkIn}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowCheckInPicker(false);
            if (date) setCheckIn(date);
          }}
        />
      )}

      <Text style={styles.label}>Check-Out Date</Text>
      <TouchableOpacity onPress={() => setShowCheckOutPicker(true)} style={styles.dateButton}>
        <Text style={styles.dateText}>{checkOut.toDateString()}</Text>
      </TouchableOpacity>
      {showCheckOutPicker && (
        <DateTimePicker
          value={checkOut}
          mode="date"
          display="default"
          minimumDate={checkIn}
          onChange={(event, date) => {
            setShowCheckOutPicker(false);
            if (date) setCheckOut(date);
          }}
        />
      )}

      <Text style={styles.label}>Available Rooms</Text>
      {rooms.length > 0 ? (
        rooms.map((room) => (
          <TouchableOpacity
            key={room._id}
            style={{
              backgroundColor: selectedRoom?.number === room.number ? COLORS.primary : "#eee",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
            }}
            onPress={() => setSelectedRoom(room)}
          >
            <Text style={{ color: selectedRoom?.number === room.number ? "#fff" : "#000" }}>
              Room {room.number} ({room.type}) - ₹{room.price}/night
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ color: COLORS.textSecondary, marginBottom: 10 }}>
          No rooms available for the selected dates.
        </Text>
      )}

      {selectedRoom && nights > 0 && (
        <View
          style={{
            backgroundColor: "#f8fafc",
            padding: 14,
            borderRadius: 8,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#e2e8f0",
          }}
        >
          <Text style={{ fontWeight: "600", color: "#1e293b" }}>Amount Summary</Text>
          <Text style={{ marginTop: 4 }}>
            ₹{selectedRoom.price} × {nights} night(s) = ₹{basePrice}
          </Text>

          <TextInput
            style={{
              marginTop: 8,
              padding: 10,
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: "#fff",
            }}
            keyboardType="numeric"
            value={discount}
            onChangeText={setDiscount}
            placeholder="Enter discount ₹"
          />

          <Text
            style={{
              marginTop: 6,
              fontSize: 16,
              fontWeight: "bold",
              color: COLORS.primary,
            }}
          >
            Total Payable: ₹{finalPrice}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Book Now</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
