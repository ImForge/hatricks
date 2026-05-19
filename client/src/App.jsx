import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const SERVER_URL = 'https://ca4f-2405-201-303b-8025-451-126-ba14-112d.ngrok-free.app'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem('hatricks_conversation_id') || null
  })

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (conversationId) loadConversation(conversationId)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async (id) => {
    try {
      const response = await axios.get(`${SERVER_URL}/conversation/${id}`)
      if (response.data.messages.length > 0) {
        setMessages(response.data.messages)
      }
    } catch (error) {
      console.error('Could not load conversation:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await axios.post(`${SERVER_URL}/chat`, {
        messages: updatedMessages,
        conversationId,
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.reply
      }])

      if (!conversationId) {
        const newId = response.data.conversationId
        setConversationId(newId)
        localStorage.setItem('hatricks_conversation_id', newId)
      }

    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "something broke on my end. try again."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto resize textarea as user types
  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const newConversation = () => {
    setMessages([])
    setConversationId(null)
    localStorage.removeItem('hatricks_conversation_id')
  }

  return (
    <>
      {/* Inject global styles and animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: #080604;
          height: 100vh;
          overflow: hidden;
        }

        #root {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Ember glow at top of screen */
        body::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 300px;
          background: radial-gradient(ellipse at 50% -20%, rgba(200,100,20,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a1a0a; border-radius: 2px; }

        /* Typing animation */
        @keyframes flicker {
          0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.3); }
        }

        /* Avatar pulse — Hatricks is alive */
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,120,48,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(200,120,48,0); }
        }

        /* Message fade in */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-animate {
          animation: fadeUp 0.3s ease forwards;
        }

        textarea::placeholder { color: #3a2510; }
        textarea:focus { outline: none; border-color: #5a3510 !important; }
      `}</style>

      {/* ── MAIN CONTAINER ── */}
      <div style={s.container}>

        {/* ── HEADER ── */}
        <div style={s.header}>
          <div style={s.headerLeft}>

            {/* Hagrid avatar with online dot */}
            <div style={s.avatarWrap}>
              <img
                src="/hatricks.png"
                alt="Hatricks"
                style={s.avatarImg}
              />
              <div style={s.onlineDot} />
            </div>

            <div style={s.nameBlock}>
              <span style={s.nameMain}>HATRICKS</span>
              <span style={s.nameSub}>always here • your friend</span>
            </div>
          </div>

          <button onClick={newConversation} style={s.newBtn}>
            new chat
          </button>
        </div>

        {/* ── CHAT AREA ── */}
        <div style={s.chatArea}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={s.emptyState}>
              <img src="/hatricks.png" alt="Hatricks" style={s.emptyAvatar} />
              <p style={s.emptyTitle}>HATRICKS IS HERE</p>
              <p style={s.emptySub}>say something real</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className="msg-animate"
              style={{
                ...s.msgRow,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Hatricks avatar on his messages */}
              {msg.role === 'assistant' && (
                <img src="/hatricks.png" alt="H" style={s.msgAvatar} />
              )}

              {/* Message bubble */}
              <div style={{
                ...s.bubble,
                ...(msg.role === 'user' ? s.bubbleUser : s.bubbleHatricks),
              }}>
                {msg.content}
              </div>

              {/* User avatar on user messages */}
              {msg.role === 'user' && (
                <img src="/me.png" alt="You" style={s.msgAvatarUser} />
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={s.msgRow} className="msg-animate">
              <img src="/hatricks.png" alt="H" style={s.msgAvatar} />
              <div style={{ ...s.bubble, ...s.bubbleHatricks }}>
                <div style={s.typingDots}>
                  <span style={{ ...s.dot, animationDelay: '0s' }} />
                  <span style={{ ...s.dot, animationDelay: '0.2s' }} />
                  <span style={{ ...s.dot, animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── INPUT AREA ── */}
        <div style={s.inputArea}>
          {/* User's own avatar next to input */}
          <img src="/me.png" alt="You" style={s.inputAvatar} />

          <textarea
            ref={textareaRef}
            style={s.input}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="say something to hatricks..."
            rows={1}
            disabled={isLoading}
          />

          <button
            style={{
              ...s.sendBtn,
              opacity: isLoading || !input.trim() ? 0.3 : 1,
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            ↑
          </button>
        </div>

      </div>
    </>
  )
}

// ── STYLES ──
const s = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '760px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },

  // Header
  header: {
    padding: '12px 20px',
    borderBottom: '1px solid #1e1408',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(10,8,4,0.95)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  // Hagrid avatar in header
  avatarWrap: {
    position: 'relative',
    width: '42px',
    height: '42px',
  },
  avatarImg: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    objectFit: 'cover',
    objectPosition: 'top',
    border: '2px solid #7a4a1a',
    animation: 'pulse 3s infinite',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '1px',
    right: '1px',
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    background: '#4ade80',
    border: '2px solid #0a0804',
    boxShadow: '0 0 6px #4ade8088',
  },

  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  nameMain: {
    fontFamily: "'Cinzel', serif",
    fontSize: '15px',
    color: '#d4874a',
    letterSpacing: '3px',
    fontWeight: '600',
  },
  nameSub: {
    fontSize: '10px',
    color: '#4a3010',
    letterSpacing: '0.5px',
  },

  newBtn: {
    fontSize: '11px',
    color: '#4a3010',
    border: '1px solid #2a1a08',
    borderRadius: '6px',
    padding: '5px 12px',
    background: 'transparent',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif",
  },

  // Chat area
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // Empty state
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    marginTop: '80px',
    opacity: 0.5,
  },
  emptyAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    objectPosition: 'top',
    border: '2px solid #5a3510',
    filter: 'grayscale(20%)',
  },
  emptyTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: '14px',
    color: '#c87a30',
    letterSpacing: '4px',
  },
  emptySub: {
    fontSize: '12px',
    color: '#4a3010',
    letterSpacing: '1px',
  },

  // Message rows
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
  },

  // Hatricks message avatar
  msgAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    objectPosition: 'top',
    border: '1.5px solid #5a3510',
    flexShrink: 0,
  },

  // User message avatar
  msgAvatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1.5px solid #3a2a40',
    flexShrink: 0,
  },

  // Bubbles
  bubble: {
    maxWidth: '72%',
    padding: '11px 16px',
    fontSize: '14px',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleHatricks: {
    background: '#0e0b07',
    border: '1px solid #2a1a08',
    borderRadius: '16px',
    borderBottomLeftRadius: '4px',
    color: '#c8b090',
  },
  bubbleUser: {
    background: '#150f08',
    border: '1px solid #4a2e10',
    borderRadius: '16px',
    borderBottomRightRadius: '4px',
    color: '#e8d0a8',
  },

  // Typing dots
  typingDots: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    padding: '3px 0',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#7a4a1a',
    display: 'inline-block',
    animation: 'flicker 1.4s infinite',
  },

  // Input area
  inputArea: {
    padding: '12px 20px',
    borderTop: '1px solid #1a1008',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    background: 'rgba(10,8,4,0.95)',
    backdropFilter: 'blur(10px)',
  },
  inputAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1.5px solid #3a2a40',
    flexShrink: 0,
    marginBottom: '4px',
  },
  input: {
    flex: 1,
    background: '#0e0b07',
    border: '1px solid #2a1a08',
    borderRadius: '12px',
    padding: '10px 14px',
    color: '#c8a870',
    fontSize: '14px',
    resize: 'none',
    fontFamily: "'Inter', sans-serif",
    lineHeight: '1.5',
    maxHeight: '120px',
    overflowY: 'auto',
  },
  sendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#150f08',
    border: '1.5px solid #7a4a1a',
    color: '#c87a30',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: '1px',
    transition: 'all 0.2s ease',
    fontFamily: 'sans-serif',
  },
}

export default App