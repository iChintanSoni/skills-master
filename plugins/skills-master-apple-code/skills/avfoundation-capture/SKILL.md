---
name: avfoundation-capture
description: Guidance on capturing photos, video, and audio with AVCaptureSession, its device inputs and outputs (AVCapturePhotoOutput, AVCaptureMovieFileOutput, video data output), AVCaptureVideoPreviewLayer, device discovery and configuration, camera and microphone authorization, and modern rotation handling via RotationCoordinator. Use when building a camera or recorder, wiring a capture session, selecting or configuring a capture device, showing a live preview, requesting camera or microphone permission, or fixing video orientation on iOS 17 and later.
---

## When to use

Use this skill when building anything that streams from the camera or microphone: a photo capture screen, a video recorder, a barcode or frame-processing pipeline, or a live preview. It covers assembling an `AVCaptureSession` from device inputs and outputs, discovering and configuring a capture device, presenting a preview, requesting and checking authorization, and keeping captured media level on iOS 17 and later. It does not cover playback or editing, which belong to `AVFoundation` player and editing APIs, nor the system photo picker.

## Core guidance

- Treat the session as a serial pipeline. Wrap every mutation in `beginConfiguration()` / `commitConfiguration()`, and do all setup and start/stop work off the main thread on your own serial queue — the calls block, and `startRunning()` can take noticeable time.
- Resolve the camera with `AVCaptureDevice.DiscoverySession`, not the deprecated default lookups. Pass concrete `deviceTypes` (for example `.builtInWideAngleCamera`, `.builtInLiDARDepthCamera`), a media type, and a position; never assume a device exists — handle an empty result.
- Add inputs and outputs defensively: build `AVCaptureDeviceInput(device:)` inside a `do/catch`, and gate each add on `canAddInput(_:)` / `canAddOutput(_:)`. Microphone input is only needed when recording audio; adding it triggers the mic permission prompt.
- Request access before configuring. Use `await AVCaptureDevice.requestAccess(for: .video)` and, when recording, `.audio`; branch on `authorizationStatus(for:)` for the `.notDetermined`, `.denied`, and `.restricted` cases. Missing Info.plist usage strings crash the app the moment you ask.
- Pick one output per job: `AVCapturePhotoOutput` for stills, `AVCaptureMovieFileOutput` for simple file recording, and `AVCaptureVideoDataOutput` (with a delegate and a dedicated queue, `alwaysDiscardsLateVideoFrames = true`) for per-frame work. Don't combine movie-file and data outputs on the same video.
- Drive rotation with `AVCaptureDevice.RotationCoordinator` on iOS 17+. Apply `videoRotationAngleForHorizonLevelPreview` to the preview connection and `videoRotationAngleForHorizonLevelCapture` to capture connections via `videoRotationAngle`; do not read `UIDevice.orientation`, and avoid the deprecated `videoOrientation`.
- Mirror the front camera at the connection with `isVideoMirrored`, and always check `isVideoRotationAngleSupported(_:)` before setting an angle.

```swift
let coordinator = AVCaptureDevice.RotationCoordinator(
    device: camera, previewLayer: previewLayer)

func updateForCapture(_ connection: AVCaptureConnection) {
    let angle = coordinator.videoRotationAngleForHorizonLevelCapture
    if connection.isVideoRotationAngleSupported(angle) {
        connection.videoRotationAngle = angle
    }
}
// Observe coordinator.videoRotationAngleForHorizonLevelPreview via KVO
// and assign it to previewLayer.connection?.videoRotationAngle.
```

## Platform notes

- `RotationCoordinator`, the `videoRotationAngle` connection property, and async `requestAccess(for:)` require iOS 17 / iPadOS 17 / visionOS; the older `videoOrientation` and `requestAccess(for:completionHandler:)` still exist but are legacy.
- On macOS, the camera and microphone usage strings live in the app sandbox/entitlements flow and Info.plist; sandboxed Mac apps also need the Camera and Audio Input entitlements, and there is no device-rotation concept for the built-in camera.
- visionOS exposes only a constrained set of capture capabilities and requires an enterprise entitlement for the main camera; verify availability before assuming a device.
- iPadOS supports external USB and Continuity cameras through the same discovery API; enumerate device types rather than hardcoding the built-in wide camera.

## Pitfalls

- Forgetting `NSCameraUsageDescription` or `NSMicrophoneUsageDescription` in Info.plist crashes the process with no recoverable error — add both before the first capture request.
- Mutating the session (adding inputs, changing preset) on the main thread or without a configuration block causes stalls or dropped frames; serialize it.
- Configuring a device's `activeFormat`, focus, or exposure requires `lockForConfiguration()` and a matching `unlockForConfiguration()`; skipping the lock throws.
- Setting `AVCaptureVideoPreviewLayer.frame` without `videoGravity = .resizeAspectFill` (or your intended gravity) yields letterboxed or stretched preview; the layer does not auto-size.
- Reading device orientation to rotate frames produces wrong results when the UI orientation is locked or on visionOS; use the rotation coordinator's angles instead.
- Retaining a strong reference to `AVCaptureVideoDataOutput`'s delegate queue work on the main actor under Swift 6 strict concurrency triggers data races; isolate frame handling deliberately.

## References

- **Documentation:** [AVCaptureSession](https://developer.apple.com/documentation/avfoundation/avcapturesession)
- **Documentation:** [Setting up a capture session](https://developer.apple.com/documentation/avfoundation/setting-up-a-capture-session)
- **Documentation:** [Requesting authorization to capture and save media](https://developer.apple.com/documentation/avfoundation/requesting-authorization-to-capture-and-save-media)
- **Documentation:** [AVCaptureDevice.RotationCoordinator](https://developer.apple.com/documentation/avfoundation/avcapturedevice/rotationcoordinator)
- **WWDC:** [Create a more responsive camera experience (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10105/)
- **Sample Code:** [AVCam: Building a camera app](https://developer.apple.com/documentation/avfoundation/avcam-building-a-camera-app)

## See also

For surfacing captured media through the system, see `photokit` for saving to the photo library and the photo picker. For lower-level frame processing of `AVCaptureVideoDataOutput` buffers, pair this with skills covering Core Image or Vision. For app-wide model state that holds the session, see `observation`.
