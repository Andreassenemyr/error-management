import { GLOBAL_OBJ } from "../worldwide";
import { isString } from "./object";

const WINDOW = GLOBAL_OBJ as unknown as Window;

const DEFAULT_MAX_STRING_LENGTH = 80;

type SimpleNode = {
  parentNode: SimpleNode;
} | null;


export function htmlTreeAsString(
    elem: unknown,
    options: string[] | { keyAttrs?: string[]; maxStringLength?: number } = {},
): string {
    if (!elem) {
        return '<unknown>';
    }
  
    // try/catch both:
    // - accessing event.target (see getsentry/raven-js#838, #768)
    // - `htmlTreeAsString` because it's complex, and just accessing the DOM incorrectly
    // - can throw an exception in some circumstances.
    try {
        let currentElem = elem as SimpleNode;
        const MAX_TRAVERSE_HEIGHT = 5;
        const out: string[] = [];
        let height = 0;
        let len = 0;
        const separator = ' > ';
        const sepLength = separator.length;
        let nextStr;
        const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
        const maxStringLength = (!Array.isArray(options) && options.maxStringLength) || DEFAULT_MAX_STRING_LENGTH;
        
        while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
            nextStr = _htmlElementAsString(currentElem, keyAttrs);
            // bail out if
            // - nextStr is the 'html' element
                // - the length of the string that would be created exceeds maxStringLength
                //   (ignore this limit if we are on the first iteration)
                if (nextStr === 'html' || (height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength)) {
                  break;
                }
          
                out.push(nextStr);
          
            len += nextStr.length;
            currentElem = currentElem.parentNode;
        }
      
        return out.reverse().join(separator);
    } catch (_oO) {
        return '<unknown>';
    }
}

function _htmlElementAsString(el: unknown, keyAttrs?: string[]): string {
    const elem = el as {
      tagName?: string;
      id?: string;
      className?: string;
      getAttribute(key: string): string;
    };
  
    const out: string[] = [];
    let className;
    let classes;
    let key;
    let attr;
    let i;
  
    if (!elem || !elem.tagName) {
        return '';
    }
  
    // @ts-expect-error WINDOW has HTMLElement
    if (WINDOW.HTMLElement) {
        // If using the component name annotation plugin, this value may be available on the DOM node
        if (elem instanceof HTMLElement && elem.dataset) {
            if (elem.dataset['ribbanComponent']) {
                return elem.dataset['ribbanComponent'];
            }
            
            if (elem.dataset['ribbanElement']) {
                return elem.dataset['ribbanElement'];
            }
        }
    }
  
    out.push(elem.tagName.toLowerCase());
  
    // Pairs of attribute keys defined in `serializeAttribute` and their values on element.
    const keyAttrPairs =
      keyAttrs && keyAttrs.length
        ? keyAttrs.filter(keyAttr => elem.getAttribute(keyAttr)).map(keyAttr => [keyAttr, elem.getAttribute(keyAttr)])
        : null;
  
    if (keyAttrPairs && keyAttrPairs.length) {
      keyAttrPairs.forEach(keyAttrPair => {
        out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
      });
    } else {
        if (elem.id) {
            out.push(`#${elem.id}`);
        }
      
        className = elem.className;
        if (className && isString(className)) {
            classes = className.split(/\s+/);
            for (i = 0; i < classes.length; i++) {
                out.push(`.${classes[i]}`);
            }
        }
    }

    const allowedAttrs = ['aria-label', 'type', 'name', 'title', 'alt'];
    for (i = 0; i < allowedAttrs.length; i++) {
        key = allowedAttrs[i];
        attr = elem.getAttribute(key);
        if (attr) {
            out.push(`[${key}="${attr}"]`);
        }
    }
    return out.join('');
}
  