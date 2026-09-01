package expo.modules.btcalarm

object AlarmEventBus {
  @Volatile
  var emitter: ((name: String, body: Map<String, Any?>) -> Unit)? = null

  fun emit(name: String, body: Map<String, Any?>) {
    emitter?.invoke(name, body)
  }
}
