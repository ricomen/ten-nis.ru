/* global BX */
;(function () {
	'use strict';

	function ensureDeleteTimerIsObject(component) {
		if (!component.deleteTimer || typeof component.deleteTimer !== 'object') {
			component.deleteTimer = {};
		}
	}

	function patchStartDeleteIntervalForDemo(component) {
		// Demo-safe patch: keep behavior, but avoid ReferenceError on $originalRow/$deleteRow.
		// If you already fixed these in `component.js`, this wrapper is effectively redundant.
		var original = component.startDeleteInterval;
		if (typeof original !== 'function') return;

		component.startDeleteInterval = function (node) {
			ensureDeleteTimerIsObject(component);

			// Provide demo fallback for rows removal.
			window.$originalRow = window.$originalRow || null;
			window.$deleteRow = window.$deleteRow || null;

			return original.call(component, node);
		};
	}

	document.addEventListener('DOMContentLoaded', function () {
		if (!BX || !BX.Sale || !BX.Sale.BasketComponent) {
			// eslint-disable-next-line no-console
			console.error('BX.Sale.BasketComponent not found. component.js failed to load.');
			return;
		}

		var component = BX.Sale.BasketComponent;
		if (typeof component.initializePrimaryFields === 'function') {
			component.initializePrimaryFields();
		}

		ensureDeleteTimerIsObject(component);
		patchStartDeleteIntervalForDemo(component);

		var node = document.getElementById('basket-item-height-aligner-demo');
		var startBtn = document.getElementById('btnStart');
		var stopBtn = document.getElementById('btnStop');

		if (startBtn) {
			startBtn.addEventListener('click', function () {
				if (typeof component.startDeleteInterval === 'function') {
					component.startDeleteInterval(node);
				}
			});
		}

		if (stopBtn) {
			stopBtn.addEventListener('click', function () {
				if (typeof component.clearDeleteInterval === 'function') {
					component.clearDeleteInterval();
				}
			});
		}
	});
})();

