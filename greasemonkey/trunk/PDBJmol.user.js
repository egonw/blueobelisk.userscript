// Copyright (c) 2007 Noel O'Boyle <baoilleach@gmail.com>
// Released under the GPL license
// http://www.gnu.org/copyleft/gpl.html
//
// --------------------------------------------------------------------
//
// ==UserScript==
// @name          PDB Jmol
// @namespace     http://www.redbrick.dcu.ie/~noel/PDBJmol
// @description   example script to annotate PDB codes
// @include       http://*
// ==/UserScript==
//
// CHANGELOG
//
// 31-Mar-07: now handles PDB codes in links correctly by adding the
//            Jmol link after the original link
// 23-Mar-07: complete rewrite of the code to iterate over TextNodes
// 22-Mar-07: workaround for Google bug is to exclude Google...the bug fix is
//            probably to loop over document.getElementsByTagName('*')
//            like a normal person, instead of editing the innerHTML directly
// 21-Mar-07: changed regexp from a number followed by 3 letters to a
//            number followed by a letter followed by two of either
// 21-Mar-07: fixed logical error (OR to AND) to prevent the script
//            altering text within an HTML tag
// 21-Mar-07: prevented error message popping up whenever no <body>
//            is present

var p = /\b(\d[a-zA-Z][a-zA-Z0-9]{2})\b/g; // Regexp for 99% of PDB codes
var proteinpage = /(protein|pdb|enzyme)/i;

var StartTag = "<a href='http://firstglance.jmol.org/fg.htm?mol=";
var EndTag = "' target=_blank>Jmol</a>";

function isInLink(node) {
  // Returns 0 if this node is not in the DOM subtree of an <a>
  //           else returns the <a> node
  node = node.parentNode;
  while (node.parentNode && node.nodeName!='A') {
    node = node.parentNode;
  }
  if (node.nodeName=='A')
    return node;
  else
    return 0;
}

function debug() {
  alert(document.getElementsByTagName("a")[0].nodeName);
}

function searchandreplace(textNode) {
  alltext = textNode.nodeValue;
  if (alltext.match(p)) {
    linknode=isInLink(textNode); // False if text not in link
    match = p.exec(alltext);
    mi = match.index;
    protein = alltext.substr(mi, 4);
    starttext = alltext.substring(0, mi+4);
    endtext = alltext.substring(mi+4);

    newnode = document.createElement('sup');
    newnode.style.color = 'blue';
    newnode.style.backgroundColor = 'yellow';
    newnode.innerHTML = StartTag + protein + EndTag;

    starttextnode = document.createTextNode(starttext);
    endtextnode = document.createTextNode(endtext);

    if (!linknode) {
      // If the PDB code is not in a link, then split the current node
      // into two separate text nodes and insert the new Jmol link inbetween
      myparent = textNode.parentNode;
      myparent.replaceChild(newnode, textNode);
      myparent.insertBefore(starttextnode, newnode);
      myparent.insertBefore(endtextnode, newnode.nextSibling);
      
      searchandreplace(endtextnode); // There may be another PDB code here
    }
    else {
      // If the PDB code is in a link, then insert the new Jmol link
      // after the link node
      linkparent = linknode.parentNode;
      linkparent.insertBefore(newnode, linknode.nextSibling);
    } 
  }
}

function run() {
  if (!document.body || typeof(document.body.innerHTML) == "undefined") {
    return false;
  }
  var xPathResult = document.evaluate(
    './/text()[normalize-space(.) != ""]',
    document.body,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
    );
  var this_is_a_protein_page = false;
  for (var i = 0, l = xPathResult.snapshotLength; i < l; i++) {
    var textNode = xPathResult.snapshotItem(i);
    var alltext = textNode.nodeValue;
    if (alltext.match(proteinpage)) {
      this_is_a_protein_page = true;
      break;
      }
  }

  if (this_is_a_protein_page)
    for (var i = 0, l = xPathResult.snapshotLength; i < l; i++) {
      var textNode = xPathResult.snapshotItem(i);
      searchandreplace(textNode);
    }
}

// MAIN
run();

