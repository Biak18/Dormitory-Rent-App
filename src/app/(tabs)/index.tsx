import { Ionicons } from "@expo/vector-icons";

import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import RentalForm from "../../components/RentalForm";
import RoomCard from "../../components/RoomCard";
import { fetchActiveRentals } from "../../lib/api";
import { changeLanguage } from "../../lib/i18n";
import { ROOMS, Rental, Room, Tenant } from "../../types";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>(ROOMS);
  const [activeRentals, setActiveRentals] = useState<
    { rental: Rental; tenants: Tenant[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchActiveRentals();
      setActiveRentals(data);

      // Merge rental status into rooms
      const updatedRooms = ROOMS.map((room) => {
        const match = data.find((d) => d.rental.room_id === room.id);
        return match
          ? { ...room, is_rented: true, current_rental: match.rental }
          : { ...room, is_rented: false, current_rental: undefined };
      });
      setRooms(updatedRooms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalRooms = rooms.length;
  const rentedCount = rooms.filter((r) => r.is_rented).length;
  const availableCount = totalRooms - rentedCount;
  const totalPersons = activeRentals.reduce(
    (acc, d) => acc + (d.rental.person_count || 0),
    0,
  );

  const handleCardPress = (room: Room) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const handleFormClose = () => {
    setModalVisible(false);
    setSelectedRoom(null);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A96E" />
        <Text style={styles.loadingText}>Loading rooms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t("appName")}</Text>
          <Text style={styles.headerSubtitle}>{t("appSubtitle")}</Text>
        </View>

        {/* Language Toggle */}
        <View style={styles.langToggle}>
          <TouchableOpacity
            style={[
              styles.langBtn,
              i18n.language === "en" && styles.langBtnActive,
            ]}
            onPress={() => changeLanguage("en")}
          >
            <Text
              style={[
                styles.langBtnText,
                i18n.language === "en" && styles.langBtnTextActive,
              ]}
            >
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.langBtn,
              i18n.language === "my" && styles.langBtnActive,
            ]}
            onPress={() => changeLanguage("my")}
          >
            <Text
              style={[
                styles.langBtnText,
                i18n.language === "my" && styles.langBtnTextActive,
              ]}
            >
              မြန်မာ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statTotal]}>
          <Ionicons name="business-outline" size={20} color="#C8A96E" />
          <Text style={styles.statNumber}>{totalRooms}</Text>
          <Text style={styles.statLabel}>{t("totalRooms")}</Text>
        </View>
        <View style={[styles.statCard, styles.statRented]}>
          <Ionicons name="lock-closed-outline" size={20} color="#E57373" />
          <Text style={[styles.statNumber, { color: "#E57373" }]}>
            {rentedCount}
          </Text>
          <Text style={styles.statLabel}>{t("rented")}</Text>
        </View>
        <View style={[styles.statCard, styles.statAvailable]}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#66BB6A" />
          <Text style={[styles.statNumber, { color: "#66BB6A" }]}>
            {availableCount}
          </Text>
          <Text style={styles.statLabel}>{t("available")}</Text>
        </View>
        <View style={[styles.statCard, styles.statPersons]}>
          <Ionicons name="people-outline" size={20} color="#42A5F5" />
          <Text style={[styles.statNumber, { color: "#42A5F5" }]}>
            {totalPersons}
          </Text>
          <Text style={styles.statLabel}>{t("persons")}</Text>
        </View>
      </View>

      {/* Section Labels */}
      <View style={styles.sectionRow}>
        <View style={[styles.sectionDot, { backgroundColor: "#2D2D2D" }]} />
        <Text style={styles.sectionLabel}>{t("blockA")}</Text>
        <View style={styles.sectionLine} />
        <View style={[styles.sectionDot, { backgroundColor: "#C8A96E" }]} />
        <Text style={styles.sectionLabel}>{t("blockB")}</Text>
      </View>

      {/* Room Grid */}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C8A96E"
          />
        }
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            rental={activeRentals.find((d) => d.rental.room_id === item.id)}
            onPress={() => handleCardPress(item)}
          />
        )}
      />

      {/* Rental Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleFormClose}
      >
        {selectedRoom && (
          <RentalForm
            room={selectedRoom}
            existingRental={activeRentals.find(
              (d) => d.rental.room_id === selectedRoom.id,
            )}
            onClose={handleFormClose}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F0E8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    gap: 12,
  },
  loadingText: {
    fontFamily: "System",
    color: "#888",
    fontSize: 14,
  },
  header: {
    backgroundColor: "#1A1A1A",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#C8A96E",
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#888",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#1A1A1A",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statTotal: { borderTopColor: "#C8A96E", borderTopWidth: 2 },
  statRented: { borderTopColor: "#E57373", borderTopWidth: 2 },
  statAvailable: { borderTopColor: "#66BB6A", borderTopWidth: 2 },
  statPersons: { borderTopColor: "#42A5F5", borderTopWidth: 2 },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#C8A96E",
  },
  statLabel: {
    fontSize: 9,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DDD",
    marginHorizontal: 4,
  },
  row: {
    paddingHorizontal: 12,
    gap: 10,
  },
  grid: {
    paddingBottom: 24,
    gap: 10,
  },
  langToggle: {
    marginLeft: "auto",
    flexDirection: "row",
    backgroundColor: "#2A2A2A",
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
  },
  langBtnActive: {
    backgroundColor: "#C8A96E",
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  langBtnTextActive: {
    color: "#1A1A1A",
  },
});
