export interface ChartType {
  series: any[];
  chart: any;
  colors: string[];
  plotOptions?: any;
  dataLabels?: any;
  stroke?: any;
  fill?: any;
  xaxis?: any;
  yaxis?: any;
  legend?: any;
  labels?: any;
  tooltip?: any;
  grid?: any;
  title?: any;
}

// Revenue Chart Configuration
export const revenueChartOptions: ChartType = {
  series: [{
    name: 'Revenue',
    data: [31000, 40000, 28000, 51000, 42000, 82000, 56000, 81000, 56000, 55000, 40000, 36000]
  }],
  chart: {
    height: 350,
    type: 'area',
    toolbar: {
      show: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  colors: ['#556ee6'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.9,
      stops: [0, 90, 100]
    }
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  yaxis: {
    labels: {
      formatter: function (val: any) {
        return '$' + val.toLocaleString();
      }
    }
  }
};

// SMS Statistics Chart Configuration
export const smsChartOptions: ChartType = {
  series: [{
    name: 'SMS Sent',
    data: [44, 55, 57, 56, 61, 58, 63, 60, 66, 70, 75, 80]
  }, {
    name: 'SMS Received',
    data: [76, 85, 101, 98, 87, 105, 91, 114, 94, 100, 110, 120]
  }],
  chart: {
    height: 350,
    type: 'bar',
    toolbar: {
      show: false
    }
  },
  colors: ['#556ee6', '#f1b44c'],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      endingShape: 'rounded'
    },
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent']
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  yaxis: {
    title: {
      text: 'SMS Count'
    }
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    y: {
      formatter: function (val: any) {
        return val + " SMS"
      }
    }
  }
};

// Taxi Activity Chart Configuration
export const taxiActivityChartOptions: ChartType = {
  series: [{
    name: 'Active Taxis',
    data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 80, 65, 45]
  }],
  chart: {
    height: 350,
    type: 'line',
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'straight',
    width: 3
  },
  colors: ['#34c38f'],
  title: {
    text: 'Taxi Activity Over Time',
    align: 'left'
  },
  grid: {
    row: {
      colors: ['#f3f3f3', 'transparent'],
      opacity: 0.5
    },
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  }
};

// Monthly Earning Chart Configuration (Donut Chart)
export const monthlyEarningChartOptions: ChartType = {
  series: [44, 55, 13, 43, 22],
  chart: {
    height: 300,
    type: 'donut',
  },
  colors: ['#556ee6', '#34c38f', '#f1b44c', '#f46a6a', '#50a5f1'],
  labels: ['Series A', 'Series B', 'Series C', 'Series D', 'Series E'],
  legend: {
    position: 'bottom'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '70%'
      }
    }
  }
};

// Fleet Status Chart Configuration (Pie Chart)
export const fleetStatusChartOptions: ChartType = {
  series: [44, 55, 13, 43],
  chart: {
    height: 300,
    type: 'pie',
  },
  colors: ['#34c38f', '#f1b44c', '#f46a6a', '#50a5f1'],
  labels: ['Available', 'Busy', 'Offline', 'Maintenance'],
  legend: {
    position: 'bottom'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '70%'
      }
    }
  }
};

