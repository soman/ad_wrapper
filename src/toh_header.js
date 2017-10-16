var predefinedSlots = require('./inc/predefined_slots'),
    googleHelper    = require('./inc/googleHelper'),
    domainConf    = require('./inc/domainConf'),
    miscHelper    = require('./inc/miscHelper'),
    refreshHelper    = require('./inc/refreshHelper'),
    configuration   = require('./inc/configuration');

window.tohAdWrapper = {

  slots: [],
  pushQueues: [],
  allAdDivId: [],
  displayQueues: [],
  customParam: {},

  override_conf: function( conf ){
    configuration.override( conf );
  },

  push: function (adName, adId, opts) {

    // Collect ad blocker data
    this.collectAdBlockerData(adName, adId, opts);

    var slotInfo = predefinedSlots.getSlot( adName );
    if( slotInfo === false )
      return '';

    this.customParam[adId] = {};
    if( typeof opts === "object" ) {
      if(adName == "half_page") {
        window.top.half_page_key_val = opts;
      } else if(adName == "medium_rectangle") {
        window.top.medium_rectangle_key_val = opts;
      } else if(adName == "horizontal_slider") {
        window.top.horizontal_slider_key_val = opts;
      }

      this.customParam[adId] = opts;
    }

    domainConf.overrideConf();
    //headerBiddingConf.hbInit();
    googleHelper.dfpInit();
    miscHelper.init();
    refreshHelper.init();

    // Check configuration for ad calling enable/disable
    if ( configuration.get['ad_disable']) return "";

    if(st_debug) {
      console.log("calling main push method for "+adId);
    }

    this.allAdDivId[adId] = adName;

    if(domainConf.isReadyDomainConf) {
      this.defineSlot(adName, adId);
    } else {
      this.pushQueues[adId] = adName;
    }
  },

  display: function (adId) {

    var curThis = this;
    // Check configuration for ad calling enable/disable
    if ( configuration.get('ad_disable') ) return "";

    if(st_debug) {
      console.log("calling main display method for "+adId);
    }

    if(domainConf.isReadyDomainConf) {
      if(configuration.values.prebid_conflict) {
        var pushQueues = tohAdWrapper.pushQueues;
        var adName = pushQueues[adId];

        if(typeof adName === "undefined") {
          adName = tohAdWrapper["allAdDivId"][adId];
        }

        if(googleHelper.willAdRefresh(adId)) {
          googleHelper.renderIframeAd(adId, adName);
        }
      } else {
        googleHelper.cmdDisplay( adId );
      }
    } else {
      this.displayQueues[adId] = adId;
    }
  },

  defineSlot: function (adName, adId) {

    var slotInfo = predefinedSlots.getSlot(adName);

    this.slots[adId] = {
      "ad_name": adName,
      "slot_name": slotInfo.getName(),
      "network_path": slotInfo.getNetworkPath(),
      "ad_size": {
        "desk": slotInfo["slot"]["desk"],
        "tab": slotInfo["slot"]["tab"],
        "mob": slotInfo["slot"]["mob"]
      }
    };

    var domain = window.location.hostname;

    googleHelper.cmdPush( {
      adName: adName,
      adId: adId,
      domain_name: domain,
      slotSize: slotInfo.getAttr(device_type)
    });

  },

  processData: function(adId) {
    var adWrapper = document.getElementById(adId);
    adWrapper.classList.add("toh-ad-wrapper");
    adWrapper.style = "position: relative;";

    refreshHelper.refreshSlotData[adId] = {
      "inViewTime": 0,
      "nextRefresh": refreshHelper.refreshTime,
      "refreshTime": refreshHelper.refreshTime,
      "renderCount": 1,
      "hoverTime": 0,
      "stopRefresh": 0,
      "isAdRender": 0
    };

/*    googleHelper.lazyLoadData[adId] = {
      "lazyLoad": 0
    };

    googleHelper.hoverData[adId] = {
      "isHover": false
    };*/
  },

  checkIframeType: function(iframe_src) {
    if( typeof iframe_src == "undefined" ) return true;
    if( iframe_src.search("tpc.googlesyndication.com") == -1 ) return true;
    return false;
  },

  processIframeLoad: function(event) {
    var adId = event.currentTarget.id,
        adWrapper = document.getElementById(adId),
        //adWrapper = document.getElementById("test_iframe_ad"),
        total_iframe = adWrapper.querySelectorAll("iframe"),
        iframe_length = total_iframe.length;

    if(iframe_length > 0) {
      var src1 = tohAdWrapper.checkIframeType( adWrapper.getElementsByTagName("iframe")[0].src );
      var src2 = tohAdWrapper.checkIframeType( adWrapper.getElementsByTagName("iframe")[iframe_length-1].src );

      if(src1 && src2) {
        var refresh_time_wrap = adWrapper.getElementsByTagName("iframe")[0].contentDocument.querySelector(".refresh_time_wrap");

        if(refresh_time_wrap !== null) {
          var data_refresh_time  = refresh_time_wrap.getAttribute("data-refresh-time");
          var data_stop_ad  = refresh_time_wrap.getAttribute("data-stop-ad");

          refreshHelper.refreshSlotData[adId]["nextRefresh"] = parseInt( data_refresh_time );
          refreshHelper.refreshSlotData[adId]["refreshTime"] = parseInt( data_refresh_time );
          refreshHelper.refreshSlotData[adId]["stopRefresh"] = parseInt( data_stop_ad );
        }
      }

    }
  },

  processIframe: function(adId) {
    var adWrapper = document.getElementById(adId);
    adWrapper.addEventListener( "load", this.processIframeLoad, true );
  },

  collectAdBlockerData: function(adName, adId, opts) {
    if(adName == "half_page" && top_level_domain == "georgiamls.com") {
    //if(adName == "half_page" && top_level_domain == "thisoldhouse.com") {

      var getUrl = window.location;
      var baseUrl = getUrl.protocol + "//" + getUrl.host;
      var win_width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      var win_height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      var user_agent = navigator.userAgent;

      googletag.cmd.push(function() {
        if(isTohWrapperAdBlock) {
          var jip = new XMLHttpRequest();
          jip.open("POST", "https://jsonip.com/?callback", true);
          jip.onreadystatechange = function() {
            var client_ip = "";
            if (jip.readyState == 4 && jip.status == 200) {
             var jip_res = eval("(function(){return " + jip.responseText + ";})()");
              client_ip = jip_res.ip;
              var creative_width = "300";
              var creative_height = "600";
              var full_url = getUrl.pathname;

              var parameters = 'window_width='+win_width+'&window_height='+win_height+'&full_url='+full_url+'&user_agent='+user_agent+'&client_ip='+client_ip+'&op_type=insert';

              var rr = new XMLHttpRequest();
              rr.open("POST", "https://stage.thisoldhouse.com/ad_debug/save_ad_block_data.php?"+parameters, true);
              rr.send();
            }
          }
          jip.send();
        }
      });
    }
  }

};


