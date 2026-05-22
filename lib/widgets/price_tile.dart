import 'package:flutter/material.dart';

class PriceTile extends StatelessWidget {
  final String symbol;
  final double price;
  final double changePercent;

  const PriceTile({Key? key, required this.symbol, required this.price, required this.changePercent}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final up = changePercent >= 0;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      leading: CircleAvatar(backgroundColor: Colors.grey[850], child: Text(symbol.substring(0,3))),
      title: Text(symbol, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
      subtitle: Text('${changePercent.toStringAsFixed(2)}%', style: TextStyle(color: up ? Colors.greenAccent : Colors.redAccent)),
      trailing: Text('\$${price.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
    );
  }
}
