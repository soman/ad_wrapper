<?php
  header('Access-Control-Allow-Origin: *');
  $cur_dir = getcwd();
  $cur_dir = substr($cur_dir, 0, -11);

  //Encode the array to JSON
  $out_domain_setting = array();

  $host = (isset($_GET["dname"])) ? $_GET["dname"] : "";

  if(!empty($host)) {
    $host_name = str_replace(".", "_", $host);
    $get_path = $cur_dir."/sites/default/files/ad_wrapper_data/".$host_name.".json";

    if(file_exists($get_path)) {
      $pub_ad_data = file_get_contents($get_path);

      if(!empty($pub_ad_data)) {
        $pub_ad_data = json_decode($pub_ad_data);
        $out_domain_setting[$host] = $pub_ad_data;
      }

      $get_path = $cur_dir."/sites/default/files/ad_wrapper_data/collect_prebid_analytics_data_status.json";
      if(file_exists($get_path)) {
        $prebid_data_status = file_get_contents($get_path);

        if(!empty($prebid_data_status)) {
          $prebid_data_status = json_decode($prebid_data_status);
          if(isset($prebid_data_status->collect_prebid_analytics_data)) {
            $out_domain_setting[$host]->prebid_ga_status = $prebid_data_status->collect_prebid_analytics_data;
          }
        }
      }
    }

  }

  $domain_list = json_encode($out_domain_setting);
  $header_bidder_conf = file_get_contents("header_bidding_conf.txt");

  $final_json_data = '{
    "domain_conf" : '.$domain_list.',
    "header_bidder_conf" : '.$header_bidder_conf.'
  }';

  // Content type
  header("Content-type: application/json");

  //JSONP - Make it as JSONP object
  echo $final_json_data;
