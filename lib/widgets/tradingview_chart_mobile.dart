import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:webview_flutter/webview_flutter.dart';

import 'tradingview_controller.dart';

class TradingViewChart extends StatefulWidget {
  final TradingViewController controller;
  final double? height;
  final double? width;

  const TradingViewChart({Key? key, required this.controller, this.height, this.width}) : super(key: key);

  @override
  State<TradingViewChart> createState() => _TradingViewChartState();
}

class _TradingViewChartState extends State<TradingViewChart> {
  late final WebViewController _webController;

  @override
  void initState() {
    super.initState();
    _webController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000));

    // bind controller sender
    widget.controller.bind((String message) async {
      try {
        final obj = jsonDecode(message);
        final type = obj['type'];
        final payload = obj['payload'];
        if (type == 'setData') {
          final payloadJson = jsonEncode(payload);
          await _webController.runJavaScript("window.TradingViewBridge.setData('$payloadJson');");
        } else if (type == 'update') {
          final payloadJson = jsonEncode(payload);
          await _webController.runJavaScript("window.TradingViewBridge.updateCandle('$payloadJson');");
        } else if (type == 'theme') {
          final theme = jsonEncode(payload);
          await _webController.runJavaScript("window.TradingViewBridge.setTheme($theme);");
        }
      } catch (e) {
        final safe = message.replaceAll("'", "\\'");
        await _webController.runJavaScript("try{ const m=JSON.parse('$safe'); if(m.type==='update'){ window.TradingViewBridge.updateCandle(JSON.stringify(m.payload)); } }catch(e){};");
      }
    });

    // load HTML asset
    _loadAssetHtml();
  }

  Future<void> _loadAssetHtml() async {
    final html = await rootBundle.loadString('assets/tradingview/chart.html');
    final uri = Uri.dataFromString(html, mimeType: 'text/html', encoding: Encoding.getByName('utf-8'));
    await _webController.loadRequest(uri);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width ?? double.infinity,
      height: widget.height ?? 300,
      child: WebViewWidget(controller: _webController),
    );
  }
}
