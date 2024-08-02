'use strict';

// Status monitor

let config = {
    title: 'Trian API status',
    path:'',
    spans: [{
        interval: 1,            // Every second
        retention: 60           // Keep 60 datapoints in memory
      }, {
        interval: 15,           // Every 15 seconds
        retention: 60
      }, {
        interval: 60,           // Every 1 minute
        retention: 60
      }, {
        interval: 60*60,           // Every 1 hour
        retention: 60
      }],
      chartVisibility: {
        cpu: true,
        mem: true,
        load: true,
        eventLoop: false,   // not supported...
        heap: false,
        responseTime: true,
        rps: true,
        statusCodes: true
      },
      
}



const statusMonitor = require('express-status-monitor')(config);

module.exports = statusMonitor;

