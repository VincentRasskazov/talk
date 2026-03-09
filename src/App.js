import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/messaging';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

console.log("%c🚀 DEPLOY CHECK: Version 1.0.2 (Verified Update)", "color: #00ff00; font-weight: bold; background: #000; padding: 5px;");

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

  useEffect(() => {
    if (!user || userLoading) return;
    if (userDoc && userDoc.banned) return;
    // Only set initial data if the Firestore document doesn't exist yet!
    if (!userDoc || !userDoc.uid) {
      firestore.collection('users').doc(user.uid).set({ uid: user.uid, email: user.email || '', displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'), photoURL: user.photoURL || DEFAULT_AVATAR }, { merge: true }).catch(e => console.warn(e));
    }
  }, [user, userDoc, userLoading]);

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

function DiscoveryContent({ allServers, setView, setCurrentServer, theme, isGuest }) {
  const publicServers = allServers ? allServers.filter(s => s.isDiscoverable) : [];
  const join = async (s) => {
    if(isGuest || !auth.currentUser) return alert("Log in to join servers!");
    if(s.banned && s.banned.includes(auth.currentUser.uid)) return alert("You are banned from this server.");
    try {
      await firestore.collection('servers').doc(s.id).update({ members: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid) });
      setCurrentServer(s); setView('servers');
    } catch(e) { alert("Failed to join."); }
  };

  const leave = async (s) => {
    if(isGuest || !auth.currentUser) return;
    if(window.confirm(`Leave ${s.name}?`)) {
      try {
        await firestore.collection('servers').doc(s.id).update({ 
          members: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid),
          admins: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid)
        });
      } catch(e) { alert("Failed to leave."); }
    }
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
              {isMember || isGuest ? 
                <div style={{display: 'flex', gap: '8px'}}>
                  <button onClick={() => {setCurrentServer(s); setView('servers');}} style={{flex: 1, background: '#4e5058', color: 'white', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold'}}>{isGuest ? 'Preview Server' : 'Go to Server'}</button>
                  {!isGuest && auth.currentUser && s.owner !== auth.currentUser.uid && <button onClick={() => leave(s)} style={{background: '#da373c', color: 'white', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold'}}>Leave</button>}
                </div> :
                <button onClick={() => join(s)} style={{background: theme, color: 'white', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold'}}>Join Server</button>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfileModal({ userProfile, close, themeColor, isGuest, onLoginClick, startDM, isSelf, currentServer, setView }) {
  if(!userProfile) return null;
  const isSuperAdmin = auth.currentUser && auth.currentUser.email === 'vincentr111222@gmail.com';
  const isServerOwner = currentServer && auth.currentUser && currentServer.owner === auth.currentUser.uid;
  const isServerAdmin = currentServer && currentServer.admins && auth.currentUser && currentServer.admins.includes(auth.currentUser.uid);
  const canManage = isSuperAdmin || isServerOwner || isServerAdmin;
  const targetIsAdmin = currentServer && currentServer.admins && currentServer.admins.includes(userProfile.uid);

  const targetIsOwner = currentServer && currentServer.owner === userProfile.uid;
  const targetIsSuperAdmin = userProfile.email === 'vincentr111222@gmail.com';
  
  // Super admin can ban anyone except themselves. Owner can ban anyone except super admin and themselves. Admins can only ban below them.
  const canBan = !targetIsSuperAdmin && (isSuperAdmin || (isServerOwner && !targetIsOwner) || (isServerAdmin && !targetIsAdmin && !targetIsOwner));

  const toggleAdmin = async () => {
    try {
      if(targetIsAdmin) await firestore.collection('servers').doc(currentServer.id).update({ admins: firebase.firestore.FieldValue.arrayRemove(userProfile.uid) });
      else await firestore.collection('servers').doc(currentServer.id).update({ admins: firebase.firestore.FieldValue.arrayUnion(userProfile.uid) });
      alert("Admin status updated!");
    } catch(e) { alert(e.message); }
  };

  const toggleRole = async (roleId) => {
    try {
      const currentRoles = (currentServer.userRoles && currentServer.userRoles[userProfile.uid]) || [];
      const newRoles = currentRoles.includes(roleId) ? currentRoles.filter(id => id !== roleId) : [...currentRoles, roleId];
      // Using set with merge avoids crashing if the 'userRoles' parent object hasn't been created yet
      await firestore.collection('servers').doc(currentServer.id).set({ userRoles: { [userProfile.uid]: newRoles } }, { merge: true });
    } catch(e) { alert("Failed to assign role: " + e.message); }
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
          
          {currentServer && (
            <div style={{marginTop: 16}}>
              <h4 style={{margin: '0 0 8px 0', color: '#b5bac1', fontSize: 12, textTransform: 'uppercase'}}>Server Roles</h4>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                {targetIsOwner && <div style={{background: '#f0b232', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>Owner</div>}
                {targetIsAdmin && <div style={{background: '#5865F2', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>Admin</div>}
                {currentServer.roles && currentServer.roles.map(r => {
                  const hasRole = currentServer.userRoles && currentServer.userRoles[userProfile.uid] && currentServer.userRoles[userProfile.uid].includes(r.id);
                  if (hasRole) return <div key={r.id} style={{background: r.color, color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)'}}>{r.name}</div>;
                  return null;
                })}
                {!targetIsOwner && !targetIsAdmin && (!currentServer.userRoles || !currentServer.userRoles[userProfile.uid] || currentServer.userRoles[userProfile.uid].length === 0) && <div style={{background: '#4e5058', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>Everyone</div>}
              </div>
            </div>
          )}

          {canManage && currentServer && currentServer.roles && currentServer.roles.length > 0 && (
             <div style={{marginTop: 16, background: '#2b2d31', padding: 12, borderRadius: 8, border: '1px dashed #3f4147'}}>
               <h4 style={{margin: '0 0 8px 0', color: '#b5bac1', fontSize: 11, textTransform: 'uppercase'}}>Assign Roles</h4>
               <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                 {currentServer.roles.map(r => {
                   const hasRole = currentServer.userRoles && currentServer.userRoles[userProfile.uid] && currentServer.userRoles[userProfile.uid].includes(r.id);
                   return <button key={r.id} onClick={() => toggleRole(r.id)} style={{background: hasRole ? r.color : 'transparent', color: hasRole ? '#fff' : r.color, border: `1px solid ${r.color}`, padding: '4px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer'}}>{r.name} {hasRole ? '✓' : '+'}</button>;
                 })}
               </div>
             </div>
          )}

          <div style={{background: '#1e1f22', padding: 16, borderRadius: 8, marginTop: 16, border: '1px solid rgba(255,255,255,0.05)'}}>
            <h4 style={{margin: '0 0 8px 0', color: '#b5bac1', fontSize: 12, textTransform: 'uppercase'}}>About Me</h4>
            <p style={{margin: 0, color: '#dbdee1', fontSize: 14, lineHeight: 1.5}}>{userProfile.bio || "No bio provided."}</p>
          </div>
          {!isGuest && !isSelf && <button onClick={() => { close(); startDM(userProfile); }} style={{width: '100%', padding: 14, background: themeColor, color: '#fff', marginTop: 16, borderRadius: 6, border: 'none', fontWeight: 'bold'}}>Send Message</button>}
          {isGuest && <button onClick={onLoginClick} style={{width: '100%', padding: 14, background: '#4e5058', color: '#fff', marginTop: 16, borderRadius: 6, border: 'none', fontWeight: 'bold'}}>Log in to interact</button>}
          {!isSelf && currentServer && !targetIsSuperAdmin && (
             <div style={{display: 'flex', gap: 8, marginTop: 16}}>
               {(isSuperAdmin || isServerOwner) && <button onClick={toggleAdmin} style={{flex: 1, padding: 10, background: '#35373c', color: '#fff', borderRadius: 6, border: '1px solid #5865F2'}}>{targetIsAdmin ? 'Remove Admin' : 'Make Admin'}</button>}
               {canBan && <button onClick={banFromServer} style={{flex: 1, padding: 10, background: '#da373c', color: '#fff', borderRadius: 6, border: 'none'}}>Ban from Server</button>}
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
  
  const callsQuery = !isGuest && auth.currentUser ? firestore.collection('calls').where('targetUid', '==', auth.currentUser.uid).where('status', '==', 'ringing') : null;
  const [incomingCalls] = useCollectionData(callsQuery, { idField: 'id' });
  const activeIncomingCall = incomingCalls && incomingCalls.length > 0 ? incomingCalls[0] : null;
  const [activeGlobalCall, setActiveGlobalCall] = useState(null);

  const isQuotaExceeded = checkQuotaError(serversError) || checkQuotaError(usersError) || checkQuotaError(dmsError);

  let servers = [];
  if (allServers) {
    servers = allServers.filter(s => {
      if (s.banned && auth.currentUser && s.banned.includes(auth.currentUser.uid)) return false; 
      if (isAdmin) return true;
      if (s.isPublic) return true; 
      if (isGuest && currentServer && currentServer.id === s.id) return true; // Allow guests to preview via sidebar
      if (!isGuest && s.members && auth.currentUser && s.members.includes(auth.currentUser.uid)) return true;
      return false;
    });
  }

  let currentUserData = null;
  if (allUsers && auth.currentUser) currentUserData = allUsers.find(u => u.uid === auth.currentUser.uid);

  useEffect(() => { 
    if (servers.length > 0 && !currentServer && view === 'servers') setCurrentServer(servers[0]); 
  }, [servers, currentServer, view]);

  const unreadDMs = allDMs ? allDMs.filter(dm => dm.updatedAt && dm.updatedAt.toMillis() > parseInt(localStorage.getItem(`read_dm_${dm.id}`) || '0') && (!activeDM || activeDM.id !== dm.id)) : [];

  const startDM = async (targetUser) => {
    if (isGuest || !auth.currentUser) return;
    const uid1 = auth.currentUser.uid; 
    const uid2 = targetUser.uid;
    const dmId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    try {
      const dmRef = firestore.collection('dms').doc(dmId);
      if (!(await dmRef.get()).exists) await dmRef.set({ users: [uid1, uid2], updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      setView('dms'); setActiveDM({ id: dmId, target: targetUser });
    } catch(err) { if(checkQuotaError(err)) alert("Daily quota exceeded."); }
  };

  const closeAllMenus = () => setMobileNavOpen(false);

  return (
    <>
      {isQuotaExceeded && <div className="quota-error-banner">⚠️ Firebase Daily Quota Exceeded. The database will reset at Midnight (PT).</div>}
      
      {activeIncomingCall && !activeGlobalCall && (
        <div className="incoming-call-banner" style={{position: 'absolute', top: 20, right: 20, zIndex: 9999, background: '#23a559', color: 'white', padding: 16, borderRadius: 8, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'}}>
          <div><strong style={{fontSize: 16}}>📞 Incoming Call</strong><br/><span style={{fontSize: 13}}>From: {activeIncomingCall.callerName}</span></div>
          <div style={{display: 'flex', gap: 8}}>
            <button onClick={() => { setView('dms'); setActiveGlobalCall(activeIncomingCall); }} style={{background: '#fff', color: '#23a559', padding: '8px 16px'}}>Accept</button>
            <button onClick={() => firestore.collection('calls').doc(activeIncomingCall.id).update({status: 'ended'})} style={{background: '#da373c', color: '#fff', padding: '8px 16px'}}>Decline</button>
          </div>
        </div>
      )}
      {activeGlobalCall && <VideoCallRoom dmId={activeGlobalCall.id} isCaller={false} closeCall={() => setActiveGlobalCall(null)} myName={currentUserData ? currentUserData.displayName : 'User'} otherName={activeGlobalCall.callerName} targetUid={auth.currentUser.uid} />}

      <div className={`discord-layout ${localStorage.getItem('reverseLayout') === 'true' ? 'layout-reverse' : ''}`}>
        {showSettings && !isGuest && <SettingsModal close={()=>setShowSettings(false)} theme={themeColor} setTheme={setThemeColor} isAdmin={isAdmin} userDoc={currentUserData} allUsers={allUsers} allServers={allServers} />}
        {editingServer && !isGuest && <ServerSettingsModal server={editingServer} close={()=>setEditingServer(null)} theme={themeColor} setView={setView} allUsers={allUsers} isAdmin={isAdmin} />}
        <ProfileModal userProfile={selectedUser} close={()=>setSelectedUser(null)} themeColor={themeColor} isGuest={isGuest} onLoginClick={onLoginClick} startDM={startDM} isSelf={selectedUser && auth.currentUser && selectedUser.uid === auth.currentUser.uid} currentServer={currentServer} setView={setView} />
        {mobileNavOpen && <div className="mobile-overlay open" onClick={closeAllMenus}></div>}
        <div className="sidebar" style={{paddingTop: 12}}>
          <div className="server-icon-wrapper" onClick={() => { setView('dms'); setMobileNavOpen(true); setCurrentServer(null); }}>
            <img src={DEFAULT_AVATAR} className={`server-icon ${view === 'dms' ? 'active' : ''}`} alt="DM" style={{borderRadius: view==='dms'?16:24}} title="Direct Messages" />
          </div>
          <div className="server-icon-wrapper" onClick={() => { setView('discovery'); setMobileNavOpen(true); setCurrentServer(null); }}>
            <div className={`server-icon ${view === 'discovery' ? 'active' : ''}`} style={{background: '#23a559', borderRadius: view==='discovery'?16:24}} title="Discover Servers">🌍</div>
          </div>
          <div className="divider"></div>
          
          {unreadDMs.map(dm => {
            const otherUid = dm.users.find(id => auth.currentUser && id !== auth.currentUser.uid);
            const otherUser = allUsers ? allUsers.find(u => u.uid === otherUid) : null;
            if(!otherUser) return null;
            return (
              <div key={dm.id} className="server-icon-wrapper" onClick={() => { setView('dms'); setActiveDM({id: dm.id, target: otherUser}); setMobileNavOpen(true); setCurrentServer(null); }}>
                <div style={{position: 'absolute', left: -4, width: 8, height: 8, borderRadius: '50%', background: '#fff'}} />
                <img src={otherUser.photoURL || DEFAULT_AVATAR} className="server-icon" alt="DM" style={{borderRadius: '50%', border: `2px solid ${themeColor}`}} title={`Unread message from ${otherUser.displayName}`} />
              </div>
            )
          })}
          {unreadDMs.length > 0 && <div className="divider"></div>}

          {servers.map(s => {
            const isActive = currentServer && currentServer.id === s.id && view === 'servers';
            const hasImage = s.icon && s.icon.startsWith('data:');
            const isUnread = s.updatedAt && s.updatedAt.toMillis() > parseInt(localStorage.getItem(`read_server_${s.id}`) || '0') && !isActive;
            return (
              <div key={s.id} className={`server-icon-wrapper ${isActive ? 'active' : ''}`} onClick={() => { setView('servers'); setCurrentServer(s); setCurrentChannel(null); setMobileNavOpen(true); }}>
                {isUnread && <div style={{position: 'absolute', left: -4, width: 8, height: 8, borderRadius: '50%', background: '#fff'}} />}
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
                  name: n, icon: n.charAt(0).toUpperCase(), isPrivate: isPriv, owner: ownerId, members: [ownerId], admins: [], banned: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                }); 
              } catch(err){ if(checkQuotaError(err)) alert("Action failed: Quota Exceeded."); }
            }
          }}><div className="server-icon server-add-btn">+</div></div>}
        </div>
        {view === 'discovery' ? (
          <DiscoveryContent allServers={allServers} setView={setView} setCurrentServer={setCurrentServer} theme={themeColor} isGuest={isGuest} />
        ) : view === 'servers' && currentServer ? (
          <ServerContent server={currentServer} channel={currentChannel} setChannel={setCurrentChannel} isAdmin={isAdmin} isGuest={isGuest} theme={themeColor} onLoginClick={onLoginClick} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} closeAllMenus={closeAllMenus} channelsOpenPC={channelsOpenPC} setChannelsOpenPC={setChannelsOpenPC} allUsers={allUsers} openProfile={setSelectedUser} myData={currentUserData} openSettings={()=>setShowSettings(true)} setZoomImage={setZoomImage} editServer={() => setEditingServer(currentServer)} />
        ) : view === 'dms' && !isGuest ? (
          <DMContent dms={allDMs} activeDM={activeDM} setActiveDM={setActiveDM} allUsers={allUsers} theme={themeColor} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} closeAllMenus={closeAllMenus} channelsOpenPC={channelsOpenPC} setChannelsOpenPC={setChannelsOpenPC} myData={currentUserData} openSettings={()=>setShowSettings(true)} openProfile={setSelectedUser} setZoomImage={setZoomImage} />
        ) : (
          <EmptyServerState />
        )}
      </div>
    </>
  );
}

function ServerContent({ server, channel, setChannel, isAdmin, isGuest, theme, onLoginClick, mobileNavOpen, setMobileNavOpen, closeAllMenus, channelsOpenPC, setChannelsOpenPC, allUsers, openProfile, myData, openSettings, setZoomImage, editServer }) {
  const dummy = useRef(); const [form, setForm] = useState(''); const [file, setFile] = useState(null);
  const [showMembers, setShowMembers] = useState(false); const [mentionQuery, setMentionQuery] = useState(null);
  const [collapsedCats, setCollapsedCats] = useState({});
  const channelsRef = firestore.collection(`servers/${server.id}/channels`);
  const [channels] = useCollectionData(channelsRef.orderBy('createdAt'), { idField: 'id' });
  const msgsRef = channel ? firestore.collection(`servers/${server.id}/channels/${channel.id}/messages`) : null;
  const [messages] = useCollectionData(msgsRef ? msgsRef.orderBy('createdAt').limit(50) : null, { idField: 'id' });
  
  const categories = {};
  if (channels) {
    channels.forEach(c => {
      const cat = c.category || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c);
    });
  }

  const [lastReadTime, setLastReadTime] = useState(0);

  useEffect(() => {
    if (channel) {
      setLastReadTime(parseInt(localStorage.getItem(`read_chan_${channel.id}`) || '0'));
      localStorage.setItem(`read_chan_${channel.id}`, Date.now().toString());
    }
  }, [channel]);

  useEffect(() => { 
    if (channel && server && messages && messages.length > 0) {
      localStorage.setItem(`read_chan_${channel.id}`, Date.now().toString());
      localStorage.setItem(`read_server_${server.id}`, Date.now().toString());
    }
    const timer = setTimeout(() => {
      if (dummy.current && dummy.current.scrollIntoView) dummy.current.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  }, [messages, channel, server]);

  useEffect(() => { if (channels && channels.length > 0 && (!channel || !channels.find(c=>c.id===channel.id))) setChannel(channels[0]); }, [channels, server]);

  const toggleSidebar = () => { if (window.innerWidth <= 768) { setMobileNavOpen(true); } else { setChannelsOpenPC(!channelsOpenPC); } };
  const canManage = isAdmin || (server.owner && auth.currentUser && server.owner === auth.currentUser.uid) || (server.admins && auth.currentUser && server.admins.includes(auth.currentUser.uid));

  const sendMsg = async (e) => {
    e.preventDefault(); if(isGuest) return onLoginClick();
    if (!form.trim() && !file) return;

    const recentSends = JSON.parse(localStorage.getItem('spam_filter') || '[]').filter(t => Date.now() - t < 10000);
    if (recentSends.length >= 5) return alert("⏳ Slow down! Advanced rate limit active. Try again in 10 seconds.");
    localStorage.setItem('spam_filter', JSON.stringify([...recentSends, Date.now()]));

    const text = form.trim();
    let aiModel = null; let triggerUsed = null; let aiPrompt = null;
    for (const [trigger, modelId] of Object.entries(AI_MODELS)) {
      if (text.toLowerCase().startsWith(trigger + ' ')) { aiModel = modelId; triggerUsed = trigger; aiPrompt = text.substring(trigger.length).trim(); break; }
    }

    if (msgsRef && auth.currentUser) {
      try {
        await msgsRef.add({ text: text, fileData: file ? file.data : null, fileType: file ? file.type : null, fileName: file ? file.name : null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: auth.currentUser.uid, photoURL: myData ? myData.photoURL : DEFAULT_AVATAR, displayName: myData ? myData.displayName : 'User', isEdited: false });
        await firestore.collection('servers').doc(server.id).update({ updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
        await firestore.collection(`servers/${server.id}/channels`).doc(channel.id).update({ updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
        setForm(''); setFile(null); 
        
        if (aiModel && aiPrompt) {
          const msgId = window.crypto.randomUUID(); const token = await generateToken(msgId);
          const response = await fetch(`${BACKEND_URL}/chat`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msgId, token: token, message: "System: You are VincentAI, an advanced AI assistant built directly into Talk, a real-time messaging app. Be helpful, concise, and friendly.\n\nUser: " + aiPrompt, model: aiModel }) });
          if (!response.ok) throw new Error("AI failed");
          const aiResult = await response.text();
          await msgsRef.add({ text: aiResult, createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: 'vincent-ai-bot', photoURL: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=VincentAI', displayName: `VincentAI (${triggerUsed})` });
        }
      } catch (err) { if(checkQuotaError(err)) alert("Message failed to send: Quota Exceeded."); }
    }
  };

  const handleFile = (e) => {
    if(isGuest) return onLoginClick();
    const f = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null); if(!f) return;
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
    const val = e.target.value; setForm(val); const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) setMentionQuery(lastWord.substring(1).toLowerCase()); else setMentionQuery(null);
  };

  const insertMention = (tag) => {
    const words = form.split(' '); words.pop(); setForm(words.length > 0 ? words.join(' ') + ' ' + tag + ' ' : tag + ' '); setMentionQuery(null);
    const input = document.getElementById('server-chat-input'); if (input) input.focus();
  };

  const handlePaste = (e) => {
    if(e.clipboardData && e.clipboardData.items) {
      for(let i=0; i<e.clipboardData.items.length; i++) {
        if(e.clipboardData.items[i].type.indexOf('image') !== -1) {
          const blob = e.clipboardData.items[i].getAsFile();
          handleFile({ target: { files: [blob] } });
        }
      }
    }
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
            {canManage && <button onClick={editServer} style={{background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'}}>⚙️</button>}
          </div>
          {canManage && <button className="add-btn" onClick={async()=>{
            const type = window.confirm("Click OK for Text Channel, or Cancel for Voice/Video Channel") ? 'text' : 'voice';
            const cat = prompt("Category Name (leave blank for Uncategorized):");
            const n = prompt("Channel Name:"); 
            if(n) {
              try { await channelsRef.add({name: n.toLowerCase(), type: type, category: cat || 'Uncategorized', createdAt: firebase.firestore.FieldValue.serverTimestamp()}) }
              catch(err){ if(checkQuotaError(err)) alert("Quota Exceeded."); }
            }
          }}>+</button>}
        </div>
        <div className="channel-list" style={{overflowY: 'auto'}}>
          {Object.keys(categories).map(catName => {
            const isCollapsed = collapsedCats[catName];
            return (
              <div key={catName}>
                <div onClick={() => setCollapsedCats({...collapsedCats, [catName]: !isCollapsed})} style={{color: '#949ba4', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', padding: '16px 8px 4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: '0.2s', userSelect: 'none'}}>
                  <span style={{transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: '0.2s', display: 'inline-block'}}>▼</span> {catName}
                </div>
                {!isCollapsed && categories[catName].map(c => {
                  const isUnread = c.updatedAt && c.updatedAt.toMillis() > parseInt(localStorage.getItem(`read_chan_${c.id}`) || '0') && (!channel || channel.id !== c.id);
                  return (
                    <div key={c.id} className={`channel ${channel && channel.id===c.id ? 'active':''}`} onClick={()=>{setChannel(c); closeAllMenus();}}>
                      <span className="channel-name" style={{color: isUnread ? '#fff' : '', fontWeight: isUnread ? 'bold' : '500'}}>
                        <span className="hash-icon">{c.type === 'voice' ? '🔊' : '#'}</span> {c.name}
                        {isUnread && <div style={{width: 6, height: 6, borderRadius: '50%', background: '#fff', marginLeft: 6}} />}
                      </span>
                      {canManage && <button className="del-btn" onClick={async(e)=>{e.stopPropagation(); if(window.confirm("Delete channel?")) await channelsRef.doc(c.id).delete();}}>✕</button>}
                    </div>
                  );
                })}
              </div>
            );
          })}
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
               <div style={{flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative'}}>
                 <div style={{padding: 16, background: '#2b2d31', color: '#dbdee1', textAlign: 'center'}}>Native Server Voice Channel (Beta)</div>
                 <VideoCallRoom dmId={`server_${server.id}_${channel.id}`} isCaller={true} closeCall={() => setChannel(channels.find(c => c.type==='text') || null)} myName={myData ? myData.displayName : 'User'} otherName={`#${channel.name}`} targetUid="server_room" />
               </div>
            ) : (
              <>
                <main>
                  {messages && (() => {
                    let dividerRendered = false;
                    return messages.map((m) => {
                      const msgTime = m.createdAt && m.createdAt.toMillis ? m.createdAt.toMillis() : Date.now();
                      const showDivider = !dividerRendered && lastReadTime > 0 && msgTime > lastReadTime;
                      if (showDivider) dividerRendered = true;
                      return (
                        <React.Fragment key={m.id}>
                          {showDivider && <div style={{display: 'flex', alignItems: 'center', margin: '16px 16px 0 16px', color: '#da373c', fontSize: '12px', fontWeight: 'bold'}}><div style={{flex: 1, height: 1, background: '#da373c', marginRight: 8}}></div>NEW MESSAGES<div style={{flex: 1, height: 1, background: '#da373c', marginLeft: 8}}></div></div>}
                          <ChatMessage msg={m} msgRef={msgsRef.doc(m.id)} isAdmin={isAdmin} canManage={canManage} isGuest={isGuest} theme={theme} openProfile={() => openProfile(allUsers ? allUsers.find(u => u.uid === m.uid) || m : m)} setZoomImage={setZoomImage} currentServer={server} />
                        </React.Fragment>
                      );
                    });
                  })()}
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
                  {isGuest ? <div style={{background:'#2b2d31', padding:16, borderRadius:8, textAlign:'center', marginTop: 8, border: '1px solid #1e1f22'}}><button className="auth-btn" onClick={onLoginClick} style={{background:theme, width:'auto', margin:0}}>Login to Send Messages</button></div> : 
                  <form onSubmit={sendMsg}>
                    <div className="upload-btn">
                      <label style={{cursor: 'pointer', margin: 0, display: 'flex', width:'100%', height:'100%', justifyContent:'center', alignItems:'center'}}>+ <input type="file" style={{display:'none'}} onChange={handleFile} /></label>
                    </div>
                    <input id="server-chat-input" type="text" value={form} onChange={handleTextChange} onPaste={handlePaste} placeholder={`Message #${channel.name} (or Paste Image)`} autoComplete="off" />
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
        {members.map(u => {
          let roleColor = '#949ba4';
          if (server.userRoles && server.userRoles[u.uid] && server.roles) {
            const topRole = server.roles.find(r => server.userRoles[u.uid].includes(r.id));
            if (topRole) roleColor = topRole.color;
          }
          if (server.owner === u.uid) roleColor = '#f0b232';
          return (
            <div className="member-item" key={u.uid} onClick={()=>{openProfile(u); setShowMembers(false);}}>
              <img src={u.photoURL||DEFAULT_AVATAR} alt="user" />
              <div style={{display:'flex', flexDirection:'column'}}>
                <span style={{color: roleColor}}>{u.displayName}</span>
                <div style={{display: 'flex', gap: '4px', marginTop: '2px'}}>
                  {server.owner === u.uid && <span style={{background: '#f0b232', color: '#000', fontSize: 9, padding: '2px 4px', borderRadius: 4, fontWeight: 'bold'}}>OWNER</span>}
                  {server.admins && server.admins.includes(u.uid) && <span style={{background: '#5865F2', color: '#fff', fontSize: 9, padding: '2px 4px', borderRadius: 4, fontWeight: 'bold'}}>ADMIN</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function DMContent({ dms, activeDM, setActiveDM, allUsers, theme, mobileNavOpen, setMobileNavOpen, closeAllMenus, channelsOpenPC, setChannelsOpenPC, myData, openSettings, openProfile, setZoomImage }) {
  const dummy = useRef(); const [form, setForm] = useState(''); const [file, setFile] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [inCall, setInCall] = useState(false);
  const msgsRef = activeDM ? firestore.collection(`dms/${activeDM.id}/messages`) : null;
  const [messages] = useCollectionData(msgsRef ? msgsRef.orderBy('createdAt').limit(50) : null, { idField: 'id' });

  const [lastReadTime, setLastReadTime] = useState(0);

  useEffect(() => {
    if (activeDM) {
      setLastReadTime(parseInt(localStorage.getItem(`read_dm_${activeDM.id}`) || '0'));
      localStorage.setItem(`read_dm_${activeDM.id}`, Date.now().toString());
    }
  }, [activeDM]);

  useEffect(() => { 
    if (activeDM && messages && messages.length > 0) localStorage.setItem(`read_dm_${activeDM.id}`, Date.now().toString());
    const timer = setTimeout(() => {
      if (dummy.current && dummy.current.scrollIntoView) dummy.current.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  }, [messages, activeDM]);

  const toggleSidebar = () => { if (window.innerWidth <= 768) { setMobileNavOpen(true); } else { setChannelsOpenPC(!channelsOpenPC); } };

  const sendMsg = async (e) => {
    e.preventDefault(); if (!form.trim() && !file) return;

    const recentSends = JSON.parse(localStorage.getItem('spam_filter') || '[]').filter(t => Date.now() - t < 10000);
    if (recentSends.length >= 5) return alert("⏳ Slow down! Advanced rate limit active. Try again in 10 seconds.");
    localStorage.setItem('spam_filter', JSON.stringify([...recentSends, Date.now()]));

    const text = form.trim(); let aiModel = null; let triggerUsed = null; let aiPrompt = null;
    for (const [trigger, modelId] of Object.entries(AI_MODELS)) {
      if (text.toLowerCase().startsWith(trigger + ' ')) { aiModel = modelId; triggerUsed = trigger; aiPrompt = text.substring(trigger.length).trim(); break; }
    }

    if (msgsRef && auth.currentUser) {
      try {
        await msgsRef.add({ text: text, fileData: file ? file.data : null, fileType: file ? file.type : null, fileName: file ? file.name : null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: auth.currentUser.uid, photoURL: myData ? myData.photoURL : DEFAULT_AVATAR, displayName: myData ? myData.displayName : 'User', isEdited: false });
        await firestore.collection('dms').doc(activeDM.id).update({ updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        setForm(''); setFile(null); 
        
        if (activeDM && activeDM.target && activeDM.target.fcmToken) {
           fetch(`${BACKEND_URL}/notify`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               fcmToken: activeDM.target.fcmToken,
               title: `New DM from ${myData ? myData.displayName : 'User'}`,
               body: text ? text : (file ? 'Sent an attachment' : 'New message')
             })
           }).catch(err => console.warn("Push failed:", err));
        }

        if (aiModel && aiPrompt) {
          const msgId = window.crypto.randomUUID(); const token = await generateToken(msgId);
          const response = await fetch(`${BACKEND_URL}/chat`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msgId, token: token, message: "System: You are VincentAI, an advanced AI assistant built directly into Talk, a real-time messaging app. Be helpful, concise, and friendly.\n\nUser: " + aiPrompt, model: aiModel }) });
          if (!response.ok) throw new Error("AI failed to respond.");
          await msgsRef.add({ text: await response.text(), createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: 'vincent-ai-bot', photoURL: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=VincentAI', displayName: `VincentAI (${triggerUsed})` });
        }
      } catch (err) { if(checkQuotaError(err)) alert("Daily Quota Exceeded."); }
    }
  };

  const handleFile = (e) => {
    const f = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null); if(!f) return;
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
    const val = e.target.value; setForm(val); const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) setMentionQuery(lastWord.substring(1).toLowerCase()); else setMentionQuery(null);
  };

  const insertMention = (tag) => {
    const words = form.split(' '); words.pop(); setForm(words.length > 0 ? words.join(' ') + ' ' + tag + ' ' : tag + ' '); setMentionQuery(null);
    const input = document.getElementById('dm-chat-input'); if (input) input.focus();
  };

  const handlePaste = (e) => {
    if(e.clipboardData && e.clipboardData.items) {
      for(let i=0; i<e.clipboardData.items.length; i++) {
        if(e.clipboardData.items[i].type.indexOf('image') !== -1) {
          const blob = e.clipboardData.items[i].getAsFile();
          handleFile({ target: { files: [blob] } });
        }
      }
    }
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
            const isUnread = dm.updatedAt && dm.updatedAt.toMillis() > parseInt(localStorage.getItem(`read_dm_${dm.id}`) || '0') && (!activeDM || activeDM.id !== dm.id);
            return (
              <div key={dm.id} className={`channel ${activeDM && activeDM.id===dm.id ? 'active':''}`} onClick={()=>{setActiveDM({id: dm.id, target: otherUser}); closeAllMenus();}}>
                <div style={{display:'flex', alignItems:'center', gap:10, color: isUnread ? '#fff' : '', fontWeight: isUnread ? 'bold' : 'normal'}}>
                  <img src={otherUser.photoURL || DEFAULT_AVATAR} style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} alt="" />
                  {otherUser.displayName}
                  {isUnread && <div style={{width: 8, height: 8, borderRadius: '50%', background: theme, marginLeft: 'auto'}} />}
                </div>
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
              <button onClick={() => setInCall(true)} style={{background: 'none', color: '#23a559', fontSize: 20}}>📞</button>
            </header>
            
            {inCall && <VideoCallRoom dmId={activeDM.id} isCaller={true} closeCall={() => setInCall(false)} myName={myData ? myData.displayName : 'User'} otherName={activeDM.target.displayName} targetUid={activeDM.target.uid} />}
            
            <main>
              {messages && (() => {
                let dividerRendered = false;
                return messages.map((m) => {
                  const msgTime = m.createdAt && m.createdAt.toMillis ? m.createdAt.toMillis() : Date.now();
                  const showDivider = !dividerRendered && lastReadTime > 0 && msgTime > lastReadTime;
                  if (showDivider) dividerRendered = true;
                  return (
                    <React.Fragment key={m.id}>
                      {showDivider && <div style={{display: 'flex', alignItems: 'center', margin: '16px 16px 0 16px', color: '#da373c', fontSize: '12px', fontWeight: 'bold'}}><div style={{flex: 1, height: 1, background: '#da373c', marginRight: 8}}></div>NEW MESSAGES<div style={{flex: 1, height: 1, background: '#da373c', marginLeft: 8}}></div></div>}
                      <ChatMessage msg={m} msgRef={msgsRef.doc(m.id)} canManage={false} isGuest={false} theme={theme} openProfile={() => openProfile(allUsers ? allUsers.find((u) => u.uid === m.uid) || m : m)} setZoomImage={setZoomImage} serverAdmins={[]} />
                    </React.Fragment>
                  );
                });
              })()}
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
                <input id="dm-chat-input" type="text" value={form} onChange={handleTextChange} onPaste={handlePaste} placeholder={`Message @${activeDM.target.displayName} (or Paste Image)`} autoComplete="off" />
                <button type="submit" style={{display:'none'}}></button>
              </form>
            </div>
          </>
        ) : <EmptyChannelState />}
      </div>
    </>
  )
}

function ChatMessage({ msg, msgRef, isAdmin, canManage, isGuest, theme, openProfile, onLoginClick, setZoomImage, currentServer }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text || '');
  
  const serverOwner = currentServer ? currentServer.owner : null;
  const serverAdmins = currentServer ? currentServer.admins || [] : [];

  const formatText = (text) => {
    if (!text) return null;
    
    let cleanText = text;
    if (typeof cleanText === 'string') {
      cleanText = cleanText.replace(/\\n/g, '\n');
    }
    
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const blocks = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(cleanText)) !== null) {
      blocks.push({ type: 'text', content: cleanText.substring(lastIndex, match.index) });
      blocks.push({ type: 'code', content: match[1] });
      lastIndex = codeBlockRegex.lastIndex;
    }
    blocks.push({ type: 'text', content: cleanText.substring(lastIndex) });

    return blocks.map((block, bIdx) => {
      if (block.type === 'code') {
        return (
          <pre key={bIdx} style={{ background: '#1e1f22', padding: '12px', borderRadius: '6px', overflowX: 'auto', border: '1px solid #3f4147', marginTop: '8px', marginBottom: '8px' }}>
            <code style={{ fontFamily: 'monospace', color: '#dbdee1', fontSize: '0.9em', whiteSpace: 'pre-wrap' }}>{block.content.replace(/^\s+|\s+$/g, '')}</code>
          </pre>
        );
      }

      return block.content.split('\n').map((line, i) => {
        let el = line;
        let isH1 = false, isH2 = false, isH3 = false, isQuote = false;

        if (el.startsWith('### ')) { isH3 = true; el = el.substring(4); }
        else if (el.startsWith('## ')) { isH2 = true; el = el.substring(3); }
        else if (el.startsWith('# ')) { isH1 = true; el = el.substring(2); }
        else if (el.startsWith('> ')) { isQuote = true; el = el.substring(2); }

        const tokens = el.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

        const formattedTokens = tokens.map((tok, j) => {
          if (tok.startsWith('**') && tok.endsWith('**')) return <strong key={j}>{tok.slice(2, -2)}</strong>;
          if (tok.startsWith('*') && tok.endsWith('*')) return <em key={j}>{tok.slice(1, -1)}</em>;
          if (tok.startsWith('`') && tok.endsWith('`')) return <code key={j} style={{background: '#1e1f22', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: '#eb459e', fontSize: '0.9em'}}>{tok.slice(1, -1)}</code>;
          return tok;
        });

        let style = { display: 'block', minHeight: line.trim() === '' ? '1.2em' : 'auto', whiteSpace: 'pre-wrap' };
        if (isH1) style = { ...style, fontSize: '1.5em', fontWeight: 'bold', marginTop: '12px', color: '#fff' };
        if (isH2) style = { ...style, fontSize: '1.3em', fontWeight: 'bold', marginTop: '10px', color: '#fff' };
        if (isH3) style = { ...style, fontSize: '1.1em', fontWeight: 'bold', marginTop: '8px', color: '#fff' };
        if (isQuote) style = { ...style, borderLeft: '4px solid #4e5058', paddingLeft: '12px', fontStyle: 'italic', color: '#b5bac1', margin: '4px 0' };

        return <span key={`${bIdx}-${i}`} style={style}>{formattedTokens}</span>;
      });
    });
  };
  
  let roleColor = '#f2f3f5';
  if (currentServer && currentServer.userRoles && currentServer.userRoles[msg.uid] && currentServer.roles) {
    const userRoleIds = currentServer.userRoles[msg.uid];
    const topRole = currentServer.roles.find(r => userRoleIds.includes(r.id));
    if (topRole) roleColor = topRole.color;
  }
  if (serverOwner === msg.uid) roleColor = '#f0b232';

  const saveEdit = async (e) => {
    e.preventDefault();
    if (editText.trim() && editText !== msg.text) {
      try {
        await msgRef.update({ text: editText.trim(), isEdited: true });
      } catch(err) { console.error(err); }
    }
    setIsEditing(false);
  };

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
          <span className="msg-author" onClick={openProfile} style={{color: roleColor}}>{msg.displayName}</span>
          {serverOwner && msg.uid === serverOwner && <span style={{background: '#f0b232', color: '#1e1f22', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold'}}>OWNER</span>}
          <span className="msg-timestamp">{formatTimestamp(msg.createdAt)}{msg && msg.isEdited ? ' (edited)' : ''}</span>
      </div>
      {isEditing ? (
        <form onSubmit={saveEdit} style={{ margin: '4px 0', padding: 0, background: 'transparent', minHeight: 'auto', border: 'none', boxShadow: 'none' }}>
          <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #5865F2', background: '#1e1f22', color: '#dbdee1' }} autoFocus />
          <div style={{ fontSize: '11px', color: '#949ba4', marginTop: '4px' }}>Press Enter to save, or <span style={{color: '#5865F2', cursor: 'pointer'}} onClick={() => setIsEditing(false)}>cancel</span>.</div>
        </form>
      ) : (
        msg.text ? <div style={{ margin: 0, color: '#dbdee1', fontSize: 15, lineHeight: '1.45rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{formatText(msg.text)}</div> : null
      )}
      {msg.fileData && msg.fileType==='image' && <img src={msg.fileData} className="msg-img" alt="attachment" onLoad={(e) => { if (e.target && e.target.scrollIntoView) e.target.scrollIntoView({ behavior: 'smooth', block: 'end' }); }} onClick={()=>setZoomImage(msg.fileData)} />}
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
      
      {!isGuest && (() => {
        const isMyMsg = auth.currentUser && msg.uid === auth.currentUser.uid;
        const amIOwner = auth.currentUser && serverOwner && auth.currentUser.uid === serverOwner;
        const amIAdmin = auth.currentUser && serverAdmins && serverAdmins.includes(auth.currentUser.uid);
        const isMsgFromOwner = serverOwner && msg.uid === serverOwner;
        const canDelete = isMyMsg || isAdmin || amIOwner || (amIAdmin && !isMsgFromOwner);
        
        return (
          <div className="msg-hover-actions">
            {EMOJI_LIST.map(em => <button key={em} className="react-btn" onClick={()=>toggleReact(em)}>{em}</button>)}
            {isMyMsg ? <button onClick={() => setIsEditing(true)} style={{background:'none', color:'#b5bac1', fontSize:11, fontWeight: 'bold', marginLeft: 8}}>EDIT</button> : null}
            {canDelete ? <button onClick={()=>msgRef.delete()} style={{background:'none', color:'#da373c', fontSize:11, fontWeight: 'bold', marginLeft: 8}}>DEL</button> : null}
          </div>
        );
      })()}
    </div>
  )
}

function ServerSettingsModal({ server, close, theme, setView, allUsers, isAdmin }) {
  const [tab, setTab] = useState('overview');
  const [name, setName] = useState(server.name); 
  const [description, setDescription] = useState(server.description || '');
  const [icon, setIcon] = useState(server.icon || '');
  const [bannerURL, setBannerURL] = useState(server.bannerURL || '');
  const [isPublic, setIsPublic] = useState(server.isPublic || false);
  const [isDiscoverable, setIsDiscoverable] = useState(server.isDiscoverable || false);
  const [isMuted, setIsMuted] = useState(localStorage.getItem('mute_' + server.id) === 'true');
  const [roles, setRoles] = useState(server.roles || []);

  const isOwner = auth.currentUser && server.owner === auth.currentUser.uid;
  const bannedUsers = allUsers ? allUsers.filter(u => server.banned && server.banned.includes(u.uid)) : [];

  const unbanUser = async (uid) => {
    try {
      await firestore.collection('servers').doc(server.id).update({ banned: firebase.firestore.FieldValue.arrayRemove(uid) });
    } catch (err) { alert(err.message); }
  };

  const deleteServer = async () => {
    if (window.confirm(`Are you absolutely sure you want to delete ${server.name}? This cannot be undone.`)) {
      try {
        await firestore.collection('servers').doc(server.id).delete();
        setView('discovery');
        close();
      } catch(err) { alert(err.message); }
    }
  };

  const save = async () => {
    if (auth.currentUser) {
      const inviteCode = !isPublic ? (server.inviteCode || Math.random().toString(36).substring(2,8).toUpperCase()) : null;
      let members = server.members || [];
      if (!isPublic && members.length === 0) members = [auth.currentUser.uid];
      try {
        await firestore.collection('servers').doc(server.id).update({ name, description, icon, bannerURL, isPublic, isDiscoverable, inviteCode, members, roles }); 
        close(); 
      } catch (err) {
        if(checkQuotaError(err)) alert("Save failed: Daily Quota Exceeded.");
      }
    }
  };

  return (
    <div className="overlay" style={{zIndex:1002}}>
      <div className="modal-box" style={{width: 550, padding: 0, overflow: 'hidden'}}>
        <div style={{display: 'flex', background: '#2b2d31', borderBottom: '1px solid #1e1f22'}}>
          <button onClick={() => setTab('overview')} style={{flex: 1, padding: 16, background: tab === 'overview' ? '#35373c' : 'transparent', color: tab === 'overview' ? '#fff' : '#b5bac1', borderRadius: 0}}>Overview</button>
          {(isOwner || isAdmin) && <button onClick={() => setTab('roles')} style={{flex: 1, padding: 16, background: tab === 'roles' ? '#35373c' : 'transparent', color: tab === 'roles' ? '#fff' : '#b5bac1', borderRadius: 0}}>Roles</button>}
          <button onClick={() => setTab('moderation')} style={{flex: 1, padding: 16, background: tab === 'moderation' ? '#35373c' : 'transparent', color: tab === 'moderation' ? '#fff' : '#b5bac1', borderRadius: 0}}>Moderation</button>
          {(isOwner || isAdmin) && <button onClick={() => setTab('danger')} style={{flex: 1, padding: 16, background: tab === 'danger' ? '#da373c' : 'transparent', color: tab === 'danger' ? '#fff' : '#b5bac1', borderRadius: 0}}>Danger Zone</button>}
        </div>
        
        <div style={{padding: 24, maxHeight: '70vh', overflowY: 'auto'}}>
          {tab === 'overview' && (
            <>
              <div style={{display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
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
              
              {(isOwner || isAdmin) && (
                <div style={{background:'#2b2d31', padding:16, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', border: '1px solid #1e1f22', marginTop: 16}}>
                  <div style={{display:'flex',flexDirection:'column'}}><strong style={{color:'#fff', fontSize:14}}>List on Discovery</strong><span style={{color:'#949ba4', fontSize:12, marginTop: 4}}>Allow users to find this server via Discovery</span></div>
                  <div onClick={()=>setIsDiscoverable(!isDiscoverable)} style={{width:40,height:24,background:isDiscoverable?'#23a559':'#80848e',borderRadius:12,position:'relative',cursor:'pointer'}}><div style={{width:18,height:18,background:'#fff',borderRadius:'50%',position:'absolute',top:3,left:isDiscoverable?19:3,transition:'0.3s'}}/></div>
                </div>
              )}

              {isAdmin && (
                <div style={{background:'#2b2d31', padding:16, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', border: '1px solid #1e1f22', marginTop: 16}}>
                  <div style={{display:'flex',flexDirection:'column'}}><strong style={{color:'#f0b232', fontSize:14}}>Admin Override: Public Server</strong><span style={{color:'#949ba4', fontSize:12, marginTop: 4}}>Toggle ON to make this server public for everyone</span></div>
                  <div onClick={()=>setIsPublic(!isPublic)} style={{width:40,height:24,background:isPublic?'#23a559':'#80848e',borderRadius:12,position:'relative',cursor:'pointer'}}><div style={{width:18,height:18,background:'#fff',borderRadius:'50%',position:'absolute',top:3,left:isPublic?19:3,transition:'0.3s'}}/></div>
                </div>
              )}
              
              {!isPublic && (isOwner || isAdmin) && <div style={{background:'#1e1f22', padding:16, borderRadius:8, textAlign:'center', color:'#23a559', fontSize:28, letterSpacing:6, fontWeight:'900', fontFamily:'monospace', marginTop: 16, border: '1px dashed #23a559'}}>{server.inviteCode||'Save to generate'}</div>}
              
              <div style={{background:'#2b2d31', padding:16, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', border: '1px solid #1e1f22', marginTop: 16}}>
                <div style={{display:'flex',flexDirection:'column'}}><strong style={{color:'#fff', fontSize:14}}>Mute Notifications</strong><span style={{color:'#949ba4', fontSize:12, marginTop: 4}}>Stop desktop alerts for this server</span></div>
                <div onClick={() => { localStorage.setItem('mute_' + server.id, !isMuted); setIsMuted(!isMuted); }} style={{width:40,height:24,background:isMuted?'#da373c':'#80848e',borderRadius:12,position:'relative',cursor:'pointer'}}><div style={{width:18,height:18,background:'#fff',borderRadius:'50%',position:'absolute',top:3,left:isMuted?19:3,transition:'0.3s'}}/></div>
              </div>
            </>
          )}

          {tab === 'roles' && (isOwner || isAdmin) && (
            <>
              <h3 style={{color: '#fff', marginTop: 0}}>Custom Roles</h3>
              <p style={{color: '#949ba4', fontSize: 13}}>Create custom roles with specific colors.</p>
              
              <div style={{display: 'flex', gap: 8, marginBottom: 16}}>
                <button onClick={() => setRoles([...roles, { id: Date.now().toString(), name: 'New Role', color: '#99aab5' }])} style={{background: theme, color: '#fff', padding: '8px 16px'}}>+ Create Role</button>
              </div>

              {roles.map((r, i) => (
                <div key={r.id} style={{display: 'flex', flexDirection: 'column', gap: 8, background: '#2b2d31', padding: 12, borderRadius: 8, marginBottom: 8, border: '1px solid #1e1f22'}}>
                  <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                    <div style={{width: 24, height: 24, borderRadius: '50%', background: r.color, flexShrink: 0}}></div>
                    <input value={r.name} onChange={(e) => { const newRoles = [...roles]; newRoles[i].name = e.target.value; setRoles(newRoles); }} style={{margin: 0, padding: 8}} placeholder="Role Name" />
                    <input type="color" value={r.color} onChange={(e) => { const newRoles = [...roles]; newRoles[i].color = e.target.value; setRoles(newRoles); }} style={{width: 40, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer'}} />
                    <button onClick={() => setRoles(roles.filter(role => role.id !== r.id))} style={{background: '#da373c', color: '#fff', padding: '8px', fontSize: 12}}>DEL</button>
                  </div>
                  <div style={{display: 'flex', gap: 16, fontSize: 13, color: '#b5bac1', marginTop: 4}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 6, margin: 0, textTransform: 'none', fontWeight: 'normal'}}>
                      <input type="checkbox" checked={r.perms && r.perms.delMsg} onChange={(e) => { const newRoles = [...roles]; if(!newRoles[i].perms) newRoles[i].perms={}; newRoles[i].perms.delMsg = e.target.checked; setRoles(newRoles); }} style={{width: 16, height: 16, margin: 0}} /> Can Delete Messages
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', gap: 6, margin: 0, textTransform: 'none', fontWeight: 'normal'}}>
                      <input type="checkbox" checked={r.perms && r.perms.kick} onChange={(e) => { const newRoles = [...roles]; if(!newRoles[i].perms) newRoles[i].perms={}; newRoles[i].perms.kick = e.target.checked; setRoles(newRoles); }} style={{width: 16, height: 16, margin: 0}} /> Can Kick Users
                    </label>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'moderation' && (
            <>
              <h3 style={{color: '#fff', marginTop: 0}}>Banned Users</h3>
              <p style={{color: '#949ba4', fontSize: 13}}>Manage users who have been banned from this server.</p>
              {bannedUsers.length === 0 ? <div style={{color: '#80848e', fontStyle: 'italic', padding: 16, textAlign: 'center', background: '#1e1f22', borderRadius: 8}}>No banned users.</div> : bannedUsers.map(u => (
                <div key={u.uid} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2b2d31', padding: 12, borderRadius: 8, marginBottom: 8, border: '1px solid #1e1f22'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <img src={u.photoURL || DEFAULT_AVATAR} style={{width: 32, height: 32, borderRadius: '50%'}} alt="pfp" />
                    <strong style={{color: '#fff'}}>{u.displayName}</strong>
                  </div>
                  <button onClick={() => unbanUser(u.uid)} style={{background: '#35373c', color: '#dbdee1', padding: '6px 12px', fontSize: 12}}>Revoke Ban</button>
                </div>
              ))}
            </>
          )}

          {tab === 'danger' && isOwner && (
            <>
              <h3 style={{color: '#da373c', marginTop: 0}}>Danger Zone</h3>
              <p style={{color: '#949ba4', fontSize: 13}}>Irreversible actions for your server.</p>
              <div style={{border: '1px solid #da373c', borderRadius: 8, padding: 16, background: 'rgba(218, 55, 60, 0.1)'}}>
                <strong style={{color: '#fff'}}>Delete Server</strong>
                <p style={{color: '#dbdee1', fontSize: 13, marginTop: 4, marginBottom: 16}}>This will permanently delete the server, all channels, and all messages. This action cannot be undone.</p>
                <button onClick={deleteServer} style={{background: '#da373c', color: '#fff', padding: '10px 16px', width: '100%'}}>Delete Server</button>
              </div>
            </>
          )}
        </div>
        
        <div style={{display: 'flex', gap: '12px', padding: 24, background: '#2b2d31', borderTop: '1px solid #1e1f22'}}>
          <button onClick={close} style={{flex: 1, background: '#4e5058', color: 'white', padding: '14px'}}>Cancel</button>
          <button onClick={save} style={{flex: 1, background: theme, color: 'white', padding: '14px'}}>Save Changes</button>
        </div>
      </div>
    </div>
  );
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
          displayName: name || '', 
          bio: bio || '', 
          statusText: statusText || '', 
          pronouns: pronouns || '', 
          photoURL: photo || DEFAULT_AVATAR, 
          bannerURL: bannerURL || '' 
        }, {merge:true}); 
        
        // Removed photoURL from Auth update to prevent Base64 string length errors
        await auth.currentUser.updateProfile({ displayName: name || '' }); 
        alert("Profile saved successfully!");
      } catch (err) {
        if (checkQuotaError(err)) alert("Save failed: Daily Quota Exceeded. Try again tomorrow.");
        else alert("Error saving profile: " + err.message);
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
                <p style={{color:'#949ba4', fontSize: 13, marginTop: 4, marginBottom: 16}}>Manage your password or link a Google account.</p>
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  <button className="save-btn" onClick={() => {
                    auth.sendPasswordResetEmail(auth.currentUser.email)
                      .then(() => alert('Password reset email sent! Please check your inbox (and spam folder).'))
                      .catch(e => alert(e.message));
                  }} style={{background:'#2b2d31', color:'#dbdee1', border: '1px solid #404249', width: 'fit-content'}}>
                    Reset Password
                  </button>
                  <button className="save-btn" onClick={() => auth.currentUser.linkWithPopup(new firebase.auth.GoogleAuthProvider()).then(()=>alert('Linked!')).catch(e=>alert(e.message))} style={{background:'#f2f3f5', color:'#1e1f22', width: 'fit-content'}}>
                    Link Google Account
                  </button>
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

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: '#1e1f22', padding: 12, borderRadius: 6, marginTop: 8}}>
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <strong style={{color:'#dbdee1', fontSize:14}}>Push Notifications</strong>
                    <span style={{color: '#80848e', fontSize: 11}}>Alerts for new messages</span>
                  </div>
                  <button className="settings-btn" style={{background: '#5865F2', color: '#fff', fontSize: '12px', padding: '6px 12px'}} onClick={async () => {
                    if (!("Notification" in window)) return alert("Browser does not support notifications");
                    try {
                      const permission = await Notification.requestPermission();
                      if (permission === 'granted') {
                        const swPath = window.location.pathname.includes('/talk') ? '/talk/firebase-messaging-sw.js' : '/firebase-messaging-sw.js';
                        
                        const reg = await navigator.serviceWorker.register(swPath);
                        await reg.update(); // Force the browser to bypass stale workers
                        
                        const readyReg = await navigator.serviceWorker.ready;
                        const messaging = firebase.messaging();
                        
                        // Catch the singleton crash if the user clicks this button twice
                        try {
                          messaging.useServiceWorker(readyReg);
                        } catch (err) {
                          console.warn("Firebase SW bind skipped (already bound):", err.message);
                        }
                        
                        const token = await messaging.getToken({ 
                          vapidKey: 'BNiZSSQ1B3e3sBgpiwmlqtOT9BeAYoM2wD9x7WTqxn6MLVA-U6fJMVtVB9RwNH_2YjUH_T8MuFAiNRDdyIq8tf0' 
                        });
                        
                        if (token && auth.currentUser) {
                          await firestore.collection('users').doc(auth.currentUser.uid).update({ fcmToken: token });
                          alert("Push notifications successfully enabled and linked to your account!");
                        } else {
                          alert("Failed to generate push token.");
                        }
                      } else {
                        alert("You blocked notifications in your browser settings.");
                      }
                    } catch (err) {
                      console.error(err);
                      if (err.message && err.message.includes("quota")) alert("Quota exceeded.");
                      else alert("Error enabling notifications: " + err.message);
                    }
                  }}>Enable</button>
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
                    
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button className="settings-btn" style={{padding: '6px 12px', fontSize: '12px', background: '#35373c', color: '#dbdee1'}} onClick={async () => {
                        const newName = prompt(`Enter new Display Name for ${u.displayName}:`, u.displayName);
                        if (newName !== null && newName.trim() !== '') {
                          try { await firestore.collection('users').doc(u.uid).update({ displayName: newName.trim() }); alert("User updated!"); }
                          catch(err) { alert("Error updating user: " + err.message); }
                        }
                      }}>Edit</button>

                      {u.email !== 'vincentr111222@gmail.com' && (
                        <button className={u.banned ? "unban-btn" : "ban-btn"} onClick={async () => { 
                          if(window.confirm(u.banned ? "Unban this user?" : "Ban user permanently?")) {
                            try { await firestore.collection('users').doc(u.uid).update({ banned: !u.banned }); }
                            catch(err) { if (checkQuotaError(err)) alert("Action failed: Quota Exceeded."); }
                          }
                        }}>{u.banned ? "Unban" : "Ban"}</button>
                      )}
                    </div>
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


// --- WEBRTC VIDEO ENGINE ---

// --- WEBRTC VIDEO ENGINE ---
const rtcConfig = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }] };

function VideoCallRoom({ dmId, isCaller, closeCall, myName, otherName, targetUid }) {
  const localRef = useRef();
  const remoteRef = useRef();
  const pc = useRef(new RTCPeerConnection(rtcConfig));
  const [status, setStatus] = useState("Connecting to camera...");
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const toggleMic = () => {
    if (localRef.current && localRef.current.srcObject) {
      localRef.current.srcObject.getAudioTracks().forEach(t => t.enabled = !micOn);
      setMicOn(!micOn);
    }
  };
  const toggleVideo = () => {
    if (localRef.current && localRef.current.srcObject) {
      localRef.current.srcObject.getVideoTracks().forEach(t => t.enabled = !videoOn);
      setVideoOn(!videoOn);
    }
  };

  useEffect(() => {
    const setupCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localRef.current) localRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

        pc.current.ontrack = (event) => {
          if (remoteRef.current) remoteRef.current.srcObject = event.streams[0];
          setStatus("Connected securely to " + otherName);
        };

        const callDoc = firestore.collection('calls').doc(dmId);
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        pc.current.onicecandidate = event => {
          if (event.candidate) {
            if (isCaller) offerCandidates.add(event.candidate.toJSON());
            else answerCandidates.add(event.candidate.toJSON());
          }
        };

        if (isCaller) {
          setStatus("Ringing " + otherName + "...");
          const oldOffers = await offerCandidates.get();
          oldOffers.forEach(doc => doc.ref.delete());
          const oldAnswers = await answerCandidates.get();
          oldAnswers.forEach(doc => doc.ref.delete());

          const offerDescription = await pc.current.createOffer();
          await pc.current.setLocalDescription(offerDescription);
          await callDoc.set({ offer: { type: offerDescription.type, sdp: offerDescription.sdp }, callerName: myName, status: 'ringing', targetUid: targetUid });

          callDoc.onSnapshot(snapshot => {
            const data = snapshot.data();
            if (data && data.answer && !pc.current.currentRemoteDescription) {
              pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
            if (data && data.status === 'ended') endCall();
          });

          answerCandidates.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            });
          });
        } else {
          setStatus("Connecting...");
          const callData = (await callDoc.get()).data();
          await pc.current.setRemoteDescription(new RTCSessionDescription(callData.offer));
          const answerDescription = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answerDescription);
          await callDoc.update({ answer: { type: answerDescription.type, sdp: answerDescription.sdp }, status: 'connected' });

          offerCandidates.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            });
          });

          callDoc.onSnapshot(snapshot => {
            const data = snapshot.data();
            if (data && data.status === 'ended') endCall();
          });
        }
      } catch (err) {
        setStatus("Camera/Mic Error: " + err.message);
      }
    };

    setupCall();
    return () => endCall();
  }, []);

  const endCall = async () => {
    pc.current.close();
    if (localRef.current && localRef.current.srcObject) {
      localRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    await firestore.collection('calls').doc(dmId).set({ status: 'ended' });
    closeCall();
  };

  return (
    <div className="video-overlay">
      <div style={{position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 100, background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 'bold'}}>
        🔒 {status}
      </div>
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
