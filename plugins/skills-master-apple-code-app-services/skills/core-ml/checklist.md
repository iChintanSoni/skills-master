## Core ML integration checklist

- [ ] Model added as an `.mlpackage` (ML Program), not legacy `.mlmodel`
- [ ] Using the Xcode-generated class, not `MLModel(contentsOf:)` with raw feature dictionaries
- [ ] One model instance created and reused (not reloaded per prediction)
- [ ] `MLModelConfiguration` built and set before init; `computeUnits` justified (default `.all`)
- [ ] Inference runs off the main actor (async `prediction(from:)` or background actor)
- [ ] Batch inputs use `predictions(from:)` instead of a manual loop
- [ ] Image inputs go through Vision (`CoreMLRequest`/`VNCoreMLModel`) or match the model's exact size and pixel format
- [ ] Model confined to an actor or constructed per-actor for thread safety
- [ ] Neural Engine usage verified with the Xcode Core ML performance report / Instruments
- [ ] Conversion done via Core ML Tools with a set `minimum_deployment_target`
- [ ] Any compression (quantization/palettization) validated against a held-out accuracy baseline
- [ ] Camera/photo usage strings (`NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription`) added and authorization requested where input is captured
