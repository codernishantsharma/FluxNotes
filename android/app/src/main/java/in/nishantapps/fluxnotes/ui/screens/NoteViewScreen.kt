package `in`.nishantapps.fluxnotes.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import `in`.nishantapps.fluxnotes.data.local.db.FluxNotesDatabase
import `in`.nishantapps.fluxnotes.data.model.Note
import `in`.nishantapps.fluxnotes.export.NoteExportManager
import `in`.nishantapps.fluxnotes.ui.theme.BackgroundDark
import `in`.nishantapps.fluxnotes.ui.theme.CardBackground
import `in`.nishantapps.fluxnotes.ui.theme.PinnedAmber
import `in`.nishantapps.fluxnotes.ui.theme.TealAccent
import `in`.nishantapps.fluxnotes.ui.theme.TealText
import `in`.nishantapps.fluxnotes.ui.theme.TextPrimary
import `in`.nishantapps.fluxnotes.ui.theme.TextSecondary
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun NoteViewScreen(
    noteId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember { FluxNotesDatabase.getDatabase(context) }
    val exportManager = remember { NoteExportManager(context) }

    var note by remember { mutableStateOf<Note?>(null) }
    var zoomedImage by remember { mutableStateOf<String?>(null) }
    var exportStatusMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(noteId) {
        val entity = db.noteDao().getNoteById(noteId)
        note = entity?.toNote()
    }

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
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "FLUXNOTES",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TealAccent,
                    letterSpacing = 2.sp
                )
                Text(
                    text = note?.topicName ?: "Note viewer",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary,
                    maxLines = 1
                )
            }

            note?.let { currentNote ->
                IconButton(
                    onClick = {
                        scope.launch {
                            val pdfFile = exportManager.exportNoteToPdf(currentNote)
                            exportStatusMessage = if (pdfFile != null) "Saved PDF to Downloads" else "Export failed"
                        }
                    },
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White.copy(alpha = 0.05f))
                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                ) {
                    Icon(Icons.Default.Download, contentDescription = "Export PDF", tint = TealAccent)
                }
            }
        }

        exportStatusMessage?.let { msg ->
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(TealAccent.copy(alpha = 0.15f))
                    .padding(10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(text = msg, fontSize = 12.sp, color = TealText, fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        note?.let { currentNote ->
            val formattedDate = remember(currentNote.timestamp) {
                SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(Date(currentNote.timestamp))
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "${currentNote.images.size} PAGES",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TealAccent.copy(alpha = 0.8f),
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = currentNote.topicName,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                }
                if (currentNote.pinned) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(PinnedAmber.copy(alpha = 0.15f))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(text = "PINNED", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = PinnedAmber)
                    }
                }
            }

            Text(text = formattedDate, fontSize = 13.sp, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))

            Spacer(modifier = Modifier.height(20.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                itemsIndexed(currentNote.images) { index, imagePath ->
                    val imageModel = if (imagePath.startsWith("/")) File(imagePath) else imagePath
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(CardBackground)
                            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(20.dp))
                            .clickable { zoomedImage = imagePath }
                    ) {
                        AsyncImage(
                            model = imageModel,
                            contentDescription = "Page ${index + 1} of ${currentNote.topicName}",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }

    // Zoom Image Dialog
    zoomedImage?.let { imagePath ->
        val imageModel = if (imagePath.startsWith("/")) File(imagePath) else imagePath
        Dialog(
            onDismissRequest = { zoomedImage = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.95f))
                    .clickable { zoomedImage = null },
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = imageModel,
                    contentDescription = "Zoomed Page",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize()
                )
                IconButton(
                    onClick = { zoomedImage = null },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(24.dp)
                        .size(44.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White.copy(alpha = 0.15f))
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                }
            }
        }
    }
}
