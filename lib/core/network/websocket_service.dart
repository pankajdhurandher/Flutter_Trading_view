import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';
import '../../shared/models/candle_model.dart';
import '../errors/app_exception.dart';
import 'ws_message.dart';

class WebSocketService {
  final String url; // e.g. ws://127.0.0.1:4000/ws
  WebSocketChannel? _channel;
  final StreamController<CandleModel> _candleController = StreamController.broadcast();
  StreamSubscription? _sub;
  bool _connected = false;
  int _reconnectAttempt = 0;
  Timer? _reconnectTimer;

  WebSocketService({this.url = 'ws://127.0.0.1:4000/ws'});

  Stream<CandleModel> get candleStream => _candleController.stream;

  Future<void> connect() async {
    if (_connected) return;
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _connected = true;
      _reconnectAttempt = 0;

      _sub = _channel!.stream.listen((message) {
        _onMessage(message);
      }, onError: (err) {
        _handleDisconnect(err);
      }, onDone: () {
        _handleDisconnect(null);
      }, cancelOnError: true);
    } catch (e) {
      _scheduleReconnect();
      throw AppException('WebSocket connect failed: $e');
    }
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _sub?.cancel();
    _channel?.sink.close();
    _connected = false;
  }

  void _onMessage(dynamic message) {
    try {
      final Map<String, dynamic> json = jsonDecode(message as String) as Map<String, dynamic>;
      final event = json['event'] as String?;
      if (event == 'candle_update' && json['data'] != null) {
        final candle = CandleModel.fromJson(Map<String, dynamic>.from(json['data'] as Map));
        _candleController.add(candle);
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  void sendSubscribe(String symbol, String interval) {
    _ensureConnected();
    final msg = WsClientMessage(event: 'subscribe', symbol: symbol.toUpperCase(), interval: interval);
    _channel?.sink.add(jsonEncode(msg.toJson()));
  }

  void sendUnsubscribe(String symbol, String interval) {
    _ensureConnected();
    final msg = WsClientMessage(event: 'unsubscribe', symbol: symbol.toUpperCase(), interval: interval);
    _channel?.sink.add(jsonEncode(msg.toJson()));
  }

  void _ensureConnected() {
    if (!_connected) throw AppException('WebSocket not connected');
  }

  void _handleDisconnect(Object? err) {
    _connected = false;
    _sub?.cancel();
    _channel = null;
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    _reconnectAttempt += 1;
    final delay = Duration(milliseconds: (1000 * (_reconnectAttempt * _reconnectAttempt)).clamp(1000, 30000));
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () {
      connect();
    });
  }

  void dispose() {
    _candleController.close();
    disconnect();
  }
}
