import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/interval_switcher.dart';
import '../widgets/realtime_tradingview_chart.dart';

class ChartScreen extends ConsumerStatefulWidget {
  const ChartScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ChartScreen> createState() => _ChartScreenState();
}

class _ChartScreenState extends ConsumerState<ChartScreen> {
  String _interval = '1m';

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('BTCUSDT', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                IntervalSwitcher(current: _interval, onChanged: (v) => setState(() => _interval = v)),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: RealtimeTradingViewChart(
                symbol: 'BTCUSDT',
                interval: _interval,
                historyLimit: 250,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
