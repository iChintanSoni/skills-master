## Single async prediction with the generated class

Reuse one model instance; run inference off the main actor with `async`.

```swift
actor SentimentEngine {
    private let model: SentimentClassifier

    init() throws {
        let config = MLModelConfiguration()
        config.computeUnits = .all
        model = try SentimentClassifier(configuration: config)
    }

    func score(_ text: String) async throws -> String {
        let output = try await model.prediction(from: .init(text: text))
        return output.label            // typed Output property
    }
}
```

## Batch prediction

Feed many inputs at once so the Neural Engine stays saturated.

```swift
func classifyAll(_ images: [CVPixelBuffer]) async throws -> [String] {
    let inputs = images.map { MobileNetInput(image: $0) }
    let outputs = try await mobileNet.predictions(from: inputs)
    return outputs.map(\.classLabel)
}
```

## Image classification via the modern Vision Swift API (iOS 18+)

Let Vision crop, scale, and convert pixels; `perform` is async and returns
typed observations.

```swift
import Vision

func topLabel(for image: CGImage) async throws -> String? {
    let mlModel = try VNCoreMLModel(for: PlantClassifier().model)
    var request = CoreMLRequest(model: mlModel)
    request.cropAndScaleOption = .centerCrop

    let results = try await request.perform(on: image)
    let best = results
        .compactMap { $0 as? ClassificationObservation }
        .max { $0.confidence < $1.confidence }
    return best?.identifier
}
```

## Converting a PyTorch model with Core ML Tools

Run once at build/train time; produces an ML Program `.mlpackage`.

```python
import coremltools as ct
import torch

traced = torch.jit.trace(model.eval(), example_input)
mlmodel = ct.convert(
    traced,
    inputs=[ct.ImageType(name="image", shape=example_input.shape)],
    minimum_deployment_target=ct.target.iOS17,
)
mlmodel.save("PlantClassifier.mlpackage")
```
