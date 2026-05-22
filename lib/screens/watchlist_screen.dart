import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/price_tile.dart';
import '../shared/providers/network_providers.dart';

class WatchlistScreen extends ConsumerWidget {
  const WatchlistScreen({Key? key}) : super(key: key);

  static const defaultSymbols = ['BTCUSDT','ETHUSDT','BNBUSDT','XRPUSDT'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      color: Theme.of(context).colorScheme.surface,
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: defaultSymbols.length,
        itemBuilder: (context, idx) {
          final sym = defaultSymbols[idx];
          final provider = liveCandleStreamProvider(CandleRequestParams(symbol: sym, interval: '1m'));
          final async = ref.watch(provider);
          return async.when(
            data: (candle) {
              final price = candle.close;
              // change percent not provided by server, use placeholder 0
              return PriceTile(symbol: sym, price: price, changePercent: 0);
            },
            loading: () => const ListTile(title: Text('Loading...')),
            error: (e,_) => ListTile(title: Text('Error: $e')),
          );
        },
      ),
    );
  }
}
