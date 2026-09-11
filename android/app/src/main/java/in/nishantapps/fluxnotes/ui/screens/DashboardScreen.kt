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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PinDrop
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import `in`.nishantapps.fluxnotes.data.local.db.FluxNotesDatabase
import `in`.nishantapps.fluxnotes.data.model.Note
import `in`.nishantapps.fluxnotes.ui.theme.BackgroundDark
import `in`.nishantapps.fluxnotes.ui.theme.CardBackground
import `in`.nishantapps.fluxnotes.ui.theme.ErrorRose
import `in`.nishantapps.fluxnotes.ui.theme.PinnedAmber
import `in`.nishantapps.fluxnotes.ui.theme.SurfaceDark
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
fun DashboardScreen(
    onOpenNote: (String) -> Unit,
    onCreateNote: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember { FluxNotesDatabase.getDatabase(context) }

    val cachedNoteEntities by db.noteDao().getAllNotesFlow().collectAsState(initial = emptyList())

    var searchQuery by remember { mutableStateOf("") }
    var activeTab by remember { mutableStateOf("all") }
    var renameNoteTarget by remember { mutableStateOf<Note?>(null) }
    var renameInputText by remember { mutableStateOf("") }

    val filteredNotes = cachedNoteEntities.map { it.toNote() }
        .filter { note ->
            if (activeTab == "pinned") note.pinned else true
        }
        .filter { note ->
            if (searchQuery.isBlank()) true
            else note.topicName.contains(searchQuery, ignoreCase = true)
        }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        // Top Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "FLUXNOTES",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TealAccent,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "Your study desk",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
            }
            IconButton(
                onClick = onOpenSettings,
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.05f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
            ) {
                Icon(Icons.Default.Settings, contentDescription = "Settings", tint = TextSecondary)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Hero Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(28.dp))
                .background(CardBackground)
                .border(1.dp, TealAccent.copy(alpha = 0.15f), RoundedCornerShape(28.dp))
                .padding(20.dp)
        ) {
            Column {
                Text(text = "A quieter way to learn", fontSize = 14.sp, color = TealText.copy(alpha = 0.8f))
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Turn one question into a visual note.",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary,
                    lineHeight = 28.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onCreateNote,
                    colors = ButtonDefaults.buttonColors(containerColor = TealAccent, contentColor = BackgroundDark),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "New note", fontWeight = FontWeight.SemiBold)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Section Title
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = "LIBRARY", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextSecondary, letterSpacing = 2.sp)
                Text(text = "Recent notes", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            }
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.06f))
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(text = "${cachedNoteEntities.size} total", fontSize = 12.sp, color = TextSecondary)
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search your notes", color = TextSecondary, fontSize = 14.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary) },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedContainerColor = Color.White.copy(alpha = 0.04f),
                focusedContainerColor = Color.White.copy(alpha = 0.06f),
                unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                focusedBorderColor = TealAccent,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
            )
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Filter Tabs
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(if (activeTab == "all") TealAccent else Color.White.copy(alpha = 0.06f))
                    .clickable { activeTab = "all" }
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "All notes",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (activeTab == "all") BackgroundDark else TextSecondary
                )
            }
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(if (activeTab == "pinned") TealAccent else Color.White.copy(alpha = 0.06f))
                    .clickable { activeTab = "pinned" }
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "Pinned",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (activeTab == "pinned") BackgroundDark else TextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Notes List
        if (filteredNotes.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 40.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White.copy(alpha = 0.02f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Book, contentDescription = null, tint = TealAccent, modifier = Modifier.size(36.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "Nothing here yet", fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Text(text = "Start a note and your library will appear here.", fontSize = 13.sp, color = TextSecondary)
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredNotes, key = { it.topicId }) { note ->
                    NoteCardItem(
                        note = note,
                        onOpen = { onOpenNote(note.topicId) },
                        onTogglePin = {
                            scope.launch {
                                db.noteDao().setNotePinned(note.topicId, !note.pinned)
                            }
                        },
                        onRename = {
                            renameNoteTarget = note
                            renameInputText = note.topicName
                        },
                        onDelete = {
                            scope.launch {
                                db.noteDao().deleteNoteById(note.topicId)
                            }
                        }
                    )
                }
            }
        }
    }

    // Rename Dialog
    renameNoteTarget?.let { targetNote ->
        AlertDialog(
            onDismissRequest = { renameNoteTarget = null },
            title = { Text("Rename Note", color = TextPrimary) },
            text = {
                OutlinedTextField(
                    value = renameInputText,
                    onValueChange = { renameInputText = it },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val newName = renameInputText.trim()
                        if (newName.isNotEmpty()) {
                            scope.launch {
                                db.noteDao().renameNote(targetNote.topicId, newName)
                            }
                        }
                        renameNoteTarget = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TealAccent, contentColor = BackgroundDark)
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { renameNoteTarget = null }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = SurfaceDark
        )
    }
}

@Composable
fun NoteCardItem(
    note: Note,
    onOpen: () -> Unit,
    onTogglePin: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }
    val formattedDate = remember(note.timestamp) {
        SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(Date(note.timestamp))
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(SurfaceDark)
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(24.dp))
            .clickable(onClick = onOpen)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(CardBackground),
            contentAlignment = Alignment.Center
        ) {
            val firstImage = note.images.firstOrNull()
            if (!firstImage.isNullOrEmpty()) {
                val imageModel = if (firstImage.startsWith("/")) File(firstImage) else firstImage
                AsyncImage(
                    model = imageModel,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Icon(Icons.Default.Book, contentDescription = null, tint = TealText.copy(alpha = 0.7f))
            }
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${note.subTopics.size.coerceAtLeast(1)} SUBTOPICS",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = TealAccent.copy(alpha = 0.8f),
                    letterSpacing = 1.sp
                )
                if (note.pinned) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(Icons.Default.PinDrop, contentDescription = "Pinned", tint = PinnedAmber, modifier = Modifier.size(12.dp))
                    Text(text = "Pinned", fontSize = 10.sp, color = PinnedAmber, modifier = Modifier.padding(start = 2.dp))
                }
            }
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = note.topicName,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                maxLines = 1
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = formattedDate,
                fontSize = 12.sp,
                color = TextSecondary
            )
        }

        Box {
            IconButton(onClick = { menuExpanded = true }) {
                Icon(Icons.Default.MoreVert, contentDescription = "Options", tint = TextSecondary)
            }
            DropdownMenu(
                expanded = menuExpanded,
                onDismissRequest = { menuExpanded = false },
                modifier = Modifier.background(SurfaceDark)
            ) {
                DropdownMenuItem(
                    text = { Text(if (note.pinned) "Unpin" else "Pin note", color = TextPrimary) },
                    onClick = {
                        menuExpanded = false
                        onTogglePin()
                    }
                )
                DropdownMenuItem(
                    text = { Text("Rename", color = TextPrimary) },
                    onClick = {
                        menuExpanded = false
                        onRename()
                    }
                )
                DropdownMenuItem(
                    text = { Text("Delete", color = ErrorRose) },
                    onClick = {
                        menuExpanded = false
                        onDelete()
                    }
                )
            }
        }
    }
}
