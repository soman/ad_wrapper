/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var predefinedSlots = __webpack_require__(1),
	    googleHelper    = __webpack_require__(2),
	    domainConf    = __webpack_require__(5),
	    miscHelper    = __webpack_require__(7),
	    refreshHelper    = __webpack_require__(6),
	    configuration   = __webpack_require__(3);

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




/***/ },
/* 1 */
/***/ function(module, exports) {

	var slots = {
	  'leaderboard': {
	    'desk': [728, 90],
	    'tab': [728, 90],
	    'mob': [320, 50],
	    'size_map': [
	      [
	        [320, 50],
	        [320, 50]
	      ],
	      [
	        [728, 90],
	        [728, 90]
	      ]
	    ],
	    'slot_name': 'top_leader_board_ad_slot'
	  },
	  'mobile_leaderboard': {
	    'desk': [320, 50],
	    'tab': [320, 50],
	    'mob': [320, 50],
	    'size_map': [
	      [
	        [320, 50],
	        [320, 50]
	      ]
	    ],
	    'slot_name': 'top_leader_board_ad_slot'
	  },
	  'large_leaderboard': {
	    'desk': [970, 90],
	    'tab': [728, 90],
	    'mob': [320, 50],
	    'size_map': [
	      [
	        [320, 50],
	        [320, 50]
	      ],
	      [
	        [728, 90],
	        [728, 90]
	      ],
	      [
	        [970, 90],
	        [970, 90]
	      ]
	    ],
	    'slot_name': 'parallax_ad_slot'
	  },
	  'billboard': {
	    'desk': [970, 250],
	    'tab': [300, 250],
	    'mob': [300, 250],
	    'size_map': [
	      [
	        [300, 200],
	        [300, 250]
	      ],
	      [
	        [970, 200],
	        [970, 250]
	      ]
	    ],
	    'slot_name': 'parallax_ad_slot'
	  },
	  'medium_rectangle': {
	    'desk': [300, 250],
	    'tab': [300, 250],
	    'mob': [300, 250],
	    'size_map': [
	      [
	        [300, 200],
	        [300, 250]
	      ]
	    ],
	    'slot_name': 'rightrail_ad_300_250_1_slot'
	  },
	  'half_page': {
	    'desk': [300, 600],
	    'tab': [300, 600],
	    'mob': [300, 600],
	    'size_map': [
	      [
	        [300, 400],
	        [300, 600]
	      ]
	    ],
	    'slot_name': 'rightrail_ad_300_600_1_slot'
	  },
	  'skyscraper': {
	    'desk': [160, 600],
	    'tab': [160, 600],
	    'mob': [160, 600],
	    'size_map': [
	      [
	        [160, 400],
	        [160, 600]
	      ]
	    ],
	    'slot_name': 'skyscraper_slot'
	  },
	  'text_link': {
	    'desk': [300, 250],
	    'tab': [300, 250],
	    'mob': [300, 250],
	    'size_map': [
	      [
	        [300, 200],
	        [300, 250]
	      ]
	    ],
	    'slot_name': 'text_link_slot',
	    'network_path': '142694468/MOV/text_link'
	  },
	  'horizontal_slider': {
	    'desk': [600, 400],
	    'tab': [600, 400],
	    'mob': [600, 400],
	    'size_map': [
	      [
	        [600, 300],
	        [600, 400]
	      ]
	    ],
	    'slot_name': 'horizontal_slider_slot'
	  }
	};

	module.exports = {
	  slots: slots,
	  getSlot: function( name ){

	    if( this.slots[ name ] === undefined )
	      return false;

	    return {
	      slot : this.slots[ name ],
	      getName: function(){
	        return this.slot['slot_name'];
	      },
	      getNetworkPath: function(){
	        if(typeof this.slot['network_path'] !== "undefined")
	          return this.slot['network_path'];
	        return 0;
	      },
	      getAttr: function( attr ){
	        return this.slot[ attr ];
	      }
	    }
	  }
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var configuration = __webpack_require__(3),
	    sha1Helper = __webpack_require__(4),
	    predefinedSlots = __webpack_require__(1);

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



/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = {
	  values: {
	    'dfp_account': 142694468,
	    "add_key": [],
	    //"exclusion_cat": ["Alcohol", "Anti-Aging", "Apartment Sites", "Biotech & Pharmaceutical", "Black magic, Astrology & Exoteric", "Body art", "Cartoons", "Cosmetic procedures & Body modifications", "Dating", "Drugs & Supplements", "Expandable", "Firearms/Guns", "Fitness", "Fun & Trivia", "Gambling", "Humor & Jokes", "Hygiene & Toiletries", "Internet software & Web goodies", "Auto Sound Ads", "Offbeat", "Page takeovers", "Pet breeding", "Plastic surgery", "Politics", "Pop unders", "Pop ups", "Real Estate", "References to sex & Sexuality", "Religion", "Ringtones & Downloadable", "Sexual & Reproductive health", "Skin conditions & Skin health", "Smoking & Smoking cessation", "Spa & Medical spa", "Tobacco", "Underwear", "Video games (casual & online)", "Weight loss/Diet"],
	    "exclusion_cat": [],
	    "exclusion_url": [],
	    'hb_slot_config': "",
	    'hb_adapter_list': ["aol", "appnexus", "brealtime", "criteo", "districtmDMX", "pulsepoint", "rubicon", "sekindoUM", "sekindoapn", "sonobi", "sovrn", "yieldbot", "indexExchange", "springserve", "sharethrough", "conversant"],
	    'page_add_key': [],
	    'prebid_conflict': false,
	    'ex_dmp_pixel': false,
	    'js_entranceway': false,
	    'ad_disable': false,
	    'feed_status': false,
	    'prebid_enable': true,
	    'iframe_lazyload': false
	  },

	/*  values: {
	    'dfp_account': 123456,
	    "add_key": [["key1", "val1"], ["key2", "val2"]],
	    "exclusion_cat": ["cat1", "cat2"],
	    'hb_slot_config': "",
	    'hb_adapter_list': ["appnexus", "sovrn", "pulsepoint", "sonobi"],
	    'page_add_key': [],
	    'ad_disable': false
	  },*/

	  override: function ( conf ) {
	    Object.assign(this.values, conf);
	  },

	  getSlotPath: function () {
	    return "/142694468/MOV";
	  },

	  get: function( name ){
	    return this.values[ name ];
	  },

	  adWidthHeight:{
	    "leaderboard": {
	      "height": {
	        "mob": 50,
	        "tab": 90,
	        "desk": 90
	      },
	      "width": {
	        "mob": 320,
	        "tab": 729,
	        "desk": 729
	      }
	    },
	    "mobile_leaderboard": {
	      "height": {
	        "mob": 50,
	        "tab": 50,
	        "desk": 50
	      },
	      "width": {
	        "mob": 320,
	        "tab": 320,
	        "desk": 320
	      }
	    },
	    "large_leaderboard": {
	      "height": {
	        "mob": 50,
	        "tab": 90,
	        "desk": 90
	      },
	      "width": {
	        "mob": 320,
	        "tab": 729,
	        "desk": 971
	      }
	    },
	    "billboard": {
	      "height": {
	        "mob": 250,
	        "tab": 250,
	        "desk": 250
	      },
	      "width": {
	        "mob": 300,
	        "tab": 300,
	        "desk": 971
	      }
	    },
	    "medium_rectangle": {
	      "height": {
	        "mob": 250,
	        "tab": 250,
	        "desk": 250
	      },
	      "width": {
	        "mob": 300,
	        "tab": 300,
	        "desk": 300
	      }
	    },
	    "half_page": {
	      "height": {
	        "mob": 600,
	        "tab": 600,
	        "desk": 600
	      },
	      "width": {
	        "mob": 300,
	        "tab": 300,
	        "desk": 300
	      }
	    },
	    "skyscraper": {
	      "height": {
	        "mob": 600,
	        "tab": 600,
	        "desk": 600
	      },
	      "width": {
	        "mob": 160,
	        "tab": 160,
	        "desk": 160
	      }
	    },
	    "text_link": {
	      "height": {
	        "mob": 250,
	        "tab": 250,
	        "desk": 250
	      },
	      "width": {
	        "mob": 300,
	        "tab": 300,
	        "desk": 300
	      }
	    },
	    "horizontal_slider": {
	      "height": {
	        "mob": 400,
	        "tab": 400,
	        "desk": 400
	      },
	      "width": {
	        "mob": 600,
	        "tab": 600,
	        "desk": 600
	      }
	    }
	  }

	};


/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = {
	  getSha1: function (msg) {
	    function rotate_left(n,s) {
	        var t4 = ( n<<s ) | (n>>>(32-s));
	        return t4;
	    };
	    function lsb_hex(val) {
	        var str="";
	        var i;
	        var vh;
	        var vl;
	        for( i=0; i<=6; i+=2 ) {
	            vh = (val>>>(i*4+4))&0x0f;
	            vl = (val>>>(i*4))&0x0f;
	            str += vh.toString(16) + vl.toString(16);
	        }
	        return str;
	    };
	    function cvt_hex(val) {
	        var str="";
	        var i;
	        var v;
	        for( i=7; i>=0; i-- ) {
	            v = (val>>>(i*4))&0x0f;
	            str += v.toString(16);
	        }
	        return str;
	    };
	    function Utf8Encode(string) {
	        string = string.replace(/\r\n/g,"\n");
	        var utftext = "";
	        for (var n = 0; n < string.length; n++) {
	            var c = string.charCodeAt(n);
	            if (c < 128) {
	                utftext += String.fromCharCode(c);
	            }
	            else if((c > 127) && (c < 2048)) {
	                utftext += String.fromCharCode((c >> 6) | 192);
	                utftext += String.fromCharCode((c & 63) | 128);
	            }
	            else {
	                utftext += String.fromCharCode((c >> 12) | 224);
	                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
	                utftext += String.fromCharCode((c & 63) | 128);
	            }
	        }
	        return utftext;
	    };
	    var blockstart;
	    var i, j;
	    var W = new Array(80);
	    var H0 = 0x67452301;
	    var H1 = 0xEFCDAB89;
	    var H2 = 0x98BADCFE;
	    var H3 = 0x10325476;
	    var H4 = 0xC3D2E1F0;
	    var A, B, C, D, E;
	    var temp;
	    msg = Utf8Encode(msg);
	    var msg_len = msg.length;
	    var word_array = new Array();
	    for( i=0; i<msg_len-3; i+=4 ) {
	        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
	        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
	        word_array.push( j );
	    }
	    switch( msg_len % 4 ) {
	        case 0:
	            i = 0x080000000;
	        break;
	        case 1:
	            i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
	        break;
	        case 2:
	            i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
	        break;
	        case 3:
	            i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8    | 0x80;
	        break;
	    }
	    word_array.push( i );
	    while( (word_array.length % 16) != 14 ) word_array.push( 0 );
	    word_array.push( msg_len>>>29 );
	    word_array.push( (msg_len<<3)&0x0ffffffff );
	    for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
	        for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
	        for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
	        A = H0;
	        B = H1;
	        C = H2;
	        D = H3;
	        E = H4;
	        for( i= 0; i<=19; i++ ) {
	            temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
	            E = D;
	            D = C;
	            C = rotate_left(B,30);
	            B = A;
	            A = temp;
	        }
	        for( i=20; i<=39; i++ ) {
	            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
	            E = D;
	            D = C;
	            C = rotate_left(B,30);
	            B = A;
	            A = temp;
	        }
	        for( i=40; i<=59; i++ ) {
	            temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
	            E = D;
	            D = C;
	            C = rotate_left(B,30);
	            B = A;
	            A = temp;
	        }
	        for( i=60; i<=79; i++ ) {
	            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
	            E = D;
	            D = C;
	            C = rotate_left(B,30);
	            B = A;
	            A = temp;
	        }
	        H0 = (H0 + A) & 0x0ffffffff;
	        H1 = (H1 + B) & 0x0ffffffff;
	        H2 = (H2 + C) & 0x0ffffffff;
	        H3 = (H3 + D) & 0x0ffffffff;
	        H4 = (H4 + E) & 0x0ffffffff;
	    }
	    var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
	    return temp.toLowerCase();
	  }

	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var configuration   = __webpack_require__(3),
	    predefinedSlots = __webpack_require__(1),
	    refreshHelper   = __webpack_require__(6),
	    googleHelper    = __webpack_require__(2);

	module.exports = {
	  domainConfInitCall: false,
	  isReadyDomainConf: false,
	  overrideConf: function ( conf ) {

	    if( this.domainConfInitCall ) return;

	    this.domainConfInitCall = true;
	    var scope = this;

	    (function() {
	      var dateObj = new Date(),
	          year = dateObj.getUTCFullYear(),
	          month = dateObj.getUTCMonth() + 1,
	          day = dateObj.getUTCDate(),
	          hrs = dateObj.getUTCHours(),
	          min = dateObj.getUTCMinutes(),
	          cache_time = 30;

	      if(min % cache_time != 0) {
	        min = min - (min % cache_time);
	      }

	      var curDate = year + "" + month + "" + day + "" + hrs + "" + min;

	      var r = new XMLHttpRequest();
	      r.open("GET", "https://www.thisoldhouse.com/ad-wrapper/domain_config_new.php?dname="+top_level_domain+"&time="+curDate, true);
	      //r.open("GET", "domain_config_new.php?dname="+top_level_domain+"&time="+curDate, true);
	      r.onreadystatechange = function () {

	        if (r.readyState != 4 || r.status != 200) return;

	        try {
	          if(typeof JSON.parse === "function") {
	            var all_config = JSON.parse(r.responseText);
	          } else {
	            var all_config = eval("(function(){return " + r.responseText + ";})()");
	          }

	          if(toh_debug) {
	            console.log("all_config");
	            console.log(all_config);
	          }

	          var domain_config = all_config["domain_conf"];

	          if( typeof all_config["header_bidder_conf"] === "object" ) {
	            configuration.values.hb_slot_config = all_config["header_bidder_conf"];
	          }

	          if( typeof domain_config[top_level_domain] === "object" ) {

	            if(typeof domain_config[top_level_domain]["prebid_ga_status"] !== "undefined") {
	              window.prebid_ga_status = eval(domain_config[top_level_domain]["prebid_ga_status"]);
	            }

	            scope.processNativeOnboarding(scope, domain_config, top_level_domain);
	            scope.overrideHeaderBidderConf(domain_config, top_level_domain);
	            scope.updatePrebidAdapterListConf(domain_config, top_level_domain);
	            scope.processAdUnitsOnce(domain_config, top_level_domain);
	            scope.updateIframeVariables(scope, domain_config, top_level_domain);
	            scope.updateGlobalKeyValueConf(domain_config, top_level_domain);
	            scope.updateGlobalExclusionCatConf(domain_config, top_level_domain);
	            scope.updatePageKeyValueConf(domain_config, top_level_domain);
	            scope.sizeMapping(scope, domain_config, top_level_domain);
	            scope.overrideSizeMapping(scope, domain_config, top_level_domain);
	            scope.overrideRefreshConf(domain_config, top_level_domain);
	            scope.overrideGlobalConf(domain_config, top_level_domain);

	            // Disabled below method. It will be enable based on client respone
	            //scope.processCustomAdConf(domain_config, top_level_domain);
	          } else {
	            configuration.values.prebid_enable = false;
	          }

	          scope.checkImpressionViewable();
	          //scope.collectVideoAdData();
	          //scope.collectAdData();
	          scope.isReadyDomainConf = true;
	          scope.triggerAd();
	        } catch (e) {
	          // Collect log
	        }


	      };
	      r.send();

	    })();
	  },

	  processNativeOnboarding: function(scope, domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain]["native_onboarding"] !== "undefined" ) {
	      var native_onboarding = domain_config[top_level_domain]["native_onboarding"];

	      var advertise_img = {
	        leaderboard: "728_90.png",
	        mobile_leaderboard: "320_50.png",
	        large_leaderboard: "970_90.png",
	        billboard: "970_250.png",
	        medium_rectangle: "300_250.png",
	        half_page: "300_600.png",
	        skyscraper: "160_600.png",
	        text_link: "300_250.png",
	        horizontal_slider: "600_400.png"
	      };

	      for (var key in native_onboarding) {
	        var native_data = native_onboarding[key],
	            targetWrapper = native_data.target_wrapper,
	            adName = native_data.ads_name,
	            ad_img_name = advertise_img[adName],
	            adPos = parseInt(native_data.target_pos),
	            native_ad_inject = native_data.native_ad_inject,
	            disable_loop = native_data.disable_loop,
	            enable_ajax_content = native_data.enable_ajax_content,
	            native_ad_no = 0,
	            native_ad_status = false;


	        if(!toh_native && typeof native_ad_inject !== "undefined" && native_ad_inject == 1 ) {
	          native_ad_status = true;
	        }

	        if(toh_native) {
	          native_ad_status = true;
	        }

	        if(native_ad_status) {
	          //if(top_level_domain == "thisoldhouse.com") {
	          if(top_level_domain == "recolorado.com") {
	            window.isRCAjaxAdInjectListView = false;
	            window.isRCAjaxAdInjectGalleryView = false;
	            window.rcListViewInterval = 1000;
	            window.rcGalleryViewInterval = 1000;
	            window.refreshIntervalListView = window.setInterval(checkRCListView, window.rcListViewInterval);
	            window.refreshIntervalGalleryView = window.setInterval(checkRCGalleryView, window.rcGalleryViewInterval);

	            function checkRCListView() {
	              if(refreshHelper.isTabActive && !isRCAjaxAdInjectListView){
	                targetWrapper = "#mapsearch-results-body .r-side-list-row";
	                var rc_listview = document.querySelectorAll(targetWrapper);

	                if(rc_listview.length != 0) {
	                  var elems = document.querySelectorAll(targetWrapper);

	                  if(typeof elems.length !== "undefined" && elems.length != 0) {
	                    window.isRCAjaxAdInjectListView = true;
	                    window.isRCAjaxAdInjectGalleryView = false;
	                    window.rcListViewInterval = 99999999;

	                    var classList = elems[0].classList,
	                        item = 0;

	                    for (var i = 0; i < elems.length; ++i) {
	                      item++;
	                      if(item == adPos) {
	                        native_ad_no++;
	                        var adId = "native_ad_listview_"+native_ad_no,
	                            element = elems[i];

	                        scope.insertNativeOnboardingAd(element, adId, adName, ad_img_name, classList, native_data);
	                      }
	                    }
	                  }
	                }
	              }
	            }

	            function checkRCGalleryView() {
	              if(refreshHelper.isTabActive && !isRCAjaxAdInjectGalleryView){
	                targetWrapper = "#mapsearch-results-body .galleryview";
	                var rc_galleryview = document.querySelectorAll(targetWrapper);

	                if(rc_galleryview.length != 0) {
	                  var elems = document.querySelectorAll(targetWrapper);

	                  if(typeof elems.length !== "undefined" && elems.length != 0) {
	                    console.log("calling RC ajax content ad for galleryview");
	                    window.isRCAjaxAdInjectGalleryView = true;
	                    window.isRCAjaxAdInjectListView = false;
	                    window.rcGalleryViewInterval = 99999999;

	                    var classList = elems[0].classList,
	                        item = 0;

	                    for (var i = 0; i < elems.length; ++i) {
	                      item++;
	                      if(item == adPos) {
	                        native_ad_no++;
	                        var adId = "native_ad_galleryview_"+native_ad_no,
	                            element = elems[i];

	                        scope.insertNativeOnboardingAd(element, adId, adName, ad_img_name, classList, native_data);
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          } else if(typeof enable_ajax_content !== "undefined" && enable_ajax_content == 1) {
	            window.isAjaxContentAdInject = false;
	            window.ajaxContentInterval = 1000;
	            window.refreshIntervalAjaxContent = window.setInterval(checkAjaxContentLoaded, window.ajaxContentInterval);

	            function checkAjaxContentLoaded() {
	              if(refreshHelper.isTabActive && !isAjaxContentAdInject){
	                var ajaxContentWrapper = document.querySelectorAll(targetWrapper);

	                if(ajaxContentWrapper.length != 0) {
	                  var elems = document.querySelectorAll(targetWrapper);

	                  if(typeof elems.length !== "undefined" && elems.length != 0) {
	                    window.isAjaxContentAdInject = true;
	                    window.ajaxContentInterval = 99999999;

	                    var classList = elems[0].classList,
	                        item = 0;

	                    for (var i = 0; i < elems.length; ++i) {
	                      item++;
	                      if(item == adPos) {
	                        if(typeof disable_loop === "undefined" || disable_loop == 0) {
	                          item = 0;
	                        }

	                        native_ad_no++;
	                        var adId = "native_ad_ajax_content_"+native_ad_no,
	                            element = elems[i];

	                        if(adName == "custom_code") {
	                          scope.insertNativeAdCustomCode(element, adId, adName, native_data);
	                        } else {
	                          scope.insertNativeOnboardingAd(element, adId, adName, ad_img_name, classList, native_data);
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          } else {
	            var tw = targetWrapper.split(" "),
	                lastWrapper = tw[tw.length - 1];

	            if(lastWrapper.indexOf("#") !== -1) {
	              //var elems = document.getElementById(targetWrapper);
	              var elems = document.querySelector(targetWrapper);
	              if(elems != null) {
	                var classList = elems.classList;
	                if(adName == "custom_code") {
	                  scope.insertNativeAdCustomCode(elems, "native_ad_1", adName, native_data);
	                } else {
	                  scope.insertNativeOnboardingAd(elems, "native_ad_1", adName, ad_img_name, classList, native_data);
	                }
	              }
	            } else {
	              //var elems = document.getElementsByClassName(targetWrapper);
	              var elems = document.querySelectorAll(targetWrapper);

	              if(typeof elems.length !== "undefined" && elems.length != 0) {
	                var classList = elems[0].classList,
	                    item = 0;

	                for (var i = 0; i < elems.length; ++i) {
	                  item++;
	                  if(item == adPos) {
	                    if(typeof disable_loop === "undefined" || disable_loop == 0) {
	                      item = 0;
	                    }

	                    native_ad_no++;
	                    var adId = "native_ad_"+native_ad_no,
	                        element = elems[i],
	                        parentElement = elems[i].parentNode;
	                    if(adName == "custom_code") {
	                      scope.insertNativeAdCustomCode(element, adId, adName, native_data);
	                    } else {
	                      scope.insertNativeOnboardingAd(element, adId, adName, ad_img_name, classList, native_data);
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	    }
	  },

	  insertNativeAdCustomCode: function(element, adId, adName, native_data) {
	    if(st_debug) {
	      console.log("native onboarding debug");
	      console.log(element);
	      console.log(adId);
	    }
	    var custom_style = native_data.custom_style,
	        custom_params = native_data.custom_params;

	    var random_no = Math.floor(Math.random() * 1000) + 1;
	    adId = adName + "_" + adId + "_" + random_no;

	    var newElement = document.createElement("iframe");
	        newElement.setAttribute("width", 300);
	        newElement.setAttribute("height", 600);
	        newElement.setAttribute("scrolling", "no");
	        newElement.style.border = 0;
	        newElement.style.margin = custom_style;

	    element.parentNode.insertBefore(newElement, element.nextSibling);

	    newElement.contentWindow.document.open('text/html', 'replace');
	    newElement.contentWindow.document.write(custom_params);
	    newElement.contentWindow.document.close();
	  },

	  insertNativeOnboardingAd: function(element, adId, adName, ad_img_name, classList, native_data) {
	    if(st_debug) {
	      console.log("native onboarding debug");
	      console.log(element);
	      console.log(adId);
	    }
	    var custom_style = native_data.custom_style,
	        custom_params = native_data.custom_params;

	    var random_no = Math.floor(Math.random() * 1000) + 1;
	    adId = adName + "_" + adId + "_" + random_no;

	    var ad_img_url = "https://www.thisoldhouse.com/ad-wrapper/advertisement/" + ad_img_name;
	    // Create a new element
	    var newElement = document.createElement("div");
	    newElement.setAttribute("class", classList);
	    // Background image wrapper
	    if(native_data.enable_bg_img) {
	      newElement.innerHTML = '<div style="background-image: url('+ad_img_url+'); background-repeat: no-repeat; '+custom_style+'"><div id="'+adId+'"></div></div>';
	    } else {
	      newElement.innerHTML = '<div style="'+custom_style+'"><div id="'+adId+'"></div></div>';
	    }

	    element.parentNode.insertBefore(newElement, element.nextSibling);
	    //element.parentNode.insertBefore(newElement, element);

	    var adScript = document.createElement('script');
	    adScript.type = 'text/javascript';
	    adScript.innerHTML = 'tohAdWrapper.push("'+adName+'", "'+adId+'", '+custom_params+'); tohAdWrapper.display("'+adId+'");';
	    document.getElementById(adId).appendChild(adScript);
	  },

	  overrideHeaderBidderConf: function(domain_config, top_level_domain) {
	    var bid_config = configuration.values.hb_slot_config;

	    if( typeof domain_config[top_level_domain]["hb_id_list"] !== "undefined" ) {
	      var override_bid_config = domain_config[top_level_domain]["hb_id_list"];
	      for (var slotName in bid_config) {
	        var slotObj = bid_config[slotName];
	        for (var bidderName in slotObj) {
	          if( typeof override_bid_config[slotName][bidderName] !== "undefined" ) {
	            bid_config[slotName][bidderName] = override_bid_config[slotName][bidderName];
	          }
	        }
	      }
	    }
	  },

	  processAdUnitsOnce: function(domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain] !== "undefined" ) {
	      var bidIdKey = {
	        "appnexus": "placementId",
	        "sovrn": "tagid",
	        "sonobi": "ad_unit"
	        };

	      var bid_config = configuration.values.hb_slot_config,
	          hb_adapter_list = configuration.values.hb_adapter_list,
	          slots_info = tohAdWrapper.slots,
	          pushQueues = tohAdWrapper.pushQueues,
	          adUnits = new Array();

	      for (var adId in pushQueues) {
	        if ( pushQueues.hasOwnProperty(adId) ) {

	          var ad_name = pushQueues[adId],
	              slotInfo = predefinedSlots.getSlot(ad_name),
	              slot_name = slotInfo.getName(),
	              slot_size = slotInfo["slot"][device_type],
	              slot_name_key = googleHelper.getSlotNameKey(slot_name),
	              bid_array = new Array();

	          for(var bidder_name in hb_adapter_list) {
	            if( hb_adapter_list.hasOwnProperty(bidder_name)) {

	              var adapter_name = hb_adapter_list[bidder_name];

	              if(typeof bid_config[slot_name_key] === "undefined") continue;
	              if(typeof bid_config[slot_name_key][adapter_name] === "undefined") continue;

	              var bid_value = bid_config[slot_name_key][adapter_name][device_type];

	              for (var bid_key in bid_value) {
	                if( bid_value.hasOwnProperty(bid_key)) {
	                  var paramKey = bidIdKey[adapter_name];
	                  var paramObj = {};

	                  if( typeof bid_value[bid_key] === 'object') {
	                    var paramValue = {};
	                    var bid_param_value = bid_value[bid_key];

	                    for (var param_name in bid_param_value) {
	                      if( bid_param_value.hasOwnProperty(param_name)) {
	                        var bid_param_id = bid_param_value[param_name];
	                        if(param_name == "cp" || param_name == "ct") {
	                          bid_param_id = parseInt(bid_param_id);
	                        }
	                        paramValue[param_name] = bid_param_id;
	                      }
	                    }
	                    paramObj = paramValue;
	                  } else {
	                    paramObj[paramKey] = bid_value[bid_key];
	                  }

	                  var bidObj = {
	                      bidder: adapter_name,
	                      params: paramObj
	                  };

	                  bid_array.push(bidObj);
	                }
	              }
	            }
	          }

	          googleHelper.processUnit[adId] = 1;

	          if(typeof bid_array === "object" && Object.keys(bid_array).length != 0) {
	            var adUnit = {
	                code: adId,
	                sizes: slot_size,
	                bids: bid_array
	            };

	            adUnits.push(adUnit);
	          }
	        }
	      }
	    }

	    pbjs.que.push(function() {
	      if(toh_debug) {
	        console.log("Prebid adUnits");
	        console.log(adUnits);
	      }

	      pbjs.addAdUnits(adUnits);

	      if(toh_debug) {
	        if (!pbjs.isCalledAdUnitBidsBack) {
	          pbjs.isCalledAdUnitBidsBack = true;
	          pbjs.addCallback('adUnitBidsBack', function (bidValue) {
	            var msg = "===== toh_debug: Bid Value =====";
	            console.log(msg);
	            console.log(bidValue);
	          });
	        }
	      }

	/*      if(toh_debug) {
	        pbjs.addCallback('adUnitBidsBack', function (bidValue) {
	          var msg = "===== toh_debug: Bid Value =====";
	          console.log(msg);
	          console.log(bidValue);

	        });
	      }*/
	    });

	  },

	  getIframeElemOffset: function(elm) {
	    var xPos = 0, yPos = 0;
	    while(elm) {
	      xPos += (elm.offsetLeft - elm.scrollLeft);
	      yPos += (elm.offsetTop - elm.scrollTop);
	      elm = elm.offsetParent;
	    }

	    return { left: xPos, top: yPos };
	  },

	  updateIframeVariables: function(scope, domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain]["iframe_lazyload"] !== "undefined" ) {
	      window.isInIframe = (eval(domain_config[top_level_domain]["iframe_lazyload"]) === 1) ? true : false;
	    }

	    if(isInIframe) {
	      scope.getTopIframeYOffset(window.parent, window, scope);

	      var location_search = winTopPos.window.location.search;

	      if(location_search) {
	        var urlQueryStr = location_search;
	        if( urlQueryStr.indexOf("toh_debug") != -1) {
	          window.toh_debug = true;
	        }

	        if( urlQueryStr.indexOf("toh_counters") != -1) {
	          window.toh_counters = true;
	        }

	        if( urlQueryStr.indexOf("toh_refresh") != -1) {
	          window.toh_refresh = true;
	        }

	        if( urlQueryStr.indexOf("toh_lazyload") != -1) {
	          window.toh_lazyload = true;
	        }
	      }

	      winTopPos.addEventListener('scroll', function() {
	        googleHelper.refreshAdOnScrollResize();
	      }, true);

	    }
	  },

	  getTopIframeYOffset: function(current, previous, scope) {
	    if (typeof previous.frameElement !== 'undefined' && previous.frameElement !== null && previous.location.host == current.location.host  ) {
	      checkIframe = previous.frameElement && previous.frameElement.nodeName == "IFRAME";
	      if(checkIframe){
	        window.winTopPos = current;
	        window.winTopIframeYOffset = scope.getIframeElemOffset(previous.frameElement).top + winTopIframeYOffset;
	        scope.getTopIframeYOffset(current.parent, current, scope);
	      } else{
	        window.winTopIframeYOffset = scope.getIframeElemOffset(previous.frameElement).top + winTopIframeYOffset;
	      }
	    }
	  },

	  updateGlobalKeyValueConf: function(domain_config, top_level_domain) {
	    var add_key_orig = configuration.values.add_key;
	    if( typeof domain_config[top_level_domain]["add_key"] !== "undefined" ) {
	      var add_key = domain_config[top_level_domain]["add_key"];

	      for (var key in add_key) {
	        if( add_key.hasOwnProperty(key))
	          add_key_orig.push(
	              [key, add_key[key]]
	            );
	      }
	    }
	  },

	  updateGlobalExclusionCatConf: function(domain_config, top_level_domain) {
	    var exclusion_cat_orig = configuration.values.exclusion_cat;

	    if( typeof domain_config[top_level_domain]["exclusion_cat"] !== "undefined" ) {
	      var exclusion_cat = domain_config[top_level_domain]["exclusion_cat"];

	      for (var key in exclusion_cat) {
	        if( exclusion_cat.hasOwnProperty( key ) )
	         exclusion_cat_orig.push(
	            exclusion_cat[key]
	            );
	      }
	    }

	    var exclusion_url_orig = configuration.values.exclusion_url;

	    if( typeof domain_config[top_level_domain]["exclusion_url"] !== "undefined" ) {
	      var exclusion_url = domain_config[top_level_domain]["exclusion_url"];

	      for (var key in exclusion_url) {
	        if( exclusion_url.hasOwnProperty( key ) )
	         exclusion_url_orig.push(
	            exclusion_url[key]
	            );
	      }
	    }
	  },

	  updatePrebidAdapterListConf: function(domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain]["hb_adapter_list"] !== "undefined" ) {
	      configuration.values.hb_adapter_list = [];
	      var hb_adapter_list_orig = configuration.values.hb_adapter_list;

	      var hb_adapter_list = domain_config[top_level_domain]["hb_adapter_list"];

	      for (var key in hb_adapter_list) {
	        if( hb_adapter_list.hasOwnProperty(key) )
	         hb_adapter_list_orig.push(
	            hb_adapter_list[key]
	            );
	      }
	    }

	  },

	  updatePageKeyValueConf: function(domain_config, top_level_domain) {
	    var page_add_key_orig = configuration.values.page_add_key;
	    var page_pathname = window.location.pathname;

	    if( typeof domain_config[top_level_domain]["page_add_key"] !== "undefined" && typeof domain_config[top_level_domain]["page_add_key"][page_pathname] !== "undefined" ) {
	      var page_add_key = domain_config[top_level_domain]["page_add_key"][page_pathname];
	      for (var key in page_add_key) {
	        if( page_add_key.hasOwnProperty(key) )
	          page_add_key_orig.push(
	            [key, page_add_key[key]]
	            );
	      }
	    }
	  },

	  sizeMapping: function(scope, domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain]["size_mapping"] !== "undefined" ) {
	      var sizemapping = domain_config[top_level_domain]["size_mapping"];
	      scope.processOverrideSizeMapping(sizemapping);
	    }
	  },

	  overrideSizeMapping: function(scope, domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain]["override_sizemapping"] !== "undefined" ) {
	      var override_sizemapping = domain_config[top_level_domain]["override_sizemapping"];
	      scope.processOverrideSizeMapping(override_sizemapping);
	    }
	  },

	  processOverrideSizeMapping: function(override_sizemapping) {
	    var predefine_slots = predefinedSlots["slots"];

	    for (var key in override_sizemapping) {
	      if( ! override_sizemapping.hasOwnProperty(key) ) continue;
	      var size_map = override_sizemapping[key],
	          custom_size_map = [];

	      for (var k2 in size_map) {
	        if( ! size_map.hasOwnProperty(k2) ) continue;

	        var device_width = parseInt( Object.keys(size_map[k2]["device_size"])),
	            device_height = parseInt( Object.values(size_map[k2]["device_size"])),
	            ad_width = parseInt( Object.keys(size_map[k2]["ad_size"])),
	            ad_height = parseInt( Object.values(size_map[k2]["ad_size"]));

	        custom_size_map[k2] = [
	          [device_width, device_height],
	          [ad_width, ad_height]
	        ];
	      }

	      predefine_slots[key]["size_map"] = custom_size_map;

	    }
	  },

	  triggerAd: function() {
	    if(st_debug) {
	      console.log("calling triggerAd in toh-adwrapper");
	      console.log("prebid_conflict value in triggerAd in toh-adwrapper");
	      console.log(configuration.values.prebid_conflict);
	      console.log("TOH Debug: Start Got responsed from domain config");
	      console.log("pushQueues");
	      console.log(tohAdWrapper.pushQueues);
	      console.log("displayQueues");
	      console.log(tohAdWrapper.displayQueues);
	      console.log("TOH Debug: End Got responsed from domain config");
	    }

	    var pushQueues = tohAdWrapper.pushQueues;
	    var displayQueues = tohAdWrapper.displayQueues;

	    if(configuration.values.prebid_conflict) {
	      var delay_ad_list = new Array();
	      for (var key in pushQueues) {
	        if ( pushQueues.hasOwnProperty(key) ) {
	          var adName = pushQueues[key];
	          var adId = key;

	          if(googleHelper.willAdRefresh(adId)) {
	            if(typeof tohAdWrapper.customParam[key]["delay_time"] !== "undefined" && Number.isInteger(tohAdWrapper.customParam[key]["delay_time"])) {
	              var delay_time = eval(tohAdWrapper.customParam[adId]["delay_time"]);
	              delay_ad_list[adId] = {"adId" : adId, "adName" : adName, "deley_time": delay_time};
	            } else {
	              googleHelper.renderIframeAd(adId, adName);
	            }

	          }
	        }
	      }

	      for (var key in delay_ad_list) {
	        if( delay_ad_list.hasOwnProperty( key ) ) {
	          var adId = delay_ad_list[key]["adId"];
	          var adName = delay_ad_list[key]["adName"];
	          var deley_time = delay_ad_list[key]["deley_time"]
	          this.triggerDelayIframeAd(adId, adName, deley_time);
	        }
	      }

	    } else {
	      for (var key in pushQueues) {
	        if ( pushQueues.hasOwnProperty(key) ) {
	          tohAdWrapper.defineSlot(pushQueues[key], key);
	        }
	      }

	      var delay_ad_list = new Array();
	      for (var key in displayQueues) {
	        if( displayQueues.hasOwnProperty( key ) ) {

	          if(typeof tohAdWrapper.customParam[key]["delay_time"] !== "undefined" && Number.isInteger(tohAdWrapper.customParam[key]["delay_time"])) {
	            var delay_time = eval(tohAdWrapper.customParam[key]["delay_time"]);
	            delay_ad_list[key] = {"adId" : key, "deley_time": delay_time};
	          } else {
	            googleHelper.cmdDisplay( displayQueues[key] );
	          }

	        }
	      }

	      for (var key in delay_ad_list) {
	        if( delay_ad_list.hasOwnProperty( key ) ) {
	          var adId = delay_ad_list[key]["adId"];
	          var deley_time = delay_ad_list[key]["deley_time"]
	          this.triggerDelayAd(adId, deley_time);
	        }
	      }
	    }
	  },

	  triggerDelayIframeAd: function(adId, adName, delay_time) {
	    setTimeout(function() {
	      googleHelper.renderIframeAd(adId, adName);
	    }, delay_time * 1000);
	  },

	  triggerDelayAd: function(adId, delay_time) {
	    var displayQueues = tohAdWrapper.displayQueues;
	    setTimeout(function() {
	      googleHelper.cmdDisplay( displayQueues[adId] );
	    }, delay_time * 1000);
	  },

	  overrideRefreshConf: function(domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain]["waitActiveViewTime"] !== "undefined" ) {
	      refreshHelper.waitActiveViewTime = eval(domain_config[top_level_domain]["waitActiveViewTime"]);
	    }

	    if( typeof domain_config[top_level_domain]["refreshTime"] !== "undefined" ) {
	      refreshHelper.refreshTime = eval(domain_config[top_level_domain]["refreshTime"]);
	    }

	    if( typeof domain_config[top_level_domain]["lazyload_viewport_buffer"] !== "undefined" ) {
	      googleHelper.lazyload_viewport_buffer = eval(domain_config[top_level_domain]["lazyload_viewport_buffer"]);
	    }

	    if( typeof domain_config[top_level_domain]["disable_lazyload"] !== "undefined" && eval(domain_config[top_level_domain]["disable_lazyload"]) == 1) {
	      googleHelper.disable_lazyload = true;
	    }
	  },

	  overrideGlobalConf: function(domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain]["header_bidder_disable"] !== "undefined" ) {
	      //googleHelper.header_bidder_disable = domain_config[top_level_domain]["header_bidder_disable"];

	      // For publishe control panel
	      googleHelper.header_bidder_disable = (eval(domain_config[top_level_domain]["header_bidder_disable"]) === 1) ? true : false;
	    }

	    if(!isInIframe) {
	      if( typeof domain_config[top_level_domain]["prebid_conflict"] !== "undefined" ) {
	        if(st_debug) {
	          console.log("prebid_conflict value in toh-adwrapper");
	        }
	        configuration.values.prebid_conflict = (eval(domain_config[top_level_domain]["prebid_conflict"]) === 1) ? true : false;
	      }
	    }

	    if( typeof domain_config[top_level_domain]["ex_dmp_pixel"] !== "undefined" ) {
	      configuration.values.ex_dmp_pixel = (eval(domain_config[top_level_domain]["ex_dmp_pixel"]) === 1) ? true : false;
	      if(configuration.values.ex_dmp_pixel === true) {
	        // Exelate DMP pixel
	        window.xl8_config = { "p": 855, "g": 2 };
	        //document.addEventListener("DOMContentLoaded", function(event) {
	          var xl8_script = document.createElement("script");
	          xl8_script.src = xl8_script.src = "https://cdn.exelator.com/build/static.min.js";
	          xl8_script.type = "text/javascript";
	          xl8_script.async = true;
	          //var bodyNode = document.getElementsByTagName('body');
	          //document.body.appendChild(xl8_script);

	          var node = document.getElementsByTagName('script')[0];
	          node.parentNode.insertBefore(xl8_script, node);

	        //});
	      }
	    }

	    if( typeof domain_config[top_level_domain]["js_entranceway"] !== "undefined" ) {
	      configuration.values.js_entranceway = (eval(domain_config[top_level_domain]["js_entranceway"]) === 1) ? true : false;
	    }

	/*    if( typeof domain_config[top_level_domain]["feed_status"] !== "undefined" ) {
	      configuration.values.feed_status = (eval(domain_config[top_level_domain]["feed_status"]) === 1) ? true : false;
	      if(configuration.values.feed_status === true) {
	        var feed_script = document.createElement("script");
	        feed_script.src = "https://www.thisoldhouse.com/sites/all/modules/custom/st_feed/st_feed.js";
	        feed_script.type = "text/javascript";
	        feed_script.async = true;
	        var node = document.getElementsByTagName('script')[0];
	        node.parentNode.insertBefore(feed_script, node);
	      }
	    }*/

	  },

	  // If DFP impressionViewable event don't trigger within config waitActiveViewTime then set activeView = 0
	  checkImpressionViewable: function() {
	    var waitActiveViewTime = refreshHelper.waitActiveViewTime;

	    if(waitActiveViewTime) {
	      googletag.cmd.push(function() {

	        // DFP slotOnload event
	        googletag.pubads().addEventListener('slotOnload', function(event) {
	          var slot_id = event.slot.getSlotElementId();
	          refreshHelper.refreshSlotData[slot_id]["activeView"] = 1;
	          refreshHelper.refreshSlotData[slot_id]["isAdRender"] = 1;
	        });

	        // DFP slotRenderEnded event
	        googletag.pubads().addEventListener('slotRenderEnded', function(event) {
	          var slot_id = event.slot.getSlotElementId();

	          if(!event.isEmpty) {
	            var ad_width = event.size[0],
	                ad_height = event.size[1];

	            if(ad_width == 600 && ad_height == 400) {
	              document.getElementById(slot_id).getElementsByTagName("iframe")[0].style.width = "100%";
	            }
	          }

	          refreshHelper.refreshSlotData[slot_id]["activeView"] = 0;
	        });

	        // DFP impressionViewable event
	        googletag.pubads().addEventListener('impressionViewable', function(event) {
	          var slot_id = event.slot.getSlotElementId();
	          refreshHelper.refreshSlotData[slot_id]["activeView"] = 1;
	          refreshHelper.refreshSlotData[slot_id]["isAdRender"] = 1;
	        });

	      });
	    }
	  },

	  collectVideoAdData: function() {
	    if(top_level_domain !== "georgiamls.com") return "";
	    //if(top_level_domain !== "thisoldhouse.com") return "";
	    var getUrl = window.location;
	    var baseUrl = getUrl.protocol + "//" + getUrl.host;
	    var win_width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	    var win_height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	    var user_agent = navigator.userAgent;

	    googletag.cmd.push(function() {
	      var jip = new XMLHttpRequest();
	      jip.open("POST", "https://jsonip.com/?callback", true);
	      jip.onreadystatechange = function() {
	        var client_ip = "";
	        if (jip.readyState == 4 && jip.status == 200) {
	         var jip_res = eval("(function(){return " + jip.responseText + ";})()");
	          client_ip = jip_res.ip;
	          // DFP slotRenderEnded event
	          googletag.pubads().addEventListener('slotRenderEnded', function(event) {
	            if(typeof event["slot"]["D"]["creativeId"] !== "undefined" && event["slot"]["D"]["creativeId"] == "111143032108") {
	              if(typeof event["slot"]["o"]["sttrackid"][0] !== "undefined") {
	                var sttrackid = event["slot"]["o"]["sttrackid"][0];
	                var creative_id = event["slot"]["D"]["creativeId"];
	                var creative_width = "300";
	                var creative_height = "600";
	                var full_url = event["slot"]["o"]["FURL"][0];

	                var parameters = 'creative_id='+creative_id+'&track_id='+sttrackid+'&window_width='+win_width+'&window_height='+win_height+'&full_url='+full_url+'&user_agent='+user_agent+'&client_ip='+client_ip+'&op_type=insert';

	                var rr = new XMLHttpRequest();
	                rr.open("POST", "http://stage.thisoldhouse.com/ad_debug/save_video_data.php?"+parameters, true);
	                rr.send();
	              }
	            }
	          });

	          // DFP impressionViewable event
	          googletag.pubads().addEventListener('impressionViewable', function(event) {
	            if(typeof event["slot"]["D"]["creativeId"] !== "undefined" && event["slot"]["D"]["creativeId"] == "111143032108") {
	              if(typeof event["slot"]["o"]["sttrackid"][0] !== "undefined") {
	                var sttrackid = event["slot"]["o"]["sttrackid"][0];
	                var creative_id = event["slot"]["D"]["creativeId"];

	                var parameters = 'creative_id='+creative_id+'&track_id='+sttrackid+'&op_type=update';

	                var rr = new XMLHttpRequest();
	                rr.open("POST", "http://stage.thisoldhouse.com/ad_debug/save_video_data.php?"+parameters, true);
	                rr.send();
	              }
	            }
	          });
	        }
	      }
	      jip.send();
	    });
	  },

	  collectAdData: function() {
	    if(top_level_domain !== "lirealtor.com") return "";
	    //if(top_level_domain !== "thisoldhouse.com") return "";
	    var getUrl = window.location;
	    var baseUrl = getUrl.protocol + "//" + getUrl.host;
	    var win_width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	    var win_height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	    var user_agent = navigator.userAgent;

	    googletag.cmd.push(function() {
	      var jip = new XMLHttpRequest();
	      jip.open("POST", "https://jsonip.com/?callback", true);
	      jip.onreadystatechange = function() {
	        var client_ip = "";
	        if (jip.readyState == 4 && jip.status == 200) {
	         var jip_res = eval("(function(){return " + jip.responseText + ";})()");
	          client_ip = jip_res.ip;
	          // DFP slotRenderEnded event
	          googletag.pubads().addEventListener('slotRenderEnded', function(event) {
	            if(typeof event["slot"]["D"]["creativeId"] !== "undefined") {
	              if(typeof event["slot"]["o"]["sttrackid"][0] !== "undefined") {
	                var sttrackid = event["slot"]["o"]["sttrackid"][0];
	                var creative_id = event["slot"]["D"]["creativeId"];
	                //var creative_size = event["size"][0]+"x"+event["size"][1];
	                var creative_size = event["slot"]["o"]["AdType"][0];
	                var full_url = event["slot"]["o"]["FURL"][0];

	                var parameters = 'creative_id='+creative_id+'&track_id='+sttrackid+'&window_width='+win_width+'&window_height='+win_height+'&creative_size='+creative_size+'&full_url='+full_url+'&user_agent='+user_agent+'&client_ip='+client_ip+'&op_type=insert';

	                var rr = new XMLHttpRequest();
	                rr.open("POST", "http://stage.thisoldhouse.com/ad_debug/save_pub_ad_data.php?"+parameters, true);
	                //rr.open("POST", "http://sm.thisoldhouse.com/ad_debug/save_pub_ad_data.php?"+parameters, true);
	                rr.send();
	              }
	            }
	          });

	          // DFP impressionViewable event
	          googletag.pubads().addEventListener('impressionViewable', function(event) {
	            if(typeof event["slot"]["D"]["creativeId"] !== "undefined") {
	              if(typeof event["slot"]["o"]["sttrackid"][0] !== "undefined") {
	                var sttrackid = event["slot"]["o"]["sttrackid"][0];
	                var creative_id = event["slot"]["D"]["creativeId"];

	                var parameters = 'creative_id='+creative_id+'&track_id='+sttrackid+'&op_type=update';

	                var rr = new XMLHttpRequest();
	                rr.open("POST", "http://stage.thisoldhouse.com/ad_debug/save_pub_ad_data.php?"+parameters, true);
	                //rr.open("POST", "http://sm.thisoldhouse.com/ad_debug/save_pub_ad_data.php?"+parameters, true);
	                rr.send();
	              }
	            }
	          });
	        }
	      }
	      jip.send();
	    });
	  },

	  processCustomAdConf: function(domain_config, top_level_domain) {
	    if( typeof domain_config[top_level_domain]["custom_ad"] !== "undefined" ) {
	      var predefine_slots = predefinedSlots["slots"];
	      var custom_ad = domain_config[top_level_domain]["custom_ad"];

	      for (var key in custom_ad) {

	        if( ! custom_ad.hasOwnProperty( key ) ) continue;

	        var custom_ad_conf = {};

	        var size_map = custom_ad[key]["size_map"];

	        // Process size mapping array
	        var custom_size_map = [];

	        for (var k2 in size_map) {
	          if( ! size_map.hasOwnProperty( k2 ) ) continue;

	          size_map_key = parseInt( Object.keys(size_map[k2]["device_size"]));
	          size_map_key2 = parseInt( Object.keys(size_map[k2]["ad_size"]));
	          size_map_val = parseInt( Object.values(size_map[k2]["device_size"]));
	          size_map_val2 = parseInt( Object.values(size_map[k2]["ad_size"]));

	          custom_size_map[k2] = [
	            [size_map_key, size_map_val],
	            [size_map_key2, size_map_val2]
	          ];
	        }

	        // Assinged size mapping array with custom_ad_conf obj
	        custom_ad_conf.size_map = custom_size_map;

	        // Assinged desktop width & height with custom_ad_conf obj
	        var wh_desk = custom_ad[key]["wh_desk"];
	        wh_desk_key = parseInt( Object.keys(wh_desk)[0] );
	        wh_desk_val = parseInt( Object.values(wh_desk)[0] );
	        custom_ad_conf.wh = [wh_desk_key, wh_desk_val];

	        // Assinged tablet width & height with custom_ad_conf obj
	        var wh_tab = custom_ad[key]["wh_tab"];
	        wh_tab_key = parseInt( Object.keys(wh_tab)[0] );
	        wh_tab_val = parseInt( Object.values(wh_tab)[0] );
	        custom_ad_conf.wh_tab = [wh_tab_key, wh_tab_val];

	        // Assinged mobile width & height with custom_ad_conf obj
	        var wh_mob = custom_ad[key]["wh_mob"];
	        wh_mob_key = parseInt( Object.keys(wh_mob)[0] );
	        wh_mob_val = parseInt( Object.values(wh_mob)[0] );
	        custom_ad_conf.wh_mob = [wh_mob_key, wh_mob_val];

	        // Assinged slot name with custom_ad_conf obj
	        custom_ad_conf.slot_name = custom_ad[key]["slot_name"];

	        // Finally Assinged custom_ad_conf obj with predefined slot conf
	        predefine_slots[key] = custom_ad_conf;
	      }
	    }
	  }

	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var configuration   = __webpack_require__(3),
	    googleHelper    = __webpack_require__(2);

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


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var configuration   = __webpack_require__(3),
	    googleHelper    = __webpack_require__(2);

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


/***/ }
/******/ ]);