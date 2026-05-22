class CandleModel {
  final String symbol;
  final String interval; // '1m' or '5m'
  final int timestamp; // epoch ms
  final double open;
  final double high;
  final double low;
  final double close;
  final int volume;

  CandleModel({
    required this.symbol,
    required this.interval,
    required this.timestamp,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });

  factory CandleModel.fromJson(Map<String, dynamic> json) {
    return CandleModel(
      symbol: json['symbol'] as String,
      interval: json['interval'] as String,
      timestamp: (json['timestamp'] as num).toInt(),
      open: (json['open'] as num).toDouble(),
      high: (json['high'] as num).toDouble(),
      low: (json['low'] as num).toDouble(),
      close: (json['close'] as num).toDouble(),
      volume: (json['volume'] as num).toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
        'symbol': symbol,
        'interval': interval,
        'timestamp': timestamp,
        'open': open,
        'high': high,
        'low': low,
        'close': close,
        'volume': volume,
      };

  Map<String, dynamic> toLightweightChartJson() {
    return {
      'time': timestamp ~/ 1000,
      'open': open,
      'high': high,
      'low': low,
      'close': close,
    };
  }
}
