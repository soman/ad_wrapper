(function () {
  if(typeof prebid_ga_status !== "undefined" && prebid_ga_status == 1) {

    if(toh_debug) {
      console.log("prebid_ga_status in ad wrapper: "+prebid_ga_status);
    }

    var dateObj = new Date(),
        year = dateObj.getUTCFullYear(),
        month = dateObj.getUTCMonth() + 1,
        day = dateObj.getUTCDate(),
        hrs = dateObj.getUTCHours()-4,
        min = dateObj.getUTCMinutes(),
        sec = dateObj.getUTCSeconds();

    var curNewYorkTime  = year+"/"+month+"/"+day+" "+hrs+":"+min+":"+sec;
    var checkNewYorkStartTime  = year+"/"+month+"/"+day+" 13:"+min+":"+sec;
    var checkNewYorkEndTime  = year+"/"+month+"/"+day+" 15:"+min+":"+sec;

    // Added analytics code for prebid

    // Add the below code snippet to your page
    pbjs.que.push(function() {
      if(Date.parse(curNewYorkTime) >= Date.parse(checkNewYorkStartTime) && Date.parse(curNewYorkTime) <= Date.parse(checkNewYorkEndTime)) {
        pbjs.enableAnalytics({
            provider: 'ga',
            options: {
                global: 'ga', // <string> name of GA global. Default is 'ga'
                trackerName: 'adWrapperTracker',
                enableDistribution: false,
            }
        });
      }
    });
  }
})();
