package com.compassmobile

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class NativeMagnetometerModule(reactContext: ReactApplicationContext) :
    NativeMagnetometerSpec(reactContext), SensorEventListener {

    private val sensorManager: SensorManager =
        reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    private var accelerometer: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private var magnetometer: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)

    private var gravity = FloatArray(3)
    private var geomagnetic = FloatArray(3)
    private val rotationMatrix = FloatArray(9)
    private val inclinationMatrix = FloatArray(9)
    private val orientation = FloatArray(3)
    private var hasGravity = false
    private var hasGeomagnetic = false

    override fun getName(): String = "NativeMagnetometer"

    override fun startUpdating() {
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
        magnetometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
    }

    override fun stopUpdating() {
        sensorManager.unregisterListener(this)
        hasGravity = false
        hasGeomagnetic = false
    }

    override fun addListener(eventName: String?) {}
    override fun removeListeners(count: Double) {}

    override fun onSensorChanged(event: SensorEvent?) {
        event ?: return

        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            System.arraycopy(event.values, 0, gravity, 0, 3)
            hasGravity = true
        } else if (event.sensor.type == Sensor.TYPE_MAGNETIC_FIELD) {
            System.arraycopy(event.values, 0, geomagnetic, 0, 3)
            hasGeomagnetic = true
        }

        if (hasGravity && hasGeomagnetic) {
            if (SensorManager.getRotationMatrix(
                    rotationMatrix, inclinationMatrix, gravity, geomagnetic)) {
                SensorManager.getOrientation(rotationMatrix, orientation)

                // orientation[0] is azimuth in radians [-PI, PI]
                var azimuthInDegrees = Math.toDegrees(orientation[0].toDouble()).toFloat()
                // Convert range to 0° - 360°
                if (azimuthInDegrees < 0) {
                    azimuthInDegrees += 360f
                }

                val params = Arguments.createMap().apply {
                    putDouble("x", geomagnetic[0].toDouble())
                    putDouble("y", geomagnetic[1].toDouble())
                    putDouble("z", geomagnetic[2].toDouble())
                    putDouble("azimuth", azimuthInDegrees.toDouble())
                }

                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onMagnetometerData", params)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    override fun invalidate() {
        sensorManager.unregisterListener(this)
        hasGravity = false
        hasGeomagnetic = false
        super.invalidate()
    }
}