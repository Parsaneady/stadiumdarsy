import { describe,it,expect } from 'bun:test';
import {studyDate,canBackfill,percent,score,progress,elapsed,testDate,makeBite,stableId} from './model';
const b=makeBite('student','test','زیست','2026-11-07',{target_minutes:75,target_tests:10});
describe('Daily backbone rules',()=>{
 it('keeps 01:00 on previous study day until 03:00',()=>{expect(studyDate(new Date(2026,10,8,1))).toBe('2026-11-07');expect(studyDate(new Date(2026,10,8,3))).toBe('2026-11-08');});
 it('allows exactly 14 days backfill',()=>{expect(canBackfill('2026-10-24','2026-11-07')).toBe(true);expect(canBackfill('2026-10-23','2026-11-07')).toBe(false);expect(canBackfill('2026-11-08','2026-11-07')).toBe(false);});
 it('uses 3 incorrect = -1 correct and preserves negatives',()=>{expect(percent(0,3,3)).toBeCloseTo(-100/3);expect(percent(3,3,6,false)).toBe(50);});
 it('uses 40/40/20 weights',()=>{expect(score(75,0,0,75,10,1)).toBe(40);expect(score(0,10,0,75,10,1)).toBe(40);expect(score(0,0,1,75,10,1)).toBe(20);});
 it('needs both targets and excludes deleted rows',()=>{const l={bite_id:b.id,minutes:75,tests_done:9,deleted_at:null} as any;expect(progress(b,[l]).done).toBe(false);expect(progress(b,[{...l,tests_done:10}]).done).toBe(true);expect(progress(b,[{...l,tests_done:10,deleted_at:'deleted'}]).done).toBe(false);});
 it('tests memorize tomorrow and compute immediately',()=>{expect(testDate(b,'2026-11-07')).toBe('2026-11-08');expect(testDate({...b,subject_type:'compute'},'2026-11-07')).toBe('2026-11-07');});
 it('uses timestamps after reload and preserves pause',()=>{const t={started_at:1000,elapsed_ms:5000,paused:false} as any;expect(elapsed(t,61000)).toBe(65000);expect(elapsed({...t,paused:true},61000)).toBe(5000);});
 it('has stable idempotency IDs',()=>{expect(stableId('source-1')).toBe(stableId('source-1'));expect(stableId('source-1')).not.toBe(stableId('source-2'));});
});
