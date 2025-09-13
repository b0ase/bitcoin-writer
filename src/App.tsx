import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import DocumentEditor from './components/DocumentEditor';
import DocumentSidebar from './components/DocumentSidebar';
import Login from './components/Login';
import HandCashCallback from './components/HandCashCallback';
import { BlockchainDocumentService, BlockchainDocument } from './services/BlockchainDocumentService';
import { HandCashService, HandCashUser } from './services/HandCashService';

function App() {
  const [documentService, setDocumentService] = useState<BlockchainDocumentService | null>(null);
  const [handcashService] = useState<HandCashService>(new HandCashService());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<HandCashUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDocument, setCurrentDocument] = useState<BlockchainDocument | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBitcoinMenu, setShowBitcoinMenu] = useState(false);
  const [showWriterMenu, setShowWriterMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're coming back from HandCash with an authToken
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    
    // Check multiple possible parameter names HandCash might use
    const authToken = urlParams.get('authToken') || 
                     urlParams.get('auth_token') || 
                     urlParams.get('access_token') || 
                     urlParams.get('token') ||
                     hashParams.get('authToken') ||
                     hashParams.get('auth_token') ||
                     hashParams.get('access_token') ||
                     hashParams.get('token');
    
    console.log('=== App Initialization ===');
    console.log('HandCash App ID:', process.env.REACT_APP_HANDCASH_APP_ID ? 'Configured' : 'NOT CONFIGURED');
    console.log('Current URL:', window.location.href);
    console.log('URL params:', Array.from(urlParams.entries()));
    console.log('Hash params:', Array.from(hashParams.entries()));
    console.log('Auth token found:', authToken ? 'Yes' : 'No');
    
    if (authToken) {
      // We have an authToken, handle the callback
      console.log('Found authToken, handling callback...');
      const handcashService = new HandCashService();
      handcashService.handleCallback(authToken).then(user => {
        console.log('Callback processed, user:', user);
        handleLogin(user);
        // Clean up URL after successful auth
        window.history.replaceState({}, document.title, window.location.pathname);
      }).catch(err => {
        console.error('Failed to handle callback:', err);
        alert('HandCash authentication failed. Please try again.');
      });
    } else {
      // Check existing authentication
      checkAuthentication();
    }
  }, []);

  const checkAuthentication = () => {
    // Check if user is already logged in
    if (handcashService.isAuthenticated()) {
      const user = handcashService.getCurrentUser();
      setCurrentUser(user);
      setIsAuthenticated(true);
      initializeDocumentService();
    }
    setIsLoading(false);
  };

  const initializeDocumentService = async () => {
    const service = new BlockchainDocumentService(handcashService);
    await service.reconnect();
    setDocumentService(service);
  };

  const handleLogin = (user: HandCashUser) => {
    console.log('=== User Successfully Authenticated ===');
    console.log('User handle:', user.handle);
    console.log('User paymail:', user.paymail);
    console.log('=====================================');
    setCurrentUser(user);
    setIsAuthenticated(true);
    initializeDocumentService();
  };

  const handleLogout = () => {
    console.log('=== COMPLETE LOGOUT ===');
    
    // Use HandCash service logout
    handcashService.logout();
    
    // Clear EVERYTHING
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Reset state
    setIsAuthenticated(false);
    setCurrentUser(null);
    setDocumentService(null);
    setCurrentDocument(null);
    
    console.log('Logout complete - refreshing page...');
    
    // Force hard reload to clear all memory
    setTimeout(() => {
      window.location.replace('/');
    }, 100);
  };

  return (
    <Routes>
      <Route path="/auth/handcash/callback" element={<HandCashCallback />} />
      <Route path="/*" element={
        isLoading ? (
          <div className="App">
            <div className="loading">Loading Bitcoin Writer...</div>
          </div>
        ) : (
          <div className="App">
            {/* macOS-style taskbar */}
            <div className="taskbar">
              <div className="taskbar-left">
                <div className="bitcoin-menu-container">
                  <button 
                    className="bitcoin-logo-button"
                    onClick={() => setShowBitcoinMenu(!showBitcoinMenu)}
                    aria-label="Bitcoin Menu"
                  >
                    <div className="bitcoin-logo">
                      <span className="bitcoin-symbol">₿</span>
                    </div>
                  </button>
                  {showBitcoinMenu && (
                    <>
                      <div className="menu-overlay" onClick={() => setShowBitcoinMenu(false)} />
                      <div className="bitcoin-menu">
                        <div className="menu-header">
                          <div className="bitcoin-logo-small">₿</div>
                          <span>Bitcoin Writer</span>
                        </div>
                        <div className="menu-separator" />
                        <div className="menu-item" onClick={() => {
                          alert('Bitcoin Writer v1.0\n\nSecure blockchain document writing platform\n\n© 2024 Bitcoin Writer\nBuilt on Bitcoin SV blockchain');
                          setShowBitcoinMenu(false);
                        }}>
                          <span>ℹ️</span> About Bitcoin Writer
                        </div>
                        <div className="menu-separator" />
                        {isAuthenticated && (
                          <div className="menu-item" onClick={() => {
                            handleLogout();
                            setShowBitcoinMenu(false);
                          }}>
                            <span>🚪</span> Sign Out
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="writer-menu-container">
                  <button 
                    className="writer-menu-button"
                    onClick={() => setShowWriterMenu(!showWriterMenu)}
                    aria-label="Writer Menu"
                  >
                    Bitcoin Writer
                  </button>
                  {showWriterMenu && (
                    <>
                      <div className="menu-overlay" onClick={() => setShowWriterMenu(false)} />
                      <div className="writer-menu">
                        <div className="menu-item" onClick={() => {
                          // TODO: Implement Open
                          alert('Open functionality coming soon');
                          setShowWriterMenu(false);
                        }}>
                          <span>📂</span> Open
                        </div>
                        <div className="menu-item" onClick={() => {
                          // TODO: Implement Save
                          (document.querySelector('.save-btn-mobile, [title*="Save"]') as HTMLElement)?.click();
                          setShowWriterMenu(false);
                        }}>
                          <span>💾</span> Save
                        </div>
                        <div className="menu-item" onClick={() => {
                          // TODO: Implement Save As
                          alert('Save As functionality coming soon');
                          setShowWriterMenu(false);
                        }}>
                          <span>📋</span> Save As
                        </div>
                        <div className="menu-separator" />
                        <div className="menu-item" onClick={() => {
                          // TODO: Implement Encrypt
                          (document.querySelector('[title*="Encrypt"]') as HTMLElement)?.click();
                          setShowWriterMenu(false);
                        }}>
                          <span>🔒</span> Encrypt
                        </div>
                        <div className="menu-item" onClick={() => {
                          // TODO: Implement Decrypt
                          (document.querySelector('[title*="Decrypt"]') as HTMLElement)?.click();
                          setShowWriterMenu(false);
                        }}>
                          <span>🔓</span> Decrypt
                        </div>
                        <div className="menu-separator" />
                        <div className="menu-item" onClick={() => {
                          // TODO: Implement Tokenize
                          alert('Tokenize functionality coming soon');
                          setShowWriterMenu(false);
                        }}>
                          <span>🎨</span> Tokenize
                        </div>
                        <div className="menu-item" onClick={() => {
                          // TODO: Implement Paywall
                          (document.querySelector('[title*="Set price"]') as HTMLElement)?.click();
                          setShowWriterMenu(false);
                        }}>
                          <span>💰</span> Paywall
                        </div>
                        <div className="menu-item" onClick={() => {
                          // TODO: Implement Publish
                          (document.querySelector('[title*="Publish"]') as HTMLElement)?.click();
                          setShowWriterMenu(false);
                        }}>
                          <span>🌍</span> Publish
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="taskbar-center">
                {/* Window controls area */}
              </div>
              <div className="taskbar-right">
                <a 
                  href="https://x.com/BitcoinSheets" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="taskbar-link"
                  aria-label="Follow on X"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <header className="App-header">
              <div className="connection-indicator" style={{ 
                backgroundColor: isAuthenticated ? '#44ff44' : '#888' 
              }} />
              
              <button 
                className="mobile-menu-toggle"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Toggle menu"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>

              <h1><span style={{color: '#ff9500'}}>Bitcoin</span> Writer</h1>
              <p className="app-subtitle">Secure, Encrypted Documents on the Blockchain</p>
              
              {/* Desktop user info (top right) */}
              <div className="user-info desktop-user-info">
                {isAuthenticated ? (
                  <div className="user-dropdown-container">
                    <div 
                      className="handcash-badge clickable"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                      <span className="handcash-logo">HandCash</span>
                      <span className="user-handle">@{currentUser?.handle}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    
                    {showUserDropdown && (
                      <div className="user-dropdown">
                        <div className="dropdown-header">
                          <div className="user-info-detailed">
                            <div className="user-handle-large">@{currentUser?.handle}</div>
                            <div className="user-paymail">{currentUser?.paymail}</div>
                          </div>
                        </div>
                        <div className="dropdown-divider"></div>
                        <button 
                          className="dropdown-item logout-item" 
                          onClick={() => {
                            handleLogout();
                            setShowUserDropdown(false);
                          }}
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="login-btn" onClick={() => handcashService.login()}>
                    Sign in with HandCash
                  </button>
                )}
              </div>

              {/* Mobile user info (below title) */}
              <div className="mobile-user-info">
                {isAuthenticated ? (
                  <div className="mobile-auth-section">
                    <div className="user-dropdown-container mobile-dropdown-container">
                      <div 
                        className="handcash-badge clickable"
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                      >
                        <span className="handcash-logo">HandCash</span>
                        <span className="user-handle">@{currentUser?.handle}</span>
                        <span className="dropdown-arrow">▼</span>
                      </div>
                      
                      {showUserDropdown && (
                        <div className="user-dropdown mobile-user-dropdown">
                          <div className="dropdown-header">
                            <div className="user-info-detailed">
                              <div className="user-handle-large">@{currentUser?.handle}</div>
                              <div className="user-paymail">{currentUser?.paymail}</div>
                            </div>
                          </div>
                          <div className="dropdown-divider"></div>
                          <button 
                            className="dropdown-item logout-item" 
                            onClick={() => {
                              handleLogout();
                              setShowUserDropdown(false);
                            }}
                          >
                            🚪 Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mobile-login-section">
                    <button className="login-btn" onClick={() => handcashService.login()}>
                      Sign in with HandCash
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* Click overlay to close dropdowns */}
            {(showUserDropdown || showMobileMenu || showBitcoinMenu || showWriterMenu) && (
              <div 
                className="overlay" 
                onClick={() => {
                  setShowUserDropdown(false);
                  setShowMobileMenu(false);
                  setShowBitcoinMenu(false);
                  setShowWriterMenu(false);
                }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: showMobileMenu ? 999 : 100,
                  background: showMobileMenu ? 'rgba(0, 0, 0, 0.8)' : 'transparent'
                }}
              />
            )}

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
              <div className="mobile-menu-overlay">
                <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="mobile-menu-header">
                    <h3>Platform Features</h3>
                    <button 
                      className="close-mobile-menu"
                      onClick={() => setShowMobileMenu(false)}
                      aria-label="Close menu"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="mobile-menu-content">
                    {isAuthenticated && (
                      <>
                        <div className="mobile-menu-section">
                          <h4>My Documents</h4>
                          <button 
                            className="mobile-menu-item"
                            onClick={() => {
                              setCurrentDocument(null);
                              setShowMobileMenu(false);
                            }}
                          >
                            📄 New Document
                          </button>
                          <DocumentSidebar
                            documentService={documentService}
                            isAuthenticated={isAuthenticated}
                            onDocumentSelect={(doc) => {
                              setCurrentDocument(doc);
                              setShowMobileMenu(false);
                            }}
                            onNewDocument={() => {
                              setCurrentDocument(null);
                              setShowMobileMenu(false);
                            }}
                            currentDocumentId={currentDocument?.id}
                            isMobile={true}
                          />
                        </div>

                        <div className="mobile-menu-section">
                          <h4>Document Actions</h4>
                          <button className="mobile-menu-item">
                            💾 Save to Blockchain
                          </button>
                          <button className="mobile-menu-item">
                            🌍 Publish Document
                          </button>
                        </div>

                        <div className="mobile-menu-section">
                          <h4>Security & Monetization</h4>
                          <button className="mobile-menu-item">
                            🔒 Encrypt Document
                          </button>
                          <button className="mobile-menu-item">
                            💰 Set Price to Unlock
                          </button>
                          <button className="mobile-menu-item">
                            🎨 Create NFT
                          </button>
                          <button className="mobile-menu-item">
                            📈 Issue File Shares
                          </button>
                        </div>

                        <div className="mobile-menu-section">
                          <h4>Blockchain Storage</h4>
                          <button className="mobile-menu-item">
                            ⚡ OP_RETURN (Fast)
                          </button>
                          <button className="mobile-menu-item">
                            🔐 OP_PUSHDATA4 (Secure)
                          </button>
                          <button className="mobile-menu-item">
                            🧩 Multisig P2SH
                          </button>
                        </div>
                      </>
                    )}

                    <div className="mobile-menu-section">
                      <h4>Help & Info</h4>
                      <button className="mobile-menu-item">
                        ❓ How It Works
                      </button>
                      <button className="mobile-menu-item">
                        💡 Storage Options Guide
                      </button>
                      <button className="mobile-menu-item">
                        📊 Pricing Calculator
                      </button>
                    </div>

                    {!isAuthenticated && (
                      <div className="mobile-menu-section">
                        <button 
                          className="mobile-menu-login"
                          onClick={() => {
                            handcashService.login();
                            setShowMobileMenu(false);
                          }}
                        >
                          🔑 Sign in with HandCash
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="app-container">
              <DocumentSidebar
                documentService={documentService}
                isAuthenticated={isAuthenticated}
                onDocumentSelect={(doc) => setCurrentDocument(doc)}
                onNewDocument={() => setCurrentDocument(null)}
                currentDocumentId={currentDocument?.id}
              />
              <main>
                <DocumentEditor 
                  documentService={documentService} 
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={() => handcashService.login()}
                  currentDocument={currentDocument}
                  onDocumentUpdate={(doc) => setCurrentDocument(doc)}
                />
              </main>
            </div>
          </div>
        )
      } />
    </Routes>
  );
}

export default App;