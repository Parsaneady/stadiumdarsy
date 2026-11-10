import {describe,it,expect} from 'bun:test';
import {useDailyStore,getAccount} from './store';
import {makeBite,progress,studyDate,addDays} from './model';
const uid='acceptance';
const log=(b,id,minutes,tests)=>({id,user_id:uid,bite_id:b.id,date:studyDate(),minutes,tests_done:tests,correct:tests,wrong:0,blank:0,energy:'normal',distraction:'none',distractions_note:'',source:'manual',deleted_at:null,updated_at:new Date().toISOString()});
describe('Bite ledger',()=>{
 it('retries replace same event rather than doubling totals',()=>{const b=makeBite(uid,'compute','فیزیک',studyDate(),{target_minutes:75,target_tests:10});useDailyStore.getState().saveBite(uid,b);const l=log(b,'stable-log',75,10);useDailyStore.getState().saveLog(uid,l);useDailyStore.getState().saveLog(uid,l);expect(progress(b,getAccount(uid).logs).minutes).toBe(75);expect(getAccount(uid).bites.filter(x=>x.parent_bite_id===b.id)).toHaveLength(1);expect(getAccount(uid).bites.find(x=>x.parent_bite_id===b.id).planned_date).toBe(studyDate());});
 it('memorize unlocks tests tomorrow',()=>{const b=makeBite(uid,'memorize','زیست',studyDate(),{target_minutes:25,target_tests:0});useDailyStore.getState().saveBite(uid,b);useDailyStore.getState().saveLog(uid,log(b,'memo',25,0));expect(getAccount(uid).bites.find(x=>x.parent_bite_id===b.id).planned_date).toBe(addDays(studyDate(),1));});
 it('allows one active timer only',()=>{const b=makeBite(uid,'timer','شیمی',studyDate());expect(useDailyStore.getState().start(uid,b,75,true)).toBe(true);expect(useDailyStore.getState().start(uid,b,75,true)).toBe(false);useDailyStore.getState().clearTimer(uid);});
});
