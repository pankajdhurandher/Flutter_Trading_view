import 'package:flutter/material.dart';

class IntervalSwitcher extends StatelessWidget {
  final String current;
  final void Function(String) onChanged;
  final List<String> intervals;

  const IntervalSwitcher({Key? key, required this.current, required this.onChanged, this.intervals = const ['1m','5m']}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: intervals.map((i) {
        final active = i == current;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: ChoiceChip(
            label: Text(i.toUpperCase()),
            selected: active,
            onSelected: (_) => onChanged(i),
            selectedColor: Theme.of(context).colorScheme.primary,
            backgroundColor: Colors.grey[850],
            labelStyle: TextStyle(color: active ? Colors.black : Colors.white),
          ),
        );
      }).toList(),
    );
  }
}
