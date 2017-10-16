var configuration = require('./configuration'),
    sha1Helper = require('./sha1Helper'),
    predefinedSlots = require('./predefined_slots');

module.exports = {

  disableDfpInitialLoad: false,
  dfpSlots: [],
  processUnit: [],
  lazyLoadData: {},
  hoverData: {},
  lazyload_viewport_buffer: 50,
  disable_lazyload: false,
  header_bidder_disable: false,
  dfpInit : function(){

    if( this.disableDfpInitialLoad ) return;

    this.disableDfpInitialLoad = true;

    googletag.cmd.push(function () {
      googletag.pubads().disableInitialLoad();
    });
  },

  cmdPush: function( info ){
    var define_slot = '',
        scope = this;

    googletag.cmd.push(function () {
      size_mapping = scope.sizeMap( info.adName );

      slotPath = configuration.getSlotPath();

      if(typeof tohAdWrapper.slots[info.adId] !== "undefined") {
        netSlotPath = tohAdWrapper.slots[info.adId]["network_path"];
        if(netSlotPath !== 0) {
          slotPath = netSlotPath;
        }
      }

      define_slot = googletag.defineSlot( slotPath, info.slotSize, info.adId )
        .defineSizeMapping(size_mapping)
        .setTargeting("AdType", info.adName)
        //.setTargeting("DIVID", info.adId)
        .setTargeting("TLD", top_level_domain)
        .setTargeting("Domain", info.domain_name)
        .addService(googletag.pubads());

      scope.attachSetTargeting(define_slot, info.adId);
      scope.addPageKeyValue(define_slot);
      scope.addPageUrlKeyValue(define_slot);
      scope.setDfpCategoryExclusion(define_slot);
      scope.setInViewKeyValue(define_slot, info.adId);

      googletag.pubads().enableAsyncRendering();
      googletag.pubads().collapseEmptyDivs();
      googletag.enableServices();

      scope.dfpSlots[info.adId] = define_slot;
    });
  },

  sizeMap: function (adName) {
    var slotInfo = predefinedSlots.getSlot( adName ),
      size_map = slotInfo.getAttr("size_map"),
      size_mapping = "";

    googletag.cmd.push(function () {
      size_mapping = googletag.sizeMapping();

      size_map.forEach(function (value) {
        size_mapping = size_mapping.addSize(value[0], value[1]);
      });

      size_mapping = size_mapping.build();
    });

    return size_mapping;
  },

  processMouseMovement: function(adId) {
    this.checkMouseOver(adId);
    this.checkMouseOut(adId);
  },

  checkMouseOver: function(adId) {
    var scope = this,
        adWrapper = document.getElementById(adId);
    adWrapper.addEventListener("mouseover", function( event ) {
      scope.hoverData[adId]["isHover"] = true;
    }, false);
  },

  checkMouseOut: function(adId) {
    var scope = this,
        adWrapper = document.getElementById(adId);
    adWrapper.addEventListener("mouseout", function( event ) {
      scope.hoverData[adId]["isHover"] = false;
    }, false);
  },

  cmdDisplay: function( adId ){
    var scope = this;

    scope.lazyLoadData[adId] = {
      "lazyLoad": 0
    };

    scope.hoverData[adId] = {
      "isHover": false
    };

    scope.processMouseMovement(adId);
    tohAdWrapper.processData(adId);
    tohAdWrapper.processIframe(adId);

    googletag.cmd.push(function () {
      googletag.display(adId);

      // Refresh this slot by adId
      if(scope.willAdRefresh(adId)) {
        scope.refreshSlot(adId);
      }
    })

  },

  attachSetTargeting: function (define_slot, adId) {
    // Refresh key/value
    define_slot.setTargeting("REFRESH", "0");

    var add_key = configuration.get('add_key');

    for (var key in add_key) {
      if( ! add_key.hasOwnProperty(key) ) continue;
      var value = add_key[key];
      define_slot.setTargeting(value[0], value[1]);
    }

    // Custom key value
    if(typeof tohAdWrapper.customParam[adId]["key_value"] === "object") {
      var customKeyVal = tohAdWrapper.customParam[adId]["key_value"];

      for (var key in customKeyVal) {
        if( ! customKeyVal.hasOwnProperty(key) ) continue;
        var value = customKeyVal[key];
        define_slot.setTargeting(key, value);
      }
    }
  },

  addPageKeyValue: function (define_slot) {
    var page_add_key = configuration.get('page_add_key');

    for (var key in page_add_key) {
      if( ! page_add_key.hasOwnProperty(key) ) continue;
      var value = page_add_key[key];
      define_slot.setTargeting(value[0], value[1]);
    }

  },

  addPageUrlKeyValue: function (define_slot) {
    var url = window.location.pathname;
    define_slot.setTargeting("FURL", url);

    if(url.length > 40) {
      var url = sha1Helper.getSha1(url);
      define_slot.setTargeting("SURL", url);
    }

  },

  setDfpCategoryExclusion: function (define_slot) {
    var exclusion_cat = configuration.get('exclusion_cat');

    for (var key in exclusion_cat) {
      if( ! exclusion_cat.hasOwnProperty(key) ) continue;
      define_slot.setCategoryExclusion(exclusion_cat[key]);
    }

    var exclusion_url = configuration.get('exclusion_url');
    var item = 1;
    for (var key in exclusion_url) {
      if( ! exclusion_url.hasOwnProperty(key) ) continue;
      //define_slot.setCategoryExclusion(exclusion_url[key]);
      var keyName = "URL"+item;
      define_slot.setTargeting(keyName, exclusion_url[key]);
      item++;
    }
  },

  setInViewKeyValue: function(define_slot, adId) {
    if (typeof document.getElementById(adId) !== 'undefined' && document.getElementById(adId) !== null) {
      var adWrapper = document.getElementById(adId),
          adTopPos = adWrapper.offsetTop,
          ad_height = document.getElementById(adId).clientHeight,
          adMidPos = adTopPos + ad_height/2;

      if( adMidPos <= win_height ) {
        define_slot.setTargeting("INVIEW", 1);
      }
    }
  },

  refreshSlot2: function (adId) {
/*      console.log("refreshSlot2");
    console.log(adId + " in refreshSlot2");*/
  },

  willAdRefresh: function (adId) {

    if (typeof document.getElementById(adId) === 'undefined' || document.getElementById(adId) === null) return false;
    var adWrapper = document.getElementById(adId);

    if(typeof this.lazyLoadData[adId] !== "undefined" && this.lazyLoadData[adId]["lazyLoad"] == 1 ) {
      return false;
    }

    if(this.disable_lazyload) {
      this.lazyLoadData[adId] = { "lazyLoad": 1 };
      return true;
    }

    if(isInIframe) {
      var win_height = winTopPos.innerHeight
          || winTopPos.document.documentElement.clientHeight
          || winTopPos.document.body.clientHeight;

      var scrollPageY = winTopPos.scrollY  || winTopPos.pageYOffset || winTopPos.document.documentElement.scrollTop;

      var lazyload_viewport_buffer  = this.lazyload_viewport_buffer,
          lazyLoadBuffer = parseInt((win_height*lazyload_viewport_buffer) / 100);

      window.lazyLoadBuffer = lazyLoadBuffer;

      var adOfffsetTop = document.getElementById(adId).getBoundingClientRect().top,
          offfsetTop = winTopIframeYOffset + adOfffsetTop,
          checkTop = scrollPageY - lazyLoadBuffer,
          checkBottom = scrollPageY + lazyLoadBuffer + win_height;

      if(toh_lazyload) {
        console.log("winTopIframeYOffset for "+adId);
        console.log(winTopIframeYOffset);
        console.log("adOfffsetTop for "+adId);
        console.log(adOfffsetTop);
        console.log("offfsetTop for "+adId);
        console.log(offfsetTop);
        console.log("checkTop for "+adId);
        console.log(checkTop);
        console.log("checkBottom for "+adId);
        console.log(checkBottom);
      }

    } else {
      var win_height = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;

      var scrollPageY =
          window.scrollY
       || window.pageYOffset
       || document.documentElement.scrollTop;

      var lazyload_viewport_buffer  = this.lazyload_viewport_buffer,
          lazyLoadBuffer = parseInt((win_height*lazyload_viewport_buffer) / 100);

      window.lazyLoadBuffer = lazyLoadBuffer;

      var offfsetTop = scrollPageY + document.getElementById(adId).getBoundingClientRect().top,
          checkTop = scrollPageY - lazyLoadBuffer,
          checkBottom = scrollPageY + lazyLoadBuffer + win_height;
    }

    if(offfsetTop >= checkTop && offfsetTop <= checkBottom) {
      //this.lazyLoadData[adId]["lazyLoad"] = 1;
      this.lazyLoadData[adId] = { "lazyLoad": 1 };

      return true;
    }

    return false;
  },

  refreshSlot: function (adId) {
    slots_info = tohAdWrapper.slots;

    if(st_debug) {
      console.log("Calling refresh method for "+adId);
    }

    if(typeof slots_info[adId] == "undefined" || typeof slots_info[adId]["slot_name"] == "undefined") {
      //console.log("TOH DEBUG: Ad calling declaration is wrong for " + adId);
      return "";
    }

    var slot_name = slots_info[adId]["slot_name"];

    if(typeof configuration.values.hb_slot_config == "undefined" || this.header_bidder_disable === true) {
      this.refreshSlotWithoutPrebid(adId);
    } else {
      if(typeof configuration.values.hb_slot_config[slot_name] == "undefined") {
        this.refreshSlotWithoutPrebid(adId);
      } else {
        this.refreshSlotWithPrebid(adId);
      }
    }
  },

  refreshSlotWithoutPrebid: function (adId) {
    var scope = this;

    if(st_debug) {
      console.log("calling refreshSlotWithoutPrebid method");
    }

    googletag.cmd.push(function () {
      var slot = scope.dfpSlots[adId];
      var track_id = Math.random().toString(36).substr(2, 16);
      slot.setTargeting("sttrackid", track_id);

      googletag.pubads().refresh([slot], {changeCorrelator: false});
    });
  },

  refreshSlotWithPrebid: function (adId) {
    var scope = this;

    if(st_debug) {
      console.log("calling refreshSlotWithPrebid method");
    }


    googletag.cmd.push(function() {
      pbjs.que.push(function() {
        var slot = scope.dfpSlots[adId];

        var track_id = Math.random().toString(36).substr(2, 16);
        slot.setTargeting("sttrackid", track_id);

        var ad_unit_code = slot.getSlotElementId();

        var slots_info = tohAdWrapper.slots,
            ad_name = slots_info[adId]["ad_name"];

        if(typeof scope.processUnit[adId] === "undefined") {
          scope.processUnit[adId] = 1;
          scope.processAdUnits(ad_name, adId, ad_unit_code);
        }

/*        if(toh_debug) {
          if (!pbjs.isCalledAdUnitBidsBack) {
            pbjs.isCalledAdUnitBidsBack = true;
            pbjs.addCallback('adUnitBidsBack', function (bidValue) {
              var msg = "===== toh_debug: Bid Value =====";
              console.log(msg);
              console.log(bidValue);
            });
          }
        }*/

        pbjs.setPriceGranularity("dense");

        pbjs.requestBids({
         timeout: PREBID_TIMEOUT,
         adUnitCodes: [adId],
         bidsBackHandler: function() {
          var getWonBid = pbjs.getHighestCpmBids([adId]);

          if(typeof getWonBid[0] !== "undefined" && typeof getWonBid[0]["bidder"] !== "undefined") {
            var getWonBidder = getWonBid[0]["bidder"];
            var tld_hb_bidder = top_level_domain+"_"+getWonBidder;
            slot.setTargeting("tld_hb_bidder", tld_hb_bidder);
          }

          pbjs.setTargetingForGPTAsync([adId]);
          googletag.pubads().refresh([slot], {changeCorrelator: false});
         }
        });
      });

    });


  },

  processAdUnits: function(ad_name, adId, ad_unit_code) {
    if(configuration.values.prebid_enable) {
      if(st_debug) {
        console.log("Calling processAdUnits method for "+adId);
      }
      var bid_config = configuration.values.hb_slot_config;
      var bidIdKey = {
        "appnexus": "placementId",
        "sovrn": "tagid",
        "sonobi": "ad_unit"
        };

      var hb_adapter_list = configuration.values.hb_adapter_list,
          slots_info = tohAdWrapper.slots,
          slot_name = slots_info[adId]["slot_name"],
          ad_name = slots_info[adId]["ad_name"],
          slot_size = slots_info[adId]["ad_size"][device_type],
          slot_name_key = this.getSlotNameKey(slot_name),
          bid_array = new Array();

      for (var k in hb_adapter_list) {
        if( ! hb_adapter_list.hasOwnProperty(k) ) continue;
        var v = hb_adapter_list[k];
        // Loop will be continue if adapter name is available in hb_adapter_list but not configured in slot object
        if(typeof bid_config[slot_name_key] === "undefined") continue;
        if(typeof bid_config[slot_name_key][v] === "undefined") continue;

        var bid_value = bid_config[slot_name_key][v][device_type];
        for (var key in bid_value) {
          if( ! bid_value.hasOwnProperty(key) ) continue;
          var value = bid_value[key];
          var paramKey = bidIdKey[v];
          var paramObj = {};

          if( typeof value === 'object') {
            var paramValue = {};
            for (var key2 in value) {
              if( ! value.hasOwnProperty(key2) ) continue;
              var value2 = value[key2];
              if(key2 == "cp" || key2 == "ct") {
                value2 = parseInt(value2);
              }
              paramValue[key2] = value2;
            }

            paramObj = paramValue;
          } else {
            paramObj[paramKey] = value;
          }

          var bidObj = {
              bidder: v,
              params: paramObj
          };

          bid_array.push(bidObj);
        }

      }

      var adUnits = [{
          code: adId,
          sizes: slot_size,
          bids: bid_array
      }];

      googletag.cmd.push(function() {
        pbjs.que.push(function() {
          pbjs.addAdUnits(adUnits);
          if(toh_debug) {
            var msg = "===== adUnits processing for "+ad_name+" =====";
            console.log(msg);
            console.log(adUnits);
          }
        });
      });
    }
    //return adUnits;
  },

  getSlotNameKey: function(slot_name) {
    if(slot_name.indexOf("widget_ad_") != -1) {
      slot_name_key = "widget_ad_global";
    } else if(slot_name.indexOf("step_ad_") != -1) {
      slot_name_key = "step_ad_global";
    } else if(slot_name.indexOf("rightrail_ad_300_600_2") != -1) {
      slot_name_key = "rightrail_ad_300_600_2_slot";
    } else if(slot_name.indexOf("gallery_popup_ad_300_600_slot") != -1) {
      slot_name_key = "gallery_popup_ad_300_600_slot";
    } else {
      slot_name_key = slot_name;
    }

    return slot_name_key;
  },

  renderIframeAd: function(adId, adName) {
    var adWidthHeight = configuration.adWidthHeight,
        adWidth = adWidthHeight[adName]["width"][device_type],
        adHeight = adWidthHeight[adName]["height"][device_type];

    var key_val_pair = TOH_JSON.stringify(tohAdWrapper.customParam[adId]);

    elemItem = document.getElementById(adId);
    //elemItem.style.display = "none";

    var iframeHtml = '<!DOCTYPE html>'
                   + '<html>'
                   + '<head>'
                   + '<script src="https://www.thisoldhouse.com/ad-wrapper-iframe/toh_header_iframe.js"></script>'
                   //+ '<script src="http://sm.thisoldhouse.com/ad-wrapper-iframe/toh_header_iframe.js"></script>'
                   + '</head>'
                   + '<body style="padding: 0; margin: 0;">'
                   + '<div id="'+adId+'">'
                   + '<script type="text/javascript">'
                   + 'tohAdWrapper.push("'+adName+'", "'+adId+'", '+key_val_pair+');'
                   + 'tohAdWrapper.display("'+adId+'");'
                   + '</script>'
                   + '</div>'
                   + '</body>'
                   + '</html>';

    var iframe = document.createElement('iframe');
        iframe.setAttribute("id", adId);
        iframe.setAttribute("width", adWidth);
        iframe.setAttribute("height", adHeight);
        iframe.setAttribute("scrolling", "no");
        iframe.style.border = 0;

    elemItem.appendChild(iframe);
    iframe.contentWindow.document.open('text/html', 'replace');
    iframe.contentWindow.document.write(iframeHtml);
    iframe.contentWindow.document.close();
  },

  refreshAdOnScrollResize: function() {
    var scope = this;
    var allAdDivId = tohAdWrapper.allAdDivId;
    for (var key in allAdDivId) {
      if( ! allAdDivId.hasOwnProperty(key) ) continue;
      if(scope.willAdRefresh(key)) {
        if(configuration.values.prebid_conflict) {
          var adName = allAdDivId[key];
          var adId = key;
          scope.renderIframeAd(adId, adName);
        } else {
          scope.refreshSlot(key);
        }
      }
    }

  }

};

