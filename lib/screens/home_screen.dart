import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/trading_app_bar.dart';
import 'watchlist_screen.dart';
import 'chart_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: const TradingAppBar(title: 'Market Dashboard'),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth > 800;
          return Padding(
            padding: const EdgeInsets.all(12),
            child: isWide
                ? const Row(
                    children: [
                      Expanded(flex: 3, child: ChartScreen()),
                      SizedBox(width: 12),
                      Expanded(flex: 1, child: WatchlistScreen())
                    ],
                  )
                : const Column(
                    children: [
                      Expanded(child: ChartScreen()),
                      SizedBox(height: 12),
                      SizedBox(height: 300, child: WatchlistScreen()),
                    ],
                  ),
          );
        },
      ),
    );
  }
}
