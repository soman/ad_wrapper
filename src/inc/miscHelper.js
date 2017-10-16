var configuration   = require('./configuration'),
    googleHelper    = require('./googleHelper');

module.exports = {
  miscHelperInitCall: false,
  init: function ( conf ) {

    if( this.miscHelperInitCall ) return;

    this.miscHelperInitCall = true;
    var scope = this;
    if(isInIframe) {
      console.log("calling scroll method");
      winTopPos.addEventListener('scroll', function() {
        googleHelper.refreshAdOnScrollResize();
      }, true);
    } else {
      window.addEventListener('scroll', function() {
        googleHelper.refreshAdOnScrollResize();
      }, true);
    }

    window.addEventListener("load", function(event) {
      window.addEventListener('resize', function() {
        googleHelper.refreshAdOnScrollResize();
      }, true);
    });

  },

  refreshAdOnScrollResize: function() {
    var allAdDivId = tohAdWrapper.allAdDivId;


    //console.log("allAdDivId");
    //console.log(allAdDivId);

    for (var key in allAdDivId) {
      if( ! allAdDivId.hasOwnProperty(key) ) continue;
      if(googleHelper.willAdRefresh(key)) {
        if(configuration.values.prebid_conflict) {
          var adName = allAdDivId[key];
          var adId = key;
          googleHelper.renderIframeAd(adId, adName);
        } else {
          googleHelper.refreshSlot(key);
        }
      }
    }

  }

};
