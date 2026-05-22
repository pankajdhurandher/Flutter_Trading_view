import '../../shared/models/candle_model.dart';
import '../network/api_service.dart';
import '../network/websocket_service.dart';

abstract class CandlesRepository {
  Future<List<CandleModel>> fetchHistorical({required String symbol, required String interval, int limit});
  Stream<CandleModel> liveCandles();
  Future<void> subscribe({required String symbol, required String interval});
  Future<void> unsubscribe({required String symbol, required String interval});
  Future<void> connectWebSocket();
  Future<void> disconnectWebSocket();
}

class CandlesRepositoryImpl implements CandlesRepository {
  final ApiService _api;
  final WebSocketService _ws;

  CandlesRepositoryImpl(this._api, this._ws);

  @override
  Future<List<CandleModel>> fetchHistorical({required String symbol, required String interval, int limit = 200}) async {
    return _api.fetchCandles(symbol: symbol, interval: interval, limit: limit);
  }

  @override
  Stream<CandleModel> liveCandles() => _ws.candleStream;

  @override
  Future<void> subscribe({required String symbol, required String interval}) async {
    _ws.sendSubscribe(symbol, interval);
  }

  @override
  Future<void> unsubscribe({required String symbol, required String interval}) async {
    _ws.sendUnsubscribe(symbol, interval);
  }

  @override
  Future<void> connectWebSocket() async {
    await _ws.connect();
  }

  @override
  Future<void> disconnectWebSocket() async {
    _ws.disconnect();
  }
}
