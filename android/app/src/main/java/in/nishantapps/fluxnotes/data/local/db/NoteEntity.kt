package `in`.nishantapps.fluxnotes.data.local.db

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import `in`.nishantapps.fluxnotes.data.model.Note
import `in`.nishantapps.fluxnotes.data.model.SubTopic

@Entity(tableName = "notes")
@TypeConverters(Converters::class)
data class NoteEntity(
    @PrimaryKey val topicId: String,
    val topicName: String,
    val images: List<String>,
    val subTopics: List<SubTopic>,
    val timestamp: Long,
    val pinned: Boolean
) {
    fun toNote(): Note = Note(
        topicId = topicId,
        topicName = topicName,
        images = images,
        subTopics = subTopics,
        timestamp = timestamp,
        pinned = pinned
    )

    companion object {
        fun fromNote(note: Note): NoteEntity = NoteEntity(
            topicId = note.topicId,
            topicName = note.topicName,
            images = note.images,
            subTopics = note.subTopics,
            timestamp = note.timestamp,
            pinned = note.pinned
        )
    }
}

class Converters {
    private val gson = Gson()

    @TypeConverter
    fun fromStringList(value: List<String>?): String {
        return gson.toJson(value ?: emptyList<String>())
    }

    @TypeConverter
    fun toStringList(value: String?): List<String> {
        if (value.isNullOrEmpty()) return emptyList()
        val type = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(value, type) ?: emptyList()
    }

    @TypeConverter
    fun fromSubTopicList(value: List<SubTopic>?): String {
        return gson.toJson(value ?: emptyList<SubTopic>())
    }

    @TypeConverter
    fun toSubTopicList(value: String?): List<SubTopic> {
        if (value.isNullOrEmpty()) return emptyList()
        val type = object : TypeToken<List<SubTopic>>() {}.type
        return gson.fromJson(value, type) ?: emptyList()
    }
}
