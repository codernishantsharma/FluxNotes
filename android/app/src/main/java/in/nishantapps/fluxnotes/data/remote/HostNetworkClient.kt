package `in`.nishantapps.fluxnotes.data.remote

import android.content.Context
import android.os.Build
import com.google.gson.Gson
import com.google.gson.JsonObject
import `in`.nishantapps.fluxnotes.data.model.Note
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

data class HostLogs(
    val requestLog: List<Any> = emptyList(),
    val responseLog: List<Any> = emptyList()
)

class HostNetworkClient(private val context: Context) {

    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val _connectionState = MutableStateFlow("Disconnected")
    val connectionState: StateFlow<String> = _connectionState.asStateFlow()

    fun toWebSocketUrl(rawUrl: String): String {
        val trimmed = rawUrl.trim().removeSuffix("/")
        if (trimmed.isEmpty()) return ""
        if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
            return when {
                trimmed.endsWith("/ws/api") -> trimmed
                trimmed.endsWith("/ws") -> "$trimmed/api"
                else -> "$trimmed/ws/api"
            }
        }
        val prefix = if (trimmed.startsWith("https://")) "wss://" else "ws://"
        val cleanHost = trimmed.removePrefix("http://").removePrefix("https://")
        return "$prefix$cleanHost/ws/api"
    }

    fun toHttpApiUrl(rawHostUrl: String, resourcePath: String): String {
        val trimmedHost = rawHostUrl.trim().removeSuffix("/")
        val httpPrefix = if (trimmedHost.startsWith("wss://") || trimmedHost.startsWith("https://")) "https://" else "http://"
        val cleanHost = trimmedHost.removePrefix("ws://").removePrefix("wss://")
            .removePrefix("http://").removePrefix("https://")
            .removeSuffix("/ws/api").removeSuffix("/ws").removeSuffix("/api")

        val path = if (resourcePath.startsWith("/")) resourcePath else "/$resourcePath"
        val apiPath = if (path.startsWith("/api/")) path else "/api$path"
        return "$httpPrefix$cleanHost$apiPath"
    }

    suspend fun sendCommand(
        hostUrl: String,
        authToken: String,
        commandType: String,
        extraParams: Map<String, Any> = emptyMap()
    ): JsonObject = withContext(Dispatchers.IO) {
        val wsUrl = toWebSocketUrl(hostUrl)
        if (wsUrl.isEmpty() || authToken.isEmpty()) {
            throw IllegalArgumentException("Host URL or Auth Token is not configured.")
        }

        _connectionState.value = "Connecting"

        suspendCoroutine { continuation ->
            val request = Request.Builder().url(wsUrl).build()
            var isContinuationResponded = false

            client.newWebSocket(request, object : WebSocketListener() {
                private var sessionId: String? = null
                private var token: String? = null

                override fun onOpen(webSocket: WebSocket, response: Response) {
                    val authPayload = mapOf(
                        "type" to "auth",
                        "authToken" to authToken,
                        "deviceInfo" to mapOf(
                            "deviceId" to getDeviceId(),
                            "deviceName" to "${Build.MANUFACTURER} ${Build.MODEL}",
                            "platform" to "android",
                            "model" to Build.MODEL,
                            "osVersion" to Build.VERSION.RELEASE,
                            "appVersion" to "0.2.9",
                            "clientType" to "fluxnotes-android"
                        )
                    )
                    webSocket.send(gson.toJson(authPayload))
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                    try {
                        val json = gson.fromJson(text, JsonObject::class.java)
                        val type = json.get("type")?.asString

                        if (type == "authenticated") {
                            sessionId = json.get("sessionId")?.asString
                            token = json.get("token")?.asString

                            _connectionState.value = "Connected"

                            val payload = mutableMapOf<String, Any>(
                                "type" to commandType
                            )
                            sessionId?.let { payload["sessionId"] = it }
                            token?.let { payload["token"] = it }
                            payload.putAll(extraParams)

                            webSocket.send(gson.toJson(payload))
                        } else if (type == "notes" || type == "logs" || type == "command_result" || type == "mobile_info") {
                            if (!isContinuationResponded) {
                                isContinuationResponded = true
                                webSocket.close(1000, "Done")
                                continuation.resume(json)
                            }
                        } else if (type == "error" || type == "command_error") {
                            val msg = json.get("message")?.asString ?: "Host command failed."
                            if (!isContinuationResponded) {
                                isContinuationResponded = true
                                _connectionState.value = "Error: $msg"
                                webSocket.close(1000, "Error")
                                continuation.resumeWithException(Exception(msg))
                            }
                        }
                    } catch (e: Exception) {
                        if (!isContinuationResponded) {
                            isContinuationResponded = true
                            _connectionState.value = "Error: ${e.message}"
                            webSocket.close(1000, "Parse Error")
                            continuation.resumeWithException(e)
                        }
                    }
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                    if (!isContinuationResponded) {
                        isContinuationResponded = true
                        val errorMsg = t.message ?: "Unable to reach the host."
                        _connectionState.value = "Host unavailable"
                        continuation.resumeWithException(Exception(errorMsg))
                    }
                }
            })
        }
    }

    suspend fun listNotes(hostUrl: String, authToken: String): List<Note> = withContext(Dispatchers.IO) {
        val json = sendCommand(hostUrl, authToken, "list_notes")
        val notesArray = json.getAsJsonArray("notes") ?: return@withContext emptyList()
        val notes = mutableListOf<Note>()
        for (element in notesArray) {
            val noteObj = element.asJsonObject
            val topicId = noteObj.get("topicId")?.asString ?: continue
            val topicName = noteObj.get("topicName")?.asString ?: "Untitled Topic"
            val images = noteObj.getAsJsonArray("images")?.map { it.asString } ?: emptyList()
            val timestamp = noteObj.get("timestamp")?.asLong ?: System.currentTimeMillis()
            val pinned = noteObj.get("pinned")?.asBoolean ?: false

            notes.add(Note(topicId, topicName, images, emptyList(), timestamp, pinned))
        }
        notes
    }

    suspend fun downloadNoteImages(hostUrl: String, images: List<String>, topicId: String): List<String> = withContext(Dispatchers.IO) {
        if (images.isEmpty()) return@withContext emptyList()
        val imagesDir = File(context.filesDir, "images").apply { if (!exists()) mkdirs() }
        val localPaths = mutableListOf<String>()

        images.forEachIndexed { index, imagePath ->
            if (imagePath.startsWith("file://") || imagePath.startsWith("/data/")) {
                localPaths.add(imagePath)
                return@forEachIndexed
            }

            try {
                val fullUrl = if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
                    imagePath
                } else {
                    toHttpApiUrl(hostUrl, imagePath)
                }

                val safeTopic = topicId.replace(Regex("[^a-zA-Z0-9_-]"), "_").take(32)
                val ext = if (fullUrl.contains(".jpg") || fullUrl.contains(".jpeg")) "jpg" else "png"
                val localFile = File(imagesDir, "${safeTopic}_$index.$ext")

                if (localFile.exists() && localFile.length() > 0) {
                    localPaths.add(localFile.absolutePath)
                } else {
                    val request = Request.Builder().url(fullUrl).build()
                    client.newCall(request).execute().use { response ->
                        if (response.isSuccessful) {
                            response.body?.bytes()?.let { bytes ->
                                FileOutputStream(localFile).use { fos -> fos.write(bytes) }
                                localPaths.add(localFile.absolutePath)
                            } ?: localPaths.add(imagePath)
                        } else {
                            localPaths.add(imagePath)
                        }
                    }
                }
            } catch (e: Exception) {
                localPaths.add(imagePath)
            }
        }
        localPaths
    }

    private fun getDeviceId(): String {
        val prefs = context.getSharedPreferences("fluxnotes_device", Context.MODE_PRIVATE)
        var id = prefs.getString("device_id", null)
        if (id == null) {
            id = UUID.randomUUID().toString()
            prefs.edit().putString("device_id", id).apply()
        }
        return id
    }
}
