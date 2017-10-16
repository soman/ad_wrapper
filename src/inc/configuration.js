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
