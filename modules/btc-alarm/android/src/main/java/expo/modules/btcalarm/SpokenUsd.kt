package expo.modules.btcalarm

internal object SpokenUsd {
  private val ONES = arrayOf(
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  )
  private val TENS = arrayOf(
    "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  )

  fun sentence(usd: Double): String {
    return "The Bitcoin price is ${toWords(usd)}."
  }

  fun toWords(usd: Double): String {
    val rounded = kotlin.math.round(usd).toLong()
    if (rounded == 0L) {
      return "zero US dollars"
    }
    val parts = mutableListOf<String>()
    val millions = rounded / 1_000_000
    val thousands = (rounded % 1_000_000) / 1000
    val rest = (rounded % 1000).toInt()
    if (millions > 0) {
      parts.add("${chunkToWords(millions.toInt())} million")
    }
    if (thousands > 0) {
      parts.add("${chunkToWords(thousands.toInt())} thousand")
    }
    if (rest > 0) {
      parts.add(chunkToWords(rest))
    }
    return "${parts.joinToString(", ")} US dollars"
  }

  private fun chunkToWords(n: Int): String {
    if (n == 0) {
      return ""
    }
    if (n < 20) {
      return ONES[n]
    }
    if (n < 100) {
      val remainder = n % 10
      return if (remainder != 0) "${TENS[n / 10]}-${ONES[remainder]}" else TENS[n / 10]
    }
    val remainder = n % 100
    val hundred = "${ONES[n / 100]} hundred"
    return if (remainder != 0) "$hundred ${chunkToWords(remainder)}" else hundred
  }
}
