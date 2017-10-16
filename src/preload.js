/**
 * Had to Inject Following files out of modules
 */

window.winTopPos = window;
window.isInIframe = false;
window.winTopIframeYOffset = 0;
window.prebid_ga_status = 0;
window.isTohWrapperAdBlock = false;

// For IE - Object.keys is missing on IE
Object.keys = Object.keys || function processKeys(obj) {
  var ret = [];
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      ret.push(prop);
    }
  }
  return ret;
}

Object.values = Object.values || function processValues(obj) {
  var ret = [];
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      ret.push(obj[prop]);
    }
  }
  return ret;
}

// For debugging
var toh_debug = false;
var st_debug = false;
var toh_counters = false;
var toh_refresh = false;
var toh_lazyload = false;
var toh_native = false;

var location_search = window.location.search;
if(isInIframe) {
  location_search = winTopPos.window.location.search;
}

if(location_search) {
  var urlQueryStr = location_search;
  if( urlQueryStr.indexOf("toh_debug") != -1) {
    var toh_debug = true;
  }

  if( urlQueryStr.indexOf("st_debug") != -1) {
    var st_debug = true;
  }

  if( urlQueryStr.indexOf("toh_counters") != -1) {
    var toh_counters = true;
  }

  if( urlQueryStr.indexOf("toh_refresh") != -1) {
    var toh_refresh = true;
  }

  if( urlQueryStr.indexOf("toh_lazyload") != -1) {
    var toh_lazyload = true;
  }

  if( urlQueryStr.indexOf("toh_native") != -1) {
    var toh_native = true;
  }

}

/*document.addEventListener("DOMContentLoaded", function() {
  if(toh_native) {
    var nativeAdClass = "listing-gallery",
    classList = document.getElementsByClassName(nativeAdClass)[0].classList,
    elems = document.getElementsByClassName(nativeAdClass),
    native_ad_no = 0;

    for (var i = 0; i < elems.length; ++i) {
      var j = i+1;
      var k = j%5;
      if(k == 4) {
        native_ad_no++;
        var adId = "native_ad_"+native_ad_no;
        var adName = "medium_rectangle";

        var element = elems[i];
        var parentElement = elems[i].parentNode;

        // Create a new element
        var newElement = document.createElement("div");
        newElement.setAttribute("class", "ST-Test "+classList);
        newElement.innerHTML = '<div id="'+adId+'"></div>';

        //document.body.insertBefore(newElement, parentElement);
        //parentElement.insertBefore(newElement, element);
        element.parentNode.insertBefore(newElement, element.nextSibling);

        var adScript = document.createElement('script');
        adScript.type = 'text/javascript';
        adScript.innerHTML = 'tohAdWrapper.push("'+adName+'", "'+adId+'"); tohAdWrapper.display("'+adId+'");';
        document.getElementById(adId).appendChild(adScript);
      }
    }
  }
});*/


window.toh_counters = toh_counters;
window.toh_debug = toh_debug;
window.st_debug = st_debug;
window.toh_refresh = toh_refresh;
window.toh_lazyload = toh_lazyload;

var hostname = document.location.hostname.split('.');
if(isInIframe) {
  hostname = winTopPos.document.location.hostname.split('.');
}

var loop_limit = 0;
if(hostname.length > 2) {
  loop_limit = 1;
}

for(i=hostname.length-1; i >= loop_limit; i--) {
  top_level_domain = hostname.slice(i).join('.');
}

window.top_level_domain = top_level_domain;

// Assign window width in global variable

var win_width = window.innerWidth
  || document.documentElement.clientWidth
  || document.body.clientWidth;

if(isInIframe) {
  var parent_win_width = winTopPos.window.innerWidth
    || winTopPos.document.documentElement.clientWidth
    || winTopPos.document.body.clientWidth;

  window.parent_win_width = parent_win_width;
}

// Assign window width in global variable
var win_height = window.innerHeight
  || document.documentElement.clientHeight
  || document.body.clientHeight;

if(isInIframe) {
  var parent_win_height = winTopPos.window.innerHeight
    || winTopPos.document.documentElement.clientHeight
    || winTopPos.document.body.clientHeight;

  window.parent_win_height = parent_win_height;
}

// Assign device type based on window width in global variable
var device_type = "desk";

if(win_width < 970 && win_width > 725) {
  device_type = "tab";
} else if(win_width < 726) {
  device_type = "mob";
}


window.win_width = win_width;
window.win_height = win_height;
window.device_type = device_type;

// Assign prebid timeout in global variable
var PREBID_TIMEOUT = 1000;
var pbjs = pbjs || {};
pbjs.que = pbjs.que || [];

// Loading prebid.js file
(function () {
  var d = document, pbs = d.createElement("script");
  pbs.async = true;
  var useSSL = 'https:' == d.location.protocol;
  pbs.type = "text/javascript";
  pbs.src = "https://www.thisoldhouse.com/ad-wrapper/prebid.js";
  var target = document.getElementsByTagName("head")[0];
  target.insertBefore(pbs, target.firstChild);
})();

var googletag = googletag || {};
googletag.cmd = googletag.cmd || [];

// Loading gpt.js file
(function() {
  var gads = document.createElement('script');
  gads.async = true;
  gads.type = 'text/javascript';
  var useSSL = 'https:' == document.location.protocol;
  gads.src = (useSSL ? 'https:' : 'http:') + '//www.googletagservices.com/tag/js/gpt.js';
  var node = document.getElementsByTagName('script')[0];
  node.parentNode.insertBefore(gads, node);
})();

// Loading st_feed.js file
(function() {
  var feed_script = document.createElement("script");
  feed_script.src = "https://www.thisoldhouse.com/sites/all/modules/custom/st_feed/st_feed.js";
  feed_script.type = "text/javascript";
  feed_script.async = true;
  var node = document.getElementsByTagName('script')[0];
  node.parentNode.insertBefore(feed_script, node);
})();

// Inject custom style.css
(function() {
  var ss = document.createElement("link");
  ss.type = "text/css";
  ss.rel = "stylesheet";
  ss.href = "https://www.thisoldhouse.com/ad-wrapper/style.css";
  document.getElementsByTagName("head")[0].appendChild(ss);
})();

// Exelate DMP pixel
/*window.xl8_config = { "p": 855, "g": 2 };

document.addEventListener("DOMContentLoaded", function(event) {
  //do work
  var xl8_script = document.createElement("script");
  xl8_script.src = xl8_script.src = "https://cdn.exelator.com/build/static.min.js";
  xl8_script.type = "text/javascript";
  xl8_script.async = true;
  var bodyNode = document.getElementsByTagName('body');
  document.body.appendChild(xl8_script);
});*/

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

//if(typeof window.top.tohTriggeredGa === "undefined") {
//  window.top.tohTriggeredGa = true;
  ga('create', 'UA-81184272-4', 'auto', 'adWrapperTracker');
  ga('adWrapperTracker.send', 'pageview');
//}

// Added analytics js file
document.addEventListener("DOMContentLoaded", function(event) {
  var d = document, tohga = d.createElement("script");
  tohga.async = true;
  tohga.type = "text/javascript";
  tohga.src = "https://www.thisoldhouse.com/ad-wrapper/toh_ga.js";
  var bodyNode = document.getElementsByTagName('body');
  document.body.appendChild(tohga);

  // Check ad blocker is enable/disable
  var checkAdBlock = document.createElement('div');
  checkAdBlock.innerHTML = '&nbsp;';
  checkAdBlock.id = 'adsbox';
  document.body.appendChild(checkAdBlock);

  window.setTimeout(function() {
    if (checkAdBlock.offsetHeight === 0) {
      window.isTohWrapperAdBlock = true;
    }
    var element = document.getElementById("adsbox");
    element.parentNode.removeChild(element);
  }, 100);

});

// Loading sovrn beacon script js file
(function () {
  var sovrnS = document.createElement('script');
  sovrnS.type = 'text/javascript';
  sovrnS.src = 'https://ap.lijit.com/www/sovrn_beacon_standalone/sovrn_standalone_beacon.js?iid=13390386&amp;uid=thisoldhouse';
  sovrnS.id = 'sBeacon';
  var target = document.getElementsByTagName("head")[0];
  target.insertBefore(sovrnS, target.firstChild);
})();

var prefetch_link = [
  "//catrg.peer39.net",
  "//aax.amazon-adsystem.com",
  "//i.yldbt.com",
  "//ap.lijit.com",
  "//link.krxd.net",
  "//as.casalemedia.com",
  "//optimized-by.rubiconproject.com",
  "//optimized-by-1.rubiconproject.com",
  "//optimized-by-2.rubiconproject.com",
  "//flapi1.rubiconproject.com",
  "//flapi2.rubiconproject.com",
  "//stats.aws.rubiconproject.com",
  "//us-u.openx.net",
  "//secure.adnxs.com",
  "//ib.adnxs.com",
  "//cdn.krxd.net",
  "//securepubads.g.doubleclick.net",
  "//stats.g.doubleclick.net",
  "//googleads.g.doubleclick.net",
  "//googleads4.g.doubleclick.net",
  "//cm.g.doubleclick.net",
  "//www.google-analytics.com",
  "//bcp.crwdcntrl.net",
  "//b.scorecardresearch.com",
  "//sb.scorecardresearch.com",
  "//pixel.quantserve.com",
  "//d3ezl4ajpp2zy8.cloudfront.net",
  "//p.cpx.to",
  "//cdn.taboola.com",
  "//secure-au.imrworldwide.com",
  "//gslbeacon.lijit.com",
  "//js.revsci.net"
];

(function () {
  for (var key in prefetch_link) {
    if( prefetch_link.hasOwnProperty(key)) {
      var dnspre = document.createElement('link');
      dnspre.rel = "dns-prefetch";
      dnspre.href = prefetch_link[key];
      var target = document.getElementsByTagName("head")[0];
      target.insertBefore(dnspre, target.firstChild);
    }
  }
})();


(function(){
  window.TOH_JSON = {
    parse: function(sJSON) { return eval('(' + sJSON + ')'); },
    stringify: (function () {
      var toString = Object.prototype.toString;
      var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
      var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
      var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
      var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
      return function stringify(value) {
        if (value == null) {
          return 'null';
        } else if (typeof value === 'number') {
          return isFinite(value) ? value.toString() : 'null';
        } else if (typeof value === 'boolean') {
          return value.toString();
        } else if (typeof value === 'object') {
          if (typeof value.toJSON === 'function') {
            return stringify(value.toJSON());
          } else if (isArray(value)) {
            var res = '[';
            for (var i = 0; i < value.length; i++)
              res += (i ? ', ' : '') + stringify(value[i]);
            return res + ']';
          } else if (toString.call(value) === '[object Object]') {
            var tmp = [];
            for (var k in value) {
              if (value.hasOwnProperty(k))
                tmp.push(stringify(k) + ': ' + stringify(value[k]));
            }
            return '{' + tmp.join(', ') + '}';
          }
        }
        return '"' + value.toString().replace(escRE, escFunc) + '"';
      };
    })()
  };
})();
