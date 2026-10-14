import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Item, Activity } from './models.js';

const app = express();
const PORT = process.env.PORT || 5000;
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
app.use(cors());
app.use(express.json());

const seed = [
  { _id:'item-01', title:'The Art of Slow Living', creator:'Maya Chen', category:'Lifestyle', description:'A gentle guide to making room for what matters.', color:'#d9e7dc', cover:'☀', duration:'8 min read', likes:142, views:318, featured:true },
  { _id:'item-02', title:'Designing with Intention', creator:'Studio North', category:'Design', description:'Simple principles for thoughtful everyday spaces.', color:'#e8d9ce', cover:'◒', duration:'12 min read', likes:128, views:276 },
  { _id:'item-03', title:'A Beginner’s Guide to Investing', creator:'Sam Rivera', category:'Finance', description:'Build confidence with the basics of long-term investing.', color:'#dbe5f3', cover:'↗', duration:'10 min read', likes:116, views:249 },
  { _id:'item-04', title:'Small Rituals, Big Energy', creator:'Nia Williams', category:'Wellness', description:'Five tiny habits for a calmer, more energized day.', color:'#eedfe4', cover:'✳', duration:'6 min read', likes:104, views:235 },
  { _id:'item-05', title:'The Creative Reset', creator:'Leo Martins', category:'Creativity', description:'Get unstuck and find your way back to making things.', color:'#e9e1c8', cover:'✦', duration:'9 min read', likes:98, views:211 },
  { _id:'item-06', title:'Making Peace with Your Inbox', creator:'Ari Patel', category:'Productivity', description:'A lighter system for messages, tasks and attention.', color:'#dbe9e8', cover:'⌁', duration:'7 min read', likes:89, views:204 },
  { _id:'item-07', title:'A Home That Grows with You', creator:'Studio North', category:'Design', description:'Flexible ideas for rooms that change with real life.', color:'#e9ded2', cover:'⌂', duration:'11 min read', likes:83, views:193 },
  { _id:'item-08', title:'Better Sleep, Gently', creator:'Nia Williams', category:'Wellness', description:'A kind, practical routine for winding down.', color:'#d9e1ef', cover:'☾', duration:'5 min read', likes:77, views:180 },
  { _id:'item-09', title:'Money Habits that Stick', creator:'Sam Rivera', category:'Finance', description:'Create a budget that leaves space for real life.', color:'#e7e8d6', cover:'$', duration:'8 min read', likes:71, views:165 },
  { _id:'item-10', title:'The Sunday Note', creator:'Maya Chen', category:'Lifestyle', description:'A weekly reflection to help you start with clarity.', color:'#eee1d1', cover:'✎', duration:'4 min read', likes:65, views:151 },
  { _id:'item-11', title:'Make Something Imperfect', creator:'Leo Martins', category:'Creativity', description:'Why your first draft deserves to exist.', color:'#e8d9df', cover:'✷', duration:'6 min read', likes:60, views:147 },
  { _id:'item-12', title:'Focus without the Frenzy', creator:'Ari Patel', category:'Productivity', description:'A simple rhythm for getting meaningful work done.', color:'#dce6d8', cover:'◷', duration:'9 min read', likes:54, views:131 },
  { _id:'item-13', title:'Color, Comfort & Character', creator:'Studio North', category:'Design', description:'Use color to make a room feel unmistakably yours.', color:'#eadaca', cover:'◉', duration:'7 min read', likes:49, views:124 },
  { _id:'item-14', title:'Objects with a Second Life', creator:'Maya Chen', category:'Design', description:'A fresh look at reusing the things already around you.', color:'#dbe8dd', cover:'⟳', duration:'6 min read', likes:43, views:109 }
];
let demoItems = structuredClone(seed);
let demoActivity = [
  { itemId:'item-01', type:'like', userId:'shamili' }, { itemId:'item-02', type:'view', userId:'shamili' },
  { itemId:'item-07', type:'like', userId:'shamili' }, { itemId:'item-04', type:'view', userId:'shamili' },
  { itemId:'item-10', type:'view', userId:'shamili' }
];
let dbReady = false;

const itemJSON = item => ({ ...item, _id: String(item._id), likes: item.likes || 0, views: item.views || 0 });
async function allItems() { return dbReady ? (await Item.find().lean()).map(itemJSON) : demoItems.map(itemJSON); }
async function allActivity(userId='shamili') { return dbReady ? Activity.find({ userId }).lean() : demoActivity.filter(a => a.userId === userId); }
function rankItems(items, activity) {
  const scores = {};
  const liked = new Set(activity.filter(a => a.type === 'like').map(a => String(a.itemId)));
  for (const event of activity) {
    const item = items.find(i => String(i._id) === String(event.itemId));
    if (item) scores[item.category] = (scores[item.category] || 0) + (event.type === 'like' ? 3 : 1);
  }
  const preferredCategory = Object.entries(scores).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Lifestyle';
  const recommendations = items.filter(i => i.category === preferredCategory && !liked.has(String(i._id)))
    .sort((a,b) => ((b.likes||0)*3+(b.views||0)) - ((a.likes||0)*3+(a.views||0))).slice(0,4);
  return { preferredCategory, recommendations, categoryScores: scores };
}

app.get('/api/health', (_req,res) => res.json({ ok:true, mode:dbReady?'mongodb':'demo' }));
app.get('/api/items', async (req,res) => {
  const { search='', category='All' } = req.query;
  const items = await allItems();
  const q=search.toLowerCase();
  res.json(items.filter(i => (category==='All'||i.category===category) && (!q||`${i.title} ${i.creator} ${i.category}`.toLowerCase().includes(q))));
});
app.get('/api/trending', async (_req,res) => {
  const items=await allItems();
  res.json(items.sort((a,b)=>b.likes-a.likes||b.views-a.views).slice(0,5));
});
app.get('/api/dashboard', async (_req,res) => {
  const [items, activity]=await Promise.all([allItems(),allActivity()]);
  const {preferredCategory,recommendations,categoryScores}=rankItems(items,activity);
  const viewed=new Set(activity.filter(a=>a.type==='view').map(a=>String(a.itemId))).size;
  const liked=new Set(activity.filter(a=>a.type==='like').map(a=>String(a.itemId))).size;
  res.json({ items, recommendations, preferredCategory, categoryScores, activityCount:activity.length, viewedCount:viewed, likedCount:liked, likedItemIds:[...new Set(activity.filter(a=>a.type==='like').map(a=>String(a.itemId)))], trending:[...items].sort((a,b)=>b.likes-a.likes||b.views-a.views).slice(0,5), mode:dbReady?'mongodb':'demo' });
});
app.post('/api/activity', async (req,res) => {
  const { itemId, type }=req.body||{};
  if (!itemId || !['view','like'].includes(type)) return res.status(400).json({ error:'Send an itemId and an activity type of view or like.' });
  const items=await allItems();
  const item=items.find(i=>String(i._id)===String(itemId));
  if (!item) return res.status(404).json({ error:'Item not found.' });
  if (dbReady) {
    await Activity.create({ itemId, type });
    await Item.updateOne({ _id:itemId }, { $inc: { [type==='like'?'likes':'views']:1 } });
  } else {
    demoActivity.push({ itemId, type, userId:'shamili', createdAt:new Date() });
    const storedItem=demoItems.find(i=>String(i._id)===String(itemId));
    storedItem[type==='like'?'likes':'views'] += 1;
  }
  res.status(201).json({ ok:true });
});

// In a single-service deployment Express serves the built React app as well as the API.
// During local development Vite serves the interface and proxies /api requests here.
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/.*/, (_req,res) => res.sendFile(path.join(clientDist, 'index.html')));
}

async function start() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS:3500 });
      dbReady=true;
      if (await Item.countDocuments()===0) await Item.insertMany(seed.map(({_id,...rest})=>rest));
      console.log('MongoDB connected.');
    } catch (error) { console.warn(`MongoDB unavailable; using demo data. ${error.message}`); }
  }
  app.listen(PORT,()=>console.log(`Curio API listening at http://localhost:${PORT} (${dbReady?'MongoDB':'demo'} mode)`));
}
start();
