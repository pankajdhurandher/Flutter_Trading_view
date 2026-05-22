import 'package:flutter/material.dart';

class SymbolSelector extends StatelessWidget {
  const SymbolSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: SizedBox(
        width: 600,
        height: 500,
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.all(12),
              child: TextField(
                decoration: InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search symbol'),
              ),
            ),
            const Expanded(child: Center(child: Text('Symbol search results'))),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
