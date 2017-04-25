'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('pdfjs-web/publisher_popup', ['exports',
      'pdfjs-web/ui_utils', 'pdfjs-web/overlay_manager'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports, require('./ui_utils.js'), require('./overlay_manager.js'));
  } else {
    factory((root.pdfjsWebPDFPublisherPopup = {}), root.pdfjsWebUIUtils,
      root.pdfjsWebOverlayManager);
  }
}(this, function (exports, uiUtils, overlayManager) {

  var getPDFFileNameFromURL = uiUtils.getPDFFileNameFromURL;
  var mozL10n = uiUtils.mozL10n;
  var OverlayManager = overlayManager.OverlayManager;

  /**
   * @typedef {Object} PDFPublisherPopupOptions
   * @property {string} overlayName - Name/identifier for the overlay.
   * @property {Object} fields - Names and elements of the overlay's fields.
   * @property {HTMLButtonElement} closeButton - Button for closing the overlay.
   */

  /**
   * @class
   */
  var PDFPublisherPopup = (function PDFPublisherPopupClosure() {
    /**
     * @constructs PDFPublisherPopup
     * @param {PDFPublisherPopupOptions} options
     */
    function PDFPublisherPopup(options) {
      this.fields = options.fields;
      this.overlayName = options.overlayName;
      this.container = options.container;
      this.isOpen = false;

      this.url = null;
      this.pdfDocument = null;

      // Bind the event listener for the Close button.
      if (options.closeButton) {
        options.closeButton.addEventListener('click', this.close.bind(this));
      }

      this.dataAvailablePromise = new Promise(function (resolve) {
        this.resolveDataAvailable = resolve;
      }.bind(this));

      OverlayManager.register(this.overlayName, this.container,
        this.close.bind(this));
    }

    PDFPublisherPopup.prototype = {
      /**
       * Open the document properties overlay.
       */
      open: function PDFPublisherPopup_open() {
        Promise.all([OverlayManager.open(this.overlayName),
          this.dataAvailablePromise]).then(function () {
          this._getProperties();
          this.isOpen = true;
        }.bind(this));
      },

      /**
       * Close the document properties overlay.
       */
      close: function PDFPublisherPopup_close() {
        OverlayManager.close(this.overlayName);
        this.isOpen = false;
      },

      /**
       * Private
       */
      _isPopupOpen: function PDFProductPopup_isOpen() {
        var me = this;
        return me.isOpen;
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
      setDocumentAndUrl: function PDFPublisherPopup_setDocumentAndUrl(pdfDocument, url) {
        this.pdfDocument = pdfDocument;
        this.url = url;
        this.resolveDataAvailable();
      },

      /**
       * @private
       */
      _getProperties: function PDFPublisherPopup_getProperties() {
        if (!OverlayManager.active) {
          // If the dialog was closed before dataAvailablePromise was resolved,
          // don't bother updating the properties.
          return;
        }

        var appConfig = PDFViewerApplication.appConfig;
        var matadataConfig = appConfig.matadataConfig;


        // Get the document properties.
        this.pdfDocument.getMetadata().then(function (data) {
          var content = {
            'company': matadataConfig['company'],
            'address1': matadataConfig['address1'],
            'address2': matadataConfig['address2'],
            'city': matadataConfig['city'],
            'state': matadataConfig['state'],
            'zip': matadataConfig['zip'],
            'country': matadataConfig['country'],
            'company_email': matadataConfig['company_email'],
            'phone': matadataConfig['phone'],
            'weburl': matadataConfig['weburl'],
          };

          // Show the properties in the dialog.
          for (var identifier in content) {
              this._updateUI(this.fields[identifier], content[identifier]);
          }
        }.bind(this));
      },

      /**
       * @private
       */
      _updateUI: function PDFPublisherPopup_updateUI(field, content) {
        console.log(field)
        if (field && content !== undefined && content !== '') {
          if(field.id=="publisherEmailField"){
            var mail_to = document.createElement('a');
            mail_to.setAttribute("href" , "mailTo:"+content);
            mail_to.setAttribute("target" ,"#");
            mail_to.textContent= content;
            field.textContent="";
            field.appendChild(mail_to);
          }else if(field.id=="publisherWebField"){
              var go_to = document.createElement('a');
              go_to.setAttribute("href" , content);
              go_to.setAttribute("target" ,"_blank");
              go_to.textContent= content;
              field.textContent="";
              field.appendChild(go_to);
            }else{
            field.textContent = content;
          }

        }
      }
    };

    return PDFPublisherPopup;
  })();

  exports.PDFPublisherPopup = PDFPublisherPopup;
}));
