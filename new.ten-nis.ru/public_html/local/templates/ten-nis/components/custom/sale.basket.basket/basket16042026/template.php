<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main;
use Bitrix\Main\Localization\Loc;

\Bitrix\Main\UI\Extension::load(["ui.fonts.ruble", "ui.fonts.opensans"]);

$documentRoot = Main\Application::getDocumentRoot();

$flagOpt = $GLOBALS['flagOpt'];

$arParams['SHOW_FILTER'] = 'N';

\CJSCore::Init(array('fx', 'popup', 'ajax'));
Main\UI\Extension::load(['ui.mustache']);

$this->addExternalJs($templateFolder . '/js/action-pool.js');
$this->addExternalJs($templateFolder . '/js/filter.js');
$this->addExternalJs($templateFolder . '/js/component.js');

$mobileColumns = isset($arParams['COLUMNS_LIST_MOBILE'])
	? $arParams['COLUMNS_LIST_MOBILE']
	: $arParams['COLUMNS_LIST'];
$mobileColumns = array_fill_keys($mobileColumns, true);

$jsTemplates = new Main\IO\Directory($documentRoot . $templateFolder . '/js-templates');
/** @var Main\IO\File $jsTemplate */
foreach ($jsTemplates->getChildren() as $jsTemplate) {
	if ($jsTemplate->getExtension() == "php")
		include($jsTemplate->getPath());
}


$arParamsCatalog = array_merge(array(
	"IBLOCK_TYPE" => "catalog",
	"IBLOCK_ID" => CATALOG_IBLOCK_ID,
	"HIDE_NOT_AVAILABLE" => "L",
	"HIDE_NOT_AVAILABLE_OFFERS" => "L",
	"TEMPLATE_THEME" => "blue",
	"ADD_PICT_PROP" => "-",
	"PRODUCT_DISPLAY_MODE" => "Y",
	"LABEL_PROP" => array(),
	"COMMON_SHOW_CLOSE_POPUP" => "N",
	"PRODUCT_SUBSCRIPTION" => "Y",
	"SHOW_DISCOUNT_PERCENT" => "N",
	"SHOW_OLD_PRICE" => "Y",
	"SHOW_MAX_QUANTITY" => "N",
	"MESS_BTN_BUY" => "Купить",
	"MESS_BTN_ADD_TO_BASKET" => "В корзину",
	"MESS_BTN_COMPARE" => "Сравнение",
	"COMPARE_NAME" => "CATALOG_COMPARE_LIST",
	"MESS_BTN_DETAIL" => "Подробнее",
	"MESS_NOT_AVAILABLE" => "Нет в наличии",
	"MESS_NOT_AVAILABLE_SERVICE" => "Недоступно",
	"MESS_BTN_SUBSCRIBE" => "Подписаться",
	"SIDEBAR_SECTION_SHOW" => "Y",
	"SIDEBAR_DETAIL_SHOW" => "N",
	"SIDEBAR_PATH" => "",
	"SEF_MODE" => "Y",
	"CACHE_TYPE" => "A",
	"CACHE_TIME" => "36000000",
	"CACHE_FILTER" => "N",
	"CACHE_GROUPS" => "N",
	"USE_MAIN_ELEMENT_SECTION" => "Y",
	"DETAIL_STRICT_SECTION_CHECK" => "Y",
	"SET_LAST_MODIFIED" => "N",
	"SET_TITLE" => "Y",
	"ADD_SECTIONS_CHAIN" => "Y",
	"ADD_ELEMENT_CHAIN" => "Y",
	"USE_SALE_BESTSELLERS" => "N",
	"INSTANT_RELOAD" => "N",
	"USE_REVIEW" => "N",
	"ACTION_VARIABLE" => "action",
	"PRODUCT_ID_VARIABLE" => "id",
	"USE_COMPARE" => "Y",
	"PRICE_CODE" => defined('PRICE_CODE') && is_array(PRICE_CODE) ? PRICE_CODE : ['BASE'],
	"USE_PRICE_COUNT" => "N",
	"SHOW_PRICE_COUNT" => "1",
	"PRICE_VAT_INCLUDE" => "Y",
	"PRICE_VAT_SHOW_VALUE" => "N",
	"CONVERT_CURRENCY" => "N",
	"BASKET_URL" => "/basket/",
	'BASKET_ADD_URL' => '/ajax/add2basketNew.php',
	"USE_PRODUCT_QUANTITY" => "Y",
	"PRODUCT_QUANTITY_VARIABLE" => "quantity",
	"ADD_PROPERTIES_TO_BASKET" => "Y",
	"PRODUCT_PROPS_VARIABLE" => "prop",
	"PARTIAL_PRODUCT_PROPERTIES" => "N",
	"USE_COMMON_SETTINGS_BASKET_POPUP" => "N",
	"COMMON_ADD_TO_BASKET_ACTION" => "ADD",
	"TOP_ADD_TO_BASKET_ACTION" => "ADD",
	"SECTION_ADD_TO_BASKET_ACTION" => "ADD",
	"DETAIL_ADD_TO_BASKET_ACTION" => array(
		0 => "BUY",
	),
	"DETAIL_ADD_TO_BASKET_ACTION_PRIMARY" => array(
		0 => "BUY",
	),
	"SECTION_COUNT_ELEMENTS" => "N",
	"SECTION_TOP_DEPTH" => "10",
	"SECTIONS_VIEW_MODE" => "LIST",
	"SECTIONS_SHOW_PARENT_NAME" => "Y",
	"ELEMENT_SORT_FIELD" => "CATALOG_AVAILABLE",
	"ELEMENT_SORT_ORDER" => "DESC",
	"ELEMENT_SORT_FIELD2" => "PROPERTY_MAX_PRICE",
	"ELEMENT_SORT_ORDER2" => "DESC",
	"INCLUDE_SUBSECTIONS" => "Y",
	"LIST_META_KEYWORDS" => "-",
	"LIST_META_DESCRIPTION" => "-",
	"LIST_BROWSER_TITLE" => "-",
	"SECTION_BACKGROUND_IMAGE" => "-",
	"LIST_PRODUCT_BLOCKS_ORDER" => "price,props,sku,quantityLimit,quantity,buttons",
	"LIST_PRODUCT_ROW_VARIANTS" => "[{'VARIANT':'0','BIG_DATA':false},{'VARIANT':'0','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false}]",
	"LIST_ENLARGE_PRODUCT" => "STRICT",
	"LIST_SHOW_SLIDER" => "Y",
	"LIST_SLIDER_INTERVAL" => "3000",
	"LIST_SLIDER_PROGRESS" => "N",
	"DETAIL_META_KEYWORDS" => "-",
	"DETAIL_META_DESCRIPTION" => "-",
	"DETAIL_BROWSER_TITLE" => "-",
	"DETAIL_SET_CANONICAL_URL" => "N",
	"SECTION_ID_VARIABLE" => "SECTION_ID",
	"DETAIL_CHECK_SECTION_ID_VARIABLE" => "N",
	"DETAIL_BACKGROUND_IMAGE" => "-",
	"SHOW_DEACTIVATED" => "N",
	"SHOW_SKU_DESCRIPTION" => "N",
	"DETAIL_USE_VOTE_RATING" => "N",
	"DETAIL_USE_COMMENTS" => "N",
	"DETAIL_BRAND_USE" => "N",
	"DETAIL_DISPLAY_NAME" => "Y",
	"DETAIL_IMAGE_RESOLUTION" => "16by9",
	"DETAIL_PRODUCT_INFO_BLOCK_ORDER" => "sku,props",
	"DETAIL_PRODUCT_PAY_BLOCK_ORDER" => "rating,price,priceRanges,quantityLimit,quantity,buttons",
	"DETAIL_SHOW_SLIDER" => "N",
	"DETAIL_DETAIL_PICTURE_MODE" => array(
		0 => "POPUP",
		1 => "MAGNIFIER",
	),
	"DETAIL_ADD_DETAIL_TO_SLIDER" => "N",
	"DETAIL_DISPLAY_PREVIEW_TEXT_MODE" => "E",
	"MESS_PRICE_RANGES_TITLE" => "Цены",
	"MESS_DESCRIPTION_TAB" => "Описание",
	"MESS_PROPERTIES_TAB" => "Характеристики",
	"MESS_COMMENTS_TAB" => "Комментарии",
	"DETAIL_SHOW_POPULAR" => "Y",
	"DETAIL_SHOW_VIEWED" => "Y",
	"LINK_IBLOCK_TYPE" => "",
	"LINK_IBLOCK_ID" => "",
	"LINK_PROPERTY_SID" => "",
	"LINK_ELEMENTS_URL" => "link.php?PARENT_ELEMENT_ID=#ELEMENT_ID#",
	"USE_STORE" => "N",
	"USE_BIG_DATA" => "N",
	"BIG_DATA_RCM_TYPE" => "personal",
	"USE_ENHANCED_ECOMMERCE" => "N",
	"PAGER_TEMPLATE" => "show_more",
	"DISPLAY_TOP_PAGER" => "N",
	"DISPLAY_BOTTOM_PAGER" => "Y",
	"PAGER_TITLE" => "Товары",
	"PAGER_SHOW_ALWAYS" => "N",
	"PAGER_DESC_NUMBERING" => "N",
	"PAGER_DESC_NUMBERING_CACHE_TIME" => "3600",
	"PAGER_SHOW_ALL" => "N",
	"PAGER_BASE_LINK_ENABLE" => "N",
	"LAZY_LOAD" => "N",
	"MESS_BTN_LAZY_LOAD" => "Показать ещё",
	"LOAD_ON_SCROLL" => "N",
	"MESSAGE_404" => "",
	"COMPATIBLE_MODE" => "Y",
	"USE_ELEMENT_COUNTER" => "Y",
	"DISABLE_INIT_JS_IN_COMPONENT" => "N",
	"DETAIL_SET_VIEWED_IN_COMPONENT" => "N",
	"SEF_FOLDER" => "/catalog/",
	"TOP_PRODUCT_BLOCKS_ORDER" => "price,props,sku,quantityLimit,quantity,buttons",
	"TOP_PRODUCT_ROW_VARIANTS" => "[{'VARIANT':'3','BIG_DATA':false},{'VARIANT':'3','BIG_DATA':false},{'VARIANT':'3','BIG_DATA':false},{'VARIANT':'3','BIG_DATA':false},{'VARIANT':'3','BIG_DATA':false}]",
	"TOP_ENLARGE_PRODUCT" => "STRICT",
	"TOP_SHOW_SLIDER" => "Y",
	"TOP_SLIDER_INTERVAL" => "3000",
	"TOP_SLIDER_PROGRESS" => "N",
	"LIST_PROPERTY_CODE" => array(
		0 => "MORE_PHOTO",
	),
	"LIST_PROPERTY_CODE_MOBILE" => array(),
	"DETAIL_MAIN_BLOCK_PROPERTY_CODE" => array(),
	"OFFER_ADD_PICT_PROP" => "-",
	"TOP_OFFERS_FIELD_CODE" => array(
		0 => "",
		1 => "",
	),
	"TOP_OFFERS_LIMIT" => "0",
	"LIST_OFFERS_FIELD_CODE" => array(
		1 => "SORT",
		2 => "ID"
	),
	"LIST_OFFERS_LIMIT" => "5",
	"DETAIL_OFFERS_FIELD_CODE" => array(
		0 => "SORT",
		1 => "VIEW",
	),
	"DETAIL_PROPERTY_CODE" => array(
		0 => "VIEW",
		1 => "COLOR",
		2 => "EFFECTS",
		3 => "PLOTNOST",
		4 => "VISCOSITY",
		5 => "FASOVKA",
		6 => "OBEM",
		7 => "ARTNUMBER",
		8 => "LINKED_ITEMS"
	),
	"OFFERS_SORT_FIELD" => "sort",
	"OFFERS_SORT_ORDER" => "ASC",
	"OFFERS_SORT_FIELD2" => "name",
	"OFFERS_SORT_ORDER2" => "ASC",
	"SITE_ID" => SITE_ID,
	"FILTER_NAME" => "",
	"FILTER_FIELD_CODE" => array(
		0 => "",
		1 => "",
	),
	"FILTER_PROPERTY_CODE" => array(
		0 => "SALES",
		1 => "",
	),
	"FILTER_PRICE_CODE" => array(
		0 => "BASE",
	),
	"FILTER_OFFERS_FIELD_CODE" => array(
		0 => "",
		1 => "",
	),
	"FILTER_OFFERS_PROPERTY_CODE" => array(
		0 => "",
		1 => "",
	),
	"COMPARE_FIELD_CODE" => array(
		0 => "ID",
		1 => "CODE",
		2 => "NAME",
		3 => "PREVIEW_PICTURE",
		4 => "DETAIL_PICTURE",
		5 => "",
	),
	"COMPARE_OFFERS_FIELD_CODE" => array(
		0 => "",
		1 => "",
	),
	"COMPARE_ELEMENT_SORT_FIELD" => "sort",
	"COMPARE_ELEMENT_SORT_ORDER" => "asc",
	"DISPLAY_ELEMENT_SELECT_BOX" => "N",
	"COMPARE_POSITION_FIXED" => "Y",
	"COMPARE_POSITION" => "top left",
	"DETAIL_MAIN_BLOCK_OFFERS_PROPERTY_CODE" => array(),
	"FILE_404" => "",
	"SEF_URL_TEMPLATES" => array(
		"sections" => "",
		"section" => "#SECTION_CODE_PATH#/",
		"element" => "#SECTION_CODE_PATH#/#ELEMENT_ID#/",
		"compare" => "compare/?action=#ACTION_CODE#",
		"smart_filter" => "#SECTION_CODE_PATH#/filter/#SMART_FILTER_PATH#/apply/",
	),
	"VARIABLE_ALIASES" => array(
		"compare" => array(
			"ACTION_CODE" => "action",
		),
	)
), $arParams);
?>

<div id="basket-content">
	<div class="cont <? if ($arParams["HIDE"] ?? "") echo "hiddenfromMakeOrder" ?>" <? if ($arParams["HIDE"] ?? "") echo "hidden" ?> id="basket-root" >
		<?/*?><div class="basket-alert">
		<div class="basket-alert-timer">
			<div class="circle"></div>
			<div class="seconds"></div>
		</div>
		<p>Товар удалён</p>
		<a href="#">Отменить</a>
	</div>
<?*/ ?>
		<? if (empty($arResult['ERROR_MESSAGE'])) : ?>
			<div class="catalog-title">
				<h1>
					Товары в корзине
				</h1>
			</div>
			<div class="bx-basket cart">
				<div class="row" hidden>
					<div class="col-xs-12">
						<div class="alert alert-warning alert-dismissable" id="basket-warning" style="display: none;">
							<span class="close" data-entity="basket-items-warning-notification-close">&times;</span>
							<div data-entity="basket-general-warnings"></div>
							<div data-entity="basket-item-warnings">
								<?= Loc::getMessage('SBB_BASKET_ITEM_WARNING') ?>
							</div>
						</div>
					</div>
				</div>
				<? $APPLICATION->IncludeComponent(
					"bitrix:main.include",
					"",
					array(
						"AREA_FILE_SHOW" => "file",
						"PATH" => "/include/cart/data-new-cart-top.php"
					)
				); ?>
				<div id="basket-item-list">
					<div class="new-cart-table" data-table id="basket-item-table">
						<div class="new-cart-table-top">
							<label class="new-cart-table-top__select-all" data-table-select-all>
								<input type="checkbox" value="select-all" name="select-all">
								<span>Выбрать все</span>
							</label>
							<div class="new-cart-table-top__selector select-block">
								<div class="catalog__filter-block-head select-head">
									<div class="catalog__filter-block-head-arrow">
										<svg width="11" height="6" viewBox="0 0 11 6" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M1.04541 1L5.22723 5L9.40905 1" stroke="#BDBDBD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</div>
									<div class="catalog__filter-block-head-side select-side">
										<div class="catalog__filter-block-head-value select-value_n">
											Действия
										</div>
									</div>
								</div>
								<div class="catalog__filter-block-body select-body" data-change-selector>
									<div class="catalog__filter-block-body-list">
										<div class="catalog__filter-block-option select-option" data-change="Добавить в избранное">
											<input id="se-1" value="Добавить в избранное" name="Действия" type="radio" class="catalog__filter-block-option-input">
											<label for="s12" class="catalog__filter-block-option-text">
												<img src="<?= SITE_TEMPLATE_PATH ?>/img/new_cart/select-icon-1.svg" alt="">
												Добавить в избранное
											</label>
										</div>
										<div class="catalog__filter-block-option select-option " data-change="Поделиться товарами">
											<input id="se-2" value="Поделиться товарами" name="Действия" type="radio" class="catalog__filter-block-option-input">
											<label for="s22" class="catalog__filter-block-option-text">
												<img src="<?= SITE_TEMPLATE_PATH ?>/img/new_cart/select-icon-2.svg" alt="">
												Поделиться товарами
											</label>
										</div>
										<div class="catalog__filter-block-option select-option " data-change="Удалить из корзины">
											<input id="se-3" value="Удалить из ко
                                            color: #F00;рзины" name="Действия" type="radio" class="catalog__filter-block-option-input">
											<label for="s32" class="catalog__filter-block-option-text">
												<img src="<?= SITE_TEMPLATE_PATH ?>/img/new_cart/select-icon-3.svg" alt="">
												Удалить из корзины
											</label>
										</div>
									</div>
								</div>
							</div>
							<div class="new-cart-top__right">
								<p>Поделиться корзиной:</p>
								<a href="javascript:void(0)">
									<img src="<?= SITE_TEMPLATE_PATH ?>/img/new_cart/table-top-icon-1.svg" alt="">
								</a>
								<a href="javascript:void(0)">
									<img src="<?= SITE_TEMPLATE_PATH ?>/img/new_cart/table-top-icon-2.svg" alt="">
								</a>
								<a href="javascript:void(0)">
									<img src="<?= SITE_TEMPLATE_PATH ?>/img/new_cart/table-top-icon-3.svg" alt="">
								</a>
							</div>
						</div>
						<div class="new-cart-table-top-row" data-table-head>
							<div class="new-cart-table-top-row__item" data-table-col-head="checkbox" style="opacity: 0;">
								<img src="<?= SITE_TEMPLATE_PATH ?>/img/new_cart/check.svg" alt="">
							</div>
							<div class="new-cart-table-top-row__item" data-table-col-head="img">
								Фото
							</div>
							<div class="new-cart-table-top-row__item" data-table-col-head="name">
								Наименование товара
							</div>
							<div class="new-cart-table-top-row__item" data-table-col-head="sku">
								Размер
							</div>
							<div class="new-cart-table-top-row__item" data-table-col-head="price">
								Цена
							</div>
							<div class="new-cart-table-top-row__item" data-table-col-head="counter">
								Количество
							</div>
							<div class="new-cart-table-top-row__item" data-table-col-head="sum">
								Сумма
							</div>
							<div class="new-cart-table-top-row__item" data-table-col-head="delete">
								Удалить
							</div>
						</div>

					</div>
				</div>
			</div>

			<div class="main-page__text">
				<div class="main-page__text-head site__h2 ta-l">
					Мелочи, которые никогда не будут лишними
				</div>
				<div class="main-page__text-body">
					<div class="products-mini">
						<div class="product-item-mini__helper">
							<div class="product-item-mini__item">
								<div class="product-item-mini__side">
									<a href="#" class="product-item-mini__img">
										<img src="<?= SITE_TEMPLATE_PATH ?>/img/product_mini1.png" alt="">
									</a>
									<div class="product-item-mini__logo">
										<img src="<?= SITE_TEMPLATE_PATH ?>/img/mplook7.png" alt="">
									</div>
								</div>
								<div class="product-item-mini__main">
									<a href="#" class="product-item-mini__title">
										Платье FortyLove С шортами и сеткой W (Белый)
									</a>
									<div class="product-item-mini__info">
										<div class="product-item-mini__price">
											14 700 ₽
										</div>
										<a href="#" class="product-item-mini__btn btn-type-1">
											Добавить в заказ
										</a>
									</div>
								</div>
							</div>
						</div>
						<div class="product-item-mini__helper">
							<div class="product-item-mini__item">
								<div class="product-item-mini__side">
									<a href="#" class="product-item-mini__img">
										<img src="<?= SITE_TEMPLATE_PATH ?>/img/product_mini4.png" alt="">
									</a>
									<div class="product-item-mini__logo">
										<img src="<?= SITE_TEMPLATE_PATH ?>/img/mplook7.png" alt="">
									</div>
								</div>
								<div class="product-item-mini__main">
									<a href="#" class="product-item-mini__title">
										Струны для тенниса Wilson Sensation 200m (Естественный)
									</a>
									<div class="product-item-mini__info">
										<div class="product-item-mini__price">
											14 700 ₽
										</div>
										<a href="#" class="product-item-mini__btn btn-type-1">
											Добавить в заказ
										</a>
									</div>
								</div>
							</div>
						</div>
						<div class="product-item-mini__helper">
							<div class="product-item-mini__item">
								<div class="product-item-mini__side">
									<a href="#" class="product-item-mini__img">
										<img src="<?= SITE_TEMPLATE_PATH ?>/img/product_mini3.png" alt="">
									</a>
									<div class="product-item-mini__logo">
										<img src="<?= SITE_TEMPLATE_PATH ?>/img/mplook7.png" alt="">
									</div>
								</div>
								<div class="product-item-mini__main">
									<a href="#" class="product-item-mini__title">
										Кроссовки женские Nike Court Air Zoom GP Turbo Naomi Osaka W (Белый/Серый)
									</a>
									<div class="product-item-mini__info">
										<div class="product-item-mini__price">
											14 700 ₽
										</div>
										<a href="#" class="product-item-mini__btn btn-type-1">
											Добавить в заказ
										</a>
									</div>
								</div>
							</div>
						</div>
						<div class="product-item-mini__helper">
							<div class="product-item-mini__item">
								<div class="product-item-mini__side">
									<a href="#" class="product-item-mini__img">
										<img src="<?= SITE_TEMPLATE_PATH ?>/img/product_mini2.png" alt="">
									</a>
									<div class="product-item-mini__logo">
										<img src="<?= SITE_TEMPLATE_PATH ?>/img/mplook7.png" alt="">
									</div>
								</div>
								<div class="product-item-mini__main">
									<a href="#" class="product-item-mini__title">
										Ракетка для тенниса Head Graphene 360+ Boom Pro 2022
									</a>
									<div class="product-item-mini__info">
										<div class="product-item-mini__price">
											14 700 ₽
										</div>
										<a href="#" class="product-item-mini__btn btn-type-1">
											Добавить в заказ
										</a>
									</div>
								</div>
							</div>
						</div>

					</div>
				</div>
			</div>
			<?
			$productIdS = [];
			foreach ($arResult["GRID"]["ROWS"] as $key => $item) {
				if($item["PRODUCT_XML_ID"])
					$productIdS[(int) explode("#", $item["PRODUCT_XML_ID"])[0]] = [];
				else {
					$mxResult = CCatalogSku::GetProductInfo(
						$item["PRODUCT_ID"]
					);
					if (is_array($mxResult)) {
						$productIdS[$mxResult['ID']] = [];
					}
				}
			}
			if ($productIdS && CModule::IncludeModule("iblock")) {
				$arSelect = array("ID", "IBLOCK_ID", "IBLOCK_SECTION_ID");
				$arFilter = array("IBLOCK_ID" => IntVal(CATALOG_IBLOCK_ID), "ACTIVE" => "Y", "ID" => array_keys($productIdS));
				$res = CIBlockElement::GetList(array(), $arFilter, false, false, $arSelect);
				while ($ob = $res->GetNextElement()) {
					$arFields = $ob->GetFields();
					$arFields["PROPS"] = $ob->GetProperties();
					if ($arFields["PROPS"]["BRAND"]["VALUE"])
						$arrBrands[$arFields["PROPS"]["BRAND"]["VALUE"]] = [];
					if ($arFields["IBLOCK_SECTION_ID"])
						$arrSections[$arFields["IBLOCK_SECTION_ID"]] = [];
					$productIdS[$arFields["ID"]] = $arFields;
				}
			}
			$totalElements = [];
			foreach($productIdS as $ElementID => $productData) {
				$searchProps = [];
				$props = $productData["PROPS"];
				
				foreach($props as $propKey => $prop) {
					if ((stripos($propKey, 'PROP_') !== FALSE && !empty($prop['VALUE_ENUM_ID'])) && $propKey != 'PROP_EXL_VES') {
						if (count($searchProps) > 17) break;
		
						if ($propKey == 'BRAND' || $propKey == 'TYPE') {
							$searchProps[$propKey] = $prop['VALUE'];
						} else {
							$searchProps[$propKey] = $prop['VALUE_ENUM_ID'];
						}
					}
				}
				if ($props['BRAND']['VALUE']) {
					$searchProps['BRAND'] = $props['BRAND']['VALUE'];
				}
		
				if ($props['TYPE']['VALUE']) {
					$searchProps['TYPE'] = $props['TYPE']['VALUE'];
				}
				$arFilter = [
					//'!NAME' => "%Доставка%",
					'IBLOCK_ID' => $arParams['IBLOCK_ID'],
					'!SECTION_ID' => false,
					'ACTIVE' => 'Y',
					'AVAILABLE' => 'Y',
					'!ID' => $ElementID
				];
				
				foreach(array_reverse($searchProps,true) as $propKey => $value) {
					$arFilter['PROPERTY_' . $propKey] = $value;
				}
				$arFilter['!NAME'][] = "%Доставка%";

				//флаг того, что товар детский
				$flagKeeds = false;
				//если это детский товар
				if(strpos($arResult['NAME'],"детск") !== false){
					$flagKeeds = true;
				}
				//если НЕ детский товар
				if($flagKeeds == false){
					$arFilter['!NAME'][] = "%детск%";
				}
				$maxCnt = 4;
				$totalElementsBlock = [];
				$rsElements = CIBlockElement::GetList([], $arFilter, false, ['nTopCount' => $maxCnt], ['ID']);
				while($arElement = $rsElements->fetch()) {
					$totalElementsBlock[$arElement['ID']] = $arElement['ID'];
				}
				if (count($totalElementsBlock) < $maxCnt) {
					foreach($arFilter as $k => $filter) {
						if ((stripos($k, 'PROPERTY_') !== FALSE ) || $k != 'PROPERTY_TYPE' || $k != 'PROPERTY_BRAND') {
							if ($k != 'IBLOCK_ID' && $k != 'ACTIVE' && $k != 'AVAILABLE' && $k != '!ID' && $k != '!ID' && $k !='PROPERTY_PROP_EXL_TYPE') {
								unset($arFilter[$k]);
							}
							$rsElements = CIBlockElement::GetList([], $arFilter, false, ['nTopCount' => $maxCnt], ['ID']);
							while($arElement = $rsElements->fetch()) {
								if($arElement['ID'] == '132807') {//убираем выбор струны корт
									continue;
								}
								$totalElementsBlock[$arElement['ID']] = $arElement['ID'];
		
								$totalElementsBlock = array_unique($totalElementsBlock);
		
								if (count($totalElementsBlock) == $maxCnt) {
									break;
								}
							}
						}
		
						$totalElementsBlock = array_unique($totalElementsBlock);
		
						if (count($totalElementsBlock) == $maxCnt) {
							break;
						}
					}
				}
				$totalElements = array_merge($totalElements,$totalElementsBlock);
			}
			if($totalElements) {
				$GLOBALS['arrSimilarFilter']['ID'] = $totalElements;				
				$APPLICATION->IncludeComponent("bitrix:catalog.section", "slider_mini", 
                Array(
					"CUSTOM_CLASS" => "ta-l", 
                  "COMPONENT_TEMPLATE" => ".default",
                  "IBLOCK_TYPE" => "catalog",
                  "IBLOCK_ID" => CATALOG_IBLOCK_ID,
                  "SECTION_ID" => "",
                  "SECTION_CODE" => "",
                  "SECTION_USER_FIELDS" => array(
                    0 => "",
                    1 => "",
                  ),
                  "FILTER_NAME" => "arrSimilarFilter",   // Имя массива со значениями фильтра для фильтрации элементов
                  "INCLUDE_SUBSECTIONS" => "Y",   // Показывать элементы подразделов раздела
                  "SHOW_ALL_WO_SECTION" => "N",   // Показывать все элементы, если не указан раздел
                  "CUSTOM_FILTER" => "{\"CLASS_ID\":\"CondGroup\",\"DATA\":{\"All\":\"AND\",\"True\":\"True\"},\"CHILDREN\":[]}", // Фильтр товаров
                  "HIDE_NOT_AVAILABLE" => "N",
                  "HIDE_NOT_AVAILABLE_OFFERS" => "N",
                  "ELEMENT_SORT_FIELD" => "CREATED", // По какому полю сортируем элементы
                  "ELEMENT_SORT_ORDER" => "DESC",  // Порядок сортировки элементов
                  "ELEMENT_SORT_FIELD2" => "ID",  // Поле для второй сортировки элементов
                  "ELEMENT_SORT_ORDER2" => "DESC",    // Порядок второй сортировки элементов
                  "PAGE_ELEMENT_COUNT" => "30",   // Количество элементов на странице
                  "LINE_ELEMENT_COUNT" => "3",    // Количество элементов выводимых в одной строке таблицы
                  "OFFERS_LIMIT" => "5",  // Максимальное количество предложений для показа (0 - все)
                  "BACKGROUND_IMAGE" => "-",  // Установить фоновую картинку для шаблона из свойства
                  "TEMPLATE_THEME" => "blue", // Цветовая тема
                  "PRODUCT_ROW_VARIANTS" => "[{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false},{'VARIANT':'2','BIG_DATA':false}]",    // Вариант отображения товаров
                  "ENLARGE_PRODUCT" => "STRICT",  // Выделять товары в списке
                  "PRODUCT_BLOCKS_ORDER" => "price,props,sku,quantityLimit,quantity,buttons", // Порядок отображения блоков товара
                  "SHOW_SLIDER" => "Y",   // Показывать слайдер для товаров
                  "SLIDER_INTERVAL" => "3000",    // Интервал смены слайдов, мс
                  "SLIDER_PROGRESS" => "N",   // Показывать полосу прогресса
                  "ADD_PICT_PROP" => "-", // Дополнительная картинка основного товара
                  "LABEL_PROP" => "", // Свойства меток товара
                  "PRODUCT_SUBSCRIPTION" => "Y",  // Разрешить оповещения для отсутствующих товаров
                  "SHOW_DISCOUNT_PERCENT" => "N", // Показывать процент скидки
                  "SHOW_OLD_PRICE" => "Y",    // Показывать старую цену
                  "SHOW_MAX_QUANTITY" => "N", // Показывать остаток товара
                  "SHOW_CLOSE_POPUP" => "N",  // Показывать кнопку продолжения покупок во всплывающих окнах
                  "MESS_BTN_BUY" => "Купить", // Текст кнопки "Купить"
                  "MESS_BTN_ADD_TO_BASKET" => "В корзину",    // Текст кнопки "Добавить в корзину"
                  "MESS_BTN_SUBSCRIBE" => "Подписаться",  // Текст кнопки "Уведомить о поступлении"
                  "MESS_BTN_DETAIL" => "Подробнее",   // Текст кнопки "Подробнее"
                  "MESS_NOT_AVAILABLE" => "Нет в наличии",    // Сообщение об отсутствии товара
                  "MESS_NOT_AVAILABLE_SERVICE" => "Недоступно",   // Сообщение о недоступности услуги
                  "RCM_TYPE" => "personal",   // Тип рекомендации
                  "RCM_PROD_ID" => $_REQUEST["PRODUCT_ID"],   // Параметр ID продукта (для товарных рекомендаций)
                  "SHOW_FROM_SECTION" => "N", // Показывать товары из раздела
                  "SECTION_URL" => "",    // URL, ведущий на страницу с содержимым раздела
                  "DETAIL_URL" => "", // URL, ведущий на страницу с содержимым элемента раздела
                  "SECTION_ID_VARIABLE" => "SECTION_ID",  // Название переменной, в которой передается код группы
                  "SEF_MODE" => "N",  // Включить поддержку ЧПУ
                  "AJAX_MODE" => "N", // Включить режим AJAX
                  "AJAX_OPTION_JUMP" => "N",  // Включить прокрутку к началу компонента
                  "AJAX_OPTION_STYLE" => "Y", // Включить подгрузку стилей
                  "AJAX_OPTION_HISTORY" => "N",   // Включить эмуляцию навигации браузера
                  "AJAX_OPTION_ADDITIONAL" => "", // Дополнительный идентификатор
                  "CACHE_TYPE" => "A",    // Тип кеширования
                  "CACHE_TIME" => "36000000", // Время кеширования (сек.)
                  "CACHE_GROUPS" => "Y",  // Учитывать права доступа
                  "SET_TITLE" => "N", // Устанавливать заголовок страницы
                  "SET_BROWSER_TITLE" => "N", // Устанавливать заголовок окна браузера
                  "BROWSER_TITLE" => "-", // Установить заголовок окна браузера из свойства
                  "SET_META_KEYWORDS" => "Y", // Устанавливать ключевые слова страницы
                  "META_KEYWORDS" => "-", // Установить ключевые слова страницы из свойства
                  "SET_META_DESCRIPTION" => "Y",  // Устанавливать описание страницы
                  "META_DESCRIPTION" => "-",  // Установить описание страницы из свойства
                  "SET_LAST_MODIFIED" => "N", // Устанавливать в заголовках ответа время модификации страницы
                  "USE_MAIN_ELEMENT_SECTION" => "N",  // Использовать основной раздел для показа элемента
                  "ADD_SECTIONS_CHAIN" => "N",    // Включать раздел в цепочку навигации
                  "CACHE_FILTER" => "N",  // Кешировать при установленном фильтре
                  "ACTION_VARIABLE" => "action",  // Название переменной, в которой передается действие
                  "PRODUCT_ID_VARIABLE" => "id",  // Название переменной, в которой передается код товара для покупки
                  "PRICE_CODE" => defined('PRICE_CODE') && is_array (PRICE_CODE) ? PRICE_CODE : ['BASE'],
                  "USE_PRICE_COUNT" => "N",   // Использовать вывод цен с диапазонами
                  "SHOW_PRICE_COUNT" => "N",  // Выводить цены для количества
                  "PRICE_VAT_INCLUDE" => "Y", // Включать НДС в цену
                  "CONVERT_CURRENCY" => "N",  // Показывать цены в одной валюте
                  "BASKET_URL" => "/personal/cart/", // URL, ведущий на страницу с корзиной покупателя
                  "USE_PRODUCT_QUANTITY" => "N",  // Разрешить указание количества товара
                  "PRODUCT_QUANTITY_VARIABLE" => "quantity",  // Название переменной, в которой передается количество товара
                  "ADD_PROPERTIES_TO_BASKET" => "Y",  // Добавлять в корзину свойства товаров и предложений
                  "PRODUCT_PROPS_VARIABLE" => "prop", // Название переменной, в которой передаются характеристики товара
                  "PARTIAL_PRODUCT_PROPERTIES" => "N",    // Разрешить добавлять в корзину товары, у которых заполнены не все характеристики
                  "ADD_TO_BASKET_ACTION" => "ADD",    // Показывать кнопку добавления в корзину или покупки
                  "DISPLAY_COMPARE" => "Y",   // Разрешить сравнение товаров
                  "USE_ENHANCED_ECOMMERCE" => "N",    // Отправлять данные электронной торговли в Google и Яндекс
                  "PAGER_TEMPLATE" => ".default", // Шаблон постраничной навигации
                  "DISPLAY_TOP_PAGER" => "N", // Выводить над списком
                  "DISPLAY_BOTTOM_PAGER" => "Y",  // Выводить под списком
                  "PAGER_TITLE" => "Товары",  // Название категорий
                  "PAGER_SHOW_ALWAYS" => "N", // Выводить всегда
                  "PAGER_DESC_NUMBERING" => "N",  // Использовать обратную навигацию
                  "PAGER_DESC_NUMBERING_CACHE_TIME" => "36000",   // Время кеширования страниц для обратной навигации
                  "PAGER_SHOW_ALL" => "N",    // Показывать ссылку "Все"
                  "PAGER_BASE_LINK_ENABLE" => "N",    // Включить обработку ссылок
                  "LAZY_LOAD" => "N", // Показать кнопку ленивой загрузки Lazy Load
                  "MESS_BTN_LAZY_LOAD" => "Показать ещё", // Текст кнопки "Показать ещё"
                  "LOAD_ON_SCROLL" => "N",    // Подгружать товары при прокрутке до конца
                  "SET_STATUS_404" => "N",    // Устанавливать статус 404
                  "SHOW_404" => "N",  // Показ специальной страницы
                  "MESSAGE_404" => "",    // Сообщение для показа (по умолчанию из компонента)
                  "COMPATIBLE_MODE" => "Y",   // Включить режим совместимости
                  "DISABLE_INIT_JS_IN_COMPONENT" => "N",  // Не подключать js-библиотеки в компоненте
                  "PRODUCT_DISPLAY_MODE" => "Y",
                  "HIDE_BLOCKS" => "Y",
                  'FAVORITES' => $GLOBALS['FAVORITES'],
                  'TITLE' => 'Похожие товары',
                  'CENTER' => 'Y',
                  'COMP_ID' => 'similar',
                  'BASKET_BUTTON' => 'Подробнее',
                  'FILL_ITEM_ALL_PRICES' => 'Y'
                ),
				$component
            );
			}
			?>
			<div data-entity="basket-total-block">
				
			</div>
			<? $APPLICATION->IncludeComponent(
				"bitrix:main.include",
				"",
				array(
					"AREA_FILE_SHOW" => "file",
					"PATH" => "/include/cart/advantages.php"
				)
			); ?>


			<? $APPLICATION->IncludeComponent(
				'bitrix:catalog.products.viewed',
				'custom',
				array(
					"CUSTOM_CLASS" => "ta-l", 
					"SALES" => $arResult["SECTION_"]["SALES"] ?? [],
					"STIKERS" => $arResult["SECTION_"]["STIKERS"] ?? [],
					'IBLOCK_MODE' => 'single',
					'IBLOCK_TYPE' => $arParamsCatalog['IBLOCK_TYPE'],
					'IBLOCK_ID' => $arParamsCatalog['IBLOCK_ID'],
					'ELEMENT_SORT_FIELD' => $arParamsCatalog['ELEMENT_SORT_FIELD'],
					'ELEMENT_SORT_ORDER' => $arParamsCatalog['ELEMENT_SORT_ORDER'],
					'ELEMENT_SORT_FIELD2' => $arParamsCatalog['ELEMENT_SORT_FIELD2'],
					'ELEMENT_SORT_ORDER2' => $arParamsCatalog['ELEMENT_SORT_ORDER2'],
					'PROPERTY_CODE_' . $arParamsCatalog['IBLOCK_ID'] => (isset($arParamsCatalog['LIST_PROPERTY_CODE']) ? $arParamsCatalog['LIST_PROPERTY_CODE'] : []),
					'PROPERTY_CODE_' . $recommendedData['OFFER_IBLOCK_ID'] => (isset($arParamsCatalog['LIST_OFFERS_PROPERTY_CODE']) ? $arParamsCatalog['LIST_OFFERS_PROPERTY_CODE'] : []),
					'PROPERTY_CODE_MOBILE' . $arParamsCatalog['IBLOCK_ID'] => $arParamsCatalog['LIST_PROPERTY_CODE_MOBILE'],
					'BASKET_URL' => $arParamsCatalog['BASKET_URL'],
					'BASKET_ADD_URL' => $arParamsCatalog['BASKET_ADD_URL'] ?? '',
					'ACTION_VARIABLE' => $arParamsCatalog['ACTION_VARIABLE'],
					'PRODUCT_ID_VARIABLE' => $arParamsCatalog['PRODUCT_ID_VARIABLE'],
					'PRODUCT_QUANTITY_VARIABLE' => $arParamsCatalog['PRODUCT_QUANTITY_VARIABLE'],
					'PRODUCT_PROPS_VARIABLE' => $arParamsCatalog['PRODUCT_PROPS_VARIABLE'],
					'CACHE_TYPE' => $arParamsCatalog['CACHE_TYPE'],
					'CACHE_TIME' => $arParamsCatalog['CACHE_TIME'],
					'CACHE_FILTER' => $arParamsCatalog['CACHE_FILTER'],
					'CACHE_GROUPS' => $arParamsCatalog['CACHE_GROUPS'],
					'DISPLAY_COMPARE' => $arParamsCatalog['USE_COMPARE'],
					'PRICE_CODE' => defined('PRICE_CODE') && is_array(PRICE_CODE) ? PRICE_CODE : ['BASE'],
					'USE_PRICE_COUNT' => $arParamsCatalog['USE_PRICE_COUNT'],
					'SHOW_PRICE_COUNT' => $arParamsCatalog['SHOW_PRICE_COUNT'],
					'PAGE_ELEMENT_COUNT' => 30,
					'SECTION_ELEMENT_ID' => $ElementID,
					"SET_TITLE" => "N",
					"SET_BROWSER_TITLE" => "N",
					"SET_META_KEYWORDS" => "N",
					"SET_META_DESCRIPTION" => "N",
					"SET_LAST_MODIFIED" => "N",
					"ADD_SECTIONS_CHAIN" => "N",
					'PRICE_VAT_INCLUDE' => $arParamsCatalog['PRICE_VAT_INCLUDE'],
					'USE_PRODUCT_QUANTITY' => $arParamsCatalog['USE_PRODUCT_QUANTITY'],
					'ADD_PROPERTIES_TO_BASKET' => (isset($arParamsCatalog['ADD_PROPERTIES_TO_BASKET']) ? $arParamsCatalog['ADD_PROPERTIES_TO_BASKET'] : ''),
					'PARTIAL_PRODUCT_PROPERTIES' => (isset($arParamsCatalog['PARTIAL_PRODUCT_PROPERTIES']) ? $arParamsCatalog['PARTIAL_PRODUCT_PROPERTIES'] : ''),
					'CART_PROPERTIES_' . $arParamsCatalog['IBLOCK_ID'] => (isset($arParamsCatalog['PRODUCT_PROPERTIES']) ? $arParamsCatalog['PRODUCT_PROPERTIES'] : []),
					'CART_PROPERTIES_' . $recommendedData['OFFER_IBLOCK_ID'] => (isset($arParamsCatalog['OFFERS_CART_PROPERTIES']) ? $arParamsCatalog['OFFERS_CART_PROPERTIES'] : []),
					'ADDITIONAL_PICT_PROP_' . $arParamsCatalog['IBLOCK_ID'] => $arParamsCatalog['ADD_PICT_PROP'],
					'ADDITIONAL_PICT_PROP_' . $recommendedData['OFFER_IBLOCK_ID'] => $arParamsCatalog['OFFER_ADD_PICT_PROP'],
					'SHOW_FROM_SECTION' => 'N',
					'DETAIL_URL' => $arResult['FOLDER'] . $arResult['URL_TEMPLATES']['element'],
					'CONVERT_CURRENCY' => $arParamsCatalog['CONVERT_CURRENCY'],
					'CURRENCY_ID' => $arParamsCatalog['CURRENCY_ID'],
					'HIDE_NOT_AVAILABLE' => $arParamsCatalog['HIDE_NOT_AVAILABLE'],
					'HIDE_NOT_AVAILABLE_OFFERS' => $arParamsCatalog['HIDE_NOT_AVAILABLE_OFFERS'],
					'LABEL_PROP_' . $arParamsCatalog['IBLOCK_ID'] => $arParamsCatalog['LABEL_PROP'],
					'LABEL_PROP_MOBILE_' . $arParamsCatalog['IBLOCK_ID'] => $arParamsCatalog['LABEL_PROP_MOBILE'],
					'LABEL_PROP_POSITION' => $arParamsCatalog['LABEL_PROP_POSITION'],
					'PRODUCT_BLOCKS_ORDER' => $arParamsCatalog['LIST_PRODUCT_BLOCKS_ORDER'],
					'PRODUCT_ROW_VARIANTS' => "[{'VARIANT':'3','BIG_DATA':false}]",
					'ENLARGE_PRODUCT' => $arParamsCatalog['LIST_ENLARGE_PRODUCT'],
					'ENLARGE_PROP_' . $arParamsCatalog['IBLOCK_ID'] => isset($arParamsCatalog['LIST_ENLARGE_PROP']) ? $arParamsCatalog['LIST_ENLARGE_PROP'] : '',
					'SHOW_SLIDER' => $arParamsCatalog['LIST_SHOW_SLIDER'],
					'SLIDER_INTERVAL' => isset($arParamsCatalog['LIST_SLIDER_INTERVAL']) ? $arParamsCatalog['LIST_SLIDER_INTERVAL'] : '',
					'SLIDER_PROGRESS' => isset($arParamsCatalog['LIST_SLIDER_PROGRESS']) ? $arParamsCatalog['LIST_SLIDER_PROGRESS'] : '',
					'OFFER_TREE_PROPS_' . $recommendedData['OFFER_IBLOCK_ID'] => (isset($arParamsCatalog['OFFER_TREE_PROPS']) ? $arParamsCatalog['OFFER_TREE_PROPS'] : []),
					'PRODUCT_SUBSCRIPTION' => $arParamsCatalog['PRODUCT_SUBSCRIPTION'],
					'SHOW_DISCOUNT_PERCENT' => $arParamsCatalog['SHOW_DISCOUNT_PERCENT'],
					'DISCOUNT_PERCENT_POSITION' => $arParamsCatalog['DISCOUNT_PERCENT_POSITION'],
					'SHOW_OLD_PRICE' => $arParamsCatalog['SHOW_OLD_PRICE'],
					'SHOW_MAX_QUANTITY' => $arParamsCatalog['SHOW_MAX_QUANTITY'],
					'MESS_SHOW_MAX_QUANTITY' => (isset($arParamsCatalog['~MESS_SHOW_MAX_QUANTITY']) ? $arParamsCatalog['~MESS_SHOW_MAX_QUANTITY'] : ''),
					'RELATIVE_QUANTITY_FACTOR' => (isset($arParamsCatalog['RELATIVE_QUANTITY_FACTOR']) ? $arParamsCatalog['RELATIVE_QUANTITY_FACTOR'] : ''),
					'MESS_RELATIVE_QUANTITY_MANY' => (isset($arParamsCatalog['~MESS_RELATIVE_QUANTITY_MANY']) ? $arParamsCatalog['~MESS_RELATIVE_QUANTITY_MANY'] : ''),
					'MESS_RELATIVE_QUANTITY_FEW' => (isset($arParamsCatalog['~MESS_RELATIVE_QUANTITY_FEW']) ? $arParamsCatalog['~MESS_RELATIVE_QUANTITY_FEW'] : ''),
					'MESS_BTN_BUY' => (isset($arParamsCatalog['~MESS_BTN_BUY']) ? $arParamsCatalog['~MESS_BTN_BUY'] : ''),
					'MESS_BTN_ADD_TO_BASKET' => (isset($arParamsCatalog['~MESS_BTN_ADD_TO_BASKET']) ? $arParamsCatalog['~MESS_BTN_ADD_TO_BASKET'] : ''),
					'MESS_BTN_SUBSCRIBE' => (isset($arParamsCatalog['~MESS_BTN_SUBSCRIBE']) ? $arParamsCatalog['~MESS_BTN_SUBSCRIBE'] : ''),
					'MESS_BTN_DETAIL' => (isset($arParamsCatalog['~MESS_BTN_DETAIL']) ? $arParamsCatalog['~MESS_BTN_DETAIL'] : ''),
					'MESS_NOT_AVAILABLE' => $arParamsCatalog['~MESS_NOT_AVAILABLE'] ?? '',
					'MESS_NOT_AVAILABLE_SERVICE' => $arParamsCatalog['~MESS_NOT_AVAILABLE_SERVICE'] ?? '',
					'MESS_BTN_COMPARE' => (isset($arParamsCatalog['~MESS_BTN_COMPARE']) ? $arParamsCatalog['~MESS_BTN_COMPARE'] : ''),
					'USE_ENHANCED_ECOMMERCE' => (isset($arParamsCatalog['USE_ENHANCED_ECOMMERCE']) ? $arParamsCatalog['USE_ENHANCED_ECOMMERCE'] : ''),
					'DATA_LAYER_NAME' => (isset($arParamsCatalog['DATA_LAYER_NAME']) ? $arParamsCatalog['DATA_LAYER_NAME'] : ''),
					'BRAND_PROPERTY' => (isset($arParamsCatalog['BRAND_PROPERTY']) ? $arParamsCatalog['BRAND_PROPERTY'] : ''),
					'TEMPLATE_THEME' => (isset($arParamsCatalog['TEMPLATE_THEME']) ? $arParamsCatalog['TEMPLATE_THEME'] : ''),
					'ADD_TO_BASKET_ACTION' => $basketAction,
					'SHOW_CLOSE_POPUP' => isset($arParamsCatalog['COMMON_SHOW_CLOSE_POPUP']) ? $arParamsCatalog['COMMON_SHOW_CLOSE_POPUP'] : '',
					'COMPARE_PATH' => $arResult['FOLDER'] . $arResult['URL_TEMPLATES']['compare'],
					'COMPARE_NAME' => $arParamsCatalog['COMPARE_NAME'],
					'USE_COMPARE_LIST' => 'Y',
					'FAVORITES' => $GLOBALS['FAVORITES'],
					'FILL_ITEM_ALL_PRICES' => 'Y',
					'BASKET_BUTTON' => 'Подробнее',
				),
				$component
			); ?>
<?/*
			<div id="basket-root" class="bx-basket cart">

				<div class="row" hidden>
					<div class="col-xs-12">
						<div class="alert alert-warning alert-dismissable" id="basket-warning" style="display: none;">
							<span class="close" data-entity="basket-items-warning-notification-close">&times;</span>
							<div data-entity="basket-general-warnings"></div>
							<div data-entity="basket-item-warnings">
								<?= Loc::getMessage('SBB_BASKET_ITEM_WARNING') ?>
							</div>
						</div>
					</div>
				</div>

				<div id="basket-items-list-container">
					<div class="cart-table__helper" id="basket-item-list">
						<table class="cart-table" id="basket-item-table">
							<thead>
								<tr>
									<th>Фото</th>
									<th>Наименование товара</th>
									<th></th>
									<th>Цена</th>
									<th>Кол-во</th>
									<th>Сумма</th>
									<th>Удалить <br>из корзины</th>
								</tr>
							</thead>
						</table>
					</div>
				</div>

				<div class="cart-main" data-entity="basket-total-block"></div>
			</div>


			<div class="main-page__text">
				<div class="main-page__text-body">
					<div class="cart-advantages">
						<? foreach ($arResult['basket_advantages'] as $arBasketAdv) { ?>
							<?
							if (
								!$arBasketAdv['UF_USER_GROUP'] ||
								($flagOpt && in_array(6, $arBasketAdv['UF_USER_GROUP'])) ||
								(!$flagOpt && in_array(5, $arBasketAdv['UF_USER_GROUP']))
							) { ?>
								<div class="cart-advantages__helper">
									<div class="cart-advantages__item">
										<div class="cart-advantages__item-img">
											<img src="<?= SITE_TEMPLATE_PATH ?>/<?= CFile::GetPath($arBasketAdv["UF_IMG"]) ?>" alt="">
										</div>
										<div class="cart-advantages__item-text">
											<?= $arBasketAdv["UF_NAME"] ?>
										</div>
									</div>
								</div>
							<? } ?>
						<? } ?>
					</div>
				</div>
			</div>
			
*/ ?>
			<?
			if (!empty($arResult['CURRENCIES']) && Main\Loader::includeModule('currency')) {
				CJSCore::Init('currency');

			?>
				<script>
					BX.Currency.setCurrencies(<?= CUtil::PhpToJSObject($arResult['CURRENCIES'], false, true, true) ?>);
				</script>
			<?
			}

			$signer = new \Bitrix\Main\Security\Sign\Signer;
			$signedTemplate = $signer->sign($templateName, 'sale.basket.basket');
			$signedParams = $signer->sign(base64_encode(serialize($arParams)), 'sale.basket.basket');
			$messages = Loc::loadLanguageFile(__FILE__);
			?>
			<script>
				var basketList = Object.values([]);
				BX.message(<?= CUtil::PhpToJSObject($messages) ?>);
				BX.Sale.BasketComponent.init({
					result: <?= CUtil::PhpToJSObject($arResult, false, false, true) ?>,
					params: <?= CUtil::PhpToJSObject($arParams) ?>,
					template: '<?= CUtil::JSEscape($signedTemplate) ?>',
					signedParamsString: '<?= CUtil::JSEscape($signedParams) ?>',
					siteId: '<?= CUtil::JSEscape($component->getSiteId()) ?>',
					siteTemplateId: '<?= CUtil::JSEscape($component->getSiteTemplateId()) ?>',
					templateFolder: '<?= CUtil::JSEscape($templateFolder) ?>'
				});
			</script>
		<? elseif ($arResult['EMPTY_BASKET']) : ?>
			<? include(Main\Application::getDocumentRoot() . $templateFolder . '/empty.php'); ?>
		<? else : ?>
			<? ShowError($arResult['ERROR_MESSAGE']); ?>
		<? endif; ?>
	</div>
</div>