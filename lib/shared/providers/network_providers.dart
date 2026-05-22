import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/candle_model.dart';
import '../../core/network/api_service.dart';
import '../../core/network/websocket_service.dart';
import '../../core/repositories/candles_repository.dart';

final dioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(baseUrl: 'http://127.0.0.1:4000'));
});

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(dio: ref.read(dioProvider));
});

final websocketServiceProvider = Provider<WebSocketService>((ref) {
  final ws = WebSocketService(url: 'ws://127.0.0.1:4000/ws');
  ref.onDispose(() => ws.dispose());
  return ws;
});

final candlesRepositoryProvider = Provider<CandlesRepository>((ref) {
  final api = ref.read(apiServiceProvider);
  final ws = ref.read(websocketServiceProvider);
  return CandlesRepositoryImpl(api, ws);
});

class CandleRequestParams {
  final String symbol;
  final String interval;
  final int limit;

  const CandleRequestParams({
    required this.symbol,
    required this.interval,
    this.limit = 100,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CandleRequestParams &&
          runtimeType == other.runtimeType &&
          symbol.toUpperCase() == other.symbol.toUpperCase() &&
          interval == other.interval &&
          limit == other.limit;

  @override
  int get hashCode => symbol.toUpperCase().hashCode ^ interval.hashCode ^ limit.hashCode;
}

final liveCandleStreamProvider = StreamProvider.family<CandleModel, CandleRequestParams>((ref, params) {
  final repo = ref.read(candlesRepositoryProvider);
  // ensure websocket is connected
  repo.connectWebSocket();

  final stream = repo.liveCandles().where((c) => c.symbol.toUpperCase() == params.symbol.toUpperCase() && c.interval == params.interval);

  ref.onDispose(() {
    repo.unsubscribe(symbol: params.symbol, interval: params.interval);
  });

  // start subscription for this symbol/interval
  repo.subscribe(symbol: params.symbol, interval: params.interval);

  return stream;
});

final historicalCandlesProvider = FutureProvider.family<List<CandleModel>, CandleRequestParams>((ref, params) async {
  final repo = ref.read(candlesRepositoryProvider);
  return repo.fetchHistorical(symbol: params.symbol, interval: params.interval, limit: params.limit);
});
