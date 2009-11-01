// Copyright (C) 2007 Noel O'Boyle
//
// Released under the GPL license
// http://www.gnu.org/copyleft/gpl.html
// --------------------------------------------------------------------
//
// ==UserScript==
// @name          Quotes from Chemical Blogspace and PostGenomic
// @namespace     http://blueobelisk.org
// @description   Adds Chemical Blogspace and PostGenomic content to Table of Contents pages
// @include       http://pubs*.acs.org/*
// @include       http://www.rsc.org/*
// @include       http://www*.interscience.wiley.com/*
// @include       http://www.nature.com/*
// @include       http://*.oxfordjournals.org/*
// @include       http://*.plosjournals.org/*
// @include       http://www.pnas.org/*
// @include       http://www.biomedcentral.com/*
// @include       http://www.citeulike.org/*
// ==/UserScript==
//
// CHANGELOG
//
// 27-Jun-07: Changed the namespace to http://blueobelisk.org
//            Added BMC and CUL, as suggested by Egon
//            Added brackets to DOI regexp, as suggested by Egon
//            Updated for move of CB to http://cb.openmolecules.net
//


function updateMenu(sitestoinclude) {

  if (sitestoinclude & 1)
    GM_registerMenuCommand("CBWQ: Don't include Chemical Blogspace",
             function(e) {GM_setValue("chemical_blogspace_include_postgenomic",
                                      sitestoinclude ^ 1);});
  else
    GM_registerMenuCommand("CBWQ: Include Chemical Blogspace",
             function(e) {GM_setValue("chemical_blogspace_include_postgenomic",
                                      sitestoinclude ^ 1);});

  if (sitestoinclude & 2)
    GM_registerMenuCommand("CBWQ: Don't include Postgenomic",
             function(e) {GM_setValue("chemical_blogspace_include_postgenomic",
                                      sitestoinclude ^ 2);});
  else
    GM_registerMenuCommand("CBWQ: Include Postgenomic",
             function(e) {GM_setValue("chemical_blogspace_include_postgenomic",
                                      sitestoinclude ^ 2);});
}

// sitestoinclude = CB (bit 1), PG (bit 2)
var sitestoinclude = GM_getValue("chemical_blogspace_include_postgenomic", 99);
if (sitestoinclude==99) {
  GM_setValue("chemical_blogspace_include_postgenomic", 1 | 2);
  sitestoinclude = GM_getValue("chemical_blogspace_include_postgenomic", 1 | 2);
  }
updateMenu(sitestoinclude);

// Load overlib
var p = unsafeWindow;
function waitForOverlib() {
    if (typeof p.olMain=='undefined')
  // set to check every 100 milliseconds if the libary has loaded
        window.setTimeout(waitForOverlib, 100);
    else
        main();
}
function loadOverlib() {
  // dynamically creates a script tag
        var overlib = document.createElement('script');
        overlib.type = 'text/javascript';
        overlib.src = 'http://www.redbrick.dcu.ie/~noel/Tools/overlib_bubble/all_overlib.js';
        document.getElementsByTagName('head')[0].appendChild(overlib);
        waitForOverlib();
}
window.addEventListener('load', loadOverlib(), false);
// Finished loading overlib

function main() {
  var d = new Date();
  var curr_date = d.getDate();
  var DOI_list="";
  var cb_stored_date= GM_getValue("chemical_blogspace_data_date", 0);
  var pg_stored_date= GM_getValue("postgenomic_data_date", 0);
  var sitestoinclude = GM_getValue("chemical_blogspace_include_postgenomic", 1 | 2);
  // Check for new DOIs only once per day
  if (cb_stored_date != curr_date && sitestoinclude & 1)
  {
    get_DOI_list("http://cb.openmolecules.net/api.php?type=paper&ids_only=1", "chemical_blogspace_ID_list");
    GM_setValue("chemical_blogspace_data_date", curr_date);
  }
  if (pg_stored_date != curr_date && sitestoinclude & 2)
  {
    get_DOI_list("http://www.postgenomic.com/api.php?type=paper&ids_only=1", "postgenomic_ID_list");
    GM_setValue("postgenomic_data_date", curr_date);
  }
  if (sitestoinclude & 1)
    var cb_id_list = eval('(' + GM_getValue("chemical_blogspace_ID_list","{doi_id:{}}") + ')'); // check this line
  if (sitestoinclude & 2)
    var pg_id_list = eval('(' + GM_getValue("postgenomic_ID_list","{doi_id:{}}") + ')'); // check this line
   
  var allTextareas, thisTextarea;
  allTextareas = document.getElementsByTagName('*');
  //For every node in the document
  for (var i = 0; i < allTextareas.length; i++) {
    thisTextarea = allTextareas[i];
    if (!thisTextarea.firstChild){continue;}
    //For every child of this node check for the presence of a DOI
    for (var k =0;k< thisTextarea.childNodes.length;k++ )
    {
      var reg = /(10\.[0-9]+\/[a-z0-9\.\-\+\/\(\)]+)/i;
      var ar = reg.exec(thisTextarea.childNodes[k].nodeValue);
      var doi_found=RegExp.$1;
      if (ar && doi_found){
        //GM_log(thisTextarea.childNodes[k].nodeValue+" :"+doi_found);
        //when a DOI is found, check if it is listed in chemical blogspace
        if (sitestoinclude & 1 && cb_id_list.doi_id[doi_found])
            get_citations_cb(doi_found, thisTextarea);
        if (sitestoinclude & 2 && pg_id_list.doi_id[doi_found])
            get_citations_pg(doi_found, thisTextarea);
      }
    }
  }
}
 
function get_DOI_list(myurl, variablename){
  GM_log("GETTING DOI LIST");
  GM_xmlhttpRequest({
    method: 'GET',
    url: myurl,
    headers: {
      'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
      'Accept': 'application/xml,text/html',
    },
    onload: function(responseDetails) {
      var response_status=responseDetails.status;
      var response_text=null;
      if (response_status==200){
        GM_log("Get Doi List: response ok");
        response_text=responseDetails.responseText;
        //GM_setValue("chemical_blogspace_ID_list", response_text);
        GM_setValue(variablename, response_text);
      }
      else GM_log("Response not ok!");
    },
  });
}

function get_citations_cb(doi, textarea) {
  GM_log("Starting get_citations");
  doi_list = eval('(' + GM_getValue("chemical_blogspace_ID_list",0) + ')').doi_id;
  GM_xmlhttpRequest({
    method: 'GET',
    url: "http://cb.openmolecules.net/api.php?type=post&citing_paper="+doi_list[doi]+"&format=json",
    headers: {
      'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
      'Accept': 'application/xml,text/html',
    },
    onload: function(responseDetails) {
      var response_status=responseDetails.status;
      var response_text=null;
      if (response_status==200){
        GM_log("Get Doi List: response ok");
        response_text=responseDetails.responseText;
        GM_log("Response text is " + response_text);
        insert_citations_cb( eval('(' + response_text + ')'), doi, textarea );
      }
      else GM_log("Response not ok!");
    }
  });
  GM_log("Finished get citations");
}

function get_citations_pg(doi, textarea) {
  GM_log("Starting get_citations");
  doi_list = eval('(' + GM_getValue("postgenomic_ID_list",0) + ')').doi_id;
  GM_xmlhttpRequest({
    method: 'GET',
    url: "http://www.postgenomic.com/api.php?type=post&citing_paper="+doi_list[doi]+"&format=json",
    headers: {
      'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
      'Accept': 'application/xml,text/html',
    },
    onload: function(responseDetails) {
      var response_status=responseDetails.status;
      var response_text=null;
      if (response_status==200){
        GM_log("Get Doi List: response ok");
        response_text=responseDetails.responseText;
        //GM_log("Response text is " + response_text);
        insert_citations_pg( eval('(' + response_text + ')'), doi, textarea );
      }
      else GM_log("Response not ok!");
    }
  });
  GM_log("Finished get citations");
}

function insert_citations_cb(obj, doi, textarea) {
  var bubbletext = "";
  for (var i=0; i<obj.length; i++) {
    post = obj[i];
    bubbletext += "<br/><a href='" + post.url + "'><b>" + post.title + "</b></a> <i>" + post.blog_name + "</i> " + post.summary + "... ";
  }
  newanchor = document.createElement("a");
  newanchor.setAttribute("href","http://cb.openmolecules.net/paper.php?doi="+doi);
  newanchor.setAttribute("onmouseover", "return overlib('" + myescape(bubbletext) + "', STICKY, MOUSEOFF, WIDTH, 400, VAUTO, CAPTION, 'Powered by Chemical Blogspace');")
  newanchor.setAttribute("onmouseout", "return nd();")
  img = document.createElement("img");
  img.setAttribute("alt","Comments at Chemical Blogspace");
  img.setAttribute("src","http://www.redbrick.dcu.ie/~noel/Tools/overlib_bubble/logo.gif");
  img.setAttribute("border","0");
  newanchor.appendChild(img);
  //insert the created node before the next sibling of the DOI containing node
  textarea.parentNode.insertBefore(newanchor, textarea.nextSibling);
}

function insert_citations_pg(obj, doi, textarea) {
  var bubbletext = "";
  for (var i=0; i<obj.length; i++) {
    post = obj[i];
    bubbletext += "<br/><a href='" + post.url + "'><b>" + post.title + "</b></a> <i>" + post.blog_name + "</i> " + post.summary + "... ";
  }
  newanchor = document.createElement("a");
  newanchor.setAttribute("href","http://www.postgenomic.com/paper.php?doi="+doi);
  newanchor.setAttribute("onmouseover", "return overlib('" + myescape(bubbletext) + "', STICKY, MOUSEOFF, WIDTH, 400, VAUTO, CAPTION, 'Powered by Postgenomic.com');")
  newanchor.setAttribute("onmouseout", "return nd();")
  img = document.createElement("img");
  img.setAttribute("alt","Comments at Postgenomic.com");
  img.setAttribute("src","http://www.postgenomic.com/templates/clean/logo.jpg");
  img.setAttribute("border","0");
  newanchor.appendChild(img);
  //insert the created node before the next sibling of the DOI containing node
  textarea.parentNode.insertBefore(newanchor, textarea.nextSibling);
}

function hashtableToString(hashtable) { // Useful for debugging purposes
  var result = "";
  for (var i in hashtable) {
    if (hashtable[i] != null)
      result += "{" + i + "},{" + hashtable[i] + "}\n";  
  }
  return result;
}          

function myescape(text) {
  var ans = text.replace(/'/g, "\\'");
  // May have to also replace ( and ) with \( and \)
  // May have to also replace " with &whatever;
  // (see the overLIB FAQ)
  return ans;
}
