import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

social main() {
  runApp(const findpalsApp());
}

class findpalsApp extends StatelessWidget {
  const findpalsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'findpals',
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF050505),
        primaryColor: const Color(0xFF00ff9d),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00ff9d),
          secondary: Color(0xFFd600ff),
          surface: Color(0xFF111111),
        ),
        textTheme: GoogleFonts.outfitTextTheme(Theme.of(context).textTheme).apply(
          bodyColor: Colors.white,
          displayColor: Colors.white,
        ),
      ),
      home: const LandingPage(),
    );
  }
}

class LandingPage extends StatelessWidget {
  const LandingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'findpals',
              style: TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00ff9d),
                shadows: [
                  Shadow(blurRadius: 10, color: Color(0xFF00ff9d), offset: Offset(0,0))
                ]
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFd600ff),
                padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
              ),
              onPressed: () {
                // Navigate to implementation
              },
              child: const Text('ENTER THE social', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
