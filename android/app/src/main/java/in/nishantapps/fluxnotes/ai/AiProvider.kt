package `in`.nishantapps.fluxnotes.ai

import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import `in`.nishantapps.fluxnotes.data.model.Note
import `in`.nishantapps.fluxnotes.data.model.SubTopic
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.UUID
import java.util.concurrent.TimeUnit

data class Outline(
    val topicName: String,
    val subTopics: List<String>
)

interface AiProvider {
    suspend fun generateOutline(prompt: String): Result<Outline>
    suspend fun generateNote(prompt: String, subTopics: List<String>): Result<Note>
}

class DirectGeminiAiProvider(private val apiKey: String) : AiProvider {

    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    override suspend fun generateOutline(prompt: String): Result<Outline> = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) return@withContext Result.failure(IllegalArgumentException("Gemini API key is missing."))

        try {
            val systemPrompt = "You are FluxNotes AI. Given a user topic or question, generate a clean structured JSON outline. Format strictly as JSON: {\"topicName\": \"...\", \"subTopics\": [\"Subtopic 1\", \"Subtopic 2\", \"Subtopic 3\"]}"
            val requestBodyJson = JsonObject().apply {
                val contents = JsonArray().apply {
                    add(JsonObject().apply {
                        val parts = JsonArray().apply {
                            add(JsonObject().apply { addProperty("text", "$systemPrompt\n\nUser Question: $prompt") })
                        }
                        add("parts", parts)
                    })
                }
                add("contents", contents)
            }

            val request = Request.Builder()
                .url("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey")
                .post(gson.toJson(requestBodyJson).toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("Gemini API error (${response.code})"))
                }
                val responseText = response.body?.string() ?: ""
                val responseJson = gson.fromJson(responseText, JsonObject::class.java)
                val candidates = responseJson.getAsJsonArray("candidates")
                val firstContent = candidates?.get(0)?.asJsonObject?.getAsJsonObject("content")
                val text = firstContent?.getAsJsonArray("parts")?.get(0)?.asJsonObject?.get("text")?.asString ?: ""

                val jsonMatch = Regex("""\{[\s\S]*\}""").find(text)?.value ?: text
                val parsed = gson.fromJson(jsonMatch, JsonObject::class.java)

                val topicName = parsed.get("topicName")?.asString ?: prompt
                val subTopicsArray = parsed.getAsJsonArray("subTopics")
                val subTopics = subTopicsArray?.map { it.asString } ?: listOf("Overview", "Key Concepts", "Summary")

                Result.success(Outline(topicName, subTopics))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun generateNote(prompt: String, subTopics: List<String>): Result<Note> = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) return@withContext Result.failure(IllegalArgumentException("Gemini API key is missing."))

        try {
            val topicId = UUID.randomUUID().toString()
            val subTopicObjects = subTopics.mapIndexed { idx, name ->
                SubTopic(names = listOf(name), pageNumber = (idx + 1).toString())
            }

            // Generate content explanation per page using Gemini
            val generatedPageVisuals = mutableListOf<String>()
            subTopics.forEachIndexed { index, subtopic ->
                val pagePrompt = "Explain $subtopic in the context of $prompt clearly and concisely for a visual study note."
                val pageReqJson = JsonObject().apply {
                    val contents = JsonArray().apply {
                        add(JsonObject().apply {
                            val parts = JsonArray().apply {
                                add(JsonObject().apply { addProperty("text", pagePrompt) })
                            }
                            add("parts", parts)
                        })
                    }
                    add("contents", contents)
                }

                val pageReq = Request.Builder()
                    .url("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey")
                    .post(gson.toJson(pageReqJson).toRequestBody("application/json".toMediaType()))
                    .build()

                client.newCall(pageReq).execute().use { res ->
                    if (res.isSuccessful) {
                        val bodyText = res.body?.string() ?: ""
                        val resJson = gson.fromJson(bodyText, JsonObject::class.java)
                        val text = resJson.getAsJsonArray("candidates")
                            ?.get(0)?.asJsonObject?.getAsJsonObject("content")
                            ?.getAsJsonArray("parts")?.get(0)?.asJsonObject?.get("text")?.asString ?: "Note page for $subtopic"
                        generatedPageVisuals.add(text)
                    } else {
                        generatedPageVisuals.add("Note page for $subtopic")
                    }
                }
            }

            Result.success(
                Note(
                    topicId = topicId,
                    topicName = prompt,
                    images = generatedPageVisuals,
                    subTopics = subTopicObjects,
                    timestamp = System.currentTimeMillis(),
                    pinned = false
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class DirectOpenAiAiProvider(private val apiKey: String) : AiProvider {

    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    override suspend fun generateOutline(prompt: String): Result<Outline> = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) return@withContext Result.failure(IllegalArgumentException("OpenAI API key is missing."))

        try {
            val systemPrompt = "You are FluxNotes AI. Given a user topic or question, generate a clean structured JSON outline. Format strictly as JSON: {\"topicName\": \"...\", \"subTopics\": [\"Subtopic 1\", \"Subtopic 2\", \"Subtopic 3\"]}"
            val reqJson = JsonObject().apply {
                addProperty("model", "gpt-4o-mini")
                val messages = JsonArray().apply {
                    add(JsonObject().apply {
                        addProperty("role", "system")
                        addProperty("content", systemPrompt)
                    })
                    add(JsonObject().apply {
                        addProperty("role", "user")
                        addProperty("content", prompt)
                    })
                }
                add("messages", messages)
            }

            val request = Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer $apiKey")
                .post(gson.toJson(reqJson).toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("OpenAI API error (${response.code})"))
                }
                val responseText = response.body?.string() ?: ""
                val responseJson = gson.fromJson(responseText, JsonObject::class.java)
                val choices = responseJson.getAsJsonArray("choices")
                val text = choices?.get(0)?.asJsonObject?.getAsJsonObject("message")?.get("content")?.asString ?: ""

                val jsonMatch = Regex("""\{[\s\S]*\}""").find(text)?.value ?: text
                val parsed = gson.fromJson(jsonMatch, JsonObject::class.java)

                val topicName = parsed.get("topicName")?.asString ?: prompt
                val subTopicsArray = parsed.getAsJsonArray("subTopics")
                val subTopics = subTopicsArray?.map { it.asString } ?: listOf("Overview", "Key Concepts", "Summary")

                Result.success(Outline(topicName, subTopics))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun generateNote(prompt: String, subTopics: List<String>): Result<Note> = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) return@withContext Result.failure(IllegalArgumentException("OpenAI API key is missing."))

        try {
            val topicId = UUID.randomUUID().toString()
            val subTopicObjects = subTopics.mapIndexed { idx, name ->
                SubTopic(names = listOf(name), pageNumber = (idx + 1).toString())
            }

            val pages = subTopics.map { "Visual note page explaining $it for $prompt" }

            Result.success(
                Note(
                    topicId = topicId,
                    topicName = prompt,
                    images = pages,
                    subTopics = subTopicObjects,
                    timestamp = System.currentTimeMillis(),
                    pinned = false
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
