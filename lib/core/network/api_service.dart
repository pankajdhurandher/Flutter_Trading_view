import 'package:dio/dio.dart';
import '../../shared/models/candle_model.dart';
import '../errors/app_exception.dart';

class ApiService {
  final Dio _dio;

  ApiService({Dio? dio, String baseUrl = 'http://127.0.0.1:4000'}) : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl));

  Future<List<CandleModel>> fetchCandles({required String symbol, required String interval, int limit = 100}) async {
    try {
      final resp = await _dio.get('/api/candles', queryParameters: {
        'symbol': symbol,
        'interval': interval,
        'limit': limit,
      });

      if (resp.statusCode != 200) {
        throw AppException('Unexpected status code: ${resp.statusCode}', resp.statusCode);
      }

      final data = resp.data as List<dynamic>;
      return data.map((e) => CandleModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      if (e.response != null) {
        throw AppException('API error: ${e.response?.statusCode} ${e.response?.statusMessage}', e.response?.statusCode);
      }
      throw AppException('Network error: ${e.message}');
    } catch (e) {
      throw AppException('Unknown error: $e');
    }
  }
}
