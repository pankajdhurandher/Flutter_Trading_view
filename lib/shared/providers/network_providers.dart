import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/candle_model.dart';
import '../../core/network/api_service.dart';
import '../../core/network/websocket_service.dart';
import '../../core/repositories/candles_repository.dart';

const String _apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://127.0.0.1:4000');
const String _wsBaseUrl = String.fromEnvironment('WS_BASE_URL', defaultValue: 'ws://127.0.0.1:4000/ws');

final dioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(
    baseUrl: _apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    sendTimeout: const Duration(seconds: 10),
    responseType: ResponseType.json,
    headers: {'Accept': 'application/json'},
  ));
});

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(dio: ref.read(dioProvider), baseUrl: _apiBaseUrl);
});

final websocketServiceProvider = Provider<WebSocketService>((ref) {
  final ws = WebSocketService(url: _wsBaseUrl);
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
  final stream = repo.liveCandles().where((c) => c.symbol.toUpperCase() == params.symbol.toUpperCase() && c.interval == params.interval);

  Future.microtask(() async {
    try {
      await repo.connectWebSocket();
      await repo.subscribe(symbol: params.symbol, interval: params.interval);
    } catch (_) {
      // Connection and subscription failures will be retried by the websocket service.
    }
  });

  ref.onDispose(() {
    repo.unsubscribe(symbol: params.symbol, interval: params.interval);
    repo.disconnectWebSocket();
  });

  return stream;
});

final historicalCandlesProvider = FutureProvider.family<List<CandleModel>, CandleRequestParams>((ref, params) async {
  final repo = ref.read(candlesRepositoryProvider);
  return repo.fetchHistorical(symbol: params.symbol, interval: params.interval, limit: params.limit);
});
