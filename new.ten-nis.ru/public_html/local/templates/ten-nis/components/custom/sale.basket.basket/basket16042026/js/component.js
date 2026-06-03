; (function () {
	'use strict';

	BX.namespace('BX.Sale.BasketComponent');

	BX.Sale.BasketComponent = {
		maxItemsShowCount: 30,
		precisionFactor: Math.pow(10, 6),
		stickyHeaderOffset: 0,

		duration: {
			priceAnimation: 300,
			filterTimer: 300
		},

		ids: {
			item: 'basket-item-',
			quantity: 'basket-item-quantity-',
			price: 'basket-item-price-',
			sumPrice: 'basket-item-sum-price-',
			sumPriceOld: 'basket-item-sum-price-old-',
			sumPriceDiff: 'basket-item-sum-price-difference-',
			itemHeightAligner: 'basket-item-height-aligner-',
			total: 'basket-total-price',
			basketRoot: 'basket-root',
			actionSelector: 'action-selector',
			itemListWrapper: 'basket-items-list-wrapper',
			itemListContainer: 'basket-items-list-container',
			itemList: 'basket-item-list',
			itemListTable: 'basket-item-table',
			itemListEmptyResult: 'basket-item-list-empty-result',
			itemListOverlay: 'basket-items-list-overlay',
			warning: 'basket-warning'
		},

		initializePrimaryFields: function () {
			this.templates = {};
			this.nodes = {};
			this.shares = {};
			// this.isMobileDevice = false;

			/** Object of all basket items (itemId => itemArray) */
			this.items = {};

			/** Array of all basket items to show sorted by field SORT */
			this.sortedItems = [];

			/** Array of basket items showed on screen */
			this.shownItems = [];

			/** Array of basket items changed since last request */
			this.changedItems = [];

			/** Array of basket items postponed by pool to edit */
			this.postponedItems = [];

			/** Array of basket items with warnings */
			this.warningItems = [];

			this.isMobile = BX.browser.IsMobile();
			this.isTouch = BX.hasClass(document.documentElement, 'bx-touch');

			this.lastAction = 'initialLoad';
			this.coupons = null;

			this.imagePopup = null;
			this.loadingScreen = null;

			this.quantityDelay = null;
			this.quantityTimer = null;

			this.deleteDelay = null;
			this.deleteTimer = {};

			this.IS_NOT_CAN_BUY = false;
		},

		init: function (parameters) {
			this.initializePrimaryFields();

			this.params = parameters.params || {};
			this.template = parameters.template || '';
			this.signedParamsString = parameters.signedParamsString || '';
			this.siteId = parameters.siteId || '';
			this.siteTemplateId = parameters.siteTemplateId || '';
			this.ajaxUrl = this.params.AJAX_PATH || '';
			this.basketUrl = this.params.BASKET_URL || false;
			this.idNode = this.params.ID_NODE_CONTENT || false;

			this.templateFolder = parameters.templateFolder || '';

			this.useDynamicScroll = this.params.USE_DYNAMIC_SCROLL === 'Y';
			this.useItemsFilter = this.params.SHOW_FILTER === 'Y' && !this.isMobile;

			this.initializeFilter();
			this.applyBasketResult(parameters.result);
			this.initializeActionPool();

			if (this.useItemsFilter) {
				this.checkHeaderDisplay();
				this.bindHeaderEvents();
			}

			this.initializeBasketItems();
			this.editTotal();
			this.editWarnings();

			this.getCacheNode(this.ids.basketRoot).style.opacity = 1;

			this.bindInitialEvents();
		},

		getTemplate: function (templateName) {
			if (!this.templates.hasOwnProperty(templateName)) {
				var template = BX(templateName);
				this.templates[templateName] = BX.type.isDomNode(template) ? template.innerHTML : '';
			}

			return this.templates[templateName];
		},

		getCacheNode: function (id) {
			if (!this.nodes.hasOwnProperty(id)) {
				this.nodes[id] = BX(id);
			}

			return this.nodes[id];
		},

		getEntity: function (parent, entity, additionalFilter) {
			if (!parent || !entity)
				return null;

			additionalFilter = additionalFilter || '';

			return parent.querySelector(additionalFilter + '[data-entity="' + entity + '"]');
		},

		getEntities: function (parent, entity, additionalFilter,pseudo='') {
			if (!parent || !entity)
				return { length: 0 };

			additionalFilter = additionalFilter || '';

			return parent.querySelectorAll(additionalFilter + '[data-entity="' + entity + '"]' + pseudo);
		},

		bindInitialEvents: function () {
			this.bindWarningEvents();
			this.bindActionSelector();
			this.bindActionShare();
			// this.isMobileDevice = this.isMobileCheck();

			BX.bind(window, 'scroll', BX.proxy(this.checkStickyHeaders, this));
			BX.bind(window, 'scroll', BX.proxy(this.lazyLoad, this));

			BX.bind(window, 'resize', BX.throttle(this.checkStickyHeaders, 20, this));
		},

		bindActionSelector: function () {
			var entities = this.getEntities(BX(this.ids.actionSelector), 'change-selector-radio');
			for (var i = 0; i < entities.length; i++) {
				BX.bind(entities[i], 'click', BX.proxy(this.clickActionSelector, this));
			}
		},
		// bindActionShare: function () {
		// 	var entities = this.getEntities(BX(this.ids.basketRoot), 'data-share');
		// 	for (var i = 0; i < entities.length; i++) {
		// 		BX.bind(entities[i], 'click', BX.proxy(this.clickActionShare, this));
		// 	}
		// },
		bindActionShare: function () {
			var root = BX(this.ids.basketRoot);
			if (!root || root.dataset.shareBound === '1') return;
			root.dataset.shareBound = '1';
			BX.bind(root, 'click', BX.proxy(function (e) {
				var target = BX.getEventTarget(e);
				var shareBtn = target && target.closest
					? target.closest('[data-entity="data-share"]')
					: null;
				if (!shareBtn) return;
				this.clickActionShare(e);
			}, this));
		},
		getCookie: function(name)
		{
			var matches = document.cookie.match(new RegExp(
				"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
			));

			return matches ? decodeURIComponent(matches[1]) : null;
		},
		buildRepostUrl: function (data) {
			const params = Object.entries(data).map(([key, value]) => {
				return `products[${encodeURIComponent(key)}]=${encodeURIComponent(value)}`;
			});
			return `${window.location.pathname}repost/${params.length ? '?' + params.join('&') : ''}`;
		},
		// isMobileCheck: function () {
		// 	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		// },
		clickActionShare: function (event) {
			var text = "", target = BX.getEventTarget(event).closest('a'),
			entities = this.getEntities(BX(this.ids.itemListTable), 'basket-item-checkbox'),
			action = target.dataset?.share||"", shares = {}, repostUrl = '';
			for (var i = 0; i < entities.length; i++) {
				let row = entities[i].closest('[data-id-real]'),  idReal = row?.dataset?.idReal,  productId = row?.dataset?.product_id;
				shares[idReal] = (idReal != productId ? productId : "");				
			}
			if(Object.keys(shares).length <= 0)
				return;
			repostUrl = this.buildRepostUrl(shares);
			if(!repostUrl)
				return;
			if(action == "url") {
				// if pc = to clipboard, else default share apps
			} else if(action == "max") {
				const telegramShareUrl = this.buildMaxShareUrl(repostUrl, text);	
				window.open(telegramShareUrl, '_blank');
			} else if(action == "tg") {	
				const telegramShareUrl = this.buildTelegramShareUrl(repostUrl, text);	
				window.open(telegramShareUrl, '_blank');
			}
			console.log([
				target,
				action,
				entities
			]);
		},
		buildTelegramShareUrl: function (url, text) {
            const encodedUrl = encodeURIComponent(window.location.origin + url);
            const encodedText = text ? encodeURIComponent(text) : '';
            let shareUrl = `tg://msg_url?url=${encodedUrl}`;
			// if (!this.isMobileDevice)
			// 	shareUrl = `https://t.me/share/url?url=${encodedUrl}`;
			if (!this.isMobile)
				shareUrl = `https://t.me/share/url?url=${encodedUrl}`;
            if (encodedText) 
                shareUrl += `&text=${encodedText}`;            
            return shareUrl;
        },
		buildMaxShareUrl: function (url, text) {
            const encodedUrl = encodeURIComponent(window.location.origin + url);
            const encodedText = text ? encodeURIComponent(text) : '';
            let shareUrl = `https://max.ru/:share?text=${encodedUrl}`;
			// if (!this.isMobileDevice)
			// 	shareUrl = `https://max.ru/:share?text=${encodedUrl}`;
			if (!this.isMobile)
				shareUrl = `https://max.ru/:share?text=${encodedUrl}`;
            if (encodedText) 
                shareUrl += `&text=${encodedText}`;            
            return shareUrl;
        },
		clickActionSelector: function (event) {
			var target = BX.getEventTarget(event),
			entities = this.getEntities(BX(this.ids.itemListTable), 'basket-item-checkbox', '', ':checked'),
			action = target.dataset?.value||"";
			if(action == "share")
				this.shares = {};
			for (var i = 0; i < entities.length; i++) {
				let row = entities[i].closest('[data-id-real]'),  idReal = row?.dataset?.idReal,  productId = row?.dataset?.product_id;
				if(action == "wishlist") {
					if(idReal){
						if(ym)
							ym(46201080,'reachGoal','click_favorite');
						if (document.cookie.includes('favorites')) {
							var favoritesIds = this.getCookie('favorites');
							favoritesIds = JSON.parse(favoritesIds);
							if (!favoritesIds.includes(idReal.toString())) {
								favoritesIds.push(idReal.toString());
								var favoritesIdsJson = JSON.stringify(favoritesIds);
								document.cookie = 'favorites=' + favoritesIdsJson + '; max-age=864000; path=/';
							}
						} else {
							var favoritesIds = [idReal.toString()];
							var favoritesIdsJson = JSON.stringify(favoritesIds);
							document.cookie = 'favorites=' + favoritesIdsJson + '; max-age=864000; path=/';
						}					
					}
				} else if(action == "share") {
					this.shares[idReal] = (idReal != productId ? productId : "");
				} else if(action == "remove") {
					row.querySelector('[data-entity="basket-item-delete"]').click();	
				}	
				row.querySelector('[data-entity="basket-item-checkbox"]').checked = false;			
			}
			if(action == "wishlist") {
				this.setWishlistHeader(favoritesIds);
			} else if(action == "share" && Object.keys(this.shares).length > 0) {
				window.repostUrl = this.buildRepostUrl(this.shares);
				// if pc = to clipboard, else default share apps
			}			
		},

		bindWarningEvents: function () {
			var showItemsNode = this.getEntity(BX(this.ids.warning), 'basket-items-warning-count');

			if (BX.type.isDomNode(showItemsNode)) {
				showItemsNode.style.display = '';
				BX.bind(showItemsNode, 'click', BX.delegate(function () { this.toggleFilter('warning'); }, this));
			}

			BX.bind(
				this.getEntity(BX(this.ids.warning), 'basket-items-warning-notification-close'),
				'click',
				BX.proxy(this.removeAllWarnings, this)
			);
		},

		toggleFilter: function (event) {
			var target = BX.type.isNotEmptyString(event) ?
				this.getEntity(
					this.getCacheNode(this.ids.itemListWrapper),
					'basket-items-count',
					'[data-filter="' + event + '"]'
				)
				: BX.getEventTarget(event);

			if (!BX.type.isDomNode(target) || BX.hasClass(target, 'active'))
				return;

			var entityName = target.getAttribute('data-filter');
			var entities = target.parentNode.querySelectorAll('[data-filter]');

			for (var i = 0; i < entities.length; i++) {
				if (entities[i].getAttribute('data-filter') === entityName) {
					BX.addClass(entities[i], 'active');
				}
				else if (BX.hasClass(entities[i], 'active')) {
					BX.removeClass(entities[i], 'active');
				}
			}

			this.filter.showFilterByName(entityName);
		},

		scrollToFirstItem: function () {
			var headerNode = this.getEntity(this.getCacheNode(this.ids.itemListWrapper), 'basket-items-list-header');

			if (BX.type.isDomNode(headerNode)) {
				var itemListTopPosition = BX.pos(this.getCacheNode(this.ids.itemListContainer)).top;
				var headerBottomPosition = BX.pos(headerNode).bottom;

				if (itemListTopPosition < headerBottomPosition) {
					window.scrollTo(0, itemListTopPosition - this.stickyHeaderOffset);
				}
			}
		},

		showItemsOverlay: function () {
			var overlay = this.getCacheNode(this.ids.itemListOverlay);

			if (BX.type.isDomNode(overlay)) {
				overlay.style.display = '';
			}
		},

		hideItemsOverlay: function () {
			var overlay = this.getCacheNode(this.ids.itemListOverlay);

			if (BX.type.isDomNode(overlay)) {
				overlay.style.display = 'none';
			}
		},

		checkHeaderDisplay: function () {
			var header = this.getCacheNode(this.ids.itemListWrapper);

			if (BX.type.isDomNode(header)) {
				BX.removeClass(header, 'basket-items-list-wrapper-light');
			}
		},

		bindHeaderEvents: function () {
			var entities = this.getEntities(this.getCacheNode(this.ids.itemListWrapper), 'basket-items-count');

			for (var i = 0; i < entities.length; i++) {
				BX.bind(entities[i], 'click', BX.proxy(this.toggleFilter, this));
			}
		},

		checkStickyHeaders: function () {
			if (this.isMobile)
				return;

			var node, position;
			var border = 2, offset = 0;
			var scrollTop = this.getDocumentScrollTop();
			var basketPosition = BX.pos(this.getCacheNode(this.ids.basketRoot));
			var basketScrolledToEnd = scrollTop + 200 >= basketPosition.bottom;


			var totalBlockNode = this.getEntity(this.getCacheNode(this.ids.basketRoot), 'basket-total-block');
			if (BX.type.isDomNode(totalBlockNode)) {
				node = this.getEntity(totalBlockNode, 'basket-checkout-aligner');
				if (BX.type.isDomNode(node)) {
					position = BX.pos(totalBlockNode);

					if (scrollTop >= position.top) {
						offset += node.clientHeight;

						if (!BX.hasClass(node, 'basket-checkout-container-fixed')) {
							totalBlockNode.style.height = position.height + 'px';

							node.style.width = node.clientWidth + border + 'px';
							BX.addClass(node, 'basket-checkout-container-fixed');
						}
					}
					else if (BX.hasClass(node, 'basket-checkout-container-fixed')) {
						totalBlockNode.style.height = '';

						node.style.width = '';
						BX.removeClass(node, 'basket-checkout-container-fixed');
					}

					if (basketScrolledToEnd) {
						if (!BX.hasClass(node, 'basket-checkout-container-fixed-hide')) {
							BX.addClass(node, 'basket-checkout-container-fixed-hide');
						}
					}
					else if (BX.hasClass(node, 'basket-checkout-container-fixed-hide')) {
						BX.removeClass(node, 'basket-checkout-container-fixed-hide');
					}
				}
			}

			if (this.useItemsFilter) {
				var itemWrapperNode = this.getCacheNode(this.ids.itemListWrapper);

				node = this.getEntity(itemWrapperNode, 'basket-items-list-header');
				if (BX.type.isDomNode(node)) {
					position = BX.pos(itemWrapperNode);

					if ((scrollTop + offset >= position.top) && !basketScrolledToEnd) {
						if (!BX.hasClass(node, 'basket-items-list-header-fixed')) {
							node.style.width = node.clientWidth + border + 'px';

							itemWrapperNode.style.paddingTop = node.clientHeight + 'px';

							BX.addClass(node, 'basket-items-list-header-fixed');
						}

						if (offset) {
							node.style.top = offset + 'px';
						}

						offset += node.clientHeight;
					}
					else if (BX.hasClass(node, 'basket-items-list-header-fixed')) {
						itemWrapperNode.style.paddingTop = '';

						node.style.width = '';
						node.style.top = '';

						BX.removeClass(node, 'basket-items-list-header-fixed');
					}
				}
			}

			this.stickyHeaderOffset = offset;
		},

		getDocumentScrollTop: function () {
			return window.scrollY
				|| window.pageYOffset
				|| document.body.scrollTop + (document.documentElement && document.documentElement.scrollTop || 0);
		},

		lazyLoad: function () {

			var itemsNodePosition = BX.pos(this.getCacheNode(this.ids.itemListContainer));

			if (this.getDocumentScrollTop() + window.innerHeight >= itemsNodePosition.bottom - 400) {
				var itemIds = this.getItemsAfter();

				if (itemIds.length) {
					this.editBasketItems(itemIds);
				}
			}
		},

		fireCustomEvents: function () {
			if (this.result.EVENT_ONCHANGE_ON_START === 'Y') {
				BX.onCustomEvent('OnBasketChange');
			}

			if (this.params.HIDE_COUPON !== 'Y') {
				if (this.coupons !== null && this.coupons !== this.result.COUPON_LIST) {
					BX.onCustomEvent('OnCouponApply');
				}

				this.coupons = this.result.COUPON_LIST;
			}
		},

		editTotal: function () {
			this.fillTotalBlocks();
			this.showItemsCount();
			this.showWarningItemsCount();
			this.showNotAvailableItemsCount();
			this.showDelayedItemsCount();
		},

		fillTotalBlocks: function () {
			var totalNodes = this.getEntities(this.getCacheNode(this.ids.basketRoot), 'basket-total-block');

			if (totalNodes && totalNodes.length) {
				var totalTemplate = this.getTemplate('basket-total-template');
				if (totalTemplate) {
					var totalRender = this.render(totalTemplate, this.result.TOTAL_RENDER_DATA);

					for (var i in totalNodes) {
						if (totalNodes.hasOwnProperty(i) && BX.type.isDomNode(totalNodes[i])) {
							totalNodes[i].innerHTML = totalRender;
							document.dispatchEvent(new CustomEvent('BXFillTotalBlocks', { detail: this.result, bubbles: true }))
							this.bindTotalEvents(totalNodes[i]);
						}
					}
				}
			}

			this.checkStickyHeaders();
		},

		showItemsCount: function () {
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="all"]'
			);

			if (BX.type.isDomNode(itemCountNode)) {
				itemCountNode.innerHTML = BX.message('SBB_IN_BASKET') + ' ' + this.result.BASKET_ITEMS_COUNT + ' ' + this.getGoodsMessage(this.result.BASKET_ITEMS_COUNT);
				itemCountNode.style.display = '';
			}
		},

		showSimilarCount: function (state) {
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="similar"]'
			);

			if (BX.type.isDomNode(itemCountNode)) {
				if (state) {
					itemCountNode.innerHTML = this.sortedItems.length + ' '
						+ this.getGoodsMessage(this.result.BASKET_ITEMS_COUNT, 'SBB_SIMILAR_ITEM');
					itemCountNode.style.display = '';
				}
				else {
					itemCountNode.style.display = 'none';
				}
			}
		},

		showWarningItemsCount: function () {
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="warning"]'
			);

			if (BX.type.isDomNode(itemCountNode)) {
				if (this.warningItems.length) {
					itemCountNode.innerHTML = this.warningItems.length + ' ' + BX.message('SBB_BASKET_ITEMS_WARNING');
					itemCountNode.style.display = '';
				}
				else {
					itemCountNode.style.display = 'none';
				}
			}
		},

		showNotAvailableItemsCount: function () {
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="not-available"]'
			);

			if (BX.type.isDomNode(itemCountNode)) {
				if (parseInt(this.result.NOT_AVAILABLE_BASKET_ITEMS_COUNT)) {
					itemCountNode.innerHTML = this.result.NOT_AVAILABLE_BASKET_ITEMS_COUNT + ' '
						+ this.getGoodsMessage(this.result.NOT_AVAILABLE_BASKET_ITEMS_COUNT, 'SBB_NOT_AVAILABLE_ITEM');
					itemCountNode.style.display = '';
				}
				else {
					itemCountNode.style.display = 'none';
				}
			}
		},

		showDelayedItemsCount: function () {
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="delayed"]'
			);

			if (BX.type.isDomNode(itemCountNode)) {
				if (parseInt(this.result.DELAYED_BASKET_ITEMS_COUNT)) {
					itemCountNode.innerHTML = this.result.DELAYED_BASKET_ITEMS_COUNT + ' '
						+ this.getGoodsMessage(this.result.DELAYED_BASKET_ITEMS_COUNT, 'SBB_DELAYED_ITEM');
					itemCountNode.style.display = '';
				}
				else {
					itemCountNode.style.display = 'none';
				}
			}
		},

		getGoodsMessage: function (count, customMessage) {
			var mesCode;
			var countReminder = (count > 10 && count < 20) ? 0 : count % 10;

			if (countReminder === 1) {
				mesCode = customMessage || 'SBB_GOOD';
			}
			else if (countReminder >= 2 && countReminder <= 4) {
				mesCode = customMessage ? customMessage + '_2' : 'SBB_GOOD_2';
			}
			else {
				mesCode = customMessage ? customMessage + 'S' : 'SBB_GOODS';
			}

			return BX.message(mesCode);
		},

		bindTotalEvents: function (node) {
			if (!this.result.TOTAL_RENDER_DATA.DISABLE_CHECKOUT) {
				BX.bind(this.getEntity(node, 'basket-checkout-button'), 'click', BX.proxy(this.checkOutAction, this));
			}

			// BX.bind(this.getEntity(node, 'basket-coupon-input'), 'change', BX.proxy(this.addCouponAction, this));
			// BX.bind(this.getEntity(node, 'basket-coupon-input'), 'paste', BX.proxy(this.pasteCouponAction, this));
			BX.bind(this.getEntity(node, 'basket-coupon-button'), 'click', BX.proxy(this.addCouponAction, this));

			var couponNodes = this.getEntities(node, 'basket-coupon-delete');
			for (var i = 0, l = couponNodes.length; i < l; i++) {
				BX.bind(couponNodes[i], 'click', BX.proxy(this.removeCouponAction, this));
			}

		},

		checkOutAction: function () {
			document.location.href = this.params.PATH_TO_ORDER;
		},

		addCouponAction: function (event) {
			// var target = BX.getEventTarget(event);
			const node = this.getCacheNode(this.ids.basketRoot);
			var target = this.getEntity(node, 'basket-coupon-input');
			if (target && target.value) {
				this.actionPool.addCoupon(target.value);
				target.disabled = true;
			}
		},

		pasteCouponAction: function (event) {
			setTimeout(BX.delegate(function () {
				this.addCouponAction(event);
			}, this), 10);
		},

		removeCouponAction: function () {
			var value = BX.proxy_context && BX.util.trim(BX.proxy_context.getAttribute('data-coupon'));
			if (value) {
				this.actionPool.removeCoupon(value);
			}
		},

		initializeActionPool: function () {
			this.actionPool = new BX.Sale.BasketActionPool(this);
		},

		initializeFilter: function () {
			this.filter = new BX.Sale.BasketFilter(this);
		},

		/**
		 * Send ajax request with basket data and executes callback by action
		 */
		sendRequest: function (action, data) {
			this.lastAction = action;

			if (this.lastAction === 'recalculateAjax') {
				// we use it to reload all items if applied discounts changed
				data.lastAppliedDiscounts = BX.util.array_keys(this.result.FULL_DISCOUNT_LIST).join(',');

				if (this.params.USE_ENHANCED_ECOMMERCE === 'Y') {
					this.checkAnalytics(data);
				}
			}

			BX.ajax({
				method: 'POST',
				dataType: 'json',
				url: this.ajaxUrl,
				data: this.getData(data),
				onsuccess: BX.delegate(function (result) {
					this.actionPool.doProcessing(false);

					if (!BX.type.isPlainObject(result))
						return;

					this.actionPool.setRefreshStatus(result.BASKET_REFRESHED);

					if (result.RESTORED_BASKET_ITEMS) {
						this.restoreBasketItems(result.RESTORED_BASKET_ITEMS);
					}

					if (result.DELETED_BASKET_ITEMS) {
						if (result.hasOwnProperty('BASKET_DATA') && result.BASKET_DATA.hasOwnProperty('EMPTY_BASKET')
							&& result.BASKET_DATA.EMPTY_BASKET === true) {

							this.drawEmptyBasket();

							this.applyBasketResult(result.BASKET_DATA);

							this.actionPool.switchTimer();

							document.dispatchEvent(new CustomEvent('BXBasketResponse', { detail: result, bubbles: true }));

							return;

						}
						this.deleteBasketItems(result.DELETED_BASKET_ITEMS, this.params.SHOW_RESTORE === 'Y');

					}

					if (result.MERGED_BASKET_ITEMS) {
						this.deleteBasketItems(result.MERGED_BASKET_ITEMS, false, true);
					}

					this.applyBasketResult(result.BASKET_DATA);
					this.editBasketItems(this.getItemsToEdit());
					this.editTotal(false);

					this.applyPriceAnimation();
					this.editWarnings();

					this.actionPool.switchTimer();

					document.dispatchEvent(new CustomEvent('BXBasketResponse', { detail: result, bubbles: true }));

					if (this.isBasketIntegrated() && this.isBasketChanged()) {
						BX.Sale.OrderAjaxComponent.sendRequest();
					}					
					this.loadProductSales();
				}, this),
				onfailure: BX.delegate(function () {
					this.actionPool.doProcessing(false);
				}, this)
			});
		},

		isBasketIntegrated: function () {
			return this.params.BASKET_WITH_ORDER_INTEGRATION === 'Y';
		},

		isBasketChanged: function () {
			return this.changedItems.length;
		},

		addPriceAnimationData: function (nodeId, start, finish, currency) {
			if (!BX.type.isPlainObject(this.priceAnimationData)) {
				this.clearPriceAnimationData();
			}

			this.priceAnimationData.start[nodeId] = parseFloat(start);
			this.priceAnimationData.finish[nodeId] = parseFloat(finish);
			this.priceAnimationData.currency[nodeId] = currency;
			this.priceAnimationData.int[nodeId] = (parseFloat(start) === parseInt(start)) && (parseFloat(finish) === parseInt(finish));
		},

		clearPriceAnimationData: function () {
			this.priceAnimationData = {
				start: {},
				finish: {},
				currency: {},
				int: {}
			};
		},

		applyBasketResult: function (result) {
			this.changedItems = [];
			this.clearPriceAnimationData();

			if (!BX.type.isPlainObject(result)) {
				return;
			}

			if (result.BASKET_ITEM_RENDER_DATA) {
				var i, newData, arrTmp = [], beforeItems = this.items, newItems = {}, length = Object.keys(this.items).length;

				for (i in result.BASKET_ITEM_RENDER_DATA) {
					if (result.BASKET_ITEM_RENDER_DATA.hasOwnProperty(i)) {
						newData = result.BASKET_ITEM_RENDER_DATA[i];

						// Mustache helper flag: render sales container only when non-empty
						newData.HAS_SALES = Array.isArray(newData.SALES_LIST) && newData.SALES_LIST.length > 0;

						newData.WARNINGS = this.checkBasketItemWarnings(newData, result.WARNING_MESSAGE_WITH_CODE);

						arrTmp.push(String(newData.ID));

						if (this.items[newData.ID]) {

							if (JSON.stringify(this.items[newData.ID]) === JSON.stringify(newData)) {
								continue;
							}
						}
						else {
							this.addSortedItem(newData.ID, true);
						}

						this.changedItems.push(newData.ID);

						newData = this.checkBasketItemsAnimation(newData);

						if (!beforeItems[newData.ID]) {
							newItems[newData.ID] = newData;
						}

						this.items[newData.ID] = newData;

					}

				}

				for (var i in this.items) {
					if (!arrTmp.includes(i)) {

						if (this.items[i] && this.items[i].SHOW_RESTORE) {
							continue;
						}
						if (this.items[i] && this.items[i].IS_CAN_BUY) {
							this.deleteBasketItem(i, false, false);
						}
					}
				}

				this.changedItems = BX.util.array_unique(this.changedItems.concat(this.getChangedSimilarOffers()));

				if (this.isBasketChanged()) {
					this.sortSortedItems(true);
				}
				if (Object.keys(newItems).length > 0 && length > 0) {
					for (i in newItems) {
						if(!BX(this.ids.item + newItems[i].ID))
							this.createBasketItem(newItems[i].ID);
					}
				}
			}

			if (result.TOTAL_RENDER_DATA) {
				result.TOTAL_RENDER_DATA = this.checkTotalAnimation(result.TOTAL_RENDER_DATA);
			}

			this.result = result;
		},

		itemSortFunction: function (a, b) {
			if (!this.items.hasOwnProperty(a) || !this.items.hasOwnProperty(b)) {
				return 0;
			}

			return parseFloat(this.items[a].SORT) - parseFloat(this.items[b].SORT);
		},

		getChangedSimilarOffers: function () {
			var changedSimilarOffers = [];

			var otherSimilarItemsQuantity, totalSimilarItemsQuantity;
			var hashMap = this.getHashMap();

			for (var hash in hashMap) {
				if (hashMap.hasOwnProperty(hash)) {
					if (hashMap[hash].length > 1) {
						for (var i = 0; i < hashMap[hash].length; i++) {
							otherSimilarItemsQuantity = 0;
							totalSimilarItemsQuantity = 0;

							for (var k = 0; k < hashMap[hash].length; k++) {
								if (hashMap[hash][k] != hashMap[hash][i]) {
									otherSimilarItemsQuantity += parseFloat(this.items[hashMap[hash][k]].QUANTITY);
								}

								totalSimilarItemsQuantity += parseFloat(this.items[hashMap[hash][k]].QUANTITY);
							}

							if (
								!this.items[hashMap[hash][i]].HAS_SIMILAR_ITEMS
								|| this.items[hashMap[hash][i]].SIMILAR_ITEMS_QUANTITY != otherSimilarItemsQuantity
								|| this.items[hashMap[hash][i]].TOTAL_SIMILAR_ITEMS_QUANTITY != totalSimilarItemsQuantity
							) {
								changedSimilarOffers.push(hashMap[hash][i]);

								this.items[hashMap[hash][i]].HAS_SIMILAR_ITEMS = true;
								this.items[hashMap[hash][i]].SIMILAR_ITEMS_QUANTITY = otherSimilarItemsQuantity;
								this.items[hashMap[hash][i]].TOTAL_SIMILAR_ITEMS_QUANTITY = totalSimilarItemsQuantity;

								this.items[hashMap[hash][i]].ALL_AVAILABLE_QUANTITY = this.items[hashMap[hash][i]].AVAILABLE_QUANTITY;
								this.items[hashMap[hash][i]].AVAILABLE_QUANTITY = this.items[hashMap[hash][i]].ALL_AVAILABLE_QUANTITY - otherSimilarItemsQuantity;
							}
						}
					}
					else if (hashMap[hash][0] && this.items[hashMap[hash][0]].HAS_SIMILAR_ITEMS) {
						changedSimilarOffers.push(hashMap[hash][0]);

						delete this.items[hashMap[hash][0]].HAS_SIMILAR_ITEMS;
						delete this.items[hashMap[hash][0]].SIMILAR_ITEMS_QUANTITY;
						delete this.items[hashMap[hash][0]].TOTAL_SIMILAR_ITEMS_QUANTITY;

						this.items[hashMap[hash][0]].AVAILABLE_QUANTITY = this.items[hashMap[hash][0]].ALL_AVAILABLE_QUANTITY;
						delete this.items[hashMap[hash][0]].ALL_AVAILABLE_QUANTITY;
					}
				}
			}

			return changedSimilarOffers;
		},

		getHashMap: function () {
			var hashMap = {};

			for (var id in this.items) {
				if (this.items.hasOwnProperty(id) && this.isItemAvailable(id)) {
					if (!hashMap.hasOwnProperty(this.items[id].HASH)) {
						hashMap[this.items[id].HASH] = [];
					}

					hashMap[this.items[id].HASH].push(id);
				}
			}

			return hashMap;
		},

		isItemAvailable: function (itemId) {
			var sortedItems = this.filter.isActive() ? this.filter.realSortedItems : this.sortedItems;

			return !this.items[itemId].NOT_AVAILABLE
				&& !this.items[itemId].SHOW_RESTORE
				&& BX.util.in_array(itemId, sortedItems);
		},

		checkTotalAnimation: function (totalData) {
			if (this.result && this.result.TOTAL_RENDER_DATA && parseFloat(this.result.TOTAL_RENDER_DATA.PRICE) > parseFloat(totalData.PRICE)) {
				totalData.PRICE_NEW = totalData.PRICE;
				totalData.PRICE = this.result.TOTAL_RENDER_DATA.PRICE;

				totalData.PRICE_FORMATED_NEW = totalData.PRICE_FORMATED;
				totalData.PRICE_FORMATED = this.result.TOTAL_RENDER_DATA.PRICE_FORMATED;

				this.addPriceAnimationData(this.ids.total, totalData.PRICE, totalData.PRICE_NEW, totalData.CURRENCY);
			}

			return totalData;
		},

		checkBasketItemsAnimation: function (itemData) {
			var itemId = itemData.ID;

			if (this.items[itemId]) {
				var quantityNode = BX(this.ids.quantity + itemId);
				if (
					BX.type.isDomNode(quantityNode)
					&& !this.actionPool.isItemInPool(itemId)
					&& parseFloat(quantityNode.value) !== parseFloat(itemData.QUANTITY)
				) {
					itemData.QUANTITY_ANIMATION = true;
					this.actionPool.clearLastActualQuantityPool(itemId);
				}

				if (parseFloat(this.items[itemId].PRICE) > parseFloat(itemData.PRICE)) {
					itemData.PRICE_NEW = itemData.PRICE;
					itemData.PRICE = this.items[itemId].PRICE;

					itemData.PRICE_FORMATED_NEW = itemData.PRICE_FORMATED;
					itemData.PRICE_FORMATED = this.items[itemId].PRICE_FORMATED;

					this.addPriceAnimationData(this.ids.price + itemId, itemData.PRICE, itemData.PRICE_NEW, itemData.CURRENCY);
				}

				if (
					BX.util.in_array('SUM', this.params.COLUMNS_LIST)
					&& parseFloat(this.items[itemId].SUM_PRICE) > parseFloat(itemData.SUM_PRICE)
					&& parseFloat(this.items[itemId].QUANTITY) === parseFloat(itemData.QUANTITY)
				) {
					itemData.SUM_PRICE_NEW = itemData.SUM_PRICE;
					itemData.SUM_PRICE = this.items[itemId].SUM_PRICE;

					itemData.SUM_PRICE_FORMATED_NEW = itemData.SUM_PRICE_FORMATED;
					itemData.SUM_PRICE_FORMATED = this.items[itemId].SUM_PRICE_FORMATED;

					this.addPriceAnimationData(this.ids.sumPrice + itemId, itemData.SUM_PRICE, itemData.SUM_PRICE_NEW, itemData.CURRENCY);
				}
			}

			return itemData;
		},

		getData: function (data) {
			data = data || {};

			data[this.params.ACTION_VARIABLE] = this.lastAction;
			data.via_ajax = 'Y';
			data.site_id = this.siteId;
			data.site_template_id = this.siteTemplateId;
			data.sessid = BX.bitrix_sessid();
			data.template = this.template;
			data.signedParamsString = this.signedParamsString;

			return data;
		},

		startLoader: function () {
			// if (!this.loadingScreen)
			// {
			// 	this.loadingScreen = new BX.PopupWindow('loading_screen', null, {
			// 		events: {
			// 			onAfterPopupShow: BX.delegate(function() {
			// 				BX.cleanNode(this.loadingScreen.popupContainer);
			// 				BX.removeClass(this.loadingScreen.popupContainer, 'popup-window');
			// 				this.loadingScreen.popupContainer.appendChild(
			// 					BX.create('IMG', {props: {src: this.templateFolder + '/images/loader.gif'}})
			// 				);
			// 				this.loadingScreen.popupContainer.removeAttribute('style');
			// 				this.loadingScreen.popupContainer.style.display = 'block';
			// 			}, this)
			// 		}
			// 	});
			// 	BX.addClass(this.loadingScreen.popupContainer, 'bx-step-opacity');
			// }
			//
			// this.loadingScreen.show();
		},

		/**
		 * Hiding loader image with overlay.
		 */
		endLoader: function () {
			// if (this.loadingScreen && this.loadingScreen.isShown())
			// {
			// 	this.loadingScreen.close();
			// }
		},

		editWarnings: function () {
			this.editGeneralWarnings();
			this.editBasketItemWarnings();
			this.toggleWarningBlock();
			this.showWarningItemsCount();
		},

		editGeneralWarnings: function () {
			var warningsNode = this.getEntity(this.getCacheNode(this.ids.warning), 'basket-general-warnings');

			if (BX.type.isDomNode(warningsNode)) {
				var generalWarningText = warningsNode.innerHTML;

				if (this.result.WARNING_MESSAGE_WITH_CODE) {
					for (var code in this.result.WARNING_MESSAGE_WITH_CODE) {
						if (this.result.WARNING_MESSAGE_WITH_CODE.hasOwnProperty(code)) {
							if (
								!this.items[code]
								&& generalWarningText.indexOf(this.result.WARNING_MESSAGE_WITH_CODE[code]) === -1
							) {
								generalWarningText += this.result.WARNING_MESSAGE_WITH_CODE[code] + '<br/>';
							}
						}
					}
				}

				if (generalWarningText) {
					warningsNode.innerHTML = generalWarningText;
					warningsNode.style.display = '';
				}
				else {
					warningsNode.style.display = 'none';
					warningsNode.innerHTML = '';
				}
			}
		},

		editBasketItemWarnings: function () {
			var itemsWarningsNode = this.getEntity(this.getCacheNode(this.ids.warning), 'basket-item-warnings');

			if (BX.type.isDomNode(itemsWarningsNode)) {
				if (this.warningItems.length) {
					var warningCount = this.getEntity(itemsWarningsNode, 'basket-items-warning-count');
					if (BX.type.isDomNode(warningCount)) {
						warningCount.innerHTML = this.warningItems.length + ' ' + this.getGoodsMessage(this.warningItems.length);
					}

					itemsWarningsNode.style.display = '';
				}
				else if (itemsWarningsNode.style.display !== 'none') {
					itemsWarningsNode.style.display = 'none';

					if (this.filter.isActive()) {
						this.toggleFilter('all');
					}
				}
			}
		},

		toggleWarningBlock: function () {
			var warningNode = this.getCacheNode(this.ids.warning);

			if (BX.type.isDomNode(warningNode)) {
				var generalWarningNode = this.getEntity(warningNode, 'basket-general-warnings');
				var itemsWarningsNode = this.getEntity(warningNode, 'basket-item-warnings');

				if (
					(!BX.type.isDomNode(generalWarningNode) || generalWarningNode.style.display === 'none')
					&& (!BX.type.isDomNode(itemsWarningsNode) || itemsWarningsNode.style.display === 'none')
				) {
					warningNode.style.display = 'none';
				}
				else {
					warningNode.style.display = '';
				}
			}
		},

		checkBasketItemWarnings: function (itemData, warnings) {
			if (!itemData)
				return;

			var itemWarnings;

			if (this.items[itemData.ID] && this.lastAction === 'refreshAjax') {
				itemWarnings = this.items[itemData.ID].WARNINGS;
			}
			else {
				itemWarnings = [];
			}

			if (BX.type.isArray(warnings[itemData.ID]) && warnings[itemData.ID].length) {
				for (var i in warnings[itemData.ID]) {
					if (warnings[itemData.ID].hasOwnProperty(i) && !BX.util.in_array(warnings[itemData.ID][i], itemWarnings)) {
						itemWarnings.push(warnings[itemData.ID][i]);
					}
				}
			}

			if (itemWarnings.length) {
				if (!BX.util.in_array(itemData.ID, this.warningItems)) {
					this.warningItems.push(itemData.ID);
				}
			}
			else if (BX.util.in_array(itemData.ID, this.warningItems)) {
				this.warningItems.splice(BX.util.array_search(itemData.ID, this.warningItems), 1);
			}

			return itemWarnings;
		},

		removeAllWarnings: function (event) {
			this.clearGeneralWarnings();
			this.clearBasketItemsWarnings();

			this.editWarnings();

			event && event.preventDefault();
		},

		clearGeneralWarnings: function () {
			this.result.WARNING_MESSAGE_WITH_CODE = {};

			var generalWarningNode = this.getEntity(this.getCacheNode(this.ids.warning), 'basket-general-warnings');

			if (BX.type.isDomNode(generalWarningNode)) {
				generalWarningNode.innerHTML = '';
			}
		},

		clearBasketItemsWarnings: function () {
			var itemsToEdit = [];

			for (var i in this.warningItems) {
				if (this.warningItems.hasOwnProperty(i)) {
					this.items[this.warningItems[i]].WARNINGS = [];

					if (this.isItemShown(this.warningItems[i])) {
						itemsToEdit.push(this.warningItems[i]);
					}
				}
			}

			this.warningItems = [];
			this.editBasketItems(itemsToEdit);
		},

		isItemShown: function (itemId) {
			return BX.util.in_array(itemId, this.shownItems);
		},

		initializeBasketItems: function () {
			if (Object.keys(this.items).length === 0)
				return;

			for (var i = 0; i < this.sortedItems.length; i++) {
				if (this.useDynamicScroll && this.shownItems.length >= this.maxItemsShowCount) {
					break;
				}
				this.createBasketItem(this.sortedItems[i]);
				this.checkIsNotCanBuy(this.items[this.sortedItems[i]]);
				this.setWishlistItem(this.sortedItems[i]);
			}
			for (var i = 0; i < this.sortedItems.length; i++) {
				this.createStringHigh(this.sortedItems[i]);
			}
			this.loadSimilar();
			this.loadProductSales();
		},

		setWishlistItem: function (basketId) {
			let row = this.getEntity(BX(this.ids.itemListTable), 'basket-item', '[data-id="' + basketId + '"]');
			if(!row) 
				row = this.getEntity(BX(this.ids.itemListTable), 'basket-item-delayed', '[data-id="' + basketId + '"]');
			let productId = row?.dataset?.idReal;
			if(productId){
				if (document.cookie.includes('favorites')) {
					var favoritesIds = this.getCookie('favorites');
					favoritesIds = JSON.parse(favoritesIds);
					if (favoritesIds.includes(productId.toString())) {
						row.querySelector('[data-wishlist="false"]').hidden = true;
						row.querySelector('[data-wishlist="true"]').hidden = false;
					}
				}
			}
		},

		loadProductSales: function () {
			if (this.result.PRODUCT_SALES_SUM > 0) {
				let lastAlready = this.getEntities(BX(this.ids.itemListTable), "not-exists-header"), list = this.getEntities(BX(this.ids.itemListTable), "basket-item"), last = list[list.length - 1], saleAlert = this.getEntity(BX(this.ids.itemListTable), "basket-sale-alert");
				var alertTemplate = this.getTemplate('basket-sale-alert-template');
				if (alertTemplate)
					var alertTemplateRender = this.render(alertTemplate, this.result);
				if(saleAlert) 
					saleAlert.remove();
				if (lastAlready.length > 0) {
					BX(lastAlready[0]).insertAdjacentHTML('beforebegin', alertTemplateRender);
				} else {
					if(BX(last).nextElementSibling?.hasAttribute('data-string-high'))
						last = BX(last).nextElementSibling;
					BX(last).insertAdjacentHTML('afterend', alertTemplateRender);
				}
				
			}
		},

		// checkSimilar: function (itemData) {
		// 	if (!itemData)
		// 		return;
		// 	setTimeout(() => {
		// 		if (itemData.ID_REAL && this.getEntity(BX(this.ids.itemListTable), "not-exists-footer", '[data-id-real="' + itemData.ID_REAL + '"]'))
		// 			this.getEntity(BX(this.ids.itemListTable), "not-exists-footer", '[data-id-real="' + itemData.ID_REAL + '"]').remove();
		// 		let neh = this.getEntity(BX(this.ids.itemListTable), "not-exists-header"), pr = this.getEntities(BX(this.ids.itemListTable), "basket-item", "[data-not-exists]");
		// 		console.log(pr);
		// 		console.log(neh);
		// 		if (!(pr.length > 0))
		// 			neh.remove();
		// 	}, 1000);
		// },

		checkSimilar: function (itemData) {
			if (!itemData) return;


			const table = BX(this.ids.itemListTable);
			if (!table) return;
			if (itemData.ID_REAL) {
				const footer = this.getEntity(
					table,
					"not-exists-footer",
					`[data-id-real="${itemData.ID_REAL}"]`
				);

				if (footer) {
					footer.remove();
				}
			}

			const header = this.getEntity(table, "not-exists-header");
			const items = this.getEntities(table, "basket-item", "[data-not-exists]");

			if (header && items.length === 0) {
				header.remove();
			}

		},

		checkIsNotCanBuy: function (item) {
			if (!this.IS_NOT_CAN_BUY && item.IS_NOT_CAN_BUY)
				this.IS_NOT_CAN_BUY = true;
		},

		loadSimilar: function () {
			if (this.IS_NOT_CAN_BUY) {
				let pr = this.getEntities(BX(this.ids.itemListTable), "basket-item", "[data-not-exists]");
				for (let i = 0; i < pr.length; i++) {
					if (i == 0)
						BX(pr[i]).insertAdjacentHTML('beforebegin', '<div data-not-exists-header id="neh" data-entity="not-exists-header" class="new-cart-table-item-bottom-head">Недоступны к заказу</div>');

					let idReal = pr[i].dataset.idReal;
					if (idReal) {
						BX.ajax.post(
							"/ajax/getSimilar16042026.php",
							{ "ID": idReal },
							function (result) {
								let obj = BX.processHTML(result);
								if (obj && obj.HTML) {
									BX(pr[i]).insertAdjacentHTML('afterend', '<div data-entity="not-exists-footer" data-id-real="' + idReal + '" class="new-cart-related">' + obj.HTML + '</div>');
									$('[data-id-real="' + idReal + '"] .products-mini__slider').slick({ // from main.js
										dots: false,
										infinite: false,
										fade: false,
										arrows: true,
										speed: 300,
										autoplay: false,
										autoplaySpeed: 5000,
										pauseOnDotsHover: true,
										pauseOnFocus: true,
										slidesToShow: 4,
										slidesToScroll: 1,
										prevArrow:
											"<div class=\"main-page__videos-slider-arrow main-page__videos-slider-prev\">\n" +
											"<div class=\"main-page__videos-slider-btn\">\n" +
											"<svg width=\"11\" height=\"18\" viewBox=\"0 0 11 18\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
											"<path d=\"M1.9945 15.9816L9.07933 8.9336L1.99452 1.95936\" stroke=\"black\" stroke-opacity=\"0.6\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n" +
											"</svg>\n " +
											"</div>\n " +
											"</div>",
										nextArrow:
											"<div class=\"main-page__videos-slider-arrow main-page__videos-slider-next\">\n" +
											"<div class=\"main-page__videos-slider-btn\">\n" +
											"<svg width=\"11\" height=\"18\" viewBox=\"0 0 11 18\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
											"<path d=\"M1.9945 15.9816L9.07933 8.9336L1.99452 1.95936\" stroke=\"black\" stroke-opacity=\"0.6\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n" +
											"</svg>\n " +
											"</div>\n " +
											"</div>",
										responsive: [
											{
												breakpoint: 1250,
												settings: {
													slidesToShow: 3,
													arrows: false,
												}
											},
											{
												breakpoint: 767,
												settings: {
													slidesToShow: 2,
													arrows: false,
												}
											},
										],
									});
								}
							}
						);
					}
				}
			}
		},
		createBasketItem: function (itemId) {
			if (!this.items[itemId]) {
				return;
			}

			var basketItemTemplate = this.getTemplate('basket-item-template');
			if (basketItemTemplate) {
				var basketItemHtml = this.renderBasketItem(basketItemTemplate, this.items[itemId]);
				var sortIndex = BX.util.array_search(itemId, this.sortedItems);

				if (this.shownItems.length && sortIndex >= 0) {
					if (sortIndex < BX.util.array_search(this.shownItems[0], this.sortedItems)) {
						// insert before
						BX(this.ids.item + this.shownItems[0]).insertAdjacentHTML('beforebegin', basketItemHtml);
						this.shownItems.unshift(itemId);
					}
					else if (sortIndex > BX.util.array_search(this.shownItems[this.shownItems.length - 1], this.sortedItems)) {
						// insert after
						BX(this.ids.item + this.shownItems[this.shownItems.length - 1]).insertAdjacentHTML('afterend', basketItemHtml);
						this.shownItems.push(itemId);
					}
					else {
						// insert between
						if(BX(this.ids.item + this.sortedItems[sortIndex + 1]).previousElementSibling.hasAttribute('data-not-exists-header') && this.items[itemId].IS_CAN_BUY)
							BX(this.ids.item + this.sortedItems[sortIndex + 1]).previousElementSibling.insertAdjacentHTML('beforebegin', basketItemHtml);
						else
							BX(this.ids.item + this.sortedItems[sortIndex + 1]).insertAdjacentHTML('beforebegin', basketItemHtml);
						this.shownItems.splice(sortIndex + 1, 0, itemId);
					}
				}
				else {
					this.getCacheNode(this.ids.itemListTable).insertAdjacentHTML('beforeend', basketItemHtml);
					this.shownItems.push(itemId);
				}

				this.bindBasketItemEvents(this.items[itemId]);

				if (this.filter.isActive()) {
					this.filter.highlightSearchMatch(this.items[itemId]);
				}
			}
		},

		getItemsToEdit: function () {
			var itemIds = [];

			if (this.isBasketChanged()) {
				for (var i in this.changedItems) {
					if (this.changedItems.hasOwnProperty(i) && this.isItemShown(this.changedItems[i])) {
						itemIds.push(this.changedItems[i]);
					}
				}
			}

			return itemIds;
		},

		getItemsAfter: function () {
			var itemIdsAfter = [];

			if (this.useDynamicScroll) {
				var lastShownItemId = this.shownItems[this.shownItems.length - 1] || false;

				if (lastShownItemId) {
					var i = 0;
					var index = BX.util.array_search(lastShownItemId, this.sortedItems);

					// Не работает, точнее работает с ошибкой )))
					while (this.sortedItems[++index] && i++ < this.maxItemsShowCount) {
						//	itemIdsAfter.push(this.sortedItems[index]);
					}
				}
			}

			return itemIdsAfter;
		},

		editBasketItems: function (itemIds) {
			if (!itemIds || itemIds.length === 0) {
				return;
			}

			var i, item;

			for (i in itemIds) {
				if (!itemIds.hasOwnProperty(i) || !BX.type.isPlainObject(this.items[itemIds[i]])) {
					continue;
				}

				item = this.items[itemIds[i]];

				if (this.actionPool.isItemInPool(item.ID)) {
					if (!BX.util.in_array(item.ID, this.postponedItems)) {
						this.postponedItems.push(item.ID);
					}

					continue;
				}

				if (BX.type.isDomNode(BX(this.ids.item + item.ID))) {
					this.redrawBasketItemNode(item.ID);
					this.applyQuantityAnimation(item.ID);
				}
				else {
					this.createBasketItem(item.ID);
				}
			}
		},

		editPostponedBasketItems: function () {
			if (!this.postponedItems.length)
				return;

			var itemsToEdit = [];

			for (var i in this.postponedItems) {
				if (this.postponedItems.hasOwnProperty(i) && this.isItemShown(this.postponedItems[i])) {
					itemsToEdit.push(this.postponedItems[i]);
				}
			}

			this.postponedItems = [];
			this.editBasketItems(itemsToEdit);
		},

		applyQuantityAnimation: function (itemId) {
			var basketItemNode = BX(this.ids.item + itemId);

			if (BX.type.isDomNode(basketItemNode) && this.items[itemId]) {
				if (this.items[itemId].QUANTITY_ANIMATION) {
					BX.addClass(BX(this.ids.quantity + itemId), 'basket-updated');
				}
			}
		},

		applyPriceAnimation: function () {
			if (!this.priceAnimationData || Object.keys(this.priceAnimationData.start).length === 0)
				return;

			var animationData = this.priceAnimationData,
				nodeCache = {};

			new BX.easing({
				duration: this.params.USE_PRICE_ANIMATION === 'Y' ? this.duration.priceAnimation : 1,
				start: animationData.start,
				finish: animationData.finish,
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
				step: BX.delegate(function (state) {
					for (var nodeId in animationData.start) {
						if (animationData.start.hasOwnProperty(nodeId)) {
							if (!nodeCache[nodeId]) {
								if (nodeId === this.ids.total) {
									nodeCache[nodeId] = this.getEntities(this.getCacheNode(this.ids.basketRoot), this.ids.total);
								}
								else {
									var node = BX(nodeId);
									nodeCache[nodeId] = node ? [node] : [];
								}
							}

							if (!animationData.int[nodeId]) {
								// fix price blinking
								state[nodeId] = (state[nodeId] + (state[nodeId] % 1000) / 1000).toFixed(5);
							}

							for (var i = 0; i < nodeCache[nodeId].length; i++) {
								nodeCache[nodeId][i].innerHTML = this.getFormatPrice(state[nodeId], animationData.currency[nodeId]);
							}
						}
					}
				}, this),
				complete: BX.delegate(function () {
					var nodeId, formattedPrice, itemId, type;

					for (nodeId in animationData.start) {
						if (animationData.start.hasOwnProperty(nodeId)) {
							formattedPrice = this.getFormatPrice(animationData.finish[nodeId], animationData.currency[nodeId]);

							for (var i = 0; i < nodeCache[nodeId].length; i++) {
								nodeCache[nodeId][i].innerHTML = formattedPrice;
							}

							if (nodeId.indexOf(this.ids.sumPrice) !== -1) {
								type = 'SUM_PRICE';
								itemId = nodeId.substr(this.ids.sumPrice.length);
							}
							else if (nodeId.indexOf(this.ids.price) !== -1) {
								type = 'PRICE';
								itemId = nodeId.substr(this.ids.price.length);
							}
							else if (nodeId.indexOf(this.ids.total) !== -1) {
								type = 'TOTAL';
								itemId = '';
							}
							else {
								itemId = '';
								type = '';
							}

							if (BX.type.isNotEmptyString(type)) {
								if (itemId) {
									this.items[itemId][type] = animationData.finish[nodeId];
									delete this.items[itemId][type + '_NEW'];
									this.items[itemId][type + '_FORMATED'] = formattedPrice;
									delete this.items[itemId][type + '_FORMATED_NEW'];
								}
								else if (type === 'TOTAL') {
									this.result.TOTAL_RENDER_DATA.PRICE = animationData.finish[nodeId];
									delete this.result.TOTAL_RENDER_DATA.PRICE_NEW;
									this.result.TOTAL_RENDER_DATA.PRICE_FORMATED = formattedPrice;
									delete this.result.TOTAL_RENDER_DATA.PRICE_FORMATED_NEW;
								}
							}
						}
					}

					this.filter.highlightFoundItems();
				}, this)
			}).animate();
		},

		getFormatPrice: function (price, currency) {
			return BX.Currency.currencyFormat(price, currency, true);
		},

		deleteBasketItems: function (items, restore, final) {
			if (!items || !items.length) {
				return;
			}

			for (var i in items) {
				if (items.hasOwnProperty(i)) {
					this.deleteBasketItem(items[i], restore, final);
				}
			}
		},

		deleteBasketItem: function (itemId, restore, final) {

			if (!this.items || !this.items[itemId]) {
				BX.remove(BX(this.ids.item + itemId));
				BX.remove(BX(this.ids.itemHeightAligner + itemId));
				return;
			}

			if (this.items[itemId].NOT_AVAILABLE && restore) {
				restore = false;
				final = true;
			}

			if (restore) {
				this.items[itemId].SHOW_RESTORE = true;
				this.items[itemId].SHOW_LOADING = false;
				this.redrawBasketItemNode(itemId);
			}
			else {
				this.changeShownItem(itemId);
				BX.remove(BX(this.ids.item + itemId));
				if (final) {
					BX.remove(BX(this.ids.itemHeightAligner + itemId));
				}
				delete this.items[itemId];
			}

			if (final) {
				this.changeSortedItem(itemId, false, true);
				this.changeShownItem(itemId, false, true);
			}
		},

		drawEmptyBasket: function () {
			if (this.basketUrl !== false && this.idNode !== false) {

				var url = this.basketUrl + '?ajax_custom=Y', idNode = this.idNode;

				$.ajax({
					url: url,
					type: 'get',
					cache: false,
				}).done(function (data) {
					//ответ в случае успеха

					$(idNode).html(data);

				}).fail(function (data) {
					// пишем ошибку в консоль если что-то пошло не так
					console.log('Error: ' + data);
				}).always(function () {

				});

			}

		},

		addSortedItem: function (itemId, all) {
			this.sortedItems.push(itemId.toString());

			if (all && this.filter.isActive()) {
				this.filter.realSortedItems.push(itemId.toString());
			}
		},

		changeSortedItem: function (itemId, newItemId, all) {
			var index = BX.util.array_search(itemId, this.sortedItems);

			if (index >= 0) {
				if (newItemId) {
					this.sortedItems.splice(index, 1, newItemId.toString());
				}
				else {
					this.sortedItems.splice(index, 1);
				}
			}

			if (all && this.filter.isActive()) {
				index = BX.util.array_search(itemId, this.filter.realSortedItems);

				if (index >= 0) {
					if (newItemId) {
						this.filter.realSortedItems.splice(index, 1, newItemId.toString());
					}
					else {
						this.filter.realSortedItems.splice(index, 1);
					}
				}
			}
		},

		sortSortedItems: function (all) {
			this.sortedItems.sort(BX.proxy(this.itemSortFunction, this));

			if (all && this.filter.isActive()) {
				this.filter.realSortedItems.sort(BX.proxy(this.itemSortFunction, this));
			}
		},

		changeShownItem: function (itemId, newItemId, all) {
			var index = BX.util.array_search(itemId, this.shownItems);

			if (index >= 0) {
				if (newItemId) {
					this.shownItems.splice(index, 1, newItemId.toString());
				}
				else {
					this.shownItems.splice(index, 1);
				}
			}

			if (all && this.filter.isActive()) {
				index = BX.util.array_search(itemId, this.filter.realShownItems);

				if (index >= 0) {
					if (newItemId) {
						this.filter.realShownItems.splice(index, 1, newItemId.toString());
					}
					else {
						this.filter.realShownItems.splice(index, 1);
					}
				}
			}
		},

		redrawBasketItemNode: function (itemId, from ="") {
			var basketItemNode = BX(this.ids.item + itemId);
			var nodeAligner = BX(this.ids.itemHeightAligner + itemId);
			var nodeToReplace = BX.type.isDomNode(basketItemNode) ? basketItemNode : nodeAligner;

			if (!this.items[itemId] || !BX.type.isDomNode(nodeToReplace))
				return;

			var basketItemTemplate = this.getTemplate('basket-item-template');
			if (basketItemTemplate) {
				var oldHeight;

				if (BX.type.isDomNode(nodeAligner)) {
					oldHeight = nodeAligner.clientHeight;
				}

				var basketItemHtml = this.renderBasketItem(basketItemTemplate, this.items[itemId]);
				var remove = true;
				if(from != "restore") {
					if(nodeToReplace.previousElementSibling.hasAttribute('data-not-exists-header') && this.items[itemId].IS_CAN_BUY){
						remove = false;
					} else
						nodeToReplace.insertAdjacentHTML('beforebegin', basketItemHtml);
				}

				this.startDeleteInterval(BX(this.ids.itemHeightAligner + itemId));
				if(remove)
					BX.remove(nodeToReplace);


				if (oldHeight) {
					nodeAligner = BX(this.ids.itemHeightAligner + itemId);

					if (BX.type.isDomNode(nodeAligner) && nodeAligner.clientHeight < oldHeight) {
						nodeAligner.style.minHeight = oldHeight + 'px';
						setTimeout(function () { nodeAligner.style.minHeight = '0px'; }, 1);
					}
				}

				this.bindBasketItemEvents(this.items[itemId]);

				if (this.filter.isActive()) {
					this.filter.highlightSearchMatch(this.items[itemId]);
				}
			}
			this.setWishlistItem(itemId);
		},

		restoreBasketItems: function (items) {
			if (!items || Object.keys(items).length === 0) {
				return;
			}

			var oldItemId, newItemId, basketItemNode;

			for (oldItemId in items) {
				if (items.hasOwnProperty(oldItemId)) {
					newItemId = items[oldItemId];

					if (this.isItemShown(oldItemId)) {
						this.changeShownItem(oldItemId, newItemId, true);

						basketItemNode = BX(this.ids.item + oldItemId);
						if (BX.type.isDomNode(basketItemNode)) {
							basketItemNode.id = this.ids.item + newItemId;
							basketItemNode.setAttribute('data-id', newItemId);
						}
					}

					this.changeSortedItem(oldItemId, false, true);
				}
			}
		},

		bindBasketItemEvents: function (itemData) {
			if (!itemData) return;
			var itemNode = BX(this.ids.item + itemData.ID);

			if (BX.type.isDomNode(itemNode)) {
				this.bindQuantityEvents(itemNode, itemData);
				this.bindSkuEvents(itemNode, itemData);
				this.bindImageEvents(itemNode, itemData);
				this.bindActionEvents(itemNode, itemData);
				//this.bindRestoreAction(itemNode, itemData);
				this.bindItemWarningEvents(itemNode, itemData);
				return;
			}

			var restoreNode = BX(this.ids.itemHeightAligner + itemData.ID);
			if (BX.type.isDomNode(restoreNode)) {
				this.bindRestoreAction(restoreNode, itemData);
			}
		},

		bindQuantityEvents: function (node, data) {
			if (!node || !data || !this.isItemAvailable(data.ID))
				return;

			var entity;

			var block = this.getEntity(node, 'basket-item-quantity-block');
			if (block) {
				var startEventName = this.isTouch ? 'touchstart' : 'mousedown';
				var endEventName = this.isTouch ? 'touchend' : 'mouseup';

				entity = this.getEntity(block, 'basket-item-quantity-minus');
				BX.bind(entity, startEventName, BX.proxy(this.startQuantityInterval, this));
				BX.bind(entity, endEventName, BX.proxy(this.clearQuantityInterval, this));
				BX.bind(entity, 'mouseout', BX.proxy(this.clearQuantityInterval, this));
				BX.bind(entity, 'click', BX.proxy(this.quantityMinus, this));

				entity = this.getEntity(block, 'basket-item-quantity-plus');
				BX.bind(entity, startEventName, BX.proxy(this.startQuantityInterval, this));
				BX.bind(entity, endEventName, BX.proxy(this.clearQuantityInterval, this));
				BX.bind(entity, 'mouseout', BX.proxy(this.clearQuantityInterval, this));
				BX.bind(entity, 'click', BX.proxy(this.quantityPlus, this));

				entity = this.getEntity(block, 'basket-item-quantity-field');
				BX.bind(entity, 'change', BX.proxy(this.quantityChange, this));
			}
		},

		startQuantityInterval: function () {
			var target = BX.proxy_context;
			var func = target.getAttribute('data-entity') === 'basket-item-quantity-minus'
				? BX.proxy(this.quantityMinus, this)
				: BX.proxy(this.quantityPlus, this);

			this.quantityDelay = setTimeout(
				BX.delegate(function () {
					this.quantityTimer = setInterval(function () { func(target); }, 150);
				}, this),
				300
			);
		},

		clearQuantityInterval: function () {
			clearTimeout(this.quantityDelay);
			clearInterval(this.quantityTimer);
		},

		quantityPlus: function (target) {
			if (!BX.type.isDomNode(target)) {
				target = BX.proxy_context;
				this.clearQuantityInterval();
			}

			var itemData = this.getItemDataByTarget(target);
			if (itemData) {
				var quantityField = BX(this.ids.quantity + itemData.ID);
				var isQuantityFloat = this.isQuantityFloat(itemData);

				var currentQuantity = isQuantityFloat ? parseFloat(quantityField.value) : Math.round(quantityField.value);
				var measureRatio = isQuantityFloat ? parseFloat(itemData.MEASURE_RATIO) : parseInt(itemData.MEASURE_RATIO);

				var quantity = parseFloat((currentQuantity + measureRatio).toFixed(5));
				quantity = this.getCorrectQuantity(itemData, quantity);
				this.setQuantity(itemData, quantity);
			}
		},

		quantityMinus: function (target) {
			target = BX.type.isDomNode(target) ? target : BX.proxy_context;

			var itemData = this.getItemDataByTarget(target);
			if (itemData) {
				var quantityField = BX(this.ids.quantity + itemData.ID);
				var isQuantityFloat = this.isQuantityFloat(itemData);

				var currentQuantity = isQuantityFloat ? parseFloat(quantityField.value) : Math.round(quantityField.value);
				var measureRatio = isQuantityFloat ? parseFloat(itemData.MEASURE_RATIO) : parseInt(itemData.MEASURE_RATIO);

				var quantity = parseFloat((currentQuantity - measureRatio).toFixed(5));
				quantity = this.getCorrectQuantity(itemData, quantity);

				this.setQuantity(itemData, quantity);
			}
		},

		quantityChange: function () {
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData) {
				var quantityField, quantity;

				quantityField = BX(this.ids.quantity + itemData.ID);
				quantity = this.getCorrectQuantity(itemData, quantityField.value);

				this.setQuantity(itemData, quantity);
			}
		},

		isQuantityFloat: function (item) {
			return this.params.QUANTITY_FLOAT === 'Y' || (parseInt(item.MEASURE_RATIO) !== parseFloat(item.MEASURE_RATIO));
		},

		getCorrectQuantity: function (itemData, quantity) {
			var isQuantityFloat = this.isQuantityFloat(itemData),
				measureRatio = isQuantityFloat ? parseFloat(itemData.MEASURE_RATIO) : parseInt(itemData.MEASURE_RATIO),
				availableQuantity = 0;

			quantity = (isQuantityFloat ? parseFloat(quantity) : parseInt(quantity, 10)) || 0;
			if (quantity < 0) {
				quantity = 0;
			}

			if (measureRatio > 0 && quantity < measureRatio) {
				quantity = measureRatio;
			}

			if (itemData.CHECK_MAX_QUANTITY === 'Y') {

				availableQuantity = isQuantityFloat ? parseFloat(itemData.AVAILABLE_QUANTITY) : parseInt(itemData.AVAILABLE_QUANTITY);
				if (availableQuantity > 0 && quantity > availableQuantity) {
					quantity = availableQuantity;
				}
			}

			var reminder = (quantity / measureRatio - ((quantity / measureRatio).toFixed(0))).toFixed(5),
				remain;

			if (parseFloat(reminder) === 0) {
				return quantity;
			}

			if (measureRatio !== 0 && measureRatio !== 1) {
				remain = (quantity * this.precisionFactor) % (measureRatio * this.precisionFactor) / this.precisionFactor;

				if (measureRatio > 0 && remain > 0) {
					if (
						remain >= measureRatio / 2
						&& (
							availableQuantity === 0
							|| (quantity + measureRatio - remain) <= availableQuantity
						)
					) {
						quantity += (measureRatio - remain);
					}
					else {
						quantity -= remain;
					}
				}
			}

			quantity = isQuantityFloat ? parseFloat(quantity) : parseInt(quantity, 10);

			return quantity;
		},

		setQuantity: function (itemData, quantity) {

			var quantityField = BX(this.ids.quantity + itemData.ID),
				currentQuantity;

			if (quantityField) {
				quantity = parseFloat(quantity);

				currentQuantity = parseFloat(quantityField.getAttribute('data-value'));

				quantityField.value = quantity;

				if (parseFloat(itemData.QUANTITY) !== parseFloat(quantity)) {
					this.animatePriceByQuantity(itemData, quantity);
					this.actionPool.changeQuantity(itemData.ID, quantity, currentQuantity);
				}
			}
		},

		animatePriceByQuantity: function (itemData, quantity) {
			var priceNode = BX(this.ids.sumPrice + itemData.ID);
			if (!BX.type.isDomNode(priceNode))
				return;

			var quantityMultiplier = quantity / parseFloat(itemData.MEASURE_RATIO);

			var startPrice = parseFloat(itemData.SUM_PRICE),
				finalPrice = parseFloat(itemData.PRICE) * quantityMultiplier,
				isInt = parseInt(startPrice) === parseFloat(startPrice)
					&& parseInt(finalPrice) === parseFloat(finalPrice);

			if (startPrice !== finalPrice) {
				this.items[itemData.ID].QUANTITY = quantity;
				this.items[itemData.ID].SUM_PRICE = finalPrice;

				new BX.easing({
					duration: this.params.USE_PRICE_ANIMATION === 'Y' ? this.duration.priceAnimation : 1,
					start: { price: startPrice },
					finish: { price: finalPrice },
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
					step: BX.delegate(function (state) {
						if (!isInt) {
							// fix price blinking
							state.price = (state.price + (state.price % 1000) / 1000).toFixed(5);
						}

						priceNode.innerHTML = this.getFormatPrice(state.price, itemData.CURRENCY);
					}, this),
					complete: BX.delegate(function () {
						var node, price;

						priceNode.innerHTML = this.getFormatPrice(finalPrice, itemData.CURRENCY);

						node = BX(this.ids.sumPriceOld + itemData.ID);
						if (BX.type.isDomNode(node)) {
							price = parseFloat(itemData.FULL_PRICE) * quantityMultiplier;
							node.innerHTML = this.getFormatPrice(price, itemData.CURRENCY);
						}

						node = BX(this.ids.sumPriceDiff + itemData.ID);
						if (BX.type.isDomNode(node)) {
							price = parseFloat(itemData.DISCOUNT_PRICE) * quantityMultiplier;
							node.innerHTML = this.getFormatPrice(price, itemData.CURRENCY);
						}
					}, this)
				}).animate();
			}
		},

		getItemDataByTarget: function (target) {
			var data = false;
			var id;

			var itemNode = BX.findParent(target, { attrs: { 'data-entity': 'basket-item' } });

			if (itemNode) {
				id = itemNode.getAttribute('data-id');
				data = this.items[id];
			}

			return data;
		},

		bindSkuEvents: function (node, data) {
			if (!node || !data)
				return;

			var blocks = this.getEntities(node, 'basket-item-sku-block');
			var blockEntities, i, l, ii, ll;

			for (i = 0, l = blocks.length; i < l; i++) {
				blockEntities = this.getEntities(blocks[i], 'basket-item-sku-field');

				for (ii = 0, ll = blockEntities.length; ii < ll; ii++) {

					if ($(blockEntities[ii]).prop("tagName") === 'INPUT') {
						BX.bind(blockEntities[ii], 'input', BX.proxy(this.changeSku, this));
					}
					else BX.bind(blockEntities[ii], 'click', BX.proxy(this.changeSku, this));
				}
			}
		},

		changeSku: function () {
			var i, l;

			var target = BX.proxy_context;

			if (BX.hasClass(target, 'selected'))
				return;

			var itemData = this.getItemDataByTarget(target);

			if (itemData) {
				var basketItemNode = BX(this.ids.item + itemData.ID);
				if (basketItemNode) {
					var currentSkuListNodes = this.getEntities(target.parentNode, 'basket-item-sku-field');
					for (i = 0, l = currentSkuListNodes.length; i < l; i++) {
						if (currentSkuListNodes[i].isEqualNode(target)) {
							BX.addClass(currentSkuListNodes[i], 'selected');
						}
						else {
							BX.removeClass(currentSkuListNodes[i], 'selected');
						}
					}
					console.log('itemData.ID: ', itemData.ID);
					this.actionPool.changeSku(
						itemData.ID,
						this.getSkuPropertyValues(basketItemNode),
						this.getInitialSkuPropertyValues(basketItemNode)
					);
				}
			}
		},

		getSkuPropertyValues: function (basketItemNode) {
			var propertyValues = {};

			var propNodes = this.getEntities(basketItemNode, 'basket-item-sku-field', '.selected');
			for (var i = 0, l = propNodes.length; i < l; i++) {
				propertyValues[propNodes[i].getAttribute('data-property')] = BX.util.htmlspecialcharsback(propNodes[i].getAttribute('data-value-id'));
			}

			return propertyValues;
		},

		getInitialSkuPropertyValues: function (basketItemNode) {
			var propertyValues = {};

			var propNodes = this.getEntities(basketItemNode, 'basket-item-sku-field', '[data-initial="true"]');
			for (var i = 0, l = propNodes.length; i < l; i++) {
				propertyValues[propNodes[i].getAttribute('data-property')] = BX.util.htmlspecialcharsback(propNodes[i].getAttribute('data-value-id'));
			}

			return propertyValues;
		},

		bindImageEvents: function (node, data) {
			if (!node || !data)
				return;

			var images = node.querySelectorAll('.basket-item-custom-block-photo-item');
			for (var i = 0, l = images.length; i < l; i++) {
				BX.bind(images[i], 'click', BX.proxy(this.showPropertyImagePopup, this));
			}
		},

		showPropertyImagePopup: function () {
			var target, propertyCode, imageIndex, item, imageSrc, i;

			target = BX.proxy_context;
			item = this.getItemDataByTarget(target);

			propertyCode = target.getAttribute('data-column-property-code');
			imageIndex = target.getAttribute('data-image-index');

			if (item && item.COLUMN_LIST) {
				for (i in item.COLUMN_LIST) {
					if (
						item.COLUMN_LIST.hasOwnProperty(i)
						&& item.COLUMN_LIST[i].CODE === propertyCode
						&& item.COLUMN_LIST[i].VALUE[imageIndex]
					) {
						imageSrc = item.COLUMN_LIST[i].VALUE[imageIndex].IMAGE_SRC_ORIGINAL;
						break;
					}
				}
			}

			if (!imageSrc) {
				return;
			}

			if (this.imagePopup) {
				this.imagePopup.destroy();
			}

			var imageId = 'bx-soa-image-popup-content';
			var that = this;

			this.imagePopup = new BX.PopupWindow('bx-soa-image-popup', null, {
				lightShadow: true,
				offsetTop: 0,
				offsetLeft: 0,
				closeIcon: { top: '3px', right: '10px' },
				autoHide: true,
				bindOptions: { position: 'bottom' },
				closeByEsc: true,
				zIndex: 100,
				events: {
					onPopupShow: function () {
						BX.create('IMG', {
							props: { src: imageSrc },
							events: {
								load: function () {
									var content = BX(imageId);
									if (content) {
										var windowSize = BX.GetWindowInnerSize(),
											ratio = that.isMobile ? 0.5 : 0.9,
											contentHeight, contentWidth;

										BX.cleanNode(content);
										content.appendChild(this);

										contentHeight = content.offsetHeight;
										contentWidth = content.offsetWidth;

										if (contentHeight > windowSize.innerHeight * ratio) {
											content.style.height = windowSize.innerHeight * ratio + 'px';
											content.style.width = contentWidth * (windowSize.innerHeight * ratio / contentHeight) + 'px';
											contentHeight = content.offsetHeight;
											contentWidth = content.offsetWidth;
										}

										if (contentWidth > windowSize.innerWidth * ratio) {
											content.style.width = windowSize.innerWidth * ratio + 'px';
											content.style.height = contentHeight * (windowSize.innerWidth * ratio / contentWidth) + 'px';
										}

										content.style.height = content.offsetHeight + 'px';
										content.style.width = content.offsetWidth + 'px';

										that.imagePopup.adjustPosition();
									}
								}
							}
						});
					},
					onPopupClose: function () {
						this.destroy();
					}
				},
				content: BX.create('DIV', { props: { id: imageId } })
			});
			this.imagePopup.show();
		},

		bindActionEvents: function (node, data) {
			if (!node || !data)
				return;

			var entity;
			if (BX.util.in_array('WISHLIST', this.params.COLUMNS_LIST)) {
				entity = this.getEntities(node, 'basket-item-wishlist');
				for (var i = 0, l = entity.length; i < l; i++) {
					BX.bind(entity[i], 'click', BX.proxy(this.wishlistAction, this));
				}
			}

			if (BX.util.in_array('DELETE', this.params.COLUMNS_LIST)) {
				entity = this.getEntities(node, 'basket-item-delete');
				for (var i = 0, l = entity.length; i < l; i++) {
					BX.bind(entity[i], 'click', BX.proxy(this.deleteAction, this));
				}
			}

			if (BX.util.in_array('DELAY', this.params.COLUMNS_LIST)) {
				entity = this.getEntity(node, 'basket-item-add-delayed');
				BX.bind(entity, 'click', BX.proxy(this.addDelayedAction, this));
			}

			entity = this.getEntity(node, 'basket-item-remove-delayed');
			BX.bind(entity, 'click', BX.proxy(this.removeDelayedAction, this));

			entity = this.getEntity(node, 'basket-item-merge-sku-link');
			BX.bind(entity, 'click', BX.proxy(this.mergeAction, this));

			entity = this.getEntity(node, 'basket-item-show-similar-link');
			BX.bind(entity, 'click', BX.delegate(function () { this.toggleFilter('similar'); }, this));
		},

		wishlistAction: function (itemID = 0, node= false) {
			if(itemID > 0)
				var itemData = this.items[itemID], entity = node;
			else
				var itemData = this.getItemDataByTarget(BX.proxy_context), entity = BX.proxy_context;
			if (itemData) {
				var productId = itemData.ID_REAL, action = '';
				if(productId){
					if(ym)
						ym(46201080,'reachGoal','click_favorite');
					var favoritesIds = {};
					if (document.cookie.includes('favorites')) {
						favoritesIds = this.getCookie('favorites');
						favoritesIds = JSON.parse(favoritesIds);
						if (!favoritesIds.includes(productId.toString())) { //ad
							favoritesIds.push(productId.toString());
							action = 'add';
						} else { // remove
							favoritesIds.forEach((item, index, array) => {
								if (item === productId.toString()) 
									favoritesIds.splice(index, 1);											   
							});	
							action = 'remove';		
						}
					} else { //add always
						var favoritesIds = [productId.toString()];
						action = 'add';
					}	
					if(action == 'add')	{
						entity.querySelector('[data-wishlist="false"]').hidden = true;
						entity.querySelector('[data-wishlist="true"]').hidden = false;
					} else {
						entity.querySelector('[data-wishlist="false"]').hidden = false;
						entity.querySelector('[data-wishlist="true"]').hidden = true;
					}	
					var favoritesIdsJson = JSON.stringify(favoritesIds);
					document.cookie = 'favorites=' + favoritesIdsJson + '; max-age=864000; path=/';
					this.setWishlistHeader(favoritesIds);				
				}
			}
		},

		setWishlistHeader: function (favoritesIds = 0) {
			const favoritesCount = favoritesIds?.length;
			const elements = document.querySelectorAll('.js-favorites-count');
			if(elements.length > 0)
				elements.forEach(element => {
				element.textContent = favoritesCount;
				});
		},

		deleteAction: function () {
			var itemData = this.getItemDataByTarget(BX.proxy_context);

			if (itemData) {
				this.actionPool.deleteItem(itemData.ID);

				this.items[itemData.ID].SHOW_LOADING = true;

				if (this.params.SHOW_RESTORE === 'Y' && this.isItemAvailable(itemData.ID)) {
					this.items[itemData.ID].SHOW_RESTORE = true;
				}

				this.redrawBasketItemNode(itemData.ID);
				this.checkSimilar(itemData);
			}
		},

		addDelayedAction: function () {
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData) {
				this.actionPool.addDelayed(itemData.ID);

				this.items[itemData.ID].SHOW_LOADING = true;
				this.redrawBasketItemNode(itemData.ID);
			}
		},

		removeDelayedAction: function () {
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData) {
				this.actionPool.removeDelayed(itemData.ID);

				this.items[itemData.ID].SHOW_LOADING = true;
				this.redrawBasketItemNode(itemData.ID);
			}
		},

		mergeAction: function () {
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData) {
				this.actionPool.mergeSku(itemData.ID);
			}
		},

		bindRestoreAction: function (node, itemData) {
			if (!node || !itemData || this.params.SHOW_RESTORE !== 'Y')
				return;
			BX.bind(
				this.getEntity(node, 'basket-item-restore-button'),
				'click',
				BX.delegate(function () {
					var timerId = node && node.dataset ? node.dataset.timerId : null;
					if (timerId) {
						this.clearDeleteInterval(timerId);
					}
					let target = BX.proxy_context;
					if (target.closest('[is-string-high]')) {
						this.highAddAction(target.closest('[is-string-high]'));
						this.items[itemData.ID].SHOW_RESTORE = false;
						this.items[itemData.ID].SHOW_LOADING = true;
					} else {
						this.actionPool.restoreItem(itemData.ID, {
							PRODUCT_ID: itemData.PRODUCT_ID,
							QUANTITY: itemData.QUANTITY,
							PROPS: itemData.PROPS_ALL,
							SORT: itemData.SORT,
							MODULE: itemData.MODULE,
							PRODUCT_PROVIDER_CLASS: itemData.PRODUCT_PROVIDER_CLASS
						});

						if (!this.items || !this.items[itemData.ID]) {
							return;
						}
						this.items[itemData.ID].SHOW_RESTORE = false;
						this.items[itemData.ID].SHOW_LOADING = true;
						this.redrawBasketItemNode(itemData.ID, "restore");
					}
				}, this)
			);
			BX.bind(
				this.getEntity(node, 'basket-item-close-restore-button'),
				'click',
				BX.delegate(function () {
					this.deleteBasketItem(itemData.ID, false, true);
				}, this)
			);
			BX.bind(
				this.getEntity(node, 'basket-item-wishlist'),
				'click',
				BX.delegate(function () {
					this.wishlistAction(itemData.ID, this.getEntity(node, 'basket-item-wishlist'));
				}, this)
			);
		},

		startDeleteInterval: function (node) {
			if (!node) {
				return;
			}
			this.deleteDelay = null;
			BX.delegate(function () {
				var prevTimerId = node && node.dataset ? node.dataset.timerId : null;

				if (prevTimerId && this.deleteTimer && this.deleteTimer[prevTimerId]) {
					return;
				}

				var timerId = prevTimerId || ('timer_' + Date.now() + '_' + Math.random());
				var $timerValue = node.querySelector ? node.querySelector('[data-table-item-timer]') : null;
				var $progressCircle = node.querySelector ? node.querySelector('.timer-progress-circle') : null;
				var totalSeconds = 10;
				var radius = 10;
				var circumference = 2 * Math.PI * radius; // 62.83
				var secondsLeft = totalSeconds;

				if (!$timerValue) {
					return;
				}

				if (!$progressCircle) {
					$timerValue.innerHTML = '<svg class="timer-progress-circle" viewBox="0 0 24 24"><circle class="timer-progress-bg" cx="12" cy="12" r="10"></circle><circle class="timer-progress-bar" style="stroke-dashoffset: ' + circumference + ';" cx="12" cy="12" r="10"></circle><text class="timer-progress-text" data-timer-counter x="12" y="16" text-anchor="middle">10</text></svg>';
				}

				var $progressBar = $timerValue.querySelector ? $timerValue.querySelector('.timer-progress-bar') : null;
				var $progressText = $timerValue.querySelector ? $timerValue.querySelector('.timer-progress-text') : null;
				
				if (!$progressBar || !$progressText) {
					return;
				}

				var getRowToRemove = () => {
					if (!node || !node.closest) {
						return node;
					}
					return node.closest('.new-cart-table-item-deleterow')
						|| node.closest('[data-entity="basket-item"]')
						|| node.closest('.new-cart-table-item-row')
						|| node;
				};

				var updateTimer = () => {
					if (!node || (node.isConnected === false)) {
						this.clearDeleteInterval(timerId);
						return;
					}
					var progress = (totalSeconds - secondsLeft) / totalSeconds;
					var offset = circumference * (1 - progress);

					$progressBar.style.strokeDashoffset = offset;
					$progressText.innerHTML = secondsLeft;

					if (secondsLeft <= 0) {
						this.clearDeleteInterval(timerId);
						if (node && node.dataset && node.dataset.timerId === timerId) {
							delete node.dataset.timerId;
						}
						var rowToRemove = getRowToRemove();

						if (rowToRemove && rowToRemove.remove) {
							rowToRemove.remove();
						}

						return;
					}
					secondsLeft--;
				};
				updateTimer();
				this.deleteTimer[timerId] = setInterval(updateTimer, 1000);
				node.dataset.timerId = timerId;
			}, this)();
		},

		clearDeleteInterval: function (timerId) {
			clearTimeout(this.deleteDelay);

			if (timerId) {
				if (this.deleteTimer && this.deleteTimer[timerId]) {
					clearInterval(this.deleteTimer[timerId]);
					delete this.deleteTimer[timerId];
				}
				return;
			}

			if (this.deleteTimer) {
				for (var id in this.deleteTimer) {
					if (this.deleteTimer.hasOwnProperty(id)) {
						clearInterval(this.deleteTimer[id]);
					}
				}
			}
			this.deleteTimer = {};
		},

		bindItemWarningEvents: function (node, data) {
			if (!node || !data)
				return;

			BX.bind(
				this.getEntity(BX(this.ids.item + data.ID), 'basket-item-warning-close'),
				'click',
				BX.proxy(this.closeItemWarnings, this)
			);
		},

		closeItemWarnings: function () {
			var target = BX.proxy_context;

			if (BX.type.isDomNode(target)) {
				var itemData = this.getItemDataByTarget(target);

				this.items[itemData.ID].WARNINGS = [];
				this.warningItems.splice(BX.util.array_search(itemData.ID, this.warningItems), 1);

				this.redrawBasketItemNode(itemData.ID);
				this.editWarnings();
			}
		},

		renderBasketItem: function (template, data) {
			var clonedData = BX.clone(data);

			if (BX.type.isPlainObject(clonedData)) {
				clonedData.USE_FILTER = this.useItemsFilter
					&& !this.filter.currentFilter.similarHash.length;
			}

			return Mustache.render(template, clonedData);
		},

		render: function (template, data) {
			return Mustache.render(template, data);
		},

		checkAnalytics: function (data) {
			if (!data || !data.basket)
				return;

			var itemId, itemsDiff = {};

			for (var i in data.basket) {
				if (data.basket.hasOwnProperty(i)) {
					if (i.indexOf('QUANTITY_') >= 0) {
						itemId = i.substr(9);

						if (this.items[itemId]) {
							itemsDiff[itemId] = parseFloat(data.basket[i]) - parseFloat(BX(this.ids.quantity + itemId).getAttribute('data-value'));
						}
					}
					else if (i.indexOf('DELETE_') >= 0) {
						itemId = i.substr(7);

						if (this.items[itemId]) {
							itemsDiff[itemId] = -parseFloat(this.items[itemId].QUANTITY);
						}
					}
					else if (i.indexOf('RESTORE_') >= 0) {
						itemId = i.substr(8);

						if (this.items[itemId]) {
							itemsDiff[itemId] = parseFloat(this.items[itemId].QUANTITY);
						}
					}
				}
			}

			this.setAnalyticsDataLayer(itemsDiff);
		},

		setAnalyticsDataLayer: function (itemsDiff) {
			if (!itemsDiff || Object.keys(itemsDiff).length === 0)
				return;

			window[this.params.DATA_LAYER_NAME] = window[this.params.DATA_LAYER_NAME] || [];

			var plus = [], minus = [];

			for (var itemId in itemsDiff) {
				if (itemsDiff.hasOwnProperty(itemId)) {
					if (itemsDiff[itemId] > 0) {
						plus.push(this.getItemAnalyticsInfo(itemId, itemsDiff[itemId]));
					}
					else if (itemsDiff[itemId] < 0) {
						minus.push(this.getItemAnalyticsInfo(itemId, itemsDiff[itemId]));
					}
				}
			}

			if (plus.length) {
				window[this.params.DATA_LAYER_NAME].push({
					event: 'addToCart',
					ecommerce: {
						currencyCode: this.items[itemId].CURRENCY || '',
						add: {
							products: plus
						}
					}
				});
			}

			if (minus.length) {
				window[this.params.DATA_LAYER_NAME].push({
					event: 'removeFromCart',
					ecommerce: {
						currencyCode: this.items[itemId].CURRENCY || '',
						remove: {
							products: minus
						}
					}
				});
			}
		},

		getItemAnalyticsInfo: function (itemId, diff) {
			if (!this.items[itemId])
				return {};

			var brand = (this.items[itemId].BRAND || '').split(',  ').join('/');
			var variants = [];

			var selectedSku = this.getEntities(BX(this.ids.item + itemId), 'basket-item-sku-field', '.selected');
			for (var i = 0, l = selectedSku.length; i < l; i++) {
				variants.push(selectedSku[i].getAttribute('data-sku-name'));
			}

			return {
				'name': this.items[itemId].NAME || '',
				'id': this.items[itemId].PRODUCT_ID || '',
				'price': this.items[itemId].PRICE || 0,
				'brand': brand,
				'variant': variants.join('/'),
				'quantity': Math.abs(diff)
			};
		},
		createStringHigh: function (itemId) {
			if (!this.items[itemId]) {
				return;
			}
			var basketItemTemplate = this.getTemplate('basket-string-high-template');
			if (basketItemTemplate) {
				var basketItemHtml = this.renderBasketItem(basketItemTemplate, this.items[itemId]);
				if (BX(this.ids.item + itemId)) {
					BX(this.ids.item + itemId).insertAdjacentHTML('afterend', basketItemHtml);
					this.bindStringHighEvents(itemId);
				}
			}
		},
		bindStringHighEvents: function (itemId) {
			let sh = BX("basket-string-" + itemId);
			if (!sh)
				return;

			BX.bind(sh.querySelector("[data-high-hide]"), 'click', BX.proxy(this.highHide, this));
			BX.bind(sh.querySelector("[data-high-add]"), 'click', BX.proxy(this.highAdd, this));
		},
		highAddAction: function (itemData) {
			if (!itemData)
				return;
			let action = '/ajax/add2basketNew.php',
				data = {
					"ajax_basket": "Y",
					"product_id": itemData.dataset.highParent,
					"product_basket_id": itemData.dataset.highParentBasketId,
					"action": "add",
					"string_id": itemData.dataset.string,
					"string_high": itemData.dataset.stringHigh,
					"quantity": itemData.dataset.highParentQuantity,
					"basket_props": itemData.dataset.highParentSku_props,
					"prop[]": 0,
				};
			BX.ajax({
				url: action,
				data: data,
				method: 'POST',
				dataType: 'json',
				timeout: 30,
				async: true,
				processData: true,
				scriptsRunFirst: true,
				emulateOnload: true,
				start: true,
				cache: false,
				onsuccess: BX.delegate(function (result) {
					this.sendRequest('refreshAjax', {
						fullRecalculation: 'Y'
					});
					itemData?.remove();
				}, this),
				onfailure: BX.delegate(function () {
					this.actionPool.doProcessing(false);
				}, this)
			});
		},
		highAdd: function (el = false) {
			let itemData = BX.proxy_context;
			this.highAddAction(itemData.closest('[data-entity="basket-item-string-high"]'));
		},
		highHide: function () {
			let itemData = BX.proxy_context;
			if (itemData)
				itemData.closest('[data-entity="basket-item-string-high"]').style.display = 'none';
		},
	};
})();