export class PercentValueConverter {
  toView(value) {
    let percent = value * 100;
    let rounded = Math.round((percent * 10000)) / 10000;
    return `${rounded}%`;
  }
}
