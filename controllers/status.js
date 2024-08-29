'use strict';

// Status monitor

let config = {
    title: 'Trian API status',
    path:'',                    // use middleware instead
    spans: [{
        interval: 1,            // Every: second
        retention: 60           // Keep 60 datapoints in memory, Retention: 1 minute
      }, {
        interval: 60,           // Every: 1 minute
        retention: 60           // Retention: 1 hour
      }, {
        interval: 30*60,        // Every: 30 minutes
        retention: 60           // Retention: 1 day (30 hours)
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

