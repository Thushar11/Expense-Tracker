# Expense Tracker

A cross-platform (Android & iOS) expense tracker built with React Native and JavaScript, using Expo SDK 58 and Expo Router. All data is stored on the device; no account or server is needed.

## Features

- **Dashboard**: total balance, this month's income and expenses, budget progress, average daily spend, top spending categories, recent transactions
- **Transactions**: add, edit and delete expenses and income with an amount, category, date, payment method (Cash, Card, UPI, Bank, E-Wallet) and a note
- **History**: transactions grouped by day with daily net totals, a month switcher, search across all months, an expense/income filter and category filter chips
- **Statistics**: category donut chart with percentages, a daily bar chart, a 6-month income vs. expense trend, and insights (average per day, biggest transaction, savings rate)
- **Budgets**: an overall monthly budget plus budgets per category, with progress bars, color-coded warnings at 80% and 100%, and a "remaining per day" amount
- **Categories**: 16 built-in categories, plus your own with a custom name, icon and color. When you delete a category, its transactions move to "Other".
- **Settings**: 12 currencies, light/dark/system theme, CSV export through the share sheet, demo data, and an option to erase all data

## Run it

```bash
npm install
npx expo start
```

- **On a phone:** install **Expo Go** (Play Store or App Store) and scan the QR code. Every library the app uses is included in Expo Go.
- **Android emulator:** press `a` (needs Android Studio).
- **iOS simulator:** press `i` (needs a Mac with Xcode).

Tip: open **Settings → Load sample data** to fill the app with 3 months of demo transactions.

## Build installable apps

### Android APK on this PC (no account needed)

Needs the Android SDK and JDK 17+. Build from a short path outside OneDrive. Windows path-length limits break the native build in long folders, and OneDrive would sync gigabytes of build output.

One-time setup (already done on this PC):
- Windows long paths enabled (`LongPathsEnabled = 1`, needs admin). Some native libraries generate paths longer than 260 characters.
- CMake 3.31.6 installed via the SDK manager (`sdkmanager "cmake;3.31.6"`). The default 3.22 can't handle long paths.
- If the build fails with "Access is denied" or "Permission denied", antivirus (McAfee or 360) is locking build files. Add `C:\et`, the Android SDK and `%USERPROFILE%\.gradle` to its exclusions.

```powershell
robocopy . C:\et /E /XD node_modules .git .expo android ios
cd C:\et
npm ci
npx expo prebuild --platform android --clean
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
Set-Content android\local.properties "sdk.dir=$($sdk -replace '\\','\\')`ncmake.dir=$($sdk -replace '\\','\\')\\cmake\\3.31.6"
$env:ANDROID_HOME = $sdk
cd android
.\gradlew.bat assembleRelease
```

The APK is written to `C:\et\android\app\build\outputs\apk\release\app-release.apk`. Install it over USB with `adb install -r <apk>`, or copy it to the phone and open it.

This APK is signed with a debug key. That's fine for installing on your own phones, but the Play Store needs a proper upload key (use the EAS `production` profile below).

### Cloud builds with EAS (Android and iOS)

`eas.json` is already set up. `preview` builds an installable APK, and `production` builds a Play Store bundle.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview   # installable .apk
npx eas-cli@latest build --platform ios                         # needs an Apple Developer account ($99/yr)
```

## Project structure

```
src/
  app/                 Expo Router screens
    _layout.js         Root stack, theme and data providers
    (tabs)/            Home, Transactions, Statistics, Budgets, Settings
    transaction.js     Add/edit transaction (modal)
    categories.js      Manage categories
  components/          UI kit, charts, transaction row, amount prompt
  constants/           Default categories, currencies, theme colors
  lib/                 Date/money helpers, analytics, CSV export, sample data
  store/               App state (useReducer) persisted to AsyncStorage; the data model is described at the top of StoreProvider.js
```

## Scripts

- `npm start`: start the dev server
- `npm run lint`: ESLint
