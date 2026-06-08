import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { deactivateRental, saveRental, uploadTenantPhoto } from "../lib/api";
import { Gender, Rental, Room, Tenant } from "../types";
import { ZoomableImage } from "./ZoomableImage";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Props {
  room: Room;
  existingRental?: { rental: Rental; tenants: Tenant[] };
  onClose: () => void;
}

interface TenantForm {
  name: string;
  gender: Gender;
  phone: string;
  localImageUri?: string;
  image_url?: string;
}

function calculateMonths(start: Date, end: Date): number {
  // const ms = end.getTime() - start.getTime();
  // const months = ms / (1000 * 60 * 60 * 24 * 30.44);
  // return Math.max(0, parseFloat(months.toFixed(2)));

  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(n: number) {
  return n.toLocaleString();
}

export default function RentalForm({ room, existingRental, onClose }: Props) {
  const { t } = useTranslation();
  const isViewing = !!existingRental;

  const [personCount, setPersonCount] = useState<2 | 3>(
    existingRental ? (existingRental.rental.person_count as 2 | 3) : 2,
  );
  const now = new Date();
  const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState<Date>(
    existingRental ? new Date(existingRental.rental.start_date) : new Date(),
  );
  const [endDate, setEndDate] = useState<Date>(
    existingRental
      ? new Date(existingRental.rental.end_date)
      : new Date(new Date().setMonth(new Date().getMonth() + 1)),
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isPaid, setIsPaid] = useState(existingRental?.rental.is_paid ?? false);

  const [tenants, setTenants] = useState<TenantForm[]>(() => {
    if (existingRental) {
      return existingRental.tenants.map((t) => ({
        name: t.name,
        gender: t.gender as Gender,
        phone: t.phone || "",
        image_url: t.image_url,
      }));
    }
    return [
      { name: "", gender: "Male", phone: "" },
      { name: "", gender: "Male", phone: "" },
    ];
  });

  const [saving, setSaving] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const monthlyPrice = personCount === 3 ? room.price_3person : room.base_price;
  const totalMonths = calculateMonths(startDate, endDate);
  const totalPrice = Math.round(monthlyPrice * totalMonths);

  // Sync tenant count with personCount
  useEffect(() => {
    if (isViewing) return;
    setTenants((prev) => {
      if (personCount === 3 && prev.length === 2) {
        return [...prev, { name: "", gender: "Male", phone: "" }];
      } else if (personCount === 2 && prev.length === 3) {
        return prev.slice(0, 2);
      }
      return prev;
    });
  }, [personCount]);

  const updateTenant = (
    index: number,
    field: keyof TenantForm,
    value: string,
  ) => {
    setTenants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const pickImage = async (index: number) => {
    if (isViewing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permissionNeeded"), t("permissionMsg"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      updateTenant(index, "localImageUri", result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // Validation
    for (let i = 0; i < tenants.length; i++) {
      if (!tenants[i].name.trim()) {
        Alert.alert(t("missingInfo"), t("missingName", { num: i + 1 }));
        return;
      }
    }
    if (endDate <= startDate) {
      Alert.alert("Invalid Dates", t("invalidDates"));
      return;
    }

    setSaving(true);
    try {
      // Upload images
      const processedTenants = await Promise.all(
        tenants.map(async (t, i) => {
          let image_url = t.image_url;
          if (t.localImageUri) {
            const fileName = `${room.id}_${Date.now()}_${i}.jpg`;
            image_url = await uploadTenantPhoto(t.localImageUri, fileName);
          }
          return {
            name: t.name.trim(),
            gender: t.gender,
            phone: t.phone.trim(),
            image_url,
          };
        }),
      );

      await saveRental(
        {
          room_id: room.id,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          person_count: personCount,
          monthly_price: monthlyPrice,
          total_months: totalMonths,
          total_price: totalPrice,
          is_paid: isPaid,
          tenants: [],
          is_active: true,
        } as any,
        processedTenants,
      );

      Alert.alert(t("success"), t("rentalSaved", { room: room.id }), [
        { text: t("OK"), onPress: onClose },
      ]);
    } catch (e: any) {
      Alert.alert(t("error"), e.message || "Failed to save rental");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveOut = () => {
    Alert.alert(t("moveOut"), t("moveOutConfirm", { room: room.id }), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("moveOut"),
        style: "destructive",
        onPress: async () => {
          await deactivateRental(existingRental!.rental.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#888" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Room {room.id}</Text>
            <Text style={styles.headerSub}>
              {isViewing ? t("rentalDetails") : t("newRental")}
            </Text>
          </View>
          {isViewing && (
            <TouchableOpacity
              onPress={handleMoveOut}
              style={styles.moveOutHeaderBtn}
            >
              <Ionicons name="exit-outline" size={16} color="#E57373" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <View style={styles.priceBadgeLeft}>
              <Text style={styles.priceBadgeLabel}>{t("monthlyPrice")}</Text>
              <Text style={styles.priceBadgeValue}>
                {formatPrice(monthlyPrice)}
              </Text>
              <Text style={styles.priceBadgeSub}>
                {t("forPersons", { count: personCount })}
              </Text>
            </View>
            <View style={styles.priceBadgeDivider} />
            <View style={styles.priceBadgeRight}>
              <Text style={styles.priceBadgeLabel}>
                {t("total")} ({totalMonths} mo)
              </Text>
              <Text style={styles.priceBadgeTotal}>
                {formatPrice(totalPrice)}
              </Text>
            </View>
          </View>

          {/* Person Count */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("numberOfPersons")}</Text>
            <View style={styles.personCountRow}>
              {([2, 3] as const).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.countBtn,
                    personCount === n && styles.countBtnActive,
                  ]}
                  onPress={() => !isViewing && setPersonCount(n)}
                  disabled={isViewing}
                >
                  <Ionicons
                    name="person"
                    size={16}
                    color={personCount === n ? "#fff" : "#888"}
                  />
                  {n === 3 && (
                    <Ionicons
                      name="person"
                      size={16}
                      color={personCount === n ? "#fff" : "#888"}
                    />
                  )}
                  {n === 3 && (
                    <Ionicons
                      name="person"
                      size={16}
                      color={personCount === n ? "#fff" : "#888"}
                    />
                  )}
                  <Text
                    style={[
                      styles.countBtnText,
                      personCount === n && styles.countBtnTextActive,
                    ]}
                  >
                    {n} {t("countOfPerson")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tenants */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("tenants")}</Text>
            {tenants.map((tenant, i) => (
              <View key={i} style={styles.tenantCard}>
                <View style={styles.tenantCardHeader}>
                  <Text style={styles.tenantCardTitle}>
                    {t("tenant")} {i + 1}
                  </Text>
                  <View style={styles.genderToggle}>
                    {(["Male", "Female"] as Gender[]).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderBtn,
                          tenant.gender === g &&
                            (g === "Male"
                              ? styles.genderBtnMale
                              : styles.genderBtnFemale),
                        ]}
                        onPress={() =>
                          !isViewing && updateTenant(i, "gender", g)
                        }
                        disabled={isViewing}
                      >
                        <Text
                          style={[
                            styles.genderBtnText,
                            tenant.gender === g && styles.genderBtnTextActive,
                          ]}
                        >
                          {t(`gender.${g.toLowerCase()}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder={t("fullName")}
                  placeholderTextColor="#BBB"
                  value={tenant.name}
                  onChangeText={(v) => updateTenant(i, "name", v)}
                  editable={!isViewing}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("phoneNumber")}
                  placeholderTextColor="#BBB"
                  value={tenant.phone}
                  onChangeText={(v) => updateTenant(i, "phone", v)}
                  keyboardType="phone-pad"
                  editable={!isViewing}
                />

                {/* Photo */}
                {(() => {
                  const imgUri = tenant.localImageUri || tenant.image_url;
                  return (
                    <View style={styles.photoWrapper}>
                      {imgUri ? (
                        <>
                          <TouchableOpacity
                            style={styles.photoBox}
                            onPress={() => setLightboxUri(imgUri)}
                            activeOpacity={0.85}
                          >
                            <Image
                              source={{ uri: imgUri }}
                              style={styles.photoPreview}
                            />
                            <View style={styles.photoViewHint}>
                              <Ionicons
                                name="expand-outline"
                                size={13}
                                color="#fff"
                              />
                              <Text style={styles.photoViewHintText}>
                                {t("tapToView")}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {!isViewing && (
                            <TouchableOpacity
                              style={styles.photoDeleteBtn}
                              onPress={() =>
                                Alert.alert(
                                  t("removePhoto"),
                                  t("removePhotoConfirm"),
                                  [
                                    { text: t("cancel"), style: "cancel" },
                                    {
                                      text: t("remove"),
                                      style: "destructive",
                                      onPress: () => {
                                        setTenants((prev) => {
                                          const updated = [...prev];
                                          updated[i] = {
                                            ...updated[i],
                                            localImageUri: undefined,
                                            image_url: undefined,
                                          };
                                          return updated;
                                        });
                                      },
                                    },
                                  ],
                                )
                              }
                            >
                              <Ionicons
                                name="trash-outline"
                                size={14}
                                color="#E57373"
                              />
                              <Text style={styles.photoDeleteText}>
                                {t("removePhoto")}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      ) : (
                        <TouchableOpacity
                          style={styles.photoBox}
                          onPress={() => pickImage(i)}
                          disabled={isViewing}
                        >
                          <View style={styles.photoPlaceholder}>
                            <Ionicons
                              name="camera-outline"
                              size={28}
                              color="#CCC"
                            />
                            <Text style={styles.photoPlaceholderText}>
                              {t("addPhoto")}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()}
              </View>
            ))}
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("startDate")}</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => !isViewing && setShowStartPicker(true)}
              disabled={isViewing}
            >
              <Ionicons name="calendar-outline" size={18} color="#C8A96E" />
              <Text style={styles.dateBtnText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                mode="date"
                display="inline"
                value={startDate}
                onValueChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}
          </View>

          {/* End Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("endDate")}</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => !isViewing && setShowEndPicker(true)}
              disabled={isViewing}
            >
              <Ionicons name="calendar-outline" size={18} color="#C8A96E" />
              <Text style={styles.dateBtnText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="inline"
                minimumDate={startDate}
                onValueChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>

          {/* Duration Summary */}
          <View style={styles.durationBox}>
            <Ionicons name="time-outline" size={16} color="#C8A96E" />
            <Text style={styles.durationText}>
              {/* {totalMonths} months ({formatPrice(totalPrice)} total) */}
              {t("duration", {
                months: totalMonths,
                price: formatPrice(totalPrice),
              })}
            </Text>
          </View>

          {/* Payment Status */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("paymentStatus")}</Text>
            <View style={styles.paymentToggle}>
              <TouchableOpacity
                style={[styles.paymentBtn, isPaid && styles.paymentBtnPaid]}
                onPress={() => !isViewing && setIsPaid(true)}
                disabled={isViewing}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={isPaid ? "#fff" : "#BBB"}
                />
                <Text
                  style={[
                    styles.paymentBtnText,
                    isPaid && styles.paymentBtnTextActive,
                  ]}
                >
                  {t("paid")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentBtn, !isPaid && styles.paymentBtnUnpaid]}
                onPress={() => !isViewing && setIsPaid(false)}
                disabled={isViewing}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={!isPaid ? "#fff" : "#BBB"}
                />
                <Text
                  style={[
                    styles.paymentBtnText,
                    !isPaid && styles.paymentBtnTextActive,
                  ]}
                >
                  {t("unpaid")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          {!isViewing && (
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>{t("saveRental")}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Lightbox */}
        <Modal
          visible={!!lightboxUri}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setLightboxUri(null)}
        >
          <ZoomableImage
            uri={lightboxUri!}
            onClose={() => setLightboxUri(null)}
          />
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F0E8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#1A1A1A",
    gap: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#C8A96E" },
  headerSub: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  moveOutHeaderBtn: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 16, gap: 16 },
  priceBadge: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  priceBadgeLeft: { flex: 1, gap: 4 },
  priceBadgeLabel: {
    fontSize: 10,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  priceBadgeValue: { fontSize: 24, fontWeight: "900", color: "#C8A96E" },
  priceBadgeSub: { fontSize: 11, color: "#666" },
  priceBadgeDivider: { width: 1, height: 48, backgroundColor: "#333" },
  priceBadgeRight: { flex: 1, gap: 4, alignItems: "flex-end" },
  priceBadgeTotal: { fontSize: 20, fontWeight: "800", color: "#fff" },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  personCountRow: { flexDirection: "row", gap: 10 },
  countBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  countBtnActive: { backgroundColor: "#1A1A1A", borderColor: "#1A1A1A" },
  countBtnText: { fontSize: 13, fontWeight: "700", color: "#888" },
  countBtnTextActive: { color: "#C8A96E" },
  tenantCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tenantCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tenantCardTitle: { fontSize: 13, fontWeight: "800", color: "#1A1A1A" },
  genderToggle: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  genderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F5F5F5",
  },
  genderBtnMale: { backgroundColor: "#42A5F5" },
  genderBtnFemale: { backgroundColor: "#EC407A" },
  genderBtnText: { fontSize: 11, fontWeight: "700", color: "#AAA" },
  genderBtnTextActive: { color: "#fff" },
  input: {
    backgroundColor: "#F5F0E8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E8E0D0",
  },
  // replace the existing photoBox style with these:
  photoWrapper: { gap: 8 },
  photoBox: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E0D8C8",
    borderStyle: "dashed",
    position: "relative",
  },
  photoPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  photoViewHint: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  photoViewHintText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F9F5EE",
  },
  photoPlaceholderText: { fontSize: 12, color: "#CCC" },
  photoDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E57373",
    backgroundColor: "#FFF5F5",
  },
  photoDeleteText: { fontSize: 12, fontWeight: "700", color: "#E57373" },
  // Lightbox
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
  },
  lightboxCloseBtn: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 10,
  },
  lightboxContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: SCREEN_H,
  },
  lightboxImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.82,
  },
  lightboxHintRow: {
    position: "absolute",
    bottom: 38,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  lightboxHint: { color: "rgba(255,255,255,0.35)", fontSize: 12 },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateBtnText: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  durationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF8EC",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#C8A96E",
  },
  durationText: { fontSize: 14, color: "#5A4A30", fontWeight: "600" },
  paymentToggle: { flexDirection: "row", gap: 10 },
  paymentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  paymentBtnPaid: { backgroundColor: "#66BB6A", borderColor: "#66BB6A" },
  paymentBtnUnpaid: { backgroundColor: "#E57373", borderColor: "#E57373" },
  paymentBtnText: { fontSize: 14, fontWeight: "700", color: "#BBB" },
  paymentBtnTextActive: { color: "#fff" },
  saveBtn: {
    backgroundColor: "#C8A96E",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    shadowColor: "#C8A96E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
