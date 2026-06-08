import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTranslation } from "react-i18next";
import { Rental, Room, Tenant } from "../types";

interface Props {
  room: Room;
  rental?: { rental: Rental; tenants: Tenant[] };
  onPress: () => void;
}

function formatPrice(n: number) {
  return (n / 1000).toFixed(0) + "K";
}

export default function RoomCard({ room, rental, onPress }: Props) {
  const { t } = useTranslation();
  const isRented = room.is_rented;
  const isBlockA = room.id.startsWith("A");

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isRented ? styles.cardRented : styles.cardAvailable,
        isBlockA ? styles.blockA : styles.blockB,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Room ID */}
      <Text style={[styles.roomId, isRented && styles.roomIdRented]}>
        {room.id}
      </Text>

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          isRented ? styles.badgeRented : styles.badgeAvailable,
        ]}
      >
        <Ionicons
          name={isRented ? "lock-closed" : "checkmark-circle"}
          size={10}
          color="#fff"
        />
        <Text style={styles.statusText}>
          {isRented ? t("rented") : t("available")}
        </Text>
      </View>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={[styles.price, isRented && styles.priceRented]}>
          {formatPrice(room.base_price)}
        </Text>
        <Text style={styles.priceSub}>/mo</Text>
      </View>

      {/* If rented: show person count */}
      {isRented && rental ? (
        <View style={styles.tenantInfo}>
          <Ionicons name="people" size={12} color="#C8A96E" />
          <Text style={styles.tenantCount}>
            {rental.rental.person_count} {t("countOfPerson")}
          </Text>
        </View>
      ) : (
        <View style={styles.tenantInfo}>
          <Ionicons name="person-add-outline" size={12} color="#999" />
          <Text style={styles.availableHint}>{t("tapToRent")}</Text>
        </View>
      )}

      {/* Corner accent */}
      <View
        style={[
          styles.cornerAccent,
          isRented ? styles.cornerRented : styles.cornerAvailable,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 140,
    position: "relative",
    overflow: "hidden",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardAvailable: {
    backgroundColor: "#fff",
  },
  cardRented: {
    backgroundColor: "#2A2A2A",
  },
  blockA: {
    borderLeftWidth: 3,
    borderLeftColor: "#1A1A1A",
  },
  blockB: {
    borderLeftWidth: 3,
    borderLeftColor: "#C8A96E",
  },
  roomId: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: 1,
  },
  roomIdRented: {
    color: "#C8A96E",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeAvailable: { backgroundColor: "#66BB6A" },
  badgeRented: { backgroundColor: "#E57373" },
  statusText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  priceRented: { color: "#fff" },
  priceSub: {
    fontSize: 10,
    color: "#999",
    fontWeight: "500",
  },
  tenantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  tenantCount: {
    fontSize: 11,
    color: "#C8A96E",
    fontWeight: "600",
  },
  availableHint: {
    fontSize: 11,
    color: "#BBB",
  },
  cornerAccent: {
    position: "absolute",
    bottom: -10,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.08,
  },
  cornerAvailable: { backgroundColor: "#1A1A1A" },
  cornerRented: { backgroundColor: "#C8A96E" },
});
