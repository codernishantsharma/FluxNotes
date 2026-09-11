package `in`.nishantapps.fluxnotes.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import `in`.nishantapps.fluxnotes.ui.screens.CreateNoteScreen
import `in`.nishantapps.fluxnotes.ui.screens.DashboardScreen
import `in`.nishantapps.fluxnotes.ui.screens.NoteViewScreen
import `in`.nishantapps.fluxnotes.ui.screens.QrScannerScreen
import `in`.nishantapps.fluxnotes.ui.screens.SettingsScreen
import `in`.nishantapps.fluxnotes.ui.theme.BackgroundDark
import `in`.nishantapps.fluxnotes.ui.theme.BorderDark
import `in`.nishantapps.fluxnotes.ui.theme.SurfaceDark
import `in`.nishantapps.fluxnotes.ui.theme.TealAccent
import `in`.nishantapps.fluxnotes.ui.theme.TextSecondary

sealed class Screen(val route: String, val title: String) {
    object Dashboard : Screen("dashboard", "Home")
    object CreateNote : Screen("create_note", "Create")
    object Settings : Screen("settings", "Settings")
    object NoteView : Screen("note_view/{noteId}", "Note") {
        fun createRoute(noteId: String) = "note_view/$noteId"
    }
    object QrScanner : Screen("qr_scanner", "QR Scanner")
}

@Composable
fun FluxNotesMainApp(navController: NavHostController = rememberNavController()) {
    val configuration = LocalConfiguration.current
    val isTabletOrLandscape = configuration.screenWidthDp >= 600

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    if (isTabletOrLandscape) {
        Row(modifier = Modifier.fillMaxSize().background(BackgroundDark)) {
            NavigationRail(
                containerColor = SurfaceDark,
                contentColor = TextSecondary,
                header = {
                    FloatingActionButton(
                        onClick = { navController.navigate(Screen.CreateNote.route) },
                        containerColor = TealAccent,
                        contentColor = BackgroundDark,
                        modifier = Modifier.padding(vertical = 12.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Create Note")
                    }
                }
            ) {
                NavigationRailItem(
                    selected = currentRoute == Screen.Dashboard.route,
                    onClick = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home") },
                    colors = NavigationRailItemDefaults.colors(
                        selectedIconColor = TealAccent,
                        selectedTextColor = TealAccent,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    )
                )
                NavigationRailItem(
                    selected = currentRoute == Screen.Settings.route,
                    onClick = {
                        navController.navigate(Screen.Settings.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") },
                    colors = NavigationRailItemDefaults.colors(
                        selectedIconColor = TealAccent,
                        selectedTextColor = TealAccent,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    )
                )
            }
            Box(modifier = Modifier.weight(1f)) {
                AppNavHost(navController = navController)
            }
        }
    } else {
        Scaffold(
            containerColor = BackgroundDark,
            bottomBar = {
                if (currentRoute in listOf(Screen.Dashboard.route, Screen.Settings.route)) {
                    NavigationBar(
                        containerColor = BackgroundDark,
                        contentColor = TextSecondary,
                        tonalElevation = 8.dp
                    ) {
                        NavigationBarItem(
                            selected = currentRoute == Screen.Dashboard.route,
                            onClick = {
                                navController.navigate(Screen.Dashboard.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                            label = { Text("Home") },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = TealAccent,
                                selectedTextColor = TealAccent,
                                unselectedIconColor = TextSecondary,
                                unselectedTextColor = TextSecondary,
                                indicatorColor = SurfaceDark
                            )
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.CreateNote.route,
                            onClick = { navController.navigate(Screen.CreateNote.route) },
                            icon = { Icon(Icons.Default.Add, contentDescription = "Create") },
                            label = { Text("Create") },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = TealAccent,
                                selectedTextColor = TealAccent,
                                unselectedIconColor = TextSecondary,
                                unselectedTextColor = TextSecondary,
                                indicatorColor = SurfaceDark
                            )
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Settings.route,
                            onClick = {
                                navController.navigate(Screen.Settings.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                            label = { Text("Settings") },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = TealAccent,
                                selectedTextColor = TealAccent,
                                unselectedIconColor = TextSecondary,
                                unselectedTextColor = TextSecondary,
                                indicatorColor = SurfaceDark
                            )
                        )
                    }
                }
            }
        ) { paddingValues ->
            Box(modifier = Modifier.padding(paddingValues)) {
                AppNavHost(navController = navController)
            }
        }
    }
}

@Composable
fun AppNavHost(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Dashboard.route
    ) {
        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onOpenNote = { noteId -> navController.navigate(Screen.NoteView.createRoute(noteId)) },
                onCreateNote = { navController.navigate(Screen.CreateNote.route) },
                onOpenSettings = { navController.navigate(Screen.Settings.route) }
            )
        }
        composable(Screen.CreateNote.route) {
            CreateNoteScreen(
                onBack = { navController.popBackStack() },
                onNoteCreated = { noteId ->
                    navController.popBackStack()
                    navController.navigate(Screen.NoteView.createRoute(noteId))
                }
            )
        }
        composable(
            route = Screen.NoteView.route,
            arguments = listOf(navArgument("noteId") { type = NavType.StringType })
        ) { backStackEntry ->
            val noteId = backStackEntry.arguments?.getString("noteId") ?: ""
            NoteViewScreen(
                noteId = noteId,
                onBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Settings.route) {
            SettingsScreen(
                onBack = { navController.popBackStack() },
                onOpenQrScanner = { navController.navigate(Screen.QrScanner.route) }
            )
        }
        composable(Screen.QrScanner.route) {
            QrScannerScreen(
                onBack = { navController.popBackStack() },
                onScanned = { navController.popBackStack() }
            )
        }
    }
}
