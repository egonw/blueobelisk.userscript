
// Copyright (c) 2006-2007 Egon Willighagen <egonw@users.sf.net>
//                    2007 Joerg Kurt Wegner <wegner@users.sf.net>
// Version: 20071022.4
// Released under the GPL license
// http://www.gnu.org/copyleft/gpl.html
//
// --------------------------------------------------------------------
//
// This is a Greasemonkey user script.
//
// -- HOWTO INSTALL --
//
// To install, you need Greasemonkey: http://greasemonkey.mozdev.org/
// Then restart Firefox and revisit this script.
// Under Tools, there will be a new menu item to "Install User Script".
// Accept the default configuration and install.
//
// To uninstall, go to Tools/Manage User Scripts,
// select this script, and click Uninstall.
//
// -- SUPPORTED --
//
// This script supports the microformats and RDFa as described in
// http://chem-bla-ics.blogspot.com/2006/12/including-smiles-cml-and-inchi-in.html
//
// -- TODO --
//
// - implement proper namespace support for RDFa, and not have 'chem' the hardcoded prefix
//
// --------------------------------------------------------------------
//
// ChangeLog
//
// 2007-10-22  EW  Added update support
//                 Added ChemSpider support
// 2007-01-14  JKW Added support for eMolecule queries
// 2007-01-14  EW  Per Joerg Wegner's comment, searching SMILES on PubChem now 
//                   via SMARTS
// 2006-12-19  EW  Added support for chem:compound, and added ChageLog,
//                   removed redundant " in SMILES PC query, added version
//                   number, changed description
// 2006-12-17  EW  Initial script, with support for InChI, CAS and SMILES
//
// --------------------------------------------------------------------
//
// ==UserScript==
// @name          Sechemtic Web
// @namespace     tag:egonw@users.sf.net,2006-12-17:SechemticWeb-1
// @description   Enriches chemistry enabled HTML.
// @include       *
// ==/UserScript==

var useGoogle = 1;
var usePubChem = 1;
var useEMolecules = 1;
var useChemSpider = 1;

// Update check
var d = new Date();
var curr_date = d.getDate();
var date_last_checked= GM_getValue("check_updates", 0);
if (date_last_checked != curr_date)
{
  GM_setValue("check_updates", curr_date);
  // Modified the code by Seifer at http://userscripts.org/users/33118
  script_name = 'SechemticWeb.user.js';
  script_href = "http://blueobelisk.svn.sf.net/svnroot/blueobelisk/userscripts/trunk/SechemticWeb.user.js";
  script_as_text = "http://blueobelisk.svn.sourceforge.net/viewvc/*checkout*/blueobelisk/userscripts/trunk/SechemticWeb.user.js?content-type=text%2Fplain";
  script_version=20071022.4;
  script_updatetext='Added an ChemSpider support for InChIs.';

  GM_xmlhttpRequest({
      method: "GET",
      url: script_as_text,
      onload: function(responseDetails) {
        var text = responseDetails.responseText;
        var update_version = text.substring(text.indexOf("script_version=")+15,text.indexOf("\n",text.indexOf("script_version="))-1);
        var update_text = text.substring(text.indexOf("script_updatetext=")+19,text.indexOf("\n",text.indexOf("script_updatetext="))-3);
        if(update_version > script_version) {
          newversion = document.createElement("div");
          newversion.setAttribute("id", "gm_update_alert");
          newversion.setAttribute("style", "background-color:yellow; width:100%; position:absolute; z-index:99; top:5px; left:0px; text-align:center; font-size:12px; font-family: Tahoma");
          newversion.innerHTML = "<a href='#' onclick='document.body.removeChild(document.getElementById(&quot;gm_update_alert&quot;))' style='color:red'>Close</a><font color='yellow'>--------</font><font color='red'>There is a new version of the &quot;"+script_name+"&quot; script. You are currently running version "+script_version+".</font><br><font color='yellow'>----------------</font>The latest version is "+update_version+". <a href='#' onclick='document.getElementById(&quot;gm_update_alert_info&quot;).setAttribute(&quot;style&quot;, &quot;display:block&quot;)'style='color:green'>Click here for more info</a> or <a style='color:green' href='" + script_href + "'><b>Click here to download the latest version</b></a><span id='gm_update_alert_info' style='display:none'><b>Here's a short description of the latest update...</b><br>"+update_text+"</span>";
          document.body.appendChild(newversion);
        }
      }
  });
}


// ==============================================================================================================================

var allLinks, thisLink;

// InChI support
allLinks = document.evaluate(
    '//span[@class="chem:inchi" or @class="inchi"]',
    document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
);
for (var i = 0; i < allLinks.snapshotLength; i++) {
    thisLink = allLinks.snapshotItem(i);
    inchi = thisLink.innerHTML;
    // alert("Found InChI:" + inchi);

    if (usePubChem == 1) {
        // create a link to PubChem
        newElement = document.createElement('a');
        newElement.href = "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=%22" + 
            inchi + " %22[InChI]";
        newElement.innerHTML = "<sup>PubChem</sup>";
        thisLink.parentNode.insertBefore(newElement, thisLink.nextSibling);
    }
    if (usePubChem == 1 && (useGoogle == 1 || useChemSpider == 1)) {
        spacer = document.createElement('sup');
        spacer.innerHTML = ", ";
        thisLink.parentNode.insertBefore(spacer, thisLink.nextSibling);
    }
    if (useGoogle == 1) {
        // create a link to PubChem
        newElement = document.createElement('a');
        newElement.href = "http://www.google.com/search?q=" + inchi.substring(6);
        newElement.innerHTML = "<sup>Google</sup>";
        thisLink.parentNode.insertBefore(newElement, thisLink.nextSibling);
    }
    if ((usePubChem == 1 || useGoogle == 1) && useChemSpider == 1) {
        spacer = document.createElement('sup');
        spacer.innerHTML = ", ";
        thisLink.parentNode.insertBefore(spacer, thisLink.nextSibling);
    }
    if (useChemSpider == 1) {
        // create a link to ChemSpider
        newElement = document.createElement('a');
        newElement.href = "http://www.chemspider.com/" + inchi;
        newElement.innerHTML = "<sup>ChemSpider</sup>";
        thisLink.parentNode.insertBefore(newElement, thisLink.nextSibling);
    }
}

// SMILES support
allLinks = document.evaluate(
    '//span[@class="chem:smiles" or @class="smiles"]',
    document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
);
for (var i = 0; i < allLinks.snapshotLength; i++) {
    thisLink = allLinks.snapshotItem(i);
    smiles = thisLink.innerHTML;
    // alert("Found SMILES:" + smiles);

    if (usePubChem == 1) {
        // create a link to PubChem
        newElement = document.createElement('a');
        newElement.href = "http://pubchem.ncbi.nlm.nih.gov/search/?smarts=" + smiles;
        newElement.innerHTML = "<sup>PubChem</sup>";
        thisLink.parentNode.insertBefore(newElement, thisLink.nextSibling);
    }
    if (usePubChem == 1 && (useGoogle == 1 || useEMolecules == 1)) {
        spacer = document.createElement('sup');
        spacer.innerHTML = ", ";
        thisLink.parentNode.insertBefore(spacer, thisLink.nextSibling);
    }
    if (useGoogle == 1) {
        // create a link to PubChem
        newElement = document.createElement('a');
        newElement.href = "http://www.google.com/search?q=" + smiles;
        newElement.innerHTML = "<sup>Google</sup>";
        thisLink.parentNode.insertBefore(newElement, thisLink.nextSibling);
    }
    if (useEMolecules == 1 && useGoogle == 1) {
        spacer = document.createElement('sup');
        spacer.innerHTML = ", ";
        thisLink.parentNode.insertBefore(spacer, thisLink.nextSibling);
    }
    if (useEMolecules == 1) {
        // create a link to eMolecules
        newElement = document.createElement('a');
        newElement.href = "http://www.emolecules.com/cgi-bin/search?t=ss&q=" + smiles;
        newElement.innerHTML = "<sup>eMolecules</sup>";
        thisLink.parentNode.insertBefore(newElement, thisLink.nextSibling);
    }
}

// CAS regisitry number support
allLinks = document.evaluate(
    '//span[@class="chem:casnumber" or @class="casnumber"]',
    document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
);
for (var i = 0; i < allLinks.snapshotLength; i++) {
    thisLink = allLinks.snapshotItem(i);
    casnumber = thisLink.innerHTML;
    // alert("Found CAS registry number:" + casnumber);

    if (useGoogle == 1) {
        // create a link to PubChem
        newElement = document.createElement('a');
        newElement.href = "http://www.google.com/search?q=" + casnumber + "+CAS";
        newElement.innerHTML = "<sup>Google</sup>";
        thisLink.parentNode.insertBefore(newElement, thisLink.nextSibling);
    }
}

// 'compound' support
allLinks = document.evaluate(
    '//span[@class="chem:compound"]',
    document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
);
for (var i = 0; i < allLinks.snapshotLength; i++) {
    thisLink = allLinks.snapshotItem(i);
    smiles = thisLink.innerHTML;
    // alert("Found SMILES:" + smiles);

    if (usePubChem == 1) {
        // create a link to PubChem
        newElement = document.createElement('a');
        newElement.href = "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=" + 
            smiles;
        newElement.innerHTML = "<sup>PubChem</sup>";
        thisLink.parentNode.insertBefore(newElement, thisLink.nextSibling);
    }
}


