import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../shared/models/candle_model.dart';
import '../errors/app_exception.dart';

String _computeDefaultBaseUrl() {
  // Allow compile-time override
  const env = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  if (env.isNotEmpty) return env;

  try {
    // On web, use the current host but default backend port 4000
    final scheme = Uri.base.scheme; // http or https
    final host = Uri.base.host.isNotEmpty ? Uri.base.host : '127.0.0.1';
    final backendPort = '4000';
    return '$scheme://$host:$backendPort';
  } catch (_) {
    return 'http://127.0.0.1:4000';
  }
}

class ApiService {
  final Dio _dio;

  ApiService({Dio? dio, String? baseUrl})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: baseUrl ?? _computeDefaultBaseUrl(),
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 15),
              sendTimeout: const Duration(seconds: 10),
              responseType: ResponseType.json,
              headers: {'Accept': 'application/json'},
            )) {
    // Add simple logging and error mapping
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        // ignore: avoid_print
        if (!kReleaseMode) print('API -> ${options.method} ${options.uri}');
        return handler.next(options);
      },
      onResponse: (resp, handler) {
        return handler.next(resp);
      },
      onError: (err, handler) {
        // map to AppException where possible
        return handler.next(err);
      },
    ));
  }

  Future<List<CandleModel>> fetchCandles({required String symbol, required String interval, int limit = 200}) async {
    try {
      final resp = await _dio.get('/api/candles', queryParameters: {
        'symbol': symbol,
        'interval': interval,
        'limit': limit,
      });

      if (resp.statusCode != 200) {
        throw AppException('Unexpected status code: ${resp.statusCode}', resp.statusCode);
      }

      final data = resp.data;
      if (data is! List) {
        throw AppException('Unexpected API response shape', resp.statusCode);
      }

      return data.map((e) => CandleModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw AppException('Network timeout or connection error: ${e.message}');
      }

      if (e.response != null) {
        throw AppException('API error: ${e.response?.statusCode} ${e.response?.statusMessage}', e.response?.statusCode);
      }

      throw AppException('Network error: ${e.message}');
    } catch (e) {
      throw AppException('Unknown error: $e');
    }
  }
}
