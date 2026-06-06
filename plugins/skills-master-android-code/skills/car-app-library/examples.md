## Minimal CarAppService with session and root screen

A complete entry point: service declaration wiring, a `Session`, and a `PlaceListScreen` that loads data asynchronously and invalidates when results arrive.

```kotlin
// AndroidManifest.xml (excerpt)
// <service
//     android:name=".car.MyCarAppService"
//     android:exported="true">
//   <intent-filter>
//     <action android:name="androidx.car.app.CarAppService" />
//     <category android:name="androidx.car.app.category.POI" />
//   </intent-filter>
//   <meta-data android:name="androidx.car.app.minCarApiLevel" android:value="4" />
// </service>

class MyCarAppService : CarAppService() {
    override fun createHostValidator(): HostValidator =
        HostValidator.Builder(applicationContext)
            .addAllowedHosts(R.array.allowed_car_hosts)
            .build()

    override fun onCreateSession(): Session = MySession()
}

class MySession : Session() {
    override fun onCreateScreen(intent: Intent): Screen =
        PlaceListScreen(carContext)
}

data class Place(val id: String, val name: String, val distanceText: String)

class PlaceListScreen(carContext: CarContext) : Screen(carContext) {
    private var places: List<Place> = emptyList()
    private var isLoading = true

    init {
        lifecycleScope.launch {
            PlaceRepository.nearbyFlow().collect { result ->
                places = result
                isLoading = false
                invalidate()
            }
        }
    }

    override fun onGetTemplate(): Template {
        if (isLoading) {
            return MessageTemplate.Builder(carContext.getString(R.string.loading))
                .setHeaderAction(Action.APP_ICON)
                .setLoading(true)
                .build()
        }

        val listBuilder = ItemList.Builder()
        if (places.isEmpty()) {
            listBuilder.setNoItemsMessage(carContext.getString(R.string.no_places_found))
        } else {
            places.take(6).forEach { place ->
                listBuilder.addItem(
                    Row.Builder()
                        .setTitle(place.name)
                        .addText(place.distanceText)
                        .setOnClickListener {
                            screenManager.push(PlaceDetailScreen(carContext, place))
                        }
                        .build()
                )
            }
        }

        return ListTemplate.Builder()
            .setTitle(carContext.getString(R.string.nearby_places))
            .setSingleList(listBuilder.build())
            .setHeaderAction(Action.APP_ICON)
            .build()
    }
}
```

---

## PaneTemplate detail screen with parked-only action

A detail screen for a selected place. The "Navigate" action is available while driving; "Call" is restricted to parked mode via `ParkedOnlyOnClickListener`.

```kotlin
class PlaceDetailScreen(
    carContext: CarContext,
    private val place: Place
) : Screen(carContext) {

    override fun onGetTemplate(): Template {
        val navigateAction = Action.Builder()
            .setTitle(carContext.getString(R.string.navigate))
            .setIcon(
                CarIcon.Builder(
                    IconCompat.createWithResource(carContext, R.drawable.ic_directions)
                ).build()
            )
            .setOnClickListener {
                // Deep-link into a navigation app
                carContext.startCarApp(
                    Intent(CarContext.ACTION_NAVIGATE).setData(
                        Uri.parse("geo:0,0?q=${Uri.encode(place.name)}")
                    )
                )
            }
            .build()

        val callAction = Action.Builder()
            .setTitle(carContext.getString(R.string.call))
            .setIcon(
                CarIcon.Builder(
                    IconCompat.createWithResource(carContext, R.drawable.ic_call)
                ).build()
            )
            // Disabled while driving — shown greyed out on-screen
            .setOnClickListener(ParkedOnlyOnClickListener.create {
                carContext.startCarApp(
                    Intent(Intent.ACTION_DIAL).setData(Uri.parse("tel:${place.phoneNumber}"))
                )
            })
            .build()

        val pane = Pane.Builder()
            .addRow(
                Row.Builder()
                    .setTitle(place.name)
                    .addText(place.address)
                    .addText(place.distanceText)
                    .build()
            )
            .addRow(
                Row.Builder()
                    .setTitle(carContext.getString(R.string.hours))
                    .addText(place.hoursText)
                    .build()
            )
            .addAction(navigateAction)
            .addAction(callAction)
            .build()

        return PaneTemplate.Builder(pane)
            .setTitle(place.name)
            .setHeaderAction(Action.BACK)
            .build()
    }
}
```

---

## NavigationTemplate with live routing card

A navigation screen that updates the routing card as the user progresses along a route. Uses `invalidate()` driven by a `StateFlow` from the navigation engine.

```kotlin
data class RouteStep(
    val maneuver: Maneuver,
    val distanceToStep: Distance,
    val road: String
)

class ActiveNavigationScreen(carContext: CarContext) : Screen(carContext) {
    private var currentStep: RouteStep? = null
    private var destinationDistance: Distance =
        Distance.create(0.0, Distance.UNIT_KILOMETERS)

    init {
        lifecycleScope.launch {
            NavigationEngine.routeUpdates().collect { update ->
                currentStep = update.nextStep
                destinationDistance = update.remainingDistance
                invalidate()
            }
        }
    }

    override fun onGetTemplate(): Template {
        val step = currentStep
        val navigationInfo = if (step != null) {
            RoutingInfo.Builder()
                .setCurrentStep(
                    Step.Builder(step.road)
                        .setManeuver(step.maneuver)
                        .setRoad(step.road)
                        .build(),
                    step.distanceToStep
                )
                .build()
        } else {
            RoutingInfo.Builder().setLoading(true).build()
        }

        val actionStrip = ActionStrip.Builder()
            .addAction(
                Action.Builder()
                    .setIcon(
                        CarIcon.Builder(
                            IconCompat.createWithResource(carContext, R.drawable.ic_stop_nav)
                        ).build()
                    )
                    .setOnClickListener {
                        NavigationEngine.stopNavigation()
                        screenManager.pop()
                    }
                    .build()
            )
            .build()

        return NavigationTemplate.Builder()
            .setNavigationInfo(navigationInfo)
            .setActionStrip(actionStrip)
            .setDestinationTravelEstimate(
                TravelEstimate.Builder(
                    destinationDistance,
                    ZonedDateTime.now().plusSeconds(
                        NavigationEngine.estimatedSeconds().toLong()
                    )
                ).build()
            )
            .build()
    }
}
```

---

## GridTemplate media category browser

A media category browser using `GridTemplate`. Tapping a category pushes a `ListTemplate` screen with tracks. Demonstrates returning a value from a child screen using `pushForResult`.

```kotlin
data class MediaCategory(val id: String, val title: String, val iconResId: Int)

class MediaCategoryScreen(carContext: CarContext) : Screen(carContext) {
    private val categories = listOf(
        MediaCategory("playlists", "Playlists", R.drawable.ic_playlist),
        MediaCategory("albums", "Albums", R.drawable.ic_album),
        MediaCategory("artists", "Artists", R.drawable.ic_artist),
        MediaCategory("podcasts", "Podcasts", R.drawable.ic_podcast)
    )

    override fun onGetTemplate(): Template {
        val gridItems = ItemList.Builder()
        categories.forEach { category ->
            gridItems.addItem(
                GridItem.Builder()
                    .setTitle(category.title)
                    .setImage(
                        CarIcon.Builder(
                            IconCompat.createWithResource(carContext, category.iconResId)
                        ).build(),
                        GridItem.IMAGE_TYPE_ICON
                    )
                    .setOnClickListener {
                        screenManager.pushForResult(
                            MediaTrackListScreen(carContext, category)
                        ) { selectedTrackId ->
                            // Child returned a track ID; begin playback
                            if (selectedTrackId is String) {
                                MediaPlayer.play(selectedTrackId)
                            }
                        }
                    }
                    .build()
            )
        }

        return GridTemplate.Builder()
            .setTitle(carContext.getString(R.string.browse_media))
            .setSingleList(gridItems.build())
            .setHeaderAction(Action.APP_ICON)
            .build()
    }
}

class MediaTrackListScreen(
    carContext: CarContext,
    private val category: MediaCategory
) : Screen(carContext) {
    private var tracks: List<String> = emptyList()

    init {
        lifecycleScope.launch {
            MediaRepository.tracksForCategory(category.id).collect { result ->
                tracks = result
                invalidate()
            }
        }
    }

    override fun onGetTemplate(): Template {
        val listBuilder = ItemList.Builder()
        tracks.take(6).forEach { trackId ->
            listBuilder.addItem(
                Row.Builder()
                    .setTitle(trackId)
                    .setOnClickListener {
                        setResult(trackId)
                        screenManager.pop()
                    }
                    .build()
            )
        }
        return ListTemplate.Builder()
            .setTitle(category.title)
            .setSingleList(listBuilder.build())
            .setHeaderAction(Action.BACK)
            .build()
    }
}
```
