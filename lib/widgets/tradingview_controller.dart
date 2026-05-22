import 'dart:convert';

import '../shared/models/candle_model.dart';

typedef PlatformSender = Future<void> Function(String message);

class TradingViewController {
  PlatformSender? _send;
  final List<String> _pendingMessages = [];

  /// Attach the platform-specific sender implementation.
  void bind(PlatformSender sender) {
    _send = sender;
    for (final message in _pendingMessages) {
      _send?.call(message);
    }
    _pendingMessages.clear();
  }

  /// Send a raw JSON message to the chart.
  Future<void> sendRaw(String jsonMessage) async {
    if (_send == null) {
      _pendingMessages.add(jsonMessage);
      return;
    }
    await _send!(jsonMessage);
  }

  Future<void> setCandles(List<Map<String, dynamic>> candles) async {
    final msg = jsonEncode({'type': 'setData', 'payload': candles});
    return sendRaw(msg);
  }

  Future<void> setCandlesFromModels(List<CandleModel> candles) async {
    final chartCandles = candles
        .map((c) => c.toLightweightChartJson())
        .toList(growable: false);
    return setCandles(chartCandles);
  }

  Future<void> updateCandle(Map<String, dynamic> candle) async {
    final msg = jsonEncode({'type': 'update', 'payload': candle});
    return sendRaw(msg);
  }

  Future<void> updateCandleFromModel(CandleModel candle) async {
    return updateCandle(candle.toLightweightChartJson());
  }

  Future<void> setTheme(String theme) async {
    final msg = jsonEncode({'type': 'theme', 'payload': theme});
    return sendRaw(msg);
  }
}
