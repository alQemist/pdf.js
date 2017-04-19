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
    define('pdfjs-web/pdf_cart_viewer', ['exports', 'pdfjs-web/pdfjs'],
      factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports, require('./pdfjs.js'));
  } else {
    factory((root.pdfjsWebPDFCartViewer = {}), root.pdfjsWebPDFJS);
  }
}(this, function (exports, pdfjsLib) {

var PDFJS = pdfjsLib.PDFJS;

/**
 * @typedef {Object} PDFCartViewerOptions
 * @property {HTMLDivElement} container - The viewer element.
 * @property {IPDFLinkService} linkService - The navigation/linking service.
 * @property {EventBus} eventBus - The application event bus.
 */

/**
 * @typedef {Object} PDFCartViewerRenderParameters
 * @property {Array|null} cart - An array of cart objects.
 */

/**
 * @class
 */
var PDFCartViewer = (function PDFCartViewerClosure() {
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  /**
   * @constructs PDFCartViewer
   * @param {PDFCartViewerOptions} options
   */
  function PDFCartViewer(options) {
    this.cart = null;
    this.products_SKUs = [];
    this.products = {};
    this.options = options;
    this.container = options.container;
    this.eventBus = options.eventBus;
  }

  PDFCartViewer.prototype = {
    reset: function PDFCartViewer_reset() {
      this.cart = null;
      // Remove the outline from the DOM.
      this.container.textContent = '';
      this.products_SKUs = [];
      this.products = {};
    },

    /**
     * @private
     */
    _showCheckout: function PDFCartViewer_showCheckout() {
      var me = this;
      var sidebar = PDFViewerApplication.pdfSidebar;
      var options = me.options;
      if ($.isEmptyObject(me.products)) {
        sidebar._update_cart_notification(false);
        //options.cartCheckout.classList.add('hidden');
      } else {
        sidebar._update_cart_notification(true);
        //options.cartCheckout.classList.remove('hidden');
      }
    },

    _updateTotal: function PDFCartViewer_updateTotal() {
      var me = this;
      var options = me.options;
      var products = me.products;
      var total = 0;
      var price, count;

      $.each(products, function(key, product) {
        count = parseInt(product.count, 10);
        price = parseFloat(product.price);
        total += price * count;
      });
      options.cartTotal.textContent = total.toFixed(2);
    },

    _createProductItem: function PDFCartViewer_createProductItem(sku_key, idx) {
      var me = this;
      var product = me.products[sku_key];
      var prod_container = document.createElement('div');
      var container = document.createElement('div');
      var sku = document.createElement('div');
      var img = document.createElement('img');
      var count = document.createElement('input');
      var price = document.createElement('div');
      var removeContainer = document.createElement('div');
      var removeBtn = document.createElement('span');

      prod_container.classList.add('product_item');
      container.classList.add('item_extra');

      //Remove section
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', function(evt) {
        me.products_SKUs.splice(idx, 1);
        delete me.products[sku_key];
        me.addProduct();
        me._updateTotal();
      });
      removeBtn.classList.add('remove');
      removeContainer.classList.add('remove_cnt');
      removeContainer.appendChild(removeBtn);

      //SKU section
      sku.textContent = product.sku;
      sku.classList.add('title');

      //Price section
      price.textContent = "$ " + product.price;
      price.classList.add('price');

      //Count section
      count.value = product.count;
      count.type = 'number';
      count.classList.add('count');
      count.setAttribute('min', 0);
      count.addEventListener('input', function(evt) {
        var input = evt.target.value;
        if (!input) {
          product.count = 0;
          evt.target.value = 0;
        } else {
          product.count = evt.target.value;
        }
        me._updateTotal();
      });

      //Image section
      img.src = product.image;
      img.classList.add('image');

      container.appendChild(count);
      container.appendChild(price);
      container.appendChild(removeContainer);

      prod_container.appendChild(sku);
      prod_container.appendChild(img);
      prod_container.appendChild(container);
      prod_container.appendChild(document.createElement('hr'));
      return prod_container;
    },

    addProduct: function PDFCartViewer_addProduct(new_product) {
      var me = this;
      var sku_code, i;
      var cartProducts = me.options.cartProducts;

      cartProducts.textContent = '';
      if (new_product) {
        sku_code = new_product.sku;
        if(me.products[sku_code]) {
          me.products[sku_code].count = me.products[sku_code].count + 1;
        } else {
          me.products[sku_code] = new_product;
          me.products[sku_code].count = 0;
          me.products_SKUs.push(sku_code);
        }
      }

      me._showCheckout();
      var products_list = document.createDocumentFragment();
      for(i = me.products_SKUs.length - 1; i >= 0; i--) {
        var sku_key = me.products_SKUs[i];
        var new_prod = me._createProductItem(sku_key, i);
        products_list.appendChild(new_prod);
      }
      cartProducts.appendChild(products_list);
      me._updateTotal();
    }
  };

  return PDFCartViewer;
})();

exports.PDFCartViewer = PDFCartViewer;
}));
