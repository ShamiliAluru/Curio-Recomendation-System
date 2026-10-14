import { useEffect, useMemo, useState } from 'react';
import { getDashboard, getItems, recordActivity } from './api';

function Icon({ name, size=19 }) {
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true};
  const shapes={
    grid:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    compass:<><circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.2 5-5 2.2 2.2-5 5-2.2Z"/></>,
    spark:<><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
    heart:<path d="M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.8 2.3Z"/>,
    search:<><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    arrow:<><path d="M5 12h13"/><path d="m13 6 6 6-6 6"/></>,
    chevron:<path d="m9 18 6-6-6-6"/>,
    bookmark:<path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z"/>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
    eye:<><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,
    bell:<><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>
  };
  return <svg {...common}>{shapes[name]||shapes.spark}</svg>;
}

const navItems=[['Overview','grid'],['For you','spark'],['Explore','compass'],['Saved','bookmark']];
const categories=['All','Lifestyle','Design','Finance','Wellness','Creativity','Productivity'];
const initials=name=>name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();

function Art({ item, large=false }) {
  return <div className={`art ${large?'art-large':''}`} style={{'--art-color':item.color||'#e1e8df'}}>
    <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><span className="art-glyph">{item.cover||'✦'}</span>
    {large&&<span className="art-stamp">CURIO EDITION&nbsp; · &nbsp;NO. 01</span>}
  </div>;
}

function ItemCard({ item, onOpen, onLike, liked }) {
  return <article className="item-card">
    <button className="art-button" onClick={()=>onOpen(item)} aria-label={`Read ${item.title}`}><Art item={item}/></button>
    <div className="item-meta"><span className="category-label">{item.category}</span><span className="read-time"><Icon name="clock" size={13}/>{item.duration}</span></div>
    <button className="item-title" onClick={()=>onOpen(item)}>{item.title}</button>
    <p className="item-creator">By {item.creator}</p>
    <div className="item-foot"><span className="engagement"><Icon name="heart" size={14}/>{item.likes}<span className="mini-sep">·</span><Icon name="eye" size={14}/>{item.views}</span><button className={`like-button ${liked?'is-liked':''}`} onClick={()=>onLike(item)} aria-label={liked?'Already liked':'Like item'}><Icon name="heart" size={16}/></button></div>
  </article>;
}

export default function App(){
  const [data,setData]=useState(null);
  const [items,setItems]=useState([]);
  const [active,setActive]=useState('Overview');
  const [category,setCategory]=useState('All');
  const [search,setSearch]=useState('');
  const [liked,setLiked]=useState(new Set());
  const [selected,setSelected]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  async function refresh(){
    try { const dashboard=await getDashboard(); setData(dashboard); setItems(dashboard.items); setLiked(new Set(dashboard.likedItemIds||[])); setError(''); }
    catch { setError('The demo API is not connected. Start the project with npm run dev and refresh this page.'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{refresh();},[]);
  useEffect(()=>{ if(active==='Explore') getItems(search,category).then(setItems).catch(()=>{}); },[active,search,category]);
  const recommendations=data?.recommendations||[];
  const featured=recommendations[0]||data?.items?.find(x=>x.featured)||data?.items?.[0];
  const list=useMemo(()=>{
    if(!data) return [];
    if(active==='Explore') return items;
    if(active==='Saved') return data.items.filter(i=>liked.has(i._id));
    if(active==='For you') return recommendations.length?recommendations:data.items.filter(i=>i.category===data.preferredCategory).slice(0,4);
    return recommendations.filter(i=>i._id!==featured?._id).slice(0,4);
  },[active,items,data,liked,recommendations,featured]);
  async function action(item,type){
    if(type==='like'&&liked.has(item._id)) return;
    if(type==='like') setLiked(prev=>new Set([...prev,item._id]));
    try { await recordActivity(item._id,type); await refresh(); } catch { setError('Could not save that activity. Check that the API is running.'); }
  }
  async function openItem(item){ setSelected(item); await action(item,'view'); }

  if(loading) return <div className="loading"><div className="brand-mark">c.</div><span>Curating your space…</span></div>;
  if(!data) return <div className="error-page"><div className="brand-mark">c.</div><h1>Let’s get Curio running.</h1><p>{error}</p><code>npm run dev</code><button className="primary-button" onClick={()=>{setLoading(true);refresh();}}>Try again</button></div>;
  const pageTitle=active==='Overview'?'A little more of what you love.':active==='For you'?'Picked for your point of view.':active==='Explore'?'Find your next favorite.':'Your saved collection.';
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={()=>setActive('Overview')}><span className="brand-mark">c.</span><span>curio<span className="brand-dot">.</span></span></button>
      <div className="side-caption">YOUR SPACE</div>
      <nav className="nav-list">{navItems.map(([label,icon])=><button key={label} className={`nav-link ${active===label?'active':''}`} onClick={()=>setActive(label)}><Icon name={icon}/><span>{label}</span>{label==='Saved'&&liked.size>0&&<span className="nav-count">{liked.size}</span>}</button>)}</nav>
      <div className="sidebar-note"><div className="note-icon"><Icon name="spark" size={17}/></div><div><strong>Good taste grows.</strong><p>Your likes and reads help us find more of what feels like you.</p></div></div>
      <div className="sidebar-bottom"><div className="profile-avatar">SA</div><div className="profile-text"><strong>Shamili Aluru</strong><span>Your personal space</span></div><button className="more-button" aria-label="Profile options">···</button></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Your space <span>/</span> <b>{active}</b></div><div className="top-actions"><label className="search-box"><Icon name="search"/><input value={search} onChange={e=>{setSearch(e.target.value);setActive('Explore');}} placeholder="Search something lovely"/><kbd>⌘ K</kbd></label><button className="icon-button notification" aria-label="Notifications"><Icon name="bell"/><i/></button><div className="top-avatar">SA</div></div></header>
      {error&&<div className="inline-alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/>YOUR PERSONAL DISCOVERY JOURNAL</div><h1>{pageTitle}</h1><p className="welcome-sub">A thoughtful collection, shaped by the things you enjoy.</p></div><div className="date-chip"><span className="date-dot"/>YOUR SPACE, YOUR PACE</div></section>

        {active==='Overview'&&featured&&<section className="feature-card"><div className="feature-copy"><div className="feature-kicker"><span className="feature-spark">✳</span> TODAY’S PICK <span className="feature-rule"/></div><div className="feature-tag">{featured.category.toUpperCase()} <span>·</span> {featured.duration.toUpperCase()}</div><h2>{featured.title}</h2><p>{featured.description}</p><div className="feature-author"><div className="author-avatar">{initials(featured.creator)}</div><div><strong>{featured.creator}</strong><span>Curio contributor</span></div></div><button className="primary-button" onClick={()=>openItem(featured)}>Settle in and read <Icon name="arrow" size={16}/></button><div className="feature-pagination"><span className="page-current">01</span><span className="page-bar"><i/></span><span>04</span></div></div><div className="feature-art"><Art item={featured} large/><div className="floating-label"><span>✦</span> A good place to begin</div></div></section>}

        {active==='Overview'&&<section className="insight-row"><div className="section-heading compact-heading"><div><span className="section-overline">YOUR RHYTHM</span><h2>A few things we noticed</h2></div><span className="quiet-label">UPDATED AS YOU EXPLORE</span></div><div className="insight-grid"><div className="insight-card"><div className="insight-icon mint"><Icon name="eye"/></div><div className="insight-number">{data.viewedCount}<span> reads</span></div><div className="insight-label">Things you’ve explored</div><div className="insight-foot">Curiosity looks good on you <span>↗</span></div></div><div className="insight-card"><div className="insight-icon blush"><Icon name="heart"/></div><div className="insight-number">{data.likedCount}<span> saved</span></div><div className="insight-label">Things close to your heart</div><div className="insight-foot">Your likes shape your picks <span>♡</span></div></div><div className="insight-card preference-card"><div className="insight-icon lilac"><Icon name="spark"/></div><div className="preference-name">{data.preferredCategory}</div><div className="insight-label">Your current favorite corner</div><div className="preference-progress"><i style={{width:`${Math.min(92,48+(data.categoryScores?.[data.preferredCategory]||0)*5)}%`}}/></div><div className="insight-foot">Based on what you enjoy <span>✦</span></div></div></div></section>}

        <section className="collection-section"><div className="section-heading"><div><span className="section-overline">{active==='Explore'?'THE WHOLE COLLECTION':active==='Saved'?'KEPT CLOSE':'A GOOD NEXT STEP'}</span><h2>{active==='Explore'?'Explore the collection':active==='Saved'?'Your saved pieces':'Made for your kind of curious'}</h2><p>{active==='Saved'?'A little shelf of things you want to come back to.':`A few ${data.preferredCategory.toLowerCase()} finds, picked around your interests.`}</p></div><button className="text-button" onClick={()=>setActive('Explore')}>See all <Icon name="arrow" size={15}/></button></div>
          {active==='Explore'&&<div className="filter-row">{categories.map(c=><button key={c} className={`filter-chip ${category===c?'selected':''}`} onClick={()=>setCategory(c)}>{c}</button>)}</div>}
          <div className="cards-grid">{list.map(item=><ItemCard key={item._id} item={item} onOpen={openItem} onLike={x=>action(x,'like')} liked={liked.has(item._id)}/>)}</div>
          {list.length===0&&<div className="empty-state"><span>✳</span><h3>{active==='Saved'?'Your shelf is waiting.':'Nothing here just yet.'}</h3><p>Like a few pieces and they’ll find a home here.</p><button className="text-button" onClick={()=>setActive('Explore')}>Explore the collection <Icon name="arrow" size={15}/></button></div>}
        </section>

        <section className="bottom-grid"><div className="trending-panel"><div className="panel-heading"><div><span className="section-overline">COMMUNITY FAVORITES</span><h2>Little things going places</h2></div><span className="trend-mark">↗</span></div><div className="trending-list">{data.trending.slice(0,4).map((item,index)=><button className="trending-row" key={item._id} onClick={()=>openItem(item)}><span className="rank">0{index+1}</span><span className="trend-thumb" style={{'--art-color':item.color}}>{item.cover}</span><span className="trend-info"><strong>{item.title}</strong><small>{item.category} <i>·</i> {item.creator}</small></span><span className="trend-likes"><Icon name="heart" size={14}/>{item.likes}</span><Icon name="chevron" size={16}/></button>)}</div></div><div className="quote-card"><div className="quote-mark">“</div><p>We are what we pay attention to.</p><span>A NOTE TO YOUR FUTURE SELF</span><div className="quote-decoration">✳</div></div></section>
        <footer className="footer"><span>Made for a more curious everyday.</span><span>CURIO <i>·</i> DISCOVER WITH INTENTION</span></footer>
      </div>
    </main>

    {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><article className="reader-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)}>×</button><Art item={selected}/><div className="reader-content"><span className="category-label">{selected.category} · {selected.duration}</span><h2>{selected.title}</h2><p className="reader-byline">A short read by {selected.creator}</p><p className="reader-description">{selected.description} This piece is part of your Curio collection: a small, considered starting point for exploring ideas that make everyday life a little more interesting.</p><button className={`save-reader ${liked.has(selected._id)?'is-liked':''}`} onClick={()=>action(selected,'like')}><Icon name="heart" size={16}/>{liked.has(selected._id)?'Saved to your collection':'Save this for later'}</button></div></article></div>}
  </div>;
}
