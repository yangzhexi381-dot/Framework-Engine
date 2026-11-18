import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const cfRoot = process.env.CF_STAGE || '/tmp/chemistry-framework-stage';
const {createChemistryInquiryStore} = await import(pathToFileURL(
  path.join(cfRoot, 'src/fe/adapters/chemistry/inquiry-store.js')));
const cfData = JSON.parse(await readFile(path.join(cfRoot, 'data/knowledge.json'), 'utf8'));
const analysisSource = await readFile(path.join(cfRoot, 'src/intuition-analysis.js'), 'utf8');
const controllerSource = await readFile(path.join(cfRoot, 'src/intuition-workbench.js'), 'utf8');

function element() {
  return {value:'', textContent:'', innerHTML:'', disabled:false, handlers:{},
    addEventListener(type, handler) { this.handlers[type] = handler; },
    setCustomValidity() {}, reportValidity() {}, focus() {},
    querySelectorAll() { return []; }};
}

function launch(store, legacyStorage = {getItem(){throw Error('legacy storage must not be used');}, setItem(){throw Error('legacy storage must not be used');}}) {
  const elements = new Map();
  const document = {getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }};
  const context = vm.createContext({document, localStorage:legacyStorage, console,
    AbortController, URL, encodeURIComponent, setTimeout, clearTimeout,
    matchMedia:()=>({matches:false}), navigator:{onLine:true},
    crypto:{randomUUID:()=>`test-${Math.random()}`}});
  context.window = context;
  vm.runInContext(analysisSource, context, {filename:'intuition-analysis.js'});
  vm.runInContext(controllerSource, context, {filename:'intuition-workbench.js'});
  context.CFIntuitionWorkbench.init({nodes:cfData.nodes, relations:cfData.relations,
    examples:[], relationLabels:{}, inquiryStore:store});
  return elements;
}

function analyzeAndSave(elements, question) {
  elements.get('intuition').value = question;
  elements.get('intuit-form').handlers.submit({preventDefault(){}});
  elements.get('save-inquiry').handlers.click();
}

const records = [{id:'inq.old', user_intuition:'既有保存问题', title:'既有保存问题', context:{system:''}}];
const values = new Map([['chemistry-framework-inquiries', JSON.stringify(records)]]);
const storage = {getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key, value)};
const store = createChemistryInquiryStore({getStorage:()=>storage});

const first = launch(store);
assert.equal(first.get('saved-count').textContent, '(1)', 'preexisting adapter records load');
analyzeAndSave(first, '铅酸蓄电池端电压能说明多少容量吗？');
assert.equal(first.get('saved-count').textContent, '(2)', 'controller saves through adapter');
assert.equal(JSON.parse(values.get('chemistry-framework-inquiries')).length, 2);

const second = launch(createChemistryInquiryStore({getStorage:()=>storage}));
assert.equal(second.get('saved-count').textContent, '(2)', 'saved record survives controller reload');

const blockedStorage = {getItem(){return null;}, setItem(){throw new Error('quota exceeded');}};
const blocked = launch(createChemistryInquiryStore({getStorage:()=>blockedStorage}));
analyzeAndSave(blocked, '铅酸蓄电池端电压能说明多少容量吗？');
assert.match(blocked.get('inquiry-save-status').textContent, /未能保存/,
  'storage failure is surfaced by the existing controller status');
console.log('Chemistry Framework inquiry integration: 3 scenarios passed');
