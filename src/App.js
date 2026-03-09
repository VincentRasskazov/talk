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

// --- ENABLE OFFLINE CACHING (SAVES 90% QUOTA) ---
firestore.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') console.warn('Multiple tabs open, persistence enabled in first tab.');
    else if (err.code === 'unimplemented') console.warn('Browser lacks offline support.');
  });

const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGI5Y2VkIiBzdHJva2Utd2lkdGg9IjEyIi8+PHRleHQgeD0iNTMiIHk9Ijg1IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM4YjljZWQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPnQ8L3RleHQ+PC9zdmc+";
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '🔥'];

// --- AI API INTEGRATION ---
const BACKEND_URL = "https://backendai-ablv.onrender.com";
const SECRET_SALT = "vincent-gemini-ultra-secure-salt-2026-x";
const AI_MODELS = {
  '@deepseek': 'deepai-deepseek',
  '@llama': 'deepai-llama',
  '@qwen': 'deepai-qwen',
  '@chatgpt': 'g4f',
  '@gpt5': 'useai',
  '@copilot': 'copilot',
  '@venice': 'venice',
  '@overchat': 'overchat',
  '@talkai': 'talkai',
  '@notegpt': 'notegpt',
  '@chatplus': 'chatplus',
  '@horde': 'horde'
};

async function generateToken(msgId) {
  const raw = msgId + SECRET_SALT;
  const enc = new TextEncoder();
  const data = enc.encode(raw);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const checkQuotaError = (err) => {
  if (!err) return false;
  if (err.code === 'resource-exhausted') return true;
  if (err.message && err.message.toLowerCase().includes('quota')) return true;
  return false;
};

const compressImage = (file, maxWidth, maxHeight, callback) => {
  if (!file) return;
  if (file.size > 1500000) return alert("File too large. Max 1.5MB.");
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
      callback(cvs.toDataURL('image/jpeg', 0.7));
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

if (localStorage.getItem('compactMode') === 'true') document.body.classList.add('compact-mode');
if (localStorage.getItem('monoFont') === 'true') document.body.classList.add('hacker-mode');

function QuotaBanner() {
  const [timeLeft, setTimeLeft] = useState('');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const ptDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      const nextMidnightPT = new Date(ptDate.getFullYear(), ptDate.getMonth(), ptDate.getDate() + 1);
      const msUntilMidnight = nextMidnightPT.getTime() - ptDate.getTime();
      
      if (!localTime) {
        const resetDateLocal = new Date(now.getTime() + msUntilMidnight);
        setLocalTime(resetDateLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }

      const hrs = Math.floor((msUntilMidnight / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((msUntilMidnight / 1000 / 60) % 60);
      setTimeLeft(`${hrs}h ${mins}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [localTime]);

  return (
    <div className="quota-error-banner">
      ⚠️ Firebase Daily Quota Exceeded. The server resets in {timeLeft} (at {localTime} your local time).
    </div>
  );
}

const EmptyState = ({ title, desc }) => (
  <div className="empty-state">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
    <h2>{title}</h2><p>{desc}</p>
  </div>
);

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [themeColor, setThemeColor] = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [consoleQuotaError, setConsoleQuotaError] = useState(false);

  const userRef = user ? firestore.collection('users').doc(user.uid) : null;
  const [userDoc, userLoading, userError] = useDocumentData(userRef);

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

  // --- VERSION CHECKER ---
  useEffect(() => {
    fetch('/?t=' + new Date().getTime())
      .then(res => res.text())
      .then(html => {
        const storedHtml = localStorage.getItem('app_version_html');
        if (storedHtml && storedHtml !== html) {
           localStorage.setItem('app_version_html', html);
           window.location.reload(true);
        } else {
           localStorage.setItem('app_version_html', html);
        }
      }).catch(e => console.warn('Version check failed'));
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

function ProfileModal({ userProfile, close, themeColor, isGuest, onLoginClick, startDM, isSelf, currentServer, setView }) {
  if(!userProfile) return null;
  
  const isSuperAdmin = auth.currentUser && auth.currentUser.email === 'vincentr111222@gmail.com';
  const isServerOwner = currentServer && auth.currentUser && currentServer.owner === auth.currentUser.uid;
  const isServerAdmin = currentServer && currentServer.admins && auth.currentUser && currentServer.admins.includes(auth.currentUser.uid);
  const canManage = isSuperAdmin || isServerOwner || isServerAdmin;
  const targetIsAdmin = currentServer && currentServer.admins && currentServer.admins.includes(userProfile.uid);

  const toggleAdmin = async () => {
    try {
      if(targetIsAdmin) await firestore.collection('servers').doc(currentServer.id).update({ admins: firebase.firestore.FieldValue.arrayRemove(userProfile.uid) });
      else await firestore.collection('servers').doc(currentServer.id).update({ admins: firebase.firestore.FieldValue.arrayUnion(userProfile.uid) });
      alert("Roles updated!");
    } catch(e) { alert(e.message); }
  };

  const banFromServer = async () => {
    if(window.confirm(`Ban ${userProfile.displayName} from this server?`)) {
      try {
        await firestore.collection('servers').doc(currentServer.id).update({ 
          banned: firebase.firestore.FieldValue.arrayUnion(userProfile.uid),
          members: firebase.firestore.FieldValue.arrayRemove(userProfile.uid),
          admins: firebase.firestore.FieldValue.arrayRemove(userProfile.uid)
        });
        close();
      } catch(e) { alert(e.message); }
    }
  };

  return (
    <div className="overlay" onClick={close} style={{zIndex: 1005}}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{paddingTop: 0}}>
        <button onClick={close} style={{position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.5)', color:'#fff', borderRadius:'50%', width:28, height:28, zIndex:10, display:'flex', justifyContent:'center', alignItems:'center', padding:0}}>✕</button>
        <div className="profile-banner" style={{background: userProfile.bannerURL ? 'transparent' : themeColor, backgroundImage: userProfile.bannerURL ? `url(${userProfile.bannerURL})` : 'none'}}>
          <img src={userProfile.photoURL || DEFAULT_AVATAR} className="profile-avatar" alt="pfp" />
        </div>
        <div style={{marginTop: 50}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h2 style={{margin: '0', color: '#fff', display:'flex', alignItems:'center', gap: 8}}>
              {userProfile.displayName}
              {isSuperAdmin && userProfile.email === 'vincentr111222@gmail.com' && <span style={{background:'#f0b232', color:'#000', fontSize:10, padding:'2px 6px', borderRadius:4}}>SYSADMIN</span>}
              {currentServer && currentServer.owner === userProfile.uid && <span style={{background:'#f0b232', color:'#000', fontSize:10, padding:'2px 6px', borderRadius:4}}>OWNER</span>}
              {targetIsAdmin && <span style={{background:'#5865F2', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:4}}>ADMIN</span>}
            </h2>
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

          {canManage && !isSelf && currentServer && currentServer.owner !== userProfile.uid && userProfile.email !== 'vincentr111222@gmail.com' && (
             <div style={{display: 'flex', gap: 8, marginTop: 16}}>
               {isServerOwner && <button onClick={toggleAdmin} style={{flex: 1, padding: 10, background: '#35373c', color: '#fff', borderRadius: 6, border: '1px solid #5865F2'}}>{targetIsAdmin ? 'Remove Admin' : 'Make Admin'}</button>}
               <button onClick={banFromServer} style={{flex: 1, padding: 10, background: '#da373c', color: '#fff', borderRadius: 6, border: 'none'}}>Ban from Server</button>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MainApp({ themeColor, setThemeColor, isGuest, onLoginClick, setZoomImage }) {
  const [view, setView] = useState('discovery');
  const [currentServer, setCurrentServer] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [activeDM, setActiveDM] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [channelsOpenPC, setChannelsOpenPC] = useState(true);

  const isAdmin = !isGuest && auth.currentUser && auth.currentUser.email === 'vincentr111222@gmail.com';
  
  const [allServers, serversLoading, serversError] = useCollectionData(firestore.collection('servers').orderBy('createdAt'), { idField: 'id' });
  const [allUsers, usersLoading, usersError] = useCollectionData(firestore.collection('users'));
  
  const dmsQuery = !isGuest && auth.currentUser ? firestore.collection('dms').where('users', 'array-contains', auth.currentUser.uid) : null;
  const [allDMs, dmsLoading, dmsError] = useCollectionData(dmsQuery, { idField: 'id' });
  
  const callsQuery = !isGuest && auth.currentUser ? firestore.collection('calls').where('targetUid', '==', auth.currentUser.uid) : null;
  const [userCalls] = useCollectionData(callsQuery, { idField: 'id' });
  const incomingCall = userCalls ? userCalls.find(c => c.status === 'ringing') : null;

  useEffect(() => {
    if (incomingCall && window.Notification && Notification.permission === 'granted') {
      new Notification("Incoming Video Call 📞", { body: incomingCall.callerName + " is calling you on Talk!" });
    }
  }, [incomingCall]);

  const isQuotaExceeded = checkQuotaError(serversError) || checkQuotaError(usersError) || checkQuotaError(dmsError);

  let servers = [];
  if (allServers) {
    servers = allServers.filter(s => {
      if (s.banned && auth.currentUser && s.banned.includes(auth.currentUser.uid)) return false; 
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
      if (!(await dmRef.get()).exists) {
        await dmRef.set({ users: [uid1, uid2], updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      setView('dms'); 
      setActiveDM({ id: dmId, target: targetUser });
    } catch(err) {
      if(checkQuotaError(err)) alert("Daily quota exceeded.");
    }
  };

  const closeAllMenus = () => setMobileNavOpen(false);

  return (
    <>
      {isQuotaExceeded && (
        <div className="quota-error-banner">
          ⚠️ Firebase Daily Quota Exceeded. The database will reset at Midnight Pacific Time (PT).
        </div>
      )}
      <div className={`discord-layout ${localStorage.getItem('reverseLayout') === 'true' ? 'layout-reverse' : ''}`}>
        {showSettings && !isGuest && <SettingsModal close={()=>setShowSettings(false)} theme={themeColor} setTheme={setThemeColor} isAdmin={isAdmin} userDoc={currentUserData} allUsers={allUsers} allServers={allServers} />}
        {editingServer && !isGuest && <ServerSettingsModal server={editingServer} close={()=>setEditingServer(null)} theme={themeColor} setView={setView} />}
        <ProfileModal userProfile={selectedUser} close={()=>setSelectedUser(null)} themeColor={themeColor} isGuest={isGuest} onLoginClick={onLoginClick} startDM={startDM} isSelf={selectedUser && auth.currentUser && selectedUser.uid === auth.currentUser.uid} currentServer={currentServer} setView={setView} />
        
        {incomingCall && (!activeDM || activeDM.id !== incomingCall.id || view !== 'dms') && (
          <div className="incoming-call-banner" style={{position:'absolute', top: 20, right: 20, left: window.innerWidth < 768 ? 20 : 'auto', zIndex: 9999, width: window.innerWidth < 768 ? 'auto' : 300, background: '#23a559'}}>
            <span>📞 Call from {incomingCall.callerName}...</span>
            <button onClick={() => {
              const otherUid = incomingCall.id.split('_').find(id => auth.currentUser && id !== auth.currentUser.uid);
              const otherUser = allUsers ? allUsers.find(u => u.uid === otherUid) : null;
              if(otherUser) { setView('dms'); setActiveDM({id: incomingCall.id, target: otherUser}); }
            }} style={{marginLeft: 16, background: '#fff', color: '#23a559', padding: '6px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Go to DM</button>
          </div>
        )}
        
        {mobileNavOpen && <div className="mobile-overlay open" onClick={closeAllMenus}></div>}

        <div className="sidebar" style={{paddingTop: 12}}>
          <div className="server-icon-wrapper" onClick={() => { setView('dms'); setMobileNavOpen(true); setCurrentServer(null); }}>
            <img src={DEFAULT_AVATAR} className={`server-icon ${view === 'dms' ? 'active' : ''}`} alt="DM" style={{borderRadius: view==='dms'?16:24}} title="Direct Messages" />
          </div>
          <div className="server-icon-wrapper" onClick={() => { setView('discovery'); setMobileNavOpen(true); setCurrentServer(null); }}>
            <div className={`server-icon ${view === 'discovery' ? 'active' : ''}`} style={{background: '#23a559', borderRadius: view==='discovery'?16:24}} title="Discover Servers">🌍</div>
          </div>
          <div className="divider"></div>
          {servers.map(s => {
            const isActive = currentServer && currentServer.id === s.id && view === 'servers';
            const hasImage = s.icon && s.icon.startsWith('data:');
            return (
              <div key={s.id} className={`server-icon-wrapper ${isActive ? 'active' : ''}`} onClick={() => { setView('servers'); setCurrentServer(s); setCurrentChannel(null); setMobileNavOpen(true); }}>
                <div className={`server-icon ${isActive ? 'active' : ''}`} style={hasImage ? {backgroundImage: `url(${s.icon})`} : {}} title={s.name}>
                  {!hasImage ? (s.icon || (s.name ? s.name.charAt(0).toUpperCase() : '?')) : ''}
                </div>
              </div>
            )
          })}
          {!isGuest && <div className="server-icon-wrapper" onClick={async () => { 
            const n = prompt("Server Name:"); 
            if(n) {
              const isPriv = !isAdmin;
              const ownerId = auth.currentUser.uid;
              try { 
                await firestore.collection('servers').add({ 
                  name: n, 
                  icon: n.charAt(0).toUpperCase(), 
                  isPrivate: isPriv, 
                  owner: ownerId, 
                  members: [ownerId], 
                  admins: [], 
                  banned: [], 
                  createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                }); 
              } catch(err){ if(checkQuotaError(err)) alert("Action failed: Quota Exceeded."); }
            }
          }}>
            <div className="server-icon server-add-btn">+</div>
          </div>}
        </div>

        {view === 'discovery' ? (
          <DiscoveryContent allServers={allServers} setView={setView} setCurrentServer={setCurrentServer} theme={themeColor} isGuest={isGuest} />
        ) : view === 'servers' && currentServer ? (
          <ServerContent server={currentServer} channel={currentChannel} setChannel={setCurrentChannel} isAdmin={isAdmin} isGuest={isGuest} theme={themeColor} onLoginClick={onLoginClick} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} closeAllMenus={closeAllMenus} channelsOpenPC={channelsOpenPC} setChannelsOpenPC={setChannelsOpenPC} allUsers={allUsers} openProfile={setSelectedUser} myData={currentUserData} openSettings={()=>setShowSettings(true)} setZoomImage={setZoomImage} editServer={() => setEditingServer(currentServer)} />
        ) : view === 'dms' && !isGuest ? (
          <DMContent dms={allDMs} activeDM={activeDM} setActiveDM={setActiveDM} allUsers={allUsers} theme={themeColor} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} closeAllMenus={closeAllMenus} channelsOpenPC={channelsOpenPC} setChannelsOpenPC={setChannelsOpenPC} myData={currentUserData} openSettings={()=>setShowSettings(true)} openProfile={setSelectedUser} setZoomImage={setZoomImage} />
        ) : (
          <EmptyState title="Welcome to Talk" desc="Select a server or join one from the Discovery tab 🌍" />
        )}
      </div>
    </>
  );
}

function DiscoveryContent({ allServers, setView, setCurrentServer, theme, isGuest }) {
  const publicServers = allServers ? allServers.filter(s => !s.isPrivate) : [];
  
  const join = async (s) => {
    if(isGuest || !auth.currentUser) return alert("Log in to join servers!");
    if(s.banned && s.banned.includes(auth.currentUser.uid)) return alert("You are banned from this server.");
    try {
      await firestore.collection('servers').doc(s.id).update({ members: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid) });
      setCurrentServer(s); setView('servers');
    } catch(e) { alert("Failed to join."); }
  };

  return (
    <div className="chat-container" style={{padding: '40px', overflowY: 'auto', background: '#313338'}}>
      <h1 style={{color: 'white', marginTop: 0, marginBottom: 10}}>🌍 Discover Public Servers</h1>
      <p style={{color: '#949ba4', marginBottom: 30}}>Find communities, join voice channels, and chat.</p>
      
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
        {publicServers.map(s => {
          const isMember = auth.currentUser && s.members && s.members.includes(auth.currentUser.uid);
          return (
            <div key={s.id} style={{background: '#2b2d31', borderRadius: '12px', padding: '20px', width: '280px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #1e1f22', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <div style={{width: 48, height: 48, borderRadius: '12px', background: s.icon && s.icon.startsWith('data:') ? `url(${s.icon}) center/cover` : theme, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: 20, fontWeight: 'bold'}}>
                  {!s.icon || !s.icon.startsWith('data:') ? (s.icon || s.name.charAt(0)) : ''}
                </div>
                <strong style={{color: 'white', fontSize: 18}}>{s.name}</strong>
              </div>
              <p style={{color: '#dbdee1', fontSize: 14, margin: 0, flex: 1}}>{s.description || "No description provided."}</p>
              <div style={{color: '#949ba4', fontSize: 12}}>👥 {(s.members || []).length} Members</div>
              {isMember ? 
                <button onClick={() => {setCurrentServer(s); setView('servers');}} style={{background: '#4e5058', color: 'white', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold'}}>Go to Server</button> :
                <button onClick={() => join(s)} style={{background: theme, color: 'white', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold'}}>Join Server</button>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ServerContent({ server, channel, setChannel, isAdmin, isGuest, theme, onLoginClick, mobileNavOpen, setMobileNavOpen, closeAllMenus, channelsOpenPC, setChannelsOpenPC, allUsers, openProfile, myData, openSettings, setZoomImage, editServer }) {
  const dummy = useRef();
  const [form, setForm] = useState(''); const [file, setFile] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [rateLimitTimer, setRateLimitTimer] = useState([]);

  const channelsRef = firestore.collection(`servers/${server.id}/channels`);
  const [channels] = useCollectionData(channelsRef.orderBy('createdAt'), { idField: 'id' });
  const msgsRef = channel ? firestore.collection(`servers/${server.id}/channels/${channel.id}/messages`) : null;
  const [messages] = useCollectionData(msgsRef ? msgsRef.orderBy('createdAt').limit(50) : null, { idField: 'id' });
  
  const [lastMsgId, setLastMsgId] = useState(null);

  const categories = {};
  if (channels) {
    channels.forEach(c => {
      const cat = c.category || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c);
    });
  }

  useEffect(() => {
    if (dummy.current) dummy.current.scrollIntoView({ behavior: 'smooth' });
    
    if (messages && messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (lastMsgId && latest.id !== lastMsgId && auth.currentUser && latest.uid !== auth.currentUser.uid) {
        const now = new Date();
        const msgDate = (latest.createdAt && latest.createdAt.toDate) ? latest.createdAt.toDate() : new Date();
        if ((now - msgDate) < 5000 && window.Notification && Notification.permission === 'granted' && localStorage.getItem('mute_' + server.id) !== 'true') {
             new Notification(latest.displayName + ' in #' + (channel ? channel.name : 'server'), { body: latest.text, icon: latest.photoURL || DEFAULT_AVATAR });
        }
      }
      setLastMsgId(latest.id);
    }
  }, [messages]);

  useEffect(() => { 
    if (channels && channels.length > 0 && (!channel || !channels.find(c=>c.id===channel.id))) setChannel(channels[0]); 
  }, [channels, server]);

  const toggleSidebar = () => { 
    if (window.innerWidth <= 768) { setMobileNavOpen(true); } 
    else { setChannelsOpenPC(!channelsOpenPC); }
  };

  const canManage = isAdmin || (server.owner && auth.currentUser && server.owner === auth.currentUser.uid) || (server.admins && auth.currentUser && server.admins.includes(auth.currentUser.uid));

  const sendMsg = async (e) => {
    e.preventDefault(); 
    if(isGuest) return onLoginClick();
    if (!form.trim() && !file) return;

    const now = Date.now();
    const recent = rateLimitTimer.filter(t => now - t < 5000);
    if (recent.length >= 4) {
      alert("Rate limit active. Please wait 5 seconds.");
      return;
    }
    setRateLimitTimer([...recent, now]);

    const text = form.trim();
    let aiModel = null; let aiPrompt = null; let triggerUsed = null;

    for (const [trigger, modelId] of Object.entries(AI_MODELS)) {
      if (text.toLowerCase().startsWith(trigger + ' ')) {
        aiModel = modelId; triggerUsed = trigger; aiPrompt = text.substring(trigger.length).trim(); break;
      }
    }

    if (msgsRef && auth.currentUser) {
      try {
        await msgsRef.add({ text: text, fileData: file ? file.data : null, fileType: file ? file.type : null, fileName: file ? file.name : null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: auth.currentUser.uid, photoURL: myData ? myData.photoURL : DEFAULT_AVATAR, displayName: myData ? myData.displayName : 'User', isEdited: false });
        setForm(''); setFile(null); 
        
        if (aiModel && aiPrompt) {
          const msgId = window.crypto.randomUUID();
          const token = await generateToken(msgId);
          const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msgId, token: token, message: "System: You are VincentAI, an advanced AI assistant built directly into Talk, a real-time messaging app. Be helpful, concise, and friendly.\n\nUser: " + aiPrompt, model: aiModel })
          });
          if (!response.ok) throw new Error("AI failed to respond.");
          const aiResult = await response.text();
          await msgsRef.add({ text: aiResult, createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: 'vincent-ai-bot', photoURL: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=VincentAI', displayName: `VincentAI (${triggerUsed})` });
        }
      } catch (err) { if(checkQuotaError(err)) alert("Message failed to send: Daily Quota Exceeded."); }
    }
  };

  const handleFile = (e) => {
    if(isGuest) return onLoginClick();
    const f = e.target.files[0]; if(!f) return;
    if(f.size > 1500000) return alert("File too large. Max 1.5MB.");
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

  const handleTextChange = (e) => {
    const val = e.target.value; setForm(val);
    const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) setMentionQuery(lastWord.substring(1).toLowerCase());
    else setMentionQuery(null);
  };

  const insertMention = (tag) => {
    const words = form.split(' '); words.pop();
    setForm(words.length > 0 ? words.join(' ') + ' ' + tag + ' ' : tag + ' ');
    setMentionQuery(null);
    const input = document.getElementById('server-chat-input');
    if (input) input.focus();
  };

  const aiMatches = mentionQuery !== null ? Object.keys(AI_MODELS).filter(k => k.toLowerCase().includes(mentionQuery)) : [];
  const members = allUsers ? allUsers.filter(u => !u.banned && (server.isPrivate ? server.members && server.members.includes(u.uid) : true)) : [];
  const userMatches = mentionQuery !== null ? members.filter(u => u.displayName.toLowerCase().includes(mentionQuery)) : [];

  return (
    <>
      <div className={`channels ${mobileNavOpen ? 'open' : ''} ${!channelsOpenPC ? 'closed' : ''}`}>
        <div className="channels-header" style={server.bannerURL ? {backgroundImage: `url(${server.bannerURL})`} : {}}>
          {server.bannerURL && <div className="channels-header-overlay"></div>}
          <div style={{position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
            <h3 style={{textShadow: server.bannerURL ? '0 2px 4px rgba(0,0,0,0.9)' : 'none', color: server.bannerURL ? '#fff' : '#f2f3f5', margin: 0}}>{server.name}</h3>
            {canManage && (
              <button onClick={editServer} style={{background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'}} title="Server Settings">⚙️</button>
            )}
          </div>
          {canManage && <button className="add-btn" onClick={async()=>{
            const type = window.confirm("Click OK for Text Channel, or Cancel for Voice/Video Channel") ? 'text' : 'voice';
            const cat = prompt("Category Name (leave blank for Uncategorized):");
            const n = prompt("Channel Name:"); 
            if(n) {
              try { await channelsRef.add({name: n.toLowerCase(), type: type, category: cat || 'Uncategorized', createdAt: firebase.firestore.FieldValue.serverTimestamp()}) }
              catch(err){ if(checkQuotaError(err)) alert("Action failed: Quota Exceeded."); }
            }
          }}>+</button>}
        </div>
        <div className="channel-list" style={{overflowY: 'auto'}}>
          {Object.keys(categories).map(catName => (
            <div key={catName}>
              <div style={{color: '#949ba4', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', padding: '16px 8px 4px 8px'}}>{catName}</div>
              {categories[catName].map(c => (
                <div key={c.id} className={`channel ${channel && channel.id===c.id ? 'active':''}`} onClick={()=>{setChannel(c); closeAllMenus();}}>
                  <span className="channel-name"><span className="hash-icon">{c.type === 'voice' ? '🔊' : '#'}</span> {c.name}</span>
                  {canManage && <button className="del-btn" onClick={async(e)=>{e.stopPropagation(); if(window.confirm("Delete channel?")) await channelsRef.doc(c.id).delete();}}>✕</button>}
                </div>
              ))}
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
                  <span className="hash-icon" style={{color: '#80848e', marginRight: 6}}>{channel.type === 'voice' ? '🔊' : '#'}</span> {channel.name} 
                  {server.description && <span style={{marginLeft: 12, paddingLeft: 12, borderLeft: '1px solid #3f4147', fontSize: 13, color: '#949ba4', fontWeight: '500'}}>{server.description}</span>}
                </div>
              </div>
              <button className="member-toggle" onClick={()=>setShowMembers(!showMembers)} style={{color: showMembers?theme:''}}>👥</button>
            </header>
            
            {channel.type === 'voice' ? (
               <div style={{flex: 1, display: 'flex', flexDirection: 'column', background: '#000'}}>
                 <iframe 
                   title="Voice and Video"
                   allow="camera; microphone; fullscreen; display-capture"
                   src={`https://meet.jit.si/talk_app_server_${server.id}_channel_${channel.id}`}
                   style={{width: '100%', height: '100%', border: 'none'}}
                 />
               </div>
            ) : (
              <>
                <main>
                  {messages && messages.map((m) => (
                    <ChatMessage key={m.id} msg={m} msgRef={msgsRef.doc(m.id)} canManage={canManage} isGuest={isGuest} theme={theme} openProfile={() => openProfile(allUsers ? allUsers.find(u => u.uid === m.uid) || m : m)} onLoginClick={onLoginClick} setZoomImage={setZoomImage} serverOwner={server.owner} serverAdmins={server.admins} />
                  ))}
                  <span ref={dummy}></span>
                </main>
                <div className="form-wrapper">
                  <div className="ai-tooltip" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    <div style={{ color: '#dbdee1' }}>✨ <strong>Talk to VincentAI:</strong> Type an AI tag, followed by your prompt.</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px', alignItems: 'center' }}>
                      <strong style={{ color: '#f0b232', fontSize: '11px' }}>RECOMMENDED:</strong>
                      <span style={{ border: '1px solid #f0b232', color: '#f0b232', padding: '2px 6px', borderRadius: '4px' }}>@deepseek</span>
                      <span style={{ border: '1px solid #f0b232', color: '#f0b232', padding: '2px 6px', borderRadius: '4px' }}>@copilot</span>
                      <strong style={{ color: '#80848e', fontSize: '11px', marginLeft: '8px' }}>OTHERS:</strong>
                      <span style={{background: '#2b2d31', padding: '2px 6px', borderRadius: '4px'}}>@chatgpt</span>
                    </div>
                  </div>

                  {mentionQuery !== null && (aiMatches.length > 0 || userMatches.length > 0) && (
                    <div className="mention-menu">
                      {aiMatches.length > 0 && <div className="mention-category">AI Bots</div>}
                      {aiMatches.map(ai => (
                        <div key={ai} className="mention-item" onClick={() => insertMention(ai)}><span style={{color: '#f0b232', fontWeight: 'bold'}}>🤖 {ai}</span></div>
                      ))}
                      {userMatches.length > 0 && <div className="mention-category">Users</div>}
                      {userMatches.map(u => (
                        <div key={u.uid} className="mention-item" onClick={() => insertMention(`@${u.displayName}`)}><img src={u.photoURL || DEFAULT_AVATAR} alt="user" /><span>{u.displayName}</span></div>
                      ))}
                    </div>
                  )}

                  {file && <div className="file-preview">{file.type==='image'?<img src={file.data} alt="prv"/>:<span>📎 {file.name}</span>}<button onClick={()=>setFile(null)}>✕</button></div>}
                  {isGuest ? <div style={{background:'#2b2d31', padding:16, borderRadius:8, textAlign:'center', marginTop: 8, border: '1px solid #1e1f22'}}><button className="auth-btn" onClick={onLoginClick} style={{background:theme, width:'auto', margin:0}}>Login to Send Messages</button></div> : 
                  <form onSubmit={sendMsg}>
                    <div className="upload-btn">
                      <label style={{cursor: 'pointer', margin: 0, display: 'flex', width:'100%', height:'100%', justifyContent:'center', alignItems:'center'}}>
                        + <input type="file" style={{display:'none'}} onChange={handleFile} />
                      </label>
                    </div>
                    <input id="server-chat-input" type="text" value={form} onChange={handleTextChange} placeholder={`Message #${channel.name}`} autoComplete="off" />
                    <button type="submit" style={{display:'none'}}></button>
                  </form>}
                </div>
              </>
            )}
          </>
        ) : <EmptyChannelState />}
      </div>

      {showMembers && <div className="mobile-overlay open" onClick={()=>setShowMembers(false)} style={{zIndex: 104}}></div>}
      <div className={`member-list ${!showMembers ? 'hidden' : ''} ${showMembers && window.innerWidth <= 900 ? 'mobile-open' : ''}`}>
        <div className="member-group-title">Members — {members.length}</div>
        {members.map(u => (
          <div className="member-item" key={u.uid} onClick={()=>{openProfile(u); setShowMembers(false);}}>
            <img src={u.photoURL||DEFAULT_AVATAR} alt="user" />
            <div style={{display:'flex', flexDirection:'column'}}>
              <span style={{color: u.email==='vincentr111222@gmail.com' ? '#f0b232':''}}>{u.displayName}</span>
              <div style={{display: 'flex', gap: '4px', marginTop: '2px'}}>
                {server.owner === u.uid && <span style={{background: '#f0b232', color: '#000', fontSize: 9, padding: '2px 4px', borderRadius: 4, fontWeight: 'bold'}}>OWNER</span>}
                {server.admins && server.admins.includes(u.uid) && <span style={{background: '#5865F2', color: '#fff', fontSize: 9, padding: '2px 4px', borderRadius: 4, fontWeight: 'bold'}}>ADMIN</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function DMContent({ dms, activeDM, setActiveDM, allUsers, theme, mobileNavOpen, setMobileNavOpen, closeAllMenus, channelsOpenPC, setChannelsOpenPC, myData, openSettings, openProfile, setZoomImage }) {
  const dummy = useRef(); const [form, setForm] = useState(''); const [file, setFile] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [rateLimitTimer, setRateLimitTimer] = useState([]);
  
  const msgsRef = activeDM ? firestore.collection(`dms/${activeDM.id}/messages`) : null;
  const [messages] = useCollectionData(msgsRef ? msgsRef.orderBy('createdAt').limit(50) : null, { idField: 'id' });
  const callRef = activeDM ? firestore.collection('calls').doc(activeDM.id) : null;
  const [callData] = useDocumentData(callRef);
  const [inCall, setInCall] = useState(false);
  const [isCaller, setIsCaller] = useState(false);

  const [lastMsgId, setLastMsgId] = useState(null);

  useEffect(() => {
    if (callData && callData.status === 'ringing' && !inCall && callData.callerName !== (myData ? myData.displayName : '')) {
      if (window.Notification && Notification.permission === 'granted') {
         new Notification("Incoming Video Call 📞", { body: activeDM.target.displayName + " is calling you on Talk!", requireInteraction: true });
      }
    }
  }, [callData]);

  useEffect(() => {
    if (dummy.current) dummy.current.scrollIntoView({ behavior: 'smooth' });
    if (messages && messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (lastMsgId && latest.id !== lastMsgId && auth.currentUser && latest.uid !== auth.currentUser.uid) {
        const now = new Date();
        const msgDate = (latest.createdAt && latest.createdAt.toDate) ? latest.createdAt.toDate() : new Date();
        if ((now - msgDate) < 5000 && window.Notification && Notification.permission === 'granted') {
             new Notification('DM from ' + latest.displayName, { body: latest.text, icon: latest.photoURL || DEFAULT_AVATAR });
        }
      }
      setLastMsgId(latest.id);
    }
  }, [messages]);

  const toggleSidebar = () => { 
    if (window.innerWidth <= 768) { setMobileNavOpen(true); } 
    else { setChannelsOpenPC(!channelsOpenPC); }
  };

  const sendMsg = async (e) => {
    e.preventDefault(); if (!form.trim() && !file) return;

    const now = Date.now();
    const recent = rateLimitTimer.filter(t => now - t < 5000);
    if (recent.length >= 4) return alert("Rate limit active. Please wait 5 seconds.");
    setRateLimitTimer([...recent, now]);

    const text = form.trim();
    let aiModel = null; let aiPrompt = null; let triggerUsed = null;

    for (const [trigger, modelId] of Object.entries(AI_MODELS)) {
      if (text.toLowerCase().startsWith(trigger + ' ')) {
        aiModel = modelId; triggerUsed = trigger; aiPrompt = text.substring(trigger.length).trim(); break;
      }
    }

    if (msgsRef && auth.currentUser) {
      try {
        await msgsRef.add({ text: text, fileData: file ? file.data : null, fileType: file ? file.type : null, fileName: file ? file.name : null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: auth.currentUser.uid, photoURL: myData ? myData.photoURL : DEFAULT_AVATAR, displayName: myData ? myData.displayName : 'User', isEdited: false });
        await firestore.collection('dms').doc(activeDM.id).update({ updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        setForm(''); setFile(null); 
        
        if (aiModel && aiPrompt) {
          const msgId = window.crypto.randomUUID();
          const token = await generateToken(msgId);
          const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msgId, token: token, message: "System: You are VincentAI, an advanced AI assistant built directly into Talk, a real-time messaging app. Be helpful, concise, and friendly.\n\nUser: " + aiPrompt, model: aiModel })
          });
          if (!response.ok) throw new Error("AI failed to respond.");
          await msgsRef.add({ text: await response.text(), createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: 'vincent-ai-bot', photoURL: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=VincentAI', displayName: `VincentAI (${triggerUsed})` });
          await firestore.collection('dms').doc(activeDM.id).update({ updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        }
      } catch (err) { if(checkQuotaError(err)) alert("Message failed to send: Daily Quota Exceeded."); }
    }
  };

  const handleFile = (e) => {
    const f = e.target.files[0]; if(!f) return;
    if(f.size > 1500000) return alert("Max 1.5MB.");
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

  const handleTextChange = (e) => {
    const val = e.target.value; setForm(val);
    const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) setMentionQuery(lastWord.substring(1).toLowerCase());
    else setMentionQuery(null);
  };

  const insertMention = (tag) => {
    const words = form.split(' '); words.pop();
    setForm(words.length > 0 ? words.join(' ') + ' ' + tag + ' ' : tag + ' ');
    setMentionQuery(null);
    const input = document.getElementById('dm-chat-input');
    if (input) input.focus();
  };

  const aiMatches = mentionQuery !== null ? Object.keys(AI_MODELS).filter(k => k.toLowerCase().includes(mentionQuery)) : [];
  const userMatches = mentionQuery !== null && allUsers ? allUsers.filter(u => !u.banned && u.displayName.toLowerCase().includes(mentionQuery)) : [];

  let sortedDMs = dms ? [...dms].sort((a,b) => ((b && b.updatedAt && b.updatedAt.toMillis) ? b.updatedAt.toMillis() : 0) - ((a && a.updatedAt && a.updatedAt.toMillis) ? a.updatedAt.toMillis() : 0)) : [];

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
              <button className="settings-btn" onClick={() => { setInCall(true); setIsCaller(true); }} style={{background: '#23a559', color: 'white', borderRadius: '50%', width: 32, height: 32, padding: 0, fontSize: 14}} title="Start Video Call">📞</button>
            </header>

            {callData && callData.status === 'ringing' && !inCall && callData.callerName !== (myData ? myData.displayName : '') && (
              <div className="incoming-call-banner">
                <span>📞 Incoming video call from {activeDM.target.displayName}...</span>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button onClick={() => { setInCall(true); setIsCaller(false); }} style={{background: '#fff', color: '#23a559', padding: '6px 16px', borderRadius: 16}}>Answer</button>
                  <button onClick={() => callRef.set({status: 'ended'})} style={{background: '#da373c', color: '#fff', padding: '6px 16px', borderRadius: 16, border: 'none'}}>Decline</button>
                </div>
              </div>
            )}

            {inCall && <VideoCallRoom dmId={activeDM.id} isCaller={isCaller} closeCall={() => setInCall(false)} myName={myData ? myData.displayName : 'User'} otherName={activeDM.target.displayName} targetUid={activeDM.target.uid} />}

            <main>
              {messages && messages.map((m) => (
                 <ChatMessage key={m.id} msg={m} msgRef={msgsRef.doc(m.id)} canManage={false} isGuest={false} theme={theme} openProfile={() => openProfile(allUsers ? allUsers.find((u) => u.uid === m.uid) || m : m)} setZoomImage={setZoomImage} />
              ))}
              <span ref={dummy}></span>
            </main>
            <div className="form-wrapper">
              {mentionQuery !== null && (aiMatches.length > 0 || userMatches.length > 0) && (
                <div className="mention-menu">
                  {aiMatches.map(ai => <div key={ai} className="mention-item" onClick={() => insertMention(ai)}><span style={{color: '#f0b232', fontWeight: 'bold'}}>🤖 {ai}</span></div>)}
                  {userMatches.map(u => <div key={u.uid} className="mention-item" onClick={() => insertMention(`@${u.displayName}`)}><img src={u.photoURL || DEFAULT_AVATAR} alt="user" /><span>{u.displayName}</span></div>)}
                </div>
              )}
              {file && <div className="file-preview">{file.type==='image'?<img src={file.data} alt="prv"/>:<span>📎 {file.name}</span>}<button onClick={()=>setFile(null)}>✕</button></div>}
              <form onSubmit={sendMsg}>
                <div className="upload-btn">
                  <label style={{cursor: 'pointer', margin: 0, display: 'flex', width:'100%', height:'100%', justifyContent:'center', alignItems:'center'}}>
                    + <input type="file" style={{display:'none'}} onChange={handleFile} />
                  </label>
                </div>
                <input id="dm-chat-input" type="text" value={form} onChange={handleTextChange} placeholder={`Message @${activeDM.target.displayName}`} autoComplete="off" />
                <button type="submit" style={{display:'none'}}></button>
              </form>
            </div>
          </>
        ) : <EmptyChannelState />}
      </div>
    </>
  )
}

function ChatMessage({ msg, msgRef, canManage, isGuest, theme, openProfile, onLoginClick, setZoomImage, serverOwner, serverAdmins }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);

  const toggleReact = async (em) => {
    if(isGuest || !auth.currentUser) return onLoginClick && onLoginClick();
    const r = msg.reactions || {}; 
    const uids = r[em] || [];
    let newUids = uids.includes(auth.currentUser.uid) ? uids.filter(id => id !== auth.currentUser.uid) : [...uids, auth.currentUser.uid];
    const newR = {...r}; 
    if(newUids.length===0) delete newR[em]; else newR[em] = newUids;
    try { await msgRef.set({ reactions: newR }, { merge: true }); } catch (err) { }
  };
  
  const saveEdit = async () => {
    if(editText.trim() === msg.text) return setIsEditing(false);
    try {
      await msgRef.update({ text: editText.trim(), isEdited: true });
      setIsEditing(false);
    } catch(e) { alert("Failed to edit"); }
  }

  return (
    <div className="message">
      <img className="message-avatar" src={msg.photoURL || DEFAULT_AVATAR} alt="user" onClick={openProfile} />
      <div className="message-content" style={{width: '100%'}}>
        <div className="msg-author-row">
          <span className="msg-author" onClick={openProfile}>{msg.displayName}</span>
          {serverOwner && msg.uid === serverOwner && <span style={{background: '#f0b232', color: '#1e1f22', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold'}}>OWNER</span>}
          {serverAdmins && serverAdmins.includes(msg.uid) && <span style={{background: '#5865F2', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold'}}>ADMIN</span>}
          <span className="msg-timestamp">{formatTimestamp(msg.createdAt)} {msg.isEdited && '(edited)'}</span>
        </div>
        
        {isEditing ? (
          <div style={{display:'flex', gap: 8, marginTop: 4}}>
             <input value={editText} onChange={e=>setEditText(e.target.value)} style={{flex: 1, padding: 8, borderRadius: 4, background: '#1e1f22', color: 'white', border: '1px solid #3f4147'}} autoFocus />
             <button onClick={saveEdit} style={{background: theme, color: 'white', border: 'none', borderRadius: 4, padding: '0 12px'}}>Save</button>
             <button onClick={()=>setIsEditing(false)} style={{background: 'transparent', color: '#da373c', border: 'none', cursor: 'pointer'}}>Cancel</button>
          </div>
        ) : (
          msg.text && <p>{msg.text}</p>
        )}
        
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
          {auth.currentUser && msg.uid === auth.currentUser.uid && <button onClick={()=>setIsEditing(true)} style={{background:'none', color:'#dbdee1', fontSize:11, fontWeight: 'bold', marginLeft: 8}}>EDIT</button>}
          {(auth.currentUser && msg.uid === auth.currentUser.uid) || canManage ? <button onClick={()=>msgRef.delete()} style={{background:'none', color:'#da373c', fontSize:11, fontWeight: 'bold', marginLeft: 8}}>DEL</button> : null}
        </div>
      )}
    </div>
  )
}

function SettingsModal({ close, theme, setTheme, isAdmin, userDoc, allUsers, allServers }) {
  const [tab, setTab] = useState('acc'); 
  const [name, setName] = useState((userDoc && userDoc.displayName) || ''); 
  const [bio, setBio] = useState((userDoc && userDoc.bio) || '');
  const [statusText, setStatusText] = useState((userDoc && userDoc.statusText) || '');
  const [pronouns, setPronouns] = useState((userDoc && userDoc.pronouns) || '');
  const [photo, setPhoto] = useState((userDoc && userDoc.photoURL) || DEFAULT_AVATAR);
  const [bannerURL, setBannerURL] = useState((userDoc && userDoc.bannerURL) || '');

  const save = async () => { 
    if (auth.currentUser) {
      try {
        await firestore.collection('users').doc(auth.currentUser.uid).set({ 
          displayName: name || '', bio: bio || '', statusText: statusText || '', pronouns: pronouns || '', photoURL: photo || DEFAULT_AVATAR, bannerURL: bannerURL || '' 
        }, {merge:true}); 
        await auth.currentUser.updateProfile({ displayName: name || '', photoURL: photo || DEFAULT_AVATAR }); 
        alert("Profile saved successfully! It may take a moment to reflect locally.");
      } catch (err) {
         alert("Error saving profile: " + err.message);
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
                <button className="save-btn" onClick={save} style={{background:theme, marginTop:24, width: 'fit-content'}}>Save Display Name</button>
              </div>
              <div className="settings-card">
                <h3 style={{color:'#fff', margin: 0}}>Authentication</h3>
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 16}}>
                  <button className="save-btn" onClick={() => {auth.sendPasswordResetEmail(auth.currentUser.email).then(() => alert('Reset email sent!')).catch(e => alert(e.message));}} style={{background:'#2b2d31', color:'#dbdee1', border: '1px solid #404249', width: 'fit-content'}}>Reset Password</button>
                </div>
              </div>
            </>
          )}

          {tab === 'profile' && (
            <>
              <h2 style={{color: '#fff', marginTop: 0}}>Profile Customization</h2>
              <div className="settings-card">
                <div style={{display:'flex', gap:20, alignItems:'center', marginBottom: 24}}>
                  <img src={photo} alt="Avatar" style={{width: 80, height: 80, minWidth: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme}`}} />
                  <label className="b64-upload-btn">Upload Avatar<input type="file" accept="image/*" onChange={(e) => compressImage(e.target.files[0], 200, 200, setPhoto)} /></label>
                </div>
                <div style={{marginBottom: 24}}>
                  <div style={{width: '100%', height: 100, borderRadius: 8, background: bannerURL ? `url(${bannerURL}) center/cover` : theme, marginBottom: 12}}></div>
                  <label className="b64-upload-btn">Upload Profile Banner<input type="file" accept="image/*" onChange={(e) => compressImage(e.target.files[0], 600, 200, setBannerURL)} /></label>
                </div>
                
                <label>CUSTOM STATUS</label><input value={statusText} onChange={e=>setStatusText(e.target.value)} placeholder="Playing a game, working, etc..." />
                <label style={{marginTop: 16}}>PRONOUNS</label><input value={pronouns} onChange={e=>setPronouns(e.target.value)} placeholder="They/Them" />
                <label style={{marginTop: 16}}>ABOUT ME</label><textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Tell the world about yourself..." style={{resize: 'none'}} />
                
                <button className="save-btn" onClick={save} style={{background:theme, marginTop:24, width: 'fit-content'}}>Save Profile Settings</button>
              </div>
            </>
          )}

          {tab === 'app' && (
            <>
              <h2 style={{color: '#fff', marginTop: 0}}>App Settings</h2>
              <div className="settings-card">
                <h3 style={{color:'#fff', margin:0}}>Theme Color</h3>
                <div className="color-picker" style={{display:'flex', gap:12, marginTop: 16}}>
                  {['#5865F2','#da373c','#23a559','#f0b232','#eb459e','#9b59b6', '#8b9ced'].map(c=><div key={c} onClick={()=>setTheme(c)} style={{width:36,height:36,borderRadius:'50%',background:c, cursor:'pointer', border: theme===c?'3px solid #fff':'none', transition: '0.2s', transform: theme===c?'scale(1.1)':'scale(1)'}}/>)}
                </div>
              </div>
              <div className="settings-card">
                <h3 style={{color:'#fff', margin:0, marginBottom: 16}}>Appearance Tweaks</h3>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: '#1e1f22', padding: 12, borderRadius: 6, marginBottom: 8}}>
                  <strong style={{color:'#dbdee1', fontSize:14}}>Compact Message Mode</strong>
                  <input type="checkbox" className="settings-checkbox" defaultChecked={localStorage.getItem('compactMode') === 'true'} onChange={(e) => { localStorage.setItem('compactMode', e.target.checked); window.location.reload(); }} />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: '#1e1f22', padding: 12, borderRadius: 6, marginBottom: 8}}>
                  <strong style={{color:'#dbdee1', fontSize:14}}>Hacker Mode (Terminal UI)</strong>
                  <input type="checkbox" className="settings-checkbox" defaultChecked={localStorage.getItem('monoFont') === 'true'} onChange={(e) => { localStorage.setItem('monoFont', e.target.checked); window.location.reload(); }} />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: '#1e1f22', padding: 12, borderRadius: 6, marginTop: 8}}>
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <strong style={{color:'#dbdee1', fontSize:14}}>Push Notifications</strong>
                    <span style={{color: '#80848e', fontSize: 11}}>Alerts for new messages</span>
                  </div>
                  <button className="settings-btn" style={{background: '#5865F2', color: '#fff', fontSize: '12px', padding: '6px 12px'}} onClick={() => {
                    if (!("Notification" in window)) alert("Browser does not support notifications");
                    else if (Notification.permission === "granted") new Notification("Test Alert", { body: "Notifications are working!" });
                    else Notification.requestPermission().then((p) => { if (p === "granted") new Notification("Success", { body: "Notifications active!" }); });
                  }}>Enable</button>
                </div>
              </div>
            </>
          )}

          {tab === 'admin' && isAdmin && (
            <>
              <h2 style={{color: '#f0b232', marginTop: 0}}>Admin Panel</h2>
              <div className="settings-card">
                <h3 style={{color: '#fff', margin: 0, marginBottom: 16}}>User Management</h3>
                {allUsers && allUsers.map(u => (
                  <div className="ban-list-item" key={u.uid} style={{opacity: u.banned ? 0.5 : 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <img src={u.photoURL || DEFAULT_AVATAR} alt="" style={{width:32, height:32, borderRadius:'50%', objectFit: 'cover'}} />
                      <div style={{display: 'flex', flexDirection: 'column'}}>
                        <strong style={{color: 'white', fontSize: 14}}>{u.displayName}</strong>
                        <span style={{color: '#80848e', fontSize: 11}}>{u.email}</span>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      {u.email !== 'vincentr111222@gmail.com' && (
                        <button className={u.banned ? "unban-btn" : "ban-btn"} onClick={async () => { 
                          if(window.confirm(u.banned ? "Unban this user?" : "Ban user permanently?")) await firestore.collection('users').doc(u.uid).update({ banned: !u.banned });
                        }}>{u.banned ? "Unban" : "Ban Globally"}</button>
                      )}
                    </div>
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

function ServerSettingsModal({ server, close, theme, setView }) {
  const [name, setName] = useState(server.name); 
  const [description, setDescription] = useState(server.description || '');
  const [icon, setIcon] = useState(server.icon || '');
  const [bannerURL, setBannerURL] = useState(server.bannerURL || '');
  const [isPrivate, setPrivate] = useState(server.isPrivate || false);
  const [isMuted, setIsMuted] = useState(localStorage.getItem('mute_' + server.id) === 'true');

  const save = async () => { 
    if (auth.currentUser) {
      const inviteCode = isPrivate ? (server.inviteCode || Math.random().toString(36).substring(2,8).toUpperCase()) : null;
      try {
        await firestore.collection('servers').doc(server.id).update({ name, description, icon, bannerURL, isPrivate, inviteCode }); 
        close(); 
      } catch (err) { alert("Save failed."); }
    }
  };

  const leaveServer = async () => {
    if (window.confirm("Are you sure you want to leave this server?")) {
      await firestore.collection('servers').doc(server.id).update({ members: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid) });
      close();
      setView('discovery');
    }
  }

  const amIOwner = server.owner === auth.currentUser.uid || auth.currentUser.email === 'vincentr111222@gmail.com';

  return (
    <div className="overlay" style={{zIndex:1002}}>
      <div className="modal-box" style={{width: 500}}>
        <h2 style={{margin:0, color:'#fff'}}>{amIOwner ? "Server Customization" : "Server Preferences"}</h2>
        
        {amIOwner && (
          <>
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
            <label style={{marginTop: 16}}>SERVER NAME</label><input value={name} onChange={e=>setName(e.target.value)} />
            <label style={{marginTop: 16}}>SERVER DESCRIPTION</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} style={{resize: 'none'}} />
            
            {auth.currentUser.email === 'vincentr111222@gmail.com' && (
              <div style={{background:'#2b2d31', padding:16, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', border: '1px solid #1e1f22', marginTop: 16}}>
                <div style={{display:'flex',flexDirection:'column'}}><strong style={{color:'#fff', fontSize:14}}>Private Server</strong><span style={{color:'#949ba4', fontSize:12, marginTop: 4}}>Requires Invite Code to join</span></div>
                <div onClick={()=>setPrivate(!isPrivate)} style={{width:40,height:24,background:isPrivate?'#23a559':'#80848e',borderRadius:12,position:'relative',cursor:'pointer'}}><div style={{width:18,height:18,background:'#fff',borderRadius:'50%',position:'absolute',top:3,left:isPrivate?19:3,transition:'0.3s'}}/></div>
              </div>
            )}
            {isPrivate && <div style={{background:'#1e1f22', padding:16, borderRadius:8, textAlign:'center', color:'#23a559', fontSize:28, letterSpacing:6, fontWeight:'900', fontFamily:'monospace', marginTop: 16, border: '1px dashed #23a559'}}>{server.inviteCode||'Save to generate'}</div>}
          </>
        )}

        <div style={{background:'#2b2d31', padding:16, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', border: '1px solid #1e1f22', marginTop: 16}}>
          <div style={{display:'flex',flexDirection:'column'}}><strong style={{color:'#fff', fontSize:14}}>Mute Notifications</strong><span style={{color:'#949ba4', fontSize:12, marginTop: 4}}>Stop desktop alerts for this server</span></div>
          <div onClick={() => { localStorage.setItem('mute_' + server.id, !isMuted); setIsMuted(!isMuted); }} style={{width:40,height:24,background:isMuted?'#da373c':'#80848e',borderRadius:12,position:'relative',cursor:'pointer'}}><div style={{width:18,height:18,background:'#fff',borderRadius:'50%',position:'absolute',top:3,left:isMuted?19:3,transition:'0.3s'}}/></div>
        </div>
        
        <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
          <button onClick={close} style={{flex: 1, background: '#4e5058', color: 'white', padding: '14px'}}>Cancel</button>
          {!amIOwner && <button onClick={leaveServer} style={{flex: 1, background: '#da373c', color: 'white', padding: '14px'}}>Leave Server</button>}
          {amIOwner && <button onClick={save} style={{flex: 1, background: theme, color: 'white', padding: '14px'}}>Save Server</button>}
        </div>
      </div>
    </div>
  )
}

const rtcConfig = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }] };
function VideoCallRoom({ dmId, isCaller, closeCall, myName, otherName, targetUid }) {
  const localRef = useRef(); const remoteRef = useRef(); const pc = useRef(new RTCPeerConnection(rtcConfig));
  const [status, setStatus] = useState("Connecting to camera..."); const [micOn, setMicOn] = useState(true); const [videoOn, setVideoOn] = useState(true);

  const toggleMic = () => { if (localRef.current && localRef.current.srcObject) { localRef.current.srcObject.getAudioTracks().forEach(t => t.enabled = !micOn); setMicOn(!micOn); } };
  const toggleVideo = () => { if (localRef.current && localRef.current.srcObject) { localRef.current.srcObject.getVideoTracks().forEach(t => t.enabled = !videoOn); setVideoOn(!videoOn); } };

  useEffect(() => {
    const setupCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localRef.current) localRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

        pc.current.ontrack = (event) => { if (remoteRef.current) remoteRef.current.srcObject = event.streams[0]; setStatus("Connected securely to " + otherName); };

        const callDoc = firestore.collection('calls').doc(dmId);
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        pc.current.onicecandidate = event => {
          if (event.candidate) { if (isCaller) offerCandidates.add(event.candidate.toJSON()); else answerCandidates.add(event.candidate.toJSON()); }
        };

        if (isCaller) {
          setStatus("Ringing " + otherName + "...");
          const oldOffers = await offerCandidates.get(); oldOffers.forEach(doc => doc.ref.delete());
          const oldAnswers = await answerCandidates.get(); oldAnswers.forEach(doc => doc.ref.delete());

          const offerDescription = await pc.current.createOffer();
          await pc.current.setLocalDescription(offerDescription);
          await callDoc.set({ offer: { type: offerDescription.type, sdp: offerDescription.sdp }, callerName: myName, status: 'ringing', targetUid: targetUid });

          callDoc.onSnapshot(snapshot => {
            const data = snapshot.data();
            if (data && data.answer && !pc.current.currentRemoteDescription) pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            if (data && data.status === 'ended') endCall();
          });
          answerCandidates.onSnapshot(snapshot => { snapshot.docChanges().forEach(change => { if (change.type === 'added') pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data())); }); });
        } else {
          setStatus("Connecting...");
          const callData = (await callDoc.get()).data();
          await pc.current.setRemoteDescription(new RTCSessionDescription(callData.offer));
          const answerDescription = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answerDescription);
          await callDoc.update({ answer: { type: answerDescription.type, sdp: answerDescription.sdp }, status: 'connected' });

          offerCandidates.onSnapshot(snapshot => { snapshot.docChanges().forEach(change => { if (change.type === 'added') pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data())); }); });
          callDoc.onSnapshot(snapshot => { const data = snapshot.data(); if (data && data.status === 'ended') endCall(); });
        }
      } catch (err) { setStatus("Camera/Mic Error: " + err.message); }
    };
    setupCall();
    return () => endCall();
  }, []);

  const endCall = async () => {
    pc.current.close();
    if (localRef.current && localRef.current.srcObject) localRef.current.srcObject.getTracks().forEach(t => t.stop());
    await firestore.collection('calls').doc(dmId).set({ status: 'ended' });
    closeCall();
  };

  return (
    <div className="video-overlay">
      <div style={{position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 100, background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 'bold'}}>🔒 {status}</div>
      <div className="video-grid">
        <video ref={remoteRef} className="remote-video" autoPlay playsInline />
        <video ref={localRef} className="local-video" autoPlay playsInline muted />
      </div>
      <div className="call-controls">
        <button className="call-btn" style={{background: '#35373c'}} onClick={toggleMic}>{micOn ? '🎤' : '🔇'}</button>
        <button className="call-btn" style={{background: '#35373c'}} onClick={toggleVideo}>{videoOn ? '📷' : '🚫'}</button>
        <button className="call-btn hangup" onClick={endCall}>✕</button>
      </div>
    </div>
  );
}
