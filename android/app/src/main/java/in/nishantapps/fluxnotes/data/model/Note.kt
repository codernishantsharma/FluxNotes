package `in`.nishantapps.fluxnotes.data.model

data class SubTopic(
    val names: List<String> = emptyList(),
    val pageNumber: String = ""
)

data class Note(
    val topicId: String,
    val topicName: String,
    val images: List<String> = emptyList(),
    val subTopics: List<SubTopic> = emptyList(),
    val timestamp: Long = System.currentTimeMillis(),
    val pinned: Boolean = false
)
