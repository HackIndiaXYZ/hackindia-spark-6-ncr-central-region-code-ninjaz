🤖 AgentHire
Get interviewed by AI. Earn a blockchain certificate. Get hired.

AgentHire is a next-generation hiring platform that replaces the broken resume process with live AI interviews and on-chain verified skill credentials — built for Hackathon 2026 by Team Code Ninjaz.

🚀 The Problem
Traditional hiring is broken:

📄 Fake Resumes — skills are self-reported and unverifiable
⏳ Weeks of Waiting — candidates apply and hear nothing for weeks
🎯 Wrong Hires — interviews test how well you answer, not whether you can actually do the job
Hiring is a $500B industry — and it's still broken.

✅ The Solution
AgentHire replaces the entire resume-to-interview process with one clean flow:

Company deploys AI agent → Candidate chats → AI scores live → Score minted on Polygon
🏢 A company sets up an AI hiring agent for a role in minutes
💬 Candidate enters the interview room — no CV needed, just chat
🎯 The AI agent gives 3 progressive, role-specific challenges
📊 Claude API evaluates and scores across Relevance, Creativity & Depth
⛓ Score is minted as an NFT on the Polygon blockchain
🏆 Companies browse a verified leaderboard and reach out directly
✨ Features
Feature	Description
🤖 AI Interview Agent	Adaptive, role-specific challenges powered by Claude API
📊 Real-time Scoring	Evaluated across Relevance, Creativity, and Depth (0–100)
⛓ On-Chain Certificate	Score minted as an ERC-721 NFT on Polygon Mumbai
🏪 Candidate Marketplace	Leaderboard of blockchain-verified top performers
🏢 Company Dashboard	Deploy hiring agents and browse verified candidates
🎮 Gamified Flow	XP-style progressive challenges make skill-proving engaging
🛠 Tech Stack
Layer	Technology
Frontend	React + Tailwind CSS
AI Brain	Claude API (Anthropic)
Blockchain	Polygon Mumbai Testnet + ethers.js
NFT Standard	ERC-721 (OpenZeppelin)
Backend	Firebase (real-time database)
🏗 Architecture
┌─────────────────────────────────────────────────────┐
│                   AgentHire App                     │
├───────────────┬─────────────────┬───────────────────┤
│  Company Side │  Interview Room │  Candidate Side   │
│               │                 │                   │
│ Deploy Agent  │  Claude API     │  Leaderboard      │
│ Set Role      │  Live Chat      │  NFT Certificate  │
│ Browse Top    │  Scoring Engine │  Profile Page     │
│ Candidates    │  3 Challenges   │                   │
└───────────────┴────────┬────────┴───────────────────┘
                         │
                ┌────────▼────────┐
                │ Polygon Mumbai  │
                │ ERC-721 NFT     │
                │ Score + Role +  │
                │ Timestamp       │
                └─────────────────┘
🚀 Getting Started
Prerequisites
Node.js v18+
npm or yarn
MetaMask wallet (for Polygon testnet)
Anthropic API key
Firebase project
Installation
# Clone the repository
git clone https://github.com/your-username/agenthire.git
cd agenthire

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
Environment Variables
Create a .env file in the root directory:

REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
REACT_APP_CONTRACT_ADDRESS=your_deployed_contract_address
Run Locally
npm start
App runs at http://localhost:3000

📁 Project Structure
agenthire/
├── public/
├── src/
│   ├── components/
│   │   ├── Home/              # Landing page
│   │   ├── InterviewRoom/     # AI chat interface
│   │   ├── Certificate/       # NFT minting page
│   │   └── Leaderboard/       # Candidate marketplace
│   ├── hooks/
│   │   ├── useClaudeAgent.js  # Claude API integration
│   │   └── usePolygon.js      # Blockchain interactions
│   ├── contracts/
│   │   └── SkillCert.sol      # ERC-721 NFT contract
│   ├── firebase/
│   │   └── config.js          # Firebase setup
│   └── App.js
├── .env.example
├── package.json
└── README.md
⛓ Smart Contract
The SkillCert contract is an ERC-721 NFT that stores:

Candidate address
Role applied for
Company name
Score (0–100)
Timestamp
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SkillCert is ERC721 {
    struct Certificate {
        string role;
        string company;
        uint8 score;
        uint256 timestamp;
    }

    mapping(uint256 => Certificate) public certificates;
    uint256 private _tokenIds;

    constructor() ERC721("SkillCert", "SCRT") {}

    function mintCertificate(
        address candidate,
        string memory role,
        string memory company,
        uint8 score
    ) public returns (uint256) {
        _tokenIds++;
        _mint(candidate, _tokenIds);
        certificates[_tokenIds] = Certificate(role, company, score, block.timestamp);
        return _tokenIds;
    }
}
Deploy to Polygon Mumbai:

npx hardhat run scripts/deploy.js --network mumbai
🎯 Hackathon Tracks Covered
Track	How AgentHire qualifies
🤖 AI Agents Marketplace	Hiring agents are deployable, discoverable, and fully autonomous
⛓ Polygon On-Chain Skills	Every score is an immutable, verifiable NFT on Polygon
🎮 Gamified Learning	Progressive challenges with real-time scoring
🗺 Roadmap
 AI interview agent with Claude API
 Real-time scoring engine
 Polygon NFT minting (testnet)
 Candidate leaderboard
 Polygon mainnet deployment
 Multi-role support per company
 Candidate profile pages
 Company analytics dashboard
 Mobile app (React Native)
📄 License
MIT License — see LICENSE for details.

The future of hiring isn't a resume. It's a conversation.

Built with ❤️ by Team Code Ninjaz at Hackathon 2026
