package `in`.nishantapps.fluxnotes

import com.google.gson.Gson
import com.google.gson.JsonObject
import `in`.nishantapps.fluxnotes.data.local.db.NoteEntity
import `in`.nishantapps.fluxnotes.data.model.Note
import `in`.nishantapps.fluxnotes.data.model.SubTopic
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class FluxNotesNativeTest {

    private val gson = Gson()

    @Test
    fun testGeminiOutlineJsonParsing() {
        val geminiResponseText = """
            {
              "candidates": [
                {
                  "content": {
                    "parts": [
                      {
                        "text": "{\"topicName\": \"Quantum Computing\", \"subTopics\": [\"Qubits\", \"Superposition\", \"Entanglement\"]}"
                      }
                    ]
                  }
                }
              ]
            }
        """.trimIndent()

        val responseJson = gson.fromJson(geminiResponseText, JsonObject::class.java)
        val candidates = responseJson.getAsJsonArray("candidates")
        val firstContent = candidates[0].asJsonObject.getAsJsonObject("content")
        val text = firstContent.getAsJsonArray("parts")[0].asJsonObject.get("text").asString

        val parsed = gson.fromJson(text, JsonObject::class.java)
        val topicName = parsed.get("topicName").asString
        val subTopics = parsed.getAsJsonArray("subTopics").map { it.asString }

        assertEquals("Quantum Computing", topicName)
        assertEquals(3, subTopics.size)
        assertEquals("Qubits", subTopics[0])
    }

    @Test
    fun testNoteModelToEntityConversion() {
        val note = Note(
            topicId = "test_1",
            topicName = "Quantum Physics",
            images = listOf("/data/images/img1.png", "/data/images/img2.png"),
            subTopics = listOf(SubTopic(names = listOf("Particles", "Waves"), pageNumber = "1")),
            timestamp = 1700000000000L,
            pinned = true
        )

        val entity = NoteEntity.fromNote(note)
        assertEquals("test_1", entity.topicId)
        assertEquals("Quantum Physics", entity.topicName)
        assertEquals(2, entity.images.size)
        assertTrue(entity.pinned)

        val convertedNote = entity.toNote()
        assertEquals(note.topicId, convertedNote.topicId)
        assertEquals(note.topicName, convertedNote.topicName)
        assertEquals(note.images, convertedNote.images)
        assertEquals(note.pinned, convertedNote.pinned)
    }
}
