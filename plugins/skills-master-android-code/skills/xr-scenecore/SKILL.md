---
name: xr-scenecore
description: Covers Jetpack XR SceneCore for Android XR apps — loading glTF/GLB models, managing entities and transforms, configuring environments and skyboxes, and composing 3D content alongside spatial panels. Use when building or extending an Android XR app that needs 3D objects, spatial layouts, or custom environments in SceneCore.
---

## When to use

Apply this skill when your Android XR app needs to place 3D objects in space, load glTF or GLB model files, move or rotate entities via transforms, swap skyboxes and environments, or mix spatial UI panels with 3D scene geometry. This covers the SceneCore layer of the Jetpack XR SDK, which sits below the XR Compose helpers and gives you direct control over the scene graph.

---

## Core guidance

### Session and scene access

- Obtain a `Session` instance via `Session.create(activity)` inside `onCreate`. The session is the root of all SceneCore operations — models, entities, and environments all belong to it.
- Keep the `Session` in a lifecycle-aware owner (e.g., a `ViewModel`) and call `session.close()` in `onDestroy` to avoid leaks.
- All SceneCore calls must occur on the main thread unless the API explicitly states otherwise.

### Loading glTF/GLB models

- Use `GltfModelResource.load(session, uri)` (a suspending function) to load a model from an asset URI or a file URI. Run it in a coroutine tied to the UI lifecycle.
- Cache `GltfModelResource` objects; loading is expensive. A single resource can be instanced many times at no extra load cost.
- To display a model, create a `GltfModelEntity` from the resource: `GltfModelEntity.create(session, resource)`.
- Prefer GLB (binary glTF) over multi-file glTF for shipping in APKs — single-file packaging avoids relative URI resolution errors at runtime.
- Only features in the glTF 2.0 core spec plus the KHR_materials_unlit and KHR_mesh_quantization extensions are guaranteed on all XR hardware.

### Entities and the scene graph

- Every visible object is an `Entity`. The scene graph is a tree: child entities inherit the world transform of their parent.
- Attach an entity to the scene's root via `entity.setParent(session.activitySpace)` or to another entity to create a sub-hierarchy.
- Call `entity.setHidden(false)` to make an entity visible (entities default to hidden after creation).
- Detach an entity from the scene graph by calling `entity.setParent(null)`. Destroy it permanently with `entity.dispose()`.
- Do not hold strong references to disposed entities; SceneCore will throw on subsequent API calls against them.

### Transforms — position, rotation, scale

- Read and write the local pose with `entity.setPose(Pose(Vector3(x, y, z), Quaternion(...)))`.
- Distances are in meters. Place content at comfortable viewing distances: 0.5 m to 3.0 m for interactive objects.
- Use `Pose.Identity` to reset an entity back to its parent-relative origin.
- Prefer composing small, single-axis `Quaternion` rotations rather than constructing Euler angles manually — use `Quaternion.fromAxisAngle(Vector3.Up, angleDegrees)` for clarity.
- Animate transforms by updating pose values inside a `Choreographer` frame callback or a `LaunchedEffect` loop — SceneCore has no built-in animation system.

### Environments and skyboxes

- Set the spatial environment via `session.spatialEnvironment.requestHomeSpaceMode(...)` or by replacing the passthrough/skybox configuration.
- Load a skybox from an equirectangular image using `ExrImage.load(session, uri)` and apply it with `SpatialEnvironment.setSkybox(image)`.
- Restore the default passthrough environment by calling `SpatialEnvironment.setSkybox(null)` and `SpatialEnvironment.setGeometry(null)`.
- Environments are global to the session; changing the skybox affects everything the user sees. Always provide a clear trigger (e.g., a settings toggle or scene transition) so the change does not surprise users.

### Combining 3D content with spatial panels

- Spatial UI panels (created with `PanelEntity` or via the `Subspace` / `SpatialPanel` Compose APIs) are themselves entities and live in the same scene graph.
- Anchor a panel near a 3D object by setting the panel's parent to the object entity and adjusting the pose offset.
- For XR Compose apps, place `GltfModelEntity` operations in a `LaunchedEffect` inside a `SubspaceComposable` scope so the entity lifetime is tied to composition.
- Use `InputEventListener` on an entity to detect gaze or hand-ray hit events and drive UI state in a shared `ViewModel`.

```kotlin
// Minimal: load a GLB, place it 1 m in front, attach to activity space
class XrSceneViewModel(application: Application) : AndroidViewModel(application) {
    private var session: Session? = null
    private var modelEntity: GltfModelEntity? = null

    fun initSession(activity: Activity) {
        session = Session.create(activity)
    }

    fun loadAndPlaceModel(assetUri: Uri) {
        val s = session ?: return
        viewModelScope.launch {
            // Load once; reuse the resource for multiple instances
            val resource = GltfModelResource.load(s, assetUri)
                .getOrElse { return@launch }

            val entity = GltfModelEntity.create(s, resource)
            entity.setPose(
                Pose(
                    translation = Vector3(0f, 0f, -1f), // 1 m forward
                    rotation = Quaternion.Identity,
                )
            )
            entity.setParent(s.activitySpace)
            entity.setHidden(false)
            modelEntity = entity
        }
    }

    override fun onCleared() {
        modelEntity?.dispose()
        session?.close()
    }
}
```

---

## Platform notes

**Hardware availability**
- SceneCore APIs require Android 16 (API 36) and devices that expose the `android.hardware.xr` feature. Guard all SceneCore code with `packageManager.hasSystemFeature("android.hardware.xr")` or by checking `Session.create` success before proceeding.

**File sources for models**
- Assets packaged in the APK are accessed via `Uri.parse("asset:///models/my_model.glb")`.
- Downloaded content should be placed in `filesDir` and addressed with a `file://` URI. Avoid `content://` URIs from `MediaStore` unless you have tested them end-to-end on the target device — resolver support varies.

**Animation in GLB files**
- Animations embedded in GLB are supported via `GltfModelEntity.startAnimation(name)` and `stopAnimation()`. Looping is controlled by an optional `loop` boolean parameter.
- If a GLB has no named animations the animation APIs are no-ops; do not rely on thrown exceptions to detect this case — inspect the asset offline.

**Passthrough vs. full-VR environments**
- In Home Space mode the user always sees passthrough; environment geometry and skybox are ignored by the compositor.
- In Full Space mode your skybox and geometry take full effect. Request Full Space only when the experience genuinely requires it — it removes the user from their surroundings and requires an explicit user grant.

**Thread safety**
- `GltfModelResource.load` is a suspending function safe to call on any dispatcher; the underlying decode runs off-thread. All other `Session` and `Entity` operations must be called from the main thread.

---

## Pitfalls

- **Not disposing entities** — every `GltfModelEntity` holds native resources. Entities not disposed when a screen is left accumulate in the native heap and cause visible memory pressure or driver crashes.
- **Attaching to the wrong parent** — attaching an entity to `session.activitySpace` places it in world space relative to the activity origin. Attaching to another entity places it in that entity's local space. Confusing these produces objects that drift or do not respond to parent transforms.
- **Loading on the main thread without a coroutine** — `GltfModelResource.load` blocks if called synchronously; always use `viewModelScope.launch` or a `LaunchedEffect`.
- **Reloading models per instance** — loading is a disk + decode operation. Create the `GltfModelResource` once and call `GltfModelEntity.create` for each instance rather than loading the same URI repeatedly.
- **Setting pose before parenting** — `setPose` is defined in the entity's local coordinate space. Setting pose before `setParent` is technically allowed but can produce confusing results if the entity's origin is later reparented. Set parent first, then pose.
- **Missing `setHidden(false)`** — newly created entities are hidden by default. Forgetting this call is the most common reason models "don't appear" during development.
- **Relying on glTF extensions beyond the core spec** — KHR_draco_mesh_compression and EXT_meshopt_compression are not guaranteed on all XR hardware; test compressed assets on device before shipping.
- **Changing environment in Home Space** — skybox and geometry changes have no visible effect while the user is in Home Space mode. Validate environment logic exclusively in Full Space.

---

## References

- **Guide:** [Add 3D content to your XR app](https://developer.android.com/develop/xr/jetpack-xr-sdk)
- **Guide:** [Jetpack XR SDK overview](https://developer.android.com/develop/xr/jetpack-xr-sdk)

---

## See also

The `xr-compose-spatial-ui` skill covers `SpatialPanel`, `Subspace`, and the `SubspaceComposable` APIs that host 2D Compose content alongside SceneCore entities. For input and interaction on XR surfaces see `xr-input`. For distributing XR apps and declaring the `android.hardware.xr` feature flag correctly in the manifest see `build-sign-distribute`.
