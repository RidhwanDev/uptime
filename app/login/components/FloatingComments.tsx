import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from "react-native";

const { width } = Dimensions.get("window");

// Sample comments that look like TikTok engagement
const COMMENTS = [
  { text: "🔥 7 day streak!", emoji: "🔥" },
  { text: "you're so consistent!", emoji: "💪" },
  { text: "posting every day 👏", emoji: "👏" },
  { text: "this is goals", emoji: "✨" },
  { text: "teach me your ways", emoji: "🙏" },
  { text: "legend status 👑", emoji: "👑" },
  { text: "30 days straight!!", emoji: "🎉" },
  { text: "the algorithm loves you", emoji: "📈" },
  { text: "consistency is key 🔑", emoji: "🔑" },
  { text: "never missing a day", emoji: "💯" },
  { text: "creator goals fr", emoji: "⭐" },
  { text: "W streak", emoji: "🏆" },
  { text: "how do you do it??", emoji: "😱" },
  { text: "insane dedication", emoji: "🚀" },
  { text: "100 day club 💎", emoji: "💎" },
];

// Floating comment component
function FloatingComment({
  text,
  delay,
  row,
  duration,
}: {
  text: string;
  delay: number;
  row: number;
  duration: number;
}) {
  const translateX = useRef(new Animated.Value(width + 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      // Reset position
      translateX.setValue(width + 100);
      opacity.setValue(0);

      Animated.sequence([
        // Wait for delay
        Animated.delay(delay),
        // Fade in while moving
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: width * 0.6,
            duration: duration * 0.2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Continue moving smoothly
        Animated.timing(translateX, {
          toValue: -300,
          duration: duration * 0.8,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Loop
        animate();
      });
    };

    animate();
  }, []);

  // Interpolate opacity to fade out at the end
  const animatedOpacity = translateX.interpolate({
    inputRange: [-300, 0, width * 0.3, width * 0.6, width + 100],
    outputRange: [0, 0.4, 0.6, 0.6, 0],
    extrapolate: "clamp",
  });

  const topPosition = 80 + row * 50;

  return (
    <Animated.View
      style={[
        styles.floatingComment,
        {
          top: topPosition,
          opacity: animatedOpacity,
          transform: [{ translateX }],
        },
      ]}
    >
      <Text style={styles.commentText}>{text}</Text>
    </Animated.View>
  );
}

// Generate staggered comments
export function FloatingComments() {
  const rows = 6;
  const commentsPerRow = 3;

  return (
    <View style={styles.commentsContainer} pointerEvents="none">
      {Array.from({ length: rows }).map((_, rowIndex) =>
        Array.from({ length: commentsPerRow }).map((_, commentIndex) => {
          const commentIdx =
            (rowIndex * commentsPerRow + commentIndex) % COMMENTS.length;
          const delay = commentIndex * 4000 + rowIndex * 600;
          const duration = 12000 + Math.random() * 4000;

          return (
            <FloatingComment
              key={`${rowIndex}-${commentIndex}`}
              text={COMMENTS[commentIdx].text}
              delay={delay}
              row={rowIndex}
              duration={duration}
            />
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  floatingComment: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  commentText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "500",
  },
});

