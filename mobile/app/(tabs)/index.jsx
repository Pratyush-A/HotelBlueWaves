import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import COLORS from "../../constants/colors";

const BASE_URL = "http://192.168.1.4:5000";

export default function Home() {
  const { token } = useAuthStore();

  const [bookings, setBookings] = useState([]);
  const [roomStats, setRoomStats] = useState({ total: 0, available: 0, occupied: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const formatDate = (date) => date.toISOString().split("T")[0];

  const fetchBookings = async (pageNum = 1, refresh = false, checkIn = null) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      let url = `${BASE_URL}/api/bookings?page=${pageNum}&limit=5`;
      if (checkIn) url += `&checkIn=${checkIn}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch bookings");

      const newList = data.bookings || [];

      if (refresh) {
        setBookings(newList);
      } else {
        const filtered = newList.filter(
          (newBooking) => !bookings.some((b) => b._id === newBooking._id)
        );
        setBookings((prev) => [...prev, ...filtered]);
      }

      setHasMore(pageNum < data.totalPages);
      setPage(pageNum + 1);
    } catch (error) {
      console.log("Error fetching bookings", error);
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const fetchRoomStats = async (date = null) => {
    try {
      let url = `${BASE_URL}/api/rooms/stats`;
      if (date) url += `?date=${formatDate(date)}`;

      const res = await fetch(url);
      const data = await res.json();
      setRoomStats(data);
    } catch (err) {
      console.log("Failed to fetch room stats", err.message);
    }
  };

  useEffect(() => {
    fetchBookings(1);
    fetchRoomStats();

    const interval = setInterval(() => {
      fetchRoomStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    fetchBookings(1, true, selectedDate ? formatDate(selectedDate) : null);
    fetchRoomStats();
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) fetchBookings(page);
  };

  const onChangeDate = (event, date) => {
    setShowPicker(false);
    if (date) {
      const corrected = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      setSelectedDate(corrected);
      fetchBookings(1, true, formatDate(corrected));
      fetchRoomStats(corrected);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    fetchBookings(1, true);
    fetchRoomStats();
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookHeader}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle-outline" size={36} color={COLORS.primary} />
          <Text style={styles.username}>{item.guestName}</Text>
        </View>
      </View>

      <View style={styles.bookImageContainer}>
        <Image
          source={require("../../assets/images/i2.png")}
          style={styles.bookImage}
          resizeMode="cover"
        />
      </View>

      <Text style={styles.bookTitle}>Room: {item.roomNumber}</Text>
      <Text style={styles.bookCaption}>
        From: {item.checkInDate} → {item.checkOutDate}
      </Text>
      <Text style={styles.statusText}>Status: {item.status}</Text>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{roomStats.total}</Text>
        <Text style={styles.statLabel}>Total Rooms</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{roomStats.available}</Text>
        <Text style={styles.statLabel}>Available</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{roomStats.occupied}</Text>
        <Text style={styles.statLabel}>Occupied</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              <View style={{ marginTop: 24, marginBottom: 20, alignItems: "center" }}>
                <Text style={{ fontSize: 26, fontWeight: "bold", color: COLORS.primary }}>
                  Hotel Blue Waves 🏨
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
                  View current and upcoming bookings
                </Text>
              </View>

              {renderStats()}

              <View style={styles.dateFilter}>
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateButtonText}>
                    {selectedDate ? formatDate(selectedDate) : "📅 Filter by Date"}
                  </Text>
                </TouchableOpacity>

                {selectedDate && (
                  <TouchableOpacity
                    onPress={clearDateFilter}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>Clear ❌</Text>
                  </TouchableOpacity>
                )}
              </View>

              {showPicker && (
                <DateTimePicker
                  mode="date"
                  value={selectedDate || new Date()}
                  onChange={onChangeDate}
                  minimumDate={new Date()}
                />
              )}
            </View>
          }
          ListFooterComponent={
            hasMore && !refreshing ? (
              <ActivityIndicator size="small" color="#888" />
            ) : null
          }
          ListEmptyComponent={null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingTop: 10,
  },
  bookCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "bold",
  },
  bookImageContainer: {
    marginVertical: 8,
    alignItems: "center",
  },
  bookImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  bookCaption: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    elevation: 3,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  dateFilter: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  dateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  clearButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#333",
  },
});
