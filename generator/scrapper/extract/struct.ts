import { WikiElementKind, WikiPage, WikiStruct, WikiStructItem } from '../../wiki_types';
import { parseMarkup } from '../util';

export function extractStruct(page: WikiPage): WikiStruct {
    const markupObj = parseMarkup(page.markup, {
        stopNodes: ['description', 'item'],
    });

    const structObj = markupObj.structure[0];

    let parent;

    if (!markupObj.function) {
        let spl = page.title.split('.');
        if(spl.length > 1) parent = spl[0];
    }

    return {
        kind: WikiElementKind.Struct,
        name: page.title.replace(' ', '_'),
        description: structObj.description.trim(),
        parent: parent,
        realm: structObj.realm,
        items: structObj.fields ? structObj.fields[0].item.map(itemObjToStructObj) : [],
        address: page.address,
    };
}

function itemObjToStructObj(itemObj: any): WikiStructItem {
    return {
        kind: WikiElementKind.StructItem,
        name: itemObj.attr.name,
        parent: itemObj.attr.parent,
        address: '',
        type: itemObj.attr.type,
        description: itemObj.__text ? itemObj.__text.trim() : '',
    };
}
