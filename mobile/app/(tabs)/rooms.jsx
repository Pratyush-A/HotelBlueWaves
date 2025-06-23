import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import COLORS from "../../constants/colors";

const BASE_URL = "http://192.168.1.4:5000";

export default function RoomsScreen() {
  const { token } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [number, setNumber] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");

  const [editingRoomId, setEditingRoomId] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed loading rooms");
      setRooms(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAdd = async () => {
    if (!number || !type || !price) {
      return Alert.alert("Error", "Please fill all fields");
    }
    try {
      const res = await fetch(`${BASE_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ number, type, price: +price, status: "available" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Alert.alert("Success", "Room added!");
      setNumber(""); setType(""); setPrice("");
      fetchRooms();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Confirm", "Delete this room?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/rooms/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchRooms();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        }
      }
    ]);
  };

  const handlePriceEdit = (room) => {
    setEditingRoomId(room._id);
    setNewPrice(room.price.toString());
  };

  const handleSavePrice = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/rooms/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ price: +newPrice }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEditingRoomId(null);
      setNewPrice("");
      fetchRooms();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Manage Rooms</Text>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Number" style={styles.input}
          value={number} onChangeText={setNumber}
        />
        <TextInput
          placeholder="Type" style={styles.input}
          value={type} onChangeText={setType}
        />
        <TextInput
          placeholder="Price" style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.roomRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.roomTxt}>{item.number}</Text>
                <Text style={styles.subTxt}>{item.type}</Text>

                {editingRoomId === item._id ? (
                  <>
                    <TextInput
                      style={styles.editInput}
                      value={newPrice}
                      onChangeText={setNewPrice}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={() => handleSavePrice(item._id)}>
                      <Text style={{ color: COLORS.primary, marginTop: 4 }}>💾 Save</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.subTxt}>₹{item.price}</Text>
                )}
              </View>

              <View style={{ alignItems: "flex-end" }}>
                {editingRoomId !== item._id && (
                  <TouchableOpacity onPress={() => handlePriceEdit(item)}>
                    <Text style={styles.editTxt}>✏️</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                  <Text style={styles.delTxt}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: COLORS.primary },
  inputRow: { flexDirection: "row", marginBottom: 10, alignItems: "center" },
  input: {
    flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 8,
    marginRight: 6, borderRadius: 6
  },
  addBtn: {
    backgroundColor: COLORS.primary, padding: 12,
    borderRadius: 6
  },
  addText: { color: "#fff", fontWeight: "bold" },
  roomRow: {
    flexDirection: "row", justifyContent: "space-between",
    padding: 12, borderBottomWidth: 1, borderColor: "#eee"
  },
  roomTxt: { fontSize: 16, fontWeight: "500" },
  subTxt: { fontSize: 14, color: "#555" },
  delTxt: { fontSize: 18, color: "#d00", marginTop: 6 },
  editTxt: { fontSize: 18, color: COLORS.primary },
  editInput: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 6,
    borderRadius: 5,
    marginTop: 4,
    width: 100,
  }
});
