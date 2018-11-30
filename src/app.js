import Data from '../data.json';
import 'bootstrap/dist/css/bootstrap.min.css';

export class App {
  rawData = [];
  data = [];
  laggingTimeIndicatorInSecs = 60;
  baseFeePercent = 0;
  baseSpreadFeePercent = 0;
  lowestLow = 0;
  highestLow = 0;

  constructor() {
    this.rawData = this.transformData(Data);
  }
  attached() {
    this.calculate();
  }
  calculate() {
    let transactionsAddedData = this.setLowest(this.rawData);
    let finalData = this.setFees(transactionsAddedData);
    this.totalTime = this.getTimeDiff(finalData);
    this.totalFeePercent = this.getFeePercent(finalData);
    this.totalSpreadPercent = this.getSpreadPercent(finalData);
    this.totalRevenuePercent = this.getRevenuePercent(finalData);

    this.lowestLow = this.getLowestLow(finalData);
    this.highestLow = this.getHighestLow(finalData);

    this.data = finalData.reverse();
    this.displayData = this.data.filter(dataPoint => dataPoint.timeAsLowest > 1);
  }
  getLowestLow(data) {
    let lowest = parseFloat(data[0].low);

    data.forEach(dataPoint => {
      let low = parseFloat(dataPoint.low);
      if (low < lowest) {
        lowest = low;
      }
    });

    return lowest;
  }
  getHighestLow(data) {
    let highest = parseFloat(data[0].low);

    data.forEach(dataPoint => {
      let low = parseFloat(dataPoint.low);
      if (low > highest) {
        highest = low;
      }
    });

    return highest;
  }
  getTimeDiff(data) {
    let first = data[0];
    let last = data[data.length - 1];
    return last.time - first.time;
  }
  getFeePercent(data) {
    let last = data[data.length - 1];
    return last.totalFees / last.totalSpend;
  }
  getSpreadPercent(data) {
    let last = data[data.length - 1];
    return last.totalSpread / last.totalSpend;
  }
  getRevenuePercent(data) {
    let last = data[data.length - 1];
    return last.totalRevenue / last.totalSpend;
  }
  downloadAsCsv() {
    const replacer = (key, value) => {
      return (value === null ? '' : value);
    }
    const header = Object.keys(this.data[0]);

    let csv = this.data.map(row => {
      return header.map(fieldName => {
        return JSON.stringify(row[fieldName], replacer);
      }).join(',');
    });

    csv.unshift(header.join(','));
    csv = csv.join('\r\n');

    let data = encodeURI(csv);

    let link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', 'testing.csv');
    link.click();
  }
  transformData(data) {
    return data.map(datum => {
      let dataPoint = {
        low: datum.Low,
        time: datum.Timestamp,
        lowest: 0
      };

      return dataPoint;
    }).filter(dataPoint => {
      if (!dataPoint) return false;
      return !isNaN(dataPoint.low);
    });
  }
  setLowest(data) {
    // Don't look for lowest until laggingTimeIndicatorInSecs
    let count = 0;
    // Start with the lowest low
    let lowest = data[0].low;

    let totalSpend = 0;

    let timeAsLowest = 0;

    return data.map(dataPoint => {
      let lowestChanged = false;
      count += 1;

      if (timeAsLowest > this.laggingTimeIndicatorInSecs) {
        let timeAgo = data[count - this.laggingTimeIndicatorInSecs];

        let lowerValue = data.slice(count - 100, count).find(item => {
          return item.low < dataPoint.low;
        });
        if (!!lowerValue) {
          lowestChanged = true;
          timeAsLowest = 1;
          lowest = timeAgo.low;
        }
      }
      if (dataPoint.low < lowest) {
        lowestChanged = true;
        timeAsLowest = 1;
        lowest = dataPoint.low;
      } else {
        timeAsLowest += 1;
      }

      dataPoint.lowest = lowest;
      dataPoint.transaction = 75;
      dataPoint.timeAsLowest = timeAsLowest;

      totalSpend += dataPoint.transaction;

      dataPoint.totalSpend = totalSpend;

      return dataPoint;
    });
  }
  setFees(data) {
    let runningFeeTotal = 0;
    let runningSpreadTotal = 0;
    let runningRevenueTotal = 0;

    return data.map(dataPoint => {
      let difference = dataPoint.low - dataPoint.lowest;
      let spread = ((difference / dataPoint.low) * dataPoint.transaction);

      if (this.baseSpreadFeePercent > 0) {
        spread = spread + (dataPoint.transaction * (this.baseSpreadFeePercent / 100));
      }

      let fee = (dataPoint.transaction * (this.baseFeePercent / 100));
      let revenue = (fee + spread);

      dataPoint.spread = spread;
      dataPoint.fee = fee;
      dataPoint.revenue = revenue;

      runningFeeTotal += fee;
      runningSpreadTotal += spread;
      runningRevenueTotal += revenue;

      dataPoint.totalFees = runningFeeTotal;
      dataPoint.totalSpread = runningSpreadTotal;
      dataPoint.totalRevenue = runningRevenueTotal

      return dataPoint;
    });
  }
}
