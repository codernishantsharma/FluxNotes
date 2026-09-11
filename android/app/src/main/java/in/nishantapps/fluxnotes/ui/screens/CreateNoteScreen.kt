package `in`.nishantapps.fluxnotes.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.nishantapps.fluxnotes.ai.DirectGeminiAiProvider
import `in`.nishantapps.fluxnotes.data.local.UserPreferencesRepository
import `in`.nishantapps.fluxnotes.data.local.db.FluxNotesDatabase
import `in`.nishantapps.fluxnotes.data.local.db.NoteEntity
import `in`.nishantapps.fluxnotes.ui.theme.BackgroundDark
import `in`.nishantapps.fluxnotes.ui.theme.ErrorRose
import `in`.nishantapps.fluxnotes.ui.theme.SurfaceDark
import `in`.nishantapps.fluxnotes.ui.theme.TealAccent
import `in`.nishantapps.fluxnotes.ui.theme.TealText
import `in`.nishantapps.fluxnotes.ui.theme.TextPrimary
import `in`.nishantapps.fluxnotes.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@Composable
fun CreateNoteScreen(
    onBack: () -> Unit,
    onNoteCreated: (String) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember { FluxNotesDatabase.getDatabase(context) }
    val userPrefsRepo = remember { UserPreferencesRepository(context) }

    val userPrefs by userPrefsRepo.userPreferencesFlow.collectAsState(initial = null)

    var promptText by remember { mutableStateOf("") }
    var isGenerating by remember { mutableStateOf(false) }
    var generationStatus by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.05f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextSecondary)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(
                    text = "FLUXNOTES",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TealAccent,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "Create new note",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        Text(
            text = "WHAT WOULD YOU LIKE TO LEARN?",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = TextSecondary,
            letterSpacing = 1.5.sp
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = promptText,
            onValueChange = { promptText = it },
            placeholder = { Text("e.g. How does quantum computing work?", color = TextSecondary, fontSize = 14.sp) },
            enabled = !isGenerating,
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp),
            shape = RoundedCornerShape(20.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedContainerColor = SurfaceDark,
                focusedContainerColor = SurfaceDark,
                unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                focusedBorderColor = TealAccent,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
            )
        )

        Spacer(modifier = Modifier.height(20.dp))

        if (isGenerating) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(SurfaceDark)
                    .border(1.dp, TealAccent.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = TealAccent, strokeWidth = 3.dp, modifier = Modifier.size(36.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = generationStatus, fontSize = 14.sp, color = TealText, fontWeight = FontWeight.Medium)
                }
            }
        } else {
            Button(
                onClick = {
                    val prompt = promptText.trim()
                    if (prompt.isEmpty()) return@Button

                    val prefs = userPrefs
                    if (prefs == null || prefs.geminiApiKey.isEmpty()) {
                        errorMessage = "Configure Gemini API key in Settings first."
                        return@Button
                    }

                    isGenerating = true
                    errorMessage = null
                    generationStatus = "Generating outline via Gemini..."

                    scope.launch {
                        try {
                            val provider = DirectGeminiAiProvider(prefs.geminiApiKey)
                            val outlineResult = provider.generateOutline(prompt)
                            val outline = outlineResult.getOrThrow()

                            generationStatus = "Generating note..."
                            val noteResult = provider.generateNote(outline.topicName, outline.subTopics)
                            val note = noteResult.getOrThrow()

                            db.noteDao().insertNote(NoteEntity.fromNote(note))

                            isGenerating = false
                            onNoteCreated(note.topicId)
                        } catch (e: Exception) {
                            isGenerating = false
                            errorMessage = e.message ?: "Note generation failed."
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TealAccent, contentColor = BackgroundDark)
            ) {
                Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "Generate Note", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        errorMessage?.let { err ->
            Spacer(modifier = Modifier.height(16.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(ErrorRose.copy(alpha = 0.1f))
                    .border(1.dp, ErrorRose.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Text(text = err, fontSize = 13.sp, color = ErrorRose)
            }
        }
    }
}
