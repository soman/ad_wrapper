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
