import { Component, Input, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';


@Component({
  selector: 'app-dashboard-graph',
  templateUrl: './dashboard-graph.component.html',
  styleUrls: ['./dashboard-graph.component.scss']
})

export class DashboardGraphComponent implements OnInit {
  @Input() data: any;

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options;

  constructor() { }

  ngOnInit() {
    this.init();
  }

  init() {
    this.chartOptions = {
      yAxis: {
        title: { text: '' },
        labels: { formatter: function () { return ''; } },
        gridLineColor: 'rgba(0,0,0,0)',
        lineColor: 'rgba(0,0,0,0)',
      },
      xAxis: {
        title: { text: '' },
        labels: { formatter: function () { return ''; } },
        gridLineColor: 'rgba(0,0,0,0)',
        lineColor: 'rgba(0,0,0,0)',
        tickWidth: 0,
      },
      title: { text: '' },
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: {
        enabled: true,
        formatter: function () { var tooltip; tooltip = this.y; return tooltip; },
      },
      plotOptions: {
        area: {
          marker: {
            enabled: false,
            symbol: 'circle',
            radius: 0.5,
            states: {
              hover: { enabled: false }
            }
          }
        }
      },
      chart: { backgroundColor: 'rgba(0,0,0,0)', },
      series: [{
        type: 'area',
        name: '',
        color: 'rgb(230, 230, 230)',
        data: this.data,
      }]
    };
  }

}
