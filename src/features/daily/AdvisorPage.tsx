import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/contexts/AuthContext';
import {useDailyStore,getAccount} from './store';
import {studyDate,hhmm} from './model';
import {fa} from '@/lib/arena/format';
export default function AdvisorPage(){const {user}=useAuth();const accounts=useDailyStore(s=>s.accounts);const a=accounts[user?.id??'']??getAccount(user?.id??'');const rows=a.logs.filter(l=>l.date===studyDate()&&!l.deleted_at);const minutes=rows.reduce((s,l)=>s+l.minutes,0);return <div className="max-w-2xl"><p className="text-primary mb-2">همراه</p><h1 className="font-display text-4xl mb-6">قدم امروزت مهم است</h1><p className="text-xl leading-loose">{minutes?`امروز ${fa(hhmm(minutes))} مطالعه ثبت کرده‌ای. قبل از ادامه، انرژی‌ات را بررسی کن؛ یک قدم کوچک و پیوسته بهتر از فشار بی‌وقفه است.`:'از یک لقمه شروع کنیم. انرژی امروزت چطور است؟ لازم نیست همهٔ مسیر را همین حالا طی کنی.'}</p><Button asChild className="mt-6"><Link to="/">برگشت به امروز</Link></Button></div>;}
