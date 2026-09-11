package `in`.nishantapps.fluxnotes.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

data class UserPreferences(
    val geminiApiKey: String = "",
    val openAiApiKey: String = "",
    val selectedProvider: String = "gemini", // "gemini" or "openai"
    val deviceId: String = ""
)

class UserPreferencesRepository(private val context: Context) {

    companion object {
        private val GEMINI_API_KEY = stringPreferencesKey("gemini_api_key")
        private val OPENAI_API_KEY = stringPreferencesKey("openai_api_key")
        private val SELECTED_PROVIDER = stringPreferencesKey("selected_provider")
        private val DEVICE_ID = stringPreferencesKey("device_id")
    }

    val userPreferencesFlow: Flow<UserPreferences> = context.dataStore.data.map { preferences ->
        UserPreferences(
            geminiApiKey = preferences[GEMINI_API_KEY] ?: "",
            openAiApiKey = preferences[OPENAI_API_KEY] ?: "",
            selectedProvider = preferences[SELECTED_PROVIDER] ?: "gemini",
            deviceId = preferences[DEVICE_ID] ?: ""
        )
    }

    suspend fun updateAiConfig(geminiKey: String, openAiKey: String, provider: String) {
        context.dataStore.edit { preferences ->
            preferences[GEMINI_API_KEY] = geminiKey.trim()
            preferences[OPENAI_API_KEY] = openAiKey.trim()
            preferences[SELECTED_PROVIDER] = provider.trim().lowercase()
        }
    }

    suspend fun updateDeviceId(deviceId: String) {
        context.dataStore.edit { preferences ->
            preferences[DEVICE_ID] = deviceId
        }
    }
}
