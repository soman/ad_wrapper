var configuration   = require('./configuration'),
    googleHelper    = require('./googleHelper');

module.exports = {
  refreshHelperInitCall: false,
  refreshSlotData: {},
  refreshTime: 30,
  waitActiveViewTime: 2,
  isTabActive: true,
  init: function ( conf ) {

    if( this.refreshHelperInitCall ) return;

    this.refreshHelperInitCall = true;
    var scope = this;

/*    window.onload = function() {
      scope.startSetInterval();
      scope.isTabBrowserActive();
    };*/

    window.addEventListener('load',
      function() {
        scope.startSetInterval();
        scope.isTabBrowserActive();
      }, false);
  },

  startSetInterval: function() {
    var scope = this;
    setInterval( function() {
      scope.checkRefreshSlot();
    }, 1000);
  },

  checkRefreshSlot: function() {
    //if( !this.isTabActive ) return true;

    var refreshSlotData = this.refreshSlotData;
    for (var key in refreshSlotData) {
      if( ! refreshSlotData.hasOwnProperty(key) ) continue;
      if(isInIframe) {
        var inviewStatus = this.inViewStatusInIframe(key);
      } else {
        var inviewStatus = this.inViewStatus(key);
      }
      if(inviewStatus) {
        this.processRefreshSlot(key);
      }
    }
  },

  inViewStatus: function(adId) {
    var adWrapper = document.getElementById(adId),
        inviewStatus = false,
        adTopPos = adWrapper.offsetTop,
        pageYOffset = parseInt( window.pageYOffset ),
        ad_height = document.getElementById(adId).clientHeight,
        checkBottom = pageYOffset + win_height,
        adMidPos = adTopPos + ad_height/2;

    if( adMidPos >= pageYOffset && adMidPos <= checkBottom ) {
      inviewStatus = true;
    }

    return inviewStatus;
  },

  inViewStatusInIframe: function(adId) {
    var scrollPageY = winTopPos.scrollY  || winTopPos.pageYOffset || winTopPos.document.documentElement.scrollTop;

    var win_height = winTopPos.innerHeight
        || winTopPos.document.documentElement.clientHeight
        || winTopPos.document.body.clientHeight;

    window.parent_win_height = win_height;

    var adWrapper = document.getElementById(adId),
        inviewStatus = false,
        adTopPos = adWrapper.offsetTop + winTopIframeYOffset,
        pageYOffset = parseInt(scrollPageY),
        ad_height = document.getElementById(adId).clientHeight,
        checkBottom = pageYOffset + win_height,
        adMidPos = adTopPos + ad_height/2;

    if( adMidPos >= pageYOffset && adMidPos <= checkBottom ) {
      inviewStatus = true;
    }

    return inviewStatus;
  },

  processRefreshSlot: function(adId) {
    var currData = this.refreshSlotData[adId],
        isHover = googleHelper.hoverData[adId]["isHover"];

    if(toh_refresh) {
      console.log("TOH Debug: currData in refresh mehtod");
      console.log(currData);
    }

    if( !currData.isAdRender ) return true;

    currData["inViewTime"] = currData.inViewTime+1;

    if(isHover == true) {
      currData["hoverTime"] = currData.hoverTime+1;
    }

    var waitActiveViewTime = this.waitActiveViewTime;

    if(waitActiveViewTime) {
      if(waitActiveViewTime == currData.inViewTime && currData.activeView == 0) {
        currData.stopRefresh = 1;
      }
    }

    // Ad will not refresh
    if(currData.stopRefresh == 0) {
      if(isHover == false) {
        currData["nextRefresh"] = currData.nextRefresh-1;
      }

      if(currData.nextRefresh == 0) {
        currData["nextRefresh"] = currData.refreshTime;
      }

      if(currData.nextRefresh == currData.refreshTime && isHover == false) {
        currData["renderCount"] = currData.renderCount+1;
        currData["isAdRender"] = 0;

        if(typeof googleHelper.dfpSlots[adId] != "undefined") {
          var slot = googleHelper.dfpSlots[adId];

          if(typeof slot["o"]["REFRESH"] != "undefined") {
            slot["o"]["REFRESH"][0] = 1;
          }
        }

        googleHelper.refreshSlot(adId);
      }
    }

    // Print the debug info
    if(toh_counters) this.printDebug(adId);

  },

  printDebug: function(adId) {
    var currData = this.refreshSlotData[adId],
        debug_id = adId+"_debug",
        debugChild = document.getElementById(debug_id),
        adWrapper = document.getElementById(adId),
        top = adWrapper.offsetTop,
        debug_win_height = win_height;

    if(isInIframe) {
      debug_win_height = parent_win_height;
      top = winTopIframeYOffset + adWrapper.offsetTop;
    }

    top = parseInt(top);
    var buffered_height = 0;
    if(typeof lazyLoadBuffer !== "undefined")
      buffered_height = lazyLoadBuffer*2+debug_win_height;

    var html = 'In-view time: '+currData.inViewTime+' Sec. | Next refresh: '+currData.nextRefresh+' Sec. | Render count: '+currData.renderCount+' | Mouseover time: '+currData.hoverTime+' Sec. | Top: '+top+' | Window height: '+debug_win_height+' | Buffered Height: '+buffered_height;

    if (debugChild === null) {
      var newElement = document.createElement("div");
          newElement.id = debug_id;
          newElement.class = "inview-wrapper";
          newElement.style = "position: absolute;top: 0;background: rgba(255,255,0,0.85);padding: 10px;z-index: 9;font-size: 14px;width: 100%;border: 1px solid #999;-webkit-box-sizing: border-box;";
          newElement.innerHTML = html;

      adWrapper.appendChild( newElement );
    } else {
      document.getElementById(debug_id).innerHTML = '<div id="'+debug_id+'" class="inview-wrapper">'+html+'</div>';
    }
  },

  isTabBrowserActive: function() {
    var scope = this;
    /////////////////////////////////////////
    // main visibility API function
    // check if current tab is active or not
    var vis = (function(){
        var stateKey,
            eventKey,
            keys = {
                    hidden: "visibilitychange",
                    webkitHidden: "webkitvisibilitychange",
                    mozHidden: "mozvisibilitychange",
                    msHidden: "msvisibilitychange"
        };
        for (stateKey in keys) {
          if( ! keys.hasOwnProperty(stateKey) ) continue;
            if (stateKey in document) {
                eventKey = keys[stateKey];
                break;
            }
        }
        return function(c) {
            if (c) document.addEventListener(eventKey, c);
            return !document[stateKey];
        }
    })();


    /////////////////////////////////////////
    // check if current tab is active or not
    vis(function(){
        if(vis()){
          scope.isTabActive = true;
        } else {
          scope.isTabActive = false;
        }
    });


    /////////////////////////////////////////
    // check if browser window has focus
    var notIE = (document.documentMode === undefined),
        isChromium = window.chrome;

    if (notIE && !isChromium) {
      // checks for Firefox and other  NON IE Chrome versions
      window.addEventListener("focusin", function (event) {
        scope.isTabActive = true;
      }, false);

      window.addEventListener("focusout", function (event) {
        scope.isTabActive = false;
      }, false);

    } else {
      // checks for IE and Chromium versions
      if (window.addEventListener) {
        // bind focus event
        window.addEventListener("focus", function (event) {
          scope.isTabActive = true;
        }, false);

        // bind blur event
        window.addEventListener("blur", function (event) {
          scope.isTabActive = false;
        }, false);
      } else {
        // bind focus event
        window.attachEvent("focus", function (event) {
          scope.isTabActive = true;
        });

        // bind focus event
        window.attachEvent("blur", function (event) {
          scope.isTabActive = false;
        });
      }
    }
  }

};
