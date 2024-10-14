import { isStringLiteral } from 'typescript';
import {
    WikiFunction,
    WikiPage,
    WikiArgument,
    WikiReturn,
    WikiStructItem,
    WikiElementKind,
} from '../../wiki_types';
import { parseMarkup } from '../util';

/** Can also return a struct field because apperaently some function collections include "NOT A FUNCTION" members... */
export function extractFunction(page: WikiPage): WikiFunction | WikiStructItem {

    let markup = page.markup;

    const codeRegex = /<code>([\s\S]*?)<\/code>/g;
    markup = markup.replace(codeRegex, (match, p1) => {
        const escapedCode = p1
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        return `<code>${escapedCode}</code>`;
    });

    const markupObj = parseMarkup(markup, {
        stopNodes: ['description', 'ret', 'arg'],
    });

    if (!markupObj.function) {
        const name = page.title.split('.')[1];
        const parent = page.title.split('.')[0];
        const description = markupObj.__text ? markupObj.__text.trim() : '';

        if (markupObj.__text && markupObj.__text.includes('# Not a function')) {
            return {
                kind: WikiElementKind.StructItem,
                name,
                parent,
                description,
                address: page.address,
                type: 'any',
            };
        } else {
            return {
                kind: WikiElementKind.Function,
                args: [],
                description,
                examples: [],
                name,
                parent,
                realm: 'Shared',
                rets: [],
                address: page.address,
            };
        }
    }

    const functionObj = markupObj.function[0];

    if (!functionObj.realm && markupObj.realm) functionObj.realm = markupObj.realm;
    if (!functionObj.rets && markupObj.rets) functionObj.rets = markupObj.rets;

    const argObjToArgument = (argObj: any) => {
        const arg = {
            description: argObj.__text ? argObj.__text.trim() : '',
            ...argObj.attr,
        } as WikiArgument;

        if (!arg.name || arg.name === '') {
            arg.name = '__unnamedArg';
        }

        if (arg.name.includes('=')) {
            const [realName, defaultValue] = arg.name.split('=').map((s) => s.trim());
            arg.name = realName;
            arg.default = defaultValue;
        }

        return arg;
    };

    const retObjToReturn = (retObj: any) =>
    ({
        description: retObj.__text ? retObj.__text.trim() : '',
        type: retObj.attr.type,
    } as WikiReturn);


    return {
        name: functionObj.attr.name,
        parent: functionObj.attr.parent,
        examples: [],
        kind: WikiElementKind.Function,
        description: (functionObj.description &&  (functionObj.description.trim)) ? functionObj.description.trim() : '',
        realm: functionObj.realm,
        args: functionObj.args ? functionObj.args[0].arg.map(argObjToArgument) : [],
        rets: functionObj.rets ? functionObj.rets[0].ret.map(retObjToReturn) : [],
        address: page.address,
    };
}
