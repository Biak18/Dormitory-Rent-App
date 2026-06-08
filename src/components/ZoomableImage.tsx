import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function ZoomableImage({
  uri,
  onClose,
}: {
  uri: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // raw refs so gesture handlers read latest values synchronously
  const scaleRef = useRef(1);
  const lastScale = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const lastTranslate = useRef({ x: 0, y: 0 });
  const initialDistance = useRef<number | null>(null);
  const initialTouchMid = useRef({ x: 0, y: 0 });

  function distance(t: any[]) {
    const dx = t[0].pageX - t[1].pageX;
    const dy = t[0].pageY - t[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function midpoint(t: any[]) {
    return {
      x: (t[0].pageX + t[1].pageX) / 2,
      y: (t[0].pageY + t[1].pageY) / 2,
    };
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (_, gs) => {
        // snapshot current animated values
        lastScale.current = scaleRef.current;
        lastTranslate.current = { ...translateRef.current };
        initialDistance.current = null;
      },

      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          // ── PINCH ──
          const dist = distance(touches);
          const mid = midpoint(touches);

          if (initialDistance.current === null) {
            initialDistance.current = dist;
            initialTouchMid.current = mid;
            lastScale.current = scaleRef.current;
            lastTranslate.current = { ...translateRef.current };
          }

          const newScale = Math.min(
            Math.max(lastScale.current * (dist / initialDistance.current), 1),
            5,
          );
          scaleRef.current = newScale;
          scale.setValue(newScale);

          // keep image centered on pinch midpoint
          const tx =
            lastTranslate.current.x + (mid.x - initialTouchMid.current.x) * 0.5;
          const ty =
            lastTranslate.current.y + (mid.y - initialTouchMid.current.y) * 0.5;
          translateRef.current = { x: tx, y: ty };
          translateX.setValue(tx);
          translateY.setValue(ty);
        } else if (touches.length === 1 && scaleRef.current > 1) {
          // ── PAN (only when zoomed in) ──
          const tx = lastTranslate.current.x + gs.dx;
          const ty = lastTranslate.current.y + gs.dy;
          translateRef.current = { x: tx, y: ty };
          translateX.setValue(tx);
          translateY.setValue(ty);
        }
      },

      onPanResponderRelease: () => {
        initialDistance.current = null;
        lastScale.current = scaleRef.current;
        lastTranslate.current = { ...translateRef.current };

        // snap back to 1x if somehow below
        if (scaleRef.current <= 1) {
          scaleRef.current = 1;
          Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          ]).start();
          translateRef.current = { x: 0, y: 0 };
          lastTranslate.current = { x: 0, y: 0 };
        }
      },
    }),
  ).current;

  const doubleTapRef = useRef<number>(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - doubleTapRef.current < 300) {
      // double tap → reset
      scaleRef.current = 1;
      lastScale.current = 1;
      translateRef.current = { x: 0, y: 0 };
      lastTranslate.current = { x: 0, y: 0 };
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    }
    doubleTapRef.current = now;
  };

  return (
    <View style={lb.overlay}>
      {/* Close */}
      <TouchableOpacity style={lb.closeBtn} onPress={onClose}>
        <Ionicons name="close-circle" size={36} color="#fff" />
      </TouchableOpacity>

      {/* Zoomable area */}
      <View style={lb.imageArea} {...panResponder.panHandlers}>
        <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
          <Animated.Image
            source={{ uri }}
            style={[
              lb.image,
              {
                transform: [{ scale }, { translateX }, { translateY }],
              },
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <View style={lb.hintRow}>
        <Ionicons
          name="search-outline"
          size={13}
          color="rgba(255,255,255,0.4)"
        />
        <Text style={lb.hint}>{t("pinchZoom")}</Text>
      </View>
    </View>
  );
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const lb = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 10,
  },
  imageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.82,
  },
  hintRow: {
    position: "absolute",
    bottom: 38,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  hint: { color: "rgba(255,255,255,0.35)", fontSize: 12 },
});
