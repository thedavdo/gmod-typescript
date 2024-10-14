import { TSCollection, TSField } from '../ts_types';
import { WikiStruct, WikiStructItem } from '../wiki_types';
import { createRealmString, transformDescription } from './description';
import { getPageMods, isAddParentModification, isOmitParentFieldModification } from './modification_db';
import { transformIdentifier, transformType } from './util';

export function transformStruct(wikiStruct: WikiStruct): TSCollection {

    const mods = getPageMods(wikiStruct.name);

    const parents = mods.filter(isAddParentModification).map((mod) => mod.parent);
    const omits = mods.filter(isOmitParentFieldModification);

    if (wikiStruct.parent) {
        parents.push(wikiStruct.parent);
    }

    const parentsModified = parents;

    for (const omit of omits) {
        if (parents.length > 0) {
            const parentIndex = omit.parent ? parentsModified.indexOf(omit.parent) : 0;
            if (parentIndex != -1) {
                parentsModified[parentIndex] = `Omit<${
                    parentsModified[parentIndex]
                }, ${omit.omits.map((o) => `"${o}"`).join(' | ')}>`;
            }
        }
    }
    
    return {
        identifier: wikiStruct.name,
        docComment:
            createRealmString(wikiStruct.realm) +
            '\n\n' +
            transformDescription(wikiStruct.description),
        fields: wikiStruct.items.map(transformStructField),
        functions: [],
        parent: parentsModified.join(', '),
        namespace: false,
        innerCollections: [],
    };
}

export function transformStructField(wikiStructItem: WikiStructItem): TSField {
    const defaultString = wikiStructItem.default ? '\n' + `@default ${wikiStructItem.default}` : '';
    return {
        identifier: transformIdentifier(wikiStructItem.name),
        docComment: transformDescription(wikiStructItem.description) + defaultString,
        type: transformType(wikiStructItem.type),
        optional: !!wikiStructItem.default,
    };
}
