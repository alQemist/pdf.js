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
      var me = this;
      this.cart = null;
      this.products_SKUs = [];
      this.products = {};
      this.options = options;
      this.container = options.container;
      this.eventBus = options.eventBus;



      if (options.cartCheckoutBtn) {
        options.cartCheckoutBtn.addEventListener('click', function () {
          var total = 0;
          var price, count;

          $.each(me.products, function (key, product) {
            count = parseInt(product.count, 10);
            price = parseFloat(product.price);
            total += price * count;

          });

          //me.eventBus.dispatch('checkoutcart');
          me._checkout(me.products);
        });
      }

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
        var price, count,description;

        $.each(products, function (key, product) {
          count = parseInt(product.count, 10);
          price = parseFloat(product.price);
          description = parseFloat(product.description);
          total += price * count;
        });
        options.cartTotal.textContent = "$ "+total.toFixed(2);
      },

      _createProductItem: function PDFCartViewer_createProductItem(sku_key, idx) {
        var me = this;
        var product = me.products[sku_key];
        var prod_container = document.createElement('div');
        var container = document.createElement('div');
        var sku = document.createElement('div');
        var details = document.createElement('p');
        var img = document.createElement('img');
        var count = document.createElement('input');
        var price = document.createElement('div');
        var removeBtn = document.createElement('div');

        prod_container.classList.add('product_item');
        container.classList.add('item_extra');

        //Remove section
        removeBtn.textContent = '';
        removeBtn.addEventListener('click', function (evt) {
          me.products_SKUs.splice(idx, 1);
          delete me.products[sku_key];
          me.addProduct();
          me._updateTotal();
        });
        removeBtn.classList.add('remove');

        //SKU section
        sku.textContent = product.sku;
        sku.title = product.sku;
        sku.classList.add('title');

        //Price section
        price.textContent = "$ " + product.price;
        price.classList.add('price');

        //Count section
        count.value = product.count;
        count.type = 'number';
        count.classList.add('count');
        count.setAttribute('min', 1);
        count.addEventListener('input', function (evt) {
          var input = evt.target.value;
          if (!input) {
            product.count = 1;
            evt.target.value = 1;
          } else {
            product.count = evt.target.value;
          }
          me._updateTotal();
        });

        //Image section
        img.src = product.image;
        img.classList.add('image');

        details.textContent = product.description.substring(0,200)+" ...";
        details.classList.add('product_details');

        container.appendChild(count);
        container.appendChild(price);
        container.appendChild(removeBtn);

        prod_container.appendChild(sku);
        prod_container.appendChild(img);
        prod_container.appendChild(details);
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
          if (me.products[sku_code]) {
            me.products[sku_code].count = me.products[sku_code].count + 1;
          } else {
            me.products[sku_code] = new_product;
            me.products[sku_code].count = 1;
            me.products_SKUs.push(sku_code);
          }
        }

        me._showCheckout();
        var products_list = document.createDocumentFragment();
        for (i = me.products_SKUs.length - 1; i >= 0; i--) {
          var sku_key = me.products_SKUs[i];
          var new_prod = me._createProductItem(sku_key, i);
          products_list.appendChild(new_prod);
        }
        cartProducts.appendChild(products_list);
        me._updateTotal();
      },

      _checkout: function PDFCartView_checkout(products){
        var me = this;
        var appConfig = PDFViewerApplication.appConfig;
        var matadataConfig = appConfig.matadataConfig;
        var client_id = matadataConfig['accountid'];
        var session_id = Date.now();

      	var cartXML = '<\?xml version="1.0" encoding="UTF-8" \?>\r';
      	cartXML += "<root>"
        cartXML += "<clientID>"+ client_id +"</clientID>";
        cartXML += "<sessionID>"+ session_id + "</sessionID>";
        cartXML += "<html5>1</html5>";
      	cartXML += "<lineitems>"
        $.each(products, function (key, product) {
      		cartXML += "<item>";
      		cartXML += "<qty>" + product.count + "</qty>";
      		cartXML += "<sku>" + product.sku + "</sku>";
      		cartXML += "<price>" + product.price + "</price>";
      		//cartXML += "<unit>" + product.unit+ "</unit>";
      		cartXML += "</item>";
      	})
      	cartXML += "</lineitems>";
      	cartXML += "</root>";

      	//console.log(cartXML)

      	me._submitCart(cartXML)
      },

       _submitCart: function PDFCartView_submitCart(xml) {
          var appConfig = PDFViewerApplication.appConfig;
          var matadataConfig = appConfig.matadataConfig;

          var me = this;
        	var cart_url = matadataConfig['checkout_url'];
          var client_id = matadataConfig['accountid'];
          var proxy_url = "http://www.magazooms.com/shopping/pdforder.php";
          var cart_data = {
            cartcontents:xml,
            cart_url:cart_url,
            client_id:client_id
          };

          //console.log(cart_data);

        	$.ajax({
        		type: "POST",
        		async: true,
        		data: cart_data,
        		cache: false,
        		url: proxy_url,
        		success: function(url){
              //console.log(url)
              var w = window.open(url, "_blank")
          		setTimeout(function(){
          			if(!w || w.closed || typeof w.closed=='undefined' || w.innerHeight < 10)
          			{
          				//notifyPopupBlocker()
          			}
          		},2000)
            },
        		error: function(XMLHttpRequest, textStatus, errorThrown) {
        			console.log("responseText:" + XMLHttpRequest.responseText)
        			console.log("textStatus:" + textStatus);
        			console.log("errorThrown:" + errorThrown)
        		}
          })}

    };

    return PDFCartViewer;
  })();

  exports.PDFCartViewer = PDFCartViewer;
}));
