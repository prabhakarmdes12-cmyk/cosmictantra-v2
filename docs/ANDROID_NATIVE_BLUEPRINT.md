# CosmicTantra — Native Android Application Blueprint
**Platform:** Android (Google Play Store) • **Language:** Kotlin 2.x • **UI Toolkit:** Jetpack Compose (Material 3) • **Architecture:** Multi-Module Clean MVI • **Target SDK:** 35 (Android 15) • **Min SDK:** 26 (Android 8.0)

---

## 1. Executive Summary & Philosophy

The **CosmicTantra Native Android App** delivers an uncompromised, offline-first Vedic astrology, astronomical observatory, temple darshan, and sacred pooja store experience built natively for modern Android hardware.

### Key Native Capabilities
1. **Sensory Ephemeris Engine (Swiss Ephemeris NDK)**: Microsecond astronomical precision running directly on ARM64 silicon without cloud roundtrips.
2. **Gyroscope-Powered Vedic Sky Dome (AR Mode)**: Point your Android phone at the night sky to identify Nakshatras, Lagna horizon, and Grahas in real time.
3. **Android Glance Home Screen & Lock Screen Widgets**: Live Tithi, active Choghadiya, and Rahu Kaal countdown accessible at a glance.
4. **Offline-First Encrypted Vault (Room + SQLCipher)**: DPDP-compliant local storage for multi-generational family Kundalis and biometric authentication.
5. **Media3 Background Temple Aarti & Live Darshan Service**: Seamless background audio playback and Android Picture-in-Picture (PiP).
6. **Exact WorkManager & AlarmManager Alarms**: Daily 06:00 AM Panchang notification, Brahma Muhurat reminders, and Ekadashi/Purnima fasting alerts.

---

## 2. Multi-Module Project Architecture

```
cosmictantra-android/
├── app/                              # Application entrypoint & DI Graph
│   ├── src/main/AndroidManifest.xml
│   ├── src/main/kotlin/tech/chiti/cosmictantra/MainActivity.kt
│   └── src/main/kotlin/tech/chiti/cosmictantra/CosmicTantraApp.kt
├── core/
│   ├── designsystem/                 # Chiti UDS v3 Compose Theme, Tokens & Haptics
│   ├── common/                       # Coroutine dispatchers, Result monad, extensions
│   ├── ephemeris/                    # Swiss Ephemeris C++ NDK + JNI + Vedic Math
│   ├── database/                     # Encrypted Room DB (SQLCipher) + DataStore
│   ├── network/                      # Ktor Client + WebSockets for Live Feeds
│   └── notifications/                # WorkManager, AlarmManager & Push notification engine
├── features/
│   ├── panchang/                     # Daily 72h Forecast & Monthly Aura Calendar
│   ├── observatory/                  # Interactive 3D Canvas Sky Dome & Gyro AR
│   ├── darshan/                      # 26 Shrines, Media3 ExoPlayer, Virtual Puja
│   ├── store/                        # Pooja Samagri Catalog, Cart & Razorpay/UPI
│   ├── kundali/                      # 16 Divisional Charts, Vimshottari & Milan
│   └── vault/                        # Parivaar Family Vault, DPDP Export, Biometrics
└── widget/                           # Android Glance Home & Lock Screen App Widgets
```

---

## 3. Core Engine Implementation: Swiss Ephemeris NDK (`:core:ephemeris`)

### CMake & C++ JNI Binding (`native-ephemeris.cpp`)
```cpp
#include <jni.h>
#include <string>
#include "swephexp.h"

extern "C" JNIEXPORT jdoubleArray JNICALL
Java_tech_chiti_cosmictantra_core_ephemeris_NativeEphemeris_calcPlanetCoordinates(
    JNIEnv *env,
    jobject /* this */,
    jdouble julianDay,
    jint planetId,
    jint iflag,
    jint ayanamshaMode
) {
    // Set Lahiri / Chitra Paksha Ayanamsha (SE_SIDM_LAHIRI = 1)
    swe_set_sid_mode(ayanamshaMode, 0, 0);

    double x[6];
    char serr[256];
    
    // Calculate sidereal coordinate
    int iflgret = swe_calc_ut(julianDay, planetId, iflag | SEFLG_SIDEREAL | SEFLG_SPEED, x, serr);

    jdoubleArray result = env->NewDoubleArray(6);
    env->SetDoubleArrayRegion(result, 0, 6, x);
    return result;
}
```

### Kotlin Ephemeris Domain Repository
```kotlin
package tech.chiti.cosmictantra.core.ephemeris

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EphemerisRepository @Inject constructor() {
    init {
        System.loadLibrary("sweph")
    }

    fun computePlanets(julianDay: Double): List<PlanetPosition> {
        val planets = listOf(
            Planet.SURYA to 0,
            Planet.CHANDRA to 1,
            Planet.MANGAL to 4,
            Planet.BUDHA to 2,
            Planet.GURU to 5,
            Planet.SHUKRA to 3,
            Planet.SHANI to 6,
            Planet.RAHU to 11
        )

        return planets.map { (planet, code) ->
            val raw = NativeEphemeris.calcPlanetCoordinates(julianDay, code, 0, 1)
            val longitude = raw[0]
            val speed = raw[3]
            PlanetPosition(
                planet = planet,
                longitude = longitude,
                nakshatra = Nakshatra.fromLongitude(longitude),
                pada = Nakshatra.padaFromLongitude(longitude),
                rashi = Rashi.fromLongitude(longitude),
                isRetrograde = speed < 0,
                isCombust = if (planet != Planet.SURYA) isCombust(longitude, julianDay) else false
            )
        }
    }
}
```

---

## 4. Jetpack Compose UI: Interactive Vedic Sky Dome (`:features:observatory`)

Point your device at the sky to see Nakshatra boundaries and Graha alignments in real time.

```kotlin
package tech.chiti.cosmictantra.features.observatory.ui

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import tech.chiti.cosmictantra.core.designsystem.theme.ChitiGold
import tech.chiti.cosmictantra.core.designsystem.theme.ChitiObsidian
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun VedicSkyDomeView(
    planets: List<PlanetPosition>,
    sensorManager: SensorManager,
    modifier: Modifier = Modifier
) {
    var azimuth by remember { mutableFloatStateOf(0f) }
    var pitch by remember { mutableFloatStateOf(0f) }

    DisposableEffect(Unit) {
        val rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
        val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent?) {
                event?.let {
                    val rotationMatrix = FloatArray(9)
                    SensorManager.getRotationMatrixFromVector(rotationMatrix, it.values)
                    val orientation = FloatArray(3)
                    SensorManager.getOrientation(rotationMatrix, orientation)
                    azimuth = Math.toDegrees(orientation[0].toDouble()).toFloat()
                    pitch = Math.toDegrees(orientation[1].toDouble()).toFloat()
                }
            }
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }
        sensorManager.registerListener(listener, rotationSensor, SensorManager.SENSOR_DELAY_GAME)
        onDispose { sensorManager.unregisterListener(listener) }
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val center = Offset(size.width / 2f, size.height / 2f)
        val radius = size.minDimension / 2.2f

        // Draw Celestial Equator and 27 Nakshatra Radii
        drawCircle(
            color = ChitiGold.copy(alpha = 0.25f),
            radius = radius,
            center = center,
            style = Stroke(width = 2f)
        )

        for (i in 0 until 27) {
            val angleRad = Math.toRadians((i * (360.0 / 27.0)) + azimuth)
            val endX = center.x + radius * cos(angleRad).toFloat()
            val endY = center.y + radius * sin(angleRad).toFloat()
            drawLine(
                color = Color.White.copy(alpha = 0.15f),
                start = center,
                end = Offset(endX, endY),
                strokeWidth = 1f
            )
        }

        // Draw Planetary Coordinates
        planets.forEach { planet ->
            val planetAngleRad = Math.toRadians(planet.longitude + azimuth)
            val planetDist = radius * 0.75f
            val px = center.x + planetDist * cos(planetAngleRad).toFloat()
            val py = center.y + planetDist * sin(planetAngleRad).toFloat()

            drawCircle(
                color = planet.color,
                radius = 12f,
                center = Offset(px, py)
            )
        }
    }
}
```

---

## 5. Offline Encrypted Room Database (`:core:database`)

Ensures zero cloud data leakages for family birth details and Kundalis.

```kotlin
package tech.chiti.cosmictantra.core.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "devotee_profiles")
data class ProfileEntity(
    @PrimaryKey val id: String,
    val cosmicId: String,
    val name: String,
    val relation: String,
    val birthDate: String,
    val birthTime: String,
    val birthCity: String,
    val gotra: String,
    val gender: String,
    val rashi: String,
    val nakshatra: String,
    val lagna: String,
    val updatedAt: Long = System.currentTimeMillis()
)

@Dao
interface ProfileDao {
    @Query("SELECT * FROM devotee_profiles ORDER BY updatedAt DESC")
    fun getAllProfiles(): Flow<List<ProfileEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfile(profile: ProfileEntity)

    @Delete
    suspend fun deleteProfile(profile: ProfileEntity)

    @Query("DELETE FROM devotee_profiles")
    suspend fun clearAll()
}

@Database(entities = [ProfileEntity::class], version = 1, exportSchema = false)
abstract class CosmicTantraDatabase : RoomDatabase() {
    abstract fun profileDao(): ProfileDao
}
```

---

## 6. Android Glance App Widgets (`:widget`)

Display live Panchang and active Choghadiya directly on the Android Home Screen.

```kotlin
package tech.chiti.cosmictantra.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.*
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle

class PanchangWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            PanchangWidgetContent()
        }
    }

    @Composable
    private fun PanchangWidgetContent() {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ImageProvider(R.drawable.widget_gold_obsidian_bg))
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalAlignment = Alignment.Start
        ) {
            Text(
                text = "🕉️ दैनिक वैदिक पञ्चाङ्ग",
                style = TextStyle(color = ColorProvider(R.color.chiti_gold), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = GlanceModifier.height(4.dp))
            Text(
                text = "शुक्ल पक्ष एकादशी • अनुराधा नक्षत्र",
                style = TextStyle(color = ColorProvider(R.color.white), fontSize = 14.sp, fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = GlanceModifier.height(2.dp))
            Text(
                text = "अमृत चौघड़िया: ०९:१५ - १०:४५ • राहुकाल: ०१:३० सायं",
                style = TextStyle(color = ColorProvider(R.color.text_secondary), fontSize = 11.sp)
            )
        }
    }
}

class PanchangWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = PanchangWidget()
}
```

---

## 7. Background WorkManager Notification Engine (`:core:notifications`)

```kotlin
package tech.chiti.cosmictantra.core.notifications

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.*
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class DailyPanchangWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val notificationManager: PanchangNotificationManager
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        notificationManager.sendMorningPanchangNotification()
        return Result.success()
    }

    companion object {
        fun enqueueDailyNotification(workManager: WorkManager) {
            val periodicWork = PeriodicWorkRequestBuilder<DailyPanchangWorker>(24, TimeUnit.HOURS)
                .setInitialDelay(calculateDelayUntil0600(), TimeUnit.MILLISECONDS)
                .setConstraints(Constraints.Builder().setRequiresBatteryNotLow(true).build())
                .build()

            workManager.enqueueUniquePeriodicWork(
                "DailyPanchangWork",
                ExistingPeriodicWorkPolicy.KEEP,
                periodicWork
            )
        }
    }
}
```

---

## 8. Android Native Build Configuration (`build.gradle.kts`)

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "tech.chiti.cosmictantra"
    compileSdk = 35

    defaultConfig {
        applicationId = "tech.chiti.cosmictantra"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        ndk {
            abiFilters.addAll(listOf("arm64-v8a", "armeabi-v7a", "x86_64"))
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.material3)
    implementation(libs.compose.navigation)
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
    implementation(libs.sqlcipher)
    implementation(libs.glance.appwidget)
    implementation(libs.media3.exoplayer)
    implementation(libs.media3.session)
    implementation(libs.work.runtime.ktx)
}
```

---

## 9. Next Steps for Native Implementation

1. Initialize Android project via `android create` / Android Studio Hedgehog/Iguana with Compose template.
2. Compile Swiss Ephemeris (`sweph.c`, `swedate.c`, `swemep.c`) into static JNI `.so` libraries.
3. Configure GitHub Actions CI/CD to build signed Android App Bundles (`.aab`) for Google Play Internal Testing.
