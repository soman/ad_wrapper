var configuration   = require('./configuration'),
    predefinedSlots = require('./predefined_slots'),
    refreshHelper   = require('./refreshHelper'),
    googleHelper    = require('./googleHelper');

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
