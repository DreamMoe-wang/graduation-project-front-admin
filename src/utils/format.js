export function formatCurrency(amount, options = {}) {
  const {
    symbol = '¥',
    withSymbol = true,
    fallback = 0
  } = options

  const numericAmount = Number(amount ?? fallback)
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : Number(fallback || 0)
  const formatted = safeAmount.toFixed(2)

  return withSymbol ? `${symbol}${formatted}` : formatted
}
