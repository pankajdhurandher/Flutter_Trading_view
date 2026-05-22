// ignore_for_file: avoid_web_libraries_in_flutter
import 'dart:convert';
import 'dart:html' as html;
import 'dart:js' as js;
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';

import 'tradingview_controller.dart';

class TradingViewChart extends StatefulWidget {
  final TradingViewController controller;
  final double? height;
  final double? width;

  const TradingViewChart({
    Key? key,
    required this.controller,
    this.height,
    this.width,
  }) : super(key: key);

  @override
  State<TradingViewChart> createState() => _TradingViewChartState();
}

class _TradingViewChartState extends State<TradingViewChart> {
  late final String _viewType;
  late final html.IFrameElement _iframe;
  bool _chartReady = false;

  @override
  void initState() {
    super.initState();
    _viewType = 'tradingview-chart-${DateTime.now().millisecondsSinceEpoch}';
    _setupChart();
  }

  void _setupChart() {
    _iframe = html.IFrameElement()
      ..style.border = 'none'
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.display = 'block'
      ..setAttribute('sandbox', 'allow-scripts');

    // Listen for chart ready signal
    html.window.addEventListener('message', (ev) {
      if (ev is html.MessageEvent && ev.data != null) {
        try {
          final data = ev.data;
          if (data is Map) {
            if (data['type'] == 'chart_ready') {
              setState(() => _chartReady = true);
            }
          } else {
            final jsObj = js.JsObject.fromBrowserObject(data);
            if (jsObj['type'] == 'chart_ready') {
              setState(() => _chartReady = true);
            }
          }
        } catch (_) {}
      }
    });

    // Register platform view factory
    // ignore: undefined_prefixed_name
    ui_web.platformViewRegistry.registerViewFactory(
      _viewType,
      (_) {
        Future.microtask(() => _loadChartHtml());
        return _iframe;
      },
    );

    // Bind controller
    widget.controller.bind((String message) async {
      if (!_chartReady) return;
      try {
        final obj = jsonDecode(message);
        _iframe.contentWindow?.postMessage(obj, '*');
      } catch (e) {
        _iframe.contentWindow?.postMessage(message, '*');
      }
    });
  }

  Future<void> _loadChartHtml() async {
    const htmlContent = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradingView Chart</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #container { width: 100%; height: 100%; }
    body { background-color: #0f1720; color: #e6eef8; }
    #container { display: flex; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script src="https://unpkg.com/lightweight-charts@4/dist/lightweight-charts.standalone.production.js"></script>
  <script>
    (function() {
      try {
        const container = document.getElementById('container');
        const chart = LightweightCharts.createChart(container, {
          layout: { background: { color: '#0f1720' }, textColor: '#E6EEF8' },
          rightPriceScale: { visible: true },
          timeScale: { timeVisible: true, secondsVisible: true },
          handleScroll: { mouseWheel: true, pressedMouseMove: true },
          handleScale: { axisPressedMouseMove: true, axisDoubleClickReset: true }
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350'
        });

        window.TradingViewBridge = {
          setData: function(candlesJson) {
            try {
              const candles = JSON.parse(candlesJson);
              candleSeries.setData(candles);
              // Auto-fit chart to show all candles with proper spacing
              setTimeout(() => chart.timeScale().fitContent(), 100);
            } catch(e) { console.error('setData error', e); }
          },
          updateCandle: function(candleJson) {
            try {
              const candle = JSON.parse(candleJson);
              candleSeries.update(candle);
            } catch(e) { console.error('updateCandle error', e); }
          },
          setTheme: function(theme) {
            const isDark = theme === 'dark';
            chart.applyOptions({
              layout: {
                background: { color: isDark ? '#0f1720' : '#FFFFFF' },
                textColor: isDark ? '#E6EEF8' : '#000000'
              }
            });
          }
        };

        window.addEventListener('message', function(ev) {
          const data = ev.data;
          if (!data || !data.type) return;
          if (data.type === 'setData') {
            window.TradingViewBridge.setData(JSON.stringify(data.payload));
          } else if (data.type === 'update') {
            window.TradingViewBridge.updateCandle(JSON.stringify(data.payload));
          } else if (data.type === 'theme') {
            window.TradingViewBridge.setTheme(data.payload);
          }
        });

        setTimeout(() => {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'chart_ready' }, '*');
          }
        }, 100);
      } catch(e) {
        console.error('Chart init error:', e);
      }
    })();
  </script>
</body>
</html>''';

    final uri = Uri.dataFromString(
      htmlContent,
      mimeType: 'text/html',
      encoding: Encoding.getByName('utf-8'),
    );
    _iframe.src = uri.toString();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width ?? double.infinity,
      height: widget.height ?? 400,
      child: HtmlElementView(viewType: _viewType),
    );
  }

  @override
  void dispose() {
    html.window.removeEventListener('message', (_) {});
    super.dispose();
  }
}
