/* Minification failed. Returning unminified contents.
(3326,473-480): run-time error JS1019: Can't have 'break' outside of loop: break a
(3327,185-192): run-time error JS1019: Can't have 'break' outside of loop: break a
 */
function loadSearchResultViews(userListingViewTypeObj,defaultUserListingViewType)
{
  //First array index is agent
  var searchResultViewsArray = new Array();
  var srchViewObj = new Object();
  if (!defaultUserListingViewType)
    defaultUserListingViewType = getDefaultUserViewSearch();

  var userListingViewType = $(userListingViewTypeObj).val();

  if (isEmptyString(userListingViewType))
    userListingViewType = defaultUserListingViewType;

  if (environment.ApplicationLoginType == environment.eventManager.GetObject("isAgent"))
    viewIndex = 0;

  if (environment.ApplicationLoginType == environment.eventManager.GetObject("isClient"))
    viewIndex = 1;


  if (!isNaN(viewIndex))
  {
    srchViewObj = findSearchResultView(userListingViewType);
    if (!srchViewObj)
    {
      $(userListingViewTypeObj).val(defaultUserListingViewType)
      srchViewObj = findSearchResultView(defaultUserListingViewType)
    }
    return srchViewObj;
  }

  return false;
}

/*
 * Function: findSearchResultView
 * Finds the key in the array related to the viewing type
 *  userListingViewType - title of search view type
*/

function findSearchResultView(userListingViewType)
{
  var srchViewObj = new Object();
  for (var i=0;i<environment.searchResultViewsArray[viewIndex].length;i++)
  {
    if (userListingViewType.toUpperCase() == environment.searchResultViewsArray[viewIndex][i][0].toUpperCase())
    {
      srchViewObj = {viewType:environment.searchResultViewsArray[viewIndex][i][1],callback:eval(environment.searchResultViewsArray[viewIndex][i][2]),searchTab:environment.searchResultViewsArray[viewIndex][i][3],ajaxReturnFormat:environment.searchResultViewsArray[viewIndex][i][4]}
      return srchViewObj;
    }
  }

  return false;
}

/*
 * Function: resetMultipleSearchAreas
 *  reset search results data
*/

function resetSearchResultsData(oParam)
{
  var keepRightContentBar = false;
  if (oParam)
  {
    if (oParam.keepRightContentBar)
      keepRightContentBar = oParam.keepRightContentBar;
  }

  try{
    var theMap = mapManager.GetMapObject('mapSearch');
  }
  catch(e){
    var theMap = null;
  }

  if(theMap != null)
  {
    theMap.setMapChangedByUser(false);
    var hideMap = theMap.getIsMapHidden();
    resetMapViews(false);
    if (hideMap){
      hideMapAndAugmentation();
    }else{
      showMapAndAugmentation();
    }
  }

  currentPage = 1;
  sortColumn = "";
  sliderValue = 2;
  activeTabArrayIndex = 0;

  resetAugmentationControls();
  latitudeArraySearchResults = new Array();
  longitudeArraySearchResults = new Array();
  doshowAllSearchesOnMap = true;

  if (isEmptyString(environment.GetPageFlag('propertyTypeChange')))
    augmentationDataStorage = new ObjectCollection();

  environment.SetPageFlag("selectedListingsArray", []);

  if (applyRefreshSearchResults)
  {
    environment.RemovePageFlag('augmentationDataStorage');
  }
  environment.RemovePageFlag('saveSelectedListingsData');
  environment.RemovePageFlag('propertyTypeChange');
  environment.RemovePageFlag('propertyPromotions');
  environment.RemovePageFlag('abortErrorWindow');
  environment.RemovePageFlag('bMapRefresh');

  $("#searchResultsForm > #UpdateRelatedSearch").val('Y');
  $("#searchResultsForm > #ViewSelectedOnlyIndicator").val('');
  $("#searchResultsForm > #showOverlay").val('');

  // VMera - FB 48526 - do not clear featured listings sidebar on property dashboard
  if ((!keepRightContentBar) && (environment.GetPageFlag("preventFeaturedListingsReload") != true)){
    $("#right-side-content-bar").empty();
  }
  applyRefreshSearchResults = false;
}

/*
 * Function: showAllSearchesOnMap
 *  shows the listings locations on the map
 *
 * Parameters:
 *  searchDetails - the search details json object returned from the server
 *  searchGeneralData - search general information json object returned from the server
*/
function showAllSearchesOnMap(searchGeneralData, searchDetails, mapID) {
  if(mapID == null)
    mapID = 'mapSearch';

  var theMap = mapManager.GetMapObject(mapID);
  var bMapRefresh = environment.GetPageFlag('bMapRefresh');

  //resets the info boxes
  closeMapInfoBox(true);
  if (bMapRefresh != 'abort')
  {
    if (bMapRefresh == true)
      theMap.ShowSearchResultsOnMap(searchGeneralData, searchDetails,true);
    else
      theMap.ShowSearchResultsOnMap(searchGeneralData, searchDetails);

    theMap.RegisterMapChange(mapChange);
  }

  disableSearchMapAnchor = false;
  doshowAllSearchesOnMap = false;
  environment.RemovePageFlag('bMapRefresh');
  actionManager.RunAction('mapPinDragable');
}

function displayPolygonsFromArray(map,polygonData)
{
  map.displayPolygonsFromArray(polygonData);
  actionManager.RunAction('mapPinBoundaries');
}

function mapPinBoundaries(oParams)
{
  var map = mapManager.GetMapObject("mapSearch");
  map.SetMapBBox(oParams.MaximumMapBoundary);
  map.SetMapBBoxView(oParams.MaximumMapBoundary);
  actionManager.CancelAction('mapPinBoundaries');

}

function mapPinDragable(oParams)
{
  var map = mapManager.GetMapObject("mapSearch");

  var shapeChangeHandler = map.getShapeChangeHandler();
  map.UnRegisterShapeChange();

  map.setDraggablePinId(oParams.PinId); //set draggable ping id
  map.setCurrentPushPinGUID(oParams.PinGUID);

  var dragTools = new displayPinDragTools(map);
  dragTools.init(oParams.dragDefault);
  actionManager.CancelAction('mapPinDragable');

  if (shapeChangeHandler != null){
    map.RegisterShapeChange(shapeChangeHandler);
  }
}



/*
 * Function: propertyView
 *  called when the user hovers a push pin associated to the property
 *
 * Parameters:
 *  e - map event
*/
function propertyView(listingObj)
{
  var mlsid = listingObj.mlsid;
  var listingguid = listingObj.listingguid;
  var listingtypeid = 0;
  if (listingObj.listingtypeid)
    listingtypeid = listingObj.listingtypeid;

  switch (listingtypeid)
  {
    case 0:
      var mlslistingGUID = "MLS: "+ mlsid+" LISTING: " +listingguid;
      if (mlslistingGUID != recentmlslistingGUID)
      {
        recentmlslistingGUID = mlslistingGUID;
        var event = 'addToRecentViewed';
        var ajaxAdapter = new AJAXAdapter();
        ajaxAdapter.setParametersString("listingGUID=" + listingguid);
        ajaxAdapter.setParametersString("mlsID=" + mlsid, APPEND_PARAM);
        ajaxAdapter.call(BuildURL(event));
      }
      break;
    default:
      return;
  }
}


/*
 * Function: cancelPropertyWatch
 * removes the listing from property watch
 * Parameters: listingObj
*/

function cancelPropertyWatch(listingObj)
{
  var event = 'propertyDetails.cancelPropertyWatch';
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setParametersString("listingguid=" + listingObj.listingGUID);
  ajaxAdapter.setParametersString("userSearchGuid=" + $("#searchResultsForm > #userSearchGUID").val(),APPEND_PARAM);
  ajaxAdapter.call(BuildURL(event), reloadCurrentSearchView);
}

function OpenCreateRMFPagePopup(listingGUID) {
    var ajaxAdapter = new AJAXAdapter();
    ajaxAdapter.setParametersString("listingGUID=" + listingGUID);
    ajaxAdapter.call(BuildURL("commentAndRateFavorite"), OpenHTMLPopup);
}

/*
 * Function: addToFavorites
 * adds the listing to the favorites
 * Parameters: listingObj
*/

function addToFavorites(listingObj)
{
  var event = 'addToFavorites';
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setParametersString("PreferenceType=Include");
  ajaxAdapter.setParametersString("listingGUID=" + listingObj.listingGUID, APPEND_PARAM);
  ajaxAdapter.setAJAXReturnFormat('json');
  ajaxAdapter.call(BuildURL(event), mapIconChangeCallback);

    OpenCreateRMFPagePopup(listingObj.listingGUID);
}

function postCreateRMF(listingGUID) {
    if ($("#CreateRMFPage").length > 0) {
        if ($("#CreateRMFPage").attr("checked") == true) {
            setRMFFromPrompt(listingGUID);
        }
    } else {
        setAutopostListing(listingGUID, $("#PostToRMF").attr("checked"));
    }
    ClosePopup();
}

function setRMFFromPrompt(listingGUID) {
    var ajaxAdapterTmp = new AJAXAdapter();
    ajaxAdapterTmp.setParametersString("listingguid=" + listingGUID);
    ajaxAdapterTmp.setParametersString("value=1", APPEND_PARAM);
    ajaxAdapterTmp.call(BuildURL("toggleRateMyFavorite"), setRMFFromPrompt_callback);
}

function setRMFFromPrompt_callback(result) {
    if (environment.GetPageFlag('openParentRMFSettings') != true) {
        navigateConsumerDashboard(BuildURL('2B16A444-E5E0-414E-9783-358708D6DC67'), 3);
    } else {
        if (window.MainWindow != null) {
            if (window.MainWindow.closed == false) {
                window.MainWindow.location.href = BuildURL('2B16A444-E5E0-414E-9783-358708D6DC67') + '/defaultActiveTab/3';
            } else {
                ClosePopup();
            }
        }
        else
            ClosePopup();
    }
    ClosePopup();
}

function doNotShowRMFSetupPrompt(configurationName) {
    var ajaxAdapterTmp = new AJAXAdapter();
    ajaxAdapterTmp.setParametersString("configurationName=" + configurationName);
    ajaxAdapterTmp.call(BuildURL("saveRMFSettingPrompt"));
    ClosePopup();
}

function setAutopostListing(listingGUID, value) {
    var ajaxAdapterTmp = new AJAXAdapter();
    ajaxAdapterTmp.setParametersString("listingguid=" + listingGUID);
    ajaxAdapterTmp.setParametersString("value=" + (value == true ? 1 : 0), APPEND_PARAM);
    ajaxAdapterTmp.call(BuildURL("toggleRateMyFavorite"));
    ClosePopup();
}

function setAutopost(listingGUID) {
    var ajaxAdapterObj = new AJAXAdapter();
    ajaxAdapterObj.call(BuildURL("saveRMFAutopostAll"));

    var ajaxAdapterTmp = new AJAXAdapter();
    ajaxAdapterTmp.setParametersString("listingguid=" + listingGUID);
    ajaxAdapterTmp.setParametersString("value=1", APPEND_PARAM);
    ajaxAdapterTmp.call(BuildURL("toggleRateMyFavorite"));
    ClosePopup();
}

function doNotShowAutopostPrompt(configurationName) {
    var ajaxAdapterTmp = new AJAXAdapter();
    ajaxAdapterTmp.setParametersString("configurationName=" + configurationName);
    ajaxAdapterTmp.call(BuildURL("saveRMFSettingPrompt"));
    ClosePopup();
}

/*
 * Function: addToRejects
 * adds the listing to the rejects
 * Parameters: listingObj
*/

function addToRejects(listingObj)
{
  var ajaxAdapter = new AJAXAdapter();
  var urlLocation = BuildURL('addToRejects');
  ajaxAdapter.setParametersString("PreferenceType=Exclude");
  ajaxAdapter.setParametersString("listingGUID=" + listingObj.listingGUID, APPEND_PARAM);
  ajaxAdapter.setAJAXReturnFormat('json');
  ajaxAdapter.call(urlLocation, mapIconChangeCallback);
}



function mapIconChangeCallback(jsonData)
{
  if (!checkJSON(jsonData))
    return;

  var mapArray = environment.ApplicationMapArray;
  var listingguid = '';
  var listingiconurl = '';

  for (hdx=0;hdx<jsonData.DATA.length;hdx++)
  {
    for (idx=0;idx<jsonData.COLUMNS.length;idx++)
    {
      if (jsonData.COLUMNS[idx].toUpperCase() == 'LISTINGGUID')
        listingguid = jsonData.DATA[hdx][idx];
      if (jsonData.COLUMNS[idx].toUpperCase() == 'LISTINGICONURL')
        listingiconurl = jsonData.DATA[hdx][idx];
    }

    for (var i=0;i<mapArray.length;i++)
    {
      var map = mapManager.GetMapObject(mapArray[i]);
      try
      {
        if (listingguid != '' && listingiconurl != '' && map != null)
            map.changePinIcon(listingguid, mapPushpinIconLocation(listingiconurl));
      }
      catch (e){}
    }
  }

  if (actionManager.GetAction('reloadCurrentSearchView') != null)
    actionManager.RunAction('reloadCurrentSearchView');
}
/*
 * Section: Search Results functionality
*/

function saveAndExecuteSearch(jsonData)
{
  $("#searchResultsTabsDiv").show();
  try
  {
//    tmpUserSearchGUID = getXMLNodeValue(resultsData.getElementsByTagName('userSearchGUID')[0].firstChild);
    tmpUserSearchGUID = jsonData.USERSEARCHGUID;
  }
  catch(ex)
  {
    tmpUserSearchGUID = null;
  }

  if (tmpUserSearchGUID == null)
    tmpUserSearchGUID = $("#searchForm > #userSearchGUID").val();

  refreshSavedSearches(tmpUserSearchGUID,true);
  ActivateSearchTab({actIdx:searchChanged_TabIndex, divArray:searchResult_Views});
  DefaultView_Callback(jsonData);
}

/*
 * Function: initAugmentationControls
 * initializes the augmentation controls based on usersearchguid
 *
*/
function initAugmentationControls(userSearchGUID, noAreaBoundaries)
{
  if (isEmptyString(environment.GetPageFlag('augmentationDataStorage')))
  {
    if ($("#mapAugmentationDiv").html() != null)
    {
        augmentationDataStorage.AddObject(userSearchGUID, 'currentAugmentationGUID');
        if (noAreaBoundaries == null)
            noAreaBoundaries = "Y";

      var event = 'initAugmentationControls';
      var ajaxAdapterTmp = new AJAXAdapter();
      ajaxAdapterTmp.setParametersString("USERSEARCHGUID=" + userSearchGUID);
      ajaxAdapterTmp.setParametersString("NoAreaBoundaries=" + noAreaBoundaries, APPEND_PARAM);
      ajaxAdapterTmp.call(BuildURL(event), initAugmentationControls_callback);
    }
  }
  else
  {
    augmentationDataStorage = environment.GetPageFlag('augmentationDataStorage');
    environment.RemovePageFlag('augmentationDataStorage');
  }
}

function initAreaBoundariesControls(userSearchGUID) {
    if (isEmptyString(environment.GetPageFlag('augmentationDataStorage'))) {
        if ($("#mapAugmentationDiv").html() != null) {
            augmentationDataStorage.AddObject(userSearchGUID, 'currentAugmentationGUID');
            var event = 'initAreaBoundariesControls';
            var ajaxAdapterTmp = new AJAXAdapter();
            ajaxAdapterTmp.setParametersString("USERSEARCHGUID=" + userSearchGUID);
            ajaxAdapterTmp.setParametersString("NoAreaBoundaries=N", APPEND_PARAM);
            OpenProgressDlg();
            ajaxAdapterTmp.call(BuildURL(event), initAreaBoundariesControls_callback);
        }
    }
    else {
        augmentationDataStorage = environment.GetPageFlag('augmentationDataStorage');
        environment.RemovePageFlag('augmentationDataStorage');
    }
}
function initAreaBoundariesControls_callback(htmlData) {
    $("#areaBoundariesContent").html(htmlData);
    CloseProgressDlg();
}

function initAugmentationControls_callback(htmlData)
{
  $("#mapAugmentationDiv").html(htmlData);
}

function removeAugmentationControls()
{
  augmentationDataStorage.RemoveObject('currentAugmentationGUID');
  $("#mapAugmentationDiv").empty();
}

function resetAugmentationControls(mapid)
{
  try
  {
    if (!mapid)
      mapid = 'mapSearch';

    mapManager.GetMapObject(mapid).clearAllAugmentation();

    $("#map_augumentation input:checkbox:checked").each(function (i,el) {
        $(el).removeAttr("checked");
        $("#dsp_"+$(el).val()).empty();
    });
  }
  catch (e) {}
}

/*
 * Function: resetSearchForm
 * resets the search form to create new search, used in multiple places so function was created
*/

function resetSearchForm(newSearch)
{

  if (eval("typeof compareSearchData== 'function'"))
  {
    if (!compareSearchData('searchForm'))
    {
      $("#searchForm > #userSearchGUID").val("");
      $("#searchForm > #UserSearchType").val("");
    }
  }

  environment.RemovePageFlag('FilterSelectedProperties');
  if (newSearch)
  {
    environment.RemovePageFlag('saveSelectedListingsData');
    environment.SetPageFlag("selectedListingsArray", []);
    if ($("#featuredPropertiesContainer"))
      $("#featuredPropertiesContainer").cycle('destroy');
  }
}

/*
 * Function: resetViewSelectedIndicators
 *  resets the flags for view selected in one common place
 *  Parameters:
 *
*/

function resetViewSelectedIndicators(resetIndicator)
{
  $("#searchResultsForm > #ViewSelectedOnlyIndicator").val('N')
  environment.RemovePageFlag('FilterSelectedProperties');
  if (resetIndicator)
    environment.SetPageFlag("selectedListingsArray", []);
}

/*
 * Function: mapChange
 *  called when map change event occurs
 *
 * Parameters:
 *  e - map event
*/
function mapChange(e)
{
  var theMap = mapManager.GetMapObject('mapSearch');
  var bBox = theMap.getMapAsPolygon();
  resetSearchForm();
  if (applyRefreshSearchResults == true){
    theMap.setMapChangedByUser(true);
    refreshSearchresults(bBox);
  }
  applyRefreshSearchResults = true;
}

/*
 * Function: ExecuteSearchViewFromForm
 *   called when the page/view needs to be refreshed by making an AJAX call
 *
 * Parameters:
 *  location - location of the event for the AJAX call
 *  formId - id of the form coresponding to the desired view
 *  callback - callback function
 *  ajaxReturnFormat - return format from the AJAX call. Possible values: HTML, JSON, XML
*/
function ExecuteSearchViewFromForm(location, formId, callback, ajaxReturnFormat, returnAllMapResults){
  if (typeof(returnAllMapResults) == 'undefined')
    returnAllMapResults = "N";
  applyRefreshSearchResults = false;
  $("#searchResultsTabsDiv").show();

  var ajaxAdapterTmp = new AJAXAdapter();
  var param = ajaxAdapterTmp.setParametersFromForm(formId);
  var tmpUserSearchGUID = $('#searchResultsForm > #userSearchGUID').val();
  if($.trim(tmpUserSearchGUID) == ''){
  // if there isn't any userSearchGUID in the search result form, try to get the userSearchGUID from
  // the main form: searchForm
  // NOTE: at least one of the userSearchGUID MUST be set
    if(typeof(mainSearchFormID) != 'undefined')
      tmpUserSearchGUID = $('#' + mainSearchFormID + ' > #userSearchGUID').val();
  }
  // check whether we need to ignore empty search GUIDs
  if(tmpUserSearchGUID == ''){
    if (environment.GetPageFlag("IgnoreEmptySearchGUID") == true) {
    // display the no results screen
      showNoSearchResults({srchView: searchResult_Views[activeTabArrayIndex][3], restoreHTML: null});
      return;
    }
  }

  if (!isEmptyString($('#searchResultsForm > #showOverlay').val()))
    ajaxAdapterTmp.setParametersString("showOverlay=" + $('#searchResultsForm > #showOverlay').val(), APPEND_PARAM);
  if (!isEmptyString($('#searchResultsForm > #propertyTypeId').val()))
    ajaxAdapterTmp.setParametersString("propertyTypeId=" + $('#searchResultsForm > #propertyTypeId').val(), APPEND_PARAM);
  if (!isEmptyString($('#searchResultsForm > #SubjectPropertySuppress_Listing').val()))
    ajaxAdapterTmp.setParametersString("SubjectPropertySuppress_Listing=" + $('#searchResultsForm > #SubjectPropertySuppress_Listing').val(), APPEND_PARAM);
  if (!isEmptyString($('#searchResultsForm > #UserListingViewType').val()))
    ajaxAdapterTmp.setParametersString("UserListingViewType=" + $('#searchResultsForm > #UserListingViewType').val(), APPEND_PARAM);
  //Sends the current dashboard tab to the server
  if (environment.GetPageFlag('dashboardTab') != null)
    ajaxAdapterTmp.setParametersString("currentDashboardTab=" + environment.GetPageFlag('dashboardTab') , APPEND_PARAM);
  if (environment.GetPageFlag('UserListingViewType_Sort') != null)
    ajaxAdapterTmp.setParametersString("UserListingViewType_Sort=" + environment.GetPageFlag('UserListingViewType_Sort') , APPEND_PARAM);
  //IE fix
  if (isEmptyString($('#searchResultsForm > #ViewSelectedOnlyIndicator').val()))
    $("#searchResultsForm > #ViewSelectedOnlyIndicator").val('N');
  ajaxAdapterTmp.setParametersString("ViewSelectedOnlyIndicator=" + $('#searchResultsForm > #ViewSelectedOnlyIndicator').val(), APPEND_PARAM);
  ajaxAdapterTmp.setParametersString("UserSearchGUID=" + tmpUserSearchGUID, APPEND_PARAM);
  // the map already has all the results on it
  ajaxAdapterTmp.setParametersString("ReturnAllMapResults=" + returnAllMapResults,APPEND_PARAM);

  if (trim(param) == "")
  {
    ajaxAdapterTmp.setParametersString("latitudeArray=" + latitudeArraySearchResults.join(','), APPEND_PARAM);
    ajaxAdapterTmp.setParametersString("longitudeArray=" + longitudeArraySearchResults.join(','), APPEND_PARAM);

    if (sortColumn != "")
      ajaxAdapterTmp.setParametersString("ColumnName_UserSort=" + sortColumn, APPEND_PARAM);
  }
  if(ajaxReturnFormat != ''){
    ajaxAdapterTmp.setAJAXReturnFormat(ajaxReturnFormat);
  }

  OpenProgressDlg();
  ajaxAdapterTmp.call(location, callback);
}


/*
 * Function: resetMapViews
 * resets the map view
 *
*/
function resetMapViews(bRefreshSearchResults)
{
  // reset the map push-pins as well
  try{
    var theMap = mapManager.GetMapObject('mapSearch');
  }
  catch(e){
    var theMap = null;
  }

  if(theMap != null)
  {
    try
    {
      resetDrawingTools('mapSearch');
      var noResultsCenter = environment.GetPageFlag(theMap.id + '_noResultsCenter');
      var noResultsZoomLevel = environment.GetPageFlag(theMap.id + '_noResultsZoomLevel').toLowerCase();

      if (bRefreshSearchResults != false)
      {
        var zoomLevel = null;
        var center = null;
        if (noResultsZoomLevel != null)
          zoomLevel = noResultsZoomLevel;
        if (noResultsCenter != null)
          center = theMap.WKTPointParser(noResultsCenter);
        theMap.setCenterAndZoom(center, zoomLevel);
        theMap.clearMap(true);
      }
    }
    catch (e) {}

    theMap.clearSearches();
    theMap.hideShowMapClearButton('empty');
    theMap.UnRegisterMapChange();
    theMap.setIsShapeLayerModified(false);
    theMap.clearMapInfoBox();
    theMap.hideMessageBar();
    theMap.setIsMapHidden(false);
    $("#search-map").show();
    try
    {
      augmentationArray = augmentationCheckboxObject.GetObjectCollection();
      for (var objArry=0;objArry<augmentationArray.length;objArry++)
      {
        augmentationArray[objArry].checked = false;
      }
    }
    catch (e) {}
  }
}

/*
 * Function: showNoSearchResults
 * displays the no listings return modal and html for search results tab
 * Parameters:
 * srchView - the current search view of the object
*/
function showNoSearchResults(objParam)
{
  var srchView = objParam.srchView;
  environment.SetPageFlag('propertyPromotions','false');

  //This handles the no results from client dashboard (different functionality, error messages, and no pop-up)
  if (actionManager.GetAction('ActivateDashboardTab') && environment.GetPageFlag('FilterSelectedProperties') != 'Y')
  {
    noResultsDashboardSearch();
    return false;
  }

  if (environment.GetPageFlag("showNoCompetitionSearchResults") == true) {
      noCompetitionResults({ location: "noCompetitionResults", isSimilarListingsTab: "true" });
      return false;
  }

  environment.SetPageFlag('bMapRefresh','abort');
  theMap = mapManager.GetMapObject('mapSearch');
  shapesArray = theMap.getMapShapes();
  bRefreshSearchResults = true;

  if (shapesArray.length != 0)
    bRefreshSearchResults = false;

  resetMapViews(bRefreshSearchResults);

  var location = BuildURL("noSearchResults");
  var ajaxAdapterTmp = new AJAXAdapter();
  ajaxAdapterTmp.setAJAXReturnFormat('html');
  CloseProgressDlg();
  OpenProgressDlg();
  if (environment.GetPageFlag('SuppressNoSearchResultsPopup') == 'Y'){
    CloseProgressDlg();
  }
  else
    ajaxAdapterTmp.call(location, showNoSearchResults_callback);

  if (environment.GetPageFlag('propertyTypeFilterMenu') != null)
    propTypeHTMLMenu = '<form name="propertyTypeFilterForm">'+environment.GetPageFlag('propertyTypeFilterMenu')+'</form><br>';
  else
    propTypeHTMLMenu = '';

  $(srchView).html('<div class="searchPanesNoResults lucida boxcontent">'+propTypeHTMLMenu+$("#searchResultsForm > #noSearchResultsMessage").val() +'</div>');
  $("select[name='FilterPropertyTypeID']").attr("id","FilterPropertyTypeID_"+$('#searchResultsForm > #searchResultsView').val());
  $("select[name='FilterSearchGUID']").attr("id","FilterSearchGUID_"+$('#searchResultsForm > #searchResultsView').val());
  $("select[name='FilterPropertyTypeID']").val($('#searchResultsForm > #propertyTypeId').val());

  //Supresses drown down for zero results on all property types
  if (totalRecordsPerPropertyTypesMatched == 0)
    suppressPropertyFilterSelect();
}

function showNoSearchResults_callback(htmlData)
{
  var modalDlg = environment.GetPageFlag("ModalWindowDialog");
  CloseProgressDlg();

  if (environment.GetPageFlag('abortErrorWindow') == null)
  {
    modalDlg.SetUseWeightingFlag(true);
    modalDlg.SetAttemptDialogWeight(SPECIALMODAL_WEIGHT);
    modalDlg.OnCloseHandler(noSearchResultsCloseHandler);
    modalDlg.Open(htmlData, true);
  }
}

function noSearchResultsCloseHandler()
{
  environment.GetPageFlag("ModalWindowDialog").SetUseWeightingFlag(false);
  ClosePopup(true);
}

/*
 * Function: suppressPropertyFilterSelect
 * suppresses the filter for when no property types are returned at all
*/

function suppressPropertyFilterSelect()
{
  if (totalClientSearchGuids == 0 && totalRecordsPerPropertyTypesMatched == 0)
  {
    $("form[name='propertyTypeFilterForm']").hide();
    $("div[name='propertyTypeFilterMenu']").hide();
    $("select[name='FilterPropertyTypeID']").hide();
    $("select[name='FilterSearchGUID']").hide();
  }
}

/*
 * Function: showSearchView_ShowingSheet
 *  callback for the showing sheet view
 *
 * Parameters:
 *  htmlDATA - html code returned from the AJAX call
*/
function showSearchView_ShowingSheet(htmlData){
  /*****************************************************************************
   * NOTE:
   * Save the old content so it can be restored if the number of records is 0 and the user chosed to
   * view only the selected properties. In this case the previously displayed
   * properties must remain on the page and not be overwritten by the new htmlData.
  ******************************************************************************/
  CloseProgressDlg();
  $("#lastSearchButton").show();
  $('#showingsheet-content').html("<div>" + htmlData + "</div>");
  updateSearchCount(environment.GetPageFlag("searchCountResults"));
  try
  {
    if (totalRecordsCount == 0)
    {
      environment.GetPageFlag("pageInitPopupCalls").Enqueue({
        callback: showNoSearchResults,
        callbackParam: {srchView: '#showingsheet-content'}
      },BASE_INIT_MODAL_PRIORITY);
      consumeInitialPopupQueue();
      //return;
    }
    else
    {
      actionManager.RunAction('ConfigureDashboardSearchGuids');
//      ClosePopup();
    }
  }
  catch (e){}

  try
  {
    showAllSearchesOnMap(jsonSearchGeneral, jsonSearchCompleteList);
  }
  catch (e) {}

  // register map change event handler
  mapManager.GetMapObject('mapSearch').RegisterMapChange(mapChange);

  if ($("div[name='propertyTypeFilterMenu']").html() != null)
    environment.SetPageFlag('propertyTypeFilterMenu',$("div[name='propertyTypeFilterMenu']").html());

  if (environment.GetPageFlag("currentActiveTab") != null) {
      $("#pageToken").val($("#pageToken").val() + "-" + environment.GetPageFlag("currentActiveTab"));
      environment.RemovePageFlag("currentActiveTab")
  }
  storeCurrentPagePropertyDetails(propertyDetailsArrayCurrentPage.GetCollection(), Math.ceil(jsonSearchGeneral.page_current / 1), Math.ceil(jsonSearchGeneral.totalrecords_matched_subset / jsonSearchGeneral.records_per_page), $('#pageToken').val(), Math.ceil(jsonSearchGeneral.totalrecords_matched_subset / 1), Math.ceil(jsonSearchGeneral.records_per_page / 1));

  $('#showingsheet-content').show();
  selectCheckboxes();

    try {
        // VMera - FB 48526 - prevent reloading of featured listings on property dashboard (should be same slideshow on page)
        if (environment.GetPageFlag("preventFeaturedListingsReload") != true) {
            actionManager.RunAction('loadPropertyPromotions');
        }
    }
    catch (e) { }

  // NOTE: we need this call because the jQuery.resize event does not get triggered on Firefox if the scroll appears/hidden
  // on the side of the page. IE it works fine .
  $(window).resize();
  if (environment.GetPageFlag("useSearchResultsAnchor") == true)
    document.location.href = "#searchResultsAnchor";
}

/*
 * Function: showSearchView_OneLine
 *  callback for the one line view
 *
 * Parameters:
 *  xmlData - xml returned from the AJAX call
*/
function showSearchView_OneLine(xmlData){
  CloseProgressDlg();
  if(!checkXML(xmlData))
    return;

  $("#lastSearchButton").show();
  scriptCode = getXMLNodeValue(xmlData.getElementsByTagName('scriptCode')[0].firstChild);
  eval(scriptCode);

  totalRecordsPerPropertyTypesMatched = getXMLNodeValue(xmlData.getElementsByTagName('totalRecordsPerPropertyTypesMatched')[0].firstChild);
  updateSearchCount(environment.GetPageFlag("searchCountResults"));

  if (getXMLNodeValue(xmlData.getElementsByTagName('totalrecords')[0].firstChild) == 0)
  {
      environment.GetPageFlag("pageInitPopupCalls").Enqueue({
        callback: showNoSearchResults,
        callbackParam: {srchView: '#oneline-content'}
      },BASE_INIT_MODAL_PRIORITY);
      consumeInitialPopupQueue();
  }
  else
  {
    if (xmlData.getElementsByTagName('header')[0] != null)
    {
      htmlHeader = getXMLNodeValue(xmlData.getElementsByTagName('header')[0].firstChild);
      htmlResultset = getXMLNodeValue(xmlData.getElementsByTagName('resultset')[0].firstChild);
      htmlData = htmlHeader + htmlResultset;
      $('#oneline-content').html(removeWhiteSpaceHTML(htmlData));
    }
    else
    {
      showSearchView_OneLineXML(xmlData);
    }
    actionManager.RunAction('ConfigureDashboardSearchGuids');
//    ClosePopup();
  }

  try
  {
    showAllSearchesOnMap(jsonSearchGeneral, jsonSearchCompleteList);
  }
  catch(e){}

  mapManager.GetMapObject('mapSearch').RegisterMapChange(mapChange);

  if ($("div[name='propertyTypeFilterMenu']").html() != null)
      environment.SetPageFlag('propertyTypeFilterMenu', $("div[name='propertyTypeFilterMenu']").html());

  if (environment.GetPageFlag("currentActiveTab") != null) {
      $("#pageToken").val($("#pageToken").val() + "-" + environment.GetPageFlag("currentActiveTab"));
      environment.RemovePageFlag("currentActiveTab")
  }
  storeCurrentPagePropertyDetails(propertyDetailsArrayCurrentPage.GetCollection(), Math.ceil(jsonSearchGeneral.page_current / 1), Math.ceil(jsonSearchGeneral.totalrecords_matched_subset / jsonSearchGeneral.records_per_page), $('#pageToken').val(), Math.ceil(jsonSearchGeneral.totalrecords_matched_subset / 1), Math.ceil(jsonSearchGeneral.records_per_page / 1));

  $('#oneline-content').show();
  //implementation of ticket 40247
  var scriptCodeAfter = getXMLNodeValue(xmlData.getElementsByTagName('scriptCodeAfter')[0].firstChild);
  eval(scriptCodeAfter);
  selectCheckboxes();

    // VMera - FB 48526 - prevent reloading of featured listings on property dashboard (should be same slideshow on page)
  if (environment.GetPageFlag("preventFeaturedListingsReload") != true) {
      actionManager.RunAction('loadPropertyPromotions');
  }

  // NOTE: we need this call because the jQuery.resize event does not get triggered on Firefox if the scroll appears/hidden
  // on the side of the page. IE it works fine .
  $(window).resize();
  if (environment.GetPageFlag("useSearchResultsAnchor") == true)
    document.location.href = "#searchResultsAnchor";
}

/*
 * Function: showSearchView_OneLineXML
 *  XML processor
 *
 * Parameters:
 *  xmlData - XML code returned from the AJAX call
*/
function showSearchView_OneLineXML(xmlData)
{
  if(! checkXML(xmlData))
    return;
  var xmlobject = xmlData;
  var results;

  var i = 1;

  pagingTop = xmlobject.getElementsByTagName('pagingControlTop')[0];
  pagingBottom = xmlobject.getElementsByTagName('pagingControlBottom')[0];
  if(pagingTop != null)
    $("#pagingControl_top").html(getXMLNodeValue(pagingTop.firstChild));
  if(pagingBottom != null)
    $("#pagingControl_bottom").html(getXMLNodeValue(pagingBottom.firstChild));

  var currentActiveClass = "lastOpenedPropDetailsPage";
  $("." + currentActiveClass).removeClass(currentActiveClass);

  results = xmlobject.getElementsByTagName('result');
  for (var a = 0; a < results.length; a ++)
  {
    var oNode = results[a];
    var selChkBoxID = '';
    var listingGUID = '';
    for (var b=0;b < oNode.childNodes.length; b++)
    {
      var iNode = oNode.childNodes.item(b);
      var node_id = iNode.getAttribute("id")+i;
      var node_value = iNode.getAttribute("value");

      switch(iNode.getAttribute("id")){
        case "LISTINGID_SELECTEDINDICATOR":
          selChkBoxID = node_id;
        break;
        case "LISTINGGUID_RAW":
        // use the "raw" value - there is another ListingGUID column which gets formatted with tooltip
          listingGUID = node_value;
        break;
        case "PDPVIEWED_INDICATOR":
          var viewedClass = "notViewedPropertyDetails";
          $("#" + node_id).removeClass(viewedClass);
          if (node_value == "N"){
            $("#" + node_id).addClass(viewedClass);
            $("#LISTINGADDRESSLINE1" + i).addClass("notViewedPropertyDetailsAddress");
          }
        break;
        default:
          $("#"+node_id).html(node_value);
        break;
      }
    }
    $("#" + selChkBoxID).val(listingGUID);
    $("#" + selChkBoxID).attr("checked", "");

    $("#results-left-tbl-row-"+i).show();
    $("#results-right-tbl-row-"+i).show();

    i = i+1;
  }

  var w = i;
  for (var i=w;i<21;i++)
  {
    $("#results-left-tbl-row-"+i).hide();
    $("#results-right-tbl-row-"+i).hide();
  }
}

/*
 * Function: showSearchView_Comparison
 *  callback for the comparison view
 *
 * Parameters:
 *  htmlData - html code returned from the AJAX call
*/
function showSearchView_Comparison(htmlData){
  CloseProgressDlg();
  $("#lastSearchButton").show();
  $('#comparison-content').html("<div>" + htmlData + "</div>");
  updateSearchCount(environment.GetPageFlag("searchCountResults"));
  try
  {
    if (totalRecordsCount == 0)
    {
      environment.GetPageFlag("pageInitPopupCalls").Enqueue({
        callback: showNoSearchResults,
        callbackParam: {srchView: '#comparison-content'}
        },BASE_INIT_MODAL_PRIORITY);
      consumeInitialPopupQueue();
    }
    else
    {
      actionManager.RunAction('ConfigureDashboardSearchGuids');
//      ClosePopup();
    }
  }
  catch (e){}

  try
  {
    showAllSearchesOnMap(jsonSearchGeneral, jsonSearchCompleteList);
  }
  catch (e) {}

  // register map change event handler
  mapManager.GetMapObject('mapSearch').RegisterMapChange(mapChange);


  if ($("div[name='propertyTypeFilterMenu']").html() != null)
      environment.SetPageFlag('propertyTypeFilterMenu', $("div[name='propertyTypeFilterMenu']").html());

  if (environment.GetPageFlag("currentActiveTab") != null) {
      $("#pageToken").val($("#pageToken").val() + "-" + environment.GetPageFlag("currentActiveTab"));
      environment.RemovePageFlag("currentActiveTab")
  }
  storeCurrentPagePropertyDetails(propertyDetailsArrayCurrentPage.GetCollection(), Math.ceil(jsonSearchGeneral.page_current / 1), Math.ceil(jsonSearchGeneral.totalrecords_matched_subset / jsonSearchGeneral.records_per_page), $('#pageToken').val(), Math.ceil(jsonSearchGeneral.totalrecords_matched_subset / 1), Math.ceil(jsonSearchGeneral.records_per_page / 1));

  $('#comparison-content').show();
  // NOTE: we need this call because the jQuery.resize event does not get triggered on Firefox if the scroll appears/hidden
  // on the side of the page. IE it works fine .
  selectCheckboxes();

    try {
        // VMera - FB 48526 - prevent reloading of featured listings on property dashboard (should be same slideshow on page)
        if (environment.GetPageFlag("preventFeaturedListingsReload") != true) {
            actionManager.RunAction('loadPropertyPromotions');
        }
    }
    catch (e) { }

  $(window).resize();
  if (environment.GetPageFlag("useSearchResultsAnchor") == true)
    document.location.href = "#searchResultsAnchor";
}

/*
 * Function: ActivateSearchTab
 *  refreshes and shows/hides the search result tabs
 *
 * Parameters:
 *  actIdx - active tab index
 *  divArray - array containing details about the search results views
 *  bExecuteSearch - specifies whether to execute the search associated to the view tab or only activate it
 *  searchResultsAnchor - specifies whether to anchor page to search results - according to ticket 42401 should only anchor when
 *            user switches between search tabs
*/
function ActivateSearchTab(oParam)
{
  var actIdx = oParam.actIdx;
  var divArray = oParam.divArray;
  var bExecuteSearch = false;
  var searchResultsAnchor = false;

  if (oParam.bExecuteSearch)
    bExecuteSearch = oParam.bExecuteSearch;
  if (oParam.searchResultsAnchor)
    searchResultsAnchor = oParam.searchResultsAnchor;
  if (!oParam.keepSortColumn)
    sortColumn = '';

  //saveSelectedListingsData();
  var arrayLen = divArray.length;
  for(idx = 0; idx < arrayLen; idx++)
  {
    $('#' + divArray[idx][3]).hide();
    $('#' + divArray[idx][3] + '-tab').removeClass('current');
  }
  var activeIndex = actIdx;
  var isSetValue = false;
  if ((actIdx >= 1) && (actIdx <= 3))
    if ((activeTabArrayIndex >= 1) && (activeTabArrayIndex <= 3))
    {
      sliderValue = actIdx - 1;
      isSetValue = true;
    }
  if ((actIdx >= 1) && (actIdx <= 3) && (isSetValue == false))
      activeIndex = sliderValue + 1;
  //sliderValue = actIdx - 1;
  tabElem = divArray[activeIndex];

  $('#' + divArray[activeIndex][3]).show();
  $('#' + divArray[activeIndex][3] + '-tab').addClass('current');

  activeTabArrayIndex = activeIndex;

  if (searchResultsAnchor == true)
    environment.SetPageFlag("useSearchResultsAnchor", true);
  else
    environment.SetPageFlag("useSearchResultsAnchor", false);

  if(bExecuteSearch)
  {
    $('#'+divArray[activeTabArrayIndex][3]).hide();
    $('#searchResultsForm > #UserListingViewType').val(tabElem[5]);
    $('#' + tabElem[1] + " > #ColumnName_UserSort").val(sortColumn);
    $('#' + tabElem[1] + " > #latitudeArray").val(latitudeArraySearchResults.join(','));
    $('#' + tabElem[1] + " > #longitudeArray").val(longitudeArraySearchResults.join(','));
    resetPageNumberForms(divArray);
    environment.SetPageFlag('bMapRefresh','true');
    //if (isSetValue == false)
      //resetViewSelectedIndicators();

    $("#" + tabElem[1] + " > #ListingGUID").val("");
    $("#" + tabElem[1] + " > #ListingID_SelectedIndicator").val("");

    ExecuteSearchViewFromForm(tabElem[0],tabElem[1],tabElem[2],tabElem[4]);
  }
}




/*
 * Function: setSearchPage
 *  sets a new search page
 *
 * Parameters:
 *  pageNumber - new page number
 *  pagingCurrentViewStart - specified from the paging control as the first page to be visible except for page 1
 *  pagingEventType - event that caused the page to change. Possible values: 'next', 'back', ''
 *  location - location of the event for the AJAX call
 *  formId - id of the form coresponding to the desired view
 *  callback - callback function
 *  ajaxReturnFormat - return format from the AJAX call. Possible values: HTML, JSON, XML
*/
function setSearchPage(pageNumber, pagingCurrentViewStart, pagingEventType, divArray, activeIndex,propertyTypeId)
{
  OpenProgressBar();
  activeIndexView = activeIndex;
  currentPage = pageNumber;
  var returnAllMapResults = "N";
  var location = divArray[activeIndex][0];
  var formId = divArray[activeIndex][1];
  var callback = divArray[activeIndex][2];
  var ajaxReturnFormat = divArray[activeIndex][4];

  $("#" + formId + " > #PageNumber_Display").val(pageNumber);
  $("#" + formId + " > #ColumnName_UserSort").val(sortColumn);
  $("#" + formId + " > #PagingCurrentViewStart").val(pagingCurrentViewStart);
  $("#" + formId + " > #PagingEventType").val(pagingEventType);
  $('#' + formId + " > #latitudeArray").val(latitudeArraySearchResults.join(','));
  $('#' + formId + " > #longitudeArray").val(longitudeArraySearchResults.join(','));

  if (propertyTypeId)
  {
    $("#searchResultsForm > #propertyTypeId").val(propertyTypeId);
    $("#oneLineViewForm > #outputXMLOnly").val("");
    resetViewSelectedIndicators();
    returnAllMapResults = "Y";
  }

  $("#" + formId + " > #ListingGUID").val("");
  $("#" + formId + " > #ListingID_SelectedIndicator").val("");

  // reload the advertisement
  reloadAd();
  CloseProgressDlg();

  ExecuteSearchViewFromForm(location, formId, callback, ajaxReturnFormat, returnAllMapResults);
}

/*
 * Function: reloadCurrentSearchView
 * reloads the current search result view (aka page refresh)
*/

function reloadCurrentSearchView(oParam)
{
  var resetViewSelectedArray = false;
  if (oParam)
  {
    if (oParam.resetViewSelectedArray)
      resetViewSelectedArray = oParam.resetViewSelectedArray;
  }

  CloseProgressDlg();
  var formId = searchResult_Views[activeIndexView][1];
  var pageNumber = $("#" + formId + " > #PageNumber_Display").val();
  var pagingCurrentViewStart = $("#" + formId + " > #PagingCurrentViewStart").val();
  var propertyTypeId = $("#searchResultsForm > #propertyTypeId").val();
  resetViewSelectedIndicators(resetViewSelectedArray);
  setSearchPage(pageNumber, pagingCurrentViewStart, '', searchResult_Views, activeIndexView,propertyTypeId);
}

/*
 * Function: sortSearchData
 *  sets a new column to sort by
 *
 * Parameters:
 *  sortBy - new column to sort by
 *  location - location of the event for the AJAX call
 *  formId - id of the form coresponding to the desired view
 *  callback - callback function
 *  ajaxReturnFormat - return format from the AJAX call. Possible values: HTML, JSON, XML
*/
function sortSearchData(sortBy, location, formId, callback, ajaxReturnFormat)
{
  sortColumn = sortBy;
  $("#searchResultsForm > #showOverlay").val('true');
  if(formId == 'oneLineViewForm'){
    if($("#" + formId + " > #ColumnName_UserSort").val() == sortBy){
    // change the sorting order
      if($("#" + formId + " > #SortOrder_UserSort").val() == 'ASC')
        $("#" + formId + " > #SortOrder_UserSort").val('DESC');
      else
        $("#" + formId + " > #SortOrder_UserSort").val('ASC');
    }
  }

  $("#" + formId + " > #PageNumber_Display").val(currentPage);
  $("#" + formId + " > #ColumnName_UserSort").val(sortBy);
  $('#' + formId + " > #latitudeArray").val(latitudeArraySearchResults.join(','));
  $('#' + formId + " > #longitudeArray").val(longitudeArraySearchResults.join(','));
  $("#" + formId + " > #ListingGUID").val("");
  $("#" + formId + " > #ListingID_SelectedIndicator").val("");
  ExecuteSearchViewFromForm(location, formId, callback, ajaxReturnFormat);
}

/*
 * Function: listingSelect
 *  called on click on the checkbox associated to the property listings -
 *  creates an array of clicked elements
 *
 * Parameters:
 *  elemId - id of the checkbox that was clicked
 * manualElemAdd - sets flag to trigger listing save
*/
function listingSelect(elemId,manualElemAdd)
{
  var selectedListingsArray = environment.GetPageFlag("selectedListingsArray");
  if (selectedListingsArray == null)
    selectedListingsArray = [];
  var selectedListingGUID = $("#" + elemId).val();
  var positionInArray = $.inArray(selectedListingGUID, selectedListingsArray);
  if (positionInArray >= 0)
    selectedListingsArray.splice(positionInArray, 1);
  else
    selectedListingsArray.push(selectedListingGUID);
  environment.SetPageFlag("selectedListingsArray", selectedListingsArray);
}

/*
 * Function: saveSelectedListingsData
 *  save selected listings data
*/
function saveSelectedListingsData(formId)
{
  var selectedArray = environment.GetPageFlag("selectedListingsArray");
  var previousSelectedListings = environment.GetPageFlag("previousSelectedListings");
  var selectedArrayProcessed = [];
  var selectedArrayCopy = [];
  var selectedArrayLen = selectedArray.length;
  var selectedArrayIndicator = [];
  for (var index = 0; index < selectedArrayLen; index++)
  {
    selectedArrayProcessed.push(selectedArray[index]);
    selectedArrayCopy.push(selectedArray[index]);
    selectedArrayIndicator.push("Y");
  }
  environment.SetPageFlag("previousSelectedListings", selectedArrayCopy);
  if (previousSelectedListings != null)
  {
    var previousSelectedListingsLen = previousSelectedListings.length;
    for (var index = 0; index < previousSelectedListingsLen; index++)
    {
      if ($.inArray(previousSelectedListings[index], selectedArrayProcessed) < 0)
      {
        selectedArrayProcessed.push(previousSelectedListings[index]);
        selectedArrayIndicator.push("N");
      }
    }
  }
  $("#" + formId + " > #ListingGUID").val(selectedArrayProcessed);
  $("#" + formId + " > #ListingID_SelectedIndicator").val(selectedArrayIndicator);
}

/*
 * Function: togglePropertiesView
 *  toggle between View Selected Properties/View All Properties functionality
 *
 * Parameters:
 *  actIdx - active tab index
 *  divArray - array containing details about the search results views
 *  ajaxReturnFormat - return format from the AJAX call. Possible values: HTML, JSON, XML
*/
function togglePropertiesView(divArray, activeIndex, ajaxReturnFormat)
{
  var location = divArray[activeIndex][0];
  var formId = divArray[activeIndex][1];
  var callback = divArray[activeIndex][2];
  // toggle the control's value
  //IE fix
  if ($("#searchResultsForm > #ViewSelectedOnlyIndicator").val() == "null")
    $("#searchResultsForm > #ViewSelectedOnlyIndicator").val('N');
  var tmpViewSelectedPropertiesOnly = $("#searchResultsForm > #ViewSelectedOnlyIndicator").val();
  if (tmpViewSelectedPropertiesOnly == "Y")
    tmpViewSelectedPropertiesOnly = "N";
  else
  {
    if (environment.GetPageFlag("selectedListingsArray").length > 0)
    {
      tmpViewSelectedPropertiesOnly = "Y";
      saveSelectedListingsData(formId);
    }
    else
    {
      var ajaxAdapterTmp = new AJAXAdapter();
      ajaxAdapterTmp.call(environment.eventManager.GetObject('noPropertiesSelected'), OpenHTMLPopup);
      return;
    }
  }
  environment.SetPageFlag('FilterSelectedProperties',tmpViewSelectedPropertiesOnly);
  $("#searchResultsForm > #ViewSelectedOnlyIndicator").val(tmpViewSelectedPropertiesOnly);

  resetPageNumberForms(divArray);
  $("#" + formId + " > #ColumnName_UserSort").val(sortColumn);
  $('#' + formId + " > #latitudeArray").val(latitudeArraySearchResults.join(','));
  $('#' + formId + " > #longitudeArray").val(longitudeArraySearchResults.join(','));
  ExecuteSearchViewFromForm(location, formId, callback, ajaxReturnFormat, 'Y');
}

function selectCheckboxes()
{
  var selectedListingsArray = environment.GetPageFlag("selectedListingsArray");
  var selectedListingsArrayLen = selectedListingsArray.length;

  if ((selectedListingsArray != null) && (selectedListingsArrayLen > 0))
  {
    for (var index = 0; index < selectedListingsArrayLen; index++)
      $('[value="' + selectedListingsArray[index] + '"]').attr("checked", "checked");
  }
}

/*
 * Function: resetPageNumberForms
 *  set to 1 the page number on all the search results view forms
 *
 * Parameters:
 *  divArray - array containing details about the search results views
*/
function resetPageNumberForms(divArray)
{
  currentPage = 1;
  var arrayLen = divArray.length;
  for(arrayIndex = 0; arrayIndex < arrayLen; arrayIndex++)
  {
    $('#' + divArray[arrayIndex][1] + " > #PageNumber_Display").val(1);
  }
}

/*
 * Function: setSameHeight
 *  sets the same heght for all elements on a line for the comparison view
 *
 * Parameters:
 *  none
*/
function setSameHeight()
{
  var numberOfTableRowsDisplayed = $("#numberOfTableRowsDisplayed").val();
  var numberOfRowsDisplayed = $("#numberOfRowsDisplayed").val();
  var rowIndex;
  for (tableRowIndex = 1; tableRowIndex <= numberOfTableRowsDisplayed; tableRowIndex++)
  {
    $(".tableRow_" + tableRowIndex).each(function(i, el)
    {
      for (rowIndex = 0; rowIndex <= numberOfRowsDisplayed; rowIndex++)
      {
        var maxHeight = -1;
        $(".line_" + rowIndex).each(function(i, el)
        {
          if (maxHeight < $(el).height())
            maxHeight = $(el).height();
        });
        $(".line_" + rowIndex).each(function(i, el)
        {
          $(el).height(maxHeight);
        });
      }
    });
  }
}

/*
 * Function: setComparisonViewHeader
 *  implements comparison view display logic
 *
 * Parameters:
 *  none
*/
function setComparisonViewHeader()
{
  setSameHeight();
  $("[id^=comparisonResolution_]").each(function(i,el)
  {
    $(el).removeClass("activeResolution");
  });
  $("#comparisonResolution_" + sliderValue).addClass("activeResolution");
  $("#slider").slider(
  {
    value: sliderValue,
    min: 0,
    max: 2,
    step: 1,
    change: function(event, ui) {
      ActivateSearchTab({actIdx:ui.value + 1, divArray:searchResult_Views, bExecuteSearch:true, searchResultsAnchor:true, keepSortColumn:true});
    }
  });
}

function setSliderValue(idx)
{
    sliderValue = idx;
  $("#slider").slider(
  {
    value: idx
  });
}

/*
 * Function: refreshSearchresults
 *  implements logic for handling the view of the results in case of map changes (zoom, drag)
 *
 * Parameters:
 *  pointsArray - array of points that represent the corners of the map
*/

function refreshSearchresults(pointsArray)
{
  // write the points values in the hidden fields in the form
  var points = pointsArray.length;
  latitudeArraySearchResults.splice(0, latitudeArraySearchResults.length);
  longitudeArraySearchResults.splice(0, longitudeArraySearchResults.length);
  for (index = 0; index < points;index++)
  {
    latitudeArraySearchResults.push(pointsArray[index].lat);
    longitudeArraySearchResults.push(pointsArray[index].lon);
  }
  $('#' + searchResult_Views[activeTabArrayIndex][1] + " > #latitudeArray").val(latitudeArraySearchResults.join(','));
  $('#' + searchResult_Views[activeTabArrayIndex][1] + " > #longitudeArray").val(longitudeArraySearchResults.join(','));

  //IE fix
  if ($("#searchResultsForm > #ViewSelectedOnlyIndicator").val() == "null")
    $("#searchResultsForm > #ViewSelectedOnlyIndicator").val('N');
}

//This version of the function has been depreciated, no automatic search on map mvoe
/*
function refreshSearchresults_old(pointsArray)
{
  OpenProgressDlg();
  var ajaxAdapterTmp = new AJAXAdapter();
  resetPageNumberForms(searchResult_Views);

  // write the points values in the hidden fields in the form
  var points = pointsArray.length;
  latitudeArraySearchResults.splice(0, latitudeArraySearchResults.length);
  longitudeArraySearchResults.splice(0, longitudeArraySearchResults.length);
  for (index = 0; index < points;index++)
  {
    latitudeArraySearchResults.push(pointsArray[index].lat);
    longitudeArraySearchResults.push(pointsArray[index].lon);
  }
  $('#' + searchResult_Views[activeTabArrayIndex][1] + " > #latitudeArray").val(latitudeArraySearchResults.join(','));
  $('#' + searchResult_Views[activeTabArrayIndex][1] + " > #longitudeArray").val(longitudeArraySearchResults.join(','));

  var param = ajaxAdapterTmp.setParametersFromForm(searchResult_Views[activeTabArrayIndex][1]);
  if (trim(param) == "")
  {
    // there isn't anything in the form, pass at least the coordinates and last sort column
    // we can get to this situation if a search returns no results and we adjust the map
    ajaxAdapterTmp.setParametersString("latitudeArray=" + latitudeArraySearchResults.join(',') + "&longitudeArray=" + longitudeArraySearchResults.join(','), APPEND_PARAM);
    if (sortColumn != "")
      ajaxAdapterTmp.setParametersString("ColumnName_UserSort=" + sortColumn, APPEND_PARAM);
  }
  var tmpUserSearchGUID = $('#searchResultsForm > #userSearchGUID').val();
  if($.trim(tmpUserSearchGUID) == ''){
  // if there isn't any userSearchGUID in the search result form, try to get the userSearchGUID from
  // the main form
  // NOTE: at least one of the userSearchGUID MUST be set
    tmpUserSearchGUID = $('#' + mainSearchFormID + ' > #userSearchGUID').val();
  }
  ajaxAdapterTmp.setParametersString("UserSearchGUID=" + tmpUserSearchGUID, APPEND_PARAM);
  //IE fix
  if ($("#searchResultsForm > #ViewSelectedOnlyIndicator").val() == "null")
    $("#searchResultsForm > #ViewSelectedOnlyIndicator").val('N');
  var tmpUserListingViewType = $('#searchResultsForm > #UserListingViewType').val();
  ajaxAdapterTmp.setParametersString("UserListingViewType=" + tmpUserListingViewType, APPEND_PARAM);
  var tmpViewSelectedPropertiesOnly = $('#searchResultsForm > #ViewSelectedOnlyIndicator').val();
  param = ajaxAdapterTmp.setParametersString("ViewSelectedOnlyIndicator=" + tmpViewSelectedPropertiesOnly, APPEND_PARAM);
  ajaxAdapterTmp.setAJAXReturnFormat(searchResult_Views[activeTabArrayIndex][4]);

  ajaxAdapterTmp.call(searchResult_Views[activeTabArrayIndex][0], searchResult_Views[activeTabArrayIndex][2]);
}
*/

/*
 * Function: hideMapAndAugmentation
 *  hide map and map augmentation data
*/
function hideMapAndAugmentation()
{

  // remove any existing infoboxes on the map
  theMap = mapManager.GetMapObject("mapSearch");
  if(theMap){
    // re-enable the pushpin hover
    theMap.EnablePushpinHover(true);
    theMap.clearMapInfoBox();
    theMap.setIsMapHidden(true);
  }
  $("#search-map").hide();
  $("#search-right").hide();
  $("#hideMapArrow").hide();
  $("#showMapArrow").show();
  $("#search-results-count").show();

  if ($("#mapExpandDecreaseContainer").length > 0){
    $("#expandMap").html("Expanded Map").show().addClass('marginRight15');
    $("#decreaseMap").show();
    $("#showMapArrow").hide();
  }
}

/*
 * Function: showMapAndAugmentation
 *  show map and map augmentation data
*/
function showMapAndAugmentation()
{
  $("#search-map").show();
  $("#search-right").show();
  $("#hideMapArrow").show();
  $("#showMapArrow").hide();
  $("#search-results-count").hide();
  var theMap = mapManager.GetMapObject("mapSearch");
  if(theMap != null){
    theMap.EnablePushpinHover(true);
    theMap.setIsMapHidden(false);
  }
}

/*
 * Function: setSearchTabPropertyID
 * Assigns the property type id to the filter
*/

function setSearchTabPropertyID(divArray, activeIndex,propertyTypeId)
{
  environment.SetPageFlag('augmentationDataStorage',augmentationDataStorage);
  environment.SetPageFlag('propertyTypeChange', propertyTypeId);
  var prevActiveTabArrayIndex = 0;
  if ((activeTabArrayIndex >= 1) && (activeTabArrayIndex <= 3)) {
      prevActiveTabArrayIndex = activeTabArrayIndex;
  }

  resetSearchResultsData({keepRightContentBar:true});
  environment.SetPageFlag('abortErrorWindow', true);
  activeTabArrayIndex = prevActiveTabArrayIndex;
  setSearchPage('1', '1', '', divArray, activeIndex,propertyTypeId);
}


/* Function: cancelSelectedPropertyWatches
 * user when the agent uses the checkboxes to select client listings
*/

function cancelSelectedPropertyWatches()
{
  var ajaxAdapterTmp = new AJAXAdapter();
  var selectedListings = searchResultsListingSelect(environment.GetPageFlag("selectedListingsArray"),'Y');

  if(selectedListings)
  {
    var event = 'propertyDetails.cancelPropertyWatch';
    ajaxAdapterTmp.setParametersString("ListingGUID=" + selectedListings.listingGUIDArray.join(','));
    ajaxAdapterTmp.setParametersString("ListingID_SelectedIndicator=" + selectedListings.listingIDSelectedArray.join(','), APPEND_PARAM);
    ajaxAdapterTmp.setParametersString("userSearchGuid=" + $("#searchResultsForm > #userSearchGUID").val(),APPEND_PARAM);
    OpenProgressDlg();
    ajaxAdapterTmp.call(BuildURL(event), reloadCurrentSearchView);
  }
  else
  {
    ajaxAdapterTmp.call(environment.eventManager.GetObject('noPropertiesSelected'), OpenHTMLPopup);
  }
}

/* Function: addToMyShowings
 * opens an add to My showing popup for that property
*/
function addToMyShowings(listingGUID){
  var ajaxAdapter = new AJAXAdapter();
  var urlLocation = BuildURL('agent.showAddToMyShowings');
  OpenProgressDlg();

  ajaxAdapter.setParametersString('ListingGUID=' + listingGUID);
  ajaxAdapter.call(urlLocation, addToMyShowings_callback);
}

/*
 * Function: addToMyShowings_callback
 *  callback function
 *
 * Parameters:
 *  htmlData - data returned by ajax call
*/
function addToMyShowings_callback(htmlData){
  CloseProgressDlg();
  OpenHTMLPopup(htmlData);
  $('div#popup_content').css('overflow','visible'); // for calendar not to be cut on overflow
}

function updateSearchCount(totalRecordsMatched)
{
  var displayText = "1 Property";
  if (totalRecordsMatched != 1){
    displayText = totalRecordsMatched + " Properties";
  }
  $("#searchCount_map").html(displayText);
  $("#searchCount_hiddenMap").html(displayText);

  $("#search-results-tooltip").show();
  $("#search-results-tooltip").css("z-index", "2");
  $("#search-results-tooltip").stop().animate({"opacity" : 1}, 200);
}

function expandMap(mapObject){
  $("#expandMap").html("Expand Map").removeClass('marginRight15');
  showMapAndAugmentation();
  var mapId = mapObject.mapId;
  var mapHeight = mapObject.height;
  var mapInitialHeight = mapObject.initialHeight;
  var mapObj = mapManager.GetMapObject(mapId);

  if (mapObj.getMap().GetMapOptions().height <= mapInitialHeight){
    $("#" + mapObject.container).addClass('expandedMap');
    $("#mapNav").addClass('large');
    $("#mapContainer_" + mapId).height($("#mapContainer_" + mapId).height() + mapHeight);

    try{
      mapObj.Resize({height: mapHeight, operationHeight: "+", width: null, operationWidth: null});
      showAllSearchesOnMap(jsonSearchGeneral, jsonSearchCompleteList, mapId);
    }
    catch(e){}
  }

  $("#expandMap").hide();
  $("#decreaseMap").show();
}

function decreaseMap(mapObject){
  $("#expandMap").html("Expand Map").removeClass('marginRight15');
  showMapAndAugmentation();
  var mapId = mapObject.mapId;
  var mapHeight = mapObject.height;
  var mapInitialHeight = mapObject.initialHeight;
  var mapObj = mapManager.GetMapObject(mapId);

  if (mapObj.getMap().GetMapOptions().height > mapInitialHeight){
    $("#mapContainer_" + mapId).height($("#mapContainer_" + mapId).height() - mapHeight);
    $("#mapNav").removeClass('large');
    $("#" + mapObject.container).removeClass('expandedMap');

    try{
      mapObj.Resize({height: mapHeight, operationHeight: "-", width: null, operationWidth: null});
      showAllSearchesOnMap(jsonSearchGeneral, jsonSearchCompleteList, mapId);
    }
    catch(e){}
  }

  $("#expandMap").show();
  $("#decreaseMap").hide();
};
/*
 * Script: validations.js
*/
/*
 * Section: Validation functions
*/
/*
 * Function: requiredFieldValidator
 *  validate field to be different from default value
 *
 * Parameters:
 *  fieldValue - value to validate
 *  defaultValue - default value
 *
 * Returns:
 *  boolean value saying if fieldValue is different from defaultValue
*/

var validationErrorFieldArray = new Array();
var currentValidationForm = '';

function requiredFieldValidator(fieldValue, defaultValue)
{
  var isValid = true;
  if (fieldValue == defaultValue)
    isValid = false;
  return isValid;
}

/*
 * Function: regularExpressionValidator
 *  validate field to match regular expression
 *
 * Parameters:
 *  fieldValue - value to validate
 *  regex - regular expression
 *
 * Returns:
 *  boolean value saying if fieldValue matches regular expression
*/
function regularExpressionValidator(fieldValue, regex)
{
  var regularExp = RegExp(regex, "i");
  return regularExp.test(fieldValue);
}

/*
 * Function: validateEmail
 *  function to validate email address
 *
 * Parameters:
 *  email address
 */
function validateEmail(email) {
  var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  if(reg.test(email) == false) {
    return false;
  }
  return true;
}

function validateZIPCode(data)
{
  data = data.replace(/^\s+/,"").replace(/\s+$/,"");
  return /^([0-9]){5,5}$|(([0-9]){5,5}(-| ){1}([0-9]){4,4}$)/.test(data);
}

function validateNumeric(data)
{
  return !isNaN(parseFloat(data)) && isFinite(data);
}


/* Function: validateForm
 * This function handles the form validation
 *
 * Parameters
 * errorArray - contains all of the information about the control field
*/

function validateForm(errorArray)
{
  var fieldIdArray = new Array();
  //Resets the currentErrorArray
  for (var f=0;f < validationErrorFieldArray.length;f++)
  {
    //alert(validationErrorFieldArray[f]);
    $(eval("document."+currentValidationForm+"."+validationErrorFieldArray[f])).removeClass('textboxError');
  }

  validationErrorFieldArray = new Array();

  for (var f=0;f < errorArray.length;f++)
  {
    fieldIdArray = errorArray[f].split(']');
    validationErrorFieldArray.push(fieldIdArray[0]);

    //The first element is the controlID
    $(eval("document."+currentValidationForm+"."+fieldIdArray[0])).addClass('textboxError');
    //The second element is the error message
  }
}

function cleanCMAPrice(elemValue)
{
  var deleteElements = ["$", ",", " "];
  var deleteElementsLen = deleteElements.length;
  for (var index = 0; index < deleteElementsLen; index++)
  {
    while (elemValue.indexOf(deleteElements[index]) >= 0)
      elemValue = elemValue.replace(deleteElements[index], "");
  }
  return elemValue;
}

function cleanCMANumber(elemValue)
{
  var deleteElements = [",", " "];
  var deleteElementsLen = deleteElements.length;
  for (var index = 0; index < deleteElementsLen; index++)
  {
    while (elemValue.indexOf(deleteElements[index]) >= 0)
      elemValue = elemValue.replace(deleteElements[index], "");
  }
  return elemValue;
}

function validateCMAPrice(elemValue)
{
  return validateCMANumber(cleanCMAPrice(elemValue));
}

function validateCMANumber(elemValue, required)
{
  if (required == false)
    var numericPattern = /^\d*$/;
    else
      var numericPattern = /^\d+$/;
  return numericPattern.test(cleanCMANumber(elemValue));
}

function validateCMAFloat(elemValue, required)
{
  if (required == false)
    var numericPattern = /^\d*(?:[.,]\d+)?$/;
    else
      var numericPattern = /^\d+(?:[.,]\d+)?$/;
  return numericPattern.test(cleanCMANumber(elemValue));
};

function ExecuteDocScripts(){}

function preloadFrontPagePanels(location)
{
  OpenProgressDlg();
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setAJAXReturnFormat('json');
  ajaxAdapter.call(location, preloadFrontPagePanels_callback);
}

function preloadFrontPagePanels_callback(jsonData)
{
  CloseProgressDlg();
  if (checkJSON(jsonData))
    environment.SetPageFlag('theseMightInterestYouSearchGUIDSet', jsonData);
  var thePanels = environment.GetPageFlag('FrontPagePanels').GetObjectCollection();
  var frontPagePanelsLen = thePanels.length;
  for(crtPanel = 0; crtPanel < frontPagePanelsLen; crtPanel++)
    loadFrontPagePanel(thePanels[crtPanel]);
}

/*
 * Function: loadFrontPagePanel
 *  loads the given front page panel
 *
 * Parameters:
 *  panelObject - object containing data about the panel to load
*/
function loadFrontPagePanel(panelObject, syncCall){
  OpenProgressDlg();
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setAJAXReturnFormat('xml');
  ajaxAdapter.setParametersString('ContainerID=' + panelObject.ID);
  ajaxAdapter.setParametersString('panelLabel=' + panelObject.panelLabel, APPEND_PARAM);
  ajaxAdapter.setParametersString('panelName=' + panelObject.panelName, APPEND_PARAM);
  ajaxAdapter.setParametersString('panelActionLabel=' + panelObject.panelActionLabel, APPEND_PARAM);
  if ((syncCall != null) && (syncCall == true))
    ajaxAdapter.async = false;
  if ((panelObject.panelName == 'TheseMightInterestYou') && (environment.GetPageFlag('theseMightInterestYouSearchGUIDSet') != null))
    ajaxAdapter.setParametersString('theseMightInterestYouSearchGUIDSet=' + JSON.encode(environment.GetPageFlag('theseMightInterestYouSearchGUIDSet')), APPEND_PARAM);
  if (panelObject.panelName == 'Weather'){
    ajaxAdapter.setParametersString("weatherZipCode=" + environment.GetPageFlag("weatherZipCode"), APPEND_PARAM);
    ajaxAdapter.setParametersString("weatherCity=" + environment.GetPageFlag("weatherCity"), APPEND_PARAM);
    ajaxAdapter.setParametersString("weatherMLSLatitude=" + environment.GetPageFlag("weatherMLSLatitude"), APPEND_PARAM);
    ajaxAdapter.setParametersString("weatherMLSLongitude=" + environment.GetPageFlag("weatherMLSLongitude"), APPEND_PARAM);
  }
  ajaxAdapter.call(panelObject.Location, loadFrontPagePanel_callback, loadFrontPagePanelError_callback);
}

function loadFrontPagePanelError_callback(jqXHR, textStatus, errorThrown)
{
  CloseProgressDlg();
  if (jqXHR.status == 402)
  {
    userLogout('/index.cfm/event/logout');
    return false;
  }
  var loadedPanelNumber = environment.GetPageFlag("currentLoadedPanels");
  loadedPanelNumber++;
  environment.SetPageFlag("currentLoadedPanels", loadedPanelNumber);
  if (environment.GetPageFlag("currentLoadedPanels") == environment.GetPageFlag("numberOfPanelOnFrontPage"))
    loadFrontPagePanelFinished();
}

/*
 * Function: loadFrontPagePanel_callback
 *  loads the front page panel HTML
 *
 * Parameters:
 *  htmlData - panel HTML
*/
function loadFrontPagePanel_callback(xmlData){
  CloseProgressDlg();
  var loadedPanelNumber = environment.GetPageFlag("currentLoadedPanels");
  loadedPanelNumber++;
  environment.SetPageFlag("currentLoadedPanels", loadedPanelNumber);

  if(!checkXML(xmlData))
  {
    //in case last loaded panel causes error call loadFrontPagePanelFinished
    if (environment.GetPageFlag("currentLoadedPanels") == environment.GetPageFlag("numberOfPanelOnFrontPage"))
      loadFrontPagePanelFinished();
    return;
  }
  var divID = getXMLNodeValue(xmlData.getElementsByTagName('ContainerID')[0].firstChild);
  var htmlData = getXMLNodeValue(xmlData.getElementsByTagName('HTML')[0].firstChild);
  if ($.trim(htmlData) != "")
  {
    $("#" + divID).parent().show();
    $("#" + divID).show();
    $("#" + divID).html(htmlData);
  }
  else
    $("#" + divID).hide();

  // make sure to adjust the menu shadow
  $(window).resize();
  if (environment.GetPageFlag("currentLoadedPanels") == environment.GetPageFlag("numberOfPanelOnFrontPage"))
    loadFrontPagePanelFinished();
}

/*
 * Function: loadFrontPagePanelFinished
 *  function called when all the panel of the pages are loaded
 *  this function assures that all empty containers are hidden and that the spacing is according to specification
*/
function loadFrontPagePanelFinished()
{
  var leftVisibleFirstReached = false;
  $("#leftContainer").children().each(function(i, el) {
    var parentNodeHasContent = false;
    $(el).children().each(function(i, elem) {
      if (($(elem).is(":visible") == true) && ($.trim($(elem).html()) != ""))
        parentNodeHasContent = true;
    });
    if (parentNodeHasContent == false)
      $(el).hide();
    //the first visible container on the page must be at 10px from top
    //but due to action items spacing exceptions need to modify top margin of elements
    if (($(el).is(":visible") == true) && (leftVisibleFirstReached == false))
    {
      leftVisibleFirstReached = true;
      $(el).children().each(function(i, childElem) {
        $(childElem).css({marginTop: "0px"});
      });
    }
  });

  var rightVisibleFirstReached = false;
  $("#rightContainer").children().each(function(i, el) {
    var parentNodeHasContent = false;
    $(el).children().each(function(i, elem) {
      if ($(elem).is(":visible") == true)
        parentNodeHasContent = true;
    });
    if (parentNodeHasContent == false)
      $(el).hide();
    if (($(el).is(":visible") == true) && (rightVisibleFirstReached == false))
    {
      rightVisibleFirstReached = true;
      $(el).children().each(function(i, childElem) {
        $(childElem).css({marginTop: "0px"});
      });
    }
  });

  var visibleFirstReached = false;
  $("#frontPageContainerColumn_1").children().each(function(i, el) {
    var parentNodeHasContent = false;
    $(el).children().each(function(i, elem) {
      if ($(elem).is(":visible") == true)
        parentNodeHasContent = true;
    });
    if (parentNodeHasContent == false)
      $(el).hide();
    //the first visible container on the page must be at 10px from top
    //but due to action items spacing exceptions need to modify top margin of elements
    if (($(el).is(":visible") == true) && (visibleFirstReached == false))
    {
      visibleFirstReached = true;
      $(el).css({marginTop: "0px"});
    }
  });

  var visibleFirstReached = false;
  $("#frontPageContainerColumn_2").children().each(function(i, el) {
    var parentNodeHasContent = false;
    $(el).children().each(function(i, elem) {
      if ($(elem).is(":visible") == true)
        parentNodeHasContent = true;
    });
    if (parentNodeHasContent == false)
      $(el).hide();
    //the first visible container on the page must be at 10px from top
    //but due to action items spacing exceptions need to modify top margin of elements
    if (($(el).is(":visible") == true) && (visibleFirstReached == false))
    {
      visibleFirstReached = true;
      $(el).css({marginTop: "0px"});
    }
  });

  var visibleFirstReached = false;
  $("#frontPageContainerColumn_3 div.FrontPageContent_Container").children().each(function(i, el) {
    var parentNodeHasContent = false;
    if ($(el).is(":visible") == true)
      parentNodeHasContent = true;
    if (parentNodeHasContent == false)
      $(el).hide();
    //the first visible container on the page must be at 10px from top
    //but due to action items spacing exceptions need to modify top margin of elements
    if (($(el).is(":visible") == true) && ($.trim($(el).html()).length > 0) && (visibleFirstReached == false))
    {
      visibleFirstReached = true;
      $(el).removeClass("marginTop20");
    }
  });

//  ClosePopup();
  if (environment.GetPageFlag("defaultVideoPlay") != null)
    im_auto_ep({ video_id:environment.GetPageFlag("defaultVideoPlay") });

  if (environment.GetPageFlag("agentFrontPageAdjustment") != null){
    if (($(".frontPageMainContainer").height() - $(".whatNextMainSection").height()) < Math.max($("#frontPageContainerColumn_1").height(),$("#frontPageContainerColumn_2").height())){
      $(".whatNextMainSection").css({position: "relative", marginTop: "15px"});
    }
  }

  consumeInitialPopupQueue();
}

/*
 * Function: frontPage_calendar_dayClick
 *  Action to take when one cell of the calendar is clicked.
 *
 * Parameters:
 *  event: event obj
 * _id: id of the calendar view
 * _year, _month, _day: year month day represented on the clicked cell
*/
function frontPage_calendar_dayClick(event, _id, _year, _month, _day)
{
  var target = event.target || event.srcElement;
  //only redirect if clicked on the corner number or the link text
  if ((target.tagName == 'H5') || ((target.id != "") && ($('#'+target.id).parents("span.frontPageTask").length > 0)))
  {
    OpenProgressDlg();
    location.href = environment.ApplicationPath + environment.eventManager.GetObject("myAccount.calendar") + "/calendarDefaultTab/2/year/" + _year + "/month/" + _month + "/day/" + _day;
  }
}

/*
 * Function: frontPage_fillTasks
 *  Puts the tasks from taskList variable into the view of the calendar.
 *
 * Parameters:
 *  _container - the calendar view to fill with tasks
*/
function frontPage_fillTasks(_container)
{
  var displayTextCalendarRowsLimit = 5;
  var taskList = environment.GetPageFlag('TaskList').usertasklist;
  var taskTypes = environment.GetPageFlag('TaskList').usertasktypes;
  var fpCalendar = environment.GetPageFlag('CalendarObj');
  var containerSpan, prevTaskNumber, taskColor, taskHtml, imgColorUrl;
  for (var i = 0; i<taskList.usertaskguid.length; i++)
  {
    //frontPageCalendar_6_20
    containerSpan = _container + '_' + (taskList.month[i] * 1 - 1) + '_' + taskList.day[i] * 1;
    prevTaskNumber = $('#'+containerSpan+'_taskNumber').text() || '0';
    if (prevTaskNumber == '0')
    {
      taskColorIndex = frontPage_getIndexOf(taskTypes.usertasktypeid, taskList.usertasktypeid[i]);
      if (taskColorIndex != -1)
      {
          imgColorUrl = environment.ApplicationRoot + '/cdn/images/circles/circle_' + taskTypes.userviewed_color[taskColorIndex] + '.png"';
        taskHtml = '<span class="frontPageCalendar_DayContent"><img id="'+containerSpan+'_image" src="'+imgColorUrl+'" class="frontPageTaskColor">';
        taskHtml += '<span class="frontPageTask link"> <span id="'+containerSpan+'_taskNumber" class="frontPageTaskNumber">1</span><span id="'+containerSpan+'_taskText"> Event </span> </span> </span>';
        $('#span_'+containerSpan).html(taskHtml);
      }
      else
      {
        throw "Inconsistency between task - task type lists!";
      }
    }
    else
    {
      taskHtml = prevTaskNumber * 1 + 1;
      imgColorUrl = environment.ApplicationRoot + '/cdn/images/circles/circle_grey.png';
      $('#'+containerSpan+'_taskNumber').html(taskHtml);
      $('#'+containerSpan+'_taskText').html('Events');
      $('#'+containerSpan+'_image').attr('src', imgColorUrl);
    }
    if (environment.GetPageFlag('NumberOfFrontPageCalendarRows') > displayTextCalendarRowsLimit)
      $('#'+containerSpan+'_taskText').html('');
  }
  fpCalendar.fixHeights(_container);
}

/*
 * Function: frontPage_getIndexOf
 *  General function to get the index of a value from an array.
 *  Returns -1 if no key found to match.
 *
 * Parameters:
 *  _array - the array to search
 *  _key - key to search
*/
function frontPage_getIndexOf(_array, _key)
{
  var index = 0;
  var arrayLen = _array.length;
  var keyFoundAt = -1;
  while ((index < arrayLen && keyFoundAt == -1))
  {
    if (_array[index] == _key)
    {
      keyFoundAt = index;
    }
    index++;
  }
  return keyFoundAt;
}

/*
 * Function: getClassName
 *  get class name based on the number of columns
 *
 * Parameters:
 *  visibleColumnsNumber - number of visible columns
*/
function getClassName(visibleColumnsNumber,suffixIndicator)
{
  var className = "col";
  switch (parseInt(visibleColumnsNumber))
  {
    case 1:
      className = "single" + className;
      break;
    case 2:
      className = "two" + className;
      break;
    case 3:
      className = "three" + className;
      break;
    default:
      className = "single" + className;
      break;
  }
  if (suffixIndicator != null)
    className += suffixIndicator;
  return className;
}

/*
 * Function: modifyClientAction
 *  modify client action
 *
 * Parameters:
 *  elem - checkbox element that was selected
 *  userActionGUID - user action GUID
 *  panelID - panel ID
*/
function modifyClientAction(elem, userActionGUID, panelID)
{
  OpenProgressDlg();
  var element = $(elem).val();
  var isChecked = "N";
  if ($(elem).attr("checked") == true)
    isChecked = "Y";
  var event = 'frontPage.modifyClientActions';
  var ajaxAdapter = new AJAXAdapter();
  environment.SetPageFlag("modifiedPanelID", panelID);
  ajaxAdapter.setParametersString("userActionGUID=" + userActionGUID);
  ajaxAdapter.setParametersString(element + "=" + isChecked, APPEND_PARAM);
  ajaxAdapter.call(environment.ApplicationPath + event, modifyClientActionCallback);
}

/*
 * Function: modifyClientActionCallback
 *  modify client action callback
*/
function modifyClientActionCallback()
{
  var frontPagePanels = environment.GetPageFlag('FrontPagePanels');
  loadFrontPagePanel(frontPagePanels.GetObject(environment.GetPageFlag("modifiedPanelID")), true);
  loadFrontPagePanel(frontPagePanels.GetObject('ActionItemArchive'), true);
  CloseProgressDlg();
}

/*
 * Function: setGridScroll
 *  set grid scroll
 *
 * Parameters:
 *  maxRowsDisplayed - max rows displayed
 *  tableBodyId - table body id
 *  gridRecords - grid records
*/
function setGridScroll(maxRowsDisplayed, tableBodyId, gridRecords, resetBorders)
{
  var rowHeight = $("#" + tableBodyId + " tr td").height() + 1; // we need to add the row border
  if (maxRowsDisplayed < gridRecords)
  {
    $("#" + tableBodyId + " tr td.frontPageLastCell").each(function(i, el)
    {
      $(el).attr("class", "hasScrollFrontPageLastCell");
    });
  }
  var threshold = 0;
  if (maxRowsDisplayed == gridRecords)
    threshold = maxRowsDisplayed;
  var tableMaxHeight = (maxRowsDisplayed * rowHeight + threshold - 1).toString() + "px";
  $("#" + tableBodyId).css({maxHeight: tableMaxHeight});
  if (resetBorders)
  {
    $("#" + tableBodyId+" tr").each(function(idx,elem){
      rowId = $(elem).attr('id');
      $("#"+rowId+" td").removeClass("frontPageRemoveBorderBottom");
      $("#"+rowId+" td").addClass("frontPageAddBorderBottom");
    });
    $("#" + tableBodyId+" tr:last").each(function(idx,elem){
      rowId = $(elem).attr('id');
      $("#"+rowId+" td").removeClass("frontPageAddBorderBottom");
      $("#"+rowId+" td").addClass("frontPageRemoveBorderBottom");
    });
  }
}

/*
 * Function: executeFrontPageSearch
 *  execute front page search
 *
 * Parameters:
 *  location - location to make AJAX call to
 *  userSearchGUID - user search GUID
*/
function executeFrontPageSearch(location, userSearchGUID)
{
  OpenProgressDlg();
  $("[id^='mapMenuItem_']").each(function(i,el)
  {
    $(el).attr("class", "");
  });
  $("#mapMenuItem_" + userSearchGUID.toString()).attr("class", "Selected");
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setParametersString("userSearchGUID=" + userSearchGUID);
  ajaxAdapter.call(location, executeFrontPageSearch_callback);
}

/*
 * Function: executeFrontPageSearch_callback
 *  execute front page search callback
 *
 * Parameters:
 *  htmlData - HTML data returned by AJAX request
*/
function executeFrontPageSearch_callback(htmlData)
{
  $("#mapSearchResultsData").html(htmlData);
  processFrontPageSearchResults(jsonSearchGeneral, jsonSearchCompleteList);
  CloseProgressDlg();
}

function processFrontPageSearchResults(jsonSearchGeneral, jsonSearchCompleteList)
{
  var mapObj = mapManager.GetMapObject("frontPageMap");
  var mapAdapter = mapObj.getMap();
  //bird's eye view - need to reset
  if (mapAdapter.GetMapStyle() == mapAdapter.MapTypeId().Birdseye)
  {
    mapAdapter.SetMapStyle(mapAdapter.MapTypeId().Road);
    $("#frontPageMapToolsMenuMapType").removeClass().addClass("fpRoad");
    $("#fPBRotateCW").hide();
    $("#fPBRotateCCW").hide();
    var tWidth = $("#frontPage-map").width() - 133;
    var topMenuWidthCenter = $("#frontPageMapTools").width();
    var left = Math.round((tWidth - topMenuWidthCenter)/2 + 133);
    $("#frontPageMapTools").css({'left':''+left+'px'});
  }
  if ((typeof(jsonSearchGeneral) != "undefined") && (typeof(jsonSearchCompleteList) != "undefined")){
    if(mapObj != null)
      mapObj.ShowSearchResultsOnMap(jsonSearchGeneral, jsonSearchCompleteList, false);
  }
}

/*
 * Function: applyBordersFrontPage
 *  apply borders to grid elements in the page
 *
 * Parameters:
 *  param - object to pass as parameter
*/
function applyBordersFrontPage(param)
{
  tableId = param.tableId;
  if (tableId != ""){
    $("#"+tableId+" tr").each(function(idx,elem){
      rowId = $(elem).attr('id');
      $("#"+rowId+" td").removeClass("frontPageRemoveBorderBottom");
      $("#"+rowId+" td").addClass("frontPageAddBorderBottom");
    });
    $("#"+tableId+" tr:last").each(function(idx,elem){
      rowId = $(elem).attr('id');
      $("#"+rowId+" td").removeClass("frontPageAddBorderBottom");
      $("#"+rowId+" td").addClass("frontPageRemoveBorderBottom");
    });
  }
}

/*
 * Function: loadMorningReportsQuickViewData
 *  load morning reports quickview data
 *
 * Parameters:
 *  location - location to make AJAX call to
 *  viewIdx - index of active option
 *  isDefaultLoad - if the load is the default one (needed no know to stop the sliding in case of user interaction)
*/
function loadMorningReportsQuickViewData(location, viewIdx){
  var morningReportsQuickView = environment.GetPageFlag("morningReportsQuickView");

  //else interation occured with the slide show elements - i.e. property category changed
  if (environment.GetPageFlag("notStopSlideShowExecution_MorningReportsQuickView") != null)
    environment.RemovePageFlag("notStopSlideShowExecution_MorningReportsQuickView");
  //reset the selection of checkboxes in case of property category change and hide selected link
  environment.SetPageFlag("morningReportQuickViewSelectionArray", []);
  $("#morningReportsQuickViewBtn_selectedProperties").hide();

  // activate the correct view button
  var searchGUID = morningReportsQuickView[viewIdx]["searchguid"];
  environment.SetPageFlag("currentSelectedView_morningReportQuickView", morningReportsQuickView[viewIdx]["destinationtab"]);
  for(idx = 0; idx < morningReportsQuickView.length; idx++){
    $('#morningReportsQuickViewBtn_' + morningReportsQuickView[idx]["searchguid"]).removeClass('clientFooterView_active');
    $('#morningReportsQuickViewBtn_' + morningReportsQuickView[idx]["searchguid"]).addClass('clientFooterView_inactive');
  }
  $('#morningReportsQuickViewBtn_' + searchGUID).removeClass('clientFooterView_inactive');
  $('#morningReportsQuickViewBtn_' + searchGUID).addClass('clientFooterView_active');

  environment.SetPageFlag("morningReportQuickViewSearchGUID", searchGUID);

  OpenProgressDlg();
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setParametersString("searchGUID=" + searchGUID);
  if (environment.GetPageFlag("morningReportQuickViewResolution") == null)
  {
    environment.SetPageFlag("morningReportQuickViewResolution", "Comparison : High Resolution : FrontPage");
    $("#morningReportQuickViewResolutionIcons .highComparisonButton").addClass("active");
  }
  ajaxAdapter.setParametersString("resolution=" + environment.GetPageFlag("morningReportQuickViewResolution"), APPEND_PARAM);
  ajaxAdapter.setAJAXReturnFormat("xml");
  ajaxAdapter.call(location, loadMorningReportsQuickViewData_callback);
}

/*
 * Function: loadMorningReportsQuickViewData_callback
 *  load morning reports quickview data callback
 *
 * Parameters:
 *  htmlData - HTML data returned by AJAX call
*/
function loadMorningReportsQuickViewData_callback(xmlData)
{
  if(!checkXML(xmlData))
    return;

  //populate slide show data
  var slideshowData = getXMLNodeValue(xmlData.getElementsByTagName('morningReportQuickViewData')[0].firstChild);
  var controllerData = getXMLNodeValue(xmlData.getElementsByTagName('morningReportQuickViewSlideShowController')[0].firstChild);

  $(".morningReportsQuickViewContainer").html(slideshowData);
  $("#morningReportsQuickViewSlideShowFooterViewsController").html(controllerData);
  //set same height at item records
  frontPageSlideShowElementsSameHeight("morningReportQuickViewContainer");
  //refresh slide show
  slideShowExecution("morningReportQuickViewContainer");
  //if any interaction occured we need to stop the scroll of the slide show - issue 39912
  if (environment.GetPageFlag("notStopSlideShowExecution_MorningReportsQuickView") == null)
    stopSlideShowExecution("morningReportQuickViewContainer");
  CloseProgressDlg();
}

/*
 * Function: changeMorningReportQuickViewResolution
 *  change morning report quickview resolution
 *
 * Parameters:
 *  location - location to make AJAX call to
 *  resolution - new resolution value
*/
function changeMorningReportQuickViewResolution(location, resolution, element)
{
  $("#morningReportQuickViewResolutionIcons :input").each(function(i, el){
    $(el).removeClass("active");
  });
  $(element).addClass("active");
  environment.RemovePageFlag("notStopSlideShowExecution_MorningReportsQuickView");
  environment.SetPageFlag("morningReportQuickViewResolution", resolution);
  OpenProgressDlg();
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setParametersString("resolution=" + resolution);
  ajaxAdapter.setParametersString("searchGUID=" + environment.GetPageFlag("morningReportQuickViewSearchGUID"), APPEND_PARAM);
  var currentViewedSlide = environment.GetPageFlag("currentSlide_morningReportQuickViewContainer");
  if (currentViewedSlide < 0)
    currentViewedSlide = environment.GetPageFlag("numberOfPages_morningReportQuickViewContainer") - 1;
  ajaxAdapter.setParametersString("currentViewedSlide=" + currentViewedSlide, APPEND_PARAM);
  ajaxAdapter.setAJAXReturnFormat("xml");
  if (environment.GetPageFlag("notStopSlideShowExecution_MorningReportsQuickView") == null)
    stopSlideShowExecution("morningReportQuickViewContainer");
  ajaxAdapter.call(location, changeMorningReportQuickViewResolution_callback);
}

/*
 * Function: changeMorningReportQuickViewResolution_callback
 *  change morning report quickview resolution callback
 *
 * Parameters:
 *  htmlData - HTML data returned by AJAX call
*/
function changeMorningReportQuickViewResolution_callback(xmlData)
{
  CloseProgressDlg();
  if(!checkXML(xmlData))
    return;

  loadMorningReportsQuickViewData_callback(xmlData);
  var selectionArray = environment.GetPageFlag("morningReportQuickViewSelectionArray");
  if (selectionArray == null)
    return;
  $.each(selectionArray, function(index, value)
  {
    $("#morningReportQuickViewProperty_" + value).attr('checked', 'checked');
  });
}

/*
 * Function: selectMorningReportQuickViewProperty
 *  select morning report quickview property
 *
 * Parameters:
 *  checkboxElem - checkbox element
*/
function selectMorningReportQuickViewProperty(checkboxElem)
{
  var selectionArray = environment.GetPageFlag("morningReportQuickViewSelectionArray");
  if (selectionArray == null)
    selectionArray = [];
  if ($(checkboxElem).attr('checked') == true)
    selectionArray.push($(checkboxElem).val());
  else
    selectionArray.splice($.inArray($(checkboxElem).val(), selectionArray), 1);
  if (selectionArray.length > 0)
    $("#morningReportsQuickViewBtn_selectedProperties").show();
  else
    $("#morningReportsQuickViewBtn_selectedProperties").hide();
  stopSlideShowExecution("morningReportQuickViewContainer");
  environment.SetPageFlag("morningReportQuickViewSelectionArray", selectionArray);
}

function morningReportsQuickViewSelectRedirect()
{
  clientFrontPageSearchPageRedirect(environment.GetPageFlag("morningReportQuickViewSearchGUID"), environment.GetPageFlag("morningReportQuickViewSelectionArray"));
}

/*
 * Function: loadTheseMightInterestYouData
 *  load these might interest you data
 *
 * Parameters:
 *  location - location to make AJAX call to
 *  viewIdx - index of active option
 *  isDefaultLoad - if the load is the default one (needed no know to stop the sliding in case of user interaction)
*/
function loadTheseMightInterestYouData(location, viewIdx){
  var theseMightInterestYou = environment.GetPageFlag("theseMightInterestYou");

  //else interation occured with the slide show elements - i.e. property category changed
  if (environment.GetPageFlag("notStopSlideShowExecution_TheseMightInterestYou") != null)
    environment.RemovePageFlag("notStopSlideShowExecution_TheseMightInterestYou");
  //reset the selection of checkboxes in case of property category change and hide selected link
  environment.SetPageFlag("theseMightInterestYouSelectionArray", []);
  $("#theseMightInterestYouBtn_selectedProperties").hide();

  // activate the correct view button
  var searchGUID = theseMightInterestYou[viewIdx]["searchguid"];
  for(idx = 0; idx < theseMightInterestYou.length; idx++){
    $('#theseMightInterestYouBtn_' + theseMightInterestYou[idx]["searchguid"]).removeClass('clientFooterView_active');
    $('#theseMightInterestYouBtn_' + theseMightInterestYou[idx]["searchguid"]).addClass('clientFooterView_inactive');
  }
  $('#theseMightInterestYouBtn_' + searchGUID).removeClass('clientFooterView_inactive');
  $('#theseMightInterestYouBtn_' + searchGUID).addClass('clientFooterView_active');

  environment.SetPageFlag("theseMightInterestYouSearchGUID", searchGUID);

  OpenProgressDlg();
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setParametersString("searchGUID=" + searchGUID);
  if (environment.GetPageFlag("theseMightInterestYouResolution") == null)
  {
    environment.SetPageFlag("theseMightInterestYouResolution", "Comparison : Low Resolution : FrontPage");
    $("#theseMightInterestYouResolutionIcons .lowComparisonButton").addClass("active");
  }
  ajaxAdapter.setParametersString("resolution=" + environment.GetPageFlag("theseMightInterestYouResolution"), APPEND_PARAM);
  ajaxAdapter.setAJAXReturnFormat("xml");
  ajaxAdapter.call(location, loadTheseMightInterestYouData_callback);
}

/*
 * Function: loadTheseMightInterestYouData_callback
 *  load these might interest you data callback
 *
 * Parameters:
 *  htmlData - HTML data returned by AJAX call
*/
function loadTheseMightInterestYouData_callback(xmlData)
{
  if(!checkXML(xmlData))
    return;

  //populate slide show data
  var slideshowData = getXMLNodeValue(xmlData.getElementsByTagName('theseMightInterestYouData')[0].firstChild);
  var controllerData = getXMLNodeValue(xmlData.getElementsByTagName('theseMightInterestYouSlideShowController')[0].firstChild);

  $(".theseMightInterestYouContainer").html(slideshowData);
  $("#theseMightInterestYouSlideShowFooterViewsController").html(controllerData);
  //set same height at item records
  frontPageSlideShowElementsSameHeight("theseMightInterestYouContainer");
  //refresh slide show
  slideShowExecution("theseMightInterestYouContainer");
  //if any interaction occured we need to stop the scroll of the slide show - issue 39912
  if (environment.GetPageFlag("notStopSlideShowExecution_TheseMightInterestYou") == null)
    stopSlideShowExecution("theseMightInterestYouContainer");
  CloseProgressDlg();
}

/*
 * Function: changeTheseMightInterestYouResolution
 *  change these might interest you resolution
 *
 * Parameters:
 *  location - location to make AJAX call to
 *  resolution - new resolution value
*/
function changeTheseMightInterestYouResolution(location, resolution, element)
{
  $("#theseMightInterestYouResolutionIcons :input").each(function(i, el){
    $(el).removeClass("active");
  });
  $(element).addClass("active");
  environment.RemovePageFlag("notStopSlideShowExecution_TheseMightInterestYou");
  environment.SetPageFlag("theseMightInterestYouResolution", resolution);
  OpenProgressDlg();
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setParametersString("resolution=" + resolution);
  ajaxAdapter.setParametersString("searchGUID=" + environment.GetPageFlag("theseMightInterestYouSearchGUID"), APPEND_PARAM);
  var currentViewedSlide = environment.GetPageFlag("currentSlide_theseMightInterestYouContainer");
  if (currentViewedSlide < 0)
    currentViewedSlide = environment.GetPageFlag("numberOfPages_theseMightInterestYouContainer") - 1;
  ajaxAdapter.setParametersString("currentViewedSlide=" + currentViewedSlide, APPEND_PARAM);
  ajaxAdapter.setAJAXReturnFormat("xml");
  if (environment.GetPageFlag("notStopSlideShowExecution_TheseMightInterestYou") == null)
    stopSlideShowExecution("theseMightInterestYouContainer");
  ajaxAdapter.call(location, changeTheseMightInterestYouResolution_callback);
}

/*
 * Function: changeTheseMightInterestYouResolution_callback
 *  change these might interest you resolution callback
 *
 * Parameters:
 *  htmlData - HTML data returned by AJAX call
*/
function changeTheseMightInterestYouResolution_callback(xmlData)
{
  CloseProgressDlg();
  if(!checkXML(xmlData))
    return;

  loadTheseMightInterestYouData_callback(xmlData);
  var selectionArray = environment.GetPageFlag("theseMightInterestYouSelectionArray");
  if (selectionArray == null)
    return;
  $.each(selectionArray, function(index, value)
  {
    $("#theseMightInterestYouProperty_" + value).attr('checked', 'checked');
  });
}

/*
 * Function: selectTheseMightInterestYouProperty
 *  select these might interest you property
 *
 * Parameters:
 *  checkboxElem - checkbox element
*/
function selectTheseMightInterestYouProperty(checkboxElem)
{
  var selectionArray = environment.GetPageFlag("theseMightInterestYouSelectionArray");
  if (selectionArray == null)
    selectionArray = [];
  if ($(checkboxElem).attr('checked') == true)
    selectionArray.push($(checkboxElem).val());
  else
    selectionArray.splice($.inArray($(checkboxElem).val(), selectionArray), 1);
  if (selectionArray.length > 0)
    $("#theseMightInterestYouBtn_selectedProperties").show();
  else
    $("#theseMightInterestYouBtn_selectedProperties").hide();
  stopSlideShowExecution("theseMightInterestYouContainer");
  environment.SetPageFlag("theseMightInterestYouSelectionArray", selectionArray);
}

function theseMightInterestYouSelectRedirect()
{
  clientFrontPageSearchPageRedirect(environment.GetPageFlag("theseMightInterestYouSearchGUID"), environment.GetPageFlag("theseMightInterestYouSelectionArray"));
}

function clientFrontPageSearchPageRedirect(searchGUID, selectedListings)
{
  OpenProgressDlg();
  var ajaxAdapterTmp = new AJAXAdapter();
  var listingSelectedIndicator = "";
  var selectedListingLen = selectedListings.length;
  for (index = 0; index < selectedListingLen - 1; index++)
    listingSelectedIndicator += "Y,";
  listingSelectedIndicator += "Y";
  ajaxAdapterTmp.setParametersString("UserSearchGUID=" + searchGUID);
  ajaxAdapterTmp.setParametersString("ListingGUID=" + selectedListings, APPEND_PARAM);
  ajaxAdapterTmp.setParametersString("ListingID_SelectedIndicator=" + listingSelectedIndicator, APPEND_PARAM);

  //async should be false to allow time for post to be completed
  ajaxAdapterTmp.async = false;
  ajaxAdapterTmp.call(BuildURL('saveSelectedListings'));
  CloseProgressDlg();

  var navigationArray = [];
  var selectedListings = {ID:"frontPageSearchGUID", VALUE: searchGUID};
  navigationArray.push(selectedListings);
  navigateNewPage(BuildURL(environment.eventManager.GetObject('search')), navigationArray);
}

/*
 * Function: frontPageSlideShowElementsSameHeight
 *  set same height for front page slide show elements
 *
 * Parameters:
 *  slideShowContainerID - slide show container ID
*/
function frontPageSlideShowElementsSameHeight(slideShowContainerID)
{
  $("[id^='" + slideShowContainerID + "_slideshowPage_']").each(function(divIndex, divElem)
  {
    var maxHeightData = [];
    $("#" + divElem.id + " table").each(function(tableIndex, tableElem)
    {
      $("#" + tableElem.id + " tr").each(function(rowIndex, rowElem)
      {
        maxHeightData[rowIndex] = 0;
      });
    });
    $("#" + divElem.id + " table").each(function(tableIndex, tableElem)
    {

      $("#" + tableElem.id + " tr").each(function(rowIndex, rowElem)
      {
        if (maxHeightData[rowIndex] < $(rowElem).height())
          maxHeightData[rowIndex] = $(rowElem).height();
      });
    });
    $("#" + divElem.id + " table").each(function(tableIndex, tableElem)
    {
      $("#" + tableElem.id + " tr").each(function(rowIndex, rowElem)
      {
        $(rowElem).height(maxHeightData[rowIndex]);
        $(rowElem).children().each(function(childCellIndex, childCell)
        {
          $(childCell).children().each(function(childDivIndex, childDiv)
          {
            $(childDiv).height(maxHeightData[rowIndex]);
          });
        });
      });
    });
  });
}

/*
 * Function: openPropertyDetailsPage
 *  open property details page and stop slide show execution
 *
 * Parameters:
 *  listingGUID - listing GUID
 *  slideShowContainerID - slide show container ID
*/
function openPropertyDetailsPage(oParam)
{
  var propertyDetail = new Object();
  var slideShowContainerID = oParam.slideShowContainerID;
  propertyDetail.listingGUID  = oParam.listingGUID;
  propertyDetail.listingDetailURL  = oParam.listingDetailURL;

  stopSlideShowExecution(slideShowContainerID);
  openPropertyDetailsWindow(propertyDetail);
}

function changeFrontPageActiveVideo(videoId)
{
  $("#frontPageAgentVideoMenu .chartView_active").removeClass("chartView_active").addClass("chartView_inactive");
  $("#chartMenu_" + videoId).removeClass("chartView_inactive").addClass("chartView_active");
}

function navigateClientDashboard_frontPage(dashboardEvent, userGroudGUID, userGroudDescription, dashboardColumn, text)
{
  if (text.toLowerCase() == "new"){
    OpenProgressDlg();
    var ajaxAdapter = new AJAXAdapter();
    ajaxAdapter.setParametersString("userGroupGUID=" + userGroudGUID);
    ajaxAdapter.setParametersString("dashboardColumn=" + dashboardColumn, APPEND_PARAM);
    ajaxAdapter.call(BuildURL('agent.FrontPageModifyLoginActivity'), navigateClientDashboard(dashboardEvent, userGroudGUID, userGroudDescription, dashboardColumn))
  }
  else{
    navigateClientDashboard(dashboardEvent, userGroudGUID, userGroudDescription, dashboardColumn);
  }
}

function redirectMonthlySummaryPage(isPro, location){
  if (isPro == "true"){
    navigateNewPage(location);
  } else {
    showUpgradePopup(true);
  }
}
/*
 * may be used in the future
function showContactAgentDialog_yourPropertyAtAGlance()
{
  showContactAgentDialog($("#listingsUnit_yourPropertyAtAGlance").val());
}

function clientSchedulePromotion_yourPropertyAtAGlance(promotionsObj, creditObj)
{
  clientSchedulePromotion(environment.eventManager.GetObject('schedulePromotions'),promotionsObj, {listingGUID:$("#listingsUnit_yourPropertyAtAGlance").val()}, creditObj);
}
*
*/;
/*
 FusionCharts JavaScript Library
 Copyright FusionCharts Technologies LLP
 License Information at <http://www.fusioncharts.com/license>
 FusionCharts JavaScript Library
 Copyright FusionCharts Technologies LLP
 License Information at <http://www.fusioncharts.com/license>

 @version 3.6.0

 @attributions (infers respective third-party copyrights)
 Raphael 2.1.0 (modified as 'Red Raphael') <http://raphaeljs.com/license.html>
 JSON v2 <http://www.JSON.org/js.html>
 Firebug Lite 1.3.0 <http://getfirebug.com/firebuglite>
*/
(function(){if(!window.FusionCharts||!window.FusionCharts.version){var d=window,h=d.document,D=d.navigator,z={window:d},p=z.modules={},c=z.interpreters={},I=Object.prototype.toString,b=/msie/i.test(D.userAgent)&&!d.opera,P=/loaded|complete/,a=!1,w=function(){var a=z.ready;z.ready=!0;z.raiseEvent&&(z.readyNotified=!0,z.raiseEvent("ready",{version:z.core.version,now:!a},z.core));z.readyNow=!a},F=function(a,c){var b,e;if(c instanceof Array)for(b=0;b<c.length;b+=1)"object"!==typeof c[b]?a[b]=c[b]:("object"!==
typeof a[b]&&(a[b]=c[b]instanceof Array?[]:{}),F(a[b],c[b]));else for(b in c)"object"===typeof c[b]?(e=I.call(c[b]),"[object Object]"===e?("object"!==typeof a[b]&&(a[b]={}),F(a[b],c[b])):"[object Array]"===e?(a[b]instanceof Array||(a[b]=[]),F(a[b],c[b])):a[b]=c[b]):a[b]=c[b];return a};z.extend=function(a,c,b,e){var l;b&&a.prototype&&(a=a.prototype);if(!0===e)F(a,c);else for(l in c)a[l]=c[l];return a};z.uniqueId=function(){return"chartobject-"+(z.uniqueId.lastId+=1)};z.uniqueId.lastId=0;z.policies=
{options:{chartTypeSourcePath:["typeSourcePath",""],product:["product","v3"],insertMode:["insertMode","replace"],safeMode:["safeMode",!0],overlayButton:["overlayButton",void 0],containerBackgroundColor:["containerBackgroundColor","#ffffff"],containerBackgroundOpacity:["containerBackgroundOpacity",1],containerClassName:["containerClassName","fusioncharts-container"],chartType:["type",void 0],baseChartMessageFont:["baseChartMessageFont","Verdana,sans"],baseChartMessageFontSize:["baseChartMessageFontSize",
"10"],baseChartMessageColor:["baseChartMessageColor","#666666"],dataLoadStartMessage:["dataLoadStartMessage","Retrieving data. Please wait."],dataLoadErrorMessage:["dataLoadErrorMessage","Error in loading data."],dataInvalidMessage:["dataInvalidMessage","Invalid data."],dataEmptyMessage:["dataEmptyMessage","No data to display."],typeNotSupportedMessage:["typeNotSupportedMessage","Chart type not supported."],loadMessage:["loadMessage","Loading chart. Please wait."],renderErrorMessage:["renderErrorMessage",
"Unable to render chart."]},attributes:{lang:["lang","EN"],id:["id",void 0]},width:["width","400"],height:["height","300"],src:["swfUrl",""]};c.stat="swfUrl id width height debugMode registerWithJS backgroundColor scaleMode lang detectFlashVersion autoInstallRedirect".split(" ");z.parsePolicies=function(a,c,b){var e,l,m;for(l in c)if(z.policies[l]instanceof Array)m=b[c[l][0]],a[l]=void 0===m?c[l][1]:m;else for(e in"object"!==typeof a[l]&&(a[l]={}),c[l])m=b[c[l][e][0]],a[l][e]=void 0===m?c[l][e][1]:
m};z.parseCommands=function(a,b,g){var e,l;"string"===typeof b&&(b=c[b]||[]);e=0;for(l=b.length;e<l;e++)a[b[e]]=g[e];return a};z.registrars={module:function(){return z.core.apply(z.core,arguments)}};z.core=function(a){if(!(this instanceof z.core)){if(1===arguments.length&&a instanceof Array&&"private"===a[0]){if(p[a[1]])return;p[a[1]]={};a[3]instanceof Array&&(z.core.version[a[1]]=a[3]);return"function"===typeof a[2]?a[2].call(z,p[a[1]]):z}if(1===arguments.length&&"string"===typeof a)return z.core.items[a];
z.raiseError&&z.raiseError(this,"25081840","run","",new SyntaxError('Use the "new" keyword while creating a new FusionCharts object'))}var b={};this.__state={};1===arguments.length&&"object"===typeof arguments[0]?b=arguments[0]:z.parseCommands(b,c.stat,arguments);1<arguments.length&&"object"===typeof arguments[arguments.length-1]&&(delete b[c.stat[arguments.length-1]],z.extend(b,arguments[arguments.length-1]));this.id="undefined"===typeof b.id?this.id=z.uniqueId():b.id;this.args=b;z.core.items[this.id]instanceof
z.core&&z.raiseWarning(this,"06091847","param","",Error('A FusionChart oject with the specified id "'+this.id+'" already exists. Renaming it to '+(this.id=z.uniqueId())));z.parsePolicies(this,z.policies,b);this.attributes.id=this.id;this.resizeTo&&this.resizeTo(b.width,b.height,!0);this.chartType&&this.chartType(b.type||b.swfUrl,!0);z.raiseEvent("beforeInitialize",b,this);z.core.items[this.id]=this;z.core.defaultOptions=z.core.options;z.raiseEvent("initialized",b,this);return this};z.core.prototype=
{};z.core.prototype.constructor=z.core;z.extend(z.core,{id:"FusionCharts",version:["3","6","0"],items:{},options:{},getObjectReference:function(a){return z.core.items[a].ref},register:function(a){return z.registrars[a=a&&a.toString&&a.toString().toLowerCase()]&&z.registrars[a].apply(z.core,Array.prototype.slice.call(arguments,1))}});d.FusionCharts=z.core;d.FusionMaps&&d.FusionMaps.legacy&&(z.core(["private","modules.core.geo",d.FusionMaps.legacy,d.FusionMaps.version]),a=!0);P.test(h.readyState)||
h.loaded?(z.ready=!0,setTimeout(w,1)):function(){function c(){arguments.callee.done||(arguments.callee.done=!0,g&&clearTimeout(g),a||(d.FusionMaps&&d.FusionMaps.legacy&&z.core(["private","modules.core.geo",d.FusionMaps.legacy,d.FusionMaps.version]),d.FusionMaps=z.core),setTimeout(w,1))}function B(){P.test(h.readyState)?c():g=setTimeout(B,10)}var g,e;h.addEventListener?h.addEventListener("DOMContentLoaded",c,!1):h.attachEvent&&d.attachEvent("onLoad",c);if(b)try{"https:"===d.location.protocol?h.write('<script id="__ie_onload_fusioncharts" defer="defer" src="//:">\x3c/script>'):
h.write('<script id="__ie_onload_fusioncharts" defer="defer" src="javascript:void(0)">\x3c/script>'),e=h.getElementById("__ie_onload_fusioncharts"),e.onreadystatechange=function(){"complete"==this.readyState&&c()}}catch(l){}/WebKit/i.test(D.userAgent)&&(g=setTimeout(B,10));d.onload=function(a){return function(){c();a&&a.call&&a.call(d)}}(d.onload)}();d.FusionMaps=z.core}})();
FusionCharts.register("module",["private","modules.mantle.errormanager",function(){var d=this,h=d.window,D={type:"TypeException",range:"ValueRangeException",impl:"NotImplementedException",param:"ParameterException",run:"RuntimeException",comp:"DesignTimeError",undefined:"UnspecifiedException"},z=function(c,p,b,P,a,w){var F="#"+p+" "+(c?c.id:"unknown-source")+P+" "+w+" >> ";a instanceof Error?(a.name=D[b],a.module="FusionCharts"+P,a.level=w,a.message=F+a.message,F=a.message,h.setTimeout(function(){throw a;
},0)):F+=a;p={id:p,nature:D[b],source:"FusionCharts"+P,message:F};d.raiseEvent(w,p,c);if("function"===typeof h["FC_"+w])h["FC_"+w](p)},p;d.raiseError=function(c,d,b,p,a){z(c,d,b,p,a,"Error")};d.raiseWarning=function(c,d,b,p,a){z(c,d,b,p,a,"Warning")};p={outputHelpers:{text:function(c,d){p.outputTo("#"+c.eventId+" ["+(c.sender.id||c.sender).toString()+'] fired "'+c.eventType+'" event. '+("error"===c.eventType||"warning"===c.eventType?d.message:""))},event:function(c,d){this.outputTo(c,d)},verbose:function(c,
d){p.outputTo(c.eventId,c.sender.id,c.eventType,d)}},outputHandler:function(c,h){"function"!==typeof p.outputTo?d.core["debugger"].outputFailed=!0:(d.core["debugger"].outputFailed=!1,p.currentOutputHelper(c,h))},currentOutputHelper:void 0,outputTo:void 0,enabled:!1};p.currentOutputHelper=p.outputHelpers.text;d.extend(d.core,{"debugger":{syncStateWithCharts:!0,outputFormat:function(c){return c&&"function"===typeof c.toLowerCase&&"function"===typeof p.outputHelpers[c=c.toLowerCase()]?(p.currentOutputHelper=
p.outputHelpers[c],!0):!1},outputTo:function(c){"function"===typeof c?p.outputTo=c:null===c&&(d.core["debugger"].enable(!1),delete p.outputTo)},enable:function(c,h,b){var P;"object"===typeof c&&1===arguments.length&&(P=c,c=P.state,h=P.outputTo,b=P.outputFormat);"function"===typeof c&&("string"!==typeof h||2!==arguments.length&&!P||(b=h),h=c,c=!0);if("boolean"===typeof c&&c!==p.enabled)d.core[(p.enabled=c)?"addEventListener":"removeEventListener"]("*",p.outputHandler);"function"===typeof h&&(p.outputTo=
h);d.core["debugger"].outputFormat(b);return p.enabled},enableFirebugLite:function(){var c;h.console&&h.console.firebug?d.core["debugger"].enable(h.console.log,"verbose"):((c=h.document.getElementsByTagName("html"))&&c[0].setAttribute("debug","true"),d.loadScript("https://getfirebug.com/firebug-lite.js#overrideConsole=false,startOpened=true",function(){d.core["debugger"].enable(h.console.log,"verbose")},"{ startOpened: true }",!0,!0))}},debugMode:{enabled:function(){h.setTimeout(function(){throw Error("Deprecated! Please use FusionCharts.debugger.enable instead.");
},0);return d.core["debugger"].enable.apply(d.core["debugger"],arguments)}}},!1)}]);
FusionCharts.register("module",["private","modules.mantle.eventmanager",function(){var d=this,h=d.window,D=d.core,z=h.Object.prototype.toString,p=z.call([]),c=function(a,c,b,g){try{a[0].call(c,b,g||{})}catch(e){setTimeout(function(){throw e;},0)}},I=function(a,b,B){if(a instanceof Array)for(var g=0,e;g<a.length;g+=1){if(a[g][1]===b.sender||void 0===a[g][1])e=a[g][1]===b.sender?b.sender:d.core,c(a[g],e,b,B),!0===b.detached&&(a.splice(g,1),g-=1,b.detached=!1);if(!0===b.cancelled)break}},b={unpropagator:function(){return!1===
(this.cancelled=!0)},detacher:function(){return!1===(this.detached=!0)},undefaulter:function(){return!1===(this.prevented=!0)},listeners:{},lastEventId:0,addListener:function(a,c,B){var g,e;if(z.call(a)===p){g=[];for(e=0;e<a.length;e+=1)g.push(b.addListener(a[e],c,B));return g}if("string"!==typeof a)d.raiseError(B||d.core,"03091549","param","::EventTarget.addListener",Error("Unspecified Event Type"));else if("function"!==typeof c)d.raiseError(B||d.core,"03091550","param","::EventTarget.addListener",
Error("Invalid Event Listener"));else return a=a.toLowerCase(),b.listeners[a]instanceof Array||(b.listeners[a]=[]),b.listeners[a].push([c,B]),c},removeListener:function(a,c,B){var g;if("function"!==typeof c)d.raiseError(B||d.core,"03091560","param","::EventTarget.removeListener",Error("Invalid Event Listener"));else if(a instanceof Array)for(g=0;g<a.length;g+=1)b.removeListener(a[g],c,B);else if("string"!==typeof a)d.raiseError(B||d.core,"03091559","param","::EventTarget.removeListener",Error("Unspecified Event Type"));
else if(a=a.toLowerCase(),a=b.listeners[a],a instanceof Array)for(g=0;g<a.length;g+=1)a[g][0]===c&&a[g][1]===B&&(a.splice(g,1),g-=1)},triggerEvent:function(a,c,B,g,e,l){if("string"!==typeof a)d.raiseError(c,"03091602","param","::EventTarget.dispatchEvent",Error("Invalid Event Type"));else{a=a.toLowerCase();var m={eventType:a,eventId:b.lastEventId+=1,sender:c||Error("Orphan Event"),cancelled:!1,stopPropagation:this.unpropagator,prevented:!1,preventDefault:this.undefaulter,detached:!1,detachHandler:this.detacher};
I(b.listeners[a],m,B);I(b.listeners["*"],m,B);switch(m.prevented){case !0:if("function"===typeof l)try{l.call(g||c||h,m,B||{})}catch(N){setTimeout(function(){throw N;},0)}break;default:if("function"===typeof e)try{e.call(g||c||h,m,B||{})}catch(w){setTimeout(function(){throw w;},0)}}return!0}}},P=d.raiseEvent=function(a,c,B,g,e,l){return b.triggerEvent(a,B,c,g,e,l)},a=d.legacyEventList={},w={};d.disposeEvents=function(a){var c,B;for(c in b.listeners)for(B=0;B<b.listeners[c].length;B+=1)b.listeners[c][B][1]===
a&&b.listeners[c].splice(B,1)};d.raiseEventWithLegacy=function(c,b,B,g,e,l,m){var d=a[c];P(c,b,B,e,l,m);d&&"function"===typeof h[d]&&setTimeout(function(){h[d].apply(e||h,g)},0)};d.raiseEventGroup=function(a,c,b,g,e,l,m){var d=g.id,E=a+d;w[E]?(clearTimeout(w[E]),delete w[E]):d&&E?w[E]=setTimeout(function(){P(c,b,g,e,l,m);delete w[E]},0):P(c,b,g,e,l,m)};d.addEventListener=function(a,c){return b.addListener(a,c)};d.removeEventListener=function(a,c){return b.removeListener(a,c)};d.extend(D,{addEventListener:function(a,
c){return b.addListener(a,c)},removeEventListener:function(a,c){return b.removeListener(a,c)},ready:function(a,c,b){d.ready?(D.ready=function(a,e){"function"===typeof a&&setTimeout(function(){a.call(e||D,c||D)},0)},D.ready(a,b)):"function"===typeof a&&D.addEventListener("ready",function(){D.ready(a,c,b)});return this}});D.on=D.addEventListener;d.extend(D.prototype,{addEventListener:function(a,c){return b.addListener(a,c,this)},removeEventListener:function(a,c){return b.removeListener(a,c,this)}});
D.prototype.on=D.prototype.addEventListener;d.policies.options.events=["events",{}];d.addEventListener("beforeInitialize",function(a){a=a.sender;var c=a.options.events,b;if(c)for(b in c)"function"===typeof c[b]&&a.addEventListener(b,c[b])});d.ready&&!d.readyNotified&&(d.readyNotified=!0,d.raiseEvent("ready",{version:d.core.version,now:d.readyNow},d.core))}]);
FusionCharts.register("module",["private","modules.mantle.ajax",function(){var d=this,h=d.window,D=parseFloat(h.navigator.appVersion.split("MSIE")[1]),z=5.5<=D&&7>=D?!0:!1,p="file:"===h.location.protocol,c=h.ActiveXObject,I=(!c||!p)&&h.XMLHttpRequest,b={objects:0,xhr:0,requests:0,success:0,failure:0,idle:0},P=function(){var a;if(I)return P=function(){b.xhr++;return new I},P();try{a=new c("Msxml2.XMLHTTP"),P=function(){b.xhr++;return new c("Msxml2.XMLHTTP")}}catch(d){try{a=new c("Microsoft.XMLHTTP"),
P=function(){b.xhr++;return new c("Microsoft.XMLHTTP")}}catch(p){a=!1}}return a};d.core.ajax={stats:function(a){return a?b[a]:d.extend({},b)},headers:{"If-Modified-Since":"Sat, 29 Oct 1994 19:43:31 GMT","X-Requested-With":"XMLHttpRequest","X-Requested-By":"FusionCharts",Accept:"text/plain, */*","Content-Type":"application/x-www-form-urlencoded; charset=UTF-8"}};D=d.ajax=function(a,c){this.onSuccess=a;this.onError=c;this.open=!1;b.objects++;b.idle++};d.extend(D.prototype,{headers:d.core.ajax.headers,
transact:function(a,c,F,L){var B=this,g=B.xmlhttp,e=B.headers,l=B.onError,m=B.onSuccess;a="POST"===a;var N,E;if(!g||z)g=P(),B.xmlhttp=g;g.onreadystatechange=function(){try{4===g.readyState&&(!g.status&&p||200<=g.status&&300>g.status||304===g.status||1223===g.status||0===g.status?(m&&m(g.responseText,B,L,c),b.success++):l&&(l(Error("XmlHttprequest Error"),B,L,c),b.failure++),b.idle--,B.open=!1)}catch(a){l&&l(a,B,L,c),h.FC_DEV_ENVIRONMENT&&setTimeout(function(){throw a;},0),b.failure++}};try{g.open(a?
"POST":"GET",c,!0);g.overrideMimeType&&g.overrideMimeType("text/plain");if(a)if("string"===typeof F)N=F;else{N=[];for(E in F)N.push(E+"="+(F[E]+"").replace(/\=/g,"%3D").replace(/\&/g,"%26"));N=N.join("&")}else N=null;for(E in e)g.setRequestHeader(E,e[E]);g.send(N);b.requests++;b.idle++;B.open=!0}catch(n){d.raiseError(d.core,"1110111515A","run","XmlHttprequest Error",n.message)}return g},get:function(a,c){return this.transact("GET",a,void 0,c)},post:function(a,c,b){return this.transact("POST",a,c,
b)},abort:function(){var a=this.xmlhttp;this.open=!1;return a&&"function"===typeof a.abort&&a.readyState&&0!==a.readyState&&a.abort()},dispose:function(){this.open&&this.abort();delete this.onError;delete this.onSuccess;delete this.xmlhttp;delete this.open;b.objects--;return null}})}]);
FusionCharts.register("module",["private","modules.mantle.runtime;1.1",function(){var d=this,h=d.window,D=/(^|[\/\\])(fusioncharts\.js)([\?#].*)?$/ig,z=/[\\\"<>;&]/,p=/^[^\S]*?(sf|f|ht)(tp|tps):\/\//i,c={},I={},b={},P={},a=d.purgeDOM=function(c){var b=c.attributes,g,e;if(b)for(g=b.length-1;0<=g;g-=1)e=b[g].name,"function"===typeof c[e]&&(c[e]=null);if(b=c.childNodes)for(b=b.length,g=0;g<b;g+=1)a(c.childNodes[g])},w=function(a,c,b){var e,l;for(e in a)if(a[e]instanceof Array)c[a[e][0]]=b[e];else for(l in a[e])c[a[e][l][0]]=
b[e][l]},F=/^(FusionCharts|FusionWidgets|FusionMaps)/;d.getScriptBaseUri=function(a){var c=h.document.getElementsByTagName("script"),b=c.length,e,l;for(l=0;l<b;l+=1)if(e=c[l].getAttribute("src"),void 0!==e&&null!==e&&null!==e.match(a))return e.replace(a,"$1")};d.core.options.scriptBaseUri=function(){var a=d.getScriptBaseUri(D);return void 0===a?(d.raiseError(FusionCharts,"1603111624","run",">GenericRuntime~scriptBaseUri","Unable to locate FusionCharts script source location (URL)."),""):a}();d.isXSSSafe=
function(a,c){return c&&null!==p.exec(a)?!1:null===z.exec(a)};d.xssEncode=function(a){return null===a||void 0===a||"function"!==typeof a.toString?"":a=a.toString().replace(/&/g,"&amp;").replace(/\'/g,"&#39;").replace(/\"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")};d.loadScript=function(a,B,g,e,l){if(!a)return!1;var m=B&&B.success||B,N=B&&B.failure,E,n={type:"script",success:!1},V=function(){P[E]=clearTimeout(P[E]);n.success?m&&m(a,E):N&&N(a,E);d.raiseEvent("externalresourceload",n,d.core)};
l=l?"":d.core.options.scriptBaseUri;E=l+a;d.isXSSSafe(E,!1)||(E="function"===typeof h.encodeURIComponent?h.encodeURIComponent(E):h.escape(E));n.path=l;n.src=E;n.file=a;if(!0===b[E]&&e)return n.success=!0,n.notReloaded=!0,"function"===typeof B&&(B(),d.raiseEvent("externalresourceload",n,d.core)),!0;if(c[E]&&e)return!1;c[E]=!0;I[E]&&I[E].parentNode&&I[E].parentNode.removeChild(I[E]);B=I[E]=h.document.createElement("script");B.type="text/javascript";B.src=E;g&&(B["\v"==="v"?"text":"innerHTML"]=g);"function"===
typeof m&&(b[E]=!1,P[E]=clearTimeout(P[E]),B.onload=function(){b[E]=!0;n.success=!0;V()},B.onerror=function(){b[E]=!1;c[E]=!1;V()},B.onreadystatechange=function(){if("complete"===this.readyState||"loaded"===this.readyState)b[E]=!0,n.success=!0,V()});h.document.getElementsByTagName("head")[0].appendChild(B);"function"===typeof N&&(P[E]=setTimeout(function(){b[E]||V()},d.core.options.html5ResourceLoadTimeout||15E3));return!0};d.capitalizeString=function(a,c){return a?a.replace(c?/(^|\s)([a-z])/g:/(^|\s)([a-z])/,
function(a,c,b){return c+b.toUpperCase()}):a};d.extend(d.core,{clone:function(a,c){var b=typeof a,e,l=d.extend({},this.args,!1,!1);w(d.policies,l,this);w(d.renderer.getRendererPolicy(this.options.renderer),l,this);delete l.id;delete l.animate;delete l.stallLoad;e=l.link;l=d.extend({},l,!1,!1);l.link=e;switch(b){case "object":d.extend(l,a);break;case "boolean":c=a}return c?l:new d.core(l)},isActive:function(){if(!this.ref||h.document.getElementById(this.id)!==this.ref)return!1;try{return F.test(this.ref.signature())}catch(a){return!1}},
chartType:function(a,c){var b=this.src,e=!0===c,l=this.options,m;"string"===typeof a&&(c="object"===typeof c?c:{},b=a.replace(/[\?\#][\s\S]*$/g,""),m=null!==b.match(/\.swf\s*?$/ig),b=b.replace(/\.swf\s*?$/ig,""),l.chartType=b.replace(/^[\s\S]*\//ig,"").replace(/^fcmap_/i,""),l.chartTypeSourcePath=-1===b.indexOf("/")?c.chartTypeSourcePath||this.options.chartTypeSourcePath||d.core.options.chartTypeSourcePath||"":b.replace(/[^\/]*?$/ig,""),this.src=((d.core.options.scriptBaseUri||"")+(l.chartTypeSourcePath||
d.core.options.chartTypeSourcePath||"")).replace(/\/\s*$/g,"")+"/"+l.chartType.replace(/\.swf\s*?$/ig,"")+".swf",m&&(d.raiseWarning(this,"08101320181","comp","FusionCharts#chartType",'Chart type has ".swf" in alias and as such has been deprecated. Please use chart type alias.'),l.chartTypeSourcePath=d.core.options.chartTypeSourcePath||""),void 0!==c.dataSource&&null!==c.dataSource?this.setChartData(c.dataSource,c.dataFormat,c.dataConfiguration):this.isActive()&&!e&&this.render());return(l.chartType||
"").toLowerCase()}},!0);h.getChartFromId=function(a){d.raiseWarning(this,"11133001041","comp","GenericRuntime~getObjectFromId()",'Use of deprecated getChartFromId() or getMapFromId(). Replace with "FusionCharts()" or FusionCharts.items[].');return d.core.items[a]instanceof d.core?d.core.items[a].ref:h.swfobject&&h.swfobject.getObjectById(a)};h.getMapFromId=h.getChartFromId}]);
FusionCharts.register("module",["private","api.printmanager",function(){var d=this;d.extend(d.core,{printManager:{configure:function(){d.raiseWarning(d.core,"28141714","impl",".printManager.configure","PrintManager is deprecated")},isReady:function(){d.raiseWarning(d.core,"28141714","impl",".printManager.isReady","PrintManager is deprecated");return!1},enabled:function(){d.raiseWarning(d.core,"28141714","impl",".printManager.enabled","PrintManager is deprecated");return!1},managedPrint:function(){d.raiseWarning(d.core,
"28141714","impl",".printManager.managedPrint","PrintManager is deprecated")}}},!1)}]);
FusionCharts.register("module",["private","modules.interface.renderer",function(){var d=this,h=d.window,D=h.document,z=function(){d.raiseError(this,"25081845","run","::RendererManager",Error("No active renderer"))},p=d.FusionChartsDOMInsertModes={REPLACE:"replace",APPEND:"append",PREPEND:"prepend"},c={undefined:{render:z,remove:z,update:z,resize:z,config:z,policies:{}}},I={},b=function(a){return function(){var c=this.ref;if(void 0===c||null===c||"function"!==typeof c[a])d.raiseError(this,"25081617",
"run","#"+a+"()","ExternalInterface call failed. Check whether chart has been rendered.");else return c[a].apply(c,arguments)}},P=function(a,c){return"function"===typeof a[c]?function(){return a[c].apply(a,arguments)}:a[c]},a=function(a,c){var b=D.getElementById(a),e=c.id||c.getAttribute("id"),l,m;if(null===b)return!1;if(a===e)return!0;e=c.getElementsByTagName("*");l=0;for(m=e.length;l<m;l++)if(e[l]===b)return!1;return!0},w=/[^\%\d]*$/ig,F;d.policies.options.containerElementId=["renderAt",void 0];
d.policies.options.renderer=["renderer",void 0];d.normalizeCSSDimension=function(a,c,b){a=void 0===a?b.offsetWidth||parseFloat(b.style.width):a;c=void 0===c?b.offsetHeight||parseFloat(b.style.height):c;var e={},l=b.style,m;l.width=a=a.toString?a.toString():"0";l.height=c=c.toString?c.toString():"0";if((e.widthIsRelative=a.match(/^\s*\d*\.?\d*\%\s*$/)&&!a.match(/^\s*0\%\s*$/))&&0===b.offsetWidth)for(m=b;m=m.offsetParent;)if(0<m.offsetWidth){a=(m.offsetWidth*parseFloat(a.match(/\d*/)[0])/100).toString();
break}if((e.heightIsRelative=c.match(/^\s*\d*\.?\d*\%\s*$/)&&!c.match(/^\s*0\%\s*$/))&&20>=b.offsetHeight)for(m=b;m=m.offsetParent;)if(0<m.offsetHeight){c=(m.offsetHeight*parseFloat(c.match(/\d*/)[0])/100).toString();break}e.width=a.replace?a.replace(/^\s*(\d*\.?\d*)\s*$/ig,"$1px"):a;e.height=c.replace?c.replace(/^\s*(\d*\.?\d*)\s*$/ig,"$1px"):c;l.width=e.width;l.height=e.height;e.pixelWidth=e.widthIsRelative?b.offsetWidth:parseInt(e.width,10)||0;e.pixelHeight=e.heightIsRelative?b.offsetHeight:parseInt(e.height,
10)||0;return e};F=d.renderer={register:function(a,b){if(!a||"function"!==typeof a.toString)throw Error("#03091436 ~renderer.register() Invalid value for renderer name.");a=a.toString().toLowerCase();if(void 0!==c[a])return d.raiseError(d.core,"03091438","param","::RendererManager>register",'Duplicate renderer name specified in "name"'),!1;c[a]=b;return!0},userSetDefault:!1,setDefault:function(a){if(!a||"function"!==typeof a.toString)return d.raiseError(d.core,"25081731","param","::RendererManager>setDefault",
'Invalid renderer name specified in "name"'),!1;if(void 0===c[a=a.toString().toLowerCase()])return d.raiseError(d.core,"25081733","range","::RendererManager>setDefault","The specified renderer does not exist."),!1;this.userSetDefault=!1;d.policies.options.renderer=["renderer",a];return!0},notifyRender:function(a){var c=d.core.items[a&&a.id];c&&(!1!==a.success||a.silent)||d.raiseError(d.core.items[a.id],"25081850","run","::RendererManager",Error("There was an error rendering the chart. Enable FusionCharts JS debugger for more information."));
if(c.ref=a.ref)a.ref.FusionCharts=d.core.items[a.id];d.raiseEvent("internal.DOMElementCreated",{},c)},protectedMethods:{options:!0,attributes:!0,src:!0,ref:!0,constructor:!0,signature:!0,link:!0,addEventListener:!0,removeEventListener:!0},getRenderer:function(a){return c[a]},getRendererPolicy:function(a){a=c[a].policies;return"object"===typeof a?a:{}},currentRendererName:function(){return d.policies.options.renderer[1]},update:function(a){I[a.id].update.apply(a,Array.prototype.slice.call(arguments,
1))},render:function(a){I[a.id].render.apply(a,Array.prototype.slice.call(arguments,1))},remove:function(a){I[a.id].remove.apply(a,Array.prototype.slice.call(arguments,1))},resize:function(a){I[a.id].resize.apply(a,Array.prototype.slice.call(arguments,1))},config:function(a){I[a.id].config.apply(a,Array.prototype.slice.call(arguments,1))},dispose:function(a){I[a.id].dispose.apply(a,Array.prototype.slice.call(arguments,1))}};d.addEventListener("beforeInitialize",function(a){a=a.sender;var b=a.options.renderer.toLowerCase(),
g;"string"===typeof a.options.renderer&&void 0===c[b]&&(a.options.renderer=d.policies.options.renderer[1]);a.options.renderer=b;I[a.id]=c[a.options.renderer];!0!==I[a.id].initialized&&"function"===typeof I[a.id].init&&(I[a.id].init(),I[a.id].initialized=!0);d.parsePolicies(a,I[a.id].policies||{},a.args);for(g in I[a.id].prototype)a[g]=I[a.id].prototype[g];for(g in I[a.id].events)a.addEventListener(g,I[a.id].events[g])});d.addEventListener(["rendered","dataloaderror","nodatatodisplay","rendercancelled"],
function(a,c){var b=a.sender;b instanceof d.core&&b.__state.rendering&&(d.raiseEvent("internal.rendered",c,b),delete b.__state.rendering)});d.addEventListener("loaded",function(a){var c=a.sender;a=a.sender.ref;var g,e;if(void 0!==a&&null!==a&&"function"===typeof a.getExternalInterfaceMethods){try{g=a.getExternalInterfaceMethods(),g="string"===typeof g?g.split(","):[]}catch(l){g=[],d.raiseError(c,"13111126041","run","RendererManager^Loaded",Error("Error while retrieving data from the chart-object."+
(l.message&&0<=l.message.indexOf("NPObject")?" Possible cross-domain security restriction.":"")))}for(a=0;a<g.length;a+=1)e=g[a],void 0===c[e]&&(c[e]=b(e));if(c.ref)for(e in g=F.protectedMethods,a=F.getRenderer(c.options.renderer).protectedMethods,c)if(a&&!g[e]&&!a[e]&&void 0===c.ref[e])try{c.ref[e]=P(c,e)}catch(m){}}});d.legacyEventList.resized="FC_Resized";d.extend(d.core.prototype,{render:function(c,b,g){var e=this,l,m,N;if((N=h[this.id])&&N.FusionCharts&&N.FusionCharts===this||(N=this.ref)&&N.FusionCharts&&
N.FusionCharts===this)d.renderer.dispose(this),N===h[this.id]&&(h[this.id]=void 0);void 0!==h[this.id]&&d.raiseError(this,"25081843","comp",".render",Error("#25081843:IECompatibility() Chart Id is same as a JavaScript variable name. Variable naming error. Please use unique name forchart JS variable, chart-id and container id."));g?"function"!==typeof g&&(g=void 0):"function"===typeof b?(g=b,b=void 0):b||"function"!==typeof c||(g=c,c=void 0);b=(b||this.options.insertMode).toLowerCase()||p.REPLACE;
void 0===c&&(c=this.options.containerElementId);"string"===typeof c&&(c=D.getElementById(c));if(void 0===c||null===c)return d.raiseError(this,"03091456","run",".render()",Error("Unable to find the container DOM element.")),this;if(a(this.id,c))return d.raiseError(this,"05102109","run",".render()",Error("A duplicate object already exists with the specific Id: "+this.id)),this;l=D.createElement(this.options.containerElementType||"span");l.setAttribute("id",this.id);if("append"!==b&&"prepend"!==b)for(;c.hasChildNodes();)c.removeChild(c.firstChild);
"prepend"===b&&c.firstChild?c.insertBefore(l,c.firstChild):c.appendChild(l);this.options.containerElement=c;this.options.containerElementId=c.id;if(b=l.style)b.position="relative",b.textAlign="left",b.lineHeight="normal",b.display="inline-block",b.zoom="1",b.fontWeight="normal",b.fontVariant="normal",b.fontStyle="normal",b.textDecoration="none",b["*DISPLAY"]="inline",b.padding="0",b.margin="0",b.border="none";this.options.containerClassName&&(l.className=this.options.containerClassName);b=d.normalizeCSSDimension(this.width,
this.height,l);this.__state.renderedWidth=b.pixelWidth;this.__state.renderedHeight=b.pixelHeight;this.__state.rendering=!0;d.raiseEvent("beforeRender",m={container:c,width:this.width,height:this.height,renderer:this.options.renderer},this,void 0,function(a,c){d.renderer.render(e,l,function(){d.renderer.notifyRender.apply(this,arguments);if(g)try{g.call(a.sender,c.container)}catch(b){setTimeout(function(){throw b;})}})},function(){d.raiseEvent("renderCancelled",m,e)});return this},remove:function(){d.renderer.remove(this);
return this},resizeTo:function(a,c,b){var e=this,l=e.width,m=e.height,N=e.__state;"object"===typeof a&&(b=c,c=a.h,a=a.w);a=null===a||void 0===a?l:a.toString().replace(w,"");c=null===c||void 0===c?m:c.toString().replace(w,"");!0!==b?d.raiseEvent("beforeresize",{currentWidth:l,currentHeight:m,newWidth:a,newHeight:c},e,void 0,function(){e.width=a;e.height=c;d.renderer.resize(e,{width:a,height:c});d.raiseEventWithLegacy("resized",{width:e.width,height:e.height,prevWidth:l,prevHeight:m,pixelWidth:e.ref&&
e.ref.offsetWidth||0,pixelHeight:e.ref&&e.ref.offsetHeight||0,originalWidth:N.renderedWidth,originalHeight:N.renderedHeight},e,[e.id,e.width,e.height])},function(){d.raiseEvent("resizecancelled",{currentWidth:l,currentHeight:m,cancelledTargetWidth:a,cancelledTargetHeight:c},e)}):(e.width=a,e.height=c);return this},dispose:function(){var a=this,c={};d.raiseEvent("beforeDispose",c,a,void 0,function(){d.renderer.dispose(a);d.raiseEvent("disposed",c,a);d.disposeEvents(a);delete d.core.items[a.id];for(var b in a)a.hasOwnProperty(b)&&
delete a[b];a.disposed=!0},function(){d.raiseEvent("disposeCancelled",c,a)})},configure:function(a,c){var b;a&&("string"===typeof a?(b={},b[a]=c):b=a,d.renderer.config(this,b))}});d.extend(d.core,{setCurrentRenderer:function(){var a=F.setDefault.apply(F,arguments);F.userSetDefault=!0;return a},getCurrentRenderer:function(){return F.currentRendererName.apply(F,arguments)},render:function(a,c){return a instanceof d.core?(a.render(c),a):(new d.core(a)).render(c)}},!1)}]);
FusionCharts.register("module",["private","modules.interface.transcoder",function(){var d=this,h=d.window,D=d.transcoders={},z={},p={},c=/url$/i,I=d._interactiveCharts={selectscatter:[!0,!1],dragcolumn2d:[!0,!0],dragarea:[!0,!0],dragline:[!0,!0],dragnode:[!0,!0]},b=function(c,b,m,g){var E=m.obj;m=m.args;m.dataSource=c;m.xmlHttpRequestObject=b;m.source="XmlHttpRequest";m.url=g;d.raiseEvent("dataLoadRequestCompleted",m,E,void 0,a,w)},P=function(a,c,b){var g=b.obj;b=b.args;b.error=a;b.httpStatus=c.xhr&&
c.xhr.status?c.xhr.status:-1;b.xmlHttpRequestObject=c;d.raiseEvent("dataLoadError",b,g);"function"===typeof h.FC_DataLoadError&&h.FC_DataLoadError(g.id,b)},a=function(a,c){a.sender.setChartData(c.dataSource,c.dataFormat,c.config,c.successcallback,c.silent)},w=function(a,c){d.raiseEvent("dataLoadCancelled",c,a.sender);c.xmlHttpRequestObject.abort()},F=function(a,c){var m=a.sender,g=m.__state,E=c.url;m.options.dataSource=c.url;g.dhmXhrObj||(g.dhmXhrObj=new d.ajax(b,P));g.dhmXhrObj.get("function"===
typeof h.decodeURIComponent?h.decodeURIComponent(E):h.unescape(E),{obj:m,args:c})},L=function(a,c){var b=a.sender,g=b.__state;d.raiseEvent("dataLoadRequestCancelled",c,b);g&&g.dhmXhrObj&&g.dhmXhrObj.abort()},B=function(a,c){var b=a.sender,g=b.__state,E=b.id;z[E]=c;p[E]&&delete p[E];p[E]={};g.dataReady=void 0;g.dataAvailable=!0;!0!==c.silent&&(!0!==b.options.safeMode||!0!==g.rendering||b.isActive()?(delete g.args,d.renderer.update(b,c)):(g.updatePending=c,d.raiseWarning(b,"23091255","run","::DataHandler~update",
"Renderer update was postponed due to async loading.")));d.raiseEvent("dataUpdated",c,b,void 0,c.successcallback)},g=function(a,c){d.raiseEvent("dataUpdateCancelled",c,a.sender,void 0,c.failurecallback)};d.dataFormats={};d.policies.options.dataSource=["dataSource",void 0];d.policies.options.dataFormat=["dataFormat",void 0];d.policies.options.dataConfiguration=["dataConfiguration",void 0];d.policies.options.showDataLoadingMessage=["showDataLoadingMessage",!1];d.addDataHandler=function(a,c){if("string"!==
typeof a||void 0!==D[a.toLowerCase()])d.raiseError(d.core,"03091606","param","::DataManager.addDataHandler",Error("Invalid Data Handler Name"));else{var b={},g=a.toLowerCase();D[g]=c;c.name=a;b["set"+a+"Data"]=function(c,b,l){return this.setChartData(c,a,b,l)};c.transportable&&(b["set"+a+"Url"]=function(c,b,l){return this.setChartDataUrl(c,a,b,l)},d.dataFormats[a+"URL"]=g+"Url");b["get"+a+"Data"]=function(){return this.getChartData(a)};d.dataFormats[a]=g;d.extend(d.core,b,!0)}};d.extend(d.core.prototype,
{setChartDataUrl:function(a,b,m,g,w){if(void 0===b||null===b||"function"!==typeof b.toString)b=this.options.dataFormat,d.raiseWarning(this,"03091609","param","FusionCharts#setChartDataUrl","Invalid Data Format. Reverting to current data format - "+b);b=b.toString().toLowerCase();b=c.test(b)?b.slice(0,-3):b;d.raiseEvent("dataLoadRequested",{source:"XmlHttpRequest",url:a,dataFormat:b,silent:!!w,config:m,successcallback:g},this,void 0,F,L)},setChartData:function(a,b,m,w,E){var n=this.options,V,t;if(void 0===
b||null===b||"function"!==typeof b.toString)b=n.dataFormat,d.raiseWarning(this,"03091610","param","FusionCharts#setChartData","Invalid Data Format. Reverting to current data format - "+b);b=b.toString().toLowerCase();c.test(b)?this.setChartDataUrl(a,b,m,w,E):(n.dataSource=a,V=b,n.dataFormat=b,t=D[V],"undefined"===typeof t?d.raiseError(d.core,"03091611","param","FusionCharts#setChartData",Error("Data Format not recognized")):(b=(b=d.renderer&&d.renderer.getRenderer(n.renderer||d.renderer.currentRendererName()))&&
b.dataFormat,m=b===V?t.passthrough?t.passthrough(a,m):{data:a}:t.encode(a,this,m||n.dataConfiguration)||{},m["native"]=b===V,m.format=m["native"]?b:"xml",m.dataFormat=V,m.dataSource=a,m.silent=!!E,"function"===typeof w&&(m.successcallback=w),d.raiseEvent("beforeDataUpdate",m,this,void 0,B,g)))},getChartData:function(a,c){var b=this.options,g=this.id,w;if(void 0===a||"function"!==typeof a.toString||void 0===(w=D[a=a.toString().toLowerCase()]))d.raiseError(this,"25081543","param","::transcoder~getChartData()",
Error('Unrecognized data-format specified in "format"'));else return p[g][a]?b=p[g][a]:z[g]?(a===z[g].format?p[g][a]=z[g]:(p[g].xml||(p[g].xml="xml"===z[g].format?z[g]:D[z[g].format].encode(z[g].data,this,b.dataConfiguration)),p[g][a]||(p[g][a]=w.decode(p[g].xml.data,this,b.dataConfiguration))),b=p[g][a]):b={error:Error("Data not defined")},!0===Boolean(c)?b:b.data},dataReady:function(a){return a?this.__state.dataAvailable:this.__state.dataReady}});d.extend(d.core,{transcodeData:function(a,c,b,g,
w){if(c&&"function"===typeof c.toString&&b&&"function"===typeof b.toString&&void 0!==D[b=b.toString().toLowerCase()]&&void 0!==D[c=c.toString().toLowerCase()])return a=D[c].encode(a,this,w),b=D[b].decode(a.data,this,w),b.error instanceof Error||(b.error=a.error),g?b:b.data;d.raiseError(this,"14090217","param",".transcodeData()",Error("Unrecognized data-format specified during transcoding."))}},!1);d.getRenderer&&!d.getRenderer("flash")||d.addEventListener("DataLoadRequested",function(a){var c=a.sender;
c.options&&"flash"===c.options.renderer&&c.options.useLegacyXMLTransport&&a.preventDefault()});d.addEventListener("beforeInitialize",function(a){a=a.sender;var b=a.options,g=b.dataSource,w=d.renderer&&d.renderer.getRenderer(b.renderer);delete z[a.id];p[a.id]={};if(void 0!==g&&null!==g){a.__state.dataSetDuringConstruction=!0;if("string"!==typeof b.dataFormat)switch(typeof g){case "function":g=b.dataSource=g.call(a,b.dataConfiguration);b.dataFormat="JSON";break;case "string":b.dataFormat=/^\s*?\{[\s\S]*\}\s*?$/g.test(a.options.dataFormat)?
"JSON":"XML";break;case "object":b.dataFormat="JSON"}b.dataFormat&&b.dataFormat.toString&&(a.__state.dataFetchDuringConstruction=c.test(b.dataFormat.toString()));a.setChartData(g,b.dataFormat,void 0,void 0,!0)}else w&&(a.__state.dataSetDuringConstruction=!1,d.raiseWarning(a,"1810131922A","param",":dataHandler~event:beforeInitialize","Data source was not defined during construction, hence set to blank renderer default - "+w.dataFormat),a.setChartData("",w.dataFormat,void 0,void 0,!0),a.__state.dataAvailable=
!1)});d.addEventListener("beforeDispose",function(a){var c=a.sender;delete z[a.sender.id];delete p[a.sender.id];c&&c.__state&&c.__state.dhmXhrObj&&c.__state.dhmXhrObj.abort()});d.addEventListener("disposed",function(a){delete p[a.sender.id]});d.addEventListener("loaded",function(a){a=a.sender;var c=a.__state.updatePending;a instanceof d.core&&void 0!==c&&(delete a.__state.updatePending,d.renderer.update(a,c))});d.addEventListener("dataUpdated",function(a,c){var b=a.sender,g=b.__state;g.rendering&&
(g.dataFetchDuringConstruction||g.updatePending)&&(delete g.dataFetchDuringConstruction,delete g.updatePending,d.renderer.update(b,c))});d.addEventListener(["dataLoadError","dataInvalid"],function(a){a.sender.__state.dataAvailable=!1});d.addEventListener("loaded",function(a){a=a.sender;var c=a.__state,b,g,w;w=function(a,c){return function(b){return!1===b?c.apply(this):this.ref.getUpdatedXMLData?d.core.transcodeData(this.ref.getUpdatedXMLData(),"xml",a):this.getData?this.getData(a):c.apply(this)}};
if(a.chartType&&I[a.chartType()]&&I[a.chartType()][0]){for(b in d.transcoders)g=d.transcoders[b].name,g="get"+g+"Data",a[g]=w(b,a.constructor.prototype[g]),a[g]._dynamicdatarouter=!0;c.dynamicDataRoutingEnabled=!0}else if(c.dynamicDataRoutingEnabled){for(b in d.transcoders)g=d.transcoders[b].name,g="get"+g+"Data",a.hasOwnProperty(g)&&a[g]._dynamicdatarouter&&delete a[g];c.dynamicDataRoutingEnabled=!1}})}]);"object"!==typeof JSON&&(JSON={});
(function(){function d(a){return 10>a?"0"+a:a}function h(a){p.lastIndex=0;return p.test(a)?'"'+a.replace(p,function(a){var c=b[a];return"string"===typeof c?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function D(a,b){var d,p,B,g,e=c,l,m=b[a];m&&"object"===typeof m&&"function"===typeof m.toJSON&&(m=m.toJSON(a));"function"===typeof P&&(m=P.call(b,a,m));switch(typeof m){case "string":return h(m);case "number":return isFinite(m)?String(m):"null";case "boolean":case "null":return String(m);
case "object":if(!m)return"null";c+=I;l=[];if("[object Array]"===Object.prototype.toString.apply(m)){g=m.length;for(d=0;d<g;d+=1)l[d]=D(d,m)||"null";B=0===l.length?"[]":c?"[\n"+c+l.join(",\n"+c)+"\n"+e+"]":"["+l.join(",")+"]";c=e;return B}if(P&&"object"===typeof P)for(g=P.length,d=0;d<g;d+=1)"string"===typeof P[d]&&(p=P[d],(B=D(p,m))&&l.push(h(p)+(c?": ":":")+B));else for(p in m)Object.prototype.hasOwnProperty.call(m,p)&&(B=D(p,m))&&l.push(h(p)+(c?": ":":")+B);B=0===l.length?"{}":c?"{\n"+c+l.join(",\n"+
c)+"\n"+e+"}":"{"+l.join(",")+"}";c=e;return B}}"function"!==typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+d(this.getUTCMonth()+1)+"-"+d(this.getUTCDate())+"T"+d(this.getUTCHours())+":"+d(this.getUTCMinutes())+":"+d(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var z=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
p=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,c,I,b={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},P;"function"!==typeof JSON.stringify&&(JSON.stringify=function(a,b,d){var p;I=c="";if("number"===typeof d)for(p=0;p<d;p+=1)I+=" ";else"string"===typeof d&&(I=d);if((P=b)&&"function"!==typeof b&&("object"!==typeof b||"number"!==typeof b.length))throw Error("JSON.stringify");return D("",{"":a})});
"function"!==typeof JSON.parse&&(JSON.parse=function(a,c){function b(a,g){var e,d,m=a[g];if(m&&"object"===typeof m)for(e in m)Object.prototype.hasOwnProperty.call(m,e)&&(d=b(m,e),void 0!==d?m[e]=d:delete m[e]);return c.call(a,g,m)}var d;a=String(a);z.lastIndex=0;z.test(a)&&(a=a.replace(z,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return d=eval("("+a+")"),"function"===typeof c?b({"":d},""):d;throw new SyntaxError("JSON.parse");})})();
FusionCharts.register("module",["private","modules.data.json",function(){var d=this,h=d.window,D=h.document,z=d.xssEncode,p,c;void 0===h.JSON&&d.raiseError(this,"1113062012","run","JSONDataHandler",Error("Could not find library support for JSON parsing."));d.policies.options.allowIESafeXMLParsing=["_allowIESafeXMLParsing",!0];p=function(){var c={set:!0,trendlines:!0,vtrendlines:!0,line:{trendlines:!0,vtrendlines:!0},data:!0,dataset:!0,lineset:!0,categories:!0,category:!0,linkeddata:!0,application:!0,
definition:!0,axis:!0,connectors:!0,connector:{connectors:!0},trendset:!0,row:{rows:!0},column:{columns:!0},label:{labels:!0},color:{colorrange:!0},dial:{dials:!0},pointer:{pointers:!0},point:{trendpoints:!0},process:{processes:!0},task:{tasks:!0},milestone:{milestones:!0},datacolumn:{datatable:!0},text:{datacolumn:!0},item:{legend:!0},alert:{alerts:!0},groups:{annotations:!0},items:{groups:!0,data:!0},shapes:!0,shape:{shapes:!0},entitydef:!0,entity:{entitydef:!0}},b={chart:"linkedchart",map:"linkedmap",
set:"data",vline:{chart:"data",graph:"data",dataset:"data",categories:"category",linkedchart:"data"},apply:{application:"application"},style:{definition:"definition"},marker:{application:"application",definition:"definition",data:"items"},entity:{entitydef:"entitydef",data:"data"},shape:{shapes:"shapes"},connector:{connectors:{chart:"connector",linkedchart:"connector",map:"connectors",linkedmap:"connectors"}},annotationgroup:{annotations:"groups"},annotation:{groups:"items"}},p={vline:{vline:"true"}},
a={chart:!0,map:!0,graph:!0},w={dataset:"data",categories:"category"},F={target:"target",value:"value"},L={styles:{definition:!0,application:!0},chart:{value:!0,target:!0},graph:{value:!0,target:!0},linkedchart:{value:!0,target:!0},markers:{definition:!0,application:!0,shapes:!0,connectors:!0,data:!0},map:{entitydef:!0,data:!0},linkedmap:{entitydef:!0,data:!0}},B,g;B={append:function(a,b,g,d){!c[g]||!0!==c[g]&&!0!==c[g][d]?b[g]=a:(b[g]instanceof Array||(b[g]=[]),b[g].push(a))},child:function(c,g,
m,N){var E,n,V,t,h,u;for(E=0;E<g.length;E+=1)switch(V=g[E],n=V.nodeName.toLowerCase(),V.nodeType){case 1:t=B.attr(V.attributes);u=a[n];!0===u&&(h=t,t={},t[n]=h);u=p[n];"object"===typeof u&&d.extend(t,u);if(u=b[n])if("object"===typeof u&&"object"===typeof u[m])for(h in h=void 0,u[m]){if(N[h]){n=u[m][h];break}}else"object"===typeof u&&"string"===typeof u[m]?n=u[m]:"string"===typeof u&&(n=u);V.childNodes.length&&((u=L[m])&&u[n]?B.child(c,V.childNodes,n,N):B.child(t,V.childNodes,n,N));(u=L[m])&&u[n]||
B.append(t,c,n,m);break;case 3:if(u=F[m])n=u,t=V.data,B.append(t,c,n,m);u=w[m];"string"===typeof u&&N.chart&&parseInt(N.chart.compactdatamode,10)&&(n=u,t=V.data,c[n]=c[n]?c[n]+t:t)}},attr:function(a){var c,b={};if(!a||!a.length)return b;for(c=0;c<a.length;c+=1)b[a[c].nodeName.toLowerCase()]=a[c].value||a[c].nodeValue;return b}};g=function(a){var c={},b,w,p,n,V,t,F,u,P;if("object"!==typeof a&&a&&"function"!==typeof a.toString)return g.errorObject=new TypeError("xml2json.parse()"),c;a=a.toString().replace(/<\!--[\s\S]*?--\x3e/g,
"").replace(/<\?xml[\s\S]*?\?>/ig,"").replace(/&(?!([^;\n\r]+?;))/g,"&amp;$1");a=a.replace(/^\s\s*/,"");for(var L=/\s/,z=a.length;L.test(a.charAt(z-=1)););a=a.slice(0,z+1);if(!a)return c;try{h.DOMParser?b=(new h.DOMParser).parseFromString(a,"text/xml"):D.body&&d.core.options.allowIESafeXMLParsing?(w=D.createElement("xml"),w.innerHTML=a,D.body.appendChild(w),b=w.XMLDocument,D.body.removeChild(w)):(b=new h.ActiveXObject("Microsoft.XMLDOM"),b.async="false",b.loadXML(a));if(!(b&&b.childNodes&&1===b.childNodes.length&&
(p=b.childNodes[0])&&p.nodeName&&(n=p.nodeName.toLowerCase()))||"chart"!==n&&"map"!==n&&"graph"!==n)return g.errorObject=new TypeError("xml2json.parse()"),c;if("graph"===n){V=b.createElement("chart");for(P=(F=p.attributes)&&F.length||0;P--;)V.setAttribute(F[P].name,F[P].value),F.removeNamedItem(F[P].name);if(P=(u=p.childNodes)&&u.length||0)P-=1,t=p.removeChild(u[P]),V.appendChild(t);for(;P--;)t=p.removeChild(u[P]),V.insertBefore(t,V.firstChild);b.replaceChild(V,p);p=V}}catch(I){g.errorObject=I}p?
(p.attributes&&(c[n]=B.attr(p.attributes)),p.childNodes&&B.child(c,p.childNodes,n,c),delete g.errorObject):g.errorObject=new TypeError("xml2json.parse()");return c};return function(a){delete g.errorObject;return{data:g(a),error:g.errorObject}}}();c=function(){var c,b;c={items:{explode:{data:"set",groups:{annotations:"annotationgroup"},items:{groups:"annotation"}},text:{chart:{target:"target",value:"value"},graph:{target:"target",value:"value"}},dsv:{dataset:{data:"dataset"},categories:{category:"categories"}},
attr:{chart:{chart:"chart"},graph:{graph:"graph"},map:{map:"map"},linkedmap:{map:"map"},linkedchart:{chart:"chart"}},group:{styles:{definition:"style",application:"apply"},map:{data:"entity",entitydef:"entity"},markers:{definition:"marker",application:"marker",shapes:"shape",connectors:"connector",items:"marker"}},tag:{markers:{items:"data"}}},qualify:function(c,a,b){return"object"===typeof this.items[c][b]?this.items[c][b][a]:this.items[c][b]}};b=function(d,a,p,h){var L="",B="",g="",e="",l,m,N;a&&
"function"===typeof a.toLowerCase&&(a=a.toLowerCase());if(void 0===p&&d[a])for(l in d[a])m=l.toLowerCase(),"compactdatamode"===m&&(h.applyDSV=1==d[a][l]);if(d instanceof Array)for(l=0;l<d.length;l+=1)g="string"===typeof d[l]?g+z(d[l]):g+b(d[l],a,p,h);else{for(l in d)m=l.toLowerCase(),d[l]instanceof Array&&(N=c.qualify("group",m,a))?(g=c.qualify("tag",m,a)||m,B+="<"+g+">"+b(d[l],N,a,h)+"</"+g+">"):"object"===typeof d[l]?(N=c.qualify("attr",m,a))?(e=b(d[l],N,a,h).replace(/\s*\/\>/ig,""),a=m):B+=b(d[l],
m,a,h):h.applyDSV&&(N=c.qualify("dsv",m,a))?B+=d[l]:(N=c.qualify("text",m,a))?(g=c.qualify("tag",m,a)||N,B+="<"+g+">"+d[l]+"</"+g+">"):"vline"===m&&Boolean(d[l])?a="vline":L+=" "+m+'="'+z(d[l]).toString().replace(/\"/ig,"&quot;")+'"';if(N=c.qualify("explode",p,a))a=N;g=a;g=(""!==e?e:"<"+g)+L+(""!==B?">"+B+"</"+g+">":" />")}return g};return function(c){delete b.errorObject;if(c&&"string"===typeof c)try{c=JSON.parse(c)}catch(a){b.errorObject=a}return{data:b(c,c&&c.graph?"graph":c&&c.map?"map":"chart",
void 0,{}),error:b.errorObject}}}();d.addDataHandler("JSON",{encode:c,decode:p,passthrough:function(c){var b={data:{}};if(!c)return b;if("string"!==typeof c)try{c=JSON.stringify(c)}catch(d){return b.error=d,b}try{b.data=JSON.parse(c.replace(/"([^"]+)":/g,function(a,c){return'"'+c.toLowerCase()+'":'}))}catch(a){b.error=a}return b},transportable:!0})}]);
FusionCharts.register("module",["private","modules.data.xml",function(){var d=function(d){return{data:d,error:void 0}};this.addDataHandler("XML",{encode:d,decode:d,transportable:!0})}]);
FusionCharts.register("module",["private","modules.data.csv",function(){var d=this,h=d.window,D=d.core,z=h.parseInt,p=h.parseFloat,c=function(c){return c},I;I=function(c){this.data=[];this.columnCount=this.rowCount=0;this.configure(c)};I.decodeLiterals=function(c,d){return void 0!==c&&null!==c&&c.toString?c.replace("{tab}","\t").replace("{quot}",'"').replace("{apos}","'"):d};I.prototype.set=function(c,d,a){var p;if(this.rowCount<=c){for(p=this.rowCount;p<=c;p+=1)this.data[p]=[];this.rowCount=c+1}this.columnCount<=
d&&(this.columnCount=d+1);this.data[c][d]=a};I.prototype.setRow=function(c,d){var a;if(this.rowCount<=c){for(a=this.rowCount;a<=c;a+=1)this.data[a]=[];this.rowCount=c+1}this.columnCount<d.length&&(this.columnCount=d.length);this.data[c]=d};I.prototype.get=function(c,d){var a=this.data;return a[c]&&a[c][d]};I.prototype.configure=function(c){var d=I.decodeLiterals;this.delimiter=d(c.delimiter,",");this.qualifier=d(c.qualifier,'"');this.eolCharacter=d(c.eolCharacter,"\r\n");this.numberFormatted=!!z(c.numberFormatted,
0)};I.prototype.clear=function(){this.data=[];this.columnCount=this.rowCount=0};I.prototype.toString=function(){var c,d,a="";for(c=0;c<this.rowCount;c+=1)d=this.qualifier+this.data[c].join(this.qualifier+this.delimiter+this.qualifier)+this.qualifier,a+='""'===d?this.eolCharacter:d+this.eolCharacter;0<this.rowCount&&(a=a.slice(0,a.length-2));return a};d.addDataHandler("CSV",{encode:function(c,p){d.raiseError(p,"0604111215","run","::CSVDataHandler.encode()","FusionCharts CSV data-handler only supports encoding of data.");
throw Error("FeatureNotSupportedException()");},decode:function(b,d){var a=D.transcodeData(b,"xml","json")||{},w=d.jsVars,h,L,B,g,e,l,m,N=a.chart||a.map||a.graph||{};m=Boolean(N.exporterrorcolumns||0);var E=a.categories&&a.categories[0]&&a.categories[0].category||[],n=a.map&&!a.chart||w&&w.instanceAPI&&"geo"===w.instanceAPI.defaultSeriesType,V=!1,t=!1,X=!1,u=!1;L=!1;var z=c,U={},ka,xa,ea,Y,ua,ba,da,oa,H,M,T;e=0;h=new I({separator:N.exportdataseparator,qualifier:N.exportdataqualifier,numberFormatted:N.exportdataformattedval});
D.formatNumber&&h.numberFormatted&&(z=function(a){return D.formatNumber(a,N)});if(n)for(M in U.geo=!0,E=w.hcObj&&w.hcObj.entities&&w.hcObj.entities.items||[],h.setRow(0,["Id"," Short Name","Long Name","Value","Formatted Value"]),w=0,E)t=E[M],T=t.eJSON,L=t.value,h.setRow(++w,[M,T.shortLabel,T.label,void 0===L?"":L,t.formattedValue]);else if(void 0!==(ka=a.dials&&a.dials.dial||a.pointers&&a.pointers.pointer||a.value))if(U.gauge=!0,"string"===typeof ka)h.set(0,0,z(ka)),U.singlevalue=!0,"string"===typeof a.target&&
(h.set(0,1,z(a.target)),U.bullet=!0);else for(h.setRow(0,["Id","Value"]),U.multivalue=!0,w=0,l=1,e=ka.length;w<e;w+=1,l+=1)h.setRow(l,[l,z(ka[w].value)]);else if(ka=a.dataset||!(a.data instanceof Array)&&[]){U.multiseries=!0;B=1;if(xa=a.lineset)ka=ka.concat(xa),U.lineset=!0;if(ea=a.axis)ka=ka.concat(ea),U.multiaxis=!0;ba=ka.length;ua=E.length;if(!(ba=ka.length)){for(w=0;w<ua;w+=1)da=E[w],h.set(w+1,0,da.label||da.name);U.multilevel=!0}for(w=0;w<ba;w+=1)for(oa=ka,oa[w].dataset?(oa=oa[w].dataset,g=0,
Y=oa.length):(oa=ka,g=w,Y=g+1);g<Y&&!V&&!X;g+=1,B+=1){n=oa[g];h.set(0,B,n.seriesname);"string"===typeof n.data&&(U.compactdata=!0,n.data=n.data.split(N.dataseparator||"|"));l=e=0;for(H=n.data&&n.data.length||0;e<H||e<ua;e+=1){da=E[e];L=l+1;M=n.data&&n.data[l]||{};if(void 0!==M.x&&void 0!==M.y){V=U.xy=!0;break}if(void 0!==M.open||void 0!==M.high||void 0!==M.close||void 0!==M.low){u=U.ohlc=!0;break}if(void 0!==M.rowid&&void 0!==M.columnid){X=U.heatmap=!0;break}if(e<ua&&!da.vline){h.set(L,0,da.label||
da.name);da=p(M?M.value:"");da=isNaN(da)?"":z(da);h.set(L,B,da);if(t||m||M.errorvalue)t||h.set(0,B+1,"Error"),T=1,h.set(L,B+1,z(M.errorvalue));l+=1}}T&&(B+=T,T=0)}xa&&(ka=ka.slice(0,-xa.length));ea&&(ka=ka.slice(0,-ea.length))}else if(ka=a.data){h.set(0,1,N.yaxisname||"Value");U.singleseries=!0;L="1"==N.showsumatend;w=0;for(ua=ka.length;w<ua;w+=1)M=ka[w],M.vline||(da=p(M.value?M.value:""),h.setRow(w+1,[M.label||M.name,isNaN(da)?"":(e+=da,z(da))]));L&&(U.summation=!0,h.setRow(w+1,[N.sumlabel||"Total",
z(e)]))}if(u)for(h.clear(),h.setRow(0,["Open","Close","High","Low"]),w=0,L=1,ka=a.dataset,Y=ka.length;w<Y;w+=1)for(e=0,n=ka[w]&&ka[w].data||[],ba=n.length;e<ba;e+=1,L+=1)M=n[e]||{},h.setRow(e+1,[z(M.open),z(M.close),z(M.high),z(M.low)]);else if(V)for(h.clear(),t=!1,T=0,h.setRow(0,["Series","x","y"]),w=0,L=1,ka=a.dataset,Y=ka.length;w<Y;w+=1)for(e=0,n=ka[w]&&ka[w].data||[],ba=n.length;e<ba;e+=1,L+=1){M=n[e]||{};da=[ka[w].seriesname,z(M.x),z(M.y)];void 0!==M.z&&(da.push(z(M.z)),T||(h.set(0,3,"z"),T=
1));if(t||m||void 0!==M.errorvalue||void 0!==M.horizontalerrorvalue||void 0!==M.verticalerrorvalue)a=z(M.errorvalue),da.push(M.errorvalue,void 0===M.horizontalerrorvalue?a:z(M.horizontalerrorvalue),void 0===M.verticalerrorvalue?a:z(M.verticalerrorvalue)),t||(h.set(0,T+3,"Error"),h.set(0,T+4,"Horizontal Error"),h.set(0,T+5,"Vertical Error")),t=U.error=!0;h.setRow(L,da)}else if(X){h.clear();V={};X={};w=0;e=1;E=a.rows&&a.rows.row||[];for(m=E.length;w<m;w+=1,e+=1)da=E[w],da.id&&(V[da.id.toLowerCase()]=
e,h.set(e,0,da.label||da.id));w=0;e=1;E=a.columns&&a.columns.column||[];for(m=E.length;w<m;w+=1,e+=1)da=E[w],da.id&&(X[da.id.toLowerCase()]=e,h.set(0,e,da.label||da.id));n=a.dataset&&a.dataset[0]&&a.dataset[0].data||[];w=0;for(m=n.length;w<m;w+=1)M=n[w],L=M.rowid.toLowerCase(),B=M.columnid.toLowerCase(),V[L]||(V[L]=h.rowCount,h.set(h.rowCount,0,M.rowid)),X[B]||(X[B]=h.columnCount,h.set(0,h.columnCount,M.columnid)),h.set(V[L],X[B],z(M.value))}ka=E=xa=ea=null;0<h.rowCount&&void 0===h.get(0,0)&&h.set(0,
0,N.xaxisname||"Label");return{data:h.toString(),error:void 0,predictedFormat:U}},transportable:!1});D.addEventListener("Loaded",function(c){c=c.sender;"javascript"!==c.options.renderer||c.getDataAsCSV||(c.getDataAsCSV=c.ref.getDataAsCSV=c.getCSVData)})}]);
FusionCharts.register("module",["private","modules.renderer.js",function(){var d=this,h=d.window,D=h.document,z=d.core.options,p=/msie/i.test(h.navigator.userAgent)&&!h.opera,c=Boolean(h.SVGAngle||D.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1")),I=function(){},b=d.hcLib={cmdQueue:[]},P=b.moduleCmdQueue={base:[],charts:[],powercharts:[],widgets:[],maps:[]},a=b.moduleDependencies={},w=b.moduleMeta={base:"fusioncharts.js",charts:"fusioncharts.charts.js",powercharts:"fusioncharts.powercharts.js",
widgets:"fusioncharts.widgets.js",maps:"fusioncharts.maps.js"},F={},L=b.getMetaSentence=function(){var a={};return function(c){c=c&&c.replace(/(^\s*)|(\s*$)/g,"")||"";return a[c]||(a[c]={key:c,subject:c.replace(/[^\/]*?$/ig,""),predicate:c.replace(/^.*\//ig,"")})}}(),B=b.getDependentModuleName=function(c){var b=[],e,d;c=L(c).predicate;for(e in a)void 0!==(d=a[e][c])&&(b[d]=e);return b},g=b.hasModule=function(a){var c,b;if(a instanceof Array){c=0;for(b=a.length;c<b;c+=1)if(!Boolean(d.modules["modules.renderer.js-"+
L(a[c]).predicate]))return!1;return!0}return Boolean(d.modules["modules.renderer.js-"+L(a).predicate])},e=b.loadModule=function(a,c,b,e){a instanceof Array||(a=[a]);var l=a.length,m=0,p;p=function(){if(m>=l)c&&c();else{var B=a[m],h=B&&B.match(/[^\/]*$/i)[0],E=w[B];m+=1;if(B){if(g(h)){p();return}if(F[h]){d.raiseError(e||d.core,"1112201445A","run","JavaScriptRenderer~loadModule() ","required resources are absent or blocked from loading.");b&&b(h);return}}else b&&b(h);B=d.core.options["html5"+d.capitalizeString(h)+
"Src"];d.loadScript(void 0===B?E:B,{success:function(){g(h)?p():b&&b(h)},failure:b&&function(){b(h)}},void 0,!0)}};p()},l=b.executeWaitingCommands=function(a){for(var c;c=a.shift();)"object"===typeof c&&I[c.cmd].apply(c.obj,c.args)},m=function(a){delete a.sender.jsVars._reflowData;a.sender.jsVars._reflowData={};delete a.sender.jsVars._reflowClean},N=function(){var a=function(){};a.prototype={LoadDataErrorText:"Error in loading data.",XMLLoadingText:"Retrieving data. Please wait",InvalidXMLText:"Invalid data.",
ChartNoDataText:"No data to display.",ReadingDataText:"Reading data. Please wait",ChartNotSupported:"Chart type not supported.",PBarLoadingText:"",LoadingText:"Loading chart. Please wait",RenderChartErrorText:"Unable to render chart."};return a.prototype.constructor=a}(),E=b.getContainerBackgroundColor=function(a){var e=a.options.containerBackgroundColor,d=a.options.containerBackgroundOpacity,g=a.jsVars.transparent;void 0!==g&&null!==g?d=a.jsVars.transparent?0:1:(d=parseFloat(d),0>d?d=0:1<d&&(d=1));
e||(e="#ffffff");if(p&&!c)return d?e:"transparent";e=e.replace(/^#?([a-f0-9]+)/ig,"$1");e=b.graphics.HEXtoRGB(e);e[3]=d.toString();return"rgba("+e.join(",")+")"};b.injectModuleDependency=function(c,e,d){var g=!1,l=L(c).subject;c=L(c).predicate;e=void 0===e?c:L(e).predicate;a[c]||(a[c]={},P[c]||(P[c]=[],b.moduleMeta[c]=l+z.html5ScriptNamePrefix+(e&&e.replace&&e.replace(/^[\s\S]*\//ig,"").replace(/\?/g,"%3F").replace(/\#/g,"%23").replace(/\:/g,"%3A")||"")+z.html5ScriptNameSuffix),g=!0);a[c][e]=d||0;
return g};b.needsModule=function(a,c){a=L(a).predicate;c=L(c).predicate;return void 0!==(b.moduleDependencies[a]&&b.moduleDependencies[a][c])};b.cleanupWaitingCommands=function(a){for(var c=a.chartType(),c=B(c),b,e=[],d;b=c.shift();){for(b=P[b]||[];d=b.shift();)"object"===typeof d&&d.obj!==a&&e.push(d);b.concat(e);e=[]}};d.extend(d.core.options,{html5ScriptNameSuffix:".js",html5ScriptNamePrefix:"fusioncharts."});d.extend(I,{dataFormat:"json",ready:!1,policies:{jsVars:{},options:{showChartLoadingMessage:["showChartLoadingMessage",
!0]}},init:function(){g("base")?I.ready=!0:e("base",function(){I.ready=!0;l(b.cmdQueue)},void 0,d.core)},render:function(a){var c=a,e=this.jsVars.msgStore;c&&this.options.showChartLoadingMessage&&(c.innerHTML='<small style="display: inline-block; *zoom:1; *display:inline; width: 100%; font-family: Verdana,sans; font-size: 10px; color: #666666; text-align: center; padding-top: '+(parseInt(c.style.height,10)/2-5)+'px">'+(e.PBarLoadingText||e.LoadingText)+"</small>",c.style.backgroundColor=E(this));
b.cmdQueue.push({cmd:"render",obj:this,args:arguments})},update:function(){b.cmdQueue.push({cmd:"update",obj:this,args:arguments})},resize:function(){b.cmdQueue.push({cmd:"resize",obj:this,args:arguments})},dispose:function(){var a=b.cmdQueue,c,e;c=0;for(e=a.length;c<e;c+=1)a[c].obj===this&&(a.splice(c,1),e-=1,c-=1)},load:function(){b.cmdQueue.push({cmd:"load",obj:this,args:arguments})},config:function(a,c){var b,e=this.jsVars,d=e.msgStore,e=e.cfgStore,g=this.options,l;l={LoadingText:"loadMessage",
ChartNotSupported:"typeNotSupportedMessage",RenderChartErrorText:"renderErrorMessage",XMLLoadingText:"dataLoadStartMessage",ChartNoDataText:"dataEmptyMessage",LoadDataErrorText:"dataLoadErrorMessage",InvalidXMLText:"dataInvalidMessage"};"string"===typeof a&&1<arguments.length&&(b=a,a={},a[b]=c);for(b in a)void 0!==d[b]?d[b]=a[b]:e[b.toLowerCase()]=a[b],l[b]&&(g[l[b]]=a[b])},protectedMethods:{},events:{beforeInitialize:function(a){var c=a.sender;a=c.jsVars;var e;a.fcObj=c;a.msgStore=a.msgStore||new N;
a.cfgStore=a.cfgStore||{};a.previousDrawCount=-1;a.drawCount=0;a._reflowData={};c.addEventListener("beforeRender",function(a){a.sender.jsVars.smartLabel=new b.SmartLabelManager(c.id,D.body||D.getElementsByTagName("body")[0]);a.detachHandler()});a.userModules instanceof Array||(e=a.userModules,a.userModules=[],"string"===typeof e&&(a.userModules=a.userModules.concat(e.split(","))));b.chartAPI&&b.chartAPI[void 0]||(a.needsLoaderCall=!0)},initialized:function(a){a=a.sender;var c=a.jsVars;c.needsLoaderCall&&
(delete c.needsLoaderCall,I.load.call(a))},beforeDataUpdate:m,beforeDispose:function(a){var c=a.sender.jsVars;c.smartLabel&&!c.smartLabel.disposed&&c.smartLabel.dispose();m.apply(this,arguments)},beforeRender:function(a){var c=a.sender.jsVars;delete c.drLoadAttempted;delete c.waitingModule;delete c.waitingModuleError;m.apply(this,arguments)},dataLoadRequested:function(a){a=a.sender;var c=a.jsVars;delete c.loadError;a.ref&&a.options.showDataLoadingMessage?c.hcObj&&!c.hasNativeMessage&&c.hcObj.showLoading?
c.hcObj.showMessage(c.msgStore.XMLLoadingText):a.ref.showChartMessage?a.ref.showChartMessage("XMLLoadingText"):c.stallLoad=!0:c.stallLoad=!0},dataLoadRequestCompleted:function(a){delete a.sender.jsVars.stallLoad},dataLoadError:function(a){var c=a.sender,b=c.jsVars;delete b.stallLoad;b.loadError=!0;c.ref&&"function"===typeof c.ref.showChartMessage&&c.ref.showChartMessage("LoadDataErrorText");c.__state.dataFetchDuringConstruction&&delete c.__state.dataFetchDuringConstruction;m.apply(this,arguments)}},
_call:function(a,c,b){a.apply(b||h,c||[])}});d.extend(I.prototype,{getSWFHTML:function(){d.raiseWarning(this,"11090611381","run","JavaScriptRenderer~getSWFHTML()","getSWFHTML() is not supported for JavaScript charts.")},addVariable:function(){d.raiseWarning(this,"11090611381","run","JavaScriptRenderer~addVariable()",'Use of deprecated "addVariable()". Replace with "configure()".');d.core.prototype.configure.apply(this,arguments)},getXML:function(){d.raiseWarning(this,"11171116291","run","JavaScriptRenderer~getXML()",
'Use of deprecated "getXML()". Replace with "getXMLData()".');return this.getXMLData.apply(this,arguments)},setDataXML:function(){d.raiseWarning(this,"11171116292","run","JavaScriptRenderer~setDataXML()",'Use of deprecated "setDataXML()". Replace with "setXMLData()".');return this.setXMLData.apply(this,arguments)},setDataURL:function(){d.raiseWarning(this,"11171116293","run","JavaScriptRenderer~setDataURL()",'Use of deprecated "SetDataURL()". Replace with "setXMLUrl()".');return this.setXMLUrl.apply(this,
arguments)},hasRendered:function(){return!(!this.jsVars.hcObj||!this.jsVars.hcObj.hasRendered)},setTransparent:function(a){var c;if(c=this.jsVars)"boolean"!==typeof a&&null!==a&&(a=!0),c.transparent=null===a?!1:!0===a?!0:!1}});d.extend(d.core,{_fallbackJSChartWhenNoFlash:function(){h.swfobject.hasFlashPlayerVersion(d.core.options.requiredFlashPlayerVersion)||d.renderer.setDefault("javascript")},_enableJSChartsForSelectedBrowsers:function(a){void 0!==a&&null!==a&&d.renderer.setDefault((new RegExp(a)).test(h.navigator.userAgent)?
"javascript":"flash")},_doNotLoadExternalScript:function(a){var c,b;for(c in a)b=c.toLowerCase(),w[b]&&(F[b]=Boolean(a[c]))},_preloadJSChartModule:function(){throw"NotImplemented()";}});d.renderer.register("javascript",I);c||p?d.renderer.setDefault("javascript"):h.swfobject&&h.swfobject.hasFlashPlayerVersion&&!h.swfobject.hasFlashPlayerVersion(d.core.options.requiredFlashPlayerVersion)&&(d.raiseWarning(d.core,"1204111846","run","JSRenderer","Switched to JavaScript as default rendering due to absence of required Flash Player."),
d.renderer.setDefault("javascript"))}]);
FusionCharts.register("module",["private","modules.renderer.js-lib",function(){var d=this,h=d.window,D=h.document,z=Boolean(h.SVGAngle||D.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1")),p=/msie/i.test(h.navigator.userAgent)&&!h.opera,c=h.parseFloat,I=/\s+/g,b=/^#?/,P=/^rgba/i,a=/[#\s]/ig,w=/\{br\}/ig,F=/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i,L=Math.abs,B=Math.pow,g=Math.round,e=B(2,-24),l=Object.prototype.toString,m=void 0!==D.documentElement.ontouchstart,N="http://www.fusioncharts.com?BS=FCHSEvalMark&utm_source=FCS_trial&pver="+
h.escape(d.core.version),E=Math,n=E.max,V=E.min,t={pageX:0,pageY:0},X=d.hcLib||(d.hcLib={}),u=function(a){var c=a.data,b=c.chart,k=b.paper,e=a.state,d=oa(da(a.originalEvent)),q=d.target||d.originalTarget||d.srcElement||d.relatedTarget||d.fromElement,g=b.elements.resizeBox,l=c.layerX=d.pageX-c.chartPosLeft,J=c.layerY=d.pageY-c.chartPosTop,m=l-c.ox,t=J-c.oy,G=c.bBox,p=c.ox,H=c.oy,u=c.zoomX,W=c.zoomY,G=c.canvasY,B=c.canvasX,h=c.canvasW,w=c.canvasH,M=c.canvasX2,E=c.canvasY2,ea=c.strokeWidth,m=c.attr;
switch(e){case "start":a=U(this);c.chartPosLeft=a.left;c.chartPosTop=a.top;l=d.pageX-c.chartPosLeft;J=d.pageY-c.chartPosTop;c.oy=J;c.ox=l;c.allowMove=!1;g||(g=b.elements.resizeBox=k.rect(b.layers.tracker).attr(m));l>B&&l<M&&J>G&&J<E&&(c.allowMove=!0);q&&q.ishot&&(c.allowMove=!1);g.attr({x:0,y:0,width:0,height:0}).show();break;case "end":G=g.getBBox();b={chart:b,selectionLeft:G.x,selectionTop:G.y,selectionHeight:G.height,selectionWidth:G.width,originalEvent:a.originalEvent};c.isDragged&&(c.selectionEnd&&
c.selectionEnd(b),c.isDragged=0);g.hide();delete c.oy;delete c.ox;break;default:if(!c.allowMove)break;m=l-c.ox;t=J-c.oy;p=c.ox;H=c.oy;c.isDragged||(b={chart:b,selectionLeft:(u?V(p,p+m):B)+.5*ea,selectionTop:(W?V(H,H+t):G)+.5*ea,selectionHeight:0,selectionWidth:0,originalEvent:a.originalEvent},c.selectionStart&&c.selectionStart(b),c.isDragged=1);m=-(p-V(p-(p-n(p+m,B)),M));t=-(H-V(H-(H-n(H+t,G)),E));g.attr({x:(u?V(p,p+m):B)+.5*ea,y:(W?V(H,H+t):G)+.5*ea,width:u?L(m):h,height:W?L(t):w})}},ga=function(a){var c=
a.data;a=a.originalEvent;var b=a.target||a.originalTarget||a.srcElement||a.relatedTarget||a.fromElement,k=a.type,e=a.layerX,d=a.layerY;void 0===e&&(e=a.pageX-c.chartPosLeft,d=a.pageY-c.chartPosTop);"mousedown"===k&&(b.ishot=e>c.canvasX&&e<c.canvasX2&&d>c.canvasY&&d<c.canvasY2);"mouseup"===k&&setTimeout(function(){b.ishot=!1},1)},E=function(){var a="innerWidth",c="innerHeight",b=D.documentElement||D.body,k=b;"innerWidth"in h?k=h:(a="clientWidth",c="clientHeight");return function(){return{width:k[a],
height:k[c],scrollTop:b.scrollTop,scrollLeft:b.scrollLeft}}}(),U=function(a,c){var b={left:a.offsetLeft||0,top:a.offsetTop||0};for(a=a.offsetParent;a;)b.left+=a.offsetLeft||0,b.top+=a.offsetTop||0,a===D.body||a===D.documentElement||c||(b.left-=a.scrollLeft,b.top-=a.scrollTop),a=a.offsetParent;return b},ka=function(a){return a&&a.replace(/\$/g,"$$$$")},xa=function(a,c){return a||!1===a||0===a?a:c},ea=function(){var a,c,b;c=0;for(b=arguments.length;c<b;c+=1)if((a=arguments[c])||!1===a||0===a)return a;
return""},Y=function(){var a,c,b;c=0;for(b=arguments.length;c<b;c+=1)if((a=arguments[c])||!1===a||0===a)return a},ua=function(a,c,b,k){return X.dem.listen(a,c,b,k)},ba=function(a,c,b){return X.dem.unlisten(a,c,b)},da=function(a){a=a.sourceEvent||a.originalEvent||a;return m&&a&&a.touches&&a.touches[0]||a||t},oa=function(){var a;return function(c){void 0===c.pageX&&(c.pageX=c.clientX+(a||(a=h.document.body||h.document.documentElement)).scrollLeft,c.pageY=c.clientY+a.scrollTop);return c}}(),H=function(a,
c){c=oa(da(c));var b=c.pageX,k=c.pageY,e=U(a);return{chartX:b-e.left,chartY:k-e.top,pageX:b,pageY:k}},M=function(a){return a&&a.replace(/^#?([a-f0-9]+)/ig,"#$1")||"none"},T=function(){var a,c,b;c=0;for(b=arguments.length;c<b;c+=1)if(((a=arguments[c])||!1===a||0===a)&&!isNaN(a=Number(a)))return a},q=function(a,c){a=a||!1===a||0===a?Number(a):NaN;return isNaN(a)?null:c?L(a):a},J=function(a){return"string"===typeof a?a.replace(w,"<br />"):""},W=function(a,c){for(var b=c.length,k=-1;b--;)if(a===c[b]){k=
b;break}return k},G=function(){if(Array.isArray)return Array.isArray;var a=Object.prototype.toString,c=a.call([]);return function(b){return a.call(b)===c}}(),ja=function(a,c,b,k,e){var d,q,g,n;e?(k.push(a),e.push(c)):(k=[a],e=[c]);if(c instanceof Array)for(d=0;d<c.length;d+=1){try{q=a[d],g=c[d]}catch(J){continue}if("object"!==typeof g)b&&void 0===g||(a[d]=g);else{if(null===q||"object"!==typeof q)q=a[d]=g instanceof Array?[]:{};n=W(g,e);-1!==n?q=a[d]=k[n]:ja(q,g,b,k,e)}}else for(d in c){try{q=a[d],
g=c[d]}catch(m){continue}if(null!==g&&"object"===typeof g)if(n=l.call(g),"[object Object]"===n){if(null===q||"object"!==typeof q)q=a[d]={};n=W(g,e);-1!==n?q=a[d]=k[n]:ja(q,g,b,k,e)}else"[object Array]"===n?(null!==q&&q instanceof Array||(q=a[d]=[]),n=W(g,e),-1!==n?q=a[d]=k[n]:ja(q,g,b,k,e)):a[d]=g;else a[d]=g}return a},La=function(a,c,b){if("object"!==typeof a&&"object"!==typeof c)return null;if("object"!==typeof c||null===c)return a;"object"!==typeof a&&(a=c instanceof Array?[]:{});ja(a,c,b);return a},
Ca=function(a,c){var b;if(c instanceof Array)for(b=c.length-1;0<=b;b-=1)"object"!==typeof c[b]?!0===c[b]&&a&&a.splice&&a.splice(b,1):l.call(c[b])===l.call(a[b])&&Ca(a[b],c[b]);else for(b in c)"object"!==typeof c[b]?!0===c[b]&&a&&a.splice&&a.splice(b,1):l.call(c[b])===l.call(a[b])&&Ca(a[b],c[b]);return a},na=function(){var a=/^@window_/g;return function(c,b){var k=c.replace(/\[[\'\"]/g,".").replace(/[\'\"]\]/g,"").replace(/\[/g,".@window_").replace(/\]/g,"").split("."),e=h,d,q;q="";var g,n,l;n=k.length;
for(l=0;l<n;l+=1){g=k[l];d=e;if(g.match(a))q=h[g.replace(a,"")],e=e[q];else{if(void 0===e||null===e)throw(q||g).replace(a,"")+" is not defined";e=e[g]}q=g}!e||"function"!==typeof e.call&&e!==h.alert?setTimeout(function(){throw g.replace(a,"")+"() is not a function";},0):e===h.alert?e(b):e.call(d,b)}}(),pa=function(){var a="FusionChartslinkEval"+parseInt(+new Date,10);return function(c){try{h[a]=new Function(c),eval('window["'+a+'"]();')}catch(b){setTimeout(function(){throw b;},0)}z?delete h[a]:h[a]=
null}}(),za=function(a,c){a=Number(a);a=isNaN(a)?100:a;void 0!==c&&(a=a*c/100);return a%101},aa=function(a,c,b){a=a.split(",");var k;void 0!==b&&(b=T(b.split(",")[0]));a[0]=za(a[0],b);for(k=1;k<c;k+=1)a[k]=a[0]*za(a[k],b)/100;return a.join(",")},Z=function(c,b,k){var e=0,d=0,q=0;k&&k.match(P)&&(k=k.split(","),e=k[0].slice(k[0].indexOf("(")+1),d=k[1],q=k[2],b||0===b||(b=parseInt(100*k[3].slice(0,k[3].indexOf(")")),10)));if(c)if(c.match(P))k=c.split(","),e=k[0].slice(k[0].indexOf("(")+1),d=k[1],q=k[2];
else{c=c.replace(a,"").split(",")[0];switch(c.length){case 3:c=c.charAt(0)+c.charAt(0)+c.charAt(1)+c.charAt(1)+c.charAt(2)+c.charAt(2);break;case 6:break;default:c=(c+"FFFFFF").slice(0,6)}e=parseInt(c.slice(0,2),16);d=parseInt(c.slice(2,4),16);q=parseInt(c.slice(4,6),16)}b||0===b||(b=100);"string"===typeof b&&(b=b.split(",")[0]);b=parseInt(b,10)/100;return"rgba("+e+","+d+","+q+","+b+")"},Ma=function(){var a={};return function(b){var k=(b=b||this)&&b.FCcolor||b,e=k.color,d=k.ratio,q=k.angle,g=k.alpha,
n=k.r,l=k.cx,J=k.cy,m=k.fx,t=k.fy,G=k.gradientUnits,p=k.x1,H=k.y1,u=k.x2,W=k.y2,B=1,h,w,M,E;if("string"===typeof b)return a[E="~"+b]||(a[E]=b.replace(/^#?([a-f0-9]{3,6})/ig,"#$1"));e=e||"";if(!e)return h;E=[e,g,d,q,n,l,J,G,m,t,p,u,H,W].join("_").replace(/[\(\)\s,\xb0#]/g,"_");if(a[E])return a[E];d=d&&(d+"").split(",")||[];g=(g||0===g)&&(g+"").split(",")||[];if(e=e.split(","))if(h="",1===e.length)M=e[0].replace(/^#?([a-f0-9]{3,6})/ig,"$1"),h=g.length?"rgba("+Da(M).join(",")+","+.01*c(g[0])+")":M.replace(/^#?([a-f0-9]{3,6})/ig,
"#$1");else{b=0;for(w=e.length;b<w;b++)M=e[b].replace(/^#?([a-f0-9]{3,6})/ig,"$1"),isNaN(d[b])||(d[b]=c(d[b]),M+=":"+d[b],isNaN(d[b+1])||(d[b+1]=c(d[b+1])+d[b])),isNaN(g[b])||""===g[b]||(B=.01*g[b]),e[b]="rgba("+Da(M).join(",")+","+B+")",isNaN(d[b])||(e[b]=e[b]+":"+d[b]);h+=e.join("-");if(void 0!==n||void 0!==m||void 0!==l||k.radialGradient)h="xr("+[m,t,n,l,J,G].join()+")"+h;else{h="-"+h;if(void 0!==p||void 0!==H||void 0!==u||void 0!==W)h="("+[p,H,u,W,G].join()+")"+h;void 0===q&&(q=0);h=360-c(q)%
360+h}}return a[E]=h}}(),Ha=function(){return function(){return""}}(),hb=function(c){return c.replace(a,"").replace(b,"#")},Fa=function(c,b){b=(0>b||100<b?100:b)/100;c=c.replace(a,"");var k=parseInt(c,16),e=Math.floor(k/65536),d=Math.floor((k-65536*e)/256);return("000000"+(e*b<<16|d*b<<8|(k-65536*e-256*d)*b).toString(16)).slice(-6)},Za=function(c,b){b=(0>b||100<b?100:b)/100;c=c.replace(a,"");var k=parseInt(c,16),e=Math.floor(k/65536),d=Math.floor((k-65536*e)/256);return("000000"+(256-(256-e)*b<<16|
256-(256-d)*b<<8|256-(256-(k-65536*e-256*d))*b).toString(16)).slice(-6)},Da=function(a){a=parseInt(a,16);var c=Math.floor(a/65536),b=Math.floor((a-65536*c)/256);return[c,b,Math.floor(a-65536*c-256*b)]},$a=function(a,c){if("object"!==typeof a)return"";if(a.fontSize||a["font-size"])!a.fontSize&&a["font-size"]&&(a.fontSize=a["font-size"],delete a["font-size"]),a.lineHeight=(parseFloat(a.fontSize)||c||10)*X.lineHeightFactor+"px",delete a["line-height"];!a.lineHeight&&a["line-height"]&&(a.lineHeight=a["line-height"],
delete a["line-height"]);return a.lineHeight},Na=function(a,c,b,k,e){var d=ea(a.labelbordercolor,c.bordercolor,b.labelbordercolor,""),q=Y(a.labelbgcolor,c.bgcolor,b.labelbgcolor),g=T(a.labelborderthickness,c.borderthickness,b.labelborderthickness,1);e=T(b.usedataplotcolorforlabels,0)?e||k.color:k.color;d=d?Z(d,T(a.labelborderalpha,c.borderalpha,b.labelborderalpha,a.labelalpha,c.alpha,b.labelalpha,100)):"";a={fontFamily:Y(a.labelfont,c.font,b.labelfont,k.fontFamily),fontSize:Y(a.labelfontsize,c.fontsize,
b.labelfontsize,parseInt(k.fontSize,10))+"px",color:Z(Y(a.labelfontcolor,c.fontcolor,b.labelfontcolor,e),T(a.labelfontalpha,c.fontalpha,b.labelfontalpha,a.labelalpha,c.alpha,b.labelalpha,100)),fontWeight:T(a.labelfontbold,c.fontbold,b.labelfontbold)?"bold":"normal",fontStyle:T(a.labelfontitalic,c.fontitalic,b.labelfontitalic)?"italic":"normal",border:d||q?g+"px solid":"",borderColor:d,borderThickness:g,borderPadding:T(a.labelborderpadding,c.borderpadding,b.labelborderpadding,2),borderRadius:T(a.labelborderradius,
c.borderradius,b.labelborderradius,0),backgroundColor:q?Z(q,T(a.labelbgalpha,c.bgalpha,b.labelbgalpha,a.labelalpha,c.alpha,b.labelalpha,100)):"",borderDash:T(a.labelborderdashed,c.borderdashed,b.labelborderdashed,0)?Wa(T(a.labelborderdashlen,c.borderdashlen,b.labelborderdashlen,4),T(a.labelborderdashgap,c.borderdashgap,b.labelborderdashgap,2),g):void 0};a.lineHeight=$a(a);return a},Ba=function(){var a={top:{align:"center",verticalAlign:"top",textAlign:"center"},right:{align:"right",verticalAlign:"middle",
textAlign:"left"},bottom:{align:"center",verticalAlign:"bottom",textAlign:"center"},left:{align:"left",verticalAlign:"middle",textAlign:"right"}},c=/([^\,^\s]+)\)$/g,b=function(a,c){var b;/^(bar|bar3d)$/.test(a)&&(this.isBar=!0,this.yPos="bottom",this.yOppPos="top",this.xPos="left",this.xOppPos="right");b=parseInt(c.labelstep,10);this.labelStep=1<b?b:1;this.showLabel=T(c.showlabels,c.shownames,1);this.is3D=/3d$/.test(a)};b.prototype={isBar:!1,yPos:"left",yOppPos:"right",xPos:"bottom",xOppPos:"top",
addAxisGridLine:function(b,k,e,d,q,g,O,n){var l=""===e?!1:!0,J=0<d||0<g.match(c)[1]?!0:!1,m;if(l||J)J||(g="rgba(0,0,0,0)",d=.1),m={isGrid:!0,width:d,dashStyle:q,color:g,value:k,zIndex:void 0===O?2:O},l&&(k=b.opposite?n?this.xOppPos:this.yOppPos:n?this.xPos:this.yPos,k=a[k],m.label={text:e,style:b.labels.style,textAlign:k.textAlign,align:k.align,verticalAlign:k.verticalAlign,rotation:0,x:0,y:0}),b.plotLines.push(m);return m},addAxisAltGrid:function(a,c){if(!this.is3D){var b=T(a._lastValue,a.min),k=
Y(a._altGrid,!1);k&&a.plotBands.push({isGrid:!0,color:a.alternateGridColor,to:c,from:b,zIndex:1});a._lastValue=c;a._altGrid=!k}},addXaxisCat:function(c,b,k,e,s,d,q,g){var O=a[c.opposite?this.xOppPos:this.xPos];b={isGrid:!0,isDataLabel:!0,width:.1,color:"rgba(0,0,0,0)",value:b,label:{text:e,link:Y(s.labellink,d.link,q.labellink),style:Na(s,d,q,c.labels.style,g),textAlign:O.textAlign,align:O.align,verticalAlign:O.verticalAlign,rotation:0,x:0,y:0}};0!==k%this.labelStep&&(b.stepped=!0,b.label.style=c.steppedLabels.style);
c.plotLines.push(b)},addVline:function(a,c,b,k){k=k._FCconf;var e=k.isBar,s=k.divlineStyle,A=J(c.label),d=Boolean(T(c.showlabelborder,k.showVLineLabelBorder,1)),q=Boolean(T(c.showlabelbackground,1)),g=Y(c.labelhalign,e?"left":"center"),O=Y(c.labelvalign,e?"middle":"bottom").toLowerCase(),n=T(c.labelposition,0),l=T(c.lineposition,.5),m=T(c.showvlines,k.showVLines,1),t=T(c.alpha,k.vLineAlpha,80),G=Y(c.color,k.vLineColor).replace(/^#?/,"#"),p=q?Y(c.labelbgcolor,k.vLineLabelBgColor,"333333").replace(/^#?/,
"#"):"",H=Y(c.labelcolor,k.vLineLabelColor,c.color,k.vLineColor).replace(/^#?/,"#"),u=T(c.thickness,k.vLineThickness,1),h=.5*u,W=Boolean(Number(Y(c.dashed,0))),B=T(c.dashlen,5),w=T(c.dashgap,2),M=k.smartLabel,E=parseInt(s.fontSize,10)+2,V=0,r=T(c.rotatelabel,k.rotateVLineLabels)?270:0,l=0>l||1<l?.5:l,n=0>n||1<n?0:n;M.setStyle(s);M=M.getOriSize(A);G=Z(G,m?t:"0");if(e){switch(O){case "top":E-=M.height+h+2;break;case "middle":E-=.5*M.height+1;break;default:E+=h}c.labelhalign||(V-=M.width*n)}else{switch(O){case "top":E=
.5*-M.height+1;break;case "middle":E=0;break;default:E=.5*M.height}switch(g){case "left":V+=u;break;case "right":V-=u+1}}a.plotLines.push({isVline:!0,color:G,width:u,value:b-1+l,zIndex:T(c.showontop,k.showVLinesOnTop)?5:3,dashStyle:W?Wa(B,w,u):void 0,label:{text:A,align:e?"left":"center",offsetScale:n,rotation:r,y:E,x:V,textAlign:g,backgroundColor:p,borderWidth:m&&d?"1px":"",borderType:m&&d?"solid":"",borderColor:m&&d?H:"",backgroundOpacity:m&&q?Y(c.labelbgalpha,k.vLineLabelBgAlpha)/100:0,style:{color:m?
H:G,fontSize:s.fontSize,fontFamily:s.fontFamily,lineHeight:s.lineHeight,backgroundColor:p}}})}};return b.prototype.constructor=b}(),Cb=function(){var a=function(a,b,k,e,A){a=Math.abs(b-a);b=a/(k+1);c(a,k,e)||(A&&Number(b)/Number(e)<(1<e?2:.5)&&(e/=10),b=(Math.floor(b/e)+1)*e,a=b*(k+1));return a},c=function(a,c,k){return b(a/(c+1))>b(k)?!1:!0},b=function(a){a=Math.abs(a);a=String(a);var c=0,b=a.indexOf(".");-1!=b&&(c=a.length-b-1);return c};return function(b,k,d,q,g,O,n,l){var m,J,t,G,p,H,u;b=!0===
isNaN(b)||void 0===b?.1:b;k=!0===isNaN(k)||void 0===k?0:k;b===k&&0===b&&(b=.1);g=void 0===typeof g?!0:g;O=void 0===typeof O?!0:O;m=Math.floor(Math.log(Math.abs(b))/Math.LN10);J=Math.floor(Math.log(Math.abs(k))/Math.LN10);J=Math.max(J,m);m=Math.pow(10,J);2>Math.abs(b)/m&&2>Math.abs(k)/m&&(J--,m=Math.pow(10,J));J=Math.floor(Math.log(b-k)/Math.LN10);J=Math.pow(10,J);0<b-k&&10<=m/J&&(m=J);J=(Math.floor(b/m)+1)*m;0>k?t=-1*(Math.floor(Math.abs(k/m))+1)*m:O?t=0:(t=Math.floor(Math.abs(k/m)-1)*m,t=0>t?0:t);
g&&0>=b&&(J=0);g=d||0===d?!0:!1;O=q||0===q?!0:!1;b=!1===g||!0===g&&Number(d)<b&&b-Number(d)>e?J:Number(d);k=!1===O||!0===O&&Number(q)>k&&Number(q)-k>e?t:Number(q);q=Math.abs(b-k);if(!1===O&&!1===g&&l)if(0<b&&0>k)for(d=!1,g=10<m?m/10:m,l=a(k,b,n,g,!1),O=l-(n+1)*g;!1===d;){if(O+=(n+1)*g,c(O,n,g))if(l=O-q,J=O/(n+1),G=Math.min(Math.abs(k),b),t=G==Math.abs(k)?-1:1,0===n)d=!0;else for(H=1;H<=Math.floor((n+1)/2);H++)p=J*H,!(p-G>l)&&p>G&&(u=O-p,u/J==Math.floor(u/J)&&p/J==Math.floor(p/J)&&(q=O,b=-1==t?u:p,
k=-1==t?-p:-u,d=!0))}else d=a(k,b,n,m,!0),l=d-q,q=d,0<b?b+=l:k-=l;else if(l&&0<n){l=0;for(d=1;;){g=n+l*d;g=0===g?1:g;if(c(q,g,m))break;l=-1==d||l>n?++l:l;if(25<l){g=0;break}d=l<=n?-1*d:1}n=g}return{Max:b,Min:k,Range:q,interval:m,divGap:(b-k)/(n+1)}}}(),Jb=function(){var a=function(a,c,b){var k=b.jsVars&&b.jsVars.smartLabel,e=a.offsetWidth;a=a.offsetHeight;this.title.y=a/2;this.title.x=e/2;this.title.style=b._chartMessageStyle;delete b._chartMessageStyle;void 0!==c&&(k?($a(this.title.style),k.setStyle(this.title.style),
c=k.getSmartText(J(c),e,a),this.title.text=c.text):this.title.text=J(c),this.title.verticalAlign="middle")};a.prototype={chart:{events:{},margin:[0,0,0,0],backgroundColor:{FCcolor:{alpha:0}}},credits:{href:N,text:"FusionCharts XT Trial",enabled:!1},legend:{enabled:!1},title:{text:"",style:{fontFamily:"Verdana,sans",fontSize:"10px",color:"#666666"}},plotOptions:{series:{}},series:[{}],exporting:{enabled:!1},nativeMessage:!0};return a.prototype.constructor=a}(),Qb={"true":{"true":{"true":"center","false":"center"},
"false":{"true":"center","false":"center"}},"false":{"true":{"true":"right","false":"left"},"false":{"true":"left","false":"right"}}},ub=function(){return function(a,c,e,d,q,g,n){var l,m=e.trendStyle,t,G,p,H,u,h,W,B,w,M,E,V,ea,N=g?"xAxis":"dataLabels";if(g?e.showVLines:e.showTrendlines)for(l=0,G=a.length;l<G;l+=1)if((ea=a[l])&&ea.line)for(t=0,p=ea.line.length;t<p;t+=1)H=ea.line[t],M=e.numberFormatter.getCleanValue(Y(H.startvalue,H.value,0)),E=e.numberFormatter.getCleanValue(Y(H.endvalue,Y(H.startvalue,
H.value,0))),g?B=c:d&&H.parentyaxis&&/^s$/i.test(H.parentyaxis)?(B=c[1],V=1):B=c[0],h=B.max,W=B.min,u=!1,h>=M&&h>=E&&W<=M&&W<=E&&(d&&H.parentyaxis&&/^s$/i.test(H.parentyaxis)?u="1"!==Y(H.valueonleft,e.trendlineValuesOnOpp):d||(u="1"===Y(H.valueonright,e.trendlineValuesOnOpp)),h=Boolean(T(H.istrendzone,g?1:0)),(W=(g?e.showVLineLabels:e.showTrendlineLabels)?J(Y(H.displayvalue,e.numberFormatter[N](u?E:M,V))):"")?(w=M<E,u={text:W,textAlign:q?"center":u?"left":"right",align:q?Qb[h][!n][w]:u?"right":"left",
verticalAlign:q?"bottom":"middle",rotation:0,x:0,y:0,style:m},W=Y(H.color,e.trendlineColor),H.alwaysVisible=h,W&&(u.style=La({},m),u.style.color=W.replace(b,"#"))):u=void 0,W=xa(J(Y(H.tooltext,ea.tooltext,e.trendLineToolText))),W=k(W,[7,15,16,17,18,19],{startValue:M,startDataValue:e.numberFormatter[N](M,V),endValue:E,endDataValue:e.numberFormatter[N](E,V),axisName:B.title&&B.title.text},H),w=T(H.thickness,e.trendlineThickness,1),h?B.plotBands.push({isTrend:!0,color:Z(Y(H.color,e.trendlineColor),Y(H.alpha,
e.trendlineAlpha,40)),from:M,to:E,label:u,zIndex:e.is3d||"1"!==Y(H.showontop,e.showTrendlinesOnTop)?3:5,tooltext:W,alwaysVisible:H.alwaysVisible}):B.plotLines.push({isTrend:!0,color:Z(Y(H.color,e.trendlineColor,e.trendlineColor),Y(H.alpha,e.trendlineAlpha,99)),value:M,to:E,width:w,dashStyle:"1"==Y(H.dashed,e.trendlinesAreDashed)?Wa(T(H.dashlen,e.trendlinesDashLen),T(H.dashgap,e.trendlinesDashGap),w):void 0,label:u,zIndex:e.is3d||"1"!==Y(H.showontop,e.showTrendlinesOnTop)?3:5,tooltext:W}))}}(),Wa=
function(a,c,b,k){return k||void 0===k?[a,c]:""},mb=function(){},Ua=function(a,c,b){var k,e=Ua[a];e||(e=function(){},e.prototype=b instanceof mb?b:new mb,e.prototype.constructor=e,e=Ua[a]=new e);b&&(e.base=b);e.name=a;for(k in c)switch(typeof c[k]){case "object":if(c[k]instanceof mb){e[k]=c[k][k];break}default:e[k]=c[k];break;case "undefined":delete e[k]}return this instanceof Ua?(a=function(){},a.prototype=e,a.prototype.constructor=a,new a):e},k=function(){var a=[{regex:/((^|[^\\])((\\)\\)*\$cleanvalue)/ig,
escapeRegex:/((^|[^\\])((\\)\\)*\\(\$cleanvalue))/ig,argIndex:2,argKey:"cleanvalue"},{regex:/((^|[^\\])((\\)\\)*\$datavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$datavalue))/ig,argIndex:2,argKey:"formattedValue"},{regex:/((^|[^\\])((\\)\\)*\$value)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$value))/ig,argIndex:3,argKey:"value"},{regex:/((^|[^\\])((\\)\\)*\$label)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$label))/ig,argIndex:2,argKey:"label"},{regex:/((^|[^\\])((\\)\\)*\$seriesname)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$seriesname))/ig,
argIndex:5,argKey:"seriesname"},{regex:/((^|[^\\])((\\)\\)*\$yaxisname)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$yaxisname))/ig,argIndex:2,argKey:"yaxisName"},{regex:/((^|[^\\])((\\)\\)*\$xaxisname)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$xaxisname))/ig,argIndex:2,argKey:"xaxisName"},{regex:/((^|[^\\])((\\)\\)*\$displayvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$displayvalue))/ig,argIndex:3,argKey:"displayvalue"},{regex:/((^|[^\\])((\\)\\)*\$xdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$xdatavalue))/ig,
argIndex:2,argKey:"xDataValue"},{regex:/((^|[^\\])((\\)\\)*\$ydatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$ydatavalue))/ig,argIndex:2,argKey:"yDataValue"},{regex:/((^|[^\\])((\\)\\)*\$xvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$xvalue))/ig,argIndex:3,argKey:"x"},{regex:/((^|[^\\])((\\)\\)*\$yvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$yvalue))/ig,argIndex:3,argKey:"y"},{regex:/((^|[^\\])((\\)\\)*\$zvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$zvalue))/ig,argIndex:3,argKey:"z"},{regex:/((^|[^\\])((\\)\\)*\$name)/ig,
escapeRegex:/((^|[^\\])((\\)\\)*\\(\$name))/ig,argIndex:3,argKey:"name"},{regex:/((^|[^\\])((\\)\\)*\$percentValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$percentValue))/ig,argIndex:2,argKey:"percentValue"},{regex:/((^|[^\\])((\\)\\)*\$startValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$startValue))/ig,argIndex:2,argKey:"startValue"},{regex:/((^|[^\\])((\\)\\)*\$startDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$startDataValue))/ig,argIndex:2,argKey:"startDataValue"},{regex:/((^|[^\\])((\\)\\)*\$endValue)/ig,
escapeRegex:/((^|[^\\])((\\)\\)*\\(\$endValue))/ig,argIndex:2,argKey:"endValue"},{regex:/((^|[^\\])((\\)\\)*\$endDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$endDataValue))/ig,argIndex:2,argKey:"endDataValue"},{regex:/((^|[^\\])((\\)\\)*\$axisName)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$axisName))/ig,argIndex:2,argKey:"axisName"},{regex:/((^|[^\\])((\\)\\)*\$cumulativevalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$cumulativevalue))/ig,argIndex:2,argKey:"cumulativeValue"},{regex:/((^|[^\\])((\\)\\)*\$cumulativedatavalue)/ig,
escapeRegex:/((^|[^\\])((\\)\\)*\\(\$cumulativedatavalue))/ig,argIndex:2,argKey:"cumulativeDataValue"},{regex:/((^|[^\\])((\\)\\)*\$cumulativePercentValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$cumulativePercentValue))/ig,argIndex:2,argKey:"cumulativePercentValue"},{regex:/((^|[^\\])((\\)\\)*\$cumulativepercentdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$cumulativepercentdatavalue))/ig,argIndex:2,argKey:"cumulativePercentDataValue"},{regex:/((^|[^\\])((\\)\\)*\$sum)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$sum))/ig,
argIndex:2,argKey:"sum"},{regex:/((^|[^\\])((\\)\\)*\$unformattedsum)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$unformattedsum))/ig,argIndex:2,argKey:"unformattedSum"},{regex:/((^|[^\\])((\\)\\)*\$targetvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$targetvalue))/ig,argIndex:2,argKey:"targetValue"},{regex:/((^|[^\\])((\\)\\)*\$targetdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$targetdatavalue))/ig,argIndex:2,argKey:"targetDataValue"},{regex:/((^|[^\\])((\\)\\)*\$processname)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$processname))/ig,
argIndex:2,argKey:"processName"},{regex:/((^|[^\\])((\\)\\)*\$start)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$start))/ig,argIndex:2,argKey:"start"},{regex:/((^|[^\\])((\\)\\)*\$end)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$end))/ig,argIndex:2,argKey:"end"},{regex:/((^|[^\\])((\\)\\)*\$percentcomplete)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$percentcomplete))/ig,argIndex:2,argKey:"percentComplete"},{regex:/((^|[^\\])((\\)\\)*\$taskpercentcomplete)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$taskpercentcomplete))/ig,
argIndex:2,argKey:"taskPercentComplete"},{regex:/((^|[^\\])((\\)\\)*\$taskstartdate)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$taskstartdate))/ig,argIndex:2,argKey:"taskStartDate"},{regex:/((^|[^\\])((\\)\\)*\$taskenddate)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$taskenddate))/ig,argIndex:2,argKey:"taskEndDate"},{regex:/((^|[^\\])((\\)\\)*\$tasklabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$tasklabel))/ig,argIndex:2,argKey:"taskLabel"},{regex:/((^|[^\\])((\\)\\)*\$date)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$date))/ig,
argIndex:2,argKey:"date"},{regex:/((^|[^\\])((\\)\\)*\$percentofprevvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$percentofprevvalue))/ig,argIndex:2,argKey:"percentOfPrevValue"},{regex:/((^|[^\\])((\\)\\)*\$sname)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$sname))/ig,argIndex:2,argKey:"sName"},{regex:/((^|[^\\])((\\)\\)*\$lname)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$lname))/ig,argIndex:2,argKey:"lName"},{regex:/((^|[^\\])((\\)\\)*\$fromid)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromid))/ig,argIndex:2,
argKey:"fromId"},{regex:/((^|[^\\])((\\)\\)*\$fromlabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromlabel))/ig,argIndex:2,argKey:"fromLabel"},{regex:/((^|[^\\])((\\)\\)*\$toid)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toid))/ig,argIndex:2,argKey:"toId"},{regex:/((^|[^\\])((\\)\\)*\$tolabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$tolabel))/ig,argIndex:2,argKey:"toLabel"},{regex:/((^|[^\\])((\\)\\)*\$fromxvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromxvalue))/ig,argIndex:2,argKey:"fromXValue"},
{regex:/((^|[^\\])((\\)\\)*\$fromyvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromyvalue))/ig,argIndex:2,argKey:"fromYValue"},{regex:/((^|[^\\])((\\)\\)*\$fromxdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromxdatavalue))/ig,argIndex:2,argKey:"fromXDataValue"},{regex:/((^|[^\\])((\\)\\)*\$fromydatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromydatavalue))/ig,argIndex:2,argKey:"fromYDataValue"},{regex:/((^|[^\\])((\\)\\)*\$fromlabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromlabel))/ig,
argIndex:2,argKey:"fromLabel"},{regex:/((^|[^\\])((\\)\\)*\$toxvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toxvalue))/ig,argIndex:2,argKey:"toXValue"},{regex:/((^|[^\\])((\\)\\)*\$toyvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toyvalue))/ig,argIndex:2,argKey:"toYValue"},{regex:/((^|[^\\])((\\)\\)*\$toxdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toxdatavalue))/ig,argIndex:2,argKey:"toXDataValue"},{regex:/((^|[^\\])((\\)\\)*\$toydatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toydatavalue))/ig,
argIndex:2,argKey:"toYDataValue"},{regex:/((^|[^\\])((\\)\\)*\$tolabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$tolabel))/ig,argIndex:2,argKey:"toLabel"},{regex:/((^|[^\\])((\\)\\)*\$openvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$openvalue))/ig,argIndex:2,argKey:"openValue"},{regex:/((^|[^\\])((\\)\\)*\$closevalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$closevalue))/ig,argIndex:2,argKey:"closeValue"},{regex:/((^|[^\\])((\\)\\)*\$highvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$highvalue))/ig,
argIndex:2,argKey:"highValue"},{regex:/((^|[^\\])((\\)\\)*\$lowvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$lowvalue))/ig,argIndex:2,argKey:"lowValue"},{regex:/((^|[^\\])((\\)\\)*\$opendatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$opendatavalue))/ig,argIndex:2,argKey:"openDataValue"},{regex:/((^|[^\\])((\\)\\)*\$closedatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$closedatavalue))/ig,argIndex:2,argKey:"closeDataValue"},{regex:/((^|[^\\])((\\)\\)*\$highdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$highdatavalue))/ig,
argIndex:2,argKey:"highDataValue"},{regex:/((^|[^\\])((\\)\\)*\$lowdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$lowdatavalue))/ig,argIndex:2,argKey:"lowDataValue"},{regex:/((^|[^\\])((\\)\\)*\$maxvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$maxvalue))/ig,argIndex:2,argKey:"maxValue"},{regex:/((^|[^\\])((\\)\\)*\$maxdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$maxdatavalue))/ig,argIndex:2,argKey:"maxDataValue"},{regex:/((^|[^\\])((\\)\\)*\$minvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$minvalue))/ig,
argIndex:2,argKey:"minValue"},{regex:/((^|[^\\])((\\)\\)*\$mindatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$mindatavalue))/ig,argIndex:2,argKey:"minDataValue"},{regex:/((^|[^\\])((\\)\\)*\$q1)/ig,argIndex:2,argKey:"Q1"},{regex:/((^|[^\\])((\\)\\)*\$unformattedQ1)/ig,argIndex:2,argKey:"unformattedQ1"},{regex:/((^|[^\\])((\\)\\)*\$q3)/ig,argIndex:2,argKey:"Q3"},{regex:/((^|[^\\])((\\)\\)*\$unformattedQ3)/ig,argIndex:2,argKey:"unformattedQ3"},{regex:/((^|[^\\])((\\)\\)*\$median)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$median))/ig,
argIndex:2,argKey:"median"},{regex:/((^|[^\\])((\\)\\)*\$unformattedMedian)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$unformattedMedian))/ig,argIndex:2,argKey:"unformattedMedian"},{regex:/((^|[^\\])((\\)\\)*\$SD)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$SD))/ig,argIndex:2,argKey:"SD"},{regex:/((^|[^\\])((\\)\\)*\$unformattedsd)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$unformattedsd))/ig,argIndex:2,argKey:"unformattedsd"},{regex:/((^|[^\\])((\\)\\)*\$QD)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$QD))/ig,
argIndex:2,argKey:"QD"},{regex:/((^|[^\\])((\\)\\)*\$unformattedQD)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$unformattedQD))/ig,argIndex:2,argKey:"unformattedQD"},{regex:/((^|[^\\])((\\)\\)*\$MD)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$MD))/ig,argIndex:2,argKey:"MD"},{regex:/((^|[^\\])((\\)\\)*\$unformattedMD)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$unformattedMD))/ig,argIndex:2,argKey:"unformattedMD"},{regex:/((^|[^\\])((\\)\\)*\$mean)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$mean))/ig,argIndex:2,
argKey:"mean"},{regex:/((^|[^\\])((\\)\\)*\$unformattedMean)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$unformattedMean))/ig,argIndex:2,argKey:"unformattedMean"},{regex:/((^|[^\\])((\\)\\)*\$unformattedMean)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$unformattedMean))/ig,argIndex:2,argKey:"unformattedMean"},{regex:/((^|[^\\])((\\)\\)*\$volumeValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$volumeValue))/ig,argIndex:2,argKey:"volumeValue"},{regex:/((^|[^\\])((\\)\\)*\$volumeDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$volumeDataValue))/ig,
argIndex:2,argKey:"volumeDataValue"},{regex:/((^|[^\\])((\\)\\)*\$fromXValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromXValue))/ig,argIndex:2,argKey:"fromXValue"},{regex:/((^|[^\\])((\\)\\)*\$fromYValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromYValue))/ig,argIndex:2,argKey:"fromYValue"},{regex:/((^|[^\\])((\\)\\)*\$fromXDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromXDataValue))/ig,argIndex:2,argKey:"fromXDataValue"},{regex:/((^|[^\\])((\\)\\)*\$fromYDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromYDataValue))/ig,
argIndex:2,argKey:"fromYDataValue"},{regex:/((^|[^\\])((\\)\\)*\$fromLabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$fromLabel))/ig,argIndex:2,argKey:"fromLabel"},{regex:/((^|[^\\])((\\)\\)*\$toXValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toXValue))/ig,argIndex:2,argKey:"toXValue"},{regex:/((^|[^\\])((\\)\\)*\$toYValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toYValue))/ig,argIndex:2,argKey:"toYValue"},{regex:/((^|[^\\])((\\)\\)*\$toXDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toXDataValue))/ig,
argIndex:2,argKey:"toXDataValue"},{regex:/((^|[^\\])((\\)\\)*\$toYDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$toYDataValue))/ig,argIndex:2,argKey:"toYDataValue"},{regex:/((^|[^\\])((\\)\\)*\$tolabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$tolabel))/ig,argIndex:2,argKey:"toLabel"},{regex:/((^|[^\\])((\\)\\)*\$tlLabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$tlLabel))/ig,argIndex:5,argKey:"tlLabel"},{regex:/((^|[^\\])((\\)\\)*\$trlabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$trlabel))/ig,argIndex:5,
argKey:"trLabel"},{regex:/((^|[^\\])((\\)\\)*\$bllabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$bllabel))/ig,argIndex:5,argKey:"blLabel"},{regex:/((^|[^\\])((\\)\\)*\$brlabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$brlabel))/ig,argIndex:5,argKey:"brLabel"},{regex:/((^|[^\\])((\\)\\)*\$rowlabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$rowlabel))/ig,argIndex:5,argKey:"rowLabel"},{regex:/((^|[^\\])((\\)\\)*\$columnlabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$columnlabel))/ig,argIndex:5,argKey:"columnLabel"},
{regex:/((^|[^\\])((\\)\\)*\$errorvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$errorvalue))/ig,argIndex:2,argKey:"errorValue"},{regex:/((^|[^\\])((\\)\\)*\$errordatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$errordatavalue))/ig,argIndex:2,argKey:"errorDataValue"},{regex:/((^|[^\\])((\\)\\)*\$errorpercentvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$errorpercentvalue))/ig,argIndex:2,argKey:"errorPercentValue"},{regex:/((^|[^\\])((\\)\\)*\$errorpercentdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$errorpercentdatavalue))/ig,
argIndex:2,argKey:"errorPercentDataValue"},{regex:/((^|[^\\])((\\)\\)*\$horizontalErrorValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$horizontalErrorValue))/ig,argIndex:2,argKey:"horizontalErrorValue"},{regex:/((^|[^\\])((\\)\\)*\$horizontalErrorDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$horizontalErrorDataValue))/ig,argIndex:2,argKey:"horizontalErrorDataValue"},{regex:/((^|[^\\])((\\)\\)*\$verticalErrorValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$verticalErrorValue))/ig,argIndex:2,argKey:"verticalErrorValue"},
{regex:/((^|[^\\])((\\)\\)*\$verticalErrorDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$verticalErrorDataValue))/ig,argIndex:2,argKey:"verticalErrorDataValue"},{regex:/((^|[^\\])((\\)\\)*\$horizontalErrorPercent)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$horizontalErrorPercentValue))/ig,argIndex:2,argKey:"horizontalErrorPercentValue"},{regex:/((^|[^\\])((\\)\\)*\$horizontalErrorPercentDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$horizontalErrorPercentDataValue))/ig,argIndex:2,argKey:"horizontalErrorPercentDataValue"},
{regex:/((^|[^\\])((\\)\\)*\$verticalErrorPercent)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$verticalErrorPercentValue))/ig,argIndex:2,argKey:"verticalErrorPercentValue"},{regex:/((^|[^\\])((\\)\\)*\$verticalErrorPercentDataValue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$verticalErrorPercentDataValue))/ig,argIndex:2,argKey:"verticalErrorPercentDataValue"},{regex:/((^|[^\\])((\\)\\)*\$xaxispercentvalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$xaxispercentvalue))/ig,argIndex:2,argKey:"xAxisPercentValue"},
{regex:/((^|[^\\])((\\)\\)*\$percentdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$percentdatavalue))/ig,argIndex:2,argKey:"percentDataValue"},{regex:/((^|[^\\])((\\)\\)*\$trType)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$trType))/ig,argIndex:4,argKey:"trtype"},{regex:/((^|[^\\])((\\)\\)*\$tlType)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$tlType))/ig,argIndex:4,argKey:"tltype"},{regex:/((^|[^\\])((\\)\\)*\$brType)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$brType))/ig,argIndex:4,argKey:"brtype"},{regex:/((^|[^\\])((\\)\\)*\$blType)/ig,
escapeRegex:/((^|[^\\])((\\)\\)*\\(\$blType))/ig,argIndex:4,argKey:"bltype"},{regex:/((^|[^\\])((\\)\\)*\$colorRangeLabel)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$colorRangeLabel))/ig,argIndex:5,argKey:"colorRangeLabel"},{regex:/((^|[^\\])((\\)\\)*\$zdatavalue)/ig,escapeRegex:/((^|[^\\])((\\)\\)*\\(\$zdatavalue))/ig,argIndex:2,argKey:"zDataValue"}],c=[],b,k=a.length;for(b=0;b<k;b+=1)c.push(b);return function(){var b=arguments[0],k=arguments[1],e,d,q,g,O;G(k)||(k=c);if(b)for(O=k.length,g=0;g<O;g+=
1)if(q=a[k[g]])e=ka(xa((d=arguments[q.argIndex])&&d[q.argKey],"")+""),b=b.replace(q.regex,"$2$4"+(q.parsingMethod?q.parsingMethod(e):e)),b=b.replace(q.escapeRegex,"$2$4$5");return b}}();d.core._setLineHeightFactor=function(a){!(a=c(a))||0>a||(X.lineHeightFactor=a)};d.extend(X,{BLANKSTRINGPLACEHOLDER:"#BLANK#",BLANKSTRING:"",COLOR_BLACK:"000000",COLOR_GLASS:"rgba(255, 255, 255, 0.3)",COLOR_WHITE:"FFFFFF",COLOR_TRANSPARENT:"rgba(0,0,0,0)",HASHSTRING:"#",BREAKSTRING:"<br />",STRINGSTRING:"string",OBJECTSTRING:"object",
COMMASTRING:",",ZEROSTRING:"0",SAMPLESTRING:"Ay0",TESTSTR:"Ag",ONESTRING:"1",DECIMALSTRING:".",STRINGUNDEFINED:"undefined",POSITION_TOP:"top",POSITION_RIGHT:"right",POSITION_BOTTOM:"bottom",POSITION_LEFT:"left",POSITION_CENTER:"center",POSITION_MIDDLE:"middle",POSITION_START:"start",POSITION_END:"end",FC_CONFIG_STRING:"_FCconf",SHAPE_RECT:"rect",HUNDREDSTRING:"100",PXSTRING:"px",COMMASPACE:", ",TEXTANCHOR:"text-anchor",TOUCH_THRESHOLD_PIXELS:15,CLICK_THRESHOLD_PIXELS:5,regex:{stripWhitespace:I,dropHash:b,
startsRGBA:P,cleanColorCode:a,breakPlaceholder:w,hexcode:/^#?[0-9a-f]{6}/i},fireEvent:function(a,c,b,k){X.dem.fire(a,c,b,k)},plotEventHandler:function(a,c,b){c=c||{};var k=c.type,e=H(a.container,c),e=La(e,this.data("eventArgs")),q=a.logic.fireGroupEvent,g=this.data("groupId"),l=function(a,b){c.FusionChartsPreventEvent=!0;p&&b.toolText&&X.toolTip&&X.toolTip.preventTooltip()};"index"in e&&!("dataIndex"in e)&&(e.dataIndex=e.index);"value"in e&&!("dataValue"in e)&&(e.dataValue=e.value);b=Y(b,"dataplotclick").toLowerCase();
"dataplotrollover"===b?(c.FusionChartsPreventEvent=!1,q?d.raiseEventGroup(g,b,e,a.fusionCharts,void 0,void 0,l):d.raiseEvent(b,e,a.logic.chartInstance,void 0,void 0,l)):q&&"dataplotclick"!==b?d.raiseEventGroup(g,b,e,a.fusionCharts):d.raiseEvent(b,e,a.logic.chartInstance);"click"!==k&&"mouseup"!==k&&"touchend"!==k||"dataplotclick"!==b||a.linkClickFN.call({link:e.link},a)},getEventCoordinate:oa,getMouseCoordinate:H,addEvent:ua,removeEvent:ba,getTouchEvent:da,extend2:La,deltend:function(a,c){if("object"!==
typeof a||"object"!==typeof c)return null;Ca(a,c);return a},imprint:function(a,c,b){var k;if("object"!==typeof a||null===a)return c;if("object"!==typeof c||null===c)return a;for(k in c)if(void 0===a[k]||!b&&null===a[k])a[k]=c[k];return a},pluck:Y,pluckNumber:T,getFirstDefinedValue:function(){var a,c,b;c=0;for(b=arguments.length;c<b;c+=1)if((a=arguments[c])||!1===a||0===a||""==a)return a},createElement:function(a,c,b){a=D.createElement(a);for(var k in c)a.setAttribute(k,c[k]);b&&b.appendChild&&b.appendChild(a);
return a},hashify:M,pluckFontSize:function(){var a,c,b;c=0;for(b=arguments.length;c<b;c+=1)if(((a=arguments[c])||!1===a||0===a)&&!isNaN(a=Number(a)))return 1>a?1:a;return 1},getValidValue:xa,getPosition:U,getViewPortDimension:E,bindSelectionEvent:function(a,c){c=c||{};var b=a.options.chart,k=a.container,e=b.zoomType,d=La({},c.attr||{}),q=d["stroke-width"]=T(d.strokeWidth,d["stroke-width"],1),g=U(k),l=a.eventListeners||(a.eventListeners=[]);c=La({chart:a,zoomX:/x/.test(e),zoomY:/y/.test(e),canvasY:a.canvasTop,
canvasX:a.canvasLeft,canvasW:a.canvasWidth,canvasH:a.canvasHeight,canvasX2:a.canvasLeft+a.canvasWidth,canvasY2:a.canvasTop+a.canvasHeight,strokeWidth:q,chartPosLeft:g.left,chartPosTop:g.top,attr:d},c);d.stroke=ea(d.stroke,"rgba(51,153,255,0.8)");d.fill=ea(d.fill,"rgba(185,213,241,0.3)");d.ishot=!0;k&&(ba(k,"pointerdrag",u),l.push(ua(k,"pointerdrag",u,c)));b.link&&(ba(a.container,"mouseup mousedown",ga),l.push(ua(a.container,"mouseup mousedown",ga,c)))},createContextMenu:function(a){var c=a.chart,
b=c.smartLabel,k=c.logic.hcJSON&&c.logic.hcJSON.chart.useRoundEdges,e=X.Raphael,d=function(a){var c=a.menufillcolor&&M(a.menufillcolor),b=a.menulabelcolor&&M(a.menulabelcolor),v=a.menufillhovercolor&&M(a.menufillhovercolor);a=a.menulabelhovercolor&&M(a.menulabelhovercolor);return{attrs:{backgroundColor:c,color:b},hover:{backgroundColor:v,color:a}}}(c.definition.chart),q=function(a,c,b){c=c||{};a=(a=(a=a&&e.tintshade(a.color,.7))&&e.getRGB(a))&&"rgb("+[a.r,a.g,a.b].join()+")";return{backgroundColor:c.backgroundHoverColor||
b.backgroundColor||a||"rgb(64, 64, 64)",color:c.hoverColor||b.color||"#FFFFFF"}}(a.basicStyle,a.hover,d.hover),g=function(a,c,b){c=La({},c||{});c=La(c,a);return{fontFamily:c.fontFamily||"Verdana,sans",fontSize:c.fontSize||"10px",color:c.color||b.color||"#000000",backgroundColor:c.backgroundColor||b.backgroundColor||"rgb(255, 255, 255)"}}(a.basicStyle,a.attrs,d.attrs),l={textAlign:"left",align:"left",paddingLeft:"5px",paddingRight:"5px",paddingTop:"5px",cursor:"pointer",borderWidth:"0px"},m=a.items,
J=a.position,t=a.verticalPadding||3,H=a.horizontalPadding||6,G={},u,W,h,B,w,E,V,ea,N,T,Y,ja,F;if(c)u=U(c.container);else return!1;B=function(){var a=G.items,c=a.length,r=0,v=0,C=0,K,f;G.menuItems||(G.menuItems=[]);for(b.setStyle(g);c--;)K=a[c],K=b.getOriSize(K.text),C||(C=K.height+2*t),r+=C,v=n(v,K.width+2*H);G.height=r;G.width=v;G.itemH=C;this.style.width=v+"px";G.menuRect||(r=G.menuRect=D.createElement("div"),r.style.border="1px solid rgb(100, 100, 100)",k&&(r.style.mozBorderRadius="4px",r.style.webkitBorderRadius=
"4px",r.style.borderRadius="4px",r.style.overflow="hidden"),p&&!z?r.style.filter="progid:DXImageTransform.Microsoft.Shadow(Color=#999999,direction=135,strength=3)":(r.style.mozBoxShadow="3px 3px 3px #999",r.style.webkitBoxShadow="3px 3px 3px #999",r.style.boxShadow="3px 3px 3px #999"),this.appendChild(r));v=a.length;for(c=0;c<v;c+=1)if(K=a[c],G.menuItems[c])G.menuItems[c].label.innerHTML=K.text;else{G.menuItems[c]={};r=G.menuItems[c].box=D.createElement("div");r.style.height=C+"px";r.style.lineHeight=
C+"px";for(f in l)r.style[f]=l[f];for(f in g)r.style[f]=g[f];G.menuRect.appendChild(r);r.innerHTML=K.text;X.dem.listen(r,"click",F);X.dem.listen(r,"pointerhover",T);G.menuItems[c].box._itemIdx=c}for(;G.menuItems[c];)G.menuItems[c].box.parentNode.removeChild(G.menuItems[c].box),G.menuItems.splice(c,1)};w=function(){h||(h=D.createElement("div"),h.style.position="absolute",h.style.zIndex="50",h.style.display="none",c.container.appendChild&&c.container.appendChild(h));return h};E=function(){W=setTimeout(G.hide,
800)};V=function(){W&&clearTimeout(W)};ea=function(a){var b=a.x;a=a.y;var r={x:b,y:a},v=G.width,C=G.height,K=c.chartHeight,f=c.chartWidth;b+v>f&&0<b-v?r.x-=v:b+v>f&&(r.x=0);a+C>K&&0<a-C&&(r.y-=C);return r};N=function(){G.hide()};T=function(a){a.target&&a.target.parentNode&&("start"===a.state?Y:ja).call(a.target)};Y=function(){var a=G.menuItems[this._itemIdx],c;V();for(c in q)a.box.style[c]=q[c]};ja=function(){var a=G.menuItems[this._itemIdx],c;for(c in g)a.box.style[c]=g[c];E()};F=function(a){var c=
G.items[this._itemIdx];c.onclick&&c.onclick.call(c,a);a.originalEvent.stopPropagation?a.originalEvent.stopPropagation():a.originalEvent.cancelBubble=!0;G.hide()};G.showItem=function(a){a=this.menuItems[a];var c=this.height,b=this.itemH;a&&a._isHidden&&(a.box.style.display="",this.height=c+b,a._isHidden=!1,a=ea(J),this.left=a.x,this.top=a.y)};G.hideItem=function(a){a=this.menuItems[a];var c=this.height,b=this.itemH;a&&!a._isHidden&&(a.box.style.display="none",this.height=c-b,a._isHidden=!0,a=ea(J),
this.left=a.x,this.top=a.y)};G.redraw=function(){var a=this.menuContainer;this.items=m;a?B.call(this.menuContainer):J&&void 0!==J.x&&void 0!==J.y?(this.menuContainer=w(),B.call(this.menuContainer),a=ea(J),this.left=a.x,this.top=a.y,this.menuContainer.style.left=this.left+"px",this.menuContainer.style.top=this.top+"px"):(this.menuContainer=w(),B.call(this.menuContainer))};G.show=function(a){var c=this;a&&void 0!==a.x&&void 0!==a.y?(a=ea(a),c.menuContainer.style.left=a.x+"px",c.menuContainer.style.top=
a.y+"px"):(c.menuContainer.style.left=c.left+"px",c.menuContainer.style.top=c.top+"px");c.menuContainer.style.display="";setTimeout(function(){c.visible=!0;e.click(N)},400)};G.hide=function(){this.visible&&(this.visible=!1,G.menuContainer.style.display="none",G.menuContainer.style.left=-G.width+"px",G.menuContainer.style.top=-G.height+"px",e.unclick(N))};G.update=function(a){a&&a.length&&(this.items=a,this.redraw())};G.updatePosition=function(a){var b=u.left,r=u.top;u=U(c.container);a?(J=a,a=ea(a),
this.left=a.x,this.top=a.y):(this.left-=b-u.left,this.top-=r-u.top)};G.add=function(a){var c=this.menuItems,r=c.length,v;b.setStyle(g);this.width=n(this.width,b.getOriSize(a.text).width);c[r]={};c=c[r].box=D.createElement("div");c.style.height=this.itemH+"px";c.style.lineHeight=this.itemH+"px";for(v in l)c.style[v]=l[v];for(v in g)c.style[v]=g[v];G.menuRect.appendChild(c);c.innerHTML=a.text;X.dem.listen(c,"click",F);X.dem.listen(c,"pointerhover",T);G.menuItems[r].box._itemIdx=r;this.height+=this.itemH};
G.removeItems=function(){for(var a=this.menuItems,c=a&&a.length,b;c--;)b=a[c],X.dem.unlisten(b.box,"click",F),X.dem.unlisten(b.box,"pointerhover",T),b.box&&b.box.parentNode&&b.box.parentNode.removeChild(b.box);delete this.menuItems;delete this.items};G.setPosition=function(a){void 0!==a.x&&void 0!==a.y&&(this.menuContainer.style.x=a.x,this.menuContainer.style.y=a.y)};G.destroy=function(){this.removeItems();this.menuContainer.parentNode.removeChild(this.menuContainer)};m&&m.length&&(G.redraw(),G.hide());
return G},getDefinedColor:function(a,c){return a||0===a||""===a?a:c},getFirstValue:ea,getFirstColor:function(a){a=a.split(",")[0];a=a.replace(I,"");""==a&&(a="000000");return a.replace(b,"#")},getColorCodeString:function(a,c){var b="",k,e,d=0,q=c.split(",");for(e=q.length;d<e;d+=1)k=q[d].split("-"),b=2===k.length?"-1"!==k[0].indexOf("dark")?b+(Za(a,100-parseInt(k[1],10))+","):b+(Fa(a,100-parseInt(k[1],10))+","):b+(q[d]+",");return b.substring(0,b.length-1)},pluckColor:function(a){if(xa(a))return a=
a.split(",")[0],a=a.replace(I,""),""==a&&(a="000000"),a.replace(b,"#")},toRaphaelColor:Ma,gradientify:Ha,trimString:function(a){a=a.replace(/^\s\s*/,"");for(var c=/\s/,b=a.length;c.test(a.charAt(b-=1)););return a.slice(0,b+1)},getFirstAlpha:function(a){a=parseInt(a,10);if(isNaN(a)||100<a||0>a)a=100;return a},parsePointValue:q,parseUnsafeString:J,parseTooltext:k,toPrecision:function(a,c){var b=B(10,c);return g(a*b)/b},hasTouch:m,CREDIT_HREF:N,CREDIT_STRING:"FusionCharts XT Trial",getSentenceCase:function(a){a=
a||"";return a.charAt(0).toUpperCase()+a.substr(1)},getCrispValues:function(a,c,b){var k=b%2/2;b=g(a+k)-k;a=g(a+c+k)-k-b;return{position:b,distance:a}},regescape:function(a){return a&&a.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")},regReplaceEscape:ka,isArray:G,stubFN:function(){},falseFN:function(){return!1},stableSort:function(a,c){var b=a.length,k;for(k=0;k<b;k++)a[k].ssI=k;a.sort(function(a,b){var k=c(a,b);return 0===k?a.ssI-b.ssI:k});for(k=0;k<b;k++)delete a[k].ssI},hasSVG:z,isIE:p,lineHeightFactor:1.2,
getLinkAction:function(a,c){var b=function(a){return a};return function(){var k=T((a.chart||a.map||{}).unescapelinks,1),e=ea(this.link,""),q=Y(e,this.options&&this.options.chart&&this.options.chart.link||"",this.series&&this.series.chart&&this.series.chart.options&&this.series.chart.options.chart&&this.series.chart.options.chart.link||""),g=q,l,n,J,m,G,t,H,u,p,W;void 0!==q&&(k&&(q=h.decodeURIComponent?h.decodeURIComponent(q):h.unescape(q)),q=q.replace(/^\s+/,"").replace(/\s+$/,""),-1!==q.search(/^[a-z]*\s*[\-\:]\s*/i)&&
(G=q.split(/\s*[\-\:]\s*/)[0].toLowerCase(),W=G.length),setTimeout(function(){switch(G){case "j":q=q.replace(/^j\s*\-/i,"j-");l=q.indexOf("-",2);-1===l?na(q.slice(2)):na(q.substr(2,l-2).replace(/\s/g,""),q.slice(l+1));break;case "javascript":pa(q.replace(/^javascript\s*\:/i,""));break;case "n":q.replace(/^n\s*\-/i,"n-");h.open(b(q.slice(2),k));break;case "f":q=q.replace(/^f\s*\-/i,"f-");l=q.indexOf("-",2);-1!==l?(n=q.substr(2,l-2))&&h.frames[n]?h.frames[n].location=b(q.slice(l+1),k):h.open(b(q.slice(l+
1),k),n):h.open(b(q.slice(2),k));break;case "p":q=q.replace(/p\s*\-/i,"p-");l=q.indexOf("-",2);J=q.indexOf(",",2);-1===l&&(l=1);m=b(q.slice(l+1),k);h.open(m,q.substr(2,J-2),q.substr(J+1,l-J-1)).focus();break;case "newchart":case "newmap":":"===q.charAt(W)&&(l=q.indexOf("-",W+1),p=q.substring(W+1,l),W=l);l=q.indexOf("-",W+1);t=q.substring(W+1,l).toLowerCase();switch(t){case "xmlurl":case "jsonurl":u=q.substring(l+1,q.length);break;case "xml":case "json":var e=H=q.substring(l+1,q.length),B={chart:{}},
w,e=e.toLowerCase();if(a.linkeddata)for(w=0;w<a.linkeddata.length;w+=1)a.linkeddata[w].id.toLowerCase()===e&&(B=a.linkeddata[w].linkedchart||a.linkeddata[w].linkedmap);u=B;t="json"}d.raiseEvent("linkedChartInvoked",{alias:p,linkType:t.toUpperCase(),data:u},c);break;default:h.location.href=q}d.raiseEvent("linkClicked",{linkProvided:g,linkInvoked:q,linkAction:G&&G.toLowerCase()},c)},0))}},graphics:{parseAlpha:aa,convertColor:Z,getDarkColor:Fa,getLightColor:Za,mapSymbolName:function(a,c){var b="circle";
a=q(a);3<=a&&(b=(c?"spoke_":"poly_")+a);return b},getColumnColor:function(a,c,b,k,e,d,q,g,l){var n,J;n=a.split(",");J=c.split(",");d=d.split(",");q=q.split(",");a=a.replace(/\s/g,"").replace(/\,$/,"");l?g={FCcolor:{color:n[0],alpha:J[0]}}:e?(a=n[0],J=J[0],g={FCcolor:{color:Fa(a,75)+","+Za(a,10)+","+Fa(a,90)+","+Za(a,55)+","+Fa(a,80),alpha:J+","+J+","+J+","+J+","+J,ratio:"0,11,14,57,18",angle:g?"90":"0"}},d=[Fa(a,70)]):(c=aa(c,n.length),g={FCcolor:{color:a,alpha:c,ratio:b,angle:g?-k:k}});return[g,
{FCcolor:{color:d[0],alpha:q[0]}}]},getAngle:function(a,c,b){a=180*Math.atan(c/a)/Math.PI;2==b?a=180-a:3==b?a+=180:4==b&&(a=360-a);return a},parseColor:hb,getValidColor:function(a){return F.test(hb(a))&&a},HSBtoRGB:function(a){var c=a[0],b=0,k=0,e=0,d=[],d=a[1]/100;a=a[2]/100;var q=c/60-Math.floor(c/60),l=a*(1-d),n=a*(1-q*d),d=a*(1-(1-q)*d);switch(Math.floor(c/60)%6){case 0:b=a;k=d;e=l;break;case 1:b=n;k=a;e=l;break;case 2:b=l;k=a;e=d;break;case 3:b=l;k=n;e=a;break;case 4:b=d;k=l;e=a;break;case 5:b=
a,k=l,e=n}return d=[g(255*b),g(255*k),g(255*e)]},RGBtoHSB:function(a){var c=a[0],b=a[1];a=a[2];var k=Math.max(Math.max(c,b),a),e=Math.min(Math.min(c,b),a),d=0,q=0;k==e?d=0:k==c?d=(60*(b-a)/(k-e)+360)%360:k==b?d=60*(a-c)/(k-e)+120:k==a&&(d=60*(c-b)/(k-e)+240);q=0===k?0:(k-e)/k;return[g(d),g(100*q),g(k/255*100)]},RGBtoHex:function(a){return("000000"+(a[0]<<16|a[1]<<8|a[2]).toString(16)).slice(-6)},HEXtoRGB:Da},setImageDisplayMode:function(a,c,b,k,e,d,q,g){var l=k/100*g.width;k=k/100*g.height;g={};var n,
J=d-2*e;n=q-2*e;var m=function(a,c,b,k,d,q){var g={};switch(a){case "top":g.y=e;break;case "bottom":g.y=q-k-e;break;case "middle":g.y=(q-k)/2}switch(c){case "left":g.x=e;break;case "right":g.x=d-b-e;break;case "middle":g.x=(d-b)/2}return g};switch(a){case "center":g.width=l;g.height=k;g.y=q/2-k/2;g.x=d/2-l/2;break;case "stretch":g.width=d-2*e;g.height=q-2*e;g.y=e;g.x=e;break;case "tile":g.width=l;g.height=k;g.tileInfo={};g.tileInfo.xCount=a=Math.ceil(J/l);g.tileInfo.yCount=n=Math.ceil(n/k);c=m(c,
b,l*a,k*n,d,q);g.y=c.y;g.x=c.x;break;case "fit":a=l/k>J/n?J/l:n/k;g.width=l*a;g.height=k*a;c=m(c,b,g.width,g.height,d,q);g.y=c.y;g.x=c.x;break;case "fill":a=l/k>J/n?n/k:J/l;g.width=l*a;g.height=k*a;c=m(c,b,g.width,g.height,d,q);g.y=c.y;g.x=c.x;break;default:c=m(c,b,l,k,d,q),g.width=l,g.height=k,g.y=c.y,g.x=c.x}return g},setLineHeight:$a,parsexAxisStyles:Na,supportedStyle:{font:"font",fontFamily:"font-family","font-family":"font-family",fontWeight:"font-weight","font-weight":"font-weight",fontSize:"font-size",
"font-size":"font-size",lineHeight:"line-height","line-height":"line-height",textDecoration:"text-decoration","text-decoration":"text-decoration",color:"color",whiteSpace:"white-space","white-space":"white-space",padding:"padding",margin:"margin",background:"background",backgroundColor:"background-color","background-color":"background-color",backgroundImage:"background-image","background-image":"background-image",backgroundPosition:"background-position","background-position":"background-position",
backgroundPositionLeft:"background-position-left","background-position-left":"background-position-left",backgroundPositionTop:"background-position-top","background-position-top":"background-position-top",backgroundRepeat:"background-repeat","background-repeat":"background-repeat",border:"border",borderColor:"border-color","border-color":"border-color",borderStyle:"border-style","border-style":"border-style",borderThickness:"border-thickness","border-thickness":"border-thickness",borderTop:"border-top",
"border-top":"border-top",borderTopColor:"border-top-color","border-top-color":"border-top-color",borderTopStyle:"border-top-style","border-top-style":"border-top-style",borderTopThickness:"border-top-thickness","border-top-thickness":"border-top-thickness",borderRight:"border-right","border-right":"border-right",borderRightColor:"border-right-color","border-right-color":"border-right-color",borderRightStyle:"border-right-style","border-right-style":"border-right-style",borderRightThickness:"border-right-thickness",
"border-right-thickness":"border-right-thickness",borderBottom:"border-bottom","border-bottom":"border-bottom",borderBottomColor:"border-bottom-color","border-bottom-color":"border-bottom-color",borderBottomStyle:"border-bottom-style","border-bottom-style":"border-bottom-style",borderBottomThickness:"border-bottom-thickness","border-bottom-thickness":"border-bottom-thickness",borderLeft:"border-left","border-left":"border-left",borderLeftColor:"border-left-color","border-left-color":"border-left-color",
borderLeftStyle:"border-left-style","border-left-Style":"border-left-style",borderLeftThickness:"border-left-thickness","border-left-thickness":"border-left-thickness"},getAxisLimits:Cb,createTrendLine:ub,getDashStyle:Wa,axisLabelAdder:Ba,chartAPI:Ua,createDialog:Jb,isCanvasElemSupported:function(){var a=D.createElement("canvas");return!(!a.getContext||!a.getContext("2d"))}})}]);
window.FusionCharts&&window.FusionCharts.register("module",["private","vendor.redraphael",function(){var d=this.hcLib,h=window.Raphael,D;(function(){(function(d,p){var c=/[\.\/]/,h=function(){},b=function(a,c){return a-c},P,a,w={n:{}},F=function(c,d){c=String(c);var g=a,e=Array.prototype.slice.call(arguments,2),l=F.listeners(c),m=0,p,h=[],n={},w=[],t=P;P=c;for(var z=a=0,u=l.length;z<u;z++)"zIndex"in l[z]&&(h.push(l[z].zIndex),0>l[z].zIndex&&(n[l[z].zIndex]=l[z]));for(h.sort(b);0>h[m];)if(p=n[h[m++]],
w.push(p.apply(d,e)),a)return a=g,w;for(z=0;z<u;z++)if(p=l[z],"zIndex"in p)if(p.zIndex==h[m]){w.push(p.apply(d,e));if(a)break;do if(m++,(p=n[h[m]])&&w.push(p.apply(d,e)),a)break;while(p)}else n[p.zIndex]=p;else if(w.push(p.apply(d,e)),a)break;a=g;P=t;return w.length?w:null};F._events=w;F.listeners=function(a){a=a.split(c);var b=w,d,e,l,m,p,h,n,V=[b],t=[];l=0;for(m=a.length;l<m;l++){n=[];p=0;for(h=V.length;p<h;p++)for(b=V[p].n,d=[b[a[l]],b["*"]],e=2;e--;)if(b=d[e])n.push(b),t=t.concat(b.f||[]);V=n}return t};
F.on=function(a,b){a=String(a);if("function"!=typeof b)return function(){};for(var d=a.split(c),e=w,l=0,m=d.length;l<m;l++)e=e.n,e=e.hasOwnProperty(d[l])&&e[d[l]]||(e[d[l]]={n:{}});e.f=e.f||[];l=0;for(m=e.f.length;l<m;l++)if(e.f[l]==b)return h;e.f.push(b);return function(a){+a==+a&&(b.zIndex=+a)}};F.f=function(a){var c=[].slice.call(arguments,1);return function(){F.apply(null,[a,null].concat(c).concat([].slice.call(arguments,0)))}};F.stop=function(){a=1};F.nt=function(a){return a?(new RegExp("(?:\\.|\\/|^)"+
a+"(?:\\.|\\/|$)")).test(P):P};F.nts=function(){return P.split(c)};F.off=F.unbind=function(a,b){if(a){var d=a.split(c),e,l,m,p,h,n,V=[w];p=0;for(h=d.length;p<h;p++)for(n=0;n<V.length;n+=m.length-2){m=[n,1];e=V[n].n;if("*"!=d[p])e[d[p]]&&m.push(e[d[p]]);else for(l in e)e.hasOwnProperty(l)&&m.push(e[l]);V.splice.apply(V,m)}p=0;for(h=V.length;p<h;p++)for(e=V[p];e.n;){if(b){if(e.f){n=0;for(d=e.f.length;n<d;n++)if(e.f[n]==b){e.f.splice(n,1);break}!e.f.length&&delete e.f}for(l in e.n)if(e.n.hasOwnProperty(l)&&
e.n[l].f){m=e.n[l].f;n=0;for(d=m.length;n<d;n++)if(m[n]==b){m.splice(n,1);break}!m.length&&delete e.n[l].f}}else for(l in delete e.f,e.n)e.n.hasOwnProperty(l)&&e.n[l].f&&delete e.n[l].f;e=e.n}}else F._events=w={n:{}}};F.once=function(a,c){var b=function(){F.unbind(a,b);return c.apply(this,arguments)};return F.on(a,b)};F.version="0.4.2";F.toString=function(){return"You are running Eve 0.4.2"};"undefined"!=typeof module&&module.exports?module.exports=F:p||"undefined"==typeof define?d.eve=F:define("eve",
[],function(){return F})})(this,!0);(function(d,p,c){!c&&"function"===typeof define&&define.amd?define(["eve"],function(c){return p(d,c)}):p(d,d.eve)})(this,function(d,p){function c(a){var b,r;c._url="";if(c.is(a,"function"))return m?a():p.on("raphael.DOMload",a);if(c.is(a,n))return c._engine.create[N](c,a.splice(0,3+c.is(a[0],E))).add(a);b=Array.prototype.slice.call(arguments,0);return c.is(b[b.length-1],"function")?(r=b.pop(),m?r.call(c._engine.create[N](c,b)):p.on("raphael.DOMload",function(){r.call(c._engine.create[N](c,
b))})):c._engine.create[N](c,arguments)}function h(){return this.hex}function b(a,c){for(var b=[],r=0,f=a.length;f-2*!c>r;r+=2){var v=[{x:+a[r-2],y:+a[r-1]},{x:+a[r],y:+a[r+1]},{x:+a[r+2],y:+a[r+3]},{x:+a[r+4],y:+a[r+5]}];c?r?f-4==r?v[3]={x:+a[0],y:+a[1]}:f-2==r&&(v[2]={x:+a[0],y:+a[1]},v[3]={x:+a[2],y:+a[3]}):v[0]={x:+a[f-2],y:+a[f-1]}:f-4==r?v[3]=v[2]:r||(v[0]={x:+a[r],y:+a[r+1]});b.push(["C",(-v[0].x+6*v[1].x+v[2].x)/6,(-v[0].y+6*v[1].y+v[2].y)/6,(v[1].x+6*v[2].x-v[3].x)/6,(v[1].y+6*v[2].y-v[3].y)/
6,v[2].x,v[2].y])}return b}function P(a,c,b,r,f,v,k,C,K){null==K&&(K=1);K=(1<K?1:0>K?0:K)/2;for(var e=[-.1252,.1252,-.3678,.3678,-.5873,.5873,-.7699,.7699,-.9041,.9041,-.9816,.9816],d=[.2491,.2491,.2335,.2335,.2032,.2032,.1601,.1601,.1069,.1069,.0472,.0472],q=0,g=0;12>g;g++)var R=K*e[g]+K,l=R*(R*(-3*a+9*b-9*f+3*k)+6*a-12*b+6*f)-3*a+3*b,R=R*(R*(-3*c+9*r-9*v+3*C)+6*c-12*r+6*v)-3*c+3*r,q=q+d[g]*pa(l*l+R*R);return K*q}function a(a,c,b,r,f,v,k,C,K){if(!(0>K||P(a,c,b,r,f,v,k,C)<K)){var e=.5,d=1-e,q;for(q=
P(a,c,b,r,f,v,k,C,d);.01<ja(q-K);)e/=2,d+=(q<K?1:-1)*e,q=P(a,c,b,r,f,v,k,C,d);return d}}function w(a,b,r){a=c._path2curve(a);b=c._path2curve(b);for(var f,v,k,C,K,e,d,q,g,R,l=r?0:[],s=0,$=a.length;s<$;s++)if(g=a[s],"M"==g[0])f=K=g[1],v=e=g[2];else{"C"==g[0]?(g=[f,v].concat(g.slice(1)),f=g[6],v=g[7]):(g=[f,v,f,v,K,e,K,e],f=K,v=e);for(var n=0,J=b.length;n<J;n++)if(R=b[n],"M"==R[0])k=d=R[1],C=q=R[2];else{"C"==R[0]?(R=[k,C].concat(R.slice(1)),k=R[6],C=R[7]):(R=[k,C,k,C,d,q,d,q],k=d,C=q);var m;var fa=g,
A=R;m=r;var O=c.bezierBBox(fa),p=c.bezierBBox(A);if(c.isBBoxIntersect(O,p)){for(var O=P.apply(0,fa),p=P.apply(0,A),O=W(~~(O/5),1),p=W(~~(p/5),1),t=[],H=[],u={},lc=m?0:[],h=0;h<O+1;h++){var qb=c.findDotsAtSegment.apply(c,fa.concat(h/O));t.push({x:qb.x,y:qb.y,t:h/O})}for(h=0;h<p+1;h++)qb=c.findDotsAtSegment.apply(c,A.concat(h/p)),H.push({x:qb.x,y:qb.y,t:h/p});for(h=0;h<O;h++)for(fa=0;fa<p;fa++){var nb=t[h],wa=t[h+1],A=H[fa],qb=H[fa+1],w=.001>ja(wa.x-nb.x)?"y":"x",sa=.001>ja(qb.x-A.x)?"y":"x",Mb;Mb=
nb.x;var M=nb.y,bc=wa.x,kc=wa.y,B=A.x,ca=A.y,E=qb.x,V=qb.y;if(W(Mb,bc)<G(B,E)||G(Mb,bc)>W(B,E)||W(M,kc)<G(ca,V)||G(M,kc)>W(ca,V))Mb=void 0;else{var ea=(Mb*kc-M*bc)*(B-E)-(Mb-bc)*(B*V-ca*E),Ic=(Mb*kc-M*bc)*(ca-V)-(M-kc)*(B*V-ca*E),Q=(Mb-bc)*(ca-V)-(M-kc)*(B-E);if(Q){var ea=ea/Q,Ic=Ic/Q,Q=+ea.toFixed(2),T=+Ic.toFixed(2);Mb=Q<+G(Mb,bc).toFixed(2)||Q>+W(Mb,bc).toFixed(2)||Q<+G(B,E).toFixed(2)||Q>+W(B,E).toFixed(2)||T<+G(M,kc).toFixed(2)||T>+W(M,kc).toFixed(2)||T<+G(ca,V).toFixed(2)||T>+W(ca,V).toFixed(2)?
void 0:{x:ea,y:Ic}}else Mb=void 0}Mb&&u[Mb.x.toFixed(4)]!=Mb.y.toFixed(4)&&(u[Mb.x.toFixed(4)]=Mb.y.toFixed(4),nb=nb.t+ja((Mb[w]-nb[w])/(wa[w]-nb[w]))*(wa.t-nb.t),A=A.t+ja((Mb[sa]-A[sa])/(qb[sa]-A[sa]))*(qb.t-A.t),0<=nb&&1.001>=nb&&0<=A&&1.001>=A&&(m?lc++:lc.push({x:Mb.x,y:Mb.y,t1:G(nb,1),t2:G(A,1)})))}m=lc}else m=m?0:[];if(r)l+=m;else{O=0;for(p=m.length;O<p;O++)m[O].segment1=s,m[O].segment2=n,m[O].bez1=g,m[O].bez2=R;l=l.concat(m)}}}return l}function F(a,c,b,r,f,v){null!=a?(this.a=+a,this.b=+c,this.c=
+b,this.d=+r,this.e=+f,this.f=+v):(this.a=1,this.c=this.b=0,this.d=1,this.f=this.e=0)}function L(){return this.x+" "+this.y+" "+this.width+" × "+this.height}function B(a,c,b,r,f,v){function k(a,c){var b,Pa,r,f;r=a;for(Pa=0;8>Pa;Pa++){f=((e*r+K)*r+C)*r-a;if(ja(f)<c)return r;b=(3*e*r+2*K)*r+C;if(1E-6>ja(b))break;r-=f/b}b=0;Pa=1;r=a;if(r<b)return b;if(r>Pa)return Pa;for(;b<Pa;){f=((e*r+K)*r+C)*r;if(ja(f-a)<c)break;a>f?b=r:Pa=r;r=(Pa-b)/2+b}return r}var C=3*c,K=3*(r-c)-C,e=1-C-K,d=3*b,q=3*(f-b)-d,g=1-
d-q;return function(a,c){var b=k(a,c);return((g*b+q)*b+d)*b}(a,1/(200*v))}function g(a,c){var b=[],r={};this.ms=c;this.times=1;if(a){for(var f in a)a.hasOwnProperty(f)&&(r[T(f)]=a[f],b.push(T(f)));b.sort(s)}this.anim=r;this.top=b[b.length-1];this.percents=b}function e(a,b,r,f,v,C){r=T(r);var e,d,q,g,l,s,$=a.ms,n={},J={},m={};if(f)for(s=0,G=Ia.length;s<G;s++){var fa=Ia[s];if(fa.el.id==b.id&&fa.anim==a){fa.percent!=r?(Ia.splice(s,1),q=1):d=fa;b.attr(fa.totalOrigin);break}}else f=+J;s=0;for(var G=a.percents.length;s<
G;s++)if(a.percents[s]==r||a.percents[s]>f*a.top){r=a.percents[s];l=a.percents[s-1]||0;$=$/a.top*(r-l);g=a.percents[s+1];e=a.anim[r];break}else f&&b.attr(a.anim[a.percents[s]]);if(e){if(d)d.initstatus=f,d.start=new Date-d.ms*f;else{for(var A in e)if(e.hasOwnProperty(A)&&(k.hasOwnProperty(A)||b.ca[A]))switch(n[A]=b.attr(A),null==n[A]&&(n[A]=Ua[A]),J[A]=e[A],k[A]){case E:m[A]=(J[A]-n[A])/$;break;case "colour":n[A]=c.getRGB(n[A]);s=c.getRGB(J[A]);m[A]={r:(s.r-n[A].r)/$,g:(s.g-n[A].g)/$,b:(s.b-n[A].b)/
$};break;case "path":s=K(n[A],J[A]);fa=s[1];n[A]=s[0];m[A]=[];s=0;for(G=n[A].length;s<G;s++){m[A][s]=[0];for(var O=1,t=n[A][s].length;O<t;O++)m[A][s][O]=(fa[s][O]-n[A][s][O])/$}break;case "transform":s=b._;if(G=Mb(s[A],J[A]))for(n[A]=G.from,J[A]=G.to,m[A]=[],m[A].real=!0,s=0,G=n[A].length;s<G;s++)for(m[A][s]=[n[A][s][0]],O=1,t=n[A][s].length;O<t;O++)m[A][s][O]=(J[A][s][O]-n[A][s][O])/$;else G=b.matrix||new F,s={_:{transform:s.transform},getBBox:function(){return b.getBBox(1)}},n[A]=[G.a,G.b,G.c,G.d,
G.e,G.f],R(s,J[A]),J[A]=s._.transform,m[A]=[(s.matrix.a-G.a)/$,(s.matrix.b-G.b)/$,(s.matrix.c-G.c)/$,(s.matrix.d-G.d)/$,(s.matrix.e-G.e)/$,(s.matrix.f-G.f)/$];break;case "csv":G=M(e[A]).split(Za);fa=M(n[A]).split(Za);if("clip-rect"==A)for(n[A]=fa,m[A]=[],s=fa.length;s--;)m[A][s]=(G[s]-n[A][s])/$;J[A]=G;break;default:for(G=[].concat(e[A]),fa=[].concat(n[A]),m[A]=[],s=b.ca[A].length;s--;)m[A][s]=((G[s]||0)-(fa[s]||0))/$}s=e.easing;A=c.easing_formulas[s];if(!A)if((A=M(s).match(Na))&&5==A.length){var H=
A;A=function(a){return B(a,+H[1],+H[2],+H[3],+H[4],$)}}else A=ca;s=e.start||a.start||+new Date;fa={anim:a,percent:r,timestamp:s,start:s+(a.del||0),status:0,initstatus:f||0,stop:!1,ms:$,easing:A,from:n,diff:m,to:J,el:b,callback:e.callback,prev:l,next:g,repeat:C||a.times,origin:b.attr(),totalOrigin:v};Ia.push(fa);if(f&&!d&&!q&&(fa.stop=!0,fa.start=new Date-$*f,1==Ia.length))return Zc();q&&(fa.start=new Date-fa.ms*f);1==Ia.length&&fd(Zc)}p("raphael.anim.start."+b.id,b,a)}}function l(a){for(var c=0;c<
Ia.length;c++)Ia[c].el.paper==a&&Ia.splice(c--,1)}c.upgrade="1.0.0";c.version="2.1.0";c.eve=p;D=c;var m,N="apply",E="number",n="array",V=Array.prototype.slice,t=Array.prototype.splice,X=function(){return function(){}.hasOwnProperty("prototype")}(),u={doc:document,win:d},ga=Object.prototype.hasOwnProperty.call(u.win,"Raphael"),U=u.win.Raphael,ka=u.doc,xa=u.win,ea=c.supportsTouch="createTouch"in ka,Y=function(){};c.ca=c.customAttributes=Y.prototype;var ua=function(){this.ca=this.customAttributes=new Y;
this._CustomAttributes=function(){};this._CustomAttributes.prototype=this.ca;this._elementsById={};this.id=c._oid++;p("raphael.new",this)},ba=c.fn=ua.prototype=c.prototype,da={circle:1,rect:1,path:1,ellipse:1,text:1,image:1,group:1},oa="click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel".split(" "),H=c._touchMap={mousedown:"touchstart",mousemove:"touchmove",mouseup:"touchend"},M=xa.String,T=xa.parseFloat,q=xa.parseInt,J=xa.Math,W=J.max,G=J.min,
ja=J.abs,La=J.pow,Ca=J.cos,na=J.sin,pa=J.sqrt,za=J.round,aa=J.PI,Z=aa/180,Ma=180/aa,Ha=M.prototype.toLowerCase,hb=M.prototype.toUpperCase,Fa=xa.Object.prototype.toString,Za=/[, ]+/,Da=/\{(\d+)\}/g;c._ISURL=/^url\(['"]?([^\)]+?)['"]?\)$/i;var $a=/^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
Na=/^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,Ba=/[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/,Cb=/,?([achlmqrstvxz]),?/gi,Jb=/([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
Qb=/([rstm])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,ub=/(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig;
c._radial_gradient=/^x?r(?:\(([^\)]*?)\))?/;var Wa={NaN:1,Infinity:1,"-Infinity":1},mb={hs:1,rg:1},Ua=c._availableAttrs={"arrow-end":"none","arrow-start":"none",blur:0,"clip-rect":"0 0 1e9 1e9","clip-path":"",cursor:"default",cx:0,cy:0,fill:"#fff","fill-opacity":1,font:'10px "Arial"',"font-family":'"Arial"',"font-size":"10","font-style":"normal","font-weight":400,gradient:0,height:0,href:"about:blank","letter-spacing":0,"line-height":12,"vertical-align":"middle",opacity:1,path:"M0,0",r:0,rx:0,ry:0,
src:"",stroke:"#000","stroke-dasharray":"","stroke-linecap":"butt","stroke-linejoin":"butt","stroke-miterlimit":0,"stroke-opacity":1,"stroke-width":1,target:"_blank","text-anchor":"middle",visibility:"",title:"",transform:"",rotation:0,width:0,x:0,y:0},k=c._availableAnimAttrs={blur:E,"clip-rect":"csv","clip-path":"path",cx:E,cy:E,fill:"colour","fill-opacity":E,"font-size":E,height:E,opacity:E,path:"path",r:E,rx:E,ry:E,stroke:"colour","stroke-opacity":E,"stroke-width":E,transform:"transform",width:E,
x:E,y:E},A={},s=function(a,c){return T(a)-T(c)},O=function(){},ca=function(a){return a},Q=c._rectPath=function(a,c,b,r,f){return f?[["M",a+f,c],["l",b-2*f,0],["a",f,f,0,0,1,f,f],["l",0,r-2*f],["a",f,f,0,0,1,-f,f],["l",2*f-b,0],["a",f,f,0,0,1,-f,-f],["l",0,2*f-r],["a",f,f,0,0,1,f,-f],["z"]]:[["M",a,c],["l",b,0],["l",0,r],["l",-b,0],["z"]]},ia=function(a,c,b,r){null==r&&(r=b);return[["M",a,c],["m",0,-r],["a",b,r,0,1,1,0,2*r],["a",b,r,0,1,1,0,-2*r],["z"]]},qa=c._getPath={group:function(){return!1},path:function(a){return a.attr("path")},
circle:function(a){a=a.attrs;return ia(a.cx,a.cy,a.r)},ellipse:function(a){a=a.attrs;return ia(a.cx,a.cy,a.rx,a.ry)},rect:function(a){a=a.attrs;return Q(a.x,a.y,a.width,a.height,a.r)},image:function(a){a=a.attrs;return Q(a.x,a.y,a.width,a.height)},text:function(a){a=a._getBBox();return Q(a.x,a.y,a.width,a.height)}},va=c.mapPath=function(a,c){if(!c)return a;var b,r,f,v,k,C,e;a=K(a);f=0;for(k=a.length;f<k;f++)for(e=a[f],v=1,C=e.length;v<C;v+=2)b=c.x(e[v],e[v+1]),r=c.y(e[v],e[v+1]),e[v]=b,e[v+1]=r;return a};
c.pick=function(){for(var a,c=0,b=arguments.length;c<b;c+=1)if((a=arguments[c])||!1===a||0===a)return a};var S=c._lastArgIfGroup=function(a,b){var r=a.length-1,f=a[r];if(f&&f.constructor===c.el.constructor&&"group"===f.type)return b&&(a[r]=void 0,delete a[r],t.call(a,r,1)),f},Ja=c._serializeArgs=function(a){var b=a[0],r,f;if(c.is(b,"object")&&!c.is(b,"array")&&"group"!==b.type)for(r=b,b.path&&(b=b.path)&&!c.is(b,"string")&&c.is(b[0],n),b=1,f=arguments.length;b<f;b+=2)r[arguments[b]]||(r[arguments[b]]=
arguments[b+1]);else for(r={},b=1,f=arguments.length;b<f;b+=2)r[arguments[b]]=a[(b-1)/2]||arguments[b+1];return r},ma=c.merge=function(a,c,b,r,f){var v,k,C,K;f?(r.push(a),f.push(c)):(r=[a],f=[c]);if(c instanceof Array)for(v=0;v<c.length;v+=1){try{k=a[v],C=c[v]}catch(e){continue}if("object"!==typeof C)b&&void 0===C||(a[v]=C);else{if(null===k||"object"!==typeof k)k=a[v]=C instanceof Array?[]:{};K=checkCyclicRef(C,f);-1!==K?k=a[v]=r[K]:ma(k,C,b,r,f)}}else for(v in c){try{k=a[v],C=c[v]}catch(d){continue}if(null!==
C&&"object"===typeof C)if(K=Fa.call(C),"[object Object]"===K){if(null===k||"object"!==typeof k)k=a[v]={};K=checkCyclicRef(C,f);-1!==K?k=a[v]=r[K]:ma(k,C,b,r,f)}else"[object Array]"===K?(null!==k&&k instanceof Array||(k=a[v]=[]),K=checkCyclicRef(C,f),-1!==K?k=a[v]=r[K]:ma(k,C,b,r,f)):a[v]=C;else a[v]=C}return a};c.extend=function(a,c,b){if("object"!==typeof a&&"object"!==typeof c)return null;if("object"!==typeof c||null===c)return a;"object"!==typeof a&&(a=c instanceof Array?[]:{});ma(a,c,b);return a};
var Qa=c.is=function(a,c){c=Ha.call(c);return"finite"==c?!Wa.hasOwnProperty(+a):c==n?a instanceof Array:"object"!==c||void 0!==a&&null!==a?"null"==c&&null===a||c==typeof a&&null!==a||"object"==c&&a===Object(a)||"array"==c&&Array.isArray&&Array.isArray(a)||Fa.call(a).slice(8,-1).toLowerCase()==c:!1};c.createUUID=function(a,c){return function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(a,c).toUpperCase()}}(/[xy]/g,function(a){var c=16*J.random()|0;return("x"==a?c:c&3|8).toString(16)});var ya=
c.clone=X?function(a){if(Object(a)!==a)return a;var c=new a.constructor,b;for(b in a)"prototype"!==b&&a.hasOwnProperty(b)&&(c[b]=ya(a[b]));return c}:function(a){if(Object(a)!==a)return a;var c=new a.constructor,b;for(b in a)a.hasOwnProperty(b)&&(c[b]=ya(a[b]));return c};c._g=u;c.type=xa.ENABLE_RED_CANVAS&&(xa.CanvasRenderingContext2D||ka.createElement("canvas").getContext)?"CANVAS":xa.SVGAngle||ka.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1")?"SVG":"VML";if("VML"==
c.type){var Bb=ka.createElement("div"),ra;Bb.innerHTML='<v:shape adj="1"/>';ra=Bb.firstChild;ra.style.behavior="url(#default#VML)";if(!ra||"object"!=typeof ra.adj)return c.type="";Bb=null}c.svg=!((c.vml="VML"==c.type)||(c.canvas="CANVAS"==c.type));c._Paper=ua;c._id=0;c._oid=0;c.angle=function(a,b,r,f,v,k){return null==v?(a-=r,b-=f,a||b?(J.atan2(-b,-a)*Ma+540)%360:0):c.angle(a,b,v,k)-c.angle(r,f,v,k)};c.rad=function(a){return a%360*Z};c.deg=function(a){return a*Ma%360};c.snapTo=function(a,c,b){var r;
Qa(b,"finite")||(b=10);if(Qa(a,n))for(r=a.length;r--;){if(ja(a[r]-c)<=b)return a[r]}else{a=+a;r=c%a;if(r<b)return c-r;if(r>a-b)return c-r+a}return c};c.setWindow=function(a){p("raphael.setWindow",c,u.win,a);xa=u.win=a;ka=u.doc=u.win.document;c._engine.initWin&&c._engine.initWin(u.win)};var Sa=function(a){if(c.vml){var b=/^\s+|\s+$/g,r;try{var f=new ActiveXObject("htmlfile");f.write("<body>");f.close();r=f.body}catch(v){r=createPopup().document.body}var k=r.createTextRange();Sa=Ta(function(a){try{r.style.color=
M(a).replace(b,"");var c=k.queryCommandValue("ForeColor");return"#"+("000000"+((c&255)<<16|c&65280|(c&16711680)>>>16).toString(16)).slice(-6)}catch(f){return"none"}})}else{var C=u.doc.createElement("i");C.title="Raphaël Colour Picker";C.style.display="none";u.doc.body.appendChild(C);Sa=Ta(function(a){C.style.color=a;return u.doc.defaultView.getComputedStyle(C,"").getPropertyValue("color")})}return Sa(a)},Ya=function(){return"hsb("+[this.h,this.s,this.b]+")"},ha=function(){return"hsl("+[this.h,this.s,
this.l]+")"},xb=function(){return this.hex},Ka=function(a,b,r){null==b&&Qa(a,"object")&&"r"in a&&"g"in a&&"b"in a&&(r=a.b,b=a.g,a=a.r);null==b&&Qa(a,"string")&&(r=c.getRGB(a),a=r.r,b=r.g,r=r.b);if(1<a||1<b||1<r)a/=255,b/=255,r/=255;return[a,b,r]},sb=function(a,b,r,f){var v={r:a*=255,g:b*=255,b:r*=255,hex:c.rgb(a,b,r),toString:xb};Qa(f,"finite")&&(v.opacity=f);return v};c.color=function(a){var b;c.is(a,"object")&&"h"in a&&"s"in a&&"b"in a?(b=c.hsb2rgb(a),a.r=b.r,a.g=b.g,a.b=b.b,a.hex=b.hex):c.is(a,
"object")&&"h"in a&&"s"in a&&"l"in a?(b=c.hsl2rgb(a),a.r=b.r,a.g=b.g,a.b=b.b,a.hex=b.hex):(c.is(a,"string")&&(a=c.getRGB(a)),c.is(a,"object")&&"r"in a&&"g"in a&&"b"in a?(b=c.rgb2hsl(a),a.h=b.h,a.s=b.s,a.l=b.l,b=c.rgb2hsb(a),a.v=b.b):(a={hex:"none"},a.r=a.g=a.b=a.h=a.s=a.v=a.l=-1));a.toString=xb;return a};c.hsb2rgb=function(a,c,b,r){this.is(a,"object")&&"h"in a&&"s"in a&&"b"in a&&(b=a.b,c=a.s,a=a.h,r=a.o);var f,v,k;a=360*a%360/60;k=b*c;c=k*(1-ja(a%2-1));b=f=v=b-k;a=~~a;b+=[k,c,0,0,c,k][a];f+=[c,k,
k,c,0,0][a];v+=[0,0,c,k,k,c][a];return sb(b,f,v,r)};c.hsl2rgb=function(a,c,b,r){this.is(a,"object")&&"h"in a&&"s"in a&&"l"in a&&(b=a.l,c=a.s,a=a.h);if(1<a||1<c||1<b)a/=360,c/=100,b/=100;var f,v,k;a=360*a%360/60;k=2*c*(.5>b?b:1-b);c=k*(1-ja(a%2-1));b=f=v=b-k/2;a=~~a;b+=[k,c,0,0,c,k][a];f+=[c,k,k,c,0,0][a];v+=[0,0,c,k,k,c][a];return sb(b,f,v,r)};c.rgb2hsb=function(a,c,b){b=Ka(a,c,b);a=b[0];c=b[1];b=b[2];var r,f;r=W(a,c,b);f=r-G(a,c,b);a=((0==f?null:r==a?(c-b)/f:r==c?(b-a)/f+2:(a-c)/f+4)+360)%6*60/360;
return{h:a,s:0==f?0:f/r,b:r,toString:Ya}};c.rgb2hsl=function(a,c,b){b=Ka(a,c,b);a=b[0];c=b[1];b=b[2];var r,f,v;r=W(a,c,b);f=G(a,c,b);v=r-f;a=((0==v?null:r==a?(c-b)/v:r==c?(b-a)/v+2:(a-c)/v+4)+360)%6*60/360;r=(r+f)/2;return{h:a,s:0==v?0:.5>r?v/(2*r):v/(2-2*r),l:r,toString:ha}};c._path2string=function(){return this.join(",").replace(Cb,"$1")};var Ta=c._cacher=function(a,c,b){function r(){var f=V.call(arguments,0),v=f.join("␀"),k=r.cache=r.cache||{},C=r.count=r.count||[];if(k.hasOwnProperty(v)){a:for(var f=
C,C=v,K=0,e=f.length;K<e;K++)if(f[K]===C){f.push(f.splice(K,1)[0]);break a}return b?b(k[v]):k[v]}1E3<=C.length&&delete k[C.shift()];C.push(v);k[v]=a[N](c,f);return b?b(k[v]):k[v]}return r};c._preload=function(a,c){var b=ka.createElement("img");b.style.cssText="position:absolute;left:-9999em;top:-9999em";b.onload=function(){c.call(this);this.onload=null;ka.body.removeChild(this)};b.onerror=function(){ka.body.removeChild(this)};ka.body.appendChild(b);b.src=a};c.getRGB=Ta(function(a){var b,r,f,v,k;a&&
Qa(a,"object")&&"opacity"in a&&(b=a.opacity);if(!a||(a=M(a)).indexOf("-")+1)return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:h};if("none"==a)return{r:-1,g:-1,b:-1,hex:"none",toString:h};!mb.hasOwnProperty(a.toLowerCase().substring(0,2))&&"#"!==a.charAt()&&(a=Sa(a));if(a=a.match($a)){a[2]&&(v=q(a[2].substring(5),16),f=q(a[2].substring(3,5),16),r=q(a[2].substring(1,3),16));a[3]&&(v=q((k=a[3].charAt(3))+k,16),f=q((k=a[3].charAt(2))+k,16),r=q((k=a[3].charAt(1))+k,16));a[4]&&(k=a[4].split(Ba),r=T(k[0]),
"%"==k[0].slice(-1)&&(r*=2.55),f=T(k[1]),"%"==k[1].slice(-1)&&(f*=2.55),v=T(k[2]),"%"==k[2].slice(-1)&&(v*=2.55),"rgba"==a[1].toLowerCase().slice(0,4)&&(b=T(k[3])),k[3]&&"%"==k[3].slice(-1)&&(b/=100));if(a[5])return k=a[5].split(Ba),r=T(k[0]),"%"==k[0].slice(-1)&&(r*=2.55),f=T(k[1]),"%"==k[1].slice(-1)&&(f*=2.55),v=T(k[2]),"%"==k[2].slice(-1)&&(v*=2.55),"deg"!=k[0].slice(-3)&&"°"!=k[0].slice(-1)||(r/=360),"hsba"==a[1].toLowerCase().slice(0,4)&&(b=T(k[3])),k[3]&&"%"==k[3].slice(-1)&&(b/=100),c.hsb2rgb(r,
f,v,b);if(a[6])return k=a[6].split(Ba),r=T(k[0]),"%"==k[0].slice(-1)&&(r*=2.55),f=T(k[1]),"%"==k[1].slice(-1)&&(f*=2.55),v=T(k[2]),"%"==k[2].slice(-1)&&(v*=2.55),"deg"!=k[0].slice(-3)&&"°"!=k[0].slice(-1)||(r/=360),"hsla"==a[1].toLowerCase().slice(0,4)&&(b=T(k[3])),k[3]&&"%"==k[3].slice(-1)&&(b/=100),c.hsl2rgb(r,f,v,b);a={r:r,g:f,b:v,toString:h};a.hex="#"+(16777216|v|f<<8|r<<16).toString(16).slice(1);c.is(b,"finite")&&(a.opacity=b);return a}return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:h}},c);
c.tintshade=Ta(function(a,b){var r=c.getRGB(a),f;f=255;0>b&&(b*=-1,f=0);1<b&&(b=1);f=0===b?r:{r:f-(f-r.r)*b,g:f-(f-r.g)*b,b:f-(f-r.b)*b,toString:h};f.hex=c.rgb(f.r,f.g,f.b);r.error&&(f.error=r.error);"opacity"in r?(f.rgba="rgba("+[f.r,f.g,f.b,r.opacity].join()+")",f.opacity=r.opacity):f.rgba="rgb("+[f.r,f.g,f.b].join()+")";return f},c);c.hsb=Ta(function(a,b,r){return c.hsb2rgb(a,b,r).hex});c.hsl=Ta(function(a,b,r){return c.hsl2rgb(a,b,r).hex});c.rgb=Ta(function(a,c,b){return"#"+(16777216|b|c<<8|a<<
16).toString(16).slice(1)});c.getColor=function(a){a=this.getColor.start=this.getColor.start||{h:0,s:1,b:a||.75};var c=this.hsb2rgb(a.h,a.s,a.b);a.h+=.075;1<a.h&&(a.h=0,a.s-=.2,0>=a.s&&(this.getColor.start={h:0,s:1,b:a.b}));return c.hex};c.getColor.reset=function(){delete this.start};c.parsePathString=function(a){if(!a)return null;var b=gb(a);if(b.arr)return Lb(b.arr);var r={a:7,c:6,h:1,l:2,m:2,r:4,q:4,s:4,t:2,v:1,z:0},f=[];c.is(a,n)&&c.is(a[0],n)&&(f=Lb(a));f.length||M(a).replace(Jb,function(a,c,
b){var v=[];a=c.toLowerCase();b.replace(ub,function(a,c){c&&v.push(+c)});"m"==a&&2<v.length&&(f.push([c].concat(v.splice(0,2))),a="l",c="m"==c?"l":"L");if("r"==a)f.push([c].concat(v));else for(;v.length>=r[a]&&(f.push([c].concat(v.splice(0,r[a]))),r[a]););});f.toString=c._path2string;b.arr=Lb(f);return f};c.parseTransformString=Ta(function(a){if(!a)return null;var b=[];c.is(a,n)&&c.is(a[0],n)&&(b=Lb(a));b.length||M(a).replace(Qb,function(a,c,r){var f=[];Ha.call(c);r.replace(ub,function(a,c){c&&f.push(+c)});
b.push([c].concat(f))});b.toString=c._path2string;return b});var gb=function(a){var c=gb.ps=gb.ps||{};c[a]?c[a].sleep=100:c[a]={sleep:100};setTimeout(function(){for(var b in c)c.hasOwnProperty(b)&&b!=a&&(c[b].sleep--,!c[b].sleep&&delete c[b])});return c[a]};c.findDotsAtSegment=function(a,c,b,r,f,v,k,C,K){var e=1-K,d=La(e,3),q=La(e,2),g=K*K,s=g*K,R=d*a+3*q*K*b+3*e*K*K*f+s*k,d=d*c+3*q*K*r+3*e*K*K*v+s*C,q=a+2*K*(b-a)+g*(f-2*b+a),s=c+2*K*(r-c)+g*(v-2*r+c),l=b+2*K*(f-b)+g*(k-2*f+b),g=r+2*K*(v-r)+g*(C-
2*v+r);a=e*a+K*b;c=e*c+K*r;f=e*f+K*k;v=e*v+K*C;C=90-180*J.atan2(q-l,s-g)/aa;(q>l||s<g)&&(C+=180);return{x:R,y:d,m:{x:q,y:s},n:{x:l,y:g},start:{x:a,y:c},end:{x:f,y:v},alpha:C}};c.bezierBBox=function(a,b,r,f,v,k,K,e){c.is(a,"array")||(a=[a,b,r,f,v,k,K,e]);a=C.apply(null,a);return{x:a.min.x,y:a.min.y,x2:a.max.x,y2:a.max.y,width:a.max.x-a.min.x,height:a.max.y-a.min.y}};c.isPointInsideBBox=function(a,c,b){return c>=a.x&&c<=a.x2&&b>=a.y&&b<=a.y2};c.isBBoxIntersect=function(a,b){var r=c.isPointInsideBBox;
return r(b,a.x,a.y)||r(b,a.x2,a.y)||r(b,a.x,a.y2)||r(b,a.x2,a.y2)||r(a,b.x,b.y)||r(a,b.x2,b.y)||r(a,b.x,b.y2)||r(a,b.x2,b.y2)||(a.x<b.x2&&a.x>b.x||b.x<a.x2&&b.x>a.x)&&(a.y<b.y2&&a.y>b.y||b.y<a.y2&&b.y>a.y)};c.pathIntersection=function(a,c){return w(a,c)};c.pathIntersectionNumber=function(a,c){return w(a,c,1)};c.isPointInsidePath=function(a,b,r){var f=c.pathBBox(a);return c.isPointInsideBBox(f,b,r)&&(1==w(a,[["M",b,r],["H",f.x2+10]],1)%2||1==w(a,[["M",b,r],["V",f.y2+10]],1)%2)};c._removedFactory=function(a){return function(){p("raphael.log",
null,"Raphaël: you are calling to method “"+a+"” of removed object",a)}};var wb=c.pathBBox=function(a){var c=gb(a);if(c.bbox)return c.bbox;if(!a)return{x:0,y:0,width:0,height:0,x2:0,y2:0};a=K(a);for(var b=0,r=0,f=[],v=[],k,e=0,d=a.length;e<d;e++)k=a[e],"M"==k[0]?(b=k[1],r=k[2],f.push(b),v.push(r)):(b=C(b,r,k[1],k[2],k[3],k[4],k[5],k[6]),f=f.concat(b.min.x,b.max.x),v=v.concat(b.min.y,b.max.y),b=k[5],r=k[6]);a=G[N](0,f);k=G[N](0,v);f=W[N](0,f);v=W[N](0,v);v={x:a,y:k,x2:f,y2:v,width:f-a,height:v-k};
c.bbox=ya(v);return v},Lb=function(a){a=ya(a);a.toString=c._path2string;return a},Ob=c._pathToRelative=function(a){var b=gb(a);if(b.rel)return Lb(b.rel);c.is(a,n)&&c.is(a&&a[0],n)||(a=c.parsePathString(a));var r=[],f=0,v=0,k=0,C=0,K=0;"M"==a[0][0]&&(f=a[0][1],v=a[0][2],k=f,C=v,K++,r.push(["M",f,v]));for(var e=a.length;K<e;K++){var d=r[K]=[],q=a[K];if(q[0]!=Ha.call(q[0]))switch(d[0]=Ha.call(q[0]),d[0]){case "a":d[1]=q[1];d[2]=q[2];d[3]=q[3];d[4]=q[4];d[5]=q[5];d[6]=+(q[6]-f).toFixed(3);d[7]=+(q[7]-
v).toFixed(3);break;case "v":d[1]=+(q[1]-v).toFixed(3);break;case "m":k=q[1],C=q[2];default:for(var g=1,s=q.length;g<s;g++)d[g]=+(q[g]-(g%2?f:v)).toFixed(3)}else for(r[K]=[],"m"==q[0]&&(k=q[1]+f,C=q[2]+v),d=0,g=q.length;d<g;d++)r[K][d]=q[d];q=r[K].length;switch(r[K][0]){case "z":f=k;v=C;break;case "h":f+=+r[K][q-1];break;case "v":v+=+r[K][q-1];break;default:f+=+r[K][q-2],v+=+r[K][q-1]}}r.toString=c._path2string;b.rel=Lb(r);return r},ac=c._pathToAbsolute=function(a){var r=gb(a),f;if(r.abs)return Lb(r.abs);
c.is(a,n)&&c.is(a&&a[0],n)||(a=c.parsePathString(a));if(!a||!a.length)return f=["M",0,0],f.toString=c._path2string,f;var v=0,k=0,C=0,K=0,e=0;f=[];"M"==a[0][0]&&(v=+a[0][1],k=+a[0][2],C=v,K=k,e++,f[0]=["M",v,k]);for(var d=3==a.length&&"M"==a[0][0]&&"R"==a[1][0].toUpperCase()&&"Z"==a[2][0].toUpperCase(),q,g=e,s=a.length;g<s;g++){f.push(e=[]);q=a[g];if(q[0]!=hb.call(q[0]))switch(e[0]=hb.call(q[0]),e[0]){case "A":e[1]=q[1];e[2]=q[2];e[3]=q[3];e[4]=q[4];e[5]=q[5];e[6]=+(q[6]+v);e[7]=+(q[7]+k);break;case "V":e[1]=
+q[1]+k;break;case "H":e[1]=+q[1]+v;break;case "R":for(var R=[v,k].concat(q.slice(1)),l=2,$=R.length;l<$;l++)R[l]=+R[l]+v,R[++l]=+R[l]+k;f.pop();f=f.concat(b(R,d));break;case "M":C=+q[1]+v,K=+q[2]+k;default:for(l=1,$=q.length;l<$;l++)e[l]=+q[l]+(l%2?v:k)}else if("R"==q[0])R=[v,k].concat(q.slice(1)),f.pop(),f=f.concat(b(R,d)),e=["R"].concat(q.slice(-2));else for(R=0,l=q.length;R<l;R++)e[R]=q[R];switch(e[0]){case "Z":v=C;k=K;break;case "H":v=e[1];break;case "V":k=e[1];break;case "M":C=e[e.length-2],
K=e[e.length-1];default:v=e[e.length-2],k=e[e.length-1]}}f.toString=c._path2string;r.abs=Lb(f);return f},Ib=function(a,c,b,r){return[a,c,b,r,b,r]},Pb=function(a,c,b,r,f,v){var k=1/3,C=2/3;return[k*a+C*b,k*c+C*r,k*f+C*b,k*v+C*r,f,v]},r=function(a,c,b,f,v,k,C,K,e,d){var q=120*aa/180,g=Z*(+v||0),s=[],R,l=Ta(function(a,c,b){var r=a*Ca(b)-c*na(b);a=a*na(b)+c*Ca(b);return{x:r,y:a}});if(d)A=d[0],R=d[1],k=d[2],$=d[3];else{R=l(a,c,-g);a=R.x;c=R.y;R=l(K,e,-g);K=R.x;e=R.y;Ca(Z*v);na(Z*v);R=(a-K)/2;A=(c-e)/2;
$=R*R/(b*b)+A*A/(f*f);1<$&&($=pa($),b*=$,f*=$);var $=b*b,n=f*f,$=(k==C?-1:1)*pa(ja(($*n-$*A*A-n*R*R)/($*A*A+n*R*R)));k=$*b*A/f+(a+K)/2;var $=$*-f*R/b+(c+e)/2,A=J.asin(((c-$)/f).toFixed(9));R=J.asin(((e-$)/f).toFixed(9));A=a<k?aa-A:A;R=K<k?aa-R:R;0>A&&(A=2*aa+A);0>R&&(R=2*aa+R);C&&A>R&&(A-=2*aa);!C&&R>A&&(R-=2*aa)}if(ja(R-A)>q){var s=R,n=K,m=e;R=A+q*(C&&R>A?1:-1);K=k+b*Ca(R);e=$+f*na(R);s=r(K,e,b,f,v,0,C,n,m,[R,s,k,$])}k=R-A;v=Ca(A);q=na(A);C=Ca(R);R=na(R);k=J.tan(k/4);b=4/3*b*k;k*=4/3*f;f=[a,c];a=
[a+b*q,c-k*v];c=[K+b*R,e-k*C];K=[K,e];a[0]=2*f[0]-a[0];a[1]=2*f[1]-a[1];if(d)return[a,c,K].concat(s);s=[a,c,K].concat(s).join().split(",");d=[];K=0;for(e=s.length;K<e;K++)d[K]=K%2?l(s[K-1],s[K],g).y:l(s[K],s[K+1],g).x;return d},v=function(a,c,b,r,f,v,k,K,C){var e=1-C;return{x:La(e,3)*a+3*La(e,2)*C*b+3*e*C*C*f+La(C,3)*k,y:La(e,3)*c+3*La(e,2)*C*r+3*e*C*C*v+La(C,3)*K}},C=Ta(function(a,c,b,r,f,k,C,K){var e=f-2*b+a-(C-2*f+b),d=2*(b-a)-2*(f-b),q=a-b,g=(-d+pa(d*d-4*e*q))/2/e,e=(-d-pa(d*d-4*e*q))/2/e,R=[c,
K],s=[a,C];"1e12"<ja(g)&&(g=.5);"1e12"<ja(e)&&(e=.5);0<g&&1>g&&(g=v(a,c,b,r,f,k,C,K,g),s.push(g.x),R.push(g.y));0<e&&1>e&&(g=v(a,c,b,r,f,k,C,K,e),s.push(g.x),R.push(g.y));e=k-2*r+c-(K-2*k+r);d=2*(r-c)-2*(k-r);q=c-r;g=(-d+pa(d*d-4*e*q))/2/e;e=(-d-pa(d*d-4*e*q))/2/e;"1e12"<ja(g)&&(g=.5);"1e12"<ja(e)&&(e=.5);0<g&&1>g&&(g=v(a,c,b,r,f,k,C,K,g),s.push(g.x),R.push(g.y));0<e&&1>e&&(g=v(a,c,b,r,f,k,C,K,e),s.push(g.x),R.push(g.y));return{min:{x:G[N](0,s),y:G[N](0,R)},max:{x:W[N](0,s),y:W[N](0,R)}}}),K=c._path2curve=
Ta(function(a,c){var b=!c&&gb(a);if(!c&&b.curve)return Lb(b.curve);var f=ac(a),v=c&&ac(c),k={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},C={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},K=function(a,c){var b,f;if(!a)return["C",c.x,c.y,c.x,c.y,c.x,c.y];a[0]in{T:1,Q:1}||(c.qx=c.qy=null);switch(a[0]){case "M":c.X=a[1];c.Y=a[2];break;case "A":a=["C"].concat(r[N](0,[c.x,c.y].concat(a.slice(1))));break;case "S":b=c.x+(c.x-(c.bx||c.x));f=c.y+(c.y-(c.by||c.y));a=["C",b,f].concat(a.slice(1));break;case "T":c.qx=
c.x+(c.x-(c.qx||c.x));c.qy=c.y+(c.y-(c.qy||c.y));a=["C"].concat(Pb(c.x,c.y,c.qx,c.qy,a[1],a[2]));break;case "Q":c.qx=a[1];c.qy=a[2];a=["C"].concat(Pb(c.x,c.y,a[1],a[2],a[3],a[4]));break;case "L":a=["C"].concat(Ib(c.x,c.y,a[1],a[2]));break;case "H":a=["C"].concat(Ib(c.x,c.y,a[1],c.y));break;case "V":a=["C"].concat(Ib(c.x,c.y,c.x,a[1]));break;case "Z":a=["C"].concat(Ib(c.x,c.y,c.X,c.Y))}return a},e=function(a,c){if(7<a[c].length){a[c].shift();for(var b=a[c];b.length;)a.splice(c++,0,["C"].concat(b.splice(0,
6)));a.splice(c,1);g=W(f.length,v&&v.length||0)}},d=function(a,c,b,r,k){a&&c&&"M"==a[k][0]&&"M"!=c[k][0]&&(c.splice(k,0,["M",r.x,r.y]),b.bx=0,b.by=0,b.x=a[k][1],b.y=a[k][2],g=W(f.length,v&&v.length||0))},q=0,g=W(f.length,v&&v.length||0);for(;q<g;q++){f[q]=K(f[q],k);e(f,q);v&&(v[q]=K(v[q],C));v&&e(v,q);d(f,v,k,C,q);d(v,f,C,k,q);var R=f[q],s=v&&v[q],l=R.length,$=v&&s.length;k.x=R[l-2];k.y=R[l-1];k.bx=T(R[l-4])||k.x;k.by=T(R[l-3])||k.y;C.bx=v&&(T(s[$-4])||C.x);C.by=v&&(T(s[$-3])||C.y);C.x=v&&s[$-2];
C.y=v&&s[$-1]}v||(b.curve=Lb(f));return v?[f,v]:f},null,Lb);c._parseDots=Ta(function(a){for(var b=[],f=0,r=a.length;f<r;f++){var v={},k=a[f].match(/^([^:]*):?([\d\.]*)/);v.color=c.getRGB(k[1]);if(v.color.error)return null;v.opacity=v.color.opacity;v.color=v.color.hex;k[2]&&(v.offset=k[2]+"%");b.push(v)}f=1;for(r=b.length-1;f<r;f++)if(!b[f].offset){a=T(b[f-1].offset||0);k=0;for(v=f+1;v<r;v++)if(b[v].offset){k=b[v].offset;break}k||(k=100,v=r);k=T(k);for(k=(k-a)/(v-f+1);f<v;f++)a+=k,b[f].offset=a+"%"}return b});
var f=c._tear=function(a,c){a==c.top&&(c.top=a.prev);a==c.bottom&&(c.bottom=a.next);a.next&&(a.next.prev=a.prev);a.prev&&(a.prev.next=a.next)};c._tofront=function(a,c){if(c.top===a)return!1;f(a,c);a.next=null;a.prev=c.top;c.top.next=a;c.top=a;return!0};c._toback=function(a,c){if(c.bottom===a)return!1;f(a,c);a.next=c.bottom;a.prev=null;c.bottom.prev=a;c.bottom=a;return!0};c._insertafter=function(a,c,b,r){f(a,b);a.parent=r;c===r.top&&(r.top=a);c.next&&(c.next.prev=a);a.next=c.next;a.prev=c;c.next=a};
c._insertbefore=function(a,c,b,r){f(a,b);a.parent=r;c===r.bottom&&(r.bottom=a);c.prev&&(c.prev.next=a);a.prev=c.prev;c.prev=a;a.next=c};var fa=c.toMatrix=function(a,c){var b=wb(a),f={_:{transform:""},getBBox:function(){return b}};R(f,c);return f.matrix};c.transformPath=function(a,c){return va(a,fa(a,c))};var R=c._extractTransform=function(a,b){if(null==b)return a._.transform;b=M(b).replace(/\.{3}|\u2026/g,a._.transform||"");var f=c.parseTransformString(b),r=0,v=0,k=0,C=1,K=1,e=a._,k=new F;e.transform=
f||[];if(f)for(var v=0,d=f.length;v<d;v++){var q=f[v],g=q.length,R=M(q[0]).toLowerCase(),s=q[0]!=R,l=s?k.invert():0,$;"t"==R&&3==g?s?(g=l.x(0,0),R=l.y(0,0),s=l.x(q[1],q[2]),l=l.y(q[1],q[2]),k.translate(s-g,l-R)):k.translate(q[1],q[2]):"r"==R?2==g?($=$||a.getBBox(1),k.rotate(q[1],$.x+$.width/2,$.y+$.height/2),r+=q[1]):4==g&&(s?(s=l.x(q[2],q[3]),l=l.y(q[2],q[3]),k.rotate(q[1],s,l)):k.rotate(q[1],q[2],q[3]),r+=q[1]):"s"==R?2==g||3==g?($=$||a.getBBox(1),k.scale(q[1],q[g-1],$.x+$.width/2,$.y+$.height/
2),C*=q[1],K*=q[g-1]):5==g&&(s?(s=l.x(q[3],q[4]),l=l.y(q[3],q[4]),k.scale(q[1],q[2],s,l)):k.scale(q[1],q[2],q[3],q[4]),C*=q[1],K*=q[2]):"m"==R&&7==g&&k.add(q[1],q[2],q[3],q[4],q[5],q[6]);e.dirtyT=1;a.matrix=k}a.matrix=k;e.sx=C;e.sy=K;e.deg=r;e.dx=v=k.e;e.dy=k=k.f;1==C&&1==K&&!r&&e.bbox?(e.bbox.x+=+v,e.bbox.y+=+k):e.dirtyT=1},$=function(a){var c=a[0];switch(c.toLowerCase()){case "t":return[c,0,0];case "m":return[c,1,0,0,1,0,0];case "r":return 4==a.length?[c,0,a[2],a[3]]:[c,0];case "s":return 5==a.length?
[c,1,1,a[3],a[4]]:3==a.length?[c,1,1]:[c,1]}},Mb=c._equaliseTransform=function(a,b){b=M(b).replace(/\.{3}|\u2026/g,a);a=c.parseTransformString(a)||[];b=c.parseTransformString(b)||[];for(var f=W(a.length,b.length),r=[],v=[],k=0,C,K,e,q;k<f;k++){e=a[k]||$(b[k]);q=b[k]||$(e);if(e[0]!=q[0]||"r"==e[0].toLowerCase()&&(e[2]!=q[2]||e[3]!=q[3])||"s"==e[0].toLowerCase()&&(e[3]!=q[3]||e[4]!=q[4]))return;r[k]=[];v[k]=[];C=0;for(K=W(e.length,q.length);C<K;C++)C in e&&(r[k][C]=e[C]),C in q&&(v[k][C]=q[C])}return{from:r,
to:v}};c._getContainer=function(a,b,f,r){var v;v=null!=r||c.is(a,"object")?a:u.doc.getElementById(a);if(null!=v)return v.tagName?null==b?{container:v,width:v.style.pixelWidth||v.offsetWidth,height:v.style.pixelHeight||v.offsetHeight}:{container:v,width:b,height:f}:{container:1,x:a,y:b,width:f,height:r}};c.pathToRelative=Ob;c._engine={};c.path2curve=K;c.matrix=function(a,c,b,f,r,v){return new F(a,c,b,f,r,v)};(function(a){function b(a){return a[0]*a[0]+a[1]*a[1]}function f(a){var c=pa(b(a));a[0]&&(a[0]/=
c);a[1]&&(a[1]/=c)}a.add=function(a,c,b,f,r,v){var k=[[],[],[]],C=[[this.a,this.c,this.e],[this.b,this.d,this.f],[0,0,1]];c=[[a,b,r],[c,f,v],[0,0,1]];a&&a instanceof F&&(c=[[a.a,a.c,a.e],[a.b,a.d,a.f],[0,0,1]]);for(a=0;3>a;a++)for(b=0;3>b;b++){for(f=r=0;3>f;f++)r+=C[a][f]*c[f][b];k[a][b]=r}this.a=k[0][0];this.b=k[1][0];this.c=k[0][1];this.d=k[1][1];this.e=k[0][2];this.f=k[1][2]};a.invert=function(){var a=this.a*this.d-this.b*this.c;return new F(this.d/a,-this.b/a,-this.c/a,this.a/a,(this.c*this.f-
this.d*this.e)/a,(this.b*this.e-this.a*this.f)/a)};a.clone=function(){return new F(this.a,this.b,this.c,this.d,this.e,this.f)};a.translate=function(a,c){this.add(1,0,0,1,a,c)};a.scale=function(a,c,b,f){null==c&&(c=a);(b||f)&&this.add(1,0,0,1,b,f);this.add(a,0,0,c,0,0);(b||f)&&this.add(1,0,0,1,-b,-f)};a.rotate=function(a,b,f){a=c.rad(a);b=b||0;f=f||0;var r=+Ca(a).toFixed(9);a=+na(a).toFixed(9);this.add(r,a,-a,r,b,f);this.add(1,0,0,1,-b,-f)};a.x=function(a,c){return a*this.a+c*this.c+this.e};a.y=function(a,
c){return a*this.b+c*this.d+this.f};a.get=function(a){return+this[M.fromCharCode(97+a)].toFixed(4)};a.toString=function(){return c.svg?"matrix("+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)].join()+")":[this.get(0),this.get(2),this.get(1),this.get(3),0,0].join()};a.toMatrixString=function(){return"matrix("+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)].join()+")"};a.toFilter=function(){return"progid:DXImageTransform.Microsoft.Matrix(M11="+this.get(0)+
", M12="+this.get(2)+", M21="+this.get(1)+", M22="+this.get(3)+", Dx="+this.get(4)+", Dy="+this.get(5)+", sizingmethod='auto expand')"};a.offset=function(){return[this.e.toFixed(4),this.f.toFixed(4)]};a.split=function(){var a={};a.dx=this.e;a.dy=this.f;var r=[[this.a,this.c],[this.b,this.d]];a.scalex=pa(b(r[0]));f(r[0]);a.shear=r[0][0]*r[1][0]+r[0][1]*r[1][1];r[1]=[r[1][0]-r[0][0]*a.shear,r[1][1]-r[0][1]*a.shear];a.scaley=pa(b(r[1]));f(r[1]);a.shear/=a.scaley;var v=-r[0][1],r=r[1][1];0>r?(a.rotate=
c.deg(J.acos(r)),0>v&&(a.rotate=360-a.rotate)):a.rotate=c.deg(J.asin(v));a.isSimple=!+a.shear.toFixed(9)&&(a.scalex.toFixed(9)==a.scaley.toFixed(9)||!a.rotate);a.isSuperSimple=!+a.shear.toFixed(9)&&a.scalex.toFixed(9)==a.scaley.toFixed(9)&&!a.rotate;a.noRotation=!+a.shear.toFixed(9)&&!a.rotate;return a};a.toTransformString=function(a){a=a||this.split();return a.isSimple?(a.scalex=+a.scalex.toFixed(4),a.scaley=+a.scaley.toFixed(4),a.rotate=+a.rotate.toFixed(4),(a.dx||a.dy?"t"+[a.dx,a.dy]:"")+(1!=a.scalex||
1!=a.scaley?"s"+[a.scalex,a.scaley,0,0]:"")+(a.rotate?"r"+[a.rotate,0,0]:"")):"m"+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)]}})(F.prototype);var qb=navigator.userAgent.match(/Version\/(.*?)\s/)||navigator.userAgent.match(/Chrome\/(\d+)/);"Apple Computer, Inc."==navigator.vendor&&(qb&&4>qb[1]||"iP"==navigator.platform.slice(0,2))||"Google Inc."==navigator.vendor&&qb&&8>qb[1]?ba.safari=function(){var a=this.rect(-99,-99,this.width+99,this.height+99).attr({stroke:"none"});
setTimeout(function(){a.remove()});return!0}:ba.safari=O;for(var kc=function(){this.returnValue=!1},sa=function(){return this.originalEvent.preventDefault()},Ic=function(){this.cancelBubble=!0},lc=function(){return this.originalEvent.stopPropagation()},bc=c.addEvent=function(){if(u.doc.addEventListener)return function(a,c,b,r){var f=ea&&H[c]?H[c]:c,v=function(f){var v=u.doc.documentElement.scrollTop||u.doc.body.scrollTop,k=u.doc.documentElement.scrollLeft||u.doc.body.scrollLeft;if(ea&&H.hasOwnProperty(c))for(var C=
0,K=f.targetTouches&&f.targetTouches.length;C<K;C++)if(f.targetTouches[C].target==a){K=f;f=f.targetTouches[C];f.originalEvent=K;f.preventDefault=sa;f.stopPropagation=lc;break}return b.call(r,f,f.clientX+k,f.clientY+v)};a.addEventListener(f,v,!1);return function(){a.removeEventListener(f,v,!1);return!0}};if(u.doc.attachEvent)return function(a,c,b,f){var r=function(a){a=a||u.win.event;var c=a.clientX+(u.doc.documentElement.scrollLeft||u.doc.body.scrollLeft),r=a.clientY+(u.doc.documentElement.scrollTop||
u.doc.body.scrollTop);a.preventDefault=a.preventDefault||kc;a.stopPropagation=a.stopPropagation||Ic;return b.call(f,a,c,r)};a.attachEvent("on"+c,r);return function(){a.detachEvent("on"+c,r);return!0}}}(),Dc=[],$c=function(a){for(var b=a.clientX,f=a.clientY,r=u.doc.documentElement.scrollTop||u.doc.body.scrollTop,v=u.doc.documentElement.scrollLeft||u.doc.body.scrollLeft,k,C=Dc.length;C--;){k=Dc[C];if(ea)for(var K=a.touches.length,e;K--;){if(e=a.touches[K],e.identifier==k.el._drag.id){b=e.clientX;f=
e.clientY;(a.originalEvent?a.originalEvent:a).preventDefault();break}}else a.preventDefault();if(!k.el.removed){var K=c._engine.getNode(k.el),q=K.nextSibling,d=K.parentNode,g=K.style.display;u.win.opera&&d.removeChild(K);K.style.display="none";e=k.el.paper.getElementByPoint(b,f);K.style.display=g;u.win.opera&&(q?d.insertBefore(K,q):d.appendChild(K));e&&p("raphael.drag.over."+k.el.id,k.el,e);b+=v;f+=r;p("raphael.drag.move."+k.el.id,k.move_scope||k.el,b-k.el._drag.x,f-k.el._drag.y,b,f,a)}}},ad=function(a){c.unmousemove($c).unmouseup(ad);
for(var b=Dc.length,f;b--;)f=Dc[b],f.el._drag={},p("raphael.drag.end."+f.el.id,f.end_scope||f.start_scope||f.move_scope||f.el,a);Dc=[]},la=c.el={},gd=oa.length;gd--;)(function(a){c[a]=la[a]=function(b,f){c.is(b,"function")&&(this.events=this.events||[],this.events.push({name:a,f:b,unbind:bc(this.shape||this.node||u.doc,a,b,f||this)}));return this};c["un"+a]=la["un"+a]=function(c){for(var b=this.events||[],f=b.length;f--;)if(b[f].name==a&&b[f].f==c){b[f].unbind();b.splice(f,1);!b.length&&delete this.events;
break}return this}})(oa[gd]);la.data=function(a,b){var f=A[this.id]=A[this.id]||{};if(1==arguments.length){if(c.is(a,"object")){for(var r in a)a.hasOwnProperty(r)&&this.data(r,a[r]);return this}p("raphael.data.get."+this.id,this,f[a],a);return f[a]}f[a]=b;p("raphael.data.set."+this.id,this,b,a);return this};la.removeData=function(a){null==a?delete A[this.id]:A[this.id]&&delete A[this.id][a];return this};la.getData=function(){return ya(A[this.id]||{})};var Aa=[],ld=function(){this.untrack=bc(u.doc,
"mouseup",kd,this)},kd=function(){this.untrack();this.untrack=null;return this.fn&&this.fn.apply(this.scope||this.el,arguments)};la.mouseup=function(a,b,f){if(!f)return c.mouseup.apply(this,arguments);Aa.push(f={el:this,fn:a,scope:b});f.unbind=bc(this.shape||this.node||u.doc,"mousedown",ld,f);return this};la.unmouseup=function(a){for(var b=Aa.length,f;b--;)Aa[b].el===this&&Aa[b].fn===a&&(f=Aa[b],f.unbind(),f.untrack&&f.untrack(),Aa.splice(b,1));return f?this:c.unmouseup.apply(this,arguments)};la.hover=
function(a,c,b,f){return this.mouseover(a,b).mouseout(c,f||b)};la.unhover=function(a,c){return this.unmouseover(a).unmouseout(c)};var xc=[];la.drag=function(a,b,f,r,v,k){function C(K){(K.originalEvent||K).preventDefault();var e=u.doc.documentElement.scrollTop||u.doc.body.scrollTop,q=u.doc.documentElement.scrollLeft||u.doc.body.scrollLeft;this._drag.x=K.clientX+q;this._drag.y=K.clientY+e;this._drag.id=K.identifier;!Dc.length&&c.mousemove($c).mouseup(ad);Dc.push({el:this,move_scope:r,start_scope:v,
end_scope:k});b&&p.on("raphael.drag.start."+this.id,b);a&&p.on("raphael.drag.move."+this.id,a);f&&p.on("raphael.drag.end."+this.id,f);p("raphael.drag.start."+this.id,v||r||this,K.clientX+q,K.clientY+e,K)}this._drag={};xc.push({el:this,start:C});this.mousedown(C);return this};la.onDragOver=function(a){a?p.on("raphael.drag.over."+this.id,a):p.unbind("raphael.drag.over."+this.id)};la.undrag=function(){for(var a=xc.length;a--;)xc[a].el==this&&(this.unmousedown(xc[a].start),xc.splice(a,1),p.unbind("raphael.drag.*."+
this.id));!xc.length&&c.unmousemove($c).unmouseup(ad);delete this._drag};la.follow=function(a,b,f){if(a.removed||a.constructor!==c.el.constructor)return this;a.followers.push({el:this,stalk:f={before:"insertBefore",after:"insertAfter"}[f],cb:b});f&&this[f](a);return this};la.unfollow=function(a){if(a.removed||a.constructor!==c.el.constructor)return this;for(var b=0,f=a.followers.length;b<f;b++)if(a.followers[b].el===this){a.followers.splice(b,1);break}return this};ba.hide=function(){this.canvas.style.visibility=
"hidden";return this};ba.show=function(){this.canvas.style.visibility="";return this};ba.group=function(){var a=arguments,b=S(a,!0),a=c._engine.group(this,a[0],b);return this.__set__&&this.__set__.push(a),this._elementsById[a.id]=a};ba.circle=function(){var a=arguments,b=S(a,!0),a=Ja(a,"cx",0,"cy",0,"r",0,"fill","none","stroke","#000"),b=c._engine.circle(this,a,b);return this.__set__&&this.__set__.push(b),this._elementsById[b.id]=b};ba.rect=function(){var a=arguments,b=S(a,!0),a=Ja(a,"x",0,"y",0,
"width",0,"height",0,"r",0,"fill","none","stroke","#000"),b=c._engine.rect(this,a,b);return this.__set__&&this.__set__.push(b),this._elementsById[b.id]=b};ba.ellipse=function(){var a=arguments,b=S(a,!0),a=Ja(a,"x",0,"y",0,"rx",0,"ry",0,"fill","none","stroke","#000"),b=c._engine.ellipse(this,a,b);return this.__set__&&this.__set__.push(b),this._elementsById[b.id]=b};ba.path=function(){var a=arguments,b=S(a,!0),a=Ja(a,"path","","fill","none","stroke","#000"),b=c._engine.path(this,a,b);return this.__set__&&
this.__set__.push(b),this._elementsById[b.id]=b};ba.image=function(){var a=arguments,b=S(a,!0),a=Ja(a,"src","about:blank","x",0,"y",0,"width",0,"height",0);out=c._engine.image(this,a,b);return this.__set__&&this.__set__.push(out),this._elementsById[out.id]=out};ba.text=function(){var a=arguments,b=S(a,!0),a=Ja(a,"x",0,"y",0,"text","","stroke","none","fill","#000","text-anchor","middle","vertical-align","middle"),b=c._engine.text(this,a,b);return this.__set__&&this.__set__.push(b),this._elementsById[b.id]=
b};ba.set=function(a){!c.is(a,"array")&&(a=t.call(arguments,0,arguments.length));var b=new Hb(a);this.__set__&&this.__set__.push(b);return b};ba.setStart=function(a){this.__set__=a||this.set()};ba.setFinish=function(a){a=this.__set__;delete this.__set__;return a};ba.setSize=function(a,b){return c._engine.setSize.call(this,a,b)};ba.setViewBox=function(a,b,f,r,v){return c._engine.setViewBox.call(this,a,b,f,r,v)};ba.top=ba.bottom=null;ba.raphael=c;ba.getElementByPoint=function(a,c){var b,f,r=this.canvas,
v=u.doc.elementFromPoint(a,c);if(u.win.opera&&"svg"==v.tagName){f=r.getBoundingClientRect();b=r.ownerDocument;var k=b.body,C=b.documentElement;b=f.top+(u.win.pageYOffset||C.scrollTop||k.scrollTop)-(C.clientTop||k.clientTop||0);f=f.left+(u.win.pageXOffset||C.scrollLeft||k.scrollLeft)-(C.clientLeft||k.clientLeft||0);k=r.createSVGRect();k.x=a-f;k.y=c-b;k.width=k.height=1;b=r.getIntersectionList(k,null);b.length&&(v=b[b.length-1])}if(!v)return null;for(;v.parentNode&&v!=r.parentNode&&!v.raphael;)v=v.parentNode;
v==this.canvas.parentNode&&(v=r);return v=v&&v.raphael?this.getById(v.raphaelid):null};ba.getElementsByBBox=function(a){var b=this.set();this.forEach(function(f){c.isBBoxIntersect(f.getBBox(),a)&&b.push(f)});return b};ba.getById=function(a){return this._elementsById[a]||null};ba.forEach=function(a,c){for(var b=this.bottom;b&&!1!==a.call(c,b);)b=b.next;return this};ba.getElementsByPoint=function(a,c){var b=this.set();this.forEach(function(f){f.isPointInside(a,c)&&b.push(f)});return b};la.isPointInside=
function(a,b){var f=this.realPath=this.realPath||qa[this.type](this),r;return c.isPointInsidePath((r=this.attr("transform"))&&r.length&&c.transformPath(f,r)||f,a,b)};la.getBBox=function(a){if(this.removed)return{};var c=this._;if(a){if(c.dirty||!c.bboxwt)this.realPath=qa[this.type](this),c.bboxwt=wb(this.realPath),c.bboxwt.toString=L,c.dirty=0;return c.bboxwt}if(c.dirty||c.dirtyT||!c.bbox){if(c.dirty||!this.realPath)c.bboxwt=0,this.realPath=qa[this.type](this);c.bbox=wb(va(this.realPath,this.matrix));
c.bbox.toString=L;c.dirty=c.dirtyT=0}return c.bbox};la.clone=function(){if(this.removed)return null;var a=this.paper[this.type]().attr(this.attr());this.__set__&&this.__set__.push(a);return a};la.glow=function(a){if("text"==this.type)return null;a=a||{};var c=(a.width||10)+(+this.attr("stroke-width")||1),b=a.fill||!1,f=a.opacity||.5,r=a.offsetx||0,v=a.offsety||0;a=a.color||"#000";for(var k=c/2,C=this.paper,K=C.set(),e=this.realPath||qa[this.type](this),e=this.matrix?va(e,this.matrix):e,q=1;q<k+1;q++)K.push(C.path(e).attr({stroke:a,
fill:b?a:"none","stroke-linejoin":"round","stroke-linecap":"round","stroke-width":+(c/k*q).toFixed(3),opacity:+(f/k).toFixed(3)}));return K.insertBefore(this).translate(r,v)};var bd=function(b,f,r,v,k,C,K,e,q){return null==q?P(b,f,r,v,k,C,K,e):c.findDotsAtSegment(b,f,r,v,k,C,K,e,a(b,f,r,v,k,C,K,e,q))},tc=function(a,b){return function(f,r,v){f=K(f);for(var k,C,e,q,d="",g={},s=0,R=0,l=f.length;R<l;R++){e=f[R];if("M"==e[0])k=+e[1],C=+e[2];else{q=bd(k,C,e[1],e[2],e[3],e[4],e[5],e[6]);if(s+q>r){if(b&&
!g.start){k=bd(k,C,e[1],e[2],e[3],e[4],e[5],e[6],r-s);d+=["C"+k.start.x,k.start.y,k.m.x,k.m.y,k.x,k.y];if(v)return d;g.start=d;d=["M"+k.x,k.y+"C"+k.n.x,k.n.y,k.end.x,k.end.y,e[5],e[6]].join();s+=q;k=+e[5];C=+e[6];continue}if(!a&&!b)return k=bd(k,C,e[1],e[2],e[3],e[4],e[5],e[6],r-s),{x:k.x,y:k.y,alpha:k.alpha}}s+=q;k=+e[5];C=+e[6]}d+=e.shift()+e}g.end=d;k=a?s:b?g:c.findDotsAtSegment(k,C,e[0],e[1],e[2],e[3],e[4],e[5],1);k.alpha&&(k={x:k.x,y:k.y,alpha:k.alpha});return k}},Oc=tc(1),Fb=tc(),cb=tc(0,1);
c.getTotalLength=Oc;c.getPointAtLength=Fb;c.getSubpath=function(a,c,b){if(1E-6>this.getTotalLength(a)-b)return cb(a,c).end;a=cb(a,b,1);return c?cb(a,c).end:a};la.getTotalLength=function(){if("path"==this.type)return this.node.getTotalLength?this.node.getTotalLength():Oc(this.attrs.path)};la.getPointAtLength=function(a){if("path"==this.type)return Fb(this.attrs.path,a)};la.getSubpath=function(a,b){if("path"==this.type)return c.getSubpath(this.attrs.path,a,b)};var Va=c.easing_formulas={linear:function(a){return a},
"<":function(a){return La(a,1.7)},">":function(a){return La(a,.48)},"<>":function(a){var c=.48-a/1.04,b=pa(.1734+c*c);a=b-c;a=La(ja(a),1/3)*(0>a?-1:1);c=-b-c;c=La(ja(c),1/3)*(0>c?-1:1);a=a+c+.5;return 3*(1-a)*a*a+a*a*a},backIn:function(a){return a*a*(2.70158*a-1.70158)},backOut:function(a){a-=1;return a*a*(2.70158*a+1.70158)+1},elastic:function(a){return a==!!a?a:La(2,-10*a)*na(2*(a-.075)*aa/.3)+1},bounce:function(a){a<1/2.75?a*=7.5625*a:a<2/2.75?(a-=1.5/2.75,a=7.5625*a*a+.75):a<2.5/2.75?(a-=2.25/
2.75,a=7.5625*a*a+.9375):(a-=2.625/2.75,a=7.5625*a*a+.984375);return a}};Va.easeIn=Va["ease-in"]=Va["<"];Va.easeOut=Va["ease-out"]=Va[">"];Va.easeInOut=Va["ease-in-out"]=Va["<>"];Va["back-in"]=Va.backIn;Va["back-out"]=Va.backOut;var Ia=[],fd=d.requestAnimationFrame||d.webkitRequestAnimationFrame||d.mozRequestAnimationFrame||d.oRequestAnimationFrame||d.msRequestAnimationFrame||function(a){setTimeout(a,16)},Zc=function(){for(var a=+new Date,b=0;b<Ia.length;b++){var f=Ia[b];if(!f.el.removed&&!f.paused){var r=
a-f.start,v=f.ms,C=f.easing,K=f.from,q=f.diff,d=f.to,g=f.el,s={},R,l={},$;f.initstatus?(r=(f.initstatus*f.anim.top-f.prev)/(f.percent-f.prev)*v,f.status=f.initstatus,delete f.initstatus,f.stop&&Ia.splice(b--,1)):f.status=(f.prev+r/v*(f.percent-f.prev))/f.anim.top;if(!(0>r))if(r<v){var n=C(r/v),A;for(A in K)if(K.hasOwnProperty(A)){switch(k[A]){case E:R=+K[A]+n*v*q[A];break;case "colour":R="rgb("+[fb(za(K[A].r+n*v*q[A].r)),fb(za(K[A].g+n*v*q[A].g)),fb(za(K[A].b+n*v*q[A].b))].join()+")";break;case "path":R=
[];r=0;for(C=K[A].length;r<C;r++){R[r]=[K[A][r][0]];d=1;for(l=K[A][r].length;d<l;d++)R[r][d]=(+K[A][r][d]+n*v*q[A][r][d]).toFixed(4);R[r]=R[r].join(" ")}R=R.join(" ");break;case "transform":if(q[A].real)for(R=[],r=0,C=K[A].length;r<C;r++)for(R[r]=[K[A][r][0]],d=1,l=K[A][r].length;d<l;d++)R[r][d]=K[A][r][d]+n*v*q[A][r][d];else R=function(a){return+K[A][a]+n*v*q[A][a]},R=[["m",R(0),R(1),R(2),R(3),R(4),R(5)]];break;case "csv":if("clip-rect"==A)for(R=[],r=4;r--;)R[r]=+K[A][r]+n*v*q[A][r];break;default:for(C=
[].concat(K[A]),R=[],r=g.ca[A].length;r--;)R[r]=+C[r]+n*v*q[A][r]}s[A]=R}g.attr(s);(function(a,c,b){setTimeout(function(){p("raphael.anim.frame."+a,c,b)})})(g.id,g,f.anim)}else{(function(a,b,f){setTimeout(function(){p("raphael.anim.frame."+b.id,b,f);p("raphael.anim.finish."+b.id,b,f);c.is(a,"function")&&a.call(b)})})(f.callback,g,f.anim);g.attr(d);Ia.splice(b--,1);if(1<f.repeat&&!f.next){for($ in d)d.hasOwnProperty($)&&(l[$]=f.totalOrigin[$]);f.el.attr(l);e(f.anim,f.el,f.anim.percents[0],null,f.totalOrigin,
f.repeat-1)}f.next&&!f.stop&&e(f.anim,f.el,f.next,null,f.totalOrigin,f.repeat)}}}c.svg&&g&&g.paper&&g.paper.safari();Ia.length&&fd(Zc)},fb=function(a){return 255<a?255:0>a?0:a};la.animateWith=function(a,b,f,r,v,k){if(this.removed)return k&&k.call(this),this;f=f instanceof g?f:c.animation(f,r,v,k);e(f,this,f.percents[0],null,this.attr());f=0;for(r=Ia.length;f<r;f++)if(Ia[f].anim==b&&Ia[f].el==a){Ia[r-1].start=Ia[f].start;break}return this};la.onAnimation=function(a){a?p.on("raphael.anim.frame."+this.id,
a):p.unbind("raphael.anim.frame."+this.id);return this};g.prototype.delay=function(a){var c=new g(this.anim,this.ms);c.times=this.times;c.del=+a||0;return c};g.prototype.repeat=function(a){var c=new g(this.anim,this.ms);c.del=this.del;c.times=J.floor(W(a,0))||1;return c};c.animation=function(a,b,f,r){if(a instanceof g)return a;if(c.is(f,"function")||!f)r=r||f||null,f=null;a=Object(a);b=+b||0;var v={},k,C;for(C in a)a.hasOwnProperty(C)&&T(C)!=C&&T(C)+"%"!=C&&(k=!0,v[C]=a[C]);return k?(f&&(v.easing=
f),r&&(v.callback=r),new g({100:v},b)):new g(a,b)};la.animate=function(a,b,f,r){if(this.removed)return r&&r.call(this),this;a=a instanceof g?a:c.animation(a,b,f,r);e(a,this,a.percents[0],null,this.attr());return this};la.setTime=function(a,c){a&&null!=c&&this.status(a,G(c,a.ms)/a.ms);return this};la.status=function(a,c){var b=[],f=0,r,v;if(null!=c)return e(a,this,-1,G(c,1)),this;for(r=Ia.length;f<r;f++)if(v=Ia[f],v.el.id==this.id&&(!a||v.anim==a)){if(a)return v.status;b.push({anim:v.anim,status:v.status})}return a?
0:b};la.pause=function(a){for(var c=0;c<Ia.length;c++)Ia[c].el.id!=this.id||a&&Ia[c].anim!=a||!1===p("raphael.anim.pause."+this.id,this,Ia[c].anim)||(Ia[c].paused=!0);return this};la.resume=function(a){for(var c=0;c<Ia.length;c++)if(Ia[c].el.id==this.id&&(!a||Ia[c].anim==a)){var b=Ia[c];!1!==p("raphael.anim.resume."+this.id,this,b.anim)&&(delete b.paused,this.status(b.anim,b.status))}return this};la.stop=function(a){for(var c=0;c<Ia.length;c++)Ia[c].el.id!=this.id||a&&Ia[c].anim!=a||!1!==p("raphael.anim.stop."+
this.id,this,Ia[c].anim)&&Ia.splice(c--,1);return this};p.on("raphael.remove",l);p.on("raphael.clear",l);la.toString=function(){return"Raphaël’s object"};la.toFront=function(){if(this.removed)return this;var a=c._engine.getNode(this),b=this.parent,f=this.followers,r;c._tofront(this,b)&&b.canvas.appendChild(a);a=0;for(b=f.length;a<b;a++)(r=f[a]).stalk&&r.el[r.stalk](this);return this};la.toBack=function(){if(this.removed)return this;var a=c._engine.getNode(this),b=this.parent,f=this.followers,r;c._toback(this,
b)&&b.canvas.insertBefore(a,b.canvas.firstChild);a=0;for(b=f.length;a<b;a++)(r=f[a]).stalk&&r.el[r.stalk](this);return this};la.insertAfter=function(a){if(this.removed)return this;var b=c._engine.getNode(this),f=c._engine.getLastNode(a),r=a.parent.canvas,v=this.followers,k;f.nextSibling?r.insertBefore(b,f.nextSibling):r.appendChild(b);c._insertafter(this,a,this.parent,a.parent);b=0;for(f=v.length;b<f;b++)(k=v[b]).stalk&&k.el[k.stalk](a);return this};la.insertBefore=function(a){if(this.removed)return this;
var b=c._engine.getNode(this),f=c._engine.getNode(a),r=this.followers,v;a.parent.canvas.insertBefore(b,f);c._insertbefore(this,a,this.parent,a.parent);this.parent=a.parent;b=0;for(f=r.length;b<f;b++)(v=r[b]).stalk&&v.el[v.stalk](a);return this};la.appendChild=function(a){if(this.removed||"group"!==this.type)return this;var b=this.followers,f,r,v;if(a.parent===this)return a.toFront(),this;r=c._engine.getNode(a);c._tear(a,a.parent);this.canvas.appendChild(r);a.parent=this;!this.bottom&&(this.bottom=
a);a.prev=this.top;a.next=null;this.top&&(this.top.next=a);this.top=a;r=0;for(v=b.length;r<v;r++)(f=b[r]).stalk&&f.el[f.stalk](a);return this};la.removeChild=function(a){if(this.removed||"group"!==this.type||a.parent!==this)return this;var b=c._engine.getNode(a),f=this.paper;c._tear(a,this);f.canvas.appendChild(b);this.parent=f;!f.bottom&&(f.bottom=this);(this.prev=f.top)&&(f.top.next=this);f.top=this;this.next=null;return this};var Hb=function(a){this.items=[];this.length=0;this.type="set";if(a)for(var c=
0,b=a.length;c<b;c++)!a[c]||a[c].constructor!=la.constructor&&a[c].constructor!=Hb||(this[this.items.length]=this.items[this.items.length]=a[c],this.length++)},jb=Hb.prototype;jb.push=function(){for(var a,c,b=0,f=arguments.length;b<f;b++)!(a=arguments[b])||a.constructor!=la.constructor&&a.constructor!=Hb||(c=this.items.length,this[c]=this.items[c]=a,this.length++);return this};jb.pop=function(){this.length&&delete this[this.length--];return this.items.pop()};jb.forEach=function(a,c){for(var b=0,f=
this.items.length;b<f&&!1!==a.call(c,this.items[b],b);b++);return this};for(var kb in la)la.hasOwnProperty(kb)&&(jb[kb]=function(a){return function(){var c=arguments;return this.forEach(function(b){b[a][N](b,c)})}}(kb));jb.attr=function(a,b){if(a&&c.is(a,n)&&c.is(a[0],"object"))for(var f=0,r=a.length;f<r;f++)this.items[f].attr(a[f]);else for(f=0,r=this.items.length;f<r;f++)this.items[f].attr(a,b);return this};jb.clear=function(){for(;this.length;)this.pop()};jb.splice=function(a,c,b){a=0>a?W(this.length+
a,0):a;c=W(0,G(this.length-a,isNaN(c)&&this.length||c));var f=[],r=[],v=[],k;for(k=2;k<arguments.length;k++)v.push(arguments[k]);for(k=0;k<c;k++)r.push(this[a+k]);for(;k<this.length-a;k++)f.push(this[a+k]);var C=v.length;for(k=0;k<C+f.length;k++)this.items[a+k]=this[a+k]=k<C?v[k]:f[k-C];for(k=this.items.length=this.length-=c-C;this[k];)delete this[k++];return new Hb(r)};jb.exclude=function(a){for(var c=0,b=this.length;c<b;c++)if(this[c]==a)return this.splice(c,1),!0};jb.animate=function(a,b,f,r){!c.is(f,
"function")&&f||(r=f||null);var v=this.items.length,k=v,C=this,e;if(!v)return this;r&&(e=function(){!--v&&r.call(C)});f=c.is(f,"string")?f:e;b=c.animation(a,b,f,e);for(a=this.items[--k].animate(b);k--;)this.items[k]&&!this.items[k].removed&&this.items[k].animateWith(a,b,b);return this};jb.insertAfter=function(a){for(var c=this.items.length;c--;)this.items[c].insertAfter(a);return this};jb.getBBox=function(){for(var a=[],c=[],b=[],f=[],r=this.items.length;r--;)if(!this.items[r].removed){var v=this.items[r].getBBox();
a.push(v.x);c.push(v.y);b.push(v.x+v.width);f.push(v.y+v.height)}a=G[N](0,a);c=G[N](0,c);b=W[N](0,b);f=W[N](0,f);return{x:a,y:c,x2:b,y2:f,width:b-a,height:f-c}};jb.clone=function(a){a=new Hb;for(var c=0,b=this.items.length;c<b;c++)a.push(this.items[c].clone());return a};jb.toString=function(){return"Raphaël‘s set"};jb.glow=function(a){var c=this.paper.set();this.forEach(function(b,f){var r=b.glow(a);null!=r&&r.forEach(function(a,b){c.push(a)})});return c};c.registerFont=function(a){if(!a.face)return a;
this.fonts=this.fonts||{};var c={w:a.w,face:{},glyphs:{}},b=a.face["font-family"],f;for(f in a.face)a.face.hasOwnProperty(f)&&(c.face[f]=a.face[f]);this.fonts[b]?this.fonts[b].push(c):this.fonts[b]=[c];if(!a.svg){c.face["units-per-em"]=q(a.face["units-per-em"],10);for(var r in a.glyphs)if(a.glyphs.hasOwnProperty(r)&&(b=a.glyphs[r],c.glyphs[r]={w:b.w,k:{},d:b.d&&"M"+b.d.replace(/[mlcxtrv]/g,function(a){return{l:"L",c:"C",x:"z",t:"m",r:"l",v:"c"}[a]||"M"})+"z"},b.k))for(var v in b.k)b.hasOwnProperty(v)&&
(c.glyphs[r].k[v]=b.k[v])}return a};ba.getFont=function(a,b,f,r){r=r||"normal";f=f||"normal";b=+b||{normal:400,bold:700,lighter:300,bolder:800}[b]||400;if(c.fonts){var v=c.fonts[a];if(!v){a=new RegExp("(^|\\s)"+a.replace(/[^\w\d\s+!~.:_-]/g,"")+"(\\s|$)","i");for(var k in c.fonts)if(c.fonts.hasOwnProperty(k)&&a.test(k)){v=c.fonts[k];break}}var C;if(v)for(k=0,a=v.length;k<a&&(C=v[k],C.face["font-weight"]!=b||C.face["font-style"]!=f&&C.face["font-style"]||C.face["font-stretch"]!=r);k++);return C}};
ba.print=function(a,b,f,r,v,k,C){k=k||"middle";C=W(G(C||0,1),-1);var e=M(f).split(""),K=0,q=0,d="";c.is(r,f)&&(r=this.getFont(r));if(r){f=(v||16)/r.face["units-per-em"];var g=r.face.bbox.split(Za);v=+g[0];var R=g[3]-g[1],s=0;k=+g[1]+("baseline"==k?R+ +r.face.descent:R/2);for(var g=0,l=e.length;g<l;g++){if("\n"==e[g])q=A=K=0,s+=R;else var $=q&&r.glyphs[e[g-1]]||{},A=r.glyphs[e[g]],K=K+(q?($.w||r.w)+($.k&&$.k[e[g]]||0)+r.w*C:0),q=1;A&&A.d&&(d+=c.transformPath(A.d,["t",K*f,s*f,"s",f,f,v,k,"t",(a-v)/
f,(b-k)/f]))}}return this.path(d).attr({fill:"#000",stroke:"none"})};ba.add=function(a){if(c.is(a,"array"))for(var b=this.set(),f=0,r=a.length,v;f<r;f++)v=a[f]||{},da.hasOwnProperty(v.type)&&b.push(this[v.type]().attr(v));return b};c.format=function(a,b){var f=c.is(b,n)?[0].concat(b):arguments;a&&c.is(a,"string")&&f.length-1&&(a=a.replace(Da,function(a,c){return null==f[++c]?"":f[c]}));return a||""};c.fullfill=function(){var a=/\{([^\}]+)\}/g,c=/(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,
b=function(a,b,f){var r=f;b.replace(c,function(a,c,b,f,v){c=c||f;r&&(c in r&&(r=r[c]),"function"==typeof r&&v&&(r=r()))});return r=(null==r||r==f?a:r)+""};return function(c,f){return String(c).replace(a,function(a,c){return b(a,c,f)})}}();c.ninja=function(){ga?u.win.Raphael=U:delete Raphael;return c};var md=c.vml&&.5||0;c.crispBound=Ta(function(a,c,b,f,r){var v={},k;a=a||0;c=c||0;b=b||0;f=f||0;r=r||0;k=r%2/2+md;v.x=za(a+k)-k;v.y=za(c+k)-k;v.width=za(a+b+k)-k-v.x;v.height=za(c+f+k)-k-v.y;v["stroke-width"]=
r;0===v.width&&0!==b&&(v.width=1);0===v.height&&0!==f&&(v.height=1);return v},c);la.crisp=function(){var a=this.attrs,b,f=this.attr(["x","y","width","height","stroke-width"]),f=c.crispBound(f.x,f.y,f.width,f.height,f["stroke-width"]);for(b in f)a[b]===f[b]&&delete f[b];return this.attr(f)};c.st=jb;c.define=function(a,b,f,r,v,k){var C;if(c.is(a,n))for(k=0,C=a.length;k<C;k++)c.define(a[k]);else if(c.is(a,"object"))c.define(a.name,a[a.name],a.ca,a.fn,a.e,a.data);else if(a&&!c.fn[a])return c.fn[a]=function(){var k=
arguments,C=b.apply(this,k),e;if(r&&c.is(r,"object"))for(e in r)C[e]=r[e];if(v&&c.is(v,"object"))for(e in v)C[e]&&C[e](v[e]);if(f){if(c.is(f,"function"))C.ca[a]=f;else for(e in f)C.ca[e]=f[e];C.ca[a]&&(c._lastArgIfGroup(k,!0),C.attr(a,V.call(k)))}return C},f&&(c.fn[a].ca=f),r&&(c.fn[a].fn=r),v&&(c.fn[a].e=v),k&&(c.fn[a].data=k),c.fn[a]};(function(a,b,f){function r(){/in/.test(a.readyState)?setTimeout(r,9):c.eve("raphael.DOMload")}null==a.readyState&&a.addEventListener&&(a.addEventListener(b,f=function(){a.removeEventListener(b,
f,!1);a.readyState="complete"},!1),a.readyState="loading");r()})(document,"DOMContentLoaded");p.on("raphael.DOMload",function(){m=!0});(function(){if(c.svg){var a=String,b=parseFloat,f=parseInt,r=Math,v=r.max,k=r.abs,C=r.pow,e=r.sqrt,K=/[, ]+/,q=!(!/AppleWebKit/.test(c._g.win.navigator.userAgent)||/Chrome/.test(c._g.win.navigator.userAgent)&&!(29>c._g.win.navigator.appVersion.match(/Chrome\/(\d+)\./)[1])),d=c.eve,g={block:"M5,0 0,2.5 5,5z",classic:"M5,0 0,2.5 5,5 3.5,3 3.5,2z",diamond:"M2.5,0 5,2.5 2.5,5 0,2.5z",
open:"M6,1 1,3.5 6,6",oval:"M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"},R={};c.toString=function(){return"Your browser supports SVG.\nYou are running Raphaël "+this.version};c._url="";var s=function(a,c){var b=a.gradient;if(b){if(b===c)return;b.refCount--;b.refCount||b.parentNode.removeChild(b);delete a.gradient}c&&(a.gradient=c,c.refCount++)},l=c._createNode=function(b,f){if(f){"string"==typeof b&&(b=l(b));for(var r in f)f.hasOwnProperty(r)&&("xlink:"==r.substring(0,6)?b.setAttributeNS("http://www.w3.org/1999/xlink",
r.substring(6),a(f[r])):b.setAttribute(r,a(f[r])))}else b=c._g.doc.createElementNS("http://www.w3.org/2000/svg",b);return b},$={userSpaceOnUse:"userSpaceOnUse",objectBoundingBox:"objectBoundingBox"},A={pad:"pad",redlect:"reflect",repeat:"repeat"},n=function(f,K){if(!f.paper||!f.paper.defs)return 0;var q="linear",d=f.paper,g=(d.id+"-"+K).replace(/[\(\)\s%:,\xb0#]/g,"_"),R=.5,n=.5,J,m,fa,G,O,p=f.node,H=p.style,t=c._g.doc.getElementById(g);if(!t){K=a(K).replace(c._radial_gradient,function(a,c){q="radial";
c=c&&c.split(",")||[];G=c[5];O=c[6];var f=c[0],r=c[1],v=c[2],k=c[3],K=c[4],d=f&&r,g;v&&(J=/\%/.test(v)?v:b(v));if(G===$.userSpaceOnUse)return d&&(R=f,n=r),k&&K&&(m=k,fa=K,d||(R=m,n=fa)),"";d&&(R=b(f),n=b(r),f=2*(.5<n)-1,.25<(g=C(R-.5,2))+C(n-.5,2)&&.25>g&&(n=e(.25-g)*f+.5)&&.5!==n&&(n=n.toFixed(5)-1E-5*f));k&&K&&(m=b(k),fa=b(K),f=2*(.5<fa)-1,.25<(g=C(m-.5,2))+C(fa-.5,2)&&.25>g&&(fa=e(.25-g)*f+.5)&&.5!==fa&&(fa=fa.toFixed(5)-1E-5*f),d||(R=m,n=fa));return""});K=K.split(/\s*\-\s*/);if("linear"==q){var t=
K.shift(),h=t.match(/\((.*)\)/),u,h=h&&h[1]&&h[1].split(/\s*\,\s*/),t=-b(t);if(isNaN(t))return null;h&&h.length?(h[0]in $?(G=h.shift(),h[0]in A&&(O=h.shift())):(h[4]&&(G=h[4]),h[5]&&(O=h[5])),u=[h[0]||"0%",h[1]||"0%",h[2]||"100%",h[3]||"0%"]):(u=[0,0,r.cos(c.rad(t)),r.sin(c.rad(t))],t=1/(v(k(u[2]),k(u[3]))||1),u[2]*=t,u[3]*=t,0>u[2]&&(u[0]=-u[2],u[2]=0),0>u[3]&&(u[1]=-u[3],u[3]=0))}h=c._parseDots(K);if(!h)return null;t=l(q+"Gradient",{id:g});t.refCount=0;G in $&&t.setAttribute("gradientUnits",a(G));
O in A&&t.setAttribute("spreadMethod",a(O));"radial"===q?(void 0!==J&&t.setAttribute("r",a(J)),void 0!==m&&void 0!==fa&&(t.setAttribute("cx",a(m)),t.setAttribute("cy",a(fa))),t.setAttribute("fx",a(R)),t.setAttribute("fy",a(n))):l(t,{x1:u[0],y1:u[1],x2:u[2],y2:u[3]});u=0;for(var lc=h.length;u<lc;u++)t.appendChild(l("stop",{offset:h[u].offset?h[u].offset:u?"100%":"0%","stop-color":h[u].color||"#fff","stop-opacity":void 0===h[u].opacity?1:h[u].opacity}));d.defs.appendChild(t)}s(f,t);l(p,{fill:"url('"+
c._url+"#"+g+"')",opacity:1,"fill-opacity":1});H.fill="";H.opacity=1;return H.fillOpacity=1},m=function(a){var c=a.getBBox(1);l(a.pattern,{patternTransform:a.matrix.invert()+" translate("+c.x+","+c.y+")"})},J=function(b,f,r){if("path"==b.type){for(var v=a(f).toLowerCase().split("-"),k=b.paper,C=r?"end":"start",e=b.node,K=b.attrs,q=K["stroke-width"],d=v.length,s="classic",$,A,n=3,m=3,J=5;d--;)switch(v[d]){case "block":case "classic":case "oval":case "diamond":case "open":case "none":s=v[d];break;case "wide":m=
5;break;case "narrow":m=2;break;case "long":n=5;break;case "short":n=2}"open"==s?(n+=2,m+=2,J+=2,$=1,A=r?4:1,v={fill:"none",stroke:K.stroke}):(A=$=n/2,v={fill:K.stroke,stroke:"none"});b._.arrows?r?(b._.arrows.endPath&&R[b._.arrows.endPath]--,b._.arrows.endMarker&&R[b._.arrows.endMarker]--):(b._.arrows.startPath&&R[b._.arrows.startPath]--,b._.arrows.startMarker&&R[b._.arrows.startMarker]--):b._.arrows={};if("none"!=s){var d="raphael-marker-"+s,fa="raphael-marker-"+C+s+n+m+"-obj"+b.id;c._g.doc.getElementById(d)?
R[d]++:(k.defs.appendChild(l(l("path"),{"stroke-linecap":"round",d:g[s],id:d})),R[d]=1);var G=c._g.doc.getElementById(fa);G?(R[fa]++,n=G.getElementsByTagName("use")[0]):(G=l(l("marker"),{id:fa,markerHeight:m,markerWidth:n,orient:"auto",refX:A,refY:m/2}),n=l(l("use"),{"xlink:href":"#"+d,transform:(r?"rotate(180 "+n/2+" "+m/2+") ":"")+"scale("+n/J+","+m/J+")","stroke-width":(1/((n/J+m/J)/2)).toFixed(4)}),G.appendChild(n),k.defs.appendChild(G),R[fa]=1);l(n,v);k=$*("diamond"!=s&&"oval"!=s);r?(r=b._.arrows.startdx*
q||0,q=c.getTotalLength(K.path)-k*q):(r=k*q,q=c.getTotalLength(K.path)-(b._.arrows.enddx*q||0));v={};v["marker-"+C]="url('"+c._url+"#"+fa+"')";if(q||r)v.d=c.getSubpath(K.path,r,q);l(e,v);b._.arrows[C+"Path"]=d;b._.arrows[C+"Marker"]=fa;b._.arrows[C+"dx"]=k;b._.arrows[C+"Type"]=s;b._.arrows[C+"String"]=f}else r?(r=b._.arrows.startdx*q||0,q=c.getTotalLength(K.path)-r):(r=0,q=c.getTotalLength(K.path)-(b._.arrows.enddx*q||0)),b._.arrows[C+"Path"]&&l(e,{d:c.getSubpath(K.path,r,q)}),delete b._.arrows[C+
"Path"],delete b._.arrows[C+"Marker"],delete b._.arrows[C+"dx"],delete b._.arrows[C+"Type"],delete b._.arrows[C+"String"];for(v in R)R.hasOwnProperty(v)&&!R[v]&&(b=c._g.doc.getElementById(v))&&b.parentNode.removeChild(b)}},fa={"":[0],none:[0],"-":[3,1],".":[1,1],"-.":[3,1,1,1],"-..":[3,1,1,1,1,1],". ":[1,3],"- ":[4,3],"--":[8,3],"- .":[4,3,1,3],"--.":[8,3,1,3],"--..":[8,3,1,3,1,3]},G=function(b,f,r){var v=fa[a(f).toLowerCase()],k,C;if(f=v||void 0!==f&&[].concat(f)){k=b.attrs["stroke-width"]||1;r=
{round:k,square:k,butt:0}[b.attrs["stroke-linecap"]||r["stroke-linecap"]]||0;C=f.length;k=v?k:1;for(v=[];C--;)v[C]=f[C]*k+(C%2?1:-1)*r,0>v[C]&&(v[C]=0);c.is(f,"array")&&l(b.node,{"stroke-dasharray":v.join(",")})}},O=function(a,c){for(var b in c)d("raphael.attr."+b+"."+a.id,a,c[b],b),a.ca[b]&&a.attr(b,c[b])},p=c._setFillAndStroke=function(b,r){if(b.paper.canvas){var C=b.node,e=b.attrs,d=b.paper,g=C.style,R=g.visibility;g.visibility="hidden";for(var $ in r)if(r.hasOwnProperty($)&&c._availableAttrs.hasOwnProperty($)){var A=
r[$];e[$]=A;switch($){case "blur":b.blur(A);break;case "href":case "title":case "target":var fa=C.parentNode;if("a"!=fa.tagName.toLowerCase()){if(""==A)break;var O=l("a");O.raphael=!0;O.raphaelid=C.raphaelid;fa.insertBefore(O,C);O.appendChild(C);fa=O}"target"==$?fa.setAttributeNS("http://www.w3.org/1999/xlink","show","blank"==A?"new":A):fa.setAttributeNS("http://www.w3.org/1999/xlink",$,A);C.titleNode=fa;break;case "cursor":g.cursor=A;break;case "transform":b.transform(A);break;case "rotation":c.is(A,
"array")?b.rotate.apply(b,A):b.rotate(A);break;case "arrow-start":J(b,A);break;case "arrow-end":J(b,A,1);break;case "clip-path":var h=!0;case "clip-rect":fa=!h&&a(A).split(K);b._.clipispath=!!h;if(h||4==fa.length){b.clip&&b.clip.parentNode.parentNode.removeChild(b.clip.parentNode);var O=l("clipPath"),p=l(h?"path":"rect");O.id=c.createUUID();l(p,h?{d:A?e["clip-path"]=c._pathToAbsolute(A):c._availableAttrs.path,fill:"none"}:{x:fa[0],y:fa[1],width:fa[2],height:fa[3],transform:b.matrix.invert()});O.appendChild(p);
d.defs.appendChild(O);l(C,{"clip-path":"url('"+c._url+"#"+O.id+"')"});b.clip=p}!A&&(A=C.getAttribute("clip-path"))&&((A=c._g.doc.getElementById(A.replace(/(^url\(#|\)$)/g,"")))&&A.parentNode.removeChild(A),l(C,{"clip-path":""}),delete b.clip);break;case "path":"path"==b.type&&(l(C,{d:A?e.path=c._pathToAbsolute(A):c._availableAttrs.path}),b._.dirty=1,b._.arrows&&("startString"in b._.arrows&&J(b,b._.arrows.startString),"endString"in b._.arrows&&J(b,b._.arrows.endString,1)));break;case "width":if(C.setAttribute($,
A),b._.dirty=1,e.fx)$="x",A=e.x;else break;case "x":e.fx&&(A=-e.x-(e.width||0));case "rx":if("rx"==$&&"rect"==b.type)break;case "cx":C.setAttribute($,A);b.pattern&&m(b);b._.dirty=1;break;case "height":if(C.setAttribute($,A),b._.dirty=1,e.fy)$="y",A=e.y;else break;case "y":e.fy&&(A=-e.y-(e.height||0));case "ry":if("ry"==$&&"rect"==b.type)break;case "cy":C.setAttribute($,A);b.pattern&&m(b);b._.dirty=1;break;case "r":"rect"==b.type?l(C,{rx:A,ry:A}):C.setAttribute($,A);b._.dirty=1;break;case "src":"image"==
b.type&&C.setAttributeNS("http://www.w3.org/1999/xlink","href",A);break;case "stroke-width":if(1!=b._.sx||1!=b._.sy)A/=v(k(b._.sx),k(b._.sy))||1;d._vbSize&&(A*=d._vbSize);q&&0===A&&(A=1E-6);C.setAttribute($,A);e["stroke-dasharray"]&&G(b,e["stroke-dasharray"],r);b._.arrows&&("startString"in b._.arrows&&J(b,b._.arrows.startString),"endString"in b._.arrows&&J(b,b._.arrows.endString,1));break;case "stroke-dasharray":G(b,A,r);break;case "fill":var H=a(A).match(c._ISURL);if(H){var O=l("pattern"),u=l("image");
O.id=c.createUUID();l(O,{x:0,y:0,patternUnits:"userSpaceOnUse",height:1,width:1});l(u,{x:0,y:0,"xlink:href":H[1]});O.appendChild(u);(function(a){c._preload(H[1],function(){var c=this.offsetWidth,b=this.offsetHeight;l(a,{width:c,height:b});l(u,{width:c,height:b});d.safari()})})(O);d.defs.appendChild(O);g.fill="url('"+c._url+"#"+O.id+"')";l(C,{fill:g.fill});b.pattern=O;b.pattern&&m(b);break}fa=c.getRGB(A);if(!fa.error)delete r.gradient,delete e.gradient,!c.is(e.opacity,"undefined")&&c.is(r.opacity,
"undefined")&&l(C,{opacity:e.opacity}),!c.is(e["fill-opacity"],"undefined")&&c.is(r["fill-opacity"],"undefined")&&l(C,{"fill-opacity":e["fill-opacity"]}),b.gradient&&s(b);else if(("circle"==b.type||"ellipse"==b.type||"r"!=a(A).charAt())&&n(b,A)){if("opacity"in e||"fill-opacity"in e)if(fa=c._g.doc.getElementById(C.getAttribute("fill").replace(/^url\(#|\)$/g,"")))fa=fa.getElementsByTagName("stop"),l(fa[fa.length-1],{"stop-opacity":("opacity"in e?e.opacity:1)*("fill-opacity"in e?e["fill-opacity"]:1)});
e.gradient=A;e.fill="none";g.fill="";break}fa.hasOwnProperty("opacity")?(l(C,{"fill-opacity":g.fillOpacity=1<fa.opacity?fa.opacity/100:fa.opacity}),b._.fillOpacityDirty=!0):b._.fillOpacityDirty&&c.is(e["fill-opacity"],"undefined")&&c.is(r["fill-opacity"],"undefined")&&(C.removeAttribute("fill-opacity"),g.fillOpacity="",delete b._.fillOpacityDirty);case "stroke":fa=c.getRGB(A);C.setAttribute($,fa.hex);g[$]=fa.hex;"stroke"==$&&(fa.hasOwnProperty("opacity")?(l(C,{"stroke-opacity":g.strokeOpacity=1<fa.opacity?
fa.opacity/100:fa.opacity}),b._.strokeOpacityDirty=!0):b._.strokeOpacityDirty&&c.is(e["stroke-opacity"],"undefined")&&c.is(r["stroke-opacity"],"undefined")&&(C.removeAttribute("stroke-opacity"),g.strokeOpacity="",delete b._.strokeOpacityDirty),b._.arrows&&("startString"in b._.arrows&&J(b,b._.arrows.startString),"endString"in b._.arrows&&J(b,b._.arrows.endString,1)));break;case "gradient":"circle"!=b.type&&"ellipse"!=b.type&&"r"==a(A).charAt()||n(b,A);break;case "line-height":case "vertical-align":break;
case "visibility":"hidden"===A?b.hide():b.show();break;case "opacity":e.gradient&&!e.hasOwnProperty("stroke-opacity")&&l(C,{"stroke-opacity":1<A?A/100:A});case "fill-opacity":if(e.gradient){if(fa=c._g.doc.getElementById(C.getAttribute("fill").replace(/^url\(#|\)$/g,"")))fa=fa.getElementsByTagName("stop"),l(fa[fa.length-1],{"stop-opacity":A});break}default:"font-size"==$&&(A=f(A,10)+"px"),fa=$.replace(/(\-.)/g,function(a){return a.substring(1).toUpperCase()}),g[fa]=A,b._.dirty=1,C.setAttribute($,A)}}"text"===
b.type&&t(b,r);g.visibility=R}},t=function(f,r){if("text"==f.type&&(r.hasOwnProperty("text")||r.hasOwnProperty("font")||r.hasOwnProperty("font-size")||r.hasOwnProperty("x")||r.hasOwnProperty("y")||r.hasOwnProperty("line-height")||r.hasOwnProperty("vertical-align"))){var v=f.attrs,k=f.node,C=k.firstChild&&c._g.doc.defaultView.getComputedStyle(k.firstChild,"")?b(c._g.doc.defaultView.getComputedStyle(k.firstChild,"").getPropertyValue("font-size")):10,e=b(r["line-height"]||v["line-height"])||1.2*C,K=
v.hasOwnProperty("vertical-align")?v["vertical-align"]:"middle";isNaN(e)&&(e=1.2*C);c.is(r.text,"array")&&(r.text=r.text.join("<br>"));K="top"===K?-.5:"bottom"===K?.5:0;if(r.hasOwnProperty("text")&&(r.text!==v.text||f._textdirty)){for(v.text=r.text;k.firstChild;)k.removeChild(k.firstChild);for(var q=a(r.text).split(/\n|<br\s*?\/?>/ig),C=[],d,g=0,R=q.length;g<R;g++)d=l("tspan"),g?l(d,{dy:e,x:v.x}):l(d,{dy:e*q.length*K,x:v.x}),q[g]||(d.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space",
"preserve"),q[g]=" "),d.appendChild(c._g.doc.createTextNode(q[g])),k.appendChild(d),C[g]=d;f._textdirty=!1}else for(C=k.getElementsByTagName("tspan"),g=0,R=C.length;g<R;g++)g?l(C[g],{dy:e,x:v.x}):l(C[0],{dy:e*C.length*K,x:v.x});l(k,{x:v.x,y:v.y});f._.dirty=1;k=f._getBBox();e=v.y-(k.y+k.height/2);if(k.isCalculated)switch(v["vertical-align"]){case "top":e=.75*k.height;break;case "bottom":e=-(.25*k.height);break;default:e=v.y-(k.y+.25*k.height)}e&&c.is(e,"finite")&&C[0]&&l(C[0],{dy:e})}},H=function(a,
b,f){f=f||b;f.canvas&&f.canvas.appendChild(a);this.node=this[0]=a;a.raphael=!0;a.raphaelid=this.id=c._oid++;this.matrix=c.matrix();this.realPath=null;this.attrs=this.attrs||{};this.followers=this.followers||[];this.paper=b;this.ca=this.customAttributes=this.customAttributes||new b._CustomAttributes;this._={transform:[],sx:1,sy:1,deg:0,dx:0,dy:0,dirty:1};this.parent=f;!f.bottom&&(f.bottom=this);(this.prev=f.top)&&(f.top.next=this);f.top=this;this.next=null},h=c.el;H.prototype=h;h.constructor=H;c._engine.getNode=
function(a){a=a.node||a[0].node;return a.titleNode||a};c._engine.getLastNode=function(a){a=a.node||a[a.length-1].node;return a.titleNode||a};h.rotate=function(c,f,r){if(this.removed)return this;c=a(c).split(K);c.length-1&&(f=b(c[1]),r=b(c[2]));c=b(c[0]);null==r&&(f=r);if(null==f||null==r)r=this.getBBox(1),f=r.x+r.width/2,r=r.y+r.height/2;this.transform(this._.transform.concat([["r",c,f,r]]));return this};h.scale=function(c,f,r,v){var k;if(this.removed)return this;c=a(c).split(K);c.length-1&&(f=b(c[1]),
r=b(c[2]),v=b(c[3]));c=b(c[0]);null==f&&(f=c);null==v&&(r=v);if(null==r||null==v)k=this.getBBox(1);r=null==r?k.x+k.width/2:r;v=null==v?k.y+k.height/2:v;this.transform(this._.transform.concat([["s",c,f,r,v]]));return this};h.translate=function(c,f){if(this.removed)return this;c=a(c).split(K);c.length-1&&(f=b(c[1]));c=b(c[0])||0;this.transform(this._.transform.concat([["t",c,+f||0]]));return this};h.transform=function(a){var b=this._;if(null==a)return b.transform;c._extractTransform(this,a);this.clip&&
!b.clipispath&&l(this.clip,{transform:this.matrix.invert()});this.pattern&&m(this);this.node&&l(this.node,{transform:this.matrix});if(1!=b.sx||1!=b.sy)a=this.attrs.hasOwnProperty("stroke-width")?this.attrs["stroke-width"]:1,this.attr({"stroke-width":a});return this};h.hide=function(){!this.removed&&this.paper.safari(this.node.style.display="none");return this};h.show=function(){!this.removed&&this.paper.safari(this.node.style.display="");return this};h.remove=function(){if(!this.removed&&this.parent.canvas){var a=
c._engine.getNode(this),b=this.paper,f=b.defs;b.__set__&&b.__set__.exclude(this);d.unbind("raphael.*.*."+this.id);for(this.gradient&&f&&s(this);f=this.followers.pop();)f.el.remove();for(;f=this.bottom;)f.remove();this._drag&&this.undrag();if(this.events)for(;f=this.events.pop();)f.unbind();this.parent.canvas.removeChild(a);this.removeData();delete b._elementsById[this.id];c._tear(this,this.parent);for(f in this)this[f]="function"===typeof this[f]?c._removedFactory(f):null;this.removed=!0}};h._getBBox=
function(){var a=this.node,c={},b=this.attrs,f,r;"none"===a.style.display&&(this.show(),r=!0);try{c=a.getBBox(),"text"==this.type&&(void 0===c.x&&(c.isCalculated=!0,f=b["text-anchor"],c.x=(b.x||0)-c.width*("start"===f?0:"middle"===f?.5:1)),void 0===c.y&&(c.isCalculated=!0,f=b["vertical-align"],c.y=(b.y||0)-c.height*("bottom"===f?1:"middle"===f?.5:0)))}catch(v){}finally{c=c||{}}r&&this.hide();return c};h.attr=function(a,b){if(this.removed)return this;if(null==a){var f={},r;for(r in this.attrs)this.attrs.hasOwnProperty(r)&&
(f[r]=this.attrs[r]);f.gradient&&"none"==f.fill&&(f.fill=f.gradient)&&delete f.gradient;f.transform=this._.transform;f.visibility="none"===this.node.style.display?"hidden":"visible";return f}if(null==b&&c.is(a,"string")){if("fill"==a&&"none"==this.attrs.fill&&this.attrs.gradient)return this.attrs.gradient;if("transform"==a)return this._.transform;if("visibility"==a)return"none"===this.node.style.display?"hidden":"visible";var f=a.split(K),v={},k=0;for(r=f.length;k<r;k++)a=f[k],a in this.attrs?v[a]=
this.attrs[a]:c.is(this.ca[a],"function")?v[a]=this.ca[a].def:v[a]=c._availableAttrs[a];return r-1?v:v[f[0]]}if(null==b&&c.is(a,"array")){v={};k=0;for(r=a.length;k<r;k++)v[a[k]]=this.attr(a[k]);return v}null!=b?(f={},f[a]=b):null!=a&&c.is(a,"object")&&(f=a);for(k in f)d("raphael.attr."+k+"."+this.id,this,f[k],k);var C={};for(k in this.ca)if(this.ca[k]&&f.hasOwnProperty(k)&&c.is(this.ca[k],"function")&&!this.ca["_invoked"+k]){this.ca["_invoked"+k]=!0;r=this.ca[k].apply(this,[].concat(f[k]));delete this.ca["_invoked"+
k];for(v in r)r.hasOwnProperty(v)&&(f[v]=r[v]);this.attrs[k]=f[k];!1===r&&(C[k]=f[k],delete f[k])}p(this,f);var e,k=0;for(r=this.followers.length;k<r;k++)e=this.followers[k],e.cb&&!e.cb.call(e.el,f,this)||e.el.attr(f);for(v in C)f[v]=C[v];return this};h.blur=function(a){if(0!==+a){var b=l("filter"),f=l("feGaussianBlur");this.attrs.blur=a;b.id=c.createUUID();l(f,{stdDeviation:+a||1.5});b.appendChild(f);this.paper.defs.appendChild(b);this._blur=b;l(this.node,{filter:"url('"+c._url+"#"+b.id+"')"})}else this._blur&&
(this._blur.parentNode.removeChild(this._blur),delete this._blur,delete this.attrs.blur),this.node.removeAttribute("filter")};h.on=function(a,b){if(this.removed)return this;var f=b;c.supportsTouch&&(a=c._touchMap[a]||"click"===a&&"touchstart"||a,f=function(a){a.preventDefault();b()});this.node["on"+a]=f;return this};c._engine.path=function(a,c,b){var f=l("path");a=new H(f,a,b);a.type="path";p(a,c);O(a,c);return a};c._engine.group=function(a,c,b){var f=l("g");a=new H(f,a,b);a.type="group";a.canvas=
a.node;a.top=a.bottom=null;a._id=c||"";c&&f.setAttribute("class","raphael-group-"+a.id+"-"+c);return a};c._engine.circle=function(a,c,b){var f=l("circle");a=new H(f,a,b);a.type="circle";p(a,c);O(a,c);return a};c._engine.rect=function(a,c,b){var f=l("rect");a=new H(f,a,b);a.type="rect";c.rx=c.ry=c.r;p(a,c);O(a,c);return a};c._engine.ellipse=function(a,c,b){var f=l("ellipse");a=new H(f,a,b);a.type="ellipse";p(a,c);O(a,c);return a};c._engine.image=function(a,c,b){var f=l("image");a=new H(f,a,b);a.type=
"image";f.setAttribute("preserveAspectRatio","none");p(a,c);O(a,c);return a};c._engine.text=function(a,c,b){var f=l("text");a=new H(f,a,b);a.type="text";a._textdirty=!0;p(a,c);O(a,c);return a};c._engine.setSize=function(a,c){this.width=a||this.width;this.height=c||this.height;this.canvas.setAttribute("width",this.width);this.canvas.setAttribute("height",this.height);this._viewBox&&this.setViewBox.apply(this,this._viewBox);return this};c._engine.create=function(){var a=c._getContainer.apply(0,arguments),
b=a&&a.container,f=a.x,r=a.y,v=a.width,a=a.height;if(!b)throw Error("SVG container not found.");var k=l("svg"),C,f=f||0,r=r||0,v=v||512,a=a||342;l(k,{height:a,version:1.1,width:v,xmlns:"http://www.w3.org/2000/svg"});1==b?(k.style.cssText="overflow:hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);-webkit-user-select:none;-moz-user-select:-moz-none;-khtml-user-select:none;-ms-user-select:none;user-select:none;-o-user-select:none;cursor:default;position:absolute;left:"+f+"px;top:"+r+"px",c._g.doc.body.appendChild(k),
C=1):(k.style.cssText="overflow:hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);-webkit-user-select:none;-moz-user-select:-moz-none;-khtml-user-select:none;-ms-user-select:none;user-select:none;-o-user-select:none;cursor:default;position:relative",b.firstChild?b.insertBefore(k,b.firstChild):b.appendChild(k));b=new c._Paper;b.width=v;b.height=a;b.canvas=k;l(k,{id:"raphael-paper-"+b.id});b.clear();b._left=b._top=0;C&&(b.renderfix=function(){});b.renderfix();return b};c._engine.setViewBox=function(a,
c,b,f,r){d("raphael.setViewBox",this,this._viewBox,[a,c,b,f,r]);var k=v(b/this.width,f/this.height),C=this.top,e=r?"meet":"xMinYMin",K;null==a?(this._vbSize&&(k=1),delete this._vbSize,K="0 0 "+this.width+" "+this.height):(this._vbSize=k,K=a+" "+c+" "+b+" "+f);for(l(this.canvas,{viewBox:K,preserveAspectRatio:e});k&&C;)e="stroke-width"in C.attrs?C.attrs["stroke-width"]:1,C.attr({"stroke-width":e}),C._.dirty=1,C._.dirtyT=1,C=C.prev;this._viewBox=[a,c,b,f,!!r];return this};c.prototype.renderfix=function(){var a=
this.canvas,c=a.style,b;try{b=a.getScreenCTM()||a.createSVGMatrix()}catch(f){b=a.createSVGMatrix()}a=-b.e%1;b=-b.f%1;if(a||b)a&&(this._left=(this._left+a)%1,c.left=this._left+"px"),b&&(this._top=(this._top+b)%1,c.top=this._top+"px")};c.prototype._desc=function(a){var b=this.desc;if(b)for(;b.firstChild;)b.removeChild(b.firstChild);else this.desc=b=l("desc"),this.canvas.appendChild(b);b.appendChild(c._g.doc.createTextNode(c.is(a,"string")?a:"Created with Red Raphaël "+c.version))};c.prototype.clear=
function(){var a;for(d("raphael.clear",this);a=this.bottom;)a.remove();for(a=this.canvas;a.firstChild;)a.removeChild(a.firstChild);this.bottom=this.top=null;a.appendChild(this.desc=l("desc"));a.appendChild(this.defs=l("defs"))};c.prototype.remove=function(){var a;for(d("raphael.remove",this);a=this.bottom;)a.remove();this.defs&&this.defs.parentNode.removeChild(this.defs);this.desc&&this.desc.parentNode.removeChild(this.desc);this.canvas.parentNode&&this.canvas.parentNode.removeChild(this.canvas);
for(a in this)this[a]="function"==typeof this[a]?c._removedFactory(a):null;this.removed=!0};var u=c.st,lc;for(lc in h)h.hasOwnProperty(lc)&&!u.hasOwnProperty(lc)&&(u[lc]=function(a){return function(){var c=arguments;return this.forEach(function(b){b[a].apply(b,c)})}}(lc))}})();(function(){if(c.vml){var a=String,b=parseFloat,f=Math,r=f.round,v=f.max,k=f.min,C=f.sqrt,e=f.abs,K=/[, ]+/,q=c.eve,d={M:"m",L:"l",C:"c",Z:"x",m:"t",l:"r",c:"v",z:"x"},g=/([clmz]),?([^clmz]*)/gi,R=/ progid:\S+Blur\([^\)]+\)/g,
s=/-?[^,\s-]+/g,l={path:1,rect:1,image:1},A={circle:1,ellipse:1},$=function(b){var f=/[ahqstv]/ig,v=c._pathToAbsolute;a(b).match(f)&&(v=c._path2curve);f=/[clmz]/g;if(v==c._pathToAbsolute&&!a(b).match(f))return(b=a(b).replace(g,function(a,c,b){var f=[],v="m"==c.toLowerCase(),k=d[c];b.replace(s,function(a){v&&2==f.length&&(k+=f+d["m"==c?"l":"L"],f=[]);f.push(r(21600*a))});return k+f}))||"m0,0";var f=v(b),k;b=[];for(var C=0,e=f.length;C<e;C++){v=f[C];k=f[C][0].toLowerCase();"z"==k&&(k="x");for(var K=
1,q=v.length;K<q;K++)k+=r(21600*v[K])+(K!=q-1?",":"");b.push(k)}return b.length?b.join(" "):"m0,0"},n=function(a,b,f){var r=c.matrix();r.rotate(-a,.5,.5);return{dx:r.x(b,f),dy:r.y(b,f)}},fa=function(a,c,b,f,r,v){var k=a._,C=a.matrix,K=k.fillpos;a=a.node;var q=a.style,d=1,g="",R=21600/c,s=21600/b;q.visibility="hidden";if(c&&b){a.coordsize=e(R)+" "+e(s);q.rotation=v*(0>c*b?-1:1);v&&(r=n(v,f,r),f=r.dx,r=r.dy);0>c&&(g+="x");0>b&&(g+=" y")&&(d=-1);q.flip=g;a.coordorigin=f*-R+" "+r*-s;if(K||k.fillsize)if(f=
(f=a.getElementsByTagName("fill"))&&f[0])a.removeChild(f),K&&(r=n(v,C.x(K[0],K[1]),C.y(K[0],K[1])),f.position=r.dx*d+" "+r.dy*d),k.fillsize&&(f.size=k.fillsize[0]*e(c)+" "+k.fillsize[1]*e(b)),a.appendChild(f);q.visibility="visible"}};c._url="";c.toString=function(){return"Your browser doesn’t support SVG. Falling down to VML.\nYou are running Raphaël "+this.version};var m=function(c,b,f){b=a(b).toLowerCase().split("-");f=f?"end":"start";for(var r=b.length,v="classic",k="medium",C="medium";r--;)switch(b[r]){case "block":case "classic":case "oval":case "diamond":case "open":case "none":v=
b[r];break;case "wide":case "narrow":C=b[r];break;case "long":case "short":k=b[r]}c=c.node.getElementsByTagName("stroke")[0];c[f+"arrow"]=v;c[f+"arrowlength"]=k;c[f+"arrowwidth"]=C},J=function(a,c){for(var b in c)q("raphael.attr."+b+"."+a.id,a,c[b],b),a.ca[b]&&a.attr(b,c[b])},G=c._setFillAndStroke=function(f,C){if(f.paper.canvas){f.attrs=f.attrs||{};var e=f.node,q=f.attrs,d=e.style,g=l[f.type]&&(C.x!=q.x||C.y!=q.y||C.width!=q.width||C.height!=q.height||C.cx!=q.cx||C.cy!=q.cy||C.rx!=q.rx||C.ry!=q.ry||
C.r!=q.r),R=A[f.type]&&(q.cx!=C.cx||q.cy!=C.cy||q.r!=C.r||q.rx!=C.rx||q.ry!=C.ry),s="group"===f.type,n;for(n in C)C.hasOwnProperty(n)&&(q[n]=C[n]);g&&(q.path=c._getPath[f.type](f),f._.dirty=1);C.href&&(e.href=C.href);C.title&&(e.title=C.title);C.target&&(e.target=C.target);C.cursor&&(d.cursor=C.cursor);"blur"in C&&f.blur(C.blur);if(C.path&&"path"==f.type||g)e.path=$(~a(q.path).toLowerCase().indexOf("r")?c._pathToAbsolute(q.path):q.path),"image"==f.type&&(f._.fillpos=[q.x,q.y],f._.fillsize=[q.width,
q.height],fa(f,1,1,0,0,0));"transform"in C&&f.transform(C.transform);"rotation"in C&&(d=C.rotation,c.is(d,"array")?f.rotate.apply(f,d):f.rotate(d));"visibility"in C&&("hidden"===C.visibility?f.hide():f.show());R&&(d=+q.cx,R=+q.cy,g=+q.rx||+q.r||0,n=+q.ry||+q.r||0,e.path=c.format("ar{0},{1},{2},{3},{4},{1},{4},{1}x",r(21600*(d-g)),r(21600*(R-n)),r(21600*(d+g)),r(21600*(R+n)),r(21600*d)));"clip-rect"in C&&(d=a(C["clip-rect"]).split(K),4==d.length&&(d[0]=+d[0],d[1]=+d[1],d[2]=+d[2]+d[0],d[3]=+d[3]+d[1],
g=s?e:e.clipRect||c._g.doc.createElement("div"),R=g.style,s?(f.clip=d.slice(),g=f.matrix.offset(),g=[b(g[0]),b(g[1])],d[0]-=g[0],d[1]-=g[1],d[2]-=g[0],d[3]-=g[1],R.width="10800px",R.height="10800px"):e.clipRect||(R.top="0",R.left="0",R.width=f.paper.width+"px",R.height=f.paper.height+"px",e.parentNode.insertBefore(g,e),g.appendChild(e),g.raphael=!0,g.raphaelid=e.raphaelid,e.clipRect=g),R.position="absolute",R.clip=c.format("rect({1}px {2}px {3}px {0}px)",d)),C["clip-rect"]||(s&&f.clip?(e.style.clip=
"rect(auto auto auto auto)",delete f.clip):e.clipRect&&(e.clipRect.style.clip="rect(auto auto auto auto)")));f.textpath&&(s=f.textpath.style,C.font&&(s.font=C.font),C["font-family"]&&(s.fontFamily='"'+C["font-family"].split(",")[0].replace(/^['"]+|['"]+$/g,"")+'"'),C["font-size"]&&(s.fontSize=C["font-size"]),C["font-weight"]&&(s.fontWeight=C["font-weight"]),C["font-style"]&&(s.fontStyle=C["font-style"]));"arrow-start"in C&&m(f,C["arrow-start"]);"arrow-end"in C&&m(f,C["arrow-end"],1);if(null!=C.opacity||
null!=C["stroke-width"]||null!=C.fill||null!=C.src||null!=C.stroke||null!=C["stroke-width"]||null!=C["stroke-opacity"]||null!=C["fill-opacity"]||null!=C["stroke-dasharray"]||null!=C["stroke-miterlimit"]||null!=C["stroke-linejoin"]||null!=C["stroke-linecap"]){s=e.getElementsByTagName("fill");d=-1;s=s&&s[0];!s&&(s=t("fill"));"image"==f.type&&C.src&&(s.src=C.src);C.fill&&(s.on=!0);if(null==s.on||"none"==C.fill||null===C.fill)s.on=!1;s.on&&C.fill&&((R=a(C.fill).match(c._ISURL))?(s.parentNode==e&&e.removeChild(s),
s.rotate=!0,s.src=R[1],s.type="tile",g=f.getBBox(1),s.position=g.x+" "+g.y,f._.fillpos=[g.x,g.y],c._preload(R[1],function(){f._.fillsize=[this.offsetWidth,this.offsetHeight]})):(R=c.getRGB(C.fill),s.color=R.hex,s.src="",s.type="solid",R.error&&(f.type in{circle:1,ellipse:1}||"r"!=a(C.fill).charAt())&&O(f,C.fill,s)?(q.fill="none",q.gradient=C.fill,s.rotate=!1):"opacity"in R&&!("fill-opacity"in C)&&(d=R.opacity)));if(-1!==d||"fill-opacity"in C||"opacity"in C)R=((+q["fill-opacity"]+1||2)-1)*((+q.opacity+
1||2)-1)*((+d+1||2)-1),R=k(v(R,0),1),s.opacity=R,s.src&&(s.color="none");e.appendChild(s);s=e.getElementsByTagName("stroke")&&e.getElementsByTagName("stroke")[0];d=!1;!s&&(d=s=t("stroke"));if(C.stroke&&"none"!=C.stroke||C["stroke-width"]||null!=C["stroke-opacity"]||C["stroke-dasharray"]||C["stroke-miterlimit"]||C["stroke-linejoin"]||C["stroke-linecap"])s.on=!0;"none"!=C.stroke&&null!==C.stroke&&null!=s.on&&0!=C.stroke&&0!=C["stroke-width"]||(s.on=!1);R=c.getRGB("stroke"in C?C.stroke:q.stroke);s.on&&
C.stroke&&(s.color=R.hex);R=((+q["stroke-opacity"]+1||2)-1)*((+q.opacity+1||2)-1)*((+R.opacity+1||2)-1);g=.75*(b(C["stroke-width"])||1);R=k(v(R,0),1);null==C["stroke-width"]&&(g=q["stroke-width"]);C["stroke-width"]&&(s.weight=g);g&&1>g&&(R*=g)&&(s.weight=1);s.opacity=R;C["stroke-linejoin"]&&(s.joinstyle=C["stroke-linejoin"])||d&&(d.joinstyle="miter");s.miterlimit=C["stroke-miterlimit"]||8;C["stroke-linecap"]&&(s.endcap="butt"==C["stroke-linecap"]?"flat":"square"==C["stroke-linecap"]?"square":"round");
C["stroke-dasharray"]&&(R={"-":"shortdash",".":"shortdot","-.":"shortdashdot","-..":"shortdashdotdot",". ":"dot","- ":"dash","--":"longdash","- .":"dashdot","--.":"longdashdot","--..":"longdashdotdot"},s.dashstyle=R.hasOwnProperty(C["stroke-dasharray"])?R[C["stroke-dasharray"]]:C["stroke-dasharray"].join&&C["stroke-dasharray"].join(" ")||"");d&&e.appendChild(s)}if("text"==f.type){f.paper.canvas.style.display="";e=f.paper.span;s=q.font&&q.font.match(/\d+(?:\.\d*)?(?=px)/);R=q["line-height"]&&(q["line-height"]+
"").match(/\d+(?:\.\d*)?(?=px)/);d=e.style;q.font&&(d.font=q.font);q["font-family"]&&(d.fontFamily=q["font-family"]);q["font-weight"]&&(d.fontWeight=q["font-weight"]);q["font-style"]&&(d.fontStyle=q["font-style"]);s=b(q["font-size"]||s&&s[0])||10;d.fontSize=100*s+"px";R=b(q["line-height"]||R&&R[0])||12;q["line-height"]&&(d.lineHeight=100*R+"px");c.is(C.text,"array")&&(C.text=f.textpath.string=C.text.join("\n").replace(/<br\s*?\/?>/ig,"\n"));f.textpath.string&&(e.innerHTML=a(f.textpath.string).replace(/</g,
"&#60;").replace(/&/g,"&#38;").replace(/\n/g,"<br>"));e=e.getBoundingClientRect();f.W=q.w=(e.right-e.left)/100;f.H=q.h=(e.bottom-e.top)/100;f.X=q.x;f.Y=q.y;switch(q["vertical-align"]){case "top":f.bby=f.H/2;break;case "bottom":f.bby=-f.H/2;break;default:f.bby=0}("x"in C||"y"in C||void 0!==f.bby)&&(f.path.v=c.format("m{0},{1}l{2},{1}",r(21600*q.x),r(21600*(q.y+(f.bby||0))),r(21600*q.x)+1));e="x y text font font-family font-weight font-style font-size line-height".split(" ");s=0;for(d=e.length;s<d;s++)if(e[s]in
C){f._.dirty=1;break}switch(q["text-anchor"]){case "start":f.textpath.style["v-text-align"]="left";f.bbx=f.W/2;break;case "end":f.textpath.style["v-text-align"]="right";f.bbx=-f.W/2;break;default:f.textpath.style["v-text-align"]="center",f.bbx=0}f.textpath.style["v-text-kern"]=!0}}},O=function(f,r,v){f.attrs=f.attrs||{};var k=Math.pow,e="linear",K=".5 .5";f.attrs.gradient=r;r=a(r).replace(c._radial_gradient,function(a,c){e="radial";c=c&&c.split(",")||[];var f=c[3],r=c[4];f&&r&&(f=b(f),r=b(r),.25<
k(f-.5,2)+k(r-.5,2)&&(r=C(.25-k(f-.5,2))*(2*(.5<r)-1)+.5),K=f+" "+r);return""});r=r.split(/\s*\-\s*/);if("linear"==e){var q=r.shift(),q=-b(q);if(isNaN(q))return null}r=c._parseDots(r);if(!r)return null;f=f.shape||f.node;if(r.length){v.parentNode==f&&f.removeChild(v);v.on=!0;v.method="none";v.color=r[0].color;v.color2=r[r.length-1].color;for(var d=[],g=1,R=void 0===r[0].opacity?1:r[0].opacity,s=0,l=r.length;s<l;s++)r[s].offset&&d.push(r[s].offset+" "+r[s].color),void 0!==r[s].opacity&&(g=r[s].opacity);
v.colors=d.length?d.join():"0% "+v.color;v.opacity=g;v["o:opacity2"]=R;"radial"==e?(v.type="gradientTitle",v.focus="100%",v.focussize="0 0",v.focusposition=K,v.angle=0):(v.type="gradient",v.angle=(270-q)%360);f.appendChild(v)}return 1},h=function(a,b,f){f=f||b;var r;f.canvas&&f.canvas.appendChild(a);r=t("skew");r.on=!0;a.appendChild(r);this.skew=r;this.node=this[0]=a;a.raphael=!0;a.raphaelid=this.id=c._oid++;this.Y=this.X=0;this.attrs=this.attrs||{};this.followers=this.followers||[];this.paper=b;
this.ca=this.customAttributes=this.customAttributes||new b._CustomAttributes;this.matrix=c.matrix();this._={transform:[],sx:1,sy:1,dx:0,dy:0,deg:0,dirty:1,dirtyT:1};this.parent=f;!f.bottom&&(f.bottom=this);(this.prev=f.top)&&(f.top.next=this);f.top=this;this.next=null},f=c.el;h.prototype=f;f.constructor=h;f.transform=function(b){if(null==b)return this._.transform;var f=this.paper._viewBoxShift,r=f?"s"+[f.scale,f.scale]+"-1-1t"+[f.dx,f.dy]:"",v;f&&(v=b=a(b).replace(/\.{3}|\u2026/g,this._.transform||
""));c._extractTransform(this,r+b);var f=this.matrix.clone(),k=this.skew;b=this.node;var r=~a(this.attrs.fill).indexOf("-"),C=!a(this.attrs.fill).indexOf("url(");f.translate(-.5,-.5);C||r||"image"==this.type?(k.matrix="1 0 0 1",k.offset="0 0",k=f.split(),r&&k.noRotation||!k.isSimple?(b.style.filter=f.toFilter(),f=this.getBBox(),r=this.getBBox(1),C=f.x2&&r.x2&&"x2"||"x",k=f.y2&&r.y2&&"y2"||"y",C=f[C]-r[C],f=f[k]-r[k],b.coordorigin=-21600*C+" "+-21600*f,fa(this,1,1,C,f,0)):(b.style.filter="",fa(this,
k.scalex,k.scaley,k.dx,k.dy,k.rotate))):(b.style.filter="",k.matrix=a(f),k.offset=f.offset());v&&(this._.transform=v);return this};f.rotate=function(c,f,r){if(this.removed)return this;if(null!=c){c=a(c).split(K);c.length-1&&(f=b(c[1]),r=b(c[2]));c=b(c[0]);null==r&&(f=r);if(null==f||null==r)r=this.getBBox(1),f=r.x+r.width/2,r=r.y+r.height/2;this._.dirtyT=1;this.transform(this._.transform.concat([["r",c,f,r]]));return this}};f.translate=function(c,f){if(this.removed)return this;c=a(c).split(K);c.length-
1&&(f=b(c[1]));c=b(c[0])||0;f=+f||0;this._.bbox&&(this._.bbox.x+=c,this._.bbox.y+=f);this.transform(this._.transform.concat([["t",c,f]]));return this};f.scale=function(c,f,r,v){if(this.removed)return this;c=a(c).split(K);c.length-1&&(f=b(c[1]),r=b(c[2]),v=b(c[3]),isNaN(r)&&(r=null),isNaN(v)&&(v=null));c=b(c[0]);null==f&&(f=c);null==v&&(r=v);if(null==r||null==v)var k=this.getBBox(1);r=null==r?k.x+k.width/2:r;v=null==v?k.y+k.height/2:v;this.transform(this._.transform.concat([["s",c,f,r,v]]));this._.dirtyT=
1;return this};f.hide=function(a){!this.removed&&(this.node.style.display="none");return this};f.show=function(a){!this.removed&&(this.node.style.display="");return this};f._getBBox=function(){return this.removed?{}:{x:this.X+(this.bbx||0)-this.W/2,y:this.Y+(this.bby||0)-this.H/2,width:this.W,height:this.H}};f.remove=function(){if(!this.removed&&this.parent.canvas){var a=c._engine.getNode(this),b=this.paper,f=this.shape;b.__set__&&b.__set__.exclude(this);q.unbind("raphael.*.*."+this.id);f&&f.parentNode.removeChild(f);
for(a.parentNode&&a.parentNode.removeChild(a);a=this.followers.pop();)a.el.remove();for(;a=this.bottom;)a.remove();this._drag&&this.undrag();if(this.events)for(;a=this.events.pop();)a.unbind();this.removeData();delete b._elementsById[this.id];c._tear(this,this.parent);for(a in this)this[a]="function"===typeof this[a]?c._removedFactory(a):null;this.removed=!0}};f.attr=function(a,b){if(this.removed)return this;if(null==a){var f={},r;for(r in this.attrs)this.attrs.hasOwnProperty(r)&&(f[r]=this.attrs[r]);
f.gradient&&"none"==f.fill&&(f.fill=f.gradient)&&delete f.gradient;f.transform=this._.transform;f.visibility="none"===this.node.style.display?"hidden":"visible";return f}if(null==b&&c.is(a,"string")){if("fill"==a&&"none"==this.attrs.fill&&this.attrs.gradient)return this.attrs.gradient;if("visibility"==a)return"none"===this.node.style.display?"hidden":"visible";var f=a.split(K),v={},k=0;for(r=f.length;k<r;k++)a=f[k],a in this.attrs?v[a]=this.attrs[a]:c.is(this.ca[a],"function")?v[a]=this.ca[a].def:
v[a]=c._availableAttrs[a];return r-1?v:v[f[0]]}if(this.attrs&&null==b&&c.is(a,"array")){v={};k=0;for(r=a.length;k<r;k++)v[a[k]]=this.attr(a[k]);return v}null!=b&&(f={},f[a]=b);null==b&&c.is(a,"object")&&(f=a);for(k in f)q("raphael.attr."+k+"."+this.id,this,f[k],k);if(f){var C={};for(k in this.ca)if(this.ca[k]&&f.hasOwnProperty(k)&&c.is(this.ca[k],"function")&&!this.ca["_invoked"+k]){this.ca["_invoked"+k]=!0;r=this.ca[k].apply(this,[].concat(f[k]));delete this.ca["_invoked"+k];for(v in r)r.hasOwnProperty(v)&&
(f[v]=r[v]);this.attrs[k]=f[k];!1===r&&(C[k]=f[k],delete f[k])}"text"in f&&"text"==this.type&&(c.is(f.text,"array")&&(f.text=f.text.join("\n")),this.textpath.string=f.text.replace(/<br\s*?\/?>/ig,"\n"));G(this,f);var e,k=0;for(r=this.followers.length;k<r;k++)e=this.followers[k],e.cb&&!e.cb.call(e.el,f,this)||e.el.attr(f);for(v in C)f[v]=C[v]}return this};f.blur=function(a){var b=this.node.runtimeStyle,f=b.filter,f=f.replace(R,"");0!==+a?(this.attrs.blur=a,b.filter=f+"  progid:DXImageTransform.Microsoft.Blur(pixelradius="+
(+a||1.5)+")",b.margin=c.format("-{0}px 0 0 -{0}px",r(+a||1.5))):(b.filter=f,b.margin=0,delete this.attrs.blur);return this};f.on=function(a,b){if(this.removed)return this;this.node["on"+a]=function(){var a=c._g.win.event;a.target=a.srcElement;b(a)};return this};c._engine.getNode=function(a){a=a.node||a[0].node;return a.clipRect||a};c._engine.getLastNode=function(a){a=a.node||a[a.length-1].node;return a.clipRect||a};c._engine.group=function(a,b,f){var r=c._g.doc.createElement("div"),k=new h(r,a,f);
r.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px";k._id=b||"";b&&(r.className="raphael-group-"+k.id+"-"+b);(f||a).canvas.appendChild(r);k.type="group";k.canvas=k.node;k.transform=c._engine.group.transform;k.top=null;k.bottom=null;return k};c._engine.group.transform=function(f){if(null==f)return this._.transform;var r=this.node.style,k=this.clip,v=this.paper._viewBoxShift,C=v?"s"+[v.scale,v.scale]+"-1-1t"+[v.dx,v.dy]:"";v&&(f=a(f).replace(/\.{3}|\u2026/g,this._.transform||""));
c._extractTransform(this,C+f);f=this.matrix;C=f.offset();v=b(C[0])||0;C=b(C[1])||0;r.left=v+"px";r.top=C+"px";r.zoom=(this._.tzoom=f.get(0))+"";k&&(r.clip=c.format("rect({1}px {2}px {3}px {0}px)",[k[0]-v,k[1]-C,k[2]-v,k[3]-C]));return this};c._engine.path=function(a,c,b){var f=t("shape");f.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px";f.coordsize="21600 21600";f.coordorigin=a.coordorigin;a=new h(f,a,b);a.type=c.type||"path";a.path=[];a.Path="";c.type&&delete c.type;G(a,c);J(a,
c);return a};c._engine.rect=function(a,b,f){var r=c._rectPath(b.x,b.y,b.w,b.h,b.r);b.path=r;b.type="rect";a=a.path(b,f);b=a.attrs;a.X=b.x;a.Y=b.y;a.W=b.width;a.H=b.height;b.path=r;return a};c._engine.ellipse=function(a,c,b){c.type="ellipse";a=a.path(c,b);c=a.attrs;a.X=c.x-c.rx;a.Y=c.y-c.ry;a.W=2*c.rx;a.H=2*c.ry;return a};c._engine.circle=function(a,c,b){c.type="circle";a=a.path(c,b);c=a.attrs;a.X=c.x-c.r;a.Y=c.y-c.r;a.W=a.H=2*c.r;return a};c._engine.image=function(a,b,f){var r=c._rectPath(b.x,b.y,
b.w,b.h);b.path=r;b.type="image";b.stroke="none";a=a.path(b,f);f=a.attrs;var r=a.node,k=r.getElementsByTagName("fill")[0];f.src=b.src;a.X=f.x=b.x;a.Y=f.y=b.y;a.W=f.width=b.w;a.H=f.height=b.h;k.parentNode==r&&r.removeChild(k);k.rotate=!0;k.src=f.src;k.type="tile";a._.fillpos=[f.x,f.y];a._.fillsize=[f.w,f.h];r.appendChild(k);fa(a,1,1,0,0,0);return a};c._engine.text=function(b,f,k){var v=t("shape"),C=t("path"),e=t("textpath");x=f.x||0;y=f.y||0;text=f.text;C.v=c.format("m{0},{1}l{2},{1}",r(21600*f.x),
r(21600*f.y),r(21600*f.x)+1);C.textpathok=!0;e.string=a(f.text).replace(/<br\s*?\/?>/ig,"\n");e.on=!0;v.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px";v.coordsize="21600 21600";v.coordorigin="0 0";b=new h(v,b,k);b.shape=v;b.path=C;b.textpath=e;b.type="text";b.attrs.text=a(f.text||"");b.attrs.x=f.x;b.attrs.y=f.y;b.attrs.w=1;b.attrs.h=1;G(b,f);J(b,f);v.appendChild(e);v.appendChild(C);return b};c._engine.setSize=function(a,b){var f=this.canvas.style;this.width=a;this.height=b;a==
+a&&(a+="px");b==+b&&(b+="px");f.width=a;f.height=b;f.clip="rect(0 "+a+" "+b+" 0)";this._viewBox&&c._engine.setViewBox.apply(this,this._viewBox);return this};c._engine.setViewBox=function(a,b,c,f,r){q("raphael.setViewBox",this,this._viewBox,[a,b,c,f,r]);var k=this.width,C=this.height,e=1/v(c/k,f/C),K,d;r&&(K=C/f,d=k/c,c*K<k&&(a-=(k-c*K)/2/K),f*d<C&&(b-=(C-f*d)/2/d));this._viewBox=[a,b,c,f,!!r];this._viewBoxShift={dx:-a,dy:-b,scale:e};this.forEach(function(a){a.transform("...")});return this};var t;
c._engine.initWin=function(b){var f=b.document;f.createStyleSheet().addRule(".rvml","behavior:url(#default#VML)");try{!f.namespaces.rvml&&f.namespaces.add("rvml","urn:schemas-microsoft-com:vml"),t=c._createNode=function(b,c){var r=f.createElement("<rvml:"+b+' class="rvml">'),k;for(k in c)r[k]=a(c[k]);return r}}catch(r){t=c._createNode=function(b,c){var r=f.createElement("<"+b+' xmlns="urn:schemas-microsoft.com:vml" class="rvml">'),k;for(k in c)r[k]=a(c[k]);return r}}};c._engine.initWin(c._g.win);
c._engine.create=function(){var a=c._getContainer.apply(0,arguments),b=a.container,f=a.height,r=a.width,k=a.x,a=a.y;if(!b)throw Error("VML container not found.");var v=new c._Paper,C=v.canvas=c._g.doc.createElement("div"),e=C.style,k=k||0,a=a||0,r=r||512,f=f||342;v.width=r;v.height=f;r==+r&&(r+="px");f==+f&&(f+="px");v.coordsize="21600000 21600000";v.coordorigin="0 0";C.id="raphael-paper-"+v.id;v.span=c._g.doc.createElement("span");v.span.style.cssText="position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;";
C.appendChild(v.span);e.cssText=c.format("top:0;left:0;width:{0};height:{1};display:inline-block;cursor:default;position:relative;clip:rect(0 {0} {1} 0);overflow:hidden",r,f);1==b?(c._g.doc.body.appendChild(C),e.left=k+"px",e.top=a+"px",e.position="absolute"):b.firstChild?b.insertBefore(C,b.firstChild):b.appendChild(C);v.renderfix=function(){};return v};c.prototype.clear=function(){var a;for(q("raphael.clear",this);a=this.bottom;)a.remove();this.canvas.innerHTML="";this.span=c._g.doc.createElement("span");
this.span.style.cssText="position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;display:inline;";this.canvas.appendChild(this.span);this.bottom=this.top=null};c.prototype.remove=function(){var a;for(q("raphael.remove",this);a=this.bottom;)a.remove();this.canvas.parentNode.removeChild(this.canvas);for(a in this)this[a]="function"==typeof this[a]?c._removedFactory(a):null;return!0};var p=c.st,H;for(H in f)f.hasOwnProperty(H)&&!p.hasOwnProperty(H)&&(p[H]=function(a){return function(){var b=
arguments;return this.forEach(function(c){c[a].apply(c,b)})}}(H))}})();ga?u.win.Raphael=c:Raphael=c;return c},!0)})();d.Raphael=D;d.Raphael.desc="";h&&h!==D?window.Raphael=h:window.Raphael===D&&(window.Raphael=void 0)}]);
FusionCharts.register("module",["private","fusioncharts.redraphael.helper",function(){var d={};this.hcLib.Raphael.fn._elementFromEvent=function(h){if(!h||this.removed)return null;var D=h.srcElement||h.target||(h=h.originalEvent)&&(h.srcElement||h.target)||d;"tspan"===D.nodeName&&(D=D.parentNode);return this.getById(D.raphaelid)}}]);
FusionCharts.register("module",["private","fusioncharts.redraphael.css",function(){var d=this.hcLib.Raphael,h=d.eve,D=d._g,z=d.fn,p=d.el,c=/[, ]+/,I=/\B([A-Z]{1})/g,b,P;b=function(a){this.rules={};this.ns=a||""};P=b.prototype;P.getSheet=function(){var a=this.node;a||(a=this.node=D.doc.createElement("style"),this.node.setAttribute("id",d.format("raphael-stylesheet-{0}",d._oid++)),this.node.setAttribute("type","text/css"),(D.doc.head||D.doc.getElementsByTagName("head")[0]).appendChild(this.node));return a};
P.setCssText=function(a){var b=this.node;if(!b)if(a)b=this.getSheet();else return;b.styleSheet?b.styleSheet.cssText=a||"":(b.innerHTML="",a&&b.appendChild(D.doc.createTextNode(a)))};P.destroy=function(){this.node&&this.node.parentNode&&this.node.parentNode.removeChild(this.node);delete this.rules};P.clear=function(){this.setCssText("");this.rules={}};P.add=function(a,b){var c=this.rules[a]||(this.rules[a]={}),d;for(d in b)c[d]=b[d]};P.render=function(){this.setCssText(this.toString())};P.toString=
function(a){var b=a?"":"\n",c=a?"":"\t";a=a?":":": ";var d=b,h,g;for(h in this.rules){d+=h.replace(/(^|\,)/g,"$1"+this.ns+" ")+" {"+b;h=this.rules[h];for(g in h)h[g]&&(d+=c+g.replace(I,"-$1").toLowerCase()+a+h[g]+";"+b);d+="}"+b}return d};h.on("raphael.new",function(){this._stylesheet=this._stylesheet||new b;this.cssNamespace("")});h.on("raphael.remove",function(){this._stylesheet&&this._stylesheet.destroy();delete this._stylesheet});z.cssNamespace=function(a){arguments.length&&(this._stylesheet.ns=
d.format("{0}#raphael-paper-{1}",a&&a+" "||"",this.id));return this._stylesheet.ns};z.cssAddRule=function(a,b){if(1===arguments.length&&"object"===typeof a){for(var c in a)this.cssAddRule(c,a[c]);return this}return this._stylesheet.add(a,b),this};z.cssRender=function(){return d.svg&&this._stylesheet.render(),this};z.cssClear=function(){return this._stylesheet.clear(),this};d._availableAttrs["class"]="";d.svg&&h.on("raphael.attr.class",function(a){var b=this.node;a=a||"";b.setAttribute("class","group"===
this.type&&this._id?"raphael-group-"+this.id+"-"+this._id+" "+a:a)});d.vml&&h.on("raphael.attr.class",function(a){var b=this.paper,c="."+a,b=b._stylesheet&&b._stylesheet.rules,d=this.parent,h=this.attrs,g={},e;this.node.className="group"===this.type?a&&this._id+" "+a||this._id:"rvml "+a;if(c&&b){a=b[c];for(e in a)"color"===e&&"text"===this.type&&(e="fill"),!h[e]&&(g[e]=a[e]);for(;d&&d.attr;){if(a=d.attr("class"))for(e in c="."+a+" "+c,a=b[c],a)"color"===e&&"text"===this.type&&(e="fill"),h[e]||g[e]||
(g[e]=a[e]);d=d.parent}this.css(g)}});p.css=function(a,b){var p,z,B,g;if(this.removed)return this;this.styles||(this.styles={});if(null==b&&d.is(a,"string")){p=a.split(c);z={};g=0;for(B=p.length;g<B;g++)a=p[g],a in this.styles&&(z[a]=this.styles[a]);return B-1?z:z[p[0]]}if(null==b&&d.is(a,"array")){z={};g=0;for(B=a.length;g<B;g++)z[a[g]]=this.styles(a[g]);return z}null!=b?(p={},p[a]=b):null!=a&&d.is(a,"object")&&(p=a);z={};for(g in p)B=g.replace(/\B([A-Z]{1})/g,"-$1").toLowerCase(),d._availableAttrs.hasOwnProperty(B)||
"color"===B?("color"===B&&"text"===this.type&&(B="fill"),z[B]=p[g],z.dirty=!0):(h("raphael.css."+B+"."+this.id,this,p[g],B),this.node.style[B]=p[g],this.styles[B]=p[g]);g=0;for(B=this.followers.length;g<B;g++)this.followers[g].el.attr(p);z.hasOwnProperty("dirty")&&(delete z.dirty,this.attr(z));return this}}]);
FusionCharts.register("module",["private","modules.renderer.js-raphaelexport",function(){var d=this.hcLib,h=d.Raphael,D=d.pluckNumber,z=d.pluck,p=h._availableAttrs,c=/^matrix\(|\)$/g,I=/\,/g,b=/\n|<br\s*?\/?>/ig,P=/[^\d\.]/ig,a=/[\%\(\)\s,\xb0#]/g,w=/group/ig,F=/&/g,L=/"/g,B=/'/g,g=/</g,e=/>/g,l=0;(function(d){var h=Math,E=parseFloat,n=h.max,V=h.abs,t=h.pow,X=String,u=/[, ]+/,ga=[{reg:/xmlns\=\"http\:\/\/www.w3.org\/2000\/svg\"/ig,repStr:""},{reg:/^.*<svg /,repStr:'<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" '},
{reg:/\/svg>.*$/,repStr:"/svg>"},{reg:/<desc\>[^<]*<\/desc\>/,repStr:""},{reg:/zIndex="[^"]+"/g,repStr:""},{reg:/url\((\\?[\'\"])[^#]+#/g,repStr:"url($1#"},{reg:/ href=/g,repStr:" xlink:href="},{reg:/(id|class|width|height)=([^" >]+)/g,repStr:'$1="$2"'},{reg:/:(path|rect)/g,repStr:"$1"},{reg:/<ima?ge? ([^\>]+?[^\/])\>/gi,repStr:"<image $1 />"},{reg:/<\/ima?ge?\>/g,repStr:""},{reg:/style="([^"]+)"/g,repStr:function(a){return a.toLowerCase()}}],U={blur:function(){},transform:function(){},src:function(a,
b){b.attrSTR+=' xlink:href="'+b.attrs.src+'"'},path:function(a,b){var c=b.attrs.path,c=d._pathToAbsolute(c||"");b.attrSTR+=' d="'+(c.toString&&c.toString()||"").replace(I," ")+'"'},gradient:function(b,c,e){var g=b.attrs.gradient,l="linear",p,u,H,M=.5,w=.5,q=u="",J="",W,G,B,z;p=g.replace(a,"_");if(!e[p]){g=X(g).replace(d._radial_gradient,function(a,b){var c,e,d,q,g,n,J;b=b&&b.split(",")||[];l="radial";c=b[0];e=b[1];d=b[2];q=b[3];g=b[4];z=b[5];J=c&&e;d&&(B=/\%/.test(d)?d:E(d));if("userSpaceOnUse"===
z)return J&&(M=c,w=e),q&&g&&(W=q,G=g,J||(M=W,w=G)),"";J&&(M=E(c),w=E(e),c=2*(.5<w)-1,.25<(n=t(M-.5,2))+t(w-.5,2)&&.25>n&&(w=h.sqrt(.25-n)*c+.5)&&.5!==w&&(w=w.toFixed(5)-1E-5*c));q&&g&&(W=E(q),G=E(g),c=2*(.5<G)-1,.25<(n=t(W-.5,2))+t(G-.5,2)&&.25>n&&(G=h.sqrt(.25-n)*c+.5)&&.5!==G&&(G=G.toFixed(5)-1E-5*c),J||(M=W,w=G));return""});g=g.split(/\s*\-\s*/);if("linear"===l){u=g.shift();u=-E(u);if(isNaN(u))return null;H=[0,0,h.cos(d.rad(u)),h.sin(d.rad(u))];u=1/(n(V(H[2]),V(H[3]))||1);H[2]*=u;H[3]*=u;0>H[2]&&
(H[0]=-H[2],H[2]=0);0>H[3]&&(H[1]=-H[3],H[3]=0)}g=d._parseDots(g);if(!g)return null;"radial"===l?(u='<radialGradient fx = "'+M+'" fy = "'+w+'" cy = "'+G+'" cx = "'+W+'" r = "'+B+'" gradientUnits = "'+z+'" id = "'+p+'">',q="</radialGradient>"):(u='<linearGradient x1 = "'+H[0]+'" y1 = "'+H[1]+'" x2 = "'+H[2]+'" y2 = "'+H[3]+'" gradientTransform ="matrix('+b.matrix.invert()+')" id = "'+p+'">',q="</linearGradient>");b=0;for(H=g.length;b<H;b++)J+='<stop offset="'+(g[b].offset?g[b].offset:b?"100%":"0%")+
'" stop-color="'+(g[b].color||"#fff")+'" stop-opacity="'+(void 0===g[b].opacity?1:g[b].opacity)+'" />';e[p]=!0;e.str+=u+J+q}c.attrSTR+=" fill=\"url('#"+p+"')\""},fill:function(a,b){var c=b.attrs,e=c.fill,g;a.attrs.gradient||(e=d.color(e),g=e.opacity,"text"===a.type?b.styleSTR+="fill:"+e+"; stroke-opacity:0; ":(b.attrSTR+=' fill="'+e+'"',c["fill-opacity"]||!g&&0!==g||(b.attrSTR+=' fill-opacity="'+g+'"')))},stroke:function(a,b){var c=b.attrs,e,g;e=d.color(c.stroke);g=e.opacity;"text"!==a.type&&(b.attrSTR+=
' stroke="'+e+'"',c["stroke-opacity"]||!g&&0!==g||(b.attrSTR+=' stroke-opacity="'+g+'"'))},"clip-rect":function(b,e,d){var g=X(e.attrs["clip-rect"]),n=g.split(u),g=g.replace(a,"_")+"__"+l++;4===n.length&&(d[g]||(d[g]=!0,d.str+='<clipPath id="'+g+'"><rect x="'+n[0]+'" y="'+n[1]+'" width="'+n[2]+'" height="'+n[3]+'" transform="matrix('+b.matrix.invert().toMatrixString().replace(c,"")+')"/></clipPath>'),e.attrSTR+=' clip-path="url(#'+g+')"')},cursor:function(a,b){var c=b.attrs.cursor;c&&(b.styleSTR+=
"cursor:"+c+"; ")},font:function(a,b){b.styleSTR+="font:"+b.attrs.font.replace(/\"/ig," ")+"; "},"font-size":function(a,b){var c=z(b.attrs["font-size"],"10");c&&c.replace&&(c=c.replace(P,""));b.styleSTR+="font-size:"+c+"px; "},"font-weight":function(a,b){b.styleSTR+="font-weight:"+b.attrs["font-weight"]+"; "},"font-family":function(a,b){b.styleSTR+="font-family:"+b.attrs["font-family"]+"; "},"line-height":function(){},"clip-path":function(){},visibility:function(){},"vertical-align":function(){},
"text-anchor":function(a,b){var c=b.attrs["text-anchor"]||"middle";"text"===a.type&&(b.attrSTR+=' text-anchor="'+c+'"')},title:function(){},text:function(a,c){var d=c.attrs,l=d.text,n=z(d["font-size"],d.font,"10"),m=z(d["line-height"]),h,p,t;n&&n.replace&&(n=n.replace(P,""));n=D(n);m&&m.replace&&(m=m.replace(P,""));m=D(m,n&&1.2*n);h=n?.85*n:.75*m;n=d.x;p=z(d["vertical-align"],"middle").toLowerCase();l=X(l).split(b);t=l.length;d=0;for(h="top"===p?h:"bottom"===p?h-m*t:h-m*t*.5;d<t;d++)c.textSTR+="<tspan ",
p=(l[d]||"").replace(F,"&amp;").replace(L,"&quot;").replace(B,"&#39;").replace(g,"&lt;").replace(e,"&gt;"),c.textSTR=d?c.textSTR+('dy="'+m+'" x="'+n+'" '):c.textSTR+('dy="'+h+'"'),c.textSTR+=">"+p+"</tspan>"}},ka=function(a,b){var e="",d={attrSTR:"",styleSTR:"",textSTR:"",attrs:a.attr()},g=a.isShadow,l="",n="",m,h,t=d.attrs;if("none"===a.node.style.display||g)a.next&&(e+=ka(a.next,b));else{for(m in t)if("gradient"!==m&&(void 0!==p[m]||U[m])&&void 0!==t[m])if(U[m])U[m](a,d,b);else d.attrSTR+=" "+m+
'="'+t[m]+'"';a.attrs.gradient&&U.gradient(a,d,b);"rect"===a.type&&t.r&&(d.attrSTR+=' rx="'+t.r+'" ry="'+t.r+'"');for(h in a.styles)d.styleSTR+=h+":"+a.styles[h]+"; ";"image"===a.type&&(d.attrSTR+=' preserveAspectRatio="none"');if("text"===a.type&&!t["text-anchor"])U["text-anchor"](a,d);a.bottom&&(l=ka(a.bottom,b));a.next&&(n=ka(a.next,b));g=a.type;g.match(w)&&(g="g");e+="<"+g+' transform="matrix('+a.matrix.toMatrixString().replace(c,"")+')" style="'+d.styleSTR+'"'+d.attrSTR+">"+d.textSTR+l+"</"+
g+">"+n}return e};d.fn.toSVG=function(a){var b="",c={str:""},e=0,g=ga.length,l="";if(d.svg){if(this.canvas&&this.canvas.parentNode){for(b=this.canvas.parentNode.innerHTML;e<g;e+=1)c=ga[e],b=b.replace(c.reg,c.repStr);this._stylesheet&&(b=b.replace(/^(<svg\s[\s\S]*?>)/ig,'$1<style type="text/css">'+this._stylesheet.toString(!0)+"</style>"))}}else b='<svg style="overflow: hidden; position: relative;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+this.width+'" version="1.1" height="'+
this.height+'">',this.bottom&&(l=ka(this.bottom,c)),b+="<defs>"+c.str+"</defs>"+l+"</svg>";a||(b=b.replace(/<image [^\>]*\>/gi,""));return b}})(h)}]);
FusionCharts.register("module",["private","modules.renderer.js-raphaelshadow",function(){var d=this.window,h=d.Math.sqrt,D=d.parseFloat,z=d.parseInt,d=d.SVGFilterElement||d.SVGFEColorMatrixElement&&2===d.SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE,p=this.hcLib.Raphael,c={"drop-shadow":"drop-shadow",stroke:"stroke",fill:"fill","stroke-width":"stroke-width","stroke-opacity":"stroke-opacity","stroke-linecap":"stroke-linecap","stroke-linejoin":"stroke-linejoin","shape-rendering":"shape-rendering",
transform:"transform"},I=p._createNode,b;p.svg?(d&&(p.el.dropshadow=function(b,a,c,d){var z=this.node,B=this._.shadowFilter,g=this.paper.cacheShadows||(this.paper.cacheShadows={}),e="drop-shadow"+[b,a,c,d].join(" "),l;if("none"===b){if(B){B.use-=1;this.node.removeAttribute("filter");if(!B.use){e=B.hash;for(l in B)b=B[l],b.parentNode&&b.parentNode.removeChild(b),delete B[l];delete g[e]}delete this._.shadowFilter}}else B&&g[e]===B||(B=this.paper.defs.appendChild(I("filter",{id:p.createUUID(),width:"200%",
height:"200%"})),d=p.color(d),d.error&&(d=p.color("rgba(0,0,0,1)")),l=p.pick(d.opacity,1),this._.shadowFilter=g[e]={use:1,filter:B,hash:e,offset:B.appendChild(I("feOffset",{result:"offOut","in":"SourceGraphic",dx:D(b),dy:D(a)})),matrix:B.appendChild(I("feColorMatrix",{result:"matrixOut","in":"offOut",type:"matrix",values:"0 0 0 0 "+d.r/255+" 0 0 0 0 "+d.g/255+" 0 0 0 0 "+d.b/255+" 0 0 0 "+l+" 0"})),blur:B.appendChild(I("feGaussianBlur",{result:"blurOut","in":"matrixOut",stdDeviation:h(D(c))})),blend:B.appendChild(I("feComposite",
{"in":"SourceGraphic",in2:"blurOut",operator:"over"}))},z.setAttribute("filter",'url("'+p._url+"#"+B.id+'")'));return this}),b=function(b,a){var d=this.__shadowscale,h={},p,B;for(B in b)switch(c[B]&&(h[B]=b[B],delete b[B]),B){case "transform":p=a.matrix.clone();p.translate(this.__shadowx,this.__shadowy);this.transform(p.toTransformString());break;case "stroke-width":b[B]=((h[B]||1)+6-2*this.__shadowlevel)*d}this.attr(b);for(B in h)b[B]=h[B]},p.ca["drop-shadow"]=function(c,a,d,h,D,B){d=this._.shadows||
(this._.shadows=[]);var g,e,l,m,N;if(!this.__shadowblocked)if("none"===c)for(;e=d.pop();)e.remove();else for(h=p.color(h),h.error&&(h=p.color("rgba(0,0,0,1)")),D instanceof Array?(g=D[0],D=D[1]):g=D,g=1/p.pick(g,1),D=1/p.pick(D,1),c=p.pick(c,1)*g,a=p.pick(a,1)*g,g=.05*p.pick(h.opacity,1),l=z(this.attr("stroke-width")||1,10)+6,m=this.matrix.clone(),m.translate(c,a),N=1;3>=N;N++)e=(d[N-1]||this.clone().follow(this,b,!B&&"before")).attr({stroke:h.hex,"stroke-opacity":g*N,"stroke-width":(l-2*N)*D,transform:m.toTransformString(),
"stroke-linecap":"round","stroke-linejoin":"round",fill:"none"}),e.__shadowlevel=N,e.__shadowscale=D,e.__shadowx=c,e.__shadowy=a,B&&B.appendChild(e),d.push(e);return!1},p.el.shadow=function(b,a,c,d){var h;c&&c.constructor===p.el.constructor&&(d=c,c=void 0);"object"===typeof b&&(a&&a.constructor===p.el.constructor&&(d=a),a=b.opacity,c=b.scalefactor,h=!!b.useFilter,b=void 0===b.apply?!!a:b.apply);void 0===a&&(a=1);if(this.dropshadow){if(h)return b&&this.dropshadow(1,1,3,"rgb(64,64,64)")||this.dropshadow("none"),
this;this._.shadowFilter&&this.dropshadow("none")}return this.attr("drop-shadow",b?[1,1,3,"rgba(64,64,64,"+a+")",c,d]:"none")}):p.vml?(p.ca["drop-shadow"]=function(b,a,c,d,h,B){var g=this._.shadow,e,l;if(this.isShadow)return!1;"none"===b?g&&(this._.shadow=g.remove()):(g||(g=this._.shadow=this.clone(),B&&B.appendChild(g.follow(this))||g.follow(this,void 0,"before"),g.attr({fill:"none","fill-opacity":.5,"stroke-opacity":1}).isShadow=!0,0>=g.attr("stroke-width")&&g.attr("stroke-width",1)),B=g.node.runtimeStyle,
e=B.filter.replace(/ progid:\S+Blur\([^\)]+\)/g,""),d=p.color(d),d.error&&(d=p.color("rgba(0,0,0,1)")),l=p.pick(d.opacity,1)/5,h=1/p.pick(h,1),b=p.pick(b,1)*h,a=p.pick(a,1)*h,g.translate(b,a),B.filter=e+" progid:DXImageTransform.Microsoft.Blur(pixelRadius="+D(.4*c)+" makeShadow=True Color="+d.hex+' shadowOpacity="'+l+'");');return!1},p.el.shadow=function(b,a,c,d){c&&c.constructor===p.el.constructor&&(d=c,c=void 0);"object"===typeof b&&(a&&"group"===a.type&&(d=a),a=b.opacity,c=b.scalefactor,b=void 0===
b.apply?!!a:b.apply);void 0===a&&(a=1);return this.attr("drop-shadow",b||!a?[1,1,5,"rgba(64,64,64,"+a+")",c,d]:"none")}):p.canvas&&(p.el.shadow=function(){return this})}]);
FusionCharts.register("module",["private","modules.renderer.js-raphaelshapes",function(){var d=this.window,h="createTouch"in d.document,D=/msie/i.test(d.navigator.userAgent)&&!d.opera,z=d.Math,p=z.cos,c=z.sin,I=z.abs,b=z.pow,P=z.atan2,a=z.tan,w=z.acos,F=z.min,L=z.round,B=z.PI,g=z.sqrt,e=2*B,l=d.parseInt,m=d.parseFloat,N=String,E=Array.prototype.slice,n=b(2,-24),V="rgba(192,192,192,"+(D?.002:1E-6)+")",t=this.hcLib.Raphael,X=t.eve,u=t._createNode,ga=t._setFillAndStroke,U=t.el.constructor,ka={speed:"optimizeSpeed",
crisp:"crispEdges",precision:"geometricPrecision"},xa={enabled:!1,"false":!1,0:!1,disabled:!0,"true":!0,1:!0},ea={Q:"L",Z:"X",q:"l",z:"x",",":" "},Y=/,?([achlmqrstvxz]),?/gi,ua=/\s*\,\s*/g,ba,da=function(){return this.join(",").replace(Y,ba)},oa,H,M=t._cacher(function(a,c,e,d){return g(b(e-a,2)+b(d-c,2))}),T=t._cacher(function(a,b,c,e,d){var g=c-a,l=e-b;c=M(a,b,c,e);return{x:a+g/c*d,y:b+l/c*d}});if(t.svg)X.on("raphael.attr.shape-rendering",function(a,b){var c=this.node;this.attrs[b]=a=ka[a]||a||"auto";
c.setAttribute(b,a);c.style.shapeRendering=a});else if(t.vml)X.on("raphael.attr.shape-rendering",function(a){this.node.style.antialias="crisp"!==a});t.define&&t.define([{name:"polypath",polypath:function(){return this.path(void 0,t._lastArgIfGroup(arguments))},ca:{polypath:function(a,b,e,d,g,n){var h,u,H;h=[];a=l(a,10)||0;b=m(b)||0;e=m(e)||0;d=m(d)||0;g=null===g||isNaN(g)?.5*B:t.rad(g);n=null===n||isNaN(n)?0:m(n);u=g;if(2<a)switch(g=2*B/a,n){case 0:for(n=0;n<a;n++)h.push("L",b+d*p(-u),e+d*c(-u)),
u+=g;h[0]="M";h.push("Z");break;case 1:for(n=0;n<a;n++)h.push("M",b,e,"L",b+d*p(-u),e+d*c(-u)),u+=g;break;default:g*=.5;H=d*p(g)*(1-n);for(n=0;n<a;n++)h.push("L",b+d*p(-u),e+d*c(-u)),u+=g,h.push("L",b+H*p(-u),e+H*c(-u)),u+=g;h[0]="M";h.push("Z")}else 0===d?h.push("M",b,e,"L",b,e,"Z"):h.push("M",b-d,e,"A",d,d,0,0,0,b+d,e,"A",d,d,0,0,0,b-d,e,"Z");return{path:h}},r:function(a){var b=this.attrs.polypath;b[3]=a;this.attr("polypath",b);return!1}}},{name:"ringpath",ringpath:function(){return this.path(void 0,
t._lastArgIfGroup(arguments))},ca:function(a,b,d,g,l,m){var h=m%e-l%e,t=m-l,u,H,M,E,w;this._.ringangle=.5*(l+m);I(t)<n?(t=p(l),l=c(l),d=["M",a+d*t,b+d*l,"L",a+g*t,b+g*l,"Z"]):(I(t)>n&&I(t)%e<n?(d=["M",a-d,b,"A",d,d,0,0,0,a+d,b,"A",d,d,0,0,0,a-d,b],0!==g&&(d=d.concat(["M",a-g,b,"A",g,g,0,0,1,a+g,b,"A",g,g,0,0,1,a-g,b]))):(t=p(l),l=c(l),u=p(m),m=c(m),h%=e,0>h&&(h+=e),h=h<B?0:1,H=a+d*t,E=b+d*l,M=a+d*u,w=b+d*m,u=a+g*u,m=b+g*m,.01>I(H-M)&&.01>I(E-w)&&(E=w+.01),d=["M",H,E,"A",d,d,0,h,1,M,w,"L",u,m],0!==
g&&(a+=g*t,b+=g*l,.01>I(u-a)&&.01>I(m-b)&&(b=m+.01),d.push("A",g,g,0,h,0,a,b))),d.push("Z"));return{path:d}}},{name:"cubepath",cubepath:function(){var a={"stroke-linejoin":"round","shape-rendering":"precision",stroke:"none"},b=arguments,c=b.length-1,e=b[c],d,g;e&&e.constructor===t.el.constructor?b[c]=void 0:e=void 0;c=this.path(a,e);d=this.path(a,e);a=this.path(a,e);a._.cubetop=c.follow(a,void 0,"before");a._.cubeside=d.follow(a,void 0,"before");for(g in t.fn.cubepath.ca)a.ca[g]=t.fn.cubepath.ca[g];
return a.attr("cubepath",[b[0],b[1],b[2],b[3],b[4],b[5]])},fn:{_getBBox2:function(){var a=this._.cubeside.getBBox(),b=this._.cubetop.getBBox(),c=this.getBBox();return{x:c.x+b.height,y:c.y-a.width,width:c.width,height:c.height}}},ca:{cubepath:function(a,b,c,e,d,g){var l=this._.cubetop,n=this._.cubeside;a=a||0;b=b||0;c=c||0;e=e||0;d=d||0;g=g||0;this.attr("path",["M",a+c,b,"l",0,e,-c,0,0,-e,"z"]);l.attr("path",["M",a,b,"l",1,1,c-1,0,0,-1,d,-g,-c,0,"z"]);n.attr("path",["M",a+c-1,b+1,"l",0,e-1,1,0,d,-g,
0,-e,-d,g]);return!1},"stroke-linejoin":function(){return{"stroke-linejoin":"round"}},"drop-shadow":function(a,b,c,e){var d=this._.cubetop,g=this._.cubeside;this.dropshadow&&(d.dropshadow(a,-b,c,e),g.dropshadow(a,-b,c,e));return!1},fill:function(a,b){var c=this._.cubetop,e=this._.cubeside,d=this.attr("cubepath")||[0,0,0,0,0,0],g=d[2],l=d[4],d=d[5],n;a=t.color(a);b?(this.attr("fill",a),c.attr("fill",t.tintshade(a,-.78).rgba),e.attr("fill",t.tintshade(a,-.65).rgba)):(n="opacity"in a?"rgba("+[a.r,a.g,
a.b,a.opacity]+")":"rgb("+[a.r,a.g,a.b]+")",this.attr("fill",[270,t.tintshade(n,.55).rgba,t.tintshade(n,-.65).rgba].join("-")),e.attr("fill",[270,t.tintshade(n,-.75).rgba,t.tintshade(n,-.35).rgba].join("-")),c.attr("fill",[45+t.deg(P(d,l+g)),t.tintshade(n,-.78).rgba,t.tintshade(n,.22).rgba].join("-")));return!1}}},{name:"scroller",scroller:function(a,b,c,e,d,g,l){var n=this.group("scroller",l),h=n.attrs,p=n._.scroller={};d=d&&"horizontal"||"vertical";var u,H={},M,E,B;p.track=this.rect(n).mousedown(function(a){var b=
h["scroll-position"];a="horizontal"===h["scroll-orientation"]?a.layerX||a.x:a.layerY||a.y;a=(a-p.anchorOffset)/p.trackLength;u=t.animation({"scroll-position":a},2E3*I(b-a),"easeIn");n.animate(u);X("raphael.scroll.start."+n.id,n,b)}).mouseup(p._mouseupTrack=function(){this.stop(u);X("raphael.scroll.end."+this.id,this,h["scroll-position"])},n,!0);p.anchor=this.rect(n).drag(function(){H["scroll-position"]=M+arguments[E]/p.trackLength;n.animate(H,0)},function(a,b,c){E="horizontal"===h["scroll-orientation"]?
0:1;X("raphael.scroll.start."+n.id,n,M=h["scroll-position"]);c.stopPropagation()},function(){X("raphael.scroll.end."+n.id,n,M=h["scroll-position"])});for(B in t.fn.scroller.fn)n[B]=t.fn.scroller.fn[B];for(B in t.fn.scroller.ca)n.ca[B]=t.fn.scroller.ca[B];h["scroll-orientation"]=d;h["stroke-width"]=1;n.ca["scroll-repaint"]=n.ca["scroll-repaint-"+d];!t.is(g,"object")&&(g={});return n.attr({ishot:!0,"scroll-display-buttons":g.showButtons&&"arrow"||"none","scroll-display-style":g.displayStyleFlat&&"flat"||
"3d","scroll-ratio":m(g.scrollRatio)||1,"scroll-position":m(g.scrollPosition)||0,"scroll-repaint":[a,b,c,e]})},fn:{scroll:function(a,b){var c=this._.scroller;b=b||this;c.callback=function(){return a.apply(b,arguments)};return this},remove:function(){var a=this._.scroller,b;this.attr("scroll-display-buttons","none");a.track.unmouseup(a._mouseupTrack);for(b in a)a[b]&&a[b].remove&&a[b].remove(),a[b]=null;delete this._.scroller;t.el.remove.apply(this,arguments)}},ca:{"stroke-width":function(){return!1},
"drop-shadow":function(a,b,c,e,d,g){this._.scroller.track.attr("drop-shadow",[a,b,c,e,d,g]);return!1},"scroll-display-style":function(a){var b=this.attrs,c=b["scroll-display-style"],e=b.fill;a={flat:"flat","3d":"3d",transparent:"transparent"}[a]||c;e&&a!==c&&(b["scroll-display-style"]=a,this.attr("fill",e));return{"scroll-display-style":a}},"scroll-display-buttons":function(a){var b=this,c=b.paper,e=b._.scroller,d=b.attrs,g=d["scroll-display-buttons"],l=d["scroll-repaint"],n,m;void 0===g&&(g="none");
a={none:"none",arrow:"arrow"}[a]||g;a!==g&&(d["scroll-display-buttons"]=a,"none"===a&&e.start?(e.arrowstart.remove(),delete e.arrowstart,e.arrowend.remove(),delete e.arrowend,e.start.unmouseup(e._mouseupStart),e.start.remove(),delete e.start,e.end.unmouseup(e._mouseupEnd),e.end.remove(),delete e.end):(e.arrowstart=c.polypath(b),e.arrowend=c.polypath(b),e.start=c.rect(b).mousedown(function(){var a;0!==(a=d["scroll-position"])&&(b.animate({"scroll-position":a-.1},100).animate(n=t.animation({"scroll-position":0},
4500*a,"easeIn")),X("raphael.scroll.start."+b.id,b,a))}).mouseup(e._mouseupStart=function(){b.stop(n);X("raphael.scroll.end."+b.id,b,d["scroll-position"])},b,!0),e.end=c.rect(b).mousedown(function(){var a;1!==(a=d["scroll-position"])&&(b.animate({"scroll-position":a+.1},100).animate(m=t.animation({"scroll-position":1},4500*(1-a),"easeIn")),X("raphael.scroll.start."+b.id,b,a))}).mouseup(e._mouseupEnd=function(){b.stop(m);X("raphael.scroll.end."+b.id,b,d["scroll-position"])},b,!0),d.fill&&b.attr("fill",
d.fill)),l&&b.attr("scroll-repaint",l));return{"scroll-display-buttons":a}},"scroll-orientation":function(a){var b=this.attrs,c=b["scroll-repaint"],e=b["scroll-orientation"];a={horizontal:"horizontal",vertical:"vertical"}[a]||e;e!==a&&(this.ca["scroll-repaint"]=this.ca["scroll-repaint-"+a],c&&(c[2]+=c[3],c[3]=c[2]-c[3],c[2]-=c[3],this.attr("scroll-repaint",c)),b.fill&&this.attr("fill",b.fill));return{"scroll-orientation":a}},"scroll-ratio":function(a){var b=this.attrs,c=b["scroll-ratio"],e=b["scroll-repaint"];
a=1<a?1:.01>a?.01:m(a);e&&a!==c&&(b["scroll-ratio"]=a,this.attr("scroll-repaint",e));return{"scroll-ratio":a}},"scroll-position":function(a,b){var c=this.attrs,e="horizontal"===c["scroll-orientation"],d=c["scroll-repaint"],g=c["scroll-position"],l=this._.scroller,n=l.anchor;a=1<a?1:0>a?0:m(a);isNaN(a)&&(a=g);d&&(g!==a||b)&&(g=l.start&&l.start.attr(e&&"width"||"height")||0,e&&n.attr("x",d[0]+g+(d[2]-2*g-n.attr("width"))*a+.5)||n.attr("y",d[1]+g+(d[3]-2*g-n.attr("height"))*a+.5),!b&&1>c["scroll-ratio"]&&
(X("raphael.scroll.change."+this.id,this,a),l.callback&&l.callback(a)));return{"scroll-position":a}},r:function(a){var b=this._.scroller;b.track.attr("r",a);b.anchor.attr("r","none"===this.attrs["scroll-display-buttons"]&&a||0);return!1},"scroll-repaint-horizontal":function(a,b,c,e){var d=this.attrs,g=this._.scroller,l=d["scroll-ratio"],n=d["scroll-position"],m=0,h=c*l,d="none"===d["scroll-display-buttons"];c&&(c-=1);a&&(a+=.5);e&&(e-=1);b&&(b+=.5);g.track.attr({width:c,height:e,y:b,x:a}).crisp();
d||(m=F(e,.5*c),h-=2*m*l,g.start.attr({width:m,height:e,x:a,y:b}),g.arrowstart.attr("polypath",[3,a+.5*m,b+.5*e,.25*m,180]),g.end.attr({width:m,height:e,x:a+c-m,y:b}),g.arrowend.attr("polypath",[3,a+c-.5*m,b+.5*m,.25*m,0]));g.trackLength=c-2*m-h;g.trackOffset=a+m+.5;g.anchorOffset=g.trackOffset+.5*(h-1);g.anchor.attr({height:e,width:h-1,y:b,x:g.trackOffset+g.trackLength*n}).crisp()},"scroll-repaint-vertical":function(a,b,c,e){var d=this.attrs,g=this._.scroller,l=d["scroll-ratio"],n=d["scroll-position"],
m=0,h=e*l,d="none"===d["scroll-display-buttons"];c&&(c-=1);a&&(a+=.5);e&&(e-=1);b&&(b+=.5);g.track.attr({width:c,height:e,y:b,x:a}).crisp();d||(m=F(c,.5*e),h-=2*m*l,g.start.attr({width:c,height:m,x:a,y:b}),g.arrowstart.attr("polypath",[3,a+.5*c,b+.5*m,.25*m,90]),g.end.attr({width:c,height:m,x:a,y:b+e-m}),g.arrowend.attr("polypath",[3,a+.5*c,b+e-.5*m,.25*m,-90]));g.trackLength=e-2*m-h;g.trackOffset=b+m+.5;g.anchorOffset=g.trackOffset+.5*(h-1);g.anchor.attr({height:h-1,width:c,y:g.trackOffset+g.trackLength*
n,x:a}).crisp()},fill:function(a){var b=this.attrs,c=this._.scroller,e=b["scroll-repaint"],d="flat"===b["scroll-display-style"],g="horizontal"===b["scroll-orientation"],l={stroke:"none"},n;h&&e&&3<(n=16-e[g&&3||2])&&(l.stroke=V,l["stroke-width"]=n);a=t.color(a);a.error&&(a="#000000");a="opacity"in a?"rgba("+[a.r,a.g,a.b,a.opacity]+")":"rgb("+[a.r,a.g,a.b]+")";l.fill=d&&a||[90*g,t.tintshade(a,.15).rgba,a].join("-");l.stroke=t.tintshade(a,-.75).rgba;c.track.attr(l);l.fill=d&&t.tintshade(a,-.6).rgba||
[270*g,t.tintshade(a,.3).rgba+":40",t.tintshade(a,-.7).rgba].join("-");l.stroke=t.tintshade(a,-.6).rgba;c.anchor.attr(l);l.stroke="none";"none"!==b["scroll-display-buttons"]&&(l.fill=V,c.start.attr(l),c.end.attr(l),l.fill=t.tintshade(a,-.4).rgba,c.arrowstart.attr(l),c.arrowend.attr(l));return!1}}},{name:"button",button:function(a,b,c,e,d,g){g=this.group("button",g);var l;g._.button={bound:this.rect(g),tracker:this.rect(g).attr({fill:V,stroke:V,cursor:"pointer"}).data("compositeButton",g)};!t.is(d,
"object")&&(d={});for(l in t.fn.button.fn)g[l]=t.fn.button.fn[l];for(l in t.fn.button.ca)g.ca[l]=t.fn.button.ca[l];return g.attr({ishot:!0,"button-padding":[d.horizontalPadding,d.verticalPadding],"button-label":c,"button-symbol":e,"button-disabled":d.disabled||"false","button-symbol-position":d.symbolPosition,"button-symbol-padding":d.symbolPadding}).attr("button-repaint",[a,b,d.width,d.height,d.r])},data:{hoverin:function(){var a=this._.button.hoverbackIn;a&&!1===a()||(this.attr("fill","hover").hovered=
!0)},hoverout:function(){var a=this._.button.hoverbackOut;a&&!1===a()||(this.attr("fill",(this.pressed||this.active)&&"active"||"normal").hovered=!1)},mousedown:function(){this.attr("fill","active").pressed=!0},mouseup:function(){var a=this._.button.callback;this.attr("fill",this.hovered&&"hover"||this.active&&"active"||"normal").pressed=!1;a()}},fn:{tooltip:function(){t.el.tooltip&&t.el.tooltip.apply(this._.button.tracker,arguments);return this},buttonclick:function(a,b){var c=this._.button;b=b||
this;c.callback=function(){return a.apply(b,arguments)};return this},labelcss:function(){var a=this._.button,b=a.label;a.cssArg=arguments;b&&b.css.apply(b,arguments);return this.attr("button-repaint",this.attrs["button-repaint"])},buttonhover:function(a,b,c,e){var d=this._.button;c=c||this;e=e||this;d.hoverbackIn=function(){return a.apply(c,arguments)};d.hoverbackOut=function(){return b.apply(e,arguments)};return this},remove:function(){var a=this._.button,b;this.attr("button-disabled","true");for(b in a)a[b]&&
a[b].remove&&a[b].remove(),a[b]=null;delete this._.button;t.el.remove.apply(this,arguments)}},ca:{"button-active":function(a){this.attr("fill",(this.active=!!a)?"active":this.hovered&&"hover"||"normal")},"button-disabled":function(a){var b=this._.button.tracker,c=this.attrs["button-disabled"],e=this.paper.button.data;a=xa[a];c=xa[c];if(void 0!==a&&a!==c)switch(a){case !0:b.attr("fill","rgba(204,204,205,.5)").unmousedown(e.mousedown).unmouseup(e.mouseup).unhover(e.hoverin,e.hoverout);break;case !1:b.attr("fill",
V).mousedown(e.mousedown,this).mouseup(e.mouseup,this,!0).hover(e.hoverin,e.hoverout,this,this)}},"button-label":function(a){var b=this._.button,c=this.attrs,e=b.label,d=b.cssArg,g=this.attrs["button-repaint"];a=N(a||"");"none"===a?e&&(b.label=e.remove()):a&&(!e&&(e=b.label=this.paper.text(this).insertBefore(b.tracker)),e.attr({text:a,"text-anchor":"middle","vertical-align":"middle"}),d&&d.length&&e.css.apply(e,d));g&&c["button-label"]!==a&&this.attr("button-repaint",g)},"button-symbol":function(a){var b=
this.attrs,c=this._.button,e=c.symbol,d=this.attrs["button-repaint"];a=N(a||"");"none"===a?e&&(c.symbol=e.remove()):a&&!e&&(c.symbol=this.paper.symbol(this).insertAfter(c.bound));d&&b["button-symbol"]!==a&&this.attr("button-repaint",d)},"button-symbol-position":function(a){return{"button-symbol-position":{top:"top",right:"right",bottom:"bottom",left:"left",none:"none"}[N(a).toLowerCase()]||"none"}},"button-symbol-padding":function(a){return{"button-symbol-padding":m(a)}},"button-padding":function(a,
b){return{"button-padding":[null==a&&(a=5)||m(a),null==b&&a||m(b)]}},"button-repaint":function(a,b,c,e,d){var g=this._.button,l=g.bound,n=g.label,m=g.symbol,h=this.attrs,p=h["button-padding"],u=p[0],H=p[1],M,B;void 0===a&&(a=0);void 0===b&&(b=0);if(void 0===c||void 0===e)M=n&&n.getBBox()||{width:0,height:0},void 0===c&&(c=2*u+M.width),void 0===e&&(e=2*H+M.height);l=t.crispBound(a,b,c,e,l.attr("stroke-width"));l.r=t.pick(d,L(.1*F(e,c)));a=l.x;b=l.y;c=l.width;e=l.height;n&&n.attr({x:a+c/2,y:b+e/2});
if(m){!t.is(B=h["button-symbol-padding"],"finite")&&(B=.2*e);d=e-H;M=.5*d;switch(h["button-symbol-position"]+(n&&"+"||"-")){case "right+":a=a+(c+(2*M+H))-M-u;b+=.5*e;n.attr("transform",["t",-(d+B),0]);break;case "left+":a=a+u+M;b+=.5*e;n.attr("transform",["t",d+B,0]);break;case "top+":a+=.5*c;b=b+p[1]+M;n.attr("transform",["t",0,d+B]);break;case "bottom+":a+=.5*c;b=b+(e+(2*M+B))-H-M;n.attr("transform",["t",0,-(d+B)]);break;default:a+=.5*c,b+=.5*e}m.attr("symbol",[h["button-symbol"],a,b,M])}g.bound.attr(l);
g.tracker.attr(l)},fill:function(a,b,c,e){var d=this._.button,g=d.bound,l=d.symbol,n=d.label,m={normal:d.gradient,active:d.gradientActive,hover:d.gradientHover}[a];m||(a=t.getRGB(a),a.error&&(a=t.color("#cccccc")),a="opacity"in a?"rgba("+[a.r,a.g,a.b,a.opacity]+")":"rgb("+[a.r,a.g,a.b]+")",d.gradient=[90,t.tintshade(a,-.8).rgba+":0",t.tintshade(a,.8).rgba+":100"].join("-"),d.gradientActive=[270,t.tintshade(a,-.8).rgba+":0",t.tintshade(a,.8).rgba+":100"].join("-"),e=t.getRGB(e),e.error&&(e=a)||(e=
"opacity"in e?"rgba("+[e.r,e.g,e.b,e.opacity]+")":"rgb("+[e.r,e.g,e.b]+")"),d.gradientHover=[90,t.tintshade(e,-.9).rgba+":0",t.tintshade(e,.7).rgba+":100"].join("-"),c=c||t.tintshade(a,.2).rgba,b=b||t.tintshade(a,-.2).rgba,d.symbolFill=c,d.labelFill=b,m=(this.pressed||this.active)&&d.gradientActive||this.hovered&&d.gradienthover||d.gradient);g.attr("fill",m);l&&l.attr("fill",d.symbolFill);n&&n.attr("fill",d.labelFill);return!1},stroke:function(a,b){var c=this._.button,e=c.symbol;a=t.color(a);a.error&&
(a=t.color("#999999"));c.bound.attr("stroke",a);e&&e.attr("stroke",b||a);return!1},"stroke-width":function(a,b){var c=this._.button,e=c.symbol;c.bound.attr("stroke-width",a);c.tracker.attr("stroke-width",a);e&&e.attr("stroke-width",b);return!1}}},{name:"trianglepath",trianglepath:function(){var a=arguments,b=t._lastArgIfGroup(a);return this.path(b).attr("trianglepath",[a[0],a[1],a[2],a[3],a[4],a[5],a[6]||0,a[7]||0,a[8]||0])},fn:{sides:function(){var a=this._args;return[M(a[0],a[1],a[2],a[3]),M(a[2],
a[3],a[4],a[5]),M(a[4],a[5],a[0],a[1])]},enclosedAngles:function(){var a=this._sides;return[w((b(a[0],2)+b(a[2],2)-b(a[1],2))/(2*a[0]*a[2])),w((b(a[0],2)+b(a[1],2)-b(a[2],2))/(2*a[0]*a[1])),w((b(a[2],2)+b(a[1],2)-b(a[0],2))/(2*a[2]*a[1]))]},semiperimeter:function(){var a=this._sides||this.sides();return(a[0]+a[1]+a[2])/2}},ca:{trianglepath:function(b,c,e,d,l,n,m,h,p){if(m||h||p){this._args=arguments;this._sides=this.sides();var t=this.enclosedAngles(),u;u=this.semiperimeter();u=g(u*(u-this._sides[0])*
(u-this._sides[1])*(u-this._sides[2]))/u;t=[F(m,u)/a(t[0]/2),F(h,u)/a(t[1]/2),F(p,u)/a(t[2]/2)];t=[T(b,c,l,n,t[0]),T(b,c,e,d,t[0]),T(e,d,b,c,t[1]),T(e,d,l,n,t[1]),T(l,n,e,d,t[2]),T(l,n,b,c,t[2])];this.attr({path:["M",t[0].x,t[0].y,"Q",b,c,t[1].x,t[1].y,"L",t[2].x,t[2].y,"Q",e,d,t[3].x,t[3].y,"L",t[4].x,t[4].y,"Q",l,n,t[5].x,t[5].y,"L",t[0].x,t[0].y]})}else this.attr({path:["M",b,c,"L",e,d,l,n,"Z"]})}}}]);t.ca["text-bound"]=function(a,b,c,e,d,g){e=this.paper;var l=this._.textbound;if("text"===this.type){if(!(b&&
"none"!==b||a&&"none"!==a))return this._.textbound=l&&l.unfollow(this).remove(),!1;c&&t.is(c,"finite")||(c=0);d&&t.is(d,"finite")||(d=0);!l&&(l=this._.textbound=e.rect(0,0,0,0,this.group).follow(this,t.ca["text-bound"].reposition,"before"));l.attr({stroke:b,"stroke-width":c,fill:a,"shape-rendering":1===c&&"crisp"||"",r:d});g&&l.attr("stroke-dasharray",g);t.ca["text-bound"].reposition.call(l,this.attr(),this);return!1}};t.ca["text-bound"].reposition=function(a,b){var c={},e,d,g,l,n;a.hasOwnProperty("visibility")&&
this.attr("visibility",a.visibility);if(a.hasOwnProperty("text-bound")||a.hasOwnProperty("x")||a.hasOwnProperty("y")||a.hasOwnProperty("text")||a.hasOwnProperty("text-anchor")||a.hasOwnProperty("text-align")||a.hasOwnProperty("font-size")||a.hasOwnProperty("line-height")||a.hasOwnProperty("vertical-align")||a.hasOwnProperty("transform")||a.hasOwnProperty("rotation"))e=b.attrs["text-bound"],d=N(e&&e[3]||"0").split(ua),e=m(d[0])||0,d=t.pick(m(d[1]),e),g=b.getBBox(),l=g.width,n=g.height,isNaN(l)||(c.x=
g.x-e,c.y=g.y-d,c.width=l+2*e,c.height=n+2*d),this.attr(c)};t.fn.symbol=function(){var a=arguments,b=a.length-1,c=a[b];c&&c.constructor===t.el.constructor?a[b]=void 0:c=void 0;b=this.path(void 0,c);b.ca.symbol=t.fn.symbol.ca.symbol;return a.length===!!c+0?b:b.attr("symbol",a)};t.fn.symbol.cache={"":t._cacher(function(a,b,c,e){return 3<arguments.length?["M",a,b,"h",c,"v",e,"h",-c,"v",-e,"z"]:["M",a-c,b-c,"h",c*=2,"v",c,"h",-c,"v",-c,"z"]})};t.fn.symbol.ca={symbol:function(a){var b=t.is(a,"object")&&
1===arguments.length&&!t.is(a,"function")?a:arguments,c;b===a&&(a=b[0]);b=(c=t.is(a,"function")&&a||t.fn.symbol.cache[a]||t.fn.symbol.cache[""])&&c.apply(t,E.call(b,1));t.is(b,"array")||t.is(b,"string")?this.attr("path",b):b&&this.attr(b)}};t.addSymbol=function(a,b){var c=t.is(b,"function")&&(c={},c[a]=b,c)||a,e=t.fn.symbol.cache,d=[],g;for(g in c)b=c[g],e[g]=t.is(b,"function")&&t._cacher(b,t)||(d.push(g),b);for(;g=d.pop();)e[g]=e[e[g]]};t.svg?(ba="$1",oa=function(a){a?"string"===typeof a?a=a.replace(Y,
ba):a.toString=da:a="M0,0";this.node.setAttribute("d",a.toString());return this},t._engine.litepath=function(a,b,c,e){a=u("path");(e||b).canvas.appendChild(a);b=new U(a,b,e);b.type="litepath";b.id=a.raphaelid=t._oid++;a.raphael=!0;ga(b,{fill:"none",stroke:"#000"});return b},t._getPath.litepath=function(a){return t.parsePathString(a.node.getAttribute("d"))}):t.vml&&(ba=function(a,b){return ea[b]||b},H=function(){this._transform.apply(this,arguments);this._.bcoord&&(this.node.coordsize=this._.bcoord);
return this},oa=function(a){a?"string"===typeof a?a=a.replace(Y,ba):a.toString=da:a="M0,0";this.node.path=a;return this},t._engine.litepath=function(a,b,c,e){a=u("shape");var d=a.style,g=new U(a,b,e);d.cssText="position:absolute;left:0;top:0;width:21600px;height:21600px;";c=m(c);isNaN(c)?a.coordsize="21600 21600":(g._.bzoom=c,d.width="1px",d.height="1px",a.coordsize=g._.bcoord=c+" "+c);a.coordorigin=b.coordorigin;g.type="litepath";g.id=a.raphaelid=t._oid++;a.raphael=!0;g._transform=g.transform;g.transform=
H;t._setFillAndStroke(g,{fill:"none",stroke:"#000"});(e||b).canvas.appendChild(a);b=u("skew");b.on=!0;a.appendChild(b);g.skew=b;return g},t._getPath.litepath=function(a){return t.parsePathString(a.node.path||"")});t.fn.litepath=function(a,b,c){b&&b.constructor===U&&(c=b,b=void 0);a&&a.constructor===U&&(c=a,a="");b=t._engine.litepath(a,this,b,c);b.ca.litepath=oa;a&&b.attr("litepath",t.is(a,"array")?[a]:a);return this.__set__&&this.__set__.push(b),this._elementsById[b.id]=b}}]);
FusionCharts.register("module",["private","modules.renderer.js-htmlrenderer",function(){var d=this.hcLib,h=d.Raphael,D=d.dem,z=this.window,p=z.document,c=/msie/i.test(z.navigator.userAgent)&&!z.opera,I="VML"===h.type,b="createTouch"in p,P={cursor:"cursor"},a={x:"left",y:"top",strokeWidth:"borderThickness","stroke-width":"borderThickness",width:"width",height:"height"},w={fill:"backgroundColor",stroke:"borderColor",color:"color"},F={left:0,top:0,padding:0,border:"none",margin:0,outline:"none","-webkit-apperance":"none",
position:"absolute",zIndex:20},L,B=function(b,c,d,g){b=p.createElement(b);for(var h in c)a[h]?b.style[h]=c[h]:b.setAttribute(h,c[h]);for(h in d)b.style[h]=d[h];g&&g.appendChild&&g.appendChild(b);return b},g;g=function(a,b,c){b&&b instanceof g&&(b=b.element);(this.element=B(a,c,F,b)).ishot="true";this.nodeName=a.toLowerCase();this.added=Boolean(b)};g.prototype={attr:function(b){var d=this.element,g={},h,B,n,V,t,z,u;if("object"!==typeof b){if(!(g=this[b])){if("string"===typeof b)d&&d.getAttribute&&
(V=d.getAttribute(b));else if(void 0!==b&&null!==b&&"object"===typeof b)for(n in b)d.setAttribute(n,b[n]);g=V}return g}for(h in b){n=b[h];if(P[h]){switch(h){case "cursor":"pointer"===n&&I&&(n="hand")}d.style[P[h]]=n;B=!0}else if(a[h])d.style[a[h]]=n+"px",B=!0;else if(w[h])d.style[w[h]]=n&&n.replace(/^#?([a-f0-9]+)/ig,"#$1")||"none",B=!0;else if(/^visibility$/i.test(h))B="hidden"===n,d.style.display=B?"none":"",this.hidden=B,B=!0;else if(/^opacity$/i.test(h))d.style.opacity=n,c&&(B=100*Number(n),d.style.filter=
"progid:DXImageTransform.Microsoft.Alpha(Opacity="+B+")"),B=!0;else if(/^innerhtml$/i.test(h)){if(I&&"select"==d.nodeName.toLowerCase()){for(B=n.match(/<option\s?[\s\S]*?(\/>|><\/option>|>[\s\S]*?<\/option>)/ig);d.firstChild;)d.removeChild(d.firstChild);t=0;for(z=B.length;t<z;t+=1)V=B[t],u=p.createElement("option"),/<option\s([\s\S]*[\'\"])\s*?(\/>|>[\s\S]*<\/option>)/ig.test(V)&&(u.value=V.replace(/<option\s([\s\S]*[\'\"])\s*?(\/>|>[\s\S]*<\/option>)/ig,"$1").replace(/[\s\S]*value\s*\=\s*[\'\"]([\s\S]*)[\'\"]/,
"$1")),u.text=V.replace(/<option\s*[\s\S]*[\'\"]?\s*?[\/>|\>]([\s\S]*)<\/option>/ig,"$1 "),d.options.add(u)}else"input"!==d.nodeName.toLowerCase()&&void 0!==n&&(d.innerHTML=n||"");B=!0}else/^text$/i.test(h)?("input"!==d.nodeName.toLowerCase()&&(d.innerHTML="",void 0!==n&&d.appendChild(p.createTextNode(n))),B=!0):/^type$/i.test(h)&&c&&this.added&&(B=!0);B&&(g[h]=n,delete b[h],B=!1)}for(h in b)d.setAttribute(h,b[h]);for(h in g)this[h]=b[h]=g[h],delete g[h];return this},val:function(a){var b=this.element,
c=void 0===a;return"input"===this.nodeName&&"checkbox"===b.getAttribute("type")?c?this.checked()?1:0:this.checked(a):c?b.value:(b.value=a,this)},checked:function(a){var b=this.element;return void 0===a?b.checked:(a?b.setAttribute("checked","checked"):b.removeAttribute("checked"),this)},css:function(a,b){var c=this.element.style,d;if("object"===typeof a)for(d in a)c[d]=a[d];else d&&void 0!==b&&(c[d]=b);return this},translate:function(a,b){var c=this.element;void 0!==a&&(c.style.left=a+"px");void 0!==
b&&(c.style.top=b+"px");return this},add:function(a,b){var c=this.element,d=a.element;b?d.insertBefore(c,d.firstChild):d.appendChild(c);this.added=!0;return this},hide:function(){this.element.style.display="none";return this},show:function(){this.element.style.display="";return this},focus:function(){"function"===typeof this.element.focus?this.element.focus():d.dem.fire(this.element,"focus")},destroy:function(){var a=this.element||{};a.onclick=a.onmouseout=a.onmouseover=a.onmousemove=a.onblur=a.onfocus=
null;L||(L=B("div"));a&&L.appendChild(a);L.innerHTML="";delete this.element;return null},on:I?function(a,b){this.element["on"+a]=function(){var a=z.event;a.target=a.srcElement;b(a)};return this}:function(a,c){var d=c;b&&"click"===a&&(a="touchstart",d=function(a){a.preventDefault();c()});this.element["on"+a]=d;return this},bind:function(a,b,c){D.listen(this.element,a,b,c);return this},unbind:function(a,b){D.unlisten(this.element,a,b);return this},trigger:function(a,b){D.fire(this.element,a,b);return this},
fadeIn:function(a,b){var c="fast"===a?400:1E3;this.show();this.attr({opacity:0});d.danimate.animate(this.element,{opacity:1},c,"linear",b)}};g.prototype.constructor=g;h.fn.html=function(a,b,c,d){var h={},n;b&&"type"in b&&(h.type=b.type,delete b.type);a=(new g(a,d,h)).css(c).attr(b);for(n in h)b[n]=h[n];return a}}]);
FusionCharts.register("module",["private","modules.renderer.js-raphaeltooltip",function(){var d=this,h=d.window,D=h.document,z=D.body||D.getElementsByTagName("body")[0],p=d.hcLib,c=p.Raphael,I=c.eve,b=p.createElement,P=p.addEvent,a=p.removeEvent,w=p.getPosition,F=p.hasTouch,L=p.getTouchEvent,B=h.Math,g=B.ceil,e=B.floor,l={},m=h.screen.availHeight,N=h.screen.availWidth,E={"":1,moz:1,webkit:1,o:1,ms:1},n={borderRadius:"borderRadius",boxShadow:"boxShadow"},V=/\-([a-z])/ig,t=function(a,b){return b.toUpperCase()},
X=function(a){var b=u.forbiddenStyle,e,d,g;for(e in a)d=V.test(e)?e.replace(V,t):e,void 0!==a[e]&&!b[d]&&(this[d]=a[e]),c.vml&&/color/ig.test(d)&&(this[d]=c.getRGB(this[d]).toString());for(e in n)if(this[e])for(g in E)this[g+e]=this[e]},u=p.toolTip={elementId:"fusioncharts-tooltip-element",element:null,lastTarget:null,currentTarget:null,currentPaper:null,pointeroffset:12,prevented:!1,defaultStyle:p.extend2(X.prototype,{backgroundColor:"#ffffee",borderColor:"#000000",borderWidth:"1px",color:"#000000",
fontSize:"10px",lineHeight:"12px",padding:"3px",borderStyle:"solid"}),defaultContainerStyle:{position:"absolute",textAlign:"left",margin:"0",zIndex:"99999",pointer:"default",display:"block"},forbiddenStyle:{}},ga=function(b){!0===u._oobready?u._oobready=!1:(a(z,"touchstart",ga),!u.hidden&&u.currentTarget&&(b=b.srcElement||b.target||l,b.raphael&&u.currentTarget.paper.getById(b.raphaelid)===u.currentTarget||u.hide()))};c.svg&&(u.defaultContainerStyle.pointerEvents="none",u.defaultStyle.borderRadius=
"0",u.defaultStyle.boxShadow="none");c.vml&&(u.forbiddenStyle.borderRadius=!0,u.forbiddenStyle.boxShadow=!0,u.defaultStyle.filter="");u.setup=function(){var a=u.container,e=u.textElement,g=u.style,l=u.defaultContainerStyle,n=u.forbiddenStyle,h;a||(a=u.element=b("span"),(D.body||D.getElementsByTagName("body")[0]).appendChild(a),a.setAttribute("id",u.elementId),g=u.containerStyle=a.style,e=u.textElement=b("span"),a.appendChild(e),u.style=c.vml?e.runtimeStyle:e.style,u.style.overflow="hidden",u.style.display=
"block",u.hidden=!1,u.hide());for(h in l)!n[h]&&(g[h]=l[h]);u.scatted=!0;I.on("raphael.drag.start.*",function(){u.scatted&&(u.waitingScat=!0)});I.on("raphael.drag.move.*",function(){u.waitingScat&&(u.block(),u.waitingScat=!1)});I.on("raphael.drag.end.*",function(){u.waitingScat=!1;u.scatted&&u.unblock(!0)});I.on("raphael.remove",function(){if(u.currentPaper===this||u.currentTarget&&u.currentTarget.paper===this)u.hide(),u.currentTarget=u.currentPaper=null});d.addEventListener("LinkedChartInvoked",
function(a){u.currentPaper===a.sender.jsVars.hcObj.paper&&u.hide()});d.addEventListener("realTimeUpdateComplete",function(a){u.currentPaper===a.sender.jsVars.hcObj.paper&&u.hide()})};u.restyle=function(a){var b=u.style,c;for(c in a)b[c]=a[c]};u.onelement=function(a){if(!a.__tipProcessed){var b=this.paper,c="group"===this.type?b&&b._elementFromEvent(a):this,e=b.__tipStyle;c&&e&&c.__tipNeeded&&((a.originalEvent||a).FusionChartsPreventEvent&&u.preventTooltip(),u.hiding&&(u.hiding=clearTimeout(u.hiding)),
u.currentPaper!==b&&(b.__tipCp=b.canvas&&w(b.canvas.parentNode,!0)||{},u.restyle(b.__tipStyle),u.currentPaper=b),u.lastTarget=u.currentTarget,u.currentTarget=c,u.scatted=c.__tipScatted,u.onredraw.call(this,a),a.__tipProcessed=!0,F&&(u._oobready=!0,P(z||(z=D.body||D.getElementsByTagName("body")[0]),"touchstart",ga)))}};u.onredraw=function(a){a.__tipProcessed||(a.__tipProcessed=!0,(this.paper&&this.paper._elementFromEvent(a))===u.currentTarget&&(a=L(a),u.x=e(a.pageX||a.clientX+D.body.scrollLeft+D.documentElement.scrollLeft||
0),u.y=e(a.pageY||a.clientY+D.body.scrollTop+D.documentElement.scrollTop||0),u.redraw()))};u.onhide=function(a){a.__tipProcessed||(a.__tipProcessed=!0,(this.paper&&this.paper._elementFromEvent(a))===u.currentTarget&&(u.hiding=setTimeout(u.hide,200)))};u.redraw=function(){if(!u.prevented&&!u.blocked&&u.currentTarget&&u.currentTarget.__tipNeeded){var a=u.currentTarget,b=a.paper,c=u.textElement,e=u.containerStyle,d=u.style,l=a.__tipText,a=u.pointeroffset,n=b.__tipCp,h=D.documentElement||D.body,t=h.scrollLeft,
h=h.scrollTop,p=u.x,B=u.y,w,q=b.width,E=b.height,b=b.__tipConstrain;if(100>q||100>E)b=!1;u.hidden&&(u.containerStyle.top="-999em",u.show());l!==u.text&&(u.text=l,e.width=e.height="",c.innerHTML=l,d.whiteSpace="nowrap",l=g(d.pixelWidth||c.offsetWidth||0),w=g(d.pixelHeight||c.offsetHeight||0),(u.textWidthOverflow=p+l>n.left+q)?(e.width=(q>l?l+2*a:q-2*a||0)+"px",d.whiteSpace="normal"):e.width="",(u.textHeightOverflow=w>E)?(e.height=(E||0)-2*a+"px",d.whiteSpace="normal"):e.height="");l=g(d.pixelWidth||
c.offsetWidth||0);w=g(d.pixelHeight||c.offsetHeight||0);b?(u.textWidthOverflow?p=(p-l<n.left?n.left:p-l)-t:p+a+l>n.left-t+q-a&&(p=p-l-a),u.textHeightOverflow?B=n.top-h:B+a+w>n.top-h+E-a&&(B=B-w-1.5*a)):(t+N<p+a+l&&(p=p-l-a),h+m<B+a+w&&(B=B-w-1.5*a));e.left=(p+a||0)+"px";e.top=(B+a||0)+"px";u.hidden&&u.show()}};u.hide=function(){u.hiding&&(u.hiding=clearTimeout(u.hiding));u.containerStyle.display="none";u.hidden=!0;u.prevented=!1};u.show=function(){u.blocked||(u.hiding&&(u.hiding=clearTimeout(u.hiding)),
u.containerStyle.display="inline",u.hidden=!1)};u.preventTooltip=function(){u.prevented=!0};u.block=function(){u.blocked=!0;u.containerStyle.display="none"};u.unblock=function(a){u.blocked=!1;a&&(u.containerStyle.display=u.hidden&&"none"||"inline")};c.fn.tooltip=function(a,b,e){b&&(b=.4*(void 0===b.opacity?1:b.opacity),c.svg?a.boxShadow="1px 1px 3px rgba(64,64,64,"+b+")":a.filter='progid:DXImageTransform.Microsoft.Shadow(Strength=2, Direction=135, Color="#404040", shadowOpacity="'+b/2+'")');this.__tipStyle=
new X(a);this.__tipCp=this.canvas&&w(this.canvas.parentNode,!0)||{};this.__tipConstrain=Boolean(e);return this};c.el.trackTooltip=function(a){var b=!!this.__tiptracking;if(void 0===a||(a=!!a)===b)return this;a?F?this.touchstart(u.onelement):(this.mouseover(u.onelement),this.mousemove(u.onredraw),this.mouseout(u.onhide)):F?this.untouchstart(u.onelement):(this.unmouseover(u.onelement),this.unmousemove(u.onredraw),this.unmouseout(u.onhide));this.__tiptracking=a;return this};c.el.tooltip=function(a,b,
e,d,g){u.setup();c.el.tooltip=function(a,b,c,e,d){b=!1===a||void 0===a||""===a;this.__tipScatted=void 0===e?this.__tipScatted:!e;void 0===this.__tipScatted&&(this.__tipScatted=!0);null!==d&&(this.__tip_blocked=d);b^!this.__tipText&&(this.__tipNeeded=!b);this.__tipText=a;if(u.currentTarget===this&&a!==u.text&&!u.hidden)u[b?"hide":"redraw"]();return this};return c.el.tooltip.call(this,a,b,e,d,g)};d.core._setTooltipZIndex=function(a){a=parseInt(a,10);u&&!isNaN(a)&&(u.defaultContainerStyle.zIndex=a,u.containerStyle&&
(u.containerStyle.zIndex=a))}}]);
FusionCharts.register("module",["private","modules.renderer.js-smartlabel",function(){var d=this.hcLib,h=d.isIE,D=d.hasSVG,z=Math.max,p=this.window,c=/ HtmlUnit/.test(p.navigator.userAgent),I=p.document,b=/ AppleWebKit\//.test(p.navigator.userAgent),P=!!I.createElement("canvas").getContext,a=!(!P||!I.createElement("canvas").getContext("2d").measureText),p=function(){function p(a,b,c){if(!a||!a.length)return 0;var e=c.getWidthFunction(),d=0,g=0,g=e(a),l=g/a.length;c=b;d=Math.ceil(b/l);if(g<b)return a.length-
1;d>a.length&&(c=b-g,d=a.length);for(;0<c;)if(c=b-e(a.substr(0,d)),g=Math.floor(c/l))d+=g;else return d;for(;0>c;)if(c=b-e(a.substr(0,d)),g=Math.floor(c/l))d+=g;else break;return d}function F(a,b){b=5<b?b:5;this.maxContainers=20>b?b:20;this.last=this.first=null;this.containers={};this.length=0;this.rootNode=a;if(X){var c=I.createElementNS("http://www.w3.org/2000/svg","svg");c.setAttributeNS("http://www.w3.org/2000/svg","xlink","http://www.w3.org/1999/xlink");c.setAttributeNS("http://www.w3.org/2000/svg",
"height","0");c.setAttributeNS("http://www.w3.org/2000/svg","width","0");this.svgRoot=c;this.rootNode.appendChild(c)}}function L(a,b,d){if("undefined"!==typeof a&&"object"!==typeof a){this.id=a;var g;"string"===typeof b&&(b=I.getElementById(b));a:{if(b&&(b.offsetWidth||b.offsetHeight)){if(b.appendChild){b.appendChild(b=I.createElement("div"));b.className="fusioncharts-smartlabel-container";b.setAttribute("aria-hidden","true");b.setAttribute("role","presentation");a=b;break a}}else if((a=I.getElementsByTagName("body")[0])&&
a.appendChild){b=I.createElement("div");b.className="fusioncharts-smartlabel-container";b.setAttribute("aria-hidden","true");b.setAttribute("role","presentation");a.appendChild(b);a=b;break a}a=void 0}a=this.parentContainer=a;a.innerHTML="WgI";if(c||!a.offsetHeight&&!a.offsetWidth)X=!0;a.innerHTML="";for(g in e)a.style[g]=e[g];this.containerManager=new F(a,10);this.showNoEllipses=!d;this.init=!0;this.style={};this.setStyle()}}var B=d.supportedStyle,g={fontWeight:1,"font-weight":1,fontStyle:1,"font-style":1,
fontSize:1,"font-size":1,fontFamily:1,"font-family":1},e={position:"absolute",top:"-9999em",left:"-9999em",whiteSpace:"nowrap",padding:"0px",width:"1px",height:"1px",overflow:"hidden"},l=b?0:4.5,m=0,N=/\b_SmartLabel\b/,E=/\b_SmartLabelBR\b/,n=/(<[^<\>]+?\>)|(&(?:[a-z]+|#[0-9]+);|.)/ig,V=RegExp("\\<span[^\\>]+?_SmartLabel[^\\>]{0,}\\>(.*?)\\<\\/span\\>","ig"),t=/<[^>][^<]*[^>]+>/i,X=!1,u=0,ga=0,U,ka,xa;I.getElementsByClassName?(U="getElementsByClassName",ka="_SmartLabel",xa=!0):(U="getElementsByTagName",
ka="span",xa=!1);F.prototype={get:function(a){var b=this.containers,c=this.length,e=this.maxContainers,d,g="",l="",l=this.getCanvasFont(a);for(d in B)void 0!==a[d]&&(g+=B[d]+":"+a[d]+";");if(!g)return!1;if(b[g])g=b[g],this.first!==g&&(g.prev&&(g.prev.next=g.next),g.next&&(g.next.prev=g.prev),g.next=this.first,g.next.prev=g,this.last===g&&(this.last=g.prev),g.prev=null,this.first=g);else{if(c>=e)for(a=c-e+1;a--;)this.removeContainer(this.last);g=this.addContainer(g,l)}return g},getCanvasFont:function(b){var c,
e=[];if(!P||!a)return!1;for(c in g)void 0!==b[c]&&e.push(b[c]);return e.join(" ")},setMax:function(a){var b=this.length;a=5<a?a:5;a=20>a?a:20;if(a<b){for(b-=a;b--;)this.removeContainer(this.last);this.length=a}this.maxContainers=a},addContainer:function(a,b){var c,e;this.containers[a]=e={next:null,prev:null,node:null,ellipsesWidth:0,lineHeight:0,dotWidth:0,avgCharWidth:4,keyStr:a,canvasStr:b,charCache:{}};e.next=this.first;e.next&&(e.next.prev=e);this.first=e;this.last||(this.last=e);this.length+=
1;c=e.node=I.createElement("div");this.rootNode.appendChild(c);h&&!D?c.style.setAttribute("cssText",a):c.setAttribute("style",a);c.setAttribute("aria-hidden","true");c.setAttribute("role","presentation");c.style.display="inline-block";c.innerHTML="WgI";e.lineHeight=c.offsetHeight;e.avgCharWidth=c.offsetWidth/3;X?(c=e.svgText=I.createElementNS("http://www.w3.org/2000/svg","text"),c.setAttribute("style",a),this.svgRoot.appendChild(c),c.textContent="WgI",e.lineHeight=c.getBBox().height,e.avgCharWidth=
(c.getBBox().width-l)/3,c.textContent="...",e.ellipsesWidth=c.getBBox().width-l,c.textContent=".",e.dotWidth=c.getBBox().width-l):b?(c=e.canvas=I.createElement("canvas"),c.style.height=c.style.width="0px",this.rootNode.appendChild(c),e.context=c=c.getContext("2d"),c.font=b,e.ellipsesWidth=c.measureText("...").width,e.dotWidth=c.measureText(".").width):(c.innerHTML="...",e.ellipsesWidth=c.offsetWidth,c.innerHTML=".",e.dotWidth=c.offsetWidth,c.innerHTML="");return e},removeContainer:function(a){var b=
a.keyStr;b&&this.length&&a&&(this.length-=1,a.prev&&(a.prev.next=a.next),a.next&&(a.next.prev=a.prev),this.first===a&&(this.first=a.next),this.last===a&&(this.last=a.prev),a.node.parentNode.removeChild(a.node),a.canvas&&a.canvas.parentNode.removeChild(a.canvas),delete this.containers[b])},dispose:function(){var a,b=this.containers;this.maxContainers=null;for(a in b)this.removeContainer(b[a]);this.rootNode.parentNode.removeChild(this.rootNode);this.last=this.first=this.rootNode=null}};F.prototype.constructor=
F;L.prototype={dispose:function(){this.init&&(this.containerManager.dispose(),delete this.container,delete this.context,delete this.cache,delete this.containerManager,delete this.containerObj,delete this.id,delete this.style,delete this.parentContainer,delete this.showNoEllipses)},useEllipsesOnOverflow:function(a){this.init&&(this.showNoEllipses=!a)},getWidthFunction:function(){var a=this.context,b=this.container,c=this.containerObj.svgText;return c?function(a){var b;c.textContent=a;a=c.getBBox();
b=a.width-l;1>b&&(b=a.width);return b}:a?function(b){return a.measureText(b).width}:function(a){b.innerHTML=a;return b.offsetWidth}},getSmartText:function(a,b,c,e){if(!this.init)return!1;if(void 0===a||null===a)a="";var d={text:a,maxWidth:b,maxHeight:c,width:null,height:null,oriTextWidth:null,oriTextHeight:null,oriText:a,isTruncated:!1},g=!1,l,h,B=0,q,J,D,G=-1,P=g=-1;h=this.container;var F=this.context,L=0;D=0;var na,pa,za;za=[];var aa=0,Z=this.showNoEllipses?"":"...";J=this.lineHeight;var Ma,L=[],
G=l=-1;Ma=function(a){a=a.replace(/^\s\s*/,"");for(var b=/\s/,c=a.length;b.test(a.charAt(c-=1)););return a.slice(0,c+1)};g=-1;pa=this.getWidthFunction();if(h){if(!X){h.innerHTML=a;d.oriTextWidth=g=h.offsetWidth;d.oriTextHeight=D=h.offsetHeight;if(D<=c&&g<=b)return d.width=d.oriTextWidth=g,d.height=d.oriTextHeight=D,d;if(J>c)return d.text="",d.width=d.oriTextWidth=0,d.height=d.oriTextHeight=0,d}a=Ma(a).replace(/(\s+)/g," ");g=t.test(a);J=this.showNoEllipses?b:b-m;if(g){B=a.replace(n,"$2");a=a.replace(n,
'$1<span class="_SmartLabel">$2</span>');a=a.replace(/(<br\s*\/*\>)/g,'<span class="_SmartLabel _SmartLabelBR">$1</span>');h.innerHTML=a;aa=h[U](ka);F=0;for(pa=aa.length;F<pa;F+=1)if(a=aa[F],xa||N.test(a.className))Ma=a.innerHTML,""!==Ma&&(" "===Ma?G=L.length:"-"===Ma&&(l=L.length),L.push({spaceIdx:G,dashIdx:l,elem:a}),za.push(Ma));aa=0;l=L.length;u=L[0].elem.offsetWidth;if(u>b)return d.text="",d.width=d.oriTextWidth=d.height=d.oriTextHeight=0,d;u>J&&!this.showNoEllipses&&(J=b-2*ga,J>u?Z="..":(J=
b-ga,J>u?Z=".":(J=0,Z="")));za=L[0].elem.offsetLeft;F=L[0].elem.offsetTop;if(e)for(;aa<l;aa+=1)a=L[aa].elem,pa=a.offsetLeft-za+a.offsetWidth,pa>J&&(na||(na=aa),h.offsetWidth>b&&(q=aa,aa=l));else for(;aa<l;aa+=1)a=L[aa].elem,Ma=a.offsetHeight+(a.offsetTop-F),pa=a.offsetLeft-za+a.offsetWidth,e=null,pa>J?(na||(na=aa),pa>b&&(g=L[aa].spaceIdx,G=L[aa].dashIdx,g>P?(L[g].elem.innerHTML="<br/>",P=g):G>P?(L[G].elem.innerHTML=G===aa?"<br/>-":"-<br/>",P=G):a.parentNode.insertBefore(e=I.createElement("br"),a),
a.offsetHeight+a.offsetTop>c?(e?e.parentNode.removeChild(e):P===G?L[G].elem.innerHTML="-":L[g].elem.innerHTML=" ",q=aa,aa=l):na=null)):Ma>c&&(q=aa,aa=l);if(q<l){d.isTruncated=!0;na=na?na:q;for(aa=l-1;aa>=na;aa-=1)a=L[aa].elem,a.parentNode.removeChild(a);for(;0<=aa;aa-=1)a=L[aa].elem,E.test(a.className)?a.parentNode.removeChild(a):aa=0}d.text=h.innerHTML.replace(V,"$1");d.isTruncated&&(d.text+=Z,d.tooltext=B)}else{za=a.split("");l=za.length;h="";q=[];na=za[0];this.cache[na]?u=this.cache[na].width:
(u=pa(na),this.cache[na]={width:u});if(J>u)q=a.substr(0,p(a,J,this)).split(""),aa=q.length;else{if(u>b)return d.text="",d.width=d.oriTextWidth=d.height=d.oriTextHeight=0,d;Z&&(J=b-2*ga,J>u?Z="..":(J=b-ga,J>u?Z=".":(J=0,Z="")))}L=pa(q.join(""));D=this.lineHeight;if(e){for(;aa<l;aa+=1)if(na=q[aa]=za[aa],this.cache[na]?u=this.cache[na].width:(u=pa(na),this.cache[na]={width:u}),L+=u,L>J&&(h||(h=q.slice(0,-1).join("")),L>b))return d.text=Ma(h)+Z,d.tooltext=d.oriText,d.width=pa(d.text),d.height=this.lineHeight,
d;d.text=q.join("");d.width=L;d.height=this.lineHeight}else{for(;aa<l;aa+=1)if(na=q[aa]=za[aa]," "!==na||F||(na="&nbsp;"),this.cache[na]?u=this.cache[na].width:(u=pa(na),this.cache[na]={width:u}),L+=u,L>J&&(h||(h=q.slice(0,-1).join("")),L>b)){g=a.substr(0,q.length).lastIndexOf(" ");G=a.substr(0,q.length).lastIndexOf("-");g>P?(L=pa(q.slice(P+1,g).join("")),q.splice(g,1,"<br/>"),P=g,e=g+1):G>P?(G===q.length-1?(L=pa(q.slice(P+1,g).join("")),q.splice(G,1,"<br/>-")):(L=pa(q.slice(P+1,g).join("")),q.splice(G,
1,"-<br/>")),P=G,e=G+1):(q.splice(q.length-1,1,"<br/>"+za[aa]),g=q.length-2,L=pa(q.slice(P+1,g+1).join("")),P=g,e=aa);D+=this.lineHeight;if(D>c)return d.text=Ma(h)+Z,d.tooltext=d.oriText,d.width=b,d.height=D-this.lineHeight,d;B=z(B,L);h=null;na=p(a.substr(e),J,this);L=pa(a.substr(e,na||1));q.length<e+na&&(q=q.concat(a.substr(q.length,e+na-q.length).split("")),aa=q.length-1)}B=z(B,L);d.text=q.join("");d.width=B;d.height=D}return d}d.height=h.offsetHeight;d.width=h.offsetWidth}else d.error=Error("Body Tag Missing!");
return d},setStyle:function(a){if(!this.init)return!1;if(a!==this.style||this.styleNotSet){a||(a=this.style);var b=a,c=b.fontSize=b.fontSize||"12px";b.lineHeight=b.lineHeight||b["line-height"]||1.2*parseInt(c,10)+"px";this.style=a;(this.containerObj=a=this.containerManager.get(a))?(this.container=a.node,this.context=a.context,this.cache=a.charCache,this.lineHeight=a.lineHeight,m=a.ellipsesWidth,ga=a.dotWidth,this.styleNotSet=!1):this.styleNotSet=!0}},getTextSize:function(a,b,c){if(!this.init)return!1;
var e={text:a,width:null,height:null,oriTextWidth:null,oriTextHeight:null,isTruncated:!1},d=this.container;d&&(d.innerHTML=a,e.oriTextWidth=d.offsetWidth,e.oriTextHeight=d.offsetHeight,e.width=Math.min(e.oriTextWidth,b),e.height=Math.min(e.oriTextHeight,c),e.width<e.oriTextWidth||e.height<e.oriTextHeight)&&(e.isTruncated=!0);return e},getOriSize:function(a){if(!this.init)return!1;var b={text:a,width:null,height:null},c=this.container,e=this.getWidthFunction(),d=0;if(X){a=a.split(/(<br\s*\/*\>)/g);
c=a.length;for(b.height=this.lineHeight*c;c--;)d=z(d,e(a[c]));b.width=d}else c&&(c.innerHTML=a,b.width=c.offsetWidth,b.height=c.offsetHeight);return b}};return L.prototype.constructor=L}();d.SmartLabelManager=p}]);
FusionCharts.register("module",["private","modules.renderer.js-numberformatter",function(){var d=this,h=d.hcLib,D=h.pluckNumber,z=h.extend2,p=h.getValidValue,c=h.pluck,I=h.getFirstValue,b=Math.abs,P=Math.pow,a=Math.round,w=function(a){return a&&a.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")},F={},L=function(a){var b=[],c;for(c in a)b.push(c+"_"+a[c]);b.sort();return b.join(",")},B=function(a){var b={},c;for(c in a)b[c.toLowerCase()]=a[c];return b};h.NumberFormatter=function(){function d(b,c,e){var g;
if(0>=c)return a(b)+"";if(isNaN(c))return b+="",12<b.length&&-1!=b.indexOf(".")&&(c=12-b.split(".")[0].length,g=P(10,c),b=a(b*g)/g+""),b;g=P(10,c);b=a(b*g)/g+"";if(1==e)for(-1==b.indexOf(".")&&(b+=".0"),e=b.split("."),c-=e[1].length,e=1;e<=c;e++)b+="0";return b}function e(a,b,c,e,d){var g=Number(a),l="",h=!1,m="",p="",B=m=0;if(isNaN(g))return"";if(1E15<g)return g.toExponential(d?1:14);m=0;B=a.length;-1!=a.indexOf(".")&&(l=a.substring(a.indexOf(".")+1,a.length),B=a.indexOf("."));0>g&&(h=!0,m=1);m=
a.substring(m,B);a=m.length;d=e.length-1;g=e[d];if(a<g)p=m;else for(;a>=g;)p=(a-g?c:"")+m.substr(a-g,g)+p,a-=g,g=0>=(d-=1)?e[0]:e[d],a<g&&(p=m.substring(a,0)+p);""!=l&&(p=p+b+l);!0===h&&(p="-"+p);return p}var l,h={formatnumber:"1",formatnumberscale:"1",defaultnumberscale:"",numberscaleunit:["K","M"],numberscalevalue:[1E3,1E3],numberprefix:"",numbersuffix:"",decimals:"",forcedecimals:"0",yaxisvaluedecimals:"2",decimalseparator:".",thousandseparator:",",thousandseparatorposition:[3],indecimalseparator:"",
inthousandseparator:"",sformatnumber:"1",sformatnumberscale:"0",sdefaultnumberscale:"",snumberscaleunit:["K","M"],snumberscalevalue:[1E3,1E3],snumberprefix:"",snumbersuffix:"",sdecimals:"2",sforcedecimals:"0",syaxisvaluedecimals:"2",xFormatNumber:"0",xFormatNumberScale:"0",xDefaultNumberScale:"",xNumberScaleUnit:["K","M"],xNumberScaleValue:[1E3,1E3],xNumberPrefix:"",xNumberSuffix:""},B={mscombidy2d:{formatnumberscale:"1"}},E=function(a,b,e){var d,g,l,E,P,F,L,Y,ua,ba=b.name,da=z({},h),oa,H,M,T,q,J,
W,G,ja,La,Ca;(l=B[ba])&&(da=z(da,l));this.csConf=da;this.chartAPI=b;p(a.numberscaleunit)&&(d=a.numberscaleunit.split(","));if(g=p(a.snumberscaleunit,a.numberscaleunit))g=g.split(",");if(l=p(a.xnumberscaleunit,a.numberscaleunit))l=l.split(",");if(E=p(a.ticknumberscaleunit,a.numberscaleunit))E=E.split(",");if(P=p(a.ynumberscaleunit,a.numberscaleunit))P=P.split(",");p(a.numberscalevalue)&&(F=a.numberscalevalue.split(","));if(H=p(a.snumberscalevalue,a.numberscalevalue))H=H.split(",");if(L=p(a.xnumberscalevalue,
a.numberscalevalue))L=L.split(",");if(Y=p(a.ticknumberscalevalue,a.numberscalevalue))Y=Y.split(",");if(ua=p(a.ynumberscalevalue,a.numberscalevalue))ua=ua.split(",");if(p(a.thousandseparatorposition))for(oa=a.thousandseparatorposition.split(","),M=oa.length,q=h.thousandseparatorposition[0];M--;)T=parseInt(oa[M],10),0>=T&&(T=q),q=oa[M]=T;b||(b={});M=D(a.scalerecursively,0);T=D(a.sscalerecursively,M);q=D(a.xscalerecursively,M);J=D(a.maxscalerecursion,-1);W=D(a.smaxscalerecursion,J);G=D(a.xmaxscalerecursion,
J);ja=p(a.scaleseparator," ");La=p(a.sscaleseparator,ja);Ca=p(a.xscaleseparator,ja);J||(J=-1);this.baseConf=d={cacheStore:[],formatnumber:c(a.formatnumber,b.formatnumber,da.formatnumber),formatnumberscale:c(a.formatnumberscale,b.formatnumberscale,da.formatnumberscale),defaultnumberscale:I(a.defaultnumberscale,b.defaultnumberscale,da.defaultnumberscale),numberscaleunit:c(d,b.numberscaleunit,da.numberscaleunit).concat(),numberscalevalue:c(F,b.numberscalevalue,da.numberscalevalue).concat(),numberprefix:I(a.numberprefix,
b.numberprefix,da.numberprefix),numbersuffix:I(a.numbersuffix,b.numbersuffix,da.numbersuffix),decimalprecision:parseInt("auto"===a.decimals?da.decimalprecision:c(a.decimals,a.decimalprecision,b.decimals,da.decimals,b.decimalprecision,da.decimalprecision),10),forcedecimals:c(a.forcedecimals,b.forcedecimals,da.forcedecimals),decimalseparator:c(a.decimalseparator,b.decimalseparator,da.decimalseparator),thousandseparator:c(a.thousandseparator,b.thousandseparator,da.thousandseparator),thousandseparatorposition:c(oa,
b.thousandseparatorposition,da.thousandseparatorposition),indecimalseparator:I(a.indecimalseparator,b.indecimalseparator,da.indecimalseparator),inthousandseparator:I(a.inthousandseparator,b.inthousandseparator,da.inthousandseparator),scalerecursively:M,maxscalerecursion:J,scaleseparator:ja};p(d.inthousandseparator)&&(this.baseConf._REGinthousandseparator=new RegExp(w(d.inthousandseparator),"g"));p(d.indecimalseparator)&&(this.baseConf._REGindecimalseparator=new RegExp(w(d.indecimalseparator)));this.Y=
[];e||(e={cacheStore:[],formatnumber:d.formatnumber,formatnumberscale:d.formatnumberscale,defaultnumberscale:d.defaultnumberscale,numberscaleunit:d.numberscaleunit.concat(),numberscalevalue:d.numberscalevalue.concat(),numberprefix:d.numberprefix,numbersuffix:d.numbersuffix,decimalprecision:d.decimalprecision,forcedecimals:d.forcedecimals,decimalseparator:d.decimalseparator,thousandseparator:d.thousandseparator,thousandseparatorposition:d.thousandseparatorposition,indecimalseparator:d.indecimalseparator,
inthousandseparator:d.inthousandseparator,scalerecursively:M,maxscalerecursion:J,scaleseparator:ja},b.useScaleRecursively&&(e.numberscalevalue&&e.numberscalevalue.length)==(e.numberscaleunit&&e.numberscaleunit.length)||(e.scalerecursively=M=0),F={cacheStore:[],formatnumber:e.formatnumber,formatnumberscale:e.formatnumberscale,defaultnumberscale:e.defaultnumberscale,numberscaleunit:e.numberscaleunit.concat(),numberscalevalue:e.numberscalevalue.concat(),numberprefix:e.numberprefix,numbersuffix:e.numbersuffix,
decimalprecision:parseInt(c(a.yaxisvaluedecimals,e.decimalprecision,2),10),forcedecimals:c(a.forceyaxisvaluedecimals,e.forcedecimals),decimalseparator:e.decimalseparator,thousandseparator:e.thousandseparator,thousandseparatorposition:e.thousandseparatorposition.concat(),indecimalseparator:e.indecimalseparator,inthousandseparator:e.inthousandseparator,scalerecursively:M,maxscalerecursion:J,scaleseparator:ja},H={cacheStore:[],formatnumber:c(a.sformatnumber,b.sformatnumber,h.sformatnumber),formatnumberscale:c(a.sformatnumberscale,
b.sformatnumberscale,h.sformatnumberscale),defaultnumberscale:I(a.sdefaultnumberscale,b.sdefaultnumberscale,e.defaultnumberscale),numberscaleunit:c(g,b.snumberscaleunit,h.snumberscaleunit).concat(),numberscalevalue:c(H,b.snumberscalevalue,h.snumberscalevalue).concat(),numberprefix:I(a.snumberprefix,b.snumberprefix,h.snumberprefix),numbersuffix:I(a.snumbersuffix,b.snumbersuffix,h.snumbersuffix),decimalprecision:parseInt(c(a.syaxisvaluedecimals,a.sdecimals,a.decimals,b.sdecimals,h.sdecimals),10),forcedecimals:c(a.forcesyaxisvaluedecimals,
a.sforcedecimals,a.forcedecimals,b.sforcedecimals,h.sforcedecimals),decimalseparator:c(a.decimalseparator,b.decimalseparator,h.decimalseparator),thousandseparator:c(a.thousandseparator,b.thousandseparator,h.thousandseparator),thousandseparatorposition:e.thousandseparatorposition.concat(),indecimalseparator:c(a.indecimalseparator,b.indecimalseparator,h.indecimalseparator),inthousandseparator:c(a.inthousandseparator,b.inthousandseparator,h.inthousandseparator),scalerecursively:T,maxscalerecursion:W,
scaleseparator:La},g=z({},H),g.decimalprecision=parseInt(c(a.sdecimals,a.decimals,a.syaxisvaluedecimals,b.sdecimals,h.sdecimals),10),g.forcedecimals=c(a.sforcedecimals,a.forcedecimals,a.forcesyaxisvaluedecimals,b.sforcedecimals,h.sforcedecimals),g.cacheStore=[],b.useScaleRecursively&&(H.numberscalevalue&&H.numberscalevalue.length)==(H.numberscaleunit&&H.numberscaleunit.length)||(H.scalerecursively=T=0),/^(bubble|scatter|selectscatter)$/.test(ba)&&(F.formatnumber=c(a.yformatnumber,F.formatnumber),
F.formatnumberscale=c(a.yformatnumberscale,F.formatnumberscale),F.defaultnumberscale=I(a.ydefaultnumberscale,F.defaultnumberscale),F.numberscaleunit=c(P,F.numberscaleunit),F.numberscalevalue=c(ua,F.numberscalevalue),F.numberprefix=c(a.ynumberprefix,F.numberprefix),F.numbersuffix=c(a.ynumbersuffix,F.numbersuffix),e.formatnumber=c(a.yformatnumber,e.formatnumber),e.formatnumberscale=c(a.yformatnumberscale,e.formatnumberscale),e.defaultnumberscale=I(a.ydefaultnumberscale,e.defaultnumberscale),e.numberscaleunit=
c(a.ynumberscaleunit,e.numberscaleunit.concat()),e.numberscalevalue=c(a.ynumberscalevalue,e.numberscalevalue.concat()),e.numberprefix=c(a.ynumberprefix,e.numberprefix),e.numbersuffix=c(a.ynumbersuffix,e.numbersuffix)),/^(mscombidy2d|mscombidy3d)$/.test(ba)&&(H.formatnumberscale=D(a.sformatnumberscale)),/^(pie2d|pie3d|doughnut2d|doughnut3d|marimekko|pareto2d|pareto3d)$/.test(ba)&&(e.decimalprecision=c(a.decimals,"2")),M&&(e.numberscalevalue.push(1),e.numberscaleunit.unshift(e.defaultnumberscale),F.numberscalevalue.push(1),
F.numberscaleunit.unshift(F.defaultnumberscale)),T&&(H.numberscalevalue.push(1),H.numberscaleunit.unshift(H.defaultnumberscale),g.numberscalevalue.push(1),g.numberscaleunit.unshift(g.defaultnumberscale)),this.Y[0]={yAxisLabelConf:F,dataLabelConf:e},this.Y[1]={yAxisLabelConf:H,dataLabelConf:g},this.paramLabels=e,this.param1=F,this.param2=H,this.paramLabels2=g);this.paramX={cacheStore:[],formatnumber:c(a.xformatnumber,d.formatnumber),formatnumberscale:c(a.xformatnumberscale,d.formatnumberscale),defaultnumberscale:I(a.xdefaultnumberscale,
d.defaultnumberscale),numberscaleunit:c(l,d.numberscaleunit.concat()),numberscalevalue:c(L,d.numberscalevalue.concat()),numberprefix:c(a.xnumberprefix,d.numberprefix),numbersuffix:c(a.xnumbersuffix,d.numbersuffix),decimalprecision:parseInt(c(a.xaxisvaluedecimals,a.xaxisvaluesdecimals,d.decimalprecision,2),10),forcedecimals:c(a.forcexaxisvaluedecimals,0),decimalseparator:d.decimalseparator,thousandseparator:d.thousandseparator,thousandseparatorposition:d.thousandseparatorposition.concat(),indecimalseparator:d.indecimalseparator,
inthousandseparator:d.inthousandseparator,scalerecursively:q,maxscalerecursion:G,scaleseparator:Ca};this.paramLegend=z(z({},d),{cacheStore:[],decimalprecision:parseInt(D(a.legendvaluedecimals,d.decimalprecision,2),10),forcedecimals:D(a.legendvalueforcedecimals,d.forcedecimals,0),formatnumberscale:c(a.legendvalueformatnumberscale,d.formatnumberscale),formatnumber:c(a.legendvalueformatnumber,d.formatnumber)});b.useScaleRecursively&&(this.paramX.numberscalevalue&&this.paramX.numberscalevalue.length)==
(this.paramX.numberscaleunit&&this.paramX.numberscaleunit.length)||(this.paramX.scalerecursively=q=0);q&&(this.paramX.numberscalevalue.push(1),this.paramX.numberscaleunit.unshift(this.paramX.defaultnumberscale));this.paramScale={cacheStore:[],formatnumber:c(a.tickformatnumber,d.formatnumber),formatnumberscale:c(a.tickformatnumberscale,d.formatnumberscale),defaultnumberscale:I(a.tickdefaultnumberscale,d.defaultnumberscale),numberscaleunit:c(E,d.numberscaleunit.concat()),numberscalevalue:c(Y,d.numberscalevalue.concat()),
numberprefix:c(a.ticknumberprefix,d.numberprefix),numbersuffix:c(a.ticknumbersuffix,d.numbersuffix),decimalprecision:parseInt(c(a.tickvaluedecimals,d.decimalprecision,"2"),10),forcedecimals:c(a.forcetickvaluedecimals,d.forcedecimals,0),decimalseparator:d.decimalseparator,thousandseparator:d.thousandseparator,thousandseparatorposition:d.thousandseparatorposition.concat(),indecimalseparator:d.indecimalseparator,inthousandseparator:d.inthousandseparator,scalerecursively:M,maxscalerecursion:J,scaleseparator:ja};
M&&(this.paramScale.numberscalevalue.push(1),this.paramScale.numberscaleunit.unshift(this.paramScale.defaultnumberscale));this.timeConf={inputDateFormat:c(a.inputdateformat,a.dateformat,"mm/dd/yyyy"),outputDateFormat:c(a.outputdateformat,a.inputdateformat,a.dateformat,"mm/dd/yyyy"),days:"Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),months:"January February March April May June July August September October November December".split(" "),daySuffix:" st nd rd th th th th th th th th th th th th th th th th th st nd rd th th th th th th th st".split(" ")};
this.cleaneValueCacheStore={};this.percentStrCacheStore={}};E.prototype={cleaneValueCacheStore:{},percentStrCacheStore:{},dispose:function(){this.Y&&delete this.Y;this.cleaneValueCacheStore&&delete this.cleaneValueCacheStore;this.percentStrCacheStore&&delete this.percentStrCacheStore;this.paramLabels&&delete this.paramLabels;this.param1&&delete this.param1;this.param2&&delete this.param2;this.paramLabels2&&delete this.paramLabels2;this.csConf&&delete this.csConf;this.chartAPI&&delete this.chartAPI;
this.baseConf&&delete this.baseConf;this.timeConf&&delete this.timeConf;this.paramX&&delete this.paramX;this.paramScale&&delete this.paramScale},parseMLAxisConf:function(a,e){var d=this.baseConf,g=this.csConf,l=this.chartAPI,B=D(a.scalerecursively,d.scalerecursively),w=D(a.maxscalerecursion,d.maxscalerecursion),E=p(a.scaleseparator,d.scaleseparator),z,N,F,P,L,da;e=D(e,this.Y.length);p(a.numberscaleunit)&&(z=a.numberscaleunit.split(","));p(a.numberscalevalue)&&(N=a.numberscalevalue.split(","));w||
(w=-1);if(p(a.thousandseparatorposition))for(F=a.thousandseparatorposition.split(","),P=F.length,da=h.thousandseparatorposition[0];P--;)(L=D(b(F[P])))?da=L:L=da,F[P]=L;d={cacheStore:[],formatnumber:c(a.formatnumber,d.formatnumber),formatnumberscale:c(a.formatnumberscale,d.formatnumberscale),defaultnumberscale:I(a.defaultnumberscale,d.defaultnumberscale),numberscaleunit:c(z,d.numberscaleunit).concat(),numberscalevalue:c(N,d.numberscalevalue).concat(),numberprefix:I(a.numberprefix,d.numberprefix),numbersuffix:I(a.numbersuffix,
d.numbersuffix),forcedecimals:c(a.forcedecimals,d.forcedecimals),decimalprecision:parseInt("auto"===a.decimals?g.decimalprecision:c(a.decimals,d.decimalprecision),10),decimalseparator:c(a.decimalseparator,d.decimalseparator),thousandseparator:c(a.thousandseparator,d.thousandseparator),thousandseparatorposition:c(F,d.thousandseparatorposition),indecimalseparator:I(a.indecimalseparator,d.indecimalseparator),inthousandseparator:I(a.inthousandseparator,d.inthousandseparator),scalerecursively:B,maxscalerecursion:w,
scaleseparator:E};l.useScaleRecursively&&(d.numberscalevalue&&d.numberscalevalue.length)==(d.numberscaleunit&&d.numberscaleunit.length)||(d.scalerecursively=B=0);l={cacheStore:[],formatnumber:d.formatnumber,formatnumberscale:d.formatnumberscale,defaultnumberscale:d.defaultnumberscale,numberscaleunit:d.numberscaleunit.concat(),numberscalevalue:d.numberscalevalue.concat(),numberprefix:d.numberprefix,numbersuffix:d.numbersuffix,decimalprecision:parseInt(c(a.yaxisvaluedecimals,d.decimalprecision,2),10),
forcedecimals:c(a.forceyaxisvaluedecimals,d.forcedecimals),decimalseparator:d.decimalseparator,thousandseparator:d.thousandseparator,thousandseparatorposition:d.thousandseparatorposition.concat(),indecimalseparator:d.indecimalseparator,inthousandseparator:d.inthousandseparator,scalerecursively:B,maxscalerecursion:w,scaleseparator:E};B&&(d.numberscalevalue.push(1),d.numberscaleunit.unshift(d.defaultnumberscale),l.numberscalevalue.push(1),l.numberscaleunit.unshift(l.defaultnumberscale));this.Y[e]={dataLabelConf:d,
yAxisLabelConf:l}},percentValue:function(a){var b=this.percentStrCacheStore[a];void 0===b&&(b=isNaN(this.paramLabels.decimalprecision)?"2":this.paramLabels.decimalprecision,b=this.percentStrCacheStore[a]=e(d(a,b,this.paramLabels.forcedecimals),this.paramLabels.decimalseparator,this.paramLabels.thousandseparator,this.paramLabels.thousandseparatorposition)+"%");return b},getCleanValue:function(a,c){var d=this.cleaneValueCacheStore[a];if(void 0===d){var e=this.baseConf,d=a+"";e._REGinthousandseparator&&
(d=d.replace(e._REGinthousandseparator,""));e._REGindecimalseparator&&(d=d.replace(e._REGindecimalseparator,"."));d=parseFloat(d);d=isFinite(d)?d:NaN;this.cleaneValueCacheStore[a]=d=isNaN(d)?null:c?b(d):d}return d},dataLabels:function(a,b){var c=this.Y[b]||(b?this.Y[1]:this.Y[0]),d,c=c&&c.dataLabelConf||this.baseConf;d=c.cacheStore[a];void 0===d&&(d=c.cacheStore[a]=l(a,c));return d},yAxis:function(a,b){var c=this.Y[b]||(b?this.Y[1]:this.Y[0]),d,c=c&&c.yAxisLabelConf||this.baseConf;d=c.cacheStore[a];
void 0===d&&(d=c.cacheStore[a]=l(a,c,!0));return d},xAxis:function(a){var b=this.paramX.cacheStore[a];void 0===b&&(b=this.paramX.cacheStore[a]=l(a,this.paramX,!0));return b},sYAxis:function(a){var b=this.Y[1],c,b=b&&b.yAxisLabelConf||this.baseConf;c=b.cacheStore[a];void 0===c&&(c=b.cacheStore[a]=l(a,b));return c},scale:function(a){var b=this.paramScale.cacheStore[a];void 0===b&&(b=this.paramScale.cacheStore[a]=l(a,this.paramScale));return b},getCleanTime:function(a){var b;this.timeConf.inputDateFormat&&
Date.parseExact&&(b=Date.parseExact(a,this.timeConf.inputDateFormat));return b&&b.getTime()},legendValue:function(a){var b=this.paramLegend.cacheStore[a];void 0===b&&(b=this.paramLegend.cacheStore[a]=l(a,this.paramLegend));return b},legendPercentValue:function(a){var b=this.percentStrCacheStore[a],c=this.paramLegend;void 0===b&&(b=isNaN(c.decimalprecision)?"2":c.decimalprecision,b=this.percentStrCacheStore[a]=e(d(a,b,c.forcedecimals),c.decimalseparator,c.thousandseparator,c.thousandseparatorposition)+
"%");return b},getDateValue:function(a){var b,c,d;a&&!/\//.test(this.timeConf.inputDateFormat)&&(a=a.replace(new RegExp(this.timeConf.inputDateFormat.replace(/[a-z]/ig,"").slice(0,1),"g"),"/"));a=/^dd/.test(this.timeConf.inputDateFormat)&&a&&a.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,"$2/$1/$3")||a;b=new Date(a);c=b.getTime();!c&&a&&/\:/.test(a)&&(a=a.split(":"),c=D(a[0],0),d=D(a[1],0),a=D(a[2],0),c=23<c?24===c&&0===d&&0===a?c:23:c,d=59<d?59:d,a=59<a?59:a,b=new Date,b.setHours(c),b.setMinutes(d),
b.setSeconds(a),c=b.getTime());return{ms:c,date:b}},getFormattedDate:function(a,b){var d="object"===typeof a&&a||new Date(a),e=this.timeConf,g=c(b,e.outputDateFormat),l=d.getFullYear(),h=d.getMonth(),m=d.getDate(),p=d.getDay(),B=d.getMinutes(),w=d.getSeconds(),d=d.getHours(),B=9<B?""+B:"0"+B,w=9<w?""+w:"0"+w,d=9<d?""+d:"0"+d;g.match(/dnl/)&&(g=g.replace(/dnl/ig,e.days[p]));g.match(/dns/)&&(g=g.replace(/dns/ig,e.days[p]&&e.days[p].substr(0,3)));g.match(/dd/)&&(g=g.replace(/dd/ig,m));g.match(/mnl/)&&
(g=g.replace(/mnl/ig,e.months[h]));g.match(/mns/)&&(g=g.replace(/mns/ig,e.months[h]&&e.months[h].substr(0,3)));g.match(/mm/)&&(g=g.replace(/mm/ig,h+1));g.match(/yyyy/)&&(g=g.replace(/yyyy/ig,l));g.match(/yy/)&&(g=g.replace(/yy/ig,(l%1E3%100+"").replace(/^(\d)$/,"0$1")));g.match(/hh12/)&&(g=g.replace(/hh12/ig,d%12||12));g.match(/hh/)&&(g=g.replace(/hh/ig,d));g.match(/mn/)&&(g=g.replace(/mn/ig,B));g.match(/ss/)&&(g=g.replace(/ss/ig,w));g.match(/ampm/)&&(g=g.replace(/ampm/ig,12>d?"AM":"PM"));g.match(/ds/)&&
(g=g.replace(/ds/ig,e.daySuffix[m]));return g}};E.prototype.constructor=E;l=function(a,b,l){if(null!==a){a=Number(a);var h=a+"",m,p,B,w,E;m=1==b.formatnumberscale?b.defaultnumberscale:"";E=(E=h.split(".")[1])?E.length:b.forcedecimals?"2":"";if(1==b.formatnumberscale){h=a;p=b.numberscalevalue;a=b.numberscaleunit;m={};var z=b.defaultnumberscale;B=0;var N=[],F=[];if(b.scalerecursively){for(B=0;B<p.length;B++)if(w=D(p[B])||1E3,Math.abs(Number(h))>=w&&B<p.length-1)z=h%w,h=(h-z)/w,0!==z&&(N.push(z),F.push(a[B]));
else{N.push(h);F.push(a[B]);break}N.reverse();F.reverse();m.value=N;m.scale=F}else{if(p.length===a.length)for(B=0;B<p.length;B++)if(w=D(p[B])||1E3,Math.abs(Number(h))>=w)z=a[B]||"",h=Number(h)/w;else break;m.value=h;m.scale=z}p=m;a=h=p.value;m=p.scale}if(b.scalerecursively&&0!==b.formatnumberscale&&"0"!==b.formatnumberscale){l=p.value;p=p.scale;a=-1==b.maxscalerecursion?l.length:Math.min(l.length,b.maxscalerecursion);if(1==b.formatnumber)for(h="",w=0;w<a;w++)m=0===w?l[w]:Math.abs(l[w]),B=m+"",w==
a-1&&(B=d(m,c(b.decimalprecision,E),b.forcedecimals)),h=h+e(B,b.decimalseparator,b.thousandseparator,b.thousandseparatorposition)+p[w]+(w<a-1?b.scaleseparator:"");else for(h="",w=0;w<a;w++)h=h+(0===w?l[w]:Math.abs(l[w])+"")+p[w]+(w<a-1?b.scaleseparator:"");h=(b.numberprefix||"")+h+(b.numbersuffix||"")}else 1==b.formatnumber&&(h=d(a,c(b.decimalprecision,E),b.forcedecimals),h=e(h,b.decimalseparator,b.thousandseparator,b.thousandseparatorposition,l)),h=(b.numberprefix||"")+h+m+(b.numbersuffix||"");return h}};
return E}();d.extend(d.core,{formatNumber:function(a,b){b=b&&B(b)||{};var c=L(b),d;F[c]?d=F[c]:F[c]=d=new h.NumberFormatter(b,{useScaleRecursively:!0});return d.dataLabels(a)}},!1);d.extend(d.core,{formatNumber:function(a,b,c,m){c=c&&B(c)||{};var p=this.jsVars.instanceAPI||{},w=p.numberFormatter,n;""===L(c)?w?n=w:(w=this.getChartData(d.dataFormats.JSON,!0),w=w.data||{},w=w.chart||{},c=L(w),F[c]?n=F[c]:F[c]=n=new h.NumberFormatter(w,p)):(w=this.getChartData(d.dataFormats.JSON,!0),w=w.data||{},w=w.chart||
{},w=z(z({},w),c),c=L(w),F[c]?n=F[c]:F[c]=n=new h.NumberFormatter(w,p));switch((b&&b.toLowerCase?b:"").toLowerCase()){case "yaxisvalues":a=n.yAxis(a,m);break;case "xaxisvalues":a=n.xAxis(a);break;case "scale":a=n.scale(a);break;default:a=n.dataLabels(a,m)}return a}},!0)}]);
FusionCharts.register("module",["private","modules.renderer.js-dom",function(){var d=this.hcLib,h=this.window,D=h.document,z=d.extend2,p="ontouchstart"in h;(function(c){var d=function(){var b={},a;b.pointerdrag={start:["mousedown"],end:["mouseup"],onStart:["mousemove"],postHandlers:{},preHandlers:{}};b.pointerhover={start:["mouseover"],end:["mouseout"]};b.click={start:["click"]};b.escape={start:["keydown"],preHandlers:{start:function(a){a=a||h.event;return a.keyCode&&27===a.keyCode?!0:!1}}};p&&(a=
b.pointerdrag,a.start.push("touchstart"),a.end.push("touchend"),a.onStart.push("touchmove"),a.postHandlers.onStart=function(a){a.preventDefault?a.preventDefault():a.returnValue=!1},a=b.click,a.start.push("touchstart"));return b}(),b;b=z({},d);c.dem=new function(){var c={},a={},d=D.addEventListener?function(a,b,c){a.addEventListener(b,c,!1)}:function(a,b,c){a.attachEvent("on"+b,c)},p=D.removeEventListener?function(a,b,c){a.removeEventListener(b,c,!1)}:function(a,b,c){a.detachEvent("on"+b,c)},L=function(a,
c,d){var g=[],p,n,w;w=b[c];d.start=function(b){b=b||h.event;for(var c=w.onStart,g=w.end,l=[],p=[],n=c&&c.length||0;n--;)l.push(B(a,c[n],d,"onStart"));for(n=g&&g.length||0;n--;)p.push(B(a,g[n],d,"end"));d.startUn=d.startUn?d.startUn.concat(l):l;d.endUn=d.endUn?d.endUn.concat(p):p;d.state="start";d.closure(b)};d.onStart=function(a){a=a||h.event;d.state="on";if(d.gDef&&d.gDef.preHandlers&&"function"===typeof d.gDef.preHandlers.onStart)d.gDef.preHandlers.onStart(a);d.closure(a);if(d.gDef&&d.gDef.postHandlers&&
"function"===typeof d.gDef.postHandlers.onStart)d.gDef.postHandlers.onStart(a)};d.end=function(a){a=a||h.event;for(var b=d.startUn,c=d.endUn,e=b&&b.length||0;e--;)b[e]();delete d.startUn;d.startUn=[];for(e=c&&c.length||0;e--;)c[e]();delete d.endUn;d.endUn=[];d.state="end";d.closure(a)};if(w)for(c=w.start,n=c.length;n--;)(p=c[n])&&g.push(B(a,p,d,"start"));return g},B=function(a,b,c,g){g=g||"closure";d(a,b,c[g]);return function(){p(a,b,c[g])}},g=function(a){return function(b){b=b||h.event;a.handler.call(a.context||
a.elem,{data:a.data,type:a.type,state:a.state,isGesture:a.isGesture,target:b.target||b.srcElement,originalEvent:b})}};return{listen:function(d,l,h,p,w){var n=this;l="string"===typeof l?l.split(" "):l;var z=l.length,t=[],F=function(a,b,c){t.push(function(){n.unlisten(a,b,c)})},u,I,U,ka,xa;if(d.ownerDocument&&d.ownerDocument===D)for(;z--;)I=l[z],ka=Boolean(b[I]),xa="function"===typeof h?h:h[z],U={handler:xa,elem:d,type:I,isGesture:ka,gDef:ka?b[I]:null,data:p,context:w,start:[],end:[],links:{prev:null,
next:null}},U.closure=g(U),ka?((u=a[I])||(u=a[I]=[]),u.push(U),L(d,I,U)):((u=c[I])||(u=c[I]=[]),u.push(U),B(d,I,U)),F(d,I,xa);else for(;z--;)I=l[z],xa="function"===typeof h?h:h[z],U={handler:xa,elem:d,type:I,isGesture:ka,data:p,context:w,start:[],end:[],links:{prev:null,next:null}},U.closure=g(U),(u=c[I])||(u=c[I]=[]),u.push(U),B(d,I,U),F(d,I,xa);return{unlisten:function(){for(var a=t.length;a--;)t[a]();t.length=0;t=null}}},unlisten:function(d,g,h){var B,w=!1,n,z;if(Boolean(b[g]))for(n=(B=a[g])&&
B.length||0;n--;){if(z=B[n],z.handler===h&&z.elem===d){var w=d,t=void 0,D=void 0,u=void 0,t=void 0;if(t=b[g])for(t=t.start,u=t.length;u--;)(D=t[u])&&p(w,D,z.start);B.splice(n,1);w=!0}}else for(n=(B=c[g])&&B.length||0;n--;)z=B[n],z.handler===h&&z.elem===d&&(p(d,g,z.closure),B.splice(n,1),w=!0);return w},fire:function(a,b,d,g){var h;if(a.ownerDocument&&a.ownerDocument===D)D.createEvent?(h=D.createEvent("HTMLEvents"),h.initEvent(b,!0,!0),d&&(d.originalEvent?d.originalEvent=h:z(h,d)),"function"===typeof a[b]&&
a[b].call(a),a.dispatchEvent(h)):(h=D.createEventObject(),h.eventType=b,d&&(d.originalEvent?d.originalEvent=h:z(h,d)),"function"===typeof a[b]&&a[b].call(a),a.fireEvent("on"+b,h)),g&&!h.returnValue&&g(h);else for(g=(b=c[b])&&b.length||0;g--;)h=b[g],h.elem===a&&h.closure(d)}}}})(d||h);(function(c){function d(a,b){var c="";D.defaultView&&D.defaultView.getComputedStyle?c=D.defaultView.getComputedStyle(a,"").getPropertyValue(b):a.currentStyle&&(b=b.replace(/\-(\w)/g,function(a,b){return b.toUpperCase()}),
c=a.currentStyle[b]);c=parseInt(c,10);return isNaN(c)?0:c}function b(b,c,d,g,e,l,h,p){var z=c/40,n=a[l||"linear"](g-d,z),D=0,t=function(){var a;D<z?(a=n[D],b.style[e]=d+a+p,w&&"opacity"===e&&(a=100*Number(a),b.style.filter="progid:DXImageTransform.Microsoft.Alpha(Opacity="+a+")"),D+=1,setTimeout(t,40)):h&&h()};p=p||"";setTimeout(t,40)}var p={width:{suffix:"px"},height:{suffix:"px"},opacity:!0,top:{suffix:"px"},left:{suffix:"px"}},a={linear:function(a,b){for(var c=[],d=a/b,e=0;e<b;e+=1)c[e]=d*(e+1);
return c}},w=/msie/i.test(h.navigator.userAgent)&&!h.opera;c.danimate=z({animate:function(a,c,h,g,e){g={};var l={},m=function(){z+=1;z===w&&"function"===typeof e&&e()},w=0,z=0,n,D;if(40>h){for(D in c)a.style[D]=c[D];e&&e()}else for(D in c)p[D]&&(w+=1,g[D]=c[D],l[D]=d(a,D),n="object"===typeof p[D]&&p[D].suffix,b(a,h,l[D],g[D],D,"linear",m,n))}},{})})(d||h)}]);
FusionCharts.register("module",["private","modules.renderer.js-colormanager",function(){var d=this.hcLib,h=d.pluckNumber,D=d.graphics.getDarkColor,z=d.graphics.getLightColor,p="AFD8F8 F6BD0F 8BBA00 FF8E46 008E8E D64646 8E468E 588526 B3AA00 008ED6 9D080D A186BE CC6600 FDC689 ABA000 F26D7D FFF200 0054A6 F7941C CC3300 006600 663300 6DCFF6".split(" "),c="8BBA00 F6BD0F FF654F AFD8F8 FDB398 CDC309 B1D0D2 FAD1B9 B8A79E D7CEA5 C4B3CE E9D3BE EFE9AD CEA7A2 B2D9BA".split(" "),I=d.defaultPaletteOptions={paletteColors:[p,
p,p,p,p],bgColor:["CBCBCB,E9E9E9","CFD4BE,F3F5DD","C5DADD,EDFBFE","A86402,FDC16D","FF7CA0,FFD1DD"],bgAngle:[270,270,270,270,270],bgRatio:["0,100","0,100","0,100","0,100","0,100"],bgAlpha:["50,50","60,50","40,20","20,10","30,30"],canvasBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],canvasBgAngle:[0,0,0,0,0],canvasBgAlpha:["100","100","100","100","100"],canvasBgRatio:["","","","",""],canvasBorderColor:["545454","545454","415D6F","845001","68001B"],canvasBorderAlpha:[100,100,100,90,100],showShadow:[0,
1,1,1,1],divLineColor:["717170","7B7D6D","92CDD6","965B01","68001B"],divLineAlpha:[40,45,65,40,30],altHGridColor:["EEEEEE","D8DCC5","99C4CD","DEC49C","FEC1D0"],altHGridAlpha:[50,35,10,20,15],altVGridColor:["767575","D8DCC5","99C4CD","DEC49C","FEC1D0"],altVGridAlpha:[10,20,10,15,10],anchorBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],toolTipBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],toolTipBorderColor:["545454","545454","415D6F","845001","68001B"],baseFontColor:["555555","60634E",
"025B6A","A15E01","68001B"],borderColor:["767575","545454","415D6F","845001","68001B"],borderAlpha:[50,50,50,50,50],legendBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],legendBorderColor:["545454","545454","415D6F","845001","D55979"],plotGradientColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],plotBorderColor:["333333","8A8A8A","FFFFFF","FFFFFF","FFFFFF"],plotFillColor:["767575","D8DCC5","99C4CD","DEC49C","FEC1D0"],bgColor3D:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],bgAlpha3D:["100",
"100","100","100","100"],bgAngle3D:[90,90,90,90,90],bgRatio3D:["","","","",""],canvasBgColor3D:["DDE3D5","D8D8D7","EEDFCA","CFD2D8","FEE8E0"],canvasBaseColor3D:["ACBB99","BCBCBD","C8A06C","96A4AF","FAC7BC"],divLineColor3D:["ACBB99","A4A4A4","BE9B6B","7C8995","D49B8B"],divLineAlpha3D:[100,100,100,100,100],legendBgColor3D:["F0F3ED","F3F3F3","F7F0E8","EEF0F2","FEF8F5"],legendBorderColor3D:["C6CFB8","C8C8C8","DFC29C","CFD5DA","FAD1C7"],toolTipbgColor3D:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],toolTipBorderColor3D:["49563A",
"666666","49351D","576373","681C09"],baseFontColor3D:["49563A","4A4A4A","49351D","48505A","681C09"],anchorBgColor3D:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"]},p=d.colorManager=function(b,c){var a=b.chart,p=d.extend2({},I),F=c.defaultPaletteOptions||{},L;p||(p={});for(L in F)p[L]=F[L];p=this.paletteOptions=p;F=this.themeEnabled=a.palettethemecolor;this.paletteIndex=(0<a.palette&&6>a.palette?a.palette:h(c.paletteIndex,1))-1;this.iterator=0;this.paletteColors=p.paletteColors[this.themeEnabled?0:
this.paletteIndex];L=a.palettecolors;void 0!==L&&null!==L&&""!==a.palettecolors&&(this.paletteColors=a.palettecolors.split(/\s*\,\s*/));this.paletteLen=this.paletteColors.length;this.useFlatColors=h(a.useflatdataplotcolor,c.useFlatColor,0);F&&(this.paletteIndex=5,p.bgColor.push(z(F,35)+","+z(F,10)),p.bgAngle.push(270),p.bgRatio.push("0,100"),p.bgAlpha.push("50,50"),p.canvasBgColor.push("FFFFFF"),p.canvasBgAngle.push(0),p.canvasBgAlpha.push("100"),p.canvasBgRatio.push(""),p.canvasBorderColor.push(D(F,
80)),p.canvasBorderAlpha.push(100),p.showShadow.push(1),p.divLineColor.push(D(F,20)),p.divLineAlpha.push(40),p.altHGridColor.push(z(F,20)),p.altHGridAlpha.push(15),p.altVGridColor.push(z(F,80)),p.altVGridAlpha.push(10),p.anchorBgColor.push("FFFFFF"),p.toolTipBgColor.push("FFFFFF"),p.toolTipBorderColor.push(D(F,80)),p.baseFontColor.push(F.split&&F.split(",")[0]),p.borderColor.push(D(F,60)),p.borderAlpha.push(50),p.legendBgColor.push("FFFFFF"),p.legendBorderColor.push(D(F,80)),p.plotGradientColor.push("FFFFFF"),
p.plotBorderColor.push(D(F,85)),p.plotFillColor.push(D(F,85)),p.bgColor3D.push("FFFFFF"),p.bgAlpha3D.push("100"),p.bgAngle3D.push(90),p.bgRatio3D.push(""),p.canvasBgColor3D.push(z(F,20)),p.canvasBaseColor3D.push(z(F,40)),p.divLineColor3D.push(D(F,20)),p.divLineAlpha3D.push(40),p.legendBgColor3D.push("FFFFFF"),p.legendBorderColor3D.push(D(F,80)),p.toolTipbgColor3D.push("FFFFFF"),p.toolTipBorderColor3D.push(D(F,80)),p.baseFontColor3D.push(F.split&&F.split(",")[0]),p.anchorBgColor3D.push("FFFFFF"),p.tickColor&&
p.tickColor.push(D(F,90)),p.trendDarkColor&&p.trendDarkColor.push(D(F,90)),p.trendLightColor&&p.trendLightColor.push(z(F,p.TrendLightShadeOffset)),p.msgLogColor&&p.msgLogColor.push(z(F,80)),p.dialColor&&p.dialColor.push(D(F,95)+",FFFFFF,"+D(F,95)),p.dialBorderColor&&p.dialBorderColor.push(D(F,95)+",FFFFFF,"+D(F,95)),p.pivotColor&&p.pivotColor.push(z(F,95)+",FFFFFF,"+z(F,95)),p.pivotBorderColor&&p.pivotBorderColor.push(D(F,95)+",FFFFFF,"+D(F,95)),p.pointerBorderColor&&p.pointerBorderColor.push(D(F,
75)),p.pointerBgColor&&p.pointerBgColor.push(D(F,75)),p.thmBorderColor&&p.thmBorderColor.push(D(F,90)),p.thmFillColor&&p.thmFillColor.push(z(F,55)),p.cylFillColor&&p.cylFillColor.push(z(F,55)),p.periodColor&&p.periodColor.push(z(F,10)),p.winColor&&p.winColor.push("666666"),p.lossColor&&p.lossColor.push("CC0000"),p.drawColor&&p.drawColor.push("666666"),p.scorelessColor&&p.scorelessColor.push("FF0000"),p.gridColor&&p.gridColor.push(z(F,30)),p.categoryBgColor&&p.categoryBgColor.push(z(F,10)),p.dataTableBgColor&&
p.dataTableBgColor.push(z(F,10)),p.gridResizeBarColor&&p.gridResizeBarColor.push(D(F,90)),p.scrollBarColor&&p.scrollBarColor.push(z(F,50)))};p.prototype={getColor:function(b){return this.paletteOptions[b][this.paletteIndex]},getPlotColor:function(b){var c=this.paletteColors;b=this.useFlatColors?this.getColor("plotFillColor"):c[b%this.paletteLen];b||(this.iterator===this.paletteLen&&(this.iterator=0),b=c[this.iterator],this.iterator+=1);return b},parseColorMix:function(b,c){var a=[],d,h,p,B,g,e,l,
m,N,E;c=c.replace(/\s/g,"");c=c.toLowerCase();if(""===c||null===c||void 0===c)a=[b];else for(h=c.split(","),p=b.split(","),B=Math.max(h.length,p.length,1),g=h[0],e=p[0],N=/[\{\}]/ig,E=0;E<B;E++)l=(h[E]||g).replace(N,""),m=p[E]||e,"color"==l?a.push(m):"light"==l.substr(0,5)?(d=l.indexOf("-"),d=-1==d?1:l.substr(d+1,l.length-d),d=100-d,a.push(z(m,d))):"dark"==l.substr(0,4)?(d=l.indexOf("-"),d=-1==d?1:l.substr(d+1,l.length-d),d=100-d,a.push(D(m,d))):a.push(l);return a},parseAlphaList:function(b,c){var a=
b.split(","),d=[],p,z=100,B;for(B=0;B<c;B++)p=h(a[B]),void 0!==p&&null!==p&&(z=p),d[B]=z;return d.join()},parseRatioList:function(b,c){var a=b.split(","),d=[],h=0,p,B;for(B=0;B<c;B++)p=a[B],p=isNaN(p)||void 0===p?0:Math.abs(Number(p)),p=100<p?100:p,d[B]=p,h+=p;h=100<h?100:h;if(a.length<c)for(B=a.length;B<c;B++)d[B]=(100-h)/(c-a.length);d[-1]=0;return d.join()}};p.prototype.constructor=p;d.defaultGaugePaletteOptions={paletteColors:[c,c,c,c,c],bgColor:["CBCBCB,E9E9E9","CFD4BE,F3F5DD","C5DADD,EDFBFE",
"A86402,FDC16D","FF7CA0,FFD1DD"],bgAngle:[270,270,270,270,270],bgRatio:["0,100","0,100","0,100","0,100","0,100"],bgAlpha:["50,50","60,50","40,20","20,10","30,30"],toolTipBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],toolTipBorderColor:["545454","545454","415D6F","845001","68001B"],baseFontColor:["555555","60634E","025B6A","A15E01","68001B"],tickColor:["333333","60634E","025B6A","A15E01","68001B"],trendDarkColor:["333333","60634E","025B6A","A15E01","68001B"],trendLightColor:["f1f1f1","F3F5DD",
"EDFBFE","FFF5E8","FFD1DD"],pointerBorderColor:["545454","60634E","415D6F","845001","68001B"],pointerBgColor:["545454","60634E","415D6F","845001","68001B"],canvasBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],canvasBgAngle:[0,0,0,0,0],canvasBgAlpha:["100","100","100","100","100"],canvasBgRatio:["","","","",""],canvasBorderColor:["545454","545454","415D6F","845001","68001B"],canvasBorderAlpha:[100,100,100,90,100],altHGridColor:["EEEEEE","D8DCC5","99C4CD","DEC49C","FEC1D0"],altHGridAlpha:[50,
35,10,20,15],altVGridColor:["767575","D8DCC5","99C4CD","DEC49C","FEC1D0"],altVGridAlpha:[10,20,10,15,10],borderColor:["767575","545454","415D6F","845001","68001B"],borderAlpha:[50,50,50,50,50],legendBgColor:["ffffff","ffffff","ffffff","ffffff","ffffff"],legendBorderColor:["545454","545454","415D6F","845001","D55979"],plotFillColor:["767575","D8DCC5","99C4CD","DEC49C","FEC1D0"],plotBorderColor:["999999","8A8A8A","6BA9B6","C1934D","FC819F"],msgLogColor:["717170","7B7D6D","92CDD6","965B01","68001B"],
TrendLightShadeOffset:30}}]);
FusionCharts.register("module",["private","modules.renderer.js-annotations",function(){var d=this,h=d.core,D=d.hcLib,z=d.window,p=/msie/i.test(z.navigator.userAgent)&&!z.opera,c=D.addEvent,I=D.removeEvent,b=D.hasTouch,P=z.Number,a=b?6:5,w="rgba(192,192,192,"+(p?.002:1E-6)+")",p=z.Math,F=p.min,L=p.max,B=p.sin,g=p.cos,e=p.PI,l=e/180,m=d.extend,N=D.pluck,E=D.pluckNumber,n=D.graphics.convertColor,V=D.getValidValue,t=D.parseUnsafeString,X=D.setImageDisplayMode,u=D.graphics.parseColor,ga=D.setLineHeight,
U=D.getMouseCoordinate,ka={style:{}},xa=D.toRaphaelColor,ea=function(a,b){return{start:-b,end:-a,angle:a-b}},Y=function(a,b,c,d,e){var g,l,h=0,p=0;l=void 0===b||null===b?1:b;var m;if(!a||!a.toString)return{value:c,hasDynamicMacros:!1};a=a.toString();a=a.toLowerCase().replace(/\s/g,"");if(c=a.match(/^[\+\-]?\d+(\.\d+)?|[\+\-]\d+(\.\d+)?/g)){for(b=0;b<c.length;b+=1)h+=Number(c[b])||0;h*=l}if(c=a.match(/^[\+\-]?(\$[a-z0-9\.]+)|[\+\-](\$[a-z0-9\.]+)/g))for(b=0;b<c.length;b+=1){g=c[b];var n=d,B=e,u=g.split("."),
t=void 0,z=void 0,w=0;for(l=void 0;t=u.shift();)switch(typeof(z=n[t])){case "object":n=z[t];break;case "function":z=z(u,B),"-"===g.charAt()&&(z*=-1),l=!0;default:w+=P(z)||0,u.length=0}g=w;l&&(m=!0);p+=g}if(c=a.match(/^[\+\-]?\$\d+(\.\d+)?|[\+\-]\$\d+(\.\d+)?/g))for(b=0;b<c.length;b+=1)p=p+Number(c[b].replace("$",""))||0;return{value:h+p,hasDynamicMacros:m}},ua=function(a,b,c){if(!b.removed){b=b.data("annotation");var e=b.getRenderer(),g=U(e.container,c),l=g.annotationOptions=b.options,h=g.groupOptions=
b.group.options;g._shape=b;"id"in l&&(g.annotationId=l.id);"id"in h&&(g.groupId=h.id);d.raiseEvent(a,g,e.fusionCharts,c)}},ba,da,oa;da=function(a,b,c,d,e){this.options=a;this.attrs={};this.css={};this.bounds={};this.shared=b;this.snaps=c||{};this.annotations=e;this.items=b=[];this._idstore=d;a.id&&(this._id=a.id,d[a.id]=this);if(a=a.items)for(d=0,c=a.length;d<c;d+=1)b.push(new oa(a[d],this))};m(da.prototype,{scaleImageX:1,scaleImageY:1,scaleText:1,scaleValue:1,scaleValueComplement:1,scaleX:1,scaleY:1});
da.prototype.setup=function(){var a=this.options,b=this.shared,c=this.getRenderer();c&&(this.isBelow=0!==E(a.showbelow,a.showbelowchart,b.showbelow),this.useTracker=!this.isBelow&&c.layers.tracker&&this.shared.useTracker,this.raiseOwnEvents=b.interactionevents)};da.prototype.scale=function(){var a=this.options,b=this.shared,c=this.bounds,d=this.snaps,e=this.getRenderer(),g=b.rootxscale,l=b.rootyscale,h=c.xs=E(a.xscale,b.xscale,100)/100,p=c.ys=E(a.yscale,b.yscale,100)/100,m,n,B;e&&(this.scaleText*=
p,this.scaleImageX*=h,this.scaleImageY*=p,0!==E(a.autoscale,b.autoscale)&&(h=E(a.origw,b.origw),p=E(a.origh,b.origh),h=e.chartWidth/h,p=e.chartHeight/p,e=0!==E(a.constrainedscale,b.constrainedscale),m=h<p?h:p,n=e?m:h,B=e?m:p,this.scaleValue=da.prototype.scaleValue*m,this.scaleValueComplement=da.prototype.scaleValueComplement*(e?m:h<p?p:h),this.scaleX=da.prototype.scaleX*n,this.scaleY=da.prototype.scaleX*B,c.xs*=n,c.ys*=B,g*=n,l*=B,"1"==N(a.scaletext,b.scaletext)&&(this.scaleText=da.prototype.scaleText*
B),"1"==N(a.scaleimages,b.scaleimages)&&(this.scaleImageX=da.prototype.scaleImageX*n,this.scaleImageY=da.prototype.scaleImageY*B)),c.x=Y(N(a.x,a.xpos),g,0,d,this.isBelow).value+E(a.grpxshift,b.grpxshift,0),c.y=Y(N(a.y,a.ypos),l,0,d,this.isBelow).value+E(a.grpyshift,b.grpyshift,0),this.xshift=E(a.xshift,b.xshift,0),this.yshift=E(a.yshift,b.yshift,0))};da.prototype.draw=function(){var a=this.getRenderer(),b=this.options,c=this.bounds,d=this.items,e=a&&a.layers.dataset,g=this.wrapper;if(a){g||(this.wrapper=
g=a.paper.group("annotations"),e&&(this.isBelow?g.insertBefore(e):g.insertAfter(a.layers.datalabels||e)));this.wrapper.attr({x:0,y:0,visibility:E(b.visible,1)?"":"hidden"}).translate(c.x,c.y);b=0;for(c=d.length;b<c;b+=1)a=d[b],a.scale(!0),a.queueDraw?a.queue():(a.setup(),a.draw());return this}};da.prototype.destroy=function(){for(var a=this.wrapper,b=this.items,c;c=b.shift();)c.destroy();a&&(this.wrapper=a.remove());this._idstore[this._id]===this&&delete this._idstore[this._id]};da.prototype.addItem=
function(a,b){var c;this.items.push(c=new oa(a,this,this._idstore));b&&null!==this.getRenderer()&&(c.scale(),c.setup(),c.draw());return c};da.prototype.removeItem=function(a){for(var b=this.items,c=b.length;c--;)if(a===b[c]._id)return b.splice(c,1)};da.prototype.getRenderer=function(){return this.annotations&&this.annotations.getRenderer()||null};oa=function(a,b){var c=!1,d;this.options=a;this.group=b;this.args=[];this.attrs={};this.attrsTracker={};this.style={};this.bounds={};this._idstore=b._idstore;
a.id&&(this._id=a.id,b._idstore[a.id]=this);this.type=a.type&&a.type.toLowerCase&&a.type.toLowerCase();for(d in oa.eventNames)"function"===typeof a[d]&&(this[d]=a[d],c=!0);this.hasEvents=c;"function"===typeof a.onload&&(this.onload=a.onload)};d.extend(oa.prototype,{getAbsoluteBounds:function(){var a=this.bounds,b=a.x1,c=a.y1,d=a.x2,e=a.y2,g=F(b,d),h=F(c,e),b=L(b,d)-g,c=L(c,e)-h;return{x:g,width:b,y:h,height:c,r:a.r,unscaled:{width:b/a.xs,height:c/a.ys}}},queue:function(){this.group.annotations.shapesToDraw.push(this)},
scale:function(a){var b=this,c=b.group,d=c.bounds,e=b.bounds,g=b.options,h=c.snaps,l=N(g.x,g.xpos),p=N(g.y,g.ypos),m=N(g.tox,g.toxpos),n=N(g.toy,g.toypos),B=e.xs=d.xs,d=e.ys=d.ys,u=E(g.xshift,c.xshift,0),t=E(g.yshift,c.yshift,0),z;z=function(d,e,g,h){d=Y(d,e,g,h,c.isBelow);d.hasDynamicMacros&&a&&(b.queueDraw=!0);return d.value};b.hasDimension=!0;b.hasDimensionX=!0;b.hasDimensionY=!0;e.x1=z(l,B,0,h)+u;void 0===m?(b.hasDimension=!1,b.hasDimensionX=!1,e.x2=e.x1):e.x2=z(m,B,0,h)+u;e.y1=z(p,d,0,h)+t;void 0===
n?(b.hasDimension=!1,b.hasDimensionY=!1,e.y2=e.y1):e.y2=z(n,d,0,h)+t;oa.angularShapeTypes[b.type]&&(e.angles=ea(z(g.startangle,1,0,h),z(g.endangle,1,360,h)));e.r=z(g.radius,c.scaleValue,0,h)},setup:function(){var a=this.options,b=this.group,c=b.options,d=this.attrs,e=this.style,g=b.scaleValue,h=E(c.fillalpha,c.alpha,100),l=this.fillAlpha=N(a.fillalpha,a.alpha,h),p=this.fillColor=N(a.fillcolor,a.color,c.color),B=this.fillPattern=N(a.fillpattern&&a.fillpattern.toLowerCase&&a.fillpattern.toLowerCase(),
c.fillpattern&&c.fillpattern.toLowerCase&&c.fillpattern.toLowerCase()),u=this.bordered=E(a.showborder,oa.borderedShapeTypes[this.type],!!V(a.bordercolor)),z=this.borderColor=N(a.bordercolor,c.bordercolor,p),h=this.borderAlpha=E(a.borderalpha,a.alpha,c.borderalpha,h),D=this.dashed=!!E(a.dashed,0),F=E(a.borderthickness,a.thickness,2)*g;this.link=N(a.link,c.link);this.shadow="1"==N(a.showshadow,c.showshadow);void 0===p&&(p=oa.borderedShapeTypes[this.type]&&"none"||"#ff0000",void 0===z&&(z="#ff0000"));
u&&F?(d.stroke=n(z,h),d["stroke-linecap"]="round",d["stroke-width"]=F,D&&(d["stroke-dasharray"]=[E(a.dashlen,5)*g,E(a.dashgap,3)*g])):d.stroke="none";this.fillOptions={gradientUnits:"objectBoundingBox",color:p,alpha:l,ratio:N(a.fillratio,c.fillratio),angle:360-E(a.fillangle,0),radialGradient:"radial"===B};this.link&&(e.cursor="pointer",e._cursor="hand");d.visibility=E(a.visible,1)?"":"hidden";this.useTracker=b.useTracker;this.toolText=t(N(a.tooltext,c.tooltext));if(this.useTracker||this.link||this.toolText)m(this.attrsTracker,
{stroke:w,fill:w}),this.link&&(this.attrsTracker.ishot=+new Date);this.raiseOwnEvents=b.raiseOwnEvents},draw:function(){var a=this.getRenderer(),b=this.type,d=this.attrs,e=this.style,g=a&&a.paper,h=oa.types[b]&&oa.types[b].call&&oa.types[b].call(this,a),l=oa.imageShapeTypes[h],p=oa.textShapeTypes[h],m=l||p||oa.trackerShapeTypes[h],n=this.link||this.toolText,B=this.wrapper,b=this.tracker,u=a&&a.layers.tracker||this.group.wrapper,t=!1,z=b||B,w=oa.eventNames,E=oa.ownEvents,D,F;if(a){if(h){if(B)if(B.elemType!==
h){if(this.ownEventsAttached){for(F in E)z["un"+F].apply(B,E[F]);this.ownEventsAttached=!1}B=B.remove()}else if(this.hasEvents)for(D in w)(F=this[D])&&F.eventAttached&&(I(z.node,w[D],F),F.eventAttached=!1);l||(d.fill=xa(this.fillOptions));B?B.attr(d).css(e):(this.args.push(this.group.wrapper),B=this.wrapper=g[h].apply(g,this.args).attr(d).css(e),B.elemType=h,B.data("annotation",this),t=!0,this.args.pop());!this.shadow||this.shadowAdded||l||p?B.shadow(this.shadowAdded=!1):B.shadow(this.shadowAdded=
!0,L(this.borderAlpha,this.fillOptions.alpha)/100);n?this.useTracker&&(b||(this.args.push(u),b=this.tracker=m?g.rect(0,0,0,0,0,u):g[h].apply(g,this.args),this.args.pop()),b.attr(d).attr(this.attrsTracker)):b&&(b=b.remove());z=b||B;if(this.raiseOwnEvents&&!this.ownEventsAttached){for(F in E)z[F].apply(B,E[F]);this.ownEventsAttached=!0}this.link&&z.click(a.linkClickFN,this);this.toolText&&(z.tooltip(this.toolText||""),this.group.wrapper.trackTooltip(!0));if(this.hasEvents)for(D in w)(F=this[D])&&!F.eventAttached&&
(c(z.node,w[D],F,this),F.eventAttached=!0);l||(b&&m&&(a=B.getBBox(),b.attr({x:a.x,y:a.y,width:a.width,height:a.height})),t&&this.onload&&this.onload(d))}return this}},destroy:function(){var a=this.wrapper,b=this.tracker,c=b||a,d=oa.eventNames,e=oa.ownEvents,g,h;if(a){if(this.ownEventsAttached){for(h in e)c["un"+h].apply(a,e[h]);this.ownEventsAttached=!1}if(this.hasEvents)for(g in d)(h=this[g])&&h.eventAttached&&(I(c.node,d[g],h),h.eventAttached=!1);b&&(this.tracker=b.remove());this.wrapper=a.remove()}this._idstore[this._id]===
this&&delete this._idstore[this._id]},getRenderer:function(){return this.group&&this.group.getRenderer()||null}});d.extend(oa,{imageShapeTypes:{image:!0},angularShapeTypes:{circle:!0,arc:!0},textShapeTypes:{text:!0},trackerShapeTypes:{image:!0,text:!0},borderedShapeTypes:{path:!0,line:!0},eventNames:{onmouseover:b?"touchstart":"mouseover",onmouseout:"mouseout",onmousemove:b?"touchmove":"mousemove",onclick:"click"},ownEvents:{click:[function(a){ua("annotationClick",this,a)}],hover:[function(a){ua("annotationRollOver",
this,a)},function(a){ua("annotationRollOut",this,a)}]},textAlignOptions:{left:"start",right:"end",center:"middle"},textVerticalAlignOptions:{top:"bottom",middle:"middle",bottom:"top"},textRotationOptions:{0:"0",1:"270",right:"90",cw:"90",left:"270",ccw:"270"},types:{rectangle:function(){var a=this.args,b=this.attrs,c=this.getAbsoluteBounds(),d=.5*c.width;c.r>d&&(c.r=d);a[0]=b.x=c.x;a[1]=b.y=c.y;a[2]=b.width=c.width;a[3]=b.height=c.height;a[4]=b.r=c.r;return"rect"},line:function(){var b=this.attrs,
c=this.bounds;this.args[0]=b.path=["M",c.x1,c.y1,"L",c.x2,c.y2];1===b["stroke-width"]&&(b["shape-rendering"]="crisp");b["stroke-width"]<a&&(this.attrsTracker["stroke-width"]=a);this.bordered&&this.dashed&&(this.attrsTracker["stroke-dasharray"]="solid");return"path"},path:function(){var a=this.attrs,b=this.bounds;this.args[0]=a.path=this.options.path;a.transform=["T",b.x1,b.y1,"S",b.xs,b.ys,b.x1,b.y1];1===a["stroke-width"]&&(a["shape-rendering"]="crisp");return"path"},polygon:function(){var a=this.args,
b=this.attrs,c=this.options,d=this.bounds,e=this.group,g=e.snaps;a[0]=Y(c.sides,1,5,g,e.isBelow).value;a[1]=d.x1;a[2]=d.y1;a[3]=d.r;a[4]=Y(c.startangle,1,0,g,e.isBelow).value;a[5]=0;b.polypath=a.slice(0);return"polypath"},circle:function(a){var b=this.args,c=this.attrs,d=this.options,h=this.bounds,p=a.chartWidth,m=a.chartHeight,n=this.group.scaleValueComplement,u=this.group.snaps,t=h.angles,z=this.group;a=h.r;N(d.radius)||(h.r=p<m?p*h.xs:m*h.ys,h.r=a=.3*h.r);d=Y(d.yradius,n,a,u,z.isBelow).value;this.fillPattern||
(this.fillOptions.radialGradient=!0,this.fillPattern="radial");"radial"===this.fillPattern&&(this.fillOptions.cx=this.fillOptions.cy=.5);p=t.angle%360;if(!p&&a===d)return b[0]=c.cx=h.x1,b[1]=c.cy=h.y1,b[2]=c.r=h.r,"circle";p||(t.start-=.001);m=t.start*l;p=t.end*l;t=t.angle*l;n=h.x1;u=h.y1;h=n+g(m)*a;m=u+B(m)*d;n+=g(p)*a;p=u+B(p)*d;b[0]=c.path=["M",h,m,"A",a,d,0,0,t>=e?0:1,n,p,"Z"];return"path"},arc:function(a){var b=this.options,c=this.args,d=this.attrs,e=this.bounds,g=a.chartWidth;a=a.chartHeight;
var h=this.group,p=h.scaleValue,m=e.angles;N(b.radius)||(e.r=g<a?g*e.xs:a*e.ys,e.r*=.3);e.innerR=Y(b.innerradius,p,.8*e.r,this.group.snaps,h.isBelow).value;e.innerR>e.r&&(e.innerR+=e.r,e.r=e.innerR-e.r,e.innerR-=e.r);this.fillPattern||(this.fillOptions.radialGradient=!0,this.fillPattern="radial");"radial"===this.fillPattern&&(this.fillOptions.cx=this.fillOptions.cy=.5);c[0]=e.x1;c[1]=e.y1;c[2]=e.r;c[3]=e.innerR;c[4]=m.start*l;c[5]=m.end*l;d.ringpath=c.slice(0);return"ringpath"},text:function(a){var b=
this.args,c=this.style,d=this.attrs,e=this.group,g=this.bounds,h=this.options,l=this.getAbsoluteBounds(),p=N(h.align,e.options.textalign,"center").toLowerCase(),n=N(h.valign,e.options.textvalign,"middle").toLowerCase(),B=t(N(h.text,h.label)),z=a.logic.smartLabel,w=E(h.wrap,e.options.wraptext,1),D,F,I=N(h.rotatetext,e.options.rotatetext,"0").toLowerCase(),I=oa.textRotationOptions[I],L="0"!==I?"y":"x",P=a.options.orphanStyles;a=m({},P.defaultStyle.style||{});P=e.id&&P[e.id.toLowerCase()]||ka;a=m(a,
P.style);var P=parseFloat(a.fontSize),V=N(h.font,e.options.font,a.fontFamily),e=E(h.fontsize,e.options.fontsize,P)*e.scaleText;w&&(D=E(h.wrapwidth,this.hasDimensionX?l.width/g.xs:void 0),F=E(h.wrapheight,this.hasDimensionY?l.height/g.ys:void 0),D&&(D*=g.xs),F&&(F*=g.ys));c.fontFamily=V;c.fontWeight=E(h.bold,h.isbold,0)?"bold":"normal";E(h.italic,h.isitalic,0)&&(c.fontStyle="italic");h.bgcolor&&(!d["text-bound"]&&(d["text-bound"]=[]),d["text-bound"][0]=u(h.bgcolor));h.bordercolor&&(!d["text-bound"]&&
(d["text-bound"]=[]),d["text-bound"][1]=u(h.bordercolor),d["text-bound"][2]=E(h.borderthickness,1),d["text-bound"][3]=E(h.padding,1));h.fontcolor&&(d.fill=u(h.fontcolor),this.fillOptions&&(this.fillOptions.color=d.fill));c.fontSize=e+"px";e===P?c.lineHeight=a.lineHeight:ga(c);d["text-anchor"]=oa.textAlignOptions[p]||oa.textAlignOptions.center;z.setStyle(c);c=z.getSmartText(B,D,F,!1);d["vertical-align"]=oa.textVerticalAlignOptions[n]||oa.textVerticalAlignOptions.middle;d["text-anchor"]===oa.textAlignOptions.left?
l[L]+=E(h.leftmargin,0):d["text-anchor"]===oa.textAlignOptions.center&&(l[L]+=.5*E(h.leftmargin,0));"0"!==I&&(d.rotation=[parseFloat(I),l.x,l.y]);b[0]=d.x=l.x;b[1]=d.y=l.y;b[2]=d.text=c.text;c.tooltext&&(d.title=c.tooltext);delete d.stroke;delete d["stroke-weight"];return"text"},image:function(a){var b=this,c=b.style,d=a.chartWidth,e=a.chartHeight;a=b.options;var g=b.attrs,h=b.args,l=V(a.url),p=b.group.scaleImageX*N(Number(a.xscale),100)/100,n=b.group.scaleImageY*N(Number(a.yscale),100)/100,B=b.getAbsoluteBounds(),
u={width:1,height:1},t;if(!l)return h[0]=g.x=B.x,h[1]=g.y=B.y,h[2]=g.width=B.width,h[3]=g.height=B.height,h[4]=g.r=B.r,"rect";t=new z.Image;t.onload=function(){u=X("none","top","left",100,0,d,e,t);delete u.x;delete u.y;u=m(u,{width:(b.hasDimensionX?B.unscaled.width:u.width)*p,height:(b.hasDimensionY?B.unscaled.height:u.height)*n});setTimeout(function(){var a,d,e;if(a=b.wrapper){a.attr(u);if(d=b.tracker)e=a.getBBox(),d.attr({x:e.x,y:e.y,width:e.width,height:e.height});a.css({opacity:c.opacity=L(E(b.fillAlpha,
b.borderAlpha),b.borderAlpha)/100})}b.onload&&b.onload(u)},0)};t.src=l;h[0]=g.src=l;h[1]=g.x=B.x;h[2]=g.y=B.y;h[3]=g.width=(b.hasDimensionX?B.unscaled.width:u.width)*p;h[4]=g.height=(b.hasDimensionY?B.unscaled.height:u.height)*n;c.opacity=L(E(b.fillAlpha,b.borderAlpha),b.borderAlpha)/100;delete g.stroke;delete g.fill;delete g["stroke-linecap"];return"image"}}});ba=function(){this.groups=[];this._idstore={};this._options={}};D.Annotations=ba;d.extend(ba.prototype,{reset:function(a,b,c){var d=this.groups,
e;this.clear();if(c){e={};for(var g in c)switch(typeof c[g]){case "object":case "function":e["-$"+g]=e["$"+g]=e["+$"+g]=c[g];break;default:e["$"+g]=e["+$"+g]=c[g],e["-$"+g]=-1*c[g]}e=this._literals=e}b&&(this._options=b);if(a&&a.groups&&d)for(c=0;c<a.groups.length;c+=1)d.push(new da(a.groups[c],b,e,this._idstore,this))},getRenderer:function(){return this._renderer},addGroup:function(a){var b=this.getRenderer();this.groups.push(a=new da(a,this._options,this._literals,this._idstore,this));b&&(a.setup(),
a.scale(),a.draw());return a},addItem:function(a,b,c){var e,g=this.getRenderer();"string"===typeof a?e=this._idstore[a]:(c=b,b=a);if(e&&e.addItem){if(!g&&c){d.raiseWarning(this,"04031411430","run","Annotations~addItem()","Cannot draw the shapeif the group has not been drawn. Use Annotations~draw() to draw the group and pass the renderer to it.");return}a=e.addItem(b,c)}else a=this.addGroup({}).addItem(b,c);return a},draw:function(a){var b=this.groups,c,d;if(b&&(this._renderer=a||this._renderer))for(c=
0,d=b.length;c<d;c++)a=b[c],a.setup(),a.scale(),a.draw()},clear:function(){var a=this.groups,b;if(a){for(;b=a.shift();)b.destroy();this.shapesToDraw=[]}},dispose:function(){var a;this.disposing=!0;this.clear();for(a in this)delete this[a];this.disposed=!0},hide:function(a){if(a=this._idstore[a])return a.attrs.visibility="hidden",a.wrapper&&a.wrapper.hide(),a},show:function(a){if(a=this._idstore[a])return a.attrs.visibility="",a.wrapper&&a.wrapper.show(),a},update:function(a,b,c){a=this._idstore[a];
var d;if(a&&b){if("object"===typeof b)for(d in b.id&&delete b.id,b.type&&delete b.type,b)a.options[(d+"").toLowerCase()]=b[d]+"";else a.options[(b+"").toLowerCase()]=c+"";a.wrapper&&(a.scale(),a.setup(),a.draw());return a}},destroy:function(a){var b=this._idstore[a],c=b.group;b&&"function"===typeof b.destroy&&(c&&c.removeItem(a),b.destroy())},shapesToDraw:[]});d.core.addEventListener("beforeinitialize",function(a){"javascript"===a.sender.options.renderer&&(a.sender.annotations=new ba)});d.core.addEventListener("disposed",
function(a){a.sender.annotations&&a.sender.annotations.dispose()});d.addEventListener("internal.animationComplete",function(a){var b=(a=a.sender.annotations)&&a.shapesToDraw,c=b&&b.length,d,e;if(c){for(e=0;e<c;e++)d=b[e],d.queueDraw=!1,d.scale(),d.setup(),d.draw();a.shapesToDraw=[]}});h.addEventListener("rendered",function(a,b){if("javascript"===b.renderer){var c=a.sender,d=c.jsVars||{},e=d.instanceAPI;d.hcObj&&e&&e.drawAnnotations?(c.showAnnotation||(c.showAnnotation=function(){c.annotations.show.apply(c.annotations,
arguments)}),c.hideAnnotation||(c.hideAnnotation=function(){c.annotations.hide.apply(c.annotations,arguments)})):(delete c.showAnnotation,delete c.hideAnnotation)}})}]);
FusionCharts.register("module",["private","modules.renderer.js-base",function(){var d=this,h=d.hcLib,D=d.window,z=D.document,p=h.BLANKSTRING,c=h.createTrendLine,I="https:"===D.location.protocol?"https://export.api3.fusioncharts.com/":"http://export.api3.fusioncharts.com/",b=h.pluck,P=h.getValidValue,a=h.pluckNumber,w=h.getFirstValue,F=h.getDefinedColor,L=h.parseUnsafeString,B=h.FC_CONFIG_STRING,g=h.extend2,e=h.getDashStyle,l=h.parseTooltext,m=h.toPrecision,N=h.regex.dropHash,E=h.HASHSTRING,n=h.getSentenceCase,
V=h.addEvent,t=D.Math,X=h.TOUCH_THRESHOLD_PIXELS,u=h.CLICK_THRESHOLD_PIXELS,ga=t.min,U=t.max,ka=t.abs,xa=t.ceil,ea=t.floor,Y=t.log,ua=t.pow,ba=t.sqrt,da=t.round,oa=h.graphics.getColumnColor,H=h.getFirstColor,M=h.setLineHeight,T=h.pluckFontSize,q=h.getFirstAlpha,J=h.graphics.getDarkColor,W=h.graphics.getLightColor,G=h.graphics.convertColor,ja=h.COLOR_TRANSPARENT,La=h.POSITION_CENTER,Ca=h.POSITION_TOP,na=h.POSITION_BOTTOM,pa=h.POSITION_RIGHT,za=h.POSITION_LEFT,aa=h.parsexAxisStyles,Z=h.chartAPI,Ma=
h.graphics.mapSymbolName,Ha=Z.singleseries,hb=Z.multiseries,Fa=h.COMMASTRING,Za=h.STRINGUNDEFINED,Da=h.ZEROSTRING,$a=h.ONESTRING,Na=h.HUNDREDSTRING,Ba=h.PXSTRING,Cb=h.COMMASPACE,Jb=D.navigator.userAgent.match(/(iPad|iPhone|iPod)/g),Qb={left:"start",right:"end",center:"middle"},ub=h.BLANKSTRINGPLACEHOLDER,Wa=h.BGRATIOSTRING,mb=h.COLOR_WHITE,Ua=h.TESTSTR,k=h.graphics.getAngle,A=h.axisLabelAdder,s=h.falseFN,O=h.NumberFormatter,ca=h.getLinkAction,Q=h.getAxisLimits,ia=h.createDialog,qa=function(a,b){return 0<
a?Y(a)/Y(b||10):null},va=h.hasTouch=void 0!==z.documentElement.ontouchstart,S=h.fireEvent=function(a,b,c,d){h.dem.fire(a,b,c,d)},Ja={1:"bold",0:"normal"},ma={1:"italic",0:"normal"},Qa={1:"underline",0:"none"},Ha={font:function(a,b){b.style.fontFamily=a},size:function(a,b){a&&(b.style.fontSize=T(a)+Ba)},color:function(a,b,c){b.style.color=a&&a.replace&&a.replace(N,E)||p;c&&(b.color=b.style.color)},bgcolor:function(a,b){b.style.backgroundColor=a&&a.replace&&a.replace(N,E)||p},bordercolor:function(a,
b){b.style.border="1px solid";b.style.borderColor=a&&a.replace&&a.replace(N,E)||p},ishtml:p,leftmargin:function(b,c){c.style.marginLeft=a(b,0)+Ba},letterspacing:function(b,c){c.style.letterSpacing=a(b,0)+Ba},bold:function(a,b){b.style.fontWeight=Ja[a]||""},italic:function(a,b){b.style.fontStyle=ma[a]||""},underline:function(a,b){b.style.textDecoration=Qa[a]||""}},ya=h.chartPaletteStr={chart2D:{bgColor:"bgColor",bgAlpha:"bgAlpha",bgAngle:"bgAngle",bgRatio:"bgRatio",canvasBgColor:"canvasBgColor",canvasBaseColor:"canvasBaseColor",
divLineColor:"divLineColor",legendBgColor:"legendBgColor",legendBorderColor:"legendBorderColor",toolTipbgColor:"toolTipbgColor",toolTipBorderColor:"toolTipBorderColor",baseFontColor:"baseFontColor",anchorBgColor:"anchorBgColor"},chart3D:{bgColor:"bgColor3D",bgAlpha:"bgAlpha3D",bgAngle:"bgAngle3D",bgRatio:"bgRatio3D",canvasBgColor:"canvasBgColor3D",canvasBaseColor:"canvasBaseColor3D",divLineColor:"divLineColor3D",divLineAlpha:"divLineAlpha3D",legendBgColor:"legendBgColor3D",legendBorderColor:"legendBorderColor3D",
toolTipbgColor:"toolTipbgColor3D",toolTipBorderColor:"toolTipBorderColor3D",baseFontColor:"baseFontColor3D",anchorBgColor:"anchorBgColor3D"}},Bb=function(){var a={},b,c=function(){var e,f,k,g,h=0,l,s,p=parseInt(d.core.options.resizeTrackingInterval,10)||300,A;for(e in a)h+=1,f=a[e],k=f.jsVars,l=f.ref,!f.disposed&&(g=l&&l.parentNode)&&(s=l.style)&&(/\%/g.test(s.width)||/\%/g.test(s.height))?(l=g.offsetWidth,A=g.offsetHeight,!k.resizeLocked&&(l&&k._containerOffsetW!==l||A&&k._containerOffsetH!==A)&&
(f.resizeTo&&f.resizeTo(),k._containerOffsetW=l,k._containerOffsetH=A)):(delete a[e],h-=1);b=h?setTimeout(c,p):clearTimeout(b)};return function(e,f){var k=e.jsVars,g=f||e.ref&&e.ref.parentNode||{};k._containerOffsetW=g.parentNode.offsetWidth;k._containerOffsetH=g.parentNode.offsetHeight;a[e.id]=e;b||(b=setTimeout(c,parseInt(d.core.options.resizeTrackingInterval,10)||300))}}(),ra={getExternalInterfaceMethods:function(){var a=Z[this.jsVars.type],a=a&&a.eiMethods,b="saveAsImage,print,exportChart,getXML,hasRendered,signature,cancelExport,getSVGString,lockResize,showChartMessage,",
c;if("string"===typeof a)b+=a+Fa;else if(void 0!==a||null!==a)for(c in a)b+=c+Fa;return b.substr(0,b.length-1)},drawOverlayButton:function(a){var b=this.jsVars,c=b.overlayButton,e,f;if(a&&a.show){c||(c=b.overlayButton=z.createElement("span"),h.dem.listen(c,"click",function(){d.raiseEvent("OverlayButtonClick",a,b.fcObj)}));for(e=a.message?a.message:"Back";c.firstChild;)c.removeChild(c.firstChild);c.appendChild(z.createTextNode(e));b.overlayButtonMessage=e;e={border:"1px solid "+(a.borderColor?a.borderColor.replace(N,
E):"#7f8975"),backgroundColor:a.bgColor?a.bgColor.replace(N,E):"#edefec",fontFamily:a.font?a.font:"Verdana,sans",color:"#"+a.fontColor?a.fontColor:"49563a",fontSize:(a.fontSize?a.fontSize:"10")+Ba,padding:(a.padding?a.padding:"3")+Ba,fontWeight:0===parseInt(a.bold,10)?"normal":"bold",position:"absolute",top:"0",right:"0",_cursor:"hand",cursor:"pointer"};for(f in e)c.style[f]=e[f];b.hcObj.container.appendChild(c);b.overlayButtonActive=!0}else c&&(b.overlayButton=c.parentNode.removeChild(c),b.overlayButtonActive=
!1,delete b.overlayButtonMessage)},print:function(a){return this.jsVars.hcObj&&this.jsVars.hcObj.hasRendered&&this.jsVars.hcObj.print(a)},exportChart:function(a){var b=this.jsVars.hcObj;return b&&b.options&&b.options.exporting&&b.options.exporting.enabled?b.exportChart(a):!1},getSVGString:function(){return this.jsVars&&this.jsVars.hcObj&&this.jsVars.hcObj.paper&&this.jsVars.hcObj.paper.toSVG()},resize:function(){var a=this.jsVars,b=a.container,c=a.hcObj;c&&(c&&c.destroy&&c.destroy(),h.createChart(a.fcObj,
b,a.type,void 0,void 0,!1,!0),delete a.isResizing)},lockResize:function(a){return"boolean"!==typeof a?!!this.jsVars.resizeLocked:this.jsVars.resizeLocked=a},showChartMessage:function(a,b,c){var d=this.jsVars,f=d.hcObj,e=d.fcObj,k=e.options;d.msgStore[a]&&(a=d.msgStore[a]);b&&f&&f.hasRendered?a?f.showMessage(a,c):f.hideLoading():(f&&f.destroy&&f.destroy(),e._chartMessageStyle={color:k.baseChartMessageColor,fontFamily:k.baseChartMessageFont,fontSize:k.baseChartMessageFontSize},h.createChart(d.fcObj,
d.container,d.type,void 0,a));return a},signature:function(){return"FusionCharts/3.4.0 (XT)"}},Sa=h.HCstub=function(b,c,d,e){b=b.chart;var f=a(b.showborder,1)?a(b.borderthickness,1):0,k=a(b.charttopmargin,e.charttopmargin,15)+f,g=a(b.chartrightmargin,e.chartrightmargin,15)+f,l=a(b.chartbottommargin,e.chartbottommargin,15)+f,f=a(b.chartleftmargin,e.chartleftmargin,15)+f,A=k+l,m=f+g;d*=.7;c*=.7;A>d&&(k-=(A-d)*k/A,l-=(A-d)*l/A);m>c&&(f-=(m-c)*f/m,g-=(m-c)*g/m);c={_FCconf:{0:{stack:{}},1:{stack:{}},x:{stack:{}},
oriCatTmp:[],noWrap:!1,marginLeftExtraSpace:0,marginRightExtraSpace:0,marginBottomExtraSpace:0,marginTopExtraSpace:0,marimekkoTotal:0},chart:{alignTicks:!1,ignoreHiddenSeries:!1,events:{},reflow:!1,spacingTop:k,spacingRight:g,spacingBottom:l,spacingLeft:f,marginTop:k,marginRight:g,marginBottom:l,marginLeft:f,borderRadius:0,plotBackgroundColor:"#FFFFFF",style:{},animation:a(b.defaultanimation,b.animation,1)?{duration:500*a(b.animationduration,1)}:!1},colors:"AFD8F8 F6BD0F 8BBA00 FF8E46 008E8E D64646 8E468E 588526 B3AA00 008ED6 9D080D A186BE CC6600 FDC689 ABA000 F26D7D FFF200 0054A6 F7941C CC3300 006600 663300 6DCFF6".split(" "),
credits:{href:h.CREDIT_HREF,text:h.CREDIT_STRING,enabled:!1},global:{},labels:{items:[]},lang:{},legend:{enabled:!0,symbolWidth:12,borderRadius:1,backgroundColor:"#FFFFFF",initialItemX:0,title:{text:p,x:0,y:0,padding:2},scroll:{},itemStyle:{}},loading:{},plotOptions:{series:{pointPadding:0,borderColor:"#333333",events:{},animation:a(b.animation,b.defaultanimation,1)?{duration:1E3*a(b.animationduration,1)}:!1,states:{hover:{enabled:!1},select:{enabled:!1}},dataLabels:{enabled:!0,color:"#555555",style:{},
formatter:function(){return this.point.showPercentValues?e.numberFormatter.percentValue(this.percentage):this.point.displayValue}},point:{events:{}}},area:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},radar:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},areaspline:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},line:{shadow:!0,
states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},scatter:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},bubble:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},spline:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},pie:{size:"80%",allowPointSelect:!0,cursor:"pointer",
point:{events:{legendItemClick:b.interactivelegend===Da?s:function(){this.slice()}}}},pie3d:{size:"80%",allowPointSelect:!0,cursor:"pointer",point:{events:{legendItemClick:b.interactivelegend===Da?s:function(){this.slice()}}}},column:{},floatedcolumn:{},column3d:{},bar:{},bar3d:{}},point:{},series:[],subtitle:{text:p,style:{}},symbols:[],title:{text:p,style:{}},toolbar:{},tooltip:{style:{}},xAxis:{steppedLabels:{style:{}},labels:{x:0,style:{},enabled:!1},lineWidth:0,plotLines:[],plotBands:[],title:{style:{},
text:p},tickWidth:0,scroll:{enabled:!1}},yAxis:[{startOnTick:!1,endOnTick:!1,title:{style:{},text:p},tickLength:0,labels:{x:0,style:{}},plotBands:[],plotLines:[]},{tickLength:0,gridLineWidth:0,startOnTick:!1,endOnTick:!1,title:{style:{},text:p},labels:{x:0,style:{},enabled:!1,formatter:function(){return this.value!==ub?this.value:p}},opposite:!0,plotBands:[],plotLines:[]}],exporting:{buttons:{exportButton:{},printButton:{enabled:!1}}}};b.palettecolors&&"string"===typeof b.palettecolors&&(c.colors=
b.palettecolors.split(/\s*\,\s*/));return e.hcJSON=c},Ya=h.placeVerticalAxis=function(b,c,d,e,f,k,g,h,l,s){var A=d[B],m=A.smartLabel,n,O,q,u,t=0,ca=A.marginRightExtraSpace,z=A.marginLeftExtraSpace,Q={},w={},E={},ia=b.plotLines,D=b.plotBands,A=c.verticalAxisValuesPadding,va=isNaN(c.fixedValuesPadding)?0:c.fixedValuesPadding,qa=A-va,G=c.verticalAxisValuesPadding,F=c.verticalAxisNamePadding,ma=c.verticalAxisNameWidth,Ja=c.rotateVerticalAxisName&&String(c.rotateVerticalAxisName).toLowerCase(),S="none"!==
Ja,I=b.offset?b.offset:0,N=0,Sa=0,H=0,L=0,ra=0,M=0,J=0,V,Qa,Ka,ya,A=2,J=g?ca+5:z+4,Bb=U(a(d.chart.plotBorderWidth,1),0),gb=b.showLine?b.lineThickness:Bb,ha=function(a,b){var f,d;a&&a.label&&void 0!==P(a.label.text)&&(Ka=a.label,Ka.style&&Ka.style!==Qa&&(Qa=Ka.style,m.setStyle(Qa)),n=m.getOriSize(a.label.text),d=(f=n.width)?f+2:0,a.isGrid?(Q[b]={width:f,height:n.height,label:Ka},L<=d&&(L=d,c.lYLblIdx=b)):a.isTrend&&(g&&Ka.textAlign===za||Ka.textAlign===pa?(w[b]={width:f,height:n.height,label:Ka},ra=
U(ra,d)):(E[b]={width:f,height:n.height,label:Ka},M=U(M,d))))},Ya=function(a,c){var d,e=c?t:t+a;d=b.title.style;O=O||{};if(0<e)return S?(e<O.height&&(m.setStyle(d),O=m.getSmartText(b.title.text,f,e)),d=O.height):(e<O.width&&(m.setStyle(d),O=m.getSmartText(b.title.text,e,f)),d=O.width),b.title._actualWidth=d,b.title.text=O.text,O.tooltext&&(b.title.originalText=O.tooltext),c?e-d+a:e-d;b.title.text=p;return 0},Ta=function(a,b,c){for(var f in a)a[f].label.x=b,a[f].label.y=c},H=0;for(V=D.length;H<V;H+=
1)ha(D[H],H);H=0;for(V=ia.length;H<V;H+=1)ha(ia[H],H);b.title&&b.title.text!=p&&(Qa=b.title.style,m.setStyle(Qa),q=m.getOriSize(Ua).height,b.title._originalText=b.title.text,S?(b.title.rotation="cw"===Ja?90:270,O=m.getSmartText(b.title.text,f,k),t=O.height,u=q):(b.title.rotation=0,O=m.getSmartText(b.title.text,void 0!==ma?ma:k,f),t=O.width,u=20));0<M&&(Sa=M+G);l&&(e=a(e.chart.maxlabelwidthpercent,0),1<=e&&100>=e&&(l=e*l/100,L>l&&(L=l)));N=U(ra,L);N+=N?qa+va:0;0<t&&(N+=t+F+J);(function(){if(Sa+N>k){ya=
Sa+N-k;if(Sa){if(G>=ya){G-=ya;return}ya-=G;G=0}if(qa+F>=ya)F>=ya?F-=ya:(qa-=ya-F,F=0);else{ya-=qa+F;F=qa=0;if(20<M)if(ra>L){if(M-ra>=ya){M-=ya;return}if(ra-M>=ya){ra-=ya;return}ra>M?(ya-=ra-M,ra=M):(ya-=M-ra,M=ra);if(2*(ra-L)>=ya){M-=ya/2;ra-=ya/2;return}ya-=2*(ra-L);M=ra=L}else{if(M-20>=ya){M-=ya;return}ya-=M-20;M=20}if(ra>L){if(ra-L>=ya){ra-=ya;return}ya-=ra-L;ra=L}t-u>=ya?t-=ya:(ya-=t-u,t=u,M>=ya?M=0:(ya-=M,M=0,t>=ya?t=0:(ya-=t,t=0,L>=ya&&(ra=L-=ya))))}}})();H=function(a,b){var c,d=0,r=b?M-2:M+
a-2,e;if(0<M){for(e in E)Ka=E[e].label,E[e].width>r?(Ka.style&&Ka.style!==Qa&&(Qa=Ka.style,m.setStyle(Qa)),c=m.getSmartText(Ka.text,r,f,!0),Ka.text=c.text,c.tooltext&&(Ka.originalText=c.tooltext),E[e].height=c.height,d=U(d,c.width)):d=U(d,E[e].width);return b?r-d+a:r-d}for(e in E)E[e].label.text=p;return 0}(0,!0);H=Ya(H,!0);H=function(a){var b=0,c=U(L,ra)+a-2,d;if(0<c){for(d in Q)Ka=Q[d].label,Q[d].width>c?(Ka.style&&Ka.style!==Qa&&(Qa=Ka.style,m.setStyle(Qa)),a=m.getSmartText(Ka.text,c,f,!0),Ka.text=
a.text,a.tooltext&&(Ka.originalText=a.tooltext),Q[d].height=a.height,b=U(b,a.width)):b=U(b,Q[d].width);for(d in w)Ka=w[d].label,w[d].width>c?(Ka.style&&Ka.style!==Qa&&(Qa=Ka.style,m.setStyle(Qa)),a=m.getSmartText(Ka.text,c,f,!0),Ka.text=a.text,a.tooltext&&(Ka.originalText=a.tooltext),w[d].height=a.height,b=U(b,a.width)):b=U(b,w[d].width);return c-b}for(d in Q)Q[d].label.text=p;for(d in w)w[d].label.text=p;return 0}(H);H=Ya(H);l=c.verticalAxisNamePadding-F;H&&l&&(H>l?(F+=l,H-=l):(F+=H,H=0));l=c.verticalAxisValuesPadding-
(qa+va);H&&l&&(H>l?(qa+=l,H-=l):(qa+=H,H=0));l=c.verticalAxisValuesPadding-G;H&&l&&(H>l?(G+=l,H-=l):(G+=H,H=0));0<M&&(Sa=M+G);N=U(ra,L);N+=N?qa+va:0;0<t&&(N+=t+F+J);l=U(ra,L);l+=0<l?qa+va:0;0<t?(S?t<O.height&&(O=m.getSmartText(b.title.text,f,t)):(t<O.width&&(O=m.getSmartText(b.title.text,t,f)),b.title.y=-((O.height-q)/2)),b.title.text=O.text,O.tooltext&&(b.title.originalText=O.tooltext),b.title.margin=l+F+J+(S?t-q:t/2)):b.title.text=p;q=-(qa+va+I+z+2);ca=ca+G+I+2;J=U(ra,L);b.labels.style&&(A=.35*
parseInt(b.labels.style.fontSize,10));g?(0<M&&Ta(E,q,A),0<J&&(Ta(Q,ca,A),Ta(w,ca,A))):(0<M&&Ta(E,ca,A),0<J&&(Ta(Q,q,A),Ta(w,q,A)));b.labels._textY=A;b.labels._righttX=ca;b.labels._leftX=q;N=N||gb;Sa=Sa||(h?0:Bb);s?(d.chart.marginLeft+=g?Sa:N-s,d.chart.marginRight+=g?N-s:Sa):(d.chart.marginLeft+=g?Sa:N,d.chart.marginRight+=g?N:Sa);return Sa+N},hb=h.titleSpaceManager=function(b,c,d,e){var f=this.snapLiterals||(this.snapLiterals={}),k=c.chart,g=L(k.caption);c=L(k.subcaption);var h=k=a(k.captionpadding,
10),l=b[B],s=this.smartLabel||l.smartLabel,A=!1,m=0,O,n,q=0,u=0,t=0,ca=0,z=b.title,Q=b.subtitle,w=U(a(b.chart.plotBorderWidth,1),0),E=0,ia=0;if(3<e){k<w&&(k=w+2);g!==p&&(O=z.style,t=xa(a(parseFloat(O.fontHeight,10),parseFloat(O.lineHeight,10),12)));c!==p&&(n=Q.style,ca=a(parseInt(n.fontHeight,10),parseInt(n.lineHeight,10),12));if(0<t||0<ca)e=U(e,0),m=t+ca+k,m>e?(q=e-m,A=!0,q<k?k=U(q,5):(q-=k,k=0,ca>q?(u=ca-q+10,ca=0,Q._originalText=Q.text,Q.text=""):(q-=ca,ca=0,t>q&&(u=t-q)))):u=e-m,0<t&&(s.setStyle(O),
t+=u,e=s.getSmartText(g,d,t),u=t-e.height,z.height=t=e.height,z.text=e.text,e.tooltext&&(z.originalText=e.tooltext),E=e.width),0<ca&&(s.setStyle(n),ca+=u,d=s.getSmartText(c,d,ca),u=ca-d.height,ca=d.height,Q.text=d.text,Q.height=d.height,d.tooltext&&(Q.originalText=d.tooltext),ia=d.width),A&&0<u&&(k+=ga(h-k,u)),m=t+ca+k;m=m||w;z.isOnTop?(f.captionstarty=b.chart.marginTop,b.chart.marginTop+=m):(b.chart.marginBottom+=m,f.captionstarty=z.y=l.height-b.chart.marginBottom+k,b.chart.marginTop+=5,m+=5);z._captionWidth=
E;Q._subCaptionWidth=ia;z._lineHeight=t;Q._lineHeight=ca}else Q&&(Q.text=""),z&&(z.text="");return m},ha=h.stepYAxisNames=function(a,b,c,d,f,e){var k=0,g=d.plotLines,h=[],l,s=d.plotLines.length;b=b[B].smartLabel;for(var A=parseFloat(T(c.basefontsize,10)),m;k<s;k+=1)c=g[k],c.isGrid&&c.label&&c.label.text&&(h.push(c),0===c.value&&(l=h.length-1));if(s=h.length)if(d.labels.style?b.setStyle(d.labels.style):h[0].label&&h[0].label.style&&b.setStyle(d.labels.style),k=b.getOriSize("W").height,e||(k+=.4*A),
a/=s-1,a<k){e=U(1,xa(k/a));for(k=a=l;k<s;k+=1)c=h[k],k===f&&((k-a)%e&&m&&(m.label.text=""),a=f),c&&c.label&&((k-a)%e?c.label.text=p:m=c);for(k=a=l;0<=k;k-=1)c=h[k],k===f&&((a-k)%e&&m&&(m.label.text=""),a=f),c&&c.label&&((a-k)%e?c.label.text=p:m=c)}},xb=h.placeHorizontalAxis=function(b,c,d,e,f,k,g){var h=d[B],l=e&&e.chart||{},s,A,m,O,n,q,u,t,ca,z,Q,w,E=0,ia=0,D=10,va=1,qa=0,F=0,G=0,H=0,N=!1,ma=!1,Ja=!1,S=a(l.labelstep,0),Sa=a(l.xaxisminlabelwidth,0),I=a(l.maxlabelheight,k),L=c.labelDisplay,ra=c.rotateLabels,
M=c.horizontalLabelPadding,ya=h.marginBottomExtraSpace,Qa=d.chart.marginLeft,Ka=d.chart.marginRight,J=h.smartLabel,V=h.plotBorderThickness,Bb=c.catCount,gb=c.slantLabels,ha=f/(b.max-b.min),Ta=0,Ya=0,xb=0,sb=0,T=e&&e.chart||{},Ob=1E3*a(T.updateinterval,T.refreshinterval),Lb=T.datastreamurl,Z=Boolean(this.realtimeEnabled&&Ob&&void 0!==Lb),X,wb,Y,da,ac,W,Ib,ka,Pb,oa,aa,Oa,ja,Ha,wa,bb,ua,Ma,Xa,Eb,Fa,Ba,Da,Ca,ib,Na=null,Wb=null,Ga,Yb,$a,Ub,Xb,Tb,qc,hb,Zb,ta,Rb,Wa,Ea=[],Sb=[],lb,zb=0,Ab=0,$b,ic,rb,hc,mc,
Ua,db,nc=c.horizontalAxisNamePadding,yb=0,Ra=c.staggerLines,Kb=Ta,ub=!1,mb=!1,Qb=0,oc,uc,Cb,Jb,id,Qc,jd,Vc,Wc,Bc,Rc,Xc,pc,Kc,Sc,Ec,Yc,Lc,Tc,zc;Rb=b.plotLines;D=ta=0;for(db=Rb.length;ta<db;ta+=1)(A=Rb[ta])&&A.label&&!A.isTrend&&D<parseInt(A.label.style.lineHeight,10)&&(D=parseInt(A.label.style.lineHeight,10),q=A.label.style);if(q||b.labels.style)q=q||b.labels.style,J.setStyle(q),t=J.getOriSize("W"),D=J.lineHeight,u=t.width+4,w=J.getOriSize("WWW").width+4;b.title&&b.title.text!=p&&(q=b.title.style,
J.setStyle(q),F=J.getOriSize("W").height,b.title.rotation=0,O=J.getSmartText(b.title.text,f,k),ia=O.height);Qa!=parseInt(l.chartleftmargin,10)&&(qc=!0);Ka!=parseInt(l.chartrightmargin,10)&&(hb=!0);void 0!==l.canvaspadding&&""!==l.canvaspadding&&(mb=!0);Zb=f-g;switch(L){case "none":N=Ja=!0;ra&&(E=gb?300:270,t=D,D=u,u=t);break;case "rotate":E=gb?300:270;t=D;D=u;u=t;N=!0;break;case "stagger":ma=N=!0;ca=ea((k-F)/D);ca<Ra&&(Ra=ca);break;default:ra&&(E=gb?300:270,t=D,D=u,u=t)}h.isBar&&(N=!0);ta=0;Rb=b.plotLines;
if(typeof d._FCconf.isXYPlot!==Za||h.isBar){X={};W=ac=0;oa=Pb=null;Ma={};ub=!0;ha=f/(b.max-b.min);Jb=function(a,c,f){var e,k,v,g,K,h;h=a.plotObj;K=a.labelTextWidth;K||(n=h.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),K=J.getOriSize(n.text).width+4,a.oriWidth=K,K>wb&&(K=wb),a.labelTextWidth=K,a.leftEdge=h.value*ha-K/2,a.rightEdge=h.value*ha+K/2,f&&(K=ga(K,2*(A.value-b.min)*ha+d.chart.marginLeft),a.labelTextWidth=K));if(typeof c!==Za){if(f=c.plotObj,n=f.label,n.style&&n.style!==q&&(q=n.style,
J.setStyle(q)),c.oriWidth?v=c.oriWidth:(v=J.getOriSize(n.text).width+4,c.oriWidth=v),v>wb&&(v=wb),c.labelTextWidth=v,c.leftEdge=f.value*ha-v/2,c.rightEdge=f.value*ha+v/2,e=h.value*ha,k=e+K/2,g=f.value*ha,v=g-v/2,v<k)if(e+u<g-u)k-=v,e=g-e,a.labelTextWidth=k>e?ga(K,e):U(u,K-k/2),c.labelTextWidth=2*(e-a.labelTextWidth/2),a.leftEdge=h.value*ha-a.labelTextWidth/2,a.rightEdge=h.value*ha+a.labelTextWidth/2,c.leftEdge=f.value*ha-c.labelTextWidth/2,c.rightEdge=f.value*ha+c.labelTextWidth/2;else return c.labelTextWidth=
0,f.label.text=p,!1}else f&&(K=ga(K,2*(b.max-A.value)*ha+d.chart.marginRight),a.labelTextWidth=K,a.leftEdge=h.value*ha-K/2,a.rightEdge=h.value*ha+K/2);a.nextCat=c;return!0};ma?Ra>ic?Ra=ic:2>Ra&&(Ra=2):Ra=1;for(db=Rb.length;ta<db;ta+=1)(A=Rb[ta])&&A.label&&typeof A.label.text!==Za&&(A.isGrid?(da={plotObj:A},A.isCat&&(ka=ta%Ra,X[ka]||(X[ka]=[]),Pb?(oa=da,X[ka].push(oa)):(oa=Pb=da,X[ka].push(Pb))),Ea.push(da)):A.isTrend&&Sb.push({plotObj:A}));Wa=b.plotBands;ta=0;for(db=Wa.length;ta<db;ta+=1)(A=Wa[ta])&&
A.isTrend&&A.label&&typeof A.label.text!==Za&&Sb.push({plotObj:A});if(Ea.length)if(!Ja&&!E)if(h.distributedColumns)for(ta=0,db=Ea.length;ta<db;ta+=1)bb=Ea[ta],ua=ta%Ra,A=bb.plotObj,A.label&&A.isCat&&(0<=ta-Ra?(Oa=Ea[ta-Ra],Da=Oa.plotObj.value*ha+Oa.plotObj._weight*ha/2):(Oa=null,Da=b.min*ha-Qa),ta+Ra<db?(aa=Ea[ta+Ra],Ca=aa.plotObj.value*ha-aa.plotObj._weight*ha/2):(aa=null,Ca=b.max*ha+Ka),n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),ja=A.value*ha,Wc=ja-A._weight*ha/2,Vc=ja+A._weight*
ha/2,1<Ra?(Eb=Wc-Da,Fa=Vc+Ca,ib=Vc-Wc+ga(Eb,Fa)):ib=Vc-Wc,n=A.label,n.style&&n.style!==q&&J.setStyle(n.style),ib<u&&u<J.getOriSize(n.text).width?(A.label.text=p,bb.labelTextWidth=0):(bb.labelTextWidth=ib,s=J.getSmartText(n.text,ib-4,k,N),ib=s.width+4,bb.labelTextWidth=ib,sb=U(sb,s.height)));else{ic=Ea.length;$b=Ea.length-1;(lb=(Ea[$b].plotObj.value-Ea[0].plotObj.value)*ha)?(wb=.1*lb,Y=U(.2*lb,lb/ic)):Y=wb=f;for(m in X)for(ta=0,Ha=X[m].length;ta<Ha;){for(Ib=ta+1;!Jb(X[m][ta],X[m][Ib]);)Ib+=1;ta=Ib}Pb&&
(W=(Pb.plotObj.value-b.min)*ha+Qa-Pb.labelTextWidth/2);A=Ea[0].plotObj;Pb&&A===Pb.plotObj||(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),Q=J.getOriSize(n.text).width+4,ja=(A.value-b.min)*ha+Qa,Pb&&(Ga=W-ja,Q=Ga<Q&&Ga>u/2?2*Ga:0),Ea[0].labelTextWidth=Q,0<Q&&(t=ja-Q/2),t<W&&(W=t));oa&&(Q=oa.labelTextWidth,ac=(b.max-oa.plotObj.value)*ha+Ka-Q/2);A=Ea[$b].plotObj;oa&&A===oa.plotObj||(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),Q=J.getOriSize(n.text).width+4,ja=(b.max-A.value)*
ha+Ka,oa&&(Ga=ja-ac,Q=Ga<Q&&Ga>u/2?2*Ga:0),Ea[$b].labelTextWidth=Q,0<Q&&(t=ja-Q/2),t<ac&&(ac=t));zb=0>W?-W:0;Ab=0>ac?-ac:0;Ua=zb+Ab;if(0<Ua)for(m in Zb>Ua?(wa=(wa=Ab*f/(Ab+f))?wa+4:0,d.chart.marginRight+=wa,f-=wa,wa=(wa=zb*f/(zb+f))?wa+4:0,d.chart.marginLeft+=wa,f-=wa,ha=f/(b.max-b.min)):zb<Ab?Zb>=Ab&&hb?(wa=(wa=Ab*f/(Ab+f))?wa+4:0,d.chart.marginRight+=wa,f-=wa,ha=f/(b.max-b.min)):qc&&(wa=(wa=zb*f/(zb+f))?wa+4:0,d.chart.marginLeft+=wa,f-=wa,ha=f/(b.max-b.min)):Zb>=zb&&qc?(wa=(wa=zb*f/(zb+f))?wa+4:
0,d.chart.marginLeft+=wa,f-=wa,ha=f/(b.max-b.min)):hb&&(wa=(wa=Ab*f/(Ab+f))?wa+4:0,d.chart.marginRight+=wa,f-=wa,ha=f/(b.max-b.min)),Ka=d.chart.marginRight,Qa=d.chart.marginLeft,lb=(Ea[$b].plotObj.value-Ea[0].plotObj.value)*ha,wb=.1*lb,Y=U(.2*lb,lb/ic),X){ta=0;for(Ha=X[m].length;ta<Ha;){for(Ib=ta+1;!Jb(X[m][ta],X[m][Ib],!0);)Ib+=1;ta=Ib}m+=1}ta=0;for(db=Ea.length;ta<db;ta+=1)if(bb=Ea[ta],ua=ta%Ra,A=bb.plotObj,A.label)if(A.isCat)bb.labelTextWidth&&(Ma[ua]=bb);else{aa=(Oa=Ma[ua])?Oa.nextCat:X[ua]?X[ua][0]:
null;Xa=null;if(ta>=Ra)for(Wb=ta-Ra,Xa=Ea[Wb];!Xa.labelTextWidth;)if(Wb>=Ra)Wb-=Ra,Xa=Ea[Wb];else{Xa=null;break}Da=Xa?Xa.rightEdge:b.min*ha-Qa;Ca=aa?aa.leftEdge:b.max*ha+Ka;n=A.label;n.style&&n.style!==q&&(q=n.style,J.setStyle(q));Q=J.getOriSize(n.text).width+4;Tb=A.value*ha-Q/2;if(h.isBar&&ta==db-1&&Xa)Da>Tb&&(Xa.plotObj.label.text=p,Xa.labelTextWidth=0,Da=Xa.leftEdge);else if(Da>Tb||Ca<Tb+Q){A.label.text=p;bb.labelTextWidth=0;continue}Da=U(Da,Tb);ja=A.value*ha;ib=2*ga(ja-Da,Ca-ja);ib.toFixed&&(ib=
ib.toFixed(2));n=A.label;n.style&&n.style!==q&&J.setStyle(n.style);ib<u&&u<J.getOriSize(n.text).width?(A.label.text=p,bb.labelTextWidth=0):(bb.labelTextWidth=ib,s=J.getSmartText(n.text,ib-4,k,N),ib=s.width+4,bb.labelTextWidth=ib,bb.leftEdge=ja-ib/2,bb.rightEdge=ja+ib/2,sb=U(sb,s.height))}Xa=Ba=null;ta=0;for(db=Ea.length;ta<db;ta+=1)if(bb=Ea[ta],A=bb.plotObj,ua=ta%Ra,A.isCat&&bb.labelTextWidth){Xa=Ba=null;ja=A.value*ha;if(ta>=Ra)for(Wb=ta-Ra,Xa=Ea[Wb];!Xa.labelTextWidth;)if(Wb>Ra)Wb-=Ra,Xa=Ea[Wb];
else{Xa=null;break}Eb=Xa?ja-Xa.rightEdge:ja-b.min*ha+d.chart.marginLeft;if(ta+Ra<db)for(Na=ta+Ra,Ba=Ea[Na];!Ba.labelTextWidth;)if(Na+Ra<db-1)Na+=Ra,Ba=Ea[Na];else{Ba=null;break}Fa=Ba?Ba.leftEdge-ja:b.max*ha+d.chart.marginRight-ja;ib=2*ga(Eb,Fa);ib>Y&&(ib=Y);ib>bb.oriWidth&&(ib=bb.oriWidth);bb.labelTextWidth=ib;n=A.label;n.style&&n.style!==q&&J.setStyle(n.style);s=J.getSmartText(n.text,ib-4,k,N);bb.labelTextWidth=s.width+4;sb=U(sb,s.height);bb.rightEdge=ja+bb.labelTextWidth/2}}else if(E)for(ta=0,db=
Ea.length;ta<db;ta+=1)if((A=Ea[ta].plotObj)&&A.label&&A.label.text){n=A.label;n.style&&n.style!==q&&(q=n.style,J.setStyle(q));m=1;if(ta+m<db)for(Bc=Ea[m+ta].plotObj;Bc&&(Bc.value-A.value)*ha<u;)if(A.isCat){if(Bc.label){Bc.label.text=p;m+=1;if(m+ta>=db-1)break;Bc=Rb[m+ta].plotObj}}else if(Bc.isCat){A.label.text=p;A=Bc;ta+=m-1;n=A.label;n.style&&n.style!==q&&(q=n.style,J.setStyle(q));break}xb=U(xb,J.getOriSize(n.text).width+4)}m=0;for(db=Sb.length;m<db;m+=1)(A=Sb[m].plotObj)&&A.label&&void 0!==P(A.label.text)&&
(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),s=J.getOriSize(n.text),n.verticalAlign===na?Ta=U(Ta,s.height):Ya=U(Ya,s.height))}else{for(db=Rb.length;ta<db;ta+=1)(A=Rb[ta])&&(A.isGrid?Ea.push(A):A.isTrend&&Sb.push(A));Wa=b.plotBands;ta=0;for(db=Wa.length;ta<db;ta+=1)(A=Wa[ta])&&Sb.push(A);$b=Ea.length-1;ic=Ea.length;ma&&(Ra>ic?Ra=ic:2>Ra&&(Ra=2));if(ic)for(b.scroll&&b.scroll.viewPortMin&&b.scroll.viewPortMax?(Ub=b.scroll.viewPortMin,Xb=b.scroll.viewPortMax,hb=qc=!1):(Ub=b.min,Xb=b.max),
lb=(Ea[$b].value-Ea[0].value)*ha,rb=id=lb/(Bb-1),hc=(Ea[0].value-Ub)*ha,mc=(Xb-Ea[$b].value)*ha,"auto"===L?rb<w&&(E=gb?300:270,t=D,D=u,u=t,N=!0):"stagger"===L&&(rb*=Ra),"line"!==this.defaultSeriesType&&("area"===this.defaultSeriesType?h.drawFullAreaBorder&&(V>hc&&(Ub=b.min-=V/(2*ha),hc+=(Ea[0].value-Ub)*ha),V>mc&&(Xb=b.max+=V/(2*ha),mc+=(Xb-Ea[$b].value)*ha)):(V>hc&&(Ub=b.min-=V/(2*ha),hc+=(Ea[0].value-Ub)*ha),V>mc&&(Xb=b.max+=V/(2*ha),mc+=(Xb-Ea[$b].value)*ha))),u<Sa&&(u=Sa),va=ma||Ja?U(1,S):U(1,
S,xa(u/rb)),h.x&&(h.x.stepValue=va),rb*=va,z=2*(hc+Qa),(n=Rb[0].label)&&n.text&&(n.style&&J.setStyle(n.style),Q=270===E?ga(rb,J.getOriSize(n.text).height+4):ga(rb,J.getOriSize(n.text).width+4),Q>z&&(Ja||(zb=(Q-z)/2),qc||(mb&&(zb=0),rb-=zb/(Bb-1),Cb=rb*(Bb-1),ha=rb,oc=(lb-Cb)/ha,Xb=b.max+=oc,Ub=b.min-=oc,zb=0,lb=Cb,hc=(Ea[0].value-Ub)*ha,mc=(Xb-Ea[$b].value)*ha))),z=2*(mc+Ka),(n=Rb[$b].label)&&n.text&&(n.style&&J.setStyle(n.style),Q=270===E?ga(rb,J.getOriSize(n.text).height+4):ga(rb,J.getOriSize(n.text).width+
4),Q>z&&(Ja||(Ab=(Q-z)/2),hb||(mb&&(Ab=0),rb-=Ab/(Bb-1),Cb=rb*(Bb-1),ha=rb,oc=(lb-Cb)/ha,Ab=0,lb=Cb,hc=(Ea[0].value-Ub)*ha,mc=(Xb-Ea[$b].value)*ha))),Ua=zb+Ab,0<Ua&&(Zb>Ua?(wa=(wa=Ab*f/(Ab+f))?wa+4:0,d.chart.marginRight+=wa,f-=wa,wa=(wa=zb*f/(zb+f))?wa+4:0,d.chart.marginLeft+=wa,f-=wa,ha=f/(b.max-b.min)):zb<Ab?Zb>=Ab&&hb?(wa=(wa=Ab*f/(Ab+f))?wa+4:0,d.chart.marginRight+=wa,f-=wa,ha=f/(b.max-b.min)):qc&&(wa=(wa=zb*f/(zb+f))?wa+4:0,d.chart.marginLeft+=wa,f-=wa,ha=f/(b.max-b.min)):Zb>=zb&&qc?(wa=(wa=
zb*f/(zb+f))?wa+4:0,d.chart.marginLeft+=wa,f-=wa,ha=f/(b.max-b.min)):hb&&(wa=(wa=Ab*f/(Ab+f))?wa+4:0,d.chart.marginRight+=wa,f-=wa,ha=f/(b.max-b.min)),lb=(Ea[$b].value-Ea[0].value)*ha,rb=lb/(Bb-1),ma&&(rb*=Ra),va=ma||Ja?U(1,S):E?U(1,S,xa(D/rb)):U(1,S,xa(u/rb)),h.x&&(h.x.stepValue=va),rb*=va),m=0;m<ic;m+=1){A=Ea[m];if(m%va&&A.label){if(A.stepped=!0,A.label.style=b.steppedLabels.style,!Z)continue}else A.stepped=!1;A&&A.label&&void 0!==P(A.label.text)&&(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),
E&&Ja?(s=J.getOriSize(n.text),xb=U(xb,s.width+4),sb=U(sb,s.height)):Ja||(s=E||ma?J.getOriSize(n.text):J.getSmartText(n.text,rb-4,k,N),xb=U(xb,s.width+4),sb=U(sb,s.height)))}m=0;for(db=Sb.length;m<db;m+=1)(A=Sb[m])&&A.label&&void 0!==P(A.label.text)&&(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),s=J.getOriSize(n.text),n.verticalAlign===na?Ta=U(Ta,s.height):Ya=U(Ya,s.height));b.scroll&&b.scroll.enabled&&!E&&!Ja&&(oc=xb/2,d.chart.marginLeft<oc&&(uc=oc-d.chart.marginLeft,Zb>uc&&(f-=uc,Zb-=
uc,d.chart.marginLeft+=uc)),d.chart.marginRight<oc&&(uc=oc-d.chart.marginRight,Zb>uc&&(f-=uc,Zb-=uc,d.chart.marginRight+=uc)))}Ja?(yb=D,E&&(yb=xb)):yb=E?xb:ma?Ra*sb:sb;0<yb&&(yb+M>I&&(yb=I-M,Ra=Math.floor(yb/sb)),Kb+=M+yb);0<ia&&(Kb+=ia+nc);Yb=M-4;$a=Ya+Kb+2;t=0;$a>k&&(Ga=$a-k,nc>Ga?(nc-=Ga,Ga=0):(Ga-=nc,nc=0,Yb>Ga?(Yb-=Ga,Ga=0):(Ga-=Yb,Yb=0),M=Yb+4),Ya>Ga?(Ya-=Ga,Ga=0):(0<Ya&&(Ga-=Ya,Ya=0),0<Ga&&(Ta>Ga?(Ta-=Ga,Ga=0):(0<Ta&&(Ga-=Ta,Ta=0),0<Ga&&((t=ia-F)>Ga?(ia-=Ga,Ga=0):(Ga-=t,ia=F,0<Ga&&((t=yb-D)>
Ga?(yb-=Ga,Ga=0):(Ga-=t,yb=D,0<Ga&&(Ga-=ia+nc,ia=0,0<Ga&&(Ga-=yb,yb=0,0<Ga&&(M-=Ga)))))))))));M+=ya;Rc=h.is3d?-d.chart.xDepth:0;Xc=yb+M;Ec=Rc;Yc=.5*D;qa=D+M;db=Ea.length;G=0;if(ub)if(E)for(zc=pa,pc=gb?M+8:M+4,db=Ea.length,m=0;m<db;m+=1)(A=Ea[m].plotObj)&&A.label&&void 0!==P(A.label.text)&&(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),ta=1,s=J.getSmartText(n.text,yb-4,u,N),n.text=s.text,s.tooltext&&(n.originalText=s.tooltext),Ec=Rc+Yc/2,n.y=pc,n.x=Ec,n.rotation=E,n.textAlign=zc,G+=1);
else for(Kc=yb,zc=La,pc=qa,m=0;m<db;m+=va)A=Ea[m].plotObj,D=parseInt(A.label.style.lineHeight,10),A&&A.label&&void 0!==P(A.label.text)&&(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),Ja||(s=J.getSmartText(n.text,Ea[m].labelTextWidth-4,Kc,N),n.text=s.text,s.tooltext&&(n.originalText=s.tooltext),ma&&(pc=qa+G%Ra*D)),n.y=pc,n.x=Ec,n.rotation=E,n.textAlign=zc,G+=1);else{E?(Kc=rb,Sc=yb-4,zc=pa,pc=gb?M+8:M+4):ma?(Sc=rb-4,zc=La):(Kc=yb,Sc=rb-4,zc=La,pc=qa);for(m=0;m<db;m+=va)A=Ea[m],D=xa(parseFloat(A.label.style.lineHeight)),
Yc=.5*D,qa=D+M,A&&A.label&&void 0!==P(A.label.text)&&(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),Ja||(ma&&(Kc=D),Qc=Qa+(m-Ub)*id-d.chart.spacingLeft,jd=300===E?ga(ba(2.999*Qc*Qc+Qc*Qc)-M,Sc):Sc,s=J.getSmartText(n.text,jd,Kc,N),Qb=U(Qb,E?s.width:s.height),n.text=s.text,s.tooltext&&(n.originalText=s.tooltext),ma&&(pc=qa+G%Ra*D)),E?Ec=Rc+.5*D:ma||(pc=D+M),n.y=pc,n.x=Ec,n.rotation=E,n.textAlign=zc,G+=1);300===E&&(yb=Qb,Xc=yb+M);c._labelY=qa;c._labelX=Rc;c._yShipment=pc;c._isStagger=ma;
c._rotation=E;c._textAlign=zc;c._adjustedPx=Yc;c._staggerLines=Ra;c._labelHeight=D}db=Sb.length;for(m=Tc=Lc=0;m<db;m+=1)(A=Sb[m].plotObj?Sb[m].plotObj:Sb[m])&&A.label&&void 0!==P(A.label.text)&&(n=A.label,n.style&&n.style!==q&&(q=n.style,J.setStyle(q)),n.verticalAlign===na?(s=J.getSmartText(n.text,f,Ta,!0),Tc=U(Tc,s.height),n.text=s.text,s.tooltext&&(n.originalText=s.tooltext),n.y=Xc+J.getOriSize(n.text).height,n.x=Ec):(s=J.getSmartText(n.text,f,Ya,!0),Lc=U(Lc,s.height),n.text=s.text,s.tooltext&&
(n.originalText=s.tooltext),n.y=-(Ya-J.getOriSize("W").height+M+2)));0<ia&&(J.setStyle(b.title.style),O=J.getSmartText(b.title.text,f,ia),b.title.text=O.text,O.tooltext&&(b.title.originalText=O.tooltext),b.title.margin=Xc+Tc+nc);Kb=Tc;0<yb&&(h.horizontalAxisHeight=M+yb-ya,Kb+=h.horizontalAxisHeight);0<ia&&(Kb+=H=ia+nc);Kb=Kb||M-ya;d.chart.marginBottom+=Kb;0<Lc&&(d.chart.marginTop+=Lc,Kb+=Lc);if(b.opposite)for(b.title.margin-=yb-(O&&O.height||0)+M,Kb-=H,d.chart.marginTop+=Kb,d.chart.marginBottom-=
Kb,d.xAxis.opposite=1,db=Rb.length,ta=0;ta<db;ta+=1)(A=Rb[ta])&&A.isGrid&&(n=A.label)&&void 0!==n.text&&(n.textAlign=za,n.y-=pc+M+4);return Kb},Ka=h.configureLegendOptions=function(c,d,e,k,f){k=c.legend;var g=c.chart,h=g.is3D?ya.chart3D:ya.chart2D,l=g.useRoundEdges,s=a(d.legendiconscale,1),A=(parseInt(k.itemStyle.fontSize,10)||10)+1,n=this.colorManager,m;if(0>=s||5<s)s=1;k.padding=4;0>=A&&(A=1);m=3*s;A=ga(A*s,f-8);0>=A&&(m=A=0);k.symbolWidth=A;k.symbolPadding=m;k.textPadding=4;k.legendHeight=f=A+
2*m;k.rowHeight=U(parseInt(k.itemStyle.lineHeight,10)||12,f);e?(k.align=pa,k.verticalAlign="middle",k.layout="vertical"):k.x=(g.marginLeft-g.spacingLeft-g.marginRight+g.spacingRight)/2;e=b(d.legendbordercolor,n.getColor(h.legendBorderColor));f=a(d.legendborderalpha,100);g=a(d.legendbgalpha,100);k.backgroundColor=G(b(d.legendbgcolor,n.getColor(h.legendBgColor)),g);k.borderColor=G(e,f);k.borderWidth=a(d.legendborderthickness,!l||d.legendbordercolor?1:0);k.shadow=Boolean(a(d.legendshadow,1));k.symbol3DLighting=
Boolean(a(d.use3dlighting,d.useplotgradientcolor,1));k.shadow&&(k.shadow={enabled:k.shadow,opacity:U(f,g)/100});k.reversed=Boolean(a(d.reverselegend,0)-a(this.reverseLegend,0));k.style={padding:4};Boolean(a(d.interactivelegend,1))?k.symbolStyle={_cursor:"hand",cursor:"pointer"}:(c.legend.interactiveLegend=!1,k.itemStyle.cursor="default",k.itemHoverStyle={cursor:"inherit"});k.borderRadius=a(d.legendborderradius,l?3:0);k.legendAllowDrag=Boolean(a(d.legendallowdrag,0));k.title.text=L(w(d.legendcaption,
p));k.legendScrollBgColor=H(b(d.legendscrollbgcolor,d.scrollcolor,n.getColor("altHGridColor")));k.legendScrollBarColor=b(d.legendscrollbarcolor,e);k.legendScrollBtnColor=b(d.legendscrollbtncolor,e)},sb=h.placeLegendBlockRight=function(b,c,d,e,f){this.configureLegendOptions(b,c.chart,!0,f,d);var k=this.snapLiterals||(this.snapLiterals={}),g=0,h=b.series,s,l=b[B],A=this.smartLabel||l.smartLabel,n=b.chart.spacingRight,m=b.legend,q,O=m.textPadding,u=m.title.padding,t=m.symbolWidth,ca=m.symbolPadding,
z=t+2*ca,Q=2*e,E=0,w=a(c.chart.legendpadding,7);c=w+m.borderWidth/2+a(c.chart.canvasborderthickness,1);var ia=2*m.padding,D=ia,va=!1,qa=[];d-=ia+w;f&&(h=h&&h[0]&&h[0].data);if(typeof h===Za||typeof h.length===Za)return 0;f=h.length;for(g=0;g<f;g+=1)(s=h[g])&&!1!==s.showInLegend&&(s.__i=g,qa.push(s));qa.sort(function(a,b){return a.legendIndex-b.legendIndex||a.__i-b.__i});f=qa.length;q=d-z-w-O;0>q&&(q=0);A.setStyle(m.itemStyle);m.reversed&&qa.reverse();for(g=0;g<f;g+=1)s=qa[g],va=!0,s._legendX=0,s._legendY=
D,0===q?(D+=s._legendH=z,s.name=p,s._totalWidth=t+ca):(h=A.getSmartText(s.name,q,Q),s.name=h.text,h.tooltext&&(s.originalText=h.tooltext),h.height<z&&(s._legendTestY=(z-h.height)/2),s._totalWidth=t+ca+O+h.width+w,D+=s._legendH=U(h.height,z),E=U(h.width,E));if(va)return m.itemWidth=E+z+w+O,m.width=m.itemWidth+ia,m.title.text!==p&&(A.setStyle(m.title.style),h=A.getSmartText(m.title.text,d,Q),m.title.text=h.text,h.tooltext&&(m.title.originalText=h.tooltext),g=h.width+ia,m.width<g&&(m.initialItemX=(g-
m.width)/2,m.width=g),m.initialItemY=h.height+u,D+=m.initialItemY),m.height=m.totalHeight=D,m.height>e&&(m.height=e,m.scroll.enabled=!0,m.scroll.flatScrollBars=l.flatScrollBars,m.scroll.scrollBar3DLighting=l.scrollBar3DLighting,m.width+=(m.scroll.scrollBarWidth=10)+(m.scroll.scrollBarPadding=2)),k.legendstartx=l.width-n-m.width,k.legendwidth=m.width,k.legendendx=k.legendstartx+k.legendwidth,k.legendheight=m.height,c=ga(m.width+c,d),b.chart.marginRight+=c+w,c;m.enabled=!1;return 0},Ta=h.placeLegendBlockBottom=
function(b,c,d,e,f){this.configureLegendOptions(b,c.chart,!1,f,d);var k=this.snapLiterals||(this.snapLiterals={}),g=0,h=b.series,s=b[B],l=s.smartLabel||this.smartLabel,A=b.chart,m=A.spacingBottom,n=A.spacingLeft,A=A.spacingRight,q=b.legend,O,u=q.textPadding,t=q.title.padding,ca,z=q.symbolWidth,Q=q.symbolPadding,E=q.legendHeight,w=c.chart;ca=0;var D=2*e,ia=q.rowHeight,va=.05*ia,qa=[];O=a(w.minimisewrappinginlegend,0);var w=a(parseInt(w.legendnumcolumns,10),0),G=0,F=0,N=0,ma=g=0,J=q.padding,H=2*J,J=
u+Q+J;c=a(c.chart.legendpadding,7)+q.borderWidth/2+1;var M=H,Ja=!1,S,Sa=[],L=!1,I=0,ra=0;0>w&&(w=0);d-=H;l.setStyle(q.itemStyle);g=l.getOriSize(Ua).height;c=ga(c,e-g-8);e-=c;f&&(h=h&&h[0]&&h[0].data);if(typeof h===Za||typeof h.length===Za)return 0;f=h.length;for(g=0;g<f;g+=1)(S=h[g])&&!1!==S.showInLegend&&(S.__i=g,Sa.push(S));Sa.sort(function(a,b){return a.legendIndex-b.legendIndex||a.__i-b.__i});f=Sa.length;l.setStyle(q.itemStyle);for(g=0;g<f;g+=1)Ja=!0,h=l.getOriSize(Sa[g].name),G=U(G,h.width),
F+=h.width,N+=1;g=F/N;E=E+va+u+Q+H;F+=E*N;if(Ja){g+=E;G+=E;0<w&&N<w&&(w=N);F<=d&&(0>=w||w===N)?(w=N,ma=g=F/N,L=!0):0<w&&(ma=d/w)>g?ma>G&&(ma=G):d>G&&(O||1.5*g>G)?(w=ea(d/G),N<w&&(w=N),ma=G):d>=2*g?(w=ea(d/g),N<w&&(w=N),ma=ea(d/w),ma>G&&(ma=G)):(w=1,ma=d);q.itemWidth=ma;O=ma-E;0>O&&(Q=O=u=0);q.symbolPadding=Q;q.textPadding=u;q.width=ma*w-va;q.title.text!==p&&(l.setStyle(q.title.style),h=l.getSmartText(q.title.text,d,D),q.title.text=h.text,h.tooltext&&(q.title.originalText=h.tooltext),ca=h.width+H,
q.width<ca&&(q.initialItemX=(ca-q.width)/2,q.width=ca),q.initialItemY=ca=h.height+t);l.setStyle(q.itemStyle);q.reversed&&Sa.reverse();for(g=0;g<f;g+=1){d=Sa[g];0===O&&(qa[I]=!0,d.name=p,t=1,u=parseInt(I/w,10),va=I%w,d._legendX=va*ma,d._legendY=u*ia+H,d._legendH=t*ia,d._totalWidth=z+Q);if(L)h=l.getOriSize(d.name),h.height<ia&&(d._legendTestY=(ia-h.height)/2),d._legendX=ra,d._legendY=H,d._legendH=ia,d._totalWidth=z+J+h.width,ra+=h.width+E;else{h=l.getSmartText(d.name,O,D);d.name=h.text;for(h.tooltext&&
(d.originalText=h.tooltext);!0===qa[I];)I+=1;u=h.height/ia;va=I;for(t=0;t<u;t+=1,va+=w)qa[va]=!0;h.height<ia&&(d._legendTestY=(ia-h.height)/2);u=parseInt(I/w,10);va=I%w;d._legendX=va*ma;d._legendY=u*ia+H;d._legendH=t*ia;d._totalWidth=z+J+h.width}I+=1}l=L?1:xa(qa.length/w);q.height=q.totalHeight=M+(l*ia+ca);q.rowHeight=ia;q.legendNumColumns=w;q.height>e&&(q.height=e,q.scroll.enabled=!0,q.scroll.flatScrollBars=s.flatScrollBars,q.scroll.scrollBar3DLighting=s.scrollBar3DLighting,q.width+=(q.scroll.scrollBarWidth=
10)+(q.scroll.scrollBarPadding=2));k.legendstartx=n+.5*(s.width-n-A-q.width)+(q.x||0);k.legendwidth=q.width;k.legendendx=k.legendstartx+k.legendwidth;k.legendstarty=s.height-m-q.height;k.legendheight=q.height;k.legendendy=k.legendstarty+k.legendheight;c+=q.height;b.chart.marginBottom+=c;return c}q.enabled=!1;return 0},gb=function(a,b){return a.value-b.value},wb=function(a,b,c){var d=b._originalText;a=a[B].smartLabel;b.text=b.rotation?a.getSmartText(d,c,b._actualWidth).text:a.getSmartText(d,b._actualWidth,
c).text;b.centerYAxisName=!0},Lb=h.adjustVerticalAxisTitle=function(a,b,c){if(b&&b.text){var d=b.text,f=a[B].smartLabel,e=2*ga(a.chart.marginTop,a.chart.marginBottom)+c,k=c+a.chart.marginTop+a.chart.marginBottom;b.style&&f.setStyle(b.style);d=f.getOriSize(d);void 0===b.centerYAxisName&&(b.centerYAxisName=!0);b.rotation?d.width>e&&(b.y=k/2-(c/2+a.chart.marginTop),b.centerYAxisName=!1):d.height>e&&(b.y=(k/2-(c/2+a.chart.marginTop))/2,b.centerYAxisName=!1)}},Ob=h.adjustVerticalCanvasMargin=function(b,
c,d,e){var f=c.chart,k=c=0,g=0,h=a(f.canvastopmargin,0),f=a(f.canvasbottommargin,0),s=h/(h+f),l=b.chart.marginTop,A=b.chart.marginBottom;f>A&&(c+=f-A);h>l&&(c+=h-l);c>d?h>l&&f>A?(k=d*s,g=d*(1-s)):h>l?k=d:g=d:0<c&&(f>A&&(g=f-A),h>l&&(k=h-l));k&&(b.chart.marginTop+=k);g&&(b.chart.marginBottom+=g,e&&e.title&&(e.title.margin+=g));return k+g},ac=h.adjustHorizontalCanvasMargin=function(b,c,d,e,f){var k=c.chart;c=a(k.canvasleftmargin,0);var k=a(k.canvasrightmargin,0),g=c/(c+k),h=0,s=b.chart.marginLeft,l=
b.chart.marginRight,A=0,p=0;c>s&&(h+=c-s);k>l&&(h+=k-l);h>d?c>s&&k>l?(A=d*g,p=d*(1-g)):k>l?p=d:A=d:0<h&&(c>s&&(A=c-s),k>l&&(p=k-l));A&&(b.chart.marginLeft+=A,e&&e.title&&(e.title.margin+=A));p&&(b.chart.marginRight+=p,f&&f.title&&(f.title.margin+=p));return p+A},Ib=function(a,b){return a-b},Pb=h.getDataParser={column:function(c,d,k){var g=c[B],f=d.borderWidth;return function(h,s,l){var A=d.plotgradientcolor,p=d.is3d,m=d.isRoundEdges,n=d.plotBorderColor,O=b(h.color,d.color),u=b(h.ratio,d.ratio),B=
q(d.plotBorderAlpha),t=a(h.dashed,d.dashed),ca=b(h.dashlen,d.dashLen),z=b(h.dashgap,d.dashGap),Q=d.use3DLighting,w=q(b(h.alpha,d.alpha)).toString(),E={opacity:w/100},ia=d.isBar,D=d.fillAangle,va=0>l?ia?180-D:360-D:D,D=oa(O+Fa+A,w,u,va,m,n,ga(w,B).toString(),ia,p),qa=t?e(ca,z,f):"none";s=k.getPointStub(h,l,g.oriCatTmp[s],c,d,d.showValues,d.yAxis);h=k.pointHoverOptions(h,d,{plotType:"column",is3d:p,isBar:ia,use3DLighting:Q,isRoundEdged:m,color:O,gradientColor:A,alpha:w,ratio:u,angle:va,borderWidth:f,
borderColor:n,borderAlpha:B,borderDashed:t,borderDashGap:z,borderDashLen:ca,shadow:E});s.y=l;s.shadow=E;s.color=D[0];s.borderColor=D[1];s.borderWidth=f;s.use3DLighting=Q;s.dashStyle=qa;s.tooltipConstraint=k.tooltipConstraint;s.hoverEffects=h.enabled&&h.options;s.rolloverProperties=h.enabled&&h.rolloverOptions;return s}},line:function(c,d,k){var g=c[B];return function(f,h,s){var l=a(f.alpha,d.lineAlpha),A={opacity:l/100},p=a(f.anchorsides,d.anchorSides,0),m=a(f.anchorborderthickness,d.anchorBorderThickness,
1),n=H(b(f.anchorbordercolor,d.anchorBorderColor)),q=H(b(f.anchorbgcolor,d.anchorBgColor)),O=a(f.anchorstartangle,d.anchorStartAngle,90),u=b(f.anchoralpha,d.anchorAlpha),B=b(f.anchorbgalpha,u),t=a(f.anchorradius,d.anchorRadius),ca=Boolean(a(f.anchorshadow,d.anchorShadow,0));h=k.getPointStub(f,s,g.oriCatTmp[h],c,d,d.showValues,d.yAxis);var z=b(f.anchorimageurl,d.imageUrl),Q=b(f.anchorimagescale,d.imageScale),w=b(f.anchorimagealpha,d.imageAlpha);h.y=s;h.shadow=A;h.anchorShadow=d.anchorShadow;h.dashStyle=
a(f.dashed,d.lineDashed)?e(d.lineDashLen,d.lineDashGap,d.lineThickness):null;h.color={FCcolor:{color:H(b(f.color,d.lineColor)),alpha:l}};h.valuePosition=b(f.valueposition,d.valuePosition);s=k.pointHoverOptions(f,d,{plotType:"anchor",anchorBgColor:q,anchorAlpha:u,anchorBgAlpha:B,anchorAngle:O,anchorBorderThickness:m,anchorBorderColor:n,anchorBorderAlpha:u,anchorSides:p,anchorRadius:t,imageUrl:z,imageScale:Q,imageAlpha:w,shadow:A});h.marker={enabled:void 0===d.drawAnchors?0!==l:!!d.drawAnchors,shadow:ca&&
{opacity:u/100},fillColor:{FCcolor:{color:H(b(f.anchorbgcolor,d.anchorBgColor)),alpha:(b(f.anchorbgalpha,d.anchorBgAlpha)*u/100).toString()}},lineColor:{FCcolor:{color:H(b(f.anchorbordercolor,d.anchorBorderColor)),alpha:u}},imageUrl:z,imageScale:Q,imageAlpha:w,lineWidth:a(f.anchorborderthickness,d.anchorBorderThickness),radius:a(f.anchorradius,d.anchorRadius),symbol:Ma(a(f.anchorsides,d.anchorSides)),startAngle:b(f.anchorstartangle,d.anchorAngle)};h.hoverEffects=s.enabled&&s.options;h.rolloverProperties=
s.enabled&&s.rolloverOptions;return h}},area:function(c,d,e){var k=c[B];return function(f,g,h){var s=b(f.alpha,d.fillAlpha),l={opacity:U(s,d.lineAlpha)/100,inverted:!0},A=a(f.anchorsides,d.anchorSides,0),p=a(f.anchorborderthickness,d.anchorBorderThickness,1),m=H(b(f.anchorbordercolor,d.anchorBorderColor)),n=H(b(f.anchorbgcolor,d.anchorBgColor)),q=a(f.anchorstartangle,d.anchorStartAngle,90),O=b(f.anchoralpha,d.anchorAlpha),u=b(f.anchorbgalpha,O),B=a(f.anchorradius,d.anchorRadius),t=Boolean(a(f.anchorshadow,
d.anchorShadow,0));g=e.getPointStub(f,h,k.oriCatTmp[g],c,d,d.showValues,d.yAxis);var ca=b(f.anchorimageurl,d.imageUrl),z=b(f.anchorimagescale,d.imageScale),Q=b(f.anchorimagealpha,d.imageAlpha);g.y=h;g.shadow=l;g.anchorShadow=d.anchorShadow;g.color={FCcolor:{color:H(b(f.color,d.fillColor)),alpha:s}};g.valuePosition=b(f.valueposition,d.valuePosition);h=e.pointHoverOptions(f,d,{plotType:"anchor",anchorBgColor:n,anchorAlpha:O,anchorBgAlpha:u,anchorAngle:q,anchorBorderThickness:p,anchorBorderColor:m,anchorBorderAlpha:O,
anchorSides:A,anchorRadius:B,imageUrl:ca,imageScale:z,imageAlpha:Q,shadow:l});g.marker={enabled:d.drawAnchors,shadow:t&&{opacity:O/100},fillColor:{FCcolor:{color:H(b(f.anchorbgcolor,d.anchorBgColor)),alpha:(b(f.anchorbgalpha,d.anchorBgAlpha)*O/100).toString()}},lineColor:{FCcolor:{color:H(b(f.anchorbordercolor,d.anchorBorderColor)),alpha:O}},imageUrl:ca,imageScale:z,imageAlpha:Q,lineWidth:a(f.anchorborderthickness,d.anchorBorderThickness),radius:B,symbol:Ma(a(f.anchorsides,d.anchorSides)),startAngle:b(f.anchorstartangle,
d.anchorAngle)};g.hoverEffects=h.enabled&&h.options;g.rolloverProperties=h.enabled&&h.rolloverOptions;g.events={click:d.getLink};return g}}};d.core.options.resizeTrackingInterval=300;d.core.options.preventTrackResize=!1;h.createChart=function(a,b,c,e,f,k,g){var s=a.jsVars,l,A,p=Z[c||(c=a.chartType())],m,n=s.hasNativeMessage,q=a.options,O=a.args,u;u=function(f){var k={renderer:"javascript"},l=s.fcObj,A=l.width,q=l.height,O=p&&p.eiMethods,u=s.overlayButton,B;b.jsVars=a.jsVars;s.container=b;s.hcObj=
f;s.type=c;s.width=b.offsetWidth;s.height=b.offsetHeight;s.instanceAPI=m;if(f.hasRendered){d.extend(b,ra);if(O&&"string"!==typeof O)for(B in O)b[B]=O[B];s.overlayButtonActive&&u&&(u.innerHTML="",u.appendChild(z.createTextNode(s.overlayButtonMessage)),f.container.appendChild(u))}(/\%/g.test(A)||/\%/g.test(q))&&b&&b.parentNode&&!d.core.options.preventTrackResize&&Bb(l,b);e&&(e({success:f.hasRendered,ref:b,id:a.id}),f.hasRendered&&(h.raiseEvent("loaded",{type:c,renderer:"javascript"},a,[a.id]),n||(l.__state.firstRenderNotified=
!0,setTimeout(function(){h.raiseEvent("rendered",{renderer:"javascript"},l,[l.id])},0))));f.hasRendered&&s.previousDrawCount<s.drawCount&&(k.width=s.width,k.height=s.height,k.drawCount=s.drawCount,k.displayingMessage=n,k.renderer=l.options.renderer,h.raiseEvent("drawcomplete",k,l,[l.id]),n||g||setTimeout(function(){l.__state&&!l.__state.firstRenderNotified&&h.raiseEvent("rendered",{renderer:"javascript"},l,[l.id]);d.raiseEvent("renderComplete",k,l)},0))};s.instanceAPI&&s.instanceAPI.dispose&&s.instanceAPI.dispose();
m=p?new Z(c):new Z("stub");m.chartInstance=a;m.origRenderWidth=a.__state.renderedWidth;m.origRenderHeight=a.__state.renderedHeight;void 0!==f?"string"===typeof f&&(f=new ia(b,f,a),n=s.hasNativeMessage=!0):!p||!p.init||p&&"stub"===p.name?(a._chartMessageStyle={color:O.typeNotSupportedMessageColor||q.baseChartMessageColor,fontFamily:O.typeNotSupportedMessageFont||q.baseChartMessageFont,fontSize:O.typeNotSupportedMessageFontSize||q.baseChartMessageFontSize},f=new ia(b,q.typeNotSupportedMessage,a),n=
s.hasNativeMessage=!0):s.message?(f=new ia(b,s.message,a),n=s.hasNativeMessage=!0):s.loadError?(a._chartMessageStyle={color:O.dataLoadErrorMessageColor||q.baseChartMessageColor,fontFamily:O.dataLoadErrorMessageFont||q.baseChartMessageFont,fontSize:O.dataLoadErrorMessageFontSize||q.baseChartMessageFontSize},f=new ia(b,q.dataLoadErrorMessage,a),n=s.hasNativeMessage=!0):s.stallLoad?(a._chartMessageStyle={fontFamily:O.dataLoadStartMessageFont||q.baseChartMessageFont,fontSize:O.dataLoadStartMessageFontSize||
q.baseChartMessageFontSize,color:O.dataLoadStartMessageColor||q.baseChartMessageColor},f=new ia(b,q.dataLoadStartMessage,a),n=s.hasNativeMessage=!0):(d.raiseEvent("internal.drawStart",{chartType:c,logicName:m.name,logicBase:m.base&&m.base.name,defaultSeriesType:m.defaultSeriesType},a),l=a.jsVars&&a.jsVars.themeObject&&a.jsVars.themeObject.getThemedJSONData()||a.getChartData(d.dataFormats.JSON,!0),A=l.data,l.error instanceof Error?(a._chartMessageStyle={fontFamily:O.dataInvalidMessageFont||q.baseChartMessageFont,
fontSize:O.dataInvalidMessageFontSize||q.baseChartMessageFontSize,color:O.dataInvalidMessageColor||q.baseChartMessageColor},f=new ia(b,q.dataInvalidMessage,a),n=s.hasNativeMessage=!0,a.__state.dataReady=!1,g||d.raiseEvent("dataInvalid",{error:l.error},s.fcObj,void 0,function(){h.raiseEvent("dataxmlinvalid",{},a,[a.id])})):(g||h.raiseEvent("dataloaded",{},a,[a.id]),f=m.init(b,A,a,u),m.inited=!0,s.previousDrawCount=s.drawCount,s.drawCount+=1,0===f.series.length?(a._chartMessageStyle={fontFamily:O.dataEmptyMessageFont||
q.baseChartMessageFont,fontSize:O.dataEmptyMessageFontSize||q.baseChartMessageFontSize,color:O.dataEmptyMessageColor||q.baseChartMessageColor},f=new ia(b,q.dataEmptyMessage,a),n=s.hasNativeMessage=!0,a.__state.dataReady=!1,g||h.raiseEvent("nodatatodisplay",{},a,[a.id])):(a.__state.dataReady=!0,n=s.hasNativeMessage=!1,delete s.message)));f||(a._chartMessageStyle={fontFamily:q.baseChartMessageFont,fontSize:q.baseChartMessageFontSize,color:q.baseChartMessageColor},f=new ia(b,"Error rendering chart {0x01}",
a),n=s.hasNativeMessage=!0);n&&!m.inited&&m.init(b,A,a,u);f.chart=f.chart||{};f.credits=f.credits||{};f.credits.enabled=p&&!0===p.creditLabel?!0:!1;!1===k&&(f.chart.animation=!1,f.plotOptions||(f.plotOptions={}),f.plotOptions.series||(f.plotOptions.series={}),f.plotOptions.series.animation=!1);b.style&&(f.chart.containerBackgroundColor=h.getContainerBackgroundColor(a));return m.draw(f,u)};Z("base",{useScaleRecursively:!0,tooltipConstraint:"chart",rendererId:"root",canvasPaddingModifiers:["anchor",
"anchorlabel"],drawAnnotations:!0,draw:function(a,b){var c=this.renderer;c||(c=this.renderer=new Z("renderer."+this.rendererId));this.updateDefaultAnnotations();return c.init(this,a,b)},init:function(b,c,d){var e=this.chartInstance||d,f=e.jsVars;d=f._reflowData||(f._reflowData={});var k=f._reflowClean,s=e.options,l=s.args,A,p;this.dataObj=c=g({},c);p=c.chart=c.chart||c.graph||c.map||{};delete c.graph;delete c.map;d&&!this.stateless&&(A=d.hcJSON,delete d.hcJSON,g(this,d,!0),this.preReflowAdjustments&&
this.preReflowAdjustments.call(this),d.hcJSON=A);this.containerElement=b;this.config={};this.smartLabel=f.smartLabel;this.smartLabel.useEllipsesOnOverflow(a(p.useellipseswhenoverflow,p.useellipsewhenoverflow,1));this.colorManager=new h.colorManager(c,this);this.linkClickFN=ca(c,e);this.numberFormatter=new O(c.chart,this);if(!this.standaloneInit)return e._chartMessageStyle={fontFamily:l.typeNotSupportedMessageFont||s.baseChartMessageFont,fontSize:l.typeNotSupportedMessageFontSize||s.baseChartMessageFontSize,
color:l.typeNotSupportedMessageColor||s.baseChartMessageColor},new h.createDialog(b,s.typeNotSupportedMessage,e);b=this.chart(b.offsetWidth||parseFloat(b.style.width),b.offsetHeight||parseFloat(b.style.height),e);d&&!this.stateless&&(d.hcJSON&&g(b,d.hcJSON,!0),this.postReflowAdjustments&&this.postReflowAdjustments.call(this),k&&this.cleanedData&&(this.cleanedData(this,k),this.cleanedData(d,k)));return b},postSpaceManager:function(){var b=this.hcJSON,c=b._FCconf,d=b.chart,e=d.marginLeft,f=d.spacingLeft,
k=d.spacingRight,g=c.width-e-d.marginRight,h=b.title,b=b.subtitle,s=c.width,l=h.align,c=h.x,A=h.horizontalPadding,p=h.alignWithCanvas,m=(da(e)||0)+a(g,s)/2,e=this.snapLiterals||(this.snapLiterals={}),g=h._captionWidth,n=b._subCaptionWidth,q=h._lineHeight,O=b._lineHeight,u=h.text;if(void 0===c){switch(l){case pa:c=p?s-d.marginRight-A:s-A;break;case za:c=p?d.marginLeft+A:A;break;default:c=p?m:f+.5*(s-f-k)||s/2}h.align===za?(k=f=0,h.align="start"):h.align===pa?(f=g,k=n,h.align="end"):(f=g/2,k=n/2,h.align=
"middle");h.x=c;h.y=h.y||d.spacingTop||0;b.y=u?h.y+q+2:h.y||d.spacingTop||0;e.captionstartx=c-f-2;e.captionwidth=g+4;e.captionendx=e.captionstartx+e.captionwidth;e.captionstarty=h.y||0;e.captionheight=q+2;e.captionendy=e.captionstarty+e.captionheight;e.subcaptionstartx=c-k-2;e.subcaptionwidth=n+4;e.subcaptionendx=e.subcaptionstartx+e.subcaptionwidth;e.subcaptionstarty=b.y||0;e.subcaptionheight=O+2;e.subcaptionendy=e.subcaptionstarty+e.subcaptionheight}},chart:function(c,v){var C=this.name,h=this.dataObj,
f=h.chart,s=this.colorManager,l,m,n,q,O,t,ca,z=this.defaultSeriesType,Q,E,ia,qa,F,N,ma,I,S,ra,ha,Qa,Ka,V,Bb,Ta,Ya,gb,sb,xb,ga,Ob,wb,Lb,Z,Y,ac,da,Ib,Pb,oa,aa,ja,xa,ba,ea,ua,Ha,Ma,hb,pb,eb,dc,vb,Za,Db,Ua,tb,ab,Vb,ec,Oa,Gb,nb,wa,bb,mb,ob,Xa,Eb,rc,sc,wc,ub,ib,Cc,Wb,Ga,Yb,yc,Ub,Xb,Tb,qc,Jb,Zb,ta,Rb,Jc,Ea,Sb,lb,zb,Ab,$b,ic,rb,hc,mc,hd,db,nc,yb,Ra,Kb,Pc,Uc,cd,oc;l=Sa(h,c,v,this);S=l.chart;I=l.xAxis;Q=l[B];this.snapLiterals||(this.snapLiterals={});ha=this.snapLiterals;ha.chartstartx=0;ha.chartstarty=0;ha.chartwidth=
c;ha.chartheight=v;ha.chartendx=c;ha.chartendy=v;ha.chartcenterx=c/2;ha.chartcentery=v/2;ha.chartbottommargin=S.spacingBottom;ha.chartleftmargin=S.spacingLeft;ha.chartrightmargin=S.spacingRight;ha.charttopmargin=S.spacingTop;this.updateSnapPoints&&this.updateSnapPoints();this.postHCJSONCreation&&this.postHCJSONCreation.call(this,l);d.raiseEvent("internal.postlogic",this,this.chartInstance);l.labels.smartLabel=t=Q.smartLabel=this.smartLabel;Q.width=c;Q.height=v;ia=l.plotOptions;Q.isDual=this.isDual;
Q.numberFormatter=this.numberFormatter;Q.axisGridManager=new A(z,f);Q.tooltext=f.plottooltext;Q.trendLineToolText=f.trendlinetooltext;S.is3D=m=Q.is3d=/3d$/.test(z);S.isBar=E=Q.isBar=this.isBar;ca=/^pie/.test(z);ma=1==f.useroundedges;N=m?ya.chart3D:ya.chart2D;S.events.click=l.plotOptions.series.point.events.click=this.linkClickFN;S.defaultSeriesType=z;Ta=0<f.palette&&6>f.palette?f.palette:a(this.paletteIndex,1);Ta-=1;S.paletteIndex=Ta;S.usePerPointLabelColor=f.colorlabelsfromplot==$a;S.syncLabelWithAnchor=
a(f.synclabelwithanchoronhover,1);S.useRoundEdges=ma&&!m&&!this.distributedColumns&&"pie"!==this.defaultSeriesType;void 0!==b(f.clickurl)&&(S.link=f.clickurl,S.style.cursor="pointer",l.plotOptions.series.point.events.click=function(){S.events.click.call({link:f.clickurl})});Ya=b(f.basefont,"Verdana,sans");gb=T(f.basefontsize,10);sb=b(f.basefontcolor,s.getColor(N.baseFontColor));xb=b(f.outcnvbasefont,Ya);ga=T(f.outcnvbasefontsize,gb);Ob=ga+Ba;wb=b(f.outcnvbasefontcolor,sb).replace(/^#?([a-f0-9]+)/ig,
"#$1");Y=gb;gb+=Ba;sb=sb.replace(/^#?([a-f0-9]+)/ig,"#$1");Q.trendStyle=Q.outCanvasStyle={fontFamily:xb,color:wb,fontSize:Ob};Lb=M(Q.trendStyle);Q.inCanvasStyle={fontFamily:Ya,fontSize:gb,color:sb};Z=M(Q.inCanvasStyle);Q.divlineStyle={fontFamily:Ya,fontSize:gb,color:sb,lineHeight:Z};I.labels.style={fontFamily:b(f.labelfont,xb),fontSize:a(f.labelfontsize,ga)+Ba,color:b(f.labelfontcolor,wb)};I.labels.style.lineHeight=M(I.labels.style);I.steppedLabels.style={fontFamily:xb,fontSize:Ob,lineHeight:Lb,color:wb,
visibility:"hidden"};l.yAxis[0].labels.style={fontFamily:xb,fontSize:Ob,lineHeight:Lb,color:wb};l.yAxis[1].labels.style={fontFamily:xb,fontSize:Ob,lineHeight:Lb,color:wb};da=b(f.legenditemfont,xb);Ib=T(f.legenditemfontsize,ga);Pb=b(f.legenditemfontcolor,wb).replace(/^#?([a-f0-9]+)/ig,"#$1");oa=Ja[a(f.legenditemfontbold,0)]||"";ac=T(f.legendcaptionfontsize,ga)+Ba;Ib+=Ba;l.legend.itemStyle={fontFamily:da,fontSize:Ib,color:Pb,fontWeight:oa};M(l.legend.itemStyle);l.legend.itemHiddenStyle={fontFamily:da,
fontSize:Ib,color:b(f.legenditemhiddencolor,"cccccc").replace(/^#?([a-f0-9]+)/ig,"#$1"),fontWeight:oa};M(l.legend.itemHiddenStyle);l.legend.itemHoverStyle={color:b(f.legenditemhoverfontcolor,Pb).replace(/^#?([a-f0-9]+)/ig,"#$1")};l.legend.title.style={fontFamily:b(f.legendcaptionfont,da),fontSize:ac,color:b(f.legendcaptionfontcolor,wb).replace(/^#?([a-f0-9]+)/ig,"#$1"),fontWeight:Ja[a(f.legendcaptionfontbold,1)]||""};M(l.legend.title.style);l.legend.title.align=Qb[f.legendcaptionalignment&&f.legendcaptionalignment.toLowerCase()||
La]||Qb.center;ra=(ra=w(f.valuebordercolor,p))?G(ra,a(f.valueborderalpha,f.valuealpha,100)):p;l.plotOptions.series.dataLabels.style={fontFamily:b(f.valuefont,Ya),fontSize:b(f.valuefontsize,parseInt(gb,10))+Ba,lineHeight:Z,color:G(b(f.valuefontcolor,sb),a(f.valuefontalpha,f.valuealpha,100)),fontWeight:a(f.valuefontbold)?"bold":"normal",fontStyle:a(f.valuefontitalic)?"italic":"normal",border:ra||f.valuebgcolor?a(f.valueborderthickness,1)+"px solid":"",borderColor:ra,borderThickness:a(f.valueborderthickness,
1),borderPadding:a(f.valueborderpadding,2),borderRadius:a(f.valueborderradius,0),backgroundColor:f.valuebgcolor?G(f.valuebgcolor,a(f.valuebgalpha,f.valuealpha,100)):p,borderDash:a(f.valueborderdashed,0)?e(a(f.valueborderdashlen,4),a(f.valueborderdashgap,2),a(f.valueborderthickness,1)):void 0};M(l.plotOptions.series.dataLabels.style);l.plotOptions.series.dataLabels.color=l.plotOptions.series.dataLabels.style.color;l.tooltip.style={fontFamily:Ya,fontSize:gb,lineHeight:Z,color:sb};l.title.style={fontFamily:b(f.captionfont,
xb),color:b(f.captionfontcolor,wb).replace(/^#?([a-f0-9]+)/ig,"#$1"),fontSize:a(f.captionfontsize,ga+3)+Ba,fontWeight:0===a(f.captionfontbold)?"normal":"bold"};l.title.align=b(f.captionalignment,La);l.title.isOnTop=a(f.captionontop,1);l.title.alignWithCanvas=a(f.aligncaptionwithcanvas,this.alignCaptionWithCanvas,1);l.title.horizontalPadding=a(f.captionhorizontalpadding,l.title.alignWithCanvas?0:15);M(l.title.style);l.subtitle.style={fontFamily:b(f.subcaptionfont,f.captionfont,xb),color:b(f.subcaptionfontcolor,
f.captionfontcolor,wb).replace(/^#?([a-f0-9]+)/ig,"#$1"),fontSize:a(f.subcaptionfontsize,a(U(a(f.captionfontsize)-3,-1),ga)+a(this.subTitleFontSizeExtender,1))+Ba,fontWeight:0===a(f.subcaptionfontbold,this.subTitleFontWeight,f.captionfontbold)?"normal":"bold"};l.subtitle.align=l.title.align;l.subtitle.isOnTop=l.title.isOnTop;l.subtitle.alignWithCanvas=l.title.alignWithCanvas;l.subtitle.horizontalPadding=l.title.horizontalPadding;M(l.subtitle.style);ra=(ra=w(f.xaxisnamebordercolor,p))?G(ra,a(f.xaxisnameborderalpha,
f.xaxisnamealpha,100)):p;I.title.style={fontFamily:b(f.xaxisnamefont,xb),fontSize:b(f.xaxisnamefontsize,parseInt(Ob,10))+Ba,color:G(b(f.xaxisnamefontcolor,wb),a(f.xaxisnamefontalpha,f.xaxisnamealpha,100)),fontWeight:a(f.xaxisnamefontbold,1)?"bold":"normal",fontStyle:a(f.xaxisnamefontitalic)?"italic":"normal",border:ra||f.xaxisnamebgcolor?a(f.xaxisnameborderthickness,1)+"px solid":void 0,borderColor:ra,borderThickness:a(f.xaxisnameborderthickness,1),borderPadding:a(f.xaxisnameborderpadding,2),borderRadius:a(f.xaxisnameborderradius,
0),backgroundColor:f.xaxisnamebgcolor?G(f.xaxisnamebgcolor,a(f.xaxisnamebgalpha,f.xaxisnamealpha,100)):p,borderDash:a(f.xaxisnameborderdashed,0)?e(a(f.xaxisnameborderdashlen,4),a(f.xaxisnameborderdashgap,2),a(f.xaxisnameborderthickness,1)):void 0};M(I.title.style);ra=(ra=b(f.pyaxisnamebordercolor,f.yaxisnamebordercolor,p))?G(ra,a(f.pyaxisnameborderalpha,f.yaxisnameborderalpha,f.pyaxisnamealpha,f.yaxisnamealpha,100)):p;l.yAxis[0].title.style={fontFamily:b(f.pyaxisnamefont,f.yaxisnamefont,xb),fontSize:b(f.pyaxisnamefontsize,
f.yaxisnamefontsize,parseInt(Ob,10))+Ba,color:G(b(f.pyaxisnamefontcolor,f.yaxisnamefontcolor,wb),a(f.pyaxisnamefontalpha,f.yaxisnamefontalpha,f.pyaxisnamealpha,f.yaxisnamealpha,100)),fontWeight:a(f.pyaxisnamefontbold,f.yaxisnamefontbold,1)?"bold":"normal",fontStyle:a(f.pyaxisnamefontitalic,f.yaxisnamefontitalic)?"italic":"normal",border:ra||f.pyaxisnamebgcolor||f.yaxisnamebgcolor?a(f.pyaxisnameborderthickness,f.yaxisnameborderthickness,1)+"px solid":void 0,borderColor:ra,borderThickness:a(f.pyaxisnameborderthickness,
f.yaxisnameborderthickness,1),borderPadding:a(f.pyaxisnameborderpadding,f.yaxisnameborderpadding,2),borderRadius:a(f.pyaxisnameborderradius,f.yaxisnameborderradius,0),backgroundColor:f.pyaxisnamebgcolor||f.yaxisnamebgcolor?G(b(f.pyaxisnamebgcolor,f.yaxisnamebgcolor),a(f.pyaxisnamebgalpha,f.yaxisnamebgalpha,f.pyaxisnamealpha,f.yaxisnamealpha,100)):p,borderDash:a(f.pyaxisnameborderdashed,f.yaxisnameborderdashed,0)?e(a(f.pyaxisnameborderdashlen,f.yaxisnameborderdashlen,4),a(f.pyaxisnameborderdashgap,
f.yaxisnameborderdashgap,2),a(f.pyaxisnameborderthickness,f.yaxisnameborderthickness,1)):void 0};M(l.yAxis[0].title.style);l.yAxis[1].title.style={fontFamily:xb,color:wb,fontSize:Ob,lineHeight:void 0,fontWeight:"bold"};ra=(ra=b(f.syaxisnamebordercolor,f.yaxisnamebordercolor,p))?G(ra,a(f.syaxisnameborderalpha,f.yaxisnameborderalpha,f.syaxisnamealpha,f.yaxisnamealpha,100)):p;l.yAxis[1].title.style={fontFamily:b(f.syaxisnamefont,f.yaxisnamefont,xb),fontSize:b(f.syaxisnamefontsize,f.yaxisnamefontsize,
parseInt(Ob,10))+Ba,color:G(b(f.syaxisnamefontcolor,f.yaxisnamefontcolor,wb),a(f.syaxisnamefontalpha,f.yaxisnamefontalpha,f.syaxisnamealpha,f.yaxisnamealpha,100)),fontWeight:a(f.syaxisnamefontbold,f.yaxisnamefontbold,1)?"bold":"normal",fontStyle:a(f.syaxisnamefontitalic,f.yaxisnamefontitalic)?"italic":"normal",border:ra||f.syaxisnamebgcolor||f.yaxisnamebgcolor?a(f.syaxisnameborderthickness,f.yaxisnameborderthickness,1)+"px solid":void 0,borderColor:ra,borderThickness:a(f.syaxisnameborderthickness,
f.yaxisnameborderthickness,1),borderPadding:a(f.syaxisnameborderpadding,f.yaxisnameborderpadding,2),borderRadius:a(f.syaxisnameborderradius,f.yaxisnameborderradius,0),backgroundColor:f.syaxisnamebgcolor||f.yaxisnamebgcolor?G(b(f.syaxisnamebgcolor,f.yaxisnamebgcolor),a(f.syaxisnamebgalpha,f.yaxisnamebgalpha,f.syaxisnamealpha,f.yaxisnamealpha,100)):p,borderDash:a(f.syaxisnameborderdashed,f.yaxisnameborderdashed,0)?e(a(f.syaxisnameborderdashlen,f.yaxisnameborderdashlen,4),a(f.syaxisnameborderdashgap,
f.yaxisnameborderdashgap,2),a(f.syaxisnameborderthickness,f.yaxisnameborderthickness,1)):void 0};M(l.yAxis[1].title.style);S.overlapColumns=a(f[E&&"overlapbars"||"overlapcolumns"],m?0:1);l.orphanStyles={defaultStyle:{style:g({},Q.inCanvasStyle)},connectorlabels:{style:g({},l.plotOptions.series.dataLabels)},vyaxisname:{style:g({},l.yAxis[0].title.style)}};l.plotOptions.series.dataLabels.tlLabelStyle={fontFamily:P(f.tlfont,Ya),color:H(P(f.tlfontcolor,sb)),fontSize:T(f.tlfontsize,Y)+"px"};M(l.plotOptions.series.dataLabels.tlLabelStyle);
l.plotOptions.series.dataLabels.trLabelStyle={fontFamily:P(f.trfont,Ya),color:H(P(f.trfontcolor,sb)),fontSize:T(f.trfontsize,Y)+"px"};M(l.plotOptions.series.dataLabels.trLabelStyle);l.plotOptions.series.dataLabels.blLabelStyle={fontFamily:P(f.blfont,Ya),color:H(P(f.blfontcolor,sb)),fontSize:T(f.blfontsize,Y)+"px"};M(l.plotOptions.series.dataLabels.blLabelStyle);l.plotOptions.series.dataLabels.brLabelStyle={fontFamily:P(f.brfont,Ya),color:H(P(f.brfontcolor,sb)),fontSize:T(f.brfontsize,Y)+"px"};M(l.plotOptions.series.dataLabels.brLabelStyle);
this.parseStyles(l);delete l.xAxis.labels.style.backgroundColor;delete l.xAxis.labels.style.borderColor;delete l.yAxis[0].labels.style.backgroundColor;delete l.yAxis[0].labels.style.borderColor;delete l.yAxis[1].labels.style.backgroundColor;delete l.yAxis[1].labels.style.borderColor;Q.showTooltip=a(f.showtooltip,this.showtooltip,1);Q.tooltipSepChar=b(f.tooltipsepchar,this.tooltipsepchar,Cb);Q.showValues=a(f.showvalues,this.showValues,1);Q.seriesNameInToolTip=a(f.seriesnameintooltip,1);Q.showVLines=
a(f.showvlines,1);Q.showVLinesOnTop=a(f.showvlinesontop,0);Q.showVLineLabels=a(f.showvlinelabels,this.showVLineLabels,1);Q.showVLineLabelBorder=a(f.showvlinelabelborder,1);Q.rotateVLineLabels=a(f.rotatevlinelabels,0);Q.vLineColor=b(f.vlinecolor,"333333");Q.vLineLabelColor=b(f.vlinelabelcolor);Q.vLineThickness=b(f.vlinethickness,1);Q.vLineAlpha=a(f.vlinealpha,80);Q.vLineLabelBgColor=b(f.vlinelabelbgcolor,"ffffff");Q.vLineLabelBgAlpha=a(f.vlinelabelbgalpha,m?50:100);Q.trendlineColor=b(f.trendlinecolor,
"333333");Q.trendlineThickness=b(f.trendlinethickness,1);Q.trendlineAlpha=a(f.trendlinealpha);Q.showTrendlinesOnTop=b(f.showtrendlinesontop,0);Q.trendlineValuesOnOpp=b(f.trendlinevaluesonopp,f.trendlinevaluesonright,0);Q.trendlinesAreDashed=a(f.trendlinesaredashed,0);Q.trendlinesDashLen=a(f.trendlinedashlen,5);Q.trendlinesDashGap=a(f.trendlinedashgap,2);Q.showTrendlines=a(f.showtrendlines,1);Q.showTrendlineLabels=a(f.showtrendlinelabels,this.showTrendlineLabels,1);Q.flatScrollBars=a(f.flatscrollbars,
0);Q.scrollBar3DLighting=a(f.scrollbar3dlighting,1);S.anchorTrackingRadius=a(f.anchortrackingradius,va?X:u);l.plotOptions.series.connectNullData=a(f.connectnulldata,0);S.backgroundColor={FCcolor:{color:b(f.bgcolor,s.getColor(N.bgColor)),alpha:b(f.bgalpha,s.getColor(N.bgAlpha)),angle:b(f.bgangle,s.getColor(N.bgAngle)),ratio:b(f.bgratio,s.getColor(N.bgRatio))}};S.rotateValues=a(f.rotatevalues,0);S.placeValuesInside=a(f.placevaluesinside,0);S.valuePosition=b(f.valueposition,"auto");S.valuePadding=a(f.valuepadding,
2);S.managePlotOverflow=a(f.manageplotoverflow,1);S.borderColor=G(b(f.bordercolor,m?"#666666":s.getColor("borderColor")),b(f.borderalpha,m?"100":s.getColor("borderAlpha")));qa=a(f.showborder,m?0:1);S.borderWidth=qa?a(f.borderthickness,1):0;S.borderRadius=a(f.borderradius,0);S.borderDashStyle=a(f.borderdashed,0)?e(a(f.borderdashlen,4),a(f.borderdashgap,2),S.borderWidth):void 0;S.plotBorderColor=G(b(f.canvasbordercolor,s.getColor("canvasBorderColor")),b(f.canvasborderalpha,s.getColor("canvasBorderAlpha")));
"0"!==f.showcanvasborder&&(F=Boolean(b(f.canvasborderthickness,ma?0:1)),"1"!==f.showaxislines&&"1"!==f.showxaxisline&&"1"!==f.showyaxisline&&"1"!==f.showsyaxisline||"1"===f.showcanvasborder||(F=0));S.plotBorderWidth=m||!F?0:a(f.canvasborderthickness,this.canvasborderthickness,S.useRoundEdges?1:2);S.bgSWF=b(f.bgimage,f.bgswf);S.bgSWFAlpha=a(f.bgimagealpha,f.bgswfalpha,100);aa=b(f.bgimagedisplaymode,"none").toLowerCase();ja=P(f.bgimagevalign,p).toLowerCase();xa=P(f.bgimagehalign,p).toLowerCase();"tile"==
aa||"fill"==aa||"fit"==aa?(ja!=Ca&&"middle"!=ja&&ja!=na&&(ja="middle"),xa!=za&&"middle"!=xa&&xa!=pa&&(xa="middle")):(ja!=Ca&&"middle"!=ja&&ja!=na&&(ja=Ca),xa!=za&&"middle"!=xa&&xa!=pa&&(xa=za));S.bgImageDisplayMode=aa;S.bgImageVAlign=ja;S.bgImageHAlign=xa;S.bgImageScale=a(f.bgimagescale,100);S.logoURL=P(f.logourl);S.logoPosition=b(f.logoposition,"tl").toLowerCase();S.logoAlpha=a(f.logoalpha,100);S.logoLink=P(f.logolink);S.logoScale=a(f.logoscale,100);S.logoLeftMargin=a(f.logoleftmargin,0);S.logoTopMargin=
a(f.logotopmargin,0);ba=S.toolbar={button:{}};ea=ba.button;ea.scale=a(f.toolbarbuttonscale,1.15);ea.width=a(f.toolbarbuttonwidth,15);ea.height=a(f.toolbarbuttonheight,15);ea.radius=a(f.toolbarbuttonradius,2);ea.spacing=a(f.toolbarbuttonspacing,5);ea.fill=G(b(f.toolbarbuttoncolor,"ffffff"));ea.labelFill=G(b(f.toolbarlabelcolor,"cccccc"));ea.symbolFill=G(b(f.toolbarsymbolcolor,"ffffff"));ea.hoverFill=G(b(f.toolbarbuttonhovercolor,"ffffff"));ea.stroke=G(b(f.toolbarbuttonbordercolor,"bbbbbb"));ea.symbolStroke=
G(b(f.toolbarsymbolbordercolor,"9a9a9a"));ea.strokeWidth=a(f.toolbarbuttonborderthickness,1);ea.symbolStrokeWidth=a(f.toolbarsymbolborderthickness,1);ua=ea.symbolPadding=a(f.toolbarsymbolpadding,5);ea.symbolHPadding=a(f.toolbarsymbolhpadding,ua);ea.symbolVPadding=a(f.toolbarsymbolvpadding,ua);Ha=ba.position=b(f.toolbarposition,"tr").toLowerCase();switch(Ha){case "tr":case "rt":case "top right":case "right top":Ha="tr";break;case "br":case "rb":case "bottom right":case "right bottom":Ha="br";break;
case "tl":case "lt":case "top left":case "left top":Ha="tl";break;case "bl":case "lb":case "bottom left":case "left bottom":Ha="bl";break;default:Ha="tr"}Ma=ba.hAlign="left"===(p+f.toolbarhalign).toLowerCase()?"l":Ha.charAt(1);hb=ba.vAlign="bottom"===(p+f.toolbarvalign).toLowerCase()?"b":Ha.charAt(0);ba.hDirection=a(f.toolbarhdirection,"r"===Ma?-1:1);ba.vDirection=a(f.toolbarvdirection,"b"===hb?-1:1);ba.vMargin=a(f.toolbarvmargin,6);ba.hMargin=a(f.toolbarhmargin,10);ba.x=a(f.toolbarx,"l"===Ma?0:c);
ba.y=a(f.toolbary,"t"===hb?0:v);pb=b(f.divlinecolor,s.getColor(N.divLineColor));eb=b(f.divlinealpha,m?s.getColor("divLineAlpha3D"):s.getColor("divLineAlpha"));dc=a(f.divlinethickness,1);vb=Boolean(a(f.divlinedashed,f.divlineisdashed,this.divLineIsDashed,0));Za=a(f.divlinedashlen,4);Db=a(f.divlinedashgap,2);l.yAxis[0].gridLineColor=G(pb,eb);l.yAxis[0].gridLineWidth=dc;l.yAxis[0].gridLineDashStyle=vb?e(Za,Db,dc):"none";l.yAxis[0].alternateGridColor=E?G(b(f.alternatevgridcolor,s.getColor("altVGridColor")),
1===a(f.showalternatevgridcolor,1)?b(f.alternatevgridalpha,s.getColor("altVGridAlpha")):Da):G(b(f.alternatehgridcolor,s.getColor("altHGridColor")),"0"===f.showalternatehgridcolor?0:b(f.alternatehgridalpha,s.getColor("altHGridAlpha")));Eb=a(f.vdivlinethickness,1);rc=Boolean(a(f.vdivlinedashed,f.vdivlineisdashed,0));sc=a(f.vdivlinedashlen,4);wc=a(f.vdivlinedashgap,2);I.gridLineColor=G(b(f.vdivlinecolor,s.getColor(N.divLineColor)),b(f.vdivlinealpha,s.getColor("divLineAlpha")));I.gridLineWidth=Eb;I.gridLineDashStyle=
rc?e(sc,wc,Eb):"none";I.alternateGridColor=G(b(f.alternatevgridcolor,s.getColor("altVGridColor")),"1"===f.showalternatehgridcolor?b(f.alternatevgridalpha,s.getColor("altVGridAlpha")):0);tb=b(f.canvasbgcolor,s.getColor(N.canvasBgColor));Vb=b(f.canvasbgalpha,s.getColor("canvasBgAlpha"));b(f.showcanvasbg,$a)==Da&&(Vb="0");l.plotOptions.series.shadow=a(f.showshadow,f.showcolumnshadow,this.defaultPlotShadow,s.getColor("showShadow"));this.inversed&&(l.yAxis[0].reversed=!0,l.yAxis[1].reversed=!0);this.isStacked&&
(this.distributedColumns?(Q.showStackTotal=Boolean(a(f.showsum,1)),O=a(f.usepercentdistribution,1),Ua=a(f.showpercentvalues,0),ab=a(f.showpercentintooltip,O,0),Q.showXAxisPercentValues=a(f.showxaxispercentvalues,1)):(Q.showStackTotal=Boolean(a(this.showSum,f.showsum,0)),O=a(this.stack100percent,f.stack100percent,0),Ua=a(f.showpercentvalues,O,0),ab=a(f.showpercentintooltip,Ua)),Q.showPercentValues=Ua,Q.showPercentInToolTip=ab,O?(Q.isValueAbs=!0,ia[z].stacking="percent",Q[0].stacking100Percent=!0):
ia[z].stacking="normal");this.isDual&&("0"===f.primaryaxisonleft&&(l.yAxis[0].opposite=!0,l.yAxis[1].opposite=!1),l.yAxis[0].showAlways=!0,l.yAxis[1].showAlways=!0);S.useRoundEdges&&(l.plotOptions.series.shadow=a(f.showshadow,f.showcolumnshadow,1),l.plotOptions.series.borderRadius=1,l.tooltip.style.borderRadius="2px",S.plotBorderRadius=3,F||(S.plotBorderWidth=0),S.plotShadow=l.plotOptions.series.shadow?{enabled:!0,opacity:Vb/100}:0);1===a(f.use3dlighting,1)&&(l.legend.lighting3d=!0);l.plotOptions.series.userMaxColWidth=
E?f.maxbarheight:a(f.maxcolwidth,this.maxColWidth);l.plotOptions.series.maxColWidth=ka(a(l.plotOptions.series.userMaxColWidth,50))||1;l.title.text=L(f.caption);l.subtitle.text=L(f.subcaption);0===a(f.showtooltip,this.showtooltip)&&(l.tooltip.enabled=!1);ec=l.tooltip.style;ec.backgroundColor=G(b(ec.backgroundColor,f.tooltipbgcolor,s.getColor("toolTipBgColor")),b(f.tooltipbgalpha,100));ec.borderColor=G(b(ec.borderColor,f.tooltipbordercolor,s.getColor("toolTipBorderColor")),b(f.tooltipborderalpha,100));
l.tooltip.shadow=a(f.showtooltipshadow,f.showshadow,1)?{enabled:!0,opacity:U(a(f.tooltipbgalpha,100),a(f.tooltipborderalpha,100))/100}:!1;l.tooltip.constrain=a(f.constraintooltip,1);ec.borderWidth=a(f.tooltipborderthickness,1)+"px";f.tooltipborderradius&&(ec.borderRadius=a(f.tooltipborderradius,1)+"px");ec.padding=a(f.tooltippadding,this.tooltippadding,3)+"px";f.tooltipcolor&&(ec.color=H(f.tooltipcolor));Q.userPlotSpacePercent=l.plotOptions.series.userPlotSpacePercent=f.plotspacepercent;Oa=a(f.plotspacepercent,
20)%100;Q.plotSpacePercent=l.plotOptions.series.groupPadding=Oa/200;m&&!ca?(S.series2D3Dshift="mscombi3d"===C?!0:Boolean(a(f.use3dlineshift,0)),S.canvasBaseColor3D=b(f.canvasbasecolor,s.getColor("canvasBaseColor3D")),S.canvasBaseDepth=a(f.canvasbasedepth,10),S.canvasBgDepth=a(f.canvasbgdepth,3),S.showCanvasBg=Boolean(a(f.showcanvasbg,1)),S.showCanvasBase=Boolean(a(f.showcanvasbase,1)),E?(S.xDepth=5,S.yDepth=5,S.showCanvasBg&&(Q.marginTopExtraSpace+=S.canvasBgDepth),Q.marginLeftExtraSpace+=S.yDepth+
(S.showCanvasBase?S.canvasBaseDepth:0),Q.marginBottomExtraSpace+=5):(S.xDepth=10,S.yDepth=10,S.showCanvasBg&&(Q.marginRightExtraSpace+=S.canvasBgDepth),Q.marginBottomExtraSpace+=S.yDepth+(S.showCanvasBase?S.canvasBaseDepth:0)),tb=tb.split(Fa)[0],Vb=Vb.split(Fa)[0],S.use3DLighting=Boolean(a(f.use3dlighting,1)),S.plotBackgroundColor=S.use3DLighting?{FCcolor:{color:J(tb,85)+Fa+W(tb,55),alpha:Vb+Fa+Vb,ratio:Wa,angle:k(c-(S.marginLeft+S.marginRight),v-(S.marginTop+S.marginBottom),1)}}:G(tb,Vb),S.canvasBgColor=
G(J(tb,80),Vb),n=b(f.zeroplanecolor,f.divlinecolor,s.getColor(N.divLineColor)),q=b(f.zeroplanealpha,f.divlinealpha,s.getColor("divLineAlpha")),S.zeroPlaneColor=G(n,q),S.zeroPlaneBorderColor=G(b(f.zeroplanebordercolor,n),a(f.zeroplaneshowborder,1)?q:0),S.zeroPlaneShowBorder=a(f.zeroplaneshowborder,1)):(S.is3D=!1,S.plotBackgroundColor={FCcolor:{color:tb,alpha:Vb,angle:b(f.canvasbgangle,s.getColor("canvasBgAngle")),ratio:b(f.canvasbgratio,s.getColor("canvasBgRatio"))}});this.parseExportOptions(l);this.parseHoverEffectOptions(S);
this.preSeriesAddition&&this.preSeriesAddition(l,h,c,v);this.series&&this.series(h,l,C,c,v);this.postSeriesAddition(l,h,c,v);this.spaceManager(l,h,c,v);this.postSpaceManager&&this.postSpaceManager(l,h,c,v);Gb=a(f.drawquadrant,0);Q.isXYPlot&&Gb&&(nb=I.min,wa=I.max,bb=l.yAxis[0].min,mb=l.yAxis[0].max,ob=a(f.quadrantxval,(nb+wa)/2),Xa=a(f.quadrantyval,(bb+mb)/2),Xa>=bb&&Xa<=mb&&ob>=nb&&ob<=wa&&(ub=G(b(f.quadrantlinecolor,S.plotBorderColor),b(f.quadrantlinealpha,Na)),ib=a(f.quadrantlinethickness,S.plotBorderWidth),
Cc=a(f.quadrantlinedashed,f.quadrantlineisdashed,0),Wb=a(f.quadrantlinedashLen,4),Ga=a(f.quadrantlinedashgap,2),Yb=P(f.quadrantlabeltl,p),yc=P(f.quadrantlabeltr,p),Ub=P(f.quadrantlabelbl,p),Xb=P(f.quadrantlabelbr,p),Tb=a(f.quadrantlabelpadding,3),qc=Cc?e(Wb,Ga,ib):"none",I.plotLines.push({color:ub,value:ob,width:ib,dashStyle:qc,zIndex:3}),l.yAxis[0].plotLines.push({color:ub,value:Xa,width:ib,dashStyle:qc,zIndex:3}),Jb=c-S.marginRight-S.marginLeft,Zb=v-S.marginTop-S.marginBottom,lb=Q.inCanvasStyle,
ta=Jb/(wa-nb)*(ob-nb),Rb=Jb-ta,Ea=Zb/(mb-bb)*(Xa-bb),Jc=Zb-Ea,ta-=Tb,Rb-=Tb,Jc-=Tb,Ea-=Tb,zb=Tb+Ba,Ab=Zb-Tb+Ba,$b=Tb+Ba,ic=Jb-Tb+Ba,t.setStyle(lb),0<Jc&&(Yb!==p&&0<ta&&(Sb=t.getSmartText(Yb,ta,Jc),l.labels.items.push({html:Sb.text,zIndex:3,vAlign:Ca,style:{left:$b,top:zb,fontSize:lb.fontSize,lineHeight:lb.lineHeight,fontFamily:lb.fontFamily,color:lb.color}})),yc!==p&&0<Rb&&(Sb=t.getSmartText(yc,Rb,Jc),l.labels.items.push({html:Sb.text,textAlign:pa,vAlign:Ca,zIndex:3,style:{left:ic,top:zb,fontSize:lb.fontSize,
lineHeight:lb.lineHeight,fontFamily:lb.fontFamily,color:lb.color}}))),0<Ea&&(Ub!==p&&0<ta&&(Sb=t.getSmartText(Ub,ta,Ea),l.labels.items.push({html:Sb.text,vAlign:na,zIndex:3,style:{left:$b,top:Ab,fontSize:lb.fontSize,lineHeight:lb.lineHeight,fontFamily:lb.fontFamily,color:lb.color}})),Xb!==p&&0<Rb&&(Sb=t.getSmartText(Xb,Rb,Ea),l.labels.items.push({html:Sb.text,textAlign:pa,vAlign:na,zIndex:3,style:{left:ic,top:Ab,fontSize:lb.fontSize,lineHeight:lb.lineHeight,fontFamily:lb.fontFamily,color:lb.color}})))));
if(this.hasVDivLine&&(rb=a(f.showvdivlines,0),hc=a(f.numvdivlines,0)+1,rb&&(hc=Q.x.catCount-1),1<hc)){db=I.min;nc=Q.x.catCount-1;yb=I.max;Kb=nc/hc;Pc=!0;Uc=db;I.scroll&&!isNaN(I.scroll.viewPortMax)&&(yb=I.scroll.viewPortMax);mc=b(f.vdivlinecolor,pb);hd=a(f.vdivlinealpha,eb);Eb=a(f.vdivlinethickness,dc);rc=a(f.vdivlinedashed,f.vdivlineisdashed,vb);sc=a(f.vdivlinedashlen,Za);wc=a(f.vdivlinedashgap,Db);(oc=a(f.showalternatevgridcolor,0))&&(cd=G(b(f.alternatevgridcolor,s.getColor("altVGridColor")),b(f.alternatevgridalpha,
s.getColor("altVGridAlpha"))));for(Ra=Kb;Ra<nc;Ra+=Kb,Pc=!Pc)Pc&&oc&&I.plotBands.push({isNumVDIV:!0,color:cd,from:Uc,to:Ra,zIndex:1}),I.plotLines.push({isNumVDIV:!0,width:Eb,color:G(mc,hd),dashStyle:rc?e(sc,wc,Eb):"none",value:Ra,zIndex:1}),Uc=Ra;Pc&&oc&&I.plotBands.push({isNumVDIV:!0,color:cd,from:Uc,to:yb,zIndex:1})}Qa=S.marginTop;Ka=S.marginBottom;V=S.marginLeft;Bb=S.marginRight;ha.canvasstartx=V;ha.canvasstarty=Qa;ha.canvasendx=c-Bb;ha.canvasendy=v-Ka;ha.canvaswidth=ha.canvasendx-ha.canvasstartx;
ha.canvasheight=ha.canvasendy-ha.canvasstarty;l.legend&&l.legend.enabled&&"vertical"===l.legend.layout&&(ha.legendstarty=Qa+.5*(Q.height-Ka-Qa-ha.legendheight)+(l.legend.y||0),ha.legendendy=ha.legendstarty+ha.legendheight);m&&S.xDepth>S.marginLeft&&(S.marginLeft=S.xDepth);D.console&&D.console.log&&D.FC_DEV_ENVIRONMENT&&console.log(l);return l},parseHoverEffectOptions:function(c){var d=this.dataObj.chart,e;c.showHoverEffect=d.showhovereffect;c.plotHoverEffect=a(d.plothovereffect,d.anchorhovereffect,
c.showHoverEffect);e=c.plotHoverEffects={enabled:c.plotHoverEffect};e.highlight=a(d.highlightonhover,d.highlightplotonhover,c.plotHoverEffect);e.columnHighlight=a(e.highlight,d.highlightcolumnonhover,d.highlightbaronhover);e.anchorHighlight=a(e.highlight,d.highlightanchoronhover);e.imageHighlight=a(e.highlight,d.highlightanchorimageonhover);e.anchorImageHoverAlpha=b(d.anchorimagehoveralpha);e.anchorImageHoverScale=b(d.anchorimagehoverscale);e.bubbleHighlight=a(e.highlight,d.highlightbubbleonhover);
e.color=b(d.plotfillhovercolor,d.columnhovercolor,d.barhovercolor,d.bubblehovercolor);e.alpha=b(d.plotfillhoveralpha,d.columnhoveralpha,d.barhoveralpha,d.bubblehoveralpha);e.scale=b(d.plothoverscale,d.columnhoverscale,d.barhoverscale,d.bubblehoverscale);e.gradientColor=d.plothovergradientcolor;e.ratio=d.plothoverratio;e.angle=d.plothoverangle;e.borderColor=d.plotborderhovercolor;e.borderAlpha=d.plotborderhoveralpha;e.borderThickness=d.plotborderhoverthickness;e.borderDashed=d.plotborderhoverdashed;
e.borderDashGap=d.plotborderhoverdashgap;e.borderDashLen=d.plotborderhoverdashlen;e.shadow=d.plothovershadow;e.anchorScale=d.anchorhoverscale;e.anchorSides=d.anchorhoversides;e.anchorRadius=d.anchorhoverradius;e.anchorAlpha=d.anchorhoveralpha;e.anchorBgColor=b(d.anchorbghovercolor,d.anchorhovercolor);e.anchorBgAlpha=d.anchorbghoveralpha;e.anchorBorderColor=d.anchorborderhovercolor;e.anchorBorderAlpha=d.anchorborderhoveralpha;e.anchorBorderThickness=d.anchorborderhoverthickness;e.anchorStartAngle=
d.anchorhoverstartangle;e.anchorDip=a(d.anchorhoverdip);e.anchorAnimation=a(d.anchorhoveranimation,1);e.negativeColor=b(d.negativehovercolor,d.negativecolor);e.is3DBubble=a(d.is3donhover)},parseExportOptions:function(c){var d=this.chartInstance,e=this.dataObj.chart;g(c.exporting,{enabled:a(e.exportenabled,0),bgcolor:d.jsVars.transparent||0===a(d.options.containerBackgroundOpacity,1)?p:d.options.containerBackgroundColor||"#ffffff",bgalpha:(d.jsVars.transparent?0:a(d.options.containerBackgroundOpacity,
1))+p,exporttargetwindow:b(e.exporttargetwindow,Jb?"_blank":"_self"),exportaction:e.exportaction&&"save"===e.exportaction.toString().toLowerCase()&&"save"||"download",exportfilename:b(e.exportfilename,"FusionCharts"),exporthandler:b(e.html5exporthandler,e.exporthandler,I),exportparameters:b(e.exportparameters,p),exportformat:b(e.exportformat,"PNG"),exportcallback:b(e.exportcallback,p),exportwithimages:a(e.exportwithimages,0),buttons:{printButton:{enabled:!!a(e.printshowbutton,e.showprintmenuitem,
0)},exportButton:{enabled:!(!a(e.exportenabled,0)||!a(e.exportshowbutton,e.exportshowmenuitem,1))}}});var d=c.exporting,k;e=e.exportformats;c=n(c.exporting.exportaction);c={JPG:c+" as JPEG image",PNG:c+" as PNG image",PDF:c+" as PDF document",SVG:c+" as SVG vector image"};var f,h,l;if(e){e=e.split(/\s*?\|\s*?/);for(l=0;l<e.length;l++)h=(f=e[l].split(/\s*?=\s*?/))&&f[0].toUpperCase()||p,f=f&&f[1]||p,c[h]&&(k||(k={}))&&(k[h]=f||c[h]);k=k||c}else k=c;d.exportformats=k},defaultSeriesType:p,paletteIndex:1,
creditLabel:!1,titleSpaceManager:hb,placeLegendBlockBottom:Ta,configureLegendOptions:Ka,placeLegendBlockRight:sb,placeHorizontalAxis:xb,placeVerticalAxis:Ya,placeHorizontalCanvasMarginAdjustment:ac,placeVerticalCanvasMarginAdjustment:Ob,placeHorizontalXYSpaceManager:function(c,d,e,k){var f=c[B],g,h,l,s,A=d.chart,p,m,n,q,O,u,t,Q=c.chart,ca=f.marginLeftExtraSpace,z=f.marginTopExtraSpace,w=f.marginBottomExtraSpace,E=f.marginRightExtraSpace;s=e-(ca+E+Q.marginRight+Q.marginLeft);var ia=k-(w+Q.marginBottom+
Q.marginTop),D=.3*s;e=.3*ia;var S=c.xAxis.showLine?c.xAxis.lineThickness:0;l=c.yAxis[0].showLine?c.yAxis[0].lineThickness:0;g=s-D;k=ia-e;p=b(A.legendposition,na).toLowerCase();c.legend.enabled&&p===pa&&(g-=this.placeLegendBlockRight(c,d,g/2,ia));O=a(A.xaxisnamepadding,5);u=a(A.labelpadding,4);t=b(A.rotatexaxisname,"ccw");t=t===Da?"none":t;m=b(A.showplotborder,f.is3d?Da:$a)===$a;m=f.plotBorderThickness=m?f.is3d?1:a(A.plotborderthickness,1):0;n=U(a(Q.plotBorderWidth,1),0);!f.isDual&&Q.marginRight<n&&
void 0===A.chartrightmargin&&(h=n-Q.marginRight,s>D+h&&(Q.marginRight=n,s-=h,D=.3*s,g=s-D));h=f.x;q=U(n,m/2);u<q&&(u=q);h.verticalAxisNamePadding=O;h.verticalAxisValuesPadding=u+S;h.rotateVerticalAxisName=t;h.verticalAxisNameWidth=a(A.xaxisnamewidth);g-=Ya(c.xAxis,h,c,d,ia,g,!1,!1,s);c.xAxis.lineEndExtension=l;g-=ac(c,d,g,c.xAxis);s=g+D;c.legend.enabled&&p!==pa&&(k-=this.placeLegendBlockBottom(c,d,s,k/2));k-=this.titleSpaceManager(c,d,s,k/2);h=f[0];h.horizontalAxisNamePadding=a(A.yaxisnamepadding,
5);h.horizontalLabelPadding=U(a(A.yaxisvaluespadding,4))+l;h.labelDisplay="auto";h.staggerLines=a(A.staggerlines,2);h.slantLabels=a(A.slantlabels,0);h.horizontalLabelPadding=h.horizontalLabelPadding<n?n:h.horizontalLabelPadding;this.xAxisMinMaxSetter(c,d,s);l=c.xAxis;O=l.plotLines;g=k/(l.max-l.min);O&&O.length&&(n=(O[0].value-l.min)*g,O=(l.max-O[O.length-1].value)*g,f.isBar&&(m>n&&(l.min-=(m-n)/(2*g)),m>O&&(l.max+=(m-O)/(2*g))));k-=this.placeHorizontalAxis(c.yAxis[0],h,c,d,s,k,D);k-=Ob(c,d,k,c.yAxis[0]);
ha(e+k,c,A,c.xAxis,f.x.lYLblIdx,!0);Lb(c,c.xAxis.title,k);c.legend.enabled&&p===pa&&(c=c.legend,d=e+k,c.height>d&&(c.height=d,c.scroll.enabled=!0,d=(c.scroll.scrollBarWidth=10)+(c.scroll.scrollBarPadding=2),c.width+=d,Q.marginRight+=d),c.y=20);Q.marginLeft+=ca;Q.marginTop+=z;Q.marginBottom+=w;Q.marginRight+=E},placeVerticalXYSpaceManager:function(c,d,e,k){var f=c[B],g,h,l=!0;g=0;var s=d.chart,A=!1,p,m,n,q,O=c.chart,u,t,Q,ca=f.marginLeftExtraSpace,z=f.marginTopExtraSpace,w=f.marginBottomExtraSpace,
E=f.marginRightExtraSpace;q=e-(ca+E+O.marginRight+O.marginLeft);var ia=k-(w+O.marginBottom+O.marginTop),D=.3*q;k=.3*ia;var S=q-D;e=ia-k;g=f.drawFullAreaBorder=a(s.drawfullareaborder,1);var va=b(s.legendposition,na).toLowerCase();u=c.xAxis.showLine?c.xAxis.lineThickness:0;t=c.yAxis[0].showLine?c.yAxis[0].lineThickness:0;Q=f.isDual&&c.yAxis[1].showLine?c.yAxis[1].lineThickness:0;p=a(s.yaxisnamepadding,5);m=a(s.yaxisvaluespadding,s.labelypadding,4);h=b(s.showplotborder,f.is3d?Da:$a)===$a;h=f.plotBorderThickness=
h?f.is3d?1:a(s.plotborderthickness,1):0;n=U(a(O.plotBorderWidth,1),0);h=U(n,h/2);"area"!==this.defaultSeriesType||g||(h=n);m<n&&(m=n);!f.isDual&&O.marginRight<n&&void 0===s.chartrightmargin&&(g=n-c.chart.marginRight,q>D+g&&(q-=g,D=.3*q,S=q-D));c.legend.enabled&&va===pa&&(S-=this.placeLegendBlockRight(c,d,S/2,ia));f.isDual&&(A=!0,g=f[1],l=c.yAxis[1].opposite,n=b(s.rotateyaxisname,l?"cw":"ccw"),n=n===Da?"none":n,g.verticalAxisNamePadding=p,g.verticalAxisValuesPadding=m+Q,g.rotateVerticalAxisName=n,
g.verticalAxisNameWidth=a(s.syaxisnamewidth),S-=Ya(c.yAxis[1],g,c,d,ia,S/2,l,A));g=f[0];l=!l;n=b(s.rotateyaxisname,l?"cw":"ccw");n=n===Da?"none":n;g.verticalAxisNamePadding=p;g.verticalAxisValuesPadding=m+t;g.rotateVerticalAxisName=n;g.verticalAxisNameWidth=a(A?s.pyaxisnamewidth:s.yaxisnamewidth);S-=Ya(c.yAxis[0],g,c,d,ia,S,l,A,q);S-=ac(c,d,S,c.yAxis[0],c.yAxis[1]);l=S+D;c.legend.enabled&&va!==pa&&(e-=this.placeLegendBlockBottom(c,d,l,e/2));e-=this.titleSpaceManager(c,d,l,e/2);g=f.x;g.horizontalAxisNamePadding=
a(s.xaxisnamepadding,5);g.horizontalLabelPadding=a(s.labelpadding,s.labelxpadding,4)+u;g.labelDisplay=b(s.labeldisplay,"auto").toLowerCase();g.rotateLabels=a(s.rotatelabels,s.rotatexaxislabels,0);g.staggerLines=a(s.staggerlines,2);g.slantLabels=a(s.slantlabels,s.slantlabel,0);c.yAxis[0].opposite?(c.xAxis.lineEndExtension=t,c.xAxis.lineStartExtension=Q):(c.xAxis.lineEndExtension=Q,c.xAxis.lineStartExtension=t);g.horizontalLabelPadding<h&&(g.horizontalLabelPadding=h);q={left:0,right:0};q=O.managePlotOverflow&&
this.canvasPaddingModifiers&&this.calculateCanvasOverflow(c,!0)||q;u=q.left+q.right;t=.6*l;u>t&&(Q=q.left/u,q.left-=Q*(u-t),q.right-=(1-Q)*(u-t));this.xAxisMinMaxSetter(c,d,l,q.left,q.right);e-=this.placeHorizontalAxis(c.xAxis,g,c,d,l,e,D);e-=Ob(c,d,e,c.xAxis);c.title.alignWithCanvas||("left"===c.title.align&&c.yAxis[0].title.text&&wb(c,c.yAxis[0].title,k+e),"right"===c.title.align&&A&&c.yAxis[1].title.text&&wb(c,c.yAxis[1].title,k+e));A&&(ha(k+e,c,s,c.yAxis[1],f[1].lYLblIdx),Lb(c,c.yAxis[1].title,
k+e));ha(k+e,c,s,c.yAxis[0],f[0].lYLblIdx);Lb(c,c.yAxis[0].title,k+e);c.legend.enabled&&va===pa&&(c=c.legend,d=k+e,c.height>d&&"gradient"!==c.type&&(c.height=d,c.scroll.enabled=!0,d=(c.scroll.scrollBarWidth=10)+(c.scroll.scrollBarPadding=2),c.width+=d,O.marginRight+=d));O.marginLeft+=ca;O.marginTop+=z;O.marginBottom+=w;O.marginRight+=E},placeVerticalAxisTitle:Lb,calculateCanvasOverflow:function(a,b){for(var c=this.canvasPaddingModifiers,d=a.chart,f=this.smartLabel,e=0,k=0,g=0,h=0,l=e=!1,s=!1,A=c&&
c.length||0,m,n,q,O,u;A--;)switch(k=c[A],k){case "anchor":l=n=e=!0;break;case "anchorlabel":q=n=e=!0;break;case "errorbar":s=e=!0}if(e&&(A=(c=a.series)&&c.length||0,b))for(;A--;)m=c[A],n&&(e=m&&m.data||[],1<e.length&&(O=e[0],u=e[e.length-1],l&&(e=O&&O.marker&&O.marker.enabled&&(O.marker.radius||0)+(O.marker.lineWidth||0)||0,k=u&&u.marker&&u.marker.enabled&&(u.marker.radius||0)+(u.marker.lineWidth||0)||0,g=U(e+2,g),h=U(k+2,h)),q&&(f.setStyle(a.plotOptions.series.dataLabels.style),d.rotateValues?(k=
f.getOriSize(O&&O.displayValue||p),e=k.height/2,k=f.getOriSize(u&&u.displayValue||p),k=k.height/2):(k=f.getOriSize(O&&O.displayValue||p),e=k.width/2,k=f.getOriSize(u&&u.displayValue||p),k=k.width/2),g=U(e+2,g),h=U(k+2,h)))),s&&(k=e=m.errorBarWidth/2+m.errorBarThickness||0,g=U(e+2,g),h=U(k+2,h));return{left:g,right:h}},spaceManager:function(){return this.placeVerticalXYSpaceManager.apply(this,arguments)},axisMinMaxSetter:function(b,c,d,e,f,k,g,h){d=c.stacking100Percent?Q(99,1,100,0,f,k,g,h):Q(a(c.max,
d),a(c.min,e),d,e,f,k,g,h);b.min=Number(m(d.Min,10));b.max=Number(m(d.Max,10));b.tickInterval=Number(m(d.divGap,10));c.numdivlines=t.round((b.max-b.min)/b.tickInterval)-1;2>=d.Range/d.divGap&&(b.alternateGridColor=ja);this.highValue=c.max;this.lowValue=c.min;delete c.max;delete c.min},configurePlotLines:function(c,d,e,k,f,g,h,l,s,A,n){var q=e.min,O=e.max,u=e.tickInterval,t=A?"xAxis":k.stacking100Percent?"percentValue":"yAxis",Q=q,ca=1,z=e.gridLineColor,w=e.gridLineWidth,E=e.gridLineDashStyle,ia=0>
q&&0<O?!0:!1,D=0===q,S=0===O,va=0===a(k.showzeroplanevalue,c.showzeroplanevalue),qa=!0,F,N=1,ma=0<a(c.numdivlines,0),I=d[B].axisGridManager,H=this.colorManager,J=this.is3D,ra=a(c.showaxislimitgridlines,this.showAxisLimitGridLines),J=a(ra,J||d.chart.plotBorderWidth?0:1),Ja=this.inversed;d=d.xAxis;n=a(n,s?1:0);delete e._altGrid;delete e._lastValue;A&&!k.catOccupied&&(k.catOccupied={});!ia||A&&k.catOccupied[0]||(A?(qa=a(c.showvzeroplane,1),F=a(c.showvzeroplanevalue,g),ma=a(c.vzeroplanethickness,1),H=
b(c.vzeroplanealpha,c.vdivlinealpha,H.getColor("divLineAlpha")),c=0<ma?G(b(c.vzeroplanecolor,z),H):ja):(H=a(c.divlinealpha,H.getColor("divLineAlpha")),F=a(k.showzeroplanevalue,c.showzeroplanevalue,g),!1===this.defaultZeroPlaneHighlighted?(qa=a(k.showzeroplane,c.showzeroplane,!(this.defaultZeroPlaneHidden&&!ma)),ma=w):(ma=1===w?2:w,N=5,H=ga(2*H,100)),ma=a(k.zeroplanethickness,c.zeroplanethickness,ma),H=b(k.zeroplanealpha,c.zeroplanealpha,H),c=0<ma?G(b(k.zeroplanecolor,c.zeroplanecolor,z),H):ja),qa&&
(F=F?l[t](0,n):p,(N=I.addAxisGridLine(e,0,F,ma,E,c,N,A))&&(N.isZeroPlane=!0)),e.effectiveZeroPlaneThickness=qa&&parseInt(H,10)&&ma);A&&k.catOccupied[q]||(F=!f||D&&va?p:l[t](q,n),(N=ra||J&&(Ja||!d.showLine)?I.addAxisGridLine(e,q,F,w,E,z||ja,2,A):I.addAxisGridLine(e,q,F,.1,void 0,ja,2,A))&&(N.isMinLabel=!0));0>=w&&(w=.1,z=ja);for(q=Number(m(Q+u,10));q<O;q=Number(m(q+u,10)),ca+=1)ia&&0>Q&&0<q&&!s&&(I.addAxisAltGrid(e,0),ca+=1),0===q||A&&k.catOccupied[q]||(F=1===g&&0===ca%h?l[t](q,n):p,I.addAxisGridLine(e,
q,F,w,E,z,2,A)),Q=q,s||I.addAxisAltGrid(e,q);s||I.addAxisAltGrid(e,O);0!==ca%h||A&&k.catOccupied[O]||(F=!f||S&&va?p:l[t](O,n),(N=ra||J&&(!Ja||!d.showLine)?I.addAxisGridLine(e,O,F,w,E,z||ja,2,A):I.addAxisGridLine(e,O,F,.1,E,ja,2,A))&&(N.isMaxLabel=!0));this.realtimeEnabled&&(e.labels._enabled=e.labels.enabled,e._gridLineWidth=e.gridLineWidth,e._alternateGridColor=e.alternateGridColor);e.labels.enabled=!1;e.gridLineWidth=0;e.alternateGridColor=ja;e.plotLines.sort(gb)},xAxisMinMaxSetter:function(b,d,
e,k,f){var g=b[B],h=g.x,l=d.chart,s=h.min=a(h.min,0),A=h.max=a(h.max,h.catCount-1),p=0,m=0,n=b.chart.defaultSeriesType,q=/^(column|column3d|bar|bar3d|floatedcolumn|sparkwinloss|boxandwhisker2d|dragcolumn)$/.test(n),O=/^(line|area|spline|areaspline)$/.test(n),n=/^(scatter|bubble|candlestick|dragnode)$/.test(n),u=b.xAxis,t=u.scroll,Q=t&&t.enabled,ca=a(l.canvaspadding),z=void 0!==ca&&null!==ca,w=xa(ga(a(ca,k,0),e/2-10)),ca=xa(ga(a(ca,f,0),e/2-10)),E,ia,D,S;h.adjustMinMax&&(E=a(l.setadaptivexmin,1),A=
s=!E,ia=a(this.numVDivLines,l.numvdivlines,4),D=l.adjustvdiv!==Da,S=a(l.showxaxisvalues,l.showxaxisvalue,1),E=a(l.showvlimits,S),S=a(l.showvdivlinevalue,l.showvdivlinevalues,S),this.axisMinMaxSetter(u,h,l.xaxismaxvalue,l.xaxisminvalue,s,A,ia,D),s=u.min,A=u.max,h.requiredAutoNumericLabels&&(ia=a(parseInt(l.xaxisvaluesstep,10),1),this.configurePlotLines(l,b,u,h,E,S,1>ia?1:ia,g.numberFormatter,!1,!0)),u.plotLines.sort(gb));u.labels.enabled=!1;u.gridLineWidth=0;u.alternateGridColor=ja;!q&&!g.isScroll||
g.hasNoColumn||z||void 0===k||null===k||void 0===f||null===f||(m=e/(A-s+1)*.5,w=0<m-k?0:w,ca=0<m-f?0:ca,p=0<m-k?.5:0,m=0<m-f?.5:0);q&&!g.hasNoColumn&&(m=p=.5);g.is3d&&(w+=a(b.chart.xDepth,0));b=(e-(w+ca))/((Q?t.vxLength:A)-s+(p+m));u.min=s-(p+w/b);u.max=A+(m+ca/b);Q&&(p=t.vxLength,b=u.max-u.min,t.viewPortMin=u.min,t.viewPortMax=u.max,t.scrollRatio=p/b,t.flatScrollBars=g.flatScrollBars,t.scrollBar3DLighting=g.scrollBar3DLighting,u.max=u.min+p);O&&u.min===u.max&&(u.min-=.65,u.max+=.65);n&&d.vtrendlines&&
c(d.vtrendlines,u,g,!1,!0,!0)},postSeriesAddition:function(c){var d=c[B],e=d.isBar,k=d.is3d,f=c.chart.rotateValues&&!e?270:0,h=d[0],s=h&&h.stacking100Percent,A,p,m,n,q,O,u,t,Q,ca,z,w,E,ia,D,S,va,qa,F,N,G,ma,I;if(this.isStacked)for(m in A=d.plotSpacePercent,p=c.chart.defaultSeriesType,A=1-2*A,S=c.series,va=this.numberFormatter,G=g({},c.plotOptions.series.dataLabels.style),ma=parseFloat(G.fontSize),I=!h.stacking100Percent,G.color=c.plotOptions.series.dataLabels.color,n=h.stack,n){h=n[m].length;q=A/
h;u=-(A-q)/2;ia=[];w=0;for(t=S.length;w<t;w+=1)Q=S[w],Q.yAxis||b(Q.type,p)!==m||ia.push(Q);for(O=0;O<h;O+=1,u+=q){z=n[m][O];D=[];w=0;for(t=ia.length;w<t;w+=1)Q=ia[w],a(Q.columnPosition,0)===O&&D.push(Q.data);if(z&&z.length)for(ca=0,Q=z.length;ca<Q;ca+=1)if(w=z[ca])for(E=(w.n||0)+(w.p||0),d.showStackTotal&&(t=ca,t+=u,w=0>E?w.n:w.p,c.xAxis.plotLines.push({value:t,width:0,isVline:I,isTrend:!I,zIndex:4,_isStackSum:1,_catPosition:ca,_stackIndex:O,label:{align:La,textAlign:k||270!==f?e?0>E?pa:za:La:0>E?
pa:za,offsetScale:I?w:void 0,offsetScaleIndex:0,rotation:f,style:G,verticalAlign:Ca,y:e?0:0>E?270===f?4:ma:-4,x:0,text:d.numberFormatter.yAxis(E)}})),w=0,t=D.length;w<t;w+=1)if(F=D[w][ca])if(N=E&&(F.y||0)/E*100,qa=va.percentValue(N),F.toolText=l(F.toolText,[14,24,25,112],{percentValue:qa,sum:va.dataLabels(E),unformattedSum:E}),F.y||0===F.y)s&&(F.y=N,F.previousY||0===F.previousY)&&(F.previousY=F.previousY/E*100),F.showPercentValues&&(F.displayValue=qa)}}},styleMapForFont:Ha,styleApplicationDefinition_font:function(a,
b,c){var d,f,e=!1,k,g,h=this.styleMapForFont;switch(b){case "caption":d=a.title;break;case "datalabels":d=a.xAxis.labels;break;case "datavalues":d=a.plotOptions.series.dataLabels;e=!0;break;case "tldatavalues":d={style:a.plotOptions.series.dataLabels.tlLabelStyle};break;case "trdatavalues":d={style:a.plotOptions.series.dataLabels.trLabelStyle};break;case "bldatavalues":d={style:a.plotOptions.series.dataLabels.blLabelStyle};break;case "brdatavalues":d={style:a.plotOptions.series.dataLabels.brLabelStyle};
break;case "subcaption":d=a.subtitle;break;case "tooltip":d=a.tooltip;break;case "trendvalues":d={style:a[B].trendStyle};break;case "xaxisname":d=a.xAxis.title;break;case "yaxisname":case "pyaxisname":case "axistitle":d=[];b=0;for(k=a.yAxis.length;b<k;b+=1)d.push(a.yAxis[b].title);break;case "yaxisvalues":d=[];b=0;for(k=a.yAxis.length;b<k;b+=1)d.push(a.yAxis[b].labels);break;case "vlinelabels":d={style:a[B].divlineStyle};break;case "legend":d={style:a.legend.itemStyle};break;default:(d=a.orphanStyles[b])||
(a.orphanStyles[b]=d={text:"",style:{}})}if("object"===typeof d)if(d instanceof Array)for(b=0,k=d.length;b<k;b+=1){g=d[b];for(f in c)if(a=f.toLowerCase(),"function"===typeof h[a])h[a](c[f],g,e);M(g.style)}else{for(f in c)if(a=f.toLowerCase(),"function"===typeof h[a])h[a](c[f],d,e);M(d.style)}},parseStyles:function(a){var b,c,d,f={},e,k=this.dataObj;if(k.styles&&k.styles.definition instanceof Array&&k.styles.application instanceof Array){for(b=0;b<k.styles.definition.length;b+=1)c=k.styles.definition[b],
c.type&&c.name&&this["styleApplicationDefinition_"+c.type.toLowerCase()]&&(f[c.name.toLowerCase()]=c);for(b=0;b<k.styles.application.length;b+=1)for(c=k.styles.application[b].styles&&k.styles.application[b].styles.split(Fa)||[],e=0;e<c.length;e+=1)if(d=c[e].toLowerCase(),f[d]&&k.styles.application[b].toobject)this["styleApplicationDefinition_"+f[d].type.toLowerCase()](a,k.styles.application[b].toobject.toLowerCase(),f[d])}},updateDefaultAnnotations:function(){var c=this.renderer,d=this.dataObj,e=
this.chartInstance,k=d&&d.annotations||{},f={},g;if(this.drawAnnotations&&e.dataReady()&&d&&d.chart&&a(d.chart.showannotations,1)){g=a(k.scaleonresize,d.chart.scaleonresize,1);var c={interactionevents:b(this.annotationInteractionEvents,!0),showbelow:b(k.showbelow,k.showbelowchart),autoscale:k.autoscale,scaletext:k.scaletext,scaleimages:k.scaleimages,constrainedscale:k.constrainedscale,scaleonresize:g,origw:b(k.origw,d.chart.origw,g?this.origRenderWidth:c.chartWidth),origh:b(k.origh,d.chart.origh,
g?this.origRenderHeight:c.chartHeight),xshift:k.xshift,yshift:k.yshift,grpxshift:k.grpxshift,grpyshift:k.grpyshift,xscale:k.xscale,yscale:k.yscale,rootxscale:a(k.xscale,100)/100,rootyscale:a(k.yscale,100)/100},h;c||(c={});for(h in f)c[h]=f[h];e.annotations.reset(k,c,this.snapLiterals)}else e.annotations.clear()},dispose:function(){var a;this.disposing=!0;this.renderer&&this.renderer.dispose();this.numberFormatter&&this.numberFormatter.dispose();this.hcJSON&&this.hcJSON.chart&&this.hcJSON.chart.renderTo&&
delete this.hcJSON.chart.renderTo;for(a in this)delete this[a];delete this.disposing;this.disposed=!0}});Z("stub",{init:function(a,b,c){this.containerElement=a;this.smartLabel=c.jsVars.smartLabel},standaloneInit:!0},Z.base);Z("barbase",{spaceManager:function(){return this.placeHorizontalXYSpaceManager.apply(this,arguments)}},Z.base);Z("singleseries",{series:function(a,b,d){var e=a.data||a.dataset&&a.dataset[0]&&a.dataset[0].data,f;e&&0<e.length&&e instanceof Array&&(f={data:[],hoverEffects:this.parseSeriesHoverOptions(a,
b,{},d),colorByPoint:!0},b.legend.enabled=!1,d=this.point(d,f,e,a.chart,b),d instanceof Array?b.series=b.series.concat(d):b.series.push(d),this.configureAxis(b,a),a.trendlines&&c(a.trendlines,b.yAxis,b[B],!1,this.isBar))},defaultSeriesType:p,configureAxis:function(c,d){var e=c[B],k=c.xAxis,f=d.chart,g=c.chart.is3D,h,l,s,A,p,m,n,q,O,u,t,Q,ca=0,w,z,E,ia,D,S,va,F=this.numberFormatter,qa=a(f.syncaxislimits,0),N;k.title.text=L(f.xaxisname);N=a(parseInt(f.yaxisvaluesstep,10),parseInt(f.yaxisvaluestep,10),
1);N=1>N?1:N;h=c.yAxis[0];l=e[0];e.isDual?(s=F.getCleanValue(f.pyaxismaxvalue),A=F.getCleanValue(f.pyaxisminvalue),h.title.text=L(f.pyaxisname),qa&&!l.stacking100Percent?(Q=e[1],t=a(Q.max),Q=a(Q.min),void 0!==t&&void 0!==Q&&(l.min=ga(l.min,Q),l.max=U(l.max,t)),t=F.getCleanValue(f.syaxismaxvalue),Q=F.getCleanValue(f.syaxisminvalue),null!==Q&&(A=null!==A?ga(A,Q):Q),null!==t&&(s=null!==s?U(s,t):t)):qa=0):(s=F.getCleanValue(f.yaxismaxvalue),A=F.getCleanValue(f.yaxisminvalue),h.title.text=L(f.yaxisname));
n=a(this.isStacked?0:this.setAdaptiveYMin,f.setadaptiveymin,this.defSetAdaptiveYMin,0);m=p=!n;q=a(e.numdivlines,f.numdivlines,this.numdivlines,4);O=f.adjustdiv!==Da;u=a(this.showYAxisValues,f.showyaxisvalues,f.showyaxisvalue,1);t=a(f.showyaxislimits,f.showlimits,u);Q=a(f.showdivlinevalue,f.showdivlinevalues,u);g||(ca=a(f.showaxislines,f.drawAxisLines,0),E=a(f.axislinethickness,1),D=a(f.axislinealpha,100),100<D&&(D=100),z=G(b(f.axislinecolor,"#000000"),D),h.showLine=a(f.showyaxisline,ca),w=k.showLine=
a(f.showxaxisline,ca),ia=k.lineThickness=a(f.xaxislinethickness,E),h.lineThickness=a(f.yaxislinethickness,E),S=k.lineAlpha=a(f.xaxislinealpha,D),100<S&&(S=k.lineAlpha=100),va=h.lineAlpha=a(f.yaxislinealpha,D),100<va&&(va=h.lineAlpha=100),k.lineColor=G(b(f.xaxislinecolor,z),S),h.lineColor=G(b(f.yaxislinecolor,z),va),c.chart.xAxisLineVisible=w&&!!ia&&0<S);this.axisMinMaxSetter(h,l,s,A,p,m,q,O);this.configurePlotLines(f,c,h,l,t,Q,N,e.numberFormatter,!1);h.reversed&&0<=h.min&&(c.plotOptions.series.threshold=
h.max);e.isDual&&(h=c.yAxis[1],l=e[1],t=a(f.showsecondarylimits,t),Q=a(f.showdivlinesecondaryvalue,u),qa?(k=c.yAxis[0],h.min=k.min,h.max=k.max,h.tickInterval=k.tickInterval,delete l.max,delete l.min):(s=F.getCleanValue(f.syaxismaxvalue),A=F.getCleanValue(f.syaxisminvalue),n=a(f.setadaptivesymin,n),m=p=!n,this.axisMinMaxSetter(h,l,s,A,p,m,q,O)),g||(h.showLine=a(f.showsyaxisline,ca),h.lineThickness=a(f.syaxislinethickness,E),g=h.lineAlpha=a(f.syaxislinealpha,D),100<g&&(g=100),h.lineColor=G(b(f.syaxislinecolor,
z),g)),this.configurePlotLines(f,c,h,l,t,Q,N,e.numberFormatter,!0),h.title.text=L(f.syaxisname))},pointValueWatcher:function(c,d,e,k,f,g,h){c=c[B];var l;if(null!==d)return e=a(e,0),c[e]||(c[e]={}),e=c[e],k&&(this.distributedColumns&&(c.marimekkoTotal+=d),k=e.stack,f=a(f,0),g=a(g,0),h=b(h,Za),k[h]||(k[h]=[]),h=k[h],h[g]||(h[g]=[]),g=h[g],g[f]||(g[f]={}),f=g[f],0<=d?f.p?(l=f.p,d=f.p+=d):f.p=d:f.n?(l=f.n,d=f.n+=d):f.n=d),e.max=e.max>d?e.max:d,e.min=e.min<d?e.min:d,l},parseSeriesHoverOptions:function(c,
d,e){c=d.chart.plotHoverEffects;d={enabled:b(e.showhovereffect,e.hovereffect,c.enabled)};d.highlight=a(e.highlightonhover,e.highlightplotonhover,c.highlight);d.columnHighlight=a(d.highlight,e.highlightcolumnonhover,e.highlightbaronhover,c.columnHighlight);d.anchorHighlight=a(d.highlight,e.highlightanchoronhover,c.anchorHighlight);d.anchorHighlight=a(d.highlight,e.highlightimageonhover,c.imageHighlight);d.bubbleHighlight=a(d.highlight,e.highlightbubbleonhover,e.highlightbaronhover,c.bubbleHighlight);
d.imageHoverAlpha=b(e.anchorimagehoveralpha,c.anchorImageHoverAlpha);d.imageHoverScale=b(e.anchorimagehoverscale,c.anchorImageHoverScale);d.color=b(e.hovercolor,e.bubblehovercolor,c.color);d.alpha=b(e.hoveralpha,c.alpha);d.scale=b(e.hoverscale,e.bubblehoverscale,c.scale);d.gradientColor=void 0!==e.hovergradientcolor?e.hovergradientcolor:c.gradientColor;d.ratio=b(e.hoverratio,c.ratio);d.angle=b(e.hoverangle,c.angle);d.borderColor=b(e.borderhovercolor,c.borderColor);d.borderAlpha=b(e.borderhoveralpha,
c.borderAlpha);d.borderThickness=a(e.borderhoverthickness,c.borderThickness);d.borderDashed=a(e.borderhoverdashed,c.borderDashed);d.borderDashGap=a(e.borderhoverdashgap,c.borderDashGap);d.borderDashLen=a(e.borderhoverdashlen,c.borderDashLen);d.shadow=b(e.hovershadow,c.shadow);d.anchorSides=b(e.anchorhoversides,c.anchorSides);d.anchorRadius=b(e.anchorhoverradius,c.anchorRadius);d.anchorScale=b(e.anchorhoverscale,c.anchorScale);d.anchorAlpha=b(e.anchorhoveralpha,e.hoveralpha,c.anchorAlpha);d.anchorBgColor=
b(e.anchorbghovercolor,e.anchorhovercolor,c.anchorBgColor);d.anchorBgAlpha=b(e.anchorbghoveralpha,c.anchorBgAlpha);d.anchorBorderColor=b(e.anchorborderhovercolor,c.anchorBorderColor);d.anchorBorderAlpha=b(e.anchorborderhoveralpha,c.anchorBorderAlpha);d.anchorBorderThickness=a(e.anchorborderhoverthickness,c.anchorBorderThickness);d.anchorStartAngle=b(e.anchorhoverstartangle,c.anchorStartAngle);d.anchorDip=b(e.anchorhoverdip,c.anchorDip);d.anchorAnimation=a(e.anchorhoveranimation,c.anchorAnimation,
1);d.negativeColor=b(e.negativehovercolor,c.negativeColor);d.is3DBubble=a(e.is3donhover,c.is3DBubble);return d},pointHoverOptions:function(c,d,k){var g,f,h,l={};g=d.hoverEffects;d=a(c.hovereffect,g&&g.enabled);f=!1;var s={enabled:d},A=k&&p+k.plotType.toLowerCase();if(void 0===d)if(this.forceHoverEnable)f=d=s.enabled=!0;else{"anchor"==A&&(f=k.imageUrl?d=s.enabled=void 0!==b(c.anchorimagehoveralpha,g.imageHoverAlpha,c.anchorimagehoverscale,g.imageHoverScale,void 0):d=s.enabled=void 0!==b(c.hovercolor,
c.anchorhovercolor,c.anchorbghovercolor,g.anchorBgColor,g.color,c.hoveralpha,c.anchorhoveralpha,g.anchorAlpha,c.bghoveralpha,c.anchorbghoveralpha,g.anchorBgAlpha,c.anchorborderhovercolor,c.borderhovercolor,g.anchorBorderColor,c.anchorborderhoverthickness,c.borderhoverthickness,g.anchorBorderThickness,c.anchorborderhoveralpha,c.borderhoveralpha,g.anchorBorderAlpha,c.hoverdip,c.anchorhoverdip,g.anchorDip,c.anchorhoverstartangle,g.anchorStartAngle,c.hoversides,c.anchorhoversides,g.anchorSides,c.hoverradius,
c.anchorhoverradius,g.anchorRadius,void 0));if("column"==A||"bubble"==A)f=d=s.enabled=void 0!==b(c.hoveralpha,g.alpha,c.hovergradientcolor,g.gradientColor,c.borderhovercolor,g.borderColor,c.borderhoverthickness,g.borderThickness,c.hoverratio,g.ratio,c.hoverangle,g.angle,c.borderhoveralpha,g.borderAlpha,c.borderhoverdashed,g.borderDashed,c.borderhoverdashgap,g.borderDashGap,c.borderhoverdashlen,g.borderDashLen,c.hovercolor,g.color,void 0);f||"bubble"!=A||(f=d=s.enabled=void 0!==b(c.negativehovercolor,
g.negativeColor,c.is3donhover,g.is3DBubble,c.hoverscale,g.scale,void 0));"pie"==A&&(f=d=s.enabled=void 0!==b(c.hovercolor,g.color,c.hoveralpha,g.alpha,c.borderhovercolor,g.borderColor,c.borderhoverthickness,g.borderThickness,c.borderhoveralpha,g.borderAlpha,void 0))}if(d){s.highlight=a(c.highlightonhover,g.highlight);s.columnHighlight=a(s.highlight,c.highlightcolumnonhover,c.highlightbaronhover);s.anchorHighlight=a(s.highlight,c.highlightanchoronhover);s.bubbleHighlight=a(s.highlight,c.highlightbubbleonhover);
s.alpha=b(c.hoveralpha,g.alpha,k.alpha);s.scale=b(c.hoverscale,g.scale,1);s.gradientColor=void 0===c.hovergradientcolor?g.gradientColor:c.hovergradientcolor;s.borderColor=b(c.borderhovercolor,g.borderColor,k.borderColor);s.borderThickness=a(c.borderhoverthickness,g.borderThickness,k.borderWidth);s.ratio=b(c.hoverratio,g.ratio,k.ratio);s.angle=b(c.hoverangle,g.angle,k.angle);s.borderAlpha=b(c.borderhoveralpha,g.borderAlpha,k.borderAlpha);s.borderDashed=a(c.borderhoverdashed,g.borderDashed,k.borderDashed,
0);s.borderDashGap=a(c.borderhoverdashgap,g.borderDashGap,k.borderDashGap);s.borderDashLen=a(c.borderhoverdashlen,g.borderDashLen,k.borderDashLen);s.shadow=b(c.hovershadow,g.shadow,0);s.color=b(c.hovercolor,g.color);"anchor"==A&&(k.imageUrl?(s.imageHoverAlpha=a(c.anchorimagehoveralpha,g.imageHoverAlpha,100),s.imageHoverScale=k.imageScale*ka(a(c.anchorimagehoverscale,g.imageHoverScale,110))*.01,s.anchorAnimation=a(c.anchorhoveranimation,g.anchorAnimation,1)):(s.anchorColor=H(b(c.hovercolor,c.anchorhovercolor,
c.anchorbghovercolor,g.anchorBgColor,g.color,k.anchorBgColor)),s.anchorAlpha=b(c.hoveralpha,c.anchorhoveralpha,g.anchorAlpha,k.anchorAlpha),s.anchorBgAlpha=b(c.bghoveralpha,c.anchorbghoveralpha,g.anchorBgAlpha,s.anchorAlpha,k.anchorBgAlpha),s.anchorBorderColor=b(c.anchorborderhovercolor,c.borderhovercolor,g.anchorBorderColor,k.anchorBorderColor),s.anchorBorderThickness=b(c.anchorborderhoverthickness,c.borderhoverthickness,g.anchorBorderThickness,k.anchorBorderThickness),s.anchorBorderAlpha=a(c.anchorborderhoveralpha,
c.borderhoveralpha,g.anchorBorderAlpha,s.anchorAlpha,k.anchorBorderAlpha),s.anchorDip=a(c.hoverdip,c.anchorhoverdip,g.anchorDip),s.startAngle=b(c.anchorhoverstartangle,g.anchorStartAngle,k.anchorAngle),s.anchorSides=a(c.hoversides,c.anchorhoversides,g.anchorSides,k.anchorSides),s.anchorRadius=a(c.hoverradius,c.anchorhoverradius,g.anchorRadius),s.anchorScale=a(c.hoverscale,c.anchorhoverscale,g.anchorScale),s.anchorAnimation=a(c.anchorhoveranimation,g.anchorAnimation,1),void 0===s.anchorRadius&&(s.anchorRadius=
!f||s.anchorHighlight?k.anchorRadius&&k.anchorRadius+1:k.anchorRadius)));if(f||(s.columnHighlight||s.bubbleHighlight)&&s.color&&1==s.highlight)s.highlight=0;"column"==A&&(s.color=(b(s.color,k.color)+Fa+(void 0===s.gradientColor?k.gradientColor:s.gradientColor)).replace(/,+?$/,""));"pie"===A&&(s.color=b(s.color,k.color).replace(/,+?$/,""));"bubble"==A&&(s.negativeColor=b(c.negativehovercolor,g.negativeColor,k.negativeColor),s.is3d=a(c.is3donhover,g.is3DBubble,k.is3d),s.color=s.negativeColor&&0>c.z?
s.negativeColor:s.color||k.color,h="string"==typeof s.color,s.color=H(h?s.color:s.color.FCcolor.color),s.color=s.is3d?Z.bubble.getPointColor(s.color,s.alpha):{FCcolor:{color:s.color,alpha:s.alpha}});if(1==s.highlight&&"anchor"!==A){c=(h="string"==typeof s.color)?s.color.split(/\s{0,},\s{0,}/):s.color.FCcolor.color.split(/\s{0,},\s{0,}/);g=c.length;for(f=0;f<g;f++)c[f]=W(c[f],70);h?s.color=c.join(","):s.color.FCcolor.color=c.join(",")}"pie"===A&&(l={color:this.getPointColor(s.color,s.alpha,k.radius3D),
alpha:s.alpha,borderColor:G(s.borderColor,s.borderAlpha),borderWidth:s.borderThickness});"column"==A&&(s.colorArr=oa(s.color,s.alpha,s.ratio,s.angle,k.isRoundEdged,s.borderColor,ga(s.alpha,s.borderAlpha).toString(),k.isBar,k.is3d),s.dashStyle=s.borderDashed?e(s.borderDashLen,s.borderDashGap,s.borderThickness):"none",l={shadow:s.shadow,color:s.colorArr[0],borderColor:s.colorArr[1],borderWidth:s.borderThickness,use3DLighting:k.use3DLighting,dashStyle:s.dashStyle});"anchor"==A&&(l=k.imageUrl?{animation:s.anchorAnimation,
imageHoverAlpha:s.imageHoverAlpha,imageHoverScale:s.imageHoverScale}:{animation:s.anchorAnimation,shadow:s.shadow,fillColor:{FCcolor:{color:s.anchorColor,alpha:s.anchorBgAlpha*s.anchorAlpha/100+p}},lineColor:{FCcolor:{color:s.anchorBorderColor,alpha:s.anchorBorderAlpha}},lineWidth:s.anchorBorderThickness,radius:s.anchorRadius,symbol:Ma(s.anchorSides),startAngle:s.startAngle,sides:s.anchorSides,scale:s.anchorScale,dip:s.anchorDip});"bubble"==A&&(l={symbol:s.seriesAnchorSymbol,shadow:s.shadow,scale:s.scale,
fillColor:s.color,lineColor:{FCcolor:{color:s.borderColor,alpha:s.alpha}},lineWidth:s.borderThickness})}return{enabled:d,options:s,rolloverOptions:l}},getPointStub:function(c,d,e,k){var f=this.dataObj.chart;k=k[B];d=null===d?d:k.numberFormatter.dataLabels(d);var g=P(L(b(c.tooltext,k.tooltext))),s=P(L(c.displayvalue)),f=k.showTooltip?void 0!==g?l(g,[1,2,3,5,6,7],{formattedValue:d,label:e,yaxisName:L(f.yaxisname),xaxisName:L(f.xaxisname)},c,f):null===d?!1:e!==p?e+k.tooltipSepChar+d:d:p;k=a(c.showvalue,
k.showValues)?void 0!==s?s:d:p;c=b(c.link);return{displayValue:k,categoryLabel:e,toolText:f,link:c}},updateSnapPoints:function(){var a=this,b=a.snapLiterals,c=function(a,b){var c=0;switch(a){case "startx":c=b.x;break;case "starty":c=b.y;break;case "x":case "middlex":case "centerx":c=b.x+b.width/2;break;case "y":case "middley":case "centery":c=b.y+b.height/2;break;case "endx":c=b.x+b.width;break;case "endy":c=b.y+b.height;break;default:c=0}return c};b.dataset=function(b,d){var e=a.renderer&&a.renderer.plots,
k,g,s,h;s=a.is3D;if(!e||!e.length)return 0;isNaN(b[0])?k=0:(k=Number(b[0]),b=b.slice(1));g=b[0];if("set"===g){isNaN(b[1])?(h=0,b=b.slice(1)):(h=Number(b[1]),b=b.slice(2));g=b[0];e=(e=e[k]&&e[k].items[h])&&e.graphic;if(!e)return 0;s=d&&s?e._getBBox2():e.getBBox();h=c(g,s)}return h};b.xaxis=function(b){var d=a.renderer&&a.renderer.xAxis&&a.renderer.xAxis[0]&&a.renderer.xAxis[0].labels,e,k;if(!d||!d.length)return 0;k=b[0];if("label"===k){isNaN(b[1])?(e=0,b=b.slice(1)):(e=Number(b[1]),b=b.slice(2));k=
b[0];b=d[e];if(!b)return 0;b=b.getBBox();e=c(k,b)}return e};b.yaxis=function(b){var d=a.renderer&&a.renderer.yAxis,e,k;if(!d||!d.length)return 0;isNaN(b[0])?e=0:(e=Number(b[0]),b=b.slice(1));e=d[e];if(!e)return 0;d=b[0];if("label"===d){k=e.labels;isNaN(b[1])?(e=0,b=b.slice(1)):(e=Number(b[1]),b=b.slice(2));d=b[0];b=k[e];if(!b)return 0;b=b.getBBox();k=c(d,b)}return k}}},Z.base);Z("multiseries",{series:function(b,d,e){var k,f,g=d[B],s,h;d.legend.enabled=Boolean(a(b.chart.showlegend,1));if(b.dataset&&
0<b.dataset.length){this.categoryAdder(b,d);k=0;for(f=b.dataset.length;k<f;k+=1)s=b.dataset[k],h={hoverEffects:this.parseSeriesHoverOptions(b,d,s,e),visible:!a(s.initiallyhidden,0),data:[]},this.isStacked||(h.numColumns=f),s=this.point(e,h,s,b.chart,d,g.oriCatTmp.length,k),s instanceof Array?d.series=d.series.concat(s):d.series.push(s);this.configureAxis(d,b);b.trendlines&&!this.isLog&&c(b.trendlines,d.yAxis,g,!1,this.isBar,void 0,this.inversed)}},categoryAdder:function(b,c){var d,e=0,f=c[B],k=f.axisGridManager,
g=b.chart,s=c.xAxis,h,f=f.x,l,A,m,n;if(b.categories&&b.categories[0]&&b.categories[0].category)for(b.categories[0].font&&(c.xAxis.labels.style.fontFamily=b.categories[0].font),void 0!==(d=a(b.categories[0].fontsize))&&(1>d&&(d=1),c.xAxis.labels.style.fontSize=d+Ba,M(c.xAxis.labels.style)),b.categories[0].fontcolor&&(c.xAxis.labels.style.color=b.categories[0].fontcolor.split(Fa)[0].replace(/^\#?/,"#")),A=c[B].oriCatTmp,m=b.categories[0].category,d=0;d<m.length;d+=1)m[d].vline?k.addVline(s,m[d],e,c):
(l=a(m[d].showlabel,g.showlabels,1),n=b.categories[0].category[d],h=L(w(n.label,n.name)),k.addXaxisCat(s,e,e,l?h:p,{},n,g),A[e]=w(L(n.tooltext),h),e+=1);f.catCount=e},getPointStub:function(c,d,e,k,f,g,s,h,A,m){var n=this.dataObj.chart,q=this.isDual,O=this.isXY,u=this.isMLAxis,t=this.isStacked,Q=this.isErrorChart,ca;k=k[B];var z,E,ia=null===d?d:this.numberFormatter.dataLabels(d,s),D,S=P(L(b(c.tooltext,f.plottooltext,k.tooltext))),va=k.tooltipSepChar,F,qa={},N,G,ma,I,H,J,ra,Ja,M;Q&&(G=null===h?h:this.numberFormatter.dataLabels(h,
s),J=null===d?p:this.numberFormatter.percentValue(h/d*100),F=[1,2,3,4,5,6,7,99,100,101,102],d={yaxisName:I=L(q?s?n.syaxisname:n.pyaxisname:n.yaxisname),xaxisName:H=L(n.xaxisname),formattedValue:ia,label:e,errorDataValue:G,errorPercentValue:J},O?(ma=null===A?A:this.numberFormatter.xAxis(A),ra=null===m?p:this.numberFormatter.percentValue(A/m*100),F.push(103,104,105,106,107,108,109,110),M=b(c.horizontalerrorvalue,c.errorvalue),d.errorValue=Ja=b(c.verticalerrorvalue,c.errorvalue),m=P(L(b(c.verticalerrorplottooltext,
c.errorplottooltext,f.verticalerrorplottooltext,f.errorplottooltext,n.verticalerrorplottooltext,n.errorplottooltext))),null!==h&&(d.verticalErrorDataValue=G,d.verticalErrorPercentValue=J,d.verticalErrorValue=Ja),null!==A&&(d.horizontalErrorDataValue=ma,d.horizontalErrorPercentValue=ra,d.horizontalErrorValue=M),N=P(L(b(c.horizontalerrorplottooltext,c.errorplottooltext,f.horizontalerrorplottooltext,f.errorplottooltext,n.horizontalerrorplottooltext,n.errorplottooltext))),qa._hErrortoolText=k.showTooltip?
void 0!==N?l(N,F,{yaxisName:I=L(q?s?n.syaxisname:n.pyaxisname:n.yaxisname),xaxisName:H=L(n.xaxisname),formattedValue:ia,label:e,errorDataValue:ma,errorPercentValue:ra,errorValue:M,verticalErrorDataValue:G,verticalErrorPercentValue:J,verticalErrorValue:Ja,horizontalErrorDataValue:ma,horizontalErrorPercentValue:ra,horizontalErrorValue:M},c,n,f):null===h?!1:ma:!1):(m=P(L(b(c.errorplottooltext,f.errorplottooltext,n.errorplottooltext))),d.errorValue=Ja=b(c.errorvalue)),qa._errortoolText=k.showTooltip?
void 0!==m?l(m,F,d,c,n,f):null===h?!1:G:!1);k.showTooltip?void 0!==S?(t=[4,5,6,7],s={yaxisName:I||L(q?s?n.syaxisname:n.pyaxisname:u?f._yAxisName:n.yaxisname),xaxisName:H||L(n.xaxisname)},O?(t.push(8,9,10,11),s.yDataValue=ia,s.xDataValue=e,Q&&(t.push(103,104,105,106,107,108,109,110),null!==h&&(s.verticalErrorDataValue=G,s.verticalErrorPercentValue=J,s.verticalErrorValue=Ja),null!==A&&(s.horizontalErrorDataValue=ma,s.horizontalErrorPercentValue=ra,s.horizontalErrorValue=M))):(t.push(1,2,3),s.formattedValue=
ia,s.label=e,Q&&(t.push(99,100,101,102),s.errorValue=Ja,null!==h&&(s.errorDataValue=G,s.errorPercentValue=J))),f=l(S,t,s,c,n,f)):null===ia?f=!1:(k.seriesNameInToolTip&&(D=w(f&&f.seriesname)),f=D?D+va:p,f+=e?e+va:p,k.showPercentInToolTip&&t?(E=!0,f+="$percentValue"):f+=ia):f=!1;a(c.showvalue,g)?void 0!==P(c.displayvalue)?ca=L(c.displayvalue):k.showPercentValues?z=!0:ca=ia:ca=p;qa.link=b(c.link);qa.displayValue=ca;qa.categoryLabel=e;qa.toolText=f;qa.showPercentValues=z;qa.showPercentInToolTip=E;return qa}},
Z.singleseries);Z("xybase",{hideRLine:function(){var a=this.chart.series[this.index+1];a&&a.hide&&a.hide()},showRLine:function(){var a=this.chart.series[this.index+1];a&&a.show&&a.show()},getRegressionLineSeries:function(a,b,c){var d,f,e,k;k=a.sumXY;var g=a.sumX,s=a.sumY;f=a.xValues;e=a.sumXsqure;d=a.yValues;a=a.sumYsqure;b?(f.sort(Ib),d=f[0],f=f[f.length-1],k=(c*k-g*s)/(c*e-ua(g,2)),e=isNaN(k)?s/c:k*(d-g/c)+s/c,c=isNaN(k)?s/c:k*(f-g/c)+s/c,c=[{x:d,y:e},{x:f,y:c}]):(d.sort(Ib),e=d[0],d=d[d.length-
1],k=(c*k-g*s)/(c*a-ua(s,2)),f=isNaN(k)?g/c:k*(e-s/c)+g/c,c=isNaN(k)?g/c:k*(d-s/c)+g/c,c=[{x:f,y:e},{x:c,y:d}]);return c},pointValueWatcher:function(a,b,c,d){var f=a[B];null!==b&&(a=f[0],a.max=a.max>b?a.max:b,a.min=a.min<b?a.min:b);null!==c&&(a=f.x,a.max=a.max>c?a.max:c,a.min=a.min<c?a.min:c);d&&(c=c||0,b=b||0,d.sumX+=c,d.sumY+=b,d.sumXY+=c*b,d.sumXsqure+=ua(c,2),d.xValues.push(c),d.sumYsqure+=ua(b,2),d.yValues.push(b))}},Z.multiseries);Z("scrollbase",{postSeriesAddition:function(){var c=this.hcJSON,
d=c.xAxis.scroll,e=c[B],k=e.width,f=e.x.catCount,g=this.dataObj.chart,s=this.colorManager,h,l,A,p,n,m;e.isScroll=!0;c.chart.hasScroll=!0;if(this.isStacked)h=1;else{l=h=0;p=c.series;m=c.chart.defaultSeriesType;for(A=p.length;l<A;l++)n=b(p[l].type,m),"column"===n&&(h+=1);1>h&&(h=1)}f*=h;k=a(g.numvisibleplot,ea(k/this.avgScrollPointWidth));d&&2<=k&&k<f&&(d.enabled=!0,d.vxLength=k/h,d.startPercent=ga(1,U(0,parseFloat(g.scrolltoend)||0)),d.padding=a(g.scrollpadding,0),d.height=a(g.scrollheight,16),d.showButtons=
!!a(g.scrollshowbuttons,1),d.buttonPadding=a(g.scrollbtnpadding,0),d.color=H(b(g.scrollcolor,s.getColor("altHGridColor"))),e.marginBottomExtraSpace+=d.padding+d.height);if(va||a(g.enabletouchscroll,0))c.chart.zoomType="x",c.chart.nativeZoom=!1,c.chart.selectionMarkerFill="rgba(255,255,255,0)",(c.callbacks||(c.callbacks=[])).push(function(a){V(a,"selectionstart selectiondrag",Z.scrollbase.performTouchScroll,{})})},performTouchScroll:function(a){var b=this.xAxis[0].scroller,c=b.config,c=c.trackLength/
(c.width/c.scrollRatio)*(a.chartX||1);!0!==a.isOutsidePlot&&S(b.elements.anchor.element,"selectionstart"===a.type?"dragstart":"drag",{pageX:-c,pageY:-a.chartY})}},Z.multiseries);Z("logbase",{isLog:!0,isValueAbs:!0,configureAxis:function(d,e){var k=d[B],s=k.axisGridManager,f=this.numberFormatter,h=d.series,l=d.xAxis,A=d.yAxis[0],n=k[0],m=e.chart,q=!a(m.showyaxislimits,m.showlimits,m.showyaxisvalues,1),O=!a(m.showdivlinevalues,m.showyaxisvalues,1),u=a(m.base,m.logbase,10),t=a(m.yaxismaxvalue),Q=a(m.yaxisminvalue),
ca=this.colorManager,z=1===a(m.showminordivlinevalues),w=b(m.minordivlinecolor,A.gridLineColor,ca.getColor("divLineColor")),E=a(m.minordivlinealpha,m.divlinealpha,ca.getColor("divLineAlpha")),ca=[A,void 0,void 0,a(m.divlinethickness,2),A.gridLineDashStyle,A.gridLineColor,2],w=[A,void 0,void 0,a(m.minordivlinethickness,1),A.gridLineDashStyle,G(b(m.minordivlinecolor,w),a(m.minordivlinealpha,E/2)),2],E=z||E&&w[3],ia=a(m.showaxislimitgridlines,this.showAxisLimitGridLines),D=a(ia,this.is3D||d.chart.plotBorderWidth?
0:1),S,va;0>=u&&(u=10);0>=t&&(t=void 0);0>=Q&&(Q=void 0);t=this.getLogAxisLimits(n.max||u,n.min||1,t,Q,u,E?m.numminordivlines:0);l.title.text=L(m.xaxisname);l.showLine=a(m.showxaxisline,m.showaxislines,0);l.lineThickness=a(m.xaxislinethickness,m.axislinethickness,1);l.lineAlpha=a(m.xaxislinealpha,m.axislinealpha,100);l.lineColor=G(b(m.xaxislinecolor,m.axislinecolor,"000"));g(A,{title:{text:L(m.yaxisname)},labels:{enabled:!1},gridLineWidth:0,alternateGridColor:ja,reversed:"1"===m.invertyaxis,max:qa(t.Max,
u),min:qa(t.Min,u),showLine:a(m.showyaxisline,m.showaxislines,0),lineThickness:a(m.yaxislinethickness,m.axislinethickness,1),lineAlpha:a(m.yaxislinealpha,m.axislinealpha,100),lineColor:G(b(m.yaxislinecolor,m.axislinecolor,"000"))});for(m=h.length;m--;)if(Q=h[m])for(Q.threshold=A.min,va=(Q=Q.data)&&Q.length||0;va--;)S=Q[va],S.y=qa(S.y,u);delete n.max;delete n.min;n.isLog=!0;A.reversed&&0<=A.min&&(d.plotOptions.series.threshold=A.max);e.trendlines&&c(e.trendlines,[{max:t.Max,min:t.Min,plotLines:A.plotLines,
plotBands:A.plotBands,title:A.title}],k);for(m=A.plotLines.length;m--;)S=A.plotLines[m],S.value&&(S.value=qa(S.value,u)),S.from&&(S.from=qa(S.from,u)),S.to&&(S.to=qa(S.to,u));for(m=A.plotBands.length;m--;)S=A.plotBands[m],S.from&&(S.from=qa(S.from,u)),S.to&&(S.to=qa(S.to,u));for(m=t.divArr.length;m--;){S=t.divArr[m];if(S.ismajor)ca[1]=qa(S.value,u),ca[2]=f.yAxis(S.value),s.addAxisGridLine.apply(s,ca);else if(E||S.isextreme)w[1]=qa(S.value,u),w[2]=z||S.isextreme?f.yAxis(S.value):p,s.addAxisGridLine.apply(s,
w);Q=A.plotLines[A.plotLines.length-1];S.isextreme?(Q.width=ia||D&&(!S.isMin||!l.showLine)?Q.width:.1,q&&(Q.label.text=p)):O&&Q.label&&(Q.label.text=p)}},getLogAxisLimits:function(a,b,c,d,f,e){var k=function(a){return null===a||void 0===a||""===a||isNaN(a)?!1:!0},g=0,s=[],h,l,A,m,p,n,q,O;k(c)&&Number(c)>=a?a=Number(c):(c=1<f?xa(Y(a)/Y(f)):ea(Y(a)/Y(f)),a=ua(f,c),l=c);l||(l=1<f?xa(Y(a)/Y(f)):ea(Y(a)/Y(f)));k(d)&&Number(d)<=b?b=Number(d):(c=1<f?ea(Y(b)/Y(f)):xa(Y(b)/Y(f)),b=ua(f,c),h=c);h||(h=1<f?ea(Y(b)/
Y(f)):xa(Y(b)/Y(f)));d=Number(String(Y(f)/Y(10)));e=Number(e)||(ea(d)==d?8:4);1<f?(A=l,m=h):0<f&&1>f&&(A=h,m=l);d=l;for(h=A;h>=m;--h)if(A=ua(f,d),b<=A&&a>=A&&(s[g++]={value:A,ismajor:!0}),h!=m){l=1<f?-1:1;A=ua(f,d)-ua(f,d+l);c=A/(e+1);for(k=1;k<=e;++k)A=ua(f,d+l)+c*k,b<=A&&a>=A&&(s[g++]={value:A,ismajor:!1});1<f?d--:d++}for(q in s)for(O in s[q])"value"==O&&(p||(p=s[q][O]==b&&(s[q].isextreme=s[q].isMin=!0)),n||(n=s[q][O]==a&&(s[q].isextreme=s[q].isMax=!0)));p||(s[g++]={value:b,ismajor:!0,isMin:!0,
isextreme:!0});n||(s[g]={value:a,ismajor:!0,isMax:!0,isextreme:!0});return{Max:a,Min:b,divArr:s}},pointValueWatcher:function(b,c,d){b=b[B];d=a(d,0);0<c&&(b[d]||(b[d]={}),d=b[d],d.max=d.max>c?d.max:c,d.min=d.min<c?d.min:c)}},Z.mslinebase);Ha=Z.singleseries;hb=Z.multiseries;Z("column2dbase",{point:function(c,d,k,s,f){var h=k.length,l=f[B],A=l.axisGridManager,m=f.xAxis,l=l.x,n=this.colorManager,q=/3d$/.test(f.chart.defaultSeriesType),O=this.isBar,u=/^spark/i.test(c);c=b(s.showplotborder,u||q?Da:$a)===
$a?q?1:a(s.plotborderthickness,1):0;var t=f.chart.useRoundEdges,Q=a(s.plotborderalpha,s.plotfillalpha,100),ca=b(s.plotbordercolor,n.getColor("plotBorderColor")).split(Fa)[0],u=u?"":a(s.useplotgradientcolor,1)?F(s.plotgradientcolor,n.getColor("plotGradientColor")):p,z=0,E=Boolean(a(s.use3dlighting,1)),S=f[B].numberFormatter,ia,D=a(s.plotborderdashed,0),va=a(s.plotborderdashlen,5),qa=a(s.plotborderdashgap,4),N,G,ma,I,H,J,ra,Ja,M,Sa,ha,Qa,P,ya;for(ma=0;ma<h;ma+=1)P=k[ma],P.vline?A.addVline(m,P,z,f):
(G=S.getCleanValue(P.value),ia=a(P.showlabel,s.showlabels,1),I=L(w(P.label,P.name)),N=b(P.color,n.getPlotColor()),H=b(P.alpha,s.plotfillalpha,Na),J=b(P.ratio,s.plotfillratio),ra=b(360-s.plotfillangle,O?180:90),Ja=b(P.alpha,Q),M=a(P.dashed,D),Sa=b(P.dashgap,qa),ha=b(P.dashlen,va),A.addXaxisCat(m,z,z,ia?I:p,P,{},s,N),z+=1,0>G&&(ra=O?180-ra:360-ra),ya={opacity:H/100},Qa=oa(N+Fa+u.replace(/,+?$/,""),H,J,ra,t,ca,Ja+p,O,q),ia=M?e(ha,Sa,c):"none",N=this.pointHoverOptions(P,d,{plotType:"column",is3d:q,isBar:O,
use3DLighting:E,isRoundEdged:t,color:N,gradientColor:u,alpha:H,ratio:J,angle:ra,borderWidth:c,borderColor:ca,borderAlpha:Ja,borderDashed:M,borderDashGap:Sa,borderDashLen:ha,shadow:ya}),d.data.push(g(this.getPointStub(P,G,I,f),{y:G,shadow:ya,color:Qa[0],borderColor:Qa[1],borderWidth:c,use3DLighting:E,dashStyle:ia,tooltipConstraint:this.tooltipConstraint,hoverEffects:N.enabled&&N.options,rolloverProperties:N.enabled&&N.rolloverOptions})),this.pointValueWatcher(f,G));l.catCount=z;return d},defaultSeriesType:"column"},
Ha);Z("linebase",{defaultSeriesType:"line",hasVDivLine:!0,defaultPlotShadow:1,point:function(c,d,k,s,f){var h,l,A,m,n,q,O,u,t,Q,ca,z,E,S,ia,D,va,qa,F,N,G,ma,I,J,ra,Ja;c=f.chart;var M=k.length,Sa=f.xAxis;h=f[B];var ha=this.colorManager,P,Qa=h.axisGridManager,ya=0,Ka=h.x,V=f[B].numberFormatter,Bb,Ya,gb;S=H(b(s.linecolor,s.palettecolors,ha.getColor("plotFillColor")));ia=b(s.linealpha,Na);ca=a(s.linethickness,this.lineThickness,4);z=Boolean(a(s.linedashed,0));O=a(s.linedashlen,5);u=a(s.linedashgap,4);
ra=a(s.anchorshadow,0);d.color={FCcolor:{color:S,alpha:ia}};d.lineWidth=ca;d.anchorShadow=ra;d.step=b(this.stepLine,d.step);d.drawVerticalJoins=Boolean(a(d.drawVerticalJoins,s.drawverticaljoins,1));d.useForwardSteps=Boolean(a(d.useForwardSteps,s.useforwardsteps,1));E=a(s.drawanchors,s.showanchors);for(l=0;l<M;l+=1)m=k[l],m.vline?Qa.addVline(Sa,m,ya,f):(h=V.getCleanValue(m.value),n=a(m.showlabel,s.showlabels,1),A=L(w(m.label,m.name)),Qa.addXaxisCat(Sa,ya,ya,n?A:p,m,{},s),ya+=1,t=H(b(m.color,S)),Q=
a(m.alpha,ia),n=a(m.dashed,z)?e(O,u,ca):"none",q={opacity:Q/100},va=a(m.anchorsides,s.anchorsides,0),J=a(m.anchorstartangle,s.anchorstartangle,90),N=a(m.anchorradius,s.anchorradius,this.anchorRadius,3),F=H(b(m.anchorbordercolor,s.anchorbordercolor,S)),qa=a(m.anchorborderthickness,s.anchorborderthickness,this.anchorBorderThickness,1),G=H(b(m.anchorbgcolor,s.anchorbgcolor,ha.getColor("anchorBgColor"))),ma=b(m.anchoralpha,s.anchoralpha,Na),I=b(m.anchorbgalpha,s.anchorbgalpha,ma),Bb=b(m.anchorimageurl,
s.anchorimageurl),Ya=b(m.anchorimagescale,s.anchorimagescale,100),gb=b(m.anchorimagealpha,s.anchorimagealpha,100),D=void 0===E?0!==Q:!!E,Ja=Boolean(a(m.anchorshadow,ra,0)),P=this.pointHoverOptions(m,d,{plotType:"anchor",anchorBgColor:G,anchorAlpha:ma,anchorBgAlpha:I,anchorAngle:J,anchorBorderThickness:qa,anchorBorderColor:F,anchorBorderAlpha:ma,anchorSides:va,anchorRadius:N,imageUrl:Bb,imageScale:Ya,imageAlpha:gb,shadow:q}),d.data.push(g(this.getPointStub(m,h,A,f),{y:h,color:{FCcolor:{color:t,alpha:Q}},
shadow:q,dashStyle:n,valuePosition:b(m.valueposition,c.valuePosition),marker:{enabled:!!D,shadow:Ja&&{opacity:ma/100},fillColor:{FCcolor:{color:G,alpha:I*ma/100+p}},lineColor:{FCcolor:{color:F,alpha:ma}},lineWidth:qa,radius:N,startAngle:J,symbol:Ma(va),imageUrl:Bb,imageScale:Ya,imageAlpha:gb},tooltipConstraint:this.tooltipConstraint,hoverEffects:P.enabled&&P.options,rolloverProperties:P.enabled&&P.rolloverOptions})),this.pointValueWatcher(f,h));Ka.catCount=ya;return d},defaultZeroPlaneHighlighted:!1},
Ha);Z("area2dbase",{defaultSeriesType:"area",hasVDivLine:!0,point:function(c,d,k,s,f){c=f.chart;var h=k.length,l=f.xAxis,A=f[B],m=A.axisGridManager,A=A.x,n=f[B].numberFormatter,O=this.colorManager,u=0,t,Q,ca,z,E,S,ia,D,va,qa,N,G,ma,I,J,ra,Ja,M,Sa,ha,ya,Qa,Ka,V,Bb,Ya,gb,Ta;E=b(s.plotfillcolor,s.areabgcolor,P(s.palettecolors)?O.getPlotColor(0):O.getColor("plotFillColor")).split(/\s*\,\s*/)[0];ya=Fa+(a(s.useplotgradientcolor,1)?F(s.plotgradientcolor,O.getColor("plotGradientColor")):p);S=b(s.plotfillalpha,
s.areaalpha,this.isStacked?Na:"90");ia=a(s.plotfillangle,270);D=b(s.plotbordercolor,s.areabordercolor,P(s.palettecolors)?O.getPlotColor(0):O.getColor("plotBorderColor")).split(/\s*\,\s*/)[0];va=s.showplotborder==Da?Da:b(s.plotborderalpha,s.plotfillalpha,s.areaalpha,Na);t=a(s.plotborderangle,270);Q=Boolean(a(s.plotborderdashed,0));ca=a(s.plotborderdashlen,5);ma=a(s.plotborderdashgap,4);Ja=a(s.plotborderthickness,s.areaborderthickness,1);Qa=d.fillColor={FCcolor:{color:E+ya.replace(/,+?$/,""),alpha:S,
ratio:Wa,angle:ia}};d.lineWidth=Ja;d.dashStyle=Q?e(ca,ma,Ja):"none";d.lineColor={FCcolor:{color:D,alpha:va,ratio:Na,angle:t}};d.step=b(this.stepLine,d.step);d.drawVerticalJoins=Boolean(a(d.drawVerticalJoins,s.drawverticaljoins,1));d.useForwardSteps=Boolean(a(d.useForwardSteps,s.useforwardsteps,1));Ja=Boolean(a(s.drawanchors,s.showanchors,1));d.anchorShadow=Ka=a(s.anchorshadow,0);for(Q=0;Q<h;Q+=1)ma=k[Q],ma.vline?m.addVline(l,ma,u,f):(t=n.getCleanValue(ma.value),z=a(ma.showlabel,s.showlabels,1),ca=
L(w(ma.label,ma.name)),m.addXaxisCat(l,u,u,z?ca:p,ma,{},s),u+=1,z=a(ma.anchorsides,s.anchorsides,0),G=a(ma.anchorstartangle,s.anchorstartangle,90),qa=a(ma.anchorradius,s.anchorradius,3),N=H(b(ma.anchorbordercolor,s.anchorbordercolor,D)),M=a(ma.anchorborderthickness,s.anchorborderthickness,1),I=H(b(ma.anchorbgcolor,s.anchorbgcolor,O.getColor("anchorBgColor"))),J=b(ma.anchoralpha,s.anchoralpha,this.anchorAlpha,Da),ra=b(ma.anchorbgalpha,s.anchorbgalpha,J),V=Boolean(a(ma.anchorshadow,Ka,0)),Sa=P(ma.color),
ha=a(ma.alpha),Sa=void 0!==Sa||void 0!==ha?{FCcolor:{color:Sa?H(Sa)+ya:E,alpha:void 0===ha?q(ha)+p:S,ratio:Wa,angle:ia}}:Qa,Bb=b(ma.anchorimageurl,s.anchorimageurl),Ya=b(ma.anchorimagescale,s.anchorimagescale,100),gb=b(ma.anchorimagealpha,s.anchorimagealpha,100),ha={opacity:U(ha,va)/100,inverted:!0},Ta=this.pointHoverOptions(ma,d,{plotType:"anchor",anchorBgColor:I,anchorAlpha:J,anchorBgAlpha:ra,anchorAngle:G,anchorBorderThickness:M,anchorBorderColor:N,anchorBorderAlpha:J,anchorSides:z,anchorRadius:qa,
imageUrl:Bb,imageScale:Ya,imageAlpha:gb,shadow:ha}),d.data.push(g(this.getPointStub(ma,t,ca,f),{y:t,shadow:ha,color:Sa,valuePosition:b(ma.valueposition,c.valuePosition),marker:{enabled:Ja,shadow:V&&{opacity:J/100},fillColor:{FCcolor:{color:I,alpha:ra*J/100+p}},lineColor:{FCcolor:{color:N,alpha:J}},lineWidth:M,radius:qa,symbol:Ma(z),startAngle:G,imageUrl:Bb,imageScale:Ya,imageAlpha:gb},tooltipConstraint:this.tooltipConstraint,previousY:this.pointValueWatcher(f,t),hoverEffects:Ta.enabled&&Ta.options,
rolloverProperties:Ta.enabled&&Ta.rolloverOptions})));A.catCount=u;return d}},Ha);Z("mscolumn2dbase",{point:function(c,d,e,k,f,g,s,h,l){c=a(k.ignoreemptydatasets,0);var A=!1,m=e.data||[],n=f[B],q=b(d.type,this.defaultSeriesType),O=b(d.isStacked,f.plotOptions[q]&&f.plotOptions[q].stacking),u=b(this.isValueAbs,n.isValueAbs,!1),t=a(d.yAxis,0),Q=f[B].numberFormatter,ca=this.colorManager,z=ca.getPlotColor(),w,E=f._FCconf.isBar,S=d.hoverEffects;O||(d.columnPosition=a(l,h,s));d.name=P(e.seriesname);if(0===
a(e.includeinlegend)||void 0===d.name)d.showInLegend=!1;d.color=b(e.color,z).split(Fa)[0].replace(/^#?/g,"#");s=/3d$/.test(f.chart.defaultSeriesType);l=b(360-k.plotfillangle,E?180:90);0>w&&(l=360-l);e=d._dataParser=Pb.column(f,{seriesname:d.name,plottooltext:e.plottooltext,color:b(e.color,z),alpha:b(e.alpha,k.plotfillalpha,Na),plotgradientcolor:a(k.useplotgradientcolor,1)?F(k.plotgradientcolor,ca.getColor("plotGradientColor")):p,ratio:b(e.ratio,k.plotfillratio),fillAangle:l,isRoundEdges:f.chart.useRoundEdges,
plotBorderColor:b(k.plotbordercolor,s?mb:ca.getColor("plotBorderColor")).split(Fa)[0],plotBorderAlpha:k.showplotborder==Da||s&&k.showplotborder!=$a?Da:b(k.plotborderalpha,Na),isBar:this.isBar,is3d:s,dashed:a(e.dashed,k.plotborderdashed,0),dashLen:a(e.dashlen,k.plotborderdashlen,5),dashGap:a(e.dashgap,k.plotborderdashgap,4),borderWidth:a(k.plotborderthickness,$a),showValues:a(e.showvalues,n.showValues),yAxis:t,use3DLighting:a(k.use3dlighting,1),_sourceDataset:e,hoverEffects:S},this);for(k=0;k<g;k+=
1)(n=m[k])?(w=Q.getCleanValue(n.value,u),null===w?d.data.push({y:null}):(A=!0,n=e(n,k,w),d.data.push(n),n.previousY=this.pointValueWatcher(f,w,t,O,k,h,q))):d.data.push({y:null});!c||A||this.realtimeEnabled||(d.showInLegend=!1);return d},defaultSeriesType:"column"},hb);Z("mslinebase",{hasVDivLine:!0,point:function(c,d,e,k,f,g){c=a(k.ignoreemptydatasets,0);var s=!1,h=this.colorManager,l,A;l=f.chart;var m=e.data||[];A=f[B];var n=b(d.type,this.defaultSeriesType),q=b(d.isStacked,f.plotOptions[n]&&f.plotOptions[n].stacking),
O=b(this.isValueAbs,A.isValueAbs,!1),u=a(d.yAxis,0),t=this.numberFormatter,Q=H(b(e.color,k.linecolor,h.getPlotColor())),ca=a(e.alpha,k.linealpha,Na),z=a(k.showshadow,this.defaultPlotShadow,1),w=a(e.drawanchors,e.showanchors,k.drawanchors,k.showanchors),E=a(e.anchorsides,k.anchorsides,0),S=a(e.anchorstartangle,k.anchorstartangle,90),ia=a(e.anchorradius,k.anchorradius,3),D=H(b(e.anchorbordercolor,k.anchorbordercolor,Q)),va=a(e.anchorborderthickness,k.anchorborderthickness,1),h=H(b(e.anchorbgcolor,k.anchorbgcolor,
h.getColor("anchorBgColor"))),qa=b(e.anchoralpha,k.anchoralpha,Na),ma=b(e.anchorbgalpha,k.anchorbgalpha,qa),F=qa&&b(e.anchorshadow,k.anchorshadow,0),N=d.hoverEffects;d.name=P(e.seriesname);if(0===a(e.includeinlegend)||void 0===d.name||0===ca&&1!==w)d.showInLegend=!1;d.marker={enabled:Boolean(a(w,1)),fillColor:{FCcolor:{color:h,alpha:ma*qa/100+p}},lineColor:{FCcolor:{color:D,alpha:qa+p}},lineWidth:va,radius:ia,symbol:Ma(E),startAngle:S};d.color={FCcolor:{color:Q,alpha:ca}};d.shadow=z?{opacity:z?ca/
100:0}:!1;d.anchorShadow=F;d.step=b(this.stepLine,d.step);d.drawVerticalJoins=Boolean(a(d.drawVerticalJoins,k.drawverticaljoins,1));d.useForwardSteps=Boolean(a(d.useForwardSteps,k.useforwardsteps,1));d.lineWidth=a(e.linethickness,k.linethickness,2);l=d._dataParser=Pb.line(f,{seriesname:d.name,plottooltext:e.plottooltext,lineAlpha:ca,anchorAlpha:qa,showValues:a(e.showvalues,A.showValues),yAxis:u,lineDashed:Boolean(a(e.dashed,k.linedashed,0)),lineDashLen:a(e.linedashlen,k.linedashlen,5),lineDashGap:a(e.linedashgap,
k.linedashgap,4),lineThickness:d.lineWidth,lineColor:Q,valuePosition:b(e.valueposition,l.valuePosition),drawAnchors:w,anchorBgColor:h,anchorBgAlpha:ma,anchorBorderColor:D,anchorBorderThickness:va,anchorRadius:ia,anchorSides:E,anchorAngle:S,anchorShadow:d.anchorShadow,anchorStartAngle:a(e.anchorstartangle,k.anchorstartangle),_sourceDataset:e,hoverEffects:N,imageUrl:b(e.anchorimageurl,k.anchorimageurl),imageScale:b(e.anchorimagescale,k.anchorimagescale,100),imageAlpha:b(e.anchorimagealpha,k.anchorimagealpha,
100)},this);for(k=0;k<g;k+=1)(A=m[k])?(e=t.getCleanValue(A.value,O),null===e?d.data.push({y:null}):(s=!0,A=l(A,k,e),d.data.push(A),A.previousY=this.pointValueWatcher(f,e,u,q,k,0,n))):d.data.push({y:null});!c||s||this.realtimeEnabled||(d.showInLegend=!1);return d},defaultSeriesType:"line",defaultPlotShadow:1,defaultZeroPlaneHighlighted:!1},hb);Z("msareabase",{hasVDivLine:!0,point:function(c,d,k,g,f,s){c=a(g.ignoreemptydatasets,0);var h=!1,l=f.chart,A=k.data||[],m=f[B],n=b(d.type,this.defaultSeriesType),
q=b(d.isStacked,f.plotOptions[n]&&f.plotOptions[n].stacking),O=b(this.isValueAbs,m.isValueAbs,!1),u=a(d.yAxis,0),t=f[B].numberFormatter,Q=this.colorManager,ca=Q.getPlotColor(),z=b(k.color,g.plotfillcolor,ca).split(Fa)[0].replace(/^#?/g,"#").split(Fa)[0],w=b(k.alpha,g.plotfillalpha,g.areaalpha,this.areaAlpha,70),E=a(g.plotfillangle,270),ca=b(k.plotbordercolor,g.plotbordercolor,g.areabordercolor,this.isRadar?ca:"666666").split(Fa)[0],S=b(k.showplotborder,g.showplotborder)==Da?Da:b(k.plotborderalpha,
g.plotborderalpha,k.alpha,g.plotfillalpha,g.areaalpha,"95"),ia=a(g.plotborderangle,270),D=a(k.anchorsides,g.anchorsides,0),va=a(k.anchorstartangle,g.anchorstartangle,90),qa=a(k.anchorradius,g.anchorradius,3),ma=H(b(k.anchorbordercolor,g.anchorbordercolor,z)),N=a(k.anchorborderthickness,g.anchorborderthickness,1),G=H(b(k.anchorbgcolor,g.anchorbgcolor,Q.getColor("anchorBgColor"))),I=a(k.anchoralpha,g.anchoralpha,this.anchorAlpha,0),J=a(k.anchorbgalpha,g.anchorbgalpha,I),ra=I&&b(k.anchorshadow,g.anchorshadow,
0),Ja=d.hoverEffects;this.isRadar||(z+=Fa+(a(g.useplotgradientcolor,1)?F(g.plotgradientcolor,Q.getColor("plotGradientColor")):p),z=z.replace(/,+?$/,""));d.step=b(this.stepLine,d.step);d.drawVerticalJoins=Boolean(a(d.drawVerticalJoins,g.drawverticaljoins,1));d.useForwardSteps=Boolean(a(d.useForwardSteps,g.useforwardsteps,1));d.name=b(k.seriesname);if(0===a(k.includeinlegend)||void 0===d.name)d.showInLegend=!1;d.fillColor={FCcolor:{color:z,alpha:w,ratio:Wa,angle:E}};d.color=z;d.shadow={opacity:a(g.showshadow,
1)?S/100:0};d.anchorShadow=ra;d.lineColor={FCcolor:{color:ca,alpha:S,ratio:Na,angle:ia}};d.lineWidth=b(k.plotborderthickness,g.plotborderthickness,1);d.dashStyle=Boolean(a(k.dashed,g.plotborderdashed,0))?e(a(k.dashlen,g.plotborderdashlen,5),a(k.dashgap,g.plotborderdashgap,4),d.lineWidth):void 0;d.marker={fillColor:{FCcolor:{color:G,alpha:J*I/100+p}},lineColor:{FCcolor:{color:ma,alpha:I+p}},lineWidth:N,radius:qa,symbol:Ma(D),startAngle:va};k=d._dataParser=Pb.area(f,{seriesname:d.name,plottooltext:k.plottooltext,
lineAlpha:S,anchorAlpha:I,showValues:a(k.showvalues,m.showValues),yAxis:u,fillColor:z,fillAlpha:w,valuePosition:b(k.valueposition,l.valuePosition),drawAnchors:Boolean(a(k.drawanchors,g.drawanchors,g.showanchors,1)),anchorBgColor:G,anchorBgAlpha:J,anchorBorderColor:ma,anchorBorderThickness:N,anchorRadius:qa,anchorSides:D,anchorAngle:va,anchorShadow:d.anchorShadow,getLink:this.linkClickFN,anchorStartAngle:a(k.anchorstartangle,g.anchorstartangle),_sourceDataset:k,hoverEffects:Ja,imageUrl:b(k.anchorimageurl,
g.anchorimageurl),imageScale:b(k.anchorimagescale,g.anchorimagescale,100),imageAlpha:b(k.anchorimagealpha,g.anchorimagealpha,100)},this);for(l=0;l<s;l+=1)(m=A[l])?(g=m?t.getCleanValue(m.value,O):null,null===g?d.data.push({y:null}):(h=!0,m=k(m,l,g),d.data.push(m),m.previousY=this.pointValueWatcher(f,g,u,q,l,0,n))):d.data.push({y:null});!c||h||this.realtimeEnabled||(d.showInLegend=!1);return d},defaultSeriesType:"area",defaultPlotShadow:0},hb);Z("scatterbase",{showValues:0,defaultPlotShadow:0,rendererId:"cartesian",
defaultSeriesType:"scatter",canvasPaddingModifiers:["anchorlabel"],point:function(c,d,k,g,f,s,h){c=a(g.ignoreemptydatasets,0);var l=this.colorManager,A=l.getPlotColor(),m,n,O,u,t,Q,ca,z,w,E,S,ia,D,va,qa,ma,F,N,I;s=!1;var J,ra;t=a(k.drawline,g.drawlines,0);Q=a(k.drawprogressioncurve,0);u=k.data||[];var Ja,M,Sa,ha,L,ya=a(k.showvalues,f[B].showValues),Qa=this.numberFormatter,Ka,V=d._showRegression=a(k.showregressionline,g.showregressionline,0);d.zIndex=1;d.name=P(k.seriesname);if(0===a(k.includeinlegend)||
void 0===d.name)d.showInLegend=!1;if(t||Q)O=H(b(k.color,A)),u=b(k.alpha,Na),t=a(k.linethickness,g.linethickness,2),Q=Boolean(a(k.linedashed,k.dashed,g.linedashed,0)),ca=a(k.linedashlen,g.linedashlen,5),z=a(k.linedashgap,g.linedashgap,4),d.color=G(b(k.linecolor,g.linecolor,O),a(k.linealpha,g.linealpha,u)),d.lineWidth=t,d.dashStyle=Q?e(ca,z,t):"none";t=Boolean(a(k.drawanchors,k.showanchors,g.drawanchors,g.showanchors,1));h=a(k.anchorsides,g.anchorsides,h+3);Q=a(k.anchorradius,g.anchorradius,3);O=H(b(k.anchorbordercolor,
k.color,g.anchorbordercolor,O,A));A=a(k.anchorborderthickness,g.anchorborderthickness,1);ca=H(b(k.anchorbgcolor,g.anchorbgcolor,l.getColor("anchorBgColor")));z=b(k.anchoralpha,k.alpha,g.anchoralpha,Na);S=b(k.anchorbgalpha,k.alpha,g.anchorbgalpha,z);J=b(k.anchorstartangle,g.anchorstartangle,90);d.anchorShadow=l=a(g.anchorshadow,0);d.marker={fillColor:this.getPointColor(ca,Na),lineColor:{FCcolor:{color:O,alpha:z+p}},lineWidth:A,radius:Q,symbol:Ma(h)};u=k.data||[];L=u.length;V&&(d.events={hide:this.hideRLine,
show:this.showRLine},Ja={sumX:0,sumY:0,sumXY:0,sumXsqure:0,sumYsqure:0,xValues:[],yValues:[]},ha=a(k.showyonx,g.showyonx,1),M=H(b(k.regressionlinecolor,g.regressionlinecolor,O)),Sa=a(k.regressionlinethickness,g.regressionlinethickness,A),m=q(a(k.regressionlinealpha,g.regressionlinealpha,z)),M=G(M,m));for(n=0;n<L;n+=1)(w=u[n])?(m=Qa.getCleanValue(w.y),I=Qa.getCleanValue(w.x),null===m?d.data.push({y:null,x:I}):(s=!0,ra=this.getPointStub(w,m,Qa.xAxis(I),f,k,ya),ia=a(w.anchorsides,h),D=a(w.anchorradius,
Q),va=H(b(w.anchorbordercolor,O)),qa=a(w.anchorborderthickness,A),ma=H(b(w.anchorbgcolor,ca)),F=b(w.anchoralpha,w.alpha,z),N=b(w.anchorbgalpha,S),E=Boolean(a(w.anchorshadow,l,0)),Ka=this.pointHoverOptions(w,d,{plotType:"anchor",anchorBgColor:ma,anchorAlpha:F,anchorBgAlpha:N,anchorAngle:J,anchorBorderThickness:qa,anchorBorderColor:va,anchorBorderAlpha:F,anchorSides:ia,anchorRadius:D,shadow:void 0}),d.data.push({y:m,x:I,displayValue:ra.displayValue,toolText:ra.toolText,link:ra.link,marker:{enabled:t,
shadow:E&&{opacity:F/100},fillColor:{FCcolor:{color:ma,alpha:N*F/100+p}},lineColor:{FCcolor:{color:va,alpha:F}},lineWidth:qa,radius:D,symbol:Ma(ia),startAngle:b(w.anchorstartangle,k.anchorstartangle,g.anchorstartangle,90)},hoverEffects:Ka.enabled&&Ka.options,rolloverProperties:Ka.enabled&&Ka.rolloverOptions}),this.pointValueWatcher(f,m,I,V&&Ja))):d.data.push({y:null});V&&(k=this.getRegressionLineSeries(Ja,ha,L),this.pointValueWatcher(f,k[0].y,k[0].x),this.pointValueWatcher(f,k[1].y,k[1].x),f={type:"line",
color:M,showInLegend:!1,lineWidth:Sa,enableMouseTracking:!1,marker:{enabled:!1},data:k,zIndex:0},d=[d,f]);c&&!s&&(d.showInLegend=!1);return d},postSeriesAddition:function(b,c){for(var d=b.chart,k=c.chart,f=b.series,e=0,g=f.length;e<g;e+=1)f[e]._showRegression&&(f[e].relatedSeries=[e+1]);d.clipBubbles=a(k.clipbubbles,1)},categoryAdder:function(c,d){var k,g=0,f,s=d[B].x,h,l=d.xAxis,A,m,n=c.chart,q=parseInt(n.labelstep,10),O=a(n.showlabels,1),u=b(n.xaxislabelmode,"categories").toLowerCase(),t=this.colorManager,
Q=d[B].numberFormatter,ca,z,E,S,ia,D;d._FCconf.isXYPlot=!0;q=1<q?q:1;s.catOccupied={};if("auto"!==u&&c.categories&&c.categories[0]&&c.categories[0].category){m=c.categories[0];m.font&&(d.xAxis.labels.style.fontFamily=m.font);void 0!==(f=a(m.fontsize))&&(1>f&&(f=1),d.xAxis.labels.style.fontSize=f+Ba,M(d.xAxis.labels.style));m.fontcolor&&(d.xAxis.labels.style.color=m.fontcolor.split(Fa)[0].replace(/^\#?/,"#"));k=b(m.verticallinecolor,t.getColor("divLineColor"));f=a(m.verticallinethickness,1);h=a(m.verticallinealpha,
t.getColor("divLineAlpha"));t=a(m.verticallinedashed,0);ca=a(m.verticallinedashlen,4);z=a(m.verticallinedashgap,2);E=G(k,h);for(k=0;k<m.category.length;k+=1)S=m.category[k],h=Q.getCleanValue(S.x),null===h||S.vline||(s.catOccupied[h]=!0,A=a(S.showlabel,S.showname,O),ia=a(S.showverticalline,S.showline,S.sl,0),D=a(S.linedashed,t),A=0===A||0!==g%q?p:L(w(S.label,S.name)),l.plotLines.push({isGrid:!0,isCat:!0,isDataLabel:!0,width:ia?f:0,color:E,dashStyle:e(ca,z,f,D),value:h,label:{text:A,link:b(S.link,n.labellink),
style:aa({},S,n,l.labels.style),align:La,verticalAlign:na,textAlign:La,rotation:0,x:0,y:0}}),this.pointValueWatcher(d,null,h),g+=1);"mixed"===u&&(s.requiredAutoNumericLabels=a(this.requiredAutoNumericLabels,1))}else s.requiredAutoNumericLabels=a(this.requiredAutoNumericLabels,1);s.adjustMinMax=!0},getPointColor:function(a,b){var c,d;a=H(a);b=q(b);c=W(a,70);d=J(a,50);return{FCcolor:{gradientUnits:"objectBoundingBox",cx:.4,cy:.4,r:"100%",color:c+Fa+d,alpha:b+Fa+b,ratio:Wa,radialGradient:!0}}}},Z.xybase);
Z("mscombibase",{canvasPaddingModifiers:["anchor","anchorlabel"],series:function(d,k,e){var g,f,s,h,l=d.chart,A,m=[],n=[],p=[],q,O,u=k[B],t=this.isDual,Q=0,ca;k.legend.enabled=Boolean(a(d.chart.showlegend,1));if(d.dataset&&0<d.dataset.length){this.categoryAdder(d,k);h=u.oriCatTmp.length;g=0;for(f=d.dataset.length;g<f;g+=1)switch(s=d.dataset[g],q=t&&"s"===b(s.parentyaxis,"p").toLowerCase()?!0:!1,A={hoverEffects:this.parseSeriesHoverOptions(d,k,s,e),visible:!a(s.initiallyhidden,0),legendIndex:g,data:[]},
q?(A.yAxis=1,O=w(s.renderas,this.secondarySeriesType),this.secondarySeriesFilter&&(ca=this.secondarySeriesFilter[O])):(O=w(s.renderas,this.defaultSeriesType),this.defaultSeriesFilter&&(ca=this.defaultSeriesFilter[O])),O=O.toLowerCase(),O){case "line":case "spline":A.type=!0===ca?O:"line";m.push(Z.mslinebase.point.call(this,e,A,s,l,k,h,g));break;case "area":case "splinearea":A.type=!0===ca?O:"area";k.chart.series2D3Dshift=!0;p.push(Z.msareabase.point.call(this,e,A,s,l,k,h,g));break;case "column":case "column3d":n.push(Z.mscolumn2dbase.point.call(this,
e,A,d.dataset[g],l,k,h,g,void 0,Q));Q+=1;break;default:q?(A.type="line",m.push(Z.mslinebase.point.call(this,e,A,s,l,k,h,g))):(n.push(Z.mscolumn2dbase.point.call(this,e,A,d.dataset[g],l,k,h,g,void 0,Q)),Q+=1)}"0"!==l.areaovercolumns?(k.chart.areaOverColumns=!0,k.series=k.series.concat(n,p,m)):(k.chart.areaOverColumns=!1,k.series=k.series.concat(p,n,m));if(0===n.length&&1!==h)u.hasNoColumn=!0;else if(!this.isStacked)for(e=0,g=n.length;e<g;e+=1)n[e].numColumns=g;this.configureAxis(k,d);d.trendlines&&
c(d.trendlines,k.yAxis,k[B],t,this.isBar)}}},Z.mscolumn2dbase)}]);
FusionCharts.register("module",["private","modules.renderer.js-renderer",function(){function d(a,b,c,d){var e=b.paper,g=b.layers,h=c?"y-axis":"x-axis",l=this.layerAboveDataset=g.layerAboveDataset,m=this.layerBelowDataset=g.layerBelowDataset,g=l.bands||(l.bands=[]),n=g.length,p=m.bands||(m.bands=[]),q=p.length,u=l.lines||(l.lines=[]),t=u.length,B=m.lines||(m.lines=[]),z=B.length,l=l.labels||(l.labels=[]),w=l.length,m=m.labels||(m.labels=[]),E=m.length;this.renderer=b;this.axisData=a||{};this.globalOptions=
b.options;this.isVertical=c;this.topBandGroup=this.topBandGroup||e.group(h+"-bands",this.layerAboveDataset);this.belowBandGroup=this.belowBandGroup||e.group(h+"-bands",this.layerBelowDataset);g.push(this.topBandGroup);n&&g[n].insertAfter(g[n-1]);p.push(this.belowBandGroup);q&&p[q].insertAfter(p[q-1]);this.topLineGroup=this.topLineGroup||e.group(h+"-lines",this.layerAboveDataset);this.belowLineGroup=this.belowLineGroup||e.group(h+"-lines",this.layerBelowDataset);this.topLabelGroup=this.topLabelGroup||
e.group(h+"-labels",this.layerAboveDataset);this.belowLabelGroup=this.belowLabelGroup||e.group(h+"-labels",this.layerBelowDataset);u.push(this.topLineGroup);t&&u[t].insertAfter(u[t-1]);B.push(this.belowLineGroup);z&&B[z].insertAfter(B[z-1]);l.push(this.topLabelGroup);w&&l[w].insertAfter(l[w-1]);m.push(this.belowLabelGroup);E&&m[E].insertAfter(m[E-1]);this.isReverse=d;this.configure()}function h(a,b,c,d){return aa(b-c[1]-d.top,a-c[0]-d.left)}function D(a,b){var c=b?360:Ba;a=(a||0)%c;return 0>a?c+a:
a}var z=this,p=z.window,c=z.hcLib,I=c.Raphael,b=c.chartAPI,P=/msie/i.test(p.navigator.userAgent)&&!p.opera,a=p.document,w=p.Image,F="VML"===I.type,L=c.BLANKSTRING,B="rgba(192,192,192,"+(P?.002:1E-6)+")",P=c.TOUCH_THRESHOLD_PIXELS,g=c.CLICK_THRESHOLD_PIXELS,e=c.stubFN,l={pageX:0,pageY:0},m=parseFloat,N=parseInt,E=c.extend2,n=c.addEvent,V=c.getMouseCoordinate,t=c.removeEvent,X=c.pluck,u=c.pluckNumber,ga=c.toRaphaelColor,U=c.setImageDisplayMode,ka=c.FC_CONFIG_STRING,xa=c.plotEventHandler,ea=c.isArray,
Y=c.each=function(a,b,c,d){var e;c||(c=a);d||(d={});if(ea(a))for(e=0;e<a.length;e+=1){if(!1===b.call(c,a[e],e,a,d))return e}else if(null!==a&&void 0!==a)for(e in a)if(!1===b.call(c,a[e],e,a,d))return e},ua=c.createElement,ba=c.createContextMenu,da=c.hasTouch,oa=da?P:g,H=c.getSentenceCase,M=c.getCrispValues,T=c.getValidValue,q=c.getFirstValue,J=c.regex.dropHash,W=c.HASHSTRING,G=function(a){return a!==La&&null!==a},ja=function(a,b){a[1]===a[4]&&(a[1]=a[4]=Z(a[1])+b%2/2);a[2]===a[5]&&(a[2]=a[5]=Z(a[2])+
b%2/2);return a},La,Ca=8===a.documentMode?"visible":"",na=p.Math,pa=na.sin,za=na.cos,aa=na.atan2,Z=na.round,Ma=na.min,Ha=na.max,hb=na.abs,Fa=na.ceil,Za=na.floor,Da=180/na.PI,$a=na.PI,Na=$a/2,Ba=2*$a,Cb=$a+Na,Jb=c.getFirstColor,Qb=c.graphics.getLightColor,ub=c.POSITION_TOP,Wa=c.POSITION_BOTTOM,mb=c.POSITION_RIGHT,Ua=c.POSITION_LEFT;I.ca.ishot=function(a){if(this.removed)return!1;var b=this.node;a=a||"";b.ishot=a;switch(this.type){case "group":for(b=this.bottom;b;)b.attr("ishot",a),b=b.next;break;case "text":if(I.svg)for(b=
b.getElementsByTagName("tspan")[0];b;)b.ishot=a,b=b.nextSibling}return!1};I.addSymbol({printIcon:function(a,b,c){var d=.75*c,e=.5*c,g=.33*c,h=Z(a-c)+.5,l=Z(b-c)+.5,m=Z(a+c)+.5;c=Z(b+c)+.5;var n=Z(a-d)+.5,p=Z(b-d)+.5,d=Z(a+d)+.5,q=Z(b+e)+.5,u=Z(a+e)+.5,t=Z(b+g)+.5;a=Z(a-e)+.5;g=Z(b+g+g)+.5;return["M",n,l,"L",d,l,d,p,n,p,"Z","M",h,p,"L",h,q,n,q,n,b,d,b,d,q,m,q,m,p,"Z","M",n,b,"L",n,c,d,c,d,b,"Z","M",u,t,"L",a,t,"M",u,g,"L",a,g]},exportIcon:function(a,b,c){var d=.66*c,e=.5*d,g=Z(a-c)+.5,h=Z(b-c)+.5,
l=Z(a+c)+.5;c=Z(b+c)-.5;var m=Z(a-e)+.5,n=b<c-3?c-3:Z(b)+.5,e=Z(a+e)-.5,p=Z(a+d)-.5,d=Z(a-d)+.5;return["M",g,n,"L",g,c,l,c,l,n,l,c,g,c,"Z","M",a,c-1,"L",d,b,m,b,m,h,e,h,e,b,p,b,"Z"]}});c.rendererRoot=b("renderer.root",{standaloneInit:!1,isRenderer:!0,inited:!1,callbacks:[],init:function(a,b,c){var d=this,e=d.container=a&&a.containerElement||b.chart.renderTo,g=b.tooltip,h=d.layer,l,m;d.options=b;d.logic=a;d.definition=a.dataObj;d.smartLabel=a.smartLabel;d.numberFormatter=a.numberFormatter;d.fusionCharts=
a.chartInstance;d.linkClickFN=a.linkClickFN;m=(l=b.chart)&&l.animation&&l.animation.duration;d.animationCompleteQueue=[];e.innerHTML=L;e=d.paper=d.fusionCharts.jsVars.paper=new I(e,e.offsetWidth||a.width,e.offsetHeight||a.height);!1!==z.core.options._useSVGDescTag&&e._desc&&(l=a.friendlyName||"Vector image",d.definition&&d.definition.chart&&d.definition.chart.caption&&(l+=' with caption "'+d.definition.chart.caption+'"'),e._desc(l));d.chartWidth=e.width;d.chartHeight=e.height;d.elements||(d.elements=
{});h||(h=d.layers={},h.background=h.background||e.group("background"),h.dataset=h.dataset||e.group("dataset").insertAfter(h.background),h.tracker=h.tracker||e.group("hot").insertAfter(h.dataset));g&&!1!==g.enabled&&(e.tooltip(g.style,g.shadow,g.constrain),h.tracker.trackTooltip(!0),h.dataset.trackTooltip(!0));d.disposeChartStyleSheet();d.setMargins();d.drawBackground();d.drawButtons();d.drawGraph();b.legend&&b.legend.enabled&&d.drawLegend();d.drawCaption();d.drawLogo();d.setChartEvents();d.drawLabels&&
d.drawLabels();Y(b.callbacks,function(a){a.apply(d,this)},[a]);Y(d.callbacks,function(a){a.apply(d,this)},[a]);d.fusionCharts.annotations&&d.fusionCharts.annotations.draw(d);d.createChartStyleSheet();d.options.nativeMessage||m||z.raiseEvent("internal.animationComplete",{},d.fusionCharts);d.hasRendered=!0;c&&c(d)},disposeChartStyleSheet:function(){this.paper.cssClear()},createChartStyleSheet:function(){this.paper.cssRender()},addCSSDefinition:function(a,b){var c=this.paper;b.color&&(b.fill=b.color);
c.cssAddRule(a,b)},animationCompleteQueue:[],animationComplete:function(){var a,b,c,d;this.animatedElements=this.animatedElements?++this.animatedElements:1;if(this.animatedElements===this.animatingElementsCount){c=this.animationCompleteQueue;a=0;for(b=c.length;a<b;a++)d=c[a],d.fn&&d.fn.call(d.scope);this.animationCompleteQueue=[];z.raiseEvent("internal.animationComplete",{},this.fusionCharts)}},getAnimationCompleteFn:function(){var a=this;a.animatingElementsCount=a.animatingElementsCount?++a.animatingElementsCount:
1;return function(){a.animationComplete()}},reinit:function(a,b,c){this.hasRendered||this.init(b,c)},dispose:function(){var a=this.eventListeners,b=a&&a.length;this.disposing=!0;if(b)for(;b--;)a[b].unlisten();if(this.toolbar&&this.toolbar.length){for(;this.toolbar.length;)a=this.toolbar.pop(),a.remove();this.toolbar.add=null}if(this.menus&&this.menus.length)for(;this.menus.length;)a=this.menus.pop(),a.destroy();this.paper&&(this.paper.clear(),this.paper.remove(),delete this.paper);this.exportIframe&&
(this.exportIframe.parentNode.removeChild(this.exportIframe),delete this.exportIframe);delete this.disposing;this.container=null;this.disposed=!0},onContainerClick:function(a){var b=a.target||a.originalTarget||a.srcElement||a.relatedTarget||a.fromElement,d=a.data,e=d.fusionCharts;a=c.getMouseCoordinate(d.container,a.originalEvent);e.ref&&(e=E({height:e.args.height,width:e.args.width,pixelHeight:e.ref.offsetHeight,pixelWidth:e.ref.offsetWidth,id:e.args.id,renderer:e.args.renderer,container:e.options.containerElement},
a),z.raiseEvent("chartclick",e,d.logic.chartInstance),b&&b.ishot&&d||d.options.chart.link&&d.linkClickFN.call(d,d))},onContainerMouseMove:function(a){var b=a.data,d=b.fusionCharts;a=c.getMouseCoordinate(b.container,a.originalEvent);d.ref&&(d=E({height:d.args.height,width:d.args.width,pixelHeight:d.ref.offsetHeight,pixelWidth:d.ref.offsetWidth,id:d.args.id,renderer:d.args.renderer,container:d.options.containerElement},a),z.raiseEvent("chartMouseMove",d,b.logic.chartInstance))},onContainerRollOver:function(a){var b=
a.data,d=b.fusionCharts;a=c.getMouseCoordinate(b.container,a.originalEvent);d.ref&&(d=E({height:d.args.height,width:d.args.width,pixelHeight:d.ref.offsetHeight,pixelWidth:d.ref.offsetWidth,id:d.args.id,renderer:d.args.renderer,container:d.options.containerElement},a),z.raiseEvent("chartRollOver",d,b.logic.chartInstance))},onContainerRollOut:function(a){var b=a.chart,d=b.fusionCharts;a=c.getMouseCoordinate(b.container,a.event);d.ref&&(d=E({height:d.args.height,width:d.args.width,pixelHeight:d.ref.offsetHeight,
pixelWidth:d.ref.offsetWidth,id:d.args.id,renderer:d.args.renderer,container:d.options.containerElement},a),z.raiseEvent("chartRollOut",d,b.logic.chartInstance))},mouseStateIn:!1,winMouseHover:function(b){var c=b.originalEvent,c=c.target||c.originalTarget||c.srcElement||c.relatedTarget||c.fromElement,d=b.data,e=d.paper;b={chart:d,event:b.originalEvent};F?e.getById(c.parentNode.raphaelid)||(d.onContainerRollOut(b),d.mouseStateIn=!1,t(a,"mouseover",d.winMouseHover)):c.viewportElement||(d.mouseStateIn=
!1,d.onContainerRollOut(b),t(p,"mouseover",d.winMouseHover))},chartHoverManager:function(){return function(b){var c=b.type,d=b.data,e=d.eventListeners||(d.eventListeners=[]);"mouseover"!==c&&"touchstart"!==c||!1!==d.mouseStateIn||(d.mouseStateIn=!0,d.onContainerRollOver(b),e.push(n(F?a:p,"mouseover",d.winMouseHover,d)))}}(),setChartEvents:function(){var a=this.options,b=this.eventListeners||(this.eventListeners=[]),a=this.link=a.chart.link,c=this.container,d=u(this.definition&&this.definition.chart.enablechartmousemoveevent,
0);t(c,"click",this.onContainerClick);b.push(n(c,"click",this.onContainerClick,this));t(this.paper.canvas,"mouseover",this.chartHoverManager,this);t(this.paper.canvas,"touchstart",this.chartHoverManager,this);t(this.paper.canvas,"mouseout",this.chartHoverManager,this);t(this.paper.canvas,"touchend",this.chartHoverManager,this);b.push(n(this.paper.canvas,"mouseover touchstart mouseout touchend",this.chartHoverManager,this));t(c,"mousemove",this.onContainerMouseMove,this);t(c,"touchmove",this.onContainerMouseMove,
this);d&&b.push(n(c,"mousemove touchmove",this.onContainerMouseMove,this));this.paper.canvas.style.cursor=I.svg?a&&"pointer"||"default":a&&"hand"||"default"},onOverlayMessageClick:function(){var a=this.elements;I.animation({opacity:0},1E3);a.messageText&&a.messageText.hide();a.messageVeil&&a.messageVeil.hide()},showMessage:function(a,b){var c=this.paper,d=this.options.chart,e=this.elements,g=e.messageText,h=e.messageVeil,l=c.width,m=c.height;h||(h=e.messageVeil=c.rect(0,0,l,m).attr({fill:"rgba(0,0,0,0.2)",
stroke:"none"}));h.show().toFront().attr("cursor",b?"pointer":"default")[b?"click":"unclick"](this.onOverlayMessageClick,this);g||(g=e.messageText=c.text(l/2,m/2,L).attr({fill:"rgba(255,255,255,1)","font-family":"Verdana,sans","font-size":10,"line-height":14,ishot:!0}));a=a||L;this.smartLabel.setStyle({"line-height":"14px","font-family":"Verdana,sans","font-size":"10px"});c=this.smartLabel.getSmartText(a,l-(d.spacingRight||0)-(d.spacingLeft||0),m-(d.spacingTop||0)-(d.spacingBotton||0));g.attr({text:c.text,
ishot:!0,cursor:b?"pointer":"default"})[b?"click":"unclick"](this.onOverlayMessageClick,this).show().toFront()},drawButtons:function(){var a=this,b=a.logic,c="zoomline"===b.rendererId,d=a.paper,e=a.elements,g=a.toolbar||(a.toolbar=[]),h=a.menus||(a.menus=[]),l=a.layers,m=a.options,n=m[ka],b=n&&n.outCanvasStyle||b.outCanvasStyle||{},n=m.chart.toolbar||{},p=n.hDirection,q=c?1:n.vDirection,u=n.button||{},t=u.scale,B=u.width*u.scale,z=u.height*u.scale,w=p*(u.spacing*u.scale+B),E=u.radius,D=(m=m.exporting)&&
m.buttons||{},F=D.exportButton&&!1!==D.exportButton.enabled,D=D.printButton&&!1!==D.printButton.enabled,N,G=l.buttons||(l.buttons=d.group("buttons").trackTooltip(!0));g.y||(g.y=(c?0:n.y)+n.vMargin*q+Ma(0,z*q));g.x||(g.x=n.x+n.hMargin*p-Ha(0,B*p));g.count=0;g.add=function(a,b,c){c="string"===typeof c?{tooltip:c}:c||{};var e=0===g.count?w-p*u.spacing*u.scale:w,e=c.x||(g.x+=e),k=c.tooltip||"";g.push(a=d.button(e,c.y||g.y,La,a,{width:B,height:z,r:E,id:g.count++,verticalPadding:u.symbolHPadding*t,horizontalPadding:u.symbolHPadding},
G).attr({ishot:!0,fill:[u.fill,u.labelFill,u.symbolFill,u.hoverFill],stroke:[u.stroke,u.symbolStroke],"stroke-width":[u.strokeWidth,u.symbolStrokeWidth]}).tooltip(k).buttonclick(b));return a};F&&(h.push(N=e.exportMenu=ba({chart:a,basicStyle:b,items:function(b){var c=[],d=function(b){return function(){a.logic.chartInstance.exportChart({exportFormat:b})}},e;for(e in b)c.push({text:b[e],onclick:d(e)});return c}(m.exportformats)})),e.exportButton=g.add("exportIcon",function(a,b){return function(){N.visible?
N.hide():N.show({x:a,y:b+1})}}(g.x+B,g.y+z),{tooltip:"Export chart"}));D&&(e.printButton=g.add("printIcon",function(){a.print()},{tooltip:"Print chart"}))},setMargins:function(){var a=this.paper,b=this.options.chart||{},c=Z;this.canvasBorderWidth=b.plotBorderWidth||0;this.canvasTop=c(b.marginTop)||0;this.canvasLeft=c(b.marginLeft)||0;this.canvasWidth=c(a.width-(b.marginLeft||0)-(b.marginRight||0));this.canvasHeight=c(a.height-(b.marginTop||0)-(b.marginBottom||0));this.canvasRight=this.canvasLeft+
this.canvasWidth;this.canvasBottom=this.canvasTop+this.canvasHeight},drawBackground:function(){var a=this,b=a.paper,c=a.layers,d=a.elements,e=c.background,g=d.background,h=d.chartborder,l=a.options.chart||{},n=m(l.borderWidth)||0,p=.5*n,q=2*n,u=l.borderWidth||0,t=a.chartHeight,B=a.chartWidth,E=d.backgroundImage,D=l.bgSWF,F=l.bgSWFAlpha/100,N=l.bgImageDisplayMode,G=l.bgImageVAlign,I=l.bgImageHAlign,J=l.bgImageScale,H=u+","+u+","+(B-2*u)+","+(t-2*u),M,L,P,V,Ob,T,X;b.canvas.style.backgroundColor=l.containerBackgroundColor;
!e&&(e=c.background=b.group("background"));c={x:n,y:n,width:b.width-q,height:b.height-q,stroke:"none",fill:ga(l.backgroundColor)};g?g.attr(c):g=d.background=b.rect(c,e);c={x:p,y:p,width:b.width-n,height:b.height-n,stroke:l.borderColor,"stroke-width":n,"stroke-dasharray":l.borderDashStyle,fill:"none",r:l.borderRadius||0};h?h.attr(c):h=d.chartborder=b.rect(c,e);D&&(M=new w,Ob=P=1,E=[],M.onload=function(){L=U(N,G,I,J,u,B,t,M);L["clip-rect"]=H;if(L.tileInfo)for(P=L.tileInfo.xCount,Ob=T=L.tileInfo.yCount,
X=L.y,delete L.tileInfo;P&&L.width&&L.height;)T-=1,V?(E[void 0]=V.clone().attr({x:L.x,y:L.y}),e.appendChild(E[void 0])):E[void 0]=V=b.image(D,e).attr(L).css({opacity:F}),L.y+=L.height,0===T&&(T=Ob,P-=1,L.x+=L.width,L.y=X);else E[0]=b.image(D,e),E[0].attr(L).css({opacity:F}).attr({visibility:Ca,"clip-rect":H});z.raiseEvent("BackgroundLoaded",{url:D,bgImageAlpha:100*F,bgImageDisplayMode:N,bgImageVAlign:G,bgImageHAlign:I,bgImageScale:J,imageWidth:M.width,imageHeight:M.height},a.logic.chartInstance)},
M.onerror=function(b){z.raiseEvent("BackgroundLoadError",{url:D,bgImageAlpha:100*F,error:b,bgImageDisplayMode:N,bgImageVAlign:G,bgImageHAlign:I,bgImageScale:J},a.logic.chartInstance)},M.src=D,d.backgroundImage=E)},drawGraph:function(){var a=this,b=a.paper,c=a.plots=a.elements.plots,d=a.logic,e=a.layers,g=a.options,h=a.elements,l=g.chart,g=a.datasets=g.series,m=q(l.rendererId,l.defaultSeriesType),n=e.background,p=e.dataset=e.dataset||b.group("dataset").insertAfter(n),u,t,n=function(a,b){return function(e){var k=
c[a],g,h={hcJSON:{series:[]}},l=h.hcJSON.series[a]||(h.hcJSON.series[a]={}),m=d.chartInstance.jsVars._reflowData;g=(e=q(e,!k.visible))?"visible":"hidden";Y(k.graphics,function(a){!0!==a.data("alwaysInvisible")&&a.attr("visibility",g)});k.visible=e;b.visible=e;l.visible=e;E(m,h,!0)}},B=function(b){return function(d,e){a["legendClick"+m]&&a["legendClick"+m](c[b],d,e)||a.legendClick&&a.legendClick(c[b],d,e)}},z=function(b){return function(){return a.getEventArgs&&a.getEventArgs(c[b])}},w=function(b,
d,e){return function(g,h){d.call(a,c[b],e,{numUpdate:g,hasAxisChanged:h})}};e.tracker=e.tracker||b.group("hot").insertAfter(p);a.drawCanvas();a.drawAxes();c||(c=a.plots=a.plots||[],h.plots=c);e=0;for(h=g.length;e<h;e++)b=g[e]||{},p=b.updatePlot="updatePlot"+H(X(b.type,b.plotType,m)),p=a[p],u=b.drawPlot="drawPlot"+H(X(b.type,b.plotType,m)),u=a[u]||a.drawPlot,(t=c[e])||(c.push(t={index:e,items:[],data:b.data||[],name:b.name,userID:b.userID,setVisible:n(e,b),legendClick:B(e),getEventArgs:z(e),realtimeUpdate:w(e,
p||u,b)}),b.plot=t,b.legendClick=t.legendClick,b.getEventArgs=t.getEventArgs,b.setVisible=t.setVisible),u.call(a,t,b);l.hasScroll&&(a.drawScroller(),a.finalizeScrollPlots())},drawPlot:e,drawCanvas:e,drawAxes:e,drawScroller:function(){},drawLegend:function(){var a=this,b=a.options,c=a.paper,d=b.chart||{},e=b.legend,g=e.scroll,b={elements:{}},h=b.elements,l=a.layers.legend,m=h.box,n=h.caption,p=h.elementGroup,q="vertical"===e.layout,t=d.marginBottom,B=d.spacingBottom,z=d.spacingLeft,w=d.spacingRight,
D=c.width,F=c.height,N=a.canvasTop,G=e.width,J=e.height,M=e.borderRadius,P=e.backgroundColor,V=e.borderColor,U=e.borderWidth||0,ga=.5*U,T=.5*U+2,d=u(e.padding,4),X=.5*d,Z,Y,r,v,C,K,f,fa=g&&g.enabled;q?(q=D-w-G,t=N+.5*(F-t-N-J)+(e.y||0)):(q=z+.5*(D-z-w-G)+(e.x||0),t=F-B-J);B=I.crispBound(q,t,G,J,U);q=B.x;t=B.y;G=B.width;J=B.height;l||(l=a.layers.legend=c.group("legend").insertBefore(a.layers.tracker).translate(q,t).attr("class","fusioncharts-legend"));a.addCSSDefinition(".fusioncharts-legend .fusioncharts-caption",
E({"text-anchor":e.title.align},e.title.style));e.legendAllowDrag&&(a.addCSSDefinition(".fusioncharts-legend",{cursor:"move"}),Y=q,r=t,l.drag(function(a,b){v=K+a;C=f+b;v+G+T>D&&(v=D-G-T);C+J+T>F&&(C=F-J-T);v<T&&(v=T);C<T&&(C=T);l.translate(v-Y,C-r);Y=v;r=C},function(){K=Y;f=r}));M={x:0,y:0,width:G,height:J,r:M,stroke:V,"stroke-width":U,fill:P||"none",ishot:e.legendAllowDrag};m?m.attr(M):m=h.box=c.rect(M,l);m.shadow(e&&e.shadow);fa?(Z=J-d,m=","+G+","+Z,p=h.elementGroup=c.group("legenditems",l).attr({"clip-rect":"0,"+
X+m}),g=h.scroller||(h.scroller=c.scroller(G-10+X-U,ga,10,J-U,!1,{scrollPosition:g.scrollPosition||0,scrollRatio:(Z+d)/e.totalHeight,showButtons:!1,displayStyleFlat:g.flatScrollBars},l)),g.attr("fill",e.legendScrollBgColor).scroll(function(b){p.transform(["T",0,(Z-e.totalHeight)*b]);E(a.fusionCharts.jsVars._reflowData,{hcJSON:{legend:{scroll:{position:b}}}},!0)})):p=h.elementGroup=l;if(e.title&&e.title.text!==L){switch(e.title.align){case "start":g=d;break;case "end":g=G-d-(fa?10:0);break;default:g=
.5*G}M={"class":"fusioncharts-caption","text-anchor":e.title.align,text:e.title.text,title:e.title.originalText||"",x:g,y:d,fill:e.title.style.color,"vertical-align":"top","line-height":e.title.style.lineHeight};n?n.attr(M):n=h.caption=c.text(M,p).attr("class","fusioncharts-caption")}this["draw"+H(e.type||"point")+"LegendItem"](b)},drawPointLegendItem:function(a){var b=this,c=b.paper,d=b.options,e=d.series,g=d.chart.defaultSeriesType,d=d.legend,h=d.legendHeight,l=d.symbolPadding,m=d.textPadding||
2,n=u(d.padding,4),p=d.itemHoverStyle,q=d.itemHiddenStyle,t=d.itemStyle,w=t.color,q=q&&q.color||"#CCCCCC",D=p&&p.color||w,p=d.symbol3DLighting,F=d.symbolWidth,N=!1!==d.interactiveLegend,G=a.elements,I=G.elementGroup;a=a.item=[];var G=G.item=[],J=[],M={line:!0,spline:!0,scatter:!0,bubble:!0,dragnode:!0,zoomline:!0},H,L,P,U,T,Z,Y,da,W,r,v,C,K,f,fa,R,$,oa,qb,kc,sa;C=0;for(K=e.length;C<K;C+=1)if((H=e[C])&&!1!==H.showInLegend)if(da=H.type||g,"point"===H.legendType)for(H=H.data||[],T=0,Z=H.length;T<Z;T+=
1)P=H[T]||{},!1!==P.showInLegend&&(P._legendType=da,J.push(P));else switch(H._legendType=da,da){case "pie":case "pie3d":case "funnel":case "pyramid":J=H.data;break;default:J.push(H)}J.sort(function(a,b){return(a.legendIndex||0)-(b.legendIndex||0)||a.__i-b.__i});d.reversed&&J.reverse();e=d.initialItemX||0;g=d.initialItemY||0;T=function(a){var c=this.data("legendItem"),d=c.getEventArgs?c.getEventArgs():{},e;a=V(b.logic.chartInstance.ref,a);d.chartX=a.chartX;d.chartY=a.chartY;d.pageX=a.pageX;d.pageY=
a.pageY;d.preventDefaults=function(){e=!0};z.raiseEvent("LegendItemClicked",d,b.logic.chartInstance);N&&!e&&c.legendClick()};Z=function(a){var c=this.data("legendItem"),d=c.getEventArgs?c.getEventArgs():{};a=V(b.logic.chartInstance.ref,a);var e=!1!==c.visible,c=c.plot.legend.elements.legendItemText;d.chartX=a.chartX;d.chartY=a.chartY;d.pageX=a.pageX;d.pageY=a.pageY;e&&c&&c.attr({fill:D});z.raiseEvent("LegendItemRollover",d,b.logic.chartInstance)};Y=function(a){var c=this.data("legendItem"),d=c.getEventArgs?
c.getEventArgs():{};a=V(b.logic.chartInstance.ref,a);var e=!1!==c.visible,c=c.plot.legend.elements.legendItemText;d.chartX=a.chartX;d.chartY=a.chartY;d.pageX=a.pageX;d.pageY=a.pageY;e&&c&&c.attr({fill:w});z.raiseEvent("LegendItemRollout",d,b.logic.chartInstance)};b.addCSSDefinition(".fusioncharts-legend .fusioncharts-legenditem",d.itemStyle);C=0;for(K=J.length;C<K;C+=1)!1!==J[C].showInLegend&&(sa={elements:{},hiddenColor:q,itemTextColor:w,hoverColor:D},a.push(sa),G.push(sa.elements),H=J[C],W=e+H._legendX+
n,r=g+H._legendY-n,v=H._legendH,L=H._legendType||da,P=!1!==H.visible,U=sa.itemLineColor=ga(H.color||{}),H.plot.legend=sa,sa.elements.legendItemText=c.text({"class":"fusioncharts-legenditem",x:W+h+m-2,y:r+(H._legendTestY||0),text:H.name,fill:P?w:q,"vertical-align":"top","text-anchor":"start",cursor:t.cursor||"pointer",ishot:N,"line-height":t.lineHeight,"font-size":t.fontSize},I).data("legendItem",H),M[L]?(L=r+l+.5*F,H.lineWidth&&(kc=sa.elements.legendItemLine=c.path({"stroke-width":H.lineWidth,stroke:P?
U:q,cursor:t.cursor||"pointer",ishot:N,path:["M",W+l,L,"L",W+l+F,L]},I).data("legendItem",H)),H&&($=H.marker)&&!1!==$.enabled&&(sa.symbolStroke=ga(X((oa=$.lineColor)&&(oa.FCcolor&&oa.FCcolor.color.split(",")[0]||oa),U)),p?$.fillColor&&$.fillColor.FCcolor?(L=E({},$.fillColor),L.FCcolor.alpha="100"):L=X($.fillColor,U):L={FCcolor:{color:X((qb=$.fillColor)&&(qb.FCcolor&&qb.FCcolor.color.split(",")[0]||qb),U),angle:0,ratio:"0",alpha:"100"}},sa.symbolColor=ga(L),f=.5*F,U=W+l+f,L=r+l+f,kc&&(f*=.6),fa=$.symbol.split("_"),
R="spoke"===fa[0]?1:0,L=fa[1]?sa.elements.legendItemSymbol=c.polypath(fa[1],U,L,f,$.startAngle,R,I):sa.elements.legendItemSymbol=c.circle(U,L,f,I),L.data("legendItem",H).attr({cursor:t.cursor||"pointer",stroke:P?sa.symbolStroke:q,fill:P?sa.symbolColor:q,"stroke-width":1,ishot:N}))):(L=b.getSymbolPath(W+l,r+l,F,F,L,H,!p),sa.symbolColor=ga(L.color),sa.symbolStroke=ga(L.strokeColor),L=sa.elements.legendItemSymbol=c.path({path:L.path,"stroke-width":L.strokeWidth,stroke:P?sa.symbolStroke:q,fill:P?sa.symbolColor:
q,cursor:t.cursor||"pointer",ishot:N},I).data("legendItem",H)),sa.elements.legendItemBackground=c.rect({x:W,y:r,width:H._totalWidth,height:v,r:0,fill:ga(H.legendFillColor||B),"stroke-width":1,stroke:ga(H.legendBorderColor||"none"),cursor:t.cursor||"pointer",ishot:N},I).click(T).mouseover(Z).mouseout(Y).data("legendItem",H));d.reversed&&J.reverse()},drawCaption:function(){var a=this.options.chart,b=this.options.title,c=this.options.subtitle,d=this.paper,e=this.smartLabel,g=this.elements,h=this.layers,
l=h.caption,m=g.caption,n=g.subcaption,p=b.text,q=c&&c.text,u=b.x,t;!p&&!q||l||(l=h.caption=d.group("caption"),h.tracker?l.insertBefore(h.tracker):l.insertAfter(h.dataset));p?(this.addCSSDefinition(".fusioncharts-caption",b.style),t={"class":"fusioncharts-caption",text:b.text,fill:b.style.color,x:u,y:b.y||a.spacingTop||0,"text-anchor":b.align||"middle","vertical-align":b.verticalAlign||"top",visibility:"visible",title:b.originalText||""},m?m.attr(t):m=g.caption=d.text(t,l).attr("class","fusioncharts-caption"),
m.css(b.style),e?(e.setStyle(b.style),t=e.getOriSize(b.text).height):t=10):m&&(m=g.caption=m.remove());q?(this.addCSSDefinition(".fusioncharts-subcaption",c.style),t={"class":"fusioncharts-subcaption",text:c.text,title:c.originalText||"",fill:c.style.color,x:u,y:p?m.attrs.y+t+2:b.y||a.spacingTop||0,"text-anchor":b.align||"middle","vertical-align":"top",visibility:"visible"},n?n.attr(t):n=g.subcaption=d.text(t,l).attr("class","fusioncharts-subcaption"),n.css(c.style)):n&&(g.subcaption=n.remove());
p||q||!l||(h.caption=l.remove())},drawLogo:function(){var a=this,b=a.paper,c=a.elements,d=a.options,e=d.credits,g=d.chart||{},h=g.borderWidth||0,l=a.chartHeight,m=a.chartWidth,n=c.logoImage,q=g.logoURL,u=g.logoAlpha/100,t=g.logoPosition,B=g.logoLink,E=g.logoScale,D=g.logoLeftMargin,N=g.logoTopMargin,d={tr:{vAlign:ub,hAlign:mb},bl:{vAlign:Wa,hAlign:Ua},br:{vAlign:Wa,hAlign:mb},cc:{vAlign:"middle",hAlign:"middle"}},G,I,H;a.logic&&e.enabled&&b.text().attr({text:e.text,x:6,y:l-4,"vertical-align":Wa,"text-anchor":"start",
fill:"rgba(0,0,0,0.5)",title:e.title||""}).css({fontSize:9,fontFamily:"Verdana,sans",cursor:"pointer",_cursor:"hand"}).click(function(){try{p.open(e.href)}catch(a){(p.top||p).location.href=e.href}});q&&(G=new w,(H=d[t])||(H={vAlign:ub,hAlign:Ua}),G.onload=function(){a.disposed||b.disposed||(I=U("none",H.vAlign,H.hAlign,E,h,m,l,G),F&&(I.w=I.width||0,I.h=I.height||0),I.src=q,n=a.paper.image(I).translate(D,N).css("opacity",u),B&&n.css({cursor:"pointer",_cursor:"hand"}),n.mouseover(function(b){b=V(a.logic.chartInstance.ref,
b);z.raiseEvent("LogoRollover",{logoURL:q,logoAlpha:100*u,logoPosition:t||"tl",logoScale:E,logoLink:B,chartX:b.chartX,chartY:b.chartY,pageX:b.pageX,pageY:b.pageY},a.logic.chartInstance)}),n.mouseout(function(b){b=V(a.logic.chartInstance.ref,b);z.raiseEvent("LogoRollout",{logoURL:q,logoAlpha:100*u,logoPosition:t||"tl",logoScale:E,logoLink:B,chartX:b.chartX,chartY:b.chartY,pageX:b.pageX,pageY:b.pageY},a.logic.chartInstance)}),n.click(function(b){b=V(a.logic.chartInstance.ref,b);z.raiseEvent("LogoClick",
{logoURL:q,logoAlpha:100*u,logoPosition:t||"tl",logoScale:E,logoLink:B,chartX:b.chartX,chartY:b.chartY,pageX:b.pageX,pageY:b.pageY},a.logic.chartInstance,void 0,function(){B&&g.events.click.call({link:B})})}),z.raiseEvent("LogoLoaded",{logoURL:q,logoAlpha:100*u,logoPosition:t||"tl",logoScale:E,logoLink:B},a.logic.chartInstance))},G.onerror=function(b){z.raiseEvent("LogoLoadError",{logoURL:q,logoAlpha:100*u,logoPosition:t||"tl",logoScale:E,logoLink:B,error:b},a.logic.chartInstance)},G.src=q,c.logoImage=
n)},getEventArgs:function(a){a=a||{};return{datasetName:a.name,datasetIndex:a.index,id:a.userID,visible:a.visible}},legendClick:function(a,b){var c=a.legend,d=c&&c.elements,e=d&&d.legendItemText,g=d&&d.legendItemSymbol,d=d&&d.legendItemLine,h=c&&c.hiddenColor,l=c&&c.itemLineColor,m=c&&c.itemTextColor,n=c&&c.symbolColor,p=c&&c.symbolStroke,c=X(b,!a.visible);a.setVisible(b);c?(g&&g.attr({fill:n||l,stroke:p}),e&&e.attr({fill:m}),d&&d.attr({stroke:l})):(g&&g.attr({fill:h,stroke:h}),e&&e.attr({fill:h}),
d&&d.attr({stroke:h}));if((e=this.datasets&&this.datasets[a.index]&&this.datasets[a.index].relatedSeries)&&e instanceof Array&&0<e.length)for(g=e.length;g--;)d=parseFloat(e[g]),d=this.plots[d],d.legendClick.call(d,c,!1)},exportChart:function(b){var d=this,e=d.fusionCharts,g=d.options;b="object"===typeof b&&function(a){var b={},c;for(c in a)b[c.toLowerCase()]=a[c];return b}(b)||{};var h=E(E({},g.exporting),b),l=(h.exportformat||"png").toLowerCase(),m=h.exporthandler,n=(h.exportaction||L).toLowerCase(),
q=h.exporttargetwindow||L,u=h.exportfilename,t=h.exportparameters,B=h.exportcallback,D=h.exportwithimages;if(!g.exporting||!g.exporting.enabled||!m)return!1;z.raiseEvent("beforeExport",h,e,void 0,function(){function b(){var k;if("download"===n){/webkit/ig.test(p.navigator.userAgent)&&"_self"===q&&(q=N=g+"export_iframe",d.exportIframe||(d.exportIframe=G=ua("IFRAME",{name:N,width:"1px",height:"1px"},a.body),G.style.cssText="position:absolute;left:-10px;top:-10px;"));I=ua("form",{method:"POST",action:m,
target:q,style:"display:none;"},a.body);for(k in F)ua("input",{type:"hidden",name:k,value:F[k]},I);I.submit();a.body.removeChild(I);I=void 0;return!0}H=new z.ajax(function(a){var b={};a.replace(RegExp("([^?=&]+)(=([^&]*))?","g"),function(a,c,d,e){b[c]=e});B&&p[B]&&"function"===typeof p[B]&&p[B].call(p,b);c.raiseEvent("exported",b,e)},function(a){a={statusCode:0,statusMessage:"failure",error:a,DOMId:g,width:O.width,height:O.height};B&&p[B]&&"function"===typeof p[B]&&p[B].call(p,a);c.raiseEvent("exported",
a,e,[a])});for(k in F)F.hasOwnProperty(k)&&(F[k]=encodeURIComponent(F[k]));H.post(m,F)}var k=d.layers.buttons,g=e.id,O=d.paper,E=z&&z.hcLib,F,N,G,I,H,J,E=E&&E.isCanvasElemSupported(),M,L,P=0,V={},U,T,r,v,C={};k&&k.attr("visibility","hidden");J=O.toSVG(D&&E&&"svg"!==l);k&&k.attr("visibility","visible");J=J.replace(/(\sd\s*=\s*["'])[M\s\d\.]*(["'])/ig,"$1M 0 0 L 0 0$2");F={charttype:e.chartType(),stream:J,stream_type:"svg",meta_bgColor:h.bgcolor||"",meta_bgAlpha:h.bgalpha||"1",meta_DOMId:e.id,meta_width:O.width,
meta_height:O.height,parameters:["exportfilename="+u,"exportformat="+l,"exportaction="+n,"exportparameters="+t].join("|")};-1!==J.indexOf("<image ")?E?(L=(M=J.match(/<image [^\>]*\>/gi))&&M.length,U=function(a){a=a&&a.split("/");a=a[a.length-1].split(".");return{name:a[0],type:a[1]||"png"}},T=function(b,c,d,e,k){var g=new w;g.onload=function(){var h="image/"+d,l=a.createElement("canvas"),s=l.getContext("2d"),m="";l.width=g.width;l.height=g.height;s.drawImage(g,0,0);m=l.toDataURL(h);C[b]=m;v(m,c,d,
e,k)};g.onerror=function(){r()};g.src=b},v=function(a,b,c,d,e){V["image_"+P]={name:b,type:c,encodedData:a,width:d,height:e};r()},r=function(){var a={},c,d,e,k,g,h=!1;P<L?(c=M[P].replace(/\"/g,""),c.split(" ").forEach(function(b){b=b.split("=");a[b[0]]=b[1]}),a["xlink:href"]&&(c=(d=U(a["xlink:href"]))&&d.name||"temp_image_"+P,e=d&&d.type||"png",k=parseInt(a.width,10),g=parseInt(a.height,10),d=c+"."+e,C[a["xlink:href"]]?h=!0:T(a["xlink:href"],c,e,k,g)),c='xlink:href="'+a["xlink:href"],J=J.replace(c,
'xlink:href="temp/'+d),P+=1,h&&r()):(F.encodedImgData=JSON.stringify(V),F.stream=J,b())},r()):b():b();z.raiseEvent("exportDataReady",F,e)},function(){z.raiseEvent("exportCancelled",h,e)})},print:function(b){var c=this,d=E({},b);if(c.isPrinting)return!1;z.raiseEvent("BeforePrint",d,c.logic.chartInstance,void 0,function(){var b=c.container,e=c.elements,k=e.printButton,g=e.exportButton,h=[],l=b.parentNode,e=a.body||a.getElementsByTagName("body")[0],m=e.childNodes;c.isPrinting=!0;Y(m,function(a,b){1==
a.nodeType&&(h[b]=a.style.display,a.style.display="none")});!1!==d.hideButtons&&(k&&"hidden"!=k.attrs.visibility&&k.attr({visibility:"hidden"}),g&&"hidden"!=g.attrs.visibility&&g.attr({visibility:"hidden"}));e.appendChild(b);p.print();setTimeout(function(){k&&k.attr({visibility:"visible"});g&&g.attr({visibility:"visible"});l.appendChild(b);Y(m,function(a,b){1==a.nodeType&&(a.style.display=h[b])});c.isPrinting=!1;z.raiseEvent("PrintComplete",d,c.logic.chartInstance)},1E3)},function(){z.raiseEvent("PrintCancelled",
d,c.logic.chartInstance)})},getSymbolPath:function(a,b,c,d,e,g,h){var l=["M"],m,n,p;m=(g.color&&Jb("string"===typeof g.color?g.color:g.color.FCcolor.color)||L).replace(J,"");p=Qb(m,60).replace(J,W);h?m={FCcolor:{color:m,angle:0,ratio:"0",alpha:"100"}}:(h=Qb(m,40),m={FCcolor:{color:m+","+m+","+h+","+m+","+m,ratio:"0,30,30,30,10",angle:0,alpha:"100,100,100,100,100"}});switch(e){case "column":case "dragcolumn":case "column3d":g=.25*c;e=.5*g;h=.7*d;n=.4*d;l=l.concat([a,b+d,"l",0,-h,g,0,0,h,"z","m",g+
e,0,"l",0,-d,g,0,0,d,"z","m",g+e,0,"l",0,-n,g,0,0,n,"z"]);m.FCcolor.angle=270;break;case "bar":case "bar3d":g=.3*c;e=.6*c;h=d/4;n=h/2;l=l.concat([a,b,"L",a+e,b,a+e,b+h,a,b+h,"Z","M",a,b+h+n,"L",a+c,b+h+n,a+c,b+h+n+h,a,b+2*h+n,"Z","M",a,b+2*(h+n),"L",a+g,b+2*(h+n),a+g,b+d,a,b+d,"Z"]);break;case "area":case "area3d":case "areaspline":case "dragarea":h=.6*d;n=.2*d;d*=.8;l=l.concat([a,b+d,"L",a,b+h,a+.3*c,b+n,a+.6*c,b+h,a+c,b+n,a+c,b+d,"Z"]);m.FCcolor.angle=270;break;case "pie":case "pie3d":g=.5*c;e=
.9*g;c=a+g+1;d=b+g-1;a=a+g-1;b=b+g+1;l=l.concat(["M",c,d,"L",c,d-e+1,"A",e-1,e-1,0,0,1,c+e-1,d,"Z","M",a,b,"L",a,b-e,"A",e,e,0,1,0,a+e,b,"Z"]);m.FCcolor.radialGradient="1";m.FCcolor.ratio="0,0,0,100,0";break;case "boxandwhisker2d":l=l.concat([a,b,"L",a+c,b,a+c,b+d,a,b+d,"Z"]);m=g.color;p="#000000";break;default:l=l.concat([a,b,"L",a+c,b,a+c,b+d,a,b+d,"Z"]),m.FCcolor.angle=270,m.FCcolor.ratio="0,70,30"}return{path:l,color:m,strokeWidth:.5,strokeColor:p}}});d.prototype={configure:function(){var a=this.axisData,
b=this.renderer,c=this.isVertical,d=this.isReverse,e=b.options,g=e.chart,h=g.marginBottom,g=g.marginRight,l=b.canvasTop,m=b.canvasLeft,n=this.min=a.min,n=this.span=(this.max=a.max)-n,m=this.startX=u(a.startX,m),l=this.startY=u(a.startY,l),p=this.endX=u(a.endX,b.canvasRight),a=this.endY=u(a.endY,b.canvasBottom),n=this.pixelRatio=c?(a-l)/n:(p-m)/n,q=this.relatedObj={};q.marginObj={top:l,right:g,bottom:h,left:m};q.canvasObj={x:m,y:l,w:p-m,h:a-l,toX:p,toY:a};this.startPixel=d?c?a:p:c?l:m;this.pixelValueRatio=
d?-n:n;this.primaryOffset=this.secondaryOffset=0;this.cache={lowestVal:0,highestVal:0,indexArr:[],hashTable:{}};this.elements=this.elements||{};this.belowBandGroup&&(b.elements.axes=b.elements.axes||{},b.elements.axes.belowBandGroup=this.belowBandGroup,e&&e.chart&&e.chart.hasScroll&&this.belowBandGroup.attr({"clip-rect":b.elements["clip-canvas"]}));this.poi={}},draw:function(){var a=this.axisData,b=a&&a.plotLines||[],c=a&&a.plotBands||[],d=a&&a.showLine,e=a&&a.tickLength,g=a&&a.tickWidth;a&&a.title&&
this.drawAxisName();a&&a.labels&&(this.renderer.addCSSDefinition("."+a.labels.className+" .fusioncharts-label",a.labels.style),this.belowLabelGroup&&this.belowLabelGroup.attr("class",a.labels.className),this.topLabelGroup&&this.topLabelGroup.attr("class",a.labels.className));b&&0<b.length&&this.drawPlotLine();c&&0<c.length&&this.drawPlotBands();isNaN(e)||0===e||isNaN(g)||0===g||this.drawTicks();d&&this.drawLine()},scroll:function(){},setOffset:function(a,b){var c=this.primaryOffset=a,d=this.secondaryOffset=
b||this.secondaryOffset,e=this.isVertical,g,h,l,m=[this.topLabelGroup,this.belowLabelGroup,this.topLineGroup,this.belowLineGroup,this.topBandGroup,this.belowBandGroup],n,p;n=0;for(p=m.length;n<p;n+=1)if(l=m[n])g=e?d:c,h=e?c:d,l.attr({transform:"t"+g+","+h});e||this.drawPlotLine&&this.drawPlotLine()},update:function(){},drawTicks:function(){var a=this.axisData,b=this.renderer.paper,c=this.min,d=this.max,e=this.isVertical,g=this.layerBelowDataset,g=this.tickGroup=this.tickGroup||b.group("axis-ticks",
g),h=this.relatedObj.canvasObj,l=a.offset,m=a.opposite,n=a.showAxis,p=a.tickInterval,q=a.tickLength,u=a.tickWidth,a=a.tickColor,t=c;if(e&&n)for(c=this.getAxisPosition(c),e=this.getAxisPosition(d),h=m?h.toX+l:h.x-l,b.path(["M",h,c,"L",h,e],g).attr({stroke:a,"stroke-width":u});Za(t)<=d;)l=this.getAxisPosition(t),c=m?h+q:h-q,b.path(["M",h,l,"L",c,l],g).attr({stroke:a,"stroke-width":u}),t+=p},getAxisPosition:function(a,b){var c;b?c=(a-this.startPixel)/this.pixelValueRatio+this.min:(a=this.axisData.reversed?
this.min+(this.max-a):a,c=this.startPixel+(a-this.min)*this.pixelValueRatio);return c},drawPlotLine:function(){var a=this.renderer,b=a.paper,c=this.isVertical,d=+!c,e=this.lines=this.lines||[],g=this.labels=this.labels||[],h=this.relatedObj.canvasObj,l=this.globalOptions||{},m=this.elements||{},n=this.axisData.plotLines||[],p=this.primaryOffset,q=c?this.startY:this.startX,t=c?this.endY:this.endX,z=parseFloat(a.canvasBorderWidth)||0,w=Ha(n.length,Ha(e.length,g.length)),E=a.layers.datalabels,D=this.belowLineGroup,
F=this.topLineGroup,N=this.belowLabelGroup,G=this.topLabelGroup,I=!1!==(a.tooltip||{}).enabled,J=function(b){return function(c){xa.call(this,a,c,b)}},l=l.chart.xDepth||0,H=[],M=0,P,V,U,T,X,Z,r,v,C,K,f,fa,R,$,Y,qb,da,sa,W,ka,aa,ea,ba,na,la,pa,Aa,ua,Ma,Fa,Ba,La,Da,Fb,cb,Va,Ia,za,Ca,fb,Hb,jb,kb;for(kb=0;kb<w;kb+=1){U=T=X=null;U=e[kb];T=g[kb];if(r=n[kb])if(v=r.width,C=r.isVline,K=r.isTrend,f=r.isGrid,fa=r.tooltext,R=r.value,$=r.color,Y=r.dashStyle,qb=K?r.to:null,da=r._isStackSum,P=3<r.zIndex?F:D,sa=r.label){W=
sa.style;ka=sa.text;aa=W&&W.color;ea=sa.offsetScaleIndex||0;ba=sa.offsetScale;if(na=W&&W.fontSize)la=na,-1!==la.indexOf("px")&&(la=la.replace("px",""),la=parseFloat(la));V=W&&W.lineHeight;na=W?{fontFamily:W.fontFamily,fontSize:W.fontSize,lineHeight:W.lineHeight,fontWeight:W.fontWeight,fontStyle:W.fontStyle}:null;V&&(pa=V,-1!==pa.indexOf("px")&&(pa=pa.replace("px",""),pa=parseFloat(pa)));Aa=sa.rotation;ua=sa.x||0;Ma=sa.y||0;Fa=sa.align;Ba=sa.verticalAlign;La=sa.textAlign;Da=(Da=sa.borderWidth)?-1!==
Da.indexOf("px")?Da.replace("px",""):1:1;V=da?E:3<=r.zIndex?G:N;sa.backgroundColor&&(sa.labelBgClr=ga({color:sa.backgroundColor,alpha:100*sa.backgroundOpacity}));sa.borderColor&&(sa.labelBorderClr=ga({color:sa.borderColor,alpha:"100"}));Fb=la?.2*la:2;La="left"===La?"start":"right"===La?"end":"middle"}Z=Hb="visible";jb=0>u(ba,R,0);c?(Va=this.getAxisPosition(R),za=K?this.getAxisPosition(qb)||Va:Va,Ca=Va!==za?!0:!1,fb=["M",h.x,Va,"L",h.toX,za],C?a.logic.isBar&&(cb=a.yAxis[ea],!da&&!isNaN(ba)&&0<=ba&&
1>=ba&&(ba=cb.min+(cb.max-cb.min)*ba),Ia=cb.getAxisPosition(u(ba,R))+ua+Fb*(jb?-1:1)):Ia=sa?cb=this.axisData.isOpposite||"right"===Fa?h.toX+ua:h.x+ua:cb=this.axisData.isOpposite?h.toX:h.x):(cb=this.getAxisPosition(R)||0,Ia=K?this.getAxisPosition(qb)||cb:cb,!K&&!C&&0<l&&(cb+=l,Ia+=l,t+=l),Ca=cb!==Ia?!0:!1,fb=["M"+cb,h.y,"L",Ia,h.toY],Hb=cb+p<q||cb+p>t?"hidden":Hb,C?(cb=a.yAxis[ea],!da&&!isNaN(ba)&&0<=ba&&1>=ba&&(ba=cb.min+(cb.max-cb.min)*(1-ba)),Va=cb.getAxisPosition(u(ba,R))+Ma,Va-=(z+parseFloat(Da))*
(Ma&&(0<Ma?-1:1))):this.axisData.opposite||"top"===Ba&&!f?(Va=h.y+Ma,za="bottom"):Va=h.toY+Ma,za=Va);Z=c?Z:Ia+p<q||Ia+p>t?"hidden":Z;if(r&&"visible"===Hb&&.1<v)Ca={path:ja(fb,v),stroke:$,"stroke-width":v,"shape-rendering":!Ca&&1<=v?"crisp":void 0,"stroke-dasharray":Y?Y:void 0,visibility:Hb},U?U.attr(Ca):(U=e[kb]=b.path(Ca,P).css(r.style),m.lines=m.lines||[],m.lines.push(U)),I&&fa&&v<oa&&Hb&&(X=b.path({stroke:B,"stroke-width":oa,ishot:!0,path:fb,fill:B},a.layers.tracker)),X=X||U,I&&fa&&X.tooltip(fa);
else if(U||T)U&&U.remove(),U=null,e&&(e[kb]=null),m&&m.lines&&(m.lines[kb]=null);sa&&r&&!r.stepped&&"visible"===Z&&sa.text!=L&&" "!=sa.text?(Va=K?"left"===Fa?Va:za:za,X=Ia-+!C*d*l+d*(ua||0),da?(za=c||Aa?"middle":"bottom",Va+=c?0:la*(jb?-.4:.4),Aa&&(Va+=jb?4:-2,La=jb?"end":"start")):d&&this.axisData.opposite?(za=Wa,La=Aa?"start":"middle"):za=Ba,/\n|<br\s*?\/?>/ig.test(ka)&&f&&(Aa?(za="middle",X-=d*(ua||0)):(za=d&&this.axisData.opposite&&!Aa?"middle":ub,Va-=pa)),Ca={"class":"fusioncharts-label",text:ka,
fill:na?aa||$:null,title:sa&&(sa.originalText||L),cursor:sa.link?"pointer":L,x:X,y:Va,"text-anchor":La,"vertical-align":za,transform:" ","text-bound":[W.backgroundColor||sa.labelBgClr,W.borderColor||sa.labelBorderClr,W.borderThickness||Da,W.borderPadding||Fb,W.borderRadius,W.borderDash],visibility:Z,"line-height":W.lineHeight},T?T.attr(Ca):(T=g[kb]=b.text(Ca,V).attr("class","fusioncharts-label"),U&&(U.label=T),m.labels=m.labels||[],m.labels.push(T)),na&&T.css(na),r.isDataLabel&&(Z={text:ka,index:M,
link:sa.link},M+=1,T.click(J("dataLabelClick")).hover(J("dataLabelRollOver"),J("dataLabelRollOut")).data("eventArgs",Z)),Aa&&T.attr("transform",["r",Aa,X,Va]),da&&T&&H.push(T)):T&&(T.isRotationSet=!1,T.remove(),g&&(g[kb]=null),m&&m.labels&&(m.labels[kb]=null));!U&&!T||r&&null===r.value||(r&&r.isMinLabel?this.poi.min={label:T,index:kb,line:U}:r&&r.isMaxLabel?this.poi.max={label:T,index:kb,line:U}:r&&r.isZeroPlane&&(this.poi.zero={label:T,index:kb,line:U}));U=T=null}u(a.options.plotOptions.series.animation.duration,
0)},drawPlotBands:function(){var a=this.renderer,b=a.paper,c=this.isVertical,d=this.axisData.plotBands||[],e=this.bands=this.bands||[],g=this.bandLabels=this.bandLabels||[],h=this.relatedObj.canvasObj,l=this.primaryOffset,m=c?this.startY:this.startX,n=c?this.endY:this.endX,p=a.options.chart.hasScroll,q=this.belowBandGroup,t=this.topBandGroup,B=this.belowLabelGroup,z=this.topLabelGroup,w=this.elements||{},a=!1!==(a.tooltip||{}).enabled,E,D,F,N,G,I,J,H,M,L,P,V,U,T,r,v,C,K,f,fa,R,$,X,Z,W,sa,Y,da,oa,
ka,ba,aa,la,ja,Aa,ea=Ha(d.length,e.length);for(Aa=0;Aa<ea;Aa+=1){ja="visible";aa=e[Aa];la=g[Aa];if(E=d[Aa])if(D=E.tooltext,F=E.to,N=E.from,G=E.value,I=E.width,J=E.color,ka=3<E.zIndex?t:q,H=E.label){if(M=H.style){if(T=M.fontSize)L=T,-1!==L.indexOf("px")&&(L=L.replace("px",""),parseFloat(L));(L=M.lineHeight)&&-1!==L.indexOf("px")&&(L=L.replace("px",""),parseFloat(L));f=M.color}(L=H.borderWidth)&&-1!==L.indexOf("px")&&L.replace("px","");P=H.align;V=H.x;U=H.y;C=H.text;K=H.originalText;r=H.backgroundColor;
v=H.backgroundOpacity;r&&(R=H.labelBgClr=ga({color:r,alpha:100*v}));if(r=H.borderColor)$=H.labelBorderClr=ga({color:r,alpha:"100"});r=H.textAlign;r="left"===r?"start":"right"===r?"end":"middle";v=H.verticalAlign;fa=H.borderType;ba=3<E.zIndex?z:B}X=this.getAxisPosition(u(F,G));Z=this.getAxisPosition(u(N,G));W=c?h.x:Z;sa=c?X:h.y;Y=c?h.w:(this.axisData.reversed?Z-X:X-Z)||I||1;Z=c?Z-X||1:h.h;X=W+Y;Y=hb(Y);0>Z&&(Z=hb(Z),sa-=Z);c||(ja=p?"hidden":W+l>n||X+l<m?"hidden":ja);H&&(da=c?"right"===P?h.toX+V:h.x+
V:W+Y/2,oa=c?sa+Z/2:h.toY+U);if(!aa&&E&&"visible"===ja)E={x:W,y:sa,width:Y,height:Z,fill:ga(J),"stroke-width":0},aa?aa.attr(E):(aa=e[Aa]=b.rect(E,ka),w.bands=w.bands||[],w.bands[Aa]=aa),a&&D&&aa.tooltip(D);else if(aa&&(!E||"hidden"===ja)){w.labels&&(g[Aa]=w.labels[Aa]=null);aa.label&&aa.label.remove();e[Aa]=w.bands[Aa]=null;aa.remove();continue}aa&&H&&H.text&&(E={"class":"fusioncharts-label",text:C,title:K||"",fill:f,"text-bound":[R,$,L,.2*T,"solid"===fa?!1:!0],x:da,y:oa,"text-anchor":r,"vertical-align":v,
"line-height":M.lineHeight},la?la.attr(E):(la=g[Aa]=aa.label=b.text(E,ba).attr("class","fusioncharts-label"),M&&la.css(M),w.labels=w.labels||[],w.labels[Aa]=la))}},drawAxisName:function(){var a=this.axisData,b=a.title||{},c=b&&b.style,d=b&&b.className,e=b.align,g=b.centerYAxisName||!1,h=this.renderer.paper,l=this.isVertical,m=this.relatedObj.canvasObj,n=u(a.offset,0)+u(b.margin,0),p=b.text||"",q=this.name||void 0,a=a.opposite,t=this.layerBelowDataset,t=t.nameGroup=t.nameGroup||h.group("axis-name",
t),B=u(b.rotation,a?90:270),z=l?a?m.toX+n:m.x-n:(m.x+m.toX)/2,w={fontFamily:c.fontFamily,fontSize:c.fontSize,lineHeight:c.lineHeight,fontWeight:c.fontWeight,fontStyle:c.fontStyle},E,g=l?"low"===e?m.toY:g?(m.y+m.toY)/2:this.renderer.chartHeight/2:m.toY+n;p?(!isNaN(B)&&B&&l&&(E=c.fontSize,E=-1!=E.indexOf("px")?E.replace("px",""):E,a?(z+=parseFloat(E),E=270===B?"bottom":"top"):(z-=parseFloat(E),E=270===B?"top":"bottom")),this.renderer.addCSSDefinition("."+d,w),d={"class":d,x:0,y:0,text:p,fill:c.color,
"text-anchor":"low"===e?90==B?"end":"start":"middle","vertical-align":l?B?E:"middle":a?Wa:"top",transform:l?"t"+z+","+g+"r"+B:"t"+z+","+g,"font-size":c.fontSize},b.originalText&&(d.title=b.originalText),q?q.attr(d):q=this.name=h.text(d,t),setTimeout(function(){q.attr({"line-height":c.lineHeight,"text-bound":[c.backgroundColor,c.borderColor,c.borderThickness,c.borderPadding,c.borderRadius,c.borderDash]})},0)):q&&q.remove();this.elements.name=q},drawLine:function(){var a=this.axisData,b=this.renderer.paper,
c=this.min,d=this.max,e=this.isVertical,g=a.opposite,h=this.layerBelowDataset,h=this.lineGroup=this.lineGroup||b.group("axis-lines",h),l=a.lineColor,m=a.lineThickness,n=a.lineEndExtension||0,p=a.lineStartExtension||0,a=this.relatedObj.canvasObj;e?(c=this.getAxisPosition(c)-p,n=this.getAxisPosition(d)+n,d=e=g?a.toX+m/2:a.x-m/2):(d=a.x-p,e=a.toX+n,c=n=g?a.y-m/2:a.toY+m/2);b=b.path({path:["M",d,c,"L",e,n],stroke:l,"stroke-width":m},h);this.elements.axisLine=b},realtimeUpdateX:function(a){if(0<a){for(var b=
this.axisData.plotBands,c=this.min+a,d,e=b.length;e--;)(d=b[e])&&!d.isNumVDIV&&(d.value<c||d.from<c||d.to<c?b.splice(e,1):(void 0!==d.value&&(d.value-=a),void 0!==d.from&&(d.from-=a),void 0!==d.to&&(d.to-=a)));this.drawPlotLine();this.drawPlotBands()}},realtimeUpdateY:function(a,b){var c=this.axisData,d=this.min=c.min=a,c=this.span=(this.max=c.max=b)-d,c=this.pixelRatio=this.isVertical?this.relatedObj.canvasObj.h/c:this.relatedObj.canvasObj.w/c;this.pixelValueRatio=this.isReverse?-c:c;this.drawPlotLine();
this.drawPlotBands()}};d.prototype.constructor=d;b("renderer.cartesian",{drawCanvas:function(){var a=this.options.chart||{},b=a.plotBackgroundColor,c=this.paper,d=this.elements,e=d.canvas,g=d.canvas3DBase,h=d.canvas3dbaseline,g=d.canvasBorder,l=d.canvasBg,m=this.canvasTop,n=this.canvasLeft,p=this.canvasWidth,q=this.canvasHeight,t=u(a.plotBorderRadius,0),l=a.plotBorderWidth,B=.5*l,z=a.plotBorderColor,E=a.isBar,w=a.is3D,D=a.use3DLighting,N=a.showCanvasBg,G=a.canvasBgDepth,H=a.showCanvasBase,M=a.canvasBaseColor3D,
L=a.canvasBaseDepth,P=a.plotShadow,V=F&&0===l&&P&&P.enabled,U=a.xDepth||0,a=a.yDepth||0,T=this.layers,X=T.background,Z=T.dataset;T.tracker=T.tracker||c.group("hot").insertAfter(Z);T.datalabels=T.datalabels||c.group("datalabels").insertAfter(Z);T=T.canvas=T.canvas||c.group("canvas").insertAfter(X);g||(d.canvasBorder=c.rect({x:n-B,y:m-B,width:p+l,height:q+l,r:t,"stroke-width":l,stroke:z,"stroke-linejoin":2<l?"round":"miter"},T).shadow(P));d["clip-canvas"]=[Ha(0,n-U),Ha(0,m-a),Ha(1,p+2*U),Ha(1,q+2*a)];
d["clip-canvas-init"]=[Ha(0,n-U),Ha(0,m-a),1,Ha(1,q+2*a)];w&&(N&&(l=E?d.canvasBg=c.path(["M",n,",",m,"L",n+1.2*G,",",m-G,",",n+p-G,",",m-G,",",n+p,",",m,"Z"],T):d.canvasBg=c.path(["M",n+p,",",m,"L",n+p+G,",",m+1.2*G,",",n+p+G,",",m+q-G,",",n+p,",",m+q,"Z"],T),l.attr({"stroke-width":0,stroke:"none",fill:ga(b)})),H&&(g=E?d.canvas3DBase=c.cubepath(n-U-L-1,m+a+1,L,q,U+1,a+1,T):d.canvas3DBase=c.cubepath(n-U-1,m+q+a+1,p,L,U+1,a+1,T),g.attr({stroke:"none","stroke-width":0,fill:[M.replace(J,W),!D]}),h||(h=
d.canvas3dbaseline=c.path(void 0,T)),h.attr({path:E?["M",n,m,"V",q+m]:["M",n,m+q,"H",p+n],stroke:I.tintshade(M.replace(J,W),.05).rgba})));!e&&b&&(d.canvas=c.rect({x:n,y:m,width:p,height:q,r:t,"stroke-width":0,stroke:"none",fill:ga(b)},T).shadow(V))},drawAxes:function(){var a=this.logic,b=this.options,c=this.paper,e=this.layers,g=e.dataset,h=e.layerBelowDataset=e.layerBelowDataset||c.group("axisbottom").trackTooltip(!0),l=e.layerAboveDataset=e.layerAboveDataset||c.group("axistop").trackTooltip(!0),
c=this.xAxis=[],e=this.yAxis=[];h.insertBefore(g);l.insertAfter(g);if(b.xAxis&&b.xAxis.length)for(g=0,h=b.xAxis.length;g<h;g+=1)c[g]=this.xAxis[g]=new d(b.xAxis[g],this,a.isBar);else c[0]=this.xAxis[0]=new d(b.xAxis,this,a.isBar);if(b.yAxis)for(g=0,h=b.yAxis.length;g<h;g+=1)e[g]=this.yAxis[g]=new d(b.yAxis[g],this,!a.isBar,!a.isBar);g=0;for(h=e.length;g<h;g+=1)e[g].axisData&&(e[g].axisData.title&&(e[g].axisData.title.className="fusioncharts-yaxis-"+g+"-title"),e[g].axisData.labels&&(e[g].axisData.labels.className=
"fusioncharts-yaxis-"+g+"-gridlabels")),e[g].draw();g=0;for(h=c.length;g<h;g+=1)c[g].axisData&&(c[g].axisData.title&&(c[g].axisData.title.className="fusioncharts-xaxis-"+g+"-title"),c[g].axisData.labels&&(c[g].axisData.labels.className="fusioncharts-xaxis-"+g+"-gridlabels")),c[g].draw()},drawScroller:function(){var a=this,b=a.options,c=a.paper,d=a.layers,e=a.xAxis["0"]||{},g=e.axisData||{},h=g.scroll||{},l=a.canvasTop,m=a.canvasLeft,n=a.canvasWidth,p=a.canvasHeight,q=a.canvasBorderWidth,t=q||(g.showLine?
g.lineThickness:0),B=q||g.lineStartExtension,g=q||g.lineEndExtension,q=b.chart.useRoundEdges,w,D,F,G,N,H,J,L,M,P,V,T,U,X,ga,W=d.dataset,r=d.datalabels,v=d.tracker;G=d.layerAboveDataset;var C,K;h.enabled&&(C=d.scroll=d.scroll||c.group("scroll").insertAfter(G),G=h.scrollRatio,b=u(b[ka].xAxisScrollPos,h.startPercent),N=h.viewPortMax,H=h.viewPortMin,D=h.vxLength,J=Fa(D),L=h.showButtons,M=h.height,P=h.padding,V=h.color,T=h.flatScrollBars,D=h.windowedCanvasWidth=e.getAxisPosition(D),w=h.fullCanvasWidth=
e.getAxisPosition(N-H)-D,F=Z(b*w),U=a.fusionCharts.jsVars._reflowData,X={hcJSON:{_FCconf:{xAxisScrollPos:0}}},ga=X.hcJSON._FCconf,d.scroller=c.scroller(m-B,l+p+t+P-!!t,n+B+g,M,!0,{showButtons:L,displayStyleFlat:T,scrollRatio:G,scrollPosition:b},C).data("fullCanvasWidth",w).data("windowedCanvasWidth",D).attr({"scroll-display-style":T,fill:V,r:q&&2||0}).scroll(function(b){var c;F=-Z(b*w);W&&W.transform(["T",F,0]);r&&r.transform(["T",F,0]);v&&v.transform(["T",F,0]);e.setOffset&&e.setOffset(F);c={position:b,
direction:b-h.lastPos||0,vxLength:J};ga.xAxisScrollPos=h.lastPos=b;E(U,X,!0);if(0!==c.direction)for(K=0;K<a.datasets.length;K++)a[a.datasets[K].drawPlot+"Scroll"]&&a[a.datasets[K].drawPlot+"Scroll"].call(a,a.plots[K],a.datasets[K],c)}),function(){var b;I.eve.on("raphael.scroll.start."+d.scroller.id,function(c){b=c;z.raiseEvent("scrollstart",{scrollPosition:c},a.logic.chartInstance)});I.eve.on("raphael.scroll.end."+d.scroller.id,function(c){z.raiseEvent("scrollend",{prevScrollPosition:b,scrollPosition:c},
a.logic.chartInstance)})}());return h.enabled},finalizeScrollPlots:function(){var a=this,b=a.container,d=a.elements,e=a.layers,g=e.scroller,h=e.dataset,m=e.datalabels,e=e.tracker,p,q={},B,w=a.xAxis["0"]||{},E=(w.axisData||{}).scroll||{},D=u(a.options[ka].xAxisScrollPos,E.startPercent),F=E.fullCanvasWidth;E.enabled&&(h.attr({"clip-rect":d["clip-canvas"]}),m.attr({"clip-rect":d["clip-canvas"]}),e.attr({"clip-rect":d["clip-canvas"]}),d=function(b){var d=a.elements.canvas,e=p.left,h=p.top,m=b.state,s=
da&&c.getTouchEvent(b)||l;b=b.originalEvent;e=(b.clientX||b.pageX||s.pageX)-e;h=(b.clientY||b.pageY||s.pageY)-h;switch(m){case "start":B=d.isPointInside(e,h);q.ox=B&&e||null;if(!B)return!1;q.prevScrollPosition=g.attrs["scroll-position"];z.raiseEvent("scrollstart",{scrollPosition:q.prevScrollPosition},a.logic.chartInstance);break;case "end":z.raiseEvent("scrollend",{prevScrollPosition:q.prevScrollPosition,scrollPosition:q.scrollPosition},a.logic.chartInstance);B=!1;q={};break;default:if(!B)break;d=
e-q.ox;q.ox=e;q.scrollPosition=g.attrs["scroll-position"]-d/F;g.attr({"scroll-position":q.scrollPosition})}},da&&(p=c.getPosition(b),b&&(t(b,"pointerdrag",d),n(b,"pointerdrag",d))),0<D&&(b=-Z(D*F),h&&h.transform(["T",b,0]),m&&m.transform(["T",b,0]),e&&e.transform(["T",b,0]),w.setOffset&&w.setOffset(b)))},drawPlotColumn:function(a,b,c){var d=this,e=a.data,g=e.length,h=a.items,l=a.graphics||(a.graphics=[]),n=d.paper,p=d.smartLabel,q=d.logic,t=d.layers,w=d.options,E=d.elements,z=w.chart,D=!1!==(w.tooltip||
{}).enabled,F,H=d.definition.chart,J=w.plotOptions.series,L=J.dataLabels.style,M=d.xAxis[b.xAxis||0],P=d.yAxis[b.yAxis||0],V=d.chartWidth,T=d.chartHeight,U=P.axisData.reversed,W=q.isLog,Y=q.is3D,da=q.isStacked,aa=q.isWaterfall,ba=q.isCandleStick,r=X(M.axisData.scroll,{}),v=c||{},C=r.enabled,K=u(v.position,w[ka].xAxisScrollPos,r.startPercent),f=v.vxLength||Fa(r.vxLength),fa=v.scrollStart||Ha(0,Z((g-f)*K)-1)||0,R=v.scrollEnd||Ma(g,fa+f+2)||g,$=z.canvasBorderOpacity=I.color(z.plotBorderColor).opacity,
ja=d.canvasBorderWidth,qb=z.isCanvasBorder=0!==$&&0<ja,ea,sa=c!==La?0:isNaN(+J.animation)&&J.animation.duration||1E3*J.animation,na=b.numColumns||1,pa=b.columnPosition||0,bc=z.use3DLighting,ua=!1===b.visible?"hidden":"visible",za=z.overlapColumns,Da=M.getAxisPosition(0),la=M.getAxisPosition(1)-Da,Ba=H&&H.plotspacepercent,Aa=u(H&&H.plotpaddingpercent),Ca=J.groupPadding,Na=J.maxColWidth,xc=(1-.01*Ba)*la||Ma(la*(1-2*Ca),Na*na),Za=xc/2,tc=xc/na,Oc=Ma(tc-1,1<na?za||Aa!==La?0<Aa?tc*Aa/100:0:4:0),Fb=pa*
tc-Za+Oc/2,cb=P.max,Va=P.min,Ia=0<cb&&0<=Va,$a=0>=cb&&0>Va,Wa=0<cb&&0>Va,fb=$a||U&&Ia?cb:W||Ia?Va:0,Hb=P.yBasePos=P.getAxisPosition(fb),jb,kb=u(z.useRoundEdges,0),Ua=t.dataset=t.dataset||n.group("dataset-orphan"),Pa=t.datalabels=t.datalabels||n.group("datalabels").insertAfter(Ua),dd=t.tracker,mb=d.canvasTop,ub=d.canvasLeft,Jb=d.canvasWidth,Cb=d.canvasBottom,Fc=d.canvasRight,vc,Qb,ed,Gc,fc,gc,Mc,Nb,cc,pb,eb,dc,vb,Ac,Db,jc,tb,ab,Vb,ec,Oa,Gb,nb,wa,bb,Nc,ob,Xa,Eb,rc,sc,wc,Hc,ib,Cc,Wb,Ga,Yb,yc,Ub=function(a){xa.call(this,
d,a)},Xb=function(a,b){return function(c){a.attr(b);xa.call(this,d,c,"DataPlotRollOver")}},Tb=function(a,b){return function(c){a.attr(b);xa.call(this,d,c,"DataPlotRollOut")}};d.addCSSDefinition(".fusioncharts-datalabels .fusioncharts-label",{fontFamily:L.fontFamily,fontSize:L.fontSize,lineHeight:L.lineHeight,fontWeight:L.fontWeight,fontStyle:L.fontStyle,color:L.color});Pa.attr("class","fusioncharts-datalabels");sa&&(!c&&Pa.attr({transform:"...t"+V+","+T}),d.animationCompleteQueue.push({fn:function(){Pa.attr({transform:"...t"+
-V+","+-T})},scope:d}));tc-=Oc;C&&fa>R-f-2&&(fa=Ha(0,R-f-2));da&&(Wb=Ua.shadows||(Ua.shadows=n.group("shadows",Ua).toBack()));Eb=Ua.column||(Ua.column=n.group("columns",Ua));ba||Y||C||Eb.attrs["clip-rect"]||Eb.attr({"clip-rect":E["clip-canvas"]});aa&&Eb.toBack();if(Y)for(fc=z.xDepth||0,gc=z.yDepth||0,rc=Eb.negative=Eb.negative||n.group("negative-values",Eb),Hc=Eb.column=Eb.column||n.group("positive-values",Eb),wc=Eb.zeroPlane,!wc&&0>Va&&0<=cb&&(wc=Eb.zeroPlane=n.group("zero-plane",Eb).insertBefore(Hc),
Qb=z.zeroPlaneColor,ed=z.zeroPlaneBorderColor,Gc=z.zeroPlaneShowBorder,E.zeroplane=n.cubepath(ub-fc,Hb+gc,Jb,1,fc,gc,wc).attr({fill:[Qb,!bc],stroke:ed||"none","stroke-width":Gc?1:0})),(sc=rc.data("categoryplots"))||(rc.data("categoryplots",Array(g)),sc=rc.data("categoryplots")),(ib=Hc.data("categoryplots"))||(Hc.data("categoryplots",Array(g)),ib=Hc.data("categoryplots")),pb=0;pb<g;pb+=1)sc[pb]=sc[pb]||n.group(rc),ib[pb]=ib[pb]||n.group(Hc);else Cc=Eb;p.setStyle({fontFamily:L.fontFamily,fontSize:L.fontSize,
lineHeight:L.lineHeight,fontWeight:L.fontWeight,fontStyle:L.fontStyle});for(pb=fa;pb<R;pb+=1){eb=e[pb];Db=eb.y;F=eb.toolText;vc=a.index+"_"+pb;ob=Xa=null;if(null===Db){if(cc=h[pb])ob=cc.graphic,Y||ob.attr({height:0})}else{Mc=!1;Ac=u(eb.x,pb);dc=eb.link;vb=m(eb.borderWidth)||0;Nc=eb._FCW*la;tb=M.getAxisPosition(eb._FCX)||M.getAxisPosition(Ac)+Fb;jc=eb.previousY;Vb=P.getAxisPosition(jc||fb);ab=P.getAxisPosition(Db+(jc||0));Oa=hb(ab-Vb);Gb=Nc||tc;yc={index:pb,link:dc,value:eb.y,displayValue:eb.displayValue,
categoryLabel:eb.categoryLabel,toolText:eb.toolText,id:a.userID,datasetIndex:a.index,datasetName:a.name,visible:a.visible};if(Y){0>Db&&(ab=Vb,Mc=!0);Cc=0>Db?sc:ib;(cc=h[pb])||(cc=h[pb]={index:pb,value:Db,graphic:n.cubepath(Cc[pb]),dataLabel:null,tracker:null,hot:null});ob=cc.graphic;wa=bb={};eb.hoverEffects&&(wa={fill:[ga(eb.color),!bc],stroke:vb&&ga(eb.borderColor)||"NONE","stroke-width":vb},nb=eb.rolloverProperties,bb={fill:[ga(nb.color),!bc],stroke:nb.borderWidth&&ga(nb.borderColor)||"NONE","stroke-width":nb.borderWidth});
ob.attr({cubepath:[tb-fc,sa?Hb+gc:ab+gc,Gb,sa?0:Oa,fc,gc],fill:[ga(eb.color),!bc],stroke:vb&&ga(eb.borderColor)||"NONE","stroke-width":vb,visibility:ua}).shadow(J.shadow&&eb.shadow,Wb).data("BBox",{height:Oa,width:Gb,x:tb,y:ab});sa&&ob.animate({cubepath:[tb-fc,ab+gc,Gb,Oa,fc,gc]},sa,"normal",d.getAnimationCompleteFn());if(dc||D)!da&&Oa<oa&&(ab-=(oa-Oa)/2,Oa=oa),cc.tracker||(cc.tracker=n.cubepath(dd)),Xa=cc.tracker,Xa.attr({cubepath:[tb-fc,ab+gc,Gb,Oa,fc,gc],cursor:dc?"pointer":"",stroke:vb&&B||"NONE",
"stroke-width":vb,fill:B,ishot:!0,visibility:ua});(Xa||ob).data("eventArgs",yc).data("groupId",vc).click(Ub).hover(Xb(ob,bb),Tb(ob,wa)).tooltip(F);(Xa||ob)._.cubetop.data("eventArgs",yc).data("groupId",vc).click(Ub).hover(Xb(ob,bb),Tb(ob,wa)).tooltip(F);(Xa||ob)._.cubeside.data("eventArgs",yc).data("groupId",vc).click(Ub).hover(Xb(ob,bb),Tb(ob,wa)).tooltip(F);da&&Mc&&(ob.toBack(),Xa&&Xa.toBack())}else{Nb=!1;if(!W&&!U&&0>Db||!W&&U&&0<Db)ab=Vb,Nb=!0;U&&!Wa&&0<Db&&(ab=Vb-Oa,Nb=!1);aa&&0>Db&&G(jc)&&(ab-=
Oa,Nb=!0);ba||C||(N(ab)<=mb&&(Oa-=mb-ab-+qb,ab=mb-+qb),Z(ab+Oa)>=Cb&&(Oa-=Z(ab+Oa)-Cb+ +!!vb+ +qb,z.xAxisLineVisible&&!qb&&(Oa+=1)),1>=vb&&(Z(tb)<=ub&&(Gb+=tb,tb=ub-vb/2+ +!!vb-+qb,Gb-=tb),Z(tb+Gb)>=Fc&&(Gb=Fc-tb+vb/2-+!!vb+ +qb)));Ga=I.crispBound(tb,ab,Gb,Oa,vb);tb=Ga.x;ab=Ga.y;Gb=Ga.width;Oa=Ga.height;if(!ba&&qb&&(!G(jc)||aa&&jc===Db&&Db===eb._FCY))if($a&&!U)ea=ab-(mb-vb/2),Oa+=ea,Hb=ab-=ea;else if(W||Ia||U&&$a)Oa=Cb-ab+vb/2,Hb=ab+Oa;aa&&jc&&0<vb&&0!==J.connectorOpacity&&1===J.connectorWidth&&J.connectorDashStyle&&
(Oa-=1,0>Db&&(ab+=1));1>Oa&&(ab+=0>Db?1:0===Db?0:-(1-Oa),Oa=1);b._columnWidth=Gb;if(!(cc=h[pb])){cc=h[pb]={index:pb,value:Db,width:Gb,graphic:null,valueBelowPlot:Nb,dataLabel:null,tracker:null};jb=0;sa||(Hb=ab,jb=Oa||1);wa=bb={};eb.hoverEffects&&(wa={fill:ga(eb.color),stroke:ga(eb.borderColor),"stroke-width":vb,"stroke-dasharray":eb.dashStyle},nb=eb.rolloverProperties,bb={fill:ga(nb.color),stroke:ga(nb.borderColor),"stroke-width":nb.borderWidth,"stroke-dasharray":nb.dashStyle});Yb={x:tb,y:Hb,width:Gb,
height:jb,r:kb,fill:ga(eb.color),stroke:ga(eb.borderColor),"stroke-width":vb,"stroke-dasharray":eb.dashStyle,"stroke-linejoin":"miter",visibility:ua};ob?ob.attr(Yb):ob=cc.graphic=n.rect(Yb,Cc);ob.shadow(J.shadow&&eb.shadow,Wb).data("BBox",Ga);sa&&ob.animate({y:ab,height:Oa||1},sa,"normal",d.getAnimationCompleteFn());if(dc||D)!da&&Oa<oa&&(ab-=(oa-Oa)/2,Oa=oa),Yb={x:tb,y:ab,width:Gb,height:Oa,r:kb,cursor:dc?"pointer":"",stroke:B,"stroke-width":vb,fill:B,ishot:!0,visibility:ua},(Xa=cc.tracker)?Xa.attr(Yb):
Xa=cc.tracker=n.rect(Yb,dd);Xa=cc.tracker;(Xa||ob).data("eventArgs",yc).data("groupId",vc).click(Ub).hover(Xb(ob,bb),Tb(ob,wa)).tooltip(F)}}ec=d.drawPlotColumnLabel(a,b,pb,tb,ab)}ec&&l.push(ec);ob&&l.push(ob);Xa&&l.push(Xa);d.drawTracker&&d.drawTracker.call(d,a,b,pb)}a.visible=!1!==b.visible;return a},drawPlotColumnScroll:function(a,b,c){var d=a.data.length,e=a.items,g;g=c.vxLength;var h=Ha(0,Z((d-g)*c.position)-1)||0,d=Ma(d,h+g+2)||d;h>d-g-2&&(h=Ha(0,d-g-2));c.scrollEnd=d;for(g=h;g<d;g++)if(!e[g]){c.scrollStart=
g;this.drawPlotColumn(a,b,c);break}},drawPlotColumnLabel:function(a,b,c,d,e,g){var h=this.options,l=this.logic,m=h.chart;d=this.paper;var n=this.smartLabel,p=this.layers,h=h.plotOptions.series.dataLabels.style,q=1===m.rotateValues?270:0,u=this.canvasHeight,t=this.canvasTop,B=a.data[c];a=a.items[c];var z=m.valuePadding+2,w=a.graphic;c=a.dataLabel;var E=X(a.valueBelowPlot,0>B.y),D=l.isStacked,l=l.is3D,F=m.xDepth||0,N=m.yDepth||0,H=B.displayValue;b=!1===b.visible?"hidden":"visible";var m=m.placeValuesInside,
J;g=g||p.datalabels;G(H)&&H!==L&&null!==B.y?(a._state&&a._state.labelWidth||(n=n.getOriSize(H),a._state=q?{labelWidth:n.height,labelHeight:n.width}:{labelWidth:n.width,labelHeight:n.height}),w=w.data("BBox"),p=w.height,n=J=a._state.labelHeight+z,z=.5*J+z,w=w.x+.5*w.width,J=E?t+u-(e+p):e-t,D?(e=Ma(t+u-.5*n,e+.5*p+(N||0)),e=Ha(t+.5*n,e),w-=F):m?p>=n?(e+=E?p-z:z,B._valueBelowPoint=1,l&&(w-=F,e+=N)):J>=n?(e+=E?p+z:-z,l&&E&&(w-=F,e+=N)):(e+=E?p-z:z,B._valueBelowPoint=1,l&&(w-=F,e+=N)):J>=n?(e+=E?p+z:-z,
l&&(E?(w-=F,e+=N):w-=F/2)):(e+=E?p-z:z,B._valueBelowPoint=1,l&&(w-=F,e+=N)),c?c.attr({x:w,y:e,visibility:b}):c=a.dataLabel=d.text({text:H,"class":"fusioncharts-label",x:w,y:e,fill:h.color,"font-size":h.fontSize,visibility:b},g).attr({"line-height":h.lineHeight,"text-bound":[h.backgroundColor,h.borderColor,h.borderThickness,h.borderPadding,h.borderRadius,h.borderDash]}),q&&c.attr("transform","T0,0,R"+q)):c&&c.attr({text:L});return c},drawPlotFloatedcolumn:function(a,b){this.drawPlotColumn.call(this,
a,b)},drawPlotColumn3d:function(a,b){this.drawPlotColumn.call(this,a,b)},drawPlotBar:function(a,b){var c=this,d=a.data,e=d.length,g=a.items,h=a.graphics=[],l=c.paper,n=c.logic,p=c.layers,q=c.options,t=c.elements,w=q.chart,z=!1!==(q.tooltip||{}).enabled,E,D=c.definition.chart,q=q.plotOptions.series,F=q.dataLabels.style,G={fontFamily:F.fontFamily,fontSize:F.fontSize,lineHeight:F.lineHeight,fontWeight:F.fontWeight,fontStyle:F.fontStyle},F=c.xAxis[b.xAxis||0],H=c.yAxis[b.yAxis||0],J=n.is3D,n=n.isStacked,
L=w.canvasBorderOpacity=I.color(w.plotBorderColor).opacity,M=c.canvasBorderWidth,L=w.isCanvasBorder=0!==L&&0<M,M=isNaN(+q.animation)&&q.animation.duration||1E3*q.animation,P=b.numColumns||1,V=b.columnPosition||0,T=w.use3DLighting,U=!1===b.visible?"hidden":"visible",X=w.overlapColumns,W=F.getAxisPosition(0),W=F.getAxisPosition(1)-W,Y=D&&D.plotspacepercent,D=u(D&&D.plotpaddingpercent),da=q.groupPadding,r=q.maxColWidth,Y=(1-.01*Y)*W||Ma(W*(1-2*da),r*P),W=Y/2,Y=Y/P,X=Ma(Y-1,1<P?X||D!==La?0<D?Y*D/100:
0:4:0),P=Y-X,V=V*Y-W+X/2,v=H.max,C=H.min,X=H.getAxisPosition(0>v&&0>C?v:0<v&&0<C?C:0),D=u(w.useRoundEdges,0),K=c.canvasTop,W=c.canvasLeft,f=c.canvasHeight,Y=c.canvasRight,fa=c.chartWidth,R=c.chartHeight,$,aa,ba,ka,sa,ja,ea,na,pa,ua,da=H.axisData.effectiveZeroPlaneThickness;ea=p.dataset=p.dataset||l.group("dataset-orphan");var Ha=p.datalabels=p.datalabels||l.group("datalabels").insertAfter(ea),p=p.tracker,la,za,Aa,Da,Fa,Ba,r=function(a){xa.call(this,c,a)},Ca=function(a,b){return function(d){a.attr(b);
xa.call(this,c,d,"DataPlotRollOver")}},Na=function(a,b){return function(d){a.attr(b);xa.call(this,c,d,"DataPlotRollOut")}},Ua;c.addCSSDefinition(".fusioncharts-datalabels .fusioncharts-label",G);Ha.attr("class","fusioncharts-datalabels");M&&(c.animationCompleteQueue.push({fn:function(){Ha.attr({transform:"...t"+-fa+","+-R})},scope:c}),Ha.attr({transform:"...t"+fa+","+R}));n&&(Fa=ea.shadows||(ea.shadows=l.group("shadows",ea).toBack()));na=ea.column=ea.column||l.group("bars",ea);if(J)for($=w.xDepth||
0,aa=w.yDepth||0,G=na.negative=na.negative||l.group("negative-values",na),ea=na.column=na.column||l.group("positive-values",na),Aa=na.zeroPlane,!Aa&&0>C&&0<=v&&(Aa=na.zeroPlane=l.group("zero-plane",na).insertBefore(ea),ua=w.zeroPlaneColor,v=w.zeroPlaneBorderColor,C=w.zeroPlaneShowBorder,t.zeroplane=l.cubepath(X-$,K+aa,1,f,$,aa,Aa).attr({fill:[ua,!T],stroke:v||"none","stroke-width":C?1:0})),(Aa=G.data("categoryplots"))||(G.data("categoryplots",Array(e)),Aa=G.data("categoryplots")),(ua=ea.data("categoryplots"))||
(ea.data("categoryplots",Array(e)),ua=ea.data("categoryplots")),t=0;t<e;t+=1)Aa[t]=Aa[t]||l.group(G),ua[t]=ua[t]||l.group(ea);else na.attrs["clip-rect"]||na.attr({"clip-rect":t["clip-canvas"]}),Da=na;t=0;for(G=e-1;t<e;t+=1,G-=1){K=d[t];C=K.y;la=f=null;if(null===C){if(ja=g[t])la=ja.graphic,J||la.attr({width:0})}else{na=u(K.x,t);ea=K.link;E=K.toolText;v=m(K.borderWidth)||0;na=F.getAxisPosition(na)+V;ja=(ba=K.previousY)?H.getAxisPosition(ba):X;pa=H.getAxisPosition(C+(ba||0));ba=hb(pa-ja);0<C&&(pa=ja);
za={index:t,link:ea,value:K.y,displayValue:K.displayValue,categoryLabel:K.categoryLabel,toolText:K.toolText,id:a.userID,datasetIndex:a.index,datasetName:a.name,visible:a.visible};if(J){Da=0>C?Aa:ua;(ja=g[t])||(ja=g[t]={index:t,value:C,graphic:l.cubepath(Da[G]),dataLabel:null,tracker:null});la=ja.graphic;sa=ka={};K.hoverEffects&&(sa={fill:[ga(K.color),!T],stroke:v&&ga(K.borderColor)||"NONE","stroke-width":v},ka=K.rolloverProperties,ka={fill:[ga(ka.color),!T],stroke:ka.borderWidth&&ga(ka.borderColor)||
"NONE","stroke-width":ka.borderWidth});la.attr({cubepath:[M?X-$:pa-$,na+aa,M?0:ba,P,$,aa],fill:[ga(K.color),!T],stroke:v&&ga(K.borderColor)||"NONE","stroke-width":v,"stroke-dasharray":K.dashStyle,cursor:ea?"pointer":"",visibility:U}).shadow(q.shadow&&K.shadow,Fa).data("BBox",{height:P,width:ba,x:pa,y:na});M&&la.animate({cubepath:[pa-$,na+aa,ba,P,$,aa]},M,"normal",c.getAnimationCompleteFn());if(ea||z)!n&&ba<oa&&(pa-=(oa-ba)/2,ba=oa),ja.tracker||(ja.tracker=l.cubepath(p)),f=ja.tracker,f.attr({cubepath:[pa-
$,na+aa,ba,P,$,aa],cursor:ea?"pointer":"",stroke:v&&B||"NONE","stroke-width":v,fill:B,ishot:!0});(f||la).data("eventArgs",za).click(r).hover(Ca(la,ka),Na(la,sa)).tooltip(E);(f||la)._.cubetop.data("eventArgs",za).click(r).hover(Ca(la,ka),Na(la,sa));(f||la)._.cubeside.data("eventArgs",za).click(r).hover(Ca(la,ka),Na(la,sa));if(!n||n&&0>C)la.toBack(),f&&f.toBack()}else{N(pa)<=W&&(ba+=pa,pa=W+v/2+.2,w.xAxisLineVisible&&!L&&(pa-=1),ba-=pa);Z(pa+ba)>=Y&&(ba=Y-pa-v/2-.2);Ba=I.crispBound(pa,na,ba,P,v);pa=
Ba.x;na=Ba.y;ba=Ba.width;Ua=Ba.height;1>=ba&&(ba=1,pa+=0>C?-ba:0===C?0:1<da?ba:0);(ja=g[t])||(ja=g[t]={index:t,value:C,height:Ua,graphic:null,dataLabel:null,tracker:null});la=ja.graphic;sa=ka={};K.hoverEffects&&(sa={fill:ga(K.color),stroke:ga(K.borderColor),"stroke-width":v,"stroke-dasharray":K.dashStyle},ka=K.rolloverProperties,ka={fill:ga(ka.color),stroke:ga(ka.borderColor),"stroke-width":ka.borderWidth,"stroke-dasharray":ka.dashStyle});C={x:M?X:pa,y:na,width:M?0:ba||1,height:Ua,r:D,fill:ga(K.color),
stroke:ga(K.borderColor),"stroke-width":v,"stroke-dasharray":K.dashStyle,"stroke-linejoin":"miter",cursor:ea?"pointer":"",visibility:U};la?la.attr(C):la=ja.graphic=l.rect(C,Da);la.shadow(q.shadow&&K.shadow,Fa).data("BBox",Ba);M&&la.animate({x:pa,width:ba||1},M,"normal",c.getAnimationCompleteFn());if(ea||z)!n&&ba<oa&&(pa-=(oa-ba)/2,ba=oa),f=ja.tracker,C={x:pa,y:na,width:ba,height:P,r:D,cursor:ea?"pointer":"",stroke:B,"stroke-width":v,fill:B,ishot:!0},f?f.attr(C):f=ja.tracker=l.rect(C,p),f.data("eventArgs",
za);(f||la).data("eventArgs",za).click(r).hover(Ca(la,ka),Na(la,sa)).tooltip(E)}E=c.drawPlotBarLabel(a,b,t,pa,na)}E&&h.push(E);la&&h.push(la);f&&h.push(f);c.drawTracker&&c.drawTracker.call(c,a,b,t)}a.visible=!1!==b.visible;return a},drawPlotBarLabel:function(a,b,c,d,e,g){var h=this.options,l=this.logic,m=h.chart,n=this.paper,p=this.layers,q=h.plotOptions.series.dataLabels.style,h=this.canvasLeft,u=this.canvasWidth,t=a.data[c],B=a.items[c];a=m.valuePadding+2;var w=B.graphic;c=B.dataLabel;var z=0>t.y,
E=l.isStacked,l=l.is3D,D=m.xDepth||0,F=m.yDepth||0,N=t.displayValue;b=!1===b.visible?"hidden":"visible";m=m.placeValuesInside;g=g||p.datalabels;if(G(N)&&N!==L&&null!==t.y){c||(c=B.dataLabel=n.text({"class":"fusioncharts-label",text:N,"font-size":q.fontSize,title:t.originalText||"",fill:q.color,x:0,y:0,"line-height":q.lineHeight},g).attr("text-bound",[q.backgroundColor,q.borderColor,q.borderThickness,q.borderPadding,q.borderRadius,q.borderDash]));q=c.getBBox();g=w.data("BBox");t=g.height;p=g.width;
g=E?"middle":z?m?"start":"end":m?"end":"start";n=z?d-h:h+u-(d+p);q=q.width;q+=a;t=e+.5*t;w=d+(z?0:p);e=z?d-h:h+u-(d+p);if(E)w=Ha(h+.5*q,w+.5*(z?p:-p)),w=Ma(h+u-.5*q,w),w-=l?D:0,t+=l?F:0;else if(m?p>=q?(w+=z?a:-a,l&&(t+=F,w-=D)):q<n?(w+=z?-a:a,g=z?"end":"start",l&&z&&(w-=D)):(z?(w=d+p+Ha(q-d-p+h,0)-a,g="end",w-=l?D:0):(w=d-Ha(q-(h+u-d),0)+a,g="start"),l&&(w-=D,t+=F)):e>=q?(w+=z?-a:a,l&&z&&(w-=D,t+=D)):(w+=z?a+q:-(a+q),l&&(w-=D,t+=F)),w>h+u||w<h)w=h+4,g="start";c.attr({x:w,y:t,"text-anchor":g,visibility:b})}else c&&
c.attr({text:L});return c},drawPlotBar3d:function(a,b){this.drawPlotBar.call(this,a,b)},drawPlotLine:function(a,b){var c=this,d=c.paper,e=c.elements,g=c.options,h=g.chart,l=c.logic,n=g.plotOptions.series,p=a.items,q=a.graphics=a.graphics||[],t,z=c.xAxis[b.xAxis||0],E=c.yAxis[b.yAxis||0],D=l.multisetRealtime||l.dragExtended,F=l.isWaterfall,G,N,H,J,L,P=0,V=!1!==(g.tooltip||{}).enabled,T,U=isNaN(+n.animation)&&n.animation.duration||1E3*n.animation,X,W=n.dataLabels.style,Z={fontFamily:W.fontFamily,fontSize:W.fontSize,
lineHeight:W.lineHeight,fontWeight:W.fontWeight,fontStyle:W.fontStyle},Y=h.xDepth||0,ba=h.yDepth||0,r=h.series2D3Dshift,v=b.step,C=b.drawVerticalJoins,K=b.useForwardSteps,f=a.data,fa=!1===b.visible?"hidden":"visible",R,$=f.length,da=z.getAxisPosition(0),aa=z.getAxisPosition(1)-da,ka=aa*$,sa=z.axisData.scroll||{},ja=h.hasScroll||!1,ea,na=n.connectNullData,pa=c.chartWidth,oa=c.chartHeight,ua=function(){jc.attr({"clip-rect":null});Db.show();Ac.show();tb.show();Fc.attr({transform:"...t"+-pa+","+-oa})},
la,za,Aa,Ba,Da,Ca,Fa,La=null,Na,Fb,cb=n.connectorWidth=m(b.lineWidth),Va=b.color,Ia,Ua,hb=n.connectorDashStyle=b.dashStyle,fb,Hb,jb,kb,$a,Pa,Za,Wa,mb,ub=c.layers,Cb=ub.dataset=ub.dataset||d.group("dataset-orphan"),Fc=ub.datalabels=ub.datalabels||d.group("datalabels").insertAfter(Cb),vc=ub.tracker,Jb=e["clip-canvas-init"].slice(0),Qb=e["clip-canvas"].slice(0),Gc=E.axisData.reversed,fc=E.max,gc=E.min,Mc=E.getAxisPosition(0<fc&&0<gc?Gc?fc:gc:0>fc&&0>gc?Gc?gc:fc:Gc?fc:0)+(r?ba:0),Nb=[],cc=h.anchorTrackingRadius,
pb=/drag/ig.test(c.logic.rendererId),eb,dc,vb,Ac,Db,jc,tb,ab,Vb,ec,Oa,Gb,nb=[],wa=function(a){xa.call(this,c,a)},bb=function(a){return function(b){c.hoverPlotAnchor(this,b,"DataPlotRollOver",a,c)}},Nc=function(a){return function(b){c.hoverPlotAnchor(this,b,"DataPlotRollOut",a,c)}},ob=function(e,f,g,h,l,m,n,p){return function(){var r=g.imageUrl,t=g.imageScale,u=g.imageAlpha,v=n.imageHoverAlpha,w=n.imageHoverScale,z=this.height*t*.01,C=this.width*t*.01,E=this.width*w*.01;Za={x:e-this.width*t*.005,y:f-
this.height*t*.005,width:C,height:z,alpha:u};Wa={x:e-this.width*w*.005,y:f-this.height*w*.005,width:E,height:this.height*w*.01,alpha:v};v=E>C?Wa:Za;pb&&(v={cx:e,cy:f,r:.5*Ha(z,C)});(h.graphic=kb=d.image(r,tb).attr(Za).css({opacity:.01*u}).data("alwaysInvisible",!t).data("setRolloverProperties",n).data("setRolloverAttr",Wa).data("setRolloutAttr",Za).data("anchorRadius",t).data("anchorHoverRadius",w))&&q.push(kb);if(za||V||n)$a=h.tracker=(pb?d.circle(vc):d.rect(vc)).attr(v).attr({cursor:za?"pointer":
"",stroke:B,"stroke-width":g.lineWidth,fill:B,ishot:!0,visibility:fa}).data("eventArgs",l).data("groupId",eb).click(wa).hover(bb(h),Nc(h)).tooltip(m);c.drawTracker&&c.drawTracker.call(c,a,b,p);(Oa=h.dataLabel=c.drawPlotLineLabel(a,b,p,e,f))&&q.push(Oa)}},Xa=function(d,e,f,g,h,l,m,n){return function(){(Oa=g.dataLabel=c.drawPlotLineLabel(a,b,n,d,e))&&q.push(Oa)}};c.addCSSDefinition(".fusioncharts-datalabels .fusioncharts-label",Z);Fc.attr("class","fusioncharts-datalabels");n.connectorOpacity=I.color(Va).opacity;
E.yBasePos=Mc;F&&(G=(N=c.definition.chart)&&N.plotspacepercent,H=n.groupPadding,J=n.maxColWidth,L=(1-.01*G)*aa||Ma(aa*(1-2*H),1*J),P=L/2);Fc.attr({transform:"...t"+pa+","+oa});U&&c.animationCompleteQueue.push({fn:ua,scope:c});vb=Cb.line||(Cb.line=d.group("line-connector",Cb));Ac=a.lineShadowLayer||(a.lineShadowLayer=d.group("connector-shadow",vb));Db=a.anchorShadowLayer||(a.anchorShadowLayer=d.group("anchor-shadow",vb));jc=a.lineLayer||(a.lineLayer=d.group("connector",vb));tb=a.anchorLayer||(a.anchorLayer=
d.group("anchors",vb));tb.hide();Ac.hide();Db.hide();for(R=0;R<$;R+=1){la=f[R];Da=la.y;Ca=la.previousY||0;T=la.toolText;eb=a.index+"_"+R;mb=Oa=kb=$a=null;t=p[R]={index:R,value:null,graphic:null,connector:null,dataLabel:null,shadowGroup:Db,tracker:null};if(null===Da)nb.length=0,0===na&&(La=null);else{Ba=u(la.x,R);za=la.link;"boxandwhisker"===b.relatedSeries&&b.pointStart&&(Ba+=b.pointStart);Fb=E.getAxisPosition(Da+Ca)+(r?ba:0);Na=z.getAxisPosition(Ba)-Y;Na=M(Na,cb,cb).position;Fb=M(Fb,cb,cb).position;
if((fb=la.marker)&&fb.enabled)if(Hb=fb.symbol.split("_"),jb="spoke"===Hb[0]?1:0,Aa=fb.radius,ab=fb.shadow,dc={index:R,link:za,value:la.y,displayValue:la.displayValue,categoryLabel:la.categoryLabel,toolText:la.toolText,id:a.userID,datasetIndex:a.index,datasetName:a.name,visible:a.visible},Za=Wa={},Pa=la.rolloverProperties,fb.imageUrl)Gb=new w,Gb.onload=ob(Na,Fb,fb,t,dc,T,Pa,R),Gb.onerror=Xa(Na,Fb,fb,t,dc,T,Pa,R),Gb.src=fb.imageUrl;else{Pa&&(Za={polypath:[Hb[1]||2,Na,Fb,Aa,fb.startAngle,jb],fill:ga(fb.fillColor),
"stroke-width":fb.lineWidth,stroke:ga(fb.lineColor)},Wa={polypath:[Pa.sides||2,Na,Fb,Pa.radius,Pa.startAngle,Pa.dip],fill:ga(Pa.fillColor),"stroke-width":Pa.lineWidth,stroke:ga(Pa.lineColor)});kb=t.graphic=d.polypath(Hb[1]||2,Na,Fb,Aa,fb.startAngle,jb,tb).attr({fill:ga(fb.fillColor),"stroke-width":fb.lineWidth,stroke:ga(fb.lineColor),cursor:za?"pointer":"",visibility:Aa?fa:"hidden"}).data("alwaysInvisible",!Aa).data("setRolloverProperties",Pa).data("setRolloverAttr",Wa).data("setRolloutAttr",Za).data("anchorRadius",
Aa).data("anchorHoverRadius",Pa&&Pa.radius).shadow(ab||!1,Db);if(za||V||Pa)Aa=Ha(Aa,Pa&&Pa.radius||0,cc),$a=t.tracker=d.circle({cx:Na,cy:Fb,r:Aa,cursor:za?"pointer":"",stroke:B,"stroke-width":fb.lineWidth,fill:B,ishot:!0,visibility:fa},vc);($a||kb).data("eventArgs",dc).data("groupId",eb).click(wa).hover(bb(t),Nc(t)).tooltip(T);c.drawTracker&&c.drawTracker.call(c,a,b,R)}Vb=ec!==[ga(la.color||Va),la.dashStyle||hb].join(":");if(null!==La){if(nb.length&&(Nb=Nb.concat(nb),nb.length=0),(D||F||!Nb.join(""))&&
Nb.push("M",Fa,La),F&&Nb.push("m",-P,0),v?K?(Nb.push("H",Na),F&&Nb.push("h",P),C?Nb.push("V",Fb):Nb.push("m",0,Fb-La)):(C&&Nb.push("V",Fb),Nb.push("M",Fa,Fb,"H",Na)):Nb.push("L",Na,Fb),D||Vb)mb=t.connector=d.path(Nb,jc).attr({"stroke-dasharray":Ua,"stroke-width":cb,stroke:Ia,"stroke-linecap":"round","stroke-linejoin":2<cb?"round":"miter",visibility:fa}).shadow(n.shadow&&la.shadow,Ac),Nb=[]}else!D&&nb.push("M",Na,Fb);fb&&fb.imageUrl||(Oa=t.dataLabel=c.drawPlotLineLabel(a,b,R,Na,Fb));Fa=Na;La=Fb;Ia=
ga(la.color||Va);Ua=la.dashStyle||hb;ec=[Ia,Ua].join(":")}Oa&&q.push(Oa);kb&&q.push(kb);mb&&q.push(mb);$a&&q.push($a)}!D&&Nb.join("")&&(mb=d.path(Nb,jc).attr({"stroke-dasharray":Ua,"stroke-width":cb,stroke:Ia,"stroke-linecap":"round","stroke-linejoin":2<cb?"round":"miter",visibility:fa}).shadow(n.shadow&&la.shadow,Ac))&&q.push(mb);ja&&(ea=sa.startPercent,Qb[2]=ka+Jb[0],1===ea&&(Jb[0]=Qb[2],Qb[0]=0));U?(X=I.animation({"clip-rect":Qb},U,ja?"easeIn":"normal",c.getAnimationCompleteFn()),jc.attr({"clip-rect":Jb}).animate(F?
X.delay(U):X)):(ua&&ua(),ua=void 0);a.visible=!1!==b.visible;return a},hoverPlotAnchor:function(a,b,c,d,e){var g=d.graphic;d=d.dataLabel;var h=e.options.chart,l=1===h.rotateValues?270:0,m=g.data("setRolloverProperties"),n=g.data("isRealtime"),p=n&&g.attr("polypath"),q=g.data("setRolloverAttr"),t="image"===g.type,u=g.data("setRolloutAttr"),w=d&&(d.data("isBelow")?1:-1)*(t?.5*(q.height-u.height):g.data("anchorHoverRadius")-g.data("anchorRadius")),B="DataPlotRollOver"==c?q:u,z={transform:"T0,"+("DataPlotRollOver"===
c?w:0)+"R"+l},E={fill:B.fill,"stroke-width":B["stroke-width"],stroke:B.stroke},B=t?B:{polypath:B.polypath},h=h.syncLabelWithAnchor,D=g.data("anchorRadius"),F=g.data("anchorHoverRadius"),q=!(/,0\)$/.test(q.fill)&&/,0\)$/.test(u.fill))&&g.data("anchorHoverRadius")-g.data("anchorRadius")&&m.animation&&50;d&&d.data("isMiddle")&&(z={transform:"T,"+("DataPlotRollOver"===c?w:0)+",0R"+l});m&&(("DataPlotRollOver"==c&&0!==F||"DataPlotRollOut"==c&&0!==D)&&g.attr({visibility:"visible"}),t?g.css({opacity:.01*
B.alpha}):g.attr(E),n&&!t&&(B.polypath[1]=p[1],B.polypath[2]=p[2]),g.stop(),g.animate(B,q,"easeOut",function(){("DataPlotRollOver"==c&&!F||"DataPlotRollOut"==c&&!D)&&g.attr({visibility:"hidden"})}),d&&d.stop(),q&&h&&d&&d.animate(z,q,"easeOut"));xa.call(a,e,b,c)},drawPlotArea:function(a,b){var c=this,d=c.paper,e=c.options,g=e.chart,h=c.logic,l=e.plotOptions.series,m=c.elements,n=a.items,p=a.graphics=a.graphics||[],q,t=c.xAxis[b.xAxis||0],z=c.yAxis[b.yAxis||0],D=z.axisData.reversed,F=g.xDepth||0,G=
g.yDepth||0,h=h.isStacked,N=!1!==(e.tooltip||{}).enabled,H,J,e=l.dataLabels.style,I={fontFamily:e.fontFamily,fontSize:e.fontSize,lineHeight:e.lineHeight,fontWeight:e.fontWeight,fontStyle:e.fontStyle,color:e.color},e=isNaN(+l.animation)&&l.animation.duration||1E3*l.animation,L=g.series2D3Dshift,M="0"===c.definition.chart.drawfullareaborder,P=a.data,V=!1===b.visible?"hidden":"visible",T=P.length,U=t.getAxisPosition(0),X=(t.getAxisPosition(1)-U)*T,W=t.axisData.scroll||{},U=g.hasScroll||!1,Z=l.connectNullData,
r,v,C,K,f,fa=z.max,R=z.min,$=z.getAxisPosition(0<fa&&0>R?0:!D&&0<fa&&0<=R?R:fa)+(L?G:0),Y=c.chartWidth,ba=c.chartHeight,D=function(){Za.attr({"clip-rect":null});fb.show();Ua.show();Ma.attr({transform:"...t"+-Y+","+-ba})},da=null,sa,aa,fa=b.lineWidth,R=b.dashStyle,ka=ga(b.fillColor),ja=ga(b.lineColor),ea=0,na=/drag/ig.test(c.logic.rendererId),pa,la,oa,Aa,ua,za,Ba=[],Da=[],Fa=null,La=[],Ca=c.layers;K=Ca.dataset=Ca.dataset||d.group("dataset-orphan");var Ma=Ca.datalabels=Ca.datalabels||d.group("datalabels").insertAfter(K),
Na=Ca.tracker,Ca=m["clip-canvas-init"].slice(0),m=m["clip-canvas"].slice(0),g=g.anchorTrackingRadius,Ia,Ua,$a,fb,Za,jb,kb,hb,Pa,Wa,mb=function(a){xa.call(this,c,a)},ub=function(a){return function(b){c.hoverPlotAnchor(this,b,"DataPlotRollOver",a,c)}},Cb=function(a){return function(b){c.hoverPlotAnchor(this,b,"DataPlotRollOut",a,c)}},Fa=function(e,f,g,h,l,m,n,q){return function(){var r=g.imageUrl,t=g.imageScale,u=g.imageAlpha,w=n.imageHoverAlpha,z=n.imageHoverScale,C=this.width*t*.01,D=this.width*z*
.01;ua={x:e-this.width*t*.005,y:f-this.height*t*.005,width:C,height:this.height*t*.01,alpha:u};za={x:e-this.width*z*.005,y:f-this.height*z*.005,width:D,height:this.height*z*.01,alpha:w};w=D>C?za:ua;na&&(w={cx:e,cy:f,r:.5*Ha(D,C)});(h.graphic=la=d.image(r,fb).attr(ua).css({opacity:.01*u}).data("alwaysInvisible",!t).data("setRolloverProperties",n).data("setRolloverAttr",za).data("setRolloutAttr",ua).data("anchorRadius",t).data("anchorHoverRadius",z))&&p.push(la);if(v||N||n)Ia=E({cursor:v?"pointer":
"",stroke:B,"stroke-width":g.lineWidth,fill:B,ishot:!0,visibility:V},w),oa=h.tracker=(na?d.circle(Ia,Na):d.rect(Ia,Na)).data("eventArgs",l).click(mb).hover(ub(h),Cb(h)).tooltip(m),c.drawTracker&&c.drawTracker.call(c,a,b,q);(Wa=h.dataLabel=c.drawPlotLineLabel(a,b,q,e,f))&&p.push(Wa)}},Jb=function(d,e,f,g,h,l,m,n){return function(){(Wa=g.dataLabel=c.drawPlotLineLabel(a,b,n,d,e))&&p.push(Wa)}};c.addCSSDefinition(".fusioncharts-datalabels .fusioncharts-label",I);Ma.attr("class","fusioncharts-datalabels");
z.yBasePos=$;Ma.attr({transform:"...t"+Y+","+ba});e&&c.animationCompleteQueue.push({fn:D,scope:c});I=K;h&&(jb=I.shadows||(I.shadows=d.group("shadows",I).toBack()));Za=I.area=I.area||d.group("area",I);I=I.areaConnector||(I.areaConnector=d.group("area-connector",I));a.lineShadowLayer||(a.lineShadowLayer=d.group("connector-shadow",I));Ua=a.anchorShadowLayer||(a.anchorShadowLayer=d.group("anchor-shadow",I));$a=a.lineLayer||(a.lineLayer=d.group("connector",I));fb=a.anchorLayer||(a.anchorLayer=d.group("anchors",
I));fb.hide();Ua.hide();I=K;for(I=0;I<T;I+=1){r=P[I];K=r.y;q=u(r.x,I);sa=t.getAxisPosition(q)-F;la=Wa=oa=null;q=n[I]={};if(null===K)0===Z&&(da=null,0<ea&&(1===ea?Ba.splice(-8,8):(Ba=Ba.concat(Da),Ba.push("Z")),Da=[])),q.chart=c,q.index=I,q.value=K;else{v=r.link;H=r.toolText;J=r.previousY;f=(f=z.getAxisPosition(J)||null)||$;aa=z.getAxisPosition(K+(J||0))+(L?G:0);if((Pa=r.marker)&&Pa.enabled)if(J={index:I,link:v,value:r.y,displayValue:r.displayValue,categoryLabel:r.categoryLabel,toolText:r.toolText,
id:a.userID,datasetIndex:a.index,datasetName:a.name,visible:a.visible},ua=za={},Aa=r.rolloverProperties,Pa.imageUrl)C=new w,C.onload=Fa(sa,aa,Pa,q,J,H,Aa,I),C.onerror=Jb(sa,aa,Pa,q,J,H,Aa,I),C.src=Pa.imageUrl;else{pa=Pa.symbol.split("_");C=Pa.radius;hb=Pa.shadow;Aa&&(ua={polypath:[pa[1]||2,sa,aa,C,Pa.startAngle,0],fill:ga(Pa.fillColor),"stroke-width":Pa.lineWidth,stroke:ga(Pa.lineColor)},Aa=r.rolloverProperties,za={polypath:[Aa.sides||2,sa,aa,Aa.radius,Aa.startAngle,Aa.dip],fill:ga(Aa.fillColor),
"stroke-width":Aa.lineWidth,stroke:ga(Aa.lineColor)});la=q.graphic=d.polypath(pa[1]||2,sa,aa,C,Pa.startAngle,0,fb).attr({fill:ga(Pa.fillColor),"stroke-width":Pa.lineWidth,stroke:ga(Pa.lineColor),cursor:v?"pointer":"",visibility:C?V:"hidden"}).data("alwaysInvisible",!C).data("setRolloverProperties",Aa).data("setRolloverAttr",za).data("setRolloutAttr",ua).data("anchorRadius",C).data("anchorHoverRadius",Aa&&Aa.radius).shadow(hb||!1,Ua);if(v||N||Aa)h||(C=Ha(C,Aa&&Aa.radius||0,g)),oa=q.tracker=d.circle({cx:sa,
cy:aa,r:C,cursor:v?"pointer":"",stroke:B,"stroke-width":Pa.lineWidth,fill:B,ishot:!0,visibility:V},Na);(oa||la).data("eventArgs",J).click(mb).hover(ub(q),Cb(q)).tooltip(H);c.drawTracker&&c.drawTracker.call(c,a,b,I)}null===da?(La.push("M",sa,",",aa),Ba.push("M",sa,",",f),ea=0):La.push("L",sa,",",aa);Ba.push("L",sa,",",aa);Da.unshift("L",sa,",",f);ea++;da=aa;Pa&&Pa.imageUrl||(Wa=q.dataLabel=c.drawPlotLineLabel(a,b,I,sa,aa));q.chart=c;q.index=I;q.value=K;q.dataLabel=Wa}Wa&&p.push(Wa);la&&p.push(la);
oa&&p.push(oa)}0<ea&&(1===ea?Ba.splice(-8,8):(Ba=Ba.concat(Da),Ba.push("Z")));(Fa=a.graphic=d.path(Ba,Za).attr({fill:ka,"stroke-dasharray":R,"stroke-width":M?0:fa,stroke:ja,"stroke-linecap":"round","stroke-linejoin":2<fa?"round":"miter",visibility:V}).shadow(l.shadow&&r.shadow,jb))&&p.push(Fa);U&&(l=W.startPercent,m[2]=X+Ca[0],1===l&&(Ca[0]=m[2],m[0]=0));e?kb=Za.attr({"clip-rect":Ca}).animate({"clip-rect":m},e,U?"easeIn":"normal",c.getAnimationCompleteFn()):(D&&D(),D=void 0);jb&&(e?jb.attr({"clip-rect":Ca}).animateWith(Za,
kb,{"clip-rect":m},e,U?"easeIn":"normal",function(){jb.attr({"clip-rect":null})}):jb.attr({"clip-rect":null}));M&&(l=a.connector=d.path(La,$a).attr({"stroke-dasharray":R,"stroke-width":fa,stroke:ja,"stroke-linecap":"round","stroke-linejoin":2<fa?"round":"miter",visibility:V}),e?$a.attr({"clip-rect":Ca}).animateWith(Za,kb,{"clip-rect":m},e,U?"easeIn":"normal",function(){$a.attr({"clip-rect":null})}):$a.attr({"clip-rect":null}),l&&p.push(l));a.visible=!1!==b.visible;return a},drawPlotScatter:function(a,
b){var c=this,d=c.options,e=d.chart,g=d.plotOptions.series,h=c.paper,l=c.elements,m=a.items,n,p=a.graphics=a.graphics||[],q=c.xAxis[b.xAxis||0],t=c.yAxis[b.yAxis||0],u=a.data,w=!1===b.visible?"hidden":"visible",d=!1!==(d.tooltip||{}).enabled,z,E=g.dataLabels.style,D={fontFamily:E.fontFamily,fontSize:E.fontSize,lineHeight:E.lineHeight,fontWeight:E.fontWeight,fontStyle:E.fontStyle,color:E.color},E=isNaN(+g.animation)&&g.animation.duration||1E3*g.animation,F=c.chartWidth,G=c.chartHeight,N,H,I,J,L,M,
P,V,T,U=b.lineWidth,r=0<U,v=b.color,C=b.dashStyle,K=g.connectNullData,f=[],X,R,$,W,Z,Y,ba=c.layers,da=ba.dataset||(ba.dataset=h.group("dataset-orphan")),aa=ba.datalabels||(ba.datalabels=h.group("datalabels").insertAfter(da)),ba=ba.tracker,e=e.anchorTrackingRadius,ea,ja,ka,na=function(a){xa.call(this,c,a)},la=function(a){return function(b){c.hoverPlotAnchor(this,b,"DataPlotRollOver",a,c)}},oa=function(a){return function(b){c.hoverPlotAnchor(this,b,"DataPlotRollOut",a,c)}};c.addCSSDefinition(".fusioncharts-datalabels .fusioncharts-label",
D);aa.attr("class","fusioncharts-datalabels");E&&(c.animationCompleteQueue.push({fn:function(){aa.attr({transform:"...t"+-F+","+-G})},scope:c}),aa.attr({transform:"...t"+F+","+G}));ea=da.line||(da.line=h.group("line-connector",da));a.lineShadowLayer=h.group("connector-shadow",ea);da=a.anchorShadowLayer=h.group("anchor-shadow",ea);D=a.lineLayer=h.group("connector",ea);ea=a.anchorLayer=h.group("anchors",ea);N=0;for(H=u.length;N<H;N+=1){I=u[N];X=I.marker;V=T=W=z=Z=null;ka=a.index+"_"+N;M=I.y;L=I.x;if(null!==
M&&null!==L){if(X&&X.enabled){J=I.link;z=I.toolText;$=X.radius;ja=X.shadow;T=t.getAxisPosition(M);V=q.getAxisPosition(L);R={index:N,link:J,y:I.y,x:I.x,displayValue:I.displayValue,categoryLabel:I.categoryLabel,toolText:I.toolText,id:a.userID,datasetIndex:a.index,datasetName:a.name,visible:a.visible};W=X.symbol.split("_");n=m[N]={index:N,x:L,y:M,value:M};L=M={};I.hoverEffects&&(L={polypath:[W[1]||2,V,T,$,X.startAngle,0],fill:ga(X.fillColor),"stroke-width":X.lineWidth,stroke:ga(X.lineColor)},Y=I.rolloverProperties,
M={polypath:[Y.sides||2,V,T,Y.radius,Y.startAngle,Y.dip],fill:ga(Y.fillColor),"stroke-width":Y.lineWidth,stroke:ga(Y.lineColor)});W=n.graphic=h.polypath(W[1]||2,V,T,$,X.startAngle,0,ea).attr({fill:ga(X.fillColor),"stroke-width":X.lineWidth,stroke:ga(X.lineColor),cursor:J?"pointer":"",visibility:$?w:"hidden"}).data("alwaysInvisible",!$).data("setRolloverProperties",Y).data("setRolloverAttr",M).data("setRolloutAttr",L).data("anchorRadius",$).data("anchorHoverRadius",Y&&Y.radius).shadow(ja||!1,da);if(J||
d||Y)$=Ha($,Y&&Y.radius||0,e),Z=n.tracker=h.circle({cx:V,cy:T,r:$,cursor:J?"pointer":"",stroke:B,"stroke-width":X.lineWidth,fill:B,ishot:!0,visibility:w},ba);(Z||W).data("eventArgs",R).data("groupId",ka).click(na).hover(la(n),oa(n)).tooltip(z)}r&&((void 0===P||null===P&&0===K)&&V&&T&&f.push("M",V,",",T),V&&T&&f.push("L",V,",",T),P=T);z=n.dataLabel=c.drawPlotLineLabel(a,b,N,V,T)}else r&&0===K&&(P=null),m[N]={chart:c,index:N,x:L,y:M};z&&p.push(z);W&&p.push(W);Z&&p.push(Z);c.drawTracker&&c.drawTracker.call(c,
a,b,N)}f.length&&(g=a.graphic=h.path(f,D).attr({"stroke-dasharray":C,"stroke-width":U,stroke:v,"stroke-linecap":"round","stroke-linejoin":2<U?"round":"miter",visibility:w}).shadow(g.shadow&&I.shadow),D.attr({"clip-rect":l[E?"clip-canvas-init":"clip-canvas"]}),E&&D.animate({"clip-rect":l["clip-canvas"]},E,"normal"),p.push(g));E&&ea.attr({opacity:0}).animate({opacity:1},E,"normal",c.getAnimationCompleteFn());a.visible=!1!==b.visible;return a},drawPlotLineLabel:function(a,b,c,d,e,g){var h=this.options,
l=h.chart,m=this.paper,n=this.layers,p=h.plotOptions.series.dataLabels.style,h=1===l.rotateValues?270:0,q=this.canvasHeight,t=this.canvasTop,u=a.data,w=u[c],B=a.items[c],z=T(w.valuePosition,"auto").toLowerCase();a=this.logic.defaultSeriesType;var E=B.graphic,D=w.marker,E=D&&D.enabled?E&&"image"==E.type&&.5*E.attr("height")||D&&D.radius-3:0,l=l.valuePadding+2+E;b=!1===b.visible?"hidden":"visible";E=B.dataLabel;g=g||n.datalabels;switch(z){case "above":c=0;break;case "below":c=1;break;default:n=u[c-
1]||{},u=u[c+1]||{},c=c?n.y>w.y?1:(null==n.y&&u.y)>w.y?1:0:0}n=w.displayValue;G(n)&&n!==L?(E?h&&E.attr("transform",["r",360-h]):E=B.dataLabel=m.text(g).attr({"class":"fusioncharts-label",text:n,fill:p.color,"text-bound":[p.backgroundColor,p.borderColor,p.borderThickness,p.borderPadding,p.borderRadius,p.borderDash],"font-weight":p.fontWeight,"font-style":p.fontStyle,"font-family":p.fontFamily,"font-size":p.fontSize,"line-height":p.lineHeight}),E.attr({title:w.originalText||"",fill:p.color}),B._state&&
B._state.labelWidth||(g=E.getBBox(),B._state={labelWidth:g.width,labelHeight:g.height}),m=p=h?B._state.labelWidth:B._state.labelHeight,g=e-t,q=t+q-e,m=m+l+4,t=.5*p+l,/bubble/i.test(a)||(c?q>m?(e+=t,w._valueBelowPoint=1):g>m&&(e-=t,w._valueBelowPoint=0):g>m?(e-=t,w._valueBelowPoint=0):q>m&&(e+=t,w._valueBelowPoint=1)),E.attr({x:d,y:e,visibility:b}).data("isBelow",w._valueBelowPoint),h&&E.attr("transform","T0,0,R"+h)):E&&E.attr({text:L});return E},drawLabels:function(){for(var a=this.paper,b=this.options,
c=(b=b.labels&&b.labels.items&&b.labels.items)&&b.length,d=this.layers.layerAboveDataset,e=this.elements.quadran||(this.elements.quadran=[]),g=this.canvasTop,h=this.canvasLeft,l={right:"end",left:"start",undefined:"start"},m,n,p;c--;)p=b[c],m=p.style,n={fontFamily:m.fontFamily,fontSize:m.fontSize,lineHeight:m.lineHeight,fontWeight:m.fontWeight,fontStyle:m.fontStyle,fill:m.color},G(p.html)&&p.html!==L&&(e[c]=a.text(d).attr({text:p.html,x:parseInt(m.left,10)+h,y:parseInt(m.top,10)+g,"text-anchor":l[p.textAlign],
"vertical-align":p.vAlign}).css(n))}},b["renderer.root"]);b("renderer.piebase",{isHovered:!1,getPlotData:function(a,b){var c=this.datasets[0],d=c.data[a],c=c.userData||(c.userData=[]),e,g;if(c[a])c=c[a];else{c=c[a]={};for(g in d)"object"!==typeof(e=d[g])&&"function"!==typeof e&&0!==g.indexOf("_")&&(c[g]=e);c.value=c.y;c.label=c.name;delete c.y;delete c.total;delete c.doNotSlice;delete c.name;delete c.centerAngle;delete c.showInLegend}c.sliced=b;return c},redrawDataLabels:function(a){var b=a.elements.plots[0];
a.placeDataLabels(!0,b.items,b);return{}},sliceInOtherPies:function(a){var b=this.options.series[0],c=b.plot.items,d=c.length,e=0,g;for(b.enableMultiSlicing=!0;d--;)d!==a&&(g=c[d]).sliced&&++e&&this.plotGraphicClick.call(g);b.enableMultiSlicing=!1;return!!e},plotGraphicClick:function(a){var b=this.graphic||this,c=b.plotItem||b.data("plotItem"),d=c.seriesData,e=c.chart,g=e.logic.chartInstance,h=c.index,l=b.data("eventArgs")||{},m=e.options.series[0].enableMultiSlicing,n=d.data[c.index].doNotSlice,
p=c.slicedTranslation,q,t;!d.isRotating&&xa.call(b,e,a);if(!(d.isRotating||d.singletonCase||n||(b=!m&&e.sliceInOtherPies(h),(a=c.sliced)&&b)))return b=c.graphic,d=c.connector,m=c.dataLabel,p="object"===typeof p?"t"+p:p,n=c.connectorPath,q=(a?-1:1)*c.transX,t=(a?-1:1)*c.transY,z.raiseEvent("slicingStart",{slicedState:a,dataIndex:"index"in l&&l.index,data:e.getPlotData(h,a)},g),b.animate({transform:a?"t0,0":p},200,"easeIn",function(){z.raiseEvent("slicingEnd",{slicedState:c.sliced,dataIndex:"index"in
l&&l.index,data:e.getPlotData(h,c.sliced)},g)}),m&&m.x&&m.animate({x:m.x+(a?0:q)},200,"easeIn"),n&&(n[1]+=q,n[2]+=t,n[4]+=q,n[6]+=q,d.animate({path:n},200,"easeIn")),a=c.sliced=!a,b={hcJSON:{series:[]}},b.hcJSON.series[0]={data:p=[]},p[h]={sliced:a},E(g.jsVars._reflowData,b,!0),a},plotDragStart:function(a,b,c){var d=this.data("plotItem"),e=d.chart,d=d.seriesData,g=-e.datasets[0].startAngle*Da;e.options.series[0].enableRotation&&(a=h.call(c,a,b,d.pieCenter,d.chartPosition),d.dragStartAngle=a,d.startingAngleOnDragStart=
g)},plotDragEnd:function(){var a=this.data("plotItem"),b=a.chart,c=a.seriesData,a=-b.datasets[0].startAngle*Da,d={hcJSON:{series:[{startAngle:a}]}};b.disposed||(E(b.logic.chartInstance.jsVars._reflowData,d,!0),b.rotate(c,b.options.series[0]));c.isRotating&&(setTimeout(function(){c.isRotating=!1},0),z.raiseEvent("RotationEnd",{startingAngle:D(a,!0),changeInAngle:a-c.startingAngleOnDragStart},b.logic.chartInstance));!b.isHovered&&b.onPlotHover(this,!1)},plotDragMove:function(a,b,c,d,e){a=this.data("plotItem");
var g=a.chart,l=a.seriesData,m=g.options.series;m[0].enableRotation&&!l.singletonCase&&(l.isRotating||(l.isRotating=!0,z.raiseEvent("RotationStart",{startingAngle:D(l.startingAngleOnDragStart,!0)},g.logic.chartInstance)),c=h.call(e,c,d,l.pieCenter,l.chartPosition),m[0].startAngle+=c-l.dragStartAngle,l.dragStartAngle=c,l.moveDuration=0,c=(new Date).getTime(),!l._lastTime||l._lastTime+l.timerThreshold<c)&&(setTimeout(function(){g.rotate(l,m[0])},0),l._lastTime=c)},plotMouseDown:function(){(this.plotItem||
this.data("plotItem")).seriesData.isRotating=!1},plotMouseUp:function(a){var b=this.plotItem||this.data("plotItem"),c=b.chart,d=b.seriesData;I.supportsTouch&&!d.isRotating&&c.plotGraphicClick.call(b,a)},plotRollOver:function(a){var b=this.plotItem||this.data("plotItem"),c=b.chart,d,e;b.seriesData.isRotating||(xa.call(this,c,a,"DataPlotRollOver"),c.onPlotHover(this,!0));c.isHovered=!0;(a=b.innerDiameter)&&(d=b.centerLabelConfig)&&(e=d.label)&&c.drawDoughnutCenterLabel(e,b.center[0],b.center[1],a,a,
d,!1)},plotRollOut:function(a){var b=this.plotItem||this.data("plotItem"),c=b.chart,d=c.options.series[0],e,g;b.seriesData.isRotating||(xa.call(this,c,a,"DataPlotRollOut"),c.onPlotHover(this,!1));c.isHovered=!1;(a=b.innerDiameter)&&(e=d.centerLabelConfig)&&((g=e.label)||!g)&&c.drawDoughnutCenterLabel(g,b.center[0],b.center[1],a,a,e,!1)},onPlotHover:function(a,b){var c=a.data("plotItem"),d=c.rolloverProperties,e=b?d.color:c.color,g=b?d.borderWidth:c.borderWidth,h=b?d.borderColor:c.borderColor;d&&c.graphic.attr({fill:ga(e),
"stroke-width":g,stroke:h})},getEventArgs:function(a){a=a||{};return{datasetName:a.label,datasetIndex:a.originalIndex,id:a.userID,visible:!0,label:a.label,value:a.value,percentValue:a.percentage,tooltext:a.toolText,link:a.link,sliced:a.sliced}},legendClick:function(a){var b=a.chart;b.elements.plots[0].isRotating=!1;b.plotGraphicClick.call(a)},placeDataLabels:function(){var a=function(a,b){return a.point.value-b.point.value},b=function(a,b){return a.angle-b.angle},c=["start","start","end","end"],d=
[-1,1,1,-1],e=[1,1,-1,-1];return function(g,h,l,m){var n=this.options.plotOptions,p=n.pie,t=this.canvasLeft+.5*this.canvasWidth,w=this.canvasTop+.5*this.canvasHeight,B=this.smartLabel,z=n.series.dataLabels,E=z.style,D=u(Fa(parseFloat(E.lineHeight)),12),D=q(z.placeLabelsInside,1===h.length?!0:!1),n=z.skipOverlapLabels,F=z.manageLabelOverflow,N=z.connectorPadding,G=z.distance,I=m&&m.metrics||[t,w,p.size,p.innerSize||0],H=I[1],J=I[0];m=.5*I[2];var L=[[],[],[],[]],M=this.canvasLeft,P=this.canvasTop,p=
this.canvasWidth,G=l.labelsRadius||(l.labelsRadius=m+G),w=t=parseInt(E.fontSize,10),V=w/2,N=[N,N,-N,-N];l=l.labelsMaxInQuadrant||(l.labelsMaxInQuadrant=Za(G/w));var z=z.isSmartLineSlanted,I=I[3]/2,T,U,X,r,v,C,K,f,W,R,$,Z,ba,da,aa,ga,ea,ja,ka,oa;g||B.setStyle(E);if(1==h.length&&!I&&D)r=h[0],(aa=r.dataLabel)&&aa.show(),r.slicedTranslation=[M,P],aa&&(aa.attr({visibility:Ca,align:"middle",transform:["t",J,H]}),aa.x=J);else if(D)oa=I+(m-I)/2,Y(h,function(a){(aa=a.dataLabel)&&aa.show();aa&&(ba=a.angle,
Z=H+oa*pa(ba),f=J+oa*za(ba),aa.x=f,aa._x=f,aa.y=Z,a.sliced&&(ka=a.slicedTranslation,ea=ka[0]-M,ja=ka[1]-P,f+=ea,Z+=ja),aa.attr({visibility:Ca,align:"middle",transform:["t",f,Z]}))});else{Y(h,function(a){(aa=a.dataLabel)&&aa.show();aa&&(ba=a.angle%Ba,0>ba&&(ba=Ba+ba),ga=0<=ba&&ba<Na?1:ba<$a?2:ba<Cb?3:0,L[ga].push({point:a,angle:ba}))});for(h=g=4;h--;){if(n&&(D=L[h].length-l,0<D))for(L[h].sort(a),E=L[h].splice(0,D),D=0,X=E.length;D<X;D+=1)r=E[D].point,r.dataLabel.attr({visibility:"hidden"}),r.connector&&
r.connector.attr({visibility:"hidden"});L[h].sort(b)}D=Ha(L[0].length,L[1].length,L[2].length,L[3].length);da=Ha(Ma(D,l)*w,G+w);L[1].reverse();for(L[3].reverse();g--;){I=L[g];X=I.length;n||(w=X>l?da/X:t,V=w/2);r=X*w;E=da;for(h=0;h<X;h+=1,r-=w)D=hb(da*pa(I[h].angle)),E<D?D=E:D<r&&(D=r),E=(I[h].oriY=D)-w;T=c[g];X=da-(X-1)*w;E=0;for(h=I.length-1;0<=h;h-=1,X+=w)if(r=I[h].point,ba=I[h].angle,v=r.sliced,aa=r.dataLabel,D=hb(da*pa(ba)),D<E?D=E:D>X&&(D=X),E=D+w,R=(D+I[h].oriY)/2,C=J+e[g]*G*za(na.asin(R/da)),
R*=d[g],R+=H,$=H+m*pa(ba),K=J+m*za(ba),(2>g&&C<K||1<g&&C>K)&&(C=K),f=C+N[g],Z=R-V-2,W=f+N[g],aa.x=W,aa._x=W,F&&(U=1<g?W-this.canvasLeft:this.canvasLeft+p-W,B.setStyle(r.style),D=u(Fa(parseFloat(r.style.lineHeight)),12)+2*Fa(parseFloat(r.style.border),12),D=B.getSmartText(r.labelText,U,D),aa.attr({text:D.text,title:D.tooltext||""})),aa.y=Z,v&&(ea=r.transX,ja=r.transY,f+=ea,C+=ea,K+=ea,$+=ja,W+=ea),aa.attr({visibility:Ca,"text-anchor":T,vAlign:"middle",x:W,y:R}),D=r.connector)r.connectorPath=r=["M",
K,$,"L",z?C:K,R,f,R],D.attr({path:r,visibility:Ca})}}}}()},b["renderer.root"])}]);
FusionCharts.register("module",["private","modules.renderer.js-interface",function(){var d=this,h=d.hcLib,D=d.renderer.getRenderer("javascript"),z=h.hasModule,p=h.loadModule,c=h.getMetaSentence,I=h.moduleCmdQueue,b=h.executeWaitingCommands,P=h.injectModuleDependency,a=h.moduleDependencies,w=h.getDependentModuleName,F,L;F=function(a){var g,e,l,m={},p;a=c(a);for(g in d.core.items)g=d.core.items[g],e=g.chartType(),l=g.options.chartTypeSourcePath+e,(e=g.jsVars)&&e.waitingModule&&g.__state.rendering&&
h.needsModule(a.predicate,l)&&(e.waitingModuleError=!0,e=w(l).concat(e.userModules),e.length&&(e=e[e.length-1],m[e]=h.moduleCmdQueue[e]));for(p in m)b(m[p]);d.raiseError(d.core,"11171116151","run","HC-interface~renderer.load","Unable to load required modules and resources: "+a.key)};L=function(a,b,c){var h=a.args,m=a.options;a._chartMessageStyle={color:h.typeNotSupportedMessageColor||m.baseChartMessageColor,fontFamily:h.typeNotSupportedMessageFont||m.baseChartMessageFont,fontSize:h.typeNotSupportedMessageFontSize||
m.baseChartMessageFontSize};d.hcLib.createChart(a,b,"stub",c,m.typeNotSupportedMessage)};h.eventList=d.extend(d.legacyEventList,{loaded:"FC_Loaded",dataloaded:"FC_DataLoaded",rendered:"FC_Rendered",drawcomplete:"FC_DrawComplete",dataxmlinvalid:"FC_DataXMLInvalid",nodatatodisplay:"FC_NoDataToDisplay",exported:"FC_Exported"});h.raiseEvent=d.raiseEventWithLegacy;a.charts=d.extend(a.charts||{},{column2d:0,column3d:0,bar2d:0,bar3d:0,pie2d:0,pie3d:0,line:0,area2d:0,doughnut2d:0,doughnut3d:0,pareto2d:0,
pareto3d:0,mscolumn2d:0,mscolumn3d:0,msline:0,msarea:0,msbar2d:0,msbar3d:0,stackedcolumn2d:0,marimekko:0,stackedcolumn3d:0,stackedarea2d:0,stackedcolumn2dline:0,stackedcolumn3dline:0,stackedbar2d:0,stackedbar3d:0,msstackedcolumn2d:0,mscombi2d:0,mscombi3d:0,mscolumnline3d:0,mscombidy2d:0,mscolumn3dlinedy:0,stackedcolumn3dlinedy:0,msstackedcolumn2dlinedy:0,scatter:0,bubble:0,ssgrid:0,scrollcolumn2d:0,scrollcolumn3d:0,scrollline2d:0,scrollarea2d:0,scrollstackedcolumn2d:0,scrollcombi2d:0,scrollcombidy2d:0,
zoomline:0});a.powercharts=d.extend(a.powercharts||{},{spline:0,splinearea:0,msspline:0,mssplinearea:0,mssplinedy:0,multiaxisline:0,multilevelpie:0,waterfall2d:0,msstepline:0,inversemsline:0,inversemscolumn2d:0,inversemsarea:0,errorbar2d:0,errorscatter:0,errorline:0,logmsline:0,logmscolumn2d:0,logstackedcolumn2d:0,radar:0,dragnode:0,candlestick:0,selectscatter:0,dragcolumn2d:0,dragline:0,dragarea:0,boxandwhisker2d:0,kagi:0,heatmap:0});a.widgets=d.extend(a.widgets||{},{angulargauge:0,bulb:0,cylinder:0,
drawingpad:0,funnel:0,hbullet:0,hled:0,hlineargauge:0,vlineargauge:0,pyramid:0,realtimearea:0,realtimecolumn:0,realtimeline:0,realtimelinedy:0,realtimestackedarea:0,realtimestackedcolumn:0,sparkcolumn:0,sparkline:0,sparkwinloss:0,thermometer:0,vbullet:0,gantt:0,vled:0});a.maps=d.extend(a.maps||{},{});d.extend(D,{render:function(a,b){var c=this.chartType(),l=this.options.chartTypeSourcePath+c,m=this.jsVars,p=this.__state,E=h.chartAPI,n=this.options,F=this.args,t=this.options.showChartLoadingMessage,
X,u;X=w(l).concat(m.userModules);m.isResizing&&(m.isResizing=clearTimeout(m.isResizing));m.hcObj&&m.hcObj.destroy&&m.hcObj.destroy();if(E[c]){if(E[p.lastRenderedType]&&p.lastRenderedType!==c)for(u in d.raiseEvent("chartTypeChanged",{previousType:p.lastRenderedType,newType:c},this),E[p.lastRenderedType].eiMethods)delete this[u];p.lastRenderedType=c;p.lastRenderedSrc=this.src;!m.waitingModuleError&&h.raiseEvent("internal.loaded",{type:c,triggeredModuleLoad:m.drLoadAttempted||m.waitingModule},this,[this.id]);
delete m.waitingModule;delete m.waitingModuleError;delete m.drLoadAttempted;d.hcLib.createChart(this,a,c,b)}else{if(c&&z(X)){if(m.drLoadAttempted){d.raiseError(this,11112822001,"run","HC-interface~renderer.render","Chart runtimes not loaded even when resource is present");L(this,a,b);return}P(l)&&(X=w(l).concat(m.userModules));m.drLoadAttempted=!0}else{if(!X.length){L(this,a,b);return}if(m.waitingModuleError){L(this,a,b);delete m.waitingModule;delete m.waitingModuleError;return}}(c=I[X[X.length-1]])?
(c.push({cmd:"render",obj:this,args:arguments}),m.waitingModule||(m=t?n.PBarLoadingText||n.loadMessage:"",this._chartMessageStyle={color:F.loadMessageColor||n.baseChartMessageColor,fontFamily:F.loadMessageFont||n.baseChartMessageFont,fontSize:F.loadMessageFontSize||n.baseChartMessageFontSize},d.hcLib.createChart(this,a,"stub",void 0,m),D.load.call(this,a,b))):(d.raiseError(this,12080515551,"run","HC-interface~renderer.render","Unregistered module in dependentModule definition."),this._chartMessageStyle=
{color:F.renderErrorMessageColor||n.baseChartMessageColor,fontFamily:F.renderErrorMessageFont||n.baseChartMessageFont,fontSize:F.renderErrorMessageFontSize||n.baseChartMessageFontSize},d.hcLib.createChart(this,a,"stub",void 0,n.renderErrorMessage))}},update:function(a){var b=this.ref,c=this.jsVars;c.hcObj&&c.hcObj.destroy&&c.hcObj.destroy();c.isResizing&&(c.isResizing=clearTimeout(c.isResizing));void 0===a.error?(delete c.stallLoad,delete c.loadError,this.isActive()?this.src!==this.__state.lastRenderedSrc?
this.render():d.hcLib.createChart(this,c.container):this.__state.rendering&&!c.waitingModule&&d.hcLib.createChart(this,c.container)):(this.isActive()&&"function"===typeof b.showChartMessage&&b.showChartMessage("InvalidXMLText"),delete c.loadError)},resize:function(a){var b=this.ref,c,h=this.jsVars;b&&b.resize&&(h.isResizing&&(h.isResizing=clearTimeout(h.isResizing)),h.isResizing=setTimeout(function(){c=d.normalizeCSSDimension(a.width,a.height,b);void 0!==a.width&&(b.style.width=c.width);void 0!==
a.height&&(b.style.height=c.height);b.resize();delete h.isResizing},0))},dispose:function(){var a,b=this.jsVars;b.isResizing&&(b.isResizing=clearTimeout(b.isResizing));b.instanceAPI&&b.instanceAPI.dispose&&(b.instanceAPI.dispose(),delete b.instanceAPI);if(a=this.ref)d.purgeDOM(a),a.parentNode&&a.parentNode.removeChild(a);b.container=null;h.cleanupWaitingCommands(this)},load:function(a,c){var e=this.jsVars,l=this.chartType(),m=d.hcLib.chartAPI[l],l=w(l).concat(e.userModules),z=l[l.length-1];m||!l||
l&&0===l.length?(delete e.waitingModule,a&&L(this,a||this.ref,c)):e.waitingModule||(e.waitingModule=!0,delete e.waitingModuleError,p(l,function(){delete e.waitingModule;b(h.moduleCmdQueue[z])},F,this))}})}]);
FusionCharts.register("module",["private","modules.api.dynamicchartattributes",function(){var d=this;d.extend(d.core,{setChartAttribute:function(h,D){var z,p,c,I;if("string"===typeof h)z=h,h={},h[z]=D;else if(null===h||"object"!==typeof h)return;I=0;if(c=(z=this.getChartData(d.dataFormats.JSON))&&(z.chart||z.graph||z.map)){for(p in h)I+=1,null===h[p]?delete c[p.toLowerCase()]:c[p.toLowerCase()]=h[p];0<I&&("undefined"===typeof c.animation&&(c.animation="0"),this.setChartData(z,d.dataFormats.JSON))}else d.raiseError(this,
"2105141421","run","#setChartAttribute()","Could not retrieve attribute list. Is data ready?")},getChartAttribute:function(h){var D=this.getChartData(d.dataFormats.JSON),D=D&&(D.chart||D.graph||D.map),z,p;if(0===arguments.length||void 0===h||void 0===D)return D;if("string"===typeof h)z=D[h.toString().toLowerCase()];else if(h instanceof Array)for(z={},p=0;p<h.length;p+=1)z[h[p]]=D[h[p].toString().toLowerCase()];else d.raiseError(this,"25081429","param","~getChartAttribute()",'Unexpected value of "attribute"');
return z}},!0)}]);
FusionCharts.register("module",["private","api.linkmanager",function(){var d=this,h=d.FusionChartsDOMInsertModes,D={},z=function(c,h){this.items={};this.root=c;this.parent=h;h instanceof d.core?this.level=this.parent.link.level+1:(D[c.id]=[{}],this.level=0)},p=function(c,d){return(c.options.containerElement===d.options.containerElement||c.options.containerElementId===d.options.containerElementId)&&c.options.insertMode===h.REPLACE};d.policies.link=["link",void 0];z.prototype.configuration=function(){return D[this.root.id][this.level]||
(D[this.root.id][this.level]={})};d.extend(d.core,{configureLink:function(c,h){var b;if(c instanceof Array){for(b=0;b<c.length;b+=1)"object"!==typeof D[this.link.root.id][b]&&(D[this.link.root.id][b]={}),d.extend(D[this.link.root.id][b],c[b]);D[this.link.root.id].splice(c.length)}else"object"===typeof c?("number"!==typeof h&&(h=this.link.level),void 0===D[this.link.root.id][h]&&(D[this.link.root.id][h]={}),d.extend(D[this.link.root.id][h],c)):d.raiseError(this,"25081731","param","~configureLink()",
"Unable to update link configuration from set parameters")}},!0);d.addEventListener("beforeInitialize",function(c){c.sender.link instanceof z?c.sender.link.parent instanceof d.core&&(c.sender.link.parent.link.items[c.sender.id]=c.sender):c.sender.link=new z(c.sender)});d.addEventListener("linkedChartInvoked",function(c,h){var b=c.sender,D=b.clone({dataSource:h.data,dataFormat:h.linkType,link:new z(b.link.root,b)},!0),a=h.alias,w;a&&(!D.typeSource&&D.swfUrl&&(D.typeSource=D.swfUrl.replace(/(.*?)?[^\/]*\.swf.*?/ig,
"$1")),D.type=a);b.args&&0!==parseInt(b.args.animate,10)&&delete D.animate;d.extend(D,b.link.configuration());d.raiseEvent("beforeLinkedItemOpen",{level:b.link.level},b.link.root,void 0,function(){d.core.items[D.id]instanceof d.core&&d.core.items[D.id].dispose();w=new d.core(D);p(w,b)||b.options.overlayButton&&b.options.overlayButton.message||("object"!==typeof b.options.overlayButton&&(b.options.overlayButton={}),b.options.overlayButton.message="Close");w.render();d.raiseEvent("linkedItemOpened",
{level:b.link.level,item:w},b.link.root)})});d.addEventListener("overlayButtonClick",function(c,h){if("LinkManager"===h.id){var b=c.sender,z=b.link.level-1,a=b.link.parent,w=b.link.root;d.raiseEvent("beforeLinkedItemClose",{level:z,item:b},w,b,function(){setTimeout(function(){d.core.items[b.id]&&b.dispose();d.raiseEvent("linkedItemClosed",{level:z},w)},0);a.disposed||a.isActive()||!p(b,a)||a.render()})}});d.addEventListener("Loaded",function(c){c=c.sender;var h;c&&void 0!==c.link&&c.link.root!==c&&
c.link.parent instanceof d.core&&(c.ref&&"function"===typeof c.ref.drawOverlayButton?(h=d.extend({show:!0,id:"LinkManager"},c.link.parent.options.overlayButton),d.extend(h,c.link.parent.link.configuration().overlayButton||{}),c.ref.drawOverlayButton(h)):d.raiseWarning(c,"04091602","run","::LinkManager^Loaded","Unable to draw overlay button on object. -"+c.id))});d.addEventListener("beforeDispose",function(c){var h=c.sender;h&&h.link instanceof z&&(h&&h.link&&h.link.parent instanceof d.core&&h.link.parent.link&&
h.link.parent.link.items&&delete h.link.parent.link.items[c.sender.id],delete D[h.id])})}]);
FusionCharts.register("module",["private","modules.renderer.js-thememanager",function(){var d=this,h,D,z,p=/\s+!important$/,c=/\\!important$/,I=function(a,b){for(var c=b.length,d=-1;c--;)if(a===b[c]){d=c;break}return d},b=function(a,c,d,h,p){var w,n,z,t;p?(h.push(a),p.push(c)):(h=[a],p=[c]);if(c instanceof Array)for(w=0;w<c.length;w+=1){try{n=a[w],z=c[w]}catch(B){continue}if("object"!==typeof z)d&&void 0===z||(a[w]=z);else{if(null===n||"object"!==typeof n)n=a[w]=z instanceof Array?[]:{};t=I(z,p);
-1!==t?n=a[w]=h[t]:b(n,z,d,h,p)}}else for(w in c){try{n=a[w],z=c[w]}catch(u){continue}if(null!==z&&"object"===typeof z)if(t=Object.prototype.toString.call(z),"[object Object]"===t){if(null===n||"object"!==typeof n)n=a[w]={};t=I(z,p);-1!==t?n=a[w]=h[t]:b(n,z,d,h,p)}else"[object Array]"===t?(null!==n&&n instanceof Array||(n=a[w]=[]),t=I(z,p),-1!==t?n=a[w]=h[t]:b(n,z,d,h,p)):a[w]=z;else a[w]=z}return a},P=function(a,c,d){if("object"!==typeof a&&"object"!==typeof c)return null;if("object"!==typeof c||
null===c)return a;"object"!==typeof a&&(a=c instanceof Array?[]:{});b(a,c,d);return a},a=function(a){var b={important:!1,str:""};if(!a)return b;a=a.toString();p.test(a)?(a=a.replace(p,""),b.important=!0):(a=a.replace(c,"!imporant"),b.important=!1);b.str=a;return b},w=function(a,b){var c,d,h,p,n,z,t=0,B=0;for(c in a)if(d=a[c],d instanceof Array)for(z=d.length,n=0;n<z;n+=1){if(p=d[n],"object"===typeof p)if("category"===c)if("true"===p.vline){if(h=b.component("vline",t,p))F(p,h),t+=1}else{if(h=b.component("category",
B,p,z))F(p,h),B+=1}else if(h=b.component(c,n,p,z))F(p,h),w(p,h)}else"object"===typeof d&&(h=b.component(c,null,d))&&(F(d,h),w(d,h))},F=function(b,c){var d=c.getAll(),h,p;for(h in d)p=d[h].toString(),p=a(p),p.important?b[h.toLowerCase()]=p.str:void 0===b[h.toLowerCase()]&&(b[h.toLowerCase()]=p.str)},L=function(a,b){"geo"===b.defaultSeriesType&&B.call(this,a,b)},B=function(a,b){var c=a.sender,h=c.getChartData(d.dataFormats.JSON,!0),p;h.error||((p=h.data.chart.theme)?z.themify(p,c,c.chartType(),h.data,
"geo"===b.defaultSeriesType&&"geo"):c.jsVars.themeObject&&c.jsVars.themeObject.dispose())};h=function(){this.themeStore={}};h.prototype={constructor:h,add:function(a){for(var b=0,c=a.length,d;b<c;b+=1)(d=a[b].name)&&(this.themeStore[d]=a[b])},themify:function(a,b,c,h,p){var w=b.jsVars,n=a.split(","),z=[],t=n.length,F,u;if(t){for(u=0;u<t;u+=1){F=this.themeStore;var I;I=n[u];I=I.replace(/^\s\s*/,"");for(var P=/\s/,ka=I.length;P.test(I.charAt(ka-=1)););I=I.slice(0,ka+1);(F=F[I])&&z.push(this.evaluateThemeJSON(F.theme,
b,c,p))}z.length?(w.themeObject=new D(z,b,!1,h),this.applyTheme(b),b.addEventListener("chartTypeChanged",B),b.addEventListener("internal.drawstart",L)):d.raiseWarning(b,"14051100501","run","api.themes~themify()",'The theme "'+a+'" requested has not been registered.')}},evaluateThemeJSON:function(a,b,c,d){var h={},p=b.jsVars,n=function(a){var b,c;for(b in a)c=a[b],h[b]=c instanceof Array?P(h[b]||[],c):"object"===typeof c?P(h[b]||{},c):c};c=c||b.chartType();p.themeObject&&a!==p.themeObject&&(p.themeObject.dispose(),
delete p.themeObject);n(a.base);d&&a[d]&&n(a[d]);c&&a[c]&&n(a[c]);return h},applyTheme:function(a){a=a.jsVars.themeObject;var b=a.getThemedJSONData().data;b&&w(b,a)}};D=function(a,b,c,d){this.themeArray=a;this.themeComponents={};this.base={};this.chartInstance=b;this.isChildInstance=Boolean(c);this.themedData=c?null:P({},d);this.length=a.length;b=0;for(c=a.length;b<c;b+=1)this.parse(a[b])};D.prototype={constructor:D,pushTheme:function(a){a&&(this.themeArray.push(a),this.parse(a),this.length+=1)},
popTheme:function(){},parse:function(b){var c=this.themeComponents,d=this.chartInstance,h=this.base,p,w,n;for(w in b)if("string"===typeof b[w]||"number"===typeof b[w])if(h[w]){if(p=a(b[w]),n=a(h[w]),p.important||!n.important)h[w]=b[w]}else h[w]=b[w];else c[w]||(c[w]=[]),p=c[w],b[w]instanceof Array?p.push(P([],b[w])):"object"===typeof b[w]?p.push(new D([b[w]],d,!0)):"function"===typeof b[w]&&p.push(b[w])},merge:function(b){var c=this.base,d=b.base,h=this.themeComponents,p=b.themeComponents,w,n,z;for(z in d)if(w=
a(c[z]),n=a(d[z]),!w.important||n.important)c[z]=d[z];for(z in p)h[z]=h[z]?h[z].concat(p[z]):[].concat(p[z]);this.length+=b.length},get:function(a){return this.base[a]},getAll:function(){return P({},this.base)},component:function(a,b,c,d){var h=this.themeComponents,p=this.chartInstance,n=new D([],p,!0),w,t,z;t=h[a];if(!t)return null;a=0;for(h=t.length;a<h;a+=1)z=t[a],"function"===typeof z?(b=b||0,n.pushTheme(z.call(p,b,c,d))):z instanceof Array?(b=b||0,w=z.length,b%=w,w=z[b],w instanceof D?n.merge(w):
"function"===typeof w?n.pushTheme(w.call(p,b,c,d)):n.pushTheme(w)):z instanceof D?n.merge(z):n.pushTheme(z);return n},getThemedJSONData:function(){return{data:this.themedData}},dispose:function(){var a=this.themeComponents,b=this.chartInstance,c,d;for(c in a)if(d=a[c].length){for(;d--;)a[c][d].dispose&&a[c][d].dispose();delete a[c]}this.isChildInstance||(b.removeEventListener("chartTypeChanged",B),b.removeEventListener("internal.drawstart",L));this.dataWithoutTheme=this.isChildInstance=this.themeArray=
this.base=this.chartInstance=this.themeComponents=null}};z=new h;d.registrars.theme=d.registerTheme=function(a){a&&("[object Array]"!==Object.prototype.toString.call(a)&&(a=[a]),z.add(a))};d.addEventListener("beforeDataUpdate",function(a,b){var c=a.sender,h=d.core.transcodeData(b.data,b.format,d.dataFormats.JSON),p=h.chart&&h.chart.theme;p?z.themify(p,c,c.args.type,h):c.jsVars.themeObject&&(c.jsVars.themeObject.dispose(),delete c.jsVars.themeObject)})}]);
FusionCharts.register("theme",{name:"default",theme:{base:{chart:{labelDisplay:"stagger !important",caption:"Theme Caption \\!important",canvasBgColor:"#56EF22",borderThickness:"5 !important",borderColor:"#E60539",baseFontColor:"#781129"},categories:[{fontColor:"#0F4F40",fontSize:15,category:function(d){return{showLabel:d%2?0:1}},vline:{color:"#000000",thickness:2}}],dataset:[{color:"#8C3146",data:function(d,h){8==d&&(h.value="");return{color:32E3>Number(h.value)?"#8C3146":"#FF0000",alpha:"100"}}}],
trendlines:[{line:function(d){return d?{color:"#ff0000",thickness:3}:{color:"#ffff00",thickness:3}}}]},pie2d:{chart:{bgColor:"#FF0000"}},msline:{chart:{canvasBgColor:"#ff0000"}},geo:{chart:{canvasBgColor:"#0000ff"}},world:{chart:{canvasBgColor:"#00ff00"}}}});
;
/*
 FusionCharts JavaScript Library
 Copyright FusionCharts Technologies LLP
 License Information at <http://www.fusioncharts.com/license>
 FusionCharts JavaScript Library
 Copyright FusionCharts Technologies LLP
 License Information at <http://www.fusioncharts.com/license>

 @version 3.6.0
*/
FusionCharts.register("module",["private","modules.renderer.js-charts",function(){function Aa(a){var p={left:a.offsetLeft,top:a.offsetTop};for(a=a.offsetParent;a;)p.left+=a.offsetLeft,p.top+=a.offsetTop,a!==Ha.body&&a!==Ha.documentElement&&(p.left-=a.scrollLeft,p.top-=a.scrollTop),a=a.offsetParent;return p}function oa(a,p){for(var c=[],d=0,q=a.length;d<q;d++)c[d]=p.call(a[d],a[d],d,a);return c}function na(a,p){var c=p?360:X;a=(a||0)%c;return 0>a?c+a:a}function Ka(a,p){return a<=x?a:p<=x?p:p>a?0:p}
function Na(a,p,c,d,q){return ca((p-c[1]-d.top)/q,a-c[0]-d.left)}function La(a,p,c,d,q,b,t,da,e,r){"object"===typeof a&&(p=a.y,c=a.r,d=a.innerR,q=a.radiusYFactor,b=a.depth,t=a.seriesGroup,da=a.renderer,a=a.x);if(0>q||1<=q)q=.6;a=a||0;p=p||0;c=c||1;d=d||0;b=b||0;this.renderer=da;this.hasOnePoint=e;this.use3DLighting=r;this.cx=a;this.cy=p;this.rx=c;this.ry=c*q;this.radiusYFactor=q;this.isDoughnut=0<d;this.innerRx=d;this.innerRy=d*q;this.depth=b;this.leftX=a-c;this.rightX=a+c;this.leftInnerX=a-d;this.rightInnerX=
a+d;this.depthY=p+b;this.topY=p-this.ry;this.bottomY=this.depthY+this.ry;this.bottomBorderGroup=da.group("bottom-border",t).attr({transform:"t0,"+b});this.outerBackGroup=da.group("outer-back-Side",t);this.slicingWallsBackGroup=da.group("slicingWalls-back-Side",t);this.innerBackGroup=da.group("inner-back-Side",t);this.innerFrontGroup=da.group("inner-front-Side",t);this.slicingWallsFrontGroup=da.group("slicingWalls-front-Side",t);this.topGroup=da.group("top-Side",t);this.moveCmdArr=["M"];this.lineCmdArr=
["L"];this.closeCmdArr=["Z"];this.centerPoint=[a,p];this.leftPoint=[this.leftX,p];this.topPoint=[a,this.topY];this.rightPoint=[this.rightX,p];this.bottomPoint=[a,p+this.ry];this.leftDepthPoint=[this.leftX,this.depthY];this.rightDepthPoint=[this.rightX,this.depthY];this.leftInnerPoint=[this.leftInnerX,p];this.rightInnerPoint=[this.rightInnerX,p];this.leftInnerDepthPoint=[this.leftInnerX,this.depthY];this.rightInnerDepthPoint=[this.rightInnerX,this.depthY];this.pointElemStore=[];this.slicingWallsArr=
[];a=["A",this.rx,this.ry,0,0,1,this.rightX,p];c=["A",this.rx,this.ry,0,0,1,this.leftX,p];d=["A",this.rx,this.ry,0,0,0,this.rightX,this.depthY];q=["A",this.rx,this.ry,0,0,0,this.leftX,this.depthY];b=["A",this.innerRx,this.innerRy,0,0,0,this.rightInnerX,p];p=["A",this.innerRx,this.innerRy,0,0,0,this.leftInnerX,p];t=["A",this.innerRx,this.innerRy,0,0,1,this.rightInnerX,this.depthY];da=["A",this.innerRx,this.innerRy,0,0,1,this.leftInnerX,this.depthY];this.isDoughnut?(this.topBorderPath=this.moveCmdArr.concat(this.leftPoint,
a,c,this.moveCmdArr,this.leftInnerPoint,b,p),this.topPath=this.moveCmdArr.concat(this.leftPoint,a,c,this.lineCmdArr,this.leftInnerPoint,b,p,this.closeCmdArr),this.innerFrontPath=this.moveCmdArr.concat(this.leftInnerPoint,b,this.lineCmdArr,this.rightInnerDepthPoint,da,this.closeCmdArr),this.innerBackPath=this.moveCmdArr.concat(this.rightInnerPoint,p,this.lineCmdArr,this.leftInnerDepthPoint,t,this.closeCmdArr)):this.topBorderPath=this.topPath=this.moveCmdArr.concat(this.leftPoint,a,c,this.closeCmdArr);
this.outerBackPath=this.moveCmdArr.concat(this.leftPoint,a,this.lineCmdArr,this.rightDepthPoint,q,this.closeCmdArr);this.outerFrontPath=this.moveCmdArr.concat(this.rightPoint,c,this.lineCmdArr,this.leftDepthPoint,d,this.closeCmdArr);this.clipPathforOuter=["M",this.leftX,this.topY,"L",this.rightX,this.topY,this.rightX,this.bottomY,this.leftX,this.bottomY,"Z"];this.clipPathforInner=["M",this.leftInnerX,this.topY,"L",this.rightInnerX,this.topY,this.rightInnerX,this.bottomY,this.leftInnerX,this.bottomY,
"Z"];this.clipPathforNoClip=["M",this.leftInnerX,this.topY,"L",this.leftInnerX,this.bottomY,"Z"];this.colorObjs=[]}var pa=this,v=pa.hcLib,ia=v.Raphael,s=pa.window,Ha=s.document,K=v.BLANKSTRING,Ua=v.createTrendLine,g=v.pluck,ta=v.getValidValue,Ea=v.parseTooltext,k=v.pluckNumber,Fa=v.getFirstValue,Va=v.getDefinedColor,ga=v.parseUnsafeString,ua=v.FC_CONFIG_STRING,ya=v.extend2,Ba=v.getDashStyle,Y=v.toRaphaelColor,Oa=v.toPrecision,Sa=v.stubFN,ma=v.hasSVG,va=v.each,Ca=v.TOUCH_THRESHOLD_PIXELS,Pa=v.CLICK_THRESHOLD_PIXELS,
sa=v.plotEventHandler,b=v.hasTouch?Ca:Pa,e="rgba(192,192,192,"+(v.isIE?.002:1E-6)+")",h=8===s.document.documentMode?"visible":"",f=Math,Z=f.sin,P=f.cos,ca=f.atan2,w=f.round,ja=f.min,m=f.max,L=f.abs,A=f.PI,D=f.ceil,u=f.floor,ha=f.sqrt,N=A/180,V=180/A,x=Math.PI,Wa=x/2,X=2*x,Da=x+Wa,la=v.graphics.getColumnColor,ea=v.getFirstColor,$=v.setLineHeight,Ia=v.pluckFontSize,Ma=v.getFirstAlpha,ka=v.graphics.getDarkColor,fa=v.graphics.getLightColor,aa=v.graphics.convertColor,Qa=v.COLOR_TRANSPARENT,Ta=v.POSITION_CENTER,
Za=v.POSITION_TOP,Xa=v.POSITION_BOTTOM,$a=v.POSITION_RIGHT,ab=v.POSITION_LEFT,bb=v.parsexAxisStyles,Ya=v.hashify,n=v.chartAPI,cb=v.graphics.mapSymbolName,s=n.singleseries,ba=v.COMMASTRING,za=v.ZEROSTRING,Ja=v.ONESTRING,Ga=v.HUNDREDSTRING,Ra=v.PXSTRING,db=v.COMMASPACE;n("column2d",{standaloneInit:!0,friendlyName:"Column Chart",creditLabel:!1,rendererId:"cartesian"},n.column2dbase);n("column3d",{friendlyName:"3D Column Chart",defaultSeriesType:"column3d",defaultPlotShadow:1,is3D:!0,fireGroupEvent:!0,
defaultZeroPlaneHighlighted:!1},n.column2d);n("bar2d",{friendlyName:"Bar Chart",isBar:!0,defaultSeriesType:"bar",spaceManager:n.barbase},n.column2d);n("bar3d",{friendlyName:"3D Bar Chart",defaultSeriesType:"bar3d",defaultPlotShadow:1,fireGroupEvent:!0,is3D:!0,defaultZeroPlaneHighlighted:!1},n.bar2d);n("line",{friendlyName:"Line Chart",standaloneInit:!0,creditLabel:!1,rendererId:"cartesian"},n.linebase);n("area2d",{friendlyName:"Area Chart",standaloneInit:!0,creditLabel:!1,rendererId:"cartesian"},
n.area2dbase);n("pie2d",{friendlyName:"Pie Chart",standaloneInit:!0,defaultSeriesType:"pie",defaultPlotShadow:1,reverseLegend:1,alignCaptionWithCanvas:0,sliceOnLegendClick:!0,rendererId:"pie",point:function(a,p,c,d,q){a=q[ua];var b=this.colorManager,t=a.is3d,da=k(d.plotborderthickness),e=k(da,t?.1:1),r=k(d.enablemultislicing,1),Q=k(d.use3dlighting,1),l=Q?k(d.radius3d,d["3dradius"],90):100,wa=k(d.showzeropies,1),h=k(d.showpercentintooltip,1),f=k(d.showlabels,1),y=k(d.showvalues,1),n=k(d.showpercentvalues,
d.showpercentagevalues,0),z=g(d.tooltipsepchar,d.hovercapsepchar,db),eb=g(d.labelsepchar,z),R=g(d.plotbordercolor,d.piebordercolor),B=q[ua].numberFormatter,P=c.length,Z=k(d.plotborderdashed,0),O=k(d.plotborderdashlen,5),C=k(d.plotborderdashgap,4),G=k(d.showvalueinlegend,0),I=k(d.showlabelinlegend,1),w=k(d.valuebeforelabelinlegend,0),W=k(d.showvalueaspercentinlegend,1),H=k(d.reverseplotorder,0),S=g(d.legendsepchar,", "),U=q.plotOptions.series.dataLabels.style,T=0,m=[],u,M,qa,E,F,J,x,D,A,ja,s,X,v,ca,
Y,V,L,N,ha,$=-1;L=p.centerLabelConfig={label:ga(g(d.defaultcenterlabel,"")),font:g(d.centerlabelfont,U.fontFamily),fontSize:k(d.centerlabelfontsize,parseInt(U.fontSize,10)),color:ea(g(d.centerlabelcolor,d.valuefontcolor,a.inCanvasStyle.color,"555555")),alpha:k(d.centerlabelalpha,100),bold:k(d.centerlabelbold,U.fontWeight),italic:k(d.centerlabelitalic,U.style),bgColor:g(d.centerlabelbgcolor,""),bgAlpha:k(d.centerlabelbgalpha,100),borderColor:g(d.centerlabelbordercolor,U.borderColor),borderAlpha:k(d.centerlabelborderalpha,
100),borderThickness:k(d.centerlabelborderthickness,U.borderThickness),borderRadius:k(d.centerlabelborderradius,U.borderRadius),textPadding:k(d.centerlabeltextpadding,U.borderPadding),padding:k(d.centerlabelpadding,2),bgOval:k(d.centerlabelbgoval,0),shadow:k(d.showcenterlabelshadow,0),hoverColor:d.centerlabelhovercolor&&ea(g(d.centerlabelhovercolor)),hoverAlpha:k(d.centerlabelhoveralpha),toolText:ga(g(d.centerlabeltooltext,""))};100<l&&(l=100);0>l&&(l=0);k(d.showlegend,0)&&(q.legend.enabled=!0,q.legend.reversed=
!Boolean(k(d.reverselegend,0)),p.showInLegend=!0);for(M=0;M<P;M+=1)E=c[M],qa=B.getCleanValue(E.value,!0),null===qa||!wa&&0===qa||(m.push(E),T+=qa);0===T&&(m=[]);p.enableRotation=1<m.length?k(d.enablerotation,1):0;p.alphaAnimation=k(d.alphaanimation,1);p.is3D=t;p.placeLabelsInside=d.placevaluesinside;p.use3DLighting=Q;p.pieYScale=k(d.pieyscale,40);1>p.pieYScale&&(p.pieYScale=1);100<=p.pieYScale&&(p.pieYScale=80);p.pieYScale/=100;p.pieSliceDepth=k(d.pieslicedepth,15);1>p.pieSliceDepth&&(p.pieSliceDepth=
1);p.managedPieSliceDepth=p.pieSliceDepth;p.enableMultiSlicing=!!r;t&&d.showplotborder!=Ja&&!da&&(p.showBorderEffect=1);for(M=m.length-1;0<=M;M-=1){E=m[M];qa=B.getCleanValue(E.value,!0);u=ga(g(E.label,E.name,K));P=g(E.color,b.getPlotColor(M));J=g(E.alpha,d.plotfillalpha);x=g(E.bordercolor,R);D=g(E.borderalpha,d.plotborderalpha,d.pieborderalpha);t&&(x||void 0!==D)&&(p.showBorderEffect=0);x=g(x,fa(P,t?90:25)).split(ba)[0];D=d.showplotborder==za?za:g(D,J,"80");J=g(J,Ga);wa={opacity:Math.max(J,D)/100};
if(c=Boolean(k(E.issliced,d.issliced,0)))r||(-1!==$&&(p.data[m.length-$-1].sliced=!1),$=M),a.preSliced=c;da=(Y=k(E.dashed,Z))?Ba(g(E.dashlen,O),g(E.dashgap,C),e):void 0;F=ta(ga(g(E.tooltext,a.tooltext)));s=B.percentValue(qa/T*100);X=B.dataLabels(qa)||K;ja=1===k(E.showlabel,f)?u:K;A=1===(v=k(E.showvalue,y))?1===n?s:X:K;ca=ta(ga(E.displayvalue));A=void 0!==ca&&v?ca:A!==K&&ja!==K?ja+eb+A:g(ja,A);void 0!==F?F=Ea(F,[1,2,3,5,6,7,14,24,25],{formattedValue:X,label:u,yaxisName:ga(d.yaxisname),xaxisName:ga(d.xaxisname),
percentValue:s,sum:B.dataLabels(T),unformattedSum:T},E,d):(F=u,v=h?s:X,F=F!=K?F+z+v:v);v=I?u:K;G&&(V=W?B.legendPercentValue(qa/T*100):B.legendValue(qa),v=w?V+(v&&S+v):(v&&v+S)+V);Y=this.pointHoverOptions(E,p,{plotType:"pie",use3DLighting:Q,color:P,alpha:J,borderWidth:e,borderColor:x,borderAlpha:D,borderDashed:Y,borderDashGap:g(E.dashgap,C),borderDashLen:k(E.dashlen,O),radius3D:l,shadow:wa});u={label:g((N=E.centerlabel||d.centerlabel)&&this.replaceMacros(N,["\\$value","\\$percentValue","\\$displayValue",
"\\$label"],[X,s,void 0===ca?"":ca,u]),""),font:L.font,fontSize:k(E.centerlabelfontsize,L.fontSize),color:ea(g(E.centerlabelcolor,L.color)),alpha:k(E.centerlabelalpha,L.alpha),bold:k(E.centerlabelbold,L.bold),italic:k(E.centerlabelitalic,L.italic),bgColor:g(E.centerlabelbgcolor,L.bgColor),bgAlpha:k(E.centerlabelbgalpha,L.bgAlpha),borderColor:g(E.centerlabelbordercolor,L.borderColor),borderAlpha:k(E.centerlabelborderalpha,L.borderAlpha),borderThickness:L.borderThickness,borderRadius:L.borderRadius,
textPadding:L.textPadding,padding:L.padding,bgOval:L.bgOval,shadow:L.shadow,hoverColor:(ha=g(E.centerlabelhovercolor,L.hoverColor))&&ea(ha),hoverAlpha:k(E.centerlabelhoveralpha,L.hoverAlpha),toolText:g(E.centerlabeltooltext,"")};p.data.push({displayValue:A,style:bb(E,{},d,U,P),categoryLabel:ja,showInLegend:v!==K,y:qa,name:v,shadow:wa,toolText:F,color:this.getPointColor(P,J,l),_3dAlpha:J,borderColor:aa(x,D),borderWidth:e,link:ta(E.link),sliced:c,dashStyle:da,doNotSlice:g(d.enableslicing,Ja)!=Ja,hoverEffects:Y.enabled&&
Y.options,rolloverProperties:Y.enabled&&Y.rolloverOptions,centerLabelConfig:u})}H&&(p.reversePlotOrder=!0,p.data&&p.data.reverse());p.valueTotal=T;q.legend.enabled=d.showlegend===Ja?!0:!1;p.startAngle=k(d.startingangle,0);q.chart.startingAngle=g(1<m.length?d.startingangle:0,0);return p},replaceMacros:function(a,p,c){for(var d=p.length||0,q;d--;)q=new RegExp(p[d],"gi"),a=a.replace(q,c[d]);return a},containsMacro:function(a,p){for(var c=p.length||0,d;c--;)if(d=new RegExp(p[c],"gi"),d=a.match(d))return!0;
return!1},getPointColor:function(a,p,c){var d,q;a=ea(a);p=Ma(p);100>c&&ma?(d=Math.floor(85*(100-.35*c))/100,d=ka(a,d),q=Math.floor(50*(100+c))/100,a=fa(a,q),p={FCcolor:{color:a+ba+d,alpha:p+ba+p,ratio:c+","+(100-c),radialGradient:!0,gradientUnits:"userSpaceOnUse"}}):p={FCcolor:{color:a+ba+a,alpha:p+ba+p,ratio:"0,100"}};return p},configureAxis:function(a,p){var c=0,d=a[ua],q=p.chart,b=a.xAxis.labels.style,t,da;t=(t=Fa(q.valuebordercolor,K))?aa(t,k(q.valueborderalpha,q.valuealpha,100)):K;b={fontFamily:g(q.valuefont,
b.fontFamily),fontSize:g(q.valuefontsize,parseInt(b.fontSize,10))+Ra,lineHeight:b.lineHeight,color:aa(g(q.valuefontcolor,b.color),k(q.valuefontalpha,q.valuealpha,100)),fontWeight:k(q.valuefontbold)?"bold":"normal",fontStyle:k(q.valuefontitalic)?"italic":"normal",border:t||q.valuebgcolor?k(q.valueborderthickness,1)+"px solid":void 0,borderColor:t,borderThickness:k(q.valueborderthickness,1),borderPadding:k(q.valueborderpadding,2),borderRadius:k(q.valueborderradius,0),backgroundColor:q.valuebgcolor?
aa(q.valuebgcolor,k(q.valuebgalpha,q.valuealpha,100)):K,borderDash:k(q.valueborderdashed,0)?Ba(k(q.valueborderdashlen,4),k(q.valueborderdashgap,2),k(q.valueborderthickness,1)):"none"};a.plotOptions.series.dataLabels.style=b;delete d.x;delete d[0];delete d[1];a.chart.plotBorderColor=a.chart.plotBackgroundColor=Qa;d=d.pieDATALabels=[];if(1===a.series.length&&(da=a.series[0].data)&&0<(c=a.series[0].data.length)&&a.plotOptions.series.dataLabels.enabled)for(;c--;)da[c]&&void 0!==ta(da[c].displayValue)&&
d.push({text:da[c].displayValue,style:da[c].style})},spaceManager:function(a,p,c,d){var q=a[ua],b=q.is3d,t=this.name,da=this.colorManager,e=this.smartLabel||q.smartLabel,r=k(q.pieDATALabels&&q.pieDATALabels.length,0),Q=0,l=p.chart,wa=k(l.managelabeloverflow,0),h=k(l.slicingdistance),f=q.preSliced||l.enableslicing!==za||l.showlegend===Ja&&l.interactivelegend!==za?L(k(h,20)):0,y=k(l.pieradius,0),n=k(l.enablesmartlabels,l.enablesmartlabel,1),z=n?k(l.skipoverlaplabels,l.skipoverlaplabel,1):0,P=k(l.issmartlineslanted,
1),R=r?k(l.labeldistance,l.nametbdistance,5):f,B=k(l.smartlabelclearance,5);c-=a.chart.marginRight+a.chart.marginLeft;var Z=d-(a.chart.marginTop+a.chart.marginBottom);d=ja(Z,c);var w=g(l.smartlinecolor,da.getColor("plotFillColor")),O=k(l.smartlinealpha,100),C=k(l.smartlinethickness,.7),G=a.plotOptions.series.dataLabels,da=G.style,I=r?k(parseInt(da.lineHeight,10),12):0,da=a.series[0]||{},u=da.pieYScale,W=da.pieSliceDepth;d=0===y?.15*d:y;var H=0,H=2*d,S=k("doughnut2d"===t?0:l.placevaluesinside);G.connectorWidth=
C;G.connectorPadding=k(l.connectorpadding,5);G.connectorColor=aa(w,O);r&&(n&&(R=B),R+=f);B=H+2*(I+R);Z-=this.titleSpaceManager(a,p,c,m(B<Z?Z-B:Z/2,parseFloat(a.title.style.lineHeight,10)));l.showlegend===Ja&&(g(l.legendposition,Xa).toLowerCase()!==$a?Z-=this.placeLegendBlockBottom(a,p,c,Z/2,!0):c-=this.placeLegendBlockRight(a,p,c/3,Z,!0));if(1!==r)for(;r--;)e.setStyle(q.pieDATALabels[r].style),p=e.getOriSize(q.pieDATALabels[r].text),Q=m(Q,p.width);0===y&&(b?(Z-=W,H=ja(c/2-Q-f,(Z/2-I)/u)-R):H=ja(c/
2-Q-f,Z/2-I)-R,H>=d?d=H:h||(f=R=m(ja(R-(d-H),f),10)));b&&(r=Z-2*(d*u+I),W>r&&(da.managedPieSliceDepth=W-r));a.plotOptions.pie3d.slicedOffset=a.plotOptions.pie.slicedOffset=f;a.plotOptions.pie3d.size=a.plotOptions.pie.size=2*d;a.plotOptions.series.dataLabels.distance=R;a.plotOptions.series.dataLabels.isSmartLineSlanted=P;a.plotOptions.series.dataLabels.enableSmartLabels=n;a.plotOptions.series.dataLabels.skipOverlapLabels=z;a.plotOptions.series.dataLabels.manageLabelOverflow=wa;a.plotOptions.series.dataLabels.placeLabelsInside=
S;if("doughnut2d"===t||"doughnut3d"===t)if(t=k(l.doughnutradius,0),r=(r=k(l.use3dlighting,1))?k(l.radius3d,l["3dradius"],50):100,100<r&&(r=100),0>r&&(r=0),l=0===t||t>=d?d/2:t,a.plotOptions.pie3d.innerSize=a.plotOptions.pie.innerSize=2*l,0<r&&ma&&(l=parseInt(l/d*100,10),t=(100-l)/2,r=parseInt(t*r/100,10),l=l+ba+r+ba+2*(t-r)+ba+r,a.series[0]&&a.series[0].data))for(wa=a.series[0].data,a=0,r=wa.length;a<r;a+=1)t=wa[a],t.color.FCcolor&&(t.color.FCcolor.ratio=l,t.rolloverProperties.color&&(t.rolloverProperties.color.FCcolor.ratio=
l))},creditLabel:!1,eiMethods:{isPlotItemSliced:function(a){var p=this.jsVars.hcObj,c,d,q;return p&&p.datasets&&p.datasets[0]&&(c=p.datasets[0].data)&&(q=c.length)&&c[a=q-a-1]&&(d=c[a].plot)&&d.sliced},slicePlotItem:function(a,p){var c=this.jsVars.hcObj,d,q,b,t;return c&&c.datasets&&(d=c.datasets[0])&&(q=d.data)&&(t=q.length)&&q[a=d.reversePlotOrder?a:t-a-1]&&(b=q[a].plot)&&((!!p!==b.sliced||void 0===p)&&c.plotGraphicClick.call(b)||b.sliced)},centerLabel:function(a,p){var c=this.jsVars.hcObj,d=c.options,
q=d.series[0],d=d.plotOptions.pie.innerSize,b=c.canvasLeft+.5*c.canvasWidth,t=c.canvasTop+.5*c.canvasHeight,e=q.centerLabelConfig,k;if("object"!==typeof p)p=e;else for(k in e)void 0===p[k]&&(p[k]=e[k]);p.label=a;q.centerLabelConfig=p;d&&c.drawDoughnutCenterLabel(a||"",b,t,d,d,p,!0)},startingAngle:function(a,p){var c=this.jsVars.hcObj,d=c.datasets[0].plot,q="pie"===c.options.chart.defaultSeriesType,b,t=(b=c.datasets[0].startAngle)*(q?-V:1)+(0>(q?-1:1)*b?360:0);if(!isNaN(a)){if(d.singletonCase||d.isRotating)return;
a+=p?t:0;q?((q=c.options.series[0]).startAngle=-a*N,c.rotate(d,q)):c.rotate(a);t=a}return w(100*((t%=360)+(0>t?360:0)))/100}}},s);n.pie2d.eiMethods.togglePieSlice=n.pie2d.eiMethods.sliceDataItem=n.pie2d.eiMethods.slicePlotItem;n.pie2d.eiMethods.enableSlicingMovement=n.pie2d.eiMethods.enablelink=function(){pa.raiseWarning(this,"1301081430","run","JSRenderer~enablelink()","Method deprecated.")};n("pie3d",{friendlyName:"3D Pie Chart",defaultSeriesType:"pie3d",rendererId:"pie3d",creditLabel:!1,fireGroupEvent:!0,
getPointColor:function(a){return a},defaultPlotShadow:0},n.pie2d);n("doughnut2d",{friendlyName:"Doughnut Chart",getPointColor:function(a,p,c){var d;a=ea(a);p=Ma(p);100>c&&ma?(d=ka(a,u(100*(85-.2*(100-c)))/100),a=fa(a,u(100*(100-.5*c))/100),p={FCcolor:{color:d+","+a+","+a+","+d,alpha:p+","+p+","+p+","+p,radialGradient:!0,gradientUnits:"userSpaceOnUse",r:c}}):p={FCcolor:{color:a+","+a,alpha:p+","+p,ratio:"0,100"}};return p}},n.pie2d);n("doughnut3d",{friendlyName:"3D Doughnut Chart",defaultSeriesType:"pie3d",
rendererId:"pie3d",fireGroupEvent:!0,getPointColor:n.pie3d,defaultPlotShadow:0},n.doughnut2d);n("pareto2d",{standaloneInit:!0,friendlyName:"Pareto Chart",point:function(a,p,c,d,q){a=c.length;var b=0,t=0,e={},h=this.colorManager,r=/3d$/.test(q.chart.defaultSeriesType),Q=this.isBar,l=g(360-d.plotfillangle,90),wa=g(d.showplotborder,r?za:Ja)===Ja?r?1:k(d.plotborderthickness,1):0,f=q.chart.useRoundEdges,n=g(d.tooltipsepchar,", "),y=g(d.plotbordercolor,h.getColor("plotBorderColor")).split(ba)[0],Z=d.showplotborder==
za?za:g(d.plotborderalpha,d.plotfillalpha,Ga),z=q.xAxis,P=k(d.showcumulativeline,1),R=q[ua],B=R.axisGridManager,w=R.x,m=d.showtooltip!=za,O=[],C=k(d.use3dlighting,1),G=q[ua].numberFormatter,I=k(d.showlinevalues,d.showvalues),u=k(d.plotborderdashed,0),W,H=k(d.plotborderdashlen,5),S=k(d.plotborderdashgap,4),U=ga(d.xaxisname),T=ga(d.yaxisname),x=R.numberFormatter,D=p,M,qa,E,F,J,A,v,ja,L,s,X,ca,Y,V,N,ha,$,ka,fa,ra,aa,na,Da,ia,Z=r?d.showplotborder?Z:za:Z,y=r?g(d.plotbordercolor,"#FFFFFF"):y;E=k(d.useplotgradientcolor,
1)?Va(d.plotgradientcolor,h.getColor("plotGradientColor")):K;for(N=qa=0;qa<a;qa+=1)ra=c[qa],c[qa].vline?B.addVline(z,ra,N,q):(M=G.getCleanValue(ra.value,!0),null!==M&&(t+=ra.value=M,O.push(ra),N+=1));a=O.length;O.sort(function(a,c){return c.value-a.value});P&&0<t?(s=k(d.linedashed,0),aa=ea(g(d.linecolor,h.getColor("plotBorderColor"))),e=g(d.linealpha,100),X=k(d.linedashlen,5),F=k(d.linedashgap,4),qa=k(d.linethickness,2),Y={opacity:e/100},fa=g(d.valueposition,"auto"),V=k(d.drawanchors,d.showanchors),
void 0===V&&(V=e!=za),$=k(d.anchorborderthickness,1),ka=k(d.anchorsides,0),W=k(d.anchorradius,3),ha=ea(g(d.anchorbordercolor,aa)),M=ea(g(d.anchorbgcolor,h.getColor("anchorBgColor"))),N=Ma(g(d.anchoralpha,Ga)),c=Ma(g(d.anchorbgalpha,N))*N/100,s=s?Ba(X,F,qa):void 0,F=Boolean(k(ra.anchorshadow,d.anchorshadow,0)),X=this.pointHoverOptions(ra,p,{plotType:"anchor",anchorBgColor:M,anchorAlpha:N,anchorBgAlpha:c,anchorAngle:g(d.anchorstartangle,90),anchorBorderThickness:$,anchorBorderColor:ha,anchorBorderAlpha:N,
anchorSides:ka,anchorRadius:W,shadow:ca}),e={yAxis:1,data:[],type:"line",color:{FCcolor:{color:aa,alpha:e}},lineWidth:qa,marker:{enabled:V,shadow:F&&1<=W?{opacity:N/100}:!1,fillColor:{FCcolor:{color:M,alpha:c}},lineColor:{FCcolor:{color:ha,alpha:N}},lineWidth:$,radius:W,symbol:cb(ka),startAngle:g(d.anchorstartangle,90)}},D=[D,e],R[1]||(R[1]={}),R[1].stacking100Percent=!0):("1"!==d.showsecondarylimits&&(d.showsecondarylimits="0"),"1"!==d.showdivlinesecondaryvalue&&(d.showdivlinesecondaryvalue="0"));
R[1]||(R[1]={});R[1].stacking100Percent=!0;for(qa=0;qa<a;qa+=1)ra=O[qa],ca=k(ra.showlabel,d.showlabels,1),c=ga(ca?Fa(ra.label,ra.name):K),v=g(ra.color,h.getPlotColor()),B.addXaxisCat(z,qa,qa,c,ra,{},d,v),b+=M=ra.value,F=k(ra.dashed,u),J=g(ra.dashgap,S),A=g(ra.dashlen,H),ja=g(ra.alpha,d.plotfillalpha,Ga),L=g(ra.ratio,d.plotfillratio),ca={opacity:ja/100},na=g(ra.alpha,Z)+K,aa=la(v+ba+E.replace(/,+?$/,""),ja,L,l,f,y+K,na+K,Q,r),W=F?Ba(A,J,wa):"none",N=b/t*100,$=G.percentValue(N),ha=null===M?M:x.dataLabels(M),
ka=ta(ga(ra.displayvalue)),ka=k(ra.showvalue,R.showValues)?void 0!==ka?ka:ha:K,R.showTooltip?void 0!==(V=ta(ga(g(ra.tooltext,R.tooltext))))?(Da={formattedValue:ha,label:c,yaxisName:T,xaxisName:U,cumulativeValue:b,cumulativeDataValue:x.dataLabels(b),cumulativePercentValue:$,sum:x.dataLabels(t),unformattedSum:t},ia=[1,2,3,5,6,7,20,21,22,23,24,25],V=Ea(V,ia,Da,ra,d)):V=null===ha?!1:c!==K?c+R.tooltipSepChar+ha:ha:V=K,J=this.pointHoverOptions(ra,p,{plotType:"column",is3d:r,isBar:Q,use3DLighting:C,isRoundEdged:f,
color:v,gradientColor:E,alpha:ja,ratio:L,angle:l,borderWidth:wa,borderColor:y,borderAlpha:na,borderDashed:F,borderDashGap:J,borderDashLen:A,shadow:ca}),F=g(ra.link),p.data.push({link:F,toolText:V,displayValue:ka,categoryLabel:c,y:M,shadow:ca,color:aa[0],borderColor:aa[1],borderWidth:wa,use3DLighting:C,dashStyle:W,tooltipConstraint:this.tooltipConstraint,hoverEffects:J.enabled&&J.options,rolloverProperties:J.enabled&&J.rolloverOptions}),this.pointValueWatcher(q,M),P&&(M=ta(ga(g(ra.cumulativeplottooltext,
d.cumulativeplottooltext))),ca=1==I?$:0===I||ka===K?K:$,V=m?void 0!==M?Ea(M,ia||[1,2,3,5,6,7,20,21,22,23,24,25],Da||{formattedValue:ha,label:c,yaxisName:T,xaxisName:U,cumulativeValue:b,cumulativeDataValue:x.dataLabels(b),cumulativePercentValue:$,sum:x.dataLabels(t),unformattedSum:t},ra,d):(c!==K?c+n:K)+$:K,e.data.push({shadow:Y,color:e.color,marker:e.marker,y:N,toolText:V,displayValue:ca,valuePosition:fa,categoryLabel:c,link:F,dashStyle:s,hoverEffects:X.enabled&&X.options,rolloverProperties:X.enabled&&
X.rolloverOptions}));w.catCount=a;return D},defaultSeriesType:"column",isDual:!0,creditLabel:!1,rendererId:"cartesian"},s);n("pareto3d",{friendlyName:"3D Pareto Chart",defaultSeriesType:"column3d",fireGroupEvent:!0,defaultPlotShadow:1,is3D:!0},n.pareto2d);n("mscolumn2d",{standaloneInit:!0,friendlyName:"Multi-series Column Chart",creditLabel:!1,rendererId:"cartesian"},n.mscolumn2dbase);n("mscolumn3d",{defaultSeriesType:"column3d",friendlyName:"Multi-series 3D Column Chart",defaultPlotShadow:1,fireGroupEvent:!0,
is3D:!0,defaultZeroPlaneHighlighted:!1},n.mscolumn2d);n("msbar2d",{friendlyName:"Multi-series Bar Chart",isBar:!0,defaultSeriesType:"bar",spaceManager:n.barbase},n.mscolumn2d);n("msbar3d",{defaultSeriesType:"bar3d",friendlyName:"Multi-series 3D Bar Chart",fireGroupEvent:!0,defaultPlotShadow:1,is3D:!0,defaultZeroPlaneHighlighted:!1},n.msbar2d);n("msline",{standaloneInit:!0,friendlyName:"Multi-series Line Chart",creditLabel:!1,rendererId:"cartesian"},n.mslinebase);n("msarea",{standaloneInit:!0,friendlyName:"Multi-series Area Chart",
creditLabel:!1,rendererId:"cartesian"},n.msareabase);n("stackedcolumn2d",{friendlyName:"Stacked Column Chart",isStacked:!0},n.mscolumn2d);n("stackedcolumn3d",{friendlyName:"3D Stacked Column Chart",isStacked:!0},n.mscolumn3d);n("stackedbar2d",{friendlyName:"Stacked Bar Chart",isStacked:!0},n.msbar2d);n("stackedbar3d",{friendlyName:"3D Stacked Bar Chart",isStacked:!0},n.msbar3d);n("stackedarea2d",{friendlyName:"Stacked Area Chart",isStacked:!0,areaAlpha:100,showSum:0},n.msarea);n("marimekko",{friendlyName:"Marimekko Chart",
isValueAbs:!0,distributedColumns:!0,isStacked:!0,xAxisMinMaxSetter:Sa,postSeriesAddition:function(a,p){var c=a[ua],d=0,b=a.xAxis,e=100/c.marimekkoTotal,t=[],da=a.series,h=0,r=ya({},a.plotOptions.series.dataLabels.style),Q=parseInt(r.fontSize,10),l=k(p.chart.plotborderthickness,1),wa=a.chart.rotateValues,f=k(p.chart.rotatexaxispercentvalues,0),n=-.5*l-(l%2+(f?1:0)+!a.chart.plotBorderWidth),y=f?Q/2*1.2:0,Z=wa?270:0,z=c[0],P=z.stacking100Percent,R=!P,B=c.inCanvasStyle,g=this.numberFormatter,m=p.categories&&
p.categories[0]&&p.categories[0].category||[],O=0,C=[],G,I,x,W,H,S,U,T,A,v,l=[];c.isXYPlot=!0;c.distributedColumns=!0;b.min=0;b.max=100;b.labels.enabled=!1;b.gridLineWidth=0;b.alternateGridColor=Qa;G=z.stack;p.chart.interactivelegend="0";z=0;for(I=a.xAxis.plotLines.length;z<I;z+=1)x=b.plotLines[z],x.isGrid&&(x.isCat=!0,t[x.value]=x,x._hideLabel=!0);for(z=I=0;z<m.length;z+=1)m[z].vline||(O+=C[I]=g.getCleanValue(m[z].widthpercent||0),I+=1);x=G.floatedcolumn&&G.floatedcolumn[0]||[];if(100===O&&(x&&x.length)!==
I)for(;I--;)x[I]||(x[I]={p:null});O=w(O);if(x)for(H=0,I=x.length;H<I;){v=x[H];d+=W=v&&v.p||0;U=100===O?C[H]:W*e;S=h+U/2;T=h+U;l.push(T);for(z=0;z<da.length;z+=1)if(a.series[z].visible=!0,m=a.series[z].data[H],m._FCX=h,m._FCW=U,A=g.percentValue(m.y/W*100),m.toolText=Ea(m.toolText,[14,24,25,111,112],{xAxisPercentValue:g.percentValue(U),percentValue:A,sum:g.dataLabels(W),unformattedSum:W}),P){if(m.y||0===m.y)G=m.y/W*100,m.y=G,m.showPercentValues&&(m.displayValue=A);if(m.previousY||0===m.previousY)m.previousY=
m.previousY/W*100}c.showStackTotal&&a.xAxis.plotLines.push({value:S,width:0,isVline:R,isTrend:!R,_isStackSum:1,zIndex:4,label:{align:Ta,textAlign:Ta,rotation:Z,style:r,verticalAlign:Za,offsetScale:R?0>W?v.n:v.p:void 0,offsetScaleIndex:0,y:0>W?270===wa?4:Q:-4,x:0,text:g.yAxis(Oa(W,10))}});t[H]&&(t[H].value=S,t[H]._weight=U,t[H]._hideLabel=!1);H+=1;c.showXAxisPercentValues&&H<I&&a.xAxis.plotLines.push({value:T,width:0,isVine:!0,label:{align:Ta,textAlign:f?ab:Ta,rotation:f?270:0,backgroundColor:"#ffffff",
backgroundOpacity:1,borderWidth:"1px",borderType:"solid",borderColor:B.color,style:{color:B.color,fontSize:B.fontSize,fontFamily:B.fontFamily,lineHeight:B.lineHeight},verticalAlign:Xa,y:n,x:y,text:this.numberFormatter.percentValue(T)},zIndex:5});h=T}H=0;for(I=t.length;H<I;H+=1)t[H]&&t[H]._hideLabel&&(t[H].value=null);z=0;for(I=a.xAxis.plotLines.length;z<I;z+=1)if(x=b.plotLines[z],x.isVline&&!x._isStackSum&&(c=x.value))c-=.5,d=l[u(c)],e=l[D(c)],x.value=d+(e-d)*(c-u(c))},defaultSeriesType:"floatedcolumn"},
n.stackedcolumn2d);n("msstackedcolumn2d",{friendlyName:"Multi-series Stacked Column Chart",series:function(a,p,c){var d,b,e,t,da=p[ua],h=0,r,Q;r=[];var l;p.legend.enabled=Boolean(k(a.chart.showlegend,1));if(a.dataset&&0<a.dataset.length){this.categoryAdder(a,p);d=0;for(b=a.dataset.length;d<b;d+=1)if(l=a.dataset[d].dataset)for(e=0,t=l.length;e<t;e+=1,h+=1)r={hoverEffects:this.parseSeriesHoverOptions(a,p,l[e],c),visible:!k(l[e].initiallyhidden,0),data:[],numColumns:b,columnPosition:d},Q=Math.min(da.oriCatTmp.length,
l[e].data&&l[e].data.length),r=this.point(c,r,l[e],a.chart,p,Q,h,d),p.series.push(r);if(this.isDual&&a.lineset&&0<a.lineset.length)for(e=0,t=a.lineset.length;e<t;e+=1,h+=1)d=a.lineset[e],r={hoverEffects:this.parseSeriesHoverOptions(a,p,d,c),visible:!k(d.initiallyhidden,0),data:[],yAxis:1,type:"line"},Q=Math.min(da.oriCatTmp.length,d.data&&d.data.length),p.series.push(n.msline.point.call(this,"msline",r,d,a.chart,p,Q,h));this.configureAxis(p,a);a.trendlines&&Ua(a.trendlines,p.yAxis,p[ua],this.isDual,
this.isBar)}},postSpaceManager:function(a,p,c){var d=a[ua],b,e,t;n.base.postSpaceManager.call(this);if(this.isStacked&&d.showStackTotal&&(b=a.chart,a=(p=a.xAxis)&&p.plotLines,b=c-b.marginLeft-b.marginRight,c=d.plotSpacePercent,d=d[0].stack,d=d.column&&d.column.length,e=(1-2*c)/d,p=b/(p.max-p.min),50<p*e&&.1==c))for(p=50/p,c=a&&a.length,d=-((d-1)/2)*p,t=0;t<c;t+=1)e=a[t],e._isStackSum&&(b=e._catPosition+(d+p*e._stackIndex),e.value=b)}},n.stackedcolumn2d);n("mscombi2d",{friendlyName:"Multi-series Combination Chart",
standaloneInit:!0,creditLabel:!1,rendererId:"cartesian"},n.mscombibase);n("mscombi3d",{friendlyName:"Multi-series 3D Combination Chart",series:n.mscombi2d.series,eiMethods:function(a){var p={};va(a.split(","),function(a){p[a]=function(){pa.raiseWarning(this,"1301081430","run","JSRenderer~"+a+"()","Method not applicable.")}});return p}("view2D,view3D,resetView,rotateView,getViewAngles,fitToStage")},n.mscolumn3d);n("mscolumnline3d",{friendlyName:"Multi-series Column and Line Chart"},n.mscombi3d);n("stackedcolumn2dline",
{friendlyName:"Stacked Column and Line Chart",isStacked:!0,stack100percent:0},n.mscombi2d);n("stackedcolumn3dline",{friendlyName:"Stacked 3D Column and Line Chart",isStacked:!0,stack100percent:0},n.mscombi3d);n("mscombidy2d",{friendlyName:"Multi-series Dual Y-Axis Combination Chart",isDual:!0,secondarySeriesType:void 0},n.mscombi2d);n("mscolumn3dlinedy",{friendlyName:"Multi-series 3D Column and Line Chart",isDual:!0,secondarySeriesType:"line"},n.mscolumnline3d);n("stackedcolumn3dlinedy",{friendlyName:"Stacked 3D Column and Line Chart",
isDual:!0,secondarySeriesType:"line"},n.stackedcolumn3dline);n("msstackedcolumn2dlinedy",{friendlyName:"Multi-series Dual Y-Axis Stacked Column and Line Chart",isDual:!0,stack100percent:0,secondarySeriesType:"line"},n.msstackedcolumn2d);n("scrollcolumn2d",{friendlyName:"Scrollable Multi-series Column Chart",postSeriesAddition:n.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:40},n.mscolumn2d);n("scrollline2d",{friendlyName:"Scrollable Multi-series Line Chart",
postSeriesAddition:n.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:75},n.msline);n("scrollarea2d",{friendlyName:"Scrollable Multi-series Area Chart",postSeriesAddition:n.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:75},n.msarea);n("scrollstackedcolumn2d",{friendlyName:"Scrollable Stacked Column Chart",postSeriesAddition:function(a,p,c,d){n.base.postSeriesAddition.call(this,a,p,c,d);n.scrollbase.postSeriesAddition.call(this,
a,p,c,d)},canvasborderthickness:1,tooltipConstraint:"plot",avgScrollPointWidth:75},n.stackedcolumn2d);n("scrollcombi2d",{friendlyName:"Scrollable Combination Chart",postSeriesAddition:n.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:40},n.mscombi2d);n("scrollcombidy2d",{friendlyName:"Scrollable Dual Y-Axis Combination Chart",postSeriesAddition:n.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:40},
n.mscombidy2d);n("scatter",{friendlyName:"Scatter Chart",isXY:!0,standaloneInit:!0,defaultSeriesType:"scatter",defaultZeroPlaneHighlighted:!1,creditLabel:!1},n.scatterbase);n("bubble",{friendlyName:"Bubble Chart",standaloneInit:!0,standaloneInut:!0,defaultSeriesType:"bubble",rendererId:"bubble",point:function(a,p,c,d,b){a=k(d.ignoreemptydatasets,0);var e=!1,t=this.colorManager,da,h,r,Q,l,f,n,Z,y,P,z,m,R,B,x,w,O=k(c.showvalues,b[ua].showValues);da=k(d.bubblescale,1);var C=g(d.negativecolor,"FF0000"),
G=b.plotOptions.bubble,I=this.numberFormatter,u=p._showRegression=k(c.showregressionline,d.showregressionline,0),W,H,S,U;p.name=ta(c.seriesname);r=Boolean(k(c.drawanchors,c.showanchors,d.drawanchors,1));Z=g(c.plotfillalpha,c.bubblefillalpha,d.plotfillalpha,Ga);y=k(c.showplotborder,d.showplotborder,1);P=ea(g(c.plotbordercolor,d.plotbordercolor,"666666"));z=g(c.plotborderthickness,d.plotborderthickness,1);m=g(c.plotborderalpha,d.plotborderalpha,"95");y=1===y?z:0;t=g(c.color,c.plotfillcolor,d.plotfillcolor,
t.getPlotColor());p.marker={enabled:r,fillColor:this.getPointColor(t,Ga),lineColor:aa(P,y?m:0),lineWidth:y,symbol:"circle"};if(z=c.data){w=z.length;G.bubbleScale=da;if(0===k(c.includeinlegend)||void 0===p.name)p.showInLegend=!1;u&&(p.events={hide:this.hideRLine,show:this.showRLine},W={sumX:0,sumY:0,sumXY:0,sumXsqure:0,sumYsqure:0,xValues:[],yValues:[]},H=k(c.showyonx,d.showyonx,1),S=ea(g(c.regressionlinecolor,d.regressionlinecolor,t)),U=k(c.regressionlinethickness,d.regressionlinethickness,1),da=
Ma(k(c.regressionlinealpha,d.regressionlinealpha,100)),S=aa(S,da));for(h=0;h<w;h+=1)(Q=z[h])?(da=I.getCleanValue(Q.y),R=I.getCleanValue(Q.x),B=I.getCleanValue(Q.z,!0),null===da?p.data.push({y:null,x:R}):(e=!0,n=0!==k(d.use3dlighting,Q.is3d,c.is3d,d.is3d),l=ea(g(Q.color,0>Q.z?C:t)),f=g(Q.alpha,Z),x=this.getPointStub(Q,da,R,b,c,O),l=n?this.getPointColor(l,f):{FCcolor:{color:l,alpha:f}},null!==B&&(G.zMax=G.zMax>B?G.zMax:B,G.zMin=G.zMin<B?G.zMin:B),Q=this.pointHoverOptions(Q,p,{plotType:"bubble",is3d:n,
seriesAnchorSymbol:"circle",color:l,negativeColor:C,alpha:f,borderWidth:y,borderColor:P,borderAlpha:m,shadow:!1}),p.data.push({y:da,x:R,z:B,displayValue:x.displayValue,toolText:x.toolText,link:x.link,hoverEffects:Q.enabled&&Q.options,rolloverProperties:Q.enabled&&Q.rolloverOptions,marker:{enabled:r,fillColor:l,lineColor:{FCcolor:{color:P,alpha:m}},lineWidth:y,symbol:"circle"}}),this.pointValueWatcher(b,da,R,u&&W))):p.data.push({y:null});u&&(c={type:"line",color:S,showInLegend:!1,lineWidth:U,enableMouseTracking:!1,
marker:{enabled:!1},data:this.getRegressionLineSeries(W,H,w),zIndex:0},p=[p,c])}a&&!e&&(p.showInLegend=!1);return p},getPointStub:function(a,p,c,d,b,e){var t=this.dataObj.chart;d=d[ua];p=null===p?p:d.numberFormatter.dataLabels(p);var da,h=d.tooltipSepChar,r=ta(ga(g(a.tooltext,b.plottooltext,d.tooltext)));d.showTooltip?void 0!==r?b=Ea(r,[4,5,6,7,8,9,10,11,12,13,118],{yDataValue:p,xDataValue:d.numberFormatter.xAxis(c),yaxisName:ga(t.yaxisname),xaxisName:ga(t.xaxisname),zDataValue:d.numberFormatter.dataLabels(a.z)},
a,t,b):null===p?b=!1:(d.seriesNameInToolTip&&(da=g(b&&b.seriesname)),b=da?da+h:K,b+=c?d.numberFormatter.xAxis(c)+h:K,b=b+p+(a.z?h+d.numberFormatter.dataLabels(a.z):K)):b=K;c=k(a.showvalue,e,d.showValues)?void 0!==g(a.displayvalue,a.name,a.label)?ga(g(a.displayvalue,a.name,a.label)):p:K;a=ta(a.link);return{displayValue:c,toolText:b,link:a}}},n.scatter);n("ssgrid",{friendlyName:"Grid Component",standaloneInit:!0,defaultSeriesType:"ssgrid",rendererId:"ssgrid",chart:function(a,b){var c=this.containerElement,
d=ya({},this.dataObj),q=d.chart||(d.chart=d.graph||{}),e=this.chartInstance,t=0,da=[],h=d.data,r=h&&h.length,Q=this.smartLabel,l=this.numberFormatter,f=c.offsetHeight,Z=c.offsetWidth,P=this.colorManager,y,m,z,x,R,B,w,u,O,C,G,I,A,W,H,S,U,T,D,ja,M,qa,E,F,J,L=0;m=0;var c={_FCconf:{0:{stack:{}},1:{stack:{}},x:{stack:{}},noWrap:!1,marginLeftExtraSpace:0,marginRightExtraSpace:0,marginBottomExtraSpace:0,marginTopExtraSpace:0,marimekkoTotal:0},chart:{ignoreHiddenSeries:!1,events:{},spacingTop:0,spacingRight:0,
spacingBottom:0,spacingLeft:0,marginTop:0,marginRight:0,marginBottom:0,marginLeft:0,borderRadius:0,borderColor:"#000000",borderWidth:1,defaultSeriesType:"ssgrid",style:{fontFamily:g(q.basefont,"Verdana,sans"),fontSize:Ia(q.basefontsize,20)+Ra,color:g(q.basefontcolor,P.getColor("baseFontColor")).replace(/^#?([a-f0-9]+)/ig,"#$1")},plotBackgroundColor:Qa},labels:{smartLabel:Q},colors:"AFD8F8 F6BD0F 8BBA00 FF8E46 008E8E D64646 8E468E 588526 B3AA00 008ED6 9D080D A186BE CC6600 FDC689 ABA000 F26D7D FFF200 0054A6 F7941C CC3300 006600 663300 6DCFF6".split(" "),
credits:{href:v.CREDIT_HREF,text:v.CREDIT_STRING,enabled:!1},legend:{enabled:!1},series:[],subtitle:{text:K},title:{text:K},tooltip:{enabled:!1},exporting:{buttons:{exportButton:{},printButton:{enabled:!1}}}},X=c[ua],ca=y=m=L=0,s=t=W=0;J=e.jsVars.cfgStore;e=c.chart;R=e.toolbar={button:{}};B=R.button;delete d.graph;$(c.chart.style);e.events.click=this.linkClickFN;B.scale=k(q.toolbarbuttonscale,1.15);B.width=k(q.toolbarbuttonwidth,15);B.height=k(q.toolbarbuttonheight,15);B.radius=k(q.toolbarbuttonradius,
2);B.spacing=k(q.toolbarbuttonspacing,5);B.fill=aa(g(q.toolbarbuttoncolor,"ffffff"));B.labelFill=aa(g(q.toolbarlabelcolor,"cccccc"));B.symbolFill=aa(g(q.toolbarsymbolcolor,"ffffff"));B.hoverFill=aa(g(q.toolbarbuttonhovercolor,"ffffff"));B.stroke=aa(g(q.toolbarbuttonbordercolor,"bbbbbb"));B.symbolStroke=aa(g(q.toolbarsymbolbordercolor,"9a9a9a"));B.strokeWidth=k(q.toolbarbuttonborderthickness,1);B.symbolStrokeWidth=k(q.toolbarsymbolborderthickness,1);d=B.symbolPadding=k(q.toolbarsymbolpadding,5);B.symbolHPadding=
k(q.toolbarsymbolhpadding,d);B.symbolVPadding=k(q.toolbarsymbolvpadding,d);B=R.position=g(q.toolbarposition,"tr").toLowerCase();switch(B){case "tr":case "tl":case "br":case "bl":break;default:B="tr"}d=R.hAlign="left"===(K+q.toolbarhalign).toLowerCase()?"l":B.charAt(1);B=R.vAlign="bottom"===(K+q.toolbarvalign).toLowerCase()?"b":B.charAt(0);R.hDirection=k(q.toolbarhdirection,"r"===d?-1:1);R.vDirection=k(q.toolbarvdirection,"b"===B?-1:1);R.vMargin=k(q.toolbarvmargin,6);R.hMargin=k(q.toolbarhmargin,10);
R.x=k(q.toolbarx,"l"===d?0:a);R.y=k(q.toolbary,"t"===B?0:b);void 0!==g(q.clickurl)&&(e.link=q.clickurl,e.style.cursor="pointer");y=k(J.showpercentvalues,q.showpercentvalues,0);m=g(J.numberitemsperpage,q.numberitemsperpage);k(J.showshadow,q.showshadow,0);t=g(J.basefont,q.basefont,"Verdana,sans");z=Ia(J.basefontsize,q.basefontsize,10);z+=Ra;x=ea(g(J.basefontcolor,q.basefontcolor,P.getColor("baseFontColor")));d=ea(g(J.alternaterowbgcolor,q.alternaterowbgcolor,P.getColor("altHGridColor")));R=g(J.alternaterowbgalpha,
q.alternaterowbgalpha,P.getColor("altHGridAlpha"))+K;B=k(J.listrowdividerthickness,q.listrowdividerthickness,1);w=ea(g(J.listrowdividercolor,q.listrowdividercolor,P.getColor("borderColor")));u=k(J.listrowdivideralpha,q.listrowdivideralpha,P.getColor("altHGridAlpha"))+15+K;O=k(J.colorboxwidth,q.colorboxwidth,8);C=k(J.colorboxheight,q.colorboxheight,8);G=k(J.navbuttonradius,q.navbuttonradius,7);I=ea(g(J.navbuttoncolor,q.navbuttoncolor,P.getColor("canvasBorderColor")));A=ea(g(J.navbuttonhovercolor,q.navbuttonhovercolor,
P.getColor("altHGridColor")));W=k(J.textverticalpadding,q.textverticalpadding,3);H=k(J.navbuttonpadding,q.navbuttonpadding,5);S=k(J.colorboxpadding,q.colorboxpadding,10);U=k(J.valuecolumnpadding,q.valuecolumnpadding,10);T=k(J.namecolumnpadding,q.namecolumnpadding,5);D=k(J.borderthickness,q.borderthickness,1);ja=ea(g(J.bordercolor,q.bordercolor,P.getColor("borderColor")));M=g(J.borderalpha,q.borderalpha,P.getColor("borderAlpha"))+K;qa=g(J.bgcolor,q.bgcolor,"FFFFFF");E=g(J.bgalpha,q.bgalpha,Ga);F=g(J.bgratio,
q.bgratio,Ga);J=g(J.bgangle,q.bgangle,za);e.borderRadius=D/16;e.borderWidth=D;e.borderColor=Y({FCcolor:{color:ja,alpha:M}});e.backgroundColor={FCcolor:{color:qa,alpha:E,ratio:F,angle:J}};e.borderRadius=k(q.borderradius,0);J={fontFamily:t,fontSize:z,color:x};$(J);Q.setStyle(J);for(t=0;t<r;t+=1)if(z=h[t],D=l.getCleanValue(z.value),ja=ga(Fa(z.label,z.name)),x=ea(g(z.color,P.getPlotColor())),g(z.alpha,q.plotfillalpha,Ga),ja!=K||null!=D)da.push({value:D,label:ja,color:x}),L+=D,s+=1;for(t=0;t<s;t+=1)z=
da[t],D=z.value,z.dataLabel=z.label,z.displayValue=y?l.percentValue(D/L*100):l.dataLabels(D),h=Q.getOriSize(z.displayValue),ca=Math.max(ca,h.width+U);m?m>=s?(y=f/s,m=s):(l=f-2*(H+G),y=l/m):(L=parseInt(J.lineHeight,10),L=Math.max(L+2*W,C),m=f/L,m>=s?(y=f/s,m=s):(l=f-2*(H+G),m=Math.floor(l/L),y=l/m));W=Z-S-O-T-ca-U;t=S+O+T;l=g(q.basefont,"Verdana,sans");ca=Ia(q.basefontsize,10);P=g(q.basefontcolor,P.getColor("baseFontColor"));h=g(q.outcnvbasefont,l);z=Ia(q.outcnvbasefontsize,ca);r=z+Ra;q=g(q.outcnvbasefontcolor,
P).replace(/^#?([a-f0-9]+)/ig,"#$1");ca+=Ra;P=P.replace(/^#?([a-f0-9]+)/ig,"#$1");X.trendStyle=X.outCanvasStyle={fontFamily:h,color:q,fontSize:r};$(X.trendStyle);X.inCanvasStyle={fontFamily:l,fontSize:ca,color:P};c.tooltip.style={fontFamily:l,fontSize:ca,lineHeight:void 0,color:P};c.tooltip.shadow=!1;e.height=f;e.width=Z;e.rowHeight=y;e.labelX=t;e.colorBoxWidth=O;e.colorBoxHeight=C;e.colorBoxX=S;e.valueX=S+O+T+W+U;e.valueColumnPadding=U;e.textStyle=J;e.listRowDividerAttr={"stroke-width":B,stroke:{FCcolor:{color:w,
alpha:u}}};e.alternateRowColor={FCcolor:{color:d,alpha:R}};e.navButtonRadius=G;e.navButtonPadding=H;e.navButtonColor=I;e.navButtonHoverColor=A;e.lineHeight=parseInt(J.lineHeight,10);f=[];q=0;X=!0;for(t=0;t<s&0!==m;t+=1)0===t%m&&(f.push({data:[],visible:X}),X=!1,q+=1),z=da[t],Z=Q.getSmartText(z.dataLabel,W,y),f[q-1].data.push({label:Z.text,originalText:Z.tooltext,displayValue:z.displayValue,y:z.value,color:z.color});c.series=f;n.base.parseExportOptions.call(this,c);c.tooltip.enabled=!!c.exporting.enabled;
return c},creditLabel:!1},n.base);n("renderer.bubble",{drawPlotBubble:function(a,p){var c=this,d=c.options,q=d.chart,h=d.plotOptions.series,t=h.dataLabels&&h.dataLabels.style||{},da={fontFamily:t.fontFamily,fontSize:t.fontSize,lineHeight:t.lineHeight,fontWeight:t.fontWeight,fontStyle:t.fontStyle},t=c.paper,f=c.elements,r=a.items,Q=a.graphics=a.graphics||[],l=c.xAxis[p.xAxis||0],wa=c.yAxis[p.yAxis||0],P=a.data,Z=!1!==(d.tooltip||{}).enabled,y,n,h=isNaN(+h.animation)&&h.animation.duration||1E3*h.animation,
z=!1===p.visible?"hidden":"visible",d=d.plotOptions.bubble,m=d.zMax,d=d.bubbleScale,g=ja(c.canvasHeight,c.canvasWidth)/8,m=ha(m),B,x,u,O,C,G,I,D,W,H,S;B=c.layers;x=B.dataset=B.dataset||t.group("dataset-orphan");var U=B.tracker,T,A,L=function(a){sa.call(this,c,a)},M=function(a,d,b){return function(p){a.attr(d);sa.call(this,c,p,b)}};c.addCSSDefinition(".fusioncharts-datalabels .fusioncharts-label",da);B.datalabels?B.datalabels.attr("class","fusioncharts-datalabels"):B.datalabels=t.group({"class":"fusioncharts-datalabels"},
"datalables").insertAfter(x);da=x.bubble=x.bubble||t.group("bubble",x);q.clipBubbles&&!da.attrs["clip-rect"]&&da.attr({"clip-rect":f["clip-canvas"]});B=0;for(x=P.length;B<x;B+=1){u=P[B];H=S=A=null;W=u.marker;if(null!==u.y&&W&&W.enabled){O=u.link;q=u.toolText;C=k(u.x,B);G=u.y;f={index:B,link:O,value:G,y:G,x:C,z:u.z,displayValue:u.displayValue,toolText:u.toolText,id:a.userID,datasetIndex:a.index,datasetName:a.name,visible:a.visible};D=wa.getAxisPosition(G);I=l.getAxisPosition(C);n=ha(u.z);T=w(n*g/m)*
d||0;n=y={};u.hoverEffects&&(n={fill:Y(W.fillColor),"stroke-width":W.lineWidth,stroke:Y(W.lineColor),r:T},y=u.rolloverProperties,y={fill:Y(y.fillColor),"stroke-width":y.lineWidth,stroke:Y(y.lineColor),r:T*y.scale});H=t.circle(I,D,0,da).attr({fill:Y(W.fillColor),"stroke-width":W.lineWidth,stroke:Y(W.lineColor),visibility:z}).animate({r:T||0},h,"easeOut",c.getAnimationCompleteFn());if(O||Z)T<b&&(T=b),S=t.circle(I,D,T,U).attr({cursor:O?"pointer":"",stroke:e,"stroke-width":W.lineWidth,fill:e,ishot:!!O,
visibility:z});(S||H).data("eventArgs",f).click(L).hover(M(H,y,"DataPlotRollOver"),M(H,n,"DataPlotRollOut")).tooltip(q);r[B]={index:B,x:C,y:G,z:u.z,value:G,graphic:H,dataLabel:A,tracker:S};A=c.drawPlotLineLabel(a,p,B,I,D)}else r[B]={index:B,x:C,y:G};A&&Q.push(A);H&&Q.push(H);S&&Q.push(S)}a.visible=!1!==p.visible;return a}},n["renderer.cartesian"]);n("renderer.ssgrid",{drawGraph:function(){var a=this.options.series,b=this.elements,c=b.plots,d=a.length,q;c||(c=this.plots=this.plots||[],b.plots=c);this.drawSSGridNavButton();
for(q=0;q<d;q++)(b=c[q])||c.push(b={items:[],data:a[q].data}),a[q].data&&a[q].data.length&&this.drawPlot(b,a[q]);1<d&&this.nenagitePage(0)},drawPlot:function(a){var b=a.data,c=this.paper,d=this.options.chart,q=d.colorBoxHeight,e=d.colorBoxWidth,t=d.colorBoxX,h=d.labelX,f=d.valueX,r=d.rowHeight,k=d.width,l=d.listRowDividerAttr,P=l["stroke-width"],l=Y(l.stroke),Z=P%2/2,n=d.textStyle,y=this.layers,y=y.dataset=y.dataset||c.group("dataset-orphan"),d=Y(d.alternateRowColor);a=a.items;var m=0,z,x,g,B;b&&
b.length||(b=[]);l={stroke:l,"stroke-width":P};B=0;for(P=b.length;B<P;B+=1)g=b[B],x=g.y,z=a[B]={index:B,value:x,graphic:null,dataLabel:null,dataValue:null,alternateRow:null,listRowDivider:null,hot:null},null!==x&&void 0!==x&&(0===B%2&&(z.alternateRow=c.rect(0,m,k,r,0,y).attr({fill:d,"stroke-width":0})),x=w(m)+Z,z.listRowDivider=c.path(["M",0,x,"L",k,x],y).attr(l),z.graphic=c.rect(t,m+r/2-q/2,e,q,0,y).attr({fill:g.color,"stroke-width":0,stroke:"#000000"}),x=z.dataLabel=c.text().attr({text:g.label,
title:g.originalText||"",x:h,y:m+r/2,fill:n.color,"text-anchor":"start"}).css(n),y.appendChild(x),z=z.dataValue=c.text().attr({text:g.displayValue,title:g.originalText||"",x:f,y:m+r/2,fill:n.color,"text-anchor":"start"}).css(n),y.appendChild(z),m+=r);x=w(m)+Z;c.path(["M",0,x,"L",k,x],y).attr(l)},drawSSGridNavButton:function(){var a=this,b=a.paper,c=a.options,d=c.chart,q=c.series,e=d.navButtonColor,t=d.navButtonHoverColor,c=d.navButtonRadius,h=.67*c,f=d.navButtonPadding+h+(q&&q[0].data&&q[0].data.length*
d.rowHeight)+.5*c,d=d.width-20,r,k,l,P;1<q.length&&(P=a.naviigator=b.group("navigation"),a.navElePrv=q=b.group(P),r=b.path(["M",20,f,"L",20+c+h,f-h,20+c,f,20+c+h,f+h,"Z"]).attr({fill:e,"stroke-width":0,cursor:"pointer"}),q.appendChild(r),l=b.circle(20+c,f,c).attr({fill:Qa,"stroke-width":0,cursor:"pointer"}).mouseover(function(){r.attr({fill:t,cursor:"pointer"})}).mouseout(function(){r.attr({fill:e})}).click(function(){a.nenagitePage(-1)}),q.appendChild(l),a.navEleNxt=q=b.group(P),k=b.path(["M",d,
f,"L",d-c-h,f-h,d-c,f,d-c-h,f+h,"Z"]).attr({fill:e,"stroke-width":0,cursor:"pointer"}),q.appendChild(k),b=b.circle(d-c,f,c).attr({fill:Qa,"stroke-width":0,cursor:"pointer"}).mouseover(function(){k.attr({fill:t})}).mouseout(function(){k.attr({fill:e})}).click(function(){a.nenagitePage(1)}),q.appendChild(b))},nenagitePage:function(a){var b=this.plots,c=b.length;a=(this.currentSeriesIndex||0)+(a||0);var d,q=function(a){a.graphic&&a.graphic.hide();a.dataLabel&&a.dataLabel.hide();a.dataValue&&a.dataValue.hide();
a.alternateRow&&a.alternateRow.hide();a.listRowDivider&&a.listRowDivider.hide()};if(b[a]){for(d=c;d--;)va(b[d].items,q);va(b[a].items,function(a){a.graphic&&a.graphic.show();a.dataLabel&&a.dataLabel.show();a.dataValue&&a.dataValue.show();a.alternateRow&&a.alternateRow.show();a.listRowDivider&&a.listRowDivider.show()});this.currentSeriesIndex=a;pa.raiseEvent("pageNavigated",{pageId:a,data:this.options.series[a].data},this.logic.chartInstance);0===a?this.navElePrv.hide():this.navElePrv.show();a===c-
1?this.navEleNxt.hide():this.navEleNxt.show()}}},n["renderer.root"]);La.prototype={getArcPath:function(a,b,c,d,q,e,t,h,f,r){return c==q&&d==e?[]:["A",t,h,0,r,f,q,e]},parseColor:function(a,b){var c,d,q,e,t,h,f,r,k,l,P=b/2,m,n,y,Z,z;z=3;this.use3DLighting?(c=ka(a,80),d=ka(a,75),h=fa(a,85),f=fa(a,70),r=fa(a,40),k=fa(a,50),fa(a,30),l=fa(a,65),ka(a,85),q=ka(a,69),e=ka(a,75),t=ka(a,95)):(z=10,c=ka(a,90),d=ka(a,87),h=fa(a,93),f=fa(a,87),r=fa(a,80),l=k=fa(a,85),fa(a,80),t=ka(a,85),q=ka(a,75),e=ka(a,80));
m=d+ba+h+ba+f+ba+h+ba+d;y=b+ba+b+ba+b+ba+b+ba+b;n=d+ba+a+ba+h+ba+a+ba+d;Z=P+ba+P+ba+P+ba+P+ba+P;r=d+ba+a+ba+r+ba+a+ba+d;q=e+ba+h+ba+k+ba+h+ba+q;e="FFFFFF"+ba+"FFFFFF"+ba+"FFFFFF"+ba+"FFFFFF"+ba+"FFFFFF";z=0+ba+P/z+ba+b/z+ba+P/z+ba+0;return{frontOuter:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftX,y1:0,x2:this.rightX,y2:0,color:q,alpha:y,angle:0,ratio:"0,20,15,15,50"}},backOuter:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftX,y1:0,x2:this.rightX,y2:0,color:r,alpha:Z,angle:0,ratio:"0,62,8,8,22"}},
frontInner:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftInnerX,y1:0,x2:this.rightInnerX,y2:0,color:n,alpha:Z,angle:0,ratio:"0,25,5,5,65"}},backInner:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftInnerX,y1:0,x2:this.rightInnerX,y2:0,color:m,alpha:y,angle:0,ratio:"0,62,8,8,22"}},topBorder:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftX,y1:0,x2:this.rightX,y2:0,color:e,alpha:z,angle:0,ratio:"0,20,15,15,50"}},topInnerBorder:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftInnerX,
y1:0,x2:this.rightInnerX,y2:0,color:e,alpha:z,angle:0,ratio:"0,50,15,15,20"}},top:ma?{FCcolor:{gradientUnits:"userSpaceOnUse",radialGradient:!0,cx:this.cx,cy:this.cy,r:this.rx,fx:this.cx-.3*this.rx,fy:this.cy+1.2*this.ry,color:l+ba+t,alpha:b+ba+b,ratio:"0,100"}}:{FCcolor:{gradientUnits:"objectBoundingBox",color:f+ba+f+ba+h+ba+d,alpha:b+ba+b+ba+b+ba+b,angle:-72,ratio:"0,8,15,77"}},bottom:Y(aa(a,P)),startSlice:Y(aa(c,b)),endSlice:Y(aa(c,b))}},rotate:function(a){if(!this.hasOnePoint){for(var b=this.pointElemStore,
c=0,d=b.length,e;c<d;c+=1)e=b[c],e=e._confObject,e.start+=a,e.end+=a,this.updateSliceConf(e);this.refreshDrawing()}},refreshDrawing:function(){return function(){var a=this.slicingWallsArr,b=0,c,d=a.length,e,h,t,f,k=this.slicingWallsFrontGroup,r=this.slicingWallsBackGroup;a:{var P=a[0]&&a[0]._conf.index,l,m;f=P<=x;e=1;for(c=a.length;e<c;e+=1)if(m=a[e]._conf.index,l=m<=x,l!=f||m<P)break a;e=0}for(;b<d;b+=1,e+=1)e===d&&(e=0),c=a[e],f=c._conf.index,f<Wa?k.appendChild(c):f<=x?(h?c.insertBefore(h):k.appendChild(c),
h=c):f<Da?(t?c.insertBefore(t):r.appendChild(c),t=c):r.appendChild(c)}}(),updateSliceConf:function(a,b){var c=this.getArcPath,d=a.start,e=a.end,h=na(d),t=na(e),f,k,r,Q,l,m,n,g,y,u,z,w,R,B,D,A,O=this.cx,C=this.cy,G=this.rx,I=this.ry,L=G+(ma?-1:2),W=I+(ma?-1:2),H=this.innerRx,S=this.innerRy,U=this.depth,T=this.depthY,v=a.elements,ca,M,s,E,F,J,ja;f=P(h);k=Z(h);r=P(t);Q=Z(t);l=O+G*f;m=C+I*k;n=O+L*f;g=C+W*k;ca=m+U;M=O+G*r;s=C+I*Q;y=O+L*r;u=C+W*Q;E=s+U;this.isDoughnut?(z=O+H*f,w=C+S*k,D=w+U,R=O+H*r,B=C+
S*Q,A=B+U,a.startSlice=["M",l,m,"L",l,ca,z,D,z,w,"Z"],a.endSlice=["M",M,s,"L",M,E,R,A,R,B,"Z"]):(a.startSlice=["M",l,m,"L",l,ca,O,T,O,C,"Z"],a.endSlice=["M",M,s,"L",M,E,O,T,O,C,"Z"]);ma?(c=(h>t?X:0)+t-h,a.clipTopPath=this.isDoughnut?["M",l,m,"A",G,I,0,c>x?1:0,1,M,s,"L",R,B,"A",H,S,0,c>x?1:0,0,z,w,"Z"]:["M",l,m,"A",G,I,0,c>x?1:0,1,M,s,"L",this.cx,this.cy,"Z"],a.clipOuterFrontPath1=this.clipPathforNoClip,a.clipTopBorderPath=["M",n,g,"A",L,W,0,c>x?1:0,1,y,u,"L",M,s,M,s+1,"A",G,I,0,c>x?1:0,0,l,m+1,"L",
l,m,"Z"],d!=e?h>t?h<x?(a.clipOuterFrontPath=["M",this.rightX,C,"A",G,I,0,0,1,M,s,"v",U,"A",G,I,0,0,0,this.rightX,C+U,"Z"],a.clipOuterFrontPath1=["M",this.leftX,C,"A",G,I,0,0,0,l,m,"v",U,"A",G,I,0,0,1,this.leftX,C+U,"Z"],a.clipOuterBackPath=["M",this.rightX,C,"A",G,I,0,1,0,this.leftX,C,"v",U,"A",G,I,0,1,1,this.rightX,C+U,"Z"],this.isDoughnut&&(a.clipInnerBackPath=["M",this.rightInnerX,C,"A",H,S,0,1,0,this.leftInnerX,C,"v",U,"A",H,S,0,1,1,this.rightInnerX,C+U,"Z"],a.clipInnerFrontPath=["M",this.rightInnerX,
C,"A",H,S,0,0,1,R,B,"v",U,"A",H,S,0,0,0,this.rightInnerX,C+U,"Z","M",this.leftInnerX,C,"A",H,S,0,0,0,z,w,"v",U,"A",H,S,0,0,1,this.leftInnerX,C+U,"Z"])):t>x?(a.clipOuterFrontPath=["M",this.rightX,C,"A",G,I,0,1,1,this.leftX,C,"v",U,"A",G,I,0,1,0,this.rightX,C+U,"Z"],a.clipOuterBackPath=["M",this.leftX,C,"A",G,I,0,0,1,M,s,"v",U,"A",G,I,0,0,0,this.leftX,C+U,"Z","M",this.rightX,C,"A",G,I,0,0,0,l,m,"v",U,"A",G,I,0,0,1,this.rightX,C+U,"Z"],this.isDoughnut&&(a.clipInnerFrontPath=["M",this.rightInnerX,C,"A",
H,S,0,1,1,this.leftInnerX,C,"v",U,"A",H,S,0,1,0,this.rightInnerX,C+U,"Z"],a.clipInnerBackPath=["M",this.leftInnerX,C,"A",H,S,0,0,1,R,B,"v",U,"A",H,S,0,0,0,this.leftInnerX,C+U,"Z","M",this.rightInnerX,C,"A",H,S,0,0,0,z,w,"v",U,"A",H,S,0,0,1,this.rightInnerX,C+U,"Z"])):(a.clipOuterFrontPath=["M",this.rightX,C,"A",G,I,0,0,1,M,s,"v",U,"A",G,I,0,0,0,this.rightX,C+U,"Z"],a.clipOuterBackPath=["M",l,m,"A",G,I,0,0,1,this.rightX,C,"v",U,"A",G,I,0,0,0,l,ca,"Z"],this.isDoughnut&&(a.clipInnerFrontPath=["M",this.rightInnerX,
C,"A",H,S,0,0,1,R,B,"v",U,"A",H,S,0,0,0,this.rightInnerX,C+U,"Z"],a.clipInnerBackPath=["M",z,w,"A",H,S,0,0,1,this.rightInnerX,C,"v",U,"A",H,S,0,0,0,z,D,"Z"])):h<x?t>x?(a.clipOuterFrontPath=["M",l,m,"A",G,I,0,0,1,this.leftX,C,"v",U,"A",G,I,0,0,0,l,ca,"Z"],a.clipOuterBackPath=["M",this.leftX,C,"A",G,I,0,0,1,M,s,"v",U,"A",G,I,0,0,0,this.leftX,C+U,"Z"],this.isDoughnut&&(a.clipInnerFrontPath=["M",z,w,"A",H,S,0,0,1,this.leftInnerX,C,"v",U,"A",H,S,0,0,0,z,D,"Z"],a.clipInnerBackPath=["M",this.leftInnerX,
C,"A",H,S,0,0,1,R,B,"v",U,"A",H,S,0,0,0,this.leftInnerX,C+U,"Z"])):(a.clipOuterFrontPath=["M",l,m,"A",G,I,0,0,1,M,s,"v",U,"A",G,I,0,0,0,l,ca,"Z"],a.clipOuterBackPath=this.clipPathforNoClip,this.isDoughnut&&(a.clipInnerFrontPath=["M",z,w,"A",H,S,0,0,1,R,B,"v",U,"A",H,S,0,0,0,z,D,"Z"],a.clipInnerBackPath=this.clipPathforNoClip)):(a.clipOuterFrontPath=this.clipPathforNoClip,a.clipOuterBackPath=["M",l,m,"A",G,I,0,0,1,M,s,"v",U,"A",G,I,0,0,0,l,ca,"Z"],this.isDoughnut&&(a.clipInnerFrontPath=this.clipPathforNoClip,
a.clipInnerBackPath=["M",z,w,"A",H,S,0,0,1,R,B,"v",U,"A",H,S,0,0,0,z,D,"Z"])):a.clipOuterFrontPath=a.clipOuterBackPath=a.clipInnerBackPath=a.clipInnerFrontPath=this.clipPathforNoClip,b||(a.elements.startSlice._conf.index=h,a.elements.endSlice._conf.index=t,a.elements.frontOuter._conf.index=Ka(t,h),a.elements.frontOuter1&&(a.elements.frontOuter1._conf.index=h,a.elements.frontOuter1.attr("litepath",[a.clipOuterFrontPath1])),a.thisElement.attr("litepath",[a.clipTopPath]),a.elements.bottom.attr("litepath",
[a.clipTopPath]),a.elements.bottomBorder.attr("litepath",[a.clipTopPath]),a.elements.topBorder&&a.elements.topBorder.attr("litepath",[a.clipTopBorderPath]),a.elements.frontOuter.attr("litepath",[a.clipOuterFrontPath]),a.elements.backOuter.attr("litepath",[a.clipOuterBackPath]),this.isDoughnut&&(a.elements.backInner.attr("litepath",[a.clipInnerBackPath]),a.elements.frontInner.attr("litepath",[a.clipInnerFrontPath]),a.elements.backInner._conf.index=Ka(t,h)),this.hasOnePoint?(a.elements.startSlice.hide(),
a.elements.endSlice.hide()):(a.elements.startSlice.attr("litepath",[a.startSlice]).show(),a.elements.endSlice.attr("litepath",[a.endSlice]).show()))):(n=this.moveCmdArr,g=this.lineCmdArr,y=this.closeCmdArr,F=this.centerPoint,u=this.leftPoint,L=this.topPoint,W=this.rightPoint,U=this.bottomPoint,J=this.leftDepthPoint,ja=this.rightDepthPoint,f=this.leftInnerPoint,k=this.rightInnerPoint,r=this.leftInnerDepthPoint,Q=this.rightInnerDepthPoint,a.clipOuterFrontPath1=[],d!=e?(h>t?h<x?(d=c(O,C,l,m,this.leftX,
C,G,I,1,0),e=c(O,C,this.leftX,C,this.rightX,C,G,I,1,0),s=c(O,C,this.rightX,C,M,s,G,I,1,0),a.clipOuterBackPath=n.concat(u,e,g,ja,c(O,T,this.rightX,T,this.leftX,T,G,I,0,0),y),a.clipOuterFrontPath1=n.concat([l,m],d,g,J,c(O,T,this.leftX,T,l,ca,G,I,0,0),y),a.clipOuterFrontPath=n.concat(W,s,g,[M,E],c(O,T,M,E,this.rightX,T,G,I,0,0),y),a.clipTopBorderPath=n.concat([l,m],d,e,s),this.isDoughnut?(l=c(O,C,R,B,this.rightInnerX,C,H,S,0,0),m=c(O,C,this.rightInnerX,C,this.leftInnerX,C,H,S,0,0),w=c(O,C,this.leftInnerX,
C,z,w,H,S,0,0),a.clipInnerBackPath=n.concat(k,m,g,r,c(O,T,this.leftInnerX,T,this.rightInnerX,T,H,S,1,0),y),a.clipInnerFrontPath=n.concat(f,w,g,[z,D],c(O,T,z,D,this.leftInnerX,T,H,S,1,0),y,n,[R,B],l,g,Q,c(O,T,this.rightInnerX,T,R,A,H,S,1,0),y),a.clipTopPath=a.clipTopBorderPath.concat(g,[R,B],l,m,w,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(n,[R,B],l,m,w)):a.clipTopPath=a.clipTopBorderPath.concat(g,F,y)):t>x?(d=c(O,C,l,m,this.rightX,C,G,I,1,0),e=c(O,C,this.rightX,C,this.leftX,C,G,I,1,0),s=c(O,
C,this.leftX,C,M,s,G,I,1,0),a.clipOuterFrontPath=n.concat(W,e,g,J,c(O,T,this.leftX,T,this.rightX,T,G,I,0,0),y),a.clipOuterBackPath=n.concat([l,m],d,g,ja,c(O,T,this.rightX,T,l,ca,G,I,0,0),y,n,u,s,g,[M,E],c(O,T,M,E,this.leftX,T,G,I,0,0),y),a.clipTopBorderPath=n.concat([l,m],d,e,s),this.isDoughnut?(l=c(O,C,R,B,this.leftInnerX,C,H,S,0,0),m=c(O,C,this.leftInnerX,C,this.rightInnerX,C,H,S,0,0),w=c(O,C,this.rightInnerX,C,z,w,H,S,0,0),a.clipInnerFrontPath=n.concat(f,m,g,Q,c(O,T,this.rightInnerX,T,this.leftInnerX,
T,H,S,1,0),y),a.clipInnerBackPath=n.concat(k,w,g,[z,D],c(O,T,z,D,this.rightInnerX,T,H,S,1,0),y,n,[R,B],l,g,r,c(O,T,this.leftInnerX,T,R,A,H,S,1,0),y),a.clipTopPath=a.clipTopBorderPath.concat(g,[R,B],l,m,w,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(n,[R,B],l,m,w)):a.clipTopPath=a.clipTopBorderPath.concat(g,F,y)):(d=c(O,C,l,m,this.rightX,C,G,I,1,0),e=c(O,C,this.rightX,C,M,s,G,I,1,0),a.clipOuterFrontPath=n.concat(W,e,g,[M,E],c(O,T,M,E,this.rightX,T,G,I,0,0),y),a.clipOuterBackPath=n.concat([l,m],
d,g,ja,c(O,T,this.rightX,T,l,ca,G,I,0,0),y),a.clipTopBorderPath=n.concat([l,m],d,e),this.isDoughnut?(l=c(O,C,R,B,this.rightInnerX,C,H,S,0,0),m=c(O,C,this.rightInnerX,C,z,w,H,S,0,0),a.clipInnerFrontPath=n.concat([R,B],l,g,Q,c(O,T,this.rightInnerX,T,R,A,H,S,1,0),y),a.clipInnerBackPath=n.concat(k,m,g,[z,D],c(O,T,z,D,this.rightInnerX,T,H,S,1,0),y),a.clipTopPath=a.clipTopBorderPath.concat(g,[R,B],l,m,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(n,[R,B],l,m)):a.clipTopPath=a.clipTopBorderPath.concat(g,
F,y)):h<x?t>x?(d=c(O,C,l,m,this.leftX,C,G,I,1,0),e=c(O,C,this.leftX,C,M,s,G,I,1,0),a.clipOuterBackPath=n.concat(u,e,g,[M,E],c(O,T,M,E,this.leftX,T,G,I,0,0),y),a.clipOuterFrontPath=n.concat([l,m],d,g,J,c(O,T,this.leftX,T,l,ca,G,I,0,0),y),a.clipTopBorderPath=n.concat([l,m],d,e),this.isDoughnut?(l=c(O,C,R,B,this.leftInnerX,C,H,S,0,0),m=c(O,C,this.leftInnerX,C,z,w,H,S,0,0),a.clipInnerBackPath=n.concat([R,B],l,g,r,c(O,T,this.leftInnerX,T,R,A,H,S,1,0),y),a.clipInnerFrontPath=n.concat(f,m,g,[z,D],c(O,T,
z,D,this.leftInnerX,T,H,S,1,0),y),a.clipTopPath=a.clipTopBorderPath.concat(g,[R,B],l,m,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(n,[R,B],l,m)):a.clipTopPath=a.clipTopBorderPath.concat(g,F,y)):(d=c(O,C,l,m,M,s,G,I,1,0),a.clipOuterBackPath=n.concat([l,m]),a.clipTopBorderPath=a.clipOuterBackPath.concat(d),a.clipOuterFrontPath=a.clipTopBorderPath.concat(g,[M,E],c(O,T,M,E,l,ca,G,I,0,0),y),this.isDoughnut?(l=c(O,C,R,B,z,w,H,S,0,0),a.clipInnerBackPath=n.concat([R,B]),a.clipTopPath=a.clipTopBorderPath.concat(g,
[R,B],l,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(n,[R,B],l),a.clipInnerFrontPath=a.clipInnerBackPath.concat(l,g,[z,D],c(O,T,z,D,R,A,H,S,1,0),y)):a.clipTopPath=a.clipTopBorderPath.concat(g,F,y)):(d=c(O,C,l,m,M,s,G,I,1,0),a.clipOuterFrontPath=n.concat([l,m]),a.clipTopBorderPath=a.clipOuterFrontPath.concat(d),a.clipOuterBackPath=a.clipTopBorderPath.concat(g,[M,E],c(O,T,M,E,l,ca,G,I,0,0),y),this.isDoughnut?(l=c(O,C,R,B,z,w,H,S,0,0),a.clipInnerFrontPath=n.concat([R,B]),a.clipTopPath=a.clipTopBorderPath.concat(g,
[R,B],l,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(a.clipInnerFrontPath,l),a.clipInnerBackPath=a.clipInnerFrontPath.concat(l,g,[z,D],c(O,T,z,D,R,A,H,S,1,0),y)):a.clipTopPath=a.clipTopBorderPath.concat(g,F,y)),d=n.concat(u,g,W),l=n.concat(L,g,U),a.clipTopPath=a.clipTopPath.concat(d,l),a.clipOuterFrontPath=a.clipOuterFrontPath.concat(d),a.clipOuterFrontPath1=a.clipOuterFrontPath1.concat(d),a.clipOuterBackPath=a.clipOuterBackPath.concat(d),this.isDoughnut&&(l=n.concat(f,g,k),a.clipInnerFrontPath=
a.clipInnerFrontPath.concat(l),a.clipInnerBackPath=a.clipInnerBackPath.concat(l))):(a.clipTopPath=a.clipOuterFrontPath=a.clipOuterBackPath=[],this.isDoughnut&&(a.clipInnerFrontPath=a.clipInnerBackPath=[])),b||(a.elements.startSlice._conf.index=h,a.elements.endSlice._conf.index=t,a.elements.frontOuter._conf.index=Ka(t,h),a.elements.frontOuter1&&(a.elements.frontOuter1._conf.index=h,v.frontOuter1.attr({path:a.clipOuterFrontPath1})),a.thisElement.attr({path:a.clipTopPath}),v.topBorder.attr({path:a.clipTopBorderPath}),
v.bottom.attr({path:a.clipTopPath}),v.bottomBorder.attr({path:a.clipTopBorderPath}),v.frontOuter.attr({path:a.clipOuterFrontPath}),v.backOuter.attr({path:a.clipOuterBackPath}),this.isDoughnut&&(v.frontInner.attr({path:a.clipInnerFrontPath}),v.backInner.attr({path:a.clipInnerBackPath})),this.hasOnePoint?(a.elements.startSlice.hide(),a.elements.endSlice.hide()):(a.elements.startSlice.attr({path:a.startSlice}).show(),a.elements.endSlice.attr({path:a.endSlice}).show())))},onPlotHover:function(a,b){var c=
this.pointElemStore[a]._confObject,d=c.thisElement,e=c.elements,h=this.colorObjs[a],t=h.hoverProps,f=b?t.hoverColorObj:h.color,k=h.showBorderEffect,r=b?t.borderColor:h.borderColor,h=b?t.borderWidth:h.borderWidth;ma?(t={fill:Y(f.top),"stroke-width":0},1!==k&&(t.stroke=r,t["stroke-width"]=h),d._attr(t),k&&e.topBorder.attr({fill:Y(f.topBorder),"stroke-width":0})):(d._attr({fill:Y(f.top),"stroke-width":0}),e.topBorder.attr({stroke:r,"stroke-width":h}));e.bottom.attr({fill:Y(f.bottom),"stroke-width":0});
e.bottomBorder.attr({stroke:r,"stroke-width":h});e.frontOuter.attr({fill:Y(f.frontOuter),"stroke-width":0});e.backOuter.attr({fill:Y(f.backOuter),"stroke-width":0});e.startSlice.attr({fill:Y(f.startSlice),stroke:r,"stroke-width":h});e.endSlice.attr({fill:Y(f.endSlice),stroke:r,"stroke-width":h});d=na(c.start);c=na(c.end);(d>c?X:0)+c-d>x&&e.frontOuter1.attr({fill:Y(f.frontOuter),"stroke-width":0});this.isDoughnut&&(e.frontInner.attr({fill:Y(f.frontInner),"stroke-width":0}),e.backInner.attr({fill:Y(f.backInner),
"stroke-width":0}))},createSlice:function(){var a={stroke:!0,strokeWidth:!0,"stroke-width":!0,dashstyle:!0,"stroke-dasharray":!0,translateX:!0,translateY:!0,"stroke-opacity":!0,transform:!0,fill:!0,opacity:!0,ishot:!0,start:!0,end:!0,cursor:!0},b=function(b,c){var d,e,p=this,h=p._confObject,q,f=h.elements,k,m,n=h.Pie3DManager;"string"===typeof b&&void 0!==c&&null!==c&&(d=b,b={},b[d]=c);if(b&&"string"!==typeof b){void 0!==b.cx&&(b.start=b.cx);void 0!==b.cy&&(b.end=b.cy);for(d in b)if(e=b[d],a[d])if(h[d]=
e,"ishot"===d||"cursor"===d){q={};q[d]=e;for(k in f)f[k].attr(q);p._attr(q)}else if("transform"===d){for(k in f)f[k].attr({transform:b[d]});p._attr({transform:b[d]})}else"stroke"===d||"strokeWidth"===d||"stroke-width"===d||"dashstyle"===d||"stroke-dasharray"===d?(q={},q[d]=e,f.topBorder&&f.topBorder.attr(q),f.startSlice.attr(q),f.endSlice.attr(q),f.bottomBorder.attr(q)):"fill"===d||"start"!==d&&"end"!==d||(m=!0);else p._attr(d,e);m&&(n.updateSliceConf(h),n.refreshDrawing())}else p=p._attr(b);return p},
c=function(a,b,c,d){var e=this._confObject.elements,p;for(p in e)if(c)e[p].drag(b,c,d);else e[p].on(a,b);return c?this.drag(b,c,d):this._on(a,b)},d=function(){var a=this._confObject.elements,b;for(b in a)a[b].hide();return this._hide()},e=function(){var a=this._confObject.elements,b;for(b in a)a[b].show();return this._show()},h=function(){var a=this._confObject,b=a.elements,c;for(c in b)b[c].destroy();ma&&(a.clipTop.destroy(),a.clipOuterFront.destroy(),a.clipOuterBack.destroy(),a.clipOuterFront1&&
a.clipOuterFront1.destroy(),a.clipInnerFront&&a.clipInnerFront.destroy(),a.clipInnerBack&&a.clipInnerBack.destroy());return this._destroy()};return function(a,f,k,r,m,l,n,g,P,y){var Z=this.renderer;k=this.parseColor(k,r);a={start:a,end:f,elements:{},Pie3DManager:this};f=this.slicingWallsArr;r=a.elements;var z,w=ma?"litepath":"path";y&&(this.colorObjs[n]={color:k,borderColor:m,borderWidth:l,showBorderEffect:!1},y.hoverColorObj=this.parseColor(y.color,y.alpha),this.colorObjs[n].hoverProps=y);this.updateSliceConf(a,
!0);ma?(y={fill:Y(k.top),"stroke-width":0},1!==P&&(y.stroke=m,y["stroke-width"]=l),y=Z[w](a.clipTopPath,this.topGroup).attr(y),P&&(r.topBorder=Z[w](a.clipTopBorderPath,this.topGroup).attr({fill:Y(k.topBorder),"stroke-width":0}))):(y=Z[w](a.clipTopPath,this.topGroup).attr({fill:Y(k.top),"stroke-width":0}),r.topBorder=Z[w](a.clipTopBorderPath,this.topGroup).attr({stroke:m,"stroke-width":l}));r.bottom=Z[w](a.clipTopPath,this.bottomBorderGroup).attr({fill:Y(k.bottom),"stroke-width":0});r.bottomBorder=
Z[w](ma?a.clipTopPath:a.clipTopBorderPath,this.bottomBorderGroup).attr({stroke:m,"stroke-width":l});r.frontOuter=Z[w](a.clipOuterFrontPath,this.slicingWallsFrontGroup).attr({fill:Y(k.frontOuter),"stroke-width":0});r.backOuter=Z[w](a.clipOuterBackPath,this.outerBackGroup).attr({fill:Y(k.backOuter),"stroke-width":0});r.startSlice=Z[w](a.startSlice,this.slicingWallsFrontGroup).attr({fill:Y(k.startSlice),stroke:m,"stroke-width":l});r.endSlice=Z[w](a.endSlice,this.slicingWallsFrontGroup).attr({fill:Y(k.endSlice),
stroke:m,"stroke-width":l});m=na(a.start);l=na(a.end);P=(m>l?X:0)+l-m;P>x&&(r.frontOuter1=Z[w](a.clipOuterFrontPath1,this.slicingWallsFrontGroup).attr({fill:Y(k.frontOuter),"stroke-width":0}),r.frontOuter1._conf={index:m,isStart:.5,pIndex:n},ma&&(a.clipOuterFront1=a.clipOuterFrontPath1));r.frontOuter._conf={index:Ka(l,m),isStart:.5,pIndex:n};r.startSlice._conf={index:m,isStart:0,pIndex:n};r.endSlice._conf={index:l,isStart:1,pIndex:n};this.hasOnePoint&&(r.startSlice.hide(),r.endSlice.hide());this.isDoughnut?
(r.frontInner=Z[w](a.clipInnerFrontPath,this.innerFrontGroup).attr({fill:Y(k.frontInner),"stroke-width":0}),r.backInner=Z[w](a.clipInnerBackPath,this.innerBackGroup).attr({fill:Y(k.backInner),"stroke-width":0}),r.backInner._conf={index:Ka(l,m),isStart:.5,pIndex:n},P>x?ma?f.push(r.startSlice,r.frontOuter1,r.frontOuter,r.backInner,r.endSlice):f.push(r.startSlice,r.frontOuter1,r.frontOuter,r.endSlice):ma?f.push(r.startSlice,r.frontOuter,r.backInner,r.endSlice):f.push(r.startSlice,r.frontOuter,r.endSlice)):
P>x?f.push(r.startSlice,r.frontOuter1,r.frontOuter,r.endSlice):f.push(r.startSlice,r.frontOuter,r.endSlice);if(void 0!==g){for(z in r)r[z].tooltip(g);y.tooltip(g)}ma&&(a.clipTop=a.clipTopPath,a.clipOuterFront=a.clipOuterFrontPath,a.clipOuterBack=a.clipOuterBackPath,this.isDoughnut&&(a.clipInnerFront=a.clipInnerFrontPath,a.clipInnerBack=a.clipInnerBackPath));y._confObject=a;a.thisElement=y;y._destroy=y.destroy;y.destroy=h;y._show=y.show;y.show=e;y._hide=y.hide;y.hide=d;y._on=y.on;y.on=c;y._attr=y.attr;
y.attr=b;this.pointElemStore.push(y);return y}}()};La.prototype.constructor=La;n("renderer.pie3d",{type:"pie3d",isHovered:!1,translate:function(){var a=0,b=this.options,c=b.series[0],d=b.plotOptions.series.dataLabels,e=b.plotOptions.pie3d,h=g(c.startAngle,0)%360,m=c.managedPieSliceDepth,n=c.slicedOffset=e.slicedOffset,x=this.canvasWidth,r=this.canvasHeight,Q=[this.canvasLeft+.5*x,this.canvasTop+.5*r-.5*m],l,D,s,A,y,b=c.data,ca,z=ja(x,r),v,R,B,L=d.distance,V=c.pieYScale,O=c.pieSliceDepth,C=c.slicedOffsetY=
n*V;Q.push(e.size,e.innerSize||0);Q=oa(Q,function(a,b){return(v=/%$/.test(a))?[x,r-m,z,z][b]*parseInt(a,10)/100:a});Q[2]/=2;Q[3]/=2;Q.push(Q[2]*V);Q.push((Q[2]+Q[3])/2);Q.push(Q[5]*V);c.getX=function(a,b){s=f.asin((a-Q[1])/(Q[2]+L));return Q[0]+(b?-1:1)*P(s)*(Q[2]+L)};c.center=Q;va(b,function(b){a+=b.y});c.labelsRadius=Q[2]+L;c.labelsRadiusY=c.labelsRadius*V;c.quadrantHeight=(r-m)/2;c.quadrantWidth=x/2;A=-h*N;A=w(1E3*A)/1E3;y=A+X;e=k(parseInt(d.style.fontSize,10),10)+4;c.maxLabels=u(c.quadrantHeight/
e);c.labelFontSize=e;c.connectorPadding=k(d.connectorPadding,5);c.isSmartLineSlanted=g(d.isSmartLineSlanted,!0);c.connectorWidth=k(d.connectorWidth,1);c.enableSmartLabels=d.enableSmartLabels;c.Pie3DManager||(c.Pie3DManager=new La(Q[0],Q[1],Q[2],Q[3],V,O,this.layers.dataset,this.paper,1===c.data.length,c.use3DLighting));va(b,function(b){l=A;ca=a?b.y/a:0;A=w(1E3*(A+ca*X))/1E3;A>y&&(A=y);D=A;b.shapeArgs={start:w(1E3*l)/1E3,end:w(1E3*D)/1E3};b.centerAngle=s=(D+l)/2%X;b.slicedTranslation=[w(P(s)*n),w(Z(s)*
C)];R=P(s)*Q[2];c.radiusY=B=Z(s)*Q[4];b.tooltipPos=[Q[0]+.7*R,Q[1]+B];b.percentage=100*ca;b.total=a})},drawPlotPie3d:function(a,b){this.translate();var c=this,d=a.items,e=a.data,h=c.options,f=h.plotOptions,m=f.series,n=c.layers,r=c.elements.plots[0],g=c.datasets[0],f=f.series.dataLabels,l=m.dataLabels.style,m=k(a.moveDuration,m.animation.duration),w=c.paper,x=h.tooltip||{},x=x&&!1!==x.enabled,u=g.slicedOffset,y=g.slicedOffsetY,D=c.plotGraphicClick,z=c.plotDragMove,s=c.plotDragStart,A=c.plotDragEnd,
B=c.plotMouseDown,ca=c.plotMouseUp,L=c.plotRollOver,O=c.plotRollOut,C=!!c.datasets[0].enableRotation,G=b.showBorderEffect,I=e.length,h=h.chart.usePerPointLabelColor,v={fontFamily:l.fontFamily,fontSize:l.fontSize,lineHeight:l.lineHeight,fontWeight:l.fontWeight,fontStyle:l.fontStyle},ja=function(a){return function(){c.legendClick(a,!0,!1)}},H=function(a){return function(){return c.getEventArgs(a)}},S=function(a){return function(b,c,d,e,p){z.call(a,b,c,d,e,p)}},U=function(a){return function(b,c,d){s.call(a,
b,c,d)}},T=function(a){return function(){A.call(a)}},X=function(a){return function(){B.call(a)}},V=function(a){return function(b){ca.call(a,b)}},M=function(a){return function(b){O.call(a,b)}},N=function(a){return function(b){L.call(a,b)}},E,F,J,ha,ba,$,K,ka,ea,aa;e&&I||(e=[]);r.singletonCase=1===I;r.chartPosition=Aa(c.container);r.pieCenter=g.center;r.timerThreshold=30;for(aa=-1;++aa<I;)J=e[aa],l=J.y,ha=J.displayValue,v=J.sliced,ka=J.shapeArgs,E=J.centerAngle,ea=J.toolText,$=(ba=!!J.link)||C||!J.doNotSlice,
null===l||void 0===l||(F=d[aa])||(b.data[aa].plot=F=d[aa]={chart:c,index:aa,seriesData:r,value:l,angle:E,link:J.link,shapeArgs:ka,slicedX:v&&!r.singletonCase?P(E)*u:0,slicedY:v&&!r.singletonCase?Z(E)*y:0,sliced:v,labelText:ha,name:J.name,label:J.name,percentage:J.percentage,toolText:ea,originalIndex:I-aa-1,style:J.style,graphic:g.Pie3DManager.createSlice(ka.start,ka.end,J.color,J._3dAlpha,J.borderColor,J.borderWidth,aa,x?ea:"",G,J.rolloverProperties)},b.data[aa].legendClick=ja(F),b.data[aa].getEventArgs=
H(F),F.graphic.plotItem=F,F.graphic.data("plotItem",F),F.transX=P(E)*u,F.transY=Z(E)*y,F.slicedTranslation="t"+F.transX+","+F.transY,E={index:b.reversePlotOrder?aa:I-1-aa,link:J.link,value:J.y,displayValue:J.displayValue,categoryLabel:J.categoryLabel,isSliced:J.sliced,toolText:J.toolText},F.graphic.attr({transform:"t"+F.slicedX+","+F.slicedY,ishot:$,cursor:ba?"pointer":""}).click(D).drag(S(F),U(F),T(F)).mousedown(X(F.graphic)).mouseup(V(F.graphic)).data("groupId",aa).data("eventArgs",E).mouseover(N(F)).mouseout(M(F)),
void 0!==ha&&(l=J.style,v={fontFamily:l.fontFamily,fontSize:l.fontSize,lineHeight:l.lineHeight,fontWeight:l.fontWeight,fontStyle:l.fontStyle},F.dataLabel=w.text(n.dataset).css(v).attr({text:ha,title:J.originalText||"",fill:(h?Y(J.color):l.color)||"#000000","text-bound":[l.backgroundColor,l.borderColor,l.borderThickness,l.borderPadding,l.borderRadius,l.borderDash],visibility:"hidden",ishot:$,cursor:ba?"pointer":""}).data("eventArgs",E).hover(N(F),M(F)).click(D).mousedown(B,F.dataLabel).mouseup(ca,
F.dataLabel).data("plotItem",F),0<f.distance&&(K=f.connectorWidth)&&f.enableSmartLabels&&(F.connector=w.path("M 0 0 l 0 0",n.dataset).attr({"stroke-width":K,stroke:f.connectorColor||"#606060",visibility:"hidden",ishot:$,cursor:ba?"pointer":""}).data("eventArgs",E).click(D).hover(N(F),M(F)).mousedown(B,F.connector).mouseup(ca,F.connector).data("plotItem",F))));g.Pie3DManager.refreshDrawing();0<m?c.animate(d,m):c.placeDataLabels(!1,d)},rotate:function(a){var b=this.datasets[0],c=this.elements.plots[0].items,
d=b.slicedOffset,e=b.slicedOffsetY,h=b.startAngle,f;a=isNaN(a)?-b._lastAngle:a;f=(a-h)%360;b.startAngle=k(a,b.startAngle)%360;f=-(f*A)/180;b.Pie3DManager&&b.Pie3DManager.rotate(f);va(c,function(a){var b=a.graphic,c=a.shapeArgs,p=c.start+=f,c=c.end+=f,h=a.angle=na((p+c)/2),p=a.sliced,c=P(h),h=Z(h);a.slicedTranslation=[w(c*d),w(h*e)];a.transX=a.slicedTranslation[0];a.transY=a.slicedTranslation[1];a.slicedX=p?P(f)*d:0;a.slicedY=p?Z(f)*e:0;b&&p&&a.graphic.attr({transform:"t"+a.slicedTranslation[0]+","+
a.slicedTranslation[1]})});this.placeDataLabels(!0,c)},plotRollOver:function(a){var b=this.chart,c=b.datasets[0].Pie3DManager;this.seriesData.isRotating||(sa.call(this.graphic,b,a,"DataPlotRollOver"),c.colorObjs[this.index]&&c.onPlotHover(this.index,!0));b.isHovered=!0},plotRollOut:function(a){var b=this.chart,c=b.datasets[0].Pie3DManager;this.seriesData.isRotating||(sa.call(this.graphic,b,a,"DataPlotRollOut"),c.colorObjs[this.index]&&c.onPlotHover(this.index,!1));b.isHovered=!1},plotDragStart:function(a,
b,c){var d=this.seriesData,e=this.chart.datasets[0];e.enableRotation&&(a=Na.call(c,a,b,d.pieCenter,d.chartPosition,e.pieYScale),e.dragStartAngle=a,e._lastAngle=-e.startAngle,e.startingAngleOnDragStart=e.startAngle)},plotDragEnd:function(){var a=this.chart,b=a.datasets[0],c=b.Pie3DManager,d=b.startAngle,e=this.seriesData,h={hcJSON:{series:[{startAngle:d}]}};a.disposed||ya(a.logic.chartInstance.jsVars._reflowData,h,!0);e.isRotating&&(setTimeout(function(){e.isRotating=!1},0),pa.raiseEvent("rotationEnd",
{startingAngle:na(d,!0),changeInAngle:d-b.startingAngleOnDragStart},a.logic.chartInstance),!a.isHovered&&c.colorObjs[this.index]&&c.onPlotHover(this.index,!1))},plotDragMove:function(a,b,c,d,e){var h=this.chart;a=h.datasets[0];b=this.seriesData;h.options.series[0].enableRotation&&!b.singletonCase&&(b.isRotating||(b.isRotating=!0,pa.raiseEvent("rotationStart",{startingAngle:na(a.startAngle,!0)},h.logic.chartInstance)),c=Na.call(e,c,d,b.pieCenter,b.chartPosition,a.pieYScale),d=c-a.dragStartAngle,a.dragStartAngle=
c,b.moveDuration=0,a._lastAngle+=180*d/A,c=(new Date).getTime(),!a._lastTime||a._lastTime+b.timerThreshold<c)&&(a._lastTime||h.rotate(),b.timerId=setTimeout(function(){h.disposed&&h.disposing||h.rotate()},b.timerThreshold),a._lastTime=c)},animate:function(a,b){var c,d,e,h=a.length,f,m,k,n=this,g,l=function(){n.disposed||n.disposing||n.placeDataLabels(!1,a)};if(n.datasets[0].alphaAnimation)n.layers.dataset.attr({opacity:0}),n.layers.dataset.animate({opacity:1},b,"ease-in",function(){n.disposed||n.disposing||
n.placeDataLabels(!1,a)});else for(c=0;c<h;c++)f=a[c],m=f.graphic,k=f.shapeArgs,f=2*A,m&&(m.attr({start:f,end:f}),g=k.start,k=k.end,d?m.animateWith(d,e,{cx:g-f,cy:k-f},b,"ease-in"):(e=ia.animation({cx:g-f,cy:k-f},b,"ease-in",l),d=m.animate(e)))},placeDataLabels:function(){var a=function(a,b){return a.point.value-b.point.value},b=function(a,b){return a.angle-b.angle},c=["start","start","end","end"],d=[-1,1,1,-1],e=[1,1,-1,-1];return function(n,g){var u=this.datasets[0],s=this.smartLabel,r=this.options.plotOptions.series.dataLabels,
Q=r.style,l=k(D(parseFloat(Q.lineHeight)),12),A=Fa(r.placeInside,!1),ca=r.skipOverlapLabels,v=r.manageLabelOverflow,y=r.connectorPadding,V=r.connectorWidth,z,N,R=0<r.distance,B=u.center,Y=B[1],ha=B[0],O=B[2],C=B[4],G=[[],[],[],[]],I,ba,W,H=this.canvasLeft,S=this.canvasTop,U=this.canvasWidth,T,$,aa,M,ka,E,F,J,K,ea,fa,na=u.labelsRadius,ia=w(100*u.labelsRadiusY)/100,la=u.labelFontSize,ga=la,ma=ga/2,y=[y,y,-y,-y],pa=u.maxLabels,oa=u.isSmartLineSlanted,Ia=u.enableSmartLabels,xa,u=u.pieSliceDepth/2;n||
s.setStyle(Q);if(1==g.length)M=g[0],xa=M.dataLabel,M.slicedTranslation=[H,S],xa&&(xa.attr({visibility:h,"text-anchor":"middle",x:ha,y:Y+ma-2}),xa.x=ha);else if(A)va(g,function(a){if(xa=a.dataLabel){fa=a.angle;ea=Y+B[6]*Z(fa)+ma-2;F=ha+B[5]*P(fa);xa.x=F;xa._x=F;xa.y=ea;if(a.sliced){a=a.slicedTranslation;var b=a[1]-S;F+=a[0]-H;ea+=b}xa.attr({visibility:h,align:"middle",x:F,y:ea})}});else{va(g,function(a){if(xa=a.dataLabel)fa=a.angle,0>fa&&(fa=X+fa),I=0<=fa&&fa<Wa?1:fa<x?2:fa<Da?3:0,G[I].push({point:a,
angle:fa})});for(W=A=4;W--;){if(ca&&(M=G[W].length-pa,0<M))for(G[W].sort(a),ba=G[W].splice(0,M),$=0,aa=ba.length;$<aa;$+=1)M=ba[$].point,M.dataLabel.attr({visibility:"hidden"}),M.connector&&M.connector.attr({visibility:"hidden"});G[W].sort(b)}W=m(G[0].length,G[1].length,G[2].length,G[3].length);ia=m(ja(W,pa)*ga,ia+ga);G[1].reverse();G[3].reverse();for(s.setStyle(Q);A--;){$=G[A];aa=$.length;ca||(ga=aa>pa?ia/aa:la,ma=ga/2);M=aa*ga;Q=ia;for(W=0;W<aa;W+=1,M-=ga)N=L(ia*Z($[W].angle)),Q<N?N=Q:N<M&&(N=M),
Q=($[W].oriY=N)-ga;ba=c[A];aa=ia-(aa-1)*ga;Q=0;for(W=$.length-1;0<=W;W-=1,aa+=ga)M=$[W].point,fa=$[W].angle,ka=M.sliced,xa=M.dataLabel,N=L(ia*Z(fa)),N<Q?N=Q:N>aa&&(N=aa),Q=N+ga,J=(N+$[W].oriY)/2,N=ha+e[A]*na*P(f.asin(J/ia)),J*=d[A],J+=Y,K=Y+C*Z(fa),E=ha+O*P(fa),(2>A&&N<E||1<A&&N>E)&&(N=E),F=N+y[A],ea=J+ma-2,z=F+y[A],xa.x=z,xa._x=z,v&&(T=1<A?z-this.canvasLeft:this.canvasLeft+U-z,s.setStyle(M.style),l=k(D(parseFloat(M.style.lineHeight)),12)+2*D(parseFloat(M.style.border),12),l=s.getSmartText(M.labelText,
T,l),xa.attr({text:l.text,title:l.tooltext||""})),fa<x&&(J+=u,K+=u,ea+=u),xa.y=ea,ka&&(l=M.transX,ka=M.transY,F+=l,N+=l,E+=l,K+=ka,z+=l),xa.attr({visibility:h,"text-anchor":ba,x:z,y:J}),R&&V&&Ia&&(z=M.connector,M.connectorPath=N=["M",E,K,"L",oa?N:E,J,F,J],z?(z.attr({path:N}),z.attr("visibility",h)):M.connector=z=this.paper.path(N).attr({"stroke-width":V,stroke:r.connectorColor||"#606060",visibility:h}))}}}}()},n["renderer.piebase"]);n("renderer.pie",{drawDoughnutCenterLabel:function(a,b,c,d,e,f,k){var m=
this.options.series[0];f=f||m.lastCenterLabelConfig;var n=this.paper,g=this.smartLabel,P=this.layers.dataset,l=this.elements,Z=f.padding,x=2*f.textPadding,w={fontFamily:f.font,fontSize:f.fontSize+"px",lineHeight:1.2*f.fontSize+"px",fontWeight:f.bold?"bold":"",fontStyle:f.italic?"italic":""},y=1.414*(.5*d-Z)-x;e=1.414*(.5*e-Z)-x;var u;g.setStyle(w);g=g.getSmartText(a,y,e);(e=l.doughnutCenterLabel)?(e.attr("text")!==a&&this.centerLabelChange(a),u=l.centerLabelOvalBg):(f.bgOval&&(l.centerLabelOvalBg=
u=n.circle(b,c,.5*d-Z,P)),e=l.doughnutCenterLabel=n.text(P).hover(this.centerLabelRollover,this.centerLabelRollout).click(this.centerLabelClick),e.chart=this);a?(e.css(w).attr({x:b,y:c,text:g.text,visibility:h,title:f.toolText?"":g.tooltext||"",fill:Y({FCcolor:{color:f.color,alpha:f.alpha}}),"text-bound":f.bgOval?"none":[Y({FCcolor:{color:f.bgColor,alpha:f.bgAlpha}}),Y({FCcolor:{color:f.borderColor,alpha:f.borderAlpha}}),f.borderThickness,f.textPadding,f.borderRadius]}).tooltip(f.toolText),f.bgOval&&
u&&u.attr({visibility:h,fill:Ya(f.bgColor),"fill-opacity":f.bgAlpha/100,stroke:Ya(f.borderColor),"stroke-width":f.borderThickness,"stroke-opacity":f.borderAlpha/100})):(e.attr("visibility","hidden"),u&&u.attr("visibility","hidden"));k&&(m.lastCenterLabelConfig=f)},centerLabelRollover:function(){var a=this.chart,b=a.fusionCharts,c=a.options.series[0].lastCenterLabelConfig,b={height:b.args.height,width:b.args.width,pixelHeight:b.ref.offsetHeight,pixelWidth:b.ref.offsetWidth,id:b.args.id,renderer:b.args.renderer,
container:b.options.containerElement,centerLabelText:c&&c.label};this.attr("text")&&pa.raiseEvent("centerLabelRollover",b,a.logic.chartInstance,this,a.hoverOnCenterLabel)},centerLabelRollout:function(){var a=this.chart,b=a.fusionCharts,c=a.options.series[0].lastCenterLabelConfig,b={height:b.args.height,width:b.args.width,pixelHeight:b.ref.offsetHeight,pixelWidth:b.ref.offsetWidth,id:b.args.id,renderer:b.args.renderer,container:b.options.containerElement,centerLabelText:c&&c.label};this.attr("text")&&
pa.raiseEvent("centerLabelRollout",b,a.logic.chartInstance,this,a.hoverOffCenterLabel)},centerLabelClick:function(){var a=this.chart,b=a.fusionCharts,c=a.options.series[0].lastCenterLabelConfig,b={height:b.args.height,width:b.args.width,pixelHeight:b.ref.offsetHeight,pixelWidth:b.ref.offsetWidth,id:b.args.id,renderer:b.args.renderer,container:b.options.containerElement,centerLabelText:c&&c.label};this.attr("text")&&pa.raiseEvent("centerLabelClick",b,a.logic.chartInstance)},centerLabelChange:function(a){var b=
this.fusionCharts;pa.raiseEvent("centerLabelChanged",{height:b.args.height,width:b.args.width,pixelHeight:b.ref.offsetHeight,pixelWidth:b.ref.offsetWidth,id:b.args.id,renderer:b.args.renderer,container:b.options.containerElement,centerLabelText:a},this.logic.chartInstance)},hoverOnCenterLabel:function(){var a=this.chart.options.series[0].lastCenterLabelConfig;(a.hoverColor||a.hoverAlpha)&&this.attr({fill:Y({FCcolor:{color:a.hoverColor||a.color,alpha:a.hoverAlpha||a.alpha}})})},hoverOffCenterLabel:function(){var a=
this.chart.options.series[0].lastCenterLabelConfig;(a.hoverColor||a.hoverAlpha)&&this.attr({fill:Y({FCcolor:{color:a.color,alpha:a.alpha}})})},drawPlotPie:function(a,b){var c=this,d=a.items,e=a.data,f=c.options,m=f.series[0],n=f.plotOptions,g=n.pie,r=n.series,w=c.layers,l=w.dataset,u=c.elements.plots[0],n=n.series.dataLabels,A=r.dataLabels.style,s=r.shadow,r=k(a.moveDuration,r.animation.duration),y=c.paper,D=f.tooltip||{},D=D&&!1!==D.enabled,z=((b.startAngle*=-x/180)||0)%X,ca=g.slicedOffset,v=b.valueTotal,
B=X/v,L=c.canvasLeft+.5*c.canvasWidth,N=c.canvasTop+.5*c.canvasHeight,O=.5*g.size,g=.5*(g.innerSize||0),C=c.plotGraphicClick,G=c.plotDragMove,I=c.plotDragStart,ja=c.plotDragEnd,W=c.plotMouseDown,H=c.plotMouseUp,S=c.plotRollOver,U=c.plotRollOut,T=!!c.datasets[0].enableRotation,V=e.length,f=f.chart.usePerPointLabelColor,ha=m.centerLabelConfig,M=ha.label,$={fontFamily:A.fontFamily,fontSize:A.fontSize,lineHeight:A.lineHeight,fontWeight:A.fontWeight,fontStyle:A.fontStyle},E,F,J,aa,ba,ea,K,ka,fa,ga,na=
a.shadowGroup,la,ma,Da,pa,oa,Ia=function(a){return function(){c.legendClick(a,!0,!1)}},ra=function(a){return function(){return c.getEventArgs(a)}},Ma=function(){c.disposed||c.disposing||c.paper.ca.redrawDataLabels||(c.placeDataLabels(!1,d,a),c.paper.ca.redrawDataLabels=c.redrawDataLabels)};e&&V||(e=[]);na||(na=a.shadowGroup=y.group(l).toBack());u.singletonCase=1===V;u.chartPosition||(u.chartPosition=Aa(c.container));u.pieCenter=[L,N];u.timerThreshold=30;fa=ka=z;for(la=V;la--;)F=e[la],$=F.y,J=F.displayValue,
ba=F.sliced,A=F.toolText,ea=(aa=!!F.link)||T||!F.doNotSlice,null!==$&&void 0!==$&&(E=F.color.FCcolor,E.r=O,E.cx=L,E.cy=N,F.rolloverProperties&&(E=F.rolloverProperties.color.FCcolor,E.r=O,E.cx=L,E.cy=N),fa=ka,ka-=u.singletonCase?X:$*B,K=.5*(ka+fa),r?pa=oa=z:(pa=ka,oa=fa),(E=d[la])||(b.data[la].plot=E=d[la]={chart:c,index:la,seriesData:u,value:$,angle:K,slicedX:P(K)*ca,slicedY:Z(K)*ca,sliced:ba,labelText:J,toolText:A,label:F.name,link:F.link,percentage:v?$*v/100:0,originalIndex:V-la-1,style:F.style,
color:F.color,borderColor:F.borderColor,borderWidth:F.borderWidth,rolloverProperties:F.rolloverProperties,center:[L,N],innerDiameter:2*g,centerLabelConfig:F.centerLabelConfig,graphic:y.ringpath(L,N,O,g,pa,oa,w.dataset).attr({"stroke-width":F.borderWidth,"stroke-linejoin":"round",stroke:F.borderColor,fill:Y(F.color),"stroke-dasharray":F.dashStyle,redrawDataLabels:z,ishot:ea,cursor:aa?"pointer":""}).shadow(s&&F.shadow,na).drag(G,I,ja).mousedown(W).mouseup(H).hover(S,U)},E.graphic.click(C),D&&E.graphic.tooltip(A),
b.data[la].legendClick=Ia(E),b.data[la].getEventArgs=ra(E),E.graphic.data("plotItem",E),aa={index:b.reversePlotOrder?la:V-1-la,link:F.link,value:F.y,displayValue:F.displayValue,categoryLabel:F.categoryLabel,isSliced:F.sliced,toolText:F.toolText},E.graphic.data("eventArgs",aa),void 0!==J&&(A=F.style,$={fontFamily:A.fontFamily,fontSize:A.fontSize,lineHeight:A.lineHeight,fontWeight:A.fontWeight,fontStyle:A.fontStyle},E.dataLabel=y.text(l).css($).attr({text:J,fill:(f?Y(F.color):A.color)||"#000000","text-bound":[A.backgroundColor,
A.borderColor,A.borderThickness,A.borderPadding,A.borderRadius,A.borderDash],ishot:ea,visibility:"hidden"}).click(C).drag(G,I,ja).mousedown(W).mouseup(H).hover(S,U).data("eventArgs",aa).hide(),E.dataLabel.data("plotItem",E),0<n.distance&&(ga=n.connectorWidth)&&n.enableSmartLabels&&(E.connector=y.path("M 0 0 l 0 0",l).attr({"stroke-width":ga,stroke:n.connectorColor||"#606060",visibility:h,ishot:!0}).click(C).data("eventArgs",aa).drag(G,I,ja).mousedown(W).mouseup(H).hover(S,U),E.connector.data("plotItem",
E)))),E.angle=K,E.transX=P(K)*ca,E.transY=Z(K)*ca,E.slicedTranslation="t"+P(K)*ca+","+Z(K)*ca,r?ma?E.graphic.animateWith(ma,Da,{ringpath:[L,N,O,g,ka,fa],transform:E.sliced?E.slicedTranslation:""},r,"easeIn"):(Da=ia.animation({ringpath:[L,N,O,g,ka,fa],redrawDataLabels:c,transform:E.sliced?E.slicedTranslation:""},r,"easeIn",Ma),ma=E.graphic.animate(Da)):E.graphic.attr({transform:E.sliced?E.slicedTranslation:""}));M&&g&&c.drawDoughnutCenterLabel(M,L,N,2*g,2*g,ha,!0);m.lastCenterLabelConfig=ha;r?m.doughnutCenterLabel&&
m.doughnutCenterLabel.attr({"fill-opacity":0}).animate(ia.animation({"fill-opacity":100},100).delay(100<r?r-100:0)):c.placeDataLabels(!1,d,a)},rotate:function(a,b){var c=a.items,d=a.data,e=this.options.plotOptions.pie,f=e.slicedOffset,h=X/b.valueTotal,m=this.canvasLeft+.5*this.canvasWidth,k=this.canvasTop+.5*this.canvasHeight,n=.5*e.size,e=.5*(e.innerSize||0),g,l,u,w,x;u=(b.startAngle||0)%X;for(x=d.length;x--;)g=d[x],l=g.y,null!==l&&void 0!==l&&(g=c[x],w=u,u-=g.seriesData.singletonCase?X:l*h,l=.5*
(u+w),g.angle=l,g.transX=P(l)*f,g.transY=Z(l)*f,g.slicedTranslation="t"+P(l)*f+","+Z(l)*f,g.graphic.attr({ringpath:[m,k,n,e,u,w],transform:g.sliced?g.slicedTranslation:""}));this.placeDataLabels(!0,c,a)}},n["renderer.piebase"])},[3,2,2,"sr4"]]);
FusionCharts.register("module",["private","modules.renderer.js-zoomline",function(){var Aa=this,oa=Aa.hcLib,na=Aa.window,Ka=/msie/i.test(na.navigator.userAgent)&&!na.opera,Na=oa.chartAPI,La=oa.chartAPI,pa=oa.extend2,v=oa.raiseEvent,ia=oa.pluck,s=oa.pluckNumber,Ha=oa.getFirstColor,K=oa.graphics.convertColor,Ua=oa.bindSelectionEvent,g=oa.createTrendLine,ta=oa.parseUnsafeString,Ea=oa.regescape,k=oa.Raphael,Fa=oa.hasTouch,Va=oa.getMouseCoordinate,ga=oa.FC_CONFIG_STRING,ua="rgba(192,192,192,"+(Ka?.002:
1E-6)+")",ya=na.Math,Ba=ya.ceil,Y=ya.floor,Oa=ya.max,Sa=ya.min,ma=ya.cos,va=ya.sin,Ca=na.parseFloat,Pa=na.parseInt,sa;pa(oa.eventList,{zoomed:"FC_Zoomed",pinned:"FC_Pinned",resetzoomchart:"FC_ResetZoomChart"});Na("zoomline",{friendlyName:"Zoomable and Panable Multi-series Line Chart",rendererId:"zoomline",standaloneInit:!0,hasVDivLine:!0,defaultSeriesType:"stepzoom",canvasborderthickness:1,defaultPlotShadow:1,chart:function(){var b=this.base.chart.apply(this,arguments),e=b[ga],h=this.dataObj.chart,
f=this.colorManager.getColor("canvasBorderColor");pa(b.chart,{animation:!1,zoomType:"x",canvasPadding:s(h.canvaspadding,0),scrollColor:Ha(ia(h.scrollcolor,this.colorManager.getColor("altHGridColor"))),scrollShowButtons:!!s(h.scrollshowbuttons,1),scrollHeight:s(h.scrollheight,16)||16,scrollBarFlat:e.flatScrollBars,allowPinMode:s(h.allowpinmode,1),skipOverlapPoints:s(h.skipoverlappoints,1),showToolBarButtonTooltext:s(h.showtoolbarbuttontooltext,1),btnResetChartTooltext:ia(h.btnresetcharttooltext,"Reset Chart"),
btnZoomOutTooltext:ia(h.btnzoomouttooltext,"Zoom out one level"),btnSwitchToZoomModeTooltext:ia(h.btnswitchtozoommodetooltext,"<strong>Switch to Zoom Mode</strong><br/>Select a subset of data to zoom into it for detailed view"),btnSwitchToPinModeTooltext:ia(h.btnswitchtopinmodetooltext,"<strong>Switch to Pin Mode</strong><br/>Select a subset of data and compare with the rest of the view"),pinPaneFill:K(ia(h.pinpanebgcolor,f),s(h.pinpanebgalpha,15)),zoomPaneFill:K(ia(h.zoompanebgcolor,"#b9d5f1"),s(h.zoompanebgalpha,
30)),zoomPaneStroke:K(ia(h.zoompanebordercolor,"#3399ff"),s(h.zoompaneborderalpha,80)),crossline:{enabled:s(h.showcrossline,1),line:{"stroke-width":s(h.crosslinethickness,1),stroke:Ha(ia(h.crosslinecolor,"#000000")),"stroke-opacity":s(h.crosslinealpha,20)/100},labelEnabled:s(h.showcrosslinelabel,h.showcrossline,1),labelstyle:{fontSize:Ca(h.crosslinelabelsize)?Ca(h.crosslinelabelsize)+"px":e.outCanvasStyle.fontSize,fontFamily:ia(h.crosslinelabelfont,e.outCanvasStyle.fontFamily)},valueEnabled:s(h.showcrosslinevalues,
h.showcrossline,1),valuestyle:{fontSize:Ca(h.crosslinevaluesize)?Ca(h.crosslinevaluesize)+"px":e.inCanvasStyle.fontSize,fontFamily:ia(h.crosslinevaluefont,e.inCanvasStyle.fontFamily)}},useCrossline:s(h.usecrossline,1),tooltipSepChar:ia(h.tooltipsepchar,", ")});return b},preSeriesAddition:function(){var b=this.dataObj,e=b.chart,h=this.hcJSON,f=h[ga],k=this.smartLabel,g=s(e.compactdatamode,0),ca=ia(e.dataseparator,"|"),w=s(e.showlabels,1),v=e.labeldisplay&&e.labeldisplay.toLowerCase(),m=w&&s(e.labelheight),
L="rotate"===v?270:s(e.rotatelabels,1)?270:0,A=h.xAxis.labels.style,D=Ca(A.lineHeight),u=h.chart.labelPadding=s(e.labelpadding,.2*D)+h.chart.plotBorderWidth,ha,N,V,x=0,Y=-1,X,K,la;0>m&&(m=void 0);0>u&&(u=(h.chart.plotBorderWidth||0)+2);ha=(ha=b.categories)&&ha[0]||{};b=ha.category;delete ha.category;h.categories=v=pa({data:N=g&&b&&b.split&&b.split(ca)||b||[],rotate:L,wrap:"none"!==v},ha);void 0!==b&&(ha.category=b);ha=N.length||0;if(X=!g&&w&&0!==m&&ha||0){for(;X--;)N[X]=N[X]&&(V=N[X].label||"")&&
((K=V.length)>x&&(x=K,Y=X,V)||V)||"";x&&(V=N[Y])}else if(g&&ha&&!m)if(L){g=na.document.createElement("div");m=na.document.createElement("span");g.setAttribute("class","fusioncharts-zoomline-localsmartlabel");g.style.cssText="display:block;width:1px;position:absolute;";for(la in A)g.style[la]=A[la];m.innerHTML=b.replace(/\s*/g,"").replace(/\{br\}/ig,"<br />").replace(new RegExp(Ea(ca),"g")," ");g.appendChild(m);na.document.body.appendChild(g);m=m.offsetWidth||void 0;g.parentNode.removeChild(g)}else V=
N[ha-1]||N[0];void 0!==m&&0!==m||!w||(V?(k.setStyle(A),V=k.getSmartText(V),m=L?V.width:V.height):m=D*(L&&3||1));m>.3*f.height&&(m=.3*f.height);v.labelHeight=m&&m+6||0;v.show=m&&w||0;v.css=pa({},A);L?(v.css.rotation=L,v.css["text-anchor"]="end"):v.css["vertical-align"]="top";h.xAxis.min=0;h.xAxis.max=ha&&ha-1||0;m+=s(e.scrollheight,16)||16;h.chart.marginBottom+=u;f.marginBottomExtraSpace+=m;ia(e.caption,e.subcaption)||(f.marginTopExtraSpace+=16)},series:function(){var b=this.dataObj,e=b.chart,h=b.dataset,
f=this.hcJSON,k=f[ga],P=k[0],v=f.series,w=s(e.yaxismaxvalue),ja=s(e.yaxisminvalue),m=s(e.forceyaxislimits,0),L=s(e.compactdatamode,0),A=ia(e.dataseparator,"|"),D=Ea(e.indecimalseparator),u=Ea(e.inthousandseparator),ha=s(e.drawanchors,e.showanchors,1),N=!!s(e.showlegend,1),V,x,Y,X,K,la=Infinity,ea=-Infinity,$;K=f.categories.data.length;if(h&&h.length&&K){D&&(D=new RegExp(D,"g"));u&&(u=new RegExp(u,"g"));!u&&!D&&L&&m&&void 0!==w&&void 0!==ja?(m=!0,ea=Oa(w,ja),la=Sa(ja,w)):m=!1;w=0;for(ja=h.length;w<
ja;w++){V=h[w];Y=V.data;delete V.data;L?(X=Y||"",u&&(X=X.replace(u,"")),D&&(X=X.replace(D,".")),X=X.split(A)):X=Y||[];X.length>K&&(X.length=K);$=X.length;if(L){if(!m)for(;$--;)x=Ca(X[$]),isNaN(x)&&(x=void 0),x>ea&&(ea=x),x<=la&&(la=x),X[$]=x}else for(;$--;)x=X[$]&&X[$].value||"",u&&(x=x.replace(u,"")),D&&(x=x.replace(D,".")),x=Ca(x),isNaN(x)&&(x=void 0),x>ea&&(ea=x),x<=la&&(la=x),X[$]=x;v.push(x={index:w,type:"zoomline",data:X,name:V.seriesname||"",showInLegend:V.seriesname&&s(V.includeinlegend,1)&&
N||!1,showAnchors:s(V.drawanchors,V.showanchors,ha),visible:!s(V.initiallyhidden,0),lineWidth:2});X.length=K;void 0!==Y&&(V.data=Y);x.attrs=this.seriesGraphicsAttrs(V);V=x.attrs.anchors;x.color=x.attrs.graphics.stroke;x.ancorRadius=V.r+V["stroke-width"]/2;x.marker={fillColor:V.fill,lineColor:V.stroke,lineWidth:1,symbol:"circle"}}-Infinity!==ea&&Infinity!==la||(ea=la=void 0);m=Pa(s(e.displaystartindex,1),10)-1;A=Pa(s(e.displayendindex,K||2),10)-1;1>(h=s(e.pixelsperpoint,15))&&(h=1);(v=s(e.pixelsperlabel,
e.xaxisminlabelwidth,f.categories.rotate?20:60))<h&&(v=h);(0>m||m>=(K-1||1))&&(m=0);(A<=m||A>(K-1||1))&&(A=K-1||1);f.stepZoom={cnd:s(e.connectnulldata,0),amrd:s(e.anchorminrenderdistance,20),nvl:s(e.numvisiblelabels,0),cdm:L,oppp:h,oppl:v,dsi:m,dei:A,vdl:A-m,dmax:P.max=ea,dmin:P.min=la,clen:K,offset:0,step:1,llen:0,alen:0,ddsi:m,ddei:A,ppc:0};this.configureAxis(f,b);b.trendlines&&g(b.trendlines,f.yAxis,k,!1,this.isBar)}},seriesGraphicsAttrs:function(b){var e=this.dataObj.chart,h="0"!=(b.dashed||e.linedashed||
"0"),f,g,h={"stroke-width":s(b.linethickness,e.linethickness,2),stroke:Ha(ia(b.color,e.linecolor,this.colorManager.getPlotColor())),"stroke-opacity":s(b.alpha,e.linealpha,100)/100,"stroke-dasharray":h?[s(b.linedashlen,e.linedashlen,5),s(b.linedashgap,e.linedashgap,4)]:"none","stroke-linejoin":"round","stroke-linecap":"round"};f=pa({},h);g=h["stroke-width"]+s(e.pinlinethicknessdelta,1);f["stroke-width"]=0<g&&g||0;f["stroke-dasharray"]=[3,2];return{graphics:h,pin:f,shadow:{opacity:h["stroke-opacity"],
apply:s(e.showshadow,+!k.vml)},anchors:{"stroke-linejoin":"round","stroke-linecap":"round",r:s(b.anchorradius,e.anchorradius,h["stroke-width"]+2),stroke:Ha(ia(b.anchorbordercolor,e.anchorbordercolor,h.stroke)),"stroke-opacity":s(b.anchorborderalpha,e.anchorborderalpha,100)/100,"stroke-width":s(b.anchorborderthickness,e.anchorborderthickness,h["stroke-width"]),fill:Ha(ia(b.anchorbgcolor,e.anchorbgcolor,"#ffffff")),"fill-opacity":s(b.anchorbgalpha,e.anchorbgalpha,100)/100,opacity:s(b.anchoralpha,e.anchoralpha,
100)/100},anchorShadow:s(e.anchorshadow,e.showshadow,+!k.vml)&&{apply:!0,opacity:s(b.anchoralpha,e.anchoralpha,100)/100}}},eiMethods:{zoomOut:function(){var b=this.jsVars,e;if(b&&(e=b.hcObj))return e.zoomOut&&b.hcObj.zoomOut()},zoomTo:function(b,e){var h=this.jsVars,f;if(h&&(f=h.hcObj))return f.zoomRange&&h.hcObj.zoomRange(b,e)},resetChart:function(){var b=this.jsVars,e;b&&(e=b.hcObj)&&(e.pinRangePixels&&b.hcObj.pinRangePixels(),e.resetZoom&&b.hcObj.resetZoom())},setZoomMode:function(b){var e=this.jsVars,
h;e&&(h=e.hcObj)&&h.activatePin&&h.activatePin(!b)},getViewStartIndex:function(){var b=this.jsVars,e;if(b&&b.hcObj&&(e=b.hcObj._zoominfo))return e.ddsi},getViewEndIndex:function(){var b=this.jsVars,e;if(b&&b.hcObj&&(e=b.hcObj._zoominfo))return b=e.ddei-1,(b>=e.clen?e.clen:b)-1}}},Na.msline);La("renderer.zoomline",{resetZoom:function(){var b=this._zoomhistory,e=this.options.stepZoom;if(!b.length)return!1;b.length=0;this.zoomTo(e.dsi,e.dei)&&v("zoomReset",this._zoomargs,this.fusionCharts,[this.fusionCharts.id]);
return!0},zoomOut:function(){var b=this._zoomhistory.pop(),e=this.options.stepZoom,h,f,k;b?(h=b.dsi,f=b.dei):this._prezoomed&&(h=0,f=e.clen-1);(k=this.zoomTo(h,f))&&Aa.raiseEvent("zoomedout",k,this.fusionCharts);return!0},zoomRangePixels:function(b,e){var h=this._zoomhistory,f=this._zoominfo,k=f.ppp,f=f.ddsi,g;h.push(this._zoominfo);(g=this.zoomTo(f+Y(b/k),f+Y(e/k)))?Aa.raiseEvent("zoomedin",g,this.fusionCharts):h.pop()},zoomRange:function(b,e){var h=this._zoomhistory,f;h.push(this._zoominfo);(f=
this.zoomTo(+b,+e))?Aa.raiseEvent("zoomedin",f,this.fusionCharts):h.pop()},zoomTo:function(b,e){var h=this.xlabels.data,f=this._zoominfo,k=this._zoomhistory,g=f.clen;0>b&&(b=0);b>=g-1&&(b=g-1);e<=b&&(e=b+1);e>g-1&&(e=g-1);if(b===e||b===f.dsi&&e===f.dei)return!1;this.pinRangePixels();f=pa({},f);f.dsi=b;f.dei=e;f=this._zoominfo=f;this.updatePlotZoomline();this.zoomOutButton[f.vdl===f.clen-1?"hide":"show"]();this.resetButton[k.length?"show":"hide"]();this.elements.zoomscroller.attr({"scroll-ratio":f.vdl/
(g-!!g),"scroll-position":[f.dsi/(g-f.vdl-1),!0]});h={level:k.length+1,startIndex:b,startLabel:h[b],endIndex:e,endLabel:h[e]};v("zoomed",h,this.fusionCharts,[this.fusionCharts.id,b,e,h.startLabel,h.endLabel,h.level]);return h},activatePin:function(b){var e=this._zoominfo,h=this.options.chart,f=this.pinButton;if(f&&e.pinned^(b=!!b))return b||this.pinRangePixels(),v("zoomModeChanged",{pinModeActive:b},this.fusionCharts,[]),h.showToolBarButtonTooltext&&f.tooltip(h[b&&"btnSwitchToZoomModeTooltext"||"btnSwitchToPinModeTooltext"]||
""),f.attr("button-active",b),e.pinned=b},pinRangePixels:function(b,e){var h=this.paper,f=this.elements,k=this.xlabels.data,g=this._zoominfo,s=this.layers.zoompin,w=f.pinrect,ja=f["clip-pinrect"],m=this._pingrouptransform,L=this.plots,A=e-b,D,u;if(g&&s&&w){if(b===e)return s.hide(),f.pintracker.hide(),this.pinButton.attr("button-active",!1),g.pinned=!1;for(u=L.length;u--;)w=L[u],D=w.pinline,D||(D=w.pinline=h.path(void 0,s).attr(w.attrPin)),D.attr("path",w.graphic.attrs.path);ja[0]=b+this.canvasLeft;
ja[2]=A;s.attr({"clip-rect":ja,transform:m}).show();f.pintracker.__pindragdelta=0;f.pintracker.show().attr({transform:m,x:b,width:A});b=this.getValuePixel(b);e=this.getValuePixel(e);v("pinned",{startIndex:b,endIndex:e,startLabel:k[b],endLabel:k[e]},this.fusionCharts,[this.fusionCharts.id,b,e,k[b],k[e]]);return g.pinned=!0}},getValuePixel:function(b){var e=this._zoominfo;return e.ddsi+Y(b/e.ppp)},getParsedLabel:function(b){var e=this.xlabels;return e.parsed[b]||(e.parsed[b]=ta(e.data[b]||""))},drawGraph:function(){var b=
this,e=b.paper,h=b.canvasLeft,f=b.canvasTop,g=b.canvasWidth,P=b.canvasHeight,s=b.options,w=s.chart,v=w.plotBorderWidth,m=w.useRoundEdges,L=w.showToolBarButtonTooltext,A=w.crossline,D=b.layers,u=b.toolbar,K=b.elements,N=w.allowPinMode,V=s.categories,x=!1,Y,X,ga,la,ea,$,ia;$=b._zoominfo=pa({},s.stepZoom);b._zoomhistory=[];$.clen&&(x=b._prezoomed=$.dei-$.dsi<$.clen-1,ea=b._visw=b.canvasWidth-2*w.canvasPadding,la=b._visx=b.canvasLeft+w.canvasPadding,b._visout=-(b.chartHeight+b.canvasHeight+1E3),b.base.drawGraph.apply(b,
arguments),b._ypvr=b.yAxis[0]&&b.yAxis[0].pixelValueRatio||0,ia=b._ymin||(b._ymin=b.yAxis[0].endY),b._yminValue=b.yAxis[0].min,s=D.dataset.attr("clip-rect",[b._visx,b.canvasTop,b._visw,b.canvasHeight]),ga=D.scroll||(D.scroll=e.group("scroll").insertAfter(D.layerAboveDataset)),b.xlabels=[],b.xlabels.show=V.show,b.xlabels.height=V.labelHeight,b.xlabels.wrap=V.wrap,b.xlabels.rotate=V.rotate,b.xlabels.data=V.data||[],b.xlabels.parsed=[],b.xlabels.css=V.css,b.xlabels.group=e.group("zoomline-plot-xlabels",
D.datalabels),D.datalabels.transform(["T",la,f+P+w.scrollHeight+w.labelPadding]),b._lcmd=V.rotate?"y":"x",N&&(N=k.crispBound(0,f-ia,0,P,v),Y=K["clip-pinrect"]=[N.x,f,N.width,N.height],X=D.zoompin=e.group("zoompin").insertBefore(s).transform(b._pingrouptransform=["T",la,ia]).hide(),K.pinrect=e.rect(0,f-ia,b._visw,P,D.zoompin).attr({"stroke-width":0,stroke:"none",fill:w.pinPaneFill,"shape-rendering":"crisp",ishot:!0}),K.pintracker=e.rect(D.tracker).attr({transform:X.transform(),x:0,y:f-ia,width:0,height:P,
stroke:"none",fill:ua,ishot:!0,cursor:k.svg&&"ew-resize"||"e-resize"}).drag(function(b){var e=la+b+this.__pindragdelta,f=this.__pinboundleft,h=this.__pinboundright,g=this.data("cliprect").slice(0);e<f?e=f:e>h&&(e=h);X.transform(["T",e,ia]);K.pintracker.transform(X.transform());k.svg||(g[0]=g[0]+e-la-this.__pindragdelta,X.attr("clip-rect",g));this.__pindragoffset=b},function(){this.__pinboundleft=0-Y[0]+la+h;this.__pinboundright=this.__pinboundleft+ea-Y[2];this.data("cliprect",X.attr("clip-rect"));
X._.clipispath=!0},function(){X._.clipispath=!1;this.__pindragdelta=this.__pindragoffset;delete this.__pindragoffset;delete this.__pinboundleft;delete this.__pinboundright}),b.pinButton=u.add("pinModeIcon",function(){b.activatePin(!b._zoominfo.pinned)},{tooltip:L&&w.btnSwitchToPinModeTooltext||""})),v++,N=k.crispBound(h-v,f+P+v,g+v+v,w.scrollHeight,v),v--,K.zoomscroller=e.scroller(N.x+(m&&-1||v%2),N.y-(m&&4||2),N.width-(!m&&2||0),N.height,!0,{showButtons:w.scrollShowButtons,scrollRatio:$.vdl/($.clen-
!!$.clen),scrollPosition:[$.dsi/($.clen-$.vdl-1),!1],displayStyleFlat:w.scrollBarFlat},ga).attr({fill:w.scrollColor,r:m&&2||0}).scroll(b.updatePlotZoomline,b),m&&K.zoomscroller.shadow(!0),function(){var e;k.eve.on("raphael.scroll.start."+K.zoomscroller.id,function(f){e=f;b.crossline&&b.crossline.disable(!0);Aa.raiseEvent("scrollstart",{scrollPosition:f},b.logic.chartInstance)});k.eve.on("raphael.scroll.end."+K.zoomscroller.id,function(f){b.crossline&&b.crossline.disable(!1);Aa.raiseEvent("scrollend",
{prevScrollPosition:e,scrollPosition:f},b.logic.chartInstance)})}(),Ua(b,{attr:{stroke:w.zoomPaneStroke,fill:w.zoomPaneFill,strokeWidth:0},selectionStart:function(){},selectionEnd:function(e){var f=e.selectionLeft-h;e=f+e.selectionWidth;b.crossline&&b.crossline.hide();b[b._zoominfo.pinned?"pinRangePixels":"zoomRangePixels"](f,e)}}),b.zoomOutButton=u.add("zoomOutIcon",function(){b.zoomOut()},{tooltip:L&&w.btnZoomOutTooltext||""})[x&&"show"||"hide"](),b.resetButton=u.add("resetIcon",function(){b.resetZoom()},
{tooltip:L&&w.btnResetChartTooltext||""}).hide(),N=b.resetButton.attr("fill"),N[2]="rgba(255,255,255,0)",b.resetButton.attr("fill",[N[0],N[1],N[2],N[3]]),A&&0!==A.enabled&&1===w.useCrossline&&(b.crossline=new sa(b,A)),b.updatePlotZoomline())},drawPlotZoomline:function(b,e){var h=this.paper,f=e.attrs,k=e.visible,g=k?"show":"hide",s=this.layers.dataset,w=b.group||(b.group=h.group("plot-zoomline-dataset",s)),s=b.anchorGroup||(b.anchorGroup=h.group("plot-zoomline-anchors",s)),h=b.graphic||(b.graphic=
h.path(void 0,w)),v=["T",this._visx,this._ymin||(this._ymin=this.yAxis[0].endY)];w.transform(v)[g]();s.transform(v)[g]();b.graphic=h.attr(f.graphics).shadow(f.shadow);b.attrPin=f.pin;b.visible=k;b.anchors=[];b.anchors.show=e.showAnchors;b.anchors.attrs=f.anchors;b.anchors.attrsShadow=f.anchorShadow;b.anchors.left=-(f.anchors.r+.5*f.anchors["stroke-width"]);b.anchors.right=this._visw-b.anchors.right},updatePlotZoomline:function(b,e){var h=this.paper,f=this._ypvr,k=this._visw,g=this.xlabels,s=g.css,
w=g.group,v=this.plots,m,L,A,D,u,K,N;!e&&(e=this._zoominfo);A=e.oppp;D=e.vdl=e.dei-e.dsi;u=e.ppl=e.nvl?k/e.nvl:e.oppl;k=e.step=(L=e.ppp=k/D)<A?Ba(A/L):1;u=e.lskip=Ba(Oa(u,Ca(s.lineHeight))/L/k);void 0!==b?(A=(e.clen-D-1)*b,e.offset=(A-(A=Pa(A)))*L,K=A+D):(A=e.dsi,K=e.dei,e.offset=0);D=e.norm=A%k;e.ddsi=A-=D;e.ddei=K=K+2*k-D;e.pvr=f;e._ymin=this._ymin;e._yminValue=this._yminValue;f=g.show?Ba((K-A)/k/u):0;D=e.llen-1;e.llen=f;N=e.ppc=L*u*k;if(f>D)for(u=D,D=f;u<D;u++)(m=g[u])&&m.show()||(g[u]=h.text(0,
0,"",w).css(s));else for(u=f,D+=1;u<D;u++)g[u].hide();f=L*k<e.amrd?0:Ba((K-A)/k);s=f-e.alen;e.alen=f;g.wrap&&(g.rotate?(g._width=g.height,g._height=N):(g._width=N,g._height=g.height));for(k=v.length;k--;){w=v[k];e.plotName=w.name||"";m=w.anchors;if(m.show&&s){L=m.attrs;u=0;for(D=f;u<D;u++)m[u]=m[u]&&m[u].show()||h.circle(L,w.anchorGroup);u=f;for(D=m.length;u<D;u++)m[u]&&m[u].hide()}this.drawPlotZoomlineGraphics(e,w.data,w.graphic,m,!k&&g)}na.FC_DEV_ENVIRONMENT&&na.jQuery&&(FusionCharts["debugger"].enable()?
(this.debug=this.debug||(na.jQuery("#fc-zoominfo").length||na.jQuery("body").append('<pre id="fc-zoominfo">'),na.jQuery("#fc-zoominfo").css({position:"absolute",left:"10px",top:"0","pointer-events":"none",opacity:.7,width:"250px",zIndex:"999",border:"1px solid #cccccc","box-shadow":"1px 1px 3px #cccccc",background:"#ffffff"})),this.debug.text(JSON.stringify(e,0,2))):(this.debug&&na.jQuery("#fc-zoominfo").remove(),delete this.debug))},drawPlotZoomlineGraphics:function(b,e,h,f,k){var g=this.smartLabel,
s=this.numberFormatter,w=this.options.chart,v=w.useCrossline,m=[],L=!b.cnd,A=b.ddei,D=b.clen,u=b.step,K=b.lskip,N=b.ppp,V=b.offset,x=b.pvr,Y=this._visw,X=this._visout,ia=this._lcmd,la="M",ea,$,ga=k&&k[0],na,ka;f=f[0];var fa={},aa={},ma,pa,oa=0,ua,sa,va=-b.norm,ta=b.ddsi,ya=0,n,w=w.tooltipSepChar;ga&&(k.group.transform(["T",-V,0]),sa=k.wrap,na=k._height,ka=k._width,sa&&g.setStyle(k.css));for(;ta<=A;ta+=u,va+=u)$=this.getParsedLabel(ta),v||(n=$+w+s.yAxis(e[ta]),n=b.plotName&&b.plotName+w+n||n),ua=oa/
3+ya,pa=va*N,void 0===(ea=e[ta])?(L&&(la="M"),ma=X,k=pa-V,ea=X,ya++):(m[oa++]=la,m[oa++]=ma=k=pa-V,m[oa++]=ea=(ea-b._yminValue)*x,la="L"),v?f&&(f=f.attr((fa.cx=ma,fa.cy=ea,fa)).next):f&&(f=f.attr((fa.cx=ma,fa.cy=ea,fa)).tooltip(n).next),!ga||ua%K||(ma=ga.attrs,k=0>k||k>Y?X:pa,ga._prevtext===$?delete aa.text:aa.text=ga._prevtext=$,ma[ia]===k?delete aa[ia]:aa[ia]=k,sa&&$&&(aa.text=g.getSmartText($,ka,na).text),ga=ga.attr(aa).next);A>=D&&(void 0!==(ea=e[D-1])&&(m[oa++]="L",m[oa++]=(va-(A-D))*N-V,m[oa++]=
ea*x),f&&f.attr((fa.cx=X,fa.cy=X,fa)));h.attr("path",m)},legendClick:function(b){var e=!b.visible,h=e?"show":"hide";b.group[h]();b.anchorGroup[h]();this.base.legendClick.apply(this,arguments);return b.visible=e},dispose:function(){var b;this.crossline&&(this.crossline.dispose(),delete this.crossline);(b=this.elements.pintracker)&&(b.undrag(),delete this.elements.pintracker);delete this.zoomOutButton;delete this.resetButton;delete this.pinButton;this.xlabels&&(this.xlabels.length=0);delete this.xlabels;
this.base.dispose.apply(this)}},La["renderer.cartesian"]);sa=function(b,e){var h=b.paper,f=this.left=b._visx,k=this.width=b._visw,g=this.top=b.canvasTop,s=this.height=b.canvasHeight,w=this._visout=b._visout,v=this.plots=b.plots,m=b.layers.dataset,L,A=e.labelstyle,D=e.valuestyle;L=this.group=h.group("crossline-labels",m).attr({transform:["T",f,b._ymin]});this.tracker=h.rect(f,g,k,s,m).attr({stroke:"none","stroke-width":0,fill:ua}).toFront().mousedown(this.onMouseDown,this).mouseup(this.onMouseUp,this,
!0).mouseout(this.onMouseOut,this).mousemove(this.onMouseMove,this);Fa&&this.tracker.touchstart(this.onMouseMove,this);this.container=b.container;this.line=h.path(void 0,m).attr(pa({path:["M",f,g,"l",0,s]},e.line)).toBack();f=this.labels=e.valueEnabled&&h.set();e.labelEnabled&&(this.positionLabel=h.text(w,g+s+(b.options.chart.scrollHeight||0)+2.5,"").insertAfter(b.xlabels.group.parent).css(A).attr({"vertical-align":"top","text-bound":["rgba(255,255,255,1)","rgba(0,0,0,1)",1,2.5]}));this.hide();this.pixelRatio=
b._ypvr;this.yminValue=b._yminValue;this.positionLabels=b.xlabels||{data:[],parsed:[]};this.getZoomInfo=function(){return b._zoominfo};this.getDataIndexFromPixel=function(e){return b.getValuePixel(e)};this.getPositionLabel=function(e){return b.getParsedLabel(e)};if(e.valueEnabled){g=0;for(s=v.length;g<s;g++)A=v[g],A=A.graphic.attrs.stroke,f.push(h.text(0,w,"",L).css(D).attr({fill:A,"text-bound":["rgba(255,255,255,0.8)","rgba(0,0,0,0.2)",1,2.5]}));this.numberFormatter=b.numberFormatter}};sa.prototype.disable=
function(b){void 0!==b&&(this.disabled=!!b)&&this.visible&&this.hide();return this.disabled};sa.prototype.onMouseOut=function(){this.hide()};sa.prototype.onMouseDown=function(){!Fa&&this.hide();this._mouseIsDown=!0};sa.prototype.onMouseUp=function(){!Fa&&this.hide();delete this._mouseIsDown};sa.prototype.onMouseMove=function(b){if(!(this.disabled||this._mouseIsDown&&!Fa)){var e=this.getZoomInfo(),h=this.line,f=this.left,k=e.step,g=e.ppp*k;b=Va(this.container,b).chartX-f;var s;b=(b+=g/2+e.offset)-
b%g;s=(s=this.getDataIndexFromPixel(Ba(b)))+s%k;b-=e.offset;h.transform(["T",Y(b),0]);this.hidden&&this.show();if(s!==this.position||this.hidden)this.position=s,this.lineX=b,this.updateLabels()}};sa.prototype.updateLabels=function(){var b=this,e=b.labels,h=b.plots,f=b.width,k=b.position,g=b.lineX,s=Y(g),w=b.pixelRatio,v=b.yminValue,m=b._visout,L=b.numberFormatter;e&&e.forEach(function(e,D){var u=h[D],K=u.data[k],N,V;e.attr({text:L.xAxis(K)});N=e.getBBox();V=.5*N.width+10;N=N.height;u=void 0!==K&&
u.visible?(K-v)*w:m;u<-1*(b.height-N)?u+=N:u>v*w-N&&(u-=N);e.attr({x:Oa(0,Sa(s,f)),y:u,"text-anchor":g<=V&&"start"||g+V>=f&&"end"||"middle"})});b.positionLabel&&b.positionLabel.attr({x:g+b.left,text:b.getPositionLabel(k)})};sa.prototype.show=function(){this.disabled||(this.hidden=!1,this.group.attr("visibility","visible"),this.line.attr("visibility","visible"),this.positionLabel&&this.positionLabel.attr("visibility","visible"))};sa.prototype.hide=function(){this.hidden=!0;this.group.attr("visibility",
"hidden");this.line.attr("visibility","hidden");this.positionLabel&&this.positionLabel.attr("visibility","hidden")};sa.prototype.dispose=function(){for(var b in this)this.hasOwnProperty(b)&&delete this[b]};k.addSymbol({pinModeIcon:function(b,e,h){var f=.5*h,k=b-h,g=b+h,s=b-f,w=b+f,v=b+.5,m=v+1,L=v+1.5,A=e-h,D=e+f,u=e-f,f=e+(h-f);return["M",k,A,"L",s,u,s,f,k,D,b-.5,D,b,e+h+.5,v,D,g,D,w,f,w,u,g,A,L,A,L,u,L,f,m,f,m,u,L,u,L,A,"Z"]},zoomOutIcon:function(b,e,h){b-=.2*h;e-=.2*h;var f=.8*h,g=k.rad(43),s=
k.rad(48),v=b+f*ma(g),g=e+f*va(g),w=b+f*ma(s),s=e+f*va(s),K=k.rad(45),m=v+h*ma(K),L=g+h*va(K),A=w+h*ma(K);h=s+h*va(K);return["M",v,g,"A",f,f,0,1,0,w,s,"Z","M",v+1,g+1,"L",m,L,A,h,w+1,s+1,"Z","M",b-2,e,"L",b+2,e,"Z"]},resetIcon:function(b,e,h){var f=b-h,g=(ya.PI/2+ya.PI)/2;b+=h*ma(g);var g=e+h*va(g),k=2*h/3;return["M",f,e,"A",h,h,0,1,1,b,g,"L",b+k,g-1,b+2,g+k-.5,b,g]}})}]);
;
/*
 * Function: loadChart
 *  loads the given chart
 *
 * Parameters:
 *  panelObject - object containing data about the panel to load
*/

function loadPanelChart(viewIdx, chartGroupGUID){
  var chartSets = environment.GetPageFlag("ChartSets_" + chartGroupGUID);
  if(chartSets.length == 0)
  // there are no charts to display
    return;

  // activate the correct view button
  chartGUID = chartSets[viewIdx]["chartguid"];
  $('#curentChartGUID_' + chartGroupGUID).val(chartGUID);
  $('#curentChartID_' + chartGroupGUID).val(viewIdx);
  for(idx = 0; idx < chartSets.length; idx++){
    $('#chartViewBtn_' + chartSets[idx]["chartguid"]).removeClass('chartView_active');
    $('#chartViewBtn_' + chartSets[idx]["chartguid"]).addClass('chartView_inactive');
  }
  $('#chartViewBtn_' + chartGUID).removeClass('chartView_inactive');
  $('#chartViewBtn_' + chartGUID).addClass('chartView_active');
  //var chartSets = environment.GetPageFlag('ChartSets_' + chartGroupGUID);
  eval(chartSets[viewIdx]["chartloadcode"]);

  if ($.browser.mozilla) {
      $('g[class*=-dataset] path').each(function (i, el) {
          $(el).attr('stroke-dasharray', '1');
      });
  }
}

function changeLocalMarketChartData(locationId, chartGroupGUID)
{
  var localMarketLocation = $.trim($('#' + locationId).val());
  if (localMarketLocation != "")
  {
    var ajaxAdapter = new AJAXAdapter();
    ajaxAdapter.setParametersString('localMarketLocation=' + localMarketLocation);
    ajaxAdapter.setParametersString('SystemFusionChartGroupGUID=' + chartGroupGUID, APPEND_PARAM);
    environment.SetPageFlag("localMarketConditionsChartGUID", chartGroupGUID);
    var chartSets = environment.GetPageFlag("ChartSets_" + chartGroupGUID);
    var chartSetsLen = chartSets.length;
    var chartGUIDList = chartSets[0]["chartguid"];
    for(chartIndex = 1; chartIndex < chartSetsLen; chartIndex++)
      chartGUIDList += "," + chartSets[chartIndex]["chartguid"];
    ajaxAdapter.setParametersString('SystemFusionChartGUID=' + chartGUIDList, APPEND_PARAM);
    OpenProgressDlg();
    ajaxAdapter.call(BuildURL('refreshLocalMarketConditionsChart'), changeLocalMarketChartData_callback);
  }
}

function changeLocalMarketChartData_callback(htmlData)
{
  ClosePopup();
  var chartGroupGUID = environment.GetPageFlag("localMarketConditionsChartGUID");
  environment.RemovePageFlag("localMarketConditionsChartGUID");
  $("#refreshChartContent_" + chartGroupGUID).html(htmlData);
  var viewIdx = $('#curentChartID_' + chartGroupGUID).val();
  loadPanelChart(viewIdx, chartGroupGUID);
  $("#FusionChart_Location").val(executionStatus["arealocation"]);
  if (executionStatus["areafoundindicator"] == "N")
  {
    environment.SetPageFlag("areaNotFoundError", true);
    $("#FusionChart_Location").addClass("textboxErrorImportant");
  }
}

function changeLocalMarketErrorMessage(elem)
{
  if (environment.GetPageFlag("areaNotFoundError") == true)
  {
    environment.RemovePageFlag("areaNotFoundError");
    $(elem).removeClass("textboxErrorImportant");
    $(elem).val("");
    checkDefaultMessage(elem);
  }
}

function checkDefaultMessage(elem)
{
  var elemDefaultId = "localMarketLocationTextContainer";
  if ($.trim($(elem).val()) == ""){
    $("#" + elemDefaultId).show();
  }
  else{
    $("#" + elemDefaultId).hide();
  }
}

function changeYourPropertiesAtAGlanceChartData(listingGUID, chartGroupGUID){
  var ajaxAdapter = new AJAXAdapter();
  ajaxAdapter.setParametersString('listingGUID=' + listingGUID);
  ajaxAdapter.setParametersString('SystemFusionChartGroupGUID=' + chartGroupGUID, APPEND_PARAM);
  environment.SetPageFlag("propertiesAtAGlanceChartGUID", chartGroupGUID);
  var chartSets = environment.GetPageFlag("ChartSets_" + chartGroupGUID);
  var chartSetsLen = chartSets.length;
  var chartGUIDList = chartSets[0]["chartguid"];
  for(chartIndex = 1; chartIndex < chartSetsLen; chartIndex++)
    chartGUIDList += "," + chartSets[chartIndex]["chartguid"];
  ajaxAdapter.setParametersString('SystemFusionChartGUID=' + chartGUIDList, APPEND_PARAM);
  OpenProgressDlg();
  ajaxAdapter.call(BuildURL('refreshYourPropertiesAtAGlanceChart'), changeYourPropertiesAtAGlanceChartData_callback);
}

function changeYourPropertiesAtAGlanceChartData_callback(htmlData)
{
  ClosePopup();
  var chartGroupGUID = environment.GetPageFlag("propertiesAtAGlanceChartGUID");
  environment.RemovePageFlag("propertiesAtAGlanceChartGUID");
  $("#refreshChartContent_" + chartGroupGUID).html(htmlData);
  var viewIdx = $('#curentChartID_' + chartGroupGUID).val();
  loadPanelChart(viewIdx, chartGroupGUID);
}
;
/*
 * Function: showSendMessagePopup
 *  send message to agent
 *
 * Parameters:
 *  location - location to make AJAX request to
 *  recipientsDataArray - recipient(s) details(name and login addressbook GUID) array
 *  messageSubject - message subject
 *
*/
function showSendMessagePopup(location,recipientsDataArray,messageSubject)
{
  OpenProgressDlg();
  var ajaxAdapterTmp = new AJAXAdapter();
  if (location == "propertyDetails") {
    var LoginGUID_ListingAgent = $('#LoginGUID_ListingAgent').val();
    var Email_ListingAgent = $('#Email_ListingAgent').val();
    ajaxAdapterTmp.setParametersString("messageSubject=" + "Your listing at " + environment.GetPageFlag('PropertyAddress'));
    ajaxAdapterTmp.setParametersString("LoginGUID_ListingAgent=" + LoginGUID_ListingAgent, APPEND_PARAM);
    ajaxAdapterTmp.setParametersString("Email_ListingAgent=" + Email_ListingAgent, APPEND_PARAM);
    ajaxAdapterTmp.setParametersString('ListingGUID=' + environment.GetPageFlag('ListingGUID'), APPEND_PARAM);
    ajaxAdapterTmp.call(environment.ApplicationPath+'propertyDetails.showPropertyDetailsSendMessage',showSendMessagePopup_callback);
  }
  else {
    ajaxAdapterTmp.setParametersString("recipientsDataArray=" + recipientsDataArray);
    ajaxAdapterTmp.setParametersString("messageSubject=" + messageSubject, APPEND_PARAM);
    ajaxAdapterTmp.call(location, showSendMessagePopup_callback);
  }
}

/*
 * Function: sendSimpleMessagePopup
 * AJAX call when sending a message
 *
 * Parameters:
 *  location - location to make AJAX request to
 *  callback - callback function
 *  formId - id of form
 *  messageSubject - message subject
 *  messageBody - message text
*/
function sendSimpleMessagePopup(oParam){
  if ($.trim($("#"+oParam.messageBody).val()) != "")
  {
    var ajaxAdapter = new AJAXAdapter();
    ajaxAdapter.setParametersFromForm(oParam.formId);
    ClosePopup();
    OpenProgressDlg();
    ajaxAdapter.call(oParam.location,oParam.callback);
  }
}

function showSendMessagePopup_callback(htmlData){
  OpenHTMLPopup(htmlData);
  $('#attachmentType input').each(function(idx,elem){
    if (($(elem).attr('checked') == true) && ($(elem).val() != 0)) getSendMessagePopupAttachmentList(environment.ApplicationPath+'sendMessagePopupAttachmentList',sendMessagePopupAttachment_callback,elem);
  });
}

/*
 * Function: getSendMessagePopupAttachmentList
 *  called to retrieve the attachment list
 *
 * Parameters:
 *  location - location to make AJAX request to
 *  callback - callback function
 *  attachmentType - type of attachment for which to retrieve the attachment list
*/
function getSendMessagePopupAttachmentList(location,callback,attachmentType){
  $('#attachmentListContainerID').hide();
  environment.SetPageFlag('attachmentType',attachmentType);
  var attachmentTypeHtml = environment.GetPageFlag(attachmentType.id+attachmentType.value+'HTML');
  if (attachmentType.value != 0){
    if (attachmentTypeHtml == null){
      var ajaxAdapter = new AJAXAdapter();
      ajaxAdapter.setParametersString('attachmentType=' + attachmentType.value);
      //disabling the attachment radio buttons
      disableAttachmentRabioButtons(true);
      ajaxAdapter.call(location,callback);
    }else displayAttachmentListDropdown(attachmentType,attachmentTypeHtml);
  }
}

/*
 * Function: disableAttachmentRabioButtons
 *  disable or enable the attachment radio buttons depnding on the boolean value of it's input
 *
 * Parameters:
 *  bool - true or false indicating enable or disable radio buttons
*/
function disableAttachmentRabioButtons(bool){
  $('#attachmentType input').each(function(idx,elem){
    $(elem).attr('disabled',bool);
  });
}

/*
 * Function: displayAttachmentListDropdown
 *  display the attachment list dropdown and position it coresponding to the selected attachment radio button
 *
 * Parameters:
 *  attachmentType - selected attachment radio button element
 *  attachmentTypeHtml - attachment list dropdown data
*/
function  displayAttachmentListDropdown(attachmentType,attachmentTypeHtml){
  var elemLeft = "30px";
  var elemTopStart = 0;
  var elemHeight = $('#'+ attachmentType.id).outerHeight(true) - 7;
  for (var idx=0; idx < document.forms['account-sendMessage-form'].MessageAttachmentTypeID.length; idx++){
    if (eval("document.forms['account-sendMessage-form'].MessageAttachmentTypeID["+ idx +"].checked")){
      var multiplier = idx;
    }
  }
  var elemTop = (elemTopStart + elemHeight * multiplier).toString() + "px";
  $('#attachmentListContainerID').css({position: 'relative', left: elemLeft , top: elemTop });
  $('#attachmentListContainerID').show();
  $('#attachmentListContainerID').html(attachmentTypeHtml);
}

/*
 * Function: sendMessagePopupAttachment_callback
 *  retrieve the attachment list callback
 *
 * Parameters:
 *  htmlData - html code returned by AJAX request
*/
function sendMessagePopupAttachment_callback(htmlData){
  var attachmentType = environment.GetPageFlag('attachmentType');
  environment.SetPageFlag(attachmentType.id+attachmentType.value+'HTML',htmlData);
  if (attachmentType.value != 0){
    displayAttachmentListDropdown(attachmentType,htmlData);
    //enabling the attachment radio buttons
    disableAttachmentRabioButtons(false);
  }else $('#attachmentListContainerID').hide();
}

/*
 * Function: sendMessagePopup
 * AJAX call when sending a message
 *
 * Parameters:
 *  location - location to make AJAX request to
 *  callback - callback function
 *  recipientList - list of message recipients
 *  messageSubject - message subject
 *  messageBody - message text
*/
function sendMessagePopup(location,callback, recipientList, messageSubject, messageBody){
  var subjectText = $.trim($('#'+messageSubject).val());
  var messageText = $.trim($('#'+messageBody).val());
  if ((subjectText != "") && (messageText != ""))
  {
    var sToRecipients = new Array();
    $('#'+recipientList+' span').each(function(idx,elem){
      var recipientID = $(elem).children('input').val();
      sToRecipients.push(recipientID);
    });
    if (sToRecipients.length > 0){
      var ajaxAdapter = new AJAXAdapter();
      ajaxAdapter.setParametersFromForm('account-sendMessage-form');
      ajaxAdapter.setParametersString('ToRecipients=' + sToRecipients.join(','),APPEND_PARAM);
      ClosePopup();
      OpenProgressDlg();
      ajaxAdapter.call(location, callback);
    }
  }else {
    validateSubjectMessageFields(messageSubject,messageBody);
    AdjustPopupHeight();
  }
}

/*
 * Function: sendMessagePopup_callback
 *  callback to display error if unable to send message
 *
 * Parameters:
 *  htmlData - html returned by AJAX call
*/
function sendMessagePopup_callback(htmlData){
  if(htmlData != ''){
    // there must be some error so display it
    OpenHTMLPopup(htmlData);
  }else ClosePopup();
}

/*
 * Function: sendMessagePopupRemoveEmptyFieldClass
 *  remove message error empty field class
 *
 * Parameters:
 *  elem - element to remove errors from
 *
*/
function sendMessagePopupRemoveEmptyFieldClass(elem){
  elemID= $(elem).attr('id');
  $('#empty'+elemID).hide();
  $(elem).removeClass('textboxError');
  $('#'+elemID+'ErrorRow').addClass('displayHidden');
  AdjustPopupHeight();
}

/*
 * Function: sendMessagePopupRemoveRecipient
 *  remove recipient from To filed
 *
 * Parameters:
 *  elem - element to remove
 *
*/
function sendMessagePopupRemoveRecipient(elem){
  var parentId = $(elem).parents('span').attr('id');
  $('#'+parentId).hide();
  $('#'+parentId).remove();
};
/*! SWFObject v2.2 <http://code.google.com/p/swfobject/>
  is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
*/

var swfobject = function() {

  var UNDEF = "undefined",
    OBJECT = "object",
    SHOCKWAVE_FLASH = "Shockwave Flash",
    SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
    FLASH_MIME_TYPE = "application/x-shockwave-flash",
    EXPRESS_INSTALL_ID = "SWFObjectExprInst",
    ON_READY_STATE_CHANGE = "onreadystatechange",

    win = window,
    doc = document,
    nav = navigator,

    plugin = false,
    domLoadFnArr = [main],
    regObjArr = [],
    objIdArr = [],
    listenersArr = [],
    storedAltContent,
    storedAltContentId,
    storedCallbackFn,
    storedCallbackObj,
    isDomLoaded = false,
    isExpressInstallActive = false,
    dynamicStylesheet,
    dynamicStylesheetMedia,
    autoHideShow = true,

  /* Centralized function for browser feature detection
    - User agent string detection is only used when no good alternative is possible
    - Is executed directly for optimal performance
  */
  ua = function() {
    var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
      u = nav.userAgent.toLowerCase(),
      p = nav.platform.toLowerCase(),
      windows = p ? /win/.test(p) : /win/.test(u),
      mac = p ? /mac/.test(p) : /mac/.test(u),
      webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
      ie = !+"\v1", // feature detection based on Andrea Giammarchi's solution: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
      playerVersion = [0,0,0],
      d = null;
    if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
      d = nav.plugins[SHOCKWAVE_FLASH].description;
      if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
        plugin = true;
        ie = false; // cascaded feature detection for Internet Explorer
        d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
        playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
        playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
        playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
      }
    }
    else if (typeof win.ActiveXObject != UNDEF) {
      try {
        var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
        if (a) { // a will return null when ActiveX is disabled
          d = a.GetVariable("$version");
          if (d) {
            ie = true; // cascaded feature detection for Internet Explorer
            d = d.split(" ")[1].split(",");
            playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
          }
        }
      }
      catch(e) {}
    }
    return { w3:w3cdom, pv:playerVersion, wk:webkit, ie:ie, win:windows, mac:mac };
  }(),

  /* Cross-browser onDomLoad
    - Will fire an event as soon as the DOM of a web page is loaded
    - Internet Explorer workaround based on Diego Perini's solution: http://javascript.nwbox.com/IEContentLoaded/
    - Regular onload serves as fallback
  */
  onDomLoad = function() {
    if (!ua.w3) { return; }
    if ((typeof doc.readyState != UNDEF && doc.readyState == "complete") || (typeof doc.readyState == UNDEF && (doc.getElementsByTagName("body")[0] || doc.body))) { // function is fired after onload, e.g. when script is inserted dynamically
      callDomLoadFunctions();
    }
    if (!isDomLoaded) {
      if (typeof doc.addEventListener != UNDEF) {
        doc.addEventListener("DOMContentLoaded", callDomLoadFunctions, false);
      }
      if (ua.ie && ua.win) {
        doc.attachEvent(ON_READY_STATE_CHANGE, function() {
          if (doc.readyState == "complete") {
            doc.detachEvent(ON_READY_STATE_CHANGE, arguments.callee);
            callDomLoadFunctions();
          }
        });
        if (win == top) { // if not inside an iframe
          (function(){
            if (isDomLoaded) { return; }
            try {
              doc.documentElement.doScroll("left");
            }
            catch(e) {
              setTimeout(arguments.callee, 0);
              return;
            }
            callDomLoadFunctions();
          })();
        }
      }
      if (ua.wk) {
        (function(){
          if (isDomLoaded) { return; }
          if (!/loaded|complete/.test(doc.readyState)) {
            setTimeout(arguments.callee, 0);
            return;
          }
          callDomLoadFunctions();
        })();
      }
      addLoadEvent(callDomLoadFunctions);
    }
  }();

  function callDomLoadFunctions() {
    if (isDomLoaded) { return; }
    try { // test if we can really add/remove elements to/from the DOM; we don't want to fire it too early
      var t = doc.getElementsByTagName("body")[0].appendChild(createElement("span"));
      t.parentNode.removeChild(t);
    }
    catch (e) { return; }
    isDomLoaded = true;
    var dl = domLoadFnArr.length;
    for (var i = 0; i < dl; i++) {
      domLoadFnArr[i]();
    }
  }

  function addDomLoadEvent(fn) {
    if (isDomLoaded) {
      fn();
    }
    else {
      domLoadFnArr[domLoadFnArr.length] = fn; // Array.push() is only available in IE5.5+
    }
  }

  /* Cross-browser onload
    - Based on James Edwards' solution: http://brothercake.com/site/resources/scripts/onload/
    - Will fire an event as soon as a web page including all of its assets are loaded
   */
  function addLoadEvent(fn) {
    if (typeof win.addEventListener != UNDEF) {
      win.addEventListener("load", fn, false);
    }
    else if (typeof doc.addEventListener != UNDEF) {
      doc.addEventListener("load", fn, false);
    }
    else if (typeof win.attachEvent != UNDEF) {
      addListener(win, "onload", fn);
    }
    else if (typeof win.onload == "function") {
      var fnOld = win.onload;
      win.onload = function() {
        fnOld();
        fn();
      };
    }
    else {
      win.onload = fn;
    }
  }

  /* Main function
    - Will preferably execute onDomLoad, otherwise onload (as a fallback)
  */
  function main() {
    if (plugin) {
      testPlayerVersion();
    }
    else {
      matchVersions();
    }
  }

  /* Detect the Flash Player version for non-Internet Explorer browsers
    - Detecting the plug-in version via the object element is more precise than using the plugins collection item's description:
      a. Both release and build numbers can be detected
      b. Avoid wrong descriptions by corrupt installers provided by Adobe
      c. Avoid wrong descriptions by multiple Flash Player entries in the plugin Array, caused by incorrect browser imports
    - Disadvantage of this method is that it depends on the availability of the DOM, while the plugins collection is immediately available
  */
  function testPlayerVersion() {
    var b = doc.getElementsByTagName("body")[0];
    var o = createElement(OBJECT);
    o.setAttribute("type", FLASH_MIME_TYPE);
    var t = b.appendChild(o);
    if (t) {
      var counter = 0;
      (function(){
        if (typeof t.GetVariable != UNDEF) {
          var d = t.GetVariable("$version");
          if (d) {
            d = d.split(" ")[1].split(",");
            ua.pv = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
          }
        }
        else if (counter < 10) {
          counter++;
          setTimeout(arguments.callee, 10);
          return;
        }
        b.removeChild(o);
        t = null;
        matchVersions();
      })();
    }
    else {
      matchVersions();
    }
  }

  /* Perform Flash Player and SWF version matching; static publishing only
  */
  function matchVersions() {
    var rl = regObjArr.length;
    if (rl > 0) {
      for (var i = 0; i < rl; i++) { // for each registered object element
        var id = regObjArr[i].id;
        var cb = regObjArr[i].callbackFn;
        var cbObj = {success:false, id:id};
        if (ua.pv[0] > 0) {
          var obj = getElementById(id);
          if (obj) {
            if (hasPlayerVersion(regObjArr[i].swfVersion) && !(ua.wk && ua.wk < 312)) { // Flash Player version >= published SWF version: Houston, we have a match!
              setVisibility(id, true);
              if (cb) {
                cbObj.success = true;
                cbObj.ref = getObjectById(id);
                cb(cbObj);
              }
            }
            else if (regObjArr[i].expressInstall && canExpressInstall()) { // show the Adobe Express Install dialog if set by the web page author and if supported
              var att = {};
              att.data = regObjArr[i].expressInstall;
              att.width = obj.getAttribute("width") || "0";
              att.height = obj.getAttribute("height") || "0";
              if (obj.getAttribute("class")) { att.styleclass = obj.getAttribute("class"); }
              if (obj.getAttribute("align")) { att.align = obj.getAttribute("align"); }
              // parse HTML object param element's name-value pairs
              var par = {};
              var p = obj.getElementsByTagName("param");
              var pl = p.length;
              for (var j = 0; j < pl; j++) {
                if (p[j].getAttribute("name").toLowerCase() != "movie") {
                  par[p[j].getAttribute("name")] = p[j].getAttribute("value");
                }
              }
              showExpressInstall(att, par, id, cb);
            }
            else { // Flash Player and SWF version mismatch or an older Webkit engine that ignores the HTML object element's nested param elements: display alternative content instead of SWF
              displayAltContent(obj);
              if (cb) { cb(cbObj); }
            }
          }
        }
        else {  // if no Flash Player is installed or the fp version cannot be detected we let the HTML object element do its job (either show a SWF or alternative content)
          setVisibility(id, true);
          if (cb) {
            var o = getObjectById(id); // test whether there is an HTML object element or not
            if (o && typeof o.SetVariable != UNDEF) {
              cbObj.success = true;
              cbObj.ref = o;
            }
            cb(cbObj);
          }
        }
      }
    }
  }

  function getObjectById(objectIdStr) {
    var r = null;
    var o = getElementById(objectIdStr);
    if (o && o.nodeName == "OBJECT") {
      if (typeof o.SetVariable != UNDEF) {
        r = o;
      }
      else {
        var n = o.getElementsByTagName(OBJECT)[0];
        if (n) {
          r = n;
        }
      }
    }
    return r;
  }

  /* Requirements for Adobe Express Install
    - only one instance can be active at a time
    - fp 6.0.65 or higher
    - Win/Mac OS only
    - no Webkit engines older than version 312
  */
  function canExpressInstall() {
    return !isExpressInstallActive && hasPlayerVersion("6.0.65") && (ua.win || ua.mac) && !(ua.wk && ua.wk < 312);
  }

  /* Show the Adobe Express Install dialog
    - Reference: http://www.adobe.com/cfusion/knowledgebase/index.cfm?id=6a253b75
  */
  function showExpressInstall(att, par, replaceElemIdStr, callbackFn) {
    isExpressInstallActive = true;
    storedCallbackFn = callbackFn || null;
    storedCallbackObj = {success:false, id:replaceElemIdStr};
    var obj = getElementById(replaceElemIdStr);
    if (obj) {
      if (obj.nodeName == "OBJECT") { // static publishing
        storedAltContent = abstractAltContent(obj);
        storedAltContentId = null;
      }
      else { // dynamic publishing
        storedAltContent = obj;
        storedAltContentId = replaceElemIdStr;
      }
      att.id = EXPRESS_INSTALL_ID;
      if (typeof att.width == UNDEF || (!/%$/.test(att.width) && parseInt(att.width, 10) < 310)) { att.width = "310"; }
      if (typeof att.height == UNDEF || (!/%$/.test(att.height) && parseInt(att.height, 10) < 137)) { att.height = "137"; }
      doc.title = doc.title.slice(0, 47) + " - Flash Player Installation";
      var pt = ua.ie && ua.win ? "ActiveX" : "PlugIn",
        fv = "MMredirectURL=" + win.location.toString().replace(/&/g,"%26") + "&MMplayerType=" + pt + "&MMdoctitle=" + doc.title;
      if (typeof par.flashvars != UNDEF) {
        par.flashvars += "&" + fv;
      }
      else {
        par.flashvars = fv;
      }
      // IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
      // because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
      if (ua.ie && ua.win && obj.readyState != 4) {
        var newObj = createElement("div");
        replaceElemIdStr += "SWFObjectNew";
        newObj.setAttribute("id", replaceElemIdStr);
        obj.parentNode.insertBefore(newObj, obj); // insert placeholder div that will be replaced by the object element that loads expressinstall.swf
        obj.style.display = "none";
        (function(){
          if (obj.readyState == 4) {
            obj.parentNode.removeChild(obj);
          }
          else {
            setTimeout(arguments.callee, 10);
          }
        })();
      }
      createSWF(att, par, replaceElemIdStr);
    }
  }

  /* Functions to abstract and display alternative content
  */
  function displayAltContent(obj) {
    if (ua.ie && ua.win && obj.readyState != 4) {
      // IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
      // because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
      var el = createElement("div");
      obj.parentNode.insertBefore(el, obj); // insert placeholder div that will be replaced by the alternative content
      el.parentNode.replaceChild(abstractAltContent(obj), el);
      obj.style.display = "none";
      (function(){
        if (obj.readyState == 4) {
          obj.parentNode.removeChild(obj);
        }
        else {
          setTimeout(arguments.callee, 10);
        }
      })();
    }
    else {
      obj.parentNode.replaceChild(abstractAltContent(obj), obj);
    }
  }

  function abstractAltContent(obj) {
    var ac = createElement("div");
    if (ua.win && ua.ie) {
      ac.innerHTML = obj.innerHTML;
    }
    else {
      var nestedObj = obj.getElementsByTagName(OBJECT)[0];
      if (nestedObj) {
        var c = nestedObj.childNodes;
        if (c) {
          var cl = c.length;
          for (var i = 0; i < cl; i++) {
            if (!(c[i].nodeType == 1 && c[i].nodeName == "PARAM") && !(c[i].nodeType == 8)) {
              ac.appendChild(c[i].cloneNode(true));
            }
          }
        }
      }
    }
    return ac;
  }

  /* Cross-browser dynamic SWF creation
  */
  function createSWF(attObj, parObj, id) {
    var r, el = getElementById(id);
    if (ua.wk && ua.wk < 312) { return r; }
    if (el) {
      if (typeof attObj.id == UNDEF) { // if no 'id' is defined for the object element, it will inherit the 'id' from the alternative content
        attObj.id = id;
      }
      if (ua.ie && ua.win) { // Internet Explorer + the HTML object element + W3C DOM methods do not combine: fall back to outerHTML
        var att = "";
        for (var i in attObj) {
          if (attObj[i] != Object.prototype[i]) { // filter out prototype additions from other potential libraries
            if (i.toLowerCase() == "data") {
              parObj.movie = attObj[i];
            }
            else if (i.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
              att += ' class="' + attObj[i] + '"';
            }
            else if (i.toLowerCase() != "classid") {
              att += ' ' + i + '="' + attObj[i] + '"';
            }
          }
        }
        var par = "";
        for (var j in parObj) {
          if (parObj[j] != Object.prototype[j]) { // filter out prototype additions from other potential libraries
            par += '<param name="' + j + '" value="' + parObj[j] + '" />';
          }
        }
        el.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + att + '>' + par + '</object>';
        objIdArr[objIdArr.length] = attObj.id; // stored to fix object 'leaks' on unload (dynamic publishing only)
        r = getElementById(attObj.id);
      }
      else { // well-behaving browsers
        var o = createElement(OBJECT);
        o.setAttribute("type", FLASH_MIME_TYPE);
        for (var m in attObj) {
          if (attObj[m] != Object.prototype[m]) { // filter out prototype additions from other potential libraries
            if (m.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
              o.setAttribute("class", attObj[m]);
            }
            else if (m.toLowerCase() != "classid") { // filter out IE specific attribute
              o.setAttribute(m, attObj[m]);
            }
          }
        }
        for (var n in parObj) {
          if (parObj[n] != Object.prototype[n] && n.toLowerCase() != "movie") { // filter out prototype additions from other potential libraries and IE specific param element
            createObjParam(o, n, parObj[n]);
          }
        }
        el.parentNode.replaceChild(o, el);
        r = o;
      }
    }
    return r;
  }

  function createObjParam(el, pName, pValue) {
    var p = createElement("param");
    p.setAttribute("name", pName);
    p.setAttribute("value", pValue);
    el.appendChild(p);
  }

  /* Cross-browser SWF removal
    - Especially needed to safely and completely remove a SWF in Internet Explorer
  */
  function removeSWF(id) {
    var obj = getElementById(id);
    if (obj && obj.nodeName == "OBJECT") {
      if (ua.ie && ua.win) {
        obj.style.display = "none";
        (function(){
          if (obj.readyState == 4) {
            removeObjectInIE(id);
          }
          else {
            setTimeout(arguments.callee, 10);
          }
        })();
      }
      else {
        obj.parentNode.removeChild(obj);
      }
    }
  }

  function removeObjectInIE(id) {
    var obj = getElementById(id);
    if (obj) {
      for (var i in obj) {
        if (typeof obj[i] == "function") {
          obj[i] = null;
        }
      }
      obj.parentNode.removeChild(obj);
    }
  }

  /* Functions to optimize JavaScript compression
  */
  function getElementById(id) {
    var el = null;
    try {
      el = doc.getElementById(id);
    }
    catch (e) {}
    return el;
  }

  function createElement(el) {
    return doc.createElement(el);
  }

  /* Updated attachEvent function for Internet Explorer
    - Stores attachEvent information in an Array, so on unload the detachEvent functions can be called to avoid memory leaks
  */
  function addListener(target, eventType, fn) {
    target.attachEvent(eventType, fn);
    listenersArr[listenersArr.length] = [target, eventType, fn];
  }

  /* Flash Player and SWF content version matching
  */
  function hasPlayerVersion(rv) {
    var pv = ua.pv, v = rv.split(".");
    v[0] = parseInt(v[0], 10);
    v[1] = parseInt(v[1], 10) || 0; // supports short notation, e.g. "9" instead of "9.0.0"
    v[2] = parseInt(v[2], 10) || 0;
    return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
  }

  /* Cross-browser dynamic CSS creation
    - Based on Bobby van der Sluis' solution: http://www.bobbyvandersluis.com/articles/dynamicCSS.php
  */
  function createCSS(sel, decl, media, newStyle) {
    if (ua.ie && ua.mac) { return; }
    var h = doc.getElementsByTagName("head")[0];
    if (!h) { return; } // to also support badly authored HTML pages that lack a head element
    var m = (media && typeof media == "string") ? media : "screen";
    if (newStyle) {
      dynamicStylesheet = null;
      dynamicStylesheetMedia = null;
    }
    if (!dynamicStylesheet || dynamicStylesheetMedia != m) {
      // create dynamic stylesheet + get a global reference to it
      var s = createElement("style");
      s.setAttribute("type", "text/css");
      s.setAttribute("media", m);
      dynamicStylesheet = h.appendChild(s);
      if (ua.ie && ua.win && typeof doc.styleSheets != UNDEF && doc.styleSheets.length > 0) {
        dynamicStylesheet = doc.styleSheets[doc.styleSheets.length - 1];
      }
      dynamicStylesheetMedia = m;
    }
    // add style rule
    if (ua.ie && ua.win) {
      if (dynamicStylesheet && typeof dynamicStylesheet.addRule == OBJECT) {
        dynamicStylesheet.addRule(sel, decl);
      }
    }
    else {
      if (dynamicStylesheet && typeof doc.createTextNode != UNDEF) {
        dynamicStylesheet.appendChild(doc.createTextNode(sel + " {" + decl + "}"));
      }
    }
  }

  function setVisibility(id, isVisible) {
    if (!autoHideShow) { return; }
    var v = isVisible ? "visible" : "hidden";
    if (isDomLoaded && getElementById(id)) {
      getElementById(id).style.visibility = v;
    }
    else {
      createCSS("#" + id, "visibility:" + v);
    }
  }

  /* Filter to avoid XSS attacks
  */
  function urlEncodeIfNecessary(s) {
    var regex = /[\\\"<>\.;]/;
    var hasBadChars = regex.exec(s) != null;
    return hasBadChars && typeof encodeURIComponent != UNDEF ? encodeURIComponent(s) : s;
  }

  /* Release memory to avoid memory leaks caused by closures, fix hanging audio/video threads and force open sockets/NetConnections to disconnect (Internet Explorer only)
  */
  var cleanup = function() {
    if (ua.ie && ua.win) {
      window.attachEvent("onunload", function() {
        // remove listeners to avoid memory leaks
        var ll = listenersArr.length;
        for (var i = 0; i < ll; i++) {
          listenersArr[i][0].detachEvent(listenersArr[i][1], listenersArr[i][2]);
        }
        // cleanup dynamically embedded objects to fix audio/video threads and force open sockets and NetConnections to disconnect
        var il = objIdArr.length;
        for (var j = 0; j < il; j++) {
          removeSWF(objIdArr[j]);
        }
        // cleanup library's main closures to avoid memory leaks
        for (var k in ua) {
          ua[k] = null;
        }
        ua = null;
        for (var l in swfobject) {
          swfobject[l] = null;
        }
        swfobject = null;
      });
    }
  }();

  return {
    /* Public API
      - Reference: http://code.google.com/p/swfobject/wiki/documentation
    */
    registerObject: function(objectIdStr, swfVersionStr, xiSwfUrlStr, callbackFn) {
      if (ua.w3 && objectIdStr && swfVersionStr) {
        var regObj = {};
        regObj.id = objectIdStr;
        regObj.swfVersion = swfVersionStr;
        regObj.expressInstall = xiSwfUrlStr;
        regObj.callbackFn = callbackFn;
        regObjArr[regObjArr.length] = regObj;
        setVisibility(objectIdStr, false);
      }
      else if (callbackFn) {
        callbackFn({success:false, id:objectIdStr});
      }
    },

    getObjectById: function(objectIdStr) {
      if (ua.w3) {
        return getObjectById(objectIdStr);
      }
    },

    embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, callbackFn) {
      var callbackObj = {success:false, id:replaceElemIdStr};
      if (ua.w3 && !(ua.wk && ua.wk < 312) && swfUrlStr && replaceElemIdStr && widthStr && heightStr && swfVersionStr) {
        setVisibility(replaceElemIdStr, false);
        addDomLoadEvent(function() {
          widthStr += ""; // auto-convert to string
          heightStr += "";
          var att = {};
          if (attObj && typeof attObj === OBJECT) {
            for (var i in attObj) { // copy object to avoid the use of references, because web authors often reuse attObj for multiple SWFs
              att[i] = attObj[i];
            }
          }
          att.data = swfUrlStr;
          att.width = widthStr;
          att.height = heightStr;
          var par = {};
          if (parObj && typeof parObj === OBJECT) {
            for (var j in parObj) { // copy object to avoid the use of references, because web authors often reuse parObj for multiple SWFs
              par[j] = parObj[j];
            }
          }
          if (flashvarsObj && typeof flashvarsObj === OBJECT) {
            for (var k in flashvarsObj) { // copy object to avoid the use of references, because web authors often reuse flashvarsObj for multiple SWFs
              if (typeof par.flashvars != UNDEF) {
                par.flashvars += "&" + k + "=" + flashvarsObj[k];
              }
              else {
                par.flashvars = k + "=" + flashvarsObj[k];
              }
            }
          }
          if (hasPlayerVersion(swfVersionStr)) { // create SWF
            var obj = createSWF(att, par, replaceElemIdStr);
            if (att.id == replaceElemIdStr) {
              setVisibility(replaceElemIdStr, true);
            }
            callbackObj.success = true;
            callbackObj.ref = obj;
          }
          else if (xiSwfUrlStr && canExpressInstall()) { // show Adobe Express Install
            att.data = xiSwfUrlStr;
            showExpressInstall(att, par, replaceElemIdStr, callbackFn);
            return;
          }
          else { // show alternative content
            setVisibility(replaceElemIdStr, true);
          }
          if (callbackFn) { callbackFn(callbackObj); }
        });
      }
      else if (callbackFn) { callbackFn(callbackObj); }
    },

    switchOffAutoHideShow: function() {
      autoHideShow = false;
    },

    ua: ua,

    getFlashPlayerVersion: function() {
      return { major:ua.pv[0], minor:ua.pv[1], release:ua.pv[2] };
    },

    hasFlashPlayerVersion: hasPlayerVersion,

    createSWF: function(attObj, parObj, replaceElemIdStr) {
      if (ua.w3) {
        return createSWF(attObj, parObj, replaceElemIdStr);
      }
      else {
        return undefined;
      }
    },

    showExpressInstall: function(att, par, replaceElemIdStr, callbackFn) {
      if (ua.w3 && canExpressInstall()) {
        showExpressInstall(att, par, replaceElemIdStr, callbackFn);
      }
    },

    removeSWF: function(objElemIdStr) {
      if (ua.w3) {
        removeSWF(objElemIdStr);
      }
    },

    createCSS: function(selStr, declStr, mediaStr, newStyleBoolean) {
      if (ua.w3) {
        createCSS(selStr, declStr, mediaStr, newStyleBoolean);
      }
    },

    addDomLoadEvent: addDomLoadEvent,

    addLoadEvent: addLoadEvent,

    getQueryParamValue: function(param) {
      var q = doc.location.search || doc.location.hash;
      if (q) {
        if (/\?/.test(q)) { q = q.split("?")[1]; } // strip question mark
        if (param == null) {
          return urlEncodeIfNecessary(q);
        }
        var pairs = q.split("&");
        for (var i = 0; i < pairs.length; i++) {
          if (pairs[i].substring(0, pairs[i].indexOf("=")) == param) {
            return urlEncodeIfNecessary(pairs[i].substring((pairs[i].indexOf("=") + 1)));
          }
        }
      }
      return "";
    },

    // For internal usage only
    expressInstallCallback: function() {
      if (isExpressInstallActive) {
        var obj = getElementById(EXPRESS_INSTALL_ID);
        if (obj && storedAltContent) {
          obj.parentNode.replaceChild(storedAltContent, obj);
          if (storedAltContentId) {
            setVisibility(storedAltContentId, true);
            if (ua.ie && ua.win) { storedAltContent.style.display = "block"; }
          }
          if (storedCallbackFn) { storedCallbackFn(storedCallbackObj); }
        }
        isExpressInstallActive = false;
      }
    }
  };
}();
;
/* http://keith-wood.name/countdown.html
   Countdown for jQuery v1.5.5.
   Written by Keith Wood (kbwood{at}iinet.com.au) January 2008.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
   Please attribute the author if you use it. */
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('(A($){A 1i(){8.1B=[];8.1B[\'\']={1j:[\'2t\',\'2u\',\'2v\',\'2w\',\'2x\',\'2y\',\'2z\'],2A:[\'2B\',\'2C\',\'2D\',\'2E\',\'2F\',\'2G\',\'2H\'],1k:[\'y\',\'m\',\'w\',\'d\'],1C:\':\',1R:1e};8.1f={1S:E,1T:E,1U:E,1V:E,1W:\'2I\',1l:\'\',1X:1e,1D:\'\',1Y:\'\',1Z:\'\',20:1e,21:E,22:E};$.1t(8.1f,8.1B[\'\'])}x w=\'G\';x Y=0;x O=1;x W=2;x D=3;x H=4;x M=5;x S=6;$.1t(1i.23,{1m:\'2J\',2K:2L(A(){$.G.25()},2M),18:[],2N:A(a){8.1E(8.1f,a);1F(8.1f,a||{})},1G:A(a,b,c,e,f,g,h,i){B(1n b==\'2O\'&&b.2P==Q){i=b.1H();h=b.1I();g=b.1J();f=b.1K();e=b.T();c=b.15();b=b.16()}x d=P Q();d.2Q(b);d.26(1);d.2R(c||0);d.26(e||1);d.2S(f||0);d.2T((g||0)-(U.2U(a)<30?a*1g:a));d.2V(h||0);d.2W(i||0);C d},2X:A(a,b){B(!b){C $.G.1f}x c=$.V(a,w);C(b==\'2Y\'?c.X:c.X[b])},27:A(a,b){x c=$(a);B(c.28(8.1m)){C}c.2Z(8.1m);x d={X:$.1t({},b),z:[0,0,0,0,0,0,0]};$.V(a,w,d);8.29(a)},1L:A(a){B(!8.1M(a)){8.18.31(a)}},1M:A(a){C($.33(a,8.18)>-1)},1u:A(b){8.18=$.34(8.18,A(a){C(a==b?E:a)})},25:A(){19(x i=0;i<8.18.1v;i++){8.1o(8.18[i])}},1o:A(a,b){x c=$(a);b=b||$.V(a,w);B(!b){C}c.35(8.2a(b));c[(8.F(b,\'1R\')?\'36\':\'37\')+\'38\'](\'39\');x d=8.F(b,\'22\');B(d){d.1p(a,[b.R!=\'2b\'?b.z:8.1w(b,b.I,P Q())])}x e=b.R!=\'1q\'&&(b.J?b.1a.K()<=b.J.K():b.1a.K()>=b.Z.K());B(e&&!b.1N){b.1N=2c;B(8.1M(a)||8.F(b,\'20\')){8.1u(a);x f=8.F(b,\'21\');B(f){f.1p(a,[])}x g=8.F(b,\'1Z\');B(g){x h=8.F(b,\'1l\');b.X.1l=g;8.1o(a,b);b.X.1l=h}x i=8.F(b,\'1Y\');B(i){3a.3b=i}}b.1N=1e}1r B(b.R==\'1q\'){8.1u(a)}$.V(a,w,b)},29:A(a,b,c){b=b||{};B(1n b==\'1O\'){x d=b;b={};b[d]=c}x e=$.V(a,w);B(e){8.1E(e.X,b);1F(e.X,b);8.2d(a,e);$.V(a,w,e);x f=P Q();B((e.J&&e.J<f)||(e.Z&&e.Z>f)){8.1L(a)}8.1o(a,e)}},1E:A(a,b){x c=1e;19(x n 1P b){B(n.N(/[2e]2f/)){c=2c;17}}B(c){19(x n 1P a){B(n.N(/[2e]2f[0-9]/)){a[n]=E}}}},2d:A(a,b){x c=8.F(b,\'1V\');c=(c?c.1p(a,[]):E);x d=P Q();x e=8.F(b,\'1U\');e=(e==E?-d.3c():e);b.J=8.F(b,\'1T\');B(b.J){b.J=8.1G(e,8.1x(b.J,E));B(b.J&&c){b.J.1y(b.J.1H()+d.K()-c.K())}}b.Z=8.1G(e,8.1x(8.F(b,\'1S\'),d));B(c){b.Z.1y(b.Z.1H()+d.K()-c.K())}b.I=8.2g(b)},3d:A(a){x b=$(a);B(!b.28(8.1m)){C}8.1u(a);b.3e(8.1m).3f();$.3g(a,w)},3h:A(a){8.R(a,\'1q\')},3i:A(a){8.R(a,\'2b\')},3j:A(a){8.R(a,E)},R:A(a,b){x c=$.V(a,w);B(c){B(c.R==\'1q\'&&!b){c.z=c.2h;x d=(c.J?\'-\':\'+\');c[c.J?\'J\':\'Z\']=8.1x(d+c.z[0]+\'y\'+d+c.z[1]+\'o\'+d+c.z[2]+\'w\'+d+c.z[3]+\'d\'+d+c.z[4]+\'h\'+d+c.z[5]+\'m\'+d+c.z[6]+\'s\');8.1L(a)}c.R=b;c.2h=(b==\'1q\'?c.z:E);$.V(a,w,c);8.1o(a,c)}},3k:A(a){x b=$.V(a,w);C(!b?E:(!b.R?b.z:8.1w(b,b.I,P Q())))},F:A(a,b){C(a.X[b]!=E?a.X[b]:$.G.1f[b])},1x:A(k,l){x m=A(a){x b=P Q();b.2i(b.K()+a*11);C b};x n=A(a){a=a.3l();x b=P Q();x c=b.16();x d=b.15();x e=b.T();x f=b.1K();x g=b.1J();x h=b.1I();x i=/([+-]?[0-9]+)\\s*(s|m|h|d|w|o|y)?/g;x j=i.2j(a);3m(j){3n(j[2]||\'s\'){1b\'s\':h+=1c(j[1],10);17;1b\'m\':g+=1c(j[1],10);17;1b\'h\':f+=1c(j[1],10);17;1b\'d\':e+=1c(j[1],10);17;1b\'w\':e+=1c(j[1],10)*7;17;1b\'o\':d+=1c(j[1],10);e=U.1z(e,$.G.1h(c,d));17;1b\'y\':c+=1c(j[1],10);e=U.1z(e,$.G.1h(c,d));17}j=i.2j(a)}C P Q(c,d,e,f,g,h,0)};x o=(k==E?l:(1n k==\'1O\'?n(k):(1n k==\'3o\'?m(k):k)));B(o)o.1y(0);C o},1h:A(a,b){C 32-P Q(a,b,32).T()},2a:A(c){c.z=13=(c.R?c.z:8.1w(c,c.I,P Q()));x d=1e;x e=0;19(x f=0;f<c.I.1v;f++){d|=(c.I[f]==\'?\'&&13[f]>0);c.I[f]=(c.I[f]==\'?\'&&!d?E:c.I[f]);e+=(c.I[f]?1:0)}x g=8.F(c,\'1X\');x h=8.F(c,\'1l\');x i=(g?8.F(c,\'1k\'):8.F(c,\'1j\'));x j=8.F(c,\'1C\');x k=8.F(c,\'1D\')||\'\';x l=A(a){x b=$.G.F(c,\'1k\'+13[a]);C(c.I[a]?13[a]+(b?b[a]:i[a])+\' \':\'\')};x m=A(a){x b=$.G.F(c,\'1j\'+13[a]);C(c.I[a]?\'<14 1s="3p"><14 1s="2k">\'+13[a]+\'</14><3q/>\'+(b?b[a]:i[a])+\'</14>\':\'\')};C(h?8.2l(c,h,g):((g?\'<14 1s="1Q 2k\'+(c.R?\' 2m\':\'\')+\'">\'+l(Y)+l(O)+l(W)+l(D)+(c.I[H]?8.L(13[H],2):\'\')+(c.I[M]?(c.I[H]?j:\'\')+8.L(13[M],2):\'\')+(c.I[S]?(c.I[H]||c.I[M]?j:\'\')+8.L(13[S],2):\'\'):\'<14 1s="1Q 3r\'+e+(c.R?\' 2m\':\'\')+\'">\'+m(Y)+m(O)+m(W)+m(D)+m(H)+m(M)+m(S))+\'</14>\'+(k?\'<14 1s="1Q 3s">\'+k+\'</14>\':\'\')))},2l:A(c,d,e){x f=8.F(c,(e?\'1k\':\'1j\'));x g=A(a){C($.G.F(c,(e?\'1k\':\'1j\')+c.z[a])||f)[a]};x h=A(a,b){C U.1A(a/b)%10};x j={3t:8.F(c,\'1D\'),3u:8.F(c,\'1C\'),3v:g(Y),3w:c.z[Y],3x:8.L(c.z[Y],2),3y:8.L(c.z[Y],3),3z:h(c.z[Y],1),3A:h(c.z[Y],10),3B:h(c.z[Y],1d),3C:h(c.z[Y],11),3D:g(O),3E:c.z[O],3F:8.L(c.z[O],2),3G:8.L(c.z[O],3),3H:h(c.z[O],1),3I:h(c.z[O],10),3J:h(c.z[O],1d),3K:h(c.z[O],11),3L:g(W),3M:c.z[W],3N:8.L(c.z[W],2),3O:8.L(c.z[W],3),3P:h(c.z[W],1),3Q:h(c.z[W],10),3R:h(c.z[W],1d),3S:h(c.z[W],11),3T:g(D),3U:c.z[D],3V:8.L(c.z[D],2),3W:8.L(c.z[D],3),3X:h(c.z[D],1),3Y:h(c.z[D],10),3Z:h(c.z[D],1d),40:h(c.z[D],11),41:g(H),42:c.z[H],43:8.L(c.z[H],2),44:8.L(c.z[H],3),45:h(c.z[H],1),46:h(c.z[H],10),47:h(c.z[H],1d),48:h(c.z[H],11),49:g(M),4a:c.z[M],4b:8.L(c.z[M],2),4c:8.L(c.z[M],3),4d:h(c.z[M],1),4e:h(c.z[M],10),4f:h(c.z[M],1d),4g:h(c.z[M],11),4h:g(S),4i:c.z[S],4j:8.L(c.z[S],2),4k:8.L(c.z[S],3),4l:h(c.z[S],1),4m:h(c.z[S],10),4n:h(c.z[S],1d),4o:h(c.z[S],11)};x k=d;19(x i=0;i<7;i++){x l=\'4p\'.4q(i);x m=P 2n(\'\\\\{\'+l+\'<\\\\}(.*)\\\\{\'+l+\'>\\\\}\',\'g\');k=k.2o(m,(c.I[i]?\'$1\':\'\'))}$.2p(j,A(n,v){x a=P 2n(\'\\\\{\'+n+\'\\\\}\',\'g\');k=k.2o(a,v)});C k},L:A(a,b){a=\'\'+a;B(a.1v>=b){C a}a=\'4r\'+a;C a.4s(a.1v-b)},2g:A(a){x b=8.F(a,\'1W\');x c=[];c[Y]=(b.N(\'y\')?\'?\':(b.N(\'Y\')?\'!\':E));c[O]=(b.N(\'o\')?\'?\':(b.N(\'O\')?\'!\':E));c[W]=(b.N(\'w\')?\'?\':(b.N(\'W\')?\'!\':E));c[D]=(b.N(\'d\')?\'?\':(b.N(\'D\')?\'!\':E));c[H]=(b.N(\'h\')?\'?\':(b.N(\'H\')?\'!\':E));c[M]=(b.N(\'m\')?\'?\':(b.N(\'M\')?\'!\':E));c[S]=(b.N(\'s\')?\'?\':(b.N(\'S\')?\'!\':E));C c},1w:A(f,g,h){f.1a=h;f.1a.1y(0);x i=P Q(f.1a.K());B(f.J){B(h.K()<f.J.K()){f.1a=h=i}1r{h=f.J}}1r{i.2i(f.Z.K());B(h.K()>f.Z.K()){f.1a=h=i}}x j=[0,0,0,0,0,0,0];B(g[Y]||g[O]){x k=$.G.1h(h.16(),h.15());x l=$.G.1h(i.16(),i.15());x m=(i.T()==h.T()||(i.T()>=U.1z(k,l)&&h.T()>=U.1z(k,l)));x n=A(a){C(a.1K()*1g+a.1J())*1g+a.1I()};x o=U.4t(0,(i.16()-h.16())*12+i.15()-h.15()+((i.T()<h.T()&&!m)||(m&&n(i)<n(h))?-1:0));j[Y]=(g[Y]?U.1A(o/12):0);j[O]=(g[O]?o-j[Y]*12:0);x p=A(a,b,c){x d=(a.T()==c);x e=$.G.1h(a.16()+b*j[Y],a.15()+b*j[O]);B(a.T()>e){a.2q(e)}a.4u(a.16()+b*j[Y]);a.4v(a.15()+b*j[O]);B(d){a.2q(e)}C a};B(f.J){i=p(i,-1,l)}1r{h=p(P Q(h.K()),+1,k)}}x q=U.1A((i.K()-h.K())/11);x r=A(a,b){j[a]=(g[a]?U.1A(q/b):0);q-=j[a]*b};r(W,4w);r(D,4x);r(H,4y);r(M,1g);r(S,1);B(q>0&&!f.J){x s=[1,12,4.4z,7,24,1g,1g];x t=S;x u=1;19(x v=S;v>=Y;v--){B(g[v]){B(j[t]>=u){j[t]=0;q=1}B(q>0){j[v]++;q=0;t=v;u=1}}u*=s[v]}}C j}});A 1F(a,b){$.1t(a,b);19(x c 1P b){B(b[c]==E){a[c]=E}}C a}$.4A.G=A(a){x b=4B.23.4C.4D(4E,1);B(a==\'4F\'||a==\'4G\'){C $.G[\'2r\'+a+\'1i\'].1p($.G,[8[0]].2s(b))}C 8.2p(A(){B(1n a==\'1O\'){$.G[\'2r\'+a+\'1i\'].1p($.G,[8].2s(b))}1r{$.G.27(8,a)}})};$.G=P 1i()})(4H);',62,292,'||||||||this|||||||||||||||||||||||||var||_periods|function|if|return||null|_get|countdown||_show|_since|getTime|_minDigits||match||new|Date|_hold||getDate|Math|data||options||_until||1000||periods|span|getMonth|getFullYear|break|_timerTargets|for|_now|case|parseInt|100|false|_defaults|60|_getDaysInMonth|Countdown|labels|compactLabels|layout|markerClassName|typeof|_updateCountdown|apply|pause|else|class|extend|_removeTarget|length|_calculatePeriods|_determineTime|setMilliseconds|min|floor|regional|timeSeparator|description|_resetExtraLabels|extendRemove|UTCDate|getMilliseconds|getSeconds|getMinutes|getHours|_addTarget|_hasTarget|_expiring|string|in|countdown_row|isRTL|until|since|timezone|serverSync|format|compact|expiryUrl|expiryText|alwaysExpire|onExpiry|onTick|prototype||_updateTargets|setUTCDate|_attachCountdown|hasClass|_changeCountdown|_generateHTML|lap|true|_adjustSettings|Ll|abels|_determineShow|_savePeriods|setTime|exec|countdown_amount|_buildLayout|countdown_holding|RegExp|replace|each|setDate|_|concat|Years|Months|Weeks|Days|Hours|Minutes|Seconds|labels1|Year|Month|Week|Day|Hour|Minute|Second|dHMS|hasCountdown|_timer|setInterval|980|setDefaults|object|constructor|setUTCFullYear|setUTCMonth|setUTCHours|setUTCMinutes|abs|setUTCSeconds|setUTCMilliseconds|_settingsCountdown|all|addClass||push||inArray|map|html|add|remove|Class|countdown_rtl|window|location|getTimezoneOffset|_destroyCountdown|removeClass|empty|removeData|_pauseCountdown|_lapCountdown|_resumeCountdown|_getTimesCountdown|toLowerCase|while|switch|number|countdown_section|br|countdown_show|countdown_descr|desc|sep|yl|yn|ynn|ynnn|y1|y10|y100|y1000|ol|on|onn|onnn|o1|o10|o100|o1000|wl|wn|wnn|wnnn|w1|w10|w100|w1000|dl|dn|dnn|dnnn|d1|d10|d100|d1000|hl|hn|hnn|hnnn|h1|h10|h100|h1000|ml|mn|mnn|mnnn|m1|m10|m100|m1000|sl|sn|snn|snnn|s1|s10|s100|s1000|yowdhms|charAt|0000000000|substr|max|setFullYear|setMonth|604800|86400|3600|3482|fn|Array|slice|call|arguments|getTimes|settings|jQuery'.split('|'),0,{}));
function saveAddClient(location, formId, callback)
{
  if ($("#AddClientButton").attr("disabled") == true)
    return;

  currentValidationForm = formId;
  var form = eval("document."+formId);
  if (eval("_CF_check"+formId)(form) == false)
  {
    $("#addClientTableHeader").addClass('error_message');
    return false;
  }

  $("#AddClientButton").attr("disabled","disabled");
  var ajaxAdapterTmp = new AJAXAdapter();
  ajaxAdapterTmp.setParametersFromForm(formId);
  ajaxAdapterTmp.setAJAXReturnFormat('xml');
  //Note: Add client is a popup window but with its own application page GUID
  // We need to pass the correct application page GUID and not the one from the "parent" page
  // AJAX will automatically post to server the application page GUID value from the environment object
  var crtApplicationPageGUID = environment.GetPageFlag("ApplicationPageGUID");
  environment.SetPageFlag("ApplicationPageGUID", $('#addClientForm > #AddClientPageGUID').val());
  OpenProgressDlg();
  ajaxAdapterTmp.call(location, callback);
  // restore the correct application page GUID
  environment.SetPageFlag("ApplicationPageGUID", crtApplicationPageGUID);
}

function saveAddClientConfirmation(location, formId, callback) {
    $("#AddClientButton").attr("disabled", "disabled");
    var ajaxAdapterTmp = new AJAXAdapter();
    ajaxAdapterTmp.setParametersFromForm(formId);
    ajaxAdapterTmp.setAJAXReturnFormat('xml');
    //Note: Add client is a popup window but with its own application page GUID
    // We need to pass the correct application page GUID and not the one from the "parent" page
    // AJAX will automatically post to server the application page GUID value from the environment object
    var crtApplicationPageGUID = environment.GetPageFlag("ApplicationPageGUID");
    environment.SetPageFlag("ApplicationPageGUID", $('#' + formId + ' > #AddClientPageGUID').val());
    OpenProgressDlg();
    ajaxAdapterTmp.call(location, callback);
    // restore the correct application page GUID
    environment.SetPageFlag("ApplicationPageGUID", crtApplicationPageGUID);
}

function saveAddClient_callback(xmlData)
{
    try{
        if (!checkXML(xmlData))
        {
            return false;
        }

        CLIENTSELLERTYPE = getXMLNodeValue(xmlData.getElementsByTagName('CLIENTSELLERTYPE')[0].firstChild).toLowerCase();
        USERGROUPGUID = getXMLNodeValue(xmlData.getElementsByTagName('USERGROUPGUID')[0].firstChild);
        USERGROUPDESCRIPTION = getXMLNodeValue(xmlData.getElementsByTagName('USERGROUPDESCRIPTION')[0].firstChild);
        PAGEGUID = getXMLNodeValue(xmlData.getElementsByTagName('PAGEGUID')[0].firstChild);
        CloseProgressDlg();
        navigateClientDashboard(environment.ApplicationPath + PAGEGUID, USERGROUPGUID, USERGROUPDESCRIPTION, null, CLIENTSELLERTYPE);
    } catch (e) {
        try {
            var htmlContent = getXMLNodeValue(xmlData.getElementsByTagName('htmlContent')[0].firstChild);
            $("#popup_content").html(htmlContent.replace('callbackPlaceholder', 'saveAddClient_callback'));
        } catch (ex) {
        }
    }
}

function ajaxClientSearchResults(){
  var ajax_load = "<img src='/cdn/images/spinner.gif'>";
  var loadUrl = "/index.cfm/event/agent.ajaxClientSearchResults/UserGroupGUID/";
  var ajaxTmp = new AJAXAdapter();

  $('.countSearchResultsUpdate').each(function(i) {
    var userGroupGUID = $(this).parents('.UserGroupGUID').attr('id');

    var loadUrlData = loadUrl + userGroupGUID;

      $(this).html(ajax_load);
    var ajaxTmp = new AJAXAdapter()
    ajaxTmp.setAJAXCallType("GET");
    ajaxTmp.setAJAXCache(false);
    ajaxTmp.setAJAXReturnFormat("json");
    ajaxTmp.call(loadUrlData, ajaxClientSearchResults_callback);
  });

  ajaxTmp.setAJAXReturnFormat("json");
  ajaxTmp.call(loadUrl, ajaxClientSearchResults_callback);
}

function ajaxClientSearchResults_callback(jsonData){
  $("#countSearchResults_" + jsonData.UserGroupGUID).html(jsonData.CountSearchResults);
};
//calendar
function LBCalendar( _today )
{
  this.today = _today || new Date(); //if today comes from DB
  this.selected = this.today;
  this.year = this.today.getFullYear();
  this.initMonthNames();
  this.monthDays = [];
  this.initMonthDays(this.year);
  this.initWeekDays();
  this.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "January"];
  this.monthNames[-1] = "December";
  this.headerLength = 3;
  this.showMonthAbove = false;
  this.showMonthAndArrows = false;
  this.checkForEmptyRows = false;
  this.viewSetting = 0;
  this.calendarID = '';
  this.selectDayFn = null;
  this.changeMonthFn = null;
  this.markSelectedDate = false;
  this.isDatePicker = false;
  this.isPastDisabled = false;
  this.isFutureDisabled = false;
  this.referenceDate = this.today;
  this.referenceDateFuture = this.today;
  this.enableOnlySelectedDates = null;
}

LBCalendar.prototype.getDaysArray = LBCalendar_getDaysArray;
LBCalendar.prototype.initMonthNames = LBCalendar_initMonthNames;
LBCalendar.prototype.initMonthDays = LBCalendar_initMonthDays;
LBCalendar.prototype.initWeekDays = LBCalendar_initWeekDays;
LBCalendar.prototype.getMonthHtml = LBCalendar_getMonthHtml;
LBCalendar.prototype.setHeaderLength = LBCalendar_setHeaderLength;
LBCalendar.prototype.fillContainer = LBCalendar_fillContainer;
LBCalendar.prototype.displayAboveHeader = LBCalendar_displayAboveHeader;
LBCalendar.prototype.fillNextMonth = LBCalendar_fillNextMonth;
LBCalendar.prototype.fillNextMonthEx = LBCalendar_fillNextMonthEx;
LBCalendar.prototype.getMonthDays = LBCalendar_getMonthDays;
LBCalendar.prototype.getCurretDisplayInfo = LBCalendar_getCurretDisplayInfo;
LBCalendar.prototype.getMockRow = LBCalendar_getMockRow;
LBCalendar.prototype.getFormattedString = LBCalendar_getFormattedString;
LBCalendar.prototype.fillWeekContainer = LBCalendar_fillWeekContainer;
LBCalendar.prototype.fillDayContainer = LBCalendar_fillDayContainer;
LBCalendar.prototype.getWeekHtml = LBCalendar_getWeekHtml;
LBCalendar.prototype.getDayHtml = LBCalendar_getDayHtml;
LBCalendar.prototype.getWeekArray = LBCalendar_getWeekArray;
LBCalendar.prototype.getDate = LBCalendar_getDate;
LBCalendar.prototype.getCurrentWeekDisplayInfo = LBCalendar_getCurrentWeekDisplayInfo;
LBCalendar.prototype.getCurrentDayDisplayInfo = LBCalendar_getCurrentDayDisplayInfo;
LBCalendar.prototype.fillMonthWithSavedSettings = LBCalendar_fillMonthWithSavedSettings;
LBCalendar.prototype.setSelectedDate = LBCalendar_setSelectedDate;
LBCalendar.prototype.getSelectedDate = LBCalendar_getSelectedDate;
LBCalendar.prototype.clearSelected = LBCalendar_clearSelected;
LBCalendar.prototype.setDisablePastDate = LBCalendar_setDisablePastDate;
LBCalendar.prototype.setDisableFutureDate = LBCalendar_setDisableFutureDate;
LBCalendar.prototype.markToday = LBCalendar_markToday;
LBCalendar.prototype.fixHeights = LBCalendar_fixHeights;
LBCalendar.prototype.selectFirstOfNextMonth = LBCalendar_selectFirstOfNextMonth;
LBCalendar.prototype.getNextDate = LBCalendar_getNextDate;
LBCalendar.prototype.buildDatePicker = LBCalendar_buildDatePicker;
LBCalendar.prototype.toggleDatePicker = LBCalendar_toggleDatePicker;
LBCalendar.prototype.setInternalMonthNavigation = LBCalendar_setInternalMonthNavigation;
LBCalendar.prototype.isContained = LBCalendar_isContained;
LBCalendar.prototype.getWeekCorrectYears = LBCalendar_getWeekCorrectYears;
LBCalendar.prototype.isPastDate = LBCalendar_isPastDate;
LBCalendar.prototype.isFutureDate = LBCalendar_isFutureDate;
LBCalendar.prototype.isDateInArray = LBCalendar_isDateInArray;
LBCalendar.prototype.setEnableOnlySelectedDates = LBCalendar_setEnableOnlySelectedDates;

//Returns true if the targetElement is an HTML element inside the calendar object
//Useful in the case of date picker when we need to close the date selector if the user clicks outside
function LBCalendar_isContained(targetElement){
  var theParents;
  // Note: if there is an ID available use it.
  // In the case the user clicks on month navigation buttons, the browser executes first onclick and the target
  // element (next/prev buttons) gets un-linked from DOM and the function will return that the element is not inside calendar picker
  if($(targetElement).attr('id') == '')
    theParents = $(targetElement).parents();
  else
    theParents = $('#' + $(targetElement).attr('id')).parents();
  var theParentsLen = theParents.length;
  var bInside = false;
  var bStop = false;
  var crtElement = 0;
  var calendarContainers = [this.calendarID];
  var calContainersLen = calendarContainers.length;
  while((crtElement < theParentsLen) && (! bStop)){
    var elemID = $(theParents[crtElement]).attr('id');
    for(var idx = 0; idx < calContainersLen; idx++){
      if(elemID == calendarContainers[idx]){
        bInside = true;
        bStop = true;
      }
    }
    crtElement++;
  }
  return bInside;
}

function LBCalendar_buildDatePicker( _containerID, _selectDayCallback){
  this.isDatePicker = true;
  var html = '';
  // for date picker always the selected date should be marked
  this.markSelectedDate = true;
  this.calendarID = _containerID;

  // make sure to set the environment date picker object
  environment.SetPageFlag(this.calendarID, this);

  this.setInternalMonthNavigation();
  this.selectDayFn = _selectDayCallback;

  html = '<div id="' + _containerID + '-picker" class="datePickerContainer" onclick="environment.GetPageFlag(\'' + this.calendarID + '\').toggleDatePicker();">' +
    '<span id="' + _containerID + '-selectedDate">'+ this.getFormattedString(this.selected)+'</span>' +
    '</div>' +
    '<div id="' + _containerID + '-Container" class="datePickerSelector" style="display:none;">' +
      '<div id="' + _containerID + '-datePickerTop" class="datePickerTop"></div>' +
      '<div id="' + _containerID + 'datePicker" class="datePickerSlice"></div>' +
      '<div id="' + _containerID + '-datePickerBottom" class="datePickerBottom">' +
    '</div>';
  $('#' + _containerID).html(html);

  this.displayAboveHeader(2);//show month and arrows
  this.setHeaderLength(2); //only see first 3 letters
  this.fillContainer(this.calendarID + 'datePicker',this.calendarID + '-CalendarContainer',this.selected.getMonth(),this.selected.getFullYear(), _selectDayCallback);
  this.setSelectedDate(this.selected.getFullYear(), this.selected.getMonth(), this.selected.getDate());
}

function LBCalendar_setDisablePastDate(_bool, _refDate){
  this.isPastDisabled = _bool;
  if (_refDate != undefined )
    this.referenceDate = _refDate;
}

function LBCalendar_setDisableFutureDate(_bool, _refDate){
  this.isFutureDisabled = _bool;
  if (_refDate != undefined )
    this.referenceDateFuture = _refDate;
}

function LBCalendar_toggleDatePicker(bShowHide)
{
  if(typeof(bShowHide) == 'undefined')
    $('#' + this.calendarID+'-Container').toggle();
  else
    $('#' + this.calendarID+'-Container').toggle(bShowHide);
}

function LBCalendar_fillContainer( _container, _id, _month, _year, _onClickFn )
{
  try
  {
    if (_container && _id)
    {
      var year = _year || this.year;
      var html = this.getMonthHtml(_id, _month, year, _onClickFn);
      $("#"+_container).html(html);
    }
  }
  catch (ex)
  {
    alert(ex.description);
  }
}

function LBCalendar_setInternalMonthNavigation(){
  // Instruct the calendar object to use the internal month navigation function
  // The original implementation was not 100% OO correct: the calendar object should not know/care about external functions
  // Also the fillNextMonth function of the calendar object should not be able to fill the container of another calendar
  this.changeMonthFn = "environment.GetPageFlag('" + this.calendarID + "').fillNextMonthEx";
}

function LBCalendar_fillWeekContainer( _container, _id, _date, _direction)
{
  if (_container && _id)
  {
    if (_direction)
      var html = this.getWeekHtml(_id, _date, _direction);
    else
      var html = this.getWeekHtml(_id, _date);
    $("#"+_container).html(html);
  }
}

function LBCalendar_fillDayContainer(_container, _id, _date)
{
  if (_container && _id)
  {
    var html = this.getDayHtml(_id, _date);
    $("#"+_container).html(html);
  }
}
function LBCalendar_setSelectedDate(_year, _month, _day)
{
  var oldDate = this.selected;
  this.selected = LBCalendar_getDate(_day, _month, _year);
  if (this.isDatePicker) {
  // make sure to mark selected date in the drop-down picker
    $('#' + this.calendarID + '-selectedDate').html(this.getFormattedString(this.selected));
    // un-mark previously selected date and mark the current one
    $('#' + this.calendarID + '-CalendarContainer_' + oldDate.getMonth() + '_' + oldDate.getDate()).removeClass('SelectedDate');
    $('#' + this.calendarID + '-CalendarContainer_' + this.selected.getMonth() + '_' + this.selected.getDate()).addClass('SelectedDate');
  }
}
function LBCalendar_getSelectedDate()
{
  return this.selected;
}
function LBCalendar_clearSelected()
{
  this.selected = this.today;
}

function LBCalendar_fillMonthWithSavedSettings(_id, _month, _year)
{
  var displayInfo = LBCalendar_getCurretDisplayInfo(_id); //can be called with this.getCurretDisplayInfo also. no difference.
  var savedViewSetting = this.viewSetting;
  var savedHeaderLen = this.headerLength;
  this.displayAboveHeader(displayInfo.viewSetting);
  this.setHeaderLength(displayInfo.headerLen);
  this.fillContainer(displayInfo.containerID, _id, _month, _year);
  //restore previous settings
  //this.checkForEmptyRows = savedEmptyRow;
  this.displayAboveHeader(savedViewSetting);
  this.setHeaderLength(savedHeaderLen);
}

function LBCalendar_fillNextMonth(_id, _direction, _onClickFn)
{
  //get the parent of id (which is its container), take attr viewSetting, month and year -> compute next month -> fill container with them
  try
  {
    var displayInfo = LBCalendar_getCurretDisplayInfo(_id); //can be called with this.getCurretDisplayInfo also. no difference.
    var savedViewSetting = this.viewSetting;
    var savedHeaderLen = this.headerLength;
    //var savedEmptyRow = this.checkForEmptyRows;
    //this.checkForEmptyRows = displayInfo.checkForEmptyRows;
    this.displayAboveHeader(displayInfo.viewSetting);
    this.setHeaderLength(displayInfo.headerLen);
    var nextDateInfo = this.getNextDate(displayInfo, _direction, 'month');

    this.fillContainer(displayInfo.containerID, _id, nextDateInfo.month, nextDateInfo.year, _onClickFn);
    //restore previous settings
    //this.checkForEmptyRows = savedEmptyRow;
    this.displayAboveHeader(savedViewSetting);
    this.setHeaderLength(savedHeaderLen);
  }
  catch (ex)
  {
    alert(ex.description);
  }
}

// The filleNextMonthEx function does not care about any external calendar container ID (it populates its own container)
function LBCalendar_fillNextMonthEx(_direction)
{
  var _id2 = this.calendarID + '-CalendarContainer';
  //get the parent of id (which is its container), take attr viewSetting, month and year -> compute next month -> fill container with them
  try
  {
    //
    var displayInfo = LBCalendar_getCurretDisplayInfo(_id2); //can be called with this.getCurretDisplayInfo also. no difference.
    var savedViewSetting = this.viewSetting;
    var savedHeaderLen = this.headerLength;
    //var savedEmptyRow = this.checkForEmptyRows;
    //this.checkForEmptyRows = displayInfo.checkForEmptyRows;
    this.displayAboveHeader(displayInfo.viewSetting);
    this.setHeaderLength(displayInfo.headerLen);
    var nextDateInfo = this.getNextDate(displayInfo, _direction, 'month');
    this.fillContainer(displayInfo.containerID, _id2, nextDateInfo.month, nextDateInfo.year, this.selectDayFn);
    //restore previous settings
    //this.checkForEmptyRows = savedEmptyRow;
    this.displayAboveHeader(savedViewSetting);
    this.setHeaderLength(savedHeaderLen);
  }
  catch (ex)
  {
    alert(ex.description);
  }
}

function LBCalendar_getNextDate(_dInfo, _direction, _unit)
{
  var currentDate = new Date();
  var monthToDisplay = 0;
  var yearToDisplay = currentDate.getFullYear();
  var dayToDisplay = 1;
  switch (_unit)
  {
    case 'month':
    {
      monthDifference = _dInfo.month + _direction;
      monthToDisplay = monthDifference;
      yearToDisplay = _dInfo.year;
      if (Math.floor(monthDifference/12) != 0)
      {
        yearToDisplay += (monthDifference/Math.abs(monthDifference));
        if (_direction < 0)
          monthToDisplay = 12 + monthDifference % 12;
        else
          monthToDisplay = monthDifference % 12;
      }
      dayToDisplay = 1;
    }
    break;
    case 'day':
    {

    }
    break;
    case 'week':
    {

    }
    break;
  }

  var nextDate = {};
  nextDate.month = monthToDisplay;
  nextDate.year = yearToDisplay;
  nextDate.day = dayToDisplay;
  return nextDate;
}

function LBCalendar_selectFirstOfNextMonth(_id, _direction)
{
  var displayInfo = LBCalendar_getCurretDisplayInfo(_id); //can be called with this.getCurretDisplayInfo also. no difference.
  var nextDateInfo = this.getNextDate(displayInfo, _direction, 'month');
  this.setSelectedDate(nextDateInfo.year, nextDateInfo.month, nextDateInfo.day);
}

function LBCalendar_getCurrentWeekDisplayInfo(_id)
{
  var displayInfo = null;
  try
  {
    var container = $('#'+_id).parent()[0];
    var containerID = container.id;
    var firstMonth = parseInt($('#'+_id).attr('firstMonth'));
    var firstYear = parseInt($('#'+_id).attr('firstYear'));
    var firstDay = parseInt($('#'+_id).attr('firstDay'));
    var lastDay = parseInt($('#'+_id).attr('lastDay'));
    var lastYear = parseInt($('#'+_id).attr('lastYear'));
    var lastMonth = parseInt($('#'+_id).attr('lastMonth'));
    //var emptyRow = $('#'+_id).attr('checkForEmptyRow');
    displayInfo = {};
    displayInfo.firstMonth = firstMonth;
    displayInfo.firstYear = firstYear;
    displayInfo.firstDay = firstDay;
    displayInfo.lastDay = lastDay;
    displayInfo.lastMonth = lastMonth;
    displayInfo.lastYear = lastYear;
    displayInfo.containerID = containerID;
  }
  catch (ex)
  {
    alert(ex.description);
  }
  return displayInfo;
}

function LBCalendar_getCurretDisplayInfo(_id)
{
  var displayInfo = null;
  try
  {
    var container = $('#'+_id).parent()[0];
    var containerID = container.id;
    var viewSetting = parseInt($('#'+_id).attr('viewSetting'));
    var month = parseInt($('#'+_id).attr('month'));
    var year = parseInt($('#'+_id).attr('year'));
    var headerLen = parseInt($('#'+_id).attr('headerLen'));
    var lastNumber = parseInt($('#'+_id).attr('lastNumber'));
    //var emptyRow = $('#'+_id).attr('checkForEmptyRow');
    displayInfo = {};
    displayInfo.month = month;
    displayInfo.year = year;
    displayInfo.headerLen = headerLen;
    displayInfo.lastNumber = lastNumber;
    displayInfo.viewSetting = viewSetting;
    displayInfo.containerID = containerID;
  }
  catch (ex)
  {
    alert(ex.description);
  }
  return displayInfo;
}

function LBCalendar_getCurrentDayDisplayInfo(_id)
{
  var displayInfo = null;
  try
  {
    var container = $('#'+_id).parent()[0];
    var containerID = container.id;
    var viewSetting = parseInt($('#'+_id).attr('viewSetting'));
    var month = parseInt($('#'+_id).attr('month'));
    var year = parseInt($('#'+_id).attr('year'));
    var headerLen = parseInt($('#'+_id).attr('headerLen'));
    var day = parseInt($('#'+_id).attr('day'));
    //var emptyRow = $('#'+_id).attr('checkForEmptyRow');
    displayInfo = {};
    displayInfo.month = month;
    displayInfo.year = year;
    displayInfo.headerLen = headerLen;
    displayInfo.day = day;
    displayInfo.viewSetting = viewSetting;
    displayInfo.containerID = containerID;
  }
  catch (ex)
  {
    alert(ex.description);
  }
  return displayInfo;
}

function LBCalendar_getMonthHtml( _id, _month, _year, _onClickFn )
{
  var dayArrayAndLast = this.getDaysArray(_month, _year);
  var dayMatrix = dayArrayAndLast.dayMatrix;
  var lastNumer = dayArrayAndLast.lastNumer;
  var htmlOutput = '';
  var onClickFn = _onClickFn || 'calendar_changeSelectedDay';
  var onClickchangeMonthFn = '';
  if(this.changeMonthFn != null)
    onClickchangeMonthFn = this.changeMonthFn + '(';
  else
    onClickchangeMonthFn = 'calendar_changeMonth(\''+_id+'\', ';

  if (this.showMonthAndArrows)
  {
    htmlOutput += '<div class="calendar-textAboveHeader" id="'+_id + '_header">';
    var cMonth = this.referenceDate.getMonth();
    var cYear = this.referenceDate.getFullYear();
    if (this.isPastDisabled && _month <= cMonth && _year <= cYear) {
      htmlOutput += '<span id="' + _id + '_prevMonth">&nbsp;</span>';
      htmlOutput += '<span class="calendar-monthHeaderText paddingLeft10">' + this.monthNames[_month] + ' ' + _year + '</span>';
    }
    else {
      htmlOutput += '<span id="' + _id + '_prevMonth" class="calendar-arrow-left" onclick="' + onClickchangeMonthFn + '-1);">&nbsp;</span>';
      htmlOutput += '<span class="calendar-monthHeaderText">' + this.monthNames[_month] + ' ' + _year + '</span>';

    }
    var cMonthFuture = this.referenceDateFuture.getMonth();
    var cYearFuture = this.referenceDateFuture.getFullYear();
    if (this.isFutureDisabled && _month >= cMonthFuture && _year >= cYearFuture)
      htmlOutput += '<span id="'+_id + '_nextMonth">&nbsp;</span>';
    else
      htmlOutput += '<span id="'+_id + '_nextMonth" class="calendar-arrow-right" onclick="' + onClickchangeMonthFn + ' 1);">&nbsp;</span>';
    htmlOutput += '</div>';
  }
  else
  {
    if (this.showMonthAbove)
    {
      htmlOutput += '<div class="calendar-textAboveHeader">';
      htmlOutput += '<span class="calendar-monthHeaderText">'+this.monthNames[_month] + ' '+ _year +'</span></div>';
    }
  }
  htmlOutput += '<table class="mainCalendarTable" cellspacing="0" cellpadding="0" id="' + _id + '" month="'+_month+'" year="'+_year+'" viewSetting="'+this.viewSetting+'" headerLen="'+this.headerLength+'" lastNumber="'+lastNumer+'">';
  htmlOutput += '<thead>';
  htmlOutput += '<tr>';
    for (var i=0; i<this.weekDays.length; i++)
    {
      var textHeader = this.weekDays[i];
      if (this.headerLength != 0)
        textHeader = this.weekDays[i].substr(0, this.headerLength);
      var thClass = '';
      if (i==6)
        thClass += 'calenderHeaderCell-last';
      htmlOutput += '<th class="'+thClass+'"><span class="calendarHeaderText">'+textHeader+'</th>';
    }
  htmlOutput += '</tr>';
  htmlOutput += '</thead>';
  htmlOutput += '<tbody>';
  for (var i = 0; i<dayMatrix.length; i++)
  {
    var rowID = _id+'_row_'+i;
    htmlOutput += '<tr valign="top" id="'+rowID+'" class="calendar-heightMe">';
    for (var j = 0; j<dayMatrix[i].length; j++)
    {
      var colID = rowID + '_col' + j;
      var dateID = _id + '_' + dayMatrix[i][j].monthNumber + '_' + dayMatrix[i][j].number;
      if ((this.isPastDisabled && this.isPastDate(dayMatrix[i][j].number, dayMatrix[i][j].monthNumber, dayMatrix[i][j].year)) || (this.isFutureDisabled && this.isFutureDate(dayMatrix[i][j].number, dayMatrix[i][j].monthNumber, dayMatrix[i][j].year))) {
        htmlOutput += '<td ';
        var lastClass = '';
        if (j == 6) lastClass = ' last';
        if (j == 0) lastClass = ' first';
        htmlOutput += 'id="'+dateID+'" class="calendarDay_disabled'+lastClass+'"><div><h5 class="cursorDefault">'+dayMatrix[i][j].number+'</h5></div>'
      }
      else{
        if ((this.enableOnlySelectedDates == null) || (this.isDateInArray(dayMatrix[i][j].number, dayMatrix[i][j].monthNumber, dayMatrix[i][j].year)))
        {
          htmlOutput += '<td onclick="'+onClickFn+'(event,\''+_id+'\','+dayMatrix[i][j].year+','+dayMatrix[i][j].monthNumber+','+dayMatrix[i][j].number+')" ';
          var lastClass = '';
          if (j == 6) lastClass = ' last';
          if (j == 0) lastClass = ' first';
          //this is at the end of previos month or begining of next month
          if ((this.enableOnlySelectedDates != null) && (this.isDateInArray(dayMatrix[i][j].number, dayMatrix[i][j].monthNumber, dayMatrix[i][j].year)))
            if (dayMatrix[i][j].classSufix == "_disabled")
              dayMatrix[i][j].classSufix = "";
          htmlOutput += 'id="'+dateID+'" class="calendarDay'+dayMatrix[i][j].classSufix+lastClass+'"><div><h5>'+dayMatrix[i][j].number+'</h5></div>'
        }
        else
        {
          htmlOutput += '<td ';
          var lastClass = '';
          if (j == 6) lastClass = ' last';
          if (j == 0) lastClass = ' first';
          htmlOutput += 'id="'+dateID+'" class="calendarDay_disabled'+lastClass+'"><div><h5 class="cursorDefault">'+dayMatrix[i][j].number+'</h5></div>'
        }
      }
      htmlOutput += '<span id="span_'+dateID+'" class="calendarDayContent"></span></td>';
    }
    htmlOutput += '</tr>';
  }
  htmlOutput += '</tbody>';
  htmlOutput += '</table>';
  return htmlOutput;
}

function LBCalendar_getDaysArray( _month, _year ) //returns a matrix of weeks with their day's date, starting with SUNDAY
{
  var dayMatrix = [];

  var monthDate = LBCalendar_getDate( 1, _month, _year);
  var dayOne = monthDate.getDay();
  dayMatrix[0] = [];
  var i = 0;
  var j = 0;
  var prevYear = _year;
  var monthDays = this.getMonthDays(_year);
  var prevMonth = _month - 1;
  if (prevMonth == -1)  {    prevMonth = 11;     prevYear--;  }
  var futureMonth = _month + 1;
  var futureYear = _year;
  if (futureMonth == 12)  {     futureMonth = 0;    futureYear++;   }

  for (i = 0; i<dayOne; i++)
  {
    dayMatrix[0][i] = {};
    dayMatrix[0][i].number = monthDays[_month-1] - dayOne + i + 1;
    dayMatrix[0][i].insideMonth = false;
    dayMatrix[0][i].classSufix = "_disabled";
    dayMatrix[0][i].monthNumber = prevMonth;
    dayMatrix[0][i].year = prevYear;
  }

  for (j = 1; j <= monthDays[_month]; j++)
  {
    var row = Math.floor((j+i-1)/7);
    if (dayMatrix[row] == undefined)
      dayMatrix[row] = [];
    var col = (j+i-1)% 7;
    dayMatrix[row][col] = {};
    dayMatrix[row][col].number = j;
    dayMatrix[row][col].insideMonth = true;
    dayMatrix[row][col].classSufix = "";
    dayMatrix[row][col].monthNumber = _month;
    dayMatrix[row][col].year = _year;
  }
  var row = dayMatrix.length - 1;
  var daysLeftAt = dayMatrix[row].length;
  var col;
  for (i = daysLeftAt; i < 7; i++)
  {
    col = i%7;
    dayMatrix[row][col] = {};
    dayMatrix[row][col].number = i - daysLeftAt + 1;
    dayMatrix[row][col].insideMonth = false;
    dayMatrix[row][col].classSufix = "_disabled";
    dayMatrix[row][col].year = futureYear;
    dayMatrix[row][col].monthNumber = futureMonth;
  }
  var lastNumber = dayMatrix[row][col].number;
  if (lastNumber == 31 || lastNumber == 28 || lastNumber == 29 || lastNumber == 30)
    lastNumber = 0;
  var obj = {};
  obj.dayMatrix = dayMatrix;
  obj.lastNumer = lastNumber;
  return obj;
}

function LBCalendar_getWeekHtml(_id, _date, _direction)
{
  if (_direction)
    var weekArrayObj = this.getWeekArray(_date.getDate(), _date.getMonth(), _date.getFullYear(), _direction);
  else
    var weekArrayObj = this.getWeekArray(_date.getDate(), _date.getMonth(), _date.getFullYear());
  var weekMatrix = weekArrayObj.dayMatrix;
  var firstMonth = weekArrayObj.firstMonth;
  var lastMonth = weekArrayObj.lastMonth;
  var firstYear = weekArrayObj.firstYear;
  var lastYear = weekArrayObj.lastYear;
  var htmlOutput = '';
  var headerText = '';

  if ( _date.getFullYear() == lastYear)
  {
    if (weekMatrix[0].monthNumber == weekMatrix[6].monthNumber)
    {
      headerText += this.monthNames[weekMatrix[0].monthNumber].substr(0,3) + '. ' + weekMatrix[0].number + ' - ' + weekMatrix[6].number;
      headerText += ', ' + lastYear;
    }
    else
    {
      headerText += this.monthNames[weekMatrix[0].monthNumber].substr(0,3) + '. ' + weekMatrix[0].number + ' - ' + this.monthNames[weekMatrix[6].monthNumber].substr(0,3) + '. ' + weekMatrix[6].number + ', ' + lastYear;
    }
  }
  else
  {
    headerText += this.monthNames[weekMatrix[0].monthNumber].substr(0,3) + '. ' + weekMatrix[0].number + ' - ' + this.monthNames[weekMatrix[6].monthNumber].substr(0,3) + '. ' + weekMatrix[6].number + ', ' + lastYear;
  }
  if (this.showMonthAndArrows)
  {
    htmlOutput += '<div class="calendar-textAboveHeader">';
    htmlOutput += '<span class="calendar-arrow-left" onclick="calendar_changeWeek(\''+_id+'\', -1);">&nbsp;</span>';
    htmlOutput += '<span class="calendar-monthHeaderText">'+headerText +'</span>';
    htmlOutput += '<span class="calendar-arrow-right" onclick="calendar_changeWeek(\''+_id+'\', 1);">&nbsp;</span>';
    htmlOutput += '</div>'; //+arrows
  }
  else
  {
    if (this.showMonthAbove)
    {
      htmlOutput += '<div class="calendar-textAboveHeader"><span class="calendar-monthHeaderText">'+ headerText +'</span></div>';
    }
  }
  //without foreign attributes: htmlOutput += '<table class="mainCalendarWeekTable" cellspacing="0" cellpadding="0" id="' + _id + '">';
  htmlOutput += '<table class="mainCalendarWeekTable" cellspacing="0" cellpadding="0" id="' + _id + '" lastmonth="'+lastMonth+'" lastyear="'+lastYear+'" viewSetting="'+this.viewSetting+'" headerLen="'+this.headerLength+'" lastDay="'+weekMatrix[6].number+'"';
  htmlOutput += 'firstDay="'+weekMatrix[0].number+'" firstMonth="'+firstMonth+'" firstYear="'+firstYear+'" >';
  htmlOutput += '<thead>';
  htmlOutput += '<tr class="weekTopHeader">';
  htmlOutput += '<th class="allDayColumnHeader_blank">&nbsp;</th>';
  for (var i=0; i<weekMatrix.length; i++)
  {
    var textHeader = this.weekDays[i].substr(0, 3) + ', ';
    textHeader += this.monthNames[weekMatrix[i].monthNumber].substr(0,3) + ' ' + weekMatrix[i].number;
    if (i == weekMatrix.length-1)
      htmlOutput += '<th class="calendarHeaderText-last"><span class="calendarHeaderText">'+textHeader+'</span></th>';
    else
      htmlOutput += '<th><span class="calendarHeaderText">'+textHeader+'</span></th>';
  }
  htmlOutput += '</tr>';
  //now add the special "all-day" row
  htmlOutput += '<tr class="allDayRow">';
  htmlOutput += '<th class="allDayColumnHeader">All-Day</th>';
  for (var i=0; i<weekMatrix.length; i++)
  {
    var cellID = _id + '_' + 'allDay_' + weekMatrix[i].monthNumber + '_' + weekMatrix[i].number;
    var thClass = '';
    if (i == weekMatrix.length-1)
      thClass += 'calendarHeaderText-last'
    //  htmlOutput += '<th id="'+cellID+'" class="calendarHeaderText-last"><span class="calendarHeaderRow" id="span_'+cellID+'">&nbsp;</span></th>';
    if (i % 2 == 1)
      thClass += ' odd';
    htmlOutput += '<th id="'+cellID+'" class="'+thClass+'"><span class="calendarHeaderRow" id="span_'+cellID+'">&nbsp;</span></th>';

  }
  htmlOutput += '</tr>';
  htmlOutput += '</thead>';
  htmlOutput += '<tbody>';

  //for 1-11AM:
  htmlOutput += LBCalendar_getWeekDayRows(_id, weekMatrix, 'AM');
  htmlOutput += LBCalendar_getWeekDayRows(_id, weekMatrix, 'PM');

  htmlOutput += '</tbody>';
  htmlOutput += '</table>';
  return htmlOutput;
}

function LBCalendar_getDayHtml(_id, _date)
{
  var htmlOutput = '';
  var headerText = this.weekDays[_date.getDay()].substr(0,3) + ', ' + this.monthNames[_date.getMonth()].substr(0,3) + '. ' + _date.getDate() + ', ' + _date.getFullYear();
  //headerText += this.monthNames[weekMatrix[0].monthNumber].substr(0,3) + '. ' + weekMatrix[0].number + ' - ' + this.monthNames[weekMatrix[6].monthNumber].substr(0,3) + '. ' + weekMatrix[6].number + ', ' + lastYear;
  if (this.showMonthAndArrows)
  {
    htmlOutput += '<div class="calendar-textAboveHeader"><span class="calendar-arrow-left" onclick="calendar_changeDay(\''+_id+'\', -1);">&nbsp;</span><span class="calendar-monthHeaderText">'+headerText +'</span><span class="calendar-arrow-right" onclick="calendar_changeDay(\''+_id+'\', 1);">&nbsp;</span></div>'; //+arrows
  }
  else
  {
    if (this.showMonthAbove)
    {
      htmlOutput += '<div class="calendar-textAboveHeader"><span class="calendar-monthHeaderText">'+ headerText +'</span></div>';
    }
  }
  htmlOutput += '<table border="0" class="mainCalendarDayTable" cellspacing="0" cellpadding="0" id="' + _id;
  htmlOutput += '" month="'+_date.getMonth()+'" year="'+_date.getFullYear()+'" viewSetting="'+this.viewSetting;
  htmlOutput += '" headerLen="'+this.headerLength+'" day="'+_date.getDate()+'">';
  htmlOutput += '<thead>';

  //now add the special "all-day" row
  htmlOutput += '<tr>';
  htmlOutput += '<th class="allDayColumnHeader">All-Day</th>';
  var cellID = _id + '_' + 'allDay_' + _date.getMonth() + '_' + _date.getDate();
  htmlOutput += '<th class="allDayTasksHeader"><span class="calendarHeaderRow" id='+cellID+'>&nbsp;</span></th>';
  //htmlOutput += '<th class="exceptScroll"></th>';
  htmlOutput += '</tr>';
  htmlOutput += '</thead>';
  htmlOutput += '<tbody>';

  //for 1-11AM:
  htmlOutput += LBCalendar_getWeekDayRows(_id, null, 'AM', _date);
  //for 12-11PM
  htmlOutput += LBCalendar_getWeekDayRows(_id, null, 'PM', _date);

  htmlOutput += '</tbody>';
  htmlOutput += '</table>';
  return htmlOutput;
}

function LBCalendar_getWeekDayRows( _id, _weekMatrix, _period, _oneDay)
{
  var oneDay = _oneDay || false;
  var hourOrder = ['12','1','2','3','4','5','6','7','8','9','10','11'];
  var maxHourLength = hourOrder.length;
  hourOrder[-1] = '0'; //how do we start?
  if ( _period == 'PM') hourOrder[12] = '00'
  var strHtml = '';
  if (_period =='PM'){
    maxHourLength = hourOrder.length -1;
  }

  for (var i = 0; i< hourOrder.length ; i++)//remove from week rows the 00 row as it is twice defined
  {
    //first half row:
      strHtml += '<tr >'
      if (i == maxHourLength) {
        strHtml += '<td rowspan="2" class="allDayColumnClear"></td>';
      }
      else{
        strHtml += '<td rowspan="2" class="allDayColumn">'+hourOrder[i]+' '+ _period+'</td>';
      }

      //strHtml += '<td class="allDayColumn"><span>'+hourOrder[i]+' '+ _period+'</span></td>';
      if (oneDay)
      {
        var dateID = _id+'_'+_period+ '_secondHalf_'+hourOrder[i-1] + '_'+ oneDay.getMonth() + '_' + oneDay.getDate() ;
        if (i == maxHourLength) {
          strHtml += '<td id="'+dateID+'" class="calendar-hourDay"><span id="span_'+dateID+'" class="calendarDayContent"></span></td>';
        }
        else{
          strHtml += '<td id="'+dateID+'" class="calendar-hourDay firstHalf"><span id="span_'+dateID+'" class="calendarDayContent"></span></td>';
        }
      }
      else
      {
        for (var j = 0; j<_weekMatrix.length; j++)
        {
          var dateID = _id+'_'+_period +'_secondHalf_'+hourOrder[i-1]+'_'+ _weekMatrix[j].monthNumber + '_' + _weekMatrix[j].number;// + '_firstHalf';
          if (i == maxHourLength) {
            var classStr = 'calendarWeek-hourDay';
          }
          else{
            var classStr = 'calendarWeek-hourDay firstHalf';
          }

          if (j%2 == 1)
            classStr += ' odd';
          if (j == _weekMatrix.length -1) classStr += ' scrollClosest'
          strHtml += '<td id="'+dateID+'" class="'+classStr+'"><span id="span_'+dateID+'" class="calendarDayContent"></span></td>';
        }
      }
      //strHtml += '<td class="emptyCell">&nbsp;</td>';
      strHtml += '</tr>'
    if (i < maxHourLength){

    //second half row:
    strHtml += '<tr>'
    //  strHtml += '<td class="allDayColumn">&nbsp;</td>';
    if (oneDay)
    {
      var dateID = _id +'_'+_period+ '_firstHalf_'+hourOrder[i] +'_' + oneDay.getMonth() + '_' + oneDay.getDate() ;
      strHtml += '<td id="'+dateID+'" class="calendar-hourDay secondHalf"><span id="span_'+dateID+'" class="calendarDayContent"></span></td>';
    }
    else
    {
      for (var j = 0; j<_weekMatrix.length; j++)
      {
        var dateID = _id+'_'+_period+'_firstHalf_'+hourOrder[i]+'_' + _weekMatrix[j].monthNumber + '_' + _weekMatrix[j].number;// + '_secondHalf';
        var classStr = 'calendarWeek-hourDay secondHalf';
        if (j%2 == 1)
          classStr += ' odd';
        if (j == _weekMatrix.length -1) classStr += ' scrollClosest'
        strHtml += '<td id="'+dateID+'" class="'+classStr+'"><span id="span_'+dateID+'" class="calendarDayContent"></span></td>';
      }
    }
    //strHtml += '<td class="emptyCell">&nbsp;</td>';
    strHtml += '</tr>'
    }
  }
  /*
  if (_period=='PM')
  {
    //add the secondHalf of the last hour:
    strHtml += '<tr >'
    strHtml += '<td class="allDayColumn">&nbsp;</td>';
    //strHtml += '<td class="allDayColumn"><span>'+hourOrder[i]+' '+ _period+'</span></td>';
    if (oneDay)
    {
      var dateID = _id+'_'+_period+ '_secondHalf_11' + '_'+ oneDay.getMonth() + '_' + oneDay.getDate() ;
      strHtml += '<td id="'+dateID+'" class="calendar-hourDay firstHalf"><span id="span_'+dateID+'"></span></td>';
    }
    else
    {
      for (var j = 0; j<_weekMatrix.length; j++)
      {
        var dateID = _id+'_'+_period +'_secondHalf_11'+'_'+ _weekMatrix[j].monthNumber + '_' + _weekMatrix[j].number;// + '_firstHalf';
        var classStr = 'calendarWeek-hourDay firstHalf';
        if (j%2 == 1)
          classStr += ' odd';
        if (j == _weekMatrix.length -1) classStr += ' scrollClosest'
        strHtml += '<td id="'+dateID+'" class="'+classStr+'"><span id="span_'+dateID+'"></span></td>';
      }
    }
    //strHtml += '<td class="emptyCell">&nbsp;</td>';
    strHtml += '</tr>';
  }
  * */
  return strHtml;
}

function LBCalendar_getWeekArray(_day, _month, _year, _direction)
{
  var dayMatrix = [];
  var dayDate = this.getDate( _day, _month, _year);
  var monthDays = this.getMonthDays(_year);
  var dayOfWeek = dayDate.getDay();
  //add before it to complete the week:
  var daysAfter = 6 - dayOfWeek; //6 = 7-1 (7=days of the week, 1= the current day)
  var daysBefore = 6 - daysAfter;
  var prevMonthDays = 0;
  if (_day - daysBefore <= 0)
  {
    prevMonthDays = daysBefore - _day +1;
  }
  var prevCurrentMonthDays = daysBefore - prevMonthDays;
  var nextMonthDays = 0;
  if ( daysAfter > monthDays[_month] - _day)
    nextMonthDays = daysAfter - (monthDays[_month] - _day);
  var nextCurrentMonthDays = daysAfter - nextMonthDays;
    var prevYear = _year;
  var monthDays = this.getMonthDays(_year);

  var prevMonth = _month - 1;
  if (prevMonth == -1)  {    prevMonth = 11;     prevYear--;  }
  var futureMonth = _month + 1;
  var futureYear = _year;
  if (futureMonth == 12)  {     futureMonth = 0;    futureYear++;   }

  for (var i=0; i<prevMonthDays; i++)
  {
    dayMatrix[i] = {};
    dayMatrix[i].number = monthDays[_month-1] - prevMonthDays + i +1;
    dayMatrix[i].monthNumber = prevMonth;
    dayMatrix[i].year = prevYear;
    dayMatrix[i].classSufix = '';
  }
  var indexLeftAt = dayMatrix.length;
  for (var i = prevCurrentMonthDays; i>0; i-- )
  {
    dayMatrix[indexLeftAt] = {};
    dayMatrix[indexLeftAt].number = _day - i ;
    dayMatrix[indexLeftAt].monthNumber = _month;
    dayMatrix[indexLeftAt].year = _year;
    dayMatrix[indexLeftAt].classSufix = '';
    indexLeftAt++;
  }
  dayMatrix[indexLeftAt] = {};
  dayMatrix[indexLeftAt].number = _day ;
  dayMatrix[indexLeftAt].monthNumber = _month;
  dayMatrix[indexLeftAt].year = _year;
  dayMatrix[indexLeftAt].classSufix = '';
  indexLeftAt++;
  for (var i = 0; i<nextCurrentMonthDays; i++ )
  {
    dayMatrix[indexLeftAt] = {};
    dayMatrix[indexLeftAt].number = _day + i + 1;
    dayMatrix[indexLeftAt].monthNumber = _month;
    dayMatrix[indexLeftAt].year = _year;
    dayMatrix[indexLeftAt].classSufix = '';
    indexLeftAt++;
  }
  for (var i = 0; i<nextMonthDays; i++ )
  {
    dayMatrix[indexLeftAt] = {};
    dayMatrix[indexLeftAt].number = i+1;
    dayMatrix[indexLeftAt].monthNumber = futureMonth;
    dayMatrix[indexLeftAt].year = futureYear;
    dayMatrix[indexLeftAt].classSufix = '';
    indexLeftAt++;
  }

  var obj = {};
  obj.dayMatrix = dayMatrix;
  obj.lastNumer = dayMatrix[indexLeftAt-1].number;
  obj.firstNumer = dayMatrix[0].number;
  obj.lastMonth = dayMatrix[indexLeftAt-1].monthNumber;
  obj.lastYear = _year;
  obj.firstMonth = dayMatrix[0].monthNumber
  obj.firstYear = _year;
  if (_direction)
    obj.direction = _direction;
  else
    obj.direction = 0;
  //control year change
  if (obj.firstMonth == 11 && obj.lastMonth == 0 && obj.firstNumer + 6 > 31){
    switch(obj.direction){
      case 1:
        obj.lastYear = Number(_year) + 1;
      break;
      case -1:
        obj.firstYear = Number(_year) -1;
      break;
      default:
        obj.firstYear = this.getWeekCorrectYears(obj,_day).firstYear;
        obj.lastYear = this.getWeekCorrectYears(obj,_day).lastYear;
      break;
    }
    dayMatrix[6].year = obj.lastYear;
    dayMatrix[0].year = obj.firstYear;
  }
  else if (dayDate.getMonth()== 0 && obj.firstMonth == 11){
    if (dayMatrix[6].monthNumber == 0){
      dayMatrix[6].year = obj.lastYear;
      dayMatrix[0].year = _year - 1;
      obj.firstYear = dayMatrix[0].year;
    }
    else if (dayMatrix[6].monthNumber == 11){
      obj.lastYear = _year - 1;
      dayMatrix[6].year = obj.lastYear;
      dayMatrix[0].year = obj.lastYear;
      obj.firstYear = obj.lastYear;
    }
  }
  if (obj.lastMonth == 12 )
  {
    obj.lastYear++;
    //keep integrity in the whole structure
    for (var i=0; i<dayMatrix.length; i++){
      if (dayMatrix[i].monthNumber == 12)
      {
        dayMatrix[i].monthNumber = 0;
        dayMatrix[i].year++;
      }
    }
    obj.lastMonth = 0;
  }
  if ( dayMatrix[0].monthNumber == -1)
  {
    obj.firstYear--;
    for (var i=0; i<dayMatrix.length; i++){
      if (dayMatrix[i].monthNumber == -1)
      {
        dayMatrix[i].monthNumber = 11;
        dayMatrix[i].year--;
      }
    }
    obj.firstMonth = 11;
  }
  return obj;
}

function LBCalendar_setHeaderLength( _newLength )
{
  if (_newLength || _newLength == 0)
    this.headerLength = _newLength;
}

function LBCalendar_getMonthDays( _year)
{
  if ( !this.monthDays[_year])
  {
    this.initMonthDays(_year);
  }
  return this.monthDays[_year];
}

function LBCalendar_initMonthDays(_year)
{
  var monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  monthDays[-1] = 31;
  monthDays[12] = 31;
  if (LBCalendar_isLeapYear(_year))
  {
    monthDays[this.month["Feb"]] = 29;
  }
  this.monthDays[_year] = monthDays;
}

function LBCalendar_initMonthNames()
{
  this.month = {};
  this.month["Jan"] = 0;
  this.month["Feb"] = 1;
  this.month["Mar"] = 2;
  this.month["Apr"] = 3;
  this.month["May"] = 4;
  this.month["Jun"] = 5;
  this.month["Jul"] = 6;
  this.month["Aug"] = 7;
  this.month["Sep"] = 8;
  this.month["Oct"] = 9;
  this.month["Nov"] = 10;
  this.month["Dec"] = 11;
}
function LBCalendar_initWeekDays()
{
  this.weekDays = [];
  this.weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
}

function LBCalendar_displayAboveHeader( _optionNumber )
{
  switch (_optionNumber)
  {
    case 0:
    {
      this.showMonthAbove = false;
      this.showMonthAndArrows = false;
      break;
    }
    case 1:
    {
      this.showMonthAbove = true;
      this.showMonthAndArrows = false;
      break;
    }
    case 2:
    {
      this.showMonthAbove = true;
      this.showMonthAndArrows = true;
      break;
    }
  }
  this.viewSetting = _optionNumber;
}

function LBCalendar_getMockRow(_startingWith, rowID, tableID, monthNumber)
{
  var htmlOutput = '';
  htmlOutput += '<tr valign="top" id="'+rowID+'" class="calendar-heightMe">';
  for (var j = _startingWith; j<_startingWith+7; j++)
  {
    var colID = rowID + '_col' + j;
    var dateID = tableID + '_' + monthNumber + '_' + j;
    var lastClass = '';
    if (j - _startingWith == 0)
      lastClass = 'first';
    else if (j- _startingWith == 6) lastClass = 'last';
    htmlOutput += '<td id="'+dateID+'" class="calendarDay_disabled '+lastClass+'"><div><h5>'+j+'</h5></div><span id="span_'+dateID+'"></span></td>';
  }
  htmlOutput += '</tr>';
  return htmlOutput;
}

function LBCalendar_markToday(_baseID, _date, _withClass)
{
  if (! $('#' + _baseID +'_'+_date.getMonth()+'_'+_date.getDate()).hasClass('calendarDay_disabled'))
    $('#' + _baseID +'_'+_date.getMonth()+'_'+_date.getDate()).addClass(_withClass);
}

function LBCalendar_fixHeights(_id)
{
  var rows  = $('#'+_id+' .calendar-heightMe');
  var evenHeight = 100 / rows.length;
  rows.css("height", evenHeight+'%');

  if ($('#'+_id+' .calendar-heightMe:last td').hasClass('today') && _id == "frontPageCalendar"){ //in case present day is on the alst row the height is overflowing border
    if ($.browser.webkit) {
      $('#'+_id+' .calendar-heightMe:last td').each(function(i, elem){
        if ($(elem).hasClass('today')){
          $(elem).css('height','99% !important');
        }
      })
    }
    else {
      var lastRowHeight = parseFloat(evenHeight) - 1;
      $('#' + _id + ' .calendar-heightMe:last').css('height', lastRowHeight + '%');
    }
  }
  //$('#mainCalendarViewID .calendar-heightMe').css("height",evenHeight);
}

//helper functions

function LBCalendar_getDate( _day, _month, _year)
{
  return new Date(_year, _month, _day);
}

function LBCalendar_isLeapYear (year)
{
   if (((year % 4)==0) && ((year % 100)!=0) || ((year % 400)==0))
      return (true);
   else
      return (false);
}

function LBCalendar_getFormattedString( _date, mask)
{
  var str = '';
  if(mask == null){
    mask = "DDD MM/DD/YYYY";
  }
  switch(mask){
    case "LONG":
      //returns format as "DAY, MONTH DD, YYYY" for now
      str = this.weekDays[_date.getDay()] + ', ' + this.monthNames[_date.getMonth()] + ' ' + _date.getDate() + ', ' + _date.getFullYear() ;
      break;
    case "SHORT":
      //returns format as "MONTH DD, YYYY"
      str = this.monthNames[_date.getMonth()] + ' ' + _date.getDate() + ', ' + _date.getFullYear() ;
      break;
    case "DDD MM/DD/YYYY":
      //returns format as "DDD MM/DD/YYYY" for now
      str = this.weekDays[_date.getDay()].substr(0,3) + ' ' + (_date.getMonth()+1).toString() + '&#47;' + _date.getDate() + '&#47;' + _date.getFullYear() ;
      break;
    case "MM/DD/YYYY":
      str = (_date.getMonth()+1).toString() + '/' + _date.getDate() + '/' + _date.getFullYear() ;
      break;
    case "MMMM DD":
      var postFix = '';
      var theDate = _date.getDate().toString();
      if((theDate == '11') || (theDate == '12') || (theDate == '13'))
        postFix = 'th';
      else{
        switch (theDate.charAt(theDate.length - 1)) {
          case '1':
            postFix = 'st';
            break;
          case '2':
            postFix = 'nd';
            break;
          case '3':
            postFix = 'rd';
            break;
          default:
            postFix = 'th';
            break;
        }
      }
      str = this.monthNames[_date.getMonth()] + ' ' + theDate + postFix;
      break;
  }
  return str;
}

/*
 * Function: checkSetCorrectYear
 * Checks week's years for cases week is in 2 years and returns correct years in cases they are wrong set
 *
 * Parameters:
 *  dateInfo - object with information about week's containing dates (days, years, months)
 * _day: current selected day
*/
function LBCalendar_getWeekCorrectYears(dateInfo, _day){

  if (dateInfo.firstMonth == 11 && dateInfo.lastMonth == 0 && dateInfo.firstYear == dateInfo.lastYear)
  {
    if (Number(_day) >= 22) //if day is on last month of the first year
      dateInfo.lastYear += 1;
    else if (Number(_day) <= 7) //if day is on 1st month of the last year
      dateInfo.firstYear -= 1;
  }
  return dateInfo;
}

/*
 * Function: isPastDate
 * Checks if date is in past
 *
 * Parameters:
 * _day, _month, _year
*/
function LBCalendar_isPastDate(_day, _month, _year){
  var isInPast = false;
  var currentCalendarDate = LBCalendar_getDate(_day, _month, _year);
  var presentDate = LBCalendar_getDate(this.referenceDate.getDate(), this.referenceDate.getMonth(), this.referenceDate.getFullYear());
  if (currentCalendarDate < presentDate)
    isInPast = true;
  return isInPast;
}

/*
 * Function: isPastDate
 * Checks if date is in past
 *
 * Parameters:
 * _day, _month, _year
*/
function LBCalendar_isFutureDate(_day, _month, _year){
  var isInFuture = false;
  var currentCalendarDate = LBCalendar_getDate(_day, _month, _year);
  var presentDate = LBCalendar_getDate(this.referenceDateFuture.getDate(), this.referenceDateFuture.getMonth(), this.referenceDateFuture.getFullYear());
  if (currentCalendarDate > presentDate)
    isInFuture = true;
  return isInFuture;
}

function LBCalendar_isDateInArray(_day, _month, _year)
{
  if (this.enableOnlySelectedDates != null)
  {
    var isInArray = false;
    var currentCalendarDate = LBCalendar_getDate(_day, _month, _year);
    var enabledDatesLen = this.enableOnlySelectedDates.length;
    for (var index = 0; index < enabledDatesLen; index++)
    {
      var enabledDate = LBCalendar_getDate(this.enableOnlySelectedDates[index].getDate(), this.enableOnlySelectedDates[index].getMonth(), this.enableOnlySelectedDates[index].getFullYear());
      if (enabledDate.getTime() === currentCalendarDate.getTime())
      {
        isInArray = true;
        break;
      }
    }
    return isInArray;
  }
  else
    return true;
}

function LBCalendar_setEnableOnlySelectedDates(selectedDatesArray)
{
  this.enableOnlySelectedDates = selectedDatesArray;
};
/*!
 * jQuery Cycle Plugin (with Transition Definitions)
 * Examples and documentation at: http://jquery.malsup.com/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version: 2.88 (08-JUN-2010)
 * Dual licensed under the MIT and GPL licenses.
 * http://jquery.malsup.com/license.html
 * Requires: jQuery v1.2.6 or later
 *
 * Plugin changes:
 *  made a fix in the $.fn.cycle.transitions.scrollHorz so that the slides do not overlap during the transitions
 *    changed lines from:
 *      opts.cssBefore.left = fwd ? (next.cycleW-1) : (1-next.cycleW);
 *      opts.animOut.left = fwd ? -curr.cycleW : curr.cycleW;
 *    into
 *      opts.cssBefore.left = fwd ? next.cycleW + opts.margin : - (next.cycleW + opts.margin);
 *      opts.animOut.left = fwd ? -(curr.cycleW + opts.margin) : curr.cycleW + opts.margin;
 *  add environment reference to memorize last set timeout
 *    added environment.SetPageFlag('lastCycleTimeout', p.cycleTimeout); to the go() function
 */
;(function($) {

var ver = '2.88';

// if $.support is not defined (pre jQuery 1.3) add what I need
if ($.support == undefined) {
  $.support = {
    opacity: !($.browser.msie)
  };
}

function debug(s) {
  if ($.fn.cycle.debug)
    log(s);
}
function log() {
  if (window.console && window.console.log)
    window.console.log('[cycle] ' + Array.prototype.join.call(arguments,' '));
};

// the options arg can be...
//   a number  - indicates an immediate transition should occur to the given slide index
//   a string  - 'pause', 'resume', 'toggle', 'next', 'prev', 'stop', 'destroy' or the name of a transition effect (ie, 'fade', 'zoom', etc)
//   an object - properties to control the slideshow
//
// the arg2 arg can be...
//   the name of an fx (only used in conjunction with a numeric value for 'options')
//   the value true (only used in first arg == 'resume') and indicates
//   that the resume should occur immediately (not wait for next timeout)

$.fn.cycle = function(options, arg2) {
  var o = { s: this.selector, c: this.context };

  // in 1.3+ we can fix mistakes with the ready state
  if (this.length === 0 && options != 'stop') {
    if (!$.isReady && o.s) {
      log('DOM not ready, queuing slideshow');
      $(function() {
        $(o.s,o.c).cycle(options,arg2);
      });
      return this;
    }
    // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
    log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
    return this;
  }

  // iterate the matched nodeset
  return this.each(function() {
    var opts = handleArguments(this, options, arg2);
    if (opts === false)
      return;

    opts.updateActivePagerLink = opts.updateActivePagerLink || $.fn.cycle.updateActivePagerLink;

    // stop existing slideshow for this container (if there is one)
    if (this.cycleTimeout)
      clearTimeout(this.cycleTimeout);
    this.cycleTimeout = this.cyclePause = 0;

    var $cont = $(this);
    var $slides = opts.slideExpr ? $(opts.slideExpr, this) : $cont.children();
    var els = $slides.get();
    if (els.length < 2) {
      log('terminating; too few slides: ' + els.length);
      return;
    }

    var opts2 = buildOptions($cont, $slides, els, opts, o);
    if (opts2 === false)
      return;

    var startTime = opts2.continuous ? 10 : getTimeout(els[opts2.currSlide], els[opts2.nextSlide], opts2, !opts2.rev);

    // if it's an auto slideshow, kick it off
    if (startTime) {
      startTime += (opts2.delay || 0);
      if (startTime < 10)
        startTime = 10;
      debug('first timeout: ' + startTime);
      this.cycleTimeout = setTimeout(function(){go(els,opts2,0,(!opts2.rev && !opts.backwards))}, startTime);
    }
  });
};

// process the args that were passed to the plugin fn
function handleArguments(cont, options, arg2) {
  if (cont.cycleStop == undefined)
    cont.cycleStop = 0;
  if (options === undefined || options === null)
    options = {};
  if (options.constructor == String) {
    switch(options) {
    case 'destroy':
    case 'stop':
      var opts = $(cont).data('cycle.opts');
      if (!opts)
        return false;
      cont.cycleStop++; // callbacks look for change
      if (cont.cycleTimeout)
        clearTimeout(cont.cycleTimeout);
      cont.cycleTimeout = 0;
      $(cont).removeData('cycle.opts');
      if (options == 'destroy')
        destroy(opts);
      return false;
    case 'toggle':
      cont.cyclePause = (cont.cyclePause === 1) ? 0 : 1;
      checkInstantResume(cont.cyclePause, arg2, cont);
      return false;
    case 'pause':
      cont.cyclePause = 1;
      return false;
    case 'resume':
      cont.cyclePause = 0;
      checkInstantResume(false, arg2, cont);
      return false;
    case 'prev':
    case 'next':
      var opts = $(cont).data('cycle.opts');
      if (!opts) {
        log('options not found, "prev/next" ignored');
        return false;
      }
      $.fn.cycle[options](opts);
      return false;
    default:
      options = { fx: options };
    };
    return options;
  }
  else if (options.constructor == Number) {
    // go to the requested slide
    var num = options;
    options = $(cont).data('cycle.opts');
    if (!options) {
      log('options not found, can not advance slide');
      return false;
    }
    if (num < 0 || num >= options.elements.length) {
      log('invalid slide index: ' + num);
      return false;
    }
    options.nextSlide = num;
    if (cont.cycleTimeout) {
      clearTimeout(cont.cycleTimeout);
      cont.cycleTimeout = 0;
    }
    if (typeof arg2 == 'string')
      options.oneTimeFx = arg2;
    go(options.elements, options, 1, num >= options.currSlide);
    return false;
  }
  return options;

  function checkInstantResume(isPaused, arg2, cont) {
    if (!isPaused && arg2 === true) { // resume now!
      var options = $(cont).data('cycle.opts');
      if (!options) {
        log('options not found, can not resume');
        return false;
      }
      if (cont.cycleTimeout) {
        clearTimeout(cont.cycleTimeout);
        cont.cycleTimeout = 0;
      }
      go(options.elements, options, 1, (!opts.rev && !opts.backwards));
    }
  }
};

function removeFilter(el, opts) {
  if (!$.support.opacity && opts.cleartype && el.style.filter) {
    try { el.style.removeAttribute('filter'); }
    catch(smother) {} // handle old opera versions
  }
};

// unbind event handlers
function destroy(opts) {
  if (opts.next)
    $(opts.next).unbind(opts.prevNextEvent);
  if (opts.prev)
    $(opts.prev).unbind(opts.prevNextEvent);

  if (opts.pager || opts.pagerAnchorBuilder)
    $.each(opts.pagerAnchors || [], function() {
      this.unbind().remove();
    });
  opts.pagerAnchors = null;
  if (opts.destroy) // callback
    opts.destroy(opts);
};

// one-time initialization
function buildOptions($cont, $slides, els, options, o) {
  // support metadata plugin (v1.0 and v2.0)
  var opts = $.extend({}, $.fn.cycle.defaults, options || {}, $.metadata ? $cont.metadata() : $.meta ? $cont.data() : {});
  if (opts.autostop)
    opts.countdown = opts.autostopCount || els.length;

  var cont = $cont[0];
  $cont.data('cycle.opts', opts);
  opts.$cont = $cont;
  opts.stopCount = cont.cycleStop;
  opts.elements = els;
  opts.before = opts.before ? [opts.before] : [];
  opts.after = opts.after ? [opts.after] : [];
  opts.after.unshift(function(){ opts.busy=0; });

  // push some after callbacks
  if (!$.support.opacity && opts.cleartype)
    opts.after.push(function() { removeFilter(this, opts); });
  if (opts.continuous)
    opts.after.push(function() { go(els,opts,0,(!opts.rev && !opts.backwards)); });

  saveOriginalOpts(opts);

  // clearType corrections
  if (!$.support.opacity && opts.cleartype && !opts.cleartypeNoBg)
    clearTypeFix($slides);

  // container requires non-static position so that slides can be position within
  if ($cont.css('position') == 'static')
    $cont.css('position', 'relative');
  if (opts.width)
    $cont.width(opts.width);
  if (opts.height && opts.height != 'auto')
    $cont.height(opts.height);

  if (opts.startingSlide)
    opts.startingSlide = parseInt(opts.startingSlide);
  else if (opts.backwards)
    opts.startingSlide = els.length - 1;

  // if random, mix up the slide array
  if (opts.random) {
    opts.randomMap = [];
    for (var i = 0; i < els.length; i++)
      opts.randomMap.push(i);
    opts.randomMap.sort(function(a,b) {return Math.random() - 0.5;});
    opts.randomIndex = 1;
    opts.startingSlide = opts.randomMap[1];
  }
  else if (opts.startingSlide >= els.length)
    opts.startingSlide = 0; // catch bogus input
  opts.currSlide = opts.startingSlide || 0;
  var first = opts.startingSlide;

  // set position and zIndex on all the slides
  $slides.css({position: 'absolute', top:0, left:0}).hide().each(function(i) {
    var z;
    if (opts.backwards)
      z = first ? i <= first ? els.length + (i-first) : first-i : els.length-i;
    else
      z = first ? i >= first ? els.length - (i-first) : first-i : els.length-i;
    $(this).css('z-index', z)
  });

  // make sure first slide is visible
  $(els[first]).css('opacity',1).show(); // opacity bit needed to handle restart use case
  removeFilter(els[first], opts);

  // stretch slides
  if (opts.fit && opts.width)
    $slides.width(opts.width);
  if (opts.fit && opts.height && opts.height != 'auto')
    $slides.height(opts.height);

  // stretch container
  var reshape = opts.containerResize && !$cont.innerHeight();
  if (reshape) { // do this only if container has no size http://tinyurl.com/da2oa9
    var maxw = 0, maxh = 0;
    for(var j=0; j < els.length; j++) {
      var $e = $(els[j]), e = $e[0], w = $e.outerWidth(), h = $e.outerHeight();
      if (!w) w = e.offsetWidth || e.width || $e.attr('width')
      if (!h) h = e.offsetHeight || e.height || $e.attr('height');
      maxw = w > maxw ? w : maxw;
      maxh = h > maxh ? h : maxh;
    }
    if (maxw > 0 && maxh > 0)
      $cont.css({width:maxw+'px',height:maxh+'px'});
  }

  if (opts.pause)
    $cont.hover(function(){this.cyclePause++;},function(){this.cyclePause--;});

  if (supportMultiTransitions(opts) === false)
    return false;

  // apparently a lot of people use image slideshows without height/width attributes on the images.
  // Cycle 2.50+ requires the sizing info for every slide; this block tries to deal with that.
  var requeue = false;
  options.requeueAttempts = options.requeueAttempts || 0;
  $slides.each(function() {
    // try to get height/width of each slide
    var $el = $(this);
    this.cycleH = (opts.fit && opts.height) ? opts.height : ($el.height() || this.offsetHeight || this.height || $el.attr('height') || 0);
    this.cycleW = (opts.fit && opts.width) ? opts.width : ($el.width() || this.offsetWidth || this.width || $el.attr('width') || 0);

    if ( $el.is('img') ) {
      // sigh..  sniffing, hacking, shrugging...  this crappy hack tries to account for what browsers do when
      // an image is being downloaded and the markup did not include sizing info (height/width attributes);
      // there seems to be some "default" sizes used in this situation
      var loadingIE = ($.browser.msie  && this.cycleW == 28 && this.cycleH == 30 && !this.complete);
      var loadingFF = ($.browser.mozilla && this.cycleW == 34 && this.cycleH == 19 && !this.complete);
      var loadingOp = ($.browser.opera && ((this.cycleW == 42 && this.cycleH == 19) || (this.cycleW == 37 && this.cycleH == 17)) && !this.complete);
      var loadingOther = (this.cycleH == 0 && this.cycleW == 0 && !this.complete);
      // don't requeue for images that are still loading but have a valid size
      if (loadingIE || loadingFF || loadingOp || loadingOther) {
        if (o.s && opts.requeueOnImageNotLoaded && ++options.requeueAttempts < 100) { // track retry count so we don't loop forever
          log(options.requeueAttempts,' - img slide not loaded, requeuing slideshow: ', this.src, this.cycleW, this.cycleH);
          setTimeout(function() {$(o.s,o.c).cycle(options)}, opts.requeueTimeout);
          requeue = true;
          return false; // break each loop
        }
        else {
          log('could not determine size of image: '+this.src, this.cycleW, this.cycleH);
        }
      }
    }
    return true;
  });

  if (requeue)
    return false;

  opts.cssBefore = opts.cssBefore || {};
  opts.animIn = opts.animIn || {};
  opts.animOut = opts.animOut || {};

  $slides.not(':eq('+first+')').css(opts.cssBefore);
  if (opts.cssFirst)
    $($slides[first]).css(opts.cssFirst);

  if (opts.timeout) {
    opts.timeout = parseInt(opts.timeout);
    // ensure that timeout and speed settings are sane
    if (opts.speed.constructor == String)
      opts.speed = $.fx.speeds[opts.speed] || parseInt(opts.speed);
    if (!opts.sync)
      opts.speed = opts.speed / 2;

    var buffer = opts.fx == 'shuffle' ? 500 : 250;
    while((opts.timeout - opts.speed) < buffer) // sanitize timeout
      opts.timeout += opts.speed;
  }
  if (opts.easing)
    opts.easeIn = opts.easeOut = opts.easing;
  if (!opts.speedIn)
    opts.speedIn = opts.speed;
  if (!opts.speedOut)
    opts.speedOut = opts.speed;

  opts.slideCount = els.length;
  opts.currSlide = opts.lastSlide = first;
  if (opts.random) {
    if (++opts.randomIndex == els.length)
      opts.randomIndex = 0;
    opts.nextSlide = opts.randomMap[opts.randomIndex];
  }
  else if (opts.backwards)
    opts.nextSlide = opts.startingSlide == 0 ? (els.length-1) : opts.startingSlide-1;
  else
    opts.nextSlide = opts.startingSlide >= (els.length-1) ? 0 : opts.startingSlide+1;

  // run transition init fn
  if (!opts.multiFx) {
    var init = $.fn.cycle.transitions[opts.fx];
    if ($.isFunction(init))
      init($cont, $slides, opts);
    else if (opts.fx != 'custom' && !opts.multiFx) {
      log('unknown transition: ' + opts.fx,'; slideshow terminating');
      return false;
    }
  }

  // fire artificial events
  var e0 = $slides[first];
  if (opts.before.length)
    opts.before[0].apply(e0, [e0, e0, opts, true]);
  if (opts.after.length > 1)
    opts.after[1].apply(e0, [e0, e0, opts, true]);

  if (opts.next)
    $(opts.next).bind(opts.prevNextEvent,function(){return advance(opts,opts.rev?-1:1)});
  if (opts.prev)
    $(opts.prev).bind(opts.prevNextEvent,function(){return advance(opts,opts.rev?1:-1)});
  if (opts.pager || opts.pagerAnchorBuilder)
    buildPager(els,opts);

  exposeAddSlide(opts, els);

  return opts;
};

// save off original opts so we can restore after clearing state
function saveOriginalOpts(opts) {
  opts.original = { before: [], after: [] };
  opts.original.cssBefore = $.extend({}, opts.cssBefore);
  opts.original.cssAfter  = $.extend({}, opts.cssAfter);
  opts.original.animIn  = $.extend({}, opts.animIn);
  opts.original.animOut   = $.extend({}, opts.animOut);
  $.each(opts.before, function() { opts.original.before.push(this); });
  $.each(opts.after,  function() { opts.original.after.push(this); });
};

function supportMultiTransitions(opts) {
  var i, tx, txs = $.fn.cycle.transitions;
  // look for multiple effects
  if (opts.fx.indexOf(',') > 0) {
    opts.multiFx = true;
    opts.fxs = opts.fx.replace(/\s*/g,'').split(',');
    // discard any bogus effect names
    for (i=0; i < opts.fxs.length; i++) {
      var fx = opts.fxs[i];
      tx = txs[fx];
      if (!tx || !txs.hasOwnProperty(fx) || !$.isFunction(tx)) {
        log('discarding unknown transition: ',fx);
        opts.fxs.splice(i,1);
        i--;
      }
    }
    // if we have an empty list then we threw everything away!
    if (!opts.fxs.length) {
      log('No valid transitions named; slideshow terminating.');
      return false;
    }
  }
  else if (opts.fx == 'all') {  // auto-gen the list of transitions
    opts.multiFx = true;
    opts.fxs = [];
    for (p in txs) {
      tx = txs[p];
      if (txs.hasOwnProperty(p) && $.isFunction(tx))
        opts.fxs.push(p);
    }
  }
  if (opts.multiFx && opts.randomizeEffects) {
    // munge the fxs array to make effect selection random
    var r1 = Math.floor(Math.random() * 20) + 30;
    for (i = 0; i < r1; i++) {
      var r2 = Math.floor(Math.random() * opts.fxs.length);
      opts.fxs.push(opts.fxs.splice(r2,1)[0]);
    }
    debug('randomized fx sequence: ',opts.fxs);
  }
  return true;
};

// provide a mechanism for adding slides after the slideshow has started
function exposeAddSlide(opts, els) {
  opts.addSlide = function(newSlide, prepend) {
    var $s = $(newSlide), s = $s[0];
    if (!opts.autostopCount)
      opts.countdown++;
    els[prepend?'unshift':'push'](s);
    if (opts.els)
      opts.els[prepend?'unshift':'push'](s); // shuffle needs this
    opts.slideCount = els.length;

    $s.css('position','absolute');
    $s[prepend?'prependTo':'appendTo'](opts.$cont);

    if (prepend) {
      opts.currSlide++;
      opts.nextSlide++;
    }

    if (!$.support.opacity && opts.cleartype && !opts.cleartypeNoBg)
      clearTypeFix($s);

    if (opts.fit && opts.width)
      $s.width(opts.width);
    if (opts.fit && opts.height && opts.height != 'auto')
      $slides.height(opts.height);
    s.cycleH = (opts.fit && opts.height) ? opts.height : $s.height();
    s.cycleW = (opts.fit && opts.width) ? opts.width : $s.width();

    $s.css(opts.cssBefore);

    if (opts.pager || opts.pagerAnchorBuilder)
      $.fn.cycle.createPagerAnchor(els.length-1, s, $(opts.pager), els, opts);

    if ($.isFunction(opts.onAddSlide))
      opts.onAddSlide($s);
    else
      $s.hide(); // default behavior
  };
}

// reset internal state; we do this on every pass in order to support multiple effects
$.fn.cycle.resetState = function(opts, fx) {
  fx = fx || opts.fx;
  opts.before = []; opts.after = [];
  opts.cssBefore = $.extend({}, opts.original.cssBefore);
  opts.cssAfter  = $.extend({}, opts.original.cssAfter);
  opts.animIn = $.extend({}, opts.original.animIn);
  opts.animOut   = $.extend({}, opts.original.animOut);
  opts.fxFn = null;
  $.each(opts.original.before, function() { opts.before.push(this); });
  $.each(opts.original.after,  function() { opts.after.push(this); });

  // re-init
  var init = $.fn.cycle.transitions[fx];
  if ($.isFunction(init))
    init(opts.$cont, $(opts.elements), opts);
};

// this is the main engine fn, it handles the timeouts, callbacks and slide index mgmt
function go(els, opts, manual, fwd) {
  // opts.busy is true if we're in the middle of an animation
  if (manual && opts.busy && opts.manualTrump) {
    // let manual transitions requests trump active ones
    debug('manualTrump in go(), stopping active transition');
    $(els).stop(true,true);
    opts.busy = false;
  }
  // don't begin another timeout-based transition if there is one active
  if (opts.busy) {
    debug('transition active, ignoring new tx request');
    return;
  }

  var p = opts.$cont[0], curr = els[opts.currSlide], next = els[opts.nextSlide];

  // stop cycling if we have an outstanding stop request
  if (p.cycleStop != opts.stopCount || p.cycleTimeout === 0 && !manual)
    return;

  // check to see if we should stop cycling based on autostop options
  if (!manual && !p.cyclePause && !opts.bounce &&
    ((opts.autostop && (--opts.countdown <= 0)) ||
    (opts.nowrap && !opts.random && opts.nextSlide < opts.currSlide))) {
    if (opts.end)
      opts.end(opts);
    return;
  }

  // if slideshow is paused, only transition on a manual trigger
  var changed = false;
  if ((manual || !p.cyclePause) && (opts.nextSlide != opts.currSlide)) {
    changed = true;
    var fx = opts.fx;
    // keep trying to get the slide size if we don't have it yet
    curr.cycleH = curr.cycleH || $(curr).height();
    curr.cycleW = curr.cycleW || $(curr).width();
    next.cycleH = next.cycleH || $(next).height();
    next.cycleW = next.cycleW || $(next).width();

    // support multiple transition types
    if (opts.multiFx) {
      if (opts.lastFx == undefined || ++opts.lastFx >= opts.fxs.length)
        opts.lastFx = 0;
      fx = opts.fxs[opts.lastFx];
      opts.currFx = fx;
    }

    // one-time fx overrides apply to:  $('div').cycle(3,'zoom');
    if (opts.oneTimeFx) {
      fx = opts.oneTimeFx;
      opts.oneTimeFx = null;
    }

    $.fn.cycle.resetState(opts, fx);

    // run the before callbacks
    if (opts.before.length)
      $.each(opts.before, function(i,o) {
        if (p.cycleStop != opts.stopCount) return;
        o.apply(next, [curr, next, opts, fwd]);
      });

    // stage the after callacks
    var after = function() {
      $.each(opts.after, function(i,o) {
        if (p.cycleStop != opts.stopCount) return;
        o.apply(next, [curr, next, opts, fwd]);
      });
    };

    debug('tx firing; currSlide: ' + opts.currSlide + '; nextSlide: ' + opts.nextSlide);

    // get ready to perform the transition
    opts.busy = 1;
    if (opts.fxFn) // fx function provided?
      opts.fxFn(curr, next, opts, after, fwd, manual && opts.fastOnEvent);
    else if ($.isFunction($.fn.cycle[opts.fx])) // fx plugin ?
      $.fn.cycle[opts.fx](curr, next, opts, after, fwd, manual && opts.fastOnEvent);
    else
      $.fn.cycle.custom(curr, next, opts, after, fwd, manual && opts.fastOnEvent);
  }

  if (changed || opts.nextSlide == opts.currSlide) {
    // calculate the next slide
    opts.lastSlide = opts.currSlide;
    if (opts.random) {
      opts.currSlide = opts.nextSlide;
      if (++opts.randomIndex == els.length)
        opts.randomIndex = 0;
      opts.nextSlide = opts.randomMap[opts.randomIndex];
      if (opts.nextSlide == opts.currSlide)
        opts.nextSlide = (opts.currSlide == opts.slideCount - 1) ? 0 : opts.currSlide + 1;
    }
    else if (opts.backwards) {
      var roll = (opts.nextSlide - 1) < 0;
      if (roll && opts.bounce) {
        opts.backwards = !opts.backwards;
        opts.nextSlide = 1;
        opts.currSlide = 0;
      }
      else {
        opts.nextSlide = roll ? (els.length-1) : opts.nextSlide-1;
        opts.currSlide = roll ? 0 : opts.nextSlide+1;
      }
    }
    else { // sequence
      var roll = (opts.nextSlide + 1) == els.length;
      if (roll && opts.bounce) {
        opts.backwards = !opts.backwards;
        opts.nextSlide = els.length-2;
        opts.currSlide = els.length-1;
      }
      else {
        opts.nextSlide = roll ? 0 : opts.nextSlide+1;
        opts.currSlide = roll ? els.length-1 : opts.nextSlide-1;
      }
    }
  }
  if (changed && opts.pager)
    opts.updateActivePagerLink(opts.pager, opts.currSlide, opts.activePagerClass);

  // stage the next transition
  var ms = 0;
  if (opts.timeout && !opts.continuous)
    ms = getTimeout(els[opts.currSlide], els[opts.nextSlide], opts, fwd);
  else if (opts.continuous && p.cyclePause) // continuous shows work off an after callback, not this timer logic
    ms = 10;
  if (ms > 0)
    p.cycleTimeout = setTimeout(function(){ go(els, opts, 0, (!opts.rev && !opts.backwards)) }, ms);
  environment.SetPageFlag('lastCycleTimeout', p.cycleTimeout);
};

// invoked after transition
$.fn.cycle.updateActivePagerLink = function(pager, currSlide, clsName) {
   $(pager).each(function() {
       $(this).children().removeClass(clsName).eq(currSlide).addClass(clsName);
   });
};

// calculate timeout value for current transition
function getTimeout(curr, next, opts, fwd) {
  if (opts.timeoutFn) {
    // call user provided calc fn
    var t = opts.timeoutFn.call(curr,curr,next,opts,fwd);
    while ((t - opts.speed) < 250) // sanitize timeout
      t += opts.speed;
    debug('calculated timeout: ' + t + '; speed: ' + opts.speed);
    if (t !== false)
      return t;
  }
  return opts.timeout;
};

// expose next/prev function, caller must pass in state
$.fn.cycle.next = function(opts) { advance(opts, opts.rev?-1:1); };
$.fn.cycle.prev = function(opts) { advance(opts, opts.rev?1:-1);};

// advance slide forward or back
function advance(opts, val) {
  var els = opts.elements;
  var p = opts.$cont[0], timeout = p.cycleTimeout;
  if (timeout) {
    clearTimeout(timeout);
    p.cycleTimeout = 0;
  }
  if (opts.random && val < 0) {
    // move back to the previously display slide
    opts.randomIndex--;
    if (--opts.randomIndex == -2)
      opts.randomIndex = els.length-2;
    else if (opts.randomIndex == -1)
      opts.randomIndex = els.length-1;
    opts.nextSlide = opts.randomMap[opts.randomIndex];
  }
  else if (opts.random) {
    opts.nextSlide = opts.randomMap[opts.randomIndex];
  }
  else {
    opts.nextSlide = opts.currSlide + val;
    if (opts.nextSlide < 0) {
      if (opts.nowrap) return false;
      opts.nextSlide = els.length - 1;
    }
    else if (opts.nextSlide >= els.length) {
      if (opts.nowrap) return false;
      opts.nextSlide = 0;
    }
  }

  var cb = opts.onPrevNextEvent || opts.prevNextClick; // prevNextClick is deprecated
  if ($.isFunction(cb))
    cb(val > 0, opts.nextSlide, els[opts.nextSlide]);
  go(els, opts, 1, val>=0);
  return false;
};

function buildPager(els, opts) {
  var $p = $(opts.pager);
  $.each(els, function(i,o) {
    $.fn.cycle.createPagerAnchor(i,o,$p,els,opts);
  });
  opts.updateActivePagerLink(opts.pager, opts.startingSlide, opts.activePagerClass);
};

$.fn.cycle.createPagerAnchor = function(i, el, $p, els, opts) {
  var a;
  if ($.isFunction(opts.pagerAnchorBuilder)) {
    a = opts.pagerAnchorBuilder(i,el);
    debug('pagerAnchorBuilder('+i+', el) returned: ' + a);
  }
  else
    a = '<a href="#">'+(i+1)+'</a>';

  if (!a)
    return;
  var $a = $(a);
  // don't reparent if anchor is in the dom
  if ($a.parents('body').length === 0) {
    var arr = [];
    if ($p.length > 1) {
      $p.each(function() {
        var $clone = $a.clone(true);
        $(this).append($clone);
        arr.push($clone[0]);
      });
      $a = $(arr);
    }
    else {
      $a.appendTo($p);
    }
  }

  opts.pagerAnchors =  opts.pagerAnchors || [];
  opts.pagerAnchors.push($a);
  $a.bind(opts.pagerEvent, function(e) {
    e.preventDefault();
    opts.nextSlide = i;
    var p = opts.$cont[0], timeout = p.cycleTimeout;
    if (timeout) {
      clearTimeout(timeout);
      p.cycleTimeout = 0;
    }
    var cb = opts.onPagerEvent || opts.pagerClick; // pagerClick is deprecated
    if ($.isFunction(cb))
      cb(opts.nextSlide, els[opts.nextSlide]);
    go(els,opts,1,opts.currSlide < i); // trigger the trans
//    return false; // <== allow bubble
  });

  if ( ! /^click/.test(opts.pagerEvent) && !opts.allowPagerClickBubble)
    $a.bind('click.cycle', function(){return false;}); // suppress click

  if (opts.pauseOnPagerHover)
    $a.hover(function() { opts.$cont[0].cyclePause++; }, function() { opts.$cont[0].cyclePause--; } );
};

// helper fn to calculate the number of slides between the current and the next
$.fn.cycle.hopsFromLast = function(opts, fwd) {
  var hops, l = opts.lastSlide, c = opts.currSlide;
  if (fwd)
    hops = c > l ? c - l : opts.slideCount - l;
  else
    hops = c < l ? l - c : l + opts.slideCount - c;
  return hops;
};

// fix clearType problems in ie6 by setting an explicit bg color
// (otherwise text slides look horrible during a fade transition)
function clearTypeFix($slides) {
  debug('applying clearType background-color hack');
  function hex(s) {
    s = parseInt(s).toString(16);
    return s.length < 2 ? '0'+s : s;
  };
  function getBg(e) {
    for ( ; e && e.nodeName.toLowerCase() != 'html'; e = e.parentNode) {
      var v = $.css(e,'background-color');
      if (v.indexOf('rgb') >= 0 ) {
        var rgb = v.match(/\d+/g);
        return '#'+ hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
      }
      if (v && v != 'transparent')
        return v;
    }
    return '#ffffff';
  };
  //$slides.each(function() { $(this).css('background-color', getBg(this)); });
};

// reset common props before the next transition
$.fn.cycle.commonReset = function(curr,next,opts,w,h,rev) {
  $(opts.elements).not(curr).hide();
  opts.cssBefore.opacity = 1;
  opts.cssBefore.display = 'block';
  if (w !== false && next.cycleW > 0)
    opts.cssBefore.width = next.cycleW;
  if (h !== false && next.cycleH > 0)
    opts.cssBefore.height = next.cycleH;
  opts.cssAfter = opts.cssAfter || {};
  opts.cssAfter.display = 'none';
  $(curr).css('zIndex',opts.slideCount + (rev === true ? 1 : 0));
  $(next).css('zIndex',opts.slideCount + (rev === true ? 0 : 1));
};

// the actual fn for effecting a transition
$.fn.cycle.custom = function(curr, next, opts, cb, fwd, speedOverride) {
  var $l = $(curr), $n = $(next);
  var speedIn = opts.speedIn, speedOut = opts.speedOut, easeIn = opts.easeIn, easeOut = opts.easeOut;
  $n.css(opts.cssBefore);
  if (speedOverride) {
    if (typeof speedOverride == 'number')
      speedIn = speedOut = speedOverride;
    else
      speedIn = speedOut = 1;
    easeIn = easeOut = null;
  }
  var fn = function() {$n.animate(opts.animIn, speedIn, easeIn, cb)};
  $l.animate(opts.animOut, speedOut, easeOut, function() {
    if (opts.cssAfter) $l.css(opts.cssAfter);
    if (!opts.sync) fn();
  });
  if (opts.sync) fn();
};

// transition definitions - only fade is defined here, transition pack defines the rest
$.fn.cycle.transitions = {
  fade: function($cont, $slides, opts) {
    $slides.not(':eq('+opts.currSlide+')').css('opacity',0);
    opts.before.push(function(curr,next,opts) {
      $.fn.cycle.commonReset(curr,next,opts);
      opts.cssBefore.opacity = 0;
    });
    opts.animIn    = { opacity: 1 };
    opts.animOut   = { opacity: 0 };
    opts.cssBefore = { top: 0, left: 0 };
  }
};

$.fn.cycle.ver = function() { return ver; };

// override these globally if you like (they are all optional)
$.fn.cycle.defaults = {
  fx:       'fade', // name of transition effect (or comma separated names, ex: 'fade,scrollUp,shuffle')
  timeout:     4000,  // milliseconds between slide transitions (0 to disable auto advance)
  timeoutFn:     null,  // callback for determining per-slide timeout value:  function(currSlideElement, nextSlideElement, options, forwardFlag)
  continuous:    0,   // true to start next transition immediately after current one completes
  speed:       1000,  // speed of the transition (any valid fx speed value)
  speedIn:     null,  // speed of the 'in' transition
  speedOut:    null,  // speed of the 'out' transition
  next:      null,  // selector for element to use as event trigger for next slide
  prev:      null,  // selector for element to use as event trigger for previous slide
//  prevNextClick: null,  // @deprecated; please use onPrevNextEvent instead
  onPrevNextEvent: null,  // callback fn for prev/next events: function(isNext, zeroBasedSlideIndex, slideElement)
  prevNextEvent:'click.cycle',// event which drives the manual transition to the previous or next slide
  pager:       null,  // selector for element to use as pager container
  //pagerClick   null,  // @deprecated; please use onPagerEvent instead
  onPagerEvent:  null,  // callback fn for pager events: function(zeroBasedSlideIndex, slideElement)
  pagerEvent:   'click.cycle', // name of event which drives the pager navigation
  allowPagerClickBubble: false, // allows or prevents click event on pager anchors from bubbling
  pagerAnchorBuilder: null, // callback fn for building anchor links:  function(index, DOMelement)
  before:      null,  // transition callback (scope set to element to be shown):   function(currSlideElement, nextSlideElement, options, forwardFlag)
  after:       null,  // transition callback (scope set to element that was shown):  function(currSlideElement, nextSlideElement, options, forwardFlag)
  end:       null,  // callback invoked when the slideshow terminates (use with autostop or nowrap options): function(options)
  easing:      null,  // easing method for both in and out transitions
  easeIn:      null,  // easing for "in" transition
  easeOut:     null,  // easing for "out" transition
  shuffle:     null,  // coords for shuffle animation, ex: { top:15, left: 200 }
  animIn:      null,  // properties that define how the slide animates in
  animOut:     null,  // properties that define how the slide animates out
  cssBefore:     null,  // properties that define the initial state of the slide before transitioning in
  cssAfter:    null,  // properties that defined the state of the slide after transitioning out
  fxFn:      null,  // function used to control the transition: function(currSlideElement, nextSlideElement, options, afterCalback, forwardFlag)
  height:     'auto', // container height
  startingSlide: 0,   // zero-based index of the first slide to be displayed
  sync:      1,   // true if in/out transitions should occur simultaneously
  random:      0,   // true for random, false for sequence (not applicable to shuffle fx)
  fit:       0,   // force slides to fit container
  containerResize: 1,   // resize container to fit largest slide
  pause:       0,   // true to enable "pause on hover"
  pauseOnPagerHover: 0, // true to pause when hovering over pager link
  autostop:    0,   // true to end slideshow after X transitions (where X == slide count)
  autostopCount: 0,   // number of transitions (optionally used with autostop to define X)
  delay:       0,   // additional delay (in ms) for first transition (hint: can be negative)
  slideExpr:     null,  // expression for selecting slides (if something other than all children is required)
  cleartype:     !$.support.opacity,  // true if clearType corrections should be applied (for IE)
  cleartypeNoBg: false, // set to true to disable extra cleartype fixing (leave false to force background color setting on slides)
  nowrap:      0,   // true to prevent slideshow from wrapping
  fastOnEvent:   0,   // force fast transitions when triggered manually (via pager or prev/next); value == time in ms
  randomizeEffects: 1,  // valid when multiple effects are used; true to make the effect sequence random
  rev:       0,  // causes animations to transition in reverse
  manualTrump:   true,  // causes manual transition to stop an active transition instead of being ignored
  requeueOnImageNotLoaded: true, // requeue the slideshow if any image slides are not yet loaded
  requeueTimeout: 250,  // ms delay for requeue
  activePagerClass: 'activeSlide', // class name used for the active pager link
  updateActivePagerLink: null, // callback fn invoked to update the active pager link (adds/removes activePagerClass style)
  backwards:     false  // true to start slideshow at last slide and move backwards through the stack
};

})(jQuery);


/*!
 * jQuery Cycle Plugin Transition Definitions
 * This script is a plugin for the jQuery Cycle Plugin
 * Examples and documentation at: http://malsup.com/jquery/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version:  2.72
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */
(function($) {

//
// These functions define one-time slide initialization for the named
// transitions. To save file size feel free to remove any of these that you
// don't need.
//
$.fn.cycle.transitions.none = function($cont, $slides, opts) {
  opts.fxFn = function(curr,next,opts,after){
    $(next).show();
    $(curr).hide();
    after();
  };
}

// scrollUp/Down/Left/Right
$.fn.cycle.transitions.scrollUp = function($cont, $slides, opts) {
  $cont.css('overflow','hidden');
  opts.before.push($.fn.cycle.commonReset);
  var h = $cont.height();
  opts.cssBefore ={ top: h, left: 0 };
  opts.cssFirst = { top: 0 };
  opts.animIn   = { top: 0 };
  opts.animOut  = { top: -h };
};
$.fn.cycle.transitions.scrollDown = function($cont, $slides, opts) {
  $cont.css('overflow','hidden');
  opts.before.push($.fn.cycle.commonReset);
  var h = $cont.height();
  opts.cssFirst = { top: 0 };
  opts.cssBefore= { top: -h, left: 0 };
  opts.animIn   = { top: 0 };
  opts.animOut  = { top: h };
};
$.fn.cycle.transitions.scrollLeft = function($cont, $slides, opts) {
  $cont.css('overflow','hidden');
  opts.before.push($.fn.cycle.commonReset);
  var w = $cont.width();
  opts.cssFirst = { left: 0 };
  opts.cssBefore= { left: w, top: 0 };
  opts.animIn   = { left: 0 };
  opts.animOut  = { left: 0-w };
};
$.fn.cycle.transitions.scrollRight = function($cont, $slides, opts) {
  $cont.css('overflow','hidden');
  opts.before.push($.fn.cycle.commonReset);
  var w = $cont.width();
  opts.cssFirst = { left: 0 };
  opts.cssBefore= { left: -w, top: 0 };
  opts.animIn   = { left: 0 };
  opts.animOut  = { left: w };
};
$.fn.cycle.transitions.scrollHorz = function($cont, $slides, opts) {
  $cont.css('overflow','hidden');
  opts.before.push(function(curr, next, opts, fwd) {
    $.fn.cycle.commonReset(curr,next,opts);
    opts.cssBefore.left = fwd ? next.cycleW + opts.margin : - (next.cycleW + opts.margin);
    opts.animOut.left = fwd ? -(curr.cycleW + opts.margin) : curr.cycleW + opts.margin;
  });
  opts.cssFirst = { left: 0 };
  opts.cssBefore= { top: 0 };
  opts.animIn   = { left: 0 };
  opts.animOut  = { top: 0 };
};
$.fn.cycle.transitions.scrollVert = function($cont, $slides, opts) {
  $cont.css('overflow','hidden');
  opts.before.push(function(curr, next, opts, fwd) {
    $.fn.cycle.commonReset(curr,next,opts);
    opts.cssBefore.top = fwd ? (1-next.cycleH) : (next.cycleH-1);
    opts.animOut.top = fwd ? curr.cycleH : -curr.cycleH;
  });
  opts.cssFirst = { top: 0 };
  opts.cssBefore= { left: 0 };
  opts.animIn   = { top: 0 };
  opts.animOut  = { left: 0 };
};

// slideX/slideY
$.fn.cycle.transitions.slideX = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $(opts.elements).not(curr).hide();
    $.fn.cycle.commonReset(curr,next,opts,false,true);
    opts.animIn.width = next.cycleW;
  });
  opts.cssBefore = { left: 0, top: 0, width: 0 };
  opts.animIn  = { width: 'show' };
  opts.animOut = { width: 0 };
};
$.fn.cycle.transitions.slideY = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $(opts.elements).not(curr).hide();
    $.fn.cycle.commonReset(curr,next,opts,true,false);
    opts.animIn.height = next.cycleH;
  });
  opts.cssBefore = { left: 0, top: 0, height: 0 };
  opts.animIn  = { height: 'show' };
  opts.animOut = { height: 0 };
};

// shuffle
$.fn.cycle.transitions.shuffle = function($cont, $slides, opts) {
  var i, w = $cont.css('overflow', 'visible').width();
  $slides.css({left: 0, top: 0});
  opts.before.push(function(curr,next,opts) {
    $.fn.cycle.commonReset(curr,next,opts,true,true,true);
  });
  // only adjust speed once!
  if (!opts.speedAdjusted) {
    opts.speed = opts.speed / 2; // shuffle has 2 transitions
    opts.speedAdjusted = true;
  }
  opts.random = 0;
  opts.shuffle = opts.shuffle || {left:-w, top:15};
  opts.els = [];
  for (i=0; i < $slides.length; i++)
    opts.els.push($slides[i]);

  for (i=0; i < opts.currSlide; i++)
    opts.els.push(opts.els.shift());

  // custom transition fn (hat tip to Benjamin Sterling for this bit of sweetness!)
  opts.fxFn = function(curr, next, opts, cb, fwd) {
    var $el = fwd ? $(curr) : $(next);
    $(next).css(opts.cssBefore);
    var count = opts.slideCount;
    $el.animate(opts.shuffle, opts.speedIn, opts.easeIn, function() {
      var hops = $.fn.cycle.hopsFromLast(opts, fwd);
      for (var k=0; k < hops; k++)
        fwd ? opts.els.push(opts.els.shift()) : opts.els.unshift(opts.els.pop());
      if (fwd) {
        for (var i=0, len=opts.els.length; i < len; i++)
          $(opts.els[i]).css('z-index', len-i+count);
      }
      else {
        var z = $(curr).css('z-index');
        $el.css('z-index', parseInt(z)+1+count);
      }
      $el.animate({left:0, top:0}, opts.speedOut, opts.easeOut, function() {
        $(fwd ? this : curr).hide();
        if (cb) cb();
      });
    });
  };
  opts.cssBefore = { display: 'block', opacity: 1, top: 0, left: 0 };
};

// turnUp/Down/Left/Right
$.fn.cycle.transitions.turnUp = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,true,false);
    opts.cssBefore.top = next.cycleH;
    opts.animIn.height = next.cycleH;
  });
  opts.cssFirst  = { top: 0 };
  opts.cssBefore = { left: 0, height: 0 };
  opts.animIn    = { top: 0 };
  opts.animOut   = { height: 0 };
};
$.fn.cycle.transitions.turnDown = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,true,false);
    opts.animIn.height = next.cycleH;
    opts.animOut.top   = curr.cycleH;
  });
  opts.cssFirst  = { top: 0 };
  opts.cssBefore = { left: 0, top: 0, height: 0 };
  opts.animOut   = { height: 0 };
};
$.fn.cycle.transitions.turnLeft = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,false,true);
    opts.cssBefore.left = next.cycleW;
    opts.animIn.width = next.cycleW;
  });
  opts.cssBefore = { top: 0, width: 0  };
  opts.animIn    = { left: 0 };
  opts.animOut   = { width: 0 };
};
$.fn.cycle.transitions.turnRight = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,false,true);
    opts.animIn.width = next.cycleW;
    opts.animOut.left = curr.cycleW;
  });
  opts.cssBefore = { top: 0, left: 0, width: 0 };
  opts.animIn    = { left: 0 };
  opts.animOut   = { width: 0 };
};

// zoom
$.fn.cycle.transitions.zoom = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,false,false,true);
    opts.cssBefore.top = next.cycleH/2;
    opts.cssBefore.left = next.cycleW/2;
    opts.animIn    = { top: 0, left: 0, width: next.cycleW, height: next.cycleH };
    opts.animOut   = { width: 0, height: 0, top: curr.cycleH/2, left: curr.cycleW/2 };
  });
  opts.cssFirst = { top:0, left: 0 };
  opts.cssBefore = { width: 0, height: 0 };
};

// fadeZoom
$.fn.cycle.transitions.fadeZoom = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,false,false);
    opts.cssBefore.left = next.cycleW/2;
    opts.cssBefore.top = next.cycleH/2;
    opts.animIn = { top: 0, left: 0, width: next.cycleW, height: next.cycleH };
  });
  opts.cssBefore = { width: 0, height: 0 };
  opts.animOut  = { opacity: 0 };
};

// blindX
$.fn.cycle.transitions.blindX = function($cont, $slides, opts) {
  var w = $cont.css('overflow','hidden').width();
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts);
    opts.animIn.width = next.cycleW;
    opts.animOut.left   = curr.cycleW;
  });
  opts.cssBefore = { left: w, top: 0 };
  opts.animIn = { left: 0 };
  opts.animOut  = { left: w };
};
// blindY
$.fn.cycle.transitions.blindY = function($cont, $slides, opts) {
  var h = $cont.css('overflow','hidden').height();
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts);
    opts.animIn.height = next.cycleH;
    opts.animOut.top   = curr.cycleH;
  });
  opts.cssBefore = { top: h, left: 0 };
  opts.animIn = { top: 0 };
  opts.animOut  = { top: h };
};
// blindZ
$.fn.cycle.transitions.blindZ = function($cont, $slides, opts) {
  var h = $cont.css('overflow','hidden').height();
  var w = $cont.width();
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts);
    opts.animIn.height = next.cycleH;
    opts.animOut.top   = curr.cycleH;
  });
  opts.cssBefore = { top: h, left: w };
  opts.animIn = { top: 0, left: 0 };
  opts.animOut  = { top: h, left: w };
};

// growX - grow horizontally from centered 0 width
$.fn.cycle.transitions.growX = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,false,true);
    opts.cssBefore.left = this.cycleW/2;
    opts.animIn = { left: 0, width: this.cycleW };
    opts.animOut = { left: 0 };
  });
  opts.cssBefore = { width: 0, top: 0 };
};
// growY - grow vertically from centered 0 height
$.fn.cycle.transitions.growY = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,true,false);
    opts.cssBefore.top = this.cycleH/2;
    opts.animIn = { top: 0, height: this.cycleH };
    opts.animOut = { top: 0 };
  });
  opts.cssBefore = { height: 0, left: 0 };
};

// curtainX - squeeze in both edges horizontally
$.fn.cycle.transitions.curtainX = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,false,true,true);
    opts.cssBefore.left = next.cycleW/2;
    opts.animIn = { left: 0, width: this.cycleW };
    opts.animOut = { left: curr.cycleW/2, width: 0 };
  });
  opts.cssBefore = { top: 0, width: 0 };
};
// curtainY - squeeze in both edges vertically
$.fn.cycle.transitions.curtainY = function($cont, $slides, opts) {
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,true,false,true);
    opts.cssBefore.top = next.cycleH/2;
    opts.animIn = { top: 0, height: next.cycleH };
    opts.animOut = { top: curr.cycleH/2, height: 0 };
  });
  opts.cssBefore = { left: 0, height: 0 };
};

// cover - curr slide covered by next slide
$.fn.cycle.transitions.cover = function($cont, $slides, opts) {
  var d = opts.direction || 'left';
  var w = $cont.css('overflow','hidden').width();
  var h = $cont.height();
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts);
    if (d == 'right')
      opts.cssBefore.left = -w;
    else if (d == 'up')
      opts.cssBefore.top = h;
    else if (d == 'down')
      opts.cssBefore.top = -h;
    else
      opts.cssBefore.left = w;
  });
  opts.animIn = { left: 0, top: 0};
  opts.animOut = { opacity: 1 };
  opts.cssBefore = { top: 0, left: 0 };
};

// uncover - curr slide moves off next slide
$.fn.cycle.transitions.uncover = function($cont, $slides, opts) {
  var d = opts.direction || 'left';
  var w = $cont.css('overflow','hidden').width();
  var h = $cont.height();
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,true,true,true);
    if (d == 'right')
      opts.animOut.left = w;
    else if (d == 'up')
      opts.animOut.top = -h;
    else if (d == 'down')
      opts.animOut.top = h;
    else
      opts.animOut.left = -w;
  });
  opts.animIn = { left: 0, top: 0 };
  opts.animOut = { opacity: 1 };
  opts.cssBefore = { top: 0, left: 0 };
};

// toss - move top slide and fade away
$.fn.cycle.transitions.toss = function($cont, $slides, opts) {
  var w = $cont.css('overflow','visible').width();
  var h = $cont.height();
  opts.before.push(function(curr, next, opts) {
    $.fn.cycle.commonReset(curr,next,opts,true,true,true);
    // provide default toss settings if animOut not provided
    if (!opts.animOut.left && !opts.animOut.top)
      opts.animOut = { left: w*2, top: -h/2, opacity: 0 };
    else
      opts.animOut.opacity = 0;
  });
  opts.cssBefore = { left: 0, top: 0 };
  opts.animIn = { left: 0 };
};

// wipe - clip animation
$.fn.cycle.transitions.wipe = function($cont, $slides, opts) {
  var w = $cont.css('overflow','hidden').width();
  var h = $cont.height();
  opts.cssBefore = opts.cssBefore || {};
  var clip;
  if (opts.clip) {
    if (/l2r/.test(opts.clip))
      clip = 'rect(0px 0px '+h+'px 0px)';
    else if (/r2l/.test(opts.clip))
      clip = 'rect(0px '+w+'px '+h+'px '+w+'px)';
    else if (/t2b/.test(opts.clip))
      clip = 'rect(0px '+w+'px 0px 0px)';
    else if (/b2t/.test(opts.clip))
      clip = 'rect('+h+'px '+w+'px '+h+'px 0px)';
    else if (/zoom/.test(opts.clip)) {
      var top = parseInt(h/2);
      var left = parseInt(w/2);
      clip = 'rect('+top+'px '+left+'px '+top+'px '+left+'px)';
    }
  }

  opts.cssBefore.clip = opts.cssBefore.clip || clip || 'rect(0px 0px 0px 0px)';

  var d = opts.cssBefore.clip.match(/(\d+)/g);
  var t = parseInt(d[0]), r = parseInt(d[1]), b = parseInt(d[2]), l = parseInt(d[3]);

  opts.before.push(function(curr, next, opts) {
    if (curr == next) return;
    var $curr = $(curr), $next = $(next);
    $.fn.cycle.commonReset(curr,next,opts,true,true,false);
    opts.cssAfter.display = 'block';

    var step = 1, count = parseInt((opts.speedIn / 13)) - 1;
    (function f() {
      var tt = t ? t - parseInt(step * (t/count)) : 0;
      var ll = l ? l - parseInt(step * (l/count)) : 0;
      var bb = b < h ? b + parseInt(step * ((h-b)/count || 1)) : h;
      var rr = r < w ? r + parseInt(step * ((w-r)/count || 1)) : w;
      $next.css({ clip: 'rect('+tt+'px '+rr+'px '+bb+'px '+ll+'px)' });
      (step++ <= count) ? setTimeout(f, 13) : $curr.css('display', 'none');
    })();
  });
  opts.cssBefore = { display: 'block', opacity: 1, top: 0, left: 0 };
  opts.animIn    = { left: 0 };
  opts.animOut   = { left: 0 };
};

})(jQuery);
;
function activateGalleryNavigation()
{
  $("#slide-view-"+$("#currentSlideSearchGuid").val()).addClass("slideShowNavigation");
}


function loadGallery(oParam)
{
  var allowModalClose = true;
  var disallowModal = false;

  if (environment.GetPageFlag('disallowModal'))
    disallowModal = environment.GetPageFlag('disallowModal');

  if (oParam.disallowModal)
    disallowModal = oParam.disallowModal;

  if (!disallowModal)
    OpenProgressDlg();

  if (environment.GetPageFlag('allowModalClose') == false)
    allowModalClose = false;

  environment.RemovePageFlag('allowModalClose');
  $("#currentSlideSearchGuid").val(oParam.usersearchguid);
  $("#currentSlideViewType").val(oParam.userlistingviewtype);

  for (var s=0;s<oParam.slideViews.length;s++)
  {
    $("#slide-view-"+oParam.slideViews[s]).removeClass("slideShowNavigation");
  }

  activateGalleryNavigation();
  environment.SetPageFlag('SlideLoadProgress',true);
  stepcarousel.loadcontent(oParam.galleryID, oParam.location+'usersearchguid/'+oParam.usersearchguid+'/userlistingviewtype/'+oParam.userlistingviewtype,allowModalClose);
}

/*
* Function: reloadGallery
*  - reloads the slideshow gallery for the search page on each search
*/

function reloadGallery(oParam)
{
  if (isEmptyString(environment.GetPageFlag('galleryTabLoaded')))
  {
    var ajaxAdapterTmp = new AJAXAdapter();
    ajaxAdapterTmp.async = false;
    ajaxAdapterTmp.setParametersString('UserSearchGUID='+$("#searchForm > #userSearchGUID").val());
    ajaxAdapterTmp.call(url+'ajaxSlideShowNav',reloadGalleryNav);
    environment.SetPageFlag('allowModalClose',false);
  }
  environment.SetPageFlag('galleryTabLoaded',true);
}

function reloadGalleryNav(htmlData)
{
  $("#search-gallery-middle-nav").html(htmlData);
  $("#slide-link-"+$("#currentSlideSearchGuid").val()).trigger("click");
}

function showSlideShowListingOnMap(slideShowListingInfo)
{
     hideAdvancedSearchDiv();
     capsuleProperties.hideCloseButtonOnCapsule = false;
       var theMap = mapManager.GetMapObject('mapSearch');
     // make sure the mapChange event doesn't get triggered
     applyRefreshSearchResults = false;
     var centerMap = false;
     var pinsArrLen = 0;
     var i = 0;
     var addPropertyToMap = true;

     if (!isEmptyString(theMap.PushPinsToMapArray))
     {
        pinsArrLen = theMap.PushPinsToMapArray.length
        while(i < pinsArrLen)
        {
        if (theMap.PushPinsToMapArray[i].id == slideShowListingInfo["listingguid"])
          addPropertyToMap = false;
          i++;
        }
    }

    if (addPropertyToMap)
        theMap.AddPropertyToMap(slideShowListingInfo,applyRefreshSearchResults, centerMap);

    // put the property detail info in the collection
    // TODO: set it when available
    var propertyDetail = {listingId:slideShowListingInfo["listingid"],listingGUID:slideShowListingInfo["listingguid"]};
    propertyDetailsArray.AddObject(propertyDetail,slideShowListingInfo["listingguid"]);

    // make sure to delete the existing infobox (temporarily enable the pushpin hover)
    theMap.EnablePushpinHover(true);
    theMap.clearMapInfoBox();
    theMap.EnablePushpinHover(false);

      showListingBoxOnMap(slideShowListingInfo["listingguid"],'mapSearch','slideshowanchor');
}

function DisplaySlideCapsule(oParam)
{
  $("#search-gallery-tooltip").css({'left' : eval($("#"+oParam.id).offset().left-$("#search-gallery").offset().left+10) +'px', 'top' : '177px'});
  $("#search-gallery-tooltip").html($("#"+oParam.id).html());
  $("#search-gallery-tooltip").show();
}

function HideDisplayCapsule()
{
  $("#search-gallery-tooltip").hide();
  $("#search-gallery-tooltip").empty();
}

/*
 * Function: slideShowExecution
 *  slide show execution setting
 *
 * Parameters:
 *  slideShowContainerID - slide show container ID
*/
function slideShowExecution(slideShowContainerID)
{
  var effect = environment.GetPageFlag("slideShowEffect_" + slideShowContainerID);
  var timeFrequency = environment.GetPageFlag("timeFrequency_" + slideShowContainerID);
  var numberOfPages = environment.GetPageFlag("numberOfPages_" + slideShowContainerID);
  var defaultState = environment.GetPageFlag("defaultState_" + slideShowContainerID);
  var defaultStartPage = environment.GetPageFlag("currentSlide_" + slideShowContainerID);
  $('#' + slideShowContainerID).cycle({
                    startingSlide: defaultStartPage,
                    fx: effect,
                    timeout: timeFrequency,
                    margin: 10,
                    after: function(current, next, opts) {
                      $("#pagenum_"+slideShowContainerID).html(opts.currSlide+1);
                      environment.SetPageFlag("currentSlide_" + slideShowContainerID, opts.nextSlide - 1);
                      }
                    });
  if (numberOfPages < 2)
  {
    $('#previous_' + slideShowContainerID).attr('disabled', 'disabled');
    $('#next_' + slideShowContainerID).attr('disabled', 'disabled');
  }
  $('#previous_' + slideShowContainerID).click(function()
  {
    $('#' + slideShowContainerID).cycle('prev');
    $('#pause_' + slideShowContainerID).click();
  });
  $('#next_' + slideShowContainerID).click(function()
  {
    $('#' + slideShowContainerID).cycle('next');
    $('#pause_' + slideShowContainerID).click();
  });
  $('#pause_' + slideShowContainerID).click(function()
  {
    $('#' + slideShowContainerID).cycle('pause');
    $('#play_' + slideShowContainerID).show();
    $('#pause_' + slideShowContainerID).hide();
  });
  $('#play_' + slideShowContainerID).click(function()
  {
    $('#' + slideShowContainerID).cycle('resume');
    $('#play_' + slideShowContainerID).hide();
    $('#pause_' + slideShowContainerID).show();
  });
  if (defaultState == 1)
    $('#play_' + slideShowContainerID).click();
  else
    $('#pause_' + slideShowContainerID).click();
}

/*
 * Function: stopSlideShowExecution
 *  stop slide show execution
 *
 * Parameters:
 *  slideShowContainerID - slide show container ID
*/
function stopSlideShowExecution(slideShowContainerID)
{
  $('#pause_' + slideShowContainerID).click();
}

function destroySlideShow()
{
  if (environment.GetPageFlag('lastCycleTimeout') != null)
  {
    clearTimeout(environment.GetPageFlag('lastCycleTimeout'));
    environment.RemovePageFlag('lastCycleTimeout');
  }
};
