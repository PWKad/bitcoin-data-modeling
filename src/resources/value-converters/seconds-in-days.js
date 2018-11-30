export class SecondsInDaysValueConverter {
  toView(valueInSeconds) {
    let minutes = valueInSeconds / 60;
    let hours = minutes / 60;
    let days = hours / 24;
    let formattedDays = Math.round(days * 100) / 100;

    return `${formattedDays} days.`;
  }
}
