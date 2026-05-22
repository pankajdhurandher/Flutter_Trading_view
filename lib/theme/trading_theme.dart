import 'package:flutter/material.dart';

class TradingTheme {
  static ThemeData dark() {
    final base = ThemeData.dark();
    return base.copyWith(
      colorScheme: base.colorScheme.copyWith(
        primary: const Color(0xFF0EA5A9),
        secondary: const Color(0xFF60A5FA),
        surface: const Color(0xFF111827),
        onSurface: const Color(0xFFE6EEF8),
      ),
      scaffoldBackgroundColor: const Color(0xFF0F1720),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF0B1220),
        elevation: 0,
        centerTitle: true,
      ),
      textTheme: base.textTheme.apply(
        bodyColor: const Color(0xFFE6EEF8),
        displayColor: const Color(0xFFE6EEF8),
      ),
    );
  }
}
