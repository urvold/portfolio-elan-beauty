import {test} from 'node:test';
import assert from 'node:assert/strict';
import{services,masters,slots,recommend,dateKey}from'../src/data';
test('Every service has a compatible master and a positive fixed price',()=>{for(const s of services){assert(masters.some(m=>m.services.includes(s.id)));assert(s.price>0);assert(s.duration>0)}});
test('Incompatible specialists cannot provide appointments',()=>{assert.deepEqual(slots(new Date(2030,0,8),masters[1],services[0]),[])});
test('Monday is closed',()=>{assert.deepEqual(slots(new Date(2030,0,7),masters[0],services[0]),[])});
test('Slots respect closing time, unavailable intervals and current time',()=>{const now=new Date(2030,0,8,13,5);for(const s of services){const m=masters.find(m=>m.services.includes(s.id))!;const options=slots(new Date(2030,0,8),m,s,now);assert(options.some(t=>!t.available));assert(options.some(t=>t.available));for(const t of options.filter(t=>t.available)){const[h,min]=t.time.split(':').map(Number);assert(h*60+min+s.duration<=1200);assert(h*60+min>785)}}});
test('Recommendations enforce direction and duration without random output',()=>{assert.deepEqual(recommend('Окрашивание волос',60,'Обновление'),[]);const all=recommend('Любое направление',90,'Расслабление');assert(all.length<=3);assert(all.every(s=>s.duration<=90));assert.equal(all[0].mood,'Расслабление');assert.deepEqual(all,recommend('Любое направление',90,'Расслабление'))});
test('Local dates do not shift across midnight and month boundaries',()=>{assert.equal(dateKey(new Date(2030,0,1,0)), '2030-01-01');assert.equal(dateKey(new Date(2030,11,31,23)), '2030-12-31')});
