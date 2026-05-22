import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../shared/models/candle_model.dart';
import '../shared/providers/network_providers.dart';
import 'tradingview_chart.dart';
import 'tradingview_controller.dart';

class RealtimeTradingViewChart extends ConsumerStatefulWidget {
  final String symbol;
  final String interval;
  final int historyLimit;

  const RealtimeTradingViewChart({
    Key? key,
    required this.symbol,
    required this.interval,
    this.historyLimit = 300,
  }) : super(key: key);



  @override
  ConsumerState<RealtimeTradingViewChart> createState() => _RealtimeTradingViewChartState();
}

class _RealtimeTradingViewChartState extends ConsumerState<RealtimeTradingViewChart> {
  late final TradingViewController _controller;
  bool _historicalDataApplied = false;

  @override
  void initState() {
    super.initState();
    _controller = TradingViewController();
  }

  void _applyHistoricalCandles(List<CandleModel> candles) {
    if (_historicalDataApplied) return;
    _historicalDataApplied = true;
    _controller.setTheme('dark');
    _controller.setCandlesFromModels(candles);
  }

  void _handleLiveCandleUpdate(CandleModel candle) {
    _controller.updateCandleFromModel(candle);
  }

  @override
  Widget build(BuildContext context) {
    final params = CandleRequestParams(symbol: widget.symbol, interval: widget.interval, limit: widget.historyLimit);

    final historicalValue = ref.watch(historicalCandlesProvider(params));
    ref.listen<AsyncValue<CandleModel>>(liveCandleStreamProvider(params), (previous, next) {
      next.whenData(_handleLiveCandleUpdate);
    });

    return historicalValue.when(
      data: (candles) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _applyHistoricalCandles(candles);
        });
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: TradingViewChart(
                controller: _controller,
                height: double.infinity,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(
                '${widget.symbol} • ${widget.interval.toUpperCase()} • ${candles.length} candles',
                style: const TextStyle(color: Colors.white70),
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Text(
          'Unable to load candles: $error',
          style: const TextStyle(color: Colors.redAccent),
        ),
      ),
    );
  }
}
