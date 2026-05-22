class WsClientMessage {
  final String event;
  final String? symbol;
  final String? interval;
  final int? timestamp;

  WsClientMessage({required this.event, this.symbol, this.interval, this.timestamp});

  Map<String, dynamic> toJson() => {
        'event': event,
        if (symbol != null) 'symbol': symbol,
        if (interval != null) 'interval': interval,
        if (timestamp != null) 'timestamp': timestamp,
      };
}

class WsServerMessage {
  final String event;
  final Map<String, dynamic>? data;

  WsServerMessage({required this.event, this.data});

  factory WsServerMessage.fromJson(Map<String, dynamic> json) {
    return WsServerMessage(event: json['event'] as String, data: json['data'] as Map<String, dynamic>?);
  }
}
