import {googleMapsParts} from '../src/maps';
import {memoryCaption} from '../src/memories';
import {normalizeState,initialState} from '../src/storage';
import type {Activity,Plan} from '../src/types';
const place={_id:'1',title:'Lake Eola',cityId:'orlando',images:[],categories:[],tags:[],audience:[],source:'manual',coordinates:{type:'Point',coordinates:[-81.37,28.54]}} as Activity;
const plan=(n:number,transport='driving')=>({cityName:'Orlando',input:{transport,start:[-81.4,28.5]},stops:Array.from({length:n},(_,i)=>({activity:{...place,_id:String(i),coordinates:{type:'Point',coordinates:[-81+i*.01,28+i*.01]}}}))}) as Plan;
test('Maps exports every stop in order with mobile-safe waypoint counts',()=>{
  const parts=googleMapsParts(plan(9));expect(parts).toHaveLength(3);
  expect(parts[0].url).toContain('origin=28.5%2C-81.4');
  expect(parts[0].url).toContain('destination=28.03%2C-80.97');
  expect(parts[1].url).toContain('origin=28.03%2C-80.97');
  expect(parts[2].url).toContain('destination=28.08%2C-80.92');
  expect(parts.every(p=>p.url.length<2048)).toBe(true);
});
test('Maps handles transit as separate legs and cycling in Google terminology',()=>{
  expect(googleMapsParts(plan(3,'transit'))).toHaveLength(3);
  expect(googleMapsParts(plan(3,'transit')).every(p=>!p.url.includes('waypoints'))).toBe(true);
  expect(googleMapsParts(plan(2,'cycling'))[0].url).toContain('travelmode=bicycling');
  expect(googleMapsParts(plan(0))).toEqual([]);
});
test('Maps falls back to a named address without silently dropping an unlocated stop',()=>{
  const p=plan(1);p.stops[0].activity={...place,coordinates:undefined};delete p.input.start;
  expect(googleMapsParts(p)[0].url).toContain('destination=Lake%20Eola%2C%20Orlando');
  expect(googleMapsParts(p)[0].url).not.toContain('origin=');
});
test('visits outlive recently viewed and retain the user memory after venue data expires',()=>{
  const result=normalizeState({...initialState,visited:['1'],visits:[{activityId:'1',activity:{...place,expiresAt:'2000-01-01'},placeTitle:'Lake Eola',cityName:'Orlando',name:'Alex',visitedOn:'2026-11-15',note:'A good afternoon.'}]});
  expect(result.visits[0].placeTitle).toBe('Lake Eola');
  expect(result.visits[0].activity.unavailable).toBe(true);
  expect(result.visits[0].name).toBe('Alex');
  expect(memoryCaption(result.visits[0])).toContain('#old_alex_hub');
  expect(memoryCaption(result.visits[0])).toContain('Alex was here!');
});
test('legacy visited records migrate without fabricating a visit date',()=>{
  const result=normalizeState({...initialState,visited:['1'],recent:[place]});
  expect(result.visits).toHaveLength(1);expect(result.visits[0].visitedOn).toBe('');
  expect(normalizeState({...result,recent:[]}).visits).toHaveLength(1);
  expect(normalizeState({...result,visited:[]}).visits).toHaveLength(0);
});
