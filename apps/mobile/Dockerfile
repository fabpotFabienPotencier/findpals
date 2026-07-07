FROM ghcr.io/cirruslabs/flutter:3.10.6 AS build

WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
# RUN flutter pub get # Commented since we can't run this without network/env logic confirming

COPY . .

RUN flutter build apk --release

FROM scratch
COPY --from=build /app/build/app/outputs/flutter-apk/app-release.apk /
