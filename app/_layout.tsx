import { Stack } from "expo-router";
import React from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F5FF" },
});
