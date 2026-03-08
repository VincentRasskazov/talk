import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

const buildDate = process.env.REACT_APP_BUILD_DATE || "Local Dev Mode";
console.log(`%c🚀 TALK POLISH UPDATE \n📅 Built on: ${buildDate}`, "color: #5865F2; font-size: 14px; font-weight: bold; border: 2px solid #5865F2; padding: 10px; border-radius: 8px;");

firebase.initializeApp({
  apiKey: "AIzaSyChrfsHBeDKy56koXEFCPgOPM9f_BJh9Rk",
  authDomain: "chat-65f4a.firebaseapp.com",
  projectId: "chat-65f4a",
  storageBucket: "chat-65f4a.firebasestorage.app",
  messagingSenderId: "512709701751",
  appId: "1:512709701751:web:9f1d34aae5a67aee451672"
});

const auth = firebase.auth();
const firestore = firebase.firestore();
const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGI5Y2VkIiBzdHJva2Utd2lkdGg9IjEyIi8+PHRleHQgeD0iNTMiIHk9Ijg1IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM4YjljZWQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPnQ8L3RleHQ+PC9zdmc+";
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '🔥'];

// --- ERROR HANDLING HELPER ---
const checkQuotaError = (err) => {
  if (!err) return false;
  if (err.code === 'resource-exhausted') return true;
  if (err.message && err.message.toLowerCase().includes('quota')) return true;
  return false;
};

const compressImage = (file, maxWidth, maxHeight, callback) => {
  if (!file) return;
  if (file.size > 800000) return alert("File too large. Please select an image under 800KB.");
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const cvs = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h *= maxWidth / w; w = maxWidth; }
      if (h > maxHeight) { w *= maxHeight / h; h = maxHeight; }
      cvs.width = w; cvs.height = h;
      cvs.getContext('2d').drawImage(img, 0, 0, w, h);
      callback(cvs.toDataURL('image/jpeg', 0.8));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  return isToday ? `Today at ${time}` : `${date.toLocaleDateString()} ${time}`;
};

function useTheme() {
  const [themeColor, setThemeColor] = useState(localStorage.getItem('themeColor') || '#5865F2');
  useEffect(() => { 
    localStorage.setItem('themeColor', themeColor); 
    document.documentElement.style.setProperty('--accent-color', themeColor);
  }, [themeColor]);
  return [themeColor, setThemeColor];
}

// --- LOAD SAVED SETTINGS ---
// --- LOAD SAVED SETTINGS ---
if (localStorage.getItem('compactMode') === 'true') document.body.classList.add('compact-mode');
if (localStorage.getItem('monoFont') === 'true') document.body.classList.add('hacker-mode');


// --- LIVE QUOTA COUNTDOWN ---
function QuotaBanner() {
  const [timeLeft, setTimeLeft] = useState('');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      // Calculate Pacific Time
      const ptDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      // Get Next Midnight PT
      const nextMidnightPT = new Date(ptDate.getFullYear(), ptDate.getMonth(), ptDate.getDate() + 1);
      // Get MS difference
      const msUntilMidnight = nextMidnightPT.getTime() - ptDate.getTime();
      
      if (!localTime) {
        const resetDateLocal = new Date(now.getTime() + msUntilMidnight);
        setLocalTime(resetDateLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }

      const hrs = Math.floor((msUntilMidnight / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((msUntilMidnight / 1000 / 60) % 60);
      const secs = Math.floor((msUntilMidnight / 1000) % 60);
      setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [localTime]);

  return (
    <div className="quota-error-banner">
      ⚠️ Firebase Daily Quota Exceeded. The server resets in {timeLeft} (at {localTime} your local time).
    </div>
  );
}

const EmptyServerState = () => (
  <div className="empty-state">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
    <h2>No Server Selected</h2>
    <p>Select a server from the sidebar on the left, or join a new one to start chatting.</p>
  </div>
);

const EmptyChannelState = () => (
  <div className="empty-state">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/></svg>
    <h2>No Channel Selected</h2>
    <p>Select a text channel from the menu to see messages and participate in the conversation.</p>
  </div>
);

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [themeColor, setThemeColor] = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [consoleQuotaError, setConsoleQuotaError] = useState(false); // <-- ADD THIS LINE

  const userRef = user ? firestore.collection('users').doc(user.uid) : null;
  const [userDoc, userLoading, userError] = useDocumentData(userRef);
// --- CONSOLE WIRETAP ---
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorString = args.join(' ');
      if (errorString.includes('Quota') || errorString.includes('resource-exhausted')) {
        setConsoleQuotaError(true);
      }
      originalConsoleError.apply(console, args);
    };
    return () => { console.error = originalConsoleError; };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (userDoc && userDoc.banned) return;
    if (userRef) {
      userRef.set({ uid: user.uid, email: user.email || '', displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'), photoURL: user.photoURL || DEFAULT_AVATAR }, { merge: true }).catch(e => console.warn(e));
    }
  }, [user]);

  if (loading) return <div style={{background: '#313338', height: '100%'}}></div>;

  return (
    <div className="app-wrapper" style={{'--accent-color': themeColor}}>
      {(checkQuotaError(userError) || consoleQuotaError) && <QuotaBanner />}
      
      {zoomImage && (
        <div className="overlay" onClick={() => setZoomImage(null)} style={{zIndex: 2000, cursor: 'zoom-out'}}>
          <img src={zoomImage} className="lightbox-img" alt="Zoomed" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {(!user && !showAuth) && <div className="guest-banner">Previewing in Guest Mode. Login to chat and interact.</div>}

      {userDoc && userDoc.banned ? (
        <div className="signin-container" style={{flexDirection: 'column', color: 'white'}}>
          <h1 style={{color: '#da373c'}}>Account Banned</h1>
          <p style={{color:'#949ba4'}}>You have been removed from the platform.</p>
          <button className="auth-btn" onClick={() => auth.signOut()} style={{background:'#da373c', width: 'fit-content', padding: '10px 24px'}}>Log Out</button>
        </div>
      ) : showAuth && !user ? (
        <AuthScreen themeColor={themeColor} goBack={() => setShowAuth(false)} />
      ) : (
        <MainApp themeColor={themeColor} setThemeColor={setThemeColor} isGuest={!user} onLoginClick={() => setShowAuth(true)} setZoomImage={setZoomImage} />
      )}
    </div>
  );
}

function AuthScreen({ themeColor, goBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault(); setError('');
    try { 
      if (isLogin) await auth.signInWithEmailAndPassword(email, password);
      else await auth.createUserWithEmailAndPassword(email, password);
    } catch (err) { setError(err.message); }
  };
  
  return (
    <div className="signin-container">
      <div className="auth-box">
        <button onClick={goBack} style={{position:'absolute', top:10, left:10, background:'none', color:'#80848e', fontSize:20}}>←</button>
        <img src={DEFAULT_AVATAR} alt="logo" style={{width: 80, margin: '0 auto'}} />
        <h2 style={{margin: '10px 0 0 0', color: '#fff', textAlign: 'center'}}>{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
        <p style={{color: '#b5bac1', textAlign: 'center', fontSize: 14, margin: '4px 0 20px 0'}}>{isLogin ? "We're so excited to see you again!" : "Join the community today."}</p>
        
        <form onSubmit={handleAuth} style={{display:'flex', flexDirection:'column', width:'100%', padding:0, background:'none', boxShadow:'none', height: 'auto', margin: 0}}>
          <div className="auth-input-group">
            <label className="auth-label">Email</label>
            <input type="email" className="auth-input" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input type="password" className="auth-input" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="auth-btn" style={{background: themeColor}}>{isLogin ? 'Log In' : 'Sign Up'}</button>
        </form>
        
        {error && <p style={{color: '#da373c', fontSize: '13px', textAlign: 'center', margin:'10px 0 0 0'}}>{error}</p>}
        
        <p style={{fontSize: 13, margin:'16px 0 0 0', color: '#949ba4'}}>
          {isLogin ? 'Need an account? ' : 'Already have an account? '}
          <span style={{color: themeColor, cursor: 'pointer', fontWeight: 'bold'}} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Log In'}
          </span>
        </p>
        <button className="auth-btn" style={{background:'#f2f3f5', color:'#1e1f22'}} onClick={() => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())}>Continue with Google</button>
      </div>
    </div>
  );
}

function ProfileModal({ userProfile, close, themeColor, isGuest, onLoginClick, startDM, isSelf }) {
  if(!userProfile) return null;
  return (
    <div className="overlay" onClick={close} style={{zIndex: 1005}}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{paddingTop: 0}}>
        <button onClick={close} style={{position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.5)', color:'#fff', borderRadius:'50%', width:28, height:28, zIndex:10, display:'flex', justifyContent:'center', alignItems:'center', padding:0}}>✕</button>
        <div className="profile-banner" style={{background: userProfile.bannerURL ? 'transparent' : themeColor, backgroundImage: userProfile.bannerURL ? `url(${userProfile.bannerURL})` : 'none'}}>
          <img src={userProfile.photoURL || DEFAULT_AVATAR} className="profile-avatar" alt="pfp" />
        </div>
        <div style={{marginTop: 50}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h2 style={{margin: '0', color: '#fff'}}>{userProfile.displayName}</h2>
            {userProfile.pronouns && <span style={{background:'#1e1f22', padding:'4px 8px', borderRadius:4, fontSize:12, color:'#dbdee1', fontWeight:'bold'}}>{userProfile.pronouns}</span>}
          </div>
          {isSelf && <span style={{color: '#949ba4', fontSize: 13}}>{userProfile.email}</span>}
          {userProfile.statusText && <div style={{marginTop: 10, fontStyle: 'italic', color: '#dbdee1', fontSize: 14}}>"{userProfile.statusText}"</div>}

          <div style={{background: '#1e1f22', padding: 16, borderRadius: 8, marginTop: 16, border: '1px solid rgba(255,255,255,0.05)'}}>
            <h4 style={{margin: '0 0 8px 0', color: '#b5bac1', fontSize: 12, textTransform: 'uppercase'}}>About Me</h4>
            <p style={{margin: 0, color: '#dbdee1', fontSize: 14, lineHeight: 1.5}}>{userProfile.bio || "No bio provided."}</p>
          </div>
          {!isGuest && !isSelf && (
            <button onClick={() => { close(); startDM(userProfile); }} style={{width: '100%', padding: 14, background: themeColor, color: '#fff', marginTop: 16, borderRadius: 6, border: 'none', fontWeight: 'bold'}}>Send Message</button>
          )}
          {isGuest && <button onClick={onLoginClick} style={{width: '100%', padding: 14, background: '#4e5058', color: '#fff', marginTop: 16, borderRadius: 6, border: 'none', fontWeight: 'bold'}}>Log in to interact</button>}
        </div>
      </div>
    </div>
  )
}

function MainApp({ themeColor, setThemeColor, isGuest, onLoginClick, setZoomImage }) {
  const [view, setView] = useState('servers');
  const [currentServer, setCurrentServer] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [activeDM, setActiveDM] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [channelsOpenPC, setChannelsOpenPC] = useState(true);

  const isAdmin = !isGuest && auth.currentUser && auth.currentUser.email === 'vincentr111222@gmail.com';
  
  // Checking for Errors directly from the hooks
  const [allServers, serversLoading, serversError] = useCollectionData(firestore.collection('servers').orderBy('createdAt'), { idField: 'id' });
  const [allUsers, usersLoading, usersError] = useCollectionData(firestore.collection('users'));
  
  const dmsQuery = !isGuest && auth.currentUser ? firestore.collection('dms').where('users', 'array-contains', auth.currentUser.uid) : null;
  const [allDMs, dmsLoading, dmsError] = useCollectionData(dmsQuery, { idField: 'id' });

  const isQuotaExceeded = checkQuotaError(serversError) || checkQuotaError(usersError) || checkQuotaError(dmsError);

  let servers = [];
  if (allServers) {
    servers = allServers.filter(s => {
      if (isAdmin) return true;
      if (!s.isPrivate) return true;
      if (!isGuest && s.members && auth.currentUser && s.members.includes(auth.currentUser.uid)) return true;
      return false;
    });
  }

  let currentUserData = null;
  if (allUsers && auth.currentUser) {
    currentUserData = allUsers.find(u => u.uid === auth.currentUser.uid);
  }

  useEffect(() => { 
    if (servers.length > 0 && !currentServer && view === 'servers') {
      setCurrentServer(servers[0]); 
    }
  }, [servers, currentServer, view]);

  const startDM = async (targetUser) => {
    if (isGuest || !auth.currentUser) return;
    const uid1 = auth.currentUser.uid; 
    const uid2 = targetUser.uid;
    const dmId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    try {
      const dmRef = firestore.collection('dms').doc(dmId);
      const doc = await dmRef.get();
      if (!doc.exists) {
        await dmRef.set({ users: [uid1, uid2], updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      setView('dms'); 
      setActiveDM({ id: dmId, target: targetUser });
    } catch(err) {
      if(checkQuotaError(err)) alert("Daily quota exceeded. Please try again tomorrow.");
    }
  };

  const closeAllMenus = () => setMobileNavOpen(false);

  return (
    <>
      {isQuotaExceeded && (
        <div className="quota-error-banner">
          ⚠️ Firebase Daily Quota Exceeded. Content may fail to load. The database will reset at Midnight Pacific Time (PT).
        </div>
      )}
      <div className={`discord-layout ${localStorage.getItem('reverseLayout') === 'true' ? 'layout-reverse' : ''}`}>
        {showSettings && !isGuest && <SettingsModal close={()=>setShowSettings(false)} theme={themeColor} setTheme={setThemeColor} isAdmin={isAdmin} userDoc={currentUserData} allUsers={allUsers} allServers={allServers} />}
        {editingServer && !isGuest && <ServerSettingsModal server={editingServer} close={()=>setEditingServer(null)} theme={themeColor} />}
        <ProfileModal userProfile={selectedUser} close={()=>setSelectedUser(null)} themeColor={themeColor} isGuest={isGuest} onLoginClick={onLoginClick} startDM={startDM} isSelf={selectedUser && auth.currentUser && selectedUser.uid === auth.currentUser.uid} />
        
        {mobileNavOpen && <div className="mobile-overlay open" onClick={closeAllMenus}></div>}

        <div className="sidebar" style={{paddingTop: 12}}>
          <div className="server-icon-wrapper" onClick={() => { setView('dms'); setMobileNavOpen(true); setCurrentServer(null); }}>
            <img src={DEFAULT_AVATAR} className={`server-icon ${view === 'dms' ? 'active' : ''}`} alt="DM" style={{borderRadius: view==='dms'?16:24}} />
          </div>
          <div className="divider"></div>
          {servers.map(s => {
            const isActive = currentServer && currentServer.id === s.id && view === 'servers';
            const hasImage = s.icon && s.icon.startsWith('data:');
            return (
              <div key={s.id} className={`server-icon-wrapper ${isActive ? 'active' : ''}`} onClick={() => { setView('servers'); setCurrentServer(s); setCurrentChannel(null); setMobileNavOpen(true); }}>
                <div className={`server-icon ${isActive ? 'active' : ''}`} style={hasImage ? {backgroundImage: `url(${s.icon})`} : {}} title={s.name}>
                  {!hasImage ? (s.icon || (s.name ? s.name.charAt(0).toUpperCase() : '?')) : ''}
                  {isAdmin && <div className="server-actions">
                    <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); setEditingServer(s); }}>✎</button>
                  </div>}
                </div>
              </div>
            )
          })}
          {isAdmin && <div className="server-icon-wrapper" onClick={async () => { 
            const n = prompt("Server Name:"); 
            if(n) {
              try { await firestore.collection('servers').add({ name: n, icon: n.charAt(0).toUpperCase(), isPrivate: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() }); }
              catch(err){ if(checkQuotaError(err)) alert("Action failed: Quota Exceeded."); }
            }
          }}>
            <div className="server-icon server-add-btn">+</div>
          </div>}
          {!isAdmin && !isGuest && <div className="server-icon-wrapper" onClick={async () => {
            const c = prompt("Enter 6-digit Code:"); if(!c) return;
            const match = allServers.find(s => s.inviteCode === c.toUpperCase());
            if(match) { 
              try { await firestore.collection('servers').doc(match.id).update({ members: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid) }); alert("Joined!"); }
              catch(err){ if(checkQuotaError(err)) alert("Action failed: Quota Exceeded."); }
            } else alert("Invalid code.");
          }}>
            <div className="server-icon server-join-btn">Join</div>
          </div>}
        </div>

        {view === 'servers' && currentServer ? (
          <ServerContent server={currentServer} channel={currentChannel} setChannel={setCurrentChannel} isAdmin={isAdmin} isGuest={isGuest} theme={themeColor} onLoginClick={onLoginClick} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} closeAllMenus={closeAllMenus} channelsOpenPC={channelsOpenPC} setChannelsOpenPC={setChannelsOpenPC} allUsers={allUsers} openProfile={setSelectedUser} myData={currentUserData} openSettings={()=>setShowSettings(true)} setZoomImage={setZoomImage} />
        ) : view === 'dms' && !isGuest ? (
          <DMContent dms={allDMs} activeDM={activeDM} setActiveDM={setActiveDM} allUsers={allUsers} theme={themeColor} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} closeAllMenus={closeAllMenus} channelsOpenPC={channelsOpenPC} setChannelsOpenPC={setChannelsOpenPC} myData={currentUserData} openSettings={()=>setShowSettings(true)} openProfile={setSelectedUser} setZoomImage={setZoomImage} />
        ) : (
          <EmptyServerState />
        )}
      </div>
    </>
  );
}

function ServerContent({ server, channel, setChannel, isAdmin, isGuest, theme, onLoginClick, mobileNavOpen, setMobileNavOpen, closeAllMenus, channelsOpenPC, setChannelsOpenPC, allUsers, openProfile, myData, openSettings, setZoomImage }) {
  const dummy = useRef();
  const [form, setForm] = useState(''); const [file, setFile] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const channelsRef = firestore.collection(`servers/${server.id}/channels`);
  const [channels] = useCollectionData(channelsRef.orderBy('createdAt'), { idField: 'id' });
  const msgsRef = channel ? firestore.collection(`servers/${server.id}/channels/${channel.id}/messages`) : null;
  const [messages] = useCollectionData(msgsRef ? msgsRef.orderBy('createdAt').limit(50) : null, { idField: 'id' });

  useEffect(() => { 
    if (channels && channels.length > 0 && !channel) {
      setChannel(channels[0]); 
    }
  }, [channels, channel, setChannel]);

  const toggleSidebar = () => { 
    if (window.innerWidth <= 768) {
      setMobileNavOpen(true); 
    } else {
      setChannelsOpenPC(!channelsOpenPC); 
    }
  };

  const sendMsg = async (e) => {
    e.preventDefault(); 
    if(isGuest) return onLoginClick();
    if (!form.trim() && !file) return;
    if (msgsRef && auth.currentUser) {
      try {
        await msgsRef.add({ text: form, fileData: file ? file.data : null, fileType: file ? file.type : null, fileName: file ? file.name : null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: auth.currentUser.uid, photoURL: myData ? myData.photoURL : DEFAULT_AVATAR, displayName: myData ? myData.displayName : 'User' });
        setForm(''); setFile(null); 
        if(dummy.current) dummy.current.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        if(checkQuotaError(err)) alert("Message failed to send: Daily Quota Exceeded. Try again tomorrow.");
      }
    }
  };

  const handleFile = (e) => {
    if(isGuest) return onLoginClick();
    const f = e.target.files[0]; if(!f) return;
    if(f.size > 500000) return alert("File too large. Max 500KB.");
    const reader = new FileReader();
    reader.onload = (ev) => {
      if(f.type.startsWith('image/')) {
        const img = new Image(); img.onload = () => {
          const cvs = document.createElement('canvas'); let w=img.width, h=img.height; if(w>800){h*=800/w; w=800;} cvs.width=w; cvs.height=h; cvs.getContext('2d').drawImage(img,0,0,w,h);
          setFile({ data: cvs.toDataURL(f.type, 0.7), type: 'image', name: f.name });
        }; img.src = ev.target.result;
      } else setFile({ data: ev.target.result, type: 'file', name: f.name });
    }; reader.readAsDataURL(f);
  };

  const members = allUsers ? allUsers.filter(u => {
    if (u.banned) return false;
    if (isAdmin) return true;
    if (!server.isPrivate) return true;
    if (server.members && server.members.includes(u.uid)) return true;
    return false;
  }) : [];

  return (
    <>
      <div className={`channels ${mobileNavOpen ? 'open' : ''} ${!channelsOpenPC ? 'closed' : ''}`}>
        <div className="channels-header" style={server.bannerURL ? {backgroundImage: `url(${server.bannerURL})`} : {}}>
          {server.bannerURL && <div className="channels-header-overlay"></div>}
          <h3 style={{position: 'relative', zIndex: 1, textShadow: server.bannerURL ? '0 2px 4px rgba(0,0,0,0.9)' : 'none', color: server.bannerURL ? '#fff' : '#f2f3f5'}}>{server.name}</h3>
          {isAdmin && <button className="add-btn" onClick={async()=>{
            const n=prompt("Channel Name:"); 
            if(n) {
              try { await channelsRef.add({name: n.toLowerCase(), createdAt: firebase.firestore.FieldValue.serverTimestamp()}) }
              catch(err){ if(checkQuotaError(err)) alert("Action failed: Quota Exceeded."); }
            }
          }}>+</button>}
        </div>
        <div className="channel-list">
          {channels && channels.map(c => (
            <div key={c.id} className={`channel ${channel && channel.id===c.id ? 'active':''}`} onClick={()=>{setChannel(c); closeAllMenus();}}>
              <span className="channel-name"><span className="hash-icon">#</span> {c.name}</span>
              {isAdmin && <button className="del-btn" onClick={async(e)=>{e.stopPropagation(); if(window.confirm("Delete channel?")) await channelsRef.doc(c.id).delete();}}>✕</button>}
            </div>
          ))}
        </div>
        <div className="user-panel">
          <div className="user-panel-info" onClick={()=>!isGuest && openProfile(myData)}>
            <div className="avatar-container"><img src={isGuest ? DEFAULT_AVATAR : (myData ? myData.photoURL : DEFAULT_AVATAR)} alt="PFP" /></div>
            <div><strong>{isGuest?'Guest':(myData ? myData.displayName : 'User')}</strong></div>
          </div>
          {!isGuest ? <button className="settings-btn" onClick={openSettings}>⚙️</button> : <button className="auth-btn" onClick={onLoginClick} style={{margin:0, padding:'8px 12px', width:'auto', background:theme}}>Login</button>}
        </div>
      </div>

      <div className="chat-container">
        {channel ? (
          <>
            <header>
              <div className="header-left">
                <button className="mobile-nav-toggle" onClick={toggleSidebar}>☰</button>
                <div className="header-title">
                  <span className="hash-icon" style={{color: '#80848e', marginRight: 6}}>#</span> {channel.name} 
                  {server.description && <span style={{marginLeft: 12, paddingLeft: 12, borderLeft: '1px solid #3f4147', fontSize: 13, color: '#949ba4', fontWeight: '500'}}>{server.description}</span>}
                </div>
              </div>
              <button className="member-toggle" onClick={()=>setShowMembers(!showMembers)} style={{color: showMembers?theme:''}}>👥</button>
            </header>
            <main>
              {messages && messages.map(m => {
                const authorData = allUsers ? allUsers.find(u => u.uid === m.uid) : null;
                return <ChatMessage key={m.id} msg={m} msgRef={msgsRef.doc(m.id)} isAdmin={isAdmin} isGuest={isGuest} theme={theme} openProfile={()=>openProfile(authorData || m)} onLoginClick={onLoginClick} setZoomImage={setZoomImage} />
              })}
              <span ref={dummy}></span>
            </main>
            <div className="form-wrapper">
              {file && <div className="file-preview">{file.type==='image'?<img src={file.data} alt="prv"/>:<span>📎 {file.name}</span>}<button onClick={()=>setFile(null)}>✕</button></div>}
              {isGuest ? <div style={{background:'#2b2d31', padding:16, borderRadius:8, textAlign:'center', marginTop: 8, border: '1px solid #1e1f22'}}><button className="auth-btn" onClick={onLoginClick} style={{background:theme, width:'auto', margin:0}}>Login to Send Messages</button></div> : 
              <form onSubmit={sendMsg}>
                <div className="upload-btn">
                  <label style={{cursor: 'pointer', margin: 0, display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>+</label>
                  <input type="file" style={{display:'none'}} onChange={handleFile} />
                </div>
                <input type="text" value={form} onChange={e=>setForm(e.target.value)} placeholder={`Message #${channel.name}`} />
                <button type="submit" style={{display:'none'}}></button>
              </form>}
            </div>
          </>
        ) : <EmptyChannelState />}
      </div>

      {showMembers && <div className="mobile-overlay open" onClick={()=>setShowMembers(false)} style={{zIndex: 104}}></div>}
      <div className={`member-list ${!showMembers ? 'hidden' : ''} ${showMembers && window.innerWidth <= 900 ? 'mobile-open' : ''}`}>
        <div className="member-group-title">Members — {members.length}</div>
        {members.map(u => (
          <div className="member-item" key={u.uid} onClick={()=>{openProfile(u); setShowMembers(false);}}>
            <img src={u.photoURL||DEFAULT_AVATAR} alt="user" />
            <span style={{color: u.email==='vincentr111222@gmail.com' ? '#f0b232':''}}>{u.displayName}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function DMContent({ dms, activeDM, setActiveDM, allUsers, theme, mobileNavOpen, setMobileNavOpen, closeAllMenus, channelsOpenPC, setChannelsOpenPC, myData, openSettings, openProfile, setZoomImage }) {
  const dummy = useRef(); const [form, setForm] = useState(''); const [file, setFile] = useState(null);
  
  const msgsRef = activeDM ? firestore.collection(`dms/${activeDM.id}/messages`) : null;
  const [messages] = useCollectionData(msgsRef ? msgsRef.orderBy('createdAt').limit(50) : null, { idField: 'id' });

  const toggleSidebar = () => { 
    if (window.innerWidth <= 768) {
      setMobileNavOpen(true); 
    } else {
      setChannelsOpenPC(!channelsOpenPC); 
    }
  };

  const sendMsg = async (e) => {
    e.preventDefault(); if (!form.trim() && !file) return;
    if (msgsRef && auth.currentUser) {
      try {
        await msgsRef.add({ text: form, fileData: file ? file.data : null, fileType: file ? file.type : null, fileName: file ? file.name : null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: auth.currentUser.uid, photoURL: myData ? myData.photoURL : DEFAULT_AVATAR, displayName: myData ? myData.displayName : 'User' });
        await firestore.collection('dms').doc(activeDM.id).update({ updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        setForm(''); setFile(null); 
        if(dummy.current) dummy.current.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        if(checkQuotaError(err)) alert("Message failed to send: Daily Quota Exceeded. Try again tomorrow.");
      }
    }
  };

  const handleFile = (e) => {
    const f = e.target.files[0]; if(!f) return;
    if(f.size > 500000) return alert("Max 500KB.");
    const reader = new FileReader();
    reader.onload = (ev) => {
      if(f.type.startsWith('image/')) {
        const img = new Image(); img.onload = () => {
          const cvs = document.createElement('canvas'); let w=img.width, h=img.height; if(w>800){h*=800/w; w=800;} cvs.width=w; cvs.height=h; cvs.getContext('2d').drawImage(img,0,0,w,h);
          setFile({ data: cvs.toDataURL(f.type, 0.7), type: 'image', name: f.name });
        }; img.src = ev.target.result;
      } else setFile({ data: ev.target.result, type: 'file', name: f.name });
    }; reader.readAsDataURL(f);
  };

  let sortedDMs = [];
  if (dms) {
    sortedDMs = [...dms].sort((a,b) => {
      const timeA = (a && a.updatedAt && a.updatedAt.toMillis) ? a.updatedAt.toMillis() : 0;
      const timeB = (b && b.updatedAt && b.updatedAt.toMillis) ? b.updatedAt.toMillis() : 0;
      return timeB - timeA;
    });
  }

  return (
    <>
      <div className={`channels ${mobileNavOpen ? 'open' : ''} ${!channelsOpenPC ? 'closed' : ''}`}>
        <div className="channels-header"><h3>Direct Messages</h3></div>
        <div className="channel-list">
          {sortedDMs.map(dm => {
            const otherUid = dm.users.find(id => auth.currentUser && id !== auth.currentUser.uid);
            const otherUser = allUsers ? allUsers.find(u => u.uid === otherUid) : null;
            if(!otherUser) return null;
            return (
              <div key={dm.id} className={`channel ${activeDM && activeDM.id===dm.id ? 'active':''}`} onClick={()=>{setActiveDM({id: dm.id, target: otherUser}); closeAllMenus();}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}><img src={otherUser.photoURL || DEFAULT_AVATAR} style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} alt="" />{otherUser.displayName}</div>
              </div>
            )
          })}
        </div>
        <div className="user-panel">
          <div className="user-panel-info" onClick={()=>openProfile(myData)}>
            <div className="avatar-container"><img src={myData ? myData.photoURL : DEFAULT_AVATAR} alt="PFP" /></div>
            <div><strong>{myData ? myData.displayName : 'User'}</strong></div>
          </div>
          <button className="settings-btn" onClick={openSettings}>⚙️</button>
        </div>
      </div>

      <div className="chat-container">
        {activeDM ? (
          <>
            <header>
              <div className="header-left">
                <button className="mobile-nav-toggle" onClick={toggleSidebar}>☰</button>
                <div className="header-title">@{activeDM.target.displayName}</div>
              </div>
            </header>
            <main>
              {messages && messages.map(m => {
                 const authorData = allUsers ? allUsers.find(u => u.uid === m.uid) : null;
                 return <ChatMessage key={m.id} msg={m} msgRef={msgsRef.doc(m.id)} isAdmin={false} isGuest={false} theme={theme} openProfile={()=>openProfile(authorData || m)} setZoomImage={setZoomImage} />
              })}
              <span ref={dummy}></span>
            </main>
            <div className="form-wrapper">
              {file && <div className="file-preview">{file.type==='image'?<img src={file.data} alt="prv"/>:<span>📎 {file.name}</span>}<button onClick={()=>setFile(null)}>✕</button></div>}
              <form onSubmit={sendMsg}>
                <div className="upload-btn">
                  <label style={{cursor: 'pointer', margin: 0, display: 'flex', width:'100%', height:'100%', justifyContent:'center', alignItems:'center'}}>+</label>
                  <input type="file" style={{display:'none'}} onChange={handleFile} />
                </div>
                <input type="text" value={form} onChange={e=>setForm(e.target.value)} placeholder={`Message @${activeDM.target.displayName}`} />
              </form>
            </div>
          </>
        ) : <EmptyChannelState />}
      </div>
    </>
  )
}

function ChatMessage({ msg, msgRef, isAdmin, isGuest, theme, openProfile, onLoginClick, setZoomImage }) {
  const toggleReact = async (em) => {
    if(isGuest || !auth.currentUser) {
      if (onLoginClick) onLoginClick();
      return;
    }
    const r = msg.reactions || {}; 
    const uids = r[em] || [];
    let newUids = [];
    if (uids.includes(auth.currentUser.uid)) {
       newUids = uids.filter(id => id !== auth.currentUser.uid);
    } else {
       newUids = [...uids, auth.currentUser.uid];
    }
    const newR = {...r}; 
    if(newUids.length===0) {
      delete newR[em]; 
    } else {
      newR[em] = newUids;
    }
    
    try {
      await msgRef.set({ reactions: newR }, { merge: true });
    } catch (err) {
      if (checkQuotaError(err)) alert("Action failed: Quota Exceeded.");
    }
  };
  
  return (
    <div className="message">
      <img className="message-avatar" src={msg.photoURL || DEFAULT_AVATAR} alt="user" onClick={openProfile} />
      <div className="message-content">
        <div className="msg-author-row">
          <span className="msg-author" onClick={openProfile}>{msg.displayName}</span>
          <span className="msg-timestamp">{formatTimestamp(msg.createdAt)}</span>
        </div>
        {msg.text && <p>{msg.text}</p>}
        {msg.fileData && msg.fileType==='image' && <img src={msg.fileData} className="msg-img" alt="attachment" onClick={()=>setZoomImage(msg.fileData)} />}
        {msg.fileData && msg.fileType==='file' && <a href={msg.fileData} download={msg.fileName} className="msg-file">📎 Download {msg.fileName}</a>}
        
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div className="reactions-display">
            {Object.entries(msg.reactions).map(([em, uids]) => (
              <div key={em} className={`reaction-pill ${auth.currentUser && uids.includes(auth.currentUser.uid)?'reacted':''}`} onClick={()=>toggleReact(em)} style={auth.currentUser && uids.includes(auth.currentUser.uid) ? {borderColor:theme, color:theme} : {}}>
                {em} <span>{uids.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {!isGuest && (
        <div className="msg-hover-actions">
          {EMOJI_LIST.map(em => <button key={em} className="react-btn" onClick={()=>toggleReact(em)}>{em}</button>)}
          {(auth.currentUser && msg.uid === auth.currentUser.uid) || isAdmin ? <button onClick={()=>msgRef.delete()} style={{background:'none', color:'#da373c', fontSize:11, fontWeight: 'bold', marginLeft: 8}}>DEL</button> : null}
        </div>
      )}
    </div>
  )
}

function SettingsModal({ close, theme, setTheme, isAdmin, userDoc, allUsers, allServers }) {
  const [tab, setTab] = useState('acc'); 
  const [name, setName] = useState(userDoc ? userDoc.displayName : ''); 
  const [bio, setBio] = useState(userDoc ? userDoc.bio : '');
  const [statusText, setStatusText] = useState(userDoc ? userDoc.statusText : '');
  const [pronouns, setPronouns] = useState(userDoc ? userDoc.pronouns : '');
  const [photo, setPhoto] = useState(userDoc ? userDoc.photoURL : DEFAULT_AVATAR);
  const [bannerURL, setBannerURL] = useState(userDoc ? userDoc.bannerURL : '');

  const save = async () => { 
    if (auth.currentUser) {
      try {
        await firestore.collection('users').doc(auth.currentUser.uid).set({ displayName: name, bio, statusText, pronouns, photoURL: photo, bannerURL }, {merge:true}); 
        await auth.currentUser.updateProfile({ displayName: name, photoURL: photo }); 
        close(); 
      } catch (err) {
        if (checkQuotaError(err)) alert("Save failed: Daily Quota Exceeded. Try again tomorrow.");
      }
    }
  };

  return (
    <div className="overlay">
      <div className="settings-layout">
        <div className="settings-sidebar">
          <div className="settings-nav">
            <h4>User Settings</h4>
            <div className={`settings-tab ${tab === 'acc' ? 'active' : ''}`} onClick={()=>setTab('acc')}>My Account</div>
            <div className={`settings-tab ${tab === 'profile' ? 'active' : ''}`} onClick={()=>setTab('profile')}>Profiles</div>
            <div className={`settings-tab ${tab === 'app' ? 'active' : ''}`} onClick={()=>setTab('app')}>App Settings</div>
            {isAdmin && <div className={`settings-tab ${tab === 'admin' ? 'active' : ''}`} onClick={()=>setTab('admin')} style={{color: '#f0b232'}}>Admin Panel</div>}
            <div className="settings-divider"></div>
            <div className="settings-tab logout" onClick={() => auth.signOut()} style={{color: '#da373c'}}>Log Out</div>
          </div>
        </div>
        <div className="settings-content">
          <button className="close-settings" onClick={close}>✕</button>
          
          {tab === 'acc' && (
            <>
              <h2 style={{color: '#fff', marginTop: 0}}>My Account</h2>
              <div className="settings-card">
                <label>DISPLAY NAME</label><input value={name} onChange={e=>setName(e.target.value)} />
                <label style={{marginTop: 16}}>EMAIL</label><input value={auth.currentUser ? auth.currentUser.email : ''} disabled style={{opacity: 0.5}} />
              </div>
              <div className="settings-card">
                <h3 style={{color:'#fff', margin: 0}}>Authentication</h3>
                <p style={{color:'#949ba4', fontSize: 13, marginTop: 4, marginBottom: 16}}>Link a Google account or log out of your session.</p>
                <button className="save-btn" onClick={() => auth.currentUser.linkWithPopup(new firebase.auth.GoogleAuthProvider()).then(()=>alert('Linked!')).catch(e=>alert(e.message))} style={{background:'#f2f3f5', color:'#1e1f22', width: 'fit-content'}}>Link Google Account</button>
              </div>
            </>
          )}

          {tab === 'profile' && (
            <>
              <h2 style={{color: '#fff', marginTop: 0}}>Profile Customization</h2>
              <div className="settings-card">
                <div style={{display:'flex', gap:20, alignItems:'center', marginBottom: 24}}>
                  <img src={photo} alt="Avatar" style={{width: 80, height: 80, minWidth: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme}`}} />
                  <label className="b64-upload-btn">Upload Avatar<input type="file" accept="image/*" onChange={(e) => compressImage(e.target.files[0], 150, 150, setPhoto)} /></label>
                </div>
                <div style={{marginBottom: 24}}>
                  <div style={{width: '100%', height: 100, borderRadius: 8, background: bannerURL ? `url(${bannerURL}) center/cover` : theme, marginBottom: 12}}></div>
                  <label className="b64-upload-btn">Upload Profile Banner<input type="file" accept="image/*" onChange={(e) => compressImage(e.target.files[0], 600, 200, setBannerURL)} /></label>
                </div>
                
                <label>CUSTOM STATUS</label><input value={statusText} onChange={e=>setStatusText(e.target.value)} placeholder="Playing a game, working, etc..." />
                <label style={{marginTop: 16}}>PRONOUNS</label><input value={pronouns} onChange={e=>setPronouns(e.target.value)} placeholder="They/Them" />
                <label style={{marginTop: 16}}>ABOUT ME</label><textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Tell the world about yourself..." style={{resize: 'none'}} />
                
                <button className="save-btn" onClick={save} style={{background:theme, marginTop:24, width: 'fit-content'}}>Save Changes</button>
              </div>
            </>
          )}

          {tab === 'app' && (
            <>
              <h2 style={{color: '#fff', marginTop: 0}}>App Settings</h2>
              
              <div className="settings-card">
                <h3 style={{color:'#fff', margin:0}}>Theme Color</h3>
                <p style={{color:'#949ba4', fontSize: 13, marginTop: 4, marginBottom: 16}}>Customize the main accent color of the app.</p>
                <div className="color-picker" style={{display:'flex', gap:12}}>
                  {['#5865F2','#da373c','#23a559','#f0b232','#eb459e','#9b59b6', '#8b9ced'].map(c=><div key={c} onClick={()=>setTheme(c)} style={{width:36,height:36,borderRadius:'50%',background:c, cursor:'pointer', border: theme===c?'3px solid #fff':'none', transition: '0.2s', transform: theme===c?'scale(1.1)':'scale(1)'}}/>)}
                </div>
              </div>

              <div className="settings-card">
                <h3 style={{color:'#fff', margin:0}}>Appearance Tweaks</h3>
                <p style={{color:'#949ba4', fontSize: 13, marginTop: 4, marginBottom: 16}}>Customize how the app feels on your device.</p>
                
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: '#1e1f22', padding: 12, borderRadius: 6, marginBottom: 8}}>
                  <strong style={{color:'#dbdee1', fontSize:14}}>Compact Message Mode</strong>
                  <input type="checkbox" className="settings-checkbox" defaultChecked={localStorage.getItem('compactMode') === 'true'} onChange={(e) => {
                    localStorage.setItem('compactMode', e.target.checked);
                    if(e.target.checked) document.body.classList.add('compact-mode');
                    else document.body.classList.remove('compact-mode');
                  }} />
                </div>

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: '#1e1f22', padding: 12, borderRadius: 6, marginBottom: 8}}>
                  <strong style={{color:'#dbdee1', fontSize:14}}>Hacker Mode (Terminal UI)</strong>
                  <input type="checkbox" className="settings-checkbox" defaultChecked={localStorage.getItem('monoFont') === 'true'} onChange={(e) => {
                    localStorage.setItem('monoFont', e.target.checked);
                    if(e.target.checked) document.body.classList.add('hacker-mode');
                    else document.body.classList.remove('hacker-mode');
                  }} />
                </div>

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: '#1e1f22', padding: 12, borderRadius: 6}}>
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <strong style={{color:'#dbdee1', fontSize:14}}>Reverse Layout</strong>
                    <span style={{color: '#80848e', fontSize: 11}}>Moves sidebars to the right</span>
                  </div>
                  <input type="checkbox" className="settings-checkbox" defaultChecked={localStorage.getItem('reverseLayout') === 'true'} onChange={(e) => {
                    localStorage.setItem('reverseLayout', e.target.checked);
                    window.location.reload(); 
                  }} />
                </div>
              </div>
            </>
          )}

          {tab === 'admin' && isAdmin && (
            <>
              <h2 style={{color: '#f0b232', marginTop: 0}}>Admin Panel</h2>
              
              <div className="settings-card">
                <h3 style={{color: '#fff', margin: 0}}>Firebase Usage & Quotas</h3>
                <p style={{fontSize: 13, color: '#949ba4', marginTop: 4, marginBottom: 16}}>
                  Client-side tracking is restricted by Google. Click below to view your live daily reads, writes, and active connections.
                </p>
                <button 
                  className="save-btn" 
                  onClick={() => window.open('https://console.firebase.google.com/project/chat-65f4a/usage/details', '_blank')} 
                  style={{background: '#dbdee1', color: '#1e1f22', width: 'fit-content'}}
                >
                  View Live Firebase Quotas ↗
                </button>
              </div>

              <div className="settings-card">
                <h3 style={{color: '#fff', margin: 0}}>User Management</h3>
                <p style={{fontSize: 13, color: '#949ba4', marginTop: 4, marginBottom: 16}}>Ban or Unban users from the platform entirely.</p>
                {allUsers && allUsers.map(u => (
                  <div className="ban-list-item" key={u.uid} style={{opacity: u.banned ? 0.5 : 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <img src={u.photoURL || DEFAULT_AVATAR} alt="" style={{width:32, height:32, borderRadius:'50%', objectFit: 'cover'}} />
                      <div style={{display: 'flex', flexDirection: 'column'}}>
                        <strong style={{color: 'white', fontSize: 14}}>{u.displayName}</strong>
                        <span style={{color: '#80848e', fontSize: 11}}>{u.email}</span>
                      </div>
                      {u.banned && <span style={{color: '#da373c', fontSize: 12, fontWeight: 'bold', marginLeft: 10}}>(BANNED)</span>}
                    </div>
                    {u.email !== 'vincentr111222@gmail.com' && (
                      <button className={u.banned ? "unban-btn" : "ban-btn"} onClick={async () => { 
                        if(window.confirm(u.banned ? "Unban this user?" : "Ban user permanently?")) {
                          try { await firestore.collection('users').doc(u.uid).update({ banned: !u.banned }); }
                          catch(err) { if (checkQuotaError(err)) alert("Action failed: Quota Exceeded."); }
                        }
                      }}>{u.banned ? "Unban" : "Ban"}</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="settings-card">
                <h3 style={{color: '#da373c', margin: 0}}>Global Server Management</h3>
                <p style={{fontSize: 13, color: '#949ba4', marginTop: 4, marginBottom: 16}}>Force delete any server from the database.</p>
                {allServers && allServers.map(s => (
                  <div className="admin-server-item" key={s.id}>
                    <strong style={{color: '#fff', fontSize: 15}}>{s.name}</strong>
                    <button className="ban-btn" onClick={async () => {
                      if(window.confirm(`Delete ${s.name} entirely?`)) {
                        try {
                          await firestore.collection('servers').doc(s.id).delete();
                          alert(`${s.name} has been permanently deleted.`);
                          window.location.reload(); 
                        } catch (err) {
                           if (checkQuotaError(err)) alert("Action failed: Quota Exceeded.");
                        }
                      }
                    }}>Force Delete</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ServerSettingsModal({ server, close, theme }) {
  const [name, setName] = useState(server.name); 
  const [description, setDescription] = useState(server.description || '');
  const [icon, setIcon] = useState(server.icon || '');
  const [bannerURL, setBannerURL] = useState(server.bannerURL || '');
  const [isPrivate, setPrivate] = useState(server.isPrivate || false);

  const save = async () => { 
    if (auth.currentUser) {
      const inviteCode = isPrivate ? (server.inviteCode || Math.random().toString(36).substring(2,8).toUpperCase()) : null;
      let members = server.members || [];
      if (isPrivate && members.length === 0) members = [auth.currentUser.uid];
      try {
        await firestore.collection('servers').doc(server.id).update({ name, description, icon, bannerURL, isPrivate, inviteCode, members }); 
        close(); 
      } catch (err) {
        if(checkQuotaError(err)) alert("Save failed: Daily Quota Exceeded.");
      }
    }
  };

  return (
    <div className="overlay" style={{zIndex:1002}}>
      <div className="modal-box" style={{width: 500}}>
        <h2 style={{margin:0, color:'#fff'}}>Server Customization</h2>
        
        <div style={{display: 'flex', gap: '20px', alignItems: 'flex-start', marginTop: 10}}>
          <div style={{display:'flex', flexDirection:'column', gap: 12, alignItems: 'center'}}>
            <div style={{width:80, height:80, borderRadius:'50%', background: icon && icon.startsWith('data:') ? `url(${icon}) center/cover` : theme, display:'flex', justifyContent:'center', alignItems:'center', color:'white', fontWeight:'bold', fontSize:'28px', boxShadow:'0 4px 8px rgba(0,0,0,0.3)'}}>
               {(!icon || !icon.startsWith('data:')) ? (icon || name.charAt(0).toUpperCase()) : ''}
            </div>
            <label className="b64-upload-btn" style={{margin: 0}}>Upload Icon<input type="file" accept="image/*" onChange={e => compressImage(e.target.files[0], 150, 150, setIcon)} /></label>
          </div>
          
          <div style={{flex: 1, display:'flex', flexDirection:'column', gap: 12}}>
            <div style={{width:'100%', height:80, borderRadius:8, background: bannerURL ? `url(${bannerURL}) center/cover` : '#1e1f22', border: '1px solid #1e1f22'}}></div>
            <label className="b64-upload-btn" style={{margin: 0, alignSelf:'flex-start'}}>Upload Banner<input type="file" accept="image/*" onChange={e => compressImage(e.target.files[0], 600, 200, setBannerURL)} /></label>
          </div>
        </div>

        <label style={{marginTop: 16}}>SERVER NAME</label>
        <input value={name} onChange={e=>setName(e.target.value)} />
        
        <label style={{marginTop: 16}}>SERVER DESCRIPTION</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} style={{resize: 'none'}} placeholder="What is this server about?" />
        
        <div style={{background:'#2b2d31', padding:16, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', border: '1px solid #1e1f22', marginTop: 16}}>
          <div style={{display:'flex',flexDirection:'column'}}><strong style={{color:'#fff', fontSize:14}}>Private Server</strong><span style={{color:'#949ba4', fontSize:12, marginTop: 4}}>Requires Invite Code to join</span></div>
          <div onClick={()=>setPrivate(!isPrivate)} style={{width:40,height:24,background:isPrivate?'#23a559':'#80848e',borderRadius:12,position:'relative',cursor:'pointer'}}><div style={{width:18,height:18,background:'#fff',borderRadius:'50%',position:'absolute',top:3,left:isPrivate?19:3,transition:'0.3s'}}/></div>
        </div>
        {isPrivate && <div style={{background:'#1e1f22', padding:16, borderRadius:8, textAlign:'center', color:'#23a559', fontSize:28, letterSpacing:6, fontWeight:'900', fontFamily:'monospace', marginTop: 16, border: '1px dashed #23a559'}}>{server.inviteCode||'Save to generate'}</div>}
        
        <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
          <button onClick={close} style={{flex: 1, background: '#4e5058', color: 'white', padding: '14px'}}>Cancel</button>
          <button onClick={save} style={{flex: 1, background: theme, color: 'white', padding: '14px'}}>Save Server</button>
        </div>
      </div>
    </div>
  )
}
