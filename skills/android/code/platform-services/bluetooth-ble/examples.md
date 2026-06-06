## Scanning for a BLE peripheral by service UUID

Wraps `BluetoothLeScanner` in a `callbackFlow` so scan results arrive as a `Flow<ScanResult>`. The ViewModel starts and stops the scan based on lifecycle, and exposes a list of discovered devices to the Compose UI.

```kotlin
// BleScanner.kt
@RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
fun BluetoothLeScanner.scanFlow(
    filters: List<ScanFilter>,
    settings: ScanSettings = ScanSettings.Builder()
        .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
        .build(),
): Flow<ScanResult> = callbackFlow {
    val callback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            trySend(result)
        }
        override fun onScanFailed(errorCode: Int) {
            close(IllegalStateException("BLE scan failed: $errorCode"))
        }
    }
    startScan(filters, settings, callback)
    awaitClose { stopScan(callback) }
}

// ScanViewModel.kt
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val bluetoothManager: BluetoothManager,
) : ViewModel() {

    private val serviceUuid = UUID.fromString("0000180d-0000-1000-8000-00805f9b34fb") // HRM

    private val _devices = MutableStateFlow<List<BluetoothDevice>>(emptyList())
    val devices: StateFlow<List<BluetoothDevice>> = _devices.asStateFlow()

    @RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
    fun startScan() {
        val scanner = bluetoothManager.adapter?.bluetoothLeScanner ?: return
        val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(serviceUuid)).build()
        viewModelScope.launch {
            scanner.scanFlow(listOf(filter))
                .timeout(30.seconds)
                .catch { /* surface error to UI */ }
                .collect { result ->
                    val device = result.device
                    if (_devices.value.none { it.address == device.address }) {
                        _devices.update { it + device }
                    }
                }
        }
    }
}

// ScanScreen.kt
@Composable
fun ScanScreen(viewModel: ScanViewModel = hiltViewModel()) {
    val devices by viewModel.devices.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.startScan() }

    LazyColumn(modifier = Modifier.fillMaxSize()) {
        items(devices, key = { it.address }) { device ->
            ListItem(
                headlineContent = { Text(device.name ?: "Unknown") },
                supportingContent = { Text(device.address) },
            )
        }
    }
}
```

---

## Connecting to a GATT server and enabling notifications

A repository that connects to a BLE heart-rate monitor, enables notifications on the measurement characteristic, and emits heart-rate readings as a `Flow<Int>`. Uses a serialised operation queue via `Channel` to ensure only one GATT operation runs at a time.

```kotlin
// HeartRateRepository.kt
private val HR_SERVICE    = UUID.fromString("0000180d-0000-1000-8000-00805f9b34fb")
private val HR_CHAR       = UUID.fromString("00002a37-0000-1000-8000-00805f9b34fb")
private val CCD_DESCRIPTOR = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")

class HeartRateRepository(private val context: Context) {

    @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
    fun heartRateFlow(device: BluetoothDevice): Flow<Int> = callbackFlow {
        var gatt: BluetoothGatt? = null

        val callback = object : BluetoothGattCallback() {
            override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
                when {
                    newState == BluetoothProfile.STATE_CONNECTED -> g.discoverServices()
                    status != BluetoothGatt.GATT_SUCCESS || newState == BluetoothProfile.STATE_DISCONNECTED -> {
                        close(IOException("Disconnected: status=$status"))
                        g.close()
                    }
                }
            }

            override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
                if (status != BluetoothGatt.GATT_SUCCESS) {
                    close(IOException("Service discovery failed")); g.close(); return
                }
                val char = g.getService(HR_SERVICE)?.getCharacteristic(HR_CHAR) ?: run {
                    close(IOException("HR characteristic not found")); g.close(); return
                }
                g.setCharacteristicNotification(char, true)
                val descriptor = char.getDescriptor(CCD_DESCRIPTOR)
                // API 33+: use writeDescriptor(descriptor, value)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    g.writeDescriptor(descriptor, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
                } else {
                    @Suppress("DEPRECATION")
                    descriptor.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                    @Suppress("DEPRECATION")
                    g.writeDescriptor(descriptor)
                }
            }

            // API 33+ override — receives value directly
            override fun onCharacteristicChanged(
                g: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                value: ByteArray,
            ) {
                if (characteristic.uuid == HR_CHAR && value.isNotEmpty()) {
                    // Byte 0 is flags; bit 0 indicates 16-bit vs 8-bit format
                    val hrValue = if (value[0].toInt() and 0x01 != 0) {
                        ((value[2].toInt() and 0xFF) shl 8) or (value[1].toInt() and 0xFF)
                    } else {
                        value[1].toInt() and 0xFF
                    }
                    trySend(hrValue)
                }
            }
        }

        gatt = device.connectGatt(context, false, callback, BluetoothDevice.TRANSPORT_LE)

        awaitClose {
            gatt?.disconnect()
            gatt?.close()
        }
    }.flowOn(Dispatchers.IO)
}
```

---

## Full ViewModel + Compose integration with connection state

A ViewModel that owns the connection lifecycle and exposes a sealed `ConnectionState` to the UI, preventing invalid state transitions and surfacing retry logic.

```kotlin
// BleConnectionViewModel.kt
sealed interface ConnectionState {
    data object Idle : ConnectionState
    data object Connecting : ConnectionState
    data class Connected(val heartRate: Int) : ConnectionState
    data class Error(val message: String, val canRetry: Boolean) : ConnectionState
}

@HiltViewModel
class BleConnectionViewModel @Inject constructor(
    private val repository: HeartRateRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<ConnectionState>(ConnectionState.Idle)
    val state: StateFlow<ConnectionState> = _state.asStateFlow()

    private var connectionJob: Job? = null
    private var retryCount = 0

    @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
    fun connect(device: BluetoothDevice) {
        connectionJob?.cancel()
        _state.value = ConnectionState.Connecting
        connectionJob = viewModelScope.launch {
            repository.heartRateFlow(device)
                .retryWhen { cause, attempt ->
                    if (attempt < 3 && cause is IOException) {
                        delay((1_000L shl attempt.toInt()))
                        true
                    } else false
                }
                .catch { e ->
                    _state.value = ConnectionState.Error(
                        message = e.localizedMessage ?: "Unknown error",
                        canRetry = retryCount < 3,
                    )
                }
                .collect { hr ->
                    retryCount = 0
                    _state.value = ConnectionState.Connected(hr)
                }
        }
    }

    fun disconnect() {
        connectionJob?.cancel()
        _state.value = ConnectionState.Idle
    }
}

// HeartRateScreen.kt
@Composable
fun HeartRateScreen(
    device: BluetoothDevice,
    viewModel: BleConnectionViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(device) { viewModel.connect(device) }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        when (val s = state) {
            ConnectionState.Idle -> Text("Not connected")
            ConnectionState.Connecting -> CircularProgressIndicator()
            is ConnectionState.Connected ->
                Text("♥ ${s.heartRate} bpm", style = MaterialTheme.typography.displayLarge)
            is ConnectionState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(s.message, color = MaterialTheme.colorScheme.error)
                if (s.canRetry) {
                    Button(onClick = { viewModel.connect(device) }) { Text("Retry") }
                }
            }
        }
    }
}
```

---

## Acting as a BLE peripheral (advertiser + GATT server)

Advertises a custom service UUID and responds to read requests from a connecting central. Useful for phone-to-phone data transfer or for building a peripheral role into an Android accessory companion app.

```kotlin
// BlePeripheral.kt
private val CUSTOM_SERVICE = UUID.fromString("12345678-1234-1234-1234-123456789abc")
private val CUSTOM_CHAR    = UUID.fromString("12345678-1234-1234-1235-123456789abc")

@RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_ADVERTISE])
fun startPeripheral(context: Context, bluetoothManager: BluetoothManager) {
    val adapter = bluetoothManager.adapter

    // 1. Open GATT server
    val serverCallback = object : BluetoothGattServerCallback() {
        override fun onCharacteristicReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic,
        ) {
            val response = "Hello from Android".toByteArray()
            bluetoothManager.openGattServer(context, this)?.sendResponse(
                device, requestId, BluetoothGatt.GATT_SUCCESS, offset,
                response.drop(offset).toByteArray()
            )
        }
    }
    val gattServer = bluetoothManager.openGattServer(context, serverCallback)
    val service = BluetoothGattService(CUSTOM_SERVICE, BluetoothGattService.SERVICE_TYPE_PRIMARY)
    val characteristic = BluetoothGattCharacteristic(
        CUSTOM_CHAR,
        BluetoothGattCharacteristic.PROPERTY_READ,
        BluetoothGattCharacteristic.PERMISSION_READ,
    )
    service.addCharacteristic(characteristic)
    gattServer.addService(service)

    // 2. Start advertising
    val settings = AdvertiseSettings.Builder()
        .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
        .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
        .setConnectable(true)
        .build()
    val advertiseData = AdvertiseData.Builder()
        .addServiceUuid(ParcelUuid(CUSTOM_SERVICE))
        .setIncludeDeviceName(false) // keep payload small
        .build()
    val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartFailure(errorCode: Int) {
            // Handle ADVERTISE_FAILED_DATA_TOO_LARGE, etc.
        }
    }
    adapter.bluetoothLeAdvertiser?.startAdvertising(settings, advertiseData, advertiseCallback)
}
```
