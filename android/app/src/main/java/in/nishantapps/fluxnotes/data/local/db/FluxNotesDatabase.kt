package `in`.nishantapps.fluxnotes.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(entities = [NoteEntity::class], version = 1, exportSchema = false)
@TypeConverters(Converters::class)
abstract class FluxNotesDatabase : RoomDatabase() {
    abstract fun noteDao(): NoteDao

    companion object {
        @Volatile
        private var INSTANCE: FluxNotesDatabase? = null

        fun getDatabase(context: Context): FluxNotesDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FluxNotesDatabase::class.java,
                    "fluxnotes_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
