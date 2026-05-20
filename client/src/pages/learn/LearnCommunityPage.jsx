import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function LearnCommunityPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  
  const [forums, setForums] = useState([]);
  const [memberships, setMemberships] = useState({}); // forumId -> statut
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeForum, setActiveForum] = useState(null); // The currently opened forum
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForumName, setNewForumName] = useState('');
  const [newForumLevel, setNewForumLevel] = useState('');
  const [newForumSerie, setNewForumSerie] = useState('');

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
    if (memberships[activeForum.id] !== 'approuve') return;

    const qMsg = query(collection(db, 'forums', activeForum.id, 'messages'), orderBy('createdAt', 'asc'));
    const unsubMsg = onSnapshot(qMsg, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubMsg();
  }, [activeForum, memberships]);

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
      alert("Erreur lors de la demande d'accès.");
    }
  };

  const handleCreateForum = async (e) => {
    e.preventDefault();
    if (!userProfile?.uid || !newForumName.trim() || !newForumLevel.trim()) return;

    // Check if forum with same level + serie already exists
    try {
      const qCheck = query(collection(db, 'forums'), where('niveau', '==', newForumLevel), where('serie', '==', newForumSerie));
      const snap = await getDocs(qCheck);
      if (!snap.empty) {
        alert(`Une classe pour ce niveau/série existe déjà ! Demandez plutôt à la rejoindre.`);
        setShowCreateModal(false);
        return;
      }

      // Create
      const docRef = await addDoc(collection(db, 'forums'), {
        nom: newForumName.trim(),
        niveau: newForumLevel.trim(),
        serie: newForumSerie.trim(),
        createurId: userProfile.uid,
        createdAt: serverTimestamp()
      });

      // Auto-join as approved
      await addDoc(collection(db, 'forum_memberships'), {
        forumId: docRef.id,
        userId: userProfile.uid,
        userName: `${userProfile.prenom || ''} ${userProfile.nom || ''}`.trim(),
        userEmail: userProfile.email || '',
        userNiveau: userProfile.niveau || '',
        userSerie: userProfile.serie || '',
        userExamen: userProfile.examen || '',
        statut: 'approuve',
        createdAt: serverTimestamp()
      });

      setShowCreateModal(false);
      setNewForumName('');
      setNewForumLevel('');
      setNewForumSerie('');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création.");
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
      alert("Erreur d'envoi.");
    }
  };

  if (activeForum && memberships[activeForum.id] === 'approuve') {
    // CHAT VIEW
    return (
      <div className="stack stack--lg" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="page-header row row--between">
          <div>
            <h1 className="laura-h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <button onClick={() => setActiveForum(null)} className="laura-btn laura-btn-ghost" style={{ padding: '0 var(--sp-2)' }}>←</button>
              {activeForum.nom}
            </h1>
            <p style={{ marginTop: 'var(--sp-1)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>
              Niveau : {activeForum.niveau} {activeForum.serie}
            </p>
          </div>
        </div>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div className="chat-messages no-scrollbar" style={{ padding: 'var(--sp-5)' }}>
            {messages.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto' }}>
                <span className="empty-state__icon">💬</span>
                <p className="empty-state__title">Bienvenue dans la classe !</p>
                <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-tertiary)' }}>Soyez le premier à envoyer un message.</p>
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.authorId === userProfile.uid;
                return (
                  <div key={m.id} className={`chat-msg ${isMe ? 'chat-msg--user' : 'chat-msg--ai'}`} style={{ marginBottom: 'var(--sp-4)' }}>
                    <div className="chat-msg__avatar" style={{ background: isMe ? 'var(--clr-brand)' : 'var(--srf-elevated)', color: isMe ? 'white' : 'var(--txt-primary)' }}>
                      {m.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {!isMe && <div style={{ fontSize: '10px', color: 'var(--txt-tertiary)', marginBottom: '4px' }}>{m.authorName}</div>}
                      <div className="chat-msg__bubble" style={{ background: isMe ? 'var(--clr-brand)' : 'var(--srf-raised)', color: isMe ? 'white' : 'var(--txt-primary)' }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} style={{ padding: 'var(--sp-4)', borderTop: '1px solid var(--brd-subtle)', background: 'var(--srf-raised)', display: 'flex', gap: 'var(--sp-3)' }}>
            <input
              type="text"
              placeholder="Écrivez un message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="form-input"
              style={{ flex: 1, borderRadius: 'var(--rd-full)' }}
            />
            <button type="submit" disabled={!newMessage.trim()} className="laura-btn laura-btn-primary" style={{ borderRadius: 'var(--rd-full)', width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}>
              →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // FORUM LIST VIEW
  return (
    <div className="stack stack--lg">
      <div className="page-header row row--between">
        <div>
          <h1 className="laura-h1">Communauté</h1>
          <p style={{ marginTop: 'var(--sp-1)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>
            Rejoignez le forum de votre classe pour discuter avec les autres apprenants.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="laura-btn laura-btn-primary">
          + Créer ma classe
        </button>
      </div>

      <div className="auth-info-alert">
        <span style={{ fontSize: '1.2rem' }}>🔒</span>
        <p style={{ margin: 0, fontSize: 'var(--tx-sm)', lineHeight: '1.5' }}>
          <strong>Confidentialité :</strong> L'accès aux classes est soumis à la validation d'un administrateur. Vos données personnelles restent privées, seul votre prénom sera affiché dans le chat.
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--txt-tertiary)' }}>Chargement des classes...</div>
      ) : forums.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">🏫</span>
          <p className="empty-state__title">Aucune classe n'a été créée</p>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-tertiary)' }}>Soyez le premier à créer le forum de votre niveau !</p>
        </div>
      ) : (
        <div className="card-grid">
          {forums.map(f => {
            const status = memberships[f.id];
            return (
              <div key={f.id} className="card" style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--sp-2)', fontSize: 'var(--tx-base)' }}>{f.nom}</h3>
                  <div className="row" style={{ gap: 'var(--sp-2)' }}>
                    <span className="badge">{f.niveau}</span>
                    {f.serie && <span className="badge">{f.serie}</span>}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                
                {status === 'approuve' ? (
                  <button onClick={() => setActiveForum(f)} className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Ouvrir la discussion
                  </button>
                ) : status === 'en_attente' ? (
                  <button disabled className="laura-btn laura-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                    ⏳ En attente de validation
                  </button>
                ) : status === 'rejete' ? (
                  <button disabled className="laura-btn laura-btn-ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--clr-error)' }}>
                    ❌ Accès refusé
                  </button>
                ) : (
                  <button onClick={() => handleRequestJoin(f.id)} className="laura-btn laura-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                    Demander à rejoindre
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE FORUM MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Créer un forum de classe</h2>
              <button onClick={() => setShowCreateModal(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleCreateForum} style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label>Nom du forum (ex: Terminale D - Lycée X)</label>
                <input required type="text" value={newForumName} onChange={e => setNewForumName(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label>Niveau (ex: Terminale)</label>
                <input required type="text" value={newForumLevel} onChange={e => setNewForumLevel(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label>Série / Filière (optionnel, ex: D, MCV)</label>
                <input type="text" value={newForumSerie} onChange={e => setNewForumSerie(e.target.value)} className="form-input" />
              </div>
              <button type="submit" className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--sp-2)' }}>
                Créer et rejoindre
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
