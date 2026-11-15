package com.oldalexhub.thingstodo

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.ClipData
import android.content.ClipboardManager
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File
import java.util.UUID
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability
import com.google.android.play.core.install.model.InstallStatus

class ThingsToDoPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(ThingsToDoNative(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class ThingsToDoNative(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), ActivityEventListener, LifecycleEventListener {
  private var exportPromise: Promise? = null
  private var exportContent: String? = null
  private var exportImage: File? = null
  private val updateManager = AppUpdateManagerFactory.create(context)
  private var updateDialogShown = false
  init { context.addActivityEventListener(this); context.addLifecycleEventListener(this) }
  override fun getName() = "ThingsToDoNative"
  override fun getConstants(): MutableMap<String, Any> = mutableMapOf("API_BASE_URL" to BuildConfig.API_BASE_URL,"QA_BUILD" to BuildConfig.QA_BUILD,"VERSION_CODE" to BuildConfig.VERSION_CODE,"VERSION_NAME" to BuildConfig.VERSION_NAME)

  @ReactMethod fun checkForUpdate(immediate: Boolean, promise: Promise) {
    val activity = context.currentActivity ?: run { promise.reject("NO_ACTIVITY", "Open the app to check for an update."); return }
    updateManager.appUpdateInfo.addOnSuccessListener { info ->
      val type = if (immediate) AppUpdateType.IMMEDIATE else AppUpdateType.FLEXIBLE
      if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE && info.isUpdateTypeAllowed(type)) {
        try {
          val started = updateManager.startUpdateFlowForResult(info, activity, AppUpdateOptions.newBuilder(type).build(), 7802)
          if (!immediate) updateManager.registerListener { state -> if (state.installStatus() == InstallStatus.DOWNLOADED) showRestart() }
          promise.resolve(if (started) "started" else "unavailable")
        } catch (_: Exception) { promise.resolve("unavailable") }
      } else promise.resolve("unavailable")
    }.addOnFailureListener { promise.resolve("unavailable") }
  }
  private fun showRestart() {
    val activity = context.currentActivity ?: return
    activity.runOnUiThread { if (!updateDialogShown && !activity.isFinishing) {
      updateDialogShown = true
      AlertDialog.Builder(activity).setTitle("Update ready").setMessage("Restart Things to Do to finish installing the update.")
        .setPositiveButton("Restart") { _, _ -> updateDialogShown = false; updateManager.completeUpdate() }
        .setNegativeButton("Later") { _, _ -> updateDialogShown = false }.setOnCancelListener { updateDialogShown = false }.show()
    } }
  }
  override fun onHostResume() {
    updateManager.appUpdateInfo.addOnSuccessListener { info ->
      if (info.installStatus() == InstallStatus.DOWNLOADED) showRestart()
      if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
        context.currentActivity?.let { activity -> try { updateManager.startUpdateFlowForResult(info,activity,AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build(),7802) } catch (_: Exception) {} }
      }
    }
  }
  override fun onHostPause() {}
  override fun onHostDestroy() {}

  @ReactMethod fun exportFile(filename: String, content: String, promise: Promise) {
    if (exportPromise != null) { promise.reject("BUSY", "Finish the current export first."); return }
    val activity = context.currentActivity ?: run { promise.reject("NO_ACTIVITY", "Open the app to export."); return }
    exportPromise = promise; exportContent = content
    try { val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "application/json"; putExtra(Intent.EXTRA_TITLE, filename.replace(Regex("[^a-zA-Z0-9._-]"), "_")) }; activity.startActivityForResult(intent,7801) }
    catch (_: Exception) { exportPromise = null; exportContent = null; promise.reject("EXPORT_FAILED", "A document picker is not available.") }
  }
  private fun memoryFile(value: String): File {
    val uri = Uri.parse(value)
    require(uri.scheme == "file" || uri.scheme == null) { "Invalid image file" }
    val source = File(uri.path ?: value).canonicalFile
    val allowed = listOfNotNull(context.cacheDir,context.externalCacheDir).any { source.path.startsWith(it.canonicalPath + File.separator) }
    require(allowed && source.isFile && source.length() <= 20_000_000) { "Image is no longer available. Try again." }
    return source
  }
  @ReactMethod fun copyText(text: String, promise: Promise) {
    try {
      (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Memory caption",text))
      promise.resolve(null)
    } catch (_: Exception) { promise.reject("COPY_FAILED","Could not copy the caption.") }
  }
  @ReactMethod fun shareMemory(value: String, caption: String, promise: Promise) {
    val activity = context.currentActivity ?: run { promise.reject("NO_ACTIVITY","Open the app to share."); return }
    Thread {
      try {
        val folder = File(context.cacheDir,"memories").apply { mkdirs() }
        folder.listFiles()?.filter { it.lastModified() < System.currentTimeMillis()-86_400_000 }?.forEach { it.delete() }
        val file = File(folder,"things-to-do-${UUID.randomUUID()}.png")
        memoryFile(value).copyTo(file)
        val uri = FileProvider.getUriForFile(context,context.packageName+".memories",file)
        val intent = Intent(Intent.ACTION_SEND).apply {
          type="image/png"; putExtra(Intent.EXTRA_STREAM,uri); putExtra(Intent.EXTRA_TEXT,caption)
          putExtra(Intent.EXTRA_TITLE,"A Things to Do memory")
          clipData=ClipData.newUri(context.contentResolver,"Memory card",uri)
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        activity.runOnUiThread { try { activity.startActivity(Intent.createChooser(intent,"Share your memory")); promise.resolve(null) }
          catch (_: Exception) { promise.reject("SHARE_FAILED","No sharing app is available. Save the image instead.") } }
      } catch (e: Exception) { promise.reject("SHARE_FAILED",e.message) }
    }.start()
  }
  @ReactMethod fun saveMemoryImage(value: String, promise: Promise) {
    if(exportPromise != null) { promise.reject("BUSY","Finish the current export first."); return }
    val activity=context.currentActivity ?: run {promise.reject("NO_ACTIVITY","Open the app to save."); return}
    try {
      exportImage=memoryFile(value); exportPromise=promise
      activity.startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE); type="image/png"; putExtra(Intent.EXTRA_TITLE,"things-to-do-memory.png")
      },7801)
    } catch (_: Exception) {exportImage=null; exportPromise=null; promise.reject("EXPORT_FAILED","Could not open the image picker.")}
  }
  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != 7801) return
    val promise = exportPromise ?: return
    val content = exportContent ?: ""; val imageFile=exportImage; exportPromise = null; exportContent = null; exportImage=null
    if (resultCode != Activity.RESULT_OK || data?.data == null) { promise.reject("CANCELLED", "Export cancelled."); return }
    Thread { try { context.contentResolver.openOutputStream(data.data!!)?.use { output -> if(imageFile != null) imageFile.inputStream().use { it.copyTo(output) } else output.write(content.toByteArray(Charsets.UTF_8)) } ?: throw Exception(); promise.resolve("saved") } catch (_: Exception) { promise.reject("WRITE_FAILED", "Could not write the export file.") } }.start()
  }
  override fun onNewIntent(intent: Intent) {}

  @ReactMethod fun getLocation(promise: Promise) {
    if (ContextCompat.checkSelfPermission(context,Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) { promise.reject("PERMISSION", "Approximate location permission is required."); return }
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val handler = Handler(Looper.getMainLooper())
    handler.post {
      try {
        if (!manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) { promise.reject("DISABLED", "Enable location services or enter coordinates manually."); return@post }
        var completed = false
        lateinit var listener: LocationListener
        val timeout = Runnable { if (!completed) { completed = true; manager.removeUpdates(listener); promise.reject("TIMEOUT", "Could not obtain a location. Enter a starting point manually.") } }
        listener = object : LocationListener {
          override fun onLocationChanged(location: Location) { if (completed) return; completed = true; handler.removeCallbacks(timeout); manager.removeUpdates(this); promise.resolve(Arguments.createMap().apply { putDouble("latitude",location.latitude); putDouble("longitude",location.longitude) }) }
          override fun onProviderEnabled(provider: String) {}
          override fun onProviderDisabled(provider: String) {}
          @Deprecated("Deprecated") override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        }
        manager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER,listener,Looper.getMainLooper())
        handler.postDelayed(timeout,15000)
      } catch (_: Exception) { promise.reject("LOCATION_FAILED", "Could not get a location. Enter coordinates manually.") }
    }
  }
  override fun invalidate() { context.removeActivityEventListener(this); context.removeLifecycleEventListener(this); exportPromise?.reject("CLOSED", "Export interrupted."); exportPromise = null; exportContent = null; super.invalidate() }
}
