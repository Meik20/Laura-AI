import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, addDoc, getDocs, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function LearnCommunityPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  
  const [forums, setForums] = useState([]);
  const [memberships, setMemberships] = useState({}); // forumId -> statut
  const [participantCounts, setParticipantCounts] = useState({}); // forumId -> count
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeForum, setActiveForum] = useState(null); // The currently opened forum
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const [mobilePane, setMobilePane] = useState('list'); // 'list' | 'chat'

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForumLevel, setNewForumLevel] = useState('');
  const [newForumSerie, setNewForumSerie] = useState('');
  
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);

  // Check if user has joined the community
  const joinedCommunity = userProfile?.role === 'admin' || userProfile?.joinedCommunity || false;

  // 1. Fetch Forums & Memberships
  useEffect(() => {
    if (!userProfile?.uid) return;

    // Fetch memberships
    const qMem = query(collection(db, 'forum_memberships'), where('userId', '==', userProfile.uid));
    const unsubMem = onSnapshot(qMem, (snap) => {
      const memData = {};
      snap.forEach(d => {
        memData[d.data().forumId] = d.data().statut;
      });
      setMemberships(memData);
    });

    // Fetch forums
    const qForums = query(collection(db, 'forums'), orderBy('createdAt', 'desc'));
    const unsubForums = onSnapshot(qForums, (snap) => {
      const fData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setForums(fData);
      setIsLoading(false);
    });

    return () => { unsubMem(); unsubForums(); };
  }, [userProfile]);

  // 2. Load Messages when active forum changes
  useEffect(() => {
    if (!activeForum) return;
    
    // Check if user is approved
    const isApproved = userProfile?.role === 'admin' || memberships[activeForum.id] === 'approuve';
    if (!isApproved) return;

    const qMsg = query(collection(db, 'forums', activeForum.id, 'messages'), orderBy('createdAt', 'asc'));
    const unsubMsg = onSnapshot(qMsg, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubMsg();
  }, [activeForum, memberships]);

  // 3. Count approved participants dynamically for each forum
  useEffect(() => {
    const qMems = query(collection(db, 'forum_memberships'), where('statut', '==', 'approuve'));
    const unsub = onSnapshot(qMems, (snap) => {
      const counts = {};
      snap.forEach(d => {
        const fId = d.data().forumId;
        counts[fId] = (counts[fId] || 0) + 1;
      });
      setParticipantCounts(counts);
    });
    return () => unsub();
  }, []);

  const handleJoinCommunity = async () => {
    if (!userProfile?.uid) return;
    try {
      const ref = doc(db, 'users', userProfile.uid);
      await updateDoc(ref, { joinedCommunity: true });
      setShowJoinSuccess(true);
    } catch (e) {
      console.error(e);
      alert(t('community.alerts.join_error', "Erreur lors de l'adhésion à la communauté."));
    }
  };

  const handleRequestJoin = async (forumId) => {
    if (!userProfile?.uid) return;
    try {
      await addDoc(collection(db, 'forum_memberships'), {
        forumId,
        userId: userProfile.uid,
        userName: `${userProfile.prenom || ''} ${userProfile.nom || ''}`.trim(),
        userEmail: userProfile.email || '',
        userNiveau: userProfile.niveau || '',
        userSerie: userProfile.serie || '',
        userExamen: userProfile.examen || '',
        statut: 'en_attente',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      alert(t('community.alerts.request_error', "Erreur lors de la demande d'accès."));
    }
  };

  const handleCreateForum = async (e) => {
    e.preventDefault();
    if (!userProfile?.uid || !newForumLevel.trim()) return;

    const generatedName = newForumSerie.trim()
      ? `${newForumLevel.trim()} ${newForumSerie.trim()}`
      : newForumLevel.trim();

    try {
      // Check if forum with same level + serie already exists (approved or pending)
      const qCheck = query(collection(db, 'forums'), where('niveau', '==', newForumLevel.trim()), where('serie', '==', newForumSerie.trim()));
      const snap = await getDocs(qCheck);
      if (!snap.empty) {
        alert(t('community.alerts.already_exists', "Une classe pour ce niveau/série existe déjà ! Demandez plutôt à la rejoindre."));
        setShowCreateModal(false);
        return;
      }

      // Create forum with pending status — admin must approve
      const docRef = await addDoc(collection(db, 'forums'), {
        nom: generatedName,
        niveau: newForumLevel.trim(),
        serie: newForumSerie.trim(),
        createurId: userProfile.uid,
        statut: 'en_attente',
        createdAt: serverTimestamp()
      });

      // Creator membership also pending — admin approves everything at once
      await addDoc(collection(db, 'forum_memberships'), {
        forumId: docRef.id,
        userId: userProfile.uid,
        userName: `${userProfile.prenom || ''} ${userProfile.nom || ''}`.trim(),
        userEmail: userProfile.email || '',
        userNiveau: userProfile.niveau || '',
        userSerie: userProfile.serie || '',
        userExamen: userProfile.examen || '',
        statut: 'en_attente',
        createdAt: serverTimestamp()
      });

      setShowCreateModal(false);
      setNewForumLevel('');
      setNewForumSerie('');
      alert(t('community.alerts.create_pending', "Votre demande de création de classe a été soumise. Un administrateur la validera bientôt."));
    } catch (err) {
      console.error(err);
      alert(t('community.alerts.create_error', "Erreur lors de la création."));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeForum || !userProfile?.uid) return;

    try {
      await addDoc(collection(db, 'forums', activeForum.id, 'messages'), {
        text: newMessage.trim(),
        authorId: userProfile.uid,
        authorName: userProfile.prenom || 'Élève',
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
      alert(t('community.alerts.send_error', "Erreur d'envoi."));
    }
  };

  // Search filter matching: Niveau série/filière format
  const filteredForums = forums.filter(f => {
    // Only show active forums (or legacy ones without status), or pending forums created by the current user
    const isVisible = f.statut === 'actif' || !f.statut || f.createurId === userProfile?.uid;
    if (!isVisible) return false;

    if (!searchTerm.trim()) return true;
    const queryStr = searchTerm.toLowerCase();
    const matchNom = f.nom?.toLowerCase().includes(queryStr);
    const matchNiveau = f.niveau?.toLowerCase().includes(queryStr);
    const matchSerie = f.serie?.toLowerCase().includes(queryStr);
    return matchNom || matchNiveau || matchSerie;
  });

  // ─── 1. WELCOME SCREEN (Invitation to join community) ───
  if (!joinedCommunity) {
    return (
      <div className="stack stack--lg animate-in" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ background: 'var(--srf-base)', boxShadow: 'var(--shd-md)', padding: 'var(--sp-8)' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: 'var(--sp-4)' }}>🏫</div>
          <h1 className="laura-h1" style={{ marginBottom: 'var(--sp-4)' }}>
            {t('community.welcome.title', 'Rejoindre la communauté')}
          </h1>
          <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)', lineHeight: 'var(--lh-relaxed)', marginBottom: 'var(--sp-6)' }}>
            {t('community.welcome.desc', 'Échangez avec d\'autres apprenants, partagez des ressources et progressez ensemble en rejoignant notre communauté active.')}
          </p>
          <button 
            onClick={handleJoinCommunity} 
            className="laura-btn laura-btn-primary" 
            style={{ width: '100%', justifyContent: 'center', minHeight: '48px', fontSize: 'var(--tx-base)', borderRadius: 'var(--rd-md)' }}
          >
            {t('community.welcome.join_btn', 'Rejoindre la communauté')}
          </button>
        </div>
      </div>
    );
  }

  // ─── 2. ACTIVE DASHBOARD VIEW (Once community is joined) ───
  return (
    <div className="stack stack--lg animate-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Dynamic welcome message alert */}
      {showJoinSuccess && (
        <div className="auth-info-alert row row--between" style={{ marginBottom: '0', background: 'var(--clr-brand-lt)', border: '1px solid var(--clr-brand)', color: 'var(--clr-brand)', borderRadius: 'var(--rd-md)' }}>
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <span>🎉</span>
            <strong style={{ fontWeight: 'var(--fw-bold)' }}>
              {t('community.join_success', 'Félicitations, tu viens de rejoindre la communauté. Intègre ta classe.')}
            </strong>
          </div>
          <button 
            onClick={() => setShowJoinSuccess(false)} 
            className="laura-btn laura-btn-ghost" 
            style={{ padding: '0 var(--sp-2)', minHeight: 'auto', color: 'inherit', fontWeight: 'var(--fw-bold)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="page-header" style={{ marginBottom: '0' }}>
        <h1 className="laura-h1">{t('learn.community.title', 'Communauté')}</h1>
        <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>
          {t('learn.community.subtitle', 'Échangez, posez vos questions et entraidez-vous avec vos camarades.')}
        </p>
      </div>

      {/* Core Split Screen Layout — responsive */}
      <style>{`
        .community-container { display: grid; grid-template-columns: 1fr; gap: var(--sp-5); flex: 1; min-height: 0; overflow: hidden; }
        @media (min-width: 1024px) { .community-container { grid-template-columns: 1fr 340px; } }
        .community-container .messaging-pane { display: none; }
        .community-container .sidebar-pane { display: flex; }
        .community-container.show-chat .messaging-pane { display: flex; }
        .community-container.show-chat .sidebar-pane { display: none; }
        @media (min-width: 1024px) {
          .community-container .messaging-pane { display: flex !important; }
          .community-container .sidebar-pane { display: flex !important; }
        }
      `}</style>
      <div
        className={`community-container${mobilePane === 'chat' ? ' show-chat' : ''}`}
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        
        <div 
          className="card messaging-pane" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflow: 'hidden', 
            padding: 0,
            background: 'var(--srf-base)'
          }}
        >
          {activeForum && activeForum.statut !== 'en_attente' && (userProfile?.role === 'admin' || memberships[activeForum.id] === 'approuve') ? (
            <>
              {/* Chat room header — with mobile back button */}
              <div
                style={{
                  padding: 'var(--sp-4) var(--sp-5)',
                  borderBottom: '1px solid var(--brd-subtle)',
                  background: 'var(--srf-raised)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <button
                    className="mobile-only laura-btn laura-btn-ghost"
                    onClick={() => setMobilePane('list')}
                    style={{ minHeight: '32px', padding: '0 var(--sp-2)', fontSize: 'var(--tx-base)', color: 'var(--txt-secondary)' }}
                    aria-label="Retour"
                  >
                    <i className="ti ti-arrow-left" />
                  </button>
                  <div>
                    <h2 style={{ fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', margin: 0, color: 'var(--txt-primary)' }}>
                      {activeForum.nom}
                    </h2>
                    <p style={{ margin: 0, fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)' }}>
                      {t('admin.community.modal.level', 'Niveau')} : {activeForum.niveau} {activeForum.serie && `· ${activeForum.serie}`}
                    </p>
                  </div>
                </div>
                <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: 'var(--rd-full)', background: 'var(--clr-success)' }} />
                  {participantCounts[activeForum.id] || 0} {t('admin.community.table.student', 'Élève')}{(participantCounts[activeForum.id] || 0) > 1 ? 's' : ''}
                </div>
              </div>

              {/* Chat room messages list */}
              <div 
                className="chat-messages no-scrollbar" 
                style={{ 
                  flex: 1, 
                  padding: 'var(--sp-5)', 
                  overflowY: 'auto',
                  background: 'var(--srf-base)'
                }}
              >
                {messages.length === 0 ? (
                  <div className="empty-state" style={{ margin: 'auto' }}>
                    <span className="empty-state__icon">💬</span>
                    <p className="empty-state__title">{t('community.chat.empty_title', 'Bienvenue dans la classe !')}</p>
                    <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-tertiary)' }}>
                      {t('community.chat.empty_desc', 'Soyez le premier à envoyer un message.')}
                    </p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMe = m.authorId === userProfile.uid;
                    return (
                      <div key={m.id} className={`chat-msg ${isMe ? 'chat-msg--user' : 'chat-msg--ai'}`} style={{ marginBottom: 'var(--sp-4)' }}>
                        <div 
                          className="chat-msg__avatar" 
                          style={{ 
                            background: isMe ? 'var(--clr-brand)' : 'var(--srf-elevated)', 
                            color: isMe ? 'white' : 'var(--txt-primary)' 
                          }}
                        >
                          {m.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          {!isMe && (
                            <div style={{ fontSize: '10px', color: 'var(--txt-tertiary)', marginBottom: '4px' }}>
                              {m.authorName}
                            </div>
                          )}
                          <div 
                            className="chat-msg__bubble" 
                            style={{ 
                              background: isMe ? 'var(--clr-brand)' : 'var(--srf-raised)', 
                              color: isMe ? 'white' : 'var(--txt-primary)' 
                            }}
                          >
                            {m.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message sending form */}
              <form 
                onSubmit={handleSendMessage} 
                style={{ 
                  padding: 'var(--sp-4)', 
                  borderTop: '1px solid var(--brd-subtle)', 
                  background: 'var(--srf-raised)', 
                  display: 'flex', 
                  gap: 'var(--sp-3)' 
                }}
              >
                <input
                  type="text"
                  placeholder={t('community.chat.input_placeholder', 'Écrivez un message...')}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, borderRadius: 'var(--rd-full)' }}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()} 
                  className="laura-btn laura-btn-primary" 
                  style={{ borderRadius: 'var(--rd-full)', width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}
                >
                  →
                </button>
              </form>
            </>
          ) : activeForum ? (
            // A class forum is clicked but the membership is NOT approved OR the forum itself is pending creation
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--sp-8)', textAlign: 'center' }}>
              {activeForum.statut === 'en_attente' ? (
                <>
                  <i className="ti ti-hourglass" style={{ fontSize: '3.5rem', marginBottom: 'var(--sp-4)', color: 'var(--clr-warning)' }} />
                  <h2 style={{ fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)', color: 'var(--txt-primary)' }}>
                    {activeForum.nom}
                  </h2>
                  <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', maxWidth: '400px', marginBottom: 'var(--sp-5)' }}>
                    {t('community.status.forum_pending_desc', "Cette classe est en cours de création. Elle sera accessible dès qu'un administrateur l'aura validée.")}
                  </p>
                  <button disabled className="laura-btn laura-btn-ghost">
                    {t('community.sidebar.status_pending', '⏳ En attente de validation')}
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '3.5rem', marginBottom: 'var(--sp-4)' }}>🔒</span>
                  <h2 style={{ fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
                    {activeForum.nom}
                  </h2>
                  {memberships[activeForum.id] === 'en_attente' ? (
                    <>
                      <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', maxWidth: '400px', marginBottom: 'var(--sp-5)' }}>
                        {t('community.status.pending_desc', 'Votre demande d\'accès à ce forum est en cours de validation par un administrateur.')}
                      </p>
                      <button disabled className="laura-btn laura-btn-ghost">
                        {t('community.sidebar.status_pending', '⏳ Attente')}
                      </button>
                    </>
                  ) : memberships[activeForum.id] === 'rejete' ? (
                    <>
                      <p style={{ color: 'var(--clr-error)', fontSize: 'var(--tx-sm)', maxWidth: '400px', marginBottom: 'var(--sp-5)' }}>
                        {t('community.status.rejected_desc', 'Votre accès à ce forum de classe a été refusé par l\'équipe de modération.')}
                      </p>
                      <button disabled className="laura-btn laura-btn-ghost" style={{ color: 'var(--clr-error)' }}>
                        {t('community.sidebar.status_rejected', '✕ Refusé')}
                      </button>
                    </>
                  ) : (
                    <>
                      <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', maxWidth: '400px', marginBottom: 'var(--sp-5)' }}>
                        {t('community.status.unjoined_desc', 'Vous devez faire une demande pour rejoindre cette classe.')}
                      </p>
                      <button onClick={() => handleRequestJoin(activeForum.id)} className="laura-btn laura-btn-primary">
                        {t('community.sidebar.status_join', 'Demander à rejoindre')}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            // Empty placeholder state before selecting a forum
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--sp-8)', textAlign: 'center' }}>
              <i className="ti ti-building-community" style={{ fontSize: '4rem', marginBottom: 'var(--sp-4)', color: 'var(--clr-brand)' }} />
              <h2 style={{ fontSize: 'var(--tx-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)', color: 'var(--txt-primary)' }}>
                {t('community.placeholder.title', 'Rejoignez votre classe')}
              </h2>
              <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', maxWidth: '420px', lineHeight: 'var(--lh-relaxed)' }}>
                {t('community.placeholder.desc', 'Sélectionnez ou recherchez un forum de classe dans la liste pour commencer à échanger avec les autres apprenants.')}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: Elegant Search & Forum List */}
        <div 
          className="card sidebar-pane" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflow: 'hidden', 
            padding: 0,
            background: 'var(--srf-base)'
          }}
        >
          {/* Elegant Search Container */}
          <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)', background: 'var(--srf-raised)' }}>
            <input
              type="text"
              placeholder={t('community.sidebar.search_placeholder', 'Rechercher un forum...')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: '100%', background: 'var(--srf-base)' }}
            />
            <div style={{ fontSize: '10px', color: 'var(--txt-tertiary)', marginTop: '6px' }}>
              {t('community.sidebar.search_format', 'Format : Niveau série/filière (ex: Terminale A)')}
            </div>
          </div>

          {/* Action trigger to create a new class forum */}
          <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)' }}>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="laura-btn laura-btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', fontSize: 'var(--tx-xs)' }}
            >
              {t('community.sidebar.create_btn', '+ Créer une classe')}
            </button>
          </div>

          {/* Dynamic Forums List */}
          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredForums.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--txt-tertiary)', fontSize: 'var(--tx-xs)' }}>
                {t('community.sidebar.empty', 'Aucun forum de classe trouvé.')}
              </div>
            ) : (
              filteredForums.map(f => {
                const status = memberships[f.id];
                const isActive = activeForum?.id === f.id;
                const pCount = participantCounts[f.id] || 0;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
              setActiveForum(f);
              setMobilePane('chat');
            }}
                    style={{
                      padding: 'var(--sp-3) var(--sp-4)',
                      cursor: 'pointer',
                      background: isActive ? 'var(--clr-brand-lt)' : '',
                      borderLeft: isActive ? '3px solid var(--clr-brand)' : '3px solid transparent',
                      transition: 'all 0.2s',
                      borderBottom: '1px solid var(--brd-subtle)'
                    }}
                    className="forum-list-item"
                  >
                    <div className="row row--between" style={{ alignItems: 'center' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 
                          style={{ 
                            margin: 0, 
                            fontSize: 'var(--tx-sm)', 
                            fontWeight: 'var(--fw-semibold)', 
                            color: isActive ? 'var(--clr-brand)' : 'var(--txt-primary)' 
                          }} 
                          className="truncate"
                        >
                          {f.nom}
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--txt-tertiary)' }}>
                          {pCount} {pCount > 1 
                            ? t('community.sidebar.participants_plural', 'participants') 
                            : t('community.sidebar.participants', 'participant')}
                        </p>
                      </div>
                      
                      {f.statut === 'en_attente' ? (
                        <span style={{ fontSize: '10px', color: 'var(--clr-warning)', fontWeight: 'var(--fw-bold)' }}>
                          ⏳ Création
                        </span>
                      ) : userProfile?.role === 'admin' ? (
                        <span style={{ fontSize: '10px', color: 'var(--clr-success)', fontWeight: 'var(--fw-bold)' }}>
                          {t('community.sidebar.status_open', '✓ Ouvert')}
                        </span>
                      ) : status === 'approuve' ? (
                        <span style={{ fontSize: '10px', color: 'var(--clr-success)', fontWeight: 'var(--fw-bold)' }}>
                          {t('community.sidebar.status_open', '✓ Ouvert')}
                        </span>
                      ) : status === 'en_attente' ? (
                        <span style={{ fontSize: '10px', color: 'var(--clr-warning)' }}>
                          {t('community.sidebar.status_pending', '⏳ Attente')}
                        </span>
                      ) : status === 'rejete' ? (
                        <span style={{ fontSize: '10px', color: 'var(--clr-error)' }}>
                          {t('community.sidebar.status_rejected', '✕ Refusé')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--txt-tertiary)' }}>
                          {t('community.sidebar.status_join', 'Rejoindre')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* CREATE FORUM MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{t('community.modal.create_class_title', 'Créer une classe')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleCreateForum} style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label>{t('community.modal.level', 'Niveau')}</label>
                <input required type="text" value={newForumLevel} onChange={e => setNewForumLevel(e.target.value)} className="form-input" placeholder="ex: Terminale" />
              </div>
              <div className="form-group">
                <label>{t('community.modal.serie', 'Série')}</label>
                <input type="text" value={newForumSerie} onChange={e => setNewForumSerie(e.target.value)} className="form-input" placeholder="optionnel, ex: A, D, MCV" />
              </div>
              <button type="submit" className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--sp-2)' }}>
                {t('community.modal.save', 'Enregistrer')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
