export class TimeValueConverter {
  toView(value) {
    let displayValue = parseInt(`${value}000`);

    return new Date(displayValue).toUTCString();
  }
}
