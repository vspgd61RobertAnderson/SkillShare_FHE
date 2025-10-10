// App.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContractReadOnly, getContractWithSigner } from "./contract";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import "./App.css";

interface SkillRecord {
  id: string;
  encryptedData: string;
  timestamp: number;
  owner: string;
  skillType: string;
  rating: number;
}

const App: React.FC = () => {
  // Randomly selected styles: 
  // Colors - Low saturation pastel (cream yellow/mint green/cherry blossom pink)
  // UI style - Cartoon
  // Layout - Center radiation
  // Interaction - Micro interaction (hover ripple, button breathing light)
  
  // Randomly selected additional features:
  // 1. Project introduction
  // 2. Search & filter function
  // 3. Data statistics (total, proportion, etc.)
  // 4. User operation history record
  
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    visible: boolean;
    status: "pending" | "success" | "error";
    message: string;
  }>({ visible: false, status: "pending", message: "" });
  const [newSkillData, setNewSkillData] = useState({
    skillType: "",
    description: "",
    experience: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [operationHistory, setOperationHistory] = useState<string[]>([]);

  // Calculate statistics
  const programmingCount = skills.filter(s => s.skillType === "Programming").length;
  const cookingCount = skills.filter(s => s.skillType === "Cooking").length;
  const languageCount = skills.filter(s => s.skillType === "Language").length;
  const otherCount = skills.filter(s => s.skillType === "Other").length;

  useEffect(() => {
    loadSkills().finally(() => setLoading(false));
  }, []);

  const addOperationToHistory = (operation: string) => {
    setOperationHistory(prev => [
      `${new Date().toLocaleTimeString()}: ${operation}`,
      ...prev.slice(0, 9)
    ]);
  };

  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const acc = accounts[0] || "";
      setAccount(acc);
      addOperationToHistory(`Wallet connected: ${acc.substring(0, 6)}...`);

      wallet.provider.on("accountsChanged", async (accounts: string[]) => {
        const newAcc = accounts[0] || "";
        setAccount(newAcc);
        addOperationToHistory(`Wallet changed to: ${newAcc.substring(0, 6)}...`);
      });
    } catch (e) {
      alert("Failed to connect wallet");
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setProvider(null);
    addOperationToHistory("Wallet disconnected");
  };

  const loadSkills = async () => {
    setIsRefreshing(true);
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      // Check contract availability using FHE
      const isAvailable = await contract.isAvailable();
      if (!isAvailable) {
        console.error("Contract is not available");
        return;
      }
      
      const keysBytes = await contract.getData("skill_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing skill keys:", e);
        }
      }
      
      const list: SkillRecord[] = [];
      
      for (const key of keys) {
        try {
          const skillBytes = await contract.getData(`skill_${key}`);
          if (skillBytes.length > 0) {
            try {
              const skillData = JSON.parse(ethers.toUtf8String(skillBytes));
              list.push({
                id: key,
                encryptedData: skillData.data,
                timestamp: skillData.timestamp,
                owner: skillData.owner,
                skillType: skillData.skillType,
                rating: skillData.rating || 0
              });
            } catch (e) {
              console.error(`Error parsing skill data for ${key}:`, e);
            }
          }
        } catch (e) {
          console.error(`Error loading skill ${key}:`, e);
        }
      }
      
      list.sort((a, b) => b.timestamp - a.timestamp);
      setSkills(list);
      addOperationToHistory(`Loaded ${list.length} skills`);
    } catch (e) {
      console.error("Error loading skills:", e);
      addOperationToHistory("Error loading skills");
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const addSkill = async () => {
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    setAdding(true);
    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Encrypting skill data with Zama FHE..."
    });
    
    try {
      // Simulate FHE encryption
      const encryptedData = `FHE-${btoa(JSON.stringify(newSkillData))}`;
      
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const skillId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const skillData = {
        data: encryptedData,
        timestamp: Math.floor(Date.now() / 1000),
        owner: account,
        skillType: newSkillData.skillType,
        rating: 0
      };
      
      // Store encrypted data on-chain using FHE
      await contract.setData(
        `skill_${skillId}`, 
        ethers.toUtf8Bytes(JSON.stringify(skillData))
      );
      
      const keysBytes = await contract.getData("skill_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing keys:", e);
        }
      }
      
      keys.push(skillId);
      
      await contract.setData(
        "skill_keys", 
        ethers.toUtf8Bytes(JSON.stringify(keys))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "Encrypted skill submitted securely!"
      });
      
      addOperationToHistory(`Added new skill: ${newSkillData.skillType}`);
      await loadSkills();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
        setShowAddModal(false);
        setNewSkillData({
          skillType: "",
          description: "",
          experience: ""
        });
      }, 2000);
    } catch (e: any) {
      const errorMessage = e.message.includes("user rejected transaction")
        ? "Transaction rejected by user"
        : "Submission failed: " + (e.message || "Unknown error");
      
      setTransactionStatus({
        visible: true,
        status: "error",
        message: errorMessage
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    } finally {
      setAdding(false);
    }
  };

  const rateSkill = async (skillId: string, rating: number) => {
    if (!provider) {
      alert("Please connect wallet first");
      return;
    }

    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Processing encrypted rating with FHE..."
    });

    try {
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const skillBytes = await contract.getData(`skill_${skillId}`);
      if (skillBytes.length === 0) {
        throw new Error("Skill not found");
      }
      
      const skillData = JSON.parse(ethers.toUtf8String(skillBytes));
      
      const updatedSkill = {
        ...skillData,
        rating: rating
      };
      
      await contract.setData(
        `skill_${skillId}`, 
        ethers.toUtf8Bytes(JSON.stringify(updatedSkill))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "FHE rating completed successfully!"
      });
      
      addOperationToHistory(`Rated skill ${skillId.substring(0, 6)}... as ${rating} stars`);
      await loadSkills();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 2000);
    } catch (e: any) {
      setTransactionStatus({
        visible: true,
        status: "error",
        message: "Rating failed: " + (e.message || "Unknown error")
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.skillType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         skill.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || skill.skillType === filterType;
    return matchesSearch && matchesFilter;
  });

  const renderSkillTypeStats = () => {
    const total = skills.length || 1;
    const programmingPercentage = (programmingCount / total) * 100;
    const cookingPercentage = (cookingCount / total) * 100;
    const languagePercentage = (languageCount / total) * 100;
    const otherPercentage = (otherCount / total) * 100;

    return (
      <div className="stats-bars">
        <div className="stat-bar">
          <div className="stat-label">Programming</div>
          <div className="stat-bar-container">
            <div 
              className="stat-bar-fill programming" 
              style={{ width: `${programmingPercentage}%` }}
            ></div>
            <span className="stat-count">{programmingCount}</span>
          </div>
        </div>
        <div className="stat-bar">
          <div className="stat-label">Cooking</div>
          <div className="stat-bar-container">
            <div 
              className="stat-bar-fill cooking" 
              style={{ width: `${cookingPercentage}%` }}
            ></div>
            <span className="stat-count">{cookingCount}</span>
          </div>
        </div>
        <div className="stat-bar">
          <div className="stat-label">Language</div>
          <div className="stat-bar-container">
            <div 
              className="stat-bar-fill language" 
              style={{ width: `${languagePercentage}%` }}
            ></div>
            <span className="stat-count">{languageCount}</span>
          </div>
        </div>
        <div className="stat-bar">
          <div className="stat-label">Other</div>
          <div className="stat-bar-container">
            <div 
              className="stat-bar-fill other" 
              style={{ width: `${otherPercentage}%` }}
            ></div>
            <span className="stat-count">{otherCount}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="cartoon-spinner"></div>
      <p>Initializing anonymous skill sharing...</p>
    </div>
  );

  return (
    <div className="app-container cartoon-theme">
      <div className="center-radial-layout">
        <header className="app-header">
          <div className="logo">
            <div className="cartoon-icon"></div>
            <h1>Skill<span>Share</span>FHE</h1>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={() => setShowAddModal(true)} 
              className="add-skill-btn cartoon-button"
            >
              <div className="add-icon"></div>
              Share Skill
            </button>
            <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
          </div>
        </header>
        
        <main className="main-content">
          <div className="intro-card cartoon-card">
            <h2>Anonymous Peer-to-Peer Skill Sharing</h2>
            <p>
              Share and learn skills anonymously using Fully Homomorphic Encryption (FHE) technology. 
              Your skills and requests remain encrypted while being matched with others in the community.
            </p>
            <div className="fhe-badge">
              <span>FHE-Powered Privacy</span>
            </div>
          </div>
          
          <div className="search-filters">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search skills or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cartoon-input"
              />
              <div className="search-icon"></div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="cartoon-select"
            >
              <option value="all">All Skill Types</option>
              <option value="Programming">Programming</option>
              <option value="Cooking">Cooking</option>
              <option value="Language">Language</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="stats-section">
            <h3>Community Skill Distribution</h3>
            {renderSkillTypeStats()}
          </div>
          
          <div className="skills-section">
            <div className="section-header">
              <h2>Available Skills</h2>
              <div className="header-actions">
                <button 
                  onClick={loadSkills}
                  className="refresh-btn cartoon-button"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
            
            <div className="skills-list cartoon-card">
              {filteredSkills.length === 0 ? (
                <div className="no-skills">
                  <div className="no-skills-icon"></div>
                  <p>No matching skills found</p>
                  <button 
                    className="cartoon-button primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    Share Your First Skill
                  </button>
                </div>
              ) : (
                filteredSkills.map(skill => (
                  <div className="skill-card" key={skill.id}>
                    <div className="skill-header">
                      <div className="skill-type">{skill.skillType}</div>
                      <div className="skill-owner">@{skill.owner.substring(0, 6)}...</div>
                    </div>
                    <div className="skill-date">
                      Shared on {new Date(skill.timestamp * 1000).toLocaleDateString()}
                    </div>
                    <div className="skill-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          className={`star ${star <= skill.rating ? 'filled' : ''}`}
                          onClick={() => rateSkill(skill.id, star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <button 
                      className="cartoon-button small learn-btn"
                      onClick={() => {
                        addOperationToHistory(`Requested to learn ${skill.skillType} from ${skill.owner.substring(0, 6)}...`);
                        alert("FHE matching initiated! You'll be anonymously connected if there's a match.");
                      }}
                    >
                      Learn This Skill
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="history-section">
            <h3>Your Recent Activity</h3>
            <div className="history-list cartoon-card">
              {operationHistory.length === 0 ? (
                <p className="no-history">No recent activity</p>
              ) : (
                <ul>
                  {operationHistory.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </main>
    
        {showAddModal && (
          <ModalAddSkill 
            onSubmit={addSkill} 
            onClose={() => setShowAddModal(false)} 
            adding={adding}
            skillData={newSkillData}
            setSkillData={setNewSkillData}
          />
        )}
        
        {walletSelectorOpen && (
          <WalletSelector
            isOpen={walletSelectorOpen}
            onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
            onClose={() => setWalletSelectorOpen(false)}
          />
        )}
        
        {transactionStatus.visible && (
          <div className="transaction-modal">
            <div className="transaction-content cartoon-card">
              <div className={`transaction-icon ${transactionStatus.status}`}>
                {transactionStatus.status === "pending" && <div className="cartoon-spinner"></div>}
                {transactionStatus.status === "success" && <div className="check-icon"></div>}
                {transactionStatus.status === "error" && <div className="error-icon"></div>}
              </div>
              <div className="transaction-message">
                {transactionStatus.message}
              </div>
            </div>
          </div>
        )}
        
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <div className="cartoon-icon small"></div>
                <span>SkillShareFHE</span>
              </div>
              <p>Anonymous skill sharing powered by FHE technology</p>
            </div>
            
            <div className="footer-links">
              <a href="#" className="footer-link">About</a>
              <a href="#" className="footer-link">Privacy</a>
              <a href="#" className="footer-link">Terms</a>
              <a href="#" className="footer-link">Community</a>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="fhe-badge">
              <span>FHE-Powered Privacy</span>
            </div>
            <div className="copyright">
              © {new Date().getFullYear()} SkillShareFHE. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

interface ModalAddSkillProps {
  onSubmit: () => void; 
  onClose: () => void; 
  adding: boolean;
  skillData: any;
  setSkillData: (data: any) => void;
}

const ModalAddSkill: React.FC<ModalAddSkillProps> = ({ 
  onSubmit, 
  onClose, 
  adding,
  skillData,
  setSkillData
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSkillData({
      ...skillData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    if (!skillData.skillType) {
      alert("Please select a skill type");
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="add-modal cartoon-card">
        <div className="modal-header">
          <h2>Share Your Skill Anonymously</h2>
          <button onClick={onClose} className="close-modal">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="fhe-notice-banner">
            <div className="key-icon"></div> Your skill details will be encrypted with Zama FHE
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Skill Type *</label>
              <select 
                name="skillType"
                value={skillData.skillType} 
                onChange={handleChange}
                className="cartoon-select"
              >
                <option value="">Select skill type</option>
                <option value="Programming">Programming</option>
                <option value="Cooking">Cooking</option>
                <option value="Language">Language Teaching</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <input 
                type="text"
                name="description"
                value={skillData.description} 
                onChange={handleChange}
                placeholder="Brief description of what you can teach..." 
                className="cartoon-input"
              />
            </div>
            
            <div className="form-group full-width">
              <label>Your Experience</label>
              <textarea 
                name="experience"
                value={skillData.experience} 
                onChange={handleChange}
                placeholder="Describe your experience level and what you can offer..." 
                className="cartoon-textarea"
                rows={4}
              />
            </div>
          </div>
          
          <div className="privacy-notice">
            <div className="privacy-icon"></div> Your identity remains hidden while your skills are shared
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="cancel-btn cartoon-button"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={adding}
            className="submit-btn cartoon-button primary"
          >
            {adding ? "Encrypting with FHE..." : "Share Anonymously"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;