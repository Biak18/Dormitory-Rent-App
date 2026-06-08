import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  deactivateRental,
  fetchAllRentals,
  updatePaymentStatus,
} from "../../lib/api";
import { Rental, Tenant } from "../../types";
type HistoryEntry = { rental: Rental; tenants: Tenant[] };

function formatPrice(n: number) {
  return n.toLocaleString();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function HistoryCard({
  entry,
  onTogglePaid,
  onMoveOut,
}: {
  entry: HistoryEntry;
  onTogglePaid: (id: string, paid: boolean) => void;
  onMoveOut: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { rental, tenants } = entry;
  const isActive = (rental as any).is_active !== false;

  return (
    <View style={[styles.card, !isActive && styles.cardInactive]}>
      {/* Room Badge + Status */}
      <View style={styles.cardHeader}>
        <View style={[styles.roomBadge, !isActive && styles.roomBadgeInactive]}>
          <Text style={styles.roomBadgeText}>{rental.room_id}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View
            style={[
              styles.statusPill,
              rental.is_paid ? styles.paidPill : styles.unpaidPill,
            ]}
          >
            <Ionicons
              name={rental.is_paid ? "checkmark-circle" : "time-outline"}
              size={11}
              color={rental.is_paid ? "#fff" : "#fff"}
            />
            <Text style={styles.statusPillText}>
              {rental.is_paid ? t("paid") : t("unpaid")}
            </Text>
          </View>
          {!isActive && (
            <View style={styles.movedOutPill}>
              <Text style={styles.movedOutText}>{t("moveOut")}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Price & Duration */}
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.priceLabel}>{t("monthly")}</Text>
          <Text style={styles.priceValue}>
            {formatPrice(rental.monthly_price)} {t("currency")}
          </Text>
        </View>
        <View style={styles.dividerV} />
        <View>
          <Text style={styles.priceLabel}>{t("duration2")}</Text>
          <Text style={styles.priceValue}>
            {rental.total_months} {i18n.language === "en" ? "mo" : "လ"}
          </Text>
        </View>
        <View style={styles.dividerV} />
        <View>
          <Text style={styles.priceLabel}>{t("total")}</Text>
          <Text style={[styles.priceValue, styles.totalPrice]}>
            {formatPrice(rental.total_price)} {t("currency")}
          </Text>
        </View>
      </View>

      {/* Date Range */}
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={13} color="#888" />
        <Text style={styles.dateText}>
          {formatDate(rental.start_date)} → {formatDate(rental.end_date)}
        </Text>
      </View>

      {/* Tenants */}
      <View style={styles.tenantsSection}>
        <View style={styles.tenantsSectionHeader}>
          <Ionicons name="people-outline" size={13} color="#C8A96E" />
          <Text style={styles.tenantsSectionLabel}>
            {tenants.length} {tenants.length !== 1 ? t("tenants") : t("tenant")}
          </Text>
        </View>
        {tenants.map((tn) => (
          <View key={tn.id} style={styles.tenantRow}>
            <View
              style={[
                styles.genderDot,
                tn.gender === "Male" ? styles.maleDot : styles.femaleDot,
              ]}
            />
            <Text style={styles.tenantName}>{tn.name}</Text>
            <Text style={styles.tenantGender}>
              {t(`gender.${tn.gender.toLowerCase()}`)}
            </Text>
            {tn.phone ? (
              <Text style={styles.tenantPhone}>{tn.phone}</Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Actions */}
      {isActive && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              rental.is_paid ? styles.unpayBtn : styles.payBtn,
            ]}
            onPress={() => onTogglePaid(rental.id, !rental.is_paid)}
          >
            <Ionicons
              name={
                rental.is_paid
                  ? "close-circle-outline"
                  : "checkmark-circle-outline"
              }
              size={15}
              color="#fff"
            />
            <Text style={styles.actionBtnText}>
              {rental.is_paid ? t("markUnpaid") : t("markPaid")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moveOutBtn}
            onPress={() => onMoveOut(rental.id)}
          >
            <Ionicons name="exit-outline" size={15} color="#E57373" />
            <Text style={styles.moveOutBtnText}>{t("moveOut")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");

  const loadData = async () => {
    try {
      const data = await fetchAllRentals();
      setEntries(data);
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

  const handleTogglePaid = async (id: string, paid: boolean) => {
    await updatePaymentStatus(id, paid);
    loadData();
  };

  const handleMoveOut = async (id: string) => {
    await deactivateRental(id);
    loadData();
  };

  const filtered = entries.filter((e) => {
    const active = (e.rental as any).is_active !== false;
    if (filter === "active") return active;
    if (filter === "inactive") return !active;
    return true;
  });

  // Summary stats
  const totalRevenue = entries
    .filter((e) => (e.rental as any).is_active !== false)
    .reduce((acc, e) => acc + e.rental.total_price, 0);
  const paidCount = entries.filter(
    (e) => e.rental.is_paid && (e.rental as any).is_active !== false,
  ).length;
  const unpaidCount = entries.filter(
    (e) => !e.rental.is_paid && (e.rental as any).is_active !== false,
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("history")}</Text>
        <Text style={styles.headerSubtitle}>{t("rentalRecords")}</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatPrice(totalRevenue)}</Text>
          <Text style={styles.summaryLabel}>{t("activeRevenue")}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: "#66BB6A" }]}>
            {paidCount} {t("paid")}
          </Text>
          <Text
            style={[styles.summaryValue, { color: "#E57373", fontSize: 16 }]}
          >
            {unpaidCount} {t("unpaid")}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["active", "inactive", "all"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f && styles.filterTabTextActive,
              ]}
            >
              {/* {f.charAt(0).toUpperCase() + f.slice(1)} */}
              {t(f.toString())}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#C8A96E" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>{t("noRecords")}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.rental.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#C8A96E"
            />
          }
          renderItem={({ item }) => (
            <HistoryCard
              entry={item}
              onTogglePaid={handleTogglePaid}
              onMoveOut={handleMoveOut}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F0E8" },
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
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  summaryCard: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 18, fontWeight: "800", color: "#C8A96E" },
  summaryLabel: {
    fontSize: 10,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  summaryDivider: { width: 1, height: 40, backgroundColor: "#333" },
  filterRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#ECDEC0",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  filterTabActive: { backgroundColor: "#1A1A1A" },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
  },
  filterTabTextActive: { color: "#C8A96E" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: { color: "#AAA", fontSize: 14 },
  list: { padding: 12, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  cardInactive: { opacity: 0.65 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomBadge: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomBadgeInactive: { backgroundColor: "#999" },
  roomBadgeText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1,
  },
  cardHeaderRight: { flexDirection: "row", gap: 6, alignItems: "center" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  paidPill: { backgroundColor: "#66BB6A" },
  unpaidPill: { backgroundColor: "#E57373" },
  statusPillText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  movedOutPill: {
    backgroundColor: "#9E9E9E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  movedOutText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  priceRow: {
    flexDirection: "row",
    backgroundColor: "#F9F5EE",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-around",
  },
  priceLabel: {
    fontSize: 10,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginTop: 2,
  },
  totalPrice: { color: "#C8A96E" },
  dividerV: { width: 1, height: 32, backgroundColor: "#E0E0E0" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 12, color: "#666" },
  tenantsSection: { gap: 6 },
  tenantsSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  tenantsSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C8A96E",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  genderDot: { width: 8, height: 8, borderRadius: 4 },
  maleDot: { backgroundColor: "#42A5F5" },
  femaleDot: { backgroundColor: "#EC407A" },
  tenantName: { flex: 1, fontSize: 13, fontWeight: "600", color: "#1A1A1A" },
  tenantGender: { fontSize: 11, color: "#888" },
  tenantPhone: { fontSize: 11, color: "#888" },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  payBtn: { backgroundColor: "#66BB6A" },
  unpayBtn: { backgroundColor: "#FF8A65" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  moveOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E57373",
  },
  moveOutBtnText: { color: "#E57373", fontWeight: "700", fontSize: 12 },
});
