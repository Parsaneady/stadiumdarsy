const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Convert any Latin digits in a value to Persian digits. */
export const fa = (v: string | number): string =>
  String(v).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);

export const faDate = (d: Date = new Date(), opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', opts).format(d);
