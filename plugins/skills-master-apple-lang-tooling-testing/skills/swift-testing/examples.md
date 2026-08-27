# swift-testing — examples

## Basic test with #expect and try #require

```swift
import Testing

@Test("trims whitespace and lowercases the slug")
func makesSlug() throws {
    let slug = Slug(from: "  Hello World  ")
    let value = try #require(slug)        // stops cleanly if nil
    #expect(value.text == "hello-world")  // soft check, captures operands
}
```

## Parameterized test across many inputs

```swift
@Test("even numbers are detected", arguments: [0, 2, 8, 144, -6])
func isEven(_ n: Int) {
    #expect(n.isMultiple(of: 2))
}

@Test("parses currency pairs", arguments: zip(["$5", "€3"], [5, 3]))
func parsesAmount(_ input: String, _ expected: Int) throws {
    #expect(try Money(input).whole == expected)
}
```

## Suite with per-test setup, async, and thrown-error checks

```swift
@Suite("Cart")
struct CartTests {
    let cart = Cart()                 // fresh instance per test
    deinit { cart.clear() }           // teardown, no shared state

    @Test func loadsRemoteTotal() async throws {
        let total = try await cart.fetchTotal()
        #expect(total >= 0)
    }

    @Test func rejectsNegativeQuantity() {
        #expect(throws: CartError.invalidQuantity) {
            try cart.add(item: .pen, quantity: -1)
        }
    }
}
```

## Tags, disabling, and time limits

```swift
extension Tag { @Tag static var network: Self }

@Test("retries on timeout", .tags(.network), .timeLimit(.minutes(1)))
func retries() async throws {
    #expect(try await Client().fetch().status == 200)
}

@Test("legacy path", .disabled("flaky until FB12345 lands"))
func legacy() { #expect(Bool(true)) }
```
