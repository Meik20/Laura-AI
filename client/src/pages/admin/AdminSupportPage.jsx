import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function AdminSupportPage() {
  const { t } = useTranslation();
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'resolved' | 'all'
  const messagesEndRef = useRef(null);

  // Load all support chats in real time
  useEffect(() => {
    const q = query(collection(db, 'support_chats'), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));
      setChats(chatList);
    }, (err) => {
      console.error("Error loading support chats:", err);
    });
    return () => unsubscribe();
  }, []);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  // Mark chat as read by admin when selected
  useEffect(() => {
    if (selectedChatId && selectedChat?.unreadByAdmin) {
      const docRef = doc(db, 'support_chats', selectedChatId);
      updateDoc(docRef, { unreadByAdmin: false }).catch(console.error);
    }
  }, [selectedChatId, selectedChat?.unreadByAdmin]);

  // Scroll active chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;

    const messageObj = {
      senderId: 'admin',
      senderName: 'Administration',
      role: 'admin',
      text: inputText.trim(),
      createdAt: new Date().toISOString()
    };

    setInputText('');

    try {
      const docRef = doc(db, 'support_chats', selectedChatId);
      await updateDoc(docRef, {
        messages: arrayUnion(messageObj),
        lastMessageAt: new Date().toISOString(),
        unreadByUser: true,
        unreadByAdmin: false
      });
    } catch (err) {
      console.error("Error sending admin reply:", err);
    }
  };

  const handleToggleStatus = async (chatId, currentStatus) => {
    const nextStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
    try {
      const docRef = doc(db, 'support_chats', chatId);
      await updateDoc(docRef, { status: nextStatus });
    } catch (err) {
      console.error("Error toggling ticket status:", err);
    }
  };

  // Filter chats
  const filteredChats = chats.filter(c => {
    // Status Filter
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;

    // Search Term Filter
    if (searchTerm.trim() !== '') {
      const s = searchTerm.toLowerCase();
      const nameMatch = c.userName?.toLowerCase().includes(s);
      const emailMatch = c.userEmail?.toLowerCase().includes(s);
      const subjectMatch = c.subject?.toLowerCase().includes(s);
      return nameMatch || emailMatch || subjectMatch;
    }

    return true;
  });

  return (
    <div className="stack stack--lg animate-in" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div className="page-header__title">
          <h1 className="laura-h1">Support Technique & Client</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            Gérez et répondez aux messages de support envoyés par les élèves et les tuteurs.
          </p>
        </div>
      </div>

      {/* Main Panel Layout */}
      <div 
        className="card" 
        style={{ 
          flex: 1, 
          display: 'grid', 
          gridTemplateColumns: '320px 1fr', 
          overflow: 'hidden', 
          background: 'var(--srf-base)', 
          padding: 0,
          border: '1px solid var(--brd-subtle)'
        }}
      >
        
        {/* Left Column: Tickets List */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--brd-subtle)', background: 'var(--srf-sidebar)' }}>
          {/* Search */}
          <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Rechercher un ticket..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--sp-2) var(--sp-3) var(--sp-2) 32px',
                  borderRadius: 'var(--rd-md)',
                  border: '1px solid var(--brd-input)',
                  fontSize: 'var(--tx-xs)',
                  background: 'var(--srf-base)',
                  color: 'var(--txt-primary)'
                }}
              />
              <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-tertiary)', fontSize: '14px' }} />
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--brd-subtle)', background: 'var(--srf-raised)' }}>
            {[
              { key: 'pending', label: 'En attente' },
              { key: 'resolved', label: 'Résolus' },
              { key: 'all', label: 'Tous' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  flex: 1,
                  padding: 'var(--sp-3) var(--sp-2)',
                  background: 'none',
                  border: 'none',
                  borderBottom: statusFilter === tab.key ? '2px solid var(--clr-brand)' : '2px solid transparent',
                  color: statusFilter === tab.key ? 'var(--clr-brand)' : 'var(--txt-secondary)',
                  fontSize: 'var(--tx-xs)',
                  fontWeight: statusFilter === tab.key ? 'var(--fw-bold)' : 'var(--fw-semibold)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List Scroll Area */}
          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredChats.length === 0 ? (
              <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--txt-tertiary)' }}>
                <i className="ti ti-inbox" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }} />
                <span style={{ fontSize: 'var(--tx-xs)' }}>Aucune demande trouvée</span>
              </div>
            ) : (
              filteredChats.map(chat => {
                const isSelected = chat.id === selectedChatId;
                const lastMsg = chat.messages?.[chat.messages.length - 1]?.text || 'Pas de message';
                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    style={{
                      padding: 'var(--sp-4)',
                      borderBottom: '1px solid var(--brd-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--srf-raised)' : 'transparent',
                      transition: 'background var(--dur-fast)',
                      position: 'relative'
                    }}
                  >
                    {chat.unreadByAdmin && (
                      <span 
                        style={{ 
                          position: 'absolute', 
                          left: '6px', 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: 'var(--clr-brand, #7c3aed)' 
                        }} 
                      />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-primary)', display: 'block', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chat.userName}
                      </strong>
                      <span className={`badge ${chat.userRole?.toLowerCase().includes('tuteur') ? 'badge--green' : 'badge--brand'}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {chat.userRole}
                      </span>
                    </div>

                    <div style={{ fontSize: 'var(--tx-xs)', fontWeight: 'bold', color: 'var(--txt-secondary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.subject}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--txt-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastMsg}
                    </div>

                    <div style={{ fontSize: '9px', color: 'var(--txt-tertiary)', textAlign: 'right', marginTop: '6px' }}>
                      {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Messages Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--srf-page)' }}>
          {selectedChat ? (
            <>
              {/* Active Chat Header */}
              <div 
                style={{ 
                  padding: 'var(--sp-4)', 
                  borderBottom: '1px solid var(--brd-subtle)', 
                  background: 'var(--srf-base)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <div>
                  <h3 className="laura-h3" style={{ margin: 0, fontSize: 'var(--tx-base)' }}>{selectedChat.subject}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)' }}>
                    Par <strong>{selectedChat.userName}</strong> ({selectedChat.userEmail}) · <span className={`badge ${selectedChat.status === 'resolved' ? 'badge--green' : 'badge--warning'}`} style={{ padding: '0 6px', fontSize: '10px' }}>{selectedChat.status === 'resolved' ? 'Résolu' : 'En attente'}</span>
                  </p>
                </div>
                <div>
                  <button 
                    onClick={() => handleToggleStatus(selectedChat.id, selectedChat.status)}
                    className={`btn ${selectedChat.status === 'resolved' ? 'btn--secondary' : 'btn--primary'}`}
                    style={{ fontSize: 'var(--tx-xs)', padding: 'var(--sp-2) var(--sp-3)' }}
                  >
                    {selectedChat.status === 'resolved' ? 'Re-ouvrir le ticket' : '✓ Marquer comme résolu'}
                  </button>
                </div>
              </div>

              {/* Messages scroll pane */}
              <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-5)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {selectedChat.messages?.map((msg, index) => {
                    const isAdmin = msg.role === 'admin';
                    return (
                      <div 
                        key={index}
                        style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: '16px',
                          fontSize: 'var(--tx-sm)',
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          background: isAdmin ? 'var(--clr-brand, #7c3aed)' : 'var(--srf-base, #1e1e24)',
                          color: isAdmin ? 'white' : 'var(--txt-primary)',
                          border: isAdmin ? 'none' : '1px solid var(--brd-subtle)',
                          borderBottomRightRadius: isAdmin ? '4px' : '16px',
                          borderBottomLeftRadius: !isAdmin ? '4px' : '16px'
                        }}
                      >
                        <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'bold', marginBottom: '2px' }}>
                          {isAdmin ? 'Administration' : selectedChat.userName}
                        </div>
                        <div>{msg.text}</div>
                        <div style={{ fontSize: '9px', opacity: 0.6, textAlign: 'right', marginTop: '6px' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat Input Bar */}
              <div style={{ padding: 'var(--sp-4)', background: 'var(--srf-base)', borderTop: '1px solid var(--brd-subtle)' }}>
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Saisissez votre réponse..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '24px',
                      border: '1px solid var(--brd-input)',
                      background: 'var(--srf-page)',
                      color: 'var(--txt-primary)',
                      fontSize: 'var(--tx-sm)',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="btn btn--primary"
                    style={{
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0
                    }}
                  >
                    <i className="ti ti-send" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-tertiary)', padding: 'var(--sp-8)' }}>
              <i className="ti ti-headset" style={{ fontSize: '48px', color: 'var(--txt-tertiary)', marginBottom: 'var(--sp-4)' }} />
              <h3 className="laura-h3" style={{ margin: 0, color: 'var(--txt-secondary)' }}>Aucune discussion sélectionnée</h3>
              <p style={{ margin: 'var(--sp-1) 0 0', fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>
                Sélectionnez une discussion de support dans la liste de gauche pour y répondre.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
