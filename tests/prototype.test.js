import test from 'node:test'; import assert from 'node:assert/strict';
import {FrameworkEngine} from '../src/core/engine.js';
import {chemistryPlugin} from '../src/adapters/chemistry/demo-app.js';
import {cellPotential} from '../src/models/daniell-cell.js';
import {storyPlugin,storyData} from '../src/adapters/story/story.js';
class Mem {m=new Map();getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}}
test('both independent plugins register and load through shared contract',()=>{const e=new FrameworkEngine({storage:new Mem()});e.register(chemistryPlugin);e.register(storyPlugin);assert.equal(e.list().length,2);assert.equal(e.load('chemistry').state.aZn2,1);assert.equal(e.load('story').state.nodeId,'arrival')});
test('Nernst standard case and nonstandard case',()=>{assert.equal(cellPotential().E,1.1);assert.ok(Math.abs(cellPotential({aZn2:10,aCu2:1}).E-1.0704)<.001)});
test('temperature and activity input bounds reject invalid values',()=>{assert.throws(()=>cellPotential({temperatureK:200}),/Temperature/);assert.throws(()=>cellPotential({aCu2:0}),/activity/)});
test('story transitions change state and gate ending branches',()=>{const e=new FrameworkEngine({storage:new Mem()});e.register(storyPlugin);e.load('story');e.dispatch({type:'choose',index:0});assert.equal(e.state.lightOn,true);assert.equal(storyData.nodes[e.state.nodeId].choices[0].when.lightOn,true);e.dispatch({type:'choose',index:0});assert.equal(e.state.nodeId,'ending_rescue');assert.equal(e.state.history.length,2)});
test('import/export roundtrip validates framework and state',()=>{const e=new FrameworkEngine({storage:new Mem()});e.register(chemistryPlugin);e.register(storyPlugin);e.load('chemistry');const data=e.exportData();e.dispatch({type:'set-parameters',values:{aCu2:2}});e.importData(data);assert.equal(e.state.aCu2,1);assert.throws(()=>e.importData({...JSON.parse(data),frameworkId:'story'}),/different framework/)});
test('persistence restores saved state',()=>{const storage=new Mem(),e=new FrameworkEngine({storage});e.register(chemistryPlugin);e.load('chemistry');e.dispatch({type:'set-parameters',values:{temperatureK:310}});const e2=new FrameworkEngine({storage});e2.register(chemistryPlugin);assert.equal(e2.load('chemistry').state.temperatureK,310)});
