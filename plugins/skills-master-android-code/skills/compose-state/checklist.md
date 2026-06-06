# compose-state — checklist

- [ ] Every `remember { … }` that depends on a parameter uses that parameter as a key: `remember(param) { … }`.
- [ ] Primitive state uses a specialized holder — `mutableIntStateOf`, `mutableLongStateOf`, `mutableFloatStateOf`, or `mutableDoubleStateOf` — rather than the generic `mutableStateOf<Int>`.
- [ ] Observable collections use `mutableStateListOf` or `mutableStateMapOf`; no plain `MutableList` is held in a `mutableStateOf` and mutated in-place.
- [ ] State that must survive configuration change (rotation, locale) is stored in `rememberSaveable`, a ViewModel, or `SavedStateHandle` — not in plain `remember`.
- [ ] `rememberSaveable` stores only Bundle-compatible types (primitives, `Parcelable`, `Serializable`); complex types have a matching `Saver` (e.g. via `listSaver` or `mapSaver`).
- [ ] Each composable that could be extracted as stateless has been: state + event lambda live in the nearest common ancestor, not buried in the leaf.
- [ ] Ephemeral UI-only state (dropdown expansion, tooltip visibility) stays in `remember` inside the composable rather than being pushed into the ViewModel.
- [ ] `derivedStateOf` is wrapped in `remember`; bare `derivedStateOf { … }` at the top level of a composable body is a bug.
- [ ] `derivedStateOf` is used only for non-trivial computations or to suppress recomposition when output is unchanged — not applied to simple boolean checks or arithmetic.
- [ ] State inside a coroutine or callback is read via `snapshotFlow { stateVar }` rather than by directly reading the `.value` property inside a `collect` lambda.
- [ ] No state write happens on a background thread without a snapshot transaction; ViewModel writes are delivered to the UI via `StateFlow` or `collectAsStateWithLifecycle`.
- [ ] The Bundle written by all `rememberSaveable` calls in a screen is well under 1 MB (check by logging `Bundle.size()` or inspecting with Layout Inspector); large data goes to the ViewModel or database.
- [ ] Stateless composables accept a `modifier: Modifier = Modifier` parameter at the end, following Compose API guidelines.
- [ ] When using `mutableStateListOf`, individual item updates use indexed assignment (`items[i] = item.copy(…)`) rather than `remove` + `add` to preserve list stability for `LazyColumn` key-based diffing.
- [ ] Composables that receive a state value for display but never mutate it take a plain value type, not a `MutableState<T>` reference.
- [ ] All state is read as close to its use site as possible — not at the top of a large composable — to narrow the recomposition scope.
- [ ] A ViewModel `StateFlow` is collected with `collectAsStateWithLifecycle()` (not `collectAsState()`) so collection stops when the UI is not visible, avoiding wasted work.
