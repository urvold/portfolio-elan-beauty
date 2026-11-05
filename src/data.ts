export type Service = {id:string; category:string; name:string; text:string; duration:number; price:number; image:string; mood:string};
export const services:Service[] = [
{id:'hair',category:'Парикмахерские услуги',name:'Стрижка и форма',text:'Линии, которые подчёркивают вас. Консультация, деликатное мытьё, персональная стрижка и укладка.',duration:60,price:4500,image:'hair',mood:'Обновление'},
{id:'color',category:'Окрашивание волос',name:'Цвет с вашим характером',text:'Мягкие переливы и выразительная глубина. Подбор оттенка, окрашивание в один тон и завершающий уход.',duration:150,price:9500,image:'color',mood:'Обновление'},
{id:'nails',category:'Маникюр и педикюр',name:'Безупречные детали',text:'Бережный маникюр, форма и однотонное покрытие. Маленький ритуал большого удовольствия.',duration:90,price:3800,image:'nails',mood:'Ухоженность'},
{id:'face',category:'Уход за лицом',name:'Прикосновение сияния',text:'Очищение, мягкий косметический уход и увлажняющая маска для ощущения свежести и комфорта.',duration:60,price:6500,image:'face',mood:'Расслабление'},
{id:'makeup',category:'Макияж',name:'Ваша особенная история',text:'Текстуры, свет и оттенки, созвучные вашему настроению. Дневной или вечерний образ без маски.',duration:60,price:5500,image:'makeup',mood:'Обновление'},
{id:'brows',category:'Уход за бровями и ресницами',name:'Искусство выразительности',text:'Персональная архитектура бровей: форма, коррекция и деликатное окрашивание.',duration:45,price:2800,image:'brows',mood:'Ухоженность'},
{id:'spa',category:'Массаж и SPA-ритуалы',name:'Пауза для себя',text:'Расслабляющий немедицинский SPA-ритуал с ароматным маслом. Время замедлиться и вернуться к себе.',duration:90,price:7500,image:'spa',mood:'Расслабление'}];
export type Master={id:string;name:string;role:string;image:string;services:string[];text:string};
export const masters:Master[]=[
{id:'anna',name:'Анна Миронова',role:'Стилист · колорист',image:'anna',services:['hair','color'],text:'Чувствует форму и находит оттенки, которые раскрывают индивидуальность. Любит естественные текстуры и лёгкость в повседневной укладке.'},
{id:'maria',name:'Мария Белова',role:'Мастер ногтевого сервиса',image:'maria',services:['nails'],text:'Внимательна к каждой детали: от мягкой формы до идеального блика. Её эстетика — чистота линий и сдержанный цвет.'},
{id:'sofia',name:'София Лебедева',role:'Визажист · brow-мастер',image:'sofia',services:['makeup','brows'],text:'Работает с оттенками и пропорциями, сохраняя ваш характер. Создаёт образы, в которых комфортно быть собой.'},
{id:'elena',name:'Елена Соколова',role:'Специалист по уходу и SPA',image:'elena',services:['face','spa'],text:'Создаёт атмосферу спокойствия через бережное прикосновение и внимание к комфорту гостя.'}];
export const money=(n:number)=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
export function dateKey(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function slots(date:Date,master:Master,service:Service,now=new Date()) {if(!master.services.includes(service.id)||date.getDay()===1)return [];return Array.from({length:17},(_,i)=>{const mins=600+i*30;const at=new Date(date);at.setHours(Math.floor(mins/60),mins%60,0,0);return {time:`${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`,available:mins+service.duration<=1200&&(i+date.getDate()+masters.indexOf(master))%4!==0&&at>now}})}
export function recommend(direction:string,max:number,mood:string){return services.filter(s=>(direction==='Любое направление'||s.category===direction)&&s.duration<=max).sort((a,b)=>Number(b.mood===mood)-Number(a.mood===mood)||a.duration-b.duration).slice(0,3)}
