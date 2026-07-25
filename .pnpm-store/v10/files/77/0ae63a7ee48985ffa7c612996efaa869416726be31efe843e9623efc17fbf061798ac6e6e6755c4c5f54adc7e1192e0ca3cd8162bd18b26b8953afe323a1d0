import { noCase } from 'change-case';
export async function generateTitleSearchData(ctx) {
    const searchIndex = [];
    const { idMap, addToIdMap } = createIdMap();
    for (const storyFile of ctx.storyFiles) {
        if (storyFile.story) {
            searchIndex.push({
                id: addToIdMap(storyFile.story.id, 'story'),
                text: convertTitleToSentence(storyFile.story.title),
            });
            for (const variant of storyFile.story.variants) {
                searchIndex.push({
                    id: addToIdMap(`${storyFile.story.id}:${variant.id}`, 'variant'),
                    text: convertTitleToSentence(`${storyFile.story.title} ${variant.title}`),
                });
            }
        }
    }
    return {
        index: searchIndex,
        idMap,
    };
}
export async function generateDocSearchData(ctx) {
    const searchIndex = [];
    const { idMap, addToIdMap } = createIdMap();
    for (const storyFile of ctx.storyFiles) {
        if (storyFile.story && storyFile.story.docsText) {
            searchIndex.push({
                id: addToIdMap(storyFile.story.id, 'story'),
                text: storyFile.story.docsText,
            });
        }
    }
    return {
        index: searchIndex,
        idMap,
    };
}
function createIdMap() {
    let uid = 0;
    const idMap = {};
    function addToIdMap(id, kind) {
        const n = uid++;
        idMap[n] = { id, kind };
        return n;
    }
    return {
        idMap,
        addToIdMap,
    };
}
function convertTitleToSentence(text) {
    return text.split(' ').map(str => noCase(str)).join(' ');
}
// @TODO clear handlers when SearchPane unmounts
export function getSearchDataJS(data) {
    return `export let searchData = ${JSON.stringify(data)}
const handlers = []
export function onUpdate (cb) {
  handlers.push(cb)
}
if (import.meta.hot) {
  import.meta.hot.accept(newModule => {
    searchData = newModule.searchData
    handlers.forEach(h => {
      h(newModule.searchData)
      newModule.onUpdate(h)
    })
  })
}`;
}
