/*!
 * Jodit Editor (https://xdsoft.net/jodit/)
 * Released under MIT see LICENSE.txt in the project root for license information.
 * Copyright (c) 2013-2020 Valeriy Chupurnov. All rights reserved. https://xdsoft.net
 */

import { IS_IE } from '../constants';
import { HTMLTagNames, IDictionary, Nullable } from '../../types/';
import { isString } from './checker';
import { attr } from './utils';
import { error } from './type';
import { Dom } from '../dom';

let temp = 1;

const $$temp = () => {
	temp++;
	return temp;
};

/**
 * Find all elements by selector and return Array. If it did not find any element it return empty array
 *
 * @example
 * ```javascript
 * Jodit.modules.Helpres.$$('.someselector').forEach(function (elm) {
 *      elm.addEventListener('click', function () {
 *          alert(''Clicked');
 *      });
 * })
 * ```
 * @param selector CSS like selector
 * @param root
 *
 * @return {HTMLElement[]}
 */
export function $$<K extends HTMLTagNames>(
	selector: K,
	root: HTMLElement | HTMLDocument
): HTMLElementTagNameMap[K][];

export function $$<T extends HTMLElement>(
	selector: string,
	root: HTMLElement | HTMLDocument
): T[];

export function $$<T extends HTMLElement>(
	selector: string | HTMLTagNames,
	root: HTMLElement | HTMLDocument
): T[] {
	let result: NodeList;

	if (
		/:scope/.test(selector) &&
		IS_IE &&
		!(root && root.nodeType === Node.DOCUMENT_NODE)
	) {
		const id: string = (root as HTMLElement).id,
			temp_id: string =
				id ||
				'_selector_id_' + ('' + Math.random()).slice(2) + $$temp();

		selector = selector.replace(/:scope/g, '#' + temp_id);

		!id && (root as HTMLElement).setAttribute('id', temp_id);

		result = (root.parentNode as HTMLElement).querySelectorAll(selector);

		if (!id) {
			(root as HTMLElement).removeAttribute('id');
		}
	} else {
		result = root.querySelectorAll(selector);
	}

	return [].slice.call(result);
}

/**
 * Calculate XPath selector
 *
 * @param element
 * @param root
 */
export const getXPathByElement = (
	element: HTMLElement,
	root: HTMLElement
): string => {
	if (!element || element.nodeType !== 1) {
		return '';
	}

	if (!element.parentNode || root === element) {
		return '';
	}

	if (element.id) {
		return "//*[@id='" + element.id + "']";
	}

	const sames: Node[] = [].filter.call(
		element.parentNode.childNodes,
		(x: Node) => x.nodeName === element.nodeName
	);

	return (
		getXPathByElement(element.parentNode as HTMLElement, root) +
		'/' +
		element.nodeName.toLowerCase() +
		(sames.length > 1
			? '[' + (Array.from(sames).indexOf(element) + 1) + ']'
			: '')
	);
};

/**
 * Find all `ref` or `data-ref` elements inside HTMLElement
 * @param root
 */
export const refs = <T extends HTMLElement>(root: HTMLElement): IDictionary<T> => {
	return $$('[ref],[data-ref]', root).reduce((def, child) => {
		const key = attr(child, '-ref');

		if (key && isString(key)) {
			def[key] = child as T;
		}

		return def;
	}, <IDictionary<T>>{});
};

/**
 * Calculate full CSS selector
 * @param el
 */
export const cssPath = (el: Element): Nullable<string> => {
	if (!(el instanceof Element)) {
		return null;
	}

	const path = [];

	let start: Nullable<Element> = el;

	while (start && start.nodeType === Node.ELEMENT_NODE) {
		let selector = start.nodeName.toLowerCase();

		if (start.id) {
			selector += '#' + start.id;
			path.unshift(selector);
			break;

		} else {
			let sib: Nullable<Element> = start,
				nth = 1;

			do {
				sib = sib.previousElementSibling;

				if (sib && sib.nodeName.toLowerCase() == selector) {
					nth++;
				}
			} while(sib);

			selector += ':nth-of-type(' + nth + ')';
		}

		path.unshift(selector);

		start = start.parentNode as Element;
	}

	return path.join(' > ');
};


/**
 * Try to find element by selector
 *
 * @param element
 * @param od
 */
export function resolveElement(element: string | HTMLElement, od: Document): HTMLElement {
	let resolved = element;

	if (isString(element)) {
		try {
			resolved = od.querySelector(element) as HTMLInputElement;
		} catch {
			throw error(
				'String "' + element + '" should be valid HTML selector'
			);
		}
	}

	// Duck checking
	if (
		!resolved ||
		typeof resolved !== 'object' ||
		!Dom.isElement(resolved) ||
		!resolved.cloneNode
	) {
		throw error(
			'Element "' +
			element +
			'" should be string or HTMLElement instance'
		);
	}

	return resolved;
}
