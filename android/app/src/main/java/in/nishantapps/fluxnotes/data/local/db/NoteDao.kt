package `in`.nishantapps.fluxnotes.data.local.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface NoteDao {
    @Query("SELECT * FROM notes ORDER BY pinned DESC, timestamp DESC")
    fun getAllNotesFlow(): Flow<List<NoteEntity>>

    @Query("SELECT * FROM notes ORDER BY pinned DESC, timestamp DESC")
    suspend fun getAllNotes(): List<NoteEntity>

    @Query("SELECT * FROM notes WHERE topicId = :topicId LIMIT 1")
    suspend fun getNoteById(topicId: String): NoteEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotes(notes: List<NoteEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: NoteEntity)

    @Query("DELETE FROM notes WHERE topicId = :topicId")
    suspend fun deleteNoteById(topicId: String)

    @Query("DELETE FROM notes")
    suspend fun clearAllNotes()

    @Query("UPDATE notes SET pinned = :pinned WHERE topicId = :topicId")
    suspend fun setNotePinned(topicId: String, pinned: Boolean)

    @Query("UPDATE notes SET topicName = :topicName WHERE topicId = :topicId")
    suspend fun renameNote(topicId: String, topicName: String)
}
