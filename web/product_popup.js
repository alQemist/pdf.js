/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('pdfjs-web/product_popup', ['exports',
      'pdfjs-web/ui_utils', 'pdfjs-web/overlay_manager'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports, require('./ui_utils.js'), require('./overlay_manager.js'));
  } else {
    factory((root.pdfjsWebProductPopup = {}), root.pdfjsWebUIUtils,
      root.pdfjsWebOverlayManager);
  }
}(this, function (exports, uiUtils, overlayManager) {

var mozL10n = uiUtils.mozL10n;
var OverlayManager = overlayManager.OverlayManager;

/**
 * @typedef {Object} PDFProductPopup
 * @property {string} overlayName - Name/identifier for the overlay.
 * @property {Object} fields - Names and elements of the overlay's fields.
 * @property {HTMLButtonElement} closeButton - Button for closing the overlay.
 */

/**
 * @class
 */
var PDFProductPopup = (function PDFProductPopupClosure() {
  /**
   * @constructs PDFProductPopup
   * @param {PDFProductPopupOptions} options
   */
  function PDFProductPopup(options) {
    this.options = options;
    this.fields = options.fields;
    this.overlayName = options.overlayName;
    this.container = options.container;

    // Bind the event listener for the Close button.
    if (options.closeButton) {
      options.closeButton.addEventListener('click', this.close.bind(this));
      options.popupErrorClose.addEventListener('click', this.close.bind(this));
    }

    this.dataAvailablePromise = new Promise(function (resolve) {
      this.resolveDataAvailable = resolve;
    }.bind(this));

    OverlayManager.register(this.overlayName, this.container, this.close.bind(this));
  }

  PDFProductPopup.prototype = {
    /**
     * Open the document properties overlay.
     */
    open: function PDFProductPopup_open(sku, product_query_url) {
      if (OverlayManager.active) {
        this.close();
      }
      Promise.all([OverlayManager.open(this.overlayName),
        this.dataAvailablePromise]).then(function () {
        this._fetchProduct(sku, product_query_url);
      }.bind(this));
    },

    /**
     * Close the document properties overlay.
     */
    close: function PDFProductPopup_close() {
      var options = this.options;
      OverlayManager.close(this.overlayName);
      options.spinner.classList.remove('hidden');
      options.productPopup.classList.add('hidden');
      options.errorBody.classList.add('hidden');
    },

    /**
     * Set a reference to the PDF document and the URL in order
     * to populate the overlay fields with the document properties.
     * Note that the overlay will contain no information if this method
     * is not called.
     *
     * @param {Object} pdfDocument - A reference to the PDF document.
     * @param {string} url - The URL of the document.
     */
    setDocumentAndUrl:
      function PDFProductPopup_setDocumentAndUrl(pdfDocument, url) {
        this.pdfDocument = pdfDocument;
        this.url = url;
        this.resolveDataAvailable();
      },

    /**
     * Make a request to get extra information about a product in order
     * to show a popup with information.
     * @param sku {String} - A number referring to the product ID unique code
     * @param product_query_url {String} - The url from where the information should be fetch
     */
    _fetchProduct: function PDFProductPopup_fetchProduct(sku, product_query_url) {
      var me = this;
      var productURL = product_query_url + "?SKU=" + sku;
      var xmlhttp = new XMLHttpRequest();
      // var productURL = "http://www.forestry-suppliers.com/icat/productLookup.asp?SKU=" + sku;

      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
          if (xmlhttp.status == 200) {
            me._parseProduct(xmlhttp.responseText);
          } else {
            me._showPopupBody(false);
          }
        }
      };

      xmlhttp.open("GET", productURL, true);
      xmlhttp.setRequestHeader('Content-Type', 'text/xml');
      xmlhttp.send();
    },

    // Production ready fetch
    /*_fetchProduct: function PDFProductPopup_fetchProduct(sku, product_query_url) {
      var me = this;
      var re = new RegExp(/\[SKU\]/g);
      var U = product_query_url;
      var host = (config.domain).split('.');
      host = host[1] + '.' + host[2];

      // in the case of being hosted on a subdomain  the url will be modified to match the domain...
      if (U.indexOf('[host]') > -1) {
        U = U.replace("[host]", host)
      }
      // replace the placeholder in the string with the actual SKU value
      U = U.replace(re, txt);

      // request is made through a proxy to avoid issues with cross-domain request...
      var productURL = "/proxyRequest.php?url=" + encodeURIComponent(U);

      $.ajax({
        type: 'GET',
        url: productURL,
        cache: false,
        crossDomain: false,
        dataType: 'xml',
        success: me._parseProduct,
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          me._showPopupBody(false);
        }
      });
    },*/

    _parseProduct: function PDFProductPopup_parseProduct(xml) {
      var me = this;
      var parsedXML = $.parseXML(xml);
      var product = {};
      var validProduct = false;
      var record = $(parsedXML).find('record');

      if(record.length < 1) {
        me._showPopupBody(validProduct);
      } else {
        validProduct = true;
        record.each(function() {
          product.sku = $(this).find('sku').text();
          product.name = $(this).find('name').text();
          product.description = $(this).find('description').first().text();
          product.weight = $(this).find('weight').text();
          product.price = ($(this).find('price').text()-0).toFixed(2);
          product.available = $(this).find('available').text();
          product.image = $(this).find('image').text()
        });
      }

      if (validProduct) {
        for (var identifier in product) {
          me._updateUI(me.fields[identifier], product[identifier]);
        }
        me._updateUI(me.fields["image"], product["image"], true);
      }
      me._showPopupBody(validProduct);
    },

    /**
     * @private
     * Use to show the product popup or an error message
     */
    _showPopupBody: function PDFProductPopup_showPopupBody(show) {
      var me = this;
      var options = me.options;
      var actions = ['add', 'remove'];

      options.spinner.classList.add('hidden');
      options.productPopup.classList[actions[show + 0]]('hidden');
      options.errorBody.classList[actions[!show + 0]]('hidden');
    },

    /**
     * @private
     * Update the popup fields.
     * The only special case is when the field is an image
     */
    _updateUI: function PDFProductPopup_updateUI(field, content, isImage) {
      if (field && content !== undefined && content !== '') {
        field[isImage ? "src" : "textContent"] = content;
      }
    }
  };

  return PDFProductPopup;
})();

exports.PDFProductPopup = PDFProductPopup;
}));
